import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { LearningPathSummary } from '@/data/learningFixtures'
import { GetLicensedRail, StudyJourneyRail } from './StudyJourneyRail'
import { ExamScheduleWidget } from './ExamScheduleWidget'
import { COMPASS_BUTTON } from '@/components/compass/compassButton'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { journeyStopsFor } from './studyJourneyUtil'
import { clearExamDate, useExamDate, writeExamDate } from '@/data/examDateStore'
import { dateFromIso } from '@/lib/studyPace'
import { longDate } from './learningPathsHomeUtil'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  type LicensingStep,
} from '@/data/nyProducerRequirements'
import {
  widgetCardFramedStyle,
  widgetCardOutlinedStyle,
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
  outlined = false,
  splitSteps = false,
  cardPadding,
  // The prop keeps its name for callers; locally `atlasHome`, because main's
  // `journey-step-order` reads into a local `examFirst` of its own.
  examFirst: atlasHome = false,
  examElsewhere = false,
  journeyElsewhere = false,
  afterExam,
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
   * …and give that card the hairline edge the combined course card opposite it
   * carries — Testing 3 only, 2026-10-02, the direct ask.
   *
   * ⚠ A SECOND BOOLEAN RATHER THAN A BORDER ON `framed`. Testing and Testing 2
   * pass `framed` too and neither has a bordered neighbour to match; widening
   * `framed` would reverse their own 2026-09-21 "remove stroke" ask on their
   * behalf. `outlined` implies framed and is ignored without it — see the shell
   * below.
   */
  outlined?: boolean
  /**
   * The exam-date card is being rendered somewhere ELSE on this page, so this
   * column must not draw it — `exam-card-placement: under-course`, 2026-10-01.
   *
   * A PROP, NOT A FLAG READ, for the same reason `framed` is one: where the
   * card sits is a fact about the PAGE's layout, and the band is what knows
   * both halves of it. Reading the flag here as well would be two components
   * deciding the same thing separately, which is how they come to disagree —
   * and the failure mode is the learner being asked the same question twice on
   * one screen.
   */
  examElsewhere?: boolean
  /**
   * The WHOLE JOURNEY is being rendered elsewhere — Testing 3 draws the
   * coursework AND the licensing steps inside one card in the left column
   * (2026-10-01).
   *
   * ⚠ IT WAS `courseworkElsewhere` AND MEANT ONLY THE FIRST CARD. Renamed when
   * steps 2 and 3 followed the coursework into the combined block, which is the
   * honest name for what it now does — a boolean called `courseworkElsewhere`
   * that also suppresses the licensing cards is the kind of drift that makes
   * the next reader check the call site to find out what it means.
   *
   * ⚠ WHAT SURVIVES IN THIS COLUMN is the exam card (when `examElsewhere` is
   * false — the two are independent) and the Quick links card. That is the
   * arrangement, not a leftover: the question about the learner's exam date and
   * a flat list of sheet shortcuts are not steps in the route, so they are the
   * two things that do NOT belong in a card about the route.
   *
   * ⚠ IT DROPS CARDS, NOT THE NUMBERING THEY CARRY. The combined block still
   * labels itself Step 1 and the licensing cards still render as 2 and 3 over
   * there. Renumbering anything here would say the journey changed length.
   *
   * A PROP for the same reason `examElsewhere` is one: the band knows where it
   * put the block, and two components reading the same version separately is
   * how they come to disagree.
   */
  journeyElsewhere?: boolean
  /**
   * Extra content directly UNDER the exam card — Testing 3, 2026-10-01, the
   * direct ask ("move my courses and certificates to the right rail under the
   * exam date section").
   *
   * ⚠ A SLOT, NOT A VERSION BRANCH. This widget never learns what the tiles
   * are; it learns that a caller may want something between the exam card and
   * whatever follows. With the prop absent nothing renders and the column is
   * byte-identical.
   *
   * ⚠ IT RENDERS WHETHER OR NOT THE EXAM CARD IS HERE, which is the honest
   * behaviour rather than an oversight: `examElsewhere` can move that card to
   * the left column, and content positioned "after the exam card" has to still
   * appear when there is no exam card — otherwise two independent flags combine
   * to delete it. Position is what the name promises; existence is not
   * conditional on a sibling.
   */
  afterExam?: ReactNode
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
  /** Overrides the framed shell's inset — the Atlas home's 32px (2026-09-24).
   *  Applies to the filled cards only; pending steps have no fill. */
  cardPadding?: number
  /**
   * THE ATLAS HOME's right rail (feat/atlas-compass-global-nav): coursework
   * as Step 1 in an outlined card (or the one-frame V2 rail), Pass and Get
   * Licensed as 2 and 3 — Schedule State Exam is the banner in the left
   * column (`ScheduleExamBanner`) since 2026-10-01. Split layout only. Named
   * for its 2026-09-24 origin, when the exam step led.
   */
  examFirst?: boolean
}) {
  // On the `syllabus` treatment both halves are cards of their own, so the
  // hairline between them becomes a third divider between two edges. A gap
  // separates them instead.
  const syllabus = useFeatureFlag('dashboard-journey-style').variant === 'syllabus'
  /* ⚠ `outlined` ONLY MEANS ANYTHING WITH `framed`. A border on a block that
     sits bare on the page grey would be an outline round nothing — the exact
     "chrome around chrome" the bare shell exists to avoid — so the order here
     is the guard rather than a preference. */
  const baseShell: CSSProperties = framed
    ? outlined
      ? widgetCardOutlinedStyle
      : widgetCardFramedStyle
    : widgetCardStyle
  /* ⚠ THREE LAYERS, MERGED 2026-10-05 and applied in this order. The base is
     main's framed/outlined/bare choice; `cardPadding` is the caller's override;
     the Atlas radius is last because it is the narrowest. Each spreads a COPY —
     never a write to the shared style object, which three versions read. */
  const paddedShell: CSSProperties =
    cardPadding != null ? { ...baseShell, padding: cardPadding } : baseShell
  /* The Atlas home's cards keep 12px corners (`--radius-lg`): main took the
     shared framed radius to 4 on 2026-09-28 for the Testing home, and that
     reached these through the merge (2026-10-02). */
  const shell: CSSProperties = atlasHome
    ? { ...paddedShell, borderRadius: 'var(--radius-lg)' }
    : paddedShell
  const stops = journeyStopsFor(path)
  /*
   * THE LICENSING CARDS START AT 2 — 2026-09-23, the direct ask: "This whole
   * section will be Step 1 - Complete Coursework. Step 2 - Schedule State
   * Exam....etc."
   *
   * ⚠ IT WAS DERIVED FROM `stops.length`, and that derivation was the right
   * answer to the wrong question. It kept the cards numbering on from the
   * journey's stops, so five stops meant the cards read 06/07/08 — an
   * eight-step journey to a licence. There are FOUR steps. The coursework is
   * one of them, and the five stops are what it is made of, not five steps in
   * their own right. That is also why the stops lost their digits in the same
   * change; see the rail.
   *
   * A CONSTANT NOW, deliberately: the number of stops must NOT move it again.
   */
  /*
   * STEP ORDER — `journey-step-order`, 2026-09-28.
   *
   * `exam-first` promotes Schedule State Exam above the coursework card. The
   * NUMBERS move with the cards, which is the part that matters: four separate
   * widgets cannot draw a continuous spine, so the eyebrow numbering IS the
   * sequence. Reorder without renumbering and the column reads as four
   * unrelated cards — the exact failure the note below is already about.
   */
  const examFirst = useFeatureFlag('journey-step-order').variant === 'exam-first'
  /* THE EXAM-DATE CARD IS NO LONGER A CHOICE — `exam-step-style` retired
     2026-09-29, its `ask-first` arm having won. `ExamScheduleWidget` renders in
     the Schedule State Exam slot unconditionally now; `ExamDateCard` and the
     inline treatment inside `LicensingStepWidget` are both intact but
     unreachable. See `archivedItems.ts`, `exam-step-style-alternatives`. */
  /*
   * THE COLUMN'S NUMBERING, and `ask-first` changed its shape — 2026-09-29.
   *
   * Coursework is 1 and the licensing steps run 2-4; exam-first swaps the first
   * two, so coursework becomes 2 and the rest keep 3 and 4.
   *
   * ⚠ `ask-first` TAKES THE EXAM CARD OUT OF THE SEQUENCE ENTIRELY. It asks a
   * question rather than naming a step, so it wears "Quick question" and no
   * number — and everything after it has to close up behind it. Leave the other
   * numbers where they were and the column reads 2, 3, 4 with nothing numbered
   * 1, which looks like a rendering bug rather than a design.
   *
   * So the exam card CONSUMES NO NUMBER on this arm: the counter below skips
   * it, which is why the licensing steps are numbered by a running count rather
   * than by their index.
   */
  /* ONE FLAG, BOTH HALVES — `journey-quick-links`. The Quick links card and the
     per-card sheet links are the same decision seen from two sides, and running
     both would put every destination on the page twice. */
  const quickLinks = useFeatureFlag('journey-quick-links').enabled
  /* The exam card asks a question rather than naming a step, so it takes no
     number and the three real steps close up behind it. Unconditional now that
     it is the only treatment — this read `examFirst && !askFirst` while the
     numbered arms still existed. */
  const courseworkStep = 1
  /* The non-split rail below numbers its own rows from here; unchanged by the
     arm, because that layout does not render the exam card as a widget at all. */
  const stepStart = 2
  /* Seeded to the number AFTER coursework, then advanced once per numbered card
     by the map in the split branch. Declared in the render body, so it resets
     every render — a module-level counter would drift under StrictMode's double
     invoke. */
  let nextNumber = courseworkStep + 1
  /* Schedule State Exam is `GET_LICENSED_STEPS[0]`; exam-first lifts it above
     the coursework card and the rest follow underneath. Sliced rather than
     re-sorted so the published order stays the source of truth. */
  /* THE EXAM CARD MAY NOT BE THIS COLUMN'S AT ALL — `exam-card-placement`,
     2026-10-01. On `under-course` the band renders it beneath the Current
     course card instead, so this column must not draw it.

     ⚠ IT HAS TO COME OUT OF BOTH LISTS, and that is the whole care needed here.
     `examFirst` decides WHICH list holds Schedule State Exam — the promoted
     slot, or the licensing list — so suppressing one of them leaves the card
     rendering from the other depending on an unrelated flag's arm, which is a
     duplicate question on screen that only appears in half the combinations.
     The file's own note already warns that BOTH CALL SITES BRANCH THE SAME WAY.

     ⚠ NO RENUMBERING FOLLOWS. The card consumes no step number on this arm
     (see the note above), so removing it closes no gap and moves nothing. */
  const examHere = !examElsewhere
  const promoted = examFirst && examHere ? GET_LICENSED_STEPS[0] : null
  const licensingAfter = (examFirst ? GET_LICENSED_STEPS.slice(1) : GET_LICENSED_STEPS).filter(
    (step) => examHere || step.id !== 'schedule-exam',
  )
  /* COLLAPSED — `dashboard-journey-complete`, and it only means anything at
     100%. Below that the two variants are identical, which is why the flag is
     read here and applied against `courseworkDone` rather than gating the
     whole branch: a collapsed card on a learner with work left would hide the
     thing they are doing.

     The hook is called UNCONDITIONALLY and the state check applied after — the
     `rules-of-hooks` trap `LearnerFocusedBand` records three times over. */
  const completeStyle = useFeatureFlag('dashboard-journey-complete').variant ?? 'full'
  const courseworkDone = stops.length > 0 && stops.every((st) => st.status === 'completed')
  const collapseCoursework = courseworkDone && completeStyle === 'collapsed'

  /* RIGHT RAIL V2 — `atlas-right-rail-layout` (2026-09-30): the Atlas home's
     four steps in ONE frame. Read unconditionally (rules of hooks); applied
     only with `examFirst`, which is the Atlas home. */
  const railV2 = useFeatureFlag('atlas-right-rail-layout').variant === 'v2'


  /* ⚠ NO LO-FI BRANCH HERE, DELIBERATELY. This widget is a COMPOSITION — the
     promoted step, the coursework card and one card per licensing step, each
     with its own `shell`. A branch at this level returned a single block of
     bars and flattened four cards into one, which loses exactly the thing lo-fi
     is supposed to keep: the template. The leaves own it instead —
     `ExamDateCard`, `StudyJourneyRail` (inside the coursework card) and
     `LicensingStepWidget` below. */
  if (splitSteps) {
    /* ── THE ATLAS HOME (feat/atlas-compass-global-nav) ──────────────────
       Its own right rail, unchanged by the 2026-10-02 merge of main: the
       outlined coursework card or the one-frame V2 rail, no exam card (it is
       the left column's banner). Every other split column is main's, below. */
    if (atlasHome) {
      /* THE ATLAS STUDY JOURNEY CARD, OUTLINED — the Atlas home, 2026-09-24, the
         direct ask (tried on Schedule State Exam first, then moved here): no fill
         and the Study Pace card's 1px `--color-atlas-nav-rule` border. The
         padding gives up that 1px so its text still lines up with the cards
         around it. */
      const outlinedShell: CSSProperties = {
        ...shell,
        background: 'transparent',
        border: '1px solid var(--color-atlas-nav-rule)',
        ...(typeof shell.padding === 'number' ? { padding: shell.padding - 1 } : null),
      }
      // Fits its own content (2026-09-24, the direct ask) — it briefly matched
      // the Study Pace card's depth and was set back the same day.
      const courseworkShell = atlasHome ? outlinedShell : shell
      /* V2: the frame IS the Step 2 card (its background, stroke and padding),
         and every step inside it is bare — no fill, border, rule or inset of its
         own — so all four share the frame's padding and line up. */
      const v2 = atlasHome && railV2
      const bareShell: CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: 0 }
      // V2's rule between steps (2026-09-30, the designer's request): 1px in the
      // frame's own stroke colour, sitting in the frame's 24px gap on each side.
      const railRule: CSSProperties = {
        display: 'block',
        height: 1,
        background: 'var(--color-atlas-nav-rule)',
      }
      const licensingSteps = GET_LICENSED_STEPS.map((step, i) => (
        <LicensingStepWidget
          key={step.id}
          step={step}
          // Atlas home: Schedule State Exam left the rail for its own banner
          // (2026-10-01), so coursework is Step 1 and these follow as 2 and 3.
          number={atlasHome ? i + 1 : stepStart + i}
          // Step 1 on the Atlas home is as deep as the course card beside it
          // (`--cre-course-card-h`, published by LearnerFocusedBand). Its fill is
          // `--color-atlas-step-card` where a brand sets one (Global: #FCFCFB,
          // 2026-09-30), else the card surface.
          shell={
            v2
              ? bareShell
              : atlasHome && i === 0
              ? {
                  ...shell,
                  background: 'var(--color-atlas-step-card, var(--color-surface-card))',
                  boxSizing: 'border-box',
                  minHeight: 'var(--cre-course-card-h, auto)',
                }
              : shell
          }
          roundedRule={cardPadding != null}
          bare={v2}
          onOpenStep={onOpenStep}
          state={path.state}
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
      ))
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
      const requirementsButton = onOpenRequirements ? (
        <RequirementsButton onOpen={onOpenRequirements} state={path.state} />
      ) : null
      if (v2) {
        return (
          <div
            style={{
              ...outlinedShell,
              display: 'flex',
              flexDirection: 'column',
              // 24 · rule · 24 between steps (2026-09-30, the designer's
              // request; it was 32 · rule · 32).
              gap: 24,
              // The frame fits its steps (no Step 1 min-height in V2).
              minHeight: undefined,
            }}
          >
            {/* No Schedule State Exam here since 2026-10-01 — it is the
                banner under the course card (`ScheduleExamBanner`). */}
            {collapseCoursework ? (
              <section aria-label="Study journey" style={bareShell}>
                <p className="cre-eyebrow-ink" style={collapsedEyebrowStyle}>
                  <span style={{ fontWeight: 700 }}>Step 1</span> · Study Journey
                </p>
                <p style={collapsedTitleStyle}>Coursework complete</p>
              </section>
            ) : (
              <section aria-label="Study journey" style={bareShell}>
                <StudyJourneyRail
                  path={path}
                  onOpenStop={onOpenStop}
                  onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
                  stepRange
                  stepNumber={1}
                  atlasEyebrow
                />
              </section>
            )}
            <span aria-hidden style={railRule} />
            {licensingSteps[1]}
            <span aria-hidden style={railRule} />
            {licensingSteps[2]}
            {requirementsButton}
          </div>
        )
      }
      return (
        // 32 between the cards on the Atlas home (2026-09-24, the direct ask),
        // which is where `cardPadding` is set; 20 elsewhere.
        <div style={{ display: 'flex', flexDirection: 'column', gap: cardPadding != null ? 32 : 20, minWidth: 0 }}>
          {/* Coursework, then the licensing steps. With `atlasHome` (the Atlas
              home) the exam step is not here at all since 2026-10-01: it is the
              banner under the course card (`ScheduleExamBanner`). */}
          {/* THE FINISHED COURSEWORK AS ONE LINE, when the flag asks for it. The
              argument the variant exists to test: at 100% the only actionable
              things left are the licensing steps, and four stops of finished work
              above them is a receipt rather than a next action. The full variant
              disagrees — see the flag's own description. */}
          {collapseCoursework ? (
            <section aria-label="Study journey" style={courseworkShell}>
              <p className="cre-eyebrow-ink" style={collapsedEyebrowStyle}>
                {atlasHome ? (
                  <>
                    <span style={{ fontWeight: 700 }}>Step 1</span> · Study Journey
                  </>
                ) : (
                  'Step 1 · Atlas Study Journey'
                )}
              </p>
              <p style={collapsedTitleStyle}>Coursework complete</p>
            </section>
          ) : (
            <section aria-label="Study journey" style={courseworkShell}>
              <StudyJourneyRail
                path={path}
                onOpenStop={onOpenStop}
                onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
                /* "Steps 01–04 · Atlas Study Journey" — so the four cards' eyebrows
                   run 01-04, 05, 06, 07 down the column instead of the sequence
                   appearing to start at 05. Split only; see the prop's note. */
                stepRange
                stepNumber={1}
                atlasEyebrow={atlasHome}
              />
            </section>
          )}
          {atlasHome ? (
            /* Steps 3 and 4 keep the original 20 between them (2026-09-24, the
               direct ask) — the 32 applies between the filled cards and around
               the pair, not inside it. */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
              {licensingSteps.slice(1)}
            </div>
          ) : (
            licensingSteps
          )}
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
          {requirementsButton}
        </div>
      )
    }
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
        {/* THE FINISHED COURSEWORK AS ONE LINE, when the flag asks for it. The
            argument the variant exists to test: at 100% the only actionable
            things left are the licensing steps, and four stops of finished work
            above them is a receipt rather than a next action. The full variant
            disagrees — see the flag's own description. */}
        {/* SCHEDULE STATE EXAM, PROMOTED — `journey-step-order: exam-first`.
            Above the coursework card and numbered 1, because it is the thing a
            learner can do today and the date it produces is what the Study Pace
            tile plans against. */}
        {promoted &&
          (promoted.id === 'schedule-exam' ? (
            <ExamScheduleWidget
              shell={shell}
              onOpenStep={onOpenStep}
              stateName={jurisdictionName(path.state) || undefined}
            />
          ) : (
            <LicensingStepWidget
              step={promoted}
              number={1}
              shell={shell}
              onOpenStep={onOpenStep}
              state={path.state}
              hideSheetLink={quickLinks}
            />
          ))}
        {afterExam}
        {/* ⚠ THE COURSEWORK CARD MAY BE IN THE OTHER COLUMN — Testing 3's
            combined block absorbs it. Checked BEFORE `collapseCoursework`,
            because that branch draws its own card too and a page showing both
            the combined block and a "Coursework complete" stub would be the
            same subject twice in the shape this version exists to remove. */}
        {journeyElsewhere ? null : collapseCoursework ? (
          <section aria-label="Study journey" style={shell}>
            <p className="cre-eyebrow-ink" style={collapsedEyebrowStyle}>
              {`Step ${courseworkStep} · Atlas Study Journey`}
            </p>
            <p style={collapsedTitleStyle}>Coursework complete</p>
          </section>
        ) : (
          <section aria-label="Study journey" style={shell}>
            <StudyJourneyRail
              path={path}
              onOpenStop={onOpenStop}
              onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
              /* "Steps 01–04 · Atlas Study Journey" — so the four cards' eyebrows
                 run 01-04, 05, 06, 07 down the column instead of the sequence
                 appearing to start at 05. Split only; see the prop's note. */
              stepRange
              stepNumber={courseworkStep}
            />
          </section>
        )}
        {(journeyElsewhere ? [] : licensingAfter).map((step) => {
          /* ⚠ A RUNNING COUNT, not `stepStart + i`. On `ask-first` the exam card
             takes no number, so an index-derived number would leave a hole
             exactly where it sits. `nextNumber` only advances for cards that
             actually show one. */
          const unnumbered = step.id === 'schedule-exam'
          const n = unnumbered ? 0 : nextNumber++
          /* ⚠ BOTH CALL SITES BRANCH THE SAME WAY. `exam-first` lifts this step
             into the promoted slot above, so a branch in only one of them would
             give the reworked card under one order and the shipped one under
             the other — an A/B measuring two things at once. */
          if (step.id === 'schedule-exam') {
            return (
              <ExamScheduleWidget
                key={step.id}
                shell={shell}
                onOpenStep={onOpenStep}
                stateName={jurisdictionName(path.state) || undefined}
              />
            )
          }
          return (
          <LicensingStepWidget
            key={step.id}
            step={step}
            number={n}
            shell={shell}
            onOpenStep={onOpenStep}
            state={path.state}
            hideSheetLink={quickLinks}
            /* The arrival card is named for the DESTINATION rather than the
               action, per the ask ("Get Licensed - Apply for your license"): the
               heading says where the route ends and the lead line says what you
               do to get there. The other two are named by their published step
               title, which already reads as an action. */
            heading={
              /* ⚠ KEYED ON THE STEP, NOT THE INDEX. With `exam-first` this
                 array is a SLICE of two, so the old `i === GET_LICENSED_STEPS
                 .length - 1` (i.e. `i === 2`) matches nothing at all and the
                 arrival card silently loses its "Get Licensed in <state>"
                 heading. Not a hypothetical — re-introducing the index form
                 fails `JourneyStepOrder.test.tsx`. The arrival card is the
                 arrival card, whatever position it is in. */
              step.id === GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1].id
                ? jurisdictionName(path.state)
                  ? `Get Licensed in ${jurisdictionName(path.state)}`
                  : 'Get Licensed'
                : undefined
            }
          />
          )
        })}
        {/* QUICK LINKS — 2026-09-30, the direct ask.
 
            ⚠ THIS ABSORBS THE STANDALONE REQUIREMENTS BUTTON rather than
            sitting beside it. That button was added on 2026-09-21 ("take this
            out of the widget and make it a secondary style button below") and
            State Requirements is one of the three links asked for here — two
            controls, same destination, one under the other, would be the
            duplicate the move was meant to avoid. Its `home.state-requirements`
            tag comes with it: `CtaTest` asserts that id renders unconditionally
            on this surface.
 
            A CONTAINED CARD, unlike the bare button it replaces. One link below
            the cards reads as a footnote to them; three need a container of
            their own or they read as three more steps in the sequence.
 
            NONE OF THE DESTINATIONS ARE NEW — the Exam Details menu, the
            apply-license sheet and the requirements sheet all already existed
            and were all already reachable. This is a second, flatter way in for
            someone who knows what they want, which is what a quick-links block
            is for. */}
        {/* ⚠ TESTING 3 DRAWS ITS OWN — `journeyElsewhere` suppresses this card
            too as of 2026-10-01. That version replaced the Quick links stack
            and the nav tiles above it with ONE six-tile grid
            (`HomeTileGrid`), which carries these three destinations and the
            same CTA ids. Leaving this would render them twice. */}
        {quickLinks && !journeyElsewhere ? (
        <section aria-label="Quick links" style={shell}>
          <p className="cre-eyebrow-ink" style={widgetEyebrowStyle}>
            Quick links
          </p>
          <div style={quickLinksColumnStyle}>
            <button
              type="button"
              data-cta-id="home.quick-exam-info"
              onClick={() => onOpenStep?.(EXAM_DETAILS_STEP_ID)}
              className="cre-cta-ink"
              style={secondaryLinkStyle}
            >
              Exam Information
            </button>
            <button
              type="button"
              data-cta-id="home.quick-get-licensed"
              onClick={() => onOpenStep?.(APPLY_LICENSE_STEP_ID)}
              className="cre-cta-ink"
              style={secondaryLinkStyle}
            >
              How to Get Your License
            </button>
            {onOpenRequirements ? (
              <button
                type="button"
                data-cta-id="home.state-requirements"
                onClick={onOpenRequirements}
                className="cre-cta-ink"
                style={secondaryLinkStyle}
              >
                {/* ⚠ NO JURISDICTION PREFIX, unlike the button this replaces
                    ("New York State Requirements"). Asked for as "State
                    Requirements", and in a list under a heading the prefix is
                    the third naming of a state the column has already said
                    twice. The sheet itself still names it. */}
                State Requirements
              </button>
            ) : null}
          </div>
        </section>
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
/**
 * Licensing step id → the catalog id a test run can kill.
 *
 * A MAP RATHER THAN A FIELD ON THE STEP, because `LicensingStep` is product
 * data — it describes the New York licence, and a research instrument has no
 * business in it. This is the seam between the two.
 */
/**
 * A STEP THAT CANNOT BE STARTED YET — no card, a 4px rule instead.
 *
 * ⚠ THE RULE IS DOING THE CARD'S JOB, which is why it is 4px and not a
 * hairline: without a filled surface the only thing separating one step from
 * the next is this edge, so it has to read as a boundary on its own. The
 * pattern is the Overview page's Rubi panel — a vertical rule with the content
 * hanging off it — in the brand blue rather than Rubi's red, because red on
 * this page means an assessment.
 *
 * ⚠ `-300` IS A BORDER STOP. The XCEL ramp's note is explicit that `-400` and
 * lighter are FILL/BORDER ONLY and never text; a rule is exactly that use, and
 * anything darker would make a step that cannot be started the loudest thing
 * in the column.
 *
 * 4 + 16 = the card's own 20px inset, so the text of a pending step lines up
 * with the text of the one above it rather than shifting left by the width of
 * the rule.
 */
const pendingStepStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  background: 'transparent',
  borderInlineStart: '4px solid var(--color-atlas-step-rule, var(--color-primary-300))',
  padding: '4px 20px 4px 16px',
}

/** The last Get Licensed step — the sheet "How to Get Your License" opens.
 *  Read off the published list rather than written as a literal, so a reorder
 *  of `GET_LICENSED_STEPS` cannot leave this pointing at the wrong sheet. */
const APPLY_LICENSE_STEP_ID = GET_LICENSED_STEPS[GET_LICENSED_STEPS.length - 1].id

const quickLinksColumnStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 12,
}

/**
 * The shared `Button`'s SECONDARY shape — transparent fill, 1px stroke, 40px
 * tall — but NOT that component, and the reason is this version's palette.
 * `Button.secondary` draws its ink and border from `--color-action`, which on
 * XCEL is the Brick red: a FILL colour that measures 2.05:1 as TEXT on the dark
 * shell (the `.cre-alert-action` failure). This version deliberately moved every
 * CTA onto the navy — "navy means do this; red means this is an assessment" — so
 * a red outlined button here would be the only red control on the page.
 *
 * ⚠ `borderColor: currentColor` so `.cre-cta-ink` owns BOTH the ink and the
 * stroke from one declaration, including its dark-mode swap to the light stop.
 * An explicit colour would need saying twice and would beat the class while
 * looking correct.
 *
 * FULL WIDTH by declaration here rather than by inheritance: these sit in a
 * gap'd column inside a card, not as direct children of the stretching flex
 * column the standalone button used to live in.
 */
const secondaryLinkStyle: CSSProperties = {
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
}

/* The rounded variant of `pendingStepStyle`'s rule: same 4px, same
   `--color-primary-300`, same place — only the ends are round.
   `--color-atlas-step-rule` is set only under the Atlas palette (tokens.css),
   where these rules are the secondary tan; elsewhere the blue stays. */
const ROUNDED_RULE: CSSProperties = {
  position: 'absolute',
  insetInlineStart: 0,
  top: 0,
  bottom: 0,
  width: 4,
  borderRadius: 2,
  background: 'var(--color-atlas-step-rule, var(--color-primary-300))',
}

/** The filled card's horizontal inset, which a pending step's rule + padding
 *  must add up to. Falls back to the framed shell's 20. */
function pendingInset(shell: CSSProperties): number {
  return typeof shell.padding === 'number' ? shell.padding : 20
}

const LICENSING_STEP_CTA: Record<string, string | undefined> = {
  'schedule-exam': 'home.schedule-exam',
  'pass-exam': 'home.what-to-expect',
  'apply-license': 'home.how-to-apply',
}

/* ⚠ `ExamStepCard` WAS HERE. It existed only to choose between `date-first`
   and `ask-first` at the two call sites `journey-step-order` creates, and went
   with the flag on 2026-09-29 — with one treatment left there is nothing to
   choose. Restoring the flag means restoring it too; `archivedItems.ts` says so.

   ⚠ BOTH CALL SITES ABOVE STILL BRANCH ON `step.id === 'schedule-exam'`, and
   they must keep agreeing: `exam-first` renders this step from the promoted
   slot instead of the map, so a change to one and not the other brings back
   the same split this component was written to close. */

/**
 * SCHEDULE STATE EXAM, AS A BANNER — the Atlas home, 2026-10-01, the
 * designer's request: "Remove step 1… make a new module out of it in between
 * the Course Card and the Study Pace card in more of a banner style… the same
 * width as the ones above and below it."
 *
 * THE SAME CARD, not a copy: `LicensingStepWidget` with `banner`, so the exam
 * date capture, the scheduled state ("NY State Exam Scheduled" / "Edit Exam
 * Date") and the step's link all behave exactly as they did in the rail. Its
 * width is the left column's, by inheritance — a flex column stretches it to
 * match the course card and the Study Pace card.
 *
 * Surface: the step card's own fill (`--color-atlas-step-card`, #FCFCFB on
 * Global) with the course card's 1px rule, at the page's 32px module inset
 * across and 24 down.
 */
export function ScheduleExamBanner({
  state,
  onOpenStep,
  style,
}: {
  state?: string
  onOpenStep?: (id: string) => void
  style?: CSSProperties
}) {
  const step = GET_LICENSED_STEPS.find((s) => s.id === 'schedule-exam')
  if (!step) return null
  return (
    <LicensingStepWidget
      step={step}
      number={0}
      banner
      // Asked as a question on the banner (2026-10-01, the designer's
      // request); once a date is saved it still reads "NY State Exam
      // Scheduled".
      heading="Do you have your State Exam scheduled?"
      state={state}
      onOpenStep={onOpenStep}
      shell={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px 32px',
        padding: '24px 32px',
        boxSizing: 'border-box',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-atlas-step-card, var(--color-surface-card))',
        border: '1px solid var(--color-compass-course-card-stroke, var(--color-atlas-nav-rule))',
        ...style,
      }}
    />
  )
}

/* ⚠ IT WAS EXPORTED FOR ONE BUILD (2026-10-01) so Testing 3 could draw steps 2
   and 3 inside its combined card with a bare shell. That turned out to need a
   DISCLOSURE — collapsed to the heading, expanding to the fee and detail — and
   threading one through here would have put an accordion on QE Focused, Testing
   and Testing 2 for one version's ask. Testing 3 forks the markup and imports
   the data instead (`JourneyStepDisclosure` in `CombinedCourseCard`), so this
   is module-private again. */
function LicensingStepWidget({
  step,
  number,
  shell,
  onOpenStep,
  heading,
  state,
  hideSheetLink = false,
  roundedRule = false,
  banner = false,
  bare = false,
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
  /** `journey-quick-links` collects these into one card, so the card's own
   *  "What to expect" / "How to apply" would be the second copy. ⚠ Suppresses
   *  the LINK only — the exam-date capture below it, where this card still has
   *  one, is a control rather than a way into a sheet and stays. */
  hideSheetLink?: boolean
  /** The path's jurisdiction CODE ("NY"), for the scheduled heading. Passed
   *  rather than derived: the widget has no path. */
  state?: string
  /** A pending step's rule drawn as a bar with ROUNDED ENDS (a border cannot
   *  round its own ends) — the Atlas home, 2026-09-24, the direct ask. */
  roundedRule?: boolean
  /** Inside the right rail's V2 frame (2026-09-30): the step draws no card,
   *  rule or inset of its own — `shell` is used as given, pending or not. */
  bare?: boolean
  /** The Atlas home's SCHEDULE STATE EXAM BANNER (2026-10-01): the same card
   *  laid out across — heading, fee and link on the left, the date capture on
   *  the right — with no step number, as it is no longer a step in the rail.
   *  `shell` is the banner's own surface. See `ScheduleExamBanner`. */
  banner?: boolean
}) {
  /*
   * Owner and fee on one line, ASSEMBLED rather than interpolated — a trailing
   * "·" reads as a value that failed to load, which is the admin roster's
   * blank-cell rule and the same shape as the Links panel's row meta.
   *
   * THE LINE IS THE FEE — 2026-09-22, the direct ask ("Remove the PSI, leave
   * the fee"), pointed at Schedule State Exam's "PSI · $40 exam fee".
   *
   * IT FINISHES A MOVE STARTED THE DAY BEFORE. That ask ("remove") was pointed
   * at Pass State Exam's meta, which was the bare word "PSI", and it was
   * written as a RULE rather than an exemption for one id — "a meta line is a
   * pairing, and with no fee to pair with the owner is a one-word row under a
   * sentence". The owner has now been removed from both ends of that pairing,
   * so what is left is the rule it was always converging on: the meta line
   * states the FEE, and nothing else.
   *
   * KEPT AS A RULE for the same reason as last time — a condition on
   * `step.id` would mean remembering which step was exempt, and there are
   * three of these plus whatever a second state adds.
   *
   * IT ALSO DROPS "NY" FROM APPLY FOR YOUR LICENSE, which the ask did not
   * name. That card read "NY · $80 application fee" via `ownerShort`, and the
   * card's own title is "Get Licensed in New York" — so the owner was saying
   * the state twice. Pass State Exam is unchanged either way: it has no fee,
   * so it had no meta line under the previous rule and has none under this one.
   *
   * WHAT IS LOST, and where it survives: the owner is the reason these steps
   * are separate from the coursework at all ("everything in the journey happens
   * inside the LMS and nothing here does"). That fact is now in each step's own
   * sheet rather than on any card — `GetLicensedStepPanel`, which the card's
   * detail link opens, and which still names PSI, DFS and NIPR. `step.owner`
   * and `step.ownerShort` are UNTOUCHED in the data and still read by
   * `StudyJourneyRail`; restoring the pairing here is one line.
   */
  const meta = step.fee ?? ''
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
  /*
   * THE SCHEDULED STATE — 2026-09-23, the direct ask: "When saved: Header -
   * change to NY State Exam Scheduled. Change the CTA link to Edit Exam Date."
   *
   * `editing` LIVES HERE rather than inside the capture, because the control
   * that opens the editor is now the card's own footer link and the panel it
   * opens is the capture's. Two components cannot own one disclosure; lifting
   * it is what stops the link and the panel disagreeing about which state is
   * showing.
   *
   * THE STATE CODE IS THE PATH'S, not a literal. "NY State Exam Scheduled" is
   * what the ask names because New York is the demo, and typing NY here would
   * put a wrong jurisdiction on every other path the moment one exists — the
   * defect `jurisdictionName`'s own fallback was written for.
   */
  const storedExam = useExamDate()
  const [editingExam, setEditingExam] = useState(false)
  /* ⚠ WITH THE OTHER HOOKS, not beside the lo-fi branch further down — there
     is a conditional return between here and there, so a `useLoFi()` at the
     branch would be a hook after an early return. */
  const { loFi } = useLoFi()
  const scheduled = hasCapture && Boolean(storedExam) && !editingExam
  /*
   * NOTHING HERE CAN BE DONE YET — 2026-09-23, the direct ask: these steps
   * "cannot be done yet, so remove the white background".
   *
   * Pass State Exam and Get Licensed both wait on something outside the LMS —
   * a sitting PSI has not scheduled, a licence the Department has not issued —
   * so a white card gives them the same standing as Schedule State Exam, which
   * has a date field in it and can be acted on this minute. Three equal cards
   * read as three equal invitations.
   *
   * ⚠ `!hasCapture` IS A PROXY, and it is worth knowing it is one. What the
   * rule means is "no action is available yet"; what it tests is "this step
   * has no input on it", which is true of exactly these two today. If a step
   * ever becomes actionable WITHOUT a capture — a link that actually books
   * something — this needs a real field on `LicensingStep` rather than an
   * inference from its shape.
   */
  const pending = !hasCapture
  /* ⚠ TWO EARLY RETURNS, MERGED 2026-10-05, AND LO-FI GOES FIRST. Both can be
     true at once — the Atlas banner is a layout, lo-fi is a view mode — and
     lo-fi winning is the right way round: it renders the placeholder INSIDE
     whatever shell applies, so the banner still reads as a banner in wireframe.
     The other order would have shown a fully drawn banner in lo-fi mode. */
  /* LO-FI — the card's own shell stays, its contents go. One of the leaves the
     composition above delegates to. */
  if (loFi) {
    return (
      <section aria-label={heading ?? step.title} style={pending ? pendingStepStyle : shell}>
        <LoFiWidgetBody rows={3} ariaLabel="Lo-fi licensing step" />
      </section>
    )
  }
  if (banner) {
    /* THE BANNER IS THE QUESTION AND A YES / NO — 2026-10-01, the designer's
       requests, in order: no fee line, no "Schedule State Exam →" link, no
       "Already scheduled?" hint, no date capture at all, then Yes and No. So it ignores a
       stored date too: with no capture there is no "Edit Exam Date" to undo
       one, and a heading that said "NY State Exam Scheduled" would have no way
       back. A date saved earlier still drives the page's figures; it is
       cleared from the browser's storage, not from here. */
    return (
      <section aria-label={heading ?? step.title} style={shell}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 'var(--type-atlas-h8-size, 18px)',
            lineHeight: 'var(--type-atlas-h8-line, 24px)',
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {heading ?? step.title}
        </p>
        {/* YES / NO — 2026-10-01, the designer's request, Yes as the active
            (primary) button. The Course card's Begin Course button, so the two
            read as one family: the shared Compass size, the brand's own fill;
            No is its outline. NOT WIRED YET — neither answer leads anywhere
            until one is designed. */}
        <div style={{ display: 'flex', gap: 12, flex: 'none' }}>
          <button type="button" className="cre-compass-primary cre-compass-btn-primary" style={COMPASS_BUTTON}>
            Yes
          </button>
          <button type="button" className="cre-compass-secondary" style={COMPASS_BUTTON}>
            No
          </button>
        </div>
      </section>
    )
  }
  return (
    /* The accessible name is the VISIBLE heading, not the step title, so the
       arrival card is not announced as "Apply for your License" while reading
       "Get Licensed in New York". A region whose name disagrees with its own
       heading is the same defect in miniature as the nav-collapse page's
       "Dash Dashboard". */
    <section
      aria-label={heading ?? step.title}
      style={
        bare
          ? shell
          : pending
          ? // Keep the rule + padding equal to the FILLED cards' inset, whatever
            // it is — 20 by default, the Atlas home's 32 (2026-09-24, the direct
            // ask) — so a pending step's text lines up with the cards above.
            roundedRule
            ? {
                ...pendingStepStyle,
                position: 'relative',
                borderInlineStart: 'none',
                paddingInlineStart: pendingInset(shell),
                paddingInlineEnd: pendingInset(shell),
              }
            : { ...pendingStepStyle, paddingInlineStart: pendingInset(shell) - 4, paddingInlineEnd: pendingInset(shell) }
          : shell
      }
    >
      {pending && roundedRule && !bare ? <span aria-hidden style={ROUNDED_RULE} /> : null}
      {/* THE NUMBER IS THE SEQUENCE. Four cards cannot draw a continuous
          spine, so "Step 05" is what still says these follow the coursework
          and each other. It rides in the eyebrow slot the journey card already
          uses, so all four cards label themselves the same way. */}
      {/* BOLD on the Atlas home (2026-09-30, the designer's request), where
          `roundedRule` is set; the regular eyebrow weight elsewhere. */}
      <p className="cre-eyebrow-ink" style={roundedRule ? { ...widgetEyebrowStyle, fontWeight: 700 } : widgetEyebrowStyle}>
        Step {number}
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
        {scheduled && state ? `${state} State Exam Scheduled` : (heading ?? step.title)}
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
      {hasCapture ? (
        <ExamDateCapture
          stored={storedExam}
          editing={editingExam}
          onDone={() => setEditingExam(false)}
        />
      ) : null}
      {(onOpenStep || scheduled) && !hideSheetLink ? (
        <button
          type="button"
          /* ⚠ DERIVED FROM THE STEP — one element renders all three licensing
             cards, so a literal would kill the wrong one. `LICENSING_STEP_CTA`
             maps the step ids to the catalog's; an unmapped step gets no
             attribute at all, which is the right failure (a control no run can
             kill, rather than one that dies with its neighbour). */
          data-cta-id={LICENSING_STEP_CTA[step.id]}
          onClick={() => (scheduled ? setEditingExam(true) : onOpenStep?.(step.id))}
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
          {scheduled ? 'Edit Exam Date' : (step.detailLabel ?? 'What to expect')} →
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
function ExamDateCapture({
  stored,
  editing,
  onDone,
}: {
  stored: string | null
  /** Owned by the CARD, not here — its "Edit Exam Date" link is what opens the
   *  editor now, so the two cannot disagree about which state is showing. */
  editing: boolean
  onDone: () => void
}) {
  const [draft, setDraft] = useState('')
  const open = editing || !stored

  /*
   * ⚠ THE SET STATE IS NOW THE FIGMA CALENDAR, and the state it replaces is
   * worth recording because it was doing a job: "Your exam date · December 15,
   * 2026 · Change · Clear" — a caption, the date in words, and two links.
   *
   * WHAT SURVIVES THE SWAP. The date is still visible and still reversible,
   * which is the requirement the old note set ("a value that can silently
   * override the page's headline figure has to be visible and reversible"). The
   * calendar carries the date; CHANGE moved out to the card's own CTA as "Edit
   * Exam Date", per the ask.
   *
   * ⚠ WHAT DOES NOT. `Clear` has no home in the new design and is not drawn in
   * the Figma. It survives INSIDE the editor instead — open the editor and the
   * field can be emptied and saved — so the value is still reversible without a
   * link on the resting card. That is a real reduction in discoverability for a
   * control that resets a demo figure, and it is flagged rather than quietly
   * dropped: if a reviewer gets stuck with a stale date, this is why.
   */
  if (!open) {
    return (
      <div style={{ marginTop: 12 }}>
        <ExamDateCalendar iso={stored} />
        {/* The date in WORDS for the accessibility tree, since the calendar is
            `aria-hidden` — three stacked fragments ("SEPTEMBER", "28", "2025")
            do not read as a date, and the card's heading only says one is
            scheduled. */}
        <p style={srOnlyDateStyle}>Exam scheduled for {longDate(isoToSlashes(stored))}</p>
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
          data-cta-id="home.exam-date-save"
          disabled={!draft}
          onClick={() => {
            writeExamDate(draft)
            onDone()
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
        {stored ? (
          <button
            type="button"
            data-cta-id="home.exam-date-clear"
            onClick={() => {
              clearExamDate()
              onDone()
            }}
            className="cre-link-action cre-cta-ink"
            style={{ ...captureLinkStyle, alignSelf: 'center' }}
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Off-screen but in the accessibility tree — the pattern `StudyJourneyRail`'s
 *  own `srOnlyStyle` uses. */
const srOnlyDateStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}


/**
 * THE EXAM-DATE CALENDAR — Figma `2.0 - Learning Path Page`, node 1195:16026
 * (the tear-off inside `CalendarProgressAndGoalTracker`, 1195:8978).
 *
 * 2026-09-23, the direct ask: when a date is entered, this is what the Schedule
 * State Exam card shows.
 *
 * WHAT WAS TAKEN AND WHAT WAS NOT. The node is a LICENSE TRACKER in its Expired
 * state, on the MCK brand: an orange "Begin New Cycle" button, orange links,
 * Open Sans throughout, and an "Expired" status word above the calendar. None
 * of that is here. The calendar is the piece the ask points at; the chrome
 * around it belongs to a different card on a different brand, and its status
 * word is already this card's heading ("NY State Exam Scheduled"), so keeping
 * it would print the state twice.
 *
 * ⚠ THE TWO RINGS ARE REDRAWN RATHER THAN DOWNLOADED, which is a deliberate
 * departure from the design-to-code rule that assets are used as exported. They
 * export as `Line 172` / `Line 173` — two zero-height strokes with round caps,
 * i.e. geometry rather than artwork. Committing two SVG files to draw two
 * straight lines cuts against this repo's asset conventions (one icon registry,
 * `vite-plugin-svgr`, nothing loose in `public/`), and a stroke is the one kind
 * of "asset" that survives being expressed as a border-radius. Said out loud
 * here because a silent substitution is the thing that rule exists to stop.
 *
 * THE GEOMETRY IS THE DESIGN'S, in its own units: a 140x149 box, the body
 * inset 9px from the top with a 12px radius and a 1px `#a2a2a2` rule — which is
 * `--color-neutral-500` exactly, so the design's neutral ramp and ours already
 * agree — a 19px grey cap, and rings at 27% and 64% of the width.
 *
 * THE TYPE IS OURS. The design sets all three lines in Open Sans SemiBold
 * because that is MCK's only face. Here the DAY takes `--font-heading`, the
 * token every other display figure on this page uses (the band's percentage,
 * the pace card's "2¾"), so it follows `dashboard-heading-font` rather than
 * being the one numeral that ignores the control. Month and year stay on
 * `--font-body`: at 16px they are labels, not figures.
 */
function ExamDateCalendar({ iso }: { iso: string }) {
  const d = dateFromIso(iso)
  if (!d) return null
  return (
    <div style={calShellStyle} aria-hidden>
      <div style={calRingStyle(38)} />
      <div style={calRingStyle(89)} />
      <div style={calBodyStyle}>
        <div style={calCapStyle} />
        <p style={calMonthStyle}>{d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}</p>
        <p style={calDayStyle}>{d.getDate()}</p>
        <p style={calYearStyle}>{d.getFullYear()}</p>
      </div>
    </div>
  )
}

const calShellStyle: CSSProperties = {
  position: 'relative',
  width: 140,
  height: 149,
  flex: 'none',
}

/* The two binder rings, at the design's 27.14% and 63.57% of 140. Round-capped
   by a pill radius, which is what the exported strokes' `linecap` draws. */
const calRingStyle = (left: number): CSSProperties => ({
  position: 'absolute',
  top: 0,
  left,
  width: 7,
  height: 18,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-text-primary)',
})

const calBodyStyle: CSSProperties = {
  position: 'absolute',
  top: 9,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: 12,
  border: '1px solid var(--color-neutral-500)',
  background: 'var(--color-surface-card)',
  overflow: 'hidden',
  textAlign: 'center',
}

/** The grey cap the rings pass through. */
const calCapStyle: CSSProperties = {
  height: 19,
  background: 'var(--color-neutral-500)',
}

const calMonthStyle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const calDayStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 50,
  fontWeight: 600,
  lineHeight: '58px',
  color: 'var(--color-text-primary)',
}

const calYearStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
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

/* The collapsed card's two lines. Same eyebrow treatment as the rail it
   replaces, so the column keeps one label shape whichever variant is on. */
const collapsedEyebrowStyle: CSSProperties = {
  ...widgetEyebrowStyle,
  margin: '0 0 6px',
}
const collapsedTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 21,
  lineHeight: '27px',
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

/** The State Requirements button — the shared `Button`'s secondary shape at
 *  the full width of its column. One component so the right rail's V1 (below
 *  the cards) and V2 (inside the frame) draw the same control; see the note at
 *  its V1 call site on why it is not the shared `Button`. */
function RequirementsButton({ onOpen, state }: { onOpen: () => void; state: LearningPathSummary['state'] }) {
  return (
    <button
      type="button"
      data-cta-id="home.state-requirements"
      onClick={onOpen}
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
      {jurisdictionName(state)
        ? `${jurisdictionName(state)} State Requirements`
        : 'State Requirements'}
    </button>
  )
}
