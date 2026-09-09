import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { LearningPathPage } from '@/pages/LearningPathPage'
import { beforeEach, describe, it, expect } from 'vitest'

beforeEach(() => {
  // Reset persisted brand so each test renders against the default (cre).
  window.localStorage.clear()
})

describe('LearningPathPage', () => {
  it('renders path banner, mandatory section, and tabs', () => {
    render(
      <AccountProvider>
        <FeatureFlagProvider>
          <MemoryRouter>
            <LearningPathsPanelProvider>
              <LearningPathPage />
            </LearningPathsPanelProvider>
          </MemoryRouter>
        </FeatureFlagProvider>
      </AccountProvider>,
    )
    expect(screen.getByRole('heading', { name: /florida life & health pre-licensing/i }))
      .toBeInTheDocument()
    expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)

    // NO Study Plan tab — it moved to its own rail section on 2026-09-09
    // (`studyPlanHasOwnPage`). Asserted as absence so re-adding the tab without
    // removing the page, which would leave two doors to one surface, fails here.
    expect(screen.queryByRole('tab', { name: /study plan/i })).toBeNull()

    // …and Progress Tracker came BACK with the move, selected. It was hidden
    // for XCEL only because its stats showed in the band above the calendar;
    // that band went to the new page, so without this the pre-licensing learner
    // would have a one-tab bar and no progress view anywhere on this page.
    expect(
      screen.getByRole('tab', { name: /progress tracker/i, selected: true }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /certificates/i })).toBeInTheDocument()

    // …and the tab has REAL content, not the Goal Tracker placeholder.
    // `StudyProgressPanel` used to be keyed on `showStudyCalendar`, which was
    // doing double duty — "is the Study Plan a tab here" AND "does this brand
    // have study-plan progress" — so switching the tab off dropped this branch
    // through to the placeholder. A tab that comes back empty is worse than the
    // one-tab bar it was meant to fix, so the emptiness is what gets asserted.
    expect(screen.queryByText(/placeholder for now/i)).toBeNull()
    expect(screen.getByText(/20 day study plan/i)).toBeInTheDocument()
  })

  it('switches tabs on click', async () => {
    const user = userEvent.setup()
    render(
      <AccountProvider>
        <FeatureFlagProvider>
          <MemoryRouter>
            <LearningPathsPanelProvider>
              <LearningPathPage />
            </LearningPathsPanelProvider>
          </MemoryRouter>
        </FeatureFlagProvider>
      </AccountProvider>,
    )
    const certificates = screen.getByRole('tab', { name: /certificates/i })
    expect(certificates).toHaveAttribute('aria-selected', 'false')
    await user.click(certificates)
    expect(certificates).toHaveAttribute('aria-selected', 'true')
  })
})
