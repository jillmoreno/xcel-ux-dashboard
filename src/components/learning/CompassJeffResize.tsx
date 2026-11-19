import { useRef } from 'react'

/**
 * A RAIL'S RESIZE HANDLE — his `.ws-resize` / `.src-resize`.
 *
 * ⚠ THREE WAYS TO MOVE IT, and all three are his: drag, arrow keys, and a
 * double-click to put it back. The keyboard one is not a nicety — a rail you
 * can only size with a mouse is a rail some people cannot size at all — and
 * the double-click is what makes experimenting with the width safe.
 *
 * ⚠ IT IS A `separator`, which is what tells a screen reader this is a
 * boundary between two regions rather than a decorative rule.
 */
export function CompassJeffResize({
  label,
  width,
  min,
  max,
  reset,
  /** Which way the pointer moves to make the pane bigger. */
  grow = 'left',
  onResize,
}: {
  label: string
  width: number
  min: number
  max: number
  reset: number
  grow?: 'left' | 'right'
  onResize: (w: number) => void
}) {
  const dragging = useRef(false)
  const clamp = (w: number) => Math.min(max, Math.max(min, w))
  const sign = grow === 'left' ? -1 : 1

  return (
    <div
      role="separator"
      aria-label={label}
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      className="cre-jc-resize"
      onDoubleClick={() => onResize(reset)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          onResize(clamp(width - sign * 24))
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          onResize(clamp(width + sign * 24))
        }
        if (e.key === 'Home') {
          e.preventDefault()
          onResize(reset)
        }
      }}
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return
        const box = e.currentTarget.getBoundingClientRect()
        onResize(clamp(width + sign * (box.left + box.width / 2 - e.clientX)))
      }}
      onPointerUp={(e) => {
        dragging.current = false
        e.currentTarget.releasePointerCapture(e.pointerId)
      }}
    />
  )
}
