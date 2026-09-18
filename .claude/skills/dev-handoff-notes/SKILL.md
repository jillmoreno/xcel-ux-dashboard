---
name: dev-handoff-notes
description: Author (or extend) a prototype feature's dev-handoff gateway — the UI Components & UX Logic breakdown, the Design & Product Decisions log, and the Live Preview routes. Covers the components-vs-uiComponents split, the Quick Summary the designer must be ASKED for, the row-list-and-detail rule (and why the detail is one scroll, never sub-tabs), the user story, badgeDate and thumbnail fields, the `Label — what it shows` preview-caption shape, the one-sentence blurb, the tileBlurb budget, the authored devStatus, when a feature should split in two, and the Markdown export. Trigger on "add handoff notes", "document this for dev", "dev handoff for <feature>", "add a decisions log", "new dev-handoff tile", "hand this off to engineering".
version: 0.2.0
author: UX Design — Colibri
last_updated: 2026-08-31
status: active
---

# Dev handoff notes

Everything a prototype feature needs so a developer can build from it. All of it
is **data** in [src/data/prototypeFeatures.ts](../../../src/data/prototypeFeatures.ts) —
adding or extending a handoff is a data-only change. Do not add rendering code
unless a rule below says so.

## The three fixed gateway tabs

A guided feature's gateway (`/prototype/:featureId`) always renders the same
three tabs, defined once as `GATEWAY_TABS` in
[src/pages/PrototypeFeaturePage.tsx](../../../src/pages/PrototypeFeaturePage.tsx):

| Tab | Renders | Fed by |
|---|---|---|
| **UI Components & UX Logic** | the per-component breakdown | `devHandoff.uiComponents` |
| **Design & Product Decisions** | the decisions log | `devHandoff.decisions` (+ `devHandoff.components` tiles, if any) |
| **Live Preview** | the embedded real route | `pages` (or `livePreviewUrl`) |

**Components lead, and the gateway lands there** (2026-08-31; they used to sit
second). The components ARE the feature; the decisions log is the record of how
they got that way. First tab and default tab are the same thing — if you ever
reorder these, move the `useState` default with it.

**The set is fixed, not data-derived — do not change that.** A tab whose data
isn't authored yet still renders and shows a `TabEmptyState` naming the exact
field to add. This is deliberate: tabs used to be built from whatever data
existed, so a feature missing its decisions log silently showed two tabs and a
reviewer couldn't tell *"not documented yet"* from *"this feature has none"*.
The empty state is the signal that there's a gap to fill.

## Rule: where the component breakdown goes

Put the per-component breakdown in **`uiComponents`** and leave
**`components: []`**.

```ts
devHandoff: {
  intro: '…',
  components: [],        // ← the Decisions tab is the decisions log ONLY
  uiComponents: [ … ],   // ← the breakdown, on the tab named for it
  decisions: { … },
}
```

Both fields hold the same `DevHandoffComponent[]` type and share one detail
route, so the only difference is which tab renders them. `components` is the
legacy home and puts tiles on the Decisions tab, on top of the decisions log —
which means the same tiles can render on two tabs at once. Don't do that.

## Rule: one component renders inline; several become a row list

`UiComponentsSection` branches on count, and **never on a tile grid** (removed)
or a pill strip (removed 2026-08-31):

- **One** `uiComponents` entry → its handoff renders **inline on the tab**, with
  no back link. A list of one is pure indirection.
- **Two or more** → a **row list**, then a **detail view** that replaces the list
  behind an "← All components" link.

A row carries a **live thumbnail**, the full `name`, its `badge` + `badgeDate`
right-aligned, a 2-line `summary`, and **chips naming what is authored** —
`User Story · 4 variants · UX Logic · Design Spec · Acceptance · States`. That
chip row is the point of the list: it answers *"is there a spec on this one?"*
without spending a click, and it makes an under-documented component obvious at
a glance. It replaced a pill strip, which gave a truncated label and nothing
else — at six components with names like *"Sheets — Manage Membership + Your
Memberships"* the strip was a row of abbreviations.

Master/detail rather than a persistent side rail because several previews run to
~1232px wide, and a rail would squeeze the one thing the page exists to show.

### Inside the detail: ONE SCROLL, never sub-tabs

Sections stack in this order, each with a real anchor id
(`<componentId>--<sectionId>`), under a sticky jump nav with scroll-spy:

**Quick Summary · User Story · UX Logic · Design Spec · Acceptance · States · Notes**

**They were sub-tabs for a few hours on 2026-08-31 and a developer reported it
was worse. They were right, and the reason is concrete:** inactive panels were
conditionally rendered, so their content was not in the DOM at all (8,906
characters with tabs vs 17,184 stacked). That breaks four things a developer
does constantly and a reviewer never does — **find-in-page** across the handoff,
**select-all-and-paste** into a ticket, **print/PDF**, and any **deep link** to a
section. The complaint that produced the tabs was real (stacked sections ran past
3,000px and buried the acceptance criteria) but that is a NAVIGATION problem, and
hiding content is the wrong lever for it.

**If this ever looks like it wants to be tabs again, re-read those four things
first.** The nav uses `aria-current`, not `role="tab"` — it navigates within a
document, and announcing tabs would promise a panel swap that no longer happens.

`COMPONENT_SECTIONS` order must match the render order: the scroll-spy walks that
array and takes the last heading past the line, so a mismatch highlights the
wrong chip.

**Every section is deep-linkable.** Anchors are `<componentId>--<sectionId>`, so
`…/prototype/membership-sections#membership-renewal-states--acceptance` opens the
components tab, opens that component, and lands on Acceptance — from cold, not
just when you were already there (`componentIdFromHash()` seeds both the tab and
the open component). That is the link to paste when you want a dev to read one
specific section, and it is worth knowing exists before you screenshot a spec
into Slack.

This is automatic. **Author the data and the right treatment follows** — never
special-case a feature in the rendering code. Both views reuse the same
`DevHandoff*Body` renderers as the detail screen
([src/components/prototype/DevHandoffNotesBody.tsx](../../../src/components/prototype/DevHandoffNotesBody.tsx)),
so the surfaces can't drift, and the detail route still resolves for anyone
holding a link.

### The live render — no longer on the component detail

**Changed 2026-09-09 (Jillienne): the Preview section was REPLACED by the Quick
Summary.** The component detail no longer opens with a render of itself.

The reasoning: a picture answers *"am I on the right component"*, and by the time
you are reading a detail the row list has already answered that — every row
carries a thumbnail. What it answered nothing about is intent, which is the thing
a handoff exists to carry. So the lead slot went to the designer's words.

`ComponentLivePreview` is **still the one registry** and still wired in two
places, so registering a case is still worth doing:

- the **row thumbnails** (`ComponentThumb`) draw from it — that is now its main job
  on the gateway;
- the standalone `/prototype/:feature/:component` page still renders it full size
  (side-by-side with the UI/UX logic). That page has no UI route in and is
  reachable by URL only, so it is where to send someone who specifically wants to
  poke the live component.

Two things to know when authoring:

- **An unregistered id is handled, not hidden.** `ComponentLivePreview` takes an
  optional `fallback`. The row thumbnail passes `null` (at 104x68 a sentence is
  illegible, so it shows the empty plate); the standalone detail page names the
  exact function and file to add a case to. If a row's thumbnail is a blank
  plate, the fix is a case in that registry keyed on your id.
- **The render sits directly on the page** — no frame, no height cap. It briefly
  sat in a bounded 560px scroll box, since several previews stack every variant
  and run past 2,900px; a box inside a tab inside a page read as one container
  too many. Don't reintroduce one.
- **The "Open the full handoff →" link was removed** (2026-08-31). The inline
  view now shows every section the standalone detail page does, so the link was
  pointing at a longer way to read the same thing. Consequence worth knowing:
  for a feature documented with `uiComponents`, `/prototype/:feature/:component`
  now has **no UI route in** — it is reachable by URL only.

The old **"No live preview registered for `<id>` yet"** empty state is gone with
the section — an un-authored Quick Summary box is now what an undocumented
component shows, which is a gap someone can actually fill.

### Row thumbnails

Each row shows a **live, inert miniature** of the component's own preview
(104x68, CSS-scaled from a 1280 render, `aria-hidden`, `pointer-events: none`).
Nothing mounts until an `IntersectionObserver` says the row is near the viewport
— six previews is not six cheap components.

Set **`thumbnail`** to a static PNG when the live one has a specific problem:

- its top-left is mostly white, so the miniature reads as a blank plate;
- **find-in-page is matching inside the thumbnail** — a live render puts its text
  in the DOM at 8% scale, so a search for a token name can hit a picture. A flat
  image has no searchable text at all.

Convention and sizing: [public/prototype-thumbs/README.md](../../../public/prototype-thumbs/README.md).
A missing or broken file falls back to the live render, so adding one is safe
before the image exists.

### Preview captions — write `Label — what it shows`

Each variant in a preview renders as **its own bounded card**, with a
**sub-header** and a **description line** above the render (`PreviewItem`).

The sub-header is **derived from the caption**, not passed separately:
`splitCaption()` takes everything before the first ` — ` as the header. So the
caption is not free prose any more — it has a shape:

```tsx
<PreviewItem caption="Member · Elite · Passport Lite — the shipped default: the
  passport card beside Lifetime Member Details, with Manage as its only action.">
```

- **Left of the em dash: the label.** Which variant this is — brand, tier,
  membership, flag arm. Keep it short; **over 70 characters and it is treated as
  prose, not a label.**
- **Right of it: what the variant shows,** and ideally why it is in the set.
- **No ` — `?** You get a description with no header. That is a legitimate
  outcome (8 of the 52 captions written so far have no label), but if the
  variant *has* a name, give it one — a set of unlabelled cards cannot be
  compared.
- Use ` · ` inside the label to separate axes (`Member · Elite · Passport`),
  not another em dash.

The caption goes **above** the render, always. A caption below its render is
read against the variant above it, which is a real misreading on a stacked list.

## Authoring a `DevHandoffComponent`

Required: `id` · `name` · `location` · `summary` · `variants` · `uxLogic` · `data`.

Optional, and worth filling — each renders as its own framed section:

| Field | What goes in it |
|---|---|
| `order` | 1-based order; drives the tab order and the numbered badge on a Decisions-tab tile |
| `tabLabel` | **≤24 chars.** Short label, kept for compact surfaces. The row list shows the full `name`, so this matters less than it did under the pill strip — still worth authoring, and it is the same budgeted-short-field pattern as `tileBlurb` vs `blurb`, deliberately not a truncation heuristic |
| `badge` | short flag, right-aligned on the row and beside the detail heading ("UPDATED", "NEW") |
| `badgeDate` | **ISO `YYYY-MM-DD`.** When that badge's change landed, rendered beside it as `UPDATED · 8/31/26`. "Updated" answers *when*, which is the only thing that makes it useful a month later. **Leave it unset rather than approximating** — a badge with no date renders the bare label, which is the designed degradation, not a gap |
| `thumbnail` | static PNG for the row, preferred over the live miniature — see *Row thumbnails* above |
| `quickSummary` | **ASK the designer for these words — never write them yourself.** Plain text, the designer's own voice, leads the detail. See below |
| `userStory` | `{ asA, iWant, soThat, value?, notes? }` — the PO's framing. See below |
| `uiUxLogic` | `{ why, variants \| actions, edgeCases, toasterLogic }` — the reasoning worked through while designing it |
| `designSpec` | `{ tokens, states, responsive, sources }` |
| `acceptanceCriteria` | testable Definition of Done |
| `statesMatrix` | `{ state, behavior }` for the non-happy paths |
| `stubs` | what's still a `console.info` and what it needs |
| `a11y` | roles, labels, focus and keyboard behavior worth preserving |
| `jiraTickets` | component-scoped ticket URLs |

### The Quick Summary — ASK for it, never write it

`quickSummary` is the **first** section of every component detail: the designer
telling the developer, in their own plain words, what this thing is about —
before a token, a variant or an acceptance criterion.

> **RULE (2026-09-09, Jillienne): whenever you author or extend a dev handoff,
> ASK the designer what they want the Quick Summary to say. Every time, for every
> component. Do not draft it, do not infer it from the code, do not paraphrase
> `summary` into it.**

Ask plainly — *"What do you want the Quick Summary to say for `<component>`?"* —
and use the answer close to verbatim. Tidy obvious typos; do not "improve" the
voice, expand it into spec language, or pad it out. Short is fine. One sentence
is fine.

**Why the rule exists.** Every other field on this page is Claude reading the
code back: `summary` describes what the component does, `uxLogic` reconstructs
the rules, `designSpec` quotes the tokens. All of that is derivable. What is not
derivable is what the designer *meant* — and if Claude writes that too, the
handoff becomes one voice describing itself, and a developer has nothing to read
against the implementation. The same reasoning already governs `userStory`
(*"a story you invented is worse than an empty section"*); this field is stricter
because it is explicitly first-person.

**If you haven't asked yet, leave it unset.** The un-authored state is its own
designed box — a dashed empty frame reading **"Jill add your notes here"** — not
the quiet "add this field" line the other sections use. That difference is
deliberate: those lines tell a *developer* a spec field is missing and cost almost
no height; this one is addressed to the designer, about the one field nobody else
can fill, so it takes real space and reads as a slot waiting for her. An invented
Quick Summary reads as her own words and is not, which is a worse failure than a
blank section: it is the one field on the page nobody would think to check.

**Where it shows up:** the lead section of the component detail (unframed, one
step up in type size — plain prose, deliberately not another spec block), a
`Quick Summary` chip on the component's row so the list shows which components
have been spoken for, and a `#### Quick Summary` heading in the Markdown export,
above the user story. That export is what gets pasted into a ticket, which is
where these words matter most.

**Formatting:** plain text, with a vocabulary of exactly two rules — blank lines
split blocks, and a block whose every line starts `* ` or `- ` renders as a list.
Single newlines inside a paragraph are **preserved**, not reflowed. Keep it at
two: the moment this grows fields it becomes a form, and a form is what a
designer writing in their own words is being spared.

The list rule is not decoration — notes arrive with their own line structure
(the first one written for this field was a lead-in, three bullets and a closing
line), and silently reflowing them edits the designer's words. `* ` is also
literal Markdown, so the same text exports to a ticket as a real list with no
translation step.

### The user story

`userStory` renders SECOND, directly after the Quick Summary — the designer's
words, then the PO's framing, then the spec.

It is **structured, not freeform**, and that is the point: "as a / I want / so
that" exists precisely because it forces a role and a benefit to be named, and a
free text field quietly becomes a second `summary`. The three clauses render
under their own small-caps labels rather than run together as a sentence, which
makes an unfinished story visible — a `soThat` that merely restates `iWant` is
obvious the moment the two sit under separate headings.

- `asA` — the role as a PO would name them: *"member licensed in more than one
  state"*, not *"user"*.
- `iWant` — the capability from the learner's side, **not a UI description**.
- `soThat` — the benefit. If it reads as a restatement of `iWant`, the story has
  not found its reason yet.
- `value` — why it earns a place on the roadmap. This is the part a `summary`
  cannot carry.
- `notes` — scope, and especially **out** of scope, stated before a dev infers it.

**A story you invented is worse than an empty section.** The un-authored state
names the field to add, which reads as an honest gap; a plausible-sounding story
nobody agreed to reads as a decision. If you draft one from observed behaviour,
say so when you hand it over.

**`designSpec.tokens` reference NAMED tokens only** — `--color-primary-700`,
never `#0b2a4a`, never a px value. `tokens.css` and Figma are the sources of
truth, so the spec can't drift. When a color choice was a contrast decision,
say so with the ratio (e.g. *"`tertiary-700` — the lightest cyan clearing AA at
12px; 600 is 4.12:1, 700 is 6.53:1"*), so nobody "brightens" it later.

## The decisions log

`decisions: { intro?, items, openItems? }`, each item
`{ question, decision, status, owner? }` with status **Decided** ·
**Needs weigh-in** · **Blocked** (`owner` only on the open ones).

- Write the **question**, not the answer, as the heading — it's a log of what
  was asked, so a reader can tell what was actually settled.
- Record the **reasoning**, not just the verdict. "Flat list" is worthless;
  "flat, because month headings fight a column sort" survives.
- **Prune settled artifacts.** A question that only existed because of an
  abandoned A/B ("which arm ships?") should come out once it's answered — it
  isn't a live question for a dev picking the feature up.
- `openItems` is the short summary of what's still unresolved. Keep it in sync
  when you remove an item.
- **Never delete the reasoning when consolidating tiles.** If you remove a tile
  that carried shared decisions, migrate them onto the surviving tile first —
  otherwise they exist only in git history.

## Home-page fields

The home page (`/`, `UxDashboardPage`) is a **left nav over a project list** —
Demo · Research, then a divider and the restricted group Design · Exploration ·
Development. The tile grid it replaced is archived (`prototype-tile-landing`).

| Field | Rule |
|---|---|
| `blurb` | the full summary — gateway header, where there's room |
| `tileBlurb` | **≤160 characters.** It is the row's two-line summary on the home list and the tile paragraph on any surface still using tiles; over budget degrades to an ellipsis. Write both. |
| `category` | `'dev-handoff'` for a new handoff feature |
| `devStatus` | **Now load-bearing twice over.** It is the committed dev-cycle banner — `in-design` · `needs-discussion` · `blocked` · `ready-for-dev` · `in-development` — *and* it decides which home section the feature lands in. See below. |
| `done` | `true` when finished — shows a Done status and filters under the Done pill |
| `pinned` | `true` pins the feature to the top of its section. Use sparingly — one pinned row is a lead, several is just an order. |
| `kindLabel` | overrides the derived kind tag. Set `'Feature'` on an `explore` tile that opens ONE page rather than the whole platform. |
| `thumbnail` | a real capture instead of the generated mark — see Thumbnails below. |

### Which section a new feature lands in

`sectionOf()` in `UxDashboardPage.tsx` is the only rule, and it reads:

1. **`devStatus` wins.** `ready-for-dev` / `in-development` / `blocked` →
   **Development**; `in-design` / `needs-discussion` → **Design**.
2. **Otherwise it falls back to `category`** — `demo` and `dashboard` → Demo,
   `testing` → Development, `exploration` → Exploration, everything else →
   Design.

**Author `devStatus` on every new feature.** Step 2 is a guess, and **the page
no longer says so**: the Design and Development sections used to render a banner
counting how many of their rows were placed by the fallback, and that banner was
removed on 2026-09-01 (`8005c5a`). Placement is silent now — a row landing in the
wrong section shows no warning anywhere on the page. The smoke test's
`EXPECTED_PLACEMENT` map is what catches it, so when a row moves, update that map
in the same commit.

`devStatus` also drives the status filter pills and the row's status chip, all
through one resolver (`featureStatusKeyOf` in `devHandoffStatusUtil`). One field,
four surfaces — so a wrong value is wrong in four places at once.

### The row kebab overrides it (per browser)

Every row carries a kebab: Copy link · the five statuses · Clear status · Mark
done / Reopen. It writes the same stores the feature gateways read
(`cgp.devHandoffStatus`, `cgp.prototypeDone`), so a status set on either surface
shows on both — and an override BEATS the authored `devStatus`, which means it
can move a row between Design and Development.

That is for a reviewer working the board, not a substitute for authoring. An
override lives in one browser; `devStatus` ships to everyone. Author the field,
and treat a status that only exists as an override as unrecorded.

A roll-up status is stored per handoff CARD, so the kebab needs card ids: it
uses `devHandoff.components`, falling back to `devHandoff.uiComponents` when
`components` is empty (the current convention). A feature with **neither** has
nowhere to put one, and its kebab offers `Mark in design` instead. If you want a
new feature to be status-settable from the home page, give it handoff notes.

### Thumbnails

Rows carry a thumbnail generated from the feature's `accent` + `icon`. Nothing
to author, and that is the right default for almost every feature — an abstract
mark cannot go stale.

A feature whose point IS the visual can override it with a real capture: drop a
PNG at `public/prototype-thumbs/<feature-id>.png` and set
`thumbnail: '/prototype-thumbs/<feature-id>.png'`. Only do this if you will
re-shoot when the screen changes; every capture is that promise. A missing or
broken file falls back to the generated mark, so deleting one retires it safely.

## Live Preview routes (`pages`)

Each entry is `{ label, note, to, brand, membership }`. The label names the
iframe for screen readers even when no chip is visible, so keep it meaningful.

**The gateway header carries an "Open live preview" primary button** (under the
Demo brands row, visible on every tab) targeting `primaryPreviewSrc(feature,
brand)` — the absolute `livePreviewUrl` if there is one, else **the first
`pages` entry**. So order `pages` with the canonical view FIRST; that's the one
the button opens. The Live Preview tab's caption link only appears when the
reviewer has switched to a different variant, so there's never a duplicate
link to the same URL.

- The **membership switch** appears only when there's both a `member` and a
  `non-member` page; the **variant chips** only at 2+ routes per membership.
  Both self-hide — trim the array, never add a suppression prop.
- **Don't add a route for a state the reviewer can reach in the embed.** Status
  tabs, sorting, and filters are right there in the page; a separate "Claimed
  only" route duplicates a control they already have.
- Pin a flag arm with the read-only `?ff=key:variant` override so a shared link
  opens the intended state regardless of the reviewer's saved sandbox.
- If a feature is genuinely not membership-gated, one route is correct — but
  **leave a comment on `pages` saying why**, or the next session will read the
  missing non-member view as a bug and add it back.

## Before you finish

1. **Ask which brands** the feature should be demoable in — never assume.
2. **Both `member` and `non-member`** must be reachable from the gateway, unless
   the feature isn't membership-gated (then comment why, per above).
3. **Surface the feature flags** that drive its variants, in `featureFlags` +
   `flagsNote`, so a reviewer knows which switches matter.
4. **Re-read the notes against the code you actually shipped.** Handoff prose
   describing an archived flow is worse than no prose — a dev will build it.
   When you unwire something, grep the handoff for it in the same pass. This is
   the rule most often broken by a COPY change: on 2026-08-31 a copy revision
   left `membership-renewal-states` asserting *"both halves of what expiry costs
   are stated together"* as an acceptance criterion, minutes after the code
   stopped doing it. **A criterion is a promise a dev will hold you to.**
5. **Check your component isn't restating a sibling's axis.** Two components on
   one feature drift toward each other: `membership-sheets` and
   `membership-renewal-states` ended up sharing four near-verbatim acceptance
   criteria and six identical `statesMatrix` rows before being trimmed. The
   test: name what each one OWNS in a short phrase — *"the container and its
   actions"* vs *"what the copy says"* — and move anything that fails it.
6. **The gateway `blurb` is ONE sentence.** It is the header line under the
   title, and a paragraph there pushes the tab bar down the page. Put the detail
   in `summary` on the components, or in the decisions log. `tileBlurb` (≤160
   chars, for the home row) stays separate and may differ.
7. `npx tsc -b` (**not** `tsc --noEmit` — the root tsconfig has `"files": []`
   with project references, so `--noEmit` is a silent no-op), then
   `npx eslint <files>` and `npx vitest run`.

## When a feature should split

A walkthrough is one thing a reviewer can evaluate in one sitting. Split when a
part of it has grown all of its own:

- its own **component**, and
- its own **decisions** (especially a Blocked one), and
- its own **demo routes** and **flag**, and
- it can be judged **without** knowing the rest of the feature.

`membership-cancellation` was split out of `membership-sections` on 2026-08-31
on exactly that test — one component, six decisions, five routes, one container
flag, and nothing about the hero or the scorecard needed to assess any of it.

Take the whole set across: component, decisions, routes, flag, and any
`openItems` that belong to it. Then **retitle and rewrite the parent's blurb** —
`membership-sections` was still called "… + Cancellation Flow" for a few minutes
after the split, which is exactly the drift the checklist warns about.

**Editing `PROTOTYPE_FEATURES` around a split:** a feature entry is `  {` … `  },`
at two-space indent. A slice taken up to the NEXT feature's `id:` line carries
that feature's opening brace with it — mine did, and produced an orphaned `{`
that `tsc` only reported as an error 4,700 lines later.

## Exporting a handoff

The gateway header's **Actions** menu carries **Share Link**, **Download .md**
and **Copy .md**. The Markdown is generated from the same data this skill
describes
([handoffMarkdown.ts](../../../src/components/prototype/handoffMarkdown.ts)) —
decisions first, then each component — Quick Summary included, since a ticket is
exactly where the designer's words earn their keep — in its on-screen order. Acceptance criteria come out as `- [ ]`
checkboxes, since that is what a ticket renders.

An unauthored field is **skipped, not emitted empty**: a heading with nothing
under it reads as a gap in the work rather than a gap in the export. So a thin
handoff produces a short document, which is the honest signal.

## Removing something

Follow the Archive convention: **unwire it, keep the file(s) in the repo
unreferenced, and add a row to
[src/data/archivedItems.ts](../../../src/data/archivedItems.ts)** with where it
lived, why it went, and a `restoreNote` — so bringing it back is a re-wire, not
a rebuild. Then clean the handoff prose that described it.
