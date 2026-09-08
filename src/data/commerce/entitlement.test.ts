import { describe, it, expect } from 'vitest'
import { resolveCommerceState } from './entitlement'

// Elite has two member tiers: low = Passport Lite, high = Passport.
const ELITE = 'elite' as const

const included = { price: 24 } // no entitlement → included for any member
const passportOnly = { price: 24, entitlement: { includedFromTier: 'high' as const } }
const exclusive = { price: 24, entitlement: { memberExclusive: true } }
const passportOnlyExclusive = {
  price: 24,
  entitlement: { includedFromTier: 'high' as const, memberExclusive: true },
}

describe('resolveCommerceState — Elite (Lite / Passport)', () => {
  it('default product is included for both member tiers', () => {
    expect(resolveCommerceState(ELITE, 'low', included)).toEqual({ kind: 'included' })
    expect(resolveCommerceState(ELITE, 'high', included)).toEqual({ kind: 'included' })
  })

  it('default product is priced for a non-member, unlockable from the lowest tier', () => {
    // A non-member is not a member; the lowest Elite tier (Passport Lite) unlocks it.
    expect(resolveCommerceState(ELITE, 'non-member', included)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: false,
      unlockTierLabel: 'Passport Lite',
      unlockTierTone: 'primary',
    })
  })

  it('Passport-only product is included only at Passport, upsell for a Lite member', () => {
    expect(resolveCommerceState(ELITE, 'high', passportOnly)).toEqual({ kind: 'included' })
    // Lite member below the required tier → priced, flagged as a member, with the
    // unlocking tier named.
    expect(resolveCommerceState(ELITE, 'low', passportOnly)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: true,
      unlockTierLabel: 'Passport',
      unlockTierTone: 'warning',
    })
  })

  it('Passport-only product is priced for a non-member (not yet a member)', () => {
    expect(resolveCommerceState(ELITE, 'non-member', passportOnly)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: false,
      unlockTierLabel: 'Passport',
      unlockTierTone: 'warning',
    })
  })

  it('member-exclusive product is locked for a non-member (no price)', () => {
    const state = resolveCommerceState(ELITE, 'non-member', exclusive)
    expect(state.kind).toBe('locked')
  })

  it('member-exclusive + Passport-only: Lite member still pays (priced, not locked)', () => {
    expect(resolveCommerceState(ELITE, 'low', passportOnlyExclusive)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: true,
      unlockTierLabel: 'Passport',
      unlockTierTone: 'warning',
    })
    expect(resolveCommerceState(ELITE, 'high', passportOnlyExclusive)).toEqual({ kind: 'included' })
  })
})

describe('resolveCommerceState — single-tier brand (STC) behaves like the old binary', () => {
  it('member sees included, non-member sees priced', () => {
    expect(resolveCommerceState('stc', 'high', included)).toEqual({ kind: 'included' })
    expect(resolveCommerceState('stc', 'non-member', included)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: false,
      unlockTierLabel: 'Member',
      unlockTierTone: 'warning',
    })
  })
})
