import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import {
  VERIFICATION_CODE_LENGTH,
  codeComplete,
  type VerifiedIdentity,
} from '@/data/inviteVerification'
import { looksLikeEmail } from '@/data/inviteFlows'
import { E2E_LEARNER_EMAIL } from '@/pages/endToEndDemo'
import '@/pages/inviteFlow.css'

/**
 * INVITE FLOW V3'S EMAIL CHECK — 2026-10-30, from Afsana's
 * `xcel-b2b2c-email-flow.html` (screens `verify-1`/`verify-2`, then
 * `code-1`/`code-2`). Seven of V3's eight flows open it over the checkout;
 * "QR: Has Atlas: Open Log-In Widget" does not (`inviteFlowsV3.ts`).
 *
 * A FORK OF `VerifyEmailModal`, which V2's "B2B2C verified email" flow keeps
 * unchanged. What the file changes:
 *
 *   - the first step asks for the EMAIL ONLY ("Provide your email address."),
 *     not first name, last name and email; the name is asked at checkout;
 *   - both steps carry the short grey rule under the title;
 *   - Continue and Confirm sit on the right and stay OFF until the step is
 *     complete (V2's are always on and explain on press);
 *   - the code boxes are larger (64 × 76) and centred; Resend code and Use a
 *     different email sit under the expiry note, split by a thin bar;
 *   - ANY six digits are accepted, as in the file — there is no wrong code and
 *     no demo inbox. V2 checks against `DEMO_VERIFICATION_CODE`.
 *
 * Like V2's: portalled, a fixed scrim, `role="dialog"`, focused on open, no ✕
 * and no Escape — the checkout behind cannot be used until the code is in.
 * The file has no "Back to the course", so neither does this.
 */
export function VerifyEmailModalV3({
  onVerified,
}: {
  /** The code was accepted — the address it was sent to is now known. */
  onVerified: (identity: VerifiedIdentity) => void
}) {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const ready = looksLikeEmail(email)
  /* Email only — the name is asked at checkout, so it is empty here. */
  const identity: VerifiedIdentity = { first: '', last: '', email }

  useEffect(() => {
    document.getElementById('verify-email-modal')?.focus()
  }, [])

  return createPortal(
    <div style={SCRIM}>
      <div
        id="verify-email-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-email-title"
        aria-describedby="verify-email-lead"
        tabIndex={-1}
        style={MODAL}
      >
        {step === 'email' ? (
          <form
            style={BODY}
            onSubmit={(e) => {
              e.preventDefault()
              if (ready) setStep('code')
            }}
            noValidate
          >
            <div style={HEAD}>
              <h2 id="verify-email-title" style={TITLE}>
                Verify your email to continue
              </h2>
              <div aria-hidden style={RULE} />
              <p id="verify-email-lead" style={LEAD}>
                Provide your email address.
              </p>
            </div>

            <label htmlFor="verify-email" style={FIELD_GROUP}>
              <span style={FIELD_LABEL}>
                Email address<span aria-hidden>*</span>
              </span>
              <input
                id="verify-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cre-e2e-input"
                style={FIELD}
              />
            </label>

            <div style={ACTIONS}>
              <button
                type="submit"
                className="cre-e2e-cta"
                disabled={!ready}
                aria-disabled={!ready}
                style={ready ? CTA : CTA_OFF}
              >
                Continue
              </button>
            </div>

            {/* The demo fill — the same invisible, labelled corner as V2's
                and as the file's. Email only here. */}
            <button
              type="button"
              aria-label="Fill in the demo learner’s email"
              title="Demo shortcut: fill in the demo learner’s email"
              style={DEMO_FILL}
              onClick={() => setEmail(E2E_LEARNER_EMAIL)}
            />
          </form>
        ) : (
          <CodeStep identity={identity} onVerified={onVerified} onChangeEmail={() => setStep('email')} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function CodeStep({
  identity,
  onVerified,
  onChangeEmail,
}: {
  identity: VerifiedIdentity
  onVerified: (identity: VerifiedIdentity) => void
  onChangeEmail: () => void
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(VERIFICATION_CODE_LENGTH).fill(''))
  const [resent, setResent] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const entered = digits.join('')
  const ready = codeComplete(entered)

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    setDigits((prev) => {
      const next = [...prev]
      /* A paste or an autofill landing in one box spreads from here. */
      if (clean.length > 1) {
        for (let k = 0; k < clean.length && i + k < VERIFICATION_CODE_LENGTH; k++) {
          next[i + k] = clean[k]
        }
      } else {
        next[i] = clean
      }
      return next
    })
    const advanceTo = Math.min(i + Math.max(clean.length, 1), VERIFICATION_CODE_LENGTH - 1)
    if (clean.length > 0) inputs.current[advanceTo]?.focus()
  }

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && digits[i] === '' && i > 0) {
      e.preventDefault()
      setDigits((prev) => {
        const next = [...prev]
        next[i - 1] = ''
        return next
      })
      inputs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < VERIFICATION_CODE_LENGTH - 1) {
      inputs.current[i + 1]?.focus()
    }
  }

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.replace(/\D/g, '').length > 1) {
      e.preventDefault()
      setDigit(i, text)
    }
  }

  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onVerified(identity)
      }}
      noValidate
    >
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Enter your code
        </h2>
        <div aria-hidden style={RULE} />
        <p id="verify-email-lead" style={LEAD}>
          We sent a 6‑digit code to <strong style={{ fontWeight: 800 }}>{identity.email.trim()}</strong>.
          Enter it below to continue to checkout.
        </p>
      </div>

      <div role="group" aria-label="Verification code" style={CODE_GROUP}>
        <div style={CODE_ROW}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={i === 0 ? undefined : 1}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1} of ${VERIFICATION_CODE_LENGTH}`}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.target.select()}
              className="cre-e2e-input"
              style={CODE_BOX}
            />
          ))}
        </div>
        {resent ? (
          <p role="status" style={NOTE}>
            We sent a new code to {identity.email.trim()}.
          </p>
        ) : (
          <p style={NOTE}>The code expires in 10 minutes.</p>
        )}
        <div style={LINK_ROW}>
          <button
            type="button"
            className="cre-e2e-textlink"
            style={TEXT_LINK}
            onClick={() => {
              setResent(true)
              setDigits(Array(VERIFICATION_CODE_LENGTH).fill(''))
              inputs.current[0]?.focus()
            }}
          >
            Resend code
          </button>
          <span aria-hidden style={BAR} />
          <button type="button" className="cre-e2e-textlink" style={TEXT_LINK} onClick={onChangeEmail}>
            Use a different email
          </button>
        </div>
      </div>

      <div style={ACTIONS}>
        <button
          type="submit"
          className="cre-e2e-cta"
          disabled={!ready}
          aria-disabled={!ready}
          style={ready ? CTA : CTA_OFF}
        >
          Confirm
        </button>
      </div>
    </form>
  )
}

/* ── Styles — the file's ────────────────────────────────────────────────── */

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
  width: 560,
  maxWidth: '100%',
  maxHeight: '100%',
  overflowY: 'auto',
  padding: '36px 36px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  borderRadius: 8,
}

const BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  width: '100%',
  margin: 0,
}

const HEAD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 22,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const RULE: CSSProperties = {
  width: '22%',
  height: 2,
  borderRadius: 1,
  background: '#dcdcdc',
  margin: '2px 0 4px',
}

const LEAD: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const FIELD_GROUP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
}

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

const NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const CODE_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const CODE_ROW: CSSProperties = { display: 'flex', gap: 12, justifyContent: 'center' }

const CODE_BOX: CSSProperties = {
  boxSizing: 'border-box',
  width: 64,
  height: 76,
  padding: 0,
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 30,
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-e2e-card-outline)',
}

const ACTIONS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 14,
  paddingTop: 4,
}

const CTA: CSSProperties = {
  padding: '12px 26px',
  borderRadius: 3,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  alignSelf: 'flex-end',
}

const CTA_OFF: CSSProperties = {
  ...CTA,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

const LINK_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }

/* `#00539a`, the file's link blue — V2's links are brick. */
const TEXT_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: '#00539a',
  cursor: 'pointer',
}

const BAR: CSSProperties = {
  display: 'inline-block',
  width: 1,
  height: 14,
  background: 'var(--color-text-secondary)',
}

const DEMO_FILL: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: 44,
  height: 44,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
}
