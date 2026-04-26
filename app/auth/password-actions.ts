"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase/server";

export async function changeAccountPassword(
  currentPassword: string,
  newPassword: string,
) {
  const cur = currentPassword.trim();
  const next = newPassword;
  if (!cur) throw new Error("기존 비밀번호를 입력해 주세요.");
  if (next.length < 6) throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
  if (cur === next) throw new Error("새 비밀번호는 기존과 달라야 합니다.");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) throw new Error("로그인이 필요합니다.");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: cur,
  });
  if (signInError) {
    throw new Error("기존 비밀번호가 올바르지 않습니다.");
  }

  const { error: upError } = await supabase.auth.updateUser({ password: next });
  if (upError) throw new Error(upError.message);
  revalidatePath("/mypage");
  revalidatePath("/vault");
}
