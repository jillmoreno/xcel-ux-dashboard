import type { CourseExpiryState } from '@/data/courseExpiry'

/**
 * Resolution + copy for the cover status badge. Split from
 * `CourseStatusBadge.tsx` because a module that exports both components and
 * plain functions breaks fast refresh — the same split as
 * `renewalStatePresentation.tsx` / `renewalStateStyles.ts`.
 */
export type CourseStatusBadgeState = 'completed' | 'expiring-soon' | 'expired' | 'failed'

/**
 * Which badge a card shows, or `null` for none.
 *
 * ⚠ RESOLUTION ORDER IS LOAD-BEARING: failed → expired → expiring-soon →
 * completed. At most one badge ever renders. `completed` sits last not because
 * it matters least but because by the time we reach it the expiry arms are
 * already impossible — `courseExpiryState` returns `'none'` for a completed
 * course (ruling 5), so the two can never compete.
 *
 * `archived` contributes NOTHING here, and that is the whole of decision 33: an
 * archived failed course keeps its Failed badge. Archiving is a location, so it
 * is not a parameter of this function and must not become one.
 */
export function resolveStatusBadge(
  status: 'not-started' | 'in-progress' | 'completed' | 'failed' | undefined,
  expiryState: CourseExpiryState,
): CourseStatusBadgeState | null {
  if (status === 'failed') return 'failed'
  if (expiryState === 'expired') return 'expired'
  if (expiryState === 'expiring-soon') return 'expiring-soon'
  if (status === 'completed') return 'completed'
  return null
}

/**
 * Badge copy. `daysLeft` is only read by the expiring-soon arm.
 *
 * ⚠ THE EXPIRING-SOON LABEL IS `{n} Days to Complete`, NOT "Expires in {n}
 * Days" — CONFIRMED 2026-09-05, after the slice-1 build prompt asked for the
 * latter. This is settled, not an open question: do not "restore" the other
 * string on the strength of that prompt.
 *
 * Spec §4a ruling 1 and §6, and it is deliberate twice over. The badge must
 * lead with the heavier consequence — losing the chance to earn the credit, not
 * losing the content. And "expires" belongs to the two OTHER clocks a learner
 * is under (a licence renewal, and a credit-reporting deadline), which the
 * Learning Path and membership surfaces already own that word for; a bare
 * "Expires in 12 days" on a course card gets read against the wrong one.
 * "Days to Complete" is a phrase only the course clock can say, and it echoes
 * the courses table's own `Days to Complete` column. §4a lists
 * "Expires in 79 Days" as the exact string this replaces.
 *
 * Pinned by `CourseExpiry.test.ts`, so a revert fails a test rather than
 * shipping quietly.
 */
export function statusBadgeLabel(state: CourseStatusBadgeState, daysLeft?: number): string {
  if (state === 'expiring-soon') {
    const n = Math.max(1, Math.round(daysLeft ?? 0))
    return `${n} ${n === 1 ? 'Day' : 'Days'} to Complete`
  }
  if (state === 'expired') return 'Expired'
  if (state === 'failed') return 'Failed'
  return 'Completed'
}
