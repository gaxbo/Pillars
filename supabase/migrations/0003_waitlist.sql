-- The landing page's waitlist.
--
-- The API can't touch the table: RLS is on with no policies, and anon's
-- grants are revoked. Addresses come in through join_waitlist(), which
-- answers the same way whether the address is new or already listed, so the
-- form can't be used to check whether someone has signed up. The list is
-- read and exported from the dashboard (Table Editor → Export to CSV), where
-- the service role bypasses RLS.
--
-- `source` records which form on the page an address came from (hero or
-- footer) so the two can be compared later.
--
-- Safe to run twice, and over the first version of this file, which let
-- anon insert into the table directly.

create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now(),

  -- A loose shape check. The form validates properly; this only stops junk
  -- written straight at the API.
  constraint waitlist_email_shape
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  constraint waitlist_source_length
    check (source is null or char_length(source) <= 40)
);

-- One entry per address, regardless of how it was capitalised.
create unique index if not exists waitlist_email_key on waitlist (lower(email));

alter table waitlist enable row level security;

drop policy if exists "anyone can join the waitlist" on waitlist;
revoke all on waitlist from anon, authenticated;

-- A repeat address is skipped rather than rejected: a unique-violation
-- error would tell anyone who asked that the address is on the list.
create or replace function join_waitlist(email text, source text default null)
returns void
language sql security definer set search_path = '' as $$
  insert into public.waitlist (email, source)
  values (lower(trim(join_waitlist.email)), join_waitlist.source)
  on conflict do nothing;
$$;

revoke all on function join_waitlist(text, text) from public;
grant execute on function join_waitlist(text, text) to anon, authenticated;
