import type { LearningPathSummary } from '@/data/learningFixtures'
import { GetLicensedRail, StudyJourneyRail } from './StudyJourneyRail'
import { useState, type CSSProperties } from 'react'
import { journeyStopsFor } from './studyJourneyUtil'
import { clearExamDate, useExamDate, writeExamDate } from '@/data/examDateStore'
import { longDate } from './learningPathsHomeUtil'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  type LicensingStep,
} from '@/data/nyProducerRequirements'
import {
  widgetCardFramedStyle,
  widgetCardStyle,
  widgetEyebrowStyle,
  widgetRuleStyle,
} from './widgetStyles'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * STUDY JOURNEY WIDGET — the QE Focused version's own card (2026-09-16).
 *
 * Resume block on top, then the Study Journey, then Get Licensed: one card
 * answering "where am I and what is next", from the course in front of the
 * learner all the way to the licence.
 *
 * ── Why it is its own component and its own card ─────────────────────────
 *
 * It was the right-hand HALF of `LearnerFocusedBand` — a grid sibling of the
 * navy Current Learning Path, sharing one border radius, one shadow and one
 * `overflow: hidden`. Two things made that stop working once QE Focused slimmed
 * the navy side and grew this one:
 *
 *   - **Grid siblings share a row height.** The navy lead-in is now four lines;
 *     this is a resume block plus seven journey stops plus three licensing
 *     steps. Joined, the navy half stretched to match and carried a large empty
 *     area below its content — which reads as something failed to render.
 *   - **They are no longer halves of one statement.** The navy side says which
 *     licence and how it is going; this says what to do next. Presenting them
 *     as one surface implied a relationship that the Progress section (now
 *     directly below, carrying the navy side's old figures) had already taken
 *     over.
 *
 * So the band renders two independent cards, top-aligned, each sized by its own
 * content. `LearnerFocusedBand` keeps its joined treatment for every other
 * version — Learner Focused and Marketing Focused are unchanged.
 *
 * ── What it deliberately does NOT own ────────────────────────────────────
 *
 * The resume course is passed in, not resolved here. The band picks it from the
 * persona (or falls back to the brand's first in-progress course), and two
 * components resolving "the course to resume" is how they end up disagreeing.
 * Same for launching: `onResume` and `onOpenStop` are callbacks, so this file
 * has no `useCourseLauncher` and works unchanged in a dev-handoff preview.
 */
export function StudyJourneyWidget({
  path,
  onOpenStop,
  onOpenStep,
  onOpenRequirements,
  onOpenLearningPath,
  framed = false,
  splitSteps = false,
}: {
  path: LearningPathSummary
  onOpenStop?: (courseId: string) => void
  /** Open a Get Licensed step — the requirements sheet. See `GetLicensedRail`. */
  onOpenStep?: (id: string) => void
  /** Open the requirements sheet from the foot of the Get Licensed card. */
  onOpenRequirements?: () => void
  onOpenLearningPath?: (pathId: string) => void
  /**
   * Draw the widget as a white card with a hairline frame instead of letting it
   * sit bare on the page grey. For the TESTING version (2026-09-21).
   *
   * A PROP rather than the component picking a shell: which surface this wants
   * depends on what is beside it, which is the host's knowledge. Both shells
   * live in `widgetStyles.ts` — the file exists precisely so a second card
   * shell is not defined somewhere else.
   */
  framed?: boolean
  /**
   * Render the post-course steps as THEIR OWN WIDGETS — one card each — instead
   * of as rows in a single Get Licensed rail below the journey. Testing only
   * (2026-09-21, the direct ask).
   *
   * WHY IT IS STILL ONE COMPONENT returning one element: this is the band's
   * second GRID CHILD. Returning four siblings would make them four grid items
   * and collapse the two-column layout, so the split renders a flex column that
   * holds the four cards and stays one child.
   *
   * A second boolean beside `framed`, both driven by `paceOnly` at the call
   * site. They are genuinely different questions — one is this widget's
   * surface, the other is how many widgets there are — and a version could
   * reasonably want the frame without the split.
   */
  splitSteps?: boolean
}) {
  // On the `syllabus` treatment both halves are cards of their own, so the
  // hairline between them becomes a third divider between two edges. A gap
  // separates them instead.
  const syllabus = useFeatureFlag('dashboard-journey-style').variant === 'syllabus'
  const shell = framed ? widgetCardFramedStyle : widgetCardStyle
  const stepStart = journeyStopsFor(path).length + 1

  if (splitSteps) {
    /* FOUR WIDGETS — the coursework, then one per post-course step.
   
       WHAT THE SPLIT BUYS: the three post-course steps were rows in a shared
       rail, which gave each of them a title, a detail line and a meta line in
       ~250px. As widgets they get a heading, room for the published detail, and
       their own way in — which is what "split those out in better steps" asks
       for. It also lets the OWNER change be visible per card rather than stated
       once in a lede, which is the distinction the two sections existed for in
       the first place.
   
       WHAT IT COSTS, and it is the thing to watch: the 01→07 sequence was one
       spine down one card, and four cards cannot draw a continuous line. The
       NUMBERS carry it instead — each step's eyebrow is "Step 05/06/07",
       continuing the journey's own numbering from its real stop count. Lose the
       numbers and the four cards read as four unrelated things. */
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
        <section aria-label="Study journey" style={shell}>
          <StudyJourneyRail
            path={path}
            onOpenStop={onOpenStop}
            onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
            /* "Steps 01–04 · Atlas Study Journey" — so the four cards' eyebrows
               run 01-04, 05, 06, 07 down the column instead of the sequence
               appearing to start at 05. Split only; see the prop's note. */
            stepRange
          />
        </section>
        {GET_LICENSED_STEPS.map((step, i) => (
          <LicensingStepWidget
            key={step.id}
            step={step}
            number={stepStart + i}
            shell={shell}
            onOpenStep={onOpenStep}
            /* The arrival card is named for the DESTINATION rather than the
               action, per the ask ("Get Licensed - Apply for your license"): the
               heading says where the route ends and the lead line says what you
               do to get there. The other two are named by their published step
               title, which already reads as an action. */
            heading={
              i === GET_LICENSED_STEPS.length - 1
                ? jurisdictionName(path.state)
                  ? `Get Licensed in ${jurisdictionName(path.state)}`
                  : 'Get Licensed'
                : undefined
            }
          />
        ))}
        {/* THE REQUIREMENTS ACTION, OUT OF THE CARDS — 2026-09-21, the direct
            ask: "take this out of the widget and make it a secondary style
            button below — same width as the widget."

            It was a text link at the foot of the arrival card, under a rule.
            Out here it reads as what it is: the state's own rules, which
            elaborate the whole post-course sequence rather than the last step
            of it. It also stops the arrival card being the only one with two
            affordances.

            FULL WIDTH by inheritance, not by declaration — a flex column
            stretches its children, so this matches the cards above it exactly
            and cannot drift from them if the column's width ever changes. */}
        {onOpenRequirements ? (
          <button
            type="button"
            onClick={onOpenRequirements}
            className="cre-cta-ink"
            style={{
              /* The shared `Button`'s SECONDARY shape — transparent fill, 1px
                 stroke, 40px tall — but NOT that component, and the reason is
                 this version's palette. `Button.secondary` draws its ink and
                 border from `--color-action`, which on XCEL is the Brick red:
                 it is a FILL colour that measures 2.05:1 as TEXT on the dark
                 shell (the `.cre-alert-action` failure), and this version
                 deliberately moved every CTA off that ramp onto the navy —
                 "navy means do this; red means this is an assessment". A red
                 outlined button here would be the only red control on the page.

                 `borderColor: currentColor` so `.cre-cta-ink` owns BOTH the ink
                 and the stroke from one declaration, including its dark-mode
                 swap to the light stop. An explicit colour would need saying
                 twice and would beat the class while looking correct. */
              width: '100%',
              height: 40,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid currentColor',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {jurisdictionName(path.state)
              ? `${jurisdictionName(path.state)} State Requirements`
              : 'State Requirements'}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <section aria-label="Study journey" style={shell}>
      <div>
        <StudyJourneyRail
          path={path}
          onOpenStop={onOpenStop}
          onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
        />
      </div>

      {/* GET LICENSED — steps 2-4 of XCEL's published route. A rule between
          them rather than a gap: they are siblings in one sequence, not two
          unrelated blocks, and the section's own lede says what changes (the
          state owns these). */}
      {/* The rule renders on BOTH treatments again as of 2026-09-17. It was
          dropped for `syllabus` because each section drew its own card there,
          and a card boundary said "the owner changes here" more plainly than a
          line does. The cards went (background and stroke removed), so without
          this the journey and Get Licensed run together as one list. */}
      <div aria-hidden style={{ ...widgetRuleStyle, marginTop: 18 }} />
      <div style={{ marginTop: syllabus ? 14 : 18 }}>
        {/* `startNumber` continues the journey's own numbering (01-04 → 05-07)
            rather than restarting at 1. Derived from the real stop count, since
            merging two completion stops into one already changed it once. */}
        <GetLicensedRail
          onOpenStep={onOpenStep}
          onOpenRequirements={onOpenRequirements}
          state={path.state}
          startNumber={stepStart}
        />
      </div>
    </section>
  )
}


/**
 * ONE POST-COURSE STEP AS ITS OWN WIDGET — 2026-09-21, the direct ask to split
 * the Get Licensed rail into separate cards.
 *
 * It is a STATIC card with one link, not a whole-card target. The rail rows it
 * replaces were single targets because a link inside a button is invalid HTML
 * and two nested targets on a 13px title is a coin flip; a card has room to
 * separate the two, so the content is text and the affordance is an explicit
 * link. That is also what lets the ask's "sub-link" exist at all.
 *
 * **STILL NO COMPLETION STATE, and the absence is still the design.** Nothing
 * here gets a tick, a percentage or a status: PSI schedules the sitting, PSI
 * scores it and the Department of Financial Services issues the licence, and
 * the product has no feed for any of it. Four cards make that easier to forget
 * than three rows did, which is why it is said again here.
 *
 * **The link opens the step's OWN published detail sheet**, labelled from the
 * data (`detailLabel`). Note this is a change for `schedule-exam`, whose ROW
 * went straight out to PSI: the sheet's first bullet IS that PSI link, so the
 * destination is one click further away rather than gone, and the three cards
 * now behave identically instead of one of them leaving the app without
 * warning.
 */
function LicensingStepWidget({
  step,
  number,
  shell,
  onOpenStep,
  heading,
}: {
  step: LicensingStep
  /** Continues the journey's 01-04. See the note in `StudyJourneyWidget`. */
  number: number
  shell: CSSProperties
  onOpenStep?: (id: string) => void
  /**
   * Override the card's heading. The arrival card is named for the DESTINATION
   * ("Get Licensed in New York"); the others use their published step title.
   *
   * It also drove a lead line carrying `step.title`, so the action was named
   * under the destination — removed 2026-09-21 as the third saying of one
   * thing. This is a heading override and nothing else now.
   */
  heading?: string
}) {
  /*
   * Owner and fee on one line, ASSEMBLED rather than interpolated — a trailing
   * "·" reads as a value that failed to load, which is the admin roster's
   * blank-cell rule and the same shape as the Links panel's row meta.
   *
   * THE LINE NEEDS A FEE TO EXIST — 2026-09-21, the direct ask ("remove"),
   * pointed at Pass State Exam's meta, which was the bare word "PSI".
   *
   * A RULE rather than a special case for that step: a meta line is a pairing,
   * and with no fee to pair with, the owner was a one-word row under a sentence
   * — chrome that reads as a label for something missing. Written as "only when
   * there is a fee", so a fourth step with a fee gets the line and one without
   * does not, and nobody has to remember which id was exempt.
   *
   * WHAT IS LOST, and where it survives: the owner is the reason these steps
   * are separate from the coursework at all ("everything in the journey happens
   * inside the LMS and nothing here does"), and on Pass State Exam that fact is
   * now only in the step's own sheet, which the card's "What to expect" link
   * opens. The other two cards still name their owner beside the fee. Delete
   * the `step.fee` condition to put it back on all three.
   */
  const meta = step.fee ? [step.ownerShort ?? step.owner, step.fee].filter(Boolean).join(' · ') : ''
  /*
   * THIS CARD CARRIES THE EXAM-DATE CAPTURE — and therefore does NOT print the
   * step's detail line (2026-09-21, the direct ask: "remove", pointed at
   * "Schedule your exam when you're ready.").
   *
   * ONE BOOLEAN for both, because they are one decision: the capture's own
   * invitation ("Already scheduled? Enter the exam date and we'll use it to
   * help you prep.") is more specific than the detail it sits under, and two
   * lines of invitation on one card is the duplication this column keeps
   * trimming. Two separate conditions would let a later edit turn one on
   * without the other and put both back.
   *
   * THE DATA IS UNTOUCHED. `step.detail` is still the published-ish line and
   * the Get Licensed RAIL still prints it on QE Focused, where there is no
   * capture to replace it — a compact row with a title and no detail says less
   * than it should. This is a rendering rule for the widget, not a deletion.
   */
  const hasCapture = step.id === 'schedule-exam'
  return (
    /* The accessible name is the VISIBLE heading, not the step title, so the
       arrival card is not announced as "Apply for your License" while reading
       "Get Licensed in New York". A region whose name disagrees with its own
       heading is the same defect in miniature as the nav-collapse page's
       "Dash Dashboard". */
    <section aria-label={heading ?? step.title} style={shell}>
      {/* THE NUMBER IS THE SEQUENCE. Four cards cannot draw a continuous
          spine, so "Step 05" is what still says these follow the coursework
          and each other. It rides in the eyebrow slot the journey card already
          uses, so all four cards label themselves the same way. */}
      <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
        Step {String(number).padStart(2, '0')}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 18,
          lineHeight: '24px',
          letterSpacing: '-0.01em',
          color: 'var(--color-text-primary)',
        }}
      >
        {heading ?? step.title}
      </p>
      {/* NO LEAD LINE — 2026-09-21, the direct ask ("remove"). The arrival card
          briefly carried its step title ("Apply for your License") under the
          overridden heading, so the ACTION was named as well as the
          destination.

          It was the third saying of one thing: the detail line below already
          states what you do ("Submit your certificate of completion with the
          application") and the link says "How to apply". The step title now
          appears nowhere on this card, which is the intended trade — the
          heading names where the route ends and the two lines under it say how.
          `heading` is purely a heading override again. */
      }
      {/* DIRECTLY UNDER THE HEADING — 2026-09-21, the direct ask. It sat below
          the detail line, which on the arrival card put the owner and fee at
          the very bottom of the text, three lines from the name they qualify.

          Moved for ALL THREE cards rather than just that one, because it is
          what makes them a set: the Schedule card has no detail line (the
          capture replaces it) so its meta was already directly under the
          heading, and Pass State Exam has no meta at all. Leaving the arrival
          card alone would have made it the only one ordered differently. */}
      {meta ? (
        <p
          style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {meta}
        </p>
      ) : null}
      {hasCapture ? null : (
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: '18px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {step.detail}
        </p>
      )}
      {/* `.cre-cta-ink` with NO inline colour — the CTA ramp is a FILL colour on
          XCEL and reads 1.84:1 as text on the dark page, so the class swaps to
          the light stop under `[data-theme='dark']` and an inline value would
          beat it while looking correct. The trap `titleStyleNoColor` exists
          for, one file over. */}
      {hasCapture ? <ExamDateCapture /> : null}
      {onOpenStep ? (
        <button
          type="button"
          onClick={() => onOpenStep(step.id)}
          className="cre-link-action cre-cta-ink"
          style={{
            marginTop: 12,
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            /* WRAPS. It was `nowrap`, copied from `SquareTile`'s "Details →"
               where the label is two words and can never outgrow its tile.
               These labels are authored per step and the longest is "New York
               State Requirements →" at 211px — measured spilling 13px past the
               card edge in a 218px column at a 1000px viewport. A left-aligned
               wrap is the graceful version of that; an overflow is not. */
            textAlign: 'left',
          }}
        >
          {step.detailLabel ?? 'What to expect'} →
        </button>
      ) : null}
    </section>
  )
}


/**
 * "Already scheduled? Enter the exam date and we'll use it to help you prep."
 * — 2026-09-21, the direct ask, on the Schedule State Exam card.
 *
 * **IT IS NOT A STORED PREFERENCE, and that is the whole reason it earns a
 * place.** The date re-points the page's Target Exam Date and everything
 * derived from it — the days remaining, and therefore the Pacing tile's
 * required rate. A field that merely remembered what you typed would be the
 * Membership Plan card's defect: a control that looks like it does something.
 *
 * **It lives on THIS card rather than in the Demo Controls bar** even though it
 * moves demo figures, because it is the learner's own fact rather than a
 * reviewer's axis — the same line `readiness-state` sits on the other side of.
 * The bar's dropdowns describe personas; this describes one person's booking.
 *
 * **A native `<input type="date">`**, not a bespoke picker: it is one date, the
 * platform's own control is keyboard- and screen-reader-complete, and a custom
 * calendar here would be a second date UI beside the Study Plan's.
 *
 * The SET state shows the date and offers Change / Clear, because a value that
 * can silently override the page's headline figure has to be visible and
 * reversible — it is stored per browser and never committed, so a stale one
 * would otherwise be unexplainable from the repo.
 */
function ExamDateCapture() {
  const stored = useExamDate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const open = editing || !stored

  if (!open) {
    return (
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ ...captureHintStyle, margin: 0 }}>Your exam date</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
            }}
          >
            {longDate(stored ? isoToSlashes(stored) : '')}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(stored ?? '')
              setEditing(true)
            }}
            className="cre-link-action cre-cta-ink"
            style={captureLinkStyle}
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => clearExamDate()}
            className="cre-link-action cre-cta-ink"
            style={captureLinkStyle}
          >
            Clear
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor="cgp-exam-date" style={captureHintStyle}>
        Already scheduled? Enter the exam date and we’ll use it to help you prep.
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          id="cgp-exam-date"
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            /* SIZED TO ITS CONTENT — 2026-09-21, the direct ask to reduce the
               width. It was `1 1 140px`, which grew it to fill whatever the
               card left over: measured 200px against an INTRINSIC width of 136.
               A date input's natural size is the format plus the picker glyph,
               and stretching it just puts empty field beside `mm/dd/yyyy`.

               `0 1 auto` rather than a fixed `width: 136`: the intrinsic size
               depends on the locale's date format and the platform's own
               control, so a literal measured in one browser would clip in
               another. It keeps SHRINK so a narrow card still wraps rather than
               overflowing — with `flexWrap` on the row, Save drops below it
               before anything is cut. */
            flex: '0 1 auto',
            minWidth: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-surface-page)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          type="button"
          disabled={!draft}
          onClick={() => {
            writeExamDate(draft)
            setEditing(false)
          }}
          style={{
            flex: 'none',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: draft ? 'pointer' : 'default',
            opacity: draft ? 1 : 0.5,
            background: 'var(--color-primary-500)',
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

/** `2026-12-15` → `12/15/2026`, the shape `longDate` parses in LOCAL time. See
 *  `examDateRenewal`'s note on the UTC off-by-one an ISO string would cause. */
function isoToSlashes(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${Number(m)}/${Number(d)}/${y}`
}

const captureHintStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

/* NO inline `color` — `.cre-cta-ink` owns it and swaps to the light stop under
   `[data-theme='dark']`; an inline value would beat the rule while looking
   correct. The `titleStyleNoColor` trap, one file over. */
const captureLinkStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}
