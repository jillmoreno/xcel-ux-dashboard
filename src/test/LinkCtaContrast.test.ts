import { describe, expect, it } from 'vitest'

/**
 * WCAG AA guard for the link-style CTAs — `.cre-gift-cta` (Gift Recipients
 * Download, the course card's "Enrol again") and `.cre-collection-link`
 * (My Courses → View Archived / Back to My Courses).
 *
 * WHY THIS FILE EXISTS. These shipped as `cta-500` set INLINE on the caller,
 * and both halves of that were wrong:
 *
 *   1. `cta-500` is not a legible text colour on the page background. It failed
 *      AA on McKissock in the DEFAULT LIGHT THEME (2.13:1) — no flag, no dark
 *      mode, no membership state needed — and failed on five of six brands in
 *      dark. The old `cta-700` hover then made dark WORSE (CRE 1.29:1), so the
 *      control LOST contrast at the moment it was focused.
 *   2. Inline beats the stylesheet on specificity, so no `[data-theme='dark']`
 *      block could ever have corrected it. The bug was unfixable in CSS while
 *      the colour lived on the element.
 *
 * The fix is `--color-accent-link`, which already resolves per theme
 * (`cta-700` light / `cta-200` dark), so one declaration covers both.
 *
 * ⚠ THE OLD VALUES ARE ASSERTED AS FAILURES, not just the new ones as passes.
 * A test that only checked the safe stops would stay green while someone
 * "restored the brand colour" on these links. Each `toBeLessThan(AA)` below is
 * a tripwire: if a palette revision ever makes one pass, that is a real change
 * and this test should be updated deliberately rather than silently satisfied.
 *
 * Values are duplicated from tokens.css on purpose — the same reasoning as
 * `XcelContrast.test.ts`. A test that imported the tokens would move WITH a bad
 * edit instead of catching it.
 */

/* ── colour maths ───────────────────────────────────────────────────────── */

const luminance = (hex: string) => {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const contrast = (fg: string, bg: string) => {
  const a = luminance(fg)
  const b = luminance(bg)
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100
}

/** WCAG AA for normal-size text. These links are 12–14px. */
const AA = 4.5

/* ── the two backdrops these links sit on ───────────────────────────────── */

const PAGE_LIGHT = '#f5f5f5' // --color-surface-page  → neutral-extra-light
const PAGE_DARK = '#1b1d21' // --color-surface-page  → [data-theme='dark']

/**
 * Per brand: the OLD resting colour (`cta-500`) and the NEW one
 * (`--color-accent-link` = `cta-700` light / `cta-200` dark).
 * Fitzgerald shares Elite's ramp, as it does everywhere else.
 */
const BRANDS = {
  cre: { old: '#02568f', light: '#013355', dark: '#99bbd2' },
  mckissock: { old: '#f59233', light: '#93571e', dark: '#fbd3ad' },
  elite: { old: '#a24796', light: '#612a5a', dark: '#d9b5d5' },
  fitzgerald: { old: '#a24796', light: '#612a5a', dark: '#d9b5d5' },
  stc: { old: '#358087', light: '#1f4c51', dark: '#aecccf' },
  xcel: { old: '#9a1b1e', light: '#5f1113', dark: '#ecbdbe' },
} as const

const names = Object.keys(BRANDS) as (keyof typeof BRANDS)[]

describe('link-style CTAs clear AA on every brand, in both themes', () => {
  it.each(names)('%s — light', (brand) => {
    expect(contrast(BRANDS[brand].light, PAGE_LIGHT)).toBeGreaterThanOrEqual(AA)
  })

  it.each(names)('%s — dark', (brand) => {
    expect(contrast(BRANDS[brand].dark, PAGE_DARK)).toBeGreaterThanOrEqual(AA)
  })

  it('has McKissock light as the worst case, at 5.32:1', () => {
    // Pinned because it is the tightest of the twelve and the one that was
    // actually broken. If a ramp edit moves this, the number should move
    // deliberately.
    const ratios = names.map((b) => contrast(BRANDS[b].light, PAGE_LIGHT))
    expect(Math.min(...ratios)).toBe(5.32)
  })
})

describe('the old values stay failures — tripwires, not history', () => {
  it('cta-500 is unreadable on McKissock in the DEFAULT light theme', () => {
    // The whole reason this was rated Critical: no flag, no theme switch, no
    // membership state. Just open My Courses on McKissock.
    expect(contrast(BRANDS.mckissock.old, PAGE_LIGHT)).toBeLessThan(AA)
    expect(contrast(BRANDS.mckissock.old, PAGE_LIGHT)).toBeCloseTo(2.13, 2)
  })

  it('the old cta-700 hover made dark WORSE than resting — the inverted affordance', () => {
    // This is the part that made it more than a colour miss: focusing the
    // control reduced its contrast. Values are the old hover stop.
    const OLD_HOVER = { cre: '#013355', xcel: '#5f1113' }
    for (const [brand, hover] of Object.entries(OLD_HOVER)) {
      const resting = contrast(BRANDS[brand as keyof typeof BRANDS].old, PAGE_DARK)
      const focused = contrast(hover, PAGE_DARK)
      expect(focused).toBeLessThan(resting)
      expect(focused).toBeLessThan(AA)
    }
  })
})

/* ── the amber sibling: "Certificate Pending" ───────────────────────────── */

/**
 * The pending marker became a link on 2026-09-08 and lost its warning-tinted
 * chip with it. That changed the backdrop from a `warning-100` wash to the bare
 * card, which is white in light and a brand navy in dark — so a fixed dark stop
 * could no longer serve both. `warning-800`, what the chip used, measures
 * 8.61:1 on the light card and **1.30–2.12:1 on the dark card, on all six
 * brands** (a11y S27). `--color-status-warning-text` resolves per theme.
 */
const CARD_LIGHT = '#ffffff' // --color-surface-card → neutral-50
/** Dark `surface-card` is per-brand navy; these are the six resolved values. */
const CARD_DARK: Record<string, string> = {
  cre: '#003933',
  mckissock: '#373f02',
  elite: '#092348',
  fitzgerald: '#092348',
  stc: '#050e42',
  xcel: '#152833',
}
const WARNING_800 = '#63470f'
const WARNING_700 = '#956c18'
const WARNING_300 = '#fbd27e'

describe('the pending marker clears AA now that it has no fill', () => {
  it('light — status-warning-text on the card', () => {
    expect(contrast(WARNING_700, CARD_LIGHT)).toBe(4.73)
    expect(contrast(WARNING_700, CARD_LIGHT)).toBeGreaterThanOrEqual(AA)
  })

  it.each(Object.keys(CARD_DARK))('dark — %s', (brand) => {
    expect(contrast(WARNING_300, CARD_DARK[brand])).toBeGreaterThanOrEqual(AA)
  })

  it('keeps the OLD stop asserted as a dark-theme failure on every brand', () => {
    // Tripwire. `warning-800` is fine on the light card (8.61) and that is
    // exactly the trap — a light-only measurement would have waved it through.
    for (const [brand, bg] of Object.entries(CARD_DARK)) {
      expect(contrast(WARNING_800, bg), `${brand} dark`).toBeLessThan(AA)
    }
    expect(contrast(WARNING_800, CARD_LIGHT)).toBeGreaterThanOrEqual(AA)
  })
})
