# The standalone prototypes

The hand-authored HTML explorations in `public/prototypes/` — six with a row
in the project list, five without — and what each one argues.

> Moved out of `CLAUDE.md` on 2026-09-21, verbatim. The root file is the map;
> this is one of the five surfaces it points at. Cross-references to "CLAUDE.md"
> in older code comments mean this material.

---

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

### The brief-vs-existing extract — a page with no row

[xcel-lms-brief-vs-existing.html](public/prototypes/xcel-lms-brief-vs-existing.html)
(added 2026-09-03) puts **all four** brief/inventory blocks in one document — the
learner ask, the learner inventory, the admin ask, the admin inventory — for
reading the scope in one pass without the wireframes in between. It is
**deliberately not a seventh `PROTOTYPE_FEATURES` row**: it is reachable from the
masthead of both wireframes pages, the same way the walk-through and the exam
spec are, because a second row into the same body of work is what got
`recommended-card-ab-demo` and the four testing tiles archived. So the row count
is still six and `smoke-tiles.mjs` is unchanged.

**Sections 01–04 are lifted verbatim** from `xcel-lms-wireframes.html` §01–02 and
`xcel-lms-admin.html` §01 + §07. That is a copy, and therefore the one thing here
that can rot: **edit the companions first, then re-sync this page.** It was
extracted mechanically rather than retyped, and no generator was kept — keeping
one would rebuild exactly the source/served split the section below records
killing. Three anchors were rewritten on the way in (`#s-arrival` /
`#s-interrupt` / `#s-exam` → absolute `/prototypes/xcel-lms-wireframes.html#…`),
since in-page hashes pointing at sections this document does not contain would
silently go nowhere.

**Its counts are derived from the tables on load, not authored** — `covOf()` reads
the `p-have` / `p-part` / `p-none` class already on each row's pill, so coverage
is never written twice and editing a row moves the tally. That is the direct
answer to the authored-count rot this file warns about under `RESEARCH_DECISIONS`.
Currently **27 rows — 13 Built · 5 Partial · 9 None** (learner 19, admin 8). Note
the admin inventory's own two labels, *Most of it* and *The roster half*, sit at
the Built and Partial levels respectively and the filter classes them that way;
add a sixth pill class and it will be counted as none of them.

### The Admin & Learner build plan — the second page with no row

[xcel-finserv-build-plan.html](public/prototypes/xcel-finserv-build-plan.html)
(added 2026-09-03) is the build tracker for the two **surface domains** the FinServ
strategy documents name — Learner Experience and Admin & Analytics. It answers a
different question from `xcel-lms-brief-vs-existing.html`: that page asks *what did
the brief ask for and does it exist*, this one asks *what has to be built, is it
built somewhere already, and what blocks it*. **66 rows** in 12 groups.

Built from **three** sources, not one — the Learner and Admin Wireframe Brief plus
two documents that page predates: the **FinServ Domain Build Plan** and the
**FinServ Platform Strategy Packet (domain view)**. All three live behind Cloudflare
Access and cannot be fetched by any tool; they were read from locally saved HTML.

**Like brief-vs-existing, it is deliberately not a `PROTOTYPE_FEATURES` row** — it
is reachable from the masthead of all five companion prototypes, for the same
reason (a second row into the same body of work is what got
`recommended-card-ab-demo` and the four testing tiles archived). Row count is still
six and `smoke-tiles.mjs` is unchanged.

**The one modelling decision that governs the whole page:** the status pill answers
*is this built in product code somewhere already* — **not** whether we have designed
it. Design coverage is the **Example** column: a link means there is an XCEL
prototype to open, an em dash means it is undrawn. Keeping those apart is the point.
The most dangerous rows are the ones thoroughly designed and built nowhere — the
learner skeleton slice is `None` with the most complete prototype we own — and a
single blended score would hide them. The footer states this; there is no legend
(the "How to read this" section was removed on request).

**Everything renders from one `ITEMS` array** — table, filter counts and detail
sheets all read it, so a status cannot disagree with the tally reporting it. That is
the same authored-count rot this file warns about under `RESEARCH_DECISIONS`, closed
by construction rather than by discipline. **Notes are authored in that array**
(`notes: [{d, t}]`) — there is no editing UI and no persistence layer, which was a
deliberate choice over the Netlify-Blobs pattern `qa-notes.ts` uses. Appending a
note is a file edit.

**Two hazards specific to this file.** Rows are object literals, so a **duplicate
key is legal JavaScript and silently drops data** — the last one wins. That has
already happened once (a second `notes:` added to a row that had one). Audit by
splitting the array on `{ ref:` and counting keys per row; `node --check` will not
catch it. And a fifth pill class would need `ST` and the chip order updated together
or it renders unstyled and uncounted.

**Currently 11 Built · 23 Partial · 19 None · 8 Needs info**, plus **5 Compass rows
parked** at Jillienne's instruction — listed but unscored and excluded from the
counts, so the tally is not flattered by work we are not doing. 22 rows carry open
questions, flagged by an amber dot on the Details button.

**Where the Common LMS comes in.** A pass over
`jill-dashboard-ux-designs` (2026-09-03) moved several rows, and the headline is that
**Track B is not from zero**: that project already ships **26 shared UI primitives**
and the shell as separable components (`PlatformShell`, `PlatformSideNav`,
`AppLayout`, `Header`). The build plan's "assume no code exists" premise is wrong
about the design system. Two traps found there worth not repeating:
`/account/notifications`, `/account/licenses` and `/account/transcripts` all exist as
**routes that render a "not built yet" placeholder** — route names in that project
are not evidence of a design; and its certificate model carries a real three-way
`CertReporting` union (reported / pending-roster / non-reporting) which is the
concrete precedent for the admin provenance work.

**It has no test coverage.** `smoke-tiles.mjs` only checks `PROTOTYPE_FEATURES`
rows, and this page has none, so nothing verifies its 66 rows, that its links
resolve, or that a pill matches its count. That is a real gap given the
duplicate-key hazard above.

### The study plan — the third page with no row

[xcel-study-plan.html](public/prototypes/xcel-study-plan.html) (added 2026-09-16)
explores goal-setting and the states after it, from a reference concept Jillienne
brought in — a "Weekly Study Goal" card offering Aggressive / Recommended /
Relaxed in *credit hours per week*, plus Custom and a small My Date field. It is
**not a `PROTOTYPE_FEATURES` row**, same reasoning as the two pages above; it is
reachable from the masthead of every sibling. Row count is still six.

**The inversion is the whole argument.** The reference asks the learner to set a
**pace** and derives a **date**. Both of those are backwards: the pace is the
number nobody can judge (is 5 credit hours a week a lot?), and the date is the one
the learner already owns, from outside the product — a start date at an agency, an
exam window, a job. So this page splits them into two objects and states who owns
each: **the Goal is one date, learner-owned, changed only explicitly; the Plan is
a pace, system-owned, re-derived silently whenever anything moves.** Everything
downstream falls out of that. In particular the "behind" states become answerable,
because you can ask *which of the two moves* instead of quietly sliding both.

**Two dates, two colours, and this is where the desktop palette split earns its
keep.** Coursework-complete is `--primary-*` (ours, data, we control it); the
state-exam sit date is `--brand-*`, red's single semantic everywhere else in this
product. A picker that returns one date has already lost the distinction. A smoke
assertion counts inline `--brand-500` uses in the picker and fails if red starts
carrying a second job.

**The pre-plan window is triggered by earned progress, never by elapsed days.**
Four stages — Unplanned (no goal surface at all) · The offer (one dismissible
inline line) · The card (persistent, still dismissible) · Load-bearing (the only
non-dismissible one, and only because booking a PSI seat needs a date). The move
that makes it work is stage 1: the first offer is **pre-filled from the learner's
own observed rate**, not a house default, which is what makes the word
"recommended" mean anything. The rate axis in the demo bar proves it — flipping
Fast to Slow moves the quoted date by more than two weeks, and a test asserts that
it does.

**The finding that contradicted the brief.** Jillienne framed this as a 30-day
scope. It is — but a 40-hour course finished in 30 days needs **the top preset,
not the middle one**: roughly 105 minutes a night, five nights a week at a typical
rate, and past the strain threshold at a slow one. So *30 days is the aggressive
end of this course, not its default*, and any copy implying a month is the normal
path sets the drift states up to fire for nearly everybody. The page computes that
sentence rather than asserting it.

**The tolerance is the design.** Of the five drift states, the load-bearing one is
*slightly behind*, where the correct behaviour is to show the learner **nothing**.
A plan that raises its voice for one missed Tuesday teaches them to discount it,
and by the time it has something real to say they have stopped reading.
`DRIFT_TOLERANCE_INVENTED` exists so the first alert anyone sees is worth acting
on. The one above it — *date at risk* — prices **both** options and pre-selects
neither, because a product that silently slides its own finish line is why nobody
believes completion estimates.

**Invented rules, same convention as the admin tool:** `NUDGE_AFTER_INVENTED` ·
`ESCALATE_AT_INVENTED` · `EXAM_BUFFER_INVENTED` · `DRIFT_TOLERANCE_INVENTED` ·
`DRIFT_ALERT_INVENTED` · `STRAIN_MINS_INVENTED` · `CEILING_MINS_INVENTED` ·
`AHEAD_OFFER_INVENTED`. Each is one named constant with an owner, rendered into
section 06 of the page **from the same array the logic reads**, so the
documentation cannot disagree with the behaviour.

**Nothing on the page is an authored date.** Every figure derives from the two
demo axes and those constants — the same discipline the build plan applies to its
counts, and the reason the suite can assert relationships (sit date = coursework
date + buffer, moved date is later, pulled-in date is earlier) rather than string
matches. Guarded by [smoke-study-plan.mjs](smoke/smoke-study-plan.mjs), **58
assertions**, which walks all four stages and drives the real date input through
comfortable / strained / impossible / inside-the-buffer.

**Open, and marked so on the page:** whose deadline wins when an agency sets one
and the learner sets another (the admin roster's Risk column would then be
measuring against a date the learner never agreed to); whether the plan cares
*which* evenings or only how many minutes; whether a sit date can honestly be
quoted at all before PSI availability is known; and the fact that stage 2 wants
the dashboard's second slot — the slot the recommended band occupies in classic
and editorial deletes outright. Those two cannot both be the second thing.

### The collapsible rail — the fourth page with no row

[xcel-nav-collapse.html](public/prototypes/xcel-nav-collapse.html) (added
2026-09-16) explores collapsing the learner desktop rail to icons. It is **not a
`PROTOTYPE_FEATURES` row**, same reasoning as the three pages above; it is
reachable from the masthead of every sibling. Row count is still six.

**Scope is the learner rail only** (`xcel-lms-desktop.html`'s `.rail`), and the
admin tool's left-nav is explicitly out — it is deeper and has a second level, so
the flyout question resolves differently there. The exploration is deliberately
core-only: collapsed vs. expanded and the tooltip. Auto-collapse, breakpoints and
per-user persistence are section 05 holes, not built.

**Three treatments, one rail.** A · icons only (64px) · B · icons + micro-label
(88px, **Jillienne's pick 2026-09-17 and now the page default**) · C · icons +
hover flyout (64px). They are not three visual styles but
three answers to *where the words live now* — a hover, a shortened on-screen copy,
or a temporary panel. The demo axis re-renders the same seven sections through all
three, so they are judged against the same nav rather than three sketches.

**The load-bearing claim, and the reason the suite is weighted the way it is:
the accessible name must survive collapse, and must not come from the tooltip.**
Every label element stays in the DOM in every state — collapsed it moves to a
clip-path box rather than being deleted. The tooltip attaches with
`aria-describedby`, never `aria-labelledby`, and one assertion **deletes the
tooltip node outright** and requires every button to still be named. Wiring the
name through `title` or through the tooltip is the defect the page exists to rule
out; it strands anyone not using a pointer.

**Two real defects the suite caught while it was being written**, both worth not
repeating. (1) Concept B rendered the micro-label *and* the full label into the
accessibility tree, naming the button "Dash Dashboard" — the short label is now
`aria-hidden` and the full one supplies the name. (2) **WCAG 2.5.3 Label in
Name**: the Explore section was "Recommended" with a micro-label of "For you",
which is a button a voice-control user cannot ask for out loud. The **full label**
became *Recommended for you* rather than inventing a worse short one. An assertion
now checks every pair, so the next micro-label that is not a substring of its own
full label fails a test.

**Three more things that only bite collapsed.** The selected-state indicator stops
being a 3px left border (an edge stripe beside a centred glyph reads as a
rendering artefact) and becomes a filled pill on the glyph — still on the
palette-scoped light `--rail-accent`, because collapsing makes that indicator the
*only* thing saying where you are. The group captions go, replaced by a rule, but
each group keeps its `aria-label`. And the "Behind" badge becomes a dot, which is
colour alone — so **the word moves into the accessible name**; losing the pill is
fine, losing the word is the bug.

**Invented rules, same convention:** `TIP_HOVER_DELAY` (400ms) ·
`TIP_FOCUS_DELAY` (**0** — there is no such thing as an accidental Tab) ·
`TIP_CLOSE_GRACE` (120ms, so the tooltip is hoverable per WCAG 1.4.13) ·
`FLYOUT_OPEN_DELAY` (220ms) · `SHEET_BELOW_PX` (900 — under it the rail does not
collapse to icons at all, because a device with no hover cannot reach a tooltip).
Section 04 renders them from the same array the logic reads.

**Where the collapse control sits is a second axis, and the answer is the
bottom** — narrowly, and for one reason. Top is Slack/Notion, bottom is
Linear/Figma/Jira, and three of the four usual arguments do not decide it here:
tab order costs the top one stop (small), the below-the-fold case against the
bottom does not apply to a seven-item nav (it would to the admin left-nav, which
is why this page does not speak for that one), and the pointer-distance point for
the top is real but cheap, because collapsing is a weekly action. **The decider is
the mobile sheet.** Under `SHEET_BELOW_PX` the rail becomes a sheet needing a
*menu* button, whose conventional home is the top left — so a top-placed collapse
control makes the same pixel two different controls at two widths, one resizing a
persistent rail and one opening an overlay. The bottom keeps them apart by
construction. Taken either way: collapsed, the profile block leaves dead space
beside a lone avatar, which still wants solving.

**The toggle moves in the DOM, not in CSS**, and the suite asserts that rather
than appearance — because a CSS-only move (`order`, absolute positioning) would
leave the tab order unchanged and silently make the whole argument false. The
same rule is why the top placement is not faked by rendering it last and
positioning it first: that sends focus backwards up the rail (WCAG 2.4.3). **A
tab-order readout under the stage is read off `#railNav` on every render**, so it
cannot describe an order the rail does not have; a test requires it to change
when the axis moves.

Guarded by [smoke-nav-collapse.mjs](smoke/smoke-nav-collapse.mjs), **75
assertions**. Note the suite passes `url:` to JSDOM — without an origin every
`localStorage` access throws `SecurityError`, and since the page wraps its own
reads in try/catch (so it survives a private window) a suite missing that would
silently test a page whose persistence never ran. The hover assertions await the
real delay; **the focus assertions deliberately await nothing**, because that is
the claim.

### Study Pace & Readiness — the fifth page with no row

[xcel-study-pace-readiness.html](public/prototypes/xcel-study-pace-readiness.html)
(added 2026-09-17) draws the two empty cards in the dashboard's second row — the
"Study Pace" and "Readiness" placeholders in the Atlas-style mock — in every state
each can reach. It is **not a `PROTOTYPE_FEATURES` row**, same reasoning as the
four pages above; it is reachable from the masthead of every sibling except the
build plan (which carries no sibling links at all). Row count is still six.

**The two widgets ask different questions and must not blur.** Study Pace asks
*will the coursework finish before the exam date* and is about **time**; Readiness
asks *of what you have covered, what has not held up* and is about **knowledge**.
Decisions made with Jillienne on 2026-09-17, all of which the page encodes:

- **Pace is measured from lessons completed per week, not time on task.** An open
  tab is not studying. Minutes appear only as the *translation* of a required or
  observed pace into an evening (`MINS_PER_LESSON_INVENTED` ×
  `NIGHTS_PER_WEEK_INVENTED`), never as the thing measured. One ratio —
  observed ÷ required lessons/week — decides the state.
- **Behind recommends more time, once, and nothing else.** No "move your date"
  fork on this widget (the study-plan page prices both; this one deliberately
  does not, on the reasoning that a booked PSI date is fixed). The one exception
  is **Not enough time**: past `CEILING_MINS_INVENTED` the honest sentence has to
  mention the date, and the button goes to a person.
- **Slightly behind reads as On track.** Between `PACE_TOLERANCE_INVENTED` and 1.0
  the copy is *identical* to On track and a test asserts that. The coursework
  buffer (`COURSE_BUFFER_INVENTED`) before the exam is what makes the silence
  honest. Note the mock's own state (26/42, 27 days, 5 lessons/wk) sits **in that
  band** at ratio 0.98 — the ladder's On-track exemplar was moved to 5.6/wk so the
  two rows demonstrate different ratios.
- **No percentages, anywhere on either widget.** The quiz score exists
  (`QUIZ_SHAKY_INVENTED`, 70%) and sets the threshold; it is never displayed. A
  test sweeps all 120 axis combinations and fails on a single `%`.
- **Readiness lists topics and has no verdict before the practice exam.** The word
  "ready" is not allowed until the practice exam (a whole-outline instrument) has
  been taken — coursework complete with every quiz clean still reads *"Take the
  practice exam to see whether you're ready."* In practice-exam mode the list can
  name a chapter not yet reached, marked *Not covered yet* with a **Preview** link
  rather than Review. Before it, the eyebrow scopes the claim: *Readiness · what
  you've covered*.
- **Three treatments, side by side, undecided.** A · chapter titles (every
  line resumes a lesson) · B · state-exam outline domains (the exam's language, and
  what the practice exam already reports in) · **C · a scored gauge** (added the
  same day at Jillienne's request, from a "Readiness Score · 84 · 70 to pass"
  reference). Chapters 1 and 12 both feed *Insurance Regulation* so B dedupes and
  says *Two chapters feed this*; a test asserts B is never longer than A. **C's
  score is quiz + practice-exam results only — completion is deliberately not an
  ingredient**, because the reference blends it in and that makes a progress
  number wear a readiness badge (a learner at 40% with perfect quizzes would score
  badly for a reason unrelated to knowledge). Its per-chapter scores are
  `FIXTURE_SCORES_INVENTED` (86 strong · 56 shaky) since real scores are not in
  the fixtures; the pass mark is `PASS_MARK_INVENTED` (70). The pill (*Above / Below
  the pass mark*) is asserted to agree with the number in every state, and C is
  asserted never to say "ready" or show a `%`.

**Red is spent on exactly one thing:** the state-exam tick on the pace timeline.
Coursework-due (dashed ring) and projected-finish (filled dot) are both
`--primary-*`. A test greps the stylesheet for `.tl` rules using `--brand-500`
and requires both to be `.exam`.

**This is not Compass readiness**, and the page says so in §05. Compass computes a
probabilistic low/med/high we do not own; this is deterministic and ours (*what
you've shown us*, not *what we predict*). If both ship on this dashboard the second
row has two cards answering "am I ready" by different methods — the same collision
the admin roster's Risk column has. Listed as a hole, unresolved.

**§02 — the recommendation, added 2026-09-21.** The moment *before* Study Pace has
anything to measure. Jillienne's brief: a small widget that recommends a pace from
the time the course is available (30 days), **auto-set**, with an **Adjust** CTA.
Two references were on the table — a "What is your study pace?" chooser (Thorough /
Average / Quick) and a Goal Tracker's Aggressive / Recommended / Relaxed hours-per-week
presets — and both open by *asking*. This widget *tells*: the access window is a date
the learner already bought, not a number they have to judge, which is what
reconciles a day-one recommendation with the study-plan page's argument against
day-zero questions.

- **Derived from `ACCESS_DAYS_CONFIRMED` (30 — the one figure here that is not
  invented; it is on the XCEL product page) minus `ACCESS_BUFFER_INVENTED` (5).**
  Recommended nights = the fewest of 3/4/5/6 that keep an evening under
  `STRAIN_MINS_INVENTED` (120). Day one lands at ~1½ hours a night, four nights —
  heavy, and the card says so rather than hiding it; the study-plan page found the
  same thing (30 days is this course's aggressive end).
- **Adjust changes three things and only ever in one direction:** nights a week
  (segmented, the recommendation marked with a dot), study style (Thorough / Average
  / Quick as `STYLE_FACTORS_INVENTED` 1.3 / 1 / 0.75 × minutes-per-lesson — kept from
  the reference because it changes the honest cost, but demoted from a gate to an
  adjustment), and a **Finish-by** date whose `max` is the day before access ends. A
  later date is clamped, not accepted. The pill flips from *Recommended* to *Your
  pace* the moment anything is touched.
- **There is no Relaxed, and that is the finding.** Inside a fixed window the slowest
  pace that still finishes *is* the recommendation; anything gentler is an extension,
  which is a purchase, not a pace. A test asserts the word never appears.
- **A small in-section axis (Day 1 · Day 10 · Day 22)** shows it re-deriving: day 10
  moves to five nights to stay under strain; day 22 (22 lessons, 3 days) is past the
  ceiling and renders **Won't fit → Extend access** with no pace quoted, because no
  number is honest there. What an extension *is* — and whether an agency-sponsored
  learner can buy one — is a new hole.
- **The access-end tick on its timeline is ink, not red.** Red stays the exam's.
- `hm()` was rewritten for it to quarter-hour precision: the old hour rounding made
  68 and 89 minutes both read "1 hour", i.e. two different plans as one.

**Invented rules, same convention:** `COURSE_BUFFER_INVENTED` (5d) ·
`PACE_WINDOW_INVENTED` (14d) · `PACE_MIN_LESSONS_INVENTED` (3) ·
`PACE_TOLERANCE_INVENTED` (0.85) · `PACE_AHEAD_INVENTED` (1.3) ·
`MINS_PER_LESSON_INVENTED` (35) · `NIGHTS_PER_WEEK_INVENTED` (4) ·
`CEILING_MINS_INVENTED` (210) · `QUIZ_SHAKY_INVENTED` (70) ·
`PRACTICE_UNLOCK_INVENTED` (0.5) · `PASS_MARK_INVENTED` (70) ·
`FIXTURE_SCORES_INVENTED` (86 · 56) · `ACCESS_DAYS_CONFIRMED` (30) ·
`ACCESS_BUFFER_INVENTED` (5d) · `STRAIN_MINS_INVENTED` (120) ·
`STYLE_FACTORS_INVENTED` (1.3 · 1 · 0.75). All in one `RULES` array with an owner each,
read via `R(key)` and rendered into §07 from the same array.

Guarded by [smoke-pace-readiness.mjs](smoke/smoke-pace-readiness.mjs), **56
assertions**, which sweeps every combination of the four demo axes and asserts
relationships (Behind's head sentence agrees with where the projection lands; every
state is reachable; quiz mode never lists an uncovered chapter) rather than strings.

### Pace presets — the sixth page with no row

[xcel-pace-presets.html](public/prototypes/xcel-pace-presets.html) (added
2026-09-21) takes the **other reading** of the access window that §02 of the
pace-and-readiness page refused: aim at *all* 30 days, and the Goal Tracker's
Aggressive / Recommended / Relaxed presets become **three dates the learner already
owns** — Relaxed is the day before access ends, Recommended is that minus
`ACCESS_BUFFER_INVENTED`, Focused is the storefront's own claim ("pass in less than
2 weeks", `FOCUSED_DAYS_CONFIRMED` = 14). Nobody chooses a number; they choose a
date and the pace derives. Not a `PROTOTYPE_FEATURES` row; masthead-linked from
every sibling and from §02 of the pace-and-readiness page. Row count is still six.

**Three demo axes: Course (12 · 20 · 42 lessons) · How they study (Thorough /
Average / Quick) · Day of access (1 · 8 · 15).** Course is the point of the page.

- **§01 is one derivation table** every widget reads. **All three presets share ONE
  nights count**, derived from Recommended (the fewest of 3/4/5/6 that keep its
  evening under `STRAIN_MINS_INVENTED`). That rule was added after the first render:
  choosing nights per-preset made a 3-night Relaxed (2 hours) read *heavier per
  evening* than a 4-night Recommended (1¾), and the presets stopped being
  comparable. A test asserts the shared count and that per-night cost rises
  Relaxed → Recommended → Focused.
- **Focused is dropped when it is no longer faster than Recommended** (Day 15: two
  weeks out lands after the buffered finish). A preset that is not faster than the
  one beside it is a label with nothing behind it; the derivation table marks it
  *Dropped* and every variant loses the option.
- **§02 — the card, and the sheet behind Adjust.** Jillienne picked variant A on
  2026-09-21 and asked that the presets and nights come OFF the card: **the card
  operates nothing** — two buttons, Start studying and Adjust, and a test counts
  them. Everything adjustable is in one right-hand sheet (`role="dialog"`,
  `aria-modal`, closed by scrim / Esc / Save) in four groups:
  **Aim** (the three presets as radio rows) · **How many days a week** (3/4/5/6, the
  derived one marked *suggested*) · **Exam date** (optional) · **Create a study
  plan** (a switch). The card's pill flips *Recommended → Relaxed/Focused* and its
  eyebrow *recommended → yours* the moment the learner chooses, and the "set from
  your 30-day access" sentence is dropped because it no longer is.
- **TWO ceilings, and the sheet says which one binds.** The access window and the
  exam date are different limits; coursework must finish `EXAM_BUFFER_INVENTED`
  (7 — deliberately the same constant the study-plan page uses) before a sit date,
  so **whichever comes first governs**, and a `.bindnote` states it in words:
  *your exam date is the one doing the work* vs *your access is still the one doing
  the work*. An exam booked inside the window pulls every preset earlier; one past
  it leaves the window binding and only stretches the timeline. The exam tick on
  that timeline is the one place red is spent.
- **The weekday picker only exists once the calendar is switched on.** Days-a-week
  is all the pace needs, so that is all the sheet asks — until *Create a study plan*
  reveals weekday toggles, a start time, and a preview of the first four dated
  sessions. **Ticking days then becomes authoritative and re-prices the evening**
  rather than quietly disagreeing with the count; a test asserts the card behind
  follows. The plan writes into the product's own **Study Plan** page (the rail
  section that already exists), not an `.ics` download.
- **§03 keeps B, C and D as candidates for the sheet's Aim group** rather than
  deleting them: B · three cards (costs more vertical space than the sheet has once
  the other groups are under it — which is why the rows version won) · C · the
  finish-date slider (still the best answer for a date the presets don't offer) ·
  D · the week strip (this one *survived* — the weekday picker under Create a study
  plan is D made operable).
- **§03 — the 3×3 grid, and the finding: "Relaxed" earns its name on the short
  courses only.** At Average / Day 1, Relaxed costs 34 min on 12 lessons, 56 min on
  20, 1½ hours on 42. So the label is a property of *course length*, not of the
  preset, and the page proposes it be **conditional**: keep the warm word only when
  the evening is under `EASY_MINS_INVENTED` (45), otherwise call it **Full window**.
  The grid labels do exactly that and a test asserts 12 earns it and 42 does not.
- **Focused on 42 lessons at Average is flagged heavy** — the two-week marketing
  claim priced honestly. A hole notes either the claim assumes a shorter course or an
  evening this page would flag.
- **The study style changes the *week*, not necessarily the evening**: Quick and
  Thorough can land on the same 1¾-hour figure at 3 vs 5 nights because the nights
  count adapts. The test compares nights × minutes, not minutes.
- **Access end is ink, never red.** Red stays the exam's; a test greps the CSS.

Rules (`RULES`, rendered into §04): `ACCESS_DAYS_CONFIRMED` (30) ·
`FOCUSED_DAYS_CONFIRMED` (14) · `ACCESS_BUFFER_INVENTED` (5) ·
`MINS_PER_LESSON_INVENTED` (35) · `STYLE_FACTORS_INVENTED` (1.3 · 1 · 0.75) ·
`STRAIN_MINS_INVENTED` (120) · `CEILING_MINS_INVENTED` (210) · `EASY_MINS_INVENTED`
(45) · `SESSION_START_INVENTED` (19:00) · `EXAM_BUFFER_INVENTED` (7). Guarded by
[smoke-pace-presets.mjs](smoke/smoke-pace-presets.mjs), **66 assertions**.

**One class collision worth not repeating:** the sheet's preset rows were first
called `.aim`, which already existed on this page as the grid header's aim label —
so `querySelectorAll('.aim')` returned six elements, three of them `<span>`s with no
`.as` child. They are `.aimrow` now. A page this size needs its new class names
grepped before they are used.

**Three new holes, all about the calendar:** what happens to already-written
sessions when the pace later changes (rewrite, append, or let them disagree);
whether a typed, unverified exam date should outrank one booked through the
walk-through's own flow — the admin roster's Risk column would then be measuring
against a date the learner may have invented; and what the three presets mean on a
CE course with **no access window at all**, where Relaxed has nothing to aim at.

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
`../public/prototypes/` rather than a source next door. A sixth,
`smoke-study-plan.mjs`, was added 2026-09-16 with the study-plan page, and a
seventh, `smoke-nav-collapse.mjs`, with the collapsible-rail page the same day, and an
eighth, `smoke-pace-readiness.mjs`, on 2026-09-17, and a ninth, `smoke-pace-presets.mjs`,
on 2026-09-21. Run them
with **`npm run smoke`** — 41 + 48 + 210 + 42 + 58 + 75 + 56 + 66 + 21 = **617 assertions**. Two things
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

### The editorial style — a THIRD axis, and the one place red is spent

**Added 2026-09-10.** `data-style` on `<html>`, values `classic` (default) and
`editorial`, sitting beside `data-theme` and `data-palette` as an independent
axis — editorial × teal × dark compose rather than fork. It is reached from the
**robot icon in the appbar**, not the prototype bar: palette and theme are things
a reviewer flips while judging one design, and this is a choice *between* two
designs, so it belongs with the demo tools. The robot menu, dropdown and
left-anchored panel are ported from `xcel-admin-tool.html` (same `ph-*` class
names, so the two files stay diffable) with two forced differences: this file has
no left nav, so the trigger sits in the appbar util cluster, and it opens
**downward**. Switch Account is the entry point the fork built and left
non-functional; here it actually switches, and persists to
`localStorage['xcel.dt.style']`.

**Editorial is a reduction, not a re-skin.** Cards and shadows give way to
hairline rules and warm ground; one tinted band carries the single promoted
thing; type does the work containers used to. Five cards become three sections —
`MembershipKpis`' four stat tiles fold into the masthead fact line,
`DashboardRecommendedBand` is dropped outright (an Explore concern with its own
nav item, and a carousel is the one thing that cannot be quiet), and
`ClpJumpBackInBand`, the gauge and `ExamDateCard` are re-drawn.

**NO RED — and that is a product decision, not a colour one.** Editorial drops
`--brand-*` entirely except ONE badge, the Rubi mark. The consequence is that in
classic, red carries the external licensing exam as its only semantic; editorial
has no red to spend on it, so **the exam is carried by ink, a hairline rule and
the words "Licensing exam · not a course task"** instead. Nothing is *lost* — the
desktop rule was always that the exam is labelled in words and never by colour
alone — but the emphasis is gone. Reinstating it means giving the exam its own
non-red accent, not reaching back for `--brand-*`. The wordmark's `X` and both
avatars are red's other two uses, so they go to ink and neutral. A smoke
assertion counts `--brand-*` references in the editorial body and fails above
one, because this claim is a single careless `color:var(--brand-500)` away from
being false. Note also that the Rubi block imports a **Compass** concept onto an
XCEL surface — the assistant does not exist in the XCEL product yet.

**The type answer, once the reference's serif was rejected** (Jillienne's call —
stay in Open Sans): **one family, not two.** Editorial points `--font-heading` at
Open Sans and drops Lato, getting its character from size, weight and tracking
instead — 300 at 40px for display, tracking at -.025em, eyebrows retracked from
.07em to .14em, body held to ~62ch. Weight 300 was added to the font link for it.
A new **`--font-brand`** token pins the XCEL lockup to Lato and is never
overridden by the style axis, for the same reason the brand red is not a palette
choice: the wordmark's face is not a theme decision, and it stands in for
`/brand/xcel.svg`.

**What the warm ground cost, measured.** `--page` is `#faf8f5`, *lighter* than the
cool `#f4f4f6` it replaces — which is exactly why the reference's green/ochre
status bars could not come over: `--success-500` fell to **4.27:1** as a label and
`--warning-500` to **1.71:1** as a bar. So status here is carried by label text,
the warm row wash (`--ed-wash`) and the button treatment, with **every bar a
single primary fill on the taupe track**. Both failing values are asserted as
*still failing*, so reaching for them again fails a test. Dark editorial's
`--ink-3` is `#9b948a` and NOT the `#918a80` that matches the light ramp's step:
that measured 4.22:1 on `--ed-band`, and darkening the band instead would have
cost its separation from the page.

**The light rail — the second pass, and where "lighter" actually lived.** The
first editorial pass changed the content and left the chrome, and it still did
not read as light: the **near-black rail was the heaviest object on the page**,
and no amount of warm ground in the content column outweighs it. So editorial now
puts the rail **on the page ground** with a right hairline defining it, the way
the reference's near-white nav does, and reshapes it — the 3px left accent border
becomes a rounded pill inset from the rail edge, and **the glyph column is
dropped** (the reference's nav is text-only; at this weight an icon column reads
as clutter). Both are one rule each to reverse. The appbar loses its opaque white
for the page ground too, because white chrome over a warm page is a visible seam.

Getting there needed the rail's colours to *be* tokens first. Three of them were
hardcoded `#fff` and `rgba(255,255,255,…)` across four places — `.rprof .nm`,
`.ritem:hover`, `.ritem[aria-current]` and **one inline style built inside
`renderRail()`**, which is the one a CSS-only search misses. They are now
`--rail-ink` / `--rail-active` / `--rail-hover`, with the original values as the
`:root` defaults, so classic is unchanged and asserted to be.

**Two findings from it.** (1) **`--rail-active` is `#d5dde8`, not the `--ed-band`
tint it wants to be.** The band tint measured **1.13:1** against the warm page,
because a cool tint at the same lightness as a warm ground differs in **hue, not
luminance** — and hue alone cannot say "selected". `#d5dde8` reaches 1.29:1, and
the active item *also* goes to weight 700, so selection never rests on a 1.3:1
fill. The band tint is asserted as still failing. (2) **`--rail-accent` is
deliberately not repointed.** It is the palette's light stop and it serves the
focus rings on the **dark prototype bar**, where a navy primary would measure
~1.5:1 and strand keyboard users; the editorial rail gets its own focus colour in
a rule instead. A test asserts editorial never redeclares it. Same trap in
miniature: the demo strip's 2px bottom rule was that light stop as well, chosen
for a near-black bar, and it disappears on a light one — so editorial overrides
it to the primary. **Dark editorial keeps a dark rail**: "light rail" was about
weight on a light page, not about inverting the dark theme, and the two should be
one design rather than two.

**Scope, stated plainly:** the editorial *layout* is the home page only. The other
six sections still render their classic cards, now on the warm ground and beside
the light rail. That hybrid is deliberate — the exploration is the home page —
but it is the thing to look at first if editorial ever gets promoted past
exploration.

**The one bug this shook out, worth not repeating.** The band and the assignments
list disagreed about the current chapter — the band inherited classic's hardcoded
"58% through" copy while the list derived 40% from hours, so one screen showed two
figures for one chapter. Both now read a single **`edReqWalk()`**, as does the
Rubi block's heading, and a smoke assertion checks the *agreement* rather than the
numbers. Anything either surface says about the current chapter has to come from
there.

**Known fixture artifact, not a design bug:** the progress and exam demo axes are
independent, so any pairing is reachable — including a licensing exam dated
*before* the target date for finishing the coursework that qualifies you to sit
it. Classic has the same quirk; editorial only makes it visible by putting both
facts on adjacent lines.

**The palette is now guarded by tests, which it was not before.** `smoke-desktop.mjs` went from 51 to 100 and now **210 assertions**: it parses the real declared hex out of the stylesheet (so the assertions track the CSS rather than a copy that can drift) and sweeps all three palettes × light/dark for rail-active ≥3:1, rail-chip ink ≥4.5:1, link/500 ≥4.5:1 on white, white-on-fill ≥4.5:1, the two gauge segments ≥1.6:1 apart, and `--on-primary` ≥4.5:1 on the dark fill. Following [`ProfilePersonalizeContrast.test.ts`](src/test/ProfilePersonalizeContrast.test.ts), it also asserts the **old failing values still fail** (`#a81c24` at 2.05:1 on the rail; `#c75159` still the marginal 3.41:1 stop) so a future palette reaching for either fails a test instead of quietly shipping an invisible rail indicator — and it asserts the hero gradient stays gone. **Two demo axes are live and both re-render everything**: `dashboard-education-type` (Pre-Licensing ⇄ Continuing Ed — renames every category label, swaps Target Date for License Expires, and hides the renewal cycle for pre-licensure, since there is nothing to renew yet) and `dashboard-progress-state` (the five compliance states). A third, **Exam**, has no counterpart in the dashboard project: four of the licensing exam's six states are DERIVED from the sit date, so there is no way to click to them — the control exists for the same reason the walk-through has a clock. **A provenance toggle in the prototype bar** overlays each card with the real component it came from plus a per-section note on what was reused, what was dropped and why — it is the answer to "what actually overlaps", made checkable rather than asserted. **The logo is a text lockup with an `<img src="/brand/xcel.svg">` in front of it that hides itself if the file is absent** — drop the real asset at that path and it appears with no code change. **The two original contrast findings survive the re-palette as a RULE, not as two hex values.** They were: the XCEL red measures **2.05:1 against the near-black rail**, under the 3:1 a state indicator needs; and `#c75159`, the stop that cleared it, is an awkward mid tone where **neither white (4.42:1) nor near-black (4.09:1)** reaches 4.5:1 at chip size. Generalised: every palette puts a **light** stop on the rail (`--rail-accent`, now 5.34–6.01:1) and fills chips with a **light tint over dark ink** (`--rail-chip` / `--rail-chip-ink`) rather than a saturated fill. Re-measure before darkening any of them. Same trap as the McKissock secondary/tertiary ramps documented under Free Content promo bands.

**The hero's red gradient was removed in the same pass** (the direct ask). `.hero` was a `linear-gradient(180deg, var(--primary-100), transparent)` — a brand-red fade that put the loudest colour in the product behind its quietest content, and read as a coloured band the eye had to clear before the page began. It sits on `var(--card)` now, with the existing bottom rule doing the separating; the `[data-theme="dark"] .hero` red-tint override went with it. Two hatched holes are local to this page: **who pays** on the catalogue (sponsored access is meant to be invisible to the learner and central to the admin, so neither showing nor hiding the price is right until the entitlement rule exists) and **multi-state hours** on Records.

### The learner walk-through

**The full walk-through is a SECOND page under the same tile** — [xcel-lms-walkthrough.html](public/prototypes/xcel-lms-walkthrough.html), served as `/prototypes/xcel-lms-walkthrough.html`, linked from the wireframes masthead. Where the four stages above are separate mini-prototypes that each start cold, this is **one learner, one unbroken arc with state carried throughout**: invite → magic link → silent account creation → set a target date → plan built backwards from it → study loop (home → hand-over wait → Compass frame → exit with the progress lag) → practice exam → exam simulation + its interruption → readiness → book the licensing exam → sit → fail → retake → pass → records. **The carried state is the point, and it is made visible** by a "What the product knows" inspector beside the phone (account · target date · plan days · chapters · practice · simulation score · readiness · booking · attempts · licence · today's date), so a reviewer can see that the date they typed built the plan and the chapters they finished moved the percentage. Nothing is hardcoded downstream: `planDays` derives from the chosen target, progress from `done/TOTAL`, the practice task appears at 4 chapters, the simulation unlocks at 8, booking unlocks at 12, and a failed attempt re-anchors the plan while keeping attempt 1 in the record. A **journey rail** shows the nine chapters and allows jumping BACK only (jumping forward would skip the state that makes the later screens true). Three surfaces carry the brief's own answers: the **readiness** screen states its basis, gives a frequency rather than a probability, and names what would move it ("an estimate, not a prediction · about 7 in 10 passed first time") — the answer to flow 04's credibility problem; the **fail** screen is warning-family with no confirm dialog and states that coursework and hours are unaffected; and **Compass-unreachable** during the simulation renders the hatched hole rather than an optimistic recovery. Two more hatched holes live inline where they bite — retake cooling-off (on the retake screen) and multi-state licensure (on records). **Guarded by [smoke-walkthrough.mjs](smoke/smoke-walkthrough.mjs)** — a jsdom walk of the ENTIRE arc, 48 assertions, which asserts the state actually carries (the typed email reaches the wait screen, the typed target date reaches the plan, the offline-held answers reach the result screen, both attempts reach the records screen) rather than only that screens render. Run both smoke tests and re-copy BOTH files to `public/` after any edit. **ONE row, not two:** the walk-through and the companion spec are reachable from the wireframes masthead, not as their own tiles — a second row into the same body of work is what got `recommended-card-ab-demo` and the four testing tiles archived. That spec is served as **raw `.md`** (`/prototypes/xcel-lms-exam-task-type-spec.md`, browsers render it as plain text) so there is ONE copy; an HTML twin would drift from [public/prototypes/xcel-lms-exam-task-type-spec.md](public/prototypes/xcel-lms-exam-task-type-spec.md) the moment either changed. **The spec's load-bearing finding:** `StudyTaskKind`'s existing `'exam'` means the *practice* exam (course-linked, with an `href` into the LMS), so the external licensing exam needs its own `'licensing-exam'` key — overloading the existing one still typechecks and would have the calendar silently treat a real licensing exam as a practice one. Admin flows 01–06 are **not** covered in this pass. Since the tile is `explore` + `externalUrl`, the add-a-feature checklist's brands / member+non-member / feature-flag requirements don't apply — there is no gateway and no in-app route.

