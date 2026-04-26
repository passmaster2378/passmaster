import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../auth/actions";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { MyInfoClient } from "./MyInfoClient";
import type { ProfileRow } from "../profile/actions";
import { listMyNotifications } from "../notifications/actions";
import { NotificationsClient } from "./NotificationsClient";
import { LearningSparkline } from "./components/LearningSparkline";

export const metadata = {
  title: "학습 대시보드 | PassMaster",
};

function enrollmentStatusKo(status: string) {
  switch (status) {
    case "applied":
      return "신청완료";
    case "payment_pending":
      return "입금대기";
    case "active":
      return "수강중";
    case "completed":
      return "수강완료";
    case "cancelled":
      return "취소";
    default:
      return status;
  }
}

function passStatusKo(pass: string) {
  switch (pass) {
    case "pass":
      return "합격";
    case "fail":
      return "불합격";
    default:
      return "미확정";
  }
}

export default async function MyPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let profileTableMissing = false;
  let initialProfile: ProfileRow | null = null;

  const profileRes = await supabase
    .from("profiles")
    .select("user_id,full_name,phone,birthdate,plan,plan_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileRes.error) {
    if (String((profileRes.error as { code?: string }).code) === "42P01") {
      profileTableMissing = true;
    } else {
      // Non-fatal: show as missing to avoid blocking mypage
      profileTableMissing = true;
    }
  } else {
    initialProfile = (profileRes.data as ProfileRow | null) ?? null;
  }

  const planLabel: "Pro" | "Free" =
    !profileRes.error && profileRes.data?.plan === "pro" ? "Pro" : "Free";

  let notifications: Awaited<ReturnType<typeof listMyNotifications>> = [];
  let notificationsMissing = false;
  try {
    notifications = await listMyNotifications(5);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.toLowerCase().includes("relation") && msg.includes("notifications")) {
      notificationsMissing = true;
    }
  }

  let learningSetupMissing = false;
  let learningLoadError: string | null = null;

  const enrollmentsRes = await supabase
    .from("enrollments")
    .select(
      "id,certificate_name,track_name,status,progress_percent,last_score_percent,pass_status,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(10);
  if (enrollmentsRes.error) {
    const code = String((enrollmentsRes.error as { code?: string }).code ?? "");
    if (code === "42P01") {
      learningSetupMissing = true;
    } else {
      learningLoadError = enrollmentsRes.error.message;
    }
  }

  const metricsRes = await supabase
    .from("learning_metrics")
    .select("metric_date,questions_answered,correct_count")
    .order("metric_date", { ascending: true })
    .limit(30);
  if (metricsRes.error) {
    const code = String((metricsRes.error as { code?: string }).code ?? "");
    if (code === "42P01") {
      learningSetupMissing = true;
    } else {
      learningLoadError = learningLoadError ?? metricsRes.error.message;
    }
  }

  const enrollments = (enrollmentsRes.data ?? []) as Array<{
    id: string;
    certificate_name: string;
    track_name: string;
    status: string;
    progress_percent: number;
    last_score_percent: number | null;
    pass_status: string;
  }>;

  const dailyMetrics = (metricsRes.data ?? []) as Array<{
    metric_date: string;
    questions_answered: number;
    correct_count: number;
  }>;

  const activeEnrollment =
    enrollments.find((e) => e.status === "active") ?? enrollments[0] ?? null;

  const volumePoints = dailyMetrics.map((m) => ({
    date: m.metric_date,
    value: m.questions_answered,
  }));

  const accuracyPoints = dailyMetrics.map((m) => {
    const q = m.questions_answered;
    const c = m.correct_count;
    const acc = q > 0 ? Math.round((c / q) * 100) : 0;
    return { date: m.metric_date, value: acc };
  });

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              학습 대시보드
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              수강 신청 현황, 진행률, 합격 여부를 한 화면에서 빠르게 확인하세요.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
            >
              체험/문제로 이동
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-10 w-full items-center justify-center rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 sm:w-auto"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </div>

      {learningSetupMissing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          학습 대시보드 데이터를 쓰려면 Supabase SQL Editor에서{" "}
          <span className="font-semibold">supabase/learning.sql</span>을 실행해
          주세요. (enrollments / learning_metrics 테이블 생성)
        </div>
      ) : null}
      {learningLoadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          학습 데이터를 불러오지 못했습니다.{" "}
          <span className="font-mono text-xs text-rose-800">{learningLoadError}</span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
            <h2 className="text-sm font-semibold text-slate-900">빠른 이동</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href="#section-profile"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                1. 내 정보 관리
              </Link>
              <Link
                href="#section-enrollment"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                2. 수강 신청 현황
              </Link>
              <Link
                href="#section-status"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                3. 수강 상태
              </Link>
              <Link
                href="/"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                홈(체험/문제)
              </Link>
              <Link
                href="/billing"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                수강/결제 신청
              </Link>
              <Link
                href="#account-password"
                className="block rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                비밀번호 변경
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              수강 전에는 홈의 체험 문제로 시작하고, 결제/승인 이후 본 수강 학습 화면이
              연결될 예정입니다.
            </p>
          </div>

          {notificationsMissing ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              알림을 쓰려면 Supabase SQL Editor에서{" "}
              <span className="font-semibold">supabase/notifications.sql</span>을
              실행해 주세요.
            </div>
          ) : (
            <NotificationsClient initial={notifications} />
          )}
        </div>

        <div className="space-y-4 lg:col-span-8">
          <MyInfoClient
            userEmail={user.email ?? ""}
            planLabel={planLabel}
            initialProfile={initialProfile}
            tableMissing={profileTableMissing}
          />

          <div
            id="section-enrollment"
            className="scroll-mt-24 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">2. 수강 신청 현황</h2>
              <p className="text-sm text-slate-600">신청한 자격증 과정과 처리 상태를 확인하세요.</p>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <span className="text-xs text-slate-500">최대 10개</span>
            </div>
            {enrollments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                아직 신청 내역이 없어요.{" "}
                <Link className="font-medium text-blue-700 hover:underline" href="/billing">
                  수강/결제 신청
                </Link>
                을 먼저 완료해 주세요.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="py-2 pr-3">자격증</th>
                      <th className="py-2 pr-3">트랙</th>
                      <th className="py-2 pr-3">상태</th>
                      <th className="py-2 pr-3">진행</th>
                      <th className="py-2 pr-3">최근점수</th>
                      <th className="py-2 pr-0">합격</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {enrollments.map((e) => (
                      <tr key={e.id} className="text-slate-800">
                        <td className="py-3 pr-3 font-medium">{e.certificate_name}</td>
                        <td className="py-3 pr-3 text-slate-600">{e.track_name}</td>
                        <td className="py-3 pr-3 text-slate-600">
                          {enrollmentStatusKo(String(e.status))}
                        </td>
                        <td className="py-3 pr-3 text-slate-600">
                          {e.progress_percent}%
                        </td>
                        <td className="py-3 pr-3 text-slate-600">
                          {e.last_score_percent == null ? "—" : `${e.last_score_percent}%`}
                        </td>
                        <td className="py-3 pr-0 text-slate-600">
                          {passStatusKo(String(e.pass_status))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            id="section-status"
            className="scroll-mt-24 space-y-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5"
          >
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">3. 수강 상태</h2>
              <p className="text-sm text-slate-600">
                현재 과정의 진행·점수·학습 그래프를 한눈에 봅니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <p className="text-xs font-medium text-slate-500">주 활성 과정</p>
                <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
                  {activeEnrollment?.certificate_name ?? "아직 없음"}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {activeEnrollment
                    ? `${enrollmentStatusKo(String(activeEnrollment.status))} · 진행 ${
                        activeEnrollment.progress_percent
                      }%`
                    : "수강 신청 후 여기에 표시됩니다."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <p className="text-xs font-medium text-slate-500">최근 점수</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeEnrollment?.last_score_percent != null
                    ? `${activeEnrollment.last_score_percent}%`
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-600">모의고사/진단 결과가 들어갑니다.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
                <p className="text-xs font-medium text-slate-500">합격 추정</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {activeEnrollment
                    ? passStatusKo(String(activeEnrollment.pass_status))
                    : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-600">데이터가 쌓이면 정확해집니다.</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <LearningSparkline
                title="최근 학습량(문항 수)"
                subtitle="매일 푼 문항 수를 14일 추세로 보여줍니다."
                points={volumePoints}
              />
              <LearningSparkline
                title="일별 정답률(추정)"
                subtitle="그날 푼 문항 기준으로 정답률(%)을 계산합니다."
                points={accuracyPoints}
                strokeClass="text-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

