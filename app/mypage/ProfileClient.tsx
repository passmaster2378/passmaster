"use client";

import { useMemo, useState, useTransition } from "react";
import type { ProfileRow } from "../profile/actions";
import { upsertMyProfile } from "../profile/actions";

type Props = {
  initialProfile: ProfileRow | null;
  tableMissing: boolean;
};

export function ProfileClient({ initialProfile, tableMissing }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const title = useMemo(() => "내 정보", []);

  if (tableMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        아직 <span className="font-semibold">profiles</span> 테이블이 없어요.
        Supabase SQL Editor에서 <span className="font-semibold">supabase/profiles.sql</span> 내용을 실행해 주세요.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">
          결제/입금 확인 등에서 사용할 기본 정보입니다.
        </p>
      </div>

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
          startTransition(async () => {
            try {
              await upsertMyProfile(formData);
              setMessage("저장됐어요.");
            } catch (err: unknown) {
              setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
            }
          });
        }}
      >
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="full_name">
            이름
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={initialProfile?.full_name ?? ""}
            placeholder="예: 홍길동"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="phone">
            휴대폰
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={initialProfile?.phone ?? ""}
            placeholder="예: 01012345678"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-800" htmlFor="birthdate">
            생년월일
          </label>
          <input
            id="birthdate"
            name="birthdate"
            type="date"
            defaultValue={initialProfile?.birthdate ?? ""}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 disabled:opacity-60 sm:col-span-2"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
      </form>
    </div>
  );
}

