-- Add simple subscription fields to profiles (fast MVP)

alter table public.profiles
add column if not exists plan text not null default 'free',
add column if not exists plan_expires_at timestamptz;

create index if not exists profiles_plan_expires_idx
on public.profiles (plan, plan_expires_at);

-- Security hardening: prevent users from upgrading themselves.
-- Admins can still update via profiles_update_admin policy in supabase/admin.sql.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and coalesce(is_admin, false) = false
  and plan = 'free'
  and plan_expires_at is null
);

