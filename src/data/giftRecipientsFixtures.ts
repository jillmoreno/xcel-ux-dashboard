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

/* ─── STC records ───────────────────────────────────────────────────────── */
// A firm (Cavell Capital) onboarding a new class of registered reps. Deliberately
// spread across four months + both claim states so the month grouping, the
// Claimed / Unclaimed filter, both sorts, and the reminder action all have
// something to act on. Two records already carry a `lastReminderSentOn` so the
// "reminder already sent" state is visible without firing one.

/* ─── selectors ─────────────────────────────────────────────────────────── */

const BY_BRAND: Partial<Record<Brand, GiftRecipientRecord[]>> = {
}

/** Gift-recipient purchase records for the active brand. `[]` ⇒ the brand
 *  doesn't sell purchase-for-others, and the feature self-hides. */
export function giftRecipientsFor(brand: Brand): GiftRecipientRecord[] {
  return BY_BRAND[brand] ?? []
}

/*
 * ─────────────────────────────────────────────────────────────────────────
 *  NO XCEL FIXTURE DATA — this feature is currently dark.
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Every gift-recipient record in the LMS belonged to STC; no other brand
 *  authored one. `supportsGiftRecipients` is defined as
 *  `giftRecipientsFor(brand).length > 0`, so with STC gone it is false for
 *  XCEL, the account-menu row hides itself and the panel renders its empty
 *  state. That is the feature behaving CORRECTLY for a brand with no
 *  purchase-for-others data — but it means the roster table these tests drive
 *  has nothing to render, and every assertion here fails on an absent table
 *  rather than on a defect.
 *
 *  THIS IS THE ONE GAP WORTH ACTING ON. Gift Recipients is not incidental to
 *  XCEL: the gap audit lists it as the answer to XCEL's bulk/roster purchasing
 *  need, it is the only surface in the app modelling claimed/unclaimed seats,
 *  and `xcel-admin-tool.html` — this repo's own prototype — argues with it by
 *  name. It went dark as a side effect of removing STC, not as a decision.
 *
 *  To restore: author XCEL `GiftRecipientRecord`s in
 *  `src/data/giftRecipientsFixtures.ts` under an `xcel:` key (an agency buying
 *  pre-licensing seats for recruits is the natural shape), then restore the two test
 *  files from git history — the component, the flag arms and the table itself
 *  are all untouched, so nothing needs rebuilding.
 *
 *  Removed 2026-09-08 with the five-brand strip.
 */
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
