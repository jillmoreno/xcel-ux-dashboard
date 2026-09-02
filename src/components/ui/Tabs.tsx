import type { ReactNode } from 'react'

export type TabItem<T extends string> = {
  id: T
  label: string
}

type Props<T extends string> = {
  items: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  children?: ReactNode
}

export function Tabs<T extends string>({ items, active, onChange }: Props<T>) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 0,
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 200,
              height: 48,
              padding: '0 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 16,
              fontWeight: isActive ? 600 : 400,
              // Contrast-aware active label: `--color-accent-text` clears AA on
              // white (a touch darker for CRE/McKissock) and lifts to a lighter
              // stop on the navy dark surface, where flat primary-500 was 2.8:1.
              color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
            }}
          >
            {item.label}
            {isActive && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: -1,
                  height: 4,
                  background: 'var(--color-primary-500)',
                  borderTopLeftRadius: 'var(--radius-sm)',
                  borderTopRightRadius: 'var(--radius-sm)',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
