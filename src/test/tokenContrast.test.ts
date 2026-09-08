/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { resolve as resolvePath } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * THE CONTRAST MATRIX — 6 brands × 2 themes, swept over declared token pairs.
 *
 * WHY THIS EXISTS, in the words of the 2026-09-07 a11y review that asked for it:
 * *"every one of these checks lives in a hand-written test for a specific
 * component, so nothing sweeps the matrix."* The team could already do per-theme
 * measurement and had written an exemplary guard test for one palette — and
 * still shipped three new contrast failures in the same seven days, because a
 * per-component test only covers the component someone thought to write it for.
 *
 * ⚠ THIS FILE DELIBERATELY BREAKS THE HOUSE RULE THAT GUARD TESTS DUPLICATE
 * THEIR TOKEN VALUES. `XcelContrast.test.ts` and `LinkCtaContrast.test.ts` hard-
 * code hexes on purpose, so a test cannot move WITH a bad edit. That is right
 * for pinning a specific known-good value, and wrong here: a sweep that
 * duplicated 6 × 2 × N values would rot instantly and would not cover a seventh
 * brand. So this RESOLVES from tokens.css, and what it pins is the PAIR and its
 * threshold. Break a token and the resolved value moves, the ratio drops, and
 * the pair fails — which is the behaviour we want. Keep both styles.
 *
 * TWO LISTS:
 *   MUST_PASS      — every brand × theme in scope clears the threshold.
 *   KNOWN_FAILING  — open findings, asserted as STILL failing. When someone
 *                    fixes one, this test fails and they promote it. That is the
 *                    point: the debt is visible and cannot be quietly forgotten.
 */

/* ── the cascade resolver ───────────────────────────────────────────────── */

type Theme = 'light' | 'dark'
const BRANDS = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel'] as const
type Brand = (typeof BRANDS)[number]
const THEMES: Theme[] = ['light', 'dark']

/**
 * The stylesheet, read as SOURCE text.
 *
 * ⚠ `?raw` DOES NOT WORK HERE and was tried: Vite runs CSS through its
 * transform (Tailwind v4) before handing it over, so the `:root` and
 * `[data-brand]` blocks this parser needs are gone and every token fails to
 * resolve. It has to be the file off disk.
 *
 * Hence `node:fs`, and hence the triple-slash reference above — the app's
 * tsconfig `types` array does not list `node`, so without it this passes under
 * vitest and fails `tsc -b`. Referencing the types in this one file is
 * narrower than widening the project's type surface for a single test.
 */
const TOKENS_PATH = resolvePath(process.cwd(), 'src/styles/tokens.css')
const LINES = readFileSync(TOKENS_PATH, 'utf8').split('\n')

/** Custom properties declared in the brace block opening at `start`. */
function blockAt(start: number): Record<string, string> {
  const out: Record<string, string> = {}
  let depth = 0
  for (let i = start; i < LINES.length; i += 1) {
    depth += (LINES[i].match(/\{/g) ?? []).length - (LINES[i].match(/\}/g) ?? []).length
    const m = /^\s*(--[\w-]+)\s*:\s*([^;]+);/.exec(LINES[i])
    if (m) out[m[1]] = m[2].trim()
    if (depth === 0 && i > start) break
  }
  return out
}

function selectorBlock(selector: string): Record<string, string> {
  for (let i = 0; i < LINES.length; i += 1) {
    const l = LINES[i].trim()
    if (l.startsWith(selector) && l.endsWith('{')) return blockAt(i)
  }
  return {}
}

/**
 * ⚠ ORDER IS THE CASCADE AND IS LOAD-BEARING. `@theme inline` → `:root` →
 * `[data-brand]` → `[data-theme='dark']` → `[data-theme='dark'][data-brand]`.
 * Get it wrong and a dark override silently reads its light value, which is
 * exactly the class of bug this file is here to catch.
 */
const THEME_BLOCK = selectorBlock('@theme inline')
const ROOT = selectorBlock(':root')
const DARK_ROOT = selectorBlock("[data-theme='dark']")
const BRAND_BLOCK = Object.fromEntries(
  BRANDS.map((b) => [b, selectorBlock(`[data-brand='${b}']`)]),
) as Record<Brand, Record<string, string>>
const BRAND_DARK = Object.fromEntries(
  BRANDS.map((b) => [b, selectorBlock(`[data-theme='dark'][data-brand='${b}']`)]),
) as Record<Brand, Record<string, string>>

function layers(brand: Brand, theme: Theme) {
  const l = [THEME_BLOCK, ROOT, BRAND_BLOCK[brand]]
  return theme === 'dark' ? [...l, DARK_ROOT, BRAND_DARK[brand]] : l
}

/** Resolve a custom property to a literal, following `var()` chains. */
function resolve(token: string, brand: Brand, theme: Theme): string {
  const ls = layers(brand, theme)
  const lookup = (name: string) => {
    let found: string | undefined
    for (const l of ls) if (name in l) found = l[name]
    return found
  }
  let value = lookup(token)
  for (let i = 0; value?.startsWith('var(') && i < 15; i += 1) {
    value = lookup(value.slice(4, value.indexOf(')')).trim())
  }
  if (!value) {
    // Loud, not skipped. A pair naming a token that no longer exists is a
    // silent hole in the sweep, which is the failure mode this replaces.
    throw new Error(`${token} does not resolve on ${brand}/${theme} — renamed or removed?`)
  }
  return value
}

/* ── colour maths ───────────────────────────────────────────────────────── */

type Rgb = [number, number, number]

function toRgb(value: string): Rgb {
  const v = value.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v)
  if (fn) return [Number(fn[1]), Number(fn[2]), Number(fn[3])]
  throw new Error(`cannot parse colour ${value}`)
}

/** Composite `fg` at `alpha` over `bg` — for washes declared with `over`. */
function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha))) as Rgb
}

function luminance([r, g, b]: Rgb): number {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const x = luminance(a)
  const y = luminance(b)
  return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100
}

/* ── the pairs ──────────────────────────────────────────────────────────── */

/** 4.5 for text; 3 for a meaningful non-text indicator (WCAG 1.4.11). */
const AA_TEXT = 4.5
const AA_NON_TEXT = 3

type Pair = {
  /** Where this pair actually appears, so a failure names a screen. */
  what: string
  fg: string
  bg: string
  min: number
  /** Some rules exist in one theme only — a `[data-theme='dark']` override
   *  must NOT be measured in light, or the sweep invents failures. */
  themes?: Theme[]
  /** A translucent wash between fg and bg, e.g. a tinted chip fill. */
  wash?: { token: string; alpha: number }
}

const MUST_PASS: Pair[] = [
  // Body text.
  { what: 'body text on a card', fg: '--color-text-primary', bg: '--color-surface-card', min: AA_TEXT },
  { what: 'muted text on a card', fg: '--color-text-secondary', bg: '--color-surface-card', min: AA_TEXT },
  { what: 'body text on the page', fg: '--color-text-primary', bg: '--color-surface-page', min: AA_TEXT },
  { what: 'muted text on the page', fg: '--color-text-secondary', bg: '--color-surface-page', min: AA_TEXT },

  // Link CTAs — a11y C6, fixed 2026-09-08.
  { what: 'link CTA on the page (View Archived, Download)', fg: '--color-accent-link', bg: '--color-surface-page', min: AA_TEXT },
  { what: 'link CTA on a card (Certificate Issued, Enrol again)', fg: '--color-accent-link', bg: '--color-surface-card', min: AA_TEXT },

  // Status text.
  { what: 'Certificate Pending marker', fg: '--color-status-warning-text', bg: '--color-surface-card', min: AA_TEXT },
  { what: 'error status text on a card', fg: '--color-status-error-text', bg: '--color-surface-card', min: AA_TEXT },
  { what: 'success status text on a card', fg: '--color-status-success-text', bg: '--color-surface-card', min: AA_TEXT },

  // Progress fills that were chosen against this threshold.
  { what: 'Completed progress bar', fg: '--color-progress-fill-complete', bg: '--color-neutral-100', min: AA_NON_TEXT },
  { what: 'Failed progress bar', fg: '--color-progress-fill-failed', bg: '--color-neutral-100', min: AA_NON_TEXT },
  { what: 'Expired progress bar', fg: '--color-progress-fill-expired', bg: '--color-neutral-100', min: AA_NON_TEXT },

  // The dark half of the card focus ring — a11y S26's worked example.
  {
    what: 'card focus ring, dark',
    fg: '--color-primary-300',
    bg: '--color-surface-card',
    min: AA_NON_TEXT,
    themes: ['dark'],
  },
]

type OpenFinding = Pair & { finding: string; note: string }

/**
 * Open findings. Each asserts the pair is STILL failing somewhere — so the test
 * is green today and turns red the moment someone fixes one, at which point it
 * moves to MUST_PASS. Nothing here is an excuse; it is a ledger.
 */
const KNOWN_FAILING: OpenFinding[] = [
  {
    finding: 'C1',
    what: 'non-member KPI band value',
    note: 'Four weeks old. XCEL is worst at 1.08 — the San-Juan/Brick collision XcelContrast.test.ts documents and the product violates.',
    fg: '--color-cta-500',
    bg: '--color-secondary-800',
    min: AA_TEXT,
  },
  {
    finding: 'C1',
    what: 'non-member KPI band CTA',
    note: 'The cta-700 fallback is no better on this band — 1.15–1.74 on all six.',
    fg: '--color-cta-700',
    bg: '--color-secondary-800',
    min: AA_TEXT,
  },
  {
    finding: 'C4',
    what: 'cancellation flow secondary button, dark',
    note: 'Two weeks. Fix is a [data-theme=dark] block: --secondary → var(--color-accent-link).',
    fg: '--color-cta-700',
    bg: '--color-surface-card',
    min: AA_TEXT,
    themes: ['dark'],
  },
  {
    finding: 'C4',
    what: 'cancellation flow danger button, dark',
    note: 'Same block: --danger → var(--color-status-error-text).',
    fg: '--color-error-600',
    bg: '--color-surface-card',
    min: AA_TEXT,
    themes: ['dark'],
  },
  {
    finding: 'S26',
    what: 'focus rings still on primary-500',
    note: '.cre-enrolled-option and friends never got the per-theme fix .cre-course-card did. NOTE this also fails McKissock in LIGHT at 2.95, which the card ring shares — the "fixed" rule is only fixed for dark.',
    fg: '--color-primary-500',
    bg: '--color-surface-card',
    min: AA_NON_TEXT,
  },
  {
    finding: 'NEW-1',
    what: 'the default in-progress progress bar',
    note: 'Found by this sweep, 2026-09-08. The BRAND fill against its own track: McKissock 2.50 light, STC 1.16 dark, XCEL 1.86, Elite/Fitzgerald 2.10. The three fills added this week were held to 3:1 and clear it; the oldest one never was.',
    fg: '--color-progress-fill',
    bg: '--color-neutral-100',
    min: AA_NON_TEXT,
  },
  {
    finding: 'NEW-2',
    what: 'the Expiring Soon progress bar',
    note: 'Found by this sweep, 2026-09-08. Amber on a light-grey track is 1.53 on every brand in light — the one bar whose colour is meant to urge something is the least visible. The label carries the state too, so this is a weakened signal rather than a lost one.',
    fg: '--color-warning-500',
    bg: '--color-neutral-100',
    min: AA_NON_TEXT,
  },
]

/* ── the sweep ──────────────────────────────────────────────────────────── */

type Result = { brand: Brand; theme: Theme; ratio: number }

function sweep(pair: Pair): Result[] {
  const out: Result[] = []
  for (const brand of BRANDS) {
    for (const theme of pair.themes ?? THEMES) {
      let bg = toRgb(resolve(pair.bg, brand, theme))
      if (pair.wash) bg = over(toRgb(resolve(pair.wash.token, brand, theme)), bg, pair.wash.alpha)
      out.push({ brand, theme, ratio: contrast(toRgb(resolve(pair.fg, brand, theme)), bg) })
    }
  }
  return out
}

const show = (rs: Result[]) => rs.map((r) => `${r.brand}/${r.theme} ${r.ratio}`).join(', ')

describe('every declared pair clears AA on every brand, in both themes', () => {
  it.each(MUST_PASS.map((p) => [`${p.what} — ${p.fg} on ${p.bg}`, p] as const))(
    '%s',
    (_label, pair) => {
      const failing = sweep(pair).filter((r) => r.ratio < pair.min)
      expect(failing.length, `needs ${pair.min}:1 — ${show(failing)}`).toBe(0)
    },
  )
})

describe('open findings are still open — promote them when they are fixed', () => {
  it.each(KNOWN_FAILING.map((p) => [`${p.finding} · ${p.what}`, p] as const))(
    '%s',
    (_label, pair) => {
      const failing = sweep(pair).filter((r) => r.ratio < pair.min)
      expect(
        failing.length,
        `This pair now PASSES everywhere — ${pair.finding} looks fixed. Move it to MUST_PASS rather than deleting it. ${pair.note}`,
      ).toBeGreaterThan(0)
    },
  )
})

describe('the sweep itself', () => {
  it('resolves every token it names, on every brand and theme', () => {
    // A pair naming a renamed token would otherwise throw mid-sweep and read as
    // a contrast failure. This says plainly which it is.
    for (const pair of [...MUST_PASS, ...KNOWN_FAILING]) {
      for (const brand of BRANDS) {
        for (const theme of pair.themes ?? THEMES) {
          expect(() => resolve(pair.fg, brand, theme)).not.toThrow()
          expect(() => resolve(pair.bg, brand, theme)).not.toThrow()
        }
      }
    }
  })

  it('reads the real cascade — a dark override must not resolve to its light value', () => {
    // The resolver's whole job. `--color-accent-link` is cta-700 light and
    // cta-200 dark; if the layer order were wrong this is what would silently
    // read the same in both, and every dark measurement would be a lie.
    for (const brand of BRANDS) {
      expect(
        resolve('--color-accent-link', brand, 'light'),
        `${brand}: light and dark accent-link resolved the same`,
      ).not.toBe(resolve('--color-accent-link', brand, 'dark'))
    }
  })

  it('covers all six brands', () => {
    // Adding a seventh brand should extend the sweep, not slip past it.
    expect(sweep(MUST_PASS[0])).toHaveLength(BRANDS.length * 2)
  })
})
