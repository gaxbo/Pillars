import { useCallback, useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile, for the forms bots aim at: sign-up, sign-in, the
 * emails that send codes and reset links, and the landing's waitlist.
 *
 * Off until VITE_TURNSTILE_SITE_KEY is set. Then nothing loads and `token()`
 * resolves to undefined, which Supabase accepts while its own CAPTCHA
 * setting is off. Turning it on: set the key and deploy first, then switch
 * CAPTCHA on in Supabase. The other way round, every sign-in fails.
 *
 * Invisible unless Cloudflare wants a click: the check runs when a form is
 * sent, and the widget only appears if it needs the person.
 */
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

const FAILED = "We couldn't check that you're a person. Refresh the page and try again."

interface Turnstile {
  render(el: HTMLElement, options: Record<string, unknown>): string
  execute(id: string): void
  reset(id: string): void
  remove(id: string): void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let loading: Promise<Turnstile> | null = null

function loadTurnstile(): Promise<Turnstile> {
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error(FAILED)))
    script.onerror = () => {
      // Let the next form try again rather than failing forever.
      loading = null
      script.remove()
      reject(new Error(FAILED))
    }
    document.head.append(script)
  })
  return loading
}

/**
 * One widget per form. Put `ref` on an empty element where the widget may
 * appear, and pass `await token()` to the Supabase call. Each call gets a
 * fresh token: they're single-use.
 *
 * The element carries `data-captcha-visible` while the widget is showing, so
 * spacing around it can follow: Turnstile leaves an empty, zero-height box
 * there the rest of the time.
 */
export function useCaptcha() {
  const ref = useRef<HTMLDivElement>(null)
  const widget = useRef<Promise<{ api: Turnstile; id: string }> | null>(null)
  const pending = useRef<{ resolve: (token: string) => void; reject: (error: Error) => void } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!SITE_KEY || !el) return

    const settle = (token: string | null) => {
      const waiting = pending.current
      pending.current = null
      if (token) waiting?.resolve(token)
      else waiting?.reject(new Error(FAILED))
    }

    const mounted = loadTurnstile().then((api) => ({
      api,
      id: api.render(el, {
        sitekey: SITE_KEY,
        appearance: 'interaction-only',
        execution: 'execute',
        callback: (token: string) => settle(token),
        // Returning true tells Turnstile the error is handled: no retry loop.
        'error-callback': () => {
          settle(null)
          return true
        },
        'timeout-callback': () => settle(null),
        'before-interactive-callback': () => el.setAttribute('data-captcha-visible', ''),
        'after-interactive-callback': () => el.removeAttribute('data-captcha-visible'),
      }),
    }))
    widget.current = mounted
    // A failed load surfaces when the form is sent, not here.
    mounted.catch(() => {})

    return () => {
      widget.current = null
      void mounted.then(({ api, id }) => api.remove(id)).catch(() => {})
    }
  }, [])

  const token = useCallback(async (): Promise<string | undefined> => {
    if (!SITE_KEY) return undefined
    const { api, id } = await (widget.current ?? Promise.reject(new Error(FAILED)))
    return new Promise<string>((resolve, reject) => {
      pending.current?.reject(new Error(FAILED))
      pending.current = { resolve, reject }
      api.reset(id)
      api.execute(id)
    })
  }, [])

  return { ref, token }
}
