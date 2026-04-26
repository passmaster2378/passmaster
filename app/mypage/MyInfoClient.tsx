"use client";

import { useMemo, useState, useTransition } from "react";
import type { ProfileRow } from "../profile/actions";
import { upsertMyProfile } from "../profile/actions";
import { PasswordChangeClient } from "./PasswordChangeClient";

function splitBirthdate(iso: string | null | undefined) {
  if (!iso) return { y: "", m: "", d: "" };
  const parts = iso.split("-");
  if (parts.length < 3) return { y: "", m: "", d: "" };
  const [y, m, d] = parts;
  if (!y || !m || !d) return { y: "", m: "", d: "" };
  return { y, m: String(parseInt(m, 10)), d: String(parseInt(d, 10)) };
}

type Props = {
  userEmail: string;
  planLabel: "Pro" | "Free";
  initialProfile: ProfileRow | null;
  tableMissing: boolean;
};

export function MyInfoClient({
  userEmail,
  planLabel,
  initialProfile,
  tableMissing,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const birth = useMemo(
    () => splitBirthdate(initialProfile?.birthdate),
    [initialProfile?.birthdate],
  );
  const title = useMemo(() => "1. 내 정보 관리", []);

  if (tableMissing) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        아직 <span className="font-semibold">profiles</span> 테이블이 없어요. Supabase SQL
        Editor에서 <span className="font-semibold">supabase/profiles.sql</span> 내용을
        실행해 주세요.
      </div>
    );
  }

  return (
    <section
      id="section-profile"
      className="scroll-mt-24 space-y-0 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5"
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">
          계정 요약, 프로필, 로그인 비밀번호를 이 한곳에서 관리합니다.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">내 요약</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">이메일</span>
            <span className="max-w-[65%] truncate font-medium text-slate-800">
              {userEmail || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">이름</span>
            <span className="font-medium text-slate-800">
              {initialProfile?.full_name?.trim() ? initialProfile.full_name : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">이용권</span>
            <span className="font-medium text-slate-800">{planLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">내 정보</h3>
        <p className="mt-1 text-xs text-slate-500">
          결제·입금 확인 등에 사용됩니다. 생년월일은 아래에 숫자로 직접 입력하세요.
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
          className="mt-4 grid gap-3 sm:grid-cols-2"
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
                setError(
                  err instanceof Error ? err.message : "저장에 실패했습니다.",
                );
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

          <div className="space-y-2 sm:col-span-2">
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

          <div className="space-y-2 sm:col-span-2">
            <div className="text-sm font-medium text-slate-800">생년월일</div>
            <div className="grid max-w-md grid-cols-3 gap-2">
              <div>
                <label className="sr-only" htmlFor="birth_y">
                  연(4자리)
                </label>
                <input
                  id="birth_y"
                  name="birth_y"
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday-year"
                  defaultValue={birth.y}
                  placeholder="1990"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="birth_m">
                  월
                </label>
                <input
                  id="birth_m"
                  name="birth_m"
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday-month"
                  defaultValue={birth.m}
                  placeholder="1~12"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="birth_d">
                  일
                </label>
                <input
                  id="birth_d"
                  name="birth_d"
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday-day"
                  defaultValue={birth.d}
                  placeholder="1~31"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 disabled:opacity-60 sm:col-span-2"
          >
            {pending ? "저장 중…" : "정보 저장"}
          </button>
        </form>
      </div>

      <div className="mt-5">
        <PasswordChangeClient idPrefix="mypage" />
      </div>
    </section>
  );
}
