import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { displayedProgressPct, resolveRenewal, timeRemainingText } from './learningPathsHomeUtil'
import { resolvePathCategories } from './progressGaugeUtil'

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
    timeRemaining,
  }
}
