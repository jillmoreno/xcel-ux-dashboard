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
