-- PassMaster orders (bank transfer / manual approval friendly)

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'paid', 'cancelled', 'rejected');
  end if;
end$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  depositor_name text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'KRW',

  method text not null default 'bank_transfer',
  status public.order_status not null default 'pending',

  memo text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute procedure public.set_updated_at();

alter table public.orders enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders for select
using (user_id = auth.uid());

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
on public.orders for insert
with check (user_id = auth.uid());
