-- Ownership that follows the links, and limits on free text.
--
-- 0001's policies check that a row's user_id is the caller's, but nothing
-- checked that the pillar or goal a row points at belongs to the same user.
-- Knowing another account's pillar id was enough to hang a goal off it, and
-- since goals are unique per (pillar, week), that goal would stop the owner
-- from setting their own that week. Foreign keys on (id, user_id) make the
-- database refuse the mismatch.
--
-- The free-text columns the app never lets anyone type into at length had
-- no limit, so one account could park megabytes in a field shown as a line.
--
-- Safe to run twice.

-- ---------------------------------------------------------------------------
-- Composite keys
-- ---------------------------------------------------------------------------

-- Dropped first so the unique constraints they depend on can be rebuilt.
alter table goals drop constraint if exists goals_pillar_owner_fkey;
alter table tasks drop constraint if exists tasks_pillar_owner_fkey;
alter table tasks drop constraint if exists tasks_goal_owner_fkey;

-- id is already unique; these only let a foreign key name both columns.
alter table pillars drop constraint if exists pillars_id_user_key;
alter table pillars add constraint pillars_id_user_key unique (id, user_id);
alter table goals drop constraint if exists goals_id_user_key;
alter table goals add constraint goals_id_user_key unique (id, user_id);

-- These replace 0001's single-column keys and delete the same way: removing
-- a pillar removes its goals and tasks; removing a goal unlinks its tasks.
alter table goals drop constraint if exists goals_pillar_id_fkey;
alter table goals add constraint goals_pillar_owner_fkey
  foreign key (pillar_id, user_id) references pillars (id, user_id) on delete cascade;

alter table tasks drop constraint if exists tasks_pillar_id_fkey;
alter table tasks add constraint tasks_pillar_owner_fkey
  foreign key (pillar_id, user_id) references pillars (id, user_id) on delete cascade;

-- set null (goal_id): a bare "set null" would null user_id too.
alter table tasks drop constraint if exists tasks_goal_id_fkey;
alter table tasks add constraint tasks_goal_owner_fkey
  foreign key (goal_id, user_id) references goals (id, user_id) on delete set null (goal_id);

-- ---------------------------------------------------------------------------
-- Length limits
-- ---------------------------------------------------------------------------

-- Also bounds the name Supabase can put in a new account's confirmation
-- email: sign-up writes it to raw_user_meta_data and handle_new_user copies
-- it here, so a longer one fails the sign-up before any email goes out.
alter table profiles drop constraint if exists profiles_full_name_length;
alter table profiles add constraint profiles_full_name_length
  check (char_length(full_name) <= 100);

alter table profiles drop constraint if exists profiles_timezone_length;
alter table profiles add constraint profiles_timezone_length
  check (char_length(timezone) <= 64);

-- Onboarding picks at most three, from a fixed catalog of short ids.
alter table profiles drop constraint if exists profiles_archetypes_size;
alter table profiles add constraint profiles_archetypes_size
  check (cardinality(archetypes) <= 10 and char_length(array_to_string(archetypes, '')) <= 400);

alter table goals drop constraint if exists goals_description_length;
alter table goals add constraint goals_description_length
  check (char_length(description) <= 500);

alter table goals drop constraint if exists goals_unit_length;
alter table goals add constraint goals_unit_length
  check (char_length(unit) <= 30);

alter table tasks drop constraint if exists tasks_notes_length;
alter table tasks add constraint tasks_notes_length
  check (notes is null or char_length(notes) <= 2000);
