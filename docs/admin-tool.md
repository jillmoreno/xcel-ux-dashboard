# The Admin Tool

`public/prototypes/xcel-admin-tool.html` — the PartnerHub fork answering admin
flows 03 / 04 / 06. ~910KB, one file, no build step.

> Moved out of `CLAUDE.md` on 2026-09-21, verbatim. The root file is the map;
> this is one of the five surfaces it points at. Cross-references to "CLAUDE.md"
> in older code comments mean this material.

---

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

