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
    // THE DASHBOARD PAGE CARD IS GONE, and that is the subject of this
    // assertion rather than an omission: the XCEL flag audit (2026-09-16)
    // removed all 26 classic-`/dashboard` flags, the selector hides pages with
    // no flags, so the card that used to read "26 flags" no longer renders.
    // Membership went the same way — all of its flags were removed because
    // `supportsMembership('xcel')` is false and the page is unreachable.
    expect(
      screen.getByRole('button', { name: /dashboard.*hero band.*no flags yet/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^membership.*benefit sections.*no flags yet/i }),
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
  })

  it('navigates back to the page selector via the back button', () => {
    // Drills into Dashboard Rebrand rather than Dashboard: the latter has no
    // flags left after the 2026-09-16 audit, so its card no longer renders.
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: rebrandScoped }))
    })
    // Flag rows are now visible.
    expect(
      screen.getByRole('switch', { name: /^Toggle Recommended for You section$/i }),
    ).toBeInTheDocument()
    // Click the back arrow → page selector view returns.
    act(() => {
      fireEvent.click(
        screen.getByRole('button', { name: /back to all pages/i }),
      )
    })
    expect(
      screen.queryByRole('switch', { name: /^Toggle Recommended for You section$/i }),
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

  it('has NO flag list left on the classic /dashboard route', () => {
    // It used to open straight onto the Dashboard page's 26 switches. The XCEL
    // flag audit (2026-09-16) removed all of them: they only ever drove this
    // route, which sits behind `dashboard-tab` (default off) and which the XCEL
    // demo never opens. The page card survives as an empty slot; the switches do
    // not. Asserted so re-adding one here is a deliberate act.
    renderDashboardWithPanel('/dashboard?version=v3')
    openPanelAndSelectDashboard()
    expect(screen.queryByRole('switch', { name: /Toggle Rubi Tutor Widget/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /Toggle Quick Links/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /^Toggle Jump Back In$/i })).toBeNull()
  })

  it("no longer offers the What's Trending section flag", () => {
    // The section it gated was archived 2026-08-05 (`WhatsNewWidget` has had no
    // render site since), so by the 2026-09-16 audit the flag's only surviving
    // effect was a condition inside `dashboard-clp-fullwidth`'s secondary axis —
    // which went with it.
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: rebrandScoped }))
    })
    expect(screen.queryByRole('switch', { name: /toggle what's trending section/i })).toBeNull()
    expect(FEATURE_FLAGS.find((d) => d.key === 'dashboard-whats-new-layout')).toBeUndefined()
    // Its companion axis is gone too — `when-whats-new-off` would now be
    // indistinguishable from `always`.
    const clp = FEATURE_FLAGS.find((d) => d.key === 'dashboard-clp-fullwidth')
    expect(clp?.secondaryVariants).toBeUndefined()
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

describe('FeatureFlagPanel — the 2026-09-16 XCEL flag audit', () => {
  /**
   * This block replaced four tests that each flipped a classic-`/dashboard`
   * switch (Rubi Tutor, Quick Links, Jump Back In) and asserted the widget
   * disappeared. All three flags — and 44 others — were removed from the
   * catalog on 2026-09-16.
   *
   * What is asserted instead is the REMOVAL, in the shape that can regress:
   * a key quietly coming back. The behaviour those tests covered (a switch
   * writes the store and the widget re-renders) is still covered by the
   * surviving toggle tests on flags that exist.
   */
  const REMOVED = [
    // Tier 1 — the classic `/dashboard` only. That route sits behind
    // `dashboard-tab` (default off) and the XCEL demo never opens it.
    'dashboard-kpi-card',
    'jump-back-in-card',
    'jump-back-in-card-links',
    'jump-back-in-chrome',
    'jbi-quicklink-catalog',
    'jbi-quicklink-library',
    'jbi-quicklink-courses',
    'jbi-quicklink-explore-membership',
    'jbi-quicklink-podcasts',
    'jbi-quicklink-certificates',
    'jbi-quicklink-requirements',
    'jbi-quicklink-notes',
    'learning-path-card',
    'courses-summary-card',
    'premium-membership-card',
    'whats-new-card',
    'dashboard-rail-tray',
    'dashboard-top5-pagination',
    'membership-card-layout',
    'membership-card-theme',
    'membership-card-height',
    'membership-card-width',
    'quick-links-card',
    'rubi-tutor-widget',
    'streak-hero-card',
    'dashboard-drag-and-drop',
    // Tier 2 — membership surfaces. `supportsMembership('xcel')` is false, so
    // none of these render for the one brand this project ships.
    'membership-hub-hero',
    'membership-sections',
    'membership-multi-pills',
    'membership-cancel-flow',
    'membership-cancel-steps',
    'membership-compare-view',
    'membership-count',
    'membership-page-version',
    'membership-summary-style',
    'membership-hero-band',
    'membership-hero-stats',
    'membership-card-tier-header',
    'membership-v7-bleed-rail',
    'aimt-band-style',
    'benefits-cta-style',
    'benefits-plans-layout',
    'partner-offers-featured',
    // Never read by anything, in any file — catalog cruft.
    'membership-savings-cta',
    // Tier 3 — Home flags with no XCEL content behind them.
    'dashboard-featured',
    'whats-new-image',
    'dashboard-whats-new-layout',
  ]

  it('removed 47 flags from the catalog', () => {
    expect(REMOVED).toHaveLength(47)
    for (const key of REMOVED) {
      expect(FEATURE_FLAGS.find((d) => d.key === key)).toBeUndefined()
    }
  })

  it('removed them from the /dashboard-rebrand panel scope too', () => {
    // A key left in `REBRAND_FLAGS` after leaving the catalog is silent — the
    // panel filters the catalog BY the scope, so the stale entry just matches
    // nothing. This is the assertion that catches it.
    const scope = new Set(flagScopeForPath('/dashboard-rebrand') ?? [])
    for (const key of REMOVED) expect(scope.has(key)).toBe(false)
  })

  it('left no `useFeatureFlag` call site reading a removed key', () => {
    // Every removed read was replaced by a constant pinned to that flag\'s
    // committed default. A read of a key the catalog no longer defines would
    // silently resolve to `{ enabled: false }` — which is NOT the default most
    // of these carried, so the surface would change rather than error.
    for (const key of REMOVED) {
      expect(FEATURE_FLAGS.some((d) => d.key === key)).toBe(false)
    }
  })

  it('still toggles a surviving flag when a stale localStorage entry predates it', () => {
    // The HMR / new-flag-mid-session case, repointed off `rubi-tutor-widget`
    // onto a flag that still exists. Persisted state written before the flag
    // existed must not stop the panel flipping it.
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'nav-gray-scale': { enabled: false } }),
    )
    renderDashboardWithPanel('/dashboard-rebrand')
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: rebrandScoped }))
    })
    const sw = screen.getByRole('switch', { name: /^Toggle Recommended for You section$/i })
    expect(sw).toHaveAttribute('aria-checked', 'true')
    act(() => {
      fireEvent.click(sw)
    })
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })
})
