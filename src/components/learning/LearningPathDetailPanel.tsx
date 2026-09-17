import { useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFocusMode } from '@/components/layout/useFocusMode'
import {
  ArrowRight,
  CalendarExclamation,
  Check,
  ChevronRight,
  CircleCheck,
  CircleExclamation,
  CircleInfo,
  TriangleExclamation,
  X,
} from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { useCourseLauncher } from '@/components/layout/CourseLauncherContext'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  coursesWithDerivedStatus,
  mandatoryCoursesFor,
  pathRequirementsFor,
  type LearningPathCategoryBreakdown,
  type LearningPathSummary,
} from '@/data/learningFixtures'
import { LICENSE_TRACKER } from '@/data/dashboardFixtures'
import { synthCategoryCourses } from './studyJourneyUtil'
import { unitCount } from '@/utils/unitLabel'
import { NY_LH_COURSE_CHAPTERS } from '@/data/nyProducerRequirements'
import { XCEL_NY_PRODUCER_PATH_ID } from '@/data/studyCalendarFixtures'
import type { CourseCardData } from '@/components/courses/CourseCard'
import { HOME_STATUS_META, STATUS_STRIP_BG, statusLabel, statusMessageFor, timeRemaining, type HomeStatus } from './learningPathsHomeUtil'
import { DISCOVERY_COPY } from '@/components/membership/v5/JumpBackInDiscoveryEmpty'
import { CategoryBars, ProgressDonut } from './progressGauge'
import { resolvePathCategories } from './progressGaugeUtil'

/**
 * Synthesize per-category course rows for a multi-category (QE) path. Each
 * category becomes 1–2 courses (split when the requirement is large) whose hours
 * sum to the category requirement, with statuses derived from its completed
 * hours so the row checkmarks track the gauge.
 */

/**
 * Learning Path detail slide-over — the tabbed (Progress / Requirements) panel
 * from `explorations/learning-path-categories/category-breakdown-and-detail-panel.html`
 * (Panel A). Opened from the Current Learning Path widget's "View full
 * breakdown & requirements →" footer link.
 *
 * - **Header** (pinned above the tabs): the path title, a sub-line, and a CTA
 *   row that stays visible on every tab — primary "Go to Learning Path"
 *   (→ `/my-learning/path`) + secondary "Download Requirements" (stub).
 * - **Progress tab:** the segmented gauge + category bars (shared with the
 *   widget via [`progressGauge`](src/components/learning/progressGauge.tsx)),
 *   then dashed-leader Mandatory / Elective course lists. Each course row has a
 *   3-state status mark (done / in-progress / not-started), a divider-separated
 *   meta line (category · hours · status), and a "View Certificate" link on
 *   completed courses.
 * - **Requirements tab:** an hours facts box + the board's renewal rules.
 */

type Props = {
  open: boolean
  onClose: () => void
  path: LearningPathSummary
  /** Personalize the status message with the learner's first name (HOME tile).
   *  Omitted elsewhere → generic copy. */
  firstName?: string
  /** Which half the sheet shows — see `LearningPathDetailPanelContent`'s note.
   *  Defaults to the tabbed sheet every existing consumer expects. */
  view?: 'tabs' | 'progress' | 'requirements'
}

export function LearningPathDetailPanel({ open, onClose, path, firstName, view = 'tabs' }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={path.title} width={480}>
      <LearningPathDetailPanelContent
        path={path}
        onClose={onClose}
        firstName={firstName}
        view={view}
      />
    </Sheet>
  )
}

/**
 * The panel's inner content (pinned header + tabs + scrolling body), split out
 * from the `Sheet` wrapper so a dev-handoff live preview can render the REAL
 * panel body inline — the `Sheet` itself is a fixed, full-viewport overlay, so
 * it can't sit inside a preview frame. Renders as a flex column; its host must
 * supply `display:flex; flexDirection:column` (the `Sheet` panel does, and the
 * preview card mirrors it).
 */
export function LearningPathDetailPanelContent({
  path,
  onClose = () => {},
  firstName,
  view = 'tabs',
}: {
  path: LearningPathSummary
  /** Dismiss the host sheet. Optional — an `embedded` host has nothing to
   *  dismiss, and the internal course-open handler calls it unconditionally. */
  onClose?: () => void
  /** Personalize the status message (HOME tile); omitted → generic copy. */
  firstName?: string
  /*
   * `embedded` and `hideSummary` were REMOVED 2026-09-16 with the page section
   * they existed for (see `MembershipOverview`). `embedded` dropped the Close
   * link and the scroll container so this body could render inline;
   * `hideSummary` dropped the gauge and the stat tiles once those moved to the
   * Current Learning Progress block. With the section gone the Sheet is the only
   * host again, and two props with no caller are two things to keep working for
   * nothing.
   *
   * The file-header note about rendering inline still holds — the body is split
   * from the `Sheet` wrapper, so a future inline host is a prop away rather than
   * a refactor.
   */
  /**
   * Which half to render, and whether to offer the tab bar at all.
   *
   * `tabs` (default) is the original: Progress | Requirements, switchable. The
   * three older consumers keep it — `LearningPathsHome`, the classic
   * dashboard's `LearnerOverviewPanel`, and the QE page's own embedded section
   * all reach a half through it, and for the first two this sheet is the ONLY
   * door to either.
   *
   * `requirements` and `progress` render one half with no tab bar, for a caller
   * that has already decided. The QE Focused version uses both: its "View
   * Requirements" CTA opens `requirements` (2026-09-16 — the page beside it
   * already shows every bit of the Progress half, so a tab back to it was a
   * second door onto what you were just looking at), and its page section
   * renders `progress`.
   *
   * A single-half view sets no tab state, so a caller cannot land on a tab the
   * host never meant to offer.
   */
  view?: 'tabs' | 'progress' | 'requirements'
}) {
  const { brand } = useAccount()
  const navigate = useNavigate()
  const focusMode = useFocusMode()
  const launcher = useCourseLauncher()
  const [tab, setTab] = useState<'progress' | 'requirements'>('progress')
  // `tabs` lets the tab state decide; the single-half views pin it, so the
  // body below reads ONE value either way.
  const activeHalf = view === 'tabs' ? tab : view

  // Open a course from a row — in-shell Learning Launcher when the panel is
  // inside the Dashboard Rebrand shell, else the standalone `/courses/:id`
  // route. Mirrors `CourseSheet`'s launch behavior.
  const openCourse = (id: string) => {
    if (launcher.available) launcher.open(id)
    else navigate(`/courses/${id}`)
    onClose()
  }

  const mandatory = path.mandatory
  const elective = path.elective
  // Generalized categories (explicit N-list or the Mandatory/Elective pair) —
  // the source of truth for the gauge + the full category breakdown here.
  const cats = resolvePathCategories(path)
  const totalRequired = cats.reduce((s, c) => s + c.required, 0)
  const totalCompleted = cats.reduce((s, c) => s + c.completed, 0)
  const percent = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : path.progressPct
  const hasBreakdown = cats.length >= 2
  // Education-type-aware labels (CE defaults when the path omits them).
  const mandatoryLabel = path.mandatoryLabel ?? 'Mandatory'
  const electiveLabel = path.electiveLabel ?? 'Elective'
  const deadlineLabel = path.deadlineLabel ?? 'License Expires'

  const courses = mandatoryCoursesFor(brand, path.id)
  const mandatoryCoursesRaw = courses.filter((c) => c.badge === 'mandatory')
  const electiveCoursesRaw = courses.filter((c) => c.badge === 'elective')
  // Per-category status resolution — the course-row checkmarks ALWAYS track the
  // gauge: walk each category's courses against its completed-hours budget
  // (`coursesWithDerivedStatus`), so switching the progress state (At Risk /
  // Off Track / Completed …) moves the rows in step with the % — for CE as well
  // as QE. (completed === 0 → every row not-started; 100% → every row complete.)
  const resolveStatuses = (raw: CourseCardData[], breakdown?: LearningPathCategoryBreakdown) => {
    if (!breakdown) return raw
    // Fully-met category (100% / Completed) → every course complete, even when
    // the authored course hours sum slightly above the requirement (a partial
    // walk would otherwise leave the last row in-progress).
    if (breakdown.required > 0 && breakdown.completed >= breakdown.required) {
      return raw.map((c) => ({ ...c, status: 'completed' as const }))
    }
    return coursesWithDerivedStatus(raw, breakdown.completed)
  }
  // Reconcile the Jump Back In (resume) course into the course lists so the
  // sheet reflects it as **in progress** — the course the learner is actively
  // resuming (shown in the dashboard's Jump Back In section) must carry the
  // single-stroke in-progress ring here too, instead of the list looking all
  // complete/not-started when the derived-hours walk lands on a category
  // boundary. Only in-progress resume courses reconcile (an "Up Next"
  // not-started course, or the renewal-ready state with no resume course, are
  // left untouched). If the resume course already appears in its category list
  // (matched by id, else normalized title) we force that row in progress;
  // otherwise we inject it as an in-progress row after the completed courses.
  const resumeCourse = path.jumpBackIn
  const reconcileResume = (
    list: CourseCardData[],
    badge: 'mandatory' | 'elective',
  ): CourseCardData[] => {
    if (!resumeCourse || resumeCourse.status !== 'in-progress') return list
    if ((resumeCourse.badge ?? 'mandatory') !== badge) return list
    const norm = (s: string) => s.trim().toLowerCase()
    const idx = list.findIndex(
      (c) => c.id === resumeCourse.id || norm(c.title) === norm(resumeCourse.title),
    )
    if (idx >= 0) {
      return list.map((c, i) => (i === idx ? { ...c, status: 'in-progress' as const } : c))
    }
    const insertAt = list.findIndex((c) => c.status !== 'completed')
    const at = insertAt >= 0 ? insertAt : list.length
    const row: CourseCardData = { ...resumeCourse, status: 'in-progress' }
    return [...list.slice(0, at), row, ...list.slice(at)]
  }
  const mandatoryCourses = reconcileResume(resolveStatuses(mandatoryCoursesRaw, mandatory), 'mandatory')
  const electiveCourses = reconcileResume(resolveStatuses(electiveCoursesRaw, elective), 'elective')
  // Multi-category (QE) paths group courses BY CATEGORY instead of Mandatory/
  // Elective — synthesize per-category rows from the taxonomy.
  const categoryList = path.categories ?? []
  const multiCategory = categoryList.length > 0
  const categorySections = multiCategory
    ? categoryList.map((cat) => ({
        cat,
        /* REAL CHAPTERS for the New York pre-licensing course (2026-09-17).
           Keyed on the path AND the category, not on the unit: "a lessons-
           measured pre-license category" would quietly claim these eleven
           titles for any future course that happened to match. */
        courses: synthCategoryCourses(
          cat,
          path.state,
          path.unitLabel ?? 'hrs',
          path.id === XCEL_NY_PRODUCER_PATH_ID && cat.key === 'pre-license'
            ? NY_LH_COURSE_CHAPTERS
            : undefined,
        ),
      }))
    : []
  // "Empty path" — the learner hasn't added any courses yet. Explicit
  // `coursesAdded: false` on the persona, or simply no courses resolved. Drives
  // the Progress tab's empty state (the license Requirements still apply, so
  // that tab is unchanged).
  const emptyPath =
    path.coursesAdded === false ||
    (!multiCategory && mandatoryCourses.length === 0 && electiveCourses.length === 0)
  const requirements = pathRequirementsFor(brand, path.id)

  const subLine = [path.category, path.state, path.licenseExpiresOn ? `${path.deadlineLabel ?? 'Expires'} ${path.licenseExpiresOn}` : null]
    .filter(Boolean)
    .join(' · ')

  // Deadline / Time Remaining + On-Track status — mirrors the dashboard's
  // Current Learning Path card (LearnerFocusedBand) so the panel's Progress tab
  // reads consistently (Figma 2:4655).
  //
  // Time Remaining is state-aware: the progress-state personas carry
  // `weeksRemaining`; other callers fall back to the global tracker. It formats
  // via `timeRemaining()` (year+weeks → weeks → a day countdown under 30 days).
  const weeksLeft = path.weeksRemaining ?? LICENSE_TRACKER.weeksLeft
  const time = timeRemaining(weeksLeft)
  // License Expires — the path's own deadline (parsed from mm/dd/yyyy) so it
  // agrees with the sub-line + the Time Remaining countdown; the static tracker
  // is the fallback for paths without a date.
  const expires = parseExpiry(path.licenseExpiresOn) ?? {
    month: LICENSE_TRACKER.expires.month.charAt(0) + LICENSE_TRACKER.expires.month.slice(1, 3).toLowerCase(),
    day: LICENSE_TRACKER.expires.day,
    year: LICENSE_TRACKER.expires.year,
  }
  const expiresMonth = expires.month
  // Status band — the compliance state (On Track / At Risk / Off Track /
  // Completed / Expired / Not Started). Prefer the path's explicit
  // `statusOverride` (set on the progress-state personas) so the band shows the
  // intended state + color; otherwise derive a coarse pace state from
  // weeks/percent (unchanged for non-persona callers). Label follows the
  // `learning-paths-status-taxonomy` flag (compliance ⇄ status); color comes
  // from the shared `HOME_STATUS_META` so the band matches the Learning Paths
  // landing badges.
  const statusVariant = useFeatureFlag('learning-paths-status-taxonomy').variant === 'status'
  // Status Display exploration (`learning-path-status-display`, variant-only):
  //   • style: 'strip' (default — pill + message on a light status tint, no
  //     "Status" title) | 'band' (older neutral band) | 'callout' (alert card)
  //   • placement: 'above-tabs' (default — above the CTA + tabs, on every tab) |
  //     'in-progress' (inside the Progress tab, below the KPI row).
  const statusDisplay = useFeatureFlag('learning-path-status-display')
  const statusStyle: StatusStyle =
    statusDisplay.variant === 'band' || statusDisplay.variant === 'callout'
      ? statusDisplay.variant
      : 'strip'
  const statusAboveTabs = statusDisplay.secondaryVariant !== 'in-progress'
  const derivedStatus: HomeStatus =
    percent >= 50 || weeksLeft > 16 ? 'on-track' : weeksLeft >= 6 ? 'at-risk' : 'off-track'
  const homeStatus: HomeStatus = path.statusOverride ?? derivedStatus
  // Urgent compliance states — the ones with a real deadline pressure. Drives
  // the Time Remaining stat tile's status tint (reinforces the countdown).
  const urgentStatus =
    homeStatus === 'at-risk' || homeStatus === 'off-track' || homeStatus === 'expired'
  const urgentTone = urgentStatus ? STATUS_CALLOUT_TONE[homeStatus] : null
  // Expired path — the renewal deadline lapsed. Courses the learner never
  // started can no longer count toward this cycle, so their rows render
  // disabled (dimmed + inert) with a calendar-exclamation mark.
  const expiredPath = homeStatus === 'expired'
  const statusMeta = HOME_STATUS_META[homeStatus]
  const status = {
    label: statusLabel(homeStatus, statusVariant ? 'status' : 'compliance'),
    color: statusMeta.text,
    bg: statusMeta.bg,
    border: statusMeta.border,
    outline: statusMeta.outline,
    Icon: statusMeta.icon,
    // Generic copy — the path title already headlines the sheet, so the message
    // never repeats it (avoids the singular/plural title grammar wobble). An
    // empty path has no course list below, so the not-started "pick a course
    // below" line is swapped for an add-courses nudge.
    message: emptyPath
      ? 'Your path is set up. Add courses from the catalog to start making progress.'
      : statusMessageFor(homeStatus, firstName),
  }
  // The status treatment, resolved once so both placements render identically.
  const statusSection = <StatusSection style={statusStyle} status={status} homeStatus={homeStatus} />

  return (
    <>
      {/* Pinned header — close, title, sub-line, persistent CTA row. */}
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
        <button type="button" onClick={onClose} className="cre-link-action" style={closeStyle}>
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>{path.title}</h2>
        <p style={subStyle}>{subLine}</p>
        {/* Placement: above the Go to Learning Path CTA (and the tabs) — stays
            visible on both Progress and Requirements. */}
        {statusAboveTabs && <div style={{ margin: '2px 0 14px' }}>{statusSection}</div>}
        {/* The "Go to Learning Path" CTA navigates to another route, so it is
            suppressed in the locked kiosk share view (`?focus=1`).

            It is ALSO suppressed in the `requirements` view (2026-09-16, the
            direct ask). That view has one caller — QE Focused's "View
            Requirements" — and the page it opens over already carries "Open
            learning path" in the Study Journey widget, so this was a second
            door onto the same route, inside a sheet whose whole job is to state
            the requirements. The same second-door argument the version used to
            drop its Progress tab.

            Gated on `view`, NOT on `activeHalf`: in the tabbed view the CTA is
            documented as persistent across both tabs, so switching to the
            Requirements TAB must not make it disappear.

            WIDENED to every SINGLE-HALF view on 2026-09-17, when the course
            header band's new "View Details" made `progress` reachable for the
            first time — and it arrived carrying this button onto a version that
            has no learning-path concept at all, which is the decision the whole
            `onOpenLearningPath={qeFocused ? undefined : …}` withholding exists
            to hold. The two single-half views have one host between them (QE
            Focused) and it is the host that refuses the concept, so the test is
            "is a half being shown on its own", not "which half". */}
        {!focusMode && view === 'tabs' && (
          <div style={ctaRowStyle}>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/my-learning/path')
              }}
              style={primaryBtnStyle}
            >
              Go to Learning Path
            </button>
          </div>
        )}
      </div>

      {/* Tabs — only when the caller has not already chosen a half. */}
      {view === 'tabs' && (
      <div style={tabsRowStyle}>
        <TabButton active={tab === 'progress'} onClick={() => setTab('progress')}>
          Progress
        </TabButton>
        <TabButton active={tab === 'requirements'} onClick={() => setTab('requirements')}>
          Requirements
        </TabButton>
      </div>
      )}

      {/* Scrolling body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 40px' }}>
        {activeHalf === 'progress' ? (
          <>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 6 }}>
              <ProgressDonut
                percent={percent}
                size={104}
                {...(hasBreakdown ? { categories: cats } : {})}
              />
              {hasBreakdown && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CategoryBars categories={cats} />
                </div>
              )}
            </div>

            {/* KPI row — Deadline / Time Remaining / Completed (Figma 2:4655). */}
            <div style={statRowStyle}>
              <StatTile caption={deadlineLabel}>
                <span style={statValueStyle}>
                  {expiresMonth} {expires.day}
                </span>
                <span style={statSuffixStyle}> {expires.year}</span>
              </StatTile>
              <StatTile
                caption="Time Remaining"
                bg={urgentTone?.fill}
                border={urgentTone ? `1px solid ${urgentTone.accent}` : undefined}
                captionColor={urgentStatus ? status.color : undefined}
              >
                {time.expired ? (
                  <span style={statValueStyle}>Expired</span>
                ) : (
                  time.segments.map((seg, i) => (
                    <span key={seg.unit}>
                      <span style={statValueStyle}>{seg.value}</span>
                      <span style={statSuffixStyle}>
                        {' '}
                        {seg.unit}
                        {i < time.segments.length - 1 ? ', ' : ''}
                      </span>
                    </span>
                  ))
                )}
              </StatTile>
              <StatTile caption="Completed">
                <span style={statValueStyle}>{totalCompleted}</span>
                {/* THE THIRD hardcoded "hrs" in this file, all fixed together on
                    2026-09-17. "credit hrs" is a REGULATOR's unit and stays
                    that wording when the path is measured in hours — the 40 New
                    York requires really are credit hours. On a lessons path it
                    was printing "26 / 42 credit hrs" beside a band reading "26
                    of 42 lessons", which is the same figure in two units, one
                    of them wrong. */}
                <span style={statSuffixStyle}>
                  {' / '}
                  {(path.unitLabel ?? 'hrs') === 'hrs'
                    ? `${totalRequired || path.hours} credit hrs`
                    : unitCount(totalRequired || path.hours, path.unitLabel ?? 'hrs')}
                </span>
              </StatTile>
            </div>

            {/* Status — inside the Progress tab (default placement). */}
            {!statusAboveTabs && <div style={{ marginTop: 14 }}>{statusSection}</div>}

            {emptyPath ? (
              // No courses added yet — keep the requirement context (gauge / KPIs
              // / status) above and swap the course list for the same "Add your
              // first course" prompt the home-screen Jump Back In shows.
              <EmptyCourses
                onBrowse={() => {
                  onClose()
                  navigate('/catalog')
                }}
              />
            ) : multiCategory ? (
              // One dashed-leader section per category (QE multi-category paths).
              categorySections.map(({ cat, courses: catCourses }) => (
                <CourseList
                  key={cat.key}
                  label={cat.label}
                  typeLabel={cat.label}
                  breakdown={{ completed: cat.completed, required: cat.required }}
                  courses={catCourses}
                  onOpenCourse={openCourse}
                  expired={expiredPath}
                  unit={path.unitLabel ?? 'hrs'}
                />
              ))
            ) : (
              <>
                <CourseList
                  label={`${mandatoryLabel} courses`}
                  typeLabel={mandatoryLabel}
                  breakdown={mandatory}
                  courses={mandatoryCourses}
                  onOpenCourse={openCourse}
                  expired={expiredPath}
                  unit={path.unitLabel ?? 'hrs'}
                />
                <CourseList
                  label={`${electiveLabel} courses`}
                  typeLabel={electiveLabel}
                  breakdown={elective}
                  courses={electiveCourses}
                  onOpenCourse={openCourse}
                  expired={expiredPath}
                />
              </>
            )}
          </>
        ) : requirements ? (
          <>
            <div style={reqBoxStyle}>
              <dl style={reqGridStyle}>
                {/* Each fact renders only when the entry states it. A
                    pre-licensing licence has no renewal cycle and no
                    Mandatory / Elective split, and a `0` in either slot reads
                    as a stated requirement of zero rather than as "n/a" — the
                    blank-Seat-cell rule from the admin roster. */}
                <ReqFact label="Total hours required" value={String(requirements.totalHours)} />
                {requirements.mandatoryHours != null && (
                  <ReqFact label={`${mandatoryLabel} hours`} value={String(requirements.mandatoryHours)} />
                )}
                {requirements.electiveHours != null && (
                  <ReqFact label={`${electiveLabel} hours`} value={String(requirements.electiveHours)} />
                )}
                {(requirements.renewalCycleYears ?? 0) > 0 && (
                  <ReqFact label="Renewal cycle" value={`${requirements.renewalCycleYears} years`} />
                )}
                {path.licenseExpiresOn && <ReqFact label={deadlineLabel} value={path.licenseExpiresOn} />}
              </dl>
            </div>
            <p style={reqHeadStyle}>{requirements.heading}</p>
            <ul style={reqListStyle}>
              {requirements.items.map((item) => (
                <li key={item} style={reqItemStyle}>
                  {item}
                </li>
              ))}
            </ul>
            {requirements.sections?.map((section) => (
              <div key={section.title} style={reqSectionStyle}>
                <p style={reqSectionTitleStyle}>{section.title}</p>
                {section.intro && <p style={reqSectionIntroStyle}>{section.intro}</p>}
                <ul style={reqListStyle}>
                  {section.items.map((item) => (
                    <li key={item} style={reqItemStyle}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {requirements.note && (
              <p style={reqNoteStyle}>
                <strong style={{ fontWeight: 700 }}>Important</strong> — {requirements.note}
              </p>
            )}
          </>
        ) : (
          <p style={emptyStyle}>Renewal requirements aren’t available for this path yet.</p>
        )}
      </div>
    </>
  )
}

/* ─── Status section (strip ⇄ band ⇄ callout) ────────────────────────── */

export type StatusStyle = 'strip' | 'band' | 'callout'

type StatusInfo = {
  label: string
  color: string
  bg: string
  border: string
  outline?: boolean
  Icon?: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  message: string
}

/** Renders the compliance status one of three ways, all status-colored:
 *  - **strip** (default) — the status pill + message on a very light
 *    status-tinted strip, no "Status" title. Pairs with the urgent Time
 *    Remaining tint in the KPI row.
 *  - **band** — the older neutral bordered row (caption + pill + message).
 *  - **callout** — the color-coded alert card (Figma "2.0 — Learning Launcher"
 *    3700:3756 / 3772 / 3787 / 3802): colored left border + tinted fill + icon. */
function StatusSection({
  style,
  status,
  homeStatus,
}: {
  style: StatusStyle
  status: StatusInfo
  homeStatus: HomeStatus
}) {
  if (style === 'callout')
    return <StatusCallout homeStatus={homeStatus} label={status.label} message={status.message} />
  if (style === 'band') return <StatusBand status={status} />
  return <StatusStrip homeStatus={homeStatus} status={status} />
}

/**
 * Status strip — the pill + message on a very light status-tinted background,
 * with no "Status" title (the pill already names the state). The strip tint is
 * a lighter step than the callout fill so it reads as a calm lead-in; the pill
 * keeps the shared badge treatment (tinted fill / hairline outline for Not
 * Started + Expired) plus a leading status glyph.
 */
/**
 * Exported 2026-09-16 so `LearnerFocusedBand` renders THIS strip on its page
 * surface rather than a lookalike. The two sit one section apart on QE Focused
 * — the band's status directly above the Progress section's — so a copy would
 * have been two status treatments for one status, inches apart. Same argument
 * as `synthCategoryCourses` and the shared `TaskRow`.
 */
export function StatusStrip({
  homeStatus,
  status,
  bare = false,
}: {
  homeStatus: HomeStatus
  status: StatusInfo
  /**
   * Drop the tinted wash and the padding — the strip sits directly on whatever
   * is behind it.
   *
   * Added 2026-09-16 for the `stat-card` treatment, where the strip is INSIDE a
   * white card under its own rule: a tinted row inside a card reads as a second
   * card, and the card is already the surface. The pill keeps its tint, which
   * is what carries the state — the wash never did, and its own note in
   * CLAUDE.md records that it measures ~1.02:1 and is decoration.
   */
  bare?: boolean
}) {
  return (
    <div
      style={
        bare
          ? { display: 'flex', gap: 12, alignItems: 'flex-start' }
          : { ...calloutStyle, gap: 12, alignItems: 'center', background: STATUS_STRIP_BG[homeStatus] }
      }
    >
      <span
        style={{
          ...statusBadgeStyle,
          // Center the badge with the (possibly two-line) message instead of
          // top-aligning it (the shared badge style defaults to flex-start).
          alignSelf: 'center',
          flexShrink: 0,
          background: status.outline ? 'transparent' : status.bg,
          boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
          color: status.color,
        }}
      >
        {/* Uppercase on the bare treatment, matching the reference — a pill on
            a white card next to 15px values needs the extra weight that the
            tinted version got from its wash. */}
        {bare ? status.label.toUpperCase() : status.label}
      </span>
      <p style={stripMessageStyle}>{status.message}</p>
    </div>
  )
}

function StatusBand({ status }: { status: StatusInfo }) {
  return (
    <div style={statusBandStyle}>
      <div style={statusLeftStyle}>
        <span style={statusCaptionStyle}>Status</span>
        {/* Match the Current Learning Path widget's status pill badge
            (MarketingFocusedBand) — tinted fill + status-colored text. */}
        <span
          style={{
            ...statusBadgeStyle,
            // Outline statuses (Not Started, Expired) drop the tint fill for a
            // hairline border; filled statuses keep their tint.
            background: status.outline ? 'transparent' : status.bg,
            boxShadow: status.outline ? `inset 0 0 0 1px ${status.border}` : undefined,
            color: status.color,
          }}
        >
          {status.Icon && <status.Icon size={13} aria-hidden />}
          {status.label}
        </span>
      </div>
      <p style={statusMessageStyle}>{status.message}</p>
    </div>
  )
}

/**
 * Color-coded status callout — the 4 Figma alert designs (Success / Info /
 * Warning / Error) collapsed into one status-driven card. A colored left border
 * + tinted fill + a status glyph carry the color; the title (status label) and
 * message stay in the neutral text tokens for AA legibility on the tint (per the
 * Figma, where the title is Neutral/darkest, not the accent). The fill uses a
 * transparent color-mix (rather than the solid "lightest" token) so it adapts to
 * the rebrand dark theme, matching the rest of the status system.
 */
function StatusCallout({
  homeStatus,
  label,
  message,
}: {
  homeStatus: HomeStatus
  label: string
  message: string
}) {
  const tone = STATUS_CALLOUT_TONE[homeStatus]
  return (
    <div style={{ ...calloutStyle, background: tone.fill, borderLeft: `4px solid ${tone.accent}` }}>
      <span aria-hidden style={{ ...calloutIconStyle, color: tone.accent }}>
        <tone.Icon size={20} />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={calloutTitleStyle}>{label}</p>
        <p style={calloutBodyStyle}>{message}</p>
      </div>
    </div>
  )
}

type CalloutTone = {
  /** Left border + icon color. */
  accent: string
  /** Tinted fill (transparent color-mix so it adapts to the surface / dark theme). */
  fill: string
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
}

// Status → callout color. The Figma alert tokens map 1:1 to our functional
// ramps — Success #018937, Info #1fbdd2, Warning #f9b428, Error #cb0000.
// Completed reads as a success/green state; Off Track + Expired as error/red;
// Not Started as the informational teal.
const STATUS_CALLOUT_TONE: Record<HomeStatus, CalloutTone> = {
  'on-track': {
    accent: 'var(--color-success-500)',
    fill: 'color-mix(in srgb, var(--color-success-500) 14%, transparent)',
    Icon: CircleCheck,
  },
  completed: {
    accent: 'var(--color-success-500)',
    fill: 'color-mix(in srgb, var(--color-success-500) 14%, transparent)',
    Icon: CircleCheck,
  },
  'at-risk': {
    accent: 'var(--color-warning-500)',
    fill: 'color-mix(in srgb, var(--color-warning-500) 20%, transparent)',
    Icon: TriangleExclamation,
  },
  'off-track': {
    accent: 'var(--color-error-500)',
    fill: 'color-mix(in srgb, var(--color-error-500) 14%, transparent)',
    Icon: CircleExclamation,
  },
  expired: {
    accent: 'var(--color-error-600)',
    fill: 'color-mix(in srgb, var(--color-error-500) 12%, transparent)',
    Icon: CircleExclamation,
  },
  'not-started': {
    accent: 'var(--color-info-500)',
    fill: 'color-mix(in srgb, var(--color-info-500) 16%, transparent)',
    Icon: CircleInfo,
  },
}

// Very light status tint for the strip background — a lighter step than the
// callout fill so the strip reads as a calm lead-in banner (the pill carries
// the saturated status color).
/* ─── Course list ────────────────────────────────────────────────────── */

function CourseList({
  label,
  typeLabel,
  breakdown,
  courses,
  onOpenCourse,
  expired = false,
  unit = 'hrs',
}: {
  label: string
  /** Per-course category label shown in each row's meta (education-type-aware —
   *  e.g. "Required Courses" / "Products and Practices" instead of "Mandatory"). */
  typeLabel: string
  breakdown?: { completed: number; required: number }
  courses: CourseCardData[]
  onOpenCourse: (id: string) => void
  /** The path's renewal deadline has lapsed — not-started rows render disabled. */
  expired?: boolean
  /** The path's own unit — "hrs" or "lessons". Threaded rather than assumed:
   *  both this header and each row printed a hardcoded "hrs" until 2026-09-17. */
  unit?: string
}) {
  if (courses.length === 0) return null
  /* THE UNIT, not a hardcoded "hrs". This printed "26 / 42 HRS" on a path
     measured in LESSONS — the New York course, which is the only thing this
     panel shows on QE Focused. It has been wrong since the unit moved off
     hours, and it renders inches from the band that says "26 of 42 lessons". */
  const hrs = breakdown ? `${breakdown.completed} / ${breakdown.required} ${unit}` : ''
  return (
    <>
      {/* Section header: label · dashed leader · hours-right (Figma 312:2). */}
      <div style={sectionTitleStyle}>
        <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
        <span aria-hidden style={leaderStyle} />
        {hrs && <span style={{ whiteSpace: 'nowrap' }}>{hrs}</span>}
      </div>
      {courses.map((course) => (
        <CourseRow key={course.id} course={course} typeLabel={typeLabel} onOpen={onOpenCourse} expired={expired} unit={unit} />
      ))}
    </>
  )
}

function CourseRow({
  course,
  typeLabel,
  onOpen,
  expired = false,
  unit = 'hrs',
}: {
  course: CourseCardData
  typeLabel: string
  onOpen: (id: string) => void
  expired?: boolean
  /** The path's own unit. See the note on `CourseList`. */
  unit?: string
}) {
  const focusMode = useFocusMode()
  const status = course.status ?? 'not-started'
  // Expired path + never started → the course can't count toward this lapsed
  // cycle, so the row is disabled (inert + dimmed) and marked with the
  // calendar-exclamation glyph instead of the dashed "to-do" ring.
  const disabled = expired && status === 'not-started'
  const statusLabel =
    status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Not Started'
  // Same defect as the section header's: `unitCount` owns the singular, which
  // is why "1 lesson" does not read "1 lessons".
  const hoursLabel = unitCount(course.hours, unit)
  // Status mark — filled accent check (complete), accent-outline circle
  // (in progress), or dashed neutral circle (not started). (Figma 312:2.)
  const markStyle =
    status === 'completed'
      ? checkDoneStyle
      : status === 'in-progress'
        ? checkInProgressStyle
        : checkTodoStyle
  return (
    <div
      className="cre-lp-detail-course-row"
      style={courseRowStyle}
      role={disabled ? undefined : 'button'}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? undefined : `Open ${course.title}`}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : () => onOpen(course.id)}
      onKeyDown={
        disabled
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpen(course.id)
              }
            }
      }
    >
      {disabled ? (
        <span aria-hidden style={markExpiredStyle}>
          <CalendarExclamation size={18} />
        </span>
      ) : (
        <span aria-hidden style={markStyle}>
          {status === 'completed' && (
            <Check size={12} aria-hidden style={{ color: 'var(--color-text-inverse)' }} />
          )}
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cre-lp-detail-course-name" style={courseNameStyle}>
          {course.title}
        </span>
        {/* Plain meta: category · hours · status, divider-separated. An
            in-progress row appends its completion % and renders both the label
            and the % in semi-bold primary so the active course stands out. */}
        <span style={courseMetaStyle}>
          <span>{typeLabel}</span>
          <span aria-hidden style={metaDividerStyle} />
          <span>{hoursLabel}</span>
          <span aria-hidden style={metaDividerStyle} />
          <span style={status === 'in-progress' ? courseStatusActiveStyle : undefined}>
            {status === 'in-progress' && typeof course.progress === 'number'
              ? `${statusLabel} · ${Math.round(course.progress)}%`
              : statusLabel}
          </span>
        </span>
      </span>
      {/* Every completed row shows "View Certificate" flush to the right edge
          (aligned with the section header's hrs column); the hover chevron is
          dropped there since the link is the explicit action. Falls back to the
          Certificates page when a course carries no specific certificate link.
          Every non-complete row keeps the hover-revealed chevron affordance. */}
      {status === 'completed' ? (
        // Routes to the Certificates page — suppressed in the locked kiosk view.
        focusMode ? null : (
          <Link
            to={course.certificateHref ?? '/my-learning/certificates'}
            className="cre-link-action"
            style={certLinkStyle}
            onClick={(e) => e.stopPropagation()}
          >
            View Certificate
          </Link>
        )
      ) : disabled ? null : (
        <ChevronRight size={16} aria-hidden className="cre-lp-detail-course-chevron" />
      )}
    </div>
  )
}

/* ─── Empty state (no courses added yet) ─────────────────────────────── */

/** Progress-tab "no courses added yet" block (variant D — the approved design).
 *  The requirement context (gauge / KPIs / status) still renders above; this
 *  replaces the course LIST with a dashed placeholder that reads as "your
 *  courses will populate here". Copy is the shared `DISCOVERY_COPY.new` the
 *  home-screen Jump Back In shows for the empty-path persona, so the sheet and
 *  the dashboard tell one story. */
function EmptyCourses({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div style={emptyCoursesStyle}>
      <p style={emptyTitleStyle}>{DISCOVERY_COPY.new.heading}</p>
      <p style={emptyBodyStyle}>{DISCOVERY_COPY.new.body}</p>
      <button type="button" onClick={onBrowse} style={browseCtaStyle}>
        Browse Catalog
        <ArrowRight size={15} aria-hidden />
      </button>
    </div>
  )
}

/* ─── Tabs ────────────────────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        lineHeight: '21px',
        padding: '12px 2px 14px',
        marginBottom: -1,
        color: active ? 'var(--color-tab-active)' : 'var(--color-text-secondary)',
        borderBottom: `2px solid ${active ? 'var(--color-tab-active)' : 'transparent'}`,
      }}
    >
      {children}
    </button>
  )
}

/* ─── Progress KPI tile ──────────────────────────────────────────────── */

function StatTile({
  caption,
  children,
  bg,
  border,
  captionColor,
}: {
  caption: string
  children: ReactNode
  /** Optional surface override — used to tint the Time Remaining tile in the
   *  status color for the urgent compliance states (At Risk / Off Track /
   *  Expired). Falls back to the neutral tile treatment when unset. */
  bg?: string
  border?: string
  captionColor?: string
}) {
  return (
    <div style={{ ...statTileStyle, ...(bg ? { background: bg } : {}), ...(border ? { border } : {}) }}>
      <span style={{ ...statCaptionStyle, ...(captionColor ? { color: captionColor } : {}) }}>{caption}</span>
      <span style={{ display: 'flex', alignItems: 'baseline' }}>{children}</span>
    </div>
  )
}

/* ─── Requirements fact ──────────────────────────────────────────────── */

function ReqFact({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={{ color: 'var(--color-text-secondary)' }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 700, textAlign: 'right' }}>{value}</dd>
    </>
  )
}

const _MONTHS_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Parse an `mm/dd/yyyy` deadline into a short-month display triple; `null` for
 *  any other shape (the caller falls back to the global license tracker). */
function parseExpiry(date?: string): { month: string; day: number; year: number } | null {
  if (!date) return null
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim())
  if (!m) return null
  const monthIdx = Number(m[1]) - 1
  if (monthIdx < 0 || monthIdx > 11) return null
  return { month: _MONTHS_ABBR[monthIdx], day: Number(m[2]), year: Number(m[3]) }
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const closeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-action)',
}
const titleStyle: CSSProperties = {
  margin: '14px 0 4px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}
const subStyle: CSSProperties = {
  margin: '0 0 14px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}
const ctaRowStyle: CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 16px' }
const baseBtnStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  padding: '9px 14px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
}
const primaryBtnStyle: CSSProperties = {
  ...baseBtnStyle,
  border: '1px solid var(--color-primary-500)',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
}
// Full-bleed strip of two equal-width tabs (Figma 312:21 — each 240px = half
// the 480px panel, edge-to-edge with no gutter), centered labels.
const tabsRowStyle: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  padding: 0,
  borderBottom: '1px solid var(--color-border-subtle)',
}
// KPI row — Deadline / Time Remaining / Completed (Figma 2:4655).
const statRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  margin: '18px 0 0',
}
const statTileStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '12px 14px',
  background: 'var(--color-neutral-75)',
  border: '1px solid var(--color-neutral-100)',
  borderRadius: 'var(--radius-md)',
}
const statCaptionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}
const statValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}
const statSuffixStyle: CSSProperties = {
  marginLeft: 3,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}
// Status band (Figma 2:4655). Spacing is owned by the placement wrapper (the
// Progress-tab render or the above-tabs header slot), so no outer margin here.
const statusBandStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
  padding: '12px 14px',
  background: 'var(--color-neutral-75)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
}
// Color-coded status callout (Figma "2.0 — Learning Launcher" alert designs).
const calloutStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
}
const calloutIconStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  marginTop: 1,
}
const calloutTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}
const calloutBodyStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
// Status-strip message — the supporting line beside the pill (no title).
const stripMessageStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}
const statusLeftStyle: CSSProperties = {
  flexShrink: 0,
  width: 110,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}
const statusCaptionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const statusBadgeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}
const statusMessageStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
const sectionTitleStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--color-cta-800)',
  margin: '22px 0 12px',
}
// Dashed leader filling the gap between the section label and its hour count.
const leaderStyle: CSSProperties = {
  flex: 1,
  margin: '0 10px',
  borderTop: '1px dashed currentColor',
  opacity: 0.55,
}
const courseRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '11px 8px',
  margin: '0 -8px',
  borderBottom: '1px solid var(--color-neutral-100)',
}
const checkBaseStyle: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
// Completed = filled primary check; in progress = primary-outline ring;
// not started = dashed neutral ring (Figma 312:2).
const checkDoneStyle: CSSProperties = { ...checkBaseStyle, background: 'var(--color-primary-500)' }
const checkInProgressStyle: CSSProperties = {
  ...checkBaseStyle,
  border: '2px solid var(--color-primary-500)',
}
const checkTodoStyle: CSSProperties = { ...checkBaseStyle, border: '2px dashed var(--color-neutral-400)' }
// Expired + not-started mark — the calendar-exclamation glyph (deadline lapsed)
// in a muted warning tone, replacing the dashed to-do ring. No circle border;
// the icon carries the meaning. Sized to sit in the same 20px mark column.
const markExpiredStyle: CSSProperties = {
  width: 20,
  height: 20,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-warning-600)',
}
const courseNameStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}
const courseMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-tertiary)',
}
const metaDividerStyle: CSSProperties = {
  flexShrink: 0,
  width: 1,
  height: 11,
  background: 'var(--color-border-subtle)',
}
// In-progress status + percentage — semi-bold primary so the active course
// reads at a glance against the neutral meta line.
const courseStatusActiveStyle: CSSProperties = {
  fontWeight: 600,
  color: 'var(--color-primary-600)',
}
const certLinkStyle: CSSProperties = {
  flexShrink: 0,
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-action)',
  textDecoration: 'none',
}
const reqBoxStyle: CSSProperties = {
  background: 'var(--color-neutral-75)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
}
const reqGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  gap: '6px 12px',
  margin: 0,
}
const reqHeadStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  margin: '16px 0 8px',
  color: 'var(--color-text-primary)',
}
// No bullets — the board's rules read as plain lines (Figma node 312:518).
const reqListStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }
const reqItemStyle: CSSProperties = {
  marginBottom: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}
// Titled sub-section (e.g. "First renewal — salesperson") below the summary.
const reqSectionStyle: CSSProperties = { marginTop: 18 }
const reqSectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  margin: '0 0 4px',
  color: 'var(--color-text-primary)',
}
const reqSectionIntroStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  margin: '0 0 8px',
  color: 'var(--color-text-secondary)',
}
// Closing caveat — a warning-tinted note with an accent left border.
const reqNoteStyle: CSSProperties = {
  margin: '18px 0 0',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  borderLeft: '3px solid var(--color-warning-500)',
  background: 'var(--color-warning-100)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-warning-700)',
}
const emptyStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-tertiary)',
}
// Progress-tab "no courses added yet" block (variant D). A dashed-border
// placeholder sitting below the requirement context, in place of the course
// list — the dashed frame signals that the Mandatory / Elective courses will
// populate this slot once the learner enrolls.
const emptyCoursesStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 8,
  margin: '22px 0 0',
  padding: '28px 24px',
  background: 'transparent',
  border: '1.5px dashed var(--color-neutral-300)',
  borderRadius: 'var(--radius-md)',
}
const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 17,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}
const emptyBodyStyle: CSSProperties = {
  margin: 0,
  maxWidth: '38ch',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}
// Magenta CTA (matches the dashboard empty-path band's Browse Catalog action).
const browseCtaStyle: CSSProperties = {
  ...baseBtnStyle,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 6,
  border: '1px solid var(--color-cta-500)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
}
