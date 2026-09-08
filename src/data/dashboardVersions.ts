import type { Brand } from '@/context/AccountContext'

export type DashboardVersionId =
  | 'v1'
  | 'v2'
  | 'v3'
  | 'v4'
  | 'v5'
  | 'mvp'
  | 'discoverability-learner-focused'
  | 'discoverability-marketing-focused'
  | 'discoverability-badged'

export type DashboardVersion = {
  id: DashboardVersionId
  label: string
  createdAt: string
  modifiedAt: string
  description: string
}

export const DASHBOARD_VERSIONS: DashboardVersion[] = [
  {
    id: 'mvp',
    label: 'Dashboard MVP',
    createdAt: '2026-06-15',
    modifiedAt: '2026-06-15',
    description:
      'Pared-back V3 for the MVP scope: the right rail is hidden entirely, the "Saved this year" stat is dropped from the hero header, the remaining single-column content is centered on the page, and Featured Products moves below the Learning Path + Courses widgets.',
  },
  {
    id: 'v1',
    label: 'Dashboard V1',
    createdAt: '2026-05-06',
    modifiedAt: '2026-05-22',
    description:
      'Teal hero band merging welcome + 4 inline stats over a tabbed Learner Overview / Continue Listening / Jump Back In / Recommended / Member Benefits surface.',
  },
  {
    id: 'v2',
    label: 'Dashboard V2',
    createdAt: '2026-05-22',
    modifiedAt: '2026-05-22',
    description:
      'Same layout as V1, with the Achievements section removed from the Learner Overview tab so progress design can be explored without competing visual weight.',
  },
  {
    id: 'v3',
    label: 'Dashboard V3',
    createdAt: '2026-05-27',
    modifiedAt: '2026-05-27',
    description:
      'Fresh clone of V2 — starting point for the next round of dashboard explorations. Identical surface today; iterate freely without touching V2.',
  },
  {
    id: 'v4',
    label: 'Dashboard V4',
    createdAt: '2026-06-07',
    modifiedAt: '2026-06-07',
    description:
      'V3 layout with the welcome/stats hero relocated into the left column as a vertical widget stacked directly above Jump Back In.',
  },
  {
    id: 'v5',
    label: 'Dashboard V5',
    createdAt: '2026-06-08',
    modifiedAt: '2026-06-08',
    description:
      'Identical to V3 but the Featured Products card moves to the bottom — below Learning Path + Courses (+ Streak) in two-thirds width, and below all three widgets in full width.',
  },
]

// The Dashboard Discoverability feature (/dashboard-rebrand) is a standalone
// dashboard — NOT one of the classic `/dashboard` iterations above (kept OUT of
// DASHBOARD_VERSIONS so the Explore Dashboard feature still lists v1–v5/mvp). The
// picker offers two layout variants: **Marketing Focused is the default** (the
// layout a fresh /dashboard-rebrand visit lands on) and Learner Focused. (The
// earlier Side-by-side, Vibrant, and Stacked-cards explorations were fully
// retired — their layout paths + flags were removed in the flag audit.)
export const DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED: DashboardVersion = {
  id: 'discoverability-learner-focused',
  label: 'Learner Focused',
  createdAt: '2026-06-24',
  modifiedAt: '2026-06-24',
  description:
    'The top section is one joined card — Current Learning Path (a two-segment completion gauge + Mandatory/Elective bars, KPIs, and status on a deep-navy half) beside a white Jump Back In half (poster cover, progress, and a magenta Resume course CTA). Recommended for you + What’s New follow below.',
}

export const DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED: DashboardVersion = {
  id: 'discoverability-marketing-focused',
  label: 'Marketing Focused',
  createdAt: '2026-07-01',
  modifiedAt: '2026-07-01',
  description:
    'The default Discoverability dashboard. The joined top card, but the Jump Back In half is replaced by a full-bleed “What’s New” marketing carousel — rotating brand-gradient announcement slides with dot navigation. The left half keeps a compact Current Learning Path (two-segment progress + status), a Deadline / Time Remaining stat row, and a Jump Back In card.',
}

// "Badged Version" — the same discoverability dashboard, but every available/
// product card carries a membership tier badge (Passport / Passport Lite) plus
// an optional status badge (New / Member Exclusive) as a top-corner overlay.
// Affects the dashboard overview only (Marketing Focused layout + badge overlays).
// ARCHIVED 2026-08-17 — pulled from the picker list below (see ARCHIVED_ITEMS
// `discoverability-badged`). The const, the `discoverability-badged` type member,
// the `?version=` resolution branches (PlatformShell / MembershipOverview), and
// the `badged/` component files are all KEPT so restoring is a one-line re-add
// to DISCOVERABILITY_DASHBOARD_VERSIONS. The `?version=discoverability-badged`
// URL still resolves for anyone who deep-links it.
export const DISCOVERABILITY_DASHBOARD_VERSION_BADGED: DashboardVersion = {
  id: 'discoverability-badged',
  label: 'Badged Version',
  createdAt: '2026-07-07',
  modifiedAt: '2026-07-07',
  description:
    'The Marketing Focused dashboard, with a tier + status badge overlay on every product card. Each card carries a membership tier badge — Passport (gold + crown) or Passport Lite (navy + bolt) — top-left, plus an optional status badge (New or Member Exclusive) top-right, across the What’s New carousel, Recommended for you, and What’s Trending.',
}

// "Go to Legacy 2.0 Dashboard" is NOT a version here — because the classic
// dashboard loads outside this shell (a full navigation to `/dashboard`, the
// "Legacy Dashboard 2.0" tile link), it renders as a plain jump-off CTA below
// the version list rather than a selectable card. See the `secondaryCta` prop on
// DashboardVersionsPanel + the rebrand branch in Header.
//
// Marketing Focused leads the list — it's the default.
// (Badged Version was archived 2026-08-17 — dropped from this list; re-add
// DISCOVERABILITY_DASHBOARD_VERSION_BADGED here to restore it to the picker.)
export const DISCOVERABILITY_DASHBOARD_VERSIONS: DashboardVersion[] = [
  DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED,
]

/**
 * Which Discoverability layout a brand lands on with NO `?version=`.
 *
 * Marketing Focused is the house default. **XCEL defaults to Learner Focused**
 * (2026-09-04): it sells a licence, not a membership, so there is no upsell for
 * a marketing carousel to carry — its learners arrive with a booked exam date
 * and a Study Plan, and the Learner Focused band leads with exactly that
 * (progress gauge, category bars, deadline, Resume).
 *
 * ⚠ TWO PLACES read a default and they must agree, or the picker marks one
 * layout "Default" while the page loads the other: `PlatformShell`'s
 * `?version=` fallback, and the `defaultVersionId` the Header passes to
 * `DashboardVersionsPanel` for the inline "Default" pill. Both call this.
 *
 * Not persisted and not settable — the rebrand's picker suppresses "Set as
 * default" (`hideSetDefault`), so this IS the default, per brand.
 */
export function defaultDiscoverabilityVersionFor(brand: Brand): string {
  return brand === 'xcel'
    ? DISCOVERABILITY_DASHBOARD_VERSION_LEARNER_FOCUSED.id
    : DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED.id
}

// Built-in baseline default — the version a fresh visitor lands on when
// they haven't set their own default. V3 is the current working
// iteration, so new sessions start there.
export const DEFAULT_DASHBOARD_VERSION: DashboardVersionId = 'v3'

// User-chosen default, set from the Dashboard Versions panel's "Set as
// default" trigger. Persisted separately from the sticky last-viewed
// version (`cgp.dashboard.version`) so it survives even after previewing
// other versions.
const DEFAULT_VERSION_STORAGE_KEY = 'cgp.dashboard.defaultVersion'

function isValidVersionId(value: string | null): value is DashboardVersionId {
  return value != null && DASHBOARD_VERSIONS.some((v) => v.id === value)
}

/** The user-chosen default dashboard version, or the built-in
 *  {@link DEFAULT_DASHBOARD_VERSION} when none has been set. */
export function readDefaultDashboardVersion(): DashboardVersionId {
  if (typeof window === 'undefined') return DEFAULT_DASHBOARD_VERSION
  try {
    const raw = window.localStorage.getItem(DEFAULT_VERSION_STORAGE_KEY)
    return isValidVersionId(raw) ? raw : DEFAULT_DASHBOARD_VERSION
  } catch {
    return DEFAULT_DASHBOARD_VERSION
  }
}

/** Persist the chosen default dashboard version. */
export function writeDefaultDashboardVersion(id: DashboardVersionId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DEFAULT_VERSION_STORAGE_KEY, id)
  } catch {
    // Ignore quota / private-mode errors.
  }
}
