import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  END_TO_END_VERSION,
  START_POINTS,
  startPointAt,
  resolveStartPoint,
  type StartPoint,
} from './endToEndDemo'

/**
 * THE "START" DEMO CONTROL — `demo-start-point` (2026-10-16), and the route,
 * kept in step. Renamed and widened from `atlas-e2e-page`, Eric's design
 * control for his version's three pages; `archivedItems.ts` carries the
 * re-wire.
 *
 * THE ROUTE IS THE TRUTH, as `useAtlasBackgroundSwitch` treats the version:
 * arriving on a page sets the control to it, and picking an option opens that
 * page. A short settle window after each arrival lets a `?demo=1` flag reset
 * land without being read as a pick. Renders nothing.
 */

export function EndToEndPageSync() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setVariant } = useFeatureFlags()
  /* ⚠ RESOLVED, NOT RAW — 2026-10-20. Four of this control's six options were
     folded into one; a browser still holding `email` or `checkout` would
     otherwise index `START_POINTS` with a key that no longer exists, and the
     control would silently navigate nowhere. */
  const picked = resolveStartPoint(useFeatureFlag('demo-start-point').variant)
  /* ⚠ NO VERSION GATE ANY MORE. `atlas-e2e-page` only synced when the address
     carried Eric's version, because it was his control on his version. Start
     is every version's, so the route alone decides. */
  const here = startPointAt(pathname, params.get('section'))
  const lastHere = useRef<StartPoint | null | undefined>(undefined)
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
      window.setTimeout(() => setVariant('demo-start-point', here), 0)
      return
    }
    if (!pickedChanged) return
    const target: (typeof START_POINTS)[StartPoint] = START_POINTS[picked]
    if (!target) return
    /* THE ADDRESS IS CARRIED FORWARD, not rebuilt — `?journey=full` and the
       reviewer's version have to survive a jump, or Start would quietly undo
       the walk it is meant to move you around inside. The exception is
       `?section=`, which IS what two of these options mean, and `coursePage`,
       which would otherwise ride along into a page that has no course open. */
    const next = new URLSearchParams(params)
    next.delete('coursePage')
    if (target.section) next.set('section', target.section)
    else next.delete('section')
    /* …except the three End-to-End Demo pages, which pin their own version on
       arrival (`useEndToEndDemoParams`). Setting it here as well keeps the
       jump from flashing the old version's chrome for a tick. */
    if (target.pathname.startsWith('/end-to-end-demo')) next.set('version', END_TO_END_VERSION)
    navigate(`${target.pathname}?${next.toString()}`)
  }, [here, picked, setVariant, navigate, params])

  return null
}
