import type { ChangeEventHandler } from 'react'

type Props = {
  name: string
  value: string
  checked: boolean
  onChange: ChangeEventHandler<HTMLInputElement>
  label: string
}

export function Radio({ name, value, checked, onChange, label }: Props) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 0',
        cursor: 'pointer',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
      }}
    >
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: 18,
          height: 18,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-surface-card)',
          border: `1.5px solid ${checked ? 'var(--color-action)' : 'var(--color-neutral-disabled)'}`,
          flexShrink: 0,
        }}
      >
        {checked && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 3,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-action)',
            }}
          />
        )}
      </span>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      {label}
    </label>
  )
}
