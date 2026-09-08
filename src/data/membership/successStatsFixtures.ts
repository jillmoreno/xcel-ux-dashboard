import type { Brand } from '@/context/AccountContext'

/**
 * Social-proof / credibility stats for the Dashboard Rebrand's NON-MEMBER
 * experience. Two informational (non-promotional) bands, both Elite-only:
 *
 *   - `memberSuccessStatsFor` → the dashboard "Member Success" band
 *     (below the Your Learning row): how members do across the program.
 *   - `membershipStatBarFor`  → the "Explore Membership" comparison-page
 *     stat bar (above the plan cards): what the membership covers.
 *
 * Both return `StatHighlight[]`; non-Elite brands return `[]` so the bands
 * hide themselves (the rebrand only ever runs Elite, but the `[]` fallback
 * keeps the components brand-safe).
 *
 * TODO(data): replace with real program metrics from the membership /
 * marketing service once those endpoints exist — these figures are a
 * prototype draft. Keep the shape additive.
 */
export type StatHighlight = {
  /** Large display value, pre-formatted ("2.4M", "$1,180", "92%"). */
  value: string
  /** Short caption under the value. */
  label: string
  /** Optional icon key — mapped to an `@/icons` glyph by the band that
   *  renders it. Omit for a value-only stat. */
  iconKey?: string
}

const ELITE_MEMBER_SUCCESS: StatHighlight[] = [
  { value: '2.4M', label: 'credit hours completed by members last year', iconKey: 'credits' },
  { value: '$1,180', label: 'average member saves annually', iconKey: 'savings' },
  { value: '92%', label: 'of members renew their membership', iconKey: 'renewal' },
]

const MEMBER_SUCCESS_BY_BRAND: Record<Brand, StatHighlight[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function memberSuccessStatsFor(brand: Brand): StatHighlight[] {
  return MEMBER_SUCCESS_BY_BRAND[brand]
}

const ELITE_STAT_BAR: StatHighlight[] = [
  { value: '500+', label: 'CE hours & courses', iconKey: 'library' },
  { value: '9', label: 'member products & tools', iconKey: 'tools' },
  { value: 'ANCC', label: 'accredited provider', iconKey: 'accredited' },
  { value: 'All 50', label: 'states supported', iconKey: 'states' },
]

const STAT_BAR_BY_BRAND: Record<Brand, StatHighlight[]> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: [],
}

export function membershipStatBarFor(brand: Brand): StatHighlight[] {
  return STAT_BAR_BY_BRAND[brand]
}
