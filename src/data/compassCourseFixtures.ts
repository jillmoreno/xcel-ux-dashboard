import type {
  CompassTocChild,
  CompassTocSection,
} from '@/components/compass/CompassCourseRail.types'
import { DEFAULT_COURSE, type CourseId } from './courseFixtures'

/**
 * SAMPLE table of contents for the Compass LMS course rail — the DESIGN's
 * content, lifted from Figma "Atlas-Compass-Global-Navigation" node 49:2922
 * (2026-09-22), so the rail can be judged with real structure in it.
 *
 * IT IS NOT XCEL'S SYLLABUS, and that is the thing to know before trusting it.
 * The New York Life and Health course is 42 lessons, and no outline of those
 * lessons exists in this repo — `NY_LH_GUIDE_CHAPTERS_PARTIAL` is a partial
 * extraction that is deliberately never rendered. The three sections and seven
 * lessons began as the design's placeholders; their names were set by the
 * designer on 2026-09-24, and they are still not the course's real outline. Replace this array with the
 * course's real outline when Compass supplies one; the rail needs no change.
 *
 * No entry carries `onSelect`: no lesson has a page yet, so every row renders
 * as static text rather than a control that opens nothing.
 */
export const COMPASS_SAMPLE_TOC_FROM_DESIGN: readonly CompassTocSection[] = [
  // Renamed 2026-09-24 at the designer's request — was the design's
  // "Insurance Basics".
  {
    id: 'course-introduction',
    label: 'Course Introduction - Life and Health Pre-licensing',
    status: 'done',
  },
  {
    id: 'life-policy-types',
    // Renamed 2026-09-24 at the designer's request — was the design's
    // "Life insurance policy types".
    label: 'Chapter 1: Basic Principles of Life and Health Insurance',
    status: 'current',
    // Renamed 2026-09-24 at the designer's request — they were the design's
    // Chapter 1–5, Knowledge Check and Recap. Statuses unchanged.
    children: [
      { id: 'exam-basic-principles', label: 'Exam: Basic Principles of Life and Health Insurance', status: 'done' },
      { id: 'nature-of-insurance', label: 'Nature of Insurance', status: 'current' },
      { id: 'exam-nature-of-insurance', label: 'Exam: Nature of Insurance', status: 'not-started' },
      { id: 'legal-concepts', label: 'Legal Concepts of Insurance', status: 'not-started' },
      { id: 'exam-legal-concepts', label: 'Exam: Legal Concepts of Insurance', status: 'not-started' },
      { id: 'life-policy-types-lesson', label: 'Life Insurance Policy Types', status: 'not-started' },
      { id: 'exam-life-policy-types', label: 'Exam: Life Insurance Policy Types', status: 'not-started' },
    ],
  },
  { id: 'provisions-riders', label: 'Policy provisions & Riders', status: 'not-started' },
]

/**
 * The CURRENT section and how far through its lessons the learner is
 * (done ÷ total, 0–100). ONE derivation for every surface that prints it —
 * the player controls bar's "Section" pill and, since 2026-09-24, the course
 * rail's "% Complete" pill — so the two cannot disagree. A section with no
 * lessons reads 0.
 */
export function currentSectionProgress(toc: readonly CompassTocSection[]): {
  label: string
  pct: number
} {
  const section = toc.find((s) => s.status === 'current')
  const lessons = section?.children ?? []
  const done = lessons.filter((l) => l.status === 'done').length
  return {
    label: section?.label ?? 'Course',
    pct: lessons.length ? (done / lessons.length) * 100 : 0,
  }
}

/**
 * TEXAS LIFE & HEALTH — the Course control's second content tree (2026-10-15).
 *
 * ⚠ IT IS NO MORE REAL THAN THE FLORIDA TREE ABOVE, and that tree's own note
 * is the thing to read first: the three sections and seven lessons began as
 * the Figma's placeholders and were renamed by the designer on 2026-09-24.
 * Neither is a course's real outline. What this one adds is a tree that is
 * recognisably a DIFFERENT course — Texas's general-knowledge-then-state-code
 * shape rather than Florida's — so flipping the Course control visibly
 * re-resolves the rail instead of re-rendering it with one word changed.
 *
 * ⚠ AUTHORED IN THREE STATUSES, never `locked`. The regulated sequencing rule
 * DERIVES locks from position — see `applyCourseSequencing`. A fixture that
 * authored one would keep it under Unregulated, which is the bug.
 *
 * TODO(data): replace with XCEL's real Texas Life & Health outline when
 * Compass supplies one. The rail needs no change.
 */
export const COMPASS_TOC_TX: readonly CompassTocSection[] = [
  {
    id: 'tx-course-introduction',
    label: 'Course Introduction - Texas Life and Health Pre-licensing',
    status: 'done',
  },
  {
    id: 'tx-general-knowledge',
    label: 'Chapter 1: General Insurance Concepts',
    status: 'current',
    children: [
      { id: 'tx-exam-general-concepts', label: 'Exam: General Insurance Concepts', status: 'done' },
      { id: 'tx-risk-and-insurance', label: 'Risk, Peril and the Insurable Interest', status: 'current' },
      { id: 'tx-exam-risk', label: 'Exam: Risk, Peril and the Insurable Interest', status: 'not-started' },
      { id: 'tx-contract-law', label: 'Contract Law & Policy Provisions', status: 'not-started' },
      { id: 'tx-exam-contract-law', label: 'Exam: Contract Law & Policy Provisions', status: 'not-started' },
      { id: 'tx-life-policy-types', label: 'Types of Life Policies', status: 'not-started' },
      { id: 'tx-exam-life-policy-types', label: 'Exam: Types of Life Policies', status: 'not-started' },
    ],
  },
  {
    id: 'tx-health-provisions',
    label: 'Chapter 2: Accident & Health Policy Provisions',
    status: 'not-started',
  },
  /* The state-specific half of the paper — the structural difference from
     Florida's tree, and the reason this is not a relabel. */
  {
    id: 'tx-insurance-code',
    label: 'Chapter 3: Texas Insurance Code & TDI Rules',
    status: 'not-started',
  },
]

const TOC_BY_COURSE: Record<CourseId, readonly CompassTocSection[]> = {
  fl: COMPASS_SAMPLE_TOC_FROM_DESIGN,
  tx: COMPASS_TOC_TX,
  /* ⚠ NEW YORK AND FLORIDA SHARE THE DESIGN'S SAMPLE, and that is honest
     rather than lazy — 2026-10-15. The sample is explicitly NOT a syllabus
     (see its own note); its rows are the Figma's placeholders renamed by the
     designer. The rail that draws it is titled "New York Life and Health
     Pre-licensing", so if anything the sample has always been New York's.
     Pointing both here says "neither of these is the course's real outline",
     which is true, instead of inventing a second fake tree to make the
     control look busier. Texas has its own only because it was written to
     show the control re-resolving.

     Replace both the day Compass supplies real outlines. */
  ny: COMPASS_SAMPLE_TOC_FROM_DESIGN,
}

/**
 * The course content tree for a course.
 *
 * `COMPASS_SAMPLE_TOC_FROM_DESIGN` keeps its name and its export rather than
 * being renamed to `COMPASS_TOC_FL`: it is what four components and a test
 * import, the name says where the content came from (the design), and renaming
 * it would be five edits that change nothing. This is the course-aware door.
 */
export function compassTocFor(course: CourseId = DEFAULT_COURSE): readonly CompassTocSection[] {
  return TOC_BY_COURSE[course]
}

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  REGULATED SEQUENCING — phase 1 of the regulated course rules (2026-10-15)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * THE RULE, in one line: everything up to and including the first entry that
 * is not DONE stays open; everything after it locks.
 *
 * Spelled out, in reading order — sections, and the lessons inside the current
 * one. `done` is always open: it has been finished. `current` is always open
 * too (locking what a learner is inside would be absurd) but it CLOSES THE
 * GATE BEHIND IT — the brief's rule is "the next item opens once the one
 * before it is marked complete", and a lesson someone is part-way through is
 * not complete. Every `not-started` entry from there on is `locked`.
 *
 * On a course nobody has started there is no `current` entry, the allowance
 * survives to the first row, and the result is exactly what Jillienne asked
 * for: the first item is clickable, the rest carry the padlock.
 *
 * ⚠ IT MUST MATCH `applyJourneySequencing` (`studyJourneyUtil.ts`), which
 * applies the same rule to the Study Journey's version of Step 1. A learner
 * can see both in one session; if the two forked they would disagree about
 * which lesson is open.
 *
 * ⚠ IT IS A PURE FUNCTION OVER A TREE, NOT A FLAG READ, and that split is the
 * point. `isRegulatedCourse` (`courseFixtures.ts`) is the only thing that
 * knows what the flag means; this is the only thing that knows what regulation
 * does to a content tree; `CompassCourseRail` only knows how to draw a locked
 * row. Phase 2's rules — forced seat time, a chapter-exam gate, whatever
 * Jillienne lands on — extend THIS function and reach every surface at once,
 * rather than being a second conditional in whichever component noticed first.
 *
 * ⚠ LOCKED ENTRIES LOSE `onSelect` on the way through, so a locked row cannot
 * also be clickable. The rail renders a child with no `onSelect` as static
 * text already — that is the honest state for a lesson with no page — so the
 * lock needs no new branch there beyond its icon.
 *
 * Unregulated returns the tree UNCHANGED BY IDENTITY (`toc`, not a copy), so
 * the default path allocates nothing and a `===` in a memo still holds.
 */
export function applyCourseSequencing(
  toc: readonly CompassTocSection[],
  regulated: boolean,
): readonly CompassTocSection[] {
  if (!regulated) return toc
  /* One walk, one flag. `open` is the allowance for the single entry a learner
     may open next; `current` and the first `not-started` both spend it, and
     everything after locks. Deliberately NOT per-section: a section whose
     lessons are all locked must not hand a fresh allowance to the one below
     it. */
  let open = true
  const lockChild = (child: CompassTocChild): CompassTocChild => {
    if (child.status === 'done') return child
    if (child.status === 'current') {
      open = false
      return child
    }
    if (child.status !== 'not-started') return child
    if (open) {
      open = false
      return child
    }
    return { ...child, status: 'locked', onSelect: undefined }
  }
  return toc.map((section) => {
    /* THE SECTION'S OWN STATUS IS SPENT FIRST, then its children's — reading
       order down the rail, which is the order the rule is stated in. Mapping
       children before deciding the section would let a section's first lesson
       claim the allowance the section header is standing in front of. */
    let status = section.status
    if (status === 'current') {
      open = false
    } else if (status === 'not-started') {
      if (open) open = false
      else status = 'locked'
    }
    const children = section.children?.map(lockChild)
    if (status === section.status && !children) return section
    return {
      ...section,
      status,
      ...(status === 'locked' ? { onSelect: undefined } : null),
      ...(children ? { children } : null),
    }
  })
}
