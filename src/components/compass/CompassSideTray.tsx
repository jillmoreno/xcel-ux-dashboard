import { useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { XmarkRegular } from '@/icons'

/**
 * COMPASS SIDE TRAY — a right-hand tray beside the course player, for the
 * player bar's Notes and Nudges buttons (2026-10-19, Eric's request: "the
 * same slide in and out trays as the Rubi one with content to come").
 *
 * A SIBLING OF `CompassRubiRail`, not a change to it: the slot, the slide and
 * the pinned, measured height are the Rubi rail's, copied, so Rubi is
 * untouched. What differs is the inside — a header (glyph, title, close) over
 * a body the page supplies, which today is a placeholder.
 *
 * Mounted always, `open` drives it: the slot's width eases 380 ↔ 0 so the
 * content column widens and narrows with it, the panel's `translateX` brings
 * it in from the right, and `visibility` flips only after the slide-out.
 * Closed, it is `inert` and `aria-hidden`. `prefers-reduced-motion` reaches it
 * through `.cre-compass-rubi-slot`, the class it shares with Rubi's slot.
 */
const SLIDE_MS = 320
const SLIDE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const TRAY_WIDTH = 380

export function CompassSideTray({
  open,
  title,
  icon: Icon,
  stickyTop,
  bottomInset = 0,
  onClose,
  children,
}: {
  open: boolean
  title: string
  icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  /** Pinned at this offset — the page header's bottom edge. */
  stickyTop: number
  /** Space to leave under the tray — the Demo stage's padding. */
  bottomInset?: number
  onClose: () => void
  children: ReactNode
}) {
  const slotRef = useRef<HTMLDivElement>(null)

  /* From the slot's own top to the viewport's bottom (or its row's, at the end
     of the page) — the Rubi rail's measurement, so the two trays sit alike. */
  const [fitHeight, setFitHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    const el = slotRef.current
    if (!el || typeof window === 'undefined') return
    let frame = 0
    const measure = () => {
      frame = 0
      const row = el.parentElement?.getBoundingClientRect()
      if (!row || row.height === 0) return
      const top = el.getBoundingClientRect().top
      setFitHeight(Math.max(0, Math.min(window.innerHeight, row.bottom) - top))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      ref={slotRef}
      className="cre-compass-rubi-slot"
      aria-hidden={!open}
      inert={!open || undefined}
      style={{
        ...SLOT,
        top: stickyTop,
        height: fitHeight ?? `calc(100vh - ${stickyTop + bottomInset}px)`,
        width: open ? TRAY_WIDTH : 0,
        visibility: open ? 'visible' : 'hidden',
        transition: `width ${SLIDE_MS}ms ${SLIDE_EASE}, visibility 0s linear ${open ? 0 : SLIDE_MS}ms`,
      }}
    >
      <aside
        aria-label={title}
        style={{
          ...TRAY,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: `transform ${SLIDE_MS}ms ${SLIDE_EASE}`,
        }}
      >
        <header style={HEADER}>
          <span aria-hidden style={GLYPH}>
            <Icon size={15} aria-hidden />
          </span>
          <span style={TITLE}>{title}</span>
          <button
            type="button"
            className="cre-compass-rubi-close"
            onClick={onClose}
            aria-label={`Close ${title}`}
            style={CLOSE}
          >
            <XmarkRegular size={14} aria-hidden />
          </button>
        </header>
        <div style={BODY}>{children}</div>
      </aside>
    </div>
  )
}

/** The trays' shared stand-in until each has its content. */
export function CompassTrayPlaceholder({ children }: { children: ReactNode }) {
  return <p style={PLACEHOLDER}>{children}</p>
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
/* The Rubi rail's surface, rules and close, so the trays read as one family. */

const SLOT: CSSProperties = {
  position: 'sticky',
  flex: 'none',
  alignSelf: 'flex-start',
  overflow: 'hidden',
}
const TRAY: CSSProperties = {
  width: TRAY_WIDTH,
  height: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-compass-rubi-surface)',
  borderLeft: '1px solid var(--color-compass-rail-rule)',
}
/* 61 — the player bar's height, so the header reads as part of its row. */
const HEADER: CSSProperties = {
  flex: 'none',
  height: 61,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 16px',
  borderBottom: '1px solid var(--color-compass-rubi-rule)',
}
const GLYPH: CSSProperties = {
  display: 'inline-flex',
  color: 'var(--color-compass-player-icon)',
}
const TITLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14.3,
  lineHeight: '22px',
  color: 'var(--color-compass-rubi-text)',
  whiteSpace: 'nowrap',
}
const CLOSE: CSSProperties = {
  flex: 'none',
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  borderRadius: 9,
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
}
const BODY: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  padding: '14px 16px',
}
const PLACEHOLDER: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  fontStyle: 'italic',
  color: 'var(--color-compass-rubi-muted)',
}
