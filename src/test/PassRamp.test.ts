import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * THE PASS RAMP — the Compass palette's `--c-pass`, #2F7A5A, carried into the
 * React tokens on 2026-11-02 so a completed certificate could take it ("should
 * take on this green color. and shades of it").
 *
 * Two things are worth asserting and neither is a matter of taste:
 *
 *   -500 is the audit's own value. The whole point of bringing it over was that
 *   the design-system audit lists this green as identical across the two
 *   systems. A ramp whose anchor has drifted is a second opinion about the
 *   green, not the green.
 *
 *   The text stops clear AA on the card surface. -500, -600 and -700 are all
 *   used as text or glyph colour by `CertificateCard`; -100 to -400 are fills.
 */
const tokens = readFileSync('src/styles/tokens.css', 'utf8')

function stop(n: number): string {
  const m = new RegExp(`--color-pass-${n}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens)
  if (!m) throw new Error(`--color-pass-${n} is not declared in tokens.css`)
  return m[1].toLowerCase()
}

/** WCAG relative luminance → contrast ratio, the same maths the audit used. */
function luminance(hex: string): number {
  const parts = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = parts.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('the pass ramp', () => {
  it('anchors -500 on the value the design-system audit records', () => {
    expect(stop(500)).toBe('#2f7a5a')
  })

  it('declares the whole ramp', () => {
    for (const n of [100, 200, 300, 400, 500, 600, 700, 800]) {
      expect(stop(n)).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  /* ⚠ THESE THREE ARE USED AS TEXT, so they are the ones that have to clear
     4.5:1 on the white card. The fills below them are not text and are not
     checked — asserting a contrast floor on a badge tint is how a ramp gets
     bent out of shape to satisfy a test. */
  it('keeps every text stop at AA on the card surface', () => {
    for (const n of [500, 600, 700]) {
      expect(contrast(stop(n), '#ffffff')).toBeGreaterThanOrEqual(4.5)
    }
  })

  /* The stop the dark theme lifts a status word to, on the navy card. */
  it('keeps -300 legible on the dark card', () => {
    expect(contrast(stop(300), '#1c2535')).toBeGreaterThanOrEqual(4.5)
  })

  /* The badge glyph sits on the badge's own tint, not on the card. */
  it('keeps the badge glyph legible on the badge fill', () => {
    expect(contrast(stop(600), stop(100))).toBeGreaterThanOrEqual(4.5)
  })

  /* ⚠ NOT THE SUCCESS RAMP. Nectar's functional green (#018937) is right for a
     toast or a form error's counterpart; this is the calmer green the Compass
     surfaces use for mastery. Collapsing the two is the mistake this guards. */
  it('is a different green from the functional success ramp', () => {
    const success = /--color-success-500:\s*(#[0-9a-fA-F]{6})/.exec(tokens)?.[1].toLowerCase()
    expect(success).toBeDefined()
    expect(stop(500)).not.toBe(success)
  })
})
