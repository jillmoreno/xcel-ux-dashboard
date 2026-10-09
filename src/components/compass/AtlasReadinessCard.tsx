import type { CSSProperties } from 'react'

/**
 * THE READINESS CARD — Figma "Atlas-UX-Design" node 254:8012 (2026-10-08,
 * Eric's request: "add this below the Course Progress tile"), on Eric/Atlas
 * V3's Home under the five-state Course progress module.
 *
 * "Readiness for state exam", a question, and a HALF-dial: the top half of a
 * ring, filled from its left end clockwise, with the figure inside it.
 *
 * ⚠ THE FIGURE IS A DEMO — the design's 35% (`DEMO_READINESS`). Nothing
 * measures readiness for this course yet; pass `percent` when something does.
 */
const DEMO_READINESS = 35

export function AtlasReadinessCard({ percent = DEMO_READINESS }: { percent?: number }) {
  return (
    <section aria-label="Readiness for state exam" style={CARD}>
      <p style={EYEBROW}>Readiness for state exam</p>
      <span aria-hidden style={RULE} />
      <p style={QUESTION}>How Ready are you for your State Exam?</p>
      <HalfDial percent={percent} />
    </section>
  )
}

function HalfDial({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const w = 149
  const r = 70
  const cx = w / 2
  const cy = 74.5
  const half = Math.PI * r
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  return (
    <div role="img" aria-label={`Overall readiness ${pct}%`} style={{ position: 'relative', alignSelf: 'center', width: w, height: 105 }}>
      <svg width={w} height={80} viewBox={`0 0 ${w} 80`} aria-hidden style={{ display: 'block' }}>
        <path d={d} fill="none" style={{ stroke: 'var(--color-tertiary-300)' }} strokeWidth={3} />
        <path
          d={d}
          fill="none"
          style={{ stroke: 'var(--color-primary-500)' }}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(half * pct) / 100} ${half}`}
        />
      </svg>
      <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <span style={FIGURE}>{pct}%</span>
        <span style={CAPTION}>Overall readiness</span>
      </div>
    </div>
  )
}

/* Tertiary 200 fill and no stroke (Eric 2026-10-09), 20 radius, 24 / 24 / 32 (Figma). */
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 24px 32px',
  boxSizing: 'border-box',
  borderRadius: 20,
  background: 'var(--color-tertiary-200)',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  letterSpacing: '0.118em',
  textTransform: 'uppercase',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
// Primary 200 (2026-10-09, Eric; it was 100 and vanished on the warm fill).
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-primary-200)' }
const QUESTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}
const FIGURE: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 58,
  lineHeight: '46px',
  letterSpacing: '-0.06em',
  color: 'var(--color-text-primary)',
}
const CAPTION: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.34em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-500)',
}
