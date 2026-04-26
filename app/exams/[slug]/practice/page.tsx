import Link from "next/link";
import { notFound } from "next/navigation";
import { getExamMeta } from "../../actions";
import { getRegistryEntry, listPublicExams } from "../../../lib/exams/registry";
import { ExamPracticeClient } from "./ExamPracticeClient";

type Props = { params: Promise<{ slug: string }> };

export default async function ExamPracticePage({ params }: Props) {
  const { slug } = await params;
  const e = getRegistryEntry(slug);
  if (!e || e.public === false) notFound();

  const meta = await getExamMeta(slug).catch(() => null);
  if (!meta) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link className="hover:text-slate-800" href="/exams">
          목록
        </Link>{" "}
        /{" "}
        <Link className="hover:text-slate-800" href={`/exams/${slug}`}>
          {meta.title}
        </Link>{" "}
        / 연습
      </nav>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
        <ExamPracticeClient
          slug={slug}
          total={meta.total}
          title={meta.title}
        />
      </div>
    </section>
  );
}

export async function generateStaticParams() {
  return listPublicExams().map((e) => ({ slug: e.slug }));
}
