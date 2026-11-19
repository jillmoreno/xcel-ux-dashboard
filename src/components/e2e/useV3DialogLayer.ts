import { useEffect, useState, type CSSProperties } from 'react'

/**
 * HOW INVITE FLOW V3'S DIALOGS SIT ON THE PAGE — 2026-10-30, Afsana:
 *
 *   "the demo controls and design controls shouldn't be blocked off"
 *   "ensure that the modals are always at the center of the page and that a
 *    user cannot scroll up or down while the modal is there"
 *   "when i say the modal has to be at the center of the screen, I am
 *    referring to the screen that the user sees on their simulated web window"
 *
 * For every V3 dialog (the email check, Partner Code, Placing your order,
 * Change your course):
 *
 *   1. THE SCRIM IS THE SIMULATED BROWSER WINDOW — the part of
 *      `.cre-demo-stage-window` on screen, not the whole viewport. The bars
 *      above it and the dark stage around it stay clear and usable, and the
 *      dialog centres in what the learner would see. It sits below the bars'
 *      own menus (`demoBarUtil`'s dropdowns at 60, `Sheet` at 100) and above
 *      the page's sticky chrome (51). Outside the Demo frame there is no
 *      window, and the scrim covers the viewport as before.
 *   2. THE PAGE DOES NOT SCROLL while the dialog is open — which is also what
 *      keeps the window's visible part, and so the dialog, where it was
 *      measured.
 *
 * Spread `scrim` over the scrim's style (a centring flex box) and `card` over
 * the dialog's. `active` is false for V1/V2 callers of a shared dialog, which
 * keep their own layout.
 */
export function useV3DialogLayer(active = true): { scrim: CSSProperties; card: CSSProperties } {
  const [frame, setFrame] = useState<CSSProperties>({})

  useEffect(() => {
    if (!active) return
    const measure = () => {
      const stage = document.querySelector('.cre-demo-stage-window')
      if (!stage) {
        setFrame({})
        return
      }
      const r = stage.getBoundingClientRect()
      const top = Math.max(0, r.top)
      const bottom = Math.min(window.innerHeight, r.bottom)
      /* The window's own rounded corners where its edge is on screen, so the
         scrim does not square them off. */
      const radiusTop = r.top >= 0 ? 14 : 0
      const radiusBottom = r.bottom <= window.innerHeight ? 14 : 0
      setFrame({
        top,
        left: r.left,
        width: r.width,
        height: Math.max(0, bottom - top),
        right: 'auto',
        bottom: 'auto',
        borderRadius: `${radiusTop}px ${radiusTop}px ${radiusBottom}px ${radiusBottom}px`,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  /* The scroll lock — on the root, where the page scrolls, and restored to
     whatever it was so a dialog opening over another leaves it as found. */
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const before = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = before
    }
  }, [active])

  return active
    ? { scrim: { ...frame, boxSizing: 'border-box', zIndex: 55 }, card: CARD }
    : { scrim: {}, card: {} }
}

/* Centred by the scrim's flex box; scrolls inside itself if the window is
   shorter than it is. */
const CARD: CSSProperties = {
  position: 'relative',
  maxHeight: '100%',
  overflowY: 'auto',
}
