import type { ComponentType, CSSProperties } from 'react'
import { ArrowRightSolid, ArrowRotateLeft, Bullseye, HelpCircle, RubiLogo } from '@/icons'
import {
  COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN,
  type CompassOverviewTip,
} from '@/data/compassCourseOverviewFixtures'

/**
 * COMPASS COURSE OVERVIEW — the body of a Compass LMS course's Overview page.
 * Figma "Atlas-Compass-Global-Navigation", node 44:2211, 2026-09-23.
 *
 * Four blocks on a warm `#f8f6f3` page, 56px in and 40 apart:
 *
 *   1. **Welcome + the course card** — the course, three facts, the next lesson
 *      and the primary action.
 *   2. **Where you are** — the readiness ring, what it means, and a Rubi prompt
 *      beside it.
 *   3. **Your assignments** — a real `<table>`, sorted as the note says.
 *   4. **Rubi insights** — three learning tips.
 *
 * It renders the design's DAY-ONE content (`COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN`)
 * with the real course title and the learner's first name. Read that file's
 * note before trusting a number here.
 *
 * Departures, all small and on purpose:
 *
 * - **Fonts.** The design's Inter is `--font-body` (Open Sans) and its Source
 *   Serif is `--font-heading-serif` (the Georgia system stack the serif variant
 *   already uses) — neither Inter nor Source Serif is loaded in this app.
 * - **Icons are the registry's, not the design's vectors.** The tip glyphs are
 *   FA Light `arrow-rotate-left` / `circle-question` / `bullseye` (the design's
 *   are line icons that match none exactly), the button arrow is FA Solid
 *   `arrow-right` as the design names, and "Rubi suggests" carries the product's
 *   own `RubiLogo` rather than the design's red hexagon-and-star stand-in.
 * - **Flow layout, not the design's absolute positions** — the Rubi aside and
 *   the ring sit in a flex row, so the block holds at widths other than 1032.
 *
 * Colours are `--color-compass-page-*` in `tokens.css`.
 */
const TIP_ICONS: Record<CompassOverviewTip['kind'], ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  spacing: ArrowRotateLeft,
  testing: HelpCircle,
  knowing: Bullseye,
}

export function CompassCourseOverview({
  courseTitle,
  firstName,
  onBegin,
  onLearnMore,
}: {
  courseTitle: string
  firstName: string
  /** The card's primary action — opens the course. */
  onBegin: () => void
  /** Rubi's "Learn more". */
  onLearnMore: () => void
}) {
  const d = COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN
  return (
    <div className="cre-compass-overview" style={PAGE}>
      <h1 className="cre-visually-hidden">Overview</h1>

      {/* ── 1 · Welcome + course card ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <p style={{ ...EYEBROW_WIDE, margin: 0, paddingBottom: 16, borderBottom: RULE }}>
          Welcome, {firstName}
        </p>

        <section aria-label="Your course" style={CARD}>
          <div style={CARD_HEAD}>
            <p style={{ ...EYEBROW_WIDE, margin: 0 }}>Course:</p>
            <h2 style={COURSE_TITLE}>{courseTitle}</h2>
            <p style={FACTS}>
              <span style={FACT}>
                <span style={FACT_LABEL}>Target exam date:</span>
                <span style={FACT_VALUE}>{d.facts.targetExamDate}</span>
              </span>
              <span style={FACT}>
                <span style={FACT_LABEL}>Left to complete:</span>
                <span style={FACT_VALUE}>{d.facts.leftToComplete}</span>
              </span>
              <span style={FACT}>
                <span style={{ ...FACT_LABEL, fontWeight: 400, textTransform: 'uppercase' }}>
                  Completed
                </span>
                <span style={FACT_VALUE}>{d.facts.completed}</span>
              </span>
            </p>
          </div>

          <div style={LESSON_ROW}>
            <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ ...EYEBROW, margin: 0, textTransform: 'uppercase' }}>
                Lesson {d.nextLesson.number} - <strong style={{ fontWeight: 600 }}>{d.nextLesson.part}</strong>
              </p>
              <p style={LESSON_TITLE}>{d.nextLesson.title}</p>
            </div>
            <button type="button" className="cre-compass-primary" onClick={onBegin} style={PRIMARY}>
              {d.cta}
              <ArrowRightSolid size={13.5} aria-hidden />
            </button>
          </div>
        </section>
      </div>

      {/* ── 2 · Where you are ─────────────────────────────────────── */}
      <section aria-labelledby="compass-where" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 id="compass-where" style={{ ...EYEBROW_SECTION, margin: 0 }}>
            Where you are
          </h2>
          <span style={STAGE_PILL}>{d.stage}</span>
        </div>
        <div style={WHERE_ROW}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, minWidth: 0, flex: '1 1 auto' }}>
            {/* The ring is the DESIGN's gradient, drawn as-is: on day one it
                shows the scale rather than a score, so there is no fill amount
                to derive. `role="img"` so its label is read once. */}
            <div role="img" aria-label="Readiness: beginning your journey" style={RING}>
              <span aria-hidden style={RING_FACE}>
                {d.ringLabel.map((w) => (
                  <span key={w} style={{ display: 'block' }}>
                    {w}
                  </span>
                ))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 17, maxWidth: 452, minWidth: 0 }}>
              <p style={WHERE_TITLE}>{d.whereTitle}</p>
              <p style={WHERE_BODY}>{d.whereBody}</p>
            </div>
          </div>

          <aside aria-label={d.rubi.eyebrow} style={RUBI_ASIDE}>
            <p style={RUBI_EYEBROW}>
              <span aria-hidden style={{ display: 'inline-flex' }}>
                <RubiLogo size={14} aria-hidden />
              </span>
              {d.rubi.eyebrow}
            </p>
            <p style={RUBI_TITLE}>{d.rubi.title}</p>
            <p style={RUBI_BODY}>{d.rubi.body}</p>
            <button type="button" className="cre-compass-outline" onClick={onLearnMore} style={OUTLINE}>
              {d.rubi.cta}
            </button>
          </aside>
        </div>
      </section>

      {/* ── 3 · Your assignments ──────────────────────────────────── */}
      <section aria-labelledby="compass-assignments" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={SECTION_HEAD}>
          <h2 id="compass-assignments" style={{ ...EYEBROW_SECTION, margin: 0 }}>
            Your assignments
          </h2>
          <p style={SECTION_NOTE}>{d.assignmentsNote}</p>
        </div>
        <table style={TABLE}>
          <colgroup>
            <col style={{ width: '35.5%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '24.5%' }} />
          </colgroup>
          <thead>
            <tr>
              {['Assignment', 'Readiness', 'Suggested'].map((h) => (
                <th key={h} scope="col" style={TH}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.assignments.map((a) => (
              <tr key={a.id}>
                <td style={TD}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span aria-hidden style={ASSIGNMENT_RING} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={ASSIGNMENT_NAME}>{a.label}</span>
                      <span style={ASSIGNMENT_WEIGHT}>{a.weight}</span>
                    </span>
                  </span>
                </td>
                <td style={TD}>
                  <span style={READINESS_WORD}>{a.readiness}</span>
                  <span aria-hidden style={READINESS_TRACK} />
                </td>
                <td style={{ ...TD, ...SUGGESTED }}>{a.suggested}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── 4 · Rubi insights ─────────────────────────────────────── */}
      <section aria-labelledby="compass-insights" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 26 }}>
        <div style={{ ...SECTION_HEAD, gap: 12 }}>
          <h2 id="compass-insights" style={{ ...EYEBROW_SECTION, margin: 0 }}>
            Rubi insights
          </h2>
          <p style={SECTION_NOTE}>{d.insightsNote}</p>
        </div>
        <ul style={TIP_LIST}>
          {d.tips.map((tip) => {
            const Icon = TIP_ICONS[tip.kind]
            return (
              <li key={tip.id} style={TIP}>
                <p style={TIP_EYEBROW}>
                  <span aria-hidden style={TIP_ICON}>
                    <Icon size={11} aria-hidden />
                  </span>
                  <span>
                    Learning tip <strong style={{ fontWeight: 600 }}>· {tip.topic}</strong>
                  </span>
                </p>
                <p style={TIP_TITLE}>{tip.title}</p>
                <p style={TIP_BODY}>{tip.body}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY = 'var(--font-body)'
const SERIF = 'var(--font-heading-serif)'
const RULE = '1px solid var(--color-compass-page-rule)'

const PAGE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
  padding: 56,
  minHeight: '100%',
  boxSizing: 'border-box',
  background: 'var(--color-compass-page)',
}

/* 11px uppercase eyebrows — the design uses three trackings. */
const EYEBROW: CSSProperties = {
  fontFamily: BODY,
  fontSize: 11,
  lineHeight: 'normal',
  color: 'var(--color-compass-page-eyebrow)',
}
const EYEBROW_WIDE: CSSProperties = { ...EYEBROW, letterSpacing: '0.16em', textTransform: 'uppercase' }
const EYEBROW_SECTION: CSSProperties = {
  ...EYEBROW,
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
}

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: '24px 27px',
  borderRadius: 14,
  background: 'var(--color-compass-page-card)',
  border: '1px solid var(--color-compass-page-card-border)',
}
const CARD_HEAD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  paddingBottom: 16,
  borderBottom: '1px solid var(--color-compass-page-card-rule)',
}
const COURSE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 34,
  lineHeight: '39.1px',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
const FACTS: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4px 15px',
  fontFamily: BODY,
  fontSize: 11,
  lineHeight: '16px',
}
const FACT: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }
const FACT_LABEL: CSSProperties = { fontWeight: 500, color: 'var(--color-compass-page-fact-label)' }
const FACT_VALUE: CSSProperties = { fontWeight: 600, color: 'var(--color-text-primary)' }

const LESSON_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 20,
}
const LESSON_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 18,
  lineHeight: '30px',
  letterSpacing: '-0.02em',
  color: 'var(--color-compass-page-heading)',
}
/* Colours in `.cre-compass-primary` so hover and focus need no !important. */
const PRIMARY: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '11px 17px',
  border: 'none',
  borderRadius: 9,
  cursor: 'pointer',
  fontFamily: SERIF,
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 'normal',
}

const STAGE_PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20.5,
  padding: '0 10px',
  borderRadius: 20,
  boxSizing: 'border-box',
  background: 'var(--color-compass-page-card)',
  border: '1px solid var(--color-compass-page-card-border)',
  fontFamily: BODY,
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--color-compass-page-pill-ink)',
}

const WHERE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 32,
  paddingBottom: 29,
  borderBottom: RULE,
}
/* The design's conic ring, stop for stop (its foreignObject is rotated -90°,
   so the net start angle is 0). A 14px band around a 132px white face. */
const RING: CSSProperties = {
  position: 'relative',
  flex: 'none',
  width: 160,
  height: 160,
  borderRadius: '50%',
  background:
    'conic-gradient(from 0deg, var(--color-compass-page-ring-1) -72%, var(--color-compass-page-ring-2) -47%, var(--color-compass-page-ring-3) -22%, var(--color-compass-page-ring-4) 3%, var(--color-compass-page-ring-5) 28%, var(--color-compass-page-ring-1) 28%, var(--color-compass-page-ring-2) 53%, var(--color-compass-page-ring-3) 78%, var(--color-compass-page-ring-4) 103%, var(--color-compass-page-ring-5) 128%)',
}
const RING_FACE: CSSProperties = {
  position: 'absolute',
  inset: 14,
  borderRadius: '50%',
  background: 'var(--color-compass-page-ring-face)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  fontFamily: SERIF,
  fontWeight: 600,
  fontSize: 15,
  lineHeight: '18px',
  color: 'var(--color-compass-page-heading)',
}
const WHERE_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '28px',
  letterSpacing: '-0.005em',
  color: 'var(--color-compass-page-heading)',
}
const WHERE_BODY: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 13.5,
  lineHeight: '21.6px',
  color: 'var(--color-compass-page-eyebrow)',
}

const RUBI_ASIDE: CSSProperties = {
  flex: '0 0 300px',
  minHeight: 160,
  boxSizing: 'border-box',
  paddingLeft: 21,
  borderLeft: '1px solid var(--color-compass-page-aside-rule)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
}
const RUBI_EYEBROW: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  fontFamily: BODY,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-rubi)',
}
const RUBI_TITLE: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 19,
  lineHeight: '24.32px',
  letterSpacing: '-0.02em',
  color: 'var(--color-compass-page-heading)',
}
const RUBI_BODY: CSSProperties = {
  margin: '6px 0 12px',
  fontFamily: BODY,
  fontSize: 13.5,
  lineHeight: '20.25px',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Colours in `.cre-compass-outline`. */
const OUTLINE: CSSProperties = {
  height: 31.5,
  padding: '0 14px',
  borderRadius: 9,
  borderWidth: 1,
  borderStyle: 'solid',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: BODY,
  fontWeight: 600,
  fontSize: 13,
}

const SECTION_HEAD: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }
const SECTION_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 12,
  color: 'var(--color-compass-page-muted)',
}

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
}
const TH: CSSProperties = {
  height: 33.5,
  padding: '0 12px',
  textAlign: 'left',
  borderBottom: RULE,
  fontFamily: BODY,
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const TD: CSSProperties = {
  height: 65.5,
  padding: '0 12px',
  borderBottom: RULE,
  verticalAlign: 'middle',
}
const ASSIGNMENT_RING: CSSProperties = {
  width: 24,
  height: 24,
  flex: 'none',
  borderRadius: '50%',
  border: '2px solid var(--color-compass-page-ring-1)',
  boxSizing: 'border-box',
}
const ASSIGNMENT_NAME: CSSProperties = {
  fontFamily: BODY,
  fontSize: 14.5,
  color: 'var(--color-compass-page-heading)',
}
const ASSIGNMENT_WEIGHT: CSSProperties = {
  fontFamily: BODY,
  fontSize: 11.5,
  color: 'var(--color-compass-page-muted)',
}
const READINESS_WORD: CSSProperties = {
  display: 'inline-block',
  fontFamily: BODY,
  fontSize: 12,
  lineHeight: '14.5px',
  color: 'var(--color-compass-page-muted)',
  borderBottom: '1px dashed var(--color-compass-page-muted)',
}
const READINESS_TRACK: CSSProperties = {
  display: 'block',
  height: 7,
  marginTop: 6,
  borderRadius: 4,
  background: 'var(--color-compass-page-rule)',
}
const SUGGESTED: CSSProperties = {
  fontFamily: BODY,
  fontSize: 13,
  color: 'var(--color-compass-page-eyebrow)',
}

const TIP_LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}
const TIP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  padding: '0 20px',
  borderLeft: '2px solid var(--color-compass-page-rule)',
}
const TIP_EYEBROW: CSSProperties = {
  ...EYEBROW,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}
const TIP_ICON: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-compass-page-rule)',
  color: 'var(--color-compass-page-pill-ink)',
}
const TIP_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: SERIF,
  fontWeight: 500,
  fontSize: 19,
  lineHeight: '24px',
  letterSpacing: '-0.02em',
  color: 'var(--color-compass-page-heading)',
}
const TIP_BODY: CSSProperties = {
  margin: 0,
  fontFamily: BODY,
  fontSize: 13.5,
  lineHeight: '18px',
  color: 'var(--color-compass-page-eyebrow)',
}
