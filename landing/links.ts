/**
 * Where the landing page sends people. The app is deployed separately, so
 * its address comes from VITE_APP_URL; in dev it's the app's own dev server.
 */
const APP_URL = (
  import.meta.env.VITE_APP_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')
).replace(/\/$/, '')

/** The app's sign-in, flagged so it greets beta members as early access. */
export const EARLY_ACCESS_URL = `${APP_URL}/sign-in?access=early`

export const ROADMAP_PATH = '/roadmap'
