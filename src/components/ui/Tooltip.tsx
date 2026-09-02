/**
 * Tooltip — portal-rendered floating panel.
 *
 * Open on `mouseenter` AND `focusin`, close on `mouseleave` / `focusout` /
 * `Escape`. Mirrors the WAI-ARIA tooltip pattern: the trigger is the
 * existing focusable child (Tooltip wraps, not replaces, the consumer's
 * element via `cloneElement`); the tooltip itself is `role="tooltip"`
 * with a stable id and is linked back to the trigger via
 * `aria-describedby`.
 *
 * Position: defaults to `top`, auto-flips to `bottom` if there's not
 * enough room above (≥ 16px clearance to the viewport top). Renders into
 * a `document.body` portal so transform/overflow ancestors don't clip it.
 *
 * No external dependencies (Floating UI is explicitly out per the
 * prompt's "no new runtime dependencies" rule).
 */

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type Placement = 'top' | 'bottom'

type Props = {
  /** Tooltip body. Plain string, or arbitrary ReactNode for strong/em/etc. */
  content: ReactNode
  /** The trigger element. Must be a single focusable React element. */
  children: ReactElement
  /** Preferred placement. Will flip to the other when there's no room. */
  placement?: Placement
  /** Delay before opening on hover, in ms. Focus opens are not delayed. */
  delay?: number
  /** Optional aria label for the tooltip itself — defaults to the
   *  textual content when `content` is a string. */
  label?: string
}

// Use module-level refs to avoid SSR mismatches — we only touch document
// inside effects.

export function Tooltip({
  content,
  children,
  placement = 'top',
  delay = 150,
  label,
}: Props) {
  const tooltipId = useId()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; place: Placement }>({
    top: 0,
    left: 0,
    place: placement,
  })
  const triggerRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const openTimer = useRef<number | undefined>(undefined)

  const clearOpenTimer = () => {
    if (openTimer.current !== undefined) {
      window.clearTimeout(openTimer.current)
      openTimer.current = undefined
    }
  }

  const requestOpen = useCallback(
    (immediate: boolean) => {
      clearOpenTimer()
      if (immediate || delay <= 0) {
        setOpen(true)
        return
      }
      openTimer.current = window.setTimeout(() => setOpen(true), delay)
    },
    [delay],
  )

  const requestClose = useCallback(() => {
    clearOpenTimer()
    setOpen(false)
  }, [])

  // Escape closes regardless of which element has focus.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, requestClose])

  // Position the tooltip after open, every time the trigger moves.
  // useLayoutEffect so the panel doesn't flicker at (0,0) for a frame.
  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    const tip = tooltipRef.current
    if (!trigger || !tip) return
    const rect = trigger.getBoundingClientRect()
    const tipRect = tip.getBoundingClientRect()
    const gap = 8 // pixels between trigger and tooltip
    let place: Placement = placement
    // Auto-flip when there's not enough vertical room in the requested
    // direction.  16px clearance buffer keeps the panel from kissing the
    // viewport edge.
    if (placement === 'top' && rect.top - tipRect.height - gap < 16) {
      place = 'bottom'
    } else if (
      placement === 'bottom' &&
      rect.bottom + tipRect.height + gap > window.innerHeight - 16
    ) {
      place = 'top'
    }
    const top =
      place === 'top'
        ? rect.top + window.scrollY - tipRect.height - gap
        : rect.bottom + window.scrollY + gap
    // Center horizontally on the trigger, clamped to the viewport so
    // edge-aligned triggers don't push the tip off-screen.
    let left = rect.left + window.scrollX + rect.width / 2 - tipRect.width / 2
    const minLeft = window.scrollX + 8
    const maxLeft = window.scrollX + window.innerWidth - tipRect.width - 8
    left = Math.max(minLeft, Math.min(maxLeft, left))
    setCoords({ top, left, place })
  }, [open, placement])

  // Clean up timer on unmount so we don't open a tooltip on a stale tree.
  useEffect(() => () => clearOpenTimer(), [])

  if (!isValidElement(children)) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Tooltip] children must be a single React element')
    }
    return children as unknown as ReactElement
  }

  // Clone the trigger child to attach refs + handlers. Existing handlers
  // are preserved by chaining.
  const childProps = children.props as Record<string, unknown> & {
    ref?: React.Ref<HTMLElement>
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void
    onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void
    'aria-describedby'?: string
  }
  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node
      // Forward to any existing ref on the child (function or object).
      const existing = childProps.ref
      if (typeof existing === 'function') existing(node)
      else if (existing && typeof existing === 'object')
        (existing as { current: HTMLElement | null }).current = node
    },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseEnter?.(e)
      requestOpen(false)
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      childProps.onMouseLeave?.(e)
      requestClose()
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(e)
      // Focus opens are immediate — keyboard users shouldn't pay the
      // hover-delay tax to see the same content.
      requestOpen(true)
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(e)
      requestClose()
    },
    'aria-describedby': open
      ? [childProps['aria-describedby'], tooltipId].filter(Boolean).join(' ')
      : childProps['aria-describedby'],
  } as Record<string, unknown>)

  const tooltipNode = open
    ? createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          aria-label={label}
          style={{
            ...TIP_STYLE,
            top: coords.top,
            left: coords.left,
          }}
        >
          {content}
          <span aria-hidden style={arrowStyle(coords.place)} />
        </div>,
        document.body,
      )
    : null

  return (
    <>
      {trigger}
      {tooltipNode}
    </>
  )
}

const TIP_STYLE: CSSProperties = {
  position: 'absolute',
  // `min(220px, 90vw)` keeps the tooltip readable on narrow viewports.
  width: 'min(220px, 90vw)',
  background: 'var(--color-neutral-900)',
  color: 'var(--color-neutral-50)',
  padding: '9px 11px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: 1.4,
  textAlign: 'left',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 1000,
  pointerEvents: 'none',
}

/** Position the arrow so it points back at the trigger from the
 *  tooltip's pointing edge. The arrow is a 10x10 rotated square that
 *  pokes 5px past the tooltip edge. */
function arrowStyle(place: Placement): CSSProperties {
  const common: CSSProperties = {
    position: 'absolute',
    left: '50%',
    width: 10,
    height: 10,
    transform: 'translateX(-50%) rotate(45deg)',
    background: 'var(--color-neutral-900)',
  }
  return place === 'top' ? { ...common, bottom: -5 } : { ...common, top: -5 }
}
