import type { CSSProperties } from 'react'
import { Logo } from '@/components/brand/Logo'
import { COMPASS_RAIL_FOOTER, COMPASS_RAIL_WORDMARK } from '@/data/compassRailFixtures'
import type { CompassPage } from './CompassCoursePlayer'

/**
 * ANJANI'S COMPASS RAIL — 2026-10-08, the direct ask: "i still need anjanis
 * rails that exist in her design. not these."
 *
 * ⚠ A FORK OF `CompassSidebar`, NOT A FLAG THROUGH IT, which is this repo's own
 * rule for changing something that already exists. The first attempt swapped
 * only the ROW LIST inside the shared sidebar and was rejected — correctly,
 * because the rail is a different object in her design, not the same one with
 * different words:
 *
 * | | `CompassSidebar` | Hers |
 * |---|---|---|
 * | Top | Home crumb, course title, days left, a 62% bar | the XCEL lockup + "Compass" |
 * | Rows | icon + label | label only |
 * | Bottom | nothing | course hours, exam date, the learner |
 *
 * Measured off her prototype in the browser rather than read off a screenshot:
 * 220px wide, 26/18 padding, a 1px right rule; rows 32px tall at 13px on a 7px
 * radius; the active row filled and in the primary ink.
 *
 * ⚠ NO HOME CRUMB, AND THAT IS SAFE ONLY HERE. `CompassSidebar` carries one
 * because the player can be entered with the app header stood down, leaving the
 * crumb as the only way out. Hybrid's Compass pages render INSIDE the shell —
 * the global header's Home pill is on screen — so a crumb would be the second
 * route to a place already visible. The lesson player keeps the shared sidebar
 * and keeps its crumb.
 *
 * ⚠ TOKENS, NOT HER HEXES. Her active fill `#ECEEF0` and active ink `#3D5A73`
 * are already `--color-atlas-nav-active-fill` and `--color-primary-500` on the
 * shipped skin, so the rail follows a brand skin for free. Her warm rule
 * (`#E0DBCD`) has no token and takes `--color-border-subtle`; that is the one
 * place this is a near-match rather than exact, and it is deliberate — a raw
 * hex here would not move with the palettes.
 */
export function CompassRail({
  page,
  onSelectPage,
  pages,
}: {
  page: CompassPage
  onSelectPage: (p: CompassPage) => void
  /** The rows, from `HYBRID_COMPASS_PAGES` — passed rather than imported so the
   *  rail cannot disagree with the list the rest of the page reads. */
  pages: readonly { id: CompassPage; label: string }[]
}) {
  const f = COMPASS_RAIL_FOOTER
  return (
    <aside style={railStyle}>
      {/* The lockup, not a crumb. `Logo` follows the brand skin, so this reads
          Colibri Real Estate or Grasslands along with the rest of the page. */}
      <div style={brandStyle}>
        <Logo height={28} />
        <span style={wordmarkStyle}>{COMPASS_RAIL_WORDMARK}</span>
      </div>

      <nav aria-label="Course pages" style={navStyle}>
        <ul style={listStyle}>
          {pages.map((p) => {
            const active = p.id === page
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectPage(p.id)}
                  aria-current={active ? 'page' : undefined}
                  style={{ ...rowStyle, ...(active ? rowActiveStyle : null) }}
                >
                  {p.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ⚠ PUSHED DOWN BY `margin-top: auto`, not by a spacer: her footer sits
          at the bottom of the rail whatever the row count, and a fixed gap
          would drift the moment a row is added or removed. */}
      <div style={footStyle}>
        <div>
          <p style={footLabelStyle}>{f.hoursLabel}</p>
          <p style={footValueStyle}>{f.hoursValue}</p>
        </div>
        <div>
          {/* ⚠ THIS LABEL IS UPPERCASE AND "Course hours" IS NOT — hers are
              different, and it is not a slip in her file: the exam is the one
              thing in the rail with an outstanding action, and the eyebrow
              treatment is what marks it. */}
          <p style={footEyebrowStyle}>{f.examLabel}</p>
          <p style={footValueStyle}>
            {f.examDate} · <span style={footWarnStyle}>{f.examState}</span>
          </p>
        </div>
        <div style={learnerStyle}>
          <span aria-hidden style={avatarStyle}>
            {f.learnerInitials}
          </span>
          <span style={learnerNameStyle}>{f.learnerName}</span>
        </div>
      </div>
    </aside>
  )
}

const railStyle: CSSProperties = {
  width: 220,
  flex: 'none',
  minHeight: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  padding: '26px 18px',
  borderRight: '1px solid var(--color-border-subtle)',
}

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  minWidth: 0,
}

/* Her wordmark is the SERIF at 15/600 in the primary ink — the one serif word
   in the rail, which is what makes it read as a lockup rather than a heading. */
const wordmarkStyle: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: 'var(--color-primary-500)',
}

const navStyle: CSSProperties = { minWidth: 0 }

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
}

const rowStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '8px 11px',
  borderRadius: 7,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

/* The active row: her `--rubi-soft` fill and `--rubi` ink, which are this
   product's `--color-atlas-nav-active-fill` and `--color-primary-500`. */
const rowActiveStyle: CSSProperties = {
  background: 'var(--color-atlas-nav-active-fill)',
  color: 'var(--color-primary-500)',
  fontWeight: 500,
}

const footStyle: CSSProperties = {
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  paddingLeft: 11,
}

const footLabelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-tertiary)',
}

const footEyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  lineHeight: '15px',
  color: 'var(--color-text-tertiary)',
}

const footValueStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const footWarnStyle: CSSProperties = { color: 'var(--color-warning-700)' }

const learnerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
}

const avatarStyle: CSSProperties = {
  flex: 'none',
  width: 24,
  height: 24,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-neutral-75)',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const learnerNameStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}
