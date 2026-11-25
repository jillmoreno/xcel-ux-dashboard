# Atlas Home on a phone — a scan, 2026-11-25

Jillienne: "lets look at the mobile screens for the Home page, and audit, make
suggestions to edit." Read off the running page inside the review bar's Mobile
frame (402 × 874, `home-breakpoint: mobile`), at Not Started 0% and Developing
36%, on `feat/atlas-updates-11-23`. Measurements are in the frame's own pixels.
Jillienne, the same day: "start with your suggestions yes" — 1, 2, 3 and 7 are
applied in `src/styles/home-breakpoints/mobile.css` (the block headed "Home on
a phone — the 2026-11-25 scan"); 4, 5, 6 and 8 are still open.

## 1. The page scrolls sideways — the Active Courses strip (applied)

The "ACTIVE COURSES:" label and the three course chips sit in one 536px row
inside a 355px column, and the frame's own scroll width is 552 against a 387
viewport. The second and third chips are off the right edge, and the whole
phone drags left to reach them; a horizontal scrollbar shows along the foot.
Every other finding is smaller than this one.

Suggested edit: the label on its own line, and the chip row as its own
horizontal scroller (`overflow-x: auto`, scroll-snap on the chips, a fade at
the right edge so the cut-off chip reads as "more"). The page itself never
scrolls sideways.

Applied as a scroller for an hour, then taken off the phone altogether the
same afternoon (Jillienne: "remove this on mobile"). The phone changes its
active course through an Edit link on the head's Current Course line, which
opens My Courses; the strip stays on the desktop.

## 2. The progress tabs clip at the edge (applied)

"Course Progress · Study Pace · Estimated Completion" run from 16 to 376 in a
371px frame: the last tab loses its final 5px. Suggested edit: the three tabs
share the width equally on the phone (each about 118), or shorter labels there
("Progress · Pace · Completion").

Applied as: the tabs back at Figma's 12 with 6px of padding, still sized to
their text — about 341 in the 357 row. Equal thirds did not fit the long label.

## 3. The course-head buttons wrap differently by state (applied)

Not Started draws Course Overview (132) beside Begin Course (122). Developing
draws Resume Course (138) and the pair no longer fits the 275px head
(132 + 8 + 138), so Resume drops under Overview and the primary ends up second.
Suggested edit: on the phone the buttons always stack, full width, 44 tall,
the course's own verb on top and Course Overview under it, which is the
sheet's order too.

## 4. Tap targets under 44

| Control | Height |
|---|---|
| English · Help | 16 |
| Course Overview · Begin / Resume Course | 32 |
| Add Date | 33 |
| The journey rows, Exam Information, Applying for a License | 36 |
| The three progress tabs | 32–33 |

Suggested edit: padding, not type — the rows and buttons to 44, the
English/Help band to a 32 strip with the words centred in it.

## 5. The title has 275px and uses three lines (applied — the second way)

Applied the same day, Jillienne: "remove the padding on side and have whole
section be this light blue background. edge to edge. Flat corners." The head
bleeds over the page's 16 on each side with no corners and 16 inside, so the
title has 355 and sits on two lines at its 32; the size is unchanged.

The head card is inset 20 inside the page's 16, so the title starts 56 in from
the phone's edge; at 32/34 the serif title wraps to three lines on the two
longest course names. Suggested edit: the title at 26/30 on the phone (one step
down, as the My Courses card's title took), or the head card full-bleed at
402 with its own 16, which gives the title 40px more.

## 6. The progress panel is lighter than its tabs (applied — the first way)

Applied the same day, Jillienne, with the desktop panel selected: "on mobile,
this section UI should remain the same, do not shrink into tabs." A fourth
phone layout, the stack, is the phone's default: the ring card as the desktop
column draws it — the dial at 149 under its centred eyebrow, Study Pace and
Estimated Completion under their rules — at the phone's width. The corner
switch still cycles to the two columns, the list and the tabs.

At 36% the dial is 34px beside a 27px figure in a 44px-tall panel, under a
tab row that is heavier than anything in it; two of the three facts (pace,
completion) are behind taps. Suggested edit, to decide: one stacked summary
card on the phone — progress, pace, completion as three rows with their
figures — instead of the tabs, so nothing is hidden on a screen that already
scrolls; or keep the tabs and give the dial 56px and the figure 32.

## 7. The learner pill (applied)

"(Learner Mode)" beside the avatar takes 129px of a 355px header row. The
stylesheet already shows the icon alone for the name; the mode suffix should
go with it on the phone, leaving the alerts, the avatar and the menu.

## 8. The page ends on a row

After "Applying for a License" the frame shows about 80px of empty card and
stops: no footer, no end mark. Minor — 24 of bottom padding and the product's
footer, when there is one, so the end reads as the end.

## What is right and should stay

The three-bar menu carrying Home, My Courses, My Certificates and the three
information pages; the step headers (12 letter-spaced over the serif); the
journey rows at 16 over 36 with the active row wrapping its count; the
Study Pace and Estimated Completion panels' copy and figures; the access line
under the title wrapping to two lines rather than clipping.
