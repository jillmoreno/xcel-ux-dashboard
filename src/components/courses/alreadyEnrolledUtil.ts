// Non-component helper for the Already-Enrolled / Manage Enrollment flow. Kept
// out of the component file so that file stays component-only (react-refresh).

import type { IndividualCourse } from '@/data/catalogFixtures'

/** True when a course carries at least one switchable dimension (a live course
 *  with multiple sessions, or a course offered in multiple modalities). Lets
 *  the CourseSheet decide whether to offer the "Manage Enrollment" switch flows
 *  (rendered in-panel by ManageEnrollmentPanel). */
export function courseHasEnrollmentSwitches(course: IndividualCourse | null): boolean {
  if (!course?.enrolled) return false
  const sessions = (course.sessions?.length ?? 0) > 1
  const modalities = (course.modalities?.length ?? 0) > 1
  return sessions || modalities
}
