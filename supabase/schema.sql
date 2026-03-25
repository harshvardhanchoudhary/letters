-- ════════════════════════════════════════════════════════════════════════════
-- letters — database schema
-- Run this in your Supabase project → SQL Editor → New query
-- ════════════════════════════════════════════════════════════════════════════
--
-- LEARN: This is SQL — the language for defining and querying databases.
-- Each CREATE TABLE defines a "table" (like a spreadsheet with typed columns).
-- The "references" keyword creates a foreign key: a link between two tables.
-- Row Level Security (RLS) is Supabase's way of enforcing "who can see what"
-- at the database level — even if the app code has a bug, the database
-- itself won't return rows the user isn't allowed to see.
-- ════════════════════════════════════════════════════════════════════════════


-- ── Profiles ────────────────────────────────────────────────────────────────
-- One row per user. Automatically created when someone signs up (see trigger below).

create table if not exists public.profiles (
  id           uuid        references auth.users(id) on delete cascade primary key,
  email        text        unique not null,
  display_name text,
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;

-- Both users can read each other's profile (needed to show names in letters)
create policy "Profiles viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Each user can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── Auto-create profile on signup ────────────────────────────────────────────
-- LEARN: A "trigger" is a function the database calls automatically when
-- something happens — in this case, whenever a new user is created in the
-- auth.users table, we create a matching row in public.profiles.
-- This way the app always has a profile to query without extra code.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── Letters ──────────────────────────────────────────────────────────────────

create table if not exists public.letters (
  id       uuid        default gen_random_uuid() primary key,
  from_id  uuid        references public.profiles(id) on delete cascade not null,
  to_id    uuid        references public.profiles(id) on delete cascade not null,
  subject  text,
  body     text        not null,
  sent_at  timestamptz default now() not null,
  read_at  timestamptz,                          -- null = unread
  created_at timestamptz default now() not null
);

alter table public.letters enable row level security;

-- Only the sender and recipient can read a letter
create policy "Letters viewable by sender and recipient"
  on public.letters for select
  to authenticated
  using (auth.uid() = from_id or auth.uid() = to_id);

-- You can only send a letter as yourself
create policy "Users can send letters"
  on public.letters for insert
  to authenticated
  with check (auth.uid() = from_id);

-- Only the recipient can mark a letter as read
create policy "Recipients can mark letters as read"
  on public.letters for update
  to authenticated
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

-- Letters are permanent — no deleting
-- (No DELETE policy = nobody can delete, ever)
