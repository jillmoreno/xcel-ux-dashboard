// @deprecated — use `src/data/catalog/index.ts` and `getCatalogFixtures(brand)`.
// This shim re-exports the CRE bundle's contents under the legacy names so
// pre-existing call sites (CourseSheet, MembershipSheet, PackageSheet,
// CourseDetailPage, tests) keep compiling during the multi-brand transition.

import { creBundle } from './catalog/cre'

export type {
  Membership,
  Package,
  DeliveryMode,
  IndividualCourse,
  CourseSession,
  CourseModalityOption,
} from './catalog/types'
export { STATE_ABBR } from './catalog/types'

export const MEMBER_STATES = creBundle.memberStates
export const MEMBERSHIPS = creBundle.memberships
export const PACKAGES = creBundle.packages
export const INDIVIDUAL_COURSES = creBundle.individualCourses
export const TOTAL_RESULTS = creBundle.totalResults
