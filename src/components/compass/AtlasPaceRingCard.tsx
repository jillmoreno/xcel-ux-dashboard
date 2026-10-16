import type { CSSProperties } from 'react'
import { AngleRightRegular, GaugeThin } from '@/icons'
import { ATLAS_SECTION_EYEBROW } from './atlasSectionEyebrow'

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
  expected,
  onCustomize,
}: {
  percent: number
  /** The finish DATE the same pace model produces, and its note. Shown under
   *  the week goal so the plan's span and the date it lands on are read
   *  together — they come from one `paceFit`, so they cannot describe two
   *  different plans, which is the failure the week count was derived to
   *  avoid in the first place. */
  expected?: { value: string; note: string }
  /** Whole weeks the current plan runs to — the same figure the sentence and
   *  the goal line both read, so they cannot describe two different plans. */
  weeks: number
  onCustomize?: () => void
}) {
  return (
    /* ⚠ TWO SECTIONS, NOT ONE CARD (2026-10-16, Jillienne: "should be 3
       sections: Study Pace, Course Progress, Exam Readiness as the
       eyebrows"). The third is the Readiness card below, which takes the same
       eyebrow.

       It was ONE panel headed "Your study pace" with the dial inside it —
       which made the progress figure look like part of the pace, when they
       answer different questions: the pace is the plan, the dial is where the
       learner has got to against it. Splitting them is what lets each be
       named. */
    <div style={PANEL}>
      <section style={SECTION} aria-label="Study pace">
        <p style={EYEBROW}>Study pace</p>
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
        {expected ? (
          <div style={EXPECTED}>
            <p style={EXPECTED_LABEL}>Estimated completion</p>
            <p style={EXPECTED_VALUE}>
              {expected.value}
              <span style={EXPECTED_NOTE}> · {expected.note}</span>
            </p>
          </div>
        ) : null}
        {onCustomize ? (
          <button type="button" className="cre-compass-v2-link" onClick={onCustomize} style={LINK}>
            Customize Your Pace
            <AngleRightRegular size={13} aria-hidden />
          </button>
        ) : null}
      </section>
      <section style={{ ...SECTION, alignItems: 'center' }} aria-label="Course progress">
        <p style={EYEBROW}>Course progress</p>
        <ProgressDial percent={percent} />
      </section>
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
  /* Stretch, not centre: each section owns its own alignment now — the pace
     reads left, the dial sits centred — and a centring parent would shrink
     the left-aligned one to its content. */
  alignItems: 'stretch',
  gap: 24,
  /* ⚠ NO HORIZONTAL PADDING (2026-10-16, Jillienne: "remove left/right
     padding"). It was `24px 22px`, and the 22 was itself a squeeze — the note
     here read "22 across, not 24, so 'Customize Your Pace ›' fits one line".
     With the fill gone there is nothing for side padding to inset FROM: the
     card sits directly on the Atlas Home's tan container, which has padding of
     its own, so this was inset inside an inset. Dropping it also retires the
     one-line squeeze, since the text now has the full column. */
  padding: '24px 0',
  borderRadius: 8,
  /* ⚠ NO FILL (2026-10-16, Jillienne: "remove the blue background here"). The
     panel was tinted in `HybridHomeV1`, where it sits on white and the tint is
     what separates it — that file's own note says "the tint carries the
     panel", which is why it has no shadow either. HERE it sits inside the
     Atlas Home's tan container, so the tint was a second surface on top of a
     surface. Without it the padding and the rule below do the separating.
     ⚠ SO IT NOW HAS NEITHER FILL NOR SHADOW: if this card is ever reused on a
     white ground it will have nothing to sit on, and that is the moment to
     give it back one of the two rather than both. */
  background: 'transparent',
  boxSizing: 'border-box',
}
const EYEBROW = ATLAS_SECTION_EYEBROW
/* One section of the column — an eyebrow and what it names. */
const SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 11 }
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
/* Ruled off above and below, as the design draws it — the date is a
   different kind of fact from the sentence over it, and the rules are what
   say so without a second card. */
const EXPECTED: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '11px 0',
  borderTop: '1px solid var(--color-atlas-nav-rule)',
  borderBottom: '1px solid var(--color-atlas-nav-rule)',
}
/* The same eyebrow as the card's own — it labels a figure in the same column
   and had no reason to be a smaller, bolder one. */
const EXPECTED_LABEL: CSSProperties = { ...ATLAS_SECTION_EYEBROW, alignSelf: 'auto' }
const EXPECTED_VALUE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 19,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
/* The note rides on the date's line, in body type — it qualifies the figure
   rather than standing beside it as a second one. */
const EXPECTED_NOTE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 400,
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
