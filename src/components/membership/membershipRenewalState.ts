import type { MembershipRecord, MembershipRenewal } from '@/context/AccountContext'

/**
 * Renewal-state model for the membership card, per the copy review at
 * `explorations/membership-card-ui/renewal-states-copy-review.html` (built to
 * Figma 633:1614 / 633:3283 / 633:3340).
 *
 * SIX states, down from seven on 2026-08-27 when `auto-renew-off` merged into
 * the two `expires-*` states — see the comment on that branch below.
 *
 * The discriminator settled in the review was **capability, not history**:
 * whether the PLAN can auto-renew at all. That still governs the COPY — a plan
 * that can't auto-renew must never mention auto-renewal — but it no longer
 * forks the state: anything that is not `'on'` resolves by DATE. The card asks
 * "does this renew itself, and when does it end", which has one answer whether
 * the learner switched auto-renewal off or the plan never offered it.
 *
 * Rules locked by the review and enforced here rather than left to each caller:
 *   • ONE SOURCE DATE — author `renewal.endsOn` and DERIVE every countdown.
 *     (The three Figma cards each carried their own date and their own day
 *     count, and the two disagreed by four days.)
 *   • Long-form dates everywhere — "December 5, 2026", never mm/dd/yy, which is
 *     ambiguous outside the US.
 *   • Sentence case in every lead line.
 *   • Price is bare — "$48", never "only $48".
 *   • The countdown is neutral when it auto-renews, carries the consequence when
 *     benefits are about to end, becomes a deadline when one exists, and is
 *     ABSENT once expired.
 *   • Whenever expiry is mentioned, say BOTH halves: benefits end, but
 *     certificates / progress / à-la-carte buying stay.
 *   • Every state carries a status pill, and never color alone — the pill always
 *     names the access state in words.
 */
export type MembershipRenewalStateId =
  | 'auto-renews'
  | 'expires-outside-window'
  | 'expires-in-window'
  | 'payment-failed'
  | 'grace'
  | 'expired'

/** Status-pill tone. Green = full access, amber = access at risk / paused, red
 *  = access ended. */
export type RenewalPillTone = 'active' | 'attn' | 'expired'

/** Which glyph leads the body row (and its color). */
export type RenewalIcon = 'renew' | 'calendar' | 'card'

export type MembershipRenewalState = {
  id: MembershipRenewalStateId
  /** Pill label — always words, never color alone. */
  pill: string
  pillTone: RenewalPillTone
  icon: RenewalIcon
  /** Body row's bold first line. */
  lead: string
  /** Emphasis for the lead (error / warning), matching the icon's severity. */
  leadTone?: 'error' | 'warning'
  /** Body row's supporting lines. Rendered as separate lines, in order. */
  notes: string[]
  /**
   * The recurring-charge disclosure, when the state has one (today only
   * `auto-renews`). Split OUT of `notes` so a surface that already states the
   * next charge in its own rows can omit it without dropping it from surfaces
   * that don't.
   *
   * Do not fold this back into `notes`, and do not delete it because it looks
   * redundant on the Manage sheet: the sheet has a "Next charge" row, but the
   * "Your Memberships" card does NOT, and there this is the only place the
   * learner is told an automatic charge is coming. Auto-renewal disclosure is
   * the one line in this file with a compliance flavour (FTC negative-option /
   * California ARL-style expectations — flagged for a legal read on the
   * handoff, not legal advice).
   */
  chargeNote?: string
  /** The card's single action. Its verb matches the body's verb. */
  cta: string
}

/**
 * How close to `endsOn` counts as "in the renewal window" — the boundary
 * between state 7 (informational, no ask) and state 2 (carries the
 * consequence + Renew now).
 *
 * TODO(product): the copy review demonstrates 108 days as inside the window and
 * 297 as outside, but never fixes the threshold. 120 is a placeholder that
 * satisfies both of its examples — confirm the real number before build.
 */
export const RENEWAL_WINDOW_DAYS = 120

/**
 * How close the end date has to be before a card counts down to it.
 *
 * Deliberately DISTINCT from `RENEWAL_WINDOW_DAYS` (120), which decides which
 * STATE a membership is in. A membership can be inside its renewal window
 * without being near enough for a countdown to tell the learner anything — "97
 * days left" is a number, not a prompt. Below this it becomes one.
 *
 * TODO(product): confirm 45 against whatever the renewal-reminder emails use,
 * the same open question `RENEWAL_WINDOW_DAYS` carries.
 */
export const COUNTDOWN_DAYS = 45

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** ISO `YYYY-MM-DD` → "December 5, 2026". Parsed by hand: `new Date(iso)` is
 *  UTC and shifts the day back for anyone west of Greenwich. */
export function formatRenewalDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** ISO → "December 5" (no year) — used where the same year is obvious from the
 *  surrounding sentence. */
function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}

/**
 * Short label printed BEFORE the membership's expiry date on the hub hero card
 * — "Auto-renews on 11/03/2026", "Expired 06/30/2026".
 *
 * The hero has no status pill and no lead sentence, so this label is the only
 * place the renewal state reaches that card. It is kept here, beside the state
 * machine, rather than in the card: the card is presentational, and a copy map
 * living next to its consumer is how the row card's version drifted out of
 * reach when that card was archived.
 *
 * TWO RULES, both easy to break:
 *
 *  1. Only `auto-renews` may say "auto-renews on". Every other state resolves
 *     by date, so keying off the state id satisfies this automatically.
 *     (This was once a capability rule — an `'unavailable'` plan could never
 *     mention auto-renewal. That value was removed 2026-08-31; the `expires-*`
 *     NOTES now prompt the setting regardless. The hero label still must not,
 *     because "Auto-renews on {date}" asserts it WILL renew.)
 *
 *  2. Every label must be true of the record's `expiresOn` SPECIFICALLY, which
 *     is the only date the hero card renders. That is why `grace` reads
 *     "Expired" and not the row card's "Expired · restore by": the restore-by
 *     deadline is `graceEndsOn`, a different date the card never shows, so that
 *     wording paired the right words with the wrong day. Change the date the
 *     card renders and these labels have to be re-checked.
 */
export const RENEWAL_DATE_LABEL: Record<MembershipRenewalStateId, string> = {
  'auto-renews': 'Auto-renews on',
  // Plain "Expires", NOT the row card's "Membership year ends" — on the hero
  // this label sits inline with the date on one short line, where the longer
  // phrase crowds it and says nothing extra. All three live-but-not-renewing
  // states therefore read "Expires" here; the hero is deliberately the least
  // stateful of the three surfaces, and the distinctions between them are made
  // in column 2. (Set 2026-08-31; the panel row still says "Your membership
  // year ends {date}" at its own density, which is not drift — same date, same
  // fact, different room.)
  'expires-outside-window': 'Expires',
  'expires-in-window': 'Expires',
  // Deliberately NOT "Payment failed": the date beside it is the membership's
  // expiry, not the failed charge or the retry cutoff, and the label has to be
  // true of the date it sits on. This means a payment-failed membership reads
  // as healthy on the hero — an open question logged on the handoff, not an
  // oversight.
  'payment-failed': 'Expires',
  grace: 'Expired',
  expired: 'Expired',
}

/** Whole days from `today` to `iso` (negative once past). Date-only math, so a
 *  timezone can't move the count. */
export function daysUntil(iso: string, today = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - now) / 86_400_000)
}

function dayCount(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/**
 * " · 45 days left" for a lead line, or nothing at all when the date is further
 * out than `COUNTDOWN_DAYS` (or already passed).
 *
 * Appended to the LEAD rather than pushed to its own note, so the countdown sits
 * beside the date it counts to — read as one fact instead of a date followed by
 * an unattached number. Returning '' rather than a null-ish value keeps the
 * template literals at the call sites plain.
 */
function countdownSuffix(days: number): string {
  return days > 0 && days <= COUNTDOWN_DAYS ? ` · ${dayCount(days)} left` : ''
}

// REMOVED 2026-08-31: `RECORD_STAYS` — "Your certificates and progress are still
// yours, and you can still buy courses individually." The `expired` note was its
// last consumer, and that note is now "Restore your membership for $N", so the
// file's both-halves rule (benefits end, but the record stays) is no longer
// stated by ANY state. The sentence itself survives as `CANCEL_RECORD_STAYS` in
// data/membership/cancelOffersFixtures.ts, which the cancellation flow still
// renders — so it is reachable when someone is actively leaving, just not on the
// cards. Restore this const if the rule comes back.

/**
 * Resolve a membership's renewal state + its copy. `today` is injectable so
 * tests don't drift as the real date moves.
 */
export function renewalStateFor(
  renewal: MembershipRenewal,
  today = new Date(),
): MembershipRenewalState {
  const { autoRenew, endsOn, price, retryUntil, graceEndsOn } = renewal
  const days = daysUntil(endsOn, today)
  const endsLong = formatRenewalDate(endsOn)

  // ── Payment failed. Outranks everything: benefits are live but about to stop
  //    for a fixable reason, and the deadline is the retry window, not the
  //    membership year.
  if (retryUntil != null && daysUntil(retryUntil, today) >= 0) {
    return {
      id: 'payment-failed',
      pill: 'Action needed',
      pillTone: 'attn',
      icon: 'card',
      lead: 'Your card on file was declined.',
      leadTone: 'error',
      // NOTE (2026-08-31, Jillienne's copy): this no longer states the retry
      // deadline. `benefitsAreActive()` still counts this state as ACTIVE, but
      // the sentence that used to justify it — "Benefits stay active until
      // {retryUntil}" — is gone, so the reason now lives only in that function's
      // comment. `retryUntil` is still what selects this state; it simply is not
      // spoken any more. Flagged on the handoff.
      notes: [`Update your payment method to process your $${price} renewal.`],
      cta: 'Update payment method',
    }
  }

  // ── Past the membership year.
  if (days < 0) {
    // Grace period — expired but the membership YEAR is recoverable.
    if (graceEndsOn != null && daysUntil(graceEndsOn, today) >= 0) {
      return {
        id: 'grace',
        // Reads as EXPIRED now, in red — same pill and tone as the `expired`
        // state below, so the two are no longer distinguishable by pill alone.
        // What still separates them is the note: grace names a restore-by date
        // and promises the membership year picks up where it left off.
        pill: 'Expired',
        pillTone: 'expired',
        icon: 'calendar',
        lead: `Expired ${endsLong}`,
        leadTone: 'error',
        // The restore-by DATE replaces the "within N days" countdown, so the
        // deadline is stated once, here, rather than split across lead and note.
        // "Your member benefits are paused" is gone — see benefitsAreActive(),
        // whose grace-is-not-active rule used to cite exactly that sentence.
        notes: [
          `Renew for $${price} by ${formatShortDate(graceEndsOn)}, and your membership year picks up where it left off.`,
        ],
        cta: 'Restore membership',
      }
    }
    // Expired. No countdown — there's nothing left to count.
    return {
      id: 'expired',
      pill: 'Expired',
      pillTone: 'expired',
      icon: 'calendar',
      lead: `Expired on ${endsLong}`,
      leadTone: 'error',
      // DROPS `RECORD_STAYS` — the file's both-halves rule (benefits end, but
      // certificates / progress / à-la-carte buying stay) is no longer stated
      // anywhere in the model as of 2026-08-31. This was the last state holding
      // it. Flagged on the handoff.
      notes: [`Restore your membership for $${price}`],
      cta: 'Restore membership',
    }
  }

  // ── Won't auto-renew — whether the plan CAN'T (`unavailable`) or simply has
  //    it switched off (`off`). Informational far out, consequence-carrying up
  //    close.
  //
  //    MERGED 2026-08-27 (Jillienne): `auto-renew-off` used to be its own state,
  //    on the reasoning that the SETTING should lead when a learner had turned
  //    it off. That distinction earned its keep while the card's CTA was the
  //    only route to switching it back on. Once the Manage sheet started
  //    offering that on every membership, `off` and `unavailable` described the
  //    identical situation from the learner's side — this membership ends on a
  //    date and will not renew itself — and two states saying that is two places
  //    for the copy to drift.
  //
  //    `renewal.autoRenew` keeps three values: the platform may well know which
  //    it is, and the sheet still reads `=== 'on'` to label its action row. What
  //    changed is that the CARD no longer forks on it.
  if (autoRenew !== 'on') {
    if (days > RENEWAL_WINDOW_DAYS) {
      return {
        id: 'expires-outside-window',
        pill: 'Active',
        pillTone: 'active',
        icon: 'calendar',
        // Same lead form as `expires-in-window` below, minus the countdown —
        // this state is only reached above RENEWAL_WINDOW_DAYS (120), always
        // past COUNTDOWN_DAYS (45), so a countdown could never pass the gate.
        lead: `Expires on ${endsLong}`,
        // ONE note for both arms (2026-08-31, Jillienne's call). The capability
        // fork added earlier the same day is gone: `off` and `unavailable` are
        // interchangeable here again, restoring the 08-27 merge in full.
        //
        // This DOES mean a plan marked `unavailable` is now told to set up
        // auto-renewal — the "never mention auto-renewal on a plan that can't"
        // rule no longer holds for this state, and its test was rewritten to
        // match. The far-out / close-up split now carries the difference
        // instead: this state nudges the setting, `expires-in-window` asks for
        // the renewal by name and price.
        notes: ['Set up auto-renewal now for uninterrupted access to your benefits.'],
        cta: 'Manage membership',
      }
    }
    return {
      id: 'expires-in-window',
      pill: 'Active',
      pillTone: 'active',
      icon: 'calendar',
      // The countdown rides the lead, to the right of the date, and only inside
      // COUNTDOWN_DAYS — so a membership 97 days out reads "Expires on …" flat,
      // and one 45 days out reads "Expires on … · 45 days left".
      lead: `Expires on ${endsLong}${countdownSuffix(days)}`,
      // ONE note for both arms, like the state above. Inside the window the ask
      // is the renewal itself — named, priced, and immediate — rather than a
      // setting. That progression (far out ⇒ set up auto-renewal · close ⇒
      // renew now) is what replaced the capability fork.
      notes: [
        `Renew now for $${price} for uninterrupted access to your member benefits.`,
      ],
      cta: 'Renew now',
    }
  }

  // ── The everyday case: it renews itself. Countdown stays neutral.
  return {
    id: 'auto-renews',
    pill: 'Active',
    pillTone: 'active',
    icon: 'renew',
    lead: `Renews automatically on ${endsLong}`,
    notes: [`${dayCount(days)} left.`],
    chargeNote: `We’ll charge $${price} to your card on file for another year.`,
    // Sentence case, matching every other CTA in this file — and the same
    // string `expires-outside-window` uses. Both are informational states with
    // no action being asked for, so both landing on the same verb is correct.
    cta: 'Manage membership',
  }
}

/**
 * Are this membership's benefits LIVE right now?
 *
 * Lives with the state machine rather than in a component, so every surface
 * that counts "active memberships" agrees with the copy on the cards.
 *
 * `payment-failed` counts as ACTIVE, which looks wrong and is not: its own note
 * says "Benefits stay active until {retry date} — update your payment method to
 * keep them." The charge failed; the access has not lapsed yet. `grace` does NOT
 * count, for the same reason read the other way — its note says "Your member
 * benefits are paused." Those two sentences are the definition; if either is
 * ever reworded, this function moves with it.
 */
export function benefitsAreActive(state: MembershipRenewalState): boolean {
  return state.id !== 'expired' && state.id !== 'grace'
}

/**
 * Fallback for a record authored before the renewal fields existed: read
 * `expiresOn` (mm/dd/yyyy) as a plain, capability-unknown expiry. Deliberately
 * never claims auto-renewal — asserting an unconfirmed auto-charge is the one
 * failure here with a billing consequence.
 */
export function renewalFallbackFor(record: MembershipRecord): MembershipRenewal | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(record.expiresOn)
  if (!m) return null
  return { autoRenew: 'off', endsOn: `${m[3]}-${m[1]}-${m[2]}`, price: 0 }
}

/**
 * The same reading, from the account-level PLAN fixture rather than a
 * per-membership record.
 *
 * Why this exists: the Manage Membership sheet is often opened unscoped — the
 * single-membership layout has no record id to pass, so it deliberately calls
 * `openSectionManage(null)`. That left anything downstream of `renewal` with
 * nothing to work from, which silently disabled the cancellation flow's
 * retention offers on the surface most learners would actually use. The facts
 * were authored all along, just in the plan fixture's shape (`renewsOn`
 * mm/dd/yyyy + `priceLabel` + an optional `autoRenew` boolean) instead of this
 * one.
 *
 * `autoRenew` absent from the fixture (McKissock, deliberately) maps to `'off'`.
 * The old mapping was to `'unavailable'`, a value that no longer exists — but
 * the reason for it is unchanged and still satisfied: only `'on'` produces the
 * auto-renews copy and its charge disclosure, so an unconfirmed setting still
 * never asserts an auto-charge. That remains the one failure here with a
 * billing consequence.
 *
 * Returns `null` when the fixture carries no renewal date at all (STC, the
 * new-user degrade fixture) — there is genuinely nothing to say, and inventing a
 * date would be worse than saying less.
 */
export function renewalFromPlanFacts(facts: {
  renewsOn?: string
  priceLabel?: string
  autoRenew?: boolean
}): MembershipRenewal | null {
  if (!facts.renewsOn) return null
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(facts.renewsOn)
  if (!m) return null
  const parsed = parseFloat((facts.priceLabel ?? '').replace(/[^0-9.]/g, ''))
  return {
    autoRenew:
      facts.autoRenew === true ? 'on' : 'off',
    endsOn: `${m[3]}-${m[1]}-${m[2]}`,
    price: Number.isFinite(parsed) ? parsed : 0,
  }
}
