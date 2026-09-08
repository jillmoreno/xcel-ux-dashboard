import type { CSSProperties } from 'react'

/**
 * Dual-thumb range slider for the Content Length filter. The
 * outer track is the brand's full duration range; the inner active
 * track + two thumbs let the reviewer narrow to a sub-range.
 *
 * Implementation is two overlaid native `<input type="range">`
 * elements — accessible by default, no JS for keyboard / screen
 * reader behavior. The visual chrome (track, active fill, thumb
 * styling) is layered behind / above the inputs via absolute
 * positioning + the `cre-library-length-thumb` class so the
 * tokens-only styling stays in CSS.
 *
 * Label above the bar reads:
 *   - "Length: Any"          when [low, high] === [min, max]
 *   - "Length: ≤ N min"      when low === min, high < max
 *   - "Length: ≥ N min"      when low > min, high === max
 *   - "Length: X-Y min"      when both ends are inside the bounds
 *
 * Value is reported as `[low, high]`. The parent owns the URL state
 * for `?length=low-high` — the slider stays presentation-only.
 */
type Props = {
  /** Absolute bounds — usually the brand's min and max
   *  durationMinutes. */
  min: number
  max: number
  /** Current selection. Defaults to [min, max] (== "Any") at the
   *  parent level. */
  value: [number, number]
  onChange: (next: [number, number]) => void
}

export function LibraryLengthSlider({ min, max, value, onChange }: Props) {
  const [low, high] = value
  // Clamp to bounds — protects against stale URL state pointing at
  // an out-of-range duration if the fixture changes mid-session.
  const safeLow = Math.max(min, Math.min(low, max))
  const safeHigh = Math.max(min, Math.min(high, max))

  const isAny = safeLow === min && safeHigh === max
  const label = isAny
    ? 'Length: Any'
    : safeLow === min
      ? `Length: ≤ ${safeHigh} min`
      : safeHigh === max
        ? `Length: ≥ ${safeLow} min`
        : `Length: ${safeLow}–${safeHigh} min`

  const span = max - min || 1
  const lowPct = ((safeLow - min) / span) * 100
  const highPct = ((safeHigh - min) / span) * 100

  return (
    <div style={wrapStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={trackOuterStyle}>
        {/* Background track */}
        <div aria-hidden style={trackBaseStyle} />
        {/* Active fill between the two thumbs */}
        <div
          aria-hidden
          style={{
            ...trackFillStyle,
            left: `${lowPct}%`,
            width: `${Math.max(0, highPct - lowPct)}%`,
          }}
        />
        {/* Low thumb */}
        <input
          type="range"
          aria-label="Minimum length in minutes"
          min={min}
          max={max}
          step={1}
          value={safeLow}
          onChange={(e) => {
            const next = Number(e.target.value)
            // Never let the low thumb pass the high thumb.
            onChange([Math.min(next, safeHigh), safeHigh])
          }}
          style={rangeInputStyle}
        />
        {/* High thumb */}
        <input
          type="range"
          aria-label="Maximum length in minutes"
          min={min}
          max={max}
          step={1}
          value={safeHigh}
          onChange={(e) => {
            const next = Number(e.target.value)
            onChange([safeLow, Math.max(next, safeLow)])
          }}
          style={rangeInputStyle}
        />
      </div>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  paddingTop: 4,
}

const labelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 26,
  padding: '0 12px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
}

const trackOuterStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: 24,
  // Vertical centering for the two range inputs — the inputs are
  // absolutely positioned across the full width so they overlap.
  display: 'flex',
  alignItems: 'center',
}

const trackBaseStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  height: 4,
  background: 'var(--color-neutral-200)',
  borderRadius: 'var(--radius-pill)',
}

const trackFillStyle: CSSProperties = {
  position: 'absolute',
  height: 4,
  background: 'var(--color-primary-500)',
  borderRadius: 'var(--radius-pill)',
}

const rangeInputStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  width: '100%',
  // Transparent background lets our custom track render through;
  // the native thumb is still keyboard-focusable + screen-reader-
  // friendly so we don't have to reinvent that surface.
  background: 'transparent',
  appearance: 'none',
  WebkitAppearance: 'none',
  pointerEvents: 'auto',
  // Height matches the outer track container so the input absorbs
  // pointer hits across the full slider area, not just the thumb.
  height: 24,
  // Tints the native thumb to the brand primary on browsers that
  // honor `accent-color` (Chrome / Firefox / Safari 15.4+).
  accentColor: 'var(--color-primary-500)',
  margin: 0,
}
