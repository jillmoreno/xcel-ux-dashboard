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
 * ⚠ THE LINKS ARE CLICKABLE HERE (2026-10-21, Jillienne: "blue links should
 * be clickable"). Exam Information and Applying for a License open their
 * sheets in the preview, for real.
 *
 * Step 1's rows do not respond, and that is the PROTOTYPE rather than the
 * design: those rows are meant to open the course material, and `LINKS_OFF`
 * in `AtlasHomeJillMain` withholds `onOpenStop` because leaving Home is the
 * one thing this demo refuses to do. Passing clicks through does not change
 * that, and should not — a preview that navigated out of Home would be
 * showing something the prototype does not do.
 *
 * ⚠ WHICH IS WHY THE CROP FOLLOWS THE SHEET. It arrives as a 480-wide panel
 * against the right of the page, overlapping the column — crop to the column
 * alone and clicking a link half-covers the thing you were reading with a
 * slice of something you cannot see. The box is the UNION of the column and
 * any open dialog, so the click shows its own result and the plate shrinks
 * back when the sheet closes.
 */
export function AtlasStepsFrame({ ff, title }: { ff?: string; title: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [box, setBox] = useState<Box>(GUESS)

  const onLoad = useCallback(() => {
    const started = Date.now()
    let last: Box | null = null
    /* ⚠ THE WATCH NEVER STOPS, because the thing it is watching for is a
       reader's click. Settling the first measurement is the load-time job;
       after that this is what notices a sheet opening or closing. 300ms is
       slow enough to cost nothing and fast enough that the plate does not
       visibly lag the panel. */
    const watch = () => {
      const win = frame.current?.contentWindow
      if (win) win.setTimeout(() => { measure(true); watch() }, 300)
    }
    const measure = (settled: boolean) => {
      const win = frame.current?.contentWindow
      const doc = win?.document
      if (!win || !doc) return
      const again = () => {
        if (Date.now() - started < 8000) win.setTimeout(() => measure(false), 120)
      }
      try {
        /* The column is the journey section's parent — the flex child that
           holds Step 1, Step 2 and Step 3 together. The section alone would
           crop to Step 1. */
        const section = doc.querySelector('section[aria-label="Study journey"]')
        const col = section?.parentElement
        if (!col) return settled ? undefined : again()
        /* The column, plus whatever sheet a click has opened over it. */
        const rects = [col.getBoundingClientRect()]
        const sheet = doc.querySelector('[role="dialog"]')
        if (sheet) {
          const sr = sheet.getBoundingClientRect()
          if (sr.width > 0 && sr.height > 0) rects.push(sr)
        }
        const top = Math.min(...rects.map((x) => x.top))
        const left = Math.min(...rects.map((x) => x.left))
        const next: Box = {
          top: Math.round(top + win.scrollY) - PAD,
          left: Math.round(left + win.scrollX) - PAD,
          width: Math.ceil(Math.max(...rects.map((x) => x.right)) - left) + PAD * 2,
          height: Math.ceil(Math.max(...rects.map((x) => x.bottom)) - top) + PAD * 2,
        }
        /* ⚠ WAIT FOR THE COLUMN TO FINISH LAYING OUT, and prove it by reading
           the same box twice. The first version took whatever the first find
           returned and cropped to 29×55 — the column mid-layout, before its
           own content had height. A sane floor alone would not have caught
           it either: the trap is a box that is plausible and still growing,
           which a second identical read is what rules out. */
        if (next.width < MIN || next.height < MIN) return settled ? undefined : again()
        const same =
          last != null &&
          last.top === next.top &&
          last.left === next.left &&
          last.width === next.width &&
          last.height === next.height
        last = next
        /* Settling needs the same box twice; watching does not — a sheet that
           has just opened should be shown on the first read of it. */
        if (!settled && !same) return again()
        setBox(next)
        if (!settled) watch()
      } catch {
        /* Same-origin today; the guess still frames the column if that ever
           changes. */
      }
    }
    measure(false)
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
        /* ⚠ LAZY, AND IT IS NOT AN OPTIMISATION (2026-10-21). Seven of these
           render on the Steps tab, each loading the whole Atlas Home, and
           started together they exhaust the browser's per-origin connection
           limit — two of the seven simply never loaded, and an iframe that
           never loads never fires `onLoad`, so its plate sat on the guess
           showing nothing at all. Deferring to the viewport staggers them. */
        loading="lazy"
        onLoad={onLoad}
        style={{
          position: 'absolute',
          top: -box.top,
          left: -box.left,
          width: PAGE_W,
          height: PAGE_H,
          border: 0,
        }}
      />
    </div>
  )
}

type Box = { top: number; left: number; width: number; height: number }

/** The page's own width with the chrome off, and tall enough that Step 3 is
 *  laid out before the column is measured. */
const PAGE_W = 1438
/* ⚠ TALLER THAN THE SHEET, not just than the column. An open Exam Details
   measured 1616 with the column, and a frame shorter than the crop it is
   asked for shows a strip of blank plate under the content. */
const PAGE_H = 2000
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
