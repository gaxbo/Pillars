import { useEffect, useRef, useState } from 'react'
import { LayoutGroup, MotionConfig, motion, useInView, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { Reveal } from '../Reveal'

const ROWS: [list: string, pillars: string][] = [
  ['Holds everything you ever thought of', 'Holds the few areas you chose'],
  ['Every task weighs the same', 'Every task serves a pillar'],
  ['Done means an empty list', 'Done means the goals you set, met'],
  ['Leftovers pile up as overdue', 'Leftovers get a decision every evening'],
  ['You plan when you remember to', 'Planning has a set time each week'],
]

type PillarName = 'Coursework' | 'Practice' | 'Social Life'

interface DemoTask {
  id: string
  title: string
  /** No pillar: on a list it sits with everything else; on Pillars it stays off the week. */
  pillar: PillarName | null
  overdue?: boolean
  done?: boolean
}

/** One week's worth, in the order a list would hold it: the order it arrived. */
const TASKS: DemoTask[] = [
  { id: 'essay', title: 'Finish the essay draft', pillar: 'Coursework', overdue: true },
  { id: 'guitar', title: 'Guitar practice', pillar: 'Practice', done: true },
  { id: 'trial', title: 'Cancel a free trial', pillar: null },
  { id: 'maya', title: 'Text Maya back', pillar: 'Social Life', overdue: true },
  { id: 'scales', title: 'Scales and chord drills', pillar: 'Practice' },
  { id: 'inbox', title: 'Clear the inbox', pillar: null, overdue: true },
  { id: 'chapter', title: 'Read chapter 4', pillar: 'Coursework', done: true },
  { id: 'movie', title: 'Movie night with roommates', pillar: 'Social Life' },
]

const PILLARS: { name: PillarName; goal: string; target: number }[] = [
  { name: 'Coursework', goal: 'Two study sessions', target: 2 },
  { name: 'Practice', goal: 'Practice three times', target: 3 },
  { name: 'Social Life', goal: 'See friends twice', target: 2 },
]

/**
 * The same eight tasks, as a list and as Pillars, behind one switch. Every
 * task is one element that travels between the two layouts, so flipping the
 * switch shows the tasks being sorted rather than one picture replacing
 * another. It flips itself once, the first time it's in view, unless you
 * got there first; under reduced motion it waits for you.
 */
export function Difference() {
  const [on, setOn] = useState(false)
  const touched = useRef(false)
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(stage, { once: true, amount: 0.3 })
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!inView || reduce || touched.current) return
    const t = window.setTimeout(() => {
      if (!touched.current) setOn(true)
    }, 1200)
    return () => window.clearTimeout(t)
  }, [inView, reduce])

  function flip(next: boolean) {
    touched.current = true
    setOn(next)
  }

  return (
    <section
      aria-labelledby="difference-title"
      className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 md:pb-32 lg:px-8"
    >
      <Reveal>
        <h2
          id="difference-title"
          className="text-balance text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-slate-900 sm:text-[44px]"
        >
          Why it isn&rsquo;t another to-do list.
        </h2>
        <p className="mt-5 max-w-[46ch] text-[18px] leading-relaxed text-slate-700">
          Same tasks, same week. Flip the switch.
        </p>
      </Reveal>

      <Switch on={on} onChange={flip} className="mt-9" />

      <div
        ref={stage}
        className="mt-10 grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-14"
      >
        <ul className="grid gap-y-6 md:pt-4">
          {ROWS.map(([list, pillars]) => (
            <li
              key={pillars}
              className="border-b pb-6 last:border-b-0"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              {/* Keyed on the state, so each line fades in as its new self. */}
              <span
                key={on ? 'on' : 'off'}
                className={cn(
                  'animate-fade-in block text-[18px] leading-snug sm:text-[20px]',
                  on ? 'font-medium text-slate-900' : 'text-slate-700',
                )}
              >
                {on ? pillars : list}
              </span>
            </li>
          ))}
        </ul>

        <MotionConfig reducedMotion="user">
          <WeekCard on={on} />
        </MotionConfig>
      </div>
    </section>
  )
}

/**
 * The switch itself, the kind a phone's settings use: a track and a knob,
 * labelled on both sides. Either label is also a way to flip it with a
 * pointer; for a keyboard or screen reader it's one switch, "Pillars", on
 * or off.
 */
function Switch({
  on,
  onChange,
  className,
}: {
  on: boolean
  onChange: (on: boolean) => void
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span
        aria-hidden="true"
        onClick={() => onChange(false)}
        className={cn(
          'cursor-pointer select-none text-[17px] transition-colors duration-200',
          on ? 'text-slate-600 hover:text-slate-900' : 'font-semibold text-slate-900',
        )}
      >
        A to-do list
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Show it as Pillars"
        onClick={() => onChange(!on)}
        className={cn(
          'group relative h-8 w-[3.25rem] shrink-0 rounded-full transition-colors duration-300',
          'focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-blue-700',
          // Off is a light track with an edge, so it still reads as a
          // control against the page (3:1 for the edge, WCAG 1.4.11).
          on
            ? 'bg-blue-700 hover:bg-blue-800'
            : 'bg-slate-200 shadow-[inset_0_0_0_1.5px_var(--color-slate-500)] hover:bg-slate-300',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0.5 top-0.5 size-7 rounded-full bg-white',
            'shadow-[0_1px_2px_rgba(30,69,96,0.2),0_3px_8px_rgba(30,69,96,0.18)]',
            'transition-transform duration-300 ease-[cubic-bezier(0.34,1.4,0.64,1)]',
            // A slightly wider knob while pressed, the way the real one does.
            'group-active:w-8',
            on ? 'translate-x-5 group-active:translate-x-4' : 'translate-x-0',
          )}
        />
      </button>

      <span
        aria-hidden="true"
        onClick={() => onChange(true)}
        className={cn(
          'cursor-pointer select-none text-[17px] transition-colors duration-200',
          on ? 'font-semibold text-blue-800' : 'text-slate-600 hover:text-slate-900',
        )}
      >
        Pillars
      </span>
    </div>
  )
}

const TASK_SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const

/**
 * The demo week. A picture, as far as a screen reader is concerned, with a
 * description that follows the switch.
 */
function WeekCard({ on }: { on: boolean }) {
  const open = TASKS.filter((t) => !t.done).length
  const leftOff = TASKS.filter((t) => t.pillar === null)

  return (
    <div
      role="img"
      aria-label={
        on
          ? 'The week in Pillars: Coursework, Practice and Social Life, each with a goal and a progress bar, and each task under the pillar it serves. Two tasks with no pillar are left off the week.'
          : 'The week as a to-do list: eight tasks in one column in the order they arrived, three marked overdue.'
      }
      className="rounded-modal border p-5 sm:p-7"
      style={{
        background: on ? 'var(--gradient-surface-soft)' : '#ffffff',
        borderColor: 'var(--border-hairline-strong)',
        boxShadow: 'var(--shadow-lift)',
        transition: 'background 400ms var(--ease-out-soft)',
      }}
    >
      <LayoutGroup>
        <div aria-hidden="true">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[17px] font-semibold tracking-tight text-slate-900">
              {on ? 'This week' : 'Inbox'}
            </p>
            <p className="label-mono text-[12px] tabular-nums text-slate-600">
              {on ? '3 pillars, 3 goals' : `${open} open`}
            </p>
          </div>

          {on ? (
            <div className="mt-4 grid gap-3">
              {PILLARS.map((pillar) => {
                const tasks = TASKS.filter((t) => t.pillar === pillar.name)
                const done = tasks.filter((t) => t.done).length
                return (
                  <motion.div
                    key={pillar.name}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-pillar border border-white/70 px-3.5 pb-2.5 pt-3 shadow-[var(--shadow-raised)]"
                    style={{ background: 'var(--gradient-surface)' }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="label-mono text-[12px] text-blue-800">{pillar.name}</span>
                      <span className="label-mono text-[12px] tabular-nums text-slate-700">
                        {done}/{pillar.target}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-slate-700">{pillar.goal}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-pill border border-slate-200 bg-white">
                      <div
                        className="goal-bar-fill h-full rounded-pill bg-blue-600"
                        style={{ width: `${(done / pillar.target) * 100}%` }}
                      />
                    </div>
                    <ul className="mt-1.5">
                      {tasks.map((task) => (
                        <TaskLine key={task.id} task={task} on />
                      ))}
                    </ul>
                  </motion.div>
                )
              })}

              <motion.div
                layout
                className="flex flex-wrap items-center gap-2 pt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                <span className="text-[13px] text-slate-600">Left off the week:</span>
                {leftOff.map((task) => (
                  <motion.span
                    key={task.id}
                    layoutId={task.id}
                    transition={TASK_SPRING}
                    className="rounded-pill border border-slate-300 px-2.5 py-0.5 text-[12.5px] text-slate-600 line-through decoration-slate-500"
                  >
                    {task.title}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          ) : (
            <ul className="mt-3 divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {TASKS.map((task) => (
                <TaskLine key={task.id} task={task} on={false} />
              ))}
            </ul>
          )}
        </div>
      </LayoutGroup>
    </div>
  )
}

function TaskLine({ task, on }: { task: DemoTask; on: boolean }) {
  return (
    <motion.li
      layoutId={task.id}
      transition={TASK_SPRING}
      className={cn(
        'flex items-center gap-2.5',
        on ? 'py-1 text-[14px]' : 'border-[var(--border-hairline)] py-2.5 text-[15px]',
      )}
    >
      <span
        className={cn(
          'grid size-4 shrink-0 place-items-center rounded-full',
          task.done ? 'bg-blue-600' : 'border-[1.5px] border-slate-400 bg-white',
        )}
      >
        {task.done && (
          <svg viewBox="0 0 12 12" className="size-2.5">
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          task.done ? 'text-slate-600 line-through decoration-slate-500' : 'text-slate-800',
        )}
      >
        {task.title}
      </span>
      {/* A list's only way to rank things: red for late. Pillars decides
          leftovers every evening instead, so nothing is ever "overdue". */}
      {!on && task.overdue && (
        <span className="shrink-0 rounded-pill bg-error-text/10 px-2 py-0.5 text-[11.5px] font-medium text-error-text">
          Overdue
        </span>
      )}
    </motion.li>
  )
}
