import { useRef } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { cn } from '@/lib/cn'
import { easeOutCubic, mix, span } from '../scroll'

type Kind = 'notebook' | 'sticky' | 'index' | 'receipt' | 'app'

interface List {
  kind: Kind
  title: string
  items: (string | [string, 'done'])[]
  /** A count badge, for the list that never ends. */
  count?: string
  more?: string
  /** Width in em. */
  w: number
  /** Resting place, as % offsets from the pile's center, and angle. */
  x: number
  y: number
  r: number
}

/**
 * Every kind of list people keep, all at once. Work, errands, family and
 * vague resolutions mixed together, nothing saying what matters. Order is the
 * order they land: the last one is the punchline.
 */
const LISTS: List[] = [
  {
    kind: 'notebook',
    title: 'Monday',
    items: ['Finish the Q3 deck', 'Call the dentist', ['Gym', 'done'], 'Reply to Priya', 'Laundry'],
    w: 15,
    x: -14,
    y: -6,
    r: -7,
  },
  {
    kind: 'app',
    title: 'Inbox',
    count: '47',
    items: ['Update résumé', 'Cancel free trial', 'Book flights', 'Fix the bathroom tap'],
    more: '43 more',
    w: 16,
    x: 16,
    y: -12,
    r: 5,
  },
  {
    kind: 'receipt',
    title: 'Groceries',
    items: ['Eggs', 'Oat milk', 'Coffee', ['Bin bags', 'done'], 'Something for dinner'],
    w: 10.5,
    x: -24,
    y: 16,
    r: 9,
  },
  {
    kind: 'index',
    title: 'This week',
    items: ['Taxes!!', 'Run 3x', 'Call Sam back', 'Read 20 pages', 'Clear the inbox'],
    w: 14,
    x: 8,
    y: 14,
    r: -4,
  },
  {
    kind: 'sticky',
    title: "Don't forget",
    items: ["Mom's birthday, Sat", 'Renew passport'],
    w: 11,
    x: -2,
    y: -22,
    r: 8,
  },
  {
    kind: 'notebook',
    title: 'Work',
    items: ['Prep 1:1s', 'Review the pull requests', 'Quarterly plan', 'Expense report'],
    w: 14,
    x: 22,
    y: 10,
    r: 11,
  },
  {
    kind: 'app',
    title: 'Someday',
    items: ['Learn Spanish', 'Start a podcast', 'Write a book', 'Get into running'],
    w: 14,
    x: -20,
    y: -18,
    r: -12,
  },
  {
    kind: 'index',
    title: 'Goals 2026',
    items: ['Get fit', 'Save more', 'Be more present'],
    w: 12,
    x: -6,
    y: 20,
    r: 6,
  },
  {
    kind: 'receipt',
    title: 'Errands',
    items: ['Post office', 'Pharmacy', 'Car wash', 'Return the jacket'],
    w: 10.5,
    x: 26,
    y: -20,
    r: -9,
  },
  {
    kind: 'sticky',
    title: 'URGENT',
    items: ['Pay the credit card'],
    w: 10,
    x: 12,
    y: -2,
    r: -14,
  },
  {
    kind: 'sticky',
    title: 'call mom back!!',
    items: [],
    w: 9,
    x: -16,
    y: 4,
    r: 13,
  },
  {
    kind: 'notebook',
    title: 'Tuesday',
    items: ['Everything from Monday'],
    w: 14,
    x: 2,
    y: 2,
    r: -3,
  },
]

// Scroll timeline. The first lists are already down when the section
// arrives, so it never opens on an empty stage; the rest fall one after
// another once it pins, then the explanation. No drop straddles 0: progress
// holds at 0 until the pin, and a list frozen mid-fall would read as broken.
const ALREADY_DOWN = 2
const DROP_STEP = 0.068
const DROP_LENGTH = 0.12
const TEXT_IN: [number, number] = [0.78, 0.88]

/**
 * The section pins while the pile builds, one list per stretch of scroll,
 * and runs in reverse on the way back up. Under reduced motion it's a still
 * pile in a normal section.
 */
export function Pile({ still = false }: { still?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() || still
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  const textOpacity = useTransform(scrollYProgress, (v) => span(v, ...TEXT_IN))
  const textY = useTransform(scrollYProgress, (v) => mix(16, 0, span(v, ...TEXT_IN)))

  return (
    <section ref={ref} className={cn('relative', !reduce && 'h-[300vh]')}>
      <div
        className={cn(
          reduce
            ? 'py-20 md:py-28'
            : // Pinned under the 64px nav.
              'sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden',
        )}
      >
        <div className="mx-auto grid h-full max-w-7xl grid-rows-[auto_1fr] gap-6 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-1 md:items-center md:gap-10 lg:px-8">
          <div>
            <h2 className="max-w-[12ch] text-balance text-[40px] font-bold leading-[1.02] tracking-[-0.035em] text-slate-900 sm:text-[54px] lg:text-[68px]">
              Most to-do lists are a pile.
            </h2>
            <motion.p
              className="mt-6 max-w-[34ch] text-[18px] leading-relaxed text-slate-700 md:text-[20px]"
              style={reduce ? undefined : { opacity: textOpacity, y: textY }}
            >
              Everything goes in, and nothing says what it&rsquo;s for. The
              loudest part of your life takes the whole list. The rest waits.
            </motion.p>
          </div>

          <div
            aria-hidden="true"
            className={cn(
              'relative text-[8.5px] sm:text-[11px] lg:text-[14px]',
              reduce ? 'h-[26rem] md:h-[34rem]' : 'h-full min-h-[18rem] md:h-[80%]',
            )}
          >
            {LISTS.map((list, i) => (
              <Dropped key={list.title} list={list} index={i} progress={scrollYProgress} still={!!reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Dropped({
  list,
  index,
  progress,
  still,
}: {
  list: List
  index: number
  progress: MotionValue<number>
  still: boolean
}) {
  // Lists already in the pile never touch the scroll timeline: every range
  // handed to it must sit inside 0 to 1, or the browser rejects the animation.
  const landed = still || index < ALREADY_DOWN
  const start = landed ? 0 : (index - ALREADY_DOWN) * DROP_STEP
  const end = start + DROP_LENGTH
  const tumble = index % 2 === 0 ? 22 : -22

  // Falls from above the stage, turning, and lands with a little overshoot
  // in scale so it reads as dropped rather than slid.
  const fall = (v: number) => easeOutCubic(span(v, start, end))
  const y = useTransform(progress, (v) => mix(-760, 0, fall(v)))
  const rotate = useTransform(progress, (v) => mix(list.r + tumble, list.r, fall(v)))
  const scale = useTransform(progress, (v) => {
    const t = span(v, start, end)
    return t < 0.85 ? mix(1.12, 0.985, t / 0.85) : mix(0.985, 1, (t - 0.85) / 0.15)
  })
  const opacity = useTransform(progress, (v) => span(v, start, start + 0.03))

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${50 + list.x}%`, top: `${50 + list.y}%`, width: `${list.w}em` }}
    >
      <motion.div style={landed ? { rotate: list.r } : { y, rotate, scale, opacity }}>
        <Paper list={list} />
      </motion.div>
    </div>
  )
}

/** Tinted with the page's deep blue, like every shadow in the product. */
const PAPER_SHADOW =
  '0 0.1em 0.3em rgba(30, 69, 96, 0.10), 0 0.9em 2.2em -0.4em rgba(30, 69, 96, 0.22)'

function Paper({ list }: { list: List }) {
  const { kind, title, items, count, more } = list

  if (kind === 'receipt') {
    return (
      <div
        className="label-mono bg-[#fbfdfe] px-[1.1em] pb-[1.3em] pt-[1.1em] text-[0.92em] text-slate-700"
        style={{ boxShadow: PAPER_SHADOW }}
      >
        <p className="text-center text-[1.05em] text-slate-900">{title}</p>
        <div className="my-[0.7em] border-t border-dashed border-slate-300" />
        <ul className="space-y-[0.45em]">
          {items.map((item) => {
            const [text, done] = typeof item === 'string' ? [item, false] : [item[0], true]
            return (
              <li key={text} className={cn('flex justify-between gap-[0.6em]', done && 'text-slate-600 line-through')}>
                <span>{text}</span>
                <span className="text-slate-600">1</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-[0.8em] border-t border-dashed border-slate-300" />
      </div>
    )
  }

  if (kind === 'sticky') {
    return (
      <div
        className="rounded-[0.25em] px-[1.1em] pb-[1.4em] pt-[1em] text-slate-800"
        style={{ background: 'var(--color-blue-100)', boxShadow: PAPER_SHADOW }}
      >
        <p className={cn('font-semibold', items.length === 0 ? 'py-[0.8em] text-[1.35em]' : 'text-[1.1em]')}>
          {title}
        </p>
        {items.length > 0 && (
          <ul className="mt-[0.5em] space-y-[0.35em] text-[1em]">
            {items.map((item) => (
              <li key={String(item)}>{typeof item === 'string' ? item : item[0]}</li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const lined = kind === 'notebook' || kind === 'index'

  return (
    <div
      className={cn(
        'bg-white pb-[1.1em] pr-[1.1em] pt-[0.9em] text-slate-700',
        kind === 'app' ? 'rounded-[1em] pl-[1.1em]' : 'rounded-[0.3em]',
        kind === 'notebook' ? 'pl-[2em]' : kind === 'index' && 'pl-[1.1em]',
      )}
      style={{
        boxShadow: PAPER_SHADOW,
        // Ruled paper: one line per item row; a margin line on notebook pages.
        backgroundImage: lined
          ? [
              kind === 'notebook'
                ? 'linear-gradient(90deg, transparent 1.35em, var(--color-slate-300) 1.35em, var(--color-slate-300) calc(1.35em + 1px), transparent calc(1.35em + 1px))'
                : '',
              'repeating-linear-gradient(180deg, transparent 0, transparent 1.75em, var(--color-blue-200) 1.75em, var(--color-blue-200) calc(1.75em + 1px))',
            ]
              .filter(Boolean)
              .join(', ')
          : undefined,
        backgroundPositionY: lined ? '0.55em' : undefined,
      }}
    >
      <div className="flex items-baseline justify-between gap-[0.6em]">
        <p className="text-[1.1em] font-semibold leading-[1.6] text-slate-900">{title}</p>
        {count && (
          <span className="rounded-pill bg-slate-100 px-[0.6em] text-[0.85em] font-semibold tabular-nums text-slate-600">
            {count}
          </span>
        )}
      </div>
      <ul className={cn(kind === 'app' ? 'mt-[0.4em] space-y-[0.5em]' : '')}>
        {items.map((item) => {
          const [text, done] = typeof item === 'string' ? [item, false] : [item[0], true]
          return (
            <li
              key={text}
              className={cn(
                'flex items-center gap-[0.6em] text-[1em]',
                lined && 'leading-[1.75em]',
                done && 'text-slate-600 line-through',
              )}
            >
              <span
                className={cn(
                  'size-[0.85em] shrink-0 border border-slate-300',
                  kind === 'app' ? 'rounded-full' : 'rounded-[0.15em]',
                  done && 'border-slate-400 bg-slate-300',
                )}
              />
              {text}
            </li>
          )
        })}
      </ul>
      {more && <p className="mt-[0.6em] text-[0.9em] font-medium text-slate-500">+ {more}</p>}
    </div>
  )
}
