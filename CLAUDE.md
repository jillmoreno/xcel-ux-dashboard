# XCEL UX Dashboard

XCEL LMS design work: **the product app and the gateway that documents it.**

Two things live here, and it is worth being precise about which is which,
because they arrived eighteen months apart in project time and six days apart in
real time.

**The gateway** (`/`) was ported on 2026-09-02 from the PartnerHub UX Dashboard
— NOT from the Common LMS original — because PartnerHub was already the trimmed
version: slim `AccountContext`, iframe previews instead of the component
registry, the thumbnail fallback fixed, the port moved. That skipped two whole
steps of the port procedure. Port from the most recently ported dashboard, not
the oldest one.

**The product app** arrived on 2026-09-08 from the Common LMS
(`jill-dashboard-ux-designs`), stripped to XCEL alone. See "The 2026-09-08
migration" below — including why the decision recorded four days earlier said
the opposite.

## Stack

| Dimension | Value |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Icons | Font Awesome 7 Pro Light — self-hosted SVGs in `src/icons/` via `vite-plugin-svgr` |
| Tokens | `src/styles/tokens.css` (`@theme inline`) |
| Server code | Two Netlify functions over Netlify Blobs — QA Notes + captures |
| Tests | Vitest + @testing-library/react |

## Scope — read before adding a route

**CHANGED 2026-09-08. This section used to say "gateway only, four routes".**
It is now three things, and where a new screen belongs depends on which:

| Surface | Lives in | Reached at |
|---|---|---|
| The UX Dashboard gateway | `src/pages/UxDashboardPage.tsx` + friends | `/`, `/prototype/:id`, `/research-rationale`, `/qa-notes` |
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

## The home page (`/`)

[`UxDashboardPage.tsx`](src/pages/UxDashboardPage.tsx) — a left nav over a
project list. Unchanged from the LMS original apart from three strings (the
brand sub-line, the Research row label, `RESEARCH_DECISIONS`), so anything the
LMS `CLAUDE.md` says about it holds here.

**Sections.** Two open — Demo · Research — then a divider under a **UX & DEV
ACCESS** eyebrow holding Design · Exploration · Sandbox · Development · Done ·
Archive · QA Notes · To Do. All eight restricted sections share **one gate id**
(`design-and-development`) and therefore one password, so a reviewer types it
once. The password comes from `getPrototypePassword()` — `Password123` unless
overridden. Selecting a locked section opens the modal *over wherever you are*,
so cancelling can't strand you, and a deep link into a gated section is checked
against the **feature's own** section, not the one being viewed — neither a
side-door link nor cancelling reveals a gated spec.

**Which section a row lands in** is `sectionOf()`: `done` outranks everything,
then `devStatus`, then `category` as a fallback. Design and Development are the
only two sections split *by* `devStatus`, so they're the only two its absence can
split wrongly — both render a banner counting the rows placed by that guess.
Author `devStatus` and it stays at zero.

**All five XCEL rows sit in Exploration** (moved there 2026-09-02 from Design).
The same rows are in **Design** over in the LMS dashboard, and that difference is
deliberate rather than drift: there they are five artifacts among many competing
for one designer's attention, so dev-cycle status is the useful axis; here they
*are* the project — an outside product's brief rebuilt on our tokens and
conventions, which is what this section's blurb describes.

Mechanically that means **no `devStatus` on any of them**. `sectionOf` checks it
*before* `category`, so a status added to one of these rows silently pulls it out
of Exploration and into Design — no error, and it reads as the row simply
vanishing from the section. `UxDashboard.smoke.test.tsx` asserts the inverse
("no Exploration or Sandbox row carries a devStatus") so the next person to add
one gets a failing test instead of a disappearing row.

**Appearance** is pinned to the foot of the nav: four themes (Light · Hybrid ·
Dim · Dark) × four palettes (Moss · Ember · Tide · Fern), on independent axes,
persisted to `localStorage` and **local to this page** — it deliberately does not
drag the prototypes dark. Default is Fern · Hybrid. The palettes are `--ux-*`
custom properties on the shell root, so they're independent of the PartnerHub
brand tokens; `ARCHIVE_BRIDGE` re-points the six brand tokens `ArchiveTable`
needs at the palette so it doesn't draw a navy block inside a green page.

Every text element was audited to WCAG AA across all 16 palette × appearance
combinations in the original. **If you add a palette, re-measure** — the note in
the LMS `CLAUDE.md` about each palette's brightest colour being unusable as small
text on a light page is the trap.

## The one deliberate divergence: live previews

`ComponentLivePreview` in
[`PrototypeHandoffDetailPage.tsx`](src/pages/PrototypeHandoffDetailPage.tsx).

In the LMS it is a registry of ~35 `if (componentId === …)` branches, each
rendering a real in-repo React component. That is why the original file is 3,539
lines and why tracing its imports reaches 81,000 lines across 204 files — the
previews *are* the product.

Here the preview is **data**: a `previewUrl` on the handoff component, falling
back to its parent feature's first `pages` entry, rendered as an iframe of the
served file. Add a preview by authoring a field, not by editing this page. The
LMS already used exactly this pattern for its own two HTML prototypes
(`QuestionListPreview`, `NgatAdminPreview`), so this is that generalised — not a
downgrade.

**The original reason for this was "PartnerHub has no such components". That
stopped being true on 2026-09-08** — the product app is in this repo now, so a
component registry is buildable again. It is still not built, and that is a
choice rather than an oversight: the six rows this gateway documents point at
standalone HTML documents, which an iframe renders exactly and a registry cannot
render at all. A registry would earn its place only once a row documents a REACT
surface of the product. If one does, build it for that row — do not convert the
six.

Consequence worth knowing: `stackLogicBelow` / `fullscreenPreview` in that file
are now constants. In the LMS they were long OR-chains of component ids, because
its previews ranged from a 380px rail (fine beside its UX logic in two columns)
to full-page compositions. Every preview here is the same 860px iframe, so there
is nothing left to switch on. They're kept as named constants so the two-column
pairing is one edit away if a narrow preview ever lands.

## Trimmed on the way over — SUPERSEDED 2026-09-08

**This section described the 2026-09-02 gateway port and every line of it is now
out of date.** Kept, struck through, because the reasoning explains why the
files look the way they do rather than what they currently contain.

- ~~**`AccountContext`** — 645 lines → ~150.~~ It is the **full** context again
  (~600 lines), stripped to one brand rather than to one gateway's needs. What
  survived the reversal is the shape of the decision: `Brand` is still a
  one-member union for exactly the reason given here, and `Membership` is still
  the axis the gateway's `FeaturePageLink.membership` uses. Note the two now
  mean different things on the two surfaces — for the gateway it is "the same
  page, two states"; for the product it is real membership, which XCEL does not
  sell (`supportsMembership` is false for it).
- ~~**`FeatureFlagContext`** (2,571 lines) — not ported.~~ Ported. The product
  reads flags heavily; the prediction that it would be needed "if PartnerHub
  grows variants" was right, just for a different reason.
- ~~**`PageShell` / `PlaceholderPage`** — not ported. There are no product
  routes to stub.~~ Ported — there are ~28 product routes now, and several of
  them are `PlaceholderPage` stubs.

## Data files

| File | Holds |
|---|---|
| [`src/data/prototypeFeatures.ts`](src/data/prototypeFeatures.ts) | The five XCEL rows + `PROTOTYPE_BASE`. The type block is verbatim from the LMS (so the ported components compile unchanged) plus one added field, `previewUrl`. Rows are ported verbatim from the LMS dashboard, which still has its own copies. |
| [`src/data/archivedItems.ts`](src/data/archivedItems.ts) | The Archive table — empty; XCEL has removed nothing yet. |
| [`src/data/qaNotes.ts`](src/data/qaNotes.ts) | The committed QA seed — empty; findings are authored on the page. |

### The archive convention

Don't delete outright. **Unwire** it (pull it from routes, render paths, flags),
**keep the file** in the repo unreferenced, and **add an `ARCHIVED_ITEMS` row**
with a `restoreNote` listing the actual re-wire steps. Bringing something back
should be a re-wire, never a rebuild. `restoreNote` is the field most often
written too thinly — name the files, the call sites, and anything deliberately
*not* restored.

### Row thumbnails — one row now needs one

The sibling PartnerHub dashboard authors a `thumbnail` on every row for a
performance reason: nine of its ten rows preview the same 857KB single-file app,
so a section booted several copies of it just to draw its list.

XCEL used not to have that problem — five rows, five documents, 9–111KB each, so
the live scaled iframe was cheap and could not go stale. **`xcel-admin-tool`
broke that condition.** It is a fork of the PartnerHub app and it is ~910KB, so
opening Exploration now boots it in a scaled iframe to draw one list row. That
row wants a real capture; the other five are still fine unset.

Shoot it on the roster with the **Who is stuck** preset active — that is the
state the whole argument rests on.

If you do add them: **name the files by prototype and state, not by feature id**,
and note that `FeaturePreviewThumb` falls back to the live frame when a PNG is
missing (an `onError` swap added during the PartnerHub port — the Common LMS docs
claim this behaviour but nothing there implements it). That fallback is what
lets paths be authored before the screenshots exist, and makes deleting a PNG a
safe way to retire it.

### The cross-repo dependency — resolved, and how it used to rot

**Corrected 2026-09-02:** this section used to say `PROTOTYPE_BASE` points at
`https://ux-lms-dashboard.netlify.app/prototypes`. It does not, and had not for a
while — it is `'/prototypes'`, same-origin, served from this repo's own
`public/prototypes/`. The comment block at the top of `prototypeFeatures.ts`
explains why the pointer was abandoned: both sites sit behind Netlify password
protection, so an iframe of the other origin needed a third-party cookie, and
reviewers got a password prompt inside every thumbnail. The smoke test asserts
the same-origin shape (`/^\/prototypes\/[\w.-]+$/`) and that every file exists in
`public/`, so a careless edit fails there.

**RESOLVED 2026-09-03 — these files are no longer copies.** This section used
to say `public/prototypes/*.html` were published from
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/` by
`./deploy-xcel-prototypes.sh`, and carried a `TODO(2026-09-04)` to move them.
That move is done: the sources and the five smoke suites are in THIS repo, the
XCEL rows and the deploy script were removed from that one, and there is no
mirror to keep in step. See "The six prototype pages" below. `xcel-admin-tool.html`
was always the exception with no upstream — now nothing has one.

Same class of problem, unchanged from the siblings: any authored count with no
array behind it. `RESEARCH_DECISIONS` is 0 here because XCEL has no decisions
log; nothing derives it and nothing warns when that stops being true.

## The six prototype pages (`public/prototypes/`)

The FinServ (Insurance / Mortgage / Banking) next-generation platform, answering
the FinServ *Learner and Admin Wireframe Brief*. Six `PROTOTYPE_FEATURES` rows,
all `category: 'exploration'`: **`xcel-lms`** (Desktop Platform, `pinned`) ·
**`xcel-walkthrough`** (Learner Walk-through) · **`xcel-wireframes`**
(Wireframes & Overlap) · **`xcel-admin`** (Admin Wireframes & Overlap) ·
**`xcel-admin-tool`** (the forked roster — documented in its own section below) ·
**`xcel-exam-spec`** (Exam Task-Type Spec).

### There is no source/served split — moved here 2026-09-03

These five pages and their smoke suites used to live in
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/`, published to
that repo's `public/prototypes/` by `deploy-xcel-prototypes.sh`, which then
MIRRORED the six files into this one. That arrangement existed because that site
served them too, and it is gone: **the XCEL rows, the sources and the deploy
script were all removed from that repo**, so this is now their only home. That
also resolved the `TODO(2026-09-04)` this file used to carry.

What it means in practice: **`public/prototypes/*.html` ARE the sources — edit
them directly.** No copy step, no deploy script, nothing to keep in step. The
same model `xcel-admin-tool.html` was already on, which is why the split had
become inconsistent as well as duplicative.

The five smoke suites moved with them, to **[`smoke/`](smoke/)**, reading
`../public/prototypes/` rather than a source next door. Run them with
**`npm run smoke`** — 41 + 48 + 100 + 42 + 21 = **252 assertions**. Two things
changed on the way over, both because these assertions were written against the
other repo: `smoke-tiles.mjs` now expects each row in **Exploration** (there the
rows carried `devStatus: 'in-design'` to force them into Design; here XCEL *is*
the project, so `category` alone places them), and it matches `externalUrl` in
**both** quote styles — that repo wrote a plain single-quoted path, this one
builds a backtick template against `PROTOTYPE_BASE`, and matching one style
yields `undefined`, which `existsSync` reports as a missing FILE rather than as a
broken regex. It also covers `xcel-admin-tool`, which has no upstream counterpart.

**Order still matters if you run them individually:** `smoke-tiles.mjs` asserts
every tile's `externalUrl` resolves to a real file in `public/prototypes/`, so
add the page before the row, or that suite fails on a row pointing at nothing.

### The admin page

**The admin page** ([xcel-lms-admin.html](public/prototypes/xcel-lms-admin.html), served as `/prototypes/xcel-lms-admin.html`) covers admin flows 01–06 and is built on ONE claim, arrived at by Jillienne overruling an earlier and more elaborate reading: **flows 03, 04 and 06 are not three screens but one roster asked three different questions, because who paid for a seat is a COLUMN, not a mode.** A learner whose agency bought their seat and one who bought their own are the same row with a different value in one cell; the admin's question — *how is this person doing* — is identical either way. The rejected framing treated sponsored-vs-self-paid as a product-model fork and concluded PartnerHub could not reach flow 04; that conflated a rule for the LEARNER app (don't show a price or upgrade CTA to someone whose agency paid) with the ADMIN surface, where it does not apply. What survives of it: **spend is the one thing that is not a column**, because it is a total rather than a property of a learner — it sits in the agency roll-up above the table, which keeps it out of the row and off the learner's screen by construction. The page's centrepiece is a **working roster stage**: 14 learners, three view presets (Who is stuck · Invite follow-up · Seats & spend) that re-filter and re-sort the SAME rows, sortable headers, status chips, bulk selection with a view-specific action, and a side panel on row click — deliberately not an expanding row, since on a cohort-scale list expansion pushes whatever you were comparing against off screen. Its five badges are PartnerHub's own (Compliant · On Track · At Risk · Overdue · Not Started), derived by the real rule (At Risk = under 30 days AND under 25% done). A second stage answers flow 01 with **drill, don't unfold** — a breadcrumb whose root is a boundary rather than a starting point, so subtree scoping is structural instead of a clearable filter — plus an **as-of** control, on the reasoning that "as of" and flow 05's provenance are one problem (*what does this number actually mean*) and must share one basis line, or every screen reads hedged. Three hatched holes: inherited-vs-overridden pricing (the blast radius is the hard part, not the badge), the provenance confidence threshold, and **utilisation beyond "claimed"** — Gift Recipients models claimed/unclaimed, but a seat can be claimed, paid for and idle, which is exactly flow 06's "bought and never started", so flows 04 and 06 meet on the same row. The roster shows an **Idle** state whose 14-day threshold is invented and flagged as such. Guarded by [smoke-admin.mjs](smoke/smoke-admin.mjs) (42 assertions), which checks the load-bearing claims specifically: that a named learner appears in more than one view rather than being filtered out of existence, that spend is in the roll-up and NOT in the table header, that a self-paid seat cell is genuinely blank rather than "n/a", and that a parent node shows its children summed.

### The desktop platform — brand colour

**THE RED IS NOT THE PRIMARY (2026-09-02).** It was — a ramp derived from the wordmark red at `#a81c24` — and the problem was not the colour, it was that ONE ramp was carrying four unrelated jobs: brand identity, every interactive control, all progress data, and the licensing-exam accent. When the product's own data is red, there is nothing left for the brand to be. The ramps are now split three ways in [xcel-lms-desktop.html](public/prototypes/xcel-lms-desktop.html): **`--brand-*`** is the wordmark red, carrying identity (logo `X`, avatars) and exactly ONE semantic — the external licensing exam (`.taskrow.exam`, the `p-brand` pill, the calendar's exam day) — and it is **constant across every palette**, because it is the brand, not a theme choice; **`--primary-*`** carries interactive + data; **`--slate-*`** is the second data hue (the Elective gauge segment) and is **palette-scoped too**, because a second hue can only be chosen against the primary it sits beside. A new **`--on-primary`** token replaced two hardcoded `#2f080a` dark-red inks on `.btn` and `.tabs`, so those rules need no dark-theme override at all.

**Three candidate palettes ship behind a live switcher** in the prototype bar (`data-palette` on `<html>`, persisted to `localStorage['xcel.dt.palette']`, default **navy**), so the choice is made against the real product rather than a swatch board: **A · Navy** `#1f4e88` (insurance-conventional, the highest headroom at 8.39:1) · **B · Graphite** `#3f4753` (near-neutral, which makes red the only saturated colour in the product — but watch the gauge, where grey progress can read as *inactive*) · **C · Teal** `#0f6e72` (least "bank"). The switcher is prototype chrome, styled apart from product UI, and its swatches are literal hex rather than tokens because the control has to show the palette you are NOT currently in.

**Findings from the re-palette, in rough order of how easily they regress.** (1) **The XCEL red does not "pop" against any deep primary** — it measures 1.14–1.28:1 against all three 500s, because `#a81c24` is a genuinely dark red (luminance 0.093) and so is every candidate. This is NOT a defect and there is no threshold for it: red and the primary are never text-on-each-other, red is 7.35:1 on its actual background (white), and the exam day is labelled "Exam · PSI" in words, so nothing is carried by colour alone. But it does mean red reads as a *peer* of the primary rather than an accent above it — if a future brief wants red to genuinely pop, the primary has to move to a 700-depth stop (Navy 700 gets to 1.88:1), not a different hue. (2) **The dark-mode gauge collapsed and a test caught it**: all three palettes put their dark `primary-500` at ~0.44 luminance, and the light bronze Elective landed there too, so the two segments measured **1.01:1** — the same bar in two hues. The dark Elective is `#a86e28`, which holds 3.94:1 on the dark card AND ~2:1 against every primary; **lighten it and the gauge stops reading as two things**. (3) The teal palette's Elective is a stop lighter than the other two (`#b8873f`, not `#a9682a`) because teal 500 is dark enough that the deeper bronze collapses to 1.35:1 against it — the second hue genuinely cannot be shared across palettes.

**The palette is now guarded by tests, which it was not before.** `smoke-desktop.mjs` went from 51 to **100 assertions**: it parses the real declared hex out of the stylesheet (so the assertions track the CSS rather than a copy that can drift) and sweeps all three palettes × light/dark for rail-active ≥3:1, rail-chip ink ≥4.5:1, link/500 ≥4.5:1 on white, white-on-fill ≥4.5:1, the two gauge segments ≥1.6:1 apart, and `--on-primary` ≥4.5:1 on the dark fill. Following [`ProfilePersonalizeContrast.test.ts`](src/test/ProfilePersonalizeContrast.test.ts), it also asserts the **old failing values still fail** (`#a81c24` at 2.05:1 on the rail; `#c75159` still the marginal 3.41:1 stop) so a future palette reaching for either fails a test instead of quietly shipping an invisible rail indicator — and it asserts the hero gradient stays gone. **Two demo axes are live and both re-render everything**: `dashboard-education-type` (Pre-Licensing ⇄ Continuing Ed — renames every category label, swaps Target Date for License Expires, and hides the renewal cycle for pre-licensure, since there is nothing to renew yet) and `dashboard-progress-state` (the five compliance states). A third, **Exam**, has no counterpart in the dashboard project: four of the licensing exam's six states are DERIVED from the sit date, so there is no way to click to them — the control exists for the same reason the walk-through has a clock. **A provenance toggle in the prototype bar** overlays each card with the real component it came from plus a per-section note on what was reused, what was dropped and why — it is the answer to "what actually overlaps", made checkable rather than asserted. **The logo is a text lockup with an `<img src="/brand/xcel.svg">` in front of it that hides itself if the file is absent** — drop the real asset at that path and it appears with no code change. **The two original contrast findings survive the re-palette as a RULE, not as two hex values.** They were: the XCEL red measures **2.05:1 against the near-black rail**, under the 3:1 a state indicator needs; and `#c75159`, the stop that cleared it, is an awkward mid tone where **neither white (4.42:1) nor near-black (4.09:1)** reaches 4.5:1 at chip size. Generalised: every palette puts a **light** stop on the rail (`--rail-accent`, now 5.34–6.01:1) and fills chips with a **light tint over dark ink** (`--rail-chip` / `--rail-chip-ink`) rather than a saturated fill. Re-measure before darkening any of them. Same trap as the McKissock secondary/tertiary ramps documented under Free Content promo bands.

**The hero's red gradient was removed in the same pass** (the direct ask). `.hero` was a `linear-gradient(180deg, var(--primary-100), transparent)` — a brand-red fade that put the loudest colour in the product behind its quietest content, and read as a coloured band the eye had to clear before the page began. It sits on `var(--card)` now, with the existing bottom rule doing the separating; the `[data-theme="dark"] .hero` red-tint override went with it. Two hatched holes are local to this page: **who pays** on the catalogue (sponsored access is meant to be invisible to the learner and central to the admin, so neither showing nor hiding the price is right until the entitlement rule exists) and **multi-state hours** on Records.

### The learner walk-through

**The full walk-through is a SECOND page under the same tile** — [xcel-lms-walkthrough.html](public/prototypes/xcel-lms-walkthrough.html), served as `/prototypes/xcel-lms-walkthrough.html`, linked from the wireframes masthead. Where the four stages above are separate mini-prototypes that each start cold, this is **one learner, one unbroken arc with state carried throughout**: invite → magic link → silent account creation → set a target date → plan built backwards from it → study loop (home → hand-over wait → Compass frame → exit with the progress lag) → practice exam → exam simulation + its interruption → readiness → book the licensing exam → sit → fail → retake → pass → records. **The carried state is the point, and it is made visible** by a "What the product knows" inspector beside the phone (account · target date · plan days · chapters · practice · simulation score · readiness · booking · attempts · licence · today's date), so a reviewer can see that the date they typed built the plan and the chapters they finished moved the percentage. Nothing is hardcoded downstream: `planDays` derives from the chosen target, progress from `done/TOTAL`, the practice task appears at 4 chapters, the simulation unlocks at 8, booking unlocks at 12, and a failed attempt re-anchors the plan while keeping attempt 1 in the record. A **journey rail** shows the nine chapters and allows jumping BACK only (jumping forward would skip the state that makes the later screens true). Three surfaces carry the brief's own answers: the **readiness** screen states its basis, gives a frequency rather than a probability, and names what would move it ("an estimate, not a prediction · about 7 in 10 passed first time") — the answer to flow 04's credibility problem; the **fail** screen is warning-family with no confirm dialog and states that coursework and hours are unaffected; and **Compass-unreachable** during the simulation renders the hatched hole rather than an optimistic recovery. Two more hatched holes live inline where they bite — retake cooling-off (on the retake screen) and multi-state licensure (on records). **Guarded by [smoke-walkthrough.mjs](smoke/smoke-walkthrough.mjs)** — a jsdom walk of the ENTIRE arc, 48 assertions, which asserts the state actually carries (the typed email reaches the wait screen, the typed target date reaches the plan, the offline-held answers reach the result screen, both attempts reach the records screen) rather than only that screens render. Run both smoke tests and re-copy BOTH files to `public/` after any edit. **ONE row, not two:** the walk-through and the companion spec are reachable from the wireframes masthead, not as their own tiles — a second row into the same body of work is what got `recommended-card-ab-demo` and the four testing tiles archived. That spec is served as **raw `.md`** (`/prototypes/xcel-lms-exam-task-type-spec.md`, browsers render it as plain text) so there is ONE copy; an HTML twin would drift from [public/prototypes/xcel-lms-exam-task-type-spec.md](public/prototypes/xcel-lms-exam-task-type-spec.md) the moment either changed. **The spec's load-bearing finding:** `StudyTaskKind`'s existing `'exam'` means the *practice* exam (course-linked, with an `href` into the LMS), so the external licensing exam needs its own `'licensing-exam'` key — overloading the existing one still typechecks and would have the calendar silently treat a real licensing exam as a practice one. Admin flows 01–06 are **not** covered in this pass. Since the tile is `explore` + `externalUrl`, the add-a-feature checklist's brands / member+non-member / feature-flag requirements don't apply — there is no gateway and no in-app route.

## The Admin Tool (`public/prototypes/xcel-admin-tool.html`)

The XCEL admin platform, **forked from PartnerHub** (`partnerhub-designs/index.html`)
rather than rebuilt, so All Learners, the side-panel shell, the kebab, filters
and pagination arrived working. ~910KB, one file, no build step — edit it
directly. Answers admin flows 03 · 04 · 06 of the FinServ *Learner and Admin
Wireframe Brief*; the companion analysis is `xcel-lms-admin.html` in the same
folder, and it is the document this build argues with.

### What the fork turned out to be — three corrections worth not rediscovering

1. **The five status "badges" are COUNTS, not badges.** PartnerHub's Compliant /
   On Track / At Risk / Overdue / Not Started are five *numeric columns* of
   programs per state, so a learner at 2 compliant + 1 overdue reads as neither.
   There is no per-learner answer to "how bad" in the source. That is why the
   deadline-derived **Risk** column exists — it is not decoration on the badges,
   it is what makes flow 06 answerable.
2. **There was no consumer-membership model to strip.** Zero membership /
   entitlement / tier / storefront code in this file; that lives in the
   PartnerHub *Angular* product. The planned strip step became an addition
   instead (Invites, Seats).
3. **Bulk selection did not exist.** Every checkbox in the source belongs to the
   filter panel. Selection, the bulk bar and the reminder throttle are all
   net-new here.

### Shape

- **One roster, three presets** — `AL_VIEWS` (`#stuck` / `#follow-up` /
  `#seats`). Each is a scope + a sort + a default action over the *same* rows.
  Only Seats excludes rows, and only because a seat is meaningless for a
  self-paid learner. Nothing is filtered out of existence between them.
- **Scope is a fact, not a label.** `AL_ORG` is the hierarchy as flat parent
  links; `ADMIN_ROOTS` holds **two** roots (a region plus an unrelated agency) so
  the multi-root case cannot be forgotten. `inScope()` runs FIRST in
  `getFiltered`, and `isInAdminScope()` re-checks independently — a bad scope
  value cannot leak rows.
- **`agencyId` and `payerId` are different facts.** Where a learner sits vs. who
  bought their seat. The fixtures were conflating them (`paidBy: 'Self'` left a
  learner in no agency at all). A region buying seats for an agency's recruits is
  representable, and the panel says "seat bought above them".
- **Invites (flow 03)** — compose → preview → send. The send creates the cohort
  *and* real learner rows, then navigates to the roster filtered to that intake.
  Frame 4 is a navigation, not a screen; building it as its own page is the
  mistake the wireframes argue against.
- **Selection** is keyed by **email** (names collide, indexes move under every
  sort), pruned to the filtered set each render, and cleared when the acting root
  changes — that is switching book, not narrowing one.
- **Blank ≠ zero.** A self-paid learner's Seat cell is *empty*, not "n/a" or a
  dash. A placeholder in an inapplicable column reads as a value we failed to
  fetch. Reuse that convention; it will come up again.

### The invented rules — replace, don't re-derive

Each is one constant, named loudly, with an owner in the comment:

| Constant | Rule | Owner |
|---|---|---|
| `IDLE_RULE_INVENTED` | claimed · 14 days idle · under 10% | FinServ product |
| `RISK_RULE_INVENTED` | under 30d & <60%, or under 60d & <25% | FinServ product |
| `REMIND_COOLDOWN_HOURS` | 24h skip window | FinServ product |

`RISK_RULE_INVENTED` carries a second problem the brief names: it is
**deterministic** (deadline × percent done) while Compass's readiness is
**probabilistic** low/med/high. If Compass owns readiness, this column is either
a second disagreeing opinion on the same learner or their number wearing our
badge. Do not "improve" the thresholds without settling that first.

### Next, in order

1. **Spend roll-up** above the table — flow 04's other half. Spend is a total,
   not a column, which is what keeps utilisation off the learner's row.
2. **Organisation drill (flow 01)** — the breadcrumb. Closer than it looks:
   `AL_ORG` is in, and the fork already ships a Groups table *and* a Group
   Summary side panel, i.e. a non-person entity with its own icon avatar and
   panel. Needs a naming decision (Groups or Agencies) and the drill, not a new
   table. It also answers the known gap that under "All my agencies" the roster
   does not say which agency a row sits in — **do not fix that with a 16th
   column.** You drill; you do not add a column.
3. **Dark mode + the contrast sweep.** The brief's "both themes · WCAG in Phase
   1" is marked *Built* in the wireframes inventory — but built in the learner
   dashboard. This fork is light-only, so forking un-met a Phase 1 requirement.
   Blocked on the item below.
4. **The 761-literal hex sweep.** A `:root` token map already exists in the fork
   and 761 hex literals (107 unique) bypass it. Deliberately skipped so far: it
   changes nothing visually and touches nearly every styled line, which would
   bury the feature diffs. Its own commit — and a prerequisite for a theme.

### Undesigned, and known to be

Recipient paste/upload (parsing, per-row errors, de-dup against learners already
in the subtree — the composer says so on screen). Price inheritance: the origin
line is a **fixture, not a lookup**, labelled as such in both the panel and the
composer. Empty states beyond the two authored. Spanish string expansion, which
this table is the product's worst case for — fixed flex widths, stacked two-line
headers, and badge labels that grow 30–40%. And the preset strip is a
`role="tablist"` whose table is not wired as a tabpanel: finish the pattern or
drop to buttons with a live region.

### Verifying it

There is no build step for the prototype, so the guardrails are: `npx vitest run`
for the gateway, and for the HTML itself `node --check` over each inline
`<script>` block plus a header/row cell-parity check (the header and the row
template are separate flex rows — they must list the same `al-col-*` classes in
the same order, currently 16). A scope-placement audit is worth repeating after
any large edit: this file has **five** `getFiltered` functions and two
`perPageSel` refs in different IIFEs, and a patch anchored on the wrong one lands
in the bookmarks closure and throws on load. That has already happened once.

## The 2026-09-08 migration — the product app, XCEL only

The Common LMS product app was copied in and stripped to one brand. It is the
largest change this repo has had: `src/` went from 174 files to ~650, and from
17k lines to ~150k.

### It reverses a decision made four days earlier, deliberately

`jill-dashboard-ux-designs/xcel-brand/XCEL-build-prompt.md` (2026-09-04) says,
under "Decisions already made — do not re-litigate these":

> **Repo** — This one. `xcel` becomes brand #6. The sibling
> `../xcel-ux-dashboard` keeps only the standalone HTML prototypes; it does not
> get the brand system.

That is no longer the arrangement. XCEL is a project in its own right, not one
brand among six competing for attention in a multi-brand demo — the same
argument that put the five XCEL rows in **Exploration** here and left them in
**Design** over there. The build prompt and the gap audit are still accurate
about everything else; treat that one row of the table as superseded, not the
documents as stale.

### What "XCEL only" actually means

`Brand` is a **one-member union**, not a deleted type. `Record<Brand, …>` maps,
`professionFor`, `featurePreviewSrc` and `prototypeFeatures` all take it as a
type, so the seam is what makes re-adding a brand an edit in `AccountContext`
instead of a refactor across those files — and every `Record<Brand, …>` in
`src/data` fails to compile until the new brand has an entry, which is the
point. `tokens.css` keeps the `[data-brand]` SELECTOR for the same reason.

Two things NOT to misread:

- **The `@theme inline` defaults in `tokens.css` are still the LMS's CRE-derived
  ramp.** They are what shows if `data-brand` is ever absent. They are not
  XCEL's palette; the `[data-brand='xcel']` block is.
- **Membership was NOT removed.** `supportsMembership('xcel')` is false and
  suppresses every membership surface, which is the architecture the brand-add
  built. `src/components/membership/` is also not all membership —
  `LearnerFocusedBand`, `ClpJumpBackInBand`, `FeaturedHero` and `WhatsNewWidget`
  are dashboard surfaces XCEL renders that merely live in that folder. Deleting
  the folder breaks the dashboard.

### Where the LMS still has more than we do

The strip removed the other five brands' fixtures, and those brands carried demo
states XCEL does not. **The suite is green — 468/468** — but it got there three
different ways, and which one applied to a given test is worth knowing before
you touch it:

| Gap | How the test was resolved |
|---|---|
| My Courses reached only in-progress / not-started / completed | **Data authored.** Seven rows added covering both routes into `expiring-soon`, expired-with-progress, the per-course `warnDays` negative case, failed with and without a score, and archived+failed |
| The CE path claimed completed hours with no completed course in its list | **Data authored**, and it was a real incoherence — the gauge said six hours were done and the list showed none |
| XCEL has no in-person courses, and nothing resolves to `included` | **Test moved down a layer** to `EnrollmentConfirmationModal` |
| XCEL authors no library video/webinar, and no downloadable assets | **Test moved down a layer** — variants are built, not fetched |
| **Gift Recipients has no XCEL records** | **Retired.** See the note on `supportsGiftRecipients` — still the one worth fixing |
| Library records set no `tags` / `status` / `lengthMinutes` | **Retired** (three filter tests) |
| No partner offerings; no renewal requirements | **Downgraded** to asserting the empty state |

Two rules fall out of this, and both are load-bearing:

**Prefer moving a test down a layer over authoring data to satisfy it.** A test
pinned to a named fixture row is testing the fixture as much as the code — which
is exactly why so many broke. `ProgressFillTones` and the ResourceDetailPage
variants now build their inputs and depend on no fixture at all. Author data
when the DATA is the subject (the state-coverage tests genuinely assert that the
demo spans every state) and not otherwise.

**Never author a fixture that points at an asset which does not exist.** The
`downloadUrl` / `pdfUrl` tests were tempting to fix with XCEL resources naming
files under `public/library/`. Those files are real Elite assets; XCEL ships
none, so that would have made the running demo 404 on download to turn a test
green.

### Verifying a change here

`npx tsc -b --noEmit` is the real guardrail for a brand-shaped edit: the union
being one member means a stray brand literal is a compile error rather than a
runtime surprise. Then `npx vitest run`, then `npm run smoke` — and remember
`npm test` does NOT run the smoke suites.

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

## Tests

[`src/test/UxDashboard.smoke.test.tsx`](src/test/UxDashboard.smoke.test.tsx) —
covering what the port could plausibly have broken: that it mounts
under the real provider stack, that the nav is the full section set *in order*,
that every row routes where the data says, that the gate holds (including the
deep-link case), and that the preview resolver resolves for every documented
component.

Plus two XCEL-specific ones: that every row's `externalUrl` is a **same-origin**
`/prototypes/…` path which exists in `public/` (corrected 2026-09-03 — this said
"an absolute URL on a single shared origin", which predates the 2026-09-02 move
off the cross-origin pointer and contradicted it), and that **Demo is empty** —
asserted rather than assumed, so promoting a row to the ungated front page is a
deliberate change that breaks a test first.

Written because the port couldn't be verified visually, and because the failure
mode that mattered — a missing provider throwing on mount — renders a blank page
that looks like a styling bug. Extend it when you add a section or change
`sectionOf`; `EXPECTED_PLACEMENT` in that file is the list to update when a row
moves.

The six prototype pages are covered separately by the five jsdom suites in
[`smoke/`](smoke/) — **`npm run smoke`**, 252 assertions. They are plain node
scripts, not vitest, so `npm test` does NOT run them; run both.

### The product app's tests — added 2026-09-08

The migration brought ~70 more vitest files covering the product surfaces. Two
things to know before reading a failure in them:

**They were written against six brands, and are now XCEL-only.** Where a brand
appeared as SCAFFOLDING — a seed helper, a `Brand[]` list, a default param — it
was repointed at XCEL. Where a brand was the SUBJECT — `expect(tierLabelFor(
'elite', …)).toBe('Passport Lite')` — the case was removed rather than
rewritten, because repointing it invents an assertion about a tier ladder XCEL
does not have.

**A test that pins itself to a named fixture row is the fragile pattern here,
and `ProgressFillTones` is the worked example.** It picked a McKissock course
for "completed" and a CRE one for "expiring soon" — coupling a test about colour
mapping to whichever brand happened to author a row in each state. It now builds
each state explicitly on an XCEL base and depends on no fixture at all. Prefer
that shape. Two traps it had to learn, both worth knowing before you write an
expiry test: `CourseCard` resolves expiry against the anchored `FIXTURE_TODAY`
(2026-05-11), not the wall clock; and `warnWindowFor` clamps the countdown to
half the enrolment window, so "inside 60 days" is not sufficient.

**The suite is green — 468/468 across 70 files.** The migration section's table
says how each fixture gap was closed, and the two rules under it are the ones to
follow when the next one appears. The short version: prefer moving a test down a
layer over authoring data to satisfy it, and never author a fixture pointing at
an asset that does not exist.
