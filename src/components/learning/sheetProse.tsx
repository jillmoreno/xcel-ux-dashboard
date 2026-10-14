import type { ReactNode } from 'react'

/**
 * THE PROSE TREATMENT THE REFERENCE SHEETS SHARE — 2026-10-07, the direct ask
 * ("the layout for this sheet is bland… organize the chaos in a more appealing
 * way", then "do the same for How to apply and what to expect").
 *
 * Two sheets open from the same column and say the same KIND of thing — rules
 * someone has to act on, a page at a time:
 *
 *   `LearningPathDetailPanel` (Requirements) — the board's rules for the licence
 *   `GetLicensedStepPanel` (What to expect / How to apply) — one post-course step
 *
 * ⚠ THEY WERE BLAND IN THE SAME THREE WAYS, which is why this is a module and
 * not two local copies. The second ask was literally "do the same", and the
 * cheapest way to answer it twice is to have answered it once:
 *
 *   1. NO MARKERS. Requirements set `listStyle: 'none'` on purpose; the step
 *      sheet set `display: flex` on its `<ul>`, which BLOCKIFIES the `<li>`s and
 *      drops `::marker` — so its `paddingLeft: 18` had been indenting against
 *      nothing at all. One looked deliberate and one was a bug, and on screen
 *      they were indistinguishable.
 *   2. NO HANGING INDENT, so a wrapped item ran under the next one.
 *   3. THE LABEL IN "Label — detail" THROWN AWAY, though most entries in both
 *      data sets are written that way.
 *
 * ⚠ THESE ARE PRIMITIVES, NOT A LIST COMPONENT. The step sheet's bullets carry
 * links and nest one level; the requirements sheet's are flat strings. A shared
 * `<List items>` would have to grow a union to cover both, and the part actually
 * worth sharing is the ROW — marker, gap, hanging indent, lead emphasis.
 */

import {
  proseFactCellStyle,
  proseFactLabelStyle,
  proseFactTextStyle,
  proseFactValueStyle,
  proseFactsStyle,
  proseItemNestedStyle,
  proseItemStyle,
  proseLeadStyle,
  proseListStyle,
  proseMarkerNestedStyle,
  proseMarkerStyle,
  splitLead,
} from './sheetProseStyles'

/** The text of one bullet, with its lead emphasised when it has one. */
export function ProseText({ text }: { text: string }) {
  const split = splitLead(text)
  if (!split) return <>{text}</>
  return (
    <>
      <strong style={proseLeadStyle}>{split.lead}</strong>
      {/* ⚠ ALWAYS AN EM DASH, whichever delimiter the source used. The house
          separator is the dash, and re-setting a colon-delimited lead with one
          is what keeps the two sheets reading as one treatment rather than as
          two lists that happen to be bold in the same place. */}
      {` — ${split.rest}`}
    </>
  )
}

/* ─── The row ─────────────────────────────────────────────────────────── */

/**
 * One list row — marker, then content.
 *
 * ⚠ A FLEX ROW AND AN EXPLICIT SPAN RATHER THAN `list-style`, so a wrapped
 * second line starts under the TEXT instead of under the dot. That alignment is
 * most of what a bullet is actually buying on a page this long. It also means
 * the marker cannot be lost to blockification the way the step sheet's was.
 */
export function ProseItem({ children, nested }: { children: ReactNode; nested?: boolean }) {
  return (
    <li style={nested ? proseItemNestedStyle : proseItemStyle}>
      <span aria-hidden style={nested ? proseMarkerNestedStyle : proseMarkerStyle} />
      <span style={{ minWidth: 0 }}>{children}</span>
    </li>
  )
}

/** A flat list of strings — the Requirements sheet's shape. */
export function ProseList({ items }: { items: readonly string[] }) {
  return (
    <ul style={proseListStyle}>
      {items.map((item) => (
        <ProseItem key={item}>
          <ProseText text={item} />
        </ProseItem>
      ))}
    </ul>
  )
}

/* ─── The fact row ────────────────────────────────────────────────────── */

export type ProseFactItem = { label: string; value: string }

/**
 * The strip of facts at the top of a sheet — label above value, hairline
 * divided.
 *
 * ⚠ `auto-fit` BECAUSE THE COUNT VARIES. Requirements states two facts for a
 * pre-licensing path and five for a CE one; a step states between one and three
 * (who owns it, which jurisdiction, what it costs). Fixed columns would leave
 * either a gap or a cramped row depending on which sheet opened.
 *
 * ⚠ THE HAIRLINES ARE THE GRID'S OWN `gap` SHOWING THROUGH — a 1px gap over a
 * border-coloured ground, with each cell painting the card fill back. That
 * gives one rule per boundary however the row wraps, which a border on each
 * cell cannot: it doubles them, and leaves a stray edge where the row breaks.
 *
 * ⚠ IT TAKES THE FACTS AS DATA, NOT AS CHILDREN, and that is not a style
 * preference — the row has to size itself as a ROW. The two sheets put
 * different KINDS of thing in this slot: Requirements states figures ("40",
 * "05/28/2026") which want to be the loudest thing in the cell, a step states
 * phrases ("NY Dept. of Financial Services") which break over three lines at
 * that size. Deciding per cell put "PSI" at 16px beside "New York licence" at
 * 13px in the same row, which read as a rendering fault. One measurement over
 * all of them cannot do that, and a parent cannot take one measurement of
 * children it has been handed as elements.
 *
 * ⚠ A LENGTH TEST RATHER THAN A PROP, because it is not a decision a call site
 * should be making: the author of a fact knows what it SAYS, not how wide the
 * cell it lands in will be — and on an `auto-fit` row that width is not
 * knowable at the call site anyway. 12 sits above every figure either sheet
 * states (the longest is a 10-character date) and below every phrase.
 */
export function ProseFacts({ facts }: { facts: readonly ProseFactItem[] }) {
  const valueStyle = facts.some((f) => f.value.length > 12)
    ? proseFactTextStyle
    : proseFactValueStyle
  return (
    <dl style={proseFactsStyle}>
      {facts.map((f) => (
        /* ⚠ A `<div>` INSIDE THE `<dl>`, which HTML5 allows and which is the
           only way to group a term with its description as ONE grid cell —
           bare `dt`/`dd` pairs would each take a cell and the row would read
           label, label, value, value. */
        <div key={f.label} style={proseFactCellStyle}>
          <dt style={proseFactLabelStyle}>{f.label}</dt>
          <dd style={valueStyle}>{f.value}</dd>
        </div>
      ))}
    </dl>
  )
}
