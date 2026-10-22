import { useCallback, useRef, useState, type CSSProperties } from 'react'

/**
 * THE THUMBNAIL FOR "BELOW THE COURSE CARD" — the progress column and the
 * Study Journey together, which is what the ticket is about.
 *
 * ⚠ 2026-10-21, Jillienne: "update thumbnail here & on the main Development
 * page." It was drawing the first component's first render — the 296px
 * progress column on its own — so a ticket covering progress, the coursework
 * steps and the exam date advertised itself with a third of its subject.
 *
 * ⚠ THE PAGE, NOT A COMPOSITION. Step 1's list is built inline in the Home
 * from the journey data, so the only honest way to show both columns is to
 * show the page. `chrome=off` drops the prototype and design bars, leaving the
 * product header, and the frame is then slid up so the region fills the plate.
 *
 * ⚠ AND THE OFFSET IS MEASURED, NOT TYPED. The region sits ~440px down today,
 * but that number is the height of everything above it — the header, the
 * course card, the gaps — and every one of those has moved during this
 * project. The frame finds its own progress column and reports where it is.
 * A typed 440 would be the 130px cover figure all over again.
 */
export function AtlasRegionThumb({ src }: { src: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [offset, setOffset] = useState(REGION_TOP_GUESS)

  const onLoad = useCallback(() => {
    const started = Date.now()
    const tick = () => {
      const win = frame.current?.contentWindow
      const doc = win?.document
      if (!win || !doc) return
      try {
        const col = [...doc.querySelectorAll('div')].find(
          (d) =>
            d.offsetWidth === 296 &&
            /COURSE PROGRESS|PROGRESS PAUSED|STUDY PACE/i.test(d.textContent ?? ''),
        )
        if (col) {
          setOffset(Math.round(col.getBoundingClientRect().top + win.scrollY))
          return
        }
        if (Date.now() - started < 6000) win.setTimeout(tick, 120)
      } catch {
        /* Same-origin today. If that changes the guess still frames something
           recognisable, which is all a thumbnail owes anyone. */
      }
    }
    tick()
  }, [])

  return (
    <div style={plateStyle}>
      <iframe
        ref={frame}
        title=""
        aria-hidden
        tabIndex={-1}
        src={`${src}${src.includes('?') ? '&' : '?'}chrome=off`}
        onLoad={onLoad}
        style={{
          position: 'absolute',
          top: -offset * SCALE,
          left: 0,
          width: PAGE_W,
          height: PAGE_H,
          border: 0,
          transform: `scale(${SCALE})`,
          transformOrigin: 'left top',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

/* The page's own width with the chrome off, and the plate the handoff
   thumbnail scales from — `ComponentPreviewThumb` renders at 880. */
const PAGE_W = 1438
const PAGE_H = 1400
const PLATE_W = 880
const SCALE = PLATE_W / PAGE_W
/** Where the region sat when this was written — replaced by the measurement
 *  as soon as the frame loads. Only ever seen for a few hundred milliseconds. */
const REGION_TOP_GUESS = 440

const plateStyle: CSSProperties = {
  position: 'relative',
  width: PLATE_W,
  height: 520,
  overflow: 'hidden',
  background: 'var(--color-fixed-light, #fff)',
}
