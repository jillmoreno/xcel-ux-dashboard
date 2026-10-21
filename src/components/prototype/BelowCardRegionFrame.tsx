import { useCallback, useRef, useState, type CSSProperties } from 'react'

/**
 * THE WHOLE REGION BELOW THE COURSE CARD — the real page, scrolled to it.
 *
 * ⚠ 2026-10-21, Jillienne: "i want to show all of this in the handoff docs so
 * user can see everything." The components below this one document the region
 * a part at a time; this is the part a reader cannot assemble in their head —
 * the progress column and the Study Journey side by side, at the same moment,
 * in the same state.
 *
 * ⚠ AN IFRAME OF THE PAGE, NOT A REBUILD. Step 1's list is composed inline in
 * the Home from the journey data and the Progress rung; retyping it here would
 * create a second copy of the one thing this handoff exists to stop drifting.
 * The frame shows the page, so it cannot be wrong.
 *
 * ⚠ AND IT SCROLLS ITSELF. The page opens on the demo bars and the course
 * card; the region is a screen further down, and "scroll past the bars" is a
 * poor instruction to leave in a spec. Same origin, so the frame can find the
 * progress column in its own document and bring it to the top — which also
 * makes every state line up at the same place, so flicking between them
 * compares like with like.
 */
export function BelowCardRegionFrame({
  ff,
  title,
  height = 660,
}: {
  /** `?ff=` pins, e.g. `atlas-v3-progress:milestone`. */
  ff?: string
  title: string
  height?: number
}) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [note, setNote] = useState<string | null>(null)

  /* The region's top, found by the thing that marks it: the 296px progress
     column. Falling back to a fixed offset would go stale the first time
     anything above it changes height — which is exactly what happened to the
     130px cover figure on the course head. */
  /* ⚠ `load` FIRES BEFORE THE REGION EXISTS. The framed page is a React app:
     the document is "loaded" while its body is still an empty root, so a
     single look finds nothing and the frame sits on the demo bars. This polls
     briefly instead, and gives up out loud rather than silently. */
  const onLoad = useCallback(() => {
    const started = Date.now()
    const tick = () => {
      const win = frame.current?.contentWindow
      const doc = win?.document
      if (!win || !doc) return
      try {
        /* ⚠ MATCHED ON THE COLUMN, NOT ON "COURSE PROGRESS". Once access has
           expired that eyebrow reads "Progress paused", so keying on the words
           lost the one state whose layout is most worth looking at. The 296px
           column is the region's own landmark in every state. */
        const col = [...doc.querySelectorAll('div')].find(
          (d) => d.offsetWidth === 296 && /COURSE PROGRESS|PROGRESS PAUSED|STUDY PACE/i.test(d.textContent ?? ''),
        )
        if (col) {
          /* ⚠ CLEAR THE STICKY CHROME, MEASURED. The framed page stacks a
             prototype bar, a design bar and the product header — 174px on the
             default today — and scrolling the column to y=24 put the dial
             behind all three. Summing whatever is actually pinned at the top
             keeps this true when a bar is added, removed or resized, which a
             typed offset would not. */
          const chrome = [...doc.querySelectorAll('*')].reduce((lowest, el) => {
            const pos = win.getComputedStyle(el).position
            if (pos !== 'sticky' && pos !== 'fixed') return lowest
            const box = el.getBoundingClientRect()
            return box.top < 140 && box.height > 20 ? Math.max(lowest, box.bottom) : lowest
          }, 0)
          win.scrollTo({ top: col.getBoundingClientRect().top + win.scrollY - chrome - 16 })
          /* ⚠ AND CORRECT ONCE THE BARS HAVE SETTLED, with time to settle.
             The first measurement is taken at the top of the page, where the
             prototype and design bars sit ABOVE the product header; after
             scrolling they are gone and only the header is pinned, so the
             first sum is the wrong shape and clipped the "Course progress"
             eyebrow behind it. A `requestAnimationFrame` was too early — the
             sticky header had not re-pinned yet and the correction measured
             zero. A couple of short passes is enough, and each one stops as
             soon as the eyebrow is clear. */
          let passes = 0
          const settle = () => {
            const pinned = [...doc.querySelectorAll('*')].reduce((lowest, el) => {
              const pos = win.getComputedStyle(el).position
              if (pos !== 'sticky' && pos !== 'fixed') return lowest
              const box = el.getBoundingClientRect()
              /* ⚠ THE SAME WINDOW THE FIRST PASS USES. This read `top <= 8`,
                 which counted only the topmost bar — 40px of a 174px stack —
                 so the gap always looked healthy and the correction never
                 fired. All three bars stay pinned while the page scrolls. */
              return box.top < 200 && box.height > 20 ? Math.max(lowest, box.bottom) : lowest
            }, 0)
            const gap = col.getBoundingClientRect().top - pinned
            if (gap < 12 && passes < 3) {
              win.scrollBy({ top: gap - 16 })
              passes += 1
              win.setTimeout(settle, 80)
            }
          }
          win.setTimeout(settle, 80)
          setNote(null)
          return
        }
        if (Date.now() - started > 6000) {
          setNote('Could not find the progress column to scroll to — scroll the frame down to it.')
          return
        }
        win.setTimeout(tick, 120)
      } catch {
        /* A cross-origin frame would throw here. It is same-origin today, and
           saying so beats a blank frame if that ever changes. */
        setNote('The frame could not be scrolled; scroll it to the progress column by hand.')
      }
    }
    tick()
  }, [])

  const src =
    `${import.meta.env.BASE_URL}dashboard-rebrand?demo=1&section=dashboard&brand=xcel` +
    (ff ? `&ff=${ff}` : '')

  return (
    <div style={{ width: '100%' }}>
      <iframe
        ref={frame}
        title={title}
        src={src}
        onLoad={onLoad}
        style={{ ...frameStyle, height }}
      />
      <p style={noteStyle}>
        {note ??
          'The real page, pinned to this state and scrolled to the region — not a copy of it. Scroll up inside the frame for the course card and the demo bars.'}
      </p>
    </div>
  )
}

const frameStyle: CSSProperties = {
  width: '100%',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-fixed-light, #fff)',
}
const noteStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-tertiary)',
}
