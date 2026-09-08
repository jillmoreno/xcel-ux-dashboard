import { type CSSProperties } from 'react'
import type { LearningPathCategory, LearningPathCategoryBreakdown } from '@/data/learningFixtures'

/**
 * Shared progress-gauge primitives for the Current Learning Path widget
 * ([`ProgressTrackerCard`](src/components/learning/ProgressTrackerCard.tsx)) and
 * its detail panel ([`LearningPathDetailPanel`](src/components/learning/LearningPathDetailPanel.tsx)),
 * so both render identical visuals. Canonical design:
 * `explorations/learning-path-categories/category-breakdown-and-detail-panel.html`
 * (Option A).
 *
 * - **`ProgressDonut`** — the completion gauge. With a Mandatory + Elective
 *   breakdown it becomes a **two-segment** donut (Mandatory arc =
 *   `--color-primary-500`, Elective arc = `--color-secondary-600`) whose arc
 *   lengths are each category's *completed* hours as a fraction of **total
 *   required** hours, so the two arcs together fill the same % the center label
 *   shows. Without a breakdown it falls back to the original single-color fill.
 * - **`CategoryBars`** — the two slim labeled Mandatory / Elective progress bars.
 *
 * Category colors are standardized via the shared tokens **Mandatory →
 * `--color-category-mandatory`** (brand primary) and **Elective →
 * `--color-category-elective`** (brand secondary). Brand-portable — every
 * color is a token, so the gauge relights on `<html data-brand>` flips, and
 * the two values live in exactly one place (tokens.css).
 */

export const GAUGE_SIZE = 120
const STROKE = 14
const RADIUS = (GAUGE_SIZE - STROKE) / 2
export const GAUGE_CIRCUMFERENCE = 2 * Math.PI * RADIUS

export const CAT_MANDATORY_COLOR = 'var(--color-category-mandatory)'
export const CAT_ELECTIVE_COLOR = 'var(--color-category-elective)'

// Category palette + normalizer live in progressGaugeUtil (a non-component
// module) so this file only exports components (react-refresh). Consumers import
// categoryColorFor / resolvePathCategories / CATEGORY_PALETTE from there.
import { categoryColorFor } from './progressGaugeUtil'

/** Themed gauge colors (dark-band reframe). Defaults: neutral track + primary
 *  fill + dark center text. The two category arc colors never change. */
export type GaugeColors = { track: string; fill: string; text: string }

export function ProgressDonut({
  percent,
  mandatory,
  elective,
  categories,
  size = GAUGE_SIZE,
  caption,
  colors,
}: {
  percent: number
  /** When BOTH category breakdowns are present the donut renders two arcs. */
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  /** Generalized N-category segments (supersedes mandatory/elective). Each arc
   *  is colored by index via `categoryColorFor`. */
  categories?: LearningPathCategory[]
  size?: number
  /** Center caption under the percent (e.g. "Complete"). Omitted on the panel. */
  caption?: string
  colors?: GaugeColors
}) {
  const track = colors?.track ?? 'var(--color-neutral-200)'
  const text = colors?.text ?? 'var(--color-neutral-darkest)'

  // Build the arc segments — explicit categories (colored by index) or the
  // Mandatory/Elective pair.
  const segs: { completed: number; required: number; color: string }[] =
    categories && categories.length
      ? categories.map((c, i) => ({ completed: c.completed, required: c.required, color: categoryColorFor(i) }))
      : mandatory != null && elective != null
        ? [
            { completed: mandatory.completed, required: mandatory.required, color: CAT_MANDATORY_COLOR },
            { completed: elective.completed, required: elective.required, color: CAT_ELECTIVE_COLOR },
          ]
        : []
  const totalRequired = segs.reduce((s, c) => s + c.required, 0)
  const segmented = segs.length > 0 && totalRequired > 0

  const C = GAUGE_CIRCUMFERENCE
  const GAP = 4
  const filled = (percent / 100) * C

  // Cumulative arc positions (each category's completed hrs ÷ total required),
  // with a small gap between drawn arcs so the round caps don't merge.
  let acc = 0
  const arcs = segs.map((seg) => {
    const arc = totalRequired > 0 ? (seg.completed / totalRequired) * C : 0
    const gap = acc > 0 && arc > 0 ? GAP : 0
    const start = acc + gap
    acc = start + arc
    return { arc, start, color: seg.color }
  })

  const ariaLabel = `${percent}% of required credit hours complete`
  const big = size >= 110

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`} role="img" aria-label={ariaLabel}>
        <circle cx={GAUGE_SIZE / 2} cy={GAUGE_SIZE / 2} r={RADIUS} fill="none" stroke={track} strokeWidth={STROKE} />
        {segmented ? (
          arcs.map((a, i) =>
            a.arc > 0 ? (
              <circle
                key={i}
                cx={GAUGE_SIZE / 2}
                cy={GAUGE_SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={a.color}
                strokeWidth={STROKE}
                strokeDasharray={`${a.arc} ${C - a.arc}`}
                strokeDashoffset={-a.start}
                transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
                strokeLinecap="round"
              />
            ) : null,
          )
        ) : (
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors?.fill ?? 'var(--color-progress-fill)'}
            strokeWidth={STROKE}
            strokeDasharray={`${filled} ${C - filled}`}
            transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: big ? 34 : 26, lineHeight: 1, color: text }}>
            {percent}
          </span>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: big ? 17 : 13, lineHeight: 1, color: text }}>
            %
          </span>
        </div>
        {caption && (
          <span
            style={{
              marginTop: 4,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 12,
              lineHeight: '16px',
              color: text,
            }}
          >
            {caption}
          </span>
        )}
      </div>
    </div>
  )
}

/** The two slim category progress bars (Option A's defining row). Labels default
 *  to "Mandatory" / "Elective" (CE) but callers can pass education-type-aware
 *  names (e.g. QE "Required Courses" / "Elective", or STC CE "Products and
 *  Practices" / "Ethics and Professional Responsibility"). */
/** Build the ordered legend list — explicit categories (colored by index) or
 *  the Mandatory/Elective pair. Shared by the bars + compact legend. */
type LegendRow = { key: string; label: string; color: string; breakdown: LearningPathCategoryBreakdown }
function buildLegendList(props: {
  categories?: LearningPathCategory[]
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  mandatoryLabel: string
  electiveLabel: string
}): LegendRow[] {
  if (props.categories && props.categories.length) {
    return props.categories.map((c, i) => ({
      key: c.key,
      label: c.label,
      color: categoryColorFor(i),
      breakdown: { completed: c.completed, required: c.required },
    }))
  }
  return [
    { key: 'mandatory', label: props.mandatoryLabel, color: CAT_MANDATORY_COLOR, breakdown: props.mandatory ?? { completed: 0, required: 0 } },
    { key: 'elective', label: props.electiveLabel, color: CAT_ELECTIVE_COLOR, breakdown: props.elective ?? { completed: 0, required: 0 } },
  ]
}

export function CategoryBars({
  mandatory,
  elective,
  categories,
  mandatoryLabel = 'Mandatory',
  electiveLabel = 'Elective',
  onDark = false,
}: {
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  /** Generalized N-category list (supersedes mandatory/elective). */
  categories?: LearningPathCategory[]
  mandatoryLabel?: string
  electiveLabel?: string
  /** Dark-band reframe — light label text + translucent track (the dot/fill
   *  colors stay per the palette, which read on navy/teal). */
  onDark?: boolean
}) {
  const list = buildLegendList({ categories, mandatory, elective, mandatoryLabel, electiveLabel })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      {list.map((row) => (
        <CategoryBar key={row.key} label={row.label} color={row.color} breakdown={row.breakdown} onDark={onDark} />
      ))}
    </div>
  )
}

/** Compact category legend (Option A · Compact) — replaces the bars with two
 *  stacked items: the colored dot + label on top, the `6 / 9 hrs` count stacked
 *  directly below (indented 18px to align under the label text). No bars. */
export function CategoryLegendCompact({
  mandatory,
  elective,
  categories,
  mandatoryLabel = 'Mandatory',
  electiveLabel = 'Elective',
  onDark = false,
}: {
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  /** Generalized N-category list (supersedes mandatory/elective). */
  categories?: LearningPathCategory[]
  mandatoryLabel?: string
  electiveLabel?: string
  onDark?: boolean
}) {
  const list = buildLegendList({ categories, mandatory, elective, mandatoryLabel, electiveLabel })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
      {list.map((row) => (
        <CompactLegendItem key={row.key} label={row.label} color={row.color} breakdown={row.breakdown} onDark={onDark} />
      ))}
    </div>
  )
}

function CompactLegendItem({
  label,
  color,
  breakdown,
  onDark,
}: {
  label: string
  color: string
  breakdown: LearningPathCategoryBreakdown
  onDark: boolean
}) {
  const { completed, required } = breakdown
  const textColor = onDark ? 'var(--color-text-inverse)' : 'var(--color-text-primary)'
  const unitColor = onDark ? 'rgb(255 255 255 / 0.7)' : 'var(--color-neutral-dark)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          color: textColor,
        }}
      >
        <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        {label}
      </span>
      {/* Count stacked under the label — `padding-left: 18px` (dot 10 + gap 8)
          aligns it under the label text. */}
      <span
        style={{
          paddingLeft: 18,
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1.1,
          color: textColor,
        }}
      >
        {completed}
        <small style={{ fontSize: 12, fontWeight: 600, color: unitColor }}>{` / ${required} hrs`}</small>
      </span>
    </div>
  )
}

function CategoryBar({
  label,
  color,
  breakdown,
  onDark,
}: {
  label: string
  color: string
  breakdown: LearningPathCategoryBreakdown
  onDark: boolean
}) {
  const { completed, required } = breakdown
  const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0
  const nameColor = onDark ? 'var(--color-text-inverse)' : 'var(--color-text-primary)'
  const countColor = onDark ? 'rgb(255 255 255 / 0.7)' : 'var(--color-text-secondary)'
  const trackColor = onDark ? 'rgb(255 255 255 / 0.2)' : 'var(--color-neutral-100)'
  const topRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={topRow}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: nameColor }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          {label}
        </span>
        <span style={{ color: countColor, fontWeight: 600 }}>
          <b style={{ color: nameColor }}>{completed}</b> / {required} hrs
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 'var(--radius-pill)', background: trackColor, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-pill)', background: color }} />
      </div>
    </div>
  )
}
