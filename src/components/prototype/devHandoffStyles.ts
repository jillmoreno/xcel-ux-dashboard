import type { CSSProperties } from 'react'

/* Shared styling for the Dev handoff notes — used by the gateway
 * (`PrototypeFeaturePage`) and the per-component detail screen
 * (`PrototypeHandoffDetailPage`). Kept in a styles-only module so the
 * component file can export components exclusively (react-refresh). */

export const handoffSubheadingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

export const detailListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

export const detailItemStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: '20px',
}

export const pointerLocationStyle: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-tertiary)',
  wordBreak: 'break-word',
}

/* ─────────────────────────────────────────────────────────────────────────
 *  ONE TYPE SCALE FOR THE HANDOFF BODIES (2026-10-21, Jillienne: "can we make
 *  this font layout consistent?").
 *
 *  The States / Options / Flows sections had grown four text sizes between
 *  them — 14, 13, 12 and a 10px label — plus a MONOSPACE `when` line. The mono
 *  was deliberate once: `when` used to hold prop expressions (`initialLevel={0}`,
 *  `percent <= 0`) and setting code as code was right. It stopped being right
 *  the day those became sentences, and nothing went back for it, so a row read
 *  in three faces.
 *
 *  Three roles, and everything in those sections uses one of them. 13/20 is
 *  not a new number — it is `detailItemStyle`, what the rest of the handoff
 *  has always set prose in.
 * ───────────────────────────────────────────────────────────────────────── */

/** A row's name — a variant, an option, a flow. */
export const handoffRowNameStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

/** Body prose. The one size everything readable is set in. */
export const handoffProseStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

/** Prose that qualifies rather than states — a trigger condition, a footnote
 *  on a flow step. Same metrics as `handoffProseStyle`; only the colour steps
 *  back, so a row still reads as one column of text. */
export const handoffMetaStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-tertiary)',
}

/** Every small-caps label on the page — the block headings, "How to see it",
 *  and the first-match-wins note over a decision rail. */
export const handoffEyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}
