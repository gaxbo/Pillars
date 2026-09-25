-- The waitlist only through the join-waitlist Edge Function.
--
-- Run this LAST, and only once CAPTCHA is live: the join-waitlist function
-- deployed with its TURNSTILE_SECRET_KEY, and the landing page redeployed
-- with VITE_TURNSTILE_SITE_KEY. Before then the form still calls
-- join_waitlist() directly, and this would break it.
--
-- After it, the function (which checks the Turnstile token first) is the
-- only way onto the list; it calls join_waitlist() as the service role.
--
-- Undo, if the form needs to call it directly again:
--
--   grant execute on function join_waitlist(text, text) to anon, authenticated;
--
-- Safe to run twice.

revoke execute on function join_waitlist(text, text) from public, anon, authenticated;
grant execute on function join_waitlist(text, text) to service_role;
