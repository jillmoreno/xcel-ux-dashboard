import { useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowRight, Grid, Layout } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { SearchInput } from '@/components/ui/SearchInput'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { CAT_ELECTIVE_COLOR, CAT_MANDATORY_COLOR } from '@/components/learning/progressGauge'
import { LearningPathStatusBadge } from './LearningPathStatusBadge'
import { LearningPathProgressTrack } from './LearningPathProgressTrack'
import { LearningPathsTable } from './LearningPathsTable'
import { LearningPathDetailPanel } from './LearningPathDetailPanel'
import type { LearningPathSummary } from '@/data/learningFixtures'
import {
  chipLabelFor,
  CHIP_ORDER,
  countsByChip,
  type ChipColors,
  filterAndSortPaths,
  hasCategoryBreakdown,
  homeStatusFor,
  hoursFor,
  metaSegments,
  PROFESSION_CHIP_COLORS,
  professionsOf,
  readViewMode,
  STATE_CHIP_COLORS,
  STATE_COLLAPSE_LIMIT,
  statesOf,
  VIEW_MODE_STORAGE_KEY,
  type ChipKey,
  type StatusTaxonomy,
  type ViewMode,
} from './learningPathsHomeUtil'

/**
 * Learning Path homepage — the multi-path landing for the Dashboard Rebrand
 * shell's "Learning Path" rail item (shown when the learner has 2+ paths). A
 * searchable / filterable set of learning-path cards with a grid/table toggle:
 * grid = rich tile cards (Option B), table = the sortable `LearningPathsTable`.
 *
 * The in-page (non-sheet) sibling of `LearningPathsPanel` — it reuses the same
 * `useLearningPathSummariesForBrand()` data + `sheetStatusFor` derivation via
 * `learningPathsHomeUtil`, and clicking any card opens that path's detail in
 * place (`onSelect(id)` → the shell sets `?id=`).
 */
type Props = {
  paths: LearningPathSummary[]
  onSelect: (id: string) => void
}

const EM_DASH = '—'

export function LearningPathsHome({ paths, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<ChipKey>('all')
  const [profession, setProfession] = useState<string>('all')
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode)
  // Right-side detail sheet (same panel as the dashboard's Current Learning
  // Path "Details"), opened from a tile card's Details link.
  const [detailPath, setDetailPath] = useState<LearningPathSummary | null>(null)

  const setView = (next: ViewMode) => {
    setViewMode(next)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, next)
    } catch {
      /* storage unavailable — keep the in-memory choice */
    }
  }

  const counts = useMemo(() => countsByChip(paths), [paths])
  const professions = useMemo(() => professionsOf(paths), [paths])
  const states = useMemo(() => statesOf(paths), [paths])
  // The Profession filter row only shows when the learner has multiple
  // professions (`profession-count` flag = multiple) — mirrors the Learning
  // Library. Off ⇒ the row is hidden (and no profession scoping applies).
  const professionFlag = useFeatureFlag('profession-count')
  const multipleProfessions = professionFlag.enabled && professionFlag.variant === 'multiple'
  // The State filter row only shows when the learner holds licenses in multiple
  // states (`state-count` flag = multiple) AND actually spans 2+ states. Off ⇒
  // the row is hidden (and no state scoping applies).
  const stateFlag = useFeatureFlag('state-count')
  const multipleStates = stateFlag.enabled && stateFlag.variant === 'multiple'
  // The Grid / Table view toggle only shows when the `learning-paths-table-view`
  // flag is on; off (default) → grid only, no toggle (even if a stale `table`
  // choice lingers in localStorage).
  const tableViewEnabled = useFeatureFlag('learning-paths-table-view').enabled
  const effectiveViewMode: ViewMode = tableViewEnabled ? viewMode : 'grid'
  // Status label set (compliance vs. status) — drives the filter tab labels;
  // the card badges read the same flag via LearningPathStatusBadge.
  const statusTaxonomy = (useFeatureFlag('learning-paths-status-taxonomy').variant ??
    'compliance') as StatusTaxonomy
  // When the Profession row is hidden (single profession), never scope by
  // profession even if a stale selection lingers in state.
  const activeProfession = multipleProfessions ? profession : 'all'
  // Same guard for State — no scoping when the row is hidden.
  const activeState = multipleStates ? stateFilter : 'all'
  const visible = useMemo(
    () =>
      filterAndSortPaths(paths, {
        query,
        chip,
        profession: activeProfession,
        state: activeState,
        sort: 'recent',
      }),
    [paths, query, chip, activeProfession, activeState],
  )

  const title = paths.length > 1 ? 'Learning Paths' : 'Learning Path'

  // Courses-style segmented pill tabs (counts dropped — the result total moved
  // to the top-right above the results). "All" + any status with matching paths.
  const statusTabs: PillTabItem<ChipKey>[] = CHIP_ORDER.filter(
    (key) => key === 'all' || counts[key] > 0,
  ).map((key) => ({ id: key, label: chipLabelFor(key, statusTaxonomy) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row — title (left) + search (right), aligned like the Courses
          section hero. The shell suppresses its own title when the homepage
          shows, so this is the section's single <h1>. */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <h1 style={pageTitleStyle}>{title}</h1>
        {paths.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SearchInput
              label="Search learning paths by name"
              placeholder="Search learning paths…"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              style={{ flex: '0 1 320px', maxWidth: 360 }}
            />
            {tableViewEnabled && <ViewToggle mode={viewMode} onChange={setView} />}
          </div>
        )}
      </div>

      {/* No enrollments at all — a simple empty state below the title. */}
      {paths.length === 0 ? (
        <EmptyBlock
          title="You're not enrolled in any learning paths yet."
          body="When you enroll in a learning path, it'll show up here."
        />
      ) : (
        <>
      {/* Top filters — Courses-style segmented pill tabs (no counts in the
          pills). The result total sits top-right, above the results. Status
          leads; the Profession bar only appears when the learner has multiple
          professions (`profession-count` flag) AND actually spans 2+. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <PillTabs label="Filter by status" items={statusTabs} active={chip} onChange={setChip} />
          <span style={resultsCountStyle}>
            {visible.length} {visible.length === 1 ? 'result' : 'results'}
          </span>
        </div>
        {/* Profession stays the secondary labeled pill/chip filter (distinct
            from the primary Status segmented tabs). Gated on the
            `profession-count` flag + 2+ path professions. */}
        {multipleProfessions && professions.length > 1 && (
          <FilterRow label="Profession">
            <StatusChip
              label="All"
              count={paths.length}
              colors={PROFESSION_CHIP_COLORS}
              selected={profession === 'all'}
              onClick={() => setProfession('all')}
            />
            {professions.map((p) => (
              <StatusChip
                key={p.value}
                label={p.label}
                count={p.count}
                colors={PROFESSION_CHIP_COLORS}
                selected={profession === p.value}
                onClick={() => setProfession(p.value)}
              />
            ))}
          </FilterRow>
        )}
        {/* State — a second labeled pill row (teal family). Gated on the
            `state-count` flag + 2+ states. Collapses past STATE_COLLAPSE_LIMIT
            with a "Show all (N)" / "Show less" expander so a learner licensed
            in many states doesn't get an overwhelming single row. */}
        {multipleStates && states.length > 1 && (
          <StateFilterRow
            states={states}
            total={paths.length}
            selected={stateFilter}
            onSelect={setStateFilter}
          />
        )}
      </div>

      {/* Live region announces the result count + active view. */}
      <p aria-live="polite" className="cre-visually-hidden">
        Showing {visible.length} {visible.length === 1 ? 'learning path' : 'learning paths'} in{' '}
        {effectiveViewMode} view.
      </p>

      {/* Card region — grid OR table. */}
      {visible.length === 0 ? (
        <EmptyBlock title="No learning paths in this status." />
      ) : effectiveViewMode === 'table' ? (
        <LearningPathsTable paths={visible} onSelect={onSelect} />
      ) : (
        <div
          style={{
            display: 'grid',
            // Exactly 3 tiles per row; cards flex to share the row width.
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          {visible.map((path) => (
            <LearningPathTileCard key={path.id} path={path} onOpen={onSelect} onDetails={setDetailPath} />
          ))}
        </div>
      )}
        </>
      )}
      {/* Right-side detail sheet — the same LearningPathDetailPanel the dashboard
          opens from its Current Learning Path "Details" link. */}
      {detailPath && (
        <LearningPathDetailPanel open onClose={() => setDetailPath(null)} path={detailPath} />
      )}
    </div>
  )
}

/* ─── view toggle ────────────────────────────────────────────────────── */

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div
      role="group"
      aria-label="View mode"
      style={{
        display: 'flex',
        // Don't let the segmented control shrink in the flex header row —
        // full-size cells keep the three options reading as one control.
        flexShrink: 0,
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <ToggleButton active={mode === 'grid'} label="Grid view" onClick={() => onChange('grid')}>
        <Grid size={16} aria-hidden />
      </ToggleButton>
      <ToggleButton divider active={mode === 'table'} label="Table view" onClick={() => onChange('table')}>
        {/* `Layout` (table-cells-rows) — on the same 512 FA grid as the Grid
            glyph so the two read as one set (the old `Table`/table-list glyph
            was on the 640 grid and rendered at a mismatched weight). */}
        <Layout size={16} aria-hidden />
      </ToggleButton>
    </div>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
  children,
  divider = false,
}: {
  active: boolean
  label: string
  onClick: () => void
  children: ReactNode
  /** Hairline separator on the left edge — visually joins the cells into one
   *  segmented control (so no cell reads as a standalone button). */
  divider?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        width: 40,
        height: 32,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderLeft: divider ? '1px solid var(--color-border-subtle)' : 'none',
        cursor: 'pointer',
        background: active ? 'var(--color-neutral-100)' : 'transparent',
        color: active ? 'var(--color-action)' : 'var(--color-text-tertiary)',
      }}
    >
      {children}
    </button>
  )
}

/* ─── State filter row (secondary — pill, with show-all expander) ─────── */

function StateFilterRow({
  states,
  total,
  selected,
  onSelect,
}: {
  states: { value: string; label: string; count: number }[]
  total: number
  selected: string
  onSelect: (value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  // Most learners hold ≤ STATE_COLLAPSE_LIMIT states — show those inline. With
  // more, collapse to the limit + a "Show all (N)" toggle that reveals the rest
  // (the row wraps vertically). A selected state hidden by the collapse is
  // force-shown so the active pill never disappears.
  const overLimit = states.length > STATE_COLLAPSE_LIMIT
  const collapsed = overLimit && !expanded
  let shown = collapsed ? states.slice(0, STATE_COLLAPSE_LIMIT) : states
  if (collapsed && selected !== 'all' && !shown.some((s) => s.value === selected)) {
    const active = states.find((s) => s.value === selected)
    if (active) shown = [...shown, active]
  }
  return (
    <FilterRow label="State">
      <StatusChip
        label="All"
        count={total}
        colors={STATE_CHIP_COLORS}
        selected={selected === 'all'}
        onClick={() => onSelect('all')}
      />
      {shown.map((s) => (
        <StatusChip
          key={s.value}
          label={s.label}
          count={s.count}
          colors={STATE_CHIP_COLORS}
          selected={selected === s.value}
          onClick={() => onSelect(s.value)}
        />
      ))}
      {overLimit && (
        <button type="button" onClick={() => setExpanded((v) => !v)} style={showMoreLinkStyle}>
          {expanded ? 'Show less' : `Show all (${states.length})`}
        </button>
      )}
    </FilterRow>
  )
}

/* ─── labeled filter row (secondary — Profession) ────────────────────── */

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={filterRowLabelStyle}>{label}</span>
      <div
        role="tablist"
        aria-label={`Filter by ${label.toLowerCase()}`}
        style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {children}
      </div>
    </div>
  )
}

function StatusChip({
  label,
  count,
  colors,
  selected,
  onClick,
}: {
  label: string
  count: number
  colors: ChipColors
  selected: boolean
  onClick: () => void
}) {
  // Selected → the chip's own light tint + colored border + dark colored text;
  // inactive → transparent + subtle border. The count keeps the selected
  // foreground so it reads on the tint.
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={`${label} (${count})`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        cursor: 'pointer',
        border: `1px solid ${selected ? colors.border : 'var(--color-border-subtle)'}`,
        background: selected ? colors.bg : 'transparent',
        color: selected ? colors.fg : 'var(--color-text-secondary)',
      }}
    >
      {label}
      <span style={{ fontWeight: 700 }}>{count}</span>
    </button>
  )
}

/** Renders a "Time Remaining" value in the dashboard Current-Learning-Path
 *  style — just the amount (number + unit), with the leading number bold in
 *  text-primary and the unit kept in the surrounding gray value color (e.g.
 *  **10** Weeks). The "Left to Renewal" / "Left to Complete" tail is dropped.
 *  Labels with no leading number ("—", "Renewal Cycle Through 2027") render
 *  as-is. */
function TimeRemainingValue({ label }: { label: string }) {
  const amount = label.replace(/\s+left to (renewal|complete)\.?$/i, '')
  const match = /^(\d+)\s+(.+)$/.exec(amount)
  if (!match) return <>{amount}</>
  return (
    <>
      <strong style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{match[1]}</strong>{' '}
      {match[2]}
    </>
  )
}

function SplitLegend({ path }: { path: LearningPathSummary }) {
  if (!hasCategoryBreakdown(path)) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      <LegendDot
        color={CAT_MANDATORY_COLOR}
        label={`Mandatory ${path.mandatory!.completed}/${path.mandatory!.required}`}
      />
      <LegendDot
        color={CAT_ELECTIVE_COLOR}
        label={`Elective ${path.elective!.completed}/${path.elective!.required}`}
      />
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span aria-hidden style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
    </span>
  )
}

/* ─── grid tile (Option B) ───────────────────────────────────────────── */

function LearningPathTileCard({
  path,
  onOpen,
  onDetails,
}: {
  path: LearningPathSummary
  onOpen: (id: string) => void
  /** Opens the right-side detail sheet for this path (the "Details" link) —
   *  separate from the card body click, which opens the path in place. */
  onDetails: (path: LearningPathSummary) => void
}) {
  const { completed, required } = hoursFor(path)
  const status = homeStatusFor(path)
  // Expired paths already lapsed — past-tense the license label.
  const licenseLabel = status === 'expired' ? 'License Expired On' : 'License Expires'
  // Second tile sits beside License Expires. Completed → "Completed On" (when
  // they finished); Expired → nothing (no time remaining); everything else →
  // Time Remaining.
  const secondTile =
    status === 'completed'
      ? { label: 'Completed On', value: path.completedOn ?? EM_DASH }
      : status === 'expired'
        ? null
        : { label: 'Time Remaining', value: path.timeLeftLabel ?? EM_DASH }
  // License Expires (tile 1) + the status-appropriate second tile. There's no
  // "Time Spent" fallback — a path without a license date just shows "—" there.
  const tiles = [
    { label: licenseLabel, value: path.licenseExpiresOn ?? EM_DASH },
    ...(secondTile ? [secondTile] : []),
  ]
  return (
    <CardShell path={path} onOpen={onOpen} padding="18px">
      {/* Fixed-height header (2-line title + 2-line meta) so the % + progress bar
          below always start at the same Y across cards, regardless of wrapping. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 84, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span style={{ ...tileTitleStyle, ...clamp2Style, flex: 1, minWidth: 0 }}>{path.title}</span>
          <LearningPathStatusBadge path={path} />
        </div>
        <MetaLine path={path} stacked />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={bigPctStyle}>{path.progressPct}%</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {completed} / {required} credit hours
        </span>
      </div>
      <LearningPathProgressTrack path={path} />
      <SplitLegend path={path} />

      {/* Always a 2-col grid so the License Expires tile keeps its half-width
          size even when Time Remaining is hidden (expired) — the right column
          just stays empty rather than stretching the remaining tile. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {tiles.map((t) => (
          <div key={t.label} style={statTileStyle}>
            <span style={cellLabelStyle}>{t.label}</span>
            <span style={cellValueStyle}>
              {t.label === 'Time Remaining' ? <TimeRemainingValue label={String(t.value)} /> : t.value}
            </span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          // Don't also fire the card body's open — Details opens the right-side
          // detail sheet (same as the dashboard's Current Learning Path card).
          e.stopPropagation()
          onDetails(path)
        }}
        style={detailsLinkStyle}
      >
        Details <ArrowRight size={13} aria-hidden />
      </button>
    </CardShell>
  )
}

/* ─── shared card shell (keyboard-openable) ──────────────────────────── */

function CardShell({
  path,
  onOpen,
  padding,
  children,
}: {
  path: LearningPathSummary
  onOpen: (id: string) => void
  padding: string
  children: ReactNode
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(path.id)
    }
  }
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${path.title}`}
      onClick={() => onOpen(path.id)}
      onKeyDown={onKey}
      className="cre-lp-home-card"
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

function MetaLine({ path, stacked = false }: { path: LearningPathSummary; stacked?: boolean }) {
  const segments = metaSegments(path)
  // Stacked (grid tile): the category always owns the first line; the remaining
  // detail tokens (CE · state · hours) wrap together onto the second line — so
  // the header keeps a predictable two-line height across cards.
  if (stacked) {
    const [category, ...rest] = segments
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, ...metaTextStyle }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {category}
        </span>
        {rest.length > 0 && (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {rest.map((s, i) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && (
                  <span aria-hidden style={{ color: 'var(--color-text-tertiary)' }}>
                    ·
                  </span>
                )}
                {s}
              </span>
            ))}
          </span>
        )}
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, ...metaTextStyle }}>
      {segments.map((s, i) => (
        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span aria-hidden style={{ color: 'var(--color-text-tertiary)' }}>·</span>}
          {s}
        </span>
      ))}
    </div>
  )
}

function EmptyBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '56px 24px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-heading)',
          fontWeight: 600,
          fontSize: 18,
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </p>
      {body && (
        <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {body}
        </p>
      )}
    </div>
  )
}

/* ─── styles ─────────────────────────────────────────────────────────── */

// Matches the shell's plain section <h1> so the homepage title reads identically.
const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-heading-3xl)',
  lineHeight: 'var(--text-heading-3xl--line-height)',
  color: 'var(--color-text-primary)',
}

// Left-column label for the secondary Profession filter row — fixed width,
// padded to sit level with the chip text.
const filterRowLabelStyle: CSSProperties = {
  flexShrink: 0,
  width: 76,
  paddingTop: 7,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}

// Result total shown top-right, above the results (replaces the Status per-pill counts).
const resultsCountStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

const tileTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

// Clamp the tile title to 2 lines so the fixed-height header holds.
const clamp2Style: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const metaTextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}


const bigPctStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 28,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}

const cellLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

const cellValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const statTileStyle: CSSProperties = {
  // Light gray at 50% opacity so it reads as a subtle inset on the card.
  background: 'color-mix(in srgb, var(--color-neutral-100) 50%, transparent)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

// "Show all (N)" / "Show less" toggle in the State row — a quiet text link
// sitting inline after the pills (aligned to the pill height via padding).
const showMoreLinkStyle: CSSProperties = {
  alignSelf: 'center',
  background: 'transparent',
  border: 'none',
  padding: '6px 4px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  whiteSpace: 'nowrap',
}

const detailsLinkStyle: CSSProperties = {
  marginTop: 'auto',
  alignSelf: 'flex-end',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  // Button reset — it's a real button (opens the detail sheet) styled as a link.
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
}
