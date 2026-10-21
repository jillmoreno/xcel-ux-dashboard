import { describe, it, expect } from 'vitest'
import { accessCountLabel, ATLAS_WEEKS_FROM_DAYS } from '@/components/compass/atlasCourseAccess'

/**
 * THE ACCESS COUNT SWITCHES UNIT AT SIXTY DAYS.
 *
 * 2026-10-21, Jillienne: "anything that is more than 60 days will change to
 * weeks & days". A three-figure day count stops being a quantity anyone can
 * feel — "399 days to complete" reads as "a lot", which is what "57 weeks"
 * says in a form a learner can picture against a calendar.
 *
 * Pinned because every value here is a boundary someone could plausibly "tidy"
 * in the wrong direction: the threshold is inclusive, the remainder disappears
 * when weeks divide evenly, and both units singularise at one.
 */
describe('accessCountLabel', () => {
  it('counts in days up to and including the threshold', () => {
    expect(accessCountLabel(1)).toBe('1 day')
    expect(accessCountLabel(2)).toBe('2 days')
    expect(accessCountLabel(30)).toBe('30 days')
    // Inclusive: 60 is not "more than 60".
    expect(accessCountLabel(ATLAS_WEEKS_FROM_DAYS)).toBe('60 days')
  })

  it('counts in weeks past it', () => {
    expect(accessCountLabel(61)).toBe('8 weeks, 5 days')
    expect(accessCountLabel(90)).toBe('12 weeks, 6 days')
    expect(accessCountLabel(120)).toBe('17 weeks, 1 day')
  })

  it('drops a zero remainder rather than printing "0 days"', () => {
    expect(accessCountLabel(399)).toBe('57 weeks')
    expect(accessCountLabel(63)).toBe('9 weeks')
  })
})
