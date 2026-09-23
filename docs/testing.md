# Testing

What each suite pins and why, for the gateway and for the product app.

> Moved out of `CLAUDE.md` on 2026-09-21, verbatim. The root file is the map;
> this is one of the five surfaces it points at. Cross-references to "CLAUDE.md"
> in older code comments mean this material.

---

## Tests

[`src/test/UxDashboard.smoke.test.tsx`](src/test/UxDashboard.smoke.test.tsx) —
covering what the port could plausibly have broken: that it mounts
under the real provider stack, that the nav is the full section set *in order*,
that every row routes where the data says, that the gate holds (including the
deep-link case), and that the preview resolver resolves for every documented
component.

Plus two XCEL-specific ones. First, that every **document** row's `externalUrl`
is a **same-origin** `/prototypes/…` path which exists in `public/` (corrected
2026-09-03 — this said "an absolute URL on a single shared origin", which
predates the 2026-09-02 move off the cross-origin pointer and contradicted it;
scoped to document rows 2026-09-08, when `xcel-dashboard` arrived as a route).

Second, **what sits in Demo** — the ungated front door. This one said "Demo is
empty" and claimed to be the tripwire that fails when a row is promoted. **It
would not have.** It only asserted one gated row's title was absent, which
stayed true whatever else appeared, so the promotion passed it and three
unrelated `externalUrl` assertions caught the change instead. It compares the
whole rendered section now, in both directions, and both were verified to fail
before being relied on.

Written because the port couldn't be verified visually, and because the failure
mode that mattered — a missing provider throwing on mount — renders a blank page
that looks like a styling bug. Extend it when you add a section or change
`sectionOf`; `EXPECTED_PLACEMENT` in that file is the list to update when a row
moves.

[`src/test/Links.test.tsx`](src/test/Links.test.tsx) covers the Links section —
the scheme allow-list at both boundaries, the ungated placement, the live nav
badge, and the no-endpoint state. See the Links section above for why each of
those is pinned; the two that shipped wrong once are the badge and (in the
launch config) the worktree functions path.

The six row-backed prototype pages are covered separately by the jsdom suites
in [`smoke/`](smoke/) — **`npm run smoke`**, 617 assertions across nine files. They
are plain node scripts, not vitest, so `npm test` does NOT run them; run both.

**Three pages have no suite at all**, all of them row-less ones:
`xcel-lms-brief-vs-existing.html`, `xcel-finserv-build-plan.html` and
`xcel-clp-todays-tasks.html`. The build plan is the one that matters — 66 rows of
authored data, a JS render path, and a duplicate-key failure mode that is legal
JavaScript. Adding a suite for it is the most valuable test work outstanding in
this repo. (The fourth row-less page, `xcel-study-plan.html`, ships with its own
suite — being row-less is not a reason to go uncovered, it is only the reason
`smoke-tiles.mjs` will not notice.)


### The product app's tests — added 2026-09-08

The migration brought ~70 more vitest files covering the product surfaces. Two
things to know before reading a failure in them:

**They were written against six brands, and are now XCEL-only.** Where a brand
appeared as SCAFFOLDING — a seed helper, a `Brand[]` list, a default param — it
was repointed at XCEL. Where a brand was the SUBJECT — `expect(tierLabelFor(
'elite', …)).toBe('Passport Lite')` — the case was removed rather than
rewritten, because repointing it invents an assertion about a tier ladder XCEL
does not have.

**A test that pins itself to a named fixture row is the fragile pattern here,
and `ProgressFillTones` is the worked example.** It picked a McKissock course
for "completed" and a CRE one for "expiring soon" — coupling a test about colour
mapping to whichever brand happened to author a row in each state. It now builds
each state explicitly on an XCEL base and depends on no fixture at all. Prefer
that shape. Two traps it had to learn, both worth knowing before you write an
expiry test: `CourseCard` resolves expiry against the anchored `FIXTURE_TODAY`
(2026-05-11), not the wall clock; and `warnWindowFor` clamps the countdown to
half the enrolment window, so "inside 60 days" is not sufficient.

**The suite is green — 468/468 across 70 files.** The migration section's table
says how each fixture gap was closed, and the two rules under it are the ones to
follow when the next one appears. The short version: prefer moving a test down a
layer over authoring data to satisfy it, and never author a fixture pointing at
an asset that does not exist.

## The dead-CTA mechanism — `CtaTest.test.tsx`, 2026-09-23

The one suite here that guards a **research instrument** rather than a product
surface. `?dead=home.resume,…` on a branch build makes named clickable elements
inert for one moderated session, so a participant's reach for a control can be
asked about instead of answered. `promote-to-testing` builds the link;
`src/data/testableCtas.ts` is the catalog and `src/context/CtaTestContext.tsx`
the interceptor.

**It is not a feature flag, and the distinction is why it is a second
mechanism.** A flag decides which design renders — committed, reviewed,
eventually resolved. This decides whether one already-rendered control responds,
for one session, and is never committed at all.

Four things the suite pins, in the order they would break:

1. **The capture phase.** Interception depends on a `document` capture listener
   beating React's root listener. Moved to the bubble phase it looks identical
   and does nothing — six tests fail on that change, which is the check to
   re-run if the mechanism is ever refactored.
2. **Both directions.** A dead CTA must not fire AND a live one must still
   fire. The second is the failure that would break the product for everyone.
3. **Catalog ↔ element agreement.** A catalog id with no element leaves the
   control live and the moderator finds out mid-session; a tagged element with
   no catalog row can never be killed. Both fail, via a source scan.
   ⚠ That scan excludes `testableCtas.ts` and the tests — an early version
   included them, so it matched every id against its own declaration and passed
   on a deliberately mistyped id.
4. **`sessionStorage`, not `localStorage`.** A run outlives a refresh and dies
   with the tab. The assertion names the storage key, because a round-trip test
   passes just as happily on the wrong one.

The suite also pins that a dead CTA carries no `disabled`, no `aria-disabled`
and no dimming — a deliberate accessibility trade, recorded in full in
`CtaTestContext`'s header along with the one case where it does not apply.
