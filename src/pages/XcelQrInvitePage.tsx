import type { CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QrCodeArt } from '@/components/e2e/QrCodeArt'
import { E2E_PARTNER_NAME, useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * THE PARTNER'S QR SHARE CARD — 2026-10-23, Jillienne: "lets start on the QR
 * code - this would be page one (built in a iphone view)".
 *
 * ⚠ THIS IS THE PARTNER'S SCREEN, NOT THE LEARNER'S, and that is what the two
 * buttons give away: Share and Save to Photos are things a recruiter does with
 * a code, not things a prospective student does. A branch manager at Sunrise
 * Bank opens this on their phone and holds it up, or drops the image into a
 * post. The learner's side of this flow starts when they SCAN it.
 *
 * ⚠ SO THE WALK HAS A HAND-OFF IN THE MIDDLE OF IT, which no other arm has.
 * The three invited flows begin with something addressed to the learner; this
 * one begins with something addressed to nobody in particular, held by someone
 * else. The demo marks that crossing explicitly rather than pretending the
 * reviewer's click is a scan.
 *
 * ⚠ A PHONE DRAWN ON THE PAGE, not the device toggle. Mobile is disabled
 * repo-wide in `DeviceFrameContext` ("these viewports aren't responsive yet")
 * and re-enabling it for one screen would change the frame for every other
 * page in the demo. The flow already draws its own chrome — the invite pages
 * put a browser window around themselves — so this draws a handset the same
 * way.
 */
export function XcelQrInvitePage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Share your invite code | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()

  /* ⚠ THE SCAN IS THE ONLY WAY FORWARD, and a reviewer at a laptop cannot
     perform one — so the demo performs it for them, marked as the demo doing
     it. The same corner affordance the split confirmation uses for "Go to
     Email": the product has no such button, and the page says so rather than
     growing a control that would have to be explained away later. */
  const scan = () =>
    navigate({ pathname: '/end-to-end-demo', search: params.toString() })

  return (
    <div style={PAGE}>
      <div style={PHONE}>
        <div style={SCREEN}>
          <div style={LOGO_PILL}>
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
          </div>

          <div style={HEADINGS}>
            <h1 style={TITLE}>Scan to start your licensing course</h1>
            {/* ⚠ THE PARTNER AND THE BRANCH, because a QR code on a counter is
                attributed to a PLACE. It is what tells the learner why this
                code is in front of them, and it is the attribution the
                discount downstream rests on. */}
            <p style={SUBTITLE}>
              {E2E_PARTNER_NAME} · {PARTNER_OFFICE}
            </p>
          </div>

          <div style={QR_CARD}>
            <QrCodeArt value={INVITE_URL} size={228} />
          </div>

          {/* ⚠ THE URL IS PRINTED UNDER THE CODE, which is not decoration: a
              code nobody can scan — a bad camera, a printed sheet, a screen
              reader — still has to be reachable, and this is the whole of the
              fallback. */}
          <p style={URL_LINE}>{INVITE_URL}</p>

          <div style={ACTIONS}>
            {/* ⚠ NEITHER BUTTON IS WIRED, and both say so on hover. They are
                the partner's real actions — the share sheet and the camera
                roll are the phone's, not the product's — so building them here
                would be mocking the operating system. */}
            <button type="button" style={SHARE} title="Not wired in this prototype">
              Share
            </button>
            <button type="button" style={SAVE} title="Not wired in this prototype">
              Save to Photos
            </button>
          </div>
        </div>
      </div>

      <button type="button" style={DEMO_CTA} onClick={scan}>
        <span style={DEMO_TAG}>Demo</span>
        Scan the code
      </button>
    </div>
  )
}

/* The invite's own address. One code for the demo — a real build mints one per
   partner, and the last segment is what carries the attribution. */
const PARTNER_OFFICE = 'Tampa Office'
const INVITE_URL = 'www.xcelsolutions.com/invite/A3DSDF'

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* ⚠ `flex: 1`, NOT `minHeight: 100vh`. These pages render inside the Demo
   frame, which already spends ~115px on its two control bars — a page
   demanding a full viewport underneath them is a page that always scrolls,
   and this one has its only two controls at the bottom of a tall handset. The
   other e2e pages size this way for the same reason. */
const PAGE: CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: 0,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '28px 24px',
  background: 'var(--color-neutral-100)',
}

/* A handset: 390 wide — the same iPhone width `DEVICE_WIDTHS` uses, so this
   screen and the disabled Mobile frame would agree if it is ever turned on. */
const PHONE: CSSProperties = {
  position: 'relative',
  width: 390,
  maxWidth: '100%',
  boxSizing: 'border-box',
  padding: 10,
  borderRadius: 54,
  background: 'var(--color-neutral-950)',
  boxShadow: '0 18px 48px var(--color-e2e-form-shadow)',
}

const SCREEN: CSSProperties = {
  boxSizing: 'border-box',
  /* ⚠ A HANDSET'S PROPORTIONS WHERE THERE IS ROOM, and it gives way where
     there is not. 760 is the screen height that reads as a phone beside its
     390 width; inside the Demo frame on a laptop the stage is shorter than
     that, and a fixed height would have put the two buttons — the only
     controls on the page — below the fold on the machine most reviewers use.
     The column already pins its actions with `margin-top: auto`, so it
     compresses from the middle rather than clipping.

     ⚠ 290 IS THE DEMO FRAME'S OVERHEAD, measured rather than guessed: the two
     control bars, the stage's own window chrome and this page's padding come
     to roughly that between the top of the viewport and the top of the
     handset. On a full-height display the clamp never bites and the phone
     keeps its 390 × 760. */
  minHeight: 'min(760px, calc(100dvh - 290px))',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  padding: '52px 28px 28px',
  borderRadius: 44,
  background: 'var(--color-e2e-qr-ground)',
  overflow: 'hidden',
}

const LOGO_PILL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 18px',
  borderRadius: 999,
  background: 'var(--color-fixed-light)',
}

const LOGO: CSSProperties = { display: 'block', width: 92, height: 28, objectFit: 'contain' }

const HEADINGS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: '34px',
  color: 'var(--color-fixed-light)',
}

const SUBTITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'color-mix(in srgb, var(--color-fixed-light) 82%, transparent)',
}

const QR_CARD: CSSProperties = {
  marginTop: 6,
  padding: 26,
  borderRadius: 18,
  background: 'var(--color-fixed-light)',
}

const URL_LINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12.5,
  lineHeight: '18px',
  letterSpacing: '0.01em',
  color: 'color-mix(in srgb, var(--color-fixed-light) 72%, transparent)',
}

/* Pinned to the bottom of the handset, where a phone's own actions sit. */
const ACTIONS: CSSProperties = {
  marginTop: 'auto',
  display: 'flex',
  gap: 12,
  width: '100%',
}

const ACTION_BASE: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  padding: '15px 12px',
  borderRadius: 999,
  border: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}

const SHARE: CSSProperties = {
  ...ACTION_BASE,
  background: 'var(--color-fixed-light)',
  color: 'var(--color-neutral-950)',
}

/* ⚠ QUIETER, NOT DISABLED. Saving an image is a smaller act than sharing one,
   and the design ranks them — but a greyed-out control would say the phone
   cannot do it. */
const SAVE: CSSProperties = {
  ...ACTION_BASE,
  background: 'color-mix(in srgb, var(--color-fixed-light) 20%, transparent)',
  color: 'var(--color-fixed-light)',
}

/* The demo's own way across the hand-off — bottom right, marked, and in
   neither of the page's registers so it cannot be read as product. */
const DEMO_CTA: CSSProperties = {
  position: 'absolute',
  right: 24,
  bottom: 24,
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
