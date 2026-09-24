import type { CompassTocSection } from '@/components/compass/CompassCourseRail.types'

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
