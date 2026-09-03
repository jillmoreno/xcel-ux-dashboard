# XCEL UX Dashboard

The gateway for XCEL LMS design work. Ported on 2026-09-02 from the PartnerHub
UX Dashboard — NOT from the Common LMS original — because PartnerHub was already
the trimmed version: slim `AccountContext`, iframe previews instead of the
component registry, the thumbnail fallback fixed, the port moved. That skipped
two whole steps of the port procedure. Port from the most recently ported
dashboard, not the oldest one.

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

This app is the **gateway only**: the dashboard, the feature walkthrough
gateways, and the dev-handoff detail screens. Four routes, and that is the whole
of `App.tsx`.

The XCEL prototypes are standalone HTML, and they are not even in this repo —
they live in `jill-dashboard-ux-designs/explorations/finserv-learner-brief/` and
are served from that project's deploy. **A new XCEL screen belongs there** (or
in `public/prototypes/` here, if the TODO below is actioned), not as a route.
The LMS equivalent routes ~28 product pages because the LMS product IS React;
XCEL's prototypes are hand-authored HTML documents, and the moment this repo
starts carrying product surfaces it has two sources of truth for the same
screens.

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

PartnerHub has no such components, so here the preview is **data**: a
`previewUrl` on the handoff component, falling back to its parent feature's first
`pages` entry, rendered as an iframe of the served file. Add a preview by
authoring a field, not by editing this page. The LMS already used exactly this
pattern for its own two HTML prototypes (`QuestionListPreview`,
`NgatAdminPreview`), so this is that generalised — not a downgrade.

Consequence worth knowing: `stackLogicBelow` / `fullscreenPreview` in that file
are now constants. In the LMS they were long OR-chains of component ids, because
its previews ranged from a 380px rail (fine beside its UX logic in two columns)
to full-page compositions. Every preview here is the same 860px iframe, so there
is nothing left to switch on. They're kept as named constants so the two-column
pairing is one edit away if a narrow preview ever lands.

## Trimmed on the way over

- **`AccountContext`** — 645 lines → ~150. The LMS models five brands and a
  four-level membership-tier system because its *product* renders per brand and
  tier. A trace showed three ported files use four names between them: `Brand`,
  `Membership`, `professionFor`, `useAccount`. `Brand` is kept as a one-member
  union rather than deleted so a second PartnerHub skin is an edit here instead
  of a refactor across those files; `Membership` is kept because the gateway uses
  it to express "the same page, two states" — for PartnerHub, partner-admin vs.
  read-only viewer. Rename the labels, not the shape.
- **`FeatureFlagContext`** (2,571 lines) — not ported. The dashboard never reads
  flags; the LMS product does. If PartnerHub grows variants, port it then.
- **`PageShell` / `PlaceholderPage`** — not ported. There are no product routes
  to stub.

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

### The cross-repo dependency, and the one way this rots

**Corrected 2026-09-02:** this section used to say `PROTOTYPE_BASE` points at
`https://ux-lms-dashboard.netlify.app/prototypes`. It does not, and had not for a
while — it is `'/prototypes'`, same-origin, served from this repo's own
`public/prototypes/`. The comment block at the top of `prototypeFeatures.ts`
explains why the pointer was abandoned: both sites sit behind Netlify password
protection, so an iframe of the other origin needed a third-party cookie, and
reviewers got a password prompt inside every thumbnail. The smoke test asserts
the same-origin shape (`/^\/prototypes\/[\w.-]+$/`) and that every file exists in
`public/`, so a careless edit fails there.

The cost that remains is the one PartnerHub has: `public/prototypes/*.html` are
copies, and their real home is
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/`, published by
`./deploy-xcel-prototypes.sh` there. Copy a file by hand and you have started the
drift that script exists to prevent.

**`xcel-admin-tool.html` is the exception, and it has no upstream.** It was
forked from `partnerhub-designs/index.html` and diverged immediately. This repo
is its home; do not expect the deploy script to know about it.

**TODO(2026-09-04):** revisit moving the five prototype files, their four smoke
tests and `deploy-xcel-prototypes.sh` into this repo, making it their real home.
Scheduled for review end of week.

Same class of problem, unchanged from the siblings: any authored count with no
array behind it. `RESEARCH_DECISIONS` is 0 here because XCEL has no decisions
log; nothing derives it and nothing warns when that stops being true.

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

Plus two XCEL-specific ones: that every row's `externalUrl` is an absolute URL
on a single shared origin (a relative path would 404 into the SPA fallback and
render this dashboard inside its own preview frame), and that **Demo is empty** —
asserted rather than assumed, so promoting a row to the ungated front page is a
deliberate change that breaks a test first.

Written because the port couldn't be verified visually, and because the failure
mode that mattered — a missing provider throwing on mount — renders a blank page
that looks like a styling bug. Extend it when you add a section or change
`sectionOf`; `EXPECTED_PLACEMENT` in that file is the list to update when a row
moves.
