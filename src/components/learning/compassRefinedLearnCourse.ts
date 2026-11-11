import { JEFF_MVP_LEARN } from '@/data/compassJeffMvpFixtures'
import { REFINED_COURSE_SECTIONS, REFINED_COURSE_TOTALS } from '@/data/compassRefinedCourse'

/**
 * THE YOUR COURSE PAGE, BUILT FROM THE REAL COURSE — 2026-11-11: "update
 * based on the actual course details i uploaded."
 *
 * ⚠ THE PAGE AND THE OVERVIEW NOW READ ONE LIST. The Learn page carried
 * nineteen chapters typed into `JEFF_MVP_LEARN`; the Overview counts against
 * the forty-one rows of `compassRefinedCourse.ts`. Two hand-kept lists of the
 * same course is how "22 of 36 lessons" ended up on one page while the other
 * said "0 of 41" — so the chapters are DERIVED here and only the lesson-level
 * detail is still his.
 *
 * ⚠ THREE THINGS THE PAGE WAS MISSING, all of them in her upload:
 *   • the Course Introduction, which is the first row a learner sees
 *   • the Florida Laws chapter and its exam, which are the last two
 *   • the double-numbered titles from thirteen on ("Life & Health Chapter 13
 *     | Health Chapter 4") — the page had only the short names
 *
 * ⚠ AND ONE THING IT HAD THAT THE UPLOAD DOES NOT: a final "Certification
 * Exam". Her list ends at "Chapter Exam: Florida Life and Health Laws and
 * Rules" with no separate certification step, so it is not built here. If the
 * real course does have one, it is a row in `REFINED_COURSE_SECTIONS` and
 * this picks it up with no change.
 *
 * ⚠ LESSON-LEVEL CONTENT IS STILL HIS, by the standing instruction ("do not
 * worry about the course content right now"). His lessons are matched to the
 * chapter at the same position; the Introduction and the Florida Laws chapter
 * have none and say so rather than borrowing a neighbour's.
 */

export type RefinedChapter = {
  /** Position in the course's own order, 1-based over the LESSON rows. */
  n: number
  /** The eyebrow — the course's own label plus the lesson count. */
  eyebrow: string
  /** The row's name, after the colon where the course uses one. */
  title: string
  /** The course's own full string, for anything that needs it verbatim. */
  fullTitle: string
  /** The eyebrow's left half on its own, for tests and for anything that
   *  needs the chapter's number without the count. */
  label: string
  state: string
  status: string
  statusTone: string
  progPct?: string
  progAria?: string
  hasAction?: boolean
  action?: string
  actionLabel?: string
  chevLabel?: string
  lockMsg?: string
  exam?: { title: string; done?: boolean; locked?: boolean; note?: string }
  lessons: { label: string; state: string }[]
}

/** ⚠ SPLIT ON THE COURSE'S OWN PUNCTUATION, not on a guess about numbering.
 *  Every chapter row is "<label>: <name>"; the Introduction is "Course
 *  Introduction - Life and Health Pre-licensing". A row matching neither
 *  keeps its whole string as the title and carries no label. */
function splitTitle(t: string): { label: string; title: string } {
  const colon = t.indexOf(': ')
  if (colon > -1) return { label: t.slice(0, colon), title: t.slice(colon + 2) }
  const dash = t.indexOf(' - ')
  if (dash > -1) return { label: t.slice(0, dash), title: t.slice(dash + 3) }
  return { label: '', title: t }
}

const LESSON_ROWS = REFINED_COURSE_SECTIONS.filter((s) => s.kind === 'lesson')

export const REFINED_CHAPTERS: RefinedChapter[] = LESSON_ROWS.map((s, i) => {
  const next = REFINED_COURSE_SECTIONS.find((x) => x.n === s.n + 1)
  const { label, title } = splitTitle(s.title)
  /* ⚠ MATCHED BY TITLE, NOT BY POSITION, and the difference is not academic.
     His outline and the course's line up for almost every chapter — but his
     Chapter 2 is "Insurers and Insurance Markets" where the course's is
     "Nature of Insurance". Positionally, his lessons about stock and mutual
     insurers landed under a chapter about the nature of insurance: the right
     heading over the wrong contents, which is worse than an empty chapter
     because nothing on screen says it is wrong.

     So a chapter takes his lessons only when the two agree on what the
     chapter IS. Chapter 2, the Introduction and the Florida laws have none
     and show none. */
  const his = JEFF_MVP_LEARN.chapters.find(
    (c) => c.title.trim().toLowerCase() === title.trim().toLowerCase(),
  )
  const lessons = his ? [...his.lessons] : []

  /* ⚠ THE TWO NEW ROWS TAKE A STATE FROM THEIR NEIGHBOURS, not from nothing.
     His story is "Chapter 1 complete, Chapter 2 in progress, the rest
     locked"; an Introduction that precedes a finished Chapter 1 is finished,
     and a Florida laws chapter at the far end of a locked run is locked.
     Inventing a third state for them would have put the page in a condition
     no learner can reach. */
  const fallbackState = i === 0 ? 'done' : 'locked'
  const state = his?.state ?? fallbackState

  return {
    n: i + 1,
    label,
    title,
    fullTitle: s.title,
    /* ⚠ THE COURSE'S OWN LABEL, THEN THE COUNT. His read "Chapter 2 · 7
       lessons" off a typed string; this builds it, so a chapter whose lesson
       list is not ported says only what it knows. */
    eyebrow: [label, lessons.length ? `${lessons.length} lessons` : '']
      .filter(Boolean)
      .join(' · '),
    state,
    status: his?.status ?? (state === 'done' ? 'Completed' : ''),
    statusTone: his?.statusTone ?? (state === 'done' ? 'green' : 'muted'),
    progPct: his?.progPct,
    progAria: his?.progAria,
    hasAction: his?.hasAction,
    action: his?.action,
    actionLabel: his?.actionLabel,
    chevLabel: his?.chevLabel ?? `Expand ${title}`,
    lockMsg: his?.lockMsg,
    /* ⚠ THE EXAM IS THE COURSE'S NEXT ROW, named as the course names it.
       His nested exam carried its own title ("Chapter 2 exam"); the course
       calls it "Chapter 2 Exam: Nature of Insurance", and that is the string
       a learner will see in the list. */
    exam:
      next?.kind === 'exam'
        ? {
            title: next.title,
            done: his?.exam?.done,
            locked: his?.exam?.locked,
            note: his?.exam?.note,
          }
        : undefined,
    lessons,
  }
})

/**
 * THE COURSE HEADER'S FIGURES, counted rather than typed.
 *
 * ⚠ "22 of 36 lessons" WAS THE SYMPTOM. It is the figure the page carried
 * while the Overview said 41, and neither was reading the course. Both now
 * count `REFINED_COURSE_SECTIONS`.
 */
export const REFINED_COURSE_HEADER = {
  chapters: REFINED_CHAPTERS.length,
  sections: REFINED_COURSE_TOTALS.sections,
  exams: REFINED_COURSE_TOTALS.exams,
  eyebrow: `${REFINED_CHAPTERS.length} chapters · ${REFINED_COURSE_TOTALS.exams} exams`,
  /** Sections finished over the real total, for the ring's caption. */
  done: REFINED_CHAPTERS.filter((c) => c.state === 'done').length,
}
