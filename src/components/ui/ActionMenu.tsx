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
  /**
   * Visible text beside the kebab, turning the icon-only trigger into a labelled
   * button (e.g. "Actions").
   *
   * Opt-in because the icon-only form is right where the menu sits ON the thing
   * it acts on — a row, a card — and the context supplies the meaning. It is
   * wrong where the menu stands alone next to an unrelated primary button, which
   * is where a bare kebab becomes a guess.
   *
   * Does NOT replace `label`: that stays the accessible name, so the button is
   * announced the same either way and the visible word is additive.
   */
  triggerLabel?: string
}

export function ActionMenu({ label, items, triggerLabel }: Props) {
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
          gap: triggerLabel ? 6 : 0,
          // Labelled, this is the shared Button's `secondary` variant in every
          // dimension that matters — 40px tall, `--radius-md`, 16px side
          // padding, transparent on an `--color-action` stroke — so it sits
          // beside a primary CTA as its outlined peer rather than as a
          // differently-shaped control. Icon-only, it stays the 32px pill every
          // row and card kebab already uses.
          width: triggerLabel ? 'auto' : 32,
          height: triggerLabel ? 40 : 32,
          padding: triggerLabel ? '0 16px' : 0,
          borderRadius: triggerLabel ? 'var(--radius-md)' : 'var(--radius-pill)',
          background: 'transparent',
          border: triggerLabel ? '1px solid var(--color-action)' : 'none',
          // The icon-only trigger keeps the accent it has always used — at 16px,
          // sitting on the row it acts on, it reads as an affordance rather than
          // as text. The LABELLED variant cannot: `--color-secondary-500`
          // resolves to amber on Elite and measures 1.6:1 against the page as
          // 14px text.
          //
          // The stroke is `--color-action` (a border is a UI component: 3:1, and
          // it measures 4.2). The LABEL is one stop darker at
          // `--color-action-hover` — `--color-action` itself is only 4.2:1 on
          // `--color-surface-page`, under the 4.5 AA needs at 14px. Same teal
          // family, 5.99:1. NOTE the shared Button's `secondary` variant sets
          // its foreground to `--color-action` and has the same shortfall on
          // this surface; worth a separate pass.
          color: triggerLabel ? 'var(--color-action-hover)' : 'var(--color-secondary-500)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1,
          cursor: 'pointer',
        }}
      >
        <MoreVertical size={16} aria-hidden />
        {triggerLabel}
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
