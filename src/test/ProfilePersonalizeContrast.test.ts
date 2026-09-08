import { describe, expect, it } from 'vitest'

/**
 * WCAG AA contrast for the "Personalize your profile" nudge band, across every
 * brand AND every width the band can render at.
 *
 * WHY THIS FILE EXISTS. The band's background is a gradient and its copy is
 * LEFT-ANCHORED at a fixed offset with a fixed measure, so the narrower the
 * band, the further along the gradient the text's right edge sits. With the
 * original `primary-800 -> primary-600` that meant the 12px sub-line fell below
 * 4.5:1 for McKissock under ~800px and CRE under ~560px — the tablet and mobile
 * device frames. It passed at the desktop width it was reviewed at, which is
 * exactly why it shipped.
 *
 * So contrast here is a function of TWO variables, and a single-width check
 * would have missed it. Every case below is width-swept.
 *
 * A NOTE ON THE FIRST DIAGNOSIS, because it is the trap: the failure was first
 * "found" by measuring white against `primary-600` — the gradient's light stop.
 * That number is meaningless: `primary-600` is where the CTA sits, and the CTA
 * paints its own background, so no text is ever on it. The real question is what
 * is under the TEXT BOX, which needs the geometry. Measuring a token pair
 * instead of a rendered position over-reported the failure at wide widths and
 * under-reported which brands were affected.
 */

/* ── colour maths ───────────────────────────────────────────────────────── */

const rgb = (h: string) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
const hex = (v: number[]) => v.map((n) => n.toString(16).padStart(2, '0')).join('')

const mix = (a: string, b: string, t: number) => {
  const A = rgb(a)
  const B = rgb(b)
  const c = Math.max(0, Math.min(1, t))
  return hex(A.map((v, i) => Math.round(v + (B[i] - v) * c)))
}

const luminance = (h: string) => {
  const [r, g, b] = rgb(h).map((v) => v / 255)
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const contrast = (fg: string, bg: string) => {
  const a = luminance(fg)
  const b = luminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** White at `alpha` composited over `bg` — how the sub-line actually renders. */
const whiteOver = (bg: string, alpha: number) =>
  hex(rgb(bg).map((c) => Math.round(255 * alpha + c * (1 - alpha))))

/**
 * Progress along a `linear-gradient(135deg, …)` at a point in a W×H box, per the
 * CSS spec: the gradient line runs through the centre at the given angle, and
 * its length is |W·sin a| + |H·cos a|.
 */
const gradientT = (x: number, y: number, w: number, h: number) => {
  const a = (135 * Math.PI) / 180
  const s = Math.sin(a)
  const c = Math.cos(a)
  const len = Math.abs(w * s) + Math.abs(h * c)
  return 0.5 + ((x - w / 2) * s - (y - h / 2) * c) / len
}

/* ── the band's real geometry, measured in the browser ──────────────────── */

const BAND_H = 81
const TEXT_LEFT = 79 //  22px padding + 40px avatar plate + 16px gap
const TEXT_MEASURE = 372 // the sub-line's rendered text width
const RIGHT_PADDING = 22
const TITLE_TOP = 22
const TITLE_BOTTOM = 44
const SUB_TOP = 44
const SUB_BOTTOM = 62

/** Widths the band can render at: shell content, stacked column, tablet, mobile. */
const WIDTHS = [1176, 941, 760, 620, 520, 458, 358]

const SUB_ALPHA = 0.75 // rgb(255 255 255 / 0.75)
const AA = 4.5 // 15px/800 and 12px are NOT WCAG large text (needs 18.66 bold / 24)

/**
 * Per brand: the gradient stops the band uses. `primary-900 -> primary-700`
 * since the 2026-09-01 fix. Read from src/styles/tokens.css — if a brand ramp
 * is re-authored, update here and this test tells you whether it still clears.
 */
const BRANDS = {
  cre: { from: '001c19', to: '01554d' },
  mckissock: { from: '1b1f01', to: '526004' },
  elite: { from: '041124', to: '0d346d' },
  stc: { from: '040c38', to: '06114b' },
} as const

/** The lightest background under a text box — its worst corner. */
function worstBackground(brand: keyof typeof BRANDS, width: number, top: number, bottom: number) {
  const { from, to } = BRANDS[brand]
  const right = Math.min(TEXT_LEFT + TEXT_MEASURE, width - RIGHT_PADDING)
  let worst = -1
  let bg: string = from
  for (const [x, y] of [
    [TEXT_LEFT, top],
    [right, top],
    [TEXT_LEFT, bottom],
    [right, bottom],
  ]) {
    const c = mix(from, to, gradientT(x, y, width, BAND_H))
    if (luminance(c) > worst) {
      worst = luminance(c)
      bg = c
    }
  }
  return bg
}

describe('Personalize Profile band — WCAG AA at every brand × width', () => {
  const brands = Object.keys(BRANDS) as (keyof typeof BRANDS)[]

  it('the 12px sub-line clears 4.5:1 everywhere', () => {
    for (const brand of brands) {
      for (const width of WIDTHS) {
        const bg = worstBackground(brand, width, SUB_TOP, SUB_BOTTOM)
        const ratio = contrast(whiteOver(bg, SUB_ALPHA), bg)
        expect(ratio, `${brand} @ ${width}px — sub-line ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
      }
    }
  })

  it('the 15px/800 title clears 4.5:1 everywhere', () => {
    for (const brand of brands) {
      for (const width of WIDTHS) {
        const bg = worstBackground(brand, width, TITLE_TOP, TITLE_BOTTOM)
        const ratio = contrast('ffffff', bg)
        expect(ratio, `${brand} @ ${width}px — title ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA)
      }
    }
  })

  it('the narrowest width is the worst case — so a single-width check is not enough', () => {
    // The property that made the original bug invisible. If this ever inverts,
    // the geometry assumptions above have changed and the sweep needs redoing.
    for (const brand of brands) {
      const widest = contrast(
        whiteOver(worstBackground(brand, WIDTHS[0], SUB_TOP, SUB_BOTTOM), SUB_ALPHA),
        worstBackground(brand, WIDTHS[0], SUB_TOP, SUB_BOTTOM),
      )
      const narrowest = contrast(
        whiteOver(worstBackground(brand, 358, SUB_TOP, SUB_BOTTOM), SUB_ALPHA),
        worstBackground(brand, 358, SUB_TOP, SUB_BOTTOM),
      )
      expect(narrowest, `${brand}: narrow ${narrowest.toFixed(2)} vs wide ${widest.toFixed(2)}`)
        .toBeLessThanOrEqual(widest)
    }
  })

  it('the OLD stops would still fail — so the fix cannot be quietly reverted', () => {
    // primary-800 -> primary-600, the pre-fix background. Kept as a live
    // assertion rather than a comment: it is the only thing that makes the
    // choice of stops legible as a requirement instead of a preference.
    const OLD = {
      cre: { from: '003933', to: '017267' },
      mckissock: { from: '373f02', to: '6e8005' },
    } as const
    const failures: string[] = []
    for (const [brand, stops] of Object.entries(OLD)) {
      for (const width of [760, 520, 358]) {
        const right = Math.min(TEXT_LEFT + TEXT_MEASURE, width - RIGHT_PADDING)
        let worst = -1
        let bg: string = stops.from
        for (const [x, y] of [
          [TEXT_LEFT, SUB_TOP],
          [right, SUB_TOP],
          [TEXT_LEFT, SUB_BOTTOM],
          [right, SUB_BOTTOM],
        ]) {
          const c = mix(stops.from, stops.to, gradientT(x, y, width, BAND_H))
          if (luminance(c) > worst) {
            worst = luminance(c)
            bg = c
          }
        }
        if (contrast(whiteOver(bg, SUB_ALPHA), bg) < AA) failures.push(`${brand}@${width}`)
      }
    }
    // McKissock fails at all three; CRE at the two narrow ones.
    expect(failures).toContain('mckissock@760')
    expect(failures).toContain('cre@358')
    expect(failures.length).toBeGreaterThanOrEqual(4)
  })

  it('raising the sub-line alpha alone would NOT have fixed it', () => {
    // Documents a rejected fix, so it is not re-proposed. At 0.88 alpha on the
    // old stops McKissock still fails below ~520px — the stops had to move.
    const stops = { from: '373f02', to: '6e8005' } // McKissock, old
    const width = 458
    const right = Math.min(TEXT_LEFT + TEXT_MEASURE, width - RIGHT_PADDING)
    let worst = -1
    let bg: string = stops.from
    for (const [x, y] of [
      [TEXT_LEFT, SUB_TOP],
      [right, SUB_TOP],
      [TEXT_LEFT, SUB_BOTTOM],
      [right, SUB_BOTTOM],
    ]) {
      const c = mix(stops.from, stops.to, gradientT(x, y, width, BAND_H))
      if (luminance(c) > worst) {
        worst = luminance(c)
        bg = c
      }
    }
    expect(contrast(whiteOver(bg, 0.88), bg)).toBeLessThan(AA)
  })
})
