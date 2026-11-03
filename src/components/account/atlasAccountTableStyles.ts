import type { CSSProperties } from 'react'

/*
 * THE ADMIN'S TABLE, ON THE LEARNER'S ACCOUNT PAGES — 2026-11-03, Eric's
 * request: "take the table styles from the admin side and apply them to any
 * table styles on the learner side". Measured off Atlas Admin's Invites table
 * (`AtlasAdminInvitesPage`, `TABLE_HEAD` in adminStyles.ts) and spelled with
 * the same `--admin-*` tokens, which tokens.css defines on `:root`, so the two
 * sides cannot drift by value.
 *
 * Read only under `useAtlasAccountPages` — Transcripts and My Purchases keep
 * their own tables everywhere else.
 */

/* The card: a 1px rule, the containers' corner, white, clipped. */
export const ATLAS_TABLE_CARD: CSSProperties = {
  border: '1px solid var(--admin-rule)',
  borderRadius: 'var(--atlas-card-radius, 18px)',
  background: 'var(--admin-surface)',
  overflow: 'hidden',
}
/* The header row's soft fill. */
export const ATLAS_THEAD: CSSProperties = { background: 'var(--admin-fill-soft)' }
/* A column title: 11 / 14, bold, uppercase, 0.08em, Muted, 12 in (20 on the first). */
export const ATLAS_TH: CSSProperties = {
  /* Longhands, not `padding` — the first cell's paddingLeft overrides one, and React warns when a shorthand and its longhand mix. */
  paddingTop: 12,
  paddingRight: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--admin-muted)',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  textAlign: 'left',
  background: 'transparent',
  borderBottom: 'none',
}
/* A body cell: 13 / 19.5 in Text, 12 in (20 on the first), a 1px rule above each row. */
export const ATLAS_TD: CSSProperties = {
  paddingTop: 12,
  paddingRight: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  fontWeight: 400,
  color: 'var(--admin-text)',
  verticalAlign: 'middle',
  textAlign: 'left',
  borderTop: '1px solid var(--admin-rule)',
  borderBottom: 'none',
}
export const ATLAS_FIRST_CELL: CSSProperties = { paddingLeft: 20 }
/* The row's lead cell — a name, a course — 13 semibold in Ink. */
export const ATLAS_NAME_CELL: CSSProperties = { fontWeight: 600, color: 'var(--admin-ink)' }

/* The admin table header's filter pills: 13 semibold capsules, 6 × 12 — Brand
   with white when on, white with a 1px inset rule when off. */
export const ATLAS_FILTER_PILL: CSSProperties = {
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  border: 'none',
  padding: '6px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19.5px',
  fontWeight: 600,
  background: 'var(--admin-surface)',
  color: 'var(--admin-text)',
  boxShadow: 'inset 0 0 0 1px var(--admin-rule)',
  cursor: 'pointer',
}
export const ATLAS_FILTER_PILL_ON: CSSProperties = {
  ...ATLAS_FILTER_PILL,
  background: 'var(--admin-brand)',
  color: 'var(--admin-surface)',
  boxShadow: 'none',
}
