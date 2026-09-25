import { useState } from 'react'
import { MAX_LENGTH } from '@/data/limits'
import { cn } from '@/lib/cn'
import {
  Counter,
  InlineAction,
  PrimaryButton,
  QuietLink,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { useOnboardingStore } from '../useOnboardingStore'

/** The design's advice, enforced only as a nudge. */
const COMFORTABLE_MAX = 5

/**
 * Each name is a visible field, with a pencil, rather than text that turns
 * editable when clicked: nothing hinted at that, least of all on a phone,
 * where there's no hover to give it away.
 */
const nameField = cn(
  'peer w-full rounded-pill border border-slate-300 bg-white/85 py-2.5 pl-5 pr-11',
  'text-[16px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-500',
  'shadow-[var(--shadow-rest)] outline-none transition-colors duration-150 hover:border-blue-400',
  'focus-visible:border-blue-600 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/30',
)

function Pencil() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-500',
        'transition-opacity duration-150 peer-focus-visible:opacity-0',
      )}
    >
      <path
        d="M10.8 2.7a1.6 1.6 0 0 1 2.3 2.3L5.6 12.5l-3 .8.8-3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PillarsStep() {
  const pillars = useOnboardingStore((s) => s.pillars)
  const rename = useOnboardingStore((s) => s.renamePillar)
  const remove = useOnboardingStore((s) => s.removePillar)
  const add = useOnboardingStore((s) => s.addPillar)
  const next = useOnboardingStore((s) => s.next)
  const back = useOnboardingStore((s) => s.back)

  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function commitNew() {
    add(draft)
    setDraft('')
    setAdding(false)
  }

  const named = pillars.filter((p) => p.name.trim().length > 0)

  return (
    <StepBody>
      <StepHeading title="Build your Pillars">
        These become the headers under every day. Rename them until they sound
        like you, and remove what isn&apos;t yours. Five or fewer works best.
      </StepHeading>

      {pillars.length === 0 && !adding && (
        <p className="border-b py-4 text-[17px] text-slate-600"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          Nothing here yet
        </p>
      )}

      <ul className="space-y-3">
        {pillars.map((pillar) => (
          <li key={pillar.id} className="flex items-center gap-2">
            <span className="relative flex-1">
              <input
                value={pillar.name}
                maxLength={MAX_LENGTH.pillarName}
                onChange={(e) => rename(pillar.id, e.target.value)}
                aria-label="Pillar name"
                className={nameField}
                placeholder="Name this pillar"
              />
              <Pencil />
            </span>
            <button
              type="button"
              onClick={() => remove(pillar.id)}
              aria-label={`Remove ${pillar.name || 'pillar'}`}
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-full text-slate-600',
                'transition-colors duration-150 hover:bg-white/70 hover:text-error-text',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-700',
              )}
            >
              <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
                <path
                  d="M4 4l6 6M10 4l-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {adding ? (
        // The remove button's width, so the new field lines up with the rest.
        <div className="relative mt-3 mr-9">
          <input
            autoFocus
            value={draft}
            maxLength={MAX_LENGTH.pillarName}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitNew()
              if (e.key === 'Escape') {
                setDraft('')
                setAdding(false)
              }
            }}
            onBlur={commitNew}
            placeholder="Name this pillar"
            aria-label="New pillar name"
            className={nameField}
          />
          <Pencil />
        </div>
      ) : (
        <div className="pt-4">
          <InlineAction onClick={() => setAdding(true)}>
            + Add a pillar
          </InlineAction>
        </div>
      )}

      <StepFooter>
        <PrimaryButton onClick={next} disabled={named.length === 0}>
          Continue
        </PrimaryButton>
        <Counter>{named.length} pillars</Counter>
        {named.length > COMFORTABLE_MAX && (
          <span className="text-[13px] text-slate-600">
            That&apos;s a lot to carry. Five or fewer tends to hold up better.
          </span>
        )}
        <QuietLink onClick={back}>Pick a different set</QuietLink>
      </StepFooter>
    </StepBody>
  )
}
