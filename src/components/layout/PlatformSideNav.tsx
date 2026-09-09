import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  AwardSolid,
  CalendarDay,
  BookFull,
  ArrowRight,
  BookFullSolid,
  Crown,
  FileText,
  Flag,
  Gem,
  GemSolid,
  Grid,
  GridSolid,
  House,
  HouseSolid,
  LifeRing,
  LifeRingSolid,
  Library,
  LibrarySolid,
  Podcast,
  PodcastSolid,
  RubiLogo,
  SignsPost,
  SignsPostSolid,
  Star,
  StarSolid,
  UserSlash,
} from '@/icons'
import { Avatar } from '@/components/ui/Avatar'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { AllMembershipsPanel } from '@/components/membership/AllMembershipsPanel'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import {
  useAccount,
  multiMembershipsFor,
  supportsMembership,
  type Brand,
  type MembershipRecord,
} from '@/context/AccountContext'
import { resolveMembershipCount } from '@/data/membership/membershipScorecardFixtures'
import { useFeatureFlag, useNavSectionVisible } from '@/context/FeatureFlagContext'
import { supportsStudyPlan } from '@/data/studyCalendarFixtures'
import { useMotivation } from '@/context/MotivationContext'
import { useProfileAvatar } from '@/context/ProfileAvatarContext'
import { MotivationalStatementPanel } from '@/components/membership/MotivationalStatementPanel'
import { useLearningPathSummariesForBrand } from '@/data/learningPathsCountVariant'
import { buildRecommendedShelves } from '@/data/recommendedCategoriesFixtures'

/**
 * Platform left-nav rail — the Elite-only "Left-Nav Platform Shell"
 * (`platform-left-nav` flag). The rail is a **persistent, controlled
 * selector**: clicking an item swaps the Dashboard shell's right-hand
 * content in place (it does NOT navigate). The active section is owned by
 * `PlatformShell`. Visual language reuses the V7 dark rail
 * (`primary-800` + light text) and `MembershipV7`'s profile header.
 *
 * Two groups:
 *   - **My Learning** — Dashboard (the landing default), Learning Path,
 *     Courses, Certificates.
 *   - **Explore** — What's New, Recommended for You, Course Catalog, the
 *     remaining Membership sections, Podcasts, and Resources.
 *   - **Membership** — the 7 V7 sections, rendered in place.
 *
 * Course Catalog is deliberately NOT here — it stays in the top header as
 * a real route (the one place that leaves the shell).
 */

export type PlatformSection =
  | 'dashboard'
  // The Study Plan was a TAB on the Learning Path page until 2026-09-09; it is
  // its own rail section now, directly under Home. See LearningPathPage's
  // `studyPlanHasOwnPage`, which is the one fact both sides read.
  | 'study-plan'
  // Added 2026-09-09, directly after Study Plan. A PLACEHOLDER — the section
  // renders an EmptyState and there is no readiness fixture behind it yet.
  | 'readiness'
  | 'recommended'
  | 'learning-path'
  | 'courses'
  | 'certificates'
  | 'podcasts'
  | 'm-whats-new'
  | 'm-learning-library'
  | 'm-exam-prep'
  | 'm-career-tools'
  | 'm-more'
  | 'membership'
  | 'catalog'
  // Free Content was ARCHIVED as a rail row (its outbound links moved to the
  // account dropdown, on the rule that a primary nav row promises you stay
  // put). It is back on 2026-09-09 as **Resources**, under Browse Catalog —
  // a RE-WIRE, not a rebuild: `ResourcesPanel`, `ResourceCard` and the
  // brand-keyed `resourcesFixtures` were kept intact for exactly this.
  | 'resources'
  | 'support'
  // Account-scoped sections — rendered inside the shell (the rail is the
  // chrome) but NOT rail items; reached from the top-right account dropdown,
  // and from the account sub-nav that sits beside each of these pages. Ids
  // match `AccountSectionId` in components/account/accountSections.ts, which is
  // the canonical list both the dropdown and the sub-nav read.
  | 'profile'
  | 'notifications'
  | 'licenses'
  | 'transcripts'
  | 'payment-methods'
  | 'purchases'
  | 'gift-recipients'

type RailItem = {
  id: PlatformSection
  label: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  /** Optional filled/solid glyph swapped in when the row is SELECTED (the idle
   *  row keeps the outline `icon`). Falls back to `icon` when unset. */
  iconActive?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  /** Anchor/entry-point treatment — renders the label one weight step heavier
   *  than its siblings (Bold vs. the rail's SemiBold default). Weight-only, so
   *  it never relies on color; everything else matches sibling rows. */
  emphasis?: boolean
}

const MEMBERSHIP_ITEMS: RailItem[] = [
  // ARCHIVED 2026-08-25 — the "What's New" row was removed; the section it
  // opened is unwired and `?section=m-whats-new` now redirects to Membership.
  // See the `rail-whats-new` row in archivedItems.ts.
  { id: 'm-learning-library', label: 'Resource Library', icon: Library, iconActive: LibrarySolid },
  { id: 'm-exam-prep', label: 'Exam & Cert Prep', icon: Award, iconActive: AwardSolid },
  { id: 'm-career-tools', label: 'Rubi AI Tools', icon: RubiLogo },
  { id: 'm-more', label: 'Partner Offers', icon: Gem, iconActive: GemSolid },
]

/** Rail layout variant.
 *  - `full` (default) — the complete rail: My Learning + the full Explore group
 *    (What's New, Recommended for You, Course Catalog, the Membership set,
 *    Podcasts).
 *  - `mvp` — the MVP navigation from Figma (Dashboard Discoverability node
 *    53:5290): My Learning unchanged + a trimmed Explore group of just Course
 *    Catalog, Resource Library, and Partner Offers. Driven by
 *    `?nav=mvp` on `/dashboard-rebrand` (see the Navigation MVP walkthrough). */
export type PlatformNavVariant = 'full' | 'mvp'

export function PlatformSideNav({
  active,
  onSelect,
  variant = 'full',
}: {
  active: PlatformSection
  onSelect: (id: PlatformSection) => void
  variant?: PlatformNavVariant
}) {
  const { membership, brand } = useAccount()
  const isMember = membership === 'member'
  // The "Membership" page is now part of the Demo as well as the sandbox, so the
  // rail item always shows. It was hidden in the pure Demo (`?demo=1`) while the
  // page was being built; every `page: 'membership'` flag is already
  // `defaultEnabled: true`, so this ONE line was the only thing keeping the hub
  // hero, tier header, plan comparison, AI MasterTracks band, renewal states and
  // the Manage sheet out of the demo — none of it was a flag baseline.
  //
  // The cancellation flow is deliberately NOT part of that: it reaches the Demo
  // as a stubbed CTA. See `demoStubCancel` in ManageMembershipPanel.
  // …EXCEPT for a brand that sells no membership. XCEL is transactional, so
  // the rail item is dropped entirely rather than opening a page pitching a
  // membership it does not have. (`PlatformShell` bounces `?section=membership`
  // to the dashboard for the same brand — BOTH gates are needed: with only one,
  // it looks like it works until you click.)
  const showMembershipPage = supportsMembership(brand)
  // Defensive: only surface the Recommended for You rail item when there is
  // content to recommend (buildRecommendedShelves yields at least one shelf).
  // In practice the page always has content, so it always shows.
  const hasRecommendations = useMemo(
    () => buildRecommendedShelves(brand).length > 0,
    [brand],
  )
  // RESTORED 2026-09-09 as "Resources" (see the `resources` rail item below).
  //
  // It was ARCHIVED 2026-08-26 as "Free Content": the outbound links (blog,
  // podcast, Resource Center) moved to the ACCOUNT DROPDOWN (`AccountMenu`) on
  // the rule that a primary nav row promises you stay put. That rule has NOT
  // been repealed and the dropdown rows stay — what changed is the judgement
  // that four free study aids are worth a rail row a shopper can find, which
  // an account dropdown is not. The unwired panel is what made this a re-wire
  // rather than a rebuild; that is the archive convention working.
  // Exam & Cert Prep and Career Tools (Rubi AI) are Elite/Healthcare-oriented
  // benefit sections that don't apply to the real-estate brands — hide their
  // rail items for BOTH of them (CRE and McKissock, which is Real Estate /
  // Appraisal and has no more claim to them than CRE does).
  // (The sections still render if reached via a deep link.)
  // Which Explore rail items a brand does NOT get, per section rather than as one
  // switch — because the two are not hidden for the same reasons.
  //
  // CRE + McKissock hide BOTH: they are the real-estate brands, and neither the
  // healthcare exam-prep set nor Rubi applies to them.
  //
  // STC hides ONLY Career Tools (added 2026-09-01; the `rubi-tool-card`
  // walkthrough's decisions log carried this call and has since been trimmed, so
  // THIS COMMENT is the record): it reached that section and found it empty,
  // because Rubi is a healthcare product with no STC fixtures. It KEEPS Exam &
  // Cert Prep — that is STC's core content, not an Elite import: SIE, Series 7 /
  // 63 / 65, the adaptive question bank and full-length mock exams all live in
  // `STC_BENEFIT_ROWS`. Hiding it with one shared boolean was the obvious
  // shortcut and would have taken the exam-prep catalogue of a securities-exam
  // company off its own rail.
  //
  // XCEL hides ONLY Partner Offers — those are a membership benefit and XCEL has
  // no membership (its own "Partner Code" is a B2B discount channel, a different
  // thing). It KEEPS both of the others, and neither is incidental: Exam & Cert
  // Prep is XCEL's CORE PRODUCT (the 3-Part Training Program), and Rubi™ is a
  // headline feature with its own landing page on xcelsolutions.com — XCEL is
  // the first non-healthcare brand that keeps that section, which is why
  // `benefitRowsFor('xcel')` had to be authored rather than left empty.
  const hiddenBenefitSections: PlatformSection[] = brand === 'xcel' ? ['m-more'] : []
  // Pluralize the Learning Path rail label only in V2 (the multi-path landing)
  // with 2+ paths. V1 opens a single path directly, so it always reads the
  // singular "Learning Path" regardless of how many paths the learner has.
  const multiplePaths = useLearningPathSummariesForBrand().length > 1
  const lpVersion = useFeatureFlag('learning-path-version').variant ?? 'v1'
  const pluralLP = lpVersion === 'v2' && multiplePaths
  // Two groups: **My Learning** (the learner's own areas) and a consolidated
  // **Explore** group that gathers every discovery surface — Course Catalog,
  // the full Membership set in its V7 order (Rubi AI Tools relabeled "Career
  // Tools"), and Podcasts. Every item is open in the rail for
  // members AND non-members — no lock treatment (clicking a Passport-only
  // section still lands a non-member on its benefit-preview page, handled by the
  // shell's `renderBody`, but the rail itself never shows a lock).
  const myLearningItems: RailItem[] = [
    // MVP navigation (Figma 53:5290) drops "Home" — the dashboard landing is a
    // later addition; the MVP rail leads straight into the learning areas.
    ...(variant === 'mvp' ? [] : [{ id: 'dashboard' as const, label: 'Home', icon: House, iconActive: HouseSolid }]),
    // Study Plan sits directly under Home — it is the pacing tool a learner
    // opens every visit, which is why it was the Learning Path page's DEFAULT
    // tab before it became a page. Gated on `supportsStudyPlan`, the same one
    // predicate the tab used: a brand without one would otherwise get a rail
    // item onto an empty state.
    ...(supportsStudyPlan(brand)
      ? [{ id: 'study-plan' as const, label: 'Study Plan', icon: CalendarDay }]
      : []),
    // Readiness sits directly after the Study Plan: the plan is the work, this
    // is where you find out whether the work has got you there.
    //
    // NOT gated on `supportsStudyPlan` like the row above it, and that is
    // deliberate rather than an oversight — there is nothing behind it yet to
    // gate on. Adding a capability predicate now would be inventing the shape
    // of a feature that has not been designed. Its nav flag is the only gate
    // until a real readiness fixture exists; wire a predicate then, next to it.
    { id: 'readiness', label: 'Readiness', icon: Flag },
    { id: 'learning-path', label: pluralLP ? 'Learning Paths' : 'Learning Path', icon: SignsPost, iconActive: SignsPostSolid },
    { id: 'courses', label: 'My Courses', icon: BookFull, iconActive: BookFullSolid },
    { id: 'certificates', label: 'Certificates', icon: Award, iconActive: AwardSolid },
  ]
  const exploreItems: RailItem[] =
    variant === 'mvp'
      ? // MVP navigation (Figma 53:5290): a trimmed Explore group — just Course
        // Catalog, Resource Library, and Partner Offers.
        [
          { id: 'catalog', label: 'Browse Catalog', icon: Grid, iconActive: GridSolid },
          { id: 'm-learning-library', label: 'Resource Library', icon: Library, iconActive: LibrarySolid },
          { id: 'm-more', label: 'Partner Offers', icon: Gem, iconActive: GemSolid },
        ]
      : [
          // Full rail — Browse Catalog anchors the Explore group (first), then
          // Membership → Recommended for You, the rest of the Membership
          // sections, Podcasts, and Free Content.
          { id: 'catalog', label: 'Browse Catalog', icon: Grid, iconActive: GridSolid },
          // Resources sits directly under Browse Catalog — both are "go and
          // find something" surfaces, and this is the free half of that pair.
          // NOT added to the MVP rail above: that list is a Figma-specified
          // trim (node 53:5290), so growing it would be editing a design
          // rather than implementing one.
          { id: 'resources', label: 'Resources', icon: FileText },
          // What's New is fully archived (2026-08-25): the rail row went on
          // 2026-08-17, and the section itself is now unwired — the CTAs that
          // reached it point at Membership and `?section=m-whats-new` redirects
          // there. It used to be MEMBERSHIP_ITEMS[0], skipped by a `.slice(1)`
          // below; the entry is gone from the array, so the slice went with it.
          // "Membership" page — the ported standalone prototype. Design &
          // Development sandbox only: hidden in the pure Demo (`?demo=1`), so
          // the demo experience is untouched.
          ...(showMembershipPage
            ? [{ id: 'membership' as const, label: 'Membership', icon: Crown, iconActive: Crown }]
            : []),
          // Recommended for You hides entirely when there are no recommendations
          // (decision #5) — no rail entry, so the user never lands on the page.
          ...(hasRecommendations
            ? [{ id: 'recommended' as const, label: 'Recommended for You', icon: Star, iconActive: StarSolid }]
            : []),
          ...MEMBERSHIP_ITEMS.filter(
            (i) => !hiddenBenefitSections.includes(i.id),
          )
            .map((i) => (i.id === 'm-career-tools' ? { ...i, label: careerToolsLabelFor(brand) } : i)),
          { id: 'podcasts', label: 'Podcasts', icon: Podcast, iconActive: PodcastSolid },
        ]
  // Note: the `profile` section is NOT in the rail — Profile is reachable only
  // from the top-right account dropdown (which routes into this shell). It still
  // renders in the content column when active (see PlatformShell.renderBody).
  // Support group — a trailing "Get Help" entry point to the Help & Support
  // section (renders in both the full and MVP rails).
  const supportItems: RailItem[] = [{ id: 'support', label: 'Get Help', icon: LifeRing, iconActive: LifeRingSolid }]
  /*
   * Per-item visibility from the Navigation flag group.
   *
   * Applied HERE, last, so it is an ADDITIONAL gate rather than a replacement
   * for the rules above: `showMembershipPage`, `hasRecommendations` and
   * `hiddenBenefitSections` still decide whether an item is available to this
   * brand at all, and the flag only decides whether an available item is shown.
   * A flag can hide a row it cannot bring back — which is why `membership` and
   * `m-more` have no flag (see NAV_SECTION_FLAGS).
   *
   * Home has no flag and so is never filtered: `visible` returns true for any
   * section without one. It is the only way back to the dashboard from a
   * section, so hiding it would strand the reviewer.
   *
   * A group whose items are ALL hidden drops out entirely, caption included —
   * an empty "My Learning" subhead over nothing reads as a broken rail.
   */
  const visible = useNavSectionVisible()
  const groups = (
    [
      { id: 'my-learning', caption: 'My Learning', items: myLearningItems },
      { id: 'explore', caption: 'Explore', items: exploreItems },
      { id: 'support', caption: 'Support', items: supportItems },
    ] as { id: string; caption: string; items: RailItem[] }[]
  )
    .map((g) => ({ ...g, items: g.items.filter((i) => visible(i.id)) }))
    .filter((g) => g.items.length > 0)

  // ── Rail scroll / overflow ──────────────────────────────────────────────
  // The rail is pinned (sticky + viewport-tall — see `PlatformShell`). The
  // profile header stays fixed at the top; the nav groups are the ONLY
  // scrollable region, and they scroll only when they genuinely overflow (a
  // short viewport or a long list). Until then the region is `overflow: hidden`
  // so no scrollbar shows. When it does overflow, a thin scrollbar + edge fades
  // appear, signalling more items above/below — so nothing is ever clipped out
  // of reach. Overflow is detected with a `ResizeObserver` on both the scroll
  // box (viewport changes) and its content (item-count changes).
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)
  const [fadeTop, setFadeTop] = useState(false)
  const [fadeBottom, setFadeBottom] = useState(false)
  const recompute = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const over = el.scrollHeight > el.clientHeight + 1
    setOverflowing(over)
    setFadeTop(over && el.scrollTop > 1)
    setFadeBottom(over && el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    if (contentRef.current) ro.observe(contentRef.current)
    return () => ro.disconnect()
  }, [recompute])
  // Fade the edge(s) that have more content (static mask — no animation, so it
  // already respects `prefers-reduced-motion`). 16px soft edge.
  const scrollMask =
    fadeTop && fadeBottom
      ? 'linear-gradient(to bottom, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)'
      : fadeTop
        ? 'linear-gradient(to bottom, transparent 0, #000 16px, #000 100%)'
        : fadeBottom
          ? 'linear-gradient(to bottom, #000 0, #000 calc(100% - 16px), transparent 100%)'
          : undefined

  return (
    <nav
      aria-label="Primary"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      {/* Pinned top region — the profile header never scrolls. */}
      <div style={{ flexShrink: 0 }}>
        <NavProfileHeader isMember={isMember} onSelect={onSelect} />
      </div>
      {/* Scrollable middle region — the nav groups. Buttons stay Tab-focusable,
          so keyboard users reach clipped items by tabbing (the browser scrolls
          the focused row into view). */}
      <div
        ref={scrollRef}
        onScroll={recompute}
        className="cre-rail-scroll"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: overflowing ? 'auto' : 'hidden',
          overflowX: 'hidden',
          maskImage: scrollMask,
          WebkitMaskImage: scrollMask,
        }}
      >
        <div ref={contentRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups.map((group) => {
            const captionId = `platform-rail-${group.id}`
            return (
              <div key={group.id} style={{ marginBottom: 8 }}>
                <p id={captionId} style={CAPTION}>
                  {group.caption}
                </p>
                <ul
                  aria-labelledby={captionId}
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <RailRow item={item} active={active === item.id} onSelect={onSelect} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

/** A single rail row — a controlled selector button. Hover tracked locally
 *  (mirrors `MembershipSideNav`'s dark-tone rows). */
function RailRow({
  item,
  active,
  onSelect,
}: {
  item: RailItem
  active: boolean
  onSelect: (id: PlatformSection) => void
}) {
  // Selected rows swap to the filled/solid glyph when the item provides one;
  // idle/hover rows keep the outline icon.
  const Icon = active && item.iconActive ? item.iconActive : item.icon
  const [hovered, setHovered] = useState(false)
  const showHover = hovered && !active
  // Selected-state accent — always the brand PRIMARY color (tint fill + icon +
  // left indicator bar). Token-driven so it adapts per rail: a LIGHT primary
  // (primary-200) on the dark navy/graphite rails and a DARK primary
  // (primary-700) on the light rail — each side chosen to clear WCAG contrast
  // (see the `--color-nav-*-primary` tokens in tokens.css + `lightRailStyle`).
  const activeBg = 'color-mix(in srgb, var(--color-nav-icon-active-primary) 24%, transparent)'
  const activeIconColor = 'var(--color-nav-icon-active-primary)'
  // A solid left bar (a ≥3:1 indicator) since the pale primary tint alone can be
  // low-contrast on the navy rail.
  const activeBar = 'var(--color-nav-active-bar-primary)'
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={active ? 'page' : undefined}
      style={{
        ...ROW,
        // Selected-state treatment = Option C (nav selected-state exploration):
        // a brand-secondary TINT FILL (nav-active @ ~24%) + a tinted icon + a
        // bold label — the current cross-system standard (Material 3 / Carbon /
        // Polaris / Fluent). Replaces the earlier "wash + 3px accent bar" (B).
        // Non-color cues (fill + bold weight + aria-current + tinted icon) keep
        // it WCAG 1.4.1 compliant; the 3px left border is kept transparent so
        // rows stay aligned but no bar shows.
        background: active ? activeBg : showHover ? HOVER_BG : 'transparent',
        color: active || showHover ? 'var(--color-nav-fg)' : IDLE_COLOR,
        // Rail default is SemiBold (600); active is Bold (700). An emphasized
        // anchor item (Browse Catalog) renders Bold at rest too — one step
        // heavier than its siblings — without the active bg/color, so the
        // emphasis is weight-only and never reads as "active".
        fontWeight: active || item.emphasis ? 700 : 600,
        // Selected-row left bar. Dark rails (V1/V2) leave it transparent
        // (Option C — the secondary-tinted icon carries the cue on dark); the
        // light rail (V3) sets --color-nav-active-bar to secondary-700 so the
        // selection has a ≥3:1 indicator where the pale tint fill alone isn't.
        borderLeft: `3px solid ${active ? activeBar : 'transparent'}`,
        // When SELECTED, square the left corners so the accent bar reads as a
        // straight vertical bar. Idle/hover keep the full ROW radius (hover
        // logic unchanged) — only the active state overrides the left corners.
        ...(active && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }),
      }}
    >
      {/* Active icon: the brand PRIMARY accent, token-driven per rail (light
          primary on dark rails, dark primary on the light rail) for contrast.
          Idle/hover icons inherit the row label color. */}
      <span style={{ display: 'inline-flex', color: active ? activeIconColor : 'inherit' }}>
        <Icon size={17} aria-hidden />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{item.label}</span>
    </button>
  )
}

/** Dark-rail profile header — avatar + real greeting, then the "Your
 *  Membership" summary directly beneath (see `NavMembershipSummary`), all
 *  grouped above the header's bottom divider. Ported from `MembershipV7`'s
 *  `NavProfileHeader`. */
function NavProfileHeader({
  isMember,
  onSelect,
}: {
  isMember: boolean
  onSelect: (id: PlatformSection) => void
}) {
  const { brand, user, avatarTier } = useAccount()
  // A brand with no membership shows NO membership block at all — no eyebrow,
  // no badge, no dates, no "Non-Member" pill, and (critically) no divider: the
  // divider exists to separate the greeting FROM that block, so leaving it
  // would draw a rule under nothing. Avatar + greeting only.
  const hasMembership = supportsMembership(brand)
  const { statement } = useMotivation()
  const { avatarOverride } = useProfileAvatar()
  const navigate = useNavigate()
  const [profileHovered, setProfileHovered] = useState(false)
  const name = `${user.firstName} ${user.lastName}`
  // The statement-present tightening (the avatar's -6px bottom margin + the
  // divider's -5px marginTop) only makes sense when a statement is actually
  // rendered between them. With no statement (member), the avatar sits directly
  // above the divider, so drop those negatives and keep a normal ~20px gap.
  const hasStatement = statement.trim().length > 0
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        // Non-member stacks avatar → Non-Member pill → statement tightly (4px);
        // member keeps the looser 16px rhythm around its divider + Membership block.
        gap: isMember ? 16 : 4,
        // No top padding — the avatar sits flush at the top of the rail. Bottom:
        // non-member trims to 10 so the statement TEXT sits ~20px above the
        // divider — matching the 20px `marginBottom` gap below the divider to
        // "MY LEARNING" (the statement button adds its own 8px pad, so 10 + 8 ≈
        // 20). Member keeps the original 20px bottom.
        padding: isMember ? '0 8px 20px' : '0 8px 10px',
        marginBottom: 20,
        borderBottom: '1px solid var(--color-nav-divider)',
      }}
    >
      {/* Avatar + greeting = a clickable profile row. Clicking opens the
          learner's profile (`/account/profile` — the same target as the
          top-right account menu's "Profile" item). On hover it carries the
          same rail-row wash as the motivation statement below (subtle white
          background, bleeding to the rail edges via the −8px margin). */}
      <button
        type="button"
        onClick={() => navigate('/account/profile')}
        onMouseEnter={() => setProfileHovered(true)}
        onMouseLeave={() => setProfileHovered(false)}
        aria-label="View your profile"
        style={{
          alignSelf: 'stretch',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
          background: profileHovered ? HOVER_BG : 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          // No top padding — avatar sits flush at the top. Member drops the
          // bottom padding too (tighter gap to the statement directly below);
          // non-member keeps 8 for spacing down to the Non-Member pill.
          padding: isMember ? '0 8px 0' : '0 8px 8px',
          // Member WITH a statement: a -6px bottom margin claws the flex gap
          // back so the statement text sits ~20px under the greeting (the
          // statement button's 8px top pad + the 16px gap otherwise read ~26px).
          // No statement → keep the plain gap so the avatar clears the divider.
          margin: isMember && hasStatement ? '0 -8px -6px' : '0 -8px',
          cursor: 'pointer',
          transition: 'background 120ms ease',
        }}
      >
        {/* Avatar carries the membership-tier treatment (Figma "Colors for
            Membership Tiers"): Plus → single ring + Mountain, Pro → double ring
            + Bolt, Premier/Passport → triple gold ring + Crown; non-members get
            the plain avatar (no ring / no badge). */}
        {/* `brandRing` — a thin Brick ring, the logo's own red. It marks this
            as the learner's OWN avatar; every other photo on the dashboard is
            stock or course art. Only this one carries it. */}
        <Avatar
          size={48}
          initials={user.initials}
          imageUrl={avatarOverride ?? user.avatarUrl}
          alt={name}
          tier={avatarTier}
          brandRing
        />
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 15,
            lineHeight: '20px',
            color: 'var(--color-nav-fg)',
          }}
        >
          Welcome back, <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
        </span>
      </button>
      {/* Member: greeting → motivational statement → divider → the "Membership"
          summary block (its own divider-separated section). Non-member: the
          Non-Member pill sits directly under the greeting (Figma 63:16644), then
          the motivational statement below it — so the membership status reads
          first. The motivational statement shows ONLY once the learner has set
          one (created/edited from the Profile page); hover + click opens the
          editor. */}
      {!hasMembership ? (
        // No membership block and no divider — just the statement, if set.
        <NavMotivationQuote />
      ) : isMember ? (
        <>
          <NavMotivationQuote />
          {/* With a statement: -5 marginTop trims the gap so the statement TEXT
              sits ~20px above this divider — matching the membership block's
              ~20px gap to the bottom divider (the statement button's hover box
              adds ~9px below the text that the membership block doesn't). With
              no statement the avatar sits directly above, so use a positive
              marginTop to restore a ~20px avatar-to-divider gap. */}
          <div aria-hidden style={{ alignSelf: 'stretch', height: 1, marginTop: hasStatement ? -5 : 1, background: 'var(--color-nav-divider)' }} />
          <NavMembershipSummary isMember onSelect={onSelect} />
        </>
      ) : (
        <>
          <NavMembershipSummary isMember={false} onSelect={onSelect} />
          <NavMotivationQuote />
        </>
      )}
    </div>
  )
}

/**
 * Rail label for the Rubi AI section (`m-career-tools`), per brand.
 *
 * "Career Tools" is ELITE'S framing — Rubi as a career/CV coach (interview
 * reps, resume review, next-move planning). On XCEL, Rubi is an EXAM STUDY
 * AID, and the brand's own name for it on xcelsolutions.com is "AI Study
 * Partner". Shipping "Career Tools" to an insurance pre-licensing candidate
 * misdescribes the product they are looking at.
 *
 * A function rather than a second literal inside the array build, so the next
 * brand that reframes Rubi has one place to say so.
 */
function careerToolsLabelFor(brand: Brand): string {
  return brand === 'xcel' ? 'AI Study Partner' : 'Career Tools'
}

/** The learner's motivational statement in the rail. Renders ONLY when a
 *  statement is set — the empty-state "What motivates you?" prompt was removed
 *  (a statement is created/edited from the Profile page's Motivational
 *  Statement card). When set, it's always visible under the greeting; hover
 *  brightens it (the rail-row wash) and clicking opens the editor in place.
 *  Requires a `MotivationProvider` above (AppLayout provides it). */
function NavMotivationQuote() {
  const { statement, setStatement } = useMotivation()
  const [panelOpen, setPanelOpen] = useState(false)
  if (statement.trim().length === 0) return null
  return (
    <>
      <NavMotivationStatementButton statement={statement} onEdit={() => setPanelOpen(true)} />
      {/* Kept mounted (toggling `open`) so the success toast survives the close. */}
      <MotivationalStatementPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        value={statement}
        onSave={setStatement}
      />
    </>
  )
}

/** Presentational rail statement button — the italic quote with the rail-row
 *  hover wash. Exported so the dev-handoff live preview renders the exact same
 *  element (no drift). Meant to sit in the dark rail's flex column; wrap it in a
 *  `primary-800` context when reused elsewhere. */
export function NavMotivationStatementButton({
  statement,
  onEdit,
}: {
  statement: string
  onEdit: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Edit your motivation statement"
      style={{
        alignSelf: 'stretch',
        textAlign: 'left',
        background: hovered ? HOVER_BG : 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: 8,
        margin: '0 -8px',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontStyle: 'italic',
        lineHeight: 1.4,
        color: hovered ? 'var(--color-nav-fg)' : 'var(--color-nav-fg-muted)',
        transition: 'background 120ms ease, color 120ms ease',
        // Hard-clamp to 5 lines (the editor caps length; this is the backstop).
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 5,
        overflow: 'hidden',
      }}
    >
      {`“${statement}”`}
    </button>
  )
}

/** "Membership" summary sitting directly under the avatar. Two states, driven
 *  by the Member toggle:
 *   - **Member** — a "Membership" eyebrow (rail group-caption style, padding
 *     dropped to 0 so it stays flush-left with the group captions + the pill) +
 *     the teal "Passport Lite" pill + a compact join-year/expiry line.
 *   - **Non-member** — a muted "Free Account" status pill *in place of* the
 *     eyebrow + a link-style "Explore Plans →" CTA (opens Explore Membership
 *     in-shell) + a savings teaser. */
function NavMembershipSummary({
  isMember,
  onSelect,
}: {
  isMember: boolean
  onSelect: (id: PlatformSection) => void
}) {
  const { brand, user, tierLabel, tierTone, activeMembershipId } = useAccount()
  // Multi-membership demo (the on/off `membership-count` "Show Multiple
  // Memberships" flag). When it's ON and a member holds 2+ memberships, the block
  // becomes a count + the selected membership's Profession · State line + a View
  // All link into the Your Memberships sheet. Otherwise the single-membership block below
  // renders unchanged (driven by the live tier switch).
  // Respect the SAME resolved count the Membership page uses (off ⇒ 1, else the
  // variant's 2 / 3 / 5), so the rail and the page never disagree about how many
  // memberships exist — the fixture now carries five, more than any variant shows.
  const countFlag = useFeatureFlag('membership-count')
  const shown = multiMembershipsFor(brand).slice(
    0,
    resolveMembershipCount(countFlag.enabled, countFlag.variant),
  )
  // Float the selected membership (chosen in the "Your Memberships" sheet) to the
  // top so the rail shows the same one the hero front card does.
  const activeIdx = shown.findIndex((m) => m.id === activeMembershipId)
  const memberships =
    activeIdx > 0 ? [shown[activeIdx], ...shown.filter((_, i) => i !== activeIdx)] : shown
  const showMultiple = isMember && countFlag.enabled && memberships.length > 1
  // Join year (last token of `memberSinceMonthYear`, e.g. "November 2024" →
  // "2024") + plan expiry (`planExpiresOn`, already mm/dd/yyyy; Elite-only, so
  // the "Expires …" clause is dropped for brands without it).
  const memberSinceYear = user.memberSinceMonthYear.split(' ').pop()
  const membershipMeta = user.planExpiresOn
    ? `Member since ${memberSinceYear}, Expires ${user.planExpiresOn}`
    : `Member since ${memberSinceYear}`
  return (
    <div>
      {isMember ? (
        showMultiple ? (
          <MultiMembershipList memberships={memberships} onSelect={onSelect} />
        ) : (
          <>
            <p style={{ ...CAPTION, padding: 0 }}>Membership</p>
            <MembershipBadge label={tierLabel ?? 'Member'} tone={tierTone} icon={tierBadgeIcon(tierTone)} />
            <p style={MEMBER_META_STYLE}>{membershipMeta}</p>
          </>
        )
      ) : (
        // Non-member (Figma 63:16644): just the "Non-Member" status pill, sitting
        // directly under the greeting. It's clickable — opens the Membership page
        // (the `membership` rail section / MembershipStandalonePage) in-shell so a
        // non-member lands on the plan comparison + join pitch.
        <button
          type="button"
          onClick={() => onSelect('membership')}
          aria-label="Go to membership plans"
          className="cre-nonmember-pill"
          style={{ ...nonMemberBadgeStyle, border: 'none', cursor: 'pointer' }}
        >
          <UserSlash size={14} aria-hidden />
          Non-Member
        </button>
      )}
    </div>
  )
}

/** Multi-membership block — a stacked list of the learner's active
 *  memberships when they hold more than one (across professions or states).
 *  Reuses the single-membership design: the caption gains a count
 *  ("Memberships (N)"), the first membership shows by default, and a
 *  "Show all (N more)" / "Show less" link expands the rest. Each entry adds a
 *  bold Profession · State line under the "Member since …, Expires …" line
 *  (that's what distinguishes the memberships). */
/**
 * The rail's multi-membership block: the selected membership, then a **View All**
 * link into the "Your Memberships" sheet.
 *
 * It used to be a Show all / Show less accordion that expanded the list inside a
 * 264px rail. The sheet is the same destination the hub hero's own View All
 * opens, so the rail now points at it rather than growing a second, cramped
 * presentation of the same records.
 *
 * The sheet instance is OWNED HERE rather than reached through the hub hero's
 * copy, because the rail is global chrome and must work from every section —
 * `MemberHubHero` only exists while the Membership section is mounted. There's
 * no risk of the two disagreeing: the selection they both render lives on
 * `AccountContext` as `activeMembershipId`, not in either component.
 *
 * `onSelect` is optional so the dev-handoff preview can render this standalone —
 * there the sheet still opens (it's self-contained); only the navigation that
 * follows picking or managing a membership is skipped.
 */
export function MultiMembershipList({
  memberships,
  onSelect,
}: {
  memberships: MembershipRecord[]
  onSelect?: (id: PlatformSection) => void
}) {
  const [allOpen, setAllOpen] = useState(false)
  const { activeMembershipId, setActiveMembershipId } = useAccount()
  const navigate = useNavigate()
  // The rail floats the selected membership to the top, so index 0 IS the one to
  // show collapsed — and the sheet's ticked row must be the same record.
  const activeId = activeMembershipId ?? memberships[0]?.id ?? ''
  const visible = memberships.slice(0, 1)
  return (
    <div>
      <p style={{ ...CAPTION, padding: 0 }}>{`Memberships (${memberships.length})`}</p>
      {visible.map((m, i) => (
        <div
          key={m.id}
          style={{
            marginTop: i === 0 ? 0 : 14,
            paddingTop: i === 0 ? 0 : 14,
            borderTop: i === 0 ? undefined : '1px solid var(--color-nav-divider)',
          }}
        >
          <MembershipBadge label={m.tierLabel} tone={m.tone} icon={Gem} />
          <p style={MEMBER_META_STYLE}>{`Member since ${m.memberSinceYear}, Expires ${m.expiresOn}`}</p>
          <p style={PROSTATE_STYLE}>{`${m.profession} · ${m.state}`}</p>
        </div>
      ))}
      {/* Opens a sheet, so this is `aria-haspopup="dialog"` — NOT the expander's
          old `aria-expanded`, which would announce an inline region that no
          longer exists. */}
      <button
        type="button"
        onClick={() => setAllOpen(true)}
        aria-haspopup="dialog"
        style={EXPANDER_STYLE}
      >
        View All
        <ArrowRight size={12} aria-hidden />
      </button>
      <AllMembershipsPanel
        open={allOpen}
        onClose={() => setAllOpen(false)}
        memberships={memberships}
        activeId={activeId}
        onSelect={(id) => {
          // Selection is shared state, so the rail block and the hub hero's deck
          // both re-point to it. Then show the membership it belongs to.
          setActiveMembershipId(id)
          setAllOpen(false)
          onSelect?.('membership')
        }}
        onManage={(rec) => {
          // Manage lives on the Membership section (with the cancellation flow
          // wired behind it), so drill in via the `?sheet=manage&membership=`
          // deep links that section already reads rather than standing up a
          // second Manage sheet here that would need its own cancel handoff.
          setActiveMembershipId(rec.id)
          setAllOpen(false)
          onSelect?.('membership')
          navigate(
            `/dashboard-rebrand?section=membership&sheet=manage&membership=${encodeURIComponent(rec.id)}`,
            { replace: true },
          )
        }}
      />
    </div>
  )
}

// Shared "Member since …, Expires …" meta line (single + multi blocks).
const MEMBER_META_STYLE: React.CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: 1.45,
  color: 'var(--color-nav-caption)',
}

// Profession · State line — the new line distinguishing memberships (multi only).
const PROSTATE_STYLE: React.CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1.45,
  color: 'var(--color-nav-fg-muted)',
}

// "Show all / Show less" expander — magenta CTA link style (matches the
// app's other link-style CTAs, e.g. the non-member "Explore Plans" link).
const EXPANDER_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 12,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-cta-300)',
}

const HOVER_BG = 'var(--color-nav-hover)'
const IDLE_COLOR = 'var(--color-nav-fg-muted)'

const CAPTION: React.CSSProperties = {
  margin: '0 0 8px',
  padding: '0 8px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-nav-caption)',
}

// Non-member status pill — the Figma "Membership Tiers / Non-Member" badge
// (node 1375:8002): a neutral `neutral-75` pill with a `user-slash` glyph +
// "Non-Member" label, both in the tertiary gray (`neutral-600` = #818181).
// Mirrors the member `MembershipBadge` chrome (28px tall, md radius, 14/600).
const nonMemberBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 8px',
  borderRadius: 'var(--radius-md)',
  // Fill + label color live in `.cre-nonmember-pill` (tokens.css) so the
  // dark-theme exemption can keep this a light chip with dark, AA-legible text
  // in both themes — an inline fill here would win over that rule.
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
}

const ROW: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  textAlign: 'left',
  cursor: 'pointer',
  lineHeight: 1.2,
  transition: 'background 120ms ease, color 120ms ease',
}
