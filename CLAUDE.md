# XCEL UX Dashboard

**One app with two front doors.** `/` is the UX Dashboard gateway — the project
list Jillienne maintains. `/dashboard-rebrand` is the XCEL LMS product itself,
which is what most design work actually changes. They share one Vite build, one
token file, one icon registry and one `AccountContext`, which is why they are one
repo rather than two.

**This file is the map, not the territory.** It was 4,456 lines until
2026-09-21 — every decision this project has made, loaded in full before anyone
asked a question. The detail now lives in `docs/`, one file per surface. Open the
one you are touching; do not read all five.

## Scope — read before adding a route

**CHANGED 2026-09-08. This section used to say "gateway only, four routes".**
It is now three things, and where a new screen belongs depends on which:

| Surface | Lives in | Reached at |
|---|---|---|
| The UX Dashboard gateway | `src/pages/UxDashboardPage.tsx` + friends | `/`, `/prototype/:id`, `/research-rationale`, `/qa-notes`, `/links` |
| The XCEL product app | `src/pages/*`, `src/components/*` | `/dashboard-rebrand` + ~28 product routes |
| The standalone prototypes | `public/prototypes/*.html` | `/prototypes/…`, opened in a tab or iframed |

**A new XCEL screen has two homes now, and picking wrong is the mistake this
section exists to prevent.** If it is a REACT surface of the product — a page in
the shell, a panel, a card — it belongs in `src/` as a route. If it is a
hand-authored HTML exploration answering a brief, it belongs in
`public/prototypes/` as a document, and it gets a `PROTOTYPE_FEATURES` row, not
a route.

The old warning still holds in its narrow form: **do not rebuild one of the six
standalone prototypes as a React route.** That is the "two sources of truth"
failure the previous wording was guarding against, and it is still real. What
changed is that a React product surface is no longer automatically out of
scope — the product IS React here now, exactly as it is in the LMS.


## If you are a designer, this is the whole job

1. **Make a branch** — say to Claude: *"Make a new branch called
   `feat/your-thing` from main and switch to it."* Lowercase, dashes.
2. **Build it.** A React surface of the product goes in `src/`, **behind a
   feature flag whose default is ON on your branch** — that is what makes your
   branch build show your work and what lets Jillienne decide, at merge, whether
   it ships. A hand-authored HTML exploration goes in `public/demos/`.
3. **Check it** — *"Run the type check, the tests and lint."* Add *"and the smoke
   suites"* if you touched `public/prototypes/`.
4. **Publish** — *"Commit everything and push it to `feat/your-thing`."* Netlify
   builds your branch at its own address; that address plus
   `/dashboard-rebrand?demo=1` is the review link.
5. **Share it** — Refinement → Add link on the full site, or say
   `/promote-to-refinement` and click the link it gives you.

**You never run the site on your own computer.** There is no localhost step; the
branch build IS the preview. Nothing here needs a terminal — every step above is
a sentence you say to Claude with the project folder connected.

The full version, with pictures and the failure modes, is the **Contributing
guide**: `/contributing/` on the full site, or `public/contributing/index.html`.

## What you do not need to touch

These are the dashboard's own machinery. A design change should not reach them,
and a pull request that edits them is usually a sign something was misunderstood.

| File | What it is |
|---|---|
| `src/pages/UxDashboardPage.tsx` | the gateway page — sections, nav, the rail |
| `src/data/prototypeFeatures.ts` | the project rows and where each one points |
| `src/data/archivedItems.ts` | the Archive table |
| `src/data/gatewayMode.ts`, `src/data/deployContext.ts` | the per-site and per-context build switches |
| `netlify.toml`, `scripts/public-redirects.mjs` | how the two sites and branch builds differ |
| `netlify/functions/`, `netlify/lib/` | the Refinement / Links / QA Notes endpoints |
| `.claude/skills/` | `promote-to-prototype` and `promote-to-refinement` — Jillienne's |
| `public/contributing/`, `public/about/` | the two guides (regenerate the PDFs if you do edit them) |

## Stack

| Dimension | Value |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Icons | Font Awesome 7 Pro Light — self-hosted SVGs in `src/icons/` via `vite-plugin-svgr` |
| Tokens | `src/styles/tokens.css` (`@theme inline`) |
| Server code | Three Netlify functions over Netlify Blobs — QA Notes + captures, and Links |
| Tests | Vitest + @testing-library/react |


## Conventions

- Reference tokens via CSS variables — never raw hex / px / font-family.
- Use the icon registry at `@/icons`. Don't install `lucide-react` or
  `@fortawesome/*`.
- Segmented status filters use the shared [`PillTabs`](src/components/ui/PillTabs.tsx),
  and **no per-pill counts** — show the total beside the strip.
- The dark `PrototypeBar` is theme-stable: it must look identical in light and
  dark, which is why `tokens.css` re-pins `neutral-800` / `neutral-50` inside
  `[data-theme='dark'] .cre-prototype-bar`. Keep the bar's colours on those two
  tokens or that exemption stops working.

### The archive convention

Don't delete outright. **Unwire** it (pull it from routes, render paths, flags),
**keep the file** in the repo unreferenced, and **add an `ARCHIVED_ITEMS` row**
with a `restoreNote` listing the actual re-wire steps. Bringing something back
should be a re-wire, never a rebuild. `restoreNote` is the field most often
written too thinly — name the files, the call sites, and anything deliberately
*not* restored.


## Verifying a change

```bash
npx tsc -b --noEmit     # the real guardrail — `Brand` is a one-member union,
                        # so a stray brand literal is a compile error
npx vitest run          # ~842 tests
npm run smoke           # the jsdom suites over public/prototypes/ — 537 assertions
```

**`npm test` does NOT run the smoke suites.** Run both. If you touched a guide,
regenerate its PDF (`weasyprint public/contributing/index.html
public/contributing/contributing.pdf`) — the tests assert a PDF exists, and
nothing can assert it is current.

## Where the detail lives

| File | What is in it |
|---|---|
| [`docs/product-app.md`](docs/product-app.md) | **Most design work needs this one.** The dashboard versions, Readiness, the Study Journey, notifications, the flag catalog, and the 2026-09-08 migration |
| [`docs/gateway.md`](docs/gateway.md) | The project list at `/` — sections, Refinement, Links, the two Netlify sites, branch deploys, the guides |
| [`docs/prototypes.md`](docs/prototypes.md) | The standalone HTML explorations and what each argues |
| [`docs/admin-tool.md`](docs/admin-tool.md) | The PartnerHub fork answering the admin flows |
| [`docs/testing.md`](docs/testing.md) | What each suite pins, and the two fragile-test rules |

Older code comments say "see CLAUDE.md" and mean this material — start here and
follow the link.

## Data files

| File | Holds |
|---|---|
| [`src/data/prototypeFeatures.ts`](src/data/prototypeFeatures.ts) | The five XCEL rows + `PROTOTYPE_BASE`. The type block is verbatim from the LMS (so the ported components compile unchanged) plus one added field, `previewUrl`. Rows are ported verbatim from the LMS dashboard, which still has its own copies. |
| [`src/data/archivedItems.ts`](src/data/archivedItems.ts) | The Archive table — two rows as of 2026-09-16 (the Profile page's Motivational Statement card, and the Dashboard MVP version retired by the flag audit). |
| [`src/data/qaNotes.ts`](src/data/qaNotes.ts) | The committed QA seed — empty; findings are authored on the page. |
| [`src/data/nyProducerRequirements.ts`](src/data/nyProducerRequirements.ts) | The New York Insurance Producer licence — the QE Focused version's demo. Sole owner of its INVENTED hour/exam figures, plus `examFactsFor` (the per-state exam facts the Readiness page reads). |

