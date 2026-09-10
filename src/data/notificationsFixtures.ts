import type { AlertTone } from '@/components/ui/alertTones'
import type { Brand } from '@/context/AccountContext'

/**
 * The notification centre's data — what sits behind the header bell.
 *
 * ## A notification is not a toast, and that distinction is the whole model
 *
 * Both render the same card (see [`alertTones`](../components/ui/alertTones.ts)),
 * which is why the Figma draws them as one component and why it is easy to
 * conclude they are one thing. They are not:
 *
 * - A **toast** is feedback on something YOU JUST DID. "Statement saved."
 *   "Enrollment confirmed." It is transient because its job ends the moment
 *   you have seen it — you already knew, you are just being told it worked.
 * - A **notification** is a record of something that happened TO YOU WHILE
 *   YOU WERE NOT LOOKING. Your instructor replied. Three tasks went overdue.
 *   Your licence expires in six weeks. It is durable because the learner has
 *   not seen it yet, and might not for days.
 *
 * **Only the second kind belongs in the bell.** Pipe the toast stream into it
 * and within a session it fills with "Statement saved" — a list of things the
 * learner already acknowledged, which is how a notification centre becomes
 * the thing nobody opens twice. `raisesToast` marks the overlap: an event may
 * legitimately do both (a certificate is issued → toast now, and it is still
 * there tomorrow), but the default is one or the other.
 *
 * ## Timestamps are anchored, like every other fixture here
 *
 * Ages are authored in HOURS BEFORE `NOTIFICATIONS_NOW`, not as literal dates.
 * A hardcoded date would age into "8 months ago" and make the whole list read
 * as abandoned; a relative offset renders "2h ago" forever. Same reason
 * `FIXTURE_TODAY` and `STUDY_CALENDAR_TODAY` exist, arrived at from the other
 * direction.
 */

/** The clock this list is told against. Matches `FIXTURE_TODAY` (2026-05-11),
 *  the app-wide anchor, at mid-morning so "3h ago" is still the same day. */
export const NOTIFICATIONS_NOW = new Date(2026, 4, 11, 10, 30)

/**
 * What a notification is ABOUT — the axis the preferences switch on.
 *
 * **Deliberately not the tone.** "3 tasks are overdue" and "your licence
 * renews in 45 days" are both `warning`, and a learner plainly wants to mute
 * the first without muting the second: one is study nagging, the other is a
 * state deadline. Tone is how a notification LOOKS; category is what it is
 * about, and only the second is a thing anybody would want a switch for.
 *
 * Keeping them separate also means the preferences cannot silently re-colour
 * the feed — a category can gain a tone, or lose one, without touching this.
 */
export type NotificationCategory =
  | 'study-plan'
  | 'readiness'
  | 'licence'
  | 'messages'
  | 'offers'

export type NotificationChannel = 'in-app' | 'email'

export type NotificationCategoryDef = {
  id: NotificationCategory
  label: string
  description: string
  /**
   * True ⇒ the IN-APP switch is locked on.
   *
   * Only `licence` is. A learner who mutes their renewal deadline and then
   * misses it has a real-world problem — a lapsed licence, a state late fee —
   * that no other category here can cause. This is the one place the product
   * is entitled to overrule the preference, and saying so in the sheet is
   * better than quietly ignoring the toggle.
   *
   * The EMAIL switch stays adjustable even here: "do not email me" is a
   * reasonable ask about a channel; "never tell me at all" is the one being
   * refused.
   */
  requiredInApp?: boolean
}

/**
 * The five categories, in the order the sheet lists them: the two about the
 * work, then the one that is compliance, then the two that are other people
 * talking to you. Offers is last because it is the one most people are
 * looking for the switch for.
 */
export const NOTIFICATION_CATEGORIES: NotificationCategoryDef[] = [
  {
    id: 'study-plan',
    label: 'Study plan',
    description: 'Tasks due, overdue nudges, and pacing against your exam date.',
  },
  {
    id: 'readiness',
    label: 'Exam readiness',
    description: 'Practice and simulator results, and changes to your readiness score.',
  },
  {
    id: 'licence',
    label: 'Licence & renewals',
    description: 'CE hour totals and state renewal deadlines.',
    requiredInApp: true,
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Replies from your instructor or support.',
  },
  {
    id: 'offers',
    label: 'Offers & promotions',
    description: 'Discounts on packages and renewal bundles.',
  },
]

/** Channel × category, as the sheet holds it. */
export type NotificationPrefs = Record<
  NotificationCategory,
  Record<NotificationChannel, boolean>
>

/**
 * Everything on by default, which is what the shipped product does and what
 * makes the sheet demonstrate anything — a reviewer opening a sheet of
 * already-off switches learns nothing about the control.
 */
export function defaultNotificationPrefs(): NotificationPrefs {
  return Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((c) => [c.id, { 'in-app': true, email: true }]),
  ) as NotificationPrefs
}

/**
 * The feed, with muted categories removed.
 *
 * **The in-app switches really filter this list**, and that is the point
 * rather than a flourish: the Preferences card that stood here before said
 * "not designed yet" precisely so it would not ship toggles that control
 * nothing — the Membership Plan card's defect. Wiring them to the feed is
 * how that promise gets kept rather than reversed.
 *
 * A `requiredInApp` category is never filtered, whatever the stored value
 * says. The switch is locked in the UI, so the two can only disagree if a
 * stale value is loaded, and the answer then is still "show it".
 */
export function visibleNotifications(
  items: Notification[],
  prefs: NotificationPrefs,
): Notification[] {
  const required = new Set(
    NOTIFICATION_CATEGORIES.filter((c) => c.requiredInApp).map((c) => c.id),
  )
  return items.filter(
    (n) => required.has(n.category) || prefs[n.category]?.['in-app'] !== false,
  )
}

export type NotificationId = string

export type Notification = {
  id: NotificationId
  /** Drives the card's border, glyph and accessible tone word. */
  tone: AlertTone
  /** What it is ABOUT — the axis the preferences switch on. See the type. */
  category: NotificationCategory
  title: string
  body: string
  /** Hours before `NOTIFICATIONS_NOW`. Authored, not derived — see above. */
  hoursAgo: number
  read: boolean
  /** Where the row goes when clicked. In-app only — a notification promises
   *  it is about YOUR account, so it must not leave for a marketing site. */
  href?: string
  /** Label for the primary CTA. Omitted ⇒ the whole row is the affordance,
   *  which is the default: most notifications have exactly one destination
   *  and a button beside a clickable row is the same door twice. */
  actionLabel?: string
  /** For `message` — who it is from, shown above the body. */
  from?: string
  /**
   * True when this event ALSO fires a transient toast at the moment it
   * happens. Documentation rather than behaviour today (nothing in the demo
   * generates events live), but it is the field that stops the two systems
   * being conflated the next time someone wires one up.
   */
  raisesToast?: boolean
}

/**
 * XCEL's learner notifications — Alicia Navarro, Florida 2-15 Life & Health.
 *
 * The content is XCEL's own, not the Figma's. The design ships lorem ipsum
 * and a real-estate promo; what a notification centre is actually judged on
 * is whether the eight things in it are the eight things this learner would
 * care about, and lorem cannot answer that. Ordered newest first — the list
 * renders in array order, so this is the order, not a sort key.
 */
const XCEL_NOTIFICATIONS: Notification[] = [
  {
    id: 'tasks-overdue',
    category: 'study-plan',
    tone: 'warning',
    title: '3 study tasks are overdue',
    body: 'Chapters 6 and 7 were due Friday. Your plan still gets you to exam day if you clear them this week.',
    hoursAgo: 2,
    read: false,
    href: '/dashboard-rebrand?section=study-plan',
    actionLabel: 'Open Study Plan',
  },
  {
    id: 'instructor-reply',
    category: 'messages',
    tone: 'message',
    title: 'Re: Annuity suitability question',
    body: 'Good question — suitability is judged at the point of sale, so the answer turns on what the client disclosed then. I have added a short note to Chapter 7.',
    from: 'Dana Whitfield, Instructor',
    hoursAgo: 5,
    read: false,
  },
  {
    id: 'readiness-moved',
    category: 'readiness',
    tone: 'info',
    title: 'Your exam readiness moved to 64%',
    body: 'Two more chapters answered correctly. Health insurance basics is still your weakest section.',
    hoursAgo: 20,
    read: false,
    href: '/dashboard-rebrand?section=readiness',
    actionLabel: 'See what to review',
  },
  {
    id: 'simulator-scored',
    category: 'readiness',
    tone: 'success',
    title: 'Exam Simulator 2 scored 78%',
    body: 'Above the 70% pass mark. Your review list has been updated with the questions you missed.',
    hoursAgo: 26,
    read: true,
    href: '/dashboard-rebrand?section=readiness',
    raisesToast: true,
  },
  {
    id: 'licence-expiring',
    category: 'licence',
    tone: 'warning',
    title: 'Your Florida licence renews in 45 days',
    body: 'You have 6 of 24 required CE hours. Renewals filed after the deadline carry a state late fee.',
    hoursAgo: 52,
    read: true,
    href: '/dashboard-rebrand?section=courses',
  },
  {
    id: 'certificate-ready',
    category: 'licence',
    tone: 'success',
    title: 'Certificate ready — Ethics for Insurance Professionals',
    body: 'Your completion certificate has been filed and is ready to download.',
    hoursAgo: 74,
    read: true,
    href: '/dashboard-rebrand?section=certificates',
    actionLabel: 'View certificate',
    raisesToast: true,
  },
  {
    id: 'ce-promo',
    category: 'offers',
    tone: 'promo',
    title: '20% off your CE renewal package',
    body: 'Renewal season pricing on the Florida 2-15 CE bundle. Use code RENEW20 at checkout before 06/30/2026.',
    hoursAgo: 98,
    read: true,
    href: '/dashboard-rebrand?section=catalog',
    actionLabel: 'Browse CE packages',
  },
  {
    id: 'attempt-not-saved',
    category: 'readiness',
    tone: 'error',
    title: "We couldn't save your last practice attempt",
    body: 'Your connection dropped partway through Practice Exam 1. Nothing was scored, and the attempt does not count against you.',
    hoursAgo: 120,
    read: true,
    href: '/dashboard-rebrand?section=readiness',
    raisesToast: true,
  },
]

/**
 * Demo states for the `notification-state` flag. The bell's whole visual
 * argument is the unread badge, so the states are about UNREAD COUNT rather
 * than about content — swapping the eight items per state would be authoring
 * four lists to demonstrate one control.
 *
 * `empty` is here because it is the state a new learner actually sees, and an
 * empty state is the half of a notification centre that never gets designed.
 */
export type NotificationState = 'unread' | 'all-read' | 'empty'

export const NOTIFICATION_PICKER: { value: NotificationState; label: string }[] = [
  { value: 'unread', label: 'Unread · 3' },
  { value: 'all-read', label: 'All caught up' },
  { value: 'empty', label: 'Nothing yet' },
]

/**
 * The list for a brand in a given demo state.
 *
 * Takes `brand` it does not branch on today, deliberately: every other fixture
 * in `src/data` is brand-keyed, and a notification list is obviously
 * brand-specific content (these are Florida insurance notifications). Taking
 * the parameter now means adding a brand is an edit here rather than a
 * signature change at every call site — the same seam the one-member `Brand`
 * union exists to hold open.
 */
export function notificationsFor(
  brand: Brand,
  state: NotificationState = 'unread',
): Notification[] {
  void brand
  if (state === 'empty') return []
  if (state === 'all-read') return XCEL_NOTIFICATIONS.map((n) => ({ ...n, read: true }))
  return XCEL_NOTIFICATIONS
}

export function unreadCount(items: Notification[]): number {
  return items.filter((n) => !n.read).length
}

/**
 * "2h ago" / "Yesterday" / "May 6" — the age of a notification, told against
 * the anchored clock.
 *
 * Deliberately coarse. A notification centre that says "2 hours and 14
 * minutes ago" is answering a question nobody asked; what the learner is
 * sorting on is "today / not today / a while back".
 */
export function formatAge(hoursAgo: number, now: Date = NOTIFICATIONS_NOW): string {
  if (hoursAgo < 1) return 'Just now'
  if (hoursAgo < 24) return `${Math.round(hoursAgo)}h ago`
  const days = Math.floor(hoursAgo / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const then = new Date(now.getTime() - hoursAgo * 3600_000)
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * The badge's text. Caps at "9+" — past a point the exact number stops being
 * information and starts being a scold, and the badge is 18px wide.
 */
export const UNREAD_BADGE_CAP = 9

export function unreadBadgeLabel(count: number): string {
  return count > UNREAD_BADGE_CAP ? `${UNREAD_BADGE_CAP}+` : String(count)
}
