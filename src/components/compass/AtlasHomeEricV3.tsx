import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  AngleRightSolid,
  BookOpen,
  FileCertificateLight,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasExamDateCard } from './AtlasExamDateCard'
import { AtlasCourseProgressStates } from './AtlasCourseProgressStates'
import { AtlasReadinessCard } from './AtlasReadinessCard'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { AtlasCourseTabs, type AtlasCourseTab } from './AtlasCourseTabs'
import { journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
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

/** The cover and the column under it share this width (2026-10-08). */
const V3_LEFT_W = 235

/** V3's course tabs — off on 2026-10-08, back on the same day (Eric's
 *  request: "add the course tabs back to the top"). */
const SHOW_COURSE_TABS: boolean = true

export type AtlasHomeEricV3Props = {
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

/* THE DEMO'S OTHER ACTIVE COURSE (Figma 188:1006). INVENTED — no fixture has a
   New York P&C course. Choosing its tab swaps the title and cover image only;
   everything below them (figures, pace, journey) is a DUPLICATE of the Life &
   Health course's content (2026-10-05, the designer's request). */
const DEMO_OTHER_COURSES: AtlasCourseTab[] = [
  { id: 'demo-ny-pc', title: 'New York Property & Casualty', coverUrl: '/courses/ny-property-casualty.webp' },
]

export function AtlasHomeEricV3({
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
}: AtlasHomeEricV3Props) {
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

  const stops = journeyStopsFor(path)
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
  const pass = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 2]
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]
  const state = jurisdictionName(path.state)
  const longTitle = useFeatureFlag('atlas-home-long-title').enabled
  const currentTitle = longTitle ? V2_LONG_TITLE : courseTitle
  const tabs = courses ?? [{ id: path.id, title: currentTitle, coverUrl }, ...DEMO_OTHER_COURSES]
  const [activeTabId, setActiveTabId] = useState(path.id)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const shownTitle = activeTab?.title ?? currentTitle
  const shownCover = activeTab?.coverUrl ?? coverUrl
  const selectCourse = (id: string) => {
    setActiveTabId(id)
    onSelectCourse?.(id)
  }

  return (
    <div style={PAGE}>
      {/* ── The course card ── */}
      {/* NO COURSE TABS on V3 (2026-10-08, Eric's request: "remove from v3"),
          so the card takes its full 48 on top. The tabs' data stays — the
          title and cover still read the first course — so to bring the strip
          back, set SHOW_COURSE_TABS. */}
      <section aria-label="Current course" style={SHOW_COURSE_TABS && tabs.length > 1 ? CARD : { ...CARD, paddingTop: 48 }}>
        {SHOW_COURSE_TABS && tabs.length > 1 ? (
          <AtlasCourseTabs courses={tabs} activeId={activeTab?.id ?? path.id} onSelect={selectCourse} onAllCourses={onAllCourses ?? (() => go('courses'))} />
        ) : null}
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {shownCover ? (
            <span aria-hidden style={COVER_FRAME}>
              <img src={shownCover} alt="" style={COVER} />
            </span>
          ) : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={EYEBROW}>Current course:</p>
              <h2 className="cre-compass-course-title cre-atlas-home-course-title cre-atlas-home-v2-course-title" style={TITLE}>
                {shownTitle}
              </h2>
            </div>
            {/* The card's two actions, at the main buttons' size (2026-10-06,
                the designer's request): Course Overview — was a 10px chip —
                as the outline button, and Begin Course, MOVED here from the
                Study Journey's current stop. */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {onOverview ? (
                <button
                  type="button"
                  className="cre-compass-secondary cre-atlas-home-secondary"
                  onClick={onOverview}
                  // Two weights under the buttons' Bold, Medium 500 (2026-10-06).
                  style={{ ...HEADER_BUTTON, fontWeight: 500 }}
                >
                  Course Overview
                </button>
              ) : null}
              <button
                type="button"
                className="cre-compass-primary cre-compass-btn-primary"
                onClick={onBegin}
                disabled={!onBegin}
                style={HEADER_BUTTON}
              >
                Begin Course
              </button>
            </div>
          </div>
        </div>

        <span aria-hidden style={RULE} />

        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {/* Left: V3's COLUMN, 235 wide — Figma 254:7973 (2026-10-08, Eric's
              request; it was the 200-wide Course progress panel alone). Two
              link tiles (certificates, courses), the Course progress panel
              restyled, and a READINESS card with a half-dial. */}
          <div style={{ width: V3_LEFT_W, flex: 'none', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* DEMO COUNTS — "3 Certificates" is the design's figure, not a
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

            {/* THE COURSE PROGRESS MODULE — Figma 267:8267's five states, in
                place of the Course progress panel (2026-10-08, Eric's
                request). Click it to flip the states. */}
            <AtlasCourseProgressStates
              percent={percent}
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
            {/* The READINESS card, under the module (Figma 254:8012, 2026-10-08). */}
            <AtlasReadinessCard />
          </div>

          <span aria-hidden style={{ width: 1, flex: 'none', background: 'var(--color-atlas-nav-rule)' }} />

          {/* Right: the journey. */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  />
                ))}
              </ol>
            </section>

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
      </section>

      {/* ── The side column ── */}
      <div style={{ width: 260, flex: 'none', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* QUICK LINKS REMOVED on V3 (2026-10-07, Eric's request) — the card
            (`AtlasJourneyLinksCard`) is unchanged and still drawn by V1, V2 and
            My Courses; to put it back here, render it above this card again. */}
        {/* THE EXAM-DATE CARD — Figma component 224:4118, all four states and
            a working calendar (2026-10-07, Eric's request). */}
        <AtlasExamDateCard stateName={state} />

      </div>
    </div>
  )
}



function JourneyRow({
  stop,
  current,
  last,
  onOpen,
}: {
  stop: JourneyStop
  current: boolean
  last: boolean
  onOpen?: () => void
}) {
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 42 : 36 }}>
      <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: current ? 7 : 3 }}>
        {current ? <span style={MARK_CURRENT} /> : <span style={MARK} />}
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

const PAGE: CSSProperties = {
  display: 'flex',
  // 32 between the course card and the right column (2026-10-07, Eric's
  // request; it was 40). V2 only.
  gap: 32,
  alignItems: 'flex-start',
  justifyContent: 'center',
}
/* The Home course card's surface — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  // 750, was the design's 711 (2026-10-07, Eric's request). The two left
  // columns stay 200 (cover, progress panel); the 39 goes to the right side.
  flex: '0 1 750px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  // 24 on top, not 48 — the course tabs sit above the title (Figma 188:1006).
  padding: '24px 48px 48px',
  boxSizing: 'border-box',
  borderRadius: 14,
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
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-nav-rule)' }
/* The design's text links: Open Sans Bold 13, the brand's button colour. */
const LINK: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  // SemiBold 600, one weight under Bold (2026-10-06, the designer's request) —
  // the "→" is part of the label, so it thins with it.
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '19.5px',
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
const REQUIREMENTS: CSSProperties = {
  height: 40,
  borderRadius: 8,
  border: '1px solid',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}

/* ── V3's left column (Figma 254:7973) ──────────────────────────────────── */


/* A link tile: a thin FA icon, a count over its noun, and "View ›". */
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



const V3_TILE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 8px',
  boxSizing: 'border-box',
  borderRadius: 8,
  border: '1px solid var(--color-tertiary-200)',
  background: 'var(--color-tertiary-100)',
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
