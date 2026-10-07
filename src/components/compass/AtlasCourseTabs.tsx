import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AngleRightRegular, ChevronLeft, ChevronRight } from '@/icons'

/**
 * THE COURSE TABS — the strip above the Home V2 course card's title (Figma
 * "Atlas-Compass-Global-Navigation" node 188:1006 → 203:827, 2026-10-05). It is
 * for a learner with MORE THAN ONE active course: "COURSES:", one tab per
 * course, the current one a folder tab joined to the rule beneath it, and an
 * "All courses ›" link on the right.
 *
 * ANY NUMBER OF COURSES. The tabs sit in a horizontal scroller (no visible
 * scrollbar — trackpad, shift-wheel and touch all slide it). When they overflow,
 * the clipped edge fades and a small chevron button appears on that side; each
 * press slides one viewport's worth. The current tab is scrolled into view
 * whenever it changes, so a course chosen elsewhere is never hidden off-strip.
 *
 * Colours: the active tab is the Study Pace panel's tint (the design's
 * #F5F2EF), so it moves with the brand the same way that panel does; the link
 * is the brand button colour.
 */
/** `coverUrl` is the image beside the title while this tab is current. */
export type AtlasCourseTab = { id: string; title: string; coverUrl?: string | null }

export type AtlasCourseTabsProps = {
  courses: AtlasCourseTab[]
  activeId: string
  onSelect?: (id: string) => void
  onAllCourses?: () => void
  /** Draw the "All courses ›" link at the strip's end. Off by default since
   *  2026-10-07 (Eric's request: "remove the All Courses link next to the
   *  tabs") — kept, not deleted; pass `showAllCourses` to bring it back. */
  showAllCourses?: boolean
}

/* The narrowest a shortened tab gets — a few letters and the ellipsis. */
const TAB_MIN = 64
/* The gap between tabs; SCROLLER uses the same number. */
const TAB_GAP = 4

/**
 * THE TAB WIDTHS — 2026-10-07, Eric's request: tabs sit at their NATURAL width
 * with the 4px gap between them, and only when they do not all fit are the
 * LONGEST cut to an ellipsis — just enough to fit, so a shorter neighbour sits
 * right against a shortened tab rather than past a stretch of empty share.
 * Hovered (or focused), a tab opens to its whole title and the others share
 * what is left by the same rule.
 *
 * "Water-filling": find the cap `c` where Σ min(natural, c) fills the room;
 * every tab is `min(natural, c)`, never under TAB_MIN. Returns a max-width per
 * tab, or `undefined` for a tab that keeps its natural width.
 */
function tabCaps(natural: number[], room: number, open: number | null): (number | undefined)[] {
  const caps: (number | undefined)[] = natural.map(() => undefined)
  let avail = room - TAB_GAP * Math.max(0, natural.length - 1)
  const idx = natural.map((_, i) => i).filter((i) => i !== open)
  if (open != null) {
    avail -= natural[open]
  }
  const total = idx.reduce((sum, i) => sum + natural[i], 0)
  if (total <= avail) return caps
  const sorted = [...idx].sort((a, b) => natural[a] - natural[b])
  let left = avail
  for (let k = 0; k < sorted.length; k++) {
    const share = left / (sorted.length - k)
    if (natural[sorted[k]] <= share) {
      left -= natural[sorted[k]]
      continue
    }
    // At rest the floor is TAB_MIN; while a tab is OPEN the others may go
    // under it (to 24) so the open title fits without tipping the strip into
    // overflow — which would flash the edge chevron on every hover.
    const cap = Math.max(open != null ? 24 : TAB_MIN, Math.floor(share))
    for (const i of sorted.slice(k)) caps[i] = cap
    break
  }
  return caps
}

export function AtlasCourseTabs({ courses, activeId, onSelect, onAllCourses, showAllCourses = false }: AtlasCourseTabsProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })
  /* Natural widths, measured from the tabs themselves (`scrollWidth` is the
     whole title whatever the cap), and the strip's room. */
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [natural, setNatural] = useState<number[]>([])
  const [room, setRoom] = useState(0)
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const sizeTabs = useCallback(() => {
    const el = scroller.current
    if (!el) return
    setRoom(el.clientWidth)
    const next = tabRefs.current.slice(0, courses.length).map((t) => (t ? t.scrollWidth : 0))
    setNatural((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next))
  }, [courses.length])
  useEffect(() => {
    sizeTabs()
    const el = scroller.current
    const ro = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sizeTabs) : null
    if (el) ro?.observe(el)
    return () => ro?.disconnect()
  }, [sizeTabs, courses])
  const caps = natural.length === courses.length && room > 0 ? tabCaps(natural, room, openIdx) : []

  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const left = el.scrollLeft > 1
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }))
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    // …and after a tab's width slide ends: the overflow can change with no
    // scroll and no resize of the strip itself.
    el.addEventListener('transitionend', measure)
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      el.removeEventListener('transitionend', measure)
      ro?.disconnect()
    }
  }, [measure, courses.length])

  /* Re-read the edges once the caps land — the first paint, before any cap, can
     overflow and show a chevron that the fitted tabs no longer need. */
  useEffect(() => {
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [measure, natural, room, openIdx])

  /* Keep the current tab in view — scrolls the strip only, never the page. */
  useEffect(() => {
    const el = scroller.current
    const tab = el?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!el || !tab) return
    const start = tab.offsetLeft - el.offsetLeft
    const end = start + tab.offsetWidth
    if (start < el.scrollLeft) el.scrollTo({ left: start - 24 })
    else if (end > el.scrollLeft + el.clientWidth) el.scrollTo({ left: end - el.clientWidth + 24 })
  }, [activeId])

  const slide = (dir: -1 | 1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(120, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  const fade =
    edges.left && edges.right
      ? 'linear-gradient(to right, transparent, #000 24px, #000 calc(100% - 24px), transparent)'
      : edges.left
        ? 'linear-gradient(to right, transparent, #000 24px)'
        : edges.right
          ? 'linear-gradient(to right, #000 calc(100% - 24px), transparent)'
          : undefined

  return (
    <nav aria-label="Your courses" style={STRIP}>
      <span style={LABEL}>Courses:</span>

      {edges.left ? (
        <button type="button" aria-label="Earlier courses" className="cre-compass-course-tab-arrow" onClick={() => slide(-1)} style={ARROW}>
          <ChevronLeft size={10} aria-hidden />
        </button>
      ) : null}

      <div ref={scroller} className="cre-compass-course-tabs" style={{ ...SCROLLER, maskImage: fade, WebkitMaskImage: fade }}>
        {courses.map((c, i) => {
          const active = c.id === activeId
          const cap = caps[i]
          return (
            <button
              key={c.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              aria-current={active ? 'true' : undefined}
              title={c.title}
              className={active ? 'cre-compass-course-tab is-active' : 'cre-compass-course-tab'}
              onClick={() => onSelect?.(c.id)}
              onMouseEnter={() => setOpenIdx(i)}
              onMouseLeave={() => setOpenIdx((v) => (v === i ? null : v))}
              onFocus={() => setOpenIdx(i)}
              onBlur={() => setOpenIdx((v) => (v === i ? null : v))}
              style={{ ...(active ? TAB_ACTIVE : TAB), maxWidth: cap ?? (natural[i] != null ? natural[i] + 1 : 'none') }}
            >
              {c.title}
            </button>
          )
        })}
      </div>

      {edges.right ? (
        <button type="button" aria-label="More courses" className="cre-compass-course-tab-arrow" onClick={() => slide(1)} style={ARROW}>
          <ChevronRight size={10} aria-hidden />
        </button>
      ) : null}

      {showAllCourses ? (
        <button type="button" className="cre-compass-v2-row" onClick={onAllCourses} style={ALL}>
          All courses
          <AngleRightRegular size={13} aria-hidden style={{ color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }} />
        </button>
      ) : null}
    </nav>
  )
}

const STRIP: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 4,
  minWidth: 0,
  borderBottom: '1px solid var(--color-atlas-outlined-card, var(--color-compass-page-card))',
}
const LABEL: CSSProperties = {
  flex: 'none',
  alignSelf: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const SCROLLER: CSSProperties = {
  // Takes the strip between the label and All courses (2026-10-07) — the room
  // `tabCaps` fits the tabs into.
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-end',
  gap: TAB_GAP,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none',
  overscrollBehaviorX: 'contain',
}
const TAB_BASE: CSSProperties = {
  /* Natural width, CAPPED by `tabCaps` (max-width) when the strip is short —
     the cap is what cuts a title to its ellipsis, and the max-width transition
     is the slide when a hovered tab opens (2026-10-07). */
  flex: '0 0 auto',
  minWidth: 0,
  transition: 'max-width 280ms ease, background-color 150ms ease',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  padding: '4px 8px',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '18px',
  color: 'var(--color-compass-page-heading)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
const TAB: CSSProperties = {
  ...TAB_BASE,
  fontWeight: 400,
  borderRadius: 8,
  background: 'transparent',
}
/* Folder tab: square at the foot so it joins the strip's rule. */
const TAB_ACTIVE: CSSProperties = {
  ...TAB_BASE,
  fontWeight: 600,
  borderRadius: '8px 8px 0 0',
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
  cursor: 'default',
}
const ARROW: CSSProperties = {
  flex: 'none',
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  padding: 0,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))',
  cursor: 'pointer',
}
const ALL: CSSProperties = {
  flex: 'none',
  alignSelf: 'center',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  marginLeft: 8,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '19.5px',
  color: 'var(--color-compass-page-button)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
