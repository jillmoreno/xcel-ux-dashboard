/**
 * Env-var GATEWAY MODE — which build this is.
 *
 * ⚠ THE PUBLIC MODE WAS RETIRED ON 2026-10-15 (Jillienne: "we will be using
 * this Design hub as the source of truth for everything"). From 2026-09-18 the
 * same repo deployed to TWO Netlify projects — a FULL site for the team and a
 * PUBLIC site for stakeholders that trimmed the project list to its ungated
 * sections, 404'd the standalone documents at the edge, hid the kebabs and the
 * flag sheet, and showed only the Refinement rows flipped public. One site
 * now, behind one password, and stakeholders are given its link. The
 * `archivedItems.ts` row for the public build says how it was wired and what
 * putting it back would take.
 *
 * Two modes remain:
 *   FULL     — everything. The default; an unset var is the whole app.
 *   TESTING  — the moderated user-test build (`VITE_GATEWAY_MODE = testing`),
 *              which hides the gateway entirely; see `isTestingGateway`.
 *
 * Read at BUILD time (Vite inlines `VITE_*`), so it has to be a Netlify build
 * env var, not a runtime one, and a change to it needs a redeploy. Tests stub
 * it with `vi.stubEnv('VITE_GATEWAY_MODE', 'testing')`.
 */

export type GatewayMode = 'full' | 'testing'

/** Parse a raw `VITE_GATEWAY_MODE` value. Anything that is not exactly
 *  `testing` (case-insensitive, trimmed) is the full app — a typo must fail
 *  towards showing the maintainer everything, never towards hiding it. A
 *  leftover `public` from the retired site reads as full, on purpose: the
 *  site that set it no longer exists, and there is nothing to trim towards. */
export function parseGatewayMode(raw: unknown): GatewayMode {
  if (typeof raw !== 'string') return 'full'
  if (raw.trim().toLowerCase() === 'testing') return 'testing'
  return 'full'
}

export function gatewayMode(): GatewayMode {
  return parseGatewayMode(import.meta.env.VITE_GATEWAY_MODE)
}

/**
 * True where the build is TRIMMED for an audience that must not see the
 * design surfaces — which, since the public site was retired (2026-10-15), is
 * the user-test build alone. The name is kept because some twenty call sites
 * read it to hide a kebab, a flag sheet or a branch name, and every one of
 * those trims is still right for a test participant; renaming them all would
 * be churn with no behaviour behind it. Read it as "is this the testing
 * build". It was `!== 'full'` so a new mode inherited the trim by default;
 * with one trimmed mode left, that is the same thing written down.
 */
export function isPublicGateway(): boolean {
  return gatewayMode() === 'testing'
}

/**
 * True on the USER-TEST build — 2026-09-23.
 *
 * ⚠ THE DIFFERENCE FROM `public` IS THE GATEWAY ITSELF. The public build
 * trims the project list to its ungated sections and still serves it at `/`;
 * a stakeholder is meant to browse. A test participant is not: they are handed
 * one link to one screen, and a project list — even a trimmed one, even
 * behind a password they were given — tells them they are inside a prototype
 * gallery belonging to a design team. That reframes everything they then say
 * about the product.
 *
 * So on this build the gateway does not exist: `/` and every one of its routes
 * redirect into the product, and `/prototypes/*` is 404'd at the edge exactly
 * as it is on the public build.
 *
 * ⚠ IT HIDES THE DASHBOARD, NOT THE PRODUCT'S OWN ROUTES. All ~28 routes under
 * `AppLayout` stay open — a participant who wanders from the course into My
 * Courses should find it, because that is the product and the wandering is the
 * data.
 */
export function isTestingGateway(): boolean {
  return gatewayMode() === 'testing'
}

/**
 * Is this page view a moderated user-test session?
 *
 * ⚠ TRUE BY DEFAULT ON THE `testing` BUILD — 2026-09-23, after the new site's
 * bare root served the full demo chrome. `?test=1` was the only switch, so a
 * participant who reached `/dashboard-rebrand` without it — from the root
 * redirect, from a pasted link with the params trimmed, from anything that
 * dropped a query string — got the prototype bar, the joke, the device
 * toggles and all six demo dropdowns. On a site whose entire purpose is
 * participant sessions, the stripped chrome has to be the FLOOR rather than
 * something a URL opts into.
 *
 * ⚠ `?test=0` IS THE WAY OUT, and it has to exist. The moderator sets a
 * session up on the same site, and they need the full bar to check a persona
 * or a flag before handing the laptop over. An explicit opt-out is safer than
 * an implicit opt-in here: forgetting the opt-out shows a colleague too much
 * chrome, forgetting the opt-in showed a participant too much.
 *
 * On every other build this is exactly what it was: `?test=1` and nothing else.
 */
export function isTestSession(search: string): boolean {
  const raw = new URLSearchParams(search).get('test')
  if (raw === '1') return true
  if (raw === '0') return false
  return isTestingGateway()
}
