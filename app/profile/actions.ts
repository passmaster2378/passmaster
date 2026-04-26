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
  const birthY = String(formData.get("birth_y") ?? "").trim();
  const birthM = String(formData.get("birth_m") ?? "").trim();
  const birthD = String(formData.get("birth_d") ?? "").trim();

  if (!full_name) throw new Error("이름을 입력해 주세요.");
  if (!phone) throw new Error("휴대폰 번호를 입력해 주세요.");

  let birthdate: string | null = null;
  if (birthY || birthM || birthD) {
    if (!birthY || !birthM || !birthD) {
      throw new Error("생년월일은 연·월·일을 모두 입력하거나 모두 비워 주세요.");
    }
    const yi = Number(birthY);
    const mi = Number(birthM);
    const di = Number(birthD);
    if (!Number.isInteger(yi) || yi < 1900 || yi > 2100) {
      throw new Error("출생 연도를 확인해 주세요.");
    }
    if (!Number.isInteger(mi) || mi < 1 || mi > 12) {
      throw new Error("출생 월을 확인해 주세요.");
    }
    if (!Number.isInteger(di) || di < 1 || di > 31) {
      throw new Error("출생 일을 확인해 주세요.");
    }
    const pad = (n: number) => n.toString().padStart(2, "0");
    const candidate = `${yi}-${pad(mi)}-${pad(di)}`;
    const t = Date.parse(`${candidate}T00:00:00`);
    if (Number.isNaN(t)) {
      throw new Error("올바른 날짜를 입력해 주세요.");
    }
    const d = new Date(t);
    if (d.getFullYear() !== yi || d.getMonth() + 1 !== mi || d.getDate() !== di) {
      throw new Error("해당 달에 없는 날짜입니다.");
    }
    birthdate = candidate;
  }

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

