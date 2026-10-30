import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QrCodeArt } from '@/components/e2e/QrCodeArt'
import { useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * INVITE FLOW V3 — the QR code (`/end-to-end-demo/qr`), step 1 of every B2B
 * flow. 2026-10-30, from Afsana's `xcel-b2b2c-email-flow.html` (screen `qr`).
 *
 * The code alone on a plain page — no handset, no Share or Save to Photos.
 * V1/V2 keep `XcelQrInvitePage`, the partner's phone share card.
 *
 * Scanning goes to step 2, "Select your state and line of authority", which is
 * the product page's asking state (`InvitedProductDetailPageV3`). The code
 * itself is clickable too, as in the file.
 */
export function XcelQrInvitePageV3() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Share your invite code | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const scan = () => navigate({ pathname: '/end-to-end-demo', search: params.toString() })

  return (
    <div style={PAGE}>
      <button type="button" aria-label={`QR code for ${INVITE_URL}`} onClick={scan} style={QR_CARD}>
        <QrCodeArt value={INVITE_URL} size={280} />
      </button>
      <button type="button" style={DEMO_CTA} onClick={scan}>
        <span style={DEMO_TAG}>Demo</span>
        Scan the code
      </button>
    </div>
  )
}

const INVITE_URL = 'www.xcelsolutions.com/invite/A3DSDF'

const PAGE: CSSProperties = {
  position: 'relative',
  flex: '1 1 0%',
  minHeight: 640,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-neutral-75)',
}

const QR_CARD: CSSProperties = {
  padding: 28,
  border: 'none',
  borderRadius: 16,
  background: '#fff',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  cursor: 'pointer',
}

const DEMO_CTA: CSSProperties = {
  position: 'absolute',
  right: 24,
  bottom: 24,
  zIndex: 5,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 14px',
  borderRadius: 999,
  border: '1px dashed var(--color-neutral-400)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const DEMO_TAG: CSSProperties = {
  padding: '2px 6px',
  borderRadius: 4,
  background: 'var(--color-neutral-100)',
  fontWeight: 800,
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
