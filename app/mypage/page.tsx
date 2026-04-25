import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../auth/actions";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { ProfileClient } from "./ProfileClient";
import type { ProfileRow } from "../profile/actions";

export const metadata = {
  title: "마이페이지 | PassMaster",
};

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
    .select("user_id,full_name,phone,birthdate")
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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              마이페이지
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              계정 정보와 보안 설정을 관리할 수 있는 공간입니다.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              계정
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

      <ProfileClient
        initialProfile={initialProfile}
        tableMissing={profileTableMissing}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-sm font-semibold text-slate-900">프로필</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">이메일</span>
              <span className="font-medium text-slate-800">{user.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">이름</span>
              <span className="font-medium text-slate-800">
                {initialProfile?.full_name?.trim() ? initialProfile.full_name : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">플랜</span>
              <span className="font-medium text-slate-800">Free</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-sm font-semibold text-slate-900">보안</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            이후 단계에서 2단계 인증/마스터 비밀번호 정책 등을 연결할 수 있어요.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            보안 설정 (UI)
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-sm font-semibold text-slate-900">바로가기</h2>
          <div className="mt-3 space-y-2">
            <Link
              href="/vault"
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              내 비밀번호 설정
            </Link>
            <Link
              href="/"
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              홈으로 돌아가기
            </Link>
            <Link
              href="/login"
              className="block rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              로그인 화면
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

