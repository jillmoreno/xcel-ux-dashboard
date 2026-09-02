import { useState, type CSSProperties, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import {
  DEFAULT_PROTOTYPE_PASSWORD,
  getPrototypePassword,
  setPrototypePassword,
} from './prototypeLockUtil'

/**
 * Password gate shown when a visitor opens a locked landing-page tile. Checks
 * the entered value against the current prototype password; on a match it calls
 * `onUnlock` (the caller marks the tile unlocked + navigates). Mount it only
 * while the gate is open (the caller conditionally renders it) so its field
 * starts fresh each time.
 */
export function PrototypePasswordModal({
  featureTitle,
  onClose,
  onUnlock,
  password,
}: {
  featureTitle: string
  onClose: () => void
  onUnlock: () => void
  /** Gate-specific password. Omit to check against the shared, admin-settable
   *  prototype password (the behaviour every existing caller relies on). Set it
   *  when one tile or section needs its own password independent of that. */
  password?: string
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (value === (password ?? getPrototypePassword())) onUnlock()
    else setError(true)
  }

  return (
    <Modal open onClose={onClose} title="Enter password" width={420} disableBackdropClose>
      <form onSubmit={submit} style={formStyle}>
        <p style={hintStyle}>
          Enter the password to open <strong style={{ color: 'var(--color-text-primary)' }}>{featureTitle}</strong>.
        </p>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          aria-label="Prototype password"
          aria-invalid={error}
          placeholder="Password"
          style={{ ...inputStyle, borderColor: error ? 'var(--color-error-500)' : 'var(--color-border-subtle)' }}
        />
        {error && <span style={errorStyle}>Incorrect password — try again.</span>}
        <div style={actionsStyle}>
          <button type="button" onClick={onClose} style={ghostBtnStyle}>
            Cancel
          </button>
          <button type="submit" style={primaryBtnStyle}>
            Unlock
          </button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Admin tool to view / change the landing-page prototype password. Pre-fills
 * the current value; Save persists it, Reset restores the default. Mount it
 * only while open (the caller conditionally renders it).
 */
export function SetPrototypePasswordModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(() => getPrototypePassword())

  const save = (e: FormEvent) => {
    e.preventDefault()
    setPrototypePassword(value.trim())
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Prototype Password" width={440}>
      <form onSubmit={save} style={formStyle}>
        <p style={hintStyle}>
          Visitors must enter this to open a <strong style={{ color: 'var(--color-text-primary)' }}>locked</strong> prototype
          from the landing page. Each locked tile prompts once per browser session; unlocked tiles open without a password.
        </p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Prototype password"
          placeholder={DEFAULT_PROTOTYPE_PASSWORD}
          style={inputStyle}
        />
        <div style={actionsStyle}>
          <button type="button" onClick={() => setValue(DEFAULT_PROTOTYPE_PASSWORD)} style={ghostBtnStyle}>
            Reset to default
          </button>
          <button type="submit" style={primaryBtnStyle}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const formStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 20,
}

const hintStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const inputStyle: CSSProperties = {
  height: 44,
  padding: '0 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  color: 'var(--color-text-primary)',
}

const errorStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-error-600)',
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  marginTop: 4,
}

const ghostBtnStyle: CSSProperties = {
  minHeight: 40,
  padding: '0 16px',
  background: 'transparent',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  minHeight: 40,
  padding: '0 20px',
  background: 'var(--color-primary-600)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
}
