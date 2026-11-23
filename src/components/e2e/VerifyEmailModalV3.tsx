import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import {
  VERIFICATION_CODE_LENGTH,
  codeComplete,
  type VerifiedIdentity,
} from '@/data/inviteVerification'
import { looksLikeEmail } from '@/data/inviteFlows'
import { ArrowLeft, Check, CircleCheckSolid } from '@/icons'
import { PasswordEyeV3 } from '@/components/e2e/PasswordEyeV3'
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
 *     code step carries the XCEL logo over "Verify your email" (was "Enter your one-time code" until 2026-11-13), and
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
   *  (2026-11-04). The email step opens filled with it. Its code step has
   *  "Use a different email" too since 2026-11-23 (Afsana) — until then it
   *  was left off, the partner having named this one. */
  suppliedEmail?: string
}) {
  /* The email step always comes first — filled with a supplied address, so
     nothing is sent and nobody is asked to sign in before the learner says
     where (2026-11-13, Afsana, for the code; 2026-11-18 for Log in, which
     until then opened straight on a supplied address with Atlas). Log in
     keeps its own Email field, filled with what the step was given. */
  const [step, setStep] = useState<'email' | 'code' | 'verified' | 'name' | 'login' | 'signing-in'>('email')
  const layer = useV3DialogLayer()
  const [email, setEmail] = useState(suppliedEmail ?? '')
  const ready = looksLikeEmail(email)
  /* Said as the learner types, once there is something to judge
     (2026-11-13, Afsana). */
  const badEmail = email.trim() !== '' && !ready
  /* The name — asked after the code, for a learner with no Atlas account
     (2026-11-13, Afsana); the log-in finds it on the account, so it stays
     empty there. The checkout's student form arrives with it filled. */
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const identity: VerifiedIdentity = { first, last, email }

  useEffect(() => {
    document.getElementById('verify-email-modal')?.focus()
  }, [])

  /* Email verified holds, then the name (2026-11-13, Afsana). */
  useEffect(() => {
    if (step !== 'verified') return
    const timer = window.setTimeout(() => setStep('name'), VERIFIED_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [step])

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

            <div style={FIELD_AND_ERROR}>
              <label htmlFor="verify-email" style={FIELD_GROUP}>
                {/* "Email", not "Email address" — every V3 modal (2026-11-18,
                    Afsana). */}
                <span style={FIELD_LABEL}>
                  Email <span aria-hidden>*</span>
                </span>
                <input
                  id="verify-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={badEmail}
                  aria-describedby={badEmail ? 'verify-email-invalid' : undefined}
                  className="cre-e2e-input cre-e2e-input-v3"
                  /* No red stroke — the line under it is enough (2026-11-18,
                     Afsana). */
                  style={FIELD}
                />
              </label>
              {badEmail ? <EmailInvalid id="verify-email-invalid" /> : null}
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
            onVerified={() => setStep('verified')}
            onChangeEmail={() => setStep('email')}
          />
        ) : step === 'verified' ? (
          <EmailVerified />
        ) : step === 'name' ? (
          <NameStep first={first} last={last} onFirst={setFirst} onLast={setLast} onDone={done} />
        ) : step === 'login' ? (
          /* Log in always holds on "Signing you in" (2026-11-05, Afsana),
             whether or not the flow's `signsIn` does. */
          <LoginStep
            email={email}
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
  /* Wrong codes allowed before a new one is needed — the banner counts them
     down, "Incorrect code. 4 attempts left." (2026-11-23, Afsana). A resent
     code starts the count again. ⚠ AFTER THE FIFTH WRONG CODE IS NOT MOCKED
     (Afsana: "do not mock up the 'after 5th' wrong code") — the count stops
     at 1 rather than invent what none left looks like. */
  const [attemptsLeft, setAttemptsLeft] = useState(CODE_ATTEMPTS)
  /* Resend unlocks when the code expires — 10 minutes, counted down under
     Confirm (2026-11-03, Afsana). */
  /* ⚠ COUNTED FROM A DEADLINE, not tick by tick (2026-11-23): a clock that
     jumps — a tab asleep, or the screenshot script skipping the ten
     minutes — lands on the right second. */
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + RESEND_AFTER_S * 1000)
  const [now, setNow] = useState(() => Date.now())
  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  useEffect(() => {
    if (secondsLeft <= 0) return
    const t = window.setTimeout(() => setNow(Date.now()), 1000)
    return () => window.clearTimeout(t)
  }, [now, secondsLeft])
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
        else if (entered === V3_INVALID_DEMO_CODE) {
          setCodeError('invalid')
          setAttemptsLeft((n) => Math.max(n - 1, 1))
        } else onVerified()
      }}
      noValidate
    >
      {/* The XCEL mark over the heading, to make it read as official
          (2026-11-03, Afsana). */}
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          Verify your email
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
          {/* The expiry is part of it again, at the end (2026-11-23, Afsana);
              from 2026-11-13 it sat under the boxes. */}
          We sent a 6-digit code to <strong style={{ fontWeight: 800 }}>{identity.email.trim()}</strong>. Be sure to
          check your spam or junk folders. The code expires in 10 minutes.
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
        {/* Under the boxes, in the error red, the attempts counted down —
            "Incorrect code. 4 attempts left." (2026-11-23, Afsana; "Invalid
            code. Please try again." until then). */}
        {invalid ? (
          <p id="code-invalid" role="alert" style={INVALID}>
            {codeError === 'expired'
              ? 'The code has expired. Request another code.'
              : `Incorrect code. ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left.`}
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
                setAttemptsLeft(CODE_ATTEMPTS)
                const at = Date.now()
                setNow(at)
                setExpiresAt(at + RESEND_AFTER_S * 1000)
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

/** Wrong codes before a new one is needed (2026-11-23, Afsana). */
const CODE_ATTEMPTS = 5

/* How long Email verified shows before the name step. */
const VERIFIED_HOLD_MS = 2000

/** "Email verified" — 2026-11-13, Afsana, from a reference image: a green
 *  check in a pale green ring, "Email verified", "Thanks! Continuing…". Shown
 *  after a code is accepted, then the modal moves on by itself. The XCEL logo
 *  over a smaller ring since 2026-11-17 (Afsana), as on the other steps. */
function EmailVerified() {
  return (
    <div style={VERIFIED} role="status">
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <span aria-hidden style={VERIFIED_RING}>
        {/* The light icon, stroked heavier to match the reference. */}
        <Check size={24} style={{ stroke: 'currentColor', strokeWidth: 28 }} />
      </span>
      <div style={{ ...HEAD, alignItems: 'center', gap: 6 }}>
        <h2 id="verify-email-title" style={TITLE}>
          Email verified
        </h2>
        <p id="verify-email-lead" style={{ ...LEAD, color: 'var(--color-text-secondary)' }}>
          Thanks! Continuing…
        </p>
      </div>
    </div>
  )
}

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
  onLoggedIn,
  title = 'Log in to continue',
  lead = `Welcome back, ${E2E_LEARNER_FIRST}! Sign in to finish checking out.`,
  showEmail = true,
  onBack,
}: {
  email: string
  onLoggedIn: () => void
  /** The Log In flow's own words (2026-11-20) — the checkout's otherwise. */
  title?: string
  /** `null` draws no lead — the Log In flow's (2026-11-20, Afsana: "remove the
   *  subtext"). */
  lead?: string | null
  /** Off on the Log In flow, whose email step is the page before; ← Back
   *  returns to it instead (2026-11-20, Afsana). */
  showEmail?: boolean
  onBack?: () => void
}) {
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  /* A wrong password — 2026-11-05, Afsana, as the code step's wrong code.
     Cleared as soon as the password changes. */
  const [failed, setFailed] = useState(false)
  /* Forgot password? — 2026-11-05, Afsana: the modal says a reset link went
     to the address, bold, and to follow the email's instructions. */
  const [resetSent, setResetSent] = useState(false)
  /* Reset your password, asked first — 2026-11-19, Afsana: Forgot password?
     opens a step that takes the address and sends the link, and only Send
     reset link reaches Check your email. Until then Forgot password? went
     straight to Check your email. Empty on purpose: "Enter your email". */
  const [requesting, setRequesting] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  /* The reset itself is NOT in this modal (2026-11-19, Afsana): the link in
     the email opens Reset your password on a page of its own, in a new tab
     (`ResetPasswordPageV3`). For the demo, a click on Check your email
     (anywhere but its two buttons) — or its demo link — opens that page in
     a new tab, and this tab stays on Check your email. Until 2026-11-19 the
     modal itself turned into the reset form, then came back to Log in with
     a "Your password has been reset." banner; both are gone, since a
     checkout tab cannot know a reset happened in another. */
  const [params] = useSearchParams()
  const openResetLink = () => {
    const q = new URLSearchParams(params)
    q.set('email', resetEmail.trim())
    window.open(`/end-to-end-demo/reset-password?${q.toString()}`, '_blank', 'noopener')
  }
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
  const ready = password !== ''
  if (requesting) {
    const valid = looksLikeEmail(resetEmail)
    const badResetEmail = resetEmail.trim() !== '' && !valid
    return (
      <form
        style={BODY}
        onSubmit={(e) => {
          e.preventDefault()
          if (!valid) return
          setRequesting(false)
          setResetSent(true)
          setLinkWait(RESEND_LINK_AFTER_S)
        }}
        noValidate
      >
        {/* ← Back in the top left returns to Log in, in place of Back to
            sign in — the Log In flow's since 2026-11-20, every flow's since
            2026-11-23 (Afsana). */}
        <V3CardBack onBack={() => setRequesting(false)} />
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
        <div style={HEAD}>
          <h2 id="verify-email-title" style={TITLE}>
            Reset your password
          </h2>
          <div aria-hidden style={RULE} />
          <p id="verify-email-lead" style={LEAD}>
            Enter your email and we’ll send you a link to reset your password.
          </p>
        </div>
        <div style={FIELD_AND_ERROR}>
          <label htmlFor="reset-request-email" style={FIELD_GROUP}>
            <span style={FIELD_LABEL}>
              Email <span aria-hidden>*</span>
            </span>
            <input
              id="reset-request-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              aria-invalid={badResetEmail}
              aria-describedby={badResetEmail ? 'reset-request-invalid' : undefined}
              className="cre-e2e-input cre-e2e-input-v3"
              style={FIELD}
            />
          </label>
          {badResetEmail ? <EmailInvalid id="reset-request-invalid" /> : null}
        </div>
        {/* Send reset link, primary; then "Can't log in? Contact us", the
            card's last line. Forgot Email? and its sentence went on
            2026-11-23 (Afsana) for Contact us, and Back to sign in for ←
            Back. */}
        <div style={ACTIONS}>
          <button type="submit" className="cre-e2e-cta" disabled={!valid} aria-disabled={!valid} style={valid ? CTA : CTA_OFF}>
            Send reset link
          </button>
        </div>
        <ContactUsLine />
        {/* The demo fill — the same invisible, labelled corner as the email
            step's. */}
        <button
          type="button"
          aria-label="Fill in the demo learner’s email"
          title="Demo shortcut: fill in the demo learner’s email"
          style={DEMO_FILL}
          onClick={() => setResetEmail(E2E_LEARNER_EMAIL)}
        />
      </form>
    )
  }
  if (resetSent) {
    return (
      <div
        style={{ ...BODY, cursor: 'pointer' }}
        title="Demo: click to follow the reset link"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest('button')) openResetLink()
        }}
      >
        {/* ← Back in place of Back to sign in (2026-11-23, Afsana). */}
        <V3CardBack onBack={() => setResetSent(false)} />
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
        <div style={HEAD}>
          <h2 id="verify-email-title" style={TITLE}>
            Check your email
          </h2>
          <div aria-hidden style={RULE} />
          <p id="verify-email-lead" style={LEAD}>
            We sent a password reset link to <strong style={{ fontWeight: 800 }}>{resetEmail.trim()}</strong>. Follow the
            instructions in the email to reset your password. Be sure to check your spam or junk folders.
          </p>
        </div>
        {/* No Email field — the lead already names the address (2026-11-19,
            Afsana). From 2026-11-13 it sat here, grey and locked. */}
        {/* Resend link, primary. ← Back above is the way out — the modal has
            no ✕ (Back to sign in, under Resend link, until 2026-11-23). */}
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
            <p role="timer" aria-live="off" style={NOTE}>
              You can resend the link in {formatCountdown(linkWait)}
            </p>
          )}
        </div>
        {/* Demo only — the email's link, so a reviewer can find the reset
            page without knowing the whole modal is clickable.
            `data-demo-only`: the screenshot scripts hide it, so the pictures
            developers read show the design alone (2026-11-19, Afsana). */}
        <p data-demo-only style={{ ...NOTE, textAlign: 'center' }}>
          Demo:{' '}
          <button type="button" className="cre-e2e-textlink" style={TEXT_LINK} onClick={openResetLink}>
            open the reset link in a new tab
          </button>
        </p>
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
      {onBack ? <V3CardBack onBack={onBack} /> : null}
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <div style={HEAD}>
        <h2 id="verify-email-title" style={TITLE}>
          {title}
        </h2>
        <div aria-hidden style={RULE} />
        {/* The address goes in the locked field below, on every flow
            (2026-11-18, Afsana). From 2026-11-03 it was bold in this sentence
            on all but Direct Email. */}
        {lead === null ? null : (
          <p id="verify-email-lead" style={LEAD}>
            {lead}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* The address from the email step, pre-filled and locked — the
            checkout's grey, no lock icon — on every flow (2026-11-18,
            Afsana). */}
        {showEmail ? (
          <div style={FIELD_AND_ERROR}>
            <label htmlFor="login-email" style={FIELD_GROUP}>
              <span style={FIELD_LABEL}>
                Email <span aria-hidden>*</span>
              </span>
              <input
                id="login-email"
                type="email"
                value={email}
                disabled
                readOnly
                className="cre-e2e-input cre-e2e-input-v3"
                style={{ ...FIELD, ...FIELD_DISABLED }}
              />
            </label>
          </div>
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
                /* No red stroke on a wrong password either — the line under it is
                   enough (2026-11-18, Afsana). */
                style={{ ...FIELD, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShown((v) => !v)}
                aria-label={shown ? 'Hide password' : 'Show password'}
                aria-pressed={shown}
                style={EYE_ACCOUNT}
              >
                <PasswordEyeV3 slashed={shown} />
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
              setResetEmail('')
              setRequesting(true)
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
      {/* "Can't log in? Visit our help center" was here from 2026-11-13; it
          went on 2026-11-23 (Afsana) — Reset your password's Contact us is
          the way out now. */}
    </form>
  )
}

/** KEYCLOAK'S LOG-IN WIDGET, ON A PAGE — 2026-11-20, Afsana: the Log In
 *  flow's Atlas arm. Swati (2026-11-18): it "needs to match the keycloak
 *  widget", so it IS the checkout modal's Log in step — the same form, eye,
 *  wrong password and Forgot password? — on a card of its own, then the
 *  modal's "Signing you in". Like the checkout's, it greets the learner by
 *  name and shows the address given on OCD's page, locked; unlike it, ← Back
 *  in the corner (2026-11-23, Afsana). */
export function KeycloakLogInCardV3({
  email,
  onSignedIn,
  onBack,
}: {
  email: string
  onSignedIn: () => void
  onBack: () => void
}) {
  const [signingIn, setSigningIn] = useState(false)
  useEffect(() => {
    if (!signingIn) return
    const timer = window.setTimeout(onSignedIn, LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [signingIn, onSignedIn])
  return (
    <section
      aria-labelledby={signingIn ? undefined : 'verify-email-title'}
      aria-label={signingIn ? 'Signing you in' : undefined}
      style={{ ...MODAL, maxHeight: 'none', overflowY: 'visible' }}
    >
      {signingIn ? (
        <V3CardSigningIn />
      ) : (
        /* The checkout's Log in to continue, as Afsana asked on 2026-11-23: a
           welcome line and the address locked in its field — with ← Back
           kept, to change it on the email step. (2026-11-20 to 11-23 it had
           neither.) */
        <LoginStep
          email={email}
          title="Log in"
          lead={`Welcome back, ${E2E_LEARNER_FIRST}! Enter your password.`}
          onBack={onBack}
          onLoggedIn={() => setSigningIn(true)}
        />
      )}
    </section>
  )
}

/** "Can't log in? Contact us" — XCEL's contact page in a new tab, at the foot
 *  of Reset your password (2026-11-23, Afsana; it was "Visit our help
 *  center", drawn only, on Log in). */
function ContactUsLine() {
  return (
    <p style={{ ...NOTE, textAlign: 'center', alignSelf: 'stretch' }}>
      Can’t log in?{' '}
      <a
        href={XCEL_CONTACT_US}
        target="_blank"
        rel="noopener noreferrer"
        className="cre-e2e-textlink"
        style={{ ...TEXT_LINK, color: 'var(--color-xcel-brick)', textDecoration: 'none' }}
      >
        Contact us
        <span style={VISUALLY_HIDDEN}> (opens in a new tab)</span>
      </a>
    </p>
  )
}

/** RESET YOUR PASSWORD, ON ITS OWN PAGE — 2026-11-19, Afsana: the reset
 *  link in the email opens a page in a new tab, not a step of the checkout
 *  modal. The card is the modal's card, so the form, the rules and the eyes
 *  are the same ones; `ResetPasswordPageV3` centres it under a header.
 *  Reset password turns the card into Password reset: Email verified's green
 *  check and "Your password has been successfully reset!". No XCEL logo in
 *  either — the page's header carries it. */
export function ResetPasswordCardV3({ email }: { email: string }) {
  const [done, setDone] = useState(false)
  return (
    <section aria-labelledby="verify-email-title" style={{ ...MODAL, maxHeight: 'none', overflowY: 'visible' }}>
      {done ? <PasswordResetDone /> : <ResetPasswordStep email={email} onReset={() => setDone(true)} />}
    </section>
  )
}

/** Password reset — Email verified's layout and check, without its logo
 *  (2026-11-19, Afsana). */
function PasswordResetDone() {
  return (
    <div style={VERIFIED} role="status">
      {/* No logo — the page's header carries it (2026-11-19, Afsana). */}
      <span aria-hidden style={VERIFIED_RING}>
        <Check size={24} style={{ stroke: 'currentColor', strokeWidth: 28 }} />
      </span>
      <h2 id="verify-email-title" style={RESET_DONE_LINE}>
        Your password has been successfully reset!
      </h2>
    </div>
  )
}

/** "Reset your password" — 2026-11-12, Afsana. On its own page since
 *  2026-11-19 (above). The same meter and seven rules as the password
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
      {/* No logo — the page's header carries it (2026-11-19, Afsana). */}
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
            New Password <span aria-hidden>*</span>
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
              aria-label={shown ? 'Hide new password' : 'Show new password'}
              aria-pressed={shown}
              style={EYE_ACCOUNT}
            >
              <PasswordEyeV3 slashed={shown} />
            </button>
          </span>
        </label>
        <InvitePasswordChecklistV3 password={password} username={email.trim()} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="reset-confirm" style={FIELD_GROUP}>
            <span style={FIELD_LABEL}>
              Confirm New Password <span aria-hidden>*</span>
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
                /* No red stroke — the line under it is enough (2026-11-18,
                   Afsana). */
                style={{ ...FIELD, paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setConfirmShown((v) => !v)}
                aria-label={confirmShown ? 'Hide confirm new password' : 'Show confirm new password'}
                aria-pressed={confirmShown}
                style={EYE_ACCOUNT}
              >
                <PasswordEyeV3 slashed={confirmShown} />
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

/** XCEL's contact page — the Log In flow's "Can't log in? Contact us". */
const XCEL_CONTACT_US = 'https://www.xcelsolutions.com/contact-us'

const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
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

/* Password reset's line: smaller than a title and not bold (2026-11-19,
   Afsana) — 16px regular, a step above the 14px body. */
const RESET_DONE_LINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 400,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
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

/* The fields themselves take no stroke — email, password and confirm show
   only the red line under them (2026-11-18, Afsana). The code boxes keep it. */

/* A field with its error line under it, 6px apart — as the password's. */
const FIELD_AND_ERROR: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

/** The email fields' inline error — shown as the learner types, while what
 *  is there is not an address (2026-11-13, Afsana). */
function EmailInvalid({ id }: { id: string }) {
  return (
    <p id={id} role="alert" style={INVALID}>
      Please enter a valid email address
    </p>
  )
}

/* The card's buttons, stacked. */
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

/* Every password eye in V3 is Keycloak's, as on Change Password in Account
   Details (2026-11-19, Afsana: "all eye icons should match in the password
   fields" … "not supposed to have a pupil") — `PasswordEyeV3`, in the
   secondary text colour, always visible. Centred on the field rather than
   pinned at a top offset, so the 20px drawing sits mid-field. */
const EYE_ACCOUNT: CSSProperties = {
  ...EYE,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-text-secondary)',
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

const VERIFIED: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  padding: '16px 0 12px',
  textAlign: 'center',
}

const VERIFIED_RING: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 56,
  height: 56,
  borderRadius: '50%',
  border: '2px solid var(--color-success-600)',
  background: 'var(--color-e2e-verified-fill)',
  color: 'var(--color-success-600)',
}

const SIGNING_IN: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
  padding: '4px 0 20px',
}

/** The card's title, grey rule and lead, for a card drawn outside this file —
 *  OCD's log-in page on the Log In flow (2026-11-20, Afsana: "add the 'Log in'
 *  header and the grey line under it that exist in the keycloak widget to
 *  maintain consistency"). The same objects, so the two cannot drift. */
export function V3CardHead({ title, lead }: { title: string; lead?: string }) {
  return (
    <div style={HEAD}>
      <h1 style={TITLE}>{title}</h1>
      <div aria-hidden style={RULE} />
      {lead ? <p style={LEAD}>{lead}</p> : null}
    </div>
  )
}

/** ← Back, in a card's top left corner — the Log In flow's way back to the
 *  email step to change the address (2026-11-20, Afsana). ⚠ ITS OWN ROW, the
 *  first in the card, above the logo — not laid over the logo's row: Afsana,
 *  the same day, "a bit more space between the row that contains the back
 *  link and the row that contains the centered xcel logo". The card's gap is
 *  that space. */
export function V3CardBack({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} style={CARD_BACK}>
      <ArrowLeft size={14} aria-hidden />
      Back
    </button>
  )
}

const CARD_BACK: CSSProperties = {
  /* Left, in a column that centres; pulled up and out by its own padding so
     it sits where it did in the corner (20 in from the top and side). */
  alignSelf: 'flex-start',
  margin: '-16px 0 0 -16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 6px',
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  /* The brick of the card's Log in button (2026-11-20, Afsana: "the back
     button with the arrow should be red"). */
  color: 'var(--color-xcel-brick-600)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
}

/** The card's text field — rounded, the light fill, Avenir — for a card drawn
 *  outside this file: OCD's log-in page on the Log In flow (2026-11-20, Afsana:
 *  "the same field design (rounded corners) as the keycloak fields"). `locked`
 *  is the grey of an address already given. */
export function V3CardInput({ locked = false, ...input }: InputHTMLAttributes<HTMLInputElement> & { locked?: boolean }) {
  return (
    <input
      {...input}
      readOnly={locked || input.readOnly}
      className="cre-e2e-input cre-e2e-input-v3"
      style={locked ? { ...FIELD, ...FIELD_DISABLED } : FIELD}
    />
  )
}

/** The card's primary button — full width, the brick, grey and off until
 *  `ready` — for the same card (2026-11-20, Afsana: Continue "match the
 *  styling of the log in button"). */
export function V3CardSubmit({ ready, children }: { ready: boolean; children: ReactNode }) {
  return (
    <div style={ACTIONS}>
      <button type="submit" className="cre-e2e-cta" disabled={!ready} aria-disabled={!ready} style={ready ? CTA : CTA_OFF}>
        {children}
      </button>
    </div>
  )
}

/** "Signing you in" — the logo over the spinner, as the checkout modal holds
 *  on — for a card drawn outside this file: OCD's, after the right password
 *  on the Log In flow (2026-11-20, Afsana), and Keycloak's above. */
export function V3CardSigningIn() {
  return (
    <div style={SIGNING_IN}>
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={CODE_LOGO} />
      <XcelLoadingStatus message="Signing you in" size={SIGNING_SPINNER} />
    </div>
  )
}
