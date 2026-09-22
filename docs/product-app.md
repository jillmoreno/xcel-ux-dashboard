# The XCEL product app

Everything under `/dashboard-rebrand` — the dashboard versions, Readiness,
the Study Journey, notifications, the flag catalog, and the migration that
brought it here. **This is the file most design work needs.**

> Moved out of `CLAUDE.md` on 2026-09-21, verbatim. The root file is the map;
> this is one of the five surfaces it points at. Cross-references to "CLAUDE.md"
> in older code comments mean this material.

---

### The Study Plan is its own page — moved 2026-09-09

The Study Plan was a TAB on the Learning Path page. It is now a rail section
(`study-plan`) sitting directly under Home, because it is the pacing tool a
learner opens every visit — which is why it was that page's DEFAULT tab before.
Same `InlineStudyCalendar`; what changed is where it lives, not what it is.

**Moved, not duplicated.** The tab is gone. Two doors onto one surface is what
got `recommended-card-ab-demo` and the four testing tiles archived, and a test
asserts the tab's absence so re-adding it without removing the page fails.

**One constant drives it**, `studyPlanHasOwnPage` in `LearningPathPage`, because
THREE things follow and they have to move together — the same failure mode the
`supportsStudyPlan` comment in that file describes:

1. The Study Plan tab goes.
2. **The Progress Tracker tab comes BACK.** It was hidden for XCEL only because
   its stats showed in the band above the calendar; that band left with the
   calendar, so without this the page has one tab and no progress view at all.
3. The default tab re-points, or a pre-licensing learner lands on Certificates
   with an unselected Progress Tracker to its left.

**The trap, and it bit during this change:** `StudyProgressPanel` was keyed on
`showStudyCalendar`, which was quietly doing two jobs — "is the Study Plan a tab
here" and "does this brand have study-plan progress to show". Switching the tab
off dropped the branch through to the Goal Tracker PLACEHOLDER, so the tab that
came back rendered nothing. It reads on `hasStudyPlan` now, and the test asserts
the placeholder is absent rather than only that the tab exists.

Which plan the page shows: `?id=` when present, else `activePathIdFor(brand)`.
XCEL has TWO paths with a plan, so without the param the section would silently
always show the first. A path with no plan is not an error — `InlineStudyCalendar`
renders its own empty state — and the rail item is gated on `supportsStudyPlan`,
so a brand without the feature never reaches it.

### Jump Back In — the Today's Tasks variant

`clp-jump-back-in` on the Dashboard Rebrand flag page. The white Jump Back In
card inside the full-width Current Learning Path band has two layouts:

- **Up Next** (default, shipped) — a 168px cover, then title / meta / progress,
  the Resume CTA, and the next two not-started COURSES.
- **Today's Tasks** — the resume block compressed to ~30% of the card (cover
  LEFT at 84×56, title and meta RIGHT of it, progress and CTA below), with the
  space given to today's tasks from the learner's STUDY PLAN.

**Continuing Ed shows tasks too, as of 2026-09-09** — see `ce-study-plan`
below. Before that the CE path had no plan and the card fell back to Up Next.

**`TaskRow` in a ~255px card needed a fix, and it shipped broken for two
commits.** Its status cluster is `flexShrink: 0` at ~110px, so the title column
collapsed to **48px** and `overflow-wrap: anywhere` broke words mid-syllable
("Insura / nce"). Pre-licensing titles were long enough to wrap badly but short
enough that it read as ugly rather than broken; a longer CE title made it
obvious. `compact` now sets `flexWrap: 'wrap'` and gives the title a 150px
floor, so the status drops to its own line. Nothing wraps at the Study Plan
page's width, so that surface is untouched.

**It requires the CURRENT PATH to have a plan, not just the brand**, and that is
the trap worth knowing. `studyCalendarFor` falls back to STC's Series 79 plan
for any id it does not recognise — its own docstring calls putting securities
tasks under an insurance path "the one outcome worse than the empty state". The
band shows whichever path is current, and XCEL's CE path deliberately has no
plan, so the first build of this rendered **"Complete Greenlight 1" under
Florida Life & Health CE**. Types were clean and every test passed; only opening
the page caught it. `hasStudyCalendarFor` guards it now and the card falls back
to Up Next, so switch Education to **Pre-Licensing** to see the variant.

**Two numbers are judgement, not measurement**, and both are named constants:

- The resume block lands at **~30%**, not the quarter it was briefed at. The
  floor is the CTA's 44px touch target — it is the biggest item in the block,
  and hitting 25% means making the primary action harder to tap.
- `TODAYS_TASKS_VISIBLE` is **2**, and it was 3 until the rows became the Study
  Plan's real `TaskRow` (2026-09-09). That component is ~112px in this column
  against the ~66px of the bespoke row it replaced — the title wraps to two or
  three lines in a ~250px card, and an in-progress task carries a progress bar.
  Measured at a narrow pane and at 1600px: **two either way**, and not a
  narrow-window artifact, because the card gets SHORTER as it gets wider (its
  height comes from the navy half). Three need ~356px against 249 available,
  and the difference cannot be bought from the resume block, which is 179px
  against a floor of ~126. **The row style and "up to three" are in conflict;
  the row won**, because matching the Study Plan was the later decision.

**The rows are the Study Plan's own `TaskRow` in `compact`**, not a lookalike.
This started as a bespoke row that merely matched the visual language; reusing
the real component is what keeps the two surfaces from drifting, and it brought
what the copy had missed — the status badge, the progress bar on an in-progress
task, the kebab, and the title-prefix affordances (Read / View / Complete). A
test asserts one of those rather than only that rows render, so a later
"simplify this row" cannot quietly re-fork them.

**The card is titled "Jump back in"**, in the same `eyebrowBase` as its own
"Today's tasks" heading and the navy half's "Current Learning Progress" — three
labels at one level of hierarchy. A test asserts the two eyebrows share a style
rather than only that both exist, because the regression is tweaking one and
skipping the other. The title is on the VARIANT only; the shipped Up Next layout
stays untitled.

**The heading carries the day's count** — "Today's tasks (2)" — and it is the
count of the whole DAY, not of the rows on screen. On an overflowing day that is
the distinction that matters: six scheduled, three shown. Omitted at zero, where
the empty state already says nothing is scheduled.

**View all is ALWAYS shown**, not only when the day overflows. It is the route
into the Study Plan from here, and gating it on the workload made that route
appear and disappear. It carries NO number — it used to read "View all 6", and
once the heading counted the day the two sat inches apart saying the same thing.

Two layouts were tried for the leftover height and both are wrong, so do not
re-reach for them: `justify-content: space-between` on the list opens a 139px
hole between two rows on a light day, and letting the cover absorb the slack
grows it to 174×116, which squeezes the title into three lines because the white
half is only ~250px wide. The cover stays fixed at 84×56 and the slack falls to
the bottom of the card, which is what a light day should look like.

### The logo is real now — and dark mode is not (2026-09-09)

`Logo` rendered the text wordmark "XCEL" from the migration until now, because
the artwork was not in the repo. It is: `/brand/xcel-logo.webp`, the approved
2024 lockup (`XCEL24_Logo_RGB_45px-2x` from the Colibri Logo Library), 248×91.

A **raster webp, not an SVG**, because that is the export that exists — 2.3KB,
crisp to ~124px wide, which covers every call site. Swap in the vector if the
lockup ever needs to go large.

**`sizeBy: 'height'`, and the default would have been wrong.** `sizeBy` defaults
to `'creWidth'`, which width-matches a reference lockup; at the header's 52px
that renders this 2.725:1 mark **304×112** — three and a half times the 72px
header's own height. By height it is 142×52. This is the exact case the
`sizeBy` docstring warns about, and a test asserts the numbers.

**The brand guide's 95px minimum WIDTH is load-bearing**, which is why
`MOBILE_LOGO_HEIGHT` in `Header` is **35 and not 34**: at 34 the lockup is 93px
wide. One pixel, and it is a consequence of the artwork's aspect — re-derive it
if the lockup is ever replaced.

**The `mark` variant is deliberately absent**, so `IMAGE_SOURCES` is now
`Partial` per variant. The square "White Knight" is separate artwork that is not
in the repo; pointing `mark` at the lockup would render a wide horizontal logo
wherever a square one was asked for. Nothing uses `mark` today.

**KNOWN GAP — the dark header, and it is older than this change.** The lockup is
full-colour: charcoal wordmark (#3a3a3a) and red knight (#9a1b1e), measuring
11.37:1 / 8.24:1 on white and **1.33:1 / 1.84:1** on the rebrand shell's dark
header (#152833). Invisible.

It is not a regression. The text wordmark it replaced sat on `--color-brand`,
which is `#2d5872` in dark — **1.99:1** on that same header. **Dark mode has
never had a legible logo here**; the lockup deepens an existing hole rather than
digging a new one. Recorded rather than papered over, because the two look
identical from the outside and only one of them is this change's fault.

The fix is the WHITE variation the brand library ships, dropped in as the `dark`
source — the swap mechanism is already built and needs no code. **Do not
recolour the full-colour file to approximate it**: that is authoring brand
artwork, and an official white lockup already exists.

### The week-summary band — "This week" (2026-09-09)

`StudyWeekSummary`, on Home directly **above Recommended for You**: the last
thing in the learner's own zone before the discovery zone starts. Behind
`dashboard-week-summary`, default on.

**ONE week as seven DAY CELLS, Sun → Sat** — the Study Plan's own month grid
with its current row lifted onto Home: same day order, same "today" treatment,
same task-count line.

**The first build was a list of WEEK rows** (theme, pips, status chip) and was
wrong. That answered "how is the plan going", which the Current Learning
Progress band directly above already answers. The question a learner scanning
Home is actually asking is **which DAYS have work on them**, and only a day grid
answers it. Same reason the cells show a COUNT and not task titles: the titles
are one click away, and seven columns of them is the plan itself.

**Empty days are shown, with an em dash rather than "0 tasks".** The empty ones
are the point of a calendar row — a blank Wednesday says "nothing due", which a
list of only-the-busy days cannot. A zero, meanwhile, invites the reading that
something failed to load.

**It is a SUMMARY, not a second Study Plan.** No per-task action anywhere; every
cell is a link into the plan, and a test asserts each cell contains links and NO
buttons. That guard is the whole thing keeping this from becoming a second place
to tick a task off.

**`studyWeeks` drops empty WEEKS**, so "this week" is the nearest week with work
rather than a literal date match — XCEL's CE plan is paced two days a week over
six months, and a strip of seven blank days is not a summary. `overdue` outranks
`in-progress` in a week's status, and OVERDUE outranks TODAY on a cell's flag: a
reviewer scanning the strip needs the problem to surface, and today's cell is
already the only filled one.

**`weekThemes` is AUTHORED, not derived.** Deriving a theme from the week's task
titles reads plausibly until a week spans two subjects, and then it names
whichever sorted first. A wrong label is worse than `Week N`, which is the
fallback.

**Each day carries its STATE, from the Study Plan's own rule.** `dayStatusOf` +
`STATUS_CHIP_COLORS` moved out of `InlineStudyCalendar` into
`studyStatusColors.ts` so both surfaces read one family — a day that shows
complete-green on the plan and neutral-grey on Home is exactly the drift that
file exists to prevent. The plan is still the reference; the colours moved, they
were not re-derived.

Precedence is **OVERDUE → IN PROGRESS → COMPLETED → UPCOMING**, an attention
order rather than a progress one: a day holding one late task and three finished
ones is a day with a problem. It matches the plan's own `STATUS_CHIPS` order.

**Never colour alone.** The dot says the state in hue and the flag says it in
words (DONE / IN PROGRESS / N OVERDUE), and the accessible label carries it too.
The flag's precedence puts state ABOVE `TODAY` — today's cell is already the
only filled one, so on a day in progress the more useful word is IN PROGRESS —
but the label reports today unconditionally, which is what a test asserts.

**The footer carries "Week 4 of 9"**, so seven day cells never imply a one-week
plan.

**Its `Wrap` needs `width: 100%`, and that is not cosmetic.** `Wrap` sets
`margin: 0 auto`, and an auto margin on the CROSS AXIS of a flex column
overrides `align-items: stretch` — the item collapses to its content width.
Every other `Wrap` on this page sits inside a `<section>`, a block container
where auto margins simply centre it, so none of them hit this; as a direct child
of the overview's column, this one rendered 483px against its siblings' 993.
`maxWidth` still caps it at the same 1200 the others use.

**It reads the persona's path**, the same one the Study Plan section resolves,
so the two cannot describe different courses. Guarded by `hasStudyCalendarFor`
rather than `supportsStudyPlan` — the same trap the Jump Back In card hit, where
`studyCalendarFor` falls back to STC's Series 79 plan for an unknown id.

### `dashboard-recommended` — hiding the Recommended band (2026-09-10)

An enable toggle for the whole "Recommended for You" band on the overview,
default on. Off removes the SECTION, header included — a section lead over
nothing reads as a load failure, which is what the test asserts on rather than
on the cards.

**It sits above the three flags that tune it** in the catalog
(`dashboard-recommended-blurb`, `-carousel`, `home-recommended-card-ab`) because
it gates them: with the section off those three control nothing, and a reviewer
flipping them to no visible effect is the confusion the ordering avoids.

**It is NOT `nav-show-recommended`.** That one hides the rail item for the
Recommended for You PAGE; this hides the band on Home. A reviewer can want
either without the other, and a test pins that they are independent — wiring one
control to both is the plausible mistake.

### The "Busy study plan" persona (2026-09-10)

A dense demo state — 37 study-plan tasks across five weeks — for showing the
week strip, the Study Plan and Today's Tasks with real volume.

**A PERSONA, not a fifth dropdown**, and that is the call worth recording. Plan
density is a property of the PATH, and the Education axis already selects the
path: the CE path the demo opens on is a renewal cycle paced two days a week
over six months, which is true to that product and is exactly why it looks
sparse. So this needs no new data and no new axis — it is a named combination
of controls that exist (`dashboard-education-type: exam-prep` +
`progress-on-track`), which is precisely what `DEMO_PERSONAS` is for. A fifth
dropdown on a bar that already has four would be paying chrome for a
combination.

**It is five weeks, not four.** The pre-licensing plan is a real 20-day
schedule against a booked exam date; compressing it to four weeks means either
a denser-than-real pace or moving the exam. The value — a busy plan — is there
either way, so the fixture was left alone.

A test asserts the plan behind the persona has 30+ tasks AND that no single
week holds more than half of them: 37 tasks on one Tuesday would satisfy a
count and demonstrate nothing about a week strip.

### `clp-jump-back-in` now defaults to Today's Tasks

Flipped 2026-09-09. It sat on `up-next` for a day, which meant clearing local
flag state silently reverted the card to the shipped layout — the tasks variant
is the one this demo is about, and Up Next is the comparison.

### Exam Readiness — the Figma port (2026-09-09)

`ReadinessPanel`, from Figma **"Exam Summary"** (`woOd62dQQyPvtqJ6ZRO0qF`).

**The three node URLs are ONE screen**, not three: nodes 1092:230527 /
:230931 / :231435 are the Readiness Score screen in the three states of its
Chapter & Topic filter (I Should Review / I Know This / Show All). The filter is
therefore the part of the design that is specified three times, and the part
most worth guarding.

**Three departures from the design, all deliberate:**

1. **The five top tabs are gone** (About the Course · Instructor · Author ·
   Regulatory Requirements) — the direct ask. They are course-detail tabs; this
   is a section of the learner's own dashboard, and four of the five have no
   content here.
2. **The design's LEFT SUB-RAIL became the tabs.** It carried navigation
   AND content in one column — a second rail inside the shell's content column
   would sit beside the platform rail already there, which is the gutter cost
   the account sections pay with `AccountSubNav`.
3. **Study Tips folded into What to Expect; Final Exams into Practice Exams.**
   The three-tab set leaves the design's other two sections homeless and these
   are the joins that hold.

**Insights is its own tab, and it is SECOND** (added 2026-09-09, straight after
the port). The Chapter & Topic Breakdown sat below the score, on the design's
one long page. Promoting it changes what it IS: below a score it reads as
supporting detail; on its own it is the worklist a learner opens between study
sessions. Order carries the same argument — anywhere after "What to Expect"
buries the answer behind exam-day logistics. A test asserts the tab SEQUENCE,
not just that four tabs exist.

**The split has a cost, and the hand-off link is the payment.** The score's copy
says "aim for the green"; the screen that says WHICH green is now a click away
instead of the next thing down. `ExamReadinessTab` ends with "See what to
review →", which switches tabs. Remove the split and the link goes with it —
do not leave one without the other.

**Practice and licensing attempts stay two lists, and that is not cosmetic.**
It is the same split the FinServ exam task-type spec found in `StudyTaskKind`:
the existing `'exam'` means the PRACTICE exam, sat in the LMS and scored by us,
and the external licensing exam needs its own key. Practice attempts feed the
readiness score; a PSI attempt only reports an outcome. Merging them into
"attempts" is the regression a test guards.

**The frequency sentence is NOT from the design, and has to stay.** The Figma
explains what goes INTO the score and stops. The XCEL learner walk-through had
already answered the harder half — its readiness screen states a FREQUENCY
rather than a probability ("an estimate, not a prediction · about 7 in 10 passed
first time") precisely so a score cannot be read as a promise. That decision is
older than this screen and survives it; `READINESS_FREQUENCY_NOTE` carries it.

**`REVIEW_THRESHOLD` 60 / `STRONG_THRESHOLD` 80 are INVENTED.** The design shows
the colours and states no rule, and XCEL has published none. One `bandFor`
drives the filter, the chapter dots, the topic bars and the gauge's active band,
so a chapter can never sit in "I Know This" wearing a red dot. Replace with the
real thresholds; do not tune them to make a screenshot look better.

**`ReadinessScoreGauge` — the widget spec build (2026-09-09).** Replaced the
240° `ReadinessGauge` outright rather than sitting beside it: two gauges for one
number is the fork this repo keeps paying for. A 180° band-coloured arc with a
threshold tick, a value marker, the numeral, a "N to pass" sub-label and a
status chip, at three sizes, with loading / no-score / animated-mount states.

**The arc is a TRACK, not a value fill**, and that is the load-bearing idea: both
bands paint full length at full opacity, and the score is carried by the marker
and the numeral. A progress-style fill would say "you have completed 47% of your
readiness", which is not a thing — readiness is a position on a scale, and the
scale has to stay visible for the position to mean anything. A test asserts the
two dash arrays sum to the arc length, so a later "make it fill" fails.

**Flat stroke caps, not round** (2026-09-09). Round caps were not just a
rounded outer end: each dash extended half the stroke width at BOTH ends, so
the amber bled past the pass mark into the green and the green bled back under
it — the two bands overlapped at exactly the boundary the tick exists to mark.
`CAP` is one constant covering both bands and the tick, because a flat-ended arc
beside a round-capped tick reads as an oversight rather than a choice.

**Two things the brief asked for were declined under its own rule 0.1** (match
the app, do not introduce a styling system): the per-component folder and the
`.module.css`. This app uses inline `CSSProperties` and flat files under
`src/components/<area>/`. Only the `.types.ts` split survived, because tests
import the types.

**`StatusBadge` gained an `error` tone** rather than the chip being hand-rolled.
Every other functional tone was already there; `error` was simply the gap, which
is the whole reason a bespoke pill would have looked justified.

**The brief contradicted itself, and the mock won.** It set the at-risk window at
`passingScore - 10` (flagged `{{CONFIRM}}`) and then required 62/75 to read
AT RISK — thirteen points below. `AT_RISK_FRACTION` is **0.2 of the range**,
which satisfies every acceptance case and answers the brief's other open half:
an absolute window would make most of a 0-40 scale "at risk", where a fraction
says the same thing at both sizes. Still invented.

**The score column is the WIDE half of that row** (2026-09-09). It was an even
split (`1 1 320px` against the stats' `1 1 280px`), which left the `md` gauge
floating at 206px in a 262px card with the extra width going to padding. It now
takes `1.4 1 360px` AND the gauge steps to `lg` (276px) — **those two go
together**: widening the card alone just widens the whitespace, and stepping the
gauge up alone clips it. The row still wraps, and both columns keep a
`minWidth`, so a narrow shell drops the stats below the card rather than
squeezing it under the gauge's own minimum.

**The Demo Controls bar has a READINESS dropdown** (2026-09-09) — Not Started ·
Off Track · At Risk · On Track, driving `readiness-state`, **default On Track**.
Deliberately NOT in the flag panel's rebrand scope, the same call
`dashboard-progress-state` and `dashboard-education-type` made: a control that
already sits in the always-visible bar is a redundant, worse copy in the panel.
It is also not in the share-link codec — those two are the dashboard's headline
axes that every shared link carries, and this one belongs to one section.

**It is a different question from the PROGRESS dropdown**, and the two are
independent on purpose: progress is how far through the COURSE you are,
readiness is how ready for the EXAM. A learner can be 90% through and not ready,
which is the entire reason this section exists.

**`not-started` is not a low score, and the fixture makes that structural.** The
gauge shows no score and NO chip (a zero would earn OFF TRACK), the breakdown is
empty, there are no attempts, the progress figures are zeroed, and the "See what
to review" hand-off is suppressed because there is nothing over there. The
incoherence being avoided is the CE path's old one — a gauge claiming something
the lists below it cannot support.

**Course progress follows HOME, and it took two tries to land.** It was authored
per readiness state (0 / 45 / 90 / 100), so Readiness claimed 100% while the
Study Plan two rail items above said 32%. The first fix pinned it to the Study
Plan's `progressPct` — also wrong: that counts TASKS in one path's calendar,
while Home follows the `dashboard-progress-state` demo axis and the education
type, so flipping the Progress dropdown moved Home and left Readiness still.
`useReadiness` now resolves the persona through `dashboardProgressPersonaFor`
with the same two flags `MembershipOverview` reads.

**`displayedProgressPct`, not `path.progressPct`.** The band sums the path's
CATEGORY hours and only falls back to the authored field — and the two differ:
the At Risk / Exam Prep persona's field is 14 while… also 14, but the QE persona
is 15 against a field of 15, and the expression was copied inline in THREE bands
(`LearnerFocusedBand`, `ClpJumpBackInBand`, `MarketingFocusedBand`). It is one
exported helper now, used by `LearnerFocusedBand` and Readiness; folding in the
other two is the obvious next tidy.

**Course progress follows the PROGRESS axis; the score follows the READINESS
one.** That separation is the section's point — how much of the course you have
covered and how well you are answering are different facts, and a learner can
be far along and not ready. The readiness states move ANSWERED CORRECTLY, never
the progress figure.

**Beware the demo bar when checking these by eye.** The Progress dropdown's own
label is an APPROXIMATION ("On Track · ~63%", "At Risk · ~15%") and the gauge is
exact (64%, 14%). Scraping the first percentage on the page reads the label, not
the band — which is exactly how a false "Home and Readiness disagree" reading
got produced during this change.

**The bar is the shared `ProgressBar`, not a lookalike.** Readiness had drawn
its own 3px green track, so one learner's one 32% rendered as two different
bars a rail item apart. `ProgressBar` was extracted from `ProgressInline` in
`StudyCalendarStatBand` — where the treatment was defined and still is the
reference — and that component now composes it with its `32%` label. Duplicating
the percentage was the only thing that had stopped the reuse.

**Extracting it broke the bar, and only opening the page caught it.** The style
carried `flex: 1` because it lived in a flex ROW beside a label; dropped into
Readiness' flex COLUMN that resolves to `flex-basis: 0%` on the CROSS axis, so
the bar rendered at ZERO height with `height: 8px` still on the element. tsc was
clean, and the test asserting `style.height === '8px'` passed while the bar was
invisible — jsdom has no layout. `ProgressBar` is layout-neutral now
(`width: 100%`, no flex) and consumers that need it to grow wrap it; the test
asserts THAT rather than the height.

**The Insights topic bars deliberately stay thin.** They are SCORES, not
progress — band-coloured, and fourteen in a column where 8px would turn a
scannable list into a stack of blocks. Same reasoning as the gauge dropping red
while the chapter dots keep it: a different job is allowed a different
treatment.

**The STUDY PLAN follows Home too, as of the same day — and the harder half was
that it was showing a DIFFERENT COURSE.** `StudyPlanSection` resolved its path
with `activePathIdFor` (always the first), so at the default settings the
dashboard showed the CE path while the Study Plan showed the PRE-LICENSING
plan: two rail items apart, describing different courses, with nothing on
either screen saying so. Matching their percentages would have been meaningless
while that was true. The section reads the persona's own path id now.

**The guard on that id has a trap in it.** It must validate against
`learningPathsFor(brand)`, NOT the `useLearningPathSummariesForBrand()` list —
that one is filtered by `learning-paths-count` and holds a single entry by
default, so checking membership there rejected the CE persona's id and fell
silently back to pre-licensing. The `?id=` param still checks the visible list,
because that is a user-supplied value.

**The Progress tile now takes `coursePct`**, defaulting to the plan's own task
count for every other embed. The "Tasks Completed" tile beside it still counts
tasks (3 / 10 against 63%), and that is not a contradiction — the two tiles are
labelled as the different things they are. What was wrong was a tile labelled
*Progress* disagreeing with every other Progress in the app.

**`ProgressAgreement.test.tsx` is a cross-surface test on purpose.** Each page's
own tests were green while the three disagreed — 63 / 32 / 100 — which is
precisely the failure a per-page suite cannot see. It sweeps every Progress
persona rather than asserting today's default, because a surface hardcoded to
the default passes until a reviewer flips the dropdown, which is the first
thing a reviewer does.

**The three scored states SHIFT one chapter set rather than authoring four.**
A learner's relative strengths do not change with their overall standing: the
chapters that are hard stay hard, and what moves is the level. Four independent
sets would say a stronger learner is strong at DIFFERENT things, which is not
what a readiness score means. A test asserts the ordering survives the shift.

**Adding these tests found a real gap:** `ReadinessPanel.test.tsx` had been
rendering without `FeatureFlagProvider`, so `useFeatureFlag` fell back to
catalog defaults and every state seeded into localStorage rendered as On Track —
the demo-state tests passed for the wrong reason until the provider went in.

**Unresolved, deliberately not guessed:** the mock's softened green (#63bc8e) is
not reachable — `--color-success-500` is the lightest stop on that ramp and is
materially deeper, so closing it needs a new ramp stop, not a literal. The
marker ring takes the ACTIVE BAND's colour rather than the mock's fixed teal, on
the grounds that a fixed hue is a fourth colour with no meaning; one line to
reverse. No feature flag: the section's only gate is `nav-show-readiness` (rail
visibility), and gating the gauge separately would leave the tab headless.

**The gauge had NO red before this and still does not** (restyled 2026-09-09 to
a supplied reference). It shipped as the design's red / amber / green;
red is gone because this number is the learner's OWN standing, and a
learner mid-course is below the mark by definition — a red arc for being where
you are supposed to be reads as a verdict rather than as distance still to
travel. The walk-through had already settled that for this screen
("probabilistic, and it has to say so without discouraging").

**Red did not leave the page**, and the divergence is deliberate: chapter dots
and topic bars keep it. Red on a CHAPTER is actionable — it names a specific
thing to fix — while red on YOU is just discouraging. One surface is a worklist
and the other a self-assessment; they are allowed to speak differently.

Amber runs to **`PASS_MARK`** and green from there. That is 70, the Florida 2-15
figure the state sets — the only number on this page that is not invented — so
green means "at or above what you must clear" rather than "above a number we
chose", which is what the invented `STRONG_THRESHOLD` of 80 meant. A tick marks
the boundary and the caption names it ("70 to pass"). `EXAM_FACTS` reads the
same constant: the two sit one tab apart, so nobody sees both at once, which is
exactly where a second literal would rot unnoticed. A test asserts they agree.

Both bands render at FULL strength. The three-band version dimmed the inactive
ones to say "you are here"; with two bands the marker and tick already say it,
and dimming the green made the target the dullest thing on the arc — the
opposite of what "aim for the green" asks. Green is `--color-success-500`, the
lightest stop on that ramp; there is no `-400`, so a lighter green needs a new
ramp stop, not a literal.

**The gauge is a new component, not `ProgressDonut`.** That one is a closed ring
split into category segments ("how much of each kind"); this is an open 240° arc
carrying a red→amber→green ramp ("how good is this number"). They look alike and
mean different things. The ramp is three fixed bands rather than a gradient
because the bands ARE the thresholds — a gradient blurs the boundary the score
is being judged against.

**The content is XCEL's, not the design's.** The Figma is a real-estate course;
these are Florida 2-15 Life & Health chapters, and the practice exams are the
three Exam Simulators `learningFixtures` already puts in that path. The
`EXAM_FACTS` carry a `TODO(data)` — they are the published Florida figures, not
a feed, and want confirming against the current PSI bulletin.

### Readiness — how the section was registered (2026-09-09)

**Superseded within the day by the section above** — it is no longer blank. Kept
because the sequence is the point: registering a section with an `EmptyState`
first, then swapping ONE `renderBody` branch for the real panel, is what made
the port a single-file change. The note that said "nothing else about the
section needs to move" turned out to be exactly true.

A rail section (`readiness`) directly after **Study Plan**: the plan is the
work, this is where you find out whether the work has got you there. It renders
an `EmptyState` and nothing more — there is no readiness model in the fixtures.

The five registration points are the same ones Resources needed:
`PlatformSection`, the rail item, `VALID_SECTIONS`, `SECTION_TITLES`,
`renderBody` — plus a `NAV_SECTION_FLAGS` entry. Replace the `renderBody`
branch with the real panel when it exists; nothing else about the section has to
move.

**It is NOT gated on a capability predicate**, unlike the Study Plan row above
it (`supportsStudyPlan`). That is deliberate rather than an oversight: there is
nothing behind it to gate on, and inventing a predicate now would be committing
to the shape of a feature nobody has designed. Its nav flag is the only gate
until a real fixture exists — wire the predicate then, beside it.

**The demo-rail test caught this before it landed**, which is what that
assertion is for: a row cannot join the baseline without failing
`NavSectionFlags.test.tsx` first and being re-decided. Readiness is ON in the
demo because a stakeholder is meant to see it is coming.

**The icon is `gauge-high`** (FA 7.3.1 light), registered as `Gauge`. The
`-high` needle is the load-bearing part: plain `gauge` points its needle
straight UP, which at the rail's 17px reads as an arrow in a circle rather than
a dial. Compared against `gauge`, `gauge-simple`, `gauge-max` and
`gauge-simple-max` at 17 / 24 / 48px before choosing.

It briefly shipped as a 6.6.0 `gauge-simple-high` — same needle, no tick dots,
picked on the assumption the ticks would mush at 17px. The supplied 7.3.1 file
keeps them and they hold up: its dots are rounder and better separated than the
6.x ones, and it matches the ~70 other 7.x icons in the registry.

A needle pinned high could be read as claiming the learner IS ready. Discounted:
a rail glyph names the topic, not a value — `Award` next to Certificates does
not mean you have one — and the alternative failure (not reading as a gauge at
all) is worse.

It replaced `Flag`, whose vendored FA 7.2.0 asset is **clipped**: `flag.svg` is
`viewBox="0 0 448 512"` but its path starts the pole at `x=-8`, so the left edge
of the pole is cut flat. That is not a Readiness problem — `Flag` still renders
in the Feature Flags panel, the admin tools menu, `MembershipStatBar`,
`LearningRecapBadge`, `ConsistencyCard` and `RubiAiBand`, and it is clipped in
all of them. The minimal fix is `viewBox="-8 0 456 512"`, which keeps the FA7
drawing and shifts centring by under 2%; re-vendoring FA 6.6.0's flag also works
but is a different drawing.

The shell's `<h1>` and the EmptyState's own title both read "Readiness", so the
word appears twice. That is the existing Podcasts pattern, matched on purpose —
if the doubling is worth fixing it should be fixed for both, not just here.

#### The journey rail lost its blocked meta, and its two completion stops became one (2026-09-16)

**Blocked stops render NO meta line.** Every stop after the current one is
blocked, so all of their meta lines ended in the same four words — four stacked
rows of "· After your coursework" under four titles, a paragraph of repetition
where the point was a sequence.

The trade-off is real: those lines also carried Part 2's 80% target and Part 3's
"3 simulators, aim for 85%", which now live only on the requirements sheet the
block links. The blocked REASON survives on the row's `title`, and `statusWords`
still returns it — only the rendering stopped.

What makes the rule safe rather than arbitrary: **blocked and not-started never
appear together here**, so the missing words are not what would have told two
visible states apart. If a path ever mixes them, the words have to come back —
that is the "never colour alone" rule, and this is an exception the data
currently permits rather than a repeal.

**"Attestation & Certificate" is ONE stop**, from two. They are still two ACTS in
XCEL's published certificate-eligibility rules and nothing about that changed;
they are one MOMENT on this rail — done back to back, unlocking together,
neither ever true without the other. Two rows spent two of the journey's five
stops on one wrap-up, and with the blocked meta gone they were two long titles
saying "certificate" twice. Splitting them back is re-adding one entry to
`COMPLETION_STOPS`.

#### The columns are 660 : 380, from 514 : 407

They were near-even because they were once two halves of one band. They are not:
the LEFT column carries the art, the title, the meta, the progress bar, the
Resume CTA, three KPI cells and a status strip; the right is a list of short
rows and gives width up cheaply. Measured after: 515px against 296px in the
pane.

**There are TWO `gridTemplateColumns` in `LearnerFocusedBand`**, and the first
belongs to the completed-celebration branch, which renders something else
entirely. It got the edit first and the symptom was the left column getting
NARROWER — because the live grid had not moved at all. A test asserts exactly
one of the two carries the new ratio.

### `dashboard-course-header` — the page header band (2026-09-16)

A fourth variant axis, and the only one whose default is OFF: `none` · `band`.
A full-width header above the whole overview — the meta on one line, the course
name as a 28px heading, two actions right, and a rule under the lot.

**Off by default because it says the course name TWICE** — this and the Current
Course Progress block's own heading a few lines below. That repetition is the
QUESTION the variant asks (should this page read as a COURSE or as a dashboard?)
rather than an oversight, which is exactly why it cannot be the default answer.
A test asserts the name appears once when the flag is off.

**NO action of its own — the band is a title, and that is all it is.** Three
things were tried there and all three left:

- **"DFS Statutory Rules →"** — there is no confirmed DFS URL in this repo. The
  button opens the **requirements sheet**, which is a surface we can actually
  reach, labelled "State requirements".
- **"Syllabus (PDF)"** — the PDF XCEL links is a 7-day study PLAN, not a
  syllabus. It shipped for one build as "Study plan (PDF)" — true, and pointing
  at `NY_LH_STUDY_PLAN_URL`, the URL the product page gives under "Read our
  recommended study plan" — and then went: a lone relabelled button beside a
  real one is worse than not offering it. The URL is still recorded in the
  fixture, so wiring it back is one element.

**THE BLOCK BELOW DROPS ITS WHOLE HEADER while the band is on** (`hideHeader`).
It started as `hideCover` and grew: dropping only the picture left the course
NAME, the meta line and a second progress bar repeating the band three inches
above them. What survives is everything the band does not have — the Resume CTA,
the KPI cells, the status strip, View Requirements — so the block now opens on
"Resume course". A test asserts the block prints no "% Complete" at all, which
is what "one course, said once" means.

**A FULL-WIDTH PROGRESS BAR sits under the title** (2026-09-16), with the figure
on the TITLE'S OWN LINE — the number and the name it belongs to read as one
statement, and the bar then tucks under both at `marginTop: 10` rather than
floating a row away from each. It was in the bar's own row on the right for one
build. It spans the whole band rather than sitting in the title
column, which is what makes it read as the PAGE's progress rather than as one
more thing beside the name.

It reads `displayedProgressPct`, the **same resolver the block below uses** —
not `path.progressPct`. Those two differ (the band sums the category hours and
falls back to the authored field only when there are none), and a page header
disagreeing with the block three inches under it is precisely the defect
`ProgressAgreement.test.tsx` exists to catch. A test asserts both say the same
number.

It is the shared `ProgressBar` with the page-grey `track` override, for the
reason the block's own bar needed one: the default track is 1.08:1 on this
ground.

**It is INDENTED past the cover** so it starts where the meta line and the title
do rather than under the picture — aligned, it reads as belonging to the course
name above it; flush left, it reads as belonging to the image. Measured: meta,
title and bar all at x=448. The cover's width and its gap are CONSTANTS
(`COURSE_HEADER_COVER_W` / `_GAP`) because three things depend on them — the
image, the gap, and this indent, which has to clear both. Three literals is how
that alignment drifts the next time the art is resized.

- **"State requirements →"** replaced them, then moved to the FOOT of the Get
  Licensed card (2026-09-16). Up there it was an action without a subject, three
  sections above the thing it elaborates; at the foot of the card about what the
  state requires, it is the next thing to read. It renders in BOTH journey
  variants — only the syllabus one draws a card around the section.

**THE COURSE ART LIVES HERE when the band is on.** It was beside the block's own
title below; with the band on, that put the picture next to the SECOND naming of
the course rather than the first. `hideCover` on the band drops it there — one
course, one picture, the same duplication rule that folded the Jump Back In card
into the block.

The actions are outlined rather than filled: the page's primary action is
Resume, a few lines below, and two filled buttons above it would argue with it.

### `dashboard-journey-style` — the syllabus treatment (2026-09-16)

A third variant axis, for the Study Journey rail AND the Get Licensed section it
sits above: `default` · `syllabus`. To a supplied reference.

`syllabus` is a formal restyle — a bordered card headed **"Complete Course"**
under a wide-tracked **"Study Journey"** eyebrow (it read "Syllabus sequence"
over "Study Journey" for one build; the eyebrow now matches the section's own
`aria-label`, and the heading says what the section is FOR — the rail's job is
getting the course finished, and the licensing card below picks up after that), **"Milestone 0 / 4 Complete"**
instead of a bare count, **numbered nodes** (01, 02 …) with the active one
filled, serif row titles prefixed with their number, a green **percentage chip**
on the stop in progress, a "Part 2" / "Part 3" label on the blocked ones, and a
**meta line on every row** — including blocked ones, which the compact rail
drops. Get Licensed becomes **"Get Licensed in New York"** with per-step cards
and labelled facts ("Vendor: PSI · $40 exam fee").

**`jurisdictionName` is a two-entry map, not a 50-state table**, and it falls
back to the CODE. A path carries `state: 'NY'`; expanding that to "New York" is
presentation, so it lives beside the requirements rather than on the path, and
an unmapped state reads as "NY" rather than as a blank or a guess.

**TIGHTENED 2026-09-16, later the same day** — three things, all against the
reference:

- **Fewer words per row.** `metaWords` prints group · count · status, which on
  this treatment says everything twice: the group is already the row's title (or
  the "Part 2" label on its right) and the status is already the chip. Row 1
  read *"Pre-licensing Course · 26 / 42 lessons · In progress · 62%"* beside a
  title saying "Pre-licensing Course" and a chip saying "62% In progress"; row 2
  read "Part 2 · …" beside a label saying "Part 2". `leanMeta` keeps only what
  appears nowhere else: the count in words, the published target, the unlock
  condition.
- **Lighter, larger titles.** A heading face at 700/15 in a 296px column wrapped
  every title to three lines and read as shouting. 600/16 sits closer to the
  reference, which uses a book weight for rows and saves the bold for the
  section heading. The title row also **wraps** now, so the chip drops to its
  own line only when the title needs the room — the column is 296px since the
  band's grid moved to 660:380, and a chip holding ~110px of that left the title
  ~150.
- **Get Licensed is its OWN card**, under a "Post-course process" eyebrow, and
  the widget drops the hairline between them. What changes between the two
  sections is WHO owns the work — XCEL, then the state — and a card boundary
  says that more plainly than a rule does.

**IT CHANGES NO DATA.** Same stops, same titles, same numbers. It does not split
"Attestation & Certificate" back into the two rows the reference shows, because
the merge was a data decision and a style variant must not quietly undo one. A
test compares the rendered titles against `journeyStopsFor` to hold that.

**What the reference has that is deliberately NOT reproduced:** "Foundational
jurisprudence", "Mandatory sworn affidavit of identity & contact hours", "Formal
pre-licensing completion certificate required for testing", and a course code
("Code: NY-INS-L&H-2026"). The first three are claims about New York practice
and the last is a record number; nothing in the fixtures sources any of them.
What each row says instead is what `metaWords` already knew. A test asserts the
copy is absent.

### Testing — the pacing exploration version (2026-09-21)

A fourth Discoverability version (`discoverability-testing`, labelled
**Testing**), at Jillienne's request: *"a Home Version specifically for Testing
— readiness removed, and explore the Pacing section UI."*

**It is QE Focused with ONE change**, and that is deliberate. `dashboardLayout`
gains `'testing'`, and `MembershipOverview` sets `qeFocused` for it the same way
QE Focused sets `learnerFocused` — it IS that version apart from one tile, and
re-listing the page surface, the category gauge, the Study Journey, the dropped
Recommended band and the requirements-only sheet would be how the two start
disagreeing about things nobody decided to change. What differs is the band's
square-tile row.

**It is NOT the default, and a test pins that.** `defaultDiscoverabilityVersionFor`
still returns QE Focused for XCEL. A fourth picker entry that quietly became
what a stakeholder lands on is the worst outcome this change could have, since
the public link opens on the default.

**The Readiness tile is dropped, and it costs nothing.** It has been a
deliberate lo-fi stub since 2026-09-17 ("Not designed yet"), and the placeholder
is the TILE, not the section — the real `ReadinessPanel` is one rail item away,
untouched, and is where the tile pointed. A test asserts the rail row survives,
so the removal cannot read as dropping the feature.

**`paceOnly` is ONE prop, not two, because the two halves are not separable.**
The pair's `aspectRatio: 1 / 1` is a property of there being TWO of them: alone
in this ~506px column a square tile is a 506px box holding two lines. So "hide
Readiness" and "reshape Study Pace" are the same decision, and splitting them
would let a caller pick the one arrangement that is wrong. `SquareTile` takes a
`square` prop rather than gaining a `WideTile` beside it.

#### The post-course steps are four widgets now (2026-09-21)

The direct ask: "I want the complete coursework section to be its own widget,
and then the 2nd widget to be Schedule State Exam, 3rd widget, Pass the Exam
(sub-link what to expect), 4th widget, Get Licensed — Apply for your license."

The right column is now **four cards**: Complete Coursework (the journey, stops
01–04), then one card per published licensing step.

**It is still ONE component returning ONE element**, and that is not cosmetic:
this is the band's second GRID CHILD. Four siblings would become four grid items
and collapse the two-column layout, so the split renders a flex column holding
the four cards.

**WHAT THE SPLIT COSTS, and what pays it back.** The 01→07 sequence was one
spine down one card, and separate cards cannot draw a continuous line. The
NUMBERS carry it instead — each step's eyebrow is "Step 05/06/07", continuing
from the journey's REAL stop count rather than a literal (merging two completion
stops into one already changed that offset once). Lose the numbers and the four
cards read as four unrelated things; a test pins the sequence.

**The rows became static cards with an explicit sub-link.** The rail rows were
whole-row targets because a link inside a button is invalid HTML and two nested
targets on a 13px title is a coin flip. A card has room to separate them, so the
content is text and the affordance is a named link — which is what lets the
ask's "sub-link" exist at all.

**`detailLabel` is AUTHORED PER STEP, in the data.** "How to register" / "What
to expect" / "How to apply" — because what each sheet answers differs, and "What
to expect" on the application step is the generic label that tells a learner
nothing (the reason `ResourceIcon`'s four glyphs stopped all being `blog`). It
lives beside the sections it opens so the label and the content cannot drift; a
`switch` on `step.id` at the call site is how a fourth step ships unlabelled.

**One behaviour changed: `schedule-exam` no longer leaves the app on click.**
Its ROW was an `<a>` straight out to PSI; its card opens the step's own sheet,
whose FIRST BULLET is that same PSI link. The destination is one click further
away rather than gone, and the three cards now behave identically instead of one
of them navigating away without warning.

**The arrival card is named for the DESTINATION**, per the ask: heading "Get
Licensed in New York", with the published step title "Apply for your License" as
its lead line so the ACTION is still named. The other two use their step title
directly. Its `aria-label` is the VISIBLE HEADING, not the step title — a region
announced as "Apply for your License" while reading "Get Licensed in New York"
is the "Dash Dashboard" defect in miniature.

**"State requirements" sits on the LAST card only.** It was at the foot of the
Get Licensed card, which this split dissolves; it belongs on the card about
applying to the state, which is why it was moved there in the first place.

**THE OWNER/FEE LINE NEEDS A FEE TO EXIST** (2026-09-21, "remove", pointed at
Pass State Exam's meta — the bare word "PSI"). A rule rather than an exemption
for that step: a meta line is a PAIRING, and with no fee to pair with the owner
was a one-word row under a sentence, reading as a label for something missing.
Written as "only when there is a fee", so a fourth step with one gets the line
and one without does not, and nobody has to remember which id was exempt.

What it costs: the owner is the reason these steps are separate from the
coursework at all, and on Pass State Exam that fact now lives only in the step's
own sheet, which its "What to expect" link opens. The other two cards still name
theirs beside the fee. Dropping the `step.fee` condition puts it back on all
three. A test asserts the RULE across all three rather than the one absence —
an absence check alone passes just as happily if every meta line vanishes.

**THE CARDS SETTLED INTO ONE ORDER** across three passes of "remove"
(2026-09-21): **eyebrow → heading → meta → body → link**.

- The arrival card's LEAD LINE went. It carried the step title ("Apply for your
  License") under the overridden heading so the action was named as well as the
  destination — the third saying of one thing, with the detail below already
  stating what you do and the link reading "How to apply". `heading` is purely
  a heading override again, and the step title now appears nowhere on that card.
- The Schedule card's DETAIL went, replaced by the capture's own invitation.
  ONE boolean (`hasCapture`) drives both, because they are one decision: two
  lines of invitation on one card is the duplication this column keeps
  trimming, and two conditions would let a later edit put both back. **The DATA
  is untouched** — the compact Get Licensed rail still prints `step.detail` on
  QE Focused, where there is no capture to replace it.
- The META moved above the body and took a SHORT owner form. `ownerShort` is
  `'NY'` for the licensing authority only: "NY Dept. of Financial Services" is
  30 characters in a ~300px column and wrapped its fee to a second line. The
  full name is unchanged in the data and still prints on the compact rail — the
  same split `jurisdictionName` already makes between a code and a spelled-out
  name, since an abbreviation is presentation rather than a rename. The move
  applies to ALL THREE cards, not just the one asked about: the Schedule card
  has no detail line and Pass State Exam has no meta, so leaving the arrival
  card alone would have made it the only one ordered differently.

**THE REQUIREMENTS ACTION LEFT THE CARDS** (2026-09-21) — a full-width
secondary button below the four, where it was a text link at the foot of the
arrival card. Out there it reads as what it is: the state's own rules, which
elaborate the whole post-course sequence rather than its last step. It also
stops the arrival card being the only one with two affordances. Its label is
**jurisdiction-resolved** (`New York State Requirements`) from the same
`jurisdictionName` call the card's heading uses, so a Florida path cannot get a
button naming New York.

**It is the shared `Button`'s SECONDARY SHAPE but not that component**, and the
reason is this version's palette: `Button.secondary` draws its ink and border
from `--color-action`, which on XCEL is the Brick red — a FILL colour measuring
2.05:1 as TEXT on the dark shell (the `.cre-alert-action` failure), and the ramp
this version deliberately moved every CTA off ("navy means do this; red means
this is an assessment"). A red outlined button would have been the only red
control on the page. `.cre-cta-ink` with `borderColor: currentColor` lets ONE
declaration own the ink and the stroke, dark-mode swap included. Measured
7.00:1 light / 7.76:1 dark, with `borderTopColor === color` in both.

**Full width by INHERITANCE** — a flex column stretches its children, so it
matches the cards exactly and cannot drift if the column resizes. The test
asserts the absence of a measured width rather than a pixel figure.

**The step CTAs had to stop being `nowrap`.** That came from `SquareTile`'s
"Details →", where the label is two words and can never outgrow its tile; these
labels are authored per step, and the longest measured **211px spilling 13px
past a 218px card** at a 1000px viewport. They wrap left-aligned now.

A test asserting the full name on the rail had to **seed the COMPACT treatment**
— those rows print their owner/fee only there, and the catalog default is
`syllabus`, which drops it. Rendered at the default the test would have found no
owner anywhere and passed for a reason having nothing to do with the
abbreviation.

**STILL NO COMPLETION STATE**, and four cards make that easier to forget than
three rows did. Nothing here gets a tick, a status or a progress figure: PSI
schedules the sitting, PSI scores it, DFS issues the licence, and the product
has no feed for any of it.

##### A test written too strictly, twice, on the same assertion

The "no completion state" guard failed twice before it was right, and both
failures are the *reverse* of this repo's usual trap — strict enough to be
wrong rather than loose enough to pass for the wrong reason:

- `/complete/i` matched the published copy "your certificate of **completion**",
  which appears on two of the three cards. Word-boundaried status labels now.
- `/%/` matched "**70%** to pass" — the STATE's published pass mark, a fact
  about the exam rather than a claim about this learner. The "no percentages"
  rule belongs to the pacing tile, where a figure would be a progress claim;
  borrowing it here would have banned the one sourced number on the card.

An earlier structural test also needed **updating, not deleting**: the right
column used to BE the `Study journey` section and is now a wrapper holding four,
so its assertion reads "contains" rather than "is". Its subject — where the
course header went — is unchanged.

#### The learner's own exam date (2026-09-21)

The Schedule State Exam card asks for it: *"Schedule your exam when you're
ready. Already scheduled? Enter the exam date and we will use that to help you
prep!"*

**The second half of that sentence is the whole reason it earns a place.** A
field that only remembered what you typed would be the Membership Plan card's
defect — a control that looks like it does something. Entering a date re-points
the page's **Target Exam Date**, the remaining-time cell, and therefore the
Pacing tile's required rate. Verified end to end in the browser: Dec 15 2026 →
Jun 30 2026, 27 days → 7 wks, ~5 lessons a week → ~3.

**`examDateStore` is a `useSyncExternalStore` over `localStorage`**, the
`demoControlsVisibility` pattern, for its reason: the input is in one card and
the figures it moves are in two other blocks. A `storage` event would NOT do it
— that fires only for OTHER tabs, the defect the Links nav badge shipped with.

**The override is applied at `personaRenewal` in `MembershipOverview`**, not in
the band, because that one value feeds BOTH the band and the course header
band's stat row. Overriding further down would leave the header printing the
persona's date beside a countdown to the learner's.

**It FALLS BACK to the persona rather than replacing it** — with nothing stored
the demo is unchanged, and Clear restores it. It is per browser and never
committed, the same footing as `cgp.featureFlags.customDefaults`, so a machine
holding one shows a different Target Exam Date with nothing in the repo to
explain it. That is why the card shows the date back with Change / Clear rather
than swallowing it.

**The field is sized to its CONTENT, not stretched.** It was `flex: 1 1 140px`
and grew to fill the card — 200px against an intrinsic 136 — which puts empty
field beside `mm/dd/yyyy`. `flex: 0 1 auto` rather than a measured literal,
because a date input's natural width depends on the locale's format and the
platform's own control, so a number right in one browser clips in another. It
keeps SHRINK, so a narrow card wraps Save below it rather than cutting the date.

**Two things in `examDateRenewal` are load-bearing:**

- **`deadline` is `M/D/YYYY`, never the ISO string typed.** `longDate` parses
  it, and its own note records that both shapes it accepts parse in LOCAL time
  "so there is no UTC off-by-one to defend against". An ISO-8601 string parses
  as UTC and prints the day BEFORE west of Greenwich — the exact off-by-one that
  note relies on the format to avoid.
- **`weeksLeft` counts from `FIXTURE_TODAY`**, not the wall clock. Everything
  date-driven here is anchored to 2026-05-11.

A date at or before the fixture today returns null and falls back: a negative
countdown renders "0 days" beside a required rate of infinity, and a booked exam
in the past is a data-entry slip rather than a state to design for.

**The step's `detail` changed to XCEL's own voice** ("Schedule your exam when
you're ready.") from the published page's "Register with PSI once your
certificate of completion is in hand." The PRECONDITION is not lost — forced
progression and the certificate requirement are both in this step's `sections`
and in the requirements sheet, which is where a learner acting on them will be.
Note this is shared data, so the rail row on QE Focused says it too.

##### It exposed a latent bug in the shared time formatter

`timeRemaining` returned **raw** `weeksLeft` in its weeks branch, so the header
cell rendered **"7.142857142857143 wks"**.

It had never been reachable: a FRACTIONAL `weeksLeft` under 30 days takes the
`days` branch, which rounds, so the only way into the weeks branch was a whole
number. A learner-entered date produced the first fractional value past 30 days.
**That function's own docstring describes this exact failure** at the three call
sites it was extracted to fix ("those call sites would have rendered
'3.857142857142857 wks'") — it had the same bug one branch further in. Both week
values are rounded now, which fixes every surface that formats a deadline.

**And a unit disagreement, in the same pass.** The Pacing tile printed raw days
(`unitCount(daysLeft, 'days')`) while the header used the formatter, so past 30
days they read "50 days to go" and "7 wks" three inches apart — the same fact in
two units. The tile reads `timeRemainingText` now, which also pairs better with
the rate above it, since that is per week. At the committed default (27 days)
nothing moved: both still say "27 days".

#### The Study Journey is framed again (2026-09-21)

The direct ask: "add a frame, white background around this content", then
"remove stroke" the same day. `widgetCardFramedStyle` — `--color-surface-card`,
`radius-lg`, 20px padding, and nothing else.

**IT REVERSES A RECORDED DECISION**, and the note it reverses is kept rather
than rewritten. The card was removed on 2026-09-16 ("remove the background white
and stroke") when the journey was one of two stacked blocks in that column and a
raised card put chrome around chrome. On TESTING the column holds this and
nothing else, with the left column's blocks bare on the page grey — so a frame
here distinguishes the two columns instead of competing with a neighbour. Same
component, different composition, opposite answer; both shells live in
`widgetStyles.ts`, which is what that file is for.

**FILL ONLY — no stroke, no shadow.** It shipped with a 1px
`--color-border-subtle` edge for a few hours and the stroke came off the same
day ("remove stroke"). What is left is the white surface alone, which is the
same treatment `widgetCardRecessedStyle` opposite it already has: a card defined
by its fill with nothing drawn round it. The two columns differ by SURFACE now
rather than by one having an outline.

**NOTHING WAS PUT IN THE STROKE'S PLACE, and that is the part to hold.**
Removing an edge and adding a shadow is not removing chrome, it is swapping one
kind for another — and a shadow would make this a RAISED card, a different claim
about the column's depth from the flat recess opposite. The 2026-09-16 removal
note states the rule this follows: fill, edge and shadow are ONE treatment, so
the fill is allowed to be the whole of it. A test pins the absence of both, and
the border assertion was INVERTED rather than deleted so a re-added outline
fails.

**The horizontal padding comes back with the fill**, for the reason it left: a
bare block lines up with its column, a filled one needs a gutter or the content
sits on the edge. 20 rather than the recessed card's 16 — that one is sized to
line its eyebrow up with the tiles stacked beneath it in the SAME column, and
this card has no such neighbour.

**`--color-surface-card`, never a literal white** — it inverts with the theme.
That is the `--color-primary-100` trap `widgetCardRecessedStyle` records, from
the other direction.

**It reuses `paceOnly` rather than adding a second boolean.** That prop is
already this version's marker on this component, and a `framed` that was always
set with it would only ever differ by mistake. Rename both if a version ever
wants one without the other.

**Measured, both themes.** Light: card #ffffff on the #f5f5f5 page, 1.09:1;
eyebrow 12.25, heading 11.37, stop title 7.64, meta 6.19, the CTA 7.64. Dark:
card #152833 on #1b1d21, 1.11:1; eyebrow 6.98, heading 13.67, meta 6.18, CTA
6.98. Every ink clears AA on the new surface.

**THE COST, stated rather than left to be discovered:** with the stroke gone the
card is carried by that 1.09 / 1.11 fill and nothing else. It is deliberately
subtle and it matches the recessed tile's 1.16:1, so the page is consistent —
but there is no second cue any more. If the card ever needs to read harder, the
honest lever is the FILL, not a re-added outline.

Checked against the live `syllabus` journey variant (the catalog default): its
two halves carry no fill or border of their own, so the frame does not produce
cards inside a card.

#### The course header moved into the band's left column (2026-09-21)

The ask was two things — "shift [the Study Journey] up so it's directly under
the header, then reduce the width of the course progress section to align with
the other components" — and they are **one change**.

The course header band was a full-width block ABOVE the grid, so it pushed the
whole grid, Study Journey included, down past it. Moving it into the LEFT COLUMN
narrows it to that column *and* frees the right column to start at the top,
because the grid now begins where the header used to. A `max-width` on the
header would have done the first half and left the journey exactly where it was.

**A SLOT (`headerSlot`), not a rebuild.** The band takes the element; it is
still `MembershipOverview`'s, still reads that component's own resolvers.
Re-deriving it inside the band would be a second owner of "the course to show",
which is the fork `displayedProgressPct` was extracted to close. `hideHeader` is
still set alongside it, so the block's own header cluster stays empty.

**It is rendered in ONE place or the other, never both** — a test counts the
eyebrow, because the course name already appears twice on this page by design
and a third would be the duplication `dashboard-course-header` exists to ask
about.

**`courseHeaderBand`'s whole block moved ABOVE the band chain** (518 lines,
relocated unchanged). It sat below, which is fine for a value only the JSX
return reads and a TDZ error the moment a sibling const consumes it. Its
dependencies all resolve well above the new position.

**Measured after:** header and the Study Pace tile both at x=284, w=633 —
exactly aligned; the journey at y=256 against the header's 260, i.e. level. QE
Focused is untouched: its header is still full-width above the grid, asserted in
both directions.

##### Two layout decisions inverted at the narrower measurement

Both were made against the ~1040px full-width band and are wrong at ~633:

- **The cover was `align-items: flex-end`**, because "the square is 130 and the
  column beside it is ~105, so the two only agree on one edge". In the left
  column the title wraps to two lines and that column becomes ~213 — TALLER
  than the square — so the premise inverts and the slack moves *under* the
  picture, dropping it away from the title it anchors. Top-aligned when narrow.
- **The stat row's separator dots.** They are bound to the pair AFTER them,
  which fixed a dangling separator at the end of a wrapped line and traded it
  for a LEADING one at the start of the next. At full width that is rare enough
  to accept; in the left column the row wraps every time, so all three pairs
  rendered as a bullet list **whose first item had no bullet**. Narrow stacks
  them in a column with no dots — the dots exist to separate pairs on ONE line,
  and there is no longer one line.

Neither is an exception to the note it sits under; each is the same reasoning at
the other measurement, which is why both are scoped to `narrowHeader` rather
than changed outright.

##### And one that only a resize caught

At a **900px viewport** the left column is ~315px, and the cover (130) and the
figure are both fixed — so everything the column gives up comes off the TITLE.
Measured: an 85px title column setting the course name **one word per line**.
Invisible at the width this was being reviewed at.

`.cre-course-header-narrow` in tokens.css stacks the cover ABOVE the text below
**1100px**, which hands the title the whole column. It stays a 130px square
rather than stretching: it is course art, and a full-bleed strip would re-crop
the photograph to solve a layout problem. A CLASS because inline
`CSSProperties` cannot carry a media query — the `.cre-alert-action` reason —
and tokens.css already carries 17 of them, including the header's own
`max-width: 900px` name-drop.

#### The rail is trimmed to three rows (2026-09-21)

The direct ask: no Study Plan, no Readiness, no Resources, no Rubi Insights, and
no Collapse Menu. Testing's rail is **Home · My Courses · Certificates**, then
Support · Get Help.

**NOT `NAV_SECTION_FLAGS`, and that is the decision.** Those flags are the
committed DEMO BASELINE — one rail that `NavSectionFlags.test.tsx` asserts whole
and in order — and QE Focused, XCEL's default, is what a stakeholder lands on.
Flipping four of them would have trimmed THAT rail too, which is not what "for
this version" asked for. So the trim is a property of the LAYOUT
(`TESTING_HIDDEN_RAIL_SECTIONS` in `PlatformShell`, threaded as the rail's
`hiddenSections`) and the baseline is untouched. A test asserts the QE Focused
rail is unchanged, in full and in order.

**Rows only — every section still resolves.** `?section=readiness` still opens
Readiness on Testing, which is the rule `NAV_SECTION_FLAGS` already states and
what makes a trimmed rail an editorial act rather than a feature cut. Asserted,
because it is the half that would quietly stop being true.

**`hiddenSections` is applied ALONGSIDE the flag check**, not instead of it: a
version's trim and the demo baseline are different decisions by different
people, and either hiding a row is reason enough. The existing "a group whose
items are ALL hidden drops out, caption and all" rule then does the rest — which
is why Explore needed no special case.

**The collapse toggle goes by ONE WITHHELD PROP**, the mechanism the rail
already documents ("Omitted → no toggle renders, which is what the kiosk/menu
embeds want") and the same shape as `onOpenLearningPath={qeFocused ? undefined
: …}` on the band. **`collapsed` is still passed**: the launcher auto-collapse
is not the learner's control and must keep working — hiding the toggle removes
the affordance, not the state.

**The phone drawer derives the same set from the same constant.**
`MobileNavDrawer` reuses the real rail precisely so the two cannot drift, and a
trim applied to one of them would undo that. It already renders no collapse
toggle, so that half needed nothing.

**`m-career-tools` is Rubi Insights.** The id kept its Elite-era name through
two renames (see `careerToolsLabelFor`), so the rail LABEL and the id in that
constant do not match — expected, not a mistake.

**One earlier test had to be REWRITTEN rather than deleted.** "Leaves the
Readiness SECTION on the rail either way" was added hours before, when the
Readiness TILE was dropped, and it proved the feature survived by finding the
rail row on Testing. This ask removed that row, so the proof moved: it asserts
the row on QE FOCUSED (whose rail this did not touch, leaving the tile removal
as the only variable), and the Testing half is carried by the section still
resolving. A test whose premise has changed is rewritten with the change
recorded in it — deleting it would lose the original subject.

#### The pacing treatments — `dashboard-pacing-style`

Variant-only, default **`runway`**, in the rebrand panel scope. Each is a WHOLE
answer to "am I pacing to finish in time" rather than a restyle of one answer —
the axis is **prescription → prediction → description**:

| Variant | Says | Unit |
|---|---|---|
| `lo-fi` | nothing — the current stub, kept so the other three are judged against what ships | — |
| `rate` | put in this much time | hrs/day |
| `runway` | clear this much work, and here is the shape of what is left | units/week |
| `balance` | here are the two numbers; you decide | none |

**`rate` and `runway` are not the same prescription twice.** "Put in 1.5 hours a
night" and "clear 4 lessons a week" are different instructions — one is a
calendar habit, the other is output — and which one a learner can actually act
on is the question worth testing. `balance` is the honest floor: if the two raw
figures are enough, the derived versions above are chrome, and that is worth
finding out before building one of them properly.

**EVERY figure is derived; none is authored.** `unitsLeft` reads the same
`totalRequired || path.hours` fallback the "26 of 42 lessons complete" line and
the Completed KPI cell use, so the three cannot disagree about the denominator.
`hoursPerDay` is the derivation `kpiSubLabels` already feeds the `stat-card`
variant with — the `rate` treatment is that line given the tile to itself, not a
new claim. Nothing here knows an OBSERVED rate, a schedule to be ahead of, or a
projected finish date, so **no treatment states one**; the reference mock's "You
are currently pacing 4 days ahead of schedule" is the move this version refuses,
and a test sweeps all four variants for that copy.

`rate` is **omitted, not guessed**, when there is no resume course to read
credit hours from — the same rule `kpiSubLabels` follows. The status cluster
still carries the state, so the tile is never empty.

**The required rate rounds UP** (`Math.ceil`). A rounded-down rate finishes
late, which is the one direction a suggested pace must not err in: 16 lessons
over 27 days is 4.15/week, and at 4 you need 28 days.

**The status pill and its message are ONE element shared by all four**
(`pacingStatus`). The comparison is meant to be about the pacing figure, and
four hand-copied status clusters is how one ends up a weight or a gap different
and wins for the wrong reason.

**`runway`'s strip is deliberately NOT a progress bar.** The block directly
above already runs a full-width `ProgressBar` for this course with the
percentage beside it, so a second bar here would be the third saying of one
number in one column — the duplication that folded the Jump Back In card into
this block. It is one segment per remaining WEEK with the last part-filled by
the days that do not make a whole one (27 days ⇒ four segments, the last at
6/7), which is a fact the bar above does not carry.

**Its fill is `--color-text-tertiary`, and that is the load-bearing choice.**
6.19:1 light / 6.18:1 dark — unusually symmetric, so the strip needs **no theme
swap**. `--color-primary-500` would have wanted one: on this recessed tile the
primary and the `--color-neutral-300` track are both navies in dark and the fill
lands at 1.22:1, which is the exact failure `.cre-jbi-progress-fill` exists for
and which that class's own note records. Measured in the browser, both themes —
figure 8.98 / 12.49, unit and note 4.53 / 8.58, strip fill against its track
3.66 / 3.80, against the tile 4.89 / 5.65.

**Known, pre-existing:** the status pill's ink measures **4.23:1** on its own
fill in light (5.05:1 dark), marginally under AA at 12px/600. It is
`statusTreatment`'s shared compliance pill, unchanged by this work and identical
on QE Focused — raising it is a page-wide change, not a pacing one.

#### …and a fifth, `presets` (2026-09-21)

The wide card from [`xcel-pace-presets.html`](../public/prototypes/xcel-pace-presets.html)
§02, rendered in the product. `defaultVariant` is **unchanged** — Testing still
opens on `runway`, so the committed default is untouched.

| Variant | Says | Unit |
|---|---|---|
| `presets` | you will be done by this date, with this much room after it | a date |

**It is the only one that states an OUTCOME.** The four above state a QUANTITY
and leave the learner to judge whether it is enough; this one answers the pacing
question with a date and makes the quantity the subordinate clause. It is also
the only one you can OPERATE — two real buttons, Start studying and Adjust.

**IT IS `StudyPaceTile` IN A SECOND SHAPE, not a second component.** One prop,
`layout: 'tile' | 'card'`. That is the whole reason the variant is cheap: the
model (`src/lib/studyPace.ts`), the `choices` state and the Adjust sheet are
Testing 2's, reused unchanged, so a fix to the derivation reaches both versions
at once. A `StudyPaceCard` beside it would own a second copy of `choices` and a
second `StudyPaceSheet` mount, which is how two shapes start disagreeing about
what "adjusted" means.

**It renders the whole TILE, so it is NOT an arm of `pacingBody`.** Everything
in that chain renders *inside* the shared `SquareTile`; this card owns its own
eyebrow, because the eyebrow is what carries the provenance ("Study Pace ·
recommended" → "· yours" on first touch, the prototype's §02 finding). The chain
keeps an explicit `presets` arm returning `null` with the reasoning, so nobody
reads the four above it as the complete set.

**IT IS THE ONE TREATMENT WITHOUT `pacingStatus`**, and that is a decision:

- Two pills in two vocabularies. `pacingStatus` is the six COMPLIANCE states;
  the card's own chip is the pace axis. `PaceChip`'s note already records why
  those must not share a badge, and nine pixels apart is the same collision.
- The card answers the status question in its body. "Finishes by May 28, 11 days
  before your exam on Jun 8" is the derivation "On Track" is a label for.
- `pacingStatus` is `marginTop: 'auto'`, so keeping it would put a pill and a
  sentence *below* the card's own primary CTA.

**What that costs:** the five treatments are no longer status-constant. A
reviewer comparing them has to know this one states the state as a sentence.
`TestingVersion.test.tsx` pins the four and pins this one's replacement
separately rather than quietly widening the sweep.

**THE FIXTURE HAS NO CEILING, and the card says so.** The course this tile paces
is the QE profile's Jump Back In fixture (`jbi-xcel-qe-ny`, 40 NY credit hours),
which carries **no `expiresAt`** — not the My Courses record, which is a
different course. So `binding` is `'none'`, the model falls back to its Focused
horizon, and there is no access date to name. The card therefore prints no
window length, no "before access ends", and **no end-stop on the timeline**, and
labels the date as a suggested target rather than a cut-off. The prototype's
"set from your 30-day access" is not restored under any binding — the card names
the CEILING the model used, which stays true whatever the window is and stays
true when an exam date takes over. Give the learner an exam date in the sheet
and the full sentence and the end-stop both appear, both pointing at it.

**`.cre-cta-fill` is new**, and it is the filled twin of `.cre-cta-ink`. The
primary button is navy, not the Brick — this version moved every CTA onto the
primary ramp. It needs a theme selector because the LABEL is fine in both themes
(white on `-500` is 7.64:1) while the button's own SHAPE is not: `-500` on the
dark card measures **2.75:1**, under the 3:1 WCAG 1.4.11 asks of a control's
boundary, so the navy CTA dissolves into the navy card with its text floating on
top. Dark inverts the pair instead of nudging it. Measured — fill against the
card 6.02:1 light / 9.65:1 dark, label against fill 7.64:1 / 8.27:1. The
timeline reuses `runway`'s `--color-text-tertiary` for exactly the reason above
it records.

#### One rule had two owners, and adding this version broke the other

`DemoControlsBar` decided whether to drop Continuing Ed from its Education
dropdown by comparing the version id to `'discoverability-qe-focused'`
literally, while `MembershipOverview` forced the education type from the
LAYOUT. Testing inherits the page's QE resolution and silently fell out of the
bar's copy: **the page resolved a pre-licensing path while the bar above it
still offered — and displayed — "Continuing Ed"**, which is precisely the
"dropdown entry that changes nothing when clicked" the flag audit spent a pass
removing. tsc was clean and all 832 tests passed; only opening the page and
reading the bar caught it.

`isQualifyingEducationVersion` in `dashboardVersions.ts` owns the rule now and
the bar calls it. A new QE-shaped version is one entry there, not two edits in
two files.

#### What is tested

`TestingVersion.test.tsx`, 27 assertions. The Readiness tile is pinned in BOTH
directions (absent here, present on QE Focused) because an absence check passes
just as happily when the whole tile row fails to render — and both directions
were **verified to fail** before being relied on, by flipping `paceOnly` to each
constant. The runway strip is asserted against the days figure the tile itself
prints rather than against today's 27, and the work-left figure is asserted to
AGREE with the block's own completed line rather than to equal 16 — the
relationship, not the number, which is what `ProgressAgreement.test.tsx` exists
to protect.

### Testing 2, and the live Study Pace tile (2026-09-21)

**A new dashboard version, `discoverability-testing-2`, labelled "Testing 2"** —
a clone of QE Focused whose only divergence is that the left square tile renders
a real widget instead of its lo-fi stub. `?version=discoverability-testing-2`.

**It is the SECOND of two, and the pairing is the point.** "Testing"
(`discoverability-testing`, built the same day on
`claude/home-screen-testing-version-6714f7`) asks **what the tile should SHOW**:
it drops Readiness, gives Study Pace the full width, and offers four treatments
behind `dashboard-pacing-style` (Lo-fi / Rate / Runway / Balance). Testing 2 asks
**what the learner should be able to DO**: the tile keeps its square and states
one derived pace with no controls at all, and everything adjustable moves behind
Adjust into a sheet. They are not competing drafts of one design — they are
different questions about the same slot, and both want answering. Named "2"
rather than merged so the picker carries both and neither branch has to win.

**Why a version and not a flag on QE Focused.** A flag is global to the session,
so flipping it changes every tab; the whole point is opening these **side by side
in separate tabs**. QE Focused is also XCEL's default, so the thing most people
open stays the reviewed one. `MembershipOverview` treats `testing-2` as
`qe-focused` for every other decision (`qeFocused = dashboardLayout ===
'qe-focused' || testingVersion`), so the two cannot drift apart by accident; the
single difference is the `livePace` prop threaded to `LearnerFocusedBand`.

There is a flag too — **`study-pace-widget`**, default ON — but it is scoped:
`livePace={testingVersion && studyPaceFlag}`. Off, Testing 2 shows the same
placeholder as QE Focused, which is what makes the switch worth having. It is a
separate axis from the other branch's `dashboard-pacing-style`, deliberately:
two versions exploring one slot should not share a control, or flipping one
re-renders the other's argument.

**`SquareTile` moved out of `LearnerFocusedBand`** into its own file, unchanged
apart from one added prop (`action`, a control on the tile's floor beside
`Details →`). It moved because a second caller arrived; a tile treatment that
exists twice is the drift `widgetStyles.ts` exists to stop.

#### The model — `src/lib/studyPace.ts`

Ported from [`public/prototypes/xcel-pace-presets.html`](../public/prototypes/xcel-pace-presets.html),
which is still where the argument is made. Pure functions, no React. Three
claims survive the port:

1. **A preset is a DATE, not a weekly quota.** Relaxed / Recommended / Focused
   are three dates the learner already owns; the pace derives from whichever
   they pick. Nobody is asked to judge whether 5 hours a week is a lot.
2. **TWO ceilings can bind and the UI must say which.** Course access expiry
   (`expiresAt` on the resume course, minus one — finishing the day access dies
   is not finishing) and, when the learner gives one, the exam date minus
   `EXAM_BUFFER_DAYS`. The SOONER governs; `binding` records it.
   `EXAM_BUFFER_DAYS` is 7 **deliberately equal** to `xcel-study-plan.html`'s
   own constant — two surfaces disagreeing about how long revision takes is how
   a learner stops believing either.
3. **One nights count across all three presets**, derived from Recommended.
   Per-preset nights made a 3-night Relaxed read heavier per evening than a
   4-night Recommended, and the presets stopped being comparable.

**THE ONE DEPARTURE, and it is an improvement.** The prototype priced a lesson
at `MINS_PER_LESSON_INVENTED` (35) and flagged the gap between that and the
storefront's published credit hours as its biggest hole — if seat-time were the
real figure, every evening it quoted was ~1.6x too light. **The product does not
need the invention**: a course record carries real `hours`, so this module works
in HOURS OF WORK REMAINING and the hole closes by construction. Nothing converts
lessons to minutes.

`presetLabel()` carries the prototype's §03 finding into code: **"Relaxed" is a
property of the COURSE, not of the preset.** Under `EASY_MINS` (45) the word
stands; above it the preset is described as **Full window**, because on a long
course the full window still costs most of an evening and calling that relaxed is
the product lying in a warm voice.

Dates follow `courseExpiry`'s rule — never `new Date(isoString)`, which parses as
UTC and renders the previous day in a western timezone. A test pins it.

#### The surface — `StudyPaceTile` + `StudyPaceSheet`

**THE TILE OPERATES NOTHING**, and this is the whole difference from Testing,
which spends the slot on showing more. Jillienne's call on 2026-09-21: one
control, Adjust. No preset strip, no nights picker, no date field. That is what keeps a
dashboard tile a *statement* rather than a control panel someone has to read
before they can start studying, and `StudyPaceTile.test.tsx` counts the buttons
so a strip cannot creep back on.

The sheet (the repo's own `Sheet` — Esc, scroll lock and focus restore already
handled) has **four groups, and the order is the argument**: what are you aiming
at (the three dates as radio rows, the evening shown beside each as a
consequence) · how many days a week · your exam date · create a study plan.

**The weekday picker exists only under the fourth**, and that is the structural
decision worth not undoing: days-a-week is all the PACE needs, so that is all the
first three ask. A calendar cannot be built without real weekdays and a time, so
those questions arrive with the thing that needs them — and from then on ticking
days is authoritative and re-prices the evening rather than letting the count and
the calendar quietly disagree.

The pace chip is deliberately **not `StatusBadge`**: that vocabulary is the six
COMPLIANCE states, and this is a different axis (how heavy the chosen pace is).
Two meanings wearing one badge is how a learner reads "At Risk" off a tile that is
only saying their evenings are long.

**Readiness stays lo-fi in BOTH versions**, and that is not an oversight: the
pace model derives from facts the product has, and there is still no readiness
model to derive anything from. Grey bars say "not built"; a plausible number
would say something false.

**Open, and known:** what happens to sessions already written when the pace later
changes (rewrite, append, or let them disagree); whether a typed, unverified exam
date should outrank one booked through the walk-through's own flow — the admin
roster's Risk column would then be measuring against a date the learner may have
invented; and what the three presets mean on a CE course with no access window at
all, where Relaxed has nothing to aim at.

Tests: [`src/test/studyPace.test.ts`](../src/test/studyPace.test.ts) (25, the
model) and [`src/test/StudyPaceTile.test.tsx`](../src/test/StudyPaceTile.test.tsx)
(16, the surface).

### Atlas/Compass Global Navigation — the Testing home under its own rail (2026-09-22)

`discoverability-atlas-compass-nav`, after the two Testing versions in the
picker. It explores ONE navigation across Atlas (the dashboard — the Study
Journey, readiness, the programme) and Compass (the course content the
launcher opens).

**Its home IS Testing's.** `dashboardLayoutForVersion` resolves it to the
`testing` layout, so it is the same page rather than a copy, and every Testing
and QE rule holds. It started life resolving to `qe-focused`; it moved when
`feat/pace-presets-variant` was merged in, because the Testing home is the one
that was asked for. Do not give it a layout of its own to change one card:
that is how two copies of one home start to drift.

**What it adds is the rail**, `AtlasCompassSideNav`, from Figma
`hXiYWnaiZWIwWmaTk7pk3F` node 49:3365:

- **Text only**, five rows — Home · Study Plan · Certificates & Transcripts ·
  Resources, then Support · Get Help. "Certificates & Transcripts" is the
  design's label for the existing `certificates` section, not a new one; the
  page's own heading still says "Certificates".
- **The list is data** — `ATLAS_RAIL_GROUPS` in `dashboardRail.ts` — so
  `railHidesSection` answers from it for this version. **The Testing trim does
  not apply**: Testing hides Study Plan and Resources from the shared rail, and
  the Atlas design names both. Readiness is absent from this rail too, so the
  demo bar greys its dropdown here as it does on Testing.
- **Not filtered by `nav-show-*`**: the flags describe the demo rail, and
  applying them would let a flag silently remove a row the design names.
- **No collapse control, so it never collapses** — not even while the Compass
  launcher is open. A 76px strip with no way to re-open it strands the learner.
- **260px wide** (the design's), with the content column giving up the 40 so
  `260 + 1180` still makes the 1440 design width.
- **Colours are `--color-atlas-nav-*`** in `tokens.css`. The design's `#004d7c`
  and `#dfe3eb` are on no XCEL ramp, so they are declared rather than
  approximated. Every row state lives in `.cre-atlas-nav-row` — padding
  included — because an inline padding would beat the active row's
  `padding-left: 13px` (3px bar + 13 = the idle 16). **Dark values are not
  from the design**, which is light only.

**Desktop only.** The phone shell still draws the shared rail with the Testing
trim; the Figma frame says nothing about a phone.

### `dashboard-clp-stats` — the stat card (2026-09-16)

A SECOND variant axis, for the Target Date / Time Remaining / Completed cells
and the status below them: `default` · `stat-card`. Separate from
`dashboard-clp-style` on purpose, so the header treatment and the stats
treatment combine rather than multiplying into one list of pairs.

`stat-card` gathers the three cells and the status onto one white card with a
hairline border and a rule between them, gives each cell a **sub-label** under
its value, prints Completed as a **two-tone fraction** (the unit moves to the
sub-label, so the value is a bare "26 / 42" with the denominator dimmed), and
runs the status pill **uppercase on an untinted row**.

**`StatusStrip` gained a `bare` prop** for it. A tinted row inside a white card
reads as a second card, and the card is already the surface. The pill keeps its
tint, which is what carries the state — the wash never did (its own note records
~1.02:1, i.e. decoration).

**The pace line is DERIVED, not authored.** "~1.5 hrs/day suggested pace" is the
state's real 40 credit hours (carried on the resume course, since the path
measures lessons now) over the days remaining. It is omitted rather than guessed
when there is no course to read hours from.

**What the reference has that is deliberately NOT reproduced:** "You are
currently pacing 4 days ahead of schedule. Maintaining this velocity ensures
completion prior to your statutory window." Nothing in the fixtures knows a
schedule to be ahead of, and the status message is the one the shared
`statusMessageFor` returns. Authoring the claim would be the move this version
has refused throughout — a test asserts the copy is absent.

The other sub-labels are LABELS, not claims: "Your exam target date", "Lessons of
this course". They say what the number is, which is the whole reason the
treatment has room for a third line.

### `dashboard-clp-style` — three treatments of the block (2026-09-16)

A variant flag on the Current Course Progress block, to a supplied reference (a
dark resume card with a big percentage on the right). Variant-only, like
`dashboard-heading-font`: `default` · `big-number` · `navy`.

- **default** — unchanged. Art left, title and meta right, the bar under the
  meta with the percentage beside it.
- **big-number** — same light ground; the percentage becomes a 40px figure in
  its own right-hand column, with the bar and "26 of 42 lessons complete"
  beneath it. The inline bar+label goes, so the number is still drawn once.
- **navy** — the same cluster on a `--color-primary-700` card: light type, a
  green bar, the big figure right, a **white** Resume button (the primary
  gradient is this card's own colour, so the button would vanish into it). The
  KPI cells, status strip and View Requirements stay on the page grey below, so
  the variant dresses the cluster rather than the whole block.

**No variant invents lesson-level content.** The reference shows "Lesson 27 —
Life insurance policy provisions · 14 minutes left in this lesson"; there is no
lesson title and no per-lesson timing in the fixtures, and authoring one is the
rule this version has held throughout. A test sweeps all three variants for that
copy.

**Navy drops the cover**, as the reference does — and that is what gives the
title room. The percent column is **160px, not 200**: at 200 the title column
was left ~140px and "New York Life and Health Pre-licensing" wrapped to five
lines, the number winning an argument it should not have been in.

**THE `metaRow` SEAM FAILED AGAIN, in the opposite direction.** That row is
assembled ABOVE the surface-specific markup, so a treatment applied by sweeping
that markup misses it. It shipped white-on-page-grey at ~1.2:1 when the page
surface landed; here it kept the PAGE's `--color-text-secondary` on the navy
card and measured **2.13:1**. Both were invisible to tsc and to every other
test, and both were caught only by reading the computed colour in a browser.

It resolves through `nMuted` / `nLine` now — which is the argument for those
existing at all rather than each block picking its own ink: a third treatment
resolves here too. After the fix every navy value measures **12.25:1**.

**One stale literal went with it.** The no-breakdown fallback read
"{completed} of {required} **hours** complete" as a hardcoded word, which had
been wrong since the unit moved — it printed "26 of 42 hours complete" under a
bar labelled in lessons — and it leaked into the navy variant, where
`resumeInline` is null and this was the else-branch.

### `dashboard-heading-font` — serif headings, as a variant (2026-09-16)

A variant flag on the Dashboard Rebrand overview: **Sans** (default, the brand
face) ⇄ **Serif**. Scoped to `dashboard-rebrand` and in the panel's rebrand
scope.

**It re-points ONE token for a subtree**, which is the whole implementation:
`MembershipOverview` puts `.cre-dash-serif-headings` on its root, and that class
declares `--font-heading: var(--font-heading-serif)`. Custom properties cascade,
and an inline `font-family: var(--font-heading)` resolves against the value the
element INHERITS — so every heading inside switches, inline styles included,
with no component knowing the flag exists. The alternative was threading a font
prop through the band, the two widgets, the section leads and the cards: a dozen
call sites for one choice.

**Scoped to the overview root on purpose.** The shell's `<h1>`, the left rail
and the header keep the brand face, so both faces are on screen at once — which
is the comparison a reviewer flipping this actually wants. Verified: band and
widget titles Georgia, rail Open Sans, page title Lato.

**Variant-only**, like `learning-path-status-display`: `defaultEnabled: true`
and the CHOICE is the variant. A separate on/off would be two controls for one
decision, and "off" would have to mean "sans", which the variant already says.

#### The serif is a STAND-IN, and this is the part not to lose

**The reference is the live xcelsolutions.com heading, which is Amasis MT — and
this file already says not to reproduce it.** The XCEL typography note in
`tokens.css` records it as OFF-BRAND: *"the LIVE SITE's Amasis MT serif headings
are OFF-BRAND (Amasis appears nowhere in the guide). Do not reproduce them."*
It is also a Monotype face that is not licensed to us and is not on Google
Fonts, so it could not be reproduced faithfully in any case.

So `--font-heading-serif` is a **system stack** (Georgia and its cousins), and
two things follow:

- **No asset and no request.** Every face in it ships with the OS, so the
  variant works offline, inside the Demo frame, and on a machine that has never
  reached Google Fonts. Adding a webfont for an exploration flag would make the
  DEFAULT view pay for a variant nobody has chosen.
- **It answers "what do serif headings look like here", not "here is that
  face".** Which is what a variant is for. The caveat is in the flag's own
  DESCRIPTION, where the person flipping it will read it — not only here — and a
  test asserts both the description and the tokens.css note still say it.

Repointing the token at a licensed face, or at a Google family added to the
existing `<link>` in `index.html`, is that one declaration.

**Worth remembering when reading this:** XCEL's `--font-heading` is itself a
placeholder. The brand's face is **Avenir** (Linotype, unlicensed to us); the
app ships STC's **Lato** because it was already loaded, with **Nunito Sans** as
the intended substitute. So "Sans" here means the placeholder, not the brand.

### The rail profile header is unwired (2026-09-16)

The pinned top region of the dashboard rail — the learner's 48px avatar with its
Brick `brandRing`, "Welcome back, <name>" as a button to the Profile page, their
motivational statement, and the divider under the group — is gone from the rail,
at Jillienne's request.

**It is the other half of the change above.** The header's account trigger
gained the learner's photo AND name the same day, so this was the second
portrait-and-name of the same person in one viewport, a few hundred pixels
apart. The rail opens on **MY LEARNING** now, which is its job.

**Archived, not deleted** — `ARCHIVED_ITEMS` id `nav-profile-header`.
`NavProfileHeader` is **exported** rather than left as an unreferenced local
function, because that is a lint error; it is the same treatment
`MotivationalStatementCard` gets on the Profile page. Nothing inside it changed.

**Three things travelled with it, and the restore note names all three:**

- **`const isMember = membership === 'member'`** went from `PlatformSideNav` —
  the header was its only consumer, so `membership` left that `useAccount()`
  destructure too. A restore that re-adds only the JSX is a compile error.
- **`NavMembershipSummary`** is reachable only through it. Moot for XCEL
  (`supportsMembership` is false, so it never rendered), and live for a brand
  that sells one.
- **`brandRing` on `Avatar` now has NO call site.** It exists to mark this
  avatar as the learner's own, and this was documented as its only caller — so
  restoring the header restores the only thing that uses it. That is also why
  the new header trigger deliberately does not take it: see above.

**It fixed a restore note that had gone false.** The `profile-motivational-statement`
row claimed the panel was "STILL REACHABLE from the left rail (`NavProfileHeader`
→ MotivationalStatementPanel)". Unwiring the header made that untrue, and a
restore note that lies is worse than none — it is corrected in place, and a test
pins the correction. **The STATEMENT itself is unaffected:**
`ProfilePersonalizePanel` still reads and writes it through `MotivationContext`
and `ProfilePersonalizeBand` still displays it. What has no live caller now is
`MotivationalStatementPanel`, the slide-over.

**A brand-rule test had to have its control replaced.**
`XcelNoMembership`'s "no membership pill in the rail" used the greeting as its
control — proof that "no pill" was suppression rather than the rail failing to
render. The control is the **Home** row now, and the test also asserts the
greeting is absent, so it cannot silently start measuring this removal instead
of the brand rule. Same trap that section already records from the other
direction: a test about capability must pin what it depends on.

### The header account trigger is the learner (2026-09-16)

The top-right control was a generic `CircleUser` glyph in a `cre-icon-pill`. It
is the learner's own photo plus their name now, at Jillienne's request — so the
two ends of the header row, the rail's profile header and this, both say who is
signed in.

**The real fix was where the learner came from.** `Header` rendered
`<AccountMenu initials="SC" />` — the ONLY prop it ever passed, and not this
learner's initials (Alicia Navarro → AN). The component's own comment claimed
"`Header` always passes the live values from `useAccount().user`"; it did not,
so the hardcoded prop defaults WERE the menu. Invisible behind a glyph, and a
second learner the moment the trigger shows a face and a name.

`AccountMenu` resolves its own now, from the same two sources `NavProfileHeader`
reads: `useAccount().user` and the profile-avatar override. Uploading a photo on
the Profile page moves both. The props survive as OVERRIDES for an isolated
mount, which is what they were genuinely being used for.

**`email` is the one field with no source** — `DemoUser` carries a name,
initials and an avatar but no email, so it stays an authored default rather than
being derived. `first.last@gmail.com` would be a guess rendered as a fact, which
is the rule the Links panel's `addedBy` field follows.

**NO `brandRing` on it, deliberately.** The rail's 48px avatar is documented as
the ONLY call site that carries the Brick ring — that is what marks it as the
learner's own — and a second ringed avatar in the same viewport spends the
distinction rather than making it. At 28px a 2px ring is proportionally heavier
than it is at 48, too. A test pins the absence here and the presence there.

**`cre-account-pill`, not `cre-icon-pill`.** That one is a fixed 40×40 SQUARE
built for a single glyph and cannot hold a name. The new class is the same pill
sized to its content and is otherwise identical — radius, hover value,
transition, transparent rest state — because the trigger sits in a three-item
cluster beside the cart and the bell, and one that hovers differently reads as a
different kind of control. A test asserts the two hover rules are the same
string rather than merely both existing.

**The NAME drops below 900px**, not the pill: at phone widths the header is a
logo, a hamburger and this cluster, and a full name is the first thing that
should go. The button's `aria-label` still carries it, so assistive tech loses
nothing. Measured: 143px wide at desktop, collapsing to 40 — the icon pills'
own width — at 375.

Measured: the name is 11.37:1 on the white header.

### Two small brand touches (2026-09-09)

**The learner's own avatar carries a thin Brick ring** — `brandRing` on
`Avatar`, 2px of `--color-cta-500`, which on XCEL is #9A1B1E: the same red as
the knight in the logo. It marks the rail profile header as *the learner*, since
every other photo on the dashboard is stock or course art, and it is the ONLY
call site that sets it.

**SUPERSEDED 2026-09-16 — that call site is unwired**, so `brandRing` currently
has none. The rail profile header is archived (`nav-profile-header`), and the
header's new account trigger deliberately does not take the ring: a second
ringed avatar in one viewport spends the distinction rather than making it. The
reasoning below is unchanged and is what to re-read if the header comes back.

Deliberately not the existing `ring` prop — that is 3px border + a 2px offset
outline, ten pixels of chrome on a 48px circle. Under the global border-box
reset the 2px eats into the box, so the avatar still measures 48 and nothing
reflows. A non-default `tier` supersedes it, the same way it supersedes `ring`:
tier bands are concentric and flush, so a red ring outside them would read as a
fourth band rather than as identity. XCEL has no membership, so the two never
meet today.

**The band eyebrow is "Current Progress"** as of 2026-09-16 — it has moved three
times: "Current Learning Path" → "Current Learning Progress" (2026-09-09) →
"Current Course Progress" → this. The first changed WHAT is described (progress
through a path rather than the path itself); the second changed the OBJECT, for
a version that tracks one course rather than a path of several; the third drops
the object altogether.

**Which resolves the warning the second one carried.** The object is already
named directly above the eyebrow — the block's own heading is the course, and
with `dashboard-course-header` on, so is the page title. An eyebrow repeating it
was a third saying of one name. "Current Progress" labels the block without
competing with it, and it is equally true of a path, so the one-constant rule
stops costing Learner Focused and Marketing Focused anything.

The original note follows.

**The band eyebrow was "Current Learning Progress"**, renamed from "Current
Learning Path". It is ONE exported constant, `CURRENT_LEARNING_EYEBROW` in
`learningPathsHomeUtil`, because **five** components rendered that literal —
the Marketing Focused band, the full-width Clp/Jump-Back-In band, the Learner
Focused band, the completed celebration, and the section lead in
`MembershipOverview`. They are layout variants and states of the SAME band, so
renaming four of five would have had the heading change as a reviewer flipped a
layout flag. The test asserts the constant rather than the words, for the same
reason.

"Path" survives everywhere it names the PAGE or the object — the `learning-path`
rail section, "Switch Learning Path", the Learning Paths landing. Only the
dashboard band's heading moved, where what is shown is progress THROUGH a path
rather than the path itself.

### The demo rail — what a stakeholder sees first (2026-09-09)

`NAV_SECTION_FLAGS` entries carry an optional `defaultEnabled`, and five are
**false**. The committed baseline is:

> Home · Study Plan · Readiness · My Courses · Certificates · Resources ·
> Rubi Insights — Get Help

(As of 2026-09-16. The original 2026-09-09 baseline was: Home · Study Plan ·
My Courses · Certificates — Browse Catalog · Resources · AI Study Partner —
Get Help. What moved since: Readiness joined, Rubi was renamed twice, Resources
and Rubi moved into My Learning, and Browse Catalog went off — which took the
Explore group with it.)

Off: Learning Path, Recommended for You, Resource Library, Exam & Cert Prep,
Podcasts. Two different reasons, and the difference decides whether to bring one
back. **Learning Path** is off because Home's full-width Current Learning Path
band already IS it — the rail row was a second door onto what the landing page
leads with. The other four are simply not what this demo is about; **Podcasts**
is the sharpest case, since XCEL has no podcast product and the section is an
EmptyState saying so, i.e. a rail row leading to "not part of the catalog
today".

**Nothing is disabled.** The flag hides the RAIL ROW; every section still
resolves, so `?section=podcasts` opens Podcasts and `?section=learning-path`
opens the Learning Path. That is what makes a hidden section demoable on request
rather than gone, and it is why trimming the rail is an editorial act rather
than a feature cut.

`NavSectionFlags.test.tsx` asserts the WHOLE rail in order, not "X is absent" —
a presence check passes just as happily when an unrelated row appears. A row
moving in or out should fail that test and be re-decided.

**Two traps this set off, both worth knowing.**

*A brand-rule test read the demo rail.* `XcelNoMembership` asserts XCEL KEEPS
Exam & Cert Prep (its core product) while dropping Partner Offers — the
`hiddenBenefitSections` rule. With the demo default off, that row vanished for a
reason having nothing to do with membership, and the test failed for the wrong
thing. It now seeds `nav-show-m-exam-prep` ON, so it measures the brand rule and
NavSectionFlags measures the editorial one. **A test about capability must pin
the flags it depends on, or an editorial default silently becomes its subject.**

*Demo mode does not read the catalog default alone.* `?demo=1` renders
`baselineFrom(customDefaults)` — the reviewer's per-browser "Set as default"
snapshot (`cgp.featureFlags.customDefaults`) **wins over** the committed
default, per key. That snapshot is local and never committed, so a machine
holding a stale one shows a different demo rail from a clean machine, with
nothing in the repo to explain it. If the demo looks wrong on one laptop only,
that key is the first thing to check.

### Resources — the Free Content section, restored 2026-09-09

A rail section (`resources`). It was **paired with Browse Catalog** — that one
is what you buy, this is the free half of the same "go and find something" job —
and sat directly under it until 2026-09-16.

**That pairing is over.** It briefly led the Explore group, then moved into MY
LEARNING the same day: see "Resources and Rubi are in MY LEARNING" below. The
argument that replaced it is that a candidate does not browse the reference
material, they use it — so it is one of the learner's own things rather than the
free half of the shop. The reasoning below is the original and is what to
re-read if the pairing is ever wanted back. The body is XCEL's four outbound
destinations — Resource Center, the product blog, and the 2026 Career and
Salary Guides.

**A re-wire, not a rebuild — which is the archive convention paying off.**
`ResourcesPanel`, `ResourceCard` and the brand-keyed `resourcesFixtures` were
kept intact and unreferenced when the section was archived on 2026-08-26, so
restoring it was five registration points and no new component or fixture.

**It does re-open an archived decision, and that decision was not wrong.** Free
Content was pulled because its rows are OUTBOUND links and "a primary nav row
promises you stay put" — they moved to the account dropdown, where they still
are. Both doors are now open, which is normally the `recommended-card-ab-demo`
mistake. It is accepted here because the two are not the same door: the
dropdown rows are four separate menu items you must already know to look for,
and this is one browsable surface a shopper can find. **If that reads wrong in
review, the cheap fix is dropping the four rows from `AccountMenu`, not
re-archiving the page.**

The hero copy comes from **`resourcesCopyFor`**, not from `SECTION_HERO_META`.
That file owns the sentence, next to the resource list and to the rule it has
to follow ("say plainly that it is free"); a `SECTION_HERO_META` entry would
make one sentence exist twice. A test compares the rendered hero against the
fixture rather than against a literal, so the two cannot drift apart quietly.
No "Included with your membership" eyebrow — `MEMBERSHIP_EYEBROW_SECTIONS`
already excluded it, and on this page in particular the eyebrow would claim the
opposite of what the page says.

**Not added to the MVP rail** (`?nav=mvp`). That list is a Figma-specified trim
(node 53:5290); growing it would be editing a design rather than implementing
one.

**All four links were dead, and the archive is why nobody noticed.** The hrefs
were authored as plausible guesses shaped like the marketing names
(`/resource-center/`, `/whats-new/`, `/career-guide/`, `/salary-guide/`) under
a `TODO(data)` saying the slugs were unconfirmed — and all four 404. XCEL nests
the set under `/resources` and gives the guides descriptive slugs. `AccountMenu`
reads the same list, so the dropdown rows were broken too, and had been since
the section was archived.

`supportFixtures.faqUrl` carried the identical defect: the guessed `/faqs/`
404s, and `/faq` exists only as a redirect to Customer Support. It points at
`/customer-support` directly now — so the FAQ card and Contact Us lead to the
same page, which is XCEL's own IA. If that reads redundant, drop the FAQ card
for XCEL rather than inventing a URL for it.

**The four cards carry four different glyphs** (2026-09-09): blog for the
Resource Center (the hub the others sit under), a megaphone for What's New
(announcements), and an open book for the two guides. They all started as
`blog`, which rendered four identical RSS marks — a glyph that says "feed" over
a salary guide, four times.

`book` and `megaphone` are NEW `ResourceIcon` keys, not `blog` repointed:
`blog` still means a blog, and a key whose name and picture disagree is the
kind of thing nobody unpicks later. Three `Record<ResourceIcon, …>` maps make
the compiler list the call sites (`ResourceCard`, `FreeContentBands`,
`AccountMenu`) — that seam is what stopped the account dropdown keeping the old
glyph silently.

**Watch what this did to the type, because it decides how to add the next one.**
`ResourceIcon` began as a CONTENT TYPE (blog / podcast / facebook — one per
kind of feed), which is why `FreeContentBands` colours a band from it: reading
primary, audio secondary, community tertiary. Picking glyphs per card for
variety turns the field into a GLYPH NAME, and the two jobs stop coinciding —
`megaphone` is not a content type, and it takes the reading ramp because the
thing it labels is still a blog. Fine while the rule is "reading unless audio
or community". If a resource ever needs a glyph and a colour that disagree,
split this into two fields rather than inventing a ramp for a glyph.

**The rule: confirm a URL on the way IN, not later.** An unconfirmed href is
harmless while nothing renders it and a user-visible defect the moment its
surface ships — a `TODO(data)` does not survive the thing it is attached to
being switched on. `ResourcesPanel.test.tsx` now asserts the four dead slugs
stay dead (the `smoke-desktop.mjs` / `ProfilePersonalizeContrast` pattern),
because the wrong answer here is the one that looks right, and a test cannot
reach the network to find that out.

### `ce-study-plan` — the CE path has a plan now

**This reverses a decision `studyCalendarFixtures.ts` used to state.** The CE
path was excluded from `XCEL_PATHS_WITH_CALENDAR` because "a renewal cycle with
a variable, sometimes birthday-based deadline is not the same object as a
countdown to a booked exam, and it drops cleanly into the empty branch rather
than being given a plan that misdescribes it."

The DEADLINE half of that still stands, and `XCEL_CE_STUDY_CALENDAR` respects
it: the plan paces HOURS and claims no exam date of its own. What the old note
overreached on was the WORKLOAD — 24 required hours against a concrete date is
the same pacing job, so the empty branch was withholding something usable.

Behind `ce-study-plan`, **default ON**. Off restores the prior behaviour
exactly. Both surfaces that resolve a plan read the same
`useCeStudyPlanEnabled()` hook — the Jump Back In card and the Study Plan page
— because one showing a CE plan while the other showed the empty branch is the
drift the hook exists to prevent.

### Resources and Rubi are in MY LEARNING (2026-09-16)

The rail reads **Home · Study Plan · Readiness · My Courses · Certificates ·
Resources · Rubi Insights** — then **Explore: Browse Catalog** — then Support.

**This moved twice in one day, and the second move settles it.** The two first
led the Explore group (above Browse Catalog), and the note here argued they
should stay there: the groups are semantic, Explore is every discovery surface,
and both of these are discovery. Jillienne's call is that they belong to the
learner, and it is the better read — a pre-licensing candidate does not BROWSE
the reference material and the AI tutor, they USE them, session after session,
against the one curriculum they are working. Browse Catalog is the discovery
surface in that group; these two are tools.

**At the END of My Learning, after Certificates.** "Move up" means up across the
EXPLORE divider, which is the whole of the change; above Home would demote the
rail's anchor, which nobody asked for. Their relative order carries over
unchanged.

**Explore is GONE from the demo rail** (2026-09-16, later the same day). It was a
one-row group after the move — Browse Catalog alone — and that row is now
`defaultEnabled: false`, which empties the group and therefore drops it and its
caption whole, by the existing "a group whose items are ALL hidden falls out"
rule. The rail is **My Learning · Support**.

Through the FLAG, not by deleting the row, and that is the point of the baseline:
`?section=catalog` still opens Browse Catalog (verified — the page's `<h1>` reads
"Browse Catalog"), and a reviewer can bring the row back from the flag panel
with no code change. Editorial, not a capability cut — the QE Focused default is
built for a candidate working one booked exam, and the shop is the least
relevant row on that rail.

The earlier reasoning for keeping it as its own group — "the divider says your
things end here, the shop starts" — is superseded: with nothing else in it, the
divider was separating the learner's things from a single row.

`NavSectionFlags` asserts the absence of the LIST rather than of the row, which
is what proves the drop-empty rule ran: an empty group with a heading over
nothing is the "reads as a load failure" defect that rule exists to prevent.

**`m-career-tools` is spread in My Learning and filtered out of the later
`MEMBERSHIP_ITEMS` spread**, or it renders twice — React would warn about the
duplicate key but the rail would still draw, so the guard is the filter rather
than the console.

**Not added to the MVP rail** (`?nav=mvp`) — a Figma-specified trim (node
53:5290).

#### The tests could not see this move, and that is the lesson

Every rail assertion in the suite passed the change **without noticing it**.
Moving the two rows from the top of Explore into the bottom of My Learning
changed which `<ul>` they belong to and changed the flat button order **not at
all** — Resources · Rubi Insights · Browse Catalog are still consecutive in that
order. So `NavSectionFlags`' whole-rail-in-order list and `ResourcesSection`'s
index check were both green on both arrangements.

Each group's `<ul>` is `aria-labelledby` its caption, which is the handle that
CAN see it: `getByRole('list', { name: 'My Learning' })`. Both tests assert
group membership now, and `NavSectionFlags` says in a comment that its flat list
is blind to grouping — so the next person does not read a passing in-order
assertion as proof the groups are right.

Same family as the demo-rail note above ("a presence check passes just as
happily when an unrelated row appears"), one level up: an ORDER check passes
just as happily when the grouping changes underneath it.

### Rubi is "Rubi Insights" on XCEL now (2026-09-16)

**Renamed again**, at Jillienne's request: "Rubi AI Tools" → **"Rubi
Insights"**. The 2026-09-10 note below is unchanged and still explains WHY the
label is not Elite's "Career Tools" — that rule has survived both renames; what
keeps moving is which XCEL-true name to use, which is an editorial call.

**Seven non-test sites, all changed together**, and the list is longer than the
four the note below records, because it now includes the ones that were already
agreeing: `careerToolsLabelFor`, `MEMBERSHIP_ITEMS`, `NAV_SECTION_FLAGS`,
`PlatformShell`'s `SECTION_TITLES`, `membershipFirstFixtures`, and BOTH
`sectionHeroMeta` entries — the XCEL override and the brand-agnostic DEFAULT.

**The default was renamed too, and that is the call worth recording.** Its
description is still Elite's career-coach framing ("interview simulators, a
resume builder"), which is what a brand-agnostic default is for — but the
PRODUCT'S NAME is one name across the repo. Leaving "Rubi AI Tools" there would
have put a second name in the codebase for a reader to pick between, which is
how a third one gets invented. The name and the framing are different fields.

`XcelNoMembership` still asserts against `careerToolsLabelFor` rather than the
string, which is exactly why the second rename touched one line of it (a
comment). `NavSectionFlags` asserts the whole rail in order and DOES carry the
string — deliberately, because it is measuring the demo a stakeholder sees.

---

The rail read **"AI Study Partner"** — XCEL's own wording on xcelsolutions.com
— and it is "Rubi AI Tools" as of 2026-09-10, at Jillienne's request.

**This reverses half of a documented decision, and only half.** The reasoning
in `careerToolsLabelFor` was: Rubi is a career coach on Elite and an EXAM STUDY
AID on XCEL, so "Career Tools" misdescribes the product. That still stands and
is still why the label is not "Career Tools". What moved is which XCEL-true
name to use — the brand's descriptive one, or the product's own.

**It closes a split rather than opening one.** `SECTION_TITLES` and the default
`SECTION_HERO_META` both already said "Rubi AI Tools"; only the XCEL override
and the rail said otherwise, so the two names had been coexisting.

The string lived in FOUR places — `careerToolsLabelFor`, `NAV_SECTION_FLAGS`,
the `sectionHeroMeta` XCEL override, and `membershipFirstFixtures` — all
changed together. `XcelNoMembership` asserts against the HELPER rather than the
string now: which XCEL-true name to use is an editorial call that has moved
once, while "it is not Elite's" is the rule.

### Two cards left the Profile page (2026-09-10)

**Different reasons, different mechanisms**, and the distinction is the point:

- **Membership Plan** is gated on `supportsMembership`, a CORRECTNESS fix. It
  was announcing "Automatically Renews on 11/01/2026 · 108 Days of Membership
  Remaining" on a brand that sells no membership — the same defect as the
  Membership nav link the brand-add's suppression list missed. Because it is a
  brand predicate, it returns on its own for a brand that has one, so it gets
  NO archive row: a row would tell the next person to re-add something the
  predicate is deliberately withholding.
- **Motivational Statement** is UNWIRED — an editorial removal, and the FIRST
  row this repo's archive has ever held. The component, `MotivationalStatementPanel`
  and `MotivationContext` are untouched, and the panel is still reachable from
  the left rail, so the feature is not gone — only its second door.

A test asserts both the removals AND that only the editorial one is archived.

**A THIRD instance of the same defect went with them:** Account Details' "Member"
pill, keyed on `isMember` — which XCEL's own tier makes true. The question that
has to be asked first is whether the brand sells a membership at all. Gated on
`supportsMembership` like the card, so it returns for a brand that has one.

Three surfaces, one root cause, found one at a time: the rail's Membership link
during the migration, then this card, then the pill. **When a brand predicate
turns something off, sweep for the other places that ask the tier instead.**

### Notifications — the bell, and what a notification IS (2026-09-10)

A bell in the header between Cart and the account menu, an unread badge, and
a 380px panel. Behind `header-notifications` (default on), with
`notification-state` as its demo axis. The card treatment is the Figma
**"Alerts"** port (`kDJB8Xga3bscFwj2rDXuin`, node `4:287`).

**The load-bearing decision is that a notification is not a toast**, and the
Figma cannot tell you that because it draws them as one component. They are
different objects:

- A **toast** is feedback on something YOU JUST DID. It is transient because
  its job ends the moment you have seen it — you already knew.
- A **notification** is a record of something that happened TO YOU WHILE YOU
  WERE NOT LOOKING. It is durable because you have not seen it yet.

**Only the second goes in the bell.** Pipe the toast stream in and within one
session it fills with "Statement saved" — a list of things the learner already
acknowledged, which is how a notification centre becomes the thing nobody
opens twice. An event may legitimately do both (a certificate is issued →
toast now, still there tomorrow); `raisesToast` marks that overlap so the two
systems cannot be quietly conflated later.

**"Notifications" already meant something else here — and the account section
now holds BOTH readings.** There was a section by that name
(`?section=notifications`, Bell icon, in the account dropdown and sub-nav)
before the bell existed, and it meant **preferences**: which emails you get.
The bell means the **feed**. Rather than rename either out from under a
reviewer, the page is the full FEED with a preferences card beneath it, so one
address answers both readings and the bell's **View all** has somewhere real
to land.

**That link was "Notification settings" for one commit and it was wrong** —
not because of the words but because `?section=notifications` was still an
`AccountSectionPlaceholder`. A footer link into an empty stub is the same
defect as the four dead Resources slugs: the surface shipped and the
destination did not. `NotificationsPanel` replaced that one `renderBody`
branch, which is the Readiness sequence again — register the section first,
swap one branch later, nothing else moves.

**The preferences are a SHEET now, from a link beside "Mark all read".** They
were a card that said "not designed yet" for exactly one commit — deliberately,
rather than a card of toggles that controlled nothing, which is the Membership
Plan card's defect. What earns them the right to be real is that the in-app
switches genuinely filter the feed, live, on both surfaces.

**Preferences switch on CATEGORY, not on tone**, and that is the load-bearing
modelling call. "3 tasks are overdue" and "your licence renews in 45 days" are
both `warning`, and muting the first while keeping the second is the entire
point of the sheet — so `Notification` carries a `category` alongside its
tone. Tone is how a notification LOOKS; category is what it is ABOUT, and only
the second is something anyone wants a switch for. A test asserts two
categories share the warning tone, so collapsing the two axes fails.

**Category × channel, and no third axis.** The obvious third is FREQUENCY
(immediate / daily digest / weekly) and it is absent on purpose: a digest is a
delivery SYSTEM, not a switch, and offering the control before the system
exists produces a preference the product cannot honour. Mocking a frequency
picker is the failure mode, and a test asserts there is no `combobox` or
`radiogroup`.

**The sheet does NOT explain its own gaps on screen.** It carried two footer
notes — email being recorded with nothing to send, and frequency being absent
— and they were removed at Jillienne's request. The reasoning holds: a sheet
that spends its last paragraph on what it does not do reads as unfinished, and
the audience for that caveat is whoever builds it, not the learner. The
arguments live here and in the component doc; the TESTS are what stop them
being lost. Do not re-add the notes to the UI.

**Email is stored and does nothing.** There is no mail in a prototype. Shown
anyway rather than hidden: the real product has both channels, and a
preferences design showing one is not the design. The switch does hold its
state, so it is a control that works with nothing behind it rather than a
control that does not work.

**`Licence & renewals` is locked ON in-app.** A learner who mutes their
renewal deadline and misses it has a lapsed licence and a state late fee — a
real-world consequence no other category here can cause, and the one place the
product is entitled to overrule the preference. The switch is disabled with
the reason stated beside it, which is the honest version of quietly ignoring
it. Its EMAIL switch stays live: "don't email me" is a reasonable ask about a
channel; "never tell me at all" is the one being refused. `visibleNotifications`
re-checks `requiredInApp` rather than trusting the stored value, so a stale
`false` still shows the row.

**Muting hides; it does not mark read.** Read state is applied BEFORE the
preference filter, so unmuting a category brings its notifications back
exactly as they were. "Mark all read" clears only what is VISIBLE, for the
same reason — clearing hidden rows would mean unmuting reveals things already
read by a click the learner could not have known applied to them.

**The header says when the list is filtered** ("7 total · 3 unread · 1
category hidden"). A filtered list that looks identical to an unfiltered one
is how "where did my notification go" happens, and the answer belongs on
screen rather than behind the sheet that caused it.

**`SheetHeader` was extracted for this.** `Sheet` deliberately renders no
chrome — overlay, panel, scroll lock and a visually-hidden title, then
`{children}` with ZERO padding — so every caller draws its own header, and
until now exactly one did, privately inside `AppearancePreferencesSheet`.
Building a near-copy is how two slide-overs end up with headers a few pixels
and one font weight apart. `SHEET_BODY` travels with it, because a header with
the wrong padding under it looks exactly like a broken header. **This bit
first**: the sheet shipped with no header and no padding at all, text running
edge to edge, because `Sheet`'s name suggests it supplies both.

**Known, not fixed:** `AppearancePreferencesSheet` still lists a DISABLED
"Notifications — Email and in-app alerts" stub row. It is honest (visibly
unbuilt) but it now points at nothing while the real sheet lives elsewhere.
Wiring it means opening a sheet from inside a sheet, which nothing here does
yet — decide that before reaching for it.

**Read state is in `NotificationsContext`, and that is the whole reason it
exists.** It started as `useState` inside the bell, which was correct while
the bell was the only surface — and became a fork the moment View all opened
a second one: clear a row in the bell, open the page, and it is unread again,
with the badge already down, the two actively contradicting each other. The
provider is mounted in `AppLayout` inside `FeatureFlagProvider` (it reads
`notification-state`) and ABOVE both `Header` and `<Outlet />`, because those
are the two surfaces — under either one it would recreate the fork. Tests
assert it in BOTH directions, since a one-way check passes just as happily
when the page writes to a copy nobody reads.

**`NotificationRow` is one component on both surfaces**, with a `size` prop
for the roomier page. Not "both show eight things" — a lookalike passes that.
This is the Jump Back In card's lesson applied on the way in: its rows became
the Study Plan's real `TaskRow` rather than something that merely matched the
visual language. A test counts rows across both mounts rather than per page.

**View all carries NO number.** The page header two inches away already says
"8 total · 2 unread", and two counts inches apart saying the same thing is
exactly what got edited out of one place and not the other on the Today's
Tasks card.

**Three panel decisions worth not re-deriving.**

*The badge counts UNREAD, not total.* A count that never falls is a scold, not
a signal — the only way to clear "8" would be to delete things. It caps at
`9+`: past a point the exact number stops being information.

*Opening the panel does not mark everything read.* The shortcut every
implementation reaches for, and it destroys the one thing the list is good at
— coming back to something. Rows clear individually on click, plus an explicit
Mark all read, so clearing stays a decision rather than a side effect of
glancing. A test asserts the non-behaviour, because it is a one-line change to
"fix" and nothing else would notice.

*A row is a link, not a card with buttons.* At 380px a two-button footer per
row turns eight notifications into a wall of chrome. `actionLabel` renders as
the row's own affordance text and the whole row is the target — the same call
the Home week strip made. The only real buttons in the panel act on the LIST.

**The design's 8px top border does not survive being stacked.** Eight cards
deep it reads as a barcode. It becomes a 3px LEADING rail on unread rows —
the same "this row's tone, at the card's edge" idea rotated for a list — and
the toast keeps the top border, where there is only ever one card.

**`alertTones.ts` is the one tone map**, read by `Toast` AND the panel. A
warning that is amber when it fires and grey in the bell an hour later reads
as two systems; same reasoning as `studyStatusColors.ts` between the Study
Plan and the week strip. Extracting it also closed a real gap `Toast`'s own
comment had been carrying: warning / error / info all rendered
`circle-exclamation`, differing **only in colour**, "until dedicated SVGs are
added". `triangle-exclamation` and `circle-info` exist now and are wired; a
test asserts every tone has a DISTINCT glyph. `circle-xmark` is still not in
the registry, so `error` keeps the exclamation — vendor the FA file and
repoint one line; do not hand-author the path.

**Four tones are functional, two are brand.** Success / warning / error / info
take the functional ramps; `message` and `promo` take `--color-primary-*`.
That follows the design (it draws both in MCK's green rather than a functional
colour) and it is right rather than incidental: a message from your instructor
is not a system state, so borrowing the success/warning/error ramp would make
"you have mail" read as a verdict on you.

**`--color-action` is a FILL colour, and using it as TEXT failed in dark
mode.** On XCEL it is the Brick #9A1B1E — correct behind white, and **2.05:1**
as text on the dark shell. tsc was clean, every test passed, the component
rendered; only measuring the dark theme in a browser caught it. That is the
*same 2.05:1* the desktop prototype's rail indicator hit, and the rule
generalised there applies unchanged: **put a LIGHT stop on a dark ground.**
`.cre-alert-action` swaps to `--color-cta-300` under `[data-theme='dark']` —
the stop `tokens.css` already labels "on-dark alternative — 5.49:1", measured
here at 5.49:1 on the panel and 6.10:1 on a tinted unread row. A class rather
than an inline style because inline `CSSProperties` cannot carry a theme
selector, and a test asserts no inline `color` is left to win the cascade.

**The panel needs a measured clamp, and the first two attempts were both
wrong.** It is 380px and anchored to the BELL's right edge — but the bell is
not the rightmost thing in the header, so at 375px its left edge landed 68px
OFF SCREEN. `maxWidth` does not help: it sized the panel correctly at 343px
and hung it in the wrong place. Measuring the PANEL's own rect then looped
forever in jsdom (no layout engine ⇒ every rect is zero ⇒ the shift compounds
on each pass). It measures from the ANCHOR now — `anchor.right - panelWidth`
is the untransformed left edge, so the figure excludes the shift already
applied and `shiftX` stays out of the dependency list — and bails on a zero
width, which makes it a no-op in tests rather than a hang.

**The demo axis is about the COUNT, not the content.** `notification-state`
is Unread · 3 / All caught up / Nothing yet. The badge is the whole visual
argument, so four authored lists would demonstrate one control four times —
the same call the "Busy study plan" persona made. `empty` is in there because
it is what a new learner actually sees, and it is the half of a notification
centre that otherwise never gets designed.

**Deliberately NOT a Demo Controls dropdown.** That bar already carries five,
and this is a header control rather than one of the dashboard's headline axes
— the same line `readiness-state` sits on the other side of. It lives in the
flag panel; promote it if the bell becomes what a demo is about.

**The bell renders on the rebrand shell only.** Its rows deep-link into
`?section=…`, which is a shell address; on the classic routes those links
would leave the layout the learner is standing in.

**Timestamps are anchored, in HOURS BEFORE `NOTIFICATIONS_NOW`** (2026-05-11,
matching `FIXTURE_TODAY`), not as literal dates. A hardcoded date ages into "8
months ago" and makes the whole list read as abandoned. `formatAge` is
deliberately coarse — "2h ago" / "Yesterday" / "May 6" — because what the
learner is sorting on is today / not today / a while back.

**Content is XCEL's, not the design's.** The Figma ships lorem ipsum and a
real-estate promo; these are Florida 2-15 notifications about the study plan,
readiness, licence renewal and an instructor reply. And every `href` was
confirmed in-app on the way IN — the rule the Resources page had to learn
after shipping four dead slugs. A notification claims to be about YOUR
account, so an outbound marketing link is a category error as well as a
possible 404; a test asserts every href is same-origin.

**What the Figma has that is NOT built.** The file is largely a superset of
what already shipped — `Toast` IS its Warning/Error/Success/Info card (from
node `17:14204`) and `AddToCartToast` IS its Promo_Added to Cart (from node
`471:19219`). What landed new is the dual Primary+Secondary CTA, the correct
per-tone glyphs, and the `message` / `promo` tones. What did NOT: the Marketing
Promo card's decorative confetti SVGs, which are MCK brand ornament rather
than structure, and the promo's "Copy Promo Code" button — promo lives in the
bell as a row today, and a copy-to-clipboard affordance wants a real cart to
land in.

### QE Focused — the new default dashboard version (2026-09-16)

A fourth Discoverability version (`discoverability-qe-focused`), and **XCEL's
default**. Learner Focused and Marketing Focused stay in the picker so the three
can be compared.

**It is the first version built for a candidate with no licence yet** — someone
working a fixed curriculum towards a booked exam, where the useful questions are
"how much of the requirement have I cleared" and "what comes next", not "what
else could I buy". Three departures, each answering one of those:

1. **The Progress detail is on the PAGE.** The Learning Path detail sheet's
   whole Progress tab — gauge, category bars, Target Date / Time Remaining /
   Completed, and the per-category course lists — renders inline as a section.
2. **The Current Learning Progress block has NO CARD — it sits on the page
   grey** (`surface="page"`, 2026-09-16). No background, no shadow, no radius,
   and the left/right padding goes too so a bare block lines up with the section
   headings below instead of staying inset by a gutter it no longer has.

   **The type was never the problem; the TRACKS were.** Every text colour clears
   AA on `#f5f5f5` by a wide margin — title 10.43:1, meta 5.27:1, eyebrow
   7.0:1, the link 7.56:1. The gauge and bar tracks do not: the light default
   `--color-neutral-100` is **1.08:1** against the page and `-200` is 1.29:1, so
   an empty bar would have no visible track and "0 / 8 hrs" would read as a
   MISSING bar rather than an empty one. The page surface uses
   `--color-neutral-300` (1.55:1) — a groove rather than a line.

   **The bars are 6px, down from 8** (2026-09-16, the direct ask), as
   `CATEGORY_BAR_HEIGHT`. Four bars at 8 stacked under a donut read as a block
   of weight rather than a set of readings, and on this version they are the
   widest element in the left column.

   **6 rather than an invented value:** it is what `JumpBackInWidget`'s own
   progress bar uses, and that card now sits directly BELOW these in the same
   column at the same width — two progress bars inches apart differing by two
   pixels is the "two treatments a few pixels apart" drift this repo keeps
   paying for. A test reads the widget's declaration rather than restating 6,
   so moving one without the other fails.

   **It is NOT 3**, the Readiness Insights topic-bar height: those are SCORES
   and there are fourteen of them, and that note is explicit that a different
   job is allowed a different treatment. The shared `ProgressBar` is still 8 —
   a single overall bar with a percentage beside it, and a separate component,
   so moving it is a call about every surface that renders one.

   It applies to all four `CategoryBars` call sites, not just this one: one
   component, one treatment.

   **Known, and shared with the detail sheet:** against that track the amber
   (`--color-category-elective`) reads 1.34:1 and the tan
   (`--color-tertiary-500`) 2.17:1. Both are weak in the white panel too (1.92 /
   3.11) — it is a property of the light palette, not of this surface. Every
   bar's value is stated in text beside it and the dot carries the hue, so
   nothing rides on the fill alone. Darkening the track further makes those two
   worse, not better (at `-400` the amber is 1.09).

   **`onDark` asks whether the GROUND is dark, not whether the surface is the
   navy card** — and that distinction is load-bearing. The navy card is dark in
   both themes; the page is `#f5f5f5` light and `#1b1d21` dark. Token colours
   flip on their own, but `onDark` is a boolean computed in JS, so keying it to
   the surface would hand the LIGHT category palette to a dark ground and
   reintroduce the same 1.11:1 slot-0 failure in the other theme. It reads
   `useTheme()`. Dark actually measures BETTER than light here: every fill
   clears 3:1 against the track (4.30 / 4.12 / 5.35 / 3.38).

   **`.cre-journey-cta` was renamed `.cre-cta-ink`** when "View Requirements"
   needed the same treatment — cta-500 as TEXT is 1.84:1 on the dark page. A
   class named for one component that two use is the `.cre-link-action` lesson
   from the other direction. `linkBtn()` now takes an OPTIONAL colour so a
   caller can let the class own it; passing one would beat the class, which is
   the trap the PSI link already hit.

   **The primary CTA is LIGHT NAVY, not the Brick red** (at Jillienne's request,
   matching the reference "Start check" button). Same 500→600 gradient
   structure as the red it replaces — only the ramp moved. White on
   `--color-primary-500` is 7.64:1 in BOTH themes (XCEL does not re-pin that
   stop), and the fill reads as a button at 7.64:1 on the widget's white card
   and 7.0:1 on the page grey. `--color-primary-700` was the other candidate and
   was rejected because it is the value the navy CARD used — the button would
   have been the colour of the surface just removed from behind it.

   Scoped to `StudyJourneyWidget`. The other five callers of the red gradient
   are other surfaces and other versions; moving them is a brand-wide call.

   **The text CTAs followed it onto the primary ramp** — `.cre-cta-ink` is
   `--color-primary-500` now, not `--color-cta-500` ("View Requirements", "Open
   learning path", the PSI link, "View All"). The Brick had been carrying two
   unrelated jobs at once: every action AND the assessment accent. Navy now
   means "do this"; red means "this is an assessment". Same "one ramp, several
   jobs" split the desktop prototype's re-palette made.

   **`.cre-journey-milestone` keeps the Brick, and is now the only thing on the
   page wearing it** — the milestone stop titles and their node rings. It is a
   category of CONTENT, not a control.

   Both still need a light stop on a dark ground, from opposite ramps:
   `--color-primary-500` measures 2.21:1 on the dark page (1.99:1 on the dark
   card), `--color-cta-600` 1.47:1. CTA ink measures 7.0 / 7.64 / 7.76 / 6.98
   across light page / light card / dark page / dark card.

   **Known, not fixed:** on the DARK card the navy fill is 1.99:1 against its
   own surface, so the button is identified by its white label and its shape
   rather than by a fill boundary. That is marginally better than the red it
   replaces (1.84:1), not a regression.

   **The three KPI cells are BARE, divided by vertical rules** — no fill, no
   border, no radius. Three tiles in a row read as three cards competing with
   the Study Journey card beside them, and a container each was chrome around
   chrome; the numbers are the content and the rule is the separation. `gap: 0`
   with the rule on the leading edge of cells 2 and 3 — a gap on top of a rule
   reads as two gutters, and a rule on the FIRST cell would fence the row off
   from the block it belongs to.

   **`cRule` is a separate value from `cLine`, and the distinction is the
   point.** `cLine` (`--color-border-subtle`) does the job of a boundary — the
   meta line's 11px ticks, a card's edge — and measures 1.29:1 on the page grey
   (1.38:1 dark). These rules are the only thing separating three data points,
   so they are doing work: `cRule` is `--color-neutral-300`, 1.55:1 / 1.81:1,
   which is also what this surface uses for the bar track. One "line you can see
   on the page" rather than two near-identical greys. `-400` reads better still
   (1.9 / 2.47) and was rejected — at full cell height it draws more attention
   than the numbers it separates.

   The navy card keeps its TILED cells: bare cells there would lose the
   translucent fills that make them read as cells at all. Split by surface, not
   a global restyle, and a test pins both sides.

   **The status is the detail panel's OWN `StatusStrip`, and the "Status"
   caption is gone.** A status-tinted wash with the pill and the message —
   exported from `LearningPathDetailPanel` rather than matched, because the
   Progress section directly below renders the same strip and a lookalike would
   put two treatments for one status inches apart on one screen. Same argument
   as `synthCategoryCourses` and the shared `TaskRow`; a test asserts BOTH
   render the same `STATUS_STRIP_BG` value.

   The caption was chrome: a pill reading "On Track" beside a sentence about the
   deadline does not need a column saying it is a status, and that column cost
   104px of a narrow block. The status is still in words, so nothing is carried
   by the tint.

   `statusTreatment`'s keys differ from the panel's `StatusInfo` by two names —
   `fill`/`text` against `bg`/`color`. Mapped at the one place they meet rather
   than renamed; both shapes have other consumers. The LIGHT tone is resolved
   beside its on-dark twin so the two cannot describe different states.

   Measured: pill ink 5.88:1 light / 5.92:1 dark on the tint, message 5.18 /
   8.76. **The wash itself is 1.02:1 against the page** (1.19 dark) — it is a
   HUE shift rather than a luminance one, which a contrast ratio does not
   capture, and it is equally subtle on the white card in the section below. It
   is decoration; the pill's label carries the state.

   The navy card keeps the captioned box — the strip's tint composites over
   `--color-surface-card` and would disappear into the navy.

3. **THERE IS NO PROGRESS SECTION — removed 2026-09-16.** The version began by
   rendering the detail sheet's whole Progress view inline as a page section.
   Both halves of it ended up elsewhere, and then the section was the leftover:

   - The SUMMARY moved up to the Current Learning Progress block (gauge,
     per-category bars, Target Date / Time Remaining / Completed).
   - The LISTS are the Study Journey, which walks the same categories in
     curriculum order with each stop's status in words.

   What was left was a second copy of the path title, sub-line, status strip and
   a "Go to Learning Path" button, directly under a block that already had all
   four — which is exactly how it read on screen.

   **The route there took three passes, and the passes are the useful part.**
   First the band was slimmed to a lead-in (`slimLeft`) so the section could own
   the numbers. Then the numbers moved to the card (`categoryGauge` +
   `hideSummary`) and `slimLeft` went. Then the section itself went, and
   `hideSummary` and `embedded` went with it — two props with no caller are two
   things to keep working for nothing. The Sheet is the panel body's only host
   again.

   **ONE AFFORDANCE WENT WITH IT:** the course rows' "View Certificate" link,
   the only place a completed part offered its certificate from Home. The
   Certificates rail item still holds them. If it is wanted back, the Study
   Journey's completed stops are where it belongs — **not a restored section**;
   a test asserts the lists are reachable as the journey so that is visibly the
   wrong fix.
4. **Recommended for You is dropped**, as a LAYOUT rule rather than by shipping
   the flag off — the flag has to keep working on the other two versions. A test
   seeds it ON and asserts the band is still absent.

**It shares Learner Focused's band and stacked structure** (`qeFocused` sets
`learnerFocused` too) rather than forking the layout. What changes is what goes
IN the band and what follows it.

**The page section is the REAL panel body, not a page-shaped copy.**
`LearningPathDetailPanelContent` gained an `embedded` prop that suppresses the
two things which only make sense in a slide-over — the "Close" link and the
pinned-header padding — and nothing else. The sheet still opens from "View
Requirements", which is normally the two-doors mistake; it is accepted for the
reason the Resources section gives, that these are not the same door: the
section is where you land, the sheet is what the OTHER surfaces link to, and
both render one component. **Do not build a page variant of this view.**

**`categoryGauge` OVERRIDES the band's "two categories only" rule**, and that
is the interesting part. `hasBreakdown` restricts the segmented gauge to exactly
two categories, because a 3–5-category path "shows the overall % here and the
full list in the detail panel" — sound while the panel is a click away, wrong
when it is the section directly below. Without the override the card showed one
overall bar and the four-way breakdown was nowhere on screen.

Scoped by a prop rather than applied whenever a path has categories, even
though the band and the panel disagreeing for a 4-category path is arguably a
bug everywhere: fixing it on Learner Focused and Marketing Focused changes what
those ship.

**The category palette had to gain an ON-DARK set, and two slots were
invisible.** `CATEGORY_PALETTE` is built for the white detail panel. On the navy
card, measured against the bars' track:

- slot 0 `--color-category-mandatory` — **1.11:1**. That is the FIRST
  category's colour, so on the New York journey the one bar carrying all the
  progress read as empty.
- slot 3 `--color-cta-500` (the Brick) — **1.03:1**. Invisible.

`CATEGORY_PALETTE_ON_DARK` is the same hues at their light stops: 3.89 / 3.74 /
4.85 / 3.06 / 5.89 / 3.54 / 5.09, every slot clearing 3:1. Same rule as
`.cre-alert-action` and the desktop prototype's `--rail-accent` — a dark brand
colour is a FILL on white and needs a light stop on a dark ground. Slot 1 was
already a light amber, which is why the two-category case never showed this.

**The donut's track had to come down from 0.2 to 0.12 white** with it. The
lighter track was fine behind the two standardized segment colours; against the
light-stop palette it put `cta-300` at 2.38:1 and the amber at 2.91:1. At 0.12
every arc clears 3:1 — and it matches what `CategoryBars` already uses, so the
donut and the bars beside it stop being two different shades of empty.

**The SHEET keeps the full summary on the light palette** for the consumers
that still show it. `hideSummary` is `embedded`-only.

#### View Requirements is requirements-only, and the tabs are gone (2026-09-16)

`LearningPathDetailPanelContent` gained `view: 'tabs' | 'progress' |
'requirements'`. On QE Focused both halves render WITHOUT a tab bar: the "View
Requirements" CTA opens `requirements`, and the page section is `progress`.

**Because each half is already where it needs to be.** The page behind the sheet
shows every part of the Progress half — the navy card's gauge and stat tiles,
the section's course lists — so a Progress tab inside the sheet was a second
door onto what the reviewer was just looking at, the pattern that got four
testing tiles archived. And the section had a Requirements tab that the CTA now
owns.

**`view: 'tabs'` stays the DEFAULT, and that is deliberate.** Three other
consumers open this sheet — `LearningPathsHome`, the classic dashboard's
`LearnerOverviewPanel`, and the QE page's own embedded section — and for the
first two the sheet is the ONLY door to either half. Removing their tabs would
take the Progress detail away with no replacement. A test pins both: no tabs on
QE Focused, tabs on Learner Focused.

A single-half view pins the tab state rather than reading it, so a caller cannot
land on a half the host never meant to offer.

#### The requirements content is XCEL's published New York page

`_PATH_REQUIREMENTS_BY_ID['xcel-ny-producer-prelicensing']`, from
`https://www.xcelsolutions.com/new-york/insurance-license/requirements`,
confirmed 2026-09-16. Six sections: hours by line of authority, how the course
works, the certificate of completion, sitting the exam, applying, and the CE
cycle that follows.

**Quoted close to the source, not paraphrased.** The forced-progression rule and
the 70% chapter-assessment floor are the kind of thing a learner is told once
and then has to act on.

**`totalHours` is the STATE's 40, not the path's 56.** The requirements box is
about the board's requirement; XCEL's programme adds 16 hours of its own prep
(Prep Review, Simulators, Exam Cram) on top. The difference is stated in the
list rather than left for a reader to notice two numbers disagree.

**THE FIRST PRE-LICENSING ENTRY made three fields optional.** `PathRequirements`
was shaped for CE renewal, where `mandatoryHours`, `electiveHours` and
`renewalCycleYears` always apply. A candidate has nothing to renew and the state
names ONE hour figure per line of authority — and a `0` in those slots renders
as a stated requirement of zero rather than as not-applicable, which is the
admin roster's blank-Seat-cell rule.

**The exam figures were wrong for one day, in a way worth recording.**
`examFactsFor('NY')` shipped as "100 questions / 2 hours" — the SINGLE-line
figure (Life only, Health only, Personal Lines). The demo persona holds the
COMBINED Life, Accident & Health line, the 40-hour one, which sits **150 scored
questions in 150 minutes**. The first fetch of the page summarised its per-line
table as "100 (Life/Health) or 150 (Personal Lines/P&C)", which has it
backwards. **Read the table, not a summary of it.** Corrected in both places
that state it — the Readiness facts and the Get Licensed step — and the test
matches on the NUMBERS rather than the phrasing, so the two surfaces stay free
to word it differently while being unable to disagree.

**The "Go to Learning Path" CTA is gone from this view** (2026-09-16). The page
the sheet opens over already carries "Open learning path" on the Study Journey
widget, so the button was a second door onto one route — inside a sheet whose
whole job is to state the requirements. Same argument that dropped the Progress
tab, applied to the header instead of the tab bar.

It is gated on the `view` PROP, not on which half is showing: the tabbed sheet
documents that CTA as persistent across both tabs, so switching to its
Requirements TAB must not make it vanish. A test pins both, and also pins that
"Open learning path" is still on the page — so the removal cannot quietly become
"there is no way to the learning path from here".

**`embedded` must not make a second scroll container.** The sheet's body is
`flex: 1; overflow-y: auto`; on a page that collapses to its content and the
section loses its scrollbar to the page anyway, reading as a clipped section.

**QE Focused resolves a QUALIFYING journey, never CE, and that was a real bug
for one build.** `dashboard-education-type` defaults to `ce`, so the version
NAMED for qualifying education opened on a CE renewal path. `exam-prep` still
gets through — it is the other qualifying journey — and the Demo Controls bar
**drops Continuing Ed from its Education dropdown here** rather than leaving an
option that silently does nothing. The bar's label reads what the PAGE resolved,
not the raw flag.

#### The Study Journey sits on the PAGE — no card (2026-09-16)

`widgetCardStyle` has no background, no border and **no shadow**. It was a
raised white card, inherited from the outer section back when this was the right
half of a joined band.

**The shadow went with the fill and the border**, which is one treatment rather
than three settings: a shadow under a surface with neither fill nor edge reads
as a card that failed to paint, not as less card.

**The horizontal padding went too** — the move the Current Learning Progress
block already records: a bare block lines up with its column instead of staying
inset by a gutter belonging to a card it no longer has. What is left is 4px of
top padding, so both columns' eyebrows sit on the same line (measured: y=260 for
each).

`widgetRuleStyle` is untouched — it divides this block's own two halves (the
journey from Get Licensed) and is not card chrome.

#### The Study Journey widget — its own card, split from the navy side

`StudyJourneyWidget` (2026-09-16). Resume block, then the Study Journey, then
Get Licensed: one card answering "where am I and what is next", from the course
in front of the learner to the licence.

**It was the band's right HALF** — a grid sibling of the navy Current Learning
Path, sharing one radius, one shadow and one `overflow: hidden`. Two things made
that stop working once QE Focused slimmed the navy side and grew this one:

- **Grid siblings share a row height.** The navy lead-in is four lines; this is
  a resume block plus ten steps. Joined, the navy half stretched to match and
  carried a large empty area below its content — which reads as a render
  failure, not as breathing room. Measured after the split: navy 272px, widget
  989px, each sized by its own content.
- **They are no longer halves of one statement.** The navy side's figures moved
  to the Progress section below, so presenting the two as one surface implied a
  relationship that section had already taken over.

**`align-items: start` is the load-bearing half of the split.** Without it the
grid still equalises the row and the navy card stretches exactly as before —
the joined band with a gap. A test asserts the declaration rather than the
heights, because jsdom has no layout.

**The column gap is 40, matching what `MembershipOverview` puts between its own
sections**, so the space between two independent cards reads as the page's own
rhythm. It was 20 — inherited from when these were two halves of ONE card, where
the gap stood in for the seam; split, 20 read as two things that had not quite
come apart.

**A REGRESSION THE PAGE SURFACE CAUSED, and how it hid.** `metaRow` (the
"Insurance Pre-Licensing · NY · 56 Hours" line and its dividers) is assembled
ABOVE the navy half's markup. The `surface='page'` colour swaps were applied
across that markup, so they missed it: the meta line kept
`rgb(255 255 255 / 0.66)` and rendered white-on-grey at roughly 1.2:1 — content
that looked like it had failed to load. tsc was clean, all 686 tests passed, and
it survived several rounds of looking at the page, because a washed-out line is
easy to read past. Only inspecting the element's computed style caught it.

**The lesson is about the method, not the colour:** a surface variant applied by
sweeping a block of markup misses anything BUILT outside that block. Both values
read `cMuted` / `cLine` now, and a test pins the meta colour per surface in both
directions.

**The joined treatment is KEPT for every other version.** Learner Focused and
Marketing Focused are two halves of one statement at roughly one height, which
is what it is for. A test pins both sides of that.

**The widget resolves nothing itself.** The resume course is a prop and
launching is a callback, so it has no `useCourseLauncher` and no fixture import
— two components resolving "the course to resume" is how they disagree, which
is the fork `displayedProgressPct` was extracted to close. A test scans the
source (comments stripped) to keep it that way.

`DELIVERY_LABEL` moved to `src/utils/courseDelivery.ts` so the split did not add
a SIXTH private copy of that map. The other five are deliberately not folded in
— they disagree on wording in places, so collapsing them is a copy decision.

**Known, pre-existing:** `MembershipOverview` wraps the band in its own
`<section aria-label="Your learning">` and the band carries the same label, so
two nested regions share a name. Tests select the band by class because of it.
Worth fixing separately.

#### The Study Journey — sequence, not dates

`StudyJourneyRail` replaces Today's Tasks in the band's white half. It does NOT
replace the resume block above it: "continue where you left off" is still the
first thing the card offers.

**The Study Plan and the Study Journey answer different questions, and that is
why both exist.** The plan is DATE-paced — what is due today, can put you
behind, unit is a task with a due date. The journey is SEQUENCE-paced — where am
I in the programme, cannot make you late, unit is a piece of curriculum. A
journey with due dates is just a worse calendar, so this holds **no dates and no
overdue state**; a test asserts no stop carries a `dueDate`.

**The stops are derived, never authored** — `resolvePathCategories` →
`synthCategoryCourses`, the same pair the Progress tab's course lists use. On
this version those lists are directly below the band, so an authored journey
would contradict them on the same screen. Both now live in `studyJourneyUtil.ts`
so there is one derivation rather than two.

**`personaFor` allocates completed hours SEQUENTIALLY, and that changed for
this** (2026-09-16). It used to be `completed = required × ratio` applied to
each category independently — a PROPORTIONAL fill, which made the New York
learner simultaneously 63% through their coursework, 63% through the prep
review, 63% through the simulators and 63% through the exam cram. The category
bars survived that as decoration; the journey did not, because a sequence whose
every stop reads "In progress" answers nothing about what to do next.

Hours now fill the list in order, each category taking what it can before the
next gets any. **The TOTAL is unchanged** — `round(totalRequired × ratio)`
either way — so On Track is still 63% and the three-surface agreement holds;
only the distribution moved. The category list is therefore ORDERED, and the
order is the curriculum: entry 0 must be what a learner does first.

**Mandatory / Elective are derived from the same allocation**, via a `segment`
field declaring what used to be implicit in `mandatoryReq` / `electiveReq`. Two
rules over one set of hours is two answers: under the waterfall
`mandatoryReq × 0.63` says 25/40 while the categories say 35/40, and BOTH are on
screen — the Progress section reads categories, the Learner Focused band's
legend reads the two segments. A profile with no categories keeps the old
computation exactly.

Tests sweep every progress variant rather than asserting the default, for the
reason `ProgressAgreement` gives: at most one stop in progress, nothing started
after a not-started stop, and the segments agreeing with the categories.

**Consequence worth knowing:** pre-license education alone is 40 of the 56
hours, so on every partial state the prep / simulator / cram stops are
untouched — the demo never shows "coursework done, now on the simulators". The
levers are the On Track ratio or the pre-license hour requirement, and the
latter is one of the invented figures. Left alone rather than tuned, because
63% is what the Progress dropdown's own label says.

**Assessment categories are MILESTONES** (`simulators`, `exam-cram`) — sitting a
practice exam is a different act from working a lesson, which is the distinction
the reference design makes with its Mini Exams.

**They are marked on the NODE, not by red text — and that changed within the
day.** The titles were `--color-cta-600` (the Brick) for one build. Red MEANS
something: "Exam Simulators · 6 hrs · Not started" in red read as a failure
rather than a step not reached yet, and worse because the two milestones happen
to be the two not-started stops. Same tension the readiness gauge records — red
on a CHAPTER is actionable, red on YOU is discouraging — and an unreached
milestone is the second kind.

The distinction is a WEIGHT OF INK on the ring now: `--color-text-primary`
against an ordinary stop's `--color-text-tertiary`, 11.37:1 vs 6.19:1 on the
card (13.67 vs 6.18 dark). Same value the "you are here" node uses for its fill,
so the rail carries two inks rather than three — filled means "here", hollow
strong means "assessment", hollow weak means "not yet".

A different SHAPE (a diamond) was the other candidate and was rejected: a
completed milestone carries the check glyph, so rotating the node means
counter-rotating the icon inside it, for a distinction the group label already
makes in words. **`.cre-journey-milestone` is gone and nothing on the page wears
the Brick** — a test asserts the class is absent from `tokens.css`.

#### Jump Back In is INSIDE the progress block (2026-09-16)

The Current Learning Progress block now carries the **course art left of its
title** and the **Resume CTA** beside the gauge. `JumpBackInWidget` is archived
(`ARCHIVED_ITEMS` id `jump-back-in-widget`) — kept and exported, unreferenced.

**It was one thing said twice.** The card sat directly below the block with the
same course, the same art, the same percentage and its own progress bar. Merging
it removes a whole card without removing any information.

**The single category bar went with it, and that is what made room.** With one
category the bar restated the donut's 62% AND the "Completed 26 / 42 lessons"
KPI cell — three sayings of one number within three inches. `showBars` is a
COUNT rule (`cats.length > 1`), not a version check: any path that ends up with
one category gets this, and a path with a real breakdown keeps its bars
everywhere.

**Where the CTA went, and the two placements rejected.** It sits right of the
donut, in the half the bar vacated — the eye's second stop, beside the progress
it acts on. Both alternatives are one edit away and named at `resumeInline`:

- **In the header row, opposite the title** — reads as a page action rather than
  the next step in this course, and puts the primary button *above* the number
  that motivates it.
- **At the bottom beside "View Requirements"** — a filled primary button next to
  a text link makes the link look disabled, and it falls below the fold on a
  narrow shell.

**Page surface only.** On navy the white half still renders the full resume
block; two resume blocks in one band is the duplication this removed.

**The art is the resume course's own** (`resumeCover`), so the picture and the
button are the same course — and it is fixed at 84×56 with no border, for the
two reasons the card already recorded: it is course art rather than a chip, and
a border on the page grey boxes the one element that already has edges.

**A horizontal BAR replaced the donut** (2026-09-16), under the meta line and
inside the text column, so it reads as this course's progress rather than as a
separate widget: title, what it is, how far through it. The 150px gauge had a
whole row to itself to say one number the KPI cell below already states as
"26 / 42 lessons".

It is the **shared `ProgressBar`**, not a lookalike — the rule `ProgressInline`
was extracted for, after Readiness drew its own 3px bar in a different green and
one learner's one 32% became two different bars a rail item apart. The
percentage is printed beside it because nothing else on this surface says "62%"
once the donut goes; `ProgressBar` deliberately carries no label of its own.

`ProgressBar` gained a **`track` override** for it, the same override
`CategoryBars` already needed on this surface and for the same reason: the
default `--color-neutral-100` is 1.08:1 on the page grey, so an empty bar has no
visible groove.

**The donut is NOT rendered rather than hidden.** `display: none` leaves a gauge
in the accessibility tree and in every `querySelector('svg')` a test reaches
for — present while absent. `barInHeader` is tied to `showBars` being false, so
the bar and the category bars swap TOGETHER: with a real multi-category
breakdown the donut still earns its row, because it shows the segments and a
single bar cannot. The navy versions keep theirs, and a test asserts that.

**The Jump Back In copy is gone; only the CTA remains** (2026-09-16). It was an
eyebrow, the course title and "Course · 45% complete" — all three already said a
few lines up by the art, the title and the bar. It also quietly closed a
contradiction: that line printed the COURSE's own progress (45%) directly
beneath a bar reading 62%, two true numbers measuring different things with
nothing on screen saying so. If the copy ever comes back it has to say WHICH
number it is.

**The eyebrow sits ABOVE the art and the title** (2026-09-16). It was inside the
text column beside the cover, which made it the course's label rather than the
block's; lifted out, it names the whole block and the row below is a plain
two-column pairing.

**The art is 132×112** — 84×56 → 132×88 → here. It is no longer 3:2: the text
column grew a progress bar under the meta, and a 3:2 crop finished well above
that stack, reading as a thumbnail left behind rather than as the course. The
WIDTH is held now, not the ratio; `object-fit: cover` does the cropping, so the
photograph is never distorted.

**It is an `<img>` with an `onError` swap, not a CSS background, and that is
load-bearing.** `NY_LH_COURSE_IMAGE` points at
`/courses/ny-life-health.webp`, **which is not in the repo**. The handler falls
back to `getCourseImage`'s stock pool, so the page shows a real photograph
either way — the `FeaturePreviewThumb` mechanism, and precisely the case
CLAUDE.md describes when it says that fallback "lets paths be authored before
the screenshots exist".

That fallback is the ONLY reason a path to a missing file is allowed here.
Without it this is the defect the Resources section shipped four of. Verified in
the browser: the `src` resolves to `/courses/0.webp` today, i.e. the swap fires.

**TO FINISH IT:** save the New York skyline as
`public/courses/ny-life-health.webp`. Nothing else changes — no code, no
fixture. The stock pool is real-estate photography, so until then the cover is
generic rather than wrong.

---

The note below describes the card as it was, and is kept for the restore.

#### Jump Back In was its own widget — in the LEFT column

`JumpBackInWidget` (2026-09-16) — cover, course title, meta, progress bar and the
Resume CTA, in its own card **under the View Requirements link**, below the
Current Learning Progress block.

It was the journey card's top third under a rule. Two reasons it earned a card:
**it answers a different question** ("carry on with this one course" against
"what is the shape of the programme"), and **it was the only unlabelled block on
the version** — every other one carries an eyebrow, and this was the untitled
thing at the top of a titled card. It has "Jump Back In" now.

**It moved from the right column later the same day**, which is the placement to
keep straight — it shipped as the top card of a two-card right-hand stack.
Two things moved it:

- **It belongs to the block above it.** "Carry on with this one course" is the
  next action the progress block's own figures imply. Stacked under the Study
  Journey's title, the two read as one undifferentiated list of "things on the
  right".
- **It gets the width it was short of.** At 330px in the right column the course
  title wrapped to two lines; across the left column (measured 506px, exactly
  the progress block's own x and width) it does not.

**No width and no horizontal padding of its own** — it is a block child of the
left flex COLUMN, so it stretches to the column and lines up with the progress
block rather than being inset by a gutter that block does not have. That is what
"same spacing as the progress section" means here, and a test pins the absence
of a width rather than a pixel figure.

**`marginTop: 20`, and the 40 between the COLUMNS is unchanged.** Two values, so
the grouping stays legible: 40 separates the left block from the right column,
20 says the card belongs to the block directly above it. The right column is now
the Study Journey alone, not a wrapper around a stack — a test asserts that,
since an empty wrapper is the kind of thing that survives a move and then
collects a second child.

**The card is RECESSED as of 2026-09-16** — a flat grey fill
(`--color-neutral-100`), **no border and no shadow**, and a **4px** progress bar
(down from 6), to a supplied reference. `widgetCardRecessedStyle`.

The Study Journey beside it keeps the raised white card, so the two have
diverged — which is fine (one action on one course against the shape of the
whole programme) but **both shells still live in `widgetStyles.ts`**, because
the way two cards in one column stop agreeing is a second shell defined
somewhere else. A test asserts each takes the right one and that both are
declared in that file.

**The grey is a near-miss worth recording.** `--color-primary-100` is the closer
match to the reference — a cool blue-grey, rgb(233 238 242) against the
neutral's rgb(236 236 236) — and it is a **trap: it does not invert with the
theme.** It stays near-white under `[data-theme='dark']`, so the card would have
rendered near-white with near-white text: title **1.05:1**, meta **1.38:1**.
Caught by measuring the token in both themes BEFORE writing it. The neutral
inverts to a navy and holds its relationship to the page either way: **1.08:1
light / 1.19:1 dark** against the page grey, which is deliberately subtle and
matches the reference, where the band is a whisper against white.

**The cover lost its border too.** It existed to edge the art against a white
card; on the recessed grey it draws a box around the only thing in the card that
already has edges.

**The bar no longer matches `CATEGORY_BAR_HEIGHT`, deliberately.** Those two
were pinned EQUAL earlier the same day, on the grounds that two progress bars
inches apart in one column differing by two pixels reads as a bug. What changed
is the reading of what they are: the category bars are a SET of requirement
readings on the bare page, four of them scanned against each other; this is ONE
course's progress inside its own card with the percentage already stated above
it. Different job, different treatment — the rule `readinessFixtures` records
for its own 3px topic bars. Both are named constants (`PROGRESS_BAR_HEIGHT` /
`CATEGORY_BAR_HEIGHT`) and a test names the pair, so if it reads as drift the
fix is to move both.

**The track moved to `--color-neutral-300`** — `-200` measures 1.21:1 against
the recessed card, an empty bar with almost no groove. `-300` is also the
category bars' own track on this version, so the two grooves match even though
the bars differ.

**And the FILL needed a class, which is the defect measuring caught.** It was an
inline `background: var(--color-primary-500)` — correct on white. With the card
on `-100` and the track on `-300`, all three invert to navies in dark, leaving
the fill at **1.22:1 against its own track**: a progress bar with no visible
progress, in a card that rendered perfectly. `.cre-jbi-progress-fill` swaps to
`--color-primary-300` under `[data-theme='dark']` — **4.30:1**, against 4.52:1
for the light pair. Applied in dark only, because the same stop is 1.29:1 on the
light track, so it cannot be one swap. The inline style sets NO background, or
the rule would match, compute and do nothing; a test asserts that.

**`widgetStyles.ts` holds the card shell and the eyebrow.** The two cards are in
different columns now, which makes agreeing on their surface MORE important
rather than less — they are the only two cards on the version and they sit side
by side. A third copy of the shell is how they stop agreeing — the same reason `DELIVERY_LABEL` moved to
`utils/courseDelivery` rather than being copied. Like the journey widget it
resolves neither the course nor the launcher: both are the band's, since two
components resolving "the course to resume" is how they disagree. **Known gap, not
faked:** the reference INTERLEAVES milestones between chapter groups (A1, A2,
Mini Exam 1, A3…). That needs a syllabus saying which chapters a mini exam
covers, and the fixtures carry hour requirements per category, not an outline.
So milestones sit where the category order puts them. Author the outline and the
interleaving is a re-sort, not a rebuild.

**The journey ends with two COMPLETION TASKS** — Complete Student Attestation,
then Download and Print Certificate of Completion — from XCEL's published
certificate-eligibility rules. They are stops rather than a third section
because they happen INSIDE the LMS and XCEL knows whether they are done, which
is precisely the line that puts Schedule / Pass / Apply elsewhere.

They carry **no hours**: a credit-hour figure on "print your certificate" makes
it look like coursework and would land in the gauge's denominator, which is the
state's hour requirement and must not grow by two. And they read **"After your
coursework"** rather than "Not started" until every hour is done — a step the
product will not let you take must not invite the click. Same reasoning as the
Licence & renewals notification saying why its switch is disabled.

#### Get Licensed — the three steps XCEL does not own

`GetLicensedRail`, directly under the journey. XCEL's published route to a New
York licence is four steps; **the Study Journey IS step 1 expanded**, and this
is steps 2–4 (Schedule State Exam · Pass State Exam · Apply for your License).

**They are a separate section because the OWNER changes.** Everything in the
journey happens in the LMS. Nothing here does — PSI schedules the sitting, PSI
scores it, DFS issues the licence.

**So these steps carry NO completion state, and the absence is the design.** A
tick against "Pass State Exam" would be the product claiming an outcome it has
no feed for. Each step gets who owns it, what the learner does, and the
published fee instead. Numbered rather than noded: a numbered list says "do
these in order" and makes no claim about where you are. A test asserts there is
no status field, so wiring one in needs a real feed behind it.

**The lede reads forward** — *"Once your course is completed, here are the next
steps."* (2026-09-16). It said "After your certificate — these three are handled
by the state", which led with the OWNER, a fact each step's own meta already
carries (PSI, PSI, NY Dept. of Financial Services), and made the section sound
like a disclaimer. A learner standing at the end of their coursework wants the
next step.

**Only one step links out** — PSI's New York registration page, stated on the
requirements page. The other two have no URL, because an invented href is the
defect the Resources section shipped four of.

**One more inline-style trap, in the same file, caught the same way.** The PSI
link spread `titleStyle`, which carries `color: var(--color-text-primary)` —
and an inline colour BEATS `.cre-journey-cta`, so in dark mode the link
rendered #f1f3f7 and looked like plain text. The class was present and correct
the whole time. `titleStyleNoColor` exists so a themed class can own the colour;
**do not spread a style that sets `color` onto an element whose colour a theme
class is meant to swap.**

**Status is in WORDS on every stop, and the first build got this wrong.**
`completed` and `not-started` carry no percentage, so they were distinguishable
only by the node — same text, one filled circle apart. Never colour alone.

**Three colours failed in dark mode and only measuring caught them.** All three
were clean in tsc, passed every test, and rendered:

- The milestone title on `--color-cta-600` measured **1.47:1** on the dark card,
  and "Open learning path" on `-500` **1.84:1**. The CTA ramp is a FILL colour
  on XCEL (Brick) — the exact failure `.cre-alert-action` documents. Both are
  classes now (`.cre-journey-milestone` / `.cre-journey-cta`) swapping to
  `--color-cta-300` under `[data-theme='dark']`: 10.34 / 8.24 light, 5.49 dark.
  **Classes, not inline styles** — `CSSProperties` cannot carry a theme
  selector, and an inline `color` would beat the stylesheet anyway.
- The "you are here" node on `--color-primary-600` measured **1.59:1** on dark:
  the one node that says where the learner is was the least visible thing on the
  rail. It is `--color-text-primary` now — near-black on light, near-white on
  dark. Deliberately not the CTA ramp, which is the milestone ring's job.
- The un-started node border on `--color-neutral-300` measured **1.63:1** on
  dark (that token inverts to a navy). `--color-text-tertiary` is 6.19 light /
  6.18 dark — unusually symmetric, worth keeping.

**Known, not fixed:** the spine is `--color-border-subtle`, 1.41:1 light /
1.24:1 dark. It is `aria-hidden` decoration carrying nothing the ordered list
and the per-row status words do not already say, and it is the token every other
divider on the page uses. Raising it is page-wide, not a Study Journey call.

#### The measure is LESSONS — 42, and Part 1 is the journey's first stop (2026-09-16)

The QE dashboard reported credit HOURS (three of whose four figures were
authored here), then briefly DAYS of the study plan. It reports **lessons of the
pre-licensing course** — the unit the product itself uses.

**Where 42 comes from, stated plainly.** The LMS course card: *"0 of 42 lessons
completed"*. It is **not** on the storefront — that page publishes 40 credit
hours, three exam simulators and eight "What You'll Learn" topics, and no count
of lessons, sections, chapters or modules anywhere. So 42 is sourced from the
PRODUCT rather than the catalogue: a weaker footing than a published figure, and
a much stronger one than the hour splits it replaces, which had no source at all.

**CONFIRMED from the product page** (raw HTML, not a summary — the lesson from
the exam-figures correction): "New York Life and Health Pre-licensing Premier",
**$299.00**, Line of Authority "Life and Health", **Credit Hours 40**; the
3-Part Training Program (Pre-licensing Course → Prep Review Course → Exam
Simulator) with **three** simulators unlocked in sequence; **30 days** access to
Part 1 then **30** for Parts 2–3; recommended **70 / 80 / 85%**; and
*"prepares you to pass the insurance exam in less than 2 weeks"*.

**ONLY PART 1 IS COUNTED, and that is the shape of the change.** The 42 lessons
are the pre-licensing course, and the course is the journey's **first stop**.
Parts 2 and 3 follow it as steps with **no count** (`PROGRAM_PART_STOPS`) —
because the storefront states none for them, and giving them invented counts to
keep the gauge multi-segment is exactly the move the hour figures taught us not
to make. They are still ON the journey: leaving them off would say the programme
ends with the coursework, which the product page explicitly warns against
("you may be tempted to stop only after Part 1").

Their `blocked` state is the real rule, not decoration — the page states Parts 2
and 3 unlock "upon completion of Part 1" — and their meta carries what IS
published: Part 2's 80% target, and that Part 3 is three simulators at 85%.

**Consequences worth knowing:**

- **The gauge and the category bars show ONE segment.** That is honest — there
  is one measured thing — and it is why the journey beside it carries the
  programme's shape instead.
- **On Track reports 62%**, against the Progress dropdown's "~63%" label. Near
  enough that the existing label-vs-gauge note covers it; the 7-day model had
  put it at 57%.
- **The first stop reads "26 / 42 lessons"**, the course card's own sentence.
  `JourneyStop.completed` was added for it: a bare "42 lessons" is a denominator,
  not progress.

**The 7-day study plan survives as a confirmed FACT, not a measure.**
`NY_LH_STUDY_PLAN_DAYS` = 7, with the link. Worth keeping: the product page's
own "Read our recommended study plan" points at
`prepare2pass.com/COURSES/study_guides/lh_ca_7days.pdf` — so despite the `lh_ca`
in the filename it is the plan the **New York** page links, i.e. XCEL's Life &
Health plan rather than another state's.

**The recovered chapter list is kept and NOT rendered.**
`NY_LH_GUIDE_CHAPTERS_PARTIAL` holds twelve titles decoded from that PDF via its
embedded ToUnicode maps plus a +29/+30 subset shift (each mapping checked
against a known-good string). It comes back with **no health chapters at all** —
no medical plans, no Medicare, no disability — which a Life *and* Health course
must have, so the extraction is short rather than the guide. It exists so the
next person has the titles and knows what is missing; padding it would be
authoring a curriculum XCEL does not publish. A test asserts none of it reaches
the screen.

**`unitLabel` rides on the PATH**, not as a prop — five surfaces print the unit
(the band's meta line and KPI cell, the category bars, the journey rows, the
detail sheet) and a prop through five is how one gets missed. `synthCategoryCourses`
splits by unit: an **hrs** category over 15 halves into "· Part 1 / · Part 2"
(40 credit hours is not a sequence, so halving is arbitrary but harmless);
**lessons** never split, because the 42 ARE the course.

**"1 days" — the bug the unit change created.** `hrs` is unit-invariant, so
nothing here had ever pluralised a count; the moment a unit did, four surfaces
printed it. `unitCount` in `utils/unitLabel.ts` is the one owner, the
`DELIVERY_LABEL` precedent.

**Credit hours did not disappear.** The state's **40** is a real regulatory
figure and still appears where a regulator's number belongs — the requirements
sheet, the transcript row, the resume card's course hours. Two units on one
screen meaning different things: 40 credit hours is what New York requires, 42
lessons is how XCEL's course delivers it.

**A borrowed fixture broke a neighbouring test, and the fix is the rule.**
`LearnerFocusedBand.test.tsx` took its path from `learningPathsFor('xcel')[0]`
with a comment calling it "Florida Nursing — mandatory + elective". That had not
been first for a long time, and when the New York path lost its elective half
(Part 1 only), a test about the BAND's two-segment rendering failed because of a
fixture it merely happened to borrow. It builds its own path now — the remedy
CLAUDE.md already prescribes for exactly this.

#### New York Insurance Producer — the demo licence

**The figures were invented for one day and are not any more.** They shipped as
flagged placeholders, then were confirmed against XCEL's own published
requirements page (`https://www.xcelsolutions.com/new-york/insurance-license/requirements`)
on the same day. `src/data/nyProducerRequirements.ts` is the single owner:
nothing else in `src/` carries a New York hour count, question count, time
limit, pass mark or fee.

**The distinction the file now exists to hold:**

- **STATE requirements are real** — 40 hours for Life, Accident & Health
  (20 + 20), a 100-question / 2-hour PSI sitting, 70% to pass, $40 exam and $80
  application fees. `invented: false`, and the surface stops apologising.
- **XCEL's PRODUCT hours are still invented** — Prep Review Course, Exam
  Simulators and Exam Cram are XCEL's own prep products and the page states no
  hours for them. The const keeps its `_INVENTED` name for exactly that reason:
  renaming it would quietly upgrade the confidence of three figures that are
  still guesses.

**The 40 happening to match the guess is luck, not a reason to trust the next
one** — the questions (150 → 100), the time (2h30 → 2h) and the provider ("a
state-approved test centre" → PSI) were all wrong.

**Why the flagging mattered in the first place.** The Florida figures these sit
beside were never invented — `readinessFixtures.ts` calls `PASS_MARK` "the only
number on this page that is not invented". Relabelling that 70 as a New York
figure would have turned a true number into a silently false one. So the
Readiness page reads the STATE's facts (`examFactsFor`) rather than a module
constant, and still prints a placeholder line for any state whose figures are
unconfirmed.

**TODO(data):** P&C (90h) and Personal Lines (40h) are published too but not
modelled — the demo is one licence.

**`EXAM_FACTS` was a hardcoded Florida 2-15 block** — correct while Florida was
the only demo licence, and a flat contradiction the moment Home could say New
York, two rail items away, with nothing on either screen admitting it. Same
class as the Study Plan showing a different COURSE from the dashboard. The gauge's
pass mark and the printed one now come from one field, resolved by `useReadiness`
so every tab agrees.

**What is NOT invented: the four categories.** Pre-License Education → Prep
Review Course → Exam Simulators → Exam Cram is XCEL's own 3-Part Training
Program plus the study tool after it — a PRODUCT structure, not a state one, so
it carries across jurisdictions. Only the hour requirements are state-specific.

**SCOPED to the QE persona, not a jurisdiction sweep.** The CE persona is a
different education type and still demos the Florida renewal cycle; the Florida
pre-licensing paths are still in `learningFixtures`. A version switch must not
silently switch jurisdiction, and a test pins CE on `FL`.

**Its study plan is DERIVED from the Florida L&H one**, not hand-authored — same
20-day schedule for the same line of authority, so a copy would be a second
thing to keep in step. **Task dates are deliberately unchanged:** re-pacing
across the longer New York window was the obvious move and is wrong, because
every date-driven surface is anchored to `STUDY_CALENDAR_TODAY` and a
not-yet-started plan renders all of them empty. So the plan finishes months
before the exam, which is coherent rather than a bug — the 20 days are the
COURSE, and the sit date is booked separately.

#### Every rail row is a hoverable, clickable target (2026-09-16)

**`.cre-journey-stop` was a class with NO RULE ANYWHERE.** It had been on the
journey stops since they were built: a clickable row with a chevron and no hover
feedback at all. Same shape of defect as `--color-border-strong`, which did not
exist either — a name that looks wired and is not, and nothing fails.

The rule is in `tokens.css` now, and it covers both rails:

- **`background: transparent` moved from the inline style into the class.** It
  was inline, and an inline value beats a stylesheet rule — so `:hover` would
  have needed `!important` to do anything, and would have looked fine while
  doing nothing. That is the `.cre-uxlinks-title` trap exactly. The class owns
  both states, so neither needs `!important`, and a test asserts no inline
  `background` is left to win.
- **The tint is `--color-neutral-100`**, the same value `.cre-notification-row`
  uses — the established "row hover on a card" here. Two row hovers differing
  by a few percent read as a bug. It is a neutral, so it inverts with the theme
  and needs no dark override.
- **`:focus-visible`, not `:focus`** — these rows are a keyboard user's way
  through the sequence, and `:focus` would ring them on every mouse click.
- **8px of inset tint each side, pulled back with `-8` margins**, so no TEXT
  moves: the row's content stays where it was and only the wash is wider. `-8`
  against `itemStyle`'s gap of 10 leaves 2px clear of the node column.

Measured: the wash is **1.18:1** on the light card and **1.07:1** dark, where it
is a HUE shift (a navy against the card) rather than a luminance one — which a
contrast ratio does not capture. It is decoration; the cursor and the chevron
carry the affordance, and the row title holds 12.79:1 on the tint. Forking the
tint per theme would diverge from `.cre-notification-row` for no accessibility
gain.

**Get Licensed became whole-row targets with it.** It was static text with ONE
link on the first step's title, so three rows describing three actions read as
three paragraphs and the single affordance was a differently-coloured word.

**One target per row, never a link inside a button** — that is invalid HTML, and
two nested targets on a 13px title is a coin flip for the learner. Which element
the row IS depends on where it goes:

- **`href`** → an `<a>` to PSI, new tab, so a learner mid-journey does not lose
  the dashboard to a registration flow. Its accessible name is now the whole row
  (title + detail + owner/fee), which is what a test had to be loosened for.
- **no href** → a `<button>` into the **requirements sheet**. That is the only
  surface describing these three — XCEL's published page covers sitting the
  exam, applying, and the CE cycle after. It is not a per-step destination and
  does not pretend to be; a step-specific page needs content nobody has
  authored, and an invented href is the Resources-slugs defect.
- **neither** → static text with NO chevron, the same rule the journey's blocked
  completion stops follow: a chevron on a row that opens nothing promises
  otherwise.

**`titleStyle` for all three rows now, the PSI one included.** The CTA ink was
carrying "this is interactive" for one step; the hover and the chevron carry it
for every step, and three identical rows is the point. That also retires the
`titleStyleNoColor` trap on that row — there is no longer a theme class there
whose colour an inline style could beat.

#### The "How do I become exam ready?" disclosure is gone (2026-09-16)

A collapsed paragraph under the Study Journey eyebrow, from the reference
design, explaining that the stops run in order and that readiness means
coursework done plus simulator scores holding.

The rail says all of that structurally: the stops ARE in order, each carries its
status in words, and the two assessment stops are marked on the node. A
disclosure explaining the thing directly beneath it is chrome above the content
— and a collapsed one is useful once and invisible after, so nobody who needed
it twice would find it. **Readiness** answers "am I exam ready" with a number
one rail item away; this was a second, wordier answer.

`explainBodyStyle` survives as `railLedeStyle` — the Get Licensed lede is all
that still used it, and a style named for a removed disclosure is how the next
reader looks for something that is not there.

#### There is no learning-path concept on this version (2026-09-16)

Every door onto the `learning-path` section is closed on QE Focused, at
Jillienne's request: **XCEL has no learning-path concept.** The band IS the
programme — there is no separate path object to open.

**One withheld prop closes both doors**, which is why the change is in
`MembershipOverview` (`onOpenLearningPath={qeFocused ? undefined : …}`) rather
than inside the band:

- `StudyJourneyWidget` passes it through as the rail's `onViewAll`, so the
  journey's **"Open learning path"** link stops rendering.
- The band's **TITLE** falls back to `onViewDetails`, so it still opens the
  requirements sheet. It loses nothing and it was the worse of the two doors —
  a clickable title carrying a `title="Open learning path"` tooltip onto a dead
  concept is found by accident.

**The journey-stop fallback moved rather than going away.** Stops are
synthesized (not catalogue course ids), so the in-shell launcher is best-effort
and a launcher opening nothing is the one outcome worse than a second-best
destination. On QE Focused that destination is the requirements sheet — what the
programme actually is — and the learning-path fallback still applies to the
versions that have one. It is asserted at SOURCE, deliberately: the launcher is
available in the test render, so the branch never runs and a DOM test would pass
without exercising it.

**This inverts a guard added earlier the same day.** The requirements-sheet CTA
removal was pinned with "…and 'Open learning path' is still on the page", so the
removal could not become "no way to reach the learning path". That IS now the
intended state, so the assertion is inverted rather than deleted: no button on
the page may say "learning path", and the requirements sheet must be what it
offers instead.

**STILL PRESENT ELSEWHERE, and not swept** — the ask was this version, and the
rest is a product-wide call with real surface area. What remains:

- The **`learning-path` rail section** itself (off in the demo baseline, but it
  resolves from `?section=learning-path`), its `SECTION_TITLES` entry, and the
  `learning-path-page` flag with its V1/V2 variants and "Switch Learning Path".
- The **tabbed detail sheet's "Go to Learning Path" CTA**, which the other three
  consumers still show.
- `LearningPathsHome`, `LearningPathsTable`, `LearningPathCard`, the **Header's
  "Learning Paths" dropdown**, and `learning-paths-count`.
- Copy in `JumpBackInDiscoveryEmpty`, `LearningSetupWizard` ("Building your
  learning path") and four `demoControlsUtil` descriptions.
- `ClpJumpBackInBand` and `MarketingFocusedBand` carry the same
  `title="Open learning path"` tooltip on their titles.

If the concept is genuinely absent for XCEL rather than just absent from this
version, that list is the sweep — and it is a rename-or-remove decision per
surface, not one edit.

#### Time Remaining is 27 days, and `weeksLeft` is a fraction

`RENEWAL_BY_VARIANT['progress-on-track']` reads `ON_TRACK_DAYS_LEFT / 7`
(2026-09-16, the direct ask). "22 wks" read as a learner with no reason to open
the app this month, which is the opposite of what the Study Journey beside it
says. Under 30 days `timeRemaining` switches to a day countdown on its own — so
the fixture reaches for the switch rather than adding a unit.

**NO At Risk treatment comes with it**, which was the explicit half of the ask.
Nothing derives the status from this number for a persona: `STATUS_BY_VARIANT`
supplies a `statusOverride`, and all four bands plus the detail sheet prefer it
over their `weeksLeft`-based `derivedStatus`. The sheet's urgent stat tint reads
the resolved status too, so it stays off. A test asserts it through the RENDERED
strip, not the fixture — an override only matters if the surface honours it.

**The fraction is what made `timeRemainingText` a prerequisite rather than a
tidy.** Three bands were hand-rolling `Math.floor(weeksLeft / 52)` + `% 52` with
no day countdown — `LearnerFocusedBand` interpolated `${weeksLeft} wks`
directly. At 27/7 those render **"3.857142857142857 wks"**. All three read the
shared formatter now (`timeRemaining` for styled segments, `timeRemainingText`
for a string), which is also what makes the band and the sheet it opens agree.
A test asserts none of them still does that arithmetic.

**It is a SHARED map row, so every on-track persona moved**, the CE renewal one
included — `RENEWAL_BY_VARIANT` is keyed by variant with no education axis.

**KNOWN, and older than this change: `deadline` and `weeksLeft` in that map have
never agreed.** `progress-at-risk` is 3 weeks against a date four months out,
and the anchored fixture today (2026-05-11) is 31 weeks from 12/15/2026, not the
22 this row used to carry. They are two independently authored demo values. So
"27 days" sitting beside a Target Date in December is the existing looseness
rather than a new defect — but it is the most visible instance of it, since the
two cells are inches apart. Deriving one from the other is the fix and it moves
every state's visible date, so it is its own change.

#### A removal note rendered as page copy for a day

The note replacing the Learning Path Progress section shipped as a bare
`/* … */` inside JSX rather than `{/* … */}`. In child position that is TEXT,
so twenty-eight lines of rationale rendered on Home, on every version. tsc was
clean and all 700 tests passed; only reading the live DOM caught it.

`QeFocusedVersion.test.tsx` now asserts the rendered overview contains no `/*`
or `*/` across three versions — the whole page rather than this one note,
because the mistake is invisible in review and one keystroke away anywhere.

### The robot stays in the Demo view (2026-09-16)

`AdminToolsMenu` — the hidden robot in the prototype bar that opens the Feature
Flag sheet — used to `return null` whenever demo mode was on, unless a
`?tools=1` back door was set. **It now renders in the Demo view too**, at
Jillienne's request.

**The gate was protecting the wrong thing.** Its stated reason was that a
stakeholder should see a clean demo — but the trigger is `opacity: 0` at rest
and only fades to 60% when its own 32px box is hovered, so there was nothing on
screen to clean up. What it actually cost is the case that matters: **the Demo
row on the gateway opens `/dashboard-rebrand?demo=1`**, which is how most people
arrive, so the one route a reviewer lands on was the one route with no way into
the flag sheet. The `?tools=1` back door is undiscoverable by design, which is
fine for a back door and useless as the primary path.

**What made the gate defensible is still true, and is why removing it is safe:**
demo mode SUSPENDS flag persistence, and the panel already drops *Set as
default* and *Restore original defaults* under `demoMode`. Nothing reachable
from the robot can drift the sandbox or redefine the committed Demo baseline.

**Two things had to change with it, and both are the interesting part.**

**The baseline writes are now refused at the STORE, not just hidden in the UI.**
`saveAsDefault` and `restoreOriginals` had no `demoMode` guard — the only thing
stopping a demoer redefining "pure" from inside the Demo was that the panel did
not render the buttons. That was sound while the panel was unreachable there;
making it reachable turned it into a guard one stale call site from failing.
Both now return early under `demoMode`. Same reasoning as `visibleNotifications`
re-checking `requiredInApp` rather than trusting the stored value, and a test
asserts the refusal rather than the button's absence.

**The sheet says it is in the Demo view.** The sentence "changes preview here
only and reset on exit" lived in the robot's DROPDOWN — which never renders on
the rebrand, because there the robot opens the sheet directly. So a reviewer
would have flipped a flag, left, come back and found it reverted with nothing on
screen to explain it. The notice is at the top of the sheet body now, styled as
a quiet tinted rule rather than a warning banner: nothing is wrong, it is the
demo's own contract. It also explains the footer's missing buttons.

`?tools=1` is no longer read. An old link carrying it still works — the param is
simply ignored.

### The flag audit — 47 flags removed 2026-09-16

The catalog came over from the Common LMS with the product app, and most of it
described surfaces XCEL does not have. **`FEATURE_FLAGS` went from 98 keys to
51**, and the `/dashboard-rebrand` panel scope from 53 to 24.

**How the set was chosen, because the method is the reusable part.** Every flag
state in the catalog was flipped one at a time against a render of all 24 shell
sections plus the ten standalone routes, and the DOM diffed. Of 111 flag states,
**58 changed nothing anywhere**. That is evidence, not inference — but it has one
blind spot worth knowing: it measures the INITIAL render, so a flag whose surface
only appears after a click (a course sheet, a cancel flow, a detail panel) reads
as dead when it is not. Nothing was removed on the sweep alone; each of the 47
also has a structural reason below.

**Three groups, three different reasons:**

1. **The classic `/dashboard` — 26 flags.** `dashboard-kpi-card`,
   `jump-back-in-card`/`-links`/`-chrome`, the eight `jbi-quicklink-*`,
   `learning-path-card`, `courses-summary-card`, `premium-membership-card`,
   `whats-new-card`, `dashboard-rail-tray`, `dashboard-top5-pagination`, the four
   `membership-card-*`, `quick-links-card`, `rubi-tutor-widget`,
   `streak-hero-card`, `dashboard-drag-and-drop`. They drive `DashboardV1`–`V5`
   and `LearnerOverviewPanel`, reachable only at `/dashboard` — which sits behind
   `dashboard-tab` (default OFF, redirecting to Learning Path) and is not what
   the XCEL demo opens. **Home uses its own `OverviewJumpBackIn`, not the classic
   `JumpBackInCard`**, which is the thing to check before assuming a
   dashboard-looking flag reaches the rebrand.
2. **Membership — 18 flags.** `supportsMembership('xcel')` is false, so every one
   of these configures a surface the brand cannot reach. Ten were in the Home
   panel scope. `membership-savings-cta` is the extreme case: **zero
   `useFeatureFlag` call sites anywhere in `src/`** — it existed only in the
   catalog.
3. **Home flags with no XCEL content — 3.** `dashboard-featured` and
   `whats-new-image` both configure `FeaturedHero`, and
   `whatsNewFeaturedFor('xcel')` is `[]` (a standing `TODO(data)`), so the hero
   self-hides whatever they say. `dashboard-whats-new-layout` named the "What's
   Trending" section, archived 2026-08-05.

**The removal pattern, which is the repo's existing one** (see the
`membership-recap-ticket` / `dashboard-hero-bleed` notes): delete the catalog
entry, and at each call site replace the flag read with a **constant pinned to
that flag's committed default**, carrying a comment that names the flag and the
date. Every branch the flag fed is KEPT. Restoring one is re-adding its catalog
entry and un-pinning the constant — never a rebuild.

**Pin the DEFAULT, not `false`.** A `useFeatureFlag` call on a key the catalog no
longer defines resolves to `{ enabled: false }`, which is not what most of these
carried — the surface would change silently rather than error. That is why the
pins are explicit and why `FeatureFlagPanel.test.tsx` asserts the 47 keys are
absent from the catalog AND from `REBRAND_FLAGS`: a key left in the scope after
leaving the catalog is silent, since the panel filters the catalog BY the scope.

**Four things went with them, and each is the interesting part of the change:**

- **`DashboardMVP` is archived** (`ARCHIVED_ITEMS` id `dashboard-mvp-version`).
  It was defined ENTIRELY by `MVP_FLAGS`, a snapshot of eight of the removed
  flags; without them it renders as V3 with `hideRightRail` / `trail` /
  `consolidatedProgress`, i.e. a second near-identical row in the version picker.
  The file is kept, unreferenced. Note five of its thirteen entries were always
  moot — the right-rail ones, which `hideRightRail` already dropped.
- **Per-widget Lo-Fi is gone.** `LO_FI_VARIANT` / `DEFAULT_PLUS_LOFI` appended a
  "Lo-Fi" option to each widget's flag; every flag that offered it was a classic
  dashboard flag. The GLOBAL Lo-Fi switch (`LoFiContext`) is untouched and every
  `LoFiScope` wrapper is still in place — they now receive `on={false}`.
- **`dashboard-clp-fullwidth` lost its "When to show" secondary axis.** Its
  `when-whats-new-off` option waited on `dashboard-whats-new-layout`; with that
  gone the condition is permanently true, so the two options rendered
  identically. `clpFullWidthActive` is now just `showExtras && flag.enabled`.
- **The Demo Controls bar lost two controls**, both of which had stopped doing
  anything: the Persona dropdown's "Hide Featured Section" switch (wrote
  `dashboard-featured`) and the "Multiple memberships" persona (carried
  `requiresMembership: true`, so `personasForBrand` already hid it for XCEL).
  `resolvePersonaFlags`' `whatsNewOn` arm is kept but EMPTY so the `?wn=` codec
  and the function signature are unchanged. The "Membership Version" drill-in row
  went from the flag panel for the same reason.

**What was deliberately NOT removed, and why it looks removable.**
`dashboard-recommended-blurb` is inert at the demo default — the blurb only
exists on the trending/`VibrantCard` treatment, so it needs
`home-recommended-card-ab: trending` to show. It is a real control behind a
combination, not a dead one. The `gift-recipients` trio is the other near-miss:
`supportsGiftRecipients('xcel')` is false, so the panel renders its empty state
either way — but `giftRecipientsFixtures.ts` names that gap as **the one worth
fixing**, so removing its flags would have paved over the todo.

**One bug this surfaced, not fixed here.** `dashboard-career-tools` survives (it
is live on Home, default off) and switching it on prints a **"Member Exclusive"**
badge and *"all included with membership"* on a brand that sells none. It is the
same defect as the Membership Plan card and the Account Details "Member" pill —
`isMember` is true for XCEL because its only tier is `high`. **When a brand
predicate turns something off, sweep for the places that ask the TIER instead.**


## The 2026-09-08 migration — the product app, XCEL only

The Common LMS product app was copied in and stripped to one brand. It is the
largest change this repo has had: `src/` went from 174 files to ~650, and from
17k lines to ~150k.

### It reverses a decision made four days earlier, deliberately

`jill-dashboard-ux-designs/xcel-brand/XCEL-build-prompt.md` (2026-09-04) says,
under "Decisions already made — do not re-litigate these":

> **Repo** — This one. `xcel` becomes brand #6. The sibling
> `../xcel-ux-dashboard` keeps only the standalone HTML prototypes; it does not
> get the brand system.

That is no longer the arrangement. XCEL is a project in its own right, not one
brand among six competing for attention in a multi-brand demo — the same
argument that put the five XCEL rows in **Exploration** here and left them in
**Design** over there. The build prompt and the gap audit are still accurate
about everything else; treat that one row of the table as superseded, not the
documents as stale.

### What "XCEL only" actually means

`Brand` is a **one-member union**, not a deleted type. `Record<Brand, …>` maps,
`professionFor`, `featurePreviewSrc` and `prototypeFeatures` all take it as a
type, so the seam is what makes re-adding a brand an edit in `AccountContext`
instead of a refactor across those files — and every `Record<Brand, …>` in
`src/data` fails to compile until the new brand has an entry, which is the
point. `tokens.css` keeps the `[data-brand]` SELECTOR for the same reason.

Two things NOT to misread:

- **The `@theme inline` defaults in `tokens.css` are still the LMS's CRE-derived
  ramp.** They are what shows if `data-brand` is ever absent. They are not
  XCEL's palette; the `[data-brand='xcel']` block is.
- **Membership was NOT removed.** `supportsMembership('xcel')` is false and
  suppresses every membership surface, which is the architecture the brand-add
  built. `src/components/membership/` is also not all membership —
  `LearnerFocusedBand`, `ClpJumpBackInBand`, `FeaturedHero` and `WhatsNewWidget`
  are dashboard surfaces XCEL renders that merely live in that folder. Deleting
  the folder breaks the dashboard.

### Where the LMS still has more than we do

The strip removed the other five brands' fixtures, and those brands carried demo
states XCEL does not. **The suite is green — 468/468** — but it got there three
different ways, and which one applied to a given test is worth knowing before
you touch it:

| Gap | How the test was resolved |
|---|---|
| My Courses reached only in-progress / not-started / completed | **Data authored.** Seven rows added covering both routes into `expiring-soon`, expired-with-progress, the per-course `warnDays` negative case, failed with and without a score, and archived+failed |
| The CE path claimed completed hours with no completed course in its list | **Data authored**, and it was a real incoherence — the gauge said six hours were done and the list showed none |
| XCEL has no in-person courses, and nothing resolves to `included` | **Test moved down a layer** to `EnrollmentConfirmationModal` |
| XCEL authors no library video/webinar, and no downloadable assets | **Test moved down a layer** — variants are built, not fetched |
| **Gift Recipients has no XCEL records** | **Retired.** See the note on `supportsGiftRecipients` — still the one worth fixing |
| Library records set no `tags` / `status` / `lengthMinutes` | **Retired** (three filter tests) |
| No partner offerings; no renewal requirements | **Downgraded** to asserting the empty state |

Two rules fall out of this, and both are load-bearing:

**Prefer moving a test down a layer over authoring data to satisfy it.** A test
pinned to a named fixture row is testing the fixture as much as the code — which
is exactly why so many broke. `ProgressFillTones` and the ResourceDetailPage
variants now build their inputs and depend on no fixture at all. Author data
when the DATA is the subject (the state-coverage tests genuinely assert that the
demo spans every state) and not otherwise.

**Never author a fixture that points at an asset which does not exist.** The
`downloadUrl` / `pdfUrl` tests were tempting to fix with XCEL resources naming
files under `public/library/`. Those files are real Elite assets; XCEL ships
none, so that would have made the running demo 404 on download to turn a test
green.

### Verifying a change here

`npx tsc -b --noEmit` is the real guardrail for a brand-shaped edit: the union
being one member means a stray brand literal is a compile error rather than a
runtime surprise. Then `npx vitest run`, then `npm run smoke` — and remember
`npm test` does NOT run the smoke suites.

