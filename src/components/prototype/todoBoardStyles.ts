/**
 * The To Do Board's styles, in one module because three files draw them —
 * the panel, the New card sheet and the Manage people sheet — and a near-copy
 * is how two surfaces of one feature end up a few pixels and one font weight
 * apart. Same reason `SheetHeader` and `SHEET_BODY` were extracted.
 *
 * ── Two things worth knowing before editing any of this ─────────────────────
 *
 * 1. EVERY COLOUR IS A `--ux-*` CUSTOM PROPERTY, the gateway page's own
 *    palette, not the brand tokens. That is what makes the board re-skin with
 *    the four schemes and four appearances, like `LinksPanel` and `TodoPanel`
 *    beside it. A brand token here would draw the product's navy inside a
 *    green page. The only literals are geometry.
 *
 * 2. THE BOARD ITSELF IS A NEW PATTERN. The Dashboard has no kanban: no
 *    column, no draggable card, no drop target — `reference/gaps.md` in the
 *    dashboard-house-style skill names drag-and-drop as a known gap, and it
 *    still is. These are built from the same semantic tokens as everything
 *    else on the page rather than borrowed from a component that does not
 *    exist. The card geometry follows the concept mock
 *    (`todo-board-concept.html`) — 8px between cards, 16px between columns —
 *    except for the column WIDTH, which the concept fixed at 258px and this
 *    shares out instead. See `boardStyle`.
 *
 * A non-component module, so fast refresh keeps working.
 */
import type { CSSProperties } from 'react'

/* ── page-level chrome ────────────────────────────────────────────────────── */

/**
 * The actions sit on the FILTER ROW, pushed right (2026-10-15, Jillienne) —
 * there is no toolbar line of its own any more. One row of chrome over the
 * board instead of two: who you are looking at on the left, what you can add
 * on the right. `marginLeft: auto` is the whole of it; the row already wraps,
 * so a long roster drops the actions to a second line rather than squashing
 * them.
 */
export const filterActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginLeft: 'auto',
}

export const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 13px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

export const primaryBtnStyle: CSSProperties = {
  ...btnStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

/** Manage people is the ICON ALONE (2026-10-15) — the roster is edited
 *  rarely, and a worded button beside the primary one gave two equal-looking
 *  CTAs to a surface whose primary act is adding a card. Square, so it reads
 *  as a tool rather than as a second CTA with a missing word; the accessible
 *  name stays "Manage people", and so does the tooltip. */
export const iconBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

export const countStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--ux-text-3)',
}

export const noticeStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.6,
}

/* ── the owner filter row ─────────────────────────────────────────────────── */

/** The avatars themselves, inside the row — their own group so the actions
 *  pushed to the right are not announced as part of "Filter by owner". */
export const filterGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

export const filterRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 16,
}

/**
 * One filter avatar.
 *
 * The selected state is a RING plus a surface change, never colour alone:
 * every avatar is already a different colour, so a tint would be a fifth
 * colour among five and say nothing. `aria-pressed` carries the same fact to
 * anything not looking at the picture.
 */
export function filterAvatarStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 10px 4px 4px',
    borderRadius: 999,
    border: '1px solid',
    borderColor: active ? 'var(--ux-accent)' : 'var(--ux-border)',
    background: active ? 'var(--ux-accent-soft)' : 'var(--ux-card)',
    boxShadow: active ? '0 0 0 2px var(--ux-accent)' : 'none',
    color: active ? 'var(--ux-text)' : 'var(--ux-text-2)',
    font: 'inherit',
    fontSize: 12.5,
    fontWeight: active ? 700 : 600,
    cursor: 'pointer',
  }
}

/* ── the board ────────────────────────────────────────────────────────────── */

/**
 * The board is a GRID of four equal columns, not a row of fixed-width ones.
 *
 * It was `flex` with `flex: 0 0 258px` per column, copied from the concept —
 * and 4 × 258 + gaps is 1080, which is exactly the page's own reading width
 * BEFORE its 32px padding, so the fourth column always sat behind a
 * horizontal scrollbar. Scrolling sideways to see a column is the one thing a
 * board must not ask for: "what is in Ready for Handoff?" is the question it
 * exists to answer at a glance. The columns share whatever width there is
 * (`minmax(0, 1fr)` — the `0` matters, `1fr` alone refuses to shrink below
 * its content and the scrollbar comes back), and the section's `<main>` drops
 * its 1080 cap (`mainWideStyle` in `UxDashboardPage.tsx`) so there is more of
 * it to share.
 *
 * ⚠ AND THERE IS NO `overflow-x` HERE, WHICH IS LOAD-BEARING. A scrolling
 * wrapper stood here for one commit. CSS has no way to scroll one axis and
 * overflow the other — `overflow-x: auto` computes `overflow-y: auto` too —
 * so it became a clipping box, and the card kebab's menu was cut off at the
 * bottom edge of the board by the scrollbar it had created. Narrow windows
 * squeeze the columns instead; that is the cheaper failure, and this board is
 * not a phone surface.
 */
export const boardStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 16,
  alignItems: 'start',
  paddingBottom: 12,
}

/** The drop target. `dragOver` is the only visual difference, and it is a
 *  surface change rather than a border one so the column does not resize
 *  under the cursor mid-drag. */
export function columnStyle(dragOver: boolean): CSSProperties {
  return {
    // No width of its own: the grid track is the width. See `boardStyle`.
    minWidth: 0,
    background: dragOver ? 'var(--ux-accent-soft)' : 'var(--ux-bg)',
    border: '1px solid',
    borderColor: dragOver ? 'var(--ux-accent)' : 'var(--ux-border)',
    borderRadius: 12,
    padding: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    /* Tall by default (2026-10-15, Jillienne): an empty column was 140px of
       nothing, the board read as a strip rather than as a board, and a card
       near the bottom opened its menu into the page below it. The height is a
       floor, not a cap — a column with more cards is as tall as it needs. */
    minHeight: 320,
  }
}

export const columnHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '2px 4px 0',
}

export const columnTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-2)',
}

export const columnCountStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 20,
  height: 20,
  padding: '0 6px',
  borderRadius: 999,
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  fontSize: 11,
  fontWeight: 700,
}

/** The "Auto-assigns to Jillienne" line. It is the only place the rule is
 *  visible on the board, so it is a standing label rather than something that
 *  appears once a card lands. */
export const columnNoteStyle: CSSProperties = {
  margin: 0,
  padding: '0 4px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ux-accent)',
}

export const cardsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minHeight: 8,
}

/** A card. `dragging` dims the original while it is in flight; `dropBefore`
 *  draws the insertion line above it — the same inset-shadow trick
 *  `TodoPanel` uses for its own drag-to-rank, so the two feel alike. */
export function cardStyle(dragging: boolean, dropBefore: boolean): CSSProperties {
  return {
    position: 'relative',
    padding: '10px 10px 8px',
    borderRadius: 10,
    border: '1px solid var(--ux-border)',
    background: 'var(--ux-card)',
    opacity: dragging ? 0.4 : 1,
    boxShadow: dropBefore ? 'inset 0 3px 0 0 var(--ux-accent)' : 'none',
  }
}

/**
 * The card kebab.
 *
 * `ActionMenu`'s own trigger is `--color-secondary-500` — the product's
 * amber, which on this page is a brand colour that belongs to nothing and
 * read as a warning sitting on every card. A muted grey is what a control
 * that is always present and rarely used should look like; it takes the
 * palette's tertiary text, so it stays muted in all four appearances rather
 * than being a grey that only works on white.
 */
export const kebabTriggerStyle: CSSProperties = { color: 'var(--ux-text-3)' }

export const kebabTriggerHover = { background: 'var(--ux-chip)' }

export const cardTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 6,
}

/** The grip is what is draggable, NOT the card: a draggable card wrapping a
 *  `<select>` means every attempt to open the owner control starts a drag
 *  instead. The same split `TodoPanel` landed on, and the kebab beside it is
 *  the keyboard equivalent. */
export const gripStyle: CSSProperties = {
  cursor: 'grab',
  color: 'var(--ux-text-3)',
  fontSize: 13,
  lineHeight: '18px',
  padding: '0 2px',
  flex: 'none',
}

export const cardTitleStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  margin: 0,
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
  color: 'var(--ux-text)',
}

export const cardNoteStyle: CSSProperties = {
  margin: '6px 0 10px',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--ux-text-2)',
}

export const cardMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
}

/**
 * The reassign control.
 *
 * Looks like plain text until it is hovered or focused, so it does not read
 * as a form field parked inside a card — but it IS a native `<select>`, so it
 * is keyboard-reachable and announced without anything being re-implemented.
 */
export const ownerSelectStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  font: 'inherit',
  fontSize: 11.5,
  fontWeight: 600,
  padding: '2px 4px',
  borderRadius: 6,
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

export const ownerSelectHoverStyle: CSSProperties = {
  borderColor: 'var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
}

/** The "Add a card" affordance — drawn on the To Do column ONLY (see the
 *  call site). Dashed and quiet: it is the second way to do what the primary
 *  "+ New" above the board already does, not a second CTA. */
export const addCardStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  padding: '7px 6px',
  border: '1px dashed var(--ux-border)',
  borderRadius: 8,
  background: 'transparent',
  color: 'var(--ux-text-3)',
  font: 'inherit',
  fontSize: 12.5,
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
}

export const emptyColumnStyle: CSSProperties = {
  margin: 0,
  padding: '10px 6px',
  fontSize: 12,
  color: 'var(--ux-text-3)',
}

/* ── the sheets ───────────────────────────────────────────────────────────── */

/**
 * Sheet chrome, following the slide-over convention this codebase already
 * uses (`AddCustomEventPanel`, `CreateCalendarPanel`): Close top-LEFT, then
 * the title, a divider, the scrolling body, and a footer band whose PRIMARY
 * action is on the left.
 *
 * Deliberately not `SheetHeader`, which puts its close button top-right —
 * that is the product shell's header, and this is the slide-over form
 * pattern. Both exist; this is the one the brief and the concept describe.
 */
export const sheetHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '18px 20px 14px',
  flexShrink: 0,
}

export const sheetCloseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  alignSelf: 'flex-start',
  padding: '4px 6px 4px 0',
  border: 'none',
  background: 'transparent',
  color: 'var(--ux-text-2)',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

export const sheetTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--ux-text)',
}

export const sheetDescStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--ux-text-3)',
}

export const sheetDividerStyle: CSSProperties = {
  height: 1,
  background: 'var(--ux-border)',
  flexShrink: 0,
}

export const sheetBodyStyle: CSSProperties = {
  padding: '16px 20px 24px',
  overflowY: 'auto',
  flex: 1,
  minHeight: 0,
}

export const sheetFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 20px',
  borderTop: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  flexShrink: 0,
}

/* ── fields ───────────────────────────────────────────────────────────────── */

export const fieldWrapStyle: CSSProperties = { marginBottom: 14 }

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
  marginBottom: 5,
}

export const fieldStyle: CSSProperties = {
  width: '100%',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.5,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
}

export const textareaStyle: CSSProperties = {
  ...fieldStyle,
  minHeight: 88,
  resize: 'vertical',
}

/** The note that replaces the Owner field in the handoff column. */
export const formNoteStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-accent)',
  background: 'var(--ux-accent-soft)',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.5,
}

export const errorStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.6,
}

/* ── Manage people ────────────────────────────────────────────────────────── */

export const peopleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 0',
  borderBottom: '1px solid var(--ux-border)',
}

export const peopleNameStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--ux-text)',
}

export const peopleMetaStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--ux-text-3)',
}

export const linkBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '4px 2px',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ux-accent)',
  cursor: 'pointer',
}

export const addPersonRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 10,
  marginTop: 18,
}
