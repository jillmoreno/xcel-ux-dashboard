# XCEL UX Dashboard

**One app with two front doors.** `/` is the **Hub** — six pages where the
team's work is seen. `/dashboard-rebrand` is the XCEL LMS product itself, which
is what most design work actually changes. They share one Vite build, one
token file, one icon registry and one `AccountContext`, which is why they are
one repo rather than two.

**This is the simple Hub (2026-11-21).** The advanced Hub — fourteen sections,
stage and main, owners, scopes, a derived branch list, a release inbox, a To
Do Board, QA Notes — is whole on the **`hub-advanced`** branch (tag
`hub-advanced-2026-11-21`, commit `7b83b7a5`), with its CLAUDE.md, docs,
guides and routines. The Archive page lists what was removed and how to bring
it back. `docs/simple-hub.md` is the step-by-step record of the strip.

## The Hub, in one table

| Page | What it is | Who adds to it |
|---|---|---|
| **Design** | links to the work — branch builds, Figma files, documents, decks | anyone, on the page: Add link, paste, title, note, your name |
| **Research** | the studies and findings behind the designs, grouped by project | anyone, the same way |
| **PRDs** | the requirements documents the designs answer | anyone, the same way |
| **Development** | the dev handoffs — one file per feature in `src/data/handoffs/` | Claude, via "write dev handoff notes", on the designer's branch |
| **Done** | handoffs for finished work | whoever marks one done |
| **Archive** | links archived off the three boards, and things removed from the project with the re-wire | the row's ⋯ → Archive; `ARCHIVED_ITEMS` in code |

Two quiet links at the foot of the rail: **Guide** (`/contributing/`, the one
guide) and **Demo build** (`/dashboard-rebrand?demo=1&journey=full`, the
product on `main`). Neither is a section. The Design board's section id is
still `demo` — it was Refinement until 2026-11-21; the id, store and endpoint
did not change.

The three boards are one component (`LinkBoardPanel` in `LinksPanel.tsx`),
one server module (`netlify/lib/linkBoard.ts`), three Blobs stores
(`demos`, `research`, `prds`). A row is title · link · note · who · Updated;
the roster is `DESIGNERS` in `linkStore.ts` (Jill · Anjani · Eric · Afsana).

## The three sentences

| Said | Routine | Who | Does |
|---|---|---|---|
| **"Share my work"** | `share-my-work` (aliases `share-branch`, `promote-to-refinement`) | anyone | cuts a branch if you are on main (named `work/<you>/<date>`), checks, commits with a subject it writes, pushes, hands back ONE line: the branch link to paste on Design. Zero questions. |
| **"Write dev handoff notes for …"** | `dev-handoff-notes` | anyone | reads the branch, asks six short questions, writes `src/data/handoffs/<id>.ts` — the Development row — and puts the Design link on its Links row |
| **"Ship …"** | `ship` (aliases `release`, `ship-to-main`) | Jillienne only | the branch you are on, a name, or a Design link; rebase; the FLAG REVIEW; build + tests; fast-forward merge into main; push; check the deploy |

Two more routines stay: `archive-a-feature` (unwire, keep the file, write the
Archive row) and `freeze-for-testing` (the moderated user-test site; nothing
to do with the Hub).

**The flag review, inside Ship.** Every default the branch would change on
`main` (`FeatureFlagContext.tsx` and `dashboardVersions.ts`), grouped by the
component each flag gates, with every component carrying MORE THAN ONE flag
called out first. Yes or no per flag. Then, per decided flag: retire it? —
call sites take the winning path, the flag leaves `FEATURE_FLAGS` and
`REBRAND_FLAGS`, the losing file stays with an Archive row.

**Main is locked.** On GitHub, `main` requires Jillienne's review and refuses
a direct push from anyone else (`.github/CODEOWNERS`, branch protection). In
Claude, `.claude/hooks/protect-main.mjs` refuses the same for anyone but her,
in plain words. `MainProtection.test.ts` pins both. There is no stage.

## The one rule for product work: switches

A React surface of the product goes in `src/` **behind a feature flag whose
default is ON on your branch**. On main the flag is off until Ship decides
it. **Changing something that already exists?** Copy it to a sibling
(`StudyPaceTile.tsx` stays, `StudyPaceTileV2.tsx` is yours) and let the flag
choose at the call site; the original is never touched, so two designers
cannot collide. Mark a flag `surface: 'design'` to put it on the design
controls bar; the demo controls bar is Jillienne's.

A hand-authored HTML page goes in `public/demos/`, reachable on the branch
build. `public/prototypes/` holds the finished explorations the smoke suites
test — the documents are kept and served; their Hub rows are gone.

## What you do not need to touch

The Hub's own machinery. Asking Claude to edit one of these is refused with a
message naming the file (`.claude/hooks/protect-framework.mjs`, wired in
`.claude/settings.json`); Jillienne is exempt (`git config user.email`).
`FrameworkProtection.test.ts` reads THIS TABLE back out of this file, so the
two cannot drift.

| File | What it is |
|---|---|
| `src/pages/UxDashboardPage.tsx` | the Hub page — sections, nav, the rail, the Archive page |
| `src/data/prototypeFeatures.ts` | the project rows — EXCEPT dev handoffs, which are the designers' own, one file each in `src/data/handoffs/` (unprotected) |
| `src/data/archivedItems.ts` | the Archive table |
| `src/data/gatewayMode.ts`, `src/data/deployContext.ts` | the per-build switches (the user-test build; branch deploy vs production) |
| `netlify.toml`, `scripts/public-redirects.mjs` | the edge rules |
| `netlify/functions/`, `netlify/lib/` | the three boards' endpoints, row-archive, compare-notes |
| `src/components/prototype/DemoControlsBar.tsx`, `src/components/prototype/DemoBar.tsx`, `src/components/prototype/demoBarUtil.ts` | the demo controls bar — which controls every reviewer sees |
| `src/components/prototype/DesignControlsBar.tsx` | the design controls bar — mark your flag `surface: 'design'` instead of editing it |
| `src/components/layout/AdminToolsMenu.tsx` | the robot — the UI/UX Demo Tools menu |
| `.claude/hooks/`, `.claude/settings.json`, `.github/` | the two guards and the CODEOWNERS file behind main's lock |
| `.claude/skills/` | the routines — `share-my-work`, `ship`, `dev-handoff-notes`, `archive-a-feature`, `freeze-for-testing`, and the alias names. Run them; don't edit them. |
| `public/contributing/` | the guide (regenerate the PDF if you edit it) |

## Stack

| Dimension | Value |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Icons | Font Awesome 7 Pro Light — self-hosted SVGs in `src/icons/` via `vite-plugin-svgr` |
| Tokens | `src/styles/tokens.css` (`@theme inline`) |
| Server code | Netlify functions over Netlify Blobs — the three boards, row-archive, compare-notes |
| Tests | Vitest + @testing-library/react |

## Conventions

- Reference tokens via CSS variables — never raw hex / px / font-family.
- Use the icon registry at `@/icons`. Don't install `lucide-react` or
  `@fortawesome/*`.
- Segmented status filters use the shared [`PillTabs`](src/components/ui/PillTabs.tsx),
  and **no per-pill counts** — show the total beside the strip.
- The dark `PrototypeBar` is theme-stable: it must look identical in light and
  dark, which is why `tokens.css` re-pins `neutral-800` / `neutral-50` inside
  `[data-theme='dark'] .cre-prototype-bar`.
- **The archive convention.** Don't delete outright. Unwire it, keep the file,
  add an `ARCHIVED_ITEMS` row whose `restoreNote` names the files and call
  sites. Say `/archive-a-feature`. `ArchiveConvention.test.ts` enforces that
  every `restoreNote` and `location` name a place you can go. (The 2026-11-21
  strip is the one exception: the files are on `hub-advanced`, and the rows
  say so.)

## Verifying a change

```bash
npx tsc -b --noEmit     # the real guardrail — `Brand` is a one-member union
npx vitest run          # ~3,000 tests
npm run smoke           # the jsdom suites over public/prototypes/
npm run build           # what Netlify runs — Ship's gate
```

**`npm test` does NOT run the smoke suites.** `npm run lint` is not a gate
(hundreds of problems on main); lint the files you changed. Guide edited?
`weasyprint public/contributing/index.html public/contributing/contributing.pdf`.

## Where the detail lives

| File | What is in it |
|---|---|
| [`docs/product-app.md`](docs/product-app.md) | **Most design work needs this one.** The dashboard versions, Readiness, the Study Journey, notifications, the flag catalog — the product's own history, unchanged by the Hub strip |
| [`docs/gateway.md`](docs/gateway.md) | The Hub: the six pages, the boards, the one site, branch deploys |
| [`docs/simple-hub.md`](docs/simple-hub.md) | The 2026-11-21 strip, step by step, with what changed in each |
| [`docs/prototypes.md`](docs/prototypes.md) | The standalone HTML explorations and what each argues |
| [`docs/admin-tool.md`](docs/admin-tool.md) | The PartnerHub fork answering the admin flows |
| [`docs/testing.md`](docs/testing.md) | What each suite pins, and the two fragile-test rules |

## Siblings

Two siblings carry the same gateway code — `../jill-dashboard-ux-designs`
(the Common LMS) and `../partnerhub-ux-dashboard`. Both still run the
advanced shape; the sync procedure is the `port-ux-dashboard` skill. Sync
from `hub-advanced` if the target wants the advanced Hub, from `main` for
this one.

## History — what was stripped on 2026-11-21, and why

Jillienne: "completely kill all the over-complicated features for this hub …
the whole hub needs to be stripped down to the most simplistic version. I
need a designer to be able to share links, I need them to be able to share
from within the repo or without. I need to know if these links are Design,
Research or PRD type links." And for the designer: "a designer that is not
great at using Claude" should be able to say one sentence.

What went, each with an Archive row and whole on `hub-advanced`:

- **Prototypes** and its Main · Stage switch, scopes, owners, the retired-link
  screen; **Design (derived)** — the branch list read from Netlify and git;
  **Release** — the stage inbox and `.hub/decided/`; **Resources**;
  **Explorations** (the documents stay); **QA Notes** with its product-side
  capture and `public/qa/`; **To Do Board**; **Hub Resources**.
- **Stage** itself: the `stage` branch is untouched on GitHub and nothing
  pushes to it. `share-to-stage`, `decide-defaults` (its flag questions live
  on inside Ship), `retire-from-refinement`, `share-component`,
  `port-prototype` and three old aliases.
- **Refinement** became **Design**: same board, same rows, trimmed to
  Research's shape (no product tag, no feature grouping, no Replaces, compact
  row). Hide became Archive, and archived rows list on the Archive page.
- **Cody** came off the roster. The Designer Workflow and About guides.
- The Simple/Advanced toggle proposed the same morning — rejected the same
  day: "I want to not have the toggle back to advanced mode at all."

What the strip found: Research was silently writing a supersession its hidden
Replaces control could not clear (fixed, step 2). Everything before this
date — the one-row rule, the vocabulary, stage, the derived Design, the
2026-10-15 one-site decision, the 2026-09-08 migration — is in
`hub-advanced`'s CLAUDE.md, where the reasons are kept with their dates.
