import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'

/**
 * THE THREE-TIER TEXT RAMP — `dashboard-text-tiers`.
 *
 * 2026-09-23, from the question "have these tiers been considered for all of
 * these pages?" They had not: `--ink` / `--ink-2` / `--ink-3` had lived in
 * `public/prototypes/xcel-signin.html` since it was authored and had never
 * reached the React product. The flag exists so the two ramps can be compared
 * rather than so one can replace the other.
 *
 * ASSERTED AT THE STYLESHEET AND THE CATALOG, not through a render. jsdom
 * applies no author stylesheet, so a mounted component would report the inline
 * fallback for every one of these tokens and pass whatever the CSS said — the
 * degrade that matters is a hex drifting off the spec, and only reading the
 * file catches it.
 */
const CSS = readFileSync('src/styles/tokens.css', 'utf8')

/** Relative luminance, then WCAG contrast — so the ladder is CHECKED here
 *  rather than quoted from a comment that can go stale. */
function luminance(hex: string): number {
  const parts = hex.replace('#', '').match(/../g)!.map((h) => {
    const v = parseInt(h, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2]
}
function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const INK = '#1f1d18'
const MUTED = '#5b5560'
const FAINT = '#706b63'
/** The two fills this product actually paints text on. */
const WHITE = '#ffffff'
const GROUND = '#f5f5f5'

describe('dashboard-text-tiers', () => {
  it('is a variant-only flag in the rebrand panel, defaulting to the tiers', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-text-tiers')
    expect(def).toBeTruthy()
    expect(def?.defaultEnabled).toBe(true)
    /* ⚠ `neutral`, FLIPPED 2026-09-23 AFTER THE REVIEW, and the assertion is
       the record of a decision rather than a default nobody chose. It shipped
       as `tiers` under the Contributing guide's rule — the branch deploy is the
       review link — and the review found the two ramps hard to tell apart,
       because the ink is a third of a system whose warm paper we did not take.
       The flag stays so the comparison is one URL away. See the catalog note. */
    expect(def?.defaultVariant).toBe('neutral')
    expect(def?.variants?.map((v) => v.value)).toEqual(['neutral', 'tiers'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-text-tiers')
  })

  it('re-points exactly the three text tokens, and nothing else', () => {
    /* The ramp is a TYPE change, not a palette change. Re-pinning a neutral
       stop instead would move every border, divider and disabled control that
       reads the same ramp — which is the mistake the XCEL brand block's own
       comment describes avoiding ("scoped to the text tokens rather than the
       neutral ramp so only type moves"). */
    const block = CSS.match(/:root\[data-text-tiers='tiers'\][^{]*\{([^}]*)\}/)?.[1]
    expect(block).toBeTruthy()
    const props = [...block!.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]).sort()
    expect(props).toEqual([
      '--color-text-primary',
      '--color-text-secondary',
      '--color-text-tertiary',
    ])
    expect(block).toContain(INK)
    expect(block).toContain(MUTED)
    expect(block).toContain(FAINT)
  })

  it('is guarded off the dark theme, which pins these three itself', () => {
    /* Without the guard the warm ramp would win on specificity over
       `[data-theme='dark']`'s blue-tinted set and drop brown-grey body text
       onto a navy ground — answering a design question nobody asked. */
    expect(CSS).toMatch(/:root\[data-text-tiers='tiers'\]:not\(\[data-theme='dark'\]\)/)
  })

  it('clears AA on BOTH fills, with the ladder descending', () => {
    /* ⚠ THE PROPERTY THE RAMP IT REPLACES DID NOT HAVE. Until 2026-09-23 the
       XCEL brand block re-pinned primary and secondary only, so tertiary kept
       the base #616161 and was DARKER than the body ink beside it. Both passed
       AA, which is exactly why nothing caught it — so this asserts the ORDER,
       not just the floors. */
    for (const fill of [WHITE, GROUND]) {
      const ink = contrast(INK, fill)
      const muted = contrast(MUTED, fill)
      const faint = contrast(FAINT, fill)
      expect(faint).toBeGreaterThanOrEqual(4.5)
      expect(muted).toBeGreaterThan(faint)
      expect(ink).toBeGreaterThan(muted)
      // The top tier carries headings, so it is held to AAA rather than AA.
      expect(ink).toBeGreaterThanOrEqual(7)
    }
  })

  it('keeps the neutral ramp intact for the comparison', () => {
    /* "save the existing still so we can compare" — the ask, verbatim. The
       neutral variant is the ABSENCE of the attribute rather than a second
       declaration of the same values, so what a reviewer switches to is the
       real thing and cannot drift from it. */
    expect(CSS).toContain('--color-text-primary: #3a3a3a')
    expect(CSS).toContain('--color-text-secondary: #666666')
    expect(CSS).toContain('--color-text-tertiary: #737373')
    // No `[data-text-tiers='neutral']` block — that is the point.
    expect(CSS).not.toMatch(/data-text-tiers='neutral'/)
  })

  it('writes the attribute only for `tiers`, and cleans up on unmount', () => {
    /* Read off the page rather than rendered: the effect is three lines and the
       thing worth pinning is that BOTH halves exist. A variant that sets the
       attribute without removing it leaks the ramp onto `/` the moment a
       reviewer navigates back to the gateway — the exact bug the dark-theme
       effect directly above it was written to avoid. */
    const page = readFileSync('src/pages/DashboardRebrandPage.tsx', 'utf8')
    expect(page).toContain("if (textTiers !== 'tiers') return")
    expect(page).toContain('root.dataset.textTiers = textTiers')
    expect(page).toContain('delete root.dataset.textTiers')
  })

  it('still matches the prototype it came from', () => {
    /* The source of record. If the sign-in prototype's ramp moves, this fails
       and someone decides deliberately whether the product follows — rather
       than the two quietly becoming different ramps with one name. */
    const proto = readFileSync('public/prototypes/xcel-signin.html', 'utf8')
    expect(proto).toContain(`--ink:${INK}`)
    expect(proto).toContain(`--ink-2:${MUTED}`)
    expect(proto).toContain(`--ink-3:${FAINT}`)
  })
})
