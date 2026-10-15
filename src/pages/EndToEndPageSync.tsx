import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import { END_TO_END_VERSION } from './endToEndDemo'

/** The End-to-End Demo's pages, as the `atlas-e2e-page` design control names
 *  them, and where each one lives. */
const E2E_PAGES = {
  'product-detail': '/end-to-end-demo',
  checkout: '/end-to-end-demo/checkout',
  confirmation: '/end-to-end-demo/confirmation',
  home: '/dashboard-rebrand',
} as const
type E2EPage = keyof typeof E2E_PAGES

function pageAt(pathname: string): E2EPage | null {
  const hit = (Object.keys(E2E_PAGES) as E2EPage[]).find((k) => E2E_PAGES[k] === pathname)
  return hit ?? null
}

/**
 * THE DESIGN BAR'S "PAGE" CONTROL (2026-10-14, Eric's request) — keeps
 * `atlas-e2e-page` and the route in step, on the End-to-End Demo only. THE
 * ROUTE IS THE TRUTH, as `useAtlasBackgroundSwitch` treats the version:
 * arriving on a page sets the control to it, and picking an option opens that
 * page. A short settle window after each arrival lets a `?demo=1` flag reset
 * land without being read as a pick. Renders nothing.
 */
export function EndToEndPageSync() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setVariant } = useFeatureFlags()
  const picked = useFeatureFlag('atlas-e2e-page').variant
  const onDemo = params.get('version') === END_TO_END_VERSION
  const here = onDemo ? pageAt(pathname) : null
  const lastHere = useRef<E2EPage | null | undefined>(undefined)
  const lastPicked = useRef<string | undefined>(undefined)
  const syncUntil = useRef(0)

  useEffect(() => {
    if (lastHere.current !== here) {
      lastHere.current = here
      syncUntil.current = Date.now() + 1500
    }
    const pickedChanged = picked !== lastPicked.current
    lastPicked.current = picked
    if (!here || picked === here) return
    if (Date.now() < syncUntil.current) {
      window.setTimeout(() => setVariant('atlas-e2e-page', here), 0)
      return
    }
    if (!pickedChanged) return
    const target = E2E_PAGES[picked as E2EPage]
    if (!target) return
    navigate(`${target}?demo=1&version=${END_TO_END_VERSION}`)
  }, [here, picked, setVariant, navigate])

  return null
}
