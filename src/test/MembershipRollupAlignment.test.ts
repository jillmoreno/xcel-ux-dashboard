import { describe, expect, it } from 'vitest'
import {
  multiMembershipRowsFor,
  resolveMembershipCount,
  rollupScorecardFor,
} from '@/data/membership/membershipScorecardFixtures'
import { dashboardStatsFor } from '@/data/learnerOverviewFixtures'
import { HUB_SAVINGS, hubStatsFor } from '@/components/membership/hubHeroStats'
import { accountTenureDaysFor } from '@/data/membership/membershipScorecardFixtures'

/**
 * The Elite membership roll-up must agree with the two places the SAME learner's
 * lifetime numbers are printed as constants:
 *
 *   1. the hub hero — `HUB_SAVINGS` + `HUB_STATS` in hubHeroStats.ts
 *   2. the dashboard KPI band / hero — `dashboardStatsFor('elite')`
 *
 * WHY THIS FILE EXISTS. The agreement was maintained by hand-curating the first
 * three `MEMBERSHIP_VALUES` rows to sum to exactly those figures, with only a
 * comment recording the intent. On 2026-08-31 `elite-ot-ga` was deleted (it
 * duplicated Texas's renewal state) which silently promoted New York into the
 * three-row slice and took the total to $1,452 / 45 credits, while the comment
 * still claimed $1,180 / 38. Nothing failed: the roll-up's only consumer
 * (`MembershipMultiSections`) is archived, so the wrong number was not even on
 * screen — it was waiting for that component to be un-archived.
 *
 * So the invariant is asserted rather than commented. Deleting, reordering or
 * re-pricing a row now fails HERE, next to the reason.
 *
 * SCOPE — the alignment holds at THREE memberships only. The hero is a fixed
 * constant and the roll-up varies with the visible count, so they can agree at
 * exactly one count; `membership-count`'s default variant is `three`, so that is
 * the one chosen. A lower or higher count totalling less or more is correct, not
 * a bug — the tests below pin that too, so "the hero tracks the count" can't be
 * assumed by a future reader.
 */

/** The count the hero's constants are curated against. */
const ALIGNED_COUNT = 3

const usdToNumber = (v: string | undefined) => Number((v ?? '').replace(/[^0-9.]/g, ''))
const statValue = (label: string) =>
  Number((hubStatsFor('elite').find((s) => s.k === label)?.n ?? '').replace(/[^0-9.]/g, ''))

describe('Elite membership roll-up ↔ hub hero / dashboard alignment', () => {
  const rollupAt = (count: number) => {
    const rows = multiMembershipRowsFor('elite', count)
    const scorecard = rollupScorecardFor(rows)
    if (!scorecard) throw new Error(`no roll-up at count ${count}`)
    return scorecard
  }
  const metric = (count: number, key: string) =>
    Number(rollupAt(count).metrics.find((m) => m.key === key)?.value.replace(/[^0-9.]/g, ''))

  it('savings match the hub hero at the aligned count', () => {
    // The mismatch this file was written for: $1,180 (hero) vs $1,452 (roll-up).
    expect(usdToNumber(rollupAt(ALIGNED_COUNT).savingsAmount)).toBe(usdToNumber(HUB_SAVINGS))
  })

  it('savings match the dashboard fixture at the aligned count', () => {
    expect(usdToNumber(rollupAt(ALIGNED_COUNT).savingsAmount)).toBe(
      dashboardStatsFor('elite').savedAmount,
    )
  })

  it('credits, certificates and hours match the hub hero stat row', () => {
    expect(metric(ALIGNED_COUNT, 'credits')).toBe(statValue('Credit hours'))
    expect(metric(ALIGNED_COUNT, 'certificates')).toBe(statValue('Certificates'))
    expect(metric(ALIGNED_COUNT, 'hours')).toBe(statValue('Hours'))
  })

  it('the curated sums are the documented figures, not just self-consistent', () => {
    // Pinned literally so a change to BOTH sides at once (which would keep the
    // assertions above passing) still has to be deliberate.
    const s = rollupAt(ALIGNED_COUNT)
    expect(usdToNumber(s.savingsAmount)).toBe(1180)
    expect(usdToNumber(s.paidAmount)).toBe(196)
    expect(metric(ALIGNED_COUNT, 'credits')).toBe(38)
    expect(metric(ALIGNED_COUNT, 'certificates')).toBe(15)
    expect(metric(ALIGNED_COUNT, 'hours')).toBe(459)
  })

  it('the Days stat matches the roll-up tenure, at every count', () => {
    // The second mismatch this file covers: the hero read a hardcoded "425"
    // while the roll-up SUMMED per-membership tenure to 2,025.
    //
    // Asserted RELATIONALLY and never against a literal: tenure is measured to
    // today, so any pinned number would pass on the day it was written and fail
    // the next — which is exactly how "425" got there. If this ever tempts you
    // to hardcode the expected value, that is the bug reproducing itself.
    for (const count of [1, 2, ALIGNED_COUNT, 6]) {
      expect(metric(count, 'tenure')).toBe(statValue('Days'))
    }
  })

  it('roll-up tenure is a SPAN, not a sum of the memberships', () => {
    // Savings are additive, so they grow with the count. Tenure is not: the
    // memberships run concurrently, so adding a newer one cannot make the
    // learner have been a member for longer.
    const one = metric(1, 'tenure')
    expect(metric(2, 'tenure')).toBe(one)
    expect(metric(6, 'tenure')).toBe(one)
    // …and it is the account's own tenure, not a per-membership figure.
    expect(one).toBe(accountTenureDaysFor('elite'))
    // Guards the specific regression: the sum of all six would be far larger.
    const rows = multiMembershipRowsFor('elite', 6)
    const summed = rows.reduce((t, r) => t + r.tenureDays, 0)
    expect(summed).toBeGreaterThan(one)
    expect(metric(6, 'tenure')).not.toBe(summed)
  })

  it('no membership predates the account — the earliest IS the join date', () => {
    // What makes the hero and the roll-up agree by construction. A membership
    // older than the account would break the equality above AND be nonsense.
    const rows = multiMembershipRowsFor('elite', 6)
    const longest = Math.max(...rows.map((r) => r.tenureDays))
    expect(longest).toBe(accountTenureDaysFor('elite'))
    for (const r of rows) expect(r.tenureDays).toBeLessThanOrEqual(longest)
  })

  it('other counts legitimately differ — the hero does NOT track the count', () => {
    // SAVINGS only — tenure is deliberately equal at every count (above).
    // Documents the limit of the invariant so nobody "fixes" these to match.
    expect(usdToNumber(rollupAt(1).savingsAmount)).toBe(720)
    expect(usdToNumber(rollupAt(2).savingsAmount)).toBe(912)
    expect(usdToNumber(rollupAt(6).savingsAmount)).toBe(1840)
  })

  it('the aligned count is the flag default, so the demo lands on it when enabled', () => {
    // If `membership-count`'s default variant ever moves off `three`, the count
    // the hero agrees with is no longer the one a reviewer sees.
    expect(resolveMembershipCount(true, 'three')).toBe(ALIGNED_COUNT)
  })
})
