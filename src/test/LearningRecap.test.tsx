import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider, type Brand, type Membership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { MembershipLandingPage } from '@/pages/MembershipLandingPage'
import { LearningRecapPage } from '@/pages/LearningRecapPage'
import { LearningRecapTicket } from '@/components/membership/v2/LearningRecapTicket'
import { deriveArchetype } from '@/data/membership/learningAtAGlanceFixtures'

function seedAccount(brand: Brand, membership: Membership) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, membership }))
}

function renderAt(url: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <LearningPathsPanelProvider>
          <JumpBackInPanelProvider>
            <MemoryRouter initialEntries={[url]}>
              <Routes>
                <Route path="/membership" element={<MembershipLandingPage />} />
                <Route path="/membership/recap" element={<LearningRecapPage />} />
              </Routes>
            </MemoryRouter>
          </JumpBackInPanelProvider>
        </LearningPathsPanelProvider>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('LearningRecapBadge', () => {
  it('renders on the Elite member v2 view, teasing archetype/specialty/hours/streak', () => {
    seedAccount('elite', 'member')
    renderAt('/membership?version=v2')
    const badge = screen.getByRole('region', { name: 'Your year in learning' })
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Visual Deep-Diver')
    expect(badge).toHaveTextContent('Pharmacology')
    expect(badge).toHaveTextContent('42') // CE hours
    expect(badge).toHaveTextContent('7-wk')
    expect(badge).toHaveTextContent('certificates')
    // Action links to the recap route.
    const link = screen.getByRole('link', { name: /see your recap/i })
    expect(link).toHaveAttribute('href', '/membership/recap')
  })

  it('does not render for a non-member', () => {
    seedAccount('elite', 'non-member')
    renderAt('/membership?version=v2')
    expect(screen.queryByRole('region', { name: 'Your year in learning' })).not.toBeInTheDocument()
  })

  it('does not render for a non-Elite brand', () => {
    // Non-Elite falls back to v1, and the selector is null anyway.
    seedAccount('cre', 'member')
    renderAt('/membership?version=v2')
    expect(screen.queryByRole('region', { name: 'Your year in learning' })).not.toBeInTheDocument()
  })
})

function renderTicket() {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <LearningRecapTicket />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

describe('LearningRecapTicket', () => {
  it('renders the compact recap for an Elite member', () => {
    seedAccount('elite', 'member')
    renderTicket()
    const ticket = screen.getByRole('region', { name: 'Your year in learning' })
    expect(ticket).toBeInTheDocument()
    expect(ticket).toHaveTextContent('VISUAL DEEP-DIVER') // archetype label
    expect(ticket).toHaveTextContent('42') // CE hours
    expect(ticket).toHaveTextContent('CE HRS')
    expect(ticket).toHaveTextContent('7') // streak weeks
    expect(ticket).toHaveTextContent('WK STREAK')
    expect(ticket).toHaveTextContent('3') // certificates
    expect(ticket).toHaveTextContent('CERTS')
    expect(ticket).toHaveTextContent('Pharmacology') // top specialty
    const link = screen.getByRole('link', { name: /see your recap/i })
    expect(link).toHaveAttribute('href', '/membership/recap')
  })

  it('renders null for a non-member', () => {
    seedAccount('elite', 'non-member')
    const { container } = renderTicket()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders null for a non-Elite brand', () => {
    seedAccount('cre', 'member')
    const { container } = renderTicket()
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LearningRecapPage', () => {
  it('renders the full recap for an Elite member', () => {
    seedAccount('elite', 'member')
    renderAt('/membership/recap')
    expect(screen.getByRole('heading', { name: 'Your Learning Recap' })).toBeInTheDocument()
    expect(screen.getByText('The Visual Deep-Diver')).toBeInTheDocument()
    // 5 specialties.
    expect(screen.getByText('Pharmacology')).toBeInTheDocument()
    expect(screen.getByText('Pediatrics')).toBeInTheDocument()
    // Consistency stats.
    expect(screen.getByText('Current learning streak')).toBeInTheDocument()
    expect(screen.getByText('8–10 PM')).toBeInTheDocument()
    // Milestones.
    expect(screen.getByText('Courses completed')).toBeInTheDocument()
    expect(screen.getByText('18/30')).toBeInTheDocument()
    // Certificates highlight in the header.
    expect(screen.getByText(/certificates earned this year/i)).toBeInTheDocument()
  })

  it('redirects a non-member to /membership', () => {
    seedAccount('elite', 'non-member')
    renderAt('/membership/recap')
    // Redirected — recap heading absent; we land on the membership page.
    expect(screen.queryByRole('heading', { name: 'Your Learning Recap' })).not.toBeInTheDocument()
  })

  it('redirects a non-Elite brand to /membership', () => {
    seedAccount('cre', 'member')
    renderAt('/membership/recap')
    expect(screen.queryByRole('heading', { name: 'Your Learning Recap' })).not.toBeInTheDocument()
  })
})

describe('deriveArchetype', () => {
  const consistency = { ceHours: 42, streakWeeks: 7, peakTime: '8–10 PM', mostActiveDay: 'Sundays' }

  it('video-dominant + high hours → "The Visual Deep-Diver"', () => {
    expect(deriveArchetype({ video: 54, podcast: 26, reading: 20 }, consistency).label).toBe(
      'The Visual Deep-Diver',
    )
  })

  it('podcast-dominant → an "Audio" label', () => {
    expect(deriveArchetype({ video: 20, podcast: 60, reading: 20 }, consistency).label).toContain(
      'Audio',
    )
  })

  it('reading-dominant → a "Reader" label', () => {
    expect(deriveArchetype({ video: 20, podcast: 20, reading: 60 }, consistency).label).toContain(
      'Reader',
    )
  })
})
