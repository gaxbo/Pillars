// Builds every Pillars brand file in brand/ from one definition of the mark,
// then copies the ones the sites use into public/ and landing/public/.
//
//   npm run brand
//
// The wordmark is outlined from Instrument Sans (SIL Open Font License), so
// no file needs the font. PNGs are rendered in the system Chrome with
// playwright-core, the same way scripts/capture-landing-shots.mjs works.

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import opentype from 'opentype.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}brand/`
const FONTS = `${ROOT}node_modules/@fontsource/instrument-sans/files/`
mkdirSync(OUT, { recursive: true })

// Pillars tokens (src/design/tokens.css).
const INK = '#1B2228'
const DEEP = '#2F6F9B'
const PRIMARY = '#54A7DE'
const PALE = '#CFE6F6'
const LIGHT_BLUE = '#A9D5EF'
const BLUE_600 = '#3D8CC0'

// The meter: a 24-unit grid, 5u pillars, 1.5u gutters, 1u corners.
const TRACKS = [[3, 3, 5, 18], [16, 3, 5, 18]]
const FILLS = [[3, 10, 5, 11], [9.5, 3, 5, 18], [16, 14, 5, 7]]
const rect = ([x, y, w, h], fill, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1" fill="${fill}"${extra}/>`

/**
 * The mark's shapes in its own 24u space. One gradient spans y 3 to 21, so a
 * short pillar only reaches its deeper end: the fuller, the lighter.
 */
function meter({ id, track, trackOpacity = 1, top, bottom }) {
  const flat = top === bottom
  const gradient = flat
    ? ''
    : `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="3" x2="0" y2="21"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`
  const fill = flat ? top : `url(#${id})`
  const opacity = trackOpacity === 1 ? '' : ` fill-opacity="${trackOpacity}"`
  return {
    defs: gradient,
    shapes: TRACKS.map((t) => rect(t, track, opacity)).join('') + FILLS.map((f) => rect(f, fill)).join(''),
  }
}

const VARIANTS = {
  light: { id: 'pillars-light', track: PALE, top: PRIMARY, bottom: DEEP },
  dark: { id: 'pillars-dark', track: '#FFFFFF', trackOpacity: 0.14, top: LIGHT_BLUE, bottom: BLUE_600 },
  flat: { id: 'pillars-flat', track: PALE, top: DEEP, bottom: DEEP },
  mono: { id: 'pillars-mono', track: 'currentColor', trackOpacity: 0.25, top: 'currentColor', bottom: 'currentColor' },
  onBlue: { id: 'pillars-icon', track: '#FFFFFF', trackOpacity: 0.3, top: '#FFFFFF', bottom: LIGHT_BLUE },
}

const svgFile = (viewBox, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Pillars"><title>Pillars</title>${body}</svg>\n`

function markFile(variant) {
  const m = meter(VARIANTS[variant])
  return svgFile('0 0 24 24', (m.defs ? `<defs>${m.defs}</defs>` : '') + m.shapes)
}

/** The app icon: the mark on Pillars blue. `square` is full-bleed, for platforms that round corners themselves. */
function iconFile(square = false) {
  const m = meter(VARIANTS.onBlue)
  return svgFile(
    '0 0 64 64',
    `<defs>${m.defs}</defs><rect width="64" height="64"${square ? '' : ' rx="15"'} fill="${DEEP}"/>` +
      `<g transform="translate(14 14) scale(1.5)">${m.shapes}</g>`,
  )
}

// The wordmark: "pillars" in Instrument Sans SemiBold, tracked -0.045em.
const font = opentype.parse(readFileSync(`${FONTS}instrument-sans-latin-600-normal.woff`).buffer)
const SIZE = 100
const scale = SIZE / font.unitsPerEm
const TRACKING = -0.045
const lHeight = font.charToGlyph('l').getBoundingBox().y2 * scale

/**
 * Laid out by hand: opentype.js's shaping step trips on one of this font's
 * OpenType tables, and "pillars" needs no ligatures, only advance widths,
 * the font's own kerning and the tracking.
 */
function wordPath(x, y) {
  const path = new opentype.Path()
  const glyphs = [...'pillars'].map((c) => font.charToGlyph(c))
  let pen = x
  glyphs.forEach((glyph, i) => {
    path.extend(glyph.getPath(pen, y, SIZE))
    pen += glyph.advanceWidth * scale + TRACKING * SIZE
    const next = glyphs[i + 1]
    if (next) pen += font.getKerningValue(glyph, next) * scale
  })
  return path
}
const word = wordPath(0, 0).getBoundingBox()

/** The mark as tall as the l, on the wordmark's baseline, 0.42 of its height away. */
function logoFile(variant, textColor) {
  const s = lHeight / 18
  const textX = 18 * s + lHeight * 0.42 - word.x1
  const top = Math.min(-lHeight, word.y1)
  const width = textX + word.x2
  const height = word.y2 - top
  const m = meter(VARIANTS[variant])
  const body =
    (m.defs ? `<defs>${m.defs}</defs>` : '') +
    `<g transform="translate(${(-3 * s).toFixed(3)} ${(-top - lHeight - 3 * s).toFixed(3)}) scale(${s.toFixed(4)})">${m.shapes}</g>` +
    `<path d="${wordPath(textX, -top).toPathData(2)}" fill="${textColor}"/>`
  return svgFile(`0 0 ${width.toFixed(2)} ${height.toFixed(2)}`, body)
}

const svgs = {
  'pillars-logo.svg': logoFile('light', INK),
  'pillars-logo-dark.svg': logoFile('dark', '#FFFFFF'),
  'pillars-mark.svg': markFile('light'),
  'pillars-mark-dark.svg': markFile('dark'),
  'pillars-mark-flat.svg': markFile('flat'),
  'pillars-mark-mono.svg': markFile('mono'),
  'pillars-icon.svg': iconFile(),
  'pillars-icon-square.svg': iconFile(true),
}
for (const [name, text] of Object.entries(svgs)) writeFileSync(OUT + name, text)

// The link preview, as the landing page says it.
const og = `<!doctype html><html><head><style>
@font-face{font-family:'Instrument Sans';font-weight:400;src:url(file://${FONTS}instrument-sans-latin-400-normal.woff2) format('woff2')}
@font-face{font-family:'Instrument Sans';font-weight:600;src:url(file://${FONTS}instrument-sans-latin-600-normal.woff2) format('woff2')}
body{margin:0}
</style></head><body>
<div style="width:1200px;height:630px;box-sizing:border-box;padding:88px 96px;background:${INK};display:flex;justify-content:space-between;font-family:'Instrument Sans',sans-serif">
  <div style="display:flex;flex-direction:column;justify-content:space-between">
    <img src="file://${OUT}pillars-logo-dark.svg" style="height:52px;align-self:flex-start">
    <div>
      <p style="margin:0;color:#FFFFFF;font-size:84px;font-weight:600;letter-spacing:-0.04em;line-height:1.02;max-width:700px">A week you meant to have.</p>
      <p style="margin:24px 0 0;color:#9FB0BD;font-size:28px;font-weight:400;letter-spacing:-0.01em;line-height:1.35;max-width:640px">Pick the few things that matter. Give each one a goal. Then watch the week actually add up.</p>
    </div>
  </div>
  <img src="file://${OUT}pillars-mark-dark.svg" style="width:300px;height:300px;align-self:center;margin-right:-20px">
</div></body></html>`
// Pages to render live in a temp folder, not beside the brand files.
const TMP = mkdtempSync(join(tmpdir(), 'pillars-brand-'))
writeFileSync(join(TMP, 'og.html'), og)
const image = (svg, size) =>
  `<body style="margin:0"><img src="file://${OUT}${svg}" width="${size}" height="${size}" style="display:block"></body>`
writeFileSync(join(TMP, 'icon-512.html'), image('pillars-icon.svg', 512))
writeFileSync(join(TMP, 'icon-180.html'), image('pillars-icon-square.svg', 180))

const browser = await chromium.launch({ channel: 'chrome' })
try {
  const render = async (page, width, height, file, transparent = false) => {
    const tab = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    await tab.goto(`file://${join(TMP, page)}`, { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    await tab.waitForTimeout(300)
    await tab.screenshot({ path: OUT + file, omitBackground: transparent })
    await tab.close()
  }
  await render('icon-512.html', 512, 512, 'pillars-icon-512.png', true)
  await render('icon-180.html', 180, 180, 'apple-touch-icon.png')
  await render('og.html', 1200, 630, 'pillars-og.png')
} finally {
  await browser.close()
  rmSync(TMP, { recursive: true, force: true })
}

// Into the two sites.
for (const site of ['public/', 'landing/public/']) {
  copyFileSync(`${OUT}pillars-icon.svg`, `${ROOT}${site}favicon.svg`)
  copyFileSync(`${OUT}apple-touch-icon.png`, `${ROOT}${site}apple-touch-icon.png`)
}
for (const site of ['public/', 'landing/public/']) {
  mkdirSync(`${ROOT}${site}brand`, { recursive: true })
  copyFileSync(`${OUT}pillars-logo.svg`, `${ROOT}${site}brand/pillars-logo.svg`)
}
copyFileSync(`${OUT}pillars-og.png`, `${ROOT}landing/public/og.png`)

// Browsers keep a favicon long after it changes, reloads included. Each
// page's icon links carry a fingerprint of the file, so a new icon is a new
// address and every browser fetches it.
const fingerprint = (file) => createHash('sha256').update(readFileSync(OUT + file)).digest('hex').slice(0, 8)
const stamps = { 'favicon.svg': fingerprint('pillars-icon.svg'), 'apple-touch-icon.png': fingerprint('apple-touch-icon.png') }
for (const page of ['index.html', 'landing/index.html']) {
  let html = readFileSync(ROOT + page, 'utf8')
  for (const [file, hash] of Object.entries(stamps)) {
    html = html.replace(new RegExp(`href="/${file.replace('.', '\\.')}(\\?v=[a-f0-9]+)?"`), `href="/${file}?v=${hash}"`)
  }
  writeFileSync(ROOT + page, html)
}

console.log(`Built ${Object.keys(svgs).length} SVGs and 3 PNGs in brand/, and copied the site files.`)
