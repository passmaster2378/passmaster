"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export type AdminOrderRow = {
  id: string;
  user_id: string;
  depositor_name: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "paid" | "cancelled" | "rejected";
  memo: string | null;
  created_at: string;
};

async function assertAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.is_admin) throw new Error("Not authorized.");

  return { supabase, actorUserId: user.id };
}

export async function listAllOrders(): Promise<AdminOrderRow[]> {
  const { supabase } = await assertAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,depositor_name,amount,currency,method,status,memo,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminOrderRow[];
}

export async function setOrderStatus(id: string, status: AdminOrderRow["status"]) {
  const { supabase, actorUserId } = await assertAdmin();
  // Fetch order user_id so we can activate plan on approval.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,user_id,status")
    .eq("id", id)
    .maybeSingle();
  if (orderError) throw new Error(orderError.message);
  if (!order?.user_id) throw new Error("Order not found.");

  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  // When paid -> activate pro for 2 months (fast MVP).
  if (status === "paid") {
    // Extend from current expiry if still active; otherwise start from now.
    const currentProfile = await supabase
      .from("profiles")
      .select("plan,plan_expires_at,full_name")
      .eq("user_id", order.user_id)
      .maybeSingle();
    const currentExpiry = currentProfile.error
      ? null
      : (currentProfile.data?.plan_expires_at ?? null);
    const base = currentExpiry ? new Date(currentExpiry) : new Date(0);
    const now = new Date();
    const start = base.getTime() > now.getTime() ? base : now;
    const plan_expires_at = new Date(start);
    plan_expires_at.setMonth(plan_expires_at.getMonth() + 2);

    const { error: planError } = await supabase.from("profiles").upsert(
      {
        user_id: order.user_id,
        plan: "pro",
        plan_expires_at: plan_expires_at.toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (planError) throw new Error(planError.message);

    // In-app notification
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "success",
      title: "결제가 승인됐어요",
      body: `Pro 이용권이 활성화되었습니다. 만료일: ${plan_expires_at.toLocaleDateString("ko-KR")}`,
    });
  }

  if (status === "rejected") {
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "error",
      title: "결제가 거절됐어요",
      body: "입금 정보를 다시 확인해 주세요. 필요하면 메모를 남겨주세요.",
    });
  }

  // Audit log (best-effort)
  await supabase.from("audit_logs").insert({
    actor_user_id: actorUserId,
    action: "set_order_status",
    entity_type: "orders",
    entity_id: id,
    metadata: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/billing");
  revalidatePath("/vault");
  revalidatePath("/mypage");
}

