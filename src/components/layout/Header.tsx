import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingCart, Bars, HelpCircle } from '@/icons'
import { Logo } from '@/components/brand/Logo'
import { useCourseChrome } from '@/components/learning/courseTakeover'
import { isTestSession } from '@/data/gatewayMode'
import { NavDropdown } from './NavDropdown'
import { NavLink } from './NavLink'
import { AccountMenu } from './AccountMenu'
import { PlatformTopNav } from './PlatformTopNav'
import { showsHelpControl, showsTopNav, useHelpPlacement, useNavPlacement } from './navPlacement'
import { HelpSheet } from '@/components/support/HelpSheet'
import { NotificationsMenu } from '@/components/notifications/NotificationsMenu'
import { LearningPathsPanel } from '@/components/learning/LearningPathsPanel'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanel'
import { isPublicGateway } from '@/data/gatewayMode'
import { useDashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanel'
import { useMembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanelContext'
import { JumpBackInPanel } from '@/components/dashboard/JumpBackInPanel'
import { useJumpBackInPanel } from '@/components/dashboard/JumpBackInPanelContext'
import {
  readDefaultDashboardVersion,
  writeDefaultDashboardVersion,
  dashboardVersionsForAudience,
  defaultDiscoverabilityVersionFor,
  resolveDashboardVersion,
  isAtlasCompassNavVersion,
  isHybridV1Version,
  type DashboardVersionId,
} from '@/data/dashboardVersions'
import {
  readDefaultMembershipVersion,
  writeDefaultMembershipVersion,
  type MembershipVersionId,
} from '@/data/membershipVersions'
import { useAccount, professionFor, supportsMembership } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { useDeviceFrame } from './DeviceFrameContext'
import { useMobileNav } from './MobileNavContext'
import { AtlasTopNav } from './AtlasTopNav'

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
/** Atlas/Compass header depth and logo height — see `atlasSlimHeader`. */
const ATLAS_HEADER_HEIGHT = 60
// 52 → 44 → 40 → 36 (2026-09-24, three reductions: 15%, then 10%, then 10%).
// 36px tall is ~98px wide — JUST clear of the brand guide's 95px minimum
// width. The next step down (a further 10% → 32px, ~87 wide) would cross it.
const ATLAS_LOGO_HEIGHT = 36

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
  /* ⚠ `openFeatureFlagPanel` WENT WITH THE VERSIONS SHEET'S BACK ARROW
     (2026-10-05). It existed only to send a reviewer from that sheet back into
     the Feature Flag panel, which stopped being where they came from when the
     version got its own control on the demo bar. Nothing else in this header
     opens the flag panel — the robot does, from `AdminToolsMenu`. */
  // ARCHIVED 2026-09-16 — the "Membership Versions" picker was unwired with the
  // `membership-page-version` flag it wrote (the XCEL flag audit). It configured
  // the standalone Membership page, which XCEL cannot reach:
  // `supportsMembership('xcel')` is false, so `/membership` redirects and
  // `?section=membership` is refused. `MembershipPageVersionPanelContext`,
  // `membershipPageVersions.ts` and `DashboardVersionsPanel` are all kept.
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
  /* ⚠ THE HEADER BEHAVES DIFFERENTLY INSIDE A COURSE — 2026-09-23, and which
     way depends on WHICH course page. Option 1 keeps the header and takes a
     slightly thicker bottom stroke; Option 2 draws its own header, so this one
     stands down or there are two XCEL logos stacked. Read as a hook,
     unconditionally, and acted on after the rest of them — rules-of-hooks, the
     trap `CompassCoursePlayer`'s header records three times over. See
     `courseTakeover` for why it is a store and not a prop. */
  const courseChrome = useCourseChrome()
  const platformNav = pathname === '/dashboard-rebrand'
  /* WHICH NAVIGATION THE REBRAND SHELL IS SHOWING — `nav-placement`. The top
     nav renders HERE, in the header, because that is where the design puts it
     (Figma 765:3801); the shell drops its rail column to match. Read
     unconditionally — rules of hooks — and acted on in the bar below. */
  const navPlacement = useNavPlacement()
  // Hide the primary top nav on the rebrand shell (wayfinding lives in the left
  // rail) AND on the Onboarding Flow — a required first-run wizard the learner
  // shouldn't be able to navigate away from. Both keep the logo + utility icons.
  const hidePrimaryNav = platformNav || pathname === '/onboarding-flow'
  // The classic Dashboard tab is hidden by default — the `dashboard-tab` flag
  // (OFF by default) must be turned on to reveal it (see App's /dashboard
  // route guard, which redirects to the Learning Path page while hidden).
  /* ⚠ `dashboard-tab` WAS A FLAG, retired 2026-10-05, default OFF — so this
     tab was already hidden for everyone and stays hidden. The second half of
     the pair in `App`'s `DashboardRoute`. */
  const showDashboardTab = false
  /* `logoHref` LIVED HERE and went on 2026-09-23 with the logo's link — see
     the logo's own note. What it knew, for whoever needs it back: on the
     rebrand shell the logo returned to `/dashboard-rebrand` with no
     `?section=` but PRESERVING `?version=`, so it landed on the shell's Home
     without silently switching dashboard version; everywhere else it was
     `/dashboard`. */
  // On the rebrand shell at phone width the left rail is replaced by a
  // hamburger menu (the shell renders the drawer; this opens it).
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  // Atlas/Compass Global Navigation's slimmer header (2026-09-24, the direct
  // ask): 60px deep, not 72, and the logo smaller (52 → 44 → 40 → 36px tall,
  // ~98px wide — just clear of the brand guide's 95px minimum width). Desktop only;
  // every other version keeps 72 / 52. `PlatformShell` reads the same rule
  // to pin its rails under it.
  /* ⚠ RESOLVED, NOT RAW — 2026-10-06. With the raw param this answered false on
     a bare `?demo=1`, so the slim Atlas header went missing the day an Atlas
     version became the default while the body rendered as one. See
     `resolveDashboardVersion`. */
  const rebrandVersion = resolveDashboardVersion(new URLSearchParams(search).get('version'), brand)
  const atlasSlimHeader = platformNav && !mobile && isAtlasCompassNavVersion(rebrandVersion)
  /* Hybrid V1 only — it answers true to `isAtlasCompassNavVersion` as well (it
     takes the Atlas chrome), so anything that must differ between the two asks
     this instead. */
  const hybridVersion = isHybridV1Version(rebrandVersion)
  // Nav Version → Top Nav (2026-09-30): Home + Compass Learning in the header,
  // their left edge on the Atlas rail's right edge. See `AtlasTopNav`.
  // …and Expanding Top Nav (2026-10-01), the same buttons with slide-out links.
  /* ⚠ READS THE UNIFIED AXIS, NOT `?nav=` — 2026-10-05. `useNavPlacement` now
     resolves Eric's three spellings into `nav-placement`'s arms (and still
     honours a pinned `?nav=` URL), so this asks the same question every other
     navigation reader asks instead of a second one that could disagree. */
  const atlasTopNav = atlasSlimHeader && showsTopNav(navPlacement)
  const headerHeight = atlasSlimHeader ? ATLAS_HEADER_HEIGHT : 72
  const desktopLogoHeight = atlasSlimHeader ? ATLAS_LOGO_HEIGHT : 52
  // Demo frame: the shell renders inside a browser-style window (see
  // DeviceFrame). Inject the window chrome (traffic lights + URL) just above
  // the white app header so it reads as the top of the window.
  const framed = device === 'desktop-framed'
  const showHamburger = platformNav && mobile
  /* ⚠ DESKTOP ONLY, AND THE HAMBURGER IS WHY. At phone width the rebrand's
     nav is already a drawer (`showHamburger` below, which opens the shell's
     `MobileNavDrawer` — and that drawer renders the RAIL, under either
     option). Three pills in a 375px header push the logo and the utility icons
     off the bar entirely, so the top nav stands down and the designed mobile
     path takes over. The Figma is a 1392px frame and says nothing about phone;
     this is the shell's existing answer rather than a new one. */
  /* ⚠ `!atlasSlimHeader` — ADDED 2026-10-05, FIXING A REGRESSION THE ATLAS
     MERGE SHIPPED. Two top navs arrived on this header from two branches and
     neither knew about the other: `AtlasTopNav` beside the logo (Eric's, drawn
     whenever an Atlas version is on and `?nav=` is not `left-rail`) and
     `PlatformTopNav` here in the utility cluster (`nav-placement`). That flag
     defaults to `top`, so on Eric's versions BOTH were true and the header grew
     a second pill row. Nothing failed — each nav was correct alone, and every
     test of either one passed.

     ⚠ KEYED ON THE VERSION, NOT ON `atlasTopNav`. An Atlas version on
     `?nav=left-rail` draws no Atlas pills, and main's top nav must not fill the
     gap — the whole point of that arm is Eric's RAIL. `AtlasHeaderOneNav.test.tsx`
     pins that case specifically, because it is the one a narrower gate breaks.

     ⚠ THIS IS THE HEADER HALF OF A PAIR. `PlatformShell` tests `topNav` before
     every Atlas arm for the same collision on the RAIL side; see the note on
     its `gridTemplateColumns`. The two together are what keep "which navigation
     is on screen" a single answer. */
  const showTopNav = platformNav && showsTopNav(navPlacement) && !mobile && !atlasSlimHeader
  /* HELP'S OWN CONTROL — `nav-help`, 2026-10-01. Rendered only where the rail
     is NOT (see `showsHelpControl`): with the rail up its Get Help row already
     carries Help and a second control is a duplicate. `platformNav` scopes it
     to the shell the same way `showTopNav` is scoped — the classic routes have
     their own full nav and are not part of this comparison.

     THE SHEET LIVES HERE, not in either trigger, because the two triggers are
     in different components (this header and `AccountMenu` below it) and both
     must open the SAME one. Header owns the state and hands the opener down as
     a prop; a context for one boolean between a parent and its own child would
     be ceremony. */
  const helpPlacement = useHelpPlacement()
  const showHelpControl = platformNav && showsHelpControl(navPlacement) && !mobile
  const [helpOpen, setHelpOpen] = useState(false)
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
  /* ⚠ `test` BELONGS IN THIS SUM, and leaving it out was a real bug — the
     header "did a weird static thing while the rest of the page scrolled".
     `?test=1` (the moderated session view) hides the 40px prototype bar just
     as `chrome=off` and `present=1` do, but this offset went on reserving its
     height: the sticky stack pinned 40px below the top of the stage and page
     content scrolled up through the gap. Any future param that hides the
     prototype bar has to be added here too — the list of hiders lives in
     `PrototypeChrome`, and these two have to agree. */
  const test = isTestSession(search)
  const stageTop = chromeOff || present || test ? 0 : 40
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
  const ericAtlasV1 = useFeatureFlag('dashboard-version-eric-atlas-v1').enabled
  // A shell address for one section, keeping every other param (the demo's).
  const atlasSectionHref = (section: string) => {
    const next = new URLSearchParams(search)
    next.delete('coursePage')
    next.set('section', section)
    return `/dashboard-rebrand?${next}`
  }
  const utilities = (
    <div className="flex items-center" style={{ gap: 12 }} inert={noHeaderNav || undefined}>
      {/* CART — UNWIRED 2026-09-21, the direct ask ("no cart"). See
          ARCHIVED_ITEMS id `header-cart`.

          It was a `<Link to="#">`: a control that has never gone anywhere, in a
          product where the learner is already enrolled and buys on
          xcelsolutions.com rather than in the LMS. So it promised a storefront
          this app does not have.

          EDITORIAL, so it is unwired + archived rather than gated on a brand
          predicate — unlike the membership upsells removed in the same pass,
          which are a CORRECTNESS fix and return on their own for a brand that
          sells one. There is no `supportsCart` to hang this on, and inventing
          one would be a predicate that is false for every brand in the union.

          The comment below about the cluster reading "one commerce control then
          two personal ones" is kept because it is the argument for where the
          BELL sits, which has not changed. */}
      {/* RESOURCES · GET HELP — the Atlas header's text links, 40px left of
          the bell (2026-10-01, the designer's request): the group's 12px gap
          plus 28. They change only the section, so the demo's params survive. */}
      {/* ⚠ HYBRID V1 DIFFERS TWICE HERE — 2026-10-06, both direct asks, both
          scoped to that version so Eric's header is untouched.

            • RESOURCES IS NOT IN THE HEADER. It moved into the Quick Links
              card, under My Certificates (`HybridHomeV1`), where the rest of
              the destinations already live. Two places to reach Resources was
              the thing to remove, not the header link per se.
            • "HELP", NOT "GET HELP". The same destination; the shorter label
              is the ask, and it sits better alone than a two-word link did
              beside a sibling.

          The `<nav aria-label="Help">` stays either way — it is the landmark
          for this cluster, and on Hybrid it just holds one link. */}
      {atlasSlimHeader && (
        <nav aria-label="Help" style={{ display: 'flex', alignItems: 'center', gap: 24, marginRight: 28 }}>
          {hybridVersion ? null : (
            <Link to={atlasSectionHref('resources')} className="cre-atlas-header-link">
              Resources
            </Link>
          )}
          <Link to={atlasSectionHref('support')} className="cre-atlas-header-link">
            {hybridVersion ? 'Help' : 'Get Help'}
          </Link>
        </nav>
      )}
      {/* HELP, AS A `?` — `nav-help: header-icon`. LEFT OF THE BELL, which is
          where the Figma puts it (765:3801) and the reason the cluster's gap is
          the separation it is. The alternative placement does not render here
          at all; it is a row in the menu below.

          ⚠ `!atlasSlimHeader` ADDED IN THE 2026-10-05 MERGE. Both treatments
          answer "where is Help", and on the Atlas version both conditions are
          true — so without this the header would carry the `?` AND the text
          links, two answers to one question. Atlas's own links win on its own
          version; everywhere else this is unchanged. */}
      {!atlasSlimHeader && showHelpControl && helpPlacement === 'header-icon' && (
        <button
          type="button"
          data-cta-id="nav.support"
          onClick={() => setHelpOpen(true)}
          aria-label="Help"
          aria-haspopup="dialog"
          className="cre-icon-pill"
        >
          <HelpCircle size={20} aria-hidden />
        </button>
      )}
      {showBell && <NotificationsMenu />}
      {/* No props — the menu resolves the learner from `useAccount()` and the
          profile-avatar override, the same two sources the rail's profile
          header reads. It used to be passed `initials="SC"`, which is not this
          learner's initials and was the only value it ever received. */}
      <AccountMenu
        /* HELP, AS A MENU ROW — `nav-help: profile-menu`. Passed as an opener
           rather than a boolean so the menu never has to know WHY it is showing
           a Help row, only what pressing it does. Undefined under every other
           setting, which is the same withheld-prop mechanism the rail uses for
           its collapse toggle. */
        onOpenHelp={
          showHelpControl && helpPlacement === 'profile-menu'
            ? () => setHelpOpen(true)
            : undefined
        }
      />
    </div>
  )
  /* AFTER EVERY HOOK, BEFORE ANY MARKUP — see `courseTakeover`. Option 2's
     full-screen page owns the header while it is open. */
  if (courseChrome === 'takeover') return null
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
        /* 2px AND BLUE INSIDE A COURSE, a 1px hairline everywhere else —
           2026-09-23, two asks an hour apart ("a slightly thicker bottom
           stroke", then "make the bottom stroke be blue").

           ⚠ THE NOTE HERE ARGUED AGAINST THE COLOUR, on the grounds that a
           weight change reads as a boundary while a colour reads as a theme
           change. The ask settled it, and the reasoning survives the reversal:
           it is the BRAND primary rather than a darker neutral, so it reads as
           an accent marking a place rather than as a hairline someone
           darkened. Weight and colour move together — either alone is weaker
           than the pair. */
        borderBottom:
          courseChrome === 'course'
            ? '2px solid var(--color-primary-500)'
            : '1px solid var(--color-border-subtle)',
        // On the rebrand shell the white bar is capped at the 1440 rail+content
        // width and left-anchored, so on screens wider than 1440 the area to the
        // right shows the page background (matching the shell's right filler)
        // instead of a blank white void beside the utility icons.
        // …EXCEPT on Atlas/Compass (2026-09-24): its window is 1608 wide and the
        // right filler is the warm page, so a 1440 bar left a stub of page
        // colour beside the header. The bar runs the full width, and so does
        // the row inside it (see below).
        ...(platformNav
          ? { maxWidth: atlasSlimHeader ? 'none' : 1440, alignSelf: 'flex-start', width: '100%' }
          : null),
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
        className={`flex items-center${platformNav ? '' : ' mx-auto'}${atlasSlimHeader ? ' cre-atlas-header' : ''}`}
        // Atlas: the row is uncapped too (2026-09-24, the direct ask), so the
        // bell + profile sit 24px from the window's right edge — the same 24
        // the logo sits from its left.
        style={{ height: headerHeight, maxWidth: atlasSlimHeader ? 'none' : 1440, padding: '0 24px', width: '100%', justifyContent: 'space-between' }}
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
          {/*
            ⚠ NEVER A LINK, AS OF 2026-09-23 — the direct ask: "clicking on the
            logo in the top left should NOT do anything, please kill that
            link."

            It used to be a `<Link to={logoHref}>` everywhere except the locked
            kiosk / Share Demo views, where it was already a span for a narrow
            reason: navigating would have dropped `?focus=1` / `?present=1`.
            That branch is now the only branch, so `noHeaderNav` no longer
            decides it.

            ⚠ A SPAN, NOT A DISABLED LINK OR A NO-OP HANDLER. There is nothing
            to operate, so there should be nothing in the tab order and nothing
            announcing itself as a link — which is this shell's rule for the
            other inert chrome (the top bar's Notes and Ask Rubi are spans for
            exactly this reason). `aria-label` stays: the logo is still the
            brand's name to a screen reader, it just is not a destination.
          */}
          <span aria-label={logoLabel} style={{ minWidth: 0 }}>
            <Logo height={platformNav ? (mobile ? MOBILE_LOGO_HEIGHT : desktopLogoHeight) : 40} />
          </span>
          {/* TOP NAV — 40px right of the logo, whatever the logo's width
              (2026-09-30, the designer's request; it first sat on the rail's
              260px edge): the group's 8px gap + 32 margin. In the logo's own
              group so the row centres it vertically. Inert in the locked focus
              / Share Demo views, like the rest of the header's navigation. */}
          {atlasTopNav && (
            <div
              inert={noHeaderNav || undefined}
              style={{
                /* ⚠ 12 ON HYBRID V1, 32 EVERYWHERE ELSE — 2026-10-06, the
                   direct ask to shift the pills left. Eric's 32 is measured off
                   the Atlas rail's edge (see the note above); Hybrid has no
                   rail on Home, so the gap was holding the pills off nothing. */
                marginLeft: hybridVersion ? 12 : 32,
                flexShrink: 0,
                /* ⚠ THE IDLE PILL LOSES ITS STROKE on Hybrid, by neutralising
                   the TOKEN here rather than editing `.cre-atlas-topnav-btn` —
                   that class is Eric's too, and only the Global skin sets a
                   stroke at all. An inline custom property on this wrapper
                   cascades to the buttons inside it and to nothing else. */
                ...(hybridVersion
                  ? { ['--color-atlas-topnav-idle-stroke' as string]: 'transparent' }
                  : null),
              }}
            >
              <AtlasTopNav expanding={navPlacement === 'expanding-top'} />
            </div>
          )}
        </div>

        {/* 16 WHEN THE TOP NAV IS UP, 24 otherwise. The 24 is the classic
            routes' spacing between a full primary nav and the utilities; with
            the shell's short pill row it left a gap wider than the gaps inside
            the row itself, which read as the bell drifting away from the nav.
            Scoped rather than changed outright — every other route keeps 24. */}
        <div className="flex items-center" style={{ gap: showTopNav ? 16 : 24 }}>
          {/* The platform shell's own primary nav, when the shell is drawing
              it up here instead of down the left side. It sits in this
              right-hand cluster rather than beside the logo because the design
              aligns it with the utility icons, and the cluster's 24px gap is
              the separation the design draws between Help and the bell. */}
          {showTopNav && <PlatformTopNav />}
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
          versions={
            /* ⚠ TWO FILTERS, BOTH KEPT (merged 2026-10-05). The AUDIENCE one
               lists `ready` versions only on the demo site — the picker became
               reachable by stakeholders when it moved to the demo bar. Eric's
               V1 gate is narrower and older: that version is hidden from
               everyone until its own flag is on. They stack; neither replaces
               the other.

               ⚠ A PLAIN COMMENT INSIDE THE BRACES. A JSX comment in an
               ATTRIBUTE position is a syntax error, which is how this landed
               broken the first time — and writing the JSX comment delimiters
               out here to explain that closed this comment early, which is how
               it landed broken the second. */
            ericAtlasV1
              ? dashboardVersionsForAudience(isPublicGateway())
              : dashboardVersionsForAudience(isPublicGateway()).filter(
                  (v) => v.id !== 'eric-atlas-v1',
                )
          }
          designerTabs
          activeVersionId={
            (new URLSearchParams(search).get('version') as DashboardVersionId | null) ??
            (discoverabilityDefault as DashboardVersionId)
          }
          onSelectVersion={(id) => navigate(`/dashboard-rebrand?version=${id}`)}
          defaultVersionId={discoverabilityDefault as DashboardVersionId}
          onSetDefault={() => {}}
          hideSetDefault
          /* ⚠ "Go to Legacy 2.0 Dashboard" WAS HERE AND WENT — 2026-10-05, the
             direct ask. It navigated to `/dashboard`, the classic shell, from
             under the version list. The classic dashboard is unchanged and
             still at that route; what went is this door to it. */
          /* ⚠ AND THE BACK ARROW WENT WITH IT, as a BUG FIX rather than a
             second ask. It read "opened from the Feature Flag sheet's Dashboard
             Version row, so the header control is a Back that returns there" —
             and that row was removed earlier today when the version got its own
             control on the demo bar. The sheet is opened from the BAR now, so
             Back was returning the reviewer to a sheet they had never been in.
             No `onBack` means the header draws Close, which is where they
             actually came from. Caught while removing the CTA above, not by a
             test: nothing asserts where a back arrow goes. */
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
      {/* HELP — ONE SHEET FOR BOTH TRIGGERS (`nav-help`). It renders here
          rather than beside either control because the `?` icon and the account
          menu's Help row are in different components and must open the same
          thing. Mounted whenever the control is available and gated on `open`
          inside `Sheet`, the same shape as the panels above it. */}
      {showHelpControl && <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />}
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

/**
 * UNWIRED 2026-09-21 — see the note at the utilities cluster and ARCHIVED_ITEMS
 * `header-cart`. EXPORTED rather than left as an unreferenced local function,
 * because that is a lint error; the same treatment `NavProfileHeader` and
 * `MotivationalStatementCard` get.
 */
export function CartButton() {
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
