---
name: archive-a-feature
description: Retire something without deleting it — unwire the feature, variant or component, keep the file in the repo, and write the ARCHIVED_ITEMS row that makes bringing it back a re-wire rather than a rebuild. Covers what "unwire" actually means (flag catalog, call sites, personas, tests), how to write a restoreNote that survives six months, and the two things that are always forgotten: what was deliberately NOT restored, and which test has to change back. Trigger on "archive this", "retire this variant", "pull this out", "we're not using this any more", "unwire this feature", "/archive-a-feature".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-28
status: active
---

# Skill: Archive a feature

Retiring something in this repo is **unwire, keep, record** — never delete. The
convention is in CLAUDE.md; this is how to execute it so that restoring is a
re-wire and not an archaeology project.

## ⚠ Owner action

`src/data/archivedItems.ts` is a protected file. If `git config user.email` is
not Jillienne's, **stop and say so** — the work can be identified and described,
but the row is hers to land.

## Why not just delete it

Git has the code, so deletion looks safe. It is not, and the failure is
specific: six months later someone asks "didn't we try that?", and the answer
lives in a commit nobody can name, attached to a file path that has since moved.
The Archive section exists so that question has an address.

A row is worth writing when the thing **was reachable and had an opinion** — a
variant, a persona, a treatment, a whole page. Not for a refactor, a renamed
constant, or dead code nobody shipped.

## Steps

### 1. Establish what is actually wired

Find every place that reaches it, not just the obvious one. A variant typically
lives in FOUR places and three of them are easy to miss:

```bash
grep -rn "<the id / flag key / component name>" src/ --include=*.ts --include=*.tsx
```

Look specifically for:

- the **flag catalog** entry in `src/context/FeatureFlagContext.tsx`
- the **call site(s)** that render it
- a **persona / demo control** entry (`src/components/prototype/demoControlsUtil.ts`)
- **fixtures** that still resolve it (`src/data/dashboardProgressFixtures.ts` and friends)
- **tests** that pin its presence

### 2. Unwire — and decide how far to go

⚠ **UNWIRING IS NOT ALL-OR-NOTHING, AND THE ROW HAS TO SAY WHICH.** The best
row in the file (`progress-off-track`) records that the FIXTURES were left fully
intact while only the catalog entry and the persona were pulled — so a stored
flag value still resolves today. That is a legitimate choice and a completely
different restore job from a full unwire. Someone reading in six months cannot
tell the two apart from the code.

So: pull the entry points, **keep the file**, and write down exactly what state
you left it in.

⚠ **THE CATALOG ENTRY IS THE ONE THAT BITES.** A variant removed from the flag
catalog but still present in every fixture is not an error — it type-checks, it
passes tests, and it silently falls back to the default. That exact thing has
happened here. If you leave fixtures wired, say so loudly.

### 3. Fix the tests, and note what you changed

A test pinning the thing's presence will now fail. **Inverting it is usually
right** — pin the new behaviour instead — but write down that you did, because
restoring means inverting it back and nobody will guess that from the diff.

### 4. Write the row

```ts
{
  id: 'kebab-case-id',
  name: 'What it was called',
  what: 'One line: what it was and what it did.',
  location: 'Where the code still lives — and WHAT STATE it is in.',
  flag: 'the flag or route that governed it, if any',
  dateRemoved: 'YYYY-MM-DD',
  reason: 'Why it was pulled. The argument, not the verdict.',
  restoreNote: '…',
}
```

**`reason` is the argument, not the verdict.** "Redundant" is worthless in six
months. "Off Track existed to reach the pace model's `state: 'no'`, and when the
day counts were re-authored At Risk reaches the same branch on its own" survives,
because it tells the next person whether the reasoning still holds.

### 5. The restoreNote — the field this skill mostly exists for

CLAUDE.md says it plainly: **this is the field most often written too thinly.**
The ten rows already in the file are the standard; match them. They run 620–1400
characters, and a good one carries four things:

1. **The edits, numbered, with file paths** — and where in the file. Several
   rows note that a comment marks the spot; leave one when you unwire.
2. **⚠ The trap.** The edit that looks optional and is not, or the way a partial
   restore fails silently. If there isn't one, don't invent one — but look, because
   there usually is.
3. **What is deliberately NOT restored, and why.** Eight of ten rows say this.
   It is the difference between "you're done" and "you're done, probably".
4. **Which test has to change back.** Half the rows name one.

⚠ **NO FALSE PRECISION.** If you did not check whether something still resolves,
say you did not. A restoreNote that confidently describes a state nobody verified
is worse than a short one, because it will be trusted.

### 6. Verify and ship

```bash
npm run build && npx vitest run
```

The unwired file is now unreferenced, so nothing should fail except the tests you
deliberately changed. Then `ship-to-main`.

## Guardrails

- **Unwire, keep, record.** Never `git rm` the file.
- **Owner only** — `archivedItems.ts` is protected.
- **Say what state you left the code in**, not just that you removed something.
- **Name the trap**, the non-restored parts, and the test.
- **`reason` is the argument**, so a reader can tell whether it still holds.
- **Don't archive a refactor.** Rows are for things that were reachable and had
  an opinion.
- **A fork ends here.** When `promote-to-prototype` picks a winner between two
  sibling variants, the loser is archived — that is the ending
  `promote-component` promises when it tells a designer to fork a component.
