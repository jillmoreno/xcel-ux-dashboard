import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3,
  isQualifyingEducationVersion,
} from '@/data/dashboardVersions'
import {
  dashboardLayoutForVersion,
  hiddenRailSectionsFor,
} from '@/components/layout/dashboardRail'

/**
 * TESTING 3 — Testing, with the course and its coursework as ONE block.
 * 2026-10-01.
 *
 * The argument: "Current course" and "Complete coursework" are the same subject
 * in two columns. Both name the course; both say how far through it the learner
 * is — one as a percentage and a bar, the other as six stops with ticks. This
 * version says it once.
 *
 * ⚠ WHAT THIS FILE MOSTLY GUARDS IS THE INHERITANCE, not the new block. Testing
 * 3 exists to compare ONE thing, so every other difference from Testing is a
 * defect — and the way a cloned version rots is that a later change teaches
 * `testing` something and forgets `testing-3`, which nothing on screen would
 * show. The combined block is the easy half to test; the sameness is the half
 * that needs pinning.
 *
 * ⚠ IT IS NOT "Testing 2". That id (`discoverability-testing-2`) is an older,
 * archived version with a live Study Pace tile, which still resolves and is the
 * only route to the Study Pace Adjust sheet. The numbering carried on past it
 * rather than reusing it.
 */

const T3 = '/dashboard-rebrand?demo=1&version=discoverability-testing-3'
const T1 = '/dashboard-rebrand?demo=1&version=discoverability-testing'

function renderShell(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
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

const courseCard = () =>
  document.querySelector('section[aria-label="Current course"]') as HTMLElement

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.history.replaceState({}, '', '/dashboard-rebrand')
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('Testing 3 — the version itself', () => {
  it('is in the picker, directly after its parent', () => {
    /* The picker is the only place the lineage is visible, and reading them in
       order is what makes the one difference legible. */
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    expect(ids[ids.indexOf('discoverability-testing') + 1]).toBe('discoverability-testing-3')
  })

  it('did NOT take the archived Testing 2 id', () => {
    /* ⚠ THE WHOLE REASON THIS VERSION IS CALLED THREE. `testing-2` is archived
       from the picker but still resolves, still has its Archive row, and is the
       only route to the Study Pace Adjust sheet. Reusing the id would have
       broken all three silently. */
    expect(DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3.id).toBe('discoverability-testing-3')
    expect(dashboardLayoutForVersion('discoverability-testing-2')).toBe('testing-2')
    expect(dashboardLayoutForVersion('discoverability-testing-3')).toBe('testing-3')
  })

  it('resolves a qualifying journey and inherits Testing’s rail trim', () => {
    /* Two of the inheritances that are decided OUTSIDE the band, which is
       exactly where a clone forgets to follow. */
    expect(isQualifyingEducationVersion('discoverability-testing-3')).toBe(true)
    expect(hiddenRailSectionsFor('testing-3')).toEqual(hiddenRailSectionsFor('testing'))
  })
})

describe('the combined block', () => {
  it('puts the coursework stops inside the Current course card', () => {
    renderShell(T3)
    const card = within(courseCard())
    /* Both halves, one card: the course identity and action… */
    expect(card.getByText('Current course')).toBeTruthy()
    expect(card.getByRole('button', { name: /Resume|Start course/ })).toBeTruthy()
    /* …and the coursework that the percentage is made of. */
    expect(card.getByText('Complete Coursework')).toBeTruthy()
    expect(card.getByText(/Pre-Licensing Lessons/)).toBeTruthy()
    expect(card.getByText(/Survey & Certificate/)).toBeTruthy()
  })

  it('does NOT also leave a coursework card in the journey column', () => {
    /* ⚠ THE DEFECT THIS VERSION EXISTS TO REMOVE, reappearing as a bug. A
       combined block with the stops ALSO in the right column is the same list
       twice — worse than what it replaced, and nothing would throw. */
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Study journey"]')).toBeNull()
    expect(screen.getAllByText('Complete Coursework')).toHaveLength(1)
  })

  it('keeps the stops OUT of the course card on Testing', () => {
    /* The control arm. The direction a clone most easily breaks is the parent:
       a prop defaulted the wrong way would combine both versions and leave
       nothing to compare. */
    renderShell(T1)
    expect(within(courseCard()).queryByText('Complete Coursework')).toBeNull()
    expect(document.querySelector('section[aria-label="Study journey"]')).toBeTruthy()
  })
})

describe('the quick buttons', () => {
  it('move below the combined block, and appear exactly once', () => {
    /* ⚠ COUNTED, NOT JUST LOCATED. Moving them is a suppress-here/render-there
       pair, and the failure is two copies rather than none. */
    renderShell(T3)
    const tiles = screen.getAllByRole('navigation', { name: 'Learning areas' })
    expect(tiles).toHaveLength(1)
    /* Below the course card: same column, later in document order. */
    const card = courseCard()
    expect(card.compareDocumentPosition(tiles[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('leaves them above the journey column on Testing', () => {
    renderShell(T1)
    const tiles = screen.getAllByRole('navigation', { name: 'Learning areas' })
    expect(tiles).toHaveLength(1)
    /* On Testing they lead the RIGHT column, so the course card does not
       precede them in the way it does above — they are siblings of the journey,
       not of the course card. */
    expect(tiles[0].closest('section[aria-label="Current course"]')).toBeNull()
  })
})

describe('everything else is Testing’s', () => {
  /* ⚠ THE HALF THAT ACTUALLY ROTS. Each of these is a decision Testing makes
     that Testing 3 inherits rather than re-declares; a later change that
     teaches `testing` something new and forgets `testing-3` shows up here and
     nowhere on screen. */
  it('keeps the journey’s post-course steps as their own cards', () => {
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Pass State Exam"]')).toBeTruthy()
    expect(document.querySelector('section[aria-label="Get Licensed in New York"]')).toBeTruthy()
  })

  it('keeps the exam card and the Quick links card', () => {
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Exam Date"]')).toBeTruthy()
    expect(document.querySelector('section[aria-label="Quick links"]')).toBeTruthy()
  })

  it('drops Readiness from the rail, exactly as Testing does', () => {
    renderShell(T3)
    expect(screen.queryByRole('button', { name: 'Readiness' })).toBeNull()
  })
})
