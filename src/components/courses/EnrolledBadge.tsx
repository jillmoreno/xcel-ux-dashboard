import type { CSSProperties } from 'react'
import { CircleCheck } from '@/icons'
import { CoverPill } from './CoverPill'

/**
 * "Enrolled" ownership pill — a green success chip shown on a course the learner
 * already holds. Two placements:
 *   • `overlay` — absolutely positioned top-left over a course-card cover image.
 *   • `inline`  — sits in flow (e.g. replacing the price slot in the Course
 *     Details sheet).
 *
 * Ownership is member-scoped by construction: a non-member is never "enrolled", so
 * callers gate on the resolved commerce state being `included` (see
 * IndividualCourseCard / CourseSheet).
 *
 * The pill chrome moved to `CoverPill` (2026-09-05) so this and
 * `CourseStatusBadge` can't drift — they occupy the same corner of the same kind
 * of card. Rendering is unchanged: `CoverPill` carries this component's exact
 * geometry, and the success tones are passed in below.
 *
 * COLLISION NOTE: `CourseStatusBadge` also takes cover top-left, but on
 * `CourseCard` (owned) while this one is on `IndividualCourseCard` (catalog).
 * They cannot co-occur today. Don't "fix" that by moving either — just never add
 * a second overlay to that corner.
 */
export function EnrolledBadge({
  placement = 'inline',
  style,
}: {
  placement?: 'overlay' | 'inline'
  style?: CSSProperties
}) {
  return (
    <CoverPill
      Icon={CircleCheck}
      bg="var(--color-success-100)"
      fg="var(--color-success-700)"
      placement={placement}
      style={style}
    >
      Enrolled
    </CoverPill>
  )
}
