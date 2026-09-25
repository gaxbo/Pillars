/**
 * A site address from an env var, made safe to build links on: `https://`
 * added when it was left off (Vercel's form takes "pillars.vercel.app" as
 * readily as the full address, and without a scheme the browser reads it as
 * a page on the current site), and no trailing slash. Empty stays empty.
 */
export function siteUrl(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
