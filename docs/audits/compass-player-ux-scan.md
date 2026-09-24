# UX Scan — Compass Course Player

**Surface:** `CompassCoursePlayer` — what "Start course" / "Resume" opens into
**Input:** the running app, `/dashboard-rebrand?version=discoverability-testing` → Resume
**Scope:** default state, light + dark theme, 1440 / 768 / 375
**Flag:** `course-launcher-style: compass` (the other variant, `lo-fi`, is not in scope)
**Figma:** `Atlas-Compass-Global-Navigation`, node 49:2903
**Scanned:** 2026-09-22, against `references/scan-rubric.md`

**Design-system profile: YES**, so fidelity and theming are scored rather than
skipped — `src/styles/tokens.css`, the `@/icons` registry, the conventions in
`CLAUDE.md`, and the `[data-theme='dark']` block.

---

## The one-line version

**63/100.** The surface is visually faithful and its data is honest; it fails on
the two things nobody sees until someone else opens it — **it does not respond
below 1280, and it does not theme.** Most of the accessibility deductions trace
to the deliberate "static" decision and are listed as such.

---

## Score

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Usability heuristics | 70 | 1.5 | 105 |
| Visual hierarchy | 90 | 1.0 | 90 |
| State coverage | 80 | 1.5 | 120 |
| **Accessibility** | **20** | 2.0 | 40 |
| **Responsive** | **40** | 1.5 | 60 |
| Content & CTA | 76 | 1.0 | 76 |
| Consistency / fidelity | 85 | 1.0 | 85 |
| Theming | 80 | 1.0 | 80 |
| | | **10.5** | **656** |

**Overall: 656 / 10.5 = 62.5 → 63/100.**

Accessibility and state coverage carry the heavier weights because this surface
is handoff-bound: it is the thing a stakeholder opens from a review link.

Severity arithmetic per the rubric — Blocker −40, High −20, Medium −10, Low −4,
Nit −1, from a 100 floor:

- Heuristics: 100 − 20 − 10 = **70**
- Hierarchy: 100 − 10 = **90**
- States: 100 − 10 − 10 = **80**
- A11y: 100 − 20 − 20 − 20 − 10 − 10 = **20**
- Responsive: 100 − 40 − 20 = **40**
- Content: 100 − 10 − 10 − 4 = **76**
- Fidelity: 100 − 10 − 4 − 1 = **85**
- Theming: 100 − 20 = **80**

---

## Top fixes

### 1. [Blocker · Responsive] There are no breakpoints

Three columns are effectively fixed — a 260px contents sidebar, a fluid reading
column, and a 380px Rubi aside. Measured:

| Viewport | What happens |
|---|---|
| 1440 | Correct. |
| **768** | Reading column collapses to ~128px visible; the Course Content card clips; the top bar's controls overlap ("Notes" sits on the progress pill); Previous overlaps Rubi's composer. |
| **375** | The reading column — the course itself — **is not on screen at all**. Rubi covers the content area. Previous/Next stack on top of the "Ask Rubi about this…" input. |

No horizontal overflow at either size, which is why this does not announce
itself: nothing scrolls sideways, the content is simply gone.

**Fix:** below 1280, drop the Rubi aside to a toggled overlay (the Rubi button
in the top bar is already the natural trigger). Below 900, collapse the contents
sidebar to a drawer behind a button. The reading column is the primary content
and should be the last thing to give up width, not the first.

### 2. [High · A11y] Duplicate `<main>` and `<header>` landmarks

The player renders its own `<main>` and `<header>` while `AppLayout` already
provides both. Two `main` landmarks in one document is an authoring error, and
it makes landmark navigation ambiguous.

**Fix:** the player's top bar becomes `<div role="toolbar" aria-label="Course
controls">`; the reading area becomes `<section aria-label="Course content">`.
Keep exactly one `main`, the app's.

### 3. [High · A11y] Breadcrumb targets are 13×13 and 59×20

Measured. WCAG 2.2 SC 2.5.8 wants 24×24 minimum; a touch target wants 44.

> **PARTLY ADDRESSED 2026-09-22, after this scan.** The home crumb gained the
> visible word "Home", taking it from **13×13 to 55×20** — the width is fixed,
> the HEIGHT still fails at 20. The remaining fix is the vertical padding below;
> both crumbs still need it.

**Fix:** `min-height: 24px` plus vertical padding on both crumb controls. They
are links inside a line of text, so pad the hit area rather than enlarging the
glyph — the 13px house is the right size visually.

### 4. [High · A11y + Heuristics] Nine controls are `<span>`s

Notes, Demo, Rubi, Previous, Next, Rubi's ×, and the three suggestion chips all
render with borders, radii and button proportions, and none is focusable,
announced, or operable.

> **EIGHT as of 2026-09-22** — Demo was removed outright, which is the other
> valid answer to this finding: a control that should not be pressable does not
> need to be made pressable. The remaining eight are unchanged.

**This is the "whole thing static" decision working exactly as specified**, and
it is recorded here rather than filed as a surprise. It is still the finding a
reviewer will report first, because a bordered 38px pill reading "Notes 0" is
indistinguishable from a broken button.

**Fix, pick one:** real `<button disabled>` (announces the state, leaves the tab
order, and is exempt from contrast minimums), or visibly de-emphasise — drop the
borders and the button proportions so they read as status, not as controls.

### 5. [High · Theming] `--compass-*` has no dark definition

All six tokens (`ground`, `content`, `rule`, `edge`, `thread`, `current`) are
declared once at `:root`. Verified: with `data-theme="dark"`,
`--compass-ground` stays `#f8f6f3` and `--compass-content` stays `#f0ece6`
while `--color-surface-card` flips to `#152833`. The reading column and the
content block stay a light parchment panel inside dark chrome.

**Fix:** add a `[data-theme='dark']` block re-pinning all six, the way the rest
of `tokens.css` does. The dark values want to be warm-dark rather than the
neutral navy the app uses elsewhere, or the player stops reading as Compass.

**Not a contrast failure** — see Theming below. It is a parity failure.

---

## Findings by category

### Accessibility — 20

Items 2, 3 and 4 above, plus:

- **[Medium] One heading in the entire player.** The course title is the only
  `h1`; "Table of Contents" and "Resources" are `<p>` eyebrows and Rubi's name
  is a `<span>`. A screen-reader user has no heading structure to navigate a
  screen with four distinct regions. **Fix:** the two eyebrows become `<h2>`,
  Rubi's name an `<h2>`, styled as they are now.
- **[Medium] "Course Content" caption measures 1.28:1** (`--compass-rule` on
  `--compass-content`). It fails even the 3:1 large-text threshold. It is
  deliberately ghosted, but it is real text in the DOM.
  **Fix:** `aria-hidden` it and accept it as decoration, or darken to
  `--color-neutral-400` (3.1:1) if it is meant to be read.

**What passes, verified rather than assumed:**

- Keyboard focus is visible — the global `:focus-visible` rule gives a solid
  2px `--color-primary-500` ring, confirmed by tabbing to the crumb controls.
- TOC state is carried by **shape and colour together** (filled disc with a
  tick / navy ring / grey ring), so it does not fail "not by colour alone".
- Light-theme text contrast is strong throughout — see the table below.

### Responsive — 40

Item 1, plus **[High]** the top bar's three control groups overlap at 768 rather
than wrapping: `flexWrap: 'wrap'` is set on the bar but the groups inside it are
`flexShrink: 0`, so they collide before the bar wraps.

### Usability heuristics — 70

- **[High]** The nine inert controls (item 4) — "aesthetic and minimalist
  design" and "match between system and the real world" both take the hit: the
  surface promises five affordances it does not have.
- **[Medium]** The contents tree is not navigable, which is the one thing a
  contents tree is for. By instruction, and the honest consequence of it.

**Good:** visibility of system status is genuinely strong — the section name,
the percentage, the Now badge and the exam countdown all agree with the
dashboard. User control and freedom is over-served if anything: three ways out
(two crumbs and Close).

### Visual hierarchy — 90

- **[Medium] The breadcrumb now outweighs the page title.** The crumbs are
  13px/600 navy; the course title directly beneath is 14px/500 grey. Matching
  the house CTA exactly produced this. **Fix:** keep the size and colour, drop
  the crumbs to 500 — the CTA weight is what a *button* needs, not what a
  breadcrumb needs.

**Good:** Next is correctly the single most prominent element; scan order
(where am I → what is next → the content) matches task order.

### State coverage — 80

- **[Medium] Previous is fake-disabled.** 40% opacity on a `<span>`, with no
  `disabled` attribute and no `aria-disabled`. It looks unavailable and
  announces as nothing.
- **[Medium] No loading state** for the content area. The placeholder is a
  permanent empty state; there is no treatment for "the chapter is loading",
  which is the state this frame will spend real time in once it serves
  courseware.

**Good:** the missing-exam-date case is handled properly — the chip is omitted
entirely rather than defaulted to an invented countdown.

### Content & CTA — 76

- ~~**[Medium] "Demo"** is prototype scaffolding rendered inside a learner
  surface. It is dashed in the mock to mark it as unbuilt, which a stakeholder
  will not read as an annotation.~~ **FIXED 2026-09-22** — removed. A note in
  the design is not a control in the product.
- **[Medium] The placeholder says nothing.** The lo-fi variant it replaced
  explained itself ("this is where Compass Course content will live"); this one
  shows a ghosted caption and a grey block. A reviewer who has not been briefed
  cannot tell whether it is a placeholder or a failed load.
- **[Low] "Next"** is vaguer than the mock's "Next: Reading" — deliberate, since
  nothing here knows the next item's type, and recorded at the call site.

### Consistency & fidelity — 85

- **[Medium] Previous/Next are hand-rolled.** `.cre-cta-fill` exists for
  precisely the filled primary CTA and is what the presets pacing card uses.
- **[Low] The Rubi mark is an `<img>`** built with `new URL(...)` rather than a
  registry icon component, unlike every other glyph on the screen.
- **[Nit] The TOC rings are CSS** rather than registry icons. Justified and
  documented — there is no plain `circle` glyph and `circle-dashed` would claim
  "optional" — but it is a second way of drawing a bullet.

**Good:** no raw hex anywhere; the six new `--compass-*` tokens were added to
`tokens.css` with their rationale rather than inlined; every other icon comes
from `@/icons`.

### Theming — 80

Item 5 is the whole of it. Worth stating clearly: **this is a parity failure,
not a contrast failure.** Every text measurement in dark passes comfortably,
because the neutral and primary ramps flip correctly underneath:

| Element (dark theme) | Ratio |
|---|---|
| Course title | 9.38:1 |
| TOC item | 11.02:1 |
| "Done" label | 6.18:1 |
| Crumb "Overview" | 6.98:1 |
| Get Help | 8.47:1 |
| % chip | 12.25:1 |

---

## Measurements (light theme)

| Element | Size / weight | Contrast |
|---|---|---|
| Course title | 14 / 500 | 5.74:1 |
| "62% Complete" chip | 13 / 400 | 9.51:1 |
| TOC item | 13 / 400 | 10.37:1 |
| "Done" / "Up next" | 12 / 400 | 6.19:1 |
| Crumb "Overview" | 13 / 600 | 7.64:1 |
| Crumb "Course" | 13 / 500 | 6.19:1 |
| TOC eyebrow | 11 / 700 | 7.64:1 |
| Get Help | 14 / 500 | 6.19:1 |
| Next | 14 / 600 | 7.64:1 |
| **"Course Content" caption** | 34 / 500 | **1.28:1** |
| Previous | 14 / 600 | 11.37:1 before its 40% opacity |

---

## Not verified

- **Screen-reader output.** Semantics were measured (landmarks, headings, roles,
  labels); nothing was run through NVDA or VoiceOver.
- **Reduced motion.** Nothing animates beyond a 120ms chevron rotation, so there
  is likely nothing to respect — not confirmed against the media query.
- **Real touch devices.** The 375 and 768 findings come from viewport emulation.
- **The Rubi panel's own states.** It has none yet — one static message, no
  thread, no input handling — so there was nothing to scan.
- **The `lo-fi` variant**, deliberately out of scope.

---

## How to read the score

Most of the Accessibility and Heuristics deductions come from the **"whole thing
static"** decision, which was the right call for a look-and-feel review and is
not a defect in the implementation. If that decision stands, the honest fix for
item 4 is to make the inert controls *look* inert rather than to wire them.

The two findings that decision does **not** explain, and that are worth fixing
regardless of how static the surface stays, are **responsive (item 1)** and
**dark theme (item 5)**. Both fail silently: no error, no overflow, nothing to
notice — until a stakeholder opens the review link on a tablet, or with dark
mode on.
