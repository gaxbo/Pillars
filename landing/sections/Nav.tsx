import { HERO_EMAIL_ID } from './Hero'

/** One line, 64px. The wordmark and the page's one action. */
export function Nav() {
  function joinTheList() {
    const input = document.getElementById(HERO_EMAIL_ID)
    if (!input) return
    input.scrollIntoView({ block: 'center' })
    input.focus({ preventScroll: true })
  }

  return (
    <header
      className="sticky top-0 z-30 border-b"
      style={{
        background: 'var(--surface-strip)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          className="rounded-sm text-[21px] font-bold tracking-[-0.02em] text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
        >
          Pillars
        </a>
        <button
          type="button"
          onClick={joinTheList}
          className="whitespace-nowrap rounded-pill px-5 py-2 text-[14px] font-semibold text-white transition-[transform,opacity] duration-150 hover:opacity-95 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          style={{
            background: 'var(--gradient-primary-strong)',
            boxShadow: 'var(--shadow-raised)',
          }}
        >
          Join the list
        </button>
      </div>
    </header>
  )
}
