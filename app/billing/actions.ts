"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase/server";

export type OrderRow = {
  id: string;
  depositor_name: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "paid" | "cancelled" | "rejected";
  memo: string | null;
  created_at: string;
};

export async function listMyOrders(): Promise<OrderRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,depositor_name,amount,currency,method,status,memo,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as OrderRow[];
}

async function getDefaultDepositorName(userId: string) {
  const supabase = await createSupabaseServerClient();
  const res = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (res.error) {
    if (String((res.error as { code?: string }).code) === "42P01") return "";
    throw new Error(res.error.message);
  }
  return (res.data?.full_name ?? "").trim();
}

export async function createBankTransferOrder(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const amount = Number(formData.get("amount") ?? 0);
  const memo = String(formData.get("memo") ?? "").trim();
  const depositorInput = String(formData.get("depositor_name") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("금액을 올바르게 입력해 주세요.");
  }

  const defaultName = await getDefaultDepositorName(user.id);
  const depositor_name = depositorInput || defaultName;
  if (!depositor_name) {
    throw new Error("입금자명을 입력해 주세요. (마이페이지에서 이름 저장 후 자동 입력도 가능)");
  }

  const { error } = await supabase.from("orders").insert({
    user_id: user.id,
    depositor_name,
    amount,
    currency: "KRW",
    method: "bank_transfer",
    status: "pending",
    memo: memo || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/billing");
  revalidatePath("/mypage");
}

