import { describe, expect, it } from 'vitest'
import {
  REFINED_COURSE_PROGRESS,
  REFINED_COURSE_SECTIONS,
  REFINED_COURSE_TOTALS,
  refinedCurrentSection,
} from '@/data/compassRefinedCourse'

/**
 * THE FLORIDA LIFE & HEALTH COURSE — 2026-11-11, transcribed from the live
 * course's section list.
 *
 * ⚠ WHAT IS WORTH PINNING IS THE TRANSCRIPTION, not the component that reads
 * it. Forty-one rows typed by hand off five screenshots is exactly the kind
 * of data that loses a row, duplicates one at a screenshot boundary, or
 * breaks the chapter/exam alternation — and none of those would fail
 * anything else in this suite. They would just quietly become the course.
 */
describe('the course list', () => {
  it('is forty-one sections: twenty-one lessons and twenty exams', () => {
    expect(REFINED_COURSE_SECTIONS).toHaveLength(41)
    expect(REFINED_COURSE_TOTALS).toEqual({ sections: 41, lessons: 21, exams: 20 })
  })

  it('numbers them 1..41 with no gap and no repeat', () => {
    expect(REFINED_COURSE_SECTIONS.map((s) => s.n)).toEqual(
      Array.from({ length: 41 }, (_, i) => i + 1),
    )
  })

  it('has no duplicate titles', () => {
    /* ⚠ THE SCREENSHOT-BOUNDARY TRAP. "Life & Health Chapter 15 | Health
       Chapter 6: Medical Expense Insurance" ends one screenshot and begins
       the next; transcribing both is the easiest mistake here to make and the
       hardest to see. */
    const seen = new Set(REFINED_COURSE_SECTIONS.map((s) => s.title))
    expect(seen.size).toBe(REFINED_COURSE_SECTIONS.length)
  })

  it('pairs every chapter with the exam that follows it', () => {
    /* ⚠ THE ALTERNATION IS THE COURSE'S SHAPE: a chapter, then its exam, all
       the way down — with the introduction the one lesson that has none. Each
       exam's title is its chapter's with "Exam" spliced in, so a mismatched
       pair means a row was transcribed onto the wrong chapter. */
    const intro = REFINED_COURSE_SECTIONS[0]
    expect(intro.kind).toBe('lesson')
    expect(intro.title).toContain('Course Introduction')

    for (let i = 1; i < REFINED_COURSE_SECTIONS.length; i += 2) {
      const lesson = REFINED_COURSE_SECTIONS[i]
      const exam = REFINED_COURSE_SECTIONS[i + 1]
      expect(lesson.kind, `${lesson.title} should be a lesson`).toBe('lesson')
      expect(exam.kind, `${exam?.title} should be an exam`).toBe('exam')
      expect(exam.title).toMatch(/Exam/)
    }
  })

  it('keeps the double-numbered titles verbatim from chapter thirteen on', () => {
    /* ⚠ IT READS LIKE A TRANSCRIPTION ERROR AND IS NOT ONE. The Health
       syllabus restarts its numbering inside the combined course, so the
       course prints both — "Life & Health Chapter 13 | Health Chapter 4". A
       future tidy-up that "fixes" these would be undoing the course. */
    const doubles = REFINED_COURSE_SECTIONS.filter((s) => s.title.includes(' | Health Chapter '))
    expect(doubles).toHaveLength(14)
    expect(doubles[0].title).toBe(
      'Life & Health Chapter 13 | Health Chapter 4: Health and Accident Insurance',
    )
  })

  it('ends on the Florida laws chapter and its exam', () => {
    const last = REFINED_COURSE_SECTIONS.slice(-2)
    expect(last[0].title).toBe('Florida Life and Health Laws, Rules, and Regulations')
    expect(last[0].kind).toBe('lesson')
    expect(last[1].title).toBe('Chapter Exam: Florida Life and Health Laws and Rules')
    expect(last[1].kind).toBe('exam')
  })

  it('puts the demo learner where the screenshots put them', () => {
    /* The introduction complete, Chapter 1 open with a Continue button. */
    expect(REFINED_COURSE_PROGRESS.done).toBe(1)
    expect(refinedCurrentSection().title).toBe(
      'Chapter 1: Basic Principles of Life and Health Insurance',
    )
  })
})
