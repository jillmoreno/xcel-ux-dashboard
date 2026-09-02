import { useId } from 'react'

type Props = {
  checked: boolean
  onChange: (next: boolean) => void
  /** Visible label paired with the switch. */
  label: string
  /** Optional helper text under the label — uses the in-field helper
   *  style (`--color-text-tertiary`, 12px). */
  description?: string
  /** Pass through when the toggle needs a stable id for `htmlFor` or
   *  ARIA linkage; defaults to a generated id. */
  id?: string
  disabled?: boolean
  /** Which side the switch sits on relative to the label. Default
   *  `'right'` (label-left, switch-right with full-row justify). Use
   *  `'left'` to put the switch first and the label immediately after
   *  it (compact left-aligned layout). */
  switchPosition?: 'left' | 'right'
}

/**
 * On/off switch primitive. Label-left, track-right. Track flips to
 * `--color-action` when on, `--color-neutral-300` when off; knob slides
 * with a 160ms transition. Use for binary form preferences where a
 * single state matters more than a label/value pair (e.g., "Exclude
 * NYSE holidays"). For checkbox-style multi-select use `<Checkbox>`.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false,
  switchPosition = 'right',
}: Props) {
  const autoId = useId()
  const switchId = id ?? autoId
  const trackW = 40
  const trackH = 24
  const knob = trackH - 4

  const labelBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <label
        htmlFor={switchId}
        style={{
          fontFamily: 'var(--font-body)',
          // Regular weight — toggle labels read as plain prose ("Exclude
          // all NYSE holidays"), not bold field headings. Bold competes
          // with adjacent Field labels and makes the switch + sentence
          // look like a section header.
          fontWeight: 400,
          fontSize: 14,
          color: 'var(--color-text-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {label}
      </label>
      {description && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-tertiary)',
            lineHeight: '16px',
          }}
        >
          {description}
        </span>
      )}
    </div>
  )

  const switchEl = (
    <button
      type="button"
      role="switch"
      id={switchId}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        width: trackW,
        height: trackH,
        background: checked ? 'var(--color-action)' : 'var(--color-neutral-300)',
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        padding: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 160ms ease',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? trackW - knob - 2 : 2,
          width: knob,
          height: knob,
          background: 'var(--color-surface-card)',
          borderRadius: 'var(--radius-pill)',
          transition: 'left 160ms ease',
          boxShadow: '0 1px 2px rgb(0 0 0 / 0.15)',
        }}
      />
    </button>
  )

  // switchPosition === 'right': full-row layout, label-left + switch
  // pushed to the right via justify-content: space-between.
  // switchPosition === 'left': compact left-aligned layout, switch
  // first then label immediately after it.
  return (
    <div
      style={{
        display: 'flex',
        alignItems: description ? 'flex-start' : 'center',
        gap: 12,
        justifyContent: switchPosition === 'right' ? 'space-between' : 'flex-start',
      }}
    >
      {switchPosition === 'left' ? (
        <>
          {switchEl}
          {labelBlock}
        </>
      ) : (
        <>
          {labelBlock}
          {switchEl}
        </>
      )}
    </div>
  )
}
