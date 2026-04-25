"use client";

import { useState, useTransition } from "react";
import type { OrderRow } from "./actions";
import { createBankTransferOrder, listMyOrders } from "./actions";

type Props = {
  defaultDepositorName: string;
  initialOrders: OrderRow[];
  ordersTableMissing: boolean;
};

function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

export function BillingClient({
  defaultDepositorName,
  initialOrders,
  ordersTableMissing,
}: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
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
          현재 상품: <span className="font-semibold">9,900원 (2개월 수강)</span>
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            {message}
          </div>
        ) : null}

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            setMessage("");
            const form = e.currentTarget;
            const formData = new FormData(form);
            // fixed plan for now
            formData.set("amount", "9900");
            startTransition(async () => {
              try {
                await createBankTransferOrder(formData);
                const next = await listMyOrders();
                setOrders(next);
                setMessage("신청이 접수됐어요.");
                form.reset();
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "신청에 실패했습니다.");
              }
            });
          }}
        >
          <input type="hidden" name="amount" value="9900" />

          <div className="space-y-2 sm:col-span-2">
            <label
              className="text-sm font-medium text-slate-800"
              htmlFor="depositor_name"
            >
              입금자명
            </label>
            <input
              id="depositor_name"
              name="depositor_name"
              defaultValue={defaultDepositorName}
              placeholder="예: 홍길동"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              required
            />
            <p className="text-xs text-slate-500">
              마이페이지에 저장한 이름과 동일하게 입력하는 것을 권장해요.
            </p>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-slate-800" htmlFor="memo">
              메모(선택)
            </label>
            <textarea
              id="memo"
              name="memo"
              placeholder="예: 문의사항"
              className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="submit"
            disabled={pending || ordersTableMissing}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 disabled:opacity-60 sm:col-span-2"
          >
            {pending ? "신청 중…" : "신청하기"}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

