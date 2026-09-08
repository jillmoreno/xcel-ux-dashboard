import { describe, expect, it } from 'vitest'

/**
 * WCAG AA guards for the XCEL palette.
 *
 * WHY THIS FILE EXISTS. XCEL's six published brand colours split unusually:
 * two of the four ramp colours CANNOT carry text on a light surface at all,
 * and the two that can are 1.08:1 against EACH OTHER. Neither fact is visible
 * from the token names, and both have an obvious-looking wrong answer:
 *
 *   - Saffron is the brand's "pop" colour and the natural instinct is to use it
 *     for a link or an icon. At 1.62:1 on white it is invisible.
 *   - Brick is the CTA, and dropping a `cta-500` button onto the navy rail is
 *     what you do on every other brand. On XCEL it disappears in greyscale.
 *
 * SO THE FAILURES ARE ASSERTED, NOT JUST THE PASSES. A test that only checked
 * the safe stops would stay green while someone promoted Saffron to a text
 * colour. Each `expect(...).toBeLessThan(AA)` below is a tripwire: if a future
 * palette revision makes one of these pass, that is a real change and the test
 * should be updated deliberately rather than silently satisfied.
 *
 * Values are duplicated from `[data-brand='xcel']` in tokens.css on purpose —
 * a test that imported the tokens would move WITH a bad edit instead of
 * catching it.
 */

/* ── colour maths ───────────────────────────────────────────────────────── */

const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16))

const luminance = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => v / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const contrast = (fg: string, bg: string) => {
  const a = luminance(fg)
  const b = luminance(bg)
  return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100
}

/** WCAG AA for normal-size text. */
const AA = 4.5

const WHITE = '#ffffff'
/** The near-black the project puts on light brand fills. */
const INK = '#1c1d1f'

/** `[data-brand='xcel']` — the stops this file reasons about. */
const X = {
  primary400: '#6b8ca3',
  primary500: '#2d5872', // San Juan (published)
  primary700: '#1d3849',
  primary800: '#152833', // the dark rail
  primary200: '#c7d4dd',
  primary300: '#9db3c2',
  secondary500: '#fac41e', // Saffron (published)
  secondary700: '#a87d0e',
  secondary800: '#6b4f08',
  tertiary500: '#9d815a', // Beech (published)
  tertiary600: '#806a4a',
  tertiary700: '#625139',
  cta200: '#ecbdbe',
  cta300: '#d98486',
  cta400: '#bd4a4c',
  cta500: '#9a1b1e', // Brick (published)
  textPrimary: '#3a3a3a', // Charcoal
  textSecondary: '#666666', // Gray
}

describe('XCEL palette — the three constraints that are not visible from the token names', () => {
  describe('1 · Saffron is FILL-ONLY (secondary)', () => {
    it('FAILS as text on white — do not make this pass by lightening the ramp', () => {
      expect(contrast(X.secondary500, WHITE)).toBe(1.62)
      expect(contrast(X.secondary500, WHITE)).toBeLessThan(AA)
      // -700 is the last stop that still reads as the brand colour, and it
      // still fails. The first passing stop is -800, which is brown.
      expect(contrast(X.secondary700, WHITE)).toBeLessThan(AA)
      expect(contrast(X.secondary800, WHITE)).toBeGreaterThanOrEqual(AA)
    })

    it('takes NEAR-BLACK text, never white — which is what XCEL’s own site does', () => {
      expect(contrast(INK, X.secondary500)).toBeGreaterThanOrEqual(AA)
      expect(contrast(WHITE, X.secondary500)).toBeLessThan(AA)
    })

    it('earns its keep on the dark rail', () => {
      expect(contrast(X.secondary500, X.primary800)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('2 · Beech fails as text mid-ramp (tertiary)', () => {
    it('FAILS at -500, unlike every other brand’s tertiary ramp', () => {
      expect(contrast(X.tertiary500, WHITE)).toBe(3.67)
      expect(contrast(X.tertiary500, WHITE)).toBeLessThan(AA)
    })

    it('passes from -600, and the one call site that reads it as text uses -700', () => {
      expect(contrast(X.tertiary600, WHITE)).toBeGreaterThanOrEqual(AA)
      // The Gift Recipients recipient `mailto:` link.
      expect(contrast(X.tertiary700, WHITE)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('3 · San Juan and Brick are near-identical in LUMINANCE', () => {
    it('is the reason a cta-500 element must never sit on a primary surface', () => {
      // 1.08:1. They differ by hue only, so this vanishes in greyscale, on a
      // mono printer, and for a red-weak reader.
      expect(contrast(X.cta500, X.primary500)).toBeLessThan(1.5)
      expect(contrast(X.cta500, X.primary700)).toBeLessThan(AA)
      expect(contrast(X.cta500, X.primary800)).toBe(1.84)
      expect(contrast(X.cta500, X.primary800)).toBeLessThan(AA)
      // Stepping only one stop is not enough either — the trap is thinking it is.
      expect(contrast(X.cta400, X.primary800)).toBeLessThan(AA)
    })

    it('is fixed by stepping to cta-300 / cta-200, the way ExploreLink already does', () => {
      expect(contrast(X.cta300, X.primary800)).toBeGreaterThanOrEqual(AA)
      expect(contrast(X.cta200, X.primary800)).toBe(9.1)
    })

    it('leaves Brick perfectly legible where it actually lives — on white', () => {
      // This is why Brick had to be the CTA ramp: the project renders
      // `cta-500` as BARE TEXT in at least four places.
      expect(contrast(X.cta500, WHITE)).toBeGreaterThanOrEqual(AA)
    })
  })

  describe('the rest of the ramp, so a future edit cannot quietly break it', () => {
    it('has San Juan usable as text only from -500 (stricter than CRE)', () => {
      expect(contrast(X.primary400, WHITE)).toBeLessThan(AA)
      expect(contrast(X.primary500, WHITE)).toBeGreaterThanOrEqual(AA)
    })

    it('clears AA for both body-ink tokens on white', () => {
      expect(contrast(X.textPrimary, WHITE)).toBeGreaterThanOrEqual(AA) // Charcoal
      expect(contrast(X.textSecondary, WHITE)).toBeGreaterThanOrEqual(AA) // Gray
    })

    it('clears AA for the dark-mode accent override (primary-200 on the rail)', () => {
      // `[data-theme='dark'][data-brand='xcel']` bumps accent-text to -200 for
      // the same reason STC does: dark surfaces derive from the primary ramp,
      // so San-Juan-on-San-Juan strands it.
      expect(contrast(X.primary300, X.primary800)).toBeGreaterThanOrEqual(AA)
      expect(contrast(X.primary200, X.primary800)).toBeGreaterThanOrEqual(AA)
      // The light-mode value is exactly what the override exists to avoid.
      expect(contrast(X.primary500, X.primary800)).toBeLessThan(AA)
    })
  })
})
