import type { Brand } from '@/context/AccountContext'

/**
 * Member-view fixtures for the Membership v2 (Passport) page: the CE
 * progress ladder (Starbucks-Stars analog) and the "Pick up where you
 * left off" continue-learning cards. Values match the member prototype.
 *
 * No equivalent existed in the codebase, so this is a small new fixture.
 * TODO(data): replace with real per-user CE progress + resume data from
 * the engagement service once available.
 */

export type CeMilestoneMarker = 'check' | 'star' | 'trophy'

export type CeMilestone = {
  /** e.g. "5 hours". */
  label: string
  /** Reward / outcome unlocked at this milestone. */
  reward: string
  done: boolean
  marker: CeMilestoneMarker
}

/** Hero-style KPI point shown at the top of the progress card. */
export type CeKpi = {
  label: string
  value: number | string
  /** Short caption under the value. */
  meta: string
}

export type CeProgress = {
  earnedHours: number
  goalHours: number
  /** Short encouragement line shown beside the big number. */
  note: string
  /** Hero-style learning KPIs surfaced at the top of the card. */
  kpis: CeKpi[]
  milestones: CeMilestone[]
}

export type ContinueLearningItem = {
  id: string
  title: string
  /** 0-100. */
  percent: number
  /** e.g. "1.5 CE hours". */
  ceHours: string
}


const ELITE_CONTINUE_LEARNING: ContinueLearningItem[] = [
  { id: 'iv-therapy', title: 'IV Therapy & Vascular Access', percent: 72, ceHours: '1.5 CE hours' },
  {
    id: 'cardiac-assessment',
    title: 'Advanced Cardiac Assessment',
    percent: 40,
    ceHours: '2.0 CE hours',
  },
  {
    id: 'high-alert-meds',
    title: 'Pharmacology: High-Alert Meds',
    percent: 18,
    ceHours: '3.0 CE hours',
  },
]

/** Membership summary surfaced in the member hero — status, join date
 *  (drives the "member for X days" count), and renewal date. */
export type MembershipUpgrade = {
  /** Tier name shown as the card's big value, e.g. "Premium Membership". */
  tier: string
  /** Short upsell caption under the value. */
  meta: string
}

export type MembershipSummary = {
  status: string
  /** ISO join date (YYYY-MM-DD) — the live day count is computed from it. */
  memberSince: string
  /** ISO renewal date (YYYY-MM-DD). */
  renews: string
  /** Present when the member can move to a higher tier — drives the
   *  "Upgrade" KPI card in the hero. Omit for top-tier members. */
  upgrade?: MembershipUpgrade
}

const MEMBERSHIP_BY_BRAND: Record<Brand, MembershipSummary | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function passportMembershipFor(brand: Brand): MembershipSummary | null {
  return MEMBERSHIP_BY_BRAND[brand]
}

/** Money saved by holding the membership (vs. paying per course) —
 *  surfaced in the member hero. */
export type MemberSavings = {
  amount: string
  meta: string
}

const SAVINGS_BY_BRAND: Record<Brand, MemberSavings | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function passportSavingsFor(brand: Brand): MemberSavings | null {
  return SAVINGS_BY_BRAND[brand]
}

const CE_PROGRESS_BY_BRAND: Record<Brand, CeProgress | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

const CONTINUE_BY_BRAND: Record<Brand, ContinueLearningItem[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function ceProgressFor(brand: Brand): CeProgress | null {
  return CE_PROGRESS_BY_BRAND[brand]
}

export function continueLearningFor(brand: Brand): ContinueLearningItem[] {
  return CONTINUE_BY_BRAND[brand]
}
