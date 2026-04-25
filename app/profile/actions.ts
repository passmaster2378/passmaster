"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase/server";

export type ProfileRow = {
  user_id: string;
  full_name: string;
  phone: string;
  birthdate: string | null; // YYYY-MM-DD
};

export async function getMyProfile(): Promise<ProfileRow | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,full_name,phone,birthdate")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    // Table missing -> handled by UI
    if (String((error as { code?: string }).code) === "42P01") return null;
    throw new Error(error.message);
  }

  return (data as ProfileRow | null) ?? null;
}

export async function upsertMyProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();

  if (!full_name) throw new Error("이름을 입력해 주세요.");
  if (!phone) throw new Error("휴대폰 번호를 입력해 주세요.");

  const birthdate = birthdateRaw ? birthdateRaw : null;

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      full_name,
      phone,
      birthdate,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/mypage");
}

