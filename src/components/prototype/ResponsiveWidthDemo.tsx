import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { handoffEyebrowStyle, handoffMetaStyle } from './devHandoffStyles'

/**
 * ONE COMPONENT AT SEVERAL WIDTHS — the Layout note, shown.
 *
 * ⚠ 2026-10-21, Jillienne: "show the responsiveness". Asserting that a
 * component reflows is the kind of claim a handoff gets wrong quietly: this
 * card's Layout note carried a 130px cover figure for weeks while the page drew
 * 256, and it said the action row "wraps when three buttons will not fit"
 * at a width where the page genuinely wrapped. A render settles both.
 *
 * ⚠ EACH FRAME IS A REAL WIDTH, THEN SCALED — not a scaled-down copy of one
 * layout. The component is mounted inside a frame of the stated pixel width so
 * its OWN media behaviour runs at that width, and only the finished result is
 * scaled to fit the column. Scaling first would show the same layout three
 * times at three sizes, which is the opposite of what this is for.
 */
export function ResponsiveWidthDemo({
  render,
  widths = [
    {
      px: 800,
      label: 'Design width',
      note: 'The only width the product renders today — the card is 1128 less the 296 left column and the 32 between them. ⚠ It clears the three buttons by FOUR PIXELS (they measure 436 in a 440 column), so a longer label on any of them puts the row over.',
    },
    {
      px: 640,
      label: 'Narrower',
      note: 'Below about 796 the cover and the title column STACK rather than the column being crushed — the row wraps as a whole. Nothing in the product reaches this today; it is here so the degradation is a known one rather than a surprise.',
    },
  ],
}: {
  render: ReactNode
  widths?: { px: number; label: string; note: string }[]
}) {
  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {widths.map((w) => (
        <div key={w.px}>
          <p style={{ ...handoffEyebrowStyle, margin: 0 }}>
            {w.label} · {w.px}px
          </p>
          <p style={{ ...handoffMetaStyle, margin: '2px 0 8px' }}>{w.note}</p>
          <WidthFrame px={w.px}>{render}</WidthFrame>
        </div>
      ))}
    </div>
  )
}

/**
 * A viewport of exactly `px`, drawn at whatever width the column has.
 *
 * The inner element is laid out at the true width and then `scale()`d, which is
 * why the text inside stays in proportion rather than reflowing to the frame.
 * The wrapper takes the SCALED height so the next frame starts below it —
 * a transform does not affect layout, so without this the frames would overlap.
 */
function WidthFrame({ px, children }: { px: number; children: ReactNode }) {
  const inner = useRef<HTMLDivElement | null>(null)
  const [h, setH] = useState<number | undefined>(undefined)
  /* Never scale UP: a 420px frame in a wider column should sit at its own size
     rather than be blown up into a caricature of a phone. */
  const [avail, setAvail] = useState(px)
  const outer = useRef<HTMLDivElement | null>(null)
  const scale = Math.min(1, avail / px)
  useLayoutEffect(() => {
    const o = outer.current
    if (o) setAvail(o.clientWidth - 20)
    /* ⚠ THE SCALED HEIGHT, MEASURED. `transform` does not affect layout, so an
       `auto` height here would reserve the UNSCALED height and leave a gap
       under every scaled frame — the same pre-transform-height trap the row
       thumbnails hit. */
    const el = inner.current
    if (el) setH(el.offsetHeight * scale)
  }, [scale, px, children])
  return (
    <div ref={outer} style={frameStyle}>
      <div style={{ height: h }}>
        <div
          ref={inner}
          style={{ width: px, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const frameStyle: CSSProperties = {
  overflow: 'hidden',
  borderRadius: 'var(--radius-md)',
  border: '1px dashed var(--color-border-subtle)',
  background: 'var(--color-surface-page)',
  padding: 10,
}
