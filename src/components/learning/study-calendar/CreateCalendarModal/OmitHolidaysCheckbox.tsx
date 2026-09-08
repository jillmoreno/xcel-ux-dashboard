import type { CSSProperties } from 'react'
import { CalendarDay } from '@/icons'

/**
 * "Omit all Holidays using the Stock Exchange Calendar" — single
 * checkbox. Default off (matches production). When on, the right-pane
 * mini-grid tints NYSE-listed holidays in
 * `--color-warning-100` / `--color-warning-700` and the projected-
 * completion math subtracts those days.
 *
 * Built inline (rather than wrapping `<Checkbox>`) so the row carries
 * a leading icon glyph matching the create-calendar concept HTML's
 * stock-exchange icon. The hidden native checkbox preserves keyboard +
 * screen-reader behavior.
 */
type Props = {
  checked: boolean
  onChange: (next: boolean) => void
}

export function OmitHolidaysCheckbox({ checked, onChange }: Props) {
  return (
    <label style={rowStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={hiddenInputStyle}
      />
      <span
        aria-hidden
        style={{
          ...boxStyle,
          background: checked
            ? 'var(--color-primary-500)'
            : 'var(--color-surface-card)',
          borderColor: checked
            ? 'var(--color-primary-500)'
            : 'var(--color-border-input)',
          color: 'var(--color-text-inverse)',
        }}
      >
        {checked ? '✓' : ''}
      </span>
      <span aria-hidden style={iconStyle}>
        <CalendarDay size={16} aria-hidden />
      </span>
      <span style={labelTextStyle}>
        Omit all Holidays using the Stock Exchange Calendar
      </span>
    </label>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  userSelect: 'none',
  margin: '6px 0 4px',
}

const hiddenInputStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const boxStyle: CSSProperties = {
  width: 18,
  height: 18,
  border: '1.5px solid',
  borderRadius: 'var(--radius-sm)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 12,
  fontWeight: 900,
  lineHeight: 1,
}

const iconStyle: CSSProperties = {
  display: 'inline-flex',
  color: 'var(--color-primary-500)',
}

const labelTextStyle: CSSProperties = {
  flex: 1,
}
