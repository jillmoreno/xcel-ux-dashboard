import { useCallback, useRef, useState, type CSSProperties } from 'react'

/**
 * ONE OF THE THREE INFORMATION SHEETS, cropped out of the real page.
 *
 * ⚠ 2026-10-22, Jillienne: "Under States, detail out what the sheet view looks
 * like for Exam Information, Applying for a License, and State Requirements."
 * The Quick Links handoff described three sheets in prose and showed none of
 * them — the only thing a reader could see was the row you press to get there.
 *
 * ⚠ THE SHEETS OPEN BY URL, which is the whole reason this is possible without
 * a composition. `MembershipOverview` reads `?open=` and accepts
 * `exam-details`, `requirements` and `step:<id>` — then STRIPS the param so a
 * reload does not reopen it. That strip is why the frame measures on a timer
 * rather than once: the sheet arrives a tick after load, not with it.
 *
 * ⚠ AND IT IS CROPPED, NOT COMPOSED, for the same reason the Steps renders
 * are: these sheets are `MembershipOverview`'s, not a component anything can
 * import and draw. A hand-built copy would be a picture of a sheet, free to
 * drift from the sheet.
 */
export function AtlasSheetFrame({ open, title }: { open: string; title: string }) {
  const frame = useRef<HTMLIFrameElement | null>(null)
  const [box, setBox] = useState<Box | null>(null)

  const onLoad = useCallback(() => {
    const started = Date.now()
    let last: Box | null = null
    const measure = () => {
      const win = frame.current?.contentWindow
      const doc = win?.document
      if (!win || !doc) return
      const again = () => {
        if (Date.now() - started < 10000) win.setTimeout(measure, 150)
      }
      try {
        const sheet = doc.querySelector('[role="dialog"]')
        if (!sheet) return again()
        const r = sheet.getBoundingClientRect()
        const next: Box = {
          top: Math.round(r.top + win.scrollY),
          left: Math.round(r.left + win.scrollX),
          width: Math.ceil(r.width),
          height: Math.ceil(r.height),
        }
        if (next.width < MIN || next.height < MIN) return again()
        /* The same settle-twice rule the Steps frame needs: a panel that is
           still sliding in measures plausible and keeps moving. */
        const same =
          last != null &&
          last.top === next.top &&
          last.left === next.left &&
          last.width === next.width &&
          last.height === next.height
        last = next
        if (!same) return again()
        setBox(next)
      } catch {
        /* Same-origin today. */
      }
    }
    measure()
  }, [])

  return (
    <div style={{ ...plateStyle, width: box?.width ?? GUESS_W, height: box?.height ?? GUESS_H }}>
      <iframe
        ref={frame}
        title={title}
        tabIndex={-1}
        src={`${import.meta.env.BASE_URL}dashboard-rebrand?demo=1&section=dashboard&brand=xcel&chrome=off&open=${encodeURIComponent(open)}`}
        /* Seven frames on one page exhausted the connection pool once already
           — see `AtlasStepsFrame`. */
        loading="lazy"
        onLoad={onLoad}
        style={{
          position: 'absolute',
          top: -(box?.top ?? 0),
          left: -(box?.left ?? GUESS_LEFT),
          width: PAGE_W,
          height: PAGE_H,
          border: 0,
          /* ⚠ INERT. The sheet's own Close would empty the plate, and the crop
             was measured against a page with it open. */
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

type Box = { top: number; left: number; width: number; height: number }

const PAGE_W = 1438
/* ⚠ THE FRAME HEIGHT IS THE SHEET HEIGHT, because a sheet is full-viewport by
   design — it does not have a height of its own to measure. At 1200 the plate
   was a 1200-tall card in a gallery of 300-tall ones; 840 is a believable
   laptop viewport, so the panel reads at the proportion a learner sees and
   scrolls inside itself exactly as it does on the page. */
const PAGE_H = 840
/** Below this the sheet has not finished opening. */
const MIN = 200
/** The sheet's own size and position while it is still arriving — a 480-wide
 *  panel against the right of a 1438 page. Replaced by the measurement. */
const GUESS_W = 480
const GUESS_H = 851
const GUESS_LEFT = 958

const plateStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  maxWidth: '100%',
  background: 'var(--color-fixed-light, #fff)',
}
