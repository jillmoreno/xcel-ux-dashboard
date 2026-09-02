/**
 * Refcounted body-scroll lock used by overlay primitives (Sheet, Modal).
 *
 * Why this exists: each overlay on its own captured `body.style.overflow`
 * before setting `'hidden'`, then restored the captured value on unmount.
 * That works for a single overlay, but breaks when a Modal stacks on top
 * of a Sheet — the Modal captures the Sheet's already-set `'hidden'` as
 * its "previous". If the Sheet cleanup runs first on simultaneous close,
 * the Modal's cleanup re-applies `'hidden'` and the page stays locked.
 *
 * With this helper the lock count drops to zero before any restore happens,
 * so the original value is always written back exactly once.
 */
let count = 0
let originalBody = ''
let originalHtml = ''

export function acquireBodyScrollLock(): () => void {
  if (count === 0) {
    // Lock BOTH <body> and <html>. In this app the viewport scroll container is
    // the documentElement (<html>), not <body>, so `body { overflow: hidden }`
    // alone doesn't stop the page from scrolling behind an open overlay — the
    // page slides under the `position: fixed` Sheet/Modal (whose frame bounds
    // were measured at open-time scroll), leaving the panel misaligned with the
    // window. Locking <html> too pins the page for the overlay's lifetime.
    const html = document.documentElement
    originalBody = document.body.style.overflow
    originalHtml = html.style.overflow
    document.body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
  }
  count += 1
  let released = false
  return function release() {
    if (released) return
    released = true
    count = Math.max(0, count - 1)
    if (count === 0) {
      document.body.style.overflow = originalBody
      document.documentElement.style.overflow = originalHtml
    }
  }
}
