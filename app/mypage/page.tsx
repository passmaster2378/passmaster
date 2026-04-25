import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "../auth/actions";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { VaultClient } from "./VaultClient";

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

  let initialItems: Array<{
    id: string;
    title: string;
    username: string | null;
    url: string | null;
    note: string | null;
    folder: string | null;
    favorite: boolean;
    updated_at: string;
  }> = [];
  let vaultInitError = "";

  const { data, error } = await supabase
    .from("vault_items")
    .select("id,title,username,url,note,folder,favorite,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    // Table not created yet (common first-run case)
    if (String((error as { code?: string }).code) === "42P01") {
      vaultInitError =
        "아직 vault_items 테이블이 없어요. Supabase SQL Editor에서 supabase/vault_items.sql을 실행해 주세요.";
    } else {
      vaultInitError = error.message;
    }
  } else {
    initialItems = (data ?? []) as typeof initialItems;
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

      {vaultInitError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {vaultInitError}
        </div>
      ) : (
        <VaultClient initialItems={initialItems} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-sm font-semibold text-slate-900">프로필</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">이메일</span>
              <span className="font-medium text-slate-800">{user.email ?? "—"}</span>
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

