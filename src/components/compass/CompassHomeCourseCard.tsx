import type { CSSProperties } from 'react'
import { ArrowRightSolid } from '@/icons'

/**
 * COMPASS HOME COURSE CARD — Figma "Atlas-Compass-Global-Navigation", node
 * 108:4579, 2026-09-24.
 *
 * The Atlas home's one course card: it REPLACES two blocks, the Course Progress
 * header (art, title, bar, 62%, stats) and the "Learning with Compass — Jump
 * Back In" card, which stated the same course twice. Top half names the course
 * and three facts; under a rule, the lesson to open and the one action.
 *
 * Config-driven like the rest of the Compass pieces — the home hands it the
 * values it already resolves, so a demo state or an entered exam date moves
 * this card exactly as it moved the blocks it replaced. **The design is drawn
 * at the NOT-STARTED state** ("0 of 42 lessons", "Lesson 1"); past that, the
 * same slots carry the live figures. The button reads "Begin Course" either
 * way (the designer's call, 2026-09-24) and "Review Course" once complete.
 *
 * Departures: Open Sans for the design's Inter; the product serif
 * (`--font-heading-serif`) for Source Serif 4 / Source Serif Pro; the lesson
 * title is the demo's current lesson, not the design's placeholder.
 */
export type CompassHomeCourseCardProps = {
  courseTitle: string
  coverUrl?: string | null
  /** A formatted exam date, or absent → "Needs Scheduled". */
  examDate?: string
  /** Remaining time, printed as given ("27 days"). */
  leftToComplete: string
  completed: number
  total: number
  unit: string
  lessonNumber: number
  partNumber: number
  partCount: number
  lessonTitle: string
  estimatedMinutes: number
  /** The coursework is finished — the card offers review instead. */
  complete?: boolean
  onBegin?: () => void
  /** The "Course Overview" chip (Figma 108:4620) — opens the course's Compass
   *  Overview page. No handler → a static label, not a dead control. */
  onOverview?: () => void
}

export function CompassHomeCourseCard({
  courseTitle,
  coverUrl,
  examDate,
  leftToComplete,
  completed,
  total,
  unit,
  lessonNumber,
  partNumber,
  partCount,
  lessonTitle,
  estimatedMinutes,
  complete = false,
  onBegin,
  onOverview,
}: CompassHomeCourseCardProps) {
  // "Begin Course" at every point short of complete — 2026-09-24, the direct
  // ask, reversing the "Resume Course" this card read once lessons were done.
  const cta = complete ? 'Review Course' : 'Begin Course'
  return (
    <section aria-label="Current course" style={CARD}>
      <div style={TOP}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {coverUrl ? <img src={coverUrl} alt="" aria-hidden style={COVER} /> : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={EYEBROW}>Current course:</p>
            <h2 style={TITLE}>{courseTitle}</h2>
          </div>
        </div>
        {/* THE FACTS ROW — Figma 108:4620 (2026-09-24): led by a "Course
            Overview" chip exactly the cover's width, so the facts start where
            the title does. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 24, rowGap: 4 }}>
          {onOverview ? (
            <button type="button" className="cre-compass-home-chip" onClick={onOverview} style={CHIP}>
              Course Overview
            </button>
          ) : (
            <span style={CHIP}>Course Overview</span>
          )}
          <Fact label="Target exam date:" value={examDate ?? 'Needs Scheduled'} />
          <Fact label="Left to complete:" value={leftToComplete} />
          {total > 0 ? (
            <Fact label="Completed" upper value={`${completed} of ${total} ${unit}`} />
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, width: '100%' }}>
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {complete ? null : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={LESSON_PILL}>
                Lesson {lessonNumber}
                <span aria-hidden style={PILL_DASH} />
                Part {partNumber} of {partCount}
              </span>
              <span style={META}>
                Estimated Time: <strong style={{ fontWeight: 600 }}>{estimatedMinutes} minutes</strong>
              </span>
            </div>
          )}
          <p style={LESSON_TITLE}>{complete ? 'Coursework complete' : lessonTitle}</p>
        </div>
        <button type="button" className="cre-compass-primary" onClick={onBegin} disabled={!onBegin} style={CTA}>
          {cta}
          <ArrowRightSolid size={14} aria-hidden />
        </button>
      </div>
    </section>
  )
}

function Fact({ label, value, upper }: { label: string; value: string; upper?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <span
        style={{
          ...FACT,
          color: 'var(--color-compass-page-muted)',
          fontWeight: upper ? 400 : 500,
          textTransform: upper ? 'uppercase' : undefined,
        }}
      >
        {label}
      </span>
      <span style={{ ...FACT, fontWeight: 600, color: 'var(--color-text-primary)' }}>{value}</span>
    </span>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
/* Surfaces reuse the Overview's `--color-compass-page-card*` tokens — the
   design draws this card with the same fill and rule. */

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  // 32 all round, not the design's 24/27 — 2026-09-24, the direct ask: every
  // filled module on the Atlas home takes a 32px inset.
  padding: 32,
  boxSizing: 'border-box',
  borderRadius: 14,
  background: 'var(--color-compass-page-card)',
  // No outer stroke — 2026-09-24, the direct ask; the fill carries the edge.
}
const TOP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  paddingBottom: 12,
  borderBottom: '1px solid var(--color-compass-page-card-rule)',
}
const COVER: CSSProperties = {
  width: 94,
  height: 94,
  flex: 'none',
  objectFit: 'cover',
  display: 'block',
  borderRadius: '0 8px 0 8px',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 500,
  fontSize: 34,
  lineHeight: '39px',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
/* 94 wide — the cover's width — so the facts line up under the title. */
const CHIP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 94,
  flex: 'none',
  boxSizing: 'border-box',
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid var(--color-compass-page-card-border)',
  // No inline background — `.cre-compass-home-chip` owns it, so hover can win.
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '13px',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
}
const FACT: CSSProperties = { fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '16px' }
const LESSON_PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid var(--color-compass-page-card-border)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 10,
  lineHeight: '13px',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
}
const PILL_DASH: CSSProperties = {
  width: 5,
  height: 3,
  borderRadius: 1.5,
  background: 'var(--color-neutral-400)',
}
const META: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '13px',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
}
const LESSON_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 16,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}
/* Colours, hover and focus are the Overview's `.cre-compass-primary`
   (tokens.css) — the design draws the same button. */
const CTA: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  flex: 'none',
  padding: '11px 17px',
  borderRadius: 9,
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 600,
  fontSize: 16,
  whiteSpace: 'nowrap',
}
