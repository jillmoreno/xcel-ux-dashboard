/**
 * Prototype access gate — a lightweight password lock for the landing-page
 * feature tiles. The password lives in `localStorage` (settable from the
 * Admin tools dropdown); which tiles the visitor has already unlocked is
 * tracked per-id in `sessionStorage`, so each tile prompts once per session.
 *
 * Non-component module (kept `.ts`) so it can be imported by both the landing
 * page tiles and the AdminToolsMenu without tripping `react-refresh`.
 */

const PASSWORD_KEY = 'cgp.prototypePassword'
const UNLOCKED_KEY = 'cgp.prototypeUnlocked'

/** Default gate password — used until an admin overrides it.
 *
 *  ONE password opens every gated section of the UX dashboard. It used to be
 *  two: this default for Design / Development / Done / Archive, and a separate
 *  hardcoded one for Exploration, which also bypassed the admin override. */
export const DEFAULT_PROTOTYPE_PASSWORD = 'Password123'

/** The current gate password (falls back to the default). */
export function getPrototypePassword(): string {
  try {
    return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PROTOTYPE_PASSWORD
  } catch {
    return DEFAULT_PROTOTYPE_PASSWORD
  }
}

/** Persist a new gate password (empty string resets to the default). */
export function setPrototypePassword(next: string): void {
  try {
    if (next) localStorage.setItem(PASSWORD_KEY, next)
    else localStorage.removeItem(PASSWORD_KEY)
  } catch {
    /* storage unavailable — no-op */
  }
}

function readUnlocked(): Set<string> {
  try {
    const raw = sessionStorage.getItem(UNLOCKED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/** Whether a given tile id has already been unlocked this session. */
export function isPrototypeUnlocked(id: string): boolean {
  return readUnlocked().has(id)
}

/** Mark a tile id unlocked for the rest of the session. */
export function markPrototypeUnlocked(id: string): void {
  try {
    const set = readUnlocked()
    set.add(id)
    sessionStorage.setItem(UNLOCKED_KEY, JSON.stringify([...set]))
  } catch {
    /* storage unavailable — no-op */
  }
}
