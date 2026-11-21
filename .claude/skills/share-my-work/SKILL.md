---
name: share-my-work
description: The designer's one routine — say "share my work" and it puts what you have in front of the team. Cuts a branch if you are on main (named for you, nothing to decide), runs the checks, commits with a subject it writes, pushes, and hands back ONE line — the link to paste on the Hub's Design page. Zero questions. Replaces share-branch (and promote-to-refinement before it) on 2026-11-21 for the simple Hub; both old names still work. Trigger on "share my work", "share this", "share my branch", "share it with the team", "put this up for review", "/share-my-work", "/share-branch", "/promote-to-refinement".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-11-21
status: active
---

# Routine: Share my work

**Say "share my work". It makes a branch if you need one, checks, commits,
pushes, and gives you one link to paste on Design.** That is the whole of
it. It asks you nothing.

Why nothing: the previous routine checked the branch name against a naming
rule, offered a rename, asked what kind of work it was, and offered to cut
the next chunk. The simple Hub (2026-11-21) reads branch names for nothing —
the Design page is a board of links people paste — so every one of those
questions was a decision a designer had to make in a chat window for no
reason. Jillienne: a designer "not great at using Claude" should be able to
say one sentence.

**Who:** anyone, Jillienne included. It never touches `main`.

## Steps

### 1. Where are we

```bash
git rev-parse --abbrev-ref HEAD
git config user.name
```

- **On `main`** (or detached): cut a branch, named from the designer's git
  name and today's date, and say so in one line. Do not ask.

  ```bash
  NAME=$(git config user.name | tr '[:upper:]' '[:lower:]' | awk '{print $1}')
  git switch -c "work/${NAME}/$(date +%Y-%m-%d)"
  ```

  A second share the same day on `main` gets `-2`, `-3`.
- **On a branch:** stay on it. Whatever it is called is fine.

### 2. Check it

```bash
npx tsc -b --noEmit
npx vitest run
npm run smoke          # only if public/prototypes/ changed
```

A failure stops the run. Say what failed in one line, with the output in a
code block, and stop — nothing is committed or pushed. Do not try to fix it
unasked; the designer may not have meant to share yet.

### 3. Commit

```bash
git status --porcelain
```

Nothing uncommitted is the normal case and not worth a sentence. Otherwise
stage everything and commit with a subject drafted from the diff, in the
repo's voice (`git log --oneline -10`): what changed and where someone would
see it — *"the planner's week view, with rest days"* — never "wip". Write
it; do not ask for it. The subject is said back in the last line, so a
designer who wants it different asks then.

⚠ Stray files: a designer's checkout carries screenshots and scratch files.
Sweep in what is under `src/`, `public/`, `docs/`, `netlify/` and the
project's config; leave the rest and name it in the last line if there is
any.

### 4. Push

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push -u origin "$BRANCH"
```

Netlify builds the branch from this moment.

### 5. One line, and stop

Derive the branch address the way Netlify does:

```bash
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
echo "https://${SLUG}--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1"
```

Say exactly this, nothing more:

> Pushed `<branch>` (`<short sha>`) — "<commit subject>". It builds for a
> few minutes. Paste this on the Hub's **Design** page:
> `<branch address>`

Do not poll for the build. Do not offer the next chunk. Do not open the Hub.
The designer pastes the link on Design the same way they paste a Figma
link — one way to add a link, not two.

## Guardrails

- **Zero questions.** The only time this routine stops to talk is a failed
  check. A branch name, a commit subject, a stray file: decide, do, say.
- **Never touches `main`.** The main guard (`.claude/hooks/protect-main.mjs`)
  refuses a push there for anyone but Jillienne; this routine never tries.
- **Does not add the row.** The old flow wrote a Refinement row through a
  prefilled link clicked through the site password; Jillienne, 2026-11-16:
  "just adding more confusion and chaos." Writing it directly would mean
  the routine carrying the site password. The paste is the honest cost.
- **Shipping is the other routine.** "Ship my work" is `ship`, Jillienne's.
