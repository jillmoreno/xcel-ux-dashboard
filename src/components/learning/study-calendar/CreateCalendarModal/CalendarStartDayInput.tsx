import type { CSSProperties } from 'react'
import { CalendarDay } from '@/icons'

/**
 * "Calendar Start Day" — optional date input.
 *
 * Production uses a custom date picker; for the demo we use the
 * native `<input type="date">` so the date math (and the keyboard
 * affordance) stay correct without pulling in a date-picker library.
 * Helper text mirrors the production copy ("Defaults to today if
 * left blank.") — when blank at Save time the harness treats the
 * value as today.
 */
type Props = {
  value: string
  onChange: (next: string) => void
  id: string
  helperId: string
}

export function CalendarStartDayInput({ value, onChange, id, helperId }: Props) {
  return (
    <>
      <div style={wrapStyle}>
        <input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={helperId}
          style={inputStyle}
        />
        <span aria-hidden style={iconStyle}>
          <CalendarDay size={16} aria-hidden />
        </span>
      </div>
      <p id={helperId} style={helperStyle}>
        Defaults to today if left blank.
      </p>
    </>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  position: 'relative',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 38px 11px 14px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const iconStyle: CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-text-tertiary)',
  pointerEvents: 'none',
}

// Helper text within a field — neutral-600 (via
// `--color-text-tertiary`) and 12px, matching the app-wide standard.
const helperStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}
