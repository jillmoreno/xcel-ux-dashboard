import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AngleRightRegular } from '@/icons'
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
 *   each active course → makes itself the course White's Home shows
 *                        (`?whiteCourse=`) and goes to Home
 *   All Courses        → the My Courses page (`section=courses`) — last
 *                        since 2026-10-13, first before
 *
 * The course already on the page reads SemiBold in Primary 500 and is not a
 * link (it was Medium, as the design marks it, until 2026-10-12).
 * Closes on a pick, Escape, or a click outside.
 *
 * CLOSED, IT IS THE TWO-ROW HEADER'S PILL (2026-10-13, Eric's request: "style
 * the buttons as in the new nav but retain the dropdown style from this nav"):
 * 30 tall, no frame, no icon, navy 14/20 Medium, the `#eceff1` tint on hover
 * and on the My Courses page. OPEN, it is this dropdown as it was — the white
 * frame with its Primary 200 hairline, growing to 220 with the list below.
 * The variables are `.cre-atlas-hdr`'s, set on the nav around it.
 */
const OPEN_W = 220

export function AtlasTopNavCoursesDropdown({ selected = false }: { selected?: boolean }) {
  const [params, setParams] = useSearchParams()
  const activeId = whiteCourseFor(params.get(WHITE_COURSE_PARAM))
  const [open, setOpen] = useState(false)
  const [closedW, setClosedW] = useState<number | null>(null)
  const headRef = useRef<HTMLSpanElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // The closed width is the label's own ("My Courses" + 12 a side + the
  // frame's 1px a side).
  useLayoutEffect(() => {
    if (headRef.current) setClosedW(Math.ceil(headRef.current.offsetWidth) + 24 + 2)
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
    <div ref={rootRef} style={{ position: 'relative', width: closedW ?? undefined, height: 30, flex: 'none' }}>
      <div
        className={open ? 'cre-atlas-dd is-open' : 'cre-atlas-dd'}
        style={{
          ...FRAME,
          width: open ? OPEN_W : (closedW ?? undefined),
          // Closed: the pill — no frame; the tint on hover (atlasHeader.css)
          // and on the My Courses page. Open: the frame as it was.
          ...(open
            ? null
            : { border: '1px solid transparent', background: selected ? 'var(--atlas-hdr-tint)' : undefined }),
        }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls="cre-atlas-dd-list"
          onClick={() => setOpen((o) => !o)}
          style={HEAD_BUTTON}
        >
          <span ref={headRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            My Courses
          </span>
        </button>
        {/* The list opens by a 0fr ↔ 1fr row track, so its own height is what
            animates; closed, it is out of the tab order and hidden. */}
        <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows var(--cre-dd-ms) var(--cre-dd-ease)' }}>
          <div style={{ minHeight: 0, overflow: 'hidden' }} inert={!open || undefined}>
            <ul id="cre-atlas-dd-list" style={LIST}>
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
              {/* Last, below the courses (2026-10-13, Eric's request); it led
                  the list until then. */}
              <Item label="All Courses" onClick={() => go((n) => n.set('section', 'courses'))} />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function Item({ label, current = false, onClick }: { label: string; current?: boolean; onClick: () => void }) {
  if (current) {
    /* The course already on the page: Bold in Primary 500 with the chevron,
       not a link (no hover) — on a Primary 100 band (2026-10-12, Eric's
       request). The band runs edge to edge inside the frame's stroke (the
       -16s undo the frame's padding) and from the rule above to the rule
       below: this row draws no rule of its own, and it reaches 9px past its
       bottom (the list's 8 gap + the next row's 1px rule) on top, so the next
       rule is hidden under it. The 9s of padding keep the text where it sat. */
    return (
      <li style={CURRENT_BAND}>
        {/* The chevron marks the CURRENT course now (2026-10-12, Eric's
            request) — the other items lost theirs. */}
        <span aria-current="true" style={{ ...ITEM, cursor: 'default', fontWeight: 700, color: 'var(--color-primary-500)' }}>
          <span style={{ flex: '1 1 0', minWidth: 0 }}>{label}</span>
          <AngleRightRegular size={13} aria-hidden style={{ flex: 'none', color: 'var(--color-primary-500)' }} />
        </span>
      </li>
    )
  }
  return (
    <li style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span aria-hidden style={RULE} />
      <button type="button" className="cre-atlas-dd-item" onClick={onClick} style={ITEM}>
        {/* Regular; SemiBold on hover (tokens.css `.cre-atlas-dd-item`). */}
        <span style={{ flex: '1 1 0', minWidth: 0, color: 'var(--color-primary-600)' }}>{label}</span>
      </button>
    </li>
  )
}
const CURRENT_BAND: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  margin: '0 -16px -9px',
  padding: '9px 16px',
  background: 'var(--color-primary-100)',
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
  // No padding of its own: the 16 a side lives on the label and the list, so
  // the current course's band can reach the frame's edges (2026-10-12) — the
  // list's wrapper clips to its own box for the open/close animation.
  padding: 0,
  borderRadius: 8,
  border: '1px solid var(--color-primary-200)',
  background: 'var(--color-fixed-light)',
  overflow: 'hidden',
}
// Label: the two-row header's nav text (2026-10-13) — navy 14/20 Medium, 12
// across, 28 inside the frame's 1px a side for its 30.
const HEAD_BUTTON: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 28,
  padding: '0 12px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  fontWeight: 500,
  color: 'var(--atlas-hdr-navy)',
  whiteSpace: 'nowrap',
}
const LIST: CSSProperties = {
  margin: 0,
  padding: '0 16px 16px',
  boxSizing: 'border-box',
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  width: OPEN_W - 2,
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
