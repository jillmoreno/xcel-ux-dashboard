import { useEffect, useId, useRef, useState, type CSSProperties, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheckSolid, X } from '@/icons'
import { InvitePasswordChecklistV3 } from '@/components/e2e/InvitePasswordChecklistV3'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'
import { meetsInvitePasswordRulesV3 } from '@/data/invitePasswordRulesV3'

/**
 * KEYCLOAK'S "CHANGE PASSWORD" — 2026-11-12, Afsana. Update Password on the
 * Edit Account Details sheet opens this modal instead of the sheet's own
 * Update Password step: the account's password lives in Keycloak, so the
 * product hands the change to Keycloak's widget rather than drawing a form
 * of its own. Behind `account-keycloak-change-password` — its `modal` arm here,
 * its `inline` arm as `KeycloakChangePassword` inside the sheet.
 *
 * ⚠ THE RULES AND THE STRENGTH BAR ARE THE INVITE FLOW'S, not the sheet's.
 * Under New Password sits `InvitePasswordChecklistV3`, the block a learner
 * sees the first time they set a password — one policy, drawn the same way
 * wherever a password is set. The sheet's older list (`passwordRequirements`)
 * is left alone; it is what the flag's `sheet` arm still shows.
 *
 * ⚠ OPEN ITEM — WHAT HAPPENS AFTER A SUCCESSFUL CHANGE. Nobody yet knows
 * whether the learner stays signed in or is signed out to sign back in with
 * the new password. Both are drawn, picked by the design control
 * `account-password-change-outcome`: `stay` closes and toasts (via
 * `onChanged`); `sign-out` swaps the form for a signed-out card. Retire the
 * losing arm once it is decided.
 *
 * It reads the passwords and never keeps them past close — nothing here
 * stores or logs a value.
 */
export type PasswordChangeOutcome = 'stay' | 'sign-out'

type Props = {
  open: boolean
  onClose: () => void
  /** The learner's email — what "be different from email" compares against. */
  email: string
  outcome: PasswordChangeOutcome
  /** Called on a successful change when the learner stays signed in. */
  onChanged: () => void
}

export function ChangePasswordModal({ open, onClose, email, outcome, onChanged }: Props) {
  if (!open) return null
  /* Mounted only while open, so every open starts with empty fields. */
  return <ChangePasswordDialog onClose={onClose} email={email} outcome={outcome} onChanged={onChanged} />
}

function ChangePasswordDialog({ onClose, email, outcome, onChanged }: Omit<Props, 'open'>) {
  const id = useId()
  const layer = useV3DialogLayer()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ ...SCRIM, ...layer.scrim }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        style={{ ...MODAL, ...layer.card }}
      >
        <button type="button" aria-label="Close" onClick={onClose} style={CLOSE}>
          <X size={18} aria-hidden />
        </button>
        <KeycloakChangePassword
          titleId={`${id}-title`}
          email={email}
          outcome={outcome}
          onChanged={onChanged}
          onCancel={onClose}
          showLogo
          autoFocus
        />
      </div>
    </div>,
    document.body,
  )
}

/**
 * THE WIDGET ITSELF — the modal's contents, and also what the Edit Account
 * Details sheet embeds as its Update Password step on the `inline` arm
 * (2026-11-13, Afsana: "embedded inline, just like … update email address").
 *
 * ⚠ ONE FORM FOR BOTH ARMS, so the modal and the embed cannot drift — the
 * comparison is about where Keycloak's widget sits, not two copies of it.
 * What differs is the frame's: the modal brings the XCEL mark, the close ✕
 * and Escape; the sheet already says XCEL around it and owns Escape and
 * Back, so the embed has no logo and no listener of its own.
 */
export function KeycloakChangePassword({
  titleId,
  email,
  outcome,
  onChanged,
  onCancel,
  showLogo = false,
  autoFocus = false,
}: {
  titleId: string
  email: string
  outcome: PasswordChangeOutcome
  onChanged: () => void
  /** Cancel, and Sign In on the signed-out card. */
  onCancel: () => void
  showLogo?: boolean
  autoFocus?: boolean
}) {
  const id = useId()
  const firstField = useRef<HTMLInputElement | null>(null)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [signedOut, setSignedOut] = useState(false)

  useEffect(() => {
    if (autoFocus) firstField.current?.focus()
  }, [autoFocus])

  /* Keycloak refuses a new password equal to the current one; say so here
     rather than after submit. */
  const sameAsCurrent = next.length > 0 && current.length > 0 && next === current
  const confirmMismatch = confirm.length > 0 && confirm !== next
  const canSubmit =
    current.length > 0 &&
    meetsInvitePasswordRulesV3(next, email) &&
    !sameAsCurrent &&
    confirm === next

  const submit = () => {
    if (!canSubmit) return
    console.info('account:keycloak-change-password')
    if (outcome === 'sign-out') setSignedOut(true)
    else onChanged()
  }

  const logo = showLogo ? (
    <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
  ) : null

  if (signedOut) {
    return (
      <div style={BODY}>
        {logo}
        <span aria-hidden style={DONE_GLYPH}>
          <CircleCheckSolid size={40} />
        </span>
        <div style={HEAD}>
          <h2 id={titleId} style={TITLE}>
            Password changed
          </h2>
          <div aria-hidden style={RULE} />
          <p style={LEAD}>
            For your security, we've signed you out. Sign in again with your new password.
          </p>
        </div>
        <button type="button" onClick={onCancel} style={CTA}>
          Sign In
        </button>
      </div>
    )
  }

  return (
    <form
      style={BODY}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {logo}
      <div style={HEAD}>
        <h2 id={titleId} style={TITLE}>
          Change Password
        </h2>
        <div aria-hidden style={RULE} />
        <p style={LEAD}>Enter your current password and choose a new one.</p>
      </div>

      <PasswordField
        id={`${id}-current`}
        label="Current Password"
        placeholder="Enter current password"
        value={current}
        onChange={setCurrent}
        inputRef={firstField}
        autoComplete="current-password"
      />

      <div style={FIELD_STACK}>
        <PasswordField
          id={`${id}-new`}
          label="New Password"
          placeholder="Enter new password"
          value={next}
          onChange={setNext}
          autoComplete="new-password"
          invalid={sameAsCurrent}
          describedBy={`${id}-new-rules ${id}-new-error`}
        />
        <p id={`${id}-new-error`} role="alert" aria-live="polite" style={ERROR}>
          {sameAsCurrent ? 'Your new password must be different from your current password.' : ''}
        </p>
        <div id={`${id}-new-rules`}>
          <InvitePasswordChecklistV3 password={next} username={email} />
        </div>
      </div>

      <div style={FIELD_STACK}>
        <PasswordField
          id={`${id}-confirm`}
          label="Confirm New Password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={confirmMismatch}
          describedBy={`${id}-confirm-error`}
        />
        <p id={`${id}-confirm-error`} role="alert" aria-live="polite" style={ERROR}>
          {confirmMismatch ? 'Both passwords must match.' : ''}
        </p>
      </div>

      <div style={ACTIONS}>
        <button type="submit" disabled={!canSubmit} style={canSubmit ? CTA : CTA_OFF}>
          Change Password
        </button>
        <button type="button" onClick={onCancel} style={CTA_SECONDARY}>
          Cancel
        </button>
      </div>
    </form>
  )
}

/**
 * Keycloak's field: the eye is always there, empty or not, which is where it
 * differs from the sheet's `PasswordInput`. Per-field state, so revealing one
 * field reveals only that one.
 */
function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  inputRef,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  inputRef?: Ref<HTMLInputElement>
  autoComplete: string
  invalid?: boolean
  describedBy?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div style={FIELD_GROUP}>
      <label htmlFor={id} style={FIELD_LABEL}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          style={{ ...FIELD, ...(invalid ? FIELD_INVALID : null) }}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={`${shown ? 'Hide' : 'Show'} ${label}`}
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
      </div>
    </div>
  )
}

/* ── Styles — Invite Flow V3's dialog register (`VerifyEmailModalV3`) ───── */

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
  top: 16,
  right: 16,
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const BODY: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20, width: '100%', margin: 0 }

/* The XCEL mark centred over the heading and the short rule under it, as on
   every V3 dialog (`CODE_LOGO` and `RULE` in `VerifyEmailModalV3`). */
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
  color: 'var(--color-text-secondary)',
}

const FIELD_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

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
  height: 44,
  padding: '0 40px 0 12px',
  borderRadius: 4,
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  border: '1px solid var(--color-e2e-card-outline)',
}

const FIELD_INVALID: CSSProperties = { boxShadow: 'inset 0 -2px 0 var(--color-error-600)' }

const EYE: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: 13,
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

/* Always mounted so the live region announces; empty takes no room. */
const ERROR: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-error-600)',
}

const ACTIONS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }

const CTA: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 26px',
  borderRadius: 3,
  border: '1px solid var(--color-xcel-brick-600)',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: '0.02em',
  cursor: 'pointer',
}

const CTA_SECONDARY: CSSProperties = {
  ...CTA,
  background: 'var(--color-fixed-light)',
  color: 'var(--color-xcel-brick-600)',
}

const CTA_OFF: CSSProperties = {
  ...CTA,
  border: '1px solid var(--color-e2e-form-locked)',
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

const DONE_GLYPH: CSSProperties = {
  display: 'inline-flex',
  alignSelf: 'flex-start',
  color: 'var(--color-success-700)',
}
