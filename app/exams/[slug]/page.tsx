import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegistryEntry, listPublicExams } from "../../lib/exams/registry";
import { loadExamBank } from "../../lib/exams/load-bank";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const e = getRegistryEntry(slug);
  if (!e) return { title: "시험 | PassMaster" };
  return { title: `${e.title} | PassMaster` };
}

export default async function ExamDetailPage({ params }: Props) {
  const { slug } = await params;
  const e = getRegistryEntry(slug);
  if (!e || e.public === false) notFound();

  let count = 0;
  let title = e.title;
  let loadError: string | null = null;
  try {
    const b = await loadExamBank(slug);
    count = b.questions.length;
    if (b.title) title = b.title;
  } catch (err: unknown) {
    loadError = err instanceof Error ? err.message : "문제를 불러오지 못했습니다.";
  }

  return (
    <section className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link className="hover:text-slate-800" href="/exams">
          자격증 목록
        </Link>{" "}
        / {e.title}
      </nav>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
        {e.category ? (
          <p className="text-sm font-medium text-blue-700">{e.category}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{e.title}</h1>
        {e.subtitle ? <p className="text-slate-600">{e.subtitle}</p> : null}
        {e.description ? (
          <p className="mt-3 max-w-prose text-sm leading-7 text-slate-600">
            {e.description}
          </p>
        ) : null}

        {loadError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">JSON을 읽을 수 없어요</p>
            <p className="mt-1 font-mono text-xs">{loadError}</p>
            <p className="mt-2 text-xs text-amber-900">
              <code>data/exams/{slug}.json</code> 파일이 있는지 확인하세요. (또는
              레지스트리의 dataFile)
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            로드된 문항 수: <span className="font-semibold text-slate-900">{count}</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={`/exams/${slug}/practice`}
            className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm"
          >
            연습하기
          </Link>
          <Link
            href="/exams"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800"
          >
            목록
          </Link>
        </div>
      </div>
    </section>
  );
}

export async function generateStaticParams() {
  return listPublicExams().map((e) => ({ slug: e.slug }));
}
