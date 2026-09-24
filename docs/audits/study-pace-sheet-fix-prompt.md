# Fix prompt — Study Pace sheet

Paste everything below the line into Claude with this repo connected.
Companion audit: `docs/audits/study-pace-sheet-audit.md`.

---

Make a new branch called `fix/study-pace-sheet` from main and switch to it.

Then rebuild `src/components/learning/StudyPaceSheet.tsx`. It is currently 746
lines of inline style objects with no header, no scroll container and no state
contract, and it clips its own footer. The full findings are in
`docs/audits/study-pace-sheet-audit.md` — read it first.

## Scope

**In scope:** `src/components/learning/StudyPaceSheet.tsx`, a new sibling
stylesheet or an addition to `src/styles/tokens.css` for its classes, and
`src/test/StudyPaceTile.test.tsx` where copy changes force it.

**Out of scope — do not touch:**

- `src/components/ui/Sheet.tsx`. Its missing focus trap, sr-only title and
  absent scroll region are known and ticketed separately. Work around them from
  inside the children, which is possible because the panel is already
  `display: flex; flex-direction: column`.
- `src/lib/studyPace.ts` — **one exception**, below. No model or maths changes.
- `StudyPaceTile.tsx`. The tile operates nothing; that stays true.

## What must not change

These are the reasons this component exists. Keep them:

1. The four groups, in this order: aim → days a week → exam date → study plan.
2. `BindingNote` — naming which ceiling is doing the work *and* naming the date
   it beat. Keep `data-binding` and all three of its messages.
3. The weekday picker appearing only under the plan switch, and ticking a day
   being authoritative for `nights` once it's on.
4. `presetLabel`'s conditional "Relaxed" → "Full window".
5. `SessionPreview` showing real dated sessions.
6. Every `data-*` attribute: `data-preset`, `data-nights`, `data-weekday`,
   `data-session`, `data-binding`. Tests hold these.

## The fixes, in priority order

### 1. Give the sheet a header / scroll body / pinned footer — P0

Render three flex children into `Sheet`, not two:

```
<header>   flex: none   — visible title + a close button
<div>      flex: 1; min-height: 0; overflow-y: auto   — all four groups
<footer>   flex: none   — Save + Reset, pinned, with a top border
```

`min-height: 0` on the scroll body is load-bearing — without it the flex child
refuses to shrink and the clipping bug survives the fix.

The header carries the visible title "Adjust your pace" and a close button
(`aria-label="Close"`). `Sheet` already renders an sr-only title for
`aria-labelledby`, so mark the visible one `aria-hidden` to avoid a doubled
accessible name.

Horizontal padding lives on the header, scroll body and footer individually —
not on a wrapper — so the scrollbar sits at the panel edge.

**Verify by building it, not by reasoning about it:** open
`/dashboard-rebrand?demo=1` on the branch build, open the sheet, turn on *Create
a study plan*, and confirm Save is reachable at a 720px-tall viewport.

### 2. Settle the save contract — P0

Right now `set()` writes preset/nights/examDate straight through to the parent
while `plan` waits for the button. Pick **one** model and make the footer tell
the truth. Preferred:

**Everything is a draft.** Hold all four in local state, seeded from `choices` on
open. Save commits the whole thing via one `onChange`. Add a **Cancel** button
beside Save, and make Escape and scrim-click route through the same discard path.
The sub-line becomes "Nothing is saved until you press Save pace" — or drops the
live-repricing sentence entirely.

If you take the other branch instead (no Save at all, changes are live, button
becomes *Done*), say so in the commit message and delete the sub-line's
"re-prices as you change it" claim, because it stops being the interesting fact.

Either way the existing tests that click `Save pace` must still pass — keep that
exact button label for the no-plan case.

### 3. Move every value onto tokens — P1

Delete all nine inline style objects at the bottom of the file. Author the
sheet's styles as CSS classes prefixed `cre-pace-sheet__` in a stylesheet, using
CSS variables throughout. No raw px for font-size, no raw hex, no raw
font-family, per `CLAUDE.md`.

Type floor: **nothing below `--text-body-sm` (14px).** That kills the 9px chip,
the 10px group labels and micro-label, the 10.5px day toggles and the 11.5px
hints. If 14px everywhere makes the sheet too tall, cut copy (§5) — do not cut
type size. If the scale genuinely lacks a caption step, add one token to
`tokens.css` with a comment saying why, rather than hand-typing 12px in nine
places.

Spacing: collapse `gap: 22/11/9/7/6/5/4` onto the existing spacing scale.
Radii: `var(--radius-*)`, never `borderRadius: 6`.
Shadow: replace `rgb(0 0 0 / 0.25)` with a token.

Then check both themes. `--color-primary-100` as the selected-row ground and
`--color-surface-card` as the radio dot's inner ring both assume a light
background — confirm the selected aim row and the switch still read correctly
under `[data-theme='dark']`.

### 4. Fix the accessibility failures — P1

- **Roving tabindex + arrow keys** on both radio groups (aim rows, night
  segments): one tab stop per group, `ArrowUp`/`ArrowDown` (aim) and
  `ArrowLeft`/`ArrowRight` (segments) move and select, `Home`/`End` jump.
- **`aria-disabled`, not `disabled`,** on the "won't fit" aim row, so it stays
  focusable and can explain itself. Give it an `aria-describedby` pointing at a
  one-line reason.
- **Visible `:focus-visible`** on every control — a 2px ring offset from the
  border, defined in CSS now that inline styles are gone.
- **44×44 minimum** on day toggles, *Clear*, and *Reset to recommended*.
- **Spoken durations.** `formatEvening` returns `1¾ hours`; keep it visually and
  add a `.cre-sr-only` span with a spoken form. This is the one permitted
  addition to `src/lib/studyPace.ts`: a pure, additive
  `formatEveningSpoken(mins): string` returning "1 hour 45 minutes", with tests
  in `studyPace.test.ts`. Do not change `formatEvening` itself — the tile and
  the smoke suites read its output.
- **Style the two native inputs** to match the sheet's other controls: same
  height, border, radius and font as `Segment`. Make the date/time picker icon
  visible in dark theme (`color-scheme` on the input is the cheap fix).

### 5. Cut the copy by roughly half — P2

Target: under 55 words of explanatory prose in the whole sheet, down from ~110.

- **Delete** "Everything below re-prices as you change it" — the numbers visibly
  change, and it contradicts the Save button.
- **Delete** "We suggest the fewest days that keep an evening under 2 hours."
  Keep only "Fewer days means longer evenings, not less work" if anything.
- **Cut** the plan switch's body to one clause. It currently restates the
  nights and the evening length already shown two groups above.
- **Keep in full**: the `BindingNote` messages and the exam buffer sentence.
  Those carry information the learner cannot get anywhere else. *(The exam-buffer
  sentence may be shortened but must keep the "whichever comes first" rule.)*
- **Re-label group 3** from the question *"Have you booked your state exam?"* to
  the field's purpose — e.g. "Your state exam". The field keeps its
  `/Exam date/` label, which tests pin.

### 6. Make the group-2 jump visible — P2

Ticking a weekday in group 4 rewrites `nights` in group 2, correctly and
silently. Add a one-line, `aria-live="polite"` note under the segments when the
plan is driving them — e.g. "Set by the days you picked below." Do not remove
the behaviour.

Also fix the display/setter mismatch: `Segment`'s `checked` currently compares
against `selected.nights` (the model's derived value) while acting as a setter
for `choices.nights`. Make the control reflect the value it sets.

### 7. Consider, don't assume — progressive disclosure

The sheet opens in full configuration mode with four independent variables, when
the default answer is right for most learners. Collapsing groups 2–4 behind a
"Change how this is worked out" disclosure would halve the panel.

**Do not do this without asking.** Build the fixes above first, then report
whether the sheet still feels too dense at 14px type, and propose the disclosure
as a follow-up with a screenshot. It changes the argument the component makes,
which is Jillienne's call.

## Tests

Update `src/test/StudyPaceTile.test.tsx` in the same commit for any pinned string
you change — the coupling table is at the end of the audit doc. Then **add**:

1. The scroll body exists and is the scrolling element (assert the class /
   `overflow-y` on the body wrapper — jsdom can't measure, so assert structure).
2. The footer is a sibling of the scroll body, not inside it.
3. A visible heading "Adjust your pace" is in the dialog, and a Close button.
4. Arrow keys move selection within each radio group, and each group is a single
   tab stop.
5. The "won't fit" row is focusable and `aria-disabled="true"`.
6. If you took the draft-state route: changing a preset and pressing **Cancel**
   leaves the tile's pace unchanged; pressing **Save** applies it.
7. `formatEveningSpoken` unit tests in `studyPace.test.ts`, if you added it.

## Verify

```bash
npx tsc -b --noEmit
npx vitest run
npm run smoke
```

All three. `npm test` does not run the smoke suites.

Then commit everything and push to `fix/study-pace-sheet`, and tell me the
Netlify branch URL plus `/dashboard-rebrand?demo=1` so I can review it.

## Report back with

- Which save contract you chose, and why.
- Any copy you cut that you think was load-bearing.
- A before/after count of raw px values in the file.
- Whether the sheet still needs progressive disclosure at 14px type.
