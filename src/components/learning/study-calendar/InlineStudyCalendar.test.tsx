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
 * `series-79-calendar-first` reuses the default STUDY_CALENDAR (tasks on
 * 2026-05-06; 2026-05-09 is a weekend gap with none) and — unlike
 * `series-79-15day` — is NOT the `study-calendar-state` flag path, so it
 * never short-circuits into the Create-Calendar harness.
 */
const PATH_ID = 'series-79-calendar-first'
const POPULATED_DAY = '2026-05-06'
const EMPTY_DAY = '2026-05-09'

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
    JSON.stringify({ brand: 'stc', membership: 'member' }),
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
