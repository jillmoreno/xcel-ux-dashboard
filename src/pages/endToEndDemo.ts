import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

/** The End-to-End Demo's dashboard version (`dashboardVersions.ts`). */
export const END_TO_END_VERSION = 'eric-atlas-e2e'

/**
 * Keeps the End-to-End Demo's pages on its version (2026-10-14): the design
 * bar scopes its controls to `?version=`, and the demo bar reads `?demo=1`, so
 * a page opened without them is given them — replaced, not pushed, so Back
 * still leaves the page.
 */
export function useEndToEndDemoParams(): void {
  const [params, setParams] = useSearchParams()
  const missing = params.get('version') !== END_TO_END_VERSION || params.get('demo') !== '1'
  useEffect(() => {
    if (!missing) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('demo', '1')
        next.set('version', END_TO_END_VERSION)
        return next
      },
      { replace: true },
    )
  }, [missing, setParams])
}

/**
 * Puts the Atlas guide palette on <html> while a demo page is open, as the
 * dashboard's shell does (`data-atlas-palette` / `data-atlas-brand`), so the
 * Secondary tokens resolve to the guide's tans; restores what was there on
 * leaving. Also names the tab, a tick late — AccountContext names it on
 * mount too, and a parent's effect runs after its child's.
 */
export function useEndToEndPageChrome(title: string): void {
  useEffect(() => {
    const root = document.documentElement
    const before = { palette: root.dataset.atlasPalette, brand: root.dataset.atlasBrand, title: document.title }
    root.dataset.atlasPalette = 'xcel'
    root.dataset.atlasBrand = 'global'
    const timer = window.setTimeout(() => {
      document.title = title
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.title = before.title
      if (before.palette == null) delete root.dataset.atlasPalette
      else root.dataset.atlasPalette = before.palette
      if (before.brand == null) delete root.dataset.atlasBrand
      else root.dataset.atlasBrand = before.brand
    }
  }, [title])
}
