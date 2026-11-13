import { useId, useState, type CSSProperties } from 'react'
import { CircleCheckSolid } from '@/icons'
import { InvitePasswordChecklistV3 } from '@/components/e2e/InvitePasswordChecklistV3'
import { meetsInvitePasswordRulesV3 } from '@/data/invitePasswordRulesV3'
import { Button } from '@/components/ui/Button'
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
 * the step twice; the lead is the sheet step's own line, in its own size.
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

export function KeycloakChangePassword({
  titleId,
  email,
  outcome,
  onChanged,
  onCancel,
}: {
  titleId: string
  /** The learner's email — what "be different from email" compares against. */
  email: string
  outcome: PasswordChangeOutcome
  /** Called on a successful change when the learner stays signed in. */
  onChanged: () => void
  /** Cancel, and Sign In on the signed-out card. */
  onCancel: () => void
}) {
  const id = useId()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [signedOut, setSignedOut] = useState(false)

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

  if (signedOut) {
    return (
      <div style={panelBodyStyle}>
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
        <Button variant="primary" size="md" onClick={onCancel} style={SIGN_IN_BUTTON}>
          Sign In
        </Button>
      </div>
    )
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
          Security experts generally recommend against reuse of passwords you use on other sites.
        </p>

        <PasswordField
          id={`${id}-current`}
          label="Current Password"
          placeholder="Enter current password"
          value={current}
          onChange={setCurrent}
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
      </form>
      <PanelFooter
        saveLabel="Save Password"
        saveDisabled={!canSubmit}
        onSave={submit}
        onCancel={onCancel}
        cancelFirst
      />
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

/* ── Styles — Invite Flow V3's field register (`VerifyEmailModalV3`) ────── */

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

/* The sheet footer's button size (`footerButtonStyle` in `profileFormBits`),
   so Sign In reads as the same button as Save Password. */
const SIGN_IN_BUTTON: CSSProperties = {
  width: '100%',
  height: 52,
  padding: '12px 24px',
  fontSize: 16,
  lineHeight: '28px',
}

const DONE_GLYPH: CSSProperties = {
  display: 'inline-flex',
  alignSelf: 'flex-start',
  color: 'var(--color-success-700)',
}
