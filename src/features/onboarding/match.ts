import { ARCHETYPES, TEMPLATES, type PillarTemplate } from './catalog'

export interface TemplateMatch {
  template: PillarTemplate
  score: number
}

/** Words too common to carry any signal. */
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'have', 'been', 'more', 'some',
  'want', 'need', 'about', 'into', 'from', 'just', 'like', 'get', 'got', 'but',
  'not', 'all', 'out', 'was', 'are', 'can', 'own', 'too', 'why', 'how',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
}

/** Crude but sufficient: "running" and "runs" both reduce to "run". */
function stem(word: string): string {
  return word.replace(/(ing|ed|es|s)$/, '').replace(/(.)\1$/, '$1')
}

const LABELS = ['Best selection', 'Close', 'Honorable mention']

export function matchLabel(index: number): string {
  return LABELS[index] ?? 'Also worth a look'
}

/**
 * Scores each template against the dump text and the chosen archetypes.
 *
 * Deliberately keyword-based rather than an LLM call: it is instant, free,
 * works offline, and for "which of six starting sets fits you" it is good
 * enough. The next screen lets the user edit everything anyway, so a wrong
 * guess costs them one click rather than a bad outcome.
 */
export function matchTemplates(
  dump: string[],
  archetypeIds: string[],
): TemplateMatch[] {
  const words = new Set(tokenize(dump.join(' ')).map(stem))

  // A chosen archetype lends its own vocabulary to the signal.
  const archetypeWords = new Set(
    ARCHETYPES.filter((a) => archetypeIds.includes(a.id))
      .flatMap((a) => a.keywords)
      .flatMap(tokenize)
      .map(stem),
  )

  const scored = TEMPLATES.map((template) => {
    // Once each: "kid" and "kids" are one word to the stemmer, and one
    // mention in the dump shouldn't count twice.
    const keywords = new Set(template.keywords.flatMap(tokenize).map(stem))

    let score = 0
    for (const keyword of keywords) {
      if (words.has(keyword)) score += 3
      if (archetypeWords.has(keyword)) score += 1
    }

    // A direct archetype pick is the strongest signal available.
    for (const id of archetypeIds) {
      if (template.archetypes.includes(id)) score += 8
    }

    return { template, score }
  })

  // Stable ordering: ties fall back to catalog order rather than reshuffling
  // on every render.
  return scored.sort(
    (a, b) => b.score - a.score || TEMPLATES.indexOf(a.template) - TEMPLATES.indexOf(b.template),
  )
}
