import { describe, expect, it } from 'vitest'
import { JEFF_MVP_LEARN } from '@/data/compassJeffMvpFixtures'
import {
  REFINED_DEFAULT_VIEW,
  refinedCourseView,
} from '@/components/learning/compassRefinedLearnCourse'

/* ⚠ THE DEMO LEARNER OF THE UPLOAD. These were module-level constants until
   2026-11-12, when the page became a function of the stage (finding 4);
   `REFINED_DEFAULT_VIEW` is that same learner, built once. */
const {
  chapters: REFINED_CHAPTERS,
  header: REFINED_COURSE_HEADER,
  finish: REFINED_FINISH_STEPS,
} = REFINED_DEFAULT_VIEW
import {
  REFINED_COURSE_PROGRESS,
  REFINED_COURSE_SECTIONS,
  REFINED_COURSE_TOTALS,
  refinedCurrentSection,
  refinedProgressAt,
} from '@/data/compassRefinedCourse'
import { REFINED_NEXT_META } from '@/data/compassRefinedCopy'

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
  it('is forty-four sections: the chapter list, then the course’s ending', () => {
    /* ⚠ FORTY-ONE WAS THE CHAPTER LIST. The uploaded screenshots stop at the
       last chapter exam; the Final Exam, the Survey and the Certificate were
       added on 2026-11-12 as the regulated tail that follows a completed
       course. */
    expect(REFINED_COURSE_SECTIONS).toHaveLength(44)
    expect(REFINED_COURSE_TOTALS).toEqual({ sections: 44, lessons: 21, exams: 21 })
  })

  it('numbers them 1..44 with no gap and no repeat', () => {
    expect(REFINED_COURSE_SECTIONS.map((s) => s.n)).toEqual(
      Array.from({ length: 44 }, (_, i) => i + 1),
    )
  })

  it('ends on the Final Exam, the Survey and the Certificate', () => {
    expect(REFINED_COURSE_SECTIONS.slice(-3).map((s) => [s.title, s.kind])).toEqual([
      ['Final Exam', 'exam'],
      ['Course Survey', 'survey'],
      ['Certificate', 'certificate'],
    ])
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

    /* ⚠ THE ALTERNATION IS THE CHAPTER LIST'S, and stops where it does. The
       three closing rows are not a chapter-and-exam pair — the Final Exam
       follows no chapter of its own, and the Survey and Certificate are not
       exams at all. */
    const chapterList = REFINED_COURSE_SECTIONS.slice(0, 41)
    for (let i = 1; i < chapterList.length; i += 2) {
      const lesson = chapterList[i]
      const exam = chapterList[i + 1]
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

  it('closes the chapter list on the Florida laws chapter and its exam', () => {
    const last = REFINED_COURSE_SECTIONS.slice(0, 41).slice(-2)
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

/**
 * THE ICON BESIDE THE NEXT STEP — 2026-11-11, Jillienne: "If its a Lesson, an
 * open book icon, if its an exam, a document style icon with a checkmark … 
 * affidavit = document with signature, survey = checkbox list icon."
 *
 * ⚠ WHAT IS PINNED IS THE KIND, NOT THE GLYPH. Which SVG reads as "a document
 * with a checkmark" is a judgement about this registry and may be revisited;
 * that an exam row is typed `exam` is the thing the mapping stands on, and it
 * is the thing a transcription slip would break.
 */
describe('every section has a kind an icon can be chosen from', () => {
  it('types every row, and uses only the four kinds', () => {
    const kinds = new Set(REFINED_COURSE_SECTIONS.map((s) => s.kind))
    expect([...kinds].sort()).toEqual(['certificate', 'exam', 'lesson', 'survey'])
  })

  it('types a row as an exam when and only when its title says Exam', () => {
    /* ⚠ THE TITLE IS THE EVIDENCE. Every exam row in the course names itself
       one, so a row typed `lesson` whose title says Exam — or the reverse —
       is a transcription slip, and it would show as the wrong icon on the
       Overview rather than as a failure anywhere else. */
    for (const s of REFINED_COURSE_SECTIONS) {
      if (s.kind === 'survey' || s.kind === 'certificate') continue
      const says = /\bExam\b/.test(s.title)
      expect(s.kind === 'exam', `${s.title} is typed ${s.kind}`).toBe(says)
    }
  })
})

/**
 * THE YOUR COURSE PAGE AGAINST THE REAL COURSE — 2026-11-11, "update based on
 * the actual course details i uploaded."
 *
 * ⚠ THE PAGE AND THE OVERVIEW USED TO COUNT DIFFERENTLY: one said "22 of 36
 * lessons" while the other said "0 of 41", because each had its own hand-kept
 * list of the same course. These cases hold the derived chapters to the
 * course rather than to a number typed twice.
 */
describe('the Your Course page is built from the course list', () => {
  it('has a chapter for every lesson row, introduction and laws included', () => {
    expect(REFINED_CHAPTERS).toHaveLength(REFINED_COURSE_TOTALS.lessons)
    expect(REFINED_CHAPTERS[0].fullTitle).toContain('Course Introduction')
    expect(REFINED_CHAPTERS.at(-1)?.fullTitle).toBe(
      'Florida Life and Health Laws, Rules, and Regulations',
    )
  })

  it('pairs each chapter with the exam the course lists after it', () => {
    /* ⚠ THE INTRODUCTION HAS NONE, and that is the course's shape rather
       than a gap: it runs straight into Chapter 1. Everything else is
       followed by its own exam. */
    expect(REFINED_CHAPTERS[0].exam).toBeUndefined()
    for (const c of REFINED_CHAPTERS.slice(1)) {
      expect(c.exam, `${c.fullTitle} has no exam`).toBeTruthy()
      /* ⚠ NAMED AS THE COURSE NAMES IT. His nested exam read "Chapter 2
         exam"; the course calls it "Chapter 2 Exam: Nature of Insurance",
         and that is the string a learner sees in the list. */
      expect(c.exam?.title).toMatch(/Exam/)
    }
  })

  it('keeps the double-numbered labels in the eyebrow and the name in the title', () => {
    /* The split is on the course's own punctuation — "<label>: <name>" — so
       "Life & Health Chapter 13 | Health Chapter 4" stays visible where a
       chapter number belongs instead of being dropped for the short name. */
    const thirteen = REFINED_CHAPTERS.find((c) => c.title === 'Health and Accident Insurance')
    expect(thirteen?.label).toBe('Life & Health Chapter 13 | Health Chapter 4')
  })

  it('counts its header off the course, not off a typed figure', () => {
    expect(REFINED_COURSE_HEADER.sections).toBe(44)
    expect(REFINED_COURSE_HEADER.chapters).toBe(REFINED_CHAPTERS.length)
    /* ⚠ THE EYEBROW NAMES THE ENDING — 2026-11-12: "21 Sections - Final
       Course Exam - Survey - Certificate", the word changed to Lessons the
       same day ("Use Lessons instead of sections"). The tail is one label per
       closing row, so a fourth would appear here without an edit; pinned
       against the course rather than against the string. */
    expect(REFINED_COURSE_HEADER.eyebrow).toBe(
      '21 Lessons · Final Course Exam · Survey · Certificate',
    )
    expect(REFINED_COURSE_HEADER.eyebrow.split(' · ')).toHaveLength(
      1 + REFINED_FINISH_STEPS.length,
    )
  })
})

/**
 * ⚠ LESSONS BELONG TO THE CHAPTER THEY NAME — 2026-11-11.
 *
 * His outline and the course's agree on almost every chapter, and diverge on
 * one: his Chapter 2 is "Insurers and Insurance Markets" where the course's
 * is "Nature of Insurance". Mapping by position put his lessons about stock
 * and mutual insurers under a chapter about the nature of insurance — the
 * right heading over the wrong contents, which nothing on screen corrects.
 */
describe('a chapter only carries lessons that are its own', () => {
  it('leaves the chapters his outline does not cover empty', () => {
    const byTitle = (t: string) => REFINED_CHAPTERS.find((c) => c.title === t)
    expect(byTitle('Nature of Insurance')?.lessons).toEqual([])
    expect(REFINED_CHAPTERS[0].lessons).toEqual([])
    expect(REFINED_CHAPTERS.at(-1)?.lessons).toEqual([])
  })

  it('and never shows one chapter’s lessons under another’s name', () => {
    /* The guard that matters: every chapter with lessons took them from a
       chapter of his with the SAME name. */
    for (const c of REFINED_CHAPTERS) {
      if (!c.lessons.length) continue
      const his = JEFF_MVP_LEARN.chapters.find(
        (x) => x.title.toLowerCase() === c.title.toLowerCase(),
      )
      expect(his, `${c.title} has lessons but no chapter of his by that name`).toBeTruthy()
      expect(his?.lessons.length).toBe(c.lessons.length)
    }
  })
})

/**
 * ⚠ NOTHING FALLS OFF THE END OF THE PAGE — 2026-11-12.
 *
 * The chapters are built from the LESSON rows and take the exam that follows
 * each. For a day that meant a closing row of any other kind — the Final
 * Exam, the Survey, the Certificate — was simply not rendered anywhere, with
 * no error and nothing on screen to notice. This is the arithmetic that says
 * every row of the course reaches the page.
 */
describe('the course\u2019s ending', () => {
  it('lists every row the chapters do not', () => {
    const inChapters = new Set<number>()
    for (const c of REFINED_CHAPTERS) {
      inChapters.add(c.n)
      if (c.exam) inChapters.add(c.n)
    }
    /* Counted rather than matched by id: each chapter consumes its lesson row
       and, where it has one, its exam. */
    const consumed =
      REFINED_CHAPTERS.length + REFINED_CHAPTERS.filter((c) => c.exam).length
    expect(consumed + REFINED_FINISH_STEPS.length).toBe(REFINED_COURSE_TOTALS.sections)
  })

  it('is the Final Exam, the Survey and the Certificate, in that order', () => {
    expect(REFINED_FINISH_STEPS.map((f) => f.kind)).toEqual([
      'exam',
      'survey',
      'certificate',
    ])
    expect(REFINED_FINISH_STEPS.map((f) => f.title)).toEqual([
      'Final Exam',
      'Course Survey',
      'Certificate',
    ])
  })

  it('counts the chapters in the exam\u2019s note rather than typing them', () => {
    /* His card read "Opens after all 19 chapters" against twenty-one. */
    expect(REFINED_FINISH_STEPS[0].note).toBe(`Opens after all ${REFINED_CHAPTERS.length} chapters`)
    expect(REFINED_FINISH_STEPS[0].note).not.toMatch(/19/)
  })

  it('gives every step a word, a note and a verb', () => {
    for (const f of REFINED_FINISH_STEPS) {
      expect(f.eyebrow, `${f.title} has no kind label`).toBeTruthy()
      expect(f.note, `${f.title} does not say what opens it`).toBeTruthy()
      expect(f.cta, `${f.title} has no button`).toBeTruthy()
    }
  })

  it('is locked while the learner is on section two', () => {
    expect(REFINED_FINISH_STEPS.every((f) => f.state === 'locked')).toBe(true)
  })
})

/**
 * ⚠ ONE LEARNER, ONE SET OF FIGURES — 2026-11-12, findings 3 and 4.
 *
 * Your Course read 2% and the Overview read 0% for the same learner, each
 * deriving progress from the other's output; and the page counted sections in
 * its header while its rows counted lessons. Both are arithmetic, which is
 * the kind of thing a test can hold and an eye cannot.
 */
describe('one derivation of where the learner is', () => {
  it('turns a stage percentage into sections, and back to the same percentage', () => {
    for (const pct of ['0%', '19%', '50%', '81%', '100%']) {
      const p = refinedProgressAt(pct)
      expect(p.pct).toBe(Number.parseFloat(pct))
      /* ⚠ FLOOR, NOT ROUND — 2026-11-12. 81% of forty-four rows is 35.64:
         thirty-five finished and most of a thirty-sixth. Rounding said
         thirty-six were done, and threw away the remainder that is now the
         only signal for "part way through a lesson". */
      expect(p.done).toBe(Math.floor((p.pct / 100) * REFINED_COURSE_TOTALS.sections + 1e-9))
      expect(p.done + p.intoCurrent).toBeCloseTo(
        (p.pct / 100) * REFINED_COURSE_TOTALS.sections,
        6,
      )
      /* The ring and the caption are one fact: the header's percentage is
         the stage's, not a second rounding of the done figure. */
      expect(refinedCourseView(p).header.pct).toBe(p.pct)
      expect(refinedCourseView(p).header.done).toBe(p.done)
    }
  })

  it('puts the learner in a chapter even when they are on its exam', () => {
    /* At 19% the eighth section is done and the ninth is "Chapter 4 Exam".
       Comparing lesson rows alone left no chapter current at all. */
    const view = refinedCourseView(refinedProgressAt('19%'))
    const current = view.chapters.filter((c) => c.state === 'current')
    expect(current).toHaveLength(1)
    expect(current[0].title).toBe('Life Insurance Policy Types')
  })

  it('never shows more than one chapter as current, at any stage', () => {
    for (let pct = 0; pct <= 100; pct += 1) {
      const view = refinedCourseView(refinedProgressAt(pct))
      expect(
        view.chapters.filter((c) => c.state === 'current').length,
        `two current chapters at ${pct}%`,
      ).toBeLessThanOrEqual(1)
    }
  })

  it('counts the course in sections only — no lesson count in a row label', () => {
    for (const c of REFINED_DEFAULT_VIEW.chapters) {
      expect(c.eyebrow, `${c.title} counts a second unit`).not.toMatch(/lessons?/i)
      expect(c.eyebrow).toBe(c.label)
    }
  })
})

/**
 * ⚠ ONE WORD FOR THE COURSE'S ROWS — 2026-11-12: "Use Lessons instead of
 * sections. and update that data point on the Overview to show the total
 * count."
 */
describe('the course counts in lessons', () => {
  it('leads the Overview’s next step with the course’s own count, not an invented 3', () => {
    /* It read "3 sections" on every state — a placeholder for a sub-structure
       the course list does not have. */
    expect(REFINED_NEXT_META.parts).toBe(`${REFINED_COURSE_TOTALS.lessons} Lessons`)
    expect(REFINED_NEXT_META.parts).not.toMatch(/section/i)
  })

  it('and says the same figure the Your Course eyebrow leads with', () => {
    expect(REFINED_COURSE_HEADER.eyebrow.startsWith(REFINED_NEXT_META.parts)).toBe(true)
  })
})

/**
 * ⚠ THE LESSONS FIGURE IS COUNTED, NOT SCALED — 2026-11-12: "make the
 * Lessons # match that there is 21 lessons total, based on the design tool
 * progress indicator selected it should update accordingly."
 */
describe('lessons finished, out of twenty-one', () => {
  it('counts the chapters the page marks done, at every stage', () => {
    for (const pct of [0, 19, 50, 81, 100]) {
      const view = refinedCourseView(refinedProgressAt(pct))
      expect(view.header.lessons).toBe(21)
      /* The figure and the rows cannot disagree: it IS the rows. */
      expect(view.header.lessonsDone).toBe(
        view.chapters.filter((c) => c.state === 'done').length,
      )
      expect(view.header.lessonsDone).toBeLessThanOrEqual(21)
    }
  })

  it('moves with the stage and never goes backwards', () => {
    let last = -1
    for (let pct = 0; pct <= 100; pct += 1) {
      const n = refinedCourseView(refinedProgressAt(pct)).header.lessonsDone
      expect(n, `${pct}%`).toBeGreaterThanOrEqual(last)
      last = n
    }
    expect(last).toBe(21)
  })

  it('is the eyebrow’s own number — one word, one total', () => {
    const view = refinedCourseView(refinedProgressAt(19))
    expect(view.header.eyebrow.startsWith(`${view.header.lessons} Lessons`)).toBe(true)
  })
})
