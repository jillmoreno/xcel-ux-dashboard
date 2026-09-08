import type { Brand, MembershipRecord } from '@/context/AccountContext'
import { multiMembershipsFor } from '@/context/AccountContext'
import { dashboardStatsFor } from '@/data/learnerOverviewFixtures'

/**
 * Fixtures for the Explore Membership "Current Membership" + "Membership
 * Scorecard" sections (Concept C — the passport card + light scorecard).
 *
 * Every field the design leans on that does NOT exist in the platform today is
 * **optional**, and each consumer degrades gracefully when it's absent:
 *
 *   - `autoRenew` absent  → the card drops the auto-renew chip and the renewal
 *                           note reads "Renews on {date}" instead of
 *                           "Renews automatically in N days".
 *   - `renewsOn` absent   → the card drops the renewal row + the note entirely
 *                           (STC, whose demo user has no `planExpiresOn`).
 *   - `savings` absent    → the scorecard drops the whole value banner and
 *                           renders as a plain metric-tile grid (STC, the
 *                           new-user fixture with $0 saved).
 *   - `paidAmount` absent → the value banner keeps the savings figure but drops
 *                           the payback meter (no denominator to divide by).
 *   - `payback` absent    → the meter renders without its caption line.
 *
 * TODO(data): `autoRenew`, `paidAmount`, and `payback` are NOT in any platform
 * fixture or API today — they're authored here so the design can be reviewed
 * against real chrome. Confirm with billing before treating them as available;
 * the degrade paths above are what ships if they aren't.
 */

export type MembershipPlanDetail = {
  /** Plan name shown as the card's headline, e.g. "Passport Lite". Falls back
   *  to the account's `tierLabel` when the brand has no authored plan. */
  planName: string
  /** Secondary line under the plan name, e.g. "Nursing · 1-year membership". */
  planLine: string
  /** Formatted join date, e.g. "Apr 23, 2025". */
  memberSince?: string
  /** Formatted renewal date, e.g. "Nov 3, 2026". */
  renewsOn?: string
  /** Whole days until `renewsOn`. Computed, not authored. */
  daysRemaining?: number
  /** TODO(data): not in any fixture today. `undefined` ⇒ unknown, not `false`. */
  autoRenew?: boolean
  /** Renewal price line, e.g. "$48 / year". */
  priceLabel?: string
}

export type ScorecardMetricKey = 'credits' | 'certificates' | 'hours' | 'tenure'

export type ScorecardMetric = {
  key: ScorecardMetricKey
  label: string
  value: string
  sub: string
}

export type MembershipScorecard = {
  /** Lifetime member savings, e.g. "$1,180". Absent ⇒ no value banner. */
  savingsAmount?: string
  /** What the learner paid, e.g. "$48". Absent ⇒ no payback meter. */
  paidAmount?: string
  /** Savings ÷ paid, e.g. 24. Absent ⇒ no multiple chip. */
  multiple?: number
  /** TODO(data): the date savings first exceeded what was paid. */
  paybackDate?: string
  /** Days from join to `paybackDate`. */
  paybackDays?: number
  metrics: ScorecardMetric[]
}

/** Per-brand plan record. `null` ⇒ fall back to the account tier label alone. */
type PlanFixture = {
  planLine: string
  /** mm/dd/yyyy — mirrors `DemoUser.planExpiresOn`. Absent ⇒ no renewal data. */
  renewsOn?: string
  /** ISO join date. */
  memberSince?: string
  autoRenew?: boolean
  priceLabel?: string
}

const PLAN_BY_BRAND: Record<Brand, PlanFixture> = {
  // XCEL has no membership: no plan line, no renewal, no price. `planLine` is
  // required by the type, so it names the brand rather than inventing a plan —
  // and every surface that would render it is suppressed anyway.
  xcel: { planLine: 'Insurance Training' },
}

/** Lifetime savings + what was paid, per brand. `savings` absent ⇒ the
 *  scorecard renders without its value banner. */
const VALUE_BY_BRAND: Record<Brand, { savings?: string; paid?: string; paybackDate?: string; paybackDays?: number }> = {
  // XCEL: no membership ⇒ no membership savings to total.
  xcel: {},
}

/** Hours of learning per brand. TODO(data): hardcoded 459 today in the KPI band. */
const HOURS_BY_BRAND: Record<Brand, number> = {
  xcel: 0,
}

/** Whole days between an ISO date and today (clamped at 0). */
function daysSinceIso(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(diff / 86_400_000))
}

/** Whole days between today and a mm/dd/yyyy date (clamped at 0). Mirrors
 *  `daysUntil` in accountProfileFixtures so both surfaces agree. */
function daysUntil(mmddyyyy: string): number {
  const [m, d, y] = mmddyyyy.split('/').map((s) => parseInt(s, 10))
  if (!m || !d || !y) return 0
  // Date-only math on BOTH sides, matching `daysUntil` in
  // membershipRenewalState.ts. This used to subtract `Date.now()` — an instant
  // carrying the current time-of-day — from local midnight of the target and
  // floor the result, which truncates the partial day and reads one low at any
  // time after midnight. Every Elite fixture was off by exactly one, so the
  // hero card said "44 days left" beside a panel row and sheet saying 45.
  //
  // Keep the `Math.max(0, …)` clamp: this feeds `urgencyOf` and a "N days left"
  // chip, where a negative count would render as text. The state machine has no
  // clamp because it needs the negative to detect a passed date.
  const today = new Date()
  const target = Date.UTC(y, m - 1, d)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.max(0, Math.round((target - now) / 86_400_000))
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "11/03/2026" → "Nov 3, 2026". */
function fmtSlash(mmddyyyy: string): string {
  const [m, d, y] = mmddyyyy.split('/').map((s) => parseInt(s, 10))
  if (!m || !d || !y) return mmddyyyy
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** "2025-04-23" → "Apr 23, 2025". */
function fmtIso(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  if (!m || !d || !y) return iso
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/**
 * Resolve the Current Membership card's plan detail. `tierLabel` comes from the
 * account (`useAccount().tierLabel`) so the card reads the learner's real tier
 * on every brand — the fixture only supplies the surrounding plan facts.
 */
/**
 * The brand's plan renewal facts, UNFORMATTED.
 *
 * `membershipPlanFor` is a view model — it runs `renewsOn` through `fmtSlash`,
 * so what it returns is "Nov 3, 2026", a string for a human to read. Anything
 * that needs to compute with the date (the cancellation flow, which derives
 * pause and renewal dates from it) has to read the raw value instead. Handing a
 * presentation string to a parser is exactly the trap this exists to close: the
 * first attempt did that, the mm/dd/yyyy regex silently never matched, and the
 * whole retention-offer set vanished with no error anywhere.
 */
export function planRenewalFactsFor(brand: Brand): {
  renewsOn?: string
  priceLabel?: string
  autoRenew?: boolean
} {
  const fx = PLAN_BY_BRAND[brand]
  return { renewsOn: fx.renewsOn, priceLabel: fx.priceLabel, autoRenew: fx.autoRenew }
}

/**
 * The learner's card on file, as a display string ("Visa •••• 1111").
 *
 * Takes no argument on purpose: a card is ACCOUNT-scoped, not brand-scoped, so
 * a `brand` parameter would imply a per-brand answer that will never exist.
 *
 * `TODO(data)`: a stub until the subscription / billing service supplies the
 * real one. Returns `string | null` on purpose — a learner CAN have no card on
 * file, and the surfaces that render it must degrade rather than print a
 * half-sentence. When it is null the renewal state's own `chargeNote` ("We'll
 * charge $N to your card on file…") carries the auto-renewal disclosure
 * instead, so that disclosure is never lost.
 */
export function paymentMethodOnFile(): string | null {
  return 'Visa •••• 1111'
}

export function membershipPlanFor(brand: Brand, tierLabel: string | null): MembershipPlanDetail {
  const fx = PLAN_BY_BRAND[brand]
  return {
    planName: tierLabel ?? 'Member',
    planLine: fx.planLine,
    memberSince: fx.memberSince ? fmtIso(fx.memberSince) : undefined,
    renewsOn: fx.renewsOn ? fmtSlash(fx.renewsOn) : undefined,
    daysRemaining: fx.renewsOn ? daysUntil(fx.renewsOn) : undefined,
    autoRenew: fx.autoRenew,
    priceLabel: fx.priceLabel,
  }
}

/**
 * Resolve the Membership Scorecard. Counting metrics come from the shared
 * `dashboardStatsFor` selector so they never drift from the rest of the
 * dashboard; the value block is brand-authored and fully optional.
 */
export function membershipScorecardFor(brand: Brand): MembershipScorecard {
  const stats = dashboardStatsFor(brand)
  const value = VALUE_BY_BRAND[brand]
  const plan = PLAN_BY_BRAND[brand]
  const tenureDays = plan.memberSince ? daysSinceIso(plan.memberSince) : 0

  const savingsNum = value.savings ? parseFloat(value.savings.replace(/[^0-9.]/g, '')) : 0
  const paidNum = value.paid ? parseFloat(value.paid.replace(/[^0-9.]/g, '')) : 0
  // Floor, not round — "24× your membership back" must never claim more value
  // than was actually returned. $1,180 / $48 = 24.58 ⇒ 24×, not 25×.
  const multiple = savingsNum > 0 && paidNum > 0 ? Math.floor(savingsNum / paidNum) : undefined

  const metrics: ScorecardMetric[] = [
    {
      key: 'credits',
      label: 'Credits',
      value: `${stats.creditsEarned}`,
      sub: 'total completed',
    },
    {
      key: 'certificates',
      label: 'Certificates',
      value: `${stats.certificatesCount}`,
      sub: 'lifetime earned',
    },
    {
      key: 'hours',
      label: 'Time spent',
      value: `${HOURS_BY_BRAND[brand]}`,
      sub: 'hours of learning',
    },
    {
      key: 'tenure',
      label: 'Member for',
      value: tenureDays > 0 ? tenureDays.toLocaleString() : '—',
      sub: 'days',
    },
  ]

  return {
    savingsAmount: value.savings,
    paidAmount: value.paid,
    multiple,
    paybackDate: value.paybackDate,
    paybackDays: value.paybackDays,
    metrics,
  }
}

/* ══════════════════════════════════════════════════════════════════════
   Multiple memberships — the roll-up concept.

   A learner can hold several memberships at once (Elite's demo learner holds
   six, one per renewal state: Nursing/Florida, Physical Therapy/Texas,
   Nursing/New York, Nursing/California, Nursing/Illinois, Occupational
   Therapy/Arizona). The row cards render one per membership; the scorecard
   aggregates. `rollupScorecardFor` takes whatever subset is currently VISIBLE,
   so the same function serves both "lifetime across everything" and "recompute
   to match the filter" — the two behaviors under review.

   TODO(data): per-membership savings / paid / credits do not exist in any
   platform fixture. `MembershipRecord` (AccountContext) is left untouched —
   the per-membership value data is joined here by id so the shared type stays
   stable.
   ══════════════════════════════════════════════════════════════════════ */

/** Per-membership value + renewal facts, joined onto `MembershipRecord` by id. */
type MembershipValueFixture = {
  /** Lifetime savings attributed to this membership, in whole dollars. */
  savings: number
  /** What this membership costs per term, in whole dollars. */
  paid: number
  /** Credits earned under this membership. */
  credits: number
  /** Certificates earned under this membership. */
  certificates: number
  /** Hours of learning under this membership. */
  hours: number
  /**
   * ISO date this membership began. Tenure is DERIVED from it, never authored
   * as a day count.
   *
   * It WAS an authored `tenureDays: number`, and that is how the hub hero's
   * "425 Days" went stale: 425 was a correct snapshot of
   * `daysSinceIso(memberSince)` when it was written and drifted a day every day
   * after (496 by 2026-09-01). A span measured to "today" cannot be a constant.
   *
   * The earliest of these across a brand's memberships must equal that brand's
   * account-level `memberSince` — a membership cannot predate the account. For
   * Elite the primary (Florida) IS the join date, which is what makes the hero
   * and the roll-up agree at every count.
   */
  since: string
  /** TODO(data): undefined ⇒ unknown, not false (drives the same tri-state
   *  degrade as the single-membership card). */
  autoRenew?: boolean
}

const MEMBERSHIP_VALUES: Record<string, MembershipValueFixture> = {
  // Elite — the demo learner. THE FIRST THREE ROWS ARE CURATED TO SUM TO
  // $1,180 saved · $196 paid · 38 credits · 15 certificates · 459 hours, which
  // is what `dashboardStatsFor('elite')` reports and what the hub hero's
  // HUB_SAVINGS / HUB_STATS print. `membership-count`'s default variant is
  // `three`, so that is the count at which the roll-up and the hero agree.
  //
  // The alignment holds only at THREE. The hero is a fixed constant and the
  // roll-up varies with the count, so they can agree at exactly one count and
  // three is the one chosen. Lower/higher counts legitimately total less/more.
  //
  // This broke once and is worth guarding: the original three were FL + GA + TX,
  // and removing `elite-ot-ga` (2026-08-31, because it duplicated Texas's
  // renewal state) silently promoted New York into the slice, taking the total
  // to $1,452 / 45 credits while these comments still claimed $1,180 / 38. NY
  // now carries the value block Georgia used to, so the arithmetic is restored
  // WITHOUT re-adding a record whose renewal state is already covered.
  // `MembershipRollupAlignment.test.ts` asserts the five sums against both the
  // hero constants and the dashboard fixture, so the next reorder or deletion
  // fails a test instead of drifting quietly.
  'elite-rn-fl': { savings: 720, paid: 84, credits: 22, certificates: 9, hours: 268, since: '2025-04-23', autoRenew: true },
  // TODO(data): PT/Texas deliberately leaves autoRenew unset so the unknown
  // state is demoable in the multi view too.
  'elite-pt-tx': { savings: 192, paid: 48, credits: 7, certificates: 2, hours: 83, since: '2025-07-28' },
  // #3 — completes the curated three-count total (see the block comment above).
  // Deliberately light relative to its long tenure: a secondary Nursing licence
  // held for years but barely used, against Florida as the active primary. Its
  // `paid` is 64, not 84, because $196 is part of the curated sum — and `paid`
  // here feeds ONLY the roll-up total, never renewal copy (that comes from
  // `priceLabel`), so this changes no price a learner sees.
  'elite-rn-ny': { savings: 268, paid: 64, credits: 9, certificates: 4, hours: 108, since: '2025-06-25', autoRenew: true },
  // #4 — only summed in at the five- and six-count views, so the curated
  // three-count total above is unaffected.
  'elite-rn-ca': { savings: 305, paid: 64, credits: 11, certificates: 3, hours: 132, since: '2025-09-16' },
  // #5–6 — the grace-period and expired records that complete the full
  // six-membership set. Only summed in at the six-count view, so the lower
  // counts' totals are unaffected.
  'elite-rn-il': { savings: 210, paid: 48, credits: 8, certificates: 3, hours: 96, since: '2025-05-19' },
  'elite-ot-az': { savings: 145, paid: 99, credits: 5, certificates: 1, hours: 61, since: '2026-01-04', autoRenew: false },
  // Fitzgerald — NP certification specialties.
  'fhea-fnp-fl': { savings: 640, paid: 84, credits: 19, certificates: 8, hours: 240, since: '2025-05-20', autoRenew: true },
  'fhea-pmhnp-ga': { savings: 320, paid: 64, credits: 12, certificates: 5, hours: 141, since: '2025-08-14', autoRenew: true },
  'fhea-agnp-tx': { savings: 220, paid: 48, credits: 7, certificates: 2, hours: 78, since: '2025-09-25' },
}

/** A membership row: the account's record + its value/renewal facts. */
export type MembershipRow = MembershipRecord & {
  savings: number
  paid: number
  credits: number
  certificates: number
  hours: number
  tenureDays: number
  autoRenew?: boolean
  /** Formatted renewal date, e.g. "Nov 3, 2026". */
  renewsOn: string
  /** Whole days until renewal. */
  daysRemaining: number
}

/** Fallback for a membership with no authored value fixture — renders as a row
 *  with zeroed value rather than disappearing. */
const EMPTY_VALUE: MembershipValueFixture = {
  savings: 0,
  paid: 0,
  credits: 0,
  certificates: 0,
  hours: 0,
  // Today ⇒ zero tenure, matching the zeroed value above.
  since: new Date().toISOString().slice(0, 10),
}

/**
 * The learner's memberships as rows, newest-expiring first so the one needing
 * attention soonest leads the list. Empty for brands with no authored
 * multi-membership fixture (everything except Elite + Fitzgerald today), which
 * is what the consumer falls back to the single-card treatment on.
 */
export function multiMembershipRowsFor(brand: Brand, limit?: number): MembershipRow[] {
  const records = multiMembershipsFor(brand)
  // Slice in FIXTURE order before sorting, so "two memberships" always means the
  // same two the left rail lists — not whichever two happen to expire soonest.
  return (limit === undefined ? records : records.slice(0, limit))
    .map((m) => {
      const v = MEMBERSHIP_VALUES[m.id] ?? EMPTY_VALUE
      return {
        ...m,
        ...v,
        // DERIVED, never authored — see `since` on MembershipValueFixture for
        // why a day count cannot be a constant.
        tenureDays: daysSinceIso(v.since),
        renewsOn: fmtSlash(m.expiresOn),
        daysRemaining: daysUntil(m.expiresOn),
      }
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
}

/**
 * How long this brand's learner has been a member, in whole days, from the
 * account-level `memberSince` fixture.
 *
 * Exported because the hub hero prints the SAME fact
 * ([hubHeroStats](../../components/membership/hubHeroStats.ts)) and used to
 * hardcode it, which is how it drifted 71 days out of date. Equal by
 * construction to `rollupScorecardFor(...).metrics.tenure` for any count,
 * because the earliest membership `since` is this same date.
 */
export function accountTenureDaysFor(brand: Brand): number {
  const iso = PLAN_BY_BRAND[brand]?.memberSince
  return iso ? daysSinceIso(iso) : 0
}

/** The account join date, formatted for display — "Apr 23, 2025". */
export function accountMemberSinceLabelFor(brand: Brand): string | undefined {
  const iso = PLAN_BY_BRAND[brand]?.memberSince
  return iso ? fmtIso(iso) : undefined
}

/** Currency with no cents — "$1,180". */
function usd(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

/**
 * Aggregate any set of membership rows into a scorecard. Pass every row for the
 * lifetime total, or just the visible ones to have the scorecard track the
 * filter — the two behaviors under review are the same call with a different
 * argument, so they can never disagree about how the math works.
 *
 * Returns `null` for an empty set, so the caller renders its empty state rather
 * than a scorecard full of zeroes.
 */
export function rollupScorecardFor(rows: MembershipRow[]): MembershipScorecard | null {
  if (rows.length === 0) return null
  const savings = rows.reduce((s, r) => s + r.savings, 0)
  const paid = rows.reduce((s, r) => s + r.paid, 0)
  const credits = rows.reduce((s, r) => s + r.credits, 0)
  const certificates = rows.reduce((s, r) => s + r.certificates, 0)
  const hours = rows.reduce((s, r) => s + r.hours, 0)
  // NOT a sum. Savings, credits, certificates and hours are additive — each
  // membership contributes its own — but tenure is a SPAN, and memberships run
  // concurrently, so adding them double-counts the same calendar days. Three
  // memberships held for ~16 months each is 16 months of membership, not 4
  // years; summing them printed 2,025 days against the hero's own tenure.
  //
  // The longest-held membership IS how long the learner has been a member,
  // because every `since` is measured to today and the earliest one is the
  // account's own join date. So this is count-INVARIANT by design: adding a
  // newer membership cannot extend how long you have been a member.
  const tenureDays = rows.reduce((max, r) => Math.max(max, r.tenureDays), 0)

  return {
    savingsAmount: savings > 0 ? usd(savings) : undefined,
    paidAmount: paid > 0 ? usd(paid) : undefined,
    // Floor, never round — same rule as the single-membership card.
    multiple: savings > 0 && paid > 0 ? Math.floor(savings / paid) : undefined,
    // A roll-up spans several start dates, so a single "paid for itself" date
    // would be misleading. Deliberately omitted; the meter renders uncaptioned.
    paybackDate: undefined,
    paybackDays: undefined,
    metrics: [
      {
        key: 'credits',
        label: 'Credits',
        value: `${credits}`,
        sub: rows.length === 1 ? 'total completed' : `across ${rows.length} memberships`,
      },
      { key: 'certificates', label: 'Certificates', value: `${certificates}`, sub: 'lifetime earned' },
      { key: 'hours', label: 'Time spent', value: `${hours}`, sub: 'hours of learning' },
      {
        key: 'tenure',
        label: 'Days of Membership',
        value: tenureDays.toLocaleString(),
        // Deliberately NOT "across N memberships" like the additive metrics —
        // this is one span, so saying it spans several would restate the sum
        // that was just removed.
        sub: 'since you joined',
      },
    ],
  }
}

/**
 * How many memberships the learner holds, from the `membership-count` flag.
 * Off ⇒ 1 (a single membership), on ⇒ the variant's count. Kept here as a pure
 * function so the rail, the Membership page, and the tests all resolve the
 * count identically from the same flag state.
 */
export function resolveMembershipCount(enabled: boolean, variant?: string): number {
  if (!enabled) return 1
  if (variant === 'two') return 2
  if (variant === 'five') return 5
  // Seven is the full Elite set — one membership per renewal state, which is
  // what makes every state demoable rather than just unit-tested.
  // Still keyed 'seven' so saved sandboxes and shared ?ff= links keep resolving;
  // the Elite set dropped to six records on 2026-08-31. The limit is a cap, not
  // a count, so asking for 7 of 6 simply returns all six.
  if (variant === 'seven') return 7
  return 3
}

/** Distinct professions across the learner's memberships, in fixture order. */
export function professionsForRows(rows: MembershipRow[]): string[] {
  return [...new Set(rows.map((r) => r.profession))]
}

/** Distinct states across the learner's memberships, alphabetical. */
export function statesForRows(rows: MembershipRow[]): string[] {
  return [...new Set(rows.map((r) => r.state))].sort((a, b) => a.localeCompare(b))
}
