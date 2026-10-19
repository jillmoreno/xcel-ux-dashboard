import { ADMIN_LEARNERS, type Learner } from './learners'

/**
 * XCEL ADMIN — THE INVITE FIXTURE (2026-10-19). Built FROM the roster, so
 * Invites and Students agree: every learner was an invite once. The 189
 * who are in the pipeline are Enrolled; the 9 still on an open invite split
 * as the reference's do — 3 Purchased (paid, not yet in the course), 2
 * Opened, 4 Sent — and the timing makes 2 of them Ready to resend (48+ hours
 * unopened or stuck) and the freshest Sent under 24 hours.
 */

export type InviteStatus = 'sent' | 'opened' | 'enrolled' | 'purchased'
export type InviteMethod = 'Email' | 'Link' | 'QR code'

export type Invite = {
  id: string
  name: string | null
  email: string
  status: InviteStatus
  /** Hours since the invite was sent (or last resent). */
  sentHoursAgo: number
  /** Hours since the last step (opened, enrolled), when there was one. */
  lastStepHoursAgo: number | null
  method: InviteMethod
  department: string
  /** The roster learner this invite became, when it did. */
  learnerId: string | null
}

const METHODS: InviteMethod[] = ['Email', 'Email', 'Email', 'Link', 'QR code']

function fromLearner(l: Learner, i: number): Invite {
  const open = l.stage === 'invite-open'
  // The open nine, in order: 3 purchased, 2 opened, 4 sent.
  const openIndex = open ? ADMIN_LEARNERS.filter((x) => x.stage === 'invite-open').indexOf(l) : -1
  let status: InviteStatus = 'enrolled'
  let sentHoursAgo = (l.enrolledDaysAgo + 2) * 24 + (i % 9)
  let lastStepHoursAgo: number | null = l.enrolledDaysAgo * 24 + (i % 7)
  if (open) {
    if (openIndex < 3) {
      status = 'purchased'
      sentHoursAgo = 6 + openIndex * 3
      lastStepHoursAgo = null
    } else if (openIndex < 5) {
      status = 'opened'
      // One opened 3 days ago and stuck (ready to resend); one opened today.
      sentHoursAgo = openIndex === 3 ? 76 : 20
      lastStepHoursAgo = null
    } else {
      status = 'sent'
      // Three sent under 24 hours; one sent 3 days ago and never opened.
      sentHoursAgo = openIndex === 8 ? 80 : 4 + (openIndex - 5) * 6
      lastStepHoursAgo = sentHoursAgo
    }
  }
  return {
    id: `inv-${l.id}`,
    name: l.name,
    email: l.email,
    status,
    sentHoursAgo,
    lastStepHoursAgo,
    method: METHODS[i % METHODS.length],
    department: l.team,
    learnerId: status === 'enrolled' ? l.id : null,
  }
}

export const ADMIN_INVITES: readonly Invite[] = ADMIN_LEARNERS.map(fromLearner).sort((a, b) => a.sentHoursAgo - b.sentHoursAgo)

/** Ready to resend: 48+ hours at Sent or Opened. */
export function isReady(inv: Invite) {
  return (inv.status === 'sent' || inv.status === 'opened') && inv.sentHoursAgo >= 48
}
/** Fresh: sent under 24 hours, not yet acted on. */
export function isFresh(inv: Invite) {
  return inv.status === 'sent' && inv.sentHoursAgo < 24
}
/** Accepted this week: enrolled or purchased within seven days. */
export function acceptedThisWeek(inv: Invite) {
  return (inv.status === 'enrolled' && (inv.lastStepHoursAgo ?? Infinity) <= 7 * 24) || inv.status === 'purchased'
}

export function hoursAgoDate(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000)
}
