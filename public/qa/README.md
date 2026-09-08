# QA Notes — authoring and screenshots

Everything on this page can be written from the page itself. Nothing here needs a
code change or a deploy.

## Findings

**Add finding** in the page header opens the editor. **Edit** and **Delete** are
in each finding's detail panel. All of it is stored server-side
([`netlify/functions/qa-notes.ts`](../../netlify/functions/qa-notes.ts)), so
whoever opens the link sees it.

[`src/data/qaNotes.ts`](../../src/data/qaNotes.ts) holds the committed seed that
ships with the build. It is **empty on purpose** — the page starts blank and
everything in it is written through the form. (The original 18 expired-CLP
findings were seeded there and removed on 2026-08-26; they are in git history at
commit `22cc382`.) Stored records merge over whatever the seed holds:

| | |
|---|---|
| Stored record, committed id | **Overrides** that finding — the panel tags it `EDITED` |
| Stored record, new id | Appended — tagged `ADDED HERE` |
| Delete an override | **Reverts** to the committed finding |
| Delete an authored one | Removes it (asks first — there is no undo) |

So nothing you do on the page can destroy something that is in git.

### The four fields

**Title · Severity · Status · Detail.** That is the whole form.

It was eleven fields until 2026-08-26 — surface, state, category, blocked-on, a
prose Expected/Actual pair, two screenshot captions, a feature flag and a ticket
ref all went. Filling it in was a chore, and the chore was the reason findings did
not get logged. The two captures are already labelled Expected and Actual, so the
prose pair was restating them.

The cost, stated plainly: a finding with no captures yet has only its title and
its Detail bullets to say what is wrong, and there is no structured field for
*which* decision a `Needs decision` finding is waiting on — put it in a bullet.

**Bullets are one per line, and a leading two-space indent nests a line** under
the one above it. That is the whole nesting model — one level, no deeper.

**ids** and **logged dates** are assigned by the server, not the form. Ids are
referenced from tickets and from other findings' bullets, so a form that could
renumber one would break those references.

### Getting them back into git

**Copy as data file** emits the whole set as the `QA_NOTES` array. Paste it over
the array in `qaNotes.ts` and commit, and the stored findings become committed
ones. Worth doing periodically: **Netlify Blobs is not backed up**, so until you
do, findings authored here exist in exactly one place.
[`QaExport.test.ts`](../../src/test/QaExport.test.ts) checks the output still
parses — if that escape hatch silently broke, nobody would find out until they
needed it.

# Screenshots

Captures for the QA Notes page. There are now **two** places one can come from,
and they are for different jobs.

## 1. Drop it on the live page (the normal way)

**Two places, for two different moments.** In the **Add / Edit form** there is a
Screenshots row: drop a file on the Expected or Actual frame (or click to pick
one) and it is uploaded when you save. On an **existing finding's panel**, the
same frames upload immediately, and that is also where replacing and removing a
screenshot lives — so the form never has to stage a deletion.

Either way it **is visible to everyone who opens the link**, with no commit and no
deploy.

### Context images

Beside the pair, a finding can carry up to **six context images** — anything
supporting that is not the Expected/Actual comparison: a console, a zoom, a third
state. Added in the form's Context row, viewed and removed on the finding's panel.

They are deliberately **not** on the list card. The card's two labelled columns
work because they are a *comparison*; adding a variable pile of supporting shots
to it would take that away.

Keys are `qa-NNN-context-1` … `-6`. Capped and numbered rather than free-form
because the bounded key namespace is this endpoint's only real access control (see
Operational notes) — a free-form gallery needs unbounded keys, and that is the one
property standing between this and an open upload bucket.

**Deleting one leaves its index free rather than renumbering the rest.** The next
image added takes the lowest free slot. Renumbering would mean renaming blobs —
copy-then-delete — and a half-failed rename loses an image.

One consequence of the form's ordering, since it is not guessable: a capture is
filed under the finding's id, and a new finding has no id until it is saved. So
the files are held in the browser and sent the moment the note comes back — which
means **if a screenshot fails to upload, the finding still exists.** The notice
names the slot and the reason; open the finding and drop that one again.

- Stored server-side in **Netlify Blobs** via [`netlify/functions/qa-captures.ts`](../../netlify/functions/qa-captures.ts).
- The store is **site-wide**, not deploy-scoped, so captures survive every push.
  (`getStore`, never `getDeployStore` — that distinction is the difference
  between this working and the page silently emptying on the next deploy.)
- **Replace** overwrites the slot. **Remove** clears the upload and falls back to
  the committed file if there is one, so a drop is always reversible and can
  never take away something that is in git.
- Screenshots wider than 1600px are downscaled in the browser before upload, and
  re-encoded as **PNG** — not WebP — because these captures are the evidence for
  findings about 1px borders and exact colour values, and lossy re-encoding is
  the wrong thing to do to that. WebP is a fallback only when a downscaled PNG
  still will not fit.

A finding with no captures shows an **Add captures** link rather than two empty
frames, so the deliberate no-evidence state (QA-017, QA-018 — their evidence
lives in another finding's screenshots) still reads as deliberate.

## 2. Commit a file to this directory (for something permanent)

Name it `<id>-expected.png` / `<id>-actual.png`, lower-case — e.g.
`qa-006-actual.png` — and reference it from `screens[].src` in
[`src/data/qaNotes.ts`](../../src/data/qaNotes.ts) as `/qa/qa-006-actual.png`.
Vite serves this directory at the root, so there is no import and no build step.

Use this for a capture that should live in version control alongside the finding.
An **upload always wins over a committed file**, so committing one does not fight
a drop.

## What each empty state means

| What you see | What it means |
|---|---|
| Dashed frame, "Drop a screenshot, or click" | Slot is empty and ready |
| Dashed frame, "Capture missing — drop a new one" | `screens[].src` names a file that is not there |
| Grey frame, "Screenshot not yet added" | No upload endpoint reachable — see below |
| Nothing at all, plus "Add captures" | Finding has no captures and none are promised |

## Local development

`npm run dev` runs Vite alone, which serves **no functions** — so every upload
call fails and the page falls back to committed files with the drop targets
hidden. That is a correct degraded state, not a bug. You will see one 404 for
`/api/qa-captures` per load; that request *is* the availability check.

For the real thing locally:

```bash
netlify dev --port 8888 --target-port 5180
```

Blobs are emulated in `.netlify/` (gitignored), so local uploads never touch the
deployed store.

## Operational notes

- **Netlify Blobs must be available on the site.** If uploads 404 in production
  while the rest of the site works, check that first.
- **`QA_CAPTURES_WRITE_TOKEN`** (optional, set on the Netlify site): when set,
  writes require a matching `x-qa-token` header, which the client sends from
  `VITE_QA_CAPTURES_TOKEN`. Be clear-eyed about what this buys — a `VITE_*` value
  is inlined into the JS bundle, so it is readable by anyone with devtools. It is
  a speed bump against drive-by scanners, **not authentication**.
- **Writes are otherwise open**, and that is a deliberate choice for an internal
  prototype rather than an oversight. What bounds it is the shape of the API: the
  key pattern allows only `qa-NNN-expected` / `qa-NNN-actual`, there is no
  caller-supplied filename or path, only raster image types are accepted, and
  each slot is size-capped. The worst an anonymous caller can do is put a
  different picture in a QA screenshot slot. If that is not acceptable, the fix
  is a platform control that also covers the function — Netlify site password
  protection or Identity — not a secret in the bundle.
