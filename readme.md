# Pillars

A to-do list for busy people balancing their lives and becoming a better version
of themselves. Tasks live under **pillars** — the few areas of life you've
decided to actually invest in — and each pillar carries quantifiable weekly
goals.

## Running it

```bash
npm install
npm run dev
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck, then production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |

## Connecting Supabase

The app runs on sample data with no setup. To use real accounts:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
3. `cp .env.example .env` and fill in the URL and anon key from
   **Settings → API**.
4. Under **Authentication → URL Configuration**, add `http://localhost:5173`
   as a redirect URL so the reset-password link comes back to the app.

Restart the dev server. `src/data/index.ts` picks the Supabase repository as
soon as both keys are present, and the sign-in screen stops saying it is
unconfigured.

## Seeing the reminders

Both nudges are time-gated, so they will not show up on a Tuesday afternoon.
In development, force one:

| URL | Shows |
| --- | --- |
| `/?preview=eod` | The end-of-day toast, then the triage cards |
| `/?preview=weekly` | Redirects to the weekly report card |
| `/weekly-review` | The report card directly, any time |

Otherwise the end-of-day nudge appears past `eod_reminder_time` (default
20:00) when tasks scheduled for today are still open, and the weekly prompt
appears once the planning slot chosen in onboarding has passed and last week
has not been reviewed. `preview` is stripped from production builds.

## The auth flows

```
sign up  -> /verify   (6-digit code) -> /welcome -> /onboarding
sign in  -> board
         -> /verify   when the address was never confirmed
forgot   -> /reset-link-sent -> (email link) -> /reset-password -> board
```

| Route | Screen |
| --- | --- |
| `/sign-in` | Split layout, email + password |
| `/sign-up` | Email, password, confirm |
| `/verify` | "Check your email" — 6-digit code, resend on a 30s cooldown |
| `/welcome` | "All set! Logging you in." then redirects |
| `/forgot-password` | "Enter your email" |
| `/reset-link-sent` | "Reset link sent!" with resend |
| `/reset-password` | Set a new password; detects an expired link |

**The code screen needs a Supabase email template change.** Supabase sends a
magic *link* by default. For the 6-digit code the design calls for, edit
**Authentication → Email Templates → Confirm signup** and use `{{ .Token }}`
in place of `{{ .ConfirmationURL }}`. Without that the code screen has no code
to accept.

## Where things are

```
design screens/       The hi-fi exports the UI is built against. Input, not code.
src/design/           Tokens (tokens.css) and spring configs (motion.ts).
src/components/       Shared primitives.
src/features/board/   The main view: week grid, pillars, tasks, drag and drop.
src/features/auth/    Sign in, sign up, verify, password reset.
src/features/onboarding/  The six-step setup flow, archetype catalog, matcher.
src/features/weekly/  Weekly review: report card, then next week’s goals.
src/features/eod/     End-of-day nudge and one-card-at-a-time triage.
src/features/reminders/  Pure rules for when each nudge is owed.
src/features/goals/   The goal editor, shared by onboarding and the review.
src/data/             Repository interface, types, and the in-memory mock.
src/lib/              Dates, class merging, Supabase client.
```

## Conventions worth knowing

**Greys are never neutral.** Every "grey" in the product is a desaturated blue
(`--color-slate-*`), so inactive states belong to the same family as active ones
instead of fighting the palette. The original main view used `#808080`, which is
why it read as a different product from the rest of the app.

**Storage sits behind an interface.** The UI talks to `PillarsRepository`
(`src/data/repository.ts`). `src/data/index.ts` picks the Supabase
implementation when keys are present and the in-memory mock otherwise — no
component knows which one it is talking to.

**Overlays stay mounted.** The This Week panel and the task dialog are rendered
from page load and toggle visibility rather than mounting on open. Mounting
them on demand cost a dropped frame every first open; parking them off-screen
moves that cost into page load where nothing is waiting on it.

**Blocking UI animates in CSS, never JS.** A modal whose visibility depends on
a JS animation frame becomes an invisible click-swallowing overlay if that
frame never runs. Keyframes with `animation-fill-mode: both` land in the right
final state regardless — including under `prefers-reduced-motion`.

**Pillar matching is keyword scoring, not an LLM call.** `match.ts` scores the
six starting templates against the brain-dump text plus the chosen archetypes.
It is instant, free, works offline, and the next screen lets the user edit
everything anyway — so a wrong guess costs one click, not a bad outcome.

**Reminder rules are pure functions.** `reminders.ts` decides whether a nudge
is owed from arguments alone, with no I/O, so the logic can be reasoned about
and tested without a clock or a network. The hook feeds it data; it just
answers. Every `localStorage` access is wrapped — it throws in private mode,
and a lost snooze should mean one extra nudge, not a broken board.

## Status

Built: design tokens and primitives; the main view (week grid, pillar
activation, drag and drop across days and pillars); the "This Week" slide-over;
the add/edit task dialog; auth with the Supabase schema behind it; the
six-step onboarding flow; and both reminder flows.

Goal progress is **derived, never stored**. `selectGoalStats` counts tasks
linked to a goal to get "# planned, # done", so the numbers cannot drift out of
sync with the board: planning a task is what makes it planned.

Next: the responsive mobile pass, and connecting a real Supabase project. One known rough edge: the task dialog still drops a single frame
the first time it opens per page load.

Fonts: Helvetica Neue has no free web licence, so Apple devices get the real
face and everything else falls back through a near-identical stack. Encode Sans
Expanded (the "mono" label voice) is bundled from Google Fonts.
