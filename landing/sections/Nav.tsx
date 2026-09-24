import { cn } from '@/lib/cn'
import { EARLY_ACCESS_URL, ROADMAP_PATH } from '../links'

type Page = 'home' | 'roadmap'

/**
 * One line, 64px: the wordmark, the roadmap, a way in for beta members, and
 * the page's one action. On a phone the roadmap moves to the footer, so the
 * row still fits at 320px.
 */
export function Nav({ page, joinInputId }: { page: Page; joinInputId: string }) {
  function joinTheList() {
    const input = document.getElementById(joinInputId)
    if (!input) return
    input.scrollIntoView({ block: 'center' })
    input.focus({ preventScroll: true })
  }

  const link = cn(
    'rounded-pill px-3 py-2 text-[14px] font-medium text-slate-700 transition-colors duration-150',
    'hover:bg-blue-100 hover:text-blue-900',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
  )

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: 'var(--surface-strip)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-7xl items-center gap-1 px-4 sm:gap-2 sm:px-6 lg:px-8"
      >
        <a
          href={page === 'home' ? '#top' : '/'}
          className="mr-auto rounded-sm text-[21px] font-bold tracking-[-0.02em] text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Pillars
          {page !== 'home' && <span className="sr-only-text">, home</span>}
        </a>

        <a
          href={ROADMAP_PATH}
          aria-current={page === 'roadmap' ? 'page' : undefined}
          className={cn(
            link,
            'hidden sm:inline-block',
            page === 'roadmap' && 'bg-blue-100 text-blue-900',
          )}
        >
          Roadmap
        </a>

        {/* For people already in the beta. The app lives on its own address
            and signs people in there. */}
        <a
          href={EARLY_ACCESS_URL}
          className={cn(link, 'inline-flex items-center gap-1.5 whitespace-nowrap')}
        >
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
            <rect x="3" y="7" width="10" height="7" rx="1.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="sm:hidden">Sign in</span>
          <span className="hidden sm:inline">Early access sign in</span>
        </a>

        <button
          type="button"
          onClick={joinTheList}
          className={cn(
            'btn-primary ml-1 whitespace-nowrap rounded-pill px-4 py-2 text-[14px] font-semibold sm:px-5',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
          )}
        >
          Join the list
        </button>
      </nav>
    </header>
  )
}
