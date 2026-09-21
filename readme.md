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

## Where things are

```
design screens/       The hi-fi exports the UI is built against. Input, not code.
src/design/           Tokens (tokens.css) and spring configs (motion.ts).
src/components/       Shared primitives.
src/features/board/   The main view: week grid, pillars, tasks, drag and drop.
src/data/             Repository interface, types, and the in-memory mock.
src/lib/              Dates, class merging, Supabase client.
```

## Two conventions worth knowing

**Greys are never neutral.** Every "grey" in the product is a desaturated blue
(`--color-slate-*`), so inactive states belong to the same family as active ones
instead of fighting the palette. The original main view used `#808080`, which is
why it read as a different product from the rest of the app.

**Storage sits behind an interface.** The UI talks to `PillarsRepository`
(`src/data/repository.ts`), currently backed by `mockRepository`. Swapping in
Supabase replaces one binding in `useBoardStore.ts` and touches no components.

## Status

Built: design tokens, primitives, and the main view — week grid, pillar
activation, drag and drop across days and pillars, and the "This Week"
slide-over (the goals-expanded state).

Goal progress is **derived, never stored**. `selectGoalStats` counts tasks
linked to a goal to get "# planned, # done", so the numbers cannot drift out of
sync with the board: planning a task is what makes it planned.

Next: add/edit task modal, Supabase + auth, onboarding, the weekly-planning and
end-of-day flows, and the responsive mobile pass.

Fonts: Helvetica Neue has no free web licence, so Apple devices get the real
face and everything else falls back through a near-identical stack. Encode Sans
Expanded (the "mono" label voice) is bundled from Google Fonts.
