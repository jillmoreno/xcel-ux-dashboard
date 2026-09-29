import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'

/**
 * `journey-step-order` — which step the right-hand column opens with.
 *
 * ⚠ THE NUMBERS ARE THE SEQUENCE. Four separate widgets cannot draw a
 * continuous spine, so the eyebrow numbering is the only thing telling a reader
 * these four cards are one route. An order change that renumbered nothing would
 * leave the column reading 2 · 1 · 3 · 4, which is worse than either order.
 * That is what these assert: the ORDER and the NUMBERS together.
 */

const URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`

beforeEach(() => {
  window.localStorage.clear()
  /* ⚠ RESET THE URL TOO, not just storage. `?ff=` is read from
     `window.location.search`, and any test that sets it with
     `history.replaceState` leaves it there for every test that follows —
     flags leaking forward and failing assertions in files nobody touched.
     Clearing localStorage alone is not a clean slate. */
  window.history.replaceState({}, '', '/')
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

/** ⚠ `?ff=` is read from `window.location`, never from the router entry. */
function renderShell(ff?: string) {
  window.history.replaceState({}, '', ff ? `/dashboard-rebrand?ff=${encodeURIComponent(ff)}` : '/')
  return render(
    <MemoryRouter initialEntries={[URL]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The journey column's card headings, in the order they appear on the page. */
function column(): string[] {
  return [...document.querySelectorAll('section[aria-label]')]
    .map((el) => el.getAttribute('aria-label') ?? '')
    .filter((n) => /Study journey|Exam Date|Pass State Exam|Get Licensed/i.test(n))
}

/**
 * The step number on the card with this `aria-label`.
 *
 * ⚠ BY LABEL, NOT BY TEXT. Matching `textContent` finds the OUTERMOST section
 * that happens to contain the phrase — the band wrapping all four cards — and
 * every lookup then returns the first number on the page. The first version of
 * this helper did exactly that and reported "1" for everything.
 */
function stepOf(label: string): string {
  /* Substring, because the arrival card's label carries the jurisdiction
     ("Get Licensed in New York") rather than the bare step title. */
  const card = document.querySelector(`section[aria-label*="${label}"]`)
  return /Step (\d+)/i.exec(card?.textContent ?? '')?.[1] ?? ''
}

describe('journey-step-order', () => {
  it('ships EXAM-FIRST, renumbered 1-2-3-4', () => {
    /* ⚠ PROMOTED 2026-09-28. This asserted `coursework-first` and failed the
       moment the baseline moved — the job it exists for. The numbering half is
       the part that matters and is unchanged in spirit: four separate widgets
       cannot draw a continuous spine, so the eyebrows ARE the sequence, and
       they still read 1-2-3-4 down the column in the new order. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'journey-step-order')
    expect(flag?.defaultVariant).toBe('exam-first')
    renderShell()
    /* ⚠ 'Exam Date', NOT 'Schedule State Exam'. Two promotions landed together
       and they interact: `exam-step-style: date-first` renamed this card, so a
       locator using the old label finds nothing and the failure reads as a
       missing STEP rather than a renamed card. */
    expect(stepOf('Exam Date')).toBe('1')
    expect(stepOf('Study journey')).toBe('2')
    expect(stepOf('Pass State Exam')).toBe('3')
    expect(stepOf('Get Licensed')).toBe('4')
  })

  it('still puts coursework first on `coursework-first`', () => {
    /* The old baseline, now the opt-in arm — and renumbered back the other
       way, which is the assertion that would catch a reorder that forgot the
       numbers. */
    renderShell('journey-step-order:coursework-first')
    expect(stepOf('Study journey')).toBe('1')
    expect(stepOf('Exam Date')).toBe('2')
    expect(stepOf('Pass State Exam')).toBe('3')
    expect(stepOf('Get Licensed')).toBe('4')
  })

  it('renders Schedule State Exam above the coursework card, not just renumbered', () => {
    /* Numbering alone would pass the test above while leaving the card in
       place — the column would read 2 · 1 · 3 · 4 down the page. */
    renderShell('journey-step-order:exam-first')
    const order = column()
    expect(order.findIndex((n) => /Exam Date/i.test(n))).toBeLessThan(
      order.findIndex((n) => /Study journey/i.test(n)),
    )
  })

  it('keeps the arrival card named for the destination in both orders', () => {
    /* ⚠ THE INDEX BUG THIS GUARDS. The heading used to key on
       `i === GET_LICENSED_STEPS.length - 1`. With `exam-first` the mapped array
       is a SLICE of two, so that index matches NOTHING and the arrival card
       loses its name entirely. It keys on the step's id now. */
    renderShell('journey-step-order:exam-first')
    expect(screen.getByText(/Get Licensed in New York/)).toBeTruthy()
  })
})
