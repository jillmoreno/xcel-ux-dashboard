/**
 * Env-var GATEWAY MODE — which of the two Netlify projects this build is for.
 *
 * The same repo and branch deploy to TWO Netlify projects (2026-09-18):
 *
 *   PUBLIC     — the link handed to stakeholders. Shows ONLY the ungated
 *                sections (Demo · Links · Research). Everything behind the
 *                Design & Development password is not locked here, it is
 *                ABSENT: no nav rows, no divider, no password modal, and the
 *                deep links into it redirect home. The standalone prototype
 *                documents under /prototypes/ are also 404'd at the edge
 *                (see `scripts/public-redirects.mjs`), because a client-side
 *                gate cannot hide a static file.
 *   FULL       — everything, locked and unlocked, exactly as before.
 *
 * ONE build-time env var decides it, set per project in the Netlify UI:
 *
 *   VITE_GATEWAY_MODE = public
 *
 * The full project sets nothing (or `full`), so an unset var is the whole app —
 * the same shape as `VITE_DEMO_TARGET` in `demoPin.ts`, and for the same
 * reason: no per-project code, no divergent branch. One push builds both.
 *
 * Read at BUILD time (Vite inlines `VITE_*`), so it has to be a Netlify build
 * env var, not a runtime one, and a change to it needs a redeploy.
 *
 * Tests: `import.meta.env` is read through `readGatewayModeRaw` so a test can
 * stub it with `vi.stubEnv('VITE_GATEWAY_MODE', 'public')`.
 */

export type GatewayMode = 'public' | 'full' | 'testing'

/** Parse a raw `VITE_GATEWAY_MODE` value. Anything that is not exactly
 *  `public` (case-insensitive, trimmed) is the full app — a typo must fail
 *  towards showing the maintainer everything, never towards hiding it. */
export function parseGatewayMode(raw: unknown): GatewayMode {
  if (typeof raw !== 'string') return 'full'
  const v = raw.trim().toLowerCase()
  if (v === 'public') return 'public'
  if (v === 'testing') return 'testing'
  return 'full'
}

export function gatewayMode(): GatewayMode {
  return parseGatewayMode(import.meta.env.VITE_GATEWAY_MODE)
}

/**
 * True where the gateway is TRIMMED — the stakeholder build and the moderated
 * user-test build both.
 *
 * ⚠ `testing` IS INCLUDED DELIBERATELY. Everything `public` hides, `testing`
 * must hide too; it then hides more (see `isTestingGateway`). Writing this as
 * `!== 'full'` rather than listing modes means a fourth mode inherits the
 * trim by default, which is the safe direction — a new mode that forgets to
 * opt in shows a stakeholder the Design section.
 */
export function isPublicGateway(): boolean {
  return gatewayMode() !== 'full'
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
 * Is a feature row reachable on the public build? Only rows that live in
 * Prototypes — the one ungated FEATURE section (Demo is a panel, not a list
 * of rows). This deliberately re-derives a NARROWER rule than `sectionOf` on
 * the home page: that one lets a per-browser "mark done" override move a row,
 * and honours `devStatus`, both of which can only move a row OUT of
 * Prototypes, never into it. So the category is the necessary condition, and
 * a row that fails it can never be a Prototypes row.
 */
export function isPublicFeature(feature: { category: string }): boolean {
  return (
    feature.category === 'prototype' || feature.category === 'demo' || feature.category === 'dashboard'
  )
}
