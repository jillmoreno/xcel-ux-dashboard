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
| Server code | Three Netlify functions over Netlify Blobs — QA Notes + captures, and Links |
| Tests | Vitest + @testing-library/react |

## Gateway sync — read before touching `src/pages` or `src/components`

The gateway code here is a **copy** of the LMS dashboard's
(`jill-dashboard-ux-designs`), and it drifts. This repo was ported 09-02 from
PartnerHub, which was itself two weeks behind the LMS at the time, so it arrived
already missing the 08-31 walkthrough rebuild.

**Gateway last synced from `jill-dashboard-ux-designs` @ `3ff8570` on
2026-09-18.** To find what has landed since:

```bash
cd ../jill-dashboard-ux-designs && git log 3ff8570..HEAD --format='%h %ad %s' --date=short -- \
  src/pages/UxDashboardPage.tsx src/pages/PrototypeFeaturePage.tsx \
  src/components/prototype src/components/ui src/components/layout \
  .claude/skills/dev-handoff-notes
```

Which files are **copied whole**, which are **merged** (`UxDashboardPage.tsx`,
the type block of `prototypeFeatures.ts`, `shareLink.ts`), and which are **left
alone** is in the `port-ux-dashboard` skill's sync section. Sync flows BOTH
ways — this repo's derived share-link origin (`09c5f13`) and `--ux-page` white
plane (`24aabbc`) went back to the LMS and PartnerHub on 2026-09-18.

What that sync brought in: the 08-31 walkthrough rebuild (`COMPONENT_SECTIONS`
one-scroll detail, `userStory` / `badgeDate` / `tabLabel`, `handoffMarkdown.ts`
+ the Actions menu's Download / Copy .md), the 09-01 banner removal, and the
09-09 **Quick Summary** — `quickSummary` on `DevHandoffComponent` leads the
component detail; **ask Jillienne for it, never draft it** — see
`.claude/skills/dev-handoff-notes/SKILL.md` (added here in the same pass).

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

## The home page (`/`)

[`UxDashboardPage.tsx`](src/pages/UxDashboardPage.tsx) — a left nav over a
project list. Unchanged from the LMS original apart from three strings (the
brand sub-line, the Research row label, `RESEARCH_DECISIONS`), so anything the
LMS `CLAUDE.md` says about it holds here.

**Sections.** Three open — Demo · Links · Research — then a divider under a
**UX & DEV ACCESS** eyebrow holding Design · Exploration · Sandbox ·
Development · Done · Archive · QA Notes · To Do.

**Demo holds the live product build** (`xcel-dashboard` → `/dashboard-rebrand`),
promoted there on 2026-09-08. It is the one row on the ungated front door, so
what sits in Demo is a decision about what a stakeholder may see without the
password — `UxDashboard.smoke.test.tsx` compares the whole section against an
expected set, in both directions, so promoting or demoting a row fails a test
first. It is also the one row in the file that is an in-app ROUTE rather than a
standalone HTML document; see "The one in-app row" below. All eight restricted sections share **one gate id**
(`design-and-development`) and therefore one password, so a reviewer types it
once. The password comes from `getPrototypePassword()` — `Password123` unless
overridden. Selecting a locked section opens the modal *over wherever you are*,
so cancelling can't strand you, and a deep link into a gated section is checked
against the **feature's own** section, not the one being viewed — neither a
side-door link nor cancelling reveals a gated spec.

**Which section a row lands in** is `sectionOf()`: `done` outranks everything,
then `devStatus`, then `category` as a fallback. Design and Development are the
only two sections split *by* `devStatus`, so they're the only two its absence can
split wrongly. **Placement is silent** — the banner that counted rows placed by
the `category` guess was removed (LMS `8005c5a`, synced here 2026-09-18), so a
mis-placed row shows no warning on the page. `EXPECTED_PLACEMENT` in the smoke
test is what catches it now.

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

### Two Netlify sites — the public build (2026-09-18)

The repo deploys to TWO Netlify projects from one branch: the **existing site
is now the PUBLIC one** (Demo · Links · Research, nothing else), and a **new
site is the FULL one** (everything, behind the Netlify site password). Setup
steps are in the README under "Two Netlify sites, one repo"; this records the
decisions.

**ONE build-time env var, `VITE_GATEWAY_MODE=public`, and nothing else differs
per site** — not the branch, not `netlify.toml`, not the build command. This is
the `VITE_DEMO_TARGET` pattern (`demoPin.ts`) applied to the gateway: a project
that sets the var gets a different build, one that sets nothing gets the whole
app. A parse failure (`publc`) resolves to FULL, deliberately — a typo has to
fail towards showing the maintainer everything, never towards hiding it.

**The gated sections are ABSENT on the public build, not locked.**
`VISIBLE_SECTIONS` in `UxDashboardPage` filters `SECTIONS` to the ungated ones
at module load, and every render or resolve reads that list — the nav, the
divider (`FIRST_RESTRICTED` becomes `-1`), `sectionFromParam` (so
`?section=design`, the legacy `dev` alias and the `tab=archive` pairing all
land on Demo), and `openDef` (so `?open=` cannot open a gated row in-frame).
The password modal therefore never mounts. `SECTIONS` itself is untouched, so a
new gated section needs no change here.

**Routes are closed in `App.tsx`, not in the pages.** `PublicGate` wraps
`/prototype/:id`, its handoff detail and `/qa-notes`: a row that is not in Demo
redirects home. `isPublicFeature` is deliberately NARROWER than `sectionOf` —
`category === 'demo'` is a necessary condition for Demo, since a `devStatus` or
a per-browser "mark done" can only move a row OUT of it. Note `/prototype/:id`
had NO gate on the full build before this and still has none; the modal on the
home page was the only thing between a pasted URL and an Exploration row's
gateway. Worth knowing, not changed.

**Static files cannot be hidden client-side, so `scripts/public-redirects.mjs`
404s them at the edge.** It is npm's `postbuild` hook (so `npm run build`, the
Netlify command, picks it up unchanged) and writes `dist/_redirects` ONLY when
the var is `public`. `_redirects` rather than `netlify.toml` because the toml is
shared and has no per-project conditional, and because Netlify evaluates
`_redirects` BEFORE the toml — which is what lets a 404 beat the toml's `/*` SPA
fallback. Blocked: `/prototypes/*` (every document row), `/testing/*` and
`/ngat-admin/*` (LMS leftovers), `/archive/*`, `/qa/*`. NOT blocked:
`/prototype-thumbs/*` (a Demo row may grow one) and `/api/*` (Links is
ungated). The target is `public/404.html`, which Netlify also serves for a
mistyped address — a hidden prototype and a typo look the same, on purpose.

**The product app is fully reachable on the public build.** `/dashboard-rebrand`
IS the Demo row, and it links between its own ~28 routes, so closing any of them
would break the demo from inside. If a product route should be private, that is
its own decision.

**Netlify Blobs are PER SITE, and that was the real trap.** Two sites means two
`links` stores, two `qa-notes` stores, two capture stores — a link added on one
site invisible on the other. `netlify/lib/store.ts` is now the one place the
three functions open a store: if `BLOBS_SITE_ID` + `BLOBS_TOKEN` are set it
opens THAT site's store, otherwise the ambient one. The FULL site sets both,
pointing at the public site (which owns the data, having always held it); the
public site sets neither and changes nothing. **Both or neither** — one without
the other throws rather than silently opening a private store, which is the
failure that would be invisible until someone compared the two sites. The
helper lives OUTSIDE `netlify/functions/` because every file in that directory
deploys as an endpoint; `tsconfig.functions.json` includes `netlify/lib`.

**Consequence for QA Notes:** the page is closed on the public site but its
endpoints are not — they are the store the full site reads through. Blocking
`/api/qa-*` on the public build would break QA Notes on the full one.

`PublicGateway.test.tsx` pins all of it, and has to `vi.resetModules()` +
dynamic-import the page after `vi.stubEnv`, because `VISIBLE_SECTIONS` is
computed at module load — a top-of-file import would test the full build with a
public label on it. It also parses `BLOCKED` out of the script (the
`ALLOWED_PROTOCOLS` pattern) and asserts every document row's `externalUrl`
falls under a blocked prefix, so a row pointing at a new static folder fails
here rather than shipping reachable.

**Also fixed in passing:** `UxDashboard.smoke.test.tsx` read a source file via
`new URL(…, import.meta.url)`, which under the jsdom environment is jsdom's
`URL` and Node's `readFileSync` rejects it ("must be of scheme file") — the
whole file failed to collect. It resolves a path now, like its two sibling
reads.

### Links — the section that is authored on the page (2026-09-10)

A nav section (`links`) directly under **Demo**, plus `/links` as a short address
for it, holding whatever lives elsewhere — briefs, boards, deployed builds,
Figma files. Its entire reason for existing is the ask behind it: **a link can be
added without a code change.** Nothing in `src/` names a link.

**Server-side, not `localStorage`, and that is the decision.** A third Netlify
function over Blobs (`netlify/functions/links.ts`), the same shape as the two QA
endpoints. The To Do panel's per-browser store was the cheaper option and it is
the wrong one here: a links page is *the place you send someone*, so a list only
its author can see fails at the one job it has. The cost is stated plainly on the
page ("Saved to the shared store — everyone who opens this site sees it").

**UNLIKE QA Notes, there is no committed seed and therefore no merge.** QA Notes
ships an array in `qaNotes.ts` that stored records override; this ships nothing,
so the store IS the list. Do not add a seed file to "make it testable" — the
merge rule exists over there to stop a destructive action reaching something that
is in git, and here there is nothing in git to reach.

That leaves a real exposure, and it is worth knowing rather than discovering:
**Netlify Blobs is not backed up**, so this list lives in exactly one place.
`toMarkdown` behind *Copy as markdown* is the way out, the same mitigation
`todoStore` uses. There is deliberately no paste-it-back-into-a-data-file path,
because there is no data file.

**The URL check is a SECURITY control, not tidiness.** Every stored `url` is
rendered as an `<a href>`, and `javascript:` in an href executes in this origin —
so "add a link" would become "run code in every reviewer's browser". Both
boundaries **allow-list** http and https rather than blocking known-bad schemes:
the endpoint on the way in, and `safeHref` again at render time, because a record
written by an older or laxer version must not become live code later. A row whose
address fails the check still renders, as TEXT marked "not a linkable address" —
visible so it can be fixed, rather than silently vanishing.

`Links.test.tsx` pins all of that, including a **source-level** assertion that
the endpoint's `ALLOWED_PROTOCOLS` still names exactly those two and is still
applied by inclusion. It parses the real declared value out of the file rather
than duplicating it, the `smoke-desktop.mjs` pattern — a blocklist would pass a
naive "does it mention javascript" check while being one novel scheme away from
wrong.

**It is UNGATED, beside Demo — an editorial decision, and tested as one.** Demo
is the passwordless front door and this sits next to it, so a link added here is
reachable by a stakeholder unaccompanied. Behind the shared Design & Development
password it would be a private bookmark file, which is not what it is for. A test
asserts both the absence of the modal and the position after Demo, so gating or
moving it fails and gets re-decided — the same reasoning as "Demo holds exactly
the rows meant to be ungated".

**It is a nav SECTION, not a `PROTOTYPE_FEATURES` row**, which is what keeps
Demo's own two-directional smoke test meaningful: adding a section does not touch
the set of rows that test compares. The five registration points are the ones
Readiness and Resources needed — `UxSection`, `SECTIONS`, the `bySection` map,
the nav count branch, `renderBody` — plus the `/links` route.

**The nav badge shipped WRONG, and the fix is the mechanism to copy.**
`useLinkCount` fetched once on mount, so the rail said 2 with three links on
screen — the same defect `useQaNoteCount`'s own comment describes ("the rail said
18 while the page said 19"). It is invisible until someone adds a link, which is
the first thing anyone does here. Every write now fires a `cgp.links` window
event from inside the store helpers (not from the panel, so a second caller
cannot leave the badge behind) and the badge re-reads. A `storage` event would
not do it — that only fires for OTHER tabs. Same mechanism and same reason as
`todoStore`'s `cgp.todo`. **`useQaNoteCount` still has this bug**; it is one
section down and unfixed.

**No `ARCHIVE_BRIDGE` wrapper**, unlike the QA panel and the archive table. This
one is styled on the page's own `--ux-*` palette like `TodoPanel`, so it already
re-skins with the four schemes and four appearances. Measured in Dark · Fern: the
row title 12.35:1, the note 9.52:1, the meta and field labels 7.43:1, the Add
button's ink 11.65:1. The field's 1px border is a low-contrast boundary against
its card, and that is `TodoPanel`'s exact treatment on the same two tokens —
if it is worth raising it is worth raising for both, not just here.

**Every write re-reads the collection** rather than patching local state. The
server owns the id and the date, and the store is shared — another reviewer may
have added something since the page loaded. An optimistic list is a second,
quietly diverging copy of state more than one person can write to.

**The composer is HIDDEN when the endpoint is unreachable**, which is what plain
`npm run dev` looks like — vite serves no `/api/*` at all. The honest response is
to say so rather than render an Add button that fails on click. `LinkIndex`
carries `loading` separately from `available` for the same reason `NoteIndex`
does: for the tick before the first fetch settles, "no endpoint" is not yet a
fact. An HTML answer counts as no endpoint too — the SPA fallback returns
index.html with a 200, so a misrouted request would otherwise throw on parse and
read as a broken page.

**Five fields.** Address, title, optional note, optional **Added by**, optional
**Type**. Note that an unset note, author or type is stored
as `''` rather than omitted, so "never had one" and "had one and cleared it" are
one state a client never has to tell apart — and `normalise` supplies `''` for
records written before `addedBy` existed, so those read as "no author" rather
than breaking the row.

**`addedBy` is a typed LABEL, not an identity, and that is deliberate.** Nothing
authenticates this endpoint (the Netlify site password is the only control), so
a name the server claimed to know about its caller would be a guess dressed as a
fact. A field the author types is honestly what it is. It prefills from
`cgp.links.lastAuthor` — per browser, so a name is typed once rather than once
per link — but **editing an existing link prefills the RECORD's own author**,
never this browser's: editing someone else's link must not quietly reassign it.
A test asserts both directions.

**`LINK_TYPES` is INVENTED**, an editorial taxonomy rather than anything XCEL
publishes — Brief · Design · Prototype · Reference, owned by whoever is running
the project. It is four because four covers what the list actually holds and
because the filter strip has to stay one line; a value nothing carries is a
dead pill. Shaped like `TODO_STAGES` (an `as const` list plus a `| ''` member
for "not set") because it is the same kind of thing and the two should read
alike.

**Optional, so no backfill was needed** — the records written before the field
existed stay valid, and `normalise` degrades an unrecognised value to untyped
rather than rendering a chip this build has no label for. That degrade is
tested at the STORE, not through the DOM: an unknown type renders an EMPTY
chip, so a `queryByText` passes whether or not the degrade works, which is how
the first version of that test passed against a broken `normalise`.

**The endpoint re-declares the taxonomy as `ALLOWED_TYPES`**, deliberately, for
the same reason it re-declares the field limits — it is a trust boundary and
`LINK_TYPES` is a compile-time claim about code we wrote. A test parses both
files and asserts they agree, the same guard `ALLOWED_PROTOCOLS` gets, so the
duplication cannot drift silently.

**The chip is a neutral LABEL, not colour-coded**, and `ResourceIcon` is the
warning: it began as a content type, picked up per-card glyphs for variety, and
the field's two jobs stopped coinciding. A hue per type would invent a meaning
ramp nobody asked for — and two of the four palettes are olive-greens a
"Design" green would vanish into, which is the same reason status colours stay
off the `--ux-*` palette entirely.

**The filter renders only when more than one type is PRESENT**, and carries no
per-pill counts — the total sits beside the strip in the toolbar, which is the
convention `PillTabs` follows. It is a local pill rather than `PillTabs` or the
page's own `StatusPill`: the first is on brand tokens and this panel is on
`--ux-*`, and the second is unexported and requires the counts the convention
says not to show. Measured Light / Dark: chip 5.49 / 8.17, idle pill 6.18 /
9.52, active pill 10.51 / 11.65.

**The row meta is assembled, not interpolated** — `host · added <date> · by
<name>`, with absent parts dropped. A trailing "·" reads as a value that failed
to load, which is the admin roster's blank-Seat-cell rule applied here.

**The list is newest-first**, and same-day links tie-break on id, which is
monotonic — so a second link added today lands above the first rather than
somewhere arbitrary. A test asserts the RENDERED order, since the order is the
thing that was asked for rather than an implementation detail of `sortLinks`.

**The form is behind a CTA, not on the page.** It began as an always-visible
composer above the list, which put four fields of chrome permanently above the
thing you came to read — adding a link is the occasional act here and reading
the list is the constant one. It is a `Modal` now, the same component
`QaNoteForm` uses one section down.

**`--ux-*` DOES work inside that modal**, which is not obvious and cost a wrong
assumption on the way in. `Modal` portals to `document.body`, outside this
page's shell — but `UxDashboardPage` calls `mirrorPaletteToRoot`, which exists
for exactly that case. So the modal re-skins with the four schemes and four
appearances, and its primary button can take `--ux-accent` (as `QaNoteForm`'s
already does). Measured in Dark · Fern: title 13.67:1, typed values 13.65:1,
the primary button's ink 11.65:1, labels and hint 7.29:1.

**`onClose` must be `useCallback`'d, and this bit hard.** `Modal`'s focus effect
is keyed on `[open, onClose]` and calls `dialogRef.focus()` when it runs, so a
fresh closure each render re-runs it on EVERY KEYSTROKE and pulls focus off the
field being typed into. The first build took exactly one character per input and
dropped the rest — with a clean tsc and a modal that rendered perfectly. Only
typing into it showed anything wrong, which is why the test asserts a field's
VALUE rather than that the dialog opened. **Any other `Modal` caller on this
page is exposed to the same trap.**

**Row hover lives in `tokens.css` as `cre-uxlinks-*`, and the prefix matters.**
Inline `CSSProperties` cannot carry a pseudo-class, so this is a class — the
`.cre-alert-action` precedent. Three things worth not re-deriving:

- **The tint is `--ux-bg`, not `--ux-card-hover`.** `--ux-bg` is this page's
  "one step off the card" recessed surface; the note above `LIGHT_PAGE` names
  it as THE row hover, and `FeatureRow` and the archive table already use it.
  Two row hovers on one page differing by a few percent read as a bug.
- **`:focus-within` is the keyboard twin**, not decoration — the row's
  affordances are a link and two buttons, so a keyboard user tabbing the list
  gets the same "this row" feedback hover gives. Same reasoning as To Do's move
  up / move down buttons beside its drag.
- **`.cre-link-action` was the obvious name and would have been a bug.** It is
  an established product-wide class (40+ call sites) for TEXT CTAs, carrying a
  `::after` underline and a brightness filter; these are bordered icon buttons.
  A second `.cre-link-action:hover` block here would have applied `color` and
  `border-color` with `!important` to every one of those call sites. A test
  asserts this panel's block declares no `.cre-link-action` selector.

**Two of these rules need `!important` and one of them failed silently.** The
anchor carries an inline `text-decoration: none` and the buttons an inline
`color`/`border`, which beat a stylesheet rule. The underline shipped without
it: the rule matched, computed, and did nothing, while the row still tinted —
so it LOOKED right. Only reading the computed `text-decoration-line` in a
browser caught it, which is why the test asserts the `!important` in the CSS
source rather than that the class is present.

**Known, not fixed:** the field placeholders measure **4.34:1** on the input
fill in dark, marginally under AA. It is the shared `--ux-text`-on-`--ux-bg`
field treatment — `TodoPanel`'s inputs are identical — and every field here is
labelled, so nothing is carried by the placeholder alone. Raising it is a
page-wide change, not a Links one; do not fork the treatment for this panel.

**Running it locally needs `netlify dev`, and the launch config carries two
traps** that cost real time here — see `.claude/launch.json`'s
`xcel-dashboard-netlify` entry. `PORT` must be pinned inside the command, or
vite inherits the launcher's port and every request reaches vite instead of
netlify's proxy (the symptom is `/api/*` answering **200 with index.html**, which
reads as a broken redirect). And `--functions` must be an ABSOLUTE path when this
runs from a **git worktree**: the CLI resolves the functions dir against the
REPOSITORY root, so it serves the main checkout's `netlify/functions/` and a
function added in the worktree is simply missing — while both pre-existing
endpoints load fine, which is exactly what makes it convincing.

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
| [`src/data/archivedItems.ts`](src/data/archivedItems.ts) | The Archive table — two rows as of 2026-09-16 (the Profile page's Motivational Statement card, and the Dashboard MVP version retired by the flag audit). |
| [`src/data/qaNotes.ts`](src/data/qaNotes.ts) | The committed QA seed — empty; findings are authored on the page. |
| [`src/data/nyProducerRequirements.ts`](src/data/nyProducerRequirements.ts) | The New York Insurance Producer licence — the QE Focused version's demo. Sole owner of its INVENTED hour/exam figures, plus `examFactsFor` (the per-state exam facts the Readiness page reads). |

### The one in-app row

Every row in `prototypeFeatures.ts` opens a standalone HTML document under
`public/prototypes/` except **`xcel-dashboard`**, which is a react-router route
(`to: '/dashboard-rebrand'`) into the product app that now lives in this repo.

**Do not confuse it with `xcel-lms`**, the Exploration row titled "XCEL LMS —
Desktop Platform". That one is a hand-authored HTML mock-up of these same
surfaces; this one is the surfaces themselves. They look alike on purpose — the
mock-up was the argument for building it.

Three consequences worth knowing:

- **`to` and `externalUrl` are mutually exclusive**, and a test asserts it. The
  document-shape guards (same-origin `/prototypes/…`, the file exists in
  `public/`, one shared base) are scoped to rows WITHOUT `to` — so a new
  document row cannot skip them by quietly omitting `externalUrl`, which is how
  that guard would otherwise be lost.
- **It opens `?demo=1`, not the bare route** (2026-09-10). Demo mode swaps the
  working flag map for the COMMITTED baseline before first paint and suspends
  persistence, so the Demo row always shows the configuration this repo ships.
  Without it, a returning reviewer's own persisted toggles ARE the demo —
  silently — and the NAV is where that shows up first, since every rail item
  has a flag. Verified both ways in one browser: with Study Plan and Readiness
  toggled off and Podcasts on, the bare route honours all three and `?demo=1`
  renders the intended rail.
  It does NOT hide the Demo Controls bar (that gate is pathname-only), so a
  stakeholder can still switch persona / progress / readiness — those edits are
  just ephemeral, which is what a demo wants.
  **The one thing it cannot override is a saved "Set as default" snapshot.**
  `baselineFrom` reads `customDefaults[key] ?? catalogDefault(def)`, and that
  snapshot is per-browser and never committed — so a machine holding a stale one
  shows a different demo from a clean machine with nothing in the repo to
  explain it. If the demo looks wrong on one laptop only, clear
  `cgp.featureFlags.customDefaults`.
- **It has no `thumbnail`, so its row preview boots the app** in a scaled
  iframe. That is the cost `FeaturePreviewThumb` documents. It is accepted here
  because Demo holds ONE row and a live frame cannot go stale — the same
  trade-off the thumbnails README describes, landing the other way than it does
  for `xcel-admin-tool`, which is one of several rows in a section. Add a
  capture if Demo grows.
- **No `devStatus`**, same trap as the Exploration rows: `sectionOf` checks it
  before `category`, so authoring one silently moves this row off the front
  door.

### The Study Plan is its own page — moved 2026-09-09

The Study Plan was a TAB on the Learning Path page. It is now a rail section
(`study-plan`) sitting directly under Home, because it is the pacing tool a
learner opens every visit — which is why it was that page's DEFAULT tab before.
Same `InlineStudyCalendar`; what changed is where it lives, not what it is.

**Moved, not duplicated.** The tab is gone. Two doors onto one surface is what
got `recommended-card-ab-demo` and the four testing tiles archived, and a test
asserts the tab's absence so re-adding it without removing the page fails.

**One constant drives it**, `studyPlanHasOwnPage` in `LearningPathPage`, because
THREE things follow and they have to move together — the same failure mode the
`supportsStudyPlan` comment in that file describes:

1. The Study Plan tab goes.
2. **The Progress Tracker tab comes BACK.** It was hidden for XCEL only because
   its stats showed in the band above the calendar; that band left with the
   calendar, so without this the page has one tab and no progress view at all.
3. The default tab re-points, or a pre-licensing learner lands on Certificates
   with an unselected Progress Tracker to its left.

**The trap, and it bit during this change:** `StudyProgressPanel` was keyed on
`showStudyCalendar`, which was quietly doing two jobs — "is the Study Plan a tab
here" and "does this brand have study-plan progress to show". Switching the tab
off dropped the branch through to the Goal Tracker PLACEHOLDER, so the tab that
came back rendered nothing. It reads on `hasStudyPlan` now, and the test asserts
the placeholder is absent rather than only that the tab exists.

Which plan the page shows: `?id=` when present, else `activePathIdFor(brand)`.
XCEL has TWO paths with a plan, so without the param the section would silently
always show the first. A path with no plan is not an error — `InlineStudyCalendar`
renders its own empty state — and the rail item is gated on `supportsStudyPlan`,
so a brand without the feature never reaches it.

### Jump Back In — the Today's Tasks variant

`clp-jump-back-in` on the Dashboard Rebrand flag page. The white Jump Back In
card inside the full-width Current Learning Path band has two layouts:

- **Up Next** (default, shipped) — a 168px cover, then title / meta / progress,
  the Resume CTA, and the next two not-started COURSES.
- **Today's Tasks** — the resume block compressed to ~30% of the card (cover
  LEFT at 84×56, title and meta RIGHT of it, progress and CTA below), with the
  space given to today's tasks from the learner's STUDY PLAN.

**Continuing Ed shows tasks too, as of 2026-09-09** — see `ce-study-plan`
below. Before that the CE path had no plan and the card fell back to Up Next.

**`TaskRow` in a ~255px card needed a fix, and it shipped broken for two
commits.** Its status cluster is `flexShrink: 0` at ~110px, so the title column
collapsed to **48px** and `overflow-wrap: anywhere` broke words mid-syllable
("Insura / nce"). Pre-licensing titles were long enough to wrap badly but short
enough that it read as ugly rather than broken; a longer CE title made it
obvious. `compact` now sets `flexWrap: 'wrap'` and gives the title a 150px
floor, so the status drops to its own line. Nothing wraps at the Study Plan
page's width, so that surface is untouched.

**It requires the CURRENT PATH to have a plan, not just the brand**, and that is
the trap worth knowing. `studyCalendarFor` falls back to STC's Series 79 plan
for any id it does not recognise — its own docstring calls putting securities
tasks under an insurance path "the one outcome worse than the empty state". The
band shows whichever path is current, and XCEL's CE path deliberately has no
plan, so the first build of this rendered **"Complete Greenlight 1" under
Florida Life & Health CE**. Types were clean and every test passed; only opening
the page caught it. `hasStudyCalendarFor` guards it now and the card falls back
to Up Next, so switch Education to **Pre-Licensing** to see the variant.

**Two numbers are judgement, not measurement**, and both are named constants:

- The resume block lands at **~30%**, not the quarter it was briefed at. The
  floor is the CTA's 44px touch target — it is the biggest item in the block,
  and hitting 25% means making the primary action harder to tap.
- `TODAYS_TASKS_VISIBLE` is **2**, and it was 3 until the rows became the Study
  Plan's real `TaskRow` (2026-09-09). That component is ~112px in this column
  against the ~66px of the bespoke row it replaced — the title wraps to two or
  three lines in a ~250px card, and an in-progress task carries a progress bar.
  Measured at a narrow pane and at 1600px: **two either way**, and not a
  narrow-window artifact, because the card gets SHORTER as it gets wider (its
  height comes from the navy half). Three need ~356px against 249 available,
  and the difference cannot be bought from the resume block, which is 179px
  against a floor of ~126. **The row style and "up to three" are in conflict;
  the row won**, because matching the Study Plan was the later decision.

**The rows are the Study Plan's own `TaskRow` in `compact`**, not a lookalike.
This started as a bespoke row that merely matched the visual language; reusing
the real component is what keeps the two surfaces from drifting, and it brought
what the copy had missed — the status badge, the progress bar on an in-progress
task, the kebab, and the title-prefix affordances (Read / View / Complete). A
test asserts one of those rather than only that rows render, so a later
"simplify this row" cannot quietly re-fork them.

**The card is titled "Jump back in"**, in the same `eyebrowBase` as its own
"Today's tasks" heading and the navy half's "Current Learning Progress" — three
labels at one level of hierarchy. A test asserts the two eyebrows share a style
rather than only that both exist, because the regression is tweaking one and
skipping the other. The title is on the VARIANT only; the shipped Up Next layout
stays untitled.

**The heading carries the day's count** — "Today's tasks (2)" — and it is the
count of the whole DAY, not of the rows on screen. On an overflowing day that is
the distinction that matters: six scheduled, three shown. Omitted at zero, where
the empty state already says nothing is scheduled.

**View all is ALWAYS shown**, not only when the day overflows. It is the route
into the Study Plan from here, and gating it on the workload made that route
appear and disappear. It carries NO number — it used to read "View all 6", and
once the heading counted the day the two sat inches apart saying the same thing.

Two layouts were tried for the leftover height and both are wrong, so do not
re-reach for them: `justify-content: space-between` on the list opens a 139px
hole between two rows on a light day, and letting the cover absorb the slack
grows it to 174×116, which squeezes the title into three lines because the white
half is only ~250px wide. The cover stays fixed at 84×56 and the slack falls to
the bottom of the card, which is what a light day should look like.

### The logo is real now — and dark mode is not (2026-09-09)

`Logo` rendered the text wordmark "XCEL" from the migration until now, because
the artwork was not in the repo. It is: `/brand/xcel-logo.webp`, the approved
2024 lockup (`XCEL24_Logo_RGB_45px-2x` from the Colibri Logo Library), 248×91.

A **raster webp, not an SVG**, because that is the export that exists — 2.3KB,
crisp to ~124px wide, which covers every call site. Swap in the vector if the
lockup ever needs to go large.

**`sizeBy: 'height'`, and the default would have been wrong.** `sizeBy` defaults
to `'creWidth'`, which width-matches a reference lockup; at the header's 52px
that renders this 2.725:1 mark **304×112** — three and a half times the 72px
header's own height. By height it is 142×52. This is the exact case the
`sizeBy` docstring warns about, and a test asserts the numbers.

**The brand guide's 95px minimum WIDTH is load-bearing**, which is why
`MOBILE_LOGO_HEIGHT` in `Header` is **35 and not 34**: at 34 the lockup is 93px
wide. One pixel, and it is a consequence of the artwork's aspect — re-derive it
if the lockup is ever replaced.

**The `mark` variant is deliberately absent**, so `IMAGE_SOURCES` is now
`Partial` per variant. The square "White Knight" is separate artwork that is not
in the repo; pointing `mark` at the lockup would render a wide horizontal logo
wherever a square one was asked for. Nothing uses `mark` today.

**KNOWN GAP — the dark header, and it is older than this change.** The lockup is
full-colour: charcoal wordmark (#3a3a3a) and red knight (#9a1b1e), measuring
11.37:1 / 8.24:1 on white and **1.33:1 / 1.84:1** on the rebrand shell's dark
header (#152833). Invisible.

It is not a regression. The text wordmark it replaced sat on `--color-brand`,
which is `#2d5872` in dark — **1.99:1** on that same header. **Dark mode has
never had a legible logo here**; the lockup deepens an existing hole rather than
digging a new one. Recorded rather than papered over, because the two look
identical from the outside and only one of them is this change's fault.

The fix is the WHITE variation the brand library ships, dropped in as the `dark`
source — the swap mechanism is already built and needs no code. **Do not
recolour the full-colour file to approximate it**: that is authoring brand
artwork, and an official white lockup already exists.

### The week-summary band — "This week" (2026-09-09)

`StudyWeekSummary`, on Home directly **above Recommended for You**: the last
thing in the learner's own zone before the discovery zone starts. Behind
`dashboard-week-summary`, default on.

**ONE week as seven DAY CELLS, Sun → Sat** — the Study Plan's own month grid
with its current row lifted onto Home: same day order, same "today" treatment,
same task-count line.

**The first build was a list of WEEK rows** (theme, pips, status chip) and was
wrong. That answered "how is the plan going", which the Current Learning
Progress band directly above already answers. The question a learner scanning
Home is actually asking is **which DAYS have work on them**, and only a day grid
answers it. Same reason the cells show a COUNT and not task titles: the titles
are one click away, and seven columns of them is the plan itself.

**Empty days are shown, with an em dash rather than "0 tasks".** The empty ones
are the point of a calendar row — a blank Wednesday says "nothing due", which a
list of only-the-busy days cannot. A zero, meanwhile, invites the reading that
something failed to load.

**It is a SUMMARY, not a second Study Plan.** No per-task action anywhere; every
cell is a link into the plan, and a test asserts each cell contains links and NO
buttons. That guard is the whole thing keeping this from becoming a second place
to tick a task off.

**`studyWeeks` drops empty WEEKS**, so "this week" is the nearest week with work
rather than a literal date match — XCEL's CE plan is paced two days a week over
six months, and a strip of seven blank days is not a summary. `overdue` outranks
`in-progress` in a week's status, and OVERDUE outranks TODAY on a cell's flag: a
reviewer scanning the strip needs the problem to surface, and today's cell is
already the only filled one.

**`weekThemes` is AUTHORED, not derived.** Deriving a theme from the week's task
titles reads plausibly until a week spans two subjects, and then it names
whichever sorted first. A wrong label is worse than `Week N`, which is the
fallback.

**Each day carries its STATE, from the Study Plan's own rule.** `dayStatusOf` +
`STATUS_CHIP_COLORS` moved out of `InlineStudyCalendar` into
`studyStatusColors.ts` so both surfaces read one family — a day that shows
complete-green on the plan and neutral-grey on Home is exactly the drift that
file exists to prevent. The plan is still the reference; the colours moved, they
were not re-derived.

Precedence is **OVERDUE → IN PROGRESS → COMPLETED → UPCOMING**, an attention
order rather than a progress one: a day holding one late task and three finished
ones is a day with a problem. It matches the plan's own `STATUS_CHIPS` order.

**Never colour alone.** The dot says the state in hue and the flag says it in
words (DONE / IN PROGRESS / N OVERDUE), and the accessible label carries it too.
The flag's precedence puts state ABOVE `TODAY` — today's cell is already the
only filled one, so on a day in progress the more useful word is IN PROGRESS —
but the label reports today unconditionally, which is what a test asserts.

**The footer carries "Week 4 of 9"**, so seven day cells never imply a one-week
plan.

**Its `Wrap` needs `width: 100%`, and that is not cosmetic.** `Wrap` sets
`margin: 0 auto`, and an auto margin on the CROSS AXIS of a flex column
overrides `align-items: stretch` — the item collapses to its content width.
Every other `Wrap` on this page sits inside a `<section>`, a block container
where auto margins simply centre it, so none of them hit this; as a direct child
of the overview's column, this one rendered 483px against its siblings' 993.
`maxWidth` still caps it at the same 1200 the others use.

**It reads the persona's path**, the same one the Study Plan section resolves,
so the two cannot describe different courses. Guarded by `hasStudyCalendarFor`
rather than `supportsStudyPlan` — the same trap the Jump Back In card hit, where
`studyCalendarFor` falls back to STC's Series 79 plan for an unknown id.

### `dashboard-recommended` — hiding the Recommended band (2026-09-10)

An enable toggle for the whole "Recommended for You" band on the overview,
default on. Off removes the SECTION, header included — a section lead over
nothing reads as a load failure, which is what the test asserts on rather than
on the cards.

**It sits above the three flags that tune it** in the catalog
(`dashboard-recommended-blurb`, `-carousel`, `home-recommended-card-ab`) because
it gates them: with the section off those three control nothing, and a reviewer
flipping them to no visible effect is the confusion the ordering avoids.

**It is NOT `nav-show-recommended`.** That one hides the rail item for the
Recommended for You PAGE; this hides the band on Home. A reviewer can want
either without the other, and a test pins that they are independent — wiring one
control to both is the plausible mistake.

### The "Busy study plan" persona (2026-09-10)

A dense demo state — 37 study-plan tasks across five weeks — for showing the
week strip, the Study Plan and Today's Tasks with real volume.

**A PERSONA, not a fifth dropdown**, and that is the call worth recording. Plan
density is a property of the PATH, and the Education axis already selects the
path: the CE path the demo opens on is a renewal cycle paced two days a week
over six months, which is true to that product and is exactly why it looks
sparse. So this needs no new data and no new axis — it is a named combination
of controls that exist (`dashboard-education-type: exam-prep` +
`progress-on-track`), which is precisely what `DEMO_PERSONAS` is for. A fifth
dropdown on a bar that already has four would be paying chrome for a
combination.

**It is five weeks, not four.** The pre-licensing plan is a real 20-day
schedule against a booked exam date; compressing it to four weeks means either
a denser-than-real pace or moving the exam. The value — a busy plan — is there
either way, so the fixture was left alone.

A test asserts the plan behind the persona has 30+ tasks AND that no single
week holds more than half of them: 37 tasks on one Tuesday would satisfy a
count and demonstrate nothing about a week strip.

### `clp-jump-back-in` now defaults to Today's Tasks

Flipped 2026-09-09. It sat on `up-next` for a day, which meant clearing local
flag state silently reverted the card to the shipped layout — the tasks variant
is the one this demo is about, and Up Next is the comparison.

### Exam Readiness — the Figma port (2026-09-09)

`ReadinessPanel`, from Figma **"Exam Summary"** (`woOd62dQQyPvtqJ6ZRO0qF`).

**The three node URLs are ONE screen**, not three: nodes 1092:230527 /
:230931 / :231435 are the Readiness Score screen in the three states of its
Chapter & Topic filter (I Should Review / I Know This / Show All). The filter is
therefore the part of the design that is specified three times, and the part
most worth guarding.

**Three departures from the design, all deliberate:**

1. **The five top tabs are gone** (About the Course · Instructor · Author ·
   Regulatory Requirements) — the direct ask. They are course-detail tabs; this
   is a section of the learner's own dashboard, and four of the five have no
   content here.
2. **The design's LEFT SUB-RAIL became the tabs.** It carried navigation
   AND content in one column — a second rail inside the shell's content column
   would sit beside the platform rail already there, which is the gutter cost
   the account sections pay with `AccountSubNav`.
3. **Study Tips folded into What to Expect; Final Exams into Practice Exams.**
   The three-tab set leaves the design's other two sections homeless and these
   are the joins that hold.

**Insights is its own tab, and it is SECOND** (added 2026-09-09, straight after
the port). The Chapter & Topic Breakdown sat below the score, on the design's
one long page. Promoting it changes what it IS: below a score it reads as
supporting detail; on its own it is the worklist a learner opens between study
sessions. Order carries the same argument — anywhere after "What to Expect"
buries the answer behind exam-day logistics. A test asserts the tab SEQUENCE,
not just that four tabs exist.

**The split has a cost, and the hand-off link is the payment.** The score's copy
says "aim for the green"; the screen that says WHICH green is now a click away
instead of the next thing down. `ExamReadinessTab` ends with "See what to
review →", which switches tabs. Remove the split and the link goes with it —
do not leave one without the other.

**Practice and licensing attempts stay two lists, and that is not cosmetic.**
It is the same split the FinServ exam task-type spec found in `StudyTaskKind`:
the existing `'exam'` means the PRACTICE exam, sat in the LMS and scored by us,
and the external licensing exam needs its own key. Practice attempts feed the
readiness score; a PSI attempt only reports an outcome. Merging them into
"attempts" is the regression a test guards.

**The frequency sentence is NOT from the design, and has to stay.** The Figma
explains what goes INTO the score and stops. The XCEL learner walk-through had
already answered the harder half — its readiness screen states a FREQUENCY
rather than a probability ("an estimate, not a prediction · about 7 in 10 passed
first time") precisely so a score cannot be read as a promise. That decision is
older than this screen and survives it; `READINESS_FREQUENCY_NOTE` carries it.

**`REVIEW_THRESHOLD` 60 / `STRONG_THRESHOLD` 80 are INVENTED.** The design shows
the colours and states no rule, and XCEL has published none. One `bandFor`
drives the filter, the chapter dots, the topic bars and the gauge's active band,
so a chapter can never sit in "I Know This" wearing a red dot. Replace with the
real thresholds; do not tune them to make a screenshot look better.

**`ReadinessScoreGauge` — the widget spec build (2026-09-09).** Replaced the
240° `ReadinessGauge` outright rather than sitting beside it: two gauges for one
number is the fork this repo keeps paying for. A 180° band-coloured arc with a
threshold tick, a value marker, the numeral, a "N to pass" sub-label and a
status chip, at three sizes, with loading / no-score / animated-mount states.

**The arc is a TRACK, not a value fill**, and that is the load-bearing idea: both
bands paint full length at full opacity, and the score is carried by the marker
and the numeral. A progress-style fill would say "you have completed 47% of your
readiness", which is not a thing — readiness is a position on a scale, and the
scale has to stay visible for the position to mean anything. A test asserts the
two dash arrays sum to the arc length, so a later "make it fill" fails.

**Flat stroke caps, not round** (2026-09-09). Round caps were not just a
rounded outer end: each dash extended half the stroke width at BOTH ends, so
the amber bled past the pass mark into the green and the green bled back under
it — the two bands overlapped at exactly the boundary the tick exists to mark.
`CAP` is one constant covering both bands and the tick, because a flat-ended arc
beside a round-capped tick reads as an oversight rather than a choice.

**Two things the brief asked for were declined under its own rule 0.1** (match
the app, do not introduce a styling system): the per-component folder and the
`.module.css`. This app uses inline `CSSProperties` and flat files under
`src/components/<area>/`. Only the `.types.ts` split survived, because tests
import the types.

**`StatusBadge` gained an `error` tone** rather than the chip being hand-rolled.
Every other functional tone was already there; `error` was simply the gap, which
is the whole reason a bespoke pill would have looked justified.

**The brief contradicted itself, and the mock won.** It set the at-risk window at
`passingScore - 10` (flagged `{{CONFIRM}}`) and then required 62/75 to read
AT RISK — thirteen points below. `AT_RISK_FRACTION` is **0.2 of the range**,
which satisfies every acceptance case and answers the brief's other open half:
an absolute window would make most of a 0-40 scale "at risk", where a fraction
says the same thing at both sizes. Still invented.

**The score column is the WIDE half of that row** (2026-09-09). It was an even
split (`1 1 320px` against the stats' `1 1 280px`), which left the `md` gauge
floating at 206px in a 262px card with the extra width going to padding. It now
takes `1.4 1 360px` AND the gauge steps to `lg` (276px) — **those two go
together**: widening the card alone just widens the whitespace, and stepping the
gauge up alone clips it. The row still wraps, and both columns keep a
`minWidth`, so a narrow shell drops the stats below the card rather than
squeezing it under the gauge's own minimum.

**The Demo Controls bar has a READINESS dropdown** (2026-09-09) — Not Started ·
Off Track · At Risk · On Track, driving `readiness-state`, **default On Track**.
Deliberately NOT in the flag panel's rebrand scope, the same call
`dashboard-progress-state` and `dashboard-education-type` made: a control that
already sits in the always-visible bar is a redundant, worse copy in the panel.
It is also not in the share-link codec — those two are the dashboard's headline
axes that every shared link carries, and this one belongs to one section.

**It is a different question from the PROGRESS dropdown**, and the two are
independent on purpose: progress is how far through the COURSE you are,
readiness is how ready for the EXAM. A learner can be 90% through and not ready,
which is the entire reason this section exists.

**`not-started` is not a low score, and the fixture makes that structural.** The
gauge shows no score and NO chip (a zero would earn OFF TRACK), the breakdown is
empty, there are no attempts, the progress figures are zeroed, and the "See what
to review" hand-off is suppressed because there is nothing over there. The
incoherence being avoided is the CE path's old one — a gauge claiming something
the lists below it cannot support.

**Course progress follows HOME, and it took two tries to land.** It was authored
per readiness state (0 / 45 / 90 / 100), so Readiness claimed 100% while the
Study Plan two rail items above said 32%. The first fix pinned it to the Study
Plan's `progressPct` — also wrong: that counts TASKS in one path's calendar,
while Home follows the `dashboard-progress-state` demo axis and the education
type, so flipping the Progress dropdown moved Home and left Readiness still.
`useReadiness` now resolves the persona through `dashboardProgressPersonaFor`
with the same two flags `MembershipOverview` reads.

**`displayedProgressPct`, not `path.progressPct`.** The band sums the path's
CATEGORY hours and only falls back to the authored field — and the two differ:
the At Risk / Exam Prep persona's field is 14 while… also 14, but the QE persona
is 15 against a field of 15, and the expression was copied inline in THREE bands
(`LearnerFocusedBand`, `ClpJumpBackInBand`, `MarketingFocusedBand`). It is one
exported helper now, used by `LearnerFocusedBand` and Readiness; folding in the
other two is the obvious next tidy.

**Course progress follows the PROGRESS axis; the score follows the READINESS
one.** That separation is the section's point — how much of the course you have
covered and how well you are answering are different facts, and a learner can
be far along and not ready. The readiness states move ANSWERED CORRECTLY, never
the progress figure.

**Beware the demo bar when checking these by eye.** The Progress dropdown's own
label is an APPROXIMATION ("On Track · ~63%", "At Risk · ~15%") and the gauge is
exact (64%, 14%). Scraping the first percentage on the page reads the label, not
the band — which is exactly how a false "Home and Readiness disagree" reading
got produced during this change.

**The bar is the shared `ProgressBar`, not a lookalike.** Readiness had drawn
its own 3px green track, so one learner's one 32% rendered as two different
bars a rail item apart. `ProgressBar` was extracted from `ProgressInline` in
`StudyCalendarStatBand` — where the treatment was defined and still is the
reference — and that component now composes it with its `32%` label. Duplicating
the percentage was the only thing that had stopped the reuse.

**Extracting it broke the bar, and only opening the page caught it.** The style
carried `flex: 1` because it lived in a flex ROW beside a label; dropped into
Readiness' flex COLUMN that resolves to `flex-basis: 0%` on the CROSS axis, so
the bar rendered at ZERO height with `height: 8px` still on the element. tsc was
clean, and the test asserting `style.height === '8px'` passed while the bar was
invisible — jsdom has no layout. `ProgressBar` is layout-neutral now
(`width: 100%`, no flex) and consumers that need it to grow wrap it; the test
asserts THAT rather than the height.

**The Insights topic bars deliberately stay thin.** They are SCORES, not
progress — band-coloured, and fourteen in a column where 8px would turn a
scannable list into a stack of blocks. Same reasoning as the gauge dropping red
while the chapter dots keep it: a different job is allowed a different
treatment.

**The STUDY PLAN follows Home too, as of the same day — and the harder half was
that it was showing a DIFFERENT COURSE.** `StudyPlanSection` resolved its path
with `activePathIdFor` (always the first), so at the default settings the
dashboard showed the CE path while the Study Plan showed the PRE-LICENSING
plan: two rail items apart, describing different courses, with nothing on
either screen saying so. Matching their percentages would have been meaningless
while that was true. The section reads the persona's own path id now.

**The guard on that id has a trap in it.** It must validate against
`learningPathsFor(brand)`, NOT the `useLearningPathSummariesForBrand()` list —
that one is filtered by `learning-paths-count` and holds a single entry by
default, so checking membership there rejected the CE persona's id and fell
silently back to pre-licensing. The `?id=` param still checks the visible list,
because that is a user-supplied value.

**The Progress tile now takes `coursePct`**, defaulting to the plan's own task
count for every other embed. The "Tasks Completed" tile beside it still counts
tasks (3 / 10 against 63%), and that is not a contradiction — the two tiles are
labelled as the different things they are. What was wrong was a tile labelled
*Progress* disagreeing with every other Progress in the app.

**`ProgressAgreement.test.tsx` is a cross-surface test on purpose.** Each page's
own tests were green while the three disagreed — 63 / 32 / 100 — which is
precisely the failure a per-page suite cannot see. It sweeps every Progress
persona rather than asserting today's default, because a surface hardcoded to
the default passes until a reviewer flips the dropdown, which is the first
thing a reviewer does.

**The three scored states SHIFT one chapter set rather than authoring four.**
A learner's relative strengths do not change with their overall standing: the
chapters that are hard stay hard, and what moves is the level. Four independent
sets would say a stronger learner is strong at DIFFERENT things, which is not
what a readiness score means. A test asserts the ordering survives the shift.

**Adding these tests found a real gap:** `ReadinessPanel.test.tsx` had been
rendering without `FeatureFlagProvider`, so `useFeatureFlag` fell back to
catalog defaults and every state seeded into localStorage rendered as On Track —
the demo-state tests passed for the wrong reason until the provider went in.

**Unresolved, deliberately not guessed:** the mock's softened green (#63bc8e) is
not reachable — `--color-success-500` is the lightest stop on that ramp and is
materially deeper, so closing it needs a new ramp stop, not a literal. The
marker ring takes the ACTIVE BAND's colour rather than the mock's fixed teal, on
the grounds that a fixed hue is a fourth colour with no meaning; one line to
reverse. No feature flag: the section's only gate is `nav-show-readiness` (rail
visibility), and gating the gauge separately would leave the tab headless.

**The gauge had NO red before this and still does not** (restyled 2026-09-09 to
a supplied reference). It shipped as the design's red / amber / green;
red is gone because this number is the learner's OWN standing, and a
learner mid-course is below the mark by definition — a red arc for being where
you are supposed to be reads as a verdict rather than as distance still to
travel. The walk-through had already settled that for this screen
("probabilistic, and it has to say so without discouraging").

**Red did not leave the page**, and the divergence is deliberate: chapter dots
and topic bars keep it. Red on a CHAPTER is actionable — it names a specific
thing to fix — while red on YOU is just discouraging. One surface is a worklist
and the other a self-assessment; they are allowed to speak differently.

Amber runs to **`PASS_MARK`** and green from there. That is 70, the Florida 2-15
figure the state sets — the only number on this page that is not invented — so
green means "at or above what you must clear" rather than "above a number we
chose", which is what the invented `STRONG_THRESHOLD` of 80 meant. A tick marks
the boundary and the caption names it ("70 to pass"). `EXAM_FACTS` reads the
same constant: the two sit one tab apart, so nobody sees both at once, which is
exactly where a second literal would rot unnoticed. A test asserts they agree.

Both bands render at FULL strength. The three-band version dimmed the inactive
ones to say "you are here"; with two bands the marker and tick already say it,
and dimming the green made the target the dullest thing on the arc — the
opposite of what "aim for the green" asks. Green is `--color-success-500`, the
lightest stop on that ramp; there is no `-400`, so a lighter green needs a new
ramp stop, not a literal.

**The gauge is a new component, not `ProgressDonut`.** That one is a closed ring
split into category segments ("how much of each kind"); this is an open 240° arc
carrying a red→amber→green ramp ("how good is this number"). They look alike and
mean different things. The ramp is three fixed bands rather than a gradient
because the bands ARE the thresholds — a gradient blurs the boundary the score
is being judged against.

**The content is XCEL's, not the design's.** The Figma is a real-estate course;
these are Florida 2-15 Life & Health chapters, and the practice exams are the
three Exam Simulators `learningFixtures` already puts in that path. The
`EXAM_FACTS` carry a `TODO(data)` — they are the published Florida figures, not
a feed, and want confirming against the current PSI bulletin.

### Readiness — how the section was registered (2026-09-09)

**Superseded within the day by the section above** — it is no longer blank. Kept
because the sequence is the point: registering a section with an `EmptyState`
first, then swapping ONE `renderBody` branch for the real panel, is what made
the port a single-file change. The note that said "nothing else about the
section needs to move" turned out to be exactly true.

A rail section (`readiness`) directly after **Study Plan**: the plan is the
work, this is where you find out whether the work has got you there. It renders
an `EmptyState` and nothing more — there is no readiness model in the fixtures.

The five registration points are the same ones Resources needed:
`PlatformSection`, the rail item, `VALID_SECTIONS`, `SECTION_TITLES`,
`renderBody` — plus a `NAV_SECTION_FLAGS` entry. Replace the `renderBody`
branch with the real panel when it exists; nothing else about the section has to
move.

**It is NOT gated on a capability predicate**, unlike the Study Plan row above
it (`supportsStudyPlan`). That is deliberate rather than an oversight: there is
nothing behind it to gate on, and inventing a predicate now would be committing
to the shape of a feature nobody has designed. Its nav flag is the only gate
until a real fixture exists — wire the predicate then, beside it.

**The demo-rail test caught this before it landed**, which is what that
assertion is for: a row cannot join the baseline without failing
`NavSectionFlags.test.tsx` first and being re-decided. Readiness is ON in the
demo because a stakeholder is meant to see it is coming.

**The icon is `gauge-high`** (FA 7.3.1 light), registered as `Gauge`. The
`-high` needle is the load-bearing part: plain `gauge` points its needle
straight UP, which at the rail's 17px reads as an arrow in a circle rather than
a dial. Compared against `gauge`, `gauge-simple`, `gauge-max` and
`gauge-simple-max` at 17 / 24 / 48px before choosing.

It briefly shipped as a 6.6.0 `gauge-simple-high` — same needle, no tick dots,
picked on the assumption the ticks would mush at 17px. The supplied 7.3.1 file
keeps them and they hold up: its dots are rounder and better separated than the
6.x ones, and it matches the ~70 other 7.x icons in the registry.

A needle pinned high could be read as claiming the learner IS ready. Discounted:
a rail glyph names the topic, not a value — `Award` next to Certificates does
not mean you have one — and the alternative failure (not reading as a gauge at
all) is worse.

It replaced `Flag`, whose vendored FA 7.2.0 asset is **clipped**: `flag.svg` is
`viewBox="0 0 448 512"` but its path starts the pole at `x=-8`, so the left edge
of the pole is cut flat. That is not a Readiness problem — `Flag` still renders
in the Feature Flags panel, the admin tools menu, `MembershipStatBar`,
`LearningRecapBadge`, `ConsistencyCard` and `RubiAiBand`, and it is clipped in
all of them. The minimal fix is `viewBox="-8 0 456 512"`, which keeps the FA7
drawing and shifts centring by under 2%; re-vendoring FA 6.6.0's flag also works
but is a different drawing.

The shell's `<h1>` and the EmptyState's own title both read "Readiness", so the
word appears twice. That is the existing Podcasts pattern, matched on purpose —
if the doubling is worth fixing it should be fixed for both, not just here.

#### The journey rail lost its blocked meta, and its two completion stops became one (2026-09-16)

**Blocked stops render NO meta line.** Every stop after the current one is
blocked, so all of their meta lines ended in the same four words — four stacked
rows of "· After your coursework" under four titles, a paragraph of repetition
where the point was a sequence.

The trade-off is real: those lines also carried Part 2's 80% target and Part 3's
"3 simulators, aim for 85%", which now live only on the requirements sheet the
block links. The blocked REASON survives on the row's `title`, and `statusWords`
still returns it — only the rendering stopped.

What makes the rule safe rather than arbitrary: **blocked and not-started never
appear together here**, so the missing words are not what would have told two
visible states apart. If a path ever mixes them, the words have to come back —
that is the "never colour alone" rule, and this is an exception the data
currently permits rather than a repeal.

**"Attestation & Certificate" is ONE stop**, from two. They are still two ACTS in
XCEL's published certificate-eligibility rules and nothing about that changed;
they are one MOMENT on this rail — done back to back, unlocking together,
neither ever true without the other. Two rows spent two of the journey's five
stops on one wrap-up, and with the blocked meta gone they were two long titles
saying "certificate" twice. Splitting them back is re-adding one entry to
`COMPLETION_STOPS`.

#### The columns are 660 : 380, from 514 : 407

They were near-even because they were once two halves of one band. They are not:
the LEFT column carries the art, the title, the meta, the progress bar, the
Resume CTA, three KPI cells and a status strip; the right is a list of short
rows and gives width up cheaply. Measured after: 515px against 296px in the
pane.

**There are TWO `gridTemplateColumns` in `LearnerFocusedBand`**, and the first
belongs to the completed-celebration branch, which renders something else
entirely. It got the edit first and the symptom was the left column getting
NARROWER — because the live grid had not moved at all. A test asserts exactly
one of the two carries the new ratio.

### `dashboard-course-header` — the page header band (2026-09-16)

A fourth variant axis, and the only one whose default is OFF: `none` · `band`.
A full-width header above the whole overview — the meta on one line, the course
name as a 28px heading, two actions right, and a rule under the lot.

**Off by default because it says the course name TWICE** — this and the Current
Course Progress block's own heading a few lines below. That repetition is the
QUESTION the variant asks (should this page read as a COURSE or as a dashboard?)
rather than an oversight, which is exactly why it cannot be the default answer.
A test asserts the name appears once when the flag is off.

**NO action of its own — the band is a title, and that is all it is.** Three
things were tried there and all three left:

- **"DFS Statutory Rules →"** — there is no confirmed DFS URL in this repo. The
  button opens the **requirements sheet**, which is a surface we can actually
  reach, labelled "State requirements".
- **"Syllabus (PDF)"** — the PDF XCEL links is a 7-day study PLAN, not a
  syllabus. It shipped for one build as "Study plan (PDF)" — true, and pointing
  at `NY_LH_STUDY_PLAN_URL`, the URL the product page gives under "Read our
  recommended study plan" — and then went: a lone relabelled button beside a
  real one is worse than not offering it. The URL is still recorded in the
  fixture, so wiring it back is one element.

**THE BLOCK BELOW DROPS ITS WHOLE HEADER while the band is on** (`hideHeader`).
It started as `hideCover` and grew: dropping only the picture left the course
NAME, the meta line and a second progress bar repeating the band three inches
above them. What survives is everything the band does not have — the Resume CTA,
the KPI cells, the status strip, View Requirements — so the block now opens on
"Resume course". A test asserts the block prints no "% Complete" at all, which
is what "one course, said once" means.

**A FULL-WIDTH PROGRESS BAR sits under the title** (2026-09-16), with the figure
on the TITLE'S OWN LINE — the number and the name it belongs to read as one
statement, and the bar then tucks under both at `marginTop: 10` rather than
floating a row away from each. It was in the bar's own row on the right for one
build. It spans the whole band rather than sitting in the title
column, which is what makes it read as the PAGE's progress rather than as one
more thing beside the name.

It reads `displayedProgressPct`, the **same resolver the block below uses** —
not `path.progressPct`. Those two differ (the band sums the category hours and
falls back to the authored field only when there are none), and a page header
disagreeing with the block three inches under it is precisely the defect
`ProgressAgreement.test.tsx` exists to catch. A test asserts both say the same
number.

It is the shared `ProgressBar` with the page-grey `track` override, for the
reason the block's own bar needed one: the default track is 1.08:1 on this
ground.

**It is INDENTED past the cover** so it starts where the meta line and the title
do rather than under the picture — aligned, it reads as belonging to the course
name above it; flush left, it reads as belonging to the image. Measured: meta,
title and bar all at x=448. The cover's width and its gap are CONSTANTS
(`COURSE_HEADER_COVER_W` / `_GAP`) because three things depend on them — the
image, the gap, and this indent, which has to clear both. Three literals is how
that alignment drifts the next time the art is resized.

- **"State requirements →"** replaced them, then moved to the FOOT of the Get
  Licensed card (2026-09-16). Up there it was an action without a subject, three
  sections above the thing it elaborates; at the foot of the card about what the
  state requires, it is the next thing to read. It renders in BOTH journey
  variants — only the syllabus one draws a card around the section.

**THE COURSE ART LIVES HERE when the band is on.** It was beside the block's own
title below; with the band on, that put the picture next to the SECOND naming of
the course rather than the first. `hideCover` on the band drops it there — one
course, one picture, the same duplication rule that folded the Jump Back In card
into the block.

The actions are outlined rather than filled: the page's primary action is
Resume, a few lines below, and two filled buttons above it would argue with it.

### `dashboard-journey-style` — the syllabus treatment (2026-09-16)

A third variant axis, for the Study Journey rail AND the Get Licensed section it
sits above: `default` · `syllabus`. To a supplied reference.

`syllabus` is a formal restyle — a bordered card headed **"Complete Course"**
under a wide-tracked **"Study Journey"** eyebrow (it read "Syllabus sequence"
over "Study Journey" for one build; the eyebrow now matches the section's own
`aria-label`, and the heading says what the section is FOR — the rail's job is
getting the course finished, and the licensing card below picks up after that), **"Milestone 0 / 4 Complete"**
instead of a bare count, **numbered nodes** (01, 02 …) with the active one
filled, serif row titles prefixed with their number, a green **percentage chip**
on the stop in progress, a "Part 2" / "Part 3" label on the blocked ones, and a
**meta line on every row** — including blocked ones, which the compact rail
drops. Get Licensed becomes **"Get Licensed in New York"** with per-step cards
and labelled facts ("Vendor: PSI · $40 exam fee").

**`jurisdictionName` is a two-entry map, not a 50-state table**, and it falls
back to the CODE. A path carries `state: 'NY'`; expanding that to "New York" is
presentation, so it lives beside the requirements rather than on the path, and
an unmapped state reads as "NY" rather than as a blank or a guess.

**TIGHTENED 2026-09-16, later the same day** — three things, all against the
reference:

- **Fewer words per row.** `metaWords` prints group · count · status, which on
  this treatment says everything twice: the group is already the row's title (or
  the "Part 2" label on its right) and the status is already the chip. Row 1
  read *"Pre-licensing Course · 26 / 42 lessons · In progress · 62%"* beside a
  title saying "Pre-licensing Course" and a chip saying "62% In progress"; row 2
  read "Part 2 · …" beside a label saying "Part 2". `leanMeta` keeps only what
  appears nowhere else: the count in words, the published target, the unlock
  condition.
- **Lighter, larger titles.** A heading face at 700/15 in a 296px column wrapped
  every title to three lines and read as shouting. 600/16 sits closer to the
  reference, which uses a book weight for rows and saves the bold for the
  section heading. The title row also **wraps** now, so the chip drops to its
  own line only when the title needs the room — the column is 296px since the
  band's grid moved to 660:380, and a chip holding ~110px of that left the title
  ~150.
- **Get Licensed is its OWN card**, under a "Post-course process" eyebrow, and
  the widget drops the hairline between them. What changes between the two
  sections is WHO owns the work — XCEL, then the state — and a card boundary
  says that more plainly than a rule does.

**IT CHANGES NO DATA.** Same stops, same titles, same numbers. It does not split
"Attestation & Certificate" back into the two rows the reference shows, because
the merge was a data decision and a style variant must not quietly undo one. A
test compares the rendered titles against `journeyStopsFor` to hold that.

**What the reference has that is deliberately NOT reproduced:** "Foundational
jurisprudence", "Mandatory sworn affidavit of identity & contact hours", "Formal
pre-licensing completion certificate required for testing", and a course code
("Code: NY-INS-L&H-2026"). The first three are claims about New York practice
and the last is a record number; nothing in the fixtures sources any of them.
What each row says instead is what `metaWords` already knew. A test asserts the
copy is absent.

### `dashboard-clp-stats` — the stat card (2026-09-16)

A SECOND variant axis, for the Target Date / Time Remaining / Completed cells
and the status below them: `default` · `stat-card`. Separate from
`dashboard-clp-style` on purpose, so the header treatment and the stats
treatment combine rather than multiplying into one list of pairs.

`stat-card` gathers the three cells and the status onto one white card with a
hairline border and a rule between them, gives each cell a **sub-label** under
its value, prints Completed as a **two-tone fraction** (the unit moves to the
sub-label, so the value is a bare "26 / 42" with the denominator dimmed), and
runs the status pill **uppercase on an untinted row**.

**`StatusStrip` gained a `bare` prop** for it. A tinted row inside a white card
reads as a second card, and the card is already the surface. The pill keeps its
tint, which is what carries the state — the wash never did (its own note records
~1.02:1, i.e. decoration).

**The pace line is DERIVED, not authored.** "~1.5 hrs/day suggested pace" is the
state's real 40 credit hours (carried on the resume course, since the path
measures lessons now) over the days remaining. It is omitted rather than guessed
when there is no course to read hours from.

**What the reference has that is deliberately NOT reproduced:** "You are
currently pacing 4 days ahead of schedule. Maintaining this velocity ensures
completion prior to your statutory window." Nothing in the fixtures knows a
schedule to be ahead of, and the status message is the one the shared
`statusMessageFor` returns. Authoring the claim would be the move this version
has refused throughout — a test asserts the copy is absent.

The other sub-labels are LABELS, not claims: "Your exam target date", "Lessons of
this course". They say what the number is, which is the whole reason the
treatment has room for a third line.

### `dashboard-clp-style` — three treatments of the block (2026-09-16)

A variant flag on the Current Course Progress block, to a supplied reference (a
dark resume card with a big percentage on the right). Variant-only, like
`dashboard-heading-font`: `default` · `big-number` · `navy`.

- **default** — unchanged. Art left, title and meta right, the bar under the
  meta with the percentage beside it.
- **big-number** — same light ground; the percentage becomes a 40px figure in
  its own right-hand column, with the bar and "26 of 42 lessons complete"
  beneath it. The inline bar+label goes, so the number is still drawn once.
- **navy** — the same cluster on a `--color-primary-700` card: light type, a
  green bar, the big figure right, a **white** Resume button (the primary
  gradient is this card's own colour, so the button would vanish into it). The
  KPI cells, status strip and View Requirements stay on the page grey below, so
  the variant dresses the cluster rather than the whole block.

**No variant invents lesson-level content.** The reference shows "Lesson 27 —
Life insurance policy provisions · 14 minutes left in this lesson"; there is no
lesson title and no per-lesson timing in the fixtures, and authoring one is the
rule this version has held throughout. A test sweeps all three variants for that
copy.

**Navy drops the cover**, as the reference does — and that is what gives the
title room. The percent column is **160px, not 200**: at 200 the title column
was left ~140px and "New York Life and Health Pre-licensing" wrapped to five
lines, the number winning an argument it should not have been in.

**THE `metaRow` SEAM FAILED AGAIN, in the opposite direction.** That row is
assembled ABOVE the surface-specific markup, so a treatment applied by sweeping
that markup misses it. It shipped white-on-page-grey at ~1.2:1 when the page
surface landed; here it kept the PAGE's `--color-text-secondary` on the navy
card and measured **2.13:1**. Both were invisible to tsc and to every other
test, and both were caught only by reading the computed colour in a browser.

It resolves through `nMuted` / `nLine` now — which is the argument for those
existing at all rather than each block picking its own ink: a third treatment
resolves here too. After the fix every navy value measures **12.25:1**.

**One stale literal went with it.** The no-breakdown fallback read
"{completed} of {required} **hours** complete" as a hardcoded word, which had
been wrong since the unit moved — it printed "26 of 42 hours complete" under a
bar labelled in lessons — and it leaked into the navy variant, where
`resumeInline` is null and this was the else-branch.

### `dashboard-heading-font` — serif headings, as a variant (2026-09-16)

A variant flag on the Dashboard Rebrand overview: **Sans** (default, the brand
face) ⇄ **Serif**. Scoped to `dashboard-rebrand` and in the panel's rebrand
scope.

**It re-points ONE token for a subtree**, which is the whole implementation:
`MembershipOverview` puts `.cre-dash-serif-headings` on its root, and that class
declares `--font-heading: var(--font-heading-serif)`. Custom properties cascade,
and an inline `font-family: var(--font-heading)` resolves against the value the
element INHERITS — so every heading inside switches, inline styles included,
with no component knowing the flag exists. The alternative was threading a font
prop through the band, the two widgets, the section leads and the cards: a dozen
call sites for one choice.

**Scoped to the overview root on purpose.** The shell's `<h1>`, the left rail
and the header keep the brand face, so both faces are on screen at once — which
is the comparison a reviewer flipping this actually wants. Verified: band and
widget titles Georgia, rail Open Sans, page title Lato.

**Variant-only**, like `learning-path-status-display`: `defaultEnabled: true`
and the CHOICE is the variant. A separate on/off would be two controls for one
decision, and "off" would have to mean "sans", which the variant already says.

#### The serif is a STAND-IN, and this is the part not to lose

**The reference is the live xcelsolutions.com heading, which is Amasis MT — and
this file already says not to reproduce it.** The XCEL typography note in
`tokens.css` records it as OFF-BRAND: *"the LIVE SITE's Amasis MT serif headings
are OFF-BRAND (Amasis appears nowhere in the guide). Do not reproduce them."*
It is also a Monotype face that is not licensed to us and is not on Google
Fonts, so it could not be reproduced faithfully in any case.

So `--font-heading-serif` is a **system stack** (Georgia and its cousins), and
two things follow:

- **No asset and no request.** Every face in it ships with the OS, so the
  variant works offline, inside the Demo frame, and on a machine that has never
  reached Google Fonts. Adding a webfont for an exploration flag would make the
  DEFAULT view pay for a variant nobody has chosen.
- **It answers "what do serif headings look like here", not "here is that
  face".** Which is what a variant is for. The caveat is in the flag's own
  DESCRIPTION, where the person flipping it will read it — not only here — and a
  test asserts both the description and the tokens.css note still say it.

Repointing the token at a licensed face, or at a Google family added to the
existing `<link>` in `index.html`, is that one declaration.

**Worth remembering when reading this:** XCEL's `--font-heading` is itself a
placeholder. The brand's face is **Avenir** (Linotype, unlicensed to us); the
app ships STC's **Lato** because it was already loaded, with **Nunito Sans** as
the intended substitute. So "Sans" here means the placeholder, not the brand.

### The rail profile header is unwired (2026-09-16)

The pinned top region of the dashboard rail — the learner's 48px avatar with its
Brick `brandRing`, "Welcome back, <name>" as a button to the Profile page, their
motivational statement, and the divider under the group — is gone from the rail,
at Jillienne's request.

**It is the other half of the change above.** The header's account trigger
gained the learner's photo AND name the same day, so this was the second
portrait-and-name of the same person in one viewport, a few hundred pixels
apart. The rail opens on **MY LEARNING** now, which is its job.

**Archived, not deleted** — `ARCHIVED_ITEMS` id `nav-profile-header`.
`NavProfileHeader` is **exported** rather than left as an unreferenced local
function, because that is a lint error; it is the same treatment
`MotivationalStatementCard` gets on the Profile page. Nothing inside it changed.

**Three things travelled with it, and the restore note names all three:**

- **`const isMember = membership === 'member'`** went from `PlatformSideNav` —
  the header was its only consumer, so `membership` left that `useAccount()`
  destructure too. A restore that re-adds only the JSX is a compile error.
- **`NavMembershipSummary`** is reachable only through it. Moot for XCEL
  (`supportsMembership` is false, so it never rendered), and live for a brand
  that sells one.
- **`brandRing` on `Avatar` now has NO call site.** It exists to mark this
  avatar as the learner's own, and this was documented as its only caller — so
  restoring the header restores the only thing that uses it. That is also why
  the new header trigger deliberately does not take it: see above.

**It fixed a restore note that had gone false.** The `profile-motivational-statement`
row claimed the panel was "STILL REACHABLE from the left rail (`NavProfileHeader`
→ MotivationalStatementPanel)". Unwiring the header made that untrue, and a
restore note that lies is worse than none — it is corrected in place, and a test
pins the correction. **The STATEMENT itself is unaffected:**
`ProfilePersonalizePanel` still reads and writes it through `MotivationContext`
and `ProfilePersonalizeBand` still displays it. What has no live caller now is
`MotivationalStatementPanel`, the slide-over.

**A brand-rule test had to have its control replaced.**
`XcelNoMembership`'s "no membership pill in the rail" used the greeting as its
control — proof that "no pill" was suppression rather than the rail failing to
render. The control is the **Home** row now, and the test also asserts the
greeting is absent, so it cannot silently start measuring this removal instead
of the brand rule. Same trap that section already records from the other
direction: a test about capability must pin what it depends on.

### The header account trigger is the learner (2026-09-16)

The top-right control was a generic `CircleUser` glyph in a `cre-icon-pill`. It
is the learner's own photo plus their name now, at Jillienne's request — so the
two ends of the header row, the rail's profile header and this, both say who is
signed in.

**The real fix was where the learner came from.** `Header` rendered
`<AccountMenu initials="SC" />` — the ONLY prop it ever passed, and not this
learner's initials (Alicia Navarro → AN). The component's own comment claimed
"`Header` always passes the live values from `useAccount().user`"; it did not,
so the hardcoded prop defaults WERE the menu. Invisible behind a glyph, and a
second learner the moment the trigger shows a face and a name.

`AccountMenu` resolves its own now, from the same two sources `NavProfileHeader`
reads: `useAccount().user` and the profile-avatar override. Uploading a photo on
the Profile page moves both. The props survive as OVERRIDES for an isolated
mount, which is what they were genuinely being used for.

**`email` is the one field with no source** — `DemoUser` carries a name,
initials and an avatar but no email, so it stays an authored default rather than
being derived. `first.last@gmail.com` would be a guess rendered as a fact, which
is the rule the Links panel's `addedBy` field follows.

**NO `brandRing` on it, deliberately.** The rail's 48px avatar is documented as
the ONLY call site that carries the Brick ring — that is what marks it as the
learner's own — and a second ringed avatar in the same viewport spends the
distinction rather than making it. At 28px a 2px ring is proportionally heavier
than it is at 48, too. A test pins the absence here and the presence there.

**`cre-account-pill`, not `cre-icon-pill`.** That one is a fixed 40×40 SQUARE
built for a single glyph and cannot hold a name. The new class is the same pill
sized to its content and is otherwise identical — radius, hover value,
transition, transparent rest state — because the trigger sits in a three-item
cluster beside the cart and the bell, and one that hovers differently reads as a
different kind of control. A test asserts the two hover rules are the same
string rather than merely both existing.

**The NAME drops below 900px**, not the pill: at phone widths the header is a
logo, a hamburger and this cluster, and a full name is the first thing that
should go. The button's `aria-label` still carries it, so assistive tech loses
nothing. Measured: 143px wide at desktop, collapsing to 40 — the icon pills'
own width — at 375.

Measured: the name is 11.37:1 on the white header.

### Two small brand touches (2026-09-09)

**The learner's own avatar carries a thin Brick ring** — `brandRing` on
`Avatar`, 2px of `--color-cta-500`, which on XCEL is #9A1B1E: the same red as
the knight in the logo. It marks the rail profile header as *the learner*, since
every other photo on the dashboard is stock or course art, and it is the ONLY
call site that sets it.

**SUPERSEDED 2026-09-16 — that call site is unwired**, so `brandRing` currently
has none. The rail profile header is archived (`nav-profile-header`), and the
header's new account trigger deliberately does not take the ring: a second
ringed avatar in one viewport spends the distinction rather than making it. The
reasoning below is unchanged and is what to re-read if the header comes back.

Deliberately not the existing `ring` prop — that is 3px border + a 2px offset
outline, ten pixels of chrome on a 48px circle. Under the global border-box
reset the 2px eats into the box, so the avatar still measures 48 and nothing
reflows. A non-default `tier` supersedes it, the same way it supersedes `ring`:
tier bands are concentric and flush, so a red ring outside them would read as a
fourth band rather than as identity. XCEL has no membership, so the two never
meet today.

**The band eyebrow is "Current Progress"** as of 2026-09-16 — it has moved three
times: "Current Learning Path" → "Current Learning Progress" (2026-09-09) →
"Current Course Progress" → this. The first changed WHAT is described (progress
through a path rather than the path itself); the second changed the OBJECT, for
a version that tracks one course rather than a path of several; the third drops
the object altogether.

**Which resolves the warning the second one carried.** The object is already
named directly above the eyebrow — the block's own heading is the course, and
with `dashboard-course-header` on, so is the page title. An eyebrow repeating it
was a third saying of one name. "Current Progress" labels the block without
competing with it, and it is equally true of a path, so the one-constant rule
stops costing Learner Focused and Marketing Focused anything.

The original note follows.

**The band eyebrow was "Current Learning Progress"**, renamed from "Current
Learning Path". It is ONE exported constant, `CURRENT_LEARNING_EYEBROW` in
`learningPathsHomeUtil`, because **five** components rendered that literal —
the Marketing Focused band, the full-width Clp/Jump-Back-In band, the Learner
Focused band, the completed celebration, and the section lead in
`MembershipOverview`. They are layout variants and states of the SAME band, so
renaming four of five would have had the heading change as a reviewer flipped a
layout flag. The test asserts the constant rather than the words, for the same
reason.

"Path" survives everywhere it names the PAGE or the object — the `learning-path`
rail section, "Switch Learning Path", the Learning Paths landing. Only the
dashboard band's heading moved, where what is shown is progress THROUGH a path
rather than the path itself.

### The demo rail — what a stakeholder sees first (2026-09-09)

`NAV_SECTION_FLAGS` entries carry an optional `defaultEnabled`, and five are
**false**. The committed baseline is:

> Home · Study Plan · Readiness · My Courses · Certificates · Resources ·
> Rubi Insights — Get Help

(As of 2026-09-16. The original 2026-09-09 baseline was: Home · Study Plan ·
My Courses · Certificates — Browse Catalog · Resources · AI Study Partner —
Get Help. What moved since: Readiness joined, Rubi was renamed twice, Resources
and Rubi moved into My Learning, and Browse Catalog went off — which took the
Explore group with it.)

Off: Learning Path, Recommended for You, Resource Library, Exam & Cert Prep,
Podcasts. Two different reasons, and the difference decides whether to bring one
back. **Learning Path** is off because Home's full-width Current Learning Path
band already IS it — the rail row was a second door onto what the landing page
leads with. The other four are simply not what this demo is about; **Podcasts**
is the sharpest case, since XCEL has no podcast product and the section is an
EmptyState saying so, i.e. a rail row leading to "not part of the catalog
today".

**Nothing is disabled.** The flag hides the RAIL ROW; every section still
resolves, so `?section=podcasts` opens Podcasts and `?section=learning-path`
opens the Learning Path. That is what makes a hidden section demoable on request
rather than gone, and it is why trimming the rail is an editorial act rather
than a feature cut.

`NavSectionFlags.test.tsx` asserts the WHOLE rail in order, not "X is absent" —
a presence check passes just as happily when an unrelated row appears. A row
moving in or out should fail that test and be re-decided.

**Two traps this set off, both worth knowing.**

*A brand-rule test read the demo rail.* `XcelNoMembership` asserts XCEL KEEPS
Exam & Cert Prep (its core product) while dropping Partner Offers — the
`hiddenBenefitSections` rule. With the demo default off, that row vanished for a
reason having nothing to do with membership, and the test failed for the wrong
thing. It now seeds `nav-show-m-exam-prep` ON, so it measures the brand rule and
NavSectionFlags measures the editorial one. **A test about capability must pin
the flags it depends on, or an editorial default silently becomes its subject.**

*Demo mode does not read the catalog default alone.* `?demo=1` renders
`baselineFrom(customDefaults)` — the reviewer's per-browser "Set as default"
snapshot (`cgp.featureFlags.customDefaults`) **wins over** the committed
default, per key. That snapshot is local and never committed, so a machine
holding a stale one shows a different demo rail from a clean machine, with
nothing in the repo to explain it. If the demo looks wrong on one laptop only,
that key is the first thing to check.

### Resources — the Free Content section, restored 2026-09-09

A rail section (`resources`). It was **paired with Browse Catalog** — that one
is what you buy, this is the free half of the same "go and find something" job —
and sat directly under it until 2026-09-16.

**That pairing is over.** It briefly led the Explore group, then moved into MY
LEARNING the same day: see "Resources and Rubi are in MY LEARNING" below. The
argument that replaced it is that a candidate does not browse the reference
material, they use it — so it is one of the learner's own things rather than the
free half of the shop. The reasoning below is the original and is what to
re-read if the pairing is ever wanted back. The body is XCEL's four outbound
destinations — Resource Center, the product blog, and the 2026 Career and
Salary Guides.

**A re-wire, not a rebuild — which is the archive convention paying off.**
`ResourcesPanel`, `ResourceCard` and the brand-keyed `resourcesFixtures` were
kept intact and unreferenced when the section was archived on 2026-08-26, so
restoring it was five registration points and no new component or fixture.

**It does re-open an archived decision, and that decision was not wrong.** Free
Content was pulled because its rows are OUTBOUND links and "a primary nav row
promises you stay put" — they moved to the account dropdown, where they still
are. Both doors are now open, which is normally the `recommended-card-ab-demo`
mistake. It is accepted here because the two are not the same door: the
dropdown rows are four separate menu items you must already know to look for,
and this is one browsable surface a shopper can find. **If that reads wrong in
review, the cheap fix is dropping the four rows from `AccountMenu`, not
re-archiving the page.**

The hero copy comes from **`resourcesCopyFor`**, not from `SECTION_HERO_META`.
That file owns the sentence, next to the resource list and to the rule it has
to follow ("say plainly that it is free"); a `SECTION_HERO_META` entry would
make one sentence exist twice. A test compares the rendered hero against the
fixture rather than against a literal, so the two cannot drift apart quietly.
No "Included with your membership" eyebrow — `MEMBERSHIP_EYEBROW_SECTIONS`
already excluded it, and on this page in particular the eyebrow would claim the
opposite of what the page says.

**Not added to the MVP rail** (`?nav=mvp`). That list is a Figma-specified trim
(node 53:5290); growing it would be editing a design rather than implementing
one.

**All four links were dead, and the archive is why nobody noticed.** The hrefs
were authored as plausible guesses shaped like the marketing names
(`/resource-center/`, `/whats-new/`, `/career-guide/`, `/salary-guide/`) under
a `TODO(data)` saying the slugs were unconfirmed — and all four 404. XCEL nests
the set under `/resources` and gives the guides descriptive slugs. `AccountMenu`
reads the same list, so the dropdown rows were broken too, and had been since
the section was archived.

`supportFixtures.faqUrl` carried the identical defect: the guessed `/faqs/`
404s, and `/faq` exists only as a redirect to Customer Support. It points at
`/customer-support` directly now — so the FAQ card and Contact Us lead to the
same page, which is XCEL's own IA. If that reads redundant, drop the FAQ card
for XCEL rather than inventing a URL for it.

**The four cards carry four different glyphs** (2026-09-09): blog for the
Resource Center (the hub the others sit under), a megaphone for What's New
(announcements), and an open book for the two guides. They all started as
`blog`, which rendered four identical RSS marks — a glyph that says "feed" over
a salary guide, four times.

`book` and `megaphone` are NEW `ResourceIcon` keys, not `blog` repointed:
`blog` still means a blog, and a key whose name and picture disagree is the
kind of thing nobody unpicks later. Three `Record<ResourceIcon, …>` maps make
the compiler list the call sites (`ResourceCard`, `FreeContentBands`,
`AccountMenu`) — that seam is what stopped the account dropdown keeping the old
glyph silently.

**Watch what this did to the type, because it decides how to add the next one.**
`ResourceIcon` began as a CONTENT TYPE (blog / podcast / facebook — one per
kind of feed), which is why `FreeContentBands` colours a band from it: reading
primary, audio secondary, community tertiary. Picking glyphs per card for
variety turns the field into a GLYPH NAME, and the two jobs stop coinciding —
`megaphone` is not a content type, and it takes the reading ramp because the
thing it labels is still a blog. Fine while the rule is "reading unless audio
or community". If a resource ever needs a glyph and a colour that disagree,
split this into two fields rather than inventing a ramp for a glyph.

**The rule: confirm a URL on the way IN, not later.** An unconfirmed href is
harmless while nothing renders it and a user-visible defect the moment its
surface ships — a `TODO(data)` does not survive the thing it is attached to
being switched on. `ResourcesPanel.test.tsx` now asserts the four dead slugs
stay dead (the `smoke-desktop.mjs` / `ProfilePersonalizeContrast` pattern),
because the wrong answer here is the one that looks right, and a test cannot
reach the network to find that out.

### `ce-study-plan` — the CE path has a plan now

**This reverses a decision `studyCalendarFixtures.ts` used to state.** The CE
path was excluded from `XCEL_PATHS_WITH_CALENDAR` because "a renewal cycle with
a variable, sometimes birthday-based deadline is not the same object as a
countdown to a booked exam, and it drops cleanly into the empty branch rather
than being given a plan that misdescribes it."

The DEADLINE half of that still stands, and `XCEL_CE_STUDY_CALENDAR` respects
it: the plan paces HOURS and claims no exam date of its own. What the old note
overreached on was the WORKLOAD — 24 required hours against a concrete date is
the same pacing job, so the empty branch was withholding something usable.

Behind `ce-study-plan`, **default ON**. Off restores the prior behaviour
exactly. Both surfaces that resolve a plan read the same
`useCeStudyPlanEnabled()` hook — the Jump Back In card and the Study Plan page
— because one showing a CE plan while the other showed the empty branch is the
drift the hook exists to prevent.

### Resources and Rubi are in MY LEARNING (2026-09-16)

The rail reads **Home · Study Plan · Readiness · My Courses · Certificates ·
Resources · Rubi Insights** — then **Explore: Browse Catalog** — then Support.

**This moved twice in one day, and the second move settles it.** The two first
led the Explore group (above Browse Catalog), and the note here argued they
should stay there: the groups are semantic, Explore is every discovery surface,
and both of these are discovery. Jillienne's call is that they belong to the
learner, and it is the better read — a pre-licensing candidate does not BROWSE
the reference material and the AI tutor, they USE them, session after session,
against the one curriculum they are working. Browse Catalog is the discovery
surface in that group; these two are tools.

**At the END of My Learning, after Certificates.** "Move up" means up across the
EXPLORE divider, which is the whole of the change; above Home would demote the
rail's anchor, which nobody asked for. Their relative order carries over
unchanged.

**Explore is GONE from the demo rail** (2026-09-16, later the same day). It was a
one-row group after the move — Browse Catalog alone — and that row is now
`defaultEnabled: false`, which empties the group and therefore drops it and its
caption whole, by the existing "a group whose items are ALL hidden falls out"
rule. The rail is **My Learning · Support**.

Through the FLAG, not by deleting the row, and that is the point of the baseline:
`?section=catalog` still opens Browse Catalog (verified — the page's `<h1>` reads
"Browse Catalog"), and a reviewer can bring the row back from the flag panel
with no code change. Editorial, not a capability cut — the QE Focused default is
built for a candidate working one booked exam, and the shop is the least
relevant row on that rail.

The earlier reasoning for keeping it as its own group — "the divider says your
things end here, the shop starts" — is superseded: with nothing else in it, the
divider was separating the learner's things from a single row.

`NavSectionFlags` asserts the absence of the LIST rather than of the row, which
is what proves the drop-empty rule ran: an empty group with a heading over
nothing is the "reads as a load failure" defect that rule exists to prevent.

**`m-career-tools` is spread in My Learning and filtered out of the later
`MEMBERSHIP_ITEMS` spread**, or it renders twice — React would warn about the
duplicate key but the rail would still draw, so the guard is the filter rather
than the console.

**Not added to the MVP rail** (`?nav=mvp`) — a Figma-specified trim (node
53:5290).

#### The tests could not see this move, and that is the lesson

Every rail assertion in the suite passed the change **without noticing it**.
Moving the two rows from the top of Explore into the bottom of My Learning
changed which `<ul>` they belong to and changed the flat button order **not at
all** — Resources · Rubi Insights · Browse Catalog are still consecutive in that
order. So `NavSectionFlags`' whole-rail-in-order list and `ResourcesSection`'s
index check were both green on both arrangements.

Each group's `<ul>` is `aria-labelledby` its caption, which is the handle that
CAN see it: `getByRole('list', { name: 'My Learning' })`. Both tests assert
group membership now, and `NavSectionFlags` says in a comment that its flat list
is blind to grouping — so the next person does not read a passing in-order
assertion as proof the groups are right.

Same family as the demo-rail note above ("a presence check passes just as
happily when an unrelated row appears"), one level up: an ORDER check passes
just as happily when the grouping changes underneath it.

### Rubi is "Rubi Insights" on XCEL now (2026-09-16)

**Renamed again**, at Jillienne's request: "Rubi AI Tools" → **"Rubi
Insights"**. The 2026-09-10 note below is unchanged and still explains WHY the
label is not Elite's "Career Tools" — that rule has survived both renames; what
keeps moving is which XCEL-true name to use, which is an editorial call.

**Seven non-test sites, all changed together**, and the list is longer than the
four the note below records, because it now includes the ones that were already
agreeing: `careerToolsLabelFor`, `MEMBERSHIP_ITEMS`, `NAV_SECTION_FLAGS`,
`PlatformShell`'s `SECTION_TITLES`, `membershipFirstFixtures`, and BOTH
`sectionHeroMeta` entries — the XCEL override and the brand-agnostic DEFAULT.

**The default was renamed too, and that is the call worth recording.** Its
description is still Elite's career-coach framing ("interview simulators, a
resume builder"), which is what a brand-agnostic default is for — but the
PRODUCT'S NAME is one name across the repo. Leaving "Rubi AI Tools" there would
have put a second name in the codebase for a reader to pick between, which is
how a third one gets invented. The name and the framing are different fields.

`XcelNoMembership` still asserts against `careerToolsLabelFor` rather than the
string, which is exactly why the second rename touched one line of it (a
comment). `NavSectionFlags` asserts the whole rail in order and DOES carry the
string — deliberately, because it is measuring the demo a stakeholder sees.

---

The rail read **"AI Study Partner"** — XCEL's own wording on xcelsolutions.com
— and it is "Rubi AI Tools" as of 2026-09-10, at Jillienne's request.

**This reverses half of a documented decision, and only half.** The reasoning
in `careerToolsLabelFor` was: Rubi is a career coach on Elite and an EXAM STUDY
AID on XCEL, so "Career Tools" misdescribes the product. That still stands and
is still why the label is not "Career Tools". What moved is which XCEL-true
name to use — the brand's descriptive one, or the product's own.

**It closes a split rather than opening one.** `SECTION_TITLES` and the default
`SECTION_HERO_META` both already said "Rubi AI Tools"; only the XCEL override
and the rail said otherwise, so the two names had been coexisting.

The string lived in FOUR places — `careerToolsLabelFor`, `NAV_SECTION_FLAGS`,
the `sectionHeroMeta` XCEL override, and `membershipFirstFixtures` — all
changed together. `XcelNoMembership` asserts against the HELPER rather than the
string now: which XCEL-true name to use is an editorial call that has moved
once, while "it is not Elite's" is the rule.

### Two cards left the Profile page (2026-09-10)

**Different reasons, different mechanisms**, and the distinction is the point:

- **Membership Plan** is gated on `supportsMembership`, a CORRECTNESS fix. It
  was announcing "Automatically Renews on 11/01/2026 · 108 Days of Membership
  Remaining" on a brand that sells no membership — the same defect as the
  Membership nav link the brand-add's suppression list missed. Because it is a
  brand predicate, it returns on its own for a brand that has one, so it gets
  NO archive row: a row would tell the next person to re-add something the
  predicate is deliberately withholding.
- **Motivational Statement** is UNWIRED — an editorial removal, and the FIRST
  row this repo's archive has ever held. The component, `MotivationalStatementPanel`
  and `MotivationContext` are untouched, and the panel is still reachable from
  the left rail, so the feature is not gone — only its second door.

A test asserts both the removals AND that only the editorial one is archived.

**A THIRD instance of the same defect went with them:** Account Details' "Member"
pill, keyed on `isMember` — which XCEL's own tier makes true. The question that
has to be asked first is whether the brand sells a membership at all. Gated on
`supportsMembership` like the card, so it returns for a brand that has one.

Three surfaces, one root cause, found one at a time: the rail's Membership link
during the migration, then this card, then the pill. **When a brand predicate
turns something off, sweep for the other places that ask the tier instead.**

### Notifications — the bell, and what a notification IS (2026-09-10)

A bell in the header between Cart and the account menu, an unread badge, and
a 380px panel. Behind `header-notifications` (default on), with
`notification-state` as its demo axis. The card treatment is the Figma
**"Alerts"** port (`kDJB8Xga3bscFwj2rDXuin`, node `4:287`).

**The load-bearing decision is that a notification is not a toast**, and the
Figma cannot tell you that because it draws them as one component. They are
different objects:

- A **toast** is feedback on something YOU JUST DID. It is transient because
  its job ends the moment you have seen it — you already knew.
- A **notification** is a record of something that happened TO YOU WHILE YOU
  WERE NOT LOOKING. It is durable because you have not seen it yet.

**Only the second goes in the bell.** Pipe the toast stream in and within one
session it fills with "Statement saved" — a list of things the learner already
acknowledged, which is how a notification centre becomes the thing nobody
opens twice. An event may legitimately do both (a certificate is issued →
toast now, still there tomorrow); `raisesToast` marks that overlap so the two
systems cannot be quietly conflated later.

**"Notifications" already meant something else here — and the account section
now holds BOTH readings.** There was a section by that name
(`?section=notifications`, Bell icon, in the account dropdown and sub-nav)
before the bell existed, and it meant **preferences**: which emails you get.
The bell means the **feed**. Rather than rename either out from under a
reviewer, the page is the full FEED with a preferences card beneath it, so one
address answers both readings and the bell's **View all** has somewhere real
to land.

**That link was "Notification settings" for one commit and it was wrong** —
not because of the words but because `?section=notifications` was still an
`AccountSectionPlaceholder`. A footer link into an empty stub is the same
defect as the four dead Resources slugs: the surface shipped and the
destination did not. `NotificationsPanel` replaced that one `renderBody`
branch, which is the Readiness sequence again — register the section first,
swap one branch later, nothing else moves.

**The preferences are a SHEET now, from a link beside "Mark all read".** They
were a card that said "not designed yet" for exactly one commit — deliberately,
rather than a card of toggles that controlled nothing, which is the Membership
Plan card's defect. What earns them the right to be real is that the in-app
switches genuinely filter the feed, live, on both surfaces.

**Preferences switch on CATEGORY, not on tone**, and that is the load-bearing
modelling call. "3 tasks are overdue" and "your licence renews in 45 days" are
both `warning`, and muting the first while keeping the second is the entire
point of the sheet — so `Notification` carries a `category` alongside its
tone. Tone is how a notification LOOKS; category is what it is ABOUT, and only
the second is something anyone wants a switch for. A test asserts two
categories share the warning tone, so collapsing the two axes fails.

**Category × channel, and no third axis.** The obvious third is FREQUENCY
(immediate / daily digest / weekly) and it is absent on purpose: a digest is a
delivery SYSTEM, not a switch, and offering the control before the system
exists produces a preference the product cannot honour. Mocking a frequency
picker is the failure mode, and a test asserts there is no `combobox` or
`radiogroup`.

**The sheet does NOT explain its own gaps on screen.** It carried two footer
notes — email being recorded with nothing to send, and frequency being absent
— and they were removed at Jillienne's request. The reasoning holds: a sheet
that spends its last paragraph on what it does not do reads as unfinished, and
the audience for that caveat is whoever builds it, not the learner. The
arguments live here and in the component doc; the TESTS are what stop them
being lost. Do not re-add the notes to the UI.

**Email is stored and does nothing.** There is no mail in a prototype. Shown
anyway rather than hidden: the real product has both channels, and a
preferences design showing one is not the design. The switch does hold its
state, so it is a control that works with nothing behind it rather than a
control that does not work.

**`Licence & renewals` is locked ON in-app.** A learner who mutes their
renewal deadline and misses it has a lapsed licence and a state late fee — a
real-world consequence no other category here can cause, and the one place the
product is entitled to overrule the preference. The switch is disabled with
the reason stated beside it, which is the honest version of quietly ignoring
it. Its EMAIL switch stays live: "don't email me" is a reasonable ask about a
channel; "never tell me at all" is the one being refused. `visibleNotifications`
re-checks `requiredInApp` rather than trusting the stored value, so a stale
`false` still shows the row.

**Muting hides; it does not mark read.** Read state is applied BEFORE the
preference filter, so unmuting a category brings its notifications back
exactly as they were. "Mark all read" clears only what is VISIBLE, for the
same reason — clearing hidden rows would mean unmuting reveals things already
read by a click the learner could not have known applied to them.

**The header says when the list is filtered** ("7 total · 3 unread · 1
category hidden"). A filtered list that looks identical to an unfiltered one
is how "where did my notification go" happens, and the answer belongs on
screen rather than behind the sheet that caused it.

**`SheetHeader` was extracted for this.** `Sheet` deliberately renders no
chrome — overlay, panel, scroll lock and a visually-hidden title, then
`{children}` with ZERO padding — so every caller draws its own header, and
until now exactly one did, privately inside `AppearancePreferencesSheet`.
Building a near-copy is how two slide-overs end up with headers a few pixels
and one font weight apart. `SHEET_BODY` travels with it, because a header with
the wrong padding under it looks exactly like a broken header. **This bit
first**: the sheet shipped with no header and no padding at all, text running
edge to edge, because `Sheet`'s name suggests it supplies both.

**Known, not fixed:** `AppearancePreferencesSheet` still lists a DISABLED
"Notifications — Email and in-app alerts" stub row. It is honest (visibly
unbuilt) but it now points at nothing while the real sheet lives elsewhere.
Wiring it means opening a sheet from inside a sheet, which nothing here does
yet — decide that before reaching for it.

**Read state is in `NotificationsContext`, and that is the whole reason it
exists.** It started as `useState` inside the bell, which was correct while
the bell was the only surface — and became a fork the moment View all opened
a second one: clear a row in the bell, open the page, and it is unread again,
with the badge already down, the two actively contradicting each other. The
provider is mounted in `AppLayout` inside `FeatureFlagProvider` (it reads
`notification-state`) and ABOVE both `Header` and `<Outlet />`, because those
are the two surfaces — under either one it would recreate the fork. Tests
assert it in BOTH directions, since a one-way check passes just as happily
when the page writes to a copy nobody reads.

**`NotificationRow` is one component on both surfaces**, with a `size` prop
for the roomier page. Not "both show eight things" — a lookalike passes that.
This is the Jump Back In card's lesson applied on the way in: its rows became
the Study Plan's real `TaskRow` rather than something that merely matched the
visual language. A test counts rows across both mounts rather than per page.

**View all carries NO number.** The page header two inches away already says
"8 total · 2 unread", and two counts inches apart saying the same thing is
exactly what got edited out of one place and not the other on the Today's
Tasks card.

**Three panel decisions worth not re-deriving.**

*The badge counts UNREAD, not total.* A count that never falls is a scold, not
a signal — the only way to clear "8" would be to delete things. It caps at
`9+`: past a point the exact number stops being information.

*Opening the panel does not mark everything read.* The shortcut every
implementation reaches for, and it destroys the one thing the list is good at
— coming back to something. Rows clear individually on click, plus an explicit
Mark all read, so clearing stays a decision rather than a side effect of
glancing. A test asserts the non-behaviour, because it is a one-line change to
"fix" and nothing else would notice.

*A row is a link, not a card with buttons.* At 380px a two-button footer per
row turns eight notifications into a wall of chrome. `actionLabel` renders as
the row's own affordance text and the whole row is the target — the same call
the Home week strip made. The only real buttons in the panel act on the LIST.

**The design's 8px top border does not survive being stacked.** Eight cards
deep it reads as a barcode. It becomes a 3px LEADING rail on unread rows —
the same "this row's tone, at the card's edge" idea rotated for a list — and
the toast keeps the top border, where there is only ever one card.

**`alertTones.ts` is the one tone map**, read by `Toast` AND the panel. A
warning that is amber when it fires and grey in the bell an hour later reads
as two systems; same reasoning as `studyStatusColors.ts` between the Study
Plan and the week strip. Extracting it also closed a real gap `Toast`'s own
comment had been carrying: warning / error / info all rendered
`circle-exclamation`, differing **only in colour**, "until dedicated SVGs are
added". `triangle-exclamation` and `circle-info` exist now and are wired; a
test asserts every tone has a DISTINCT glyph. `circle-xmark` is still not in
the registry, so `error` keeps the exclamation — vendor the FA file and
repoint one line; do not hand-author the path.

**Four tones are functional, two are brand.** Success / warning / error / info
take the functional ramps; `message` and `promo` take `--color-primary-*`.
That follows the design (it draws both in MCK's green rather than a functional
colour) and it is right rather than incidental: a message from your instructor
is not a system state, so borrowing the success/warning/error ramp would make
"you have mail" read as a verdict on you.

**`--color-action` is a FILL colour, and using it as TEXT failed in dark
mode.** On XCEL it is the Brick #9A1B1E — correct behind white, and **2.05:1**
as text on the dark shell. tsc was clean, every test passed, the component
rendered; only measuring the dark theme in a browser caught it. That is the
*same 2.05:1* the desktop prototype's rail indicator hit, and the rule
generalised there applies unchanged: **put a LIGHT stop on a dark ground.**
`.cre-alert-action` swaps to `--color-cta-300` under `[data-theme='dark']` —
the stop `tokens.css` already labels "on-dark alternative — 5.49:1", measured
here at 5.49:1 on the panel and 6.10:1 on a tinted unread row. A class rather
than an inline style because inline `CSSProperties` cannot carry a theme
selector, and a test asserts no inline `color` is left to win the cascade.

**The panel needs a measured clamp, and the first two attempts were both
wrong.** It is 380px and anchored to the BELL's right edge — but the bell is
not the rightmost thing in the header, so at 375px its left edge landed 68px
OFF SCREEN. `maxWidth` does not help: it sized the panel correctly at 343px
and hung it in the wrong place. Measuring the PANEL's own rect then looped
forever in jsdom (no layout engine ⇒ every rect is zero ⇒ the shift compounds
on each pass). It measures from the ANCHOR now — `anchor.right - panelWidth`
is the untransformed left edge, so the figure excludes the shift already
applied and `shiftX` stays out of the dependency list — and bails on a zero
width, which makes it a no-op in tests rather than a hang.

**The demo axis is about the COUNT, not the content.** `notification-state`
is Unread · 3 / All caught up / Nothing yet. The badge is the whole visual
argument, so four authored lists would demonstrate one control four times —
the same call the "Busy study plan" persona made. `empty` is in there because
it is what a new learner actually sees, and it is the half of a notification
centre that otherwise never gets designed.

**Deliberately NOT a Demo Controls dropdown.** That bar already carries five,
and this is a header control rather than one of the dashboard's headline axes
— the same line `readiness-state` sits on the other side of. It lives in the
flag panel; promote it if the bell becomes what a demo is about.

**The bell renders on the rebrand shell only.** Its rows deep-link into
`?section=…`, which is a shell address; on the classic routes those links
would leave the layout the learner is standing in.

**Timestamps are anchored, in HOURS BEFORE `NOTIFICATIONS_NOW`** (2026-05-11,
matching `FIXTURE_TODAY`), not as literal dates. A hardcoded date ages into "8
months ago" and makes the whole list read as abandoned. `formatAge` is
deliberately coarse — "2h ago" / "Yesterday" / "May 6" — because what the
learner is sorting on is today / not today / a while back.

**Content is XCEL's, not the design's.** The Figma ships lorem ipsum and a
real-estate promo; these are Florida 2-15 notifications about the study plan,
readiness, licence renewal and an instructor reply. And every `href` was
confirmed in-app on the way IN — the rule the Resources page had to learn
after shipping four dead slugs. A notification claims to be about YOUR
account, so an outbound marketing link is a category error as well as a
possible 404; a test asserts every href is same-origin.

**What the Figma has that is NOT built.** The file is largely a superset of
what already shipped — `Toast` IS its Warning/Error/Success/Info card (from
node `17:14204`) and `AddToCartToast` IS its Promo_Added to Cart (from node
`471:19219`). What landed new is the dual Primary+Secondary CTA, the correct
per-tone glyphs, and the `message` / `promo` tones. What did NOT: the Marketing
Promo card's decorative confetti SVGs, which are MCK brand ornament rather
than structure, and the promo's "Copy Promo Code" button — promo lives in the
bell as a row today, and a copy-to-clipboard affordance wants a real cart to
land in.

### QE Focused — the new default dashboard version (2026-09-16)

A fourth Discoverability version (`discoverability-qe-focused`), and **XCEL's
default**. Learner Focused and Marketing Focused stay in the picker so the three
can be compared.

**It is the first version built for a candidate with no licence yet** — someone
working a fixed curriculum towards a booked exam, where the useful questions are
"how much of the requirement have I cleared" and "what comes next", not "what
else could I buy". Three departures, each answering one of those:

1. **The Progress detail is on the PAGE.** The Learning Path detail sheet's
   whole Progress tab — gauge, category bars, Target Date / Time Remaining /
   Completed, and the per-category course lists — renders inline as a section.
2. **The Current Learning Progress block has NO CARD — it sits on the page
   grey** (`surface="page"`, 2026-09-16). No background, no shadow, no radius,
   and the left/right padding goes too so a bare block lines up with the section
   headings below instead of staying inset by a gutter it no longer has.

   **The type was never the problem; the TRACKS were.** Every text colour clears
   AA on `#f5f5f5` by a wide margin — title 10.43:1, meta 5.27:1, eyebrow
   7.0:1, the link 7.56:1. The gauge and bar tracks do not: the light default
   `--color-neutral-100` is **1.08:1** against the page and `-200` is 1.29:1, so
   an empty bar would have no visible track and "0 / 8 hrs" would read as a
   MISSING bar rather than an empty one. The page surface uses
   `--color-neutral-300` (1.55:1) — a groove rather than a line.

   **The bars are 6px, down from 8** (2026-09-16, the direct ask), as
   `CATEGORY_BAR_HEIGHT`. Four bars at 8 stacked under a donut read as a block
   of weight rather than a set of readings, and on this version they are the
   widest element in the left column.

   **6 rather than an invented value:** it is what `JumpBackInWidget`'s own
   progress bar uses, and that card now sits directly BELOW these in the same
   column at the same width — two progress bars inches apart differing by two
   pixels is the "two treatments a few pixels apart" drift this repo keeps
   paying for. A test reads the widget's declaration rather than restating 6,
   so moving one without the other fails.

   **It is NOT 3**, the Readiness Insights topic-bar height: those are SCORES
   and there are fourteen of them, and that note is explicit that a different
   job is allowed a different treatment. The shared `ProgressBar` is still 8 —
   a single overall bar with a percentage beside it, and a separate component,
   so moving it is a call about every surface that renders one.

   It applies to all four `CategoryBars` call sites, not just this one: one
   component, one treatment.

   **Known, and shared with the detail sheet:** against that track the amber
   (`--color-category-elective`) reads 1.34:1 and the tan
   (`--color-tertiary-500`) 2.17:1. Both are weak in the white panel too (1.92 /
   3.11) — it is a property of the light palette, not of this surface. Every
   bar's value is stated in text beside it and the dot carries the hue, so
   nothing rides on the fill alone. Darkening the track further makes those two
   worse, not better (at `-400` the amber is 1.09).

   **`onDark` asks whether the GROUND is dark, not whether the surface is the
   navy card** — and that distinction is load-bearing. The navy card is dark in
   both themes; the page is `#f5f5f5` light and `#1b1d21` dark. Token colours
   flip on their own, but `onDark` is a boolean computed in JS, so keying it to
   the surface would hand the LIGHT category palette to a dark ground and
   reintroduce the same 1.11:1 slot-0 failure in the other theme. It reads
   `useTheme()`. Dark actually measures BETTER than light here: every fill
   clears 3:1 against the track (4.30 / 4.12 / 5.35 / 3.38).

   **`.cre-journey-cta` was renamed `.cre-cta-ink`** when "View Requirements"
   needed the same treatment — cta-500 as TEXT is 1.84:1 on the dark page. A
   class named for one component that two use is the `.cre-link-action` lesson
   from the other direction. `linkBtn()` now takes an OPTIONAL colour so a
   caller can let the class own it; passing one would beat the class, which is
   the trap the PSI link already hit.

   **The primary CTA is LIGHT NAVY, not the Brick red** (at Jillienne's request,
   matching the reference "Start check" button). Same 500→600 gradient
   structure as the red it replaces — only the ramp moved. White on
   `--color-primary-500` is 7.64:1 in BOTH themes (XCEL does not re-pin that
   stop), and the fill reads as a button at 7.64:1 on the widget's white card
   and 7.0:1 on the page grey. `--color-primary-700` was the other candidate and
   was rejected because it is the value the navy CARD used — the button would
   have been the colour of the surface just removed from behind it.

   Scoped to `StudyJourneyWidget`. The other five callers of the red gradient
   are other surfaces and other versions; moving them is a brand-wide call.

   **The text CTAs followed it onto the primary ramp** — `.cre-cta-ink` is
   `--color-primary-500` now, not `--color-cta-500` ("View Requirements", "Open
   learning path", the PSI link, "View All"). The Brick had been carrying two
   unrelated jobs at once: every action AND the assessment accent. Navy now
   means "do this"; red means "this is an assessment". Same "one ramp, several
   jobs" split the desktop prototype's re-palette made.

   **`.cre-journey-milestone` keeps the Brick, and is now the only thing on the
   page wearing it** — the milestone stop titles and their node rings. It is a
   category of CONTENT, not a control.

   Both still need a light stop on a dark ground, from opposite ramps:
   `--color-primary-500` measures 2.21:1 on the dark page (1.99:1 on the dark
   card), `--color-cta-600` 1.47:1. CTA ink measures 7.0 / 7.64 / 7.76 / 6.98
   across light page / light card / dark page / dark card.

   **Known, not fixed:** on the DARK card the navy fill is 1.99:1 against its
   own surface, so the button is identified by its white label and its shape
   rather than by a fill boundary. That is marginally better than the red it
   replaces (1.84:1), not a regression.

   **The three KPI cells are BARE, divided by vertical rules** — no fill, no
   border, no radius. Three tiles in a row read as three cards competing with
   the Study Journey card beside them, and a container each was chrome around
   chrome; the numbers are the content and the rule is the separation. `gap: 0`
   with the rule on the leading edge of cells 2 and 3 — a gap on top of a rule
   reads as two gutters, and a rule on the FIRST cell would fence the row off
   from the block it belongs to.

   **`cRule` is a separate value from `cLine`, and the distinction is the
   point.** `cLine` (`--color-border-subtle`) does the job of a boundary — the
   meta line's 11px ticks, a card's edge — and measures 1.29:1 on the page grey
   (1.38:1 dark). These rules are the only thing separating three data points,
   so they are doing work: `cRule` is `--color-neutral-300`, 1.55:1 / 1.81:1,
   which is also what this surface uses for the bar track. One "line you can see
   on the page" rather than two near-identical greys. `-400` reads better still
   (1.9 / 2.47) and was rejected — at full cell height it draws more attention
   than the numbers it separates.

   The navy card keeps its TILED cells: bare cells there would lose the
   translucent fills that make them read as cells at all. Split by surface, not
   a global restyle, and a test pins both sides.

   **The status is the detail panel's OWN `StatusStrip`, and the "Status"
   caption is gone.** A status-tinted wash with the pill and the message —
   exported from `LearningPathDetailPanel` rather than matched, because the
   Progress section directly below renders the same strip and a lookalike would
   put two treatments for one status inches apart on one screen. Same argument
   as `synthCategoryCourses` and the shared `TaskRow`; a test asserts BOTH
   render the same `STATUS_STRIP_BG` value.

   The caption was chrome: a pill reading "On Track" beside a sentence about the
   deadline does not need a column saying it is a status, and that column cost
   104px of a narrow block. The status is still in words, so nothing is carried
   by the tint.

   `statusTreatment`'s keys differ from the panel's `StatusInfo` by two names —
   `fill`/`text` against `bg`/`color`. Mapped at the one place they meet rather
   than renamed; both shapes have other consumers. The LIGHT tone is resolved
   beside its on-dark twin so the two cannot describe different states.

   Measured: pill ink 5.88:1 light / 5.92:1 dark on the tint, message 5.18 /
   8.76. **The wash itself is 1.02:1 against the page** (1.19 dark) — it is a
   HUE shift rather than a luminance one, which a contrast ratio does not
   capture, and it is equally subtle on the white card in the section below. It
   is decoration; the pill's label carries the state.

   The navy card keeps the captioned box — the strip's tint composites over
   `--color-surface-card` and would disappear into the navy.

3. **THERE IS NO PROGRESS SECTION — removed 2026-09-16.** The version began by
   rendering the detail sheet's whole Progress view inline as a page section.
   Both halves of it ended up elsewhere, and then the section was the leftover:

   - The SUMMARY moved up to the Current Learning Progress block (gauge,
     per-category bars, Target Date / Time Remaining / Completed).
   - The LISTS are the Study Journey, which walks the same categories in
     curriculum order with each stop's status in words.

   What was left was a second copy of the path title, sub-line, status strip and
   a "Go to Learning Path" button, directly under a block that already had all
   four — which is exactly how it read on screen.

   **The route there took three passes, and the passes are the useful part.**
   First the band was slimmed to a lead-in (`slimLeft`) so the section could own
   the numbers. Then the numbers moved to the card (`categoryGauge` +
   `hideSummary`) and `slimLeft` went. Then the section itself went, and
   `hideSummary` and `embedded` went with it — two props with no caller are two
   things to keep working for nothing. The Sheet is the panel body's only host
   again.

   **ONE AFFORDANCE WENT WITH IT:** the course rows' "View Certificate" link,
   the only place a completed part offered its certificate from Home. The
   Certificates rail item still holds them. If it is wanted back, the Study
   Journey's completed stops are where it belongs — **not a restored section**;
   a test asserts the lists are reachable as the journey so that is visibly the
   wrong fix.
4. **Recommended for You is dropped**, as a LAYOUT rule rather than by shipping
   the flag off — the flag has to keep working on the other two versions. A test
   seeds it ON and asserts the band is still absent.

**It shares Learner Focused's band and stacked structure** (`qeFocused` sets
`learnerFocused` too) rather than forking the layout. What changes is what goes
IN the band and what follows it.

**The page section is the REAL panel body, not a page-shaped copy.**
`LearningPathDetailPanelContent` gained an `embedded` prop that suppresses the
two things which only make sense in a slide-over — the "Close" link and the
pinned-header padding — and nothing else. The sheet still opens from "View
Requirements", which is normally the two-doors mistake; it is accepted for the
reason the Resources section gives, that these are not the same door: the
section is where you land, the sheet is what the OTHER surfaces link to, and
both render one component. **Do not build a page variant of this view.**

**`categoryGauge` OVERRIDES the band's "two categories only" rule**, and that
is the interesting part. `hasBreakdown` restricts the segmented gauge to exactly
two categories, because a 3–5-category path "shows the overall % here and the
full list in the detail panel" — sound while the panel is a click away, wrong
when it is the section directly below. Without the override the card showed one
overall bar and the four-way breakdown was nowhere on screen.

Scoped by a prop rather than applied whenever a path has categories, even
though the band and the panel disagreeing for a 4-category path is arguably a
bug everywhere: fixing it on Learner Focused and Marketing Focused changes what
those ship.

**The category palette had to gain an ON-DARK set, and two slots were
invisible.** `CATEGORY_PALETTE` is built for the white detail panel. On the navy
card, measured against the bars' track:

- slot 0 `--color-category-mandatory` — **1.11:1**. That is the FIRST
  category's colour, so on the New York journey the one bar carrying all the
  progress read as empty.
- slot 3 `--color-cta-500` (the Brick) — **1.03:1**. Invisible.

`CATEGORY_PALETTE_ON_DARK` is the same hues at their light stops: 3.89 / 3.74 /
4.85 / 3.06 / 5.89 / 3.54 / 5.09, every slot clearing 3:1. Same rule as
`.cre-alert-action` and the desktop prototype's `--rail-accent` — a dark brand
colour is a FILL on white and needs a light stop on a dark ground. Slot 1 was
already a light amber, which is why the two-category case never showed this.

**The donut's track had to come down from 0.2 to 0.12 white** with it. The
lighter track was fine behind the two standardized segment colours; against the
light-stop palette it put `cta-300` at 2.38:1 and the amber at 2.91:1. At 0.12
every arc clears 3:1 — and it matches what `CategoryBars` already uses, so the
donut and the bars beside it stop being two different shades of empty.

**The SHEET keeps the full summary on the light palette** for the consumers
that still show it. `hideSummary` is `embedded`-only.

#### View Requirements is requirements-only, and the tabs are gone (2026-09-16)

`LearningPathDetailPanelContent` gained `view: 'tabs' | 'progress' |
'requirements'`. On QE Focused both halves render WITHOUT a tab bar: the "View
Requirements" CTA opens `requirements`, and the page section is `progress`.

**Because each half is already where it needs to be.** The page behind the sheet
shows every part of the Progress half — the navy card's gauge and stat tiles,
the section's course lists — so a Progress tab inside the sheet was a second
door onto what the reviewer was just looking at, the pattern that got four
testing tiles archived. And the section had a Requirements tab that the CTA now
owns.

**`view: 'tabs'` stays the DEFAULT, and that is deliberate.** Three other
consumers open this sheet — `LearningPathsHome`, the classic dashboard's
`LearnerOverviewPanel`, and the QE page's own embedded section — and for the
first two the sheet is the ONLY door to either half. Removing their tabs would
take the Progress detail away with no replacement. A test pins both: no tabs on
QE Focused, tabs on Learner Focused.

A single-half view pins the tab state rather than reading it, so a caller cannot
land on a half the host never meant to offer.

#### The requirements content is XCEL's published New York page

`_PATH_REQUIREMENTS_BY_ID['xcel-ny-producer-prelicensing']`, from
`https://www.xcelsolutions.com/new-york/insurance-license/requirements`,
confirmed 2026-09-16. Six sections: hours by line of authority, how the course
works, the certificate of completion, sitting the exam, applying, and the CE
cycle that follows.

**Quoted close to the source, not paraphrased.** The forced-progression rule and
the 70% chapter-assessment floor are the kind of thing a learner is told once
and then has to act on.

**`totalHours` is the STATE's 40, not the path's 56.** The requirements box is
about the board's requirement; XCEL's programme adds 16 hours of its own prep
(Prep Review, Simulators, Exam Cram) on top. The difference is stated in the
list rather than left for a reader to notice two numbers disagree.

**THE FIRST PRE-LICENSING ENTRY made three fields optional.** `PathRequirements`
was shaped for CE renewal, where `mandatoryHours`, `electiveHours` and
`renewalCycleYears` always apply. A candidate has nothing to renew and the state
names ONE hour figure per line of authority — and a `0` in those slots renders
as a stated requirement of zero rather than as not-applicable, which is the
admin roster's blank-Seat-cell rule.

**The exam figures were wrong for one day, in a way worth recording.**
`examFactsFor('NY')` shipped as "100 questions / 2 hours" — the SINGLE-line
figure (Life only, Health only, Personal Lines). The demo persona holds the
COMBINED Life, Accident & Health line, the 40-hour one, which sits **150 scored
questions in 150 minutes**. The first fetch of the page summarised its per-line
table as "100 (Life/Health) or 150 (Personal Lines/P&C)", which has it
backwards. **Read the table, not a summary of it.** Corrected in both places
that state it — the Readiness facts and the Get Licensed step — and the test
matches on the NUMBERS rather than the phrasing, so the two surfaces stay free
to word it differently while being unable to disagree.

**The "Go to Learning Path" CTA is gone from this view** (2026-09-16). The page
the sheet opens over already carries "Open learning path" on the Study Journey
widget, so the button was a second door onto one route — inside a sheet whose
whole job is to state the requirements. Same argument that dropped the Progress
tab, applied to the header instead of the tab bar.

It is gated on the `view` PROP, not on which half is showing: the tabbed sheet
documents that CTA as persistent across both tabs, so switching to its
Requirements TAB must not make it vanish. A test pins both, and also pins that
"Open learning path" is still on the page — so the removal cannot quietly become
"there is no way to the learning path from here".

**`embedded` must not make a second scroll container.** The sheet's body is
`flex: 1; overflow-y: auto`; on a page that collapses to its content and the
section loses its scrollbar to the page anyway, reading as a clipped section.

**QE Focused resolves a QUALIFYING journey, never CE, and that was a real bug
for one build.** `dashboard-education-type` defaults to `ce`, so the version
NAMED for qualifying education opened on a CE renewal path. `exam-prep` still
gets through — it is the other qualifying journey — and the Demo Controls bar
**drops Continuing Ed from its Education dropdown here** rather than leaving an
option that silently does nothing. The bar's label reads what the PAGE resolved,
not the raw flag.

#### The Study Journey sits on the PAGE — no card (2026-09-16)

`widgetCardStyle` has no background, no border and **no shadow**. It was a
raised white card, inherited from the outer section back when this was the right
half of a joined band.

**The shadow went with the fill and the border**, which is one treatment rather
than three settings: a shadow under a surface with neither fill nor edge reads
as a card that failed to paint, not as less card.

**The horizontal padding went too** — the move the Current Learning Progress
block already records: a bare block lines up with its column instead of staying
inset by a gutter belonging to a card it no longer has. What is left is 4px of
top padding, so both columns' eyebrows sit on the same line (measured: y=260 for
each).

`widgetRuleStyle` is untouched — it divides this block's own two halves (the
journey from Get Licensed) and is not card chrome.

#### The Study Journey widget — its own card, split from the navy side

`StudyJourneyWidget` (2026-09-16). Resume block, then the Study Journey, then
Get Licensed: one card answering "where am I and what is next", from the course
in front of the learner to the licence.

**It was the band's right HALF** — a grid sibling of the navy Current Learning
Path, sharing one radius, one shadow and one `overflow: hidden`. Two things made
that stop working once QE Focused slimmed the navy side and grew this one:

- **Grid siblings share a row height.** The navy lead-in is four lines; this is
  a resume block plus ten steps. Joined, the navy half stretched to match and
  carried a large empty area below its content — which reads as a render
  failure, not as breathing room. Measured after the split: navy 272px, widget
  989px, each sized by its own content.
- **They are no longer halves of one statement.** The navy side's figures moved
  to the Progress section below, so presenting the two as one surface implied a
  relationship that section had already taken over.

**`align-items: start` is the load-bearing half of the split.** Without it the
grid still equalises the row and the navy card stretches exactly as before —
the joined band with a gap. A test asserts the declaration rather than the
heights, because jsdom has no layout.

**The column gap is 40, matching what `MembershipOverview` puts between its own
sections**, so the space between two independent cards reads as the page's own
rhythm. It was 20 — inherited from when these were two halves of ONE card, where
the gap stood in for the seam; split, 20 read as two things that had not quite
come apart.

**A REGRESSION THE PAGE SURFACE CAUSED, and how it hid.** `metaRow` (the
"Insurance Pre-Licensing · NY · 56 Hours" line and its dividers) is assembled
ABOVE the navy half's markup. The `surface='page'` colour swaps were applied
across that markup, so they missed it: the meta line kept
`rgb(255 255 255 / 0.66)` and rendered white-on-grey at roughly 1.2:1 — content
that looked like it had failed to load. tsc was clean, all 686 tests passed, and
it survived several rounds of looking at the page, because a washed-out line is
easy to read past. Only inspecting the element's computed style caught it.

**The lesson is about the method, not the colour:** a surface variant applied by
sweeping a block of markup misses anything BUILT outside that block. Both values
read `cMuted` / `cLine` now, and a test pins the meta colour per surface in both
directions.

**The joined treatment is KEPT for every other version.** Learner Focused and
Marketing Focused are two halves of one statement at roughly one height, which
is what it is for. A test pins both sides of that.

**The widget resolves nothing itself.** The resume course is a prop and
launching is a callback, so it has no `useCourseLauncher` and no fixture import
— two components resolving "the course to resume" is how they disagree, which
is the fork `displayedProgressPct` was extracted to close. A test scans the
source (comments stripped) to keep it that way.

`DELIVERY_LABEL` moved to `src/utils/courseDelivery.ts` so the split did not add
a SIXTH private copy of that map. The other five are deliberately not folded in
— they disagree on wording in places, so collapsing them is a copy decision.

**Known, pre-existing:** `MembershipOverview` wraps the band in its own
`<section aria-label="Your learning">` and the band carries the same label, so
two nested regions share a name. Tests select the band by class because of it.
Worth fixing separately.

#### The Study Journey — sequence, not dates

`StudyJourneyRail` replaces Today's Tasks in the band's white half. It does NOT
replace the resume block above it: "continue where you left off" is still the
first thing the card offers.

**The Study Plan and the Study Journey answer different questions, and that is
why both exist.** The plan is DATE-paced — what is due today, can put you
behind, unit is a task with a due date. The journey is SEQUENCE-paced — where am
I in the programme, cannot make you late, unit is a piece of curriculum. A
journey with due dates is just a worse calendar, so this holds **no dates and no
overdue state**; a test asserts no stop carries a `dueDate`.

**The stops are derived, never authored** — `resolvePathCategories` →
`synthCategoryCourses`, the same pair the Progress tab's course lists use. On
this version those lists are directly below the band, so an authored journey
would contradict them on the same screen. Both now live in `studyJourneyUtil.ts`
so there is one derivation rather than two.

**`personaFor` allocates completed hours SEQUENTIALLY, and that changed for
this** (2026-09-16). It used to be `completed = required × ratio` applied to
each category independently — a PROPORTIONAL fill, which made the New York
learner simultaneously 63% through their coursework, 63% through the prep
review, 63% through the simulators and 63% through the exam cram. The category
bars survived that as decoration; the journey did not, because a sequence whose
every stop reads "In progress" answers nothing about what to do next.

Hours now fill the list in order, each category taking what it can before the
next gets any. **The TOTAL is unchanged** — `round(totalRequired × ratio)`
either way — so On Track is still 63% and the three-surface agreement holds;
only the distribution moved. The category list is therefore ORDERED, and the
order is the curriculum: entry 0 must be what a learner does first.

**Mandatory / Elective are derived from the same allocation**, via a `segment`
field declaring what used to be implicit in `mandatoryReq` / `electiveReq`. Two
rules over one set of hours is two answers: under the waterfall
`mandatoryReq × 0.63` says 25/40 while the categories say 35/40, and BOTH are on
screen — the Progress section reads categories, the Learner Focused band's
legend reads the two segments. A profile with no categories keeps the old
computation exactly.

Tests sweep every progress variant rather than asserting the default, for the
reason `ProgressAgreement` gives: at most one stop in progress, nothing started
after a not-started stop, and the segments agreeing with the categories.

**Consequence worth knowing:** pre-license education alone is 40 of the 56
hours, so on every partial state the prep / simulator / cram stops are
untouched — the demo never shows "coursework done, now on the simulators". The
levers are the On Track ratio or the pre-license hour requirement, and the
latter is one of the invented figures. Left alone rather than tuned, because
63% is what the Progress dropdown's own label says.

**Assessment categories are MILESTONES** (`simulators`, `exam-cram`) — sitting a
practice exam is a different act from working a lesson, which is the distinction
the reference design makes with its Mini Exams.

**They are marked on the NODE, not by red text — and that changed within the
day.** The titles were `--color-cta-600` (the Brick) for one build. Red MEANS
something: "Exam Simulators · 6 hrs · Not started" in red read as a failure
rather than a step not reached yet, and worse because the two milestones happen
to be the two not-started stops. Same tension the readiness gauge records — red
on a CHAPTER is actionable, red on YOU is discouraging — and an unreached
milestone is the second kind.

The distinction is a WEIGHT OF INK on the ring now: `--color-text-primary`
against an ordinary stop's `--color-text-tertiary`, 11.37:1 vs 6.19:1 on the
card (13.67 vs 6.18 dark). Same value the "you are here" node uses for its fill,
so the rail carries two inks rather than three — filled means "here", hollow
strong means "assessment", hollow weak means "not yet".

A different SHAPE (a diamond) was the other candidate and was rejected: a
completed milestone carries the check glyph, so rotating the node means
counter-rotating the icon inside it, for a distinction the group label already
makes in words. **`.cre-journey-milestone` is gone and nothing on the page wears
the Brick** — a test asserts the class is absent from `tokens.css`.

#### Jump Back In is INSIDE the progress block (2026-09-16)

The Current Learning Progress block now carries the **course art left of its
title** and the **Resume CTA** beside the gauge. `JumpBackInWidget` is archived
(`ARCHIVED_ITEMS` id `jump-back-in-widget`) — kept and exported, unreferenced.

**It was one thing said twice.** The card sat directly below the block with the
same course, the same art, the same percentage and its own progress bar. Merging
it removes a whole card without removing any information.

**The single category bar went with it, and that is what made room.** With one
category the bar restated the donut's 62% AND the "Completed 26 / 42 lessons"
KPI cell — three sayings of one number within three inches. `showBars` is a
COUNT rule (`cats.length > 1`), not a version check: any path that ends up with
one category gets this, and a path with a real breakdown keeps its bars
everywhere.

**Where the CTA went, and the two placements rejected.** It sits right of the
donut, in the half the bar vacated — the eye's second stop, beside the progress
it acts on. Both alternatives are one edit away and named at `resumeInline`:

- **In the header row, opposite the title** — reads as a page action rather than
  the next step in this course, and puts the primary button *above* the number
  that motivates it.
- **At the bottom beside "View Requirements"** — a filled primary button next to
  a text link makes the link look disabled, and it falls below the fold on a
  narrow shell.

**Page surface only.** On navy the white half still renders the full resume
block; two resume blocks in one band is the duplication this removed.

**The art is the resume course's own** (`resumeCover`), so the picture and the
button are the same course — and it is fixed at 84×56 with no border, for the
two reasons the card already recorded: it is course art rather than a chip, and
a border on the page grey boxes the one element that already has edges.

**A horizontal BAR replaced the donut** (2026-09-16), under the meta line and
inside the text column, so it reads as this course's progress rather than as a
separate widget: title, what it is, how far through it. The 150px gauge had a
whole row to itself to say one number the KPI cell below already states as
"26 / 42 lessons".

It is the **shared `ProgressBar`**, not a lookalike — the rule `ProgressInline`
was extracted for, after Readiness drew its own 3px bar in a different green and
one learner's one 32% became two different bars a rail item apart. The
percentage is printed beside it because nothing else on this surface says "62%"
once the donut goes; `ProgressBar` deliberately carries no label of its own.

`ProgressBar` gained a **`track` override** for it, the same override
`CategoryBars` already needed on this surface and for the same reason: the
default `--color-neutral-100` is 1.08:1 on the page grey, so an empty bar has no
visible groove.

**The donut is NOT rendered rather than hidden.** `display: none` leaves a gauge
in the accessibility tree and in every `querySelector('svg')` a test reaches
for — present while absent. `barInHeader` is tied to `showBars` being false, so
the bar and the category bars swap TOGETHER: with a real multi-category
breakdown the donut still earns its row, because it shows the segments and a
single bar cannot. The navy versions keep theirs, and a test asserts that.

**The Jump Back In copy is gone; only the CTA remains** (2026-09-16). It was an
eyebrow, the course title and "Course · 45% complete" — all three already said a
few lines up by the art, the title and the bar. It also quietly closed a
contradiction: that line printed the COURSE's own progress (45%) directly
beneath a bar reading 62%, two true numbers measuring different things with
nothing on screen saying so. If the copy ever comes back it has to say WHICH
number it is.

**The eyebrow sits ABOVE the art and the title** (2026-09-16). It was inside the
text column beside the cover, which made it the course's label rather than the
block's; lifted out, it names the whole block and the row below is a plain
two-column pairing.

**The art is 132×112** — 84×56 → 132×88 → here. It is no longer 3:2: the text
column grew a progress bar under the meta, and a 3:2 crop finished well above
that stack, reading as a thumbnail left behind rather than as the course. The
WIDTH is held now, not the ratio; `object-fit: cover` does the cropping, so the
photograph is never distorted.

**It is an `<img>` with an `onError` swap, not a CSS background, and that is
load-bearing.** `NY_LH_COURSE_IMAGE` points at
`/courses/ny-life-health.webp`, **which is not in the repo**. The handler falls
back to `getCourseImage`'s stock pool, so the page shows a real photograph
either way — the `FeaturePreviewThumb` mechanism, and precisely the case
CLAUDE.md describes when it says that fallback "lets paths be authored before
the screenshots exist".

That fallback is the ONLY reason a path to a missing file is allowed here.
Without it this is the defect the Resources section shipped four of. Verified in
the browser: the `src` resolves to `/courses/0.webp` today, i.e. the swap fires.

**TO FINISH IT:** save the New York skyline as
`public/courses/ny-life-health.webp`. Nothing else changes — no code, no
fixture. The stock pool is real-estate photography, so until then the cover is
generic rather than wrong.

---

The note below describes the card as it was, and is kept for the restore.

#### Jump Back In was its own widget — in the LEFT column

`JumpBackInWidget` (2026-09-16) — cover, course title, meta, progress bar and the
Resume CTA, in its own card **under the View Requirements link**, below the
Current Learning Progress block.

It was the journey card's top third under a rule. Two reasons it earned a card:
**it answers a different question** ("carry on with this one course" against
"what is the shape of the programme"), and **it was the only unlabelled block on
the version** — every other one carries an eyebrow, and this was the untitled
thing at the top of a titled card. It has "Jump Back In" now.

**It moved from the right column later the same day**, which is the placement to
keep straight — it shipped as the top card of a two-card right-hand stack.
Two things moved it:

- **It belongs to the block above it.** "Carry on with this one course" is the
  next action the progress block's own figures imply. Stacked under the Study
  Journey's title, the two read as one undifferentiated list of "things on the
  right".
- **It gets the width it was short of.** At 330px in the right column the course
  title wrapped to two lines; across the left column (measured 506px, exactly
  the progress block's own x and width) it does not.

**No width and no horizontal padding of its own** — it is a block child of the
left flex COLUMN, so it stretches to the column and lines up with the progress
block rather than being inset by a gutter that block does not have. That is what
"same spacing as the progress section" means here, and a test pins the absence
of a width rather than a pixel figure.

**`marginTop: 20`, and the 40 between the COLUMNS is unchanged.** Two values, so
the grouping stays legible: 40 separates the left block from the right column,
20 says the card belongs to the block directly above it. The right column is now
the Study Journey alone, not a wrapper around a stack — a test asserts that,
since an empty wrapper is the kind of thing that survives a move and then
collects a second child.

**The card is RECESSED as of 2026-09-16** — a flat grey fill
(`--color-neutral-100`), **no border and no shadow**, and a **4px** progress bar
(down from 6), to a supplied reference. `widgetCardRecessedStyle`.

The Study Journey beside it keeps the raised white card, so the two have
diverged — which is fine (one action on one course against the shape of the
whole programme) but **both shells still live in `widgetStyles.ts`**, because
the way two cards in one column stop agreeing is a second shell defined
somewhere else. A test asserts each takes the right one and that both are
declared in that file.

**The grey is a near-miss worth recording.** `--color-primary-100` is the closer
match to the reference — a cool blue-grey, rgb(233 238 242) against the
neutral's rgb(236 236 236) — and it is a **trap: it does not invert with the
theme.** It stays near-white under `[data-theme='dark']`, so the card would have
rendered near-white with near-white text: title **1.05:1**, meta **1.38:1**.
Caught by measuring the token in both themes BEFORE writing it. The neutral
inverts to a navy and holds its relationship to the page either way: **1.08:1
light / 1.19:1 dark** against the page grey, which is deliberately subtle and
matches the reference, where the band is a whisper against white.

**The cover lost its border too.** It existed to edge the art against a white
card; on the recessed grey it draws a box around the only thing in the card that
already has edges.

**The bar no longer matches `CATEGORY_BAR_HEIGHT`, deliberately.** Those two
were pinned EQUAL earlier the same day, on the grounds that two progress bars
inches apart in one column differing by two pixels reads as a bug. What changed
is the reading of what they are: the category bars are a SET of requirement
readings on the bare page, four of them scanned against each other; this is ONE
course's progress inside its own card with the percentage already stated above
it. Different job, different treatment — the rule `readinessFixtures` records
for its own 3px topic bars. Both are named constants (`PROGRESS_BAR_HEIGHT` /
`CATEGORY_BAR_HEIGHT`) and a test names the pair, so if it reads as drift the
fix is to move both.

**The track moved to `--color-neutral-300`** — `-200` measures 1.21:1 against
the recessed card, an empty bar with almost no groove. `-300` is also the
category bars' own track on this version, so the two grooves match even though
the bars differ.

**And the FILL needed a class, which is the defect measuring caught.** It was an
inline `background: var(--color-primary-500)` — correct on white. With the card
on `-100` and the track on `-300`, all three invert to navies in dark, leaving
the fill at **1.22:1 against its own track**: a progress bar with no visible
progress, in a card that rendered perfectly. `.cre-jbi-progress-fill` swaps to
`--color-primary-300` under `[data-theme='dark']` — **4.30:1**, against 4.52:1
for the light pair. Applied in dark only, because the same stop is 1.29:1 on the
light track, so it cannot be one swap. The inline style sets NO background, or
the rule would match, compute and do nothing; a test asserts that.

**`widgetStyles.ts` holds the card shell and the eyebrow.** The two cards are in
different columns now, which makes agreeing on their surface MORE important
rather than less — they are the only two cards on the version and they sit side
by side. A third copy of the shell is how they stop agreeing — the same reason `DELIVERY_LABEL` moved to
`utils/courseDelivery` rather than being copied. Like the journey widget it
resolves neither the course nor the launcher: both are the band's, since two
components resolving "the course to resume" is how they disagree. **Known gap, not
faked:** the reference INTERLEAVES milestones between chapter groups (A1, A2,
Mini Exam 1, A3…). That needs a syllabus saying which chapters a mini exam
covers, and the fixtures carry hour requirements per category, not an outline.
So milestones sit where the category order puts them. Author the outline and the
interleaving is a re-sort, not a rebuild.

**The journey ends with two COMPLETION TASKS** — Complete Student Attestation,
then Download and Print Certificate of Completion — from XCEL's published
certificate-eligibility rules. They are stops rather than a third section
because they happen INSIDE the LMS and XCEL knows whether they are done, which
is precisely the line that puts Schedule / Pass / Apply elsewhere.

They carry **no hours**: a credit-hour figure on "print your certificate" makes
it look like coursework and would land in the gauge's denominator, which is the
state's hour requirement and must not grow by two. And they read **"After your
coursework"** rather than "Not started" until every hour is done — a step the
product will not let you take must not invite the click. Same reasoning as the
Licence & renewals notification saying why its switch is disabled.

#### Get Licensed — the three steps XCEL does not own

`GetLicensedRail`, directly under the journey. XCEL's published route to a New
York licence is four steps; **the Study Journey IS step 1 expanded**, and this
is steps 2–4 (Schedule State Exam · Pass State Exam · Apply for your License).

**They are a separate section because the OWNER changes.** Everything in the
journey happens in the LMS. Nothing here does — PSI schedules the sitting, PSI
scores it, DFS issues the licence.

**So these steps carry NO completion state, and the absence is the design.** A
tick against "Pass State Exam" would be the product claiming an outcome it has
no feed for. Each step gets who owns it, what the learner does, and the
published fee instead. Numbered rather than noded: a numbered list says "do
these in order" and makes no claim about where you are. A test asserts there is
no status field, so wiring one in needs a real feed behind it.

**The lede reads forward** — *"Once your course is completed, here are the next
steps."* (2026-09-16). It said "After your certificate — these three are handled
by the state", which led with the OWNER, a fact each step's own meta already
carries (PSI, PSI, NY Dept. of Financial Services), and made the section sound
like a disclaimer. A learner standing at the end of their coursework wants the
next step.

**Only one step links out** — PSI's New York registration page, stated on the
requirements page. The other two have no URL, because an invented href is the
defect the Resources section shipped four of.

**One more inline-style trap, in the same file, caught the same way.** The PSI
link spread `titleStyle`, which carries `color: var(--color-text-primary)` —
and an inline colour BEATS `.cre-journey-cta`, so in dark mode the link
rendered #f1f3f7 and looked like plain text. The class was present and correct
the whole time. `titleStyleNoColor` exists so a themed class can own the colour;
**do not spread a style that sets `color` onto an element whose colour a theme
class is meant to swap.**

**Status is in WORDS on every stop, and the first build got this wrong.**
`completed` and `not-started` carry no percentage, so they were distinguishable
only by the node — same text, one filled circle apart. Never colour alone.

**Three colours failed in dark mode and only measuring caught them.** All three
were clean in tsc, passed every test, and rendered:

- The milestone title on `--color-cta-600` measured **1.47:1** on the dark card,
  and "Open learning path" on `-500` **1.84:1**. The CTA ramp is a FILL colour
  on XCEL (Brick) — the exact failure `.cre-alert-action` documents. Both are
  classes now (`.cre-journey-milestone` / `.cre-journey-cta`) swapping to
  `--color-cta-300` under `[data-theme='dark']`: 10.34 / 8.24 light, 5.49 dark.
  **Classes, not inline styles** — `CSSProperties` cannot carry a theme
  selector, and an inline `color` would beat the stylesheet anyway.
- The "you are here" node on `--color-primary-600` measured **1.59:1** on dark:
  the one node that says where the learner is was the least visible thing on the
  rail. It is `--color-text-primary` now — near-black on light, near-white on
  dark. Deliberately not the CTA ramp, which is the milestone ring's job.
- The un-started node border on `--color-neutral-300` measured **1.63:1** on
  dark (that token inverts to a navy). `--color-text-tertiary` is 6.19 light /
  6.18 dark — unusually symmetric, worth keeping.

**Known, not fixed:** the spine is `--color-border-subtle`, 1.41:1 light /
1.24:1 dark. It is `aria-hidden` decoration carrying nothing the ordered list
and the per-row status words do not already say, and it is the token every other
divider on the page uses. Raising it is page-wide, not a Study Journey call.

#### The measure is LESSONS — 42, and Part 1 is the journey's first stop (2026-09-16)

The QE dashboard reported credit HOURS (three of whose four figures were
authored here), then briefly DAYS of the study plan. It reports **lessons of the
pre-licensing course** — the unit the product itself uses.

**Where 42 comes from, stated plainly.** The LMS course card: *"0 of 42 lessons
completed"*. It is **not** on the storefront — that page publishes 40 credit
hours, three exam simulators and eight "What You'll Learn" topics, and no count
of lessons, sections, chapters or modules anywhere. So 42 is sourced from the
PRODUCT rather than the catalogue: a weaker footing than a published figure, and
a much stronger one than the hour splits it replaces, which had no source at all.

**CONFIRMED from the product page** (raw HTML, not a summary — the lesson from
the exam-figures correction): "New York Life and Health Pre-licensing Premier",
**$299.00**, Line of Authority "Life and Health", **Credit Hours 40**; the
3-Part Training Program (Pre-licensing Course → Prep Review Course → Exam
Simulator) with **three** simulators unlocked in sequence; **30 days** access to
Part 1 then **30** for Parts 2–3; recommended **70 / 80 / 85%**; and
*"prepares you to pass the insurance exam in less than 2 weeks"*.

**ONLY PART 1 IS COUNTED, and that is the shape of the change.** The 42 lessons
are the pre-licensing course, and the course is the journey's **first stop**.
Parts 2 and 3 follow it as steps with **no count** (`PROGRAM_PART_STOPS`) —
because the storefront states none for them, and giving them invented counts to
keep the gauge multi-segment is exactly the move the hour figures taught us not
to make. They are still ON the journey: leaving them off would say the programme
ends with the coursework, which the product page explicitly warns against
("you may be tempted to stop only after Part 1").

Their `blocked` state is the real rule, not decoration — the page states Parts 2
and 3 unlock "upon completion of Part 1" — and their meta carries what IS
published: Part 2's 80% target, and that Part 3 is three simulators at 85%.

**Consequences worth knowing:**

- **The gauge and the category bars show ONE segment.** That is honest — there
  is one measured thing — and it is why the journey beside it carries the
  programme's shape instead.
- **On Track reports 62%**, against the Progress dropdown's "~63%" label. Near
  enough that the existing label-vs-gauge note covers it; the 7-day model had
  put it at 57%.
- **The first stop reads "26 / 42 lessons"**, the course card's own sentence.
  `JourneyStop.completed` was added for it: a bare "42 lessons" is a denominator,
  not progress.

**The 7-day study plan survives as a confirmed FACT, not a measure.**
`NY_LH_STUDY_PLAN_DAYS` = 7, with the link. Worth keeping: the product page's
own "Read our recommended study plan" points at
`prepare2pass.com/COURSES/study_guides/lh_ca_7days.pdf` — so despite the `lh_ca`
in the filename it is the plan the **New York** page links, i.e. XCEL's Life &
Health plan rather than another state's.

**The recovered chapter list is kept and NOT rendered.**
`NY_LH_GUIDE_CHAPTERS_PARTIAL` holds twelve titles decoded from that PDF via its
embedded ToUnicode maps plus a +29/+30 subset shift (each mapping checked
against a known-good string). It comes back with **no health chapters at all** —
no medical plans, no Medicare, no disability — which a Life *and* Health course
must have, so the extraction is short rather than the guide. It exists so the
next person has the titles and knows what is missing; padding it would be
authoring a curriculum XCEL does not publish. A test asserts none of it reaches
the screen.

**`unitLabel` rides on the PATH**, not as a prop — five surfaces print the unit
(the band's meta line and KPI cell, the category bars, the journey rows, the
detail sheet) and a prop through five is how one gets missed. `synthCategoryCourses`
splits by unit: an **hrs** category over 15 halves into "· Part 1 / · Part 2"
(40 credit hours is not a sequence, so halving is arbitrary but harmless);
**lessons** never split, because the 42 ARE the course.

**"1 days" — the bug the unit change created.** `hrs` is unit-invariant, so
nothing here had ever pluralised a count; the moment a unit did, four surfaces
printed it. `unitCount` in `utils/unitLabel.ts` is the one owner, the
`DELIVERY_LABEL` precedent.

**Credit hours did not disappear.** The state's **40** is a real regulatory
figure and still appears where a regulator's number belongs — the requirements
sheet, the transcript row, the resume card's course hours. Two units on one
screen meaning different things: 40 credit hours is what New York requires, 42
lessons is how XCEL's course delivers it.

**A borrowed fixture broke a neighbouring test, and the fix is the rule.**
`LearnerFocusedBand.test.tsx` took its path from `learningPathsFor('xcel')[0]`
with a comment calling it "Florida Nursing — mandatory + elective". That had not
been first for a long time, and when the New York path lost its elective half
(Part 1 only), a test about the BAND's two-segment rendering failed because of a
fixture it merely happened to borrow. It builds its own path now — the remedy
CLAUDE.md already prescribes for exactly this.

#### New York Insurance Producer — the demo licence

**The figures were invented for one day and are not any more.** They shipped as
flagged placeholders, then were confirmed against XCEL's own published
requirements page (`https://www.xcelsolutions.com/new-york/insurance-license/requirements`)
on the same day. `src/data/nyProducerRequirements.ts` is the single owner:
nothing else in `src/` carries a New York hour count, question count, time
limit, pass mark or fee.

**The distinction the file now exists to hold:**

- **STATE requirements are real** — 40 hours for Life, Accident & Health
  (20 + 20), a 100-question / 2-hour PSI sitting, 70% to pass, $40 exam and $80
  application fees. `invented: false`, and the surface stops apologising.
- **XCEL's PRODUCT hours are still invented** — Prep Review Course, Exam
  Simulators and Exam Cram are XCEL's own prep products and the page states no
  hours for them. The const keeps its `_INVENTED` name for exactly that reason:
  renaming it would quietly upgrade the confidence of three figures that are
  still guesses.

**The 40 happening to match the guess is luck, not a reason to trust the next
one** — the questions (150 → 100), the time (2h30 → 2h) and the provider ("a
state-approved test centre" → PSI) were all wrong.

**Why the flagging mattered in the first place.** The Florida figures these sit
beside were never invented — `readinessFixtures.ts` calls `PASS_MARK` "the only
number on this page that is not invented". Relabelling that 70 as a New York
figure would have turned a true number into a silently false one. So the
Readiness page reads the STATE's facts (`examFactsFor`) rather than a module
constant, and still prints a placeholder line for any state whose figures are
unconfirmed.

**TODO(data):** P&C (90h) and Personal Lines (40h) are published too but not
modelled — the demo is one licence.

**`EXAM_FACTS` was a hardcoded Florida 2-15 block** — correct while Florida was
the only demo licence, and a flat contradiction the moment Home could say New
York, two rail items away, with nothing on either screen admitting it. Same
class as the Study Plan showing a different COURSE from the dashboard. The gauge's
pass mark and the printed one now come from one field, resolved by `useReadiness`
so every tab agrees.

**What is NOT invented: the four categories.** Pre-License Education → Prep
Review Course → Exam Simulators → Exam Cram is XCEL's own 3-Part Training
Program plus the study tool after it — a PRODUCT structure, not a state one, so
it carries across jurisdictions. Only the hour requirements are state-specific.

**SCOPED to the QE persona, not a jurisdiction sweep.** The CE persona is a
different education type and still demos the Florida renewal cycle; the Florida
pre-licensing paths are still in `learningFixtures`. A version switch must not
silently switch jurisdiction, and a test pins CE on `FL`.

**Its study plan is DERIVED from the Florida L&H one**, not hand-authored — same
20-day schedule for the same line of authority, so a copy would be a second
thing to keep in step. **Task dates are deliberately unchanged:** re-pacing
across the longer New York window was the obvious move and is wrong, because
every date-driven surface is anchored to `STUDY_CALENDAR_TODAY` and a
not-yet-started plan renders all of them empty. So the plan finishes months
before the exam, which is coherent rather than a bug — the 20 days are the
COURSE, and the sit date is booked separately.

#### Every rail row is a hoverable, clickable target (2026-09-16)

**`.cre-journey-stop` was a class with NO RULE ANYWHERE.** It had been on the
journey stops since they were built: a clickable row with a chevron and no hover
feedback at all. Same shape of defect as `--color-border-strong`, which did not
exist either — a name that looks wired and is not, and nothing fails.

The rule is in `tokens.css` now, and it covers both rails:

- **`background: transparent` moved from the inline style into the class.** It
  was inline, and an inline value beats a stylesheet rule — so `:hover` would
  have needed `!important` to do anything, and would have looked fine while
  doing nothing. That is the `.cre-uxlinks-title` trap exactly. The class owns
  both states, so neither needs `!important`, and a test asserts no inline
  `background` is left to win.
- **The tint is `--color-neutral-100`**, the same value `.cre-notification-row`
  uses — the established "row hover on a card" here. Two row hovers differing
  by a few percent read as a bug. It is a neutral, so it inverts with the theme
  and needs no dark override.
- **`:focus-visible`, not `:focus`** — these rows are a keyboard user's way
  through the sequence, and `:focus` would ring them on every mouse click.
- **8px of inset tint each side, pulled back with `-8` margins**, so no TEXT
  moves: the row's content stays where it was and only the wash is wider. `-8`
  against `itemStyle`'s gap of 10 leaves 2px clear of the node column.

Measured: the wash is **1.18:1** on the light card and **1.07:1** dark, where it
is a HUE shift (a navy against the card) rather than a luminance one — which a
contrast ratio does not capture. It is decoration; the cursor and the chevron
carry the affordance, and the row title holds 12.79:1 on the tint. Forking the
tint per theme would diverge from `.cre-notification-row` for no accessibility
gain.

**Get Licensed became whole-row targets with it.** It was static text with ONE
link on the first step's title, so three rows describing three actions read as
three paragraphs and the single affordance was a differently-coloured word.

**One target per row, never a link inside a button** — that is invalid HTML, and
two nested targets on a 13px title is a coin flip for the learner. Which element
the row IS depends on where it goes:

- **`href`** → an `<a>` to PSI, new tab, so a learner mid-journey does not lose
  the dashboard to a registration flow. Its accessible name is now the whole row
  (title + detail + owner/fee), which is what a test had to be loosened for.
- **no href** → a `<button>` into the **requirements sheet**. That is the only
  surface describing these three — XCEL's published page covers sitting the
  exam, applying, and the CE cycle after. It is not a per-step destination and
  does not pretend to be; a step-specific page needs content nobody has
  authored, and an invented href is the Resources-slugs defect.
- **neither** → static text with NO chevron, the same rule the journey's blocked
  completion stops follow: a chevron on a row that opens nothing promises
  otherwise.

**`titleStyle` for all three rows now, the PSI one included.** The CTA ink was
carrying "this is interactive" for one step; the hover and the chevron carry it
for every step, and three identical rows is the point. That also retires the
`titleStyleNoColor` trap on that row — there is no longer a theme class there
whose colour an inline style could beat.

#### The "How do I become exam ready?" disclosure is gone (2026-09-16)

A collapsed paragraph under the Study Journey eyebrow, from the reference
design, explaining that the stops run in order and that readiness means
coursework done plus simulator scores holding.

The rail says all of that structurally: the stops ARE in order, each carries its
status in words, and the two assessment stops are marked on the node. A
disclosure explaining the thing directly beneath it is chrome above the content
— and a collapsed one is useful once and invisible after, so nobody who needed
it twice would find it. **Readiness** answers "am I exam ready" with a number
one rail item away; this was a second, wordier answer.

`explainBodyStyle` survives as `railLedeStyle` — the Get Licensed lede is all
that still used it, and a style named for a removed disclosure is how the next
reader looks for something that is not there.

#### There is no learning-path concept on this version (2026-09-16)

Every door onto the `learning-path` section is closed on QE Focused, at
Jillienne's request: **XCEL has no learning-path concept.** The band IS the
programme — there is no separate path object to open.

**One withheld prop closes both doors**, which is why the change is in
`MembershipOverview` (`onOpenLearningPath={qeFocused ? undefined : …}`) rather
than inside the band:

- `StudyJourneyWidget` passes it through as the rail's `onViewAll`, so the
  journey's **"Open learning path"** link stops rendering.
- The band's **TITLE** falls back to `onViewDetails`, so it still opens the
  requirements sheet. It loses nothing and it was the worse of the two doors —
  a clickable title carrying a `title="Open learning path"` tooltip onto a dead
  concept is found by accident.

**The journey-stop fallback moved rather than going away.** Stops are
synthesized (not catalogue course ids), so the in-shell launcher is best-effort
and a launcher opening nothing is the one outcome worse than a second-best
destination. On QE Focused that destination is the requirements sheet — what the
programme actually is — and the learning-path fallback still applies to the
versions that have one. It is asserted at SOURCE, deliberately: the launcher is
available in the test render, so the branch never runs and a DOM test would pass
without exercising it.

**This inverts a guard added earlier the same day.** The requirements-sheet CTA
removal was pinned with "…and 'Open learning path' is still on the page", so the
removal could not become "no way to reach the learning path". That IS now the
intended state, so the assertion is inverted rather than deleted: no button on
the page may say "learning path", and the requirements sheet must be what it
offers instead.

**STILL PRESENT ELSEWHERE, and not swept** — the ask was this version, and the
rest is a product-wide call with real surface area. What remains:

- The **`learning-path` rail section** itself (off in the demo baseline, but it
  resolves from `?section=learning-path`), its `SECTION_TITLES` entry, and the
  `learning-path-page` flag with its V1/V2 variants and "Switch Learning Path".
- The **tabbed detail sheet's "Go to Learning Path" CTA**, which the other three
  consumers still show.
- `LearningPathsHome`, `LearningPathsTable`, `LearningPathCard`, the **Header's
  "Learning Paths" dropdown**, and `learning-paths-count`.
- Copy in `JumpBackInDiscoveryEmpty`, `LearningSetupWizard` ("Building your
  learning path") and four `demoControlsUtil` descriptions.
- `ClpJumpBackInBand` and `MarketingFocusedBand` carry the same
  `title="Open learning path"` tooltip on their titles.

If the concept is genuinely absent for XCEL rather than just absent from this
version, that list is the sweep — and it is a rename-or-remove decision per
surface, not one edit.

#### Time Remaining is 27 days, and `weeksLeft` is a fraction

`RENEWAL_BY_VARIANT['progress-on-track']` reads `ON_TRACK_DAYS_LEFT / 7`
(2026-09-16, the direct ask). "22 wks" read as a learner with no reason to open
the app this month, which is the opposite of what the Study Journey beside it
says. Under 30 days `timeRemaining` switches to a day countdown on its own — so
the fixture reaches for the switch rather than adding a unit.

**NO At Risk treatment comes with it**, which was the explicit half of the ask.
Nothing derives the status from this number for a persona: `STATUS_BY_VARIANT`
supplies a `statusOverride`, and all four bands plus the detail sheet prefer it
over their `weeksLeft`-based `derivedStatus`. The sheet's urgent stat tint reads
the resolved status too, so it stays off. A test asserts it through the RENDERED
strip, not the fixture — an override only matters if the surface honours it.

**The fraction is what made `timeRemainingText` a prerequisite rather than a
tidy.** Three bands were hand-rolling `Math.floor(weeksLeft / 52)` + `% 52` with
no day countdown — `LearnerFocusedBand` interpolated `${weeksLeft} wks`
directly. At 27/7 those render **"3.857142857142857 wks"**. All three read the
shared formatter now (`timeRemaining` for styled segments, `timeRemainingText`
for a string), which is also what makes the band and the sheet it opens agree.
A test asserts none of them still does that arithmetic.

**It is a SHARED map row, so every on-track persona moved**, the CE renewal one
included — `RENEWAL_BY_VARIANT` is keyed by variant with no education axis.

**KNOWN, and older than this change: `deadline` and `weeksLeft` in that map have
never agreed.** `progress-at-risk` is 3 weeks against a date four months out,
and the anchored fixture today (2026-05-11) is 31 weeks from 12/15/2026, not the
22 this row used to carry. They are two independently authored demo values. So
"27 days" sitting beside a Target Date in December is the existing looseness
rather than a new defect — but it is the most visible instance of it, since the
two cells are inches apart. Deriving one from the other is the fix and it moves
every state's visible date, so it is its own change.

#### A removal note rendered as page copy for a day

The note replacing the Learning Path Progress section shipped as a bare
`/* … */` inside JSX rather than `{/* … */}`. In child position that is TEXT,
so twenty-eight lines of rationale rendered on Home, on every version. tsc was
clean and all 700 tests passed; only reading the live DOM caught it.

`QeFocusedVersion.test.tsx` now asserts the rendered overview contains no `/*`
or `*/` across three versions — the whole page rather than this one note,
because the mistake is invisible in review and one keystroke away anywhere.

### The robot stays in the Demo view (2026-09-16)

`AdminToolsMenu` — the hidden robot in the prototype bar that opens the Feature
Flag sheet — used to `return null` whenever demo mode was on, unless a
`?tools=1` back door was set. **It now renders in the Demo view too**, at
Jillienne's request.

**The gate was protecting the wrong thing.** Its stated reason was that a
stakeholder should see a clean demo — but the trigger is `opacity: 0` at rest
and only fades to 60% when its own 32px box is hovered, so there was nothing on
screen to clean up. What it actually cost is the case that matters: **the Demo
row on the gateway opens `/dashboard-rebrand?demo=1`**, which is how most people
arrive, so the one route a reviewer lands on was the one route with no way into
the flag sheet. The `?tools=1` back door is undiscoverable by design, which is
fine for a back door and useless as the primary path.

**What made the gate defensible is still true, and is why removing it is safe:**
demo mode SUSPENDS flag persistence, and the panel already drops *Set as
default* and *Restore original defaults* under `demoMode`. Nothing reachable
from the robot can drift the sandbox or redefine the committed Demo baseline.

**Two things had to change with it, and both are the interesting part.**

**The baseline writes are now refused at the STORE, not just hidden in the UI.**
`saveAsDefault` and `restoreOriginals` had no `demoMode` guard — the only thing
stopping a demoer redefining "pure" from inside the Demo was that the panel did
not render the buttons. That was sound while the panel was unreachable there;
making it reachable turned it into a guard one stale call site from failing.
Both now return early under `demoMode`. Same reasoning as `visibleNotifications`
re-checking `requiredInApp` rather than trusting the stored value, and a test
asserts the refusal rather than the button's absence.

**The sheet says it is in the Demo view.** The sentence "changes preview here
only and reset on exit" lived in the robot's DROPDOWN — which never renders on
the rebrand, because there the robot opens the sheet directly. So a reviewer
would have flipped a flag, left, come back and found it reverted with nothing on
screen to explain it. The notice is at the top of the sheet body now, styled as
a quiet tinted rule rather than a warning banner: nothing is wrong, it is the
demo's own contract. It also explains the footer's missing buttons.

`?tools=1` is no longer read. An old link carrying it still works — the param is
simply ignored.

### The flag audit — 47 flags removed 2026-09-16

The catalog came over from the Common LMS with the product app, and most of it
described surfaces XCEL does not have. **`FEATURE_FLAGS` went from 98 keys to
51**, and the `/dashboard-rebrand` panel scope from 53 to 24.

**How the set was chosen, because the method is the reusable part.** Every flag
state in the catalog was flipped one at a time against a render of all 24 shell
sections plus the ten standalone routes, and the DOM diffed. Of 111 flag states,
**58 changed nothing anywhere**. That is evidence, not inference — but it has one
blind spot worth knowing: it measures the INITIAL render, so a flag whose surface
only appears after a click (a course sheet, a cancel flow, a detail panel) reads
as dead when it is not. Nothing was removed on the sweep alone; each of the 47
also has a structural reason below.

**Three groups, three different reasons:**

1. **The classic `/dashboard` — 26 flags.** `dashboard-kpi-card`,
   `jump-back-in-card`/`-links`/`-chrome`, the eight `jbi-quicklink-*`,
   `learning-path-card`, `courses-summary-card`, `premium-membership-card`,
   `whats-new-card`, `dashboard-rail-tray`, `dashboard-top5-pagination`, the four
   `membership-card-*`, `quick-links-card`, `rubi-tutor-widget`,
   `streak-hero-card`, `dashboard-drag-and-drop`. They drive `DashboardV1`–`V5`
   and `LearnerOverviewPanel`, reachable only at `/dashboard` — which sits behind
   `dashboard-tab` (default OFF, redirecting to Learning Path) and is not what
   the XCEL demo opens. **Home uses its own `OverviewJumpBackIn`, not the classic
   `JumpBackInCard`**, which is the thing to check before assuming a
   dashboard-looking flag reaches the rebrand.
2. **Membership — 18 flags.** `supportsMembership('xcel')` is false, so every one
   of these configures a surface the brand cannot reach. Ten were in the Home
   panel scope. `membership-savings-cta` is the extreme case: **zero
   `useFeatureFlag` call sites anywhere in `src/`** — it existed only in the
   catalog.
3. **Home flags with no XCEL content — 3.** `dashboard-featured` and
   `whats-new-image` both configure `FeaturedHero`, and
   `whatsNewFeaturedFor('xcel')` is `[]` (a standing `TODO(data)`), so the hero
   self-hides whatever they say. `dashboard-whats-new-layout` named the "What's
   Trending" section, archived 2026-08-05.

**The removal pattern, which is the repo's existing one** (see the
`membership-recap-ticket` / `dashboard-hero-bleed` notes): delete the catalog
entry, and at each call site replace the flag read with a **constant pinned to
that flag's committed default**, carrying a comment that names the flag and the
date. Every branch the flag fed is KEPT. Restoring one is re-adding its catalog
entry and un-pinning the constant — never a rebuild.

**Pin the DEFAULT, not `false`.** A `useFeatureFlag` call on a key the catalog no
longer defines resolves to `{ enabled: false }`, which is not what most of these
carried — the surface would change silently rather than error. That is why the
pins are explicit and why `FeatureFlagPanel.test.tsx` asserts the 47 keys are
absent from the catalog AND from `REBRAND_FLAGS`: a key left in the scope after
leaving the catalog is silent, since the panel filters the catalog BY the scope.

**Four things went with them, and each is the interesting part of the change:**

- **`DashboardMVP` is archived** (`ARCHIVED_ITEMS` id `dashboard-mvp-version`).
  It was defined ENTIRELY by `MVP_FLAGS`, a snapshot of eight of the removed
  flags; without them it renders as V3 with `hideRightRail` / `trail` /
  `consolidatedProgress`, i.e. a second near-identical row in the version picker.
  The file is kept, unreferenced. Note five of its thirteen entries were always
  moot — the right-rail ones, which `hideRightRail` already dropped.
- **Per-widget Lo-Fi is gone.** `LO_FI_VARIANT` / `DEFAULT_PLUS_LOFI` appended a
  "Lo-Fi" option to each widget's flag; every flag that offered it was a classic
  dashboard flag. The GLOBAL Lo-Fi switch (`LoFiContext`) is untouched and every
  `LoFiScope` wrapper is still in place — they now receive `on={false}`.
- **`dashboard-clp-fullwidth` lost its "When to show" secondary axis.** Its
  `when-whats-new-off` option waited on `dashboard-whats-new-layout`; with that
  gone the condition is permanently true, so the two options rendered
  identically. `clpFullWidthActive` is now just `showExtras && flag.enabled`.
- **The Demo Controls bar lost two controls**, both of which had stopped doing
  anything: the Persona dropdown's "Hide Featured Section" switch (wrote
  `dashboard-featured`) and the "Multiple memberships" persona (carried
  `requiresMembership: true`, so `personasForBrand` already hid it for XCEL).
  `resolvePersonaFlags`' `whatsNewOn` arm is kept but EMPTY so the `?wn=` codec
  and the function signature are unchanged. The "Membership Version" drill-in row
  went from the flag panel for the same reason.

**What was deliberately NOT removed, and why it looks removable.**
`dashboard-recommended-blurb` is inert at the demo default — the blurb only
exists on the trending/`VibrantCard` treatment, so it needs
`home-recommended-card-ab: trending` to show. It is a real control behind a
combination, not a dead one. The `gift-recipients` trio is the other near-miss:
`supportsGiftRecipients('xcel')` is false, so the panel renders its empty state
either way — but `giftRecipientsFixtures.ts` names that gap as **the one worth
fixing**, so removing its flags would have paved over the todo.

**One bug this surfaced, not fixed here.** `dashboard-career-tools` survives (it
is live on Home, default off) and switching it on prints a **"Member Exclusive"**
badge and *"all included with membership"* on a brand that sells none. It is the
same defect as the Membership Plan card and the Account Details "Member" pill —
`isMember` is true for XCEL because its only tier is `high`. **When a brand
predicate turns something off, sweep for the places that ask the TIER instead.**

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

### The brief-vs-existing extract — a page with no row

[xcel-lms-brief-vs-existing.html](public/prototypes/xcel-lms-brief-vs-existing.html)
(added 2026-09-03) puts **all four** brief/inventory blocks in one document — the
learner ask, the learner inventory, the admin ask, the admin inventory — for
reading the scope in one pass without the wireframes in between. It is
**deliberately not a seventh `PROTOTYPE_FEATURES` row**: it is reachable from the
masthead of both wireframes pages, the same way the walk-through and the exam
spec are, because a second row into the same body of work is what got
`recommended-card-ab-demo` and the four testing tiles archived. So the row count
is still six and `smoke-tiles.mjs` is unchanged.

**Sections 01–04 are lifted verbatim** from `xcel-lms-wireframes.html` §01–02 and
`xcel-lms-admin.html` §01 + §07. That is a copy, and therefore the one thing here
that can rot: **edit the companions first, then re-sync this page.** It was
extracted mechanically rather than retyped, and no generator was kept — keeping
one would rebuild exactly the source/served split the section below records
killing. Three anchors were rewritten on the way in (`#s-arrival` /
`#s-interrupt` / `#s-exam` → absolute `/prototypes/xcel-lms-wireframes.html#…`),
since in-page hashes pointing at sections this document does not contain would
silently go nowhere.

**Its counts are derived from the tables on load, not authored** — `covOf()` reads
the `p-have` / `p-part` / `p-none` class already on each row's pill, so coverage
is never written twice and editing a row moves the tally. That is the direct
answer to the authored-count rot this file warns about under `RESEARCH_DECISIONS`.
Currently **27 rows — 13 Built · 5 Partial · 9 None** (learner 19, admin 8). Note
the admin inventory's own two labels, *Most of it* and *The roster half*, sit at
the Built and Partial levels respectively and the filter classes them that way;
add a sixth pill class and it will be counted as none of them.

### The Admin & Learner build plan — the second page with no row

[xcel-finserv-build-plan.html](public/prototypes/xcel-finserv-build-plan.html)
(added 2026-09-03) is the build tracker for the two **surface domains** the FinServ
strategy documents name — Learner Experience and Admin & Analytics. It answers a
different question from `xcel-lms-brief-vs-existing.html`: that page asks *what did
the brief ask for and does it exist*, this one asks *what has to be built, is it
built somewhere already, and what blocks it*. **66 rows** in 12 groups.

Built from **three** sources, not one — the Learner and Admin Wireframe Brief plus
two documents that page predates: the **FinServ Domain Build Plan** and the
**FinServ Platform Strategy Packet (domain view)**. All three live behind Cloudflare
Access and cannot be fetched by any tool; they were read from locally saved HTML.

**Like brief-vs-existing, it is deliberately not a `PROTOTYPE_FEATURES` row** — it
is reachable from the masthead of all five companion prototypes, for the same
reason (a second row into the same body of work is what got
`recommended-card-ab-demo` and the four testing tiles archived). Row count is still
six and `smoke-tiles.mjs` is unchanged.

**The one modelling decision that governs the whole page:** the status pill answers
*is this built in product code somewhere already* — **not** whether we have designed
it. Design coverage is the **Example** column: a link means there is an XCEL
prototype to open, an em dash means it is undrawn. Keeping those apart is the point.
The most dangerous rows are the ones thoroughly designed and built nowhere — the
learner skeleton slice is `None` with the most complete prototype we own — and a
single blended score would hide them. The footer states this; there is no legend
(the "How to read this" section was removed on request).

**Everything renders from one `ITEMS` array** — table, filter counts and detail
sheets all read it, so a status cannot disagree with the tally reporting it. That is
the same authored-count rot this file warns about under `RESEARCH_DECISIONS`, closed
by construction rather than by discipline. **Notes are authored in that array**
(`notes: [{d, t}]`) — there is no editing UI and no persistence layer, which was a
deliberate choice over the Netlify-Blobs pattern `qa-notes.ts` uses. Appending a
note is a file edit.

**Two hazards specific to this file.** Rows are object literals, so a **duplicate
key is legal JavaScript and silently drops data** — the last one wins. That has
already happened once (a second `notes:` added to a row that had one). Audit by
splitting the array on `{ ref:` and counting keys per row; `node --check` will not
catch it. And a fifth pill class would need `ST` and the chip order updated together
or it renders unstyled and uncounted.

**Currently 11 Built · 23 Partial · 19 None · 8 Needs info**, plus **5 Compass rows
parked** at Jillienne's instruction — listed but unscored and excluded from the
counts, so the tally is not flattered by work we are not doing. 22 rows carry open
questions, flagged by an amber dot on the Details button.

**Where the Common LMS comes in.** A pass over
`jill-dashboard-ux-designs` (2026-09-03) moved several rows, and the headline is that
**Track B is not from zero**: that project already ships **26 shared UI primitives**
and the shell as separable components (`PlatformShell`, `PlatformSideNav`,
`AppLayout`, `Header`). The build plan's "assume no code exists" premise is wrong
about the design system. Two traps found there worth not repeating:
`/account/notifications`, `/account/licenses` and `/account/transcripts` all exist as
**routes that render a "not built yet" placeholder** — route names in that project
are not evidence of a design; and its certificate model carries a real three-way
`CertReporting` union (reported / pending-roster / non-reporting) which is the
concrete precedent for the admin provenance work.

**It has no test coverage.** `smoke-tiles.mjs` only checks `PROTOTYPE_FEATURES`
rows, and this page has none, so nothing verifies its 66 rows, that its links
resolve, or that a pill matches its count. That is a real gap given the
duplicate-key hazard above.

### The study plan — the third page with no row

[xcel-study-plan.html](public/prototypes/xcel-study-plan.html) (added 2026-09-16)
explores goal-setting and the states after it, from a reference concept Jillienne
brought in — a "Weekly Study Goal" card offering Aggressive / Recommended /
Relaxed in *credit hours per week*, plus Custom and a small My Date field. It is
**not a `PROTOTYPE_FEATURES` row**, same reasoning as the two pages above; it is
reachable from the masthead of every sibling. Row count is still six.

**The inversion is the whole argument.** The reference asks the learner to set a
**pace** and derives a **date**. Both of those are backwards: the pace is the
number nobody can judge (is 5 credit hours a week a lot?), and the date is the one
the learner already owns, from outside the product — a start date at an agency, an
exam window, a job. So this page splits them into two objects and states who owns
each: **the Goal is one date, learner-owned, changed only explicitly; the Plan is
a pace, system-owned, re-derived silently whenever anything moves.** Everything
downstream falls out of that. In particular the "behind" states become answerable,
because you can ask *which of the two moves* instead of quietly sliding both.

**Two dates, two colours, and this is where the desktop palette split earns its
keep.** Coursework-complete is `--primary-*` (ours, data, we control it); the
state-exam sit date is `--brand-*`, red's single semantic everywhere else in this
product. A picker that returns one date has already lost the distinction. A smoke
assertion counts inline `--brand-500` uses in the picker and fails if red starts
carrying a second job.

**The pre-plan window is triggered by earned progress, never by elapsed days.**
Four stages — Unplanned (no goal surface at all) · The offer (one dismissible
inline line) · The card (persistent, still dismissible) · Load-bearing (the only
non-dismissible one, and only because booking a PSI seat needs a date). The move
that makes it work is stage 1: the first offer is **pre-filled from the learner's
own observed rate**, not a house default, which is what makes the word
"recommended" mean anything. The rate axis in the demo bar proves it — flipping
Fast to Slow moves the quoted date by more than two weeks, and a test asserts that
it does.

**The finding that contradicted the brief.** Jillienne framed this as a 30-day
scope. It is — but a 40-hour course finished in 30 days needs **the top preset,
not the middle one**: roughly 105 minutes a night, five nights a week at a typical
rate, and past the strain threshold at a slow one. So *30 days is the aggressive
end of this course, not its default*, and any copy implying a month is the normal
path sets the drift states up to fire for nearly everybody. The page computes that
sentence rather than asserting it.

**The tolerance is the design.** Of the five drift states, the load-bearing one is
*slightly behind*, where the correct behaviour is to show the learner **nothing**.
A plan that raises its voice for one missed Tuesday teaches them to discount it,
and by the time it has something real to say they have stopped reading.
`DRIFT_TOLERANCE_INVENTED` exists so the first alert anyone sees is worth acting
on. The one above it — *date at risk* — prices **both** options and pre-selects
neither, because a product that silently slides its own finish line is why nobody
believes completion estimates.

**Invented rules, same convention as the admin tool:** `NUDGE_AFTER_INVENTED` ·
`ESCALATE_AT_INVENTED` · `EXAM_BUFFER_INVENTED` · `DRIFT_TOLERANCE_INVENTED` ·
`DRIFT_ALERT_INVENTED` · `STRAIN_MINS_INVENTED` · `CEILING_MINS_INVENTED` ·
`AHEAD_OFFER_INVENTED`. Each is one named constant with an owner, rendered into
section 06 of the page **from the same array the logic reads**, so the
documentation cannot disagree with the behaviour.

**Nothing on the page is an authored date.** Every figure derives from the two
demo axes and those constants — the same discipline the build plan applies to its
counts, and the reason the suite can assert relationships (sit date = coursework
date + buffer, moved date is later, pulled-in date is earlier) rather than string
matches. Guarded by [smoke-study-plan.mjs](smoke/smoke-study-plan.mjs), **58
assertions**, which walks all four stages and drives the real date input through
comfortable / strained / impossible / inside-the-buffer.

**Open, and marked so on the page:** whose deadline wins when an agency sets one
and the learner sets another (the admin roster's Risk column would then be
measuring against a date the learner never agreed to); whether the plan cares
*which* evenings or only how many minutes; whether a sit date can honestly be
quoted at all before PSI availability is known; and the fact that stage 2 wants
the dashboard's second slot — the slot the recommended band occupies in classic
and editorial deletes outright. Those two cannot both be the second thing.

### The collapsible rail — the fourth page with no row

[xcel-nav-collapse.html](public/prototypes/xcel-nav-collapse.html) (added
2026-09-16) explores collapsing the learner desktop rail to icons. It is **not a
`PROTOTYPE_FEATURES` row**, same reasoning as the three pages above; it is
reachable from the masthead of every sibling. Row count is still six.

**Scope is the learner rail only** (`xcel-lms-desktop.html`'s `.rail`), and the
admin tool's left-nav is explicitly out — it is deeper and has a second level, so
the flyout question resolves differently there. The exploration is deliberately
core-only: collapsed vs. expanded and the tooltip. Auto-collapse, breakpoints and
per-user persistence are section 05 holes, not built.

**Three treatments, one rail.** A · icons only (64px) · B · icons + micro-label
(88px, **Jillienne's pick 2026-09-17 and now the page default**) · C · icons +
hover flyout (64px). They are not three visual styles but
three answers to *where the words live now* — a hover, a shortened on-screen copy,
or a temporary panel. The demo axis re-renders the same seven sections through all
three, so they are judged against the same nav rather than three sketches.

**The load-bearing claim, and the reason the suite is weighted the way it is:
the accessible name must survive collapse, and must not come from the tooltip.**
Every label element stays in the DOM in every state — collapsed it moves to a
clip-path box rather than being deleted. The tooltip attaches with
`aria-describedby`, never `aria-labelledby`, and one assertion **deletes the
tooltip node outright** and requires every button to still be named. Wiring the
name through `title` or through the tooltip is the defect the page exists to rule
out; it strands anyone not using a pointer.

**Two real defects the suite caught while it was being written**, both worth not
repeating. (1) Concept B rendered the micro-label *and* the full label into the
accessibility tree, naming the button "Dash Dashboard" — the short label is now
`aria-hidden` and the full one supplies the name. (2) **WCAG 2.5.3 Label in
Name**: the Explore section was "Recommended" with a micro-label of "For you",
which is a button a voice-control user cannot ask for out loud. The **full label**
became *Recommended for you* rather than inventing a worse short one. An assertion
now checks every pair, so the next micro-label that is not a substring of its own
full label fails a test.

**Three more things that only bite collapsed.** The selected-state indicator stops
being a 3px left border (an edge stripe beside a centred glyph reads as a
rendering artefact) and becomes a filled pill on the glyph — still on the
palette-scoped light `--rail-accent`, because collapsing makes that indicator the
*only* thing saying where you are. The group captions go, replaced by a rule, but
each group keeps its `aria-label`. And the "Behind" badge becomes a dot, which is
colour alone — so **the word moves into the accessible name**; losing the pill is
fine, losing the word is the bug.

**Invented rules, same convention:** `TIP_HOVER_DELAY` (400ms) ·
`TIP_FOCUS_DELAY` (**0** — there is no such thing as an accidental Tab) ·
`TIP_CLOSE_GRACE` (120ms, so the tooltip is hoverable per WCAG 1.4.13) ·
`FLYOUT_OPEN_DELAY` (220ms) · `SHEET_BELOW_PX` (900 — under it the rail does not
collapse to icons at all, because a device with no hover cannot reach a tooltip).
Section 04 renders them from the same array the logic reads.

**Where the collapse control sits is a second axis, and the answer is the
bottom** — narrowly, and for one reason. Top is Slack/Notion, bottom is
Linear/Figma/Jira, and three of the four usual arguments do not decide it here:
tab order costs the top one stop (small), the below-the-fold case against the
bottom does not apply to a seven-item nav (it would to the admin left-nav, which
is why this page does not speak for that one), and the pointer-distance point for
the top is real but cheap, because collapsing is a weekly action. **The decider is
the mobile sheet.** Under `SHEET_BELOW_PX` the rail becomes a sheet needing a
*menu* button, whose conventional home is the top left — so a top-placed collapse
control makes the same pixel two different controls at two widths, one resizing a
persistent rail and one opening an overlay. The bottom keeps them apart by
construction. Taken either way: collapsed, the profile block leaves dead space
beside a lone avatar, which still wants solving.

**The toggle moves in the DOM, not in CSS**, and the suite asserts that rather
than appearance — because a CSS-only move (`order`, absolute positioning) would
leave the tab order unchanged and silently make the whole argument false. The
same rule is why the top placement is not faked by rendering it last and
positioning it first: that sends focus backwards up the rail (WCAG 2.4.3). **A
tab-order readout under the stage is read off `#railNav` on every render**, so it
cannot describe an order the rail does not have; a test requires it to change
when the axis moves.

Guarded by [smoke-nav-collapse.mjs](smoke/smoke-nav-collapse.mjs), **75
assertions**. Note the suite passes `url:` to JSDOM — without an origin every
`localStorage` access throws `SecurityError`, and since the page wraps its own
reads in try/catch (so it survives a private window) a suite missing that would
silently test a page whose persistence never ran. The hover assertions await the
real delay; **the focus assertions deliberately await nothing**, because that is
the claim.

### Study Pace & Readiness — the fifth page with no row

[xcel-study-pace-readiness.html](public/prototypes/xcel-study-pace-readiness.html)
(added 2026-09-17) draws the two empty cards in the dashboard's second row — the
"Study Pace" and "Readiness" placeholders in the Atlas-style mock — in every state
each can reach. It is **not a `PROTOTYPE_FEATURES` row**, same reasoning as the
four pages above; it is reachable from the masthead of every sibling except the
build plan (which carries no sibling links at all). Row count is still six.

**The two widgets ask different questions and must not blur.** Study Pace asks
*will the coursework finish before the exam date* and is about **time**; Readiness
asks *of what you have covered, what has not held up* and is about **knowledge**.
Decisions made with Jillienne on 2026-09-17, all of which the page encodes:

- **Pace is measured from lessons completed per week, not time on task.** An open
  tab is not studying. Minutes appear only as the *translation* of a required or
  observed pace into an evening (`MINS_PER_LESSON_INVENTED` ×
  `NIGHTS_PER_WEEK_INVENTED`), never as the thing measured. One ratio —
  observed ÷ required lessons/week — decides the state.
- **Behind recommends more time, once, and nothing else.** No "move your date"
  fork on this widget (the study-plan page prices both; this one deliberately
  does not, on the reasoning that a booked PSI date is fixed). The one exception
  is **Not enough time**: past `CEILING_MINS_INVENTED` the honest sentence has to
  mention the date, and the button goes to a person.
- **Slightly behind reads as On track.** Between `PACE_TOLERANCE_INVENTED` and 1.0
  the copy is *identical* to On track and a test asserts that. The coursework
  buffer (`COURSE_BUFFER_INVENTED`) before the exam is what makes the silence
  honest. Note the mock's own state (26/42, 27 days, 5 lessons/wk) sits **in that
  band** at ratio 0.98 — the ladder's On-track exemplar was moved to 5.6/wk so the
  two rows demonstrate different ratios.
- **No percentages, anywhere on either widget.** The quiz score exists
  (`QUIZ_SHAKY_INVENTED`, 70%) and sets the threshold; it is never displayed. A
  test sweeps all 120 axis combinations and fails on a single `%`.
- **Readiness lists topics and has no verdict before the practice exam.** The word
  "ready" is not allowed until the practice exam (a whole-outline instrument) has
  been taken — coursework complete with every quiz clean still reads *"Take the
  practice exam to see whether you're ready."* In practice-exam mode the list can
  name a chapter not yet reached, marked *Not covered yet* with a **Preview** link
  rather than Review. Before it, the eyebrow scopes the claim: *Readiness · what
  you've covered*.
- **Three treatments, side by side, undecided.** A · chapter titles (every
  line resumes a lesson) · B · state-exam outline domains (the exam's language, and
  what the practice exam already reports in) · **C · a scored gauge** (added the
  same day at Jillienne's request, from a "Readiness Score · 84 · 70 to pass"
  reference). Chapters 1 and 12 both feed *Insurance Regulation* so B dedupes and
  says *Two chapters feed this*; a test asserts B is never longer than A. **C's
  score is quiz + practice-exam results only — completion is deliberately not an
  ingredient**, because the reference blends it in and that makes a progress
  number wear a readiness badge (a learner at 40% with perfect quizzes would score
  badly for a reason unrelated to knowledge). Its per-chapter scores are
  `FIXTURE_SCORES_INVENTED` (86 strong · 56 shaky) since real scores are not in
  the fixtures; the pass mark is `PASS_MARK_INVENTED` (70). The pill (*Above / Below
  the pass mark*) is asserted to agree with the number in every state, and C is
  asserted never to say "ready" or show a `%`.

**Red is spent on exactly one thing:** the state-exam tick on the pace timeline.
Coursework-due (dashed ring) and projected-finish (filled dot) are both
`--primary-*`. A test greps the stylesheet for `.tl` rules using `--brand-500`
and requires both to be `.exam`.

**This is not Compass readiness**, and the page says so in §05. Compass computes a
probabilistic low/med/high we do not own; this is deterministic and ours (*what
you've shown us*, not *what we predict*). If both ship on this dashboard the second
row has two cards answering "am I ready" by different methods — the same collision
the admin roster's Risk column has. Listed as a hole, unresolved.

**Invented rules, same convention:** `COURSE_BUFFER_INVENTED` (5d) ·
`PACE_WINDOW_INVENTED` (14d) · `PACE_MIN_LESSONS_INVENTED` (3) ·
`PACE_TOLERANCE_INVENTED` (0.85) · `PACE_AHEAD_INVENTED` (1.3) ·
`MINS_PER_LESSON_INVENTED` (35) · `NIGHTS_PER_WEEK_INVENTED` (4) ·
`CEILING_MINS_INVENTED` (210) · `QUIZ_SHAKY_INVENTED` (70) ·
`PRACTICE_UNLOCK_INVENTED` (0.5) · `PASS_MARK_INVENTED` (70) ·
`FIXTURE_SCORES_INVENTED` (86 · 56). All in one `RULES` array with an owner each,
read via `R(key)` and rendered into §06 from the same array.

Guarded by [smoke-pace-readiness.mjs](smoke/smoke-pace-readiness.mjs), **42
assertions**, which sweeps every combination of the four demo axes and asserts
relationships (Behind's head sentence agrees with where the projection lands; every
state is reachable; quiz mode never lists an uncovered chapter) rather than strings.

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
`../public/prototypes/` rather than a source next door. A sixth,
`smoke-study-plan.mjs`, was added 2026-09-16 with the study-plan page, and a
seventh, `smoke-nav-collapse.mjs`, with the collapsible-rail page the same day, and an
eighth, `smoke-pace-readiness.mjs`, on 2026-09-17. Run them
with **`npm run smoke`** — 41 + 48 + 210 + 42 + 58 + 75 + 42 + 21 = **537 assertions**. Two things
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

### The editorial style — a THIRD axis, and the one place red is spent

**Added 2026-09-10.** `data-style` on `<html>`, values `classic` (default) and
`editorial`, sitting beside `data-theme` and `data-palette` as an independent
axis — editorial × teal × dark compose rather than fork. It is reached from the
**robot icon in the appbar**, not the prototype bar: palette and theme are things
a reviewer flips while judging one design, and this is a choice *between* two
designs, so it belongs with the demo tools. The robot menu, dropdown and
left-anchored panel are ported from `xcel-admin-tool.html` (same `ph-*` class
names, so the two files stay diffable) with two forced differences: this file has
no left nav, so the trigger sits in the appbar util cluster, and it opens
**downward**. Switch Account is the entry point the fork built and left
non-functional; here it actually switches, and persists to
`localStorage['xcel.dt.style']`.

**Editorial is a reduction, not a re-skin.** Cards and shadows give way to
hairline rules and warm ground; one tinted band carries the single promoted
thing; type does the work containers used to. Five cards become three sections —
`MembershipKpis`' four stat tiles fold into the masthead fact line,
`DashboardRecommendedBand` is dropped outright (an Explore concern with its own
nav item, and a carousel is the one thing that cannot be quiet), and
`ClpJumpBackInBand`, the gauge and `ExamDateCard` are re-drawn.

**NO RED — and that is a product decision, not a colour one.** Editorial drops
`--brand-*` entirely except ONE badge, the Rubi mark. The consequence is that in
classic, red carries the external licensing exam as its only semantic; editorial
has no red to spend on it, so **the exam is carried by ink, a hairline rule and
the words "Licensing exam · not a course task"** instead. Nothing is *lost* — the
desktop rule was always that the exam is labelled in words and never by colour
alone — but the emphasis is gone. Reinstating it means giving the exam its own
non-red accent, not reaching back for `--brand-*`. The wordmark's `X` and both
avatars are red's other two uses, so they go to ink and neutral. A smoke
assertion counts `--brand-*` references in the editorial body and fails above
one, because this claim is a single careless `color:var(--brand-500)` away from
being false. Note also that the Rubi block imports a **Compass** concept onto an
XCEL surface — the assistant does not exist in the XCEL product yet.

**The type answer, once the reference's serif was rejected** (Jillienne's call —
stay in Open Sans): **one family, not two.** Editorial points `--font-heading` at
Open Sans and drops Lato, getting its character from size, weight and tracking
instead — 300 at 40px for display, tracking at -.025em, eyebrows retracked from
.07em to .14em, body held to ~62ch. Weight 300 was added to the font link for it.
A new **`--font-brand`** token pins the XCEL lockup to Lato and is never
overridden by the style axis, for the same reason the brand red is not a palette
choice: the wordmark's face is not a theme decision, and it stands in for
`/brand/xcel.svg`.

**What the warm ground cost, measured.** `--page` is `#faf8f5`, *lighter* than the
cool `#f4f4f6` it replaces — which is exactly why the reference's green/ochre
status bars could not come over: `--success-500` fell to **4.27:1** as a label and
`--warning-500` to **1.71:1** as a bar. So status here is carried by label text,
the warm row wash (`--ed-wash`) and the button treatment, with **every bar a
single primary fill on the taupe track**. Both failing values are asserted as
*still failing*, so reaching for them again fails a test. Dark editorial's
`--ink-3` is `#9b948a` and NOT the `#918a80` that matches the light ramp's step:
that measured 4.22:1 on `--ed-band`, and darkening the band instead would have
cost its separation from the page.

**The light rail — the second pass, and where "lighter" actually lived.** The
first editorial pass changed the content and left the chrome, and it still did
not read as light: the **near-black rail was the heaviest object on the page**,
and no amount of warm ground in the content column outweighs it. So editorial now
puts the rail **on the page ground** with a right hairline defining it, the way
the reference's near-white nav does, and reshapes it — the 3px left accent border
becomes a rounded pill inset from the rail edge, and **the glyph column is
dropped** (the reference's nav is text-only; at this weight an icon column reads
as clutter). Both are one rule each to reverse. The appbar loses its opaque white
for the page ground too, because white chrome over a warm page is a visible seam.

Getting there needed the rail's colours to *be* tokens first. Three of them were
hardcoded `#fff` and `rgba(255,255,255,…)` across four places — `.rprof .nm`,
`.ritem:hover`, `.ritem[aria-current]` and **one inline style built inside
`renderRail()`**, which is the one a CSS-only search misses. They are now
`--rail-ink` / `--rail-active` / `--rail-hover`, with the original values as the
`:root` defaults, so classic is unchanged and asserted to be.

**Two findings from it.** (1) **`--rail-active` is `#d5dde8`, not the `--ed-band`
tint it wants to be.** The band tint measured **1.13:1** against the warm page,
because a cool tint at the same lightness as a warm ground differs in **hue, not
luminance** — and hue alone cannot say "selected". `#d5dde8` reaches 1.29:1, and
the active item *also* goes to weight 700, so selection never rests on a 1.3:1
fill. The band tint is asserted as still failing. (2) **`--rail-accent` is
deliberately not repointed.** It is the palette's light stop and it serves the
focus rings on the **dark prototype bar**, where a navy primary would measure
~1.5:1 and strand keyboard users; the editorial rail gets its own focus colour in
a rule instead. A test asserts editorial never redeclares it. Same trap in
miniature: the demo strip's 2px bottom rule was that light stop as well, chosen
for a near-black bar, and it disappears on a light one — so editorial overrides
it to the primary. **Dark editorial keeps a dark rail**: "light rail" was about
weight on a light page, not about inverting the dark theme, and the two should be
one design rather than two.

**Scope, stated plainly:** the editorial *layout* is the home page only. The other
six sections still render their classic cards, now on the warm ground and beside
the light rail. That hybrid is deliberate — the exploration is the home page —
but it is the thing to look at first if editorial ever gets promoted past
exploration.

**The one bug this shook out, worth not repeating.** The band and the assignments
list disagreed about the current chapter — the band inherited classic's hardcoded
"58% through" copy while the list derived 40% from hours, so one screen showed two
figures for one chapter. Both now read a single **`edReqWalk()`**, as does the
Rubi block's heading, and a smoke assertion checks the *agreement* rather than the
numbers. Anything either surface says about the current chapter has to come from
there.

**Known fixture artifact, not a design bug:** the progress and exam demo axes are
independent, so any pairing is reachable — including a licensing exam dated
*before* the target date for finishing the coursework that qualifies you to sit
it. Classic has the same quirk; editorial only makes it visible by putting both
facts on adjacent lines.

**The palette is now guarded by tests, which it was not before.** `smoke-desktop.mjs` went from 51 to 100 and now **210 assertions**: it parses the real declared hex out of the stylesheet (so the assertions track the CSS rather than a copy that can drift) and sweeps all three palettes × light/dark for rail-active ≥3:1, rail-chip ink ≥4.5:1, link/500 ≥4.5:1 on white, white-on-fill ≥4.5:1, the two gauge segments ≥1.6:1 apart, and `--on-primary` ≥4.5:1 on the dark fill. Following [`ProfilePersonalizeContrast.test.ts`](src/test/ProfilePersonalizeContrast.test.ts), it also asserts the **old failing values still fail** (`#a81c24` at 2.05:1 on the rail; `#c75159` still the marginal 3.41:1 stop) so a future palette reaching for either fails a test instead of quietly shipping an invisible rail indicator — and it asserts the hero gradient stays gone. **Two demo axes are live and both re-render everything**: `dashboard-education-type` (Pre-Licensing ⇄ Continuing Ed — renames every category label, swaps Target Date for License Expires, and hides the renewal cycle for pre-licensure, since there is nothing to renew yet) and `dashboard-progress-state` (the five compliance states). A third, **Exam**, has no counterpart in the dashboard project: four of the licensing exam's six states are DERIVED from the sit date, so there is no way to click to them — the control exists for the same reason the walk-through has a clock. **A provenance toggle in the prototype bar** overlays each card with the real component it came from plus a per-section note on what was reused, what was dropped and why — it is the answer to "what actually overlaps", made checkable rather than asserted. **The logo is a text lockup with an `<img src="/brand/xcel.svg">` in front of it that hides itself if the file is absent** — drop the real asset at that path and it appears with no code change. **The two original contrast findings survive the re-palette as a RULE, not as two hex values.** They were: the XCEL red measures **2.05:1 against the near-black rail**, under the 3:1 a state indicator needs; and `#c75159`, the stop that cleared it, is an awkward mid tone where **neither white (4.42:1) nor near-black (4.09:1)** reaches 4.5:1 at chip size. Generalised: every palette puts a **light** stop on the rail (`--rail-accent`, now 5.34–6.01:1) and fills chips with a **light tint over dark ink** (`--rail-chip` / `--rail-chip-ink`) rather than a saturated fill. Re-measure before darkening any of them. Same trap as the McKissock secondary/tertiary ramps documented under Free Content promo bands.

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

### The prototype bar — and the one layout contract it introduced

Added 2026-09-03 so the fork can reach its siblings; it had no cross-prototype
links at all, because the only chrome it inherited was PartnerHub's `top-nav`
**product** header, and a link dropped in there reads as a product nav item.

The bar reuses the sibling prototypes' own `pbar` / `plink` / `tag` / `sp` class
names (zero collisions in this file, so no prefix was invented) and lives in one
`<style id="pbar-css">` block plus one markup block after `<body>`.

**`--pbar-h` is the only thing coupling it to the product layout.** `.top-nav` is
`position: fixed` at `height: 80px`, and that 80px was hardcoded in **nine** offset
rules — `.left-nav`, `.main` (margin and min-height), `.fav-views-page`,
`.gsp-sheet`, `.ap-panel` (top and height each) and `.cs-body`. All nine now read
`var(--pbar-h, 0px)`, **with the fallback deliberate**: delete the two bar blocks
and every offset reverts to 80px on its own. Change the height in the one
declaration, never in nine places.

**There is deliberately no theme toggle on it.** This fork is light-only — the 761
hex literals bypassing its `:root` map are a prerequisite for a dark theme — so a
toggle here would be a control that lies. The bar says "light only" instead.

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

Plus two XCEL-specific ones. First, that every **document** row's `externalUrl`
is a **same-origin** `/prototypes/…` path which exists in `public/` (corrected
2026-09-03 — this said "an absolute URL on a single shared origin", which
predates the 2026-09-02 move off the cross-origin pointer and contradicted it;
scoped to document rows 2026-09-08, when `xcel-dashboard` arrived as a route).

Second, **what sits in Demo** — the ungated front door. This one said "Demo is
empty" and claimed to be the tripwire that fails when a row is promoted. **It
would not have.** It only asserted one gated row's title was absent, which
stayed true whatever else appeared, so the promotion passed it and three
unrelated `externalUrl` assertions caught the change instead. It compares the
whole rendered section now, in both directions, and both were verified to fail
before being relied on.

Written because the port couldn't be verified visually, and because the failure
mode that mattered — a missing provider throwing on mount — renders a blank page
that looks like a styling bug. Extend it when you add a section or change
`sectionOf`; `EXPECTED_PLACEMENT` in that file is the list to update when a row
moves.

[`src/test/Links.test.tsx`](src/test/Links.test.tsx) covers the Links section —
the scheme allow-list at both boundaries, the ungated placement, the live nav
badge, and the no-endpoint state. See the Links section above for why each of
those is pinned; the two that shipped wrong once are the badge and (in the
launch config) the worktree functions path.

The six row-backed prototype pages are covered separately by the jsdom suites
in [`smoke/`](smoke/) — **`npm run smoke`**, 537 assertions across eight files. They
are plain node scripts, not vitest, so `npm test` does NOT run them; run both.

**Three pages have no suite at all**, all of them row-less ones:
`xcel-lms-brief-vs-existing.html`, `xcel-finserv-build-plan.html` and
`xcel-clp-todays-tasks.html`. The build plan is the one that matters — 66 rows of
authored data, a JS render path, and a duplicate-key failure mode that is legal
JavaScript. Adding a suite for it is the most valuable test work outstanding in
this repo. (The fourth row-less page, `xcel-study-plan.html`, ships with its own
suite — being row-less is not a reason to go uncovered, it is only the reason
`smoke-tiles.mjs` will not notice.)

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
