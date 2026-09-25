---
name: ship-to-main
description: Merge the finished branch you are on into `main` and push, so both Netlify sites rebuild. Covers the checks that must pass first, the promote-to-prototype gate when flag defaults changed, the main-is-in-a-worktree trap that makes `git switch main` fail, staging without sweeping in stray working files, and confirming the merged tree is the one that was tested. Trigger on "ship it", "ship to main", "merge to main", "push this to main", "put this live", "/ship-to-main".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-24
status: active
---

# Skill: Ship to main

The last step. The branch is finished and reviewed; this puts it on `main` and
therefore on **both** Netlify sites.

## Why this exists

The three `promote-*` skills cover *sharing* a branch (Refinement), *freezing*
one (Testing) and deciding *flag baselines* (Prototype). None of them covers the
plain act of shipping, which is the most repeated one — and it has four traps
that cost real time on 2026-09-24 alone. Each step below that starts with ⚠ is
one of them, written down because they were all hit.

## ⚠ Before anything: this is an owner action

`main` is live on two Netlify sites — the DESIGN site (designers + developers)
and the DEMO site (stakeholders). A designer's branch does not ship itself.

If `git config user.email` is not Jillienne's, **stop and say so**: the branch is
ready, and she merges it. (The framework-protection hook already blocks the file
edits; this is the same boundary one step later, and nothing enforces it but
this line.)

## Steps

### 1. Where are we, and is it current?

```bash
git rev-parse --abbrev-ref HEAD
git fetch origin --quiet
git rev-list --left-right --count origin/main...HEAD
```

- On `main` already, or detached: stop and say so.
- Output is `<behind>  <ahead>`. **Behind > 0 → rebase before anything else.**
  Testing a branch that is behind tests a tree that will never exist:

```bash
git rebase origin/main
```

⚠ **`git switch main` FAILS IN THIS REPO** and it fails *quietly* if you chain
it with `&&`:

```
fatal: 'main' is already checked out at '/Users/jill.moreno/xcel-main'
```

`main` lives in a second worktree. On 2026-09-24 a `git switch -q main && git pull`
failed at the switch, the pull never ran, and the branch created on the next line
was cut from the wrong commit — silently. **Never `git switch main` in the
primary checkout. Use the worktree** (step 6), and check `git worktree list` if
the path has moved.

### 2. Did any flag default change?

```bash
git diff origin/main...HEAD -- src/context/FeatureFlagContext.tsx
```

If `defaultEnabled` or `defaultVariant` moved, **run `promote-to-prototype`
first, on this branch, before the merge.** Merging publishes to both sites, so
the baseline has to be decided beforehand. Adding a NEW field (`maturity`,
say) is not a baseline change — only a changed default is.

### 3. Verify — all three, on this branch

```bash
npm run build                                   # ⚠ THE ACTUAL DEPLOY GATE
npx vitest run
npx eslint <the files this branch changed>
```

⚠ **`npm run build`, NOT `npx tsc -b --noEmit`.** Netlify runs
`npm run build`, which is `tsc -b && vite build` — so a type error fails the
deploy on BOTH sites. And `tsc -b` is *incremental*: it trusts its cached build
info, so a run that passed ten minutes ago can pass again while the real build
fails. `--force` defeats the cache; `npm run build` is what actually ships.

This is not hypothetical. On 2026-09-24, commit `681599d` added a test importing
a `.mjs` file with no type declarations. `vitest` passed (esbuild does not
typecheck), `eslint` passed, `tsc` was never re-run — and **both site builds
errored**. Nothing was live-broken, because Netlify keeps serving the last good
build, but nothing deployed for hours and no one was told.

⚠ **`npm run lint` IS NOT A GATE and never will be.** It reports **1883
problems on `main`** (1843 errors) as of 2026-09-24. Lint the CHANGED FILES
ONLY, and when one of them reports something, check whether `main`'s copy
reports it too before calling it yours:

```bash
git show origin/main:path/to/file.tsx > /tmp/base.tsx   # then lint /tmp/base.tsx
```

⚠ **Never read an exit code through a pipe.** `npx eslint . | tail` reports
*tail's* status, which is always 0. That is how "lint finished clean" was
reported on a run that had not.

Browser-visible change? Verify it in the Browser pane **the way a person
reaches it** — click through from the page they start on, not by loading the
final URL. Three bugs shipped on 2026-09-24 (a row that opened the wrong page,
a preview with its controls stripped, a row in the wrong section) were all
invisible to a direct URL load and obvious on the first click.

### 4. Commit — and look at what you are staging

```bash
git status --short      # ⚠ READ THIS. Then stage deliberately:
git add -- <the paths this change touches>
```

⚠ **`git add -A` sweeps whatever is sitting in the working tree.** On
2026-09-24 it pulled a personal `.docx` from the repo root into an unrelated
commit, and it reached `main` before anyone noticed. `.gitignore` now covers the
usual shapes, but the habit is the fix: name the paths, or read `git status`
first and know why every line is there.

Message style: what changed and **why**, with ⚠ on anything a reader would
otherwise undo. The repo's commit bodies carry the reasoning; keep that.

### 5. Push the branch

```bash
git push -u origin <branch>
```

The branch is pushed BEFORE the merge, so the work exists somewhere other than
one laptop if the merge goes wrong.

### 6. Merge — in the main worktree, fast-forward only

```bash
cd /Users/jill.moreno/xcel-main
git fetch origin --quiet
git status --short                       # must be clean
git merge --ff-only origin/<branch>
```

`--ff-only` on purpose: `main`'s recent history is linear, and a merge commit
here would be a new shape nobody chose. If it refuses, the branch is behind —
go back to step 1 and rebase.

### 7. Confirm the merged tree is the one you tested

```bash
git diff --stat origin/<branch> HEAD     # expect NO output
```

`xcel-main` has no `node_modules`, so the suite cannot run there. This is what
stands in for re-running it: identical tree, already-verified result. If it
prints anything, do not push — work out what merged that you did not test.

### 8. Push, and say what changed where

```bash
git push origin main
```

Then tell Jillienne, in plain language, **what each site looks like now** —
they are different audiences and the same commit can mean different things to
each:

| Site | Who | Notes |
|---|---|---|
| `ux-design-xceldashboard` | designers + developers | every control, every section |
| `ux-demo-xceldashboard` | stakeholders | gated sections absent; demo bar carries only `maturity: 'ready'` controls |

The user-testing site is **not** affected — it tracks the frozen `test/session-1`
and moves only by a deliberate force-push. Say so if a session is running.

⚠ **Then check that it actually built.** A failed build does not take the site
down — Netlify keeps serving the last good deploy — so the failure mode is a
change that silently never arrives:

```bash
netlify api listSiteDeploys --data '{"site_id":"ux-demo-xceldashboard.netlify.app"}'
```

## Guardrails

- **Owner only.** A designer's branch is ready; Jillienne ships it.
- **Never `git switch main`** — it is a worktree. Use `/Users/jill.moreno/xcel-main`.
- **Never `git add -A`** without reading `git status --short` first.
- **Flag defaults are decided before the merge**, via `promote-to-prototype`.
- **`--ff-only`.** A refusal means rebase, not `--no-ff`.
- **Tree-identical before pushing `main`.** No exceptions — it is two live sites.
- **Lint the diff, not the repo**, and never through a pipe.
- **`npm run build` is the gate**, not `tsc --noEmit` — `tsc -b` caches, and the
  deploy runs the build.
- **A failed deploy is silent.** Netlify keeps serving the last good build, so
  the site looks fine and the change simply never arrives. Check the deploy
  state after pushing `main` (step 8) rather than assuming.
- **Don't delete the branch** in the same breath. Ask; it is free to keep and
  occasionally useful to go back to.
