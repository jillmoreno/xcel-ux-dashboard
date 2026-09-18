# XCEL — UX Dashboard

The front door for XCEL LMS design work: a left-nav rail over a list of
projects, each opening a walkthrough gateway with dev-handoff notes and a live
preview. Ported from the PartnerHub UX Dashboard (itself ported from Common
LMS), so all three share the same UI.

XCEL LMS is the FinServ (Insurance / Mortgage / Banking) next-generation learner
platform, answering the FinServ *Learner and Admin Wireframe Brief*.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5200
```

## Ports — one per dashboard, and they must differ

| Port | Project |
|---|---|
| 5180 | Common LMS (`jill-dashboard-ux-designs`) |
| 5190 | PartnerHub (`partnerhub-ux-dashboard`) |
| 5200 | XCEL (this repo) |

All three set `strictPort`, so two sharing a port means the second one dies with
`EADDRINUSE` while the browser keeps serving the first. Because the dashboards
look alike, that presents as *"the new dashboard is showing the old project"* —
not as a port error. Don't align them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5200 |
| `npm run build` | `tsc -b && vite build` → `dist/`, then the `postbuild` hook (`scripts/public-redirects.mjs`, a no-op on the full build) |
| `npm run build:public` | The same build with `VITE_GATEWAY_MODE=public` — what the stakeholder site ships. Writes `dist/_redirects` |
| `npm run typecheck` | Types only, no emit |
| `npm test` | Vitest — the dashboard smoke test |
| `npm run smoke` | The eight jsdom suites over the standalone prototypes (`npm test` does NOT run these) |
| `npm run lint` | ESLint |

## Two Netlify sites, one repo

The same `main` branch deploys to **two** Netlify projects. One push builds both.

| Site | Who it is for | Shows | Build env vars |
|---|---|---|---|
| **Public** — the existing site, the URL stakeholders already have | anyone with the link | Demo · Links · Research **only**. The gated sections are absent, not locked: no nav rows, no password prompt, deep links land on Demo, and `/prototypes/*` 404s | `VITE_GATEWAY_MODE = public` |
| **Full** — a new site | Jillienne and the team | everything, locked and unlocked, exactly as before | `BLOBS_SITE_ID` + `BLOBS_TOKEN` (see below) |

Nothing is configured per site in the repo — `netlify.toml` and the code are
identical for both. The switch is `src/data/gatewayMode.ts`, read at build
time, so the ONLY per-site difference is what each project sets in
**Project configuration → Environment variables**.

### Setting it up (once)

1. **Confirm the existing site is Git-connected.** Netlify → the existing
   project → *Project configuration → Build & deploy → Continuous deployment*.
   It should show this GitHub repo and branch `main`. If it instead says the
   site is deployed manually / via CLI, link it there ("Link repository") — the
   whole point of the arrangement is that both sites build from a push.
2. **On the existing (public) site**, add the env var `VITE_GATEWAY_MODE` =
   `public` (scope: Builds). Trigger a deploy. The site now shows only Demo,
   Links and Research. Note its **Project ID** (*Project configuration →
   General → Project information*) for step 4.
3. **Create the full site**: *Add new project → Import an existing project →
   GitHub → this repo*, branch `main`. Netlify reads `netlify.toml`, so build
   command and publish directory are already right; set **no**
   `VITE_GATEWAY_MODE`. Put the Netlify site password on this one (*Project
   configuration → Access & security → Visitor access*) — it is the site with
   everything on it.
4. **Point the full site at the shared data.** Netlify Blobs are per site, so
   without this the new site would have empty Links, QA Notes and captures.
   On the FULL site set both:
   - `BLOBS_SITE_ID` — the public site's Project ID from step 2
   - `BLOBS_TOKEN` — a personal access token (*User settings → Applications →
     Personal access tokens → New access token*). Store it as a **secret**.

   Both or neither: the functions refuse to start with only one, rather than
   silently opening a private store. The public site sets neither and keeps
   using its own store as before — it OWNS the data.
5. **Trigger a deploy on the full site** and check the Links page shows the
   same links as the public one. If Links shows the "endpoint unreachable"
   state, the token or ID is wrong — the function log will say.

After that, `git push` is the whole workflow. To preview what stakeholders
will see locally: `npm run build:public && npx vite preview`.

**What is and is not hidden on the public build.** Hidden: the eight gated
sections and their rows, `/prototype/:id` for any non-Demo row (and its
handoff detail), `/qa-notes`, and the static folders `/prototypes/`,
`/testing/`, `/ngat-admin/`, `/archive/`, `/qa/` (edge 404, via the generated
`_redirects`). Reachable: `/`, `/links`, `/research-rationale`, and the whole
product app (`/dashboard-rebrand` and the ~28 routes under it), because the
Demo row IS the product app and it links between its own routes. If a product
route should not be public, that is a separate decision.

## The prototypes live here

**Every claim in this section was false until 2026-09-03**, so if you remember it
saying something else, that is why. It said `PROTOTYPE_BASE` pointed at
`https://ux-lms-dashboard.netlify.app/prototypes`, that the pages were authored in
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/`, and that
`./deploy-xcel-prototypes.sh` published them. None of that holds now.

`PROTOTYPE_BASE` is **`'/prototypes'`** — same-origin, served from this repo's own
[`public/prototypes/`](public/prototypes/). The cross-origin pointer was abandoned
because both Netlify sites are password-protected: an iframe of the other origin
needed a third-party session cookie, which Safari blocks and Chrome restricts, so
reviewers got a password prompt inside every preview thumbnail. A password on one
site never protected pages served from the other, so nothing was lost.

**The pages in `public/prototypes/` are the sources — edit them directly.**
There is no source/served split, no copy step and no deploy script. They and
their smoke suites moved here from the Common LMS repo, which no longer carries
any XCEL rows, files or tooling.

Run the page suites with **`npm run smoke`** — five jsdom scripts in
[`smoke/`](smoke/), 252 assertions. They are plain node, not vitest, so
`npm test` does not run them; run both.

See CLAUDE.md → "The six prototype pages" for what each page argues and the
findings behind them.

**What this costs.** Two ways it breaks with no error in this app:

1. that origin changes — the site is renamed, or moved between Netlify teams
2. that site starts sending `X-Frame-Options` or a `frame-ancestors` CSP, which
   would blank every preview iframe here

Both are a one-line fix: change the constant, or copy the files into
`public/prototypes/` and point at `'/prototypes'`.

**TODO(2026-09-04):** revisit moving the five files, their four smoke tests and
the deploy script into this repo as their real home, which removes the
cross-repo dependency. Scheduled for review end of week.

## The four rows also still exist in the Common LMS dashboard

Deliberately, for now. They were left in place rather than moved, so there are
currently **two front doors to the same work**. Until that's decided, an edit to
a row's title, blurb or status has to be made in both files.

## Sections

Same set as the sibling dashboards: Demo · Research, then a gated **UX & DEV
ACCESS** group — Design · Exploration · Sandbox · Development · Done · Archive ·
QA Notes · To Do. One password (`Password123` by default) opens the whole group.

Two are empty on purpose right now:

- **Demo** — every XCEL artifact is still in design, so nothing is
  presentation-ready. Consequence worth knowing: a viewer without the password
  sees an empty front page. If you want the Desktop Platform to greet people,
  change its `devStatus` to `done` or drop it and set `category: 'demo'`.
- **Research** — XCEL has no per-decision log. Its reasoning is inside the
  wireframes page and the exam spec. `ResearchPanel` says so and names what
  would fill it.

All four rows land in **Design**, because `devStatus: 'in-design'` outranks their
`category: 'sandbox'`.

## QA Notes and To Do

Both write through Netlify functions backed by Netlify Blobs
(`netlify/functions/`). Blobs needs no setup — a store is created on first
write. Locally, run `netlify dev` instead of `npm run dev` if you need them to
persist.

Note Blobs data is **per-site**, so notes written on one deploy of this repo are
invisible on another.

## Fonts

`public/fonts/brandon-grotesque/` carries the same licensed OTFs the sibling
repos self-host, so the dashboard chrome matches. **Confirm the webfont licence
with the brand team before this is publicly reachable.**

See [CLAUDE.md](CLAUDE.md) for architecture and the full port notes.
