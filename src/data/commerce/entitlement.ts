// Tier-aware commerce resolver. Turns a product's membership entitlement +
// the viewer's current tier into exactly one display state, so the product
// card and the detail sheet render identically from a single source of truth.
//
// See tier-aware-pricing-PLAN.md for the full matrix + copy decisions.

import {
  memberTiersFor,
  supportsMembership,
  tierLabelFor,
  tierToneFor,
  type Brand,
  type MembershipTier,
  type MembershipTierTone,
} from '@/context/AccountContext'
import type { ProductEntitlement } from '@/data/catalog/types'

/** The three commerce display states. The resolver returns neutral *facts*;
 *  how each state is presented (card vs. detail panel, tier chip copy) is a
 *  decision owned by `ProductPriceSlot`, not baked in here.
 *
 *  - `included` → the viewer's tier already covers it (Enroll, no price).
 *  - `priced`   → must be paid for. `unlockTierLabel` names the tier that would
 *    make it $0; `isMember` says whether the viewer already holds a membership
 *    (so the slot can pick an upsell vs. a teaser).
 *  - `locked`   → member-exclusive product a non-member can't buy à la carte. */
export type CommerceState =
  | { kind: 'included' }
  | {
      kind: 'priced'
      price: number
      isMember: boolean
      unlockTierLabel: string
      unlockTierTone: MembershipTierTone
    }
  | { kind: 'locked'; unlockTierLabel: string }

/** Minimal product shape the resolver needs — any catalog product satisfies it. */
export type EntitledProduct = {
  price: number
  entitlement?: ProductEntitlement
}

/** Rank a tier within a brand: non-member = 0, first (lowest) member tier = 1,
 *  next = 2, … An unknown/clamped tier ranks at the top (treated as full). */
function tierRank(brand: Brand, tier: MembershipTier): number {
  if (tier === 'non-member') return 0
  const tiers = memberTiersFor(brand)
  const idx = tiers.findIndex((t) => t.key === tier)
  return idx === -1 ? tiers.length : idx + 1
}

/**
 * Resolve the commerce state for a product, given the active brand + tier.
 *
 * - Viewer's tier is at/above the product's included tier → `included` (Enroll).
 * - Otherwise it's paid. A non-member hitting a member-exclusive product → `locked`
 *   (no à-la-carte price). Everything else is `priced`, carrying the tier that
 *   unlocks it + whether the viewer is already a member (the slot uses those to
 *   phrase the badge).
 */
export function resolveCommerceState(
  brand: Brand,
  tier: MembershipTier,
  product: EntitledProduct,
): CommerceState {
  // A brand with NO consumer membership prices everything. Without this it
  // resolves to `included` for EVERY product: `includedFromTier` defaults to
  // the brand's lowest tier, and such a brand has exactly ONE tier — so the
  // viewer always meets it, and every card in an insurance catalogue reads
  // "Included with your membership". `memberExclusive` cannot apply either:
  // there is no membership for a product to be exclusive to.
  if (!supportsMembership(brand)) {
    return {
      kind: 'priced',
      price: product.price,
      // `false` picks the non-upgrade path in the price slot. It means "not
      // upgrading", NOT "no membership exists" — the slot suppresses the
      // membership pill itself, from the same predicate.
      isMember: false,
      unlockTierLabel: '',
      unlockTierTone: 'neutral',
    }
  }
  const tiers = memberTiersFor(brand)
  // Omitted includedFromTier → the brand's LOWEST member tier (included for any
  // member — preserves pre-tier behavior).
  const includedFrom = product.entitlement?.includedFromTier ?? tiers[0].key
  const includedRank = tierRank(brand, includedFrom)
  const viewerRank = tierRank(brand, tier)
  const isMember = tier !== 'non-member'
  const exclusive = product.entitlement?.memberExclusive ?? false
  const unlockTierLabel = tierLabelFor(brand, includedFrom) ?? 'membership'
  const unlockTierTone = tierToneFor(brand, includedFrom)

  if (viewerRank >= includedRank) return { kind: 'included' }

  if (!isMember && exclusive) {
    return { kind: 'locked', unlockTierLabel }
  }

  return { kind: 'priced', price: product.price, isMember, unlockTierLabel, unlockTierTone }
}
