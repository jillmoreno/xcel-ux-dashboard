import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import {
  FeatureFlagProvider,
  FEATURE_FLAGS,
  NAV_SECTION_FLAGS,
} from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'

/**
 * How many flags the Dashboard Rebrand page shows while SCOPED to
 * /dashboard-rebrand — i.e. in-scope keys that are also tagged to this page.
 *
 * Derived, not literal. It was hardcoded as 16 in four assertions, so every
 * flag added to the scope broke all four at once — and the number was never
 * what any of them was about. What they test is that the panel honours the
 * route scope; the count is just how that becomes observable.
 */
const REBRAND_SCOPED_COUNT = (() => {
  const scope = new Set(flagScopeForPath('/dashboard-rebrand') ?? [])
  return FEATURE_FLAGS.filter(
    (f) =>
      scope.has(f.key) &&
      (f.page === 'dashboard-rebrand' || f.extraPages?.includes('dashboard-rebrand')),
  ).length
})()
const rebrandScoped = new RegExp(`dashboard rebrand.*${REBRAND_SCOPED_COUNT} flags`, 'i')
import { FeatureFlagPanelProvider, useFeatureFlagPanel } from '@/components/account/FeatureFlagPanelContext'
import { FeatureFlagPanel } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipPageVersionPanelProvider } from '@/components/membership/MembershipPageVersionPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { DashboardPage } from '@/pages/DashboardPage'

/**
 * Tiny button that flips the FeatureFlagPanel open so the toggle is
 * reachable in the test. We can't drive the AccountMenu in jsdom
 * without an end-to-end harness; this is the minimal "open the panel"
 * surface.
 */
function OpenPanelButton() {
  const { openPanel } = useFeatureFlagPanel()
  return (
    <button type="button" onClick={openPanel}>
      open-panel
    </button>
  )
}

function renderDashboardWithPanel(url = '/dashboard?version=v3') {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <LearningPathsPanelProvider>
          <DashboardVersionsPanelProvider>
            <MembershipPageVersionPanelProvider>
            <JumpBackInPanelProvider>
              <FeatureFlagPanelProvider>
                <MemoryRouter initialEntries={[url]}>
                  <OpenPanelButton />
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Routes>
                  <FeatureFlagPanel />
                </MemoryRouter>
              </FeatureFlagPanelProvider>
            </JumpBackInPanelProvider>
            </MembershipPageVersionPanelProvider>
          </DashboardVersionsPanelProvider>
        </LearningPathsPanelProvider>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

/** Opens the panel with the Dashboard flag list reachable. Because the
 *  tests render at /dashboard, the panel auto-selects the Dashboard page
 *  on open (see `flagPageIdForPath` in FeatureFlagPanel) and lands
 *  directly on its flag list — no page-selector step to click through. */
function openPanelAndSelectDashboard() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
  })
}

describe('FeatureFlagPanel — page selector', () => {
  it('lists every page in the catalog with their flag counts', () => {
    renderDashboardWithPanel()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    // Opening at /dashboard auto-selects the Dashboard page and lands on
    // its flag list. Step back to reach the page selector under test.
    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: /back to all pages/i }),
      )
    })
    // Dashboard ships 26 flags; the Dashboard Rebrand page holds its 23 — the 21
    // whole-rebrand flags (the progress-state control + the CLP layout exploration + recap + the Recommended widget + the Memberships
    // (rail) switch + the What's Trending
    // section + the full-width Current Learning Path band + the hero bleed + the shared-navy left nav + What's New band layout + the What's New
    // background image toggle) plus the two standalone-V7 KPI-band flags
    // (summary-style + savings-cta) that live on this page but aren't offered in
    // the rebrand scope. The page-specific flags were split out to their own
    // pages: **Hide Courses Filters** → My Courses; **Learning Path Page** +
    // **Learning Paths Count** → Learning Path; **Professions** → Learning
    // Library. (The dead Featured Products flag, the retired Stacked/Vibrant
    // layout flags, the What's New Featured Hero flag, and the Rebrand Section
    // Hero + Explore Membership layout flags were all dropped in the flag
    // cleanup.) Membership keeps its 5.
    expect(
      screen.getByRole('button', { name: /dashboard.*hero band.*26 flags/i }),
    ).toBeInTheDocument()
    // Counted from the catalog rather than hardcoded. This page's total has
    // been edited by hand five times in the comment above, and it moved again
    // when the ten Navigation flags landed — the number was never the subject,
    // the SELECTOR REPORTING THE CATALOG ACCURATELY is. Every other count here
    // is still literal on purpose: they are small and stable, and a wrong one
    // should be visible in the diff.
    const rebrandCount = FEATURE_FLAGS.filter(
      (f) => f.page === 'dashboard-rebrand' || f.extraPages?.includes('dashboard-rebrand'),
    ).length
    expect(
      screen.getByRole('button', {
        name: new RegExp(`dashboard rebrand.*${rebrandCount} flags`, 'i'),
      }),
    ).toBeInTheDocument()
    // The Navigation group is the reason it moved; assert it is really in there
    // so this cannot pass by counting a page that lost its flags.
    expect(rebrandCount).toBeGreaterThanOrEqual(NAV_SECTION_FLAGS.length)
    // Page-specific flags now live under their own pages.
    expect(
      screen.getByRole('button', { name: /recommended for you.*2 flags/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /my courses.*2 flags/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /resource library.*3 flags/i }),
    ).toBeInTheDocument()
    // 11 — `membership-hub-hero` (the Hub hero-layout flag, split out of the
    // Membership Version picker) plus `membership-cancel-flow`, which carries
    // `extraPages: ['membership']` because the sheet it governs opens from every
    // membership card's footer CTA here too.
    expect(
      screen.getByRole('button', { name: /membership.*hero.*12 flags/i }),
    ).toBeInTheDocument()
  })

  it('navigates back to the page selector via the back button', () => {
    renderDashboardWithPanel()
    openPanelAndSelectDashboard()
    // Flag rows are now visible.
    expect(
      screen.getByRole('switch', { name: /Toggle Rubi Tutor Widget/i }),
    ).toBeInTheDocument()
    // Click the back arrow → page selector view returns.
    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: /back to all pages/i }),
      )
    })
    expect(
      screen.queryByRole('switch', { name: /Toggle Rubi Tutor Widget/i }),
    ).not.toBeInTheDocument()
    // Page selector is back — a page card (My Courses) is shown again.
    expect(
      screen.getByRole('button', { name: /my courses.*2 flags/i }),
    ).toBeInTheDocument()
  })
})

describe('FeatureFlagPanel — per-feature scope', () => {
  it('scopes /dashboard-rebrand to its flags across four pages (no version param)', () => {
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    // Scoped flags split across six page cards: 22 whole-rebrand flags under
    // Dashboard Rebrand (incl. the progress-state control + What's New Badging + Membership Eyebrow + the full-width CLP band + the CLP layout exploration + the Featured hero + the shared-navy left-nav color + the Recommended card A/B), plus the page-specific ones
    // under their own pages (Recommended for You: cards + the shared profession/state filters → 3; My Courses Table View → 2; Learning Path Page +
    // Count + Table View + Status Labels + States → 5; Resource Library Professions +
    // Library Hero + Card Style → 3; Course Catalog: the entitled-savings pricing
    // toggle + the included-course tier accent → 2).
    expect(screen.getByRole('button', { name: rebrandScoped })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recommended for you.*2 flags/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /my courses.*2 flags/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learning path.*6 flags/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /resource library.*3 flags/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /course catalog.*3 flags/i })).toBeInTheDocument()
    // The big Dashboard flag list isn't reachable here.
    expect(screen.queryByRole('switch', { name: /Toggle Rubi Tutor Widget/i })).toBeNull()
  })

  it('scopes to the same flags regardless of any version param', () => {
    // Every rebrand layout (Marketing Focused / Learner Focused) shares one flag
    // scope, so a stray/legacy `?version=` param doesn't change it.
    renderDashboardWithPanel('/dashboard-rebrand?version=discoverability-learner-focused')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    expect(screen.getByRole('button', { name: rebrandScoped })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learning path.*6 flags/i })).toBeInTheDocument()
  })

  it('does not offer the removed / KPI-band flags in the Dashboard Rebrand scope', () => {
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: rebrandScoped }))
    })
    // Standalone-V7 KPI-band flags never surface here.
    expect(screen.queryByRole('switch', { name: /Toggle Membership Summary Style/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /Toggle Non-member Savings CTA/i })).toBeNull()
    // Retired Stacked/Vibrant layout flags are gone from the catalog entirely.
    expect(screen.queryByRole('switch', { name: /Toggle Current Learning Path width/i })).toBeNull()
    // Retired 2026-09-01 with the "Personalize your profile" band itself — the
    // band left the dashboard, so the flag that placed it there has no job. It
    // now lives as the `personalize-profile` walkthrough.
    expect(screen.queryByRole('switch', { name: /Toggle Personalize Profile nudge/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /Toggle Jump Back In widget/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /Toggle Vibrant Learning band/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /Toggle Featured Products widget/i })).toBeNull()
  })

  it('still shows the full Dashboard flag list on the normal /dashboard route', () => {
    renderDashboardWithPanel('/dashboard?version=v3')
    openPanelAndSelectDashboard()
    expect(screen.getByRole('switch', { name: /Toggle Rubi Tutor Widget/i })).toBeInTheDocument()
  })

  it("renders the What's Trending flag as a plain on/off toggle (no variant controls)", () => {
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    // Drill into the Dashboard Rebrand page flag list.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: rebrandScoped }))
    })
    // The flag is now a plain switch — no layout dropdown / background pills.
    expect(screen.getByRole('switch', { name: /toggle what's trending section/i })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /what's new widget variant/i })).toBeNull()
    expect(screen.queryByRole('radiogroup', { name: /what's new widget background/i })).toBeNull()
    // The flag definition carries no variants.
    const flag = FEATURE_FLAGS.find((d) => d.key === 'dashboard-whats-new-layout')
    expect(flag?.variants).toBeUndefined()
    expect(flag?.secondaryVariants).toBeUndefined()
  })

  it('removed the dead / retired flags from the catalog', () => {
    const removed = [
      'featured-products-style',
      'dashboard-jump-back-in-color',
      'dashboard-jump-back-in-style',
      'dashboard-learning-path-width',
      'dashboard-learning-path-breakdown',
      'dashboard-learning-vibrant',
      'whats-new-featured-hero',
      'membership-section-hero-style',
      'explore-membership-layout',
      'dashboard-recommended-color',
      'recommended-empty',
    ]
    for (const key of removed) {
      expect(FEATURE_FLAGS.find((d) => d.key === key)).toBeUndefined()
    }
  })
})

describe('FeatureFlagPanel — Dashboard flag toggles', () => {
  it('hides the Rubi widget on DashboardV3 when the flag is toggled off', () => {
    renderDashboardWithPanel()

    // Default state — widget is visible on V3.
    expect(screen.getByRole('region', { name: /Rubi — AI tutor/i })).toBeInTheDocument()

    openPanelAndSelectDashboard()
    const rubiSwitch = screen.getByRole('switch', { name: /Toggle Rubi Tutor Widget/i })
    expect(rubiSwitch).toHaveAttribute('aria-checked', 'true')

    act(() => {
      fireEvent.click(rubiSwitch)
    })
    expect(rubiSwitch).toHaveAttribute('aria-checked', 'false')

    // Widget is now gone from the dashboard.
    expect(screen.queryByRole('region', { name: /Rubi — AI tutor/i })).not.toBeInTheDocument()
  })

  it('hides the Quick Links card when its flag is toggled off', () => {
    renderDashboardWithPanel()
    expect(screen.getByRole('region', { name: /Quick links/i })).toBeInTheDocument()

    openPanelAndSelectDashboard()
    act(() => {
      fireEvent.click(
        screen.getByRole('switch', { name: /Toggle Quick Links/i }),
      )
    })

    expect(screen.queryByRole('region', { name: /Quick links/i })).not.toBeInTheDocument()
  })

  it('hides the Jump Back In tile when its flag is toggled off', () => {
    renderDashboardWithPanel()
    expect(screen.getByRole('region', { name: /Jump back in/i })).toBeInTheDocument()

    openPanelAndSelectDashboard()
    act(() => {
      // Anchor the name — the catalog now also ships "Jump Back In +
      // Quick Links" and "Jump Back In Container", which a loose regex
      // would match too.
      fireEvent.click(
        screen.getByRole('switch', { name: /^Toggle Jump Back In$/i }),
      )
    })

    expect(screen.queryByRole('region', { name: /Jump back in/i })).not.toBeInTheDocument()
  })

  it('still toggles correctly when a stale localStorage entry is missing the flag key', () => {
    // Simulate the HMR / new-flag-mid-session case: persisted state was
    // written before `rubi-tutor-widget` existed in the catalog, so the
    // stored map only has the older `dashboard-kpi-card` entry. The
    // panel should still let the user flip the new toggle.
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({
        'dashboard-kpi-card': { enabled: true, variant: 'light' },
      }),
    )

    renderDashboardWithPanel()
    expect(screen.getByRole('region', { name: /Rubi — AI tutor/i })).toBeInTheDocument()

    openPanelAndSelectDashboard()
    const rubiSwitch = screen.getByRole('switch', { name: /Toggle Rubi Tutor Widget/i })
    act(() => {
      fireEvent.click(rubiSwitch)
    })

    expect(rubiSwitch).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByRole('region', { name: /Rubi — AI tutor/i })).not.toBeInTheDocument()
  })
})
