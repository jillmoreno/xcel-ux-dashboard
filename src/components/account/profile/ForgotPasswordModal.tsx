import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { X } from '@/icons'
import { looksLikeEmail } from '@/data/inviteFlows'
import '@/pages/inviteFlow.css'

/**
 * FORGOT PASSWORD?, FROM UPDATE PASSWORD (2026-11-20, Afsana). The invite
 * flow V3's two reset screens — "Reset your password" (enter email) and
 * "Check your email" — copied from `LoginStep` in `VerifyEmailModalV3` on
 * `feat/invite-flow-v3`, words and layout as they are there, with ONE change:
 * the buttons are Atlas's (`ui/Button`, `--color-action`), not the checkout's
 * brick. A copy, so it will not follow V3's later edits.
 *
 * What is NOT brought over: the demo fill corner, and the click-through to
 * `ResetPasswordPageV3` (that page lives on the invite branch).
 *
 * NO "BACK TO SIGN IN" (2026-11-20, Afsana). V3 has it on both steps; here the
 * learner is already signed in to Atlas and only wants to change their
 * password, so there is no sign-in to go back to. The ✕ (and Escape) is the
 * way out, back to Update Password.
 *
 * It sits over the Sheet, so it takes Escape first (a window capture
 * listener) — otherwise one key would close the modal and the panel under it.
 */
export function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [linkWait, setLinkWait] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  /* Resend link waits after every send, the first included — V3's rule. */
  useEffect(() => {
    if (linkWait <= 0) return
    const t = window.setTimeout(() => setLinkWait((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [linkWait])
  const canResend = linkWait <= 0

  const valid = looksLikeEmail(email)
  const badEmail = email.trim() !== '' && !valid

  return createPortal(
    /* `cre-account-actions` is what makes `--color-action` Atlas's blue on the
       Profile surface (tokens.css). Portalled to <body>, the modal is outside
       the panel's copy of it, so it opts in itself — without it the buttons
       come out the XCEL brick. */
    <div className="cre-account-actions" style={SCRIM}>
      <div role="dialog" aria-modal="true" aria-labelledby="forgot-password-title" style={MODAL}>
        {/* ✕ on both steps (2026-11-20, Afsana) — V3's modals have none. */}
        <button type="button" aria-label="Close" style={CLOSE} onClick={onClose}>
          <X size={18} aria-hidden />
        </button>
        {sent ? (
          <div style={BODY}>
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
            <div style={HEAD}>
              <h2 id="forgot-password-title" style={TITLE}>
                Check your email
              </h2>
              <div aria-hidden style={RULE} />
              <p style={LEAD}>
                We sent a password reset link to <strong style={{ fontWeight: 800 }}>{email.trim()}</strong>. Follow
                the instructions in the email to reset your password. Be sure to check your spam or junk folders.
              </p>
            </div>
            <div style={ACTIONS}>
              <Button
                variant="primary"
                disabled={!canResend}
                aria-disabled={!canResend}
                style={CTA}
                onClick={() => setLinkWait(RESEND_LINK_AFTER_S)}
              >
                Resend link
              </Button>
              {canResend ? null : (
                <p role="timer" aria-live="off" style={NOTE}>
                  You can resend the link in {formatCountdown(linkWait)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <form
            style={BODY}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              setSent(true)
              setLinkWait(RESEND_LINK_AFTER_S)
            }}
          >
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
            <div style={HEAD}>
              <h2 id="forgot-password-title" style={TITLE}>
                Reset your password
              </h2>
              <div aria-hidden style={RULE} />
              <p style={LEAD}>Enter your email and we’ll send you a link to reset your password.</p>
            </div>
            <div style={FIELD_AND_ERROR}>
              <label htmlFor="forgot-password-email" style={FIELD_GROUP}>
                <span style={FIELD_LABEL}>
                  Email <span aria-hidden>*</span>
                </span>
                <input
                  ref={inputRef}
                  id="forgot-password-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={badEmail}
                  aria-describedby={badEmail ? 'forgot-password-invalid' : undefined}
                  className="cre-e2e-input cre-e2e-input-v3"
                  style={FIELD}
                />
              </label>
              {badEmail ? (
                <p id="forgot-password-invalid" role="alert" style={INVALID}>
                  Please enter a valid email address
                </p>
              ) : null}
            </div>
            <div style={ACTIONS}>
              <Button type="submit" variant="primary" disabled={!valid} aria-disabled={!valid} style={CTA}>
                Send reset link
              </Button>
              <hr aria-hidden style={FORGOT_EMAIL_RULE} />
              <div style={FORGOT_EMAIL}>
                <h3 style={FORGOT_EMAIL_TITLE}>Forgot Email?</h3>
                <p style={FORGOT_EMAIL_TEXT}>
                  If you no longer have access to the email on file or have forgotten which one you used, please
                  contact our support team.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}

/* V3's demo wait (`RESEND_LINK_AFTER_S`); the real one is Keycloak's. */
const RESEND_LINK_AFTER_S = 30

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/* ─── Styles: V3's, verbatim, except the buttons ───────────────────────── */

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

const MODAL: CSSProperties = {
  boxSizing: 'border-box',
  position: 'relative',
  width: 460,
  maxWidth: 'calc(100vw - 48px)',
  maxHeight: '100%',
  overflowY: 'auto',
  padding: '36px 36px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  borderRadius: 8,
}

const CLOSE: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  padding: 0,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const BODY: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20, width: '100%', margin: 0 }

const LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain', alignSelf: 'center' }

const HEAD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 22,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const RULE: CSSProperties = { width: '22%', height: 2, borderRadius: 1, background: '#dcdcdc', margin: '2px 0 4px' }

const LEAD: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const FIELD_AND_ERROR: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const FIELD_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

const FIELD: CSSProperties = {
  boxSizing: 'border-box',
  display: 'block',
  width: '100%',
  height: 38,
  padding: '0 10px',
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-e2e-card-outline)',
}

const INVALID: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-error-600)',
}

const NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const FORGOT_EMAIL_RULE: CSSProperties = {
  alignSelf: 'stretch',
  height: 0,
  margin: '4px 0',
  border: 'none',
  borderTop: '1px solid var(--color-e2e-form-outline)',
}

const FORGOT_EMAIL: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }

const FORGOT_EMAIL_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const FORGOT_EMAIL_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const ACTIONS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 14,
  paddingTop: 4,
}

/* V3's button SHAPE — full width, 12×26, Avenir 800 at 15 — on Atlas's
   `Button`, which brings the colours: `--color-action` fill for primary, an
   action-coloured outline for secondary, and Atlas's grey when disabled. */
const CTA: CSSProperties = {
  alignSelf: 'stretch',
  width: '100%',
  height: 'auto',
  boxSizing: 'border-box',
  padding: '12px 26px',
  borderRadius: 3,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  lineHeight: 'normal',
  letterSpacing: '0.02em',
}
