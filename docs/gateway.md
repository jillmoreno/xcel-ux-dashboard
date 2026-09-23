# The UX Dashboard gateway

The project list at `/` — sections, the Refinement board, Links, the two
Netlify sites, the guides, and the rows that point at everything else.

> Moved out of `CLAUDE.md` on 2026-09-21, verbatim. The root file is the map;
> this is one of the five surfaces it points at. Cross-references to "CLAUDE.md"
> in older code comments mean this material.

---

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


## The home page (`/`)

[`UxDashboardPage.tsx`](src/pages/UxDashboardPage.tsx) — a left nav over a
project list. Unchanged from the LMS original apart from three strings (the
brand sub-line, the Research row label, `RESEARCH_DECISIONS`), so anything the
LMS `CLAUDE.md` says about it holds here.

**Sections.** Six open, under three eyebrows added 2026-09-23 for the public
Demo build — **Demo** (Prototypes), **Design & Research** (Refinement · Other
Links · Research), **Dev Handoff** (Development · Done) — then a divider
under a **UX & DEV ACCESS** eyebrow holding Design · Exploration · Sandbox ·
Archive · QA Notes · To Do · Contributing. Development and Done were pulled
out of the `design-and-development` gate for this (see `NAV_EYEBROWS` and the
comments on those two `SectionDef`s in `UxDashboardPage.tsx`) — they are no
longer restricted and now show on the public build. Design, Exploration,
Sandbox, Archive, QA Notes, To Do and Contributing keep the gate, unchanged.
Prototypes is first and is the landing section (`DEFAULT_SECTION`); a bare `/`
opens it and selecting it drops `?section=` from the URL.

### The two guides (2026-09-18)

Two static pages, each with a PDF rendered FROM it (weasyprint; the command is
in each file's header comment and in the README), sharing one stylesheet at
`public/guides/guide.css`:

| Page | Audience | Reached | On the public build |
|---|---|---|---|
| `public/contributing/index.html` | designers | the gated **Contributing** section — an iframe of the page (`GuideFrame`) — and `/contributing/` directly | 404'd at the edge: `/contributing/*` is in `BLOCKED` |
| `public/about/index.html` | stakeholders | the **"How to read this dashboard"** link at the foot of the rail, OUTSIDE the `<nav>`, on every build | reachable — it is the orientation a reviewer gets |

### Review recaps (2026-09-22)

`public/recaps/` holds the notes written after a review session —
`pd-review-recap-0922.html` is the first. It sits under `public/` for one
reason: so the team can open it on the **branch build**, the same way they open
anything else there. It is not linked from the gateway and has no
`PROTOTYPE_FEATURES` row.

**`/recaps/*` is in `BLOCKED`**, and that is the whole point of the folder
existing rather than the file sitting loose at the `public/` root. A recap names
colleagues, records which parts we have no confidence to test yet, and says what
engineering has not been shown — the public site's audience is the people it is
written about. A file at `public/pd-review-recap-0922.html` would be served on
BOTH sites with nothing in front of it. `PublicGateway.test.tsx` asserts both
that `/recaps/*` is blocked and that the folder is non-empty, so the rule cannot
quietly end up guarding nothing while the next recap lands at the root.

**The Contributing guide assumes NO TERMINAL** (2026-09-21, at Jillienne's
request — "someone who knows basically nothing about GitHub or Claude"). The
ONE tool is the Claude desktop app with its GitHub connector (clone, branch,
edit, run the checks, commit, push, open the PR). Every instruction is a
sentence the designer SAYS to Claude, not a command. github.com is opened
exactly once, to accept the invitation — the branch (step 2) and the PR
(step 9) were on github.com for one revision and moved to Claude the same
day, because they were the only two steps that were not a sentence and the
branch name is validated just as well by Claude as by GitHub's branch box.
Nobody runs the site locally — the Netlify branch build is the preview. Do
not reintroduce `git …` / `npm …` / `localhost:5200` into that page, and do
not send the designer back to github.com for a step Claude can do; the
README's short version follows the same rule.

**The Contributing page has TWO VIEWS in one file** (2026-09-18, at
Jillienne's request — the full guide was "a lot of reading"): a **Quick
walkthrough** (default — the loop as one diagram, nine illustrated step cards,
four rules) and the **Full guide**. A `role="tablist"` switch toggles `hidden`
on two panels; `#quick` / `#full` address them, a hash naming a full-guide
section opens that view and scrolls, and the choice is remembered per browser.
Print shows BOTH, quick first, so the PDF is the whole thing. The
illustrations are inline SVG drawn in LITERAL light-palette hex — not CSS
variables — because weasyprint's SVG renderer does not read them, and each SVG
carries its OWN arrow-marker `<defs>` because weasyprint renders inline SVGs in
isolation (a shared `url(#ar)` lost every arrowhead after the first drawing).
The `.shot` frame stays white in dark mode for the same reason a screenshot
would. Weasyprint's fallback font is wider than the browser's, so label widths
in the drawings were sized against the PDF, not the screen.

**The section is an iframe, not JSX**, for the `ComponentLivePreview` reason:
the same document is the section, the standalone page and the PDF source, and
re-typing it as a component is how the three drift. It is a self-contained
document (system fonts, its own light/dark), so it does NOT follow the page's
`--ux-*` palette — accepted, because it also has to print.

**The About link is outside the `<nav>` on purpose.** Both nav-order tests
read the buttons inside `<nav>`; a thirteenth entry there would be a section.
It takes `margin-top: auto` (which `themeWrapStyle` used to carry) so it and
Appearance travel to the foot together.

**`/about/` is asserted to say nothing about the process** — no git, Netlify,
pull request, `FEATURE_FLAGS`, or "full site" — because it is the public page,
and a stray sentence about branches would tell a stakeholder where the other
site is. `PublicGateway.test.tsx`, "the two guides". The PDFs are asserted to
exist and to be PDFs; nothing can assert they are CURRENT, so regenerate them
whenever the HTML changes.

**Prototypes holds the live product build** (`xcel-dashboard` →
`/dashboard-rebrand?demo=1`), the one feature row on the ungated front door.
What sits there is a decision about what a stakeholder may see unaccompanied —
`UxDashboard.smoke.test.tsx` compares the whole section against an expected
set, in both directions, so promoting or demoting a row fails a test first. It
is also the one row in the file that is an in-app ROUTE rather than a
standalone HTML document; see "The one in-app row" below. **It was called Demo
until 2026-09-18**, and the product build was promoted into it on 2026-09-08;
older notes that say "the Demo row" or "the Demo baseline" mean this section.

### Refinement is the review inbox; Prototypes is the product (2026-09-18)

**Labels vs ids, because they differ.** The review inbox is LABELLED
"Refinement" and its section id, Blobs store and endpoint are all `demo`
(`?section=demo`, the `demos` store, `/api/demos`, `DemoPanel`, `Demo.test.tsx`).
It was labelled Demo for a few hours and renamed at Jillienne's request —
Refinement is what happens there — and the id was kept so nothing churned.
Likewise "Other Links" is section id `links`. Read `demo` in code as
Refinement. Its Add button says **"Add link"**, the same verb as Other Links,
because what a designer adds IS a link (to their branch); the two boards are
told apart by the public toggle and the Type field, not the verb.

The old Demo section did two jobs — "here is the product as it stands" and
"here is something we want to talk about" — and they are different acts by
different people. Splitting them is what lets a second designer put work in
front of stakeholders without a commit, while keeping "what we have decided"
something only a merge to `main` can change.

| Section | What it is | Who changes it | How |
|---|---|---|---|
| **Refinement** (id `demo`) | Work in review — a designer's branch at its Netlify branch URL, or an HTML file in `public/demos/` | any designer | on the page: Refinement → Add link |
| **Prototypes** | The product at its committed flag baseline | Jillienne | `.claude/skills/promote-to-prototype`, on the PR, before merge |

**Demo is authored on the page**, the Links pattern: a fourth Netlify function
(`demos.ts`) over Blobs, the same panel, the same store code. Both are
instances of one board now — `netlify/lib/linkBoard.ts` serves both endpoints
from a config, `createLinkBoard` in `linkStore.ts` builds both client stores,
and `LinkBoardPanel` renders both with a `LinkBoardPresentation`. Two
hand-copied panels is how a validation rule gets fixed in one and not the
other. `LinksPanel` and `DemoPanel` are the two instances; `linkStore.ts` still
exports the Links functions by name so nothing that imported them changed.

**The one field Demo adds is `isPublic`, and it is the review gate.** Off by
default. The FULL site shows every row with a Public / Team-only chip and the
toggle in the form; the PUBLIC build renders `DemoPanel` read-only and filtered
to `isPublic` rows, and its nav badge counts only those. So the flow is
"designer adds → team sees → Jillienne flips → stakeholders see", and there is
no commit anywhere in it. `Demo.test.tsx` pins both sides — including that the
public build offers no Add / Edit / Remove whatever the endpoint says, and that
the endpoint stores the flag as strictly boolean `true` so a truthy string
cannot publish a row.

**Links has no `isPublic` and its endpoint DROPS the field** (`publicFlag:
false`), so a Links record cannot quietly acquire one. Demo has no `type` for
the mirror reason. The client type `StoredLink` carries both fields for both
boards and normalises the absent one, so a consumer never asks which board a
record came from.

**Why a branch is reviewable at all: branch deploys.** A designer sets their
flag's default ON on their branch, pushes, and
`<branch>--<host>/dashboard-rebrand?demo=1` renders their work at that branch's
committed baseline. `main`'s baseline is untouched. Every pushed branch has a
URL, which is fine as long as the team knows it. **Branch deploys have to be
switched on in Netlify** (Build & deploy → Branches and deploy contexts →
Branch deploys: All), and switching them on does NOT retroactively build
branches already pushed — the next push to each does. The README says where.

#### Branch deploys build on the FULL site (2026-09-21)

**This reverses what this section said for three days.** It read: branch
deploys on the PUBLIC site, "with no password, because it is the public site's
build… stakeholders cannot open the full site." Both halves of that were
wrong, and the second was wrong about this project's own setup:

- **Both sites carry a Netlify site password**, so the public build was never
  the passwordless one. The split between them is about what the nav SHOWS, not
  about who can get in. The real gate is the build: gated sections are absent
  from the public bundle. The password is a shared string that lives on a
  Netlify project tag — treat it as a speed bump, not a control.
- **A public-mode branch build shows a designer NOTHING for gated work.** Any
  change to Exploration, QA Notes, a `PROTOTYPE_FEATURES` row, the guides —
  the sections are filtered out and `/prototypes/*` is 404'd at the edge, so
  the branch URL renders a trimmed gateway that cannot display the thing under
  review. Branch builds exist for designers reviewing each other's work and
  every designer has full-site access, so the audience and the build were
  mismatched.

So `branch_host` is now the FULL site, `ux-design-xceldashboard.netlify.app`.
The public site (`ux-demo-xceldashboard.netlify.app`) builds `main` only.

**The cost, stated plainly:** a branch URL is a full-gateway build, so a
stakeholder who reaches one through a Refinement row flipped public is looking
at a build that contains every team-only section. They land on
`/dashboard-rebrand?demo=1` — the product, not the gateway — but the dark
prototype bar carried a **house icon linking to `/`**, which made the whole
project list one click away. A visible button, not a wander.

**The fix drops that icon on branch builds** — `src/data/deployContext.ts`,
fed by `VITE_DEPLOY_CONTEXT` set per context in `netlify.toml` (so it travels
with the repo rather than being set on one Netlify project and forgotten on the
other). The walkthrough "← Back" pill goes with it for the same reason; an
explicit `back` prop still wins, because that is passed by gateway pages where
the reviewer is already inside the gateway.

**It removes the SIGNPOST, not the page.** `/` still resolves on a branch
deploy. That is proportionate rather than lazy: everyone who can open the site
holds the password, so the job is not putting the door in front of someone, not
locking it. If it ever has to be a real gate, the honest fix is applying the
`VITE_GATEWAY_MODE=public` trim to branch builds — which costs designers the
ability to review gated work, which is exactly why it was not done. Do not
"tighten" this by hiding more links; either it stays a signpost or the build
changes.

**`parseDeployContext` fails the OPPOSITE way from `parseGatewayMode`**, and
that is deliberate. A typo in `GATEWAY_MODE` must fail towards showing the
maintainer everything; a missing `DEPLOY_CONTEXT` must fail towards showing the
house icon, because hiding it on the production dashboard is a silent,
permanent regression to the control every reviewer uses. The toml entry is
pinned by `DeployContext.test.tsx`, which parses the real file — so losing the
block fails a test rather than leaking quietly. That test was verified to fail
before it was relied on.

**Consequence for `public/demos/`:** its stated reason ("`/prototypes/` is
404'd on the public build") no longer applies to branch review, because a
branch build is a full build and serves both folders. The folder still earns
its place, but the distinction is now PERMANENCE rather than reachability —
`public/demos/` is short-lived work in review, `public/prototypes/` is a
document becoming a permanent row. The public site still 404s the latter, so
the `BLOCKED` list and its test are unchanged.

**`public/demos/` exists because `/prototypes/` is 404'd on the public build.**
HTML work-in-review needs to be served from somewhere the public site's branch
deploy can reach; that folder is deliberately absent from `BLOCKED` in
`scripts/public-redirects.mjs`, and `Demo.test.tsx` asserts it stays absent.
Nothing there gets a `PROTOTYPE_FEATURES` row — the Demo panel is its listing —
and nothing should live there long. `public/demos/README.md` says the same to
whoever opens the folder.

**`promote-to-refinement` is the other bracket** (2026-09-21). Step 6 of the
loop was the one manual step, and the one where the URL is easy to get wrong
(`feat/x` → `feat-x--ux-design-xceldashboard.netlify.app`, plus `?demo=1` —
the host moved to the full site on 2026-09-21, see above). The
skill (`.claude/skills/promote-to-refinement/`, Cowork copy under the same
name) derives the branch URL, checks the branch is pushed and built, drafts
the row, and opens the FULL site at `/?section=demo&add=1&url=…&title=…&note=…`.
**It does not POST.** Both sites are behind a Netlify password that also
fronts `/api/demos`; scripting the login would put the password on every
designer's machine. So the page reads the four params, `DemoPanel` opens the
Add form with them (`LinkBoardPresentation.prefill`, once `canAuthor` is true
— never on the public build), and the designer's click is the gate. **The
PAGE strips the params, not the panel**: `UxDashboardPage` owns the router
state, and a `history.replaceState` from inside the panel would leave
`useSearchParams` still holding `add=1`, so the next `setSection` would write
it straight back and the form would reopen. `Demo.test.tsx` pins the prefill
opening once with the toggle off, and doing nothing on the public build.

**The promote skill was renamed, not rewritten.** `promote-to-demo` →
`promote-to-prototype`, now checked into `.claude/skills/` so Claude Code
sessions in this repo carry it, with the Cowork copy kept under the old name as
an alias. Its logic — diff the branch's `FEATURE_FLAGS` against `main`, ask per
flag, apply, commit — was already right; what changed is the vocabulary, that it
runs ON THE PR BEFORE MERGE (merging publishes to two sites now), that a
DECLINED flag must be set back to `main`'s value (the designer turned it on to
see their work), and a final step to retire the branch's Demo row.

**`FeatureCategory` gained `'prototype'`** for the one row, and `sectionOf`
routes `demo` / `dashboard` there too so an LMS-ported row lands in the right
place. `isPublicFeature` accepts all three. The `dashboard` legacy alias in
`LEGACY_SECTIONS` points at `prototypes` now. **Prototypes is the landing
section** (`DEFAULT_SECTION`), at Jillienne's request — a stakeholder arriving
on the public link sees the product first, with what is being discussed one
click away.

**`sectionOf` still names Demo nowhere**, and `bySection.demo` is empty by
design; the count is `useDemoCount`, which took an optional filter for the
public build's badge. The Demo blurb on the section, the panel's empty-state
sentence and the form's hint each say the same thing — added on the page, team
first, public on a flip — because the panel is where a designer learns the rule.

**The in-app password is NOT enforced (2026-09-18)** — `ENFORCE_SECTION_GATE`
in `UxDashboardPage` is `false`. The seven restricted sections (Design,
Exploration, Sandbox, Archive, QA Notes, To Do, Contributing — Development and
Done were pulled out 2026-09-23, see "Sections" above) still carry a
`gate` and still share one gate id (`design-and-development`), but the field
now means "not for stakeholders", which the PUBLIC build filters on, rather
than "ask for a password". The reasoning is the two-site split below: on the
full site the Netlify site password is already the lock, and on the public site
these sections are absent, so the modal had no job on either build. The
mechanics are all still there behind the constant — `getPrototypePassword()`,
the modal opening *over wherever you are*, the deep-link hold checked against
the **feature's own** section — so flipping it back restores the old behaviour
exactly. `UxDashboard.smoke.test.tsx` asserts the un-enforced state, so
re-enabling it fails a test and gets re-decided. Do NOT strip the `gate` fields
to remove the prompt: that would put the sections on the public site.

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
fallback — and every rule is FORCED (`404!`): an unforced rule is skipped whenever a real file exists at the path, which here is every path, and the first deploy shipped that way with nothing hidden. Blocked: `/prototypes/*` (every document row), `/testing/*` and
`/ngat-admin/*` (LMS leftovers), `/archive/*`, `/qa/*`, `/contributing/*` (the
designer guide) and, since 2026-09-22, `/recaps/*`. NOT blocked:
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

