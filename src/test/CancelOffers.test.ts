import { describe, expect, it } from 'vitest'
import {
  CANCEL_REASONS,
  discountedPrice,
  pauseRenewalOn,
  pauseResumeOn,
  pauseTermsFor } from '@/data/membership/cancelOffersFixtures'
import type { } from '@/context/AccountContext'

/**
 * Guards for the cancellation flow's offer set.
 *
 * The reason this file exists: the first wiring of the plan-fixture fallback
 * parsed `membershipPlanFor(...).renewsOn`, which is display-formatted
 * ("Nov 3, 2026"). The mm/dd/yyyy regex never matched, so the helper returned
 * `null`, so `cancelOffersFor` returned `[]`, so the flow silently opened past
 * the offers step with NO retention alternatives at all — and nothing threw.
 * A failed parse that degrades to "show the learner nothing" is precisely the
 * failure a type checker can't see, so it gets a test.
 */

describe('pause — term extension, not a billing holiday', () => {
  it('moves the renewal out by the pause length', () => {
    // The whole model: access pauses and the paid-through date moves by the same
    // months, so no money moves. Derived from endsOn, never authored beside it.
    expect(pauseRenewalOn(1, '2026-11-03')).toBe('2026-12-03')
    expect(pauseRenewalOn(2, '2026-11-03')).toBe('2027-01-03')
    expect(pauseRenewalOn(3, '2026-11-03')).toBe('2027-02-03')
  })

  it('resumes access at today + N months', () => {
    expect(pauseResumeOn(2, new Date(2026, 7, 25))).toBe('2026-10-25')
  })

  it('resolves both real dates into the terms before the learner commits', () => {
    const terms = pauseTermsFor(2, '2026-11-03', 99, new Date(2026, 7, 25))
    expect(terms).toContain('October 25, 2026') // access resumes
    expect(terms).toContain('January 3, 2027') // new renewal date
    expect(terms).toContain('$99.00')
    // It must NOT claim billing resumes at the end of the pause — that event
    // does not exist on a prepaid annual term, and saying so was the original
    // copy bug.
    expect(terms.toLowerCase()).not.toContain('billing restarts')
    expect(terms.toLowerCase()).not.toContain('billing resumes')
  })
})

describe('discount arithmetic', () => {
  it('is exactly 30% off, to the cent', () => {
    // 99.99 * 0.7 = 69.993 — must render 69.99, not 69.993.
    expect(discountedPrice(99.99)).toBe(69.99)
    expect(discountedPrice(99)).toBe(69.3)
    expect(discountedPrice(48)).toBe(33.6)
  })
})

describe('reason list', () => {
  it('offers between four and six choices', () => {
    // The guidance says 4–6. More becomes a survey; fewer stops covering the
    // real reasons.
    expect(CANCEL_REASONS.length).toBeGreaterThanOrEqual(4)
    expect(CANCEL_REASONS.length).toBeLessThanOrEqual(6)
  })

  it('ends with an escape hatch', () => {
    expect(CANCEL_REASONS[CANCEL_REASONS.length - 1]).toMatch(/something else/i)
  })
})
