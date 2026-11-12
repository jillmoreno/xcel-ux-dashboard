import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassRefinedLearn } from '@/components/learning/CompassRefinedLearn'
import { REFINED_DEFAULT_VIEW } from '@/components/learning/compassRefinedLearnCourse'
import {
  COURSE_DEFAULTS,
  type CourseOptions,
} from '@/components/learning/compassRefinedCourseModel'

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

  it('keeps finding 2 — a locked card says what opens it', () => {
    const { container } = wrapWith({ rows: 'cards', fold: false })
    for (const card of container.querySelectorAll('.crf-map__card--locked')) {
      expect(card.querySelector('.crf-map__opens')?.textContent).toMatch(
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
