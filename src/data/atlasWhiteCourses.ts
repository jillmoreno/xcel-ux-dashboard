/**
 * ERIC/ATLAS WHITE's ACTIVE COURSES (2026-10-12) — one list for the two places
 * that pick the course shown on White's Home: the left rail (Figma 312:1782)
 * and the Top Nav's "My Courses" dropdown (Figma 323:2001). The choice rides
 * the URL as `?whiteCourse=` (absent = the first course), so the header and
 * the page agree without sharing state.
 *
 * DEMO: the first course is the learner's real one (its title comes from the
 * page); the other two, and every expiry, are the designs' own.
 */
export const WHITE_COURSE_PARAM = 'whiteCourse'

export type WhiteCourse = { id: string; title: string; coverUrl: string; expires: string }

export const WHITE_FIRST_COURSE_ID = 'ny-life-health'

export const WHITE_COURSES: readonly WhiteCourse[] = [
  { id: WHITE_FIRST_COURSE_ID, title: 'Florida Life and Health Pre-licensing', coverUrl: '/courses/fl-life-health.webp', expires: '9 days' },
  { id: 'demo-ny-pc', title: 'Florida Life Property and Casualty', coverUrl: '/courses/fl-property-casualty.jpg', expires: '15 days' },
  // No cover in the design for this one: the Business Practices photo stands in.
  { id: 'demo-ny-edu', title: 'Florida Education Funding: A Guide for Insurance Producers', coverUrl: '/courses/fl-preferred-business-practices.jpg', expires: '42 days' },
]

/** `?whiteCourse=` → a known course id, else the first. */
export function whiteCourseFor(param: string | null): string {
  return WHITE_COURSES.some((c) => c.id === param) ? (param as string) : WHITE_FIRST_COURSE_ID
}
