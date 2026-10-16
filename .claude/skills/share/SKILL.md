---
name: share
description: One command for the whole of "put my work in front of the team" — check it, commit it, push it, wait for Netlify, open Refinement's Add form filled in, grouped under the feature it is a chunk of, and file the card in the To Do Board's Ready For Refinement column. Renamed from promote-to-refinement on 2026-10-15 (that name still works). Also notices when the branch has grown long and offers to close this chunk and cut the next one. Trigger on "share this", "share my branch", "share it with the team", "put this up for review", "add this to refinement", "promote to refinement", "/share", "/promote-to-refinement".
version: 2.1.0
author: UX Design — Colibri
last_updated: 2026-10-15
status: active
---

# Skill: Share

**Say `/share`. That is the whole of step 4, 5 and 6 of the Contributing
guide.** Checks, commit, push, wait for the build, and Refinement's Add form
opens with every field filled in — then the To Do Board's card sheet, filled
in, in **Ready For Refinement**. The designer looks and clicks **Add link**,
then **Add card**. Those two clicks are the only things this skill does not
do, on purpose.

Renamed from `promote-to-refinement` on 2026-10-15 — Jillienne: *"can we make
promote to refinement an easier command, like share"*. The old name still
reaches this skill (`.claude/skills/promote-to-refinement/SKILL.md` is a
pointer at this file), so the guide, the old habits and anyone's muscle memory
all still work.

## Config — set once per repo

```yaml
full_site: "https://ux-design-xceldashboard.netlify.app"  # the Hub
branch_host: "ux-design-xceldashboard.netlify.app"        # branch builds live under this host
review_path: "/dashboard-rebrand?demo=1"                  # what a product branch is reviewed at
```

**`branch_host` is the Hub** — the one site since 2026-10-15, when the public
site (`ux-demo-xceldashboard`) was retired. Branch builds are full builds; the
prototype bar's home icon is dropped on them, so someone who arrives through a
Refinement row is not one click from the project list.

## The one confirmation

The old skill asked per step: a yes to push, a mention of uncommitted work, a
yes to open. **This asks once**, up front, and then runs the lot:

> Checks, commit "<drafted subject>", push to `feat/x`, wait for the build,
> open the form. Go?

That is the friction this rename is about. The guardrail it replaces — *never
push without a yes, a push is a deploy* — is intact: there is still a yes, and
it still names the branch being deployed. What is gone is being asked four
times for one intention.

**Stop and say so, rather than pressing on**, if the checks fail, the branch is
`main`, or HEAD is detached. Never answer the confirmation on the designer's
behalf.

## Steps

### 1. Where are we, and how big has this got?

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
git rev-list --count origin/main..HEAD           # commits on this branch
git log origin/main..HEAD --format=%ci | tail -1 # when the first of them landed
```

- On `main`: stop. Refinement is for branches; `main` IS Prototypes.
- Detached HEAD: stop and say so.

**This is the moment to say something about a long branch, and it is the only
moment anyone will listen.** The designer is here because they are finishing
something. If the branch is **more than about 10 commits** or **older than
about a week**, say so in one line and offer the alternative — do not lecture,
and do not refuse to share it:

> `feat/x` is 14 commits over 9 days. Want to share it as one chunk, or shall I
> help you split the last piece out onto a fresh branch?

Both answers are fine. The point is that the question gets asked where the work
is, not in a guide nobody re-reads. **If they want to carry on, carry on** —
and do not ask again later in the same run.

Derive the Netlify **branch slug** the way Netlify does — lowercase, every run
of characters that is not `a–z0–9` becomes one `-`, leading/trailing `-`
trimmed:

```bash
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
echo "https://${SLUG}--ux-design-xceldashboard.netlify.app"
```

### 2. Check it

```bash
npx tsc -b --noEmit
npx vitest run
npm run smoke          # only if public/prototypes/ changed
```

Guide step 4, folded in — this is most of why `/share` exists. **A failure
stops the run** and is reported with the output; nothing is committed or
pushed. The designer can say *skip the checks* and that is honoured, with one
line saying what was skipped so it is on the record.

Run `npm run smoke` only when `git status --porcelain public/prototypes/` or
the branch diff touches that folder — `npm test` does not include it, and it is
674 assertions nobody needs on a React-only change.

### 3. Commit what is uncommitted

```bash
git status --porcelain
```

Draft the subject from what actually changed, in the repo's voice (lowercase
type prefix, a sentence that says the effect — read `git log --oneline -10` for
the house style). **Show it before committing.** Stage deliberately:
`git add -A` is wrong here often enough to matter, because designers'
worktrees carry stray files — check what is being swept in and say so.

Nothing uncommitted is the normal case and is not worth a sentence.

### 4. Push

```bash
git push -u origin "$BRANCH"
```

Covered by the one confirmation in step 0. Netlify starts building on the push.

### 5. What is being shared?

```bash
git diff --name-only origin/main...HEAD -- public/demos/ | grep '\.html$'
```

- **Files listed** → offer each as `https://<slug>--<branch_host>/demos/<file>`.
  If there is exactly one, default to it.
- **None** → default to the product: `https://<slug>--<branch_host><review_path>`.
- Ask ONE question with **AskUserQuestion** only if there is a real choice
  (several demo files, or demo files AND product changes under `src/`).

### 6. Which product?

Refinement rows carry `product: xcel | compass | both`, and the Prototypes
section has a row per surface — so the tag is not just a filter, it says which
Prototypes row this work is heading for. Read it off the branch rather than
asking:

```bash
git diff --name-only origin/main...HEAD -- src | grep -Ei 'components/compass/|components/learning/Compass|compass' | wc -l
git diff --name-only origin/main...HEAD -- src | grep -Eiv 'components/compass/|components/learning/Compass|compass' | wc -l
```

| Compass files | Other `src` files | `product` |
|---|---|---|
| some | none | `compass` |
| some | some | `both` |
| none | any | `xcel` |
| none | none (a `public/demos/` file) | ask, defaulting to `xcel` |

**Anjani's branches are Compass.** She owns what that surface should be (see
`PROTOTYPE_SCOPES` in `prototypeFeatures.ts`), and a row tagged `compass` is
what `promote-to-prototype` later reads as a Compass-row decision of hers. If
the heuristic says otherwise for a branch of hers, say so and let her pick.

### 7. Which FEATURE is this a chunk of? (2026-10-15)

Refinement groups by `feature`, so a string of small branches reads as one
piece of work with a history instead of a pile of rows. **Ask for it — one
short phrase** — and suggest one from the branch name and the commit subjects:

> What is this a chunk of? (I'd guess **Study streak card**, from the branch
> name.)

| Situation | What to do |
|---|---|
| They give a feature | Pass it as `feature`. If an earlier chunk of it is already on the board, the form prefills **Replaces** with their newest one — say that is what will happen, and that the first option on that control is *these sit side by side*. |
| They say it is the first chunk | Pass the feature anyway. A group of one costs nothing and the next chunk lands in it. |
| They do not want one | Pass nothing. The row is ungrouped and renders exactly as rows did before this existed. |

**The skill cannot read the board** — the Hub is behind a site password, and
that password stands in front of `/api/demos` too. So it cannot tell whether
this branch already has a row, and it must not guess. Ask:

> Does this branch already have a Refinement row? If so I'll say what to edit
> rather than opening a second Add.

### 8. Draft the row

| Field | Draft |
|---|---|
| **Title** | A short description of the work + the branch name, e.g. `Study streak card — feat/study-streak-card`. Take the description from `git log origin/main..HEAD --format=%s`; if the commits do not say, ask. |
| **Note** | Where to look and what question is being asked. Ask for one sentence if the commits do not make it obvious: *"Home, under Current Progress. Is the streak motivating or nagging?"* |
| **Product** | From step 6. |
| **Feature** | From step 7. |
| **Added by** | Not needed — the form prefills it from the browser's last author. |

Show the draft (URL · Title · Note · Feature) and let the designer edit before
opening.

### 9. Has the branch built yet?

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$URL"
```

Netlify answers **200** (built, no password) or **401** (built, behind the site
password) once the deploy is live, and **404** while there is no deploy for
that branch yet. Poll every 20 seconds for up to five minutes on a 404, saying
so; after that, continue anyway with a note that the link will start working
when the build finishes.

### 10. Open the prefilled form

```bash
node -e '
const [site,url,title,note,product,feature]=process.argv.slice(1);
const q=new URLSearchParams({section:"demo",add:"1",url,title,note,product,feature});
console.log(`${site}/?${q}`)' "$FULL_SITE" "$URL" "$TITLE" "$NOTE" "$PRODUCT" "$FEATURE"
```

The page reads all six (`UxDashboardPage`, the `demoPrefill` note) and the form
opens with the product segment selected and the feature filled in.

**Give the designer that address as a clickable link** — in the Claude desktop
app the sandbox cannot open their browser, so the link IS the hand-off. (In a
terminal session `open "<address>"` is fine too.) Then say, in two lines:
*click the link — the form opens on the Hub with the fields filled; check the
note and click **Add link**. Everyone with the Hub link sees the row the moment
it is added.*

### 11. File the card on the To Do Board (2026-10-15)

Sharing a branch and saying on the board that somebody has to look at it are
one intention, so they are one command. **Ready For Refinement** is the
column; the row above is the thing to look at and the card is who is waiting
on it.

```bash
OWNER=$(git config user.name | awk '{print $1}')
node -e '
const [site,title,note,url,owner]=process.argv.slice(1);
const q=new URLSearchParams({section:"todo-board",add:"1",column:"refine",title,note:`${note} ${url}`.trim(),owner});
console.log(`${site}/?${q}`)' "$FULL_SITE" "$TITLE" "$NOTE" "$URL" "$OWNER"
```

Give this as a **second clickable link, after the first**, and say which is
which in one line: *the first adds the Refinement row, the second files the
card.* Both open the Hub; neither saves anything until its button is clicked.

Three things this step gets right by not trying:

- **The card has no URL field** — it is a card, not a link — so the review
  address rides in the note. The Refinement row is where the link lives.
- **`owner` is a request.** The board stores an owner's NAME and the roster is
  the only authority on the spelling, so the page resolves it (`resolveOwner`
  in `todoBoardStore.ts`): a name nobody on the roster answers to opens
  **Unassigned**, with the picker right there on the sheet. `git config
  user.name` is whatever that machine was set up with, which is exactly why
  the skill does not get the last word on it.
- **The skill cannot read the board**, the same password that stops it reading
  Refinement. So it cannot tell whether this branch already has a card. If the
  designer said in step 7 that a row already exists, ask the same question
  about the card rather than opening a duplicate:

  > Want a card on the board too, or is there one already?

### 12. Offer the next chunk

**Do not end on a full stop.** The habit this board is built around is *finish
a chunk, start the next*, and the end of one is the only natural moment to
start the other:

> That's shared. Want me to cut `feat/<next-thing>` from main for the next
> piece?

A yes is `git switch main && git pull --ff-only && git switch -c feat/<thing>`
— and if `main` is checked out in another worktree (it usually is, see
`ship-to-main`), branch from `origin/main` instead of switching:
`git fetch origin && git switch -c feat/<thing> origin/main`.

A no is a perfectly good answer. Ask once.

## Guardrails

- **Never on `main`.** Refinement is for work in review; `main` is the product.
- **One yes covers checks, commit and push** — and it has to be an actual yes.
- **Never POST to `/api/demos` or `/api/todo-board` from the skill.** The
  click is the gate for both: the form's validation and the endpoint's run on
  it, and the site password sits in front of the endpoints anyway.
- **One row per branch, and one card.** If the designer says either already
  exists, do not open a second Add — they can **Edit** the row, or the card
  from its kebab, on the page.
- **Nudge once, then drop it.** A long branch gets one sentence in step 1. A
  skill that argues is a skill people route around.

## The other half

`promote-to-prototype` runs on the PR before merge and ends by retiring the
row. `retire-from-refinement` is the way out when the work did not ship.
Between them the loop is: this skill puts the work on the table; those take it
off once it is in Prototypes, or once it is not going there.
