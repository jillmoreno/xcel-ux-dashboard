import type { CSSProperties } from 'react'

/* The Compass Design System v5's `.btn.primary` (compassdesignsystemv5.html):
   min-height 40, 11 / 18 padding, 13.5px (at 600 there; 700 here, below), radius 9, an 8px gap, a 1px
   border in the fill's colour. The file's Inter is the product's body font here,
   the same substitution the rest of the Compass pieces make.
   The SIZING is every brand's since 2026-09-30 (the designer's request: the
   Global button's size and type on all brands' course card buttons, Home and
   Overview). The COLOURS stay each brand's own, from `.cre-compass-primary`;
   only Global adds the file's steel / slate, via `.cre-compass-btn-primary`
   in tokens.css. */
export const COMPASS_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  flex: 'none',
  minHeight: 40,
  boxSizing: 'border-box',
  padding: '11px 18px',
  borderRadius: 9,
  border: '1px solid transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // Bold (700), not the file's 600 — 2026-09-30, the designer's request, to
  // match the Save button.
  fontWeight: 700,
  fontSize: 13.5,
  whiteSpace: 'nowrap',
  transition: 'background-color .15s, color .15s, border-color .15s',
}
