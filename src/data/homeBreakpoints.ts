/**
 * THE DEVICE BREAKPOINTS THE LEARNER HOME IS DESIGNED AT — 2026-10-30, Eric (from the Cowork discussion).
 *
 * Read by the design bar's Breakpoint control (`home-breakpoint`, FeatureFlagContext) and by `DeviceFrame`, which draws the
 * app in a viewport of exactly this width and height. Each breakpoint's Home layout is its own stylesheet in
 * `src/styles/home-breakpoints/`, scoped by the frame's `data-home-bp` — adjust one without touching the others.
 *
 * Three: Desktop Wide (1920 × 1080) was the fourth and came out the same day (Eric: "the live version covers it") — Live
 * draws the app at the browser's own width, which on a wide screen is the wide breakpoint. Another is one row here, one
 * variant on the flag and one stylesheet.
 */
export type HomeBreakpointId = 'mobile' | 'tablet' | 'desktop'

export type HomeBreakpoint = { id: HomeBreakpointId; label: string; width: number; height: number }

export const HOME_BREAKPOINTS: readonly HomeBreakpoint[] = [
  { id: 'mobile', label: 'Mobile Portrait', width: 402, height: 874 },
  { id: 'tablet', label: 'Tablet Portrait', width: 820, height: 1180 },
  { id: 'desktop', label: 'Desktop', width: 1366, height: 650 },
]

/** The breakpoint a `home-breakpoint` variant names, or null for `live` (the frame is off). */
export function homeBreakpointFor(variant: string | null | undefined): HomeBreakpoint | null {
  return HOME_BREAKPOINTS.find((b) => b.id === variant) ?? null
}
