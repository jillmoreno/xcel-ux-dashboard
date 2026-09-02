import { MoreVertical } from '@/icons'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type ActionMenuItem = {
  id: string
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
}

type Props = {
  label: string
  items: ActionMenuItem[]
}

export function ActionMenu({ label, items }: Props) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % items.length)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + items.length) % items.length)
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setActiveIndex(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        setActiveIndex(items.length - 1)
      }
      if (e.key === 'Enter' || e.key === ' ') {
        if (activeIndex >= 0) {
          e.preventDefault()
          items[activeIndex].onSelect()
          setOpen(false)
          triggerRef.current?.focus()
        }
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, items, activeIndex])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          setOpen((v) => !v)
          setActiveIndex(0)
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-pill)',
          background: 'transparent',
          border: 'none',
          color: 'var(--color-secondary-500)',
          cursor: 'pointer',
        }}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={label}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            minWidth: 180,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-popover)',
            padding: 4,
            zIndex: 60,
          }}
        >
          {items.map((item, i) => (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              tabIndex={-1}
              onClick={() => {
                item.onSelect()
                setOpen(false)
                triggerRef.current?.focus()
              }}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 10px',
                background: i === activeIndex ? 'var(--color-neutral-100)' : 'transparent',
                color: item.danger ? 'var(--color-secondary-700)' : 'var(--color-text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                textAlign: 'left',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
