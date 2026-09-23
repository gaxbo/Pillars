-- The landing page's waitlist.
--
-- Anyone can add an address; nobody can read the list back through the API.
-- There is no select policy on purpose: the list is read and exported from
-- the dashboard (Table Editor → Export to CSV), where the service role
-- bypasses RLS. That keeps one visitor from harvesting everyone else's email.
--
-- `source` records which form on the page an address came from (hero or
-- footer) so the two can be compared later.
--
-- Safe to run twice.

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
create policy "anyone can join the waitlist" on waitlist
  for insert to anon, authenticated
  with check (true);
