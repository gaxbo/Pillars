# To do

## Blocked on a dashboard change

- [ ] **Run `supabase/migrations/0003_waitlist.sql`, then
      `0004_ownership_and_limits.sql`.** Until `0003` runs, the landing
      page's form shows "Something went wrong" for every address. `0004` is
      the database half of the Security section below; if it stops on a
      constraint, an existing row already breaks that rule and the error
      names it.

- [ ] **Set the email code length to 6.** Supabase → Authentication → Sign In /
      Providers → Email → *Email OTP Length*. The project sends 8-digit codes,
      but `/verify` takes exactly six (`CodeInput` trims to 6), so every
      sign-up is stuck on that screen until this changes.
- [ ] Add the deployed origin as a redirect URL once there is one
      (Authentication → URL Configuration). `http://localhost:5173` is enough
      for now. Add exact addresses: a wildcard like `https://*.vercel.app/**`
      would let any Vercel site receive sign-in and reset links, tokens
      included.
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

## Security

Reviewed 2026-09-24. No secrets in git history, `npm audit` clean, every
table behind row level security. The code fixes below are done and tested;
what's left is mostly dashboard settings.

- [x] **Setting a new password needs the reset link.** `/reset-password`
      shows its form only to the session the emailed link created, and
      `updatePassword` refuses any other, so an unlocked laptop isn't enough
      to take an account. Checked in Chrome against a mocked Supabase: from
      the link, form; signed in normally, signed out, or a faked link, none.
- [x] **Rows can only point at their owner's pillars and goals** (`0004`).
      Before, another account's pillar id was enough to add a goal to it,
      which blocked the owner's own goal for that week.
- [x] **Length limits** on name (100), task notes (2,000), goal description
      (500), unit (30), timezone and archetypes (`0004`). The sign-up name
      field stops at 100.
- [x] **The waitlist no longer says who's on it.** It used to answer "already
      on the list" to anyone. `join_waitlist()` (`0003`) answers the same
      either way, and the table itself is closed to the API.
- [x] **Security headers** in `vercel.json`, which both Vercel projects
      read: a Content-Security-Policy (scripts from the site itself, network
      calls to Supabase only), no framing by other sites, `nosniff`, and a
      referrer policy. Every app and landing screen loads with no violations.
- [ ] **Turn on Secure password change** (Authentication → Sign In /
      Providers → Email). The page's check covers the app; this covers the
      API, which anyone holding a session can call directly.
- [ ] **Set the minimum password length to 8** on the same page. The app
      asks for 8, but Supabase defaults to 6 and a direct API call skips the
      app.
- [ ] **CAPTCHA on sign-up** (Authentication → Attack Protection; Cloudflare
      Turnstile is free), then pass its token in `signUp`, `signIn` and
      `sendReset`. Until then a script can make the Gmail account send
      confirmation mail to anyone. Also keep `{{ .Data.full_name }}` out of
      the email templates: `0004` caps the name only when an account is
      created.
- [ ] **Rate-limit the waitlist** (moved from Landing page). Anyone can call
      `join_waitlist()`. Fine at this size; before it matters, put it behind
      an Edge Function with Turnstile, and forward to the email tool from
      there.
- [ ] **Run the Security Advisor** (Advisors → Security Advisor) once `0003`
      and `0004` are in. It checks the live database, which the repo can't.

The CSP allows network calls to `https://*.supabase.co` and nothing else.
Realtime would need `wss://*.supabase.co`, and any new outside script, font
or analytics tool has to be added to `vercel.json` too, or browsers block it.

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
- [x] **Name fields stop at the database's limits.** Done (2026-09-24):
      pillar names (40), goal titles (80) and task titles (200) failed to
      save past `0001`'s caps; every input for them now stops there, from one
      list in `src/data/limits.ts`.

## Landing page

- [ ] **Deploy it** as its own Vercel project: same repo, Build
      `npm run build:landing`, Output `dist-landing`, env vars
      `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_URL`
      (the app's address, for the nav's early access sign-in; without it the
      link points at this site's own `/sign-in`).
- [ ] **Confirm the roadmap's "Exploring" items** (`landing/RoadmapPage.tsx`):
      repeating tasks, calendar alongside, phone reminders. They're
      placeholders, labelled as ideas, not decisions.
- [ ] **Beta is open, not gated.** "Early access sign in" goes to the app's
      normal sign-in, and anyone can still make an account at `/sign-up`.
      If early access should mean invited only, gate sign-up (an allowlist
      table, or turn off sign-ups in Supabase and invite users).
- [ ] **Pick an email tool** and import the list (Table Editor → Export CSV),
      or forward new sign-ups to it automatically.
- [ ] An Open Graph image, once there's a domain to host it on.

## Accessibility

- [x] **Move the app's buttons to `--gradient-primary-strong`.** Done
      (2026-09-23) through the shared `.btn-primary` class in `tokens.css`.
- [ ] **Test with a real screen reader.** axe-core reports zero WCAG 2.2 AA
      violations on all 14 screens and states (landing, roadmap, board on
      desktop and phone, task dialog, goals panel, check-in, weekly banner and
      review, settings, sign-in, sign-up, onboarding), and keyboard flows pass
      in Chrome. A person still needs to run VoiceOver (macOS, iOS) and NVDA
      through: sign in, add a task, move it by keyboard, complete it, the
      evening check-in, the weekly review, settings.

- [ ] **Set `VITE_SUPPORT_EMAIL` and `VITE_LANDING_URL`** for the app. Help &
      Support shows no contact line, and About Us no roadmap link, until they're set.

## Done 2026-09-23

- [x] Undo for delete (5 seconds), on the board and in the evening check-in.
- [x] Failed saves retry at 2s, 5s, 10s, then offer "Try again".
- [x] Settings, as the design's account menu: Account, Notifications, Pillars & goals
      (not in the design), Help & Support, About Us, Log out. Each opens a page.
- [x] New tasks link to their pillar's goal by default.
- [x] The evening check-in includes open tasks from the last six days.
- [x] The weekly review is a banner on the board, not a redirect.
- [x] "Pick a day" in the task's move menu.
- [x] Label type at 12px, weight 400.

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
