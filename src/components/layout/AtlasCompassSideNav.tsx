import type { CSSProperties } from 'react'
import type { PlatformSection } from './PlatformSideNav'

/**
 * The left rail for the **Atlas/Compass Global Navigation** dashboard version
 * — Figma "Atlas-Compass-Global-Navigation", node 49:3365 ("Global Left
 * Sidebar"), 2026-09-22.
 *
 * A SEPARATE COMPONENT, not a variant of `PlatformSideNav`. That rail is 1,279
 * lines carrying icons, the collapsed state, the overflow fade, the MVP trim
 * and the membership groups; this design has none of them. Threading "no
 * icons, no collapse, different content" through it would be a condition at
 * every one of those seams, and the version exists precisely so the nav can be
 * explored without touching the other versions' rail.
 *
 * What the design changes, against the demo rail:
 *
 * - **Text only.** No glyph column.
 * - **Five destinations.** Home · Study Plan · Certificates & Transcripts ·
 *   Resources, then Support · Get Help. Readiness, My Courses and Rubi
 *   Insights are not in the design; their sections still resolve from
 *   `?section=`, the same way every flag-hidden row does.
 * - **"Certificates & Transcripts"** is the design's label for the existing
 *   `certificates` section — a relabel, not a new section.
 * - **No collapse control**, so the shell pins this rail open (including while
 *   the Compass launcher is open — see `PlatformShell`).
 *
 * The list is FIXED to the design rather than filtered by the
 * `nav-show-*` flags: the flags describe the demo rail, and applying them here
 * would let a flag silently take a row out of a design that names it.
 *
 * The surface (white, 1px right rule, 12 / 20 / 24 padding, 260 wide) is set by
 * the shell's wrapper; this component draws the groups. Colours are the
 * `--color-atlas-nav-*` tokens in `tokens.css`, and the hover / focus / active
 * states are `.cre-atlas-nav-row` there, because inline styles cannot carry a
 * pseudo-class.
 */

type AtlasNavItem = { id: PlatformSection; label: string }

const ATLAS_NAV_GROUPS: { id: string; caption: string; items: AtlasNavItem[] }[] = [
  {
    id: 'my-learning',
    caption: 'My Learning',
    items: [
      { id: 'dashboard', label: 'Home' },
      { id: 'study-plan', label: 'Study Plan' },
      { id: 'certificates', label: 'Certificates & Transcripts' },
      { id: 'resources', label: 'Resources' },
    ],
  },
  {
    id: 'support',
    caption: 'Support',
    items: [{ id: 'support', label: 'Get Help' }],
  },
]

export function AtlasCompassSideNav({
  active,
  onSelect,
}: {
  active: PlatformSection
  onSelect: (id: PlatformSection) => void
}) {
  return (
    <nav aria-label="Primary" style={NAV}>
      {ATLAS_NAV_GROUPS.map((group, gi) => {
        const captionId = `atlas-rail-${group.id}`
        return (
          <div key={group.id} style={GROUP}>
            {/* The design gives every caption after the first 4px of top
                padding (Frame 27, 23.5 against 19.5). */}
            <p id={captionId} style={{ ...CAPTION, paddingTop: gi > 0 ? 4 : 0 }}>
              {group.caption}
            </p>
            <ul aria-labelledby={captionId} style={LIST}>
              {group.items.map((item) => {
                const isActive = active === item.id
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cre-atlas-nav-row"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => onSelect(item.id)}
                      style={ROW}
                    >
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}

const NAV: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const GROUP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

/* Open Sans Bold 11 / 16.5, 1.1px (0.1em) tracking, uppercase. */
const CAPTION: CSSProperties = {
  margin: 0,
  minHeight: 19.5,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-atlas-nav-caption)',
}

const LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}

/* 34px rows, 16 left / 8 right, radius 8. The active row's 3px left border
   and its 13px left padding (3 + 13 = 16, so the label does not move) live in
   `.cre-atlas-nav-row[aria-current='page']`, as do the colours — so the
   PADDING is in the class too: an inline padding, colour or background here
   would beat the class's states. */
const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 34,
  borderRadius: 8,
  boxSizing: 'border-box',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
}
