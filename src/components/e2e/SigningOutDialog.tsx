import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { XcelLoadingStatus } from '@/components/e2e/XcelLoadingStatus'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'

/**
 * "SIGNING YOU OUT" — Invite Flow V3, 2026-11-02, Afsana. A learner signed in
 * to an existing XCEL account whose cart holds the targeted SKUs is signed out
 * at Checkout and goes on as a guest. Above the spinner, one line saying why;
 * below it, "Signing you out".
 *
 * It only draws the held moment. The cart owns the timer and what follows —
 * the sign-out and the Partner Code question.
 */
export function SigningOutDialog() {
  const layer = useV3DialogLayer()
  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }}>
      <div role="dialog" aria-modal="true" aria-label="Signing you out" style={{ ...CARD, ...layer.card }}>
        <p role="note" style={NOTICE}>
          To support an ongoing platform update, we need to sign you out.
        </p>
        <XcelLoadingStatus message="Signing you out" />
      </div>
    </div>,
    document.body,
  )
}

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-e2e-scrim)',
}

/* 460, as every V3 dialog (the file's stylesheet). */
const CARD: CSSProperties = {
  boxSizing: 'border-box',
  width: 460,
  maxWidth: 'calc(100vw - 48px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 32,
  padding: '32px 32px 44px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  borderRadius: 8,
}

const NOTICE: CSSProperties = {
  alignSelf: 'stretch',
  margin: 0,
  padding: '12px 14px',
  borderRadius: 6,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-neutral-75)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  /* Left-aligned (2026-11-03, Afsana) — it was centred under nothing. */
  textAlign: 'left',
}
