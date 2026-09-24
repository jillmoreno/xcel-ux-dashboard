import type { CSSProperties } from 'react'
import { HouseRegular } from '@/icons'
import { useAtlasCourse } from './useAtlasCourse'
import { ATLAS_COURSE_PAGES, type AtlasCoursePageId } from './dashboardRail'

/**
 * The Atlas/Compass version's left rail WHILE THE COURSE PAGE IS OPEN — Figma
 * "Atlas-Compass-Global-Navigation", node 49:3536, 2026-09-22.
 *
 * It REPLACES `AtlasCompassSideNav` rather than extending it: inside a course
 * the rail is about that course (its sub-pages), and the way back out is the
 * breadcrumb's home icon. Same surface, row treatment and tokens as the Atlas
 * rail — `.cre-atlas-nav-row` — so the two read as one navigation in two
 * states rather than two designs.
 *
 * Top to bottom, as the design draws it, 8px apart:
 *
 *   1. **Breadcrumb** — home icon / current sub-page. The icon is the ONLY link
 *      out, and it goes to Home. The last crumb is the page you are on, so it
 *      is text with `aria-current`, not a link to itself.
 *   2. **The course title** — the learner's REAL course, not the design's
 *      "Florida Life & Health and with a Longer Course Title" placeholder. It
 *      resolves the way Home does (the Progress persona, with the education
 *      type forced to a qualifying one, as every QE-shaped version does), so
 *      the rail cannot name a different course from the page behind it.
 *   3. **The sub-pages** — `ATLAS_COURSE_PAGES`, no group caption.
 *
 * Two small departures, both on the breadcrumb:
 *
 * - **The current crumb is `#767676`, not the design's `#777`.** `#777` is
 *   4.48:1 on white — just under AA at 11px. `#767676` is 4.54:1 and reads
 *   the same.
 * - **Open Sans, not Source Sans 3.** The design's crumb face is not loaded in
 *   this app, and adding a webfont for one 11px word is the wrong trade. The
 *   separator is a text "/" for the same reason the design's FA `slash-forward`
 *   glyph is not vendored here — it is not in `src/icons/`, and a hand-drawn
 *   path is not how icons get added.
 */
export function AtlasCourseSideNav({
  page,
  onSelectPage,
  onHome,
}: {
  page: AtlasCoursePageId
  onSelectPage: (id: AtlasCoursePageId) => void
  onHome: () => void
}) {
  const courseTitle = useAtlasCourse().title
  const current = ATLAS_COURSE_PAGES.find((p) => p.id === page) ?? ATLAS_COURSE_PAGES[0]

  return (
    <div style={COLUMN}>
      <nav aria-label="Breadcrumb">
        <ol style={CRUMBS}>
          <li style={CRUMB_ITEM}>
            <button
              type="button"
              className="cre-atlas-crumb-home"
              onClick={onHome}
              aria-label="Home"
              style={HOME_BUTTON}
            >
              {/* FA `house` REGULAR — the same icon the Compass course rail's
                  breadcrumb uses, so the two course rails' home links match. */}
              <HouseRegular size={11} aria-hidden />
            </button>
          </li>
          <li style={CRUMB_ITEM}>
            <span aria-hidden style={SEPARATOR}>
              /
            </span>
            <span aria-current="page" style={CURRENT_CRUMB}>
              {current.label}
            </span>
          </li>
        </ol>
      </nav>
      <p style={COURSE_TITLE}>{courseTitle}</p>
      <nav aria-label="Course">
        <ul style={LIST}>
          {ATLAS_COURSE_PAGES.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="cre-atlas-nav-row"
                aria-current={item.id === current.id ? 'page' : undefined}
                onClick={() => onSelectPage(item.id)}
                style={ROW}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

const COLUMN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const CRUMBS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
}

const CRUMB_ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  minHeight: 20,
}

/* 20px tall with the design's 2px right pad; the icon is 11px. The colour is
   the class's, so its focus ring and this ink stay one token. */
const HOME_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20,
  padding: '0 2px 1px 0',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 4,
}

const SEPARATOR: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '20px',
  color: 'var(--color-atlas-nav-crumb-separator)',
}

const CURRENT_CRUMB: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 500,
  lineHeight: '19px',
  color: 'var(--color-atlas-nav-crumb)',
}

/* Open Sans Medium 14/21, 6px under it before the list (the design's frame
   padding). It WRAPS — the design's title is two lines on purpose. */
const COURSE_TITLE: CSSProperties = {
  margin: 0,
  paddingBottom: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}

/* Same as the Atlas rail's row: padding, colour and background belong to
   `.cre-atlas-nav-row`, so nothing here may set them. */
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
