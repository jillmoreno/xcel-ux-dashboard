import type { CSSProperties } from 'react'

/**
 * The Readiness Score arc — Figma "Exam Summary" node 1092:230527.
 *
 * NOT `ProgressDonut`. That component is a closed ring split into category
 * segments, which answers "how much of each kind have you done"; this is an
 * open 240° arc carrying a red→amber→green RAMP, which answers "how good is
 * this number". The two look alike at a glance and mean different things, so
 * they are deliberately separate components rather than one with a mode.
 *
 * The ramp is drawn as three fixed bands rather than a gradient on purpose:
 * the bands ARE the thresholds (`REVIEW_THRESHOLD` / `STRONG_THRESHOLD`), so a
 * learner can see which zone they are in, and a gradient would blur exactly the
 * boundary the score is being judged against. The band the needle lands in is
 * drawn at full strength and the other two are dimmed, so the arc reads as a
 * verdict rather than as decoration.
 */

const START_ANGLE = 150 // degrees, clockwise from 3 o'clock — bottom-left
const SWEEP = 240 // a 240° arc, leaving the bottom open for the number

type Props = {
  /** 0-100. */
  score: number
  /** The two band edges, so the arc cannot disagree with `bandFor`. */
  reviewThreshold: number
  strongThreshold: number
  size?: number
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 0) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** SVG arc path between two percentages of the sweep. */
function arcPath(cx: number, cy: number, r: number, fromPct: number, toPct: number) {
  const a0 = START_ANGLE + (SWEEP * fromPct) / 100
  const a1 = START_ANGLE + (SWEEP * toPct) / 100
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`
}

export function ReadinessGauge({ score, reviewThreshold, strongThreshold, size = 132 }: Props) {
  const clamped = Math.max(0, Math.min(100, score))
  const cx = size / 2
  const cy = size / 2
  const stroke = Math.round(size * 0.1)
  const r = (size - stroke) / 2 - 2

  // Which band the score lands in — the one drawn at full strength.
  const active =
    clamped >= strongThreshold ? 'strong' : clamped >= reviewThreshold ? 'shaky' : 'review'

  const bands = [
    { key: 'review', from: 0, to: reviewThreshold, color: 'var(--color-error-500)' },
    { key: 'shaky', from: reviewThreshold, to: strongThreshold, color: 'var(--color-warning-500)' },
    { key: 'strong', from: strongThreshold, to: 100, color: 'var(--color-success-600)' },
  ] as const

  return (
    <div style={wrapStyle}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Readiness score ${clamped} out of 100`}
      >
        {bands.map((b) => (
          <path
            key={b.key}
            d={arcPath(cx, cy, r, b.from, b.to)}
            fill="none"
            stroke={b.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            // The two bands the learner is NOT in stay visible but recede, so
            // the arc reads as "you are here" rather than as a colour wheel.
            opacity={b.key === active ? 1 : 0.28}
          />
        ))}
        {/* The marker sits ON the arc rather than as a needle from the centre:
            at 132px a needle's tail crosses the number, and the score is the
            thing being read. */}
        <circle
          {...markerAt(cx, cy, r, clamped)}
          r={stroke * 0.62}
          fill="var(--color-surface-card)"
          stroke={bands.find((b) => b.key === active)!.color}
          strokeWidth={3}
        />
      </svg>
      <span aria-hidden style={{ ...numberStyle, fontSize: Math.round(size * 0.27) }}>
        {clamped}
      </span>
    </div>
  )
}

function markerAt(cx: number, cy: number, r: number, pct: number) {
  const p = polar(cx, cy, r, START_ANGLE + (SWEEP * pct) / 100)
  return { cx: p.x, cy: p.y }
}

const wrapStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const numberStyle: CSSProperties = {
  position: 'absolute',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}
