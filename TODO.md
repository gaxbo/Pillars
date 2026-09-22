# To do

## Blocked on a dashboard change

- [ ] **Run `supabase/migrations/0002_profile_name.sql`.** Adds
      `profiles.full_name` and updates the signup trigger to copy the name
      out of auth metadata. Until it runs, sign-up still works but the name
      only lands in `auth.users.raw_user_meta_data`, not in `profiles`.

- [ ] **Switch the signup email to a 6-digit code.** Supabase → Authentication →
      Emails → *Confirm signup*. Replace `{{ .ConfirmationURL }}` with
      `{{ .Token }}`. Until then the email sends a link, which still signs you
      in and lands on onboarding — but `/verify` asks for a code it never
      receives. Decide: change the template, or simplify `/verify` to
      "click the link" and drop the code entry.
- [ ] **Same edit for password reset**, if codes are wanted there too — it's a
      separate template (*Reset password*).
- [ ] Add the deployed origin as a redirect URL once there is one
      (Authentication → URL Configuration). `http://localhost:5173` is enough
      for now.

## Verification still owed

- [ ] Confirm the name reaches both places after 0002:
      `auth.users.raw_user_meta_data->>'full_name'` and `profiles.full_name`.

- [ ] Confirm a real sign-up writes a `profiles` row via the
      `handle_new_user` trigger, and that onboarding's pillars and goals land
      with the right `user_id`. Schema, columns, and RLS are verified; the
      write path is not.

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

## Housekeeping

- [ ] Commit. Phases 3–6 plus auth and the sign-in showcase are still
      uncommitted.
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
