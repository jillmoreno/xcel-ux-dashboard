import { useSyncExternalStore } from 'react'

/**
 * Shared show/hide state for the stakeholder demo banners (the Dashboard
 * Rebrand's `DemoControlsBar` and the Onboarding Flow's `OnboardingDemoBar`).
 *
 * The "Demo" toggle lives in the `PrototypeBar` (rendered by `Header`) while the
 * banners it controls live elsewhere in the tree (Header / the routed page), so
 * the visibility can't be a single component's local state. This is a minimal
 * `useSyncExternalStore` store backed by `localStorage['cgp.demoControlsOpen']`
 * so the toggle and every banner stay in sync and the presenter's choice
 * survives reloads. Defaults to shown.
 *
 * Reused by any demo route that wants a hide-able demo banner — add the route to
 * `Header`'s demo-toggle condition and read `useDemoControlsVisibility()` where
 * the banner mounts.
 */

const KEY = 'cgp.demoControlsOpen'
const listeners = new Set<() => void>()

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

/** Flip shown ⇄ hidden, persist, and notify every subscriber. */
export function toggleDemoControls() {
  const next = !read()
  try {
    localStorage.setItem(KEY, next ? '1' : '0')
  } catch {
    /* storage unavailable — session-only */
  }
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** `{ open, toggle }` — whether the demo banners are shown + the toggle action. */
export function useDemoControlsVisibility() {
  const open = useSyncExternalStore(subscribe, read, () => true)
  return { open, toggle: toggleDemoControls }
}
