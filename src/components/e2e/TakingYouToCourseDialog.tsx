import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { XcelLoadingStatus } from '@/components/e2e/XcelLoadingStatus'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'

/**
 * "TAKING YOU TO YOUR COURSE" — Invite Flow V3, 2026-11-05, Afsana. Where
 * Start Course and Confirm end the flow: the XCEL logo over the
 * spinner, loading for as long as it is open. There is no course to land in,
 * so it never hands off; for the demo, a click outside the card closes it and
 * leaves the reviewer on the page they came from.
 */
export function TakingYouToCourseDialog({ onClose }: { onClose: () => void }) {
  const layer = useV3DialogLayer()
  return createPortal(
    <div
      style={{ ...SCRIM, ...layer.scrim }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Taking you to your course" style={{ ...CARD, ...layer.card }}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
        {/* 48, as Signing you in / out. */}
        <XcelLoadingStatus message="Taking you to your course" size={48} />
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

/* 460, as every V3 dialog; the padding is Signing you in's. */
const CARD: CSSProperties = {
  boxSizing: 'border-box',
  width: 460,
  maxWidth: 'calc(100vw - 48px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
  padding: '32px 32px 44px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  borderRadius: 8,
}

/* The email check's size (`CODE_LOGO` in `VerifyEmailModalV3`). */
const LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain' }
