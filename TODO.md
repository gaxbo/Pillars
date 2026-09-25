# To do

## Blocked on a dashboard change

- [ ] **Run `supabase/migrations/0003`, `0004` and `0005`, in that order.**
      Until `0003` runs, the landing page's form shows "Something went wrong"
      for every address. `0004` is the database half of the Security section
      below; if it stops on a constraint, an existing row already breaks that
      rule and the error names it. `0007` waits for CAPTCHA (Security).
- [ ] **Set the early access password** once `0005` is in, or nobody can
      make an account: `insert into private.early_access (code) values
      ('…') on conflict (id) do update set code = excluded.code;` The same
      line changes it. People invited from Authentication → Users → Invite
      user skip it.

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
- [x] **CAPTCHA, built and off** (2026-09-24). Cloudflare Turnstile on
      sign-up, sign-in, forgot password, the code screen and the waitlist
      (`src/lib/captcha.ts`); invisible unless Cloudflare wants a click. It
      stays off until `VITE_TURNSTILE_SITE_KEY` is set. Tested in Chrome with
      Cloudflare's test keys: tokens reach every call, a failed check says
      so instead of hanging, and forms don't move while it's idle.
- [x] **The waitlist behind Turnstile** (2026-09-24). With CAPTCHA on, the
      form goes through the `join-waitlist` Edge Function, which checks the
      token with Cloudflare first, and `0007` closes the direct route.
- [ ] **Turn CAPTCHA on, after deploying** (Cloudflare needs the sites'
      addresses). In this order, or sign-in or the waitlist breaks midway:
      1. Cloudflare (free account) → Turnstile → Add widget: both sites'
         domains, Managed. Keep the site key and the secret key.
      2. Supabase → Edge Functions → Deploy a new function → Via Editor,
         named `join-waitlist`, pasting
         `supabase/functions/join-waitlist/index.ts`. Turn off its JWT
         verification. Edge Functions → Secrets: `TURNSTILE_SECRET_KEY`.
      3. Vercel: `VITE_TURNSTILE_SITE_KEY` on both projects, then redeploy.
      4. Supabase → Authentication → Attack Protection → CAPTCHA on,
         Turnstile, the secret key.
      5. Run `0007`. Then try a sign-in and a waitlist sign-up.

      Until then a script can make the Gmail account send confirmation mail
      to anyone. Also keep `{{ .Data.full_name }}` out of the email
      templates: `0004` caps the name only when an account is created.
- [x] **Ran the Security Advisor** (2026-09-25). Its function warnings are
      fixed by `0006`: the sign-up trigger, Supabase's `rls_auto_enable`
      helper and signed-in users' access to `join_waitlist()` no longer show
      up in the API.
- [ ] **Run `0006_function_grants.sql`**, then re-run the advisor. Three
      entries stay, on purpose: `join_waitlist()` callable by anon (the
      landing's form needs it until `0007`), `waitlist` with RLS on and no
      policies (that's what keeps the list unreadable), and leaked password
      protection (paid plan).

The CSP allows network calls to `https://*.supabase.co` and nothing else,
plus Cloudflare's Turnstile script and frame. Realtime would need
`wss://*.supabase.co`, and any new outside script, font or analytics tool has
to be added to `vercel.json` too, or browsers block it.

## Known rough edges

- [ ] **Task dialog drops one frame on first open per page load** (~50ms in
      a production build; every later open, whatever it shows, ~17). Deferred
      deliberately. Ruled out on 2026-09-24, each measured: React's work
      (same both opens), painting the panel (a warm-up paint at load cut
      raster 10ms → 4ms but not the frame), the backdrop fade and panel
      slide (off, still slow), and the text field's first focus. Inside the
      long frame the main thread is idle, waiting: one-time compositor or GPU
      setup in Chrome, not anything this code does per open.
- [x] **Swipe between days on a phone.** Done (2026-09-24): a sideways swipe
      on the day moves one day, crossing into the next or previous week; the
      new day slides in from that side, strip taps included. A mostly
      vertical scroll, a short nudge, or a press-and-hold that lifts a task
      doesn't count.
- [x] **Test the phone view on a real iPhone.** Done (2026-09-24).
- [x] **Tablet portrait (768–1279px).** Done (2026-09-24): below 1280px the
      week is one row that scrolls sideways, edge to edge, snapping to a day
      and opening on today, instead of wrapping 3 / 3 / 1. 1280 and up keep
      all seven columns.
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
- [x] **Roadmap's "Exploring" items confirmed** (2026-09-24): repeating
      tasks, calendar alongside, phone reminders.
- [x] **Beta is invite-only** (2026-09-24). Making an account needs the
      early access password (`0005`), checked by the database so it can't be
      skipped. Sign-in for existing accounts is unchanged.
- [ ] **Pick an email tool: Mailchimp or Klaviyo.** Mailchimp is the better
      fit for a waitlist: Klaviyo is built around online-store data (orders,
      carts, Shopify), none of which Pillars has. Import the list from Table
      Editor → Export CSV; forwarding new sign-ups automatically can go in the
      `join-waitlist` function once one is picked.
- [x] **The logo** (2026-09-25): the meter mark with gradient pillars and a
      lowercase "pillars" wordmark. Favicons and the iPhone home-screen icon
      on both sites, the logo in the landing nav and footer and on sign in
      and sign up. Files and usage
      in `brand/`; rebuild with `npm run brand`.
- [ ] **Turn on the link preview once there's a domain.** The image is ready
      at `landing/public/og.png`. Add `<meta property="og:image"
      content="https://<domain>/og.png">` to `landing/index.html` and switch
      `twitter:card` to `summary_large_image`: most sites won't load a
      preview image from a relative address.

## Accessibility

- [x] **Move the app's buttons to `--gradient-primary-strong`.** Done
      (2026-09-23) through the shared `.btn-primary` class in `tokens.css`.
- [x] **Test with a real screen reader.** Done (2026-09-24), on top of
      axe-core's zero WCAG 2.2 AA violations across all 14 screens.

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
