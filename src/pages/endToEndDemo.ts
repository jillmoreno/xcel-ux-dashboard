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
