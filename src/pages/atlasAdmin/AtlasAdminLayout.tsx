import { useEffect, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AngleRightRegular, BookOpen, Bell, Building, ChartSimple, CircleDollar, Envelope, Gear, IdCard, LocationDot, UserGroup, Users } from '@/icons'
import { AtlasHeader } from '@/components/layout/AtlasHeader'
import { useAccount } from '@/context/AccountContext'
import { useProfileAvatar } from '@/context/ProfileAvatarContext'
import { ADMIN_BASE, useAdminStore } from './adminStore'
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
 * same `AtlasHeader` the learner pages draw sits across the top; Home goes
 * to the learner dashboard. Its Admin pill went the same day — the account
 * pill says "(Admin Mode)" and its menu switches modes. The sidebar's XCEL ADMIN lockup
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
  /* ⚠ TEMPORARY, STUDENTS ONLY — 2026-10-20, Eric: "temporarily and only on
     the students page replace the left nav style with the quick links menu
     style from the home page". To undo: delete this line, `QuickLinksNav` and
     its styles below; the standing sidebar is untouched in the else branch. */
  const quickLinksNav = section === 'students'
  const { toast, logEvent } = useAdminStore()
  const navigate = useNavigate()
  const search = window.location.search
  // The learner Home keeps the demo flags; Admin is where the reviewer is.
  const learnerHome = `/dashboard-rebrand${search}`
  /* ONE PERSON IN BOTH MODES — 2026-10-20, Eric: "change the admin mode user
     name to the same name as the learner user name". The global nav reads
     the learner's account here exactly as `AtlasHeaderConnected` does (name,
     its email, the avatar), so switching modes changes the mode, not who is
     signed in. */
  const { user: account } = useAccount()
  const { avatarOverride } = useProfileAvatar()

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
        user={{ name: `${account.firstName} ${account.lastName}`, email: 'jordan.navarro@gmail.com', photoUrl: avatarOverride ?? account.avatarUrl }}
        notificationCount={3}
        courses={[]}
        showCourses={false}
        links={{ home: learnerHome, logo: learnerHome, help: `${ADMIN_BASE}/resources${search}` }}
        onNavigate={(href) => navigate(href)}
        modeMenu={{
          mode: 'admin',
          adminLinks: USER_MENU.map(({ to, label, icon: Icon }) => ({ label, href: to + search, icon: <Icon size={18} aria-hidden /> })),
          onSwitch: () => navigate(learnerHome),
        }}
      />
    <div style={APP}>
      {/* With the Quick Links card the sidebar is the page's own colour, no
          rule beside it (2026-10-20, Eric's request) — the card is the edge. */}
      <aside style={quickLinksNav ? { ...SIDEBAR, background: 'var(--admin-page)', borderRight: 'none' } : SIDEBAR}>
        {quickLinksNav ? (
          <QuickLinksNav />
        ) : (
          <>
            <nav aria-label="Primary" style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
              {NAV.map((item) => (
                <SideLink key={item.to} item={item} />
              ))}
            </nav>
            <div style={{ marginTop: 12, flex: 'none', borderTop: '1px solid var(--admin-chrome-rule)', paddingTop: 12 }}>
              <SideLink item={{ to: `${ADMIN_BASE}/settings`, label: 'Settings', icon: Gear }} />
            </div>
          </>
        )}
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

/** The sidebar in Home's Quick Links style (`AtlasJourneyLinksCard`): an
 *  outlined card, 16px between rows, 13px rows with the icon in an 18px slot,
 *  hover one weight up in the page-button colour with the angle-right
 *  showing, the current page semi-bold in a capsule. The capsule is Atlas
 *  Primary 100, not Home's white — the sidebar is white, so white would not
 *  show. TEMPORARY, Students only — see `quickLinksNav`. */
function QuickLinksNav() {
  return (
    <nav aria-label="Primary" style={QL_CARD}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[...NAV, { to: `${ADMIN_BASE}/settings`, label: 'Settings', icon: Gear }].map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to + window.location.search} className="cre-compass-v2-row" style={({ isActive }) => (isActive ? { ...QL_ROW, ...QL_ROW_ACTIVE } : QL_ROW)}>
              <span aria-hidden style={QL_ICON}>
                <Icon size={13} aria-hidden />
              </span>
              <span className="cre-quick-link-label" data-label={label} style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>
                {label}
              </span>
              <span aria-hidden className="cre-quick-link-chevron" style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
                <AngleRightRegular size={13} aria-hidden />
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
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
/* Quick Links (Home's card, as the E2E Home draws it): radius 20, padding
   24, the slate hairline it computes to (--admin-quicklinks-rule — spelled
   out because the admin pages sit outside the Atlas palette's scope). */
const QL_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 20,
  border: '1px solid var(--admin-quicklinks-rule)',
}
const QL_ROW: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  textDecoration: 'none',
}
const QL_ROW_ACTIVE: CSSProperties = {
  width: 'calc(100% + 16px)',
  margin: '-4px -8px',
  padding: '4px 8px',
  boxSizing: 'border-box',
  borderRadius: 999,
  background: 'var(--admin-atlas-primary-100)',
  fontWeight: 600,
}
const QL_ICON: CSSProperties = { width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-compass-page-button)' }
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
  /* Atlas Primary 100 (2026-10-20, Eric's request) in place of the
     reference's rose; the ink is unchanged. */
  background: 'var(--admin-atlas-primary-100)',
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
