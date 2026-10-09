import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { GaugeSolid, HourglassClockLight, PenToSquareSolid } from '@/icons'
import { COMPASS_BUTTON } from './compassButton'

/**
 * THE COURSE PROGRESS MODULE, FIVE STATES — Figma "Atlas-UX-Design" component
 * 267:8267 (2026-10-08, Eric's request), on Eric/Atlas V3's Home in place of
 * the Course progress panel and the Readiness card. The states, in order:
 *
 *   1 ZERO PROGRESS   "Study pace" — the plan we set, and a way to change it
 *   2 CURRENT         "Course progress" — the dial, expected completion, access
 *   3 MILESTONE       "Course progress" — 68%, "Great Work!!", a note
 *   4 COMPLETE        "Course completed" — 100%, "Amazing Job!!"
 *   5 EXPIRED         "Course expired" — and Extend Course Now
 *
 * ⚠ FOR NOW CLICKING THE MODULE FLIPS TO THE NEXT STATE (Eric's request) — it
 * is a review device, not the product. Nothing inside it is wired: "Set a
 * different study pace" and "Extend Course Now" are drawn, not live, so a click
 * anywhere on the card means "next state". Enter and Space do the same.
 *
 * CURRENT reads the page's real figures (the course's percent, the expected
 * completion and the course access line). The other four carry the DESIGN's
 * demo copy and figures verbatim.
 */
export type ProgressFigure = { value: string; note: string }

type Stage = 'zero' | 'current' | 'milestone' | 'complete' | 'expired'
const ORDER: Stage[] = ['zero', 'current', 'milestone', 'complete', 'expired']
const STAGE_NAME: Record<Stage, string> = {
  zero: 'Study pace',
  current: 'Course progress',
  milestone: 'Milestone',
  complete: 'Course completed',
  expired: 'Course expired',
}

export function AtlasCourseProgressStates({
  percent,
  expected,
  access,
}: {
  percent: number
  expected: ProgressFigure
  access?: ProgressFigure | null
}) {
  // Opens on the FIRST state, so clicks walk the design's order 1 → 5 → 1.
  const [stage, setStage] = useState<Stage>('zero')
  const next = () => setStage((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length])
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      next()
    }
  }
  const step = ORDER.indexOf(stage) + 1

  return (
    <section
      aria-label={`Course progress — state ${step} of 5, ${STAGE_NAME[stage]}. Press to show the next state.`}
      role="button"
      tabIndex={0}
      onClick={next}
      onKeyDown={onKey}
      className="cre-atlas-progress-states"
      // paddingBottom always present: React clears a dropped longhand, which
      // wiped the shorthand's bottom on the other states.
      style={{ ...CARD, paddingBottom: stage === 'zero' ? 32 : 24 }}
    >
      <p style={EYEBROW}>
        {stage === 'zero'
          ? 'Study pace'
          : stage === 'complete'
            ? 'Course completed'
            : stage === 'expired'
              ? 'Course expired'
              : 'Course progress'}
      </p>

      {stage === 'zero' ? (
        <>
          {/* Figma 267:8266 (reworked 2026-10-09): no rule; a white pace card —
              the thin gauge at 48 beside MODERATE / Study Pace — then the copy,
              then the link, left-aligned. */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, paddingBottom: 2, alignSelf: 'stretch' }}>
            <span style={PACE_CARD}>
              <GaugeSolid size={38} aria-hidden style={{ color: 'var(--color-primary-100)' }} />
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={PACE_LEVEL}>Moderate</span>
                <span style={PACE_NOUN}>Study Pace</span>
              </span>
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ ...BODY, fontWeight: 700 }}>We’ve set up a moderate study plan for you.</p>
              <p style={BODY}>This study pace will have you prepared to pass your course exam in 3 weeks time.</p>
            </div>
          </div>
          <span style={LINK}>
            Edit My Study Pace
            <PenToSquareSolid size={11} aria-hidden />
          </span>
        </>
      ) : null}

      {stage === 'current' || stage === 'milestone' || stage === 'complete' ? (
        <div style={{ paddingTop: 4, alignSelf: 'center' }}>
          <Dial
            percent={stage === 'current' ? percent : stage === 'milestone' ? 68 : 100}
            tracking={stage === 'complete' ? '-0.08em' : stage === 'milestone' ? '-0.05em' : undefined}
          />
        </div>
      ) : null}

      {stage === 'current' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
          <Figure label="Expected completion" {...expected} />
          {access ? (
            <>
              <span aria-hidden style={RULE} />
              <Figure label="Course access" {...access} />
            </>
          ) : null}
        </div>
      ) : null}

      {stage === 'milestone' || stage === 'complete' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8, alignSelf: 'stretch' }}>
            <p style={CHEER}>{stage === 'complete' ? 'Amazing Job!!' : 'Great Work!!'}</p>
            <p style={BODY}>
              {stage === 'complete' ? (
                <>
                  You’ve completed all of your course work and passed your course exam. Take advantage of your course’s
                  flashcards and Exam Simulator to get prepared for your state exam. <strong style={{ fontWeight: 700 }}>Good Luck!</strong>
                </>
              ) : (
                'You’ve completed 68% of you course work ahead of your plan. Keep this pace up and you’ll be ready for your course exam in 1 week'
              )}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
            <span aria-hidden style={RULE} />
            {stage === 'complete' ? (
              <Figure label="Course completed" value="June 1" note="Congratulations!!" />
            ) : (
              <Figure label="Expected completion" value="June 3" note="At current pace" />
            )}
            <span aria-hidden style={RULE} />
            <Figure label="Course access" value={stage === 'complete' ? '9 Days' : '28 Days'} note="Ends June 10" />
          </div>
        </>
      ) : null}

      {/* States 2–4 end on the Study pace screen's link, reading "Edit My
          Study Pace" (2026-10-09, Eric's request). Left-aligned like the original. */}
      {stage === 'current' || stage === 'milestone' || stage === 'complete' ? (
        <span style={LINK}>
          Edit My Study Pace
          <PenToSquareSolid size={11} aria-hidden />
        </span>
      ) : null}

      {stage === 'expired' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 8, alignSelf: 'stretch' }}>
            {/* 8px more under the rule (2026-10-09, Eric) — 16 to the icon row. */}
            <span aria-hidden style={{ ...RULE, marginBottom: 8 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-text-secondary)' }}>
                <HourglassClockLight size={30} aria-hidden />
              </span>
              <p style={{ ...BODY, fontWeight: 700, flex: '1 1 0' }}>We’re sorry but your course has expired</p>
            </div>
            <p style={BODY}>If you’d like to extend your course’s access period, click below:</p>
          </div>
          {/* Drawn, not wired — a click on it is a click on the card. */}
          <span className="cre-compass-primary cre-compass-btn-primary" style={EXTEND}>
            Extend Course Now
          </span>
        </>
      ) : null}
    </section>
  )
}

/* The dial: a thin warm track, the brand primary arc, the figure in the
   heading serif at 58 / 46 over "Complete". */
function Dial({ percent, tracking }: { percent: number; tracking?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const size = 149
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div role="img" aria-label={`${pct}% complete`} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--color-tertiary-300)' }} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: 'var(--color-primary-500)' }}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div aria-hidden style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <span style={{ ...BIG, letterSpacing: tracking }}>{pct}%</span>
        <span style={CAPTION}>Complete</span>
      </div>
    </div>
  )
}

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <p style={LABEL}>{label}</p>
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: '20px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 700 }}>{value}</span>
        <span style={{ fontWeight: 300 }}> - </span>
        <span style={{ fontWeight: 400 }}>{note}</span>
      </p>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 20,
  background: 'var(--color-atlas-progress-fill)',
  cursor: 'pointer',
  userSelect: 'none',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  alignSelf: 'stretch',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-500)',
}
const LABEL: CSSProperties = { ...EYEBROW, letterSpacing: '0.1em' }
const RULE: CSSProperties = { display: 'block', height: 1, alignSelf: 'stretch', background: 'var(--color-primary-200)' }
const BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}
const CHEER: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 22,
  lineHeight: '24px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
const BIG: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 58,
  lineHeight: '46px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}
const CAPTION: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
/* The zero state's pace pill (Figma 286:10260, replaced 2026-10-09): a
   Primary 200 capsule (62 radius, 5 / 16 / 6 / 6) hugging its content, the
   SOLID gauge at 38 in Primary 100, the words in Primary 600. Gauge 48 → 38
   and left padding 8 → 6 when the design was revised the same day. */
const PACE_CARD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  // Fills the module's width (2026-10-09, Eric) — it hugged its content.
  alignSelf: 'stretch',
  padding: '5px 16px 6px 6px',
  borderRadius: 62,
  border: '1px solid var(--color-primary-200)',
  background: 'var(--color-primary-200)',
  color: 'var(--color-primary-600)',
  whiteSpace: 'nowrap',
}
const PACE_LEVEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: '14px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
}
const PACE_NOUN: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '14px',
  letterSpacing: '-0.065px',
}
const LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '13px',
  color: 'var(--color-compass-page-button)',
  whiteSpace: 'nowrap',
}
const EXTEND: CSSProperties = {
  ...COMPASS_BUTTON,
  alignSelf: 'stretch',
  minHeight: 0,
  padding: '5px 16px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
