import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider, FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { CompassRefinedShell } from '@/components/learning/CompassRefinedShell'
import { REFINED_PAGE_TITLES } from '@/data/compassRefinedCopy'
import { STUDY_CALENDAR, taskCompletion } from '@/data/studyCalendarFixtures'

/**
 * THE STUDY PLANNER'S `stc` ARM — 2026-11-13, `compass-planner-source`.
 *
 * `CompassRefinedShell.test` walks every page with the catalog's defaults, so
 * whichever arm is the default is the one it covers. This suite pins the
 * OTHER arm by passing the prop, so flipping the default never leaves one of
 * the two untested: the page keeps Refined's header shape, and the LMS Study
 * Plan's parts are the LMS's own — the stat band's numbers come from the
 * same fixture and helper the LMS reads, not from a copy.
 */

function wrap(planner: 'compass' | 'stc') {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassRefinedShell page="study-planner" onSelectPage={() => {}} planner={planner} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('the Study Planner on the STC model', () => {
  it('is a flag on the Refined surface, on the design bar, with both arms named', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-planner-source')
    expect(flag).toBeDefined()
    expect(flag?.surface).toBe('design')
    expect(flag?.surfaces).toEqual(['compass:refined'])
    expect(flag?.variants?.map((v) => v.value).sort()).toEqual(['compass', 'stc'])
  })

  it('keeps the Refined header: the eyebrow, then the title from the map, then one lead', () => {
    wrap('stc')
    const header = document.querySelector('header.crf-head')
    expect(header).not.toBeNull()
    const h1 = header!.querySelector('h1')
    expect(h1?.textContent).toBe(REFINED_PAGE_TITLES['study-planner'])
    /* The eyebrow is the header's one <p>; the lead sits after the header. */
    const eyebrow = header!.querySelector('.crf-head__eyebrow')
    expect(eyebrow?.nextElementSibling).toBe(h1)
    expect(header!.querySelectorAll('p')).toHaveLength(1)
    expect(header!.nextElementSibling?.classList.contains('crf-lead')).toBe(true)
  })

  it("shows the LMS stat band with the plan's own numbers", () => {
    wrap('stc')
    const { completed, total } = taskCompletion(STUDY_CALENDAR)
    const band = screen.getByLabelText('Plan at a glance')
    expect(within(band).getByText(String(completed))).toBeInTheDocument()
    expect(within(band).getByText(`/ ${total}`)).toBeInTheDocument()
  })

  it('opens on Today, filters by status, and marks a task done in place', () => {
    wrap('stc')
    const today = screen.getByRole('tab', { name: 'Today' })
    expect(today).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getByRole('tab', { name: 'All Tasks' }))
    expect(screen.getByRole('tab', { name: 'All Tasks' })).toHaveAttribute('aria-selected', 'true')
    const list = screen.getByLabelText('Tasks')
    expect(within(list).getAllByRole('listitem').length).toBe(STUDY_CALENDAR.tasks.length)

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }))
    const { completed } = taskCompletion(STUDY_CALENDAR)
    expect(within(list).getAllByRole('listitem').length).toBe(completed)
  })

  it('hides weekends to a five-column week', () => {
    wrap('stc')
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(screen.queryByText('Sun')).toBeNull()
    expect(screen.getByText('Mon')).toBeInTheDocument()
  })

  it('says what Add Task is instead of pretending', () => {
    wrap('stc')
    fireEvent.click(screen.getByRole('button', { name: /^add task$/i }))
    expect(screen.getByRole('status').textContent).toMatch(/not part of this prototype yet/)
  })

  it('leaves the Compass arm exactly as it was', () => {
    wrap('compass')
    expect(screen.queryByLabelText('Plan at a glance')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(REFINED_PAGE_TITLES['study-planner'])
  })
})
