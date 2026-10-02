import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import { useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronDown, ChevronRight } from '@/icons'
import {
  NY_LH_CURRENT_CHAPTER,
  NY_LH_LESSON_MINUTES_INVENTED,
} from '@/data/nyProducerRequirements'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { StudyJourneyRail } from './StudyJourneyRail'
import { journeyStopsFor } from './studyJourneyUtil'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  NY_LH_EXAM_SIMULATORS,
  NY_LH_PREP_REVIEW_LESSONS,
} from '@/data/nyProducerRequirements'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'

/**
 * THE COURSE AND ITS COURSEWORK, AS ONE CARD — Testing 3, 2026-10-01.
 *
 * ⚠ A FORK OF `CourseEntryCard`, NOT A MODE OF IT. That file is untouched and
 * still what every other version renders; this one is Testing 3's in full.
 * CLAUDE.md's rule for changing something that already exists, and the reason
 * the two can be held side by side rather than one replaced on a hunch.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA — the other half of that rule, and the
 * part that is easy to get wrong. The coursework half is `StudyJourneyRail`
 * ITSELF, rendered inside this card rather than redrawn: the stops, their
 * statuses, the counts and the View All route all come from the same component
 * the Study Journey column uses. If the two duplicated that list, the
 * comparison would stop being about the combination and start being about
 * which copy was updated last.
 *
 * THE ARGUMENT. "Current course" and "Complete coursework" are the same subject
 * in two columns. Both name the course; both say how far through it the learner
 * is — one as a percentage and a bar, the other as six stops with ticks. A
 * learner reading down the page meets that progress twice in two shapes and has
 * to work out for themselves that they agree. This says it once: identity and
 * the action at the top, then the stops that the percentage is made of.
 *
 * ⚠ THE NUMBERING IS SETTLED: THIS BLOCK IS STEP 1 (2026-10-01, the direct
 * ask). The rail is given `stepRange` + `stepNumber={1}`, so its eyebrow reads
 * "Step 1 · Atlas Study Journey" and the journey column carries on at Step 2.
 *
 * It wrote a bare "Atlas Study Journey" for one build, which left the page
 * running: block (unnumbered), Step 2, Step 3, Step 4 — step 1 existing but
 * labelled nowhere. The other way out was renumbering the column 1-3, and that
 * says the journey HAS three steps, which is a different claim about the
 * product. The coursework did not stop being step 1; it moved.
 *
 * ⚠ SO THE NUMBERS NOW SPAN TWO COLUMNS, which is this version's real cost and
 * the thing to judge: 1 is in the left column inside the combined block, and
 * 2-4 are cards down the right. They read in order going down the page, but
 * they are not in one line of sight.
 */
export function CombinedCourseCard({
  courseTitle,
  cover,
  percent,
  stats,
  lessonsCompleted,
  complete = false,
  showDetails = false,
  path,
  onResume,
  onDetails,
  onViewAll,
  onOpenStep,
  onOpenRequirements,
}: {
  courseTitle: string
  cover?: string | null
  percent: number
  stats: { value: string; caption: string }[]
  lessonsCompleted: number
  complete?: boolean
  showDetails?: boolean
  /** The journey the coursework half draws. Same object the Study Journey
   *  column is given, so the two cannot describe different coursework. */
  path: LearningPathSummary
  onResume?: () => void
  onDetails?: () => void
  onViewAll?: () => void
  /*
   * ⚠ `onOpenStep` CAME BACK ON 2026-10-02, and this note used to argue against
   * it. The fork dropped it with `hideSheetLink` on the grounds that the steps
   * carry their detail INLINE behind the disclosure and the right rail already
   * owns the sheet shortcuts, so a link here would be "the second copy that
   * `hideSheetLink` existed to prevent".
   *
   * The ask settles that trade the other way, and the reasoning is worth
   * keeping rather than deleting: the duplication is REAL and now deliberate.
   * Exam Information, Applying for License and State Requirements are each on
   * screen twice — once as a tile in the right rail, once at the foot of the
   * step they belong to. What changed is the reading: the rail is a flat list
   * of places, and a learner who has just opened "Pass State Exam" is asking
   * about THAT step, not scanning a list. The cost is that breaking one of
   * these in a moderated run breaks both copies (they share CTA ids, on
   * purpose), so the session cannot tell the two placements apart.
   */
  onOpenStep?: (id: string) => void
  /** State Requirements — its own sheet rather than a step's. */
  onOpenRequirements?: () => void
}) {
  /*
   * THE FIGURE IS THE JOURNEY'S, NOT THE COURSE'S — 2026-10-01, the direct ask:
   * "since 100% means the user has completed the survey and certificate, adjust
   * this 62% to better reflect where the user is in their journey".
   *
   * ⚠ THE 62 WAS NEVER WRONG, IT WAS ANSWERING A SMALLER QUESTION. `percent` is
   * progress through the PRE-LICENSING LESSONS — 26 of 42 — which is exactly
   * right on every version where this card sits beside a separate Complete
   * Coursework card. In the combined block the six stops are visible directly
   * under the figure, and five of them have not been started, so a 62% over a
   * list that is one-sixth ticked reads as a contradiction rather than as two
   * different measures.
   *
   * ⚠ WEIGHTED BY WORK, NOT BY STOP COUNT. Stop-count parity would make the
   * one-item Course Exam worth as much as the 42 lessons, so finishing a single
   * exam would jump the figure ~17 points — and a learner who had finished all
   * 42 lessons would read 17%. Each stop contributes its own item count
   * instead; see `stopWeight`.
   *
   * ⚠ THE TWO COMPLETION TASKS COUNT AS ONE UNIT EACH. Attestation & Affidavit
   * and Survey & Certificate carry `hours: null` — they are steps rather than
   * coursework. Excluding them from the denominator would mean the figure hit
   * 100% while the Survey & Certificate stop sat unticked, which is precisely
   * the reading the ask is correcting. One unit is the smallest honest weight.
   *
   * ⚠ IT IS DERIVED HERE, NOT PUSHED THROUGH `percent`. That prop still carries
   * the lesson figure, which is what the stats row beside it prints ("26 of 42
   * lessons") and what every other version's card shows. Changing it at the
   * band would move the number on QE Focused and Testing too, where there is no
   * journey under it to justify the change.
   */
  const scaleStyle =
    (useFeatureFlag('journey-scale-style').variant as
      | 'axis'
      | 'gauge'
      | 'chip'
      | 'header') ?? 'gauge'
  /* THE BAR IS A TOGGLE — `combined-progress-bar`, 2026-10-02, the direct ask.
     ⚠ IT ANSWERS A REAL DUPLICATION: the gauge down the timeline below already
     carries a fill, a figure and a marker, so this bar is the card's second
     statement of progress — and the two are not even the same number today
     (the bar reads `percent`, the lesson figure; the gauge is weighted across
     the journey). See the flag's own description. */
  const showProgressBar = useFeatureFlag('combined-progress-bar').enabled
  const stopMark =
    (useFeatureFlag('journey-stop-mark').variant as 'circle' | 'dash') ?? 'dash'
  const stopsForPct = journeyStopsFor(path)
  const journeyTotal = stopsForPct.reduce((n, st) => n + stopWeight(st.id, st.hours), 0)
  const journeyDone = stopsForPct.reduce(
    (n, st) =>
      n + (st.status === 'completed' ? stopWeight(st.id, st.hours) : (st.completed ?? 0)),
    0,
  )
  const pct =
    journeyTotal > 0
      ? Math.max(0, Math.min(100, Math.round((journeyDone / journeyTotal) * 100)))
      : Math.max(0, Math.min(100, percent))
  /* `showPercent` WAS HERE — the figure it gated moved to the rail (2026-10-02),
     and `pct` now only feeds that rail's marker and the progress bar. */

  /*
   * WHERE THE LESSON LINE GOES — 2026-10-01, the direct ask: "move the lesson
   * section to be within the complete coursework, under the pre-licensing
   * lessons to better indicate where the user is".
   *
   * ⚠ UNDER THE CURRENT STOP, NOT UNDER A NAMED ONE. The ask says
   * "pre-licensing lessons" because that is the stop the demo learner is on;
   * what it asks FOR is "where the user is". Hard-coding the first stop's id
   * would be right today and wrong the moment the learner finishes it — the
   * lesson line would sit under a ticked step while the live one sat below it,
   * which is the opposite of what this move is for. The stop id is not a stable
   * literal anyway: it is spread from the requirement category.
   *
   * ⚠ AND IT FALLS BACK RATHER THAN DISAPPEARING. With the coursework finished
   * there IS no current stop (`findIndex` returns -1), and Resume lives inside
   * this block — so nesting unconditionally would delete the card's primary
   * action on exactly the learner who has a course to review. The same
   * `findIndex` the rail uses, so the two cannot disagree about which stop is
   * live.
   */
  const currentStopIndex = stopsForPct.findIndex((st) => st.status !== 'completed')
  const nestLesson = !complete && currentStopIndex >= 0

  /* LO-FI — the shell stays, the detail goes, and the shell is now TALLER
     because this card carries two halves. Six rows rather than four, so the
     placeholder still reads as this card's template rather than as the one it
     forked from. */
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section aria-label="Current course" style={card}>
        <LoFiWidgetBody rows={6} showCta ariaLabel="Lo-fi current course card" />
      </section>
    )
  }

  /* RESUME SITS BESIDE THE COURSE TITLE — 2026-10-01, the direct ask ("move
     this to the right of the course title. aligned horizontally. wrap title as
     needed.").

     ⚠ IT LEFT THE LESSON BLOCK, which is the part to notice. That block is now
     purely a statement of WHERE the learner is — the lesson number, the
     estimate and the chapter name, nested under the live stop — and the one
     action on the card has moved to the top, beside the thing it acts on. The
     card reads: this course, resume it; and below, this is where you are. */
  const resumeButton = (
    <button type="button" data-cta-id="home.resume" onClick={onResume} style={cta}>
      {/* "Resume course", not "Resume" — 2026-10-02, the direct ask. It now
          sits beside a stat line rather than under a course title, so the word
          that named what it resumed is no longer directly above it. The other
          two shapes already name the course. */}
      {complete ? 'Review course' : lessonsCompleted > 0 ? 'Resume course' : 'Start course'}{' '}
      <ArrowRight size={16} aria-hidden />
    </button>
  )

  /* ⚠ SPANS, NOT `<p>` AND `<h3>`. This whole block is the content of a
     `<button>` below, and a button may only contain PHRASING content — a
     paragraph or a heading inside one is invalid HTML that the DOM re-parents,
     which is the same trap the step disclosures' eyebrows hit. The chapter name
     stops being a heading as a result; that is consistent with the stop titles
     around it, which are spans for the same reason, and the card still has its
     `<h2>` for the course. */
  const lessonBlock = (
    <span style={lessonRow}>
      <span style={{ flex: 1, minWidth: 0 }}>
        {complete ? (
          <span style={lessonTitle}>All coursework complete</span>
        ) : (
          <>
            <span style={lessonMeta}>
              Lesson {lessonsCompleted + 1}
              <span aria-hidden style={dot} />
              {/* ⚠ INVENTED, and named as such at its source. See
                  `NY_LH_LESSON_MINUTES_INVENTED`. */}
              <span style={estimate}>About {NY_LH_LESSON_MINUTES_INVENTED} minutes</span>
            </span>
            <span style={lessonTitle}>{NY_LH_CURRENT_CHAPTER}</span>
          </>
        )}
      </span>
      {/* Appears on hover and on focus — see `.cre-lesson-chevron`. Always in
          the DOM so its width never reflows the text beside it. */}
      <ChevronRight
        size={16}
        aria-hidden
        className="cre-lesson-chevron"
        style={{ flexShrink: 0, color: 'var(--color-primary-600)' }}
      />
    </span>
  )

  return (
    /* ⚠ STILL `aria-label="Current course"`. The combined block is reached by
       that name in five suites and by anyone scanning with a screen reader;
       renaming it would be a second change riding along with this one. What it
       CONTAINS has grown — the name for the thing has not. */
    <section aria-label="Current course" style={card}>
      {/* THE EYEBROW LEADS THE CARD — 2026-10-01, the direct ask: "move current
          course to the top left of the widget above the image so it aligns with
          where the eyebrow is below."

          It sat inside the text column, to the right of the cover, which put it
          ~120px in from the card's edge while "Step 1 · Atlas Study Journey"
          started at the padding edge. Two eyebrows in one card on two different
          left margins read as two cards. At the top it is the card's own label
          and the two line up.

          ⚠ THE TWO STILL DIFFER IN TYPE — this one is 11px/0.08em, the rail's
          is 10px/0.18em. Left alone deliberately: the ask was about ALIGNMENT,
          and matching the faces as well is a second change that would also
          reach `CourseEntryCard`'s eyebrow by way of the shared style. Worth
          looking at once the positions are settled. */}
      <p className="cre-eyebrow-ink" style={leadEyebrow}>
        Current course
      </p>
      <div style={topRow}>
        {cover ? <img src={cover} alt="" aria-hidden style={coverStyle} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ⚠ `align-items: flex-start`, NOT `center`. The title wraps to two
              or three lines at this column's width — which the ask accepts —
              and centring a 44px button against a wrapping heading walks it
              down the card as the title grows. Pinned to the top, the button
              stays level with the FIRST line whatever the title does. */}
          {/* ⚠ RESUME LEFT THIS ROW on 2026-10-02 — it sits on the stats line
              below now, level with "17 days". It was pinned here to the
              title's first line while the title was the only thing on the row;
              with the percentage and the lesson count gone from the header,
              the stats line had room and the action reads better beside the
              fact it acts on. */}
          <h2 style={title}>{courseTitle}</h2>

          {showProgressBar ? (
            <div aria-hidden style={track}>
              <div style={{ ...fill, width: `${pct}%` }} />
            </div>
          ) : null}

          {/* ⚠ NO FIGURE HERE ANY MORE — 2026-10-02, the direct ask: the rail's
              own 37% "will replace the percentage in the header section". The
              card stated it twice, a few inches apart, and the one on the
              timeline is the one that sits beside what it measures.
  
              ⚠ `showPercent` AND THE RULE GO WITH IT. The divider between the
              figure and the stats existed to separate them; with no figure
              there is nothing to divide, and the stats start at the edge. */}
          <div style={metaRow}>
            <div style={metaLeft}>
              <div style={statCluster}>
                {stats.map((s) => (
                  <span key={s.caption} style={statPair}>
                    <span style={statValue}>{s.value}</span>
                    <span style={statCaption}>{s.caption}</span>
                  </span>
                ))}
              </div>
            </div>
            {showDetails && (
              <button type="button" onClick={onDetails} style={detailsLink}>
                Details <ArrowRight size={13} aria-hidden />
              </button>
            )}
            {/* ⚠ INSIDE `metaRow`, WHICH ALREADY SPACES ITS CHILDREN APART —
                so the stats sit left and this sits right with no new layout.
                `alignItems: center` on that row is what puts the 44px button on
                the same line as the stat text rather than above it. */}
            {resumeButton}
          </div>
        </div>
      </div>

      {/* ⚠ THE LESSON BLOCK IS THE SAME MARKUP IN BOTH POSITIONS, built once
          here and placed by `nestLesson`. Two copies — one for the band, one
          for the slot — is how the nested one would quietly stop matching the
          flat one. */}
      {nestLesson ? null : (
        <>
          <div aria-hidden style={divider} />
          {lessonBlock}
        </>
      )}

      {/* ── THE COURSEWORK HALF ────────────────────────────────────────────
          A HAIRLINE, the same one the card already uses between its halves, so
          none of the bands reads as a card stapled to another.

          ⚠ `onViewAll` IS PASSED THROUGH, so View All still leaves for the full
          Learning Path. The combined block absorbs the coursework SUMMARY, not
          the page behind it — dropping that route would quietly make this the
          only view of the stops.

          ⚠ `stopDetail` IS WHAT PUTS THE LEARNER IN THE LIST. It hangs the
          lesson line and Resume under the stop that is actually live, so the
          card says which step you are on AND where you are inside it, in one
          place rather than as two facts the reader has to join up. */}
      <div aria-hidden style={divider} />
      <StudyJourneyRail
        path={path}
        /* ⚠ NO `onOpenStop` — 2026-10-01, the direct ask ("dont make this
           hover/clickable"), and WITHHOLDING THE PROP is the whole mechanism.
           The rail's `interactive` is `Boolean(onOpenStop) && !stop.blocked`,
           and it gates three things at once: the hover fill, the chevron, and
           `.cre-stop-title`'s blue link colour. So one omission turns the row
           into plain text rather than leaving a blue, chevroned row that
           happens not to respond — which is the worse half-state.

           WHY IT IS RIGHT HERE: the live stop now carries the lesson line and
           Resume nested directly under it. That is the way into the course, and
           a second control on the row above it competes for the same press. The
           other five stops are `blocked` and were never interactive.

           ⚠ THE JOURNEY COLUMN IS UNCHANGED — it still passes a handler, so its
           stops still open. This is a property of THIS card, not of the rail. */
        onViewAll={onViewAll}
        /* "Step 1 · Atlas Study Journey" — 2026-10-01, the direct ask, and it
           SETTLES the numbering seam this card opened.
        
           The combined block IS step 1. It read a bare "Atlas Study Journey"
           for one build, which left the page running: block (unnumbered), Step
           2, Step 3, Step 4 — step 1 existing but labelled nowhere. The other
           way out was renumbering the column 1-3, and that says the journey HAS
           three steps, which is a different claim about the product. The
           coursework did not stop being step 1; it moved.
        
           ⚠ THE EYEBROW SITS INSIDE THE BLOCK, NOT ON IT, so the number lands
           on the coursework half rather than on the card as a whole. That is
           the honest placement: the course identity above it is not a step, it
           is what all four steps are about. */
        stepRange
        stepNumber={1}
        /* …and JUST "Step 1" — 2026-10-01, the direct ask. It sits above bare
           "Step 2" and "Step 3" eyebrows in this card, so carrying the
           journey's name made the first of three read as a different kind of
           thing. The journey column keeps the full form, where this card is the
           only one naming the route. */
        stepLabelOnly
        /* "(26 of 42 Completed)" rather than "(42)" — 2026-10-01, the direct
           ask. ⚠ IT ECHOES THE STAT FOUR LINES ABOVE, which is the thing to
           judge: in this card the course's own "26 of 42 lessons COMPLETED"
           sits in the meta row, so the stop either reinforces it or says it
           twice depending on how the block settles. Opt-in on the rail, so no
           other version's stop label moves. */
        lessonProgressTitle
        /* …and the connector under that stop fills to match. A wholly dashed
           segment under a stop that is 26/42 done says no ground covered. */
        progressSpine
        /* ⚠ THE JOURNEY FIGURE, THE SAME ONE THE CARD PRINTS ABOVE — `pct`, not
           the stop's own 62%. The caret marks where the learner is and this
           says how far that is through the whole route, so the rail and the
           card's big number cannot disagree. 2026-10-01, the direct ask. */
        markerLabel={`${pct}%`}
        /* HOW that figure is drawn — `journey-scale-style`, four arms under
           comparison. The card supplies the number; the rail owns the shapes. */
        scaleStyle={scaleStyle}
        /* …and what an unreached stop looks like, a second axis of the same
           exploration — `journey-stop-mark`. */
        stopMark={stopMark}
        stopDetail={
          nestLesson
            ? (_id, { isCurrent }) =>
                isCurrent ? (
                  <div style={nestedLesson}>
                    {/* THE LESSON IS A SECOND WAY INTO THE COURSE — 2026-10-01,
                        the direct ask ("wrap in a container that will have a
                        hover effect and take user to the course (in addition to
                        the resume button)").

                        ⚠ IT CARRIES `home.resume` TOO, deliberately. That CTA's
                        research question is "if it dies, where do they go
                        instead?" — and an untagged second path to the same
                        course would answer it wrongly: a moderated run that
                        breaks Resume would leave this working, and the
                        participant would simply press it. Both controls do one
                        thing, so both die together.

                        ⚠ `cre-journey-stop` AGAIN rather than a new hover. It
                        is what the rail's own rows use, and this block sits
                        inside one of them. */}
                    <button
                      type="button"
                      data-cta-id="home.resume"
                      onClick={onResume}
                      aria-label={`Resume ${NY_LH_CURRENT_CHAPTER}`}
                      /* ⚠ `cre-lesson-cta`, NOT `cre-journey-stop`. The stop
                         rows' neutral hover is right for a list of stops; this
                         row is a CONTROL into the course and takes the same
                         tint the right rail's links do, so the two read as one
                         system. See `tokens.css`. */
                      className="cre-lesson-cta"
                      style={lessonButton}
                    >
                      {lessonBlock}
                    </button>
                  </div>
                ) : null
            : undefined
        }
      />

      {/* ── STEPS 2 AND 3 ──────────────────────────────────────────────────
          2026-10-01, the direct ask: "add a divider after step 1 and put the
          step 2, then another divider and step 3".

          THE CARD IS NOW THE WHOLE ROUTE. It began as the course plus its
          coursework; with the licensing steps in it, it is XCEL's path to a
          licence end to end, in one frame. What is left in the right column is
          deliberately NOT part of that route — the question about the learner's
          exam date, and a flat list of sheet shortcuts.

          ⚠ A BARE SHELL, which is why no fork was needed.
          `LicensingStepWidget` already took its surface as a prop, so passing
          an empty object makes it a BAND between hairlines rather than a card
          with its own border and padding. Cards inside a card is the thing the
          dividers exist to avoid.

          ⚠ NUMBERED 2 AND 3 BY THE SAME RULE THE COLUMN USES, not by index:
          the exam step is filtered out and takes no number (it asks a question
          rather than naming a step), and the arrival card is keyed by STEP ID
          rather than by position — `GET_LICENSED_STEPS.length - 1` against a
          filtered array matches nothing, which is the bug
          `JourneyStepOrder.test.tsx` already catches in the column. */}
      {LICENSING_STEPS.map((step, i) => (
        <div key={step.id}>
          <div aria-hidden style={divider} />
          <JourneyStepDisclosure
            number={i + 2}
            heading={
              step.id === GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1].id
                ? jurisdictionName(path.state)
                  ? `Get Licensed in ${jurisdictionName(path.state)}`
                  : 'Get Licensed'
                : step.title
            }
            fee={step.fee}
            detail={step.detail}
            links={stepLinks(step.id, onOpenStep, onOpenRequirements)}
          />
        </div>
      ))}
    </section>
  )
}

/**
 * How much of the journey one stop is worth.
 *
 * ⚠ `hours` IS NOT ENOUGH, and finding that out is what this function exists to
 * record. Only two of the six stops carry one — Pre-Licensing Lessons (42) and
 * Course Exam (1). Prep Review's 23 and Simulated Exams' 3 ride on the stop's
 * LABEL and, in `studyJourneyUtil`'s own words, "nowhere near the gauge's
 * denominator". A first cut weighted everything by `hours ?? 1` and measured
 * 55% in the browser, because the 23-item Prep Review counted the same as a
 * single attestation — and it would have read 89% with all five later stops
 * untouched, which is the same overstatement the ask is correcting.
 *
 * ⚠ SO THIS DOES PULL THOSE TWO LABEL COUNTS INTO A DENOMINATOR, which that
 * note cautions against. The caution is about the shared progress GAUGE, whose
 * denominator comes from `dashboardProgressFixtures`; this is a figure local to
 * Testing 3's combined card and it changes nothing the gauge reads. Worth
 * knowing the tension exists — if those counts are ever found to be unreliable,
 * this is a second place that trusted them.
 *
 * ⚠ THE TWO COMPLETION TASKS ARE WORTH 1. Attestation & Affidavit and Survey &
 * Certificate are steps rather than coursework and have no count at all.
 * Excluding them would let the figure reach 100% with Survey & Certificate
 * unticked — exactly the reading the ask is correcting. One is the smallest
 * honest weight.
 */
function stopWeight(id: string, hours: number | null): number {
  if (hours != null) return hours
  if (id === 'prep-review-course') return NY_LH_PREP_REVIEW_LESSONS
  if (id === 'exam-simulators') return NY_LH_EXAM_SIMULATORS
  return 1
}

/**
 * A LICENSING STEP, COLLAPSED TO ITS NAME — Testing 3, 2026-10-01, the direct
 * ask: "remove these - when user hovers over step 2 or step 3, there should be
 * a hover effect, and clicking would expand vertically to show more details."
 *
 * Closed it is the number and the heading, nothing else. Open it adds the fee
 * and the detail line — the two the ask pointed at. They are not deleted, they
 * are what "more details" means.
 *
 * ⚠ A FORK OF `LicensingStepWidget`'S MARKUP, NOT A PROP ON IT. That component
 * draws these steps on QE Focused, Testing and Testing 2, where they are
 * separate cards that state everything at rest; a `collapsible` prop would
 * thread a disclosure through all of them for one version's ask. CLAUDE.md's
 * rule, and the same call the card itself is built on. The DATA is imported —
 * `step.fee` and `step.detail` are the published fields both renderings read,
 * so the two cannot come to state different fees.
 *
 * ⚠ IT BORROWS `cre-journey-stop` RATHER THAN INVENTING A HOVER. That class is
 * what the journey's own stop rows use — background on hover, a focus-visible
 * outline, and a 120ms ease — so a row in this card behaves like the rows three
 * inches above it. A bespoke hover here would be a second answer to a question
 * this product already answered.
 *
 * ⚠ CLOSED BY DEFAULT, BOTH OF THEM. The alternative — open the step the
 * learner is "on" — needs a notion of which licensing step is current, and
 * there is none: these three wait on PSI and the Department, and the product
 * has no feed for any of them. That absence is deliberate and documented on
 * `GetLicensedRail`; inventing a current step here to drive an accordion would
 * be the product claiming to know an outcome it cannot observe.
 */
function JourneyStepDisclosure({
  number,
  heading,
  fee,
  detail,
  links = [],
}: {
  number: number
  heading: string
  fee?: string | null
  detail?: string | null
  /** Sheet shortcuts for THIS step, drawn at the foot of the open body —
   *  2026-10-02, the direct ask. See `stepLinks`. */
  links?: StepLink[]
}) {
  const [open, setOpen] = useState(false)
  /* ⚠ LINKS COUNT AS DETAIL. `hasDetail` is what decides whether the row is a
     button at all — a step whose only content was a link would otherwise be
     inert, and the link unreachable, with nothing on screen to say so. Both
     steps carry a detail line today, so this is a guard rather than a fix. */
  const hasDetail = Boolean(fee || detail || links.length > 0)
  return (
    /* ⚠ STILL A NAMED REGION. The shared widget wraps each step in
       `<section aria-label={heading}>`, and the fork dropped it for one build —
       which costs a screen-reader user the ability to jump to "Get Licensed in
       New York" at all, and is invisible on screen. The name is the VISIBLE
       heading for the same reason it is there: a region announced as "Apply for
       your License" while reading "Get Licensed in New York" is a landmark
       disagreeing with its own content. */
    <section aria-label={heading}>
      <button
        type="button"
        /* ⚠ NOT A BUTTON AT ALL WHEN THERE IS NOTHING TO SHOW. A step with no
           fee and no detail would otherwise be a control that opens an empty
           box — the same broken promise as a chevron on a blocked stop, which
           the journey rail already refuses to draw. */
        onClick={hasDetail ? () => setOpen((v) => !v) : undefined}
        aria-expanded={hasDetail ? open : undefined}
        disabled={!hasDetail}
        className={hasDetail ? 'cre-journey-stop' : undefined}
        style={{ ...stepRowStyle, cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <span style={{ minWidth: 0, textAlign: 'left' }}>
          <span className="cre-eyebrow-ink" style={stepEyebrowStyle}>
            Step {number}
          </span>
          <span style={stepHeadingStyle}>{heading}</span>
        </span>
        {hasDetail && (
          <ChevronDown
            size={16}
            aria-hidden
            style={{
              flexShrink: 0,
              color: 'var(--color-text-tertiary)',
              transition: 'transform 150ms ease',
              transform: open ? 'rotate(180deg)' : undefined,
            }}
          />
        )}
      </button>
      {open && (
        <div style={stepDetailStyle}>
          {fee ? <p style={stepFeeStyle}>{fee}</p> : null}
          {detail ? <p style={stepDetailTextStyle}>{detail}</p> : null}
          {links.length > 0 && (
            /* ⚠ AT THE FOOT OF THE OPEN BODY, not beside the heading. The ask
               said "at bottom of" the step, and the placement is the argument:
               a learner who has opened this step is asking about this step, so
               the shortcut is the next thing to read rather than a second
               control competing with the disclosure's own. */
            <div style={stepLinkRowStyle}>
              {links.map((link) => (
                <button
                  key={link.id + link.label}
                  type="button"
                  data-cta-id={link.id}
                  onClick={link.onSelect}
                  /* The house link CTA — no inline `color`, which
                     `.cre-cta-ink` owns and re-points on the dark theme. */
                  className="cre-link-action cre-cta-ink"
                  style={stepLinkStyle}
                >
                  {link.label}
                  <ChevronRight size={12} aria-hidden />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * The licensing steps this card draws — the published route EXCEPT scheduling
 * the exam.
 *
 * ⚠ THE EXAM STEP IS FILTERED BY ID, not by slicing. `StudyJourneyWidget` drops
 * it with `slice(1)` under `journey-step-order: exam-first` and by an id check
 * otherwise; an index here would be right under one arm and silently wrong
 * under the other. Testing 3 renders the exam question in the right-hand column
 * under both orders, so this list is stable — which is the point.
 */
const LICENSING_STEPS = GET_LICENSED_STEPS.filter((st) => st.id !== 'schedule-exam')

type StepLink = { id: string; label: string; onSelect?: () => void }

/**
 * WHICH SHEETS A STEP OFFERS — 2026-10-02, the direct ask: Exam Information at
 * the foot of Pass State Exam; Applying for License and State Requirements at
 * the foot of Get Licensed.
 *
 * ⚠ THE SAME CTA IDS THE RIGHT RAIL'S TILES CARRY, which the catalog explicitly
 * allows ("an id may appear on several elements on purpose"). "Do they find
 * Exam Information" is ONE research question, and giving the second placement
 * its own id would let a moderated run kill one copy and leave the other live —
 * the participant simply presses the survivor and the finding is lost. The
 * cost is the inverse: a session cannot ask which of the two placements they
 * reached for. That is the right way round for a catalog whose whole purpose is
 * breaking a destination rather than a button.
 *
 * ⚠ "APPLYING FOR LICENSE" OPENS THE STEP IT SITS INSIDE, and that is not a
 * mistake. The disclosure shows the step's fee and its one-line detail; the
 * sheet is the full published text. Same relationship the right rail's tile has
 * to the same step — it is a summary offering its source, not a link to itself.
 *
 * ⚠ KEYED BY ID, NOT BY POSITION. `LICENSING_STEPS` is a FILTERED array, so an
 * index here would point at the wrong step the day the exam step stops being
 * filtered — the exact bug `JourneyStepOrder.test.tsx` already catches in the
 * journey column.
 *
 * A step with no entry gets none; returning an empty array rather than
 * `undefined` keeps the disclosure's `links.length` check honest.
 */
function stepLinks(
  stepId: string,
  onOpenStep?: (id: string) => void,
  onOpenRequirements?: () => void,
): StepLink[] {
  if (stepId === 'pass-exam') {
    return [
      {
        id: 'home.quick-exam-info',
        label: 'Exam Information',
        onSelect: onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : undefined,
      },
    ]
  }
  if (stepId === APPLY_LICENSE_STEP_ID) {
    return [
      {
        id: 'home.quick-get-licensed',
        label: 'Applying for License',
        onSelect: onOpenStep ? () => onOpenStep(APPLY_LICENSE_STEP_ID) : undefined,
      },
      {
        id: 'home.state-requirements',
        label: 'State Requirements',
        onSelect: onOpenRequirements,
      },
    ]
  }
  return []
}

/** The last published step — the one the card titles "Get Licensed in {state}".
 *  Read from the data rather than written out, the same way `HomeTileGrid`
 *  reads it, so the two cannot come to point at different steps. */
const APPLY_LICENSE_STEP_ID = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1].id

/* The disclosure's header row. Negative side margins so the hover fill reaches
   past the card's text column to the same width the stop rows' hover does,
   without the text itself moving — a hover band that stops short of the
   padding reads as a misaligned button rather than as a row. */
const stepRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: 'calc(100% + 16px)',
  margin: '0 -8px',
  padding: '8px',
  border: 0,
  background: 'transparent',
  textAlign: 'left',
}

/* `span`s rather than `p`s — this lot is inside a <button>, and a <p> there is
   invalid HTML that React will render and the DOM will re-parent. */
const stepEyebrowStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

const stepHeadingStyle: CSSProperties = {
  display: 'block',
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

const stepDetailStyle: CSSProperties = { padding: '2px 8px 6px' }

/* Wraps rather than scrolls: two links fit on one line at the card's width
   today, and the pair under Get Licensed is the widest case. */
const stepLinkRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 18,
  marginTop: 10,
}

/* Carries NO colour — `.cre-cta-ink` does. The chevron matches the right rail's
   tiles, which are the same three destinations: one affordance for one kind of
   thing, whichever placement a learner meets it in. */
const stepLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  fontWeight: 600,
}

const stepFeeStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.04em',
  color: 'var(--color-text-tertiary)',
}

const stepDetailTextStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

/* The nested lesson block — recessed by INDENT ALONE, so it reads as the inside
   of the step above it rather than as a sixth stop in the list.

   ⚠ IT CARRIED A LEFT RULE FOR ONE BUILD, and that was wrong on screen: the
   rail's own spine runs down this column already, so the rule rendered as a
   SECOND vertical line 24px to its right — two parallel rails saying one thing.
   Measured, not guessed (spine at x=97, rule at x=121). The spine is what ties
   this block to its step; indentation is all that is left to say.

   ⚠ The `marginBottom` is what keeps the next stop from crowding it; the
   spine's `flex: 1` stretches over the whole thing on its own. */
const nestedLesson: CSSProperties = {
  /* ⚠ NO `position: relative` ANY MORE. It was here to anchor an absolutely
     positioned caret, which has moved into the spine itself — see
     `syllabusSpineCaretStyle` in `StudyJourneyRail`. A mark whose position is
     defined by the timeline belongs to the timeline. */
  /* ⚠ SYMMETRIC VERTICAL PADDING, AND THE MARGIN ABSORBS IT. The gauge marker
     anchors to THIS box's centre, and with 8px of padding above the text and
     2px below, that centre sat 3px higher than the text itself — so the knob
     lined up with the block but not with the words the green rule marks.
     8/8 puts the two centres on the same line; the bottom margin drops 14 → 8
     so the block's overall height, and the list's rhythm, are unchanged.
     Measured: knob 486, padded block 486, rule box 489 before; all three after. */
  margin: '2px 0 8px',
  /* ⚠ THE GREEN RULE IS NOT HERE ANY MORE — moved to `lessonRow` on
     2026-10-02, the direct ask ("only the height of the actual text"). On this
     box it ran the full height of the block INCLUDING its own padding and the
     button's, which made it ~26px taller than the words it was marking. On the
     row it is the text's height by construction, because that row's height IS
     the text's. */
  /* ⚠ 22 ON THE LEFT, up from 0 — 2026-10-01, the direct ask ("indent this to
     the right a bit more"). It clears the stop titles above and below it, so
     the block reads as something INSIDE the step rather than as another row of
     the list. The button's own negative margin below cancels it for the hover
     fill only, so the fill still starts at the block's edge. */
  /* ⚠ 9 HERE, 3 FOR THE RULE, 10 ON THE ROW = the same 22 the text has always
     sat at. The indent is split across three boxes now because the rule moved
     inward to hug the words; the sum is what keeps the lesson aligned with the
     stop titles above and below it, which is the whole reason the indent
     exists. Change any one of the three and re-derive the other two. */
  padding: '8px 0 8px 9px',
}

/* The lesson as a control. `cre-journey-stop` paints the hover and the
   focus-visible outline; this supplies the geometry.

   ⚠ NEGATIVE SIDE MARGINS + MATCHING PADDING, the pattern the rail's own rows
   use: the hover fill reaches a few pixels past the text on both sides without
   the text itself moving, so a hovered block does not look like a label that
   shifted. */
const lessonButton: CSSProperties = {
  display: 'block',
  width: 'calc(100% + 16px)',
  margin: '0 -8px',
  padding: 8,
  border: 0,
  /* ⚠ NO `background` HERE — `.cre-lesson-cta` owns it, and an inline
     `transparent` BEATS the class's `:hover` in the cascade, so the row kept
     its chevron and lost its tint. Measured: chevron opacity 1, background
     still rgba(0,0,0,0). Exactly the trap `tokens.css` records for
     `.cre-tile-cta`, hit a second time — if a class owns a hover, it must own
     the rest state too. */
  textAlign: 'left',
  cursor: 'pointer',
}


/* ─── styles ──────────────────────────────────────────────────────────── */

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-primary-100)',
  /* 4 — `--radius-sm`, matching the Study Journey and Schedule State Exam
     cards beside it (2026-09-28, the direct ask). The token, not a literal. */
  borderRadius: 'var(--radius-sm)',
  padding: 20,
  minWidth: 0,
}

const topRow: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }

const coverStyle: CSSProperties = {
  width: 104,
  alignSelf: 'stretch',
  height: 'auto',
  flex: 'none',
  /* The same two diagonally-opposite corners the split header rounds. */
  borderRadius: '0 var(--radius-md) 0 var(--radius-md)',
  objectFit: 'cover',
  display: 'block',
}

const eyebrow: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

/* The card's own label, at the padding edge so it lines up with the rail's
   "Step 1 · Atlas Study Journey" below. 12 under it rather than the 6 it
   carried inside the text column: there it sat tight above the course name it
   introduced, here it is introducing the whole block.

   ⚠ AND IT NOW WEARS THE RAIL'S TYPE — 2026-10-01, the direct ask ("make the
   eyebrow fonts match"). It was 11px/0.08em with no stated weight; the rail's
   is 10px/0.18em at 600. Two eyebrows in one card, aligned to the same edge but
   set differently, read as two components that happen to be adjacent. The
   rail's is the one that was matched TO, since it is the shared treatment
   (`cre-eyebrow-ink`'s partner across the journey cards) and this card is the
   fork.

   ⚠ DECLARED HERE, NOT BY EDITING `eyebrow`. That object is spread from
   `CourseEntryCard`'s styles, which every other version renders — restyling it
   would change the eyebrow on QE Focused, Testing and Learner Focused to match
   a decision made about Testing 3's combined card. */
const leadEyebrow: CSSProperties = {
  ...eyebrow,
  margin: '0 0 12px',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
}

/* `titleRow` WAS HERE — the title and Resume on one line, with the button
   pinned to `flex-start` so it held the first line as the title wrapped. Resume
   moved to the stats row on 2026-10-02 and the title is a plain block again. */

const title: CSSProperties = {
  margin: 0,
  minWidth: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}

const track: CSSProperties = {
  marginTop: 12,
  width: '100%',
  height: 8,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-300)',
  overflow: 'hidden',
}

const fill: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
}

/* ⚠ `nowrap`. With `wrap` the Details link was the thing that gave way and
   dropped BELOW the stats, left-aligned under the figure — which reads as a
   stray link rather than as the row's action. The stat cluster wraps internally
   instead, so the row keeps its shape and Details stays where the split header
   puts it. */
const metaRow: CSSProperties = {
  marginTop: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'nowrap',
}

const metaLeft: CSSProperties = { display: 'flex', alignItems: 'center', gap: 15, minWidth: 0 }




/* The stat pairs, now the whole of the meta row. ⚠ `figure`, `figureWrap`,
   `figureUnit` and `withRule` were removed with the percentage on 2026-10-02 —
   the rail states it instead. The rule was the divider between the figure and
   these; with no figure there is nothing to divide. */
const statCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  minWidth: 0,
}

const statPair: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 6 }

const statValue: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const statCaption: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const detailsLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-primary-600)',
  flexShrink: 0,
}

const divider: CSSProperties = {
  /* ⚠ 12, DOWN FROM 18 — 2026-10-02, the direct ask, and it applies to EVERY
     hairline in this card, not only the two the ask pointed at. They are one
     rule used four times (identity, the coursework rail, step 2, step 3), and
     tightening two of them would leave the card with two different band
     rhythms. The card has grown from two bands to five since the 18 was set;
     at that count the spacing was doing more separating than the content
     needed. */
  margin: '12px 0',
  height: 1,
  background: 'var(--color-primary-100)',
}

/* The lesson's own row — and, since 2026-10-02, the green rule.
   
   ⚠ THE HEIGHT COMES FOR FREE. This row's height IS the text's, so a border on
   it needs no measurement and stays correct when the chapter name wraps. On the
   outer block it spanned that block's padding and the button's too.
   
   ⚠ THE GREEN IS THE MARKER'S RENDERED GREEN, not the raw token. The gauge
   knob's ring is `--color-success-500` at 45% ALPHA, so what a reader sees
   beside this is the mixed colour — matching the solid token instead would make
   the rule visibly darker than the ring it is supposed to echo. Mixed into the
   card for the same reason the ring sits on it. */
const lessonRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  minWidth: 0,
  borderLeft: '3px solid color-mix(in srgb, var(--color-success-500) 45%, var(--color-surface-card))',
  paddingLeft: 10,
}

const lessonMeta: CSSProperties = {
  margin: '0 0 4px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const dot: CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  margin: '0 8px',
  verticalAlign: 'middle',
  background: 'var(--color-neutral-300)',
}

/** Quieter than the lesson line: a note about the work, not a name for it. */
const estimate: CSSProperties = { fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' }

const lessonTitle: CSSProperties = {
  /* `block` because these are spans now — see the note on `lessonBlock`. */
  display: 'block',
  margin: 0,
  /* ⚠ BODY FACE, not `--font-heading`: the `dashboard-heading-font` variant
     re-points the heading token at a serif, and a chapter name is a row label
     rather than a heading. `JumpBackInWidget` makes the same call. */
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const cta: CSSProperties = {
  flexShrink: 0,
  padding: '0 20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}
