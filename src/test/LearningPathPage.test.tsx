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
    // XCEL's active path is PRE-LICENSING, and it carries
    // `layoutVariant: 'study-calendar-in-tab'` — so the page renders the Study
    // Plan rather than the Mandatory/Elective sections, and Study Plan is the
    // selected tab. The LMS asserted the other shape here because CRE's active
    // path was CE, which has no calendar and defaults to Goal Tracker. Both are
    // correct; which one you get is the path's `layoutVariant`, so this test
    // now pins XCEL's arm of that fork.
    expect(screen.getByRole('heading', { name: /florida life & health pre-licensing/i }))
      .toBeInTheDocument()
    // Two tablists render on this layout — the page tabs and the study
    // calendar's own view switcher — so assert on the tab, not the container.
    expect(screen.getAllByRole('tablist').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: /study plan/i, selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /certificates/i })).toBeInTheDocument()
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
