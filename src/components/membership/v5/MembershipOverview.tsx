import type { DashboardLayout } from '@/data/dashboardVersions'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { ArrowRight } from '@/icons'
import { useAccount, supportsMembership } from '@/context/AccountContext'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { getCourseImage } from '@/utils/courseImage'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { displayedProgressPct, resolveRenewal, timeRemainingText } from '@/components/learning/learningPathsHomeUtil'
import { Sheet } from '@/components/ui/Sheet'
import { GetLicensedStepPanel } from '@/components/learning/GetLicensedStepPanel'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'
import { examDateRenewal, useExamDate } from '@/data/examDateStore'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
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
  dashboardLayout?: DashboardLayout
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
  // "QE Focused" (2026-09-16, XCEL's default) — the qualifying-education
  // version. It shares Learner Focused's joined top band and stacked structure,
  // which is why it sets `learnerFocused` too rather than forking the layout;
  // what it changes is what goes IN that band and what follows it. See
  // `DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED` for the three departures.
  const badged = dashboardLayout === 'badged'
  // "Testing" (2026-09-21) — QE Focused with the home screen's second row given
  // over to the PACING exploration: the Readiness tile dropped, Study Pace
  // across the full width. It sets `qeFocused` for the same reason QE Focused
  // sets `learnerFocused` — it IS that version apart from one tile, and
  // re-listing the page surface, the category gauge, the Study Journey, the
  // dropped Recommended band and the requirements-only sheet here is how those
  // two versions start to disagree about things nobody decided to change.
  const testing = dashboardLayout === 'testing'
    // "Testing 2" is the same clone carrying the LIVE pace tile instead. It sets
  // `qeFocused` for the same reason Testing does; the one place it diverges is
  // `livePace`, threaded to the band.
  const testingVersion = dashboardLayout === 'testing-2'
  const qeFocused = dashboardLayout === 'qe-focused' || testing || testingVersion
  // Variant-only flag: the choice IS the variant, so only `.variant` is read.
  // An `enabled` check here would make "off" a third state meaning "sans",
  // which the variant already says.
  // Scoped to the Testing version by `livePace` below — the flag alone never
  // reaches QE Focused, which is the point of putting the widget in a version.
  const studyPaceFlag = useFeatureFlag('study-pace-widget').enabled
  const serifHeadings = useFeatureFlag('dashboard-heading-font').variant === 'serif'
  const courseHeader =
    (useFeatureFlag('dashboard-course-header').variant ?? 'none') === 'band'
  const learnerFocused = dashboardLayout === 'learner-focused' || qeFocused
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
  /*
   * WHICH HALF the sheet opens on — 2026-09-17.
   *
   * `LearningPathDetailPanelContent` has taken a `view` of 'tabs' | 'progress'
   * | 'requirements' since the tab bar came off on QE Focused. Until now this
   * version could only reach the REQUIREMENTS half, because that was what every
   * trigger meant; the header band's new "View Details" opens the PROGRESS half
   * — the gauge, the category bars and the per-category course lists, i.e. the
   * Course Breakdown.
   *
   * State rather than a second sheet: two sheets rendering one component is the
   * fork this file keeps closing, and the existing prop already does the work.
   * It resets to 'requirements' on close so a trigger that sets no view (the
   * journey stops, Get Licensed) keeps its old behaviour.
   */
  const [detailView, setDetailView] = useState<'progress' | 'requirements'>('requirements')
  /*
   * WHICH GET LICENSED STEP has its sheet open — 2026-09-17.
   *
   * The three rows opened the REQUIREMENTS sheet until now, which was the
   * honest placeholder while nothing described them individually. XCEL's own
   * requirements page does, and that content is in `GET_LICENSED_STEPS` now, so
   * each row opens its own step.
   *
   * A SEPARATE Sheet from the requirements one, not a third `view` on it: that
   * panel is about the path, takes a `path` prop and shares its header with the
   * breakdown. A step is a different object with a different header, and
   * bending one component around both is how it stops being either.
   */
  const [openStepId, setOpenStepId] = useState<string | null>(null)
  const openStep = GET_LICENSED_STEPS.find((st) => st.id === openStepId) ?? null
  const openDetail = (view: 'progress' | 'requirements' = 'requirements') => {
    setDetailView(view)
    setDetailOpen(true)
  }
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
  // "Home-style overview" — the V1 CLP + Jump Back In top band + its external
  // "Current Learning Path" lead + the Featured hero below. Now the baseline for
  // the whole Dashboard Rebrand overview, including the pure Demo (`?demo=1`) —
  // promoted 2026-08-05 (was previously held off the Demo behind `!demoScoped`).
  const homeStyleOverview = showExtras
  // `dashboard-whats-new-layout` was removed from the catalog 2026-09-16 (the
  // XCEL flag audit): the "What's Trending" section it named was archived
  // 2026-08-05, so this condition — `secondaryVariant !== 'when-whats-new-off'
  // || !whatsNewOn` — was its only surviving effect, and with the flag off by
  // default it was permanently true. `dashboard-clp-fullwidth`'s "When to show"
  // secondary axis went with it; the band now shows whenever the flag is on.
  const clpFullWidthActive = showExtras && clpFullWidthFlag.enabled
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
  // QE Focused resolves to a QUALIFYING journey, not Continuing Ed.
  //
  // The flag's committed default is `ce`, so without this the version named for
  // qualifying education opened on a CE renewal path — the exact incoherence the
  // Jump Back In card hit when it put securities tasks under an insurance path.
  //
  // `exam-prep` still gets through, because it is the OTHER qualifying journey
  // (Parts 2-3 of the same programme) and a reviewer picking it is making a
  // real choice about this version. What is refused is `ce`, and the Demo
  // Controls bar drops that option here rather than leaving a dropdown entry
  // that silently does nothing.
  const educationFlagVariant = useFeatureFlag('dashboard-education-type').variant
  const educationType = (
    qeFocused
      ? educationFlagVariant === 'exam-prep'
        ? 'exam-prep'
        : 'qe'
      : educationFlagVariant ?? 'ce'
  ) as 'ce' | 'qe' | 'exam-prep'
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
  // Whole-section toggle for the Recommended band. Distinct from
  // `nav-show-recommended`, which hides the PAGE in the left nav — this one is
  // the band on Home, and a reviewer can want either without the other.
  // Whole-section toggle for the Recommended band, AND the QE Focused version's
  // standing removal of it. The flag is a reviewer control; the layout rule is
  // an editorial one — a candidate working a fixed curriculum towards a booked
  // exam is not shopping, so the discovery band has no job on this version.
  // Expressed here rather than by shipping the flag off, because the flag has to
  // keep working on the other two versions.
  const recommendedOn = useFeatureFlag('dashboard-recommended').enabled && !qeFocused
  // In-shell course launcher for the Study Journey's stops. Safe outside the
  // provider (`available` is false), which is what the standalone pages get.
  const journeyLauncher = useCourseLauncher()
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
  const personaRenewalBase = personaDrivesPath ? persona!.renewal : undefined
  /*
   * THE LEARNER'S OWN BOOKED EXAM DATE WINS — 2026-09-21. Entered on the
   * Schedule State Exam card ("Already scheduled? Enter the exam date and we
   * will use that to help you prep!"), and this is the line that makes the
   * second half of that sentence true.
   *
   * Applied HERE rather than in the band, because `personaRenewal` feeds BOTH
   * the band and the course header band's stat row — so one stored value moves
   * the Target Exam Date, the days remaining AND the Pacing tile's required
   * rate together. Overriding it further down would leave the header printing
   * the persona's date beside a countdown to the learner's, which is exactly
   * the cross-surface disagreement `ProgressAgreement.test.tsx` exists for.
   *
   * It falls back to the persona rather than replacing it: with nothing stored
   * the demo is unchanged, and clearing the field restores it.
   */
  /* HOISTED out of the call below (2026-09-21) so the RAW stored date can reach
     the Study Pace tile as well. `examDateRenewal` returns a formatted deadline
     plus a week count — the right shape for the header's stat row and the wrong
     one for the pace model, which has to compare this date to a course's access
     expiry to decide which ceiling binds. One `useExamDate()` call feeding both
     is what stops the two surfaces reading different values of one fact. */
  const storedExamDate = useExamDate()
  const personaRenewal = examDateRenewal(storedExamDate) ?? personaRenewalBase
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
  // Opens a Study Journey stop. The stops are synthesized per category (they
  // are not catalogue course ids), so the in-shell launcher is best-effort and
  // there has to be a fallback — a launcher opening nothing is the one outcome
  // worse than a second-best destination.
  //
  // On QE FOCUSED that fallback is the requirements sheet, not the Learning
  // Path. XCEL has no learning-path concept (see the band's own note below), so
  // the old fallback sent a stop with no course to a surface that does not
  // describe this product. The requirements sheet does: it is what the
  // programme actually is.
  const openJourneyStop = (id: string) => {
    if (journeyLauncher.available) journeyLauncher.open(id)
    else if (qeFocused) setDetailOpen(true)
    else if (onOpenLearningPath && activeProgressPath) onOpenLearningPath(activeProgressPath.id)
  }

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
  /*
   * NARROW HEADER — the band is in the band's LEFT COLUMN rather than
   * full-width above it (Testing; see `headerSlot`). It is ~630px instead of
   * ~1040, and two of this block's layout decisions were made against the wide
   * measurement and invert at this one. Both are below, each at its own site.
   */
  const narrowHeader = testing
  /*
   * COURSE HEADER BAND — `dashboard-course-header`, off by default.
   *
   * A page title above everything: the meta on one line, the course name large,
   * two actions right, a rule under the lot. It deliberately says the course
   * name TWICE — this and the Current Course Progress block's own heading a few
   * lines below — which is why it is a variant rather than a default. The
   * question it exists to answer is whether this page should read as a COURSE
   * or as a dashboard.
   *
   * Both actions go to real destinations and neither is invented:
   *
   *   - "State requirements" opens the requirements sheet, the same surface
   *     "View Requirements" opens.
   *   - "Study plan (PDF)" is the guide XCEL itself links from the product page
   *     ("Read our recommended study plan"). The reference called its second
   *     button "Syllabus (PDF)"; this is a 7-day study PLAN, not a syllabus, and
   *     labelling it as one would misdescribe the file it opens. The
   *     reference's other button, "DFS Statutory Rules", has no confirmed URL
   *     in this repo — the requirements sheet is what we can actually reach.
   */
  // The resume course's art, same source the band uses — one course, one
  // picture, whichever of the two is showing it.
  const courseCover = activeCourse
    ? (activeCourse.imageUrl ?? getCourseImage(activeCourse.id))
    : null
  /* The cover's box. It was 104 WIDE with the height first fixed at 72 and then
     stretched to the column; it is a 130px SQUARE as of 2026-09-17 (the direct
     ask).

     ONE constant now, not a width and a height, because a square is the shape
     rather than a coincidence of two numbers — and the only way the two can
     drift apart is if they are written separately.

     Note the square is TALLER than the text column beside it (~105px), so the
     image is what sets the band's height. That is the intended reading: the art
     is the first thing in the header and it anchors the block. The bar no
     longer needs to clear it — the cover is a flex sibling of the whole column,
     so the alignment is structural. */
  const COURSE_HEADER_COVER = 130
  const COURSE_HEADER_COVER_GAP = 16
  /**
   * What the header's progress bar occupies — its 8px height plus the 2px of
   * rhythm between it and the stat row's own 14px margin.
   *
   * Spent as padding ABOVE the eyebrow when the bar is hidden at 0%, so the
   * header keeps its height and the cluster moves down instead of the block
   * collapsing. A named constant rather than a 10 at each end because the two
   * uses must stay equal: if the bar's height ever changes and this does not,
   * the header grows or shrinks at 0% only — a difference nobody would see
   * until they flipped the demo's PROGRESS control.
   */
  const HEADER_BAR_RESERVE = 10
  // One resolver, shared with the band below — see the note at the bar.
  const headerPct = activeProgressPath ? displayedProgressPct(activeProgressPath) : 0
  /* The count under the bar, from the SAME category list the gauge sums —
     `resolvePathCategories`, not the authored `progressPct` — so the header's
     "26 of 42" and its 62% cannot describe different things. */
  const headerCats = activeProgressPath ? resolvePathCategories(activeProgressPath) : []
  const headerDone = headerCats.reduce((sum, c) => sum + c.completed, 0)
  const headerTotal = headerCats.reduce((sum, c) => sum + c.required, 0)
  const headerUnit = activeProgressPath?.unitLabel ?? 'hrs'
  /* The three facts under the bar — 2026-09-16, the direct ask. The count was
     alone here; the target date and the countdown joined it "in the same style
     as the lessons completed".

     `resolveRenewal` is the SAME pair `LearnerFocusedBand` prints in its KPI
     cells directly below, so the header and the block cannot disagree about a
     figure the reader can see twice without scrolling.

     ⚠ The note that stood here about spelling the date out (`longDate`, "a page
     header states a date once and has the room") went with the date cell on
     2026-09-21 — it described a cell this row no longer has. What survives of
     it is the rule it rested on, which still governs the countdown: the header
     and the block read ONE resolved renewal. */
  const headerRenewal = resolveRenewal(personaRenewal)
  const headerStats: { value: string; caption: string }[] = [
    /* THE TARGET EXAM DATE CELL IS GONE — 2026-09-21, the direct ask
       ("remove"), pointed at the "December 15, 2026 · TARGET EXAM DATE" pair.
       It joined the row on 2026-09-16 with the countdown, when the lesson count
       was alone here.

       WHAT SURVIVES IT, because the removal looks larger than it is: the
       countdown beside it derives from the same `headerRenewal`, so a date
       entered on the Schedule State Exam card still moves this row and still
       moves the Study Pace tile. The DATE itself is still echoed back on that
       card ("Your exam date · June 30, 2026 · Edit") — the confirmation lives
       on the control that asked for it, which is where it was always most
       useful. What went is the second, passive copy up here.

       `longDate` left this file's imports with the cell — its only caller
       here. `StudyJourneyWidget` still uses it for that echo.

       `resolveRenewal` is unchanged and still feeds the countdown, so nothing
       downstream of the date resolution moved with the cell. */
    /* "To complete course", not "Left to complete" (2026-09-21, the direct
       ask). The value beside it is already a remaining figure — "27 days" — so
       "left" was the caption repeating what the number says, and naming the
       OBJECT is the half the pair was missing. It also matches its neighbours,
       which both say what the figure is ABOUT (the target exam date, the
       lessons completed) rather than which direction it counts.

       Sentence case in source; the row uppercases it in CSS. */
    { value: timeRemainingText(headerRenewal.weeksLeft), caption: 'To complete course' },
    /* Only when there is a breakdown to count. A path with no categories has no
       honest numerator, and "0 of 0 lessons" reads as a load failure. */
    ...(headerTotal > 0
      ? [{ value: `${headerDone} of ${headerTotal} ${headerUnit}`, caption: 'Completed' }]
      : []),
  ]
  /* THE FIGURE, as its own element — 2026-09-21, the direct ask: "move the 62%
     to the left of the 27 days and lessons completed components". It now LEADS
     THE STAT ROW instead of sitting on the title's line.

     ITS FOURTH POSITION, and the moves are worth reading in order because each
     one chased the same thing: a small inline label beside the title → its own
     right-hand column, so it read as the page's headline number → back inline,
     leading the title, so the number and the course were one statement → here.
     What this move buys that the last one did not: the figure now sits with the
     OTHER figures, and the row below the bar reads as the complete set of what
     the bar summarises rather than as two of three facts with the headline one
     a line above.

     IT KEEPS ITS SIZE. 32px against the row's 13px values is deliberate — it is
     the figure the bar draws, and the two cells beside it are its context. Sized
     to match them it would read as a third equal cell and the bar would be left
     without a number.

     A const rather than JSX in place, because the row it joins renders twice
     (the wide band and the narrow left column) and a second copy is how the two
     arrangements start disagreeing.

     ⚠ NOT RENDERED AT ZERO — 2026-09-21, the direct ask ("for 0% (not started)
     lets hide the percentage and the divider line in the top section"). A 32px
     "0%" leading the row is the page's headline number saying nothing, beside a
     bar drawing nothing, and it reads as a figure that failed to load rather
     than as a course not begun. The two cells beside it still carry the honest
     facts — the window, and "0 of 42 lessons completed".

     THE DIVIDER GOES WITH IT, necessarily: it exists to separate the figure
     from the pairs, so with no figure it would be a rule at the start of a row
     with nothing on its left. One condition drives both, rather than two that
     could drift apart. */
  const showHeaderPercent = headerPct > 0
  const headerPercent = (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 32, lineHeight: 1, color: 'var(--color-text-primary)' }}>
        {headerPct}
      </span>
      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 17, lineHeight: 1, color: 'var(--color-text-primary)' }}>
        %
      </span>
    </span>
  )
  const courseHeaderBand = courseHeader && activeProgressPath && (
    <Wrap style={{ padding: 0, width: '100%' }}>
      {/* THE DASHED DIVIDER IS GONE — 2026-09-21, the direct ask ("remove the
          dashed divider line"). It arrived on 2026-09-17 to separate this
          header from the block below it, and what replaced it is the ruled
          cards under it: both now carry their own hairline and a 6px left
          rule, so the header is already visibly a different thing from what
          follows and a second separator was drawing a boundary the cards had
          started drawing themselves.

          WHAT WENT WITH IT, and why the number changed: the spacing was 39 +
          the rule's own 1px, chosen so the line sat 40 from the content above
          and 40 from the block below — the page's own section rhythm, which
          `MembershipOverview` uses between every section and the band's columns
          repeat. With no border to make up the last pixel the padding takes it,
          so the gap below the header is still exactly 40 and nothing else on
          the page had to move.

          The colour note that stood here (why a dashed rule needed
          `--color-neutral-300` rather than `--color-border-subtle`, a dash
          painting half the pixels of a solid line) went with the rule. The
          finding it records is still live on the vertical divider in the stat
          row above, which is on the same token for the same reason. */}
      <div style={{ paddingBottom: 40 }}>
        {/* THE COVER IS A SIBLING OF THE WHOLE COLUMN as of 2026-09-17, not a
            child of the title row.

            It was 104x72 inside that row, which left ~45px of empty column
            beneath it: the bar and the stat row below are indented to clear the
            cover, so the space under the picture belonged to it and nothing
            filled it. `alignItems: stretch` hands the image the column's full
            height, so it now runs from the meta line to the foot of the stat
            row and the crop follows whatever the content needs.

            THIS RETIRES THE MANUAL INDENT. The bar's `marginLeft` was
            `COURSE_HEADER_COVER_W + COURSE_HEADER_COVER_GAP`, a literal sum
            that had to be kept in step with the art — the reason those two were
            constants at all. The alignment is structural now: the bar and the
            title are in the same column, so they cannot drift apart. */}
        {/* BOTTOM-ALIGNED (2026-09-17, the direct ask). The square is 130 and
            the column beside it is ~105, so the two only agree on one edge —
            and the useful one is the bottom, where the stat row and the foot of
            the picture make a single line for the eye to stop on. Top-aligned,
            the leftover 25px hung under the text and read as a gap someone
            forgot to close. */}
        {/* TOP-ALIGNED WHEN NARROW, and the note above is why rather than an
            exception to it: bottom-alignment is right because "the square is
            130 and the column beside it is ~105, so the two only agree on one
            edge". In the left column the title wraps to two lines and that
            column becomes ~213 — TALLER than the square — so the premise
            inverts and the 83px of slack moves under the picture, dropping it
            away from the title it is supposed to anchor. Top-aligned, the art
            sits beside the eyebrow and the name, which is what "the art is the
            first thing in the header" means. */}
        <div
          /* Below 1100px this stacks the cover above the text — see the class
             in tokens.css. The narrow column cannot hold a 130px square, a
             28px name and the figure at once, and everything it gives up comes
             off the title. No class on the wide header, which has the room. */
          className={narrowHeader ? 'cre-course-header-narrow' : undefined}
          style={{
            display: 'flex',
            alignItems: narrowHeader ? 'flex-start' : 'flex-end',
            gap: COURSE_HEADER_COVER_GAP,
          }}
        >
          {courseCover ? (
            <img
              src={courseCover}
              alt=""
              aria-hidden
              onError={(e) => {
                const img = e.currentTarget
                const fallback = getCourseImage(activeProgressPath.id)
                if (img.src.endsWith(fallback)) return
                img.src = fallback
              }}
              style={{
                /* A fixed SQUARE, so the crop is predictable at any content
                   height. It stretched to the column until 2026-09-17, which
                   made the art's aspect a function of how long the course title
                   wrapped — a longer title meant a taller, narrower photograph.
                   `object-fit: cover` still does the cropping, so the picture is
                   never distorted. */
                width: COURSE_HEADER_COVER,
                /* HEIGHT IS THE CLASS'S in the left column — 2026-09-21, the
                   direct ask ("have the image stretch vertically to align with
                   the bottom of the divider line that separates the 62%"). The
                   art now runs the full height of the header's content, so its
                   foot lands on the same line as the stat row's rule.
                   `.cre-course-header-narrow > img` owns it, because the rule
                   has to come BACK OFF below 1100px where the cover stacks
                   above the text — and an inline `alignSelf` would beat the
                   media query while looking correct.
                   The full-width band keeps the fixed square. */
                ...(narrowHeader ? null : { height: COURSE_HEADER_COVER }),
                flex: 'none',
                /* TWO ROUNDED CORNERS, diagonally opposite — top-right and
                   bottom-left (2026-09-17, the direct ask). The shorthand runs
                   clockwise from the top-left, so the zeros are the top-left
                   and bottom-right.

                   Written as the four-value shorthand rather than as two
                   longhand properties, so the pattern is legible in one line
                   and a later edit cannot round three corners by touching one
                   of a pair. */
                borderRadius: '0 var(--radius-md) 0 var(--radius-md)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : null}
        <div style={{ flex: 1, minWidth: 0, paddingTop: headerPct > 0 ? 0 : HEADER_BAR_RESERVE }}>
        {/* THE TITLE WRAPS, NOT THE ROW — 2026-09-17, the direct ask.
            `flex-wrap` sent the whole percentage cluster to its own line the
            moment the heading got long, which moved the number away from the
            name it belongs to. The title column flexes and floors at 0 instead,
            so a long course name takes a second line and the figure stays put.
            `minWidth: 0` is the half that does the work: a flex item's default
            `min-width: auto` refuses to shrink below its content, which is what
            was forcing the wrap in the first place. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
        {/* THE COURSE ART MOVED UP HERE — 2026-09-16.

            It was beside the block's own title a few lines below. With the
            header band on, that put the picture next to the SECOND naming of
            the course rather than the first; up here it sits beside the page
            title, which is what a course page does.

            The block below drops it while this band is on (`courseHeader`),
            because one course should have one picture — the duplication that
            folded the Jump Back In card into the block in the first place.

            Same `<img onError>` mechanism as the block's: a course may name art
            that is not in the repo yet, and the handler falls back to the stock
            pool rather than rendering a blank box. */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* A COURSE PROGRESS EYEBROW, where the meta line was — 2026-09-17,
              the direct ask.

              What left: "Insurance Pre-Licensing · New York · 42 Lessons". The
              jurisdiction and the lesson count are both still on the page —
              "26 of 42 lessons" in the stat row below, and New York in the
              Get Licensed heading — and the category was the least load-bearing
              of the three. So the line above the title now labels the block
              rather than describing the course a second time.

              It takes the SAME caption treatment as the stat row's three, so
              the band carries one small-caps style rather than two. */}
          {/* NAVY, via `.cre-eyebrow-ink` — 2026-09-17, the direct ask, and the
              same ink the Atlas Study Journey, Post-course process and Jump
              Back In eyebrows already take. This one was the odd grey out.

              NO inline `color`: a navy is a FILL colour on XCEL and needs a
              light stop on a dark ground, which the class supplies with a theme
              selector and `CSSProperties` cannot. An inline value here would
              beat the rule while looking correct — the trap `.cre-uxlinks-title`
              and the PSI link both hit. */}
          <p
            className="cre-eyebrow-ink"
            style={{
              margin: '0 0 6px',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Course Progress
          </p>
          {/* THE TITLE IS ALONE ON THIS LINE as of 2026-09-21 — the figure
              moved down to lead the stat row (see `headerPercent`), and its
              separator dot went with it rather than being left to dangle after
              the heading.

              The flex row is KEPT with the title as its only child, for the
              reason the percentage column's own wrapper was kept when that
              moved: unwinding it re-indents the block for no behavioural
              change, and `minWidth: 0` is still what lets a long course name
              wrap instead of overflowing. */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                minWidth: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 28,
                lineHeight: 1.15,
                color: 'var(--color-text-primary)',
              }}
            >
              {activeProgressPath.title}
            </h2>
          </div>
        </div>
        {/* THE RIGHT-HAND PERCENTAGE COLUMN IS GONE (2026-09-17). It held the
            same figure under a "Course Progress" caption; with the number moved
            to the LEFT of the title and that caption promoted to the block's
            eyebrow, keeping it would have printed 62% twice on one line.

            Its own history, because the figure has now been in three places:
            it started beside the title as a small inline label, moved to its
            own right-hand column so it read as the page's headline number, and
            is now the first thing on the title's line. What each move was
            chasing is the same thing — the number and the course it describes
            being read as one statement. */}
        {/* The row that held the percentage column survives as a plain
            wrapper — `justify-content: space-between` with one child is inert.
            Kept rather than unwound: collapsing it would re-indent the whole
            block for no behavioural change, and a future right-hand item would
            want it back. */}
        </div>
        {/* FULL-WIDTH BAR under the title, the figure large on the right.

            It spans the whole band rather than sitting in the title column,
            which is what makes it read as the PAGE's progress rather than as
            one more thing beside the name.

            `displayedProgressPct` — the SAME resolver the band below uses, not
            `path.progressPct`. Those two differ (the band sums the category
            hours and falls back to the authored field only when there are
            none), and a page header disagreeing with the block three inches
            under it is exactly the defect `ProgressAgreement.test.tsx` exists
            to catch.

            The shared `ProgressBar` with the page-grey `track` override, for
            the reason the block's own bar needed one: the default track is
            1.08:1 on this ground. */}
        {/* The indent that used to live here is gone (2026-09-17) — the bar
            and the title are in the same flex column now, so it starts where
            the meta line does by construction rather than by a literal kept in
            step with the art. See the note at the cover.

            `marginTop: 10`, not 18 — the figure sits on the title's line, so
            the bar belongs directly under the pair rather than a row away. */}
        <div style={{ marginTop: 10 }}>
          {/* HIDDEN AT NOUGHT — 2026-09-23, the direct ask: "at 0% hide this bar
              and shift the title and eyebrow down."

              An empty groove is the one state where this bar costs more than it
              says. Everywhere else it reports a position; at 0 it reports that
              there is nothing to report, in the widest element of the band, and
              the stat row directly beneath already prints "0 of 42 lessons
              COMPLETED" in words. A full-width empty track also reads as a
              failed load rather than as a starting point, which is the wrong
              first impression on the one screen a learner sees before they
              begin.

              THE SPACE IS KEPT, which is the second half of the ask and the
              less obvious half. `HEADER_BAR_RESERVE` goes back as padding above
              the eyebrow, so the title and eyebrow shift DOWN by exactly what
              the bar occupied and the header's overall height does not change.
              That matters structurally rather than cosmetically: the cover art
              is `align-self: stretch` (see `.cre-course-header-narrow > img` in
              tokens.css), so a shorter header would re-crop the photograph, and
              the art's foot is deliberately aligned with the stat row's rule —
              "stretch vertically to align with the bottom of the divider line",
              the 2026-09-21 ask. Letting the block collapse would have broken
              that alignment to fix a bar. */}
          {headerPct > 0 ? (
            <ProgressBar
              pct={headerPct}
              height={8}
              fill="var(--color-primary-500)"
              track="var(--color-neutral-300)"
            />
          ) : null}
          {/* The count under the bar, RIGHT-ALIGNED to where the bar ends —
              which is what ties it to the bar rather than to the title. The
              percentage above says how far; this says how far out of what, and
              "Completed" underneath names the pair without repeating either
              number. Both figures come from the same category list the gauge
              sums, so they cannot describe different things. */}
          {/* THREE stats on ONE line, dot-separated — 2026-09-16.

              They were three stacked value-over-caption pairs. One line is the
              direct ask, and it also settles what the row IS: a caption sitting
              under its value reads as a small KPI cell, and three of those in a
              row is the block's own KPI grid said twice. Inline, it is a meta
              line — the same object as the "Insurance Pre-Licensing · New York ·
              42 Lessons" line at the top of this band, which is why it takes
              that line's EXACT separator (a 3px round dot on
              `--color-neutral-300`) rather than a second kind of dot a few
              inches away.

              The VALUES take `--font-heading`, not the body face. That is the
              token `dashboard-heading-font` re-points, so the serif follows the
              flag rather than being pinned here — pinning a literal serif would
              make this the one thing on the page that ignores the control.

              Right-aligned, so "Completed" still finishes flush with the bar's
              end (which is what tied it to the bar in the first place), and it
              WRAPS: three pairs plus the cover's indent is the widest thing in
              the band, so at a narrow shell they break rather than squeezing
              the date. */}
          {headerStats.length > 0 ? (
            <div
              style={{
                /* 14, up from 8 (2026-09-17, the direct ask). The row sat tight
                   under the bar and read as the bar's own label; with air it
                   reads as the line of figures the bar summarises. Still less
                   than the 18 of the band's own bottom padding, so the bar and
                   this row stay one group rather than two. */
                marginTop: 14,
                display: 'flex',
                /* NOWRAP on the ROW, wrap inside the CLUSTER. A wrapping flex
                   container prefers to wrap an item over shrinking it, so with
                   `wrap` here the 95px CTA jumped to a second line at the LEFT
                   rather than the pairs giving way — `minWidth: 0` on the
                   cluster had no effect while this said wrap. Held on one line,
                   the cluster shrinks and its own pairs wrap among themselves,
                   which keeps the action on the right edge where it was asked
                   for. */
                flexWrap: 'nowrap',
                alignItems: 'center',
                /* The three pairs sit LEFT, the CTA sits RIGHT (2026-09-17).
                   They were spread across the bar's full width with
                   `space-between`, which put ~40px between each — readable, but
                   it made three related figures look like three separate
                   columns. Grouped at a fixed 30 they read as one line of
                   facts, and the right edge is free for the action.

                   The DOTS are flex siblings of the pairs rather than children
                   of one, so each sits centred in its own 30px gap instead of
                   hugging the pair it was nested in. */
                justifyContent: 'space-between',
                /* A MINIMUM of 10 between the pairs against 6 inside one,
                   below. Two values, or the row reads as six evenly spaced
                   items rather than three pairs — the dot alone cannot carry
                   the grouping, and it is what stops a wrapped line collapsing
                   the distinction.

                   It was 14, and the values going 13 → 15px put the content at
                   689px in a 687px row: it wrapped by TWO PIXELS. `gap` here is
                   only a floor — `space-between` opens the real gaps to ~40px
                   at this width — so lowering it changes nothing on screen
                   except when the row gives up and wraps. Measured after: one
                   line, 34px of slack.

                   Worth knowing the margin is thin either way. A longer date or
                   a five-digit lesson count wraps this again, which is why it
                   is `flex-wrap: wrap` and not `nowrap` — two tidy lines beat
                   an overflowing one. */
                gap: 20,
              }}
            >
              {/* `minWidth: 0` so the CLUSTER gives way, not the row. A flex
                  item's default `min-width: auto` refuses to shrink below its
                  content, so at 750px of pairs against an 813px row the 95px
                  CTA had nowhere to go and dropped to a second line at the LEFT
                  — the one place it must not be. Allowed to shrink, the pairs
                  wrap among themselves and the action keeps the right edge. */}
              {/* 15 HERE AND 15 INSIDE EACH GROUP, which is the 30 that was
                  asked for — split so the dot can live WITH the pair it
                  introduces rather than beside it.

                  As siblings the dots spaced evenly, and then the cluster
                  started wrapping: a line ended on a dangling separator with
                  nothing after it. Bound to the following pair, a dot always
                  wraps with the pair it belongs to, and the two 15s still
                  measure 30 between pairs with the dot centred in the gap.

                  `minWidth: 0` so the CLUSTER gives way, not the row. */}
              {/* STACKED WHEN NARROW, with no dots — and this follows the note
                  above rather than contradicting it. Binding the dot to the
                  pair AFTER it fixed the dangling separator at the end of a
                  wrapped line, and traded it for a LEADING one at the start of
                  the next. At full width that is rare enough to accept; in the
                  left column the row wraps every time, so all three pairs
                  rendered as a bullet list whose first item had no bullet.

                  A column is the honest answer at this width: the dots exist to
                  separate pairs on ONE line, and there is no longer one line for
                  them to separate. */}
              <div
                style={{
                  display: 'flex',
                  /* THE FIGURE SITS TO THE LEFT OF THE PAIRS IN BOTH
                     ARRANGEMENTS — 2026-09-21, the direct ask ("move the 62% to
                     the left of the 27 days and lessons completed
                     components"). This outer row is what makes that true at the
                     NARROW width, where the pairs stack: figure on the left,
                     the two pairs as a column beside it. Stacking the figure on
                     top of them instead — which is what a single flat column
                     did — puts it ABOVE, not left.

                     `center` when narrow so the 32px figure sits against the
                     middle of the two-line column rather than on the first
                     line's baseline; `baseline` when wide, where everything is
                     on one line and the figure's baseline is the row's. */
                  alignItems: narrowHeader ? 'center' : 'baseline',
                  gap: 15,
                  minWidth: 0,
                }}
              >
              {/* THE FIGURE LEADS THE ROW. It is a sibling of the pairs rather
                  than a `headerStats` entry, because a stat entry is a
                  value-over-caption pair at 14px and this is the bar's own
                  headline number at 32 — folding it into the list would either
                  flatten it to a third equal cell or make the list's one shape
                  two.

                  It carries no dot of its own; the pair after it brings one,
                  which is the rule that already stops a wrapped line ending on
                  a dangling separator. */}
              {showHeaderPercent ? headerPercent : null}
              {/* THE PAIRS, in their own container so the figure can sit beside
                  the GROUP of them rather than joining their flow.

                  A RULE BETWEEN THE FIGURE AND THEM, and the inset that comes
                  with it — 2026-09-21, the direct ask ("shift these to the
                  right a little bit and add a light vertical divider line
                  between the percentage and them"). One declaration does both:
                  the border draws the line and the padding is the shift, so the
                  gap after the rule cannot drift from the rule itself.

                  `--color-neutral-300`, which is this surface's established
                  "line you can actually see" — the progress bar's track, the
                  row's own separator dots and the band's dashed divider are all
                  on it. `--color-border-subtle` is the fainter one and is
                  documented here as too faint to carry a line at 1.29:1 light /
                  1.38:1 dark; a rule that vanishes in one theme is the failure
                  this file keeps paying for.

                  IT SPANS THE PAIRS, not the row: in the narrow column that is
                  two lines of text and the rule reads as grouping them against
                  the figure, which is what a divider between two things should
                  do. */}
              <div
                style={{
                  display: 'flex',
                  ...(narrowHeader
                    ? { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }
                    : { flexWrap: 'wrap', alignItems: 'center', gap: 15 }),
                  minWidth: 0,
                  /* The rule and the inset it brings belong to the FIGURE — see
                     `showHeaderPercent`. With nothing on its left there is
                     nothing to divide, and the pairs start at the row's edge. */
                  ...(showHeaderPercent
                    ? {
                        borderLeft: '1px solid var(--color-neutral-300)',
                        paddingLeft: 15,
                      }
                    : null),
                }}
              >
              {headerStats.map((stat, i) => (
                <span
                  key={stat.caption}
                  style={{ display: 'flex', alignItems: 'baseline', gap: 15 }}
                >
                  {/* BACK TO `i > 0` — the RULE now separates the figure from
                      the pairs, so a dot on the first pair would be a second
                      separator doing the same job three pixels away. Dots go
                      between PAIRS; the rule goes between the figure and the
                      group. */}
                  {i > 0 && !narrowHeader && (
                    <span
                      aria-hidden
                      style={{
                        alignSelf: 'center',
                        flexShrink: 0,
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: 'var(--color-neutral-300)',
                      }}
                    />
                  )}
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span
                    style={{
                      /* 14, up from 13 (2026-09-17, the direct ask to make these
                         slightly larger). The CAPTIONS stay at 11, so the step
                         between a value and its label widens rather than the
                         pair just growing.

                         IT WAS 15 FOR A FEW MINUTES AND THAT IS THE NUMBER NOT
                         TO GO BACK TO. At 15 the three pairs need exactly the
                         row's own width — measured 687px needed in a 687px
                         row — so the line wraps or not depending on a pixel,
                         which is the worst of both. 14 leaves ~20px of slack at
                         the same width and still reads larger than 13.

                         The row still wraps rather than overflowing if a longer
                         date or a bigger lesson count ever arrives; this buys
                         headroom, it does not remove the case. */
                      fontFamily: 'var(--font-heading)',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      /* A VALUE NEVER BREAKS MID-PHRASE — 2026-09-21, with the
                         percentage moving into this row. The figure takes ~70px
                         off the left at the narrow width, and the first thing
                         the pairs did with the loss was wrap "27 days" to "27 /
                         days" and "26 of 42 lessons" across three lines: a
                         number severed from its unit, which reads as two facts.
                         The CAPTION may still wrap — it is a label, and
                         "TO COMPLETE / COURSE" loses nothing. */
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 11,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {stat.caption}
                  </span>
                  </span>
                </span>
              ))}
              </div>
              </div>
              {/* VIEW DETAILS — opens the sheet on its PROGRESS half, which is
                  the Course Breakdown: the gauge, the per-category bars and the
                  course lists under them. That half has been reachable on the
                  other versions all along (it is the sheet's Progress tab) and
                  was the one thing QE Focused had no door to, since every
                  trigger here meant "requirements".

                  `.cre-cta-ink`, with NO inline colour: the CTA ramp is a FILL
                  colour on XCEL and cta-500 as TEXT is 1.84:1 on the dark page,
                  so the class swaps to the light stop under
                  `[data-theme='dark']` — and an inline value would beat it
                  while looking right, which is the trap the PSI link hit. */}
              <button
                  type="button"
                  data-cta-id="home.course-details"
                  onClick={() => openDetail('progress')}
                  className="cre-link-action cre-cta-ink"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Details →
                </button>
            </div>
          ) : null}
        </div>
        </div>{/* content column */}
        </div>{/* cover + column stretch row */}
      </div>
    </Wrap>
  )

  /* ── Moved ABOVE the band chain 2026-09-21 ────────────────────────────
     `courseHeaderBand` is a PROP of `LearnerFocusedBand` on the Testing
     version (`headerSlot`), so it has to be declared before the band element
     that consumes it. It previously sat below the chain, which is fine for a
     value only the JSX return reads and a TDZ error the moment a sibling
     const does.

     The block is UNCHANGED, only relocated — its own dependencies
     (`activeCourse`, `activeProgressPath`, `personaRenewal`, `courseHeader`)
     all resolve well above here. */

  // The Learner Focused version's joined top-section card (navy CLP + white
  // Jump Back In). Replaces the Your-Learning row in the stacked layout.
  const learnerFocusedBand = learnerFocused && activeProgressPath && (
    <LearnerFocusedBand
      // QE Focused carries the whole progress SUMMARY on the navy card — the
      // gauge, the four category bars and the three KPI cells — and leaves the
      // section below the per-category course LISTS. Moved here 2026-09-16,
      // reversing an earlier split that stripped the navy side instead.
      categoryGauge={qeFocused}
      // …and drops the navy card entirely: the block sits on the shell's grey.
      surface={qeFocused ? 'page' : 'navy'}
      // The header band owns the course name, meta, art and progress bar while
      // it is on, so the block drops its whole header cluster and starts at the
      // Resume CTA. See `courseHeaderBand`.
      hideHeader={courseHeader}
      // …and swaps Today's Tasks for the Study Journey, which answers "what
      // comes next" rather than "what is due" — the question the Study Plan
      // rail item and the week strip below already answer.
      studyJourney={qeFocused}
      // TESTING ONLY — drop the Readiness half of the square-tile pair and give
      // the whole row to Study Pace. One prop rather than two ("hide readiness"
      // + "widen pace") because they are not separable: a lone square tile in a
      // ~506px column is a 506px box holding two lines, so removing one tile
      // and reshaping the other are the same decision.
      paceOnly={testing}
      // THE ATLAS STUDY JOURNEY TREATMENT — framed card + the post-course steps
      // as four widgets. On BOTH pacing versions as of 2026-09-21, the direct
      // ask ("update testing 2 view to have the newer Atlas Study Journey UI").
      //
      // A SEPARATE PROP FROM `paceOnly`, which is what made this a one-line
      // change: it rode on `paceOnly` while Testing was the only version that
      // wanted it, and Testing 2's whole identity is the square tile PAIR that
      // `paceOnly` removes. See the prop's note on the band.
      journeyCards={testing || testingVersion}
      // The learner's booked exam date, so the Study Pace tile prices against
      // the SAME date the header's Target Exam Date and countdown moved to.
      // Threaded 2026-09-21, when `presets` became the default view's treatment
      // and the tile's silence about the exam stopped being harmless.
      examDate={storedExamDate ?? undefined}
      // Minutes studied per day this week, from the demo persona. Absent at 0%
      // — with nothing studied the pace card states the suggested week instead
      // of reading an empty one back as failure.
      weekMinutes={personaDrivesPath ? persona!.weekMinutes : undefined}
      // TESTING 2 ONLY — the left square tile renders the real derived pace and
      // its Adjust sheet instead of the lo-fi placeholder. A SEPARATE prop from
      // `paceOnly` because the two versions ask different questions of this
      // slot: Testing changes what the tile SHOWS, Testing 2 changes what it
      // lets you DO. Gated by the flag as well, so it can be switched off from
      // inside Testing 2 without leaving the version.
      livePace={testingVersion && studyPaceFlag}
      // …and the course header band moves INSIDE the left column with it. See
      // the prop's own note: narrowing the header and lifting the Study Journey
      // are one change, because the header was the full-width block pushing the
      // grid down.
      headerSlot={testing ? courseHeaderBand : undefined}
      onOpenStop={openJourneyStop}
      // Get Licensed steps open the REQUIREMENTS SHEET — the only surface that
      // describes these three (XCEL's published page covers sitting the exam,
      // applying, and the CE cycle after). The steps XCEL does not own have no
      // per-step destination and inventing one is the Resources-slugs defect;
      // the step that DOES have a real URL (PSI) keeps it and never reaches
      // this callback.
      onOpenStep={(id: string) => setOpenStepId(id)}
      path={activeProgressPath}
      course={activeCourse}
      pathsCount={pathsCount}
      showViewAll={showViewAllPaths}
      onViewAll={openPathsPanel}
      onViewDetails={() => setDetailOpen(true)}
      /*
       * NO `onOpenLearningPath` ON QE FOCUSED — removed 2026-09-16 at
       * Jillienne's request: **XCEL has no learning-path concept.** The band
       * IS the programme; there is no separate path object to open.
       *
       * One prop closes BOTH doors onto it, which is why it is withheld here
       * rather than deleted inside the band:
       *
       *   - `StudyJourneyWidget` passes it through as the rail's `onViewAll`,
       *     so the journey's "Open learning path" link stops rendering.
       *   - The band's TITLE falls back to `onViewDetails`, so it still opens
       *     the requirements sheet. The title stays clickable and loses
       *     nothing — it was carrying a `title="Open learning path"` tooltip
       *     onto the same dead concept, which is the worse half of the two
       *     because an invisible link is found by accident.
       *
       * KEPT for the other versions, which are not XCEL-only surfaces in the
       * same way: Learner Focused and Marketing Focused still hand it through,
       * and the tabbed detail sheet still offers "Go to Learning Path". The
       * `learning-path` section itself is untouched and still resolves from
       * `?section=learning-path`.
       */
      onOpenLearningPath={qeFocused ? undefined : onOpenLearningPath}
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
      // QE Focused puts the whole Progress view in a section below this band,
      // so the band keeps only the lead-in — otherwise the gauge, the category
      // `slimLeft` was removed 2026-09-16 with the decision it served. The
      // summary lives on the navy card now, so the Jump-Back-In-only variant
      // keeps its normal full band rather than being the one QE view with the
      // navy side stripped.
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
    <div
      /* `dashboard-heading-font` — the `serif` variant re-points
         `--font-heading` for this subtree only (see `.cre-dash-serif-headings`
         in tokens.css). A class rather than a style prop threaded through the
         band, the widgets, the section leads and the cards: custom properties
         cascade, so one declaration switches every heading inside, inline
         styles included.

         Scoped to THIS root, so the shell's page title, the left rail and the
         header keep the brand face — the flag is about the page's headings, and
         seeing both faces at once is the comparison a reviewer wants. */
      className={serifHeadings ? 'cre-dash-serif-headings' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 40 }}
    >
      {/* FULL-WIDTH, above the grid — every version but Testing, which hands
          this to the band as `headerSlot` so it sits in the left column and the
          Study Journey can start at the top beside it. Rendered in ONE place or
          the other, never both. */}
      {testing ? null : courseHeaderBand}
      {activeProgressPath && (
        <LearningPathDetailPanel
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          path={activeProgressPath}
          // On QE Focused the CTA that opens this says "View Requirements", and
          // the page behind it already shows every part of the Progress half —
          // the navy card's gauge and stat tiles, the section's course lists. A
          // Progress tab here would be a second door onto what the reviewer was
          // just looking at, which is the pattern that got four testing tiles
          // archived. So: requirements only, no tab bar.
          //
          // Every other version keeps the tabbed sheet, because for them it is
          // the only door to either half.
          view={qeFocused ? detailView : 'tabs'}
        />
      )}
      {/* One step's published detail. `open` is derived from the id rather than
          held as a second boolean, so the two cannot disagree about whether a
          sheet is showing. */}
      <Sheet
        open={Boolean(openStep)}
        onClose={() => setOpenStepId(null)}
        title={openStep?.title ?? ''}
        width={480}
      >
        {openStep ? (
          <GetLicensedStepPanel
            step={openStep}
            state={activeProgressPath?.state}
            onClose={() => setOpenStepId(null)}
          />
        ) : null}
      </Sheet>
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
      {/* REMOVED 2026-09-16 — the Learning Path Progress section.
          It rendered the detail panel's Progress half inline here (the gauge,
          the category bars and the stat tiles first, then the per-category
          course lists). Both halves of it are now elsewhere on this version:

            - The SUMMARY moved up to the Current Learning Progress block.
            - The LISTS are the Study Journey, which walks the same categories
              in curriculum order with each stop's status in words.

          What was left was a second copy of the path title, sub-line, status
          strip and a "Go to Learning Path" button, directly under a block that
          already has all four — which is what it looked like on screen.

          ONE THING WENT WITH IT: the course rows' "View Certificate" link, the
          only place a completed part offered its certificate from Home. The
          Certificates rail item still holds them; if that affordance is wanted
          back, the Study Journey's completed stops are where it belongs, not a
          restored section.

          `LearningPathDetailPanelContent` is unchanged and still renders in the
          Sheet. Its `embedded` and `hideSummary` props existed only for this
          section and were removed with it — see that file. */}
      {/* THE "THIS WEEK" STRIP MOVED TO THE STUDY PLAN PAGE — 2026-09-17, the
          direct ask. It sat here, directly above Recommended for You, as the
          last thing in the learner's own zone before the discovery zone
          started; it is now the last thing on the Study Plan page.
          `StudyWeekSummary`, `dashboard-week-summary` and the
          `hasStudyCalendarFor` guard all moved with it — see
          `StudyPlanSection` in `PlatformShell`. Nothing about the component
          changed. */}

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
  const { access: acctAccess, brand } = useAccount()
  if (!enabled) return null
  /*
   * NO "MEMBER EXCLUSIVE" ON A BRAND THAT SELLS NO MEMBERSHIP — 2026-09-21,
   * the direct ask ("no member upsells for XCEL"). This is the bug the flag
   * audit recorded and left: switching the flag on printed a "Member
   * Exclusive" badge and "all included with membership" for XCEL.
   *
   * THE WHOLE SECTION, not just the badge and the lede. `benefitRowsFor`
   * returns `[]` for every brand but Elite, so on XCEL `BenefitSections`
   * self-hides and what was left was a section header over nothing — which is
   * the "reads as a load failure" defect `dashboard-recommended` states as its
   * own reason for removing the header with the cards.
   *
   * `supportsMembership`, not `isMember`: the question is whether the BRAND
   * sells a membership, not what tier this learner holds. Asking the tier is
   * the root cause this predicate keeps catching — XCEL's only tier is `high`,
   * so `isMember` is true for it and every tier-keyed check passes.
   */
  if (!supportsMembership(brand)) return null
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
  // `membership-summary-style` removed from the catalog 2026-09-16 (XCEL flag audit — `supportsMembership('xcel')` is false, so this never renders for the one brand shipped) —
  // and this band was already off the rebrand overview (it lives on the
  // standalone V7 page). Default was `dark`.
  const variant: string = 'dark'
  const p = KPI_PALETTES.dark

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
