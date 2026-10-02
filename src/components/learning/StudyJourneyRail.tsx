import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
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
  stepNumber = 1,
  stepLabelOnly = false,
  markerLabel,
  scaleStyle = 'axis',
  stopMark = 'circle',
  stopDetail,
  lessonProgressTitle = false,
  progressSpine = false,
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
  /** Which step this rail IS, for the eyebrow — 1 as shipped, 2 when
   *  `journey-step-order: exam-first` puts Schedule State Exam above it. Only
   *  read when `stepRange` is set. */
  stepNumber?: number
  /**
   * Drop the journey's name from the eyebrow — just "Step 1" — Testing 3,
   * 2026-10-01, the direct ask.
   *
   * ⚠ IT IS ABOUT THE COMPANY THE EYEBROW KEEPS. In the journey COLUMN this
   * card is the only one carrying the journey's name, so "Step 1 · Atlas Study
   * Journey" is what says which route the numbers belong to. Inside Testing 3's
   * combined card it sits above "Step 2" and "Step 3" eyebrows that are bare,
   * so the suffix made the first of three look like a different kind of thing.
   *
   * ⚠ WHAT IT COSTS: the name "Atlas Study Journey" then appears nowhere on
   * that card. The route is still legible — three numbered steps under a course
   * title — but it is no longer branded. Worth a second look if the name is
   * meant to be learned.
   *
   * Requires `stepRange`; on its own it changes nothing, because without a step
   * number there is no "Step N" to leave behind.
   */
  stepLabelOnly?: boolean
  /**
   * Turn the spine into a SCALE — "0" above the first node, "100" below the
   * last, and this label beside the progress caret. Testing 3, 2026-10-01, the
   * direct ask. Requires `progressSpine`; without a caret there is nothing to
   * label.
   *
   * ⚠ THE LABEL IS ACCURATE, THE POSITION IS NOT PROPORTIONAL, and that tension
   * is the thing to judge rather than a bug. The rows of this list are spaced
   * by their CONTENT's height, not by how much work each stop is — so "37%"
   * sits where the current lesson is, which is partway through the first of six
   * stops, and not 37% of the way down the column. A true axis would have to
   * space the stops by weight, which would make the live stop a sliver and the
   * two completion tasks nearly invisible. The caller passes the figure; this
   * only draws it.
   */
  markerLabel?: string
  /**
   * HOW `markerLabel` IS DRAWN — `journey-scale-style`, 2026-10-02. Four
   * answers to one problem, none of them yet chosen.
   *
   * ⚠ THE PROBLEM IS THAT THESE ROWS ARE NOT A SCALE. They are spaced by their
   * CONTENT's height, so a figure placed beside the current stop is in the
   * right PLACE but not at the right HEIGHT, and a figure placed at its true
   * height sits beside a stop the learner has not reached. `axis` and `chip`
   * choose position; `gauge` and `header` choose proportion. Every arm still
   * leans on the NODES to say which stop is live, so none of them loses "where
   * am I" — that is what makes them comparable.
   */
  scaleStyle?: 'axis' | 'gauge' | 'chip' | 'header'
  /**
   * What an UNREACHED stop looks like — `journey-stop-mark`, 2026-10-02.
   *
   * `circle` is the dashed ring this rail has always drawn. `dash` is a short
   * tick across the line: a mark ON the timeline rather than a node hung off
   * it. The argument is that a ring is a PLACE, and six places read as six
   * equal claims when five of them are not yet real — a tick reads as a
   * graduation on a scale, which is what the `gauge` arm has made this.
   *
   * ⚠ IT ONLY TOUCHES `not-started`. A completed tick and a "you are here" tick
   * would give up the one distinction this column cannot lose.
   */
  stopMark?: 'circle' | 'dash'
  /**
   * Extra content nested UNDER one stop's row — Testing 3, 2026-10-01, the
   * direct ask ("move the lesson section to be within the complete coursework,
   * under the pre-licensing lessons to better indicate where the user is").
   *
   * Called once per stop with that stop's id; return `null` for the stops that
   * get nothing. Testing 3 returns the lesson line and Resume under
   * `pre-licensing-lessons`, so the card says where the learner is INSIDE the
   * step they are on rather than above the list of steps.
   *
   * ⚠ A SLOT, NOT A VERSION BRANCH, which is why it is safe in a component this
   * shared. The rail never learns what Testing 3 is; it learns that a caller
   * may want to hang something off a stop. With the prop absent the markup is
   * byte-identical — the wrapper below only appears when a detail exists.
   *
   * ⚠ THE SPINE STRETCHES TO COVER IT on its own (`flex: 1` on `spineStyle`),
   * so a tall detail does not leave the connector hanging short of the next
   * node. That is load-bearing: the dashed/solid connector is what reads as
   * ground covered, and a gap in it would read as a broken rail.
   */
  stopDetail?: (stopId: string, meta: { index: number; isCurrent: boolean }) => ReactNode
  /**
   * Title the counted lesson stop with its progress — "(26 of 42 Completed)"
   * rather than "(42)". Testing 3, 2026-10-01. See `journeyStopsFor`, which
   * owns the string; this only forwards the choice.
   */
  lessonProgressTitle?: boolean
  /**
   * PART-FILL THE CONNECTOR under a stop that is in progress — Testing 3,
   * 2026-10-01, the direct ask ("because we are on lesson 27, some of this line
   * should be filled in").
   *
   * The spine's default vocabulary is binary: solid under a completed stop,
   * dashed under everything else. That is right for the stops it was written
   * for, which are done or not — but the lesson stop is 26 of 42, and a fully
   * dashed segment under it says no ground covered when most of it is.
   *
   * ⚠ THE FILLED LENGTH IS BLUE (`--color-primary-700`, the node's own fill)
   * as of 2026-10-01 — see `syllabusSpineDoneStyle`. Colour is REINFORCEMENT:
   * the solid-vs-dashed texture still carries the whole distinction and the
   * row's text still carries the count, so the rail reads correctly without
   * colour perception (2.1.4.1).
   *
   * ⚠ IT ALSO BLUES A COMPLETED STOP'S WHOLE SEGMENT, not only the part-filled
   * one — otherwise the rail would turn blue mid-step and back to grey on
   * completion.
   *
   * ⚠ OPT-IN, so no other version's rail changes shape. The data it needs
   * (`stop.progress`) has always been there.
   */
  progressSpine?: boolean
}) {
  /* ⚠ TOP OF THE COMPONENT, ABOVE `if (stops.length === 0) return null`. It sat
     beside the lo-fi branch further down at first, which put a hook after an
     early return — the rail would have changed its hook order the moment a path
     resolved to zero stops. Lint caught it; the render that would have proved it
     is rare enough to have shipped. */
  const { loFi } = useLoFi()
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
  const stops = journeyStopsFor(path, { lessonProgressTitle })
  /* DERIVED from the real stop count, never authored — merging two completion
     stops into one already changed it once, and the same count is what
     `StudyJourneyWidget` offsets the licensing steps by. The two cannot
     disagree about where 04 ends and 05 begins. */
  const eyebrowText =
    stepRange && stops.length > 0
      ? stepLabelOnly
        ? `Step ${stepNumber}`
        : `Step ${stepNumber} \u00b7 ${STUDY_JOURNEY_EYEBROW}`
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
  /* ⚠ EVERY ARM IS GATED ON `markerLabel`, not on `scaleStyle` alone — the
     style says HOW, the label says WHETHER. A caller that wants no figure at
     all passes no label and gets the rail exactly as it was. */
  const scaleAxis = Boolean(markerLabel) && scaleStyle === 'axis'
  const scaleGauge = Boolean(markerLabel) && scaleStyle === 'gauge'
  const scaleChip = Boolean(markerLabel) && scaleStyle === 'chip'
  const scaleHeader = Boolean(markerLabel) && scaleStyle === 'header'
  /* The figure as a number, for the arms that position by proportion. A label
     that is not a percentage leaves them at 0 rather than throwing. */
  const markerPct = Math.max(0, Math.min(100, Number.parseFloat(markerLabel ?? '') || 0))

  /*
   * THE GAUGE'S MARKER LINES UP WITH THE LESSON — 2026-10-02, the direct ask
   * ("the 37% should line up horizontally with the lesson shown here").
   *
   * ⚠ IT HAS TO BE MEASURED. The lesson block's height is its CONTENT's — a
   * chapter name that wraps to two lines moves it — so there is no percentage
   * or offset that expresses "level with it". The layout effect reads the
   * block's centre relative to the list and the fill, knob and figure all use
   * that pixel instead of `markerPct`.
   *
   * ⚠ AND THIS CHANGES WHAT THE GAUGE CLAIMS. It was the arm that chose
   * PROPORTION — the marker at its true height, deliberately not level with the
   * live node — while `axis` and `chip` chose position. Anchoring it here makes
   * it choose position too, so the 0 and 100 now bracket a line whose marker is
   * NOT at its proportional height. The figure is still the honest number; its
   * placement is no longer a reading of the scale. That is the trade the ask
   * accepts and the first thing to re-examine if the caps start to mislead.
   *
   * ⚠ RE-MEASURED ON RESIZE, because the wrap point moves with the column's
   * width and a stale pixel would drift the marker off the lesson at exactly
   * the sizes nobody tests.
   */
  const listRef = useRef<HTMLOListElement | null>(null)
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [markerTop, setMarkerTop] = useState<number | null>(null)

  /* ⚠ THE SCALE CHECK LIVES IN HERE, not in the effect. A bare
     `setMarkerTop(null)` in the effect body is a synchronous setState the lint
     rule rejects (and rightly — it is the shape that cascades renders); folding
     it into the measurement makes the effect a single call and keeps one place
     that decides what the offset is. */
  const measureMarker = useCallback(() => {
    const list = listRef.current
    const anchor = anchorRef.current
    if (!scaleGauge || !list || !anchor) {
      setMarkerTop(null)
      return
    }
    const l = list.getBoundingClientRect()
    /* ⚠ MEASURE THE BLOCK, NOT THE WRAPPER. The wrapper's rect includes the
       detail's own margins — 2 above and 14 below on the lesson block — so its
       centre sits 6px lower than the thing a reader sees, and the marker landed
       6px under the lesson. Measured, not reasoned: knob 781 against block 775.
       An element's own rect excludes its margins, so the child is the honest
       box. */
    const a = (anchor.firstElementChild ?? anchor).getBoundingClientRect()
    /* The track is inset 10px top and bottom (`gaugeTrackStyle`), so the offset
       is measured against ITS box rather than the list's — otherwise the marker
       sits 10px low. */
    setMarkerTop(a.top + a.height / 2 - (l.top + 10))
  }, [scaleGauge])

  useLayoutEffect(() => {
    measureMarker()
    const list = listRef.current
    if (!list || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measureMarker)
    ro.observe(list)
    return () => ro.disconnect()
  }, [measureMarker, markerLabel, stops.length])

  /* Falls back to the proportional position until the measurement lands — and
     permanently in jsdom, where there is no layout to read. */
  const markerOffset: CSSProperties =
    markerTop == null ? { top: `${markerPct}%` } : { top: markerTop }

  if (stops.length === 0) return null

  if (loFi) {
    return (
      <div style={syllabus ? syllabusWrapStyle : wrapStyle}>
        <LoFiWidgetBody rows={5} ariaLabel="Lo-fi study journey" />
      </div>
    )
  }
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
      {/* ⚠ THE END CAPS BRACKET THE LIST, they are not list items. A `<li>`
          reading "0" would be announced as a stop in an ordered list of stops,
          and `aria-hidden` on the column is what already keeps the spine out of
          the reading order — these belong to the same mark. */}
      {scaleHeader ? (
        /* ── HEADER ──────────────────────────────────────────────────────
           The scale leaves the column entirely: one horizontal track under the
           heading with 0 and 100 at its ends and the figure over the fill. The
           timeline below is then a plain list of stops with nothing competing
           down its left edge — which is the point of this arm. */
        <div aria-hidden style={headerScaleWrapStyle}>
          <div style={headerScaleRowStyle}>
            <span style={headerScaleCapStyle}>0</span>
            <span style={headerScaleTrackStyle}>
              <span style={{ ...headerScaleFillStyle, width: `${markerPct}%` }} />
              <span style={{ ...headerScaleKnobStyle, left: `${markerPct}%` }} />
            </span>
            <span style={headerScaleCapStyle}>100</span>
          </div>
          <p style={{ ...headerScaleFigureStyle, marginLeft: `${markerPct}%` }}>{markerLabel}</p>
        </div>
      ) : null}
      {scaleAxis ? (
        <p aria-hidden style={axisCapStyle}>
          0
        </p>
      ) : null}
      {/* ⚠ THE INDENT IS ON THE LIST, NOT ON THE WRAPPER. Putting it on the
          wrapper shifted the "Step 1 / Complete Coursework" heading with it,
          which broke its alignment with the card's own eyebrow and with steps 2
          and 3 below. Only the axis needs the gutter. */}
      <ol
        ref={listRef}
        aria-label="Study journey stops"
        style={scaleAxis || scaleGauge ? axisListStyle : listStyle}
      >
        {scaleGauge ? (
          /* ── GAUGE ──────────────────────────────────────────────────────
             The spine IS the scale. One continuous track behind the nodes,
             filled from the top to the figure, with 0 and 100 at its ends.

             ⚠ ABSOLUTE, SO IT SPANS THE WHOLE LIST. The per-row segments are
             drawn transparent under this arm (see the connector below) — a
             track assembled out of them would be filled by ROW, which is the
             very thing this arm exists to stop.

             ⚠ ITS FILL WILL NOT LINE UP WITH THE LIVE NODE, and that is the
             honest trade rather than a bug: the fill is at the figure's true
             height, the node states say which stop is live, and the two are
             different facts. The arms that put the figure beside the node make
             the opposite trade. */
          <span aria-hidden style={gaugeTrackStyle}>
            {/* ⚠ THE REMAINDER IS ITS OWN LINE — 2026-10-02, the direct ask
                ("lighter/thinner below the active section"). It was the track
                element's own background, which forced one width for covered and
                uncovered ground alike. As a separate 1px line it can recede
                while the fill keeps its 2px weight, so the eye reads how far
                along the learner is before it reads the scale. */}
            <span style={gaugeRemainderStyle} />
            <span
              style={{
                ...gaugeFillStyle,
                /* The fill ends where the marker is, so the three agree by
                   construction rather than by two numbers kept in step. */
                height: markerTop == null ? `${markerPct}%` : markerTop,
              }}
            />
            <span style={{ ...gaugeKnobStyle, ...markerOffset }}>
              {/* ⚠ THE RUN FROM THE MARKER TO THE LESSON'S RULE — 2026-10-02,
                  the direct ask. Dashed and in the rule's own light green, so
                  the knob, this run and the block's left edge read as one mark
                  crossing the gutter rather than two greens either side of it.
              
                  ⚠ ITS WIDTH IS THE GUTTER'S ARITHMETIC, and the first
                  attempt got it wrong by 12 — it overshot into the lesson text
                  because it forgot the LIST's own 30px padding, which the track
                  is positioned inside but the rows are not. See
                  `gaugeConnectorStyle` for the full derivation. */}
              <span aria-hidden style={gaugeConnectorStyle} />
            </span>
            <span style={{ ...gaugeFigureStyle, ...markerOffset }}>{markerLabel}</span>
            <span style={gaugeCapTopStyle}>0</span>
            <span style={gaugeCapBottomStyle}>100</span>
          </span>
        ) : null}
        {stops.map((stop, i) => {
          const isCurrent = i === currentIndex
          const isLast = i === stops.length - 1
          // A blocked completion task is not a link. It has nothing to open
          // yet, and a chevron on it promises otherwise.
          const interactive = Boolean(onOpenStop) && !stop.blocked
          /* ── CHIP ────────────────────────────────────────────────────────
             No 0, no 100, no gutter: the figure is a pill on the stop the
             learner is on. The least furniture of the four, and the only one
             that states a percentage without implying a scale it cannot keep.
             What it gives up is any sense of how much is LEFT. */
          /* THE COUNT AS ITS OWN RUN, after a rule — `lessonProgressTitle`,
             2026-10-02, the direct ask. ⚠ BUILT FROM THE STOP'S OWN FIGURES,
             the same two `journeyStopsFor` used to interpolate into the title,
             so the row and its meta line cannot state different numbers.
             Rendered only where there IS a count: the completion tasks carry no
             `hours`, and a rule followed by nothing reads as a broken row. */
          const count =
            lessonProgressTitle && typeof stop.completed === 'number' && stop.hours
              ? `${stop.completed} of ${stop.hours} Completed`
              : null
          const chip =
            scaleChip && isCurrent ? (
              <span style={scaleChipStyle}>{markerLabel}</span>
            ) : null
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
                  {count ? (
                    <>
                      <span aria-hidden style={titleRuleStyle} />
                      <span style={titleCountStyle}>{count}</span>
                    </>
                  ) : null}
                  {chip}
                </span>
              ) : (
                <span style={titleStyle}>
                  {stop.title}
                  {count ? (
                    <>
                      <span aria-hidden style={titleRuleStyle} />
                      <span style={titleCountStyle}>{count}</span>
                    </>
                  ) : null}
                  {chip}
                </span>
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
                      /* ⚠ THE NOT-STARTED DOTS SHRINK UNDER THE GAUGE —
                         2026-10-02, the direct ask. With one continuous line
                         running through them, six equal circles read as six
                         equal claims; the ones nobody has reached should be
                         quieter than the one they are on. 10 against 14, which
                         is enough to tell apart at a glance without the dashed
                         ring losing its shape.

                         ⚠ SCOPED TO `gauge`. On the other arms the dots sit on
                         per-row segments with gaps between them, where equal
                         sizing is what makes them read as one sequence. */
                      ...(scaleGauge && stop.status === 'not-started'
                        ? gaugeDotSmallStyle
                        : null),
                      /* ⚠ LAST IN THE SPREAD, so it overrides the dashed ring's
                         border and the gauge's smaller circle rather than
                         fighting them. A tick is not a small ring — it is a
                         different mark, and layering it over the ring's border
                         would leave a hairline box around it. */
                      ...(stop.status === 'not-started' && stopMark === 'dash'
                        ? gaugeDashMarkStyle
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
                {!isLast &&
                  (() => {
                    /* PART-FILLED — `progressSpine`, 2026-10-01. The segment
                       under a stop that is partly done is solid for the share
                       completed and dashed for the rest, instead of being
                       wholly dashed as if none of it had happened.

                       ⚠ FLEX RATIOS, NOT PERCENTAGE HEIGHTS. This span's own
                       height comes from `flex: 1` against its siblings, so a
                       `height: 62%` child would be resolving a percentage
                       against a height the parent does not state — which works
                       in some engines and collapses to zero in others. Two
                       children at `flex: p` and `flex: 100 - p` need no
                       definite height at all.

                       ⚠ SAME COLOUR BOTH HALVES. The difference is solid vs
                       dashed — a texture, not a third status hue on a rail that
                       deliberately says everything in words. */
                    /* ⚠ THE GAUGE DRAWS ITS OWN LINE, so these per-row
                       segments go INVISIBLE under that arm rather than being
                       skipped — they still have to occupy their height, or the
                       nodes would collapse together and the absolute track
                       would span a list that is no longer the right length. */
                    if (scaleGauge) {
                      return <span style={gaugeHiddenSegmentStyle} />
                    }
                    const pct =
                      progressSpine && syllabus && stop.status === 'in-progress'
                        ? Math.max(0, Math.min(100, stop.progress ?? 0))
                        : null
                    if (pct !== null) {
                      return (
                        <span style={syllabusSpineSplitStyle}>
                          <span style={{ ...syllabusSpineDoneStyle, flex: pct }} />
                          {/* THE CARET IS A SEGMENT OF THE SPINE — 2026-10-01,
                              the direct ask ("this line should not go past the
                              bottom of the triangle").

                              ⚠ IT IS IN FLOW, NOT FLOATING BESIDE IT, and that
                              is the whole fix. It began life absolutely
                              positioned off the lesson block, so its offset and
                              the fill's 62% were two independent numbers that
                              happened to land near each other — the blue ran
                              past it because nothing said it should not. As a
                              flex item between the two halves, the solid length
                              ENDS where the triangle starts by construction,
                              and it stays true at any percentage.

                              ⚠ IT ALSO MOVED FILES, from `CombinedCourseCard`
                              to here. A mark whose position is defined by the
                              spine belongs to the spine; owning it there meant
                              the card had to know this rail's gutter
                              arithmetic. */}
                          <span aria-hidden style={syllabusSpineCaretWrapStyle}>
                            {/* The figure rides the caret on `axis` ONLY. On
                                `chip` it is a pill on the row, on `gauge` it is
                                on the track, and on `header` it has left the
                                column altogether. */}
                            {scaleAxis ? (
                              <span style={syllabusSpineMarkerStyle}>{markerLabel}</span>
                            ) : null}
                            <span style={syllabusSpineCaretStyle} />
                          </span>
                          <span
                            style={{
                              flex: 100 - pct,
                              width: 0,
                              borderLeft: '2px dashed var(--color-border-subtle)',
                            }}
                          />
                        </span>
                      )
                    }
                    return (
                      <span
                        style={
                          syllabus
                            ? stop.status === 'completed'
                              ? /* ⚠ A FINISHED STOP'S WHOLE SEGMENT GOES BLUE TOO
                                   under `progressSpine`, not just the part-filled
                                   one. Ground covered is ground covered; leaving
                                   this grey would mean the rail turned blue while
                                   the learner was mid-step and back to grey the
                                   moment they finished it. */
                                progressSpine
                                ? syllabusSpineDoneStyle
                                : syllabusSpineStyle
                              : syllabusSpineDashedStyle
                            : spineStyle
                        }
                      />
                    )
                  })()}
              </span>
              {(() => {
                const row = interactive ? (
                  <button
                    type="button"
                    data-cta-id="home.journey-stop"
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
                )
                const detail = stopDetail?.(stop.id, { index: i, isCurrent })
                /* ⚠ NO WRAPPER WHEN THERE IS NO DETAIL. The row stays the `li`'s
                   direct flex child exactly as it always has, so every other
                   caller of this rail renders the same markup it did before the
                   slot existed. */
                if (!detail) return row
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    {row}
                    {/* ⚠ THE GAUGE'S MARKER ANCHORS HERE. Only the CURRENT row's
                        detail is measured — it is the one the marker is meant to
                        sit level with, and a ref handed to every row would leave
                        the last one to write winning. */}
                    <div ref={isCurrent ? anchorRef : undefined}>{detail}</div>
                  </div>
                )
              })()}
            </li>
          )
        })}
      </ol>
      {scaleAxis ? (
        <p aria-hidden style={axisCapStyle}>
          100
        </p>
      ) : null}

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
   spacing between steps 1-5"). 18 -> 14 here and 8 -> 3 on the item's
   `paddingBottom` below: ~55px node-to-node becomes ~42px, so the steps read as
   one block rather than a column you scan down.

   BOTH NUMBERS MOVED TOGETHER because either alone would have done it badly.
   Cutting only the spine leaves the ROWS as far apart and shortens the line
   between them, which reads as a broken connector; cutting only the padding
   crowds the titles while the spine still reserves its 18px.

   ⚠ 14, NOT 8, AND THE FLOOR IS DOING REAL WORK. It was 8 for an hour and was
   reported as "should be dashed, not solid" — which it already was. Every row
   but the first carries a status sub-line ("After your coursework"), so every
   spine but the first was 15px; the first was 9. A 2px dashed border draws
   roughly a 4px dash and a 4px gap, so nine pixels is one dash and a stub, and
   it reads as a short solid rule. The dash only says "not done yet" if the
   segment is long enough to repeat.

   So this floor is a LEGIBILITY MINIMUM rather than spacing: it must stay above
   about two dash cycles. Anything that shortens the first row again — dropping
   the sub-line from the others, say — has to be checked against it, because the
   failure is silent and looks like a status bug rather than a sizing one. */
const syllabusSpineStyle: CSSProperties = { ...spineStyle, minHeight: 14 }

/** The same spine, dashed — every segment except one under a completed step.
 *  `width: 0` with a left border, because a 2px dashed BACKGROUND is not a
 *  thing CSS can draw; the border is what produces the dashes. */
/**
 * GROUND COVERED — the solid blue length, `progressSpine` only (2026-10-01, the
 * direct ask: "the gray line we just adjusted in step 1 needs to be solid
 * blue").
 *
 * ⚠ `--color-primary-700` BECAUSE THAT IS THE NODE'S OWN BLUE — both
 * `syllabusDotDoneStyle` and `syllabusDotCurrentStyle` fill at 700. The line
 * emanates from the node, so matching it is what makes the two read as one
 * mark rather than as a dot with a differently-coloured tail. The progress
 * bar's `--color-primary-500` was the other candidate and is a shade too light
 * at 2px.
 *
 * ⚠ COLOUR IS REINFORCEMENT HERE, NOT THE SIGNAL. The solid-vs-dashed texture
 * still carries the whole distinction, and the row's own text carries the
 * count — so the rail keeps reading correctly without colour perception
 * (2.1.4.1). An earlier note on this file said both halves must stay one
 * colour; that was written when the only difference available was texture, and
 * the rule it was protecting is satisfied either way.
 */
const syllabusSpineDoneStyle: CSSProperties = {
  ...spineStyle,
  minHeight: 14,
  background: 'var(--color-primary-700)',
}

/**
 * The caret that marks the progress point, pointing right at the live lesson.
 *
 * ⚠ THE OFFSET IS MEASURED FROM THE LINE, NOT FROM THE RAIL COLUMN. This sits
 * inside `syllabusSpineSplitStyle`, which is the 2px-wide spine itself — not
 * the 26px column around it. Two wrong turns got here and both are worth the
 * ink: `marginLeft: 4` under the column's `align-items: center` shifted the
 * MARGIN BOX and moved the triangle by half what was written (measured x=101
 * against a line ending at 99); `flex-start` + 14 then assumed the 26px column
 * was the parent and threw it to x=111. The parent's left edge IS the line's
 * left edge, so 2 is the line's width and puts the base exactly on its right
 * edge. The 6px triangle overflows this 2px box deliberately — nothing clips.
 *
 * A border triangle rather than an SVG: 6px of pure geometry, the registry has
 * no triangle, and a glyph at this size would bring font metrics to fight with.
 * The colour is the node's and the filled spine's — one mark in three parts.
 */
/* The rule between a stop's name and its count. A real 1px line rather than a
   "|" glyph: the pipe sits on the text baseline and carries the font's own
   weight, so it reads as a character in the title rather than as a divider
   between two runs. `aria-hidden` because a screen reader announcing "vertical
   line" between two facts is noise. */
const titleRuleStyle: CSSProperties = {
  display: 'inline-block',
  width: 1,
  height: '0.9em',
  margin: '0 9px',
  verticalAlign: '-0.1em',
  background: 'var(--color-border-subtle)',
}

/* The count is the quieter half — the stop's NAME is what a reader scans for,
   and the figures qualify it. Regular weight against the title's 600. */
const titleCountStyle: CSSProperties = {
  fontWeight: 400,
  color: 'var(--color-text-secondary)',
}

/* ─── the four scale treatments (`journey-scale-style`) ─────────────────── */

/* CHIP — the figure as a pill on the live stop's own title line. Inline, so it
   follows the title's wrap rather than pinning to a corner the title may have
   vacated. */
const scaleChipStyle: CSSProperties = {
  display: 'inline-block',
  marginLeft: 8,
  padding: '1px 7px',
  borderRadius: 'var(--radius-pill)',
  background: 'color-mix(in srgb, var(--color-primary-500) 20%, var(--color-surface-card))',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: 'var(--color-primary-700)',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
}

/* GAUGE — one continuous track THROUGH the nodes, spanning the whole list.
   Absolute, because a track built from the per-row segments would fill by ROW,
   which is the thing this arm exists to stop.

   ⚠ 42 PUTS IT UNDER THE NODES, which is the 2026-10-02 correction. At 12 it
   was measured against the `<ol>`'s border box and therefore sat in the 30px
   label gutter — a second vertical line 31px to the left of the circles, so the
   stops read as a list BESIDE a gauge rather than as stops ON it. The list's
   own padding is 30 and the rail column is 26 wide, so its centre is 43 and a
   2px line starts at 42.

   ⚠ IT IS RENDERED BEFORE THE ROWS, so the nodes paint over it. That is what
   makes the circles part of the line rather than holes in it. */
const gaugeTrackStyle: CSSProperties = {
  position: 'absolute',
  left: 42,
  top: 10,
  bottom: 10,
  width: 2,
  /* NO BACKGROUND — this is the positioning context and the fill's 2px gauge;
     the uncovered part is `gaugeRemainderStyle` below, which is thinner. */
}

/** Ground not yet covered: 1px rather than 2, and a stop lighter than the
 *  border token. `left: 0.5` centres the 1px inside the 2px column, so the
 *  remainder and the fill share one axis instead of stepping sideways at the
 *  marker. */
const gaugeRemainderStyle: CSSProperties = {
  position: 'absolute',
  left: 0.5,
  top: 0,
  bottom: 0,
  width: 1,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
}

const gaugeFillStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: 2,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-700)',
}

/**
 * The fill boundary — where the learner is on the scale. Centred on the track
 * by half its own size.
 *
 * ⚠ THE GREEN GLOW IS THE 'YOU ARE HERE', 2026-10-02, the direct ask. Two
 * concentric `box-shadow` rings rather than a border: a border would grow the
 * element and shift the dot off the line, where shadows paint outward from a
 * fixed box. The inner ring is a halo of the page so the green never touches
 * the navy dot, and the outer is the green itself at low alpha.
 *
 * ⚠ GREEN IS REINFORCEMENT, NOT THE SIGNAL. The dot's POSITION already says
 * where the learner is, and the row text says which stop is live — so the rail
 * still reads correctly without colour perception (2.1.4.1). It is also the one
 * green on this card, which is what makes it findable.
 */
const gaugeKnobStyle: CSSProperties = {
  position: 'absolute',
  left: -3,
  width: 8,
  height: 8,
  marginTop: -4,
  borderRadius: '50%',
  background: 'var(--color-primary-700)',
  boxShadow:
    '0 0 0 3px var(--color-surface-card), 0 0 0 6px color-mix(in srgb, var(--color-success-500) 45%, transparent), 0 0 10px 3px color-mix(in srgb, var(--color-success-500) 35%, transparent)',
}

/* ⚠ THE CARD'S PERCENTAGE NOW LIVES HERE — 2026-10-02, the direct ask. It
   replaces the figure the header used to carry, so it takes that figure's
   voice: the heading face at a size that reads as a statement rather than as a
   tick label. The 0 and 100 beside it stay 9px and regular; they are the ends
   of the scale, this is the reading.
   
   ⚠ `--font-heading`, WHICH THE SERIF VARIANT RE-POINTS. On
   `dashboard-heading-font: serif` this is DM Serif Display, which is the whole
   reason the ask pairs "serif" with "larger" — and that face ships ONE weight,
   so asking for 700 here would get a synthesised bold. 400 is the face's own. */
const gaugeFigureStyle: CSSProperties = {
  position: 'absolute',
  right: '100%',
  marginRight: 12,
  transform: 'translateY(-50%)',
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  color: 'var(--color-text-primary)',
}

/* ⚠ LEFT OF THE LINE, NOT ON IT — 2026-10-02, the direct ask. Centred on the
   track they sat ON the spine, so 0 read as a label hung off the first node and
   100 as one hung off the last; in the left gutter they line up under the 37%
   figure and the three read as one axis down the same edge.
   
   ⚠ AND REGULAR WEIGHT. At 700 they competed with the figure between them,
   which is the only one of the three that changes. The ends of a scale are
   furniture; the reading is not. */
const gaugeCapBase: CSSProperties = {
  position: 'absolute',
  right: '100%',
  marginRight: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 400,
  letterSpacing: '0.06em',
  whiteSpace: 'nowrap',
  color: 'var(--color-text-tertiary)',
}

/* `translateY` by half, so the digits straddle the track's end rather than
   sitting a full line above or below it — they are the ends of the line, not
   captions under it. */
const gaugeCapTopStyle: CSSProperties = { ...gaugeCapBase, top: 0, transform: 'translateY(-50%)' }
const gaugeCapBottomStyle: CSSProperties = {
  ...gaugeCapBase,
  bottom: 0,
  transform: 'translateY(50%)',
}

/** The not-started dot under the gauge: smaller, so the live stop leads. The
 *  negative margins keep its CENTRE on the line — a 10px circle in a column
 *  that centres a 14px one would otherwise sit 2px high. */
const gaugeDotSmallStyle: CSSProperties = {
  width: 10,
  height: 10,
  margin: '5px 0 0',
}

/**
 * An unreached stop as a TICK — `journey-stop-mark: dash`.
 *
 * ⚠ IT CLEARS THE BORDER AND THE RADIUS the ring left behind. Spread last over
 * `syllabusDotStyle`, which sets a 1px dashed border and a 50% radius; without
 * resetting both, the tick renders inside a faint rounded box.
 *
 * 12 wide against the line's 2 so it reads as a graduation crossing it, and
 * `marginTop` keeps its centre where the ring's was — the rows are laid out
 * against a 14px node, and a 2px-tall mark with no offset would ride high.
 */
const gaugeDashMarkStyle: CSSProperties = {
  width: 12,
  height: 2,
  margin: '9px 0 0',
  border: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-200)',
}

/** The dashed run from the marker across to the lesson's green rule. A border
 *  rather than a background so the dashes are the browser's own, matching the
 *  spine's unreached segments in texture while differing in hue. */
const gaugeConnectorStyle: CSSProperties = {
  position: 'absolute',
  left: '100%',
  top: '50%',
  /* 28 = where the lesson's rule starts, less where the knob ends, both
     measured from the list's border box:
  
       rule  = 30 (the list's own padding) + 26 (rail column) + 10 (row gap)
             + 9 (the nested block's padding)   = 75
       knob  = 42 (the track's offset)          + 5 (the knob's reach past it)
                                                = 47
  
     ⚠ THE 30 IS THE ONE THAT WAS MISSED. The track is absolutely positioned
     against the list's PADDING box and the rows sit inside that padding, so a
     width built only from the column and the gaps overshoots by exactly it —
     measured at 12px into the lesson text before this. Re-derive if the list's
     padding, the 26px column or the block's 9 ever move; they are the same
     numbers the lesson's 22px indent is built from. */
  width: 30 + 26 + 10 + 9 - 42 - 5,
  borderTop: '1px dashed color-mix(in srgb, var(--color-success-500) 45%, var(--color-surface-card))',
}

/** The per-row segment under the gauge: invisible, but still occupying its
 *  height so the nodes keep their spacing and the track spans the right list. */
const gaugeHiddenSegmentStyle: CSSProperties = {
  flex: 1,
  width: 2,
  minHeight: 14,
  marginTop: 2,
}

/* HEADER — the whole scale, horizontal, above the list. */
const headerScaleWrapStyle: CSSProperties = { margin: '12px 0 2px' }

const headerScaleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const headerScaleCapStyle: CSSProperties = {
  flexShrink: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-text-tertiary)',
}

const headerScaleTrackStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  minWidth: 0,
  height: 4,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-border-subtle)',
}

const headerScaleFillStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: 0,
  height: 4,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-700)',
}

const headerScaleKnobStyle: CSSProperties = {
  position: 'absolute',
  top: -3,
  width: 10,
  height: 10,
  marginLeft: -5,
  borderRadius: '50%',
  background: 'var(--color-primary-700)',
}

/** The figure under the knob. `marginLeft` as a percentage of the ROW puts it
 *  near the knob without needing a second absolute context; it drifts by the
 *  caps' width, which at these sizes is a few pixels. */
const headerScaleFigureStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  color: 'var(--color-primary-700)',
}

/**
 * The axis end caps — "0" over the first node, "100" under the last.
 *
 * ⚠ `width` MATCHES THE RAIL COLUMN'S so the digits centre on the spine. The
 * column is 26px (`syllabusRailColStyle`) and these sit in the same left
 * gutter, outside the `<ol>`; change one and change the other.
 */
const axisCapStyle: CSSProperties = {
  /* 30 matches `axisListStyle`'s indent, so the digits centre on the spine. */
  margin: '0 0 0 30px',
  width: 26,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-text-tertiary)',
}

/** The stops list, indented to leave room for the axis figures that hang left
 *  of the spine. 30 is the label's width plus its 6px standoff and a little
 *  air — "37%" measured 26px at 9px/700. */
const axisListStyle: CSSProperties = { ...listStyle, position: 'relative', paddingLeft: 30 }

/**
 * The caret plus its figure. `relative` so the label can hang to the LEFT of
 * the spine without taking part in the column's flow — the column is 2px wide,
 * so anything laid out in it would push the triangle off the line.
 *
 * ⚠ THE WRAPPER CARRIES THE OFFSET NOW, not the triangle. `marginLeft: 2` is
 * still measured against the 2px spine that is this element's parent; the
 * triangle inside is flush at 0. Moving the margin to the triangle would offset
 * the label with it.
 */
const syllabusSpineCaretWrapStyle: CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  alignSelf: 'flex-start',
  marginLeft: 2,
  width: 0,
  height: 10,
}

/** The figure, right-aligned to just left of the spine. `right: 100%` anchors
 *  it to the wrapper's left edge, so it grows leftwards and never pushes the
 *  triangle. */
const syllabusSpineMarkerStyle: CSSProperties = {
  position: 'absolute',
  right: '100%',
  top: '50%',
  transform: 'translateY(-50%)',
  marginRight: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
  color: 'var(--color-primary-700)',
}

const syllabusSpineCaretStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  borderTop: '5px solid transparent',
  borderBottom: '5px solid transparent',
  borderLeft: '6px solid var(--color-primary-700)',
}

/** The container for a PART-FILLED segment — the same box `syllabusSpineStyle`
 *  occupies, turned into a column so the solid and dashed halves can share it
 *  by flex ratio. See the call site for why ratios rather than percentages. */
const syllabusSpineSplitStyle: CSSProperties = {
  flex: 1,
  width: 2,
  minHeight: 14,
  marginTop: 2,
  display: 'flex',
  flexDirection: 'column',
}

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
