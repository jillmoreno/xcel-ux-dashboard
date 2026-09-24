---
name: promote-to-testing
description: Publish a moderated user-test session — freeze the current branch onto the test site's branch, tag the session with what it rigs, wait for the build, and hand back the participant link, the moderator link and a published session sheet — an HTML handoff document generated from the CTA catalog, carrying the frozen SHA and a live link builder. The link goes to a separate password-protected Netlify site with no UX Dashboard on it. Pairs with promote-to-refinement (team review) and promote-to-prototype (shipping the baseline). Trigger on "promote to testing", "create a test link", "make a testing link", "set up a user test", "freeze a branch for testing", "break some CTAs", "/promote-to-testing".
version: 2.1.0
author: UX Design — Colibri
last_updated: 2026-09-24
status: active
---

# Skill: Promote to Testing

Publishes a **moderated user-test session**: one link, to one screen, on a site
that has no project list on it, with named controls made into dead ends so the
moderator can ask *"what did you expect that to do?"* instead of watching the
product answer.

## The three promote skills, and which one this is

| Skill | Audience | What it produces | Committed? |
|---|---|---|---|
| `promote-to-refinement` | the design team | a row on the Refinement board | no |
| `promote-to-prototype` | stakeholders | a flag baseline on `main` | **yes** |
| **`promote-to-testing`** | **one participant, once** | **a frozen branch + a link** | **a branch move, no code** |

## Config

```yaml
test_site:   "https://xcelusertesting.netlify.app"   # its own password, no gateway
test_branch: "test/session-1"                        # the site's production branch
surface:     "/dashboard-rebrand"
```

⚠ **The test site is a THIRD Netlify site**, not a branch build. Branch builds
sit behind the team's shared site password, which a participant cannot be
given. Setup is recorded in `docs/gateway.md`; it is a one-time job and this
skill assumes it is done.

⚠ **`test_branch` is FROZEN on purpose.** The site rebuilds on every push to it,
so a site tracking a working branch would rebuild mid-session, under the
moderator. Nothing reaches a participant until this skill force-pushes.

> **Rename pending.** `test/session-1` is a poor name — the site tracks exactly
> one production branch, so a second session cannot get a second branch. It
> should become `test/live`, with each session recorded as a TAG (step 4).
> Changing it means editing the Netlify site's production branch too.

## What the test build already does for you

On `VITE_GATEWAY_MODE=testing`, which only that site sets:

- **No UX Dashboard.** `/`, `/ux-dashboard`, `/research-rationale` and `/links`
  all redirect into the product; `/prototypes/*` is 404'd at the edge.
- **Participant chrome is the default.** No `?test=1` needed — the prototype
  bar is gone and the demo bar carries Progress and Navigation only. `?test=0`
  brings the full bar back, which is the MODERATOR's link.
- **The session baseline is 0% and Navigation Option 1**, regardless of what is
  committed. See `TESTING_BASELINE` in `FeatureFlagContext`.

So the link is short. `?demo=1` and `?test=1` are redundant there; do not add
them.

## Steps

### 1. What is being frozen?

```bash
git rev-parse --abbrev-ref HEAD
git rev-parse --short HEAD
git status --porcelain            # must be empty
git log --oneline -3
```

Uncommitted work is not in the build. Say so and stop — a session run against
the wrong code produces findings about a product that does not exist.

### 2. Choose the baseline

Ask with **AskUserQuestion**: which progress state, and whether the session is
testing Navigation Option 1 or Option 2.

Only name what differs from the test build's own baseline (0%, Option 1). A
link that restates the default is a link that stops working the day the default
changes.

| Param | For |
|---|---|
| `&ff=dashboard-progress-state:progress-on-track` | a learner already under way |
| `&ff=dashboard-navigation:option-2` | the variant arm of the A/B |

### 3. Choose the dead ends

Read `src/data/testableCtas.ts` and present it **grouped by region**, using each
row's `asks` as the option description. **AskUserQuestion, `multiSelect: true`.**
Selecting nothing is valid and common — a first session is often fully live.

⚠ **CHECK EACH CHOICE IS ACTUALLY LIVE IN THE CHOSEN BASELINE**, and say so
when it is not. A control that is already inert cannot be killed, and a
participant's shrug at one reads as a finding about the SESSION'S rigging when
it is really about the product. Known cases:

- `home.pace-option`, `home.week-strip` — **0% only**. Past 0% the picker is
  hidden and the strip is replaced by the activity chart.
- `home.exam-date-save`, `home.exam-date-clear` — only once the exam-date
  editor is open; `clear` only when a date is already stored.

⚠ **Three to five is the ceiling.** Every dead end costs trust, and a
participant who has hit four walls stops exploring and starts performing. Say
this once if more are wanted, then do as asked.

### 4. Freeze, and tag the session

Confirm the SHA and the branch aloud, then:

```bash
git push -f origin "$BRANCH:$TEST_BRANCH"
git tag -a "session-$(date +%F)-<slug>" "$SHA" -m "<the ff= and dead= of this run>"
git push origin "session-$(date +%F)-<slug>"
```

⚠ **The tag is the session's record**, and it is the reason a force-push is
safe: the branch moves, the tag does not. Months later the tag says which
commit a finding came from AND what was rigged when it did. Put the actual
params in the message.

### 5. Wait for the right build

```bash
curl -s -o /dev/null -w '%{http_code}\n' "$TEST_SITE"
```

`401` means the site is up — it always does, so this proves nothing about
WHICH commit is live. **Tell the moderator to confirm the SHA in Netlify →
Deploys before sharing the link.** Handing out a link to the previous build is
the most likely failure in this whole flow and the password makes it invisible
from here.

### 6. Hand over

Give **two** links and a crib sheet.

**Participant** — what the tester opens:
```
<test_site><surface>?ff=…&dead=…
```
(Omit either param when empty. With no baseline change and no dead ends, the
bare `<test_site>/` is a complete participant link.)

**Moderator** — the same session with the full demo bar, for setting a persona
or checking a flag before handing the laptop over:
```
<test_site><surface>?test=0&ff=…
```

**Crib sheet** — one row per dead id: the label as it appears on screen, and
its `asks`. That table is the session's script; it is what turns "huh, nothing
happened" into a question worth asking.

Close with the two operational facts:

- **A run survives a reload but dies with the tab** (`sessionStorage`).
- **`&dead=` with nothing after it clears the run** mid-session.

### 7. Publish the session sheet

```bash
node scripts/session-sheet.mjs \
  --out "$SCRATCH/session-sheet.html" \
  --sha "$SHA" --branch "$TEST_BRANCH" --tag "$TAG" \
  --persona progress-on-track --nav option-2 \
  --dead nav.courses,home.exam-date-save
```

Then publish it with the **Artifact** tool and hand back the URL with the
links. Omit any flag the session does not use; `--out` is the only required
one.

⚠ **GENERATED, NEVER HAND-WRITTEN.** The sheet reads `TESTABLE_CTAS` from
source on every run, so it cannot describe a catalog that has moved. A page
listing a control that no longer exists sends a colleague looking for a button
that is not there — and a sheet is exactly the artefact someone trusts without
checking.

⚠ **IT IS THE HANDOFF DOCUMENT, not a prettier link.** It carries the SHA and
the tag, so a second moderator opens it and knows which build they are running;
it pre-ticks the session's own choices, so it reads as a record; and the
builder stays live underneath, so they can re-tick mid-session and get a new
link without coming back here. Two things it does that the links alone cannot:
flags any dead end that is **already inert** in the chosen baseline, and warns
past the five-dead-end ceiling.

The script REFUSES rather than guesses — an unknown `--dead` id, or a catalog
it cannot parse, is an error. `SessionSheet.test.ts` asserts the count from the
other side, so a reformat of the catalog cannot quietly shorten the sheet.

## Guardrails

- **Never commit a run.** No flag defaults, no fixtures, no `dead=` list in the
  repo. If a run needs a state the params cannot express, that is a gap in the
  baseline — fix it there, not by committing a session.
- **Never point the test site at a working branch.** It rebuilds under the
  moderator.
- **Never share the branch-build URL** (`<slug>--ux-design-xceldashboard…`).
  Same code, wrong password, and it still has the UX Dashboard on it.
- **Never dress a dead CTA as disabled.** The moment a control announces itself
  dead the participant stops reaching, and the reach is the data.
- **Say which commit.** Branch and SHA, every time.
- **A control that is always inert leaves the catalog.** Two have already:
  `header.logo` and `home.study-pace-adjust`. Offering to kill something
  already dead manufactures findings.
- **Never hand-write the sheet.** Generate it. A sheet is trusted without
  checking, which is exactly why it must not be able to drift from the
  catalog.

## Adding a CTA to the catalog

Two steps, and the second is one token:

1. Add a row to `TESTABLE_CTAS` — `id`, `label`, `region`, `asks`.
2. Put `data-cta-id="<id>"` on the element.

`src/test/CtaTest.test.tsx` holds both ends: a catalog id with no element
fails, and a tagged element with no catalog row fails. Neither is silent.
