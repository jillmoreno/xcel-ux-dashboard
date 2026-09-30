/**
 * ATLAS NAV VERSION (2026-09-30) — the Demo Controls' "Nav Version" dropdown,
 * Atlas/Compass version only. Two ways to navigate the same pages:
 *
 *   - LEFT RAIL (the default, and what the version has always shown): the
 *     white left rail alone.
 *   - TOP NAV (Figma "Atlas-Compass-Global-Navigation" 160:616): the rail
 *     stays, and the header gains two global buttons — Home and Compass
 *     Learning — whose left edge sits on the rail's right edge. Home is
 *     current on the Home page; Compass Learning on the course's Overview and
 *     Course pages. See `AtlasTopNav`.
 *
 * Mechanics mirror the Brand and Headings controls: `?nav=` in the URL, read
 * where it is needed (the header), so a link can show either version.
 */
export type AtlasNavVersion = 'left-rail' | 'top-nav'

export const ATLAS_NAV_VERSIONS: readonly { nav: AtlasNavVersion; label: string }[] = [
  { nav: 'left-rail', label: 'Left Rail' },
  { nav: 'top-nav', label: 'Top Nav' },
]

export const ATLAS_NAV_PARAM = 'nav'

/** `?nav=` → a known version, else Left Rail. Validated, not cast. */
export function atlasNavFor(param: string | null): AtlasNavVersion {
  return ATLAS_NAV_VERSIONS.some((v) => v.nav === param) ? (param as AtlasNavVersion) : 'left-rail'
}
