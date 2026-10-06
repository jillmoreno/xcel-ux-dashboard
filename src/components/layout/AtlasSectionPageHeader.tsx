import type { CSSProperties } from 'react'
import { AngleLeftRegular } from '@/icons'
import { pageHeaderWrapStyle } from './pageHeaderStyles'

/**
 * The ATLAS copy of `SectionPageHeader` — 2026-10-06, Eric's request: "change
 * the page headers when used to the Serif H1 and change the breadcrumb back
 * icon to FontAwesome's angle-left" (then H3, then H4). A SIBLING rather than a prop on the
 * original (CLAUDE.md: fork the layout, don't thread conditionals), chosen by
 * `PlatformShell` under `atlasNav`; the shipped versions keep the original.
 *
 * Same box, crumb row and behaviour as the original — only the title (Serif
 * H4: `--font-heading-serif` at the Atlas H4 step, so the Headings control
 * still swaps it) and the back icon (FA angle-left, Regular) differ.
 */
export function AtlasSectionPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    // No bottom padding (2026-10-06, Eric's request) — main's header style is 16;
    // the page's own 24 above its first row is the only gap left.
    <header style={{ ...pageHeaderWrapStyle, paddingBottom: 0 }}>
      <p style={CRUMB_ROW}>
        <button
          type="button"
          onClick={onBack}
          data-cta-id="nav.back-home"
          className="cre-link-action cre-cta-ink"
          style={CRUMB_BUTTON}
        >
          <AngleLeftRegular size={13} aria-hidden />
          Back to Home
        </button>
      </p>
      {/* The course titles' class: one weight under the other headings
          (2026-10-06, Eric's request) — 400 under Source Serif 4. */}
      <h1 className="cre-compass-course-title" style={TITLE}>
        {title}
      </h1>
    </header>
  )
}

/* The original's crumb row and button, unchanged. */
const CRUMB_ROW: CSSProperties = {
  margin: '0 0 6px',
  display: 'flex',
  alignItems: 'center',
  minHeight: '16.5px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '16.5px',
}
const CRUMB_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  lineHeight: 'inherit',
  fontWeight: 600,
}
/* Serif H4, 38/40 — the Course Overview and Resources titles' step (2026-10-06:
   H1 64/64 first, then H3 44/46, then "one level down" to this), scaled
   with the Headings control's face. Still an <h1> element: it is the page's
   title, whatever step of the type scale it is drawn at. */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h4-size, 38px)',
  lineHeight: 'var(--type-atlas-h4-line, 40px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
