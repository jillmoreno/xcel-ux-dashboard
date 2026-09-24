import type { CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from '@/icons'

/**
 * COMPASS COURSE NAVIGATION FOOTER — Figma "Atlas-Compass-Global-Navigation",
 * node 31:1221, 2026-09-23.
 *
 * The foot of a Compass course player's content: Previous on the left, the
 * next step on the right ("Next: …"), on white under a warm rule. Pinned to the
 * bottom of the window while the lesson scrolls, so moving on is always one
 * click away.
 *
 * Config-driven like the rest of the Compass pieces: the page supplies the
 * labels and the handlers. **A step with no handler renders disabled**. Today
 * no lesson has a page, so both are. Previous takes the design's disabled
 * treatment (40% opacity); NEXT stays full `#1f1d18` (2026-09-24), as the
 * design draws it — still `disabled`, just not faded.
 *
 * Departures: FA Light `chevron-left` / `chevron-right` for the design's line
 * chevrons; Open Sans for its Inter.
 */
export type CompassCourseStep = {
  /** What the step is — "Chapter 3". Next prints "Next: <label>". */
  label: string
  onSelect?: () => void
}

export function CompassCourseFooter({
  previous,
  next,
  stickyBottom = 0,
}: {
  previous?: CompassCourseStep
  next?: CompassCourseStep
  /** Pinned this far above the window's bottom edge. */
  stickyBottom?: number
}) {
  return (
    <nav aria-label="Course navigation" className="cre-compass-course-footer" style={{ ...FOOTER, bottom: stickyBottom }}>
      <button
        type="button"
        className="cre-compass-step cre-compass-step--previous"
        onClick={previous?.onSelect}
        disabled={!previous?.onSelect}
        aria-label={previous ? `Previous: ${previous.label}` : 'Previous'}
        style={STEP}
      >
        <ChevronLeft size={16} aria-hidden />
        Previous
      </button>
      <button
        type="button"
        className="cre-compass-step cre-compass-step--next"
        onClick={next?.onSelect}
        disabled={!next?.onSelect}
        style={STEP}
      >
        {next ? `Next: ${next.label}` : 'Next'}
        <ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
/* Colours, and the disabled treatment, are `.cre-compass-step` in tokens.css. */

const FOOTER: CSSProperties = {
  position: 'sticky',
  zIndex: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  minHeight: 72,
  boxSizing: 'border-box',
  padding: '14px 80px',
  background: 'var(--color-compass-footer-surface)',
  borderTop: '1px solid var(--color-compass-footer-rule)',
}
/* 43px tall, 11px corners, 20/21px in — the design's buttons. */
const STEP: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 43,
  padding: '0 20px',
  boxSizing: 'border-box',
  borderRadius: 11,
  borderWidth: 1,
  borderStyle: 'solid',
  // NO inline cursor — `.cre-compass-step` owns it, so `:disabled` can take
  // the pointer away (an inline value would beat that rule).
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: 'nowrap',
}
