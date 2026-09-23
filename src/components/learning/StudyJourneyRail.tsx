import { type CSSProperties } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ChevronRight, CircleCheck } from '@/icons'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
import { journeyStopsFor, metaWords, statusWords, type JourneyStop } from './studyJourneyUtil'
import { unitCount } from '@/utils/unitLabel'
import { widgetEyebrowStyle } from './widgetStyles'

/**
 * STUDY JOURNEY — the curriculum as an ordered SEQUENCE.
 *
 * Added 2026-09-16 for the QE Focused dashboard version, where it replaces the
 * Today's Tasks card in the top band's white half.
 *
 * ── Why it is not the Study Plan ──────────────────────────────────────────
 *
 * They answer different questions, and that is the whole reason both exist:
 *
 *   - The **Study Plan** is DATE-paced. "What is due today, this week, before
 *     the exam." It is a calendar, it can put you behind, and its unit is a
 *     task with a due date.
 *   - The **Study Journey** is SEQUENCE-paced. "Where am I in the programme and
 *     what comes next." It has no dates, cannot make you late, and its unit is
 *     a piece of the curriculum.
 *
 * A candidate three weeks from an exam needs both, and conflating them is how
 * one of them stops being useful: a journey with due dates is just a worse
 * calendar, and a calendar with no ordering cannot tell you what Part 2 follows.
 * So this component holds NO dates and NO overdue state — if a date belongs on
 * screen it belongs on the Study Plan, which is one rail item away.
 *
 * ── Where the sequence comes from ────────────────────────────────────────
 *
 * `resolvePathCategories` → `synthCategoryCourses`, the SAME pair the Learning
 * Path detail Progress tab renders its per-category course lists from. On the
 * QE Focused version those lists are directly below this band, so a journey
 * built from its own fixture would contradict them on the same screen. Nothing
 * here is authored.
 *
 * ── Milestones ────────────────────────────────────────────────────────────
 *
 * Assessment categories (`simulators`, `exam-cram`) render as MILESTONES —
 * accent-coloured, on a heavier node — because sitting a practice exam is a
 * different kind of act from working through a lesson, and the reference design
 * makes exactly that distinction with its Mini Exams.
 *
 * KNOWN GAP, and deliberately not faked: the reference INTERLEAVES its
 * milestones between chapter groups (A1, A2, Mini Exam 1, A3, A4, Mini Exam 2).
 * Doing that needs a curriculum outline that says which chapters a given mini
 * exam covers, and the XCEL fixtures carry hour REQUIREMENTS per category, not
 * a syllabus. So milestones sit where the category order puts them — at the end
 * — rather than at invented positions. Author the outline and the interleaving
 * is a re-sort, not a rebuild.
 */

/**
 * The section's label — "Atlas Study Journey" as of 2026-09-17.
 *
 * ONE CONSTANT, read by BOTH treatments. The compact rail and the syllabus one
 * style this line differently and must not NAME the thing differently: that is
 * the rule the Rubi rename had to learn the hard way, where the product's name
 * lived in four places and two of them said something else for a while.
 *
 * The `<ol>`'s `aria-label` stays "Study journey stops" — it names the LIST for
 * assistive tech and is what the tests address the sequence by, so it is an
 * address rather than a display string. A comment here used to say the eyebrow
 * and that label matched; they no longer do, deliberately.
 */
export const STUDY_JOURNEY_EYEBROW = 'Atlas Study Journey'

export function StudyJourneyRail({
  path,
  onOpenStop,
  onViewAll,
  stepRange = false,
}: {
  path: LearningPathSummary
  /** Open a stop. Omitted → the rows render as plain text rather than links. */
  onOpenStop?: (id: string) => void
  /** Route into the full Learning Path. */
  onViewAll?: () => void
  /**
   * Prefix the eyebrow with this card's STEP RANGE — "Steps 01–04 · Atlas Study
   * Journey" (2026-09-21, the direct ask).
   *
   * ONLY FOR THE SPLIT (Testing), where the post-course steps are their own
   * cards labelled "Step 05", "Step 06", "Step 07". Without it the column's
   * four eyebrows read "Atlas Study Journey / Step 05 / Step 06 / Step 07" and
   * the sequence appears to start at 05; with it the numbers run down the left
   * edge of every card and the four read as one route.
   *
   * NOT on the single-card treatment, deliberately: there is no set of eyebrows
   * there for the range to join, and the stops numbered 01-04 sit directly
   * under it — so it would be the same figures twice, three lines apart. One
   * line to change if the range is wanted everywhere.
   */
  stepRange?: boolean
}) {
  /*
   * RAIL TREATMENT — `dashboard-journey-style`, variant-only (2026-09-16).
   *
   * `syllabus` is a formal restyle to a supplied reference: a bordered card, a
   * serif heading under a "Syllabus sequence" eyebrow, NUMBERED nodes, serif
   * row titles, a percentage chip on the active stop, and a meta line on every
   * row — including the blocked ones, which the compact rail drops.
   *
   * SAME STOPS, SAME DATA. The variant does not split "Attestation &
   * Certificate" back into two, does not rename anything, and authors no
   * descriptive copy: the reference carries lines like "Mandatory sworn
   * affidavit of identity & contact hours" and "Foundational jurisprudence",
   * which are claims about New York practice that nothing in the fixtures
   * sources. What each row says here is what `metaWords` already knew.
   */
  const syllabus = useFeatureFlag('dashboard-journey-style').variant === 'syllabus'
  const stops = journeyStopsFor(path)
  /* DERIVED from the real stop count, never authored — merging two completion
     stops into one already changed it once, and the same count is what
     `StudyJourneyWidget` offsets the licensing steps by. The two cannot
     disagree about where 04 ends and 05 begins. */
  const eyebrowText =
    stepRange && stops.length > 0
      ? `Step 1 \u00b7 ${STUDY_JOURNEY_EYEBROW}`
      : STUDY_JOURNEY_EYEBROW
  /*
   * LESS WORDS. `metaWords` prints group · count · status, which on this
   * treatment says everything twice: the group is already the row's title (or
   * the "Part 2" label on its right), and the status is already the chip. Row 1
   * read "Pre-licensing Course · 26 / 42 lessons · In progress · 62%" beside a
   * title saying "Pre-licensing Course" and a chip saying "62% In progress";
   * row 2 read "Part 2 · …" beside a label saying "Part 2".
   *
   * What is left is the part that appears nowhere else: the count in words, the
   * published target, and the unlock condition.
   */
  const leanMeta = (stop: JourneyStop): string => {
    const unit = path.unitLabel ?? 'hrs'
    const bits: string[] = []
    /* THE COMPLETION COUNT IS GONE — 2026-09-21, the direct ask ("this is shown
       already"). Row 1 read "26 of 42 lessons complete" three inches under the
       course header's own stat row saying "26 of 42 lessons COMPLETED", which
       is the duplication this whole treatment was trimming; it simply survived
       the first pass because the header gained that cell later.

       ⚠ ONLY THE "X of Y complete" FORM GOES. A stop with no completion still
       prints its SIZE ("8 hrs"), which appears nowhere else on the page and is
       how a learner sizes up a step they have not reached. Dropping the whole
       branch would have taken that with it. */
    if (stop.hours != null && stop.completed == null) {
      bits.push(unitCount(stop.hours, unit))
    }
    // Everything after "Part N" in the group — the published target, which the
    // right-hand label does not carry.
    const tail = stop.group.split(' · ').slice(1).join(' · ')
    if (tail) bits.push(tail)
    if (stop.blocked) bits.push('Unlocks after coursework')
    return bits.join(' · ')
  }
  const completed = stops.filter((s) => s.status === 'completed').length
  // The stop the learner is ON — the first not-yet-finished one. Drives the
  // filled node, so "where am I" is answerable without reading every row.
  const currentIndex = stops.findIndex((s) => s.status !== 'completed')

  if (stops.length === 0) return null

  return (
    <div style={syllabus ? syllabusWrapStyle : wrapStyle}>
      <div style={headerRowStyle}>
        {/* REMOVED 2026-09-16 — the "How do I become exam ready?" disclosure
            that sat under this eyebrow (from the reference design). It was a
            collapsed paragraph explaining that the stops run in order and that
            readiness means coursework done plus simulator scores holding.

            The rail says all of that structurally: the stops ARE in order, each
            carries its status in words, and the two assessment stops are marked
            on the node. A disclosure explaining the thing directly beneath it is
            chrome above the content — and a collapsed one is useful once and
            invisible after, so nobody who needed it twice would find it.

            The Readiness section is where "am I exam ready" is answered with a
            number; this was a second, wordier answer two rail items away. */}
        <div style={{ minWidth: 0 }}>
          {syllabus ? (
            <>
              {/* "Study Journey" is the EYEBROW here and "Complete Course" the
                  heading (2026-09-16) — it read "Syllabus sequence" over "Study
                  Journey". The eyebrow now matches the section's own
                  `aria-label`, and the heading says what the section is FOR: the
                  rail's job is getting the course finished, and the licensing
                  card below it picks up after that. */}
              <p className="cre-eyebrow-ink" style={syllabusEyebrowStyle}>{eyebrowText}</p>
              {/* "Complete Coursework" as of 2026-09-17, matching the supplied
                  reference. It was "Complete Course" for a day — the word the
                  reference uses is the broader one, and it is the more accurate
                  of the two here: the rail covers the pre-licensing course AND
                  the prep review, the simulators and the attestation, which are
                  the coursework rather than the course. */}
              <p style={syllabusTitleStyle}>Complete Coursework</p>
            </>
          ) : (
            <p className="cre-eyebrow-ink" style={eyebrowStyle}>{eyebrowText}</p>
          )}
        </div>
        {/* Position in the sequence, not a percentage — a journey's own unit.
            The gauge two sections down already reports the percentage, and by
            CREDIT HOUR rather than by stop, so a second percentage here would
            be a different number for the same idea. */}
        {/* NO COUNT ON THE SYLLABUS TREATMENT (2026-09-17, matching the
            reference). It read "Milestone 0 / 4 Complete" beside the heading.

            At the demo's own state that line says ZERO — the learner is 62%
            through part one, and none of the four stops is finished — so the
            first thing the card reported was a nought, over a list whose top
            row says "26 of 42 lessons complete". Two true numbers arguing.

            The compact rail keeps its count: it has no room for the per-row
            detail this treatment prints, so the position in the sequence is the
            only summary it can give. */}
        {syllabus ? null : (
          <span style={countStyle}>
            {completed} / {stops.length}
          </span>
        )}
      </div>

      {/* `aria-label` so tests and assistive tech can address the sequence
          itself rather than guessing at an ancestor — the status words live on
          the ROWS, and an over-wide scope would pass without them. */}
      {/* The syllabus treatment gives the rows more room (18px of minimum
          spine between nodes rather than the compact rail's 14) — the reference
          is a short list with air around it, and at the compact spacing four
          17px titles read as a dense block. The gap is on the SPINE's
          `minHeight` rather than on the list, so the connector still reaches
          between nodes instead of breaking into dashes. */}
      <ol aria-label="Study journey stops" style={listStyle}>
        {stops.map((stop, i) => {
          const isCurrent = i === currentIndex
          const isLast = i === stops.length - 1
          // A blocked completion task is not a link. It has nothing to open
          // yet, and a chevron on it promises otherwise.
          const interactive = Boolean(onOpenStop) && !stop.blocked
          const label = (
            <>
              {/* MILESTONE TITLES ARE NOT COLOURED (2026-09-16). They were
                  Brick red for a day, on the reasoning that an assessment is a
                  different act from a lesson and the reference design accents
                  its mini exams. The problem is what red MEANS: "Exam
                  Simulators · 6 hrs · Not started" in red reads as a problem,
                  when it is just a step not reached yet — and the two
                  milestones happen to be the two not-started stops, which
                  strengthens the misreading. Same tension CLAUDE.md records on
                  the readiness gauge: red on a CHAPTER is actionable, red on
                  YOU is discouraging, and a milestone you have not reached is
                  the second kind.
                  The distinction survives on the NODE — see
                  `nodeMilestoneStyle` — as a weight of ink rather than a hue. */}
              {syllabus ? (
                /* WRAPS. The column is ~296px since the band's grid moved to
                   660:380, and a chip holding ~110px of that left the title
                   ~150 — "01. Pre-licensing Course" over three lines. Wrapping
                   drops the chip to its own line only when the title needs the
                   room, so a wide column still gets them side by side and a
                   narrow one stops shouting. */
                /* THE ROW IS JUST ITS TITLE as of 2026-09-17, matching the
                   reference. Three things left it, and each was saying
                   something the row already said:

                     - The "01." PREFIX. The node beside it is the number, at
                       the same two digits. A row that reads "01. 01.
                       Pre-licensing Course" to anyone scanning the column is
                       one numbering system too many.
                     - The "62% In progress" CHIP. The line directly beneath it
                       reads "26 of 42 lessons complete", which is the same fact
                       with its workings shown.
                     - The "Part 2" / "Part 3" LABEL on blocked rows. It is the
                       first segment of the stop's own group, i.e. a second
                       naming of the row.

                   The title row no longer needs to wrap or space-between,
                   because there is nothing to sit opposite. */
                <span
                  /* `.cre-stop-title` — blue at rest, darker + underlined on the
                     row's hover — only when the row OPENS something. A blocked
                     stop gets no class and keeps the ordinary ink, the same rule
                     that denies it a chevron. */
                  className={interactive ? 'cre-stop-title' : undefined}
                  style={{
                    ...(interactive ? syllabusRowTitleStyleNoColor : syllabusRowTitleStyle),
                    /* A COLOUR, not `opacity: 0.55`. The opacity composited to
                       roughly #939393 on the card — about 3.5:1, under AA for
                       16px text — and it was applied to the ONE state that
                       makes up three of the four rows. `--color-text-tertiary`
                       is 6.19:1 light and 6.18:1 dark, and it is the grey the
                       reference shows. */
                    ...(stop.blocked
                      ? { color: 'var(--color-text-tertiary)', fontWeight: 400 }
                      : null),
                  }}
                >
                  {stop.title}
                </span>
              ) : (
                <span style={titleStyle}>{stop.title}</span>
              )}
              {/* NEVER COLOUR ALONE. The node says the state in hue (green +
                  check / filled / hollow) and this says it in words — the rule
                  the Home week strip's DONE / IN PROGRESS / N OVERDUE flags
                  follow. The first build omitted it, which left `completed` and
                  `not-started` distinguishable ONLY by the node: same text, same
                  everything, one filled circle apart. The wording matches the
                  Progress lists directly below on this version, so the two
                  describe the same stop the same way.

                  BLOCKED STOPS CARRY NO META LINE (2026-09-16, the direct ask).
                  Every stop after the current one is blocked, so all of their
                  meta lines ended in the same four words — four stacked rows of
                  "· After your coursework" under four titles, which is a
                  paragraph of repetition where the point was a sequence.

                  The trade-off is real and worth stating: what those lines also
                  carried was Part 2's 80% target, Part 3's "3 simulators, aim
                  for 85%", and the blocked reason itself. The reason survives
                  on the row's `title` so it is still available on hover and to
                  assistive tech; the published targets are now only on the
                  requirements sheet the block links.

                  What makes the rule safe rather than arbitrary is that blocked
                  and not-started never appear TOGETHER here — everything after
                  the current stop is blocked — so the missing words are not
                  what would have told two visible states apart. If a path ever
                  mixes them, this needs the words back. */}
              {/* BLOCKED ROWS NOW CARRY NO META ON EITHER TREATMENT
                  (2026-09-17). The syllabus one printed `leanMeta` on all four
                  — "Part 2 · aim for 80% · Unlocks after coursework" and so on
                  — which is three rows ending in the same clause under three
                  greyed titles. The reference prints a sub-line on the ACTIVE
                  row only, and it is right for the same reason the compact rail
                  already dropped its own: the sequence says "not yet" by
                  position, and repeating it per row is a paragraph where the
                  point was a list.

                  The cost is real and unchanged from that earlier note: Part
                  2's published 80% target and Part 3's "3 simulators, aim for
                  85%" are now only on the requirements sheet this block links.
                  The blocked REASON survives on the row's `title`, so it is
                  still on hover and available to assistive tech.

                  Safe rather than arbitrary for the same reason as before:
                  blocked and not-started never appear TOGETHER here, so the
                  missing words are not what would tell two visible states
                  apart. A path that ever mixes them needs them back. */}
              {stop.blocked ? (
                /* THE STATE IN WORDS, for assistive tech — visible only to a
                   screen reader.
                 *
                 * This is NOT belt-and-braces. Both earlier notes claimed the
                 * blocked reason "survives on the row's `title`", and on
                 * 2026-09-17 that turned out never to have been implemented:
                 * there was no `title` attribute anywhere in this file. So with
                 * the meta line gone, a blocked stop was conveyed by grey text
                 * alone — colour and weight and nothing else, which is the one
                 * rule this rail has held since it was built.
                 *
                 * Same class of defect as `.cre-journey-stop`, a class that was
                 * applied for days with no rule behind it: a mechanism named in
                 * a comment, relied on by a later decision, and never there. */
                <span style={srOnlyStyle}>{statusWords(stop)}</span>
              ) : (
                <span style={{ ...metaStyle, ...(syllabus ? { fontSize: 12, lineHeight: '17px' } : null) }}>
                  {syllabus ? leanMeta(stop) : metaWords(stop, path.unitLabel ?? 'hrs')}
                </span>
              )}
            </>
          )
          return (
            <li key={stop.id} style={syllabus ? syllabusItemStyle : itemStyle}>
              {/* The spine + node. `aria-hidden` throughout: the ordered list
                  already conveys sequence to a screen reader, and the status is
                  in the row's own text — never colour alone. */}
              <span aria-hidden style={syllabus ? syllabusRailColStyle : railColStyle}>
                {syllabus ? (
                  /* PLAIN CIRCLES, NO DIGITS — 2026-09-23, the direct ask:
                     "change the UI for these numbers - just make circles. The
                     steps are getting to be too much."
                
                     THE DIGITS WERE NUMBERING THE WRONG THING. Five numbered
                     stops here plus three numbered cards below made an
                     eight-step journey out of what is really four: the
                     coursework is ONE step, and these five are what it is made
                     of. Numbering them competed with the numbering that
                     matters. The `<ol>` still carries the order for anyone not
                     looking at it, which is why this column was always
                     `aria-hidden` — the digits were decoration, and removing
                     decoration costs nothing semantic.
                
                     SMALLER WITH THEM: 26px sized a two-digit label, and an
                     empty 26px ring reads as a missing avatar. 14 is the size
                     the compact rail's own node uses and the size the Compass
                     player's contents bullets use, so the product has one
                     circle. */
                  <span
                    style={{
                      ...syllabusDotStyle,
                      ...(stop.status === 'completed'
                        ? syllabusDotDoneStyle
                        : isCurrent
                          ? syllabusDotCurrentStyle
                          : null),
                    }}
                  >
                    {stop.status === 'completed' && <CircleCheck size={11} aria-hidden />}
                  </span>
                ) : (
                <span
                  style={{
                    ...nodeStyle,
                    ...(stop.status === 'completed'
                      ? nodeDoneStyle
                      : isCurrent
                        ? nodeCurrentStyle
                        : null),
                    ...(stop.milestone ? nodeMilestoneStyle : null),
                  }}
                >
                  {stop.status === 'completed' && <CircleCheck size={11} aria-hidden />}
                </span>
                )}
                {/* THE CONNECTOR IS DASHED UNLESS THE STEP ABOVE IT IS DONE
                    — 2026-09-23, the direct ask.

                    It reads as ground covered vs ground ahead, and it is the
                    SEGMENT BELOW a node that carries it: a solid length under
                    step 1 says "you finished this and moved on", which is the
                    thing the learner wants to see. The stop's own status is the
                    only input, so the rail cannot disagree with the words on
                    the row beside it.

                    NOT COLOUR — the same `--color-border-subtle` throughout.
                    The dash is a texture, so it survives the dark theme and
                    does not become a third status hue on a rail that already
                    says everything in words (2.1.4.1, not-by-colour-alone). */}
                {!isLast && (
                  <span
                    style={
                      syllabus
                        ? stop.status === 'completed'
                          ? syllabusSpineStyle
                          : syllabusSpineDashedStyle
                        : spineStyle
                    }
                  />
                )}
              </span>
              {interactive ? (
                <button
                  type="button"
                  onClick={() => onOpenStop?.(stop.id)}
                  className="cre-journey-stop"
                  style={rowButtonStyle}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    {label}
                  </span>
                  <ChevronRight size={14} aria-hidden style={{ flexShrink: 0, opacity: 0.55 }} />
                </button>
              ) : (
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, padding: '2px 0 14px' }}>
                  {label}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {onViewAll && (
        <button type="button" onClick={onViewAll} className="cre-link-action cre-cta-ink" style={viewAllStyle}>
          Open learning path
        </button>
      )}
    </div>
  )
}

/**
 * GET LICENSED — the three steps after the coursework (2026-09-16).
 *
 * Sits directly below the Study Journey, because together they are one route:
 * XCEL's published path to a New York licence is four steps, the journey IS
 * step 1 expanded, and this is steps 2-4.
 *
 * ── Why it is a separate section rather than five more journey stops ──────
 *
 * **The owner changes.** Everything in the journey happens inside the LMS and
 * XCEL knows whether it is done. Nothing here does — PSI schedules the sitting,
 * PSI scores it, and the Department of Financial Services issues the licence.
 * Running them on as stops would put a node and a status on three things the
 * product cannot observe.
 *
 * **So these steps carry NO completion state**, and the absence is the honest
 * part rather than an omission. A tick against "Pass State Exam" would be the
 * product claiming to know an outcome it has no feed for. What each step gets
 * instead is who owns it, what the learner actually does, and the published
 * fee. A test asserts there is no status here, so adding one is a deliberate
 * act that needs a real feed behind it.
 *
 * Numbered rather than noded: a numbered list reads as "do these in order" and
 * makes no claim about where you are, which is exactly the right amount to say.
 *
 * Every figure and the PSI URL come from `GET_LICENSED_STEPS`, confirmed against
 * XCEL's own requirements page — the rule the Resources section had to learn
 * after shipping four dead slugs.
 */
export function GetLicensedRail({
  onOpenStep,
  onOpenRequirements,
  state,
  startNumber = 1,
}: {
  /**
   * Open the requirements sheet, as a link at the FOOT of this card.
   *
   * It lived in the course header band at the top of the page until
   * 2026-09-16. It belongs here: the sheet is the state's own rules, and this
   * is the card about what the state requires — at the top it was an action
   * without a subject, three sections above the thing it elaborates.
   */
  onOpenRequirements?: () => void
  /** Two-letter jurisdiction, for the `syllabus` heading. Omitted → the
   *  heading stays the generic "Get Licensed". */
  state?: string
  /**
   * Open a step's detail. Omitted → the rows render as plain text, the same
   * guard the journey's `onOpenStop` uses.
   *
   * On QE Focused this opens the REQUIREMENTS SHEET, which is the only surface
   * that describes these three: XCEL's published page covers sitting the exam,
   * applying, and the CE cycle that follows. It is not a per-step destination
   * and does not pretend to be — a step-specific page would need content
   * nobody has authored, and an invented href is the defect the Resources
   * section shipped four of.
   */
  onOpenStep?: (id: string) => void
  /** First numeral, so these continue the journey's sequence rather than
   *  restarting at 1. The caller passes the journey's stop count + 1. */
  startNumber?: number
} = {}) {
  const syllabus = useFeatureFlag('dashboard-journey-style').variant === 'syllabus'
  const where = jurisdictionName(state)
  return (
    /* ITS OWN CARD on the syllabus treatment — two distinct sections rather
       than one block divided by a rule. What changes between them is WHO owns
       the work (XCEL, then the state), and a card boundary says that more
       plainly than a hairline does. The widget drops its rule when both are
       cards; see `StudyJourneyWidget`. */
    <div style={syllabus ? syllabusWrapStyle : wrapStyle}>
      <div style={headerRowStyle}>
        <div style={{ minWidth: 0 }}>
          {syllabus ? (
            <>
              <p className="cre-eyebrow-ink" style={syllabusEyebrowStyle}>Post-course process</p>
              <p style={{ ...syllabusTitleStyle }}>
                {where ? `Get Licensed in ${where}` : 'Get Licensed'}
              </p>
            </>
          ) : (
          <p style={eyebrowStyle}>Get Licensed</p>
          )}
          {/* THE LEDE IS GONE FROM THE SYLLABUS TREATMENT — 2026-09-17, the
              direct ask.

              It read "Post-course state licensing milestones and
              requirements:", which the eyebrow ("Post-course process") and the
              heading ("Get Licensed in New York") already say between them —
              the third saying of one idea, and the longest. It also ended in a
              colon pointing at a list that now numbers 05-07 in continuation of
              the journey above, so the sequence introduces itself.
              
              The COMPACT rail keeps its own lede. That one is doing different
              work: its heading is a bare "Get Licensed" with no state and no
              eyebrow above it, so "Once your course is completed, here are the
              next steps" is the only thing placing the section in time. */}
          {syllabus ? null : (
            <p style={{ ...railLedeStyle, margin: '3px 0 0' }}>
              Once your course is completed, here are the next steps.
            </p>
          )}
        </div>
      </div>
      {/* NO LIST GAP — 2026-09-17. It was 10 on the syllabus treatment, which
          sat ON TOP of the 8px the `<li>` now carries: measured, the Get
          Licensed rows were 39px node-to-node against the journey's 29, so the
          two halves of one 01-07 sequence were spaced differently.

          The 10 is left over from when each step was its OWN BORDERED CARD and
          needed separation between cards. The cards went when the section lost
          its background and stroke; the gap should have gone with them — the
          same leftover as the nodes' white fill and the row button's 14px
          bottom padding, both of which also outlived the surface they were
          drawn against.

          Spacing comes from `itemStyle`'s `paddingBottom` in both lists now, so
          the sequence is evenly spaced end to end. */}
      <ol style={{ ...listStyle, marginTop: 12 }}>
        {GET_LICENSED_STEPS.map((step, i) => (
          <li
            key={step.id}
            style={itemStyle}
          >
            {/* CONTINUES THE JOURNEY'S SEQUENCE — 2026-09-17, the direct ask
                ("numbers sequential, 5, 6, 7"). The rows took their own 1, 2, 3
                inside bordered cards; they are 05, 06, 07 on the journey's own
                nodes now, sharing its spine.

                That is a reversal worth stating. The cards were there to say
                "the OWNER changes here" — everything above happens in the LMS
                and nothing below does — and the restart at 1 said the same
                thing in numerals. Running one sequence 01→07 says instead that
                this is one route to a licence, which is what the learner is
                actually walking. The owner is still named: each step carries
                its vendor on the sheet the row opens.

                `startNumber` is passed rather than assumed, so the offset is
                the journey's real stop count — it was 5 the day the journey had
                four stops, and merging two of them once already changed that. */}
            <span aria-hidden style={syllabus ? syllabusRailColStyle : railColStyle}>
              {syllabus ? (
                /* SOLID, not dashed — these steps are open, not locked. See
                   `syllabusNodeOpenStyle`. */
                <span style={{ ...syllabusNodeStyle, ...syllabusNodeOpenStyle }}>
                  {startNumber + i}
                </span>
              ) : (
                <span style={stepNumberStyle}>{i + 1}</span>
              )}
              {/* THE OLD 18px SPINE, kept deliberately. The tightening asked
                  for on 2026-09-23 was "the spacing between steps 1-5" — this
                  is the Get Licensed list, and its rows are unchanged, so
                  shortening only its connector would leave a stub between
                  nodes that are still 55px apart. */}
              {i < GET_LICENSED_STEPS.length - 1 && (
                <span style={syllabus ? syllabusStepSpineStyle : spineStyle} />
              )}
            </span>
            {/* WHOLE-ROW TARGET, hover + chevron — 2026-09-16, matching the
                journey rail above. It was static text with one link on the
                first step's title, so three rows that describe three actions
                looked like three paragraphs, and the one affordance was a
                differently-coloured word.

                The row is ONE target, not a row containing a link: a link
                inside a button is invalid, and two nested targets on a 13px
                title is a coin flip for the learner. Which element it is
                depends on where it goes:

                  - `href` → an `<a>` opening PSI in a new tab, so a learner
                    mid-journey does not lose the dashboard to a registration
                    flow. The meta line names PSI, so the row says where it
                    goes.
                  - no href → a `<button>` into the requirements sheet.

                `titleStyle` for ALL THREE now, including the PSI row. The CTA
                ink was carrying "this is interactive" for one step; the hover
                and the chevron carry it for every step, and three identical
                rows is the point. That also retires the
                `titleStyleNoColor` trap on this row — there is no longer a
                theme class here whose colour an inline style could beat. */}
            <GetLicensedRow step={step} onOpenStep={onOpenStep} syllabus={syllabus} />
          </li>
        ))}
      </ol>
      {onOpenRequirements ? (
        <button
          type="button"
          onClick={onOpenRequirements}
          className="cre-link-action cre-cta-ink"
          style={{ ...viewAllStyle, alignSelf: 'flex-end', marginTop: 14 }}
        >
          State requirements →
        </button>
      ) : null}
    </div>
  )
}

/**
 * One Get Licensed step as a whole-row target.
 *
 * Three shapes, one appearance — the interaction cue is the hover wash and the
 * chevron, so the three rows read as three of the same thing:
 *
 *   - **`href`** → an `<a>` to PSI, new tab.
 *   - **`onOpenStep`** → a `<button>` into the requirements sheet.
 *   - **neither** → static text with NO chevron. A chevron on a row that opens
 *     nothing promises otherwise, which is the rule the journey's blocked
 *     completion stops already follow.
 */
function GetLicensedRow({
  step,
  onOpenStep,
  syllabus = false,
}: {
  step: (typeof GET_LICENSED_STEPS)[number]
  onOpenStep?: (id: string) => void
  /** The `syllabus` treatment — see `dashboard-journey-style`. */
  syllabus?: boolean
}) {
  /*
   * TITLE ONLY on the syllabus treatment — 2026-09-17, the direct ask ("remove
   * the extra details from the bottom section, that will all be shown when user
   * clicks on it").
   *
   * What goes is the `detail` sentence and the labelled "Vendor: PSI · $40 exam
   * fee" line. Both are still REACHED: every row opens the requirements sheet
   * (or PSI itself), and that sheet is where XCEL's published page covers
   * sitting the exam, applying and the fees. Nothing is deleted from the
   * fixture.
   *
   * It also finishes the match with the journey above, which prints a sub-line
   * on its active row only — three rows of three lines each under a four-row
   * list of one-liners was the thing that made this read as a different
   * component rather than the rest of the same sequence.
   *
   * THE ACCESSIBLE NAME NARROWS with it: the row's name was title + detail +
   * vendor, and is now the title. That is still a fair name for the target
   * ("Schedule State Exam"), and a test had to be LOOSENED for the long version
   * once already.
   *
   * The compact rail keeps all three lines — it has no sheet behind every row.
   */
  const column = (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      {/* Every Get Licensed row opens its step's sheet as of 2026-09-17, so the
          title is always the link colour here. */}
      <span
        className="cre-stop-title"
        style={syllabus ? syllabusRowTitleStyleNoColor : titleStyleNoColor}
      >
        {step.title}
      </span>
      {syllabus ? null : (
        <>
          <span style={metaStyle}>{step.detail}</span>
          <span style={metaStyle}>
            {[step.owner, step.fee].filter(Boolean).join(' · ')}
          </span>
        </>
      )}
    </span>
  )
  const chevron = <ChevronRight size={14} aria-hidden style={{ flexShrink: 0, opacity: 0.55 }} />

  /* A STEP WITH DETAIL OPENS ITS SHEET, even when it has an `href` — 2026-09-17.
   *
   * The Schedule row was an `<a>` straight to PSI, which was right while the
   * row was all we had to say about it. Its sheet now carries that same PSI
   * link AND the two things a learner needs before following it: the system
   * check for online proctoring, and that there is no cap on retakes. Jumping
   * to the registration flow first would skip both.
   *
   * So all three rows are buttons, the outbound links live inside the sheets,
   * and `step.href` stays on the fixture as the destination the sheet offers. */
  if (step.href && !(step.sections && onOpenStep)) {
    return (
      <a
        href={step.href}
        target="_blank"
        rel="noreferrer noopener"
        className="cre-journey-stop"
        style={{ ...rowButtonStyle, textDecoration: 'none' }}
      >
        {column}
        {chevron}
      </a>
    )
  }
  if (onOpenStep) {
    return (
      <button
        type="button"
        onClick={() => onOpenStep(step.id)}
        className="cre-journey-stop"
        style={rowButtonStyle}
      >
        {column}
        {chevron}
      </button>
    )
  }
  return <span style={{ ...rowButtonStyle, cursor: 'default' }}>{column}</span>
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 }

/* ── `syllabus` variant ─────────────────────────────────────────────────
   A bordered card rather than a bare block, because this treatment is a
   DOCUMENT — a syllabus — and a document has an edge. The default rail
   deliberately has none (see `widgetCardStyle`), which is why this is a
   variant and not a change to it. */
/**
 * NO CARD — 2026-09-17, the direct ask ("remove background and stroke"), which
 * is the same call the compact treatment already took on 2026-09-16.
 *
 * The fill, the border AND the radius go together: a radius with nothing to
 * round is inert, and a border round a transparent block is a wireframe. The
 * HORIZONTAL padding goes too, which is the half that is easy to miss — a bare
 * block lines up with the column it sits in, where an inset one keeps a gutter
 * that belonged to a card it no longer has. Only the top padding stays, so this
 * eyebrow and the left column's still sit on one line.
 *
 * It applies to BOTH sections this style dresses — the Study Journey and Get
 * Licensed. They are one constant, and a card round one of two adjacent
 * sections reads as an accident rather than as a distinction. What separated
 * them before was the card boundary, so the widget's hairline rule comes back
 * with this; see `StudyJourneyWidget`.
 */
const syllabusWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  padding: '4px 0 0',
}

/* The journey's eyebrow IS the shared widget one — see `widgetStyles.ts`. It
   was declared here and the Jump Back In card declared its own; on 2026-09-17
   they were asked to match, and one constant is what makes that stay true. */
const syllabusEyebrowStyle = widgetEyebrowStyle

const syllabusTitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 21,
  lineHeight: '27px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

/* Lighter and larger than the compact rail's 13px/600 body face.
 *
 * THE BODY FACE, not the heading one (2026-09-17). The rows were serif under
 * the `serif` heading-font variant, and the reference sets only its title in a
 * serif — the list beneath it is a humanist sans. That contrast is what makes
 * the card read as a document with a heading rather than as a page of one
 * face, and it is why the heading keeps `--font-heading` while these do not.
 *
 * 600 rather than 700: the reference uses a book weight for rows and saves the
 * bold for the section heading. A heading face at 700 in a 296px column wrapped
 * every title to three lines and read as shouting. Blocked rows drop to 400 and
 * to the tertiary ink at the call site.
 */

/* `syllabusChipStyle` (the active stop's "62% In progress" pill) and
   `syllabusPartStyle` (the "Part 2" / "Part 3" label on blocked rows) lived
   here and were removed on 2026-09-17 with the elements they styled — see the
   note at the row title. Both said something the row already said: the chip
   duplicated the sub-line beneath it, and the part label re-named the row. */

/* `syllabusStepMetaStyle` styled the labelled "Vendor: PSI · $40 exam fee"
   line and went with it on 2026-09-17, when the syllabus rows dropped to their
   titles alone — see the note in `GetLicensedRow`. The compact rail's own
   owner/fee line reads `metaStyle`, as it always did. */


const syllabusRailColStyle: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 26,
}

const syllabusNodeStyle: CSSProperties = {
  flexShrink: 0,
  width: 26,
  height: 26,
  marginTop: 1,
  borderRadius: '50%',
  /* DASHED AND UNFILLED — 2026-09-17, the direct ask for stops 02-04.
   *
   * It was a solid hairline on a white fill. Two reasons the change reads
   * right rather than just different:
   *
   *   - The WHITE was left over from when this rail sat on a white card. The
   *     card's background was removed, so a white disc on the page grey was a
   *     circle of a surface that no longer exists — visible only as a slightly
   *     paler patch.
   *   - DASHED already means "not started" in this codebase: the compact rail's
   *     own node uses a dashed neutral ring for exactly that, and the detail
   *     panel's course rows use a dashed "to-do" ring. So the three unreached
   *     stops now say it the way the rest of the product does.
   *
   * `syllabusNodeCurrentStyle` overrides both, so stop 01 keeps its solid
   * filled disc — which is what makes "you are here" the one node that reads as
   * complete rather than pending.
   *
   * IT APPLIES TO GET LICENSED TOO (05-07), which shares this style. That is
   * the right outcome rather than a side effect: none of those three is reached
   * either, and none of them can ever be current — they carry no completion
   * state at all, by design. */
  border: '1px dashed var(--color-neutral-300)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--color-text-tertiary)',
  background: 'transparent',
}

/** The stop you are ON. Filled rather than merely ringed, so it survives being
 *  scanned — the same call the dot rail's `nodeCurrentStyle` makes. */
/**
 * A node for a step that is OPEN — solid grey ring rather than dashed
 * (2026-09-17, the direct ask: "since these are not locked, have the dashed
 * line be a solid circle gray").
 *
 * THE DISTINCTION IS LOCKED vs NOT, and it is the whole reason there are two:
 *
 *   - **Dashed** (`syllabusNodeStyle`) = the product will not let you start
 *     this yet. The journey's stops 02-04 are blocked on the coursework above
 *     them, and dashed already means "not started" across this codebase — the
 *     compact rail's node and the detail panel's course rows both use it.
 *   - **Solid grey** = nothing is stopping you; it simply has no completion
 *     state. Get Licensed is exactly that: a learner can book a PSI sitting
 *     whenever they like, and the section carries no status because PSI and DFS
 *     own the outcome, not because the steps are gated.
 *
 * Dashing them said "locked" about three steps that are not, which is the same
 * class of wrong as a chevron on a row that opens nothing.
 */
const syllabusNodeOpenStyle: CSSProperties = {
  border: '1px solid var(--color-neutral-300)',
}

/* `syllabusNodeCurrentStyle` — the 26px filled "you are here" disc — retired
   2026-09-23 with the numbered nodes it styled. Its job moved to
   `syllabusDotCurrentStyle`, at 14px and without a digit to hold.
   `syllabusNodeStyle` itself is still live: the QE version's Get Licensed rail
   draws numbered nodes, and those keep their numbers. */

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
}

// Matched to the band's other eyebrows ("Jump back in", "Current Learning
// Progress") — three labels at one level of hierarchy, so they share a style
// rather than each carrying its own near-identical literal.
const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

/** The rail lede under an eyebrow. Named `explainBodyStyle` until 2026-09-16,
 *  after the "How do I become exam ready?" disclosure body it was written for —
 *  that disclosure is gone and this is all that still uses it. */
const railLedeStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}

const countStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: '14px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}

/* `paddingBottom` is the GAP BETWEEN ROWS, moved here on 2026-09-17 from the
   row button's own bottom padding — see `rowButtonStyle`. Outside the hover
   target, so it separates the rows without being part of the wash.
   
   On the `<li>` rather than as a `gap` on the list, because the spine lives in
   the rail column INSIDE the li: a list gap would break the connector into
   dashes between rows, where padding lets the `flex: 1` spine reach through it
   to the next node. */
const itemStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  minWidth: 0,
  paddingBottom: 8,
}

const railColStyle: CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 16,
}

const nodeStyle: CSSProperties = {
  flexShrink: 0,
  width: 14,
  height: 14,
  marginTop: 3,
  borderRadius: '50%',
  // `--color-neutral-300`, NOT `--color-border-subtle`. The subtle token is
  // `neutral-200`, which is also the spine's colour — a node drawn in the same
  // value as the line it sits on stops reading as a node at all. This was
  // `--color-border-strong` for one build, which DOES NOT EXIST in tokens.css:
  // the declaration was invalid, the border fell back to the initial value, and
  // the un-started nodes rendered as bare circles. tsc was clean and nothing
  // failed — only reading the computed style in a browser caught it.
  // LONGHAND, not `border: '2px solid …'`. The done / current / milestone
  // styles below override `borderColor` alone, and React warns (and can leave
  // the value stale across a rerender) when a shorthand and one of its
  // longhands are mixed for the same property.
  borderWidth: 2,
  borderStyle: 'solid',
  // `--color-text-tertiary`, measured 6.19:1 light / 6.18:1 dark on the card —
  // almost identical in both, which is unusual and worth keeping. `neutral-300`
  // was the first choice and fails in dark: it inverts to a navy (#234779) that
  // measures 1.63:1 there, so the un-started nodes vanished on the dark shell.
  borderColor: 'var(--color-text-tertiary)',
  background: 'var(--color-surface-card)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-inverse)',
}

const nodeDoneStyle: CSSProperties = {
  background: 'var(--color-success-500)',
  borderColor: 'var(--color-success-500)',
}

// The "you are here" node. `--color-text-primary`, not `--color-primary-600`:
// the brand navy does not invert, so on the dark card it measures 1.59:1 and the
// one node that says WHERE THE LEARNER IS was the least visible thing on the
// rail. Text-primary is near-black on light and near-white on dark, which is
// what a definite marker should be in both. Deliberately not the CTA ramp —
// that is the milestone ring's job here, and one ramp cannot mean two things.
const nodeCurrentStyle: CSSProperties = {
  background: 'var(--color-text-primary)',
  borderColor: 'var(--color-text-primary)',
}

/**
 * The milestone marker, and the ONLY thing left distinguishing an assessment
 * stop from a lesson.
 *
 * `--color-text-primary`, not the CTA ramp. It was `--color-cta-500` (XCEL's
 * Brick) and moved for the reason at the title's call site: red reads as a
 * problem, and a milestone you have not reached yet is not one.
 *
 * What makes it read as different is now the WEIGHT OF INK rather than a hue —
 * the strong ink against an ordinary stop's `--color-text-tertiary` ring
 * (11.37:1 versus 6.19:1 on the card). Same value the "you are here" node uses
 * for its fill, so the rail has two inks rather than three.
 *
 * Deliberately not a different SHAPE (a diamond was the other candidate): a
 * completed milestone carries the check glyph, and rotating the node means
 * counter-rotating the icon inside it for a distinction the group label already
 * makes in words.
 */
const nodeMilestoneStyle: CSSProperties = { borderColor: 'var(--color-text-primary)' }

// The spine is a hairline connector on `--color-border-subtle` — 1.41:1 light /
// 1.24:1 dark, i.e. a low-contrast boundary. Left as-is deliberately: it is
// `aria-hidden` decoration carrying nothing the ordered list and each row's own
// status words do not already say, and it is the same token every other divider
// on this page uses. Raising it is a page-wide call, not a Study Journey one.

// Numbered marker for Get Licensed, sized to the journey's 14px node so the
// two rails' spines line up in the same 16px column.
const stepNumberStyle: CSSProperties = {
  flexShrink: 0,
  width: 16,
  height: 16,
  marginTop: 2,
  borderRadius: '50%',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
}

/** Off-screen but in the accessibility tree — the pattern `QaNotesPanel` and
 *  `Modal` already use. A `title` attribute is not a substitute: screen readers
 *  expose it inconsistently, and it is invisible to touch entirely. */
const srOnlyStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

const spineStyle: CSSProperties = {
  flex: 1,
  width: 2,
  minHeight: 14,
  marginTop: 2,
  background: 'var(--color-border-subtle)',
}

/* THE SYLLABUS SPINE, TIGHTENED 2026-09-23 on the direct ask ("reduce the
   spacing between steps 1-5"). 18 -> 8 here and 8 -> 3 on the item's
   `paddingBottom` below: ~55px node-to-node becomes ~40px, so five steps read
   as one block rather than a column you scan down.

   BOTH NUMBERS MOVED TOGETHER because either alone would have done it badly.
   Cutting only the spine leaves the ROWS as far apart and shortens the line
   between them, which reads as a broken connector; cutting only the padding
   crowds the titles while the spine still reserves its 18px. */
const syllabusSpineStyle: CSSProperties = { ...spineStyle, minHeight: 8 }

/** The same spine, dashed — every segment except one under a completed step.
 *  `width: 0` with a left border, because a 2px dashed BACKGROUND is not a
 *  thing CSS can draw; the border is what produces the dashes. */
const syllabusSpineDashedStyle: CSSProperties = {
  ...syllabusSpineStyle,
  width: 0,
  background: 'none',
  borderLeft: '2px dashed var(--color-border-subtle)',
}

/** The syllabus list's tighter row gap — see the spine above; the two are one
 *  measurement and must move together. */
const syllabusItemStyle: CSSProperties = { ...itemStyle, paddingBottom: 3 }

/*
 * THE STOP DOT — the journey's node since 2026-09-23, when the digits came off.
 *
 * It is `nodeStyle`'s geometry with `syllabusNodeStyle`'s dashed ring: 14px,
 * the size used by the compact rail and by the Compass player's contents
 * bullets, and the dashed neutral ring this codebase already reads as "not
 * started" (the detail panel's course rows use it too).
 *
 * NOT `nodeStyle` ITSELF, spread-and-overridden. That one is the dot rail's,
 * and the two treatments have drifted apart twice already — this way a change
 * to either cannot silently reach the other.
 */
const syllabusDotStyle: CSSProperties = {
  flexShrink: 0,
  width: 14,
  height: 14,
  marginTop: 3,
  borderRadius: '50%',
  border: '1px dashed var(--color-neutral-300)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-text-inverse)',
  background: 'transparent',
}

/** Done — filled, with the check the dot rail's node uses at the same size. */
const syllabusDotDoneStyle: CSSProperties = {
  border: '1px solid var(--color-primary-700)',
  background: 'var(--color-primary-700)',
}

/** The stop you are ON — filled and undashed, so "you are here" survives being
 *  scanned. Same call `nodeCurrentStyle` makes on the dot rail. */
const syllabusDotCurrentStyle: CSSProperties = {
  border: '2px solid var(--color-primary-700)',
  background: 'var(--color-primary-700)',
}

/** Get Licensed's spine, at the height the journey's used to be. See its call
 *  site: that list keeps `itemStyle`'s 8px rows, so it keeps the spine to
 *  match. */
const syllabusStepSpineStyle: CSSProperties = { ...spineStyle, minHeight: 18 }

// Split so a themed class can own the colour. See the note at the Get Licensed
// link: spreading a style that carries `color` defeats the class that is there
// to swap it per theme.
const titleStyleNoColor: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
}

const titleStyle: CSSProperties = {
  ...titleStyleNoColor,
  color: 'var(--color-text-primary)',
}

/**
 * The journey row title — **the Get Licensed step title's treatment**, as of
 * 2026-09-17 (the direct ask: "should match the Schedule State Exam style").
 *
 * It spreads `titleStyleNoColor`, the constant those steps read, rather than
 * restating 13/600/18. The two lists sit one rule apart in the same column and
 * are the same KIND of thing — a step in a sequence — so a row that is 17px
 * here and 13px there reads as two components that drifted. Spreading is what
 * stops the next change to one of them missing the other.
 *
 * It ran at 17/600/24 for a day, which was sized against the reference's own
 * larger list. Beside the licensing steps it made the journey look like the
 * important half of a page where the two halves are equals.
 *
 * The COLOUR is still resolved at the call site: blocked rows drop to the
 * tertiary ink, which `titleStyleNoColor` deliberately does not set — spreading
 * a style that carries `color` over something meant to swap it is the trap the
 * PSI link in this same file already hit once.
 */
const syllabusRowTitleStyle: CSSProperties = {
  ...titleStyleNoColor,
  letterSpacing: '-0.005em',
  color: 'var(--color-text-primary)',
  minWidth: 0,
}

/* The same treatment with NO `color`, for rows whose title is a link: an inline
   colour beats `.cre-stop-title` and would leave the rule matching, computing
   and doing nothing. Split rather than deleting the colour outright, because
   the blocked rows still need it. */
const syllabusRowTitleStyleNoColor: CSSProperties = {
  ...titleStyleNoColor,
  letterSpacing: '-0.005em',
  minWidth: 0,
}

// `milestoneTitleStyle` and its `.cre-journey-milestone` class were removed
// 2026-09-16 — milestone titles take the ordinary `titleStyle` now. See the
// note at the title's call site.

const metaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-tertiary)',
}

const rowButtonStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
  /* SYMMETRIC VERTICAL PADDING — 2026-09-17, the direct ask ("the hover
     background looks weird, like its not centered on the text vertically").
     It was `2px 8px 14px`: 2 above the text and 14 below.
     
     The button IS the hover target, so the wash inherited that asymmetry and
     sat 12px low — a tint that looked mis-aligned rather than a row that was
     highlighted. The 14 was never about this element; it was the GAP between
     rows, parked on the nearest box that had a padding.
     
     The gap moved to the `<li>` (see `itemStyle`), where it belongs: outside
     the target, so it spaces the rows without being part of what lights up.
     Total row height is unchanged — 2+14 became 4+4 here plus 8 there. */
  padding: '4px 8px',
  // 8px of inset tint each side, pulled back so no TEXT moves — the row's
  // content stays exactly where it was and only the hover wash is wider. -8
  // against `itemStyle`'s gap of 10 leaves 2px clear of the node column.
  marginLeft: -8,
  marginRight: -8,
  // NO `background` here, deliberately. It was `transparent` inline, and an
  // inline value BEATS a stylesheet rule — so `.cre-journey-stop:hover` would
  // have needed `!important` to do anything, which is the trap
  // `.cre-uxlinks-title` documents (the rule matches, computes, and does
  // nothing, while the row still LOOKS fine). The class owns both states.
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
}

const viewAllStyle: CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 2,
  padding: 0,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // See `milestoneTitleStyle` — colour lives in `.cre-cta-ink`.
}
