-- Learning domain tables (enrollments + daily metrics for dashboard charts)

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type public.enrollment_status as enum (
      'applied',
      'payment_pending',
      'active',
      'completed',
      'cancelled'
    );
  end if;
end$$;

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  certificate_name text not null,
  track_name text not null default '기본',

  status public.enrollment_status not null default 'applied',

  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_score_percent integer check (last_score_percent between 0 and 100),
  pass_status text not null default 'unknown' check (pass_status in ('unknown', 'pass', 'fail')),

  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollments_user_id_idx on public.enrollments (user_id);
create index if not exists enrollments_updated_at_idx on public.enrollments (updated_at desc);

-- Daily learning metrics (for sparkline charts on /mypage)
create table if not exists public.learning_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_date date not null,

  questions_answered integer not null default 0 check (questions_answered >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, metric_date)
);

create index if not exists learning_metrics_user_date_idx
on public.learning_metrics (user_id, metric_date desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists enrollments_set_updated_at on public.enrollments;
create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute procedure public.set_updated_at();

drop trigger if exists learning_metrics_set_updated_at on public.learning_metrics;
create trigger learning_metrics_set_updated_at
before update on public.learning_metrics
for each row execute procedure public.set_updated_at();

alter table public.enrollments enable row level security;
alter table public.learning_metrics enable row level security;

-- enrollments: user can only see own rows; insert/update is app-controlled later (admin or server actions)
drop policy if exists "enrollments_select_own" on public.enrollments;
create policy "enrollments_select_own"
on public.enrollments for select
using (user_id = auth.uid());

drop policy if exists "enrollments_insert_own" on public.enrollments;
create policy "enrollments_insert_own"
on public.enrollments for insert
with check (user_id = auth.uid());

drop policy if exists "enrollments_update_own" on public.enrollments;
create policy "enrollments_update_own"
on public.enrollments for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- learning_metrics
drop policy if exists "learning_metrics_select_own" on public.learning_metrics;
create policy "learning_metrics_select_own"
on public.learning_metrics for select
using (user_id = auth.uid());

drop policy if exists "learning_metrics_upsert_own" on public.learning_metrics;
create policy "learning_metrics_upsert_own"
on public.learning_metrics for insert
with check (user_id = auth.uid());

drop policy if exists "learning_metrics_update_own" on public.learning_metrics;
create policy "learning_metrics_update_own"
on public.learning_metrics for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
