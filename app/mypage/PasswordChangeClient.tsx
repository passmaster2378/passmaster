"use client";

import { useState, useTransition } from "react";
import { changeAccountPassword } from "../auth/password-actions";

function EyeOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

type Props = { idPrefix?: string };

export function PasswordChangeClient({ idPrefix = "pwd" }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  return (
    <div
      id="account-password"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-slate-50/80 p-5"
    >
      <h3 className="text-sm font-semibold text-slate-900">비밀번호 변경</h3>
      <p className="mt-1 text-xs text-slate-600">
        이메일·비밀번호로 가입한 계정에서만 사용할 수 있어요.
      </p>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {message}
        </div>
      ) : null}

      <form
        className="mt-4 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          setMessage("");
          const fd = new FormData(e.currentTarget);
          const current = String(fd.get("current_password") ?? "");
          const next = String(fd.get("new_password") ?? "");
          startTransition(async () => {
            try {
              await changeAccountPassword(current, next);
              setMessage("비밀번호가 변경됐어요.");
              (e.currentTarget as HTMLFormElement).reset();
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "변경에 실패했습니다.");
            }
          });
        }}
      >
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`${idPrefix}-current`}
          >
            기존 비밀번호
          </label>
          <div className="relative">
            <input
              id={`${idPrefix}-current`}
              name="current_password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label={showCurrent ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showCurrent ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor={`${idPrefix}-new`}
          >
            새 비밀번호
          </label>
          <div className="relative">
            <input
              id={`${idPrefix}-new`}
              name="new_password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-12 pl-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label={showNew ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showNew ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {pending ? "변경 중…" : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}
