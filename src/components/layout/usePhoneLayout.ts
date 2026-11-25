import { useCallback, useSyncExternalStore } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { homeBreakpointFor } from '@/data/homeBreakpoints'

/** The widest window that gets the phone layout on the live page. The layout was drawn at the 402 frame; up to here it
 *  still reads as one column with 16 at the sides, and above it the desktop page has room. */
export const PHONE_MAX_WIDTH = 640

/**
 * WHETHER THE PAGE IS A PHONE (2026-11-25, Jillienne: "when in this full screen view, need to make the page responsive so
 * when user shrinks it down, this mobile version will autotrigger"). Two ways in, one answer:
 *
 *   · the review bar's Mobile icon — the design bar's Breakpoint control at `mobile`, the 402 × 874 frame; or
 *   · the live page (Breakpoint on Live, no frame) in a window no wider than `PHONE_MAX_WIDTH`.
 *
 * `DeviceFrame` stamps `data-home-bp="mobile"` on the page in both cases, which is what the phone stylesheet
 * (src/styles/home-breakpoints/mobile.css) keys on; the React-side phone choices — Home's stacked progress panel and Edit
 * link, the crumb as a path, the sheet rows' chevron — read this hook so they switch with it. A tablet or desktop FRAME
 * never becomes a phone, however narrow the window around it: the frame is its own viewport.
 */
export function usePhoneLayout(): boolean {
  const variant = useFeatureFlag('home-breakpoint').variant
  const narrow = useNarrowWindow()
  if (variant === 'mobile') return true
  return !homeBreakpointFor(variant) && narrow
}

const PHONE_QUERY = `(max-width: ${PHONE_MAX_WIDTH}px)`

/** `useMediaQuery`'s shape, listening to the window's resize as well as the query's own change — a viewport an embedding
 *  tool emulates (the preview pane, a device toolbar) does not always fire the query's change event, and a resize is
 *  what the user actually does. */
function useNarrowWindow(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
    const mql = window.matchMedia(PHONE_QUERY)
    mql.addEventListener('change', callback)
    window.addEventListener('resize', callback)
    return () => {
      mql.removeEventListener('change', callback)
      window.removeEventListener('resize', callback)
    }
  }, [])
  const getSnapshot = useCallback(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_QUERY).matches,
    [],
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
