# XCEL — UX Dashboard

The **Hub** for XCEL LMS design work — six pages where the team's work is
seen — and the XCEL product prototype it points at (`/dashboard-rebrand`).
One Vite app, one Netlify site, one password.

XCEL LMS is the FinServ (Insurance / Mortgage / Banking) next-generation
learner platform, answering the FinServ *Learner and Admin Wireframe Brief*.

**The simple Hub (2026-11-21).** The advanced Hub — stage and main, owners,
a derived branch list, a release inbox, a To Do Board, QA Notes — is whole on
the `hub-advanced` branch. [CLAUDE.md](CLAUDE.md) is the map;
[`docs/simple-hub.md`](docs/simple-hub.md) is the record of the strip.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5200 — the app, no boards
```

The three boards (Design, Research, PRDs) author into Netlify Blobs through
Netlify functions, which plain Vite does not serve. To use them locally run
the `xcel-dashboard-netlify` entry in `.claude/launch.json` (`netlify dev` on
:8899 with a local store), or open the deployed site. Designers never run the
site locally: the branch build is the preview.

## Ports — one per dashboard, and they must differ

| Port | Project |
|---|---|
| 5180 | Common LMS (`jill-dashboard-ux-designs`) |
| 5190 | PartnerHub (`partnerhub-ux-dashboard`) |
| 5200 | XCEL (this repo) |

All three set `strictPort`, so two sharing a port means the second one dies
with `EADDRINUSE` while the browser keeps serving the first. Because the
dashboards look alike, that presents as *"the new dashboard is showing the old
project"* — not as a port error. Don't align them.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on :5200 |
| `npm run build` | `tsc -b && vite build` → `dist/`, then `scripts/public-redirects.mjs` (edge 404s on the production build) |
| `npm run typecheck` | Types only, no emit |
| `npm test` | Vitest — ~3,000 tests, including the Hub smoke test |
| `npm run smoke` | The jsdom suites over the standalone prototypes (`npm test` does NOT run these) |
| `npm run lint` | ESLint — not a gate; lint the files you changed |

## The one site

`main` deploys to `ux-design-xceldashboard.netlify.app`, behind the site
password. **Branch deploys are on**, so every pushed branch builds at
`<branch-with-dashes>--ux-design-xceldashboard.netlify.app` — that is a
designer's preview and the link they paste on Design. The user-test site is
separate and frozen by `freeze-for-testing`.

Env vars on the site: `BLOBS_SITE_ID` + `BLOBS_TOKEN` (both or neither) point
the functions at the shared store; nothing else is needed since 2026-11-21.

## The Hub's pages

| Page | What goes there | Who adds |
|---|---|---|
| Design | links to the work — branch builds, Figma files, documents | anyone, on the page |
| Research | studies and findings, by project | anyone |
| PRDs | the requirements documents | anyone |
| Development | dev handoffs, one file per feature in `src/data/handoffs/` | Claude, from a designer's branch |
| Done | finished handoffs | whoever marks one done |
| Archive | archived links, and removed features with their re-wire | the row menu; `src/data/archivedItems.ts` |

Guide and Demo build are links at the foot of the rail, not pages.

## Contributing

One guide, `public/contributing/index.html`, served at `/contributing/` and
from the Guide link, with its PDF beside it. The short version: the Claude
desktop app with its GitHub connector, and three sentences —

1. **"Share my work."** Branch if needed, checks, commit, push, one link to
   paste on Design. Zero questions.
2. **"Write dev handoff notes for …"** Six short questions, a page on
   Development.
3. **"Ship …"** Jillienne only: the flag review, the checks, a fast-forward
   merge into `main`.

Regenerate the PDF after editing the guide:

```bash
weasyprint public/contributing/index.html public/contributing/contributing.pdf
```

## The prototypes live here

`public/prototypes/` holds the hand-authored HTML explorations — the sources,
edited directly, no copy step. Their Hub rows went with Explorations on
2026-11-21; the documents and their smoke suites stay. `npm run smoke` runs
the suites. See [`docs/prototypes.md`](docs/prototypes.md) for what each page
argues.

## Fonts

`public/fonts/brandon-grotesque/` carries the same licensed OTFs the sibling
repos self-host, so the dashboard chrome matches. **Confirm the webfont licence
with the brand team before this is publicly reachable.**
