import type { CSSProperties, ReactNode } from 'react'
import { GaugeThin } from '@/icons'
import {
  ATLAS_COLUMN_PROSE_W,
  ATLAS_SECTION_EYEBROW,
  atlasSectionEyebrow,
  type AtlasColumnAlign,
} from './atlasSectionEyebrow'
import { noPaceMessage, type NoPaceReason } from './noPaceMessage'
import { paceName } from '@/components/learning/compassStudyPlannerModel'
import { PLANNER_PLAN } from '@/data/compassStudyPlannerFixtures'

/**
 * THE STUDY PACE CARD AS A RING — a module of its own since 2026-10-16
 * (Jillienne: "lets add a component variant for this section. update to this
 * new UI, keep the other one accessible from the dropdown").
 *
 * ⚠ IT IS A SIBLING, NOT A REPLACEMENT. `AtlasCourseProgressStates` — the tan
 * card with Study pace / Readiness / State exam as pressable states — is
 * untouched, and a design control picks between them at the call site. That
 * is CLAUDE.md's rule for changing something that already exists, and here it
 * is load-bearing: the two cards answer differently. The tan one steps
 * through five states of a journey; this one shows ONE number and a way to
 * change the plan behind it.
 *
 * ⚠ FORKED FROM `HybridHomeV1`'s PACE PANEL, where this layout already lived
 * inline (its `PACE_PANEL` + `ProgressDial`). Copied rather than imported, on
 * purpose: that file is another designer's working home and pulling a shared
 * component out from under it would make a change here a change there. The
 * LAYOUT is duplicated; the DATA is not — both read the same `studyPace`
 * model from their own callers, so the cards cannot disagree about the plan.
 */

export function AtlasPaceRingCard({
  percent,
  weeks,
  hoursPerWeek,
  expected,
  exam,
  paceStyleName,
  paceIcon,
  standingMessage,
  noPace,
  readinessBelow = false,
  align = 'center',
  onCustomize,
}: {
  percent: number
  /** Which way the column reads — see `AtlasColumnAlign`. Centre is the
   *  committed default; `left` is the design bar's other arm. */
  align?: AtlasColumnAlign
  /**
   * THE BOOKED EXAM, under Estimated completion — 2026-10-20, from Jillienne's
   * third screen ("FLORIDA STATE EXAM / November 16 · 18 days").
   *
   * ⚠ OPTIONAL, AND ABSENT IS THE DEFAULT. This card is drawn by two Homes —
   * the End-to-End Demo's and Jill/Atlas-Main's. Only the second owns an exam
   * date (the first refuses to read one, deliberately; see its `studyPace`
   * note), so only the second passes this and the demo's card is unchanged by
   * construction rather than by a flag.
   *
   * ⚠ THE LABEL IS THE CALLER'S because it names the JURISDICTION — "Florida
   * state exam" — which this card cannot know. `expected` sets the precedent:
   * value plus an optional note, rendered the same way, so the two blocks
   * cannot drift apart in type or in treatment.
   */
  exam?: { label: string; value: string; note?: string }
  /**
   * The pace's name — "Crammer", "Average", "Thorough" (2026-10-20).
   *
   * ⚠ OPTIONAL, FALLING BACK TO THE MODULE CONSTANT. Until now this card
   * printed `paceName(PLANNER_PLAN.dayMins)`, which is a FROZEN fixture and so
   * has always read "Average" on every surface that draws the card. The
   * End-to-End Demo still gets that; the Atlas Home passes the name its own
   * pacing control resolved. Absent means "unchanged", which is what keeps the
   * demo's card the card it was.
   */
  paceStyleName?: string
  /** The glyph beside the goal. Defaults to the gauge this card has always
   *  drawn — see `paceIconFor` for the three-step mapping. */
  paceIcon?: ReactNode
  /** The finish DATE the same pace model produces, and its note. Shown under
   *  the week goal so the plan's span and the date it lands on are read
   *  together — they come from one `paceFit`, so they cannot describe two
   *  different plans, which is the failure the week count was derived to
   *  avoid in the first place. */
  /** Hours a week the recommended plan asks for — the pace model's own
   *  `minsPerWeek`, not `hoursRemaining / weeks`. The model splits the work
   *  over the nights a learner actually studies, so dividing the total myself
   *  would quietly answer a different question and disagree with the plan it
   *  sits under. */
  hoursPerWeek?: number
  /** The sentence under the goal once the learner is past 0% — how they are
   *  doing against it, built by `paceStandingMessage`. Undefined at 0%,
   *  where the starting-point copy stands instead. */
  standingMessage?: string
  expected?: { value: string; note?: string }
  /** Whether the Exam readiness section follows this card in the column.
   *  Only the BOTTOM rule of Estimated completion depends on it: that rule
   *  separates this card from what comes next, so with nothing next it is a
   *  line under the last thing on screen. */
  readinessBelow?: boolean
  /** Whole weeks the current plan runs to — the same figure the sentence and
   *  the goal line both read, so they cannot describe two different plans.
   *
   *  ⚠ UNDEFINED MEANS NO PACE FITS, and the card says so rather than
   *  printing a number (2026-10-19). It took a `number` with the caller
   *  falling back to a hardcoded 3 when `paceFit` came back empty — so with
   *  one day of access left, the hours line and the completion date both
   *  correctly vanished while a made-up "3 Week Goal" stayed, leaving the
   *  one figure on the card that nothing had computed. */
  weeks?: number
  /** WHY no pace fits, when none does — the pace model's own `binding`,
   *  `daysToCeiling` and `hardEndIso`. Undefined keeps the access wording
   *  this card has always shown; see `noPaceMessage`. */
  noPace?: NoPaceReason
  onCustomize?: () => void
}) {
  const eyebrow = atlasSectionEyebrow(align)
  const left = align === 'left'
  const noPaceCopy = noPaceMessage(noPace)
  return (
    /* ⚠ TWO SECTIONS, NOT ONE CARD (2026-10-16, Jillienne: "should be 3
       sections: Study Pace, Course Progress, Exam Readiness as the
       eyebrows"). The third is the Readiness card below, which takes the same
       eyebrow.

       It was ONE panel headed "Your study pace" with the dial inside it —
       which made the progress figure look like part of the pace, when they
       answer different questions: the pace is the plan, the dial is where the
       learner has got to against it. Splitting them is what lets each be
       named. */
    /* ⚠ THE PANEL'S BOTTOM AIR BELONGS TO WHATEVER IS LAST.
       — With readiness following, the card ENDS on its rule: the air below
         belongs to what the rule divides, and the panel's own 24 as well
         would push readiness a pad further off than the rule above it.
       — With Estimated completion last, THE BOX CARRIES ITS OWN 24 now
         (2026-10-19, Jillienne: "there should be padding below the date to
         match the padding above the date"), so the panel adds none. The air
         under the date is the same 24 it always was — it just sits inside
         the box, where it is symmetric with the 24 over the eyebrow,
         instead of outside it where the box looked lopsided.
       — With no pace at all there is no box, and the panel's own padding is
         the only thing holding that edge. */
    <div style={readinessBelow || expected ? { ...PANEL, paddingBottom: 0 } : PANEL}>
      {/* ⚠ COURSE PROGRESS LEADS THE COLUMN (2026-10-16, Jillienne: "move
          course progress to the top - shift everything else down"). Where the
          learner HAS GOT TO is the first thing they want; the plan for the
          rest follows from it. It sat under Study pace only because the dial
          used to live inside that card. */}
      <section style={{ ...SECTION, alignItems: 'center' }} aria-label="Course progress">
        <p style={eyebrow}>Course progress</p>
        <ProgressDial percent={percent} />
      </section>
      {/* ⚠ A RULE UNDER COURSE PROGRESS (2026-10-16). The two sections sat on
          a 24px gap alone, which reads as spacing rather than a boundary —
          and the figure above it is a different kind of thing from the plan
          below. Unlike the one under Estimated completion, this one always
          has something on both sides of it. */}
      <span aria-hidden style={DIVIDER} />
      <section style={SECTION} aria-label="Study pace">
        <p style={eyebrow}>Study pace</p>
        {/* ⚠ CENTRED, LIKE THE REST OF THE COLUMN'S CONTENT (2026-10-19,
            Jillienne: "have these be centered aligned to match the whole
            container of content"). Course progress centres its dial and
            Exam readiness centres its dial and caption; Study pace was the
            one section still running left, so the column had two alignments
            in it. The EYEBROWS stay left — all four of them do, and that is
            the pattern: the label left, the thing it names centred. */}
        {/* ⚠ THE GOAL ROW FOLLOWS THE LABELS ON THE LEFT ARM (2026-10-19,
            Jillienne: "left align this", with that variant on). The dials,
            the sentence and the completion date stay centred — the arm has
            been narrowed and widened one element at a time, so each thing
            it moves is asked for rather than assumed. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: left ? 'flex-start' : 'center', gap: 8 }}>
          <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
            {paceIcon ?? <GaugeThin size={33} aria-hidden />}
          </span>
          {weeks == null ? (
            /* ⚠ NO PLAN, AND IT SAYS WHY (2026-10-19). The wording is shared
               with `AtlasCourseProgressStates`, the tan card this one forked
               from: two cards answering the same question should not
               disagree about whether the question is answerable, nor about
               which deadline made it unanswerable — so it lives in
               `noPaceMessage` rather than being copied between them.

               ⚠ IT NAMES THE CEILING THAT ACTUALLY BOUND. Both cards used to
               blame access however the model had decided, which put "Extend
               your access" under a card whose real problem was an exam three
               days out. */
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={GOAL}>{noPaceCopy.title}</span>
              <span style={GOAL_NOTE}>{noPaceCopy.note}</span>
            </span>
          ) : (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            {/* ⚠ THE PACE'S NAME, READ OFF COMPASS (2026-10-16, Jillienne:
                "change to Average to match the header in compass side of
                things"). It said "Recommended", which named the figure's
                STATUS; Compass's planner heads the same plan "Your pace ·
                Average" — one of its three named paces — so the two surfaces
                were calling one thing two names, and "here" below goes
                straight to that planner.
                ⚠ DERIVED, NOT TYPED: `paceName` over the plan Compass opens
                on, so renaming a pace or moving the default there moves this
                too. It is the plan Compass OPENS with, not a live reading —
                Atlas Home sits outside `CompassPlanProvider`, so a pace the
                learner changes in the planner will not show here until the
                two models are joined. The WEEKS and HOURS beside it still
                come from Atlas's own `paceFit`.
                ⚠ THE NAME SAT OVER THE GOAL UNTIL 2026-10-19 (Jillienne:
                "Change this to Average (divider) 2 Week Goal all in one
                line"). The reason it was stacked still stands — on one line
                "Average 2 Week Goal" reads as a single title rather than a
                pace name and a goal — and the RULE is what answers it now,
                doing the line break's work in a third of the height. */}
            <span style={GOAL_LINE}>
              {/* ⚠ THE SAME STYLE AS THE GOAL (2026-10-19, Jillienne: "this
                  should be matching the styleing as the 2 week goal"). It
                  was 10px/600 uppercase in the eyebrow colour — a label
                  treatment, from when it sat ABOVE the goal and needed to
                  read as a note about it. Side by side with a rule between
                  them they are two halves of one line, and two treatments on
                  one line is what made it look like a label that had slipped
                  sideways. `COMPASS_PACE_NAME` is already title case; the
                  uppercase was only ever CSS. */}
              <span style={GOAL}>{paceStyleName ?? COMPASS_PACE_NAME}</span>
              <span aria-hidden style={GOAL_RULE} />
              <span style={GOAL}>{weeks} Week Goal</span>
            </span>
            {hoursPerWeek != null ? (
              <span style={GOAL_NOTE}>
                about {hoursPerWeek} hour{hoursPerWeek === 1 ? '' : 's'} / week
              </span>
            ) : null}
          </span>
          )}
        </div>
        {/* ⚠ "HERE" IS THE CONTROL NOW, not a button below (2026-10-16,
            Jillienne's copy). The sentence it replaces ended "you can change
            your pace below" and pointed at a "Customize Your Pace" button;
            this one points at itself, so that button went with the old
            wording — leaving both would have been two ways to the same page,
            one of which the copy no longer mentions. */}
        {weeks == null ? (
          /* ⚠ A DIFFERENT SENTENCE, NOT THE SAME ONE (2026-10-19). "Customize
             your pace here" points at a planner that has nothing to plan.
             The link goes, because there is nowhere useful for it to go.

             ⚠ AND SOMETIMES THERE IS NO SENTENCE AT ALL. Access is something
             a learner can buy more of; a booked exam is not, so the exam arm
             of `noPaceMessage` offers no fix and this line is simply absent
             rather than filled with advice that cannot work. */
          noPaceCopy.advice ? <p style={SMALL}>{noPaceCopy.advice}</p> : null
        ) : standingMessage ? (
          /* ⚠ ONCE THERE IS A PACE, THE CARD REPORTS IT (2026-10-19,
             Jillienne: "we need this type of messaging to be considered for
             the study pace section for when a user is no longer at 0%").
             "Your default recommended study pace is just a starting point"
             is true on day one and stale every day after — by then the
             learner HAS a pace, and how it is going is the thing worth the
             line. The sentence is `paceStanding.ts`'s, shared with
             `HybridPacingHome` so the two cards cannot report one standing
             two ways. The customise link goes with the starting-point copy:
             it belonged to the sentence that offered it. */
          <p style={SMALL}>{standingMessage}</p>
        ) : (
        <p style={SMALL}>
          Your default recommended study pace is just a starting point, you can further customize
          your pace{' '}
          {onCustomize ? (
            <button type="button" onClick={onCustomize} style={INLINE_LINK}>
              here
            </button>
          ) : (
            'here'
          )}
          .
        </p>
        )}
        {expected ? (
          /* ⚠ THE RULE GOES, THE PADDING STAYS (2026-10-19, Jillienne: "there
             should be padding below the date to match the padding above the
             date"). With nothing below it there is nothing to divide, so the
             bottom hairline is dropped — but the 24 under the date is KEPT,
             because the box is a box either way and 24 over the eyebrow with
             0 under the date reads as a mistake. The panel gives up its own
             bottom pad in exchange (see `PANEL`), so the air below the date
             is the same 24 it has always been — it just sits inside the box
             now, where it is symmetric, instead of outside it. */
          <FigureRow
            label="Estimated completion"
            value={expected.value}
            note={expected.note}
            /* ⚠ THE RULE AND THE PAD BELONG TO WHICHEVER ROW IS LAST. With
               the exam row following, this one neither closes the stack nor
               supplies the air under it — the exam row's own top rule is the
               next line down, and a bottom rule here would put two hairlines
               24 apart with nothing between them. */
            ruled={!exam && readinessBelow}
            tight={exam != null}
          />
        ) : null}
        {/* ⚠ RULED ABOVE, LIKE THE BLOCK IT FOLLOWS, so the column keeps one
            rhythm — the hairline belongs to the block BELOW it here, which is
            the rule `Estimated completion` already follows. */}
        {exam ? (
          <FigureRow label={exam.label} value={exam.value} note={exam.note} ruled={readinessBelow} />
        ) : null}
      </section>
    </div>
  )
}

/**
 * ONE FIGURE ROW — the label hard left, the figure hard right, and the
 * figure's note on its own line under it (2026-10-20, Jillienne: "have the
 * eyebrow header be left aligned, the date be right aligned, and the (days
 * remaining) small text underneath the date right aligned").
 *
 * ⚠ IT REPLACES A CENTRED PAIR, AND TAKES A DECISION OFF THE ARM. The row
 * used to sit label and figure together as a GROUP — centred in the column,
 * or against its left edge on the `align: 'left'` arm — so the arm decided
 * where the pair went. Pinned to the two edges there is nothing left for it
 * to decide, and the two rows read as a small table rather than two clumps.
 *
 * ⚠ THE NOTE IS A LINE NOW, NOT A ` · ` SUFFIX — which quietly reopens
 * something that was closed. Estimated completion's note was dropped on
 * 2026-10-19 because the label takes 166 of the column's 272 and
 * "May 24 · At current pace" wrapped mid-phrase. Under the figure it has the
 * figure's own width, so that constraint is gone: `expected.note` renders
 * again the moment a caller passes one. None does today — the EXAM row is
 * the only note on the card, and its days figure is what this was asked for.
 *
 * ⚠ BASELINE STILL WORKS, which is the one thing that looks at risk. The
 * right side is a COLUMN now, and a flex column's first baseline is its
 * first line's — the figure's — so the label still sits on the figure's
 * letters rather than on the middle of a two-line box.
 *
 * `ruled` is the BOTTOM hairline only; the top one is always drawn. See
 * `readinessBelow` for why the bottom one comes and goes.
 *
 * ⚠ `tight` IS WHAT KEEPS TWO ROWS FROM DOUBLING THEIR AIR — 2026-10-20,
 * Jillienne: "remove that additional padding above the divider line that is
 * making this look uneven". Every row carries 24 above its rule (its own
 * offset plus the section's gap) and 24 below the figure, which is right for
 * ONE row. Stacked, the first row's 24 under the figure lands on top of the
 * second's 24 over the rule — 48 above that line against 24 below it, which
 * is the lopsided gap she saw. The row that has another row after it gives
 * its bottom pad up; the LAST row keeps it, because there is nothing below
 * to supply the air.
 */
function FigureRow({
  label,
  value,
  note,
  ruled = false,
  tight = false,
}: {
  label: string
  value: string
  note?: string
  ruled?: boolean
  tight?: boolean
}) {
  return (
    <div
      style={{
        ...EXPECTED,
        ...(ruled ? null : { borderBottom: 'none' }),
        ...(tight ? { paddingBottom: 0 } : null),
      }}
    >
      <p style={EXPECTED_LABEL}>{label}</p>
      <div style={FIGURE}>
        <p style={EXPECTED_VALUE}>{value}</p>
        {note ? <p style={EXPECTED_NOTE}>{note}</p> : null}
      </div>
    </div>
  )
}

/** The ring. `role="img"` with the figure in the label, because the number
 *  inside it is drawn as three separate spans and would otherwise be read as
 *  "Course Progress 0 Complete". */
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
          /* At 0 the dash is zero-length, so the arc simply is not drawn —
             which is the honest picture of "not started" and the reason this
             needs no empty-state branch. */
          strokeDasharray={`${(c * pct) / 100} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {/* ⚠ NO "COURSE PROGRESS" INSIDE THE RING (2026-10-16, Jillienne:
          "remove the Course progress words from within the chart"). The
          section's eyebrow says it now, and the dial repeating it was the
          cost of promoting that label out of the card — two of the same words
          a centimetre apart. "Complete" stays: it qualifies the FIGURE, which
          the eyebrow does not. */}
      <div aria-hidden style={DIAL_TEXT}>
        <span style={DIAL_FIGURE}>{pct}%</span>
        <span style={DIAL_CAPTION}>Complete</span>
      </div>
    </div>
  )
}

/* ⚠ ONE GAP AROUND EVERY RULE (2026-10-16, Jillienne: "spacing between the
   components and the divider lines should be the same"). The column's own gap
   is what sat either side of the divider under Course progress; Estimated
   completion's rules were on the SECTION gap above and an 11px pad below. Same
   hairline, two different airs — so the card looked tighter at the bottom than
   in the middle. Both now read this. */
const RULE_GAP = 24
/* …and this is the separate, tighter one INSIDE a section — eyebrow to
   content. It is deliberately not `RULE_GAP`: that one is about rules, this
   one is about a label and the thing it names. */
const SECTION_GAP = 11

const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  /* Stretch, not centre: each section owns its own alignment now — the pace
     reads left, the dial sits centred — and a centring parent would shrink
     the left-aligned one to its content. */
  alignItems: 'stretch',
  gap: RULE_GAP,
  /* ⚠ NO HORIZONTAL PADDING (2026-10-16, Jillienne: "remove left/right
     padding"). It was `24px 22px`, and the 22 was itself a squeeze — the note
     here read "22 across, not 24, so 'Customize Your Pace ›' fits one line".
     With the fill gone there is nothing for side padding to inset FROM: the
     card sits directly on the Atlas Home's tan container, which has padding of
     its own, so this was inset inside an inset. Dropping it also retires the
     one-line squeeze, since the text now has the full column. */
  padding: '24px 0',
  borderRadius: 8,
  /* ⚠ NO FILL (2026-10-16, Jillienne: "remove the blue background here"). The
     panel was tinted in `HybridHomeV1`, where it sits on white and the tint is
     what separates it — that file's own note says "the tint carries the
     panel", which is why it has no shadow either. HERE it sits inside the
     Atlas Home's tan container, so the tint was a second surface on top of a
     surface. Without it the padding and the rule below do the separating.
     ⚠ SO IT NOW HAS NEITHER FILL NOR SHADOW: if this card is ever reused on a
     white ground it will have nothing to sit on, and that is the moment to
     give it back one of the two rather than both. */
  background: 'transparent',
  boxSizing: 'border-box',
}
/**
 * WHAT EVERY RULE ON THIS CARD IS DRAWN IN — 2026-10-20, Jillienne: "lets
 * have the divider lines be the same color as the background of the page".
 *
 * ⚠ THE PAGE'S GREY, NOT THE CARD'S OWN GROUND. Taken literally that would
 * make them invisible: the column sits on #f9f8f6 and a rule in its own
 * background is not a rule. This is `#eceef0` — the grey the Atlas page
 * draws its outlined cards and its course band in, which IS the background
 * behind the white of the page, and reads as a soft cool line against the
 * column rather than the tan one it replaces.
 *
 * ⚠ NOT THE TOKEN ITSELF. `--color-atlas-nav-rule` is still the tan, and
 * fourteen other files draw nav rules, card edges and the progress ring's
 * own track with it — repointing the token would move all of them. This is
 * one constant for THIS card, which is also what keeps its three rules the
 * same line as each other.
 */
const RULE_LINE = 'var(--color-atlas-outlined-card, var(--color-compass-page-card))'
/* One section of the column — an eyebrow and what it names. */
const SECTION: CSSProperties = { display: 'flex', flexDirection: 'column', gap: SECTION_GAP }
/* The column's own hairline, the same one Estimated completion is ruled with
   so the card has one kind of divider rather than two. */
const DIVIDER: CSSProperties = { display: 'block', height: 1, background: RULE_LINE }
/* Compass's name for the plan this card describes — see the tag's note. */
const COMPASS_PACE_NAME = paceName(PLANNER_PLAN.dayMins)
/* The pace name and the goal, side by side. `baseline` so a 10px tracked
   label and a 13px bold figure sit on the same line of text rather than on
   the middle of two boxes of different heights. */
const GOAL_LINE: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }
/* ⚠ THE RULE CARRIES WHAT THE LINE BREAK USED TO — see the note at the tag.
   A fixed 12 rather than `alignSelf: stretch`: on a baseline row, stretch
   gives it the height of the tallest box and it hangs below the letters. */
const GOAL_RULE: CSSProperties = {
  width: 1,
  height: 12,
  flex: 'none',
  alignSelf: 'center',
  /* ⚠ THE ONE RULE THAT KEEPS THE TAN, and deliberately — 2026-10-20. It
     took `RULE_LINE` with the other three for one build and vanished: a
     248px hairline carries #eceef0 against the column's #f9f8f6 easily, a
     1×12px pipe does not, and this one is doing the LINE BREAK's work
     between the pace name and the goal (see the tag's note). A separator
     nobody can see puts "Average 4 Week Goal" back to reading as one title,
     which is the thing the rule was introduced to fix. */
  background: 'var(--color-atlas-nav-rule)',
}
/* …and the workload under it, in the body treatment the paragraph below
   uses, because it is a fact about the plan rather than another heading. */
const GOAL_NOTE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-secondary)',
}
/* A BUTTON STYLED AS A LINK, inside a sentence: it navigates within the app
   rather than to an address, so an <a href> would be a lie about what it is.
   `display: inline` and the inherited type keep it on the line. */
const INLINE_LINK: CSSProperties = {
  display: 'inline',
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: 'var(--color-compass-page-button)',
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  cursor: 'pointer',
}
const GOAL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}
const SMALL: CSSProperties = {
  /* A MEASURE, not the card's width — see `ATLAS_COLUMN_PROSE_W`. `auto`
     sides keep the narrower block centred under the full-width rules above
     it rather than hanging off one edge. */
  margin: '0 auto',
  maxWidth: ATLAS_COLUMN_PROSE_W,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  textAlign: 'center',
  color: 'var(--color-text-secondary)',
}
/* Ruled off above and below, as the design draws it — the date is a
   different kind of fact from the sentence over it, and the rules are what
   say so without a second card. */
/* ⚠ ONE LINE, NOT TWO (2026-10-19, Jillienne: "move this to the right of the
   eyebrow - no need for 2 lines"). The label and the date were stacked on a
   2px gap, which gave two short lines a 93-tall band to sit in. Side by side
   they are a label and its value, which is what they are. */
const EXPECTED: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  /* BASELINE, not centre: an 11px tracked label beside a 19px serif figure
     lines up on the letters sitting on the same line, not on the middle of
     two boxes of different heights. */
  alignItems: 'baseline',
  /* ⚠ THE LABEL AND THE FIGURE ARE PUSHED APART, not spaced (2026-10-20) —
     the two edges are the alignment, so the gap is only the floor under a
     long label meeting a long figure. */
  justifyContent: 'space-between',
  gap: 10,
  padding: `${RULE_GAP}px 0`,
  /* The section's gap already puts `SECTION_GAP` above this box, so the rule
     needs the remainder to stand off by the same `RULE_GAP` as the one under
     Course progress. Written as the subtraction rather than 13, so moving
     either constant keeps the two rules matched. */
  marginTop: RULE_GAP - SECTION_GAP,
  borderTop: `1px solid ${RULE_LINE}`,
  borderBottom: `1px solid ${RULE_LINE}`,
}
/* The same eyebrow as the card's own — it labels a figure in the same column
   and had no reason to be a smaller, bolder one. */
/* `flex: 'none'` so the label keeps its own width in the row rather than
   being squeezed by a long date; `alignSelf: auto` so the box's baseline
   alignment applies to it. */
/* ⚠ `textAlign: 'left'` IS BELT AND BRACES, and worth keeping. `flex: 'none'`
   already shrinks the <p> to its own text, so there is nothing for the
   alignment to act on — but the shared eyebrow it spreads sets `center`, and
   the day someone gives this label a width that reads as the row centring
   itself again. */
/* ⚠ THE LABEL IS WHAT GIVES WAY, not the figure (2026-10-20). It was
   `flex: 'none'`, which put the whole squeeze on the right-hand side: at 248
   of column, "FLORIDA STATE EXAM" takes 143 and leaves 95 for a date needing
   about 105, so "November 16" broke after the month and the row ran to three
   lines. A LABEL wrapping to two lines of 11px is ordinary; a DATE broken
   across two lines of 19px serif is not — and the figure is the thing the row
   exists to show. `minWidth: 0` is what actually lets it wrap. */
const EXPECTED_LABEL: CSSProperties = { ...ATLAS_SECTION_EYEBROW, alignSelf: 'auto', minWidth: 0, textAlign: 'left' }
/* The figure and its note, stacked against the right edge, at their own
   width — see the label's note for which side yields. */
const FIGURE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  flex: 'none',
}
/* ⚠ THE FIGURE ALIGNS, THE BOX DOES NOT. Shrinking the box to its content
   would take the two rules in with it — they have to span the column, which
   is the whole reason they read as rules rather than underlines. So the
   alignment lives on the text and on `FIGURE`'s cross axis. */
const EXPECTED_VALUE: CSSProperties = {
  margin: 0,
  textAlign: 'right',
  /* One line, always — see `EXPECTED_LABEL`. */
  whiteSpace: 'nowrap',
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 19,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}
/* The note rides on the date's line, in body type — it qualifies the figure
   rather than standing beside it as a second one. */
/* ⚠ A <p> UNDER THE FIGURE SINCE 2026-10-20, not a span inside it — so it
   needs its own `margin: 0` and line height, which it inherited before. It
   is the same 11px secondary treatment as `GOAL_NOTE`; the two are the only
   sub-lines on the card and they should read alike. */
const EXPECTED_NOTE: CSSProperties = {
  margin: 0,
  textAlign: 'right',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
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
