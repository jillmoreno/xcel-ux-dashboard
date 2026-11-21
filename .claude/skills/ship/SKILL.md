---
name: ship
description: Jillienne's routine, and only hers — put a branch on `main`, so the main site rebuilds and the product at /dashboard-rebrand is the demo link. Takes the branch you are on, a branch by name, or a Design-page link. Reviews the flag defaults the branch would change on main — grouped by the component they gate, calling out any component with MORE THAN ONE flag — asks yes or no per flag, then asks per decided flag whether to RETIRE it (the winning path becomes the code, the losing file stays with an Archive row), runs the build and the tests, merges fast-forward into main, pushes, and says what changed. Replaces release (ship-to-main before it) on 2026-11-21 for the simple Hub: no stage, no owners, no Prototypes rows. Trigger on "ship my work", "ship this", "ship Anjani's planner", "ship <branch or link>", "put this live", "merge to main", "/ship", "/release", "/ship-to-main".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-11-21
status: active
---

# Routine: Ship

**Say "ship my work", or "ship" and a branch or a Design link. It reviews the
flags, checks, merges into `main`, pushes.** The main site rebuilds and the
product at `/dashboard-rebrand?demo=1` is the result. That address is the
demo link; it holds exactly what has been shipped.

## Before anything: this is Jillienne's step

`main` is locked on GitHub — a pull request needs her review and a direct
push from anyone else is refused, whatever sent it. In Claude the main guard
(`.claude/hooks/protect-main.mjs`) says so in plain words. So:

```bash
git config user.email
```

Anyone else: stop, say it is Jillienne's step, and point them at "share my
work". Do not try to work around the guard.

## What "ship" takes

| Said | Branch |
|---|---|
| "ship my work" | the branch you are on |
| "ship `feat/x`" | that branch |
| "ship Anjani's planner" / a pasted Design link | the branch in the link's address — `<slug>--ux-design-xceldashboard.netlify.app` — matched against `git branch -r` (the slug is the branch name lower-cased with non-alphanumerics as `-`). If the words do not name one branch, list the candidates and ask which. |

```bash
git fetch origin --quiet
git switch "$BRANCH"            # someone else's: git switch -t origin/$BRANCH
git rebase origin/main          # conflicts are resolved HERE, in her checkout
```

A conflict stops the run: say which files, and stop. The merge below is
fast-forward only, so the rebase is what makes it possible.

## 1. The flag review

The product's flag catalog decides what the demo link shows. A designer's
branch turns its flag on so their build shows their work; shipping the branch
would turn it on for everyone. Find every default the branch changes:

```bash
git diff origin/main...HEAD -- src/context/FeatureFlagContext.tsx
git diff origin/main...HEAD -- src/data/dashboardVersions.ts
git diff --stat origin/main...HEAD
```

⚠ Both files. The second is the default DASHBOARD VERSION, and a diff that
touches only the catalog silently ships a whole dashboard (2026-10-02).

For each flag whose `defaultEnabled` / `defaultVariant` differs from main,
or which gates a NEW component (grep the new files in `--stat` for the flag
key), write one line: what it gates · main's default · the branch's. Then
**group the lines by the component they gate** — the file or tile that
reads the key — and head each group with the component's name.

**Call out every component with more than one flag**, first, in its own
short list: *"Study pace tile — 3 flags: `pace-tile-v2` (on), `pace-layout`
(stacked), `pace-copy` (short)."* Jillienne, 2026-11-21: "specifically call
out the items that have more than 1 flag." A component carrying several
flags is usually a decision that has been made and not cleaned up, and the
cleanup question below is where it is asked.

Flags marked `surface: 'design'` are design-bar controls, not defaults —
list them separately, ask nothing about them.

### Ask, per flag, whether it ships

One **AskUserQuestion**, `multiSelect: true`, one option per flag, each
label naming the flag and the default it would set on main. Selecting none
is an answer. A variant flag: name the variant. The default dashboard
version, if it moved, gets its own yes/no question — it displaces a version,
which is a different kind of choice.

### Ask, per decided flag, whether to retire it

Jillienne, 2026-11-21: "ask to remove flags that have been decided on …
help them clean up their flags." A flag is **decided** when the branch has
settled it — on with no variants and the off path no longer wanted, or one
variant chosen for good. For each one, **one question**, in the words a
reviewer uses:

> *"Pace tile v2 is on and the old tile is not coming back. Retire the flag
> — v2 becomes the tile, the old file is kept with an Archive row?"*
> **Retire it · Keep the flag for now**

Components with more than one flag are asked first, and asked as the group:
*"Three flags on the pace tile, all decided — retire all three?"* with
*Retire all · Retire some (say which) · Keep them* as the options.

### Retiring a flag — the archive convention, not a delete

For each flag to retire, on the branch:

1. **Call sites** take the winning path. `grep -rn "<key>"` across `src/`;
   every `useFeatureFlag` / `isEnabled` / variant switch on the key collapses
   to the chosen branch. The losing sibling (`StudyPaceTile.tsx` beside
   `StudyPaceTileV2.tsx`) is **unwired, not deleted** — the file stays.
2. **The catalog**: the flag leaves `FEATURE_FLAGS` in
   `FeatureFlagContext.tsx` and `REBRAND_FLAGS` in `FeatureFlagPanel.tsx`.
   Any `featureFlags: [...]` list on a handoff row drops it.
3. **An Archive row** in `src/data/archivedItems.ts` for the losing path,
   with a `restoreNote` naming the file, the call sites and the flag key, so
   bringing it back is a re-wire. `.claude/skills/archive-a-feature` is the
   full form of this step; follow its restoreNote rules.
4. **Personas and tests** that set the key: a persona pinning the losing
   variant is updated; a test asserting the flag exists is updated or
   removed, and `ArchiveConvention.test.ts` must still pass.

Then commit on the branch: *"retire <key> — <winning path> is the <thing>"*.

### Apply the defaults

For each flag that ships and is not retired: set `defaultEnabled` /
`defaultVariant` on the branch. For each that does not ship: set the main
default back on the branch, so the merge does not carry it. Commit.

## 2. Verify, on the tree you are about to merge

```bash
npm run build                 # ⚠ THE DEPLOY GATE — tsc -b && vite build, what Netlify runs
npx vitest run
npm run smoke                 # if public/prototypes/ changed
npx eslint <the files the branch changed>
```

`npm run lint` is not a gate (hundreds of problems on main); lint the
changed files. A failure stops the run.

## 3. Merge, fast-forward only, and push

```bash
git switch main
git pull --ff-only origin main
git merge --ff-only "$BRANCH"
git push origin main
git switch "$BRANCH"
```

`--ff-only` on purpose: main's history is linear, and the rebase above is
what makes it possible. If it refuses, main moved since the fetch — rebase
again.

## 4. Say what changed, then check that it built

Three lines: the branch and short SHA now on main, what the demo link shows
differently, and which flags shipped or were retired. Then:

```bash
netlify api listSiteDeploys --data '{"site_id":"ux-design-xceldashboard.netlify.app"}' | head -40
```

⚠ A failed deploy is silent — Netlify keeps serving the last good build. Say
whether the latest deploy for `main` is `ready`, or that it could not be read.

The designer's row on Design is theirs; suggest archiving it only if asked.

## Guardrails

- **Jillienne only.** The guard refuses everyone else; this routine never
  argues with it.
- **All or nothing per branch.** Half of someone's branch is their split to
  make, not this routine's to pick through.
- **The flag question is the only question that decides what ships.** Ask it
  per flag, never "ship Eric's version", which means two different things.
- **Retiring is unwiring.** A file leaves the build, never the repo, and the
  Archive row is what makes it a re-wire later.
- **No stage, no Prototypes rows, no owners' sign-off.** Those were the
  advanced Hub, kept whole on the `hub-advanced` branch.
