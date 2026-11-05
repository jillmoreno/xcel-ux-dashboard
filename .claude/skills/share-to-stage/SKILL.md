---
name: share-to-stage
description: Put the branch you are on onto STAGE — the build between a Refinement link and main. For a surface you own, it records which of the branch's flag defaults become the surface's defaults (the flag questions — `decide-defaults`, formerly promote-to-prototype — run here if the branch has not answered them yet), merges today's `stage` into the branch, runs the checks, pushes, fast-forwards `stage` to the branch, waits for Netlify to build the stage address, and files the card in the To Do Board's On Stage column. Nothing reaches main — Jillienne releases stage to main with `/release`. Trigger on "share to stage", "stage this", "put this on stage", "stage my branch", "promote to stage", "/share-to-stage".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-11-01
status: active
---

# Skill: Share to stage

**Say `/share-to-stage`.** It is the step between `/share-branch` and
Jillienne's `/release`: a chunk has been discussed on Refinement, its owner has
decided it is what the surface should be, and this puts that decision somewhere
everyone can open — the **Stage** build — without touching `main`.

## Why this exists (2026-11-01)

Until now a chunk could be in two places: the designer's own branch build (a
Refinement row — "under discussion") and `main` (a Prototypes row — "released").
There was nothing between *decided* and *released*. An owner who had run
`decide-defaults` had a commit of defaults on their branch and no way to
show anybody what the surface would look like with them, until Jillienne
merged — and one merge was the only way for any work, from any owner, to
become visible as the product.

`stage` is a long-lived branch that Netlify builds like any other, at
`https://stage--ux-design-xceldashboard.netlify.app`. Owners merge into it with
this skill; Jillienne merges IT into `main` with `/release`. The Prototypes
section has a **Main · Stage** switch above its rows: the same five rows, and
the switch picks which build each opens. After a release, stage and main are
the same build until the next share.

Three decisions Jillienne made that this skill encodes:

1. **Releases are all-at-once.** `stage` → `main` is one merge; whatever is on
   stage goes. This is fine because designers stay in their lane — each owns a
   surface and does not cross into another's. It is also why step 2 is strict
   about ownership.
2. **Owners push to stage** — the owner of the scope the branch changes, or
   Jillienne (Lead Designer). Not any designer for any surface.
3. **Conflicts move here**, from Jillienne's release to the owner's share.
   Two owners touching one file collide at the stage merge, in the owner's own
   session, while the change is fresh — not weeks later in a release.

## Vocabulary

| Word | Means |
|---|---|
| **Refinement link** | the designer's branch build, one chunk under discussion — `/share-branch` |
| **Stage** | the `stage` branch's build: what owners have decided, not yet released — **this skill** |
| **Main** | the released product — `/release`, Jillienne only |
| **Promote to prototype** | the owner recording which flags are their surface's defaults, on their branch. A decision, not a release. Folded into step 3 here. |

## The one confirmation

Like `share-branch`, it asks ONCE, up front, after step 1 has said where you
are:

> You're on `feat/compass-week-view`, 3 commits ahead of stage, Compass only.
> I'll: check which flag defaults this branch changed and ask you about them,
> merge today's stage into your branch, run the type check and tests, push the
> branch, move stage to it, wait for the stage build, and open the On Stage
> card. Nothing goes to main. Go?

A **yes** covers the git operations in steps 4–6. The flag questions in step 3
are asked individually — a default is never assumed.

## Steps

### 1. Where are we?

```bash
git rev-parse --abbrev-ref HEAD
git fetch origin --quiet
git rev-list --left-right --count origin/stage...HEAD
git rev-list --left-right --count origin/main...HEAD
```

- On `main` or `stage`, or detached: stop and say so. This runs on a feature
  branch.
- Output is `<behind> <ahead>`. Behind stage is normal (step 4 handles it).
  Ahead of main by 0 means nothing to share.
- **If `origin/stage` does not exist**, say so and stop: Jillienne creates it
  once (`git branch stage origin/main && git push -u origin stage`).

### 2. Whose surface is this? — the ownership check

Work out the scopes the branch touches and who is asking, exactly as
`decide-defaults` does ("How a candidate gets its scope" and the identity
table under "Owner action"):

```bash
git diff --name-only origin/main...HEAD -- src public | sort
git config user.email; git config user.name
gh pr view --json author --jq .author.login 2>/dev/null   # if there is a PR
```

Map paths to scopes: Compass paths → `compass`; the Atlas home and learning
pages → `atlas`; the invite pages → `invite`; the admin surface → `admin`;
shared product files that every row shows → `end-to-end`. Then read
`PROTOTYPE_SCOPES` in `src/data/prototypeFeatures.ts` for each scope's
`owner`.

**The caller may share to stage when every scope the branch changes is one
they own, or the caller is Jillienne.** Otherwise:

> This branch changes Compass files, and Compass is Anjani's surface. Sharing
> to stage is the owner's step — ask Anjani to run `/share-to-stage` on this
> branch, or ask Jill.

Stop there. Do not merge a group the caller does not own; that is the lane
rule in decision 1 above, and it is what makes all-at-once releases safe.

A branch that changes only the gateway, docs, tests or skills has no scope
and no owner question — it is Jillienne's to stage, and anyone else is told
so.

### 3. Have the flag defaults been decided? — the flag questions (`decide-defaults`)

```bash
git diff origin/main...HEAD -- src/context/FeatureFlagContext.tsx src/data/dashboardVersions.ts
git log origin/main..HEAD --grep='promote' --oneline
```

If a `defaultEnabled` or `defaultVariant` moved and there is no promotion
commit covering it, **run `decide-defaults` now, on this branch**, before
anything else. It asks per flag — keep this default, or set it back to main's
value, and which variant — lists `surface: 'design'` controls separately, and
commits the answers on the branch. A designer who typed `/share-to-stage`
should only ever need to learn this one command; `decide-defaults` stays
available on its own for an owner who wants to record the decision without
staging yet.

If a promotion commit already covers every changed default, say so in one
line and move on.

⚠ **The default dashboard version is Jillienne's alone**, whatever the
scope. If `dashboardVersions.ts` changed its default and the caller is not
Jillienne, set it back to main's value on the branch (the skill above does
this) and name that line as hers.

### 4. Bring stage into the branch — conflicts are resolved HERE

```bash
git merge origin/stage
```

Merging stage INTO the branch, rather than the branch into stage, is the
whole trick: the conflicts land in the designer's own checkout, where
`node_modules` is, so the result can be checked before anything is pushed —
and `stage` itself only ever moves by fast-forward (step 6).

If it stops on a conflict: name the file, show both sides, and ask which to
keep — *mine*, *stage's*, or *both, stage's first* — exactly as the Designer
Workflow guide's Part 2 does for a rebase. Then `git add` the file and
`git commit` to finish the merge. If the designer cannot tell, `git merge
--abort` puts the branch back as it was; tell them to ask the other owner,
because a conflict on stage is two owners in one file.

A clean merge needs no commit message from the designer; the default is fine.

### 5. Check it

```bash
npm run build          # the deploy gate — tsc -b && vite build
npx vitest run
```

Red means fix before pushing. Touched `public/prototypes/`? Also `npm run
smoke`. The merge in step 4 can break something neither branch broke alone —
that is the point of running the suite AFTER it.

There is no row to stamp here: the Prototypes rows' `lastUpdated` is
maintained by `/release`, and the Hub cannot read stage from main (see
`src/data/stageBuild.ts`), so the record of *what is on stage and since when*
is the To Do Board card in step 8.

### 6. Push the branch, then move stage to it

```bash
git push origin HEAD
git push origin HEAD:stage
```

The second push is a **fast-forward by construction**: the branch now
contains `origin/stage` (step 4), so stage simply advances to the branch's
tip. If it is refused as non-fast-forward, somebody pushed to stage between
step 4 and now — `git fetch origin` and repeat from step 4. Never
`--force` on stage.

⚠ `protect-main.mjs` does not block this: `stage` is not `main`. The GitHub
rule on `main` is untouched too — this skill never names main in a push.

### 7. Wait for the stage build

Netlify builds `stage` at its own address, two to four minutes:

```
https://stage--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1
```

Poll the deploys the way `share-branch` does (its step 9), then hand back the
stage link for the surface — `&section=compass` for Compass,
`&section=dashboard` for Atlas, `/end-to-end-demo?demo=1` for the invite
flow. Say in one line that **Prototypes → Stage** on the Hub now opens this,
and Main does not until Jillienne releases.

### 8. File the card — On Stage

The To Do Board has an **On Stage** column (id `stage`), between Ready For
Refinement and Ready for Prototype and Handoff. It is the answer to "what is
waiting on a release, and since when" — the Hub's rows cannot carry a staged
date, so the card does.

If the chunk already has a card (it will, if `/share-branch` filed one), the
right move is to MOVE that card, which only the page can do: open the board
and say so. Otherwise open the add form prefilled:

```bash
OWNER=$(git config user.name | awk '{print $1}')
node -e '
const [site,title,note,url,owner,scope]=process.argv.slice(1);
const q=new URLSearchParams({section:"todo-board",add:"1",column:"stage",title,note:`${note} ${url}`.trim(),owner,scope});
console.log(`${site}/?${q}`)' "https://ux-design-xceldashboard.netlify.app" "$TITLE" "Staged $(date +%Y-%m-%d) —" "$STAGE_URL" "$OWNER" "$SCOPE"
```

### ⚠ First: does this branch actually change the surface it claims?

Before putting a scope on the card, check that the branch changed REACT under
that scope's paths — not only a document:

```bash
git diff --name-only origin/main...HEAD -- src | grep -E '<the scope.s src paths>'
git diff --name-only origin/main...HEAD -- public/prototypes
```

**If the second has changes and the first has none, STOP and say this:**

> This branch changes a Compass **document** (`public/prototypes/…`), not the
> Compass surface. The Prototypes row opens the REACT build, so Stage will
> look exactly as it does now and the row will say "Staged" over something
> unchanged. Two ways on: port the delta with `/port-prototype`, or file the
> card with NO scope so the row stays honest.

This is the failure the whole 2026-11-04 session came out of: Anjani shared a
Compass document to stage, the share succeeded, the build went up, and her
Prototypes row showed nothing. It read as a broken tool for a day. With the
scope field added that afternoon it would have been WORSE — the row would have
said "Staged · Anjani" over an unchanged Compass, which is a confident wrong
answer rather than a blank one. Hence this check, before the scope goes on.

⚠ **`scope` IS WHAT MAKES THE PROTOTYPES ROW SAY ANYTHING** (2026-11-04). It
is the scope id you decided the defaults for in step 3 — `compass`,
`atlas`, `invite`, `end-to-end`, `admin` — and without it the card still
files correctly and the row stays silent, which is exactly the failure this
field was added to fix: Anjani shared Compass to stage on 2026-11-04, the
share worked, and the Compass row looked identical because nothing on the
Hub knew the card was about Compass. Set `SCOPE` alongside `TITLE` and
`STAGE_URL`; if the branch staged more than one scope, file one card per
scope rather than one card naming two.

If the chunk already HAS a card you are moving rather than adding, the scope
has to be set on it as well — the move is a drag on the board, which carries
the field but cannot invent it. Say so: open the card, and if it was filed
before this field existed, re-file it with the form above.

Same rules as `share-branch` step 11: nothing saves until the button is
clicked; the owner is resolved against the roster on the page.

### 9. Tell Jillienne, and offer the row

Finish with the three lines a release needs:

> **feat/compass-week-view is on stage** (Compass, Anjani). Stage build:
> ‹link›. Promotion commit `abc1234` sets `compass-week-view` ON. Ready for
> `/release` whenever you want it.

Then ask whether the Refinement row should be **archived** now (the board is
for things under discussion, and this one is decided) or left up until the
release. Either is fine; archiving is the usual answer.

## Guardrails

- **Owner or Jillienne only.** Every scope the branch changes must be the
  caller's. A branch that crosses into another owner's surface is handed to
  that owner, not merged.
- **Defaults decided first.** No branch reaches stage with an undecided flag
  default — `decide-defaults`'s questions run here if they have not.
- **Stage into the branch, then fast-forward stage.** Never merge on a stage
  checkout, never `--force` stage, never resolve a conflict for the designer.
- **`npm run build` after the merge**, not before. The merge is what might
  break.
- **Never names `main`.** Not in a push, not in a merge. `/release` is the
  only thing that writes main, and it is Jillienne's.
- **The default dashboard version is Jillienne's**, on stage as on main.
- **A document is not a surface.** A branch that changes only
  `public/prototypes/` gets its card WITHOUT a scope, and the designer is told
  why — see step 8. A row that says "Staged" over an unchanged build is worse
  than a row that says nothing.
- **The card is the staged-date record,** and since 2026-11-04 it is also
  what the Prototypes row READS to draw its "Staged" tag — which is why the
  card must carry `scope`. Still do not invent a `stagedAt` field on the
  Prototypes rows: the Hub cannot read the stage BUILD, and a hand-stamped
  field in `prototypeFeatures.ts` would be a second copy of this record that
  nobody remembers to update. The card is the one record; the row reads it.
- **Say what Stage shows now, and that Main does not.** Every time.

## The other two

`share-branch` puts a chunk on Refinement from the designer's branch; this
puts a decided chunk on Stage. `release` — Jillienne's — puts Stage on Main.
Three shares, one lock.
