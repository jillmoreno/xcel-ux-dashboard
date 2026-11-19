---
name: share-branch
description: One command for the whole of "put my work in front of the team" — check it, commit it, push it, and tell the designer where it now shows on the Hub. Since 2026-11-16 the Hub's DESIGN section lists every pushed branch on its own, grouped by the feature the branch name says it is for, so this skill opens no form and hands over no link to click — it names the branch right, pushes, and stops. Renamed promote-to-refinement → share on 2026-10-15, then share → share-branch on 2026-10-16 (both old names still work). Also notices when the branch has grown long and offers to close this chunk and cut the next one. Trigger on "share this", "share my branch", "share it with the team", "put this up for review", "add this to refinement", "promote to refinement", "/share-branch", "/promote-to-refinement".
version: 3.0.0
author: UX Design — Colibri
last_updated: 2026-11-16
status: active
---

# Skill: Share a branch

**Say `/share-branch`. It checks, commits, pushes, and tells you where to
look.** That is the whole of it since 2026-11-16, because the Hub's **Design**
section is derived from the branch list: a branch that is pushed IS a row,
under the feature its name says it is for, saying *Building…* until Netlify
finishes and then opening the build. There is no form to fill, no link to
click through the site password, no card to file. Jillienne, 2026-11-16, on
the links this skill used to hand over: *"they are just adding more confusion
and chaos."*

What is left for the skill is the one thing that makes the row read well —
**the branch name** — and the three things a designer should not have to
type: the checks, the commit, the push.

## What a branch name says (the only authoring there is)

```
feat/<scope>-<feature words>[--<variant>]

feat/compass-study-planner          Compass · "Study planner"
feat/compass-study-planner--dense   the same feature, a variant — groups with it
feat/atlas-home-course-card         Atlas Learning · "Home course card"
feat/invite-checkout-summary        Invite & purchase · "Checkout summary"
```

The first word is the **scope** — `compass`, `atlas`, `invite` (or
`checkout`), `admin` — and it is also whose surface it is. The rest, up to
`--`, is the **feature**; two branches with the same feature words sit in one
group, so *"push it to a feature that exists"* is reusing the words and *"a
new feature"* is new words. `--` marks a variant of the same feature. The
contract is `src/data/branchName.ts`; a branch that ignores it still lists,
under "Other branches", with its name as its title.

## The one confirmation

> Checks, commit "<drafted subject>", push to `feat/x`. Go?

One yes covers the three. A push is a deploy, so there is still a yes and it
still names the branch. **Stop and say so** if the checks fail, the branch is
`main` or `stage`, or HEAD is detached. Never answer on the designer's behalf.

## Steps

### 1. Where are we, and is the name right?

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git rev-list --count origin/main..HEAD           # commits on this branch
git log origin/main..HEAD --format=%ci | tail -1 # when the first of them landed
```

- On `main` or `stage`: stop. Those are the product's builds, not a
  designer's.
- Detached HEAD: stop and say so.

**Read the name against the shape above.** If it has no scope word
(`feat/streak`, `my-branch`), say in one line what it will look like on the
Hub — *"this will list under Other branches as 'Streak'"* — and offer the
rename, once:

> Rename it `feat/compass-streak` so it lands under Compass? (`git branch -m`,
> and I'll push the new name.)

Either answer is fine. A branch already pushed under the old name leaves a
stale row until Netlify's deploy window rolls past it; say so if they rename.

**A long branch gets one sentence here, and this is the only moment anyone
will listen.** More than about 10 commits or older than about a week:

> `feat/x` is 14 commits over 9 days. Share it as one piece, or shall I help
> split the last chunk onto `feat/x--<variant>`?

Do not ask again in the same run.

### 2. Check it

```bash
npx tsc -b --noEmit
npx vitest run
npm run smoke          # only if public/prototypes/ changed
```

A failure stops the run and is reported with the output; nothing is committed
or pushed. *Skip the checks* is honoured, with one line saying so.

### 3. Commit what is uncommitted

```bash
git status --porcelain
```

Draft the subject from what changed, in the repo's voice (`git log --oneline
-10` for the house style). **Show it before committing**, and stage
deliberately — designers' worktrees carry stray files, so say what is being
swept in. Nothing uncommitted is the normal case and not worth a sentence.

The commit subject is what the Design row shows as its description, so a
subject that says the effect — *"the planner's week view, with the rest
days"* — is doing the note's job. Say so if the draft is a bare "wip".

### 4. Push

```bash
git push -u origin "$BRANCH"
```

Netlify starts building on the push, and the Hub's Design section lists the
branch from that moment, saying *Building…*.

### 5. Say where it is — and stop

Derive the slug the way Netlify does and give the two addresses:

```bash
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
echo "https://ux-design-xceldashboard.netlify.app/?section=design"
echo "https://${SLUG}--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1"
```

In three lines, no more:

> Pushed. It's on the Hub under **Design → <Feature>** — *Building…* for a
> few minutes, then the row opens the build. Direct link once built:
> `<branch url>`.
>
> Want to leave a note saying where to look? Open the row's ⋯ → **Discuss in
> Refinement** on the Hub — the form opens filled in.

Do not poll for the build. The row says when it is done, and a designer
watching a terminal count to five minutes was the old flow's worst minute.

### 6. Offer the next chunk

> That's shared. Want me to cut `feat/<scope>-<thing>` from main for the next
> piece?

A yes is `git fetch origin && git switch -c feat/<thing> origin/main` (`main`
is usually checked out in another worktree, so branch from `origin/main`
rather than switching). Ask once.

## Guardrails

- **Never on `main` or `stage`.**
- **One yes covers checks, commit and push** — and it has to be an actual yes.
- **No links to click, no forms to open, no cards to file.** The row exists
  because the branch does. If the designer asks for "the Refinement link",
  point at the row's kebab on the Hub instead and say why.
- **Never POST to `/api/demos` or `/api/todo-board`.** Nothing here writes to
  the Hub at all now.
- **Nudge once, then drop it** — the name, the length, the next chunk.

## The other half

`/share-to-stage` is the next step for a surface's owner: when the branch IS
the surface, it merges to `stage`, and the Design row's tag changes from *In
design* to *On stage* on its own. Jillienne's `/release` puts stage on main,
and the tag becomes *Released* the same way. `retire-from-refinement` is the
way out for a branch that is not going anywhere — it records why before the
branch goes.
