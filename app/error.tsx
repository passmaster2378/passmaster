"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 shadow-sm shadow-red-900/5">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">서버 오류가 발생했어요</h1>
        <p className="text-red-800">
          {error.message || "페이지를 불러오는 중 문제가 발생했습니다."}
        </p>
        {error.digest ? (
          <p className="text-xs text-red-800/80">digest: {error.digest}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-red-200 bg-white/60 p-4 text-xs text-red-900">
        <p className="font-semibold">자주 발생하는 원인</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Supabase에 필요한 SQL을 아직 실행하지 않음 (특히{" "}
            <span className="font-semibold">supabase/plans.sql</span>,{" "}
            <span className="font-semibold">supabase/admin.sql</span>)
          </li>
          <li>Vercel 배포가 최신 커밋으로 아직 갱신되지 않음</li>
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-900 shadow-sm shadow-red-900/5 transition hover:bg-red-50"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}

