"use client";

import { useState, useTransition } from "react";
import type { NotificationRow } from "../notifications/actions";
import { markNotificationRead } from "../notifications/actions";

export function NotificationsClient({ initial }: { initial: NotificationRow[] }) {
  const [items, setItems] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 text-sm text-slate-600 shadow-sm shadow-slate-900/5">
        아직 알림이 없어요.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
      <h2 className="text-sm font-semibold text-slate-900">알림</h2>
      <ul className="mt-3 divide-y divide-slate-200">
        {items.map((n) => (
          <li key={n.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {n.is_read ? null : (
                    <span className="mr-2 inline-flex h-2 w-2 translate-y-[2px] rounded-full bg-blue-600" />
                  )}
                  {n.title}
                </p>
                {n.body ? (
                  <p className="mt-1 text-xs leading-5 text-slate-600">{n.body}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-slate-500">
                  {new Date(n.created_at).toLocaleString("ko-KR")}
                </p>
              </div>
              {!n.is_read ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    startTransition(async () => {
                      await markNotificationRead(n.id);
                      setItems((prev) =>
                        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
                      );
                    });
                  }}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  읽음
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

