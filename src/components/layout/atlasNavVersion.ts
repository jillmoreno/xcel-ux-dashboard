/**
 * ATLAS NAV VERSION (2026-09-30) — the Demo Controls' "Nav Version" dropdown,
 * Atlas/Compass version only. Two ways to navigate the same pages:
 *
 *   - LEFT RAIL (what the version always showed, and the default until
 *     2026-10-01): the white left rail alone.
 *   - TOP NAV (Figma "Atlas-Compass-Global-Navigation" 160:616), THE DEFAULT
 *     since 2026-10-01 (`ATLAS_NAV_DEFAULT`): the rail
 *     stays, and the header gains two global buttons — Home and Compass
 *     Learning — whose left edge sits on the rail's right edge. Home is
 *     current on the Home page; Compass Learning on the course's Overview and
 *     Course pages. See `AtlasTopNav`.
 *   - EXPANDING TOP NAV (Figma 168:916, 2026-10-01): the Top Nav, with the
 *     current button sliding its links out to its right — Home's Course,
 *     Study Plan, Certificates and Resources; Compass Learning's Overview, Course,
 *     Flashcards and Exam Simulator — and pushing the next button over as it goes.
 *
 * Mechanics mirror the Brand and Headings controls: `?nav=` in the URL, read
 * where it is needed (the header), so a link can show either version.
 */
export type AtlasNavVersion = 'left-rail' | 'top-nav' | 'expanding-top-nav'

export const ATLAS_NAV_VERSIONS: readonly { nav: AtlasNavVersion; label: string }[] = [
  { nav: 'left-rail', label: 'Left Rail' },
  { nav: 'top-nav', label: 'Top Nav' },
  { nav: 'expanding-top-nav', label: 'Expanding Top Nav' },
]

export const ATLAS_NAV_PARAM = 'nav'

/** The version a link with no `?nav=` shows: TOP NAV since 2026-10-01 (the
 *  designer's request; it was Left Rail). */
export const ATLAS_NAV_DEFAULT: AtlasNavVersion = 'top-nav'

/** `?nav=` → a known version, else the default. Validated, not cast. */
export function atlasNavFor(param: string | null): AtlasNavVersion {
  return ATLAS_NAV_VERSIONS.some((v) => v.nav === param) ? (param as AtlasNavVersion) : ATLAS_NAV_DEFAULT
}
