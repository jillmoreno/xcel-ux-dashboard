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

const ELITE_CE_PROGRESS: CeProgress = {
  earnedHours: 18,
  goalHours: 30,
  note: '12 hours to your annual goal · keep going!',
  kpis: [
    { label: 'CE hours this year', value: 18, meta: '12 to your annual goal' },
    { label: 'Courses completed', value: 24, meta: 'this year' },
    { label: 'Certificates earned', value: 12, meta: 'lifetime' },
  ],
  milestones: [
    { label: '5 hours', reward: 'First CE badge', done: true, marker: 'check' },
    {
      label: '15 hours',
      reward: 'Specialty digest unlocked',
      done: true,
      marker: 'check',
    },
    { label: '25 hours', reward: 'Free exam-prep bundle', done: false, marker: 'star' },
    {
      label: '30 hours',
      reward: 'Annual requirement met',
      done: false,
      marker: 'trophy',
    },
  ],
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
  cre: null,
  mckissock: null,
  elite: {
    status: 'Active',
    memberSince: '2025-04-23',
    renews: '2027-03-14',
    upgrade: { tier: 'Premium Membership', meta: 'Upgrade now to save $350 more a year' },
  },
  fitzgerald: {
    status: 'Active',
    memberSince: '2025-04-23',
    renews: '2027-03-14',
    upgrade: { tier: 'Premium Membership', meta: 'Upgrade now to save $350 more a year' },
  },
  stc: null,
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
  cre: null,
  mckissock: null,
  elite: { amount: '$1,180', meta: 'saved this year with your Passport' },
  fitzgerald: { amount: '$1,180', meta: 'saved this year with your Passport' },
  stc: null,
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function passportSavingsFor(brand: Brand): MemberSavings | null {
  return SAVINGS_BY_BRAND[brand]
}

const CE_PROGRESS_BY_BRAND: Record<Brand, CeProgress | null> = {
  cre: null,
  mckissock: null,
  elite: ELITE_CE_PROGRESS,
  fitzgerald: ELITE_CE_PROGRESS,
  stc: null,
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

const CONTINUE_BY_BRAND: Record<Brand, ContinueLearningItem[]> = {
  cre: [],
  mckissock: [],
  elite: ELITE_CONTINUE_LEARNING,
  fitzgerald: ELITE_CONTINUE_LEARNING,
  stc: [],
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
