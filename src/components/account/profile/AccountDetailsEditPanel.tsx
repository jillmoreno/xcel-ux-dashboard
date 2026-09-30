import { useId, useState, type CSSProperties } from 'react'
import { ArrowLeft, Check, Envelope, Lock, Plus, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { Toast } from '@/components/ui/Toast'
import { ActionRow, ActionRowGroup } from '@/components/ui/ActionRow'
import { Field, InlineError, PanelFooter, PasswordInput, TextInput } from './profileFormBits'
import { introTextStyle, panelBodyStyle } from './profileFormStyles'
import {
  PASSWORD_REQUIREMENTS,
  PASSWORD_SUMMARY_MESSAGE,
  meetsAllRequirements,
  meetsSummarisedRules,
} from './passwordRequirements'

/**
 * The Account Details pencil — a hub-and-detail sheet replacing the blank
 * `ProfileEditStubPanel` for this one card.
 *
 * ONE SHEET, THREE VIEWS (`choose` → `password` / `email`). It is the shape
 * `CourseDetailsPanel` already uses for its two-view sheet, and the reason is
 * the same: closing one container and opening another reads as "that failed,
 * here is something else", and the second sheet animates in from the edge the
 * first just left.
 *
 * ⚠ EVERY DISMISS GESTURE INSIDE A SUB-STEP GOES BACK, NOT OUT. Escape, the
 * backdrop and the header button all resolve to the same handler, so a learner
 * halfway through changing a password cannot land back on the Profile page by
 * pressing Escape once. Only Cancel in the footer closes outright — it is the
 * control that says so in words. See `dismiss` below.
 *
 * State is local and non-persistent, the pattern `InterestsCard` established:
 * a saved email updates the card immediately via `onEmailSaved` and is gone on
 * reload. There is no backend.
 */

type Step = 'choose' | 'password' | 'email'

type Props = {
  open: boolean
  onClose: () => void
  /** The email shown on the card — the "current" value both steps read. */
  currentEmail: string
  /** Lifts a saved email up to `AccountDetailsCard`'s local state. */
  onEmailSaved: (email: string) => void
}

export function AccountDetailsEditPanel({ open, onClose, currentEmail, onEmailSaved }: Props) {
  const [step, setStep] = useState<Step>('choose')
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null)

  /*
   * Reopening always starts at the chooser — without this the sheet reopens on
   * whichever sub-step it was closed from, which looks like it never closed.
   *
   * ADJUSTED DURING RENDER, not in an effect. React's own "adjusting state when
   * a prop changes" pattern: comparing against the previous `open` and setting
   * state in the render body makes React re-render immediately, BEFORE anything
   * paints, so the chooser is the first thing drawn. The `useEffect` version
   * this replaces painted the stale sub-step for a frame first, and tripped
   * `react-hooks/set-state-in-effect` for exactly that reason.
   */
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setStep('choose')
  }

  const dismiss = step === 'choose' ? onClose : () => setStep('choose')

  const title =
    step === 'password'
      ? 'Update Password'
      : step === 'email'
        ? 'Update Email Address'
        : 'Edit Account Details'

  const closeWithToast = (t: { title: string; body: string }) => {
    setToast(t)
    onClose()
  }

  return (
    <>
      <Sheet open={open} onClose={dismiss} title={title}>
        {/* `display: contents` so the wrapper carries the token override
            without becoming a flex item of the Sheet's panel — the header,
            divider, body and footer stay direct children as before. The class
            has to live in here rather than on the Profile page, because a Sheet
            portals to document.body and inherits nothing from that tree. */}
        <div className="cre-account-actions" style={{ display: 'contents' }}>
        <header style={headerStyle}>
          <button
            type="button"
            aria-label={step === 'choose' ? 'Close Edit Account Details panel' : 'Back to Edit Account Details'}
            onClick={dismiss}
            className="cre-sheet-close"
            style={closeButtonStyle}
          >
            {step === 'choose' ? <X size={14} aria-hidden /> : <ArrowLeft size={14} aria-hidden />}
            {step === 'choose' ? 'Close' : 'Back'}
          </button>
          <h2 style={titleStyle}>{title}</h2>
        </header>
        <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

        {step === 'choose' && <ChooserStep onPick={setStep} />}
        {step === 'password' && (
          <PasswordStep onCancel={onClose} onSaved={closeWithToast} />
        )}
        {step === 'email' && (
          <EmailStep
            currentEmail={currentEmail}
            onCancel={onClose}
            onSaved={(email) => {
              onEmailSaved(email)
              closeWithToast({ title: 'Email updated', body: `Your account email is now ${email}.` })
            }}
          />
        )}
        </div>
      </Sheet>

      {/* OUTSIDE the Sheet, and the panel stays mounted while `open` flips —
          the toast has to outlive the sheet that produced it. */}
      <Toast
        open={toast != null}
        onClose={() => setToast(null)}
        tone="success"
        title={toast?.title ?? ''}
        duration={3500}
      >
        {toast?.body ?? ''}
      </Toast>
    </>
  )
}

/* ─── Step 1 · chooser ─────────────────────────────────────────────────── */

/**
 * Rows, not tiles. Two square tiles side by side are the original mockup and
 * they do not reflow — at the sheet's narrow end they either shrink below a
 * comfortable tap target or stack into two big squares. A full-width row with
 * a detail line stacks natively and has room to say what each option does.
 */
function ChooserStep({ onPick }: { onPick: (s: Step) => void }) {
  return (
    <div style={panelBodyStyle}>
      <p style={introTextStyle}>What would you like to do?</p>
      <ActionRowGroup>
        <ActionRow
          Icon={Lock}
          label="Update Password"
          detail="Change the password you sign in with"
          onClick={() => onPick('password')}
        />
        <ActionRow
          Icon={Envelope}
          label="Update Email Address"
          detail="Update the email on your account"
          onClick={() => onPick('email')}
          last
        />
      </ActionRowGroup>
    </div>
  )
}

/* ─── Step 2 · Update Password ─────────────────────────────────────────── */

function PasswordStep({
  onCancel,
  onSaved,
}: {
  onCancel: () => void
  onSaved: (toast: { title: string; body: string }) => void
}) {
  const id = useId()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const summaryOk = meetsSummarisedRules(next)
  /* The inline error is for a password being TYPED, so it stays quiet on an
     empty field — an error under a field nobody has touched is noise. */
  const showSummaryError = next.length > 0 && !summaryOk
  const confirmMismatch = confirm.length > 0 && confirm !== next

  const canSave =
    current.length > 0 && meetsAllRequirements(next, current) && confirm.length > 0 && confirm === next

  const save = () => {
    /* ⚠ NO VALUE, NOT EVEN MASKED OR LENGTH-BEARING. This is a prototype with
       no backend; the stub exists to prove the action fired. Logging a length
       or a mask would still be logging something about a secret. */
    console.info('account:update-password')
    onSaved({ title: 'Password updated', body: 'Your password has been changed.' })
  }

  return (
    <>
      <div style={panelBodyStyle}>
        <p style={introTextStyle}>
          Security experts generally recommend against reuse of passwords you use on other sites.
        </p>

        <Field label="Current Password" htmlFor={`${id}-current`}>
          <PasswordInput
            id={`${id}-current`}
            label="Current Password"
            value={current}
            onChange={setCurrent}
            placeholder="Current password"
          />
        </Field>

        <button
          type="button"
          onClick={() => console.info('account:forgot-password')}
          className="cre-link-action"
          style={forgotLinkStyle}
        >
          <Lock size={14} aria-hidden />
          Forgot password?
        </button>

        <div>
          <Field label="New Password" htmlFor={`${id}-new`}>
            <PasswordInput
              id={`${id}-new`}
              label="New Password"
              value={next}
              onChange={setNext}
              placeholder="New password"
              invalid={showSummaryError}
              describedBy={`${id}-new-error`}
            />
          </Field>
          <InlineError id={`${id}-new-error`} message={showSummaryError ? PASSWORD_SUMMARY_MESSAGE : null} />
        </div>

        <div>
          <Field label="Confirm New Password" htmlFor={`${id}-confirm`}>
            <PasswordInput
              id={`${id}-confirm`}
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Confirm new password"
              invalid={confirmMismatch}
              describedBy={`${id}-confirm-error`}
            />
          </Field>
          <InlineError
            id={`${id}-confirm-error`}
            message={confirmMismatch ? 'Both passwords must match.' : null}
          />
        </div>

        <div>
          <h3 style={requirementsHeadingStyle}>Password Requirements</h3>
          <ul style={requirementsListStyle}>
            {PASSWORD_REQUIREMENTS.map((rule) => {
              const met = rule.test(next, current)
              return (
                <li key={rule.id} style={{ ...requirementRowStyle, color: met ? 'var(--color-success-700)' : 'var(--color-text-secondary)' }}>
                  {/* Icon AND colour AND the word itself: the icon swap is what
                      carries this to a screen reader and to anyone who cannot
                      separate the two tones, so neither signal is load-bearing
                      alone. The state is also spelled out in the `aria-label`. */}
                  <span aria-hidden style={requirementGlyphStyle}>
                    {met ? (
                      <Check size={14} />
                    ) : (
                      <Plus size={14} />
                    )}
                  </span>
                  <span>
                    {rule.label}
                    <span className="cre-sr-only">{met ? ' — met' : ' — not yet met'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <PanelFooter saveDisabled={!canSave} onSave={save} onCancel={onCancel} />
    </>
  )
}

/* ─── Step 3 · Update Email Address ────────────────────────────────────── */

/** Deliberately permissive — `something@something.tld` with no spaces. A
 *  prototype that rejects a real address is worse than one that accepts an
 *  implausible one, and the authority on an email's validity is the
 *  confirmation mail this prototype does not send. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

function EmailStep({
  currentEmail,
  onCancel,
  onSaved,
}: {
  currentEmail: string
  onCancel: () => void
  onSaved: (email: string) => void
}) {
  const id = useId()
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')

  const trimmed = next.trim()
  const shapeBad = next.length > 0 && !looksLikeEmail(next)
  const sameAsCurrent =
    next.length > 0 && trimmed.toLowerCase() === currentEmail.trim().toLowerCase()
  const nextError = shapeBad
    ? 'Enter a valid email address.'
    : sameAsCurrent
      ? 'This is already the email on your account.'
      : null
  const confirmMismatch = confirm.length > 0 && confirm.trim() !== trimmed

  const canSave =
    looksLikeEmail(next) && !sameAsCurrent && confirm.length > 0 && confirm.trim() === trimmed

  return (
    <>
      <div style={panelBodyStyle}>
        <div>
          <span style={currentEmailLabelStyle}>Current Email Address</span>
          <p style={currentEmailValueStyle}>{currentEmail}</p>
        </div>

        <div>
          <Field label="New Email Address" htmlFor={`${id}-new`}>
            <TextInput
              id={`${id}-new`}
              type="email"
              value={next}
              onChange={setNext}
              placeholder="New email address"
              invalid={nextError != null}
              describedBy={`${id}-new-error`}
            />
          </Field>
          <InlineError id={`${id}-new-error`} message={nextError} />
        </div>

        <div>
          <Field label="Confirm New Email Address" htmlFor={`${id}-confirm`}>
            <TextInput
              id={`${id}-confirm`}
              type="email"
              value={confirm}
              onChange={setConfirm}
              placeholder="Confirm new email address"
              invalid={confirmMismatch}
              describedBy={`${id}-confirm-error`}
            />
          </Field>
          <InlineError
            id={`${id}-confirm-error`}
            message={confirmMismatch ? 'Both email addresses must match.' : null}
          />
        </div>
      </div>
      <PanelFooter
        saveDisabled={!canSave}
        onSave={() => {
          console.info('account:update-email')
          onSaved(trimmed)
        }}
        onCancel={onCancel}
      />
    </>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 24px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const closeButtonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const forgotLinkStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: -8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-action)',
  cursor: 'pointer',
}

const requirementsHeadingStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const requirementsListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const requirementRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
}

const requirementGlyphStyle: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  marginTop: 1,
}

const currentEmailLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const currentEmailValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}
