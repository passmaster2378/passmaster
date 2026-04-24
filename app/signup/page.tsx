import Link from "next/link";
import { redirect } from "next/navigation";
import { signUp } from "../auth/actions";
import { createSupabaseServerClient } from "../lib/supabase/server";

export const metadata = {
  title: "회원가입 | PassMaster",
};

type SignUpPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignUpPage(props: SignUpPageProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/mypage");
  }

  const searchParams = (await props.searchParams) ?? {};
  const error = searchParams.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <section className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            회원가입
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            새 계정을 만들어 PassMaster를 시작하세요.
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <form action={signUp} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-800"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-800"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상 권장"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            계정 만들기
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <Link
            href="/login"
            className="font-medium text-slate-600 transition hover:text-blue-700"
          >
            로그인으로
          </Link>
          <Link
            href="/"
            className="font-medium text-slate-600 transition hover:text-blue-700"
          >
            홈으로
          </Link>
        </div>
      </div>
    </section>
  );
}

