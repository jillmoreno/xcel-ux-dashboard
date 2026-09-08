/**
 * Env-var DEMO pin — a dedicated Netlify project can pin its ROOT to open a
 * specific "Share Demo" view (the black-background Demo frame, no prototype
 * chrome + the captured brand / tier / progress state).
 *
 * The project sets ONE build-time env var to the target link, and a bare visit
 * to that project's root redirects there — a clean single URL, no per-project
 * code and no divergent branch. The main site sets no var, so it's unaffected.
 *
 *   VITE_DEMO_TARGET = https://…/dashboard-rebrand?brand=cre&membership=member&tier=low&prog=progress-at-risk&present=1
 *   (or just the path+query: /dashboard-rebrand?brand=cre&…&present=1)
 *
 * Copy it straight from the DemoControlsBar "Share Demo" action — that URL is
 * exactly this value (a full URL works; the origin is stripped). Read at BUILD
 * time (Vite inlines `VITE_*`), so it must be set as a Netlify build env var.
 *
 * Mirrors the Recommended-card single-arm pin (`recCardEnvTarget`).
 */

/**
 * Parse a `VITE_DEMO_TARGET` value into an in-app path to redirect to, or `null`
 * when unset / invalid. Accepts either a bare in-app path (`/dashboard-rebrand?…`)
 * or a full Share Demo URL (the origin is stripped so pasting the whole link
 * works). Anything that isn't an in-app absolute path is rejected — a guard
 * against a stray value pointing off-site.
 */
export function parseDemoTarget(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const val = raw.trim()
  if (!val) return null
  // Full URL → keep only the in-app path + query (drop the origin).
  if (/^https?:\/\//i.test(val)) {
    try {
      const u = new URL(val)
      return `${u.pathname}${u.search}${u.hash}`
    } catch {
      return null
    }
  }
  // Bare path — must be app-absolute (starts with "/"), never a protocol-less
  // "//host" that a browser would treat as an off-site URL.
  return val.startsWith('/') && !val.startsWith('//') ? val : null
}

/** The pinned demo path for this deploy, or `null` when unpinned (the main
 *  site — the normal full app). */
export function demoEnvTarget(): string | null {
  return parseDemoTarget(import.meta.env.VITE_DEMO_TARGET)
}
