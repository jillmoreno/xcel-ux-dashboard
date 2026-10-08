import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  ArrowRight,
  BookOpenRegular,
  BookRegular,
  CircleInfoRegular,
  ClipboardListCheckRegular,
  FileCertificateRegular,
  Lock,
  PenFieldRegular,
} from '@/icons'
import {
  CalendarExclamation,
  Check,
  Loveseat,
  MugHot,
  PersonRunningFast,
  TriangleExclamation,
} from '@/icons'
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
import { clearExamDate, readExamDate } from '@/data/examDateStore'
import {
  dateFromIso,
  daysUntil,
  defaultPreset,
  formatHours,
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
  /* ⚠ THE EXPIRY STATE IS FORCED BY A DEMO CONTROL — 2026-10-07, the direct
     ask. ⚠ AND IT OVERRIDES THE DATE, not only the colour: "Access ends June
     11" under an amber warning is a contradiction, because the claim the amber
     makes is that the date is CLOSE. Each arm restates it from `today` so the
     wording, the colour and the icon agree. See `hybrid-course-expiry`. */
  const expiry = useFeatureFlag('hybrid-course-expiry').variant ?? 'normal'
  const expiryDays: Record<string, number> = { soon: 5, urgent: 2, expired: -3 }
  const accessEnd =
    expiry in expiryDays
      ? dateFromIso(isoPlusDays(today, expiryDays[expiry]))
      : accessExpiresAt
        ? dateFromIso(accessExpiresAt)
        : null
  const accessLong = accessEnd
    ? accessEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const accessEndsLabel = !accessLong
    ? null
    : expiry === 'expired'
      ? `Access expired ${accessLong}`
      : expiry === 'urgent'
        ? `Access ends in 2 days — ${accessLong}`
        : expiry === 'soon'
          ? `Access ends in 5 days — ${accessLong}`
          : `Access ends ${accessLong}`
  /* ⚠ THE ICON IS PART OF THE STATE, NOT DECORATION — it is the cue that
     survives a greyscale screen, where colour alone says nothing at all. */
  const accessIcon =
    expiry === 'soon' ? (
      <TriangleExclamation size={13} aria-hidden />
    ) : expiry === 'urgent' || expiry === 'expired' ? (
      <CalendarExclamation size={13} aria-hidden />
    ) : null
  const accessTone =
    expiry === 'soon'
      ? 'var(--color-warning-700)'
      : expiry === 'urgent'
        ? 'var(--color-error-600)'
        : expiry === 'expired'
          ? 'var(--color-neutral-800)'
          : 'var(--color-text-secondary)'

  /* ⚠ 0% CLEARS THE BOOKED EXAM DATE — 2026-10-07, the direct ask. The date
     is per-browser reviewer input (`cgp.examDate`) and survives the Progress
     control, so switching to Not Started otherwise showed a learner who has not
     begun the course already holding an exam booking — and the countdown
     counting down to it.

     ⚠ IT FIRES ON ENTERING 0%, NOT CONTINUOUSLY. The dependency is `notStarted`
     alone, so a date entered WHILE at 0% stays: the reset is about arriving in
     the scenario, and re-clearing on every render would make the widget
     impossible to use at all.

     ⚠ AND IT INTERACTS WITH `hybrid-course-expiry`'s SIBLING, the exam-narrows-
     the-options rule. The pace chooser only exists at 0%, and the date that
     restricts it is now cleared on the way in — so to see one option you must
     set the exam date AFTER switching to Not Started. In that order it works;
     in the other it looks like the restriction is broken.

     ⚠ THE STORE IS GLOBAL, so this reaches every version, not just this fork. A
     date set on Hybrid V1 is gone once anyone visits this version at 0%. That
     is acceptable because the date is a reviewer's own input rather than
     product data — `clearExamDate()` is the documented way back and the card
     offers it — but it is a side effect outside this version and is the one
     thing here that would be wrong to discover by accident. */
  useEffect(() => {
    if (!notStarted) return
    if (readExamDate()) clearExamDate()
  }, [notStarted])

  /* ⚠ THE GREYSCALE IS A ROOT ATTRIBUTE, NOT A STYLE ON THIS SUBTREE, because
     the ask was for the whole screen and this component owns only the home.
     `tokens.css` holds everything visual; here it is one flag on `<html>`.
     ⚠ THE CLEANUP IS LOAD-BEARING: without it, switching the arm back — or
     navigating away — would leave the product grey and unclickable with no
     control on screen still able to undo it. */
  useEffect(() => {
    if (expiry !== 'expired') return
    document.documentElement.dataset.courseExpired = ''
    return () => {
      delete document.documentElement.dataset.courseExpired
    }
  }, [expiry])
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

  /* ⚠ `binding` IS RESOLVED AND UNREAD. `studyPace` still works out which
     deadline squeezes the learner; nothing renders it since 2026-10-07 — see
     the note at its old call site in the pace panel. */

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
  /* ⚠ `tag` NAMES THE PACE — 2026-10-07, the direct ask ("1 Week = Fast Track,
     2 Weeks = Steady, 3 Week = Relaxed"). It is the row's third line and the
     only one that is not a measurement: "1 Week" is a duration and "about 6
     hrs/day" is its cost, and neither says what KIND of plan the learner is
     agreeing to. It is also what makes the middle option legible as the
     default — "Steady" reads as the unremarkable choice in a way that
     "2 Weeks" alone cannot.

     ⚠ THE ICONS WERE ALREADY SAYING THIS, silently: a running figure, a mug, a
     loveseat. The tag is the same scale written down, which is why it is a
     column of this table rather than a lookup somewhere else — an icon swapped
     without its word is how the two come to disagree. */
  const PACE_WEEKS = [
    { weeks: 1, label: '1 Week', tag: 'Fast Track', icon: <PersonRunningFast size={14} aria-hidden /> },
    { weeks: 2, label: '2 Weeks', tag: 'Steady', icon: <MugHot size={14} aria-hidden /> },
    { weeks: 3, label: '3 Weeks', tag: 'Relaxed', icon: <Loveseat size={14} aria-hidden /> },
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
  const unrestricted = paceChoices.length === PACE_WEEKS.length || !examWhen
  const pacePrompt = unrestricted
    ? 'How quickly would you like to complete this course?'
    : paceChoices.length === 1
      ? `Your exam is ${examWhen}, so one week is the only pace that finishes in time. Change your exam date and this will adjust.`
      : `Your exam is ${examWhen}, so the longer paces would finish after it. Change your exam date and this will adjust.`
  /* ⚠ THE SECOND HALF SITS UNDER THE OPTIONS — 2026-10-07, the direct ask, and
     it is a split rather than a move: the two sentences do different jobs and
     were doing them in one 11px paragraph. The lead ASKS THE QUESTION the rows
     answer — they otherwise never say a week of what — so it has to precede
     them. "You can always adjust…" is a reassurance about the choice just
     made, which only means anything once there is one, so it reads after.

     ⚠ ONLY IN THE UNRESTRICTED CASE. The two narrowed messages already end on
     their own escape hatch ("Change your exam date and this will adjust"), and
     a second, more relaxed promise under the options would undercut the
     constraint the paragraph above just explained. */
  const paceNote = unrestricted
    ? 'You can always adjust your goal and customize your study plan once you’re in the course.'
    : null

  /* ⚠ THE SAME ICON THE 0% ROW WOULD HAVE SHOWN. ⚠ AND A FALLBACK, because
     `weeks` is DERIVED from the model and is not confined to the three on
     offer — `Math.round(preset.days / 7)` returns 4 or more on a long access
     window, and `.find` would have returned undefined and rendered nothing
     where an icon belongs. Anything past the longest option takes the longest
     option's icon, which is the honest reading: slower than the slowest. */
  /* ⚠ THE STANDING IS FORCED BY A DEMO CONTROL — 2026-10-07, the direct ask.
     `studyPace` has the real machinery (`weekStanding`, `observedPace`) and
     both need `weekMinutes`, a seven-day fixture this home is never handed.
     Wiring that is a separate job; what the copy needs first is every message
     visible side by side. See `hybrid-pace-standing`. */
  const standing = useFeatureFlag('hybrid-pace-standing').variant ?? 'on-track'

  /* The GOAL in hours a week — the model's own figure for the chosen pace, so
     the sentence and the "{weeks} Weeks" row above it cannot disagree. */
  const goalHoursPerWeek = Number.isFinite(preset.minsPerWeek) ? preset.minsPerWeek / 60 : 0
  /* ⚠ SCENARIO DATA, NOT A MEASUREMENT. The average is the goal scaled by the
     arm, so the two numbers in the sentence always agree with each other and
     with the pace above — but it is not a reading of what anyone did. The
     moment `weekMinutes` reaches this component, this whole block is replaced
     by `observedPace` and the arm becomes a preview of a real state. */
  const OBSERVED_FACTOR: Record<string, number> = {
    ahead: 1.3,
    'on-track': 1.0,
    behind: 0.7,
    'off-track': 0.4,
  }
  const observedHours = goalHoursPerWeek * (OBSERVED_FACTOR[standing] ?? 1)
  const averaging = `You’re averaging ${formatHours(observedHours)} a week.`
  /* ⚠ ADJECTIVAL, NOT PLURAL — every use below is "your … goal", where the
     plural form reads "your 2 weeks goal". Hyphenated and singular is what that
     slot takes; the plural noun is not needed anywhere here. */
  const goalWeeks = `${weeks}-week`

  /* ⚠ FIVE MESSAGES, NOT THREE, and the split that matters is BEHIND vs OFF
     TRACK. Behind is a gap the learner can still close inside the goal they
     chose, so the message is a nudge. Off track says the goal no longer fits —
     the only state with an action attached, and the ask was explicit that it
     sends them to the Study Plan. Collapsing the two lost that action, which is
     the whole reason the state is worth reporting at all. */
  const standingMessage =
    standing === 'no-data'
      ? `No study time logged yet this week. Your ${goalWeeks} goal asks for about ${formatHours(goalHoursPerWeek)} a week.`
      : standing === 'ahead'
        ? `${averaging} That is ahead of your ${goalWeeks} goal — keep this up and you will finish early.`
        : standing === 'behind'
          ? `${averaging} That is a little under your ${goalWeeks} goal. A short extra session this week closes the gap.`
          : standing === 'off-track'
            ? `${averaging} At this rate you will not finish by ${formatPaceDate(preset.finishIso)}. Open your Study Plan to adjust your goal.`
            : `${averaging} Based on your study goal, you are right on track.`

  /* ⚠ THE DAILY LOAD EACH OPTION ASKS FOR — 2026-10-07, the direct ask for "a
     sub line that gives an appx — about 3 hrs / day". It is what makes the
     three rows comparable: "1 Week" and "3 Weeks" are durations, and a learner
     cannot weigh them without knowing what each one costs an evening.

     ⚠ PER DAY, NOT PER STUDY NIGHT, and the two are different numbers. The pace
     model divides by nights STUDIED — `observedPace` argues at length that
     dividing by elapsed days gives "a figure they will never recognise". That
     argument holds once a learner has a schedule; here they have not chosen one
     yet, so there are no nights to divide by and every day is a candidate. The
     ask said "/ day" and that is also the only honest denominator at this
     point.

     ⚠ DECIMAL AND ROUNDED UP, NOT `formatHours` — 2026-10-07, the direct ask.
     That helper renders quarter-hour FRACTIONS ("5¾ hours"), which is right for
     a figure you read once and wrong for three you are comparing: ¾ against ½
     against ¼ is arithmetic the reader has to do to rank the options. Halves
     and decimals rank at a glance.

     ⚠ UP, NEVER TO NEAREST, and that is the honest direction for a commitment.
     `Math.ceil(h * 2) / 2` means the number on screen is a load the learner
     will not be asked to exceed; rounding 2.9 down to 2.5 would understate what
     they are agreeing to on the one screen where they agree to it.

     ⚠ NO TRAILING ".0" — "3 hrs/day", not "3.0 hrs/day". The decimal appears
     only when it is carrying a half.

     ⚠ THE COST IS MIXED NOTATION ON ONE CARD: the standing message above still
     says "11¾ hours a week" via `formatHours`. Deliberate for now — the ask was
     about these rows — and the resolution is to move that line to decimals too,
     not to put fractions back here. */
  const perDayFor = (w: number) => {
    const hours = hoursRemaining / (w * 7)
    if (!Number.isFinite(hours) || hours <= 0) return null
    const half = Math.ceil(hours * 2) / 2
    /* ⚠ SINGULAR ONLY AT EXACTLY 1. A sweep across plausible `hoursRemaining`
       turned up "about 1 hrs/day" — 10 hours over two weeks — which no other
       value reaches. 0.5 takes the plural, as it should. */
    const unit = half === 1 ? 'hr' : 'hrs'
    return `about ${Number.isInteger(half) ? half : half.toFixed(1)} ${unit}/day`
  }

  const paceIcon = (PACE_WEEKS.find((o) => o.weeks === weeks) ?? PACE_WEEKS[PACE_WEEKS.length - 1]).icon

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
  /* ⚠ THE LESSON BLOCK IS BEHIND A FLAG AND OFF — 2026-10-07, the direct ask.
     `showLesson` below answers "is there a lesson to name"; this answers
     "should we name it", and they are different questions — the first is data,
     the second is a design decision that had never been made explicitly.
     See `hybrid-lesson-block`: scoped to this version, so Hybrid V1 keeps the
     block whatever this is set to. */
  const lessonBlock = useFeatureFlag('hybrid-lesson-block').enabled
  /* ⚠ THE SAME FACT, THE OTHER PLACE — 2026-10-07, the direct ask. The journey
     block names the lesson where the learner is in the LIST; this names it
     beside Resume Course, where the action is. On by default, with the block
     off, so the lesson is stated once and next to the button that opens it.
     See `hybrid-title-lesson`. */
  const titleLesson = useFeatureFlag('hybrid-title-lesson').enabled

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
    /* ⚠ FLASHCARDS AND EXAM SIMULATOR WERE HERE — removed 2026-10-07, the
       direct ask. Both opened course pages (`go('course', 'flashcards')` and
       `'exam-simulator'`), so unlike the sheets below them they had another way
       in: the course itself. ⚠ THIS LIST WAS THE ONLY ROUTE TO THEM FROM HOME,
       though — restoring is the two lines in git plus their icons, which went
       with them because `noUnusedLocals` will not keep an unused import. */
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
          {accessEndsLabel ? (
            <p style={{ ...ACCESS_NOTE, color: accessTone, fontWeight: expiry === 'normal' ? 300 : 500 }}>
              {accessIcon ? (
                <span aria-hidden style={{ display: 'inline-flex', verticalAlign: '-2px', marginRight: 6 }}>
                  {accessIcon}
                </span>
              ) : null}
              {accessEndsLabel}
            </p>
          ) : null}
        </div>
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {coverUrl ? <img src={coverUrl} alt="" aria-hidden style={COVER} /> : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            {/* ⚠ ITS EYEBROW WRAPPER WENT WITH IT. The `gap: 8` column existed
                to pair the eyebrow with the title; with one child left the
                parent's own `gap: 15` is what separates the title from the
                buttons, which is what it already did for the pair. */}
            {/* ⚠ TITLE AND LESSON ARE ONE BLOCK, at a tighter gap than the
                column's own 15. The line is a subtitle on the course, not a
                third sibling between the heading and its buttons — at 15 it
                floated equidistant between the two and belonged to neither. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 className="cre-compass-course-title" style={TITLE}>
                {courseTitle}
              </h2>
              {/* ⚠ THE SAME `showLesson` THE JOURNEY BLOCK USES, so the two
                  cannot disagree about whether there IS a lesson in progress —
                  only about where to say it. `notStarted` is already inside
                  that guard; the button beside this reads Begin Course there,
                  and a lesson line over it would name work not begun. */}
              {titleLesson && showLesson ? (
                <p style={TITLE_LESSON}>
                  <span style={{ fontWeight: 600 }}>Lesson {(lessonsDone ?? 0) + 1}</span>
                  <span aria-hidden style={{ margin: '0 7px', color: 'var(--color-neutral-300)' }}>
                    ·
                  </span>
                  {NY_LH_CURRENT_CHAPTER}
                </p>
              ) : null}
            </div>
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
              {/* ⚠ TWO EYEBROWS IN PROGRESS, ONE AT 0% — 2026-10-07, the direct
                  ask: "move this below the graph and then add an additional
                  eyebrow - Course Progress". The panel holds two subjects once
                  the dial is in it — what you have DONE and what you PLAN — and
                  one heading over both made the plan look like a caption on the
                  dial. Each now names the thing under it.

                  At 0% there is no dial and no second subject, so the single
                  heading stays and is the question instead. */}
              {notStarted ? null : (
                <p style={{ ...EYEBROW, alignSelf: 'stretch' }}>Course progress</p>
              )}
              {notStarted ? null : <ProgressDial percent={percent} />}
              {/* ⚠ "GOAL" IN PROGRESS, "PACE" AT 0% — 2026-10-07, the direct
                  ask, and the two words are doing different jobs. At 0% the
                  learner is SETTING a pace, which is the act. Once running, what
                  the panel reports is the GOAL that pace was chosen to meet —
                  the same word the messages under it use ("your 2-week goal",
                  "adjust your goal"), so the heading and the copy finally name
                  one thing. */}
              <p style={{ ...EYEBROW, alignSelf: 'stretch' }}>
                {notStarted ? 'Set Your Study Pace' : 'Your study goal'}
              </p>
              {notStarted ? (
                /* ⚠ SPACING RAISED THROUGHOUT — 2026-10-07, the direct ask, and
                   the restructure is what made it ONE number to raise rather
                   than four. The prompt and the estimate used to sit INSIDE the
                   radiogroup, so a single `gap: 6` was doing three unrelated
                   jobs: question-to-options, option-to-option, and
                   options-to-estimate. ⚠ A radiogroup should also hold radios
                   and nothing else — the prompt and the estimate are not
                   choices, and a screen reader walking the group announced them
                   as if they were. */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignSelf: 'stretch' }}>
                  {/* ⚠ ABOVE THE OPTIONS, NOT UNDER THEM — 2026-10-07, the
                      direct ask. Under the group it was a reassurance about a
                      choice already made; over it, it introduces the rows,
                      which they need since "1 Week / 2 Weeks / 3 Weeks" alone
                      never says a week of WHAT.

                      ⚠ IT IS A QUESTION AGAIN — asked for twice, and the round
                      trip is the record worth keeping. It left briefly on
                      2026-10-07 for a statement ("Pick the pace that feels
                      right for you…") on the argument that a question put the
                      whole weight of the decision here, on a screen where the
                      learner has seen nothing of the course yet. What actually
                      answered that was the SPLIT below, not the mood: the "you
                      can always adjust" half now sits under the options and
                      carries the not-final part on its own, which leaves the
                      lead free to do the one job a heading over three
                      durations has to do — say what they are durations OF.

                      ⚠ IT IS ONLY THE UNRESTRICTED COPY. When the exam date
                      narrows the options, `pacePrompt` says so instead — that
                      message has to explain an absence and cannot be replaced
                      by an invitation. */}
                  <p style={PACE_PROMPT}>{pacePrompt}</p>
                  <div
                    role="radiogroup"
                    aria-label="Set your study pace"
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
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
                          {/* ⚠ THE ICON FLIPS WITH THE ROW. At slate-on-slate it
                              would be invisible — the glyph took the same token
                              the fill now uses. */}
                          <span
                            aria-hidden
                            style={{
                              display: 'inline-flex',
                              flex: 'none',
                              color: on
                                ? 'var(--color-compass-page-button-ink)'
                                : 'var(--color-compass-page-button)',
                            }}
                          >
                            {opt.icon}
                          </span>
                          {/* ⚠ NO DATE ON THE ROW — 2026-10-07, the direct ask,
                              reversing "each selection should have an Estimated
                              Completion Date" from earlier the same day. Both
                              were right in turn: the date belonged in this
                              section, and once the section CLOSES with it,
                              putting it on the rows made one of three rows
                              repeat the summary underneath. The row is the
                              choice; the line below is its consequence. */}
                          {/* ⚠ TWO LINES IN ONE COLUMN, so the icon and the tick
                              stay centred against the pair rather than against
                              the first line. */}
                          <span style={{ flex: '1 1 0', minWidth: 0 }}>
                            {/* ⚠ `data-pace-label` IS FOR THE TESTS, deliberately.
                                They asserted the option list by reading the
                                row's whole `textContent`, which broke the moment
                                the sub-line arrived — the row now says "1 Week
                                about 5¾ hrs/day". An explicit hook means the
                                list assertions pin the OPTIONS and copy changes
                                under them are free. */}
                            <span data-pace-label style={{ display: 'block', fontWeight: on ? 600 : 400 }}>
                              {opt.label}
                            </span>
                            {/* ⚠ THE SUB-LINE TAKES THE ROW'S OWN INK WHEN
                                SELECTED. On the slate fill a secondary grey is
                                near-invisible, and dimming white with opacity
                                is what the token system exists to avoid — so it
                                inherits and relies on size for hierarchy. */}
                            {perDayFor(opt.weeks) ? (
                              <span
                                style={{
                                  display: 'block',
                                  marginTop: 1,
                                  fontSize: 10,
                                  lineHeight: '14px',
                                  color: on ? 'inherit' : 'var(--color-text-secondary)',
                                }}
                              >
                                {perDayFor(opt.weeks)}
                              </span>
                            ) : null}
                            {/* ⚠ THE THIRD LINE IS A DIFFERENT REGISTER, not a
                                third grey sentence — 2026-10-07. Two 10px
                                secondary lines under the label would have read
                                as one wrapped paragraph, which is the failure
                                a third line invites. Uppercase and tracked is
                                the eyebrow idiom this panel already speaks
                                ("SET YOUR STUDY PACE", "ESTIMATED COMPLETION"),
                                so it separates without introducing a treatment
                                the card has never used.

                                ⚠ AND IT INHERITS WHEN SELECTED, for the same
                                reason the hours line does: a secondary grey
                                disappears on the slate fill. */}
                            {opt.tag ? (
                              <span
                                style={{
                                  display: 'block',
                                  marginTop: 2,
                                  fontSize: 9,
                                  lineHeight: '12px',
                                  fontWeight: 600,
                                  letterSpacing: '0.07em',
                                  textTransform: 'uppercase',
                                  color: on ? 'inherit' : 'var(--color-text-secondary)',
                                }}
                              >
                                {opt.tag}
                              </span>
                            ) : null}
                          </span>
                          {/* ⚠ `aria-hidden` — `aria-checked` on the row already
                              says this, and a tick announced after the label
                              would read as part of the option's name. It is
                              rendered only when on: the label is `flex: 1 1 0`
                              and left-aligned, so nothing shifts as it appears. */}
                          {on ? (
                            <Check
                              size={13}
                              aria-hidden
                              style={{ flex: 'none', color: 'var(--color-compass-page-button-ink)' }}
                            />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                  {/* ⚠ OUTSIDE THE RADIOGROUP, like the prompt above it. It is
                      not a choice, and inside the group a screen reader walks
                      it as though it were one. */}
                  {paceNote ? <p style={PACE_PROMPT}>{paceNote}</p> : null}
                  {/* ⚠ IT TRACKS THE SELECTION, which is what makes moving it
                      here worth doing rather than merely tidier: at 0% the date
                      is not a report, it is what the option you are about to
                      pick would COST you, and it changes as you choose. */}
                  <PaceEstimate
                    value={formatPaceDate(isoPlusDays(today, selectedWeeks * 7))}
                    note={`At ${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'}`}
                  />
                </div>
              ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, alignSelf: 'stretch' }}>
                {/* ⚠ NOT THE SELECTED ROW — 2026-10-07, the direct ask, and this
                    reverses "match what the user selected at the 0%" from
                    earlier the same day. Both readings were right about
                    something. The 0% row is a CONTROL in its chosen state: a
                    fill, a border and a tick all say "this one, of several".
                    In progress there is nothing to choose between — the pace is
                    settled — so the same drawing promised an interaction the
                    panel does not offer, and a tick marked a selection out of a
                    set of one.

                    What carries over is the ICON, which is the part that
                    identifies the pace; the chrome around it is what said
                    "pick me". `View Study Plan` below is still how it changes.

                    ⚠ "Complete in 2 Weeks", not "2 Weeks". Stripped of the row,
                    the bare duration had no verb and no subject — on a control
                    the label is the option's name, on a statement it has to be
                    a statement. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    aria-hidden
                    style={{ display: 'inline-flex', flex: 'none', color: 'var(--color-compass-page-button)' }}
                  >
                    {paceIcon}
                  </span>
                  <span style={{ ...BODY_TEXT, fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    Complete in {weeks} {weeks === 1 ? 'Week' : 'Weeks'}
                  </span>
                </div>
                {/* ⚠ IT REPORTS, IT NO LONGER RESTATES. The line read "Your
                    default pace is set for you to complete your course in 2
                    weeks. You can change your pace below." — the first half
                    repeated the row directly above it, and the second described
                    a link. Neither told the learner how they were doing, which
                    is the one thing the panel could say and did not. */}
                <p style={SMALL_TEXT}>{standingMessage}</p>
                {/* ⚠ THE BINDING NOTE WAS HERE AND IS GONE — 2026-10-07, the
                    direct ask, and it had been overtaken. It read "Set by your
                    access — ends May 29" and earned its place while the access
                    date lived in the figures column beside the pace; once that
                    date moved to the CARD'S TOP LINE — "Access ends May 29",
                    the same words — the note became the second place on one
                    screen saying it.

                    ⚠ WHAT IT ALONE CARRIED WAS THE CAUSAL CLAIM, that the
                    deadline is what SET this pace, where the top line states it
                    as a bare fact. `studyPace` still resolves `binding` in
                    `resolveCeiling` and nothing renders it now. To restore:
                    derive from `model.binding`, and name `accessExpiresAt`
                    rather than `model.hardEndIso` — the ceiling is the expiry
                    MINUS ONE, and printing it disagreed with the figure by a
                    day, which is the bug that fix already cost once. */}
                <PaceEstimate
                  value={preset.state === 'no' ? 'Not achievable' : formatPaceDate(preset.finishIso)}
                  note="At current pace"
                />
                {/* ⚠ THE LINK MOVED BELOW THE ESTIMATE AND TOOK A RULE WITH IT —
                    2026-10-07, the direct ask. Between the sentence and the
                    estimate it interrupted the panel's one line of reasoning:
                    this is your pace, here is when it finishes. A way OUT of
                    the panel belongs after the panel has finished speaking.

                    ⚠ RENAMED "View Study Plan", which is also more honest about
                    where it goes — `go('study-plan')` has always opened the
                    Study Plan, and "Customize Your Pace" promised an edit the
                    link itself does not perform.

                    ⚠ ITS OWN RULE, NOT `RULE`. That style is a full-width 1px
                    block used between the card's sections; this is the same
                    hairline `PaceEstimate` carries above itself, so the two
                    dividers that bracket the estimate are the same object. */}
                <div style={PACE_LINK_ROW}>
                  <button type="button" className="cre-compass-v2-link" onClick={() => go('study-plan')} style={LINK}>
                    View Study Plan
                    <AngleRightRegular size={13} aria-hidden />
                  </button>
                </div>
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
                    lesson={
                      lessonBlock && showLesson && i === currentIdx ? (lessonsDone ?? 0) + 1 : undefined
                    }
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
          /* ⚠ ONE PROP FOR THE WHOLE TREATMENT — 2026-10-07. It was four
           booleans (`unsetEyebrow`, `promptHeading`, `affirmativeFirst`, and a
           fifth for the saved card's spacing), each added as its own ask, and
           by the fourth nothing in the signature said they describe ONE look or
           that three of them only make sense together. `pacing` is: no eyebrow
           before a date exists, the question in the heading face, the
           affirmative first, and the saved date pulled up under its eyebrow. */
        treatment="pacing"
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
            which (the two sheets and the two course pages) had no other
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
          /* ⚠ THE SLATE, AND IT WENT GREEN FOR ONE COMMIT — 2026-10-07. The
             arc took `HIGHLIGHT_GREEN` to match the current stop's ring, and
             changed straight back on sight. Worth the line: the green marks a
             POSITION — the stop you are on, the lesson you are in — and the
             arc is a QUANTITY. Lending it the same colour said the two were
             the same kind of fact, and at 6px across a 149px ring the light
             mix also sat much weaker against the track than the slate does. */
          style={{ stroke: 'var(--color-compass-page-button)' }}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* ⚠ "Course Progress" LEFT THE RING on 2026-10-07, when the eyebrow
          above the dial took those exact words — the two together read
          "COURSE PROGRESS / Course Progress / 62% / Complete". The figure and
          its unit are what the ring is for; the label is what the eyebrow is
          for. ⚠ The `aria-label` on the wrapper still says "Course progress N%
          complete", so nothing was lost for a screen reader — this block is
          `aria-hidden` and always was. To restore it, put the two-line span
          back above the figure. */}
      <div aria-hidden style={DIAL_TEXT}>
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

/* ⚠ THE HIGHLIGHT GREEN, SPELLED ONCE — 2026-10-07, when the progress arc
   became the third user of it. It marks "this is where you are": the rule down
   the lesson block, the ring around the current stop, and now the dial's filled
   arc. Three copies of the same `color-mix` is three chances for one of them to
   drift, and the whole value of the colour is that the three agree.

   ⚠ MIXED AGAINST `--color-surface-card`, NOT THE SURFACE EACH ONE SITS ON. The
   dial is on the grey pace panel and the others are on the card, so mixing per
   context would give three different greens — which is exactly what this exists
   to prevent. The mix is a recipe for ONE colour, not a blend with the backdrop. */
const HIGHLIGHT_GREEN = 'color-mix(in srgb, var(--color-success-500) 45%, var(--color-surface-card))'

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
  /* ⚠ NO SPACE BELOW IT — 2026-10-07, the direct ask. It had 24, which put the
     line a third of the way into the card's own 40px of top padding and made it
     read as a separate band rather than as the card's first line. Flush against
     the cover/title row, the card reads as one block with a label on it. */
}
const ACCESS_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16.5px',
  fontWeight: 300,
  color: 'var(--color-text-secondary)',
}
/* One line under the course title. Body face, not the heading serif: it is a
   label on the heading rather than a second heading — the same call the lesson
   block's chapter name makes, and for the same reason (`atlas-heading-font`
   re-points the heading token at a serif). */
const TITLE_LESSON: CSSProperties = {
  ...BODY_TEXT,
  margin: 0,
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
  /* ⚠ ONE LINE, ENFORCED — the ask was for "a one-line", and left to wrap this
     one is right on the edge: measured, the full string needs 377px in a column
     that is 377px, so it sits on one line at this card width and breaks to two
     the moment the card is narrower. A rule that holds only at one viewport is
     not a rule. The chapter name truncates instead; the lesson NUMBER, which is
     what the line is for, is first and never truncates.
     ⚠ If the ellipsis reads badly, the alternative is to drop the chapter for
     the estimate — "Lesson 27 · About 18 minutes" measures 178px and always
     fits — rather than to let it wrap. */
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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
  /* ⚠ 16 ACROSS, DOWN FROM 22 — 2026-10-07, the direct ask, and the margin it
     was missing was ONE PIXEL. Measured: "Complete in 2 Weeks" needs 135px of
     type plus the 14px icon and the 8px gap = 157, in a content box that was
     156. At 16 the box is 168 and the line has 11px to spare, which also holds
     for a two-digit goal ("Complete in 10 Weeks").
     ⚠ THE DIAL IS THE OTHER CONSTRAINT and is unaffected: it is 149 wide, so
     the padding could come in further still before it bound. Vertical stays
     24 — nothing up there was tight. */
  padding: '24px 16px',
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
/* ⚠ A SOLID DOT INSIDE A LIGHT-GREEN RING — 2026-10-07, the direct ask.
   ⚠ THE RING IS A `box-shadow`, NOT A BORDER, and that is the load-bearing
   choice: a border grows the box, and this mark sits in a 14px gutter whose
   centre the spine above and below it is drawn to. A 3px border would push the
   dot off that axis and bend the line; a spread shadow paints outside the box
   and changes no layout at all.

   The green is the one already on this card — the lesson block's left rule
   mixes `--color-success-500` to 45% — so the two marks of "here" agree rather
   than introducing a second green. */
const MARK_CURRENT: CSSProperties = {
  /* ⚠ 8, DOWN FROM 14 — 2026-10-07, the direct ask for space between the dot
     and its ring. The ring did not move outward; the DOT came in, so the mark's
     overall footprint is unchanged and the stops below it keep their axis. */
  width: 8,
  height: 8,
  boxSizing: 'border-box',
  borderRadius: '50%',
  background: 'var(--color-compass-page-button)',
  /* ⚠ TWO SHADOWS, AND THE FIRST ONE IS THE GAP. A spread shadow in the card's
     own colour paints the ring of empty space; the green one sits outside it.
     Drawn with shadows rather than a border and a wrapper for the same reason
     as before — neither affects layout, so the 14px gutter and the spine the
     stops are drawn to do not move. ⚠ ORDER MATTERS: the first shadow is on
     top, so the gap must be listed before the green or the green fills it.
     ⚠ `--color-compass-course-card` is the surface this actually sits on
     (#fcfcfb), not `--color-surface-card` — a pure white gap on an off-white
     card is a ring of a third colour, visible once you look for it. */
  boxShadow:
    `0 0 0 3px var(--color-compass-course-card), 0 0 0 6px ${HIGHLIGHT_GREEN}`,
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
  borderLeft: `3px solid ${HIGHLIGHT_GREEN}`,
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
/* The rule that closes the panel, matching the one `PaceEstimate` opens with so
   the estimate reads as bracketed rather than merely preceded. */
const PACE_LINK_ROW: CSSProperties = {
  alignSelf: 'stretch',
  paddingTop: 12,
  borderTop: '1px solid var(--color-atlas-nav-rule)',
}
const PACE_ESTIMATE: CSSProperties = {
  alignSelf: 'stretch',
  /* Its own padding ON TOP of the column's gap, because the hairline needs to
     sit clear of the last option rather than hard against it. */
  paddingTop: 12,
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
  /* ⚠ LONGHANDS, NOT THE `border` SHORTHAND — 2026-10-07, and this is a bug fix
     rather than a preference. It was `border: '1px solid …'` here with
     `borderColor` in the selected object, and React cannot diff a shorthand
     against a longhand: deselecting a row removed `borderColor` without
     restoring the shorthand, so the row kept `border-style`/`width` from the
     shorthand and fell back to the UA's border colour. Measured on the page —
     a deselected row read `rgb(58, 58, 58)`, near-black, where the rule is
     `rgb(224, 219, 205)`. Both objects set the same three longhands now, so
     every property that one sets the other overwrites. */
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-atlas-nav-rule)',
  background: 'var(--color-surface-card)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-primary)',
}
/* ⚠ FILLED SLATE, NOT A TINT — 2026-10-07, after "the selected version of this
   blends in too much". It took `--color-atlas-nav-active-fill`, which under the
   shipped skin resolves to #eceef0 — THE SAME VALUE as the panel's own
   `--color-atlas-outlined-card`. So the chosen row was the one row painted the
   colour of the surface behind it: the unselected rows were white and looked
   raised, and the selection read as a hole. Measured, not guessed — panel and
   selected row both `rgb(236, 238, 240)`.

   The fill is now `--color-compass-page-button`, which is what Begin Course
   uses, so "the one I chose" is drawn in the same ink as "the one that acts"
   and the two readings reinforce rather than compete. Its paired ink token
   comes with it; a hard white here would break under a dark theme.

   ⚠ AND THE STATE NO LONGER RESTS ON COLOUR ALONE — the row takes a tick. Fill
   plus weight is two cues that both fail for the same reader; a glyph does not. */
/* ⚠ A DARKER SHADE OF THE CTA, DERIVED RATHER THAN NAMED — 2026-10-07, the
   direct ask for "a different shade from the cta color, maybe a darker shade".

   It is mixed from the CTA itself, which is the whole reason this is a
   `color-mix` and not a token: the row then sits a fixed step below whatever
   the CTA is, under every brand skin, instead of being a second colour that has
   to be kept in step by hand. Related to the button by construction, distinct
   from it by 22%.

   ⚠ AND IT IS WHY NO EXISTING TOKEN WAS USED. `--color-atlas-topnav-current`
   (#31485c) is the semantically perfect name — the CURRENT item's fill — and is
   defined PER SKIN, resolving to something else entirely outside the Global
   one. That is the same shape as the two bugs already fixed today; a fill-based
   state cannot rest on a token that moves.

   ⚠ MIXED TOWARD `--color-primary-900`, not black or a neutral.
   `--color-neutral-900` INVERTS under the dark theme (#202020 → #f1f3f7), so
   mixing toward it would LIGHTEN the row in dark mode — the opposite of the
   ask. Every `--color-primary-900` in the file is a dark navy, so this darkens
   in both themes. Resolves to about #33 4c 62 against the CTA's #3d5a73, and
   white ink gains contrast rather than losing it. */
const PACE_OPT_ON: CSSProperties = {
  borderColor: 'color-mix(in srgb, var(--color-compass-page-button) 78%, var(--color-primary-900))',
  background: 'color-mix(in srgb, var(--color-compass-page-button) 78%, var(--color-primary-900))',
  color: 'var(--color-compass-page-button-ink)',
}
/* ⚠ IT LEADS THE GROUP NOW, so it takes the gap below rather than above and
   `--color-text-secondary` rather than tertiary: it is the section's question,
   not a caption under it, and tertiary read as fine print above the control it
   introduces. Still 11px — the panel is 200px wide and this is two sentences. */
const PACE_PROMPT: CSSProperties = {
  ...BODY_TEXT,
  /* ⚠ NO MARGIN — the column's `gap` owns every space in this section now
     (2026-10-07). A margin here would add to it and put this one gap out of
     step with the others for no reason a reader could see. */
  margin: 0,
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
