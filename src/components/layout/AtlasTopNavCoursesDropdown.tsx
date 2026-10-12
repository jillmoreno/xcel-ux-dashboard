import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AngleRightRegular, BooksRegular } from '@/icons'
import { WHITE_COURSES, WHITE_COURSE_PARAM, WHITE_FIRST_COURSE_ID, whiteCourseFor } from '@/data/atlasWhiteCourses'

/**
 * THE TOP NAV's "MY COURSES" DROPDOWN — Figma 323:2001 (2026-10-12, Eric's
 * request), Eric/Atlas White's Top Nav = Dropdown. It stands where the
 * "Course Overview" button stands on the Static Top Nav.
 *
 * The BUTTON ITSELF GROWS into the open dropdown: one white frame, anchored at
 * the button's top-left, widening to 220 and dropping its list below the
 * label, quick and eased (`--cre-dd-ms`). A placeholder keeps the button's
 * closed footprint in the header, so nothing beside it moves.
 *
 *   All Courses        → the My Courses page (`section=courses`)
 *   each active course → makes itself the course White's Home shows
 *                        (`?whiteCourse=`) and goes to Home
 *
 * The current course reads Medium in Primary 500, as the design marks it.
 * Closes on a pick, Escape, or a click outside.
 */
const OPEN_W = 220

export function AtlasTopNavCoursesDropdown() {
  const [params, setParams] = useSearchParams()
  const activeId = whiteCourseFor(params.get(WHITE_COURSE_PARAM))
  const [open, setOpen] = useState(false)
  const [closedW, setClosedW] = useState<number | null>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // The closed width is the label's own (icon + "My Courses" + 16 a side).
  useLayoutEffect(() => {
    if (headRef.current) setClosedW(Math.ceil(headRef.current.offsetWidth) + 32 + 2)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const go = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(params)
    next.delete('section')
    next.delete('coursePage')
    mutate(next)
    setParams(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', width: closedW ?? undefined, height: 28, flex: 'none' }}>
      <div
        className={open ? 'cre-atlas-dd is-open' : 'cre-atlas-dd'}
        style={{ ...FRAME, width: open ? OPEN_W : (closedW ?? undefined) }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="cre-atlas-dd-list"
          onClick={() => setOpen((o) => !o)}
          style={HEAD_BUTTON}
        >
          <span ref={headRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <BooksRegular size={13} aria-hidden />
            My Courses
          </span>
        </button>
        {/* The list opens by a 0fr ↔ 1fr row track, so its own height is what
            animates; closed, it is out of the tab order and hidden. */}
        <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows var(--cre-dd-ms) var(--cre-dd-ease)' }}>
          <div style={{ minHeight: 0, overflow: 'hidden' }} inert={!open || undefined}>
            <ul id="cre-atlas-dd-list" style={LIST}>
              <Item label="All Courses" onClick={() => go((n) => n.set('section', 'courses'))} />
              {WHITE_COURSES.map((c) => (
                <Item
                  key={c.id}
                  label={c.title}
                  current={c.id === activeId}
                  onClick={() =>
                    go((n) => {
                      if (c.id === WHITE_FIRST_COURSE_ID) n.delete(WHITE_COURSE_PARAM)
                      else n.set(WHITE_COURSE_PARAM, c.id)
                    })
                  }
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Item({ label, current = false, onClick }: { label: string; current?: boolean; onClick: () => void }) {
  return (
    <li style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span aria-hidden style={RULE} />
      <button type="button" aria-current={current ? 'true' : undefined} className="cre-atlas-dd-item" onClick={onClick} style={ITEM}>
        <span
          style={{
            flex: '1 1 0',
            minWidth: 0,
            fontWeight: current ? 500 : 400,
            color: current ? 'var(--color-primary-500)' : 'var(--color-primary-600)',
          }}
        >
          {label}
        </span>
        <AngleRightRegular size={13} aria-hidden style={{ flex: 'none', color: 'var(--color-primary-600)' }} />
      </button>
    </li>
  )
}

/* One white frame, closed or open (Figma 323:2002 / 325:2185): Primary 200
   hairline, 8 radius, 16 across; the open state adds the list below and a soft
   drop shadow. Anchored top-left, over the header. */
const FRAME: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  zIndex: 40,
  boxSizing: 'border-box',
  padding: '0 16px',
  borderRadius: 8,
  border: '1px solid var(--color-primary-200)',
  background: 'var(--color-fixed-light)',
  overflow: 'hidden',
}
const HEAD_BUTTON: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 26,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '15px',
  color: 'var(--color-primary-600)',
  whiteSpace: 'nowrap',
}
const LIST: CSSProperties = {
  margin: 0,
  padding: '0 0 16px',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: OPEN_W - 34,
}
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-primary-100)' }
const ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
}
