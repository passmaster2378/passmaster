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

  // Plan status (fast MVP)
  const planRes = await supabase
    .from("profiles")
    .select("plan,plan_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const plan = planRes.error ? "free" : String(planRes.data?.plan ?? "free");
  const expires = planRes.error ? null : (planRes.data?.plan_expires_at ?? null);
  const proActive =
    plan === "pro" && (!expires || new Date(expires).getTime() > Date.now());

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

      {!proActive ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-950">
          무료 플랜은 <span className="font-semibold">3개까지 저장</span>할 수 있어요.
          더 저장하려면{" "}
          <Link className="font-semibold text-blue-700 hover:underline" href="/billing">
            결제/입금
          </Link>
          에서 Pro를 활성화해 주세요.
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950">
          Pro 이용 중{expires ? ` (만료: ${new Date(expires).toLocaleDateString("ko-KR")})` : ""}.
        </div>
      )}

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

