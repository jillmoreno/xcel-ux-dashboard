import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Award, BookOpen, ChevronDown, Library, Podcast } from '@/icons'

type IconName = 'BookOpen' | 'Library' | 'Award' | 'Podcast'

const ICONS: Record<IconName, typeof BookOpen> = {
  BookOpen,
  Library,
  Award,
  Podcast,
}

export type NavDropdownItem = {
  label: string
  /** Route to navigate to. Ignored when `onSelect` is provided. */
  to: string
  icon?: IconName
  /** Optional badge rendered after the label (e.g. a count chip). */
  badge?: string | number
  /** Override navigation — called instead of routing when set. */
  onSelect?: () => void
}

export function NavDropdown({ label, items }: { label: string; items: NavDropdownItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const { pathname } = useLocation()
  const sectionActive = items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={`cre-nav-pill${open || sectionActive ? ' is-active' : ''}`}
      >
        {label}
        <ChevronDown
          size={16}
          aria-hidden
          style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 120ms' }}
        />
      </button>
      {open && (
        <div
          id={id}
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 240,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-popover)',
            padding: 6,
            zIndex: 50,
          }}
        >
          {items.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : null
            const inner = (
              <>
                {Icon && (
                  <span className="cre-menu-item-icon" aria-hidden>
                    <Icon size={18} aria-hidden />
                  </span>
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge !== '' && (
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginLeft: 4,
                    }}
                  >
                    ({item.badge})
                  </span>
                )}
              </>
            )
            if (item.onSelect) {
              return (
                <button
                  key={item.to}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    item.onSelect?.()
                  }}
                  className="cre-menu-item"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {inner}
                </button>
              )
            }
            return (
              <NavLink
                key={item.to}
                role="menuitem"
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `cre-menu-item${isActive ? ' is-active' : ''}`}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {inner}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}
