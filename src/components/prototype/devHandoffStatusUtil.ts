import type { PrototypeFeature } from '@/data/prototypeFeatures'
/**
 * Dev-cycle status — the per-handoff-card status a reviewer sets from a card's
 * kebab on the feature gateway (In Design / Needs Discussion / Blocked / Ready
 * for Dev / In Development). Stored in localStorage keyed by
 * `featureId:componentId`, so it survives reload.
 *
 * Extracted into this shared (non-component) module so BOTH the feature gateway
 * (per-card menu) and the landing board (feature-tile roll-up menu) read and
 * write the SAME store — a tile can cascade one status down to every card, and
 * the tile reflects the cards' combined state.
 */

export type DevStatus =
  | 'in-design'
  | 'needs-discussion'
  | 'blocked'
  | 'ready-for-dev'
  | 'in-development'

/** Banner color per status (deep shades so white text reads on top). */
/** Light-surface stroke per status. The stops are deep enough that the colour
 *  still clears 4.5:1 as small text after a 12% tint of ITSELF is laid behind
 *  it — which is what the home page's status TAG does. success-500 (4.53 bare,
 *  3.86 tinted), warning-700 (4.73 / 4.07) and info-700 (5.69 / 4.43 on the
 *  hover background) were all too shallow for that. */
export const DEV_STATUS_STROKE: Record<DevStatus, string> = {
  'in-design': 'var(--color-info-800)',
  'needs-discussion': 'var(--color-error-600)',
  'blocked': 'var(--color-neutral-900)',
  'ready-for-dev': 'var(--color-success-600)',
  'in-development': 'var(--color-warning-800)',
}

/** Human-readable label per status (kebab + a11y + banner text). */
export const DEV_STATUS_LABEL: Record<DevStatus, string> = {
  'in-design': 'In Design',
  'needs-discussion': 'Needs Discussion',
  'blocked': 'Blocked',
  'ready-for-dev': 'Ready for Dev',
  'in-development': 'In Development',
}

/** Menu order for the status picker (both the card kebab and the tile roll-up). */
export const DEV_STATUS_SEQUENCE: DevStatus[] = [
  'in-design',
  'needs-discussion',
  'blocked',
  'ready-for-dev',
  'in-development',
]

const DEV_STATUS_STORAGE_KEY = 'cgp.devHandoffStatus'

/** The composite key for a single card's status. */
export function devStatusKey(featureId: string, componentId: string): string {
  return `${featureId}:${componentId}`
}

/** Read the full status map ({ "featureId:componentId": DevStatus }). */
export function readDevStatusMap(): Record<string, DevStatus> {
  try {
    const raw = localStorage.getItem(DEV_STATUS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, DevStatus>) : {}
  } catch {
    return {}
  }
}

/** Persist the whole map in a single write. */
function writeDevStatusMap(map: Record<string, DevStatus>): void {
  try {
    localStorage.setItem(DEV_STATUS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* storage unavailable — status stays session-only in React state */
  }
}

/** Persist (or clear) a single card's status, returning the new value. */
export function writeDevStatus(key: string, status: DevStatus | null): DevStatus | null {
  const map = readDevStatusMap()
  if (status) map[key] = status
  else delete map[key]
  writeDevStatusMap(map)
  return status
}

/**
 * Roll a feature's card statuses up to a single tile status:
 *   - no cards, or every card unset             -> null (tile shows no banner)
 *   - every card set to the SAME status         -> that status
 *   - cards disagree (incl. some set, some not) -> 'mixed'
 */
export function getFeatureRollupStatus(
  featureId: string,
  componentIds: string[],
): DevStatus | 'mixed' | null {
  if (componentIds.length === 0) return null
  const map = readDevStatusMap()
  const seen = new Set<DevStatus | null>()
  for (const id of componentIds) {
    seen.add(map[devStatusKey(featureId, id)] ?? null)
  }
  if (seen.size === 1) return [...seen][0] ?? null
  return 'mixed'
}

/**
 * Cascade one status (or a clear) to every card of a feature in a single
 * localStorage write — the tile roll-up action.
 */
export function setFeatureRollupStatus(
  featureId: string,
  componentIds: string[],
  status: DevStatus | null,
): void {
  if (componentIds.length === 0) return
  const map = readDevStatusMap()
  for (const id of componentIds) {
    const key = devStatusKey(featureId, id)
    if (status) map[key] = status
    else delete map[key]
  }
  writeDevStatusMap(map)
}

/* ── Feature-level status ────────────────────────────────────────────────
   Moved here from PrototypeLandingPage so the landing board and the
   /ux-dashboard exploration resolve a feature's status through ONE
   function. Two copies would let a pill disagree with the row it filters,
   which is the exact failure this resolver was written to prevent. */
export type FeatureStatusKey = DevStatus | 'mixed' | 'coming-soon' | 'done' | 'none'

export function featureStatusKeyOf(
  feature: PrototypeFeature,
  isDone: boolean,
  isInDesign: boolean,
  rollup: DevStatus | 'mixed' | null,
): FeatureStatusKey {
  if (feature.status === 'coming-soon') return 'coming-soon'
  if (isDone) return 'done'
  if (rollup) return rollup
  if (feature.devStatus) return feature.devStatus
  if (isInDesign) return 'in-design'
  return 'none'
}

/** Dark-theme twins of DEV_STATUS_STROKE. The mid/deep ramp stops above are
 *  picked to read on WHITE; on the prototype home's dark surface they land
 *  between 1.9:1 and 3.4:1, so chip text at 10.5px would fail AA. These are the
 *  light stops of the SAME hue — every one clears 4.5:1 on the dark card.
 *  `blocked` keeps neutral-900 because the neutral ramp inverts with the theme,
 *  so it is already near-white there. */
const DEV_STATUS_STROKE_DARK: Record<DevStatus, string> = {
  'in-design': 'var(--color-info-300)',
  'needs-discussion': 'var(--color-error-200)',
  'blocked': 'var(--color-neutral-900)',
  'ready-for-dev': 'var(--color-success-200)',
  'in-development': 'var(--color-warning-400)',
}

/** The status's stroke color for the surface it is drawn on. */
export function devStatusStrokeFor(status: DevStatus, dark = false): string {
  return (dark ? DEV_STATUS_STROKE_DARK : DEV_STATUS_STROKE)[status]
}

/** Chip label + color per status key. `none` keeps the existing "Ready" copy the
 *  table already used for a feature with nothing flagged. Pass `dark` on a dark
 *  surface — see DEV_STATUS_STROKE_DARK. */
export function featureStatusChipFor(
  key: FeatureStatusKey,
  dark = false,
): { label: string; color: string } {
  // The three non-status keys read on the adaptive text token rather than a
  // ramp stop, so they follow the theme without a dark twin. text-TERTIARY is
  // too pale once the tag tint is behind it — 4.24:1 on the Dim card.
  if (key === 'coming-soon') return { label: 'Coming soon', color: 'var(--color-text-secondary)' }
  if (key === 'done')
    return { label: 'Done', color: dark ? 'var(--color-success-200)' : 'var(--color-success-600)' }
  if (key === 'mixed') return { label: 'Mixed', color: 'var(--color-text-secondary)' }
  if (key === 'none') return { label: 'Ready', color: 'var(--color-text-secondary)' }
  return { label: DEV_STATUS_LABEL[key], color: devStatusStrokeFor(key, dark) }
}

