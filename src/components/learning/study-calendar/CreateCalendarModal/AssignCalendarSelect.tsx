import type { CSSProperties } from 'react'
import { CREATE_CALENDAR_OPTIONS } from '@/data/createCalendarOptions'

/**
 * "Assign Calendar" — required select dropdown. Mirrors the production
 * STC form's first field. Uses a native `<select>` with brand focus
 * styles; placeholder ("Select Calendar") is rendered as a real option
 * with `value=""` so the field starts empty and `required` validation
 * fires when the form attempts Save without a pick.
 *
 * Options are sourced from `createCalendarOptions.ts` so the same
 * label / id / task-count flows into the right-pane preview's stats.
 */
type Props = {
  value: string
  onChange: (id: string) => void
  /** `<label>`'s `for` target. Lets the field be programmatically
   *  associated with its label even though the label itself is
   *  rendered above the wrapping `<div>`. */
  id: string
  /** `aria-describedby` target for the inline error message, when
   *  shown. The Create Calendar form passes an id when Save is
   *  attempted with this field blank. */
  describedBy?: string
  hasError?: boolean
}

export function AssignCalendarSelect({
  value,
  onChange,
  id,
  describedBy,
  hasError = false,
}: Props) {
  return (
    <div style={wrapStyle}>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-required="true"
        aria-invalid={hasError || undefined}
        aria-describedby={describedBy}
        style={{
          ...selectStyle,
          color: value
            ? 'var(--color-text-primary)'
            : 'var(--color-text-tertiary)',
          borderColor: hasError
            ? 'var(--color-error-500)'
            : 'var(--color-border-input)',
        }}
      >
        <option value="">Select Calendar</option>
        {CREATE_CALENDAR_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Down-caret affordance — the native select arrow style is
          inconsistent across browsers, so we render our own glyph and
          rely on `appearance: none` to suppress the default. */}
      <span aria-hidden style={caretStyle}>
        ▾
      </span>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  position: 'relative',
}

const selectStyle: CSSProperties = {
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  width: '100%',
  padding: '11px 38px 11px 14px',
  border: '1px solid var(--color-border-input)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  cursor: 'pointer',
}

const caretStyle: CSSProperties = {
  position: 'absolute',
  right: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'var(--color-text-tertiary)',
  fontSize: 12,
  pointerEvents: 'none',
}
