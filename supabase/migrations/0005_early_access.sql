-- Early access: a new account needs the access password from an invite.
--
-- Checked here, not in the app, because the app's check could be skipped by
-- calling Supabase directly. Sign-up sends the password as
-- options.data.access_code; the trigger below compares it before the account
-- row is written, then strips it so it never lands in raw_user_meta_data. A
-- wrong or missing password fails the sign-up before any email goes out.
--
-- The password lives in private.early_access, which the API can't reach
-- (only `public` is exposed). Until one is set, nobody can sign up. People
-- invited from the dashboard (Authentication → Users → Invite user) skip the
-- check.
--
-- Set or change the password in the SQL Editor:
--
--   insert into private.early_access (code) values ('the-password')
--   on conflict (id) do update set code = excluded.code;
--
-- Open sign-up to everyone later:
--
--   drop trigger check_early_access on auth.users;
--
-- Safe to run twice.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- One row: the primary key can only be true.
create table if not exists private.early_access (
  id    boolean primary key default true check (id),
  code  text not null check (char_length(trim(code)) >= 6)
);

-- With no policies, no API role can read it even if `private` were ever
-- exposed. The trigger below and the SQL Editor both run as the table's
-- owner, which RLS doesn't apply to.
alter table private.early_access enable row level security;

create or replace function private.check_early_access() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  expected text := (select trim(code) from private.early_access);
  given    text := trim(new.raw_user_meta_data ->> 'access_code');
begin
  if new.invited_at is null and (expected is null or given is distinct from expected) then
    raise exception 'early access password missing or wrong';
  end if;
  new.raw_user_meta_data := new.raw_user_meta_data - 'access_code';
  return new;
end;
$$;

drop trigger if exists check_early_access on auth.users;
create trigger check_early_access
  before insert on auth.users
  for each row execute function private.check_early_access();
