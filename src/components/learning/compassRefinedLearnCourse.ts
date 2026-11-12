import { JEFF_MVP_LEARN } from '@/data/compassJeffMvpFixtures'
import {
  REFINED_COURSE_PROGRESS,
  REFINED_COURSE_SECTIONS,
  REFINED_COURSE_TOTALS,
  type RefinedSectionKind,
} from '@/data/compassRefinedCourse'
import { REFINED_FINISH_COPY } from '@/data/compassRefinedCopy'

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
 * ⚠ AND HOW IT ENDS — 2026-11-12. Her upload stopped at "Chapter Exam:
 * Florida Life and Health Laws and Rules", so for a day this file said a
 * certification step was not built and would be picked up "with no change" if
 * the course gained one. That second half was not true: the chapters are
 * built from the LESSON rows, so a closing row of any other kind was dropped
 * on the floor. The course now carries three ("we will need the Final Exam
 * Section, as well as a survey section, and a certificate section") and
 * `REFINED_FINISH_STEPS` at the foot of this file is what renders them.
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
  progPct?: string
  progAria?: string
  hasAction?: boolean
  action?: string
  actionLabel?: string
  chevLabel?: string
  /** What opens this chapter, for a locked one — see `lockNote` below. */
  lockMsg?: string
  /** Whether there is anything behind the chevron. See finding 8. */
  expandable: boolean
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

/**
 * WHAT OPENS A LOCKED CHAPTER — 2026-11-12, finding 2 of the audit.
 *
 * ⚠ THE PAGE PROMISES THIS AND DID NOT KEEP IT. Its lead is "a locked step
 * tells you exactly what opens it"; the exam rows say so and the chapters
 * said only "Locked". What they had was `his.lockMsg`, which reaches only the
 * chapters whose names match his outline — so the sentence was missing from
 * exactly the rows the port could not cover, with nothing on screen saying a
 * sentence was meant to be there.
 *
 * ⚠ IT IS THE ROW BEFORE, NAMED. The course is linear, so the gate on any row
 * is the one above it: Chapter 2 opens when Chapter 1's exam is done, Chapter
 * 1 when the Introduction is. Said with the course's own label ("Chapter 1
 * Exam") rather than its full string, which runs to sixty characters.
 */
function lockNote(n: number): string {
  const before = REFINED_COURSE_SECTIONS.find((x) => x.n === n - 1)
  if (!before) return ''
  const { label, title } = splitTitle(before.title)
  return `Opens when ${label || title} is complete`
}

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

  /* ⚠ THE STATE COMES FROM THE COURSE'S OWN PROGRESS, not from his chapter.
     Taking it from `his` broke the page the moment lessons were matched by
     title: his Chapter 2 was the `current` one, the course's Chapter 2 is a
     different chapter, so nothing was current and the page still offered
     "Resume lesson". Deriving it from position cannot produce that.

     ⚠ AND THE POSITION IS HERS, from the upload: the Course Introduction
     complete with a score, Chapter 1 open with a Continue button, everything
     after it not started. `REFINED_COURSE_PROGRESS` is the same object the
     Overview counts against, so the two pages tell one story. */
  const state =
    s.n < REFINED_COURSE_PROGRESS.currentN
      ? 'done'
      : s.n === REFINED_COURSE_PROGRESS.currentN
        ? 'current'
        : 'locked'

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
    /* The word follows the state, not his fixture — a chapter cannot read
       "Completed" because his copy of it was. */
    status: state === 'done' ? 'Completed' : state === 'current' ? 'In progress' : '',
    progPct: his?.progPct,
    progAria: his?.progAria,
    /* ⚠ THE ACTION FOLLOWS THE STATE, NOT HIS FIXTURE. His Chapter 1 was
       complete and carried "Review"; this course's Chapter 1 is in progress,
       and a chapter you have not finished cannot be reviewed. */
    hasAction: state !== 'locked',
    action: state === 'done' ? 'Review' : 'Resume',
    actionLabel: `${state === 'done' ? 'Review' : 'Resume'} ${s.title}`,
    chevLabel: his?.chevLabel ?? `Expand ${title}`,
    /* ⚠ DERIVED, NOT HIS — see `lockNote`. A chapter that is not locked has
       no sentence, because there is nothing to open. */
    lockMsg: state === 'locked' ? lockNote(s.n) : undefined,
    /* ⚠ NOTHING OPENS ON NOTHING — 2026-11-12, finding 8. The Course
       Introduction carried a chevron, and behind it an empty lesson list and
       no exam: a control whose entire effect was to change its own arrow.
       Her upload has no lesson-level detail for that row, and until it does
       the honest row is one that does not offer to expand. */
    expandable: lessons.length > 0 || next?.kind === 'exam',
    /* ⚠ THE EXAM IS THE COURSE'S NEXT ROW, named as the course names it.
       His nested exam carried its own title ("Chapter 2 exam"); the course
       calls it "Chapter 2 Exam: Nature of Insurance", and that is the string
       a learner will see in the list. */
    /* ⚠ AND THE EXAM'S STATE IS THE COURSE'S TOO. Taking `done` and `locked`
       from his fixture put "Completed · Review exam" on Chapter 1's exam
       inside a chapter marked In progress whose seven lessons were all still
       to do — his Chapter 1 was finished, this course's is not. One learner
       cannot have passed the exam for a chapter they are halfway through,
       and it is the kind of contradiction a reviewer reads as a bug in the
       product rather than in the demo data.

       The note goes the same way: his said "Opens after all lessons" on the
       chapters he covered and nothing on the others. */
    exam:
      next?.kind === 'exam'
        ? {
            title: next.title,
            done: next.n < REFINED_COURSE_PROGRESS.currentN,
            locked: next.n >= REFINED_COURSE_PROGRESS.currentN,
            note:
              next.n >= REFINED_COURSE_PROGRESS.currentN
                ? lessons.length
                  ? `Opens after all ${lessons.length} lessons`
                  : 'Opens after all lessons'
                : '',
          }
        : undefined,
    /* ⚠ AND THE LESSONS FOLLOW IT TOO. His were all `done`, because his
       Chapter 1 was finished — rendered under a chapter marked In progress
       they put seven completed lessons inside something unfinished, which is
       the kind of contradiction a reviewer reads as a bug in the product
       rather than in the demo data. A chapter in progress opens on its first
       lesson; a locked one has started nothing. */
    lessons: lessons.map((l, li) => ({
      ...l,
      state:
        state === 'done' ? 'done' : state === 'current' ? (li === 0 ? 'current' : 'todo') : 'todo',
    })),
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
  /** ⚠ THE WORD FOLLOWS THE FIGURE. The header read "Completed" beside "1 of
   *  41 sections" — his status string, kept while everything around it
   *  changed. A course is complete when its sections are. */
  status:
    REFINED_COURSE_PROGRESS.done >= REFINED_COURSE_TOTALS.sections ? 'Completed' : 'In progress',
  /** ⚠ SECTIONS FINISHED, COUNTED IN SECTIONS. The page read "2 of 41
   *  sections" against a 61% ring — two different claims about one learner,
   *  because the figure counted CHAPTERS and the denominator counted every
   *  row. Both are sections now, and the ring reads the same fraction. */
  done: REFINED_COURSE_PROGRESS.done,
  pct: Math.round((REFINED_COURSE_PROGRESS.done / REFINED_COURSE_TOTALS.sections) * 100),
}

/**
 * WHERE THE LEARNER LEFT OFF — read off the course, not typed.
 *
 * ⚠ THE CARD NAMED A CHAPTER THIS COURSE DOES NOT HAVE. It read "Chapter 2 ·
 * Insurers and Insurance Markets" — his outline's Chapter 2, which the
 * Florida list does not contain — and went on offering "Resume lesson" after
 * the page had nothing in progress at all. Both failures are the same one:
 * the card was a string beside the data rather than a reading of it.
 */
export const REFINED_RESUME = (() => {
  const current = REFINED_CHAPTERS.find((c) => c.state === 'current')
  const open = current?.lessons.find((l) => l.state === 'current') ?? current?.lessons[0]
  return {
    title: current ? [current.label, current.title].filter(Boolean).join(' · ') : '',
    /* ⚠ ONLY WHEN THE CHAPTER'S LESSONS ARE PORTED. Chapter 1 has his; the
       Introduction and Chapter 2 do not, and naming a lesson they do not
       contain is the mistake this object exists to stop. */
    lesson: open ? open.label : '',
  }
})()

/**
 * THE COURSE'S ENDING — 2026-11-12.
 *
 * ⚠ WHAT THE CHAPTERS DO NOT CONSUME. A chapter above takes a lesson row and,
 * when the next row is its exam, that too. Everything left over is the
 * ending: today rows 42-44, the Final Exam, the Course Survey and the
 * Certificate. Deriving it as the REMAINDER rather than as "the last three"
 * is what makes the comment at the top of this file true at last — a new
 * closing row lists itself, and a row inserted mid-course does not fall off
 * the end of the page.
 */
const CONSUMED = new Set<number>()
for (const s of LESSON_ROWS) {
  CONSUMED.add(s.n)
  const next = REFINED_COURSE_SECTIONS.find((x) => x.n === s.n + 1)
  if (next?.kind === 'exam') CONSUMED.add(next.n)
}

export type RefinedFinishStep = {
  n: number
  kind: RefinedSectionKind
  title: string
  /** The kind, as a word — "Final Exam", "Survey", "Certificate". */
  eyebrow: string
  /** What opens it. */
  note: string
  /** The disabled button's verb. */
  cta: string
  state: 'done' | 'current' | 'locked'
}

export const REFINED_FINISH_STEPS: RefinedFinishStep[] = REFINED_COURSE_SECTIONS.filter(
  (s) => !CONSUMED.has(s.n),
).map((s) => ({
  n: s.n,
  kind: s.kind,
  title: s.title,
  eyebrow: REFINED_FINISH_COPY.kindLabel[s.kind] ?? '',
  /* ⚠ COUNTED, LIKE EVERY OTHER FIGURE ON THIS PAGE. His note said "all 19
     chapters" beside twenty-one of them. */
  note: (REFINED_FINISH_COPY.stepNote[s.kind] ?? (() => ''))(REFINED_CHAPTERS.length),
  cta: REFINED_FINISH_COPY.cta[s.kind] ?? '',
  /* The same reading of `REFINED_COURSE_PROGRESS` the chapters use, so the
     ending cannot claim a state the course list disagrees with. */
  state:
    s.n < REFINED_COURSE_PROGRESS.currentN
      ? 'done'
      : s.n === REFINED_COURSE_PROGRESS.currentN
        ? 'current'
        : 'locked',
}))
