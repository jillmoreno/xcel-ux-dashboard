import type { CSSProperties } from 'react'
import { ArrowRight, Check, CircleInfo, Lock, RubiLogo } from '@/icons'
import {
  COMPASS_ASSIGNMENTS,
  COMPASS_ASSIGNMENTS_SUMMARY,
  COMPASS_INSIGHTS,
  COMPASS_INSIGHTS_CAPTION,
  COMPASS_READINESS,
  COMPASS_TONIGHT,
  type AssignmentState,
} from '@/data/compassLearningFixtures'

/**
 * The Compass Learning overview body — Figma 765:3471.
 *
 * Four bands: TONIGHT (the one session to do), WHERE YOU ARE (the readiness
 * ring plus Rubi's nudge), YOUR ASSIGNMENTS (the topic table) and WHAT YOUR
 * ANSWERS SHOW.
 *
 * ⚠ A SIBLING OF `CompassOverviewSections`, NOT A REPLACEMENT FOR IT. That one
 * renders the same four bands as lo-fi blocks and is what the COURSE LAUNCHER
 * still shows; this is the populated version the TOP NAV opens. Forking rather
 * than filling in the placeholders is deliberate — the lo-fi Overview is a
 * live prototype surface with its own note explaining why it is bare, and
 * replacing its body would have quietly retired that argument. See
 * `compassLearningFixtures` for where the content came from.
 *
 * ⚠ THREE CONTROLS GO SOMEWHERE; THE REST DO NOT. Start session, Start
 * practice and the table's Continue / Start / Practice again all open the
 * SESSION (`CompassSessionPage`), which is what they do in the prototype. Every
 * other control here — the skip link, Change your plan, How do we figure this
 * out, the insight links — is inert by design: the figures behind them are demo
 * data, so wiring them would claim a connection this page does not have. They
 * are `<button>`s only where the design draws a button.
 */

export function CompassLearningOverview({ onStartSession }: { onStartSession?: () => void }) {
  return (
    <div style={columnStyle}>
      <TonightCallout onStart={onStartSession} />
      <ReadinessBand onStart={onStartSession} />
      <AssignmentsTable onStart={onStartSession} />
      <InsightsBand />
    </div>
  )
}

/* ─── TONIGHT ──────────────────────────────────────────────────────────── */

function TonightCallout({ onStart }: { onStart?: () => void }) {
  return (
    <section>
      <p style={eyebrowStyle}>Tonight</p>
      <div style={calloutStyle}>
        <div style={calloutRowStyle}>
          <div>
            <div style={dateNumberStyle}>{COMPASS_TONIGHT.dayNumber}</div>
            <div style={dateDayStyle}>{COMPASS_TONIGHT.dayName}</div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={calloutTitleStyle}>{COMPASS_TONIGHT.title}</div>
            <div style={calloutDetailStyle}>{COMPASS_TONIGHT.detail}</div>
          </div>
          <button type="button" style={skipStyle}>
            {COMPASS_TONIGHT.skipLabel}
          </button>
          {/* ⚠ NO PLAY GLYPH. The design draws a ▶ before the label and the
              icon registry — self-hosted Font Awesome 7 Pro Light — has no
              play mark. Substituting a chevron would put a DIFFERENT icon in a
              named slot, so the button ships as its label until the real glyph
              is added to `src/icons/`. */}
          <button type="button" style={filledButtonStyle} onClick={onStart}>
            {COMPASS_TONIGHT.startLabel}
          </button>
        </div>
        <div style={weekRowStyle}>
          {/* The strip is a picture of the week, and the sentence beside it
              says the same thing in words — so the dots are decorative and the
              screen reader hears the sentence once, not fourteen times. */}
          <div aria-hidden style={dotsStyle}>
            {COMPASS_TONIGHT.dots.map((state, i) => (
              <span key={i} style={{ ...dotStyle, background: dotFill(state) }} />
            ))}
          </div>
          <p style={weekNoteStyle}>{COMPASS_TONIGHT.weekNote}</p>
          <button type="button" style={quietLinkStyle}>
            {COMPASS_TONIGHT.planLabel}
            <ArrowRight size={14} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  )
}

function dotFill(state: 'done' | 'now' | 'ahead'): string {
  if (state === 'done') return 'var(--color-text-primary)'
  if (state === 'now') return 'var(--color-primary-500)'
  return 'var(--color-border-subtle)'
}

/* ─── WHERE YOU ARE ────────────────────────────────────────────────────── */

function ReadinessBand({ onStart }: { onStart?: () => void }) {
  const { percent, ringLabel, lead, explainLabel, rubi, eyebrow, tag } = COMPASS_READINESS
  return (
    <section>
      <p style={{ ...eyebrowStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
        {eyebrow}
        <span style={tagStyle}>{tag}</span>
      </p>
      <div style={readinessGridStyle}>
        {/* The ring is a conic sweep with a punched-out centre — the same
            construction the prototype uses. `role="img"` with the percentage
            in the label, because the number inside is drawn in two pieces
            (numeral, then a superscript %) and would otherwise be read apart. */}
        <div
          role="img"
          aria-label={`${percent}% ready`}
          style={{
            ...ringStyle,
            background: `conic-gradient(var(--color-primary-500) ${percent}%, var(--color-border-subtle) 0)`,
          }}
        >
          <span aria-hidden style={ringHoleStyle} />
          <span aria-hidden style={ringFigureStyle}>
            {percent}
            <sup style={ringSupStyle}>%</sup>
            <span style={ringLabelStyle}>{ringLabel}</span>
          </span>
        </div>
        <div>
          <p style={leadStyle}>{lead}</p>
          <button type="button" style={explainStyle}>
            <CircleInfo size={15} aria-hidden />
            {explainLabel}
          </button>
        </div>
        <div style={rubiPanelStyle}>
          <p style={rubiEyebrowStyle}>
            <RubiLogo size={13} aria-hidden />
            {rubi.eyebrow}
          </p>
          <h3 style={rubiTitleStyle}>{rubi.title}</h3>
          <p style={rubiDetailStyle}>{rubi.detail}</p>
          <button type="button" style={outlineButtonStyle} onClick={onStart}>
            {rubi.action}
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── YOUR ASSIGNMENTS ─────────────────────────────────────────────────── */

function AssignmentsTable({ onStart }: { onStart?: () => void }) {
  return (
    <section>
      <p style={{ ...eyebrowStyle, display: 'flex', gap: 14, alignItems: 'baseline' }}>
        Your assignments
        <span style={summaryStyle}>{COMPASS_ASSIGNMENTS_SUMMARY}</span>
      </p>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Assignment</th>
            <th style={{ ...thStyle, width: '40%' }}>Readiness</th>
            <th style={thStyle}>Due</th>
            {/* Named for assistive tech even though the column is visually
                blank — a bare `<th>` leaves the action buttons in an unlabelled
                column. */}
            <th style={{ ...thStyle, textAlign: 'right' }}>
              <span style={srOnlyStyle}>Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPASS_ASSIGNMENTS.map((a) => (
            <tr key={a.name}>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Marker state={a.state} />
                  <div style={{ minWidth: 0 }}>
                    <div style={assignmentNameStyle(a.state)}>{a.name}</div>
                    <div style={assignmentWeightStyle}>{a.weight}</div>
                  </div>
                </div>
              </td>
              <td style={tdStyle}>
                <span style={readinessLabelStyle(a.state)}>{a.readinessLabel}</span>
                <div style={barTrackStyle}>
                  <span
                    style={{ ...barFillStyle, width: `${a.barPct}%`, background: barFill(a.state) }}
                  />
                </div>
              </td>
              <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {a.due}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {a.action ? (
                  /* Practice again / Continue / Start all open the session, as
                     they do in the prototype — one destination, three routes
                     into it, which is what makes the page feel like one thing. */
                  <button type="button" style={outlineButtonStyle} onClick={onStart}>
                    {a.action}
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Marker({ state }: { state: AssignmentState }) {
  if (state === 'proven' || state === 'not-proven') {
    const fill = state === 'proven' ? 'var(--color-success-600)' : 'var(--color-warning-600)'
    return (
      <span aria-hidden style={{ ...markerStyle, background: fill, color: '#fff' }}>
        <Check size={13} />
      </span>
    )
  }
  if (state === 'locked') {
    return (
      <span
        aria-hidden
        style={{ ...markerStyle, background: 'var(--color-text-primary)', color: '#fff' }}
      >
        <Lock size={12} />
      </span>
    )
  }
  /* In progress and not started differ only by ring colour — the state's word
     is in the readiness cell, so the marker never has to carry it alone. */
  const ring =
    state === 'in-progress' ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'
  return <span aria-hidden style={{ ...markerStyle, border: `2px solid ${ring}` }} />
}

function barFill(state: AssignmentState): string {
  if (state === 'proven') return 'var(--color-success-600)'
  if (state === 'not-proven') return 'var(--color-warning-600)'
  return 'var(--color-primary-500)'
}

/* ─── WHAT YOUR ANSWERS SHOW ───────────────────────────────────────────── */

function InsightsBand() {
  return (
    <section style={insightsSectionStyle}>
      <p style={{ ...eyebrowStyle, display: 'flex', gap: 12, alignItems: 'baseline' }}>
        What your answers show
        <span style={summaryStyle}>{COMPASS_INSIGHTS_CAPTION}</span>
      </p>
      <div style={insightsGridStyle}>
        {COMPASS_INSIGHTS.map((ins) => (
          <div key={ins.tag} style={insightStyle}>
            <p style={insightTagStyle}>{ins.tag}</p>
            <h4 style={insightHeadlineStyle}>{ins.headline}</h4>
            <p style={insightDetailStyle}>{ins.detail}</p>
            <button type="button" style={quietLinkStyle}>
              {ins.action}
              <ArrowRight size={14} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── styles ───────────────────────────────────────────────────────────── */

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 34,
  maxWidth: 1120,
}
const eyebrowStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const summaryStyle: CSSProperties = {
  fontSize: 12,
  letterSpacing: 0,
  textTransform: 'none',
  fontWeight: 400,
  color: 'var(--color-text-tertiary)',
}
const calloutStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 14,
  padding: '22px 26px',
}
const calloutRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto auto',
  gap: 22,
  alignItems: 'center',
}
const dateNumberStyle: CSSProperties = {
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 34,
  fontWeight: 500,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}
const dateDayStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  marginTop: 2,
}
const calloutTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
const calloutDetailStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 13.5,
  marginTop: 3,
}
const skipStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 13,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
}
const filledButtonStyle: CSSProperties = {
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 9,
  padding: '11px 18px',
  fontWeight: 600,
  fontSize: 13.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  whiteSpace: 'nowrap',
}
const outlineButtonStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--color-primary-700)',
  border: '1px solid var(--color-primary-700)',
  borderRadius: 9,
  padding: '7px 14px',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
}
const weekRowStyle: CSSProperties = {
  display: 'flex',
  gap: 24,
  alignItems: 'center',
  marginTop: 16,
  paddingTop: 16,
  borderTop: '1px solid var(--color-border-subtle)',
}
const dotsStyle: CSSProperties = { display: 'flex', gap: 6, flex: 'none' }
const dotStyle: CSSProperties = { width: 14, height: 14, borderRadius: 3 }
const weekNoteStyle: CSSProperties = {
  margin: 0,
  color: 'var(--color-text-secondary)',
  fontSize: 13,
  flex: 1,
  lineHeight: 1.5,
}
const quietLinkStyle: CSSProperties = {
  color: 'var(--color-primary-700)',
  fontWeight: 600,
  fontSize: 13,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}
const tagStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-primary-700)',
  background: 'var(--color-primary-100)',
  border: '1px solid var(--color-primary-200)',
  padding: '2px 10px',
  borderRadius: 20,
  textTransform: 'none',
  letterSpacing: 0,
}
const readinessGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '170px minmax(0, 1fr) 400px',
  gap: 30,
  alignItems: 'center',
  paddingBottom: 28,
  borderBottom: '1px solid var(--color-border-subtle)',
}
const ringStyle: CSSProperties = {
  width: 160,
  height: 160,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}
const ringHoleStyle: CSSProperties = {
  position: 'absolute',
  inset: 14,
  background: 'var(--color-surface-card)',
  borderRadius: '50%',
}
const ringFigureStyle: CSSProperties = {
  position: 'relative',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 34,
  fontWeight: 600,
  lineHeight: 1,
  textAlign: 'center',
  color: 'var(--color-text-primary)',
}
const ringSupStyle: CSSProperties = { fontSize: 16, fontWeight: 500, marginLeft: 1 }
const ringLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  letterSpacing: '0.14em',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  marginTop: 3,
  textTransform: 'uppercase',
}
const leadStyle: CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.6,
  maxWidth: '46ch',
  color: 'var(--color-text-primary)',
}
const explainStyle: CSSProperties = {
  ...quietLinkStyle,
  marginTop: 14,
  fontWeight: 500,
  fontSize: 14,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
}
const rubiPanelStyle: CSSProperties = {
  borderLeft: '2px solid var(--color-error-600, #b23b2e)',
  paddingLeft: 20,
}
const rubiEyebrowStyle: CSSProperties = {
  margin: '0 0 7px',
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-error-600, #b23b2e)',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
}
const rubiTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontWeight: 500,
  fontSize: 19,
  lineHeight: 1.28,
  color: 'var(--color-text-primary)',
}
const rubiDetailStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
  fontSize: 13.5,
  lineHeight: 1.5,
  margin: '0 0 14px',
}
const tableStyle: CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: 12 }
const thStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
  fontWeight: 600,
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border-subtle)',
}
const tdStyle: CSSProperties = {
  padding: '16px 12px',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontSize: 14,
  verticalAlign: 'middle',
}
const markerStyle: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
}
const assignmentNameStyle = (state: AssignmentState): CSSProperties => ({
  fontSize: 14.5,
  color: state === 'locked' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
})
const assignmentWeightStyle: CSSProperties = {
  fontSize: 11.5,
  color: 'var(--color-text-tertiary)',
  marginTop: 1,
}
const readinessLabelStyle = (state: AssignmentState): CSSProperties => ({
  fontSize: 12,
  marginBottom: 6,
  display: 'inline-block',
  fontWeight: state === 'proven' || state === 'not-proven' ? 600 : 400,
  color:
    state === 'proven'
      ? 'var(--color-success-600)'
      : state === 'not-proven'
        ? 'var(--color-warning-700)'
        : 'var(--color-text-secondary)',
})
const barTrackStyle: CSSProperties = {
  height: 7,
  background: 'var(--color-border-subtle)',
  borderRadius: 4,
  overflow: 'hidden',
}
const barFillStyle: CSSProperties = { display: 'block', height: '100%', borderRadius: 4 }
const insightsSectionStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border-subtle)',
  paddingTop: 24,
}
const insightsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 28,
}
const insightStyle: CSSProperties = {
  paddingLeft: 18,
  borderLeft: '2px solid var(--color-border-subtle)',
}
const insightTagStyle: CSSProperties = {
  margin: '0 0 7px',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}
const insightHeadlineStyle: CSSProperties = {
  margin: '0 0 5px',
  fontFamily: 'var(--font-heading, Georgia, serif)',
  fontSize: 17,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text-primary)',
}
const insightDetailStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 13.5,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}
const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}
