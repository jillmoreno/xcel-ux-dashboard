# Hub modes — Simple and Advanced

**Status: proposal, 2026-11-21, on `feat/hub-simple-mode`.** Nothing below is
built yet. This file is the discussion; the decisions it asks for are marked
**DECIDE**.

## The ask

Jillienne, 2026-11-21: the Hub should have a **simplified** version where an
intern designer can add a link that can be shared, with only Design · Research
· PRDs · Development · Done · Archive showing, and an **advanced** version that
keeps everything built so far — stage, main, Release, the derived Design
section, the To Do Board — without losing any of it. And: is it a toggle,
behind a settings control?

## The answer in one paragraph

Yes, and it is small. The rail already renders from ONE list,
`VISIBLE_SECTIONS` in `UxDashboardPage.tsx`, and every place that resolves a
section (the nav, the heading, `?section=` deep links) reads that list — the
retired public site was exactly this filter, applied by a build variable. A
mode does the same thing with a per-browser setting instead: **Simple** shows
six sections, **Advanced** shows all fourteen. The control sits in the
Appearance menu at the foot of the rail, which is already the Hub's one
per-browser settings spot (palette, appearance), renamed **Settings** and
given a third group. Stage, main, Release, the routines and the smoke test's
one-build rule are untouched — Advanced IS today's Hub.

## What each mode shows

| Mode | Rail | Lands on |
|---|---|---|
| **Simple** (default) | Design · Research · PRDs · Development · Done · Archive | Design |
| **Advanced** | Prototypes · Design · Release · Refinement · Research · Resources · PRDs · Explorations · Development · Done · Archive · QA Notes · To Do Board · Hub Resources | Prototypes |

Eyebrows in Simple: *Design & Research* over Design, *Dev Handoff* over
Development. No Demo group, no Team group.

## The one real design question: what is "Design" in Simple mode?

Today's Design section is **derived** — every branch Netlify built, read from
git, authored by nobody, with no Add button. It needs a branch named
`feat/<scope>-<feature>`, a push, a Netlify token and a GitHub token. That is
the advanced flow by definition. An intern cannot "add a link" to it.

The thing an intern needs already exists: **Refinement** — a board of links,
authored on the page, stored in Netlify Blobs, with a Copy link on every row.

**Recommendation: in Simple mode, the Refinement board IS the Design page.**
Same rows, same store, same Copy link; the section is labelled *Design* and
sits first. In Advanced mode nothing changes — the derived Design section and
the Refinement board are where they are today. Only one label is ever on
screen at a time, so there is no second door into the same work.

Why not the other two shapes:

- *Derived branches with an authored list under them* puts the advanced
  machinery on the simple page and needs both tokens to render.
- *A new board with its own store* builds a second Refinement.

**DECIDE:** the Refinement board wears the *Design* label in Simple mode. (If
no, the alternative is a Simple-mode "Design" that is Refinement under its own
name, and the six sections become seven.)

## What gets in an intern's way today, and the fix for each

| Rule today | Why it blocks an intern | Fix in Simple mode |
|---|---|---|
| Refinement's **Added by** is a pick from five names (`DESIGNERS`) | an intern is not one of them | free text, as Research and PRDs already do; the designer pills over the board become authors read from the rows |
| **Product** tag (Atlas · Compass · Both) on the row | a vocabulary they have not learned yet | optional, default none; the tag still shows when set |
| **Discuss in Refinement** on a Design row, and the branch-name parsing | part of the derived section | hidden with it |
| The share link is behind the **site password** | unchanged — the person they send it to needs the password | say so on the Copy link toast; `capture-clickthrough` is the passwordless route and stays Advanced |

Nothing on the server changes. The board's endpoint, store and fields are the
ones Refinement uses now.

## The toggle

- **Where:** the rail-foot menu, renamed *Settings*, a third group under
  Palette and Appearance: **Hub** → *Simple* / *Advanced*, one line of hint
  each ("Links, briefs and handoffs" / "Everything, including stage and
  release").
- **Stored:** per browser, beside the theme and palette keys. Default
  **Simple** — a first visit is the stripped Hub; the four designers flip once.
- **DECIDE:** default Simple for everyone, or Advanced for the team's site?
  A build variable can pick the site's default (the same shape as the
  retired `VITE_GATEWAY_MODE=public`) if flipping per browser turns out to be
  a nuisance. Recommend starting per-browser and adding the variable only if
  asked.
- **Deep links:** a `?section=prototypes` link opened in Simple mode names a
  section the mode does not show. Today that lands on the default section.
  **DECIDE:** land on Design silently, or open Advanced for that visit
  without remembering it? Recommend the second — the link is the ask — and
  pin it in the test either way.

## What is untouched

Stage and main, `/share-to-stage`, `/release`, the `.hub/decided/` markers,
the Prototypes rows and their retired-link screen, the one-build rule in
`UxDashboard.smoke.test.tsx`, every routine. Advanced mode is today's Hub to
the pixel; the smoke test's pinned nav list stays and gains a second list for
Simple.

## Files the build touches

| File | Change |
|---|---|
| `src/pages/UxDashboardPage.tsx` | `VISIBLE_SECTIONS` and `DEFAULT_SECTION` become a function of mode; the Settings menu's third group; the Design label on the `demo` section in Simple |
| `src/components/prototype/LinksPanel.tsx` | Added by free text and no roster pills when the board is in Simple mode |
| `src/test/UxDashboard.smoke.test.tsx` | a second pinned nav list, the landing section per mode, the deep-link rule |
| `docs/gateway.md`, `CLAUDE.md` | the two modes, one paragraph each |
| `public/contributing/` | the intern's first-day path: open the Hub, Design → Add, paste, Copy link |

All of these but the guide and `LinksPanel.tsx` are on the protected list, so
this is Jillienne's build, not a designer's. About a day.

## Not in this branch

- A "simple" version of the routines. `/share-branch` and friends stay as
  they are; an intern on the simple Hub adds a link by hand.
- A per-person mode (who sees what by login). The Hub has one password and
  no accounts; the mode is per browser.
