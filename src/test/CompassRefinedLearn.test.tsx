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
import { journeyStage } from '@/components/learning/compassReadinessModel'

/* ⚠ RENDERED WITH NO STAGE, so the page draws the upload's own learner — one
   section done, the second open — and these are that learner's chapters. A
   stage would be a second thing under test. */
const REFINED_CHAPTERS = REFINED_DEFAULT_VIEW.chapters

/* ⚠ THE ROADMAP DRAWS THE COURSE'S CLOSING MODULES TOO since 2026-11-13
   ("Exam, Survey, and Certificate should all be their own modules"), so a
   test about CHAPTERS has to say so. */
const CHAPTER_CARDS = '.crf-map__card:not(.crf-map__card--finish)'

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
    /* ⚠ THE CHIP JOINED THE STATE TAG on 2026-11-12 ("made these a connected
       component with a little dot inbetween"); the number is the tag's mark
       now, and the selector moved with it. */
    const chips = [...container.querySelectorAll('.crf-map__mark')]
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

  it('keeps finding 8 — no chevron over an empty chapter, and its space held', () => {
    /* ⚠ THE CONTROL IS THE ROWS LAYOUT'S CHEVRON since 2026-11-12 ("use the
       same chevron logic used in the other variant"), where it was a
       "Details" link. Same rule either way: nothing to open, no control. */
    const { container } = wrapWith({ rows: 'cards', fold: false })
    for (const card of container.querySelectorAll(CHAPTER_CARDS)) {
      const title = card.querySelector('.crf-map__title')?.textContent ?? ''
      const chapter = REFINED_CHAPTERS.find((c) => c.title === title)!
      const chev = card.querySelector('.crf-chev:not(.crf-chev--none)')
      expect(!!chev, title).toBe(chapter.expandable)
      /* The space is held so the actions line up down the column. */
      expect(!!card.querySelector('.crf-chev'), title).toBe(true)
    }
  })

  it('draws the same course as the rows layout — same chapters, same states', () => {
    const cards = wrapWith({ rows: 'cards', fold: false })
    const titles = (sel: string, root: HTMLElement) =>
      [...root.querySelectorAll(sel)].map((e) => e.textContent)
    const fromCards = [...cards.container.querySelectorAll(CHAPTER_CARDS)].map(
      (c) => c.querySelector('.crf-map__title')?.textContent,
    )
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
    expect(container.querySelectorAll(CHAPTER_CARDS)).toHaveLength(REFINED_CHAPTERS.length)
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
    /* ⚠ IT COUNTS THE COURSE'S MODULES, NOT THE VISIBLE ONES — the chapters
       and the three closing steps, in the filter's own noun. It read "21
       Lessons Total" over twenty-four cards until 2026-11-13. A fold is
       about what is on screen; this is how many there are. */
    const modules = REFINED_DEFAULT_VIEW.chapters.length + REFINED_DEFAULT_VIEW.finish.length
    expect(container.querySelector('.crf-map__total')?.textContent).toBe(
      `${modules} Modules Total`,
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
    const done = [...container.querySelectorAll(CHAPTER_CARDS)]
    expect(done.length).toBeGreaterThan(0)
    expect(done.every((c) => c.classList.contains('crf-map__card--done'))).toBe(true)
    /* ⚠ A FILTER IS A LEARNER ASKING FOR A SUBSET; handing back three of
       eleven behind a "Show all" control answers a question they did not
       ask. */
    expect(container.querySelector('.crf-map__more')).toBeNull()

    fireEvent.click(tab('In Progress'))
    for (const c of container.querySelectorAll(CHAPTER_CARDS)) {
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
    /* The tag reads "04 · In Progress"; the word is what follows the mark. */
    const word = open.querySelector('.crf-map__state')?.textContent?.replace(/^\d*/, '')
    expect(['Up Next', 'In Progress']).toContain(word)
  })
})

describe('clicking a roadmap card expands it', () => {
  it('toggles from anywhere on the card, and only where there is something to open', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    const card = container.querySelector('.crf-map__card.is-clickable')!
    const details = card.querySelector('.crf-chev')!
    expect(details.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(card.querySelector('.crf-map__title')!)
    expect(details.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(card.querySelector('.crf-map__title')!)
    expect(details.getAttribute('aria-expanded')).toBe('false')

    /* ⚠ A CARD WITH NOTHING BEHIND ITS CHEVRON IS NOT CLICKABLE — it would
       be promising a click that does nothing. Finding 8, kept. */
    for (const c of container.querySelectorAll(CHAPTER_CARDS)) {
      const title = c.querySelector('.crf-map__title')?.textContent ?? ''
      const chapter = REFINED_CHAPTERS.find((x) => x.title === title)!
      expect(c.classList.contains('is-clickable'), title).toBe(chapter.expandable)
    }
  })

  it('leaves a click that lands on a button to that button', () => {
    /* ⚠ WITHOUT THE GUARD, Review would open the chapter AND expand the card
       under it, and Details would toggle twice and land back where it
       started. */
    const opened: string[] = []
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false }}
              onSelectPage={(p) => opened.push(p)}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const card = container.querySelector('.crf-map__card.is-clickable')!
    const details = card.querySelector('.crf-chev')!

    fireEvent.click(card.querySelector('.crf-btn')!)
    expect(opened).toEqual(['course'])
    expect(details.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(details)
    expect(details.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('a roadmap card’s label says what is inside the chapter', () => {
  it('reads “Chapter 1 · 7 Lessons · 1 Chapter Quiz” where the course knows', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    const labels = [...container.querySelectorAll('.crf-map__label')].map((e) => e.textContent)
    expect(labels).toContain('Chapter 1 · 7 Lessons · 1 Chapter Quiz')
  })

  it('says only what it knows — no “0 Lessons” on a chapter without them', () => {
    /* ⚠ THE LESSON COUNT IS JEFF'S OUTLINE, which covers ten of the
       twenty-one chapters by name. The rest say nothing rather than a zero. */
    const { container } = wrapWith({ rows: 'cards', fold: false })
    for (const card of container.querySelectorAll(CHAPTER_CARDS)) {
      const label = card.querySelector('.crf-map__label')?.textContent ?? ''
      expect(label).not.toMatch(/\b0 Lessons\b/)
      const title = card.querySelector('.crf-map__title')?.textContent ?? ''
      const chapter = REFINED_CHAPTERS.find((c) => c.title === title)!
      expect(/\d+ Lessons/.test(label), title).toBe(chapter.lessons.length > 0)
      expect(label.includes('1 Chapter Quiz'), title).toBe(!!chapter.exam)
    }
  })

  it('puts the name beside the tag, not under it', () => {
    /* ⚠ "Shift these to the right of the status tag so the module vertical
       height is reduced." The test that matters is that they share a row. */
    const { container } = wrapWith({ rows: 'cards', fold: false })
    const card = container.querySelector(CHAPTER_CARDS)!
    expect(card.querySelector('.crf-map__top .crf-map__name')).not.toBeNull()
    expect(card.querySelector('.crf-map__main > .crf-map__title')).toBeNull()
  })
})

describe('the completed run folds at the top', () => {
  /** A learner half way through: eleven chapters behind them. */
  const halfway = () =>
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards' }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('opens on the chapter the learner is in, not on what they have finished', () => {
    const { container } = halfway()
    /* ⚠ THE COUNT LEFT THE SENTENCE on 2026-11-13 — it is the tag on the
       right of the bar now ("have there be a tag indicating the completed
       modules in the right side"), so the accessible name is the label plus
       that tag's words. */
    const bar = screen.getByRole('button', { name: /Show completed modules/ })
    expect(bar).toBeTruthy()
    /* ⚠ THE POINT OF THE FOLD: the first card is not a finished one. */
    expect(container.querySelector('.crf-map__card--done')).toBeNull()

    fireEvent.click(bar)
    expect(container.querySelector('.crf-map__card--done')).not.toBeNull()
    expect(screen.getByRole('button', { name: /Hide completed modules/ })).toBeTruthy()
  })

  it('counts the leading run, and says it in the bar', () => {
    const { container } = halfway()
    const bar = screen.getByRole('button', { name: /completed modules/ })
    const n = Number(bar.textContent!.match(/\d+/)![0])
    fireEvent.click(bar)
    const done = container.querySelectorAll('.crf-map__card--done').length
    expect(done).toBe(n)
  })

  it('does not fold under the Completed filter — that would hide the ask', () => {
    const { container } = halfway()
    fireEvent.click(screen.getByRole('tab', { name: 'Completed' }))
    expect(screen.queryByRole('button', { name: /completed modules/ })).toBeNull()
    expect(container.querySelectorAll('.crf-map__card--done').length).toBeGreaterThan(0)
  })

  it('appears only when there is a run to fold, at every stage', () => {
    /* ⚠ A BAR READING "1 completed module" IN PLACE OF ONE CARD IS A SWAP,
       not a fold — so the control is gated on the run being two or more.
       Checked against what the course actually says at each stage rather
       than against a stage picked for its answer: q1 is nothing finished, q2
       four chapters, q3 eleven. */
    for (const stage of ['q1', 'q2', 'q3']) {
      const view = refinedCourseView(refinedProgressAt(journeyStage(stage).prog?.pct))
      const leadingDone = view.chapters.findIndex((c) => c.state !== 'done')
      const { unmount } = render(
        <MemoryRouter>
          <AccountProvider>
            <FeatureFlagProvider>
              <CompassRefinedLearn stage={stage} course={{ ...COURSE_DEFAULTS, rows: 'cards' }} />
            </FeatureFlagProvider>
          </AccountProvider>
        </MemoryRouter>,
      )
      const bar = screen.queryByRole('button', { name: /completed modules?/ })
      expect(!!bar, `${stage} has ${leadingDone} finished`).toBe(leadingDone >= 2)
      unmount()
    }
  })

  it('shows the whole course when the fold is off', () => {
    /* One control for both runs — "show me the whole course" has to mean the
       whole course, at both ends. */
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /completed modules/ })).toBeNull()
    expect(container.querySelectorAll(CHAPTER_CARDS)).toHaveLength(REFINED_CHAPTERS.length)
  })
})

describe('the roadmap mark — number or icon', () => {
  const draw = (chapterMark: 'number' | 'icon') =>
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false, chapterMark }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('numbers 01–19 across twenty-one modules — the mismatch this arm tests', () => {
    const { container } = draw('number')
    const marks = [...container.querySelectorAll(`${CHAPTER_CARDS} .crf-map__mark`)]
    const numbered = marks.filter((m) => /^\d\d$/.test(m.textContent ?? ''))
    expect(marks).toHaveLength(REFINED_CHAPTERS.length)
    /* Two rows carry no chapter number in the course list. */
    expect(numbered.length).toBe(REFINED_CHAPTERS.filter((c) => c.number).length)
    expect(numbered.length).toBeLessThan(marks.length)
  })

  it('drops every digit on the icon arm, and keeps the word', () => {
    const { container } = draw('icon')
    for (const mark of container.querySelectorAll(`${CHAPTER_CARDS} .crf-map__mark`)) {
      expect(mark.textContent).toBe('')
      expect(mark.querySelector('svg')).not.toBeNull()
    }
    /* ⚠ THE WORD SURVIVES — "still have the locked tag, but put it on the
       right next to the cta area." */
    const words = [...container.querySelectorAll(`${CHAPTER_CARDS} .crf-map__state--word`)]
    expect(words).toHaveLength(REFINED_CHAPTERS.length)
    expect(words.map((w) => w.textContent)).toContain('Locked')
  })

  it('puts the word ahead of the controls, not between them', () => {
    const { container } = draw('icon')
    const top = container.querySelector('.crf-map__card .crf-map__top')!
    const kids = [...top.children].map((e) => e.className)
    const word = kids.findIndex((c) => c.includes('state--word'))
    const chev = kids.findIndex((c) => c.includes('crf-chev'))
    expect(word).toBeGreaterThan(-1)
    expect(word).toBeLessThan(chev)
  })

  it('says the same words on both arms — only the mark changes', () => {
    const a = draw('number')
    const wordsA = [...a.container.querySelectorAll('.crf-map__state')].map((e) =>
      (e.textContent ?? '').replace(/^\d+/, ''),
    )
    a.unmount()
    const b = draw('icon')
    const wordsB = [...b.container.querySelectorAll('.crf-map__state--word')].map(
      (e) => e.textContent,
    )
    expect(wordsB).toEqual(wordsA)
  })
})

describe('the open chapter shows its own progress', () => {
  it('counts the chapter AND its exam, so finished lessons read half', () => {
    /* ⚠ THE SPAN IS WHAT A LEARNER MEANS BY "this chapter": finishing the
       lessons is half of it and the exam is the other half. A chapter whose
       lesson row is done and whose exam is not reads 50, which is the
       difference between "I am in it" and "I am through it". */
    const view = refinedCourseView(refinedProgressAt(journeyStage('q3').prog?.pct))
    const open = view.chapters.find((c) => c.state === 'current')!
    expect(open.pct).toBeGreaterThan(0)
    expect(open.pct).toBeLessThan(100)
  })

  it('is 100 behind the learner and 0 ahead of them', () => {
    const view = refinedCourseView(refinedProgressAt(journeyStage('q3').prog?.pct))
    for (const c of view.chapters) {
      if (c.state === 'done') expect(c.pct, c.title).toBe(100)
      if (c.state === 'locked') expect(c.pct, c.title).toBe(0)
    }
  })

  it('never runs backwards as the learner advances', () => {
    let last = -1
    for (let pct = 0; pct <= 100; pct += 1) {
      const view = refinedCourseView(refinedProgressAt(pct))
      const total = view.chapters.reduce((a, c) => a + c.pct, 0)
      expect(total, `${pct}%`).toBeGreaterThanOrEqual(last)
      last = total
    }
  })

  it('draws a bar on the open chapter and on no other', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const bars = container.querySelectorAll('.crf-map__bar')
    expect(bars).toHaveLength(1)
    expect(bars[0].closest('.crf-map__card')?.className).toContain('--current')
  })
})

describe('the completed fold carries its count as a tag', () => {
  it('puts the cards’ own tag on the right of the bar', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn stage="q3" course={{ ...COURSE_DEFAULTS, rows: 'cards' }} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const bar = container.querySelector('.crf-map__more--done')!
    const tag = bar.querySelector('.crf-map__more-tag')!
    /* The green a completed card wears, and the count it stands in for. */
    expect(tag.className).toContain('crf-map__state--done')
    expect(tag.textContent).toContain('Completed')
    const n = Number(tag.querySelector('.crf-map__mark')!.textContent)
    fireEvent.click(bar)
    expect(container.querySelectorAll('.crf-map__card--done')).toHaveLength(n)
  })
})

describe('the progress bar is a column, not a third line', () => {
  it('sits between the name and the controls on a roadmap card', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const top = container.querySelector('.crf-map__card--current .crf-map__top')!
    const kids = [...top.children].map((e) => e.className)
    const name = kids.findIndex((c) => c.includes('crf-map__name'))
    const bar = kids.findIndex((c) => c.includes('crf-map__bar'))
    /* ⚠ A CHILD OF THE ROW, NOT OF THE NAME BLOCK — under the title it made
       the open card taller than every other one. */
    expect(bar).toBeGreaterThan(name)
    expect(top.querySelector('.crf-map__name .crf-map__bar')).toBeNull()
  })

  it('leaves the next step’s own bar beside its words on the row, under them on the stack', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn stage="q3" course={{ ...COURSE_DEFAULTS }} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    /* Your Course draws the row arrangement; the words are wrapped so the
       bar can sit beside them. The Overview's stack keeps the wrapper inert
       — that card is in a 394px bay with no room for a column. */
    const step = container.querySelector('.crf-step--row')!
    expect(step.querySelector('.crf-step__textlines .crf-step__name')).not.toBeNull()
    expect(step.querySelector('.crf-step__textlines .crf-step__bar')).toBeNull()
    expect(step.querySelector('.crf-step__text > .crf-step__bar')).not.toBeNull()
  })
})

describe('the course’s closing steps are modules', () => {
  const roadmap = (chapterMark: 'number' | 'icon' | 'kind' = 'kind') =>
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false, chapterMark }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('draws them as the last three cards, in the course’s order', () => {
    const { container } = roadmap()
    const finish = [...container.querySelectorAll('.crf-map__card--finish')]
    expect(finish.map((c) => c.querySelector('.crf-map__title')?.textContent)).toEqual([
      'Final Exam',
      'Course Survey',
      'Certificate',
    ])
    /* ⚠ LAST, AND IN THE LIST — not a strip under it. */
    const all = [...container.querySelectorAll('.crf-map__card')]
    expect(all.slice(-3)).toEqual(finish)
  })

  it('marks each by what it IS, on every arm', () => {
    /* A padlock on all three would lose the only thing that tells an exam
       from a survey from a certificate. */
    for (const arm of ['number', 'icon', 'kind'] as const) {
      const { container, unmount } = roadmap(arm)
      for (const card of container.querySelectorAll('.crf-map__card--finish')) {
        expect(card.querySelector('.crf-map__mark svg'), arm).not.toBeNull()
        expect(card.querySelector('.crf-map__mark')?.textContent, arm).toBe('')
      }
      unmount()
    }
  })

  it('has nothing to expand, and holds the space', () => {
    const { container } = roadmap()
    for (const card of container.querySelectorAll('.crf-map__card--finish')) {
      expect(card.querySelector('.crf-chev:not(.crf-chev--none)')).toBeNull()
      expect(card.querySelector('.crf-chev--none')).not.toBeNull()
    }
  })
})

describe('the Type arm', () => {
  it('marks a chapter with a book and moves the state into the word tag', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false, chapterMark: 'kind' }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const card = container.querySelector(CHAPTER_CARDS)!
    /* ⚠ "includes the locked icon with this tag over here and the icon on
       the left indicates what the type of module is". */
    expect(card.querySelector('.crf-map__mark svg')).not.toBeNull()
    expect(card.querySelector('.crf-map__state--word svg')).not.toBeNull()
  })

  it('leaves the state arm’s word tag without a glyph', () => {
    const { container } = render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage="q3"
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false, chapterMark: 'icon' }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const card = container.querySelector(CHAPTER_CARDS)!
    expect(card.querySelector('.crf-map__state--word svg')).toBeNull()
  })
})

describe('a closing module’s button', () => {
  const at = (stage: string) =>
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassRefinedLearn
              stage={stage}
              course={{ ...COURSE_DEFAULTS, rows: 'cards', fold: false }}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('does not draw until the module is unlocked', () => {
    /* ⚠ "these will not display until the module is unlocked." They had been
       drawn disabled with a padlock, which is the EXAM STRIP's rule carried
       in with them — there the control is the only thing saying the exam
       exists. A locked CHAPTER has shown no button since this layout was
       built. */
    const { container } = at('q1')
    for (const card of container.querySelectorAll('.crf-map__card--finish')) {
      expect(card.className).toContain('--locked')
      expect(card.querySelector('.crf-btn')).toBeNull()
    }
  })

  it('and the verb follows the state once it does', () => {
    /* At 100% a completed Final Exam was offering "Take exam" — the same
       contradiction the chapter exams carried the day before. */
    const { container } = at('q5')
    const byTitle = (t: string) =>
      [...container.querySelectorAll('.crf-map__card--finish')].find(
        (c) => c.querySelector('.crf-map__title')?.textContent === t,
      )!
    expect(byTitle('Final Exam').querySelector('.crf-btn')?.textContent).toBe('Review exam')
    /* No word for going back to a survey that is not invented, and nothing a
       learner wants there. */
    expect(byTitle('Course Survey').querySelector('.crf-btn')).toBeNull()
    expect(byTitle('Certificate').querySelector('.crf-btn')?.textContent).toBe('Download')
  })
})
