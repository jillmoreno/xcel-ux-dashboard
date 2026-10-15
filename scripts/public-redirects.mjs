#!/usr/bin/env node
/**
 * Post-build step for the PUBLIC Netlify project (`VITE_GATEWAY_MODE=public`).
 *
 * The React app hides the gated sections and closes their routes on that
 * build (see `src/data/gatewayMode.ts`), but the six standalone prototype
 * DOCUMENTS under `public/prototypes/` are static files — a client-side gate
 * cannot hide a file the CDN serves on request. So this writes a
 * `dist/_redirects` that 404s the whole folder AT THE EDGE.
 *
 * Why `_redirects` and not `netlify.toml`: the toml is one file shared by both
 * projects and has no per-project conditional. `_redirects` is generated into
 * the publish directory, so it can differ per build — and Netlify evaluates
 * `_redirects` rules BEFORE `netlify.toml` rules, which is what lets this 404
 * win over the toml's `/*` SPA fallback.
 *
 * Runs as npm's `postbuild` hook, so `npm run build` (the Netlify build
 * command) picks it up with no change to the build command. On the full build
 * it writes nothing — and vite empties `dist/` on every build, so a file from
 * an earlier public build cannot survive into a full one.
 *
 * The 404 target is `public/404.html`, which vite copies into `dist/`; Netlify
 * also uses that file for its own not-found page, so a blocked prototype and a
 * mistyped address look the same — which is the point. Nothing on the public
 * build should hint that the folder exists.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const mode = (process.env.VITE_GATEWAY_MODE ?? '').trim().toLowerCase()

/* ⚠ THE PUBLIC MODE IS RETIRED — 2026-10-15. From 2026-09-23 to then this set
   held `public` and `testing`, the two trimmed builds, and the FULL build wrote
   no rules at all. One site now, so the full build is the one stakeholders
   open, and it gets ONE rule of its own below: the review recaps. Listed
   rather than inverted to `!== 'full'` because this writes a file that DENIES
   access, and a new mode should have to opt in to that rather than inherit
   it by accident. */
const TRIMMED = new Set(['testing'])

/** Netlify's own `CONTEXT` build var — `production`, `branch-deploy`,
 *  `deploy-preview`. Read so the full build can block the recaps on the
 *  production site and still serve them on a branch build (see `PRODUCTION_ONLY`). */
const context = (process.env.CONTEXT ?? '').trim().toLowerCase()

/**
 * Everything the gated sections point at that is a FILE rather than a route.
 * `/prototypes/` is the six documents plus the row-less companions; `/testing/`
 * and `/ngat-admin/` are static explorations that came over with the LMS
 * product app; `/archive/` and `/qa/` are the Archive and QA Notes sections'
 * own assets. `/prototype-thumbs/` is NOT blocked: a row thumbnail is a
 * screenshot of a list row, and the Demo row may grow one. `/api/*` is not
 * here either — Links is ungated and needs its endpoint, and neither is
 * `/demos/`: that folder exists to be REACHABLE on the public build, so a
 * designer's branch deploy can put HTML in front of stakeholders (see
 * `public/demos/README.md`). `/contributing/` IS blocked — it is the designer
 * guide, the team's working process — while its stakeholder twin `/about/`
 * and the stylesheet both share under `/guides/` are not.
 *
 * `/recaps/*` (added 2026-09-22) is blocked for the same reason as
 * `/contributing/`, only harder: a review recap is an INTERNAL note. It names
 * colleagues, records what we are not yet confident enough to test, and says
 * what we have not yet told engineering. The stakeholder site is exactly the
 * audience it is written about. It lives under `public/` only so a branch
 * deploy can serve it to the team — the full site — which is the same job
 * `/contributing/` does.
 */
const BLOCKED = ['/prototypes/*', '/testing/*', '/ngat-admin/*', '/archive/*', '/qa/*', '/contributing/*', '/recaps/*']

/**
 * What the ONE SITE still 404s, on its PRODUCTION deploy only — 2026-10-15,
 * Jillienne's decision when the public site was retired: the review recaps.
 * A recap names colleagues and records what we have not yet shown
 * engineering, and the stakeholders now open the same site the team does. It
 * stays under `public/` so a BRANCH build can serve it to the team — which is
 * why this is keyed on Netlify's `CONTEXT` rather than on the mode: a branch
 * deploy of the full build writes nothing. The contributing guide is NOT here:
 * it is the process manual, and hiding it from the one site would hide it
 * from the designers it is for.
 */
const PRODUCTION_ONLY = ['/recaps/*']

const rules = TRIMMED.has(mode) ? BLOCKED : context === 'production' ? PRODUCTION_ONLY : []

if (rules.length === 0) {
  console.log(`[public-redirects] ${mode} build, ${context || 'local'} — no _redirects written`)
  process.exit(0)
}

const lines = [
  '# GENERATED by scripts/public-redirects.mjs. Do not edit.',
  '# These rules run before netlify.toml, so they beat its /* SPA fallback.',
  // `404!` not `404`: without the `!` (force) Netlify IGNORES a rule whenever a
  // real file exists at the path — and one always does here, which is the point.
  // Shipped without it for one deploy; the prototypes stayed reachable.
  ...rules.map((from) => `${from}  /404.html  404!`),
  '',
]

mkdirSync(dist, { recursive: true })
writeFileSync(join(dist, '_redirects'), lines.join('\n'))
console.log(`[public-redirects] ${mode} build, ${context || 'local'} — wrote dist/_redirects (${rules.length} rules)`)
