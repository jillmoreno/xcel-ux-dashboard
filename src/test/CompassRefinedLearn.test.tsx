import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassRefinedLearn } from '@/components/learning/CompassRefinedLearn'
import { REFINED_CHAPTERS } from '@/components/learning/compassRefinedLearnCourse'

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
