import type { CSSProperties } from 'react'
import { CalendarDay, Check } from '@/icons'
import type { ProjectedCompletion } from './useProjectedCompletion'

/**
 * Two-state readout for the Projected Completion Date. Lives below
 * the form fields in the modal's left column.
 *
 *   - **Empty**  — dashed border, neutral copy explaining what's
 *                  missing. Calendar glyph in the leading slot.
 *   - **Filled** — solid success-tinted card with the computed date
 *                  in heading type plus a math sub-line ("X days
 *                  from start · Y NYSE holidays excluded · Z buffer
 *                  days included"). Check glyph in the leading slot.
 *
 * `aria-live="polite"` on the wrapping `<div>` announces the
 * computed date when it lands — assistive tech users still get the
 * "ah, the form is satisfied" signal even without seeing the color
 * swap.
 */
type Props = {
  result: ProjectedCompletion
}

export function ProjectedCompletionReadout({ result }: Props) {
  const filled = result.state === 'filled'
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        ...wrapStyle,
        background: filled ? 'var(--color-success-100)' : 'var(--color-neutral-100)',
        borderStyle: filled ? 'solid' : 'dashed',
        borderColor: filled
          ? 'var(--color-success-500)'
          : 'var(--color-border-input)',
      }}
    >
      <span
        aria-hidden
        style={{
          ...iconStyle,
          color: filled
            ? 'var(--color-success-500)'
            : 'var(--color-primary-500)',
        }}
      >
        {filled ? <Check size={20} aria-hidden /> : <CalendarDay size={20} aria-hidden />}
      </span>
      <div>
        <div
          style={{
            ...labelStyle,
            color: filled
              ? 'var(--color-success-700)'
              : 'var(--color-text-primary)',
          }}
        >
          Projected Completion Date
        </div>
        {filled ? (
          <>
            <div style={valueStyleFilled}>{result.formattedDate}</div>
            <div style={subStyle}>
              {result.daysFromStart} days from start ·{' '}
              {result.nyseHolidaysExcluded} NYSE holiday
              {result.nyseHolidaysExcluded === 1 ? '' : 's'} excluded ·{' '}
              {result.bufferDaysIncluded} buffer day
              {result.bufferDaysIncluded === 1 ? '' : 's'} included
            </div>
          </>
        ) : (
          <div style={valueStyleEmpty}>{result.reason}</div>
        )}
      </div>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  border: '1px',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: 12,
  alignItems: 'start',
}

const iconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  flexShrink: 0,
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
}

const valueStyleEmpty: CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  marginTop: 2,
}

const valueStyleFilled: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  color: 'var(--color-text-primary)',
  marginTop: 2,
}

const subStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}
