import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { displayedProgressPct, resolveRenewal, timeRemainingText } from './learningPathsHomeUtil'
import { resolvePathCategories } from './progressGaugeUtil'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { getCourseImage } from '@/utils/courseImage'
import { NY_LH_COURSE_IMAGE } from '@/data/nyProducerRequirements'

/** The path whose course art is authored — see the cover note below. */
const NY_PRELICENSING_PATH_ID = 'xcel-ny-producer-prelicensing'

/**
 * The course the Compass chrome is ABOUT — title, percentage and lesson counts.
 *
 * The launcher gets these handed to it by whichever card opened it
 * (`LaunchedCourseMeta`, and its note explains why they cannot be derived from
 * a course id). The TOP NAV has no such card: Compass Learning is a
 * destination, not a resume action, so the figures have to come from the same
 * place Home reads.
 *
 * ⚠ THE PERSONA'S PATH, NOT `activePathIdFor` — the trap `StudyPlanSection`
 * documents at length. `activePathIdFor` is always the first path, so with
 * Education on Continuing Ed the sidebar would name the CE course while Home
 * named the pre-licensing one. It stays only as the fallback for a brand or
 * education type with no persona.
 *
 * ⚠ `displayedProgressPct`, NOT `path.progressPct` — the base fixture ignores
 * the demo persona's override, so the sidebar and Home would state two
 * different percentages for one course.
 */
export function useCompassCourseFigures(): {
  title: string
  percentComplete: number
  completedLessons: number
  totalLessons: number
  /** Cover art for the sidebar's course. `undefined` when the brand has no
   *  in-progress course to take one from. */
  cover?: string
  /** "17 days" — the same figure Home's course card prints. */
  timeRemaining: string
} {
  const { brand } = useAccount()
  const progressVariant = useFeatureFlag('dashboard-progress-state').variant ?? 'progress-on-track'
  const educationType = (useFeatureFlag('dashboard-education-type').variant ?? 'ce') as 'ce' | 'qe'
  const persona = dashboardProgressPersonaFor(brand, progressVariant, educationType)
  const paths = learningPathsFor(brand)
  /*
   * ⚠ THE PERSONA'S PATH OBJECT, TAKEN WHOLE — never looked up in `paths`
   * first. This validated it against `learningPathsFor(brand)` for one commit
   * and named the WRONG COURSE: with Education on Pre-Licensing the sidebar
   * read "Florida Life & Health CE" while Home, two clicks away, read "New
   * York Life and Health Pre-licensing".
   *
   * The reason is structural, and `LaunchedCourseMeta` already records it — a
   * persona's path is an OVERRIDE and is not in `learningPathsFor(brand)` at
   * all, so the membership test can only ever fail. `StudyPlanSection` does
   * run that test, but it is resolving an ID to look a plan up with; this
   * needs the object itself, which is the one Home renders.
   */
  /*
   * ⚠ THE BRAND'S ACTIVE PATH FIRST, THE PERSONA SECOND — and this took two
   * wrong turns to land on, both of which named a DIFFERENT course from the
   * one Home was naming three feet away.
   *
   *   1. `persona.path` alone gave "Florida Life & Health CE" at 63%, because
   *      the Education control defaults to `ce` and the persona follows it.
   *   2. `myCoursesFor(...)`'s in-progress record gave "Life & Health
   *      Pre-License Course" at 50% — the My Courses row, a third title again.
   *
   * What Home's CURRENT COURSE card actually shows is the brand's ACTIVE path:
   * "New York Life and Health Pre-licensing" at 62%, which is also what the
   * Figma's sidebar names. So that is what this reads, with the persona's own
   * path as the fallback for a brand whose active id resolves to nothing.
   *
   * ⚠ THE TEST THAT MATTERS is not "does this return something" — all three
   * attempts did — but "does it match Home". Two surfaces naming two courses
   * reads as a bug to a learner, never as two facts.
   */
  const path =
    paths.find((p) => p.id === activePathIdFor(brand)) ?? persona?.path ?? paths[0]
  /* ⚠ `resolveRenewal` + `timeRemainingText`, NOT a second arithmetic. That
     pair was EXTRACTED for exactly this reason — its own note records the
     course header band becoming the second surface to print the figure, and
     that "two components resolving one fact is how they come to disagree".
     This is the third surface. */
  const { weeksLeft } = resolveRenewal(persona?.renewal)
  const timeRemaining = timeRemainingText(weeksLeft)
  if (!path)
    return { title: '', percentComplete: 0, completedLessons: 0, totalLessons: 0, timeRemaining }
  /*
   * ⚠ THE COVER COMES OFF THE SAME `path` THE TITLE DOES. Two earlier attempts
   * pictured a different course from the one they named:
   *
   *   1. `myCoursesFor(brand)`'s in-progress record → a house photo.
   *   2. `persona.path.jumpBackIn` → `8.webp`, because the persona follows the
   *      Education control while the title follows the brand's ACTIVE path.
   *
   * Home shows `ny-life-health.webp`, which is the active path's own
   * `jumpBackIn`. Taking both from `path` is what makes them agree by
   * construction rather than by coincidence.
   *
   * The in-progress record stays as the fallback for a path with no
   * jump-back-in course.
   */
  /*
   * ⚠ THE COVER IS AUTHORED AGAINST THE COURSE, NOT THE PATH — and finding that
   * out cost three wrong answers, so it is written down here.
   *
   * The title comes from the active PATH, and path fixtures carry no art at
   * all: `xcel-ny-producer-prelicensing` has no `imageUrl` and no `jumpBackIn`.
   * So every attempt to derive the cover from the path fell through to a
   * fallback and pictured a different course from the one it named —
   * `myCoursesFor`'s in-progress record (a house photo), then
   * `persona.path.jumpBackIn` (`8.webp`, because the persona follows the
   * Education control while the title follows the active path), then the path
   * summaries (no `jumpBackIn` either).
   *
   * What Home renders is `NY_LH_COURSE_IMAGE`, which `dashboardProgressFixtures`
   * puts on all three of the XCEL QE persona's jump-back-in slots. It is the
   * image authored FOR this course, so naming it directly is the honest
   * version of what the derivations were groping for.
   *
   * ⚠ KEYED ON THE PATH ID so it stays a statement about THIS course rather
   * than a default. Any other path keeps the in-progress record's art, which is
   * the generic stock pool — right until path fixtures carry covers of their
   * own, at which point this whole branch should go.
   */
  const resume = myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')
  const cover =
    path.id === NY_PRELICENSING_PATH_ID
      ? NY_LH_COURSE_IMAGE
      : resume
        ? (resume.imageUrl ?? getCourseImage(resume.id))
        : undefined
  const cats = resolvePathCategories(path)
  const completedLessons = cats.reduce((sum, c) => sum + c.completed, 0)
  const required = cats.reduce((sum, c) => sum + c.required, 0)
  return {
    title: path.title,
    percentComplete: displayedProgressPct(path),
    completedLessons,
    /* `|| path.hours` mirrors the Jump Back In card: a path with no resolved
       categories still has to report a denominator, or the contents tree
       divides by zero. */
    totalLessons: required || path.hours,
    cover,
    timeRemaining,
  }
}
