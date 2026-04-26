import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { PasswordChangeClient } from "../mypage/PasswordChangeClient";

export const metadata = {
  title: "비밀번호 변경 | PassMaster",
};

export default async function VaultPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              비밀번호 변경
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              기존 비밀번호 확인 후 새 비밀번호로 바꿉니다.
            </p>
          </div>
          <Link
            href="/mypage#section-profile"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            대시보드로
          </Link>
        </div>
      </div>

      <div className="max-w-lg">
        <PasswordChangeClient idPrefix="vault" />
      </div>
    </section>
  );
}
