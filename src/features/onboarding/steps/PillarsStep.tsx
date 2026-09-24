import { useState } from 'react'
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
        These become the headers under every day. Edit the words until they
        sound like you, remove what isn&apos;t yours. 5 or fewer works best.
      </StepHeading>

      {pillars.length === 0 && !adding && (
        <p className="border-b py-4 text-[17px] text-slate-600"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          Nothing here yet
        </p>
      )}

      <ul>
        {pillars.map((pillar) => (
          <li
            key={pillar.id}
            className="flex items-center gap-3 border-b py-2"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <input
              value={pillar.name}
              onChange={(e) => rename(pillar.id, e.target.value)}
              aria-label="Pillar name"
              className={cn(
                'flex-1 bg-transparent py-1.5 text-[17px] font-semibold text-slate-900',
                'outline-none placeholder:font-normal placeholder:text-slate-500',
                '-mx-2 rounded-md px-2 focus-visible:bg-white focus-visible:text-blue-800 focus-visible:ring-2 focus-visible:ring-blue-600/40',
              )}
              placeholder="Name this pillar"
            />
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
        <div
          className="flex items-center gap-3 border-b py-2"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <input
            autoFocus
            value={draft}
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
            className="-mx-2 flex-1 rounded-md bg-transparent px-2 py-1.5 text-[17px] font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600/40"
          />
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
