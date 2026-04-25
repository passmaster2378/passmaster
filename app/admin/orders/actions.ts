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

  return supabase;
}

export async function listAllOrders(): Promise<AdminOrderRow[]> {
  const supabase = await assertAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("id,user_id,depositor_name,amount,currency,method,status,memo,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as AdminOrderRow[];
}

export async function setOrderStatus(id: string, status: AdminOrderRow["status"]) {
  const supabase = await assertAdmin();
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
    const plan_expires_at = new Date();
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
  }

  revalidatePath("/admin/orders");
  revalidatePath("/billing");
  revalidatePath("/vault");
  revalidatePath("/mypage");
}

