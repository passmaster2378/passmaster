import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { createBankTransferOrder, listMyOrders } from "./actions";

export const metadata = {
  title: "결제/입금 | PassMaster",
};

function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

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
  let orders: Awaited<ReturnType<typeof listMyOrders>> = [];
  try {
    orders = await listMyOrders();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("relation") && msg.includes("orders")) {
      ordersTableMissing = true;
    } else {
      // ignore; UI will show empty list
    }
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

      {ordersTableMissing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          아직 <span className="font-semibold">orders</span> 테이블이 없어요.
          Supabase SQL Editor에서{" "}
          <span className="font-semibold">supabase/orders.sql</span> 내용을 실행해
          주세요.
        </div>
      ) : null}

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">무통장 입금 신청</h2>
        <p className="mt-1 text-sm text-slate-600">
          입금자명은 마이페이지의 이름과 일치하는 것을 권장해요.
        </p>

        <form action={createBankTransferOrder} className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="amount">
              금액(KRW)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              min={1000}
              step={1000}
              defaultValue={9900}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="depositor_name"
            >
              입금자명
            </label>
            <input
              id="depositor_name"
              name="depositor_name"
              defaultValue={defaultName}
              placeholder="예: 홍길동"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="memo">
              메모(선택)
            </label>
            <textarea
              id="memo"
              name="memo"
              placeholder="예: 1개월 이용권 / 문의사항"
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 sm:col-span-2"
          >
            신청하기
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <h2 className="text-lg font-semibold text-slate-900">내 신청 내역</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">아직 신청 내역이 없어요.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200">
            {orders.map((o) => (
              <li key={o.id} className="py-4 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {formatKrw(o.amount)}원 · {o.depositor_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      상태: <span className="font-medium">{o.status}</span> ·{" "}
                      {new Date(o.created_at).toLocaleString("ko-KR")}
                    </p>
                    {o.memo ? (
                      <p className="mt-2 text-xs text-slate-500">{o.memo}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

