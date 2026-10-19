import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BookOpen, Bell, ChartSimple, Envelope, Gear, Users } from '@/icons'
import { ADMIN_USER } from '@/data/xcelAdmin/learners'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BODY, HEADING } from './adminStyles'

/**
 * XCEL ADMIN — THE SHELL (2026-10-19). The reference's sidebar and header:
 * a 264 white sidebar (the XCEL lockup with its ADMIN pill, five sections and
 * Settings under a rule), and a translucent header carrying the page title
 * and the signed-in admin. Every admin page renders inside it.
 */

type NavItem = { to: string; label: string; icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }> }

const NAV: NavItem[] = [
  { to: `${ADMIN_BASE}/students`, label: 'Students', icon: Users },
  { to: `${ADMIN_BASE}/invites`, label: 'Invites', icon: Envelope },
  { to: `${ADMIN_BASE}/reports`, label: 'Reports', icon: ChartSimple },
  { to: `${ADMIN_BASE}/notifications`, label: 'Notifications', icon: Bell },
  { to: `${ADMIN_BASE}/resources`, label: 'Resources', icon: BookOpen },
]

/** The header title per section — the first path segment after the base. */
const TITLES: Record<string, string> = {
  students: 'Students',
  invites: 'Invites',
  reports: 'Reports',
  notifications: 'Notifications & Reports',
  resources: 'Resources',
  settings: 'Settings',
}

export function XcelAdminLayout() {
  const { pathname } = useLocation()
  const section = pathname.slice(ADMIN_BASE.length + 1).split('/')[0] || 'students'
  const title = TITLES[section] ?? 'XCEL Admin'
  const { toast } = useAdminStore()

  useEffect(() => {
    const prev = document.title
    document.title = `${title} · XCEL Admin`
    return () => {
      document.title = prev
    }
  }, [title])

  return (
    <div style={APP}>
      <aside style={SIDEBAR}>
        <div style={{ marginBottom: 20, padding: '0 4px' }}>
          <span role="img" aria-label="XCEL Admin" style={LOCKUP}>
            <img alt="" src="/brand/xcel-logo.webp" style={{ height: '1em', width: 'auto', display: 'block' }} />
            <span aria-hidden style={LOCKUP_PILL}>
              Admin
            </span>
          </span>
        </div>
        <nav aria-label="Primary" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {NAV.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>
        <div style={{ marginTop: 12, flex: 'none', borderTop: '1px solid var(--admin-chrome-rule)', paddingTop: 12 }}>
          <SideLink item={{ to: `${ADMIN_BASE}/settings`, label: 'Settings', icon: Gear }} />
        </div>
      </aside>
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={HEADER}>
          <h1 style={HEADER_TITLE}>{title}</h1>
          <div style={USER}>
            <div style={{ textAlign: 'right', fontSize: 14, lineHeight: 1.25 }}>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--admin-chrome-title)' }}>{ADMIN_USER.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-chrome-text)' }}>{ADMIN_USER.role}</p>
            </div>
            <span aria-hidden style={AVATAR}>
              {ADMIN_USER.initials}
            </span>
          </div>
        </header>
        <main style={MAIN}>
          <Outlet />
        </main>
      </div>
      {toast ? (
        <div role="status" style={TOAST}>
          {toast}
        </div>
      ) : null}
    </div>
  )
}

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink to={item.to + window.location.search} style={({ isActive }) => (isActive ? NAV_ACTIVE : NAV_ITEM)}>
      <Icon size={16} aria-hidden />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
    </NavLink>
  )
}

/** A section with nothing built yet — still a page in the shell. */
export function XcelAdminComingSoon({ children }: { children?: ReactNode }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--admin-muted)', fontSize: 14 }}>
      {children ?? 'This page is next in the rebuild.'}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const APP: CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  background: 'var(--admin-page)',
  color: 'var(--admin-chrome-text)',
  fontFamily: BODY,
}
const SIDEBAR: CSSProperties = {
  position: 'sticky',
  top: 0,
  alignSelf: 'flex-start',
  height: '100vh',
  boxSizing: 'border-box',
  width: 264,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 16px',
  background: 'var(--admin-surface)',
  borderRight: '1px solid var(--admin-chrome-rule)',
}
const LOCKUP: CSSProperties = { display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', fontSize: 32 }
const LOCKUP_PILL: CSSProperties = {
  marginLeft: '0.4em',
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 9999,
  background: 'var(--admin-logo-pill)',
  color: 'var(--admin-surface)',
  fontFamily: 'Arial, system-ui, sans-serif',
  fontWeight: 700,
  fontSize: '0.26em',
  lineHeight: 1,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '0.28em 0.68em',
}
const NAV_ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 44,
  padding: '0 12px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--admin-chrome-text)',
  textDecoration: 'none',
}
const NAV_ACTIVE: CSSProperties = {
  ...NAV_ITEM,
  background: 'var(--admin-nav-active-bg)',
  color: 'var(--admin-nav-active-ink)',
}
const HEADER: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '20px 40px',
  background: 'var(--admin-chrome-header)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid var(--admin-chrome-rule)',
}
const HEADER_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: HEADING,
  fontSize: 22,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--admin-chrome-title)',
}
const USER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minHeight: 44,
  boxSizing: 'border-box',
  padding: '6px 12px',
  borderRadius: 9999,
  border: '1px solid var(--admin-chrome-rule)',
  background: 'var(--admin-surface)',
}
const AVATAR: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--admin-nav-active-bg)',
  color: 'var(--admin-nav-active-ink)',
  fontSize: 13,
  fontWeight: 700,
}
const MAIN: CSSProperties = { flex: '1 1 auto', padding: '32px 40px 140px' }
const TOAST: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 32,
  transform: 'translateX(-50%)',
  zIndex: 60,
  padding: '10px 18px',
  borderRadius: 9999,
  background: 'var(--admin-ink)',
  color: 'var(--admin-surface)',
  fontSize: 14,
  fontWeight: 600,
  boxShadow: 'var(--admin-shadow-menu)',
}
