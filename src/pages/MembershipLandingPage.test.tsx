import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MembershipLandingPage } from '@/pages/MembershipLandingPage'

/**
 * Tests cover the six contracts in the build prompt:
 *
 *   1. Member view renders the personalized hero band + Tabs with
 *      four items.
 *   2. Default (no `?tab=`) is Recommended for you and the
 *      RecommendedForYouPanel content actually mounts (asserted via
 *      a stable shelf title like "My Interests").
 *   3. `?tab=library` switches to the LibraryPanel and renders the
 *      brand-appropriate hero + a populated results grid.
 *   4. Non-member view renders the upsell hero + plan tier strip and
 *      does NOT render the personalized hero band.
 *   5. Non-member Recommended tab wraps RecommendedForYouPanel in
 *      `<LockedPreview>` — assert on the lock pill's text.
 *   6. STC + member zero-state: hero stats render with the faded
 *      "Add your first course" meta caption (the prompt's contract
 *      treats `value: 0` as zero-state).
 *
 * Tests intentionally skip the locked-pill aria-label for tab 3
 * because the non-member tab content is checked separately in (5).
 */

/**
 * Test-only override that forces the AccountProvider's persisted
 * state. We can't pass props to AccountProvider directly, so we
 * write to localStorage before rendering — AccountProvider's
 * loadInitial reads from there.
 */
function seedAccount(brand: string, membership: 'member' | 'non-member') {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, membership }),
  )
}

/**
 * Renders the page at a given path with the AccountProvider wrapping
 * a MemoryRouter. We avoid AppLayout (and the slide-over panel
 * providers it owns) because none of those are touched by the
 * membership page itself.
 */
function renderAt(path: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/membership" element={<MembershipLandingPage />} />
          </Routes>
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('MembershipLandingPage — member view', () => {
  beforeEach(() => {
    // Default fixture (CRE / member) — explicit so the seed is
    // visible in each test, even though it matches the provider's
    // own default.
    seedAccount('cre', 'member')
  })

  it('renders MembershipHeroBand and the 5-item Tabs component', () => {
    renderAt('/membership')
    expect(
      screen.getByRole('region', { name: /membership overview/i }),
    ).toBeInTheDocument()
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(5)
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Recommended for you',
      'Resource Library',
      'VIP Partner Offerings',
      'Course Forums',
      'Community Posts',
    ])
  })

  it('switches to PartnerOfferingsPanel when ?tab=partner-offerings', () => {
    renderAt('/membership?tab=partner-offerings')
    // Page-level tab title reads "VIP Partner Offerings".
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /^vip partner offerings$/i,
      }),
    ).toBeInTheDocument()
    // The partner offerings region renders + carries a known CRE
    // fixture entry.
    expect(
      screen.getByRole('region', { name: /vip partner offerings/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /docusign for real estate/i }),
    ).toBeInTheDocument()
  })

  it('defaults to the Recommended tab and mounts RecommendedForYouPanel', () => {
    renderAt('/membership')
    // The Recommended tab is selected.
    expect(
      screen.getByRole('tab', { name: 'Recommended for you' }),
    ).toHaveAttribute('aria-selected', 'true')
    // A stable shelf heading from the panel proves the panel actually
    // rendered (vs. just the tab being marked active). "My Interests"
    // is a fixture shelf with literal copy.
    expect(
      screen.getByRole('heading', { name: /my interests/i }),
    ).toBeInTheDocument()
  })

  it('switches to LibraryPanel when ?tab=library', () => {
    renderAt('/membership?tab=library')
    // The page-level tab title reads "Resource Library" — same H2
    // surface for every tab, owned by MembershipLandingPage.
    expect(
      screen.getByRole('heading', { level: 2, name: /^resource library$/i }),
    ).toBeInTheDocument()
    // The results header + count is present (Library content
    // actually rendered, not just the title).
    expect(
      screen.getByRole('heading', { level: 2, name: /^results$/i }),
    ).toBeInTheDocument()
    // And the Recommended panel is NOT mounted on this tab.
    expect(
      screen.queryByRole('heading', { name: /my interests/i }),
    ).not.toBeInTheDocument()
  })
})

describe('MembershipLandingPage — non-member view', () => {
  beforeEach(() => {
    seedAccount('cre', 'non-member')
  })

  it('renders the upsell hero + plan tier strip and not the member hero band', () => {
    renderAt('/membership')
    expect(
      screen.getByRole('region', { name: /become a member/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: /membership plan tiers/i }),
    ).toBeInTheDocument()
    // Member hero band must not render in this branch.
    expect(
      screen.queryByRole('region', { name: /membership overview/i }),
    ).not.toBeInTheDocument()
  })

  it('wraps RecommendedForYouPanel in LockedPreview on the Recommended tab', () => {
    renderAt('/membership')
    // The pill is the user-visible signal that the lock wrapper is in
    // place. Per-tab text on the Recommended tab is the "personalized
    // picks" copy from MembershipLandingPage.
    expect(
      screen.getByText(/join to unlock personalized picks/i),
    ).toBeInTheDocument()
  })
})

describe('MembershipLandingPage — zero-state (STC member)', () => {
  beforeEach(() => {
    seedAccount('stc', 'member')
  })

  it('renders membership hero stats with the faded zero-state meta line', () => {
    renderAt('/membership')
    // Zero-state copy comes straight from heroStatsFixtures — its
    // presence proves the hero is rendering the STC fixture's stats.
    expect(screen.getByText(/add your first course/i)).toBeInTheDocument()
  })
})

