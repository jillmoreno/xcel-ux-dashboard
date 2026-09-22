# Audit — Study Pace "Adjust your pace" sheet

**File:** `src/components/learning/StudyPaceSheet.tsx` (746 lines, one file, no CSS)
**Opened from:** `StudyPaceTile` → *Adjust*, on the Testing 2 dashboard version
**Audited:** 2026-09-22
**Scope agreed:** fix `StudyPaceSheet.tsx` only. `src/components/ui/Sheet.tsx` is
out of bounds this pass — findings that belong to it are listed at the end as
*deferred*, and the fix works around them from inside the sheet's children.

---

## The one-line version

The sheet is a good **argument** rendered as a bad **object**. The four-group
structure and the two-ceiling honesty note are the right calls and should
survive. What is wrong is that the file was written as 746 lines of inline style
objects with no header, no scroll container, no tokens and no state contract —
so it clips its own footer, saves before you press Save, and renders at nine
different hand-typed font sizes, six of which are below the design system's
smallest.

---

## P0 — functionally broken

### 1. The sheet clips its own footer, with no way to scroll to it

`Sheet` renders the panel as `display: flex; flex-direction: column;
overflow: hidden` (Sheet.tsx:74–76). `StudyPaceSheet` hands it two plain
`<div>`s — the content stack and the footer — and **neither is a scroll
container**. Nothing in the tree sets `overflow-y: auto`.

At 460px wide with *Create a study plan* switched on, the content runs to roughly
1,050px: four groups, five paragraphs of hint copy, seven day toggles, a time
field and a five-row session preview. Anything past the panel height is clipped
and unreachable — **including *Save pace* and *Reset to recommended***.

This is the bug in the screenshot. The footer floating mid-panel above a field of
empty space is the content box being taller than what the frame can show.

**Severity: P0.** A learner on a 13" laptop who turns on the study plan cannot
save it. It is also invisible to the existing tests, because jsdom has no layout.

### 2. "Save pace" is a lie for three of the four groups

`set()` (line 102) calls `onChange` immediately, so **preset, nights and exam
date are committed to the tile's state the instant they are clicked**. Only
`plan` is held in local draft state and waits for the button (line 242).

Consequences:

- Pressing Escape, clicking the scrim, or closing any other way **keeps** the
  pace change. There is no cancel, and no control that says there isn't one.
- *Save pace* does nothing at all for three of the four groups it appears to
  govern.
- The sub-line says *"Everything below re-prices as you change it"* — which is
  true, and which quietly contradicts the button 700px below it.

Pick one model. Either everything is draft and Save commits it, or nothing is and
the button becomes *Done*. The current split is the worst of both.

### 3. No visible title, and no close control

`Sheet` renders the title **screen-reader-only** (Sheet.tsx:83–85). The learner
opens a panel that begins with body copy — no name, no ✕. Escape and scrim-click
are the only exits, and neither is discoverable.

The sheet also supplies no padding of its own, so content sits flush against the
panel edges; *Reset to recommended* runs off the right edge in the screenshot.

---

## P1 — accessibility

### 4. Neither radio group is keyboard-operable as a radio group

Three `role="radio"` aim rows and four `role="radio"` night segments, each a
natively focusable `<button>`, with no roving `tabindex` and no arrow-key
handler. The APG pattern is **one tab stop per group, arrows to move within it**.

As built: seven extra tab stops, and arrow keys do nothing. A screen reader
announces "radio, not checked" with no "2 of 3" position.

### 5. Every font size in the file is below the design system's floor

Eight distinct hand-typed sizes, none of them a token, none of them ≥14px:

| Where | Size | |
|---|---|---|
| `RecommendedChip` | 9px | |
| `groupLabel`, the "A NIGHT" micro-label | 10px | uppercase, `--color-text-tertiary` |
| `DayToggle` | 10.5px | |
| `SessionPreview` footer, `PaceChip` | 11px | |
| `hint` — every paragraph in the sheet | 11.5px | `--color-text-secondary` |
| `SessionPreview` rows | 12px | |
| `input`, `Segment` | 12.5px | |
| Aim row title, plan title | 13px | |

`tokens.css` stops at `--text-body-sm: 14px`. Nothing here uses a type token.

Worse, the team has already been here: the comment on `--color-text-tertiary`
(tokens.css:277) records that this exact colour was darkened from `neutral-600`
because it *"read only 3.9:1 on white at 11px (WCAG AA fail, audit finding #6)"*.
This file reintroduces the same failure at 9–11.5px.

### 6. Touch targets under the minimum

Day toggles are ~30px tall. *Clear* and *Reset to recommended* are ~17px of
underlined text with zero padding. WCAG 2.1 AA asks for 44×44 (2.5.5, AAA at
this level but the house floor is 44).

### 7. Focus is effectively invisible

Every interactive element paints its own 1px border and none defines
`:focus-visible` — inline style objects can't express a pseudo-class. The
keyboard ring either collides with the existing border or is absent. There is no
way to see where you are in a panel made almost entirely of custom buttons.

### 8. The "won't fit" preset is removed from the tab order

`AimRow` sets `disabled` on a `role="radio"` (line 293). A native `disabled`
button is unfocusable, so a keyboard or screen-reader user never encounters the
option and never learns *why* it won't fit — which is the most important thing
that row has to say. Use `aria-disabled` and keep it focusable.

### 9. Unicode fractions break the spoken output

`formatEvening` returns `1¾ hours`, `2¼ hours`. VoiceOver reads `¾` unreliably
(commonly "1 hours"), and `fontVariantNumeric: 'tabular-nums'` — set on that span
— has no effect on fraction glyphs anyway. Keep the glyph visually; add a spoken
form ("1 hour 45 minutes") for AT.

### 10. The two native inputs are the only unstyled controls in the sheet

`<input type="date">` and `<input type="time">` inherit the browser's chrome: the
`mm/dd/yyyy` placeholder, the tiny system calendar glyph, and — in dark theme —
a picker icon that vanishes against the dark field. They also sit at 12.5px in a
panel whose own controls are at 13px.

---

## P2 — why it reads as "ridiculous": density and voice

### 11. ~110 words of prose before a single decision

Four groups, each with an explanatory paragraph, plus the sub-line and the
binding note. Three of the four paragraphs explain **the algorithm** rather than
the choice in front of the learner.

### 12. The UI narrates itself

- *"Everything below re-prices as you change it."*
- *"We suggest the fewest days that keep an evening under 2 hours."*
- *"Fewer days means longer evenings, not less work."*

Each is a designer's note to the learner about how the product was built. The
first is also redundant — the numbers visibly change.

### 13. The same number, three times

"1¾ hours a night" appears on the selected aim row, again inside the plan
switch's body copy, and again as the session end-time in the preview.

### 14. Four questions open at once, when the default answer is already right

There is no "here's your pace — change it if you like". The sheet opens in full
configuration mode and asks the learner to evaluate four independent variables
before they can start studying. Most learners' answer is *Recommended, 5 nights,
no exam booked, no calendar* — which is what it already opens on.

### 15. Group 2 silently rewrites itself from group 4

`Segment`'s `checked` compares against `selected.nights` — the **model's** value,
not `choices.nights`. So the segmented control displays a derived number while
acting as a setter. Tick a weekday in group 4 and `set({ nights: next.length })`
fires (line 210), the segment jumps, and nothing tells the learner why. The code
comment defends this as correct; it is, and it is still invisible.

### 16. Group 3 asks a yes/no question and offers a date field

*"Have you booked your state exam?"* → a field labelled *"Exam date
(optional)"*. Two different asks stacked. The heading should be the field's
purpose, not a question the field can't answer.

---

## P3 — codebase conventions

`CLAUDE.md`: *"Reference tokens via CSS variables — never raw hex / px /
font-family."*

This file contains **47 raw pixel values across 8 distinct hand-typed font
sizes, raw line heights and raw border-radii**, and defines every style as an
inline object. The only `overflow` declaration in all 746 lines is on the
session-preview box — which is finding #1 restated as a grep. Specifics worth
naming:

- `borderRadius: 6` (DayToggle) and `borderRadius: 4` (RecommendedChip) sit in
  the same file as `var(--radius-md)`.
- `boxShadow: '0 1px 2px rgb(0 0 0 / 0.25)'` — raw colour (SwitchRow, line 509).
- `gap: 22 / 11 / 9 / 7 / 6 / 5 / 4` — seven ad-hoc spacing values, no scale.
- Dark theme is untested: `--color-primary-100` as a selected-row ground and
  `--color-surface-card` as the radio dot's inner ring both assume a light
  background.

This is the actual reason the sheet doesn't look like the rest of the product.

---

## What to keep

Not everything here is wrong, and the fix should be told so explicitly:

- **The four-group order**, and the argument in the file header for it.
- **The two-ceiling `BindingNote`.** Naming which deadline is doing the work,
  and naming the date it beat, is the best thing in this component.
- **The weekday picker living only under the plan switch**, and days-a-week
  being authoritative once it's on.
- **`presetLabel`'s conditional "Relaxed" → "Full window"** on a long course.
- **`SessionPreview`** showing real dated sessions rather than an abstraction.
- **The model.** `src/lib/studyPace.ts` is sound and covered by
  `studyPace.test.ts`. Nothing in this audit asks for a maths change.

---

## Deferred — belongs to `Sheet.tsx`, out of scope this pass

1. **No focus trap.** Tab from the last control leaves the dialog and lands on
   the page behind it, which is still rendered and still interactive.
2. **The title is sr-only**, so every sheet in the app is headerless. The fix
   below renders its own visible header inside the children; when `Sheet` is
   repaired, that becomes duplication to remove.
3. **No scroll region and no padding**, so every consumer has to build its own.
4. **No `aria-describedby`**, and no `inert`/`aria-hidden` on the background.

Worth its own ticket — it affects every sheet in the product, not just this one.

---

## Test coupling — read before changing any string

`src/test/StudyPaceTile.test.tsx` pins these exact strings. Copy changes below
require the same-commit test update:

| Test | Pinned string |
|---|---|
| :93 | accessible name matching `/a night\|won't fit/i` on the aim rows |
| :73 | `/Full window\|Relaxed/` |
| :74, :195, :212 | button named exactly `Save pace` |
| :94 | radiogroup named `Days a week` |
| :95 | label matching `/Exam date/` |
| :96, :159 | switch named `Create a study plan` |
| :123 | `These come from your course access` |
| :135 | `exam date is the one doing the work` |
| :149 | `access is still the one doing the work` |
| :158, :160 | group named `Study days` |
| :161 | label `Usual start time` |
| :207 | button named `Reset to recommended` |
| :174 | `[data-session]` nodes exist |
| :104 | `[data-preset="recommended"]` |
| :171 | `[data-weekday]` on the day toggles |

Keep every `data-*` hook. They are the seam the tests hold, and none of them
costs anything visually.
