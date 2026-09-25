import { EARLY_ACCESS_URL, ROADMAP_PATH } from './links'

/** The wordmark, the site's other pages, and the year. */
export function Footer() {
  const link =
    'rounded-sm underline-offset-4 hover:text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700'

  return (
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-10 text-[14px] text-slate-600 sm:px-6 lg:px-8">
      <a
        href="/"
        className="mr-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
      >
        <img src="/brand/pillars-logo.svg" alt="Pillars" width={82} height={22} className="block h-[22px] w-auto" />
      </a>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
        <a href={ROADMAP_PATH} className={link}>
          Roadmap
        </a>
        <a href={EARLY_ACCESS_URL} className={link}>
          Early access sign in
        </a>
      </nav>
      <span>&copy; {new Date().getFullYear()} Pillars</span>
    </footer>
  )
}
