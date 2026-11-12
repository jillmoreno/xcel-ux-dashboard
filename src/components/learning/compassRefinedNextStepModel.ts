import {
  REFINED_COURSE_SECTIONS,
  type RefinedProgress,
  type RefinedSectionKind,
} from '@/data/compassRefinedCourse'
import { REFINED_NEXT_META, REFINED_NEXT_STEP } from '@/data/compassRefinedCopy'

/**
 * THE ONE THING TO DO NEXT — one model, two pages, 2026-11-12.
 *
 * Jillienne: "The Where you left off component should have all the same
 * details as the Your Next Step section on the Overview. This should be a
 * 1:1."
 *
 * ⚠ SO IT IS ONE COMPONENT READING ONE MODEL, not two cards kept in step.
 * Your Course carried its own resume strip — a thumbnail, a chapter name and
 * a bar — built from different fields, which is how it came to name a chapter
 * this course does not have back on 2026-11-11. Two cards about one learner
 * is the same shape as the two rings that disagreed (finding 4); 1:1 is only
 * true if there is one of them.
 *
 * ⚠ THE WORDS FOLLOW `intoCurrent`, not the page. Between rows it is a next
 * step to START; part way through one it is where you LEFT OFF and the row's
 * own progress is drawn. See `REFINED_NEXT_STEP`.
 */
export type RefinedNextStep = {
  eyebrow: string
  cta: string
  kind?: RefinedSectionKind
  title: string
  /** "21 Lessons", the left half of the meta line. */
  parts: string
  /** The duration, already read off the stage's own meta line. */
  duration: string
  /**
   * The CURRENT row's own progress, 0–100, drawn only when resuming. Absent
   * between rows — a bar at 0% under "Your next step" says the learner has
   * started something they have not.
   */
  lessonPct?: number
}

/** Part way through a row rather than standing between two of them. A hair
 *  of tolerance, because the figure comes from a percentage. */
export const isResuming = (p: RefinedProgress) => p.intoCurrent > 0.005

export function refinedNextStep(p: RefinedProgress, duration: string): RefinedNextStep {
  const resuming = isResuming(p)
  const words = resuming ? REFINED_NEXT_STEP.resuming : REFINED_NEXT_STEP.fresh
  /* ⚠ THE ROW THE LEARNER IS IN, which is `currentN` — the row after the
     last finished one. `REFINED_COURSE_SECTIONS` is 1-indexed by `n`. */
  const section = REFINED_COURSE_SECTIONS.find((s) => s.n === p.currentN)
  return {
    eyebrow: words.eyebrow,
    cta: words.cta,
    kind: section?.kind,
    title: section?.title ?? '',
    parts: REFINED_NEXT_META.parts,
    duration,
    lessonPct: resuming ? Math.round(p.intoCurrent * 100) : undefined,
  }
}
