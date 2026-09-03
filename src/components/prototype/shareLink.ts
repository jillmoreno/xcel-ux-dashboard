/**
 * Shareable prototype links — the deployed origin + a clipboard helper, shared
 * by the "Copy link" / "Share Link" actions on the prototype landing tiles and
 * the dev-handoff component cards so the origin (and copy fallback) never drift
 * between the two.
 */

/** This site's own deploy — the fallback when we cannot read a real origin.
 *
 *  Corrected 2026-09-03. This file arrived as a byte-identical copy of the
 *  Common LMS one and kept ITS origin, so every "Copy link" here handed out a
 *  URL pointing at `ux-lms-dashboard.netlify.app` — a different site, which
 *  does not serve this dashboard's routes at all. */
const DEPLOYED_ORIGIN = 'https://xceldashboard.netlify.app'

/** Deployed prototype origin — used to build shareable, absolute deep links
 *  (a feature gateway or a handoff detail page) that work when pasted anywhere,
 *  unlike a relative in-app route.
 *
 *  DERIVED from where the app is actually running, rather than hardcoded. A real
 *  deploy is its own best answer, so this stays correct through a site rename or
 *  a Netlify deploy preview with nothing to maintain — and, more to the point, a
 *  future port to another dashboard cannot repeat the bug above by copying the
 *  file and forgetting the string.
 *
 *  Localhost is the one case we override: a share link is for pasting to someone
 *  else, so `http://localhost:5200/…` is never the useful answer. There we fall
 *  back to the deployed origin, which is the behaviour the hardcoded constant
 *  had and the reason it was hardcoded in the first place. */
export const PROTOTYPE_SHARE_ORIGIN: string = (() => {
  if (typeof window === 'undefined') return DEPLOYED_ORIGIN
  const { origin, hostname } = window.location
  const local = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  return local || !origin || origin === 'null' ? DEPLOYED_ORIGIN : origin
})()

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
