import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { VaultClient } from "../mypage/VaultClient";

export const metadata = {
  title: "내 비밀번호 설정 | PassMaster",
};

export default async function VaultPage() {
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
    if (String((error as { code?: string }).code) === "42P01") {
      vaultInitError =
        "아직 vault_items 테이블이 없어요. Supabase SQL Editor에서 supabase/vault_items.sql 내용을 실행해 주세요.";
    } else {
      vaultInitError = error.message;
    }
  } else {
    initialItems = (data ?? []) as typeof initialItems;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              내 비밀번호 설정
            </h1>
            <p className="text-sm leading-6 text-slate-600">
              자주 쓰는 사이트 계정 정보를 안전하게 관리하세요.
            </p>
          </div>
          <Link
            href="/mypage"
            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
          >
            마이페이지로
          </Link>
        </div>
      </div>

      {vaultInitError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {vaultInitError}
        </div>
      ) : (
        <VaultClient initialItems={initialItems} />
      )}
    </section>
  );
}

