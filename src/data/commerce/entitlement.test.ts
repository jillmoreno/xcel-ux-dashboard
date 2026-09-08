import { describe, it, expect } from 'vitest'
import { resolveCommerceState } from './entitlement'

/**
 * This file used to test Elite's two-tier Passport ladder (low = Passport Lite,
 * high = Passport) across the included / priced / locked matrix. Elite went with
 * the other five brands, and XCEL has no consumer membership at all, so that
 * ladder is unreachable here: `resolveCommerceState` short-circuits on
 * `!supportsMembership(brand)` before any tier comparison runs.
 *
 * What is tested instead is that short-circuit, which is the branch this repo
 * actually depends on — and the one with the loudest failure mode. Without it
 * the resolver returns `included` for EVERY product, because `includedFromTier`
 * defaults to the brand's lowest tier and XCEL has exactly one, so the viewer
 * always meets it. Every card in the catalogue would read "Included with your
 * membership" for a brand that sells no membership.
 *
 * The tier-ladder cases are worth restoring alongside a brand that has tiers.
 */
const XCEL = 'xcel' as const

const plain = { price: 24 }
const passportOnly = { price: 24, entitlement: { includedFromTier: 'high' as const } }
const exclusive = { price: 24, entitlement: { memberExclusive: true } }

describe('resolveCommerceState — XCEL (a brand with no membership)', () => {
  it('prices a plain product rather than including it', () => {
    // The regression this guards: one tier ⇒ the viewer always outranks
    // `includedFromTier` ⇒ `included` for everything.
    expect(resolveCommerceState(XCEL, 'high', plain)).toEqual({
      kind: 'priced',
      price: 24,
      isMember: false,
      unlockTierLabel: '',
      unlockTierTone: 'neutral',
    })
  })

  it('ignores includedFromTier — there is no tier to reach', () => {
    expect(resolveCommerceState(XCEL, 'high', passportOnly)).toMatchObject({
      kind: 'priced',
      price: 24,
    })
  })

  it('never returns `locked`: nothing can be exclusive to a membership that does not exist', () => {
    expect(resolveCommerceState(XCEL, 'high', exclusive)).toMatchObject({ kind: 'priced' })
    expect(resolveCommerceState(XCEL, 'non-member', exclusive)).toMatchObject({ kind: 'priced' })
  })

  it('resolves the same whatever tier is passed', () => {
    // Tier is not consulted on this path. Asserted so a future edit that moves
    // the short-circuit BELOW the tier maths fails here rather than silently
    // reintroducing "Included with your membership" on one of the tiers.
    const tiers = ['non-member', 'low', 'mid', 'high'] as const
    const states = tiers.map((t) => resolveCommerceState(XCEL, t, plain))
    for (const s of states) expect(s).toEqual(states[0])
  })

  it('reports isMember false, so the price slot takes the non-upgrade path', () => {
    // `false` means "not upgrading", not "no membership exists" — the slot
    // suppresses the membership pill from `supportsMembership` itself.
    const s = resolveCommerceState(XCEL, 'high', plain)
    expect(s).toMatchObject({ kind: 'priced', isMember: false })
  })
})
