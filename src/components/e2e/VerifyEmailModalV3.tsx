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
import { CircleCheckSolid } from '@/icons'
import { V3_EXPIRED_DEMO_CODE, V3_INVALID_DEMO_CODE, V3_WRONG_DEMO_PASSWORD } from '@/data/inviteFlowsV3'
import { E2E_LEARNER_EMAIL, E2E_LEARNER_FIRST, E2E_LEARNER_LAST } from '@/pages/endToEndDemo'
import { LOADING_HANDOFF_MS } from '@/components/e2e/XcelLoadingPage'
import { XcelLoadingStatus } from '@/components/e2e/XcelLoadingStatus'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'
import { InvitePasswordChecklistV3 } from '@/components/e2e/InvitePasswordChecklistV3'
import { meetsInvitePasswordRulesV3 } from '@/data/invitePasswordRulesV3'
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
 *   - 460 wide, with Continue, Confirm and Log in full width, OFF until the
 *     step is complete (V2's are always on and explain on press);
 *   - the code boxes are 54 × 66 and centred. Since 2026-11-03 (Afsana) the
 *     code step carries the XCEL logo over "Enter your one-time code", and
 *     under Confirm: "Didn't receive the code? Resend code in 10:00",
 *     counting down until Resend unlocks, then Use a different email;
 *   - ANY six digits are accepted, as in the file — there is no wrong code and
 *     no demo inbox. V2 checks against `DEMO_VERIFICATION_CODE`.
 *
 * Like V2's: portalled, a fixed scrim, `role="dialog"`, focused on open, no ✕
 * and no Escape — the checkout behind cannot be used until the code is in.
 * The file has no "Back to the course", so neither does this.
 *
 * ⚠ THE HAS ATLAS FLOWS GO FURTHER (2026-10-30, `emailCheckV3`): after the
 * address, a learner who already has Atlas either SIGNS IN — "Log in to
 * continue", the address locked, a password (`login-1`/`login-2`) — or gets
 * the code as above; and two of them hold on "Signing you in" (`signing-in`)
 * before the checkout opens. The email step's button reads Continue on every
 * flow (2026-11-02, Afsana) — the file had Confirm on the log-in flows.
 */
export function VerifyEmailModalV3({
  onVerified,
  second = 'code',
  signsIn = false,
  suppliedEmail,
}: {
  /** The check is done — the address is proven, or the learner signed in. */
  onVerified: (identity: VerifiedIdentity) => void
  /** After the address: a code sent to it, a log-in to an account the
   *  learner already has, or nothing — the automatic flows go straight to
   *  "Signing you in" (2026-11-03). */
  second?: 'code' | 'login' | 'none'
  /** Hold on "Signing you in" before the checkout. */
  signsIn?: boolean
  /** An address the flow already has — Direct Email's invitation supplied it
   *  (2026-11-04). The check opens on its second step with it, and there is
   *  no "Use a different email": the partner named this one. */
  suppliedEmail?: string
}) {
  /* A supplied address with Atlas goes straight to Log in. Without Atlas it
     no longer goes straight to the code (2026-11-13, Afsana): the email step
     comes first, filled with the invitation's address, so no code is sent
     before the learner says where. */
  const [step, setStep] = useState<'email' | 'code' | 'name' | 'login' | 'signing-in'>(() =>
    suppliedEmail && second === 'login' ? 'login' : 'email',
  )
  const layer = useV3DialogLayer()
  const [email, setEmail] = useState(suppliedEmail ?? '')
  const ready = looksLikeEmail(email)
  /* The name — asked after the code, for a learner with no Atlas account
     (2026-11-13, Afsana); the log-in finds it on the account, so it stays
     empty there. The checkout's student form arrives with it filled. */
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const identity: VerifiedIdentity = { first, last, email }

  useEffect(() => {
    document.getElementById('verify-email-modal')?.focus()
  }, [])

  /* The second step is done: hold on "Signing you in" first where the flow
     has it, the flow's usual three seconds. */
  const done = () => (signsIn ? setStep('signing-in') : onVerified(identity))
  useEffect(() => {
    if (step !== 'signing-in') return
    const timer = window.setTimeout(() => onVerified(identity), LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
    // `identity` is rebuilt every render; the address cannot change on this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, onVerified])

  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }}>
      <div
        id="verify-email-modal"
        role="dialog"
        aria-modal="true"
        /* "Signing you in" has no heading, so it names itself. */
        aria-labelledby={step === 'signing-in' ? undefined : 'verify-email-title'}
        aria-describedby={step === 'signing-in' ? undefined : 'verify-email-lead'}
        aria-label={step === 'signing-in' ? 'Signing you in' : undefined}
        tabIndex={-1}
        style={{ ...MODAL, ...layer.card }}
      >
        {step === 'email' ? (
          <form
            style={BODY}
            onSubmit={(e) => {
              e.preventDefault()
              if (!ready) return
              if (second === 'none') done()
              else setStep(second)
            }}
            noValidate
          >
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
            <div style={HEAD}>
              <h2 id="verify-email-title" style={TITLE}>
                Enter your email to continue
              </h2>
              <div aria-hidden style={RULE} />
              <p id="verify-email-lead" style={LEAD}>
                {/* One line on every flow, whatever the account turns out to
                    be — it is only checked after Continue (2026-11-13, Afsana). */}
                Provide your email address. We will use it to find your existing account or create one.
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
                className="cre-e2e-input cre-e2e-input-v3"
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
        ) : step === 'code' ? (
          <CodeStep
            identity={identity}
            onVerified={() => setStep('name')}
            onChangeEmail={suppliedEmail ? undefined : () => setStep('email')}
          />
        ) : step === 'name' ? (
          <NameStep first={first} last={last} onFirst={setFirst} onLast={setLast} onDone={done} />
        ) : step === 'login' ? (
          /* Log in always holds on "Signing you in" (2026-11-05, Afsana),
             whether or not the flow's `signsIn` does. */
          <LoginStep
            email={email}
            supplied={Boolean(suppliedEmail)}
            onEmailChange={setEmail}
            onLoggedIn={() => setStep('signing-in')}
          />
        ) : (
          <div style={SIGNING_IN}>
            <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
            <XcelLoadingStatus message="Signing you in" size={SIGNING_SPINNER} />
          </div>
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
  onVerified: () => void
  /** Absent when the address was supplied — there is no other to use. */
  onChangeEmail?: () => void
}) {
  const [digits, setDigits] = useState<string[]>(() => Array(VERIFICATION_CODE_LENGTH).fill(''))
  const [resent, setResent] = useState(false)
  /* A wrong or an expired code — 2026-11-05, Afsana. Cleared as soon as a
     digit changes. */
  const [codeError, setCodeError] = useState<'invalid' | 'expired' | null>(null)
  const invalid = codeError !== null
  /* Resend unlocks when the code expires — 10 minutes, counted down under
     Confirm (2026-11-03, Afsana). */
  const [secondsLeft, setSecondsLeft] = useState(RESEND_AFTER_S)
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [secondsLeft])
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const entered = digits.join('')
  const ready = codeComplete(entered)

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const setDigit = (i: number, value: string) => {
    const clean = value.replace(/\D/g, '')
    setCodeError(null)
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
        if (!ready) return
        /* The code expires with the countdown — 10 minutes. */
        if (entered === V3_EXPIRED_DEMO_CODE || secondsLeft <= 0) setCodeError('expired')
        else if (entered === V3_INVALID_DEMO_CODE) setCodeError('invalid')
        else onVerified()
      }}
      noValidate
    >
      {/* The XCEL mark over the heading, to make it read as official
          (2026-11-03, Afsana). */}
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Enter your one-time code
        </h2>
        <div aria-hidden style={RULE} />
        {/* Code resent — a light green banner over the lead (2026-11-05,
            Afsana), replacing the line under the countdown. It stays until the
            modal closes; how long it should persist is the team's call. */}
        {resent ? (
          <p role="status" style={RESENT_BANNER}>
            <CircleCheckSolid size={16} aria-hidden style={{ flex: 'none' }} />
            <span>A new code has been sent.</span>
          </p>
        ) : null}
        <p id="verify-email-lead" style={LEAD}>
          To verify your email address, enter the 6-digit code we sent to{' '}
          <strong style={{ fontWeight: 800 }}>{identity.email.trim()}</strong>. Be sure to check your spam or junk
          folders. This code will expire in 10 minutes.
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
              aria-invalid={invalid}
              aria-describedby={invalid ? 'code-invalid' : undefined}
              className="cre-e2e-input cre-e2e-input-v3"
              style={invalid ? { ...CODE_BOX, ...CODE_BOX_INVALID } : CODE_BOX}
            />
          ))}
        </div>
        {invalid ? (
          <p id="code-invalid" role="alert" style={INVALID}>
            {codeError === 'expired' ? 'The code has expired. Request another code.' : 'Invalid code. Please try again.'}
          </p>
        ) : null}
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

      <div style={RESEND_GROUP}>
        <p style={NOTE}>
          <strong style={{ fontWeight: 800 }}>Didn’t receive the code?</strong>{' '}
          {secondsLeft > 0 ? (
            <span role="timer" aria-live="off">
              Resend code in {formatCountdown(secondsLeft)}
            </span>
          ) : (
            <button
              type="button"
              className="cre-e2e-textlink"
              style={TEXT_LINK}
              onClick={() => {
                setResent(true)
                setCodeError(null)
                setSecondsLeft(RESEND_AFTER_S)
                setDigits(Array(VERIFICATION_CODE_LENGTH).fill(''))
                inputs.current[0]?.focus()
              }}
            >
              Resend code
            </button>
          )}
        </p>
        {onChangeEmail ? (
          <button type="button" className="cre-e2e-textlink" style={TEXT_LINK} onClick={onChangeEmail}>
            Use a different email
          </button>
        ) : null}
      </div>
    </form>
  )
}

const RESEND_AFTER_S = 10 * 60

/* How long Resend link stays off after a reset link is sent — the demo's
   stand-in for whatever the system allows (2026-11-05). */
const RESEND_LINK_AFTER_S = 30

/** 600 → "10:00", 59 → "0:59". */
/** "Enter your name to continue" — 2026-11-13, Afsana. After the one-time
 *  code, for a learner with no Atlas account: first and last name, both
 *  required, before the checkout. Continue stays off until both are in. */
function NameStep({
  first,
  last,
  onFirst,
  onLast,
  onDone,
}: {
  first: string
  last: string
  onFirst: (value: string) => void
  onLast: (value: string) => void
  onDone: () => void
}) {
  const ready = first.trim() !== '' && last.trim() !== ''
  useEffect(() => {
    document.getElementById('verify-first')?.focus()
  }, [])
  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onDone()
      }}
      noValidate
    >
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Enter your name to continue
        </h2>
        <div aria-hidden style={RULE} />
        <p id="verify-email-lead" style={LEAD}>
          Your email is verified. Enter your first and last name to continue to checkout.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label htmlFor="verify-first" style={FIELD_GROUP}>
          <span style={FIELD_LABEL}>
            First name <span aria-hidden>*</span>
          </span>
          <input
            id="verify-first"
            type="text"
            required
            autoComplete="given-name"
            placeholder="First name"
            value={first}
            onChange={(e) => onFirst(e.target.value)}
            className="cre-e2e-input cre-e2e-input-v3"
            style={FIELD}
          />
        </label>
        <label htmlFor="verify-last" style={FIELD_GROUP}>
          <span style={FIELD_LABEL}>
            Last name <span aria-hidden>*</span>
          </span>
          <input
            id="verify-last"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Last name"
            value={last}
            onChange={(e) => onLast(e.target.value)}
            className="cre-e2e-input cre-e2e-input-v3"
            style={FIELD}
          />
        </label>
      </div>

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

      {/* The demo fill — the same invisible, labelled corner as the email
          step's. */}
      <button
        type="button"
        aria-label="Fill in the demo learner’s name"
        title="Demo shortcut: fill in the demo learner’s name"
        style={DEMO_FILL}
        onClick={() => {
          onFirst(E2E_LEARNER_FIRST)
          onLast(E2E_LEARNER_LAST)
        }}
      />
    </form>
  )
}

function formatCountdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/** "Log in to continue" — the Has Atlas log-in widget (`login-1`, `login-2`).
 *  The address is the one just given, locked; Log in stays off until there
 *  is a password. Any password is accepted, as in the file. */
function LoginStep({
  email,
  supplied,
  onEmailChange,
  onLoggedIn,
}: {
  email: string
  /** Direct Email: the partner supplied the address, and Log in shows it in
   *  an email field, filled and editable (2026-11-13, Afsana). */
  supplied: boolean
  onEmailChange: (email: string) => void
  onLoggedIn: () => void
}) {
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  /* A wrong password — 2026-11-05, Afsana, as the code step's wrong code.
     Cleared as soon as the password changes. */
  const [failed, setFailed] = useState(false)
  /* Forgot password? — 2026-11-05, Afsana: the modal says a reset link went
     to the address, bold, and to follow the email's instructions. */
  const [resetSent, setResetSent] = useState(false)
  /* Reset your password — 2026-11-12, Afsana: for the demo, a click on
     Check your email (anywhere but its two buttons) stands in for following
     the link. Reset password comes back here with a green banner — a
     proposal; where a reset lands is still open. */
  const [resetting, setResetting] = useState(false)
  const [wasReset, setWasReset] = useState(false)
  /* Resend link waits after every send, the first included (2026-11-05,
     Afsana: "disabled for a bit until the system enables the user to make
     another request"). The real wait is the system's; the demo's is
     `RESEND_LINK_AFTER_S`. */
  const [linkWait, setLinkWait] = useState(0)
  useEffect(() => {
    if (linkWait <= 0) return
    const t = window.setTimeout(() => setLinkWait((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [linkWait])
  const canResend = linkWait <= 0
  /* Direct Email's field can be edited, so it has to hold an address too. */
  const ready = password !== '' && (!supplied || looksLikeEmail(email))
  if (resetting) {
    return (
      <ResetPasswordStep
        email={email}
        onReset={() => {
          setResetting(false)
          setResetSent(false)
          setPassword('')
          setFailed(false)
          setWasReset(true)
        }}
      />
    )
  }
  if (resetSent) {
    return (
      <div
        style={{ ...BODY, cursor: 'pointer' }}
        title="Demo: click to follow the reset link"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) setResetting(true)
        }}
      >
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
        <div style={HEAD}>
          <h2 id="verify-email-title" style={TITLE}>
            Check your email
          </h2>
          <div aria-hidden style={RULE} />
          <p id="verify-email-lead" style={LEAD}>
            We sent a password reset link to <strong style={{ fontWeight: 800 }}>{email.trim()}</strong>. Follow the
            instructions in the email to reset your password. Be sure to check your spam or junk folders.
          </p>
        </div>
        {/* The address the link went to, in a field the learner cannot change
            — grey, no lock, as the checkout's fixed fields (2026-11-13,
            Afsana). */}
        <label htmlFor="reset-email" style={FIELD_GROUP}>
          <span style={FIELD_LABEL}>Email address</span>
          <input id="reset-email" type="email" value={email.trim()} disabled readOnly style={{ ...FIELD, ...FIELD_DISABLED }} />
        </label>
        {/* Resend link, primary, over Back to sign in, secondary (2026-11-05,
            Afsana). Back is the way out — the modal has no ✕. */}
        <div style={ACTIONS}>
          <button
            type="button"
            className="cre-e2e-cta"
            disabled={!canResend}
            aria-disabled={!canResend}
            style={canResend ? CTA : CTA_OFF}
            onClick={() => setLinkWait(RESEND_LINK_AFTER_S)}
          >
            Resend link
          </button>
          {/* The wait, counted down under the button (2026-11-13, Afsana). */}
          {canResend ? null : (
            <p role="timer" aria-live="off" style={{ ...NOTE, alignSelf: 'stretch', textAlign: 'center' }}>
              You can resend the link in {formatCountdown(linkWait)}
            </p>
          )}
          <button
            type="button"
            style={CTA_SECONDARY}
            onClick={() => setResetSent(false)}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }
  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        if (!ready) return
        if (password === V3_WRONG_DEMO_PASSWORD) setFailed(true)
        else onLoggedIn()
      }}
      noValidate
    >
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Log in to continue
        </h2>
        <div aria-hidden style={RULE} />
        {wasReset ? (
          <p role="status" style={RESENT_BANNER}>
            <CircleCheckSolid size={16} aria-hidden style={{ flex: 'none' }} />
            <span>Your password has been reset.</span>
          </p>
        ) : null}
        {/* The address in the sentence, not a field (2026-11-03, Afsana) — it
            was a locked email field above the password. */}
        {supplied ? (
          <p id="verify-email-lead" style={LEAD}>
            Welcome back, {E2E_LEARNER_FIRST}! Sign in to finish checking out.
          </p>
        ) : (
          <p id="verify-email-lead" style={LEAD}>
            Welcome back, {E2E_LEARNER_FIRST}! Sign in to <strong style={{ fontWeight: 800 }}>{email.trim()}</strong>{' '}
            to finish checking out.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Direct Email's address, pre-filled from the invitation and
            editable — no lock, no grey (2026-11-13, Afsana). */}
        {supplied ? (
          <label htmlFor="login-email" style={FIELD_GROUP}>
            <span style={FIELD_LABEL}>
              Email address <span aria-hidden>*</span>
            </span>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="cre-e2e-input cre-e2e-input-v3"
              style={FIELD}
            />
          </label>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="login-password" style={FIELD_GROUP}>
            <span style={FIELD_LABEL}>
              Password <span aria-hidden>*</span>
            </span>
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                id="login-password"
                type={shown ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFailed(false)
                }}
                aria-invalid={failed}
                aria-describedby={failed ? 'login-failed' : undefined}
                style={failed ? { ...FIELD, paddingRight: 40, ...FIELD_INVALID } : { ...FIELD, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShown((v) => !v)}
                aria-label={shown ? 'Hide password' : 'Show password'}
                aria-pressed={shown}
                style={EYE}
              >
                <img
                  src={shown ? '/brand/confirmation/eye.svg' : '/brand/confirmation/eye-off.svg'}
                  alt=""
                  width={18}
                  height={18}
                  style={{ display: 'block' }}
                />
              </button>
            </span>
          </label>
          {failed ? (
            <p id="login-failed" role="alert" style={INVALID}>
              We couldn’t log you in. Please try again.
            </p>
          ) : null}
          <button
            type="button"
            style={FORGOT}
            onClick={() => {
              setResetSent(true)
              setLinkWait(RESEND_LINK_AFTER_S)
            }}
          >
            Forgot password?
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
          Log in
        </button>
      </div>
    </form>
  )
}

/** "Reset your password" — 2026-11-12, Afsana. Reached in the demo by
 *  clicking Check your email. The same meter and seven rules as the password
 *  the learner creates at the end of the flow, for continuity; Reset password
 *  stays off until every rule is met and both fields match. */
function ResetPasswordStep({ email, onReset }: { email: string; onReset: () => void }) {
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [confirmShown, setConfirmShown] = useState(false)
  /* The mismatch speaks once the second field has something in it. */
  const mismatch = confirm.length > 0 && confirm !== password
  const ready = meetsInvitePasswordRulesV3(password, email.trim()) && confirm === password
  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        if (ready) onReset()
      }}
      noValidate
    >
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Reset your password
        </h2>
        <div aria-hidden style={RULE} />
        <p id="verify-email-lead" style={LEAD}>
          Create a new password for <strong style={{ fontWeight: 800 }}>{email.trim()}</strong>.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label htmlFor="reset-password" style={FIELD_GROUP}>
          <span style={FIELD_LABEL}>
            Password <span aria-hidden>*</span>
          </span>
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              id="reset-password"
              type={shown ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cre-e2e-input cre-e2e-input-v3"
              style={{ ...FIELD, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShown((v) => !v)}
              aria-label={shown ? 'Hide password' : 'Show password'}
              aria-pressed={shown}
              style={EYE}
            >
              <img src={shown ? '/brand/confirmation/eye.svg' : '/brand/confirmation/eye-off.svg'} alt="" width={18} height={18} style={{ display: 'block' }} />
            </button>
          </span>
        </label>
        <InvitePasswordChecklistV3 password={password} username={email.trim()} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="reset-confirm" style={FIELD_GROUP}>
            <span style={FIELD_LABEL}>
              Confirm new password <span aria-hidden>*</span>
            </span>
            <span style={{ position: 'relative', display: 'block' }}>
              <input
                id="reset-confirm"
                type={confirmShown ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Re-enter password..."
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={mismatch}
                aria-describedby={mismatch ? 'reset-mismatch' : undefined}
                className="cre-e2e-input cre-e2e-input-v3"
                style={mismatch ? { ...FIELD, paddingRight: 40, ...FIELD_INVALID } : { ...FIELD, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setConfirmShown((v) => !v)}
                aria-label={confirmShown ? 'Hide confirm new password' : 'Show confirm new password'}
                aria-pressed={confirmShown}
                style={EYE}
              >
                <img src={confirmShown ? '/brand/confirmation/eye.svg' : '/brand/confirmation/eye-off.svg'} alt="" width={18} height={18} style={{ display: 'block' }} />
              </button>
            </span>
          </label>
          {mismatch ? (
            <p id="reset-mismatch" role="alert" style={INVALID}>
              Passwords do not match.
            </p>
          ) : null}
        </div>
      </div>

      <div style={ACTIONS}>
        <button type="submit" className="cre-e2e-cta" disabled={!ready} aria-disabled={!ready} style={ready ? CTA : CTA_OFF}>
          Reset password
        </button>
      </div>

      {/* The demo fill — the same invisible corner as the ending's. */}
      <button
        type="button"
        aria-label="Fill in a new demo password"
        title="Demo shortcut: fill in a new demo password"
        style={DEMO_FILL}
        onClick={() => {
          setPassword(RESET_DEMO_PASSWORD)
          setConfirm(RESET_DEMO_PASSWORD)
        }}
      />
    </form>
  )
}

/* A valid new password for the demo fill — every rule met. */
const RESET_DEMO_PASSWORD = 'Navarro#2027'

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

/* 460 wide and the buttons full width: the file's stylesheet overrides its
   own markup's 560 (`[role=dialog] { width: 460px !important }`). */
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

/* A field the learner cannot change: grey, no lock — the checkout's
   FIELD_DISABLED (2026-11-13, Afsana). */
const FIELD_DISABLED: CSSProperties = {
  background: 'var(--color-e2e-form-locked-v3)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

/* Code resent — light green, the success scale's lightest fill. */
const RESENT_BANNER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '4px 0',
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--color-success-200)',
  background: 'var(--color-success-100)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-success-700)',
}

/* Smaller than the lead's 14 (2026-11-05, Afsana), in the error red. */
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

/* The header's own mark, smaller, centred over the email, code and log-in
   steps' headings and the Signing you in hold (2026-11-03, Afsana). */
const CODE_LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain', alignSelf: 'center' }

/* Under Confirm: the resend line, then Use a different email. */
const RESEND_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }

const CODE_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const CODE_ROW: CSSProperties = { display: 'flex', gap: 12, justifyContent: 'center' }

const CODE_BOX: CSSProperties = {
  boxSizing: 'border-box',
  width: 54,
  height: 66,
  padding: 0,
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 28,
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-e2e-card-outline)',
}

/* A wrong code: a red stroke along the bottom of each box (2026-11-05,
   Afsana). An inset shadow rather than `borderBottom`, so it never fights the
   `border` shorthand above. */
const CODE_BOX_INVALID: CSSProperties = { boxShadow: 'inset 0 -2px 0 var(--color-error-600)' }

/* The same stroke under the log-in password on a wrong password. */
const FIELD_INVALID: CSSProperties = CODE_BOX_INVALID

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
  alignSelf: 'stretch',
  width: '100%',
  boxSizing: 'border-box',
}

/* The secondary — the primary's size and shape, outlined in the brick
   (2026-11-05, Afsana: Check your email's Back to sign in). */
const CTA_SECONDARY: CSSProperties = {
  ...CTA,
  border: '1px solid var(--color-xcel-brick-600)',
  background: 'var(--color-fixed-light)',
  color: 'var(--color-xcel-brick-600)',
}

const CTA_OFF: CSSProperties = {
  ...CTA,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

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

const EYE: CSSProperties = {
  position: 'absolute',
  right: 10,
  top: 10,
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

const FORGOT: CSSProperties = {
  alignSelf: 'flex-start',
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: '#00539a',
  cursor: 'pointer',
}

/* "Signing you in" — the file's: the spinner alone in the dialog, as on
   "Placing your order". */
/* The logo centred over the spinner, as on the email, code and log-in steps
   (2026-11-03, Afsana). */
/* Smaller than the loading page's 72 (2026-11-03, Afsana). */
const SIGNING_SPINNER = 48

const SIGNING_IN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
  padding: '4px 0 20px',
}
