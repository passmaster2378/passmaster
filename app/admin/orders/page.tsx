import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { setOrderStatus } from "./actions";

export const metadata = {
  title: "관리자 주문 승인 | PassMaster",
};

function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

export default async function AdminOrdersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  const missingProfilesTable =
    profileError && String((profileError as { code?: string }).code) === "42P01";

  if (missingProfilesTable) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">profiles</span> 테이블이 필요해요.
          Supabase SQL Editor에서 <span className="font-semibold">supabase/profiles.sql</span>을 먼저 실행해 주세요.
        </div>
      </section>
    );
  }

  if (!profile?.is_admin) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          관리자만 접근할 수 있어요.
        </div>
        <div className="text-sm text-slate-600">
          <Link className="font-semibold text-blue-700 hover:underline" href="/mypage">
            마이페이지로 돌아가기
          </Link>
        </div>
      </section>
    );
  }

  let ordersTableMissing = false;
  let ordersLoadError = "";
  const ordersRes = await supabase
    .from("orders")
    .select("id,user_id,depositor_name,amount,currency,method,status,memo,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (ordersRes.error) {
    if (String((ordersRes.error as { code?: string }).code) === "42P01") {
      ordersTableMissing = true;
    } else {
      ordersLoadError = ordersRes.error.message;
    }
  }

  const orders = (ordersRes.data ?? []) as Array<{
    id: string;
    user_id: string;
    depositor_name: string;
    amount: number;
    currency: string;
    method: string;
    status: "pending" | "paid" | "cancelled" | "rejected";
    memo: string | null;
    created_at: string;
  }>;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              관리자 주문 승인
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              무통장 입금 신청을 확인하고 승인/거절할 수 있어요.
            </p>
          </div>
          <Link
            href="/billing"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            결제/입금으로
          </Link>
        </div>
      </div>

      {ordersTableMissing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">orders</span> 테이블이 없어요. Supabase SQL
          Editor에서 <span className="font-semibold">supabase/orders.sql</span>을 실행해 주세요.
        </div>
      ) : ordersLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          주문 목록을 불러오지 못했어요:{" "}
          <span className="font-semibold">{ordersLoadError}</span>
          <div className="mt-2 text-xs text-red-800">
            보통 <span className="font-semibold">supabase/admin.sql</span> 미실행 또는{" "}
            <span className="font-semibold">profiles.is_admin</span> 설정 문제입니다.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">대기 중인 신청이 없어요.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {orders.map((o) => (
                <li key={o.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold text-slate-900">
                        {formatKrw(o.amount)}원 · {o.depositor_name}{" "}
                        <span className="text-xs font-medium text-slate-600">
                          ({o.status})
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        user_id: <span className="font-mono">{o.user_id}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(o.created_at).toLocaleString("ko-KR")}
                        {o.memo ? ` · ${o.memo}` : ""}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <form action={async () => setOrderStatus(o.id, "paid")}>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
                        >
                          승인
                        </button>
                      </form>
                      <form action={async () => setOrderStatus(o.id, "rejected")}>
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800"
                        >
                          거절
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

