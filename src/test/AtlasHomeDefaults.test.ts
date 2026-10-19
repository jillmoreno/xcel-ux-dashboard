import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * WHAT THE END-TO-END HOME OPENS ON (2026-10-19, Jillienne: "default this
 * page to 0%, and readiness off, affidavit off, Exam Prompt as Card, study
 * pace card as Ring").
 *
 * ⚠ THESE ARE THE COMMITTED BASELINE, not a preference. The Prototypes row
 * opens `main`'s build with no `?ff=` pin — CLAUDE.md's rule, and
 * `UxDashboard.smoke.test.tsx` enforces it — so whatever these defaults say
 * IS what every stakeholder sees when they click the End-to-End row. A flag
 * flipped by accident changes the product for everyone with nothing failing.
 *
 * ⚠ AND THREE OF THESE ARE DESIGN CONTROLS, which never reach Prototypes as
 * decisions (`promote-to-prototype` lists them separately) — their DEFAULTS
 * still render for everyone. That is exactly why they are pinned here: the
 * promotion flow will not ask about them at merge, so this file is the only
 * place that notices.
 */
const flag = (key: string) => FEATURE_FLAGS.find((f) => f.key === key)

describe('the End-to-End Home’s opening state', () => {
  it('opens at 0% — Not Started', () => {
    expect(flag('atlas-v3-progress')?.defaultVariant).toBe('not-started')
  })

  it('hides the Exam readiness section', () => {
    expect(flag('atlas-readiness-section')?.defaultEnabled).toBe(false)
  })

  it('opens no affidavit over Home', () => {
    expect(flag('atlas-affidavit')?.defaultVariant).toBe('off')
  })

  it('asks for the exam date as the Card', () => {
    expect(flag('atlas-exam-prompt')?.defaultVariant).toBe('card')
  })

  it('draws the Study pace card as the Ring', () => {
    expect(flag('atlas-pace-card')?.defaultVariant).toBe('ring')
  })

  it('…and every one of them is a flag that actually exists', () => {
    // A `defaultVariant` read off `undefined` is `undefined`, which would let
    // a renamed key pass four of the five cases above in silence.
    for (const key of [
      'atlas-v3-progress',
      'atlas-readiness-section',
      'atlas-affidavit',
      'atlas-exam-prompt',
      'atlas-pace-card',
    ]) {
      expect(flag(key), key).toBeDefined()
    }
  })
})
