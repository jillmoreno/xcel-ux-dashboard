/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE COURSE AXIS — which XCEL pre-licensing course the dashboard demos
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Added 2026-10-15 with the Demo Controls bar's Course dropdown.
 *
 *  ⚠ IT IS A SECOND AXIS, NOT A RENAME OF THE FIRST. The dashboard already
 *  carries a jurisdiction: `dashboard-education-type` picks the JOURNEY (CE
 *  renewal / qualifying education / exam prep) and the QE journey has demoed
 *  **New York** since 2026-09-16. Nothing here touches that — see
 *  `nyProducerRequirements.ts`, whose figures are confirmed against XCEL's own
 *  published page and must keep rendering exactly as they do.
 *
 *  What this axis answers is the question the rest of the dashboard was built
 *  around and never had a control for: **which pre-licensing COURSE is the
 *  learner taking?** Readiness, the Study Plan, the Compass content tree and
 *  the exam-prep band were all authored against Florida Life & Health, as a
 *  single hardcoded course. They are parameterized now, and Florida is simply
 *  the default value rather than the only one.
 *
 *  ── The two-letter code is the join ────────────────────────────────────────
 *  Every state-aware helper in this repo already keys on a two-letter
 *  jurisdiction code — `examFactsFor('FL')`, `jurisdictionName('NY')`,
 *  `governingAgencyFor('TX')`. A course resolves to one (`courseStateFor`), and
 *  that code is what gets threaded into them. The course id (`'fl'` / `'tx'`)
 *  is the FLAG's vocabulary; the state code is the DATA's. Keeping the two
 *  distinct is what lets the QE journey pass 'NY' through the same helpers
 *  without ever having a course id of its own.
 *
 *  ── Why its own file ───────────────────────────────────────────────────────
 *  `readinessFixtures.ts` keeps `READINESS_PICKER` beside its own fixtures, and
 *  that was the model. It does not fit here: the course picker is imported by
 *  Readiness, the study calendar, the progress profiles, the Compass rail AND
 *  the demo bar, so parking it in any one of those makes the other four import
 *  across a boundary that means nothing. This file owns the axis and holds no
 *  course CONTENT — the content stays in the fixture file that already owns its
 *  surface.
 */

/**
 * A course the dashboard can demo.
 *
 * ⚠ ADDING ONE IS NOT A ONE-LINE CHANGE, and the union is deliberately narrow
 * so the compiler says so. A third course needs: a state entry in
 * `EXAM_FACTS_BY_STATE`, `GOVERNING_AGENCY_BY_STATE`, `LICENSED_STEPS_BY_STATE`
 * and `JURISDICTION_NAMES` (`nyProducerRequirements.ts`), a readiness fixture,
 * a study calendar, a learning-path pair, an exam-prep profile and a Compass
 * TOC. Every one of those is a `Record<CourseId, …>`, so the build fails until
 * all of them exist rather than falling back to Florida at runtime.
 */
export type CourseId = 'fl' | 'tx'

/**
 * How the pre-licensing course content tree behaves — Phase 1 of the regulated
 * course rules (2026-10-15).
 *
 * ⚠ ONE RULE TODAY, AND MORE ARE COMING. Jillienne's brief is explicit that
 * this is phase 1 and further rules follow. That is why the mode is a NAMED
 * MODE rather than a boolean prop threaded into the rail: the next rule
 * (forced seat time, a chapter exam gate, whatever it turns out to be) extends
 * `applyCourseSequencing` below and reaches every surface at once, instead of
 * being a second conditional somewhere a reader has to find.
 *
 *   - `unregulated` — today's behaviour. Every item in Step 1 is open, in any
 *     order. This is the default, so a plain load of `main` is unchanged.
 *   - `regulated`   — Step 1's items unlock in sequence: the learner may open
 *     the next not-started item, and everything after it is locked.
 */
export type CourseSequencing = 'unregulated' | 'regulated'

/** The flag key. Named once so the bar, the hook and the tests cannot drift. */
export const COURSE_FLAG_KEY = 'dashboard-course-state'

/**
 * ⚠ FLORIDA, AND THAT IS THE WHOLE POINT OF THE DEFAULT. Every surface this
 * axis reaches was authored against Florida Life & Health, so `fl` means "what
 * the dashboard already showed". A plain load of `main` renders byte-identical
 * to the build before this branch; nothing moves until a reviewer picks Texas.
 */
export const DEFAULT_COURSE: CourseId = 'fl'

/** Unregulated for the same reason — it IS today's free navigation. */
export const DEFAULT_SEQUENCING: CourseSequencing = 'unregulated'

/** Course → the jurisdiction code every state-aware helper keys on. */
const COURSE_STATES: Record<CourseId, string> = {
  fl: 'FL',
  tx: 'TX',
}

/**
 * Course → its Learning Path id.
 *
 * The path id is how `studyCalendarFor` and `hasStudyCalendarFor` resolve a
 * plan, and how `learningFixtures` finds the path card — so re-pointing the
 * course re-points all three through this one map rather than through three
 * parallel conditionals.
 */
const COURSE_PATH_IDS: Record<CourseId, string> = {
  fl: 'xcel-fl-lh-prelicensing',
  tx: 'xcel-tx-lh-prelicensing',
}

/**
 * Course → its CONTINUING EDUCATION path id.
 *
 * ⚠ CE JOINED THE AXIS ON 2026-10-15, reversing the call made earlier the same
 * day. The first pass left CE on Florida, on the reasoning that a renewal
 * cycle is a different object from a pre-licensing course and a Texas one
 * would have to be invented wholesale. Both halves of that are still true —
 * and it made the control INERT ON HOME, which is the page a reviewer lands
 * on: Home's band resolves `ce` by default and `qe` (New York) on QE Focused,
 * so `exam-prep` was the only arm the axis touched and no version opens on it.
 * A control that does nothing where you first look is not a control.
 *
 * So the Texas renewal cycle is invented, and marked everywhere it lands. See
 * `XCEL_CE_TX` in `dashboardProgressFixtures.ts`.
 */
const COURSE_CE_PATH_IDS: Record<CourseId, string> = {
  fl: 'xcel-fl-lh-ce',
  tx: 'xcel-tx-lh-ce',
}

/**
 * The rows the Demo Controls bar's Course dropdown offers, in display order.
 *
 * Florida first because it is the default and the incumbent. The labels are
 * the PRODUCT's names — what XCEL sells — not the licence, the same call
 * `dashboardProgressFixtures` makes for the New York title.
 */
export const COURSE_PICKER: { course: CourseId; label: string }[] = [
  { course: 'fl', label: 'Florida Life & Health Pre-Licensing' },
  { course: 'tx', label: 'Texas Life & Health Pre-Licensing' },
]

/**
 * The sequencing rows, in display order — Unregulated first because it is the
 * default and today's behaviour.
 */
export const SEQUENCING_PICKER: { mode: CourseSequencing; label: string }[] = [
  { mode: 'unregulated', label: 'Unregulated' },
  { mode: 'regulated', label: 'Regulated' },
]

/** Normalise a flag variant to a course. Anything unrecognised is Florida. */
export function resolveCourse(variant: string | undefined): CourseId {
  return variant === 'tx' ? 'tx' : DEFAULT_COURSE
}

/** Normalise a flag SECONDARY variant to a sequencing mode. */
export function resolveSequencing(secondaryVariant: string | undefined): CourseSequencing {
  return secondaryVariant === 'regulated' ? 'regulated' : DEFAULT_SEQUENCING
}

/**
 * Is the course under regulated sequencing?
 *
 * ⚠ THE PLUMBING, DELIBERATELY SEPARATE FROM THE LOCK UI. This is the one
 * place that reads the flag's meaning; `applyCourseSequencing`
 * (`compassCourseFixtures.ts`, where the content tree lives) is the one place
 * that decides what that means for a content tree; `CompassCourseRail` only
 * knows how to DRAW a locked row. Phase 2's rules extend the middle one.
 */
export function isRegulatedCourse(secondaryVariant: string | undefined): boolean {
  return resolveSequencing(secondaryVariant) === 'regulated'
}

/** The two-letter jurisdiction for a course. */
export function courseStateFor(course: CourseId): string {
  return COURSE_STATES[course]
}

/** The Learning Path id for a course. */
export function coursePathIdFor(course: CourseId): string {
  return COURSE_PATH_IDS[course]
}

/** The picker label for a course — for the bar's pill and for test queries. */
export function courseLabelFor(course: CourseId): string {
  return COURSE_PICKER.find((c) => c.course === course)?.label ?? COURSE_PICKER[0].label
}

/** The CE path id for a course. */
export function courseCePathIdFor(course: CourseId): string {
  return COURSE_CE_PATH_IDS[course]
}

/**
 * Every course's path id, for the lookups that ask "is this one of ours?"
 * (`XCEL_PATHS_WITH_CALENDAR`, and anything like it that follows).
 */
export const COURSE_PATH_ID_LIST: readonly string[] = Object.values(COURSE_PATH_IDS)

/** The same, for the CE paths. */
export const COURSE_CE_PATH_ID_LIST: readonly string[] = Object.values(COURSE_CE_PATH_IDS)

/**
 * Is this one of XCEL's CE renewal paths?
 *
 * ⚠ A PREDICATE, NOT AN `=== XCEL_CE_PATH_ID` — 2026-10-15, when CE grew a
 * second course. Two surfaces gate on "is this the CE path" to suppress the CE
 * study plan when `ce-study-plan` is off (`PlatformShell`,
 * `LearnerFocusedBand`), and an equality check against the Florida id alone
 * would have let the Texas CE path straight through the gate — the flag would
 * work on one course and silently not on the other.
 */
export function isCoursePathCe(pathId: string | undefined): boolean {
  return pathId != null && COURSE_CE_PATH_ID_LIST.includes(pathId)
}
