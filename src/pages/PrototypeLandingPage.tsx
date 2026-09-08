import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  CalendarDay,
  Check,
  ChevronRight,
  CircleCheck,
  Clock,
  Flag,
  Grid,
  Lightbulb,
  Lock,
  LockSolid,
  MessageCircle,
  Monitor,
  Share2,
  Table,
  X,
  ArrowUpRightFromSquare,
} from '@/icons'
import { PrototypeBar } from '@/components/layout/PrototypeBar'
import { clearPrototypeWalkthrough, setPrototypeWalkthrough } from '@/components/layout/prototypeWalkthrough'
import { PrototypePasswordModal } from '@/components/prototype/PrototypeLock'
import { isPrototypeUnlocked, markPrototypeUnlocked } from '@/components/prototype/prototypeLockUtil'
import {
  getDoneOverrides,
  setFeatureDone,
  getInDesignOverrides,
  setFeatureInDesign,
  getLastDevTab,
  setLastDevTab,
} from '@/components/prototype/prototypeDoneUtil'
import {
  featureStatusChipFor,
  featureStatusKeyOf,
  type FeatureStatusKey,
  type DevStatus,
  DEV_STATUS_STROKE,
  DEV_STATUS_LABEL,
  DEV_STATUS_SEQUENCE,
  readDevStatusMap,
  setFeatureRollupStatus,
} from '@/components/prototype/devHandoffStatusUtil'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { ArchiveTable } from '@/components/prototype/ArchiveTable'
import { ActionMenu } from '@/components/ui/ActionMenu'
import { Toast } from '@/components/ui/Toast'
import { PROTOTYPE_SHARE_ORIGIN, copyToClipboard } from '@/components/prototype/shareLink'
import { useAccount } from '@/context/AccountContext'
import {
  PROTOTYPE_FEATURES,
  type FeatureAccent,
  type PrototypeFeature,
} from '@/data/prototypeFeatures'

/** Maps the feature's icon key to an icon component from the registry.
 *  `lightbulb` isn't a `FeatureIcon` — it's used by the Research chooser card,
 *  which draws from this same map. */
const ICONS = {
  grid: Grid,
  calendar: CalendarDay,
  flag: Flag,
  monitor: Monitor,
  lightbulb: Lightbulb,
} as const

/** The summary shown on a tile / table row: the short authored `tileBlurb`,
 *  falling back to the full `blurb` for features already short enough. The
 *  gateway header always uses the full `blurb` — that's where the long version
 *  belongs, since it has the room. */
const tileBlurbOf = (feature: PrototypeFeature) => feature.tileBlurb ?? feature.blurb

/** Accent → token. Tiles tint their medallion + hover stroke with these. */
const ACCENT_TOKEN: Record<FeatureAccent, string> = {
  teal: 'var(--color-primary-500)',
  gold: 'var(--color-secondary-500)',
  blue: 'var(--color-cta-500)',
  neutral: 'var(--color-neutral-600)',
}

/**
 * Two-level landing structure.
 *
 * Level 1 — the visitor picks a SECTION: **Demo** (open to everyone) or
 * **Design & Development** (password-gated, same lock logic as the old
 * Discoverability tile). Level 2 shows that section's content:
 *   • demo → the presentation-ready demo tiles (category === 'demo').
 *   • dev  → the working set, filtered by the four sub-tabs below.
 *
 * URL model: `?section=demo` / `?section=dev&tab=<dev-tab>`. No params → the
 * Level-1 chooser. For back-compat with the old flat `?tab=` deep links
 * (feature gateways still link back to `/?tab=dev-handoff` etc.), a bare dev
 * `tab` value implies `section=dev`.
 */
type Section = 'demo' | 'dev' | 'dashboard' | 'exploration'

/**
 * The Design & Development sub-filters (Level 2 of the dev section) — reduced to
 * the three states a feature is actually IN:
 *   • working → everything still being worked on, whatever its dev-cycle status
 *               (Needs Discussion / In Design / Blocked / Ready for Dev / In
 *               Development / no status yet). The old Dev Handoff · Testing · In
 *               Design tabs all collapse into this one; the status PILLS below
 *               do the narrowing instead of a tab per state.
 *   • done    → marked complete (config `done` or the per-browser override).
 *   • archive → the table of removed components (ArchiveTable), not a tile list.
 * The Dashboard experiences moved OUT of these tabs to their own locked Level-1
 * section (see `Section`), so they no longer dilute the working list.
 */
type DevTab = 'working' | 'done' | 'archive'

const DEV_TABS: PillTabItem<DevTab>[] = [
  { id: 'working', label: 'Working On It' },
  { id: 'done', label: 'Done' },
  { id: 'archive', label: 'Archive' },
]

/** Valid `?tab=` values — derived from the strip above so the two can't drift
 *  (they were previously two hand-maintained lists). */
const DEV_TAB_IDS: DevTab[] = DEV_TABS.map((t) => t.id)

const isDevTab = (value: string | null): value is DevTab =>
  value !== null && DEV_TAB_IDS.includes(value as DevTab)

/** Retired `?tab=` values → where they land now, so links shared before the tab
 *  set was reduced still open something sensible. `dashboard` is absent on
 *  purpose: those features became their own section, handled in `sectionFor`. */
const LEGACY_DEV_TABS: Record<string, DevTab> = {
  'dev-handoff': 'working',
  testing: 'working',
  'in-progress': 'working',
}

/** Where the dev section opens when there's no `?tab=` and nothing persisted. */
const DEFAULT_DEV_TAB: DevTab = 'working'

/** Tile grid vs. a compact table. **Table is the default** — the feature list is
 *  long enough that the scannable table is the more useful landing view; the
 *  tile grid is the opt-in. Persisted per browser, so an explicit `tile` choice
 *  sticks and only an absent/unrecognised value falls back to table. */
type FeatureViewMode = 'tile' | 'table'
const VIEW_MODE_STORAGE_KEY = 'cgp.prototype.viewMode'
function readFeatureViewMode(): FeatureViewMode {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'tile' ? 'tile' : 'table'
  } catch {
    return 'table'
  }
}
function writeFeatureViewMode(mode: FeatureViewMode) {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  } catch {
    /* ignore private-mode storage errors */
  }
}

/** The single gate id for the whole Design & Development section. Unlocking it
 *  once (per session) opens every tile inside — the per-tile `locked` flag is
 *  no longer used (the section gate replaces it). */
const DEV_GATE_ID = 'design-and-development'
/** Gate id for the Dashboard section. Separate from the D&D gate so each section
 *  is locked in its own right (same password, prompted once per section per
 *  session). */
const DASHBOARD_GATE_ID = 'dashboard-experiences'

/** Design Exploration gate. Unlike the Demo / Dashboard / D&D sections this one
 *  does NOT use the shared admin-settable prototype password — it carries its
 *  own, passed straight to the modal, so it can be shared with people who
 *  should see an exploration without getting the rest of the dev sections. */
const EXPLORATION_GATE_ID = 'design-exploration'
const EXPLORATION_PASSWORD = 'jillisthegoat'

/**
 * Prototype gateway — the app's front door (`/`). Sits OUTSIDE the AppLayout
 * chrome so it reads as a distinct landing surface. Clearly flags the build as
 * an in-progress UX prototype, then presents the Demo / Design & Development
 * chooser and the section content sourced from `src/data/prototypeFeatures.ts`.
 */
export function PrototypeLandingPage() {
  // The gateway is a clean, brand-neutral surface — reset the document title
  // so the tab doesn't carry over a deep-page title. Landing home also
  // ends any active feature walkthrough.
  useEffect(() => {
    document.title = 'UX Prototype — Member Platform'
    clearPrototypeWalkthrough()
  }, [])

  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const tabParam = searchParams.get('tab')
  const statusParam = searchParams.get('status')
  // A bare `?tab=` value (old back-links from the feature gateways) implies the
  // dev section — including the retired ids, which now map into Working On It.
  const impliesDev = isDevTab(tabParam) || (tabParam !== null && tabParam in LEGACY_DEV_TABS)

  // Section is URL-derived (single source of truth). `?tab=dashboard` predates
  // the Dashboard experiences becoming their own section, so it lands there.
  const section: Section | null =
    sectionParam === 'demo' || tabParam === 'demo'
      ? 'demo'
      : sectionParam === 'dashboard' || tabParam === 'dashboard'
        ? 'dashboard'
        : sectionParam === 'exploration'
          ? 'exploration'
          : sectionParam === 'dev' || impliesDev
            ? 'dev'
            : null

  // Active dev sub-tab. An explicit `?tab=` wins (retired ids resolve through
  // LEGACY_DEV_TABS); otherwise fall back to the reviewer's last-viewed tab
  // (persisted) so re-entering the section returns them where they left off.
  const storedDevTab = getLastDevTab()
  const devTab: DevTab = isDevTab(tabParam)
    ? tabParam
    : tabParam !== null && tabParam in LEGACY_DEV_TABS
      ? LEGACY_DEV_TABS[tabParam]
      : isDevTab(storedDevTab)
        ? storedDevTab
        : DEFAULT_DEV_TAB

  // Whether each gated section has been cleared this session. Held in state so
  // an unlock re-renders (sessionStorage changes don't).
  const [devUnlocked, setDevUnlocked] = useState(() => isPrototypeUnlocked(DEV_GATE_ID))
  const [askDev, setAskDev] = useState(false)
  const [dashUnlocked, setDashUnlocked] = useState(() => isPrototypeUnlocked(DASHBOARD_GATE_ID))
  // Derived, not set from an effect: the prompt is open when the reviewer asked
  // for it OR they deep-linked into the locked section. (The dev gate above
  // still uses the older effect form — left alone rather than churned.)
  const [askDashManual, setAskDashManual] = useState(false)
  const askDash = askDashManual || (section === 'dashboard' && !dashUnlocked)
  const [explUnlocked, setExplUnlocked] = useState(() => isPrototypeUnlocked(EXPLORATION_GATE_ID))
  const [askExplManual, setAskExplManual] = useState(false)
  const askExpl = askExplManual || (section === 'exploration' && !explUnlocked)
  // Tile grid vs. compact table for the D&D feature list (persisted per browser).
  const [viewMode, setViewModeState] = useState<FeatureViewMode>(readFeatureViewMode)
  const setViewMode = (mode: FeatureViewMode) => {
    setViewModeState(mode)
    writeFeatureViewMode(mode)
  }

  // Deep-linking into a gated section while still locked → prompt for the gate.
  useEffect(() => {
    if (section === 'dev' && !devUnlocked) setAskDev(true)
  }, [section, devUnlocked])

  // A `?tab=` value we no longer recognise (a renamed/retired tab from an older
  // shared link) used to leave the stale param sitting in the URL while the page
  // quietly rendered a different tab — so the address bar and the highlighted
  // pill disagreed, and re-sharing propagated the dead link. Rewrite it to the
  // tab actually shown (retired-but-mapped ids included, so `?tab=dev-handoff`
  // normalises to `?tab=working`). Only fires while the param doesn't match the
  // rendered tab, so it can't loop.
  useEffect(() => {
    if (section !== 'dev' || tabParam === null || tabParam === devTab) return
    setSearchParams({ section: 'dev', tab: devTab }, { replace: true })
  }, [section, tabParam, devTab, setSearchParams])

  // Same normalisation for the two sections a bare `?tab=` can imply — the
  // Dashboard experiences and Demo are sections now, not tabs, so rewrite those
  // legacy links to `?section=` rather than leaving a tab param that no longer
  // names anything.
  useEffect(() => {
    if (tabParam !== 'dashboard' && tabParam !== 'demo') return
    setSearchParams({ section: tabParam }, { replace: true })
  }, [tabParam, setSearchParams])

  // Runtime "Done" overrides (persisted). Tri-state, mirroring In Design below:
  // an entry forces the status on/off, absence falls back to the feature's
  // config `done` — so a finished feature ships as Done for every reviewer and
  // a reviewer can still reopen it locally. Held in state so flipping a tile's
  // status re-renders the grid and moves the tile between tabs live.
  const [doneOverrides, setDoneOverrides] = useState<Record<string, boolean>>(
    () => getDoneOverrides(),
  )

  const isDone = (feature: PrototypeFeature) => doneOverrides[feature.id] ?? !!feature.done

  const toggleDone = (feature: PrototypeFeature) => {
    const next = !isDone(feature)
    setDoneOverrides((prev) => ({ ...prev, [feature.id]: next }))
    setFeatureDone(feature.id, next)
  }

  // Runtime "In Design" overrides (persisted). Tri-state: an entry forces the
  // status on/off, absence falls back to the feature's config `inProgress`. Held
  // in state so toggling from a tile kebab re-renders and moves the tile between
  // its category tab and the In Design tab live (mirrors the Done toggle).
  const [inDesign, setInDesign] = useState<Record<string, boolean>>(() => getInDesignOverrides())

  const isInDesign = (feature: PrototypeFeature) => inDesign[feature.id] ?? !!feature.inProgress

  const toggleInDesign = (feature: PrototypeFeature) => {
    const next = !isInDesign(feature)
    setInDesign((prev) => ({ ...prev, [feature.id]: next }))
    setFeatureInDesign(feature.id, next)
  }

  // Dev-cycle status rolled up to the tile — the reviewer picks one status and
  // it cascades to every handoff card in the feature; the tile then reflects
  // the cards' combined state ('mixed' when they disagree). Kept in state so a
  // cascade re-renders the tile banner live (localStorage isn't reactive).
  const [devStatusMap, setDevStatusMap] = useState<Record<string, DevStatus>>(
    () => readDevStatusMap(),
  )

  const componentIdsFor = (feature: PrototypeFeature): string[] =>
    feature.devHandoff?.components?.map((comp) => comp.id) ?? []

  const rollupStatusFor = (feature: PrototypeFeature): DevStatus | 'mixed' | null => {
    const ids = componentIdsFor(feature)
    // No handoff cards to roll up — the authored `devStatus` is the whole story.
    if (ids.length === 0) return feature.devStatus ?? null
    const seen = new Set<DevStatus | null>(
      ids.map((id) => devStatusMap[`${feature.id}:${id}`] ?? feature.devStatus ?? null),
    )
    if (seen.size === 1) return [...seen][0] ?? null
    return 'mixed'
  }

  const setRollupStatus = (feature: PrototypeFeature, status: DevStatus | null) => {
    setFeatureRollupStatus(feature.id, componentIdsFor(feature), status)
    // Re-read the store so the tile banner and the card menus stay in sync.
    setDevStatusMap(readDevStatusMap())
  }

  const goHome = () => setSearchParams({})
  const openDemo = () => setSearchParams({ section: 'demo' })
  // Reopen the dev section on the reviewer's last-viewed tab (persisted).
  const openDev = () => {
    const last = getLastDevTab()
    setSearchParams({ section: 'dev', tab: isDevTab(last) ? last : DEFAULT_DEV_TAB })
  }
  const openDashboard = () => setSearchParams({ section: 'dashboard' })
  const openExploration = () => setSearchParams({ section: 'exploration' })
  // Switching tab drops any status pill — a status that exists under Working On
  // It (say Blocked) doesn't under Done, so carrying it over would land the
  // reviewer on an empty list with a pill that isn't in the row.
  const changeDevTab = (next: DevTab) => {
    setLastDevTab(next)
    setSearchParams({ section: 'dev', tab: next }, { replace: true })
  }
  const changeStatus = (next: FeatureStatusKey | 'all') => {
    const params: Record<string, string> = { section: 'dev', tab: devTab }
    if (next !== 'all') params.status = next
    setSearchParams(params, { replace: true })
  }

  // Clicking a gated section card: open straight through if already unlocked,
  // else prompt for the section password.
  const enterDev = () => {
    if (devUnlocked) openDev()
    else setAskDev(true)
  }
  const enterDashboard = () => {
    if (dashUnlocked) openDashboard()
    else setAskDashManual(true)
  }

  // Section content. Demo shows the demo-category tiles; the two gated sections
  // only render once unlocked (else the chooser stays behind the modal).
  const showDev = section === 'dev' && devUnlocked
  const showDashboard = section === 'dashboard' && dashUnlocked
  const showDemo = section === 'demo'
  const showExploration = section === 'exploration' && explUnlocked
  const showChooser = !showDev && !showDemo && !showDashboard && !showExploration

  // Demo tiles: the presentation-ready experiences (category === 'demo').
  // Deliberately NOT filtered by Done: only dev-handoff tiles carry the "Mark
  // done" action, so a demo tile can't be marked done from the UI — and because
  // the Done tab excludes demo tiles, a stale stored id would have made a demo
  // experience vanish from BOTH sections with no way to bring it back.
  const demoFeatures = PROTOTYPE_FEATURES.filter((f) => f.category === 'demo')

  // Dashboard experiences — their own Level-1 section now, so they're excluded
  // from the dev tabs below rather than sitting in a tab of their own.
  const dashboardFeatures = PROTOTYPE_FEATURES.filter((f) => f.category === 'dashboard')
  // Design Exploration tiles — their own section, so they are excluded from the
  // D&D working list below the same way the Dashboard experiences are.
  const explorationFeatures = PROTOTYPE_FEATURES.filter((f) => f.category === 'exploration')

  // The dev section's working set: everything that isn't a Demo tile or a
  // Dashboard experience. Done vs. Working On It is the only split — the old
  // per-category tabs are gone.
  const devScope = PROTOTYPE_FEATURES.filter(
    (f) => f.category !== 'demo' && f.category !== 'dashboard' && f.category !== 'exploration',
  )
  const tabFeatures =
    devTab === 'archive' ? [] : devScope.filter((f) => isDone(f) === (devTab === 'done'))

  // Status counts for the pill row, in the canonical status order (the picker
  // sequence, then the states that aren't dev-cycle statuses). Only statuses
  // present in the current tab appear, so no pill leads to an empty list.
  const statusOrder: FeatureStatusKey[] = [...DEV_STATUS_SEQUENCE, 'mixed', 'none', 'coming-soon', 'done']
  const keyOf = (f: PrototypeFeature) =>
    featureStatusKeyOf(f, isDone(f), isInDesign(f), rollupStatusFor(f))
  const statusCounts = statusOrder
    .map((key) => ({ key, count: tabFeatures.filter((f) => keyOf(f) === key).length }))
    .filter((c) => c.count > 0)

  // The active pill. An unknown / no-longer-present `?status=` degrades to All
  // rather than showing an empty list.
  const activeStatus: FeatureStatusKey | 'all' =
    statusCounts.some((c) => c.key === statusParam)
      ? (statusParam as FeatureStatusKey)
      : 'all'
  const showStatusFilter = devTab === 'working'
  const devFeatures =
    showStatusFilter && activeStatus !== 'all'
      ? tabFeatures.filter((f) => keyOf(f) === activeStatus)
      : tabFeatures

  return (
    <div
      // Per design direction, this page uses STC's teal accent for its links /
      // active tab / hover instead of the active brand's CTA ramp (which reads
      // purple/pink). The class remaps only the CTA ramp — see tokens.css.
      className="cre-prototype-stc-accent"
      style={{
        minHeight: '100vh',
        background: 'var(--color-surface-page)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <PrototypeBar
        showHomeLink={false}
        // In a section (Demo / Design & Development), the "← Back" pill in the
        // top bar returns to the Level-1 overview (the chooser); on the chooser
        // itself there's nowhere to go back to.
        back={
          showDemo || showDev
            ? { to: '/', label: 'Back', title: 'Back to overview' }
            : undefined
        }
      />

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 24px 80px' }}>
        <header style={{ marginBottom: showChooser ? 40 : 28 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-text)',
            }}
          >
            Prototype Demo, Features and Specifications
          </p>
          <h1
            style={{
              margin: '12px 0 0',
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-6xl)',
              lineHeight: 'var(--text-heading-6xl--line-height)',
              color: 'var(--color-text-primary)',
            }}
          >
            Common Dashboard
          </h1>
        </header>

        {showChooser && (
          <SectionChooser
            demoCount={demoFeatures.length}
            dashboardCount={dashboardFeatures.length}
            devUnlocked={devUnlocked}
            dashUnlocked={dashUnlocked}
            explorationCount={explorationFeatures.length}
            explUnlocked={explUnlocked}
            onEnterExploration={() => {
              if (explUnlocked) openExploration()
              else setAskExplManual(true)
            }}
            onOpenDemo={openDemo}
            onEnterDev={enterDev}
            onEnterDashboard={enterDashboard}
          />
        )}

        {showExploration && (
          <>
            <SectionHeading
              title="Design Exploration"
              blurb="Outside products and ideas rebuilt on our design system — same functionality, our tokens, components and UX conventions. Each opens in a new tab as a standalone prototype."
            />
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                {explorationFeatures.length}{' '}
                {explorationFeatures.length === 1 ? 'exploration' : 'explorations'}
              </span>
            </div>
            <FeatureGrid
              features={explorationFeatures}
              isDone={isDone}
              onToggleDone={toggleDone}
              isInDesign={isInDesign}
              onToggleInDesign={toggleInDesign}
              rollupStatusFor={rollupStatusFor}
              onSetRollupStatus={setRollupStatus}
              emptyTab="exploration-section"
            />
          </>
        )}

        {showDashboard && (
          <>
            <SectionHeading
              title="Dashboard"
              blurb="The full dashboard experiences and sandboxes — open the platform and navigate freely."
            />
            <div
              style={{
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                {dashboardFeatures.length}{' '}
                {dashboardFeatures.length === 1 ? 'experience' : 'experiences'}
              </span>
              <FeatureViewToggle mode={viewMode} onChange={setViewMode} />
            </div>
            {viewMode === 'table' ? (
              <FeatureTable
                features={dashboardFeatures}
                isDone={isDone}
                isInDesign={isInDesign}
                rollupStatusFor={rollupStatusFor}
                onToggleDone={toggleDone}
                onToggleInDesign={toggleInDesign}
                onSetRollupStatus={setRollupStatus}
                emptyTab="dashboard-section"
              />
            ) : (
              <FeatureGrid
                features={dashboardFeatures}
                isDone={isDone}
                onToggleDone={toggleDone}
                isInDesign={isInDesign}
                onToggleInDesign={toggleInDesign}
                rollupStatusFor={rollupStatusFor}
                onSetRollupStatus={setRollupStatus}
                emptyTab="dashboard-section"
              />
            )}
          </>
        )}

        {showDemo && (
          <>
            <SectionHeading
              title="Demo"
              blurb="Presentation-ready experiences to walk stakeholders through. Each always renders its Default configuration and stays pure no matter how the sandbox is tinkered."
            />
            <FeatureGrid
              features={demoFeatures}
              isDone={isDone}
              onToggleDone={toggleDone}
              isInDesign={isInDesign}
              onToggleInDesign={toggleInDesign}
              rollupStatusFor={rollupStatusFor}
              onSetRollupStatus={setRollupStatus}
              emptyTab="demo"
            />
          </>
        )}

        {showDev && (
          <>
            <SectionHeading
              title="Design & Development"
              blurb="The full working set — developer handoffs, in-progress builds, test flows, and completed specs."
            />
            <div
              style={{
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              {/* Status strip + the result total beside it — the app-wide
                  top-filter convention (no per-pill counts; the total sits
                  next to the strip). Suppressed on Archive, which is its own
                  table of removed components rather than a filtered list. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <PillTabs
                  label="Filter features"
                  items={DEV_TABS}
                  active={devTab}
                  onChange={changeDevTab}
                />
                {devTab !== 'archive' && (
                  <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
                    {devFeatures.length} {devFeatures.length === 1 ? 'feature' : 'features'}
                  </span>
                )}
              </div>
              {/* Tile ⇄ Table toggle, far right. Hidden on Archive (already a
                  table). */}
              {devTab !== 'archive' && <FeatureViewToggle mode={viewMode} onChange={setViewMode} />}
            </div>
            {/* Secondary status pills — Working On It holds every in-flight
                status, so this is how the reviewer narrows to one. */}
            {showStatusFilter && (
              <StatusFilterRow
                counts={statusCounts}
                active={activeStatus}
                onChange={changeStatus}
              />
            )}
            {/* The Archive tab renders a table of removed components; every other
                tab renders the feature tile grid or the compact table. */}
            {devTab === 'archive' ? (
              <ArchiveTable />
            ) : viewMode === 'table' ? (
              <FeatureTable
                features={devFeatures}
                isDone={isDone}
                isInDesign={isInDesign}
                rollupStatusFor={rollupStatusFor}
                onToggleDone={toggleDone}
                onToggleInDesign={toggleInDesign}
                onSetRollupStatus={setRollupStatus}
                emptyTab={devTab}
              />
            ) : (
              <FeatureGrid
                features={devFeatures}
                isDone={isDone}
                onToggleDone={toggleDone}
                isInDesign={isInDesign}
                onToggleInDesign={toggleInDesign}
                rollupStatusFor={rollupStatusFor}
                onSetRollupStatus={setRollupStatus}
                emptyTab={devTab}
              />
            )}
          </>
        )}

        <p
          style={{
            marginTop: 40,
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          This is a design prototype for internal review. Flows, data, and visuals are illustrative
          and subject to change — nothing here is final.
        </p>
      </div>

      {askDev && (
        <PrototypePasswordModal
          featureTitle="Design & Development"
          onClose={() => {
            setAskDev(false)
            // A locked deep-link (`?section=dev`) leaves the chooser behind the
            // modal — cancelling returns to it cleanly.
            if (section === 'dev' && !devUnlocked) goHome()
          }}
          onUnlock={() => {
            markPrototypeUnlocked(DEV_GATE_ID)
            setDevUnlocked(true)
            setAskDev(false)
            openDev()
          }}
        />
      )}

      {askExpl && (
        <PrototypePasswordModal
          featureTitle="Design Exploration"
          password={EXPLORATION_PASSWORD}
          onClose={() => {
            setAskExplManual(false)
            if (section === 'exploration' && !explUnlocked) goHome()
          }}
          onUnlock={() => {
            markPrototypeUnlocked(EXPLORATION_GATE_ID)
            setExplUnlocked(true)
            setAskExplManual(false)
            openExploration()
          }}
        />
      )}

      {askDash && (
        <PrototypePasswordModal
          featureTitle="Dashboard"
          onClose={() => {
            setAskDashManual(false)
            // A locked deep-link keeps the derived prompt open until the
            // section param clears, so cancelling goes home.
            if (section === 'dashboard' && !dashUnlocked) goHome()
          }}
          onUnlock={() => {
            markPrototypeUnlocked(DASHBOARD_GATE_ID)
            setDashUnlocked(true)
            setAskDashManual(false)
            openDashboard()
          }}
        />
      )}
    </div>
  )
}

/** Level 1 — the Demo / Design & Development chooser. Two large selector cards;
 *  the dev card carries a lock badge + scrim until it's been unlocked. */
function SectionChooser({
  demoCount,
  dashboardCount,
  devUnlocked,
  dashUnlocked,
  onOpenDemo,
  onEnterDev,
  onEnterDashboard,
  explorationCount,
  explUnlocked,
  onEnterExploration,
}: {
  demoCount: number
  dashboardCount: number
  devUnlocked: boolean
  dashUnlocked: boolean
  onOpenDemo: () => void
  onEnterDev: () => void
  onEnterDashboard: () => void
  explorationCount: number
  explUnlocked: boolean
  onEnterExploration: () => void
}) {
  const navigate = useNavigate()
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
      }}
    >
      <ChooserCard
        icon="monitor"
        accent="teal"
        title="Demo"
        blurb="Presentation-ready experiences to walk stakeholders through. Always renders the Default configuration."
        footer={`${demoCount} ${demoCount === 1 ? 'experience' : 'experiences'} available`}
        cta="Open Demo"
        shareHref="/?section=demo"
        onClick={onOpenDemo}
      />
      <ChooserCard
        icon="lightbulb"
        accent="gold"
        title="Design Exploration"
        blurb="Design explorations ported onto our design system — outside products and ideas rebuilt with our tokens, components and UX conventions to see how they hold up. Password-protected separately from the dev sections."
        footer={
          explorationCount === 1 ? '1 exploration' : `${explorationCount} explorations`
        }
        cta={explUnlocked ? 'Open Explorations' : 'Unlock Explorations'}
        locked={!explUnlocked}
        shareHref="/?section=exploration"
        onClick={onEnterExploration}
      />
      <ChooserCard
        icon="lightbulb"
        accent="blue"
        title="Research & Rationale"
        blurb="The UX research and reasoning behind these designs — one entry per decision, each with sources. Opens inside the prototype; share any decision with a direct link."
        footer="22 documented decisions"
        cta="Open Research"
        shareHref="/research-rationale"
        onClick={() => navigate('/research-rationale')}
      />
      {/* Dashboard — the whole-platform experiences, promoted out of the D&D
          tab set to their own section. Gated in its own right (same password,
          its own once-per-session prompt). */}
      <ChooserCard
        icon="monitor"
        accent="teal"
        title="Dashboard"
        blurb="The full dashboard experiences and sandboxes — open the platform and navigate freely."
        footer={
          dashUnlocked
            ? 'Unlocked this session'
            : `Password required · ${dashboardCount} ${dashboardCount === 1 ? 'experience' : 'experiences'}`
        }
        cta={dashUnlocked ? 'Open section' : 'Unlock section'}
        locked={!dashUnlocked}
        shareHref="/?section=dashboard"
        onClick={onEnterDashboard}
      />
      <ChooserCard
        icon="grid"
        accent="gold"
        title="Design & Development"
        blurb="The full working set — developer handoffs, in-progress builds, test flows, and completed specs."
        footer={devUnlocked ? 'Unlocked this session' : 'Password required'}
        cta={devUnlocked ? 'Open section' : 'Unlock section'}
        locked={!devUnlocked}
        shareHref="/?section=dev"
        onClick={onEnterDev}
      />
    </div>
  )
}

/** One large Level-1 selector card (Demo / Design & Development). A button so it
 *  can gate / swap in-page state rather than navigate. */
function ChooserCard({
  icon,
  accent,
  title,
  blurb,
  footer,
  cta,
  locked = false,
  shareHref,
  onClick,
}: {
  icon: keyof typeof ICONS
  accent: FeatureAccent
  title: string
  blurb: string
  footer: string
  cta: string
  locked?: boolean
  /** Relative path this card opens — used to build the absolute "Share Link". */
  shareHref: string
  onClick: () => void
}) {
  const Icon = ICONS[icon]
  const token = ACCENT_TOKEN[accent]
  // Copy-link confirmation toast (the kebab "Share Link" action).
  const [copied, setCopied] = useState(false)
  const shareUrl = `${PROTOTYPE_SHARE_ORIGIN}${shareHref}`
  const handleShare = () => {
    copyToClipboard(shareUrl)
      .then(() => setCopied(true))
      .catch(() => window.prompt('Copy this link:', shareUrl))
  }
  return (
    // Relative wrapper so the kebab is a SIBLING of the card button (never
    // nested inside it — a button can't contain another button).
    <div style={{ position: 'relative', height: '100%' }}>
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        height: '100%',
        padding: 32,
        textAlign: 'left',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = token
        e.currentTarget.style.boxShadow = 'var(--shadow-popover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Reserve room at the top-right for the kebab (a sibling of this button)
          so the Open/Locked badge never slides under it. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingRight: 34 }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            background: 'color-mix(in srgb, ' + token + ' 14%, transparent)',
            color: token,
          }}
        >
          <Icon size={28} />
        </span>
        {locked ? (
          <span
            style={{
              ...BADGE_BASE,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--color-neutral-300)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Lock size={11} aria-hidden />
            Locked
          </span>
        ) : (
          <span
            style={{
              ...BADGE_BASE,
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
            }}
          >
            Open
          </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-3xl)',
            lineHeight: 'var(--text-heading-3xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 15,
            lineHeight: '24px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {blurb}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>{footer}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-action)',
          }}
        >
          {cta}
          {locked ? <Lock size={15} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
        </span>
      </div>
      {/* Locked → a dark scrim + lock circle over the whole card (in addition to
          the "Locked" badge). `pointer-events: none` so the button underneath
          still opens the password modal. */}
      {locked && <LockedOverlay />}
    </button>
      {/* Kebab (⋮) with a "Share Link" action — a sibling of the card button,
          top-right, above the locked scrim. Copies an absolute deep link. */}
      <div style={{ position: 'absolute', top: 22, right: 20, zIndex: 3 }}>
        <ActionMenu
          label={`Actions for ${title}`}
          items={[
            {
              id: 'share',
              label: 'Share Link',
              icon: <Share2 size={15} aria-hidden />,
              onSelect: handleShare,
            },
          ]}
        />
      </div>
      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        The link to this section is on your clipboard.
      </Toast>
    </div>
  )
}

/** The Level-2 section heading (title + one-line blurb). */
function SectionHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
          fontSize: 'var(--text-heading-3xl)',
          lineHeight: 'var(--text-heading-3xl--line-height)',
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 14,
          lineHeight: '22px',
          color: 'var(--color-text-secondary)',
          maxWidth: 640,
        }}
      >
        {blurb}
      </p>
    </div>
  )
}

/** The tile grid for a section (empty state when the filter yields nothing). */
function FeatureGrid({
  features,
  isDone,
  onToggleDone,
  isInDesign,
  onToggleInDesign,
  rollupStatusFor,
  onSetRollupStatus,
  emptyTab,
}: {
  features: PrototypeFeature[]
  isDone: (feature: PrototypeFeature) => boolean
  onToggleDone: (feature: PrototypeFeature) => void
  isInDesign: (feature: PrototypeFeature) => boolean
  onToggleInDesign: (feature: PrototypeFeature) => void
  rollupStatusFor: (feature: PrototypeFeature) => DevStatus | 'mixed' | null
  onSetRollupStatus: (feature: PrototypeFeature, status: DevStatus | null) => void
  emptyTab: EmptyTabKey
}) {
  if (features.length === 0) return <EmptyTab tab={emptyTab} />
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
      }}
    >
      {features.map((feature) => (
        <FeatureTile
          key={feature.id}
          feature={feature}
          isDone={isDone(feature)}
          isInDesign={isInDesign(feature)}
          onToggleDone={onToggleDone}
          onToggleInDesign={onToggleInDesign}
          rollupStatus={rollupStatusFor(feature)}
          onSetRollupStatus={onSetRollupStatus}
        />
      ))}
    </div>
  )
}

/** Right-aligned Tile ⇄ Table view toggle for the D&D feature list. */
function FeatureViewToggle({
  mode,
  onChange,
}: {
  mode: FeatureViewMode
  onChange: (m: FeatureViewMode) => void
}) {
  return (
    <div
      role="group"
      aria-label="Feature view"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        background: 'var(--color-neutral-50)',
        borderRadius: 'var(--radius-pill)',
      }}
    >
      <ViewToggleButton active={mode === 'tile'} label="Tile view" Icon={Grid} onClick={() => onChange('tile')} />
      <ViewToggleButton active={mode === 'table'} label="Table view" Icon={Table} onClick={() => onChange('table')} />
    </div>
  )
}

function ViewToggleButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean
  label: string
  Icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 30,
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        background: active ? 'var(--color-surface-card)' : 'transparent',
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      <Icon size={16} aria-hidden />
    </button>
  )
}

/** Compact table view of the feature list — the tile grid gets long, so this is
 *  the scannable alternative (Feature · Pages · Status · ⋮). Carries the same
 *  per-feature kebab as the tile grid, so switching view doesn't take the status
 *  controls away. */
function FeatureTable({
  features,
  isDone,
  isInDesign,
  rollupStatusFor,
  onToggleDone,
  onToggleInDesign,
  onSetRollupStatus,
  emptyTab,
}: {
  features: PrototypeFeature[]
  isDone: (feature: PrototypeFeature) => boolean
  isInDesign: (feature: PrototypeFeature) => boolean
  rollupStatusFor: (feature: PrototypeFeature) => DevStatus | 'mixed' | null
  onToggleDone: (feature: PrototypeFeature) => void
  onToggleInDesign: (feature: PrototypeFeature) => void
  onSetRollupStatus: (feature: PrototypeFeature, status: DevStatus | null) => void
  emptyTab: EmptyTabKey
}) {
  if (features.length === 0) return <EmptyTab tab={emptyTab} />
  return (
    // NOTE: deliberately NOT an `overflow-x: auto` scroller. Per spec, a single
    // non-visible overflow axis forces the other to `auto`, which would clip the
    // kebab dropdown inside the card — worst on the last row, where the menu
    // opens downward. The columns are narrow + the description truncates to one
    // line, so the table fits without a scroller.
    <div
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
        <thead>
          <tr>
            <th scope="col" style={FEAT_TH}>Feature</th>
            <th scope="col" style={{ ...FEAT_TH, textAlign: 'center', width: 84 }}>Pages</th>
            <th scope="col" style={{ ...FEAT_TH, width: 190 }}>Status</th>
            {/* Actions — the header is labelled for screen readers only; a
                visible "Actions" caption over a kebab column is noise. */}
            <th scope="col" style={{ ...FEAT_TH, width: 56 }}>
              <span className="cre-visually-hidden">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature) => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              isDone={isDone(feature)}
              isInDesign={isInDesign(feature)}
              rollupStatus={rollupStatusFor(feature)}
              onToggleDone={onToggleDone}
              onToggleInDesign={onToggleInDesign}
              onSetRollupStatus={onSetRollupStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const FEAT_TH: React.CSSProperties = {
  textAlign: 'left',
  padding: '11px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  borderBottom: '1px solid var(--color-border-subtle)',
  whiteSpace: 'nowrap',
}
const FEAT_TD: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  verticalAlign: 'middle',
}

/** One table row — the whole row navigates to the feature (external tiles open
 *  in a new tab; coming-soon rows are inert). Mirrors the tile's destination +
 *  status logic. */
function FeatureRow({
  feature,
  isDone,
  isInDesign,
  rollupStatus,
  onToggleDone,
  onToggleInDesign,
  onSetRollupStatus,
}: {
  feature: PrototypeFeature
  isDone: boolean
  isInDesign: boolean
  rollupStatus: DevStatus | 'mixed' | null
  onToggleDone: (feature: PrototypeFeature) => void
  onToggleInDesign: (feature: PrototypeFeature) => void
  onSetRollupStatus: (feature: PrototypeFeature, status: DevStatus | null) => void
}) {
  const navigate = useNavigate()
  const Icon = ICONS[feature.icon]
  const comingSoon = feature.status === 'coming-soon'
  const destination = feature.kind === 'explore' ? feature.to ?? '/dashboard' : `/prototype/${feature.id}`
  const external = feature.externalUrl
  const pageCount = feature.pages?.length ?? 0
  const status = featureStatusChip(feature, isDone, isInDesign, rollupStatus)
  const open = () => {
    if (comingSoon) return
    if (external) window.open(external, '_blank', 'noopener')
    else navigate(destination)
  }
  return (
    <tr
      onClick={open}
      onKeyDown={(e) => {
        if (!comingSoon && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          open()
        }
      }}
      tabIndex={comingSoon ? -1 : 0}
      role={comingSoon ? undefined : 'button'}
      aria-disabled={comingSoon || undefined}
      style={{ cursor: comingSoon ? 'default' : 'pointer', opacity: comingSoon ? 0.6 : 1 }}
    >
      <td style={FEAT_TD}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-neutral-50)',
              color: ACCENT_TOKEN[feature.accent],
            }}
          >
            <Icon size={17} aria-hidden />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>{feature.title}</span>
              {external && (
                <ArrowUpRightFromSquare size={12} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
              )}
            </span>
            <span
              style={{
                fontSize: 13,
                lineHeight: '18px',
                color: 'var(--color-text-secondary)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {tileBlurbOf(feature)}
            </span>
          </span>
        </span>
      </td>
      <td style={{ ...FEAT_TD, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>
        {pageCount || '—'}
      </td>
      <td style={FEAT_TD}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            color: status.color,
          }}
        >
          <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
          {status.label}
        </span>
      </td>
      {/* Actions kebab, far right. Coming-soon rows are inert, so they get no
          menu (matching the tile). The wrapper stops click + keydown from
          bubbling to the row, whose handlers would otherwise navigate away the
          moment you opened the menu or picked an item with the keyboard. */}
      <td
        style={{ ...FEAT_TD, textAlign: 'right', paddingLeft: 0 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {!comingSoon && (
          <FeatureActionsMenu
            feature={feature}
            isDone={isDone}
            isInDesign={isInDesign}
            rollupStatus={rollupStatus}
            onToggleDone={onToggleDone}
            onToggleInDesign={onToggleInDesign}
            onSetRollupStatus={onSetRollupStatus}
          />
        )}
      </td>
    </tr>
  )
}

/**
 * The status a feature DISPLAYS, as a single filterable key — the one source of
 * truth for both the table's Status column and the Working On It filter pills,
 * so a pill can never disagree with the row it filters.
 *
 * Precedence: coming-soon → Done → the dev-cycle status (roll-up across the
 * feature's handoff cards, else the authored `devStatus`) → the In Design flag →
 * nothing set. Note `inProgress` and the `in-design` dev-cycle status collapse
 * to the SAME key: they render the same "In Design" chip, so splitting them
 * across two pills would be a distinction without a difference to the reader.
 */
/** The status chip for a table row. */
function featureStatusChip(
  feature: PrototypeFeature,
  isDone: boolean,
  isInDesign: boolean,
  rollup: DevStatus | 'mixed' | null,
): { label: string; color: string } {
  return featureStatusChipFor(featureStatusKeyOf(feature, isDone, isInDesign, rollup))
}

/**
 * Secondary status filter for the Working On It list — "Status  ·  All · Needs
 * Discussion · In Design · …". Deliberately a SECONDARY chip row, not another
 * `PillTabs` strip: the tabs (Working On It / Done / Archive) are the primary
 * filter, and a second identical strip would compete with them.
 *
 * Only statuses actually present render, so the row never offers a pill that
 * leads to an empty list, and it hides entirely when everything shares one
 * status (nothing to narrow). Counts come with it — this is the same
 * label-plus-outlined-count-chip pattern as the Learning Paths home secondary
 * rows (the no-counts convention applies to the primary strip).
 */
function StatusFilterRow({
  counts,
  active,
  onChange,
}: {
  /** Status key → how many features in the list carry it, in display order. */
  counts: { key: FeatureStatusKey; count: number }[]
  active: FeatureStatusKey | 'all'
  onChange: (next: FeatureStatusKey | 'all') => void
}) {
  if (counts.length < 2) return null
  const total = counts.reduce((n, c) => n + c.count, 0)
  const chips: { key: FeatureStatusKey | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: total },
    ...counts.map((c) => ({ key: c.key, label: featureStatusChipFor(c.key).label, count: c.count })),
  ]
  return (
    <div
      role="group"
      aria-label="Filter by status"
      style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        }}
      >
        Status
      </span>
      {chips.map(({ key, label, count }) => {
        const isActive = key === active
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${isActive ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'}`,
              background: isActive ? 'var(--color-primary-100)' : 'var(--color-surface-card)',
              color: isActive ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 600,
              cursor: 'pointer',
              transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
            }}
          >
            {label}
            <span style={{ fontWeight: 600, opacity: 0.75 }}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Per-tab empty copy. Each says what the tab holds and, where the reviewer can
 *  act, which tile action fills it — the previous generic "No features in this
 *  tab yet" left Dashboard / Dev Handoff / Testing unexplained. Archive is
 *  absent: it renders its own table and never reaches this state. */
type EmptyTabKey = DevTab | 'demo' | 'dashboard-section' | 'exploration-section'

const EMPTY_TAB_MESSAGE: Partial<Record<EmptyTabKey, string>> = {
  demo: 'No demo experiences available yet.',
  'dashboard-section': 'No dashboard experiences yet.',
  'exploration-section': 'No design explorations yet.',
  working: 'Nothing in flight — every feature is either Done or archived.',
  done: 'No features marked done yet. Use “Mark done” on any tile to move it here.',
}

/** Friendly placeholder when a filter tab has no tiles (e.g. Done before
 *  anything is marked complete). */
function EmptyTab({ tab }: { tab: EmptyTabKey }) {
  const message = EMPTY_TAB_MESSAGE[tab] ?? 'No features in this tab yet.'
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--color-surface-card)',
        border: '1px dashed var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
        lineHeight: '22px',
      }}
    >
      {message}
    </div>
  )
}

/** One feature tile. The card body is a Link; the Done toggle is a sibling
 *  positioned over it (never nested inside the anchor). */
/** Icon (color-coded) shown next to each dev-cycle status in the tile roll-up
 *  menu — mirrors the per-card menu on the feature gateway. */
const STATUS_MENU_ICON: Record<DevStatus, React.ReactNode> = {
  'in-design': <Lightbulb size={15} aria-hidden style={{ color: 'var(--color-info-700)' }} />,
  'needs-discussion': (
    <MessageCircle size={15} aria-hidden style={{ color: 'var(--color-error-600)' }} />
  ),
  'blocked': <LockSolid size={15} aria-hidden style={{ color: 'var(--color-neutral-900)' }} />,
  'ready-for-dev': (
    <CircleCheck size={15} aria-hidden style={{ color: 'var(--color-success-500)' }} />
  ),
  'in-development': <Bolt size={15} aria-hidden style={{ color: 'var(--color-warning-500)' }} />,
}

/**
 * The per-feature kebab (⋮) — Copy link, the dev-cycle status roll-up, and the
 * In Design / Done toggles. Shared by the tile grid AND the table row so the two
 * views can't drift into offering different actions (the table used to be
 * read-only, which meant switching to it silently took the status controls away).
 * Owns its own copy-link toast; `Toast` portals to the body, so nesting it in a
 * table cell or an absolutely-positioned tile corner is safe either way.
 */
function FeatureActionsMenu({
  feature,
  isDone,
  isInDesign,
  rollupStatus,
  onToggleDone,
  onToggleInDesign,
  onSetRollupStatus,
}: {
  feature: PrototypeFeature
  isDone: boolean
  isInDesign: boolean
  rollupStatus: DevStatus | 'mixed' | null
  onToggleDone: (feature: PrototypeFeature) => void
  onToggleInDesign: (feature: PrototypeFeature) => void
  onSetRollupStatus: (feature: PrototypeFeature, status: DevStatus | null) => void
}) {
  const [copied, setCopied] = useState(false)
  const comingSoon = feature.status === 'coming-soon'
  const hasHandoffCards = (feature.devHandoff?.components?.length ?? 0) > 0
  // The dev-cycle roll-up only applies to dev-handoff features that actually
  // have handoff cards to cascade to.
  const showRollupStatus = !comingSoon && feature.category === 'dev-handoff' && hasHandoffCards
  const status = showRollupStatus ? rollupStatus : null
  // Only dev-handoff features carry the status toggles (the Dashboard
  // experiences and Testing links don't move between those tabs).
  const showStatusToggles = !comingSoon && feature.category === 'dev-handoff'

  // Absolute, shareable deep link. External features are already absolute;
  // in-app ones get the share origin prefixed.
  const destination =
    feature.kind === 'explore' ? feature.to ?? '/dashboard' : `/prototype/${feature.id}`
  const shareUrl = feature.externalUrl ?? `${PROTOTYPE_SHARE_ORIGIN}${destination}`
  const handleCopyLink = () => {
    copyToClipboard(shareUrl)
      .then(() => setCopied(true))
      .catch(() => window.prompt('Copy this link:', shareUrl))
  }

  return (
    <>
      <ActionMenu
        label={`Actions for ${feature.title}`}
        items={[
          {
            id: 'copy-link',
            label: 'Copy link',
            icon: <Share2 size={15} aria-hidden />,
            onSelect: handleCopyLink,
          },
          ...(showRollupStatus
            ? [
                ...DEV_STATUS_SEQUENCE.map((s) => ({
                  id: `status-${s}`,
                  label: status === s ? `${DEV_STATUS_LABEL[s]} ✓` : DEV_STATUS_LABEL[s],
                  icon: STATUS_MENU_ICON[s],
                  onSelect: () => onSetRollupStatus(feature, s),
                })),
                ...(status
                  ? [
                      {
                        id: 'status-clear',
                        label: 'Clear status',
                        icon: <X size={15} aria-hidden />,
                        onSelect: () => onSetRollupStatus(feature, null),
                      },
                    ]
                  : []),
              ]
            : []),
          ...(showStatusToggles
            ? [
                {
                  id: 'in-design',
                  label: isInDesign ? 'Move to Dev Handoff' : 'Move to In Design',
                  icon: <Clock size={15} aria-hidden />,
                  onSelect: () => onToggleInDesign(feature),
                },
                {
                  id: 'done',
                  label: isDone ? 'Reopen' : 'Mark done',
                  icon: isDone ? <ArrowLeft size={15} aria-hidden /> : <Check size={15} aria-hidden />,
                  onSelect: () => onToggleDone(feature),
                },
              ]
            : []),
        ]}
      />
      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        The link to this feature is on your clipboard.
      </Toast>
    </>
  )
}

function FeatureTile({
  feature,
  isDone,
  isInDesign,
  onToggleDone,
  onToggleInDesign,
  rollupStatus,
  onSetRollupStatus,
}: {
  feature: PrototypeFeature
  isDone: boolean
  isInDesign: boolean
  onToggleDone: (feature: PrototypeFeature) => void
  onToggleInDesign: (feature: PrototypeFeature) => void
  rollupStatus: DevStatus | 'mixed' | null
  onSetRollupStatus: (feature: PrototypeFeature, status: DevStatus | null) => void
}) {
  const Icon = ICONS[feature.icon]
  const accent = ACCENT_TOKEN[feature.accent]
  const comingSoon = feature.status === 'coming-soon'
  const { setAccount } = useAccount()
  const hasHandoffCards = (feature.devHandoff?.components?.length ?? 0) > 0
  // Dev-cycle status rolled up from this feature's handoff cards. Only
  // dev-handoff tiles that actually have cards carry the banner + cascade menu;
  // 'mixed' means the cards disagree.
  const showRollupStatus =
    feature.status !== 'coming-soon' && feature.category === 'dev-handoff' && hasHandoffCards
  const tileStatus = showRollupStatus ? rollupStatus : null
  const statusColor =
    tileStatus === 'mixed'
      ? 'var(--color-neutral-600)'
      : tileStatus
        ? DEV_STATUS_STROKE[tileStatus]
        : null
  const statusLabel =
    tileStatus === 'mixed' ? 'Mixed' : tileStatus ? DEV_STATUS_LABEL[tileStatus] : null
  // Locked + not yet unlocked this session → show the dark scrim overlay (a
  // visual cue beyond the "LOCKED" pill). Mirrors the click-gate condition, so
  // once unlocked the overlay clears and the tile opens straight through.
  const locked = feature.locked === true && !isPrototypeUnlocked(feature.id)
  const navigate = useNavigate()
  // Password gate — each tile prompts once per session before opening.
  const [askOpen, setAskOpen] = useState(false)

  // Where the tile points: explore tiles jump straight into the platform;
  // guided tiles open their curated page list at /prototype/:id.
  const destination = feature.kind === 'explore' ? feature.to ?? '/dashboard' : `/prototype/${feature.id}`
  // Testing-tab tiles point at a standalone hosted build (raw HTML) — opened in
  // a NEW TAB via a real anchor rather than an in-app react-router route.
  const external = feature.externalUrl

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
    padding: statusLabel ? '42px 24px 24px' : 24,
    overflow: 'hidden',
    textAlign: 'left',
    background: 'var(--color-surface-card)',
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-card)',
    color: 'inherit',
    textDecoration: 'none',
    cursor: comingSoon ? 'default' : 'pointer',
    opacity: comingSoon ? 0.62 : 1,
    transition: 'border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease',
  }

  const inner = (
    <>
      {statusLabel && (
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '6px 16px',
            background: statusColor ?? undefined,
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            lineHeight: 1.4,
            zIndex: 1,
          }}
        >
          {statusLabel}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          // Reserve room at the top-right for the kebab (sibling of the anchor)
          // so the badge never slides under it. Coming-soon tiles have no kebab.
          paddingRight: comingSoon ? 0 : 30,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-lg)',
            background: 'color-mix(in srgb, ' + accent + ' 14%, transparent)',
            color: accent,
          }}
        >
          <Icon size={24} />
        </span>
        <TileBadge feature={feature} isDone={isDone} inProgress={isInDesign} />
      </div>

      <div style={{ flex: 1 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-2xl)',
            lineHeight: 'var(--text-heading-2xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          {feature.title}
        </h2>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
            // Hard 5-line ceiling. The authored `tileBlurb` copy is budgeted to
            // fit (≤160 chars), so this never engages today — it's the guarantee
            // that a future over-long blurb degrades to an ellipsis instead of
            // stretching one tile to twice its neighbours' height.
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {tileBlurbOf(feature)}
        </p>
      </div>

      {!comingSoon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-action)',
          }}
        >
          {feature.category === 'exploration'
            ? 'Open the prototype'
            : external
              ? 'Open test flow'
              : feature.kind === 'explore'
                ? 'Open the platform'
                : 'View feature pages'}
          {external || feature.kind === 'explore' ? (
            <ArrowRight size={16} aria-hidden />
          ) : (
            <ChevronRight size={16} aria-hidden />
          )}
        </span>
      )}
    </>
  )

  // Kebab actions — a sibling of the card (never nested inside the anchor, which
  // would be invalid markup + fire navigation). Not shown on coming-soon tiles.
  const shareMenu = comingSoon ? null : (
    <div style={{ position: 'absolute', top: statusLabel ? 36 : 16, right: 14, zIndex: 3 }}>
      <FeatureActionsMenu
        feature={feature}
        isDone={isDone}
        isInDesign={isInDesign}
        rollupStatus={rollupStatus}
        onToggleDone={onToggleDone}
        onToggleInDesign={onToggleInDesign}
        onSetRollupStatus={onSetRollupStatus}
      />
    </div>
  )

  if (comingSoon) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <div style={cardStyle} aria-disabled>
          {inner}
        </div>
      </div>
    )
  }

  // Explore tiles jump into the live platform; guided tiles open their curated
  // page list at /prototype/:id. Each tile is password-gated: the first click
  // (per session) intercepts navigation and opens the password modal; once
  // unlocked it navigates normally (and stays unlocked for the session).
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {external ? (
        // Testing-tab tiles: a real anchor to the hosted build, opened in a new
        // tab (react-router's <Link> would swallow the raw .html into the SPA).
        <a
          href={external}
          target="_blank"
          rel="noopener noreferrer"
          style={cardStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent
            e.currentTarget.style.boxShadow = 'var(--shadow-popover)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {inner}
        </a>
      ) : (
        <Link
          to={destination}
          style={cardStyle}
          onClick={(e) => {
            // Only locked tiles are gated; everything else opens straight through.
            // A locked tile prompts once per session, then opens normally.
            if (feature.locked && !isPrototypeUnlocked(feature.id)) {
              e.preventDefault()
              setAskOpen(true)
              return
            }
            // A Demo explore tile drops straight into a live page that doesn't
            // self-seed the account (e.g. /catalog — unlike /dashboard-rebrand,
            // which seeds Elite on entry). Seed the tile's pinned brand/tier
            // here so the live preview opens in the right demo context. Scoped
            // to demo tiles so existing explore tiles are untouched.
            if (feature.kind === 'explore' && feature.category === 'demo' && feature.account) {
              setAccount(feature.account.brand, feature.account.membership)
            }
            // Explore tiles jump straight into the platform, so mark the
            // walkthrough here — the platform header then shows a "← Back" to the
            // Common Dashboard. (Guided tiles open their gateway, which sets its
            // own marker when a page is launched.)
            if (feature.kind === 'explore') setPrototypeWalkthrough(feature.id)
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = accent
            e.currentTarget.style.boxShadow = 'var(--shadow-popover)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
            e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {inner}
          {locked && <LockedOverlay />}
        </Link>
      )}
      {shareMenu}
      {askOpen && (
        <PrototypePasswordModal
          featureTitle={feature.title}
          onClose={() => setAskOpen(false)}
          onUnlock={() => {
            markPrototypeUnlocked(feature.id)
            setAskOpen(false)
            // Same as the direct click — mark explore walkthroughs so the
            // platform header offers a "← Back" to the Common Dashboard.
            if (feature.kind === 'explore') setPrototypeWalkthrough(feature.id)
            navigate(destination)
          }}
        />
      )}
    </div>
  )
}

/** Dark scrim over a locked tile — a visual lock cue beyond the "LOCKED" pill.
 *  `pointer-events: none` so the tile underneath stays clickable (opens the
 *  password modal). Corners match the card's radius. */
function LockedOverlay() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'var(--radius-xl)',
        background: 'color-mix(in srgb, var(--color-neutral-900) 50%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'rgb(255 255 255 / 0.16)',
          border: '1px solid rgb(255 255 255 / 0.34)',
          color: 'rgb(255 255 255 / 0.96)',
        }}
      >
        <Lock size={20} aria-hidden />
      </span>
    </div>
  )
}

function TileBadge({
  feature,
  isDone,
  inProgress,
}: {
  feature: PrototypeFeature
  isDone: boolean
  inProgress: boolean
}) {
  if (feature.status === 'coming-soon') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-neutral-100)',
          color: 'var(--color-text-tertiary)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        <Lock size={11} aria-hidden />
        Coming soon
      </span>
    )
  }
  // The feature-type badge — "Exploration" (a standalone prototype in its own
  // section), "Test flow" (external hosted build), "Full platform" (explore) or
  // "N pages" (guided). Suppressed when the tile opts out via `hideTypeBadge`
  // (status pills still render). The exploration check comes FIRST because
  // those tiles also carry an `externalUrl` and would otherwise read as a
  // hosted test flow.
  const count = feature.pages?.length ?? 0
  const typeBadge = feature.hideTypeBadge ? null : (
    feature.category === 'exploration' ? (
      <span style={{ ...BADGE_BASE, background: 'var(--color-secondary-100)', color: 'var(--color-secondary-800)' }}>
        Exploration
      </span>
    ) : feature.externalUrl ? (
      <span style={{ ...BADGE_BASE, background: 'var(--color-secondary-100)', color: 'var(--color-secondary-700)' }}>
        Test flow
      </span>
    ) : feature.kind === 'explore' ? (
      <span style={{ ...BADGE_BASE, background: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }}>
        Full platform
      </span>
    ) : (
      <span style={{ ...BADGE_BASE, background: 'var(--color-cta-100)', color: 'var(--color-cta-700)' }}>
        {count} {count === 1 ? 'page' : 'pages'}
      </span>
    )
  )

  // Extra status pills alongside the type badge: "Locked" (password-gated) and
  // "Done" (marked complete). A tile can carry either, both, or neither.
  const extras: React.ReactNode[] = []
  if (feature.locked) {
    extras.push(
      <span
        key="locked"
        style={{
          ...BADGE_BASE,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'var(--color-neutral-300)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Lock size={11} aria-hidden />
        Locked
      </span>,
    )
  }
  // "In Design" (amber) — shown when in design (config or runtime override) and
  // not yet Done (Done supersedes it). Mirrors the Done/Locked status pills.
  if (inProgress && !isDone) {
    extras.push(
      <span
        key="in-progress"
        style={{
          ...BADGE_BASE,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'var(--color-warning-100)',
          color: 'var(--color-warning-700)',
        }}
      >
        <Clock size={11} aria-hidden />
        In Design
      </span>,
    )
  }
  if (isDone) {
    extras.push(
      <span
        key="done"
        style={{
          ...BADGE_BASE,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'var(--color-success-100)',
          color: 'var(--color-success-700)',
        }}
      >
        <Check size={11} aria-hidden />
        Done
      </span>,
    )
  }

  if (extras.length === 0) return typeBadge

  // Locked/Done tiles KEEP their type badge — the tile is still that feature —
  // and gain the extra status pill(s).
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {typeBadge}
      {extras}
    </span>
  )
}

/** Shared pill chrome for the tile badges (type + locked + done). */
const BADGE_BASE: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}
