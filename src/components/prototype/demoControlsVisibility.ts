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

/**
 * ⚠ ONE FACTORY, TWO STORES — 2026-10-05, when the DESIGN bar got a toggle of
 * its own beside the Demo one.
 *
 * The two bars hide independently: a designer may want the design controls up
 * while the stakeholder bar is down, and the reverse is the whole point of the
 * Demo toggle. Two keys, two listener sets, no shared state.
 *
 * ⚠ IT IS A FACTORY RATHER THAN A SECOND COPY OF THIS FILE. The subscribe /
 * read / notify triple is four lines of easily-wrong `useSyncExternalStore`
 * plumbing, and a copy would drift the day one of them learns something — the
 * storage try/catch, say, which exists because private browsing throws.
 */
function makeVisibilityStore(key: string) {
  const listeners = new Set<() => void>()
  const read = (): boolean => {
    try {
      return localStorage.getItem(key) !== '0'
    } catch {
      return true
    }
  }
  const toggle = () => {
    const next = !read()
    try {
      localStorage.setItem(key, next ? '1' : '0')
    } catch {
      /* storage unavailable — session-only */
    }
    listeners.forEach((l) => l())
  }
  const subscribe = (cb: () => void) => {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }
  return { read, toggle, subscribe }
}

const demoStore = makeVisibilityStore('cgp.demoControlsOpen')
const designStore = makeVisibilityStore('cgp.designControlsOpen')

/** Flip shown ⇄ hidden, persist, and notify every subscriber. */
export const toggleDemoControls = demoStore.toggle

/** `{ open, toggle }` — whether the demo banners are shown + the toggle action. */
export function useDemoControlsVisibility() {
  const open = useSyncExternalStore(demoStore.subscribe, demoStore.read, () => true)
  return { open, toggle: demoStore.toggle }
}

/**
 * The same, for the DESIGN controls bar.
 *
 * ⚠ ITS OWN KEY (`cgp.designControlsOpen`), so hiding the stakeholder bar for a
 * presentation does not also take away the designer's own controls — and so a
 * designer who keeps the design bar up does not have the demo bar up with it.
 * Defaults to SHOWN, like the demo one: a bar that had to be found before it
 * could be used would not be found.
 */
export function useDesignControlsVisibility() {
  const open = useSyncExternalStore(designStore.subscribe, designStore.read, () => true)
  return { open, toggle: designStore.toggle }
}
