import { describe, it, expect } from 'vitest'
import { membershipChangePlanFor } from '@/data/membership/membershipUpgradeFixtures'
import { memberTiersFor } from '@/context/AccountContext'

/**
 * The "Change plan" ladder behind the Manage Membership sheet's row.
 *
 * This is NEW logic with the business rules still open (see the `TODO(product)`
 * on `membershipChangePlanFor`), so these tests pin the two things the UI
 * promises today and nothing beyond them: which plan reads as current, and
 * which direction each other plan is offered in. They are deliberately about
 * RANKING, not copy — the copy is expected to change once the rules land.
 */
describe('membershipChangePlanFor', () => {
  it('lists every tier the brand sells, not the 2-card upgrade ladder', () => {
    // Real estate sells three. The MEMBER comparison lists only Plus + Premier
    // (it is the Lite→full upgrade offer), so a Pro member opening that one
    // would not find their own membership in it.
    const { plans } = membershipChangePlanFor('cre', 'mid')
    expect(plans.map((p) => p.tier)).toEqual(['low', 'mid', 'high'])
  })

  it('low tier: marks their plan current and recommends the step up', () => {
    const { plans } = membershipChangePlanFor('cre', 'low')
    const current = plans.filter((p) => p.current)
    const recommended = plans.filter((p) => p.recommended)
    expect(current.map((p) => p.tier)).toEqual(['low'])
    expect(current[0].ctaLabel).toBe('Current Membership')
    // Exactly one recommendation, and it is the IMMEDIATE next tier.
    expect(recommended.map((p) => p.tier)).toEqual(['mid'])
    // Nothing below them, so nothing is a downgrade.
    expect(plans.some((p) => p.downgrade)).toBe(false)
  })

  it('high tier: shows the lower tiers, and recommends nothing', () => {
    const { plans } = membershipChangePlanFor('cre', 'high')
    expect(plans.filter((p) => p.current).map((p) => p.tier)).toEqual(['high'])
    // A top-tier member has no step up. Badging a cheaper plan "Recommended"
    // would be the store arguing against itself.
    expect(plans.some((p) => p.recommended)).toBe(false)
    expect(plans.filter((p) => p.downgrade).map((p) => p.tier)).toEqual(['low', 'mid'])
  })

  it('a downgrade is offered without being sold', () => {
    const lower = membershipChangePlanFor('cre', 'high').plans.filter((p) => p.downgrade)
    expect(lower.length).toBeGreaterThan(0)
    for (const p of lower) {
      // Never the cart verb — a downgrade is not a purchase, and the rules for
      // what it costs are not decided yet.
      expect(p.ctaLabel).not.toMatch(/cart/i)
      expect(p.recommended).toBe(false)
    }
  })

  it('mid tier sees one of each — a downgrade, itself, and one upgrade', () => {
    const { plans } = membershipChangePlanFor('cre', 'mid')
    expect(plans.filter((p) => p.downgrade).map((p) => p.tier)).toEqual(['low'])
    expect(plans.filter((p) => p.current).map((p) => p.tier)).toEqual(['mid'])
    expect(plans.filter((p) => p.recommended).map((p) => p.tier)).toEqual(['high'])
  })

  it('two-tier brands rank the same way', () => {
    const lite = membershipChangePlanFor('elite', 'low')
    expect(lite.plans.filter((p) => p.current).map((p) => p.tier)).toEqual(['low'])
    expect(lite.plans.filter((p) => p.recommended).map((p) => p.tier)).toEqual(['high'])

    const full = membershipChangePlanFor('elite', 'high')
    expect(full.plans.filter((p) => p.current).map((p) => p.tier)).toEqual(['high'])
    expect(full.plans.some((p) => p.recommended)).toBe(false)
    expect(full.plans.filter((p) => p.downgrade).map((p) => p.tier)).toEqual(['low'])
  })

  it('exactly one plan reads as current, for every tier a brand actually sells', () => {
    // The regression this guards: the sheet resolves the tier by matching the
    // record's `tierLabel` against the brand's tier table. Match the wrong
    // field and NO plan is current — which silently offers a learner the
    // membership they already hold.
    for (const brand of ['cre', 'mckissock', 'elite', 'stc'] as const) {
      for (const { key } of memberTiersFor(brand)) {
        const { plans } = membershipChangePlanFor(brand, key)
        const current = plans.filter((p) => p.current)
        expect(current, `${brand} @ ${key}`).toHaveLength(1)
        expect(current[0].tier, `${brand} @ ${key}`).toBe(key)
      }
    }
  })

  it('never recommends more than one plan', () => {
    for (const brand of ['cre', 'mckissock', 'elite', 'stc'] as const) {
      for (const { key } of memberTiersFor(brand)) {
        const { plans } = membershipChangePlanFor(brand, key)
        expect(plans.filter((p) => p.recommended).length, `${brand} @ ${key}`).toBeLessThanOrEqual(1)
      }
    }
  })
})
