import type { CSSProperties } from 'react'
import { ArrowRight } from '@/icons'
import {
  COMPASS_COURSE_CONTINUE,
  COMPASS_COURSE_LEAD,
  COMPASS_COURSE_TITLE,
  COMPASS_MODULES,
  COMPASS_MODULES_HEADING,
  type CompassModule,
} from '@/data/compassCourseLandingFixtures'

/**
 * THE COURSE LANDING — what the Compass rail's "Course" row opens on Hybrid,
 * 2026-10-08, the direct ask ("the left rail of the course content page also
 * needs to match what is in anjanis").
 *
 * ⚠ THE ASK WAS ABOUT THE RAIL AND THE ANSWER IS A PAGE, which is worth
 * explaining because it looks like scope creep and is not. In Anjani's
 * prototype the six-row rail is CONSTANT — her Course screen keeps it and puts
 * the module list in the BODY. The product did the opposite: picking Course
 * swapped the rail out for the table of contents and left the body blank. So
 * "make the rail match" could only mean one of two things, and the other one —
 * keep the player's rail as six rows — would have deleted the only way to move
 * between lessons. The owner chose this one.
 *
 * ⚠ THIS IS NOT THE LESSON PLAYER AND MUST NOT BECOME IT. The player is still
 * `?section=course&coursePage=course`, reached from Begin / Resume Course on
 * the home, and it keeps its own table-of-contents rail. Her model has the same
 * split: Course lands you here, `Resume lesson` takes you in.
 *
 * ⚠ EVERY CONTROL HERE IS INERT. Resume lesson and the per-module links have no
 * destination yet — the modules are her five, the player's rail draws a
 * different set, and wiring one to the other would assert a mapping nobody has
 * made. See `compassCourseLandingFixtures` for why the two sets of numbers are
 * not reconciled. They are drawn as the design draws them and do nothing, which
 * is the honest state rather than a route that lands somewhere wrong.
 */
export function CompassCourseLanding() {
  return (
    <div style={groundStyle} role="region" aria-label="Course page">
      <div style={columnStyle}>
        <header>
          <h2 style={titleStyle}>{COMPASS_COURSE_TITLE}</h2>
          <p style={leadStyle}>{COMPASS_COURSE_LEAD}</p>
        </header>

        {/* The resume card. Visually the loudest thing on the page because it is
            the one action a returning learner wants — her screen gives it a
            tinted ground and the only filled button. */}
        <section style={continueStyle} aria-label="Continue your course">
          <p style={continueEyebrowStyle}>{COMPASS_COURSE_CONTINUE.eyebrow}</p>
          <div style={continueRowStyle}>
            <span style={continueTitleStyle}>{COMPASS_COURSE_CONTINUE.title}</span>
            <button type="button" className="cre-compass-primary cre-compass-btn-primary" style={resumeStyle}>
              {COMPASS_COURSE_CONTINUE.action}
              <ArrowRight size={15} aria-hidden />
            </button>
          </div>
        </section>

        <section aria-label={COMPASS_MODULES_HEADING}>
          <h3 style={modulesHeadingStyle}>{COMPASS_MODULES_HEADING}</h3>
          <ul style={listStyle}>
            {COMPASS_MODULES.map((m) => (
              <ModuleRow key={m.title + m.eyebrow} module={m} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function ModuleRow({ module: m }: { module: CompassModule }) {
  return (
    <li style={rowStyle}>
      <div style={{ minWidth: 0 }}>
        <p style={rowEyebrowStyle}>{m.eyebrow}</p>
        <p style={rowTitleStyle}>{m.title}</p>
      </div>
      <div style={rowRightStyle}>
        {/* ⚠ THE PILL CARRIES ITS OWN INK, not the row's. "Not proven" is the
            one state that is neither done nor pending, and its amber is the
            whole point of her list — a module the learner thinks is finished
            and the scored check disagrees with. */}
        <span style={{ ...pillStyle, ...PILL_TONE[m.state] }}>{m.statusLabel}</span>
        <button type="button" className="cre-compass-v2-link" style={rowLinkStyle}>
          {m.actionLabel} →
        </button>
      </div>
    </li>
  )
}

/* Tokens only, and the three tones are the three meanings — done, flagged, not
   started. `not-proven` borrows the warning ramp rather than an error one: it
   is a gap to close, not a failure. */
const PILL_TONE: Record<CompassModule['state'], CSSProperties> = {
  complete: {
    color: 'var(--color-success-700)',
    background: 'var(--color-success-100)',
  },
  'not-proven': {
    color: 'var(--color-warning-700)',
    background: 'var(--color-warning-100)',
  },
  'in-progress': {
    color: 'var(--color-primary-700)',
    background: 'var(--color-primary-100)',
  },
  'up-next': {
    color: 'var(--color-text-secondary)',
    background: 'var(--color-neutral-75)',
  },
}

const groundStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflowY: 'auto',
  background: 'var(--color-compass-page-ground, var(--color-surface-page))',
  padding: '32px 40px 56px',
}

const columnStyle: CSSProperties = {
  maxWidth: 760,
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h4-base-size, 34px)',
  lineHeight: 'var(--type-atlas-h4-base-line, 38px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}

const leadStyle: CSSProperties = {
  margin: '10px 0 0',
  maxWidth: 620,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-compass-page-muted)',
}

const continueStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 20px 20px',
}

const continueEyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const continueRowStyle: CSSProperties = {
  marginTop: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const continueTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 19,
  lineHeight: '26px',
  color: 'var(--color-text-primary)',
}

const resumeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '9px 16px',
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  fontWeight: 700,
}

const modulesHeadingStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 16px',
}

const rowEyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}

const rowTitleStyle: CSSProperties = {
  margin: '3px 0 0',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const rowRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flex: 'none',
}

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 9px',
  borderRadius: 999,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const rowLinkStyle: CSSProperties = {
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  whiteSpace: 'nowrap',
  color: 'var(--color-compass-page-button)',
}
