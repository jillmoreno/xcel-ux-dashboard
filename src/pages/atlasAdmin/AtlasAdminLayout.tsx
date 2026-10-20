import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Bell, Building, ChartSimple, CircleDollar, Envelope, Gear, IdCard, LocationDot, UserGroup, Users } from '@/icons'
import { AtlasHeader } from '@/components/layout/AtlasHeader'
import { ADMIN_USER } from '@/data/atlasAdmin/learners'
import { ADMIN_BASE, ADMIN_EMAIL, useAdminStore } from './adminStore'
import { BODY, HEADING } from './adminStyles'

/**
 * ATLAS ADMIN — THE SHELL (2026-10-19). The reference's sidebar and header:
 * a 264 white sidebar (five sections and Settings under a rule), and a
 * translucent header carrying the page title and the signed-in admin. Every
 * admin page renders inside it.
 *
 * ⚠ UNDER THE PRODUCT'S GLOBAL NAVIGATION SINCE 2026-10-20 (Eric: "push the
 * left sidebar and the entire right side down enough to add the global
 * navigation above it … add an Admin button to the right of Home"). The
 * same `AtlasHeader` the learner pages draw sits across the top, with Admin
 * filled; Home goes to the learner dashboard. The sidebar's XCEL ADMIN lockup
 * went with it — the logo is in the global nav now.
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
  'my-team': 'My team',
  assignments: 'Assignment Rules',
  engagement: 'Engagement Analytics',
  'video-engagement': 'Video Engagement',
  'learning-center': 'Learning Center',
  licenses: 'Licenses & Seats',
  organization: 'Organization',
  teams: 'Teams & Organization',
  enterprise: 'Enterprise Insights',
  pricing: 'Pricing',
  'product-offering': 'Product offering',
  internal: 'Internal',
  notifications: 'Notifications & Reports',
  resources: 'Resources',
  settings: 'Settings · Company',
}

export function AtlasAdminLayout() {
  const { pathname } = useLocation()
  const section = pathname.slice(ADMIN_BASE.length + 1).split('/')[0] || 'students'
  const title = TITLES[section] ?? 'Atlas Admin'
  const { toast, logEvent } = useAdminStore()
  const navigate = useNavigate()
  const search = window.location.search
  // The learner Home keeps the demo flags; Admin is where the reviewer is.
  const learnerHome = `/dashboard-rebrand${search}`

  // Every page the admin opens is a product event (Portal analytics).
  useEffect(() => {
    logEvent('page_view', pathname)
  }, [pathname, logEvent])

  useEffect(() => {
    const prev = document.title
    document.title = `${title} · Atlas Admin`
    return () => {
      document.title = prev
    }
  }, [title])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--admin-page)' }}>
      <AtlasHeader
        current={null}
        user={{ name: ADMIN_USER.name, email: ADMIN_EMAIL }}
        notificationCount={3}
        courses={[]}
        showCourses={false}
        links={{ home: learnerHome, logo: learnerHome, help: `${ADMIN_BASE}/resources${search}` }}
        onNavigate={(href) => navigate(href)}
        extraNav={[{ label: 'Admin', href: `${ADMIN_BASE}/students${search}`, current: true }]}
      />
    <div style={APP}>
      <aside style={SIDEBAR}>
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
          <UserMenu learnerHome={learnerHome} />
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
    </div>
  )
}

/** The admin's menu — the reference's: who is signed in and which mode, six
 *  pages (four of them have no sidebar link), and the switch to the learner
 *  side. "Switch to Learner Mode" goes to the learner Home, as the global
 *  nav's Home does; the reference sends it to its /learner preview. */
const USER_MENU: NavItem[] = [
  { to: `${ADMIN_BASE}/organization`, label: 'Organization', icon: LocationDot },
  { to: `${ADMIN_BASE}/teams`, label: 'Teams', icon: Building },
  { to: `${ADMIN_BASE}/my-team`, label: 'My Team', icon: UserGroup },
  { to: `${ADMIN_BASE}/licenses`, label: 'Licenses & Seats', icon: IdCard },
  { to: `${ADMIN_BASE}/pricing`, label: 'Pricing', icon: CircleDollar },
  { to: `${ADMIN_BASE}/settings`, label: 'Settings', icon: Gear },
]

function UserMenu({ learnerHome }: { learnerHome: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="cre-admin-outline" style={USER}>
        <span style={{ textAlign: 'right', fontSize: 14, lineHeight: 1.25 }}>
          <span style={{ display: 'block', fontWeight: 600, color: 'var(--admin-chrome-title)' }}>{ADMIN_USER.name}</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--admin-chrome-text)' }}>{ADMIN_USER.role}</span>
        </span>
        <span aria-hidden style={AVATAR}>
          {ADMIN_USER.initials}
        </span>
      </button>
      {open ? (
        <div role="menu" aria-label="Account" style={USER_PANEL}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--admin-chrome-rule)' }}>
            <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-chrome-title)' }}>{ADMIN_USER.name}</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Admin mode</span>
          </div>
          <div style={{ padding: 4 }}>
            {USER_MENU.map(({ to, label, icon: Icon }) => (
              <button key={to} type="button" role="menuitem" className="cre-admin-menu" onClick={() => go(to + window.location.search)} style={USER_ITEM}>
                <Icon size={14} aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <div style={{ padding: 4, borderTop: '1px solid var(--admin-chrome-rule)' }}>
            <button type="button" role="menuitem" className="cre-admin-menu" onClick={() => go(learnerHome)} style={{ ...USER_ITEM, fontWeight: 600 }}>
              Switch to Learner Mode
            </button>
          </div>
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
export function AtlasAdminComingSoon({ children }: { children?: ReactNode }) {
  return (
    <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--admin-muted)', fontSize: 14 }}>
      {children ?? 'This page is next in the rebuild.'}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const APP: CSSProperties = {
  display: 'flex',
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
  padding: '20px 16px 24px',
  background: 'var(--admin-surface)',
  borderRight: '1px solid var(--admin-chrome-rule)',
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
  fontFamily: 'inherit',
  cursor: 'pointer',
}
const USER_PANEL: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 6px)',
  zIndex: 30,
  width: 240,
  borderRadius: 12,
  border: '1px solid var(--admin-chrome-rule)',
  background: 'var(--admin-surface)',
  boxShadow: 'var(--admin-shadow-menu)',
}
const USER_ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 10px',
  border: 'none',
  borderRadius: 8,
  background: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
  color: 'var(--admin-chrome-title)',
  textAlign: 'left',
  cursor: 'pointer',
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
