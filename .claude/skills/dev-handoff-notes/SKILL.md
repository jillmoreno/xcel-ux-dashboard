---
name: dev-handoff-notes
description: Author (or extend) a prototype feature's dev-handoff gateway — the UI Components & UX Logic breakdown, the Design & Product Decisions log, and the Live Preview routes. Covers the components-vs-uiComponents split, the Summary, the row-list-and-detail rule (and why the detail is one scroll, never sub-tabs), the user story, badgeDate and thumbnail fields, the `Label — what it shows` preview-caption shape, the one-sentence blurb, the tileBlurb budget, the authored devStatus, when a feature should split in two, and the Markdown export. Trigger on "add handoff notes", "document this for dev", "dev handoff for <feature>", "add a decisions log", "new dev-handoff tile", "hand this off to engineering".
version: 0.3.0
author: UX Design — Colibri
last_updated: 2026-10-26
status: active
---

# Dev handoff notes

Everything a prototype feature needs so a developer can build from it. All of it
is **data**, and adding or extending a handoff is a data-only change. Do not add
rendering code unless a rule below says so.

## How to run this with a designer (2026-10-26)

**Read this first.** Everything below it is the rulebook for what a good handoff
contains. This is the ORDER OF OPERATIONS when a designer says
`/dev-handoff-notes for <feature>` on their own branch (Jillienne: "I want to
make it as easy as possible on these designers"). The aim: they answer six short
questions in their own words and get a page, without ever seeing a field name.

**Step 0 — read before asking.** Find the component(s) on their branch and read
them. Draft from the code everything it can tell you: the component list, the
states (each flag arm and each conditional is a state), every button and link
and what it does, the tokens used, the route the preview opens on. Pick the
`id` from the title, the `accent` and the `icon` yourself. Never ask the
designer for something the code already says, and never ask them to look at
code. (There is ONE brand in this repo — `Brand` is a one-member union — so the
"ask which brands" item under *Before you finish* is answered: `['xcel']`.)

**Three tag fields (2026-10-27).** `surface` from the files the feature lives
in (`atlas` · `invite` · `compass` · `admin` — the kind tag reads Atlas ·
Invite Flow · Compass · Admin), no question needed. `lastUpdated` is now, in
UTC (`date -u +%Y-%m-%dT%H:%M:%SZ`), re-stamped on EVERY write. And `owner`
is **the person running the routine** — the designer tag names who wrote the
handoff, never the surface's owner (Jillienne: "designer should be Jill,
because she is the one that ran the skill to create the handoff"). **Confirm
it before the first question**, with the git name offered as the Hub spells
it (Jill · Anjani · Eric · Afsana · Cody): *"I'll name you as the designer, as
Jill — right?"* Then Step 1. Never `prototypeScope`: the smoke test refuses it
on a handoff.

**Step 1 — the components.** Show the list you found, one line each, and ask:
*"This is what I think the feature is made of. Did I miss anything, or is one
of these not part of it?"*

**Step 2 — the states.** For each component, show the states you found with
when each appears, and ask: *"Did I miss a state? And for any where it isn't
obvious, why does that state exist?"* The why goes on the state (`why`). If
they do not know, leave `why` off rather than inventing one.

**Step 3 — the buttons.** Show every control you found and what it does. Ask:
*"Is that what each one does? Anything that is drawn but doesn't work yet?"*
Every control gets a `ctas` line, the inert ones included.

**Step 4 — the edge cases.** Ask, as questions: *"What happens when there is
no data yet? While it loads? If something fails? When the text is too long?"*
Write each as a question and its answer (`statesMatrix`). "Haven't thought
about it" becomes a Needs weigh-in item in the decisions, not a blank.

**Step 5 — the decisions.** Ask: *"What did you decide on the way here, and
why? And what is still open?"* Record the question, the decision and the
REASONING. Open ones are Needs weigh-in or Blocked. If nothing was decided,
write `decisions: { items: [] }` so the page says there are no questions rather
than that nobody asked (2026-10-22 rule).

**Step 6 — anything else.** *"Anything else engineering should know that we
haven't covered?"* That is Designer's Notes. "No" is `designerNotes: []`.

**Then, without asking:** write `src/data/handoffs/<id>.ts` from the skeleton
in that folder's README, `devStatus: 'not-ready'`, run `npx tsc -b`, lint the
file, and run `npx vitest run`. Fix anything red yourself. Then say, in plain
words, what was written and what is still thin (which sections have nothing in
them), and ask ONE yes: *"Commit and push?"* After the push, give them the
link — `https://<branch-with-dashes>--ux-design-xceldashboard.netlify.app/prototype/<id>`
— and remind them to move their To Do Board card to **Ready for Prototype and
Handoff**. The single yes is deliberate (Jillienne, 2026-10-26: "single yes is
right"): a handoff is not a Refinement row, so this does not hand off to
`share-branch`.

**Running it again on the same feature** reads the existing file, compares it
with the code, and asks only about what changed.

**Never:** write into `prototypeFeatures.ts`; set `ready-for-dev` unasked;
invent a why or a decision; use a field name in a question; ask more than one
question at a time; stop with a file that fails `tsc`.

## Where the row goes: ONE FILE PER FEATURE, in `src/data/handoffs/` (2026-10-26)

**A NEW handoff is `src/data/handoffs/<id>.ts`** — `export default` one
`PrototypeFeature` with `category: 'dev-handoff'`, and **the file name IS the
id.** `handoffFeatures.ts` globs the folder and `prototypeFeatures.ts` spreads
it into `PROTOTYPE_FEATURES`, so nothing downstream knows the difference.
[src/data/handoffs/README.md](../../../src/data/handoffs/README.md) carries the
skeleton; copy it rather than an Atlas Home row.

⚠ **NEVER write a handoff row into `prototypeFeatures.ts`.** That file is on the
protected list — the hook refuses it on a design branch and
`FrameworkProtection.test.ts` reds the suite if it is edited by hand — and
until today that is exactly where this skill wrote, which made it a routine a
designer could start and not finish. The folder is deliberately unprotected;
that is the whole reason it exists. The four Atlas Home rows of 2026-10-19
predate it and stay where they are; **extending one of those** means moving it
first: cut the row into `handoffs/<its id>.ts`, drop its line from the smoke
test's `EXPECTED_PLACEMENT`, then extend it there.

Three things the folder enforces at load, so a wrong file fails the suite with
the file named rather than vanishing from the board:

- the file name and the `id` match;
- `category` is `'dev-handoff'`;
- **`import type` only from `../prototypeFeatures`** — the glob is eager, so the
  handoff module runs BEFORE `prototypeFeatures.ts` finishes, and a value import
  (`PROTOTYPE_BASE`, say) is a ReferenceError on first load that no editor
  warns about. Write the route string out instead.

**The row is the designer's, and so is its status.** It starts at
`devStatus: 'not-ready'` (the fail-closed default below) and the designer moves
it from there as the work moves. When the file is pushed the designer moves
their To Do Board card to **Ready for Prototype and
Handoff**, whose cards are Jillienne's by the server's rule — that is how she
learns there is a page to read. `HandoffFolder.test.ts` pins all of this.

## The three fixed gateway tabs

⚠ **THE TABS ARE GONE (2026-10-21, "ONE PAGE per handoff").** The gateway is one
scroll with a chip strip — States · Options · CTAs · Questions · Edge cases ·
Design Spec · Designer's Notes — and the live preview is the header's button.
The data fields below are unchanged, so the rest of this section still says
where each one renders; read "tab" as "section".

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
`4 states · CTAs · Design Spec · Edge cases`. That
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

**States · Options · CTAs · Questions · Edge cases · Design Spec**

⚠ **THERE IS NO ACCEPTANCE SECTION, AND DO NOT ADD ONE BACK** (2026-10-21,
Jillienne: *"QA is not being done from our system"*). `acceptanceCriteria` held a
Definition of Done written as criteria QA would verify — and no QA process here
reads this page, so it was a promise made to nobody. Worse, it was a FOURTH place
to restate the states: *"with no resolvable access-expiry date, the Expires row
does not render at all"* was already the No end date state, already a `statesMatrix`
row, and already a line in the spec. What a build has to be correct about belongs
next to the thing it describes — in the state, the CTA or the edge case. The field
is gone from the type, the page, the Markdown export and the archived rows.

**They were sub-tabs for a few hours on 2026-08-31 and a developer reported it
was worse. They were right, and the reason is concrete:** inactive panels were
conditionally rendered, so their content was not in the DOM at all (8,906
characters with tabs vs 17,184 stacked). That breaks four things a developer
does constantly and a reviewer never does — **find-in-page** across the handoff,
**select-all-and-paste** into a ticket, **print/PDF**, and any **deep link** to a
section. The complaint that produced the tabs was real (stacked sections ran past
3,000px and buried the Design Spec) but that is a NAVIGATION problem, and
hiding content is the wrong lever for it.

**If this ever looks like it wants to be tabs again, re-read those four things
first.** The nav uses `aria-current`, not `role="tab"` — it navigates within a
document, and announcing tabs would promise a panel swap that no longer happens.

`COMPONENT_SECTIONS` order must match the render order: the scroll-spy walks that
array and takes the last heading past the line, so a mismatch highlights the
wrong chip.

**Every section is deep-linkable.** Anchors are `<componentId>--<sectionId>`, so
`…/prototype/membership-sections#membership-renewal-states--spec` opens the
components tab, opens that component, and lands on the Design Spec — from cold, not
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
the section — an un-authored Summary box is now what an undocumented
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

Required: `id` · `name` · `location` · `summary` · `variants`. (⚠ `uxLogic` and `data` stood in this line until 2026-10-26 and neither exists on the type — a file carrying them fails `tsc`.)

Optional, and worth filling — each renders as its own framed section:

| Field | What goes in it |
|---|---|
| `order` | 1-based order; drives the tab order and the numbered badge on a Decisions-tab tile |
| `tabLabel` | **≤24 chars.** Short label, kept for compact surfaces. The row list shows the full `name`, so this matters less than it did under the pill strip — still worth authoring, and it is the same budgeted-short-field pattern as `tileBlurb` vs `blurb`, deliberately not a truncation heuristic |
| `badge` | short flag, right-aligned on the row and beside the detail heading ("UPDATED", "NEW") |
| `badgeDate` | **ISO `YYYY-MM-DD`.** When that badge's change landed, rendered beside it as `UPDATED · 8/31/26`. "Updated" answers *when*, which is the only thing that makes it useful a month later. **Leave it unset rather than approximating** — a badge with no date renders the bare label, which is the designed degradation, not a gap |
| `thumbnail` | static PNG for the row, preferred over the live miniature — see *Row thumbnails* above |
| `variants` | **The one list of states**, `{ name, when, detail?, why?, action? }`. `name` is also the key the live-render registry matches on — see *Variants* below |
| `ctas` | `{ name, does }[]` — EVERY control on the component and what it does. "Course Overview — Opens the Course Overview page of the Compass application." One line per button, including the ones that are drawn and do nothing |
| `edgeCases` | `string[]` — conditions worth knowing that are not a state with a behavior. Renders with `statesMatrix` under one "Edge cases" heading |
| `designSpec` | `{ tokens, states?, responsive?, sources? }` — see *The Design Spec* below |
| `statesMatrix` | `{ question, answer }` — the edge cases, ASKED AND ANSWERED. "Q: What if there is no image? A: Shift the other parts of the component to the left." A reader arrives holding a question; a row phrased as that question either matches or does not |
| `jiraTickets` | component-scoped ticket URLs |

### Variants — ONE list, and the live render is keyed to its names

A component's variants are described in exactly one place: `variants`. Each
entry carries `when` (the condition that produces it), and optionally `detail`,
`why` (the problem that state solves) and `action` (the CTA it exposes).

⚠ **THIS WAS THREE LISTS UNTIL 2026-10-20**, and they had drifted:

- `uiUxLogic.variants` held the same states again with `why` + `action` — and
  `DevHandoffNotesBody` SUPPRESSED `variants` whenever it existed, so Course
  Progress's "bare (combined panel)" entry and every `when` trigger it carried
  rendered nowhere on the page.
- The preview galleries carried a third set of hand-written captions. The
  Readiness gallery was showing the four current bands while the notes still
  described the five levels those bands replaced four days earlier. Nothing
  failed.

So: per-state rationale goes on the variant.

⚠ **`uiUxLogic` AND `uxLogic` ARE BOTH GONE (2026-10-21).** `uiUxLogic` held
four things and every one had a better home: `why` → the Summary, `edgeCases` →
the Edge cases section (where a SECOND list under the same name already sat),
`actions` → the CTAs, and `toasterLogic` → dropped, because all nine components
said "None."

`uxLogic` was briefly promoted into a "Rules" section and removed the same day.
What decides which state renders is the Flows diagram's job, the states carry
their own behavior, and what each button does is `ctas` — so Rules was a bucket
for whatever had not found its section yet. One page, each section answering one
question.

⚠ **AND THERE IS NO LIVE PREVIEW SECTION.** The header already carries an "Open
live preview" button; the whole route embedded inside the document as well was
the same page twice on one screen.

**The live render is keyed by `name`.** `atlasHandoffPreviewsRegistry.ts` maps
`componentId → { [variantName]: () => ReactNode }`, and the Variants section
renders each one beside its prose. Rename a variant without renaming the key
and `DevHandoffVariants.test.ts` fails, naming both. A variant with no
registered render shows an honest "no isolated render" note rather than a gap —
not every state is reachable through a component's own props.

### What is NOT on the page any more

The handoff lost seven sections on 2026-10-21, and each went for the same
reason — it was restating something the page already said:

| Gone | Why, and where it went |
|---|---|
| **Summary** (`quickSummary`) | "This is the summary. Adjust the font size to match the body font size… and then lets REMOVE the summary section. It's just repeating itself." The FEATURE's `blurb` in the header says it one scroll higher. The detail now opens on **States** |
| **Rules** (`uxLogic`) | Flows decides which state renders, the states carry their own behavior, CTAs say what each button does |
| **Notes** (`data`, `stubs`, `a11y`) | "Remove the notes section." The dump at the bottom nobody scrolled to; what mattered in it is in Edge cases and Questions |
| **Live Preview** | The header already has an "Open live preview" button |
| **Flows** | "I think we can add those flow details into the states details." Every rule in a flow was either a restatement of one state's own `when`, or something a state could say better: a MOVE belongs in the originating state's `action` ("\"Not Yet\" → No date yet"), and an ORDER belongs in the `when` of the state the order protects ("⚠ THE EXAM IS CHECKED FIRST") |
| **User story** (`userStory`) | "Remove user story from all of the dev handoff notes. Anything that needs to be said is in the summary or the attached jira ticket." Ten components, ten "Not authored yet" boxes |
| **Acceptance** (`acceptanceCriteria`) | "QA is not being done from our system." A Definition of Done written for a QA process that does not read this page — and a fourth restatement of the states beside it. What a build must be correct about now lives in the state, the CTA or the edge case it belongs to |

⚠ **Do not re-add them by authoring the fields.** The fields are gone from
`DevHandoffComponent` too, so a handoff written against an older version of this
skill will not compile — which is the intent.

**"Decisions" is now "Questions"** ("change to Questions. Here and everywhere
else"). Almost every row in it carries "Needs weigh-in", so a heading promising
settled calls was describing an open list. The id and the data field stay
`decisions`; only the label changed.

### Every CTA gets a line

⚠ **RULE (2026-10-21, Jillienne: "for every CTA there should be a line item
explaining what it does, so Course Overview: Opens the Course Overview page of
the Compass application").** `ctas` lists every control on the component — one
line each, naming it the way it is labelled on screen and saying where it goes.

```
✓ { name: 'Course Overview',
    does: 'Opens the Course Overview page of the Compass application for the
           active course. Omitted entirely when no handler is supplied, rather
           than rendering disabled.' }
```

**Include the dead ones, and say they are dead.** "Drawn, not wired — it does
nothing today" is the single most useful line a handoff can carry, and it is
the one a reader cannot get from the screenshot. Half the controls on these
components are in that state.

⚠ **BUT NOT DEMO AFFORDANCES.** Clicking the course head's cover swaps the
header layout; that is a review device for comparing two treatments, not a
control the product has. It was listed as a CTA for about an hour and came
straight back out (same day). If a control exists only so the team can look at
something, it is not part of the handoff — note it in the Edge cases if a
developer would otherwise trip over it, and leave it out of the CTA list.

A state's `action` is a different field and still earns its place: it says what
the learner does IN that state. `ctas` says what each control IS, once.

### The header: thumbnail left, actions top right

The feature header is three parts in one row — the preview thumbnail at the
left edge (the LANDING PAGE's size, `THUMB_W`/`THUMB_H` from `GeneratedThumb`),
the eyebrow, title, blurb and brand chips beside it, and the page's two actions
pinned right: **Open live preview** and **Actions**.

⚠ Changed 2026-10-21. The thumb used to sit on the RIGHT at its own 360x244,
with the two buttons tucked underneath it — which put the page's primary actions
two-thirds of the way down a picture, in the one place nobody looks. The thumb
identifies the page now; the offer is a button with words on it.

### "Why it exists" is a REASON, never a citation

⚠ **RULE (2026-10-21, Jillienne: "explanations should never be as stupid as b/c
jill made a decisions on this day").** A variant's `why` answers *what problem
this state solves for the learner*. It is not the changelog.

```
✗ why: 'Jillienne, 2026-10-19: "when at 100%, this messaging should change
        to Congrats!", then 2026-10-21: "change the Eyebrow to this message."'

✓ why: 'The eyebrow is the card’s status line, and a finished course still
        labelled "Current course" is the status being wrong.'
```

Both sentences are true. Only one of them tells a developer anything they can
build against, or lets a reader disagree with the design on its merits. "Because
someone asked on a Tuesday" is unfalsifiable — it ends the conversation instead
of explaining it.

**Where provenance DOES belong:**

- **Code comments.** `AtlasHomeEricE2E.tsx` is full of "(2026-10-14, Eric's
  request; 32 first, then 24)" and that is correct — a maintainer staring at an
  odd number needs to know it was chosen, not computed.
- **The decisions log**, which exists to record decisions: its `owner` field is
  literally "who to go and ask". Even there the `decision` text has to say WHAT
  was decided and why it holds — naming the person is sourcing, not reasoning.

`WhyIsAReason.test.ts` fails on a `why` that names a person or carries a date,
so this cannot come back quietly.

## The Design Spec

Four fields, and each has a rule that has been learned the hard way.

**`tokens` reference NAMED tokens only** — `--color-primary-700`, never
`#0b2a4a`, never a font family. You do not need to look the values up: the page
RESOLVES every token you name, live, with `getComputedStyle` on a scope carrying
the component's own `data-atlas-*` attributes, and renders the literal beside a
swatch. That is why the spec cannot disagree with the render above it — and why
a hand-typed hex is worse than useless, since it is the one value nothing checks.
When a colour choice was a contrast decision, say so with the ratio (e.g.
*"`tertiary-700` — the lightest cyan clearing AA at 12px; 600 is 4.12:1, 700 is
6.53:1"*), so nobody "brightens" it later.

⚠ **If a token resolves to the wrong value, the SCOPE is wrong, not the spec.**
The Atlas palette needs all four compound attributes on one element
(`atlasSurfaceAttrs`), and a page-level re-point needs `ATLAS_SURFACE_VARS` too —
the eyebrow read `#5b5560` against a render drawing `#404040` for exactly that
reason, which is the failure this section was rebuilt to make impossible.

**`responsive` renders as "Layout", and it is TWO THINGS ONLY** (2026-10-21,
Jillienne: *"we don't need to talk too much about the layout except that it
should be responsive and that the padding/margins are what px"*): how the
component behaves as the width changes, and the padding and margin figures.
Measure them off the running page. It had grown into three paragraphs of
archaeology about a figure that had been wrong for weeks — the cover was
documented at 130px while the page drew 256 — and an explanation of a past error
belongs in a commit message, not in the thing a developer builds from.

**`states` renders as "Interaction"** — hover, focus, pressed, disabled.

**`sources` is ALWAYS THE FINAL PROTOTYPE** (2026-10-21, Jillienne: *"sources of
truth should always be the final prototype"*). Write that first, then the file
path as *where it is implemented*, which is a different claim. **Do not list
Figma node ids.** Every one of them here was hedged with *"not re-verified
against current Figma"*, which handed a developer two sources and a disclaimer
instead of an answer — and several had genuinely diverged, including a Readiness
frame still drawn against the five levels that four bands replaced on 2026-10-16.
The prototype is what `main` renders. Where anything disagrees with it, the
prototype is right.

### Carried from the Common LMS hub (2026-10-26)

Four fields this repo gained in the two-way sync — all optional, none changes a
handoff that does not use them:

| Field | What goes in it |
|---|---|
| `showPreview` (component) | **Opt-in** "UI updates" section directly under States — the live `ComponentLivePreview`. Only for components whose render is genuinely small. ⚠ **ASK the designer whether she wants the images, per feature** — never set it by judging the render yourself, and default to off when she hasn't answered: an unasked-for preview pushes the spec down the page for every developer. |
| `links` (feature) | `{ url, label? }[]` — anything the feature points at that lives elsewhere (research, decks, Figma, a build), as its own "Links:" line in the header. Runtime links persist per browser beside them. Not the Resources nav section. |
| `thumbnailFocus` (feature) | `{ x, y, w }` in the 1440px frame's own pixels — zoom the live thumbnail into one region instead of the whole page at 1/4. Ignored when `thumbnail` is set. |
| `preview` (edge-case row) | `{ src, height? }` — a picture of that state under its Q/A, from an id-addressed URL (a design board plus its isolation param), never a crop. |

The **Variants & Copy deck** (`/variants/:deckId`) is the stakeholder door for a
state machine's copy — every state with the exact strings it produces, read
from the model. Register a `VariantDeckMeta` in `src/data/variantDecks.ts` plus
a row builder in `VariantDeckPage.tsx`'s `DECK_ROWS`, and the component detail
offers the link. None is registered here yet.

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
Prototypes · Refinement · Research · Resources · PRDs · Explorations ·
Development · Done · Archive · QA Notes (ten since 2026-10-15 — Design is
retired and Explorations moved up under PRDs). The tile grid it replaced is
archived (`prototype-tile-landing`).

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

### `devStatus` — starts Not Ready; the designer moves it (2026-09-24, revised 2026-10-26)

**A NEW handoff is authored `not-ready`.** A page nobody has read must not tell
engineering to start. **After that the status is the designer's** (Jillienne,
2026-10-26: "they can change this status to anything they need to be. The only
guardrails that the designer cannot do is promote to main or promote to
prototype" — and, same day, "promote to prototype stays with the owners", so
that one is the scope owner's as `PROTOTYPE_SCOPES` already says) — set it in
the FILE when asked, which is what the team sees; the
row's kebab (below) is a per-browser override. Until 2026-10-26 this read "never author `ready-for-dev` —
that is her call, and only hers"; the default is the same, the lock is gone.

`not-ready` is a Development status: the row sits on the Development board (so
engineering can see what is coming) while saying plainly that nobody should
start. It is not the same as `blocked`, which means something external is
stopping the work, and it is the opposite of `ready-for-dev`.

The code now fails closed in the same direction, so a forgotten field cannot
misfire:

- a `dev-handoff` feature with **no** `devStatus` resolves to `not-ready`
  (`featureStatusKeyOf`), and
- `sectionOf` puts a `dev-handoff` row in **Development** even unauthored, so it
  cannot hide in Design where developers never look.

⚠ **Why this exists.** Before it, an unauthored feature fell through to the
`none` key, whose chip renders the word **"Ready"**. Forgetting to write
`devStatus` therefore told engineering to start building. That is the most
expensive direction for a default to fail in, and it is the same fail-closed
reasoning as `maturity` on the demo controls: forgetting should cost a
conversation, never a decision.

Author the field anyway — an explicit `devStatus: 'not-ready'` reads better than
a silent default — but the default is what catches the miss.

### Which section a new feature lands in

`sectionOf()` in `UxDashboardPage.tsx` is the only rule, and it reads:

1. **`devStatus` wins.** Any authored status → **Development** (since
   2026-10-15; `in-design` / `needs-discussion` used to go to Design, which is
   retired — the chip still shows the stage).
2. **Otherwise it falls back to `category`** — `prototype` / `demo` /
   `dashboard` → Prototypes, `testing` and `dev-handoff` → Development,
   `exploration` and everything else → Explorations.

**Author `devStatus` on every new feature.** Step 2 is a guess, and **the page
no longer says so**: the Design and Development sections used to render a banner
counting how many of their rows were placed by the fallback, and that banner was
removed on 2026-09-01 (`8005c5a`). Placement is silent now — a row landing in the
wrong section shows no warning anywhere on the page. The smoke test's
`EXPECTED_PLACEMENT` map is what catches it, so when a row moves, update that map
in the same commit. **Folder rows are exempt from that map** — a file in
`src/data/handoffs/` lands on Development by construction and
`HandoffFolder.test.ts` checks it instead, which is what lets a designer add a
row without editing a test.

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

## Designer's Notes — ask for them last (2026-10-26)

`devHandoff.designerNotes?: string[]` — the designer's own free-form words to
engineering, one paragraph per entry, for whatever the structured sections have
no slot for: sequencing ("ship the card before the history endpoint exists; mock
the count at 0"), a caution, a preference, a thank-you. **Blank by default**, and
the page still draws the section — "No designer's notes on this handoff yet" —
so a reader can tell "nothing to add" from "never asked" (Jillienne: "they will
be blank on default, and you can ask the designer for any additional notes when
the handoff is being created").

So: **after the components and the decisions are authored, ask once** —
*"Anything else engineering should know that the sections above have no slot
for?"* — and write what they say, in their words, as paragraphs. "No" means
`designerNotes: []`, which is the honest state, not a gap. It renders as the
LAST section of the one-page handoff in both views and goes into the Markdown
export only when there is something in it.

## Before you finish

1. **Ask which brands** the feature should be demoable in — never assume. (Moot in THIS repo: one brand, `['xcel']` — see *How to run this with a designer*.)
2. **Both `member` and `non-member`** must be reachable from the gateway, unless
   the feature isn't membership-gated (then comment why, per above).
3. **Surface the feature flags** that drive its variants, in `featureFlags` +
   `flagsNote`, so a reviewer knows which switches matter.
4. **Re-read the notes against the code you actually shipped.** Handoff prose
   describing an archived flow is worse than no prose — a dev will build it.
   When you unwire something, grep the handoff for it in the same pass. This is
   the rule most often broken by a COPY change: on 2026-08-31 a copy revision
   left `membership-renewal-states` asserting *"both halves of what expiry costs
   are stated together"* minutes after the code stopped doing it. **Every line
   here is a promise a dev will hold you to.**
5. **Check your component isn't restating a sibling's axis.** Two components on
   one feature drift toward each other: `membership-sheets` and
   `membership-renewal-states` ended up sharing six identical `statesMatrix`
   rows and four near-verbatim restatements of them before being trimmed. The
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
decisions first, then each component, in its on-screen order and under the same
headings the page uses, so the two can be read side by side.

An unauthored field is **skipped, not emitted empty**: a heading with nothing
under it reads as a gap in the work rather than a gap in the export. So a thin
handoff produces a short document, which is the honest signal.

## Removing something

Follow the Archive convention: **unwire it, keep the file(s) in the repo
unreferenced, and add a row to
[src/data/archivedItems.ts](../../../src/data/archivedItems.ts)** with where it
lived, why it went, and a `restoreNote` — so bringing it back is a re-wire, not
a rebuild. Then clean the handoff prose that described it.
