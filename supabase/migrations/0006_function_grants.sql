-- Function grants, from the Security Advisor (2026-09-25).
--
-- Supabase lets anon and signed-in users call any function in `public`
-- through /rest/v1/rpc. Three SECURITY DEFINER functions were on offer:
--
--   * handle_new_user() is the sign-up trigger from 0001 and 0002. Postgres
--     won't run a trigger function outside its trigger, so the grant was
--     never usable, but the API has no reason to list it. Triggers don't
--     check EXECUTE when they fire, so sign-up is unaffected.
--   * rls_auto_enable() isn't from this repo; by its name, Supabase's helper
--     that turns RLS on for new tables. Revoked only if it's a trigger or
--     event trigger function, which fires the same without the grant.
--   * join_waitlist() is only ever called by the landing page, as anon.
--     Signed-in users lose it here; anon loses it in 0007, once CAPTCHA is on.
--
-- Still listed afterwards, on purpose: join_waitlist() for anon (until
-- 0007), `waitlist` with RLS on and no policies (so the API can't read it),
-- and leaked password protection (a paid-plan feature).
--
-- Safe to run twice.

revoke execute on function handle_new_user() from public, anon, authenticated;
revoke execute on function join_waitlist(text, text) from authenticated;

do $$
begin
  if exists (
    select 1 from pg_proc
    where oid = to_regprocedure('public.rls_auto_enable()')
      and prorettype in ('trigger'::regtype, 'event_trigger'::regtype)
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
