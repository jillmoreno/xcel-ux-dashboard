import { type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDay, CircleCheck, Clock, FileText, Monitor, Podcast } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import type { CourseCardData } from '@/components/courses/CourseCard'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { statusTreatment, type HomeStatus, CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { ProgressDonut, CategoryBars } from '@/components/learning/progressGauge'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
import { getCourseImage } from '@/utils/courseImage'
import { CompletedCelebration, type CompletedStat } from './CompletedCelebration'
import { DiscoveryEmpty } from './JumpBackInDiscoveryEmpty'
import { TaskRow } from '@/components/learning/study-calendar/TaskRow'
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
  /** Demo renewal override (persona): the Deadline + Time Remaining cells. */
  renewal?: { deadline: string; weeksLeft: number }
  /** Renewal-ready treatment (100% complete): the green completed celebration. */
  renewalReady?: boolean
  /** Interest / modality chips shown on the CLP after the setup wizard completes. */
  interestChips?: string[]
  /** Opens the Course Catalog (completed state's Browse Catalog CTA). */
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

const DELIVERY_LABEL: Record<string, string> = {
  online: 'Course',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}

const eyebrowBase: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

export function LearnerFocusedBand({
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
  onBrowseCatalog,
  onViewCertificate,
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
  const todaysTasksLayout = jbiVariant === 'todays-tasks' && pathHasPlan
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
  const percent = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : path.progressPct
  // Dashboard breakdown rule: the segmented gauge + bars render ONLY for
  // exactly two categories; more than two show the overall % here and the full
  // list in the detail panel.
  const hasBreakdown = cats.length === 2 && cats.every((c) => c.required > 0)

  const { expires } = LICENSE_TRACKER
  const weeksLeft = renewal?.weeksLeft ?? LICENSE_TRACKER.weeksLeft
  const expiresMonth = expires.month.charAt(0) + expires.month.slice(1, 3).toLowerCase()
  const deadline = renewal?.deadline ?? `${expiresMonth} ${expires.day}, ${expires.year}`

  // Explicit persona status wins; else derive from progress + weeks left.
  const derivedStatus: HomeStatus = percent >= 50 || weeksLeft > 16 ? 'on-track' : weeksLeft >= 6 ? 'at-risk' : 'off-track'
  const homeStatus: HomeStatus = statusOverride ?? derivedStatus
  // Shared on-dark treatment (the navy band) — the same source the badge +
  // Details panel use, so all six states render correctly (previously
  // not-started/expired fell back to green) and the message is the shared
  // generic copy (no path title — the card header already carries it).
  const status = statusTreatment(homeStatus, 'compliance', { onDark: true })

  const meta = [path.category, ...(path.state ? [path.state] : []), `${path.hours} Hours`]
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
        color: ON_DARK_MUTED,
      }}
    >
      {meta.map((m, i) => (
        <span key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          {i > 0 && <span aria-hidden style={{ width: 1, height: 11, background: ON_DARK_LINE }} />}
          {m}
        </span>
      ))}
    </div>
  )

  // ── Completed celebration (Option 5) ── 100% complete: the shared green
  // success left half (with a secondary "View Certificate" under the details)
  // joined to the white "all caught up" panel on the right.
  if (renewalReady) {
    const completedStats: CompletedStat[] = [
      ...(hasBreakdown
        ? [
            { label: path.mandatoryLabel ?? 'Mandatory', value: `${mandatory.completed} / ${mandatory.required}` },
            { label: path.electiveLabel ?? 'Elective', value: `${elective.completed} / ${elective.required}` },
          ]
        : []),
      { label: path.deadlineLabel ?? 'License Expires', value: deadline },
      { label: 'Time Remaining', value: `${weeksLeft} wks` },
    ]
    return (
      <section
        aria-label="Learning path complete"
        className="cre-learner-focused-band"
        style={{
          display: 'grid',
          gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 514fr) minmax(0, 407fr)',
          ...(mobile
            ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
            : bleed
              ? HERO_BLEED
              : {
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
                }),
          overflow: 'hidden',
        }}
      >
        <CompletedCelebration
          title={path.title}
          creditHoursTotal={totalRequired || path.hours}
          stats={completedStats}
          onViewDetails={onViewDetails}
          showViewAll={showViewAll}
          onViewAll={onViewAll}
          pathsCount={pathsCount}
        />
        <div
          style={{
            background: 'var(--color-surface-card)',
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <DiscoveryEmpty
            tone="completed"
            onBrowseCatalog={onBrowseCatalog}
            onViewCertificate={onViewCertificate}
            compact
          />
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="Your learning"
      className="cre-learner-focused-band"
      style={{
        display: 'grid',
        // `minmax(0, 1fr)` (not `1fr`) so the single mobile column can shrink
        // to the frame width instead of being forced wider by its content.
        gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 514fr) minmax(0, 407fr)',
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
      }}
    >
      {/* ── LEFT · navy · Current Learning Path ── */}
      <div
        style={{
          background: 'var(--color-primary-700)',
          color: ON_DARK,
          padding: '24px 26px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ ...eyebrowBase, color: ACCENT }}>{CURRENT_LEARNING_EYEBROW}</p>
            <h3 style={{ margin: '6px 0 0' }}>
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
                  className="cre-clp-title-link--on-dark"
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
                    color: ON_DARK,
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
                    color: ON_DARK,
                  }}
                >
                  {path.title}
                </span>
              )}
            </h3>
            {/* Desktop: meta under the title inside the header cluster. */}
            {!mobile && metaRow}
          </div>
          {showViewAll && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="cre-link-action"
              style={{ ...linkBtn(ON_DARK), whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              {`View All (${pathsCount ?? ''})`}
            </button>
          )}
        </div>
        {/* Mobile: meta on its own full-width line below the header row. */}
        {mobile && metaRow}

        {/* Two-segment gauge + Mandatory / Elective bars */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 20 }}>
          <div style={{ flex: 'none' }}>
            <ProgressDonut
              percent={percent}
              mandatory={hasBreakdown ? mandatory : undefined}
              elective={hasBreakdown ? elective : undefined}
              size={150}
              caption="Complete"
              // `fill` is unused in segmented mode (the arcs use the standardized
              // Mandatory/Elective colors), but `GaugeColors` requires it.
              colors={{ track: 'rgb(255 255 255 / 0.2)', fill: ACCENT, text: 'rgb(255 255 255 / 0.85)' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {hasBreakdown ? (
              <CategoryBars
                mandatory={mandatory}
                elective={elective}
                mandatoryLabel={path.mandatoryLabel ?? 'Mandatory'}
                electiveLabel={path.electiveLabel ?? 'Elective'}
                onDark
              />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: ON_DARK_MUTED }}>
                {totalCompleted} of {totalRequired || path.hours} hours complete
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 18 }}>
          <KpiDark caption={path.deadlineLabel ?? 'Deadline'} icon={<CalendarDay size={13} />}>
            {deadline}
          </KpiDark>
          <KpiDark caption="Time Remaining" icon={<Clock size={13} />}>
            <span style={{ color: ACCENT }}>{weeksLeft}</span> wks
          </KpiDark>
          <KpiDark caption="Completed" icon={<CircleCheck size={13} />}>
            <span style={{ color: ACCENT }}>{totalCompleted}</span> / {totalRequired || path.hours} hrs
          </KpiDark>
        </div>

        {/* Full-width Status band */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgb(255 255 255 / 0.06)',
            border: `1px solid ${ON_DARK_LINE}`,
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
                color: ON_DARK,
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
          <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: ON_DARK_LINE }} />
          <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '18px', color: ON_DARK }}>
            {status.message}
          </p>
        </div>

        {interestChips && interestChips.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
            {interestChips.slice(0, 4).map((c) => (
              <span
                key={c}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgb(255 255 255 / 0.14)',
                  color: ON_DARK,
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 9px',
                }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 18, marginTop: 'auto', paddingTop: 18, justifyContent: 'flex-end' }}>
          {onViewDetails && (
            <button
              type="button"
              onClick={onViewDetails}
              className="cre-link-action"
              style={{ ...linkBtn(ON_DARK) }}
            >
              View Requirements →
            </button>
          )}
        </div>
      </div>

      {/* ── RIGHT · white · Jump Back In ── */}
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
    </section>
  )
}

/* ─── pieces ─────────────────────────────────────────────────────────── */

function KpiDark({ caption, icon, children }: { caption: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        background: 'rgb(255 255 255 / 0.06)',
        border: `1px solid ${ON_DARK_LINE}`,
        borderRadius: 'var(--radius-md)',
        padding: '11px 13px',
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
          color: ON_DARK_MUTED,
        }}
      >
        {icon}
        {caption}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: ON_DARK }}>{children}</span>
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

function linkBtn(color: string): CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    color,
  }
}
