/**
 * Prototype "Done" status — a lightweight per-tile status the reviewer can flip
 * from the landing-page tiles. A tile marked done moves to the "Done" filter
 * tab regardless of its `category`; reopening it returns it to its category tab.
 *
 * Like In Design (below), Done is **TRI-STATE**: features can be authored as
 * done via the `done` config flag in `prototypeFeatures.ts` (so a finished
 * feature ships that way for every reviewer, not just the browser that clicked
 * the tile), and the runtime override then forces the status on/off from the
 * tile kebab — `true`/`false` wins, no entry falls back to the config flag.
 *
 * Overrides are persisted in `localStorage` (so they survive reload, unlike the
 * per-session unlock state). Non-component module (kept `.ts`) so it can be
 * imported by the landing page without tripping `react-refresh`.
 */

const DONE_KEY = 'cgp.prototypeDone'

function readDone(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DONE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    // Legacy shape: a plain array of done ids, from before Done had a config
    // default. Migrate it to the tri-state map (every stored id was an explicit
    // "mark done") so a reviewer's existing marks survive the upgrade.
    if (Array.isArray(parsed)) {
      const migrated = Object.fromEntries((parsed as string[]).map((id) => [id, true]))
      writeDone(migrated)
      return migrated
    }
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function writeDone(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(map))
  } catch {
    /* storage unavailable — no-op */
  }
}

/** Every runtime Done override, keyed by feature id (`true` = forced done,
 *  `false` = forced reopened). Missing ids fall back to the config `done`. */
export function getDoneOverrides(): Record<string, boolean> {
  return readDone()
}

/** Set (or update) the Done override for a feature id. */
export function setFeatureDone(id: string, done: boolean): void {
  const map = readDone()
  map[id] = done
  writeDone(map)
}

/* ── "In Design" status override ─────────────────────────────────────
 * The reviewer can move a tile into (or out of) the In Design filter tab from
 * the tile kebab, mirroring "Mark done". Unlike Done — a pure runtime set — In
 * Design has an authored `inProgress` config default, so the override is
 * TRI-STATE: an entry of `true`/`false` forces the status on/off, and no entry
 * falls back to the feature's config `inProgress`. Persisted in localStorage
 * (survives reload). */
const IN_DESIGN_KEY = 'cgp.prototypeInDesign'

function readInDesign(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(IN_DESIGN_KEY)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function writeInDesign(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(IN_DESIGN_KEY, JSON.stringify(map))
  } catch {
    /* storage unavailable — no-op */
  }
}

/** Every runtime In Design override, keyed by feature id (`true` = forced on,
 *  `false` = forced off). Missing ids fall back to the config `inProgress`. */
export function getInDesignOverrides(): Record<string, boolean> {
  return readInDesign()
}

/** Set (or update) the In Design override for a feature id. */
export function setFeatureInDesign(id: string, inDesign: boolean): void {
  const map = readInDesign()
  map[id] = inDesign
  writeInDesign(map)
}

/* ── Last-viewed Design & Development sub-tab ─────────────────────────
 * Remembered so re-entering the dev section (via the chooser card or a bare
 * `?section=dev` link) returns the reviewer to the tab they left off on — e.g.
 * Done, after they've been marking features complete — instead of always
 * resetting to Dev Handoff. Persisted like the done status (survives reload).
 * Typed as a plain string here; the landing page validates it against its
 * DevTab list before use. */
const DEV_TAB_KEY = 'cgp.prototypeDevTab'

export function getLastDevTab(): string | null {
  try {
    return localStorage.getItem(DEV_TAB_KEY)
  } catch {
    return null
  }
}

export function setLastDevTab(tab: string): void {
  try {
    localStorage.setItem(DEV_TAB_KEY, tab)
  } catch {
    /* storage unavailable — no-op */
  }
}
