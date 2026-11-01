import type { CSSProperties } from 'react'

/**
 * THE HUB ROW'S STYLES — one module, every section (2026-11-01).
 *
 * Until today these lived in `UxDashboardPage.tsx` as the Prototypes rows'
 * own constants, and `LinksPanel.tsx` carried a hand copy of the tag style
 * "so the two panels stay free of each other's modules". Jillienne on the
 * live site, 2026-11-01: "I want ALL of the pages to follow this similar UI
 * so its consistent" — thumbnail, title, short description, the three tags
 * on the right, the chevron, the kebab. A row that every section draws has
 * to come from one place, or the sections drift the way they already had:
 * Refinement at 44px tiles in a divided list, Research with two icon buttons
 * where the kebab goes, Archive as a table.
 *
 * `HubRow.tsx` is the component; this is the vocabulary it is drawn in. The
 * values are the Prototypes rows' exactly, so moving them here changed
 * nothing on the five sections that already wore them.
 */

/** The list is a STACK OF CARDS, not a card of rows (2026-10-27, Jillienne
 *  on the Development board: "I don't love that these items are all
 *  connected, they feel like a table, but they are actually cards"). No
 *  border, background or shadow here: each row draws its own. The gap is
 *  what says "these are separate things". */
export const hubListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

/** The card. Its own border and radius, on every row. Deliberately NOT
 *  `overflow: hidden` — the kebab's menu is absolutely positioned and would
 *  be clipped. */
export const hubRowWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 12px 14px 18px',
  border: '1px solid var(--ux-border)',
  borderRadius: 'var(--radius-lg)',
  transition: 'background 120ms, box-shadow 120ms',
}

/** The row's clickable half: thumbnail · body · tags · chevron. The kebab
 *  sits OUTSIDE it — a button nested in an anchor is invalid, and its menu
 *  would inherit the link's activation. */
export const hubRowLinkStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gap: 16,
  alignItems: 'center',
  padding: 0,
  minWidth: 0,
  color: 'inherit',
  textDecoration: 'none',
  transition: 'background 120ms',
  // The button form (a row that opens a sheet rather than a page) takes the
  // same grid; these reset what a <button> brings of its own.
  font: 'inherit',
  textAlign: 'left',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
}

export const hubBodyStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }

export const hubTitleRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }

export const hubNameStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.25,
  color: 'var(--ux-text)',
}

/* Three lines, not two: the 110px thumbnail sets the row height, and a
   title + 2 lines only fills ~62px of it. The third line uses space that was
   already being paid for, and the text column lost ~96px to the bigger tile —
   at two lines the blurbs were cutting mid-word. */
export const hubBlurbStyle: CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: 'var(--ux-text-2)',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

/** A quiet third line under the description — the one fact a row may carry
 *  that is neither its description nor a tag: a link board row's host, so
 *  two rows on one branch can be seen to be. Tertiary ink, one line. */
export const hubCaptionStyle: CSSProperties = {
  fontSize: 11.5,
  lineHeight: 1.4,
  color: 'var(--ux-text-3)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

export const hubMetaChipStyle: CSSProperties = {
  padding: '1px 8px',
  /* Hugs its own text — the fixed grid column aligns where each tag STARTS,
     it does not stretch the tag to fill it. */
  justifySelf: 'start',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  fontSize: 10.5,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

/** An outlined, square-cornered TAG — what every row wears instead of the
 *  filled pill (2026-10-14, Jillienne: "tags instead of badges, outlined,
 *  more square looking"). Same size and weight as the chip so the two never
 *  sit side by side at different scales. ⚠ `border` + `borderRadius: 4` is
 *  how the smoke test finds a tag; keep both on the element itself. */
export const hubTagStyle: CSSProperties = {
  ...hubMetaChipStyle,
  background: 'transparent',
  border: '1px solid var(--ux-border)',
  borderRadius: 4,
  fontWeight: 600,
  maxWidth: 156,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** A tag with an icon in front of its text. */
export const hubIconTagStyle: CSSProperties = {
  ...hubTagStyle,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

/** The STACK — one tag per line, wide enough for "Updated Oct 14, 8:47 PM"
 *  at the tag's own size — and, to its right when a section has one, a
 *  column for the row's status, present on every row so nothing shifts
 *  between them. */
export const HUB_TAG_COL = 156

export const hubTagStackStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `${HUB_TAG_COL}px`,
  alignItems: 'center',
  gap: 6,
}

export function hubTagAreaStyle(statusWidth?: number): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: statusWidth ? `${HUB_TAG_COL}px ${statusWidth}px` : `${HUB_TAG_COL}px`,
    alignItems: 'center',
    gap: 6,
    flex: 'none',
  }
}

/** Where the kebab would be on a row that has none. Without it the row's
 *  grid is a kebab narrower and its tags sit 40px right of the rows above —
 *  Jillienne on the preview, "have these all vertically align". */
export const HUB_KEBAB_W = 32

/** The chevron's width, kept as a spacer on a row that goes nowhere. */
export const HUB_CHEVRON_W = 15
