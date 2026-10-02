---
name: promote-component
description: Put ONE component of your branch in front of the team — not the whole branch. Identifies the component (usually one you selected in the browser), finds the feature flag that drives it, builds a stacked /review link showing every variant side by side on your branch build, and opens Refinement's Add form prefilled. Requires the component to be behind a feature flag, and offers to create one when it is not. Trigger on "share this component", "promote this widget", "get feedback on this card", "put just this in refinement", "/promote-component".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-25
status: active
---

# Skill: Promote a component to Refinement

`promote-to-refinement` shares your WHOLE BRANCH. On a walkthrough branch that
is the problem: the reviewer opens it, sees six changes at once, and cannot tell
which one they were asked about. This shares ONE component, with every variant
stacked on a single page.

## What it produces

A Refinement row pointing at `/review` **on your branch build** — the component's
states one under another, labelled, each frame pinned with `?ff=`:

```
https://<branch>--ux-design-xceldashboard.netlify.app/review
  ?title=Study Pace Card
  &at=/dashboard-rebrand?version=discoverability-testing
  &note=the eyebrow sub-line is the part I want opinions on
  &v=Not started::dashboard-progress-state:not-started
  &v=On track::dashboard-progress-state:progress-on-track
```

`/review` takes its whole definition from the URL — no per-component code, and
nothing to add to `prototypeFeatures.ts`, which is a protected file you could not
edit anyway.

## ⚠ The component must be behind a feature flag

This is the whole mechanism: `?ff=` is what pins one state per frame. No flag
means no variants to show and nothing to isolate — the review link would be the
same page six times.

It is also what CLAUDE.md already asks for ("behind a feature flag whose default
is ON on your branch"), and it is what gives the merge a decision point:
`promote-to-prototype` asks "should this default stay on when it ships?", and
with no flag there is nothing to ask. **An unflagged change merges
unconditionally.** Sharing is simply the moment that cost becomes visible.

### When there is no flag

**Stop and offer to create one. Never create one silently, and never guess.**

Show the designer, before touching anything:

- the **key** (kebab-case, stable forever — `localStorage` references it),
- the **label** and one-line **description** as they will read in the panel,
- which **`page`** it belongs to,
- `defaultEnabled: true` — ON for their branch, which is what makes it visible,
- and **the one change to their component**, quoted.

Then wait for a yes.

⚠ **NO `maturity` FIELD ON A NEW FLAG.** Absent means `wip`, so it cannot reach
the demo site. A designer creating a flag must not be able to put half-built work
in front of stakeholders by accident. Promoting it later is Jillienne's call.

### Where the flag goes — three cases, and the middle one is the useful one

**1. A new widget.** The flag wraps it at its call site. Clean; do it.

**2. A small, contained change to an existing component** — one block, one
value, one row. A single conditional inside the component is fine. Do not fork a
400-line file to change a font.

**3. A structural change to an existing component** — the layout differs, or the
change lands in several places at once. **Fork it as a sibling variant**, which
is this repo's existing pattern, not a new idea:

```
StudyPaceTile.tsx      ← untouched
StudyPaceTileV2.tsx    ← the designer's version, their own file
```

…and the flag chooses between them at the **call site**, never inside either
one. `CourseContentV2.tsx` is the worked example: Option 2's whole course page,
a sibling of Option 1's, selected by `dashboard-navigation`.

**Why a fork beats surgery here.** The original file is never touched, so a
designer cannot conflict with whoever else is editing it; the flag lives in one
place instead of scattered through a render; and the two arms can be read side
by side, which is what the review page is for. Scattering conditionals through a
shared component is the thing to refuse — not branching as such.

⚠ **FORK THE PRESENTATION, SHARE THE DATA.** `CompassContents` is shared between
both course arms on purpose, and the note there says why: *"both arms must list
the same 42 in the same order, or the A/B is comparing two syllabuses rather
than two navigations."* Copy the layout; import the content. A fork that
duplicates the data is no longer a comparison of the thing being reviewed.

⚠ **A FORK HAS TO END.** Two copies of a component drift — a fix lands in one
and not the other — so say at the point of forking how it finishes:
`promote-to-prototype` picks the winner at merge, and the loser is unwired and
archived per CLAUDE.md's archive convention (keep the file, add an
`ARCHIVED_ITEMS` row with a real `restoreNote`). A fork nobody resolves is two
components forever, and that cost lands on whoever touches it next.

**4. When even a fork is wrong** — the change is spread across surfaces, or it
is a token/global change with no single call site — say so and offer
`promote-to-refinement` (the whole-branch link) instead. Not everything is one
component, and pretending otherwise produces a worse review, not a better one.

`src/context/FeatureFlagContext.tsx` is deliberately NOT protected — flags are
the designer's own lever. Adding one is their edit to make.

## Steps

### 1. Identify the component

Usually the designer selected it in the browser, so you have the React component
name, its file path and its props. Otherwise ask which one.

⚠ **The selection gives you the COMPONENT, never the FLAG.** Find the flag by
reading the component and its call site; if two flags plausibly drive it, or
none does, **ask** rather than pick.

### 2. Find the flag and its variants

```bash
grep -n "useFeatureFlags\|flags\[" <component file>
```

Then read that flag in `FEATURE_FLAGS` for its `variants`. Those are the states
to show. If there is no flag, go to **When there is no flag** above.

### 3. Choose which variants are worth reviewing

Not always all of them. A flag with six arms where three are being asked about
makes a better review page than one with six frames of noise. Propose a set,
name what each shows, and let the designer cut it.

Labels are what a reviewer reads — `Not started`, not `not-started`.

### 4. Confirm the branch is pushed and built

Same as `promote-to-refinement`: derive the Netlify branch slug (lowercase,
every run of non-`a–z0–9` becomes one `-`, trimmed), confirm the branch is
pushed, and that the build is up. A review link to an unbuilt branch is a 404
with the designer's name on it.

### 5. Build the link and open the Add form

`at` is the route the component lives on, including any `?version=`. Then open
Refinement's Add form prefilled, exactly as `promote-to-refinement` does:

```
<full_site>/?section=demo&add=1&url=<review url>&title=<title>&note=<note>
```

⚠ **The designer clicks Add. Never POST for them** — both sites sit behind a
site password and the form's validation is the point. Same reasoning as
`promote-to-refinement`; see that skill's note.

### 6. Write the note for a reviewer, not for yourself

Say what to look at and **what is pinned**. A reviewer who reports "the
navigation looks wrong" about an arm you deliberately held at a value has spent
their attention on nothing, and it reads as a bug in the work.

## Guardrails

- **One component.** If the answer is "these three together", that is
  `promote-to-refinement` — the whole branch — not three rows.
- **A flag, or an honest no.** Offer to create one; never create it silently.
- **Fork the file, don't scatter conditionals.** A structural change to an
  existing component becomes a sibling variant with the flag at the call site —
  `CourseContentV2` is the pattern. Fork the presentation, share the data.
- **Say how the fork ends** when you make it: winner at `promote-to-prototype`,
  loser archived. Two copies forever is the failure mode.
- **New flags are born `wip`.** No `maturity` field. Stakeholders cannot see it.
- **Variants are chosen, not dumped.** Six frames nobody asked about is worse
  than two that are the question.
- **The designer clicks Add.**
- **Say what is pinned** in the note, every time.
