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
    expect(screen.getByRole('heading', { level: 2, name: /mandatory/i })).toBeInTheDocument()
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /goal tracker/i })).toBeInTheDocument()
    // CRE's active path is CE, so Goal Tracker is selected by default.
    expect(screen.getByRole('tab', { name: /goal tracker/i, selected: true })).toBeInTheDocument()
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
