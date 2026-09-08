import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CalendarDay } from '@/icons'
import { LearningPathPromoCard } from '@/components/learning/LearningPathPromoCard'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { LearningPathPage } from '@/pages/LearningPathPage'

const STORAGE_KEY = 'cgp.account'

beforeEach(() => {
  window.localStorage.clear()
})

describe('LearningPathPromoCard', () => {
  it('renders title and body', () => {
    render(
      <LearningPathPromoCard
        title="Stay on pace."
        body="Build a personalized study calendar."
      />,
    )
    expect(
      screen.getByRole('heading', { level: 3, name: /stay on pace/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/build a personalized study calendar/i),
    ).toBeInTheDocument()
  })

  it('omits the CTA when no cta prop is passed', () => {
    render(<LearningPathPromoCard title="Heads up" body="No action here." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('fires the CTA onClick when the button is clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <LearningPathPromoCard
        title="Stay on pace."
        body="Build a personalized study calendar."
        watermarkIcon={CalendarDay}
        cta={{ label: 'Create Study Plan', onClick }}
      />,
    )
    await user.click(screen.getByRole('button', { name: /create study plan/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe('LearningPathPage — Create Calendar promo (STC)', () => {
  function renderStc(calendarState: 'add' | 'edit' | 'locked' = 'add') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ brand: 'xcel', membership: 'member' }),
    )
    // The promo only shows on the "Add Calendar" variant of the
    // study-calendar-state flag (prompts creating a calendar).
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'study-calendar-state': { enabled: true, variant: calendarState } }),
    )
    return render(
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
  }

  it('leads the STC Mandatory carousel with a Create Calendar promo card', () => {
    renderStc()
    const heading = screen.getByRole('heading', { level: 3, name: /stay on pace/i })
    expect(heading).toBeInTheDocument()
    // Scope to the promo card — the Study Calendar tab also has a
    // "Create Calendar" CTA on the add variant.
    const promo = heading.closest('section') as HTMLElement
    expect(within(promo).getByRole('button', { name: /create study plan/i })).toBeInTheDocument()
  })

  it('opens the Create Study Plan slide-over when the CTA is clicked', async () => {
    const user = userEvent.setup()
    renderStc()
    const heading = screen.getByRole('heading', { level: 3, name: /stay on pace/i })
    const promo = heading.closest('section') as HTMLElement
    await user.click(within(promo).getByRole('button', { name: /create study plan/i }))
    // The panel mounts its own "Create Study Plan" heading + Save Study Plan CTA.
    expect(
      screen.getByRole('button', { name: /save study plan/i }),
    ).toBeInTheDocument()
  })

  it('does not render the promo card on non-"add" calendar-state variants', () => {
    renderStc('edit')
    expect(
      screen.queryByRole('button', { name: /create study plan/i }),
    ).not.toBeInTheDocument()
  })

  it('does not render the promo card for non-STC brands (CRE default)', () => {
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
    expect(
      screen.queryByRole('button', { name: /create study plan/i }),
    ).not.toBeInTheDocument()
  })
})
