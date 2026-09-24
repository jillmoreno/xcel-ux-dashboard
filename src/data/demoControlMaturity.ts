import { FEATURE_FLAGS, type Maturity } from '@/context/FeatureFlagContext'

/**
 * WHICH DEMO-BAR CONTROLS THE DEMO SITE OFFERS — 2026-09-24.
 *
 * Replaces the hard-coded `DEMO_SITE_CONTROLS` allow-list that sat in
 * `PrototypeChrome` for one commit (06954e6). The list was right about the
 * ANSWER and wrong about the HOME: a control's readiness is a property of the
 * work, and the flag catalog already carries every other fact about it. Keeping
 * it in the chrome meant promoting a feature and revealing it were two edits in
 * two files, and the second one was the easy one to forget.
 *
 * So readiness now resolves in this order:
 *
 *   1. an explicit `maturity` on the row below — for the controls that are NOT
 *      flags (Persona, Quick switch, Brand, the Reset/kebab block), which have
 *      no catalog entry to carry the field;
 *   2. the `maturity` on the flag the control drives;
 *   3. `wip` — see `Maturity`. It fails CLOSED in both directions: a control
 *      added to the bar tomorrow with no row here is hidden, and a row that
 *      names a flag which never got promoted is hidden too.
 *
 * ⚠ THIS GATES THE DEMO SITE ONLY. The design site shows every control and
 * marks the `wip` ones — see `MaturityMark` in `DemoBar`. Nothing here is a
 * permission; it is a readiness statement, and the people who decide readiness
 * are the ones on the design site.
 */
type DemoControlRow = {
  /** The `id` on the control's `<DemoDropdown>`. */
  id: string
  /** The flag whose `maturity` this control inherits, when it has one. */
  flag?: string
  /** Readiness stated here instead — ONLY for controls with no flag. */
  maturity?: Maturity
}

export const DEMO_CONTROLS: readonly DemoControlRow[] = [
  /* Brand picker — parked (the bar renders it only when a brand switch is
     enabled at all), so it states its own `wip` rather than inheriting one. */
  { id: 'brand', maturity: 'wip' },
  /* The membership tier switch. Not a flag — it writes `AccountContext`. READY:
     free vs. paid is the oldest, most-demoed axis in the product. */
  { id: 'quick', maturity: 'ready' },
  /* Persona. Not a flag either — one pick writes tier, profession, membership
     and education together. WIP because a persona reshapes the whole scenario,
     and several of the personas behind it are still being argued about. */
  { id: 'persona', maturity: 'wip' },
  { id: 'progress', flag: 'dashboard-progress-state' },
  { id: 'readiness', flag: 'readiness-state' },
  { id: 'pacing', flag: 'study-pace-preset' },
  { id: 'navigation', flag: 'dashboard-navigation' },
  { id: 'education', flag: 'dashboard-education-type' },
  /* Reset + the kebab. ⚠ READY, DELIBERATELY: Reset is what gets a stakeholder
     out of a state they wandered into. Hiding it would leave the only recovery
     a page reload they have no reason to think of. */
  { id: 'actions', maturity: 'ready' },
]

const rowFor = (id: string) => DEMO_CONTROLS.find((row) => row.id === id)

/** How finished a demo-bar control is. Unknown ids resolve `wip`. */
export function controlMaturity(id: string): Maturity {
  const row = rowFor(id)
  if (!row) return 'wip'
  if (row.maturity) return row.maturity
  const flag = FEATURE_FLAGS.find((def) => def.key === row.flag)
  return flag?.maturity ?? 'wip'
}

/** The control ids the DEMO site offers — the `only` list, derived. */
export function demoSiteControls(): string[] {
  return DEMO_CONTROLS.filter((row) => controlMaturity(row.id) === 'ready').map((row) => row.id)
}

/**
 * The variants of `flagKey` a given audience should see.
 *
 * The within-a-control half of the gate. A variant with no `maturity` inherits
 * the FLAG's — not `wip` — because the alternative empties the picker of every
 * promoted flag the moment this ships. Only a variant that says `wip` on itself
 * is dropped, and only for the demo site.
 */
export function variantsForDemo<T extends { value: string; maturity?: Maturity }>(
  variants: readonly T[],
  flagKey: string,
): T[] {
  const inherited = FEATURE_FLAGS.find((def) => def.key === flagKey)?.maturity ?? 'wip'
  return variants.filter((v) => (v.maturity ?? inherited) === 'ready')
}
