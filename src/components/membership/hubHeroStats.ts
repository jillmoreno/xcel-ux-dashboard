import type { Brand } from '@/context/AccountContext'
import {
  accountMemberSinceLabelFor,
  accountTenureDaysFor,
} from '@/data/membership/membershipScorecardFixtures'

/**
 * The Membership hub hero's "Lifetime Member Details" figures.
 *
 * Lives in its own module rather than in
 * [MembershipStandalonePage](./MembershipStandalonePage.tsx) because it is
 * imported by `MembershipRollupAlignment.test.ts`, and a component file that
 * also exports constants breaks fast refresh
 * (`react-refresh/only-export-components`) — the same split as
 * `v4/shared.tsx` vs `v4/sharedUtil.ts`.
 *
 * TODO(data): savings / credits / certificates / hours are still hardcoded —
 * they do not move with brand, tier or learner. The engagement / billing
 * services own the real values.
 *
 * THESE ARE LOAD-BEARING, not decoration. They are asserted against the
 * membership roll-up (`rollupScorecardFor` over the first three
 * `MEMBERSHIP_VALUES` rows) and against `dashboardStatsFor('elite')`. Change a
 * number here without re-curating those fixtures and
 * `MembershipRollupAlignment.test.ts` fails — deliberately, because the two
 * silently disagreed for a day when a fixture row was deleted.
 */

/** Total saved, pre-formatted without the currency symbol. */
export const HUB_SAVINGS = '1,180'

/**
 * Tenure and the join date are DERIVED, not authored.
 *
 * They were both hardcoded ("425", "since Apr 23, 2025") and the day count went
 * stale the moment it was written: 425 was a correct snapshot of
 * `daysSinceIso('2025-04-23')` and drifted a day every day after, reading 496
 * by 2026-09-01 while the roll-up beside it summed per-membership tenure to
 * 2,025. A span measured to "today" cannot be a constant — that is the whole
 * bug, and deriving it is the only fix that stays fixed.
 *
 * Both come from the SAME account-level `memberSince` the roll-up's earliest
 * membership uses, so the hero and the scorecard cannot disagree at any count.
 */
export function hubSavingsSinceFor(brand: Brand): string {
  const label = accountMemberSinceLabelFor(brand)
  // No join date ⇒ drop the clause rather than print "since undefined". The
  // sentence reads correctly without it.
  return label ? `across all your memberships since ${label}` : 'across all your memberships'
}

export type HubStat = { n: string; k: string; s: string }

/**
 * The four-stat row under the savings bar.
 *
 * `Days` is derived per brand; the other three are the curated constants that
 * the roll-up's first three rows are authored to sum to.
 */
export function hubStatsFor(brand: Brand): HubStat[] {
  return [
    { n: accountTenureDaysFor(brand).toLocaleString(), k: 'Days', s: 'with a membership' },
    { n: '38', k: 'Credit hours', s: 'total completed' },
    { n: '15', k: 'Certificates', s: 'total earned' },
    { n: '459', k: 'Hours', s: 'spent learning' },
  ]
}

/**
 * The five-cell scorecard variant of the same figures (the `base` hub-hero arm).
 * Shares one source with `hubStatsFor` so the two hero arms cannot print
 * different numbers — they did: this one carried its own "425 days" copy.
 */
export function hubScorecardFor(brand: Brand): { k: string; v: string; s: string }[] {
  const since = accountMemberSinceLabelFor(brand)
  return [
    {
      k: 'Member for',
      v: `${accountTenureDaysFor(brand).toLocaleString()} days`,
      s: since ? `Since ${since}` : 'Since you joined',
    },
    { k: 'You Saved', v: `$${HUB_SAVINGS}`, s: 'with your membership' },
    { k: 'Credits', v: '38', s: 'total completed' },
    { k: 'Certificates', v: '15', s: 'lifetime earned' },
    { k: 'Time Spent', v: '459', s: 'hours of learning' },
  ]
}
