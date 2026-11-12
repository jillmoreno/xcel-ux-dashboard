import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassRefinedLearn } from '@/components/learning/CompassRefinedLearn'
import {
  REFINED_DEFAULT_VIEW,
  refinedCourseView,
} from '@/components/learning/compassRefinedLearnCourse'
import {
  COURSE_DEFAULTS,
  type CourseOptions,
} from '@/components/learning/compassRefinedCourseModel'
import {
  isResuming,
  refinedNextStep,
} from '@/components/learning/compassRefinedNextStepModel'
import {
  REFINED_COURSE_SECTIONS,
  refinedProgressAt,
} from '@/data/compassRefinedCourse'
import { REFINED_COURSE } from '@/data/compassRefinedCopy'

/* ⚠ RENDERED WITH NO STAGE, so the page draws the upload's own learner — one
   section done, the second open — and these are that learner's chapters. A
   stage would be a second thing under test. */
const REFINED_CHAPTERS = REFINED_DEFAULT_VIEW.chapters

/**
 * THE YOUR COURSE AUDIT, 2026-11-12 — findings 1, 2, 7 and 8.
 *
 * ⚠ WHAT IS WORTH PINNING IS WHAT A LEARNER CAN SEE, which is why this suite
 * renders rather than reading the model. Three of the four findings are about
 * a row existing, not about a value: a chevron over nothing, a locked row
 * that does not say what opens it, nineteen rows of wall. A model assertion
 * would have passed on every one of them.
 */

function wrap() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassRefinedLearn />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('finding 1 · the locked run is folded', () => {
  it('shows what is open and two locked chapters, not all twenty-one', () => {
    const { container } = wrap()
    const rows = container.querySelectorAll('.crf-ch')
    expect(rows.length).toBeLessThan(REFINED_CHAPTERS.length)
    /* The peek: every chapter that is not locked, then two that are. */
    expect(container.querySelectorAll('.crf-ch--locked')).toHaveLength(2)
  })

  it('says how many are behind the control, and opens them', () => {
    const { container } = wrap()
    const more = screen.getByRole('button', { name: /Show all \d+ chapters/ })
    const hidden = REFINED_CHAPTERS.length - container.querySelectorAll('.crf-ch').length
    expect(more.textContent).toContain(`${hidden} more, locked`)

    fireEvent.click(more)
    expect(container.querySelectorAll('.crf-ch')).toHaveLength(REFINED_CHAPTERS.length)
    /* ⚠ AND IT GOES BACK. A fold a learner cannot undo is a cut. */
    fireEvent.click(screen.getByRole('button', { name: /Show less/ }))
    expect(container.querySelectorAll('.crf-ch').length).toBeLessThan(REFINED_CHAPTERS.length)
  })
})

describe('finding 2 · a locked chapter says what opens it', () => {
  it('names the row before it rather than saying only “Locked”', () => {
    const { container } = wrap()
    const locked = [...container.querySelectorAll('.crf-ch--locked')]
    expect(locked.length).toBeGreaterThan(0)
    for (const row of locked) {
      const status = row.querySelector('.crf-ch__status')?.textContent ?? ''
      expect(status, 'a locked chapter with no sentence').toMatch(/^Opens when .+ is complete$/)
      expect(status).not.toBe('Locked')
    }
  })
})

describe('finding 8 · nothing expands onto nothing', () => {
  it('gives the Course Introduction no chevron, having no lessons and no exam', () => {
    const { container } = wrap()
    const intro = container.querySelector('.crf-ch')!
    expect(within(intro as HTMLElement).queryByRole('button', { name: /Expand/ })).toBeNull()
    expect(intro.querySelector('.crf-chev--none')).toBeTruthy()
  })

  it('and keeps one for every chapter that has something behind it', () => {
    const { container } = wrap()
    for (const row of container.querySelectorAll('.crf-ch')) {
      const title = row.querySelector('.crf-ch__title')?.textContent ?? ''
      const chapter = REFINED_CHAPTERS.find((c) => c.title === title)!
      expect(!!row.querySelector('.crf-chev:not(.crf-chev--none)'), title).toBe(chapter.expandable)
    }
  })
})

describe('the exam inside a chapter tells the chapter’s own story', () => {
  it('does not mark an exam complete inside a chapter in progress', () => {
    /* His fixture's Chapter 1 was finished, so its exam carried done: true —
       rendered under a chapter marked In progress with seven lessons still
       to do. */
    const current = REFINED_CHAPTERS.find((c) => c.state === 'current')!
    expect(current.exam?.done).toBe(false)
    expect(current.exam?.locked).toBe(true)
    expect(current.exam?.note).toBe(`Opens after all ${current.lessons.length} lessons`)
  })
})

/**
 * THE ROADMAP ARM — `compass-course-rows: cards`, 2026-11-12.
 *
 * ⚠ WHAT IS WORTH PINNING IS WHAT THE FORK COULD LOSE. The rows layout earns
 * findings 2 and 8 in its markup; a second layout can draw the same course
 * and quietly drop the sentence that says what opens a chapter, or offer a
 * Details link over an empty chapter. Both held here against the arm.
 */
function wrapWith(course: Partial<CourseOptions>) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassRefinedLearn course={{ ...COURSE_DEFAULTS, ...course }} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('the roadmap layout', () => {
  it('numbers the chapters the way the course does, and marks what is not one', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    const chips = [...container.querySelectorAll('.crf-map__chip')]
    /* The Course Introduction is the first row and is NOT Chapter 1 —
       numbering by position put "00" on it and shifted every chapter. */
    expect(chips[0].textContent).toBe('')
    expect(chips[1].textContent).toBe('01')
    expect(chips[2].textContent).toBe('02')
    /* The Florida laws row carries no chapter number in the course list. */
    expect(chips.at(-1)?.textContent).toBe('')
  })

  it('carries no “opens when” line — removed from the cards on 2026-11-12', () => {
    /* ⚠ A DELIBERATE REVERSAL OF FINDING 2 ON THIS LAYOUT ONLY: "remove this
       line from all the sections". On a card the padlock and the Locked pill
       say the state, and twenty-one cards each ending in a near-identical
       sentence is finding 1's wall in prose. */
    const { container } = wrapWith({ rows: 'cards', fold: false })
    expect(container.querySelectorAll('.crf-map__opens')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/Opens when .+ is complete/)
  })

  it('and the rows layout still does — that is where finding 2 was raised', () => {
    const { container } = wrapWith({ rows: 'list', fold: false })
    for (const row of container.querySelectorAll('.crf-ch--locked')) {
      expect(row.querySelector('.crf-ch__status')?.textContent).toMatch(
        /^Opens when .+ is complete$/,
      )
    }
  })

  it('keeps finding 8 — no Details link over an empty chapter', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    for (const card of container.querySelectorAll('.crf-map__card')) {
      const title = card.querySelector('.crf-map__title')?.textContent ?? ''
      const chapter = REFINED_CHAPTERS.find((c) => c.title === title)!
      expect(!!card.querySelector('.crf-map__details'), title).toBe(chapter.expandable)
    }
  })

  it('draws the same course as the rows layout — same chapters, same states', () => {
    const cards = wrapWith({ rows: 'cards', fold: false })
    const titles = (sel: string, root: HTMLElement) =>
      [...root.querySelectorAll(sel)].map((e) => e.textContent)
    const fromCards = titles('.crf-map__title', cards.container)
    cards.unmount()
    const rows = wrapWith({ rows: 'list', fold: false })
    expect(fromCards).toEqual(titles('.crf-ch__title', rows.container))
  })
})

describe('the two toggles', () => {
  it('draws no blurb by default, because every sentence is invented', () => {
    const { container } = wrapWith({ rows: 'cards' })
    expect(container.querySelectorAll('.crf-map__blurb')).toHaveLength(0)
    expect(COURSE_DEFAULTS.blurb).toBe(false)
  })

  it('and one per chapter when it is on, on either layout', () => {
    const cards = wrapWith({ rows: 'cards', blurb: true })
    expect(cards.container.querySelectorAll('.crf-map__blurb').length).toBeGreaterThan(0)
    cards.unmount()
    const rows = wrapWith({ rows: 'list', blurb: true })
    expect(rows.container.querySelectorAll('.crf-ch__blurb').length).toBeGreaterThan(0)
  })

  it('shows every chapter with the fold off, and no control', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    expect(container.querySelectorAll('.crf-map__card')).toHaveLength(REFINED_CHAPTERS.length)
    expect(container.querySelector('.crf-map__more')).toBeNull()
  })
})

/**
 * THE NEXT-STEP CARD — one component on two pages, 2026-11-12.
 *
 * "The Where you left off component should have all the same details as the
 * Your Next Step section on the Overview. This should be a 1:1."
 *
 * ⚠ 1:1 IS THE THING A TEST CAN HOLD AND AN EYE CANNOT. The two cards agree
 * today because they are one component; what this pins is that they keep
 * agreeing — a prop added to one page, a word taken from a stage fixture, and
 * they are two cards again.
 */
describe('the course card', () => {
  it('puts the course above the next step, in one card, with the chapters after', () => {
    const { container } = wrapWith({ rows: 'cards' })
    const card = container.querySelector('.crf-course--head')!
    const head = card.querySelector('.crf-course__head')!
    const step = card.querySelector('.crf-step')!
    expect(head.compareDocumentPosition(step) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    /* ⚠ THE OLD STRIP IS GONE, not hidden — it sat ABOVE the course header
       and carried its own copy of the lesson. */
    expect(container.querySelector('.crf-resume')).toBeNull()
  })

  it('draws the eyebrow, the button and the bar as one state', () => {
    /* ⚠ RENDERED WITHOUT A STAGE, so which of the two states draws is the
       default stage's business and not this test's. What must hold either
       way is that the three parts agree: a 0% bar under "Your next step"
       would say the learner has started something they have not, and
       "Resume lesson" with no bar is a resume with nothing to resume. */
    const { container } = wrapWith({ rows: 'list' })
    const eyebrow = container.querySelector('.crf-step__label')?.textContent
    const cta = container.querySelector('.crf-step__go')?.textContent ?? ''
    const bar = container.querySelector('.crf-step__bar')
    if (eyebrow === 'Where you left off') {
      expect(cta).toContain('Resume lesson')
    } else {
      expect(eyebrow).toBe('Your next step')
      expect(cta).toContain('Start lesson')
    }
    /* ⚠ THE TRACK IS ALWAYS THERE NOW — "include a progress bar, even if
       this section is Not Started at 0%". */
    expect(bar).not.toBeNull()
  })
})

describe('the next step’s two states follow the data, not the page', () => {
  it('is a next step between rows and a resume part way through one', () => {
    const between = refinedProgressAt(50) // 22 of 44 exactly
    expect(isResuming(between)).toBe(false)
    expect(refinedNextStep(between, '1h').eyebrow).toBe('Your next step')
    expect(refinedNextStep(between, '1h').cta).toBe('Start lesson')
    /* ⚠ A TRACK AT ZERO, NOT NO TRACK — 2026-11-12: "include a progress
       bar, even if this section is Not Started at 0%." */
    expect(refinedNextStep(between, '1h').lessonPct).toBe(0)

    const partway = refinedProgressAt(19) // 8.36 — most of a ninth row to go
    expect(isResuming(partway)).toBe(true)
    expect(refinedNextStep(partway, '1h').eyebrow).toBe('Where you left off')
    expect(refinedNextStep(partway, '1h').cta).toBe('Resume lesson')
    expect(refinedNextStep(partway, '1h').lessonPct).toBe(36)
  })

  it('always has a bar, and it is only filled when there is something to resume', () => {
    for (let pct = 0; pct <= 100; pct += 0.5) {
      const step = refinedNextStep(refinedProgressAt(pct), '1h')
      /* The track is always drawn; what varies is whether it has anything in
         it, and the words follow the same fact. */
      expect(step.lessonPct, `${pct}%`).toBeGreaterThanOrEqual(0)
      const started = step.lessonPct > 0
      expect(started, `${pct}%`).toBe(step.eyebrow === 'Where you left off')
      expect(started, `${pct}%`).toBe(step.cta === 'Resume lesson')
    }
  })

  it('names the row the learner is in, which is the one the page marks current', () => {
    for (const pct of [0, 19, 50, 81]) {
      const p = refinedProgressAt(pct)
      expect(refinedNextStep(p, '1h').title).toBe(
        REFINED_COURSE_SECTIONS.find((s) => s.n === p.currentN)?.title,
      )
    }
  })
})

describe('the course image toggle', () => {
  it('draws nothing by default', () => {
    const { container } = wrapWith({})
    expect(container.querySelector('.crf-course__art')).toBeNull()
    expect(COURSE_DEFAULTS.image).toBe(false)
  })

  it('puts the course’s own art left of its name when it is on', () => {
    const { container } = wrapWith({ image: true })
    const art = container.querySelector('.crf-course__art')!
    const name = container.querySelector('.crf-course__name')!
    expect(art.getAttribute('src')).toBe(REFINED_COURSE.image)
    expect(art.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    /* ⚠ DECORATIVE. The course's name is the next thing in the row. */
    expect(art.getAttribute('alt')).toBe('')
  })
})

describe('the roadmap’s quick filters', () => {
  it('names the list and counts it beside the strip, not on the pills', () => {
    const { container } = wrapWith({ rows: 'cards' })
    expect(container.querySelector('.crf-map__heading')?.textContent).toBe('Learning Roadmap')
    expect(container.querySelector('.crf-map__total')?.textContent).toBe(
      `${REFINED_CHAPTERS.length} Lessons Total`,
    )
    /* ⚠ THE REPO'S RULE for every segmented status filter: "no per-pill
       counts — show the total beside the strip". */
    for (const tab of container.querySelectorAll('[role="tablist"] button')) {
      expect(tab.textContent).not.toMatch(/\d/)
    }
  })

  it('keeps only the chapters the arm names, and drops the fold with it', () => {
    const { container } = wrapWith({ rows: 'cards' })
    const tab = (name: string) => screen.getByRole('tab', { name })

    fireEvent.click(tab('Completed'))
    const done = [...container.querySelectorAll('.crf-map__card')]
    expect(done.length).toBeGreaterThan(0)
    expect(done.every((c) => c.classList.contains('crf-map__card--done'))).toBe(true)
    /* ⚠ A FILTER IS A LEARNER ASKING FOR A SUBSET; handing back three of
       eleven behind a "Show all" control answers a question they did not
       ask. */
    expect(container.querySelector('.crf-map__more')).toBeNull()

    fireEvent.click(tab('In Progress'))
    for (const c of container.querySelectorAll('.crf-map__card')) {
      expect(c.classList.contains('crf-map__card--current')).toBe(true)
    }

    fireEvent.click(tab('All Modules'))
    expect(container.querySelector('.crf-map__more')).not.toBeNull()
  })
})

describe('the open chapter’s badge says whether it has been started', () => {
  /** The chapter's COURSE ROW (1..44), which is not its ordinal (1..21). */
  const rowOf = (fullTitle: string) =>
    REFINED_COURSE_SECTIONS.find((s) => s.title === fullTitle)!.n

  it('is Up Next standing at the start of it, In Progress part way through', () => {
    /* ⚠ THE SAME FACT THE CARD AT THE TOP OF THE PAGE READS — both come off
       `intoCurrent`, so the badge and the next-step card cannot tell
       different stories about one learner. */
    const fresh = refinedCourseView(refinedProgressAt(0))
    const freshOpen = fresh.chapters.find((c) => c.state === 'current')!
    expect(freshOpen.started).toBe(false)
    expect(refinedNextStep(refinedProgressAt(0), '1h').cta).toBe('Start lesson')

    const partway = refinedCourseView(refinedProgressAt(19))
    const openNow = partway.chapters.find((c) => c.state === 'current')!
    expect(openNow.started).toBe(true)
    expect(refinedNextStep(refinedProgressAt(19), '1h').cta).toBe('Resume lesson')
  })

  it('counts a chapter you are being examined on as started', () => {
    /* ⚠ `chapter.n` IS THE CHAPTER'S ORDINAL (1..21), NOT ITS COURSE ROW
       (1..44), and the two diverge from the second chapter on. The rule is
       about the ROW. Getting that wrong is how this test first read — it
       passed at 2% and failed at 25%. */
    for (let pct = 0; pct <= 100; pct += 0.5) {
      const p = refinedProgressAt(pct)
      const open = refinedCourseView(p).chapters.find((c) => c.state === 'current')
      if (!open) continue
      const started = p.done >= rowOf(open.fullTitle) || p.intoCurrent > 0
      expect(open.started, `${pct}%`).toBe(started)
    }
  })

  it('agrees with the next-step card, which reads the same fact', () => {
    for (let pct = 0; pct <= 100; pct += 0.5) {
      const p = refinedProgressAt(pct)
      const open = refinedCourseView(p).chapters.find((c) => c.state === 'current')
      /* ⚠ ONLY WHERE THE CARD IS TALKING ABOUT THIS CHAPTER. Standing on a
         chapter's exam makes the chapter started while the card is naming
         the exam, which is its own row and has its own progress. */
      if (!open || p.done >= rowOf(open.fullTitle)) continue
      const resuming = refinedNextStep(p, '1h').cta === 'Resume lesson'
      expect(open.started, `${pct}%`).toBe(resuming)
    }
  })

  it('never puts a started badge on a chapter that is not the open one', () => {
    for (const pct of [0, 19, 50, 81, 100]) {
      for (const c of refinedCourseView(refinedProgressAt(pct)).chapters) {
        if (c.state !== 'current') expect(c.started, `${c.title} at ${pct}%`).toBe(false)
      }
    }
  })

  it('draws the word on the card', () => {
    const { container } = wrapWith({ rows: 'cards' })
    const open = container.querySelector('.crf-map__card--current')
    if (!open) return
    const word = open.querySelector('.crf-map__pill')?.textContent
    expect(['Up Next', 'In Progress']).toContain(word)
  })
})
