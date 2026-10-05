import { useState, type CSSProperties } from 'react'
import { Award, Books, CalendarDay } from '@/icons'

/**
 * The Home tab strip — Figma 765:3801, Option 4's stand-in for the rail.
 *
 * Sits directly under the current course card in Home's left column, where the
 * frame draws it.
 *
 * ⚠ BLANK STUBS, BY INSTRUCTION (2026-09-29). Selecting a tab moves the
 * underline and renders NOTHING below it. They are not wired to Study Pace,
 * Courses or Certificates and must not be: what goes under them has not been
 * designed, and the frame draws that region as empty placeholder rows.
 *
 * ⚠ THEY WROTE `?section=` FOR ONE BUILD, which made them real navigation and
 * sent a click to the My Courses page. That was more than the design asks for —
 * the strip is a shape being tried, not a control being shipped — so the state
 * is local and goes nowhere. Wire them only when there is something authored to
 * put underneath.
 *
 * ⚠ NOT `PillTabs`. That is the repo's segmented control for STATUS FILTERS
 * (CLAUDE.md names it for exactly that) and draws pills in a tinted track. The
 * design draws underline tabs with a 4px highlight — and on the Courses page
 * the two would otherwise sit inches apart looking like the same control doing
 * different things.
 */

const TABS: { id: string; label: string; icon: typeof Award }[] = [
  { id: 'study-pace', label: 'Study Pace', icon: CalendarDay },
  { id: 'courses', label: 'Courses', icon: Books },
  { id: 'certificates', label: 'Certificates', icon: Award },
]

export function HomeSectionTabs() {
  /* Courses, as the frame draws it. Local state — this selects a tab and
     nothing else. */
  const [active, setActive] = useState('courses')
  return (
    <div style={wrapStyle}>
      <div style={stripStyle} role="tablist" aria-label="Learning sections">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              /* No panel exists yet, so there is nothing to point
                 `aria-controls` at — naming one that is not rendered is worse
                 than omitting it. */
              onClick={() => setActive(tab.id)}
              style={tabStyle}
            >
              <span style={labelStyle(isActive)}>
                <Icon size={16} aria-hidden />
                {tab.label}
              </span>
              {/* The highlight is the selected cue and NOT the only one — the
                  weight steps up too, so the state does not rest on a 4px rule
                  or on colour alone. */}
              <span
                aria-hidden
                style={{
                  ...highlightStyle,
                  background: isActive ? 'var(--color-primary-700)' : 'transparent',
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = { marginTop: 20 }
const stripStyle: CSSProperties = {
  display: 'flex',
  gap: 40,
  alignItems: 'flex-start',
  borderBottom: '1px solid var(--color-border-subtle)',
}
const tabStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  minWidth: 136,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const labelStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 16,
  lineHeight: '24px',
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
})
const highlightStyle: CSSProperties = {
  height: 4,
  width: '100%',
  borderRadius: '3px 3px 0 0',
}
