import { useEffect, useId, useRef, useState } from 'react'
import { useCaptcha } from '@/lib/captcha'
import { cn } from '@/lib/cn'
import { joinWaitlist, looksLikeEmail, type JoinResult } from './waitlist'

type Status = 'idle' | 'sending' | JoinResult

interface WaitlistFormProps {
  /** Which form on the page this is, stored alongside the address. */
  source: 'hero' | 'footer' | 'roadmap'
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
  const doneRef = useRef<HTMLDivElement>(null)
  const captcha = useCaptcha()

  // The form, and the button that was focused, are replaced by the result.
  // Focus follows it, or a keyboard user would be dropped back at the top.
  const finished = status === 'joined'
  useEffect(() => {
    if (finished) doneRef.current?.focus()
  }, [finished])

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
    let token: string | undefined
    try {
      token = await captcha.token()
    } catch {
      setStatus('error')
      return
    }
    setStatus(await joinWaitlist(address, source, token))
  }

  if (finished) {
    return (
      <div
        ref={doneRef}
        role="status"
        tabIndex={-1}
        className={cn('max-w-md rounded-sm outline-none', className)}
      >
        <p className="text-[19px] font-semibold tracking-tight text-slate-900">
          You&rsquo;re on the list.
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
              'hover:border-blue-400 focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/30',
              invalid ? 'border-error-text' : 'border-slate-500',
            )}
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            aria-busy={status === 'sending' || undefined}
            className={cn(
              'btn-primary shrink-0 whitespace-nowrap rounded-pill px-6 py-3 text-[15px] font-semibold',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
              status === 'sending' && 'cursor-wait',
            )}
          >
            {status === 'sending' ? 'Joining…' : 'Join the list'}
          </button>
        </div>

        {/* Turnstile's widget, if it wants a click (lib/captcha). Empty, the
            negative margin takes back the column gap it would add. */}
        <div ref={captcha.ref} className="-mt-2 data-captcha-visible:mt-0" />

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
