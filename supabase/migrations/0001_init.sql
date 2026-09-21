-- Pillars schema.
--
-- Every table is scoped to one user and guarded by RLS: a row is only visible
-- when its user_id equals auth.uid(). There is no "shared" data in the MVP, so
-- the policies are deliberately uniform and boring — that is the point.

create type task_priority as enum ('high', 'medium', 'low');
create type task_status   as enum ('open', 'done');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table profiles (
  id                  uuid primary key references auth.users on delete cascade,
  archetypes          text[]      not null default '{}',
  -- Set in onboarding's "plan your time" step; drives the weekly reminder.
  planning_weekday    smallint    not null default 0 check (planning_weekday between 0 and 6),
  planning_time       time        not null default '18:00',
  -- The end-of-day nudge.
  eod_reminder_time   time        not null default '20:00',
  timezone            text        not null default 'UTC',
  onboarded_at        timestamptz,
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- pillars
-- ---------------------------------------------------------------------------

create table pillars (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null check (length(trim(name)) between 1 and 40),
  sort_order  integer     not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);

create index pillars_user_order_idx on pillars (user_id, sort_order);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------

create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  pillar_id   uuid        not null references pillars on delete cascade,
  title       text        not null check (length(trim(title)) between 1 and 80),
  description text        not null default '',
  -- Goals are quantifiable by design: "3" of "sessions".
  target      integer     not null default 1 check (target > 0),
  unit        text        not null default '',
  -- Monday of the week this goal is scoped to.
  week_start  date        not null,
  created_at  timestamptz not null default now(),

  -- One goal per pillar per week keeps the This Week panel unambiguous.
  unique (pillar_id, week_start)
);

create index goals_user_week_idx on goals (user_id, week_start);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid          not null references auth.users on delete cascade,
  pillar_id      uuid          not null references pillars on delete cascade,
  -- A task does not have to serve a goal.
  goal_id        uuid          references goals on delete set null,
  title          text          not null check (length(trim(title)) between 1 and 200),
  notes          text,
  scheduled_date date          not null,
  priority       task_priority not null default 'medium',
  status         task_status   not null default 'open',
  completed_at   timestamptz,
  sort_order     integer       not null default 0,
  created_at     timestamptz   not null default now(),

  -- completed_at and status must agree.
  constraint tasks_completion_consistent check (
    (status = 'done' and completed_at is not null) or
    (status = 'open' and completed_at is null)
  )
);

create index tasks_user_date_idx  on tasks (user_id, scheduled_date);
create index tasks_cell_order_idx on tasks (user_id, scheduled_date, pillar_id, sort_order);
create index tasks_goal_idx       on tasks (goal_id) where goal_id is not null;

-- ---------------------------------------------------------------------------
-- week_reviews  (powers the weekly planning report card)
-- ---------------------------------------------------------------------------

create table week_reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users on delete cascade,
  week_start      date        not null,
  tasks_done      integer     not null default 0,
  tasks_open      integer     not null default 0,
  goals_completed integer     not null default 0,
  goals_total     integer     not null default 0,
  created_at      timestamptz not null default now(),

  unique (user_id, week_start)
);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table profiles     enable row level security;
alter table pillars      enable row level security;
alter table goals        enable row level security;
alter table tasks        enable row level security;
alter table week_reviews enable row level security;

create policy "own profile" on profiles
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own pillars" on pillars
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own goals" on goals
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own tasks" on tasks
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own week reviews" on week_reviews
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- A profile row must exist the moment a user signs up, or the app has to
-- special-case "signed in but no profile" everywhere.
-- ---------------------------------------------------------------------------

create function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
