import { useCallback, useId, useState, type CSSProperties } from 'react'
import { InvitePasswordChecklistV3 } from '@/components/e2e/InvitePasswordChecklistV3'
import { meetsInvitePasswordRulesV3 } from '@/data/invitePasswordRulesV3'
import { ForgotPasswordModal } from './ForgotPasswordModal'
import { PanelFooter } from './profileFormBits'
import { introTextStyle, panelBodyStyle } from './profileFormStyles'

/**
 * KEYCLOAK'S "CHANGE PASSWORD" — 2026-11-12, Afsana. Update Password on the
 * Edit Account Details sheet embeds Keycloak's Change Password widget as its
 * Update Password step, the way Update Email Address sits in the sheet: the
 * account's password lives in Keycloak, so the product hands the change to
 * Keycloak's widget rather than drawing a form of its own. Behind
 * `account-keycloak-change-password`; off is the sheet's own step, as it stood.
 *
 * ⚠ ONE ARM SINCE 2026-11-13 (Afsana: "we do not need side panel (current)
 * and keycloak modal anymore"). The control briefly offered a modal and the
 * old side panel beside this embed; the modal's dialog, logo and scrim are in
 * this file's history (commit 28910263), not in the tree.
 *
 * ⚠ THE RULES AND THE STRENGTH BAR ARE THE INVITE FLOW'S, not the sheet's.
 * Under New Password sits `InvitePasswordChecklistV3`, the block a learner
 * sees the first time they set a password — one policy, drawn the same way
 * wherever a password is set. The sheet's older list (`passwordRequirements`)
 * is left alone; it is what the flag's off state still shows.
 *
 * ⚠ THE BUTTONS ARE THE DESIGN SYSTEM'S, not Keycloak's brick (2026-11-13,
 * Afsana: "match the established design system by jill … the update email
 * panel"). It ends in the sheet's own `PanelFooter` on the neutral band, as
 * Update Email Address does — but Cancel first and the primary reading Save
 * Password (2026-11-13, Afsana: "switch the location … change the 'change
 * password' text to 'save password'").
 *
 * ⚠ NO HEADING OF ITS OWN (2026-11-13, Afsana). The sheet's title already
 * says Update Password, so a second "Change Password" and its rule would name
 * the step twice; the lead sits in the sheet step's own size (2026-11-16,
 * Afsana: it now says what to do rather than the old security line).
 *
 * ⚠ NO SIGN-OUT (2026-11-19, Afsana: "we are not logging them out after
 * they have changed their password"). The open item is closed: a change
 * closes the sheet and toasts, and the learner stays signed in. The
 * signed-out card and its `account-password-change-outcome` control are in
 * this file's history, not in the tree.
 *
 * It reads the passwords and never keeps them past close — nothing here
 * stores or logs a value.
 */
export function KeycloakChangePassword({
  email,
  onChanged,
  onCancel,
}: {
  /** The learner's email — what "be different from email" compares against. */
  email: string
  /** Called on a successful change. */
  onChanged: () => void

  onCancel: () => void
}) {
  const id = useId()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const closeForgot = useCallback(() => setForgotOpen(false), [])

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
    onChanged()
  }

  return (
    <>
      <form
        style={panelBodyStyle}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <p style={introTextStyle}>
          Enter your current password and create a new one that meets the requirements below.
        </p>

        {/* Forgot password? — 2026-11-19, Afsana: under Current Password as on
            the sheet's own step, but in the invite flow's blue link (`FORGOT`
            in `VerifyEmailModalV3`), not the old step's red, and no lock.
            From 2026-11-20 it opens V3's Reset your password, then Check your
            email (`ForgotPasswordModal`), in Atlas's button colours. */}
        <div style={FIELD_STACK}>
          <PasswordField
            id={`${id}-current`}
            label="Current Password"
            placeholder="Enter current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <button type="button" style={FORGOT} onClick={() => setForgotOpen(true)}>
            Forgot password?
          </button>
        </div>

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
      </form>
      <PanelFooter
        saveLabel="Save Password"
        saveDisabled={!canSubmit}
        onSave={submit}
        onCancel={onCancel}
        cancelFirst
      />
      {forgotOpen ? <ForgotPasswordModal onClose={closeForgot} /> : null}
    </>
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
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
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
          <KeycloakEye slashed={shown} />
        </button>
      </div>
    </div>
  )
}

/**
 * KEYCLOAK'S EYE, 1:1 (2026-11-19, Afsana: "match the eye icon 1:1 … there
 * is no need for a pupil"). An almond outline round a hollow ring — no filled
 * pupil, which is why it is drawn here rather than taken from `@/icons`
 * (Font Awesome's eye has one). Open while the password is hidden; slashed
 * once it is shown.
 */
function KeycloakEye({ slashed }: { slashed: boolean }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden style={{ display: 'block' }}>
      <path
        d="M2 12c2.2-4.4 5.9-7 10-7s7.8 2.6 10 7c-2.2 4.4-5.9 7-10 7s-7.8-2.6-10-7Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={12} r={3.25} stroke="currentColor" strokeWidth={2} />
      {slashed ? <path d="M4 4l16 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" /> : null}
    </svg>
  )
}

/* ── Styles — Invite Flow V3's field register (`VerifyEmailModalV3`) ────── */

const FIELD_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

/* The invite flow's link (`FORGOT` in `VerifyEmailModalV3`), colour and all. */
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
  top: 12,
  display: 'inline-flex',
  color: 'var(--color-text-secondary)',
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
