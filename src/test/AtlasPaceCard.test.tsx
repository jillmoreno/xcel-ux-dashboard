import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * THE STUDY PACE CARD, TWO WAYS (2026-10-16, Jillienne: "lets add a component
 * variant for this section … keep the other one accessible from the
 * dropdown").
 *
 * ⚠ WHAT IS PINNED HERE IS THE CONTRACT, not the pixels: that it is a DESIGN
 * control (which is what puts it in the dropdown), that it has both arms, and
 * that the ring is the default. The cards themselves are exercised in the
 * browser — jsdom has no layout, and a dial is geometry.
 */
describe('the Study pace card variant', () => {
  const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-pace-card')

  it('is a design-bar control, which is what "in the dropdown" means', () => {
    expect(flag).toBeDefined()
    // `surface: 'design'` + `variants` is the sanctioned way onto that bar —
    // the bar itself is never edited to add a control.
    expect(flag?.surface).toBe('design')
    expect(flag?.variants?.length).toBe(2)
  })

  it('defaults to the ring, with the old card still reachable', () => {
    expect(flag?.defaultVariant).toBe('ring')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['ring', 'states'])
    // The old arm says what it is, so nobody has to remember which was first.
    expect(flag?.variants?.find((v) => v.value === 'states')?.label).toMatch(/as it was/i)
  })

  it('is scoped to the version whose bar should carry it', () => {
    expect(flag?.versions).toEqual(['eric-atlas-e2e'])
  })

  /* ⚠ THE TRADE-OFF, WRITTEN DOWN. A design control never reaches Prototypes
     — `promote-to-prototype` lists them separately for exactly that reason —
     so the ring SHIPS (it is the default and defaults render) but will not
     come up as a decision at merge the way the rest of today's work does.
     That is a consequence of asking for a dropdown, not an oversight; this
     case exists so the next person meets it deliberately. */
  it('…and therefore is not a promotion candidate — by construction', () => {
    expect(flag?.surface).toBe('design')
    expect(flag?.description).toMatch(/Ring \(default\)/)
  })
})
