import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDay, CircleCheck, Clock, FileText, Gauge, Monitor, Podcast } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useTheme } from '@/context/ThemeContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import type { CourseCardData } from '@/components/courses/CourseCard'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { statusTreatment, displayedProgressPct, timeRemaining, resolveRenewal, type HomeStatus, CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'
import { myCoursesFor, FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { ProgressDonut, CategoryBars } from '@/components/learning/progressGauge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
import { getCourseImage } from '@/utils/courseImage'
import { DELIVERY_LABEL } from '@/utils/courseDelivery'
import { unitCount } from '@/utils/unitLabel'
import { SquareTile } from './SquareTile'
import { TaskRow } from '@/components/learning/study-calendar/TaskRow'
import { StudyJourneyWidget } from '@/components/learning/StudyJourneyWidget'
import { StatusStrip } from '@/components/learning/LearningPathDetailPanel'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { JumpBackInWidget } from '@/components/learning/JumpBackInWidget'
import { StudyPaceTile } from '@/components/learning/StudyPaceTile'
import { NY_LH_CURRENT_CHAPTER, NY_LH_PROGRAM_PARTS } from '@/data/nyProducerRequirements'
import {
  hasStudyCalendarFor,
  XCEL_CE_PATH_ID,
  STUDY_CALENDAR_TODAY,
  studyCalendarFor,
  supportsStudyPlan,
  tasksOnDate,
  type StudyTask,
} from '@/data/studyCalendarFixtures'
import { useCeStudyPlanEnabled, useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * How many of today's tasks the card shows before deferring to the Study Plan.
 *
 * TWO, and it was three until the rows became the Study Plan's real `TaskRow`.
 * That component is ~112px in this column, not the ~66px the bespoke row it
 * replaced was: the title wraps to two or three lines in a ~250px card, and an
 * in-progress task carries a progress bar. Measured at both a narrow pane and a
 * 1600px viewport — 249px and 234px of list space respectively, so two either
 * way. It is not a narrow-window artifact; the card gets SHORTER as it gets
 * wider, because its height comes from the navy half beside it.
 *
 * Three real rows need ~356px and cannot be bought back from the resume block,
 * which is 179px total against a floor of ~126 (44px CTA + progress + cover).
 * So the count follows the row, and the row is the one the Study Plan uses —
 * matching that was the later decision, and it is the one that wins.
 *
 * The View-all link below is what makes this safe rather than lossy, and it is
 * now genuinely load-bearing: today has exactly two tasks, so any busier day
 * overflows.
 */
const TODAYS_TASKS_VISIBLE = 2

/**
 * LearnerFocusedBand — the "Learner Focused" dashboard version's top section
 * (Figma node 291:12978). One seamless card split into two halves:
 *   - LEFT (deep navy `primary-700`): Current Learning Path — a two-segment
 *     completion gauge + Mandatory / Elective category bars, a 3-up KPI row
 *     (Deadline / Time Remaining / Completed), a full-width Status band, and a
 *     "View Requirements" link.
 *   - RIGHT (**white**): Jump Back In — a poster cover, the resume course's
 *     title + meta + progress, a magenta "Resume course" CTA directly below the
 *     bar, a divider, and an "Up next" list.
 *
 * A joined (gapless) card with a white right half. Every color resolves to a brand token, so
 * the navy/cyan/green relight per `<html data-brand>`. Reuses the shared
 * `progressGauge` module so the gauge + bars read identically to the tracker.
 */
type Props = {
  path: LearningPathSummary
  /** Course to resume (Jump Back In); falls back to the brand's first
   *  in-progress course. */
  course?: CourseCardData
  /** Total learning-path count — drives "View All (N)". */
  pathsCount?: number
  showViewAll?: boolean
  onViewAll?: () => void
  /** Opens the Learning Path detail panel from "View Requirements". */
  onViewDetails?: () => void
  /** Opens the full Learning Path page for this path (in-shell section switch),
   *  from the clickable title. Falls back to `onViewDetails` when unset. */
  onOpenLearningPath?: (pathId: string) => void
  /** Full-bleed hero treatment (`dashboard-hero-bleed`): stretch to the header +
   *  both screen edges, dropping the card radius + shadow. */
  bleed?: boolean
  /** Explicit status (from the `dashboard-progress-state` persona) — drives the
   *  status band instead of re-deriving from the license tracker. */
  statusOverride?: HomeStatus
  /**
   * Render the gauge + bars from the path's N CATEGORIES, not the two-segment
   * Mandatory / Elective pair — and keep the three KPI cells with them.
   *
   * ⚠ THIS OVERRIDES THE BAND'S "two categories only" RULE, deliberately.
   * `hasBreakdown` below restricts the segmented gauge to exactly two
   * categories, on the reasoning that a 3–5-category path shows the overall %
   * here and "the full list in the detail panel" — which is sound while the
   * panel is a click away.
   *
   * On QE Focused it is not: the panel's Progress view renders as a SECTION
   * directly below this band. So the division of labour moved rather than the
   * rule being wrong — the navy card now carries the whole summary (how am I
   * doing: gauge, per-category bars, Target Date / Time Remaining / Completed)
   * and the section below keeps what it is uniquely good at (what exactly is
   * left: the per-category course lists, completion marks, certificates).
   *
   * This replaced a `slimLeft` prop that did the opposite — stripped the gauge
   * and KPIs from the navy half because the section carried them. Same
   * duplication, resolved the other way round: the numbers belong on the navy
   * card, the lists belong in the section.
   *
   * Scoped to this version by a prop rather than applied whenever a path has
   * categories, even though the band and the panel disagreeing for a
   * 4-category path is arguably a bug everywhere. Fixing it on Learner Focused
   * and Marketing Focused changes what those versions ship, which is a separate
   * decision.
   */
  categoryGauge?: boolean
  /**
   * Which surface the Current Learning Progress half sits on.
   *
   * `navy` (default) is the original: a `--color-primary-700` card with a
   * shadow, its own radius, and on-dark type throughout. Every other version
   * keeps it.
   *
   * `page` drops the card entirely — no background, no shadow, no radius — so
   * the content sits directly on the shell's `--color-surface-page` grey, and
   * every colour flips to its light-ground counterpart. For QE Focused
   * (2026-09-16).
   *
   * ⚠ THE TRACKS ARE THE PART THAT BREAKS, not the type. All the text clears AA
   * on the page grey by a wide margin (title 10.43:1, meta 5.27:1, eyebrow
   * 7.0:1, the link 7.56:1). The gauge and bar TRACKS do not: the light default
   * is `--color-neutral-100` at **1.08:1** against `#f5f5f5` and
   * `--color-neutral-200` at 1.29:1 — an empty bar would have no visible track
   * at all, so "0 / 8 hrs" would read as a missing bar rather than an empty
   * one. `page` uses `--color-neutral-300` (1.55:1), which is a groove rather
   * than a line. Every bar's value is also stated in text beside it, so nothing
   * is carried by the track alone.
   */
  surface?: 'navy' | 'page'
  /**
   * Drop this block's whole header cluster — the eyebrow, the course art, the
   * title, the meta line and the progress bar.
   *
   * Set when the page's own course header band is showing
   * (`dashboard-course-header`), which carries every one of those. It started
   * as `hideCover` and grew: dropping only the picture left the NAME, the meta
   * and a second progress bar repeating the band three inches above them. What
   * survives is everything from the Resume CTA down — the KPI cells, the status
   * strip, View Requirements — which the band does not have.
   */
  hideHeader?: boolean
  /**
   * Replace the white half's Today's Tasks block with the STUDY JOURNEY — the
   * curriculum as an ordered sequence rather than a date-paced day view.
   *
   * For the QE Focused dashboard version (2026-09-16). The two answer different
   * questions and the version picks one: a candidate mid-programme asks "what
   * comes next", and Today's Tasks answers "what is due" — which the Study Plan
   * rail item and the week strip below already answer twice.
   *
   * It does NOT replace the resume block above it. "Continue where you left
   * off" is still the first thing the card should offer; the journey is what
   * fills the space under it.
   */
  studyJourney?: boolean
  /**
   * Render the LIVE Study Pace tile instead of its lo-fi placeholder.
   *
   * The "Testing 2" dashboard version only — QE Focused is XCEL's default and
   * keeps the stub, so the thing most people open stays the reviewed one. See
   * `DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2`, which records why this is a
   * version rather than a flag on QE Focused: two tabs, side by side.
   *
   * The Readiness tile beside it stays lo-fi in BOTH. That is deliberate and
   * not an oversight — the pace model is derived from facts the product has,
   * and there is still no readiness model to derive anything from.
   */
  livePace?: boolean
  /**
   * Drop the READINESS tile and give the whole row to Study Pace, which stops
   * being square.
   *
   * For the TESTING dashboard version (2026-09-21), whose entire subject is the
   * pacing treatment — see `DISCOVERABILITY_DASHBOARD_VERSION_TESTING`.
   *
   * ONE prop rather than two, because the two halves are not separable. The
   * pair's `aspectRatio: 1 / 1` is a property of there being TWO of them: alone
   * in this column a square tile is a ~506px box holding two lines of text. So
   * "hide Readiness" and "reshape Study Pace" are the same decision, and
   * splitting them would let a caller choose the one arrangement that is wrong.
   *
   * WHAT IS LOST, and it is nothing: the Readiness tile has been a deliberate
   * lo-fi stub since 2026-09-17 ("Not designed yet"), and its DESTINATION —
   * the real `ReadinessPanel` — is a rail item away and untouched. The
   * placeholder is the tile, not the section.
   */
  paceOnly?: boolean
  /**
   * The ATLAS STUDY JOURNEY treatment: the journey drawn as a framed white card,
   * and the post-course steps split out as one widget each (`framed` +
   * `splitSteps` on `StudyJourneyWidget`).
   *
   * SPLIT OFF `paceOnly` on 2026-09-21, which is the rename that prop's own
   * note asked for in advance ("Rename both if a version ever wants one without
   * the other"). Testing 2 is that version: it wants this journey and it keeps
   * the square tile PAIR, which is exactly what `paceOnly` denies. Left on
   * `paceOnly` the only way to give Testing 2 this journey would have been to
   * give it Testing's tile row too, silently changing the one thing that makes
   * the two versions a pair worth comparing.
   *
   * TWO PROPS, not one, even though both versions now set both: they are
   * different editorial decisions — what the square row shows, and how the
   * journey column is built — and a third version wanting one without the other
   * is precisely what just happened.
   */
  journeyCards?: boolean
  /**
   * ISO yyyy-mm-dd — the learner's BOOKED exam date (`examDateStore`), entered
   * on the Schedule State Exam card. Passed straight through to the Study Pace
   * tile, which prices against whichever ceiling binds.
   *
   * It reaches this component as a RAW ISO string rather than as
   * `personaRenewal`'s formatted pair, because the pace model measures with it
   * and `examDateRenewal` returns a display deadline plus a week count — two
   * shapes of one fact, and the tile needs the one that can be compared to a
   * course's expiry.
   */
  examDate?: string
  /**
   * Minutes studied per day this week, Monday-first — the demo persona's, so
   * the progress picker moves the pace card's week strip.
   *
   * Absent means "nothing to read", not "a week of zeros": the card shows its
   * suggested week instead. A learner at 0% has not had a bad week, they have
   * not had a week.
   */
  weekMinutes?: number[]
  /**
   * The page's course header band, rendered INSIDE this block's left column
   * instead of full-width above the whole grid.
   *
   * For the TESTING version (2026-09-21, the direct ask: "shift [the Study
   * Journey] up so it's directly under the header, then reduce the width of the
   * course progress section to align with the other components").
   *
   * THE TWO HALVES OF THAT ASK ARE ONE CHANGE, which is why it is a slot rather
   * than a width override plus a reorder. The header was a full-width sibling
   * ABOVE the grid, so it pushed the whole grid — the Study Journey included —
   * down past it. Moving it into the left column narrows it to that column AND
   * frees the right column to start at the top, because the grid now begins
   * where the header used to. Setting a `max-width` on it instead would have
   * narrowed the header and left the journey exactly where it was.
   *
   * A SLOT rather than building the header here: it is `MembershipOverview`'s,
   * it reads that component's own resolvers, and re-deriving it would be the
   * second owner of "the course to show" that `displayedProgressPct` was
   * extracted to close.
   *
   * `hideHeader` is still set alongside it — the block's own header cluster
   * stays empty, because this band is what carries the name and the bar.
   */
  headerSlot?: ReactNode  /** Open one Study Journey stop (a course id). Omitted → the rows render as
   *  plain text, which is what the dev-handoff preview wants. */
  onOpenStop?: (id: string) => void
  /** Open a Get Licensed step — the requirements sheet. */
  onOpenStep?: (id: string) => void
  /** Demo renewal override (persona): the Deadline + Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Renewal-ready treatment (100% complete): the green completed celebration. */
  renewalReady?: boolean
  /** Interest / modality chips shown on the CLP after the setup wizard completes. */
  interestChips?: string[]
  /** Opens the Course Catalog (completed state's Browse Catalog CTA). */
  /** ⚠ ACCEPTED AND IGNORED since 2026-09-21. Both of these fed the completed
   *  celebration this band used to return early into; the ask replaced that
   *  with the normal band. They stay on the type so every caller compiles
   *  unchanged and so restoring the branch is a one-file change — see the
   *  ARCHIVED_ITEMS row. */
  onBrowseCatalog?: () => void
  /** Opens the Certificates page (completed state's secondary "View Certificate"). */
  onViewCertificate?: () => void
}

// Full-bleed hero: cancel the shell's 24px top + 40px left gutters and cross the
// empty right filler beyond the 1440px content cap so the band runs
// header-to-edge like a hero (matches DashboardRecommendedBand's bleed math).
const HERO_BLEED: CSSProperties = {
  marginTop: -24,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
  borderRadius: 0,
  boxShadow: 'none',
}

// On-navy text — always-white (theme-independent; the left half is a brand-navy
// fill that doesn't invert, so white reads in both themes).
const ON_DARK = 'rgb(255 255 255 / 1)'
const ON_DARK_MUTED = 'rgb(255 255 255 / 0.66)'
const ON_DARK_LINE = 'rgb(255 255 255 / 0.12)'
const ACCENT = 'var(--color-secondary-300)' // cyan eyebrow / KPI accents

const eyebrowBase: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

export function LearnerFocusedBand({
  categoryGauge = false,
  surface = 'navy',
  hideHeader = false,
  studyJourney = false,
  livePace = false,
  paceOnly = false,
  journeyCards = false,
  examDate,
  weekMinutes,
  headerSlot,  onOpenStop,
  onOpenStep,
  path,
  course,
  pathsCount,
  showViewAll = false,
  onViewAll,
  onViewDetails,
  onOpenLearningPath,
  bleed = false,
  statusOverride,
  renewal,
  renewalReady = false,
  interestChips,
}: Props) {
  const { brand } = useAccount()
  const launcher = useCourseLauncher()
  // Mobile (390px device frame): stack the two halves vertically — navy
  // Current Learning Path above the white Jump Back In — instead of the
  // side-by-side split, which can't fit phone width (Dash_Mobile.pdf).
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  // Stack the two halves on any narrow frame (phone OR tablet); `mobile` alone
  // still drives the full-bleed edge treatment + header tweaks below.
  const stack = mobile || device === 'tablet'

  const resume = course ?? myCoursesFor(brand).find((c) => c.myStatus === 'in-progress')
  const upNext = myCoursesFor(brand)
    .filter((c) => c.myStatus === 'not-started')
    .slice(0, 2)

  /*
   * Card layout — `clp-jump-back-in`. "Up Next" is the shipped card; "Today's
   * Tasks" compresses the resume block and fills the rest from the STUDY PLAN.
   *
   * The variant falls back when the brand has no study plan. Picking it there
   * would render a heading over nothing — and it is pickable, because the flag
   * panel is brand-agnostic. `supportsStudyPlan` is the same one predicate the
   * rail item and the old tab read.
   */
  const jbiVariant = useFeatureFlag('clp-jump-back-in').variant ?? 'up-next'
  /*
   * THE PATH MUST ACTUALLY HAVE A PLAN, not just the brand.
   *
   * `studyCalendarFor` falls back to STC's Series 79 plan for any id it does
   * not know — its own docstring calls putting securities tasks under an
   * insurance path "the one outcome worse than the empty state". The band shows
   * whichever path is current, and XCEL's CE path deliberately has NO plan (a
   * renewal cycle with a variable deadline is not a countdown to a booked
   * exam), so on the default Continuing Ed view this read exactly that
   * fallback: "Complete Greenlight 1", a securities task, under Florida Life &
   * Health CE. Caught by looking at it; nothing failed.
   *
   * `hasStudyCalendarFor` is the same guard `InlineStudyCalendar` uses. With no
   * plan the card falls back to the shipped Up Next rather than showing a
   * heading over an empty list — switch Education to Pre-Licensing to see the
   * variant, which is where a learner has a plan at all.
   */
  // The CE path's plan is behind `ce-study-plan` (default ON). Off, CE falls
  // back to the empty branch it used to take — and therefore to Up Next here.
  const ceStudyPlan = useCeStudyPlanEnabled()
  const ceSuppressed = !ceStudyPlan && path.id === XCEL_CE_PATH_ID
  const pathHasPlan =
    supportsStudyPlan(brand) && hasStudyCalendarFor(brand, path.id) && !ceSuppressed
  // The Study Journey takes the lower half when asked for, and it needs no
  // plan — it is built from the path's CATEGORIES, so it works on a path with
  // no calendar at all (which is what makes it viable for the CE path too, if
  // that is ever wanted). Today's Tasks still needs one, hence the two gates.
  const journeyLayout = studyJourney
  // The journey renders as its OWN CARD rather than inside the shared white
  // half, so the split and the swap are one condition. `resume` has to exist
  // for the widget's resume block; without a course it still renders, opening
  // straight on the journey.
  const journeyWidget = journeyLayout
  const todaysTasksLayout = !journeyLayout && jbiVariant === 'todays-tasks' && pathHasPlan
  const todaysTasks: StudyTask[] = todaysTasksLayout
    ? tasksOnDate(studyCalendarFor(path.id), STUDY_CALENDAR_TODAY)
    : []
  const visibleTasks = todaysTasks.slice(0, TODAYS_TASKS_VISIBLE)

  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  // Resolve to the generalized category list (an explicit `categories` array,
  // else the Mandatory/Elective pair) and take the totals FROM IT, so a path
  // with more than two categories computes the right overall %.
  //
  // This band used to sum `mandatory` + `elective` directly and set
  // `hasBreakdown` from that pair, which meant it IGNORED `categories`
  // entirely: a 3–5-category qualifying-education path rendered two bars
  // labelled Mandatory/Elective instead of the overall bar. `ClpJumpBackInBand`
  // has always done this correctly — the two are now consistent. It went
  // unnoticed because the multi-category demo persona only ever ran on the
  // Marketing Focused layout, which was every brand's default until XCEL.
  const cats = resolvePathCategories(path)
  const totalRequired = cats.reduce((sum, c) => sum + c.required, 0)
  const totalCompleted = cats.reduce((sum, c) => sum + c.completed, 0)
  // The band's own percentage, now shared — the Readiness page shows the same
  // figure and reading `path.progressPct` there put the two a point apart.
  const percent = displayedProgressPct(path)
  // Dashboard breakdown rule: the segmented gauge + bars render ONLY for
  // exactly two categories; more than two show the overall % here and the full
  // list in the detail panel.
  /*
   * Surface-resolved colours. One place, so a light-ground variant is a set of
   * swaps rather than a second copy of the markup — the fork this file has
   * already been pulled back from twice.
   *
   * `cAccent` is the KPI/gauge accent. On navy that is the light amber
   * `--color-secondary-300`; on the page it becomes plain `--color-text-primary`
   * rather than a light accent, because the amber measures 2.08:1 on #f5f5f5
   * and an accent that has to be squinted at is worse than no accent.
   */
  const onPage = surface === 'page'
  /*
   * IS MY GROUND DARK? — not "is the surface the navy card".
   *
   * The navy card is dark in BOTH themes, so it always wants the on-dark
   * treatment. The page is not: `--color-surface-page` is #f5f5f5 in light and
   * #1b1d21 in dark. Every token-based colour below flips on its own, but
   * `onDark` is a boolean computed here — so without reading the theme, the
   * page surface would hand the LIGHT category palette to a dark ground and
   * reintroduce the exact 1.11:1 slot-0 failure the on-dark palette exists to
   * fix, just in the other theme.
   */
  // The hook is called UNCONDITIONALLY. It was `!onPage || useTheme().theme ===
  // 'dark'`, which short-circuits — so on the navy card `useTheme` never ran,
  // and a component whose `surface` changed between renders would change its
  // hook order. eslint's `rules-of-hooks` caught it; nothing at runtime would
  // have until the order actually shifted.
  const themeIsDark = useTheme().theme === 'dark'
  const darkGround = !onPage || themeIsDark
  const cText = onPage ? 'var(--color-text-primary)' : ON_DARK
  const cMuted = onPage ? 'var(--color-text-secondary)' : ON_DARK_MUTED
  const cLine = onPage ? 'var(--color-border-subtle)' : ON_DARK_LINE
  const cEyebrow = onPage ? 'var(--color-accent-text)' : ACCENT
  const cAccent = onPage ? 'var(--color-text-primary)' : ACCENT
  // Tiles and the status box sit ONE STEP ABOVE the page rather than below it —
  // the inverse of the navy card's translucent-white fills. `--ux-bg`'s note in
  // the Links panel is the same idea from the other direction.
  const cTileBg = onPage ? 'var(--color-surface-card)' : 'rgb(255 255 255 / 0.06)'
  // Navy-only. On the page surface the colour comes from `.cre-cta-ink`
  // (theme-aware), and passing an inline colour would beat the class.
  const cLink = ON_DARK
  // See the `surface` prop note — the light default track is invisible here.
  const cTrack = onPage ? 'var(--color-neutral-300)' : 'rgb(255 255 255 / 0.12)'
  /*
   * RULES THAT HAVE TO BE SEEN, as distinct from `cLine`.
   *
   * `cLine` is `--color-border-subtle` and does the job of a boundary — the
   * meta line's 11px ticks, a card's edge. The KPI dividers are the only thing
   * separating three data points from each other, so they are doing work, and
   * border-subtle measures 1.29:1 on the page grey (1.38:1 dark).
   * `--color-neutral-300` is 1.55:1 / 1.81:1 — the same value this surface
   * already uses for the bar track, so the block has ONE "line you can see on
   * the page" rather than two near-identical greys.
   *
   * `--color-neutral-400` reads better still (1.9 / 2.47) and was rejected: at
   * full cell height it draws more attention than the numbers it separates.
   */
  const cRule = onPage ? 'var(--color-neutral-300)' : cLine

  // `categoryGauge` lifts the two-category restriction — see its prop note.
  const hasBreakdown = categoryGauge
    ? cats.length > 0 && cats.some((c) => c.required > 0)
    : cats.length === 2 && cats.every((c) => c.required > 0)

  /* One resolver, shared with the course header band above — its stat row
     prints both of these figures and the KPI cells below print them again, so
     they sit inches apart on one screen and must not be derived twice. */
  const { deadline, weeksLeft } = resolveRenewal(renewal)

  // Explicit persona status wins; else derive from progress + weeks left.
  // The resume course's art, for the header cover. Same course the Resume CTA
  // launches — one picture, one button, one course.
  const resumeCover = resume && !hideHeader ? (resume.imageUrl ?? getCourseImage(resume.id)) : null
  /*
   * Bars render only when there is more than one thing to compare. With a
   * single category the bar restates the donut's percentage AND the "Completed"
   * KPI cell — three sayings of one number within three inches.
   *
   * A COUNT, not a version check: any path that ends up with one category gets
   * the same treatment, and a path with a real breakdown keeps its bars on
   * every version.
   */
  const showBars = hasBreakdown && (categoryGauge ? cats.length > 1 : true)
  /*
   * A HORIZONTAL BAR IN THE HEADER instead of the donut (2026-09-16).
   *
   * Tied to `showBars` being false, i.e. to there being ONE measured thing.
   * With a real multi-category breakdown the donut still earns its row — it
   * shows the segments, which a single bar cannot — so the two swap together
   * rather than the bar being a version check. On this version that means: one
   * category, no category bars, no donut, one bar under the meta line.
   */
  const barInHeader = !showBars && hasBreakdown
  /*
   * BLOCK TREATMENT — `dashboard-clp-style`, variant-only (2026-09-16).
   *
   * Three ways to dress the SAME cluster. Every variant reads the same data and
   * none of them invents lesson-level content the storefront does not publish
   * (the reference mock shows "Lesson 27 — Life insurance policy provisions ·
   * 14 minutes left"; there is no lesson title and no per-lesson timing in the
   * fixtures, and authoring one is the rule this version has been holding all
   * along).
   *
   *   - `default`    — the light block: bar under the meta, percentage beside.
   *   - `big-number` — same ground, percentage promoted to its own right-hand
   *                    column with the bar and the lesson count beneath it.
   *   - `navy`       — that same cluster on a dark card, light type, green bar,
   *                    white CTA. The KPI cells, status strip and View
   *                    Requirements stay on the page grey below.
   *
   * Only meaningful on the page surface: on the navy versions the block IS a
   * navy card already, so the variants would be dressing a dress.
   */
  const clpStyle = useFeatureFlag('dashboard-clp-style').variant ?? 'default'
  /*
   * STATS TREATMENT — settled 2026-09-22. `dashboard-clp-stats` offered a
   * second axis beside the block style: `stat-card` gathered the three KPI
   * cells and the status onto one white card, with a sub-label under each cell
   * and Completed as a two-tone fraction. `default` — three bare cells split by
   * vertical rules — won, and the flag was retired. See `archivedItems.ts`, row
   * `clp-stats-stat-card`.
   */
  /*
   * PACING TREATMENT — no longer a flag. `dashboard-pacing-style` offered five
   * answers on the Testing arrangement; `presets` won on 2026-09-22 and the
   * other three explorations (`rate`, `runway`, `balance`) were unwired. See
   * the `pacing-treatment-exploration` row in `archivedItems.ts` for what they
   * were and how to bring one back.
   *
   * `lo-fi` is NOT one of the retired three and must stay: it is what every
   * NON-Testing version renders here, where the tile is still half of the
   * square pair. The `paceOnly` branch is the whole remaining choice.
   */
  const pacingStyle = paceOnly ? 'presets' : 'lo-fi'
  /*
   * TWO SQUARE TILES replace the KPI row + status strip — 2026-09-16, the
   * direct ask: "turn this into 2 square tiles, 1 about the Study Pace … 2nd
   * one will be about Readiness."
   *
   * SCOPED to the page surface, and NOT to the `stat-card` variant. The navy
   * card keeps its three tiled cells for the reason that split already
   * records — bare cells there would lose the translucent fills that make them
   * read as cells at all — and `dashboard-clp-stats: stat-card` is itself a
   * treatment OF those three cells plus the status, so replacing them would
   * leave that variant with nothing to style.
   *
   * WHAT THIS DROPS, and it is worth knowing rather than discovering: Target
   * Date, Time Remaining and Completed were those three cells. They are stated
   * once already in the COURSE HEADER BAND's stat row — but that band is behind
   * `dashboard-course-header`, whose default is `none`. So at the committed
   * default the three facts are no longer anywhere on Home. Making `band` the
   * default is the fix if that is wrong; folding them into the pace tile is
   * not, because it would be a third saying of one set of numbers the last two
   * changes moved into the header on purpose.
   */
  /* ⚠ AND NOT COMPLETE. With the pace tile hidden at 100% (see its own note),
     the PAIR still has Readiness to show and keeps the row — but on the
     `paceOnly` arrangement Readiness is already dropped, so the row would
     render as an empty 18px gap above the Jump Back In card. Both halves gone
     means no row. */
  const paceTiles = onPage && !(renewalReady && paceOnly)
  const clpBigNumber = onPage && barInHeader && clpStyle === 'big-number'
  const clpNavy = onPage && barInHeader && clpStyle === 'navy'
  // Ink for the navy card. The page values are near-black and would vanish on
  // it — the "put a LIGHT stop on a dark ground" rule this repo keeps paying
  // for. Measured on `--color-primary-700`: title 12.6:1, meta 6.9:1, eyebrow
  // 6.9:1, the green fill 6.4:1 against its track.
  const nText = clpNavy ? 'var(--color-text-inverse)' : cText
  const nMuted = clpNavy ? 'rgb(255 255 255 / 0.72)' : cMuted
  const nEyebrow = clpNavy ? 'rgb(255 255 255 / 0.72)' : cEyebrow
  const nBarFill = clpNavy ? 'var(--color-success-500)' : cAccent
  const nBarTrack = clpNavy ? 'rgb(255 255 255 / 0.22)' : cTrack
  const nLine = clpNavy ? 'rgb(255 255 255 / 0.28)' : cLine
  /*
   * RESUME, INLINE — the block absorbs Jump Back In (2026-09-16).
   *
   * It sat below as its own card, repeating this block's course: same title,
   * same art, its own progress bar. With the category bar gone there is a half
   * of this row free, and the resume action belongs beside the progress it acts
   * on — "you are 62% through, carry on" is one statement, not two cards.
   *
   * The CTA placement was the open question. Two alternatives, both rejected
   * and both one edit away:
   *   - **In the header row, opposite the title.** Reads as a page action
   *     rather than as the next step in this course, and it puts the primary
   *     button above the number that motivates it.
   *   - **At the bottom beside "View Requirements".** Puts a filled primary
   *     button next to a text link, which makes the link look disabled, and it
   *     is below the fold on a narrow shell.
   * Here it sits at the eye's second stop, right of the donut.
   *
   * Page surface only: on the navy card the white half still renders the full
   * resume block, and two resume blocks in one band is the duplication this is
   * removing.
   */
  /*
   * JUMP BACK IN, restored as a WIDGET — 2026-09-17, the direct ask.
   *
   * This slot held a bare "Resume course" button. Before that it was the
   * archived `JumpBackInWidget` (cover, title, meta, progress bar, CTA), which
   * was folded into the block on 2026-09-16 because everything on it — the same
   * course, the same art, the same percentage — was already in the block above.
   *
   * WHAT MAKES IT EARN THE CARD BACK is that it now says something nothing else
   * on the page does: WHICH CHAPTER the learner is in. The art, the title and
   * the percentage stay where they are, in the header band; the card carries a
   * glyph, the chapter, and the action.
   *
   * THE NUMBER IS DERIVED, THE TITLE IS SOURCED, AND THE TWO DO NOT SHARE A
   * NUMBERING SYSTEM — see `NY_LH_CURRENT_CHAPTER`. 27 is the next lesson
   * (26 of 42 complete); the title is the fifth of the twelve chapters
   * recovered from XCEL's own linked study guide. Nothing published maps one to
   * the other, so pairing them is the demo's choice rather than a fact.
   *
   * Still NOT invented: per-lesson timing. The reference reads "· 14 minutes
   * left" and nothing knows how long a lesson takes; a test forbids it.
   */
  const resumeInline =
    onPage && resume && !clpNavy ? (
      <JumpBackInWidget
        course={resume}
        /* ALWAYS THE NEXT LESSON, including the first — 2026-09-21, the direct
           ask to show the lesson line at 0%. The guard hid it when nothing was
           complete, which was the one state where naming the lesson is most
           useful: "Lesson 1 · Part 1 of 3" tells a learner where they are about
           to start. The arithmetic was already right at zero — completed + 1 is
           1 — so the guard was suppressing a correct number, not avoiding a
           wrong one. */
        /* …and NOT at all once complete: the card drops the lesson line with
           the title and the estimate. Passed anyway rather than conditioned
           here, because which of the card's three states applies is the card's
           question, not the band's. */
        chapterNumber={totalCompleted + 1}
        complete={renewalReady}
        /* WHICH PART, derived from the ordered category list rather than typed:
           the categories ARE the 3-Part Training Program in curriculum order,
           and the learner is in the first one they have not finished. Clamped
           to the published count, because the list also carries the attestation
           stop that sits outside the programme — without the clamp a learner
           past part three would read "Part 4 of 3". */
        partNumber={Math.min(
          NY_LH_PROGRAM_PARTS,
          Math.max(1, cats.findIndex((c) => c.completed < c.required) + 1 || cats.length),
        )}
        chapterTitle={NY_LH_CURRENT_CHAPTER}
        onResume={(id) => launcher.open(id)}
      />
    ) : null
  // Shared with the Learning Path detail sheet's "Time Remaining", so the band
  // and the sheet that opens from it cannot disagree about the same number.
  const timeRemain = timeRemaining(weeksLeft)
  const derivedStatus: HomeStatus = percent >= 50 || weeksLeft > 16 ? 'on-track' : weeksLeft >= 6 ? 'at-risk' : 'off-track'
  const homeStatus: HomeStatus = statusOverride ?? derivedStatus
  // Shared on-dark treatment (the navy band) — the same source the badge +
  // Details panel use, so all six states render correctly (previously
  // not-started/expired fell back to green) and the message is the shared
  // generic copy (no path title — the card header already carries it).
  const status = statusTreatment(homeStatus, 'compliance', { onDark: true })
  // The LIGHT tone of the same treatment, for the page surface. Resolved here
  // beside its on-dark twin so the two can never describe different states.
  const pageStatus = statusTreatment(homeStatus, 'compliance')

  // The unit rides on the PATH (`unitLabel`), so a path measured in days of a
  // study plan and one measured in credit hours both read correctly without
  // this component knowing which is which. "hrs" when unset — every path but
  // the QE one.
  const unit = path.unitLabel ?? 'hrs'
  const unitLong = unit === 'hrs' ? 'Hours' : unit.charAt(0).toUpperCase() + unit.slice(1)
  const meta = [path.category, ...(path.state ? [path.state] : []), `${path.hours} ${unitLong}`]
  /* The status pill and its message. IDENTICAL in every pacing treatment and
     therefore defined once — the comparison is meant to be about the pacing
     figure, and four hand-copied status clusters is how one of them ends up a
     weight or a gap different and makes its treatment look better than it is.

     `StatusStrip`'s tint is deliberately not reused: it measures ~1.02:1 (a hue
     shift, i.e. decoration) and a tinted band inside a tile reads as a second
     card, which is the same call `bare` makes on the stat card. The PILL keeps
     its fill, so the state is carried in colour AND in words.

     `marginTop: 'auto'` puts it on the tile's floor whatever the treatment
     above it does — the tiles are fixed-height squares in the paired
     arrangement, and this is what stops a two-line treatment and a four-line
     one placing their status at different heights. */
  const pacingStatus = (
    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span
        style={{
          alignSelf: 'flex-start',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          color: pageStatus.text,
          background: pageStatus.outline ? 'transparent' : pageStatus.fill,
          boxShadow: pageStatus.outline ? `inset 0 0 0 1px ${pageStatus.border}` : undefined,
          padding: '3px 10px',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        {pageStatus.icon && <pageStatus.icon size={12} aria-hidden />}
        {pageStatus.label}
      </span>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          lineHeight: '17px',
          color: 'var(--color-text-secondary)',
        }}
      >
        {status.message}
      </p>
    </div>
  )

  /* ONE treatment, as of 2026-09-22. This used to introduce four — each a
     WHOLE answer to "am I pacing to finish in time" rather than a restyle of
     one answer: `rate` prescribed TIME (hours a day), `runway` prescribed WORK
     (units a week) and showed the shape of what was left, `balance` prescribed
     nothing and stated the two remaining figures. `presets` won on 2026-09-22
     and the other three were unwired — `archivedItems.ts`, row
     `pacing-treatment-exploration`, carries what each argued and how to restore
     one.

     Every figure any of them stated was DERIVED from what the fixtures already
     carry — the path's unit totals, the days to the target date, and the resume
     course's own credit hours. Nothing here knows an OBSERVED rate, a schedule
     to be ahead of, or a projected finish date, so no treatment stated one.
     That is the same line the `stat-card` sub-labels hold ("You are currently
     pacing 4 days ahead of schedule" was in the reference mock and is not in
     the app). */
  const pacingBody =
    pacingStyle === 'presets' ? (
      /* PRESETS RENDERS THE WHOLE TILE, not a body — so this arm is
         unreachable, and it is kept so the chain still names the treatment
         rather than looking like presets has no case here at all.
         `paceTileEl` below is where it is actually built.

         WHY IT COULD NOT LIVE HERE. Everything in this chain renders INSIDE the
         `SquareTile` a few lines down. The presets card owns its own eyebrow —
         "Study Pace · recommended", switching to "· yours" the moment the
         learner adjusts anything — and that suffix is driven by state held in
         `StudyPaceTile` (`choices`). Rendering the card in this slot would
         either nest a tile inside a tile (two cards, two eyebrows, two floors)
         or force `choices` to be lifted into this component, duplicating the
         state Testing 2's tile already owns and giving the two shapes two
         different ideas of what "adjusted" means.

         IT ALSO DROPS `pacingStatus`:

           - TWO PILLS IN TWO VOCABULARIES. `pacingStatus` is the six COMPLIANCE
             states ("On Track"); the card's own pill is the pace axis
             (Recommended / Relaxed / heavy). `PaceChip`'s note already records
             why those two must not share a badge — a learner reading "At Risk"
             off a statement that is only saying their evenings are long. Nine
             pixels apart is the same collision with a gap in it.
           - THIS CARD ANSWERS THE STATUS QUESTION IN ITS BODY. It states the
             OUTCOME — "finishes by Apr 29, 5 days before access ends on May 4"
             — which is the derivation "On Track" is a label for. Keeping both
             would print the conclusion twice, once derived and once asserted.
           - `pacingStatus` IS `marginTop: 'auto'`, so it lands on the tile's
             floor. On this card the floor is the two buttons, and the tile would
             end on a pill and a sentence BELOW its own primary call to action. */
      null
    ) : (
      /* LO-FI — what every non-Testing version renders. Two rows rather than
         the Readiness tile's three because this tile also carries the status
         pill and its message, so it has less room to fill. */
      <LoFiWidgetBody rows={2} ariaLabel="Study pace — placeholder" />
    )

  /** The percentage, as its own column. Shared by `big-number` and `navy`. */
  const percentColumn = (
    /* 160, not 200. At 200 the title column was left ~140px and "New York Life
       and Health Pre-licensing" wrapped to five lines — the number won an
       argument it should not have been in. */
    <div style={{ flex: 'none', width: 160, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 2 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 40, lineHeight: 1, color: nText }}>
          {percent}
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, lineHeight: 1, color: nText }}>%</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <ProgressBar pct={percent} height={8} fill={nBarFill} track={nBarTrack} />
      </div>
      {/* The count in WORDS under the bar, as the reference does. It is the
          same pair the KPI cell states as "26 / 42 lessons" — kept because in
          this treatment the big figure is the only other number, and a bare
          percentage does not say what it is a percentage OF. */}
      <p style={{ margin: '6px 0 0', textAlign: 'right', fontFamily: 'var(--font-body)', fontSize: 12, color: nMuted }}>
        {totalCompleted} of {totalRequired || path.hours} {unit} complete
      </p>
    </div>
  )
  const resumePct = typeof resume?.progress === 'number' ? resume.progress : 0

  // Meta line (category · state · hours). On desktop it sits under the title
  // inside the header cluster; on mobile it moves to its own full-width line
  // below the title+View-All row so it has room to stay on ONE line (sharing
  // the narrow header width forced it to wrap). `nowrap` on mobile guarantees it.
  const metaRow = (
    <div
      style={{
        display: 'flex',
        flexWrap: mobile ? 'nowrap' : 'wrap',
        alignItems: 'center',
        gap: 8,
        marginTop: 7,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        // Surface-resolved, NOT `ON_DARK_MUTED`. This row is assembled ABOVE the
        // navy half's markup, so the `surface='page'` colour swaps — which were
        // applied across that markup — missed it: the meta line rendered white
        // at 66% on the page grey, roughly 1.2:1, and read as a line that had
        // failed to load. tsc was clean and every test passed; it took reading
        // the element's computed style to see it.
        //
        // AND IT HAPPENED AGAIN, the other way round, when `clpNavy` landed
        // (2026-09-16): this row kept the PAGE's `--color-text-secondary` on the
        // navy card and measured **2.13:1**. Same seam, opposite direction —
        // which is the argument for `nMuted` existing at all rather than each
        // block picking its own ink. If a third treatment lands, it resolves
        // here too.
        color: nMuted,
      }}
    >
      {meta.map((m, i) => (
        <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {/* The divider follows the ink for the same reason. `--color-neutral-300`
              is 8.68:1 on the navy — a hairline separator brighter than the text
              it separates. */}
          {i > 0 && <span aria-hidden style={{ width: 1, height: 11, background: nLine }} />}
          {m}
        </span>
      ))}
    </div>
  )

  /* ── THE COMPLETED CELEBRATION IS UNWIRED ── 2026-09-21, the direct ask.
     At 100% this band used to RETURN EARLY into a green "You're all caught up"
     card, which is why the course art, the Study Journey, the Jump Back In card
     and the pace tile all vanished at 100% — none of them rendered. The ask was
     for the normal band in a completed state ("the course image should not
     disappear"), so the early return is gone and the band below runs at every
     progress level.

     UNWIRED, NOT DELETED, per the archive convention: `CompletedCelebration`
     and its `CompletedStat` type are untouched in their own file and still have
     callers (`ClpJumpBackInBand`, `MarketingFocusedBand`). What was removed
     here is the ~60-line branch that built this band's own stat list and
     returned that component instead of the band. See the ARCHIVED_ITEMS row —
     bringing it back is re-adding one `if (renewalReady)` block, not rebuilding
     a component.

     `renewalReady` IS STILL A PROP and still means what it meant. It now feeds
     the completed treatments INSIDE the band (the Review Course card, the
     hidden pace tile) rather than replacing it. */

  return (
    <section
      aria-label="Your learning"
      className="cre-learner-focused-band"
      style={{
        display: 'grid',
        /*
         * 660 : 380 since 2026-09-16, from 514 : 407.
         *
         * The two columns were near-even because they were once two halves of
         * one band. They are not any more: the LEFT one carries the course art,
         * the title, the meta, the progress bar, the Resume CTA, three KPI
         * cells and a status strip, and at ~490px the title wrapped to two
         * lines and the KPI row was tight. The right one is a list of short
         * rows and gives width up cheaply.
         *
         * NOTE there are TWO `gridTemplateColumns` in this file. The other one
         * belongs to the completed-celebration branch above, which renders a
         * different thing entirely — it was edited by mistake first, and the
         * symptom was the left column getting NARROWER, because the live grid
         * had not moved at all.
         *
         * `minmax(0, …fr)` rather than `1fr` so the single mobile column can
         * shrink to the frame width instead of being forced wider by its
         * content.
         */
        gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 660fr) minmax(0, 380fr)',
        /*
         * SPLIT, when the Study Journey widget is the right column (2026-09-16).
         *
         * Every other version keeps the JOINED treatment: one radius, one
         * shadow, `overflow: hidden` on the section, halves flush against each
         * other. That works while the two halves are two halves of one
         * statement and roughly one height.
         *
         * QE Focused broke both. Its navy side is a four-line lead-in and its
         * right side is a resume block plus ten steps, so as grid siblings the
         * navy half stretched to match and carried a large empty area below its
         * content — which reads as a render failure, not as breathing room. And
         * the navy side's figures moved to the Progress section below, so the
         * two are no longer one statement.
         *
         * Split, the section owns only the columns and the gap; each child
         * carries its own surface. `align-items: start` is the load-bearing
         * half — without it the grid still equalises the row and the navy card
         * stretches exactly as before, which is the joined band with a gap.
         */
        ...(journeyWidget
          ? // 40, matching the gap `MembershipOverview` puts between its own
            // sections — so the space between these two independent cards reads
            // as the page's own rhythm rather than a third, narrower value. It
            // was 20, inherited from when they were two halves of ONE card and
            // the gap was standing in for the seam; split, 20 read as two things
            // that had not quite come apart.
            { gap: 40, alignItems: 'start' }
          : {
              // Mobile: full-bleed — cancel the shell's 16px content gutter with
              // negative margins + square corners (no shadow) so the band runs
              // edge-to-edge like the navy profile band above it.
              ...(mobile
                ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
                : bleed
                  ? HERO_BLEED
                  : {
                      borderRadius: 'var(--radius-lg)',
                      boxShadow:
                        '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
                    }),
              overflow: 'hidden',
            }),
      }}
    >
      {/* ── LEFT · navy · Current Learning Path ── */}
      <div
        style={{
          // `page`: no card at all — the content sits on the shell's grey. The
          // padding goes with it on the left/right, since a bare block should
          // line up with the section headings below rather than being inset by
          // a card's gutter it no longer has.
          background: onPage ? 'transparent' : 'var(--color-primary-700)',
          color: cText,
          padding: onPage ? '4px 0 0' : '24px 26px',
          display: 'flex',
          flexDirection: 'column',
          // Split: the radius and shadow the section used to own move onto the
          // card. Its CONTENT is untouched — only the surface it sits on.
          ...(journeyWidget && !onPage
            ? {
                borderRadius: 'var(--radius-lg)',
                boxShadow:
                  '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
                overflow: 'hidden',
              }
            : null),
        }}
      >
        {/* THE COURSE HEADER BAND, when the Testing version hands it down —
            see `headerSlot`. First child of the LEFT COLUMN, so it takes that
            column's width and the right column's Study Journey starts level
            with it rather than below the whole thing.

            The band brings its own bottom rule, and inside this column that
            rule now spans the column rather than the page — which is what it
            should do here: it separates the header from the Jump Back In block
            directly beneath it, and a full-width rule would cut across the
            Study Journey beside it, which the rule has nothing to say about. */}
        {headerSlot}
        {/* THE EYEBROW SITS ABOVE EVERYTHING — 2026-09-16.
            It was inside the text column, beside the cover, which made it the
            course's label rather than the block's. Lifted out, it names the
            whole block — the art, the title and the meta all sit under it — and
            the row below can be a plain two-column pairing. */}
        {/* THE HEADER CLUSTER. `clpNavy` wraps it in a dark card; the KPI
            cells, status strip and View Requirements stay on the page grey
            below, so the variant is a treatment of this cluster rather than a
            second surface for the whole block. */}
        <div
          style={
            clpNavy
              ? {
                  background: 'var(--color-primary-700)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '22px 24px',
                  marginBottom: 4,
                }
              : undefined
          }
        >
        {onPage && !hideHeader ? (
          <p style={{ ...eyebrowBase, color: nEyebrow, marginBottom: 10 }}>
            {CURRENT_LEARNING_EYEBROW}
          </p>
        ) : null}
        {hideHeader ? null : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
          {/* COURSE ART, left of the title — 2026-09-16, when this block
              absorbed Jump Back In.

              **132×112**, from 84×56 → 132×88 → here. It is no longer 3:2: the
              text column beside it grew a progress bar under the meta line, and
              a 3:2 crop left the picture finishing well above that cluster,
              which read as a thumbnail that had been left behind rather than as
              the course. Taller squares it off against the title + meta + bar
              stack.

              The WIDTH is what is held now, not the ratio. `object-fit: cover`
              does the cropping, so the photograph is never distorted — it just
              shows less of its sides.

              `resumeCover` is the band's own resume course, so the picture and
              the Resume CTA below are the same course. Rendered only when there
              IS one — a path with nothing to resume gets the title flush left
              rather than a grey box.

              An `<img>` with an `onError` swap, NOT a CSS background, and that
              is what lets the path be authored before the asset lands: a course
              may name its own art (`imageUrl`) that is not in the repo yet, and
              the handler falls back to the stock pool instead of rendering a
              blank box. Same mechanism and same reason as `FeaturePreviewThumb`
              on the gateway. NO border: on the page grey it would box the one
              thing here that already has edges. */}
          {onPage && resumeCover && !clpNavy ? (
            <img
              src={resumeCover}
              alt=""
              aria-hidden
              onError={(e) => {
                const img = e.currentTarget
                const fallback = getCourseImage(resume?.id ?? path.id)
                if (img.src.endsWith(fallback)) return
                img.src = fallback
              }}
              style={{
                width: 132,
                height: 112,
                flex: 'none',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            {onPage && resumeCover ? null : (
              <p style={{ ...eyebrowBase, color: cEyebrow }}>{CURRENT_LEARNING_EYEBROW}</p>
            )}
            <h3 style={{ margin: onPage && resumeCover ? 0 : '6px 0 0' }}>
              {onOpenLearningPath || onViewDetails ? (
                <button
                  type="button"
                  // Title opens the full Learning Path page; the "View
                  // Requirements" link keeps opening the detail panel. Falls back
                  // to the panel if the page opener isn't wired.
                  onClick={() =>
                    onOpenLearningPath ? onOpenLearningPath(path.id) : onViewDetails?.()
                  }
                  title={onOpenLearningPath ? 'Open learning path' : undefined}
                  className={onPage ? 'cre-clp-title-link' : 'cre-clp-title-link--on-dark'}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1.18,
                    color: nText,
                  }}
                >
                  {path.title}
                </button>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 22,
                    lineHeight: 1.18,
                    color: cText,
                  }}
                >
                  {path.title}
                </span>
              )}
            </h3>
            {/* Desktop: meta under the title inside the header cluster. */}
            {!mobile && metaRow}
            {/* THE PROGRESS BAR LIVES HERE — 2026-09-16, replacing the 150px
                donut that sat in its own row below (the direct ask).

                Under the meta line and inside the text column, so it reads as
                this course's progress rather than as a separate widget: title,
                what it is, how far through it. The donut had a whole row to
                itself to say one number that the KPI cell below already says as
                "26 / 42 lessons".

                The SHARED `ProgressBar`, not a lookalike — the rule
                `ProgressInline` was extracted for, after Readiness drew its own
                3px bar in a different green and one learner's one 32% became
                two different bars a rail item apart. The percentage is printed
                beside it here because this surface has no other place saying
                "62%" once the donut goes; `ProgressBar` deliberately carries no
                label of its own.

                `track={cTrack}` for the reason the category bars needed it: the
                default track is 1.08:1 on the page grey, so an empty bar would
                have no visible groove. */}
            {onPage && barInHeader && !clpBigNumber && !clpNavy ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ProgressBar pct={percent} height={8} fill={cAccent} track={cTrack} />
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: cText,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {percent}% Complete
                </span>
              </div>
            ) : null}
            {/* The navy card carries its CTA inside, beside the copy — the
                reference puts the action in the card rather than under it. The
                light variants leave it where `resumeInline` renders it. */}
            {clpNavy && resume ? (
              <button
                type="button"
                onClick={() => launcher.open(resume.id)}
                style={{
                  marginTop: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 'var(--radius-md)',
                  border: 0,
                  cursor: 'pointer',
                  // White on navy, not the primary gradient: on this card the
                  // gradient is the card's own colour and the button would
                  // disappear into it.
                  background: 'var(--color-text-inverse)',
                  color: 'var(--color-primary-700)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Resume course <ArrowRight size={16} />
              </button>
            ) : null}
          </div>
          {/* The percentage as its own column — `big-number` and `navy`. */}
          {clpBigNumber || clpNavy ? percentColumn : null}
          {showViewAll && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className={onPage ? 'cre-link-action cre-cta-ink' : 'cre-link-action'}
              style={{ ...linkBtn(onPage ? undefined : cLink), whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {`View All (${pathsCount ?? ''})`}
            </button>
          )}
        </div>
        )}
        </div>
        {/* Mobile: meta on its own full-width line below the header row. */}
        {mobile && !hideHeader && metaRow}

        {/* Gauge + category bars. With `categoryGauge` these are the path's N
            categories (four, for the New York producer journey) rather than the
            Mandatory / Elective pair — see that prop's note for why the "two
            only" rule is lifted there. */}
        {/* NO TOP MARGIN WHEN THE HEADER IS HIDDEN — 2026-09-17, the direct ask
            ("shift this up").

            The 20 separates this row from the block's header cluster above it.
            With `dashboard-course-header` on, `hideHeader` empties that cluster
            but leaves the element, so the margin was clearing nothing: measured,
            the Jump Back In card started 16px below the Study Journey's eyebrow
            in the column beside it, and two columns of one band beginning on
            different lines reads as a mistake rather than a rhythm.

            Conditional rather than removed — with the band's own header showing,
            the gap is doing its job. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginTop: hideHeader ? 0 : 20,
          }}
        >
          {/* The donut is gone when the bar is in the header — one number, one
              rendering. NOT `display: none`: a hidden gauge is still in the
              accessibility tree and still in every `querySelector('svg')` a
              test reaches for, so it would read as present while being absent.
              It stays for a real breakdown, where it shows the SEGMENTS and a
              single bar cannot. */}
          {barInHeader ? null : (
          <div style={{ flex: 'none' }}>
            <ProgressDonut
              percent={percent}
              {...(categoryGauge
                ? { categories: cats }
                : {
                    mandatory: hasBreakdown ? mandatory : undefined,
                    elective: hasBreakdown ? elective : undefined,
                  })}
              size={150}
              caption="Complete"
              // Light-stop palette ONLY on navy. On the page the default
              // palette is the right one — it was built for a light ground —
              // so this flips with the surface.
              onDark={darkGround}
              // TRACK AT 0.12, not 0.2. The lighter track was fine behind the
              // two standardized Mandatory/Elective colors; against the
              // light-stop palette it takes cta-300 to 2.38:1 and the amber to
              // 2.91:1. At 0.12 every arc clears 3:1, and it matches the value
              // `CategoryBars` already uses for its own track — so the donut
              // and the bars beside it stop being two shades of empty.
              //
              // `fill` is unused in segmented mode (the arcs use the palette),
              // but `GaugeColors` requires it.
              colors={{
                track: cTrack,
                fill: cAccent,
                // On the page the centre numeral takes the gauge's own default
                // (near-black); on navy it stays a soft white.
                ...(onPage ? {} : { text: 'rgb(255 255 255 / 0.85)' }),
              }}
            />
          </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* ONE CATEGORY ⇒ NO BARS — 2026-09-16.
                A single category bar is the donut's number and the "Completed"
                KPI cell said a third time, three inches apart: 62%, a 62%-full
                bar, and "26 / 42 lessons". The breakdown earns its place when
                there is something to break DOWN.
                What takes the space is the RESUME block, which is why this
                block can absorb Jump Back In rather than sitting above a card
                that repeats its course. */}
            {showBars ? (
              <CategoryBars
                unit={unit}
                {...(categoryGauge
                  ? { categories: cats }
                  : { mandatory, elective })}
                mandatoryLabel={path.mandatoryLabel ?? 'Mandatory'}
                electiveLabel={path.electiveLabel ?? 'Elective'}
                onDark={darkGround}
                track={cTrack}
              />
            ) : resumeInline ? (
              resumeInline
            ) : clpBigNumber || clpNavy ? null : (
              // The no-breakdown fallback. It said "hours" as a literal, which
              // went wrong the moment a path measured something else — it read
              // "26 of 42 hours complete" under a bar labelled in lessons. And
              // it leaked into the navy variant, where the percent column
              // already states the same pair, because `resumeInline` is null
              // there and this was the else-branch.
              <p style={{ margin: 0, fontSize: 13, color: cMuted }}>
                {totalCompleted} of {totalRequired || path.hours} {unit} complete
              </p>
            )}
          </div>
        </div>

        {/* KPI row — Deadline / Time Remaining / Completed. `minmax(0, 1fr)`
            so the three cells compress at narrow (mobile) widths instead of
            forcing the band wider than the frame.
            The first caption honours the path's own `deadlineLabel`, as the
            renewalReady branch above already did — a pre-licensing candidate
            has no licence to expire, so XCEL's QE persona reads "Target Date"
            and its exam-prep persona "Exam Date". The `'Deadline'` fallback is
            this row's existing default and is deliberately NOT changed to the
            other branch's `'License Expires'`; that would move visible copy on
            every brand that sets no label. */}
        {/* `gap: 0` when bare — the rule IS the separation, and a gap on top of
            it would read as two gutters. */}
        {/* `stat-card` gathers the three cells AND the status onto one white
            card with a hairline border and a rule between them. The default
            leaves them bare on the page grey, divided by vertical rules. */}
        {paceTiles ? (
          /* THE SQUARE-TILE ROW — Study Pace and Readiness. See `paceTiles`.

             TWO ARRANGEMENTS, and `paceOnly` picks between them:

               - the PAIR (every version but Testing): two 1:1 tiles side by
                 side. `aspectRatio` rather than a fixed height, so they stay
                 square at whatever width the column is and GROW rather than
                 clipping if the status message ever needs the room.
               - SOLO (Testing): Readiness goes and Study Pace takes the row,
                 losing the square with it. Square was a property of there
                 being two — alone in this ~506px column a 1:1 tile is a 506px
                 box holding two lines of text.

             `minWidth: 0` on the grid either way, because a grid item's default
             `min-width: auto` refuses to shrink below its content, which is
             what makes a two-column grid overflow a narrow shell rather than
             squeeze. */
          /* THE PACE TILE GOES AT 100% — 2026-09-21, the direct ask ("study
             pace widget should no longer be visible, hide it"). There is no
             pace left to keep: every figure on it derives from work remaining,
             and with none remaining the card would state an evening for nothing.

             On TESTING the row is pace-only, so the row goes with it. On the
             PAIR, Readiness stays and takes the full width — the same call
             `paceOnly` already makes in reverse, for the same reason: a lone
             1:1 tile in a ~506px column is a 506px box holding two lines. */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: paceOnly || renewalReady ? '1fr' : 'repeat(2, minmax(0, 1fr))',
              gap: 14,
              marginTop: 18,
            }}
          >
            {/* THE LIVE TILE, in the "Testing 2" version only (`livePace`).

                Its own file rather than more of this one: the pace model, the
                sheet and four groups of controls would add ~400 lines to a
                component already past 1,800, and none of it is specific to this
                band. `SquareTile` moved out beside it so both branches render
                the SAME square — a tile treatment that exists twice is the
                drift `widgetStyles.ts` was written to stop.

                It is fed REAL facts, not props invented for it: the resume
                course's published credit hours against its own progress, and
                its access expiry. `FIXTURE_TODAY` is the anchored demo clock
                every other prototype surface passes, so the states render the
                same whenever the page is opened. */}
            {renewalReady ? null : livePace && resume ? (
              <StudyPaceTile
                today={FIXTURE_TODAY}
                hoursRemaining={resume.hours * (1 - (resume.progress ?? 0) / 100)}
                accessExpiresAt={resume.expiresAt}
                courseTitle={resume.title}
                examDate={examDate}
                detailsTo="/dashboard-rebrand?section=study-plan"
              />
            ) : pacingStyle === 'presets' && resume ? (
              /* PRESETS — the Testing version's fifth treatment, and the only
                 one that is a whole TILE rather than a body inside the
                 `SquareTile` below. See the `presets` arm of `pacingBody` for
                 why it sits here and for the `pacingStatus` decision.

                 THE SAME COMPONENT Testing 2 renders, in its `card` shape — so
                 the model, the `choices` state and the Adjust sheet are reused
                 rather than rebuilt, and a fix to the pace derivation reaches
                 both versions at once. The facts are the same three this file
                 already feeds it: the resume course's published credit hours
                 against its own progress, its access expiry, and the anchored
                 fixture clock.

                 `&& resume` for the reason `rate` is omitted without one — the
                 card is entirely course-derived, and with no course to read
                 there is nothing to state. It falls through to the lo-fi stub,
                 which is the honest empty rather than a guessed one.

                 NO `onStart` as of the 2026-09-21 redesign. The card carried a
                 "Start studying" button wired to this band's own launcher; the
                 Figma replaced both its buttons with one "Customize Study
                 Plan", which opens the pace sheet. Starting the course is the
                 Resume CTA's job a few inches up, and it is still there — so
                 the prop went rather than being kept for a button nothing
                 renders. */
              <StudyPaceTile
                layout="card"
                today={FIXTURE_TODAY}
                hoursRemaining={resume.hours * (1 - (resume.progress ?? 0) / 100)}
                accessExpiresAt={resume.expiresAt}
                courseTitle={resume.title}
                examDate={examDate}
                weekMinutes={weekMinutes}
              />
            ) : (
              <SquareTile
                caption="Study Pace"
                icon={<Clock size={13} />}
                to="/dashboard-rebrand?section=study-plan"
                square={!paceOnly}
              >
                {/* The treatment — the presets card on Testing, and the
                    lo-fi stub everywhere else. See `pacingBody`.

                    The stub has been what ships since 2026-09-17, the direct ask.
                    What it replaced was "~1.5 hrs/day · Suggested pace", which was
                    DERIVED (the resume course's real 40 credit hours over the days
                    left) rather than invented — and is not deleted: the derivation
                    still feeds `kpiSubLabels`, so the `stat-card` variant of
                    `dashboard-clp-stats` prints the same figure, and the `rate`
                    treatment above is that line given the tile to itself. */}
                {pacingBody}
                {/* The status pill and its message — the half of the strip that
                    was carrying the meaning, and the same element in every
                    treatment. See `pacingStatus`. */}
                {pacingStatus}
              </SquareTile>
            )}

            {/* READINESS — a LO-FI STUB, deliberately (the ask: "leave as lo-fi
                stub for now"), and ABSENT on the Testing version.

                It is the repo's own `LoFiWidgetBody`, not hand-drawn grey
                boxes: that component exists for exactly this slot ("drops into
                a sidebar widget / dashboard tile"), and a lookalike is how two
                placeholder treatments end up a few pixels apart.

                NO SCORE, not even a plausible one. There IS a real readiness
                model one rail item away (`ReadinessPanel`, with a gauge and a
                number), and printing a figure here that nothing resolved would
                be the Membership Plan card's defect — a surface making a claim
                it cannot support. Grey bars say "not built" honestly; a 72%
                would say something false.

                DROPPING IT ON TESTING costs nothing for the same reason: the
                placeholder is this tile, and the section it points at is
                untouched and still on the rail. */}
            {paceOnly ? null : (
              <SquareTile
                caption="Readiness"
                icon={<Gauge size={13} />}
                to="/dashboard-rebrand?section=readiness"
              >
                <LoFiWidgetBody rows={3} ariaLabel="Readiness — placeholder" />
                <span
                  style={{
                    marginTop: 'auto',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  Not designed yet
                </span>
              </SquareTile>
            )}
          </div>
        ) : (
        <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: onPage ? 0 : 10, marginTop: 18 }}>
          <KpiDark bare={onPage} bg={cTileBg} line={cLine} ink={cText} captionInk={cMuted} caption={path.deadlineLabel ?? 'Deadline'} icon={<CalendarDay size={13} />}>
            {deadline}
          </KpiDark>
          <KpiDark bare={onPage} rule={onPage ? cRule : undefined} bg={cTileBg} line={cLine} ink={cText} captionInk={cMuted} caption="Time Remaining" icon={<Clock size={13} />}>
            {/* Formatted by the SHARED `timeRemaining`, not `${weeksLeft} wks`
                — under 30 days it drops to a day countdown ("27 days"), which
                is what the detail sheet has always shown. The two disagreed:
                this cell said "3.857142857142857 wks" for anything the sheet
                called a day count. */}
            {timeRemain.expired ? (
              'Expired'
            ) : (
              timeRemain.segments.map((seg, i) => (
                <Fragment key={seg.unit}>
                  {i > 0 ? ', ' : ''}
                  <span style={{ color: cAccent }}>{seg.value}</span> {seg.unit}
                </Fragment>
              ))
            )}
          </KpiDark>
          <KpiDark bare={onPage} rule={onPage ? cRule : undefined} bg={cTileBg} line={cLine} ink={cText} captionInk={cMuted} caption="Completed" icon={<CircleCheck size={13} />}>
            <span style={{ color: cAccent }}>{totalCompleted}</span>{' '}
            <>/ {unitCount(totalRequired || path.hours, unit)}</>
          </KpiDark>
        </div>
        {/* Full-width Status band */}
        {/* STATUS.
            On the page surface this is the detail panel's OWN `StatusStrip` —
            the status-tinted wash with the pill and the message, and no
            "Status" caption. Two reasons it is the real component:

              - The Progress section directly below renders the same strip, so a
                lookalike would put two status treatments for one status inches
                apart on the same screen.
              - The label was chrome. A pill reading "On Track" beside a sentence
                about the deadline does not need a column telling you it is a
                status, and that column cost 104px of a narrow block.

            `STATUS_STRIP_BG` composites its tint over `--color-surface-card`
            rather than over transparent, which is why it reads on the page grey
            as well as on the navy frame it was built for.

            The navy card keeps the captioned box below: its translucent white
            fill is what makes the row read as a panel there, and the strip's
            pale tint would disappear into the navy. */}
        {onPage ? (
          // On the stat card the strip sits INSIDE the card under its rule, so
          // it needs no top margin of its own and no tint — the card is already
          // the surface, and a tinted row inside a white card reads as a second
          // card. `bare` on `StatusStrip` is what drops the wash.
          <div style={{ marginTop: 14 }}>
            <StatusStrip
              homeStatus={homeStatus}
              // `statusTreatment` returns the LIGHT tone here (no `onDark`), and
              // its keys differ from the panel's `StatusInfo` by two names —
              // `fill`/`text` against `bg`/`color`. Mapped rather than renamed:
              // both shapes have other consumers, and this is the only place
              // they meet.
              status={{
                label: pageStatus.label,
                message: status.message,
                bg: pageStatus.fill,
                border: pageStatus.border,
                color: pageStatus.text,
                outline: pageStatus.outline,
                Icon: pageStatus.icon,
              }}
            />
          </div>
        ) : (
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: cTileBg,
            border: `1px solid ${cLine}`,
          }}
        >
          <div style={{ flex: 'none', width: 104, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: cText,
              }}
            >
              <CalendarDay size={13} /> Status
            </span>
            <span
              style={{
                flex: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                color: status.text,
                background: status.outline ? 'transparent' : status.fill,
                boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              {status.icon && <status.icon size={12} aria-hidden />}
              {status.label}
            </span>
          </div>
          <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: cLine }} />
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '18px', color: cText }}>
            {status.message}
          </p>
        </div>

        )}
        </div>
        )}

        {interestChips && interestChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {interestChips.slice(0, 4).map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  background: onPage ? 'var(--color-neutral-100)' : 'rgb(255 255 255 / 0.14)',
                  color: cText,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 9px',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {/* "View Requirements →" IS GONE FROM THE PAGE SURFACE — 2026-09-17,
            the direct ask.

            SCOPED to `onPage`, not removed outright: on the navy versions this
            is the block's only route to the requirements sheet, and taking it
            from them would be changing what they ship for a change asked about
            this one.

            THE SHEET IS STILL REACHABLE HERE, which is the thing to check
            before removing a lone link — "State requirements →" sits at the
            foot of the Get Licensed card in the column beside this one and runs
            the same `onOpenRequirements`. A test pins that, so this cannot
            quietly become "there is no way to the requirements from Home". */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            marginTop: 'auto',
            paddingTop: onPage ? 0 : 18,
            justifyContent: 'flex-end',
          }}
        >
          {onViewDetails && !onPage && (
            <button
              type="button"
              onClick={onViewDetails}
              // `cre-cta-ink` on the page surface: the CTA ramp is a FILL
              // colour, and cta-500 as TEXT measures 1.84:1 on the dark page.
              // The class swaps to the light stop under `[data-theme='dark']`;
              // an inline colour here would beat it, so there is none.
              className={onPage ? 'cre-link-action cre-cta-ink' : 'cre-link-action'}
              style={{ ...linkBtn(onPage ? undefined : cLink) }}
            >
              View Requirements →
            </button>
          )}
        </div>

        {/* JUMP BACK IN IS NOT A SEPARATE CARD ANY MORE — 2026-09-16.

            It was here, under the View Requirements link: its own recessed
            card with the course art, title, meta, a progress bar and the Resume
            CTA. Every one of those was already in the block above it — same
            course, same art, same percentage — so the column read as one thing
            said twice.

            It is INSIDE the block now: the art is left of the title, and the
            resume copy and CTA take the half the category bar vacated. See
            `resumeInline` above.

            `JumpBackInWidget` is kept and still exported, unreferenced, per the
            archive convention — the band is its only caller and restoring it is
            re-adding a wrapper here. */}
      </div>

      {/* ── RIGHT · the Study Journey widget, as its own card ──
          QE Focused only. It renders INSTEAD of the white half below rather
          than inside it: the widget owns its own surface, and threading a
          `journeyWidget` branch through that markup would have left the resume
          block duplicated in two places that then drift. See
          `StudyJourneyWidget` for why it is a separate card at all. */}
      {journeyWidget ? (
        /* The journey ALONE in this column as of 2026-09-16. It was two stacked
           cards — Jump Back In above it — and that card moved to the left
           column, under the View Requirements link; see the note there.

           Still its own card rather than the journey's old top third: the
           resume block answers a different question, and it was the only
           unlabelled block on the version. What changed is which column it
           answers that question in. */
        <StudyJourneyWidget
          path={path}
          onOpenStop={onOpenStop}
          onOpenStep={onOpenStep}
          // The same action "View Requirements" runs — the sheet is the state's
          // own rules, and the Get Licensed card is where they apply.
          onOpenRequirements={onViewDetails}
          onOpenLearningPath={onOpenLearningPath}
          // FRAMED — a white card with a hairline edge instead of sitting bare
          // on the page grey.
          //
          // DRIVEN BY `journeyCards`, NOT `paceOnly`, as of 2026-09-21. It rode
          // on `paceOnly` while Testing was the only version that wanted this
          // treatment, and that prop's own note called the split in advance:
          // "Rename both if a version ever wants one without the other."
          // Testing 2 is that version — it wants this journey and keeps its
          // square tile PAIR, which is the whole thing `paceOnly` means.
          framed={journeyCards}
          // …and the post-course steps become their own cards. Still a separate
          // prop from `framed` because they are different questions — one is
          // this widget's surface, the other is how many widgets there are.
          splitSteps={journeyCards}
        />
      ) : (
      <div
        style={{
          background: 'var(--color-surface-card)',
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {resume ? (
          <>
            {/* Resume block. Two shapes:
                  Up Next      — a 168px cover, then title / meta beneath it.
                  Today's Tasks — cover and copy side by side at ~a quarter of
                    the card, so the rest belongs to the task list. The image
                    keeps its 3:2 rather than becoming a square thumbnail: it is
                    the same course art, and cropping it to a chip loses the
                    only thing it was carrying. */}
            {/* Card title. The variant labels its lower half "Today's tasks", so
                without this the card had one titled section and one untitled
                one — and the untitled one is the card's own subject. Same
                `eyebrowBase` as that heading and as the navy half's "Current
                Learning Path", so the three read as one level of hierarchy.
                The Up Next layout is left alone: it is the shipped default, and
                adding a title there is a change to what ships rather than to
                the variant being designed. */}
            {todaysTasksLayout && (
              <p
                style={{
                  ...eyebrowBase,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 12,
                }}
              >
                Jump back in
              </p>
            )}
            {todaysTasksLayout ? (
              // FIXED, not flexible. Letting the cover absorb the card's
              // leftover height was tried: it grew to 174×116 and squeezed the
              // title into three lines, because the white half is only ~250px
              // wide — a large side-by-side cover takes the width the copy
              // needs. The block stays compact and any slack falls to the
              // bottom of the card, which is what a light day should look like.
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div
                  aria-hidden
                  style={{
                    // 3:2. Not smaller than this — below ~56px tall the course
                    // art stops reading as a picture of anything.
                    width: 84,
                    height: 56,
                    flex: 'none',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-subtle)',
                    background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: 15,
                      lineHeight: '20px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {resume.title}
                  </h3>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {DELIVERY_LABEL[resume.delivery]} · {resume.badge === 'mandatory' ? 'Mandatory' : 'Elective'} CE
                    {typeof resume.progress === 'number' ? ` · ${resume.progress}% complete` : ''}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div
                  aria-hidden
                  style={{
                    height: 168,
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 16,
                    overflow: 'hidden',
                    border: '1px solid var(--color-border-subtle)',
                    background: `center / cover no-repeat url(${resume.imageUrl ?? getCourseImage(resume.id)})`,
                  }}
                />
                <h3
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {resume.title}
                </h3>
                <p style={{ margin: '6px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {DELIVERY_LABEL[resume.delivery]} · {resume.badge === 'mandatory' ? 'Mandatory' : 'Elective'} CE
                  {typeof resume.progress === 'number' ? ` · ${resume.progress}% complete` : ''}
                </p>
              </>
            )}
            <div
              style={{
                height: 6,
                borderRadius: 'var(--radius-pill)',
                background: 'var(--color-neutral-200)',
                overflow: 'hidden',
                marginTop: 8,
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${resumePct}%`,
                  background: 'var(--color-primary-500)',
                }}
              />
            </div>

            {/* CTA — magenta, directly below the progress bar. Height stays at
                44 in both layouts: it is the minimum comfortable touch target,
                and it is the single biggest item in the compact block, so it is
                also the reason that block lands near a third of the card rather
                than exactly a quarter. Shrinking it would hit the spec by
                making the primary action harder to tap. */}
            <button
              type="button"
              onClick={() => launcher.open(resume.id)}
              style={{
                marginTop: todaysTasksLayout ? 12 : 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 44,
                borderRadius: 'var(--radius-md)',
                border: 0,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--color-cta-500), var(--color-cta-600))',
                color: 'rgb(255 255 255 / 1)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Resume course <ArrowRight size={16} />
            </button>

            {todaysTasksLayout ? (
              <>
                <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)', marginTop: 18 }} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginTop: 18,
                  }}
                >
                  <p style={{ ...eyebrowBase, color: 'var(--color-text-secondary)', margin: 0 }}>
                    Today's tasks
                    {/* The count is the whole DAY, not the rows on screen —
                        the question it answers is "how much is scheduled",
                        which does not change with how many the card can fit.
                        A step lighter than the label so the label still leads.
                        Omitted at zero: the empty state below already says
                        nothing is scheduled, and "(0)" above it says it twice. */}
                    {todaysTasks.length > 0 && (
                      <span style={{ color: 'var(--color-text-tertiary)' }}>
                        {' '}
                        ({todaysTasks.length})
                      </span>
                    )}
                  </p>
                  {/* Always shown, not only on an overflowing day. The link is
                      the way into the Study Plan from here, so hiding it on a
                      light day made the route appear and disappear with the
                      workload.
                      It used to read "View all 6" when the list was truncated.
                      The heading carries the day's count now, and the two sit
                      inches apart — one number, in the place that is about
                      counting. */}
                  <Link
                    to="/dashboard-rebrand?section=study-plan"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-accent-text)',
                      textDecoration: 'none',
                      flex: 'none',
                    }}
                  >
                    View all →
                  </Link>
                </div>
                {visibleTasks.length > 0 ? (
                  /* The rows are the study calendar's own `TaskRow`, in
                     `compact` — the same component the Study Plan page renders,
                     not a lookalike. This started as a bespoke row that merely
                     matched the visual language; reusing the real one is what
                     keeps the two surfaces from drifting, and it brings the
                     things the copy missed: the status badge, the progress bar
                     on an in-progress task, the kebab, and the title-prefix
                     affordances (Read / View / Complete).

                     Natural height, top-aligned, fixed gap. Spreading the rows
                     into the card's leftover height was tried and is wrong: the
                     card is sized by the navy half beside it, so a two-task day
                     opened a 139px hole between two rows. The leftover falls to
                     the bottom instead. */
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      marginTop: 10,
                    }}
                  >
                    {visibleTasks.map((t) => (
                      <TaskRow key={t.id} task={t} compact />
                    ))}
                  </div>
                ) : (
                  /* A plan with nothing due today is a REAL state, not an
                     error — the plan skips weekends and buffer days. Saying so
                     beats an empty gap under a heading. */
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Nothing scheduled today.{' '}
                    <Link
                      to="/dashboard-rebrand?section=study-plan"
                      style={{ color: 'var(--color-accent-text)', fontWeight: 700 }}
                    >
                      Open your study plan
                    </Link>
                  </p>
                )}
              </>
            ) : (
              upNext.length > 0 && (
                <>
                  <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)', marginTop: 18 }} />
                  <p style={{ ...eyebrowBase, color: 'var(--color-text-secondary)', marginTop: 18 }}>Up next</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {upNext.map((c) => (
                      <UpNextRowLight key={c.id} course={c} />
                    ))}
                  </div>
                </>
              )
            )}
          </>
        ) : (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            You don't have anything in progress.
          </p>
        )}
      </div>
      )}
    </section>
  )
}

/* ─── pieces ─────────────────────────────────────────────────────────── */

/**
 * One KPI cell. Surface colours are PASSED IN rather than read from the
 * on-dark constants, so the same cell renders on the navy card and on the page
 * grey — see `LearnerFocusedBand`'s `surface` note. Defaults keep every
 * existing caller unchanged.
 */
function KpiDark({
  caption,
  icon,
  children,
  bg = 'rgb(255 255 255 / 0.06)',
  line = ON_DARK_LINE,
  ink = ON_DARK,
  captionInk = ON_DARK_MUTED,
  bare = false,
  rule,
  sub,
  subInk,
}: {
  caption: string
  icon?: ReactNode
  children: ReactNode
  bg?: string
  line?: string
  ink?: string
  captionInk?: string
  /**
   * Drop the card — no fill, no border, no radius — so the cell sits directly
   * on whatever is behind it. For the page surface, where three tiles in a row
   * read as three cards competing with the Study Journey card beside them; the
   * numbers are the content, and a container each was chrome around chrome.
   */
  bare?: boolean
  /** Vertical rule on the leading edge, for every cell but the first. This is
   *  what separates the data points once `bare` has taken their boxes away. */
  rule?: string
  /**
   * A third line under the value, saying what the number IS.
   *
   * The `stat-card` treatment's whole reason for extra height. `null` and
   * `undefined` both render nothing, so a caller can omit ONE cell's sub-label
   * — which the pace line does when there are no course hours to derive it
   * from, rather than printing a guess.
   */
  sub?: string | null
  subInk?: string
}) {
  return (
    <div
      style={{
        ...(bare
          ? {
              // Horizontal padding on BOTH sides of the rule, so the three
              // cells are evenly spaced around it rather than hugging it.
              padding: '2px 16px',
              ...(rule ? { borderLeft: `1px solid ${rule}` } : { paddingLeft: 0 }),
            }
          : {
              background: bg,
              border: `1px solid ${line}`,
              borderRadius: 'var(--radius-md)',
              padding: '11px 13px',
            }),
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: captionInk,
        }}
      >
        {icon}
        {caption}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: ink }}>{children}</span>
      {sub ? (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            lineHeight: '15px',
            color: subInk ?? captionInk,
          }}
        >
          {sub}
        </span>
      ) : null}
    </div>
  )
}

/** Up-next row on the WHITE (right) card — light surface + dark text. */
function UpNextRowLight({ course }: { course: CourseCardData }) {
  const Icon = course.delivery === 'podcast' ? Podcast : course.delivery === 'video' ? Monitor : FileText
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--color-neutral-75)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 12px',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          flex: 'none',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary-100)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--color-primary-700)',
        }}
      >
        <Icon size={16} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {course.title}
        </p>
        <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {course.badge === 'mandatory' ? 'Mandatory' : 'Elective'} · {course.hours} hrs
        </p>
      </div>
    </div>
  )
}

/** Shared text-link button style. `color` is OMITTED when a theme-aware class
 *  owns the colour — an inline `color` would win over the class. */
function linkBtn(color?: string): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    ...(color ? { color } : null),
  }
}
