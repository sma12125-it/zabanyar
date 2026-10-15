-- Zabanyar accounts + progress sync. Run once in Supabase → SQL Editor → New query → Run.
-- Every table has Row Level Security: a signed-in user can only see/change their own row,
-- so the public "anon" key in config.js is safe to publish.

-- 1) Profiles: unique username per account
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- 2) Progress: one JSON document per user (lessons, SRS cards, XP, program, settings — never plain API keys)
create table if not exists public.progress (
  user_id    uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  data       jsonb not null default '{}'::jsonb,
  keys_enc   jsonb,              -- optional: AES-GCM ciphertext made in the browser; server never sees the passphrase
  updated_at timestamptz not null default now(),
  constraint progress_size check (pg_column_size(data) < 2000000)
);
alter table public.progress enable row level security;
drop policy if exists "own progress select" on public.progress;
drop policy if exists "own progress insert" on public.progress;
drop policy if exists "own progress update" on public.progress;
drop policy if exists "own progress delete" on public.progress;
create policy "own progress select" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "own progress insert" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own progress update" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own progress delete" on public.progress for delete to authenticated using ((select auth.uid()) = user_id);

-- 3) Create the profile automatically from the username given at sign-up
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare u text := lower(coalesce(new.raw_user_meta_data->>'username', ''));
begin
  if u !~ '^[a-z0-9_]{3,20}$' or exists (select 1 from public.profiles where username = u) then
    u := 'user_' || substr(replace(new.id::text, '-', ''), 1, 12);
  end if;
  insert into public.profiles (id, username) values (new.id, u);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 4) Username availability check for the sign-up form (returns only true/false)
create or replace function public.username_available(p_username text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where username = lower(p_username));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- 5) OPTIONAL: sign in with username instead of email.
--    Trade-off: anyone who knows a username can learn its e-mail address. Leave commented out unless you accept that.
-- create or replace function public.login_email(p_username text) returns text
-- language sql stable security definer set search_path = '' as $$
--   select u.email::text from auth.users u join public.profiles p on p.id = u.id where p.username = lower(p_username);
-- $$;
-- grant execute on function public.login_email(text) to anon;
