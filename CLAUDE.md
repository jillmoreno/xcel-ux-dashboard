# XCEL UX Dashboard

XCEL LMS design work: **the product app and the gateway that documents it.**

Two things live here, and it is worth being precise about which is which,
because they arrived eighteen months apart in project time and six days apart in
real time.

**The gateway** (`/`) was ported on 2026-09-02 from the PartnerHub UX Dashboard
— NOT from the Common LMS original — because PartnerHub was already the trimmed
version: slim `AccountContext`, iframe previews instead of the component
registry, the thumbnail fallback fixed, the port moved. That skipped two whole
steps of the port procedure. Port from the most recently ported dashboard, not
the oldest one.

**The product app** arrived on 2026-09-08 from the Common LMS
(`jill-dashboard-ux-designs`), stripped to XCEL alone. See "The 2026-09-08
migration" below — including why the decision recorded four days earlier said
the opposite.

## Stack

| Dimension | Value |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| Routing | react-router-dom v7 |
| Icons | Font Awesome 7 Pro Light — self-hosted SVGs in `src/icons/` via `vite-plugin-svgr` |
| Tokens | `src/styles/tokens.css` (`@theme inline`) |
| Server code | Two Netlify functions over Netlify Blobs — QA Notes + captures |
| Tests | Vitest + @testing-library/react |

## Scope — read before adding a route

**CHANGED 2026-09-08. This section used to say "gateway only, four routes".**
It is now three things, and where a new screen belongs depends on which:

| Surface | Lives in | Reached at |
|---|---|---|
| The UX Dashboard gateway | `src/pages/UxDashboardPage.tsx` + friends | `/`, `/prototype/:id`, `/research-rationale`, `/qa-notes` |
| The XCEL product app | `src/pages/*`, `src/components/*` | `/dashboard-rebrand` + ~28 product routes |
| The standalone prototypes | `public/prototypes/*.html` | `/prototypes/…`, opened in a tab or iframed |

**A new XCEL screen has two homes now, and picking wrong is the mistake this
section exists to prevent.** If it is a REACT surface of the product — a page in
the shell, a panel, a card — it belongs in `src/` as a route. If it is a
hand-authored HTML exploration answering a brief, it belongs in
`public/prototypes/` as a document, and it gets a `PROTOTYPE_FEATURES` row, not
a route.

The old warning still holds in its narrow form: **do not rebuild one of the six
standalone prototypes as a React route.** That is the "two sources of truth"
failure the previous wording was guarding against, and it is still real. What
changed is that a React product surface is no longer automatically out of
scope — the product IS React here now, exactly as it is in the LMS.

## The home page (`/`)

[`UxDashboardPage.tsx`](src/pages/UxDashboardPage.tsx) — a left nav over a
project list. Unchanged from the LMS original apart from three strings (the
brand sub-line, the Research row label, `RESEARCH_DECISIONS`), so anything the
LMS `CLAUDE.md` says about it holds here.

**Sections.** Two open — Demo · Research — then a divider under a **UX & DEV
ACCESS** eyebrow holding Design · Exploration · Sandbox · Development · Done ·
Archive · QA Notes · To Do.

**Demo holds the live product build** (`xcel-dashboard` → `/dashboard-rebrand`),
promoted there on 2026-09-08. It is the one row on the ungated front door, so
what sits in Demo is a decision about what a stakeholder may see without the
password — `UxDashboard.smoke.test.tsx` compares the whole section against an
expected set, in both directions, so promoting or demoting a row fails a test
first. It is also the one row in the file that is an in-app ROUTE rather than a
standalone HTML document; see "The one in-app row" below. All eight restricted sections share **one gate id**
(`design-and-development`) and therefore one password, so a reviewer types it
once. The password comes from `getPrototypePassword()` — `Password123` unless
overridden. Selecting a locked section opens the modal *over wherever you are*,
so cancelling can't strand you, and a deep link into a gated section is checked
against the **feature's own** section, not the one being viewed — neither a
side-door link nor cancelling reveals a gated spec.

**Which section a row lands in** is `sectionOf()`: `done` outranks everything,
then `devStatus`, then `category` as a fallback. Design and Development are the
only two sections split *by* `devStatus`, so they're the only two its absence can
split wrongly — both render a banner counting the rows placed by that guess.
Author `devStatus` and it stays at zero.

**All five XCEL rows sit in Exploration** (moved there 2026-09-02 from Design).
The same rows are in **Design** over in the LMS dashboard, and that difference is
deliberate rather than drift: there they are five artifacts among many competing
for one designer's attention, so dev-cycle status is the useful axis; here they
*are* the project — an outside product's brief rebuilt on our tokens and
conventions, which is what this section's blurb describes.

Mechanically that means **no `devStatus` on any of them**. `sectionOf` checks it
*before* `category`, so a status added to one of these rows silently pulls it out
of Exploration and into Design — no error, and it reads as the row simply
vanishing from the section. `UxDashboard.smoke.test.tsx` asserts the inverse
("no Exploration or Sandbox row carries a devStatus") so the next person to add
one gets a failing test instead of a disappearing row.

**Appearance** is pinned to the foot of the nav: four themes (Light · Hybrid ·
Dim · Dark) × four palettes (Moss · Ember · Tide · Fern), on independent axes,
persisted to `localStorage` and **local to this page** — it deliberately does not
drag the prototypes dark. Default is Fern · Hybrid. The palettes are `--ux-*`
custom properties on the shell root, so they're independent of the PartnerHub
brand tokens; `ARCHIVE_BRIDGE` re-points the six brand tokens `ArchiveTable`
needs at the palette so it doesn't draw a navy block inside a green page.

Every text element was audited to WCAG AA across all 16 palette × appearance
combinations in the original. **If you add a palette, re-measure** — the note in
the LMS `CLAUDE.md` about each palette's brightest colour being unusable as small
text on a light page is the trap.

## The one deliberate divergence: live previews

`ComponentLivePreview` in
[`PrototypeHandoffDetailPage.tsx`](src/pages/PrototypeHandoffDetailPage.tsx).

In the LMS it is a registry of ~35 `if (componentId === …)` branches, each
rendering a real in-repo React component. That is why the original file is 3,539
lines and why tracing its imports reaches 81,000 lines across 204 files — the
previews *are* the product.

Here the preview is **data**: a `previewUrl` on the handoff component, falling
back to its parent feature's first `pages` entry, rendered as an iframe of the
served file. Add a preview by authoring a field, not by editing this page. The
LMS already used exactly this pattern for its own two HTML prototypes
(`QuestionListPreview`, `NgatAdminPreview`), so this is that generalised — not a
downgrade.

**The original reason for this was "PartnerHub has no such components". That
stopped being true on 2026-09-08** — the product app is in this repo now, so a
component registry is buildable again. It is still not built, and that is a
choice rather than an oversight: the six rows this gateway documents point at
standalone HTML documents, which an iframe renders exactly and a registry cannot
render at all. A registry would earn its place only once a row documents a REACT
surface of the product. If one does, build it for that row — do not convert the
six.

Consequence worth knowing: `stackLogicBelow` / `fullscreenPreview` in that file
are now constants. In the LMS they were long OR-chains of component ids, because
its previews ranged from a 380px rail (fine beside its UX logic in two columns)
to full-page compositions. Every preview here is the same 860px iframe, so there
is nothing left to switch on. They're kept as named constants so the two-column
pairing is one edit away if a narrow preview ever lands.

## Trimmed on the way over — SUPERSEDED 2026-09-08

**This section described the 2026-09-02 gateway port and every line of it is now
out of date.** Kept, struck through, because the reasoning explains why the
files look the way they do rather than what they currently contain.

- ~~**`AccountContext`** — 645 lines → ~150.~~ It is the **full** context again
  (~600 lines), stripped to one brand rather than to one gateway's needs. What
  survived the reversal is the shape of the decision: `Brand` is still a
  one-member union for exactly the reason given here, and `Membership` is still
  the axis the gateway's `FeaturePageLink.membership` uses. Note the two now
  mean different things on the two surfaces — for the gateway it is "the same
  page, two states"; for the product it is real membership, which XCEL does not
  sell (`supportsMembership` is false for it).
- ~~**`FeatureFlagContext`** (2,571 lines) — not ported.~~ Ported. The product
  reads flags heavily; the prediction that it would be needed "if PartnerHub
  grows variants" was right, just for a different reason.
- ~~**`PageShell` / `PlaceholderPage`** — not ported. There are no product
  routes to stub.~~ Ported — there are ~28 product routes now, and several of
  them are `PlaceholderPage` stubs.

## Data files

| File | Holds |
|---|---|
| [`src/data/prototypeFeatures.ts`](src/data/prototypeFeatures.ts) | The five XCEL rows + `PROTOTYPE_BASE`. The type block is verbatim from the LMS (so the ported components compile unchanged) plus one added field, `previewUrl`. Rows are ported verbatim from the LMS dashboard, which still has its own copies. |
| [`src/data/archivedItems.ts`](src/data/archivedItems.ts) | The Archive table — empty; XCEL has removed nothing yet. |
| [`src/data/qaNotes.ts`](src/data/qaNotes.ts) | The committed QA seed — empty; findings are authored on the page. |

### The one in-app row

Every row in `prototypeFeatures.ts` opens a standalone HTML document under
`public/prototypes/` except **`xcel-dashboard`**, which is a react-router route
(`to: '/dashboard-rebrand'`) into the product app that now lives in this repo.

**Do not confuse it with `xcel-lms`**, the Exploration row titled "XCEL LMS —
Desktop Platform". That one is a hand-authored HTML mock-up of these same
surfaces; this one is the surfaces themselves. They look alike on purpose — the
mock-up was the argument for building it.

Three consequences worth knowing:

- **`to` and `externalUrl` are mutually exclusive**, and a test asserts it. The
  document-shape guards (same-origin `/prototypes/…`, the file exists in
  `public/`, one shared base) are scoped to rows WITHOUT `to` — so a new
  document row cannot skip them by quietly omitting `externalUrl`, which is how
  that guard would otherwise be lost.
- **It has no `thumbnail`, so its row preview boots the app** in a scaled
  iframe. That is the cost `FeaturePreviewThumb` documents. It is accepted here
  because Demo holds ONE row and a live frame cannot go stale — the same
  trade-off the thumbnails README describes, landing the other way than it does
  for `xcel-admin-tool`, which is one of several rows in a section. Add a
  capture if Demo grows.
- **No `devStatus`**, same trap as the Exploration rows: `sectionOf` checks it
  before `category`, so authoring one silently moves this row off the front
  door.

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

**The footer carries "Week 4 of 9"**, so seven day cells never imply a one-week
plan.

**It reads the persona's path**, the same one the Study Plan section resolves,
so the two cannot describe different courses. Guarded by `hasStudyCalendarFor`
rather than `supportsStudyPlan` — the same trap the Jump Back In card hit, where
`studyCalendarFor` falls back to STC's Series 79 plan for an unknown id.

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

**The icon is `gauge-simple-high`**, registered as `Gauge`. Compared against
`gauge`, `gauge-simple`, `gauge-high`, `gauge-max` and `gauge-simple-max` at
17 / 24 / 48px before choosing, and the rail's **17px** is what decided it:
plain `gauge`'s needle points straight UP, which at that size reads as an arrow
in a circle rather than a dial. The `-high` needle sits diagonal and is
unmistakable. `-simple` drops the tick marks, which mush at 17px.

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

### Two small brand touches (2026-09-09)

**The learner's own avatar carries a thin Brick ring** — `brandRing` on
`Avatar`, 2px of `--color-cta-500`, which on XCEL is #9A1B1E: the same red as
the knight in the logo. It marks the rail profile header as *the learner*, since
every other photo on the dashboard is stock or course art, and it is the ONLY
call site that sets it.

Deliberately not the existing `ring` prop — that is 3px border + a 2px offset
outline, ten pixels of chrome on a 48px circle. Under the global border-box
reset the 2px eats into the box, so the avatar still measures 48 and nothing
reflows. A non-default `tier` supersedes it, the same way it supersedes `ring`:
tier bands are concentric and flush, so a red ring outside them would read as a
fourth band rather than as identity. XCEL has no membership, so the two never
meet today.

**The band eyebrow is "Current Learning Progress"**, renamed from "Current
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

> Home · Study Plan · My Courses · Certificates — Browse Catalog · Resources ·
> AI Study Partner — Get Help

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

A rail section (`resources`) sitting directly **under Browse Catalog**: Browse
Catalog is what you buy, Resources is the free half of the same "go and find
something" job, so they read as a pair. The body is XCEL's four outbound
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

### The archive convention

Don't delete outright. **Unwire** it (pull it from routes, render paths, flags),
**keep the file** in the repo unreferenced, and **add an `ARCHIVED_ITEMS` row**
with a `restoreNote` listing the actual re-wire steps. Bringing something back
should be a re-wire, never a rebuild. `restoreNote` is the field most often
written too thinly — name the files, the call sites, and anything deliberately
*not* restored.

### Row thumbnails — one row now needs one

The sibling PartnerHub dashboard authors a `thumbnail` on every row for a
performance reason: nine of its ten rows preview the same 857KB single-file app,
so a section booted several copies of it just to draw its list.

XCEL used not to have that problem — five rows, five documents, 9–111KB each, so
the live scaled iframe was cheap and could not go stale. **`xcel-admin-tool`
broke that condition.** It is a fork of the PartnerHub app and it is ~910KB, so
opening Exploration now boots it in a scaled iframe to draw one list row. That
row wants a real capture; the other five are still fine unset.

Shoot it on the roster with the **Who is stuck** preset active — that is the
state the whole argument rests on.

If you do add them: **name the files by prototype and state, not by feature id**,
and note that `FeaturePreviewThumb` falls back to the live frame when a PNG is
missing (an `onError` swap added during the PartnerHub port — the Common LMS docs
claim this behaviour but nothing there implements it). That fallback is what
lets paths be authored before the screenshots exist, and makes deleting a PNG a
safe way to retire it.

### The cross-repo dependency — resolved, and how it used to rot

**Corrected 2026-09-02:** this section used to say `PROTOTYPE_BASE` points at
`https://ux-lms-dashboard.netlify.app/prototypes`. It does not, and had not for a
while — it is `'/prototypes'`, same-origin, served from this repo's own
`public/prototypes/`. The comment block at the top of `prototypeFeatures.ts`
explains why the pointer was abandoned: both sites sit behind Netlify password
protection, so an iframe of the other origin needed a third-party cookie, and
reviewers got a password prompt inside every thumbnail. The smoke test asserts
the same-origin shape (`/^\/prototypes\/[\w.-]+$/`) and that every file exists in
`public/`, so a careless edit fails there.

**RESOLVED 2026-09-03 — these files are no longer copies.** This section used
to say `public/prototypes/*.html` were published from
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/` by
`./deploy-xcel-prototypes.sh`, and carried a `TODO(2026-09-04)` to move them.
That move is done: the sources and the five smoke suites are in THIS repo, the
XCEL rows and the deploy script were removed from that one, and there is no
mirror to keep in step. See "The six prototype pages" below. `xcel-admin-tool.html`
was always the exception with no upstream — now nothing has one.

Same class of problem, unchanged from the siblings: any authored count with no
array behind it. `RESEARCH_DECISIONS` is 0 here because XCEL has no decisions
log; nothing derives it and nothing warns when that stops being true.

## The six prototype pages (`public/prototypes/`)

The FinServ (Insurance / Mortgage / Banking) next-generation platform, answering
the FinServ *Learner and Admin Wireframe Brief*. Six `PROTOTYPE_FEATURES` rows,
all `category: 'exploration'`: **`xcel-lms`** (Desktop Platform, `pinned`) ·
**`xcel-walkthrough`** (Learner Walk-through) · **`xcel-wireframes`**
(Wireframes & Overlap) · **`xcel-admin`** (Admin Wireframes & Overlap) ·
**`xcel-admin-tool`** (the forked roster — documented in its own section below) ·
**`xcel-exam-spec`** (Exam Task-Type Spec).

### There is no source/served split — moved here 2026-09-03

These five pages and their smoke suites used to live in
`jill-dashboard-ux-designs/explorations/finserv-learner-brief/`, published to
that repo's `public/prototypes/` by `deploy-xcel-prototypes.sh`, which then
MIRRORED the six files into this one. That arrangement existed because that site
served them too, and it is gone: **the XCEL rows, the sources and the deploy
script were all removed from that repo**, so this is now their only home. That
also resolved the `TODO(2026-09-04)` this file used to carry.

What it means in practice: **`public/prototypes/*.html` ARE the sources — edit
them directly.** No copy step, no deploy script, nothing to keep in step. The
same model `xcel-admin-tool.html` was already on, which is why the split had
become inconsistent as well as duplicative.

The five smoke suites moved with them, to **[`smoke/`](smoke/)**, reading
`../public/prototypes/` rather than a source next door. Run them with
**`npm run smoke`** — 41 + 48 + 100 + 42 + 21 = **252 assertions**. Two things
changed on the way over, both because these assertions were written against the
other repo: `smoke-tiles.mjs` now expects each row in **Exploration** (there the
rows carried `devStatus: 'in-design'` to force them into Design; here XCEL *is*
the project, so `category` alone places them), and it matches `externalUrl` in
**both** quote styles — that repo wrote a plain single-quoted path, this one
builds a backtick template against `PROTOTYPE_BASE`, and matching one style
yields `undefined`, which `existsSync` reports as a missing FILE rather than as a
broken regex. It also covers `xcel-admin-tool`, which has no upstream counterpart.

**Order still matters if you run them individually:** `smoke-tiles.mjs` asserts
every tile's `externalUrl` resolves to a real file in `public/prototypes/`, so
add the page before the row, or that suite fails on a row pointing at nothing.

### The admin page

**The admin page** ([xcel-lms-admin.html](public/prototypes/xcel-lms-admin.html), served as `/prototypes/xcel-lms-admin.html`) covers admin flows 01–06 and is built on ONE claim, arrived at by Jillienne overruling an earlier and more elaborate reading: **flows 03, 04 and 06 are not three screens but one roster asked three different questions, because who paid for a seat is a COLUMN, not a mode.** A learner whose agency bought their seat and one who bought their own are the same row with a different value in one cell; the admin's question — *how is this person doing* — is identical either way. The rejected framing treated sponsored-vs-self-paid as a product-model fork and concluded PartnerHub could not reach flow 04; that conflated a rule for the LEARNER app (don't show a price or upgrade CTA to someone whose agency paid) with the ADMIN surface, where it does not apply. What survives of it: **spend is the one thing that is not a column**, because it is a total rather than a property of a learner — it sits in the agency roll-up above the table, which keeps it out of the row and off the learner's screen by construction. The page's centrepiece is a **working roster stage**: 14 learners, three view presets (Who is stuck · Invite follow-up · Seats & spend) that re-filter and re-sort the SAME rows, sortable headers, status chips, bulk selection with a view-specific action, and a side panel on row click — deliberately not an expanding row, since on a cohort-scale list expansion pushes whatever you were comparing against off screen. Its five badges are PartnerHub's own (Compliant · On Track · At Risk · Overdue · Not Started), derived by the real rule (At Risk = under 30 days AND under 25% done). A second stage answers flow 01 with **drill, don't unfold** — a breadcrumb whose root is a boundary rather than a starting point, so subtree scoping is structural instead of a clearable filter — plus an **as-of** control, on the reasoning that "as of" and flow 05's provenance are one problem (*what does this number actually mean*) and must share one basis line, or every screen reads hedged. Three hatched holes: inherited-vs-overridden pricing (the blast radius is the hard part, not the badge), the provenance confidence threshold, and **utilisation beyond "claimed"** — Gift Recipients models claimed/unclaimed, but a seat can be claimed, paid for and idle, which is exactly flow 06's "bought and never started", so flows 04 and 06 meet on the same row. The roster shows an **Idle** state whose 14-day threshold is invented and flagged as such. Guarded by [smoke-admin.mjs](smoke/smoke-admin.mjs) (42 assertions), which checks the load-bearing claims specifically: that a named learner appears in more than one view rather than being filtered out of existence, that spend is in the roll-up and NOT in the table header, that a self-paid seat cell is genuinely blank rather than "n/a", and that a parent node shows its children summed.

### The desktop platform — brand colour

**THE RED IS NOT THE PRIMARY (2026-09-02).** It was — a ramp derived from the wordmark red at `#a81c24` — and the problem was not the colour, it was that ONE ramp was carrying four unrelated jobs: brand identity, every interactive control, all progress data, and the licensing-exam accent. When the product's own data is red, there is nothing left for the brand to be. The ramps are now split three ways in [xcel-lms-desktop.html](public/prototypes/xcel-lms-desktop.html): **`--brand-*`** is the wordmark red, carrying identity (logo `X`, avatars) and exactly ONE semantic — the external licensing exam (`.taskrow.exam`, the `p-brand` pill, the calendar's exam day) — and it is **constant across every palette**, because it is the brand, not a theme choice; **`--primary-*`** carries interactive + data; **`--slate-*`** is the second data hue (the Elective gauge segment) and is **palette-scoped too**, because a second hue can only be chosen against the primary it sits beside. A new **`--on-primary`** token replaced two hardcoded `#2f080a` dark-red inks on `.btn` and `.tabs`, so those rules need no dark-theme override at all.

**Three candidate palettes ship behind a live switcher** in the prototype bar (`data-palette` on `<html>`, persisted to `localStorage['xcel.dt.palette']`, default **navy**), so the choice is made against the real product rather than a swatch board: **A · Navy** `#1f4e88` (insurance-conventional, the highest headroom at 8.39:1) · **B · Graphite** `#3f4753` (near-neutral, which makes red the only saturated colour in the product — but watch the gauge, where grey progress can read as *inactive*) · **C · Teal** `#0f6e72` (least "bank"). The switcher is prototype chrome, styled apart from product UI, and its swatches are literal hex rather than tokens because the control has to show the palette you are NOT currently in.

**Findings from the re-palette, in rough order of how easily they regress.** (1) **The XCEL red does not "pop" against any deep primary** — it measures 1.14–1.28:1 against all three 500s, because `#a81c24` is a genuinely dark red (luminance 0.093) and so is every candidate. This is NOT a defect and there is no threshold for it: red and the primary are never text-on-each-other, red is 7.35:1 on its actual background (white), and the exam day is labelled "Exam · PSI" in words, so nothing is carried by colour alone. But it does mean red reads as a *peer* of the primary rather than an accent above it — if a future brief wants red to genuinely pop, the primary has to move to a 700-depth stop (Navy 700 gets to 1.88:1), not a different hue. (2) **The dark-mode gauge collapsed and a test caught it**: all three palettes put their dark `primary-500` at ~0.44 luminance, and the light bronze Elective landed there too, so the two segments measured **1.01:1** — the same bar in two hues. The dark Elective is `#a86e28`, which holds 3.94:1 on the dark card AND ~2:1 against every primary; **lighten it and the gauge stops reading as two things**. (3) The teal palette's Elective is a stop lighter than the other two (`#b8873f`, not `#a9682a`) because teal 500 is dark enough that the deeper bronze collapses to 1.35:1 against it — the second hue genuinely cannot be shared across palettes.

**The palette is now guarded by tests, which it was not before.** `smoke-desktop.mjs` went from 51 to **100 assertions**: it parses the real declared hex out of the stylesheet (so the assertions track the CSS rather than a copy that can drift) and sweeps all three palettes × light/dark for rail-active ≥3:1, rail-chip ink ≥4.5:1, link/500 ≥4.5:1 on white, white-on-fill ≥4.5:1, the two gauge segments ≥1.6:1 apart, and `--on-primary` ≥4.5:1 on the dark fill. Following [`ProfilePersonalizeContrast.test.ts`](src/test/ProfilePersonalizeContrast.test.ts), it also asserts the **old failing values still fail** (`#a81c24` at 2.05:1 on the rail; `#c75159` still the marginal 3.41:1 stop) so a future palette reaching for either fails a test instead of quietly shipping an invisible rail indicator — and it asserts the hero gradient stays gone. **Two demo axes are live and both re-render everything**: `dashboard-education-type` (Pre-Licensing ⇄ Continuing Ed — renames every category label, swaps Target Date for License Expires, and hides the renewal cycle for pre-licensure, since there is nothing to renew yet) and `dashboard-progress-state` (the five compliance states). A third, **Exam**, has no counterpart in the dashboard project: four of the licensing exam's six states are DERIVED from the sit date, so there is no way to click to them — the control exists for the same reason the walk-through has a clock. **A provenance toggle in the prototype bar** overlays each card with the real component it came from plus a per-section note on what was reused, what was dropped and why — it is the answer to "what actually overlaps", made checkable rather than asserted. **The logo is a text lockup with an `<img src="/brand/xcel.svg">` in front of it that hides itself if the file is absent** — drop the real asset at that path and it appears with no code change. **The two original contrast findings survive the re-palette as a RULE, not as two hex values.** They were: the XCEL red measures **2.05:1 against the near-black rail**, under the 3:1 a state indicator needs; and `#c75159`, the stop that cleared it, is an awkward mid tone where **neither white (4.42:1) nor near-black (4.09:1)** reaches 4.5:1 at chip size. Generalised: every palette puts a **light** stop on the rail (`--rail-accent`, now 5.34–6.01:1) and fills chips with a **light tint over dark ink** (`--rail-chip` / `--rail-chip-ink`) rather than a saturated fill. Re-measure before darkening any of them. Same trap as the McKissock secondary/tertiary ramps documented under Free Content promo bands.

**The hero's red gradient was removed in the same pass** (the direct ask). `.hero` was a `linear-gradient(180deg, var(--primary-100), transparent)` — a brand-red fade that put the loudest colour in the product behind its quietest content, and read as a coloured band the eye had to clear before the page began. It sits on `var(--card)` now, with the existing bottom rule doing the separating; the `[data-theme="dark"] .hero` red-tint override went with it. Two hatched holes are local to this page: **who pays** on the catalogue (sponsored access is meant to be invisible to the learner and central to the admin, so neither showing nor hiding the price is right until the entitlement rule exists) and **multi-state hours** on Records.

### The learner walk-through

**The full walk-through is a SECOND page under the same tile** — [xcel-lms-walkthrough.html](public/prototypes/xcel-lms-walkthrough.html), served as `/prototypes/xcel-lms-walkthrough.html`, linked from the wireframes masthead. Where the four stages above are separate mini-prototypes that each start cold, this is **one learner, one unbroken arc with state carried throughout**: invite → magic link → silent account creation → set a target date → plan built backwards from it → study loop (home → hand-over wait → Compass frame → exit with the progress lag) → practice exam → exam simulation + its interruption → readiness → book the licensing exam → sit → fail → retake → pass → records. **The carried state is the point, and it is made visible** by a "What the product knows" inspector beside the phone (account · target date · plan days · chapters · practice · simulation score · readiness · booking · attempts · licence · today's date), so a reviewer can see that the date they typed built the plan and the chapters they finished moved the percentage. Nothing is hardcoded downstream: `planDays` derives from the chosen target, progress from `done/TOTAL`, the practice task appears at 4 chapters, the simulation unlocks at 8, booking unlocks at 12, and a failed attempt re-anchors the plan while keeping attempt 1 in the record. A **journey rail** shows the nine chapters and allows jumping BACK only (jumping forward would skip the state that makes the later screens true). Three surfaces carry the brief's own answers: the **readiness** screen states its basis, gives a frequency rather than a probability, and names what would move it ("an estimate, not a prediction · about 7 in 10 passed first time") — the answer to flow 04's credibility problem; the **fail** screen is warning-family with no confirm dialog and states that coursework and hours are unaffected; and **Compass-unreachable** during the simulation renders the hatched hole rather than an optimistic recovery. Two more hatched holes live inline where they bite — retake cooling-off (on the retake screen) and multi-state licensure (on records). **Guarded by [smoke-walkthrough.mjs](smoke/smoke-walkthrough.mjs)** — a jsdom walk of the ENTIRE arc, 48 assertions, which asserts the state actually carries (the typed email reaches the wait screen, the typed target date reaches the plan, the offline-held answers reach the result screen, both attempts reach the records screen) rather than only that screens render. Run both smoke tests and re-copy BOTH files to `public/` after any edit. **ONE row, not two:** the walk-through and the companion spec are reachable from the wireframes masthead, not as their own tiles — a second row into the same body of work is what got `recommended-card-ab-demo` and the four testing tiles archived. That spec is served as **raw `.md`** (`/prototypes/xcel-lms-exam-task-type-spec.md`, browsers render it as plain text) so there is ONE copy; an HTML twin would drift from [public/prototypes/xcel-lms-exam-task-type-spec.md](public/prototypes/xcel-lms-exam-task-type-spec.md) the moment either changed. **The spec's load-bearing finding:** `StudyTaskKind`'s existing `'exam'` means the *practice* exam (course-linked, with an `href` into the LMS), so the external licensing exam needs its own `'licensing-exam'` key — overloading the existing one still typechecks and would have the calendar silently treat a real licensing exam as a practice one. Admin flows 01–06 are **not** covered in this pass. Since the tile is `explore` + `externalUrl`, the add-a-feature checklist's brands / member+non-member / feature-flag requirements don't apply — there is no gateway and no in-app route.

## The Admin Tool (`public/prototypes/xcel-admin-tool.html`)

The XCEL admin platform, **forked from PartnerHub** (`partnerhub-designs/index.html`)
rather than rebuilt, so All Learners, the side-panel shell, the kebab, filters
and pagination arrived working. ~910KB, one file, no build step — edit it
directly. Answers admin flows 03 · 04 · 06 of the FinServ *Learner and Admin
Wireframe Brief*; the companion analysis is `xcel-lms-admin.html` in the same
folder, and it is the document this build argues with.

### What the fork turned out to be — three corrections worth not rediscovering

1. **The five status "badges" are COUNTS, not badges.** PartnerHub's Compliant /
   On Track / At Risk / Overdue / Not Started are five *numeric columns* of
   programs per state, so a learner at 2 compliant + 1 overdue reads as neither.
   There is no per-learner answer to "how bad" in the source. That is why the
   deadline-derived **Risk** column exists — it is not decoration on the badges,
   it is what makes flow 06 answerable.
2. **There was no consumer-membership model to strip.** Zero membership /
   entitlement / tier / storefront code in this file; that lives in the
   PartnerHub *Angular* product. The planned strip step became an addition
   instead (Invites, Seats).
3. **Bulk selection did not exist.** Every checkbox in the source belongs to the
   filter panel. Selection, the bulk bar and the reminder throttle are all
   net-new here.

### Shape

- **One roster, three presets** — `AL_VIEWS` (`#stuck` / `#follow-up` /
  `#seats`). Each is a scope + a sort + a default action over the *same* rows.
  Only Seats excludes rows, and only because a seat is meaningless for a
  self-paid learner. Nothing is filtered out of existence between them.
- **Scope is a fact, not a label.** `AL_ORG` is the hierarchy as flat parent
  links; `ADMIN_ROOTS` holds **two** roots (a region plus an unrelated agency) so
  the multi-root case cannot be forgotten. `inScope()` runs FIRST in
  `getFiltered`, and `isInAdminScope()` re-checks independently — a bad scope
  value cannot leak rows.
- **`agencyId` and `payerId` are different facts.** Where a learner sits vs. who
  bought their seat. The fixtures were conflating them (`paidBy: 'Self'` left a
  learner in no agency at all). A region buying seats for an agency's recruits is
  representable, and the panel says "seat bought above them".
- **Invites (flow 03)** — compose → preview → send. The send creates the cohort
  *and* real learner rows, then navigates to the roster filtered to that intake.
  Frame 4 is a navigation, not a screen; building it as its own page is the
  mistake the wireframes argue against.
- **Selection** is keyed by **email** (names collide, indexes move under every
  sort), pruned to the filtered set each render, and cleared when the acting root
  changes — that is switching book, not narrowing one.
- **Blank ≠ zero.** A self-paid learner's Seat cell is *empty*, not "n/a" or a
  dash. A placeholder in an inapplicable column reads as a value we failed to
  fetch. Reuse that convention; it will come up again.

### The invented rules — replace, don't re-derive

Each is one constant, named loudly, with an owner in the comment:

| Constant | Rule | Owner |
|---|---|---|
| `IDLE_RULE_INVENTED` | claimed · 14 days idle · under 10% | FinServ product |
| `RISK_RULE_INVENTED` | under 30d & <60%, or under 60d & <25% | FinServ product |
| `REMIND_COOLDOWN_HOURS` | 24h skip window | FinServ product |

`RISK_RULE_INVENTED` carries a second problem the brief names: it is
**deterministic** (deadline × percent done) while Compass's readiness is
**probabilistic** low/med/high. If Compass owns readiness, this column is either
a second disagreeing opinion on the same learner or their number wearing our
badge. Do not "improve" the thresholds without settling that first.

### Next, in order

1. **Spend roll-up** above the table — flow 04's other half. Spend is a total,
   not a column, which is what keeps utilisation off the learner's row.
2. **Organisation drill (flow 01)** — the breadcrumb. Closer than it looks:
   `AL_ORG` is in, and the fork already ships a Groups table *and* a Group
   Summary side panel, i.e. a non-person entity with its own icon avatar and
   panel. Needs a naming decision (Groups or Agencies) and the drill, not a new
   table. It also answers the known gap that under "All my agencies" the roster
   does not say which agency a row sits in — **do not fix that with a 16th
   column.** You drill; you do not add a column.
3. **Dark mode + the contrast sweep.** The brief's "both themes · WCAG in Phase
   1" is marked *Built* in the wireframes inventory — but built in the learner
   dashboard. This fork is light-only, so forking un-met a Phase 1 requirement.
   Blocked on the item below.
4. **The 761-literal hex sweep.** A `:root` token map already exists in the fork
   and 761 hex literals (107 unique) bypass it. Deliberately skipped so far: it
   changes nothing visually and touches nearly every styled line, which would
   bury the feature diffs. Its own commit — and a prerequisite for a theme.

### Undesigned, and known to be

Recipient paste/upload (parsing, per-row errors, de-dup against learners already
in the subtree — the composer says so on screen). Price inheritance: the origin
line is a **fixture, not a lookup**, labelled as such in both the panel and the
composer. Empty states beyond the two authored. Spanish string expansion, which
this table is the product's worst case for — fixed flex widths, stacked two-line
headers, and badge labels that grow 30–40%. And the preset strip is a
`role="tablist"` whose table is not wired as a tabpanel: finish the pattern or
drop to buttons with a live region.

### Verifying it

There is no build step for the prototype, so the guardrails are: `npx vitest run`
for the gateway, and for the HTML itself `node --check` over each inline
`<script>` block plus a header/row cell-parity check (the header and the row
template are separate flex rows — they must list the same `al-col-*` classes in
the same order, currently 16). A scope-placement audit is worth repeating after
any large edit: this file has **five** `getFiltered` functions and two
`perPageSel` refs in different IIFEs, and a patch anchored on the wrong one lands
in the bookmarks closure and throws on load. That has already happened once.

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

## Conventions

- Reference tokens via CSS variables — never raw hex / px / font-family.
- Use the icon registry at `@/icons`. Don't install `lucide-react` or
  `@fortawesome/*`.
- Segmented status filters use the shared [`PillTabs`](src/components/ui/PillTabs.tsx),
  and **no per-pill counts** — show the total beside the strip.
- The dark `PrototypeBar` is theme-stable: it must look identical in light and
  dark, which is why `tokens.css` re-pins `neutral-800` / `neutral-50` inside
  `[data-theme='dark'] .cre-prototype-bar`. Keep the bar's colours on those two
  tokens or that exemption stops working.

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

The six prototype pages are covered separately by the five jsdom suites in
[`smoke/`](smoke/) — **`npm run smoke`**, 252 assertions. They are plain node
scripts, not vitest, so `npm test` does NOT run them; run both.

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
