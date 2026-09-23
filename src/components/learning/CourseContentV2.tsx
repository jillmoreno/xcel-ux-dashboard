import type { CSSProperties } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'
import { CompassTopBar, RubiAside } from './CompassCoursePlayer'

/**
 * OPTION 2's COURSE CONTENT PAGE — `dashboard-navigation: option-2`,
 * 2026-09-23.
 *
 * ⚠ THIS FILE IS THE VARIANT. Everything else about the player is shared with
 * Option 1 — the 260px contents sidebar, the Home / Overview breadcrumb, the
 * eight rail pages, the Overview page itself. Only the right-hand COURSE body
 * forks here, which is what makes the A/B readable: a participant's reaction
 * can be attributed to this body rather than to a second player that has
 * drifted in a dozen places nobody is tracking.
 *
 * ⚠ IT STARTS AS AN EXACT COPY OF OPTION 1, on purpose. A variant that arrives
 * already different cannot be verified — there is no moment where the two are
 * known to match, so a later "did we mean to change that?" has no answer. Both
 * options render identically today and a test asserts it; the first real
 * difference is a deliberate edit to this file, against a known-equal baseline.
 *
 * ⚠ AND ITS STYLES ARE ITS OWN, deliberately duplicated rather than imported.
 * Option 2 exists to be changed freely, and shared style constants would mean
 * every edit here silently moved Option 1 too — the one failure that would
 * invalidate the comparison mid-test. The cost is that a change meant for BOTH
 * has to be made twice; that is the right way round for a variant with a short
 * life.
 *
 * WHAT IS STILL SHARED, and why it is safe: `CompassTopBar` and `RubiAside`
 * are imported as components. Neither carries the layout this file is about —
 * the top bar is the chapter title and the ✕ up to Overview, the aside is the
 * Rubi panel — and both should stay identical across the two options unless
 * the ask says otherwise. Fork either one the moment it needs to differ.
 */
export function CourseContentV2({
  chapterTitle,
  onBack,
}: {
  /** The current chapter, for the toolbar — the player's own `currentChapter`. */
  chapterTitle: string
  /** Up a level to the course Overview. Same handler Option 1 gives the ✕. */
  onBack: () => void
}) {
  return (
    <>
      <CompassTopBar chapterTitle={chapterTitle} onBack={onBack} backLabel="Overview" />
      <div style={bodyStyle}>
        <div style={columnStyle}>
          <main style={mainStyle}>
            {/* THE PLACEHOLDER IS THE DESIGN, not a stand-in for it — the same
                position Option 1 takes. The courseware is Compass's, served
                into this frame, and neither the mock nor this repo has it.
                Drawing a fake lesson here would be the one thing the
                surrounding chrome is honest about avoiding. */}
            <div style={cardStyle}>
              <p style={captionStyle}>Course Content</p>
              <div aria-hidden style={blockStyle} />
            </div>
          </main>
          <footer style={footerStyle}>
            {/* Not `disabled` buttons — nothing in this footer is wired, and a
                real disabled state would claim the rest is. */}
            <span style={prevStyle}>
              <ArrowLeft size={16} aria-hidden />
              Previous
            </span>
            <span style={nextStyle}>
              Next
              <ArrowRight size={16} aria-hidden />
            </span>
          </footer>
        </div>
        <RubiAside />
      </div>
    </>
  )
}

/* ─── Option 2's own layout ────────────────────────────────────────────────
   Copied from `CompassCoursePlayer`'s course branch and owned here. See the
   header for why these are duplicated rather than imported. */

const bodyStyle: CSSProperties = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
}

const columnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minWidth: 0,
  background: 'var(--compass-ground)',
}

const mainStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '100px 104px 56px',
  display: 'flex',
  justifyContent: 'center',
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 832,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
  paddingTop: 24,
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--compass-content)',
  overflow: 'hidden',
}

const captionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 34,
  fontWeight: 500,
  letterSpacing: '-0.34px',
  lineHeight: '39px',
  textAlign: 'center',
  color: 'var(--compass-rule)',
}

const blockStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '830 / 467',
  background: 'var(--compass-content)',
}

const footerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  height: 72,
  padding: '0 40px',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--compass-rule)',
  flexShrink: 0,
}

const footerButtonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 18px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
}

const prevStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--compass-edge)',
  color: 'var(--color-text-primary)',
  opacity: 0.4,
}

const nextStyle: CSSProperties = {
  ...footerButtonBase,
  background: 'var(--color-primary-500)',
  border: '1px solid var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
}
