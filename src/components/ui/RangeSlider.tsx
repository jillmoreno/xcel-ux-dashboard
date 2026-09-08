import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

type Props = {
  /** Tooltip label, e.g. "Credits" or "Price". */
  label: string
  /** Optional prefix on each value, e.g. "$". */
  prefix?: string
  min: number
  max: number
  /** Inclusive [low, high] range. */
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export function RangeSlider({ label, prefix = '', min, max, value, onChange }: Props) {
  const [lo, hi] = value
  const isDefault = lo === min && hi === max
  const display = isDefault
    ? `${label}: Any`
    : `${label}: ${prefix}${lo} - ${prefix}${hi}`

  const trackRef = useRef<HTMLDivElement>(null)

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const startDrag = (which: 'lo' | 'hi') => (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const track = trackRef.current
    if (!track) return
    const onMove = (ev: PointerEvent) => {
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      const next = Math.round(min + ratio * (max - min))
      if (which === 'lo') onChange([Math.min(next, hi), hi])
      else onChange([lo, Math.max(next, lo)])
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div style={{ paddingTop: 32, paddingBottom: 8 }}>
      <div style={{ position: 'relative', height: 4, marginBottom: 8 }}>
        <div
          style={{
            position: 'absolute',
            left: `${(pct(lo) + pct(hi)) / 2}%`,
            transform: 'translate(-50%, -130%)',
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            padding: '4px 8px',
            borderRadius: 4,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.08)',
            color: 'var(--color-text-primary)',
          }}
        >
          {display}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              bottom: -5,
              left: '50%',
              width: 8,
              height: 8,
              transform: 'translateX(-50%) rotate(45deg)',
              background: 'var(--color-surface-card)',
              borderRight: '1px solid var(--color-border-subtle)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          />
        </div>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: 4,
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: `${pct(lo)}%`,
            right: `${100 - pct(hi)}%`,
            top: 0,
            bottom: 0,
            background: 'var(--color-primary-500)',
            borderRadius: 'var(--radius-pill)',
          }}
        />
        <button
          type="button"
          aria-label={`Minimum ${label}`}
          aria-valuemin={min}
          aria-valuemax={hi}
          aria-valuenow={lo}
          onPointerDown={startDrag('lo')}
          style={thumbStyle(pct(lo))}
        />
        <button
          type="button"
          aria-label={`Maximum ${label}`}
          aria-valuemin={lo}
          aria-valuemax={max}
          aria-valuenow={hi}
          onPointerDown={startDrag('hi')}
          style={thumbStyle(pct(hi))}
        />
      </div>
    </div>
  )
}

function thumbStyle(percent: number) {
  return {
    position: 'absolute',
    left: `calc(${percent}% - 8px)`,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    borderRadius: 'var(--radius-pill)',
    background: 'var(--color-surface-card)',
    border: '1px solid var(--color-neutral-300)',
    boxShadow: '0 1px 3px rgb(0 0 0 / 0.18)',
    cursor: 'grab',
    padding: 0,
    touchAction: 'none',
  } as const
}
