---
name: release
description: Jillienne's step, and only hers — merge `stage` into `main` and push, so the Hub rebuilds and the Prototypes rows under Main show what the owners shared to stage. Covers the checks that must pass first, the undecided-group gate, stamping the Prototypes rows' Updated tags, the main-is-in-a-worktree trap that makes `git switch main` fail, fast-forward only, confirming the merged tree is the one that was tested, and bringing stage level with main afterwards. Renamed from `ship-to-main` on 2026-11-01 when `stage` arrived; that name still works. Trigger on "release", "release stage", "release to main", "ship it", "ship to main", "merge to main", "put this live", "/release", "/ship-to-main".
version: 2.0.0
author: UX Design — Colibri
last_updated: 2026-11-01
status: active
---

# Skill: Release

The last step. What the owners have shared to **stage** becomes **main** — the
released product, the build every Prototypes row opens under Main, the thing
stakeholders are sent to see.

## What changed on 2026-11-01, and why the name did

This was `ship-to-main`, and it merged a *designer's branch* into main. From
2026-11-01 designers do not hand Jillienne a branch; they `/share-to-stage`,
and `stage` is what she merges. The act is the same — one person, one
fast-forward, both audiences — but its input is now a branch everyone can
already open, and its name is the word a stakeholder would use for it.

**Releases are all-at-once** (Jillienne's call): `stage` → `main` is one
merge and whatever is on stage goes. That is safe because each surface has one
owner and `share-to-stage` refuses a branch that crosses into another owner's
files, so stage only ever holds decided work in separate lanes. If you want to
release ONE surface and hold another back, that is not a flag on this skill —
it is a conversation with the owner whose work waits, and `git revert` of
their merge on stage before you release. Do it rarely; it defeats the point.

## ⚠ Before anything: this is Jillienne's action

`main` is live on the Hub — the one Netlify site since 2026-10-15, for
designers, developers and stakeholders alike. **Enforced twice:**
`.claude/hooks/protect-main.mjs` refuses the push, the merge and the switch
onto main for anyone else before they run, and GitHub's branch protection on
`main` (pull request + code-owner review required, admins exempt, with
`.github/CODEOWNERS` naming her) refuses a designer's push to main whatever
sent it. She is exempt from both.

If `git config user.email` is not Jillienne's, **stop and say so**: stage is
ready, and she releases it.

## Steps

### 1. What is on stage, and is main where stage thinks it is?

```bash
git fetch origin --quiet
git rev-list --left-right --count origin/main...origin/stage
git log --oneline origin/main..origin/stage
```

Output is `<main-ahead> <stage-ahead>`.

- `0 0` — nothing to release. Say so and stop.
- `0 N` — the normal case: stage is N commits ahead, main has not moved. Go on.
- `M N`, M > 0 — **main moved without stage** (a hotfix pushed straight to
  main, or a release that did not do step 7). Stage has to take main first,
  and that merge is done ON A STAGE CHECKOUT, not on main:

```bash
git worktree add /tmp/xcel-stage origin/stage --detach
cd /tmp/xcel-stage && git merge origin/main      # resolve, if anything
git push origin HEAD:stage && cd - && git worktree remove /tmp/xcel-stage
```

Then start again from the top; `0 N` now.

The log is the release note. Read it: every merge from a `feat/…` branch, and
the promotion commit under each. **A promotion commit that names a group as
*waiting on its owner*, or a changed default with no promotion commit at all,
is NOT READY** — `share-to-stage` should have refused it; if one got through,
hand it back to the owner and do not release until it is decided. This skill
is the merge, and the merge is the one thing on the list that is Jillienne's
alone.

### 2. Did the default dashboard version change?

```bash
git diff origin/main...origin/stage -- src/data/dashboardVersions.ts
```

That lever is Jillienne's alone. If stage changed it and she did not decide
it, decide it now — on a stage checkout as in step 1 — before going on.

### 3. Stamp the Prototypes rows the release changes

Every row on the Prototypes section carries `lastUpdated` — the time its
surface last changed on `main` — shown as the "Updated" tag under Main. A
client cannot know that at run time and a Netlify build cannot compute it, so
THIS step keeps it true:

```bash
git diff --name-only origin/main...origin/stage -- src public | sort
```

Map the changed paths to scopes with the rule in `decide-defaults` ("How
a candidate gets its scope"): Compass paths → `xcel-compass`; the Atlas home
and learning pages → `xcel-atlas-learning`; the invite pages → `xcel-invite`;
anything under the product app → `xcel-dashboard` as well, since the
end-to-end row shows all of it. Set each affected row's `lastUpdated` in
`prototypeFeatures.ts` to now, in UTC — **on stage**, via the worktree in
step 1, so main and stage stay identical after the release:

```bash
date -u +%Y-%m-%dT%H:%M:%SZ
```

Commit it to stage and push. A release that changes only the gateway, docs or
tests stamps nothing.

### 4. Verify — all three, on the tree you are about to release

In a checkout that HAS `node_modules` (the primary checkout, on a branch at
`origin/stage`, or the worktree after `npm ci`):

```bash
git switch -c release/$(date +%Y-%m-%d) origin/stage
npm run build                                   # ⚠ THE ACTUAL DEPLOY GATE
npx vitest run
npm run smoke                                   # if public/prototypes/ changed
npx eslint <the files stage changed>
```

⚠ **`npm run build`, NOT `npx tsc -b --noEmit`.** Netlify runs
`npm run build`, which is `tsc -b && vite build` — a type error fails the
deploy. `tsc -b` is incremental and trusts its cache; `--force` defeats it,
`npm run build` is what ships. (2026-09-24: `681599d` passed vitest and eslint,
tsc was never re-run, both sites failed to build for hours.)

⚠ **`npm run lint` IS NOT A GATE** — 1,800-odd problems on main. Lint the
changed files only, and check main's copy before calling a report yours.
Never read an exit code through a pipe.

Browser-visible change? Open the **stage build** in the Browser pane — it is
already up — and click through from the page a person starts on, not the
final URL. That is the whole point of stage: the release is of something
already seen.

### 5. Merge — in the main worktree, fast-forward only

⚠ **`git switch main` FAILS IN THIS REPO**, quietly if chained with `&&`:
`main` lives in a second worktree. Use it:

```bash
cd /Users/jill.moreno/xcel-main
git fetch origin --quiet
git status --short                       # must be clean
git merge --ff-only origin/stage
```

`--ff-only` on purpose: main's history is linear, and a merge commit here
would be a new shape nobody chose. If it refuses, main moved — step 1.

### 6. Confirm the merged tree is the one you tested

```bash
git diff --stat origin/stage HEAD        # expect NO output
```

`xcel-main` has no `node_modules`, so the suite cannot run there. Identical
tree, already-verified result. If it prints anything, do not push.

### 7. Push main, and leave stage level with it

```bash
git push origin main
```

Stage already equals main after a fast-forward, so there is nothing to push
to stage — but **check**: `git rev-list --count origin/main...origin/stage`
must print `0`. If a hotfix ever goes straight to main, step 1 catches it the
next time; do not let it be the norm.

### 8. Say what changed where, then check that it built

Tell the team, in plain language: what each Prototypes row shows now under
Main, which owners' work it is, and that **Main and Stage are the same build
until the next share**. Ask the owners to archive their Refinement rows if
they have not, and move their On Stage cards to Ready for Prototype and
Handoff (or off the board).

⚠ **A failed deploy is silent** — Netlify keeps serving the last good build.
Check:

```bash
netlify api listSiteDeploys --data '{"site_id":"ux-design-xceldashboard.netlify.app"}'
```

The user-testing site is **not** affected — it tracks the frozen test branch
and moves only by a deliberate force-push. Say so if a session is running.

## Guardrails

- **Jillienne only.** Owners share to stage; she releases.
- **Stage is the only input.** Never merge a `feat/…` branch into main
  directly — that was `ship-to-main`, and it is gone because it skipped the
  one build everyone can see first.
- **Never `git switch main`** — it is a worktree. Use `/Users/jill.moreno/xcel-main`.
- **Never `git add -A`** without reading `git status --short` first.
- **An undecided group does not release.** Hand it back.
- **`--ff-only`.** A refusal means stage takes main first (step 1), never `--no-ff`.
- **Tree-identical before pushing main.** No exceptions.
- **`npm run build` is the gate**, not `tsc --noEmit`.
- **Stage equals main after a release.** Check it; a drift is the next
  release's conflict.
- **A failed deploy is silent.** Check the deploy state after pushing main.
- **Don't delete the owners' branches** in the same breath. Ask; they are
  free to keep.

## The other two

`share-branch` puts a chunk on Refinement; `share-to-stage` puts a decided
chunk on Stage; this puts Stage on Main. Three shares, one lock.
