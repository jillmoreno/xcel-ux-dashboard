import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  ArrowRight,
  BallotCheckRegular,
  BookOpenRegular,
  BookRegular,
  CircleInfoRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  GaugeThin,
  Lock,
  NotebookRegular,
  PenFieldRegular,
} from '@/icons'
import { Loveseat, MugHot, PersonRunningFast } from '@/icons'
import { COMPASS_BUTTON } from './compassButton'
import { journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { widgetEyebrowStyle } from '@/components/learning/widgetStyles'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  NY_LH_CURRENT_CHAPTER,
  NY_LH_LESSON_MINUTES_INVENTED,
} from '@/data/nyProducerRequirements'
import { ExamScheduleWidget } from '@/components/learning/ExamScheduleWidget'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import {
  dateFromIso,
  daysUntil,
  defaultPreset,
  formatPaceDate,
  isoPlusDays,
  studyPace,
  NOT_STARTED_NIGHTS,
} from '@/lib/studyPace'
/* ⚠ THE PROP CONTRACT IS SHARED ON PURPOSE — see the note below. Both homes are
   handed the same figures by `LearnerFocusedBand`, which is what makes them
   comparable; only the layout is forked. */
import type { AtlasHomeV2Props } from './HybridHomeV1'

/**
 * HYBRID — PACING EXPLORATION, 2026-10-07, the direct ask: "make a copy of
 * Hybrid V1, call it Hybrid - Pacing Exploration."
 *
 * A FORK OF `HybridHomeV1`, not a flag through it — CLAUDE.md's rule, and the
 * reason is the whole point of the copy: Hybrid V1 is the shipped Prototypes
 * BASELINE as of 2026-10-06, so a pacing idea tried here must not be able to
 * reach it. It starts byte-identical apart from this note and its name.
 *
 * ⚠ IT IMPORTS `AtlasHomeV2Props` RATHER THAN RESTATING IT. The two take the
 * same figures and handlers from `LearnerFocusedBand` — that is what makes them
 * comparable — so the prop contract is shared deliberately while the LAYOUT is
 * not. "Fork the layout, import the data."
 *
 * ⚠ WHAT THIS FORK IS FOR is the pace panel and nothing else. Everything below
 * is V1's and should be left alone unless a pacing idea actually needs it; the
 * further the two drift on unrelated things, the less the comparison says.
 *
 * ⚠ AND IT DOES NOT YET COVER 0%. At Not Started the band never reaches either
 * Hybrid home — `LearnerFocusedBand` requires `resume`, so a learner who has
 * not begun gets the older `StudyPaceTile` chooser and not this screen at all.
 * That gap is the first thing any pacing exploration has to decide about.
 *
 * The original note follows, because everything it describes still applies.
 */

/**
 * ATLAS HOME, V2 — Figma "Atlas-Compass-Global-Navigation" node 161:662,
 * 2026-10-02, the designer's request: "Replace this home page content and
 * layout with the attached Figma file. Keep the old layout as a V1 Home Page
 * version." The flag is `atlas-home-layout` (v1 = the earlier Atlas home,
 * v2 = this); `LearnerFocusedBand` renders this in place of its Atlas layout.
 *
 * ONE CARD, NOT FIVE. The course, its figures, the pace and the journey sit in
 * a single course card on the left; a narrow column on the right carries the
 * exam-date question and a list of other destinations.
 *
 *   - The three FIGURES (expected completion, days to review, course access)
 *     come from the same pace model the Study Pace card uses
 *     (`studyPace` → `defaultPreset`), so the two layouts cannot disagree.
 *   - The DIAL is the course's own progress (`percent`, the band's figure).
 *   - The JOURNEY is `journeyStopsFor(path)`, the rail's own stops; the current
 *     stop carries Begin Course, the others a chevron into the stop.
 *   - Yes / No on the exam-date card are NOT WIRED yet, as on V1's banner.
 *
 * Departures: Open Sans for the design's Open Sans (same), DM Serif Display
 * through `--font-heading-serif` (the Headings dropdown still swaps it), and
 * every colour a token — the design's steel #3D5A73 is the brand's button
 * colour, its warm rules the Atlas rail rule, its pale panel the brand's
 * Study Pace tint.
 */

export function HybridPacingHome({
  path,
  courseTitle,
  coverUrl,
  percent,
  today,
  hoursRemaining,
  accessExpiresAt,
  examDate,
  notStarted = false,
  onBegin,
  onOverview,
  onOpenStop,
  onOpenStep,
  onOpenRequirements,
}: AtlasHomeV2Props) {
  const [, setParams] = useSearchParams()
  /* ⚠ PACING E — the chosen duration at 0%. Local because it is display-only;
     see the note at `PACE_WEEKS`. */
  const [paceWeeks, setPaceWeeks] = useState(2)
  const go = (section: string, coursePage?: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('section', section)
      if (coursePage) next.set('coursePage', coursePage)
      else next.delete('coursePage')
      return next
    })

  /* THE FIGURES — the pace model, as the Study Pace card computes it. */
  const model = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate,
        nights: notStarted ? NOT_STARTED_NIGHTS : undefined,
      }),
    [today, hoursRemaining, accessExpiresAt, examDate, notStarted],
  )
  const preset = defaultPreset(model)
  /* ⚠ PACING — THE DAY COUNT IS GONE, 2026-10-07, the direct ask: "we will
     incorporate the countdown of days at a later time with the notifications
     logic etc." `accessDays` went with it rather than sitting unread —
     `noUnusedLocals` would not have kept it, and a dead local is a worse
     placeholder than this note. To bring it back:
     `Math.max(0, daysUntil(accessExpiresAt, today) ?? 0)`.

     ⚠ LONG MONTH, NOT `formatPaceDate`. That helper is `{month:'short'}` —
     "Jun 11" — and this line was specified as "Access ends June 11". It is the
     card's one date and it is read once, where the figures it replaces were
     scanned in a column; the short form is for the column. */
  const accessEnd = accessExpiresAt ? dateFromIso(accessExpiresAt) : null
  const accessEndsLabel = accessEnd
    ? `Access ends ${accessEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
    : null
  /* ⚠ PACING A — DERIVED AGAIN, 2026-10-07, AND THIS REVERSES A DECISION.
     The literal 3 was the designer's request on 2026-10-02, and the note it
     replaces said plainly what that cost: deriving reads "2 Week Goal" for the
     13 days this demo's model gives, so the goal and the Estimated Completion
     Date above it stopped coming from one figure.

     That contradiction is the whole subject of this fork, so the figure comes
     from the model here and the card can say only one thing. ⚠ THE NUMBER ON
     SCREEN CHANGES — 3 becomes 2 in the shipped demo state — which is the
     visible cost of the fix and the thing to judge. Hybrid V1 keeps the 3.

     ⚠ IF 3 IS THE RIGHT ANSWER, the lever is the SCENARIO, not the label:
     `hoursRemaining` and the access date are what make the model say 13 days.
     Changing those makes the model genuinely yield three weeks; changing the
     label only hid the disagreement. */
  const weeks: number = Math.max(1, Math.round(preset.days / 7))

  /* ⚠ PACING A — WHICH DEADLINE IS ACTUALLY SQUEEZING YOU. `studyPace` has
     always resolved this (`resolveCeiling` → `binding`) and nothing has ever
     rendered it, so the panel showed a pace with no account of what set it.

     ⚠ `exam` DOES NOT MEAN THE EXAM DATE. Under that arm `hardEndIso` is the
     exam MINUS `EXAM_BUFFER_DAYS` (7), so a line reading "ends <hardEnd>" would
     name a date the learner has never seen. It names the buffer instead.

     ⚠ `none` RENDERS NOTHING, deliberately. With neither date set the model
     falls back to a flat 14 days — an invented ceiling, and a sentence calling
     it a deadline would be the product inventing one.

     ⚠ AND IT NAMES `accessExpiresAt`, NOT `model.hardEndIso` — the correction
     that proves the point of this whole option. `hardEndIso` under the access
     arm is the expiry MINUS ONE (`resolveCeiling`: `accessDays - 1`), the last
     day you could still be working. Printing it read "ends May 28" two rows
     under a figure reading "Ends May 29" — a fresh contradiction introduced by
     the fix meant to remove one, caught by looking at the page. The learner's
     date is the expiry; the model's ceiling is an internal quantity and belongs
     on no screen. */
  const bindingNote =
    model.binding === 'access' && accessExpiresAt
      ? `Set by your access — ends ${formatPaceDate(accessExpiresAt)}`
      : model.binding === 'exam'
        ? 'Set by your exam — finishing a week before it'
        : model.binding === 'both' && accessExpiresAt
          ? `Set by your access and exam — ${formatPaceDate(accessExpiresAt)}`
          : null

  /* ⚠ HYBRID #4 — `lessonProgressTitle` MOVES THE FIGURES OUT OF THE TITLE.
     Without it the stop reads "Pre-Licensing Lessons (42)"; with it the title is
     the name alone and the stop keeps `completed` / `hours` for the row to set
     as its own run after a rule. The parenthetical cannot be divided, which is
     why this is a flag on the data rather than a format in the view. Same
     numbers, one source — see `journeyStopsFor`. */
  const stops = journeyStopsFor(path, { lessonProgressTitle: true })
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
  /* ⚠ HYBRID #4 — THE LESSON IN PROGRESS, and every condition here is a way it
     would otherwise lie. The block names a lesson the learner is part-way
     through, so it is withheld when there is no such lesson: before the first
     one (`notStarted`, or a zero count — "Lesson 1 · About 18 minutes" over a
     chapter nobody has opened is a claim about work not begun), on a stop that
     counts nothing (the completion tasks carry no `hours`), and once the count
     reaches the total, where the next lesson is in a different step.

     ⚠ THE NUMBER IS `completed + 1`, FROM THE STOP ITSELF. The row above prints
     "26 of 42 Completed" from the same two fields, so the summary and the
     lesson cannot disagree about where the learner is — which is the failure
     `journeyStopsFor`'s own "(41) vs 42" note is the record of. */
  /* ⚠ PACING E — THE 0% PANEL ASKS INSTEAD OF TELLING, 2026-10-07, the direct
     ask. At Not Started the dial showed 0% — a ring with nothing in it, over a
     goal the learner never chose — on the one screen where the pace is actually
     being decided. The dial goes and three durations take its place.

     ⚠ WEEKS, NOT THE MODEL'S PRESETS. `studyPace` prices Relaxed / Recommended
     / Focused in NIGHTS and MINUTES, which is the right vocabulary once someone
     is studying and the wrong one before they have started: "6 days a week,
     1¾ hours a night" is a commitment you cannot evaluate on day zero. "How
     long do you want this to take" is. The presets are still one click away
     under Customize Your Pace.

     ⚠ THE DEFAULT IS THE MIDDLE ONE, which is a choice and not a derivation —
     the old chooser opened on Recommended, the middle of its three, and this
     keeps that shape. Deriving it from the model would land on 3 weeks here
     (the ceiling is 29 days), which would default every learner to the slowest
     option on offer.

     ⚠ AND SELECTING IS DISPLAY-ONLY IN THIS FORK. Nothing is written to the
     pace store and Begin Course does not carry the choice — this is an
     exploration of the SHAPE. Wiring it is `study-pace-preset` and a decision
     about what the three weeks mean to the model. */
  const PACE_WEEKS = [
    { weeks: 1, label: '1 Week', icon: <PersonRunningFast size={14} aria-hidden /> },
    { weeks: 2, label: '2 Weeks', icon: <MugHot size={14} aria-hidden /> },
    { weeks: 3, label: '3 Weeks', icon: <Loveseat size={14} aria-hidden /> },
  ] as const

  /* ⚠ PACING — THE EXAM DATE NARROWS THE OPTIONS, 2026-10-07, the direct ask:
     "if the user sets an exam date, the available pacing will adjust. If date
     is less than 14 days, the 1 week option will be the only available."

     THE RULE, generalised from that sentence: an N-week option is offered only
     if the exam is at least N×7 days away. An exam 8 days out leaves 1 Week
     alone; 16 days leaves 1 and 2; 21 or more leaves all three. At exactly 14
     the 2-week option returns, which is what "less than 14" asks for.

     ⚠ IT DISAGREES WITH THE MODEL, AND DELIBERATELY SO — this is the one thing
     to decide before the idea goes further. `resolveCeiling` puts the usable
     deadline at the exam MINUS `EXAM_BUFFER_DAYS` (7), so that a learner has a
     week to revise; by that rule an exam 8 days out leaves ONE usable day and
     no pace at all would be offered. This rule lets a one-week plan finish the
     day before the exam with no revision time. The spec is the spec; the
     tension is real and the resolution is either a shorter buffer here or an
     option that says "1 week — no time to revise".

     ⚠ ACCESS IS NOT IN THIS RULE EITHER, though logically it bounds the same
     thing: nothing should finish after access ends. It does not bite in any
     demo state (31 days at 0%), and the ask named the exam. */
  const examDaysAway = examDate ? daysUntil(examDate, today) : null
  const paceOptions = PACE_WEEKS.filter(
    (o) => examDaysAway == null || examDaysAway >= o.weeks * 7,
  )
  /* ⚠ NEVER AN EMPTY GROUP. An exam today or in the past filters everything
     out, and a "Set Your Study Pace" heading over no choices is worse than an
     unachievable one — the learner would have no way to begin. */
  const paceChoices = paceOptions.length > 0 ? paceOptions : [PACE_WEEKS[0]]
  /* ⚠ THE SELECTION IS CLAMPED HERE RATHER THAN SYNCED IN AN EFFECT. The state
     can hold 3 while only 1 is on offer — set the date after choosing — and an
     effect correcting it would render one frame with nothing checked and write
     state during paint. Deriving it cannot. */
  const selectedWeeks = paceChoices.some((o) => o.weeks === paceWeeks)
    ? paceWeeks
    : paceChoices[paceChoices.length - 1].weeks

  /* ⚠ THE PROMPT EXPLAINS THE ABSENCE, which is the half of the ask that is
     not arithmetic: three options becoming one is a loss the learner can see
     and cannot account for, and an unexplained constraint reads as a bug. */
  const examWhen =
    examDate && examDaysAway != null
      ? `${formatPaceDate(examDate)}, ${examDaysAway} ${examDaysAway === 1 ? 'day' : 'days'} away`
      : null
  const pacePrompt =
    paceChoices.length === PACE_WEEKS.length || !examWhen
      ? 'How quickly would you like to complete this course? Don’t worry, you can always adjust your goal at a later time.'
      : paceChoices.length === 1
        ? `Your exam is ${examWhen}, so one week is the only pace that finishes in time. Change your exam date and this will adjust.`
        : `Your exam is ${examWhen}, so the longer paces would finish after it. Change your exam date and this will adjust.`

  const lessonStop = stops[currentIdx]
  const lessonsDone = lessonStop?.completed
  const showLesson =
    !notStarted &&
    typeof lessonsDone === 'number' &&
    lessonsDone > 0 &&
    !!lessonStop?.hours &&
    lessonsDone < lessonStop.hours

  const pass = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 2]
  const apply = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1]
  const state = jurisdictionName(path.state)
  /* ⚠ `=== 'tiles'` IS THE OPT-IN. An unset flag renders rows, the shape this
     version ships with — the inverted test would make "no decision" look like
     a decision. */
  const tiles = useFeatureFlag('hybrid-quick-links-style').variant === 'tiles'

  /* ⚠ THE QUICK LINKS, DEFINED ONCE. Both shapes render from this — see the
     note at the list. Four of the seven have no other home on this screen, so
     the set is the same either way and only the drawing changes. */
  const quickLinks: { icon: ReactNode; label: string; onClick?: () => void }[] = [
    { icon: <BookRegular size={13} aria-hidden />, label: 'My Courses', onClick: () => go('courses') },
    { icon: <FileCertificateRegular size={13} aria-hidden />, label: 'My Certificates', onClick: () => go('certificates') },
    /* ⚠ MOVED OUT OF THE HEADER — 2026-10-06, the direct ask, and `Header.tsx`
       drops its Resources link on this version so the destination is in one
       place rather than two. Directly under My Certificates, which is where the
       ask put it. */
    { icon: <BookOpenRegular size={13} aria-hidden />, label: 'Resources', onClick: () => go('resources') },
    { icon: <NotebookRegular size={13} aria-hidden />, label: 'Flashcards', onClick: () => go('course', 'flashcards') },
    { icon: <BallotCheckRegular size={13} aria-hidden />, label: 'Exam Simulator', onClick: () => go('course', 'exam-simulator') },
    {
      icon: <CircleInfoRegular size={13} aria-hidden />,
      label: 'Exam Information',
      onClick: onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : undefined,
    },
    {
      icon: <PenFieldRegular size={13} aria-hidden />,
      label: 'Applying for a License',
      onClick: onOpenStep ? () => onOpenStep(apply.id) : undefined,
    },
    { icon: <ClipboardListCheckRegular size={13} aria-hidden />, label: 'State Requirements', onClick: onOpenRequirements },
  ]

  return (
    <div style={PAGE}>
      {/* ── The course card ── */}
      <section aria-label="Current course" style={CARD}>
        {/* ⚠ PACING — THE CARD'S TOP LINE, 2026-10-07, the direct ask. The
            eyebrow was inside the text column beside the cover, which started
            it ~190px in from the card's edge and made it a label on the TITLE.
            At the top it labels the CARD, and the right end of the same line is
            where the one fact that constrains everything below it belongs.

            ⚠ THE TWO HALVES ARE NOT THE SAME TYPE, deliberately. Left is the
            eyebrow — uppercase, tracked, the card's name. Right is sentence
            case at a lighter weight: a date is not a label, and matching them
            would have made the deadline read as a second heading. */}
        <div style={CARD_TOPLINE}>
          <p style={EYEBROW}>Current course</p>
          {accessEndsLabel ? <p style={ACCESS_NOTE}>{accessEndsLabel}</p> : null}
        </div>
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {coverUrl ? <img src={coverUrl} alt="" aria-hidden style={COVER} /> : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            {/* ⚠ ITS EYEBROW WRAPPER WENT WITH IT. The `gap: 8` column existed
                to pair the eyebrow with the title; with one child left the
                parent's own `gap: 15` is what separates the title from the
                buttons, which is what it already did for the pair. */}
            <h2 className="cre-compass-course-title" style={TITLE}>
              {courseTitle}
            </h2>
            {/* ⚠ HYBRID #2 — BEGIN COURSE SITS WITH THE TITLE. On Eric's home
                it rides the current journey row, which puts the screen's one
                primary action halfway down the right column and makes it a
                property of a list item rather than of the course. Here it pairs
                with Course Overview under the title: the two things you can do
                with this course, together, above the fold.

                ⚠ `JourneyRow` NO LONGER DRAWS IT (see its note) — the current
                stop takes the chevron like every other row. Two Begin Course
                buttons on one screen was the thing to avoid. */}
            {/* ⚠ HYBRID #13 — COURSE OVERVIEW FIRST, RESUME ON THE RIGHT.
                2026-10-05, the direct ask. ⚠ SWAPPED IN THE DOM, NOT WITH
                `row-reverse`: reversing visually would leave the tab order
                running right-to-left, so a keyboard user would reach the
                primary action first while a sighted one reads it last. Source
                order and visual order stay the same thing. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* ⚠ HYBRID #12 — A TRUE SECONDARY BUTTON, not the chip. 2026-10-05,
                  the direct ask. `cre-compass-home-chip` is a 10px label in a
                  4px-radius outline — a METADATA tag, which is what it looks
                  like sitting beside a 13.5px primary. Course Overview is a
                  destination, and the pair under the title is the two things
                  you can do with this course, so it takes the same `BEGIN` box
                  as Resume Course and `cre-compass-secondary` for the outlined
                  treatment the page already defines (transparent fill, the
                  button colour on the border and the label, an 8% tint on
                  hover). Same height, same radius, same type — the only
                  difference between the two is fill, which is what primary and
                  secondary are supposed to mean. */}
              {onOverview ? (
                <button type="button" className="cre-compass-secondary" onClick={onOverview} style={BEGIN}>
                  Course Overview
                </button>
              ) : null}
              <button
                type="button"
                className="cre-compass-primary cre-compass-btn-primary"
                onClick={onBegin}
                disabled={!onBegin}
                style={BEGIN}
              >
                {/* ⚠ THE SAME `ArrowRight` AT 16 Testing 3's combined card uses
                    on its Resume button — 2026-10-06, the direct ask.
                    `aria-hidden`, because the label already says what it does;
                    an arrow announced after "Resume Course" is noise. `BEGIN`
                    already sets `gap: 8` for exactly this. */}
                {notStarted ? 'Begin Course' : 'Resume Course'}
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <span aria-hidden style={RULE} />

        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {/* Left: the figures, then progress and pace. */}
          <div style={{ width: 200, flex: 'none', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ⚠ HYBRID #1 — THE FIGURES COLUMN, REORDERED AND TRIMMED.
                Eric's reads Expected completion · Days to review · Course
                access. Here:

                  • COURSE ACCESS LEADS. It is the only hard deadline of the
                    three — the other two move when the learner's pace does, and
                    this one does not.
                  • "ESTIMATED", NOT "EXPECTED". The figure is derived from a
                    pace model, and "expected" reads as a commitment the product
                    is making rather than a projection it is offering.
                  • DAYS TO REVIEW IS GONE. It is `daysToCeiling - preset.days`,
                    which is slack in the plan rather than a date anyone acts on,
                    and it was the third number competing for the same glance.

                ⚠ `reviewDays` WENT WITH IT — `noUnusedLocals` will not keep an
                unread local. To restore the row, take the one-line derivation
                and the `<Figure>` from `AtlasHomeV2.tsx`, which is unchanged
                and is the better reference anyway. */}
            {/* ⚠ PACING — THE FIGURES COLUMN IS GONE, and it emptied in two
                steps rather than being removed as a block. ESTIMATED COMPLETION
                DATE left on 2026-10-07 for the pace panel, because it is a
                consequence of the pace rather than a fact about the course.
                COURSE ACCESS left hours later for the card's top line, because
                it is a fact about the course rather than one about the pace —
                and its day count went with it, deferred to the notifications
                work.

                With both gone the wrapper held nothing, so it went too — and
                so did the `<Figure>` component itself, which nothing in this
                file called any more and `noUnusedLocals` would not have kept.
                ⚠ TAKE IT FROM `AtlasHomeV2.tsx` to restore a row: that file is
                unchanged, still draws all three figures, and is the better
                reference than a copy left here would have been. Eric's home and
                Hybrid V1 both still have them; this is the only version
                without. */}
            <div style={PACE_PANEL}>
              {/* The eyebrow heads the whole panel, above the dial (2026-10-02,
                  the designer's request; the design sets it under it). */}
              <p style={{ ...EYEBROW, alignSelf: 'stretch' }}>
                {notStarted ? 'Set Your Study Pace' : 'Your study pace'}
              </p>
              {notStarted ? null : <ProgressDial percent={percent} />}
              {notStarted ? (
                <div
                  role="radiogroup"
                  aria-label="Set your study pace"
                  style={{ display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'stretch' }}
                >
                  {/* ⚠ ABOVE THE OPTIONS, NOT UNDER THEM — 2026-10-07, the
                      direct ask, and the copy grew a question with it. Under
                      the group it was a reassurance about a choice already
                      made; over it, it ASKS the question the three rows answer
                      — which is what the rows otherwise leave implicit, since
                      "1 Week / 2 Weeks / 3 Weeks" alone never says a week of
                      WHAT. The reassurance keeps its job as the second half. */}
                  <p style={PACE_PROMPT}>{pacePrompt}</p>
                  {paceChoices.map((opt) => {
                    const on = selectedWeeks === opt.weeks
                    return (
                      <button
                        key={opt.weeks}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        tabIndex={on ? 0 : -1}
                        onClick={() => setPaceWeeks(opt.weeks)}
                        style={{ ...PACE_OPT, ...(on ? PACE_OPT_ON : null) }}
                      >
                        <span aria-hidden style={{ display: 'inline-flex', flex: 'none', color: 'var(--color-compass-page-button)' }}>
                          {opt.icon}
                        </span>
                        {/* ⚠ NO DATE ON THE ROW — 2026-10-07, the direct ask,
                            and it reverses the "each selection should have an
                            Estimated Completion Date" from earlier the same
                            day. Both were right in turn: the date belonged in
                            this section, and once the section CLOSES with it,
                            putting it on the rows too made one of three rows
                            repeat the summary underneath them. The row is the
                            choice; the line below is its consequence. */}
                        <span style={{ flex: '1 1 0', minWidth: 0, fontWeight: on ? 600 : 400 }}>
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                  {/* ⚠ IT TRACKS THE SELECTION, which is what makes moving it
                      here worth doing rather than merely tidier: at 0% the date
                      is not a report, it is what the option you are hovering
                      over would COST you, and it changes as you choose.
                      ⚠ IT ALSO REPEATS THE SELECTED ROW'S OWN DATE — see the
                      hand-off note; the per-option dates were a separate ask
                      and the two now say the same thing on one of three rows. */}
                  <PaceEstimate
                    value={formatPaceDate(isoPlusDays(today, selectedWeeks * 7))}
                    note={`At ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`}
                  />
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, alignSelf: 'stretch' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
                    <GaugeThin size={33} aria-hidden />
                  </span>
                  <span style={{ ...BODY_TEXT, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    {weeks} Week Goal
                  </span>
                </div>
                <p style={SMALL_TEXT}>
                  Your default pace is set for you to complete your course in {weeks}{' '}
                  {weeks === 1 ? 'week' : 'weeks'}. You can change your pace below.
                </p>
                {/* ⚠ PACING A — above the link, below the sentence, so it reads
                    as a condition on the goal rather than as another fact about
                    the course. It sits on its own rule because it answers a
                    different question from everything over it: not how long,
                    but why that long. */}
                {bindingNote ? (
                  <p style={BINDING_NOTE}>{bindingNote}</p>
                ) : null}
                <button type="button" className="cre-compass-v2-link" onClick={() => go('study-plan')} style={LINK}>
                  Customize Your Pace
                  <AngleRightRegular size={13} aria-hidden />
                </button>
                <PaceEstimate
                  value={preset.state === 'no' ? 'Not achievable' : formatPaceDate(preset.finishIso)}
                  note="At current pace"
                />
              </div>
              )}
            </div>
          </div>

          <span aria-hidden style={{ width: 1, flex: 'none', background: 'var(--color-atlas-nav-rule)' }} />

          {/* Right: the journey. */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section aria-label="Study journey" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <p style={STEP_EYEBROW}>
                  <span style={{ fontWeight: 700 }}>Step 1</span>
                  <span style={{ fontWeight: 600 }}> · Study Journey</span>
                </p>
                <p style={STEP_TITLE}>Complete Coursework</p>
              </div>
              <ol style={{ listStyle: 'none', margin: 0, padding: '3px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stops.map((stop, i) => (
                  <JourneyRow
                    key={stop.id}
                    stop={stop}
                    current={i === currentIdx}
                    last={i === stops.length - 1}
                    /* ⚠ HYBRID #7 — A LOCKED STOP HAS NO WAY IN. Withheld
                       rather than disabled: a chevron that does nothing is a
                       promise the row cannot keep, and the lock already says
                       why. `not-started` only — the completed stops keep theirs,
                       since looking back at finished work is always allowed. */
                    onOpen={onOpenStop && stop.status !== 'not-started' ? () => onOpenStop(stop.id) : undefined}
                    /* ⚠ HYBRID #4 — ONLY THE CURRENT STOP CARRIES IT, and
                       `showLesson` is computed from that stop, so a row can
                       never be handed a lesson that belongs to another one. */
                    lesson={showLesson && i === currentIdx ? (lessonsDone ?? 0) + 1 : undefined}
                    /* ⚠ THE SAME HANDLER THE TITLE AREA'S RESUME BUTTON TAKES —
                       2026-10-06, the direct ask for "another way for the user
                       to jump right back into the lesson". Two controls, one
                       action: a second handler would be a second thing to keep
                       in step, and they are the same door. */
                    onLesson={onBegin}
                  />
                ))}
              </ol>
            </section>

            {/* ⚠ HYBRID #10 — THE TWO COLLAPSED STEPS SIT TIGHTER THAN THE
                COLUMN'S OWN RHYTHM. 2026-10-05, the direct ask.

                The column gaps its children by 24, which is right while a step
                is a paragraph and a link. Collapsed, a step is two lines of
                type — so 24 above the rule and 24 below it put ~48px of air
                around a 39px block, and the two steps read as far apart as the
                whole coursework section above them.

                A NESTED COLUMN rather than margins on the steps: the 24 still
                separates this block from the journey above and the button
                below, and only the space BETWEEN the steps and their rules
                tightens. Margins would have had to cancel the parent's gap and
                would fight it again the moment either number changes. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span aria-hidden style={RULE} />
              <Step
                number={2}
                title={pass.title}
                detail={pass.detail}
                link={pass.detailLabel ?? 'What to expect'}
                onLink={onOpenStep ? () => onOpenStep(pass.id) : undefined}
              />
              <span aria-hidden style={RULE} />
              <Step
                number={3}
                title={state ? `Get Licensed in ${state}` : 'Get Licensed'}
                detail={apply.detail}
                link={apply.detailLabel ?? 'How to apply'}
                onLink={onOpenStep ? () => onOpenStep(apply.id) : undefined}
              />
            </div>
            {/* ⚠ HYBRID #11 — THE "<State> State Requirements" BUTTON WENT,
                2026-10-05, the direct ask. It was a full-width secondary button
                closing the journey column, and the Quick Links card beside it
                already carries a "State Requirements" row to the same sheet
                (`onOpenRequirements`, still passed — see `SideLink` below). Two
                controls, one destination, and the button was the louder of the
                two for a reference page nobody opens mid-lesson.

                ⚠ THE `data-cta-id` WENT WITH IT: `home.state-requirements` now
                reports from the Quick Links row alone on this version, so a
                funnel comparing it against Eric's home is counting one control
                where his counts two. */}
          </div>
        </div>
      </section>

      {/* ── The side column ── */}
      <div style={{ width: 260, flex: 'none', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* No stroke and the Compass medium shadow, with the course card's
            fill so the card has a surface to lift (2026-10-02, the
            designer's request). The links card below keeps the outline. */}
        {/* ⚠ HYBRID #5 — TESTING 3'S EXAM CARD, IN PLACE OF ERIC'S QUESTION.
            His was a Yes / No pair under "Do you know your state exam date?"
            with a note saying, in the file, "NOT WIRED YET — neither answer
            leads anywhere until one is designed". It asks the right question
            and then cannot take the answer.

            `ExamScheduleWidget` is that design: it asks the same thing, takes
            the date, writes it to `examDateStore`, and from then on shows the
            saved readout with an Edit. The store is what every other surface
            already reads — the Study Plan, the pace model's Target Exam Date,
            the course player — so a date entered here reaches all of them, and
            a learner who entered one elsewhere is never asked again.

            ⚠ `compact`, MATCHING TESTING 3'S UNDER-COURSE PLACEMENT. This is
            the side column, not the journey column: the date is a fact glanced
            at on the way past rather than the card's whole subject, which is
            the distinction that prop exists to make.

            ⚠ THE LIFTED SHELL IS ERIC'S AND STAYS — the card is Jill's, the
            surface it sits on is this layout's. Passing `shell` is how the
            widget was built to allow exactly that. */}
        <ExamScheduleWidget
          shell={{ ...SIDE_CARD, ...SIDE_CARD_LIFTED }}
          onOpenStep={onOpenStep}
          stateName={state || undefined}
          compact
          /* ⚠ HYBRID #6 — THE SPLIT-FLAP COUNTDOWN. Opt-in, so the four other
             versions that draw this card keep the text figure. */
          countdown="flip"
        />

        {/* ⚠ HYBRID #8 — "QUICK LINKS", WITH TESTING 3'S EYEBROW. 2026-10-05,
            the direct ask. Eric's card was "Other Information for Your Journey"
            over a Serif H8, which is the same type the STEP titles beside it
            use — so a list of shortcuts carried the same weight as the three
            things the learner actually has to do.

            `widgetEyebrowStyle` + `cre-eyebrow-ink` is what Testing 3's Quick
            links card wears, and what every other section label on this page
            wears. The name follows the style: "Quick Links" says what the block
            is for, where "Other Information" says only that it is not the rest.

            ⚠ THE SEVEN ROWS AND THEIR ICONS ARE UNTOUCHED. Testing 3's card
            holds three TEXT links; this one holds seven icon rows, four of
            which (Flashcards, Exam Simulator, and the two sheets) have no other
            home on this screen. Matching that card's row treatment too would
            mean deciding which four destinations to drop, which is a different
            question from what to call the block. */}
        <nav aria-label="Quick links" style={SIDE_CARD}>
          <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
            Quick Links
          </p>
          {/* ⚠ 8, AND IT IS A BALANCE BETWEEN TWO THINGS. It was 16 before the
              rows carried any padding of their own; 4 once they did, which read
              as a stack of touching highlights; 8 is the ask ("a little more
              padding between these options").

              The useful way to think about it: each row is 18px of label + 14px
              of its own padding, so the GAP is only the space between two
              hover fills — not the space between two labels, which is the gap
              plus the padding on both sides. Push this much past 8 and the
              highlights start to look like separate cards. */}
          {/* ⚠ HYBRID #14 — ONE LIST, TWO SHAPES (`hybrid-quick-links-style`).
              The destinations, their order, their icons and their handlers are
              defined ONCE in `quickLinks` above and rendered by whichever
              component the flag picks. That is what makes the two arms
              comparable: a reviewer switching shape cannot also be changing
              which seven things are in the card, which is exactly what two
              hand-maintained lists would eventually do. */}
          <ul style={tiles ? TILE_GRID : { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickLinks.map((link) =>
              tiles ? (
                <QuickTile key={link.label} icon={link.icon} label={link.label} onClick={link.onClick} />
              ) : (
                <SideLink key={link.label} icon={link.icon} label={link.label} onClick={link.onClick} />
              ),
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}

/**
 * ⚠ PACING — THE PACE PANEL'S OWN ESTIMATE, 2026-10-07. The same three parts as
 * `Figure` and deliberately NOT that component.
 *
 * `Figure` sets `whiteSpace: 'nowrap'` on its value, which is right in a
 * 200px-wide figures column where every value is short ("18 Days", "Jun 6") and
 * wrong here: this one can read "Not achievable - At current pace", which at
 * this width would run out of the card rather than wrap. Reusing `Figure` and
 * overriding the nowrap would have left the original carrying a rule it no
 * longer needs for anyone.
 *
 * ⚠ IT SITS UNDER A HAIRLINE, like the binding note, because it answers a
 * different question from the plan above it — not how fast, but when that
 * finishes.
 */
function PaceEstimate({ value, note }: { value: string; note: string }) {
  return (
    <div style={PACE_ESTIMATE}>
      {/* ⚠ "Estimated completion", not "...date" — 2026-10-07, the direct ask.
          The value under it IS a date, so the word was the label describing its
          own format. Applies in both states, since both render this. */}
      <p style={{ ...FIGURE_LABEL, marginBottom: 5 }}>Estimated completion</p>
      <p style={{ ...BODY_TEXT, margin: 0, lineHeight: '18px', color: 'var(--color-text-primary)' }}>
        <span style={{ fontFamily: 'var(--font-heading-serif)', fontSize: 15 }}>{value}</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}> · {note}</span>
      </p>
    </div>
  )
}


/* The progress dial (Figma "Complete Dial"): a 149px ring in the rule colour,
   the done share drawn over it in the brand's button colour from 12 o'clock,
   the figure in the middle. */
function ProgressDial({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)))
  const size = 149
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div role="img" aria-label={`Course progress ${pct}% complete`} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--color-atlas-nav-rule)' }} strokeWidth={3} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: 'var(--color-compass-page-button)' }}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div aria-hidden style={DIAL_TEXT}>
        <span style={DIAL_CAPTION}>
          Course
          <br />
          Progress
        </span>
        <span style={DIAL_FIGURE}>{pct}%</span>
        <span style={DIAL_CAPTION}>Complete</span>
      </div>
    </div>
  )
}

function JourneyRow({
  stop,
  current,
  last,
  onOpen,
  onLesson,
  lesson,
}: {
  stop: JourneyStop
  current: boolean
  last: boolean
  onOpen?: () => void
  /** ⚠ HYBRID #4 — what the lesson block does when pressed. The same `onBegin`
   *  the title area's Resume button takes. */
  onLesson?: () => void
  /** ⚠ HYBRID #4 — the lesson NUMBER, not a node. The row owns the gutter, so
   *  it has to draw the marker and the connector itself; handing it rendered
   *  content would have put the spine in one component and the thing it runs
   *  through in another. The chapter name is a constant, so the number is the
   *  only thing that varies. Absent means no lesson in progress — see the
   *  conditions where it is computed. */
  lesson?: number
}) {
  /* The current stop is never locked even if its status says `not-started` —
     it is the one the learner is being sent to. */
  const locked = !current && stop.status === 'not-started'
  /* ⚠ 40 / 34 — came down from 42 / 36 on 2026-10-05 and back up on 2026-10-06,
     both on direct asks. The settled reading: 36 was too airy for an 18px label
     and 28 was too tight once the locks went in beside it.

     ⚠ THE HEIGHT IS THE LEVER HERE, NOT THE LIST'S `gap`, and that is the thing
     worth knowing. Each row owns its own segment of the spine (`flex: 1 1 0` in
     a stretched gutter), so the connector grows WITH the row — while raising
     the gap would push the segments apart and turn one continuous line into a
     dashed one. The gap stays at 2 for that reason.

     ⚠ THE CURRENT ROW KEEPS ITS EXTRA 6 over the others: it carries the heavier
     weight and the filled dot, and letting it breathe is what makes it findable
     at a glance. */
  return (
    /* ⚠ HYBRID #4 — THE ROW IS A COLUMN OF TWO ROWS NOW, each with its own
       gutter, and that is what keeps the spine continuous through the lesson.
       The alternative — absolutely positioning the marker over one tall gutter
       — needs the lesson block's height to place it, which nothing here knows.
       Two gutters means two flex columns that each stretch to their own row, so
       the line is drawn by the same rule in both and cannot step sideways. */
    <li style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 40 : 34 }}>
        <span aria-hidden style={{ width: 14, flex: 'none', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, paddingTop: current ? 7 : 3 }}>
          {/* ⚠ HYBRID #7 — NOT-STARTED STOPS WEAR A LOCK, not an empty ring. The
              ring said "not yet" and so does everything else about a dim row; the
              lock says WHY, which is the thing the list could not express. The
              current stop keeps its filled dot and the completed ones their ring,
              so the column still reads top-to-bottom as done → here → locked. */}
          {current ? (
            <span style={MARK_CURRENT} />
          ) : locked ? (
            <span style={MARK_LOCK}>
              <Lock size={11} aria-hidden />
            </span>
          ) : (
            <span style={MARK} />
          )}
          {last ? null : <span style={SPINE} />}
        </span>
        <span
          style={{
            ...BODY_TEXT,
            flex: '1 1 0',
            minWidth: 0,
            fontSize: 13,
            lineHeight: '18px',
            paddingTop: current ? 5 : 0,
            fontWeight: current ? 600 : 400,
            color: current ? 'var(--color-compass-page-button)' : 'var(--color-text-secondary)',
          }}
        >
          {stop.title}
          {/* ⚠ HYBRID #4 — THE COUNT AS ITS OWN RUN AFTER A RULE, not a
              parenthetical. Built from the stop's own two fields, the same pair
              the lesson number below comes from. Rendered only where there IS a
              count: the completion tasks carry no `hours`, and a rule followed by
              nothing reads as a broken row. */}
          {typeof stop.completed === 'number' && stop.hours ? (
            <>
              <span aria-hidden style={COUNT_RULE} />
              <span style={COUNT}>
                {stop.completed} of {stop.hours} Completed
              </span>
            </>
          ) : null}
        </span>
        {/* ⚠ HYBRID #2 (the other half) — the current row's Begin Course button
            moved to the title area, so every row takes the chevron now and the
            list reads as one kind of thing. The `onBegin` prop went with it
            (`noUnusedLocals`); `AtlasHomeV2.tsx` still has both the prop and the
            branch if this is ever reversed. */}
        {/* ⚠ HYBRID #4 — NO CHEVRON ON A ROW THAT CARRIES A LESSON (2026-10-06,
            the direct ask). The lesson block below is this stop's way in, and
            it is a better one: it NAMES the chapter you would land on, where
            the chevron only pointed at the stop. Two controls one line apart,
            going to the same place, with only one of them saying where.
            ⚠ COMPLETED STOPS KEEP THEIRS — they carry no lesson block, so
            removing it there would leave finished work with no way back in. */}
        {onOpen && lesson === undefined ? (
          <button type="button" className="cre-compass-v2-link" onClick={onOpen} aria-label={`Open ${stop.title}`} style={CHEVRON}>
            <AngleRightRegular size={13} aria-hidden />
          </button>
        ) : null}
      </div>
      {lesson === undefined ? null : (
        /* ⚠ NO PADDING ON THIS ROW, and that is load-bearing. The gutter is
           `alignSelf: stretch`, so it stretches to the row's CONTENT box —
           padding here shortened the spine by exactly that much and left a
           break in the line before the next stop (measured: 6px, 8 with the
           list's own gap). Air around the block goes ON the block. */
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            aria-hidden
            style={{
              width: 14,
              flex: 'none',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span style={SPINE} />
            {/* ⚠ A TARGET, NOT A FILLED DOT. The stop above already wears the
                filled dot for "this is the step you are on"; this mark answers a
                narrower question — WHERE in that step — so it has to read as a
                different kind of thing while staying on the same axis. */}
            <span style={MARK_LESSON}>
              <span style={MARK_LESSON_PIP} />
            </span>
            {last ? <span style={{ flex: '1 1 0' }} /> : <span style={SPINE} />}
          </span>
          {/* DASHED, where the spine is solid: it crosses OUT of the timeline
              to the block rather than continuing along it. */}
          <span aria-hidden style={LESSON_CONNECTOR} />
          {/* ⚠ A BUTTON AROUND THE BLOCK — 2026-10-06, the direct ask: a second
              way into the lesson beside the title area's Resume.
              `cre-lesson-cta` is the hover Testing 3's combined card gives the
              same block, so the one pressable row in this list behaves the same
              in both versions.

              ⚠ IT CARRIES NO `data-cta-id`, because neither does this version's
              Resume button. On Testing 3 both carry `home.resume` DELIBERATELY:
              a moderated run that kills that CTA has to kill both paths, or
              this one keeps working and answers the research question wrongly.
              If Hybrid's Resume is ever tagged, tag this with it.

              ⚠ THE PADDING IS HERE, NOT ON `LESSON_BLOCK`. The hover fill is
              this box, so the air above and below the text has to be inside it
              — on the inner box the fill would hug the words and read as a
              highlight rather than as a row. And no LEFT padding, so the fill
              starts exactly where the green rule does. */}
          <button
            type="button"
            className="cre-lesson-cta"
            onClick={onLesson}
            disabled={!onLesson}
            aria-label={`Resume ${NY_LH_CURRENT_CHAPTER}`}
            style={LESSON_CTA}
          >
            <span style={LESSON_BLOCK}>
              <span style={LESSON_META}>
                Lesson {lesson}
                <span aria-hidden style={LESSON_DOT} />
                {/* ⚠ INVENTED, and named as such at its source — see
                    `NY_LH_LESSON_MINUTES_INVENTED`. */}
                <span style={LESSON_ESTIMATE}>About {NY_LH_LESSON_MINUTES_INVENTED} minutes</span>
              </span>
              {/* ⚠ SPANS, AND BODY FACE. Spans because a `<p>`/`<h3>` inside a
                  `<button>` is invalid — a button may contain only phrasing
                  content, and the DOM re-parents the rest; body face because
                  `atlas-heading-font` re-points the heading token at a serif and
                  a chapter name is a row label, not a heading.
                  `CombinedCourseCard` makes both calls the same way. */}
              <span style={LESSON_ROW}>
                <span style={LESSON_TITLE}>{NY_LH_CURRENT_CHAPTER}</span>
                {/* ⚠ ALWAYS IN THE DOM, only its opacity moves — rendering it
                    on hover alone would reflow the title the moment a cursor
                    crossed the row. The same rule the Quick Links take, and the
                    reason the stop's own chevron could go: this one appears
                    where the pointer already is. */}
                <AngleRightRegular
                  size={13}
                  aria-hidden
                  className="cre-lesson-chevron"
                  style={{ flex: 'none', color: 'var(--color-compass-page-button)' }}
                />
              </span>
            </span>
          </button>
        </div>
      )}
    </li>
  )
}

/**
 * ⚠ HYBRID #3 — STEPS 2 AND 3 COLLAPSE, AND START COLLAPSED.
 *
 * The cognitive-load ask. Pass State Exam and Get Licensed are both months away
 * for a learner on Step 1, and on Eric's home they sit open under the
 * coursework with a paragraph each — so the first screen asks you to read three
 * tasks to find the one you can act on today.
 *
 * ⚠ THE TITLES STAY VISIBLE, which is the difference between collapsing and
 * hiding. The journey is the point of the column: a learner has to be able to
 * see that the course ends in an exam and a licence without being made to read
 * about them yet.
 *
 * ⚠ A REAL `<button>` AROUND THE HEADING, not a click handler on a `<p>`.
 * `aria-expanded` + `aria-controls` is what makes this announce as a disclosure
 * rather than as a heading that mysteriously does something; the chevron is
 * `aria-hidden` because the button's own name already carries the step.
 *
 * ⚠ NOT `<details>`/`<summary>`, deliberately: the step's heading carries the
 * eyebrow and the title as two separate lines with their own type, and a
 * `<summary>` wants one inline label. The ARIA pattern is the same either way.
 */
function Step({
  number,
  title,
  detail,
  link,
  onLink,
}: {
  number: number
  title: string
  detail?: string
  link: string
  onLink?: () => void
}) {
  const [open, setOpen] = useState(false)
  const bodyId = `hybrid-step-${number}-body`
  const hasBody = Boolean(detail || onLink)
  return (
    <section aria-label={title} style={{ display: 'flex', flexDirection: 'column', gap: open ? 14 : 0 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={hasBody ? bodyId : undefined}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          width: '100%',
          padding: 0,
          background: 'transparent',
          border: 'none',
          cursor: hasBody ? 'pointer' : 'default',
          textAlign: 'left',
        }}
        disabled={!hasBody}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          <span style={{ ...STEP_EYEBROW, fontWeight: 700 }}>Step {number}</span>
          <span style={STEP_TITLE}>{title}</span>
        </span>
        {hasBody ? (
          <span
            aria-hidden
            style={{
              display: 'inline-flex',
              flex: 'none',
              marginTop: 4,
              /* ⚠ THE CHEVRON CARRIES BOTH SIGNALS — 2026-10-05, the direct
                 ask: UP and grey when closed, DOWN and blue when open.

                 Direction and colour say the same thing twice on purpose. The
                 steps start collapsed and stay that way for most of the course,
                 so the closed state is the one a learner sees constantly and it
                 should recede; the blue is reserved for the step they chose to
                 open. Rotating from -90° to 90° is one continuous turn through
                 the right-pointing rest position, which is why it reads as the
                 same arrow moving rather than two icons swapping. */
              /* ⚠ `--color-border-subtle` WHEN CLOSED, lighter than the
                 `--color-text-tertiary` it was — 2026-10-06, the direct ask.
                 Safe to go below text contrast because the glyph is
                 `aria-hidden` decoration: the button's own name carries the
                 step, and `aria-expanded` carries the state, so nothing here is
                 the only way to read anything. It is now the same weight as the
                 journey spine and the ring markers in this column, which are
                 the other quiet marks on the page. */
              color: open ? 'var(--color-compass-page-button)' : 'var(--color-border-subtle)',
              transform: open ? 'rotate(90deg)' : 'rotate(-90deg)',
              transition: 'transform 160ms ease, color 160ms ease',
            }}
          >
            <AngleRightRegular size={14} aria-hidden />
          </span>
        ) : null}
      </button>
      {open && hasBody ? (
        <div id={bodyId} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {detail ? <p style={{ ...BODY_TEXT, margin: 0, fontSize: 13, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>{detail}</p> : null}
          {onLink ? (
            <button type="button" className="cre-compass-v2-link" onClick={onLink} style={LINK}>
              {link} →
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/**
 * The TILE shape — `hybrid-quick-links-style: tiles`.
 *
 * ⚠ SQUARE BY RATIO, not by a fixed height, for the reason `HomeTileGrid`
 * records: the card's width moves with the grid, so a hard-coded height is
 * square at exactly one window size.
 *
 * ⚠ NO `border`, `background` OR `color` INLINE — `.cre-tile-cta` owns all
 * three, and an inline value beats the class in the cascade. That is the same
 * trap the hover fill on `SideLink` fell into twice.
 */
function QuickTile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <li style={{ minWidth: 0 }}>
      <button type="button" className="cre-tile-cta" onClick={onClick} disabled={!onClick} style={TILE}>
        <span aria-hidden style={{ display: 'inline-flex' }}>{icon}</span>
        <span style={{ minWidth: 0, textAlign: 'center' }}>{label}</span>
      </button>
    </li>
  )
}

function SideLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      {/* ⚠ HYBRID #9 — `cre-quick-link-row` ADDS THE FILLED HOVER and hides the
          chevron until the row is hovered or FOCUSED. See tokens.css for why
          both states, why `opacity` rather than `display`, and why the fill
          runs wider than the label. The class is additive: the colour and
          weight shift still come from `cre-compass-v2-row`, which Eric's home
          shares — his rows are untouched. */}
      <button
        type="button"
        className="cre-compass-v2-row cre-quick-link-row"
        onClick={onClick}
        disabled={!onClick}
        style={SIDE_ROW}
      >
        <span aria-hidden style={{ width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-compass-page-button)' }}>
          {icon}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>{label}</span>
        <span
          aria-hidden
          className="cre-quick-link-chevron"
          style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}
        >
          <AngleRightRegular size={13} aria-hidden />
        </span>
      </button>
    </li>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY_TEXT: CSSProperties = { fontFamily: 'var(--font-body)' }

const PAGE: CSSProperties = {
  display: 'flex',
  gap: 40,
  alignItems: 'flex-start',
  /* ⚠ `flex-start`, NOT `center` — 2026-10-06, so the card lines up with the
     page header above it. The row is 711 + 40 + 260 = 1011 inside a container
     capped at 1200, and centring it pushed the card ~25px right of the "Home"
     title and its greeting, which sit on the section's own gutter. No inset on
     the header could have fixed that: a fixed gutter cannot track a centred
     row, since the offset changes with the viewport.
     ⚠ THE CONTAINER STILL CENTRES (max-width 1200, margin auto), so past that
     width the whole block moves as one and the header — which takes the same
     cap and margin — moves with it. */
  justifyContent: 'flex-start',
}
/* The Home course card's surface — 14 radius (Figma).
   ⚠ 40 IN, NOT THE FIGMA'S 48 — 2026-10-06, the direct ask. The card carries
   more than Eric's does now (the button pair under the title, the figures
   column, the journey and two collapsible steps), and 48 on all four sides was
   pushing the content in far enough that the right column ran short beside it. */
const CARD: CSSProperties = {
  flex: '0 1 711px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 40,
  boxSizing: 'border-box',
  borderRadius: 14,
  background: 'var(--color-compass-course-card)',
  // No outer stroke (2026-10-02, the designer's request); the Compass MEDIUM
  // shadow lifts it instead (the small one was tried the same day).
  boxShadow: 'var(--shadow-compass-md)',
}
const COVER: CSSProperties = {
  width: 200,
  minHeight: 142,
  flex: 'none',
  objectFit: 'cover',
  borderRadius: 8,
  display: 'block',
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Serif H4, as the V1 course card's title (38 / 40). */
/* ⚠ PACING — the card's first row: name on the left, constraint on the right,
   baseline-aligned so the two type sizes sit on one line rather than centring
   against each other. `margin-bottom` rather than the card's gap, because the
   card is not a flex column — the cover/title block below is its own row. */
const CARD_TOPLINE: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 24,
}
const ACCESS_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16.5px',
  fontWeight: 300,
  color: 'var(--color-text-secondary)',
}
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h4-base-size, 38px)',
  lineHeight: 'var(--type-atlas-h4-base-line, 40px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
/* ⚠ `CHIP` WENT WITH IT — Course Overview was its only user here, and
   `noUnusedLocals` will not keep an unread style. `AtlasHomeV2.tsx` still has
   both the chip and the style if the tag treatment is ever wanted back. */
const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-atlas-nav-rule)' }
const FIGURE_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '14px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
/* The pale panel — the brand's Study Pace tint (`--color-atlas-outlined-card`). */
const PACE_PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  // 22 across, not 24, so "Customize Your Pace ›" fits one line (156 > 152).
  padding: '24px 22px',
  borderRadius: 8,
  background: 'var(--color-atlas-outlined-card, var(--color-compass-page-card))',
  // No shadow — tried 2026-10-02 (Compass small, then 2px at 10–20%) and
  // removed the same day; the tint carries the panel.
}
const DIAL_TEXT: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 3,
  textAlign: 'center',
}
const DIAL_CAPTION: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
const DIAL_FIGURE: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 38,
  lineHeight: '30px',
  letterSpacing: '-0.06em',
  color: 'var(--color-text-primary)',
}
const SMALL_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
/* The design's text links: Open Sans Bold 13, the brand's button colour. */
const LINK: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  // 8, not the design's 10, so "Customize Your Pace ›" holds one line in the
  // pace panel.
  gap: 8,
  whiteSpace: 'nowrap',
  textAlign: 'left',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '19.5px',
  color: 'var(--color-compass-page-button)',
}
const STEP_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '15px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-page-eyebrow)',
}
/* Serif H8 (20 / 24). */
const STEP_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 'var(--type-atlas-h8-base-size, 20px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}
const MARK_CURRENT: CSSProperties = {
  width: 14,
  height: 14,
  boxSizing: 'border-box',
  borderRadius: '50%',
  background: 'var(--color-compass-page-button)',
  border: '2px solid var(--color-compass-page-button)',
  flex: 'none',
}
const MARK: CSSProperties = {
  width: 12,
  height: 12,
  boxSizing: 'border-box',
  borderRadius: '50%',
  // Solid, not the design's dashed (2026-10-02, the designer's request) —
  // the rings and the spine both.
  border: '2px solid var(--color-border-subtle)',
  flex: 'none',
}
/** The lock sits in the same 14px gutter the rings use, so the spine below it
 *  stays on one axis down the whole column. */
const MARK_LOCK: CSSProperties = {
  width: 12,
  height: 12,
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  /* ⚠ `--color-border-subtle`, lighter than the `--color-text-tertiary` it was
     — 2026-10-06, the direct ask, and the same move the closed Step chevron
     took. The lock is `aria-hidden` decoration beside a label that is already
     dimmed, so it is free of text-contrast rules and should not outweigh the
     words it annotates. It now matches the spine it hangs on. */
  color: 'var(--color-border-subtle)',
}

/* ⚠ 1px, DOWN FROM 2 — 2026-10-05, the direct ask. The spine is a connector
   between stops, not a progress track, and at 2 it carried about the same
   weight as the lock glyphs it runs between. `width: 0` with a left border
   rather than a filled 1px box, so the line lands on the device's own hairline
   and stays crisp at any DPR. */
const SPINE: CSSProperties = { flex: '1 1 0', minHeight: 1, width: 0, borderLeft: '1px solid var(--color-border-subtle)' }

/* ── ⚠ HYBRID #4, THE COUNTED STOP AND ITS LESSON ───────────────────────────
   2026-10-06, the direct ask: expand Pre-Licensing Lessons to a one-line
   summary of what is done, and hang the current lesson under it.

   ⚠ NO PERCENTAGE, which is the one place this departs from the Testing 3
   treatment it is modelled on. That rail prints the figure beside the caret
   because it is the only place the number appears; here the dial two columns
   left draws the same percentage at 20× the size. The MARKER is what carries
   over — it says where you are, which the dial cannot.

   ⚠ THE VALUES ARE `StudyJourneyRail`'s AND `CombinedCourseCard`'s, copied
   rather than imported. Those live on a rail this version does not use, and
   lifting them into a shared module would make a Testing 3 tweak reach this
   fork silently — which is the whole reason the home was forked. If the two
   ever need to move together, that is a merge, not an import. */
const COUNT_RULE: CSSProperties = {
  display: 'inline-block',
  width: 1,
  height: '0.9em',
  margin: '0 9px',
  verticalAlign: '-0.1em',
  background: 'var(--color-border-subtle)',
}
/* ⚠ WEIGHT 400 EVEN ON THE CURRENT ROW, which renders its title at 600. The
   name is the row; the count annotates it, and matching the title's weight
   would make a six-word figure compete with the thing it describes. */
const COUNT: CSSProperties = { fontWeight: 400, color: 'var(--color-text-secondary)' }

const MARK_LESSON: CSSProperties = {
  width: 14,
  height: 14,
  boxSizing: 'border-box',
  borderRadius: '50%',
  flex: 'none',
  border: '2px solid var(--color-compass-page-button)',
  /* The card's own ground, not `transparent`: the spine runs behind this mark
     and would otherwise show through the gap between ring and pip. */
  background: 'var(--color-surface-card)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const MARK_LESSON_PIP: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--color-compass-page-button)',
}
const LESSON_CONNECTOR: CSSProperties = {
  width: 10,
  height: 0,
  flex: 'none',
  borderTop: '1px dashed var(--color-border-subtle)',
}
/* ⚠ 14 + 8 + 10 + 8 = 40, against the stop titles' 22. The 18px of extra
   indent is what makes the lesson read as something INSIDE the stop rather
   than as another row of the list — and it is split across the gutter, two
   gaps and the connector, so changing any one of them moves it. */
/* ⚠ THE PRESSABLE BOX, and the air above and below the lesson lives here —
   2026-10-06, the direct ask for more padding. It has to be on the box the
   hover fills: on the inner one the fill would hug the two lines and read as a
   highlight rather than as a row you can press.

   ⚠ NO LEFT PADDING, so the fill's left edge lands exactly on the green rule.
   `CombinedCourseCard` reaches the same place with a negative margin because
   its block is indented from inside; here the indent is already spent on the
   gutter and the connector, so there is nothing to cancel. */
const LESSON_CTA: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  display: 'block',
  textAlign: 'left',
  /* ⚠ NO `background` HERE — `.cre-lesson-cta` owns it, and an inline
     `transparent` BEATS the class's `:hover` in the cascade, so the row keeps
     its chevron and loses its tint. Measured on this component before the fix:
     chevron opacity 1, background still rgba(0,0,0,0) — the identical reading
     `CombinedCourseCard`'s `lessonButton` records, which is the THIRD time this
     repo has hit it. If a class owns a hover, it must own the rest state too.
     Buttons are transparent at rest via Tailwind's preflight, so there is
     nothing to declare. */
  border: 'none',
  cursor: 'pointer',
  margin: '2px 0 4px',
  padding: '8px 10px 8px 0',
}
const LESSON_BLOCK: CSSProperties = {
  display: 'block',
  minWidth: 0,
  /* ⚠ THE GREEN RULE IS THE TEXT'S OWN HEIGHT, by construction — it is on this
     box and this box is the two lines. On any ancestor it would run the full
     height of the padded row and stand ~12px taller than the words it marks,
     which is the correction `CombinedCourseCard` records at `lessonRow`. */
  borderLeft: '3px solid color-mix(in srgb, var(--color-success-500) 45%, var(--color-surface-card))',
  paddingLeft: 10,
}
const LESSON_META: CSSProperties = {
  ...BODY_TEXT,
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  margin: '0 0 3px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const LESSON_DOT: CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  margin: '0 8px',
  background: 'var(--color-neutral-300)',
}
/* The estimate is a sentence, not a label — it drops the tracking and the
   uppercasing the lesson number carries and keeps only the size. */
const LESSON_ESTIMATE: CSSProperties = {
  fontWeight: 400,
  letterSpacing: '0.04em',
  textTransform: 'none',
}
/* Holds the title and the hover chevron on one line, with the chevron pinned
   right so it never sits against a short last word. */
const LESSON_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
}
const LESSON_TITLE: CSSProperties = {
  ...BODY_TEXT,
  display: 'block',
  flex: '1 1 0',
  minWidth: 0,
  margin: 0,
  fontWeight: 700,
  /* ⚠ 13/18, DOWN FROM `CombinedCourseCard`'s 15/20 IN TWO STEPS — 2026-10-06,
     both direct asks. That card prints this line on a wider column with no stop
     titles beside it; here it sits one indent in from 13px stop labels, and at
     15 the nested thing out-sized the step it belongs to.

     ⚠ 13/18 IS THE STOP LABELS' OWN TYPE, which is the reason to stop here
     rather than keep going. The lesson now differs from the rows around it by
     WEIGHT alone — it is the only 700 in the list — so it still reads as the
     thing you are on while sitting in the list's rhythm instead of above it.
     Smaller than this and it is quieter than the stops it belongs to. */
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}
const BEGIN: CSSProperties = {
  ...COMPASS_BUTTON,
  minHeight: 0,
  padding: '5px 8px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
const CHEVRON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: 0,
  height: 18,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-compass-page-button)',
}
/* ⚠ `REQUIREMENTS` WENT WITH ITS BUTTON, 2026-10-05 — `noUnusedLocals` will
   not keep an unread style. `AtlasHomeV2.tsx` still has both. */
/* The side cards: the Atlas rail's 1px rule, 12 radius, 24 / 32 / 32. */
/* ⚠ PACING A — a hairline above it, not a fill. The panel already carries a
   dial and a goal; a tinted box here would make the constraint louder than the
   plan it constrains. */
/* ⚠ PACING E — ICON AND DURATION, NOTHING ELSE. The rows carried their own
   completion dates until 2026-10-07, when the panel gained a single estimate
   that tracks the selection and the per-row copy became a duplicate of it on
   whichever row was chosen. What is left is the smallest thing a choice can be,
   which is also what the 200px column wants. */
const PACE_ESTIMATE: CSSProperties = {
  alignSelf: 'stretch',
  paddingTop: 9,
  borderTop: '1px solid var(--color-atlas-nav-rule)',
}
const PACE_OPT: CSSProperties = {
  ...BODY_TEXT,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 9px',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-atlas-nav-rule)',
  background: 'var(--color-surface-card)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-primary)',
}
/* The selected row takes the palette's own tint and a darker stroke — the same
   two cues the journey's current stop uses, so "this is the one" reads the same
   way in both halves of the card. */
const PACE_OPT_ON: CSSProperties = {
  borderColor: 'var(--color-compass-page-button)',
  background: 'var(--color-atlas-nav-active-fill)',
}
/* ⚠ IT LEADS THE GROUP NOW, so it takes the gap below rather than above and
   `--color-text-secondary` rather than tertiary: it is the section's question,
   not a caption under it, and tertiary read as fine print above the control it
   introduces. Still 11px — the panel is 200px wide and this is two sentences. */
const PACE_PROMPT: CSSProperties = {
  ...BODY_TEXT,
  margin: '0 0 2px',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
const BINDING_NOTE: CSSProperties = {
  ...BODY_TEXT,
  margin: 0,
  paddingTop: 9,
  borderTop: '1px solid var(--color-atlas-nav-rule)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
const SIDE_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 32px 32px',
  boxSizing: 'border-box',
  borderRadius: 12,
  /* ⚠ NO BORDER — 2026-10-05, the direct ask. The exam card above already
     overrode this to `none` (see `SIDE_CARD_LIFTED`), so the outline was the
     only thing making the two side cards differ. Removed from the base rather
     than from the one call site, because there is nothing left that wants it. */
}
const SIDE_CARD_LIFTED: CSSProperties = {
  border: 'none',
  background: 'var(--color-compass-course-card)',
  boxShadow: 'var(--shadow-compass-md)',
}
/* ⚠ `SIDE_BUTTON` WENT 2026-10-05 — it sized the Yes / No pair on Eric's exam
   question, and `ExamScheduleWidget` brings its own controls. Removed rather
   than parked (`noUnusedLocals`); `AtlasHomeV2.tsx` still has it. */
const TILE_GRID: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}

const TILE: CSSProperties = {
  width: '100%',
  aspectRatio: '1',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minWidth: 0,
  padding: 10,
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  fontWeight: 600,
}

const SIDE_ROW: CSSProperties = {
  /* ⚠ `100% + 20px`, MATCHING THE NEGATIVE MARGIN BELOW. `width: 100%` with
     `border-box` sizing means the new 10px side padding eats the TEXT column
     rather than widening the row — "Applying for a License" wrapped to two
     lines the moment the hover box was added. The margin shifts the row out;
     this is what actually makes it wider, so the label keeps every pixel it
     had before the highlight existed. Change one and change the other. */
  width: 'calc(100% + 20px)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  /* ⚠ THE HOVER FILL'S BOX LIVES HERE, NOT IN THE CLASS — 2026-10-05. It was
     `padding: 0`, and an INLINE style beats `.cre-quick-link-row`, so the fill
     rendered as a hairline strip behind the text. The negative margin pulls the
     highlight back out to the card's text edge, so a picked-out row reads as
     the ROW and not as an inset panel. */
  padding: '7px 10px',
  margin: '0 -10px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  /* ⚠ NO `background` HERE — it is `.cre-quick-link-row`'s, and an inline value
     would beat the hover rule exactly the way `padding: 0` beat the box above.
     That one was visible immediately; this one was not, because the chevron
     reveal (a DESCENDANT rule, nothing inline to fight) kept working while the
     fill silently never appeared. The class sets `transparent` at rest. */
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  // Colour on `.cre-compass-v2-row` (tokens.css), so the hover can win.
}
