-- Admin role + admin access to orders

-- 1) Add admin flag to profiles
alter table public.profiles
add column if not exists is_admin boolean not null default false;

-- Allow admins to update other users' profiles (for plan activation, etc.)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
on public.profiles for update
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
);

-- 2) Helper expression for admin checks
-- We use the admin's own profile row (auth.uid()) so it works with existing RLS.

-- 3) Orders: allow admins to read all orders
drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin"
on public.orders for select
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
);

-- 4) Orders: allow admins to update order status
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders for update
using (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
);

-- Note: do NOT enable update for regular users (manual approval flow).

-- Notifications: allow admins to insert notifications for users
drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin"
on public.notifications for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and p.is_admin = true
  )
);

