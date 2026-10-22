import { useCallback, useRef, useState, type CSSProperties } from 'react'

/**
 * STEPS 1–3, AND NOTHING ELSE ON THE PAGE.
 *
 * ⚠ 2026-10-21, Jillienne: "why are we showing the full screen? remove and
 * only show the steps and the logic for them." Both Steps variants drew
 * `PageFrame` — the whole Atlas Home in an iframe — so a component about three
 * journey steps was documented with a screenshot of everything around them.
 * The reader had to find the subject inside the picture.
 *
 * ⚠ STILL THE PAGE, JUST CROPPED TO IT, and that is deliberate. Step 1's list
 * is built inline in `AtlasHomeJillMain` from the journey data — there is no
 * `<StudyJourney>` to render on its own — so rebuilding the column here would
 * be a copy that can drift from the thing it documents. The frame loads the
 * real page with `chrome=off`, finds the journey column, and slides itself so
 * only that column shows. Same approach as `AtlasRegionThumb`, at 1:1 instead
 * of scaled down, because this one is meant to be read.
 *
 * ⚠ THE CROP IS MEASURED, NEVER TYPED. Everything above and left of the column
 * — the header, the course card, the progress panel — has moved repeatedly
 * during this project, and a typed offset would be wrong by the next layout
 * change and wrong silently. The frame asks the column where it is.
 *
 * Not interactive: a click on a journey link would navigate the frame away
 * from the page the crop was measured against, leaving an empty plate.
 */
export function AtlasStepsFrame({ ff, title }: { ff?: string; title: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [box, setBox] = useState<Box>(GUESS)

  const onLoad = useCallback(() => {
    const started = Date.now()
    let last: Box | null = null
    const tick = () => {
      const win = frame.current?.contentWindow
      const doc = win?.document
      if (!win || !doc) return
      const again = () => {
        if (Date.now() - started < 8000) win.setTimeout(tick, 120)
      }
      try {
        /* The column is the journey section's parent — the flex child that
           holds Step 1, Step 2 and Step 3 together. The section alone would
           crop to Step 1. */
        const section = doc.querySelector('section[aria-label="Study journey"]')
        const col = section?.parentElement
        if (!col) return again()
        const r = col.getBoundingClientRect()
        const next: Box = {
          top: Math.round(r.top + win.scrollY) - PAD,
          left: Math.round(r.left + win.scrollX) - PAD,
          width: Math.ceil(r.width) + PAD * 2,
          height: Math.ceil(r.height) + PAD * 2,
        }
        /* ⚠ WAIT FOR THE COLUMN TO FINISH LAYING OUT, and prove it by reading
           the same box twice. The first version took whatever the first find
           returned and cropped to 29×55 — the column mid-layout, before its
           own content had height. A sane floor alone would not have caught
           it either: the trap is a box that is plausible and still growing,
           which a second identical read is what rules out. */
        if (next.width < MIN || next.height < MIN) return again()
        if (!last || last.top !== next.top || last.left !== next.left || last.width !== next.width || last.height !== next.height) {
          last = next
          return again()
        }
        setBox(next)
      } catch {
        /* Same-origin today; the guess still frames the column if that ever
           changes. */
      }
    }
    tick()
  }, [])

  return (
    <div style={{ ...plateStyle, width: box.width, height: box.height }}>
      <iframe
        ref={frame}
        title={title}
        tabIndex={-1}
        src={`${import.meta.env.BASE_URL}dashboard-rebrand?demo=1&section=dashboard&brand=xcel&chrome=off${
          ff ? `&ff=${ff}` : ''
        }`}
        onLoad={onLoad}
        style={{
          position: 'absolute',
          top: -box.top,
          left: -box.left,
          width: PAGE_W,
          height: PAGE_H,
          border: 0,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

type Box = { top: number; left: number; width: number; height: number }

/** The page's own width with the chrome off, and tall enough that Step 3 is
 *  laid out before the column is measured. */
const PAGE_W = 1438
const PAGE_H = 1600
/** A little air around the column, so the crop does not shave the ring of the
 *  first stop or the right edge of the exam prompt. */
const PAD = 8
/** Below this in either axis the column has not finished laying out. */
const MIN = 200
/** Where the column sat when this was written — replaced by the measurement as
 *  soon as the frame loads, and only ever seen for a few hundred ms. */
const GUESS: Box = { top: 432, left: 952, width: 351, height: 700 }

const plateStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  maxWidth: '100%',
  background: 'var(--color-fixed-light, #fff)',
}
