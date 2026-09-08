import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { CreateCalendarModal } from './CreateCalendarModal'
import { CreateCalendarDemoHarness } from '../CreateCalendarDemoHarness'
import { DEFAULT_STUDY_DAYS, type WeekDay } from './StudyDaysToggle'

/**
 * Snapshot tests for the three states of the Create Calendar flow:
 *
 *   1. Empty modal — initial open, every field at its default.
 *   2. Configured modal — all required fields satisfied, Save
 *      enabled, preview pane populated.
 *   3. Demo harness mount — confirms the harness auto-opens the
 *      modal with the empty form on mount.
 */

const EMPTY_STATE = {
  assignedCalendarId: '',
  omitNyseHolidays: false,
  startDate: '',
  studyDays: DEFAULT_STUDY_DAYS as WeekDay[],
  targetExamDate: '',
}

const CONFIGURED_STATE = {
  assignedCalendarId: 'series-7-greenlight',
  omitNyseHolidays: true,
  // Fixed date so the snapshot is deterministic — no `new Date()` in
  // the rendered output.
  startDate: '2026-05-28',
  studyDays: [1, 2, 3, 4, 5] as WeekDay[],
  targetExamDate: '',
}

describe('CreateCalendarModal', () => {
  it('renders the empty state with Save disabled', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    const onChange = vi.fn()
    const { asFragment } = render(
      <MemoryRouter>
        <CreateCalendarModal
          open
          onClose={onClose}
          onSave={onSave}
          formState={EMPTY_STATE}
          onChange={onChange}
        />
      </MemoryRouter>,
    )

    // Save Calendar is disabled when the form is empty.
    const saveBtn = screen.getByRole('button', { name: /save study plan/i })
    expect(saveBtn).toBeDisabled()

    // Preview pane shows the "No Calendar Selected" empty card.
    expect(screen.getByText(/no calendar selected/i)).toBeInTheDocument()

    expect(asFragment()).toMatchSnapshot()
  })

  it('renders the configured state with Save enabled and preview populated', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    const onChange = vi.fn()
    const { asFragment } = render(
      <MemoryRouter>
        <CreateCalendarModal
          open
          onClose={onClose}
          onSave={onSave}
          formState={CONFIGURED_STATE}
          onChange={onChange}
        />
      </MemoryRouter>,
    )

    // Save Calendar is enabled when both required fields are satisfied.
    const saveBtn = screen.getByRole('button', { name: /save study plan/i })
    expect(saveBtn).not.toBeDisabled()

    // 4-up stats now appear in the preview pane.
    expect(screen.getByText(/^tasks$/i)).toBeInTheDocument()
    expect(screen.getByText(/^study days$/i)).toBeInTheDocument()

    expect(asFragment()).toMatchSnapshot()
  })
})

describe('CreateCalendarDemoHarness', () => {
  it('auto-opens the modal in its empty state on mount', () => {
    const { asFragment } = render(
      <MemoryRouter>
        <CreateCalendarDemoHarness pathId="stc-create-calendar-demo" />
      </MemoryRouter>,
    )

    // Modal is open, Save is disabled, preview shows the empty card.
    expect(screen.getByRole('dialog', { name: /create study plan/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save study plan/i })).toBeDisabled()
    expect(screen.getByText(/no calendar selected/i)).toBeInTheDocument()

    expect(asFragment()).toMatchSnapshot()
  })
})
