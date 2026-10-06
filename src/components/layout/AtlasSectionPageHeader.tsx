import type { CSSProperties } from 'react'
import { AngleLeftRegular } from '@/icons'
import { pageHeaderWrapStyle } from './pageHeaderStyles'

/**
 * The ATLAS copy of `SectionPageHeader` — 2026-10-06, Eric's request: "change
 * the page headers when used to the Serif H1 and change the breadcrumb back
 * icon to FontAwesome's angle-left" (then "try the H3"). A SIBLING rather than a prop on the
 * original (CLAUDE.md: fork the layout, don't thread conditionals), chosen by
 * `PlatformShell` under `atlasNav`; the shipped versions keep the original.
 *
 * Same box, crumb row and behaviour as the original — only the title (Serif
 * H3: `--font-heading-serif` at the Atlas H3 step, so the Headings control
 * still swaps it) and the back icon (FA angle-left, Regular) differ.
 */
export function AtlasSectionPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header style={pageHeaderWrapStyle}>
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
      <h1 style={TITLE}>{title}</h1>
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
/* Serif H3 (2026-10-06 — H1, 64/64, was tried first the same day and read too
   large), scaled with the Headings control's face. */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h3-size, 44px)',
  lineHeight: 'var(--type-atlas-h3-line, 46px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
