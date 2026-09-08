import type { ComponentType, CSSProperties } from 'react'
import { NavLink } from 'react-router-dom'
import { Bell, CircleUser, CreditCard, FileText, IdCard, Receipt } from '@/icons'

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

type NavItem = { label: string; to: string; icon: IconComponent }

/** Account sub-nav items — mirror the account dropdown (`AccountMenu`) so the
 *  in-page rail and the header menu stay in sync. */
const ITEMS: NavItem[] = [
  { label: 'Profile', to: '/account/profile', icon: CircleUser },
  { label: 'Notifications', to: '/account/notifications', icon: Bell },
  { label: 'Licenses', to: '/account/licenses', icon: IdCard },
  { label: 'Transcripts', to: '/account/transcripts', icon: FileText },
  { label: 'Payment Methods', to: '/account/payment-methods', icon: CreditCard },
  { label: 'Purchases', to: '/account/purchases', icon: Receipt },
]

/**
 * Classic-route account left sub-nav (Figma "Left Nav_Options", `301:18948`).
 * A vertical list of account destinations. The active row follows the app-wide
 * nav-active convention: a neutral wash + a `--color-nav-active` (brand
 * secondary) left-accent bar — the same active language as the dark rails, on a
 * light surface. Only rendered on the standard top-nav route — the Dashboard
 * Rebrand shell provides its own left rail, so `ProfilePage embedded` omits it.
 */
export function AccountNav() {
  return (
    <nav aria-label="Account" style={navStyle}>
      {ITEMS.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          style={({ isActive }) => ({
            ...rowStyle,
            background: isActive ? 'var(--color-neutral-100)' : 'transparent',
            // Left-accent bar reserved on every row (transparent when idle) so
            // activating a row never shifts its content — mirrors the rails.
            borderLeftColor: isActive ? 'var(--color-nav-active)' : 'transparent',
          })}
        >
          <span style={iconWrapStyle}>
            <Icon size={16} aria-hidden />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

const navStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  width: 208,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 36,
  padding: '0 12px',
  // Reserve the 3px accent bar on every row (color set per-row above) so the
  // active row's content never shifts. border-box keeps the row width stable.
  borderLeft: '3px solid transparent',
  boxSizing: 'border-box',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
  textDecoration: 'none',
}

const iconWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  flexShrink: 0,
}
