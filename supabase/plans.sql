-- Add simple subscription fields to profiles (fast MVP)

alter table public.profiles
add column if not exists plan text not null default 'free',
add column if not exists plan_expires_at timestamptz;

create index if not exists profiles_plan_expires_idx
on public.profiles (plan, plan_expires_at);

