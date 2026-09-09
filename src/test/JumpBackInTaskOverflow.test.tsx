import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The View-all overflow on the Jump Back In card's Today's Tasks variant, in
 * its own file because it needs a module mock.
 *
 * XCEL's study plan tops out at 3 tasks a day and today has 2, so the overflow
 * is unreachable from the fixture. Mocked rather than left untested — and
 * rather than tuning the visible count DOWN to the fixture, which would waste
 * card space on every ordinary day to make one state demonstrable.
 *
 * Own file because `vi.mock` is hoisted per module: applying it to
 * JumpBackInTodaysTasks.test.tsx would make that file's real-fixture
 * assertions read stub tasks instead.
 */
vi.mock('@/data/studyCalendarFixtures', async () => {
  const actual =
    await vi.importActual<typeof import('@/data/studyCalendarFixtures')>(
      '@/data/studyCalendarFixtures',
    )
  const real = actual.tasksOnDate(
    actual.studyCalendarFor('xcel-fl-lh-prelicensing'),
    actual.STUDY_CALENDAR_TODAY,
  )
  const many = Array.from({ length: 6 }, (_, i) => ({
    ...real[0],
    id: `stub-task-${i}`,
    title: `Stub task ${i}`,
  }))
  return { ...actual, tasksOnDate: () => many }
})

const { AccountProvider } = await import('@/context/AccountContext')
const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
const { LearnerFocusedBand } = await import('@/components/membership/v5/LearnerFocusedBand')
const { learningPathsFor } = await import('@/data/learningFixtures')

const PLANNED = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-prelicensing')!

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'clp-jump-back-in': { enabled: true, variant: 'todays-tasks' } }),
  )
})

function renderBand() {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <LearnerFocusedBand path={PLANNED} pathsCount={1} onViewDetails={vi.fn()} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

describe('Today’s Tasks — a day longer than the card', () => {
  it('truncates the list rather than growing the card', () => {
    renderBand()
    expect(screen.getByText('Stub task 0')).toBeInTheDocument()
    expect(screen.queryByText('Stub task 5')).toBeNull()
  })

  it('names the FULL day in the link once the list is truncated', () => {
    // The link is always present; the COUNT is what the overflow adds. It is
    // the whole day, not the hidden remainder — the learner is being told how
    // much there is, not how much is missing.
    renderBand()
    const viewAll = screen.getByRole('link', { name: /view all 6/i })
    expect(viewAll).toHaveAttribute('href', '/dashboard-rebrand?section=study-plan')
  })
})
