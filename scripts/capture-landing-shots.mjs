// Captures the landing page's product screenshots from the real app.
//
//   npm run shots:landing
//
// Starts the app on its own port with sample data (VITE_BYPASS_AUTH=true, so
// no account is needed), drives the system Chrome with playwright-core, and
// writes 2x WebP files to landing/public/shots/. Re-run it whenever the app's
// look changes so the landing page never shows a stale product.

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const PORT = 5190
const BASE = `http://localhost:${PORT}`
const OUT = new URL('../landing/public/shots/', import.meta.url).pathname

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  env: { ...process.env, VITE_BYPASS_AUTH: 'true' },
  stdio: 'ignore',
})

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`App dev server did not start on ${BASE}`)
}

/** Screenshots must meet the landing's own copy rules: no em or en dashes. */
async function assertNoDashes(locator, name) {
  const text = await locator.innerText()
  if (/[–—]/.test(text)) {
    throw new Error(`${name} shows an em or en dash: fix the source text first`)
  }
}

/**
 * Chrome encodes WebP; Playwright only writes PNG or JPEG. Round-trip the PNG
 * through a canvas rather than adding an image library for one conversion.
 */
async function writeWebp(browser, png, path) {
  const page = await browser.newPage()
  const dataUrl = await page.evaluate(async (base64) => {
    const img = new Image()
    img.src = `data:image/png;base64,${base64}`
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d').drawImage(img, 0, 0)
    return canvas.toDataURL('image/webp', 0.9)
  }, png.toString('base64'))
  await writeFile(path, Buffer.from(dataUrl.split(',')[1], 'base64'))
  await page.close()
}

/** Time-gated nudges would otherwise photobomb shots taken in the evening. */
const QUIET = '[aria-label="Tasks still open today"] { display: none !important }'

/**
 * `target` returns the clip; `shows` returns what's inside it, for the dash
 * check. The page holds off-screen overlays whose text never reaches the shot.
 */
/**
 * A phone opens on today, so its shot would change with the day it's taken.
 * Monday is the sample week's fullest day: several pillars at work, two left
 * empty, the mix the board is about.
 */
const openMonday = (page) =>
  page.locator('nav[aria-label="Days this week"] div.grid button').first().click()

async function shoot(browser, name, { width, height, path = '/', quiet = true, prepare, target, shows }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    isMobile: width < 768,
    hasTouch: width < 768,
  })
  const page = await context.newPage()
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  if (quiet) await page.addStyleTag({ content: QUIET })
  await page.waitForTimeout(400)
  if (prepare) await prepare(page)
  await page.waitForTimeout(400)

  const clip = await target(page)
  for (const locator of await shows(page)) await assertNoDashes(locator, name)
  await writeWebp(browser, await page.screenshot({ clip }), `${OUT}${name}.webp`)
  console.log(`  ${name}.webp  ${Math.round(clip.width)}x${Math.round(clip.height)}`)
  await context.close()
}

/** The bounding box of a locator, padded and clamped to the viewport. */
async function box(locator, { pad = 0, maxHeight } = {}) {
  const b = await locator.boundingBox()
  if (!b) throw new Error('Nothing to capture')
  const x = Math.max(0, b.x - pad)
  const y = Math.max(0, b.y - pad)
  const height = b.height + pad * 2
  return {
    x,
    y,
    width: b.width + pad * 2,
    height: maxHeight ? Math.min(height, maxHeight) : height,
  }
}

try {
  await mkdir(OUT, { recursive: true })
  await waitForServer()
  const browser = await chromium.launch({ channel: 'chrome' })
  console.log('Capturing into landing/public/shots/')

  // Each section of the landing shows a different life (src/data/mock.ts):
  // the hero The Good Week, Method's shots Hold the Line, and its phone
  // Back On Your Feet.

  // The hero: the whole week, exactly as the app opens.
  await shoot(browser, 'board-full', {
    width: 1440,
    height: 900,
    path: '/?sample=the-good-week',
    target: async () => ({ x: 0, y: 0, width: 1440, height: 900 }),
    shows: (page) => [page.locator('header').first(), page.locator('main')],
  })

  // The hero on a phone: the whole first screen.
  await shoot(browser, 'phone-full', {
    width: 390,
    height: 844,
    path: '/?sample=the-good-week',
    prepare: openMonday,
    target: async () => ({ x: 0, y: 0, width: 390, height: 844 }),
    shows: (page) => [page.locator('header').first(), page.locator('nav'), page.locator('main')],
  })

  // Four days of the week grid: pillars as rows of work, empty ones receding.
  await shoot(browser, 'board', {
    width: 1760,
    height: 900,
    path: '/?sample=hold-the-line',
    target: async (page) => {
      const first = await page.locator('main section').nth(0).boundingBox()
      const fourth = await page.locator('main section').nth(3).boundingBox()
      return {
        x: first.x - 12,
        y: first.y - 12,
        width: fourth.x + fourth.width - first.x + 24,
        height: 500,
      }
    },
    shows: (page) => [0, 1, 2, 3].map((i) => page.locator('main section').nth(i)),
  })

  // The This Week panel: every pillar's goal, done and planned.
  await shoot(browser, 'goals', {
    width: 1440,
    height: 900,
    path: '/?sample=hold-the-line',
    prepare: (page) => page.getByRole('button', { name: 'View goals', exact: true }).click(),
    target: (page) => box(page.getByRole('dialog', { name: 'This week' }), { maxHeight: 492 }),
    shows: (page) => [page.getByRole('dialog', { name: 'This week' })],
  })

  // A phone: one day, the week as a strip.
  await shoot(browser, 'phone', {
    width: 390,
    height: 760,
    path: '/?sample=back-on-your-feet',
    prepare: openMonday,
    // Down to the day's card and no further. Method.tsx sizes the image,
    // so match its height there if this changes.
    target: async (page) => {
      const day = await page.locator('main section').first().boundingBox()
      return { x: 0, y: 0, width: 390, height: Math.ceil(day.y + day.height + 16) }
    },
    shows: (page) => [page.locator('header').first(), page.locator('nav'), page.locator('main')],
  })

  // End of day: one open task at a time, each gets a decision.
  await shoot(browser, 'triage', {
    width: 1280,
    height: 860,
    path: '/?preview=eod&sample=hold-the-line',
    quiet: false,
    prepare: async (page) => {
      await page.getByRole('button', { name: 'Take a look' }).click()
      // The card alone over the page wash, without the dimmed board behind it.
      await page.addStyleTag({
        content: 'main, header { visibility: hidden } [role="dialog"][aria-label="Open tasks"] ~ *, .inset-0:has(+ [aria-label="Open tasks"]) { opacity: 0 !important }',
      })
    },
    // Tight to the card: the landing lays it over another shot and gives it
    // its own radius and shadow.
    target: (page) => box(page.getByRole('dialog', { name: 'Open tasks' })),
    shows: (page) => [page.getByRole('dialog', { name: 'Open tasks' })],
  })

  // The weekly report card: its headline and the week's three numbers.
  await shoot(browser, 'review', {
    width: 1280,
    height: 900,
    path: '/weekly-review?sample=hold-the-line',
    target: async (page) => {
      const column = await box(page.locator('h1').locator('xpath=..'), { pad: 40 })
      const stats = await page.getByText('goals completed').boundingBox()
      return { ...column, y: 0, height: stats.y + stats.height + 56 }
    },
    shows: (page) => [page.locator('#root')],
  })

  await browser.close()
} finally {
  server.kill()
}
