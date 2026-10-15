import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { GaugeSolid, HourglassClockLight, PenToSquareSolid } from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { paceDurationPhrase } from '@/lib/studyPace'

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

export type ProgressStage = 'zero' | 'current' | 'milestone' | 'complete' | 'expired'
type Stage = ProgressStage
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
  initialStage = 'zero',
  milestonePercent = 68,
  onAdvance,
  bare = false,
  paceDays,
}: {
  percent: number
  expected: ProgressFigure
  access?: ProgressFigure | null
  /** The state it opens on — V3's Design-bar Progress control sets it
   *  (2026-10-09); remount (a `key`) to apply a new one. */
  initialStage?: Stage
  /** The milestone state's figure (the design's 68 by default). */
  milestonePercent?: number
  /**
   * How many weeks the learner's own pace needs — the Study pace state's
   * sentence, 2026-10-15.
   *
   * ⚠ IT WAS THE WORD "three", TYPED. The sentence read "…in 3 weeks time"
   * as a literal transcribed from Figma 267:8266, directly under a card
   * stating "18 days to complete" — a plan that does not fit the access
   * window it is printed beside. The home already computes the real pace
   * (`studyPace` → `defaultPreset`) for the "At current pace" figure two
   * lines up, so the number was available all along and simply not asked for.
   *
   * ⚠ `'none'` IS NOT ZERO DAYS — it is "no honest pace fits", which the model
   * reports as `state: 'no'` and the Expires control reaches on its 1-day row.
   * Passing `undefined` there fell back to the design's three weeks and the
   * card promised three weeks of study inside one day of access. The sentence
   * changes entirely rather than printing a number.
   *
   * ⚠ IT IS DAYS, NOT WEEKS, since 2026-10-15 — `paceDurationPhrase` picks the
   * unit, switching to months past eight weeks, and it needs the raw figure to
   * do that. Rounding to weeks here first would have thrown away the precision
   * the months branch rounds from.
   *
   * ⚠ DEFAULTS TO THE DESIGN'S THREE WEEKS so a caller with no pace model
   * renders exactly what it rendered before.
   */
  paceDays?: number | 'none'
  /** When given, a click (or Enter / Space) calls this INSTEAD of stepping
   *  the module's own state — V3 uses it to step the Design bar's Progress,
   *  so the whole page follows (2026-10-09). */
  onAdvance?: () => void
  /** No card of its own — no fill, 24 above and below, nothing at the sides —
   *  with its eyebrow and figures centred, for a combined Progress + Readiness
   *  panel (Figma 286:9455; Eric/Atlas White, 2026-10-14). Same states, same
   *  clicks. */
  bare?: boolean
}) {
  // Opens on the FIRST state, so clicks walk the design's order 1 → 5 → 1.
  const [picked, setStage] = useState<Stage>(initialStage)
  const stage: Stage = picked === 'current' && percent <= 0 ? 'zero' : picked
  // A 0% course is NOT STARTED, which is the Study pace screen — the default
  // pace we set — never a ring at 0% (2026-10-09, Eric's request). So at 0%
  // the "current" state is skipped when stepping through.
  const order = percent <= 0 ? ORDER.filter((x) => x !== 'current') : ORDER
  const next = () =>
    onAdvance ? onAdvance() : setStage((s) => {
      const i = order.indexOf(s)
      return order[(i < 0 ? 0 : i + 1) % order.length]
    })
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
      style={
        bare
          ? { ...CARD, ...BARE_CARD, paddingBottom: 24 }
          : { ...CARD, paddingBottom: stage === 'zero' ? 32 : 24 }
      }
    >
      <p style={bare ? BARE_EYEBROW : EYEBROW}>
        {stage === 'zero'
          ? 'Study pace'
          : stage === 'complete'
            ? 'Course completed'
            : stage === 'expired'
              ? 'Course expired'
              : bare
                ? 'Pre-Licensing Progress' // bare (White): 178 of its 194 (2026-10-14, Eric's request)
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
              {paceDays === 'none' ? (
                <>
                  <p style={{ ...BODY, fontWeight: 700 }}>
                    There isn’t enough access left to finish this course.
                  </p>
                  <p style={BODY}>
                    No study pace fits in the time remaining. Extend your access to get a plan.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ ...BODY, fontWeight: 700 }}>We’ve set up a moderate study plan for you.</p>
                  <p style={BODY}>
                    This study pace will have you prepared to pass your course exam in{' '}
                    {paceDurationPhrase(paceDays ?? 21)} time.
                  </p>
                </>
              )}
            </div>
          </div>
          {/* No rule above the link when bare (2026-10-14, Eric's request). */}
          {bare ? null : <span aria-hidden style={RULE} />}
          {/* …and 8 less above it, 16 not the card's 24 (same day). */}
          <span style={bare ? { ...EDIT_LINK, marginTop: -8 } : EDIT_LINK}>
            Edit My Study Pace
            <PenToSquareSolid size={11} aria-hidden />
          </span>
        </>
      ) : null}

      {stage === 'current' || stage === 'milestone' || stage === 'complete' ? (
        <div style={{ paddingTop: 4, alignSelf: 'center' }}>
          <Dial
            percent={stage === 'current' ? percent : stage === 'milestone' ? milestonePercent : 100}
            tracking={stage === 'complete' ? '-0.08em' : stage === 'milestone' ? '-0.05em' : undefined}
          />
        </div>
      ) : null}

      {stage === 'current' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
          <Figure label="Expected completion" {...expected} />
          {/* Not in Figma 286:9455 (2026-10-14, Eric): bare drops it. */}
          {access && !bare ? (
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
                  You’ve completed your course and passed your course exam. Take advantage of your course’s
                  flashcards and Exam Simulator to get prepared for your state exam. <strong style={{ fontWeight: 700 }}>Good Luck!</strong>
                </>
              ) : (
                `You’ve completed ${milestonePercent}% of you course work ahead of your plan. Keep this pace up and you’ll be ready for your course exam in 1 week`
              )}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignSelf: 'stretch' }}>
            {/* No rule under the copy when bare (2026-10-14, Eric's request). */}
            {bare ? null : <span aria-hidden style={RULE} />}
            {stage === 'complete' ? (
              <Figure label="Course completed" value="June 1" note="Congratulations!!" />
            ) : (
              <Figure label="Expected completion" value="June 3" note="At current pace" />
            )}
            {bare ? null : (
              <>
                <span aria-hidden style={RULE} />
                <Figure label="Course access" value={stage === 'complete' ? '9 Days' : '28 Days'} note="Ends June 10" />
              </>
            )}
          </div>
        </>
      ) : null}

      {/* States 2–3 end on the Study pace screen's link, reading "Edit My
          Study Pace" (2026-10-09, Eric's request). Left-aligned like the original. */}
      {/* …but not on Completed — nothing left to pace (2026-10-09, Eric). */}
      {/* …nor bare: Figma 286:9455 shows no link (2026-10-14, Eric). */}
      {!bare && (stage === 'current' || stage === 'milestone') ? (
        <>
          <span aria-hidden style={RULE} />
          <span style={EDIT_LINK}>
            Edit My Study Pace
            <PenToSquareSolid size={11} aria-hidden />
          </span>
        </>
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--color-atlas-tan-300)' }} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: 'var(--color-atlas-dial-fill, var(--color-primary-500))' }}
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
  // The brand's own Primary 100 (2026-10-09, Eric) — it was the pinned
  // --color-atlas-progress-fill (#ECEEF0), the same under every brand.
  background: 'var(--color-primary-100)',
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
/* The figure labels ("Expected completion"…) take the page's override when it
   sets one — Eric/Atlas White's Neutral 800 (2026-10-14, Eric's request). */
const LABEL: CSSProperties = { ...EYEBROW, letterSpacing: '0.1em', color: `var(--atlas-progress-label, ${EYEBROW.color})` }
/* `bare` (Figma 286:9455): the panel around it draws the outline. Longhands,
   since the paddingBottom above is a longhand too. */
const BARE_CARD: CSSProperties = {
  background: 'transparent',
  borderRadius: 16,
  gap: 24,
  paddingTop: 24,
  paddingRight: 0,
  paddingLeft: 0,
}
const BARE_EYEBROW: CSSProperties = {
  ...EYEBROW,
  textAlign: 'left',
  letterSpacing: '1.76px',
  color: 'var(--color-neutral-800)',
}
const RULE: CSSProperties = { display: 'block', height: 1, alignSelf: 'stretch', background: 'var(--color-primary-200)' }
// 11 / 16 (2026-10-09, Eric's request; it was 13 / 18).
const BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16px',
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
/* "Edit My Study Pace": a rule above it and centred, as the Readiness card's
   link (2026-10-09, Eric's request). */
const EDIT_LINK: CSSProperties = { ...LINK, alignSelf: 'center' }
const EXTEND: CSSProperties = {
  ...COMPASS_BUTTON,
  alignSelf: 'stretch',
  minHeight: 0,
  padding: '5px 16px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
