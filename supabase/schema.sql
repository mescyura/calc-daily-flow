-- Categories are per-user. We create defaults in-app on first visit.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.jwt()->>'sub',
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists categories_user_id_idx
on public.categories (user_id);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null default auth.jwt()->>'sub',
  category_id uuid not null references public.categories(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  spent_at date not null,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_idx
on public.expenses (user_id);

create index if not exists expenses_spent_at_idx
on public.expenses (spent_at desc);

create index if not exists expenses_category_id_idx
on public.expenses (category_id);

-- RLS
alter table public.categories enable row level security;
alter table public.expenses enable row level security;

-- categories policies
drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own"
on public.categories
for select
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own"
on public.categories
for insert
to authenticated
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own"
on public.categories
for update
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own"
on public.categories
for delete
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

-- expenses policies
drop policy if exists "expenses_select_own" on public.expenses;
create policy "expenses_select_own"
on public.expenses
for select
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "expenses_insert_own" on public.expenses;
create policy "expenses_insert_own"
on public.expenses
for insert
to authenticated
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists "expenses_delete_own" on public.expenses;
create policy "expenses_delete_own"
on public.expenses
for delete
to authenticated
using (user_id = (auth.jwt() ->> 'sub'));