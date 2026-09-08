import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { RecommendedForYouPanel } from '@/components/dashboard/recommended/RecommendedForYouPanel'

/**
 * Card treatment on the Recommended-for-You *page* (the Dashboard Rebrand
 * Explore-rail section, which passes `catalogCards`):
 *   - `catalogCards` → the full-size Course Catalog cards. FIXED, not flagged:
 *     the `recommended-page-cards` flag and its compact "shelf cards (match
 *     Home)" arm were retired, so the page always renders catalog cards.
 *   - no prop → the original plain shelf cards (every other caller: the classic
 *     dashboard Recommended tab + the /membership Recommended tab).
 *
 * Discriminator: catalog cards render `.cre-course-card`; the SimpleCard shelf
 * cards never do, and plain shelf cards carry no rating meta row.
 */

function seedAccount() {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', membership: 'member' }))
}
function renderPanel(catalogCards: boolean) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <RecommendedForYouPanel catalogCards={catalogCards} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

function seedFlags(map: Record<string, { enabled?: boolean; variant?: string }>) {
  window.localStorage.setItem('cgp.featureFlags', JSON.stringify(map))
}
function renderPanelWithFilters() {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <RecommendedForYouPanel catalogCards showFilters />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('RecommendedForYouPanel — card treatment', () => {
  it('keeps the plain shelf cards without catalogCards (classic dashboard / membership callers)', () => {
    seedAccount()
    const { container } = renderPanel(false)
    expect(container.querySelector('.cre-course-card')).toBeNull()
    expect(screen.queryByLabelText(/rated .* out of 5/i)).toBeNull()
  })

  it('always renders the full-size Course Catalog cards with catalogCards', () => {
    seedAccount()
    const { container } = renderPanel(true)
    expect(container.querySelectorAll('.cre-course-card').length).toBeGreaterThan(0)
  })

  it('has no card-style flag left to change it', () => {
    seedAccount()
    // The retired flag's old values must not resurrect the compact shelf cards.
    seedFlags({ 'recommended-page-cards': { enabled: true, variant: 'shelf' } })
    const { container } = renderPanel(true)
    expect(container.querySelectorAll('.cre-course-card').length).toBeGreaterThan(0)
  })
})

describe('RecommendedForYouPanel — Profession + State Licensed In filters', () => {
  it('shows no filter rows without showFilters, even with the flags on multiple', () => {
    seedAccount()
    seedFlags({ 'profession-count': { variant: 'multiple' }, 'state-count': { variant: 'multiple' } })
    renderPanel(true) // catalogCards, but showFilters omitted
    expect(screen.queryByRole('tablist', { name: /filter by state licensed in/i })).toBeNull()
    expect(screen.queryByRole('tablist', { name: /filter by profession/i })).toBeNull()
  })

  it('renders both rows (license-driven) — full state names, no "All", no counts', () => {
    seedAccount()
    seedFlags({
      'profession-count': { enabled: true, variant: 'multiple' },
      'state-count': { enabled: true, variant: 'multiple' },
    })
    renderPanelWithFilters()
    expect(screen.getByRole('tablist', { name: /filter by profession/i })).toBeInTheDocument()
    expect(screen.getByRole('tablist', { name: /filter by state licensed in/i })).toBeInTheDocument()
    // No "All" pill; states are FULL names (California), not abbreviations (CA).
    expect(screen.queryByRole('tab', { name: 'All' })).toBeNull()
    expect(screen.getByRole('tab', { name: 'California' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'CA' })).toBeNull()
    // Default selection: first profession (Nursing) + first licensed state (California).
    expect(screen.getByRole('tab', { name: 'Nursing' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'California' })).toHaveAttribute('aria-selected', 'true')
  })

  it('offers Nursing / Occupational Therapy / Physical Therapy profession pills (no counts)', () => {
    seedAccount()
    seedFlags({ 'profession-count': { enabled: true, variant: 'multiple' } })
    renderPanelWithFilters()
    // Options come from the learner's licenses (Elite = Nursing / OT / PT).
    expect(screen.getByRole('tab', { name: 'Nursing' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Occupational Therapy' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Physical Therapy' })).toBeInTheDocument()
  })

  it('still renders the State Licensed In row when state-count is single (one selected pill)', () => {
    seedAccount()
    // The filter block hides both rows only when profession AND state are both
    // single (nothing to filter), so make profession multiple to keep the block
    // — then state-count = single shows the State row with its one selected pill.
    seedFlags({
      'profession-count': { enabled: true, variant: 'multiple' },
      'state-count': { enabled: true, variant: 'single' },
    })
    renderPanelWithFilters()
    expect(screen.getByRole('tablist', { name: /filter by state licensed in/i })).toBeInTheDocument()
    // single → only the first licensed state (California) shows, as the selected pill.
    expect(screen.getByRole('tab', { name: 'California' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByRole('tab', { name: 'Florida' })).toBeNull()
  })
})
