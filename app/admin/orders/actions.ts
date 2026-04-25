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
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
}

