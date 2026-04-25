import { createSupabaseServerClient } from "./lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-sm font-medium text-slate-700 shadow-sm shadow-slate-900/5">
          안전하고 깔끔한 비밀번호 관리
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          PassMaster로 계정을 더 안전하게 관리하세요
        </h1>
        <p className="max-w-prose text-base leading-7 text-slate-600">
          신뢰감 있는 파란 톤의 기본 레이아웃을 적용했습니다. 상단에서{" "}
          <span className="font-medium text-slate-800">로그인</span>과{" "}
          <span className="font-medium text-slate-800">마이페이지</span>로
          이동할 수 있어요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <a
              href="/vault"
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              내 비밀번호 설정
            </a>
          ) : (
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
            >
              로그인하기
            </a>
          )}
          <a
            href="/mypage"
            className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            마이페이지
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-slate-100" />
            <div className="h-9 w-24 rounded-full bg-blue-600/15" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-5/6 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="mt-3 h-8 w-full rounded bg-slate-100" />
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-4">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-3 h-8 w-full rounded bg-slate-100" />
            </div>
          </div>
          <p className="text-sm text-slate-500">
            (예시 화면) 이후 로그인/마이페이지 페이지를 연결해 확장할 수 있어요.
          </p>
        </div>
      </div>
    </section>
  );
}
