/**
 * ─────────────────────────────────────────────────────────────────────────
 *  THE COURSE AXIS — which licence the dashboard demos
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Added 2026-10-15 with the Demo Controls bar's Course dropdown.
 *
 *  ⚠ IT STARTED AS A PRODUCT AXIS AND BECAME A JURISDICTION ONE, the same
 *  day, and the rewrite of this header is the record of why. It shipped as
 *  Florida vs Texas, with New York deliberately outside it because the
 *  qualifying journey's New York licence is the one set of figures in this
 *  repo confirmed against XCEL's published page. Holding it outside is what
 *  put "Get Licensed in New York" on a page whose Course pill read Florida.
 *
 *  So the axis is the LICENCE now, all three of them, and the rule that falls
 *  out of that is the one to hold on to: **every journey answers for every
 *  course.** The dashboard runs three journeys — CE renewal, qualifying
 *  education, exam prep (`dashboard-education-type`) — and if any one of them
 *  lacks an entry for the selected course it falls back to its own default,
 *  the page shows a jurisdiction the pill does not name, and the
 *  contradiction is back on a version nobody touched. `COURSE_PROFILES` in
 *  `dashboardProgressFixtures.ts` holds the nine, and a test walks them.
 *
 *  ⚠ WHAT THE AXIS IS NOT: a claim that XCEL sells all three in all three
 *  journeys. New York's CE cycle and exam-prep arm are INVENTED here so the
 *  control cannot lie; Texas is invented throughout. Only the New York
 *  qualifying licence is confirmed. Every invented figure is marked where it
 *  lands — see `nyProducerRequirements.ts`'s header for the standard.
 *
 *  ── The two-letter code is the join ────────────────────────────────────────
 *  Every state-aware helper in this repo already keys on a two-letter
 *  jurisdiction code — `examFactsFor('FL')`, `jurisdictionName('NY')`,
 *  `governingAgencyFor('TX')`. A course resolves to one (`courseStateFor`),
 *  and that code is what gets threaded into them. The course id (`'fl'`) is
 *  the FLAG's vocabulary; the state code (`'FL'`) is the DATA's.
 *
 *  ── Why its own file ───────────────────────────────────────────────────────
 *  `readinessFixtures.ts` keeps `READINESS_PICKER` beside its own fixtures,
 *  and that was the model. It does not fit here: the course picker is imported
 *  by Readiness, the study calendar, the progress profiles, the Compass rail
 *  AND the demo bar, so parking it in any one of those makes the other four
 *  import across a boundary that means nothing. This file owns the axis and
 *  holds no course CONTENT — the content stays in the fixture file that
 *  already owns its surface.
 */

/**
 * A course the dashboard can demo.
 *
 * ⚠ NEW YORK JOINED ON 2026-10-15, and it is the entry that changed what this
 * axis IS. Florida and Texas were two pre-licensing courses; New York was the
 * jurisdiction the QUALIFYING journey has demoed since 2026-09-16 and was
 * deliberately held outside the control. Holding it outside is what put
 * "Get Licensed in New York" on a page whose Course pill said Florida — the
 * control and the screen disagreeing in the same eyeful.
 *
 * So the axis is a JURISDICTION now, not a product line, and the rule that
 * follows is the important one: **every journey must have an entry for every
 * course.** A journey missing one falls back to its own default, the page
 * shows a different jurisdiction from the pill, and the contradiction is back.
 * `COURSE_PROFILES` in `dashboardProgressFixtures.ts` is where that is kept
 * honest, and a test walks all nine combinations.
 *
 * ⚠ ADDING ONE IS NOT A ONE-LINE CHANGE, and the union is deliberately narrow
 * so the compiler says so. A fourth course needs: a state entry in
 * `EXAM_FACTS_BY_STATE`, `GOVERNING_AGENCY_BY_STATE`, `LICENSED_STEPS_BY_STATE`
 * and `JURISDICTION_NAMES` (`nyProducerRequirements.ts`), a readiness fixture,
 * a study calendar, a learning path and a CE path, a Compass TOC, and a
 * profile for all THREE journeys. Every one of those is a
 * `Record<CourseId, …>`, so the build fails until they exist rather than
 * degrading to Florida at run time.
 */
export type CourseId = 'fl' | 'tx' | 'ny'

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
 * What the control can be set to: a course, or `auto`.
 *
 * ⚠ `auto` EXISTS BECAUSE NO SINGLE COURSE PRESERVES `main`, and finding that
 * out cost two wrong defaults in one day. The dashboard does not demo one
 * jurisdiction: the QUALIFYING journey has shown New York since 2026-09-16,
 * while CE and EXAM PREP have always shown Florida — and that split is a
 * decision with a test on it (`QeFocusedVersion.test.tsx`, "does NOT move the
 * Continuing Ed persona off Florida": switching the demo licence must not
 * silently switch jurisdiction on the versions that were not asking).
 *
 * So `fl` as the default changed the page every stakeholder lands on, and
 * `ny` changed Learner Focused's renewal cycle. `auto` changes neither: it
 * means "whatever this journey already resolved", which is exactly the
 * fallback `profileFor` has always done when handed no course.
 *
 * ⚠ AND IT IS WHY THE PILL READS "Automatic" RATHER THAN A JURISDICTION. A
 * pill naming one licence while another journey on the same build shows a
 * different one is the contradiction this whole axis exists to remove; under
 * `auto` the control names no jurisdiction, because it is not choosing one.
 */
/* ⚠ `auto` IS NO LONGER OFFERED — 2026-10-20. Everything above is the record
   of why it existed and is kept because it is also the record of what it
   cost: one control setting that resolved to a different licence depending on
   the version, which is the thing its removal fixes. It stays in the TYPE
   because a stored `auto` still arrives from reviewers' browsers and
   `resolveSelection` maps it to the new default.

   ⚠ AND IT NOTES THAT `fl` AS A DEFAULT WAS TRIED AND REJECTED on 2026-10-15
   — "`fl` as the default changed the page every stakeholder lands on, and
   `ny` changed Learner Focused's renewal cycle". Both objections are weaker
   now and that is why the call went the other way: the page every stakeholder
   lands on is the End-to-End family, which was ALREADY Florida, and Learner
   Focused is archived off the picker. What is left is Eric's versions moving
   NY → FL, which is the deliberate part. */
export type CourseSelection = CourseId | 'auto'

/**
 * ⚠ FLORIDA SINCE 2026-10-20, `auto` before it — Jillienne: "Course - i want
 * to remove automatic, and just set it to Florida as the default".
 *
 * ⚠ WHAT `auto` ACTUALLY DID WAS ANSWER DIFFERENTLY PER VERSION, which is the
 * case for removing it rather than a side effect of doing so. It meant "do
 * what you always did", and what each surface always did was not the same
 * thing: the End-to-End family forced Florida in `MembershipOverview` because
 * its invite flow sells a Florida course, while every other version fell
 * through to the journey's own profile and rendered NEW YORK. So one control
 * setting showed two different licences depending on which version you were
 * on, with nothing on screen saying so.
 *
 * ⚠ SO THIS FLIPS ERIC'S VERSIONS NY → FL — WIP, White, V2 and Atlas/Compass
 * Global Navigation. That is the point (one default course for the demo) and
 * it is a change to his surfaces, taken by Jillienne as the bar's owner.
 * Picking New York explicitly is one click and unchanged.
 */
export const DEFAULT_SELECTION: CourseSelection = 'fl'

/**
 * The course the DATA layer falls back to when nothing has chosen one.
 *
 * ⚠ FLORIDA, AND IT IS NOT THE CONTROL'S DEFAULT. This is the answer to "no
 * course was specified" for the fixtures that have always had exactly one —
 * Readiness, the Compass tree — and Florida is what they rendered before this
 * branch. The CONTROL's default is `auto`, which is a different question.
 */
export const DEFAULT_COURSE: CourseId = 'fl'

/** Unregulated for the same reason — it IS today's free navigation. */
export const DEFAULT_SEQUENCING: CourseSequencing = 'unregulated'

/** Course → the jurisdiction code every state-aware helper keys on. */
const COURSE_STATES: Record<CourseId, string> = {
  fl: 'FL',
  tx: 'TX',
  ny: 'NY',
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
  // The path the qualifying journey has used since 2026-09-16 — not a new one.
  ny: 'xcel-ny-producer-prelicensing',
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
  // ⚠ INVENTED, 2026-10-15. New York has no CE renewal cycle in this repo —
  // the qualifying journey is the only thing its licence has ever demoed. It
  // gets one so the axis is complete: every journey answers for every course,
  // or the pill and the page disagree on a version nobody touched.
  ny: 'xcel-ny-lh-ce',
}

/**
 * The rows the Demo Controls bar's Course dropdown offers, in display order.
 *
 * Florida first because it is the default and the incumbent. The labels are
 * the PRODUCT's names — what XCEL sells — not the licence, the same call
 * `dashboardProgressFixtures` makes for the New York title.
 */
export const COURSE_PICKER: { course: CourseSelection; label: string }[] = [
  /* ⚠ "Automatic" LED THIS LIST UNTIL 2026-10-20 and is gone — Jillienne:
     "Course - i want to remove automatic, and just set it to Florida as the
     default". THIS array is what the dropdown renders; the flag's `variants`
     are the catalog's copy of the same list, and both had to lose the row.
     Removing it from only one leaves the control offering a value its own
     catalog does not know, which is how a picker ends up with a row that
     ticks nothing. See `DEFAULT_SELECTION` for what Automatic actually did.

     ⚠ FLORIDA FIRST NOW, because it is the default and a picker whose first
     row is not its default reads as though something else has been chosen. */
  { course: 'fl', label: 'Florida Life & Health Pre-Licensing' },
  /* Then New York: the incumbent, the licence the qualifying journey demoed
     from 2026-09-16 until today, and the only one here whose figures are
     confirmed against XCEL's published page. */
  { course: 'ny', label: 'New York Life & Health Pre-Licensing' },
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

/** Normalise a flag variant to a selection. Anything unrecognised is `auto`. */
export function resolveSelection(variant: string | undefined): CourseSelection {
  /* ⚠ `auto` FALLS HERE DELIBERATELY. It was the committed default until
     2026-10-20 and is sitting in `cgp.featureFlags` in every browser that has
     opened the demo; it is no longer offered, so it resolves to the new
     default like any unknown value. Without that those machines would tick no
     row in the Course picker. */
  return variant === 'tx' || variant === 'fl' || variant === 'ny' ? variant : DEFAULT_SELECTION
}

/**
 * The CHOSEN course, or `undefined` under `auto`.
 *
 * ⚠ `undefined` IS THE WHOLE MECHANISM, not a missing value. Every data
 * function on this axis takes an optional course and falls back to what it
 * resolved before the control existed — `profileFor` to the journey's own
 * profile, Readiness and the Compass tree to `DEFAULT_COURSE`. Passing
 * `undefined` is therefore "do what you always did", which is what `auto`
 * means, and it needs no second code path to maintain.
 */
export function chosenCourse(selection: CourseSelection): CourseId | undefined {
  return selection === 'auto' ? undefined : selection
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

/** The picker label for a selection — for the bar's pill and for test queries. */
export function courseLabelFor(selection: CourseSelection): string {
  return COURSE_PICKER.find((c) => c.course === selection)?.label ?? COURSE_PICKER[0].label
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

/* ─── The ACCESS WINDOW axis ──────────────────────────────────────────────
 *
 * How many days of course access are left — 2026-10-15, the direct ask: "a
 * demo selector for a course to expire in 1 day, 7 days, 15 days, 30 days,
 * 90 days, 120 days, 400 days."
 *
 * ⚠ A SECOND AXIS ON THE COURSE, NOT A COURSE. It changes nothing about WHICH
 * licence is demoed; it moves the one date every expiry-shaped surface reads —
 * the header's "Course Access Ends", the Study Pace's ceiling, and the Jump
 * Back In card's expiring-soon badge. Kept here beside `CourseSelection`
 * because both are properties of the course the dashboard is showing and the
 * demo bar imports them together.
 *
 * ⚠ THE SPREAD IS CHOSEN TO CROSS EVERY THRESHOLD, which is what makes it a
 * demo control rather than a date picker. `courseExpiry.ts` warns inside
 * `DEFAULT_WARN_DAYS` (60) clamped to half the enrolment window, so 1 / 7 / 15
 * land in the badge and 30 / 90 / 120 / 400 do not; 1 day is short enough that
 * no honest study pace fits, which is the `state: 'no'` branch the pace card
 * otherwise only reaches on one persona. 400 is past a year, where the
 * countdown has to read as a date rather than a sprint.
 */
export type ExpirySelection = 'auto' | number

/** The flag key for the access-window axis. */
export const EXPIRY_FLAG_KEY = 'dashboard-course-expiry'

/**
 * ⚠ THIRTY DAYS SINCE 2026-10-20, `auto` before it — Jillienne: "lets have it
 * default to 30 Days. remove the 'automatic' concept", the same pass that
 * took Automatic off the Course axis.
 *
 * ⚠ BUT `auto` MEANT SOMETHING DIFFERENT HERE, and the difference is the cost
 * of this change rather than the case for it. On Course, Automatic resolved
 * to a different licence per VERSION and was an inconsistency. Here it was
 * doing real work: each generic Progress state authors its own window — On
 * Track 29 days, At Risk 3, Off Track its deliberately unreachable 11 — and
 * those are stories somebody wrote. A day count as the default overwrites all
 * three, which is what the note this replaces warned about.
 *
 * ⚠ SO AT RISK IS NO LONGER AT RISK unless Expires is set by hand, and 3 is
 * not one of the rows offered (1 · 7 · 15 · 30 · 90 · 120 · 400) — 7 is the
 * nearest. Accepted deliberately: the generic Progress states only draw on
 * versions outside the Atlas ladder, which is two of the six on the picker
 * (Atlas/Compass Global Navigation and Eric/Atlas V2), and the demo everyone
 * lands on was already a thirty-day window.
 *
 * ⚠ THIRTY IS ALSO WHAT THE ATLAS HOME ALREADY DERIVED at 0% — its
 * `ZERO_ACCESS_DAYS`, added 2026-10-19 so the meta, the count and the pace
 * model read one window. Measured both ways before the change: `auto` and an
 * explicit 30 both render "06/10/2026, 30 days to complete".
 */
export const DEFAULT_EXPIRY: ExpirySelection = 30

/** The rows the bar offers, in display order. */
export const EXPIRY_PICKER: { value: ExpirySelection; label: string }[] = [
  /* ⚠ "Automatic" LED THIS LIST UNTIL 2026-10-20 — see `DEFAULT_EXPIRY` for
     what it did and what removing it costs. As with the Course axis, the row
     lives in TWO places: here (what the dropdown renders) and the flag's
     `variants` (the catalog's copy). Both lose it, or the control offers a
     value its own catalog does not know. */
  { value: 1, label: '1 day' },
  { value: 7, label: '7 days' },
  { value: 15, label: '15 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 120, label: '120 days' },
  { value: 400, label: '400 days' },
]

/** Normalise a flag variant to a selection. Anything unrecognised is `auto`. */
export function resolveExpiry(variant: string | undefined): ExpirySelection {
  /* ⚠ `auto` LANDS HERE NOW, with every other unrecognised value. It was the
     committed default until 2026-10-20 and is in `cgp.featureFlags` on every
     machine that has opened the demo — `Number('auto')` is NaN, which no row
     matches, so it resolves to the new default and the picker ticks 30 days
     rather than nothing. */
  const n = Number(variant)
  return EXPIRY_PICKER.some((o) => o.value === n) ? n : DEFAULT_EXPIRY
}

/**
 * The chosen day count, or `undefined` under `auto`.
 *
 * Same mechanism as `chosenCourse`: `undefined` means "resolve what you always
 * resolved", so no consumer needs a second code path.
 */
export function chosenExpiryDays(selection: ExpirySelection): number | undefined {
  return selection === 'auto' ? undefined : selection
}

/** The picker label for a selection — the bar's pill, and test queries. */
export function expiryLabelFor(selection: ExpirySelection): string {
  return EXPIRY_PICKER.find((o) => o.value === selection)?.label ?? EXPIRY_PICKER[0].label
}
