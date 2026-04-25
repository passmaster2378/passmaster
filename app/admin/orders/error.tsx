"use client";

export default function AdminOrdersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 shadow-sm shadow-red-900/5">
      <div className="space-y-2">
        <h1 className="text-lg font-semibold">관리자 페이지 오류</h1>
        <p className="text-red-800">
          {error.message || "서버 오류가 발생했습니다."}
        </p>
        {error.digest ? (
          <p className="text-xs text-red-800/80">digest: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={() => reset()}
          className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition hover:bg-red-700"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

