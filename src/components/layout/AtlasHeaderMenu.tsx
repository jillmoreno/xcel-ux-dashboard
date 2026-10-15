import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'

/**
 * ATLAS HEADER — one dropdown (2026-10-13). The trigger is a header pill; the
 * panel opens 8px below it, aligned to its left or right edge.
 *
 * The keyboard model is `ActionMenu`'s (src/components/ui/ActionMenu.tsx),
 * re-stated here because that component's trigger and panel are its own and
 * cannot take this design without being edited:
 *
 *   - click the trigger to open, again to close; a click outside closes
 *   - opened from the keyboard (Enter / Space / ArrowDown), focus moves to the
 *     first item; ArrowUp / ArrowDown / Home / End move between items
 *   - Escape closes and returns focus to the trigger; Tab closes
 *
 * Items are the `[role="menuitem"]` elements inside `children`, in order.
 */
export function AtlasHeaderMenu({
  trigger,
  triggerLabel,
  align,
  selected = false,
  panelStyle,
  children,
}: {
  /** What the pill shows. */
  trigger: ReactNode
  /** Accessible name for the trigger, when the visible text is not enough. */
  triggerLabel?: string
  /** Which trigger edge the panel lines up with. */
  align: 'left' | 'right'
  /** The trigger names the current page: filled, like a current nav pill. */
  selected?: boolean
  panelStyle: CSSProperties
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Set when the menu is opened from the keyboard, so focus follows into it.
  const focusFirst = useRef(false)
  const id = useId()

  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  useEffect(() => {
    if (!open) return
    if (focusFirst.current) {
      focusFirst.current = false
      items()[0]?.focus()
    }
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const close = (refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }

  const onPanelKey = (e: KeyboardEvent) => {
    const list = items()
    const at = list.indexOf(document.activeElement as HTMLElement)
    const move = (i: number) => {
      e.preventDefault()
      list[(i + list.length) % list.length]?.focus()
    }
    if (e.key === 'ArrowDown') move(at + 1)
    else if (e.key === 'ArrowUp') move(at - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(list.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') close(false)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex' }}>
      <button
        ref={triggerRef}
        type="button"
        className={selected ? 'cre-atlas-hdr-pill is-selected' : 'cre-atlas-hdr-pill'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={triggerLabel}
        // `detail` is 0 for a click made with Enter or Space.
        onClick={(e) => {
          if (!open && e.detail === 0) focusFirst.current = true
          setOpen((o) => !o)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            focusFirst.current = true
            setOpen(true)
          } else if (e.key === 'Escape' && open) {
            e.preventDefault()
            close(true)
          }
        }}
      >
        {trigger}
      </button>
      <div
        ref={panelRef}
        id={id}
        role="menu"
        hidden={!open}
        onKeyDown={onPanelKey}
        // A pick closes the menu.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[role="menuitem"]')) close(false)
        }}
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          ...(align === 'left' ? { left: 0 } : { right: 0 }),
          zIndex: 40,
          boxSizing: 'border-box',
          background: 'var(--atlas-hdr-surface)',
          boxShadow: 'var(--atlas-hdr-shadow)',
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** A row in a dropdown. `href` is `#` until real destinations exist. */
export function AtlasHeaderMenuItem({
  href = '#',
  icon,
  onSelect,
  children,
}: {
  href?: string
  icon?: ReactNode
  onSelect?: () => void
  children: ReactNode
}) {
  return (
    <a
      role="menuitem"
      tabIndex={-1}
      href={href}
      className="cre-atlas-hdr-item"
      onClick={
        onSelect
          ? (e) => {
              e.preventDefault()
              onSelect()
            }
          : undefined
      }
    >
      {icon ? (
        <span aria-hidden style={{ display: 'inline-flex', justifyContent: 'center', width: 20, flex: 'none', color: 'var(--atlas-hdr-item-icon)' }}>
          {icon}
        </span>
      ) : null}
      {children}
    </a>
  )
}

export function AtlasHeaderMenuDivider() {
  return <div role="separator" style={{ height: 1, margin: '4px 0', background: 'var(--atlas-hdr-menu-rule)' }} />
}
