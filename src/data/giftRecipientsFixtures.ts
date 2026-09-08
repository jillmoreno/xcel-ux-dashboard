// TODO(data): replace with the real purchase-for-others API. Expected shape is
// one record per gifted order line — see `GiftRecipientRecord` below. The server
// owns `status` / `claimedOn` / `lastReminderSentOn` (redemption monitoring);
// everything else is order data already available at checkout.
//
// Purchase-for-others tracking ("Gift Recipients"). A manager / bulk purchaser
// buys exam-prep products on behalf of their team, then needs to confirm what
// they bought, for whom, and whether each recipient has CLAIMED (logged in to)
// their access — plus a way to nudge the ones who haven't.
//
// STC (Financial Services) is the brand this ships for: securities exam prep is
// bought by firms for their new registered reps, so the manager persona is the
// real buyer. Every other brand returns `[]`, which self-hides the whole
// feature (the account sub-nav item + the section body) — see
// `supportsGiftRecipients`.

import type { Brand } from '@/context/AccountContext'

/** Whether the recipient has logged in and claimed the access they were gifted. */
export type GiftClaimStatus = 'claimed' | 'unclaimed'

/** One product inside the gifted package (what the recipient actually gets). */
export type GiftPackageItem = {
  id: string
  title: string
}

export type GiftRecipientRecord = {
  id: string
  /** Who the purchase was made for. */
  recipient: { name: string; email: string }
  /** Order date, ISO `YYYY-MM-DD`. Drives the month grouping + date sort. */
  orderDate: string
  /** Order reference shown in the expanded detail. */
  orderNumber: string
  /** Who paid — the purchasing firm / manager. */
  giftedBy: string
  status: GiftClaimStatus
  /** The gifted package + its contents. `items.length` is the row's "N items". */
  package: { title: string; items: GiftPackageItem[] }
  /** Claimed records only — when the recipient first logged in (ISO). */
  claimedOn?: string
  /**
   * Claimed records only — a short human read on how far they've got. Free text
   * from the LMS ("Claimed and in progress" / "Claimed — not started").
   * Unclaimed records render a fixed "Not yet claimed" line instead.
   */
  claimDetail?: string
  /** Unclaimed records only — when a reminder was last sent (ISO). Absent ⇒
   *  never reminded. Sending a reminder in the prototype sets this in local
   *  state only (no persistence). */
  lastReminderSentOn?: string
}

/* ─── package catalog ───────────────────────────────────────────────────── */
// Contents mirror how STC sells its exam prep (stcusa.com): a titled package
// whose line items are the exam bank, chapter quizzes, on-demand lecture, and
// the printed manual. Edition numbers are part of the real product names.

function items(...titles: string[]): GiftPackageItem[] {
  return titles.map((title, i) => ({ id: `${slug(title)}-${i}`, title }))
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const SERIES_7_PREMIER = {
  title: 'Series 7 Premier',
  items: items(
    'Series 7 Final and Custom Exams-45th Edition',
    'Series 7 Chapter Quizzes',
    'Series 7 On-Demand Lecture-45th Edition',
    'Series 7 Printed Study Manual',
  ),
}

const SIE_PREMIER = {
  title: 'SIE Premier',
  items: items(
    'SIE Final and Custom Exams-12th Edition',
    'SIE Chapter Quizzes',
    'SIE On-Demand Lecture-12th Edition',
    'SIE Printed Study Manual',
    'SIE Vocabulary Flashcards',
  ),
}

const SERIES_63_ESSENTIALS = {
  title: 'Series 63 Essentials',
  items: items(
    'Series 63 Final and Custom Exams-30th Edition',
    'Series 63 Chapter Quizzes',
    'Series 63 Printed Study Manual',
  ),
}

const SERIES_65_PREMIER = {
  title: 'Series 65 Premier',
  items: items(
    'Series 65 Final and Custom Exams-22nd Edition',
    'Series 65 Chapter Quizzes',
    'Series 65 On-Demand Lecture-22nd Edition',
    'Series 65 Printed Study Manual',
  ),
}

const SERIES_24_PREMIER = {
  title: 'Series 24 Premier',
  items: items(
    'Series 24 Final and Custom Exams-18th Edition',
    'Series 24 Chapter Quizzes',
    'Series 24 On-Demand Lecture-18th Edition',
    'Series 24 Printed Study Manual',
  ),
}

const CFP_COMPLETE = {
  title: 'CFP Exam Prep — Complete',
  items: items(
    'CFP Final and Custom Exams',
    'CFP Chapter Quizzes',
    'CFP On-Demand Lecture Series',
    'CFP Printed Study Manual',
    'CFP Case Study Workbook',
  ),
}

/* ─── STC records ───────────────────────────────────────────────────────── */
// A firm (Cavell Capital) onboarding a new class of registered reps. Deliberately
// spread across four months + both claim states so the month grouping, the
// Claimed / Unclaimed filter, both sorts, and the reminder action all have
// something to act on. Two records already carry a `lastReminderSentOn` so the
// "reminder already sent" state is visible without firing one.

const STC_RECORDS: GiftRecipientRecord[] = [
  {
    id: 'gr-stc-001',
    recipient: { name: 'Marcus Bell', email: 'mbell@cavellcapital.com' },
    orderDate: '2026-08-14',
    orderNumber: 'STC-518204',
    giftedBy: 'Cavell Capital',
    status: 'unclaimed',
    package: SIE_PREMIER,
  },
  {
    id: 'gr-stc-002',
    recipient: { name: 'Priya Raghunathan', email: 'praghunathan@cavellcapital.com' },
    orderDate: '2026-08-14',
    orderNumber: 'STC-518205',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-08-17',
    claimDetail: 'Claimed and in progress',
    package: SERIES_7_PREMIER,
  },
  {
    id: 'gr-stc-003',
    recipient: { name: 'Devon Okafor', email: 'dokafor@cavellcapital.com' },
    orderDate: '2026-08-06',
    orderNumber: 'STC-514877',
    giftedBy: 'Cavell Capital',
    status: 'unclaimed',
    lastReminderSentOn: '2026-08-13',
    package: SERIES_7_PREMIER,
  },
  {
    id: 'gr-stc-004',
    recipient: { name: 'Alicia Fontaine', email: 'afontaine@cavellcapital.com' },
    orderDate: '2026-08-06',
    orderNumber: 'STC-514878',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-08-07',
    claimDetail: 'Claimed — not started',
    package: SERIES_63_ESSENTIALS,
  },
  {
    id: 'gr-stc-005',
    recipient: { name: 'Ben Whitfield', email: 'bwhitfield@cavellcapital.com' },
    orderDate: '2026-07-22',
    orderNumber: 'STC-501993',
    giftedBy: 'Cavell Capital',
    status: 'unclaimed',
    package: SERIES_65_PREMIER,
  },
  {
    id: 'gr-stc-006',
    recipient: { name: 'Yuki Tanaka', email: 'ytanaka@cavellcapital.com' },
    orderDate: '2026-07-22',
    orderNumber: 'STC-501994',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-07-24',
    claimDetail: 'Claimed and in progress',
    package: SERIES_65_PREMIER,
  },
  {
    id: 'gr-stc-007',
    recipient: { name: 'Chloe Barrett', email: 'cbarrett@cavellcapital.com' },
    orderDate: '2026-07-09',
    orderNumber: 'STC-497120',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-07-09',
    claimDetail: 'Claimed and in progress',
    package: SIE_PREMIER,
  },
  {
    id: 'gr-stc-008',
    recipient: { name: 'Andre Salas', email: 'asalas@cavellcapital.com' },
    orderDate: '2026-06-18',
    orderNumber: 'STC-482016',
    giftedBy: 'Cavell Capital',
    status: 'unclaimed',
    lastReminderSentOn: '2026-07-02',
    package: SERIES_24_PREMIER,
  },
  {
    id: 'gr-stc-009',
    recipient: { name: 'Nadia Haddad', email: 'nhaddad@cavellcapital.com' },
    orderDate: '2026-06-18',
    orderNumber: 'STC-482017',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-06-19',
    claimDetail: 'Claimed and in progress',
    package: SERIES_24_PREMIER,
  },
  {
    id: 'gr-stc-010',
    recipient: { name: 'Tom Ferreira', email: 'tferreira@cavellcapital.com' },
    orderDate: '2026-06-02',
    orderNumber: 'STC-476540',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-06-04',
    claimDetail: 'Claimed — completed',
    package: SERIES_63_ESSENTIALS,
  },
  {
    id: 'gr-stc-011',
    recipient: { name: 'Marcus Bell', email: 'mbell@cavellcapital.com' },
    orderDate: '2026-03-12',
    orderNumber: 'STC-462773',
    giftedBy: 'Cavell Capital',
    status: 'unclaimed',
    package: CFP_COMPLETE,
  },
  {
    id: 'gr-stc-012',
    recipient: { name: 'Priya Raghunathan', email: 'praghunathan@cavellcapital.com' },
    orderDate: '2026-03-04',
    orderNumber: 'STC-462774',
    giftedBy: 'Cavell Capital',
    status: 'claimed',
    claimedOn: '2026-03-06',
    claimDetail: 'Claimed and in progress',
    package: SERIES_7_PREMIER,
  },
]

/* ─── selectors ─────────────────────────────────────────────────────────── */

const BY_BRAND: Partial<Record<Brand, GiftRecipientRecord[]>> = {
}

/** Gift-recipient purchase records for the active brand. `[]` ⇒ the brand
 *  doesn't sell purchase-for-others, and the feature self-hides. */
export function giftRecipientsFor(brand: Brand): GiftRecipientRecord[] {
  return BY_BRAND[brand] ?? []
}

/** Whether this brand exposes the Gift Recipients section at all. Read by
 *  `AccountMenu` (to show/hide the dropdown row) and by the panel (to render an
 *  empty state instead of a broken list). */
export function supportsGiftRecipients(brand: Brand): boolean {
  return giftRecipientsFor(brand).length > 0
}

/**
 * The brand to demo this section in when the active one doesn't sell
 * purchase-for-others. The Dashboard Rebrand shell seeds Elite on entry (its
 * membership sections are Elite-only), so the route into the section carries
 * `?brand=` — the shell's opt-out — to keep a reviewer from landing on the
 * empty state. STC today; if another brand gets records, prefer the ACTIVE
 * brand when it supports the feature (see `GiftRecipientsRoute` in App.tsx).
 */
export const GIFT_RECIPIENTS_DEMO_BRAND: Brand = 'xcel'
