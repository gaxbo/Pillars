import { useId, useState } from 'react'
import { cn } from '@/lib/cn'
import { joinWaitlist, looksLikeEmail, type JoinResult } from './waitlist'

type Status = 'idle' | 'sending' | JoinResult

interface WaitlistFormProps {
  /** Which form on the page this is, stored alongside the address. */
  source: 'hero' | 'footer'
  /** Lets the nav's "Join the list" focus this form's input. */
  inputId?: string
  className?: string
}

export function WaitlistForm({ source, inputId, className }: WaitlistFormProps) {
  const fallbackId = useId()
  const id = inputId ?? fallbackId
  const helpId = `${id}-help`
  const errorId = `${id}-error`

  const [email, setEmail] = useState('')
  const [trap, setTrap] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return

    const address = email.trim()
    if (!looksLikeEmail(address)) {
      setStatus('invalid')
      return
    }
    // Filled only by bots. Look successful, send nothing.
    if (trap) {
      setStatus('joined')
      return
    }

    setStatus('sending')
    setStatus(await joinWaitlist(address, source))
  }

  if (status === 'joined' || status === 'already') {
    return (
      <div role="status" className={cn('max-w-md', className)}>
        <p className="text-[19px] font-semibold tracking-tight text-slate-900">
          {status === 'joined' ? "You're on the list." : "You're already on the list."}
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-700">
          We&rsquo;ll email {email.trim()} when Pillars opens.
        </p>
      </div>
    )
  }

  const invalid = status === 'invalid'
  const failed = status === 'error'

  return (
    // A container: whether the field and button share a row depends on the
    // space this form has, not the window. The closing band's form is narrow
    // on a tablet even though the window isn't.
    <form onSubmit={handleSubmit} noValidate className={cn('@container max-w-md', className)}>
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-[14px] font-medium text-slate-800">
          Email
        </label>

        <div className="flex flex-col gap-2.5 @sm:flex-row">
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (invalid || failed) setStatus('idle')
            }}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid || failed ? `${helpId} ${errorId}` : helpId}
            className={cn(
              // 16px: iOS zooms the page into any smaller field.
              'min-w-0 flex-1 rounded-pill border bg-white px-5 py-3 text-[16px] text-slate-900',
              'shadow-[var(--shadow-rest)] outline-none transition-[border-color,box-shadow] duration-150',
              'focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
              invalid ? 'border-error-text' : 'border-slate-300',
            )}
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-pill px-6 py-3 text-[15px] font-semibold text-white',
              'transition-[transform,opacity] duration-150 active:scale-[0.98]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              status === 'sending' ? 'cursor-wait opacity-80' : 'hover:opacity-95',
            )}
            style={{
              background: 'var(--gradient-primary-strong)',
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            {status === 'sending' ? 'Joining…' : 'Join the list'}
          </button>
        </div>

        {/* Off-screen and unlabelled for people; bots fill every field. */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={trap}
          onChange={(e) => setTrap(e.target.value)}
          className="absolute -left-[9999px] h-px w-px opacity-0"
        />

        {(invalid || failed) && (
          <p id={errorId} role="alert" className="text-[14px] text-error-text">
            {invalid
              ? "That doesn't look like an email address."
              : 'Something went wrong on our end. Try again in a moment.'}
          </p>
        )}

        <p id={helpId} className="text-[13.5px] leading-relaxed text-slate-600">
          One email when Pillars opens, and the occasional update. Unsubscribe
          anytime.
        </p>
      </div>
    </form>
  )
}
