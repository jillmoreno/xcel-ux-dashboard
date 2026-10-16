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

## One site — the demo site is retired (2026-10-15)

Jillienne: "we will be using this Design hub as the source of truth for
everything and no longer gating the public/private of the refinement links."
Everything below this heading that says "the public build", "the demo site",
"flipped public" or "`maturity`" is history from 2026-09-18 to 2026-10-15, kept
as written. What is true now:

- **One Netlify project, one password.** Stakeholders are given the Hub's link.
  The Netlify side was Jillienne's own change; the repo's side is
  `git show 88e5136` (the public mode and the Refinement toggle) and
  `git show 3dd0706` (`maturity`), each with an `archivedItems.ts` row.
- **`VITE_GATEWAY_MODE` is `full | testing`.** A leftover `public` parses as
  full. `isPublicGateway()` keeps its name for its call sites and means "the
  testing build" — every trim it drives is still right for a test participant.
  `OneSite.test.tsx` (was `PublicGateway.test.tsx`) pins that a stale `public`
  trims nothing.
- **The edge rules:** the testing build keeps the whole block; the production
  deploy of the one site 404s `/recaps/*` only (a recap names colleagues and
  records what engineering has not been told), keyed on Netlify's `CONTEXT` so
  a branch build still serves it to the team. The contributing guide is open —
  hiding it from the one site would hide it from the designers it is for.
- **Refinement has no public toggle.** A row is a row the moment it is added.
  The server drops `isPublic` on save; older records keep the key until their
  next save and nothing reads it.
- **The retired HOST, and what still pointed at it (same day).** Deleting the
  demo project deleted `ux-demo-xceldashboard.netlify.app` and every branch
  alias under it, and Netlify does not redirect a deleted project — those
  addresses answer its "Site not found" page. Three things were still handing
  them out, and the first is the one that showed: **Refinement rows written
  before today**, which carry the address they were added with and so opened a
  404 for work that is still built. `netlify/lib/linkBoard.ts` now holds
  `RETIRED_HOSTS` and swaps the host **on the way out as well as in**, so those
  rows open today with no migration to run — a stored row is rewritten the next
  time it is saved. The other two were `BRANCH_SITE_HOST`'s default in
  `netlify/functions/branches.ts` (the Branch builds strip's fallback address,
  reached only for a deploy with no alias of its own, which is why it hid) and
  the prototype bar's "Go to Demo Hub" item, now "Go to Design Hub".
  `RetiredHost.test.tsx` pins all three plus the swap itself.
- **`maturity` is gone** from flags, variants, demo-bar controls and versions,
  with `demoControlMaturity.ts`, the picker's "Design site only" badge, the
  demo bar's `wip` dot and the `?as=demo` lens. Every control and every
  version is offered to everyone. Promotion has two levers now: flag defaults
  (the scope's owner) and the default dashboard version (Jillienne).

⚠ **ONE THING TO CHECK ON THE NETLIFY SIDE.** The Blobs store behind Refinement,
Links, Research, PRDs and QA Notes was OWNED by the demo project — the full site
pointed at it through `BLOBS_SITE_ID` / `BLOBS_TOKEN` (README, "Netlify"). If
that project was deleted rather than unpublished, the store went with it. If
the boards still load, it was not.

## The Designers group is gone (2026-10-15)

The rail ended in a divider under a **Designers** eyebrow holding Design ·
Exploration · Archive · QA Notes, one shared gate id
(`design-and-development`) that had not asked for a password since
2026-09-18 and, since the demo site went, filtered nothing either. Jillienne,
the same day the demo site was deleted: "already have a site password,
nothing needs to be locked." So:

- **Design is retired.** It listed nothing — no row carries `in-design` or
  `needs-discussion` — and the team does not work in a design/development
  split: a surface is a scope with an owner on Prototypes, a branch under
  discussion on Refinement, or a handoff on Development. `sectionOf` now
  sends ANY authored `devStatus` to Development; the status chip says which
  stage. `?section=design` is a legacy alias of Development.
- **Exploration is renamed Explorations and moved up to sit directly under
  PRDs** — the briefs and the documents answering them, side by side in the
  nav. The rows, their thumbnails, kebabs and files are untouched, and the
  section id stays `exploration`, so `?section=exploration` links and
  `category: exploration` need no alias. ⚠ For an hour it was a card under
  the PRDs board instead; Jillienne on the preview: "explorations should be
  its own page below the PRDs option in the left nav." Kept in code rather
  than converted into board links, for the reason `retire-from-refinement`
  gives: a document kept in code has a commit trail; a Blob does not.
- **Archive and QA Notes sit under Dev Handoff,** ungated. The `gate` field,
  `DEV_GATE_ID`, `ENFORCE_SECTION_GATE`, `FIRST_RESTRICTED`, the lock glyph and
  the modal wiring are gone from the page. `PrototypeLock.tsx` and
  `prototypeLockUtil.ts` stay — the archived tile landing reads them.

Ten sections: Prototypes · Refinement · Research · Resources · PRDs ·
Explorations · Development · Done · Archive · QA Notes. The two
`archivedItems.ts` rows `design-section` and `designers-gate` carry the
restore notes. The "Sections" and "Exploration" passages below describe the
rail as it was and are kept as history.

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
project list. Unchanged from the LMS original apart from two strings (the
brand sub-line, the Research row label) and, since 2026-10-07, the Research
section itself — a board, see below — so anything the LMS `CLAUDE.md` says
about it holds here. (`RESEARCH_DECISIONS`, the hand-authored count the LMS
original carries, is gone with the empty state it counted for.)

**Sections** (as of 2026-09-23 — see "The Designers group is gone" above for
the 2026-10-15 shape). Six open, under three eyebrows added 2026-09-23 for the public
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

### The two designer guides divide by WHEN, not by length (2026-10-15)

Jillienne, auditing Hub Resources the day it shipped: "I think Designer
Workflow on Hub is good base, but i want that to be the regular day-to-day
workflow, and the Contributing one more for starting out for the first time."

**They were the same document at two lengths.** Contributing's eight steps and
Designer Workflow's Parts 1, 2, 5, 6 and 7 covered identical ground, and each
carried its own glossary, its own troubleshooting table and its own account of
the Refinement form — three duplicated reference blocks. Worse for the split
Jillienne wanted: one-time setup was eight steps of the DAY-TO-DAY guide, and
rebasing, the routines and the morning task existed only in it.

| | `/contributing/` — once | `/designer-workflow/` — every day |
|---|---|---|
| Holds | Accounts, clone, dependencies, git identity · the three places · the six words · the loop in one picture · two homes · the flag rule · what you never do | Sitting down · keeping your branch current · building a change · `/share` · promoting a surface · reading the Hub · troubleshooting · the routines · the morning auto-rebase · the glossary |
| Lost | the long-form eight steps, the Refinement form field by field, its glossary, its troubleshooting table | one-time setup |
| Ends | handing the reader to the day-to-day guide | — |

Two calls inside that:

- **Parts 3 and 4 were named snapshots** — "Eric: rebase `feat/atlas-compass-global-nav`", "Anjani: start fresh" — carrying live counts (10 commits, 74 behind, 355 behind) that were a day stale when they were written. They are one generic **Keeping your branch current** now: the ten steps were never personal, only the numbers were. Anjani's standing fact (her surface is React, not HTML) survives; the counts do not.
- **Contributing keeps its pictures and loses its long form.** The eight illustrated cards are the one-page orientation — this is the shape of the work — and the same eight at length right underneath them was the duplication.

⚠ **KEEP THE SEAM.** Setup belongs in Contributing; rebasing, the routines and
the morning task belong in Designer Workflow; the glossary and the
troubleshooting table live in Designer Workflow ONLY. Each file's head comment
says so, because this is the kind of thing that grows back.

**`/about/` was audited in the same pass** and was wrong in two ways nobody had
noticed: its section 02 was headed "The four sections", listed three, and
described Prototypes as "one entry" — it has had five rows since 2026-10-14. It
now lists the five a stakeholder uses and says, in one line, that the Dev
Handoff and Team groups are the team's own surfaces rather than pretending they
are not there.

### Team → Hub Resources, and the guides get a way in again (2026-10-15)

Jillienne: "lets add a Hub Resources in the new team section where this new
document will live."

**The problem it fixes is that none of the three guides was reachable from the
rail.** The Contributing section was archived on 2026-09-29 and the "How to
read this dashboard" link came off the rail foot the same day — both
deliberate, both still pinned gone by tests. What nobody noticed at the time is
that between them they were the only two doors, so from that date the guides
existed only for someone who already knew the URL.

| Question | Call |
|---|---|
| A new GROUP, or a section under an existing one? | A new one, **Team**, fourth after Demo, Design & Research and Dev Handoff. The guides are not research, not handoff and not the product; filing them under any of those three would have made that eyebrow mean less. |
| Who else is in Team? | **The To Do Board**, which arrived on `main` the same day and invented the same group independently — the two were written in parallel and met at the merge. The board sits FIRST (live work), the shelf second (reference). ⚠ `NAV_EYEBROWS` is keyed on a section id and the eyebrow draws directly above that row, so the group has ONE entry, on `todo-board`. A second entry for `hub-resources` prints "Team" twice, once over each row; reorder the pair and the key moves with them. |
| Is it a board? | **No.** The rows are files in this repository, so the list changes with a commit — hence no Add button, no kebab, and a static `count` on the `SectionDef`, unlike Refinement's and Research's live ones. `HUB_DOCS` in `src/data/hubDocs.ts` is the list. |
| Does this restore the Contributing section? | **No, and that matters.** That section was an iframe of one guide; this is a shelf holding all three. `GuideFrame.tsx` stays unreferenced, the `contributing-section` archive row stays, and the two tests pinning the old doors shut stay passing. |
| Where do the links open? | **A new tab.** Each document is a full page with its own rail and its own stylesheet; opening one in this tab replaces the dashboard with something whose only way back is the browser's Back button. |
| Absolute or relative addresses? | **Site-relative**, and the type says so. A branch build then shows ITS OWN copy of the guides, which is the one thing an absolute URL would break — a reviewer on a branch build would be sent back to `main`'s guide without noticing. |

`UxDashboard.smoke.test.tsx` gains `Hub Resources` to `EXPECTED_SECTIONS` and
two cases: every row renders as a `target="_blank"` link at its own `href`, and
every `href` and `pdf` resolves to a file that actually exists under `public/`
— the one failure this list can have that nothing else would catch is a path
typed by hand, which renders as a perfectly ordinary row and 404s on click.

### The two guides (2026-09-18)

Two static pages, each with a PDF rendered FROM it (weasyprint; the command is
in each file's header comment and in the README), sharing one stylesheet at
`public/guides/guide.css`:

| Page | Audience | Reached | On the public build |
|---|---|---|---|
| `public/contributing/index.html` | designers | the gated **Contributing** section — an iframe of the page (`GuideFrame`) — and `/contributing/` directly | 404'd at the edge: `/contributing/*` is in `BLOCKED` |
| `public/about/index.html` | stakeholders | the **"How to read this dashboard"** link at the foot of the rail, OUTSIDE the `<nav>`, on every build | reachable — it is the orientation a reviewer gets |
| `public/designer-workflow/index.html` | the five people on the team now | the **Hub Resources** section (2026-10-15) and `/designer-workflow/` directly | reachable; it is not in `BLOCKED` |

⚠ **Three guides since 2026-10-15, and the third is not on `guide.css`.** It
was authored as a published Artifact with its own design — the rail, the
speech bubbles, Bricolage Grotesque — and came over whole rather than being
restyled, so it is the only guide making an external request (Google Fonts,
every stack with a real fallback). Its palette WAS recoloured onto the Hub's
`#1f4e88`, because a deep green beside the other two read as a different
product. `OneSite.test.tsx` splits accordingly: all three are checked for
being self-contained with a PDF, the stylesheet check is scoped to the two
that use it, and the third's accent is pinned.

⚠ **The rail entries above are history for the first two.** Both came off on
2026-09-29; see the row above.

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

**Prototypes holds the live product build, one row per product surface**
(`xcel-dashboard` → `/dashboard-rebrand?demo=1` and, since 2026-10-14,
`xcel-compass` → `/dashboard-rebrand?demo=1&section=compass`), the only
feature rows on the ungated front door. What sits there is a decision about
what a stakeholder may see unaccompanied — `UxDashboard.smoke.test.tsx`
compares the whole section against an expected set, in both directions, so
promoting or demoting a row fails a test first. They are also the only rows in
the file that are in-app ROUTES rather than standalone HTML documents; see
"The in-app rows" below.

### One row per scope, every row the same build (2026-10-14)

From 2026-09-28 the section held exactly one row, and the reason is still the
reason: two rows pointing at two BUILDS of the same thing make everyone ask
which one is real. What changed is that the product now has three doors on one
learner journey — how they get in (invite and purchase), what they land in
(the dashboard, end to end), where they study (Compass) — and each is its own
source of truth for a different question. `PROTOTYPE_SCOPES` in
`prototypeFeatures.ts` declares them in reading order — the product first, by
Jillienne's rule, then the doors around it; every
`category: 'prototype'` row carries a `prototypeScope`; the tile's kind tag
shows the scope label instead of "Full platform", because three rows that all
open the same build need the one word that tells them apart.

The guarantee is kept in a stricter mechanical form, pinned by the new
`describe` block in `UxDashboard.smoke.test.tsx`: every row's `to` is
same-origin, enters `/dashboard-rebrand`, carries `demo=1`, and pins neither
`ff=` nor `version=`. Each of those is a row that would stop tracking the
product the moment `main` moved under it. No scope has two rows, and no row
outside Prototypes carries a scope.

**The Compass row is the same build entered at a different door.** A
stakeholder who clicks into a course from the end-to-end row lands on exactly
what the Compass row opens, which is what keeps the two from competing. It
exists because the study experience has its own owner and its own stream of
Refinement work (Anjani's, tagged `product: 'compass'` there), and "what is
Compass right now?" deserved an answer that does not route through the
dashboard.

**The invite and admin rows arrived the same evening (2026-10-14).** When the
morning's text was written the purchase flow did not exist as a React route; by
the afternoon Eric's End-to-End Demo had merged with exactly that flow, and by
the evening Jillienne had asked for its row and for an Admin row:

- **`xcel-invite`** → `/end-to-end-demo?demo=1`, the Invited Product Detail
  page → its checkout → the dashboard. The second product DOOR the smoke test
  admits beside `/dashboard-rebrand`. ⚠ The page pins its own version
  (`useEndToEndDemoParams` writes `version=eric-atlas-e2e`), so this is the one
  row whose dashboard does not follow `defaultDiscoverabilityVersionFor` — the
  page's rule, not the row's; the row itself carries no `version=`.
- **`xcel-atlas-learning`** → `/dashboard-rebrand?demo=1&section=dashboard`
  — "Atlas Learning — Work in Progress", Jillienne's ask on the preview. It
  stems from the current end-to-end and excludes the invite flow and the
  Compass work: the learner's Home and the learning pages around it, the SAME
  build at the SAME baseline as the end-to-end row, entered at Home. A row of
  its own because of scope and ownership (Eric's exploration, as Compass is
  Anjani's), not because of a different build — which is exactly the case the
  one-row-per-scope rule was written for. `section=dashboard` is written out
  so the address says what the row is for rather than reading identical to
  the end-to-end row's.
- **`xcel-dashboard` is HELD BACK (2026-10-14, later that evening).** "Change
  this whole option to Coming soon like the Admin tool, as I need to pick
  things from all the others — don't remove the work, just hide users from
  clicking on it for now." So `status: 'coming-soon'` with the `to` KEPT, which
  widened the placeholder rule: a coming-soon row is drawn disabled whether or
  not it has a route, and a kept route is still checked against the door rules
  so that flipping the word back to `ready` is the whole release. It draws
  the generated mark, not its live frame — a disabled row should not look
  like an invitation.
- **`xcel-admin-coming-soon`** — the Admin door as a PLACEHOLDER: a
  `coming-soon` row with no `to` and no `externalUrl`, which `ProjectRow` draws
  disabled — generated thumbnail, title, blurb, the "Admin" scope tag and a
  "Coming soon" tag, no link, no chevron, no kebab. ⚠ For about an hour the
  Admin row was the PartnerHub-fork document (`xcel-admin-tool`) instead, with
  an exact-path allow rule punched through the public build's `/prototypes/*`
  block so stakeholders could open it. Jillienne had not meant the fork to be
  hooked up as the product's admin door, so it went back to Exploration, the
  allow rule went with it, and the placeholder took the row. The lesson is in
  the smoke test: a document row is not admitted, and a placeholder is the
  only row that opens nothing. When the admin surface is built in React, this
  row gains a `to` and `status: 'ready'`; the id and scope stay.

**Prototypes is two cards (2026-10-14, later still).** "This is the same as
the `main` branch, so can we have it separated from the rest to better
indicate that it's the Final Prototype, Source of Truth." The end-to-end row
stands alone under "Final prototype — source of truth"; the doors around it sit
in a second card under "Work in progress". `groupRows` in `UxDashboardPage`
is the split and every other section is still one list; the smoke test pins
which rows land in which card.

**The tag column on a Prototypes row (2026-10-14, Jillienne on the preview)**
is outlined, square-cornered tags rather than filled pills, stacked: the scope
(none on the product row), `Owner: <name>` from `PROTOTYPE_SCOPES`, and
`Updated <date, time>` from the row's `lastUpdated` — an ISO stamp of the last
commit on `main` that changed the surface, seeded from `git log` and kept true
by `ship-to-main` (its step 2b). A placeholder shows its owner and "Coming
soon" and no Updated. The row's kebab in this section offers Copy link only,
and every project row's kebab is drawn in the tertiary ink rather than amber.

Four live frames on the landing page now (end to end, invite, Atlas, Compass);
the placeholder draws its generated thumbnail. Add captures to
`public/prototype-thumbs/` if the page slows.

What this did NOT change: how work gets in. A branch is still reviewed in
Refinement and promoted by `promote-to-prototype` flipping flag defaults on
`main`.

### Phase 1 — the skills know about scopes and owners (2026-10-14)

Same day, Jillienne's decisions: **Anjani owns the Compass baseline; anyone
promotes to Refinement; only Jillienne promotes to `main`.** The last one was
first read as "only Jillienne runs `promote-to-prototype`" and the skill was
made owner-only in full; she corrected it the same afternoon — a promotion is
a commit of defaults on the designer's branch, and what is hers is the MERGE.
Three consequences, each in the file that carries it:

- `PROTOTYPE_SCOPES` gained `owner` — a display name, not a `DesignerId`,
  because Anjani has no flags or versions yet and a tab for her would be empty
  in two panels. It is design authority (what the surface should be), not
  merge authority. `UxDashboard.smoke.test.tsx` pins that Compass is hers.
- **`promote-to-prototype` is per-group, and each group is its owner's.**
  Candidates are grouped by the Prototypes row they reach; the scope owner
  answers their group's questions and commits on the branch, a group the
  caller does not own is listed and left alone, and `maturity` is the version
  owner's (Eric's for his). The default dashboard version stays Jillienne's.
  The shipper may apply an owner's already-made decision at merge time, asked
  as a sign-off rather than a promotion, with both names in the commit body.
  **`ship-to-main` gained the matching check**: a branch with a group its
  owner has not decided is not ready, and the merge does not decide it.
- **The Refinement hand-off carries `product`.** `LinkPrefill` gained the
  field, the page reads `?product=` with the other four params and validates it
  against `LINK_PRODUCTS`, and the form opens with that segment selected
  (`Demo.test.tsx`). `promote-to-refinement` reads the tag off the branch:
  Compass files only → `compass`, mixed → `both`, else `xcel`. That tag is what
  the Compass Prototypes row later absorbs, so it stops being a filter and
  starts being a destination.

`retire-from-refinement` asks for one more word in the Archive row's `reason`:
WHICH Prototypes row the work reached, since "promoted" no longer says. **It was called Demo
until 2026-09-18**, and the product build was promoted into it on 2026-09-08;
older notes that say "the Demo row" or "the Demo baseline" mean this section.

### Feature Refinement — a row is a CHUNK, a group is the feature (2026-10-15)

Jillienne, the evening the one-site change landed: "I want the designers to
work on smaller chunks of branches and push those accordingly, then start a new
branch etc. I want them to be in the habit of not just using the same branch
over and over."

**The board was pushing the other way, and that is what this changes.** A
Refinement row WAS a branch URL, so pushing again to the same branch kept the
row correct for free, while starting a new branch cost a new row — and two rows
for one feature made the board ambiguous in exactly the way the one-row rule
protects Prototypes from. The tidy, cheap move was to live on one branch
forever. Nothing marked a chunk finished, and nothing made an old branch look
old.

So a row is now one CHUNK of work and `feature` is what it is a chunk of:

| Question | Call |
|---|---|
| Where does `feature` come from? | **Free text, with the board's own features offered as suggestions** (a `datalist`). A curated list like `DESIGNERS` was the alternative and was rejected: every new piece of work would wait on Jillienne to add a value, which is friction at the exact moment the point is to make cutting a branch cheap. `featureKey` is the mitigation — grouping is case- and space-insensitive, and the label printed is the newest chunk's own spelling, so a corrected capitalisation wins from then on. |
| What happens to the chunk a new one replaces? | **It collapses and stays viewable** — folded under "N earlier chunks", still clickable, never auto-archived. That clickable history IS the reward for working small: a string of chunks is a progression you can open in a review, where one long branch gives you a single URL and no history at all. Auto-archiving was considered and rejected for taking that away again. |
| Who decides a chunk was replaced? | **The newer chunk**, via `supersedes` — one writer for the relation, so nothing reaches back and stamps a row it does not own. `isSuperseded` asks the board. Archive the newer chunk and the older one comes back out of the collapsed list, which is the honest reading. |
| Is replacing automatic? | **No — it is a prefilled choice.** Typing a feature the author already has a live chunk of fills "Replaces" with that chunk, because that is what usually happened. The first option says *Nothing — these sit side by side*, which is a real answer and the one Refinement exists to allow: two treatments of one surface, up at once (CLAUDE.md). |
| Can Eric supersede Anjani's chunk? | **Yes.** The options are not scoped to the author — picking up where someone else left off happens, and refusing would leave two live rows each claiming to be the current answer. Only the DEFAULT is author-scoped (`latestChunkFor`). |
| Rows with no feature? | **Unchanged, and left where their date puts them** — no header, no group, interleaved with the groups rather than swept into a trailing bucket. There is no backfill: the board is mixed on purpose while the habit forms, and a bucket of everything written before today would read as a backlog to clear. |
| Other boards? | **Refinement only.** `features` in `linkBoard.ts` drops both fields on the way in everywhere else, the same rule `products` and the archive follow — a Resources row belongs to no branch, so "what is this part of" has no answer there. |
| A `supersedes` whose row was deleted? | **Accepted, and supersedes nothing.** Refusing the write would mean a designer cannot save because of something someone else did. |

Mechanically: `StoredLink` gained `feature` and `supersedes` (both '' on every
record written before today); `linkStore.ts` gained `featureKey`,
`knownFeatures`, `isSuperseded`, `groupByFeature` and `latestChunkFor`;
`LinkBoardPresentation` gained `showFeature`, on for `DemoPanel` only. The
list's row body came out of its `.map` into `renderRow` so the same row draws
inside a group and on its own, and `FeatureGroupBlock` is the header plus the
"N earlier chunks" door. `LinkPrefill` gained `feature`, which is how
`share` (the renamed `promote-to-refinement`) lands the next branch in the same
group without anyone retyping it. `FeatureRefinement.test.tsx` pins every row of the table
above.

**Still to come, and all three are about making the habit stick rather than
making it possible:** the chunk showing its own age ("7 commits · 9 days", from
the branch deploy data the strip already reads), `promote-to-refinement`
noticing that a branch already has a live row and offering to close that chunk
and cut a fresh branch, and `retire-from-refinement` asking what the next chunk
is so finishing one and starting the next is a single move.

### Refinement — designer pills and the archive (2026-10-15)

Jillienne, on the preview the day the Designers group was retired: "i want
these quick filter pills to be based on the Designers name. I also want the
refinement ellipsis to have an archive option. This will simply hide them from
the main view, there will be a separate link button top right to Show
Archive." Mocked up first, then eight calls, all hers:

| Question | Call |
|---|---|
| Where do the pill names come from? | The fixed **roster** — `DESIGNERS` in `linkStore.ts`: Jill · Anjani · Eric · Afsana · Cody ("Jill" since 2026-10-16 — her rows were already signed that way, and the To Do Board seeds its people from this list) — and the Added by field offers the same five, so what is typed is what the pills filter on. `matchesDesigner` reads the free-text names on older rows loosely ("eric w", "Afsana & Eric" → Eric; a shared row lands under both). |
| The Atlas / Compass pills? | Gone from Refinement; the **product stays as the tag** on the row. |
| Other boards? | **Refinement only.** Research, Resources and PRDs keep the free-text author and have no archive. |
| Archive or Remove? | **Both.** Archive hides and is reversible; Remove deletes and is confirmed. |
| Stamp who and when? | **Yes** — `archivedAt` and `archivedBy`, stamped by the endpoint (`archivable` in `linkBoard.ts`), shown as an "Archived <date, time> · <name>" tag in the archive view. `archivedBy` is the browser's last author, the same label the Add form prefills — so it is blank in a browser that has never saved a link. |
| Who can unarchive? | **Anyone.** Same kebab, no owner check. |
| The branch strip? | **Hides a build whose row is archived** — `boardUrls` reads the whole index, archived rows included, so the strip does not offer the branch straight back. |
| The nav count? | **Excludes archived rows** — `useDemoCount` counts `isLive` rows. |

Mechanically: `StoredLink` gained `archivedAt` / `archivedBy` ('' when live);
`archiveLink` on the board is a SAVE with `archived` flipped, so the server
owns the stamp the way it owns `updatedAt` and keeps the stamp it is handed
while a record stays archived (editing an archived row does not un-archive
it). `LinkBoardPresentation` gained `showDesigners` and `archivable`, both on
for `DemoPanel` only. "Show archive · N" appears top right only once something
is archived; inside the archive the toolbar reads "Archive", the Add button
is gone, and "Back to board" returns. `Demo.test.tsx` pins every row of the
table above; `LinkRowThumb.test.tsx`'s product-pill test became the
tag-stays test.

### Refinement is the review inbox; Prototypes is the product (2026-09-18)

**Labels vs ids, because they differ.** The review inbox is LABELLED
"Refinement" and its section id, Blobs store and endpoint are all `demo`
(`?section=demo`, the `demos` store, `/api/demos`, `DemoPanel`, `Demo.test.tsx`).
It was labelled Demo for a few hours and renamed at Jillienne's request —
Refinement is what happens there — and the id was kept so nothing churned.
Likewise "Resources" is section id `links` — it was labelled "Other Links"
from 2026-09-18 until 2026-10-07, when Research and PRDs became boards and
"Other" stopped saying which of three siblings this was; older notes that say
Other Links mean this section. Read `demo` in code as Refinement.
Its Add button says **"Add link"**, the same verb as Resources,
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

**Every record carries `updatedAt` since 2026-10-14, and only Refinement shows
it.** Jillienne's ask: "on the refinement links, we need to add a last updated
date/time field." `validateRecord` stamps `new Date().toISOString()` on EVERY
write — create, edit, an edit that changed nothing — and never reads the field
off the client, so "last updated" means last saved and a form cannot claim
otherwise. The client normalises an absent stamp to `''` (records from before
the field) and shows no "Updated" for those rather than a guess. The row's tag
is outlined and sentence-case, the shape the gateway's Prototypes rows wear for
theirs, and both use `formatUpdated` so one moment never has two spellings.
`showUpdated` is a presentation flag: on for Refinement, off for Resources,
Research and PRDs — a brief does not move. `Demo.test.tsx` pins the render and
reads the stamp out of the server source; `Links.test.tsx` pins that Resources
stays as it was.

**A Refinement row's tags match the gateway's Prototypes rows (2026-10-15).**
Jillienne: "update the refinement tags to better match what we did on this
page." The same shape and the same order: a 156px STACK of outlined,
square-cornered, sentence-case tags — who (the author, with the user icon),
when (the Updated stamp), what (the product, outlined in its fixed hue, no
fill) — then an 84px column for the row's STATUS (UX Only outlined in the
accent, Public solid in it — the one state with a consequence outside the team
stays the loudest), then the kebab in the tertiary ink. Fixed widths so the
stacks and kebabs line up down the list. The same evening the gateway's own
stack went owner → Updated → scope, with Coming soon moved to the right of the
stack, and this follows it. `LinkRowThumb.test.tsx` pins the shape.

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

### Research is a board too (2026-10-07)

**The Research section is the THIRD instance of the same board** — section id
`research`, the `research` Blobs store, `/api/research`
(`netlify/functions/research.ts`), `researchStore.ts`, `ResearchPanel` in
`LinksPanel.tsx`, `Research.test.tsx`. Jillienne asked for it to work like
Resources, and it is Links' shape exactly: the Type taxonomy, no public
toggle, no product tag, authorable on both sites. What the rows MEAN is the
difference — a Links row is "everything that lives elsewhere"; a Research row
is a study, a finding, a survey, a rationale doc: the evidence behind a
decision. Ungated, like Links, because a stakeholder reading that evidence is
the point.

Before this the section was an authored empty state ("No decisions log yet")
and `/research-rationale` iframed the LMS's own decisions log out of
`public/research-rationale/` — a document that was never XCEL's. The route
now redirects into `/?section=research`, the same shape as `/links`. The HTML
is still in the repo, unreferenced, at `public/archive/research-rationale-
index.html` — **moved, not just unwired**, because a folder with an index page
under `public/` is served by vite and by Netlify ahead of the SPA fallback, so
left in place it answered `/research-rationale` itself and the redirect never
ran. The `research-rationale-iframe` row in `archivedItems.ts` says how to
bring the old arrangement back without stranding what the team has attached.

**The one shared-code change was a regex.** `linkBoardHandler` strips the path
up to the segment with `^.*\/segment\/?`, and with a greedy `.*` the
Research board's `/api/research/research-001` matched through the first
`/research/` and treated the id's own `research` as the segment, leaving
`-001` — a 400 on every single-record request. Links and Demo never hit it
because `link` ≠ `links`. It is `.*?` now, and `Research.test.tsx` drives the
real handler over a mocked store to pin it.

### PRDs is the fourth (2026-10-07, same day)

Section id `prds`, the `prds` Blobs store, `/api/prds`
(`netlify/functions/prds.ts`, ids `prd-NNN`), `prdStore.ts`, `PrdsPanel` in
`LinksPanel.tsx`, the `/prds` door (`PrdsPage.tsx`), `Prds.test.tsx`.
Research's twin in every mechanical respect — Links' shape, no public toggle,
ungated — and a separate SECTION rather than a Type on Resources because
"the brief", "the evidence" and "everything else" are three different
questions a reviewer asks, and a filter pill is not an answer to "where are
the PRDs". It sits directly after Resources in the rail; the Links suite
pins the four sections before it and `Prds.test.tsx` pins the one after.

So the Design & Research group is now Refinement · Research · Resources ·
PRDs, all four boards over one handler and one panel. Adding a fifth is the
same seven files; nothing shared should need to change.

### The To Do Board (2026-10-15)

**The fifth thing authored on this page, and the one that is NOT a link
board.** Section id `todo-board`, FIRST of the two sections under the "Team"
eyebrow (Hub Resources is the other, and came the same day — see that row);
the `todo-board` Blobs store, `/api/todo-board`
(`netlify/functions/todo-board.ts`), `src/data/todoBoardStore.ts`,
`TodoBoardPanel.tsx` with `TodoBoardSheets.tsx` / `TodoBoardAvatar.tsx` /
`todoBoardStyles.ts` beside it, and `TodoBoard.test.tsx`.

It answers a different question from every section above it. Prototypes says
what the product is, Refinement what is under discussion, Development and Done
what shipped — this one says **who is on what this week**, which is why it is
not grouped with any of them and why it has no `PROTOTYPE_FEATURES` rows at
all (`bySection['todo-board']` is empty by design; the nav count is live from
`useTodoBoardCount`).

**It is not `createLinkBoard` with a different label, and that was considered.**
The factory requires a `url` on every record — it is the field the handler
validates hardest, because every stored one becomes an `<a href>` — and a card
has none. Making the centre of a shared handler optional for one caller is how
a shared handler stops being shared, so this is its own function. It keeps the
decisions that still apply: server-allocated ids, `addedDate` stamped once and
`updatedAt` on every write, `''`-not-absent for optional strings, unknown keys
dropped, and `owner` a typed LABEL rather than an identity nothing
authenticates.

Two rules live on the SERVER because the UI is not the thing that has to stay
true:

- **The handoff rule.** A card in "Ready for Prototype and Handoff" is
  Jillienne's — dragged there, created straight into it, or PUT by hand.
  `validateCard` is the only place that is decided; the panel mirrors it to
  explain itself (the column note, and the sheet swapping its Owner picker for
  a sentence) and sends the owner uncorrected so the two cannot drift. She
  cannot be removed from the roster for the same reason — the endpoint refuses
  it with a 409, and the sheet shows "Owns handoff" where her Remove would be.
- **The cascade.** Removing a person reassigns their cards to Unassigned
  (`owner: ''`) in the same request that deletes them. A client doing it as
  "delete, then patch N cards" leaves the board half-migrated if the tab
  closes on card three. The sheet asks first, and the question names the
  count.

**The roster seeds from `DESIGNERS`** — the same five names Refinement's
filter pills use — once, behind a `people-seeded` marker, with fixed keys so
two first loads racing each other write five records rather than ten. After
that it is the board's own list: Manage people edits this copy and Refinement
is unaffected either way. The test compares the function's `SEED_PEOPLE`
against `DESIGNERS`, since the function re-declares it at the trust boundary.

**Order inside a column is a float, not an index.** A drop between two cards
stores the midpoint of its new neighbours, so one move writes one record — an
index would renumber the column on every drag, and two people dragging at once
would each renumber the other's list. Ties break on id, so the order is total
even when two midpoints collide. `positionForDrop` is the whole of it.

**The board is a NEW pattern.** There is no kanban anywhere in this codebase —
no column, no draggable card, no drop target; the house-style skill's
`reference/gaps.md` still names drag-and-drop as a gap. The column, the card
and the drag are built from the gateway's own `--ux-*` tokens in
`todoBoardStyles.ts`. Everything around them is existing furniture: `Sheet` for
both slide-overs (480px, right-anchored, Close top-left, primary action left in
the footer — the `AddCustomEventPanel` shape), `ActionMenu` for the card kebab,
and `UX_TOKEN_BRIDGE` on the panel root and inside each sheet, because
`ActionMenu` is styled on the brand tokens and `Sheet` portals out of the
shell that carries the palette. **Every move the drag makes, the kebab makes
too** — "Move to …", "Move up", "Move down" — so the board is not
pointer-only; the grip is what is draggable rather than the whole card, or
every reach for the owner `<select>` would start a drag instead.

**The chrome was cut back on 2026-10-15, after the first look at it**, and
each cut is worth knowing because each took something away:

- **The kebab is two items** — **Edit card** (the same sheet as New card, told
  apart by whether it was given one) and **Remove card**. It carried a "Move
  to …" row per column plus Move up / Move down. ⚠ Moving between columns by
  keyboard still works, through the edit sheet's Column picker; what is no
  longer reachable without a pointer is **reordering inside a column**, since
  `position` has no control of its own. The place to put that back is the edit
  sheet, not the menu.
- **"Add a card" is on To Do only.** Four identical dashed buttons invited new
  work into columns meaning "somebody is already doing this" and "this is
  ready to hand off". Creating a card elsewhere is the sheet's Column picker —
  a decision rather than a shortcut.
- **The owner on a card is a LABEL, not a control.** It was a borderless
  `<select>` — the concept's idea — and a live control on every card means a
  mis-click reassigns somebody's work with nothing in between and no undo.
  Reassigning is the edit sheet's Owner field. `setCardOwner` in
  `todoBoardStore.ts` is unwired but kept and exported, so a quick-reassign
  control is a call site rather than a rewrite.
- **The toolbar line is gone.** The count, Manage people (the icon alone) and
  **+ New** sit at the right-hand end of the filter row, so there is one row
  of chrome over the board instead of two.
- **"Copy as markdown" went with it.** `toMarkdown` is still exported and
  still tested, so restoring the button is a button rather than a feature —
  but until somebody does, the board has no way out of a store nothing backs
  up. That is a real trade, not an oversight.

**The columns SHARE the width; nothing scrolls sideways.** Four fixed 258px
columns are 1080 with their gaps — exactly the page's reading measure before
its padding — so the fourth sat behind a scrollbar. The board is a grid of
`minmax(0, 1fr)` tracks and its `<main>` drops the 1080 cap
(`mainWideStyle`). ⚠ There is deliberately **no `overflow-x` wrapper**: CSS
cannot scroll one axis and overflow the other (`overflow-x: auto` computes
`overflow-y: auto`), so the wrapper that stood there for one commit clipped
the card kebab's menu at the bottom edge of the board. Narrow windows squeeze
the columns instead. Columns are 320px tall empty, so the board reads as a
board and a menu on the last card has somewhere to open.

**The person avatars are the one thing on this board that does NOT follow the
palette (2026-10-15, Jillienne).** They started on the gateway's four
`--ux-hue-*` tokens and failed twice: filled, a hue and its `-fg` partner
measured 1.00:1 to 4.75:1 (1.00 literally — in dim Moss both tokens are
SAGE, so the initials were invisible); tinted into the card to fix that, the
four discs sat ΔE 1.7–4.9 apart, and under ~10 reads as the same colour, so
they identified nobody. Four tokens cannot carry five-plus people across four
palettes. They are six families from the project's own brand ramps now
(`todoBoard.css`) — slate `primary-600`, teal `info-700`, green
`success-600`, gold `secondary-800`, brick `cta-500`, taupe `tertiary-600` —
solid, with WHITE initials, white because an ink that followed the theme is
exactly how the first version broke. Measured on the deployed build: 5.15:1
at worst, the two closest discs ΔE 20.9 apart. **EIGHT since the first
day**: Cody and Jillienne came out the same colour (the old rotation handed
out `existing.length % HUES.length`, so a removal shortened the roster and
re-issued a colour still on the board), and XCEL has no seventh distinct hue
— what is left are darker steps of families already present, which read as
the same disc at 24px. So `violet` (#5b3e8c, 8.36:1, ΔE 42 from its nearest)
and `plum` (#8c2d6b, 7.77:1, ΔE 48) are literals, like the ink. A new person
now takes **the first colour nobody is using**, and Manage people carries a
colour chooser — which exists because the records already in the store could
not be fixed any other way: the only remedy for a duplicate was removing
somebody, which would have sent their cards to Unassigned to fix a palette
problem. The endpoint takes `PUT /api/todo-board/people/:id` with a `hue`
and ⚠ **nothing else** — a card stores its owner's NAME, so a rename there
would orphan every card they own without the cascade `DELETE` runs.

 ⚠ The names describe what
XCEL's ramps actually PAINT, which is not what the family names imply: `cta`
is the brick red of the knight in the lockup, `primary` is slate blue,
`tertiary` is taupe. A first version of this list was named from the generic
house ramps and shipped a "navy" that rendered red — resolve the token before
renaming one. Unassigned stays grey on the
page's own tokens, so "nobody" is visibly not one of the six. **The card
carries the same colour as a 3px top stroke** (2026-10-15), so who owns what
reads from across the room rather than from the avatar alone — both read
`hueFor()`, so the two cannot disagree. ⚠ The card's whole border lives in
`todoBoard.css` for that reason: an inline `border` shorthand beats a class's
`border-top-color`, and a card styled inline would silently keep the grey. The ring is
`--ux-border`, which does still follow the palette: it is the disc's edge, not
its identity.

⚠ **Not the archived To Do section** (`todo-section`, 2026-09-29, id `todo`).
That was a per-browser checklist in `localStorage`; `TodoPanel.tsx` and
`todoStore.ts` are untouched by this and that archive row still describes a
real restore. The ids differ precisely so an old `?section=todo` link does not
land on a different thing than the one it was written for.

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

**`/share` files a card too, as of 2026-10-15.** Adding the Refinement row and
saying on the To Do Board that somebody has to look at it are one intention,
so they are one command: step 11 of the skill hands over a SECOND address,
`/?section=todo-board&add=1&column=refine&title=…&note=…&owner=…`, and the
board's card sheet opens on **Ready For Refinement**. Same three decisions as
the row's prefill, for the same reasons — no POST (the password fronts
`/api/todo-board` as well), the page reads and strips the params rather than
the panel, and nothing is stored until the designer clicks **Add card**. Two
differences worth knowing: the review URL rides in the card's NOTE, because a
card has no url field (the Refinement row is where the link lives); and
`owner` is resolved against the roster by `resolveOwner`, so a `git config
user.name` nobody on the board answers to opens **Unassigned** with the picker
on the sheet rather than inventing a second spelling of somebody. The
`demoPrefill` reader is gated on `section=demo` from the same day, since both
hand-offs now use `add=1` and one address must not arm two prefills — the
unconsumed one would keep its params on the address for a reload to reopen.
`TodoBoard.test.tsx` pins the panel half and the page half.

**The automatic branch list — the strip above the rows** (2026-09-21). Step 6
still needs a designer to say "this one"; what it no longer needs is anyone to
find and paste a URL. `/api/branches` (`netlify/functions/branches.ts`) lists
every branch with a Netlify build, and `BranchStrip` in `LinksPanel.tsx` renders
them above the Refinement rows with one action each: **Add**.

**IT LISTS DEPLOYS, NOT BRANCHES, and that is the decision.** GitHub's branch
list is the obvious source and the wrong one: a pushed branch Netlify has not
built yet has no URL that opens, so listing it produces a link that 404s until
some later moment nobody is watching for. That is the defect the Resources
section shipped four of, and the rule it had to learn — confirm a URL on the way
IN, not later. A deploy in state `ready` IS that confirmation. `context ===
'branch-deploy'` drops production (`main` IS Prototypes) and drops DEPLOY
PREVIEWS, which die with their PR; the branch alias survives and always points
at the newest build, which is the link this board is about.

**THE STRIP NEVER WRITES, and that is what keeps the review gate.** A branch
having a build is a fact about Netlify; a Refinement row is somebody ASKING to
be reviewed — it carries the note saying where to look, whose it is, and
`isPublic`. Those are different things. So **Add** opens the same form a
designer would have filled in by hand, with the address and a draft title in it,
and the click is the gate — the identical contract `promote-to-refinement` has,
and for the identical reason. The NOTE is left empty deliberately: it is the one
field the strip could fill from the commit subject and the one it must not,
because "where to look" is what only the person who did the work knows, and a
plausible wrong note reads as reviewed when nobody wrote it. `isPublic` stays
false.

**Auto-creating rows was the other option and is the trap:** the store would
fill with branches nobody offered, `isPublic` would have nothing meaningful to
hang on, and deleting a row would just bring it back on the next build.

**Branch names are internal, and TWO independent controls keep them off the
public build** — neither relied on alone. (1) The public project sets no API
token, so there is nothing to call with. (2) `VITE_GATEWAY_MODE=public` makes
the endpoint **404 outright**. One would be enough right up until someone sets
the Blobs vars on the public project to share a store, which is a reasonable
thing to do and would silently switch (1) off. `showBranches` on the
presentation is the client half — Resources is not about branches either.

**Config, and the fallback is the point.** `NETLIFY_API_TOKEN` +
`NETLIFY_SITE_ID` (the site whose BRANCH DEPLOYS these are — the **public** one,
because that is where a branch is reviewed), falling back to `BLOBS_TOKEN` +
`BLOBS_SITE_ID`. That fallback is deliberate rather than lazy: those two are
already set on the FULL project and already point at the public site, so the
feature needs NO new configuration on a site that is already set up — the
difference between it working and it sitting behind a step nobody did.

**Silent when there is no endpoint; loud when there is one and it is
misconfigured.** A grey box above a healthy board every time someone runs `npm
run dev` is noise that looks like a fault in the board underneath — but an
expired token IS a fault nobody would otherwise notice, since the list just goes
quietly empty. `configured` is how the client knows OUR endpoint answered; valid
JSON without it is the SPA fallback or a test stub, i.e. "no endpoint here".

**A branch already on the board drops out**, matched on the branch alias in the
row's HOST (`feat-x--…`) rather than on the whole URL — the strip offers the
review path and a designer may have added the root, a deeper path or a different
query, and what makes them one review is the branch. Matching the href would let
a row whose NOTE mentions the branch count as listed. The count says how many it
dropped, so a designer who cannot find their branch can see why.

`Branches.test.tsx` pins the selection rules, that Add writes nothing, that the
note stays empty and the toggle off, the absence on the public build and on
Resources, and both halves of the public-build guard at source. The pure
selection logic is `netlify/lib/branchDeploys.ts` — split out so a test can
reach it without a network or a token, the same split `linkBoard.ts` makes by
exporting `validateRecord`.

**The promote skill was renamed, not rewritten.** `promote-to-demo` →
`promote-to-prototype`, now checked into `.claude/skills/` so Claude Code
sessions in this repo carry it, with the Cowork copy kept under the old name as
an alias. Its logic — diff the branch's `FEATURE_FLAGS` against `main`, ask per
flag, apply, commit — was already right; what changed is the vocabulary, that it
runs ON THE PR BEFORE MERGE (merging publishes to two sites now), that a
DECLINED flag must be set back to `main`'s value (the designer turned it on to
see their work), and a final step to retire the branch's Demo row.

**`FeatureCategory` gained `'prototype'`** for the one row (two since
2026-10-14), and `sectionOf`
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

**All five XCEL rows sit in Exploration** (moved there 2026-09-02 from Design;
since 2026-10-15 the section is called Explorations and sits under PRDs — the
rule below is unchanged, only the section's name and place).
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

### A third site — the user-test build (2026-09-23)

**`xcelusertesting.netlify.app`**, tracking **`test/session-1`**, with
`VITE_GATEWAY_MODE=testing` and its own password. One job: hand a participant a
link to the product and nothing else.

⚠ **The branch is FROZEN, and that is the load-bearing part.** The site
rebuilds on every push to its production branch, so one tracking a working
branch would rebuild mid-session under the moderator. `promote-to-testing`
force-pushes to it deliberately and tags each session; nothing reaches a
participant in between.

> **Rename pending:** `test/session-1` should be `test/live` — the site tracks
> exactly one production branch, so a second session cannot get a second
> branch, and the sessions are recorded as tags instead. Changing it means
> editing the site's production branch at the same time.

**It exists because `public` was not enough.** That build TRIMS the project
list and still serves it at `/` — a stakeholder is meant to browse. A
participant is not. They get one link to one screen, and a project list, even a
trimmed one behind a password they were given, tells them they are inside a
prototype gallery belonging to a design team. That reframes everything they
then say about the product.

So on this build the gateway does not exist: `/`, `/ux-dashboard`,
`/research-rationale` and `/links` all redirect into `/dashboard-rebrand`
(`replace`, so it is not in their history either), and `/prototypes/*` is 404'd
at the edge exactly as on the public build. The product's own ~28 routes stay
open — a participant who wanders from the course into My Courses should find
it, because that is the product and the wandering is the data.

**Setting up the site:** same repo, same `netlify.toml`, no build-command
change. Set the production branch to a FROZEN test branch rather than a working
one — a site tracking an active branch rebuilds mid-session — set
`VITE_GATEWAY_MODE=testing`, turn branch deploys off, and set the password
under Access & security. The site gets its own empty Blobs store, so QA Notes
and Links hold nothing there; both sections are gone on this build anyway.

**Every page view starts from the baseline, not from the browser (2026-10-08).**
`TESTING_BASELINE` in `FeatureFlagContext` opens a session at 0%, and for two
weeks that was only a default: `loadInitial` merged `cgp.featureFlags` over
it, so the Progress a moderator last picked from the `?test=0` bar became the
starting state of every later session in that browser — a participant link
opened at ~63%. On this build `loadInitial` and `loadCustomDefaults` now ignore
what the browser saved. The bar still works mid-session; `?ff=` is still how a
session opens on anything but the baseline. `TestingGateway.test.tsx` pins it.

`isPublicGateway()` is `!== 'full'`, so `testing` inherits every trim `public`
has and then adds its own. A fourth mode would inherit the trim by default,
which is the safe direction. `scripts/public-redirects.mjs` lists the trimmed
modes explicitly instead, because it writes a rule that DENIES access — that
one should be opted into, not inherited.

Tests: `GatewayMode.test.ts` (parsing, the subset relation, the edge block) and
`TestingGateway.test.tsx` (each gateway route lands in the product, and neither
the full nor the public build moved).

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

### Control maturity — what the design site lets the demo site show (2026-09-24)

The demo site's controls bar carries a SUBSET of the design site's. Persona,
Pacing and Education came off it because they are work in progress: a
stakeholder who opens the demo link and finds a control that reshapes the page
in ways nobody has agreed on has been handed a decision we did not mean to
offer. The design site's audience *is* the people making those decisions, so
nothing is taken from them.

**Readiness is a property of the work, so it lives on the work.** Each flag in
`FEATURE_FLAGS` may carry `maturity: 'wip' | 'ready'`, and
[`src/data/demoControlMaturity.ts`](../src/data/demoControlMaturity.ts) resolves
a control's readiness in three steps:

1. an explicit `maturity` on its `DEMO_CONTROLS` row — for the controls that are
   not flags at all (Persona, the Quick tier switch, Brand, the Reset block);
2. otherwise the `maturity` of the flag it drives;
3. otherwise **`wip`**.

That third step is the whole design. **Forgetting `maturity` hides a control
from stakeholders; it never reveals one.** Forgetting costs a conversation;
the opposite default would cost the decision. Promoting is a deliberate act.

Variants work the same way one level down — a `ready` flag can still carry a
`wip` variant, which the demo site drops from the picker. Absent on a variant
means *inherit the flag's*, not `wip`, or promoting a flag would empty its own
picker.

**To promote a control:** add `maturity: 'ready'` to its flag in
`FEATURE_FLAGS` (or to its `DEMO_CONTROLS` row if it has no flag). That is the
entire change — the bar, the tests and the demo build follow.

**Two things the design site gains:**

- an amber dot on every control a stakeholder will not get, so the bar does not
  make every axis look equally agreed;
- **View as demo** (`?as=demo`), which re-renders the bar the way the demo site
  would. It is a *lens*, not a setting: URL-only, never persisted, and it
  changes nothing about the page underneath. It answers "what does a stakeholder
  actually get?" without a second deploy.

⚠ A dropdown whose `id` has no `DEMO_CONTROLS` row resolves `wip` and silently
vanishes from the demo site. Safe, but rarely intended — `PublicGateway.test.tsx`
reads the ids back out of `DemoControlsBar.tsx` and fails when one is missing.

⚠ Hidden text lands in the accessible name. The dot's screen-reader label says
"(not on the demo site)" and *not* "work in progress", because that phrase
contains "Progress" — the name of a control on the same bar — and broke two
unrelated suites querying `/Progress/i`.

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

**Running it locally needs `netlify dev`, and the launch config carries three
traps** that cost real time here — see `.claude/launch.json`'s
`xcel-dashboard-netlify` entry. `PORT` must be pinned inside the command, or
vite inherits the launcher's port and every request reaches vite instead of
netlify's proxy (the symptom is `/api/*` answering **200 with index.html**, which
reads as a broken redirect). And `--functions` must be an ABSOLUTE path when this
runs from a **git worktree**: the CLI resolves the functions dir against the
REPOSITORY root, so it serves the main checkout's `netlify/functions/` and a
function added in the worktree is simply missing — while both pre-existing
endpoints load fine, which is exactly what makes it convincing.

And **PATH**, added 2026-09-21: the launcher's shell does not inherit the login
PATH, so a bare `netlify` is `command not found` and the pane reports it as the
dev server exiting during startup — which reads as a crash in the app rather
than a missing binary. The entry sets it, and note netlify-cli installs to npm's
global prefix (`$HOME/.local/node/bin` here), NOT the `$HOME/.local/bin` the
sibling `xcel-dashboard` entry uses for node and npm. The CLI is not a
dependency of this repo: `npm install -g netlify-cli`.

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


### The in-app rows

Every row in `prototypeFeatures.ts` opens a standalone HTML document under
`public/prototypes/` except the Prototypes rows — **`xcel-dashboard`** and,
since 2026-10-14, **`xcel-compass`** — which are react-router routes
(`to: '/dashboard-rebrand…'`) into the product app that now lives in this repo.
The notes below were written about the first and hold for both.

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
  capture if Demo grows. (It grew to two on 2026-10-14; two frames was judged
  fine, and the Compass row's note says to add captures past three.)
- **No `devStatus`**, same trap as the Exploration rows: `sectionOf` checks it
  before `category`, so authoring one silently moves this row off the front
  door.


### Row thumbnails — one row now needs one

The sibling PartnerHub dashboard authors a `thumbnail` on every row for a
performance reason: nine of its ten rows preview the same 857KB single-file app,
so a section booted several copies of it just to draw its list.

XCEL used not to have that problem — five rows, five documents, 9–111KB each, so
the live scaled iframe was cheap and could not go stale. **`xcel-admin-tool`
broke that condition** (and restored it when its row was archived on
2026-10-15 — `admin-tool-row`; the rest of this passage is as written). It is a fork of the PartnerHub app and it is ~910KB, so
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

