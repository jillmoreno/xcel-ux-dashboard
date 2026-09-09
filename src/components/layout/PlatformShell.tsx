import { type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount, supportsMembership, type Brand } from '@/context/AccountContext'
import { defaultDiscoverabilityVersionFor } from '@/data/dashboardVersions'
import { SectionContent } from '@/components/membership/v7/MembershipV7'
import { ArrowLeft } from '@/icons'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { ResourceDetailPage } from '@/pages/ResourceDetailPage'
import { CourseLauncherProvider, useCourseLauncher } from './CourseLauncherContext'
import { ResourceLauncherProvider, useResourceLauncher } from './ResourceLauncherContext'
import { CatalogPage } from '@/pages/CatalogPage'
import { MyCoursesPage } from '@/pages/MyCoursesPage'
import { LearningPathPage } from '@/pages/LearningPathPage'
import { LearningPathsHome } from '@/components/learning/LearningPathsHome'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { isHomeActive } from '@/components/learning/learningPathsHomeUtil'
import { useLearningPathSummariesForBrand } from '@/data/learningPathsCountVariant'
import { activePathIdFor } from '@/data/learningFixtures'
import { XCEL_CE_PATH_ID } from '@/data/studyCalendarFixtures'
import { InlineStudyCalendar } from '@/components/learning/study-calendar/InlineStudyCalendar'
import { useCeStudyPlanEnabled, useFeatureFlag } from '@/context/FeatureFlagContext'
import { useTheme, type NavVariant } from '@/context/ThemeContext'
import { CertificatesPage } from '@/pages/CertificatesPage'
import { ProfilePage } from '@/pages/ProfilePage'
import {
  AccountSectionLayout,
  AccountSectionPlaceholder,
} from '@/components/account/AccountSectionLayout'
import { isAccountSection } from '@/components/account/accountSections'
import { GiftRecipientsPanel } from '@/components/account/purchases/GiftRecipientsPanel'
import { LibraryPanel } from '@/components/membership/LibraryPanel'
import { LearningLibraryHero } from '@/components/membership/LearningLibraryHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { Gauge, Podcast, X } from '@/icons'
import { Avatar } from '@/components/ui/Avatar'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useDeviceFrame } from './DeviceFrameContext'
import { useMobileNav } from './MobileNavContext'
import { MembershipBenefitsPanel } from '@/components/membership/MembershipBenefitsPanel'
import { MembershipStandalonePage } from '@/components/membership/MembershipStandalonePage'
import { PartnerOfferingsPanel } from '@/components/membership/PartnerOfferingsPanel'
import { partnerOfferingsFor } from '@/data/membership/partnerOfferingsFixtures'
import { ResourcesPanel } from '@/components/membership/ResourcesPanel'
import { resourcesCopyFor, resourcesFor } from '@/data/membership/resourcesFixtures'
import { NonMemberUpsellHero } from '@/components/membership/NonMemberUpsellHero'
import { RecommendedForYouPanel } from '@/components/dashboard/recommended/RecommendedForYouPanel'
import { HelpSupportPanel } from '@/components/support/HelpSupportPanel'
import { BenefitUpsellHero } from '@/components/membership/BenefitUpsellHero'
import { MembershipSectionHero } from './MembershipSectionHero'
import {
  sectionHeroMetaFor,
  LIGHT_HERO_SECTION_META,
  type BrandHeroSection,
  type LightHeroSection,
  type SectionHeroMeta,
} from '@/data/membership/sectionHeroMeta'
import { PlatformSideNav, type PlatformNavVariant, type PlatformSection } from './PlatformSideNav'

/**
 * Elite-only platform shell (the `platform-left-nav` flag). Renders on
 * `/dashboard` as a persistent landing surface: a full-bleed dark left
 * rail + a content column. Clicking a rail item swaps the content column
 * IN PLACE (controlled state) — the rail never leaves. The only escape is
 * Course Catalog in the top header (a real route, with a back breadcrumb).
 *
 * Sections:
 *   - `dashboard` → the membership "Your Membership" overview, reused as
 *     the landing content (the overview content was moved here from the
 *     Membership group, which no longer carries a "Your Membership" item).
 *   - `learning-path` / `courses` / `certificates` / `podcasts` → the
 *     existing My Learning pages, reused in place.
 *   - `m-*` → the matching `MembershipV7` section, reused in place.
 *   - `catalog` → the Course Catalog (`CatalogPage`), reused in place under
 *     the "Explore Products" group.
 */

// `m-whats-new` (Explore Membership) is handled specially in `renderBody`
// (it renders the benefit-heroes view), so it's intentionally absent here.
const MEMBERSHIP_MAP: Record<string, string> = {
  'm-learning-library': 'learning-library',
  'm-exam-prep': 'exam-prep',
  'm-career-tools': 'career-tools',
  'm-more': 'more',
}

const VALID_SECTIONS: PlatformSection[] = [
  'dashboard',
  'study-plan',
  'readiness',
  'recommended',
  'learning-path',
  'courses',
  'certificates',
  'podcasts',
  'm-whats-new',
  'm-learning-library',
  'm-exam-prep',
  'm-career-tools',
  'm-more',
  'membership',
  'catalog',
  'resources',
  'support',
  'profile',
  // The rest of the account area — one shell section each, so the account
  // sub-nav has somewhere real to point (they used to be top-nav
  // placeholders outside the shell).
  'notifications',
  'licenses',
  'transcripts',
  'payment-methods',
  'purchases',
  'gift-recipients',
]

export function PlatformShell() {
  // Wrap the shell in the in-shell course-launcher provider so a card deep in
  // the content (the Jump Back In tile) can open the Learning Launcher in place.
  return (
    <CourseLauncherProvider>
      <ResourceLauncherProvider>
        <PlatformShellBody />
      </ResourceLauncherProvider>
    </CourseLauncherProvider>
  )
}

function PlatformShellBody() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  // A brand with no membership (XCEL) has no Membership page and no Partner
  // Offers — both are rail items the rail already drops for it, so a stale
  // `?section=` deep link must not smuggle them back in. Falls back to the
  // dashboard, matching how the archived `?section=resources` degrades (it is
  // simply absent from VALID_SECTIONS, so it resolves to null → dashboard).
  const hasMembership = supportsMembership(brand)
  // Seed the initial section from `?section=` when valid (lets the rail be
  // deep-linked / survive a refresh); default to the Dashboard landing —
  // except in the MVP nav (`?nav=mvp`), which drops "Home" (added later), so it
  // lands on Learning Path instead of an orphaned dashboard with no rail entry.
  const [params, setParams] = useSearchParams()
  const requested = params.get('section')
  const mvpNav = params.get('nav') === 'mvp'
  // Active section is URL-driven via `?section=` (default: Dashboard — or
  // Learning Path in the MVP nav, which has no Home item). Keeping it in the URL
  // lets the header logo return Home by navigating to `/dashboard-rebrand` (no
  // `?section=`), and makes a section deep-linkable / refresh-stable.
  // The "Membership" page is part of the Demo as well as the sandbox now, so the
  // resolved section is no longer guarded against `?demo=1` — a
  // `?demo=1&section=membership` deep link opens the page instead of falling
  // back to the dashboard. Paired with the rail item in PlatformSideNav; BOTH
  // gates had to go, since the rail item alone still bounced off this one.
  //
  // The cancellation flow stays out of the Demo as a stubbed CTA — see
  // `demoMode` in ManageMembershipPanel.
  // ARCHIVED 2026-08-25 — `m-whats-new` (What's New / Explore Membership) was
  // unwired: its rail item is gone and any `?section=m-whats-new` resolves to
  // the Membership section instead, so an old link or bookmark lands somewhere
  // real rather than on a section with no way back to it. The id stays in
  // VALID_SECTIONS only so this redirect can recognise it.
  const requestedSection = requested === 'm-whats-new' ? 'membership' : requested
  const requested2: PlatformSection | null =
    requestedSection && (VALID_SECTIONS as string[]).includes(requestedSection)
      ? (requestedSection as PlatformSection)
      : null
  const resolved: PlatformSection | null =
    !hasMembership && (requested2 === 'membership' || requested2 === 'm-more')
      ? null
      : requested2
  const active: PlatformSection =
    resolved
      ? resolved
      : mvpNav
        ? 'learning-path'
        : 'dashboard'
  const launcher = useCourseLauncher()
  const resourceLauncher = useResourceLauncher()
  // The Learning Launcher is an orphan surface with no rail item of its own
  // (it's reached from Catalog, What's New, Recommended, My Courses, …). While
  // it's open, the rail shows NO active row — we pass a section the rail never
  // renders (`profile`) so nothing highlights, keeping the active state honest.
  // Orientation is carried by the launcher's "Back to {origin}" link instead;
  // the origin is the section the launcher overlays (the URL-driven `active`,
  // which is left unchanged while the launcher is open).
  const launcherOpen = launcher.courseId != null
  const railActive: PlatformSection = launcherOpen ? 'profile' : active
  const launcherBackLabel = SECTION_TITLES[active]
  // Selecting a rail item closes any open launcher + writes the section to the
  // URL (Dashboard drops the param so the logo's `/dashboard-rebrand` reads as
  // Home). `replace` keeps history clean — the same in-place feel as before.
  const handleSelect = (id: PlatformSection) => {
    launcher.close()
    resourceLauncher.close()
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === 'dashboard') next.delete('section')
        else next.set('section', id)
        return next
      },
      { replace: true },
    )
  }
  // Dashboard Current Learning Path card → the Learning Path section drilled
  // into that path's detail: set `?id=` (so v2's landing grid yields to the
  // single-path detail) and switch the section in place.
  const openLearningPathDetail = (pathId: string) => {
    launcher.close()
    resourceLauncher.close()
    setParams(
      (prev) => {
        const merged = new URLSearchParams(prev)
        merged.set('id', pathId)
        merged.set('section', 'learning-path')
        return merged
      },
      { replace: true },
    )
  }
  // Dashboard layout variant (the Discoverability feature's "Dashboard Version"
  // picker). **Marketing Focused is the default** — a fresh visit (no `?version=`)
  // lands on the joined CLP + What's New marketing-carousel top-section card;
  // `?version=discoverability-learner-focused` → the Jump Back In joined band.
  // Read reactively so flipping the picker re-skins the dashboard in place.
  // (The earlier Side-by-side, Vibrant, and Stacked-cards explorations were
  // retired — the rebrand ships only these two layouts.)
  // Navigation variant — `?nav=mvp` renders the trimmed MVP rail (Figma
  // 53:5290) instead of the full Explore group. Read reactively so the
  // walkthrough deep-links land on the right rail.
  const navVariant: PlatformNavVariant = mvpNav ? 'mvp' : 'full'
  // With no `?version=` the layout comes from the BRAND's default, not a
  // hardcoded one — XCEL leads with Learner Focused (see
  // `defaultDiscoverabilityVersionFor`, which the Header's picker reads too so
  // the "Default" pill and the page can't disagree).
  const versionParam = params.get('version') ?? defaultDiscoverabilityVersionFor(brand)
  const dashboardLayout: 'default' | 'learner-focused' | 'marketing-focused' | 'badged' =
    versionParam === 'discoverability-learner-focused'
      ? 'learner-focused'
      : versionParam === 'discoverability-badged'
        ? 'badged'
        : 'marketing-focused'

  // Mobile preview (the PrototypeBar device toggle → 390px frame) swaps the
  // left-rail desktop shell for a native-feeling single-column mobile layout:
  // a navy profile band on top + a fixed bottom tab bar. The rail's content
  // sections are reused; the dashboard is forced to the single-column stacked
  // layout (the wide rail/side-by-side layouts can't fit 390px).
  const { device } = useDeviceFrame()

  // Shared rail color. Off flag → the rail follows the user's Appearance
  // preference (ThemeContext → navVariant); on flag → an explicit demo override.
  // Both speak the same six-treatment vocabulary — three DARK rails (navy /
  // graphite / brand-800) that keep the light-on-dark fg tokens, and three LIGHT
  // rails (Light 1/2/3) that swap in the dark-on-light fg token set + a hairline
  // right border + the accessible selected state (near-black active icon +
  // secondary-700 left bar; the pale tint fill alone isn't ≥3:1). A light rail
  // would glare on the dark charcoal page, so in dark theme light rails fall back
  // to graphite.
  // "Left Nav Color Options" — one demo flag that forces the rail to any of the
  // six named rails (navy / graphite / brand-800 / Light 1–3) OR any Nectar 2.0
  // Neutral step (050 #FFFFFF → 950 #000000). Off → the rail follows the user's
  // Appearance preference. (Merged from the old platform-nav-color + nav-gray-scale.)
  const navColorFlag = useFeatureFlag('nav-gray-scale')
  const { theme, navVariant: railVariant } = useTheme()

  // The Nectar 2.0 Neutral ramp (Figma node 192:1787). `light` = which steps get
  // the dark-text light-rail treatment vs the white-text dark-rail treatment
  // (chosen so black text clears AA on 050–600 and white text on 700–950).
  const NECTAR_GRAYS: Record<string, { hex: string; light: boolean }> = {
    '050': { hex: '#ffffff', light: true },
    '075': { hex: '#f5f5f5', light: true },
    '100': { hex: '#ececec', light: true },
    '200': { hex: '#d9d9d9', light: true },
    '300': { hex: '#c7c7c7', light: true },
    '400': { hex: '#848484', light: true },
    '500': { hex: '#a2a2a2', light: true },
    '600': { hex: '#818181', light: true },
    '700': { hex: '#616161', light: false },
    '800': { hex: '#404040', light: false },
    '900': { hex: '#202020', light: false },
    '950': { hex: '#000000', light: false },
  }
  // The flag's active value — a named rail (navy/…/light-3) or a gray step
  // (050–950). Only meaningful while the flag is on.
  const navColorValue = navColorFlag.enabled ? (navColorFlag.variant ?? 'navy') : undefined
  const isGrayStep = navColorValue != null && navColorValue in NECTAR_GRAYS

  type RailKind = 'navy' | 'graphite' | 'brand-800' | 'neutral-800' | 'light-1' | 'light-2' | 'light-3'
  const railFromFlag = (v: string | undefined): RailKind => {
    switch (v) {
      case 'graphite':
        return 'graphite'
      case 'brand-800':
        return 'brand-800'
      case 'light':
        return 'light-1'
      case 'light-2':
        return 'light-2'
      case 'light-3':
        return 'light-3'
      default:
        return 'navy'
    }
  }
  const railFromNav = (v: NavVariant): RailKind => (v === 'light' ? 'light-1' : v)

  // A named-rail selection wins over Appearance; a gray-step selection is
  // applied below (bypasses railKind); off → follow Appearance.
  let railKind: RailKind =
    navColorFlag.enabled && !isGrayStep
      ? railFromFlag(navColorValue)
      : railFromNav(railVariant)
  const isLightKind = railKind === 'light-1' || railKind === 'light-2' || railKind === 'light-3'
  if (isLightKind && theme === 'dark') railKind = 'graphite' // light rail glares on the dark page

  const useLightRail = railKind === 'light-1' || railKind === 'light-2' || railKind === 'light-3'
  const DARK_RAIL_SURFACE: Record<'navy' | 'graphite' | 'brand-800' | 'neutral-800', string> = {
    navy: '#17233f',
    graphite: '#2b2d31',
    'brand-800': 'var(--color-primary-800)', // the brand's Primary 800 (per brand)
    'neutral-800': 'var(--color-neutral-800)', // Dim rail
  }
  const LIGHT_RAIL_SURFACE: Record<'light-1' | 'light-2' | 'light-3', string> = {
    'light-1': 'var(--color-neutral-50)',
    'light-2': '#e7eaef',
    // Light 3 = a light brand tint — the brand's Primary 100 mixed 25% with
    // white (per brand), so it reads as a quiet on-brand wash, not the full ramp.
    'light-3': 'color-mix(in srgb, var(--color-primary-100) 25%, #fff)',
  }
  // Light rail — dark-on-light fg tokens. Selected state keeps Option C's soft
  // secondary tint fill, but the active ICON goes near-black and a secondary-700
  // left BAR supplies the ≥3:1 selected indicator. Reused by every light rail
  // (Light 1/2/3) AND the light Nectar-gray steps.
  const lightRailStyle = (surface: string): React.CSSProperties =>
    ({
      ['--color-nav-surface' as string]: surface,
      ['--color-nav-fg' as string]: '#1b1d21',
      ['--color-nav-fg-muted' as string]: '#565a63',
      // Group captions + the "Member since / Expires" meta line. The dark-rail
      // token is white@55%, which on the light rail flattened to #8a8f98 — only
      // 2.6:1 on the lightest surface (fails WCAG AA). #5f636c clears 4.5:1 on
      // every light surface while staying a touch lighter than the idle items.
      ['--color-nav-caption' as string]: '#5f636c',
      ['--color-nav-divider' as string]: 'rgb(0 0 0 / 0.08)',
      ['--color-nav-hover' as string]: 'rgb(0 0 0 / 0.045)',
      // No rail right border — the light rail blends into the content pane
      // (matches the dark rails, which keep this transparent).
      ['--color-nav-border' as string]: 'transparent',
      ['--color-nav-icon-active' as string]: '#1b1d21',
      // Selected-row primary accent on the light rail: darken the icon + left bar
      // to primary-700 (the light primary-200 used on the dark rails is
      // near-invisible on the pale surface). primary-700 clears ≥4.5:1 on the
      // shipped light surfaces.
      ['--color-nav-icon-active-primary' as string]: 'var(--color-primary-700)',
      ['--color-nav-active-bar-primary' as string]: 'var(--color-primary-700)',
      ['--color-nav-active-bar' as string]: 'var(--color-secondary-700)',
    }) as React.CSSProperties
  const darkRailStyle = (surface: string): React.CSSProperties =>
    ({ ['--color-nav-surface' as string]: surface }) as React.CSSProperties

  let navSurfaceStyle: React.CSSProperties
  if (isGrayStep) {
    const g = NECTAR_GRAYS[navColorValue!] ?? NECTAR_GRAYS['100']
    navSurfaceStyle = g.light ? lightRailStyle(g.hex) : darkRailStyle(g.hex)
  } else if (useLightRail) {
    navSurfaceStyle = lightRailStyle(LIGHT_RAIL_SURFACE[railKind as 'light-1' | 'light-2' | 'light-3'])
  } else {
    navSurfaceStyle = darkRailStyle(DARK_RAIL_SURFACE[railKind as 'navy' | 'graphite' | 'brand-800' | 'neutral-800'])
  }

  if (device === 'mobile') {
    return (
      <PlatformMobileShell
        active={active}
        railActive={railActive}
        isMember={isMember}
        onSelect={handleSelect}
        dashboardLayout={dashboardLayout}
        navVariant={navVariant}
        launcher={launcher}
        launcherBackLabel={launcherBackLabel}
        navSurfaceStyle={navSurfaceStyle}
      />
    )
  }

  // With the prototype bar hidden (`?chrome=off`), there's no 40px bar above the
  // app header, so the sticky offsets shift up by 40: the header pins at top:0
  // (handled in Header) and the rail pins right under the 72px header (top:72)
  // instead of below bar+header (112) — no gap, header stays fixed to the top.
  const chromeOff = params.get('chrome') === 'off'
  const railTop = chromeOff ? 72 : 112
  // `?focus=1` — the locked "kiosk" share view: collapse the left rail so the
  // page is a single content column with no way to navigate to other sections.
  // (The header's Cart / Account / hamburger + logo link are also neutralized —
  // see Header — and `?chrome=off` hides the prototype tools.)
  const focus = params.get('focus') === '1'

  return (
    <div
      // Stable hook so the prototype Live-Preview embed can neutralize the
      // `min-height: 100vh` floor (it injects a scoped override into the iframe
      // only, so the real app + full-screen tab keep the floor).
      className="cre-platform-shell-grid"
      style={{
        ...navSurfaceStyle,
        display: 'grid',
        // Rail is a fixed 264px column anchored flush to the viewport's LEFT
        // edge at every width (no left filler), so the nav never floats inward
        // on wide screens. Content stays capped (264 + 1176 = the 1440 content
        // width); any extra width on ultra-wide screens falls to the right filler.
        gridTemplateColumns: '264px minmax(0, 1176px) 1fr',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      {/* Left nav rail — flush-left column. In the locked kiosk share view
          (`?focus=1`) the rail stays VISIBLE but is made `inert` (below), so a
          tester sees the full nav yet can't click into any other section. */}
      <div
        style={{
          background: 'var(--color-nav-surface)',
          // Rail right border — transparent in every mode (the rail blends
          // into the content pane); kept as a token hook in case a separator
          // is wanted later.
          borderRight: '1px solid var(--color-nav-border)',
        }}
      >
        {/* Pin the rail: sticky within its column so it never scrolls away with
            page content. Height = viewport minus the sticky chrome above (72px
            header, +40px prototype bar when the bar is shown). The column
            stretches to full content height, so its surface fills below the
            pinned rail on long pages; the rail's own overflow logic handles
            short viewports. `inert` in focus mode disables every rail control
            (mouse + keyboard) while keeping it visible + on-brand. */}
        <div
          inert={focus || undefined}
          style={{
            position: 'sticky',
            top: railTop,
            height: `calc(100vh - ${railTop}px)`,
            padding: '12px 20px 40px',
            boxSizing: 'border-box',
            // A subtle cue that the nav is locked, without looking broken.
            opacity: focus ? 0.85 : undefined,
          }}
        >
          <PlatformSideNav active={railActive} onSelect={handleSelect} variant={navVariant} />
        </div>
      </div>
      {/* Content column carries no padding of its own — every section is
          wrapped in `SectionShell`, which owns the uniform 40px gutter + the
          rail-matched title. When a course launcher is open, it replaces the
          section in place (the rail stays). */}
      <div style={{ minWidth: 0 }}>
        {launcher.courseId ? (
          <CourseLauncherView
            courseId={launcher.courseId}
            onBack={launcher.close}
            backLabel={launcherBackLabel}
          />
        ) : resourceLauncher.resourceId ? (
          <ResourceLauncherView
            resourceId={resourceLauncher.resourceId}
            onBack={resourceLauncher.close}
          />
        ) : (
          <SectionPanel
            active={active}
            isMember={isMember}
            onSelect={handleSelect}
            dashboardLayout={dashboardLayout}
            onOpenResource={resourceLauncher.open}
            onOpenLearningPathDetail={openLearningPathDetail}
          />
        )}
      </div>
      {/* Right filler — page background (absorbs extra width beyond 1440). */}
      <div aria-hidden />
    </div>
  )
}

/** In-shell Learning Launcher — the standalone `CourseDetailPage` (Figma
 *  "Learning Launcher") embedded in the content column so the left rail stays,
 *  opened by clicking a Jump Back In card. The launcher has no rail item of its
 *  own, so the rail shows nothing active (see PlatformShellBody); orientation is
 *  carried by this single contextual "Back to {origin}" link, which names the
 *  section the learner came from and returns there. No breadcrumb. */
function CourseLauncherView({
  courseId,
  onBack,
  backLabel,
}: {
  courseId: string
  onBack: () => void
  backLabel: string
}) {
  return (
    <section style={{ padding: '24px 40px 64px' }}>
      <button
        type="button"
        onClick={onBack}
        className="cre-link-action"
        aria-label={`Back to ${backLabel}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: 'none',
          padding: 0,
          marginBottom: 16,
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-action)',
        }}
      >
        <ArrowLeft size={14} aria-hidden />
        Back to {backLabel}
      </button>
      <CourseDetailPage courseId={courseId} embedded />
    </section>
  )
}

/** In-shell Resource Library resource viewer — the standalone
 *  `ResourceDetailPage` (Figma node 63:15230) embedded in the content column so
 *  the left rail stays, opened by clicking a Resource Library card. The
 *  ResourceDetailShell renders its own "Back to Resource Library" control (wired
 *  to `onBack`); this wrapper just supplies the 40px column gutter. */
function ResourceLauncherView({ resourceId, onBack }: { resourceId: string; onBack: () => void }) {
  return (
    <section style={{ padding: '24px 40px 64px' }}>
      <ResourceDetailPage resourceId={resourceId} embedded onBack={onBack} />
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Mobile shell (PrototypeBar → Mobile, 390px frame)
 *
 * A native-feeling single-column layout that replaces the desktop left rail:
 *   - top: the existing slim app Header (logo + utility icons) — already
 *     rendered by AppLayout inside the device frame.
 *   - a navy profile band (avatar + welcome + Passport Lite badge + dates),
 *     standing in for the rail's profile header (dashboard section only).
 *   - the active rail section's body, reused via `renderBody` at a mobile
 *     (16px) gutter; the dashboard is forced to the single-column `stacked`
 *     layout.
 *   - a fixed bottom tab bar (Dashboard · Learning · Courses · Explore ·
 *     Account) — the mobile primary nav. Design: Dash_Mobile.pdf.
 *
 * This is the foundation increment — the chrome + wiring + navigation. The
 * exact per-section content (the CLP/JBI cards, h-scroll rails, Career Tools)
 * gets mobile-specific polish in follow-ups.
 * ------------------------------------------------------------------ */

type LauncherLike = { courseId: string | null; close: () => void }

function PlatformMobileShell({
  active,
  railActive,
  isMember,
  onSelect,
  dashboardLayout,
  navVariant,
  launcher,
  launcherBackLabel,
  navSurfaceStyle,
}: {
  active: PlatformSection
  railActive: PlatformSection
  isMember: boolean
  onSelect: (id: PlatformSection) => void
  dashboardLayout: 'default' | 'learner-focused' | 'marketing-focused' | 'badged'
  navVariant: PlatformNavVariant
  launcher: LauncherLike
  launcherBackLabel: string
  navSurfaceStyle?: React.CSSProperties
}) {
  const isDashboard = active === 'dashboard'
  // Pluralize the Learning Path title only in V2 (multi-path landing) with 2+
  // paths; V1 opens a single path, so it stays singular "Learning Path".
  const multiplePaths = useLearningPathSummariesForBrand().length > 1
  const lpVersion = useFeatureFlag('learning-path-version').variant ?? 'v1'
  const pluralLP = lpVersion === 'v2' && multiplePaths
  // Mobile keeps the dashboard's chosen layout family — `marketing-focused`
  // (default) + `learner-focused` render their joined top band, which stacks its
  // two halves vertically at phone width. (The rebrand only ships these two, so
  // no remap is needed.)
  const layout = dashboardLayout
  return (
    <div
      style={{
        ...navSurfaceStyle,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 112px)',
        background: 'var(--color-surface-page)',
      }}
    >
      {/* Scroll body — clip horizontal overflow so the dashboard's full-bleed
          bands (negative-margin desktop bleeds) can't force a sideways scroll. */}
      <div style={{ flex: 1, overflowX: 'hidden', paddingBottom: 24 }}>
        {launcher.courseId ? (
          <CourseLauncherView
            courseId={launcher.courseId}
            onBack={launcher.close}
            backLabel={launcherBackLabel}
          />
        ) : isDashboard ? (
          <>
            <MobileProfileBand isMember={isMember} onSelect={onSelect} />
            {/* No top padding — the full-bleed Learning Path band butts directly
                against the navy profile band above (continuous navy header). */}
            <div style={{ padding: '0 16px 8px' }}>
              {renderBody('dashboard', isMember, onSelect, layout)}
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 16px 8px' }}>
            <h1
              style={{
                margin: '0 0 16px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: 24,
                lineHeight: '30px',
                color: 'var(--color-text-primary)',
              }}
            >
              {titleFor(active, pluralLP)}
            </h1>
            {renderBody(active, isMember, onSelect, layout)}
          </div>
        )}
      </div>
      {/* The rail lives in a hamburger drawer (opened from the header). While the
          launcher is open, `railActive` shows nothing active (mirrors desktop). */}
      <MobileNavDrawer active={railActive} onSelect={onSelect} navVariant={navVariant} />
    </div>
  )
}

/** Navy profile band — the mobile stand-in for the rail's profile header.
 *  Avatar + "Welcome back, {name}" + (member) Passport Lite badge + member
 *  dates, or (non-member) a status line + "Explore Plans" CTA. */
function MobileProfileBand({
  isMember,
  onSelect,
}: {
  isMember: boolean
  onSelect: (id: PlatformSection) => void
}) {
  const { brand, user, tierLabel, tierTone, avatarTier } = useAccount()
  const hasMembershipBand = supportsMembership(brand)
  const name = `${user.firstName} ${user.lastName}`
  const memberSinceYear = user.memberSinceMonthYear.split(' ').pop()
  const dates = user.planExpiresOn
    ? `Member since ${memberSinceYear} · Expires ${user.planExpiresOn}`
    : `Member since ${memberSinceYear}`
  return (
    <div
      style={{
        background: 'var(--color-nav-surface)',
        padding: '18px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <Avatar
        size={52}
        initials={user.initials}
        imageUrl={user.avatarUrl}
        alt={name}
        tier={avatarTier}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-nav-fg-muted)' }}>
          Welcome back,
        </span>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 19,
            lineHeight: '24px',
            color: 'var(--color-nav-fg)',
          }}
        >
          {name}
        </span>
        {/* No membership ⇒ no badge, no dates, and no "Explore Plans" CTA —
            the band is just the avatar + name. `tierLabel` is already null for
            such a brand (see `tierLabelFor`), so this guard is what stops the
            `?? 'Member'` fallback printing a tier that does not exist. */}
        {!hasMembershipBand ? null : isMember ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
            <MembershipBadge label={tierLabel ?? 'Member'} tone={tierTone} icon={tierBadgeIcon(tierTone)} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--color-nav-caption)' }}>
              {dates}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onSelect('membership')}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: 'none',
              padding: 0,
              marginTop: 2,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-cta-300)',
            }}
          >
            Explore Plans →
          </button>
        )}
      </div>
    </div>
  )
}

/** Mobile nav drawer — the mobile primary nav, opened by the header hamburger
 *  (state shared via `useMobileNav`). Slides in from the left over the content,
 *  scoped to the phone frame (the device frame uses no transform, so a viewport
 *  `fixed` overlay is centered to the frame width instead of covering the whole
 *  browser). It reuses the real `PlatformSideNav` rail, so the menu stays in
 *  sync with the desktop nav; selecting a row switches the section + closes. */
function MobileNavDrawer({
  active,
  onSelect,
  navVariant,
}: {
  active: PlatformSection
  onSelect: (id: PlatformSection) => void
  navVariant: PlatformNavVariant
}) {
  const { open, setOpen } = useMobileNav()
  if (!open) return null
  const close = () => setOpen(false)
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        // Center the overlay over the phone frame (390px), since the frame
        // itself is `margin: 0 auto` with no transform to scope `fixed` to.
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(390px, 100vw)',
        zIndex: 60,
      }}
    >
      {/* Backdrop — click to dismiss. */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          border: 'none',
          padding: 0,
          background: 'rgb(0 0 0 / 0.5)',
          cursor: 'pointer',
        }}
      />
      {/* Sliding panel — the real rail on the dark surface. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 300,
          maxWidth: '86%',
          background: 'var(--color-nav-surface)',
          padding: '16px 16px 32px',
          overflowY: 'auto',
          boxShadow: '2px 0 24px rgb(0 0 0 / 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: 'var(--color-nav-hover)',
              color: 'var(--color-nav-fg-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <PlatformSideNav
          active={active}
          onSelect={(id) => {
            onSelect(id)
            close()
          }}
          variant={navVariant}
        />
      </div>
    </div>
  )
}

/** Section title = the rail label for that section. The shell owns this
 *  single title; each embedded page hides its own (subtitles stay). */
const SECTION_TITLES: Record<PlatformSection, string> = {
  dashboard: 'Home',
  'study-plan': 'Study Plan',
  readiness: 'Readiness',
  recommended: 'Recommended for You',
  'learning-path': 'Learning Path',
  courses: 'My Courses',
  certificates: 'Certificates',
  podcasts: 'Podcasts',
  catalog: 'Browse Catalog',
  resources: 'Resources',
  'm-whats-new': "What's New",
  'm-learning-library': 'Resource Library',
  'm-exam-prep': 'Exam & Cert Prep',
  'm-career-tools': 'Rubi AI Tools',
  'm-more': 'Partner Offers',
  membership: 'Membership',
  support: 'Help & Support',
  profile: 'Profile',
  notifications: 'Notifications',
  licenses: 'Licenses',
  transcripts: 'Transcripts',
  'payment-methods': 'Payment Methods',
  purchases: 'My Purchases',
  'gift-recipients': 'Purchased for Others',
}

/**
 * Side gutter for the account sections only — narrower than the 40px every
 * other section uses, because these are the only ones carrying a second nav
 * level (the 208px `AccountSubNav`) inside the same column. Paired with the
 * matching gap in `AccountSectionLayout`.
 *
 * Trade-off, deliberately accepted: the section `<h1>` now sits 16px further
 * left on an account section than on a My Learning / Explore one, so the
 * heading shifts slightly when switching between the two groups. Every hero
 * treatment was aligned to a single 40px-left `<h1>` for exactly that reason —
 * if the shift reads worse than the reclaimed width, put this back to 40 and
 * take the space out of `AccountSectionLayout`'s gap instead.
 */
const ACCOUNT_SECTION_GUTTER = 24

/** Section title, pluralizing "Learning Path" → "Learning Paths" only when the
 *  V2 multi-path landing is in play (matches the rail label). V1 (single path +
 *  Switch) always reads the singular. */
function titleFor(active: PlatformSection, pluralLP: boolean): string {
  if (active === 'learning-path' && pluralLP) return 'Learning Paths'
  return SECTION_TITLES[active]
}

/** Explore-group sections that lead with the brand `MembershipSectionHero`
 *  (gradient/plain via the hero-style flag; the hero owns the section `<h1>`) —
 *  the five Membership sections plus Course Catalog (also an Explore item, so
 *  it inherits the darker Explore hero rather than the light one). */
const HERO_SECTIONS: readonly BrandHeroSection[] = [
  'm-whats-new',
  'm-learning-library',
  'm-exam-prep',
  'm-career-tools',
  'm-more',
  'catalog',
  // Recommended for You leads with the same navy brand hero as What's New.
  'recommended',
  // Podcasts (Explore group) — same brand hero so it carries the membership
  // framing (eyebrow) like the other benefit sections.
  'podcasts',
  // Help & Support (Support group) — navy brand gradient hero, no eyebrow
  // (it's not a membership benefit) and no search.
  'support',
]

/** Explore-group sections whose brand hero carries the "Included with your
 *  membership" eyebrow (member-only). Course Catalog, Recommended for You AND
 *  Free Content are intentionally excluded — all three are open to ALL users
 *  (every tier + non-members), not membership benefits, so they carry no
 *  "Included with your membership" framing. Free Content in particular would be
 *  claiming the opposite of what the page says: it is the one section defined by
 *  needing no membership at all. Resource Library is handled separately (its
 *  full hero owns the eyebrow; only the compact variant needs it added here). */
const MEMBERSHIP_EYEBROW_SECTIONS: ReadonlySet<string> = new Set([
  'm-whats-new',
  'm-exam-prep',
  'm-career-tools',
  'm-more',
  'podcasts',
])

/** My Learning sections that lead with the clean plain header — black title +
 *  search on the page background, no band, no description (Figma 40:2). The
 *  remaining My Learning sections keep the plain rail-matched title.
 *  (Courses is NOT here — like the Learning Path homepage, it owns its own
 *  header so the grid/table toggle can sit inline to the right of the search.) */
const LIGHT_HERO_SECTIONS: readonly LightHeroSection[] = ['certificates']

/** Resolve the section hero: the brand (gradient/plain) hero for Explore-group
 *  sections, the light-tint hero for the My Learning Courses/Certificates
 *  sections, else none (a plain `<h1>`). */
function heroFor(
  active: PlatformSection,
  brand: Brand,
): { meta: SectionHeroMeta; tone: 'brand' | 'light' | 'plain'; hideDescription?: boolean } | null {
  // Resources carries the same brand band as its Explore siblings, but its copy
  // is NOT in `SECTION_HERO_META` — `resourcesCopyFor` already owns it, next to
  // the resource list and to the rule that copy has to follow ("say plainly
  // that it is free"). Authoring a second entry in the hero table would make
  // one sentence exist twice, which is the drift the rest of that file is at
  // pains to avoid. No eyebrow: see MEMBERSHIP_EYEBROW_SECTIONS.
  if (active === 'resources') {
    return {
      meta: {
        title: SECTION_TITLES.resources,
        description: resourcesCopyFor(brand).heroDescription,
        searchPlaceholder: 'Search resources',
      },
      tone: 'brand',
    }
  }
  if ((HERO_SECTIONS as readonly string[]).includes(active)) {
    // Brand-aware: most of the default copy says "included with your Passport"
    // / "with your membership", which is untrue for a brand that sells none.
    return { meta: sectionHeroMetaFor(brand, active as BrandHeroSection), tone: 'brand' }
  }
  // Courses + Certificates get the clean plain header — title + search only,
  // no band, no description (Figma 40:2).
  if ((LIGHT_HERO_SECTIONS as readonly string[]).includes(active)) {
    return { meta: LIGHT_HERO_SECTION_META[active as LightHeroSection], tone: 'plain', hideDescription: true }
  }
  return null
}

/** Uniform section frame: 40px left/right gutter. The header varies by
 *  section + membership:
 *    - Non-member **Explore Membership** → the A1 `BenefitSpotlightHero`
 *      (replaces the gradient hero; carries its own `<h1>`).
 *    - Non-member **Exam & Cert Prep / AI Career Tools** → the large
 *      `BenefitUpsellHero` upsell band (owns its own `<h1>`), over the same
 *      `SectionContent` body a member sees.
 *    - Other Membership-group sections → the gradient `MembershipSectionHero`.
 *    - Everything else (My Learning) → the plain rail-matched `<h1>`.
 *  Embedded pages render below with their own title hidden + gutter dropped. */
function SectionShell({
  active,
  isMember,
  onSelect,
  children,
}: {
  active: PlatformSection
  isMember: boolean
  onSelect: (id: PlatformSection) => void
  children: ReactNode
}) {
  const [shellParams] = useSearchParams()
  // Partner Offers for non-members gets its own marketing hero + locked cards
  // (Figma 63:16150) — NOT the generic LockedBenefitPage. Free Content is
  // OPEN TO ALL: non-members see the same page as members (free items keep their
  // CTA; member-exclusive items show the "Member Exclusive" pill), so it uses
  // the standard section hero — with no eyebrow for non-members (the "Included with
  // your membership" eyebrow is member-only).
  const partnerNonMember = active === 'm-more' && !isMember
  // Exam & Cert Prep + AI Career Tools non-members get the large upsell band
  // (`BenefitUpsellHero`) over the SAME body a member sees — the Resource
  // Library non-member pattern, generalized. (Resource Library itself uses its own
  // `LearningLibraryHero` non-member variant, handled via `libraryHero` below.)
  const benefitUpsell =
    !isMember && (active === 'm-exam-prep' || active === 'm-career-tools')
  // The Resource Library gets a custom hero that owns its own `<h1>`, in place
  // of the generic gradient section hero — the member variant (membership
  // eyebrow + benefit tiles + search, Figma 61:9476) or the non-member upsell
  // variant ("Unlock the Full Resource Library" + Unlock CTA, Figma 62:10377).
  // Both sit over the same browsable grid (renderBody handles the library body
  // for members AND non-members).
  // The `learning-library-hero` flag's `compact` variant swaps the member's
  // custom hero for the standard section hero (matching Course Catalog); the
  // non-member upsell hero always stays (it carries the join CTA).
  const libraryHeroCompact = useFeatureFlag('learning-library-hero').variant === 'compact'
  const libraryHero = active === 'm-learning-library' && !(isMember && libraryHeroCompact)
  // Non-member-upsell sections suppress the shell header — they render their own
  // hero (marketing band) instead.
  const lpCount = useLearningPathSummariesForBrand().length
  const multiplePaths = lpCount > 1
  // When the Learning Path homepage is showing, it owns the title + search
  // header (title-left / search-right, like Courses), so suppress the shell's
  // own title. The single-path detail keeps the shell title.
  const lpVersion = useFeatureFlag('learning-path-version').variant ?? 'v1'
  // Pluralize the Learning Path title only in V2 (the multi-path landing) with
  // 2+ paths. V1 opens a single path, so it always reads "Learning Path".
  const pluralLP = lpVersion === 'v2' && multiplePaths
  // A `?id=` selection drills into a single-path detail even in v2, so the shell
  // reclaims its own title there (the landing grid is no longer showing).
  const lpSelected = !!shellParams.get('id')
  const learningPathHomeActive =
    active === 'learning-path' && isHomeActive(lpCount, lpVersion, lpSelected)
  // Partner Offers + Free Content only show the hero search once the list
  // is long enough to be worth filtering (> 12 items); short lists drop it.
  const { brand } = useAccount()
  const hasMembership = supportsMembership(brand)
  // Declared here rather than beside `libraryHero` above because `heroFor` is
  // brand-aware now and `brand` is not in scope until this line.
  const hero =
    benefitUpsell || partnerNonMember || libraryHero ? null : heroFor(active, brand)
  const SEARCH_MIN_ITEMS = 12
  const heroSearchHidden =
    active === 'support' ||
    // Recommended for You is a curated, personalized surface — no search box
    // (all brands, member + non-member).
    active === 'recommended' ||
    (active === 'm-more' && partnerOfferingsFor(brand).length <= SEARCH_MIN_ITEMS) ||
    // Same rule for Resources — XCEL publishes four, so the box is hidden. It
    // is a rule rather than a constant `true` because the list is brand-keyed
    // and a later feed could make it worth filtering.
    (active === 'resources' && resourcesFor(brand).length <= SEARCH_MIN_ITEMS)
  return (
    // 64px bottom padding gives every section a footer space so content never
    // butts against the viewport edge (matches the other section wrappers).
    //
    // Account sections take a NARROWER side gutter (see ACCOUNT_SECTION_GUTTER):
    // they're the only sections that spend width on a second nav level, so the
    // 40px that reads as breathing room elsewhere stacks up with the 208px
    // sub-nav and its gap to push the content ~289px off the rail.
    //
    // Every OTHER section keeps 40px, and must: ~20 full-bleed bands and section
    // heroes cancel this gutter with a hardcoded `-40px` (DashboardRecommendedBand,
    // MembershipSectionHero, the v5 joined bands, WhatsNewQuickFilter, …). Change
    // the 40 below and they all overshoot the rail by the difference. Account
    // sections are safe to differ because none of them render a full-bleed band.
    <section style={{ padding: `24px ${isAccountSection(active) ? ACCOUNT_SECTION_GUTTER : 40}px 64px` }}>
      {libraryHero ? (
        <LearningLibraryHero isMember={isMember} onUnlock={() => onSelect('membership')} />
      ) : benefitUpsell ? (
        <BenefitUpsellHero
          section={active as 'm-exam-prep' | 'm-career-tools'}
          onUnlock={() => onSelect('membership')}
        />
      ) : partnerNonMember ? (
        <NonMemberUpsellHero
          title="Unlock Exclusive Partner Savings"
          description="Access member-only discounts on products, education, apparel, insurance, wellness, and more from trusted nursing partners."
          onUnlock={() => onSelect('membership')}
        />
      ) : hero ? (
        <MembershipSectionHero
          section={active}
          title={hero.meta.title}
          description={hero.meta.description}
          searchPlaceholder={hero.meta.searchPlaceholder}
          tone={hero.tone}
          hideDescription={hero.hideDescription}
          hideSearch={heroSearchHidden}
          // Member-only "Included with your membership" eyebrow (label + a tier
          // chip) — on the benefit sections (+ the compact Resource Library).
          // `hasMembership` is the load-bearing half for XCEL: it KEEPS
          // Exam & Cert Prep and the AI Study Partner (they are its core
          // product and a headline feature), but nothing there is "included
          // with your membership" — there is no membership to include it in.
          membershipEyebrow={
            hasMembership &&
            isMember &&
            (MEMBERSHIP_EYEBROW_SECTIONS.has(active) ||
              (active === 'm-learning-library' && libraryHeroCompact))
          }
        />
      ) : learningPathHomeActive || active === 'courses' ? null : active ===
        'dashboard' ? (
        // Dashboard hides its page title visually — the content shifts up to the
        // top gutter — while keeping an `<h1>` in the document for a11y.
        // (Learning Path homepage + Courses own their own title + search header.)
        <h1 className="cre-visually-hidden">{SECTION_TITLES[active]}</h1>
      ) : (
        <h1
          style={{
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 'var(--text-heading-3xl)',
            lineHeight: 'var(--text-heading-3xl--line-height)',
            color: 'var(--color-text-primary)',
          }}
        >
          {titleFor(active, pluralLP)}
        </h1>
      )}
      {children}
    </section>
  )
}

function SectionPanel({
  active,
  isMember,
  onSelect,
  dashboardLayout,
  onOpenResource,
  onOpenLearningPathDetail,
}: {
  active: PlatformSection
  isMember: boolean
  onSelect: (id: PlatformSection) => void
  dashboardLayout: 'default' | 'learner-focused' | 'marketing-focused' | 'badged'
  /** Opens a Resource Library resource in-shell (desktop only). */
  onOpenResource?: (resourceId: string) => void
  /** Opens the Learning Path section drilled into a specific path's detail. */
  onOpenLearningPathDetail?: (pathId: string) => void
}) {
  // The ported "Membership" page owns its own full-bleed hero, so it renders
  // outside SectionShell (no 40px gutter, no shell title).
  if (active === 'membership') return <MembershipStandalonePage isMember={isMember} onOpenResource={onOpenResource} />
  return (
    <SectionShell active={active} isMember={isMember} onSelect={onSelect}>
      {renderBody(active, isMember, onSelect, dashboardLayout, onOpenResource, onOpenLearningPathDetail)}
    </SectionShell>
  )
}

/**
 * Learning Path section — two versions, driven by the `learning-path-version`
 * flag:
 *   - `v1` (default) → the single-path detail. When the learner has 2+ paths, a
 *     top-right "Switch Learning Path" link opens the My Learning Paths sheet;
 *     picking a path re-points the detail in place.
 *   - `v2` → the searchable landing page (grid / list / table). A card opens a
 *     path by setting `?id=` (detail in place); the detail's "← All learning
 *     paths" back link clears it.
 * The landing page also covers the 0-path empty state in both versions so the
 * detail never renders pathless.
 */
/**
 * The Study Plan as its own page (`?section=study-plan`), moved out of the
 * Learning Path page's tab row on 2026-09-09.
 *
 * It renders the SAME `InlineStudyCalendar` the tab did — the move is where it
 * lives, not what it is.
 *
 * Which plan it shows: `?id=` when present, so a link into a specific path's
 * plan keeps working and the Learning Path page can hand off to it; otherwise
 * the brand's active path. That mirrors `LearningPathSection` rather than
 * inventing a second rule, and it matters because XCEL has TWO paths with a
 * plan (Life & Health and P&C pre-licensing) — without `?id=` the section
 * would silently always show the first.
 *
 * A path with no plan is not an error: `InlineStudyCalendar` renders its own
 * empty / create state. The rail item is gated on `supportsStudyPlan` so a
 * brand without the feature never reaches this at all.
 */
function StudyPlanSection() {
  const [params] = useSearchParams()
  const { brand } = useAccount()
  const paths = useLearningPathSummariesForBrand()
  const idParam = params.get('id')
  const pathId =
    idParam && paths.some((p) => p.id === idParam) ? idParam : activePathIdFor(brand)
  // Same gate the Jump Back In card reads, via the same hook: with
  // `ce-study-plan` off the CE path has no plan, and this page must show the
  // empty branch rather than a plan the card is refusing to show.
  const ceStudyPlan = useCeStudyPlanEnabled()
  if (!ceStudyPlan && pathId === XCEL_CE_PATH_ID) {
    return <InlineStudyCalendar />
  }
  return <InlineStudyCalendar pathId={pathId} />
}

function LearningPathSection() {
  const [params, setParams] = useSearchParams()
  const paths = useLearningPathSummariesForBrand()
  const version = useFeatureFlag('learning-path-version').variant ?? 'v1'
  const { openPanel } = useLearningPathsPanel()
  const idParam = params.get('id')

  const setId = (id: string | null) =>
    setParams(
      (prev) => {
        const merged = new URLSearchParams(prev)
        if (id) merged.set('id', id)
        else merged.delete('id')
        return merged
      },
      { replace: true },
    )

  const showHome = isHomeActive(paths.length, version, !!idParam)

  if (showHome) {
    return <LearningPathsHome paths={paths} onSelect={(id) => setId(id)} />
  }
  // V2 reached a path via the landing page (`?id=`), so it gets the "← All
  // learning paths" back link. V1 has no landing page — switching happens
  // through the top-right "Switch Learning Path" sheet (shown for 2+ paths).
  const isV2 = version === 'v2'
  return (
    <LearningPathPage
      embedded
      onBackToPaths={isV2 && idParam && paths.length > 1 ? () => setId(null) : undefined}
      onSwitchPath={!isV2 && paths.length > 1 ? openPanel : undefined}
    />
  )
}

function renderBody(
  active: PlatformSection,
  isMember: boolean,
  onSelect: (id: PlatformSection) => void,
  dashboardLayout: 'default' | 'learner-focused' | 'marketing-focused' | 'badged',
  onOpenResource?: (resourceId: string) => void,
  onOpenLearningPathDetail?: (pathId: string) => void,
): ReactNode {
  // Dashboard renders the membership "Your Membership" overview as the
  // landing content (eyebrow suppressed — the shell owns the title). On the
  // main Dashboard Rebrand the overview shows the Home-style treatment — the
  // V1 ClpJumpBackInBand top band + the single Featured hero; the pure Demo
  // (`?demo=1`) keeps the prior band (see MembershipOverview `homeStyleOverview`).
  if (active === 'dashboard') {
    return (
      <SectionContent
        active="overview"
        isMember={isMember}
        embedded
        dashboardLayout={dashboardLayout}
        onOpenLearningPath={
          onOpenLearningPathDetail ?? (() => onSelect('learning-path'))
        }
      />
    )
  }
  // My Learning sections reuse their existing pages in place, embedded so
  // they drop their own title + gutter. Learning Path branches on count
  // (homepage for 2+ paths, single detail otherwise) via LearningPathSection.
  if (active === 'study-plan') return <StudyPlanSection />
  // Readiness — a deliberate blank, the same shape as Podcasts. The rail item
  // and the route exist so the section can be navigated to and demoed as
  // "coming"; there is no readiness model in the fixtures yet. Replace this
  // branch with the real panel — nothing else about the section needs to move.
  if (active === 'readiness') {
    return (
      <EmptyState
        title="Readiness"
        description="How ready you are for your licensing exam will show here."
        icon={<Gauge size={24} aria-hidden />}
      />
    )
  }
  if (active === 'learning-path') return <LearningPathSection />
  // ── Account area ──────────────────────────────────────────────────────
  // Every account section (Profile · Notifications · Licenses · Transcripts ·
  // Payment Methods · Purchases · Gift Recipients) renders inside the shell,
  // wrapped in `AccountSectionLayout` so they all carry the same account
  // sub-nav beside their content. The shell's rail + section `<h1>` stay the
  // outer chrome, so each page renders bare below the title.
  //
  // Reached from the top-right account dropdown, not rail items — the account
  // area is deliberately absent from the rail (it isn't learning content), and
  // the classic `/account/*` routes redirect in here so there's one URL each.
  if (isAccountSection(active)) {
    const body =
      active === 'profile' ? (
        <ProfilePage />
      ) : active === 'gift-recipients' ? (
        <GiftRecipientsPanel />
      ) : (
        // TODO(feature): the remaining five are placeholders — real pages drop
        // in here, still wrapped by AccountSectionLayout.
        <AccountSectionPlaceholder id={active} />
      )
    return (
      <AccountSectionLayout active={active} onSelect={(id) => onSelect(id)}>
        {body}
      </AccountSectionLayout>
    )
  }
  // (Gift Recipients — purchase-for-others tracking — is an account section
  // above; `/account/gift-recipients` redirects here.)
  // Courses / Certificates / Course Catalog lead with the light section hero
  // (title + search). The hero owns the search, so the page hides its own.
  // Courses owns its own header (title + search + view toggle inline), like the
  // Learning Path homepage — the shell suppresses its title for this section.
  if (active === 'courses') return <MyCoursesPage embedded />
  if (active === 'certificates') return <CertificatesPage embedded hideSearch />
  // Recommended for You — the Netflix-style personalized recommendation shelves
  // (reused from the V1 Membership "Recommended for you" tab — For your license
  // / Required CE / Fresh in the catalog / Quick wins, each a horizontal-scroll
  // row of cover-image cards), under the navy brand hero.
  // The Recommended *page* always renders the full-size Course Catalog cards
  // (`catalogCards`); the classic dashboard + membership tabs that also reuse
  // this panel keep the original plain shelf cards.
  if (active === 'recommended')
    return <RecommendedForYouPanel catalogCards showFilters hideSeeAll arrowsPersistent />
  // Podcasts — blank placeholder section for now (the rebrand design is a
  // follow-up). The full My Podcasts page still lives at the standalone
  // `/my-learning/podcasts` route.
  if (active === 'podcasts') {
    return (
      <EmptyState
        title="Podcasts"
        description="Your CE podcast playlist and browse will live here."
        icon={<Podcast size={24} aria-hidden />}
      />
    )
  }
  if (active === 'catalog') return <CatalogPage embedded hideSearch />
  // Resources (the restored Free Content section) — an auto-fill grid of
  // outbound cards. Members and non-members see the IDENTICAL page; everything
  // on it is free, which is the section's whole premise. See ResourcesPanel.
  if (active === 'resources') return <ResourcesPanel />
  // Help & Support (Support group) — the 4-card grid + Customer Support form,
  // Live Chat widget, external FAQs, and Contact Us. Open to members AND
  // non-members (support isn't gated).
  if (active === 'support') return <HelpSupportPanel />
  // Explore Membership: members get the benefit jump-off heroes (the
  // "Membership Benefits" panel), embedded so its intro is dropped — the
  // section's gradient hero already frames it. Non-members see the SAME What's
  // New as members for now — the per-item upsell (locking non-free content on
  // click) is a later addition. (The standalone non-member spotlight + plan
  // comparison view is retired on the rebrand shell.)
  if (active === 'm-whats-new') {
    return <MembershipBenefitsPanel embedded onOpenResource={onOpenResource} />
  }
  // The ported "Membership" page (sandbox-only). On desktop it's rendered by
  // SectionPanel (full-bleed, outside SectionShell); this branch covers the
  // mobile shell, which calls renderBody directly.
  if (active === 'membership') return <MembershipStandalonePage isMember={isMember} onOpenResource={onOpenResource} />
  // Partner Offers for non-members: the marketing hero (in SectionShell) over the
  // real partner cards rendered locked ("Member Exclusive" pills) — Figma
  // 63:16150. Handled before the generic locked page below.
  if (!isMember && active === 'm-more') {
    return <PartnerOfferingsPanel locked />
  }
  // Resource Library: members AND non-members get the full browsable grid (the
  // non-member upsell lives in the hero — "Unlock the Full Resource Library",
  // Figma 62:10377 — not a locked page). The section hero already carries the
  // search, so the panel drops its own inline one.
  if (active === 'm-learning-library')
    return <LibraryPanel cardVariant="shelf" hideSearch onOpenResource={onOpenResource} />
  // Exam & Cert Prep + AI Career Tools: members AND non-members get the same
  // `SectionContent` body — the non-member upsell lives in the larger
  // `BenefitUpsellHero` band (rendered by SectionShell), matching the Resource
  // Library non-member pattern. (The old marketing-only `LockedBenefitPage` swap is
  // retired.)
  if (active in MEMBERSHIP_MAP) {
    return <SectionContent active={MEMBERSHIP_MAP[active]} isMember={isMember} embedded />
  }
  return null
}
