import { Check } from '@/icons'
import type { ChangeEventHandler, ReactNode } from 'react'

type Props = {
  checked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** ⚠ A NODE SINCE 2026-11-02, widened from `string` for the Export Transcript
   *  sheet, whose rows carry a title over a meta line. It is only ever rendered
   *  as a child — nothing here reads it as text — so every existing caller
   *  passing a string is unaffected. Keep it rendered, never measured. */
  label: ReactNode
  value?: string
  /** Optional icon rendered between the checkbox and the label text. */
  icon?: ReactNode
}

export function Checkbox({ checked = false, onChange, label, value, icon }: Props) {
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
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: 'var(--radius-sm)',
          background: checked ? 'var(--color-action)' : 'var(--color-surface-card)',
          border: `1.5px solid ${checked ? 'var(--color-action)' : 'var(--color-neutral-disabled)'}`,
          flexShrink: 0,
        }}
      >
        {checked && <Check size={12} strokeWidth={3} aria-hidden style={{ color: 'var(--color-text-inverse)' }} />}
      </span>
      <input
        type="checkbox"
        value={value}
        checked={checked}
        onChange={onChange}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
      />
      {icon}
      {label}
    </label>
  )
}
