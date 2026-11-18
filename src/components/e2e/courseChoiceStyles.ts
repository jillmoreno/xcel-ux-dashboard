import type { CSSProperties } from 'react'

/* ── Styles — the QR step's, moved here from `InvitedProductDetailPageV3`,
      which imports the ones its Change your course dialog shares ────────── */

export const CHOOSE_CARD: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 28,
  borderRadius: 8,
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  width: 560,
  maxWidth: '100%',
}

export const CHOOSE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

export const CHOOSE_RULE: CSSProperties = {
  width: '22%',
  height: 2,
  borderRadius: 1,
  background: '#dcdcdc',
  margin: '2px 0 4px',
}

export const CHOOSE_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  /* 16, up from 14 (2026-11-18, Afsana). */
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

export const GATE_ON: CSSProperties = {
  padding: '12px 26px',
  borderRadius: 6,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  alignSelf: 'stretch',
}

export const GATE_OFF: CSSProperties = {
  ...GATE_ON,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}
