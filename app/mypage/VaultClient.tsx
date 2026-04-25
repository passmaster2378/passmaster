"use client";

import { useMemo, useState, useTransition } from "react";
import type { VaultItemListItem } from "../vault/actions";
import {
  createVaultItem,
  listVaultItems,
  deleteVaultItem,
  revealVaultPassword,
} from "../vault/actions";

type Props = {
  initialItems: VaultItemListItem[];
};

export function VaultClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const title = useMemo(() => "내 비밀번호", []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              비밀번호는 서버에서 암호화해서 저장합니다.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2"
          id="vault-create-form"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            const form = e.currentTarget;
            const formData = new FormData(form);
            startTransition(async () => {
              try {
                await createVaultItem(formData);
                const next = await listVaultItems();
                setItems(next);
                form.reset();
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
              }
            });
          }}
        >
          <input
            name="title"
            placeholder="사이트/이름 (예: Gmail)"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            name="username"
            placeholder="아이디(선택)"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호"
            required
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            name="url"
            placeholder="URL(선택)"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            name="folder"
            placeholder="폴더(선택)"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 sm:col-span-2"
          />
          <textarea
            name="note"
            placeholder="메모(선택)"
            className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10 sm:col-span-2"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 disabled:opacity-60 sm:col-span-2"
          >
            {pending ? "저장 중…" : "추가하기"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">
            아직 저장된 항목이 없어요. 위에서 하나 추가해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {items.map((item) => (
              <li key={item.id} className="py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {item.username ? `아이디: ${item.username}` : "아이디: —"}
                      {item.url ? ` · ${item.url}` : ""}
                      {item.folder ? ` · 폴더: ${item.folder}` : ""}
                    </p>
                    {item.note ? (
                      <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                        {item.note}
                      </p>
                    ) : null}
                    {revealed[item.id] ? (
                      <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800">
                        <span className="font-semibold">비밀번호:</span>{" "}
                        <span className="break-all font-mono">
                          {revealed[item.id]}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        startTransition(async () => {
                          try {
                            const pw = await revealVaultPassword(item.id);
                            setRevealed((prev) => ({ ...prev, [item.id]: pw }));
                          } catch (e: unknown) {
                            setError(
                              e instanceof Error ? e.message : "복호화에 실패했습니다.",
                            );
                          }
                        });
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                    >
                      보기
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setError("");
                        startTransition(async () => {
                          try {
                            await deleteVaultItem(item.id);
                            const next = items.filter((x) => x.id !== item.id);
                            setItems(next);
                            setRevealed((prev) => {
                              const copy = { ...prev };
                              delete copy[item.id];
                              return copy;
                            });
                          } catch (e: unknown) {
                            setError(
                              e instanceof Error ? e.message : "삭제에 실패했습니다.",
                            );
                          }
                        });
                      }}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

