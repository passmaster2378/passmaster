"use client";

import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);
  const label = useMemo(
    () => (pending ? "Google로 이동 중…" : "Google로 계속하기"),
    [pending],
  );

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const supabase = createSupabaseBrowserClient();
          const siteUrl = getSiteUrl();
          const callbackUrl = new URL("/auth/callback", `${siteUrl}/`);
          callbackUrl.searchParams.set("next", "/mypage");

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: callbackUrl.toString(),
            },
          });

          if (error) {
            const params = new URLSearchParams();
            params.set("error", error.message);
            window.location.assign(`/login?${params.toString()}`);
            return;
          }

          if (data.url) {
            window.location.assign(data.url);
            return;
          }

          const params = new URLSearchParams();
          params.set("error", "Google 로그인 URL을 가져오지 못했습니다.");
          window.location.assign(`/login?${params.toString()}`);
        } catch (e: unknown) {
          const params = new URLSearchParams();
          const message =
            e instanceof Error
              ? e.message
              : "Google 로그인 처리 중 오류가 발생했습니다.";
          params.set(
            "error",
            `${message} (배포환경이면 Vercel의 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 설정도 확인해 주세요)`,
          );
          window.location.assign(`/login?${params.toString()}`);
        } finally {
          // If navigation happens, this won't matter; if it doesn't, re-enable.
          setPending(false);
        }
      }}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4-6 6.9-11.3 6.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.6-5.6C35.1 3.4 30 1 24 1 11.3 1 1 11.3 1 24s10.3 23 23 23 23-10.3 23-23c0-1.3-.1-2.5-.3-3.5z"
          />
          <path
            fill="#FF3D00"
            d="M6.3 14.7l6.6 4.8C14.2 16.4 18.6 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.6-5.6C35.1 3.4 30 1 24 1 15.1 1 7.4 6.5 3.2 14.1z"
          />
          <path
            fill="#4CAF50"
            d="M24 47c5.8 0 11.1-2.2 15.1-5.7l-6.6-5.2C30.4 38.4 27.3 40 24 40c-5.2 0-9.6-3.1-11.2-7.4l-6.5 5C7.1 44.1 15.1 47 24 47z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.1 3.8-3.7 5.1l.1.1 6.6 5.2C40.1 40.1 45 32.5 45 24c0-1.3-.1-2.5-.3-3.5z"
          />
        </svg>
      </span>
      {label}
    </button>
  );
}
