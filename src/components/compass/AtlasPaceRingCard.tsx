import type { CSSProperties } from 'react'
import { AngleRightRegular, GaugeThin } from '@/icons'

/**
 * THE STUDY PACE CARD AS A RING — a module of its own since 2026-10-16
 * (Jillienne: "lets add a component variant for this section. update to this
 * new UI, keep the other one accessible from the dropdown").
 *
 * ⚠ IT IS A SIBLING, NOT A REPLACEMENT. `AtlasCourseProgressStates` — the tan
 * card with Study pace / Readiness / State exam as pressable states — is
 * untouched, and a design control picks between them at the call site. That
 * is CLAUDE.md's rule for changing something that already exists, and here it
 * is load-bearing: the two cards answer differently. The tan one steps
 * through five states of a journey; this one shows ONE number and a way to
 * change the plan behind it.
 *
 * ⚠ FORKED FROM `HybridHomeV1`'s PACE PANEL, where this layout already lived
 * inline (its `PACE_PANEL` + `ProgressDial`). Copied rather than imported, on
 * purpose: that file is another designer's working home and pulling a shared
 * component out from under it would make a change here a change there. The
 * LAYOUT is duplicated; the DATA is not — both read the same `studyPace`
 * model from their own callers, so the cards cannot disagree about the plan.
 */

export function AtlasPaceRingCard({
  percent,
  weeks,
  onCustomize,
}: {
  percent: number
  /** Whole weeks the current plan runs to — the same figure the sentence and
   *  the goal line both read, so they cannot describe two different plans. */
  weeks: number
  onCustomize?: () => void
}) {
  return (
    <div style={PANEL}>
      {/* The eyebrow heads the whole panel, above the dial — the designer's
          call on 2026-10-02; the design sets it under. Kept as hers. */}
      <p style={EYEBROW}>Your study pace</p>
      <ProgressDial percent={percent} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, alignSelf: 'stretch' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
            <GaugeThin size={33} aria-hidden />
          </span>
          <span style={GOAL}>{weeks} Week Goal</span>
        </div>
        <p style={SMALL}>
          Your default pace is set for you to complete your course in {weeks}{' '}
          {weeks === 1 ? 'week' : 'weeks'}. You can change your pace below.
        </p>
        {onCustomize ? (
          <button type="button" className="cre-compass-v2-link" onClick={onCustomize} style={LINK}>
            Customize Your Pace
            <AngleRightRegular size={13} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** The ring. `role="img"` with the figure in the label, because the number
 *  inside it is drawn as three separate spans and would otherwise be read as
 *  "Course Progress 0 Complete". */
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
          /* At 0 the dash is zero-length, so the arc simply is not drawn —
             which is the honest picture of "not started" and the reason this
             needs no empty-state branch. */
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

const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  // 22 across, not 24, so "Customize Your Pace ›" fits one line.
  padding: '24px 22px',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
  boxSizing: 'border-box',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  alignSelf: 'stretch',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const GOAL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}
const SMALL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
const LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  alignSelf: 'flex-start',
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-compass-page-button)',
  cursor: 'pointer',
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
