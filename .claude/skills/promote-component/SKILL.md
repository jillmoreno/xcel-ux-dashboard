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

⚠ **A NEW COMPONENT AND A CHANGED ONE ARE NOT THE SAME JOB.**

- **New widget** → the flag wraps it. Clean, do it.
- **Changed existing component** → the flag has to branch *inside* the component
  between the old rendering and the new one. That can be genuinely invasive, and
  on a component someone else is also editing it is a bad trade. **Say so and
  offer `promote-to-refinement` (the whole-branch link) instead.** Do not perform
  surgery on a component to satisfy this skill.

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
- **A flag, or an honest no.** Offer to create one; never create it silently,
  never do surgery on an existing component to manufacture one.
- **New flags are born `wip`.** No `maturity` field. Stakeholders cannot see it.
- **Variants are chosen, not dumped.** Six frames nobody asked about is worse
  than two that are the question.
- **The designer clicks Add.**
- **Say what is pinned** in the note, every time.
