import { WhatsNewUpsellBand } from '@/components/membership/WhatsNewUpsellBand'

/**
 * In-flow upgrade banner that lands between shelf 3 (Renew before) and
 * shelf 4 (Featured series) for non-member accounts (emitted by `buildShelves`
 * as the `banner` sentinel row; suppressed for members). Not sticky — an
 * in-flow band reads as part of the page rather than as advertising (redesign
 * doc § 6 "Non-member behaviour").
 *
 * Renders the SAME membership upsell the Home (dashboard) overview shows below
 * the Current Learning Path — the plum `WhatsNewUpsellBand` in its inset `card`
 * variant — so the two surfaces read identically and stay in sync. It's
 * tier-aware (join for non-members, upgrade for Lite members, hidden for full
 * members) and opens the `MembershipUpgradeModal`.
 */
export function UpgradeBanner() {
  return <WhatsNewUpsellBand variant="card" />
}
