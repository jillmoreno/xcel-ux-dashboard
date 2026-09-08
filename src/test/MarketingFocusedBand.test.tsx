import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { MarketingFocusedBand } from '@/components/membership/v5/MarketingFocusedBand'
import { learningPathsFor } from '@/data/learningFixtures'
import { whatsNewFeaturedFor } from '@/data/membership/whatsNewFeaturedFixtures'
import { DISCOVERABILITY_DASHBOARD_VERSIONS } from '@/data/dashboardVersions'

const PATH = learningPathsFor('elite')[0] // Florida Nursing — mandatory + elective
const SLIDES = whatsNewFeaturedFor('elite')

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'elite', membership: 'member' }),
  )
})

function renderBand() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <MarketingFocusedBand path={PATH} onViewDetails={vi.fn()} />
      </MemoryRouter>
    </AccountProvider>,
  )
}

describe('MarketingFocusedBand', () => {
  it('renders the compact Current Learning Path column (left half)', () => {
    renderBand()
    const band = screen.getByRole('region', { name: /your learning/i })
    expect(band).toBeInTheDocument()
    expect(screen.getByText(/current learning path/i)).toBeInTheDocument()
    expect(screen.getByText(PATH.title)).toBeInTheDocument()
    // License Expires / Time Remaining stat cards + Jump Back In card.
    expect(screen.getByText('License Expires')).toBeInTheDocument()
    expect(screen.getByText('Time Remaining')).toBeInTheDocument()
    expect(screen.getByText(/jump back in/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /details/i })).toBeInTheDocument()
  })

  it("renders the What's New marketing carousel (right half) with one dot per slide", () => {
    renderBand()
    expect(screen.getByText(/what's new/i)).toBeInTheDocument()
    // First slide leads.
    expect(screen.getByRole('heading', { name: SLIDES[0].title })).toBeInTheDocument()
    const dots = screen.getAllByRole('button', { name: /go to slide/i })
    expect(dots).toHaveLength(SLIDES.length)
  })

  it('switches slides when a dot is clicked', () => {
    renderBand()
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`go to slide 2: ${SLIDES[1].title}`, 'i') }))
    expect(screen.getByRole('heading', { name: SLIDES[1].title })).toBeInTheDocument()
  })

  it('shows a "Coming soon" stub instead of Jump Back In for discovery states', () => {
    render(
      <AccountProvider>
        <MemoryRouter>
          <MarketingFocusedBand path={PATH} onViewDetails={vi.fn()} jumpBackInMode="discovery" discoveryTone="completed" />
        </MemoryRouter>
      </AccountProvider>,
    )
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
    // The normal Jump Back In card is suppressed in the discovery state.
    expect(screen.queryByText(/jump back in/i)).toBeNull()
  })

  it('stays a contained card by default, but stretches full-bleed when bleed is set', () => {
    const { rerender } = renderBand()
    let band = screen.getByRole('region', { name: /your learning/i })
    expect(band.style.marginTop).toBe('') // contained — no top bleed
    expect(band.style.borderRadius).toBe('var(--radius-lg)')

    rerender(
      <AccountProvider>
        <MemoryRouter>
          <MarketingFocusedBand path={PATH} onViewDetails={vi.fn()} bleed />
        </MemoryRouter>
      </AccountProvider>,
    )
    band = screen.getByRole('region', { name: /your learning/i })
    expect(band.style.marginTop).toBe('-24px') // reaches the header
    expect(band.style.marginLeft).toBe('-40px') // reaches the rail
    expect(band.style.borderRadius).toBe('0px') // no card radius
  })
})

describe('Marketing Focused dashboard version', () => {
  it('leads the Discoverability version list (it is the default)', () => {
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS[0].id).toBe('discoverability-marketing-focused')
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS[0].label).toBe('Marketing Focused')
  })
})
