import { useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { AtlasCourseTabs, type AtlasCourseTab } from './AtlasCourseTabs'
import { AtlasJourneyLinksCard } from './AtlasJourneyLinksCard'
import { journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
import { defaultPreset, formatPaceDate, studyPace, daysUntil, NOT_STARTED_NIGHTS } from '@/lib/studyPace'
import type { LearningPathSummary } from '@/data/learningFixtures'

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
export type AtlasHomeV2Props = {
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

export function AtlasHomeV2({
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
}: AtlasHomeV2Props) {
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
  const tabs = courses ?? [{ id: path.id, title: courseTitle, coverUrl }, ...DEMO_OTHER_COURSES]
  const [activeTabId, setActiveTabId] = useState(path.id)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0]
  const shownTitle = activeTab?.title ?? courseTitle
  const shownCover = activeTab?.coverUrl ?? coverUrl
  const selectCourse = (id: string) => {
    setActiveTabId(id)
    onSelectCourse?.(id)
  }

  return (
    <div style={PAGE}>
      {/* ── The course card ── */}
      <section aria-label="Current course" style={tabs.length > 1 ? CARD : { ...CARD, paddingTop: 48 }}>
        {tabs.length > 1 ? (
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
              <h2 className="cre-compass-course-title cre-atlas-home-course-title" style={TITLE}>
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
          {/* Left: ONE "Course progress" panel — the dial, then the figures
              (Figma 217:3793, 2026-10-06, the designer's request: the figures
              list and the Study Pace panel reworked into one module). The
              design drops three things the two had: DAYS TO REVIEW, the
              "N Week Goal" with its gauge and copy, and CUSTOMIZE YOUR PACE.
              To bring them back, lift them from commit 0d637ef. */}
          <section aria-label="Course progress" style={{ ...PROGRESS_PANEL, width: 200, flex: 'none', alignSelf: 'flex-start' }}>
            {/* Centred over the dial (2026-10-06, the designer's request). */}
            <p style={{ ...PANEL_EYEBROW, alignSelf: 'stretch', textAlign: 'center' }}>Course progress</p>
            <div style={{ paddingTop: 4, alignSelf: 'center' }}>
              <ProgressDial percent={percent} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch' }}>
              <span aria-hidden style={PANEL_RULE} />
              <Figure
                label="Expected completion"
                value={preset.state === 'no' ? 'Not achievable' : formatPaceDate(preset.finishIso)}
                note="At current pace"
              />
              {accessDays != null && accessExpiresAt ? (
                <>
                  <span aria-hidden style={PANEL_RULE} />
                  <Figure
                    label="Course access"
                    value={`${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`}
                    note={`Ends ${formatPaceDate(accessExpiresAt)}`}
                  />
                </>
              ) : null}
              <span aria-hidden style={PANEL_RULE} />
            </div>
          </section>

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
        {/* The links card's treatment — no fill, no shadow, the nav-rule
            outline — on every brand (2026-10-06, the designer's request). It
            was lifted from 2026-10-02: no stroke, the course card's fill and
            the Compass medium shadow (`--color-compass-course-card` +
            `--shadow-compass-md`), to put back if asked. */}
        <section aria-label="Do you know your state exam date?" style={SIDE_CARD}>
          <p style={STEP_TITLE}>Do you know your state exam date?</p>
          {/* NOT WIRED YET — as on V1's banner, neither answer leads anywhere
              until one is designed. */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="cre-compass-secondary" style={{ ...COMPASS_BUTTON, ...SIDE_BUTTON }}>
              No
            </button>
            <button type="button" className="cre-compass-primary cre-compass-btn-primary" style={{ ...COMPASS_BUTTON, ...SIDE_BUTTON }}>
              Yes
            </button>
          </div>
          <p style={SMALL_TEXT}>If you know when your state exam is we can help you plan and pass your course easier.</p>
        </section>

        <AtlasJourneyLinksCard onOpenStep={onOpenStep} onOpenRequirements={onOpenRequirements} />
      </div>
    </div>
  )
}

/* One figure in the Course progress panel (Figma 217:3832): an 11px brand
   eyebrow over a 13px line — the value Bold, a Light dash, the note Regular. */
function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <p style={{ ...PANEL_EYEBROW, letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '20px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 700 }}>{value}</span>
        <span style={{ fontWeight: 300 }}> - </span>
        <span style={{ fontWeight: 400 }}>{note}</span>
      </p>
    </div>
  )
}

/* The progress dial (Figma "Complete Dial"): a 149px ring in the rule colour,
   the done share drawn over it in the brand's button colour from 12 o'clock,
   the figure in the middle. */
function ProgressDial({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const size = 149
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div role="img" aria-label={`Course progress ${pct}% complete`} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: 'block' }}>
        {/* The track: each brand's Primary 100 (2026-10-06, the designer's
            request; it was the nav rule). XCEL keeps its own through
            --color-atlas-dial-track (tokens.css). */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: 'var(--color-atlas-dial-track, var(--color-primary-100))' }}
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          // The brand button colour over the nav rule; the XCEL skin re-points
          // both through --color-atlas-dial-ring / -track (tokens.css).
          style={{ stroke: 'var(--color-atlas-dial-ring, var(--color-compass-page-button))' }}
          // 8, was 6 (2026-10-06, the designer's request). Same radius as the
          // track, so it stays centred on it; 70 + 4 fits the 149 box's 74.5.
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* The figure and "Complete" only — the panel's eyebrow now says
          "Course progress" (Figma 217:3799). */}
      <div aria-hidden style={DIAL_TEXT}>
        <span style={DIAL_FIGURE}>{pct}%</span>
        <span style={DIAL_CAPTION}>Complete</span>
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
  gap: 40,
  alignItems: 'flex-start',
  justifyContent: 'center',
}
/* The Home course card's surface — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  flex: '0 1 711px',
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
  width: 200,
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
/* The Course progress panel (Figma 217:3793): the Study Pace panel's tint,
   24 in, 8 radius, no shadow (tried on the old pace panel 2026-10-02 and
   removed the same day — the tint carries it). */
const PROGRESS_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
}
/* The panel's eyebrows — 11px SemiBold caps in the guide's Secondary 500 on
   XCEL (--color-atlas-home-eyebrow, tokens.css), the page eyebrow elsewhere. */
const PANEL_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-atlas-home-eyebrow, var(--color-compass-page-eyebrow))',
}
/* The panel's rules take the dial track's colour — Secondary 200 on XCEL. */
const PANEL_RULE: CSSProperties = {
  display: 'block',
  height: 1,
  background: 'var(--color-atlas-dial-track, var(--color-atlas-nav-rule))',
}
const DIAL_TEXT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  textAlign: 'center',
}
const DIAL_CAPTION: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const DIAL_FIGURE: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 38,
  lineHeight: '30px',
  letterSpacing: '-0.06em',
  color: 'var(--color-text-primary)',
}
const SMALL_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
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
/* The side cards: the Atlas rail's 1px rule, 12 radius, 24 / 32 / 32. */
const SIDE_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 32px 32px',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--color-atlas-nav-rule)',
}
const SIDE_BUTTON: CSSProperties = {
  flex: '1 1 0',
  minHeight: 0,
  padding: '5px 8px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
