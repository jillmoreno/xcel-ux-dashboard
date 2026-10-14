import { useSyncExternalStore } from 'react'
import { isPublicGateway } from '@/data/gatewayMode'

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
/**
 * ⚠ `defaultOpen` IS A FUNCTION, NOT A BOOLEAN (2026-10-06). The design store's
 * default depends on `isPublicGateway()`, which reads `import.meta.env` — and
 * the gateway tests stub that env var and re-import, so a value captured at
 * module init would be whichever mode loaded this file first. A thunk is read
 * at the moment it is needed and gets the stubbed answer.
 */
function makeVisibilityStore(key: string, defaultOpen: () => boolean) {
  const listeners = new Set<() => void>()
  const read = (): boolean => {
    try {
      /* ⚠ ABSENT IS NO LONGER THE SAME AS '0'. This was `getItem(key) !== '0'`,
         which collapsed "never toggled" into "shown" — fine while every store
         defaulted to shown, wrong the moment one did not. Absent now means the
         default; '0' and '1' mean what was actually chosen. */
      const stored = localStorage.getItem(key)
      return stored === null ? defaultOpen() : stored !== '0'
    } catch {
      return defaultOpen()
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
  return { read, toggle, subscribe, defaultOpen }
}

const demoStore = makeVisibilityStore('cgp.demoControlsOpen', () => true)
/* ⚠ THE DESIGN BAR STARTS HIDDEN ON THE DEMO HUB (2026-10-06, the direct ask).
   The controls are available to a stakeholder but not ON DISPLAY: the way in is
   the robot's dropdown, which is itself invisible at rest. On the design site it
   still starts shown, because a bar a designer had to find before they could use
   it would not be found. */
const designStore = makeVisibilityStore('cgp.designControlsOpen', () => !isPublicGateway())

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
 *
 * ⚠ AND ITS DEFAULT IS PER-SITE SINCE 2026-10-06 — shown on the design site,
 * HIDDEN on the Demo Hub, where the robot's dropdown is the way in. A
 * stakeholder who opens it keeps it open; that is their choice, stored under the
 * same key, and nothing re-hides it on the next load.
 */
export function useDesignControlsVisibility() {
  const open = useSyncExternalStore(designStore.subscribe, designStore.read, designStore.defaultOpen)
  return { open, toggle: designStore.toggle }
}
