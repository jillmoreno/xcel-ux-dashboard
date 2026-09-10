/**
 * Non-component helpers for the stakeholder Demo Controls bar
 * (`DemoControlsBar.tsx`). Kept in a plain `.ts` module so the component file
 * exports only the component (react-refresh stays happy) and so the guard +
 * preset table + URL codec can be unit-tested in isolation.
 *
 * SCOPE: this drives a prototype/demo affordance only — see
 * `isDemoControlsEnabled` for the single, centralized on/off gate.
 */
import { supportsMembership, type Brand, type MembershipTier } from '@/context/AccountContext'

/**
 * The one place that decides whether the Demo Controls bar renders.
 *
 * Off (any non-`/dashboard-rebrand` route, or — once locked down — a production
 * build): returns false → `DemoControlsBar` returns null and no demo controls
 * render anywhere.
 *
 * Today it's always on within the `/dashboard-rebrand` prototype (stakeholders
 * demo from the deployed prototype build, so no `?demo=1` is required). To lock
 * it out of a real production build later, this is the single line to change —
 * e.g. `return import.meta.env.DEV && pathname === '/dashboard-rebrand'`.
 */
export function isDemoControlsEnabled(pathname: string): boolean {
  return pathname === '/dashboard-rebrand'
}

/**
 * One-click preset persona. Professions + memberships are expressed as
 * profession SLUGS (see `professionSlug`) so the table stays brand-fixture
 * agnostic — the component resolves membership slugs to the brand's real
 * membership record ids at apply-time. `tier` maps straight to
 * `useAccount().setTier`.
 *
 * TODO(demo): adjust these to the scenarios demoed most; they mirror the
 * concept mock (`explorations/stakeholder-demo-controls/stakeholder-demo-panel.html`).
 */
export type DemoPreset = {
  id: string
  label: string
  tier: MembershipTier
  /** Profession slugs to select. */
  profs: string[]
  /** Profession slugs whose membership record should be selected. */
  mems: string[]
}

export const DEMO_PRESETS: DemoPreset[] = [
  { id: 'new-nonmember', label: 'New non-member', tier: 'non-member', profs: ['nursing'], mems: [] },
  {
    id: 'lite-nursing',
    label: 'Passport Lite · Nursing',
    tier: 'low',
    profs: ['nursing'],
    mems: ['nursing'],
  },
  {
    id: 'passport-nursing',
    label: 'Full Passport · Nursing',
    tier: 'high',
    profs: ['nursing'],
    mems: ['nursing'],
  },
  // Note: the former "Passport · Multi-profession" quick view was removed — the
  // "Multiple learning paths" persona now owns the multi-profession scenario.
]

/* ─── User personas ──────────────────────────────────────────────────────────
 * A one-click "who is this learner" selector that sits ALONGSIDE the Quick
 * views / Progress / Education controls (it doesn't replace them). A persona
 * sets the learning/dashboard SHAPE (professions/memberships + a set of
 * feature-flag overrides — multi-path filters, the What's New carousel, the Jump
 * Back In mode) but deliberately does NOT touch the membership TIER — that stays
 * whatever the Quick views / tier control set (so the reviewer picks membership
 * first, then layers a scenario on top). Elite-oriented profession slugs (the
 * rebrand seeds Elite); on other brands the profession multiplicity degrades to
 * single (TODO(data): per-brand profession fixtures) while path/state/JBI
 * behavior still applies.
 */
export type PersonaFlagOp = {
  key: string
  enabled?: boolean
  variant?: string
  secondaryVariant?: string
}

export type DemoPersona = {
  id: string
  label: string
  /** One-line description shown under the label in the dropdown. */
  description: string
  /**
   * How many of the ACTIVE BRAND's professions (and their membership records)
   * this persona selects — `primary` = just the first, `all` = every one.
   *
   * It replaced two hardcoded slug arrays (`profs` / `mems`, both literally
   * `['nursing', …]` on all eight personas). Those worked only on Elite: on any
   * other brand they matched no option, so the persona wrote another brand's
   * profession slugs into the share URL and selected nothing. The scope is
   * resolved against the active brand at apply time instead.
   */
  profScope: 'primary' | 'all'
  /** Feature-flag overrides applied on top of the managed-flag defaults. */
  flags: PersonaFlagOp[]
  /** When set, the persona row is an EXPANDER: instead of applying on click it
   *  reveals a nested sub-list of these count options (the "how many paths?"
   *  choice). Each picks a `learning-paths-count` variant, applied on top of the
   *  persona's own flags. Only the "Multiple learning paths" persona uses this. */
  pathCountOptions?: { label: string; countVariant: string }[]
  /** Like `pathCountOptions`, but the count picks a `membership-count` variant
   *  (`two` ⇒ 2, `three` ⇒ 3+) instead of a path count. Only the "Multiple
   *  memberships" persona uses this. A persona has at most one of the two. */
  memCountOptions?: { label: string; countVariant: string }[]
  /** Optional dashboard version to force via the `?version=` URL param (e.g.
   *  `discoverability-marketing-focused`). Set when the persona's look depends
   *  on a specific dashboard version rather than the default. Omitted → the
   *  current version is left untouched. */
  version?: string
  /**
   * The persona is only offered on brands that SELL a membership. The
   * "Multiple memberships" row is meaningless on XCEL, which has none — it
   * would apply a `membership-count` nothing reads and leave the dashboard
   * unchanged, which reads as a broken control rather than an absent feature.
   * Filtered out of the dropdown by `personasForBrand`.
   */
  requiresMembership?: boolean
  /** When true, this view has no meaningful "What's New on" rendering (its top
   *  band is a full takeover — the build prompt or the JBI-only edge case — that
   *  leaves no room for the What's New carousel). The Persona dropdown DISABLES
   *  the row while the What's New toggle is On. */
  disabledWhenWhatsNewOn?: boolean
}

/**
 * Baseline values for the flags any persona might touch — applied first so each
 * persona lands on a deterministic state regardless of what a reviewer changed
 * before (a persona then overrides only the flags it cares about). Mirrors the
 * committed rebrand demo defaults.
 */
const MANAGED_FLAG_DEFAULTS: PersonaFlagOp[] = [
  // Default the full-width Current Learning Path band ON (when applicable). The
  // combined variant-d (navy CLP + Jump Back In) is the baseline; the JBI-only /
  // empty-state personas override the variant. (Persona 3's empty-path band still
  // wins the top slot regardless.)
  { key: 'dashboard-clp-fullwidth', enabled: true, variant: 'variant-d', secondaryVariant: 'always' },
  // What's New widget OFF by default (matches the committed default / the
  // "What's New off" default view); the "What's New on" persona turns it on.
  { key: 'dashboard-whats-new-layout', enabled: false },
  { key: 'dashboard-progress-state', variant: 'progress-on-track' },
  { key: 'profession-count', enabled: true, variant: 'single' },
  { key: 'state-count', enabled: true, variant: 'single' },
  // Single path is the baseline — only the "Multiple learning paths" persona (#9)
  // raises this (via its nested count sub-menu), so every other persona lands on
  // one path.
  { key: 'learning-paths-count', enabled: true, variant: 'one' },
  // Single membership is the baseline — only the "Multiple memberships" persona
  // raises this (via its nested count sub-menu), so every other persona resets to
  // one membership.
  { key: 'membership-count', enabled: false },
]

/**
 * What's New On/Off — the top-of-dropdown toggle applied ON TOP of whichever
 * persona is selected (the two former `whats-new-off` / `whats-new-on` persona
 * rows are now this single toggle).
 *
 * The toggle was REPURPOSED once the Marketing Focused band (CLP + What's New
 * carousel) was archived (see src/data/archivedItems.ts). It no longer swaps the
 * top band — the combined CLP + Jump Back In band (`dashboard-clp-fullwidth`,
 * the managed default) is now the ONLY top band. Instead the toggle just shows/
 * hides the standalone Featured hero (`dashboard-featured`):
 *
 * OFF = Featured hero shown (the managed default), so "off" applies no extra
 * override — the persona's own flags stand.
 *
 * ON = Featured hero hidden. We merge a single `dashboard-featured` off op so a
 * persona picked while the toggle is On keeps the hero hidden.
 */
const WHATS_NEW_ON: PersonaFlagOp[] = [{ key: 'dashboard-featured', enabled: false }]

/** Merge a persona's flag overrides on top of the managed defaults (persona
 *  wins per key), then — when the What's New toggle is On — the `WHATS_NEW_ON`
 *  set last (so the carousel layout wins over the persona's combined-band
 *  baseline). Off applies no extra set, preserving today's behavior exactly. */
export function resolvePersonaFlags(persona: DemoPersona, whatsNewOn = false): PersonaFlagOp[] {
  const byKey = new Map<string, PersonaFlagOp>()
  const merge = (op: PersonaFlagOp) => {
    const existing = byKey.get(op.key)
    byKey.set(op.key, existing ? { ...existing, ...op } : { ...op })
  }
  for (const op of MANAGED_FLAG_DEFAULTS) byKey.set(op.key, { ...op })
  for (const op of persona.flags) merge(op)
  if (whatsNewOn) for (const op of WHATS_NEW_ON) merge(op)
  return [...byKey.values()]
}

// Ordered for the numbered dropdown (the component renders each persona's
// 1-based array index as a leading number badge). What's New On/Off is no longer
// a persona row — it's the toggle at the top of the dropdown, applied on top of
// whichever view below is selected. Happy-path first:
//   1–3  progress / compliance journey (not started → expired → completed)
//   4–5  empty / no learning path (empty path → edge case)
//   6    scale (multiple learning paths)
//   7    multiple categories (QE)
//   8    scale (multiple memberships)
export const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'up-next',
    label: 'Up Next — nothing started',
    description: 'Path not started (0%) — the Jump Back In half reads “Up Next / Launch course”.',
    profScope: 'primary',
    // No clp override → keeps the default combined variant-d band: the CLP side
    // shows the path not-started (0%) and the Jump Back In half is in Up Next
    // mode (driven by the not-started progress state).
    flags: [{ key: 'dashboard-progress-state', variant: 'not-started' }],
  },
  {
    id: 'expired',
    label: 'License expired',
    description: 'Renewal deadline passed with requirements unmet — the Current Learning Path shows the red “Expired” status pill.',
    profScope: 'primary',
    // No clp override → default combined variant-d band; the expired progress
    // state drives the status band + pill and a part-done (resume) Jump Back In.
    flags: [{ key: 'dashboard-progress-state', variant: 'progress-expired' }],
  },
  {
    id: 'completed-empty',
    label: 'Completed — nothing next',
    description: 'Finished the path (100%) — combined band: CLP completed + “You’re all caught up” Jump Back In → Browse Catalog.',
    profScope: 'primary',
    // No clp override → default combined variant-d band: CLP at 100% completed +
    // the discovery Jump Back In half.
    flags: [{ key: 'dashboard-progress-state', variant: 'completed-empty' }],
  },
  {
    id: 'new-empty',
    label: 'Empty path — add courses',
    description: 'Learner has a learning path but it’s empty (0 courses) — combined band: CLP at 0% + the “Add your first course” Jump Back In → Browse Catalog.',
    profScope: 'primary',
    // No clp override → default combined variant-d band: CLP at 0% (not-started)
    // + the discovery Jump Back In half.
    flags: [{ key: 'dashboard-progress-state', variant: 'new-empty' }],
  },
  {
    id: 'heavy-plan',
    label: 'Busy study plan',
    description:
      'The dense pre-licensing plan — 37 tasks across five weeks — for showing the week strip, the Study Plan and Today\u2019s Tasks with real volume rather than a renewal cycle\u2019s one-a-week pacing.',
    profScope: 'primary',
    // A PERSONA rather than a new dropdown, and rather than a field on the
    // progress personas. Plan density is a property of the PATH, and Education
    // already selects the path — so this is a named combination of controls
    // that exist, not a fifth independent axis on a bar that already has four.
    //
    // `exam-prep` is what points at `xcel-fl-lh-prelicensing`, whose calendar
    // is the 37-task one; the CE path the demo opens on is a renewal cycle
    // paced two days a week over six months, which is true to that product and
    // is exactly why it looks sparse.
    flags: [
      { key: 'dashboard-education-type', variant: 'exam-prep' },
      { key: 'dashboard-progress-state', variant: 'progress-on-track' },
    ],
  },
  {
    id: 'no-path',
    label: 'No learning paths (brand)',
    description: 'Edge case — this brand doesn’t offer learning paths at all; the dashboard shows the full-width Jump Back In (resume) only, no CLP.',
    profScope: 'primary',
    // JBI-only IS the absence of What's New — disabled while the toggle is On.
    disabledWhenWhatsNewOn: true,
    flags: [{ key: 'dashboard-clp-fullwidth', enabled: true, variant: 'jump-back-in' }],
  },
  {
    id: 'multi-path',
    label: 'Multiple learning paths',
    description: 'Several paths across professions + states. Pick how many below.',
    profScope: 'all',
    // The row is an expander (see pathCountOptions) so the reviewer picks the
    // count, which sets `learning-paths-count`. profession-count + state-count are
    // forced multiple here (rather than relying on `apply`'s derivation, which the
    // managed-flag baseline would otherwise reset to single) so the multi-license
    // filters ride along with the multi-path scenario.
    flags: [
      { key: 'profession-count', enabled: true, variant: 'multiple' },
      { key: 'state-count', enabled: true, variant: 'multiple' },
    ],
    pathCountOptions: [
      { label: '2–3 paths', countVariant: 'realistic' },
      { label: '10–12 paths', countVariant: 'many' },
      { label: '40+ paths', countVariant: 'lots' },
    ],
  },
  {
    id: 'multi-category',
    label: 'Multiple categories (QE)',
    description: 'Qualifying-ed path with 3–5 requirement categories — overall % on the dashboard, full category list in the detail panel.',
    profScope: 'primary',
    // Tie to QE: the active brand's QE profile carries the multi-category
    // taxonomy, so switching to QE renders the N-category gauge + detail list.
    flags: [{ key: 'dashboard-education-type', variant: 'qe' }],
  },
  {
    id: 'multi-membership',
    label: 'Multiple memberships',
    requiresMembership: true,
    description: 'Holds several memberships at once. Pick how many below.',
    profScope: 'all',
    // Expander (see memCountOptions): the chosen count sets `membership-count`,
    // which drives the Membership Hub hero's stacked-cards deck ("You have N
    // Active Memberships"). The page stays on the Membership Hub version with its
    // Split-cards hero — only the hero updates to the stacked-deck UI; the rest of
    // the page is unchanged (this replaced the old swap to the retired `multi`
    // page version). Several memberships ⇒ several professions + states, so those
    // counts are forced multiple too (they don't alter the membership page — they
    // surface filter rows on the Library / Learning Paths / Recommended pages).
    flags: [
      { key: 'membership-page-version', variant: 'hub' },
      { key: 'membership-hub-hero', variant: 'split' },
      { key: 'membership-count', enabled: true },
      { key: 'profession-count', enabled: true, variant: 'multiple' },
      { key: 'state-count', enabled: true, variant: 'multiple' },
    ],
    memCountOptions: [
      { label: '2 memberships', countVariant: 'two' },
      // Seven, not five: the Elite fixtures carry one membership per renewal
      // state, so this is the option that shows every state at once.
      { label: '6 memberships', countVariant: 'seven' },
    ],
  },
]

/** Stable, url-safe slug for a profession label ("Occupational Therapy" →
 *  "occupational-therapy"). Used for the `?prof=` param + preset matching. */
export function professionSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Accepts the canonical tier keys plus the concept-mock aliases (lite → low,
 *  full → high) so older shared links still resolve. Returns null for junk. */
const TIER_ALIAS: Record<string, MembershipTier> = {
  'non-member': 'non-member',
  low: 'low',
  mid: 'mid',
  high: 'high',
  lite: 'low',
  full: 'high',
}

export function parseTierParam(raw: string | null): MembershipTier | null {
  if (!raw) return null
  return TIER_ALIAS[raw] ?? null
}

/** Valid `?prog=` values — the 5 compliance states the Progress dropdown drives.
 *  Kept in sync with `DASHBOARD_PROGRESS_PICKER` (hardcoded here so this codec
 *  module stays free of the fixtures import graph + unit-testable in isolation). */
const PROGRESS_VALUES = [
  'not-started',
  'progress-on-track',
  'progress-at-risk',
  'progress-expired',
  'complete-100',
] as const
/** Default progress + education — omitted from the URL to keep shared links clean. */
export const DEFAULT_PROGRESS = 'progress-on-track'
export const DEFAULT_EDUCATION = 'ce'

export function parseProgParam(raw: string | null): string | null {
  return raw && (PROGRESS_VALUES as readonly string[]).includes(raw) ? raw : null
}

export function parseEduParam(raw: string | null): 'qe' | 'ce' | null {
  return raw === 'qe' || raw === 'ce' ? raw : null
}

/** `?wn=on|off` — the What's New toggle. Returns `true`/`false` when present,
 *  `null` when absent (so the bar can derive the initial state from live flags). */
export function parseWnParam(raw: string | null): boolean | null {
  if (raw === 'on') return true
  if (raw === 'off') return false
  return null
}

export type DemoParams = {
  tier: MembershipTier | null
  profs: string[]
  mems: string[]
  /** Progress / compliance state (`?prog=`) — the `dashboard-progress-state`
   *  variant. `null` when absent. */
  prog: string | null
  /** Education type (`?edu=`) — `'qe' | 'ce'` (`dashboard-education-type`).
   *  `null` when absent. */
  edu: 'qe' | 'ce' | null
  /** What's New toggle (`?wn=`) — `true`/`false` when present, `null` when
   *  absent (derive from live flags). */
  wn: boolean | null
  /** True when the URL carried any demo param (→ restore + auto-expand the fine
   *  controls). */
  hasAny: boolean
}

/** Decode `?tier=&prof=&mem=&prog=&edu=&wn=` from a location search string. */
export function readDemoParams(search: string): DemoParams {
  const p = new URLSearchParams(search)
  const tier = parseTierParam(p.get('tier'))
  const profs = (p.get('prof') ?? '').split(',').filter(Boolean)
  const mems = (p.get('mem') ?? '').split(',').filter(Boolean)
  const prog = parseProgParam(p.get('prog'))
  const edu = parseEduParam(p.get('edu'))
  const wn = parseWnParam(p.get('wn'))
  return {
    tier,
    profs,
    mems,
    prog,
    edu,
    wn,
    hasAny: !!(p.get('tier') || p.get('prof') || p.get('mem') || p.get('prog') || p.get('edu') || p.get('wn')),
  }
}

/**
 * Merge the demo state into an existing search string — PRESERVING every other
 * param (`version`, `section`, `demo`, `tools`, …) so the bar never clobbers the
 * shell's own URL state. Returns a leading-`?` search (or '' when empty).
 *
 * `prog` / `edu` are optional; each is written only when it differs from its
 * default (so a plain On-Track / CE view keeps a clean URL), and cleared otherwise.
 * `whatsNewOn` writes `?wn=on` only when true (Off is the default → omitted). It
 * no longer touches `?version=` — the toggle drives the Featured hero now, not
 * the (archived) Marketing Focused carousel band, so any version is preserved.
 */
export function mergeDemoSearch(
  search: string,
  tier: MembershipTier,
  profs: string[],
  mems: string[],
  prog?: string,
  edu?: string,
  whatsNewOn?: boolean,
): string {
  const p = new URLSearchParams(search)
  p.set('tier', tier)
  if (profs.length) p.set('prof', profs.join(','))
  else p.delete('prof')
  if (mems.length) p.set('mem', mems.join(','))
  else p.delete('mem')
  if (prog && prog !== DEFAULT_PROGRESS) p.set('prog', prog)
  else p.delete('prog')
  if (edu && edu !== DEFAULT_EDUCATION) p.set('edu', edu)
  else p.delete('edu')
  if (whatsNewOn) p.set('wn', 'on')
  else p.delete('wn')
  const s = p.toString()
  return s ? `?${s}` : ''
}

/** Toggle a value in a string array (add if absent, remove if present). */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/**
 * The persona rows to offer for a brand — every persona except those a brand
 * cannot demonstrate. Today that is only the membership-count one, dropped for
 * a brand with no consumer membership (`supportsMembership`).
 *
 * Filtered rather than disabled: a greyed row invites a reviewer to wonder what
 * they are missing, and there is nothing to miss. The dropdown renders a
 * 1-based index per row, so the numbering closes up.
 */
export function personasForBrand(brand: Brand): DemoPersona[] {
  return DEMO_PERSONAS.filter((p) => !p.requiresMembership || supportsMembership(brand))
}
