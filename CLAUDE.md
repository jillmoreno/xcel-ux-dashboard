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

## Prototypes is the source of truth. Refinement is everything else.

**Prototypes holds ONE row PER PRODUCT SURFACE, and every row is the same
build (2026-09-28, restated 2026-10-14).** It answers *what is the product
right now?* for developers and stakeholders. From 2026-09-28 it held exactly
one row, because two rows pointing at two BUILDS of the same thing destroy the
answer — from then on everyone has to ask which one is real.

What changed on 2026-10-14 is the shape of the product, not the rule. A
learner's journey has three doors — how they get **in** (invite and purchase),
what they **land in** (the dashboard, end to end), and where they **study**
(Compass) — and each is its own source of truth for a different question. The
section holds one row per door, declared in `PROTOTYPE_SCOPES` in
`prototypeFeatures.ts`, and the guarantee the one-row rule gave is kept in a
stricter mechanical form that `UxDashboard.smoke.test.tsx` pins: **every row
that opens is `main`'s build at `?demo=1`**, entered through one of the product
app's doors (`/dashboard-rebrand`, `/end-to-end-demo`) — same origin, never a
branch URL, never an `?ff=` pin, never a pinned `version=`, never an HTML
document (a document is an exploration, not `main`'s build of the product). A `coming-soon` row is a
**placeholder**: drawn disabled with a "Coming soon" tag, nothing to click —
either nothing is built yet (the Admin row) or the surface is **held back**
with its route kept on record while its owner decides what it carries (the
end-to-end row, 2026-10-14; releasing it is `status: 'ready'`). Five rows, one
build, one committed baseline.

So when you want several things visible at once FOR THE SAME SURFACE — two
pacing treatments, a component's variants, a branch under discussion — **they
go in Refinement**, which takes any number of rows, is authored in the browser
(no code, no commit, no deploy), and is **visible to stakeholders too** —
there is one site since 2026-10-15, and they are given its link.

| Section | Means | Rows | Lives in |
|---|---|---|---|
| **Prototypes** | this IS the product | one per surface, all on `main` | flag defaults on `main` |
| **Refinement** | under discussion | as many as you like | Netlify Blobs, authored on the page |

**ONE SITE since 2026-10-15.** The demo site — a second Netlify project that
trimmed the gateway for stakeholders — is retired, with the Refinement
public toggle and the `maturity` gate that only existed to feed it. The Hub
is behind one password; stakeholders are given its link and see everything
the team sees, except the review recaps, which the production deploy 404s
at the edge. The three `archivedItems.ts` rows dated 2026-10-15 say how it
was wired. The user-test build is unaffected.

Five rows as of the evening of 2026-10-14, the product first and then the
doors around it: **End-to-End User Experience (Invite, Atlas, Compass)** — always the
first row — then **Invite & Purchase** (`/end-to-end-demo`, Eric's End-to-End
Demo — the Invited Product Detail page, its checkout, then the dashboard),
**Atlas Learning — Work in Progress** (the end-to-end's middle: Home and the
learning pages, same build at Home, Eric's), **Compass Learning**, and **Admin
Tool** — a placeholder
until the admin surface is built in React; the PartnerHub-fork exploration's
row is archived (`admin-tool-row`, 2026-10-15) and its document kept. A fifth
is a `PROTOTYPE_SCOPES` decision first and a row second.

**Who promotes, and who merges, are two different columns (2026-10-14).**
Each scope names an `owner`, and the owner both decides what that surface
should be and runs `promote-to-prototype` for it on their own branch: Anjani
for Compass, Eric for Atlas Learning, Afsana and Eric for Invite & Purchase,
Cody for Admin, Jillienne for end to end. A promotion is a commit of defaults on a branch and
reaches no stakeholder by itself. **Only Jillienne merges** — `ship-to-main`,
which refuses a branch with a group its owner has not decided — **and only she
sets the default dashboard version.** That is the lock, for every scope.
**Anyone promotes to Refinement**, and that door is unchanged —
`promote-to-refinement` now reads the branch and tags the row's product
(Compass files → Compass), which is the tag the Compass row later absorbs.

Two things that follow, and both have bitten:

- **A Refinement row pinned with `?ff=` tracks `main`,** so it goes stale
  silently when the component changes underneath — no error, it just quietly
  becomes something else. When something must NOT move (a user test, a
  sign-off), that is `promote-to-testing`'s frozen branch, not a Refinement row.
- **Refinement rows are not in git,** so there is no record of what was shown
  when. It is a working surface, not a decision log — the decisions log on a dev
  handoff is where a decision gets recorded.

The ways in are already built: `promote-to-refinement` (a branch),
`promote-component` (one widget's variants), `promote-to-prototype` (moving
something into the source of truth). There is deliberately no "create a second
prototype" skill: a new SCOPE is a decision Jillienne makes in
`PROTOTYPE_SCOPES`, and a second row for an existing scope is a Refinement
job.

**The way OUT is `retire-from-refinement`** (2026-09-29), and it runs both when
the work shipped and when it did not. It exists because of the second bullet
above: a row's build lives on a Netlify BRANCH deploy, so deleting the branch
deletes the only viewable copy of the work, and "we tried this and decided not
to" otherwise leaves no trace anywhere. It reads the row, makes the
keep-or-delete-the-branch call explicit, writes the Archive row from what the
reviewer actually wrote, and only then removes the row. It does NOT move work
into Explorations — that section is for documents authored to be kept, and the
skill records why.

**THE DESIGNERS GROUP IS GONE (2026-10-15).** The rail used to end in a
divider under a "Designers" eyebrow holding Design · Exploration · Archive ·
QA Notes behind one (unenforced) gate. One site behind one password needs no
second door, so: **Design is retired** (it listed nothing; the team does not
work in a design/development split), **Exploration is renamed Explorations
and moved up to sit directly under PRDs** — the briefs and the documents
answering them, side by side in the nav — and **Archive and QA Notes sit
under Dev Handoff**, ungated. Ten sections. The two `archivedItems.ts` rows
`design-section` and `designers-gate` say how it was wired.

**Four rows went the same day, after the preview** — `xcel-lms` and
`xcel-admin-tool` from Explorations, and both Development handoffs
(`xcel-course-entry`, `atlas-home-course-card`: "they were not ready"). They
are kept verbatim in `src/data/archivedFeatureRows.ts`, a module nothing
imports, with an `archivedItems.ts` row each; restoring one is a cut-and-paste
back into `PROTOTYPE_FEATURES`. Development lists nothing until the next
`/dev-handoff-notes` row lands.

## Scope — read before adding a route

**CHANGED 2026-09-08. This section used to say "gateway only, four routes".**
It is now three things, and where a new screen belongs depends on which:

| Surface | Lives in | Reached at |
|---|---|---|
| The UX Dashboard gateway | `src/pages/UxDashboardPage.tsx` + friends | `/`, `/prototype/:id`, `/research-rationale`, `/qa-notes`, `/links`, `/prds` (ten sections — Prototypes · Refinement · Research · Resources · PRDs · Explorations · Development · Done · Archive · QA Notes) |
| The XCEL product app | `src/pages/*`, `src/components/*` | `/dashboard-rebrand` + ~28 product routes |
| The standalone prototypes | `public/prototypes/*.html` | `/prototypes/…`, opened in a tab or iframed |

**A new XCEL screen has two homes now, and picking wrong is the mistake this
section exists to prevent.** If it is a REACT surface of the product — a page in
the shell, a panel, a card — it belongs in `src/` as a route. If it is a
hand-authored HTML exploration answering a brief, it belongs in
`public/prototypes/` as a document, and it gets a `PROTOTYPE_FEATURES` row, not
a route — `category: 'exploration'`, no `devStatus`, and it lists in
Explorations, under PRDs in the nav.

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

   **Changing something that already exists?** Don't thread conditionals through
   it. Copy it to a sibling — `StudyPaceTile.tsx` stays, `StudyPaceTileV2.tsx` is
   yours — and let the flag choose between them at the call site.
   `CourseContentV2.tsx` is the worked example. The original is never touched, so
   you cannot conflict with whoever else is editing it. **Fork the layout, import
   the data:** if both versions duplicate the content, the comparison is no longer
   about your change. Say `/promote-component` and it will do this with you.
3. **Check it** — *"Run the type check, the tests and lint."* Add *"and the smoke
   suites"* if you touched `public/prototypes/`.
4. **Publish** — *"Commit everything and push it to `feat/your-thing`."* Netlify
   builds your branch at its own address; that address plus
   `/dashboard-rebrand?demo=1` is the review link.
5. **Share it** — Refinement → Add link on the Hub, or say
   `/promote-to-refinement` and click the link it gives you.

**You never run the site on your own computer.** There is no localhost step; the
branch build IS the preview. Nothing here needs a terminal — every step above is
a sentence you say to Claude with the project folder connected.

The full version, with pictures and the failure modes, is the **Contributing
guide**: `/contributing/` on the Hub, or `public/contributing/index.html`.

## What you do not need to touch

These are the dashboard's own machinery. A design change should not reach them,
and a pull request that edits them is usually a sign something was misunderstood.

**This is enforced now, not just advised (2026-09-24).** Asking Claude to edit
one of these files is refused, with a message naming the file and what to do
instead — `.claude/hooks/protect-framework.mjs`, wired in `.claude/settings.json`.
Jillienne is exempt (it checks `git config user.email`), so nothing about her own
work changes. `FrameworkProtection.test.ts` is the backstop for the edits a hook
cannot see — a hand edit in an IDE, or `sed` through the shell — and it fails the
suite you run before pushing, naming the files.

⚠ It is a guardrail, not a lock: the email check is one command to change. It
exists to stop someone wandering into the wrong file, not to defend the repo.
It also only intercepts **Claude's** edits — a hand edit in an IDE reaches the
file, and `FrameworkProtection.test.ts` is what catches that, when the suite is
run before pushing.

⚠ **THE DEMO CONTROLS JOINED THE TABLE ON 2026-10-05**, after two designers
edited the bar in the same week and collided: one adding three controls for
their own dashboard version, the other restructuring which controls the bar
carries. Both changes were reasonable; the merge was not. The bar is SHARED
CHROME — its control list says what the PRODUCT demos, not what one exploration
is exploring.

### The two bars, and which one is yours

| Bar | Rule | Shows | Who changes it |
|---|---|---|---|
| **Demo controls** | amber | how the product behaves for different LEARNERS — progress, tier, education | Jillienne only |
| **Design controls** | light cyan | the decisions open inside YOUR exploration — fonts, brand colour, layout axes | any designer |

**To put a control on the DESIGN bar you do not edit the bar.** Mark your flag
`surface: 'design'` in the flag catalog and it appears, scoped to the dashboard
VERSION you are on — a radiogroup if it has `variants`, an on/off if it does
not. Name `versions: [...]` too when you have more than one version and the
control belongs to only one of them; leave it off and the control follows you to
every version you own.

⚠ **THE DESIGN BAR STARTS HIDDEN, behind the robot's dropdown**, and anyone
on the Hub can open it (one site since 2026-10-15; until then it was the
design site's alone). A design decision worth putting in front of a
stakeholder by default belongs on the DEMO bar instead — and that one is
Jillienne's.

`FeatureFlagPanel.tsx` is deliberately NOT protected either: adding your flag
keys to `REBRAND_FLAGS` is something you must be able to do, or your flags are
reachable only by hand-editing `?ff=`.
The list of protected paths is THIS TABLE — a test reads it back out of this
file, so the two cannot drift apart.

| File | What it is |
|---|---|
| `src/pages/UxDashboardPage.tsx` | the gateway page — sections, nav, the rail |
| `src/data/prototypeFeatures.ts` | the project rows and where each one points |
| `src/data/archivedItems.ts` | the Archive table |
| `src/data/gatewayMode.ts`, `src/data/deployContext.ts` | the per-site and per-context build switches |
| `netlify.toml`, `scripts/public-redirects.mjs` | the edge rules, and how branch builds differ from production |
| `netlify/functions/`, `netlify/lib/` | the Refinement / Links / QA Notes endpoints |
| `src/components/prototype/DemoControlsBar.tsx`, `src/components/prototype/DemoBar.tsx`, `src/components/prototype/demoBarUtil.ts` | the demo controls bar — which controls every reviewer sees |
| `src/components/prototype/DesignControlsBar.tsx` | the design controls bar — you do not edit it to get a control on it (see below) |
| `src/components/layout/AdminToolsMenu.tsx` | the robot — the UI/UX Demo Tools menu |
| `.claude/skills/` | `ship-to-main`, `promote-to-prototype`, `promote-to-refinement`, `promote-component`, `promote-to-testing`, `retire-from-refinement`, `archive-a-feature` and `dev-handoff-notes` — Jillienne's. Run them; don't edit them. |
| `public/contributing/`, `public/about/` | the two guides (regenerate the PDFs if you do edit them) |

## Stack

| Dimension | Value |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Icons | Font Awesome 7 Pro Light — self-hosted SVGs in `src/icons/` via `vite-plugin-svgr` |
| Tokens | `src/styles/tokens.css` (`@theme inline`) |
| Server code | Netlify functions over Netlify Blobs — QA Notes + captures, and the four link boards (Links, Refinement, Research, PRDs) — plus the read-only branch list |
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

Say **`/archive-a-feature`** and it walks the whole thing: finding every place
the feature is wired (the flag catalog is the one people miss), deciding how far
to unwire, and writing the row. `ArchiveConvention.test.ts` now enforces the
thin bits — every `restoreNote` and `location` must name a place you can go to,
not just describe an intention.


## Verifying a change

```bash
npx tsc -b --noEmit     # the real guardrail — `Brand` is a one-member union,
                        # so a stray brand literal is a compile error
npx vitest run          # ~1,066 tests
npm run smoke           # the jsdom suites over public/prototypes/ — 674 assertions
```

**`npm test` does NOT run the smoke suites.** Run both. If you touched a guide,
regenerate its PDF (`weasyprint public/contributing/index.html
public/contributing/contributing.pdf`) — the tests assert a PDF exists, and
nothing can assert it is current.

## Where the detail lives

| File | What is in it |
|---|---|
| [`docs/product-app.md`](docs/product-app.md) | **Most design work needs this one.** The dashboard versions, Readiness, the Study Journey, notifications, the flag catalog, and the 2026-09-08 migration |
| [`docs/gateway.md`](docs/gateway.md) | The project list at `/` — sections, Refinement, Links, the one Netlify site (and the two it used to be), branch deploys, the guides |
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

