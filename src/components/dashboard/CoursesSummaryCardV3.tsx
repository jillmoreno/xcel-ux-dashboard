import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CardEyebrow } from '@/components/courses/LearningPathCard'
import { useAccount } from '@/context/AccountContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { isRecentlyAdded, myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * Dashboard V3 — Courses summary tile (Enlarged Half-Donut Gauge).
 *
 * V3-only variant of `CoursesSummaryCard`. Replaces V2's compact
 * single-arc completion gauge with a larger ~240×130 half-donut that
 * carries three colored segments (Completed → In Progress → Not
 * Started), with the total count + "courses" caption sitting in the
 * gauge's well. No title row, no status pill — the eyebrow + legend
 * + gauge well already say everything the tile needs to say.
 *
 * Recently-added overlaps the three status buckets (a course can be
 * both "recently added" and "in progress"), so it renders as a quiet
 * footnote beneath the legend and never participates in the gauge math.
 */
export function CoursesSummaryCardV3() {
  const { brand } = useAccount()
  const courses = useMemo(() => myCoursesFor(brand), [brand])
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          padding: 20,
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-lg)',
          minHeight: 240,
        }}
      >
        <LoFiWidgetBody rows={5} ariaLabel="Lo-fi courses summary" />
      </section>
    )
  }

  const total = courses.length
  const inProgress = courses.filter((c) => c.myStatus === 'in-progress').length
  const completed = courses.filter((c) => c.myStatus === 'completed').length
  const notStarted = Math.max(0, total - inProgress - completed)
  const recent = courses.filter((c) => isRecentlyAdded(c)).length

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        // V3 tightens gap + vertical padding so the tile's overall
        // height matches the V3 Jump Back In tile (CourseCard-sized).
        gap: 14,
        padding: '10px 20px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        // Size to natural content so the bottom aligns with the
        // Jump Back In tile; the grid's `align-items: stretch` would
        // otherwise stretch this card past the JBI bottom.
        alignSelf: 'start',
      }}
    >
      <CardEyebrow label={`Courses (${total})`} viewAllHref="/my-learning/courses" />

      <Link
        to="/my-learning/courses"
        aria-label="View all my courses"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textDecoration: 'none',
          color: 'inherit',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Gauge section — centered, full-bleed within the card body.
            min-height tuned to land the legend divider at the same y
            as the LP card's stat divider AND make the card's total
            height match the V3 Jump Back In tile bottom. */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 4,
            minHeight: 97,
          }}
        >
          <StatusMixGauge
            total={total}
            completed={completed}
            inProgress={inProgress}
            notStarted={notStarted}
          />
        </div>

        {/* Legend — spans the full inner card width so the swatch +
            label sit at the card's inner left padding (lining up with
            the LP card's stat labels in the sibling tile) and the
            values sit at the card's inner right padding. */}
        <dl
          style={{
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingTop: 10,
            paddingBottom: 6,
            borderTop: '1px solid var(--color-border-subtle)',
            width: '100%',
          }}
        >
          {completed > 0 && (
            <LegendRow swatch="var(--color-status-completed)" label="Completed" value={completed} />
          )}
          {inProgress > 0 && (
            <LegendRow swatch="var(--color-status-in-progress)" label="In Progress" value={inProgress} />
          )}
          {notStarted > 0 && (
            <LegendRow swatch="var(--color-status-not-started)" label="Not Started" value={notStarted} />
          )}
          {recent > 0 && <LegendRow muted label="+ Recently Added" value={recent} />}
        </dl>
      </Link>
    </section>
  )
}

/* ─── Status-Mix Half-Donut Gauge ───────────────────────────────────
 *
 * 180° arc, broken into up to three colored segments in canonical
 * order (Completed → In Progress → Not Started). Each colored segment
 * is rendered as a separate stroked path with the same `ARC_PATH` and
 * a `stroke-dasharray` / `stroke-dashoffset` pair that hides everything
 * except its slice of the half-circle. A 3.5px gap is subtracted from
 * each segment's arc length so adjacent slices don't visually touch;
 * the gap is skipped when only one segment is non-zero so the lone
 * arc fills the full half-circle cleanly.
 *
 * Inside the gauge "well" (the half-circle below the arc), a stacked
 * `total` + "courses" label sits — these are HTML, not SVG, so the
 * font tokens flow through and the count can be selected. */

// Half-circle gauge sized to fit the V3 Courses tile alongside the
// Jump Back In CourseCard. R sized so the arc's peak + stroke fit
// cleanly within the 88px viewBox (R + STROKE/2 = 77, < CY=80) — at
// R=75 the top stroke clipped past y=0 and the arc read as "cut off"
// at the peak. VIEW_H stays at 88 so the card's total height doesn't
// grow past the JBI bottom.
const VIEW_W = 200
const VIEW_H = 88
const CX = 100
const CY = 80
const R = 70
const STROKE = 14
const ARC_LEN = Math.PI * R
const GAP = 3
const ARC_PATH = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

function StatusMixGauge({
  total,
  completed,
  inProgress,
  notStarted,
}: {
  total: number
  completed: number
  inProgress: number
  notStarted: number
}) {
  const isEmpty = total === 0
  const onlyOne = !isEmpty && [completed, inProgress, notStarted].filter((n) => n > 0).length === 1

  const rawArc = (count: number) => (total === 0 ? 0 : (count / total) * ARC_LEN)
  const rawStart = (beforeCount: number) =>
    total === 0 ? 0 : (beforeCount / total) * ARC_LEN
  const arcLen = (count: number) => {
    const raw = rawArc(count)
    return onlyOne ? raw : Math.max(0, raw - GAP)
  }

  const offsetCompleted = 0
  const offsetInProgress = rawStart(completed)
  const offsetNotStarted = rawStart(completed + inProgress)

  return (
    <div
      aria-hidden
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: VIEW_W,
        aspectRatio: `${VIEW_W} / ${VIEW_H}`,
        // Center the gauge horizontally so its left/right edges sit
        // under the centered legend below it.
        marginInline: 'auto',
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        height="100%"
        aria-hidden
        style={{ display: 'block' }}
      >
        <path
          d={ARC_PATH}
          data-segment="track"
          fill="none"
          stroke="var(--color-neutral-100)"
          strokeWidth={STROKE}
        />
        {completed > 0 && (
          <path
            d={ARC_PATH}
            data-segment="completed"
            fill="none"
            stroke="var(--color-success-500)"
            strokeWidth={STROKE}
            strokeDasharray={`${arcLen(completed)} ${ARC_LEN}`}
            strokeDashoffset={-offsetCompleted}
          />
        )}
        {inProgress > 0 && (
          <path
            d={ARC_PATH}
            data-segment="inProgress"
            fill="none"
            stroke="var(--color-primary-500)"
            strokeWidth={STROKE}
            strokeDasharray={`${arcLen(inProgress)} ${ARC_LEN}`}
            strokeDashoffset={-offsetInProgress}
          />
        )}
        {notStarted > 0 && (
          <path
            d={ARC_PATH}
            data-segment="notStarted"
            fill="none"
            stroke="var(--color-neutral-300)"
            strokeWidth={STROKE}
            strokeDasharray={`${arcLen(notStarted)} ${ARC_LEN}`}
            strokeDashoffset={-offsetNotStarted}
          />
        )}
      </svg>
      {/* HTML well — total count + caption stack inside the half-circle. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1,
            color: 'var(--color-neutral-darkest)',
          }}
        >
          {total}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {isEmpty ? 'no courses yet' : total === 1 ? 'course' : 'courses'}
        </span>
      </div>
    </div>
  )
}

/* ─── Legend rows ───────────────────────────────────────────────── */

function LegendRow({
  swatch,
  label,
  value,
  muted = false,
}: {
  swatch?: string
  label: string
  value: number
  muted?: boolean
}) {
  const labelColor = muted ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)'
  const valueColor = muted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'
  const valueWeight = muted ? 500 : 600
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 8,
        ...(muted
          ? {
              paddingTop: 4,
              borderTop: '1px solid var(--color-border-subtle)',
            }
          : null),
      }}
    >
      <dt
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 500,
          lineHeight: '16px',
          color: labelColor,
        }}
      >
        {swatch && (
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: swatch,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        )}
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: valueWeight,
          lineHeight: '18px',
          color: valueColor,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </dd>
    </div>
  )
}
