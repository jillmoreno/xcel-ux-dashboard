import type { ComponentType } from 'react'
import { CircleExclamation } from '@/icons'
import {
  sheetDeadlineDays,
  sheetStatusFor,
  type LearningPathSheetStatus,
  type LearningPathSummary,
} from '@/data/learningFixtures'

/**
 * Non-component helpers for the Learning Path homepage (`LearningPathsHome`).
 * Kept out of the component file for the react-refresh split.
 *
 * The homepage reuses the existing sheet derivation (`sheetStatusFor`,
 * `sheetDeadlineDays`) and only relabels the status for its learner-facing
 * taxonomy — so chip counts + sorts stay consistent with the My Learning Paths
 * slide-over.
 */

export type ViewMode = 'grid' | 'table'
export const VIEW_MODE_STORAGE_KEY = 'cgp.learningPaths.viewMode'

const VIEW_MODES: readonly ViewMode[] = ['grid', 'table']

/** Read the persisted view mode (default `grid`). SSR/no-storage safe — only
 *  returns a stored value when it's one of the valid modes (a legacy stored
 *  `list` — that view was removed — falls back to `grid`). */
export function readViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'grid'
  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
  return (VIEW_MODES as readonly string[]).includes(stored ?? '') ? (stored as ViewMode) : 'grid'
}

/**
 * Whether the landing page (vs. the single-path detail) should show for the
 * Learning Path section — the shared decision used by both the shell's
 * `LearningPathSection` (which renders it) and `SectionShell` (which suppresses
 * its own title when the landing page owns the title + search header).
 *
 * Driven by the `learning-path-version` flag:
 *   - `v1` (default) → the single-path detail (switching between paths happens
 *     via the top-right "Switch Learning Path" sheet). The landing page still
 *     shows for the 0-path empty state so the detail never renders pathless.
 *   - `v2` → the searchable landing page (grid / list / table) — UNLESS the
 *     learner has drilled into a specific path (`hasSelection`, i.e. `?id=`),
 *     which loads that path's single-path detail in place so the detail view
 *     stays reachable from the landing cards.
 */
export function isHomeActive(pathCount: number, version: string, hasSelection = false): boolean {
  if (pathCount === 0) return true
  if (version !== 'v2') return false
  return !hasSelection
}

/* ─── status mapping ─────────────────────────────────────────────────── */

export type HomeStatus =
  | 'on-track'
  | 'at-risk'
  | 'off-track'
  | 'expired'
  | 'not-started'
  | 'completed'

/**
 * Sheet status → homepage taxonomy (decision in the prompt).
 *
 * A path whose license deadline is in the past is its own **Expired** status
 * (darker gray badge, dedicated filter) — it is no longer folded into
 * "Off Track". "Off Track" now only surfaces for a behind-pace path whose
 * license is still valid (none of the current fixtures derive that, so the
 * chip auto-hides until one does).
 */
const SHEET_TO_HOME: Record<LearningPathSheetStatus, HomeStatus> = {
  'in-progress': 'on-track',
  'expiring-soon': 'at-risk',
  expired: 'expired',
  'not-started': 'not-started',
  completed: 'completed',
}

export function homeStatusFor(path: LearningPathSummary): HomeStatus {
  return SHEET_TO_HOME[sheetStatusFor(path)]
}

/**
 * HomeStatus → sheet status — the inverse used when the dashboard progress-state
 * persona (the demo "Progress" dropdown) drives the My Learning Paths sheet's
 * pinned path. `off-track` has no dedicated sheet status (none is derived today),
 * so it folds into `expiring-soon` (the closest urgent-but-valid bucket); the
 * demo picker only surfaces the other five, which map 1:1.
 */
const HOME_TO_SHEET: Record<HomeStatus, LearningPathSheetStatus> = {
  'on-track': 'in-progress',
  'at-risk': 'expiring-soon',
  'off-track': 'expiring-soon',
  expired: 'expired',
  'not-started': 'not-started',
  completed: 'completed',
}

export function homeToSheetStatus(status: HomeStatus): LearningPathSheetStatus {
  return HOME_TO_SHEET[status]
}

export type HomeStatusMeta = {
  label: string
  /** Badge fill (tinted functional token). */
  bg: string
  /** Badge left-border / accent. */
  border: string
  /** Badge label color. */
  text: string
  /** Render as an outline pill — transparent fill + a `border`-colored hairline
   *  outline instead of the `bg` fill (used by the muted neutral statuses). */
  outline?: boolean
  /** Optional leading glyph for the badge — used by Expired (a `CircleExclamation`
   *  alert mark) so it reads as a terminal/failure state without relying on color
   *  alone (the outline shape is shared with Not Started). */
  icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
}

/** Badges carry ALL the status color (functional tokens). Progress fills stay
 *  primary — see `LearningPathsHome`. */
export const HOME_STATUS_META: Record<HomeStatus, HomeStatusMeta> = {
  // Text colors use the contrast-aware `--color-status-*-text` tokens (which also
  // lift correctly in the rebrand dark theme) so this shared badge matches the
  // dashboard bands' pills (they read the same tokens via `statusTreatment`).
  'on-track': {
    label: 'On Track',
    bg: 'color-mix(in srgb, var(--color-success-500) 16%, transparent)',
    border: 'var(--color-success-500)',
    text: 'var(--color-status-success-text)',
  },
  'at-risk': {
    label: 'At Risk',
    bg: 'color-mix(in srgb, var(--color-warning-500) 22%, transparent)',
    border: 'var(--color-warning-500)',
    text: 'var(--color-status-warning-text)',
  },
  'off-track': {
    label: 'Off Track',
    bg: 'color-mix(in srgb, var(--color-error-500) 16%, transparent)',
    border: 'var(--color-error-500)',
    text: 'var(--color-status-error-text)',
  },
  // Expired = license deadline in the past, requirements unmet. An outlined
  // MAROON pill (error family) + a leading alert glyph — reads as the terminal
  // failure it is, while staying in the tinted-badge system. It shares the
  // outline SHAPE with Not Started but is separated by hue (maroon vs neutral
  // gray) + the icon, so the state is legible without color alone.
  expired: {
    label: 'Expired',
    bg: 'color-mix(in srgb, var(--color-error-500) 10%, transparent)',
    border: 'var(--color-error-600)',
    text: 'var(--color-status-error-text)',
    outline: true,
    icon: CircleExclamation,
  },
  'not-started': {
    label: 'Not Started',
    bg: 'var(--color-neutral-100)',
    border: 'var(--color-neutral-300)',
    text: 'var(--color-text-secondary)',
    outline: true,
  },
  completed: {
    label: 'Completed',
    bg: 'color-mix(in srgb, var(--color-primary-500) 14%, transparent)',
    border: 'var(--color-primary-500)',
    text: 'var(--color-primary-700)',
  },
}

/**
 * Soft status tint for the compliance status STRIP background (the pill +
 * message row). A very light wash of the status hue — light green for on-track /
 * completed, amber for at-risk, maroon for off-track / expired — so the strip
 * reads as quiet status context, not an alert. Not Started is a calm neutral
 * gray (`--color-neutral-75`, matching the KPI stat tiles) rather than an info
 * tint. Shared by the Learning Path detail sheet (`StatusStrip`) and the
 * dashboard Current Learning Path band (`ClpJumpBackInBand`) so the strip looks
 * identical in both places.
 */
export const STATUS_STRIP_BG: Record<HomeStatus, string> = {
  // Composited over an OPAQUE light surface (not `transparent`) so the pale tint
  // reads on any background — including the dashboard band's navy frame, where a
  // transparent wash would blend into the navy and disappear. On a white surface
  // (the detail sheet) this looks identical to a transparent wash.
  'on-track': 'color-mix(in srgb, var(--color-success-500) 8%, var(--color-surface-card))',
  completed: 'color-mix(in srgb, var(--color-success-500) 8%, var(--color-surface-card))',
  'at-risk': 'color-mix(in srgb, var(--color-warning-500) 12%, var(--color-surface-card))',
  'off-track': 'color-mix(in srgb, var(--color-error-500) 8%, var(--color-surface-card))',
  expired: 'color-mix(in srgb, var(--color-error-500) 8%, var(--color-surface-card))',
  'not-started': 'var(--color-neutral-75)',
}

/* ─── Time Remaining formatting ──────────────────────────────────────── */

export type TimeSegment = { value: number; unit: string }

/**
 * Format the time left until a license / renewal deadline. Given whole weeks
 * remaining:
 *
 *   • **≤ 0 weeks** → `expired: true` (callers render "Expired").
 *   • **< 30 days** (≤ ~4 weeks) → a **day countdown** — "28 days" / "1 day".
 *     Under a month, a day count reads as more urgent + precise than "4 wks".
 *   • **< 1 year** (< 52 weeks) → weeks only — "14 wks".
 *   • **≥ 1 year** → years + the remaining weeks — "1 yr, 30 wks" / "2 yrs,
 *     6 wks" (the weeks segment is dropped when it lands on 0).
 *
 * Returns display segments (value + unit) so each number renders large with a
 * smaller unit suffix. Single source of truth for the "Time Remaining" stat,
 * shared by the Learning Path detail sheet + the dashboard Current Learning
 * Path band so both show the same value (e.g. 3 weeks → "21 days", not "3 wks").
 */
export function timeRemaining(weeksLeft: number): { segments: TimeSegment[]; expired: boolean } {
  if (weeksLeft <= 0) return { segments: [], expired: true }
  const days = Math.round(weeksLeft * 7)
  if (days < 30) {
    return { segments: [{ value: days, unit: days === 1 ? 'day' : 'days' }], expired: false }
  }
  const years = Math.floor(weeksLeft / 52)
  const remWeeks = weeksLeft % 52
  if (years > 0) {
    const segments: TimeSegment[] = [{ value: years, unit: years === 1 ? 'yr' : 'yrs' }]
    if (remWeeks > 0) segments.push({ value: remWeeks, unit: 'wks' })
    return { segments, expired: false }
  }
  return { segments: [{ value: weeksLeft, unit: 'wks' }], expired: false }
}

/* ─── status taxonomy (label variant) ────────────────────────────────── */

/**
 * Which label set the homepage uses for a path's status, driven by the
 * `learning-paths-status-taxonomy` flag:
 *   - `compliance` (default) — license-compliance terms (On Track / At Risk /
 *     Off Track / …), the labels baked into `HOME_STATUS_META`.
 *   - `status` — plain progress terms (In Progress / Expiring Soon / …).
 * Only the *labels* differ; the underlying `HomeStatus` derivation, colors,
 * counts, and sort order are shared. (`off-track` folds into "In Progress" in
 * the status set — no fixture derives it today, so its chip stays hidden.)
 */
export type StatusTaxonomy = 'compliance' | 'status'

const STATUS_VARIANT_LABELS: Record<HomeStatus, string> = {
  'on-track': 'In Progress',
  'at-risk': 'Expiring Soon',
  'off-track': 'In Progress',
  expired: 'Expired',
  'not-started': 'Not Started',
  completed: 'Complete',
}

/** A status's label for the active taxonomy (badges + chips share this). */
export function statusLabel(status: HomeStatus, taxonomy: StatusTaxonomy): string {
  return taxonomy === 'status' ? STATUS_VARIANT_LABELS[status] : HOME_STATUS_META[status].label
}

/** A filter chip's label for the active taxonomy (`all` is fixed). */
export function chipLabelFor(chip: ChipKey, taxonomy: StatusTaxonomy): string {
  return chip === 'all' ? 'All' : statusLabel(chip, taxonomy)
}

/* ─── status message ─────────────────────────────────────────────────── */

/**
 * Supporting line under the status badge, per compliance state.
 *
 * Copy is intentionally **generic** — it never names the path, because the path
 * title already headlines the sheet/card. Repeating it read as redundant and
 * caused a singular/plural grammar wobble ("your Florida Nursing Requirements
 * is…"). One line per state works under either label taxonomy (the pace framing
 * holds whether the badge reads "On Track" or "In Progress"). Shared by the
 * Details panel's status band + the dev-handoff status matrix so the copy has a
 * single source of truth.
 */
/**
 * Optionally personalized: pass the learner's `firstName` to lead with it as a
 * direct address ("Sarah, you're on pace…"). Callers that omit it get
 * the generic copy unchanged. The Dashboard Discoverability HOME tile passes the
 * name (status strip + Details sheet); every other surface keeps it generic.
 */
export function statusMessageFor(status: HomeStatus, firstName?: string): string {
  const n = firstName?.trim()
  switch (status) {
    case 'on-track':
      return n
        ? `${n}, you're on pace to finish before your deadline. Keep the momentum going!`
        : "You're on pace to finish before your deadline. Keep the momentum going."
    case 'at-risk':
      return n
        ? `${n}, you're running low on time to finish. A focused push this week will get you back on pace.`
        : "You're running low on time to finish. A focused push this week will get you back on pace."
    case 'off-track':
      return n
        ? `${n}, you're behind schedule with limited time left. Prioritize your remaining required hours.`
        : "You're behind schedule with limited time left. Prioritize your remaining required hours."
    case 'not-started':
      return n
        ? `${n}, you haven't started yet. Pick a course below to begin—there's plenty of time.`
        : "You haven't started yet. Pick a course below to begin—there's plenty of time."
    case 'completed':
      return n
        ? `${n}, your requirements are complete—great job! Keep the momentum going by exploring topics that interest you.`
        : 'Requirements complete—great job! Keep the momentum going by exploring topics that interest you.'
    case 'expired':
      return n
        ? `${n}, your renewal deadline has passed with requirements unmet. Contact your licensing board about late renewal or reinstatement.`
        : 'Your renewal deadline has passed with requirements unmet. Contact your licensing board about late renewal or reinstatement.'
  }
}

/* ─── status pill treatment (shared: Current Learning Path bands) ─────── */

/**
 * The full status-pill treatment for a HomeStatus — the SINGLE source the
 * Current Learning Path bands (Marketing / Jump-Back-In / Learner Focused) read
 * so every state renders its correct color, and the same maroon-outline + icon
 * Expired / neutral-outline Not Started / brand Completed treatment the badge +
 * Details panel use. Two contexts:
 *   - `onDark: false` (default) — the pill sits on the white inner summary card
 *     (surface-card, which flips navy in the rebrand dark theme). Text uses the
 *     contrast-aware --color-status-*-text tokens so it clears AA on the tint in
 *     both themes.
 *   - `onDark: true` — the pill/dot sits directly on the navy band
 *     (LearnerFocusedBand). Colors lift to the -200/-300 stops.
 * `label` honors the active taxonomy; `message` is the shared generic copy.
 */
export type StatusTreatment = {
  label: string
  message: string
  /** Tinted fill (transparent-based) for a filled pill; 'transparent' when outline. */
  fill: string
  /** Base/border color (the status family's -500, or lifted -300 on dark). */
  border: string
  /** Label + dot text color. */
  text: string
  /** Outline pill (Not Started, Expired) — transparent fill + border. */
  outline: boolean
  /** Optional leading glyph (Expired). */
  icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
}

type StatusToneSet = Omit<StatusTreatment, 'label' | 'message'>

const STATUS_TONE_LIGHT: Record<HomeStatus, StatusToneSet> = {
  'on-track': {
    fill: 'color-mix(in srgb, var(--color-success-500) 16%, transparent)',
    border: 'var(--color-success-500)',
    text: 'var(--color-status-success-text)',
    outline: false,
  },
  'at-risk': {
    fill: 'color-mix(in srgb, var(--color-warning-500) 22%, transparent)',
    border: 'var(--color-warning-500)',
    text: 'var(--color-status-warning-text)',
    outline: false,
  },
  'off-track': {
    fill: 'color-mix(in srgb, var(--color-error-500) 16%, transparent)',
    border: 'var(--color-error-500)',
    text: 'var(--color-status-error-text)',
    outline: false,
  },
  expired: {
    fill: 'transparent',
    border: 'var(--color-error-600)',
    text: 'var(--color-status-error-text)',
    outline: true,
    icon: CircleExclamation,
  },
  'not-started': {
    fill: 'transparent',
    border: 'var(--color-neutral-300)',
    text: 'var(--color-text-secondary)',
    outline: true,
  },
  completed: {
    fill: 'color-mix(in srgb, var(--color-primary-500) 14%, transparent)',
    border: 'var(--color-primary-500)',
    text: 'var(--color-primary-700)',
    outline: false,
  },
}

const STATUS_TONE_DARK: Record<HomeStatus, StatusToneSet> = {
  'on-track': {
    fill: 'color-mix(in srgb, var(--color-success-300) 20%, transparent)',
    border: 'var(--color-success-300)',
    text: 'var(--color-success-300)',
    outline: false,
  },
  'at-risk': {
    fill: 'color-mix(in srgb, var(--color-warning-300) 20%, transparent)',
    border: 'var(--color-warning-300)',
    text: 'var(--color-warning-300)',
    outline: false,
  },
  'off-track': {
    fill: 'color-mix(in srgb, var(--color-error-300) 22%, transparent)',
    border: 'var(--color-error-300)',
    text: 'var(--color-error-300)',
    outline: false,
  },
  expired: {
    fill: 'transparent',
    border: 'var(--color-error-300)',
    text: 'var(--color-error-200)',
    outline: true,
    icon: CircleExclamation,
  },
  'not-started': {
    fill: 'transparent',
    border: 'rgb(255 255 255 / 0.4)',
    text: 'rgb(255 255 255 / 0.75)',
    outline: true,
  },
  completed: {
    fill: 'color-mix(in srgb, var(--color-primary-200) 24%, transparent)',
    border: 'var(--color-primary-200)',
    text: 'var(--color-primary-200)',
    outline: false,
  },
}

/** Resolve the shared status treatment for a state. Bands keep their own pill
 *  markup but read label/color/outline/icon/message from here, so all six
 *  states stay consistent with the badge + Details panel. */
export function statusTreatment(
  status: HomeStatus,
  taxonomy: StatusTaxonomy = 'compliance',
  opts?: { onDark?: boolean },
): StatusTreatment {
  const tone = (opts?.onDark ? STATUS_TONE_DARK : STATUS_TONE_LIGHT)[status]
  return { label: statusLabel(status, taxonomy), message: statusMessageFor(status), ...tone }
}

/* ─── chips ──────────────────────────────────────────────────────────── */

export type ChipKey = 'all' | HomeStatus
export const CHIP_ORDER: ChipKey[] = [
  'all',
  'on-track',
  'at-risk',
  'off-track',
  'not-started',
  'completed',
  // Expired sits last — it's the lapsed/inactive bucket, after the active ones.
  'expired',
]
export const CHIP_LABEL: Record<ChipKey, string> = {
  all: 'All',
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'off-track': 'Off Track',
  expired: 'Expired',
  'not-started': 'Not Started',
  completed: 'Completed',
}

/** Per-chip color tokens applied when the chip is SELECTED — mirrors the STC
 *  study-plan filter pills (`InlineStudyCalendar`'s `STATUS_CHIP_COLORS`): a
 *  light `-100` fill + `-500` border + dark `-800` text in the status's own
 *  color family, so "color = status" reads consistently with the card badges.
 *  Inactive chips are transparent with a subtle border. `all` uses the brand
 *  secondary accent (the STC "All Tasks" teal). */
export type ChipColors = { bg: string; fg: string; border: string }
export const CHIP_COLORS: Record<ChipKey, ChipColors> = {
  all: {
    bg: 'var(--color-secondary-100)',
    fg: 'var(--color-secondary-800)',
    border: 'var(--color-secondary-500)',
  },
  'on-track': {
    bg: 'var(--color-success-100)',
    fg: 'var(--color-success-800)',
    border: 'var(--color-success-500)',
  },
  'at-risk': {
    bg: 'var(--color-warning-100)',
    fg: 'var(--color-warning-800)',
    border: 'var(--color-warning-500)',
  },
  'off-track': {
    bg: 'var(--color-error-100)',
    fg: 'var(--color-error-800)',
    border: 'var(--color-error-500)',
  },
  expired: {
    bg: 'var(--color-neutral-300)',
    fg: 'var(--color-neutral-darkest)',
    border: 'var(--color-neutral-500)',
  },
  'not-started': {
    bg: 'var(--color-neutral-200)',
    fg: 'var(--color-neutral-darkest)',
    border: 'var(--color-neutral-400)',
  },
  completed: {
    bg: 'var(--color-primary-100)',
    fg: 'var(--color-primary-800)',
    border: 'var(--color-primary-500)',
  },
}

export function countsByChip(paths: LearningPathSummary[]): Record<ChipKey, number> {
  const c: Record<ChipKey, number> = {
    all: paths.length,
    'on-track': 0,
    'at-risk': 0,
    'off-track': 0,
    expired: 0,
    'not-started': 0,
    completed: 0,
  }
  for (const p of paths) c[homeStatusFor(p)] += 1
  return c
}

/* ─── sort (reuses the slide-over's options) ─────────────────────────── */

export type SortKey = 'recent' | 'deadline' | 'progress' | 'status' | 'name'
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently viewed' },
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'progress', label: 'Progress (most done)' },
  { value: 'status', label: 'Status' },
  { value: 'name', label: 'Name (A–Z)' },
]

// Expired → Off Track → At Risk → On Track → Not Started → Completed
// (needs-attention first; a lapsed license is the most urgent).
const STATUS_SORT_ORDER: Record<HomeStatus, number> = {
  expired: 0,
  'off-track': 1,
  'at-risk': 2,
  'on-track': 3,
  'not-started': 4,
  completed: 5,
}

/** Needs-attention-first rank for a path's status — the same order the sheet +
 *  the homepage "Status" sort use. Exported so the table's Status column sorts
 *  identically. */
export function homeStatusRank(path: LearningPathSummary): number {
  return STATUS_SORT_ORDER[homeStatusFor(path)]
}

export function filterAndSortPaths(
  paths: LearningPathSummary[],
  {
    query,
    chip,
    profession,
    state,
    sort,
  }: { query: string; chip: ChipKey; profession: string; state?: string; sort: SortKey },
): LearningPathSummary[] {
  const q = query.trim().toLowerCase()
  const filtered = paths.filter((p) => {
    const okStatus = chip === 'all' || homeStatusFor(p) === chip
    const okProfession = profession === 'all' || p.category === profession
    const okState = !state || state === 'all' || p.state === state
    const okQuery = !q || `${p.title} ${p.state ?? ''}`.toLowerCase().includes(q)
    return okStatus && okProfession && okState && okQuery
  })
  const list = [...filtered]
  switch (sort) {
    case 'deadline':
      list.sort((a, b) => sheetDeadlineDays(a) - sheetDeadlineDays(b))
      break
    case 'progress':
      list.sort((a, b) => b.progressPct - a.progressPct)
      break
    case 'status':
      list.sort(
        (a, b) =>
          STATUS_SORT_ORDER[homeStatusFor(a)] - STATUS_SORT_ORDER[homeStatusFor(b)] ||
          sheetDeadlineDays(a) - sheetDeadlineDays(b),
      )
      break
    case 'name':
      list.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'recent':
    default:
      list.sort((a, b) => new Date(b.lastViewedAt).getTime() - new Date(a.lastViewedAt).getTime())
  }
  return list
}

/* ─── profession filter ──────────────────────────────────────────────── */

/** Distinct professions (a path's `category`) among the learner's paths, with
 *  counts — so the Profession row only lists the ones they actually have a
 *  path for. Preserves first-seen order. */
export function professionsOf(
  paths: LearningPathSummary[],
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const p of paths) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return Array.from(counts, ([value, count]) => ({ value, label: value, count }))
}

/** Selected-chip colors for the Profession row — brand primary tint (distinct
 *  from the status color families). Inactive chips are transparent. */
export const PROFESSION_CHIP_COLORS: ChipColors = {
  bg: 'var(--color-primary-100)',
  fg: 'var(--color-primary-800)',
  border: 'var(--color-primary-500)',
}

/* ─── state filter ───────────────────────────────────────────────────── */

/** Distinct states (a path's `state`) among the learner's paths, with counts —
 *  so the State row only lists the ones they actually hold a path in. Preserves
 *  first-seen order; paths with no state are skipped (they just don't add a
 *  pill). Drives the pill-style State filter on the Learning Paths landing. */
export function statesOf(
  paths: LearningPathSummary[],
): { value: string; label: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const p of paths) {
    if (!p.state) continue
    counts.set(p.state, (counts.get(p.state) ?? 0) + 1)
  }
  return Array.from(counts, ([value, count]) => ({ value, label: value, count }))
}

/** How many State pills show before the row collapses behind a "Show all (N)"
 *  expander. Most learners hold 1–6 state licenses, so six sit inline; a
 *  broker/appraiser with more expands the row vertically. */
export const STATE_COLLAPSE_LIMIT = 6

/** Selected-chip colors for the State row — brand secondary/teal tint, so the
 *  State pills read as their own family (distinct from the primary Profession
 *  row + the status color families). Inactive chips are transparent. */
export const STATE_CHIP_COLORS: ChipColors = {
  bg: 'var(--color-secondary-100)',
  fg: 'var(--color-secondary-800)',
  border: 'var(--color-secondary-500)',
}

/* ─── card field helpers ─────────────────────────────────────────────── */

/** Whether a path carries a real two-category (Mandatory + Elective) split. */
export function hasCategoryBreakdown(path: LearningPathSummary): boolean {
  const m = path.mandatory
  const e = path.elective
  return !!m && !!e && m.required > 0 && e.required > 0
}

/** Completed / required hours — from the breakdown when present, else derived
 *  from the path's total hours × progress. */
export function hoursFor(path: LearningPathSummary): { completed: number; required: number } {
  if (path.mandatory && path.elective) {
    return {
      completed: path.mandatory.completed + path.elective.completed,
      required: path.mandatory.required + path.elective.required,
    }
  }
  return {
    completed: Math.round((path.progressPct / 100) * path.hours),
    required: path.hours,
  }
}

/** Meta segments for a card's subtitle line: category · CE · state · hours. */
export function metaSegments(path: LearningPathSummary): string[] {
  const isCE = path.category.toLowerCase().includes('continuing education')
  return [
    path.category,
    ...(isCE ? ['CE'] : []),
    ...(path.state ? [path.state] : []),
    `${path.hours} Hours`,
  ]
}

/**
 * The eyebrow over every Current Learning Path band — **"Current Learning
 * Progress"** as of 2026-09-09, renamed from "Current Learning Path".
 *
 * ONE constant because there are FIVE renderers of this label and they are
 * layout variants and states of the SAME band: the Marketing Focused top band,
 * the full-width Clp/Jump-Back-In band, the Learner Focused band, the completed
 * celebration, and the section lead above them in MembershipOverview. Renaming
 * four of five is the drift this replaces — a reviewer flipping a layout flag
 * would have watched the heading change with it.
 *
 * The word "Path" survives everywhere it names the PAGE or the object (the
 * `learning-path` rail section, "Switch Learning Path", the Learning Paths
 * landing). This is only the dashboard band's heading, where what is shown is
 * progress through a path rather than the path itself.
 */
export const CURRENT_LEARNING_EYEBROW = 'Current Learning Progress'
