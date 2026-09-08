import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InlineStudyCalendar } from './InlineStudyCalendar'

/**
 * Covers the create-task entry points in the Daily task rail:
 *   - empty + unfiltered day → the invitation card + "Create a custom task"
 *   - empty + a status filter active → the "No tasks match" message, no CTA
 *   - populated day → the normal list + the "Add a custom task" footer
 *
 * `xcel-fl-lh-prelicensing` carries XCEL's 20-day Life & Health study plan
 * (`XCEL_LH_STUDY_CALENDAR`), whose tasks run weekdays from 2026-05-11 to
 * 2026-06-11 — so 2026-05-16 is a weekend gap with none.
 *
 * It is also NOT the `study-calendar-state` flag path: that short-circuit into
 * the Create-Calendar harness is scoped to `series-79-15day` specifically,
 * which left with STC. The LMS used `series-79-calendar-first` here for exactly
 * the same reason — a real calendar that the flag does not intercept.
 */
const PATH_ID = 'xcel-fl-lh-prelicensing'
const POPULATED_DAY = '2026-05-11'
const EMPTY_DAY = '2026-05-16'

function renderCalendar(calDate: string) {
  return render(
    <MemoryRouter initialEntries={[`/my-learning/path?id=${PATH_ID}&calDate=${calDate}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <InlineStudyCalendar pathId={PATH_ID} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'xcel', membership: 'member' }),
  )
})

describe('InlineStudyCalendar — create-task entry points', () => {
  it('shows the invitation card (a clickable add-task surface) on an empty, unfiltered day', () => {
    renderCalendar(EMPTY_DAY)
    expect(screen.getByText(/nothing scheduled/i)).toBeInTheDocument()
    // The whole card is the add-task control (aria-label "Add a custom task").
    expect(
      screen.getByRole('button', { name: /^add task$/i }),
    ).toBeInTheDocument()
    // The filter-empty message must NOT be the empty treatment here.
    expect(screen.queryByText(/no tasks match the active filters/i)).toBeNull()
  })

  it('shows the filter message + Add Task when a filter empties the day', () => {
    renderCalendar(EMPTY_DAY)
    // Activate a status chip that yields zero results for this empty day.
    fireEvent.click(screen.getByRole('button', { name: /^completed$/i }))
    expect(
      screen.getByText(/no tasks match the active filters/i),
    ).toBeInTheDocument()
    // Not the empty-day invitation copy, but the Add Task control is present.
    expect(screen.queryByText(/nothing scheduled/i)).toBeNull()
    expect(screen.getByRole('button', { name: /^add task$/i })).toBeInTheDocument()
  })

  it('shows the "Add a custom task" footer on a populated day', () => {
    renderCalendar(POPULATED_DAY)
    // Populated → normal list, not the invitation card.
    expect(screen.queryByText(/nothing scheduled/i)).toBeNull()
    expect(
      screen.getByRole('button', { name: /^add task$/i }),
    ).toBeInTheDocument()
  })
})
