import { useState, type CSSProperties, type ReactNode } from 'react'
import { Eye, EyeSlash } from '@/icons'
import { Button } from '@/components/ui/Button'

/**
 * The form furniture shared by the three Profile edit panels — labels, inputs,
 * the password field's show/hide, and the sheet footer.
 *
 * Extracted because the alternative is three copies: Update Password, Update
 * Email Address and Edit Personal Information all use the same label weight,
 * the same 40px input and the same two-button footer band, and the first thing
 * that drifts between copies is the error state.
 *
 * Styles are lifted from `AddCustomEventPanel`'s field set (the repo's existing
 * form panel) so a Profile form and a Study Calendar form look like the same
 * product. Tokens only.
 */

/* ─── Field ────────────────────────────────────────────────────────────── */

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} style={fieldLabelStyle}>
        {label}
      </label>
      {children}
    </div>
  )
}

/* ─── Text input ───────────────────────────────────────────────────────── */

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'date'
  invalid?: boolean
  describedBy?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-required="true"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      style={{
        ...textInputStyle,
        ...(type === 'date' ? { colorScheme: 'light' } : null),
        ...(invalid ? invalidRing : null),
      }}
    />
  )
}

/* ─── Password input, with its own show/hide ───────────────────────────── */

/**
 * ⚠ THE TOGGLE IS PER-FIELD AND PER-FIELD STATE LIVES HERE, not in the panel.
 * Three password fields sharing one `visible` boolean would reveal all three at
 * once, which is exactly what someone shoulder-checking one field does not
 * want.
 *
 * The button only exists once the field has content: an empty field has nothing
 * to reveal, and an always-present toggle reads as a control that does nothing.
 */
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  label,
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  /** Names the field in the toggle's accessible label ("Show New Password"). */
  label: string
  invalid?: boolean
  describedBy?: string
}) {
  const [visible, setVisible] = useState(false)
  const hasText = value.length > 0
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        /* Flipping `type` rather than a CSS trick: it is what turns off the
           browser's own dot-masking, and it keeps the field a real password
           input for managers and autofill while it is hidden. */
        type={visible && hasText ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required="true"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        style={{
          ...textInputStyle,
          paddingRight: hasText ? 44 : 12,
          ...(invalid ? invalidRing : null),
        }}
      />
      {hasText && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
          aria-pressed={visible}
          style={revealButtonStyle}
        >
          {visible ? <EyeSlash size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      )}
    </div>
  )
}

/* ─── Inline error ─────────────────────────────────────────────────────── */

/**
 * `aria-live="polite"` and ALWAYS MOUNTED. A live region that is added to the
 * DOM at the same moment it gains text is not reliably announced — the region
 * has to already exist for the change to be a change. So the element stays and
 * only its contents come and go.
 */
export function InlineError({ id, message }: { id: string; message: string | null }) {
  return (
    <p id={id} role="alert" aria-live="polite" style={errorTextStyle}>
      {message ?? ''}
    </p>
  )
}

/* ─── Footer ───────────────────────────────────────────────────────────── */

/**
 * Primary + secondary, both `flex: 1`, on the neutral band — the same footer
 * `MotivationalStatementPanel` draws.
 *
 * NOTE: no hand-rolled disabled styling. `Button` already paints its own muted
 * state (see the `...(disabled && …)` block in `ui/Button.tsx`); the older
 * panel duplicates it inline, and copying that here would mean two places to
 * change when the disabled token moves.
 */
export function PanelFooter({
  saveLabel = 'Save Changes',
  saveDisabled,
  onSave,
  onCancel,
}: {
  saveLabel?: string
  saveDisabled: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <footer style={footerStyle}>
      <Button variant="primary" size="md" disabled={saveDisabled} onClick={onSave} style={footerButtonStyle}>
        {saveLabel}
      </Button>
      <Button variant="secondary" size="md" onClick={onCancel} style={footerButtonStyle}>
        Cancel
      </Button>
    </footer>
  )
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const fieldLabelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const textInputStyle: CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  /* LONG-FORM, NOT THE `border` SHORTHAND — the same fix, for the same reason,
     as the note in `ui/Button.tsx`. `invalidRing` below overrides `borderColor`
     alone; mixed with a shorthand, React warns on every rerender that clears
     the error state ("Removing a style property during rerender … can lead to
     styling bugs") and the cleared colour is not reliably restored. */
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  boxSizing: 'border-box',
}

/* Border AND a matching inset ring: a 1px colour swap alone is easy to miss
   next to the neutral border, and thickening the real border would shift the
   input by a pixel. */
const invalidRing: CSSProperties = {
  borderColor: 'var(--color-error-500)',
  boxShadow: 'inset 0 0 0 1px var(--color-error-500)',
}

const revealButtonStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  height: 40,
  width: 40,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  padding: 0,
}

const errorTextStyle: CSSProperties = {
  margin: '6px 0 0',
  minHeight: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-error-600)',
}

const footerStyle: CSSProperties = {
  padding: '20px 24px',
  background: 'var(--color-neutral-light)',
  display: 'flex',
  gap: 20,
}

const footerButtonStyle: CSSProperties = {
  flex: 1,
  height: 52,
  padding: '12px 24px',
  borderRadius: 'var(--radius-md)',
  fontSize: 16,
  lineHeight: '28px',
}
