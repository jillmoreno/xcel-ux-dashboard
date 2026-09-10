import type { CSSProperties } from 'react'

/**
 * The Readiness Score arc — Figma "Exam Summary" node 1092:230527, restyled
 * 2026-09-09 to drop its red band.
 *
 * ── Why there is no red ──────────────────────────────────────────────────────
 * The arc was three bands, red / amber / green, straight from the design. Red
 * is gone: this number is the learner's own standing, and a learner mid-course
 * is BELOW the pass mark by definition — a red arc for being where you are
 * supposed to be reads as a verdict on you rather than as a distance still to
 * travel. The XCEL walk-through had already settled this for the readiness
 * screen ("probabilistic, and it has to say so without discouraging").
 *
 * **The red did not leave the page.** Chapter dots and topic bars keep it, and
 * that divergence is the point: red on a CHAPTER is actionable — it names a
 * specific thing to go and fix — while red on YOU is just discouraging. One is
 * a worklist, the other is a self-assessment, and they are allowed to speak
 * differently.
 *
 * ── Why the bands split at the PASS MARK ────────────────────────────────────
 * Amber runs to `passMark`, green from there. That is a real threshold the
 * state sets, so green means "at or above what you must clear" rather than
 * "above a number we chose" — which is what `STRONG_THRESHOLD` (80, invented)
 * would have meant. A tick marks the boundary and the caption names it, so the
 * arc is readable without the legend the design never had.
 *
 * NOT a gradient: the boundary IS the information. A gradient blurs exactly the
 * point the score is being judged against.
 */

const START_ANGLE = 150 // degrees, clockwise from 3 o'clock — bottom-left
const SWEEP = 240 // a 240° arc, leaving the bottom open for the number

type Props = {
  /** 0-100. */
  score: number
  /** The score that clears the real exam. Splits the two bands. */
  passMark: number
  size?: number
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function angleFor(pct: number) {
  return START_ANGLE + (SWEEP * pct) / 100
}

/** SVG arc path between two percentages of the sweep. */
function arcPath(cx: number, cy: number, r: number, fromPct: number, toPct: number) {
  const a0 = angleFor(fromPct)
  const a1 = angleFor(toPct)
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`
}

export function ReadinessGauge({ score, passMark, size = 148 }: Props) {
  const clamped = Math.max(0, Math.min(100, score))
  const cx = size / 2
  const cy = size / 2
  const stroke = Math.round(size * 0.095)
  const r = (size - stroke) / 2 - 3
  const passing = clamped >= passMark

  // Amber below the mark, green at or above it. BOTH at full strength: the
  // three-band version dimmed the inactive bands to say "you are here", but
  // with only two bands the marker and the tick already say it, and dimming
  // the green made the target the dullest thing on the arc — the opposite of
  // what "aim for the green" is asking the learner to do.
  const bands = [
    { key: 'approaching', from: 0, to: passMark, color: 'var(--color-warning-400)' },
    
    // `-500`, not `-600`: the reference arc's green is a lighter, softer mint and
    // 500 (#018937) is the lightest green on this ramp — there is no
    // `--color-success-400`. The arc is decorative fill on a white card, so no
    // contrast minimum applies; if a lighter green is wanted, the ramp has to
    // gain a stop rather than this reaching for a literal.
    { key: 'passing', from: passMark, to: 100, color: 'var(--color-success-500)' },
  ] as const
  const activeKey = passing ? 'passing' : 'approaching'
  const marker = polar(cx, cy, r, angleFor(clamped))
  // The pass tick, drawn as a short radial stroke straddling the arc.
  const tickInner = polar(cx, cy, r - stroke * 0.85, angleFor(passMark))
  const tickOuter = polar(cx, cy, r + stroke * 0.85, angleFor(passMark))

  return (
    <div style={wrapStyle}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Readiness score ${clamped} out of 100. ${passMark} is a passing score.`}
      >
        {bands.map((b) => (
          <path
            key={b.key}
            d={arcPath(cx, cy, r, b.from, b.to)}
            fill="none"
            stroke={b.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ))}
        {/* The pass mark. A line rather than a colour change, because the
            colour change is already there — this says WHERE, in a way that
            survives the two bands being close in value. */}
        <line
          x1={tickInner.x}
          y1={tickInner.y}
          x2={tickOuter.x}
          y2={tickOuter.y}
          stroke="var(--color-text-primary)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* The marker sits ON the arc rather than as a needle from the centre:
            at this size a needle's tail crosses the number, and the score is
            the thing being read. */}
        <circle
          cx={marker.x}
          cy={marker.y}
          r={stroke * 0.6}
          fill="var(--color-surface-card)"
          stroke={bands.find((b) => b.key === activeKey)!.color}
          strokeWidth={3}
        />
      </svg>
      <span aria-hidden style={centreStyle}>
        <span style={{ ...numberStyle, fontSize: Math.round(size * 0.26) }}>{clamped}</span>
        <span style={captionStyle}>{passMark} to pass</span>
      </span>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const centreStyle: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  // Nudged up: the 240° arc is open at the BOTTOM, so a block centred on the
  // circle sits low against the gap. This puts the number on the arc's own
  // optical centre instead.
  transform: 'translateY(-6%)',
}

const numberStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}

const captionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}
