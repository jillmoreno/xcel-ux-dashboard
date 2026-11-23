# UX Scan — Atlas My Courses card (2026-11-23)

Input: the running branch (`feat/atlas-updates-11-23`, `/dashboard-rebrand?demo=1&section=courses&version=jill-atlas-main`) plus the code, `src/components/compass/AtlasCourseCardFigmaV2.tsx`, compared with the shared compact card's meta block in `src/components/courses/CourseCard.tsx`.
Scope: the six design cards — Not Started, In Progress, Completed, Expired, Failed, and the out-of-scope CE package card — at desktop width, light theme.
Profile: the repo's own tokens (`src/styles/tokens.css`) and the shared `CourseCard` as the system reference, so Fidelity is scored; Theming is not — the dark theme was not exercised.

## Score

Overall: **71 / 100** (categories weighted equally for an exploration pass)

| Category | Score | Deductions |
|---|---|---|
| Heuristics | 70 | High −20 (four overlapping actions), Medium −10 ("Progress Made") |
| Hierarchy | 56 | High −20 (seven type sizes), Medium −10 (the smallest line carries the decision), Medium −10 (rows stretch to the tallest card), Low −4 |
| States | 76 | High −20 (clickable card with no hover or focus treatment), Low −4 (no loading or no-image state seen) |
| A11y | 76 | High −20 (16px link targets), Low −4 (10px pill text) |
| Responsive | 86 | Medium −10 (fixed 265px card, untested under 700px) |
| Content | 70 | High −20 (Purchase Extension goes nowhere), Medium −10 (three similarly worded actions) |
| Fidelity | 66 | High −20 (a second card system beside the shared one), Medium −10 (hard-coded 13.5px / 10px sizes), Low −4 |

Of these, four are fixed on this branch today (marked **fixed**); the rest are decisions or follow-ups.

## Top fixes

1. **[High] Four ways to act on one card.** The whole card opens Home, "Course Details ›" opens a sheet, "Review Course ›" also opens Home, and the primary button opens the course. Two of them do the same thing with different words. **Fix:** drop "Review Course ›" on finished cards (the card itself already does it) or make it the primary button's label; keep one text link.
2. **[High] Seven type sizes on one 265px card** (22 / 13.5 / 12 / 12 / 11 / 11 / 10). The shared compact card uses four (16 / 14 / 13 / 12). **Fix, partly done:** the date line is now 12 to match the description and labels. Still open: the status row at 11 and the pill at 10.
3. **[High] The decision-bearing line was the smallest.** "13 days left" sat at 11px under the progress bar. **Fixed:** 12px. Still worth asking whether it belongs above the bar.
4. **[High] Text links had 16px targets.** WCAG 2.2 asks for 24px. **Fixed:** 4px of padding above and below, pulled back out with margin so nothing moved.
5. **[High] The card was clickable with nothing but the cursor to say so.** **Fixed:** a hover lift and a 2px focus ring, reduced-motion safe (`.cre-atlas-card-v2`).
6. **[High] Purchase Extension is a dead end.** Drawn, not wired, by an earlier decision. The PRD's "No dead ends" now applies to the whole card. **Fix:** route it to the purchase-extension handoff's target once that is decided; until then, say so in the handoff (done).
7. **[Medium] Subgrid rows stretch to the tallest neighbour.** One four-line title or one wrapping line of authority pushes every card's pills down. **Partly fixed:** the title clamps at three lines. The labels row still stretches; the stacked layout is the shorter of the three arms.
8. **[Medium] "Progress Made"** is the project's word, not the learner's. The PRD wants Failed and Expired. Open with Jillienne.

## Findings by category

### Heuristics
- [High] Consistency: "Review Course ›" and the card click both open Home; "Course Details ›" opens a sheet; the button opens the course. **Fix:** see top fix 1.
- [Medium] Match to the real world: "Progress Made" on an expired or failed course. **Fix:** the status itself.

### Visual hierarchy
- [High] Seven sizes, two weights, one colour for most of the body — the description, labels, status row and date read as one grey block. **Fix:** three body sizes at most; let the date line carry weight or colour (Warning 700 inside the week, as the Home card does).
- [Medium] The date line sits under the progress bar; the task order is "how long have I got" before "how far am I". **Fix:** consider date above the bar, or merge the status row and date line into one.
- [Medium] Rows stretch to the tallest card in the row (facts row 52px for one line of text). **Fix:** clamp the inputs (done for the title) or drop the subgrid for the facts row.
- [Low] Two "›" links in the same style at different heights (one at the pill, one under the button).

### State coverage
- [High] No hover, pressed or focus treatment on a clickable article. **Fixed.**
- [Low] No loading skeleton and no placeholder image seen; the PRD asks for a default image. **Fix:** a default cover in `atlasCourseCardFor` when `imageUrl` is empty.
- Verified present: the five lifecycle states, the no-description fallback, the no-score failed card, the Expired pill in charcoal.

### Accessibility
- [High] 16px-tall text links. **Fixed** to 24px.
- [Low] Pill labels at 10px (contrast 5.9:1 to 10.4:1, all pass). **Fix:** 11px if the pill can take it.
- Pass: body text 4.9:1 on Primary 100 and 5.4:1 on Secondary 100; button 7.2:1; progress bar carries `aria-valuenow`, min and max; the article has an accessible name; the image is decorative with empty alt. Status is never colour alone.
- Not verified: screen-reader announcement of the article as actionable (it has `tabIndex` and a key handler but no role); the kebab menu is off.

### Responsive
- [Medium] Fixed 265px cards in an auto-fill grid; nothing under 700px has been laid out (a known gap on the handoff).

### Content & CTA
- [High] Purchase Extension goes nowhere. See top fix 6.
- [Medium] "Review Course ›", "Course Details ›", "Resume Course" — three verbs for a learner who wants one thing. **Fix:** see top fix 1.
- Pass: the date lines are plain and dated; "Description coming soon" is honest; buttons name the action.

### Fidelity
- [High] A second card system next to the shared `CourseCard`: its own title face, its own pill set, its own meta style. The labels control now offers the shared card's shape as one of three arms. **Fix:** decide which card the product keeps; the handoff's first decision row has flipped once already.
- [Medium] Hard-coded 13.5px button text and 10px pill text; the type scale tokens are not used on this card.
- [Low] Button radius 9 and card radius 12 are literals rather than tokens.

## Not verified
- Dark theme: the charcoal pill and the hover shadow were not checked under `[data-theme='dark']`.
- Keyboard order across a row of six cards and into the sheet.
- The Netlify branch build was not re-checked after today's last push; the local server was.
