/**
 * Session-scoped "which feature walkthrough am I in" marker.
 *
 * When a reviewer opens a platform page from a feature gateway
 * (`/prototype/:featureId`), we stash that feature id here so the
 * prototype bar can offer a "← Back" link to the feature page from any
 * platform screen — for the rest of the session, surviving in-app
 * navigation. Cleared when the reviewer goes Home or lands on the
 * gateway. sessionStorage (not localStorage) so it resets per tab.
 */
const WALKTHROUGH_KEY = 'cgp.prototypeFeature'

export function setPrototypeWalkthrough(featureId: string): void {
  try {
    sessionStorage.setItem(WALKTHROUGH_KEY, featureId)
  } catch {
    /* storage unavailable (SSR / privacy mode) — degrade silently */
  }
}

export function clearPrototypeWalkthrough(): void {
  try {
    sessionStorage.removeItem(WALKTHROUGH_KEY)
  } catch {
    /* no-op */
  }
}

export function readPrototypeWalkthrough(): string | null {
  try {
    return sessionStorage.getItem(WALKTHROUGH_KEY)
  } catch {
    return null
  }
}
