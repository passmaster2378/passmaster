import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import type { OrderRow } from "./actions";
import { BillingClient } from "./BillingClient";

export const metadata = {
  title: "결제/입금 | PassMaster",
};

export default async function BillingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get default depositor name from profile if available.
  const profileRes = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const defaultName =
    profileRes.error ? "" : (profileRes.data?.full_name ?? "").trim();

  let ordersTableMissing = false;
  let orders: OrderRow[] = [];
  const ordersRes = await supabase
    .from("orders")
    .select("id,depositor_name,amount,currency,method,status,memo,created_at")
    .order("created_at", { ascending: false })
    .limit(20);
  if (ordersRes.error) {
    if (String((ordersRes.error as { code?: string }).code) === "42P01") {
      ordersTableMissing = true;
    } else {
      ordersTableMissing = true;
    }
  } else {
    orders = (ordersRes.data ?? []) as OrderRow[];
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              결제/입금
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              무통장 입금 신청을 남기고, 상태를 확인할 수 있어요.
            </p>
          </div>
          <Link
            href="/mypage"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            마이페이지로
          </Link>
        </div>
      </div>

      <BillingClient
        defaultDepositorName={defaultName}
        initialOrders={orders}
        ordersTableMissing={ordersTableMissing}
      />
    </section>
  );
}

