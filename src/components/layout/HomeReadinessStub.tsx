import type { CSSProperties } from 'react'
import { widgetEyebrowStyle } from '@/components/learning/widgetStyles'

/**
 * "ARE YOU READY" — a STUB, Testing 3, 2026-10-01, the direct ask ("leave the
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
    <section aria-label="Are you ready" style={shell}>
      <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
        Are you ready
      </p>
      {/* The reserved room. 96 is roughly the exam card's body above it, so the
          rail reads with this slot filled rather than as a label floating on
          its own — re-measure if that card's readout changes height. */}
      <div aria-hidden style={{ minHeight: 96 }} />
    </section>
  )
}
