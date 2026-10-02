import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  BallotCheckRegular,
  BookRegular,
  CircleInfoRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  GaugeThin,
  NotebookRegular,
  PenFieldRegular,
} from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
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
}

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
  const reviewDays = Math.max(0, model.daysToCeiling - preset.days)
  const accessDays = accessExpiresAt ? Math.max(0, daysUntil(accessExpiresAt, today) ?? 0) : null
  /* THE WEEK GOAL IS THE DESIGN'S 3 (2026-10-02, the designer's request), not
     derived. ⚠ It was `preset.days / 7` rounded, which read "2 Week Goal" for
     the 13 days the model gives this demo — so the goal and the Expected
     completion date above it no longer come from one figure. To derive it
     again: `Math.max(1, Math.round(preset.days / 7))`. */
  const weeks: number = 3

  const stops = journeyStopsFor(path)
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
  const pass = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 2]
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]
  const state = jurisdictionName(path.state)

  return (
    <div style={PAGE}>
      {/* ── The course card ── */}
      <section aria-label="Current course" style={CARD}>
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {coverUrl ? <img src={coverUrl} alt="" aria-hidden style={COVER} /> : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={EYEBROW}>Current course:</p>
              <h2 className="cre-compass-course-title" style={TITLE}>
                {courseTitle}
              </h2>
            </div>
            {onOverview ? (
              <button type="button" className="cre-compass-home-chip" onClick={onOverview} style={CHIP}>
                Course Overview
              </button>
            ) : null}
          </div>
        </div>

        <span aria-hidden style={RULE} />

        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {/* Left: the figures, then progress and pace. */}
          <div style={{ width: 200, flex: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
              <Figure
                label="Expected completion date"
                value={preset.state === 'no' ? 'Not achievable' : formatPaceDate(preset.finishIso)}
                note="At current pace"
              />
              <span aria-hidden style={RULE} />
              <Figure label="Days to review" value={`${reviewDays} ${reviewDays === 1 ? 'Day' : 'Days'}`} note="Extra Prep Time" />
              {accessDays != null && accessExpiresAt ? (
                <>
                  <span aria-hidden style={RULE} />
                  <Figure
                    label="Course access"
                    value={`${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`}
                    note={`Ends ${formatPaceDate(accessExpiresAt)}`}
                  />
                </>
              ) : null}
            </div>

            <div style={PACE_PANEL}>
              {/* The eyebrow heads the whole panel, above the dial (2026-10-02,
                  the designer's request; the design sets it under it). */}
              <p style={{ ...EYEBROW, alignSelf: 'stretch' }}>Your study pace</p>
              <ProgressDial percent={percent} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, alignSelf: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
                    <GaugeThin size={33} aria-hidden />
                  </span>
                  <span style={{ ...BODY_TEXT, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {weeks} Week Goal
                  </span>
                </div>
                <p style={SMALL_TEXT}>
                  Your default pace is set for you to complete your course in {weeks}{' '}
                  {weeks === 1 ? 'week' : 'weeks'}. You can change your pace below.
                </p>
                <button type="button" className="cre-compass-v2-link" onClick={() => go('study-plan')} style={LINK}>
                  Customize Your Pace
                  <AngleRightRegular size={13} aria-hidden />
                </button>
              </div>
            </div>
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
                    onBegin={onBegin}
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

        <nav aria-label="Other information for your journey" style={SIDE_CARD}>
          <p style={{ ...BODY_TEXT, margin: 0, fontSize: 16, lineHeight: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Other Information for Your Journey
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SideLink icon={<BookRegular size={13} aria-hidden />} label="My Courses" onClick={() => go('courses')} />
            <SideLink icon={<FileCertificateRegular size={13} aria-hidden />} label="My Certificates" onClick={() => go('certificates')} />
            <SideLink icon={<NotebookRegular size={13} aria-hidden />} label="Flashcards" onClick={() => go('course', 'flashcards')} />
            <SideLink icon={<BallotCheckRegular size={13} aria-hidden />} label="Exam Simulator" onClick={() => go('course', 'exam-simulator')} />
            <SideLink
              icon={<CircleInfoRegular size={13} aria-hidden />}
              label="Exam Information"
              onClick={onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : undefined}
            />
            <SideLink
              icon={<PenFieldRegular size={13} aria-hidden />}
              label="Applying for a License"
              onClick={onOpenStep ? () => onOpenStep(apply.id) : undefined}
            />
            <SideLink icon={<ClipboardListCheckRegular size={13} aria-hidden />} label="State Requirements" onClick={onOpenRequirements} />
          </ul>
        </nav>
      </div>
    </div>
  )
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={FIGURE_LABEL}>{label}</p>
      <p style={{ margin: 0, lineHeight: '20px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--font-heading-serif)', fontSize: 16 }}>{value}</span>
        <span style={{ ...BODY_TEXT, fontSize: 16, fontWeight: 300 }}> - </span>
        <span style={{ ...BODY_TEXT, fontSize: 12 }}>{note}</span>
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--color-atlas-nav-rule)' }} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: 'var(--color-compass-page-button)' }}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div aria-hidden style={DIAL_TEXT}>
        <span style={DIAL_CAPTION}>
          Course
          <br />
          Progress
        </span>
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
  onBegin,
  onOpen,
}: {
  stop: JourneyStop
  current: boolean
  last: boolean
  onBegin?: () => void
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
          color: current ? 'var(--color-compass-page-button)' : 'var(--color-text-secondary)',
        }}
      >
        {stop.title}
      </span>
      {current ? (
        <button type="button" className="cre-compass-primary cre-compass-btn-primary" onClick={onBegin} disabled={!onBegin} style={BEGIN}>
          Begin Course
        </button>
      ) : onOpen ? (
        <button type="button" className="cre-compass-v2-link" onClick={onOpen} aria-label={`Open ${stop.title}`} style={CHEVRON}>
          <AngleRightRegular size={13} aria-hidden />
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

function SideLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button type="button" className="cre-compass-v2-row" onClick={onClick} disabled={!onClick} style={SIDE_ROW}>
        <span aria-hidden style={{ width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-compass-page-button)' }}>
          {icon}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>{label}</span>
        <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
          <AngleRightRegular size={13} aria-hidden />
        </span>
      </button>
    </li>
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
/* The Home course card's surface and stroke — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  flex: '0 1 711px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 48,
  boxSizing: 'border-box',
  borderRadius: 14,
  background: 'var(--color-compass-course-card)',
  boxShadow: 'inset 0 0 0 1px var(--color-compass-course-card-stroke, transparent)',
}
const COVER: CSSProperties = {
  width: 200,
  minHeight: 142,
  flex: 'none',
  objectFit: 'cover',
  borderRadius: 8,
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
const CHIP: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '2px 8px 4px',
  borderRadius: 4,
  border: '1px solid var(--color-compass-page-card-border)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '13px',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
}
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-nav-rule)' }
const FIGURE_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '14px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
/* The pale panel — the brand's Study Pace tint (`--color-atlas-outlined-card`). */
const PACE_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  // 22 across, not 24, so "Customize Your Pace ›" fits one line (156 > 152).
  padding: '24px 22px',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
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
  // 8, not the design's 10, so "Customize Your Pace ›" holds one line in the
  // pace panel.
  gap: 8,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
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
  background: 'var(--color-compass-page-button)',
  border: '2px solid var(--color-compass-page-button)',
  flex: 'none',
}
const MARK: CSSProperties = {
  width: 12,
  height: 12,
  boxSizing: 'border-box',
  borderRadius: '50%',
  border: '2px dashed var(--color-border-subtle)',
  flex: 'none',
}
const SPINE: CSSProperties = { flex: '1 1 0', minHeight: 1, width: 0, borderLeft: '2px dashed var(--color-border-subtle)' }
const BEGIN: CSSProperties = {
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
const SIDE_ROW: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
