import { siteUrl } from '@/lib/url'
import { SettingsShell } from './SettingsPage'

/** Optional; the contact line only appears once there's an address to show. */
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL
/** Optional; the landing site, for its roadmap page. */
const LANDING_URL = siteUrl(import.meta.env.VITE_LANDING_URL)

const FAQ: [question: string, answer: string][] = [
  [
    'What is a pillar?',
    'An area of your life you’ve chosen to invest in, like Fitness or Family. Your pillars sit under every day on the board, so you can see which ones are getting time and which aren’t.',
  ],
  [
    'How do goals count?',
    'Each pillar can have one goal for the week, with a number: “Move three times.” Tasks linked to the goal count toward it. A new task is linked to its pillar’s goal automatically; open the task to change that.',
  ],
  [
    'How do I move a task?',
    'Drag it to another day or pillar. On a phone, press and hold first. With a keyboard, focus the task, press Space, use the arrow keys, and press Space again to drop it. Or open the task and use the ⋯ menu for tomorrow, next week, or any day.',
  ],
  [
    'What is the evening check-in?',
    'After the time you set in Notifications, Pillars asks about each task still open, one at a time: done, tomorrow, or delete. It also asks about anything left over from the past six days.',
  ],
  [
    'When does the weekly review happen?',
    'At the planning day and time you set. A banner appears on your board; the review shows last week’s report card, then lets you set next week’s goals.',
  ],
  [
    'I deleted a task by mistake.',
    'Press Undo in the note at the bottom of the board. It stays for five seconds.',
  ],
]

export function HelpPage() {
  return (
    <SettingsShell title="Help & Support">
      <dl className="mt-10 grid gap-8">
        {FAQ.map(([question, answer]) => (
          <div
            key={question}
            className="border-t pt-6"
            style={{ borderColor: 'var(--border-hairline-strong)' }}
          >
            <dt className="text-[18px] font-semibold tracking-tight text-slate-900">
              {question}
            </dt>
            <dd className="mt-2 max-w-[60ch] text-[15.5px] leading-relaxed text-slate-700">
              {answer}
            </dd>
          </div>
        ))}
      </dl>

      {SUPPORT_EMAIL && (
        <p
          className="mt-12 border-t pt-6 text-[15.5px] text-slate-700"
          style={{ borderColor: 'var(--border-hairline-strong)' }}
        >
          Still stuck?{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="rounded-sm font-medium text-blue-800 underline underline-offset-2 hover:decoration-2"
          >
            Write to us at {SUPPORT_EMAIL}
          </a>
          .
        </p>
      )}
    </SettingsShell>
  )
}

export function AboutPage() {
  return (
    <SettingsShell title="About Us">
      <div className="mt-8 grid max-w-[60ch] gap-5 text-[17px] leading-relaxed text-slate-700">
        <p className="text-[22px] font-semibold leading-snug tracking-tight text-slate-900">
          Other apps start with your tasks. Pillars starts from the other end.
        </p>
        <p>
          First the few parts of your life that matter. Then a goal for each,
          and a set time to plan the week. The tasks come last, and every one
          of them is for something.
        </p>
        <p>
          Pillars is in early access. Thank you for being here this early: what
          you run into now shapes what it becomes.
        </p>
        {LANDING_URL && (
          <p>
            <a
              href={`${LANDING_URL}/roadmap`}
              className="rounded-sm font-medium text-blue-800 underline underline-offset-2 hover:decoration-2"
            >
              See what&rsquo;s coming next
            </a>
          </p>
        )}
      </div>
    </SettingsShell>
  )
}
