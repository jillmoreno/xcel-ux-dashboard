---
name: promote-to-prototype
description: At merge time, decide which of a branch's flag-driven changes become the PROTOTYPES baseline — the live XCEL product build stakeholders see. Run it ON THE PR, BEFORE MERGING. Diffs the branch against main, surfaces every flag whose committed default the branch changed (including flags gating new components), asks Jillienne per flag whether — and to which variant — it becomes the baseline, applies the FEATURE_FLAGS edits plus the CLAUDE.md note, commits, and reminds you to retire the branch's Refinement row. Never moves tiles. Formerly "promote-to-demo" — that name still works as an alias. Trigger on "promote to prototype", "promote to demo", "merge this branch", "which changes go in the prototype", "ready to merge", "include in the prototype", "/promote-to-prototype", "/promote-to-demo".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-18
status: active
---

# Skill: Promote to Prototype

The gate between a **designer's branch** and the **Prototypes** section — the
live XCEL product build at its committed flag baseline, which is what
stakeholders are sent to see on the public site.

## Vocabulary, because it moved on 2026-09-18

The XCEL UX Dashboard has two ungated sections and they are different acts:

| Section | What it is | How things get in |
|---|---|---|
| **Refinement** (section id `demo`) | The review inbox. A designer's branch, built by Netlify at its own URL, put up for the team (and, once flipped public, stakeholders) to discuss. | Added on the page — Refinement → Add link. No commit. |
| **Prototypes** | The product as it stands: `xcel-dashboard` → `/dashboard-rebrand?demo=1`, rendering the committed defaults in `FEATURE_FLAGS`. | **This skill.** A flag-baseline change on `main`. Never a new row. |

Until 2026-09-18 the product build sat in a section called Demo and this skill
was `promote-to-demo`. The logic is unchanged; the words are not. If you see
"Demo" in older commit messages or CLAUDE.md notes about the baseline, read
"Prototypes".

## Core principle — promotion is a flag-baseline change, not a tile move

Every change starts invisible to Prototypes: behind a flag whose default on
`main` is OFF (or its non-demo variant). On the designer's BRANCH that default
is typically ON — that is what makes their branch deploy show the work. To
promote, you keep that ON default when the branch merges; to decline, you set
it back to the `main` value so the feature lands in the sandbox (Development
section, full site only) without reaching Prototypes.

**Do NOT change a feature or dev-handoff tile's `category` to `'prototype'`.**
Prototypes holds exactly one row and `UxDashboard.smoke.test.tsx` compares the
whole section in both directions, so a second row fails a test. Feature tiles
(`kind: 'guided' | 'explore'`) and dev-handoff tiles live in the sandbox
sections permanently — that is where reviewers explore individual features and
read handoffs.

## When to run it

**On the PR, before merging.** Merging to `main` publishes to BOTH Netlify
sites, so the flag defaults have to be decided before the merge, not after.
The sequence is: designer opens PR → you run this skill on their branch →
it commits the decided defaults to the branch → you merge → both sites
rebuild → you retire the Refinement row.

## Steps

### 1. Establish the diff

```bash
git fetch origin main --quiet
git rev-parse --abbrev-ref HEAD                 # the designer's branch
git diff --stat origin/main...HEAD              # what changed
git diff origin/main...HEAD -- src/context/FeatureFlagContext.tsx
```

Read the `FeatureFlagContext.tsx` diff closely — that is where candidates are
decided. Also scan `--stat` for **new components** and grep each for the flag
key that gates it. New feature/dev-handoff tiles in `prototypeFeatures.ts` are
not promotion candidates themselves, but their `featureFlags` list is your
shortlist.

### 2. Build the candidate list

For each flag whose `defaultEnabled` / `defaultVariant` differs between the
branch and `main`, or which gates a new component, write one line: *what the
flag does*, *the `main` default*, *what the branch set it to*. Everything else
— refactors, fixes, sandbox-only tweaks, handoff docs, tile questions — is
no-promotion; note it and move on.

### 3. Ask which to include (never assume)

Present the candidates with **AskUserQuestion**, `multiSelect: true`, one
option per flag, each label naming the flag and the baseline it would set.
Selecting nothing is a valid answer (everything lands sandbox-only). For a flag
with variants, confirm WHICH variant unless the branch makes it obvious.

### 4. Apply the coordinated edits — on the branch

For each **approved** flag: leave (or set) `defaultEnabled` / `defaultVariant`
to the approved state in `FEATURE_FLAGS`.

For each **declined** flag: set it back to the `main` value. The designer
turned it on to see their work; that must not ride into `main` unreviewed.

Then update the **"Committed rebrand demo defaults"** paragraph in `CLAUDE.md`
so the documented baseline stays true, and — if the branch added a
`NAV_SECTION_FLAGS` entry or changed one's `defaultEnabled` — check
`NavSectionFlags.test.tsx`, which asserts the whole demo rail in order and
will need the new row added deliberately.

Data-only. If a change cannot be surfaced in Prototypes without touching
component code, it is not ready; say so and stop.

### 5. Verify, then commit — to the branch

```bash
npx tsc -b --noEmit && npm run lint && npx vitest run
```

All three must pass. Commit the promotion as its own step so it is reviewable
and reversible:

```bash
git add src/context/FeatureFlagContext.tsx CLAUDE.md src/test/NavSectionFlags.test.tsx
git commit -m "prototype: promote <flags> to the Prototypes baseline"
git push
```

Then tell Jillienne the branch is ready to merge, and summarise: which flag
defaults now ship in Prototypes, and what stayed sandbox-only.

### 6. After the merge — retire the Refinement row

The branch's Refinement row points at a branch URL that will go stale once the branch
is deleted, and the work it showed is now in Prototypes (or the sandbox). Remind
Jillienne, in one line, to open Refinement on the full site and either **remove** the
row or **edit** it to point at the merged surface if discussion continues. The
skill cannot do this — Refinement is authored on the page, not in code.

## Guardrails

- **Never move tiles.** Promotion is a flag-baseline change, not a `category`
  edit. Prototypes has one row and a two-directional test.
- **Ask, don't guess.** No flag default changes without an explicit yes; confirm
  variants.
- **Declined means reverted.** A branch that set a default ON for review must
  have it set back before merge, or merging promotes by accident.
- **Data-only.** `FEATURE_FLAGS`, the CLAUDE.md note, and the rail test if the
  rail changed — nothing else.
- **On the branch, before the merge.** Never on `main` after: `main` is live on
  two sites.
- **Retire the Refinement row.** Say it every time.
