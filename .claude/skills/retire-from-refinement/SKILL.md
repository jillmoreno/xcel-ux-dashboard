# Skill: Retire from Refinement

Closing out a Refinement row — whether the work was promoted or declined — so the
three things worth keeping are actually kept, instead of each being a separate
manual act that nobody performs.

## The problem this exists for

A Refinement row is the cheapest thing on the dashboard: authored in the browser,
no commit, no deploy. That is its whole appeal, and it is also why closing one
out goes wrong. The end of a piece of work looks like this:

    merge or close the PR → delete the branch → remove the row → done

Every record is lost in that sequence, silently, and none of it is recoverable
later:

| What is lost | Where it lived |
|---|---|
| **The artifact** | the Netlify BRANCH DEPLOY, which 404s the moment the branch is deleted |
| **The argument** | nowhere — "we decided not to" was said in a meeting |
| **The provenance** | the row itself, which is a Blob and is not in git |

⚠ **THE THING PEOPLE EXPECT TO SAVE IS THE ROW. IT IS NOT.** The row is a title
and a URL. What is worth keeping is the BUILD it points at, and that lives or
dies with the git branch — nothing about removing or keeping the row affects it.
A row kept after its branch is deleted is a dead link with a note attached.

## When to run it

At the END of a Refinement row's life, both ways it can end:

- **Promoted** — `promote-to-prototype` has run and the flags are in the baseline.
  That skill's step 6 already says "retire the Refinement row"; this is that step,
  done properly.
- **Declined** — the work is not going into Prototypes. This is the case the
  Archive row matters for, because there is otherwise no record it happened.

Not for a row someone is still discussing. Refinement is allowed to be untidy;
that is what it is for.

## ⚠ Where this does NOT send things

**Not to Exploration.** That was considered on 2026-09-29 and rejected, and the
reasoning is worth keeping because the idea comes back:

- An Exploration row is a `PROTOTYPE_FEATURES` entry in code pointing at a
  committed HTML document in `public/prototypes/`. A Refinement row is a Blob
  pointing at a branch deploy. Moving one to the other is not a move, it is
  authoring a new document — a real cost, paid on every declined experiment,
  and it stops happening after the third one.
- Exploration means one thing today: outside products and ideas rebuilt on our
  tokens and conventions. Add "work we did not ship" and it means two things,
  and so does Archive. That is the same failure as a second Prototypes row.

**Not to Design or Development.** Those are states in the dev pipeline, driven by
`devStatus` on a feature row. A branch nobody is building is not "in design".

## Steps

### 1. Read the row, do not retype it

The row is the input. Read it from the store rather than asking, so the Archive
row carries what the reviewer actually wrote rather than a summary of it:

```bash
# The store is owned by the DEMO site; the design site points at it via
# BLOBS_SITE_ID. `netlify sites:list --json` gives the ids.
NETLIFY_SITE_ID=<demo-site-id> npx netlify blobs:list demos
NETLIFY_SITE_ID=<demo-site-id> npx netlify blobs:get demos <demo-NNN>
```

Take: `title`, `url`, `note`, `addedBy`, `addedDate`, `product`, `isPublic`.

### 2. Establish which ending this is, and ASK if it is not obvious

```bash
git log --oneline origin/main | head -20     # did it land?
git branch -r --contains <the branch's tip>  # is it merged?
```

Promoted and declined produce different rows. Do not guess — a wrong `reason` is
worse than no row, because it will be believed.

### 3. Decide the branch's fate, OUT LOUD

This is the step the whole skill exists for, and it is a question for the owner,
not a default. Present it with **AskUserQuestion**:

- **Delete the branch** — the build goes with it. Right when the work landed in
  Prototypes (the product IS the record now) or when nobody will look again.
- **Keep the branch** — the build stays up at its own URL indefinitely, for free.
  Right when the argument is visual and the Archive row's words will not carry
  it. ⚠ Say in the row that it is a SNAPSHOT: a branch build renders its own old
  code forever and drifts from `main` silently, so it is evidence of what was
  shown, never of what the product does now.
- **Freeze it** — `promote-to-testing`, when it has to be citable and stable
  (a user test, a sign-off).

### 4. Write the Archive row

Hand off to **`archive-a-feature`** for the row itself — it owns the format, the
`restoreNote` standard, and the owner check on `archivedItems.ts`. What this
skill adds is the content, drawn from the row:

- `name` — the row's `title`.
- `what` — the row's `note`, which is what a reviewer was actually asked to look
  at. If the note was empty, say so rather than inventing one.
- `location` — **the branch name, and whether the build still exists.** This is
  the field that makes the difference between a record and a rumour. If the
  branch was deleted, say the build is gone and name the merge commit or the
  closed PR instead, so there is still somewhere to go.
- `reason` — the argument for the ending. For a decline: what was actually wrong
  with it, not "not promoted".
- `flag` — any `?ff=` the row's URL pinned, since that is how someone reproduces
  the configuration on a build that still exists.

### 5. Remove the row

Only after the Archive row is written and committed. Two ways, and the first is
better because it is the one a designer can do:

- **On the page** — Refinement → the row's kebab → Remove.
- **Through the store**, when running this unattended:

```bash
NETLIFY_SITE_ID=<demo-site-id> npx netlify blobs:get demos <demo-NNN> > /tmp/<demo-NNN>.json
NETLIFY_SITE_ID=<demo-site-id> npx netlify blobs:delete demos <demo-NNN>
```

⚠ **Keep that backup until the Archive row is on `main`.** A blob delete is not
reversible and the store is the only copy — the same reason `Copy as markdown`
exists on that panel.

### 6. Say what is now true

One short report: which row went, whether the branch is still up (and its URL if
so), and where the Archive row is. If the branch was kept, that URL is the thing
people will ask for in three months.

## Guardrails

- **The branch decision is the owner's, always.** Deleting a branch deletes the
  only viewable copy of the work. Never default it.
- **Archive row first, row removal second.** In that order, or a crash between
  the two loses the record it was written to preserve.
- **Never route to Exploration** — see above. If someone asks, that section is
  for documents authored to be kept, and a branch is not one.
- **A declined row still gets a row.** "We tried it and did not ship it" is the
  most valuable thing in the Archive, because it is the only place it is written
  down.
- **No invented reasons.** If nobody said why, write that nobody said why.

## The other half

`promote-to-refinement` puts a row up. `promote-to-prototype` decides whether its
flags ship. This is how the row ends, either way — and the only one of the three
that runs when the answer is no.
