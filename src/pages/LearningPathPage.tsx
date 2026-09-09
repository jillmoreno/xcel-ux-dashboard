import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDay,
  ClipboardList,
  Download,
  FileText,
  Library,
  Video,
} from '@/icons'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Toast } from '@/components/ui/Toast'
import { Modal } from '@/components/ui/Modal'
import { CourseCard, type CourseCardData } from '@/components/courses/CourseCard'
import { CourseDetailsPanel } from '@/components/courses/CourseDetailsPanel'
import { CertSmall } from '@/components/courses/CertSmall'
import { PathBanner } from '@/components/learning/PathBanner'
import { useLearningPathsPanel } from '@/components/learning/LearningPathsPanelContext'
import { useLearningPathSummariesForBrand } from '@/data/learningPathsCountVariant'
import { LearningPathPromoCard } from '@/components/learning/LearningPathPromoCard'
import { LicenseTracker } from '@/components/dashboard/LicenseTracker'
import { OverallProgressWidget } from '@/components/learning/OverallProgressWidget'
import { InlineStudyCalendar } from '@/components/learning/study-calendar/InlineStudyCalendar'
import { StudyCalendarPanel } from '@/components/learning/study-calendar/StudyCalendarPanel'
import { StudyProgressPanel } from '@/components/learning/study-calendar/StudyProgressPanel'
import { CreateCalendarPanel } from '@/components/learning/study-calendar/CreateCalendarPanel'
import { DEFAULT_STUDY_DAYS } from '@/components/learning/study-calendar/CreateCalendarModal/StudyDaysToggle'
import type { CreateCalendarFormState } from '@/components/learning/study-calendar/CreateCalendarModal/CreateCalendarModal'
import {
  STUDY_CALENDAR_TODAY,
  tasksOnDate,
  type StudyTaskKind,
} from '@/data/studyCalendarFixtures'
import { useAccount } from '@/context/AccountContext'
import {
  activePathIdFor,
  issuedCertificatesFor,
  learningPathsFor,
  mandatoryCoursesFor,
  mandatoryHoursFor,
  pathBannerData,
  type LearningPathSummary,
} from '@/data/learningFixtures'
import {
  applyStatusOverride,
  hasStudyCalendarFor,
  supportsStudyPlan,
  parseStatusOverride,
  studyCalendarFor,
  type StatusOverride,
} from '@/data/studyCalendarFixtures'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

type LearningTab = 'goal-tracker' | 'study-calendar' | 'certificates' | 'exam-prep'
type PageView = 'calendar' | 'learning-path'

const PAGE_VIEW_TABS: Array<{ id: PageView; label: string }> = [
  { id: 'calendar', label: 'Study Plan' },
  { id: 'learning-path', label: 'Learning Path' },
]

// Blank-slate form for the "Create Calendar" slide-over launched from the
// promo card. Mirrors the panel-harness defaults — start date pre-filled
// with the canonical demo "today", default study days selected, exam date
// left blank so the availability filter stays open until the learner picks
// one. No persistence: Save logs the payload and fires a toast.
// Mirrors the study-calendar TaskRow meta line so the Daily Tasks promo
// card's subtext reads the same as the task in the calendar below.
const STUDY_TASK_KIND_LABEL: Record<StudyTaskKind, string> = {
  video: 'Video',
  quiz: 'Quiz',
  exam: 'Exam',
  reading: 'Reading',
  custom: 'Task',
}

// Same kind → icon mapping as the study-calendar TaskRow.
const STUDY_TASK_KIND_ICON: Record<StudyTaskKind, typeof CalendarDay> = {
  video: Video,
  quiz: ClipboardList,
  exam: Library,
  reading: BookOpen,
  custom: CalendarDay,
}

// Daily Tasks promo demo states — driven by the `learning-path-daily-tasks`
// flag so reviewers can preview one vs. multiple tasks at different
// completion levels. `today` derives from the real calendar (see
// MandatorySection); the rest are canned previews.
type DailyTaskPreview = {
  title: string
  kind: StudyTaskKind
  durationMin: number
  context?: string
  isCourseLinked: boolean
}
type DailyTasksScenario = {
  completed: number
  total: number
  next: DailyTaskPreview | null
  /** When today's tasks are all done (`next` is null), the next upcoming
   *  task the learner can start early to get ahead. Null when there's
   *  nothing left in the plan. */
  getAhead?: DailyTaskPreview | null
}

const DAILY_TASKS_SCENARIOS: Record<string, DailyTasksScenario> = {
  single: {
    completed: 0,
    total: 1,
    next: { title: 'Complete Greenlight 1', kind: 'exam', durationMin: 120, isCourseLinked: true },
  },
  'multi-early': {
    completed: 1,
    total: 4,
    next: {
      title: 'Watch Chapter 09 — Trading Markets',
      kind: 'video',
      durationMin: 30,
      isCourseLinked: true,
    },
  },
  'multi-late': {
    completed: 3,
    total: 4,
    next: {
      title: 'Read Chapter 12 — Customer Suitability',
      kind: 'reading',
      context: 'Module 4',
      durationMin: 45,
      isCourseLinked: false,
    },
  },
  // Next task is a pure custom task (a reminder / scheduled call) the
  // learner marks done themselves — nothing to open, so the CTA is
  // "Mark as complete" directly.
  'custom-task': {
    completed: 2,
    total: 4,
    next: {
      title: 'Call your STC success coach',
      kind: 'custom',
      context: 'Scheduled check-in',
      durationMin: 15,
      isCourseLinked: false,
    },
  },
  'all-done': {
    completed: 3,
    total: 3,
    next: null,
    getAhead: {
      title: 'Watch Chapter 10 — Trading Markets',
      kind: 'video',
      durationMin: 30,
      isCourseLinked: true,
    },
  },
}

// How the daily-task CTA should behave, derived from the task's
// completion model:
//   - 'course'   → course-linked task that auto-completes via the LMS.
//                  The CTA launches it ("Start Task" / "Start next task").
//   - 'resource' → a self-marked PDF / reading. "Start Task" opens the
//                  resource; once the learner closes it the CTA swaps to
//                  "Mark as complete" (mirrors the calendar TaskRow flow).
//   - 'custom'   → a pure custom task (reminder, scheduled call) with
//                  nothing to open. The CTA is "Mark as complete" directly.
type DailyTaskActionKind = 'course' | 'resource' | 'custom'
function dailyTaskActionKind(task: DailyTaskPreview): DailyTaskActionKind {
  if (task.isCourseLinked) return 'course'
  if (task.kind === 'custom') return 'custom'
  return 'resource'
}

const CREATE_CALENDAR_INITIAL_STATE: CreateCalendarFormState = {
  assignedCalendarId: '',
  omitNyseHolidays: false,
  startDate: STUDY_CALENDAR_TODAY,
  studyDays: DEFAULT_STUDY_DAYS,
  targetExamDate: '',
}

function isContinuingEducation(path: LearningPathSummary): boolean {
  return path.category.toLowerCase().includes('continuing education')
}

export function LearningPathPage({
  embedded = false,
  onBackToPaths,
  onSwitchPath,
}: {
  embedded?: boolean
  /** When set (V2 landing-page mode with a deep-linked path), renders a
   *  "← All learning paths" link above the banner that returns to the
   *  Learning Path landing page. Single-path users never get this. */
  onBackToPaths?: () => void
  /** When set (V1 mode with 2+ paths), renders a top-right "Switch Learning
   *  Path" link that opens the My Learning Paths sheet. */
  onSwitchPath?: () => void
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { brand } = useAccount()
  const { activePathId: panelPathId } = useLearningPathsPanel()
  const paths = useMemo(() => learningPathsFor(brand), [brand])
  // Total paths the learner has (the count-variant list the Switch sheet shows)
  // — surfaced in the "Switch Learning Path (N)" link.
  const switchPathCount = useLearningPathSummariesForBrand().length
  // `?id=` (V2 deep link) wins; then the sheet's in-place selection (set on the
  // rebrand dashboard when the learner picks a path from the Switch sheet); then
  // the brand's default active path.
  const pathId = searchParams.get('id') ?? panelPathId ?? activePathIdFor(brand)
  const activePath = useMemo(
    () => paths.find((p) => p.id === pathId) ?? paths[0],
    [paths, pathId],
  )
  const isCE = isContinuingEducation(activePath)
  // Calendar-first variant promotes Study Calendar out of the tab list and
  // renders it inline above the tabs, with a top-right page-view toggle
  // that swaps the body between calendar and standard learning-path layout.
  const isInlineCalendar = activePath.layoutVariant === 'study-calendar-inline'
  // Stacked variant renders the inline calendar AND the Learning Path tab
  // row on the same page — no toggle. Mandatory carousel moves inside the
  // Learning Path tab content rather than sitting above the tab row.
  const isStackedCalendar = activePath.layoutVariant === 'study-calendar-stacked'
  // Calendar-in-tab variant mirrors the default STC layout (Mandatory
  // above tabs, Study Calendar as a tab) but swaps the in-tab calendar
  // body for the new InlineStudyCalendar so we can compare new vs old.
  const isCalendarInTab = activePath.layoutVariant === 'study-calendar-in-tab'
  // Either inline variant promotes the calendar out of the tab list.
  const calendarAboveTabs = isInlineCalendar || isStackedCalendar
  // Which brands have a Study Plan at all is `supportsStudyPlan` — ONE
  // predicate, not a brand literal repeated per surface. It replaced five
  // `brand === 'stc'` checks in this file alone (plus the one in
  // `hasStudyCalendarFor`); the five had to move together, because a brand
  // that passes some of them and fails others gets a Study Plan tab with no
  // Study Plan in it, or the promos for a feature it cannot reach.
  const hasStudyPlan = supportsStudyPlan(brand)
  /**
   * MOVED 2026-09-09 — the Study Plan is its own rail section (`study-plan`,
   * directly under Home), not a tab here.
   *
   * Named rather than deleted because TWO things follow from it and they have
   * to move together — the same failure the `supportsStudyPlan` comment above
   * describes. Reverting is flipping this one constant.
   *
   * Typed `boolean` rather than left as the literal `true` so the conditions
   * below stay readable as conditions instead of narrowing to dead code.
   */
  const studyPlanHasOwnPage: boolean = true
  // Originally STC-only per the QE PRD ("calendar is mission-critical for
  // high-value B2B partners"); XCEL joined 2026-09-04. The tab is suppressed
  // for the inline variants since the calendar renders above the tab row —
  // and now for every variant, since the Study Plan has a page.
  const showStudyCalendar = hasStudyPlan && !calendarAboveTabs && !studyPlanHasOwnPage
  // A Study-Plan brand reframes "Goal Tracker" as "Progress Tracker" — its
  // learners track exam-prep progress, not CE-style goal completion.
  // Calendar-above variants relabel it again to "Learning Path" since the tab
  // row now reads as a TOC of the path content below the calendar.
  const goalTrackerLabel = calendarAboveTabs
    ? 'Learning Path'
    : hasStudyPlan
      ? 'Progress Tracker'
      : 'Goal Tracker'
  // A Study-Plan brand drops the Progress Tracker TAB once its key stats
  // (progress, tasks completed, exam date, days left) live in the stat band
  // above the calendar. XCEL followed STC here — DECIDED 2026-09-04, and marked
  // "for now": if XCEL later wants both tabs this becomes a per-brand flag,
  // NOT a re-added `brand !== 'xcel'` literal, which is the sixth one that
  // change existed to delete.
  //
  // ⚠ THE TAB COMES BACK WHEN THE STUDY PLAN LEAVES, and that is the whole
  // reason `studyPlanHasOwnPage` is a named constant. The condition for
  // dropping this tab was never "the brand has a Study Plan" — it was "the
  // stats already show in the band above the calendar". Move the calendar to
  // its own page and that band goes with it, so a learner would be left with a
  // one-tab tab bar and no progress view anywhere on this page.
  const showGoalTrackerTab = !hasStudyPlan || calendarAboveTabs || studyPlanHasOwnPage
  const TABS = useMemo<TabItem<LearningTab>[]>(() => {
    const base: TabItem<LearningTab>[] = []
    if (showGoalTrackerTab) base.push({ id: 'goal-tracker', label: goalTrackerLabel })
    if (showStudyCalendar) base.push({ id: 'study-calendar', label: 'Study Plan' })
    base.push({ id: 'certificates', label: 'Certificates' })
    // Exam Prep Scorecard tab hidden — keeping the `'exam-prep'`
    // route + placeholder render below so direct URL hits don't 404,
    // just dropping the tab from the visible bar.
    return base
  }, [showGoalTrackerTab, showStudyCalendar, goalTrackerLabel])
  // STC learners land on the Study Calendar by default — it's the pacing tool
  // they need every visit. CE learners default to Goal Tracker (where their
  // widgets live), everyone else to Certificates as before. Calendar-above
  // variants default to the renamed "Learning Path" tab.
  // Land on the first tab that is actually shown. Before the Study Plan moved
  // out this read `isCE ? 'goal-tracker' : 'certificates'` for the no-calendar
  // case — which would now open a pre-licensing learner on Certificates while
  // an unselected Progress Tracker sat to its left.
  const defaultTab: LearningTab = calendarAboveTabs
    ? 'goal-tracker'
    : showStudyCalendar
      ? 'study-calendar'
      : showGoalTrackerTab
        ? 'goal-tracker'
        : 'certificates'
  const [tab, setTab] = useState<LearningTab>(defaultTab)

  // Calendar-first paths get a page-level toggle that swaps between the
  // full-bleed inline Study Calendar and the standard Mandatory + Tabs
  // layout. URL-driven so refresh / share-link preserves the active view.
  // Default `calendar`; the param is omitted from the URL when active.
  const pageView: PageView =
    searchParams.get('view') === 'learning-path' ? 'learning-path' : 'calendar'
  const setPageView = (next: PageView) => {
    setSearchParams(
      (prev) => {
        const merged = new URLSearchParams(prev)
        if (next === 'calendar') merged.delete('view')
        else merged.set('view', next)
        return merged
      },
      { replace: true },
    )
  }
  // Tabs + tab content block. Mandatory placement depends on variant:
  //   - stacked → Mandatory lives inside the Learning Path tab content
  //   - everything else → Mandatory sits above the tab row
  const tabsBlock = (
    <>
      {!isStackedCalendar && (
        <MandatorySection brand={brand} pathId={activePath.id} embedded={embedded} />
      )}
      <div style={{ marginTop: isStackedCalendar ? 0 : 32 }}>
        <Tabs items={TABS} active={tab} onChange={setTab} />
        <div style={{ marginTop: 24 }}>
          {tab === 'certificates' && <CertificatesPanel brand={brand} />}
          {tab === 'goal-tracker' &&
            (isStackedCalendar ? (
              <MandatorySection brand={brand} pathId={activePath.id} embedded={embedded} />
            ) : hasStudyPlan ? (
              // `hasStudyPlan`, NOT `showStudyCalendar`. That flag was doing two
              // jobs — "is the Study Plan a tab on this page" and "does this
              // brand have study-plan progress to show" — and moving the plan to
              // its own page pulled them apart. Keyed on the tab, this branch
              // fell through to the Goal Tracker placeholder, so the tab that
              // came BACK with the move rendered nothing: strictly worse than
              // the one-tab bar it was meant to fix.
              <StudyProgressPanel pathId={activePath.id} />
            ) : isCE ? (
              <GoalTrackerCePanel path={activePath} />
            ) : (
              <PlaceholderPanel title="Goal Tracker" />
            ))}
          {tab === 'study-calendar' && showStudyCalendar && (
            // Calendar-in-tab variant uses the redesigned calendar in
            // place of the legacy one. All other STC paths keep the
            // original tabbed StudyCalendarPanel.
            isCalendarInTab ? (
              <InlineStudyCalendar pathId={activePath.id} />
            ) : (
              <StudyCalendarPanel pathId={activePath.id} />
            )
          )}
          {tab === 'exam-prep' && <PlaceholderPanel title="Exam Prep Scorecard" />}
        </div>
      </div>
    </>
  )

  // Show inline calendar when the stacked variant is active, OR when the
  // inline-with-toggle variant is currently on the calendar half of the toggle.
  const showInlineCalendar =
    isStackedCalendar || (isInlineCalendar && pageView === 'calendar')
  // Show tabs block when stacked (always), or when the inline-with-toggle is
  // on the learning-path half, or for the default (non-calendar-above) layout.
  const showTabsBlock =
    isStackedCalendar || !isInlineCalendar || pageView === 'learning-path'

  // `study-calendar-status` override — same flag the in-tab calendar
  // reads. Applied here too so the banner's "X of Y Tasks Complete"
  // pill stays in sync with the stat band when reviewers force a
  // status from the Feature Flag panel.
  const statusFlag = useFeatureFlag('study-calendar-status')
  // A `?calStatus=` URL param (used by the prototype walkthrough to
  // deep-link a pacing state) overrides the flag so the banner's task
  // count stays in sync with the calendar's stat band.
  const statusOverride =
    parseStatusOverride(searchParams.get('calStatus')) ??
    ((statusFlag.variant as StatusOverride | undefined) ?? 'match')

  // Compute task completion counts for paths that have a Study Calendar so
  // the banner shows "X of Y Tasks Complete" instead of static hours. Paths
  // without a calendar fall back to the hours pill.
  const taskCounts = useMemo(() => {
    if (!hasStudyCalendarFor(brand, activePath.id)) return undefined
    const cal = applyStatusOverride(
      studyCalendarFor(activePath.id),
      statusOverride,
    )
    const completed = cal.tasks.filter((t) => t.status === 'completed').length
    return { completed, total: cal.tasks.length }
  }, [brand, activePath.id, statusOverride])

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {onBackToPaths && (
        <button
          type="button"
          onClick={onBackToPaths}
          className="cre-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
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
          All learning paths
        </button>
      )}
      {onSwitchPath && (
        <button
          type="button"
          onClick={onSwitchPath}
          className="cre-link-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-end',
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
          Switch Learning Path ({switchPathCount})
          <ArrowRight size={14} aria-hidden />
        </button>
      )}
      <PathBanner data={pathBannerData(activePath, taskCounts)} />

      <div style={{ padding: embedded ? '24px 0 64px' : '24px 64px 64px', width: '100%' }}>
        {isInlineCalendar && <PageViewToggle active={pageView} onChange={setPageView} />}
        {showInlineCalendar && (
          <div style={{ marginBottom: isStackedCalendar ? 40 : 0 }}>
            <InlineStudyCalendar pathId={activePath.id} />
          </div>
        )}
        {showTabsBlock && tabsBlock}
      </div>
    </div>
  )
}

function GoalTrackerCePanel({ path }: { path: LearningPathSummary }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
        gap: 24,
        alignItems: 'stretch',
      }}
    >
      <OverallProgressWidget path={path} />
      <LicenseTracker />
    </div>
  )
}

function MandatorySection({
  brand,
  pathId,
  embedded = false,
}: {
  brand: import('@/context/AccountContext').Brand
  pathId: string
  /** Rendered inside the Dashboard Rebrand shell — tighten the top margin
   *  since the section hero + PathBanner already sit close above. */
  embedded?: boolean
}) {
  const hours = mandatoryHoursFor(brand)
  // The card kebab opens Course Details. One panel for the whole carousel,
  // holding the course it was opened from — the same shape `MembershipOverview`
  // uses for the Jump Back In tile. Until now this kebab was a rendered button
  // with an aria-label and NO handler on every card here.
  const [detailsCourse, setDetailsCourse] = useState<CourseCardData | null>(null)
  const [mandatorySearchParams] = useSearchParams()
  // Read the same `study-calendar-status` flag the calendar reads so
  // the Series 79 mandatory cards mutate in lockstep with the
  // calendar tasks when reviewers force a status from the Feature
  // Flag panel (or a `?calStatus=` walkthrough deep-link). Other paths
  // ignore the override (their card lists don't carry a per-status
  // progression).
  const statusFlag = useFeatureFlag('study-calendar-status')
  const statusOverride =
    parseStatusOverride(mandatorySearchParams.get('calStatus')) ??
    ((statusFlag.variant as StatusOverride | undefined) ?? 'match')
  const courses = useMemo(
    () => mandatoryCoursesFor(brand, pathId, statusOverride),
    [brand, pathId, statusOverride],
  )
  // "Jump Back In" marker — the single course the learner left off on:
  // the in-progress course if there is one, otherwise the first
  // not-started course (where they'd pick up next). Only one card per
  // path carries the solid border + badge.
  const jumpBackInId = useMemo(() => {
    const inProgress = courses.find((c) => c.status === 'in-progress')
    if (inProgress) return inProgress.id
    const notStarted = courses.find(
      (c) => (c.status ?? 'not-started') === 'not-started',
    )
    return notStarted?.id ?? null
  }, [courses])
  const railRef = useRef<HTMLDivElement | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // STC leads the Mandatory carousel with a "Create a study calendar"
  // promo card (the new promo-card variant). Its CTA opens the shared
  // Create Calendar slide-over. State + handlers mirror the panel demo
  // harness — no persistence; Save logs the payload and fires a toast.
  // Only shown on the `study-calendar-state` "Add Calendar" variant — the
  // promo prompts creating a calendar, so it's hidden once one exists
  // (Edit / Locked variants). A `?calState=` URL param overrides the flag
  // (same deep-link the in-tab calendar reads) so the prototype
  // walkthrough's "Not Created" tile shows the Create-Calendar promo here
  // too, not just inside the Study Calendar tab.
  const calendarStateFlag = useFeatureFlag('study-calendar-state')
  const calState =
    mandatorySearchParams.get('calState') ?? calendarStateFlag.variant
  const showCalendarPromo = supportsStudyPlan(brand) && calState === 'add'
  // Once a calendar exists (Edit variant), the lead tile flips to a
  // "Today's Tasks" tracker: progress over today's tasks + the next task
  // to tackle. CTA is always "Start Task"; once today is cleared it
  // becomes "Start next task" (the get-ahead state).
  const showDailyTasksPromo = supportsStudyPlan(brand) && calState === 'edit'
  // Demo state for the Daily Tasks card — `today` derives from the real
  // calendar; other variants are canned previews (one vs. multiple tasks
  // at different completion levels).
  const dailyTasksFlag = useFeatureFlag('learning-path-daily-tasks')
  const dailyScenario = useMemo<DailyTasksScenario>(() => {
    const preset = DAILY_TASKS_SCENARIOS[dailyTasksFlag.variant ?? '']
    if (preset) return preset
    // The `today` variant derives from THIS PATH's plan. It read the bare
    // `STUDY_CALENDAR` constant — the STC Series 79 plan — so every path got
    // Series 79's tasks: harmless while STC was the only Study-Plan brand and
    // wrong the moment XCEL arrived ("Complete Greenlight 1" under an
    // insurance path). `studyCalendarFor` is the resolver every other Study
    // Plan surface already uses.
    const calendar = studyCalendarFor(pathId)
    const tasks = tasksOnDate(calendar, STUDY_CALENDAR_TODAY)
    const next =
      tasks.find((t) => t.status === 'in-progress') ??
      tasks.find((t) => t.status !== 'completed') ??
      null
    const toPreview = (t: (typeof tasks)[number]): DailyTaskPreview => ({
      title: t.title,
      kind: t.kind,
      context: t.context,
      durationMin: t.durationMin,
      isCourseLinked: t.isCourseLinked,
    })
    // When today's tasks are all done, surface the soonest upcoming task
    // (after today) so the learner can get ahead.
    const upcoming =
      next === null
        ? calendar.tasks
            .filter(
              (t) => t.status !== 'completed' && t.dueDate > STUDY_CALENDAR_TODAY,
            )
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]
        : undefined
    return {
      completed: tasks.filter((t) => t.status === 'completed').length,
      total: tasks.length,
      next: next ? toPreview(next) : null,
      getAhead: upcoming ? toPreview(upcoming) : null,
    }
  }, [dailyTasksFlag.variant, pathId])
  const dailyNext = dailyScenario.next
  // Surfaced only when today's tasks are all done — the next upcoming
  // task the learner can start early to get ahead.
  const dailyGetAhead = dailyNext ? null : (dailyScenario.getAhead ?? null)
  // The single task the CTA acts on — the "up next" task when there's one
  // due today, otherwise the "get ahead" task. Only one is ever non-null.
  const activeDailyTask = dailyNext ?? dailyGetAhead
  const activeDailyTaskKey = activeDailyTask?.title ?? ''
  // Interaction state for the daily-task CTA:
  //   - resource tasks open a viewer first (`open`), and once the learner
  //     has closed it (`seen`) the CTA swaps to "Mark as complete".
  //   - marking complete fires a non-persistent demo toast.
  // The state is keyed to the active task's title so that switching tasks
  // (e.g. the reviewer flips the Daily Tasks demo variant) starts fresh —
  // a stale key is treated as `{ open: false, seen: false }` at render time,
  // avoiding a reset effect (and the cascading-render lint it trips).
  const [dailyResourceState, setDailyResourceState] = useState<{
    key: string
    open: boolean
    seen: boolean
  }>({ key: activeDailyTaskKey, open: false, seen: false })
  const [dailyTaskToastOpen, setDailyTaskToastOpen] = useState(false)
  const dailyResource =
    dailyResourceState.key === activeDailyTaskKey
      ? dailyResourceState
      : { key: activeDailyTaskKey, open: false, seen: false }
  const dailyResourceOpen = dailyResource.open
  const dailyResourceSeen = dailyResource.seen
  // Same meta line the calendar's TaskRow shows: kind · (context ·) duration.
  const taskSubtext = (task: DailyTaskPreview) =>
    [STUDY_TASK_KIND_LABEL[task.kind], task.context, `${task.durationMin} min`]
      .filter(Boolean)
      .join(' · ')
  // Shared "labeled task" block (eyebrow + kind icon + title + meta line),
  // used by both the "Up next" and "Get ahead" states. Returns spans only
  // (no block-level elements) so it stays valid inside the card's <p>.
  const renderDailyTaskBlock = (eyebrow: string, task: DailyTaskPreview) => {
    const KindIcon = STUDY_TASK_KIND_ICON[task.kind]
    const subtext = taskSubtext(task)
    return (
      <>
        <span
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          <KindIcon size={16} aria-hidden style={{ flexShrink: 0, marginTop: 3 }} />
          <span>{task.title}</span>
        </span>
        {subtext && (
          <span style={{ display: 'block', marginTop: 4, fontSize: 13, opacity: 0.78 }}>
            {subtext}
          </span>
        )}
      </>
    )
  }
  const [createCalendarOpen, setCreateCalendarOpen] = useState(false)
  const [createCalendarForm, setCreateCalendarForm] =
    useState<CreateCalendarFormState>(CREATE_CALENDAR_INITIAL_STATE)
  const [calendarToastOpen, setCalendarToastOpen] = useState(false)

  const handleCalendarChange = useCallback(
    (patch: Partial<CreateCalendarFormState>) => {
      setCreateCalendarForm((prev) => ({ ...prev, ...patch }))
    },
    [],
  )
  const handleCalendarSave = useCallback((state: CreateCalendarFormState) => {
    console.info('learning-path:create-calendar:save', state)
    setCalendarToastOpen(true)
    setCreateCalendarOpen(false)
    setCreateCalendarForm(CREATE_CALENDAR_INITIAL_STATE)
  }, [])
  const handleCalendarClose = useCallback(() => {
    setCreateCalendarOpen(false)
  }, [])

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = rail
      // Carousel has padding-inline so its "natural" start scrollLeft is the
      // padding-left value, not 0. Use the computed padding as the threshold
      // so the prev arrow only appears once the user has scrolled past start.
      const padLeft = parseFloat(getComputedStyle(rail).paddingLeft) || 0
      const padRight = parseFloat(getComputedStyle(rail).paddingRight) || 0
      setCanScrollLeft(scrollLeft > padLeft + 1)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - padRight - 1)
    }
    update()
    rail.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(rail)
    return () => {
      rail.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const scrollNext = () => {
    railRef.current?.scrollBy({ left: 290, behavior: 'smooth' })
  }
  const scrollPrev = () => {
    railRef.current?.scrollBy({ left: -290, behavior: 'smooth' })
  }

  // Subtext mirrors the Study Calendar tab's "Tasks Completed" — same
  // calendar + status override — so the Required Tasks count stays in
  // lockstep. Falls back to mandatory hours for non-calendar paths.
  const calendarForCounts = hasStudyCalendarFor(brand, pathId)
    ? applyStatusOverride(studyCalendarFor(pathId), statusOverride)
    : null
  const requiredTaskCounts = calendarForCounts
    ? {
        completed: calendarForCounts.tasks.filter((t) => t.status === 'completed')
          .length,
        total: calendarForCounts.tasks.length,
      }
    : null
  const categoryTitle = requiredTaskCounts ? 'Required Tasks' : 'Mandatory'
  const categorySubtext = requiredTaskCounts
    ? `${requiredTaskCounts.completed} of ${requiredTaskCounts.total} tasks completed`
    : `${hours.earned} of ${hours.required} Hours Completed`

  // The lead tile (Today's Tasks tracker, or the Create Study Plan prompt
  // in the not-created state) carries its own title and sits to the LEFT
  // as a standalone; the "Required Tasks" header + course carousel sit to
  // its right.
  //
  // It DISAPPEARS entirely once the plan is fully complete — no task left
  // today AND nothing upcoming. There is no terminal "you're all set"
  // card: when both `dailyNext` and `dailyGetAhead` are null the slot
  // collapses and the carousel just starts with the first course card.
  const showDailyTasks = showDailyTasksPromo && (dailyNext !== null || dailyGetAhead !== null)

  // CTA for the Today's Tasks card, branched on the active task's
  // completion model (see `dailyTaskActionKind`). Course-linked tasks
  // launch; self-marked PDFs/readings open a resource then flip to
  // "Mark as complete"; pure custom tasks go straight to "Mark as
  // complete". `null` when there's no actionable task (caught-up state).
  const dailyMarkCompleteCta = activeDailyTask
    ? {
        label: 'Mark as complete',
        onClick: () => {
          console.info(
            'learning-path:daily-task:mark-complete',
            activeDailyTask.title,
          )
          setDailyTaskToastOpen(true)
          setDailyResourceState({ key: activeDailyTaskKey, open: false, seen: false })
        },
      }
    : undefined
  const dailyStartLabel = dailyNext ? 'Start Task' : 'Start next task'
  const dailyTaskCta = (() => {
    if (!activeDailyTask) return undefined
    const actionKind = dailyTaskActionKind(activeDailyTask)
    // Pure custom task, or a resource the learner has already opened →
    // the only action left is to mark it complete.
    if (actionKind === 'custom' || (actionKind === 'resource' && dailyResourceSeen)) {
      return dailyMarkCompleteCta
    }
    // Self-marked resource not yet opened → "Start Task" opens the viewer.
    if (actionKind === 'resource') {
      return {
        label: dailyStartLabel,
        onClick: () =>
          setDailyResourceState({ key: activeDailyTaskKey, open: true, seen: false }),
      }
    }
    // Course-linked task → launch it (LMS stub).
    return {
      label: dailyStartLabel,
      onClick: () =>
        console.info(
          dailyNext
            ? 'learning-path:daily-task:start'
            : 'learning-path:daily-task:start-next',
          activeDailyTask.title,
        ),
    }
  })()
  const promoCard = showCalendarPromo ? (
    <LearningPathPromoCard
      title="Stay on pace."
      body="Build a personalized study plan and we'll schedule your daily tasks to keep you on track for exam day."
      watermarkIcon={CalendarDay}
      cta={{
        label: 'Create Study Plan',
        onClick: () => setCreateCalendarOpen(true),
      }}
    />
  ) : showDailyTasks ? (
    <LearningPathPromoCard
      title="Today's Tasks"
      watermarkIcon={CalendarDay}
      progress={{ completed: dailyScenario.completed, total: dailyScenario.total }}
      body={
        dailyNext ? (
          renderDailyTaskBlock('Up next', dailyNext)
        ) : dailyGetAhead ? (
          <>
            <span style={{ display: 'block', fontWeight: 600, marginBottom: 12 }}>
              You&rsquo;re all caught up on today&rsquo;s tasks — nice work.
              Want to get ahead?
            </span>
            {renderDailyTaskBlock('Get ahead', dailyGetAhead)}
          </>
        ) : (
          "You're all caught up on today's tasks — nice work."
        )
      }
      cta={dailyTaskCta}
    />
  ) : null

  return (
    <section style={{ position: 'relative', marginTop: embedded ? 8 : 32 }}>
      {/* Category header sits top-left, above the promo (Today's Tasks /
          Stay on Pace) card, which leads the row ahead of the course
          cards. */}
      <header style={{ marginBottom: 8 }}>
        <h2
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          {categoryTitle}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>
          {categorySubtext}
        </p>
      </header>
      <div style={{ position: 'relative' }}>
        <div
          ref={railRef}
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: '265px',
            gap: 28,
            overflowX: 'auto',
            // Bleed past the page gutter so cards aren't clipped; matching
            // internal padding keeps card 0 flush with the heading above.
            padding: '12px 28px 16px',
            margin: '-12px -28px -16px',
            scrollSnapType: 'x proximity',
            scrollPaddingInline: '28px',
          }}
        >
          {promoCard && (
            <div style={{ scrollSnapAlign: 'start' }}>{promoCard}</div>
          )}
          {courses.map((course) => (
            <div key={course.id} style={{ scrollSnapAlign: 'start' }}>
              <CourseCard
                data={course}
                compact
                jumpBackIn={course.id === jumpBackInId}
                onKebab={() => setDetailsCourse(course)}
              />
            </div>
          ))}
        </div>
        {canScrollLeft && (
          <CarouselArrow direction="prev" onClick={scrollPrev} label="Scroll to previous courses" />
        )}
        {canScrollRight && (
          <CarouselArrow direction="next" onClick={scrollNext} label="Scroll to next courses" />
        )}
      </div>
      {/* Body intentionally empty — slice 2 builds the route, slice 3 the
          destination. An empty panel still beats a button that does nothing. */}
      <CourseDetailsPanel
          open={detailsCourse !== null}
          onClose={() => setDetailsCourse(null)}
          course={detailsCourse}
        />
      {showCalendarPromo && (
        <>
          <CreateCalendarPanel
            open={createCalendarOpen}
            onClose={handleCalendarClose}
            onSave={handleCalendarSave}
            formState={createCalendarForm}
            onChange={handleCalendarChange}
            pathId={pathId}
          />
          <Toast
            open={calendarToastOpen}
            onClose={() => setCalendarToastOpen(false)}
            tone="success"
            title="Study plan created"
            duration={2500}
          >
            Demo save — your settings weren&rsquo;t persisted.
          </Toast>
        </>
      )}
      {showDailyTasksPromo && (
        <>
          {/* Resource viewer for a self-marked PDF / reading. Mirrors the
              calendar TaskRow's empty-state stub: closing it is the trigger
              that swaps the card's CTA to "Mark as complete". */}
          <Modal
            open={dailyResourceOpen}
            onClose={() =>
              setDailyResourceState({ key: activeDailyTaskKey, open: false, seen: true })
            }
            title={activeDailyTask?.title ?? 'Task'}
            width={560}
          >
            <div
              style={{
                padding: '32px 32px 40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-neutral-75)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <FileText size={24} aria-hidden />
              </span>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  lineHeight: '20px',
                  color: 'var(--color-text-secondary)',
                  maxWidth: 360,
                }}
              >
                No content available for this task yet. Close this window, then
                mark the task complete when you&rsquo;re done.
              </p>
            </div>
          </Modal>
          <Toast
            open={dailyTaskToastOpen}
            onClose={() => setDailyTaskToastOpen(false)}
            tone="success"
            title="Task marked complete"
            duration={2500}
          >
            Demo — your progress wasn&rsquo;t persisted.
          </Toast>
        </>
      )}
    </section>
  )
}

function CarouselArrow({
  direction,
  onClick,
  label,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
  label: string
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '50%',
        [isPrev ? 'left' : 'right']: -8,
        transform: 'translateY(-50%)',
        width: 46,
        height: 46,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-cta-500)',
        border: 'none',
        color: 'var(--color-text-inverse)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgb(0 0 0 / 0.18)',
        zIndex: 1,
      }}
    >
      {isPrev ? <ArrowLeft size={20} aria-hidden /> : <ArrowRight size={20} aria-hidden />}
    </button>
  )
}

function CertificatesPanel({ brand }: { brand: import('@/context/AccountContext').Brand }) {
  const certificates = useMemo(() => issuedCertificatesFor(brand), [brand])
  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 24,
              lineHeight: '32px',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Certificates
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-primary)' }}>
            {certificates.length} Certificates Issued for this Learning Path
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, paddingTop: 4 }}>
          <ActionLink icon={<Download size={16} aria-hidden />} label="Download All" />
          <ActionLink icon={<Award size={16} aria-hidden />} label="View All" />
        </div>
      </header>
      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 16,
        }}
      >
        {certificates.map((cert) => (
          <CertSmall key={cert.id} data={cert} />
        ))}
      </div>
    </section>
  )
}

function ActionLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="cre-link-action"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        color: 'var(--color-secondary-500)',
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function PlaceholderPanel({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: 24,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14 }}>
        {title} content lives behind a separate prompt — placeholder for now.
      </p>
    </div>
  )
}

/**
 * Compact segmented toggle for swapping the page body between the inline
 * Study Calendar and the standard Learning Path stack. Lives on its own
 * row, pinned to the far right with a "View" eyebrow label — the
 * Linear/Jira board-vs-list pattern, but with text labels in each cell
 * instead of icons.
 */
function PageViewToggle({
  active,
  onChange,
}: {
  active: PageView
  onChange: (next: PageView) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        marginBottom: 24,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        View
      </span>
      <div
        role="tablist"
        aria-label="Page view"
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          padding: 2,
          background: 'var(--color-neutral-50)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        {PAGE_VIEW_TABS.map((item) => {
          const isActive = item.id === active
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange(item.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: isActive ? 'var(--color-cta-500)' : 'transparent',
                color: isActive ? 'var(--color-neutral-50)' : 'var(--color-text-primary)',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: '18px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
