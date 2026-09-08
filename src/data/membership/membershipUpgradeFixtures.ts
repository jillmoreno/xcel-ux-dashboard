import type { Brand, MembershipTier } from '@/context/AccountContext'

/**
 * Copy for the "Upgrade Membership" modal opened from the What's New / dashboard
 * `WhatsNewUpsellBand` (Figma reference — the Lite→full upgrade offer). Brand-
 * aware so the plan name, price, current-plan reference, benefit bullets, and
 * marketing image all read on-brand. `TODO(data):` prices + bullets are demo
 * placeholders — refresh per real plan config.
 */
export type UpgradeBullet = { lead: string; rest: string }

export type MembershipUpgrade = {
  /** Full plan being upgraded to — used in the title + cart ("Passport Membership"). */
  planName: string
  /** Brand-qualified plan name for the "…{plan} includes:" line ("Elite Nursing Passport"). */
  planFullName: string
  /** The learner's current (lower) plan, referenced in the intro + "current {x} benefits". */
  currentPlanShort: string
  /** Pre-formatted price ("$99.99"). */
  price: string
  intro: string
  benefitsLead: string
  bullets: UpgradeBullet[]
  /** Right-column marketing image (public path). */
  image: string
}

const UPGRADE_BY_BRAND: Record<Brand, MembershipUpgrade> = {
  // XCEL has no consumer membership, so nothing below is reachable — every
  // surface reading this map is suppressed for it. The entry exists only
  // because the map is an exhaustive `Record<Brand, …>`. Deliberately blank
  // rather than plausible: XCEL sells Standard / Premier COURSE PACKAGES, and
  // a filled-in stub here would read as product truth in a screenshot.
  xcel: {
    planName: '',
    planFullName: '',
    currentPlanShort: '',
    price: '',
    intro: '',
    benefitsLead: '',
    bullets: [],
    image: '',
  },
}

export function membershipUpgradeFor(brand: Brand): MembershipUpgrade {
  return UPGRADE_BY_BRAND[brand]
}

/* ─── "Become a Member" (non-member join offer) ──────────────────────────── */

/**
 * Copy for the non-member "Become a Member" modal — same layout as the upgrade
 * modal, but framed as a first purchase of the brand's ENTRY tier (Plus /
 * Passport Lite / Standard) rather than a Lite→full upgrade. `listPrice` is the
 * struck-through pre-discount price for the "You Pay Today" cart row.
 */
export type MembershipBecome = {
  /** Short tier name for the title ("Plus", "Passport Lite", "Standard"). */
  tierName: string
  /** Full plan name for the cart row ("Plus Membership"). */
  planName: string
  /** Pre-formatted pay-today price ("$99"). */
  price: string
  /** Struck-through list price shown above the pay-today price ("$120"). */
  listPrice: string
  intro: string
  benefitsLead: string
  bullets: UpgradeBullet[]
  image: string
}

const BECOME_BY_BRAND: Record<Brand, MembershipBecome> = {
  // XCEL has no consumer membership, so nothing below is reachable — every
  // surface reading this map is suppressed for it. The entry exists only
  // because the map is an exhaustive `Record<Brand, …>`. Deliberately blank
  // rather than plausible: XCEL sells Standard / Premier COURSE PACKAGES, and
  // a filled-in stub here would read as product truth in a screenshot.
  xcel: {
    tierName: '',
    planName: '',
    price: '',
    listPrice: '',
    intro: '',
    benefitsLead: '',
    bullets: [],
    image: '',
  },
}

export function membershipBecomeFor(brand: Brand): MembershipBecome {
  return BECOME_BY_BRAND[brand]
}

/* ─── Compare Plans (the modal's second step) ────────────────────────────── */

export type MembershipComparePlan = {
  /** Plan name, e.g. "Passport Lite Membership". */
  name: string
  /** Profession/segment sub-line ("US Nursing"). */
  profession: string
  /** Pre-formatted price ("$48"). */
  price: string
  /** Term suffix after the price ("year"). */
  period: string
  /** The learner's current plan — renders the "Current Membership" chip (no CTA). */
  current?: boolean
  /** The upsell plan — carries the "Recommended" badge + the Add To Cart CTA. */
  recommended?: boolean
  /** Which membership tier this plan IS. Lets `membershipChangePlanFor` rank the
   *  ladder against what the learner holds instead of matching on plan name. */
  tier?: MembershipTier
  /** Ranked BELOW the learner's current tier. Renders a quieter outline CTA —
   *  a downgrade should be reachable without being sold. */
  downgrade?: boolean
  /** Small print under the CTA. Today only downgrades carry one. Split into two
   *  lines rather than one sentence so the DATE leads — it is the fact the
   *  learner is deciding on, and buried mid-sentence it was the easiest part to
   *  skim past. */
  note?: { lead: string; detail: string }
  ctaLabel: string
  bullets: string[]
}

/** Plans for the Compare Plans step — typically 2 (current + upgrade), but a
 *  brand may list 3 (the modal sizes its width + columns to the count). */
export type MembershipComparison = { title: string; plans: MembershipComparePlan[] }

/** Strip the current-plan treatment for the non-member flow — a non-member has no
 *  current plan, so every card becomes a selectable "Add To Cart". */
function toNonMemberPlans(plans: MembershipComparePlan[]): MembershipComparePlan[] {
  return plans.map((p) => ({
    ...p,
    current: false,
    ctaLabel: p.current ? 'Add To Cart' : p.ctaLabel,
  }))
}

const COMPARE_BY_BRAND: Record<Brand, MembershipComparison> = {
  // XCEL has no membership ladder to compare — see the stub note on
  // UPGRADE_BY_BRAND above.
  xcel: { title: '', plans: [] },
}

/** Non-member comparison per brand — real estate lists all three tiers;
 *  Elite/STC reuse their member ladders with the current-plan treatment stripped. */
const COMPARE_NON_MEMBER_BY_BRAND: Record<Brand, MembershipComparison> = {
  // XCEL has no consumer membership, so nothing below is reachable — every
  // surface reading this map is suppressed for it. The entry exists only
  // because the map is an exhaustive `Record<Brand, …>`. Deliberately blank
  // rather than plausible: XCEL sells Standard / Premier COURSE PACKAGES, and
  // a filled-in stub here would read as product truth in a screenshot.
  xcel: { title: '', plans: [] },
}

export function membershipCompareFor(brand: Brand, isMember = true): MembershipComparison {
  return isMember ? COMPARE_BY_BRAND[brand] : COMPARE_NON_MEMBER_BY_BRAND[brand]
}

const TIER_RANK: Record<MembershipTier, number> = {
  'non-member': -1,
  low: 0,
  mid: 1,
  high: 2,
}

/**
 * The "Change plan" ladder for a member — every tier the brand sells, ranked
 * against the one they hold. Opened from the Manage Membership sheet.
 *
 * Reads the NON-MEMBER ladder, not the member one, and that is the load-bearing
 * choice: the member ladder is the two-card Lite→full UPGRADE offer, so for
 * real estate it lists Plus and Premier and omits Pro entirely. A Pro member
 * opening it would not find their own membership in it. The non-member ladder is the
 * only one that carries the full set.
 *
 * What the tier ranking decides:
 *   • CURRENT — the plan matching their tier. Muted card + "Current Membership"
 *     chip, no CTA. This is the "their current membership selected" case.
 *   • RECOMMENDED — the IMMEDIATE next tier up, if there is one, and only ever
 *     one. A learner already on the top tier gets nothing badged: recommending
 *     a downgrade would be the store arguing against itself.
 *   • DOWNGRADE — anything ranked below them. Still listed (a top-tier member
 *     should be able to see the cheaper options) but with a quiet outline CTA,
 *     because it should be reachable without being sold.
 *
 * Downgrade rules, settled with Jillienne 2026-08-27 (logged on the
 * `membership-sections` handoff):
 *   • Takes effect AT RENEWAL, never mid-term.
 *   • Therefore no proration, refund or credit — no money moves at the moment
 *     of switching, which is the whole reason "at renewal" was chosen.
 *   • The learner keeps their CURRENT tier's content until that date. That is
 *     what `downgradeNoteFor` puts on the card, and it is the one promise this
 *     screen makes, so it must not be softened to "soon" or dropped for space.
 *   • The recommendation is the immediate next tier up, not the top one.
 *
 * `TODO(product)`: whether an UPGRADE is prorated mid-term is still open, and
 * it is not symmetric with the above — the upgrade copy already promises "we'll
 * apply the unused value of your {current} Membership", so an answer that
 * contradicts it means changing that copy too.
 */
/** The downgrade small print, as a lead line + its supporting clause. Names the
 *  date when we know it, because "at your next renewal" is the vaguer half of
 *  the same promise and this is the only place the learner is told when their
 *  current content goes away. */
function downgradeNoteFor(
  currentTierLabel?: string,
  renewalDate?: string,
): { lead: string; detail: string } {
  const tier = currentTierLabel ?? 'current'
  return {
    lead: renewalDate ? `Starts on ${renewalDate}` : 'Starts at your next renewal',
    detail: `Your ${tier} content stays available until then.`,
  }
}

export function membershipChangePlanFor(
  brand: Brand,
  currentTier: MembershipTier,
  /** Used only to compose the downgrade note. Both optional: with neither, the
   *  note degrades to the undated form rather than disappearing. */
  opts: { currentTierLabel?: string; renewalDate?: string } = {},
): MembershipComparison {
  const full = COMPARE_NON_MEMBER_BY_BRAND[brand]
  const rank = TIER_RANK[currentTier]
  const upgrade = full.plans
    .filter((p) => p.tier != null && TIER_RANK[p.tier] > rank)
    .sort((a, b) => TIER_RANK[a.tier!] - TIER_RANK[b.tier!])[0]
  return {
    title: full.title,
    plans: full.plans.map((p) => {
      const isCurrent = p.tier != null && p.tier === currentTier
      const isDowngrade = p.tier != null && TIER_RANK[p.tier] < rank
      const isUpgrade = upgrade != null && p === upgrade
      return {
        ...p,
        current: isCurrent,
        recommended: isUpgrade,
        downgrade: isDowngrade,
        note: isDowngrade
          ? downgradeNoteFor(opts.currentTierLabel, opts.renewalDate)
          : undefined,
        ctaLabel: isCurrent
          ? 'Current Membership'
          : isDowngrade
            ? 'Switch to this plan'
            : 'Add To Cart',
      }
    }),
  }
}
