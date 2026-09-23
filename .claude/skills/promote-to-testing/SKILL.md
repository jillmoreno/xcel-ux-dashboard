---
name: promote-to-testing
description: Build a moderated user-test link from the branch you are on — pick the baseline the participant lands on (persona, progress state, flag variants), pick which CTAs are dead ends for this run, and hand back one standalone URL plus a moderator crib sheet. The link is given to you directly and is never added to the Refinement board. Pairs with promote-to-refinement (team review) and promote-to-prototype (shipping the baseline). Trigger on "promote to testing", "make a test link", "set up a user test", "break some CTAs", "moderated test", "/promote-to-testing".
version: 1.0.0
author: UX Design — Colibri
last_updated: 2026-09-23
status: active
---

# Skill: Promote to Testing

Turns the current branch into a **moderated user-test session**: one URL that
pins what the participant sees and which controls go nowhere, so the moderator
can ask *"what did you expect that to do?"* instead of watching the product
answer.

## The three promote skills, and which one this is

| Skill | Audience | What it produces | Committed? |
|---|---|---|---|
| `promote-to-refinement` | the design team | a row on the Refinement board | no — a row |
| `promote-to-prototype` | stakeholders | a flag baseline on `main` | **yes** |
| **`promote-to-testing`** | **one participant, once** | **a standalone link, handed to you** | **no — nothing** |

**This one writes nothing anywhere.** No commit, no board row, no flag default.
A run exists only in the URL you hand out, which is what lets two moderators run
different cuts off one branch build and what stops a session's rigging leaking
into anyone else's view of the product.

## Config — set once per repo

```yaml
full_site: "https://ux-design-xceldashboard.netlify.app"
branch_host: "ux-design-xceldashboard.netlify.app"   # branch builds live here
surface: "/dashboard-rebrand"                        # the product app
```

## The two layers of a run

A session is a **baseline** plus a **CTA layer**, and they are chosen
separately because they answer different questions.

**The baseline** is who the participant is when they land — the persona, the
progress state, and any flag variants under test. It rides in the query string:

| Param | Does |
|---|---|
| `?demo=1` | renders the **committed** defaults and ignores whatever is in this browser's localStorage. **Start every run with it** — otherwise the participant sees the last reviewer's sandbox. |
| `&ff=key:variant` | pins a flag off-baseline. Read-only: `?ff=` is layered on reads and **never written to localStorage**, so it cannot contaminate the machine. |
| `&ff=dashboard-progress-state:progress-on-track` | the usual persona control — `not-started`, `progress-on-track`, `progress-at-risk`, `complete-100`. |

**The CTA layer** is which clickable elements go nowhere: `&dead=id,id`. The
catalog is [`src/data/testableCtas.ts`](../../../src/data/testableCtas.ts) — each
row carries a `label` and an `asks`, and the `asks` is the thing to read aloud
when choosing. A control with no question behind it should stay live.

A dead CTA **renders, focuses and reads exactly like a live one.** That is the
whole proposition, and `src/context/CtaTestContext.tsx` records the
accessibility trade it costs — read that note before a run with an
assistive-technology participant, because the answer there is *no dead CTAs*.

## Steps

### 1. Where are we?

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')
echo "https://${SLUG}--ux-design-xceldashboard.netlify.app"
```

- On `main`: **allowed**, unlike the other two skills — testing the shipped
  baseline is a legitimate run. Say which it is, so nobody mistakes a `main`
  session for a test of their branch.
- Detached HEAD: stop and say so.

### 2. Is it pushed, and has it built?

```bash
git fetch origin --quiet
git status -sb | head -1              # no [ahead N]
curl -s -o /dev/null -w '%{http_code}\n' "$URL"
```

`200` or `401` means built. `404` means no deploy yet — poll every 20s for up
to five minutes, saying so. **Offer** to push if the branch is ahead; never
push without a yes, because a push is a deploy.

⚠ **Uncommitted changes are the trap here.** The branch build is what the
participant gets, so anything not pushed is not in the test. Say so explicitly
rather than listing files — a session run against the wrong build produces
findings about a product that does not exist.

### 3. Choose the baseline

Ask with **AskUserQuestion**: which persona/progress state, and whether any
flag is being tested. Default to `?demo=1` alone — the committed baseline —
and only add `&ff=` for something the run is actually about.

### 4. Choose the dead ends

Read the catalog and present it **grouped by region**, using `asks` as each
option's description. **AskUserQuestion, `multiSelect: true`.** Selecting
nothing is valid and common: a first session is often fully live, to see where
people go before anything is taken away.

⚠ **Three to five is usually the ceiling.** Every dead end costs the
participant trust, and a participant who has hit four walls stops exploring and
starts performing — at which point the session is measuring compliance, not
discovery. If more than five are wanted, say this once and then do as asked.

### 5. Assemble the link

```bash
node -e '
const [base,surface,ff,dead]=process.argv.slice(1);
const q=new URLSearchParams({demo:"1"});
if(ff) q.set("ff",ff);
if(dead) q.set("dead",dead);
console.log(`${base}${surface}?${q}`)' "$BASE" "$SURFACE" "$FF" "$DEAD"
```

Then **check every id against the catalog before handing it over.** An id that
is not in `TESTABLE_CTA_IDS` leaves that control **live** — the app warns in
the console, which nobody is watching mid-session.

### 6. Hand it over

Give the link, then a **moderator crib sheet** — a table of every dead id, its
label as it appears on screen, and its `asks`. That table is the session's
script: it is what turns "huh, nothing happened" into a question worth asking.

Close with the two operational facts:

- **The run survives a reload but dies with the tab** (`sessionStorage`). A
  fresh tab is a clean product unless the link is used again.
- **`&dead=` with nothing after it clears the run** mid-session, without
  closing anything.

## Guardrails

- **Never commit a run.** No flag defaults, no fixtures, no `dead` list in the
  repo. If a run needs a state the URL cannot express, that is a gap in the
  baseline params — fix it there, not by committing a session.
- **Never add the link to Refinement.** Refinement is the team's review inbox;
  a rigged build with dead controls will be read as broken by anyone who did
  not sit in the session. This link is handed to the moderator directly.
- **Never use `localStorage` for a run.** `sessionStorage` is the decision —
  see `CtaTestContext`. A machine quietly killing CTAs weeks later, with
  nothing on screen to explain it, is this mechanism's worst failure.
- **Never dress a dead CTA as disabled.** Not dimmed, not `aria-disabled`. The
  moment a control announces itself dead the participant stops reaching, and
  the reach is the data.
- **Say which build.** Branch name and commit, every time. A finding traced to
  the wrong build is worse than no finding.
- **Add to the catalog, not to the page.** A control with no `TESTABLE_CTAS`
  row cannot be killed — that is the correct failure, and the fix is two lines
  (a row, plus `data-cta-id` on the element), never a special case here.

## Adding a CTA to the catalog

Two steps, and the second is one token:

1. Add a row to `TESTABLE_CTAS` — `id`, `label`, `region`, `asks`.
2. Put `data-cta-id="<id>"` on the element.

`src/test/CtaTest.test.tsx` then holds both ends: a catalog id with no element
fails, and a tagged element with no catalog row fails. Neither is silent.
