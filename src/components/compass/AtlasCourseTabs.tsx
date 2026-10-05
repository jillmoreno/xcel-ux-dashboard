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
}

export function AtlasCourseTabs({ courses, activeId, onSelect, onAllCourses }: AtlasCourseTabsProps) {
  const scroller = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

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
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro?.disconnect()
    }
  }, [measure, courses.length])

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
        {courses.map((c) => {
          const active = c.id === activeId
          return (
            <button
              key={c.id}
              type="button"
              aria-current={active ? 'true' : undefined}
              className={active ? 'cre-compass-course-tab is-active' : 'cre-compass-course-tab'}
              onClick={() => onSelect?.(c.id)}
              style={active ? TAB_ACTIVE : TAB}
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

      <button type="button" className="cre-compass-v2-row" onClick={onAllCourses} style={ALL}>
        All courses
        <AngleRightRegular size={13} aria-hidden style={{ color: 'var(--color-atlas-home-icon, var(--color-compass-page-button))' }} />
      </button>
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
  flex: '0 1 auto',
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-end',
  gap: 4,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none',
  overscrollBehaviorX: 'contain',
}
const TAB_BASE: CSSProperties = {
  flex: 'none',
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
  flex: '1 0 auto',
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
