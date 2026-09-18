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

export type GatewayMode = 'public' | 'full'

/** Parse a raw `VITE_GATEWAY_MODE` value. Anything that is not exactly
 *  `public` (case-insensitive, trimmed) is the full app — a typo must fail
 *  towards showing the maintainer everything, never towards hiding it. */
export function parseGatewayMode(raw: unknown): GatewayMode {
  if (typeof raw !== 'string') return 'full'
  return raw.trim().toLowerCase() === 'public' ? 'public' : 'full'
}

export function gatewayMode(): GatewayMode {
  return parseGatewayMode(import.meta.env.VITE_GATEWAY_MODE)
}

/** True on the stakeholder build. */
export function isPublicGateway(): boolean {
  return gatewayMode() === 'public'
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
