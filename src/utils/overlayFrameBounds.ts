import { useEffect, useState, type CSSProperties } from 'react'

/**
 * Pins a `position: fixed` overlay (portaled to <body>) to the stakeholder Demo
 * frame instead of the true viewport.
 *
 * The Demo frame (`<DeviceFrame device="desktop-framed">`) renders the whole app
 * shell inside a centered, capped browser-style window (`.cre-demo-stage-window`)
 * on a dark stage. A slide-over `Sheet` / `Modal` portals to `document.body` with
 * `position: fixed; inset: 0`, so it anchors to the real viewport — sliding
 * against the real screen edge (a left sheet lands in the dark stage gutter,
 * outside the "device"), while the backdrop dims the stage + prototype bar. That
 * reads as broken in a demo: the panel should live *inside* the demo screen.
 *
 * This hook measures the demo window's on-screen rect (clamped to the visible
 * viewport, since the window can be taller than the screen) and returns fixed
 * bounds matching it, so the overlay stays within the frame. Outside the Demo
 * frame (no `.cre-demo-stage-window` in the DOM — Desktop mode, non-app routes,
 * unit tests) it returns `inset: 0`, i.e. the original full-viewport behavior.
 *
 * Body scroll is locked while these overlays are open, so the rect is stable for
 * the overlay's lifetime; we still re-measure on open + on resize.
 */
export function useOverlayFrameBounds(open: boolean): CSSProperties {
  // Lazy initial measure — the demo window is an ancestor already in the DOM
  // when the overlay mounts, so this is correct on first paint (no flash).
  const [bounds, setBounds] = useState<CSSProperties>(computeBounds)

  useEffect(() => {
    if (!open) return
    // Re-measure on open + subscribe to resize. Both run off the effect's
    // synchronous path (rAF / listener), so we never cascade a render.
    const measure = () => setBounds(computeBounds())
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [open])

  return bounds
}

/**
 * Companion to `useOverlayFrameBounds` for a TOP-RIGHT-anchored fixed element
 * (the Toast / AddToCartToast). A toast is `position: fixed; top: 88; right: 24`
 * — anchored to the real viewport, so in the Demo frame it floats over the dark
 * stage / prototype bar instead of the demo browser window. This returns the
 * top/right offsets that pin it to the demo window's TOP-RIGHT — 16px below the
 * window's browser chrome, inset 24px from its right edge. Outside the Demo
 * frame it returns the real-viewport defaults (`top: 88 / right: 24`), i.e.
 * original behavior.
 */
const TOAST_DEFAULT_ANCHOR = { top: 88, right: 24 }

export function useToastFrameAnchor(open: boolean): { top: number; right: number } {
  const [anchor, setAnchor] = useState(computeToastAnchor)

  useEffect(() => {
    if (!open) return
    const measure = () => setAnchor(computeToastAnchor())
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [open])

  return anchor
}

function computeToastAnchor(): { top: number; right: number } {
  const el = typeof document !== 'undefined' && document.querySelector('.cre-demo-stage-window')
  if (!el) return TOAST_DEFAULT_ANCHOR
  const r = el.getBoundingClientRect()
  const chrome = el.querySelector('.cre-browser-chrome')
  const screenTop = chrome ? chrome.getBoundingClientRect().bottom : r.top
  // Hug the TOP-RIGHT of the demo window: just below its chrome (16px gap), and
  // inset 24px from its right edge.
  //
  // This used to add the real-viewport's 88px — which double-counted, because
  // `screenTop` already skips the prototype bars AND the window chrome. Inside
  // the frame that put the toast ~247px down the page: mid-right, not top-right.
  // A toast briefly overlapping the app header is normal; landing a third of the
  // way down the page isn't.
  const top = Math.max(0, Math.round(screenTop)) + 16
  const right = Math.max(24, Math.round(window.innerWidth - Math.min(r.right, window.innerWidth)) + 24)
  return { top, right }
}

const FULL_VIEWPORT: CSSProperties = { position: 'fixed', inset: 0 }

function computeBounds(): CSSProperties {
  const el = typeof document !== 'undefined' && document.querySelector('.cre-demo-stage-window')
  if (!el) return FULL_VIEWPORT
  const r = el.getBoundingClientRect()
  // Start below the browser-chrome (traffic-light) title strip so the overlay
  // lives within the demo browser's "screen" — the white content area — and
  // slides in from that frame's edge, leaving the window chrome uncovered.
  const chrome = el.querySelector('.cre-browser-chrome')
  const screenTop = chrome ? chrome.getBoundingClientRect().bottom : r.top
  // Clamp to the visible viewport — the window is often taller than the screen,
  // so an unclamped height would push the panel's content below a scroll-locked
  // fold that can never be reached.
  const top = Math.max(screenTop, r.top, 0)
  const left = Math.max(r.left, 0)
  const bottom = Math.min(r.bottom, window.innerHeight)
  const right = Math.min(r.right, window.innerWidth)
  const width = Math.max(0, right - left)
  const height = Math.max(0, bottom - top)
  if (width === 0 || height === 0) return FULL_VIEWPORT
  return { position: 'fixed', top, left, width, height }
}
