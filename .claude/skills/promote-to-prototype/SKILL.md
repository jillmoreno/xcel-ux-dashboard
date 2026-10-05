---
name: promote-to-prototype
description: At merge time, decide which of a branch's changes become the PROTOTYPES baseline — the live XCEL product build stakeholders see. Run it ON THE PR, BEFORE MERGING. Diffs the branch against main, surfaces every flag whose committed default the branch changed (including flags gating new components) AND any change to the default DASHBOARD VERSION, asks Jillienne per candidate whether — and to which variant — it becomes the baseline, applies the FEATURE_FLAGS / dashboardVersions edits plus the docs note, commits, and reminds you to retire the branch's Refinement row. Setting the default dashboard version is OWNER-ONLY. Never moves tiles. Formerly "promote-to-demo" — that name still works as an alias. Trigger on "promote to prototype", "promote to demo", "merge this branch", "which changes go in the prototype", "ready to merge", "include in the prototype", "/promote-to-prototype", "/promote-to-demo".
version: 1.1.0
author: UX Design — Colibri
last_updated: 2026-10-05
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

## ⚠ There is only ever ONE prototype, and that is the point

Prototypes answers one question — *what is the product right now?* — for
developers and stakeholders. A second row destroys the answer, because everyone
then has to ask which one is real.

So **"I need more than one prototype" is always a Refinement job.** Refinement
takes any number of rows, is authored in the browser with no code or deploy, and
is visible to stakeholders too (it carries no `gate`). A row there can pin a
configuration of `main` (`?demo=1&ff=…`), point at a branch build, or open a
`/review` page of one component's variants.

There is deliberately no "create a second prototype" skill. If someone asks for
one, this is the answer. See CLAUDE.md, "Prototypes is the source of truth".

## ⚠ The baseline has TWO levers, and only one of them is a flag

Added 2026-10-05, after a promotion where the skill surfaced none of this and
the version change was caught by hand.

| Lever | Lives in | What it decides |
|---|---|---|
| **Flag defaults** | `FEATURE_FLAGS` in `src/context/FeatureFlagContext.tsx` | how a surface is drawn |
| **The default dashboard VERSION** | `defaultDiscoverabilityVersionFor()` in `src/data/dashboardVersions.ts` | **which dashboard renders at all** |

The version is the bigger of the two and it is **not in the flag catalog**, so
the first place anyone looks for "what does Prototypes render" does not contain
the answer. Every flag below it is read INSIDE whichever version is rendering —
several have no effect at all under the others.

**Two different acts get called "promoting a version". Separate them before
asking anything:**

- **Making a version REACHABLE** — a new entry in
  `DISCOVERABILITY_DASHBOARD_VERSIONS`, usually carrying `owner` so it appears
  in that designer's tab of the Feature Flag panel. This is **not a promotion**.
  It changes nothing about Prototypes and rides in on the merge like any other
  code. Do not ask about it.
- **Making a version THE DEFAULT** — `defaultDiscoverabilityVersionFor` returns
  it. That IS the baseline, and it is this skill's business.

⚠ **ONLY ONE VERSION CAN BE THE DEFAULT, so promoting one DISPLACES another.**
Say that out loud at the point of asking, naming the version being displaced.
The designer tabs let two designers each own versions; Prototypes still has
exactly one answer, and an ask phrased as "add Eric's" when it means "replace
Jill's" is how that gets decided by accident.

### ⚠ Owner action — the default version is Jillienne's alone

`git config user.email` must be Jillienne's to change
`defaultDiscoverabilityVersionFor`. If it is not, **stop at that candidate and
say so**: the rest of the promotion (flag defaults) can proceed, the version
line cannot. Note it in the hand-off so she can make that one call herself.

This is a skill-level boundary, not a hook: `dashboardVersions.ts` is
deliberately NOT in CLAUDE.md's protected table, because adding a version — the
reachable act above — is something any designer should be able to do. It is the
one line that chooses between them that is hers.

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
git diff origin/main...HEAD -- src/data/dashboardVersions.ts
```

⚠ **BOTH FILES, and the second one is the one this skill used to miss.** On
2026-10-02 a promotion moved XCEL's default from Testing to Testing 3 and this
step surfaced nothing — the change was spotted by reading the file by hand. A
diff that touches only the flag catalog will silently promote (or silently
decline) a whole dashboard.

In the `dashboardVersions.ts` diff, look for exactly one thing:
**`defaultDiscoverabilityVersionFor` returning a different id.** New entries in
`DISCOVERABILITY_DASHBOARD_VERSIONS` are NOT candidates — see the two acts
above.

Read the `FeatureFlagContext.tsx` diff closely — that is where the rest of the
candidates are decided. Also scan `--stat` for **new components** and grep each for the flag
key that gates it. New feature/dev-handoff tiles in `prototypeFeatures.ts` are
not promotion candidates themselves, but their `featureFlags` list is your
shortlist.

### 2. Build the candidate list

For each flag whose `defaultEnabled` / `defaultVariant` differs between the
branch and `main`, or which gates a new component, write one line: *what the
flag does*, *the `main` default*, *what the branch set it to*. Everything else
— refactors, fixes, sandbox-only tweaks, handoff docs, tile questions — is
no-promotion; note it and move on.

**If the default VERSION moved, it is the first candidate on the list**, and
write it differently from the flags: name the version arriving, the version
being **displaced**, and which of the flag candidates below it have no effect
under any other version. That last part is what makes the list readable — a
reviewer deciding four Testing 3 flags needs to know they stand or fall with
the version above them.

### 3. Ask which to include (never assume)

Present the candidates with **AskUserQuestion**, `multiSelect: true`, one
option per flag, each label naming the flag and the baseline it would set.
Selecting nothing is a valid answer (everything lands sandbox-only). For a flag
with variants, confirm WHICH variant unless the branch makes it obvious.

**The version gets its OWN question, not a row in the multiSelect**, because it
is not the same kind of choice: it displaces something, the flags do not. Phrase
it as the swap it is — *"Prototypes renders X today; make it Y?"* — and if the
caller is not Jillienne, do not ask it at all: say the version line is hers,
promote the flags, and hand the one decision back.

### 4. Apply the coordinated edits — on the branch

For each **approved** flag: leave (or set) `defaultEnabled` / `defaultVariant`
to the approved state in `FEATURE_FLAGS`.

For each **declined** flag: set it back to the `main` value. The designer
turned it on to see their work; that must not ride into `main` unreviewed.

**If the version was approved** (owner only): leave
`defaultDiscoverabilityVersionFor` returning the branch's id. **If it was
declined**, set it back to `main`'s — a branch that made its own version the
default must have that reverted, or merging promotes a whole dashboard by
accident. This is the same rule as a declined flag and it is easier to miss,
because nothing in the flag catalog shows it.

Then update the **COMMITTED REBRAND DEMO DEFAULTS** table — it lives in
[`docs/product-app.md`](../../docs/product-app.md), not in CLAUDE.md, which this
skill said until 2026-10-05. Two things there, not one:

- the table's own rows, for each promoted or declined flag;
- the paragraph ABOVE it that names which version a fresh `?demo=1` lands on.
  ⚠ That note has now been wrong twice in the same way — it still said "Testing"
  after the default had moved to Testing 3. It is the line readers trust most
  and the one nothing tests.

And — if the branch added a `NAV_SECTION_FLAGS` entry or changed one's
`defaultEnabled` — check `NavSectionFlags.test.tsx`, which asserts the whole
demo rail in order and will need the new row added deliberately.

⚠ **SET `owner` ON ANYTHING NEW** (2026-10-05, with the designer tabs). A flag
or version with no `owner` resolves to Jill, so a row authored by someone else
lands in HER tab of the Feature Flag panel and is invisible in theirs. It is not
a promotion decision — it is whose exploration the row belongs to — but this is
the moment it gets noticed, because nothing on screen says a row is in the
wrong tab.

⚠ **TESTS THAT PIN A BRANCH DEFAULT WILL FAIL, AND THAT IS THE POINT.** This
repo writes them on purpose, with a note saying this skill might flip them one
day. Flip them deliberately, record the decision in the test's own comment, and
keep driving the arm that lost — a declined arm is not a retired one.

Data-only. If a change cannot be surfaced in Prototypes without touching
component code, it is not ready; say so and stop.

### 5. Verify, then commit — to the branch

```bash
npm run build        # NOT `tsc --noEmit` — see ship-to-main for why
npx vitest run
```

⚠ **`npm run lint` IS NOT A GATE** and this step used to say it was. It reports
over a thousand pre-existing problems on `main`; a promotion that waited for it
to pass would never ship. Lint the files you touched and compare any finding
against `main`'s copy of the same file before calling it yours.

Commit the promotion as its own step so it is reviewable and reversible:

```bash
git add src/context/FeatureFlagContext.tsx src/data/dashboardVersions.ts \
        docs/product-app.md src/test/NavSectionFlags.test.tsx
git commit -m "prototype: promote <what> to the Prototypes baseline"
git push
```

The commit body is where the ARGUMENT goes — for each declined candidate, what
was actually wrong with it. "Not promoted" is worthless in six months; the
reason is what tells the next reader whether it still holds.

Then tell Jillienne the branch is ready to merge, and summarise: which flag
defaults now ship in Prototypes, and what stayed sandbox-only.

### 6. After the merge — retire the Refinement row

The branch's Refinement row points at a branch URL that will go stale once the
branch is deleted, and the work it showed is now in Prototypes (or the sandbox).

**Run `retire-from-refinement`.** It is the skill for exactly this step: it reads
the row, asks whether the branch (and therefore the build) is kept or deleted,
writes the Archive row from what the reviewer wrote, and then removes the row —
in that order, so a crash between the two cannot lose the record.

If discussion is still live, leave the row and **edit** it to point at the merged
surface instead. Retiring it is for when the conversation is over.

## Guardrails

- **Never move tiles.** Promotion is a flag-baseline change, not a `category`
  edit. Prototypes has one row and a two-directional test.
- **Diff `dashboardVersions.ts` too.** The default version is the biggest lever
  on the baseline and is not in the flag catalog.
- **The default version is Jillienne's alone.** Anyone may ADD a version;
  only she chooses which one Prototypes renders. Stop at that candidate and
  hand it back.
- **Promoting a version displaces one.** Name the one being replaced when you
  ask, or the decision gets made by accident.
- **Ask, don't guess.** No flag default changes without an explicit yes; confirm
  variants.
- **Declined means reverted.** A branch that set a default ON for review must
  have it set back before merge, or merging promotes by accident.
- **Data-only.** `FEATURE_FLAGS`, `dashboardVersions.ts`, the `docs/product-app.md` note, and the rail test if the
  rail changed — nothing else.
- **On the branch, before the merge.** Never on `main` after: `main` is live on
  two sites.
- **Retire the Refinement row.** Say it every time.

## The other half

`promote-to-refinement` is the skill that PUT the row on Refinement in the
first place — from the designer's branch, opening the full site's Add form
prefilled with the branch URL. This skill takes it off. Run that one on the
branch when the work is ready to show; run this one on the PR when it is ready
to ship.
