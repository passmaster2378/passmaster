import Link from "next/link";
import { createSupabaseServerClient } from "./lib/supabase/server";
import { listPublicExams } from "./lib/exams/registry";
import { loadExamBank } from "./lib/exams/load-bank";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const exams = listPublicExams();
  const withCounts = await Promise.all(
    exams.map(async (e) => {
      try {
        const b = await loadExamBank(e.slug);
        return { entry: e, count: b.questions.length };
      } catch {
        return { entry: e, count: null as number | null };
      }
    }),
  );

  return (
    <section className="grid gap-10 lg:grid-cols-2 lg:items-start">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5">
          자격증 필기·문제 은행
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          PassMaster에서 자격증 문제를 풀고, 수강·결제로 이어가세요
        </h1>
        <p className="max-w-prose text-base leading-7 text-slate-600">
          메인에서 열리는 시험은 <span className="font-medium">JSON 문제은행</span>
          을 기준으로 합니다. 로그인 후 대시보드·결제 흐름과도 연결할 수 있어요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/exams"
            className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
          >
            시험 목록 · 연습
          </Link>
          {user ? (
            <Link
              href="/mypage"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm"
            >
              대시보드
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm"
            >
              로그인
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">열려 있는 자격증</h2>
          <Link
            href="/exams"
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            전체보기
          </Link>
        </div>
        <ul className="mt-4 space-y-3">
          {withCounts.length === 0 ? (
            <li className="text-sm text-slate-500">
              <code>app/lib/exams/registry.ts</code>에 시험을 등록하세요.
            </li>
          ) : (
            withCounts.map(({ entry: e, count }) => (
              <li key={e.slug}>
                <Link
                  href={`/exams/${e.slug}/practice`}
                  className="block rounded-xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300"
                >
                  <p className="text-xs text-blue-700">{e.category ?? "시험"}</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{e.title}</p>
                  {e.subtitle ? (
                    <p className="text-xs text-slate-500">{e.subtitle}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-600">
                    {count != null
                      ? `등록 문항 ${count}개 · 바로 연습`
                      : "JSON을 확인해 주세요."}
                  </p>
                </Link>
              </li>
            ))
          )}
        </ul>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          1000문제 JSON은 <code>data/exams/…</code>에 넣고 배포하면 반영됩니다.
        </p>
      </div>
    </section>
  );
}
