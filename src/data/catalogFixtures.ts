// @deprecated — use `src/data/catalog/index.ts` and `getCatalogFixtures(brand)`.
// This shim re-exports a bundle's contents under the legacy names so
// pre-existing call sites (CourseSheet, MembershipSheet, PackageSheet,
// CourseDetailPage, tests) keep compiling. It re-exported CRE's, that being the
// LMS's default brand; it re-exports XCEL's now, which is the only one.

import { xcelBundle } from './catalog/xcel'

export type {
  Membership,
  Package,
  DeliveryMode,
  IndividualCourse,
  CourseSession,
  CourseModalityOption,
} from './catalog/types'
export { STATE_ABBR } from './catalog/types'

export const MEMBER_STATES = xcelBundle.memberStates
export const MEMBERSHIPS = xcelBundle.memberships
export const PACKAGES = xcelBundle.packages
export const INDIVIDUAL_COURSES = xcelBundle.individualCourses
export const TOTAL_RESULTS = xcelBundle.totalResults
