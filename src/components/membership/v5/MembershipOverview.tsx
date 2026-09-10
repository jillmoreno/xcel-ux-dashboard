import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { Link, useSearchParams } from 'react-router-dom'
import { useWidgetColor } from './widgetColorUtil'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { CourseCard, type CourseCardData } from '@/components/courses/CourseCard'
import { CourseDetailsPanel } from '@/components/courses/CourseDetailsPanel'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import { ProgressTrackerCard } from '@/components/learning/ProgressTrackerCard'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import {
  useLearningPathCardsForBrand,
  useLearningPathSummariesForBrand,
} from '@/data/learningPathsCountVariant'
import { activePathIdFor, learningPathsFor } from '@/data/learningFixtures'
import { useLearningSetup } from '@/context/LearningSetupContext'
import {
  dashboardProgressPersonaFor,
  personaFromSetup,
} from '@/data/dashboardProgressFixtures'
import { dashboardStatsFor } from '@/data/learnerOverviewFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { BenefitHeroSections } from './BenefitHeroSections'
import { BenefitSections } from '../v4/BenefitSections'
// ARCHIVED 2026-08-05: the smaller "What's New / What's Trending" carousel
// (WhatsNewWidget) was removed from the overview — see the Archive tab
// (src/data/archivedItems.ts, id 'whats-new-widget'). The component file is
// kept in the repo; re-add this import + the render block below to restore it.
import { FeaturedHero } from '../featured/FeaturedHero'
import { WhatsNewUpsellBand } from '../WhatsNewUpsellBand'
import { FreeContentBands } from '../FreeContentBands'
import { DashboardRecommendedBand } from '../DashboardRecommendedBand'
import { LearnerFocusedBand } from './LearnerFocusedBand'
import { ClpJumpBackInBand } from './ClpJumpBackInBand'
import { ExpiredCycleBand } from './ExpiredCycleBand'
import { DiscoveryEmpty } from './JumpBackInDiscoveryEmpty'
import {
  passportMembershipFor,
  passportSavingsFor,
} from '@/data/membership/passportProgressFixtures'
import { Eyebrow, Wrap } from '../v2/passportShared'
import { WhatsNewSpine } from '../v4/WhatsNewSpine'
import { CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'
import { StudyWeekSummary } from '@/components/learning/study-calendar/StudyWeekSummary'
import { hasStudyCalendarFor, studyCalendarFor } from '@/data/studyCalendarFixtures'

/**
 * V5 "Your Membership" overview — a mini-dashboard for the membership,
 * pulling four sections from across the other versions:
 *   1. Learning progress  → the dashboard `ProgressTrackerCard` gauge
 *   2. Your learning style → the v2 `LearningRecapBadge` ("year in learning")
 *   3. What's new          → the v4 `WhatsNewSpine`
 *   4. Explore your benefits → four alternating-side marketing hero
 *      sections (`BenefitHeroSections`) for Library / Podcasts / Exam
 *      Prep / AI Career Tools
 *
 * Member-only: the progress + recap surfaces are personalized, so the
 * "Your Membership" rail item / default only render for members (see
 * `MembershipV5`).
 */
export function MembershipOverview({
  leadingKpis = false,
  bleedBand = false,
  hideEyebrow = false,
  hideMarketing = false,
  showExtras = false,
  dashboardLayout = 'default',
  onOpenLearningPath,
}: {
  /** Prepend the small "Your Membership" KPI section (V7, which has no
   *  hero to carry the KPIs). */
  leadingKpis?: boolean
  /** Let the lower (darker-gray) zone bleed past the content column's 24px
   *  horizontal padding to the left + right edges (V7 full-bleed rail). */
  bleedBand?: boolean
  /** Suppress the "Your Learning" eyebrow — the Dashboard Rebrand shell owns
   *  the section title ("Dashboard") above this. */
  hideEyebrow?: boolean
  /** Drop the lower marketing band (What's New + Explore-your-benefits heroes).
   *  The Dashboard Rebrand shell sets this so the dashboard stays focused on
   *  Your Learning + the Membership Summary; that marketing lives on the
   *  rail's "Explore Membership" page instead. */
  hideMarketing?: boolean
  /** Append the "Recommended for you" + "Featured products" strips beneath the
   *  widgets (Dashboard Rebrand overview). */
  showExtras?: boolean
  /** Dashboard Discoverability layout variant: `default` (the standalone V5/V7
   *  side-by-side layout — Your Membership band + a Jump Back In / Current
   *  Learning Path row), `learner-focused` (single-column, with the joined CLP /
   *  Jump Back In band replacing the top section), or `marketing-focused`
   *  (single-column, with the joined CLP / What's New marketing carousel band
   *  replacing the top section). Marketing Focused is the rebrand default. */
  dashboardLayout?: 'default' | 'learner-focused' | 'marketing-focused' | 'badged'
  /** Switch the shell to the Learning Path section in place, drilled into the
   *  given path's detail (Marketing Focused band's Current Learning Path card
   *  click). */
  onOpenLearningPath?: (pathId: string) => void
} = {}) {
  // The rebrand's two dashboard versions — `learner-focused` + `marketing-focused`
  // — both replace the top Your-Learning section with their joined band and share
  // the single-column ("stacked") structure below. (`default` = the standalone
  // V5/V7 pages' side-by-side layout.)
  // "Badged Version" — the Marketing Focused layout, but every product card
  // carries a tier badge (Passport / Passport Lite) + optional status badge
  // (New / Member Exclusive). It reuses the marketing-focused structure, so it
  // sets `marketingFocused` too and threads a `badged` flag to the card bands.
  const badged = dashboardLayout === 'badged'
  const learnerFocused = dashboardLayout === 'learner-focused'
  const marketingFocused = dashboardLayout === 'marketing-focused' || badged
  const stacked = learnerFocused || marketingFocused
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  // Active path resolves from the shared selection (set when the learner picks a
  // path in the My Learning Paths sheet) → the brand's default active path. It's
  // resolved against the count-variant list so a synthesized selection resolves
  // too (those carry no breakdown, so the widget renders single-fill for them).
  const {
    openPanel: openPathsPanel,
    activePathId: selectedPathId,
    setActiveStatus,
  } = useLearningPathsPanel()
  const allSummaries = useLearningPathSummariesForBrand()
  const progressPath =
    allSummaries.find((p) => p.id === (selectedPathId ?? activePathIdFor(brand))) ??
    learningPathsFor(brand)[0]
  // Jump Back In re-points to the active path's resume course; falls back to the
  // brand's first in-progress course when the path doesn't specify one.
  const jumpBackInCourse =
    progressPath?.jumpBackIn ?? myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')
  // Total learning-path count (count-variant aware, from the same hook the
  // sheet reads) drives the Current Learning Path widget's "View All (N)"
  // link, which opens the My Learning Paths slide-over in place.
  const pathsCount = useLearningPathCardsForBrand().length
  const showViewAllPaths = pathsCount > 1
  // Current Learning Path detail panel (segmented breakdown + requirements),
  // opened from the tracker card's footer link.
  const [detailOpen, setDetailOpen] = useState(false)
  // "Year in learning" recap archived — the `membership-recap-ticket` flag was
  // removed (2026-08-17). It defaulted off (recap hidden), so the recap no longer
  // renders on the overview. LearningRecapTicket / LearningRecapBadge are kept in
  // the repo (still used by the standalone V2/V6 membership pages).
  // Current Learning Path tracker breakdown — fixed to the `bars` arrangement
  // (the tracker only renders in the standalone `default` layout now; the
  // rebrand bands draw their own CLP). The single-category rule still applies.
  const breakdownLayout = 'bars' as const
  // Hero bleed archived — the `dashboard-hero-bleed` flag was removed
  // (2026-08-17). It defaulted off, so the joined top band stays a contained
  // card. The bands keep their `bleed` prop for restore; it's pinned false here.
  const heroBleed = false
  // NOTE: MarketingFocusedBand (the CLP + What's New marketing-carousel joined
  // band) was ARCHIVED — see src/data/archivedItems.ts. Its `marketing-band-
  // layout` + `whats-new-image` flag reads were removed with it (they governed
  // that band only). The component file is retained, still rendered by the
  // dev-handoff live preview. The demo's top band is now always the combined
  // CLP + Jump Back In band (ClpJumpBackInBand); the demo bar's "What's New"
  // toggle was repurposed to only show/hide the standalone Featured hero.
  // Full-width Current Learning Path band (`dashboard-clp-fullwidth`) — the
  // navy CLP + Jump Back In band that replaces the top band. Variant D (white
  // stat cards) / E (glass tiles); shown always, or only when the "What's
  // Trending" section is off (`dashboard-whats-new-layout`) — the CLP expands
  // to fill the space the carousel left. Rebrand overview only (`showExtras`).
  const clpFullWidthFlag = useFeatureFlag('dashboard-clp-fullwidth')
  const whatsNewOn = useFeatureFlag('dashboard-whats-new-layout').enabled
  // "Home-style overview" — the V1 CLP + Jump Back In top band + its external
  // "Current Learning Path" lead + the Featured hero below. Now the baseline for
  // the whole Dashboard Rebrand overview, including the pure Demo (`?demo=1`) —
  // promoted 2026-08-05 (was previously held off the Demo behind `!demoScoped`).
  const homeStyleOverview = showExtras
  const clpFullWidthActive =
    showExtras &&
    clpFullWidthFlag.enabled &&
    (clpFullWidthFlag.secondaryVariant !== 'when-whats-new-off' || !whatsNewOn)
  // `jump-back-in` drops the Current Learning Path side entirely (full-width
  // Jump Back In only); otherwise the variant picks the D/E stat-tile treatment.
  const clpJumpBackInOnly = clpFullWidthFlag.variant === 'jump-back-in'
  const clpFullWidthVariant = clpFullWidthFlag.variant === 'variant-e' ? 'e' : 'd'
  // CLP layout pinned to the redesigned V1 (flat white card, no dark background,
  // media-left Jump Back In) on the Home-style overview. The `dashboard-clp-layout`
  // flag (Current / V1 / V2 / V3) was removed 2026-08-17, baking in its V1 default;
  // standalone V5/V7 pages keep the prior navy-frame `current` layout.
  // ClpJumpBackInBand retains all its layout branches for a future restore.
  const clpLayout: 'current' | 'v1' | 'v2' | 'v3' = homeStyleOverview ? 'v1' : 'current'
  // Mobile preview (390px device frame): the stacked layout's `third` Your-
  // Learning row is a 1/3 + 2/3 split that leaves an empty column at phone
  // width. On mobile, collapse it to a full-width single column (Jump Back In
  // above a full-gauge tracker). `useDeviceFrame` is safe everywhere (desktop
  // default outside a provider).
  const mobile = useDeviceFrame().device === 'mobile'

  // ── Dashboard progress-state persona (Elite member, rebrand shell only) ──
  // The `dashboard-progress-state` flag drives the whole overview by the
  // member's learning progress. Resolved ONCE here and threaded into the bands
  // + the What's New gating (no scattered flag reads). Gated on `showExtras`
  // (the rebrand embed) + member; the per-brand persona (dashboardProgressPersonaFor)
  // returns null for brands without a profile, which falls through to today's
  // default `progressPath` behavior. In-session setup state (`useLearningSetup`)
  // is safe outside its provider (no-op default).
  const setup = useLearningSetup()
  const progressVariant = useFeatureFlag('dashboard-progress-state').variant ?? 'progress-on-track'
  // QE (qualifying / exam-prep) vs CE (renewal) journey for the Current Learning
  // Path. Only CRE · McKissock · STC have a QE persona; other brands ignore it.
  const educationType = (useFeatureFlag('dashboard-education-type').variant ?? 'ce') as 'ce' | 'qe'
  // Every brand with a progress profile (CRE · McKissock · Elite · STC) gets a
  // populated Current Learning Path; brands without one (dashboardProgressPersonaFor
  // → null) fall back to today's default path resolution below.
  // Decoupled from membership: the compliance persona (Not Started / On Track /
  // At Risk / Expired / Completed) drives the Current Learning Path for members
  // AND non-members, so a non-member can be shown an "at risk" license as an
  // upsell moment. Only `showExtras` (rebrand overview) gates it now.
  const personaEnabled = showExtras
  // A learner who just finished the standalone Onboarding Flow (`/onboarding-flow`)
  // this session lands on the enriched setup-complete-0 state (reflecting their
  // picks), regardless of the flag's selected progress variant. The new-user
  // wizard itself no longer lives here — only the hand-off destination does.
  // The onboarding hand-off destination stays member-only (only a member goes
  // through the setup wizard), even though the persona itself is now decoupled.
  const justOnboarded = personaEnabled && isMember && setup.completed
  // The week-summary band reads the SAME plan the Study Plan section shows —
  // the persona's own path — so the two cannot describe different courses. It
  // is resolved here rather than inside the band so the band stays a pure
  // presenter of a calendar.
  const weekSummaryOn = useFeatureFlag('dashboard-week-summary').enabled
  // Whole-section toggle for the Recommended band. Distinct from
  // `nav-show-recommended`, which hides the PAGE in the left nav — this one is
  // the band on Home, and a reviewer can want either without the other.
  const recommendedOn = useFeatureFlag('dashboard-recommended').enabled
  const basePersona = personaEnabled
    ? justOnboarded
      ? dashboardProgressPersonaFor(brand, 'setup-complete-0')
      : dashboardProgressPersonaFor(brand, progressVariant, educationType)
    : null
  // When reached by finishing onboarding, enrich the setup-complete-0 persona
  // with the entered license + course/modality picks so the Current Learning
  // Path reflects what the learner just told us.
  const persona =
    basePersona && justOnboarded ? personaFromSetup(brand, setup.data) ?? basePersona : basePersona
  const personaSetupComplete = persona ? persona.setupComplete : true
  // The plan behind the week-summary band. `hasStudyCalendarFor` is the guard,
  // not `supportsStudyPlan` — `studyCalendarFor` falls back to STC's Series 79
  // plan for any id it does not know, and putting securities weeks under an
  // insurance path is the failure its own docstring calls worse than the empty
  // state. Same trap the Jump Back In card hit.
  const weekSummaryCalendar =
    persona && hasStudyCalendarFor(brand, persona.path.id)
      ? studyCalendarFor(persona.path.id)
      : null
  // The persona drives the Current Learning Path only when it's a completed
  // persona AND the learner hasn't explicitly picked a different path in the
  // My Learning Paths sheet — so the existing sheet re-point feature still wins
  // when used (the persona's fixed gauge/status/renewal drop back to the chosen
  // path's real values).
  const personaDrivesPath = Boolean(persona) && personaSetupComplete && !selectedPathId
  const activeProgressPath = personaDrivesPath ? persona!.path : progressPath
  // Jump Back In slot mode (`resume` / `up-next` / `discovery`) — persona-driven.
  // In `discovery` the slot has no course, so DON'T fall back to the brand's
  // in-progress course (that would defeat the empty state).
  const jumpBackInMode = personaDrivesPath ? persona!.jumpBackInMode : undefined
  const discoveryTone = personaDrivesPath ? persona!.discoveryTone : undefined
  const activeCourse =
    personaDrivesPath && jumpBackInMode === 'discovery'
      ? undefined
      : personaDrivesPath
        ? persona!.path.jumpBackIn ?? jumpBackInCourse
        : jumpBackInCourse
  const personaStatus = personaDrivesPath ? persona!.status : undefined
  const personaRenewal = personaDrivesPath ? persona!.renewal : undefined
  const personaRenewalReady = personaDrivesPath ? (persona!.renewalReady ?? false) : false
  // Browse Catalog (discovery empty state) → open the Course Catalog rail
  // section in place, preserving the shell's other params (per the "stay in the
  // rebrand shell" nav convention). Mirrors PlatformShell's handleSelect.
  const [, setShellParams] = useSearchParams()
  const browseCatalog = () => {
    setShellParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('section', 'catalog')
        return next
      },
      { replace: true },
    )
  }
  // View Certificate (completed state) → open the Certificates rail section in
  // place, mirroring browseCatalog's in-shell navigation.
  const viewCertificate = () => {
    setShellParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('section', 'certificates')
        return next
      },
      { replace: true },
    )
  }
  // Modality chips shown on the populated CLP right after onboarding completes.
  const setupChips = personaDrivesPath && justOnboarded ? setup.data.modalities : undefined
  // Publish the persona's compliance status to the My Learning Paths sheet so
  // the pinned/active path there reflects the demo "Progress" selection in
  // lockstep with the Current Learning Path widget. Cleared (null) when a
  // persona isn't driving the path (e.g. the learner explicitly picked one),
  // so the sheet falls back to that path's real derived status.
  useEffect(() => {
    setActiveStatus(personaStatus ?? null)
    return () => setActiveStatus(null)
  }, [personaStatus, setActiveStatus])

  // Your Learning cards — Jump Back In + the Current Learning Path tracker.
  // Shared by both layouts: `stacked` sizes them to fill their column (they
  // stack in the stacked layout's left column); `default` keeps the fixed
  // 320px Jump Back In + a flexible tracker side-by-side. The color wheel only
  // applies in the stacked layout.
  const learningCards = activeProgressPath && (
    <>
      <OverviewJumpBackIn
        fullWidth={stacked}
        course={activeCourse}
        mode={jumpBackInMode}
        discoveryTone={discoveryTone}
        onBrowseCatalog={browseCatalog}
      />
      <div style={{ flex: stacked ? '0 0 auto' : '1 1 360px', minWidth: 0 }}>
        <ProgressTrackerCard
          path={activeProgressPath}
          layout={stacked ? 'compact' : 'default'}
          breakdownLayout={breakdownLayout}
          showViewAll={showViewAllPaths}
          pathsCount={pathsCount}
          onViewAll={openPathsPanel}
          onViewDetails={() => setDetailOpen(true)}
        />
      </div>
    </>
  )
  // The Learner Focused version's joined top-section card (navy CLP + white
  // Jump Back In). Replaces the Your-Learning row in the stacked layout.
  const learnerFocusedBand = learnerFocused && activeProgressPath && (
    <LearnerFocusedBand
      path={activeProgressPath}
      course={activeCourse}
      pathsCount={pathsCount}
      showViewAll={showViewAllPaths}
      onViewAll={openPathsPanel}
      onViewDetails={() => setDetailOpen(true)}
      onOpenLearningPath={onOpenLearningPath}
      bleed={heroBleed}
      statusOverride={personaStatus}
      renewal={personaRenewal}
      renewalReady={personaRenewalReady}
      interestChips={setupChips}
      onBrowseCatalog={browseCatalog}
      onViewCertificate={viewCertificate}
    />
  )
  // The Marketing Focused version's joined top-section card (navy CLP column +
  // the full-bleed What's New marketing carousel). Replaces the Your-Learning
  // row in the stacked layout.
  // marketingFocusedBand ARCHIVED — the MarketingFocusedBand (CLP + What's New
  // marketing carousel) no longer participates in the top-band chain. See the
  // note above + src/data/archivedItems.ts.
  // The full-width Current Learning Path + Jump Back In band (`dashboard-clp-
  // fullwidth`). When active it takes over the top band — the CLP fills the
  // full home width instead of sitting beside a What's New carousel.
  //
  // On the Home-style overview the band's own "Current Learning Path" eyebrow +
  // switch row is lifted OUT of the navy card (`hideHeader`) and rendered above
  // it as a section lead — matching the "Featured" lead below — with "Switch
  // Learning Path (N)" far-right in the CTA color.
  const clpBand = clpFullWidthActive && activeProgressPath && (
    <ClpJumpBackInBand
      variant={clpFullWidthVariant}
      layout={clpLayout}
      jumpBackInOnly={clpJumpBackInOnly}
      hideHeader={homeStyleOverview}
      path={activeProgressPath}
      course={activeCourse}
      pathsCount={pathsCount}
      showViewAll={showViewAllPaths}
      onViewAll={openPathsPanel}
      onViewDetails={() => setDetailOpen(true)}
      onOpenLearningPath={onOpenLearningPath}
      bleed={heroBleed}
      statusOverride={personaStatus}
      renewal={personaRenewal}
      renewalReady={personaRenewalReady}
      interestChips={setupChips}
      jumpBackInMode={jumpBackInMode}
      discoveryTone={discoveryTone}
      onBrowseCatalog={browseCatalog}
      onViewCertificate={viewCertificate}
    />
  )
  // On the Home-style overview every top band (the CLP band AND the Expired
  // card) is lifted under an external "Current Learning Path" lead + a
  // "Switch Learning Path (N)" jump-off — so the header reads consistently
  // whichever state is showing. Off that (the pure Demo) the band renders bare.
  //
  // EXCEPT the Jump-Back-In-only band (`clpJumpBackInOnly` — the "No learning
  // paths (brand)" edge case): there IS no Current Learning Path, so the "Current
  // Learning Path" lead (and the path-switcher) would be misleading — drop the
  // header and let the band render bare.
  const withClpLead = (bandEl: ReactNode) =>
    homeStyleOverview && !clpJumpBackInOnly ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <p style={sectionLeadStyle}>{CURRENT_LEARNING_EYEBROW}</p>
          {showViewAllPaths && (
            <button type="button" onClick={openPathsPanel} style={switchPathLinkStyle}>
              {`Switch Learning Path (${pathsCount})`}
            </button>
          )}
        </div>
        {bandEl}
      </div>
    ) : (
      bandEl
    )
  const clpFullWidthBand = clpBand && withClpLead(clpBand)
  // Expired renewal cycle (`progress-expired` persona / status 'expired') — the
  // CLP band is replaced by the charcoal "Expired" card (parallel to the
  // Completed `renewalReady` treatment). Wins the top-band slot over the version
  // bands; shares the "Current Learning Path" lead so the header stays put.
  const expiredBand = personaDrivesPath && personaStatus === 'expired' && activeProgressPath &&
    withClpLead(
      <ExpiredCycleBand
        path={activeProgressPath}
        renewal={personaRenewal}
        bleed={heroBleed}
        onViewDetails={() => setDetailOpen(true)}
      />,
    )
  // The band that replaces the Your-Learning row. The expired card wins first;
  // then an EXPLICITLY-selected version band (Learner Focused) — the version the
  // reviewer picked must win, otherwise the committed-on `dashboard-clp-fullwidth`
  // flag silently overrides it and Learner Focused renders as the Marketing
  // Focused CLP band (the reported "something killed Learner Focused" bug);
  // then the full-width CLP band (when its flag is active). `learnerFocusedBand`
  // is only non-null when `learner-focused` is selected, so the default
  // `marketing-focused` path is unchanged — it falls straight through to
  // `clpFullWidthBand` (the committed-on combined CLP band). `null` on the
  // standalone `default` layout, which keeps the side-by-side cards below.
  // marketingFocusedBand removed from the chain (archived).
  //
  // ONE EXCEPTION to `learnerFocusedBand` winning: the Jump-Back-In-only band
  // (`clpJumpBackInOnly` — the "No learning paths (brand)" persona). Learner
  // Focused's whole top band IS the Current Learning Path, so on a brand with
  // none there is nothing for it to draw; it would render the default path and
  // contradict the persona. Letting only THIS variant through preserves the fix
  // the ordering exists for — a CLP flag in its ordinary `variant-d` state
  // still must not override Learner Focused.
  //
  // This was inert until 2026-09-04: the persona only ever ran on Marketing
  // Focused, because that was every brand's default. XCEL defaults to Learner
  // Focused, which is where it surfaced.
  const topBand =
    expiredBand || (clpJumpBackInOnly ? clpFullWidthBand : learnerFocusedBand || clpFullWidthBand)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {activeProgressPath && (
        <LearningPathDetailPanel
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          path={activeProgressPath}
        />
      )}
      {stacked ? (
        /* Stacked layout: the Your Learning cards stacked on the left with the
           full-width recap banner beneath. (The landmark used to read "Your
           membership and learning"; the Your Membership summary card was
           removed from this layout — see the note below — so the label had
           been describing a card that is not here for ANY brand. XCEL, which
           has no membership at all, is just where it became visible.) */
        <section aria-label="Your learning">
          <Wrap style={{ padding: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* (The Your Motivation card + the Your Membership summary card
                  were both removed from the Stacked Cards layout. The
                  motivational statement is no longer surfaced on the dashboard
                  or in the left rail — it's set/edited only from the account
                  Profile page's Motivational Statement card.) */}
              {/* Body row (`dashboard-learning-path-width`). `two-thirds`:
                  Jump Back In (1/3) beside the Current Learning Path tracker
                  (2/3, full gauge + stat strip). `third` (default): Jump Back In
                  + the compact tracker stacked in the left 1/3; the right 2/3 is
                  left open. (The full Your Membership KPI card was removed from
                  the stacked layout — the compact Your Membership summary above
                  covers membership.) */}
              {mobile ? (
                // Mobile single column. When a joined top band is active
                // (Learner Focused / Vibrant) it renders here — the band stacks
                // its two halves vertically at phone width (Dash_Mobile.pdf:
                // navy Current Learning Path above the white Jump Back In with a
                // cover-top image + Resume + Up Next). Otherwise fall back to the
                // tracker above Jump Back In. Comes FIRST so it overrides the
                // flag-driven desktop arrangements (two-thirds / third) that
                // assume multi-column widths.
                topBand || (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {activeProgressPath && (
                      <ProgressTrackerCard
                        path={activeProgressPath}
                        layout="default"
                        breakdownLayout={breakdownLayout}
                        showViewAll={showViewAllPaths}
                        pathsCount={pathsCount}
                        onViewAll={openPathsPanel}
                        onViewDetails={() => setDetailOpen(true)}
                      />
                    )}
                    <OverviewJumpBackIn
                      fullWidth
                      course={activeCourse}
                      mode={jumpBackInMode}
                      discoveryTone={discoveryTone}
                      onBrowseCatalog={browseCatalog}
                    />
                  </div>
                )
              ) : topBand ? (
                topBand
              ) : (
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 20,
                    }}
                  >
                    {learningCards}
                  </div>
                  {/* Right 2/3 intentionally left open. */}
                  <div style={{ flex: 2, minWidth: 0 }} aria-hidden />
                </div>
              )}
              {/* Featured — the single full-width rotating hero, directly under
                  the Current Learning Path. The one What's New surface on the
                  Home-style overview (the main Dashboard Rebrand, held off the
                  pure Demo), shown for every persona (member + non-member). */}
              {homeStyleOverview && <FeaturedHero />}
              {/* Passport upsell band — directly below the Current Learning Path
                  card; inset `card` variant matching the LP card width + radius. */}
              {showExtras && <WhatsNewUpsellBand variant="card" />}
            </div>
          </Wrap>
        </section>
      ) : (
        <>
          {/* Membership Summary KPI band — leads the overview, above the widgets. */}
          {leadingKpis && <MembershipKpis />}

          {/* Learning progress — Jump Back In (left) + the Current Learning
              Path tracker (right) at one shared height (`alignItems: stretch`),
              with the togglable recap banner beneath them. */}
          {progressPath && (
            <section>
              <Wrap style={{ padding: 0 }}>
                {!hideEyebrow && (
                  <div style={{ marginBottom: 16 }}>
                    <Eyebrow style={{ color: 'var(--color-primary-800)', fontSize: 15 }}>Your Learning</Eyebrow>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {topBand ? (
                    topBand
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 20,
                        alignItems: 'stretch',
                        flexWrap: 'wrap',
                      }}
                    >
                      {learningCards}
                    </div>
                  )}
                  {showExtras && <WhatsNewUpsellBand variant="card" />}
                </div>
              </Wrap>
            </section>
          )}
        </>
      )}

      {/* "Recommended for you" — a full-bleed background bar (breaks SectionShell's
          gutter to run rail → right edge) holding the personalized blended
          product carousel. Rebrand overview only. Sits ABOVE What's New so the
          personalized picks lead the discovery zone. (Replaced the former
          Featured Products + 6-tile Recommended discovery row, which was removed.) */}
      {/* "Your study weeks" — the last thing in the learner's OWN zone before
          the discovery zone starts, which is why it sits directly above
          Recommended for You rather than below it. Hidden when the current path
          has no plan; the band is a summary of one, so there is nothing to
          summarise.

          The Wrap needs `padding: 0` AND `width: 100%`, and the second one is
          the load-bearing half. `Wrap` sets `margin: 0 auto`, and an auto
          margin on the CROSS AXIS of a flex column overrides `align-items:
          stretch` — the item collapses to its content width. Every other Wrap
          on this page sits inside a `<section>` (a block container, where auto
          margins simply centre it), so none of them hit this; as a direct child
          of the column, this one rendered at 483px against its siblings' 993.
          A `maxWidth` still caps it at the same 1200 the others use. */}
      {showExtras && weekSummaryOn && weekSummaryCalendar && (
        <Wrap style={{ padding: 0, width: '100%' }}>
          <StudyWeekSummary calendar={weekSummaryCalendar} />
        </Wrap>
      )}

      {showExtras && recommendedOn && <DashboardRecommendedBand badged={badged} />}

      {/* Free Content promo bands (blog + podcast) — same banner shape as the
          membership upsell band, one colour per content type. Placed BELOW
          Recommended for you: the personalized picks lead the discovery zone,
          and these are a footnote to it rather than a competitor. Wrapped so
          they keep the content column's width — the Recommended band above is
          deliberately full-bleed, these are not. Flag-gated, default off. */}
      {showExtras && (
        // A plain block div, NOT `Wrap`. Wrap sets `margin: 0 auto`, and an auto
        // cross-axis margin on a flex item cancels the parent column's stretch —
        // the bands centred at their content width (922px in a 1081px column)
        // and sat inset from the upsell band above them.
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <FreeContentBands />
        </div>
      )}

      {/* ARCHIVED 2026-08-05 — the smaller "What's New / What's Trending"
          carousel (WhatsNewWidget) was removed here. The single Featured hero
          (above, under the CLP) is now the only What's New surface. The
          component + its `dashboard-whats-new-layout` flag are kept; to restore,
          re-add the import above and the render block:
            {showExtras && !homeStyleOverview && (
              <WhatsNewWidget title={marketingFocused ? "What's Trending" : undefined} badged={badged} />
            )}
          See the Archive tab (src/data/archivedItems.ts, id 'whats-new-widget'). */}

      {/* "Career Tools" — the three Rubi AI tool cards, at the bottom of the
          rebrand overview. Flag-gated (`dashboard-career-tools`, on by default).
          Rebrand overview only (`showExtras`). */}
      {showExtras && <CareerToolsSection />}

      {/* the rest of the page sits on a slightly darker gray band so
          it reads as a separate zone from the personalized summary above.
          The sections keep their own `Wrap` insets; the band just supplies
          the background + bottom breathing room (WhatsNewSpine carries the
          top padding). */}
      {!hideMarketing && (
        <div
          style={{
            background: 'var(--color-neutral-200)',
            // Extra breathing room under "Your Learning" before the gray block
            // divider: keep the full 40px parent gap (no negative offset) so the
            // transition into the band reads clearly.
            paddingBottom: 24,
            ...(bleedBand ? { marginLeft: -24, marginRight: -24 } : null),
          }}
        >
          {/* 3 · What's new */}
          <WhatsNewSpine access="full" hideTitle hideBlurb compactTop eyebrowColor="var(--color-primary-800)" />

          {/* 4 · Explore your benefits — four alternating-side marketing
              heroes (Library / Podcasts / Exam Prep / AI Career Tools)
              replacing the older 4-card grid. */}
          <section style={{ padding: '8px 0 24px' }}>
            <BenefitHeroSections />
          </section>
        </div>
      )}
    </div>
  )
}

/* ─── Career Tools — Rubi AI launch cards ────────────────────────────── */

/**
 * "Career Tools" section for the Dashboard Rebrand overview — the three Rubi
 * AI tool cards (Interview Simulation / Resume Review / Career Path Explorer),
 * reusing the `BenefitSections` `launch` cards. Rendered at the bottom of the
 * overview, gated by the `dashboard-career-tools` flag. The section owns its
 * own header (matching the "What's Trending" / "Recommended for you" lead
 * header) so `BenefitSections`' internal header is suppressed (`headerMode`
 * `never`). Elite-only data — `benefitRowsFor` returns `[]` for other brands,
 * so `BenefitSections` self-hides and the section renders empty (harmless).
 */
function CareerToolsSection() {
  const enabled = useFeatureFlag('dashboard-career-tools').enabled
  const { access: acctAccess } = useAccount()
  if (!enabled) return null
  // Launch (Rubi) cards don't gate on access, but pass a valid value.
  const access = acctAccess === 'full' ? 'full' : 'lite'
  return (
    <section aria-label="Career Tools" style={{ paddingTop: 4 }}>
      <Wrap style={{ padding: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={careerToolsHeaderStyle}>Career Tools</span>
            <span style={memberExclusiveBadgeStyle}>Member Exclusive</span>
          </div>
          <p style={careerToolsLedeStyle}>
            Advance your career with Rubi AI — all included with membership.
          </p>
        </div>
        <BenefitSections
          only={['career-tools']}
          access={access}
          cardStyle="launch"
          headerMode="never"
          divider={false}
          noTopPadding
        />
      </Wrap>
    </section>
  )
}

// Large accent lead header — kept in sync with the What's Trending /
// Recommended band headers on the same overview. Uses `--color-accent-text`
// so it clears AA on white (dropping a stop for CRE/McKissock) and lifts to a
// lighter stop when the surface flips navy in dark mode.
const careerToolsHeaderStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-accent-text)',
}

const careerToolsLedeStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

// HOME tile: the external "Current Learning Path" section lead above the CLP
// band — the same accent lead as "Featured" / the Recommended band header so
// the two sections read as siblings.
const sectionLeadStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  // Theme-aware: deep navy on light, lifts to a light brand tint in dark.
  color: 'var(--color-section-lead)',
}

// "Switch Learning Path (N)" — far-right of the CLP section lead. Matches the
// Learning Path page's Switch Learning Path link (14px / 600 / `--color-action`)
// but without its trailing arrow icon.
const switchPathLinkStyle: CSSProperties = {
  flexShrink: 0,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
  whiteSpace: 'nowrap',
}

// "Member Exclusive" tag beside the Career Tools title — matches the teal
// `secondary-700` shelf badge (square tag, white text).
const memberExclusiveBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  padding: '0 8px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-secondary-700)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

/* ─── Jump Back In — medium course card docked beside the path tracker ── */

/**
 * Compact Jump-Back-In surface for the Membership Overview's "Your Learning"
 * row. Renders one in-progress CourseCard at the `dense` (medium) size, with
 * a "View All →" eyebrow that routes to the in-progress filter on My Courses.
 * No quick-links section — the dashboard JumpBackInCard's `links-*` layouts
 * would overshoot the row height we want to match here.
 */
function OverviewJumpBackIn({
  fullWidth = false,
  fillHeight = false,
  course: inProgress,
  mode,
  discoveryTone = 'new',
  onBrowseCatalog,
}: {
  fullWidth?: boolean
  /** Fill the parent column's height (used in the `two-thirds` layout so the
   *  card matches the Current Learning Path tracker beside it) instead of the
   *  fixed stacked-layout height. */
  fillHeight?: boolean
  /** The course to resume — re-points with the active learning path. */
  course?: CourseCardData
  /** Slot mode (persona-driven). `resume` = in-progress course; `up-next` = a
   *  queued, not-started course ("Up Next" + a tile that launches); `discovery`
   *  = nothing to resume or launch (the Browse Catalog empty state). Omitted →
   *  the classic resume/empty behavior (unchanged for non-persona callers). */
  mode?: 'resume' | 'up-next' | 'discovery'
  /** Copy tone for the `discovery` empty state. */
  discoveryTone?: 'completed' | 'new'
  /** Opens the Course Catalog rail section (discovery CTA). */
  onBrowseCatalog?: () => void
}) {
  // Jump Back In color wheel — fixed to the default (`auto`) palette; the tile
  // now renders only in the standalone `default` layout (the rebrand bands draw
  // their own Jump Back In half).
  const p = useWidgetColor(undefined)
  const onDark = fullWidth && p.onDark
  // Course-tile style is fixed to the media-left "compact" tile.
  const medium = false
  // Card click → open the Learning Launcher in-shell (left rail stays); the
  // card's kebab → the (currently blank) course-details panel.
  const launcher = useCourseLauncher()
  const [detailsOpen, setDetailsOpen] = useState(false)
  // Effective slot mode. Explicit persona mode wins; otherwise it's a plain
  // resume tile (or the classic empty line when there's no course).
  const isDiscovery = mode === 'discovery'
  const isUpNext = mode === 'up-next'
  const jbiLabel = isUpNext ? 'Up Next' : 'Jump Back In'
  return (
    <>
    <section
      aria-label="Jump back in"
      style={{
        // Fixed 320px in the default row. In the stacked layout the two-column
        // wrapper provides the width; `fillHeight` grows the card to match the
        // tracker beside it, otherwise it uses the fixed stacked height.
        flex: fullWidth ? (fillHeight ? '1 1 auto' : '0 0 auto') : '0 0 320px',
        // The medium (top-image) tile is taller than the fixed compact height, so
        // let the section hug it instead of clipping.
        height: fullWidth && !fillHeight && !medium ? 240.5 : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 20px',
        background: fullWidth ? p.surface : 'var(--color-surface-card)',
        border: fullWidth ? p.border : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Eyebrow + View All — colors flip light on the dark bands. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: onDark ? p.eyebrow : 'var(--color-text-secondary)',
          }}
        >
          {jbiLabel}
        </span>
        {/* View All routes to in-progress courses — hidden in discovery (nothing
            in progress to view). */}
        {!isDiscovery && (
          <Link
            to="/my-learning/courses?status=in-progress"
            className="cre-link-action"
            style={{
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              // On the light/navy surface use the contrast-aware accent link
              // (flat --color-action failed on navy in dark); dark bands paint
              // their own light-on-dark color.
              color: onDark ? 'var(--color-text-inverse)' : 'var(--color-accent-link)',
            }}
          >
            View All →
          </Link>
        )}
      </div>
      {isDiscovery ? (
        <DiscoveryEmpty tone={discoveryTone} onBrowseCatalog={onBrowseCatalog} compact />
      ) : inProgress ? (
        // `medium` (the `dashboard-jump-back-in-style` flag) renders the classic
        // top-image "medium" CourseCard in either layout. Otherwise the stacked
        // layout (`fullWidth`) uses the media-left compact tile — square cover +
        // title beside it, data points beneath — and the default row keeps the
        // dense/condensed top-image tile.
        medium ? (
          <CourseCard
            data={inProgress}
            dense
            tone={onDark ? 'dark' : 'light'}
            onActivate={() => launcher.open(inProgress.id)}
            onKebab={() => setDetailsOpen(true)}
          />
        ) : fullWidth ? (
          <CourseCard
            data={inProgress}
            mediaLeft
            tone={onDark ? 'dark' : 'light'}
            onActivate={() => launcher.open(inProgress.id)}
            onKebab={() => setDetailsOpen(true)}
          />
        ) : (
          <CourseCard
            data={inProgress}
            dense
            condensed
            onActivate={() => launcher.open(inProgress.id)}
            onKebab={() => setDetailsOpen(true)}
          />
        )
      ) : (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          You don't have anything in progress.
        </p>
      )}
    </section>
      {inProgress && (
        <CourseDetailsPanel
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          course={inProgress}
        />
      )}
    </>
  )
}

/* ─── Your Membership — small KPI section (V7) ───────────────────────── */

/** Visual treatment of the Membership Summary band — driven by the
 *  `membership-summary-style` feature flag (dark / bare / light). */
type KpiPalette = {
  /** Band container background. */
  bg: string
  /** Optional band border (light card variant). */
  border?: string
  /** Drop the band's horizontal padding (bare variant flushes to the edge). */
  flush?: boolean
  divider: string
  label: string
  value: string
  sub: string
}

const KPI_PALETTES: Record<string, KpiPalette> = {
  // Current default — deep teal band, white text.
  dark: {
    bg: 'var(--color-secondary-800)',
    divider: 'rgb(255 255 255 / 0.22)',
    label: 'rgb(255 255 255 / 0.7)',
    value: 'var(--color-text-inverse)',
    sub: 'rgb(255 255 255 / 0.7)',
  },
  // Same dark band as `dark`, plus the member "Your Membership" header banner
  // (added in MembershipKpis when the variant is `banner`).
  banner: {
    bg: 'var(--color-secondary-800)',
    divider: 'rgb(255 255 255 / 0.22)',
    label: 'rgb(255 255 255 / 0.7)',
    value: 'var(--color-text-inverse)',
    sub: 'rgb(255 255 255 / 0.7)',
  },
  // No surface — stats sit on the page, primary-700 text.
  bare: {
    bg: 'transparent',
    flush: true,
    divider: 'var(--color-border-subtle)',
    label: 'color-mix(in srgb, var(--color-primary-700) 70%, transparent)',
    value: 'var(--color-primary-700)',
    sub: 'color-mix(in srgb, var(--color-primary-700) 70%, transparent)',
  },
  // White card surface, primary-700 text.
  light: {
    bg: 'var(--color-surface-card)',
    border: '1px solid var(--color-border-subtle)',
    divider: 'var(--color-border-subtle)',
    label: 'color-mix(in srgb, var(--color-primary-700) 70%, transparent)',
    value: 'var(--color-primary-700)',
    sub: 'color-mix(in srgb, var(--color-primary-700) 70%, transparent)',
  },
}

/** Orientation context for the KPI band — `true` lays the stats out as a
 *  vertical card (stacked, horizontal dividers) instead of the horizontal band.
 *  Provided by `KpiBand`, consumed by `KpiStat` + `KpiStatDivider`. */
const KpiVerticalContext = createContext(false)

function MembershipKpis({ vertical = false }: { vertical?: boolean }) {
  const { brand, membership, user } = useAccount()
  const isMember = membership === 'member'
  const summary = passportMembershipFor(brand)
  const savings = passportSavingsFor(brand)
  const stats = dashboardStatsFor(brand)
  const variant = useFeatureFlag('membership-summary-style').variant ?? 'dark'
  const p = KPI_PALETTES[variant] ?? KPI_PALETTES.dark

  // The non-member band is gone. It rendered learner progress closing on an
  // upgrade hook (Potential Savings in CTA colour · Free Account), and it was
  // ELITE-ONLY — the brand carrying the savings/plan fixtures; every other
  // brand returned null right here. XCEL sells no membership, so it has no
  // non-member state to be in. Restoring it means restoring a brand that HAS
  // one, plus its savings fixtures. The member band below is untouched.
  if (!isMember) {
    // The non-member summary band was authored for Elite alone, and every other
    // brand returned null here. XCEL sells no membership, so it is never in a
    // non-member state to reach this in the first place.
    return null
  }

  if (!summary) return null
  return (
    <KpiBand palette={p} vertical={vertical} header={variant === 'banner' ? <MembershipKpiHeader palette={p} expiresOn={user.planExpiresOn} /> : undefined}>
      <KpiStat
        first
        palette={p}
        label="Member for"
        value={`${daysSince(summary.memberSince).toLocaleString()} days`}
        sub={`Since ${fmtDate(summary.memberSince)}`}
      />
      {/* Stacked layout swaps the "You Saved" stat for the plan expiration date
          (the same mm/dd/yyyy `user.planExpiresOn` the banner header uses); the
          default layout keeps the savings stat. */}
      {vertical ? (
        <>
          <KpiStatDivider color={p.divider} />
          <KpiStat palette={p} label="Expires" value={user.planExpiresOn ?? '—'} sub="Passport Lite plan" />
        </>
      ) : savings ? (
        <>
          <KpiStatDivider color={p.divider} />
          <KpiStat palette={p} label="You Saved" value={savings.amount} sub="with your membership" />
        </>
      ) : null}
      <KpiStatDivider color={p.divider} />
      <KpiStat palette={p} label="Credits" value={`${stats.creditsEarned}`} sub="total completed" />
      <KpiStatDivider color={p.divider} />
      <KpiStat palette={p} label="Certificates" value={`${stats.certificatesCount}`} sub="lifetime earned" />
      {/* Time Spent is dropped from the stacked layout; the default horizontal
          band keeps it. */}
      {!vertical && (
        <>
          <KpiStatDivider color={p.divider} />
          <KpiStat palette={p} label="Time Spent" value="459" sub="hours of learning" />
        </>
      )}
    </KpiBand>
  )
}

/** KPI band wrapper — the section + `Wrap` + palette-painted card surface +
 *  the inner stat flex row. Shared by the member + non-member bands so the
 *  band chrome (and the `membership-summary-style` palette) stays identical
 *  between them; only the `KpiStat` children differ. */
function KpiBand({
  palette,
  header,
  children,
  vertical = false,
}: {
  palette: KpiPalette
  /** Optional banner header strip rendered above the stats (the `banner`
   *  summary-style variant passes the member "Your Membership" header). */
  header?: ReactNode
  children: ReactNode
  /** Lay the stats out as a stacked vertical card (the Discoverability
   *  `stacked` dashboard layout) instead of the horizontal band. */
  vertical?: boolean
}) {
  return (
    <section style={{ paddingTop: 8 }}>
      <Wrap style={{ padding: 0 }}>
        <div
          style={{
            background: palette.bg,
            border: palette.border,
            borderRadius: 'var(--radius-lg)',
            // Clip the header strip to the rounded corners.
            overflow: header ? 'hidden' : undefined,
          }}
        >
          {header && (
            <>
              <div style={kpiHeaderStripStyle}>{header}</div>
              <span aria-hidden style={{ display: 'block', height: 1, background: palette.divider }} />
            </>
          )}
          <div
            style={{
              padding: palette.flush ? '8px 0 0' : '20px 24px',
              display: 'flex',
              alignItems: 'stretch',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <KpiVerticalContext.Provider value={vertical}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: vertical ? 'column' : 'row',
                  alignItems: vertical ? 'stretch' : 'center',
                  flex: '1 1 440px',
                  minWidth: 0,
                }}
              >
                {children}
              </div>
            </KpiVerticalContext.Provider>
          </div>
        </div>
      </Wrap>
    </section>
  )
}

// Darker top strip (secondary-900) that frames the member "Your Membership"
// banner above the KPI stats.
const kpiHeaderStripStyle: CSSProperties = {
  background: 'var(--color-secondary-900)',
  padding: '12px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

/** Member "Your Membership" banner — Passport Lite badge + plan expiry on the
 *  left, a "Manage Membership" link on the right. Rendered as the `banner`
 *  summary-style variant's KPI-band header (always on the dark palette). */
function MembershipKpiHeader({ palette, expiresOn }: { palette: KpiPalette; expiresOn?: string }) {
  const { tierLabel, tierTone } = useAccount()
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 15,
            fontWeight: 700,
            color: palette.value,
          }}
        >
          Your Membership
        </span>
        <MembershipBadge tone={tierTone} label={tierLabel ?? 'Member'} icon={tierBadgeIcon(tierTone)} />
        {expiresOn && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: palette.sub }}>
            Expires on {expiresOn}
          </span>
        )}
      </div>
      <a href="/membership/plans" style={kpiManageLinkStyle}>
        Manage Membership
        <ArrowRight size={14} aria-hidden />
      </a>
    </>
  )
}

const kpiManageLinkStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text-inverse)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  whiteSpace: 'nowrap',
}

/** Standalone "Upgrade" promo card. V7 docks it under the side-nav rail
 *  (same 232px width) rather than inside the KPI band. Self-guards: renders
 *  nothing when the active membership has no upgrade path. */
export function MembershipUpgradeCard() {
  const { brand } = useAccount()
  const membership = passportMembershipFor(brand)
  if (!membership?.upgrade) return null
  return <KpiUpgradeCard tier={membership.upgrade.tier} meta={membership.upgrade.meta} />
}

/** Hairline divider between KPI stats — color comes from the active palette.
 *  Vertical (the stacked-card layout) flips it to a full-width horizontal rule. */
function KpiStatDivider({ color }: { color: string }) {
  const vertical = useContext(KpiVerticalContext)
  return (
    <span
      aria-hidden
      style={
        vertical
          ? { height: 1, width: '100%', background: color, flexShrink: 0 }
          : { alignSelf: 'stretch', width: 1, background: color, flexShrink: 0 }
      }
    />
  )
}

/** Inline stat on the KPI band — label / value / sub, colored by the palette.
 *  `valueColor` overrides just the big value's color (the non-member band
 *  uses it to tint "Potential Savings" in the CTA color as the upgrade hook);
 *  it defaults to the palette's value color so member stats are unchanged. */
function KpiStat({
  label,
  value,
  sub,
  palette,
  first = false,
  valueColor,
}: {
  label: string
  value: string
  sub: string
  palette: KpiPalette
  first?: boolean
  valueColor?: string
}) {
  const vertical = useContext(KpiVerticalContext)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: vertical ? '12px 0' : first ? '2px 22px 2px 0' : '2px 22px',
        flex: vertical ? 'none' : 1,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: palette.label,
        }}
      >
        {label}
      </span>
      <b style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, lineHeight: 1.15, color: valueColor ?? palette.value }}>
        {value}
      </b>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: palette.sub }}>{sub}</span>
    </div>
  )
}

/**
 * Quiet upgrade promo (Option A): a dark navy card that sits inside the rail
 * (primary-700, one step lighter than the primary-800 strip) with the brand
 * CTA color reserved for a single solid button — so the magenta is the only
 * saturated element and the eye lands on the action directly. Visual-only;
 * props + call sites unchanged.
 */
function KpiUpgradeCard({ tier, meta }: { tier: string; meta: string }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{
        width: '100%',
        background: 'color-mix(in srgb, var(--color-primary-700) 60%, transparent)',
        border: '1px solid rgb(255 255 255 / 0.10)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        color: 'var(--color-text-inverse)',
      }}
    >
      <span style={{ ...KPI_LABEL, color: 'rgb(255 255 255 / 0.6)' }}>Upgrade</span>
      <b style={{ display: 'block', fontFamily: 'var(--font-heading)', fontSize: 17, lineHeight: 1.2, margin: '4px 0 0' }}>
        {tier}
      </b>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgb(255 255 255 / 0.7)', marginTop: 4 }}>
        {meta}
      </div>
      <button
        type="button"
        onClick={() => console.info('cta:upgrade-membership')}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`Upgrade to ${tier}`}
        style={{
          width: '100%',
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          cursor: 'pointer',
          background: hover ? 'var(--color-cta-600)' : 'var(--color-cta-500)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '9px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-inverse)',
          transition: 'background 120ms ease',
        }}
      >
        Upgrade
        <ArrowRight size={13} aria-hidden />
      </button>
    </div>
  )
}

const KPI_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return Math.max(0, Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000))
}

