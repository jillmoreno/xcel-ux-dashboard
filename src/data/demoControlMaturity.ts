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
  /* Fidelity (lo-fi ⇄ hi-fi) — `LoFiContext`, not a flag, so it states its own.
     `wip`: lo-fi is a tool for the people DESIGNING the thing, and a
     stakeholder handed a control that greys the product out has been given a
     way to break their own demo with nothing to gain from it. */
  { id: 'fidelity', maturity: 'wip' },
  /* ⚠ FOUR ROWS WENT ON 2026-10-05 — `nav-layout` (`nav-placement`),
     `nav-help`, `journey-scale` (`journey-scale-style`) and `stop-mark`
     (`journey-stop-mark`) — when their dropdowns left the bar for the Feature
     Flag panel ("these things should live in the feature flags panel not in
     the demo controls"). `pacing` went with them, below.

     ⚠ THE FLAGS ARE UNTOUCHED. This file says which demo-bar CONTROLS the demo
     site offers; it is not a flag registry, so removing a row removes nothing
     from the product. All five flags are live and configurable in the panel.

     ⚠ AND A ROW HERE FOR A CONTROL THAT NO LONGER RENDERS IS WORSE THAN NO
     ROW: `controlMaturity` would keep answering for an id nothing draws, and
     `demoSiteControls()` would list it — a readiness statement about something
     that is not there. The `wip` fallback means a control that comes BACK
     without its row is hidden rather than leaked, which is the safe direction. */
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
  /* `pacing` WAS HERE — `study-pace-preset`. Left the bar 2026-10-05 with the
     four above. */
  /* `navigation` WAS HERE — the `dashboard-navigation` A/B's control, archived
     2026-10-01 with the flag it inherited from. See `archivedItems.ts`. */
  { id: 'education', flag: 'dashboard-education-type' },
  /* DASHBOARD VERSION — 2026-10-05. ⚠ READY, and it is the first control here
     that is `ready` without being a scenario seed. The reason is reach, not
     readiness-in-the-usual-sense: `PrototypeChrome` does not render the robot
     on the public site, so until this landed a stakeholder had NO route to the
     version picker at all. Marking it `wip` would add a control for designers
     who already had one and leave the gap exactly where it was.

     ⚠ THE PICKER IS GATED SEPARATELY, per version. `dashboardVersionsForAudience`
     lists `ready` versions only on the demo site, so this control being ready
     does not mean every version it offers is. */
  { id: 'version', maturity: 'ready' },
  /* `flags` WAS HERE for a few hours on 2026-10-05 — the Feature Flag sheet's
     icon. It moved to the DESIGN bar, which is design-site-only as a whole, so
     it needs no readiness row at all: the surface is the gate. */
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
