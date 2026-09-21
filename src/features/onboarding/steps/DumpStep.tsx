import { useState, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import {
  Counter,
  PrimaryButton,
  QuietLink,
  StepBody,
  StepFooter,
  StepHeading,
} from '../OnboardingUI'
import { useOnboardingStore } from '../useOnboardingStore'

export function DumpStep() {
  const dump = useOnboardingStore((s) => s.dump)
  const addItem = useOnboardingStore((s) => s.addDumpItem)
  const removeItem = useOnboardingStore((s) => s.removeDumpItem)
  const next = useOnboardingStore((s) => s.next)
  const back = useOnboardingStore((s) => s.back)

  const [draft, setDraft] = useState('')

  function commit() {
    addItem(draft)
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      return
    }
    // Backspace on an empty field removes the last chip — the usual behaviour
    // for a field that turns text into tokens.
    if (e.key === 'Backspace' && draft === '' && dump.length > 0) {
      removeItem(dump.length - 1)
    }
  }

  return (
    <StepBody>
      <StepHeading title="What&rsquo;s been on your mind recently?">
        No need to organize it. Write down a thought, press enter, add or remove
        as many as you need.
      </StepHeading>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder="Start anywhere."
        aria-label="Add a thought"
        className={cn(
          'w-full rounded-pill border border-slate-200 bg-white px-6 py-4 text-[16px]',
          'text-slate-900 placeholder:text-slate-400',
          'shadow-[var(--shadow-rest)] outline-none',
          'focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30',
        )}
      />

      {dump.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-3">
          {dump.map((item, i) => (
            <li key={`${item}-${i}`}>
              <span
                className={cn(
                  'flex items-center gap-3 rounded-pill border border-blue-200 bg-white',
                  'py-2.5 pl-5 pr-3 text-[15px] text-slate-800',
                  'shadow-[var(--shadow-rest)]',
                )}
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  aria-label={`Remove "${item}"`}
                  className={cn(
                    'grid size-5 place-items-center rounded-full text-slate-400',
                    'transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500',
                  )}
                >
                  <svg viewBox="0 0 14 14" className="size-3" aria-hidden="true">
                    <path
                      d="M4 4l6 6M10 4l-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter>
        <PrimaryButton onClick={next} disabled={dump.length === 0}>
          Continue
        </PrimaryButton>
        <Counter>
          {dump.length} written down
        </Counter>
        <QuietLink onClick={back}>Go back</QuietLink>
      </StepFooter>
    </StepBody>
  )
}
