/**
 * SVG circular progress meter.
 *
 * Renders two concentric circles — a faint background track and a colored
 * "meter" arc — where the meter's stroke-dasharray + stroke-dashoffset are
 * computed from `value` (0–100). Rotated -90° via inline transform so the
 * arc starts at 12 o'clock and grows clockwise the way users expect.
 *
 * No animation in v1. The spec defers the "animate from prior value to new"
 * behavior — a future iteration can layer it on by remembering the prior
 * value in a ref and tweening `stroke-dashoffset` over ~600ms.
 */

import type { CSSProperties } from 'react'

type Props = {
  /** 0–100. Clamped — negatives become 0, > 100 becomes 100. */
  value: number
  /** Outer SVG width + height in px. Default 64. */
  size?: number
  /** Stroke width in px. Default 2.5 — thin enough to read as a "ring
   *  hugging the disc" rather than competing with the icon inside it. */
  strokeWidth?: number
  /** CSS color (or token reference) for the background track. */
  trackColor?: string
  /** CSS color (or token reference) for the filled-in arc. */
  meterColor?: string
  /** Accessible label — what does this ring represent? Required for SR. */
  'aria-label': string
  /** Optional class for outer SVG. */
  className?: string
  /** Optional style override for outer SVG. */
  style?: CSSProperties
}

export function ProgressRing({
  value,
  size = 64,
  strokeWidth = 2.5,
  trackColor = 'var(--color-neutral-200)',
  meterColor = 'var(--color-tertiary-500)',
  'aria-label': ariaLabel,
  className,
  style,
}: Props) {
  // Clamp + percentage math up front so the SR-announced value matches
  // what the user sees.
  const pct = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  // dashoffset = "how much of the circumference to HIDE" → at 0% we hide
  // all of it, at 100% we hide none. The arc grows from there.
  const dashoffset = circumference * (1 - pct / 100)

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{
        // Rotate so the meter starts at 12 o'clock and sweeps clockwise.
        transform: 'rotate(-90deg)',
        // Don't shrink under flexbox parents — important when the ring
        // wraps a tile that's also competing for column width.
        flexShrink: 0,
        ...style,
      }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={meterColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashoffset}
      />
    </svg>
  )
}
