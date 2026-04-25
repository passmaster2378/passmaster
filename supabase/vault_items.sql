-- PassMaster vault items (server-side encryption)

-- Enable uuid generator (Supabase usually has this available; safe to keep).
create extension if not exists "pgcrypto";

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  username text,
  url text,
  note text,
  folder text,
  favorite boolean not null default false,

  password_encrypted text not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_items_user_id_idx on public.vault_items (user_id);
create index if not exists vault_items_updated_at_idx on public.vault_items (updated_at desc);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists vault_items_set_updated_at on public.vault_items;
create trigger vault_items_set_updated_at
before update on public.vault_items
for each row execute procedure public.set_updated_at();

alter table public.vault_items enable row level security;

-- CRUD policies: only the owner can access
drop policy if exists "vault_items_select_own" on public.vault_items;
create policy "vault_items_select_own"
on public.vault_items for select
using (user_id = auth.uid());

drop policy if exists "vault_items_insert_own" on public.vault_items;
create policy "vault_items_insert_own"
on public.vault_items for insert
with check (user_id = auth.uid());

drop policy if exists "vault_items_update_own" on public.vault_items;
create policy "vault_items_update_own"
on public.vault_items for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "vault_items_delete_own" on public.vault_items;
create policy "vault_items_delete_own"
on public.vault_items for delete
using (user_id = auth.uid());

