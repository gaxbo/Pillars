# To do

## Blocked on a dashboard change

- [ ] **Run `supabase/migrations/0003_waitlist.sql`.** Until it runs, the
      landing page's form shows "Something went wrong" for every address.

- [ ] **Set the email code length to 6.** Supabase → Authentication → Sign In /
      Providers → Email → *Email OTP Length*. The project sends 8-digit codes,
      but `/verify` takes exactly six (`CodeInput` trims to 6), so every
      sign-up is stuck on that screen until this changes.
- [ ] Add the deployed origin as a redirect URL once there is one
      (Authentication → URL Configuration). `http://localhost:5173` is enough
      for now.
- [ ] **Move sign-up email off personal Gmail before real launch.** Custom SMTP
      is `smtp.gmail.com` with an App Password: fine for testers (~500/day),
      but mail comes from a personal address. A domain plus Resend or similar.

Password reset stays a link on purpose — `/reset-password` is built for the
link, so its template needs no change.

## Verified (2026-09-22)

Against the real project, via a real sign-up of `gabo.page04+pillarstest@gmail.com`:
the code email arrives; `0002` is applied and the name lands in both
`raw_user_meta_data` and `profiles.full_name`; `handle_new_user` creates the
profile row at sign-up; onboarding writes the profile fields, five pillars and
a goal, all with the new user's `user_id`; anon sees none of those rows.
Signing in unconfirmed routes to `/verify`. Delete the test user
(Authentication → Users) when it's no longer useful.

## Known rough edges

- [ ] **Task dialog drops one frame on first open per page load** (~42ms,
      measured). Everything after is ~7ms. Cause is first-paint of that
      subtree; parking it off-screen and pre-seeding its content got it from
      ~56ms down, but not to zero. Deferred deliberately.
- [ ] **Swipe between days on a phone.** The single-day view switches days
      from the strip only. A horizontal swipe on the day itself would be the
      expected gesture, but it has to stay out of the way of a task drag.
- [ ] **Test the phone view on a real iPhone.** Verified in Chrome's touch
      emulation (tap, press-and-hold drag, scrolling, sticky strip), not in iOS
      Safari itself — long-press text selection is the thing most likely to
      differ.
- [ ] **Tablet portrait (768–1279px)** still gets the 3-column grid, so the
      week wraps as 3 / 3 / 1. Works, but it's the next layout worth a look.

## Landing page

- [ ] **Deploy it** as its own Vercel project: same repo, Build
      `npm run build:landing`, Output `dist-landing`, env vars
      `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- [ ] **Pick an email tool** and import the list (Table Editor → Export CSV),
      or forward new sign-ups to it automatically.
- [ ] **Rate-limit the waitlist.** Anyone can insert straight into the table.
      Fine at this size; before it matters, put inserts behind an Edge
      Function with Turnstile, and forward to the email tool from there.
- [ ] An Open Graph image, once there's a domain to host it on.

## Accessibility

- [ ] **Move the app's buttons to `--gradient-primary-strong`.** White on
      `--gradient-primary` is 2.4 to 2.9:1, under WCAG AA's 4.5:1. The landing
      already uses the stronger version.

## Housekeeping

- [ ] Deploy somewhere (Vercel/Netlify) so testers get a URL.

## Notes to self

- **`pkill -f vite` does not kill Vite on Windows.** It leaves the node
  process alive holding the port, so the next `vite` grabs 5174, 5175, … while
  the browser keeps hitting a stale server on 5173. Symptom: source changes
  appear to have no effect, or dev and production disagree. Kill by port
  instead: `Get-NetTCPConnection -LocalPort 5173 | Stop-Process -Id { $_.OwningProcess }`,
  or run with `--strictPort` so a clash fails loudly rather than silently
  moving ports.
- Stylesheets live in `src/index.css` rather than being imported from a
  component. A convention for consistency, not a fix for anything.
- Blocking UI animates in CSS with `animation-fill-mode: both`, never JS.
- Overlays stay mounted and toggle visibility rather than mounting on open.
