import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Bell, Building, ChartSimple, CircleDollar, Envelope, Gear, IdCard, LocationDot, UserGroup, Users } from '@/icons'
import { AtlasHeader } from '@/components/layout/AtlasHeader'
import { ADMIN_USER } from '@/data/atlasAdmin/learners'
import { ADMIN_BASE, ADMIN_EMAIL, useAdminStore } from './adminStore'
import { BODY } from './adminStyles'

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
        modeMenu={{
          mode: 'admin',
          adminLinks: USER_MENU.map(({ to, label, icon: Icon }) => ({ label, href: to + search, icon: <Icon size={18} aria-hidden /> })),
          onSwitch: () => navigate(learnerHome),
        }}
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

/** The admin's menu, from the reference's user pill: six pages (four of them
 *  have no sidebar link). It lives in the global nav's profile menu now —
 *  `modeMenu` above, with Switch to Learner Mode — and the pill and the
 *  title banner it sat in are gone (2026-10-20, Eric: "drop the banner and
 *  pill completely"). Each page carries its own heading. */
const USER_MENU: NavItem[] = [
  { to: `${ADMIN_BASE}/organization`, label: 'Organization', icon: LocationDot },
  { to: `${ADMIN_BASE}/teams`, label: 'Teams', icon: Building },
  { to: `${ADMIN_BASE}/my-team`, label: 'My Team', icon: UserGroup },
  { to: `${ADMIN_BASE}/licenses`, label: 'Licenses & Seats', icon: IdCard },
  { to: `${ADMIN_BASE}/pricing`, label: 'Pricing', icon: CircleDollar },
  { to: `${ADMIN_BASE}/settings`, label: 'Settings', icon: Gear },
]

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
