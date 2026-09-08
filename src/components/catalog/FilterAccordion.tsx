import { Minus, Plus } from '@/icons'
import { useState, type ReactNode } from 'react'

type Props = {
  label: string
  /** Number shown after label, e.g. "Profession (1)" */
  activeCount?: number
  defaultOpen?: boolean
  children?: ReactNode
}

export function FilterAccordion({ label, activeCount, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 400,
          cursor: 'pointer',
        }}
      >
        <span>
          {label}
          {activeCount != null && activeCount > 0 && (
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}> ({activeCount})</span>
          )}
        </span>
        {open ? <Minus size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  )
}
