import Link from "next/link";
import { listPublicExams } from "../lib/exams/registry";
import { loadExamBank } from "../lib/exams/load-bank";

export const metadata = {
  title: "자격증·문제 은행 | PassMaster",
};

export default async function ExamsIndexPage() {
  const publicExams = listPublicExams();
  const withCounts = await Promise.all(
    publicExams.map(async (e) => {
      try {
        const b = await loadExamBank(e.slug);
        return { entry: e, count: b.questions.length };
      } catch {
        return { entry: e, count: null as number | null };
      }
    }),
  );

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          자격증 / 문제 은행
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          JSON으로 등록한 필기·모의고사를 연습할 수 있어요.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {withCounts.map(({ entry: e, count }) => (
          <li key={e.slug}>
            <Link
              href={`/exams/${e.slug}`}
              className="block h-full rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5 transition hover:border-slate-300"
            >
              {e.category ? (
                <p className="text-xs font-medium text-blue-700">{e.category}</p>
              ) : null}
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {e.title}
              </h2>
              {e.subtitle ? (
                <p className="text-sm text-slate-500">{e.subtitle}</p>
              ) : null}
              {e.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {e.description}
                </p>
              ) : null}
              <p className="mt-3 text-sm font-medium text-slate-800">
                {count != null
                  ? `등록 문항: ${count}개`
                  : "JSON 없음(파일·경로 확인)"}
                {e.questionCountHint && count == null
                  ? ` · 목표 ${e.questionCountHint}문항`
                  : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
