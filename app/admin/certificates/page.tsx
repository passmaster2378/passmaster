import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import { listPublicExams, EXAM_REGISTRY } from "../../lib/exams/registry";
import { loadExamBank } from "../../lib/exams/load-bank";

export const metadata = {
  title: "관리자 · 자격증(문제 은행) | PassMaster",
};

export default async function AdminCertificatesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError && String((profileError as { code?: string }).code) === "42P01") {
    return (
      <section>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">profiles</span> 테이블이 필요해요.
        </div>
      </section>
    );
  }

  if (!profile?.is_admin) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900">
          관리자만 접근할 수 있어요.
        </div>
        <Link
          className="text-sm font-semibold text-blue-700 hover:underline"
          href="/mypage"
        >
          대시보드로
        </Link>
      </section>
    );
  }

  const publicExams = listPublicExams();
  const rows = await Promise.all(
    EXAM_REGISTRY.map(async (e) => {
      try {
        const b = await loadExamBank(e.slug);
        return { slug: e.slug, count: b.questions.length, err: null as string | null };
      } catch (err: unknown) {
        return {
          slug: e.slug,
          count: null as number | null,
          err: err instanceof Error ? err.message : "load error",
        };
      }
    }),
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">자격증 · 문제 은행(현황)</h1>
        <p className="mt-1 text-sm text-slate-600">
          홈/시험 목록에 쓰는 항목은 <code className="text-xs">app/lib/exams/registry.ts</code>{" "}
          한곳에서 관리합니다. (추후 DB·편집 UI로 이전 가능)
        </p>
        <p className="mt-2 text-sm text-slate-600">
          등록 끝: <span className="font-medium">{EXAM_REGISTRY.length}개</span> · 홈
          공개: <span className="font-medium">{publicExams.length}개</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/exams"
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            공개 시험 목록 보기(사용자 화면) →
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-slate-700 hover:underline"
          >
            주문 승인
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] shadow-sm">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="px-4 py-3">slug</th>
              <th className="px-4 py-3">이름</th>
              <th className="px-4 py-3">공개</th>
              <th className="px-4 py-3">로드된 문항</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {EXAM_REGISTRY.map((e) => {
              const row = rows.find((r) => r.slug === e.slug);
              return (
                <tr key={e.slug}>
                  <td className="px-4 py-3 font-mono text-xs">{e.slug}</td>
                  <td className="px-4 py-3">
                    {e.title}
                    {e.subtitle ? ` · ${e.subtitle}` : ""}
                  </td>
                  <td className="px-4 py-3">{e.public === false ? "숨김" : "공개"}</td>
                  <td className="px-4 py-3">
                    {row?.err ? (
                      <span className="text-amber-800">오류: {row.err}</span>
                    ) : (
                      (row?.count ?? "—") + "문항"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
