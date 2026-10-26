import type { CSSProperties } from 'react'

/**
 * ATLAS ADMIN — the shared styles (2026-10-19). Values from the reference's own
 * classes (colibri-b2b.vercel.app), through the `--admin-*` tokens in
 * tokens.css. Kept apart from the components so a page can take a style
 * without taking a component.
 */

export const HEADING = 'var(--admin-font-heading)'
export const BODY = 'var(--font-body)'

/* Page headline: the Atlas Serif H3 (2026-10-23, Eric — tried the H1, then
   "try h3"). Was Open Sans 30 / bold, tight. */
export const PAGE_H1: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 'var(--admin-atlas-h3-size)',
  fontWeight: 400,
  lineHeight: 'var(--admin-atlas-h3-line)',
  letterSpacing: '-0.01em',
  color: 'var(--admin-ink)',
}
export const PAGE_SUB: CSSProperties = { margin: '4px 0 0', fontSize: 14, color: 'var(--admin-text)' }

/* White card, 18 corners, slate-200 edge. */
export const CARD: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
}

/* Pill buttons: outlined and brand. 37 tall at 14 / 600. */
const PILL_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  padding: '8px 16px',
  fontFamily: BODY,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '19px',
  cursor: 'pointer',
}
export const BUTTON_OUTLINE: CSSProperties = {
  ...PILL_BUTTON,
  border: '1px solid var(--admin-rule-strong)',
  background: 'var(--admin-surface)',
  color: 'var(--admin-ink)',
}
export const BUTTON_BRAND: CSSProperties = {
  ...PILL_BUTTON,
  border: '1px solid transparent',
  background: 'var(--admin-cta)',
  color: 'var(--admin-surface)',
}

/* The Atlas learner buttons (Home's Begin Course / Course Overview):
   13.5 on 5 × 8, 9px corners; primary bold on the CTA, secondary a 1px
   CTA outline at medium weight. */
const ATLAS_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  whiteSpace: 'nowrap',
  borderRadius: 9,
  padding: '5px 8px',
  fontFamily: BODY,
  fontSize: 13.5,
  lineHeight: '20.25px',
  cursor: 'pointer',
}
export const ATLAS_BUTTON_PRIMARY: CSSProperties = {
  ...ATLAS_BUTTON,
  border: '1px solid transparent',
  background: 'var(--admin-cta)',
  color: 'var(--admin-surface)',
  fontWeight: 700,
}
export const ATLAS_BUTTON_SECONDARY: CSSProperties = {
  ...ATLAS_BUTTON,
  border: '1px solid var(--admin-cta)',
  background: 'transparent',
  color: 'var(--admin-cta)',
  fontWeight: 500,
}

/* Eyebrow / table head: 12 / bold / uppercase / 0.08em. */
export const EYEBROW: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--admin-muted)',
}

/* The dashed filter chip. */
export const CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  border: '1px dashed var(--admin-rule-strong)',
  background: 'transparent',
  padding: '4px 12px',
  fontFamily: BODY,
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--admin-text)',
  cursor: 'pointer',
}
/* An applied filter: solid, with its ×. */
export const CHIP_ON: CSSProperties = {
  ...CHIP,
  border: '1px solid var(--admin-ink)',
  background: 'var(--admin-ink)',
  color: 'var(--admin-surface)',
}

/* A dropdown menu under a chip. */
export const MENU: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: '100%',
  zIndex: 20,
  marginTop: 4,
  padding: 4,
  borderRadius: 12,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  boxShadow: 'var(--admin-shadow-menu)',
}
export const MENU_ITEM: CSSProperties = {
  display: 'block',
  width: '100%',
  borderRadius: 8,
  border: 'none',
  background: 'none',
  padding: '8px 12px',
  textAlign: 'left',
  fontFamily: BODY,
  fontSize: 14,
  color: 'var(--admin-ink)',
  cursor: 'pointer',
}

/* Status pills — 12 / 600, ringed. */
export const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  padding: '2px 10px',
  fontSize: 12,
  fontWeight: 600,
}

export const FIELD_LABEL: CSSProperties = {
  display: 'block',
  margin: '0 0 8px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--admin-text)',
}
export const INPUT: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  padding: '10px 12px',
  fontFamily: BODY,
  fontSize: 14,
  color: 'var(--admin-ink)',
  outline: 'none',
}

/* ── The status cards (Students' outcome row, Invites' tiles) ── Atlas UX
   Design 527:603 (Active) / 527:746 (Default): 14px corners, a flex column
   so every card in a row fills to the tallest. The pill is StatusPill and the
   note StatusNote (adminUi). */
export const STATUS_CARD: CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'none', borderStyle: 'solid', borderWidth: 1, borderRadius: 14, cursor: 'pointer', textAlign: 'left' }
/* Playfair Bold with lining figures (`lnum`, asked for both ways so no browser falls back): every numeral the same height on one
   baseline — Playfair's default old-style figures drop 3, 4, 5, 7, 9 below it and raise 6 and 8. */
export const STATUS_COUNT: CSSProperties = { fontFamily: 'var(--admin-font-playfair)', fontSize: 28, fontWeight: 700, lineHeight: '20px', letterSpacing: '-1.68px', whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums proportional-nums', fontFeatureSettings: '"lnum" 1, "pnum" 1', color: 'var(--admin-atlas-ink)' }
export const STATUS_DESC: CSSProperties = { margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '13px', color: 'var(--admin-text)' }
