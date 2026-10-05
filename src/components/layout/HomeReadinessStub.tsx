import type { CSSProperties } from 'react'
import { widgetEyebrowStyle } from '@/components/learning/widgetStyles'

/**
 * "YOUR STUDY PACE / EXAM READINESS" — a STUB, Testing 3, 2026-10-01, the direct ask ("leave the
 * rest of the widget blank").
 *
 * ⚠ IT IS DELIBERATELY EMPTY, and that is the honest state rather than an
 * unfinished one. Readiness has been a lo-fi placeholder in this product since
 * 2026-09-17 ("Not designed yet") and Testing DROPPED its tile for exactly that
 * reason — an unbuilt surface in the frame while the built ones beside it are
 * being judged. This reserves the SLOT so the rail's shape can be read with it
 * in, without inventing a readout nobody has designed.
 *
 * ⚠ SO IT STATES NOTHING, NOT EVEN A PLACEHOLDER BAR. `LoFiWidgetBody` would
 * draw grey rows that read as "content loading" — a promise about a shape that
 * has not been decided. An eyebrow over open space says "something goes here"
 * and claims nothing about what.
 *
 * ⚠ NOT A LANDMARK WITH NOTHING IN IT. The `aria-label` names the region, and a
 * screen-reader user who reaches it finds an empty card — which is what is
 * there. When this grows a body, the label is already correct.
 */
export function HomeReadinessStub({ shell }: { shell: CSSProperties }) {
  return (
    /* ⚠ THE REGION'S NAME TRACKS THE EYEBROW. A landmark announced as "Are you
       ready" over a card headed "Your Study Pace / Exam Readiness" is the same
       defect in miniature the licensing steps' `aria-label` note records. */
    <section aria-label="Your Study Pace / Exam Readiness" style={shell}>
      <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
        Your Study Pace / Exam Readiness
      </p>
      {/* ⚠ A LO-FI DOUBLE RING, EXPLICITLY A PLACEHOLDER — 2026-10-02, the
          direct ask ("this will be detailed out later"). Two concentric arcs in
          the Apple-workout-ring idiom: one per thing the eyebrow names, pace
          and readiness.
      
          ⚠ IT CARRIES NO REAL FIGURES, and that is the point. The arcs are at
          fixed fractions and in the LO-FI greys, not the brand's, so nobody can
          read a number off it — a placeholder that looked live would be the
          product claiming a readiness model it does not have. Readiness has
          been undesigned here since 2026-09-17 and Testing dropped its tile for
          exactly that reason.
      
          `aria-hidden`: it states nothing, so there is nothing to announce. */}
      <div aria-hidden style={ringWrapStyle}>
        <svg width="72" height="72" viewBox="0 0 72 72" focusable="false">
          {[
            { r: 30, dash: 0.62 },
            { r: 21, dash: 0.38 },
          ].map(({ r, dash }) => {
            const c = 2 * Math.PI * r
            return (
              <g key={r}>
                <circle
                  cx="36"
                  cy="36"
                  r={r}
                  fill="none"
                  stroke="var(--color-neutral-200)"
                  strokeWidth="7"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={r}
                  fill="none"
                  stroke="var(--color-neutral-400)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${c * dash} ${c}`}
                  transform="rotate(-90 36 36)"
                />
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}

/* The ring sits where the body will go: centred, with the room the slot was
   already reserving. */
const ringWrapStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 96,
  marginTop: 8,
}
