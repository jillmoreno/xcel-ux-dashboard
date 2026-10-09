import { useState, type CSSProperties, type KeyboardEvent } from 'react'

/**
 * THE READINESS CARD, FIVE LEVELS — Figma "Atlas-UX-Design" component 295:10698
 * (2026-10-09, Eric's request; it replaced the single 35% card from 254:8012),
 * on Eric/Atlas V3's Home under the Course progress module.
 *
 * "Readiness for state exam", a question, and a HALF-dial (the top half of a
 * ring, filled from its left end clockwise) with the LEVEL inside it in place
 * of a figure:
 *
 *   1 NOVICE   2 ADVANCED BEGINNER   3 COMPETENT   4 PROFICIENT   5 EXAM READY
 *
 * ⚠ FOR NOW CLICKING THE CARD FLIPS TO THE NEXT LEVEL (Eric: "we will correlate
 * these at some level to course progress at a later date"). It is a review
 * device; Enter and Space do the same.
 *
 * ⚠ THE ARC FRACTIONS ARE READ OFF THE DESIGN'S DRAWN ARCS (their end points on
 * the ring), not given as numbers in the file — about 13 / 38 / 66 / 85 / 100%.
 */
type Level = { name: string; lines: string[]; fill: number }
const LEVELS: Level[] = [
  { name: 'Novice', lines: ['Novice'], fill: 13 },
  { name: 'Advanced Beginner', lines: ['Advanced', 'Beginner'], fill: 38 },
  { name: 'Competent', lines: ['Competent'], fill: 66 },
  { name: 'Proficient', lines: ['Proficient'], fill: 85 },
  { name: 'Exam Ready', lines: ['Exam', 'Ready'], fill: 100 },
]

export function AtlasReadinessCard() {
  const [i, setI] = useState(0)
  const level = LEVELS[i]
  const next = () => setI((n) => (n + 1) % LEVELS.length)
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      next()
    }
  }
  return (
    <section
      aria-label={`Readiness for state exam — ${level.name}, level ${i + 1} of ${LEVELS.length}. Press to show the next level.`}
      role="button"
      tabIndex={0}
      onClick={next}
      onKeyDown={onKey}
      className="cre-atlas-readiness-states"
      style={CARD}
    >
      <p style={EYEBROW}>Readiness for state exam</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span aria-hidden style={RULE} />
        <p style={QUESTION}>How Ready are you for your State Exam?</p>
      </div>
      <HalfDial level={level} />
    </section>
  )
}

function HalfDial({ level }: { level: Level }) {
  const w = 149
  const r = 70
  const cx = w / 2
  const cy = 74.5
  const half = Math.PI * r
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div style={{ position: 'relative', alignSelf: 'center', width: w, height: 109 }}>
      <svg width={w} height={80} viewBox={`0 0 ${w} 80`} aria-hidden style={{ display: 'block' }}>
        <path d={d} fill="none" style={{ stroke: 'var(--color-tertiary-500)' }} strokeWidth={3} />
        <path
          d={d}
          fill="none"
          style={{ stroke: 'var(--color-atlas-dial-fill, var(--color-primary-500))' }}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(half * level.fill) / 100} ${half}`}
        />
      </svg>
      {/* The level, its last line sitting on the dial's baseline (Figma: bottom
          at 82), then OVERALL READINESS centred at 102.5. */}
      <div aria-hidden style={{ position: 'absolute', left: -2.5, width: 154, top: 0, height: 82, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
        {level.lines.map((line) => (
          <span key={line} style={LEVEL_NAME}>
            {line}
          </span>
        ))}
      </div>
      <span aria-hidden style={CAPTION}>Overall readiness</span>
    </div>
  )
}

/* Tertiary 200 fill, no stroke, 20 radius, 24 / 24 / 32 (Figma 295:10697). */
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 24px 32px',
  boxSizing: 'border-box',
  borderRadius: 20,
  background: 'var(--color-tertiary-200)',
  cursor: 'pointer',
  userSelect: 'none',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '1.3px',
  textTransform: 'uppercase',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
// The design's Tertiary 300 hairline (it was Primary 200 on the single card).
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-tertiary-300)' }
const QUESTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-primary-800)',
}
const LEVEL_NAME: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: '21px',
  // -3% (2026-10-09, Eric's request; it was 0).
  letterSpacing: '-0.03em',
  textAlign: 'center',
  color: 'var(--color-primary-800)',
}
const CAPTION: CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  top: 95,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '15px',
  letterSpacing: '3.4px',
  textTransform: 'uppercase',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
