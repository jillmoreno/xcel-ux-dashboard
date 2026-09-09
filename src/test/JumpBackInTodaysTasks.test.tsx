import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearnerFocusedBand } from '@/components/membership/v5/LearnerFocusedBand'
import { learningPathsFor } from '@/data/learningFixtures'
import {
  STUDY_CALENDAR_TODAY,
  studyCalendarFor,
  tasksOnDate,
} from '@/data/studyCalendarFixtures'

/**
 * `clp-jump-back-in` — the Jump Back In card's layout inside the Current
 * Learning Path band. "Up Next" lists not-started COURSES; "Today's Tasks"
 * compresses the resume block and lists today's tasks from the STUDY PLAN.
 */

/** A path that HAS a study plan, and one that deliberately does not. */
const PLANNED = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-prelicensing')!
const UNPLANNED = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-ce')!

function seed(variant: string) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'clp-jump-back-in': { enabled: true, variant } }),
  )
}

function renderBand(path = PLANNED) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <LearnerFocusedBand path={path} pathsCount={1} onViewDetails={vi.fn()} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('Jump Back In — Up Next (the shipped card)', () => {
  it('lists courses under "Up next", and no study-plan tasks', () => {
    seed('up-next')
    renderBand()
    expect(screen.getByText(/up next/i)).toBeInTheDocument()
    expect(screen.queryByText(/today's tasks/i)).toBeNull()
  })
})

describe("Jump Back In — Today's Tasks", () => {
  it('lists today’s tasks from THIS path’s plan', () => {
    seed('todays-tasks')
    renderBand()
    expect(screen.getByText(/today's tasks/i)).toBeInTheDocument()
    expect(screen.queryByText(/up next/i)).toBeNull()

    // The real tasks, read from the same resolver the page uses — asserting
    // the fixture's own titles rather than a copy that can drift.
    const tasks = tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY)
    expect(tasks.length).toBeGreaterThan(0)
    for (const t of tasks) {
      expect(screen.getByText(new RegExp(t.title.slice(0, 24), 'i'))).toBeInTheDocument()
    }
  })

  it('always offers View all, even on a day that fits — it is the route in', () => {
    // It used to appear only when the day overflowed, which made the way into
    // the Study Plan come and go with the workload. Today has two tasks and
    // they all show, so this is the non-overflowing case.
    seed('todays-tasks')
    renderBand()
    const tasks = tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY)
    expect(tasks.length).toBeLessThanOrEqual(3)
    const viewAll = screen.getByRole('link', { name: /view all/i })
    expect(viewAll).toHaveAttribute('href', '/dashboard-rebrand?section=study-plan')
    // …and it does NOT claim a count when nothing is hidden, which would imply
    // there is more behind it than the list already shows.
    expect(viewAll.textContent).not.toMatch(/\d/)
  })

  it('shows up to three tasks without overflowing the card', () => {
    // Three is the cap, and the card is sized for it — verified against the
    // plan's densest day (2026-06-11) by moving the clock there and measuring:
    // three rows, 85px still clear below, no overflow. Asserted here as the
    // cap, since the fixture's TODAY has two.
    seed('todays-tasks')
    renderBand()
    const rendered = screen.getAllByText(/·\s*\d+\s*min/)
    expect(rendered.length).toBeLessThanOrEqual(3)
    expect(rendered.length).toBe(
      Math.min(3, tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY).length),
    )
  })

  it('falls back to Up Next on a path with no plan — NOT another brand’s tasks', () => {
    /*
     * The regression this exists for. `studyCalendarFor` falls back to STC's
     * Series 79 plan for any id it does not know, and XCEL's CE path has no
     * plan by design — so the first build of this variant rendered "Complete
     * Greenlight 1", a securities task, under Florida Life & Health CE.
     * Nothing failed; it took looking at the page.
     */
    seed('todays-tasks')
    renderBand(UNPLANNED)
    expect(screen.queryByText(/greenlight/i)).toBeNull()
    expect(screen.queryByText(/today's tasks/i)).toBeNull()
    expect(screen.getByText(/up next/i)).toBeInTheDocument()
  })

})
