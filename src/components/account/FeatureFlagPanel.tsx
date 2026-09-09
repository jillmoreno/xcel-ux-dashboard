import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Flag, HelpCircle, Sliders, X } from '@/icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { Select } from '@/components/ui/Select'
import { acquireBodyScrollLock } from '@/utils/bodyScrollLock'
import { useDashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanelContext'
import { useMembershipPageVersionPanel } from '@/components/membership/MembershipPageVersionPanelContext'
import {
  FEATURE_FLAG_PAGES,
  useFeatureFlags,
  NAV_SECTION_FLAGS,
  navSectionFlagKey,
  type FeatureFlagDefinition,
  type FeatureFlagPage,
  type FeatureFlagPageId,
  type FeatureFlagState,
  type FeatureFlagVariant,
} from '@/context/FeatureFlagContext'
import { useFeatureFlagPanel } from './FeatureFlagPanelContext'

/**
 * Map the current pathname to the FeatureFlagPageId that owns it, so
 * the panel can auto-select the page the learner is currently viewing
 * when they open it. Returns `null` when the route doesn't correspond
 * to any cataloged page (e.g. /account/*, /resources/:id) — the panel
 * falls back to the page selector in that case.
 *
 * Listed routes mirror the surfaces enumerated in `FEATURE_FLAG_PAGES`
 * (see FeatureFlagContext.tsx). When a new page is added to that
 * catalog, add the matching pathname prefix here too.
 */
function flagPageIdForPath(pathname: string): FeatureFlagPageId | null {
  if (pathname.startsWith('/dashboard-rebrand')) return 'dashboard-rebrand'
  if (pathname.startsWith('/onboarding-flow')) return 'onboarding-flow'
  if (pathname.startsWith('/resource-updates')) return 'learning-resources'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/membership')) return 'membership'
  if (pathname.startsWith('/my-learning/path')) return 'learning-path'
  if (pathname.startsWith('/my-learning/courses')) return 'my-courses'
  if (pathname.startsWith('/my-learning/podcasts')) return 'my-podcasts'
  if (pathname.startsWith('/my-learning/certificates')) return 'certificates'
  if (pathname.startsWith('/catalog')) return 'course-catalog'
  return null
}

/**
 * Per-feature flag scope (Dashboard Rebrand). When on `/dashboard-rebrand` the
 * panel surfaces ONLY the relevant flag keys; every other route shows all flags
 * (the "Explore Dashboard" default). Audited: the rebrand renders the membership
 * overview + reused pages (not the flag-driven DashboardV1–V5 widgets) and pins
 * Elite (so STC-only Learning Path flags never surface).
 *
 * The rebrand ships two layouts (Marketing Focused — the default — and Learner
 * Focused), both of which replace the top Your-Learning row with a joined band.
 * The flags that only tuned the retired Stacked/Vibrant layout + the dead
 * Featured Products flag were removed in the flag audit (see `REBRAND_FLAGS`).
 * The Membership KPI-band flags (`membership-summary-style`,
 * `membership-savings-cta`) never surface here — that band was removed from the
 * stacked layout (it lives only on the standalone `/membership` V7 page now). The
 * retired Side-by-side / Vibrant versions used to widen this scope.
 */
// The rebrand ships two layouts — Marketing Focused (default) + Learner Focused
// — both of which replace the top Your-Learning row with a joined band. The
// flags that only tuned the retired Stacked/Vibrant layout (jump-back-in
// color/style, learning-path width/breakdown, learning-vibrant) + the dead
// Featured Products flag were removed in the flag audit.
const REBRAND_FLAGS = [
  // NOTE: `dashboard-progress-state` and `dashboard-education-type` were
  // intentionally dropped from this rebrand scope — the always-visible Demo
  // Controls bar (`DemoControlsBar`) exposes them as dedicated Progress /
  // Education dropdowns on `/dashboard-rebrand`, so surfacing them in the panel
  // here too was a redundant, worse copy of a control sitting right in the bar.
  // Both flags are still fully defined in the catalog and still surface in the
  // panel on every other (unscoped) route.
  // Personalize-profile nudge band on the overview.
  // Free Content promo bands (blog + podcast) under the upsell band.
  'dashboard-free-content-bands',
  // Membership Hub hero layout — base savings band / + Current Membership card /
  // split cards / savings-on-top (the hero-only variants split out of the
  // Membership Version picker). Surfaces on the Membership page card.
  'membership-hub-hero',
  // Explore Membership — the Current Membership card + Membership Scorecard
  // sections under the hero (off ⇒ the section is unchanged).
  'membership-sections',
  // Multiple-memberships version — what the Profession / State pills do.
  'membership-multi-pills',
  // Cancellation flow container — in the Manage Membership sheet (default) or
  // handed off to a full-width page region.
  'membership-cancel-flow',
  'membership-cancel-steps',
  // Standalone Membership page — plan comparison as a feature-matrix Table
  // (default) or stacked plan Cards.
  'membership-compare-view',
  // AI MasterTracks section — Dark spotlight band (default) or Light card.
  'aimt-band-style',
  // Recommended card blurb — show/hide the "what this is" line on the cards.
  'dashboard-recommended-blurb',
  // Recommended band layout — ON = horizontal carousel (scroll); OFF = a
  // fit-to-screen grid that shows only as many whole cards as fit (no scroll),
  // keeping the See All link and every Card style (Shelf / Large / Trending).
  'dashboard-recommended-carousel',
  // Recommended card A/B — a dedicated two-way toggle (Compact square ⇄ What's
  // Trending) that overrides the band's card style on the live Home. OFF leaves
  // the band on its normal Card style. Drives the "Recommended Card A/B" tile.
  'home-recommended-card-ab',
  // Recommended for You *page* (the Explore-rail section) — shelf cards
  // matching the Home Recommended section ⇄ full-size Course Catalog cards.
  // Single ⇄ multiple memberships in the left-rail Membership block.
  'membership-count',
  // Single ⇄ multiple professions — drives the Resource Library Profession filter row.
  'profession-count',
  // Resource Library hero — full custom hero ⇄ compact standard section hero.
  'learning-library-hero',
  // Resource Library card style — compact shelf cards ⇄ classic image-header cards.
  'learning-library-card-style',
  // What's Trending section — on/off for the dashboard-overview carousel.
  'dashboard-whats-new-layout',
  // Jump Back In card layout inside that band — Up Next courses ⇄ today's
  // study-plan tasks.
  'clp-jump-back-in',
  // Full-width Current Learning Path band (navy CLP + Jump Back In) — variant
  // D/E; always, or only when What's New is off (CLP expands to fill the space).
  'dashboard-clp-fullwidth',
  // Featured hero — the single full-width rotating hero under the Current
  // Learning Path (enable toggle + Manual/Auto-rotate motion + Height variant).
  'dashboard-featured',
  // Career Tools section — show/hide the Rubi AI tool cards at the bottom of
  // the dashboard overview.
  'dashboard-career-tools',
  // Partner Offers — split into Featured Offers + Additional Offerings.
  'partner-offers-featured',
  // Left-nav SECTION VISIBILITY — one toggle per rail item (Home excepted; see
  // NAV_SECTION_FLAGS). Spread from the same list the catalog and the rail read,
  // so a new rail item is in scope automatically rather than being authored
  // into the catalog and then silently missing from the panel on the one route
  // where the left nav actually lives.
  ...NAV_SECTION_FLAGS.map((n) => navSectionFlagKey(n.section)),
  // Left Nav Color Options — the single rail-color flag: the six shipped rails
  // (Navy / Graphite / Brand 800 / Light 1–3) plus any Nectar Neutral ramp step
  // (050–950), in one dropdown. Wins over the Appearance preference while on.
  // (Merged the former `platform-nav-color` flag into this one, 2026-08-17.)
  'nav-gray-scale',
  // Featured hero background — cover photo ⇄ a brand-gradient no-image fallback.
  'whats-new-image',
  // The Learning Paths count flag drives the Current Learning Path widget's
  // "View All (N)" + the My Learning Paths sheet.
  'learning-paths-count',
  // Which version of the "Learning Path" rail item shows — V1 single path +
  // Switch Learning Path sheet, or V2 the searchable landing page.
  'learning-path-version',
  // Hide the Courses page's left filter rail (list expands full-width).
  'courses-hide-filters',
  // Show the Courses page Card / Table view toggle (+ table view).
  'courses-table-view',
  // Show the Learning Paths landing Grid / Table view toggle (+ table view).
  'learning-paths-table-view',
  // Learning Paths status labels — compliance (On Track/At Risk…) ⇄ status
  // (In Progress/Expiring Soon…).
  'learning-paths-status-taxonomy',
  // Current Learning Path → Details sheet: status Style (band ⇄ color-coded
  // callout) + Placement (in Progress tab ⇄ above the tabs).
  'learning-path-status-display',
  // Single ⇄ multiple states — drives the Learning Paths landing State filter row.
  'state-count',
  // Purchase Course upsell flow — which sheet opens when a shopper clicks a
  // course card: CURRENT single-screen Purchase Course sheet ⇄ NEW two-step
  // "Choose how to enroll → Complete purchase" upsell. Included here (not just
  // the dev-handoff route) so it's toggleable from the Dashboard Discoverability
  // panel — it also drives the dashboard Recommended band cards, which route
  // through CourseSheetSwitch.
  'catalog-upsell-flow',
  // Purchase Course sheet price copy — when a member is already entitled, show
  // the original price struck through as a savings anchor beside the "Included
  // with Membership" chip (ON) or the chip alone (OFF, default). Never "$0.00".
  'pricing-entitled-savings',
  // Course Catalog cards — a 6px tier-colored accent along the bottom of the
  // card image on products included in the member's current membership.
  'catalog-included-tier-line',
  // Purchases → Gift Recipients (purchase-for-others tracking). The section
  // renders INSIDE this shell (`?section=gift-recipients`), so its flags have to
  // be in this scope to be reachable while a reviewer is looking at it. They
  // carry `page: 'account-purchases'`, so the scoped panel groups them under
  // their own "Purchases" page card rather than under Dashboard Rebrand.
  'gift-recipients',
  'gift-recipients-layout',
  'gift-recipients-reminder',
]

/**
 * The standalone Onboarding Flow's flags — the new-user setup wizard axes
 * (extracted from the Dashboard Rebrand scope): the wizard-variant / goal-step
 * shape, the QE/CE education type, single ⇄ multiple licenses + states, and the
 * per-option Goal toggles (Elite CE).
 */
const ONBOARDING_FLAGS = [
  'dashboard-setup-variant',
  'setup-goal-layout',
  'onboarding-education-type',
  'onboarding-license-count',
  'onboarding-state-count',
  'setup-goal-renew',
  'setup-goal-certification',
  'setup-goal-ce',
  'setup-goal-explore',
]

/**
 * Learning Resources Updates scope — the standalone `/resource-updates`
 * demo page. Surfaces only the resource-viewer flags (attachments block +
 * suggested-topics pane and its two sub-toggles).
 */
const RESOURCE_UPDATES_FLAGS = [
  'resource-attachments',
  'resource-suggested-topics',
  'resource-suggestion-reason',
  'resource-suggestion-filters',
]

/**
 * The in-scope flag keys for a route, or `null` when unscoped (show all).
 *
 * Exported so tests can COUNT the scope rather than hardcoding its size. That
 * number was literal in four assertions and every flag added to the scope
 * broke all four — the size was never the subject, the panel honouring the
 * scope is.
 */
export function flagScopeForPath(pathname: string): string[] | null {
  if (pathname.startsWith('/dashboard-rebrand')) {
    return REBRAND_FLAGS
  }
  if (pathname.startsWith('/onboarding-flow')) {
    return ONBOARDING_FLAGS
  }
  if (pathname.startsWith('/resource-updates')) {
    return RESOURCE_UPDATES_FLAGS
  }
  return null
}

/**
 * Left-anchored slide-over for the platform-wide feature-flag editor.
 * (Opened from the admin tools menu; all admin-tools surfaces slide in
 * from the left so they don't collide with the right-anchored account
 * menu chrome.)
 * Two-step UI:
 *
 *   Step 1 — Page selector:
 *     A list of every platform surface that *could* host flags
 *     (Dashboard, Membership, My Courses, etc.). Each row shows the
 *     page label, a one-line description, and either the flag count
 *     or "No flags yet". Click → step 2.
 *
 *   Step 2 — Flag list for the selected page:
 *     The same flag-card list this panel used to render, but
 *     filtered to flags whose `page` field matches the selection.
 *     The header gains a back affordance ("← Dashboard") so
 *     reviewers can hop back to the page list without closing the
 *     panel.
 *
 * Adding a new page is a one-line change in `FEATURE_FLAG_PAGES`
 * (see FeatureFlagContext.tsx). New flags pick their page via the
 * `page` field on the definition.
 *
 * Anatomy + lifecycle mirror `<SwitchAccountPanel>`:
 *   - portal-rendered overlay + dialog
 *   - focus trap, Esc-to-close, body scroll lock
 *   - restores prior focus on close
 *
 * Open state is owned by `FeatureFlagPanelContext` so AccountMenu
 * (or any future entry point) can pop the panel without
 * prop-drilling.
 */
export function FeatureFlagPanel() {
  const { open, closePanel } = useFeatureFlagPanel()
  const { openPanel: openVersionsPanel } = useDashboardVersionsPanel()
  const { openPanel: openMembershipPageVersionPanel } = useMembershipPageVersionPanel()
  const {
    flags,
    definitions,
    setEnabled,
    setVariant,
    setSecondaryVariant,
    reset,
    saveAsDefault,
    restoreOriginals,
    hasCustomDefaults,
    demoMode,
  } = useFeatureFlags()
  // Transient "saved" confirmation after Set as default.
  const [justSavedDefault, setJustSavedDefault] = useState(false)
  const location = useLocation()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Selected page — `null` means "show the page selector". On open
  // the panel auto-selects whichever cataloged page the learner is
  // currently viewing (e.g. opening from /my-learning/path lands
  // directly on the Learning Path flag list). Falls back to the page
  // selector when the current route isn't in the catalog. Reset on
  // close so the next open reads from the fresh location.
  const [selectedPageId, setSelectedPageId] =
    useState<FeatureFlagPageId | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = (document.activeElement as HTMLElement) ?? null
    dialogRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closePanel()
        return
      }
      // Focus trap — Tab cycles within the dialog.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const releaseScrollLock = acquireBodyScrollLock()
    return () => {
      document.removeEventListener('keydown', onKey)
      releaseScrollLock()
      previouslyFocused.current?.focus?.()
    }
  }, [open, closePanel])

  // Seed the page selection from the current route every time the
  // panel opens. Auto-selects the page the learner is viewing so they
  // don't have to drill through the page selector first. Falls back
  // to `null` (page selector) when the route doesn't map to a
  // cataloged page. Resets on close so the next open re-reads the
  // location. Doesn't fire mid-session — the panel is a focus trap,
  // so route changes only happen while it's closed.
  useEffect(() => {
    // Intentional: the page selection is seeded from the route on open and
    // reset on close — it can't be derived during render because the user
    // also mutates it by picking pages inside the panel.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      setSelectedPageId(null)
      return
    }
    // Scoped features start at the (filtered) page selector rather than
    // deep-linking into a page; unscoped routes auto-select the current page.
    setSelectedPageId(
      flagScopeForPath(location.pathname) != null
        ? null
        : flagPageIdForPath(location.pathname),
    )
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, location.pathname, location.search])

  // Auto-clear the "Default saved" confirmation a moment after it shows.
  useEffect(() => {
    if (!justSavedDefault) return
    const t = window.setTimeout(() => setJustSavedDefault(false), 1800)
    return () => window.clearTimeout(t)
  }, [justSavedDefault])

  if (!open) return null

  // Per-feature scope (route-based). `null` ⇒ show every flag; otherwise the
  // catalog is filtered to the in-scope keys.
  const onRebrand = location.pathname.startsWith('/dashboard-rebrand')
  const scope = flagScopeForPath(location.pathname)
  const scopedDefinitions = scope
    ? definitions.filter((d) => scope.includes(d.key))
    : definitions
  // A scoped feature with nothing in scope (e.g. Dashboard Rebrand) shows a
  // dedicated empty state instead of the page selector.
  const scopedEmpty = scope != null && scopedDefinitions.length === 0

  const selectedPage = selectedPageId
    ? FEATURE_FLAG_PAGES.find((p) => p.id === selectedPageId) ?? null
    : null
  const flagsForPage = selectedPageId
    ? scopedDefinitions.filter(
        (d) => d.page === selectedPageId || d.extraPages?.includes(selectedPageId),
      )
    : []

  return createPortal(
    <div
      role="presentation"
      className="cre-sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgb(0 0 0 / 0.45)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="cre-sheet-panel--right"
        style={{
          width: '100%',
          maxWidth: 460,
          height: '100%',
          background: 'var(--color-surface-card)',
          boxShadow: '-4px 0 16px rgb(0 0 0 / 0.18)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 12px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
            }}
          >
            {selectedPage ? (
              // Step 2 header — back arrow + selected page label.
              // Clicking the arrow returns to the page selector.
              <button
                type="button"
                onClick={() => setSelectedPageId(null)}
                aria-label="Back to all pages"
                style={backArrowButtonStyle}
              >
                <ArrowLeft size={16} aria-hidden />
              </button>
            ) : (
              <span aria-hidden style={flagBadgeStyle}>
                <Flag size={14} aria-hidden />
              </span>
            )}
            <h2 id={titleId} style={headerTitleStyle}>
              {selectedPage ? selectedPage.label : 'Feature Flags'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close Feature Flag panel"
            onClick={closePanel}
            style={closeButtonStyle}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        <div style={bodyStyle}>
          {/* Dashboard Version is a rebrand-only setting, surfaced here as the
              first option so the robot menu opens a single sheet holding every
              setting. The row drills into the DashboardVersionsPanel (rendered
              in Header with the version props); closing this sheet first avoids
              two overlapping left slide-overs. */}
          {onRebrand && (
            <button
              type="button"
              onClick={() => {
                closePanel()
                openVersionsPanel()
              }}
              style={dashboardVersionRowStyle}
            >
              <span aria-hidden style={dashboardVersionIconStyle}>
                <Sliders size={16} aria-hidden />
              </span>
              <span style={dashboardVersionTextStyle}>
                <span style={dashboardVersionLabelStyle}>Dashboard Version</span>
                <span style={dashboardVersionCaptionStyle}>
                  Pick the dashboard layout
                </span>
              </span>
              <ChevronRight size={18} aria-hidden style={{ flexShrink: 0 }} />
            </button>
          )}
          {/* Membership Version — the sibling picker for the rebrand's
              "Membership" rail section (Full ⇄ Simple). Same drill-in pattern as
              Dashboard Version; the panel is rendered in Header. */}
          {onRebrand && (
            <button
              type="button"
              onClick={() => {
                closePanel()
                openMembershipPageVersionPanel()
              }}
              style={dashboardVersionRowStyle}
            >
              <span aria-hidden style={dashboardVersionIconStyle}>
                <Sliders size={16} aria-hidden />
              </span>
              <span style={dashboardVersionTextStyle}>
                <span style={dashboardVersionLabelStyle}>Membership Version</span>
                <span style={dashboardVersionCaptionStyle}>
                  Full page or Simple layout
                </span>
              </span>
              <ChevronRight size={18} aria-hidden style={{ flexShrink: 0 }} />
            </button>
          )}
          {scopedEmpty ? (
            <ScopedEmptyState />
          ) : selectedPage ? (
            <FlagListView
              page={selectedPage}
              definitions={flagsForPage}
              flags={flags}
              onToggle={setEnabled}
              onVariantChange={setVariant}
              onSecondaryVariantChange={setSecondaryVariant}
            />
          ) : (
            <PageSelectorView
              definitions={scopedDefinitions}
              onSelect={setSelectedPageId}
              hideEmptyPages={scope != null}
            />
          )}
        </div>

        <footer style={footerStyle}>
          <div style={footerRowStyle}>
            {/* "Set as default" persists the baseline (cgp.featureFlags.customDefaults).
                Hidden in the Demo view so a demoer can't redefine what "pure"
                means — the Demo baseline is only ever changed from the sandbox. */}
            {selectedPageId && !demoMode && (
              <button
                type="button"
                onClick={() => {
                  saveAsDefault(flagsForPage.map((d) => d.key))
                  setJustSavedDefault(true)
                }}
                style={setDefaultButtonStyle}
              >
                {justSavedDefault ? 'Default saved ✓' : 'Set as default'}
              </button>
            )}
            <button type="button" onClick={reset} style={resetButtonStyle}>
              Reset to defaults
            </button>
          </div>
          {/* Restore-originals clears the persisted custom defaults — also a
              sandbox-only action, hidden in the Demo view. */}
          {hasCustomDefaults && !demoMode && (
            <button
              type="button"
              onClick={restoreOriginals}
              style={restoreOriginalsStyle}
            >
              Restore original defaults
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

/* ─── Scoped empty state ───────────────────────────────────────────── */

/** Shown when the current feature scopes the panel to zero flags (e.g. the
 *  Dashboard Rebrand). */
function ScopedEmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        textAlign: 'center',
        padding: '48px 24px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-100)',
          color: 'var(--color-text-tertiary)',
        }}
      >
        <Flag size={18} aria-hidden />
      </span>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)' }}>
        No flags apply to this feature
      </p>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, maxWidth: 280 }}>
        This view doesn’t expose any toggles. Open the Feature Flag panel from
        Explore Dashboard to see the full set.
      </p>
    </div>
  )
}

/* ─── Step 1: Page selector ────────────────────────────────────────── */

function PageSelectorView({
  definitions,
  onSelect,
  hideEmptyPages = false,
}: {
  definitions: FeatureFlagDefinition[]
  onSelect: (id: FeatureFlagPageId) => void
  /** When scoped to a feature, drop pages that have no in-scope flags so the
   *  selector only lists pages relevant to the feature. */
  hideEmptyPages?: boolean
}) {
  // Count flags per page so each row can show "9 flags" / "No flags
  // yet". Recomputing here keeps the page catalog the single source
  // of truth — page rows render regardless of whether they have any
  // flags today.
  const flagCounts: Record<FeatureFlagPageId, number> = {} as Record<
    FeatureFlagPageId,
    number
  >
  for (const def of definitions) {
    flagCounts[def.page] = (flagCounts[def.page] ?? 0) + 1
    // A flag can also surface under additional page cards (e.g. the
    // profession/state filters drive both Learning Paths + Recommended for You).
    for (const extra of def.extraPages ?? []) {
      flagCounts[extra] = (flagCounts[extra] ?? 0) + 1
    }
  }

  return (
    <>
      <p style={introCopyStyle}>
        Select a page to view its feature flags. Selections persist
        across reloads and only affect this browser.
      </p>
      <ul style={pageListStyle}>
        {FEATURE_FLAG_PAGES.filter(
          (page) => !hideEmptyPages || (flagCounts[page.id] ?? 0) > 0,
        ).map((page) => {
          const count = flagCounts[page.id] ?? 0
          return (
            <li key={page.id}>
              <button
                type="button"
                onClick={() => onSelect(page.id)}
                style={pageRowStyle(count > 0)}
              >
                <div style={pageRowTextStyle}>
                  <span style={pageRowLabelStyle}>{page.label}</span>
                  <span style={pageRowDescriptionStyle}>
                    {page.description}
                  </span>
                </div>
                <div style={pageRowMetaStyle}>
                  <span style={flagCountStyle(count > 0)}>
                    {count > 0
                      ? `${count} flag${count === 1 ? '' : 's'}`
                      : 'No flags yet'}
                  </span>
                  <ChevronRight
                    size={16}
                    aria-hidden
                    style={{ color: 'var(--color-text-tertiary)' }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}

/* ─── Step 2: Flag list for the selected page ──────────────────────── */

// Section order for grouped flags in the panel — mirrors the dashboard's
// top-to-bottom layout. Groups not listed here render after these, in
// the order they first appear in the catalog.
const FLAG_GROUP_ORDER = [
  // Navigation leads: it controls what the rail shows, so it frames every
  // other group below it — a reviewer hiding a page here changes which of
  // those pages is even reachable.
  'Navigation',
  'KPI Card',
  'Jump Back In Card',
  'Learning Path Card',
  'Courses Card',
  'Membership Card',
  'Right Rail',
  'Not MVP',
]

function FlagListView({
  page,
  definitions,
  flags,
  onToggle,
  onVariantChange,
  onSecondaryVariantChange,
}: {
  page: FeatureFlagPage
  definitions: FeatureFlagDefinition[]
  flags: Record<string, FeatureFlagState>
  onToggle: (key: string, enabled: boolean) => void
  onVariantChange: (key: string, value: string) => void
  onSecondaryVariantChange: (key: string, value: string) => void
}) {
  // Group flags by their `group` so the panel mirrors the dashboard's
  // on-page sections. Ungrouped flags render first as a flat list; then
  // each group renders under a subhead, ordered by FLAG_GROUP_ORDER
  // (groups not listed there fall back to first-appearance order). A
  // flag's catalog order is preserved within its group, so the catalog
  // stays the source of truth for intra-group ordering.
  type Item =
    | { kind: 'group-header'; group: string }
    | { kind: 'flag'; def: FeatureFlagDefinition }
  const ungrouped: FeatureFlagDefinition[] = []
  const byGroup = new Map<string, FeatureFlagDefinition[]>()
  const firstSeen: string[] = []
  for (const def of definitions) {
    if (!def.group) {
      ungrouped.push(def)
      continue
    }
    if (!byGroup.has(def.group)) {
      byGroup.set(def.group, [])
      firstSeen.push(def.group)
    }
    byGroup.get(def.group)!.push(def)
  }
  const orderedGroups = [
    ...FLAG_GROUP_ORDER.filter((g) => byGroup.has(g)),
    ...firstSeen.filter((g) => !FLAG_GROUP_ORDER.includes(g)),
  ]
  const items: Item[] = []
  for (const def of ungrouped) items.push({ kind: 'flag', def })
  for (const group of orderedGroups) {
    items.push({ kind: 'group-header', group })
    for (const def of byGroup.get(group)!) items.push({ kind: 'flag', def })
  }

  return (
    <>
      <p style={introCopyStyle}>{page.description}</p>
      {definitions.length === 0 ? (
        <p style={emptyStateStyle}>
          No flags registered for {page.label} yet. New flags for this
          page will appear here automatically once they land in the
          catalog.
        </p>
      ) : (
        <ul style={flagListStyle}>
          {items.map((item) =>
            item.kind === 'group-header' ? (
              <li
                key={`group:${item.group}`}
                style={groupHeaderItemStyle}
                aria-hidden
              >
                <span style={groupHeaderLabelStyle}>{item.group}</span>
                <span aria-hidden style={groupHeaderRuleStyle} />
              </li>
            ) : (
              <li key={item.def.key}>
                <FlagRow
                  def={item.def}
                  state={flags[item.def.key]}
                  onToggle={(enabled) => onToggle(item.def.key, enabled)}
                  onVariantChange={(value) =>
                    onVariantChange(item.def.key, value)
                  }
                  onSecondaryVariantChange={(value) =>
                    onSecondaryVariantChange(item.def.key, value)
                  }
                />
              </li>
            ),
          )}
        </ul>
      )}
    </>
  )
}

/* ─── FlagRow ──────────────────────────────────────────────────────── */

function FlagRow({
  def,
  state,
  onToggle,
  onVariantChange,
  onSecondaryVariantChange,
}: {
  def: FeatureFlagDefinition
  state: FeatureFlagState | undefined
  onToggle: (enabled: boolean) => void
  onVariantChange: (value: string) => void
  onSecondaryVariantChange: (value: string) => void
}) {
  // `state` should always be present (loadInitial seeds the entire
  // catalog) but fall back to definition defaults if a freshly-added
  // flag races provider hydration.
  const enabled = state?.enabled ?? def.defaultEnabled
  const variant = state?.variant ?? def.defaultVariant
  const hasVariants = !!def.variants && def.variants.length > 0
  const activeVariant = def.variants?.find((v) => v.value === variant)
  const hasSecondaryVariants =
    !!def.secondaryVariants && def.secondaryVariants.length > 0
  const secondaryVariant = state?.secondaryVariant ?? def.defaultSecondaryVariant
  const activeSecondaryVariant = def.secondaryVariants?.find(
    (v) => v.value === secondaryVariant,
  )
  // Per-flag opt-in: surfaces an "Apply and Refresh" button under the
  // variant chips. Used by `study-calendar-status` so reviewers can
  // hard-reload the page after switching pacing override — keeps the
  // banner / stat band / calendar grid in lockstep with the new
  // status across the entire route (any consumer that read the flag
  // value at mount-time refreshes too).
  const showApplyAndRefresh = def.key === 'study-calendar-status'
  const { closePanel } = useFeatureFlagPanel()
  const handleApplyAndRefresh = () => {
    closePanel()
    // Defer a tick so the panel close animation can settle before the
    // hard reload yanks the page out from under it.
    window.setTimeout(() => window.location.reload(), 0)
  }

  return (
    <article
      style={{
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        background: 'var(--color-surface-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 15,
              fontWeight: 600,
              lineHeight: '20px',
              color: 'var(--color-text-primary)',
            }}
          >
            {def.label}
          </h3>
          {def.description && (
            <Tooltip content={def.description}>
              <button
                type="button"
                aria-label={`About ${def.label}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: 'var(--color-text-tertiary)',
                  cursor: 'help',
                  lineHeight: 0,
                  flexShrink: 0,
                }}
              >
                <HelpCircle size={14} aria-hidden />
              </button>
            </Tooltip>
          )}
        </div>
        <ToggleSwitch
          ariaLabel={`Toggle ${def.label}`}
          checked={enabled}
          onChange={onToggle}
        />
      </div>

      {hasVariants && enabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
            }}
          >
            Variant
          </span>
          <VariantControl
            ariaLabel={`${def.label} variant`}
            options={def.variants!}
            value={variant}
            onChange={onVariantChange}
          />
          {activeVariant?.description && (
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 11,
                lineHeight: '14px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {activeVariant.description}
            </p>
          )}
          {showApplyAndRefresh && (
            <button
              type="button"
              onClick={handleApplyAndRefresh}
              style={applyAndRefreshBtnStyle}
            >
              Apply and Refresh
            </button>
          )}
        </div>
      )}

      {hasSecondaryVariants &&
        (def.secondaryVariantWhenDisabled ? !enabled : enabled) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {def.secondaryVariantLabel ?? 'Variant'}
          </span>
          <VariantControl
            ariaLabel={`${def.label} ${def.secondaryVariantLabel ?? 'variant'}`}
            options={def.secondaryVariants!}
            value={secondaryVariant}
            onChange={onSecondaryVariantChange}
          />
          {activeSecondaryVariant?.description && (
            <p
              style={{
                margin: '4px 0 0',
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 11,
                lineHeight: '14px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {activeSecondaryVariant.description}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

// A segmented control works up to ~6 short options; beyond that it wraps /
// crowds, so the variant picker falls back to a dropdown. Currently only the
// 9-option What's New layout flag crosses it; the 6-option daily-tasks flag and
// every smaller flag keep the pills.
const VARIANT_DROPDOWN_THRESHOLD = 6

/** Variant picker — a segmented radiogroup for a few options, or a `Select`
 *  dropdown once the list grows past `VARIANT_DROPDOWN_THRESHOLD`. Shared by the
 *  primary + secondary variant axes. The active variant's description still
 *  renders below it (owned by the caller), so it shows for either control. */
function VariantControl({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string
  options: FeatureFlagVariant[]
  value: string | undefined
  onChange: (value: string) => void
}) {
  if (options.length > VARIANT_DROPDOWN_THRESHOLD) {
    return (
      <Select
        label={ariaLabel}
        value={value ?? options[0]?.value}
        onChange={(e) => onChange(e.currentTarget.value)}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        style={{ alignSelf: 'flex-start', minWidth: 240, maxWidth: '100%' }}
      />
    )
  }
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        padding: 3,
        gap: 2,
        background: 'var(--color-neutral-100)',
        borderRadius: 'var(--radius-pill)',
        alignSelf: 'flex-start',
      }}
    >
      {options.map((v) => (
        <button
          key={v.value}
          type="button"
          role="radio"
          aria-checked={value === v.value}
          onClick={() => onChange(v.value)}
          style={variantPillStyle(value === v.value)}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

function variantPillStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 14px',
    minHeight: 28,
    borderRadius: 'var(--radius-pill)',
    border: 'none',
    background: active ? 'var(--color-surface-card)' : 'transparent',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    color: active
      ? 'var(--color-text-primary)'
      : 'var(--color-text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    transition: 'background 120ms ease, color 120ms ease',
  }
}

/* ─── ToggleSwitch — minimal inline switch primitive ──────────────── */

function ToggleSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 40,
        height: 22,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        background: checked
          ? 'var(--color-primary-600)'
          : 'var(--color-neutral-300)',
        transition: 'background 160ms ease',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--color-surface-card)',
          boxShadow: '0 1px 2px rgb(0 0 0 / 0.25)',
          transition: 'left 160ms ease',
        }}
      />
    </button>
  )
}

/* ─── shared styles ────────────────────────────────────────────────── */

const flagBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
}

const backArrowButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-primary)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-h3-semibold)',
  lineHeight: 'var(--text-h3-semibold--line-height)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const closeButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-pill)',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const bodyStyle: CSSProperties = {
  padding: '16px 20px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  flex: 1,
}

const dashboardVersionRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '12px 14px',
  background: 'var(--color-surface-muted)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
}

const dashboardVersionIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-600)',
}

const dashboardVersionTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: 1,
  minWidth: 0,
}

const dashboardVersionLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
}

const dashboardVersionCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const introCopyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const emptyStateStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-tertiary)',
  fontStyle: 'italic',
}

const pageListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

function pageRowStyle(hasFlags: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    padding: '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-subtle)',
    background: 'var(--color-surface-card)',
    cursor: 'pointer',
    textAlign: 'left',
    // Subtle visual hierarchy — pages with flags get the standard
    // surface; empty pages stay a touch muted so the active set
    // reads first.
    opacity: hasFlags ? 1 : 0.85,
    transition: 'border-color 120ms ease, background 120ms ease',
  }
}

const pageRowTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
}

const pageRowLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

const pageRowDescriptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}

const pageRowMetaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
}

function flagCountStyle(hasFlags: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: hasFlags
      ? 'var(--color-primary-700)'
      : 'var(--color-text-tertiary)',
    whiteSpace: 'nowrap',
  }
}

const flagListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const groupHeaderItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginTop: 8,
}

const groupHeaderLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-700)',
  whiteSpace: 'nowrap',
}

const groupHeaderRuleStyle: CSSProperties = {
  flex: 1,
  height: 1,
  background: 'var(--color-border-subtle)',
}

const footerStyle: CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid var(--color-border-subtle)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 6,
}

const footerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  width: '100%',
}

const resetButtonStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '6px 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}

// "Set as default" — a filled CTA so it reads as the committed action
// in the footer, distinct from the underlined text reset/restore links.
const setDefaultButtonStyle: CSSProperties = {
  background: 'var(--color-cta-500)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '7px 14px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

// Escape hatch — clears the saved custom default back to catalog
// originals. Quiet text link so it doesn't compete with the row above.
const restoreOriginalsStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '2px 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}

// Filled CTA used by per-flag "Apply and Refresh" affordances. CTA
// blue background so the action reads as the row's committed
// follow-up rather than an extra option in the variant picker.
const applyAndRefreshBtnStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 4,
  background: 'var(--color-cta-500)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  padding: '6px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
