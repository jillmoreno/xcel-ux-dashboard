/*
 * END-TO-END DEMO'S HOME — 2026-10-14, Eric's request ("Duplicate the white
 * version and create a new version called End-to-End Demo"). A copy of
 * `AtlasHomeEricV3.tsx` that day, which WIP and White both render, so this
 * demo's Home can change without changing either. Its WIP branches (the
 * `onWhite` false sides) are carried over unchanged and never taken here.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isEricAtlasWhiteLike, resolveDashboardVersion } from '@/data/dashboardVersions'
import { useDashboardCourseTitle } from '@/pages/endToEndDemo'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'
import { useAccount } from '@/context/AccountContext'
import {
  AngleRightRegular,
  AngleRightSolid,
  BookOpen,
  FileCertificateLight,
  LockRegular,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasExamDateCard } from './AtlasExamDateCard'
import { AtlasJourneyLinksCard } from './AtlasJourneyLinksCard'
import { ATLAS_HOME_REFRESH } from '@/components/layout/atlasHomeRefresh'
import { AtlasCourseProgressStates, type ProgressStage } from './AtlasCourseProgressStates'
import { AtlasReadinessCard } from './AtlasReadinessCard'
import { useFeatureFlag, useFeatureFlags, useCourseDemo } from '@/context/FeatureFlagContext'
import { AtlasCourseTabs, type AtlasCourseTab } from './AtlasCourseTabs'
import { WHITE_COURSES, WHITE_COURSE_PARAM, whiteCourseFor } from '@/data/atlasWhiteCourses'
import {
  applyJourneySequencing,
  journeyStopsFor,
  whiteJourneyTitles,
  type JourneyStop,
} from '@/components/learning/studyJourneyUtil'
import { getLicensedStepsFor, jurisdictionName } from '@/data/nyProducerRequirements'
import { defaultPreset, formatPaceDate, studyPace, daysUntil, dateFromIso, NOT_STARTED_NIGHTS } from '@/lib/studyPace'
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

/** The cover and the column under it share this width (2026-10-08). 260 —
 *  White's left column — since 2026-10-13 (Eric's request); it was 235. */
const V3_LEFT_W = 260

/** V3's course tabs — off on 2026-10-08, back on the same day (Eric's
 *  request: "add the course tabs back to the top"). */
const SHOW_COURSE_TABS: boolean = true

/** The two link tiles under the Readiness card (Certificates, Active
 *  courses) — off on WIP 2026-10-13 (Eric's request: "remove"); the right
 *  rail's Quick Links carry both. Built, both layouts (the Design bar's Link
 *  tiles control, which White still uses): set true to bring them back. */
const SHOW_LINK_TILES: boolean = false

export type AtlasHomeEricE2EProps = {
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


/* NO LINKS on the End-to-End Demo's Home (2026-10-15, Eric's request): the
   controls stay drawn and do nothing — Course Overview, Begin Course, the
   journey stops, the tiles, My Courses and My Certificates. Set false to wire
   them again.

   ⚠ THE THREE INFORMATION SHEETS ARE EXEMPT (2026-10-15, Jillienne: Exam
   Information, Applying for a License and State Requirements "should trigger
   the updated sheets from Jills Hybrid version"). They are the same handlers
   Hybrid is given — `onOpenStep` and `onOpenRequirements`, both from
   `MembershipOverview`, which owns the sheets for every version — so the demo
   shows the current ones rather than a copy that can go stale. A sheet opens
   OVER Home and closes back to it, so none of them leaves the demo, which is
   what `LINKS_OFF` is there to prevent. */
const LINKS_OFF = true
const NO_LINK = () => {}

export function AtlasHomeEricE2E({
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
  onSelectCourse,
  onAllCourses,
}: AtlasHomeEricE2EProps) {
  const [searchParams, setParams] = useSearchParams()
  // Eric/Atlas White renders this Home too, on its white page (2026-10-14).
  // End-to-End Demo is White's duplicate, so it is "on White" here.
  /* ⚠ RESOLVED, NOT RAW — 2026-10-14, the day this version became the
     default. On a bare `?demo=1` the raw param is null, so this answered
     false and the baseline drew WIP's toned layout with the course tabs
     instead of its own. `DefaultVersionResolution.test.tsx` pins the two
     renders equal. */
  const { brand: e2eBrand } = useAccount()
  const onWhite = isEricAtlasWhiteLike(resolveDashboardVersion(searchParams.get('version'), e2eBrand))
  /* The demo's course title — short, or long when the Long title control is
     on, and FOLLOWING THE COURSE CONTROL since 2026-10-15. This is the
     dashboard, so it shows the course the reviewer picked; the invite door at
     `/end-to-end-demo` keeps `useEndToEndCourseTitle` and stays Florida. */
  const e2eTitle = useDashboardCourseTitle()
  // White's course-head panel, measured so Quick Links can take its height
  // (2026-10-14, Eric's request).
  const [headEl, setHeadEl] = useState<HTMLDivElement | null>(null)
  const [headH, setHeadH] = useState<number | undefined>(undefined)
  useEffect(() => {
    // No reset when it goes: the height is only read on White, where it exists.
    if (!headEl) return
    const ro = new ResizeObserver(() => setHeadH(headEl.getBoundingClientRect().height))
    ro.observe(headEl)
    return () => ro.disconnect()
  }, [headEl])
  const go = (section: string, coursePage?: string) =>
    LINKS_OFF ? undefined : setParams((prev) => {
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
  /*
   * THE GENTLEST PACE THAT ACTUALLY FITS — 2026-10-15, with the Expires
   * control.
   *
   * ⚠ `defaultPreset` RETURNS THE RECOMMENDED ONE WHETHER OR NOT IT FITS, and
   * reading its `state` as "no pace exists" is wrong by one preset. At 7 days
   * of access the recommended pace wants 3192 minutes a week and reports
   * `no` — while RELAXED fits the same window at 1064, heavy but real. The
   * card said "there isn't enough access left to finish this course" with a
   * workable plan sitting in the model one row up.
   *
   * `presets` is ordered relaxed → recommended → focused, so the first that
   * is not `no` is the gentlest that fits. Everything `no` — the 1-day row —
   * means none does, and THAT is when the card says so.
   */
  const paceFit = preset.state === 'no' ? model.presets.find((x) => x.state !== 'no') : preset
  const accessDays = accessExpiresAt ? Math.max(0, daysUntil(accessExpiresAt, today) ?? 0) : null
  /* EXPIRES · DAYS TO COMPLETE, under the course title (Figma 368:519,
     2026-10-13, Eric's request). The course's own access end and the days
     left to it — the figures the Access tile reads — not the frame's sample
     11/04/2026 and 27 days. Like the rest of the card, it is the first
     course's whichever tab is picked. */
  const expiresOn = dateFromIso(accessExpiresAt)
  const courseMeta =
    expiresOn && accessDays != null ? (
      <div
        style={
          onWhite
            ? // Primary 200 rules on White's Primary 100 panel (2026-10-14),
              // where the card's own 100 would not show.
              { ...META_ROW, borderTop: '1px solid var(--color-primary-200)', borderBottom: '1px solid var(--color-primary-200)' }
            : META_ROW
        }
      >
        <span style={META_PAIR}>
          {/* "Course Access Ends:" on White (2026-10-14, Eric's request). */}
          <span style={META_LABEL}>{onWhite ? 'Course Access Ends:' : 'Expires:'}</span>
          <span style={META_VALUE}>
            {expiresOn.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
            {/* Inside the value, so no gap before it; in the label's weight. */}
            {onWhite ? <span style={META_LABEL}>,</span> : null}
          </span>
        </span>
        {/* White reads as one line — "…05/29/2026, 18 days to complete" — with
            no divider (2026-10-14, Eric's request). */}
        {onWhite ? (
          <span style={{ ...META_PAIR, marginLeft: -4 }}>
            <span style={META_VALUE}>
              {accessDays} {accessDays === 1 ? 'day' : 'days'}
            </span>
            <span style={META_LABEL}>to complete</span>
          </span>
        ) : (
          <>
            <span aria-hidden style={META_DIVIDER} />
            <span style={META_PAIR}>
              <span style={META_LABEL}>Days to complete:</span>
              <span style={META_VALUE}>
                {accessDays} {accessDays === 1 ? 'day' : 'days'}
              </span>
            </span>
          </>
        )}
      </div>
    ) : null

  // V3 drops the Attestation & Affidavit stop on every progress stage
  // (2026-10-09, Eric's request). The stop still exists in the shared journey.
  const { regulated } = useCourseDemo()
  const stops = journeyStopsFor(path).filter((s) => s.id !== 'attestation-and-affidavit')
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
  // White's journey reads as Figma 265:8144 (2026-10-14, Eric's request: the
  // text only, the rows keep their styling) — seven stops, the first current.
  /* REGULATED SEQUENCING (2026-10-15) — Step 1's stops lock behind the one
     the learner may open next. The rule is `applyJourneySequencing`, so every
     drawing of this journey agrees; Unregulated returns the same array.

     ⚠ IT WRAPS `shownStops`, NOT `stops`, and wrapping the wrong one is how
     this shipped doing nothing. The White journey REBUILDS its rows from
     `whiteJourneyTitles`, spreading `stops[0]` into each — so a `locked`
     derived upstream is overwritten by the spread before anything renders.
     Sequence what is DRAWN, which is the array below. */
  const shownStops: readonly JourneyStop[] = applyJourneySequencing(
    onWhite && stops.length
      ? whiteJourneyTitles(stops[0], { stateExamSimulators: true }).map((title, i) => ({
          ...stops[0],
          id: `white-${i}`,
          title,
          status: i === 0 ? 'in-progress' : 'not-started',
          /* The rebuild inherits `stops[0]`'s `blocked`, which is about a
             different stop entirely. Cleared so the sequencing below reads
             these rows as the plain not-started ones they are. */
          blocked: false,
        }))
      : stops,
    regulated,
  )
  const shownCurrentIdx = onWhite ? 0 : currentIdx
  /* THE JURISDICTION COMES FROM THE PATH, heading and steps alike.
     Florida is no longer written here: `MembershipOverview` resolves this
     demo's COURSE to Florida (2026-10-15), so `path.state` already is 'FL'
     and every other surface that reads the path — the three information
     sheets, Readiness, the study plan — says Florida too. Hard-coding the
     word here instead is what let the Home and its own sheets disagree. */
  const licensedSteps = getLicensedStepsFor(path.state)
  const pass = licensedSteps[licensedSteps.length - 2]
  const apply = licensedSteps[licensedSteps.length - 1]
  const state = jurisdictionName(path.state)
  const longTitle = useFeatureFlag('atlas-home-long-title').enabled
  // The Design bar's Progress (V3 only, 2026-10-09) — which module state and figure.
  const progressPick = useFeatureFlag('atlas-v3-progress').variant ?? 'not-started'
  // The Design bar's Link tiles (V3 only, 2026-10-09) — Stacked (default) or Inline.
  const stackedTiles = (useFeatureFlag('atlas-v3-link-tiles').variant ?? 'stacked') !== 'inline'
  // The Design bar's Quick Links side (2026-10-13) — Left (default) or Right.
  const quickLinksRight = useFeatureFlag('atlas-wip-quick-links-side').variant === 'right'
  const progress = V3_PROGRESS[progressPick] ?? V3_PROGRESS['not-started']
  // COMPLETED (Design bar's Progress = Completed 100%, 2026-10-09, Eric): no
  // Course progress card, and Step 1 becomes the Congratulations block.
  const completedView = progressPick === 'completed'
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
  /* THE COURSE TABS ARE WHITE'S THREE COURSES (2026-10-13, Eric's request:
     "Update the course tabs to the 3 used elsewhere") — the list the Top
     Nav's My Courses dropdown and White's own Home use. The pick rides the
     URL as `?whiteCourse=`, so the tabs, the dropdown and White agree; a pick
     swaps the title and cover, and everything below stays the first
     course's. Until that day the tabs had their own two: Life & Health and
     an invented "New York Property & Casualty" (Figma 188:1006), picked in
     page state. */
  const tabs = courses ?? WHITE_COURSES.map((c, i) => (i === 0 ? { id: c.id, title: currentTitle, coverUrl } : c))
  // Which course-header layout is up — flipped by clicking the cover.
  const [whiteHead, setWhiteHead] = useState(false)
  const activeTabId = whiteCourseFor(searchParams.get(WHITE_COURSE_PARAM))
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  // The demo's course: the one Invited Product Detail sells (2026-10-15,
  // Eric's request), in place of the course data's title.
  const shownTitle = e2eTitle
  const shownCover = activeTab?.coverUrl ?? coverUrl
  const selectCourse = (id: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (id === WHITE_COURSES[0].id) next.delete(WHITE_COURSE_PARAM)
      else next.set(WHITE_COURSE_PARAM, id)
      return next
    })
    onSelectCourse?.(id)
  }

  return (
    // 40 between Quick Links and the course card on White, 8 more than WIP's
    // 32 (2026-10-14, Eric's request) — White's card has no padding of its own.
    <div style={onWhite ? WHITE_PAGE : PAGE}>
      {/* ── The course card ── */}
      {/* NO COURSE TABS on V3 (2026-10-08, Eric's request: "remove from v3"),
          so the card takes its full 48 on top. The tabs' data stays — the
          title and cover still read the first course — so to bring the strip
          back, set SHOW_COURSE_TABS. */}
      {/* No drop shadow, a white fill and no padding on Eric/Atlas White, which
          shows this Home on its white page (2026-10-14, Eric's request); WIP
          keeps all three. */}
      <section
        aria-label="Current course"
        style={{
          ...(SHOW_COURSE_TABS && tabs.length > 1 ? CARD : { ...CARD, paddingTop: 40 }),
          // …and a white fill, the page's own, and no padding — 800 wide
          // (2026-10-14, Eric's request; 750 earlier that day).
          ...(onWhite
            ? {
                boxShadow: 'none',
                background: 'var(--color-fixed-light)',
                flex: '0 1 800px',
                paddingTop: 0,
                paddingRight: 0,
                paddingBottom: 0,
                paddingLeft: 0,
              }
            : null),
        }}
      >
        {/* THE COURSE HEAD — tabs, cover, title, Expires row and buttons. On
            Eric/Atlas White it sits on a Primary 100 panel (40 all round, the
            tabs hidden), with no
            rule under it (2026-10-14, Eric's request). On WIP the wrapper is
            `display: contents`, so nothing about WIP's layout moves. */}
        <div ref={onWhite ? setHeadEl : undefined} style={onWhite ? WHITE_COURSE_HEAD : { display: 'contents' }}>
        {/* No tabs on White (2026-10-14, Eric's request). */}
        {SHOW_COURSE_TABS && !onWhite && tabs.length > 1 ? (
          <AtlasCourseTabs courses={tabs} activeId={activeTab?.id ?? path.id} onSelect={selectCourse} onAllCourses={onAllCourses ?? (() => go('courses'))} />
        ) : null}
        {/* 32, the row below's gap (2026-10-13, Eric's request), so the title
            block starts on the vertical rule under it; it was 40. */}
        {/* TWO HEADER LAYOUTS, FLIPPED BY CLICKING THE IMAGE (2026-10-13,
            Eric's request): this one — the 260 cover beside the title and both
            buttons — and Eric/Atlas White's (`WhiteStyleHead`, below), which
            gives the title the card's width over a 130 cover. A live demo
            toggle, like the Study Pace and Readiness cards' own. */}
        {whiteHead ? (
          <WhiteStyleHead
            cover={shownCover ?? undefined}
            title={shownTitle}
            onCover={() => setWhiteHead(false)}
            onOverview={LINKS_OFF ? NO_LINK : onOverview}
            onBegin={LINKS_OFF ? NO_LINK : onBegin}
            beginLabel={progressPick === 'not-started' ? 'Begin Course' : 'Resume Course'}
            meta={courseMeta}
          />
        ) : (
        <div style={{ display: 'flex', gap: 32, alignItems: 'stretch' }}>
          {shownCover ? (
            <button
              type="button"
              aria-label="Course header — layout 1 of 2. Press to show the next layout."
              onClick={() => setWhiteHead(true)}
              // 12 corners on Eric/Atlas White, 8 under the card’s 20 (2026-10-14)
              // — and the 260 column's width less the panel's padding there, so
              // its right edge lines up with that column below.
              style={{ ...COVER_FRAME, ...COVER_TOGGLE, ...(onWhite ? { borderRadius: COMPASS_BUTTON.borderRadius, width: V3_LEFT_W - WHITE_HEAD_PAD } : null) }}
            >
              <img src={shownCover} alt="" style={COVER} />
            </button>
          ) : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={EYEBROW}>Current course:</p>
              <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
                {shownTitle}
              </h2>
              {courseMeta}
            </div>
            {/* The card's two actions, at the main buttons' size (2026-10-06,
                the designer's request): Course Overview — was a 10px chip —
                as the outline button, and Begin Course, MOVED here from the
                Study Journey's current stop. */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {LINKS_OFF || onOverview ? (
                <button
                  type="button"
                  className="cre-compass-secondary cre-atlas-home-secondary"
                  onClick={LINKS_OFF ? NO_LINK : onOverview}
                  // Bold 700, the exam-date prompt's Yes (2026-10-15, Eric's
                  // request; Medium 500 from 2026-10-06).
                  style={{ ...HEADER_BUTTON, fontWeight: 700 }}
                >
                  Course Overview
                </button>
              ) : null}
              <button
                type="button"
                className="cre-compass-primary cre-compass-btn-primary"
                onClick={LINKS_OFF ? NO_LINK : onBegin}
                disabled={!LINKS_OFF && !onBegin}
                style={HEADER_PRIMARY}
              >
                {/* "Resume Course" once the Design bar's Progress is past 0% (2026-10-12,
                    Eric's request). */}
                {progressPick === 'not-started' ? 'Begin Course' : 'Resume Course'}
              </button>
            </div>
          </div>
        </div>
        )}

        </div>
        {onWhite ? null : <span aria-hidden style={RULE} />}

        {/* 32 either side of the rule, White's (2026-10-13, Eric's request);
            it was 40. */}
        {/* 48 between the two columns (2026-10-15, Eric's request; 32 either side of a divider before). */}
        <div style={{ display: 'flex', gap: 48, alignItems: 'stretch' }}>
          {/* Left: V3's COLUMN, 235 wide — Figma 254:7973 (2026-10-08, Eric's
              request; it was the 200-wide Course progress panel alone). Two
              link tiles (certificates, courses), the Course progress panel
              restyled, and a READINESS card with a half-dial. */}
          <div style={{ width: V3_LEFT_W, flex: 'none', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* THE COURSE PROGRESS MODULE — Figma 267:8267's five states, in
                place of the Course progress panel (2026-10-08, Eric's
                request). Click it to flip the states. Hidden on the Completed
                view (2026-10-09). */}
            {/* ON WHITE, PROGRESS AND READINESS SHARE ONE OUTLINED PANEL
                (Figma 286:9455; 2026-10-14, Eric's request), a hairline between
                them; each keeps its states and clicks (`bare`). On WIP the
                wrapper is `display: contents` and they stay two cards. */}
            <div style={onWhite ? WHITE_PROGRESS_PANEL : { display: 'contents' }}>
            {completedView ? null : (
            <AtlasCourseProgressStates
              bare={onWhite}
              // The pace pill's gauge in Light, Primary 400 (2026-10-15, Eric).
              lightGauge
              key={`progress-${progressPick}-${refreshKey}`}
              initialStage={progress.stage}
              onAdvance={advanceProgress}
              percent={progress.percent ?? percent}
              milestonePercent={75}
              /* THE PACE SENTENCE READS THE SAME MODEL as the figure below
                 it. It was the design's typed "3 weeks" under a card saying
                 "18 days to complete" — a plan that did not fit the window
                 printed beside it. `paceFit.days` is what `expected` renders
                 as a finish DATE; `paceDurationPhrase` says the same span in
                 words, in weeks or months as its length warrants. */
              paceDays={paceFit ? paceFit.days : 'none'}
              expected={{
                // "Nov. 5" where the pace model has no finish date — a DEMO date.
                /* THE SAME RESOLVED PACE the sentence below reads, so the
                   finish DATE and the week count cannot describe two
                   different plans. The demo date survives for the case where
                   nothing fits at all. */
                value: paceFit ? formatPaceDate(paceFit.finishIso) : 'Nov. 5',
                note: 'At current pace',
              }}
              access={
                accessDays != null && accessExpiresAt
                  ? { value: `${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`, note: `Ends ${formatPaceDate(accessExpiresAt)}` }
                  : null
              }
            />
            )}
            {/* THE EXAM-DATE CARD, between Study Pace and Readiness (2026-10-13,
                Eric's request; it was in the side column). */}
            {/* No sub-line on its first screen (2026-10-13, Eric's request). */}
            {/* 20 corners, the Readiness card's under it (2026-10-13, Eric's
                request; the card's own are 12). */}
            {/* Not on Eric/Atlas White (2026-10-14, Eric's request: "remove");
                WIP keeps it. */}
            {onWhite ? null : (
              <AtlasExamDateCard key={refreshKey} stateName={state} style={{ ...RAIL_CARD_BORDER, borderRadius: 14 }} hideIntroCopy />
            )}
            {/* The READINESS card, under the module (Figma 254:8012, 2026-10-08). */}
            {/* On the Completed view it opens on Proficient (2026-10-09, Eric). */}
            {/* Clicking it at Exam Ready takes the page back to Not Started 0%
                (2026-10-09, Eric). */}
            {/* …and it follows the Progress stage (2026-10-09, Eric: "the
                readiness module is not changing when the progress changes"). */}
            {/* Its own key prefix: the two cards are siblings, and a SHARED key
                left orphaned copies of the progress card on screen. */}
            {onWhite && !completedView ? <span aria-hidden style={WHITE_PROGRESS_RULE} /> : null}
            <AtlasReadinessCard
              bare={onWhite}
              key={`readiness-${progressPick}-${refreshKey}`}
              initialLevel={V3_READINESS_FOR[progressPick] ?? 0}
              onPastLast={() => setVariant('atlas-v3-progress', 'not-started')}
            />
            </div>
            {/* The link tiles at the BOTTOM of the column (2026-10-09, Eric's
                request; they led it). */}
            {!SHOW_LINK_TILES ? null : stackedTiles ? (
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

          {/* No divider here (2026-10-15, Eric's request) — the row's 48 is the
              whole gap. */}

          {/* Right: the journey — at most 335, White's (2026-10-13, Eric's
              request). */}
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 335, display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* THE STATE EXAM DATE PROMPT, above the steps — Figma 428:3134
                (2026-10-15, Eric's request). Its own width, wider than the
                steps' 335. Yes and Not Yet are not wired yet. */}
            <div style={EXAM_DATE_PROMPT}>
              <div style={EXAM_DATE_PILL}>
                <p style={EXAM_DATE_QUESTION}>Do you know your state exam date?</p>
                <button type="button" style={EXAM_DATE_YES}>
                  Yes
                </button>
              </div>
              <button type="button" style={EXAM_DATE_NOT_YET}>
                Not Yet
                <AngleRightSolid size={11} aria-hidden style={{ width: 6 }} />
              </button>
            </div>
            {completedView ? (
              /* STEP 1 ON THE COMPLETED VIEW — Figma 297:247 (2026-10-09,
                 Eric's request): the eyebrow, "Congratulations!" and a line in
                 place of the journey's stops. */
              <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <p style={STEP_EYEBROW}>
                  <span style={{ fontWeight: 700 }}>Step 1</span>
                  {/* Not on White (2026-10-14, Eric's request). */}
                  {onWhite ? null : <span style={{ fontWeight: 600 }}> · Study Journey</span>}
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
                  {/* Not on White (2026-10-14, Eric's request). */}
                  {onWhite ? null : <span style={{ fontWeight: 600 }}> · Study Journey</span>}
                </p>
                <p style={STEP_TITLE}>Complete Coursework</p>
              </div>
              <ol style={{ listStyle: 'none', margin: 0, padding: '3px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {shownStops.map((stop, i) => (
                  <JourneyRow
                    key={stop.id}
                    stop={stop}
                    current={i === shownCurrentIdx}
                    last={i === shownStops.length - 1}
                    onOpen={onOpenStop && !LINKS_OFF ? () => onOpenStop(stop.id) : undefined}
                    // On Track 14% only (2026-10-09, Eric): the current stop
                    // shows how far through it is and what is next (Figma
                    // 265:8145). DEMO figures and chapter, the design's own.
                    // Not Started and Milestone get the Next line alone (same
                    // day); the chapters are Eric's, per stage.
                    progressDetail={
                      onWhite || i !== currentIdx
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
            {/* Steps 2 and 3 drop their links on White (2026-10-14, Eric's
                request); WIP keeps them. */}
            <Step
              number={2}
              title={pass.title}
              detail={pass.detail}
              link={pass.detailLabel ?? 'What to expect'}
              onLink={onOpenStep && !onWhite ? () => onOpenStep(pass.id) : undefined}
            />
            <span aria-hidden style={RULE} />
            <Step
              number={3}
              title={state ? `Get Licensed in ${state}` : 'Get Licensed'}
              detail={apply.detail}
              link={apply.detailLabel ?? 'How to apply'}
              onLink={onOpenStep && !onWhite ? () => onOpenStep(apply.id) : undefined}
            />
            {onOpenRequirements ? (
              <button
                type="button"
                data-cta-id="home.state-requirements"
                className="cre-compass-secondary"
                /* THE SHEET OPENS HERE TOO (2026-10-15, Jillienne). It is the
                   same sheet the Quick Links row opens, so silencing the big
                   button while the sidebar link worked would have been the
                   one inconsistency on the page. */
                onClick={onOpenRequirements}
                style={REQUIREMENTS}
              >
                {state ? `${state} State Requirements` : 'State Requirements'}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── The side column — on the LEFT of the course card since 2026-10-13
          (Eric's request; it was the right). `order` moves it without moving
          the markup. ── */}
      {/* 230 (2026-10-13, Eric's request) — 260 before; fitted to Quick Links'
          content and unbordered for a while that day, then back to the
          bordered card. */}
      {/* LEFT by default; the Design bar's Quick Links control puts it back on
          the right (2026-10-13). */}
      {/* 234, not 230 (2026-10-14, Eric's request): at 230 "Applying for a
          License" wrapped when hover took it to Medium — it needs 134.6 of the
          row, and 230 left 133. */}
      <div style={{ width: 234, flex: 'none', display: 'flex', flexDirection: 'column', gap: 24, order: quickLinksRight ? undefined : -1 }}>
        {/* THE EXAM-DATE CARD — Figma component 224:4118, all four states and
            a working calendar (2026-10-07, Eric's request). FIRST in the rail,
            above Quick Links, since 2026-10-13 (Eric's request). */}
        {/* The exam-date card left this column for the course card's, between
            Study Pace and Readiness (2026-10-13, Eric's request). */}
        {/* QUICK LINKS — removed on V3 2026-10-07, BACK 2026-10-13 (Eric's
            request): first with only My Courses and My Certificates, then the
            same day with the three sheet links too (Exam Information, Applying
            for a License, State Requirements) — everything but the course's
            own Flashcards and Exam Simulator. The sheets open here, in place. */}
        <AtlasJourneyLinksCard
          withoutCoursePages
          linksOff={LINKS_OFF}
          onOpenStep={onOpenStep}
          onOpenRequirements={onOpenRequirements}
          // Outlined in Secondary 100 darkened 5% (2026-10-13, Eric's request;
          // 15% was tried and reverted); the exam-date card keeps Primary 200.
          // On White, as tall as the course-head panel beside it (2026-10-14,
          // Eric's request).
          style={{
            ...RAIL_CARD_BORDER,
            border: '1px solid color-mix(in srgb, var(--color-atlas-slate-100) 95%, black)',
            ...(onWhite && headH ? { height: headH } : null),
            // …and the cards' corners: 20, then 14 (2026-10-16, Eric's request).
            ...(onWhite ? { borderRadius: 14 } : null),
          }}
        />

      </div>
      {/* THE AFFIDAVIT, over Home on arrival from Confirmation & Password
          (`?affidavit=1`, 2026-10-15, Eric's request). Closing it drops the
          param, so a refresh does not bring it back. */}
      {searchParams.get('affidavit') === '1' ? (
        <AffidavitModal
          onClose={() =>
            setParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                next.delete('affidavit')
                return next
              },
              { replace: true },
            )
          }
        />
      ) : null}
    </div>
  )
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


/* The exam-date prompt: a Primary 100 pill (24 in, 16 corners, 33 tall)
   with Yes in Primary 500, then Not Yet › 8 to its right. */
const EXAM_DATE_PROMPT: CSSProperties = {
  // Fits its content (2026-10-15, Eric's request; the design's fixed 460).
  width: 'max-content',
  // 20 to Step 1, 4 under the column's 24 (2026-10-15, Eric's requests: 16,
  // then 4 more).
  marginBottom: -4,
  // The ground takes in Yes and Not Yet too, 16 in at each end (2026-10-15,
  // Eric's request); the course card's Primary 100 (the design's Secondary
  // 200, on the question and Yes only).
  // 4 above and below Yes (2026-10-15, Eric's request) — 41 tall.
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 16px',
  borderRadius: COMPASS_BUTTON.borderRadius, // the Yes button's 9 (2026-10-16, Eric's request; 16, then 14)
  background: 'var(--color-primary-100)',
}

/* The question and Yes, 10 apart. */
const EXAM_DATE_PILL: CSSProperties = {
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

const EXAM_DATE_QUESTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '14px',
  letterSpacing: -0.2,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const EXAM_DATE_YES: CSSProperties = {
  height: 33,
  boxSizing: 'border-box',
  padding: '0 24px',
  // White, its text in Primary 500 and its 1px border two levels lighter,
  // Primary 300 (2026-10-15, Eric's requests; the design's filled 500).
  border: '1px solid var(--color-primary-300)',
  // The standard button's corners, `COMPASS_BUTTON`'s (2026-10-15, Eric's
  // request; it was 16).
  borderRadius: COMPASS_BUTTON.borderRadius,
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13.5,
  lineHeight: '20.25px',
  color: 'var(--color-primary-500)',
  cursor: 'pointer',
}

const EXAM_DATE_NOT_YET: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '11px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY_TEXT: CSSProperties = { fontFamily: 'var(--font-body)' }

const PAGE: CSSProperties = {
  display: 'flex',
  // 32 between the course card and the right column (2026-10-07, Eric's
  // request; it was 40). V2 only.
  gap: 32,
  alignItems: 'flex-start',
  justifyContent: 'center',
}
/* Eric/Atlas White: 40 between the columns, and every eyebrow on the page in
   Neutral 800, #404040 (2026-10-14, Eric's request) — the page's eyebrow token
   and the progress figures' labels, re-pointed here so WIP is untouched. */
const WHITE_PAGE: CSSProperties = {
  ...PAGE,
  // 32 between Quick Links and the course card (2026-10-14: 40, then 8 less).
  gap: 32,
  ['--color-compass-page-eyebrow' as string]: 'var(--color-neutral-800)',
  ['--atlas-progress-label' as string]: 'var(--color-neutral-800)',
}
/* The Home course card's surface — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  // 830 — a 750 CONTENT area inside the 40s (2026-10-13, Eric's request:
  // 846 inside 48s earlier that day; 750 overall from 2026-10-07, and the
  // design's 711 before that).
  flex: '0 1 830px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  // 24 on top, not 48 — the course tabs sit above the title (Figma 188:1006).
  // 40 a side and below, 48 until 2026-10-13 (Eric's request).
  // 16 above the course tabs (2026-10-13, Eric's request; it was 24). Written
  // as longhands: the no-tabs case overrides `paddingTop`, and React, moving
  // between a `padding` shorthand and that longhand, cleared the top to 0.
  paddingTop: 16,
  paddingRight: 40,
  paddingBottom: 40,
  paddingLeft: 40,
  boxSizing: 'border-box',
  borderRadius: 14, // every card 14, as Compass's Overview (2026-10-16, Eric's request; 20 from 2026-10-13)
  background: 'var(--color-compass-course-card)',
  // No outer stroke (2026-10-02, the designer's request); the Compass MEDIUM
  // shadow lifts it instead (the small one was tried the same day).
  boxShadow: 'var(--shadow-compass-md)',
}
/* The cover FILLS THE ROW'S HEIGHT — the eyebrow, title and buttons beside it
   (2026-10-06, Eric's request). A frame stretched by the row, the image
   absolutely inside it, so the photo's own proportions cannot set the row's
   height; `cover` crops. Switching course tabs no longer depends on the
   photos' proportions either (they set it from 2026-10-05 to 2026-10-06, at
   the L&H photo's 1312 × 980). */
const COVER_FRAME: CSSProperties = {
  position: 'relative',
  // 235, the left column's width (2026-10-08) — was 200.
  width: V3_LEFT_W,
  flex: 'none',
  alignSelf: 'stretch',
  borderRadius: 20, // the cards' 20 (2026-10-09, Eric; it was 8)
  overflow: 'hidden',
}
/**
 * ERIC/ATLAS WHITE'S COURSE HEADER, INSIDE WIP'S CARD (2026-10-13) — Figma
 * 312:1650's arrangement as White draws it (`AtlasHomeEricWhite`), without
 * White's Primary 100 panel, since it sits in this card: a 130 cover beside
 * the eyebrow and title (bottom-aligned), then Course Overview under the cover
 * at its width and Begin Course at the right. The title has the card's width
 * less the cover, so a long one wraps less. Clicking the cover flips back.
 */
function WhiteStyleHead({
  cover,
  title,
  onCover,
  onOverview,
  onBegin,
  beginLabel,
  meta,
}: {
  cover?: string
  title: string
  onCover: () => void
  onOverview?: () => void
  onBegin?: () => void
  beginLabel: string
  /** The Expires · Days to complete row, under the title. */
  meta?: ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'stretch' }}>
        {cover ? (
          <button
            type="button"
            aria-label="Course header — layout 2 of 2. Press to show the next layout."
            onClick={onCover}
            style={{ ...WHITE_HEAD_COVER, ...COVER_TOGGLE }}
          >
            <img src={cover} alt="" style={COVER} />
          </button>
        ) : null}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end' }}>
          <p style={EYEBROW}>Current course:</p>
          <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
            {title}
          </h2>
          {meta}
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
            {beginLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
/* White's cover (130 wide, at least 105 tall, 8 radius). */
const WHITE_HEAD_COVER: CSSProperties = {
  position: 'relative',
  width: 130,
  minHeight: 105,
  flex: 'none',
  alignSelf: 'stretch',
  borderRadius: 8,
  overflow: 'hidden',
}
/* The cover as the layout toggle: a bare button, the frame's own shape. */
const COVER_TOGGLE: CSSProperties = { display: 'block', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }

/* The right rail's cards outlined in Primary 200 (2026-10-13, Eric's request)
   — WIP's own; both cards default to the nav rule elsewhere. …and padded 24
   all round, the exam-date card's own, so Quick Links matches it (same day;
   it was 24 / 32 / 32). */
const RAIL_CARD_BORDER: CSSProperties = { border: '1px solid var(--color-primary-200)', padding: 24 }

/* Figma 368:519: a rule above and below (Primary 100), 6 in, the two pairs 8
   either side of a 1px Primary 100 divider the row's height (2026-10-13; 24
   apart with no divider before), 4 inside each; Open Sans 11/14 — the label
   Medium in Neutral 700, the value SemiBold in the text colour. */
const META_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 0',
  borderTop: '1px solid var(--color-primary-100)',
  borderBottom: '1px solid var(--color-primary-100)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
}
const META_PAIR: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4 }
// Primary 200, a step darker than the rules above and below (2026-10-13, Eric's request).
const META_DIVIDER: CSSProperties = { width: 1, alignSelf: 'stretch', flex: 'none', background: 'var(--color-primary-200)' }
const META_LABEL: CSSProperties = { fontWeight: 500, color: 'var(--color-neutral-700)' }
const META_VALUE: CSSProperties = { fontWeight: 600, color: 'var(--color-text-primary)' }

/* Eric/Atlas White's Progress + Readiness panel (Figma 286:9455, 2026-10-14):
   a Primary 200 outline, 20 corners, 24 / 32 in, 16 between. The hairline
   between them is the design's #E7E0D6 — tan 300 is the nearest token. */
const WHITE_PROGRESS_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // 8 top and bottom (2026-10-14, Eric's request: 24, then 16 less) — the
  // cards inside keep their own 24.
  padding: '8px 32px',
  boxSizing: 'border-box',
  borderRadius: 14, // 14 (2026-10-16, Eric's request; was 20)
  // No stroke, a Secondary 100 fill (2026-10-15, Eric's request; it had
  // Quick Links' border).
  background: 'var(--color-atlas-tan-100)',
}
const WHITE_PROGRESS_RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-tan-300)' }

/* Eric/Atlas White's course head (2026-10-14): a Primary 100 panel, 24 in
   (32 at first, the same day),
   the card's 20 corners; 24 between the tabs and the header, the card's own
   gap. */
/* White's course-head padding. The cover is the left rail's width less this,
   so its right edge stays on the rail's below. */
const WHITE_HEAD_PAD = 40
const WHITE_COURSE_HEAD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  // 24 under the tabs (2026-10-14: 24, then 16, then 24 again).
  gap: 24,
  // The tab bar's rule — and the active tab, which shares it — in Primary 200,
  // so they show on the panel's Primary 100 (same day).
  ['--color-atlas-outlined-card' as string]: 'var(--color-primary-200)',
  // 40 all round (2026-10-14, Eric's requests: 32, then 24, then 32 with the
  // top trimmed to 24, then 16, back to 32 once the tabs were hidden, 48, 40).
  padding: WHITE_HEAD_PAD,
  // 8 more below it, before the Progress row (2026-10-14, Eric's requests:
  // 8, then 8 more; 8 less on 2026-10-15).
  marginBottom: 8,
  borderRadius: 14, // 14 (2026-10-16, Eric's request; was 20)
  background: 'var(--color-primary-100)',
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

/* The primary (Begin / Resume Course): 8 more each side, 16 (2026-10-15,
   Eric's request). */
const HEADER_PRIMARY: CSSProperties = { ...HEADER_BUTTON, padding: '5px 16px' }
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

const V3_STACKED_TILE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  // 12px under the label (16 in Figma) and the cards' 20 radius (8 in Figma)
  // — 2026-10-09, Eric's request.
  padding: '12px 16px 12px',
  boxSizing: 'border-box',
  borderRadius: 14, // 14 (2026-10-16, Eric's request; was 20)
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
