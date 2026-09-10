import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Bars } from '@/icons'
import { Logo } from '@/components/brand/Logo'
import { NavDropdown } from './NavDropdown'
import { NavLink } from './NavLink'
import { AccountMenu } from './AccountMenu'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { LearningPathsPanel } from '@/components/learning/LearningPathsPanel'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanel'
import { useDashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanelContext'
import { useMembershipPageVersionPanel } from '@/components/membership/MembershipPageVersionPanelContext'
import {
  MEMBERSHIP_PAGE_VERSIONS,
  DEFAULT_MEMBERSHIP_PAGE_VERSION,
} from '@/data/membershipPageVersions'
import { useFeatureFlagPanel } from '@/components/account/FeatureFlagPanelContext'
import { MembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanel'
import { useMembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanelContext'
import { JumpBackInPanel } from '@/components/dashboard/JumpBackInPanel'
import { useJumpBackInPanel } from '@/components/dashboard/JumpBackInPanelContext'
import {
  readDefaultDashboardVersion,
  writeDefaultDashboardVersion,
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  defaultDiscoverabilityVersionFor,
  type DashboardVersionId,
} from '@/data/dashboardVersions'
import {
  readDefaultMembershipVersion,
  writeDefaultMembershipVersion,
  type MembershipVersionId,
} from '@/data/membershipVersions'
import { useAccount, professionFor, supportsMembership } from '@/context/AccountContext'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { useDeviceFrame } from './DeviceFrameContext'
import { useMobileNav } from './MobileNavContext'

/** Height of the Demo-frame browser-chrome strip (traffic lights). Shared by
 *  the strip itself + the header's sticky offset so they stay in sync. */
const BROWSER_CHROME_H = 38

/**
 * Mobile logo height. **35, not 34** — XCEL's lockup is 2.725:1 and sizes by
 * HEIGHT, so 34 renders it 93px wide and the brand guide's minimum web size is
 * 95px on WIDTH. 35 gives exactly 95. One pixel, and it is the only call site
 * that was under: 52 → 142px and 40 → 109px both clear it comfortably.
 *
 * Re-derive this if the lockup is ever replaced with a different aspect — it
 * is a consequence of the artwork, not a layout preference.
 */
const MOBILE_LOGO_HEIGHT = 35

export function Header() {
  const {
    open: pathsOpen,
    openPanel,
    closePanel,
    activePathId: selectedPathId,
    setActivePathId,
    activeStatus,
  } = useLearningPathsPanel()
  const {
    open: versionsOpen,
    closePanel: closeVersionsPanel,
  } = useDashboardVersionsPanel()
  const { openPanel: openFeatureFlagPanel } = useFeatureFlagPanel()
  const {
    open: membershipPageVersionOpen,
    closePanel: closeMembershipPageVersionPanel,
  } = useMembershipPageVersionPanel()
  const { setVariant } = useFeatureFlags()
  const membershipPageVersion =
    useFeatureFlag('membership-page-version').variant ?? DEFAULT_MEMBERSHIP_PAGE_VERSION
  const { open: jumpBackInOpen, closePanel: closeJumpBackInPanel } = useJumpBackInPanel()
  const {
    open: membershipVersionsOpen,
    closePanel: closeMembershipVersionsPanel,
  } = useMembershipVersionsPanel()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const { brand } = useAccount()
  const logoLabel = `${professionFor(brand).brandFullName} home`
  const discoverabilityDefault = defaultDiscoverabilityVersionFor(brand)
  // The slim header (logo cap + utility icons, no primary nav) renders only
  // on the rebranded dashboard shell route. Every other route keeps the
  // classic top nav.
  const platformNav = pathname === '/dashboard-rebrand'
  // Hide the primary top nav on the rebrand shell (wayfinding lives in the left
  // rail) AND on the Onboarding Flow — a required first-run wizard the learner
  // shouldn't be able to navigate away from. Both keep the logo + utility icons.
  const hidePrimaryNav = platformNav || pathname === '/onboarding-flow'
  // The classic Dashboard tab is hidden by default — the `dashboard-tab` flag
  // (OFF by default) must be turned on to reveal it (see App's /dashboard
  // route guard, which redirects to the Learning Path page while hidden).
  const showDashboardTab = useFeatureFlag('dashboard-tab').enabled
  // Logo target: on the rebrand shell it returns to the shell's Home (the
  // Dashboard section) — `/dashboard-rebrand` with no `?section=` — preserving
  // the chosen dashboard `?version=`; everywhere else it's the classic dashboard.
  const rebrandVersion = new URLSearchParams(search).get('version')
  const logoHref = platformNav
    ? `/dashboard-rebrand${rebrandVersion ? `?version=${rebrandVersion}` : ''}`
    : '/dashboard'
  // On the rebrand shell at phone width the left rail is replaced by a
  // hamburger menu (the shell renders the drawer; this opens it).
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  // Demo frame: the shell renders inside a browser-style window (see
  // DeviceFrame). Inject the window chrome (traffic lights + URL) just above
  // the white app header so it reads as the top of the window.
  const framed = device === 'desktop-framed'
  const showHamburger = platformNav && mobile
  const { setOpen: setMobileNavOpen } = useMobileNav()
  const paths = learningPathsFor(brand)
  const defaultPathId = activePathIdFor(brand)
  // Derive the active path id from the URL so the page + panel stay in sync.
  // Only honored when we're actually on the learning-path route.
  const activePathId =
    pathname === '/my-learning/path'
      ? new URLSearchParams(search).get('id') ?? defaultPathId
      : defaultPathId
  const [defaultVersionId, setDefaultVersionId] = useState<DashboardVersionId>(
    () => readDefaultDashboardVersion(),
  )
  const activeVersionId: DashboardVersionId =
    pathname === '/dashboard'
      ? ((new URLSearchParams(search).get('version') as DashboardVersionId | null) ??
        defaultVersionId)
      : defaultVersionId
  const [defaultMembershipVersionId, setDefaultMembershipVersionId] =
    useState<MembershipVersionId>(() => readDefaultMembershipVersion())
  const activeMembershipVersionId: MembershipVersionId =
    pathname === '/membership'
      ? ((new URLSearchParams(search).get('version') as MembershipVersionId | null) ??
        defaultMembershipVersionId)
      : defaultMembershipVersionId
  // When the prototype bar is hidden (`?chrome=off`) the app header is the
  // topmost element, so pin it flush to the viewport top (top: 0) instead of
  // 40px down (below the now-absent bar) — see the sticky `top` below.
  const chromeOff = new URLSearchParams(search).get('chrome') === 'off'
  // `?focus=1` — the locked "kiosk" share view: the header + rail stay VISIBLE
  // but every navigation affordance is disabled. The Cart / Account utilities
  // render `inert` (visible, non-interactive), the mobile hamburger is dropped,
  // and the logo is non-navigating — so a tester on a focused share link sees
  // the full chrome yet can't leave the single page it opens on. Pairs with the
  // rail being `inert` in PlatformShell + `?chrome=off` hiding the prototype tools.
  const focusMode = new URLSearchParams(search).get('focus') === '1'
  // Demo-frame sticky stack. The 40px prototype bar pins at the viewport top
  // (gone under ?chrome=off / ?present=1); the browser-chrome strip pins
  // directly below it; the app header pins below the strip — so all three stay
  // fixed on scroll (the traffic-light strip no longer scrolls away from the
  // header). Outside the Demo frame there's no strip, so the header keeps its
  // original offset.
  const present = new URLSearchParams(search).get('present') === '1'
  const stageTop = chromeOff || present ? 0 : 40
  const headerTop = framed ? stageTop + BROWSER_CHROME_H : stageTop
  // Neutralize the header's navigation (logo → non-link, Cart / Account inert,
  // mobile hamburger dropped) in BOTH the locked kiosk view (?focus=1) AND the
  // Share Demo view (?present=1). In present mode this matters because the logo /
  // cart link to `/dashboard-rebrand` WITHOUT the query string, so clicking one
  // would drop `present=1` and pop the prototype bar + demo controls back into a
  // shared demo — exactly what the audience must never see.
  const noHeaderNav = focusMode || present
  // The notification bell sits BETWEEN Cart and the account menu, which is
  // where it belongs rather than where there was room: Cart is about the
  // store, the bell and the avatar are both about YOU, so the cluster reads
  // as one commerce control then two personal ones. Putting it outboard of
  // the avatar would also separate the badge from the profile it reports on.
  //
  // It renders on the rebrand shell only — its rows deep-link into
  // `?section=…`, which is a shell address. On the classic routes those links
  // would leave the layout the learner is standing in.
  const showBell = useFeatureFlag('header-notifications').enabled && platformNav
  const utilities = (
    <div className="flex items-center" style={{ gap: 12 }} inert={noHeaderNav || undefined}>
      <CartButton />
      {showBell && <NotificationsMenu />}
      <AccountMenu initials="SC" />
    </div>
  )
  return (
    <>
    {/* The prototype utility bar + stakeholder Demo Controls banner now render
        via <PrototypeChrome /> (passed to DeviceFrame in AppLayout) so they can
        span the full screen width above the centered browser window in the Demo
        frame. What stays here is the app's own chrome. */}
    {/* Demo frame chrome — a decorative browser window title bar (traffic
        lights) shown only in the "Demo frame" device mode; it's the top strip
        of the centered browser window, sitting above the real app header. */}
    {framed && <BrowserChromeBar top={stageTop} />}
    <header
      style={{
        position: 'sticky',
        // Sticks below the pinned prototype bar + (in the Demo frame) the browser
        // chrome strip, so the whole top stack stays fixed while scrolling. When
        // the bar is hidden (?chrome=off / ?present=1) the offset drops to 0.
        top: headerTop,
        zIndex: 50,
        background: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-border-subtle)',
        // On the rebrand shell the white bar is capped at the 1440 rail+content
        // width and left-anchored, so on screens wider than 1440 the area to the
        // right shows the page background (matching the shell's right filler)
        // instead of a blank white void beside the utility icons.
        ...(platformNav ? { maxWidth: 1440, alignSelf: 'flex-start', width: '100%' } : null),
      }}
    >
      {/* White header bar. Classic routes center the 1440 content rail
          (`mx-auto`). On the rebrand shell the header is instead LEFT-anchored
          (no `mx-auto`) so it shares the shell's coordinate system: the shell
          grid pins the rail flush to the viewport's left edge and caps
          rail+content at 1440, so left-aligning the same 1440 box keeps the
          logo flush-left over the rail and the utility icons aligned to the
          content's right edge (instead of drifting to the far viewport edge on
          wide screens). */}
      <div
        // `justify-content` is an inline style, NOT the Tailwind `justify-between`
        // class: that class is used nowhere else, and inside a template literal
        // (`justify-between${…}`) Tailwind v4's extractor fails to detect it, so
        // the utility is purged from the production CSS (dev JIT masks this) and
        // the logo + utility icons collapse to the left in prod. Inline style is
        // build-safe.
        className={`flex items-center${platformNav ? '' : ' mx-auto'}`}
        style={{ height: 72, maxWidth: 1440, padding: '0 24px', width: '100%', justifyContent: 'space-between' }}
      >
        <div className="flex items-center" style={{ gap: 8, minWidth: 0 }}>
          {/* Mobile rebrand: a hamburger opens the nav drawer (the shell owns
              the drawer + rail state). */}
          {showHamburger && !noHeaderNav && (
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
              className="cre-icon-pill"
              style={{ flexShrink: 0 }}
            >
              <Bars size={20} aria-hidden />
            </button>
          )}
          {/* Larger logo on the rebrand's slim header (no primary nav, so
              there's room); classic routes keep 40 to leave room for the nav.
              On mobile the logo shrinks to make room for the hamburger. In the
              locked focus / Share Demo views the logo is not a link — it must
              not navigate (which would drop ?focus=1 / ?present=1). */}
          {/* The label names the ACTIVE brand. It was hardcoded to "Colibri
              Real Estate home", so a screen reader announced the wrong brand on
              five of the six — invisible on screen, which is why it survived.
              `brandFullName` is the same string the Switch Account panel shows. */}
          {noHeaderNav ? (
            <span aria-label={logoLabel} style={{ minWidth: 0 }}>
              <Logo height={platformNav ? (mobile ? MOBILE_LOGO_HEIGHT : 52) : 40} />
            </span>
          ) : (
            <Link to={logoHref} aria-label={logoLabel} style={{ minWidth: 0 }}>
              <Logo height={platformNav ? (mobile ? MOBILE_LOGO_HEIGHT : 52) : 40} />
            </Link>
          )}
        </div>

        <div className="flex items-center" style={{ gap: 24 }}>
          {!hidePrimaryNav && (
            <nav className="flex items-center" style={{ gap: 8 }}>
              {/* The Dashboard tab is gated behind the `dashboard-tab` flag
                  (OFF by default): when hidden, the learner lands on the
                  Learning Path page and /dashboard redirects there — they must
                  turn the flag on (from the Learning Path Feature Flag panel)
                  to reveal this tab. */}
              {showDashboardTab && <NavLink to="/dashboard">Dashboard</NavLink>}
              <NavDropdown
                label="My Learning"
                items={[
                  {
                    label: 'Learning Paths',
                    to: '/my-learning/path',
                    icon: 'BookOpen',
                    badge: paths.length,
                    onSelect: openPanel,
                  },
                  { label: 'My Courses', to: '/my-learning/courses', icon: 'Library' },
                  { label: 'Certificates', to: '/my-learning/certificates', icon: 'Award' },
                  { label: 'My Podcasts', to: '/my-learning/podcasts', icon: 'Podcast' },
                ]}
              />
              <NavLink to="/catalog">Course Catalog</NavLink>
              {/* Membership collapsed from a dropdown to a single NavLink —
                  the `/membership` landing page owns Plans/Benefits
                  internally; those routes remain for direct-URL deep links.

                  Hidden for a brand that sells no membership. This was the one
                  membership surface the XCEL brand-add's suppression list
                  missed: the rail item, the `?section=membership` fallback and
                  the `/membership` route were all closed, but this classic
                  header link was not, so it kept advertising a product XCEL
                  does not have. The route redirect meant clicking it bounced
                  to the dashboard rather than opening anything — a dead link
                  rather than a wrong page, which is why it survived. */}
              {supportsMembership(brand) && <NavLink to="/membership">Membership</NavLink>}
            </nav>
          )}

          {utilities}
        </div>
      </div>
      <LearningPathsPanel
        open={pathsOpen}
        // The context selection (set from the rebrand dashboard) takes precedence
        // over the URL/brand default so the pinned Selected Path reflects it.
        activePathId={selectedPathId ?? activePathId}
        // The demo progress-state persona's status (from the "Progress" dropdown)
        // — the pinned/active path reflects it in lockstep with the CLP widget.
        activeStatus={activeStatus}
        onClose={closePanel}
        onSelectPath={(id) => {
          if (platformNav) {
            // On the rebrand dashboard, selecting keeps the learner in place and
            // re-points the Current Learning Path + Jump Back In widgets.
            setActivePathId(id)
            closePanel()
          } else {
            // Everywhere else (Header dropdown), open the path's LP page.
            navigate(`/my-learning/path?id=${encodeURIComponent(id)}`)
          }
        }}
      />
      {/* Dashboard Discoverability is its own feature — the version picker
          offers only its layout variants (Marketing Focused / Learner Focused),
          switched via `?version=` on the shell route. The default is PER BRAND
          (`defaultDiscoverabilityVersionFor` — Marketing Focused for most,
          Learner Focused for XCEL): it carries the "Default" pill AND is what a
          fresh visit loads, and both facts come from that one function so the
          pill can't mark a layout the page doesn't open. The picker is
          URL-driven with no persisted default, so the per-row "Set as default"
          buttons stay hidden (`hideSetDefault`).
          Every other route keeps the full v1–v5/mvp Explore Dashboard list. */}
      {platformNav ? (
        <>
        <DashboardVersionsPanel
          open={versionsOpen}
          onClose={closeVersionsPanel}
          versions={DISCOVERABILITY_DASHBOARD_VERSIONS}
          activeVersionId={
            (new URLSearchParams(search).get('version') as DashboardVersionId | null) ??
            (discoverabilityDefault as DashboardVersionId)
          }
          onSelectVersion={(id) => navigate(`/dashboard-rebrand?version=${id}`)}
          defaultVersionId={discoverabilityDefault as DashboardVersionId}
          onSetDefault={() => {}}
          hideSetDefault
          // Jump-off to the classic dashboard (the "Legacy Dashboard 2.0" tile
          // link). It loads outside this shell, so it's a plain CTA under the
          // version list rather than a selectable version card.
          secondaryCta={{
            label: 'Go to Legacy 2.0 Dashboard',
            onClick: () => navigate('/dashboard'),
          }}
          // Opened from the Feature Flag sheet's "Dashboard Version" row, so the
          // header control is a Back that returns there instead of a Close, and
          // it slides from the right to match that now-right-anchored sheet.
          onBack={() => {
            closeVersionsPanel()
            openFeatureFlagPanel()
          }}
          side="right"
        />
        {/* Membership Version picker (Full ⇄ Simple) for the rebrand's
            "Membership" rail section — opened from the Feature Flag sheet's
            "Membership Version" row. Stores its choice in the
            `membership-page-version` flag; slides from the right + Back returns
            to the flag sheet, matching the Dashboard Version picker. */}
        <DashboardVersionsPanel
          open={membershipPageVersionOpen}
          onClose={closeMembershipPageVersionPanel}
          title="Membership Versions"
          versions={MEMBERSHIP_PAGE_VERSIONS}
          activeVersionId={membershipPageVersion}
          onSelectVersion={(id) => setVariant('membership-page-version', id)}
          defaultVersionId={DEFAULT_MEMBERSHIP_PAGE_VERSION}
          onSetDefault={() => {}}
          hideSetDefault
          onBack={() => {
            closeMembershipPageVersionPanel()
            openFeatureFlagPanel()
          }}
          side="right"
        />
        </>
      ) : (
        <DashboardVersionsPanel
          open={versionsOpen}
          onClose={closeVersionsPanel}
          activeVersionId={activeVersionId}
          onSelectVersion={(id) => navigate(`/dashboard?version=${id}`)}
          defaultVersionId={defaultVersionId}
          onSetDefault={(id) => {
            // The panel hands back a generic string id (it's shared with the
            // Membership Version picker), but this classic panel only lists
            // DASHBOARD_VERSIONS — every id is a valid DashboardVersionId.
            writeDefaultDashboardVersion(id as DashboardVersionId)
            setDefaultVersionId(id as DashboardVersionId)
          }}
        />
      )}
      <JumpBackInPanel open={jumpBackInOpen} onClose={closeJumpBackInPanel} />
      <MembershipVersionsPanel
        open={membershipVersionsOpen}
        onClose={closeMembershipVersionsPanel}
        activeVersionId={activeMembershipVersionId}
        onSelectVersion={(id) => navigate(`/membership?version=${id}`)}
        defaultVersionId={defaultMembershipVersionId}
        onSetDefault={(id) => {
          writeDefaultMembershipVersion(id)
          setDefaultMembershipVersionId(id)
        }}
      />
    </header>
    </>
  )
}

function CartButton() {
  return (
    <Link to="#" aria-label="Cart" className="cre-icon-pill">
      <ShoppingCart size={20} aria-hidden />
    </Link>
  )
}

/** Decorative browser-window title bar for the "Demo frame" device mode. Three
 *  macOS-style traffic-light dots on the left + a centered read-only URL pill.
 *  Purely presentational (aria-hidden) — it frames the app as a window on the
 *  dark demo stage; it does not affect navigation. */
function BrowserChromeBar({ top }: { top: number }) {
  return (
    <div
      aria-hidden
      className="cre-browser-chrome"
      style={{
        // Pins directly below the prototype bar so the browser-window chrome
        // stays fixed together with the app header on scroll.
        position: 'sticky',
        top,
        zIndex: 51,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: BROWSER_CHROME_H,
        padding: '0 16px',
        background: 'var(--color-neutral-300)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <span style={{ display: 'inline-flex', gap: 8, flexShrink: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      </span>
    </div>
  )
}
