import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  AngleRightSolid,
  BookOpen,
  FileCertificateLight,
  LockRegular,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasCourseProgressStates, type ProgressStage } from './AtlasCourseProgressStates'
import { AtlasExamDateCard } from './AtlasExamDateCard'
import { ATLAS_HOME_REFRESH } from '@/components/layout/atlasHomeRefresh'
import { AtlasReadinessCard } from './AtlasReadinessCard'
import { useFeatureFlag, useFeatureFlags, useCourseDemo } from '@/context/FeatureFlagContext'
import { type AtlasCourseTab } from './AtlasCourseTabs'
import { applyJourneySequencing, journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
import { WHITE_COURSES, WHITE_COURSE_PARAM, WHITE_FIRST_COURSE_ID, whiteCourseFor } from '@/data/atlasWhiteCourses'
import { defaultPreset, formatPaceDate, studyPace, daysUntil, NOT_STARTED_NIGHTS } from '@/lib/studyPace'
import type { LearningPathSummary } from '@/data/learningFixtures'

/**
 * ⚠ HOME V3 — a COPY of `AtlasHomeEricV2` (Eric/Atlas V2's Home) made
 * 2026-10-07 (Eric's request: "duplicate home and create a V3 in the feature
 * flags" — then, the same day, "add it to my Demo controls dashboard section"
 * instead). Rendered on `?version=eric-atlas-v3`, Eric/Atlas V3's Dashboard
 * Version. NEW HOME WORK FOR V3 GOES IN THIS FILE. Its classes are V2's (e.g. `cre-atlas-home-v2-course-title`), so
 * the tokens.css rules written for V2's Home apply here too until V3 is given
 * its own.
 *
 * The V2 copy's notes follow, unchanged.
 */
/**
 * ⚠ ERIC/ATLAS V2's HOME — a COPY of `AtlasHomeV2` made 2026-10-07 (Eric's
 * request: "duplicate this home page as V2 and add it to my dashboard
 * versions"). Rendered only on `?version=eric-atlas-v2`; Eric/Atlas V1 and the
 * Atlas/Compass parent keep `AtlasHomeV2`, so V1's Home stays as it was on this
 * date. NEW HOME WORK FOR V2 GOES IN THIS FILE. The two share everything
 * outside it (tokens, the course tabs, the links card, the shell), so a change
 * there still reaches both.
 *
 * The original's notes follow, unchanged.
 */
/**
 * ATLAS HOME, V2 — Figma "Atlas-Compass-Global-Navigation" node 161:662,
 * 2026-10-02, the designer's request: "Replace this home page content and
 * layout with the attached Figma file. Keep the old layout as a V1 Home Page
 * version." The flag is `atlas-home-layout` (v1 = the earlier Atlas home,
 * v2 = this); `LearnerFocusedBand` renders this in place of its Atlas layout.
 *
 * ONE CARD, NOT FIVE. The course, its figures, the pace and the journey sit in
 * a single course card on the left; a narrow column on the right carries the
 * exam-date question and a list of other destinations.
 *
 *   - The three FIGURES (expected completion, days to review, course access)
 *     come from the same pace model the Study Pace card uses
 *     (`studyPace` → `defaultPreset`), so the two layouts cannot disagree.
 *   - The DIAL is the course's own progress (`percent`, the band's figure).
 *   - The JOURNEY is `journeyStopsFor(path)`, the rail's own stops; the current
 *     stop carries Begin Course, the others a chevron into the stop.
 *   - Yes / No on the exam-date card are NOT WIRED yet, as on V1's banner.
 *
 * Departures: Open Sans for the design's Open Sans (same), DM Serif Display
 * through `--font-heading-serif` (the Headings dropdown still swaps it), and
 * every colour a token — the design's steel #3D5A73 is the brand's button
 * colour, its warm rules the Atlas rail rule, its pale panel the brand's
 * Study Pace tint.
 */
/* THE LONG REFERENCE TITLE (2026-10-07, Eric's request) — shown on V2's Home,
   on the current course's tab and heading, while the `atlas-home-long-title`
   design control is on (off by default). Display only: the course behind it
   (figures, journey, cover, Begin Course) is still the fixture (`path`). */
const V2_LONG_TITLE = 'New York Property and Casualty Conversion Course Pre-licensing and Live Review Class'



export type AtlasHomeEricWhiteProps = {
  path: LearningPathSummary
  courseTitle: string
  coverUrl?: string | null
  /** The course's progress, 0–100 — the band's own figure. */
  percent: number
  /** Pace-model inputs, exactly as the band hands them to `StudyPaceTile`. */
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  examDate?: string
  notStarted?: boolean
  onBegin?: () => void
  onOverview?: () => void
  onOpenStop?: (courseId: string) => void
  onOpenStep?: (id: string) => void
  onOpenRequirements?: () => void
  /** The learner's ACTIVE courses, for the tab strip above the title. Two or
   *  more shows the strip; one hides it. Unset = this course plus the demo's
   *  invented second course (below). */
  courses?: AtlasCourseTab[]
  onSelectCourse?: (id: string) => void
  /** "All courses ›" — defaults to the same destination as the side card's
   *  My Courses link (`section=courses`). */
  onAllCourses?: () => void
}


/* ERIC/ATLAS WHITE's HOME (2026-10-12, Eric: "duplicate Eric/Atlas WIP and
   rename it Eric/Atlas White") — a straight copy of AtlasHomeEricV3 that day,
   so it can change here without changing WIP. It still reads WIP's Design-bar
   flags (Progress, Link tiles, …), which are shared by both versions. */
export function AtlasHomeEricWhite({
  path,
  courseTitle,
  coverUrl,
  percent,
  today,
  hoursRemaining,
  accessExpiresAt,
  examDate,
  notStarted = false,
  onBegin,
  onOverview,
  onOpenStop,
  onOpenStep,
  onOpenRequirements,
  courses,
}: AtlasHomeEricWhiteProps) {
  const [, setParams] = useSearchParams()
  const go = (section: string, coursePage?: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', section)
      if (coursePage) next.set('coursePage', coursePage)
      else next.delete('coursePage')
      return next
    })

  /* THE FIGURES — the pace model, as the Study Pace card computes it. */
  const model = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate,
        nights: notStarted ? NOT_STARTED_NIGHTS : undefined,
      }),
    [today, hoursRemaining, accessExpiresAt, examDate, notStarted],
  )
  const preset = defaultPreset(model)
  const accessDays = accessExpiresAt ? Math.max(0, daysUntil(accessExpiresAt, today) ?? 0) : null

  // V3 drops the Attestation & Affidavit stop on every progress stage
  // (2026-10-09, Eric's request). The stop still exists in the shared journey.
  const { regulated } = useCourseDemo()
  /* REGULATED SEQUENCING (2026-10-15) — Step 1's stops lock behind the one
     the learner may open next. The rule lives in `applyJourneySequencing`,
     not here, so every drawing of this journey agrees. Unregulated returns
     the same array. */
  const stops = applyJourneySequencing(
    journeyStopsFor(path).filter((s) => s.id !== 'attestation-and-affidavit'),
    regulated,
  )
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
  const pass = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 2]
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]
  const state = jurisdictionName(path.state)
  const longTitle = useFeatureFlag('atlas-home-long-title').enabled
  // The Design bar's Progress (V3 only, 2026-10-09) — which module state and figure.
  const progressPick = useFeatureFlag('atlas-v3-progress').variant ?? 'not-started'
  // The Design bar's Link tiles (V3 only, 2026-10-09) — Stacked (default) or Inline.
  const stackedTiles = (useFeatureFlag('atlas-v3-link-tiles').variant ?? 'stacked') !== 'inline'
  const progress = V3_PROGRESS[progressPick] ?? V3_PROGRESS['not-started']
  // COMPLETED (Design bar's Progress = Completed 100%, 2026-10-09, Eric): no
  // Course progress card, and Step 1 becomes the Congratulations block.
  const completedView = progressPick === 'completed'
  const dropdownNav = useFeatureFlag('atlas-white-top-nav').variant === 'dropdown'
  // The exam-date card is at least as tall as the course header beside it
  // (2026-10-12, Eric's request) — measured, so a two-line title still matches.
  const headRef = useRef<HTMLElement>(null)
  const [headH, setHeadH] = useState<number | undefined>(undefined)
  useEffect(() => {
    const el = headRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Clicking the Course progress card steps the Design bar's Progress itself
  // (2026-10-09, Eric: "trigger the same corresponding screens that the
  // progress dropdown tool does"), so Step 1, Readiness and the Completed view
  // all follow. NB the card is hidden on Completed — the dropdown leaves it.
  const { setVariant } = useFeatureFlags()
  // The Top Nav's Home button starts the demo cards over (2026-10-12): Progress
  // back to Not Started (Readiness follows), and every card remounts.
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const onRefresh = () => {
      setVariant('atlas-v3-progress', 'not-started')
      setRefreshKey((k) => k + 1)
    }
    window.addEventListener(ATLAS_HOME_REFRESH, onRefresh)
    return () => window.removeEventListener(ATLAS_HOME_REFRESH, onRefresh)
  }, [setVariant])
  const advanceProgress = () =>
    setVariant('atlas-v3-progress', V3_PROGRESS_ORDER[(V3_PROGRESS_ORDER.indexOf(progressPick) + 1) % V3_PROGRESS_ORDER.length])
  const currentTitle = longTitle ? V2_LONG_TITLE : courseTitle
  const tabs: AtlasCourseTab[] =
    courses ?? WHITE_COURSES.map((c, i) => (i === 0 ? { id: c.id, title: currentTitle, coverUrl } : c))
  // No course tabs on White (Figma 312:1650): the LEFT RAIL — and the Top Nav's
  // My Courses dropdown — pick the course (2026-10-12), via `?whiteCourse=`.
  // The title and cover swap; everything else is the first course's.
  const [searchParams] = useSearchParams()
  const activeTabId = whiteCourseFor(searchParams.get(WHITE_COURSE_PARAM))
  const setActiveTabId = (id: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === WHITE_FIRST_COURSE_ID) next.delete(WHITE_COURSE_PARAM)
      else next.set(WHITE_COURSE_PARAM, id)
      return next
    })
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const shownTitle = activeTab?.title ?? currentTitle
  const shownCover = activeTab?.coverUrl ?? coverUrl

  return (
    // THE LEFT RAIL, 48 to the left of the page (Figma 312:1782, 2026-10-12,
    // Eric's request): My Active Courses and My Certificates.
    <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'flex-start' }}>
    {/* No rail when the Top Nav is the Dropdown (2026-10-12, Eric): the
        dropdown picks the course instead. */}
    {dropdownNav ? null : (
    <WhiteLeftRail
      courses={tabs.map((t) => ({ id: t.id, title: t.title, expires: WHITE_COURSES.find((c) => c.id === t.id)?.expires }))}
      activeId={activeTab?.id ?? WHITE_FIRST_COURSE_ID}
      onSelect={setActiveTabId}
      onCourses={() => go('courses')}
      onCertificates={() => go('certificates')}
    />
    )}
    <div style={WHITE_PAGE}>
      {/* ── THE COURSE HEADER, on its own Primary 100 panel — Figma 312:1650
          (2026-10-12, Eric's request for Eric/Atlas White). No course tabs, no
          outer card: the image (130 wide, 8 radius) beside the eyebrow and
          title, then Course Overview under the image and Begin Course at the
          right. The tabs' data still feeds the title and cover. ── */}
      <section ref={headRef} aria-label="Current course" style={WHITE_HEAD}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
          {shownCover ? (
            <span aria-hidden style={WHITE_COVER_FRAME}>
              <img src={shownCover} alt="" style={COVER} />
            </span>
          ) : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
            <p style={EYEBROW}>Current course:</p>
            <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
              {shownTitle}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {onOverview ? (
            <button
              type="button"
              className="cre-compass-secondary cre-atlas-home-secondary"
              onClick={onOverview}
              style={{ ...HEADER_BUTTON, fontWeight: 500, width: 130, flex: 'none' }}
            >
              Course Overview
            </button>
          ) : null}
          <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="cre-compass-primary cre-compass-btn-primary"
              onClick={onBegin}
              disabled={!onBegin}
              style={HEADER_BUTTON}
            >
              {/* "Resume Course" once the Design bar's Progress is past 0% (2026-10-12,
                  Eric's request). */}
              {progressPick === 'not-started' ? 'Begin Course' : 'Resume Course'}
            </button>
          </div>
        </div>
      </section>

      {/* ── BELOW IT, Figma 312:1663's layout: a 260 left column of the cards,
          48 to the steps. The cards and how they drive the steps are WIP's. ── */}
        {/* 32 either side of a vertical rule now (2026-10-12, Eric's request;
            48 with no rule before). The row stretches, so the rule runs the
            height of whichever column is taller. */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'stretch', paddingTop: 24 }}>
          {/* Left: V3's COLUMN, 235 wide — Figma 254:7973 (2026-10-08, Eric's
              request; it was the 200-wide Course progress panel alone). Two
              link tiles (certificates, courses), the Course progress panel
              restyled, and a READINESS card with a half-dial. */}
          <div style={{ width: 260, flex: 'none', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* THE COURSE PROGRESS MODULE — Figma 267:8267's five states, in
                place of the Course progress panel (2026-10-08, Eric's
                request). Click it to flip the states. Hidden on the Completed
                view (2026-10-09). */}
            {completedView ? null : (
            <AtlasCourseProgressStates
              key={`progress-${progressPick}-${refreshKey}`}
              initialStage={progress.stage}
              onAdvance={advanceProgress}
              percent={progress.percent ?? percent}
              milestonePercent={75}
              expected={{
                // "Nov. 5" where the pace model has no finish date — a DEMO date.
                value: preset.state === 'no' ? 'Nov. 5' : formatPaceDate(preset.finishIso),
                note: 'At current pace',
              }}
              access={
                accessDays != null && accessExpiresAt
                  ? { value: `${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`, note: `Ends ${formatPaceDate(accessExpiresAt)}` }
                  : null
              }
            />
            )}
            {/* The READINESS card, under the module (Figma 254:8012, 2026-10-08). */}
            {/* On the Completed view it opens on Proficient (2026-10-09, Eric). */}
            {/* Clicking it at Exam Ready takes the page back to Not Started 0%
                (2026-10-09, Eric). */}
            {/* …and it follows the Progress stage (2026-10-09, Eric: "the
                readiness module is not changing when the progress changes"). */}
            {/* Its own key prefix: the two cards are siblings, and a SHARED key
                left orphaned copies of the progress card on screen. */}
            <AtlasReadinessCard
              key={`readiness-${progressPick}-${refreshKey}`}
              initialLevel={V3_READINESS_FOR[progressPick] ?? 0}
              onPastLast={() => setVariant('atlas-v3-progress', 'not-started')}
            />
            {/* The link tiles at the BOTTOM of the column (2026-10-09, Eric's
                request; they led it). */}
            {/* The link tiles only with the Dropdown Top Nav (2026-10-12, Eric's
                request): on Static and Home Only the left rail already carries
                the courses and certificates. */}
            {/* …and on the Dropdown, ONE tile (2026-10-12, Eric's request): the
                courses tile went (the dropdown lists them); the certificates
                tile fills the column, icon beside a one-line label. */}
            {!dropdownNav ? null : (
              <button type="button" className="cre-atlas-link-tile" onClick={() => go('certificates')} aria-label="View certificates" style={WHITE_CERT_TILE}>
                <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--color-primary-500)' }}>
                  {/* 20% under the stacked tile's 30 → 24 (2026-10-12, Eric). */}
                  <FileCertificateLight size={24} style={{ width: 27 }} aria-hidden />
                </span>
                {/* DEMO COUNT, the design's figure. */}
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '14px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                  <strong style={{ fontWeight: 700 }}>3</strong> Certificates available
                </span>
              </button>
            )}
            {/* The two-tile versions, unwired on White 2026-10-12 — kept; set
                SHOW_TWO_LINK_TILES to bring them back (on the Dropdown only). */}
            {!(SHOW_TWO_LINK_TILES && dropdownNav) ? null : stackedTiles ? (
              /* STACKED (Figma 269:8778, the default since 2026-10-09). DEMO
                 COUNTS as below. */
              <div style={{ display: 'flex', gap: 8 }}>
                <StackedTile
                  icon={<FileCertificateLight size={30} style={{ width: 34 }} aria-hidden />}
                  count={3}
                  noun="Certificates"
                  second="available"
                  label="View certificates"
                  onView={() => go('certificates')}
                  width={114}
                />
                <StackedTile
                  icon={<BookOpen size={30} aria-hidden />}
                  count={tabs.length}
                  noun="Active"
                  second={tabs.length === 1 ? 'course' : 'courses'}
                  label="View courses"
                  onView={() => go('courses')}
                />
              </div>
            ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              {/* INLINE — the 2026-10-08 tiles, now the alternative.
                  DEMO COUNTS — "3 Certificates" is the design's figure, not a
                  fixture's; "2 Courses" is the course tabs' count. */}
              <LinkTile
                icon={<FileCertificateLight size={26} style={{ width: 29 }} aria-hidden />}
                count={3}
                noun="Certificates"
                onView={() => go('certificates')}
              />
              <LinkTile
                icon={<BookOpen size={26} aria-hidden />}
                count={tabs.length}
                noun={tabs.length === 1 ? 'Course' : 'Courses'}
                onView={() => go('courses')}
                grow
              />
            </div>
            )}
          </div>

          <span aria-hidden style={{ width: 1, flex: 'none', alignSelf: 'stretch', background: 'var(--color-primary-100)' }} />

          {/* Right: the journey. */}
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 335, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {completedView ? (
              /* STEP 1 ON THE COMPLETED VIEW — Figma 297:247 (2026-10-09,
                 Eric's request): the eyebrow, "Congratulations!" and a line in
                 place of the journey's stops. */
              <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <p style={STEP_EYEBROW}>
                  <span style={{ fontWeight: 700 }}>Step 1</span>
                  <span style={{ fontWeight: 600 }}> · Study Journey</span>
                </p>
                <p style={STEP_TITLE}>Congratulations!</p>
                <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>
                  You’ve completed your course and passed your course exams.{' '}
                  <span style={{ fontWeight: 600 }}>Time to get ready for your state exam!</span>
                </p>
              </section>
            ) : (
            /* 16px less under the last stop (2026-10-09, Eric: -24, then 8
               back) — its 36px row floor plus the list padding left 45 to the
               rule; now 29. */
            <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: -16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p style={STEP_EYEBROW}>
                  <span style={{ fontWeight: 700 }}>Step 1</span>
                  <span style={{ fontWeight: 600 }}> · Study Journey</span>
                </p>
                <p style={STEP_TITLE}>Complete Coursework</p>
              </div>
              <ol style={{ listStyle: 'none', margin: 0, padding: '3px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stops.map((stop, i) => (
                  <JourneyRow
                    key={stop.id}
                    stop={stop}
                    current={i === currentIdx}
                    last={i === stops.length - 1}
                    onOpen={onOpenStop ? () => onOpenStop(stop.id) : undefined}
                    // On Track 14% only (2026-10-09, Eric): the current stop
                    // shows how far through it is and what is next (Figma
                    // 265:8145). DEMO figures and chapter, the design's own.
                    // Not Started and Milestone get the Next line alone (same
                    // day); the chapters are Eric's, per stage.
                    progressDetail={
                      i !== currentIdx
                        ? undefined
                        : progressPick === 'on-track'
                          ? { done: 4, total: 13, nextLabel: 'Chapter 4', nextName: 'Legal Concepts of Insurance' }
                          : progressPick === 'not-started'
                            ? { done: 1, total: 13, nextLabel: 'Chapter 1', nextName: 'Basic Principles of Life and Health Insurance' }
                            : progressPick === 'milestone'
                              ? { done: 9, total: 13, nextLabel: 'Chapter 9', nextName: 'Annuities' }
                              : undefined
                    }
                  />
                ))}
              </ol>
            </section>
            )}

            <span aria-hidden style={RULE} />
            <Step
              number={2}
              title={pass.title}
              detail={pass.detail}
              link={pass.detailLabel ?? 'What to expect'}
              onLink={onOpenStep ? () => onOpenStep(pass.id) : undefined}
            />
            <span aria-hidden style={RULE} />
            <Step
              number={3}
              title={state ? `Get Licensed in ${state}` : 'Get Licensed'}
              detail={apply.detail}
              link={apply.detailLabel ?? 'How to apply'}
              onLink={onOpenStep ? () => onOpenStep(apply.id) : undefined}
            />
            {onOpenRequirements ? (
              <button
                type="button"
                data-cta-id="home.state-requirements"
                className="cre-compass-secondary"
                onClick={onOpenRequirements}
                style={REQUIREMENTS}
              >
                {state ? `${state} State Requirements` : 'State Requirements'}
              </button>
            ) : null}
          </div>
        </div>
    </div>
    {/* THE EXAM-DATE CARD in a RIGHT RAIL beside the page (2026-10-12, Eric's
        request; both Top Nav versions): Figma 224:4118's card with all its
        states — Default, No, Yes (the calendar), Set — as WIP has it. */}
    {/* 32 from the page (the row's 48, less 16), as WIP's side column sits. */}
    <aside aria-label="State exam" style={{ width: 260, flex: 'none', marginLeft: -16 }}>
      <AtlasExamDateCard key={refreshKey} stateName={state} style={{ minHeight: headH }} />
    </aside>
    </div>
  )
}



/* THE WHITE LEFT RAIL (Figma 312:1782): 185 wide. MY ACTIVE COURSES — every
   course with its expiry; the ACTIVE one in Bold with a chevron and no hover,
   the others SemiBold on hover and a click makes them active (the header's
   title and cover follow) — then View All Courses; MY CERTIFICATES with the
   count. DEMO: the other two courses and every "Expires in" are the design's. */
function WhiteLeftRail({
  courses,
  activeId,
  onSelect,
  onCourses,
  onCertificates,
}: {
  courses: { id: string; title: string; expires?: string }[]
  activeId: string
  onSelect: (id: string) => void
  onCourses: () => void
  onCertificates: () => void
}) {
  return (
    <aside aria-label="My courses and certificates" style={{ width: 185, flex: 'none', display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section aria-label="My active courses" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={RAIL_EYEBROW}>My active courses</p>
          <span aria-hidden style={{ display: 'block', height: 1, background: 'var(--color-atlas-slate-100)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map((c, i) => (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {i > 0 ? <span aria-hidden style={{ display: 'block', height: 1, background: 'var(--color-primary-100)' }} /> : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.id === activeId ? (
                  <span aria-current="true" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ ...RAIL_COURSE, flex: '1 1 0', minWidth: 0, fontWeight: 700 }}>{c.title}</span>
                    <AngleRightSolid size={14} aria-hidden style={{ color: 'var(--color-primary-500)', flex: 'none' }} />
                  </span>
                ) : (
                  <button type="button" className="cre-white-rail-course" onClick={() => onSelect(c.id)} style={{ ...RAIL_BUTTON, ...RAIL_COURSE }}>
                    {c.title}
                  </button>
                )}
                <RailExpiry days={c.expires ?? WHITE_COURSES[0].expires} />
              </div>
            </div>
          ))}
          <button type="button" className="cre-compass-v2-link" onClick={onCourses} style={{ ...RAIL_BUTTON, alignSelf: 'flex-end', display: 'inline-flex', alignItems: 'center', gap: 4, ...RAIL_COURSE, fontWeight: 500 }}>
            View All Courses
            <AngleRightSolid size={14} aria-hidden />
          </button>
        </div>
      </section>
      <section aria-label="My certificates" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={RAIL_EYEBROW}>My certificates</p>
          <span aria-hidden style={{ display: 'block', height: 1, background: 'var(--color-primary-100)' }} />
        </div>
        <button type="button" className="cre-compass-v2-link" onClick={onCertificates} aria-label="View certificates, 3 available" style={{ ...RAIL_BUTTON, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ ...RAIL_COURSE, flex: '1 1 0', fontWeight: 500, color: 'var(--color-primary-600)', textAlign: 'left' }}>Certificates available</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {/* DEMO COUNT, as the tile's. */}
            <span style={{ ...RAIL_COURSE, fontWeight: 700, color: 'var(--color-text-primary)' }}>3</span>
            <AngleRightSolid size={14} aria-hidden style={{ color: 'var(--color-primary-500)' }} />
          </span>
        </button>
      </section>
    </aside>
  )
}
function RailExpiry({ days }: { days: string }) {
  return (
    <span style={{ display: 'flex', gap: 4, fontFamily: 'var(--font-body)', fontSize: 10, lineHeight: '14px', color: 'var(--color-text-secondary)' }}>
      Expires in: <strong style={{ fontWeight: 600 }}>{days}</strong>
    </span>
  )
}
const RAIL_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '1.76px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  color: 'var(--color-atlas-tan-700)',
}
const RAIL_COURSE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-primary-500)',
}
const RAIL_BUTTON: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}

function JourneyRow({
  stop,
  current,
  last,
  onOpen,
  progressDetail,
}: {
  stop: JourneyStop
  current: boolean
  last: boolean
  onOpen?: () => void
  progressDetail?: { done?: number; total?: number; nextLabel: string; nextName: string }
}) {
  if (current && progressDetail) {
    // "Pre-Licensing Lessons (42)" → the name, and 42 as the total.
    // With no `done`, the title stays whole ("Pre-Licensing Lessons (42)").
    const m = progressDetail.done == null ? null : stop.title.match(/^(.*?)\s*\((\d+)\)$/)
    const name = m ? m[1] : stop.title
    // The count is of CHAPTERS ("4 of 13", 2026-10-09), not the 42 lessons.
    const total = progressDetail.total ?? (m ? m[2] : null)
    return (
      <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: 7 }}>
          <span style={MARK_CURRENT} />
          {last ? null : <span style={SPINE} />}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ ...BODY_TEXT, padding: '5px 0 3px', fontSize: 13, lineHeight: '18px', fontWeight: 600, color: 'var(--color-atlas-home-current-stop, var(--color-compass-page-button))' }}>
            {name}
            {total ? (
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-primary-900)' }}>
                {'  ('}
                <strong style={{ fontWeight: 600 }}>{progressDetail.done}</strong> of <strong style={{ fontWeight: 600 }}>{total}</strong> completed)
              </span>
            ) : null}
          </span>
          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4, paddingBottom: 6, minWidth: 0 }}>
            <span style={NEXT_PILL}>Next</span>
            {/* Wraps (a long chapter title ran out of room at one line). */}
            <span style={{ ...BODY_TEXT, fontSize: 11, lineHeight: '14px', paddingTop: 2, color: 'var(--color-primary-900)', minWidth: 0 }}>
              {progressDetail.nextLabel} - {/* the chapter's NAME in SemiBold, its label not (2026-10-09, Eric) */}
              <span style={{ fontWeight: 600 }}>{progressDetail.nextName}</span>
            </span>
          </span>
        </span>
      </li>
    )
  }
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 42 : 36 }}>
      <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: current ? 7 : 3 }}>
        {/* ⚠ THE LOCK REPLACES THE RING, ON THE LEFT — 2026-10-15, the direct
            ask ("show the small gray lock icon on the left instead of the
            outline circle"). A lock on the RIGHT is what this row used to
            carry and what was removed on 2026-10-06; this is the other side
            and a different claim. The ring says "not reached yet", the
            padlock says "not yours to open", and they occupy one slot
            because a row is in exactly one of those states. */}
        {current ? (
          <span style={MARK_CURRENT} />
        ) : stop.locked ? (
          <LockRegular size={12} aria-hidden style={LOCK_MARK} />
        ) : (
          <span style={MARK} />
        )}
        {last ? null : <span style={SPINE} />}
      </span>
      <span
        style={{
          ...BODY_TEXT,
          flex: '1 1 0',
          minWidth: 0,
          fontSize: 13,
          lineHeight: '18px',
          paddingTop: current ? 5 : 0,
          fontWeight: current ? 600 : 400,
          color: current ? 'var(--color-atlas-home-current-stop, var(--color-compass-page-button))' : 'var(--color-text-secondary)',
        }}
      >
        {stop.title}
      </span>
      {/* The current stop carries no button — Begin Course moved up beside
          the course title (2026-10-06). */}
      {/* UPCOMING stops show NOTHING on the right (2026-10-06, the designer's
          request: the lock icons removed). They were locked from 2026-10-05 —
          the FA lock (`LockRegular`, still in the icon registry), not a button;
          before that, the open chevron. Still not openable. */}
      {current ? null : stop.status === 'not-started' ? null : onOpen ? (
        <button type="button" className="cre-compass-v2-link" onClick={onOpen} aria-label={`Open ${stop.title}`} style={CHEVRON}>
          <AngleRightRegular size={13} aria-hidden style={{ color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }} />
        </button>
      ) : null}
    </li>
  )
}

function Step({
  number,
  title,
  detail,
  link,
  onLink,
}: {
  number: number
  title: string
  detail?: string
  link: string
  onLink?: () => void
}) {
  return (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <p style={{ ...STEP_EYEBROW, fontWeight: 700 }}>Step {number}</p>
        <p style={STEP_TITLE}>{title}</p>
      </div>
      {detail ? <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>{detail}</p> : null}
      {onLink ? (
        <button type="button" className="cre-compass-v2-link" onClick={onLink} style={LINK}>
          {link} →
        </button>
      ) : null}
    </section>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY_TEXT: CSSProperties = { fontFamily: 'var(--font-body)' }

/* WHITE's page (Figma 312:1649): 750 wide, centred, no outer card — the page
   behind it is white (PlatformShell), the header has its own panel. */
const WHITE_PAGE: CSSProperties = {
  // Beside the left rail now (2026-10-12): up to 750, shrinking first.
  flex: '0 1 750px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
}
/* The course header's panel: Primary 100, 20 radius, 32 in, 16 between rows. */
const WHITE_HEAD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 32,
  boxSizing: 'border-box',
  borderRadius: 20,
  background: 'var(--color-primary-100)',
}
const WHITE_COVER_FRAME: CSSProperties = {
  position: 'relative',
  width: 130,
  minHeight: 105,
  flex: 'none',
  alignSelf: 'stretch',
  borderRadius: 8,
  overflow: 'hidden',
}

const COVER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Serif H4, as the V1 course card's title (38 / 40). */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h4-base-size, 38px)',
  lineHeight: 'var(--type-atlas-h4-base-line, 40px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
// Page and step dividers in primary-100 (2026-10-09, Eric; briefly 200) — were the warm nav rule.
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-primary-100)' }
/* The design's text links: Open Sans Bold 13, the brand's button colour. */
const LINK: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // The left cards' links ("Edit My Study Pace", "Help me get ready →"): Bold
  // 11 / 13 (2026-10-09, Eric's request; SemiBold 13 / 19.5 since 2026-10-06).
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '13px',
  color: 'var(--color-compass-page-button)',
}
const STEP_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Serif H8 (20 / 24). */
const STEP_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-base-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
const MARK_CURRENT: CSSProperties = {
  width: 14,
  height: 14,
  boxSizing: 'border-box',
  borderRadius: '50%',
  // The current stop's title colour (XCEL: Secondary 600 brown).
  background: 'var(--color-atlas-home-current-stop, var(--color-compass-page-button))',
  border: '2px solid var(--color-atlas-home-current-stop, var(--color-compass-page-button))',
  flex: 'none',
}
/**
 * The REGULATED lock mark, in the ring's slot — 2026-10-15, the direct ask
 * ("show the small gray lock icon on the left instead of the outline circle").
 *
 * 12px, the ring's own box, so the spine it hangs on does not step sideways
 * when a row locks. `--color-border-subtle` is the ring's colour too: the lock
 * is `aria-hidden` decoration beside a label that is already dimmed, so it
 * should not outweigh the words it annotates — the same call Hybrid's
 * `MARK_LOCK` records for the same glyph.
 */
const LOCK_MARK: CSSProperties = {
  width: 12,
  height: 12,
  flex: 'none',
  color: 'var(--color-border-subtle)',
}

const MARK: CSSProperties = {
  width: 12,
  height: 12,
  boxSizing: 'border-box',
  borderRadius: '50%',
  // Solid, not the design's dashed (2026-10-02, the designer's request) —
  // the rings and the spine both.
  border: '2px solid var(--color-border-subtle)',
  flex: 'none',
}
const SPINE: CSSProperties = { flex: '1 1 0', minHeight: 1, width: 0, borderLeft: '2px solid var(--color-border-subtle)' }
/* The course card's actions — the page's main button size (the Begin Course
   button's, 13.5 / 20.25 with 5×8 padding), side by side. */
const HEADER_BUTTON: CSSProperties = {
  ...COMPASS_BUTTON,
  minHeight: 0,
  padding: '5px 8px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
const CHEVRON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  height: 18,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-compass-page-button)',
}
/* Hugs its label with 24 a side (2026-10-09, Eric) — it filled the column. */
const REQUIREMENTS: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0 24px',
  height: 40,
  borderRadius: 8,
  border: '1px solid',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}

/* The Design bar's Progress control → the module's opening state and figure. */
/* The Readiness level each Progress stage opens on (0 Novice … 4 Exam Ready).
   Expired has no obvious level, so it starts over at Novice. */
const V3_READINESS_FOR: Record<string, number> = {
  'not-started': 0,
  'on-track': 1,
  milestone: 2,
  completed: 3,
  expired: 0,
}
const V3_PROGRESS_ORDER = ['not-started', 'on-track', 'milestone', 'completed', 'expired']
const V3_PROGRESS: Record<string, { stage: ProgressStage; percent?: number }> = {
  // Opens on Study pace (0% IS that screen); clicking on reaches the 14% ring.
  'not-started': { stage: 'zero', percent: 14 },
  'on-track': { stage: 'current', percent: 14 },
  milestone: { stage: 'milestone' },
  completed: { stage: 'complete' },
  expired: { stage: 'expired' },
}

/* ── V3's left column (Figma 254:7973) ──────────────────────────────────── */


/* A link tile: a thin FA icon, a count over its noun, and "View ›". */
/* A STACKED link tile (Figma 269:8778): the thin icon at 38 over a centred
   two-line label, the whole tile the button. Tertiary 200, 8 radius, 12 / 16 /
   16; the design's soft 2px drop shadow on hover only. Fixed width when given, else it fills. */
function StackedTile({
  icon,
  count,
  noun,
  second,
  label,
  onView,
  width,
}: {
  icon: ReactNode
  count: number
  noun: string
  second: string
  label: string
  onView: () => void
  width?: number
}) {
  return (
    <button
      type="button"
      className="cre-atlas-link-tile"
      onClick={onView}
      aria-label={label}
      style={{ ...V3_STACKED_TILE, ...(width ? { width, flex: 'none' } : { flex: '1 1 0', minWidth: 0 }) }}
    >
      {/* Icons 20% under the design's 38 → 30 (2026-10-09, Eric); the line box with them. */}
      <span aria-hidden style={{ display: 'inline-flex', height: 35, alignItems: 'center', color: 'var(--color-primary-500)' }}>
        {icon}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '14px', textAlign: 'center', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <strong style={{ fontWeight: 700 }}>{count}</strong> {noun}
        <br />
        {second}
      </span>
    </button>
  )
}

function LinkTile({
  icon,
  count,
  noun,
  onView,
  grow = false,
}: {
  icon: ReactNode
  count: number
  noun: string
  onView: () => void
  grow?: boolean
}) {
  return (
    <div style={{ ...V3_TILE, ...(grow ? { flex: '1 1 0', minWidth: 0 } : { flex: 'none' }) }}>
      <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-primary-400)' }}>
        {icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2, fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '12px' }}>
        <span style={{ color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
          <strong style={{ fontWeight: 700 }}>{count}</strong> {noun}
        </span>
        <button type="button" className="cre-compass-v2-link" onClick={onView} aria-label={`View ${noun.toLowerCase()}`} style={V3_VIEW}>
          View
          <AngleRightSolid size={9} aria-hidden />
        </button>
      </div>
    </div>
  )
}



/* The current stop's "Next" pill (Figma 265:8145): Primary 100 capsule, 2 / 6,
   SemiBold 11 / 14 in Primary 500. */
const NEXT_PILL: CSSProperties = {
  flex: 'none',
  padding: '2px 6px',
  borderRadius: 20,
  background: 'var(--color-primary-100)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
}

/** White's two link tiles (Stacked / Inline) — off since 2026-10-12. */
const SHOW_TWO_LINK_TILES: boolean = false

/* White's single certificates tile: the stacked tile's surface, laid out as a
   row — icon and label side by side, centred vertically, from the left. */
const WHITE_CERT_TILE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  // Left-aligned, 24 in (2026-10-12, Eric's request; it was centred).
  justifyContent: 'flex-start',
  gap: 12,
  width: '100%',
  padding: '12px 16px 12px 24px',
  boxSizing: 'border-box',
  borderRadius: 20,
  border: 'none',
  background: 'var(--color-primary-100)',
  transition: 'filter 150ms',
  cursor: 'pointer',
}

const V3_STACKED_TILE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  // 12px under the label (16 in Figma) and the cards' 20 radius (8 in Figma)
  // — 2026-10-09, Eric's request.
  padding: '12px 16px 12px',
  boxSizing: 'border-box',
  borderRadius: 20,
  border: 'none',
  background: 'var(--color-primary-100)', // Primary 100 (2026-10-09, Eric; was Tertiary 200)
  // The design's drop shadow shows on HOVER only (tokens.css, Eric 2026-10-09).
  transition: 'filter 150ms',
  cursor: 'pointer',
}

const V3_TILE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 8px',
  boxSizing: 'border-box',
  borderRadius: 8,
  background: 'var(--color-primary-100)', // Primary 100 (2026-10-09, Eric; was Tertiary 200)
}
const V3_VIEW: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '12px',
  color: 'var(--color-compass-page-button)',
}
