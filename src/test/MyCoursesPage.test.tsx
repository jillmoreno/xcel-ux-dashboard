import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MyCoursesPage } from '@/pages/MyCoursesPage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as myCoursesFixtures from '@/data/myCoursesFixtures'
import { FIXTURE_TODAY, isRecentlyAdded, myCoursesFor } from '@/data/myCoursesFixtures'

// Default account brand is `cre` (see AccountContext.DEFAULT_STATE) — tests
// render without overriding, so we assert against the CRE library.
const MY_COURSES = myCoursesFor('cre')

// Anchor the system clock to the same fixed "today" the fixtures were
// authored against so the Recently Added window is deterministic across
// runs. Tests using setSystemTime push it further or pull it back from
// here.

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location" data-search={location.search} />
}

// The Card / Table view toggle is gated behind the `courses-table-view` flag
// (off by default). Seed it on before rendering the View-toggle tests.
function enableTableView() {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'courses-table-view': { enabled: true } }),
  )
}

function renderAt(path: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/my-learning/courses"
              element={
                <>
                  <MyCoursesPage />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  // Clear persisted account so each test starts on the default brand (cre).
  window.localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(FIXTURE_TODAY)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('MyCoursesPage', () => {
  it('renders page title, search, and pill tabs', () => {
    renderAt('/my-learning/courses')
    expect(screen.getByRole('heading', { level: 1, name: /my courses/i })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /search courses/i })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: /filter by status/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /view all/i, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /completed/i })).toBeInTheDocument()
  })

  it('changes status pill when clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderAt('/my-learning/courses')
    const completed = screen.getByRole('tab', { name: /^completed$/i })
    await user.click(completed)
    expect(completed).toHaveAttribute('aria-selected', 'true')
  })

  it('reads initial state from URL params', () => {
    // `status=archived` used to select a sixth pill. Archived is a LOCATION now
    // (axis E), so it has its own param and its own control — the status strip
    // is statuses only. The legacy URL still resolves; see
    // ArchivedCollection.test.tsx for that translation.
    renderAt('/my-learning/courses?status=completed&sort=alpha')
    expect(screen.getByRole('tab', { name: /^completed$/i, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('alpha')
  })
})

describe('Recently Added tab', () => {
  it('renders when at least one fixture is within the 15-day window', () => {
    renderAt('/my-learning/courses')
    expect(screen.getByRole('tab', { name: /^recently added$/i })).toBeInTheDocument()
  })

  it('is hidden when no fixture qualifies (isRecentlyAdded returns false for all)', () => {
    // The component anchors to the fixture-driven FIXTURE_TODAY rather than
    // the host clock, so simulate "no qualifying records" by stubbing the
    // helper itself instead of advancing system time.
    vi.spyOn(myCoursesFixtures, 'isRecentlyAdded').mockReturnValue(false)
    renderAt('/my-learning/courses')
    expect(screen.queryByRole('tab', { name: /^recently added$/i })).toBeNull()
  })

  it('clicking the tab filters to only recently-added records and the result count matches', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderAt('/my-learning/courses')
    await user.click(screen.getByRole('tab', { name: /^recently added$/i }))
    const expected = MY_COURSES.filter((c) => isRecentlyAdded(c, FIXTURE_TODAY)).length
    expect(expected).toBeGreaterThan(0)
    expect(
      screen.getByText(new RegExp(`^${expected} Result${expected === 1 ? '' : 's'}$`, 'i')),
    ).toBeInTheDocument()
  })

  it('?status=recently-added with zero qualifying records falls back to Current and clears the param', async () => {
    vi.spyOn(myCoursesFixtures, 'isRecentlyAdded').mockReturnValue(false)
    renderAt('/my-learning/courses?status=recently-added')
    // Wait a microtask for the effect to flush.
    await Promise.resolve()
    const probe = await screen.findByTestId('location')
    expect(probe.getAttribute('data-search') ?? '').not.toMatch(/status=recently-added/)
    expect(screen.getByRole('tab', { name: /^view all$/i, selected: true })).toBeInTheDocument()
  })
})

describe('View toggle', () => {
  it('defaults to card view; clicking Table swaps the list to a <table>', async () => {
    enableTableView()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderAt('/my-learning/courses')
    expect(screen.getByRole('button', { name: /card view/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('table')).toBeNull()
    await user.click(screen.getByRole('button', { name: /table view/i }))
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('?view=table deep link renders the table on first paint', () => {
    enableTableView()
    renderAt('/my-learning/courses?view=table')
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /table view/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('table renders seven columns; the Course Name column folds in Type/Credit Type/Hours', () => {
    enableTableView()
    renderAt('/my-learning/courses?view=table')
    const headerCells = screen.getAllByRole('columnheader')
    expect(headerCells).toHaveLength(7)
    expect(headerCells[0]).toHaveTextContent(/course name/i)
    expect(headerCells[0]).toHaveTextContent(/course type \/ credit type \/ credit hours/i)
    expect(headerCells[1]).toHaveTextContent(/state.*receiving credit/i)
    expect(headerCells[2]).toHaveTextContent(/course progress/i)
    expect(headerCells[3]).toHaveTextContent(/enrollment\s+date/i)
    expect(headerCells[4]).toHaveTextContent(/course\s+expiration/i)
    expect(headerCells[5]).toHaveTextContent(/days to\s+complete/i)
    expect(headerCells[6]).toHaveTextContent(/course\s+status/i)
    const sample = MY_COURSES.find((c) => c.myStatus === 'in-progress')
    if (!sample) throw new Error('Expected an in-progress fixture')
    const link = screen.getByRole('link', { name: sample.title })
    const row = link.closest('tr') as HTMLTableRowElement
    expect(row).not.toBeNull()
    const cells = within(row).getAllByRole('cell')
    expect(cells).toHaveLength(7)
    // Course Name cell carries the inline meta (delivery label, credit type, hours).
    expect(cells[0]).toHaveTextContent(/elective|mandatory/i)
    expect(cells[0].textContent).toContain(String(sample.hours))
    // Course Progress cell shows the progress bar.
    expect(within(cells[2]).getByRole('progressbar')).toBeInTheDocument()
    // Course Status cell (last) shows the In Progress label.
    expect(cells[6]).toHaveTextContent(/in progress/i)
  })

  it('table view has no per-row Course Actions kebab', () => {
    enableTableView()
    renderAt('/my-learning/courses?view=table')
    expect(screen.queryByRole('button', { name: /more actions for/i })).toBeNull()
  })
})

describe('isRecentlyAdded', () => {
  const now = new Date(2026, 4, 11) // 2026-05-11, local
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const dayOffset = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() - n)
    return fmt(d)
  }

  it('returns true for a record enrolled today (day 0)', () => {
    expect(isRecentlyAdded({ enrolledAt: dayOffset(0) }, now)).toBe(true)
  })

  it('returns true for day 14', () => {
    expect(isRecentlyAdded({ enrolledAt: dayOffset(14) }, now)).toBe(true)
  })

  it('returns true for day 15 (inclusive)', () => {
    expect(isRecentlyAdded({ enrolledAt: dayOffset(15) }, now)).toBe(true)
  })

  it('returns false for day 16', () => {
    expect(isRecentlyAdded({ enrolledAt: dayOffset(16) }, now)).toBe(false)
  })

  it('returns false for a future date', () => {
    expect(isRecentlyAdded({ enrolledAt: dayOffset(-1) }, now)).toBe(false)
  })
})
