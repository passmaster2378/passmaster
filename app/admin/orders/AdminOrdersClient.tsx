"use client";

import { useState, useTransition } from "react";
import { setOrderStatus } from "./actions";

type Order = {
  id: string;
  user_id: string;
  depositor_name: string;
  amount: number;
  status: "pending" | "paid" | "cancelled" | "rejected";
  memo: string | null;
  created_at: string;
};

function formatKrw(amount: number) {
  return new Intl.NumberFormat("ko-KR").format(amount);
}

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

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
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setError("");
                      setMessage("");
                      startTransition(async () => {
                        try {
                          await setOrderStatus(o.id, "paid");
                          setOrders((prev) =>
                            prev.map((x) =>
                              x.id === o.id ? { ...x, status: "paid" } : x,
                            ),
                          );
                          setMessage("승인 처리했어요.");
                        } catch (e: unknown) {
                          setError(
                            e instanceof Error ? e.message : "승인에 실패했습니다.",
                          );
                        }
                      });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setError("");
                      setMessage("");
                      startTransition(async () => {
                        try {
                          await setOrderStatus(o.id, "rejected");
                          setOrders((prev) =>
                            prev.map((x) =>
                              x.id === o.id ? { ...x, status: "rejected" } : x,
                            ),
                          );
                          setMessage("거절 처리했어요.");
                        } catch (e: unknown) {
                          setError(
                            e instanceof Error ? e.message : "거절에 실패했습니다.",
                          );
                        }
                      });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    거절
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

