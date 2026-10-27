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
  DEMO_VERIFICATION_CODE,
  VERIFICATION_CODE_LENGTH,
  codeComplete,
  codeMatches,
  identityComplete,
  type VerifiedIdentity,
} from '@/data/inviteVerification'
import { looksLikeEmail } from '@/data/inviteFlows'
import {
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_FIRST,
  E2E_LEARNER_LAST,
  E2E_PARTNER_NAME,
} from '@/pages/endToEndDemo'
import '@/pages/inviteFlow.css'

/**
 * "VERIFY YOUR EMAIL TO CONTINUE" — 2026-10-27, Jillienne: "a modal prior to
 * the checkout flow that requires the first name, last name, and email
 * address, and this will send a 6-digit pin to the users email that they will
 * need to enter before they can continue with the checkout flow."
 *
 * The `b2b2c-verified` arm's one screen of its own. Two steps in one dialog:
 * who you are (first name, last name, email), then the code that came back
 * from that address. The checkout behind it is drawn but not usable until the
 * code is accepted — which is `InvitedCheckoutPageV2`'s decision, not this
 * component's; this only reports when it has been.
 *
 * ⚠ BUILT ON `PartnerCodeAskModal`'S CONSTRUCTION — portalled to `<body>`, a
 * fixed scrim, `role="dialog"` with `aria-modal`, focused on open — and, like
 * it, NO ✕ AND NO ESCAPE. The checkout cannot be reached without this, so a
 * dismissal would strand the learner on a form they are not allowed to fill
 * in. The way out is a real one: "Back to the course" returns to the product
 * page, which is where they came from.
 *
 * ⚠ NOTHING IS SENT. This is a prototype, so "we sent a code" is a sentence,
 * not an event. The reviewer finds out what the email says from the demo
 * affordance on the second step, which reveals the one code there is
 * (`DEMO_VERIFICATION_CODE`) and can type it in. It is marked as a demo
 * affordance the way "Demo · Scan the code" is on the QR card, so it does not
 * read as a feature of the product.
 *
 * ⚠ THE BUTTONS ARE NEVER DISABLED, for the checkout's own reason: a disabled
 * Send tells a learner they have done something wrong and refuses to say what.
 * Pressing is what surfaces the errors.
 */
export function VerifyEmailModal({
  onVerified,
  onBack,
}: {
  /** The code was accepted — the identity it was sent to is now known. */
  onVerified: (identity: VerifiedIdentity) => void
  /** "Back to the course" — the only way out that is not through. */
  onBack: () => void
}) {
  const [step, setStep] = useState<'details' | 'code'>('details')
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [triedToSend, setTriedToSend] = useState(false)

  const identity: VerifiedIdentity = { first, last, email }
  const firstError = triedToSend && first.trim() === ''
  const lastError = triedToSend && last.trim() === ''
  const emailError = triedToSend && !looksLikeEmail(email)

  /* Focus the dialog on open so a keyboard user is inside it — there is no
     dismiss to tab to. */
  useEffect(() => {
    document.getElementById('verify-email-modal')?.focus()
  }, [])

  const send = () => {
    setTriedToSend(true)
    if (!identityComplete(identity)) return
    setStep('code')
  }

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
        {step === 'details' ? (
          <form
            style={BODY}
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            noValidate
          >
            <div style={HEAD}>
              <h2 id="verify-email-title" style={TITLE}>
                Verify your email to continue
              </h2>
              <p id="verify-email-lead" style={LEAD}>
                {E2E_PARTNER_NAME} invited you. Tell us who you are and we’ll send a 6‑digit
                code to your email to confirm it’s yours before you check out.
              </p>
            </div>

            <div style={NAME_ROW}>
              <Field
                id="verify-first"
                label="First name"
                value={first}
                onChange={setFirst}
                autoComplete="given-name"
                error={firstError ? 'Enter your first name.' : null}
              />
              <Field
                id="verify-last"
                label="Last name"
                value={last}
                onChange={setLast}
                autoComplete="family-name"
                error={lastError ? 'Enter your last name.' : null}
              />
            </div>
            <Field
              id="verify-email"
              label="Email address"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="you@example.com"
              error={emailError ? 'Enter an email address we can send the code to.' : null}
              note="Your account will be created with this address."
            />

            <div style={ACTIONS}>
              <button type="submit" className="cre-e2e-cta" style={CTA}>
                Send code
              </button>
              <button type="button" className="cre-e2e-textlink" style={TEXT_LINK} onClick={onBack}>
                Back to the course
              </button>
            </div>

            {/* ⚠ THE DEMO FILL — the checkout's secret corner, here too, for
                the same reason: typing three fields in front of a room is most
                of the time it takes to show this step. Invisible to the eye,
                labelled for everyone else, and it fills without sending. */}
            <button
              type="button"
              aria-label="Fill in the demo learner’s name and email"
              title="Demo shortcut: fill in the demo learner’s name and email"
              style={DEMO_FILL}
              onClick={() => {
                setFirst(E2E_LEARNER_FIRST)
                setLast(E2E_LEARNER_LAST)
                setEmail(E2E_LEARNER_EMAIL)
                setTriedToSend(false)
              }}
            />
          </form>
        ) : (
          <CodeStep
            identity={identity}
            onVerified={onVerified}
            onChangeEmail={() => {
              setTriedToSend(false)
              setStep('details')
            }}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

/* ── Step two: the code ─────────────────────────────────────────────────── */

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
  const [tried, setTried] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const [resent, setResent] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const entered = digits.join('')

  /* The first box, on arrival — the learner has just pressed Send and the next
     thing to do is type. */
  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    setMismatch(false)
    setDigits((prev) => {
      const next = [...prev]
      /* A multi-character value is a paste or an autofill landing in one box:
         spread it from here, which is what the learner meant by it. */
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

  const fillDemoCode = () => {
    setMismatch(false)
    setDigits(DEMO_VERIFICATION_CODE.split(''))
    inputs.current[VERIFICATION_CODE_LENGTH - 1]?.focus()
  }

  const verify = () => {
    setTried(true)
    if (!codeComplete(entered)) return
    if (!codeMatches(entered)) {
      setMismatch(true)
      inputs.current[0]?.focus()
      return
    }
    onVerified(identity)
  }

  const incomplete = tried && !codeComplete(entered)

  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        verify()
      }}
      noValidate
    >
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Enter your code
        </h2>
        <p id="verify-email-lead" style={LEAD}>
          We sent a 6‑digit code to <strong style={{ fontWeight: 800 }}>{identity.email.trim()}</strong>.
          Enter it below to continue to checkout.
        </p>
      </div>

      <div role="group" aria-labelledby="verify-code-label" style={CODE_GROUP}>
        <span id="verify-code-label" style={FIELD_LABEL}>
          Verification code
        </span>
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
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              aria-label={`Digit ${i + 1} of ${VERIFICATION_CODE_LENGTH}`}
              aria-invalid={mismatch || incomplete || undefined}
              aria-describedby={mismatch || incomplete ? 'verify-code-error' : undefined}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKey(i, e)}
              onPaste={(e) => onPaste(i, e)}
              onFocus={(e) => e.target.select()}
              className="cre-e2e-input"
              style={{
                ...CODE_BOX,
                border:
                  mismatch || incomplete
                    ? '1px solid var(--color-status-error-text)'
                    : '1px solid var(--color-e2e-card-outline)',
              }}
            />
          ))}
        </div>
        {mismatch ? (
          <p id="verify-code-error" role="alert" style={ERROR}>
            That code didn’t match. Check the email and try again.
          </p>
        ) : incomplete ? (
          <p id="verify-code-error" role="alert" style={ERROR}>
            Enter all six digits of the code.
          </p>
        ) : resent ? (
          <p role="status" style={NOTE}>
            We sent a new code to {identity.email.trim()}.
          </p>
        ) : (
          <p style={NOTE}>The code expires in 10 minutes.</p>
        )}
      </div>

      <div style={ACTIONS}>
        <button type="submit" className="cre-e2e-cta" style={CTA}>
          Verify and continue
        </button>
        <div style={LINK_ROW}>
          <button
            type="button"
            className="cre-e2e-textlink"
            style={TEXT_LINK}
            onClick={() => {
              setResent(true)
              setMismatch(false)
              setTried(false)
              setDigits(Array(VERIFICATION_CODE_LENGTH).fill(''))
              inputs.current[0]?.focus()
            }}
          >
            Resend code
          </button>
          <span aria-hidden style={DOT}>
            ·
          </span>
          <button type="button" className="cre-e2e-textlink" style={TEXT_LINK} onClick={onChangeEmail}>
            Use a different email
          </button>
        </div>
      </div>

      {/* ⚠ THE DEMO'S INBOX. Marked as a demo affordance, as the QR card's
          "Demo · Scan the code" is: nothing was sent, so this is the only way
          a reviewer learns what the email says. It is a button that reveals
          the message rather than the code printed on the page, so the step
          still reads as "go and look at your email". */}
      <div style={DEMO_WRAP}>
        {showEmail ? (
          <div role="region" aria-label="The verification email, for this demo" style={DEMO_MAIL}>
            <p style={DEMO_MAIL_META}>
              <span style={{ fontWeight: 800 }}>From:</span> XCEL Solutions ·{' '}
              <span style={{ fontWeight: 800 }}>Subject:</span> Your XCEL verification code
            </p>
            <p style={DEMO_MAIL_BODY}>
              Hi {identity.first.trim()}, your verification code is{' '}
              <strong style={DEMO_CODE}>{DEMO_VERIFICATION_CODE}</strong>. It expires in 10
              minutes. If you didn’t request it, you can ignore this email.
            </p>
            <button type="button" className="cre-e2e-outline" style={DEMO_USE} onClick={fillDemoCode}>
              Use this code
            </button>
          </div>
        ) : (
          <button type="button" style={DEMO_REVEAL} onClick={() => setShowEmail(true)}>
            Demo · Show the email we sent
          </button>
        )}
      </div>
    </form>
  )
}

/* ── A field ────────────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  placeholder,
  error,
  note,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  type?: 'text' | 'email'
  autoComplete?: string
  placeholder?: string
  error: string | null
  note?: string
}) {
  const describedBy = error ? `${id}-error` : note ? `${id}-note` : undefined
  return (
    <label htmlFor={id} style={FIELD_GROUP}>
      <span style={FIELD_LABEL}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="cre-e2e-input"
        style={{
          ...FIELD,
          /* ⚠ THE WHOLE `border` SHORTHAND, as the checkout does — mixing it
             with `borderColor` across rerenders makes React drop one. */
          border: error
            ? '1px solid var(--color-status-error-text)'
            : '1px solid var(--color-e2e-card-outline)',
        }}
      />
      {error ? (
        <span id={`${id}-error`} role="alert" style={ERROR}>
          {error}
        </span>
      ) : note ? (
        <span id={`${id}-note`} style={NOTE}>
          {note}
        </span>
      ) : null}
    </label>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

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

const LEAD: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const NAME_ROW: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16,
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
}

const NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

/* Regular weight, as the checkout's email error: the colour marks it. */
const ERROR: CSSProperties = {
  ...NOTE,
  color: 'var(--color-status-error-text)',
}

const CODE_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const CODE_ROW: CSSProperties = { display: 'flex', gap: 10 }

const CODE_BOX: CSSProperties = {
  boxSizing: 'border-box',
  width: 52,
  height: 60,
  padding: 0,
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 24,
  color: 'var(--color-text-primary)',
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
}

const LINK_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }

const TEXT_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: 'var(--color-xcel-brick-600)',
  cursor: 'pointer',
}

const DOT: CSSProperties = { color: 'var(--color-text-secondary)', fontSize: 13 }

const DEMO_WRAP: CSSProperties = {
  marginTop: 4,
  paddingTop: 16,
  borderTop: '1px solid var(--color-e2e-form-outline)',
}

const DEMO_REVEAL: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const DEMO_MAIL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '12px 14px',
  borderRadius: 4,
  border: '1px dashed var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-summary)',
}

const DEMO_MAIL_META: CSSProperties = {
  ...NOTE,
  fontSize: 12,
}

const DEMO_MAIL_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const DEMO_CODE: CSSProperties = {
  fontWeight: 800,
  letterSpacing: '0.12em',
}

const DEMO_USE: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '7px 14px',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 3,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
}

/* The demo fill's target: the dialog's bottom-right corner. Transparent and
   labelled, as the checkout's. */
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
