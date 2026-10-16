import type { ProgressStage } from './AtlasCourseProgressStates'

/**
 * THE PROGRESS LADDER — one list, read by the demo control AND by Atlas Home
 * (2026-10-16, Jillienne: "as user progresses through the course progress
 * options, the 23 of 36 completed should update accordingly. also, add to the
 * progress dropdown for Prep Review Completed, Exam Simulators completed etc
 * to show the circles turning into checkmarks throughout the flow").
 *
 * ⚠ IT IS ONE LIST BECAUSE IT WAS THREE. The percentages lived in
 * `V3_PROGRESS`, the readiness bands in `V3_READINESS_FOR`, and the labels in
 * the flag catalog's `variants` — three places naming the same five states,
 * which is three chances for a rung to exist in one and not the others. The
 * flag's variants are BUILT from this now (`FeatureFlagContext`), so adding a
 * rung here adds it to the dropdown and nothing can list a state the Home
 * cannot draw.
 *
 * ⚠ WHAT A RUNG SAYS, AND WHAT IT CANNOT. `percent` is the ring. `readiness`
 * is the band the Readiness card opens on — and that map is the demo's
 * shorthand, flagged the day it was made: somebody can finish a course and
 * not be ready. `stepsDone` is how many of Step 1's rows carry the green
 * check. The LESSON COUNT is not here, because its total belongs to the
 * course path rather than to this ladder — `lessonsDoneFor` below derives it
 * from `percent` so the two can never state different things.
 *
 * ⚠ THE FIVE NEW RUNGS' PERCENTAGES ARE INVENTED, like the figures in
 * `nyProducerRequirements`. They are spaced to put the Lessons row's finish
 * at 80 and leave room for the four rows after it; nothing in the product
 * computes them. They are the one set of numbers here worth a second opinion.
 */
export type AtlasProgressRung = {
  /** The flag variant's value — the key every other surface stores. */
  key: string
  /** What the demo dropdown reads. */
  label: string
  /** The ring, and what `lessonsDoneFor` reads. */
  percent: number
  /** The Readiness card's band: 0 Beginner … 3 Ready. */
  readiness: number
  /** Eric's states card opens here. */
  stage: ProgressStage
  /**
   * How many of Step 1's rows are COMPLETE — counted from the Pre-Licensing
   * Lessons row down, because the Pre-course Affidavit above it is a row the
   * demo can switch off (`atlas-affidavit`) and a count that included it
   * would mean something different depending on a design control.
   */
  stepsDone: number
}

/**
 * The rungs, in order. The first five are the readiness ladder as it stood on
 * the morning of 2026-10-16; the five after `milestone` are Step 1's own
 * rows, which is what "Prep Review Completed, Exam Simulators completed etc"
 * asked for — each one checks off the row it names.
 *
 * ⚠ `completed` STAYS LAST AND STAYS "Ready 100%". It is the key the
 * completed view keys off (`completedView`), and it is stored in anyone's
 * `?ff=` pins and saved flag state, so renaming it would silently move those
 * to a state that no longer exists.
 */
export const ATLAS_PROGRESS_LADDER: readonly AtlasProgressRung[] = [
  { key: 'not-started', label: 'Not Started 0%', percent: 0, readiness: 0, stage: 'zero', stepsDone: 0 },
  { key: 'on-track', label: 'Beginner 14%', percent: 14, readiness: 0, stage: 'current', stepsDone: 0 },
  { key: 'developing', label: 'Developing 36%', percent: 36, readiness: 1, stage: 'current', stepsDone: 0 },
  { key: 'milestone', label: 'Proficient 75%', percent: 75, readiness: 2, stage: 'milestone', stepsDone: 0 },
  /* ⚠ 80 IS THE LESSON ROW'S FINISH LINE, and `lessonsDoneFor` reads it off
     this rung rather than holding a second copy — so moving this number
     moves where "36 of 36" is reached, and the four rungs below keep their
     order as long as they stay above it. */
  { key: 'lessons-done', label: 'Lessons Completed 80%', percent: 80, readiness: 2, stage: 'milestone', stepsDone: 1 },
  { key: 'prep-review-done', label: 'Prep Review Completed 86%', percent: 86, readiness: 3, stage: 'milestone', stepsDone: 2 },
  { key: 'simulators-done', label: 'Exam Simulators Completed 92%', percent: 92, readiness: 3, stage: 'milestone', stepsDone: 3 },
  { key: 'affidavit-done', label: 'Affidavit Signed 94%', percent: 94, readiness: 3, stage: 'milestone', stepsDone: 4 },
  { key: 'final-exam-done', label: 'Final Exam Passed 98%', percent: 98, readiness: 3, stage: 'milestone', stepsDone: 5 },
  /* Survey & Certificate is the sixth row, and finishing it IS the completed
     view — so it is this rung rather than a seventh. */
  { key: 'completed', label: 'Ready 100%', percent: 100, readiness: 3, stage: 'complete', stepsDone: 6 },
]

/** How many of Step 1's rows there are, from the Lessons row down. */
export const ATLAS_STEP1_ROWS = 6

export const ATLAS_PROGRESS_ORDER: readonly string[] = ATLAS_PROGRESS_LADDER.map((r) => r.key)

/** The rung a stored variant names, falling back to the first. */
export function atlasRungFor(key: string | undefined): AtlasProgressRung {
  return ATLAS_PROGRESS_LADDER.find((r) => r.key === key) ?? ATLAS_PROGRESS_LADDER[0]
}

/** The percent at which the Pre-Licensing Lessons row finishes. */
const LESSONS_END = ATLAS_PROGRESS_LADDER.find((r) => r.key === 'lessons-done')?.percent ?? 100

/**
 * How many of the course's lessons are done at this percent.
 *
 * ⚠ DERIVED, NOT TYPED — which is the whole point of the first half of the
 * ask. "Pre-Licensing Lessons (23 of 36 completed)" was the path fixture's
 * own figure and did not move when the demo's Progress did, so at 100% a
 * green check sat on a row saying 23 of 36, and at 0% a learner who had not
 * started had 23 lessons behind them. The TOTAL is still the path's; only
 * the count is the demo's.
 *
 * It reaches `total` exactly at the `lessons-done` rung and stays there, so
 * every rung above it draws a finished row under its check.
 */
export function lessonsDoneFor(percent: number, total: number): number {
  if (total <= 0) return 0
  const p = Math.max(0, Math.min(percent, LESSONS_END))
  return Math.min(total, Math.round((total * p) / LESSONS_END))
}

/**
 * A Step 1 row carries the lesson count when its title has the "x of y
 * completed" shape. Used to find that row rather than matching its wording,
 * which differs between the arms that rebuild their titles.
 */
export function isLessonRowTitle(title: string): boolean {
  return LESSON_COUNT.test(title)
}
const LESSON_COUNT = /^(.*\()(\d+) of (\d+)( completed\).*)$/

/**
 * A journey row's title with the demo's lesson count in it.
 *
 * ⚠ A DISPLAY TRANSFORM, not a change to the course path: the figures are the
 * fixture's and other surfaces read them. Only the COUNT moves — the total
 * stays whatever the path says, so a course with a different number of
 * lessons works unchanged — and a title without that shape passes through
 * exactly as it is.
 */
export function journeyTitleFor(title: string, percent: number): string {
  const m = title.match(LESSON_COUNT)
  if (!m) return title
  const total = Number(m[3])
  return `${m[1]}${lessonsDoneFor(percent, total)} of ${total}${m[4]}`
}
