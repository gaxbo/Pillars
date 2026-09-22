-- Capture the name at sign-up.
--
-- It lands in two places on purpose:
--   * auth.users.raw_user_meta_data — where Supabase's email templates can
--     reach it, as {{ .Data.full_name }}
--   * profiles.full_name — where the app and any RLS-protected query can use
--     it alongside the rest of the profile
--
-- The trigger copies one to the other, so a single signUp() call populates
-- both and they cannot drift apart.

alter table profiles
  add column full_name text not null default '';

-- Replaces the version in 0001, which only inserted the id.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do update
    set full_name = coalesce(
      nullif(trim(excluded.full_name), ''),
      public.profiles.full_name
    );
  return new;
end;
$$;
