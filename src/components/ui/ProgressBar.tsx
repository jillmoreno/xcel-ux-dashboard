import type { CSSProperties } from 'react'

/**
 * The shared horizontal progress bar — 8px, pill-radius, neutral track, brand
 * primary fill.
 *
 * Extracted 2026-09-09 from `ProgressInline` in `StudyCalendarStatBand`, which
 * is where this treatment was defined and where it is still the reference. It
 * came out because the Readiness page had drawn its own 3px lookalike in a
 * different green, so the same learner's same 32% was two different bars one
 * rail item apart.
 *
 * `ProgressInline` composes this plus its own `32%` label; surfaces that
 * already print the figure themselves (Readiness' Course Progress row) use the
 * bar alone. That split is the reason this is a bar and not a bar-with-label —
 * duplicating the percentage was the only thing stopping the reuse.
 *
 * `fill` exists for bars that carry a SEMANTIC colour rather than brand
 * progress — a score band, say. Reach for it only when the colour means
 * something; a one-off tint here is how two bars start drifting again.
 */
export function ProgressBar({
  pct,
  height = 8,
  fill = 'var(--color-primary-700)',
  className,
}: {
  /** 0-100. Clamped, so a bad input cannot overflow the track. */
  pct: number
  height?: number
  fill?: string
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div aria-hidden className={className} style={{ ...trackStyle, height }}>
      <div style={{ ...fillStyle, width: `${clamped}%`, background: fill }} />
    </div>
  )
}

/**
 * NO `flex` here, and that is load-bearing. The style this came from carried
 * `flex: 1` because it lived in a flex ROW beside a percentage label. Dropped
 * into the Readiness page's flex COLUMN that same declaration resolves to
 * `flex-basis: 0%` on the CROSS axis — the bar collapsed to zero height and
 * vanished, with the inline `height: 8px` still sitting on the element, so
 * neither tsc nor a style assertion noticed. Only opening the page did.
 *
 * The bar is now `width: 100%` and layout-neutral; a consumer that needs it to
 * GROW wraps it (see `ProgressInline`).
 */
const trackStyle: CSSProperties = {
  width: '100%',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  overflow: 'hidden',
}

const fillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-pill)',
}
