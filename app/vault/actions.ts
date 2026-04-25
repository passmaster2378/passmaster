"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { decryptSecret, encryptSecret } from "../lib/vault/crypto";

export type VaultItemRow = {
  id: string;
  title: string;
  username: string | null;
  url: string | null;
  note: string | null;
  folder: string | null;
  favorite: boolean;
  password_encrypted: string;
  updated_at: string;
};

export type VaultItemListItem = Omit<VaultItemRow, "password_encrypted">;

export async function listVaultItems(): Promise<VaultItemListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vault_items")
    .select("id,title,username,url,note,folder,favorite,updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as VaultItemListItem[];
}

export async function createVaultItem(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw new Error(userError.message);
  if (!user) throw new Error("Not authenticated.");

  const title = String(formData.get("title") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const folder = String(formData.get("folder") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!title) throw new Error("사이트/이름을 입력해 주세요.");
  if (!password) throw new Error("비밀번호를 입력해 주세요.");

  const password_encrypted = encryptSecret(password);

  const { error } = await supabase.from("vault_items").insert({
    user_id: user.id,
    title,
    username: username || null,
    url: url || null,
    note: note || null,
    folder: folder || null,
    favorite: false,
    password_encrypted,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/mypage");
}

export async function deleteVaultItem(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/mypage");
}

export async function revealVaultPassword(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vault_items")
    .select("password_encrypted")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  if (!data?.password_encrypted) throw new Error("No password stored.");
  return decryptSecret(String(data.password_encrypted));
}

