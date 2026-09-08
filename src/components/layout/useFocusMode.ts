import { useSearchParams } from 'react-router-dom'

/**
 * True when the locked "kiosk" share view is active (`?focus=1`).
 *
 * In this mode the left rail + the header's Cart / Account / hamburger + logo
 * link are all hidden (see `PlatformShell` / `Header`), so a tester on a focused
 * share link can't navigate away from the single page it opens on. Any
 * in-content link that would route to ANOTHER page (e.g. a "See All →" catalog
 * link, or the Current Learning Path sheet's "Go to Learning Path") should read
 * this and suppress itself so the lock stays airtight.
 *
 * Inert on every normal load — it only reads a URL param, so components that
 * call it are unaffected unless the focus link is used.
 */
export function useFocusMode(): boolean {
  const [params] = useSearchParams()
  return params.get('focus') === '1'
}
