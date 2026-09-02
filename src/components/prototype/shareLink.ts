/**
 * Shareable prototype links — the deployed origin + a clipboard helper, shared
 * by the "Copy link" / "Share Link" actions on the prototype landing tiles and
 * the dev-handoff component cards so the origin (and copy fallback) never drift
 * between the two.
 */

/** Deployed prototype origin — used to build shareable, absolute deep links
 *  (a feature gateway or a handoff detail page) that work when pasted anywhere,
 *  unlike a relative in-app route. */
export const PROTOTYPE_SHARE_ORIGIN = 'https://ux-lms-dashboard.netlify.app'

/** Copy text to the clipboard with a legacy execCommand fallback for browsers /
 *  contexts where the async Clipboard API is unavailable. */
export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return new Promise((resolve, reject) => {
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      resolve()
    } catch (err) {
      reject(err)
    }
  })
}
