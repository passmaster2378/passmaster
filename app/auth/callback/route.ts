import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function safeNextPath(rawNext: string | null) {
  if (!rawNext) return "/mypage";
  if (!rawNext.startsWith("/")) return "/mypage";
  if (rawNext.startsWith("//")) return "/mypage";
  return rawNext;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) {
    const params = new URLSearchParams();
    params.set("error", "OAuth code가 없습니다. 다시 로그인해 주세요.");
    return NextResponse.redirect(new URL(`/login?${params.toString()}`, url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const params = new URLSearchParams();
    params.set("error", error.message);
    return NextResponse.redirect(new URL(`/login?${params.toString()}`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

