import { ChevronDown } from '@/icons'
import type { SelectHTMLAttributes } from 'react'

type Option = { value: string; label: string }

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  options: Option[]
  label?: string
  /**
   * Weight of the selected value text. Defaults to 600 (the standard form
   * control). Pass 400 for a lighter filter-rail select that matches
   * normal-weight accordion labels.
   */
  valueWeight?: number
}

export function Select({ options, label, style, valueWeight = 600, ...rest }: Props) {
  // When the select is controlled with an empty value (typical for a
  // placeholder option like "Select Calendar"), shift the displayed
  // text to the in-field tertiary tone so it reads as a placeholder
  // rather than active text — matches the lighter rendering native
  // `<input>` placeholders get and stays consistent with the helper-
  // text standard (`--color-text-tertiary` = neutral-600).
  const isPlaceholder = rest.value === ''
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        height: 40,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        ...style,
      }}
    >
      <select
        {...rest}
        aria-label={label}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          width: '100%',
          height: '100%',
          padding: '0 36px 0 12px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: isPlaceholder
            ? 'var(--color-text-tertiary)'
            : 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: isPlaceholder ? 400 : valueWeight,
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option
            key={o.value}
            value={o.value}
            style={{
              color: 'var(--color-text-primary)',
              fontWeight: 600,
            }}
          >
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-secondary)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
