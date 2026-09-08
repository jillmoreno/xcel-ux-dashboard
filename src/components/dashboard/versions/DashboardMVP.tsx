import { useEffect } from 'react'
import {
  useFeatureFlags,
  type FeatureFlagState,
} from '@/context/FeatureFlagContext'
import { DashboardV3 } from '@/components/dashboard/versions/DashboardV3'

/**
 * Starting feature-flag configuration for Dashboard MVP — a snapshot of
 * the agreed-on MVP view captured 2026-06-15. The MVP *seeds* these
 * values the first time it's opened in a session (see below); from there
 * reviewers can adjust any of them in the global Feature Flag panel like
 * normal — the snapshot is the default, not a lock. Update this map to
 * re-baseline what a fresh session lands on.
 *
 * Notable choices in this snapshot:
 *   - KPI hero: on, dark (teal) treatment.
 *   - Jump Back In: the "+ Quick Links" version, tiles, medium card.
 *   - Learning Path + Courses summary: on.
 *   - Featured Products: doubled height, two-thirds width, tiles-bottom
 *     layout, light theme, Top 5 pagination off (locked to "Popular").
 *   - Learning Paths count: 1.
 *   - Streak Hero, drag-and-drop, and all right-rail widgets: off
 *     (the rail is hidden by `hideRightRail` anyway).
 */
const MVP_FLAGS: Record<string, Partial<FeatureFlagState>> = {
  'dashboard-kpi-card': { enabled: true, variant: 'dark', secondaryVariant: 'auto' },
  'jump-back-in-card': { enabled: false, variant: 'single' },
  'jump-back-in-card-links': {
    enabled: true,
    variant: 'links-tiles',
    secondaryVariant: 'medium',
  },
  'learning-path-card': { enabled: true, variant: 'default' },
  'courses-summary-card': { enabled: true, variant: 'default' },
  'dashboard-top5-pagination': { enabled: false, secondaryVariant: 'popular' },
  'membership-card-layout': { enabled: true, variant: 'tiles-bottom' },
  'membership-card-theme': { enabled: true, variant: 'light' },
  'membership-card-height': { enabled: true, variant: 'double' },
  'membership-card-width': { enabled: true, variant: 'two-thirds' },
  'learning-paths-count': { enabled: true, variant: 'one' },
  'streak-hero-card': { enabled: false, variant: 'default' },
  'dashboard-drag-and-drop': { enabled: false },
  // Right-rail widgets — hidden anyway by `hideRightRail`, pinned off
  // so the snapshot is unambiguous.
  'premium-membership-card': { enabled: false, variant: 'default' },
  'whats-new-card': { enabled: false, variant: 'default' },
  'quick-links-card': { enabled: false, variant: 'default' },
  'rubi-tutor-widget': { enabled: false, variant: 'default' },
  'dashboard-rail-tray': { enabled: false, variant: 'gray' },
}

// Seed the snapshot only once per browser session. Guarding here (rather
// than re-applying on every mount) means once a reviewer adjusts a flag,
// navigating away and back — or reloading the tab — keeps their change;
// only a brand-new session starts from the snapshot again.
const SEEDED_KEY = 'cgp.dashboard.mvp.seeded'

function hasSeededMvp(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.sessionStorage.getItem(SEEDED_KEY) === '1'
  } catch {
    return false
  }
}

function markMvpSeeded(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SEEDED_KEY, '1')
  } catch {
    // Ignore private-mode / quota errors — worst case we re-seed.
  }
}

/**
 * Dashboard MVP.
 *
 * Pared-back V3 for the MVP scope, implemented as a thin wrapper over
 * `DashboardV3` (like V5) so it stays in lockstep with the V3 surface:
 *   - `hideRightRail` drops the entire right rail (Rubi, Premium upsell,
 *     Quick Links, What's New) and centers the remaining single main
 *     column on the page. It also strips the hero band's member-only
 *     "Saved this year" stat chip.
 *   - `membershipPlacement="trail"` moves the Featured Products card
 *     below the Learning Path + Courses widgets (same as V5).
 *   - `consolidatedProgress` swaps the Learning Path + Courses widgets
 *     for the single `<ProgressTrackerCard>` (Option E).
 *   - On first open in a session it seeds the `MVP_FLAGS` snapshot into
 *     the live flag state, then steps out of the way — the Feature Flag
 *     panel drives the page from there.
 */
export function DashboardMVP() {
  const { applyFlags } = useFeatureFlags()
  useEffect(() => {
    if (hasSeededMvp()) return
    applyFlags(MVP_FLAGS)
    markMvpSeeded()
  }, [applyFlags])
  return <DashboardV3 hideRightRail membershipPlacement="trail" consolidatedProgress />
}
