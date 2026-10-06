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
import { COMPASS_BUTTON } from './compassButton'
import { journeyStopsFor, type JourneyStop } from '@/components/learning/studyJourneyUtil'
import { widgetEyebrowStyle } from '@/components/learning/widgetStyles'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { GET_LICENSED_STEPS, jurisdictionName } from '@/data/nyProducerRequirements'
import { ExamScheduleWidget } from '@/components/learning/ExamScheduleWidget'
import { EXAM_DETAILS_STEP_ID } from '@/data/examDetails'
import { defaultPreset, formatPaceDate, studyPace, daysUntil, NOT_STARTED_NIGHTS } from '@/lib/studyPace'
import type { LearningPathSummary } from '@/data/learningFixtures'

/**
 * HYBRID V1'S HOME — 2026-10-05, Jillienne's version.
 *
 * ⚠ THIS IS A FORK OF `AtlasHomeV2.tsx`, DELIBERATELY. CLAUDE.md's rule for
 * changing something that already exists is to copy it to a sibling and let the
 * call site choose, so that two designers are never editing one screen. Eric
 * owns `AtlasHomeV2`; this is Jill's copy of it, and the four differences below
 * are the whole reason it exists.
 *
 * ⚠ THE COST IS REAL AND IS THE POINT: a fix in Eric's home does NOT reach this
 * one. That is the trade the fork buys — his version cannot move when this one
 * does. If the two ever need to converge, that is a merge, not a flag.
 *
 * WHAT DIFFERS FROM `AtlasHomeV2` (each marked ⚠ HYBRID at its line):
 *   1. The figures column leads with Course Access, renames Expected →
 *      Estimated completion date, and drops Days to Review.
 *   2. Begin Course sits in the TITLE area, not on the first journey row.
 *   3. Steps 2 and 3 (Pass State Exam, Get Licensed) are collapsible and
 *      collapsed by default — the cognitive-load ask.
 *   4. Complete Coursework carries Testing 3's percentage and current-lesson
 *      marker rather than a plain list of stops.
 *
 * The original note follows, because everything it describes still applies to
 * the parts that were not changed.
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
export type AtlasHomeV2Props = {
  path: LearningPathSummary
  courseTitle: string
  coverUrl?: string | null
  /** The course's progress, 0–100 — the band's own figure. */
  percent: number
  /** Pace-model inputs, exactly as the band hands them to `StudyPaceTile`. */
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  examDate?: string
  notStarted?: boolean
  onBegin?: () => void
  onOverview?: () => void
  onOpenStop?: (courseId: string) => void
  onOpenStep?: (id: string) => void
  onOpenRequirements?: () => void
}

export function HybridHomeV1({
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
  const accessDays = accessExpiresAt ? Math.max(0, daysUntil(accessExpiresAt, today) ?? 0) : null
  /* THE WEEK GOAL IS THE DESIGN'S 3 (2026-10-02, the designer's request), not
     derived. ⚠ It was `preset.days / 7` rounded, which read "2 Week Goal" for
     the 13 days the model gives this demo — so the goal and the Expected
     completion date above it no longer come from one figure. To derive it
     again: `Math.max(1, Math.round(preset.days / 7))`. */
  const weeks: number = 3

  const stops = journeyStopsFor(path)
  const currentIdx = Math.max(
    0,
    stops.findIndex((s) => s.status === 'in-progress'),
  )
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
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          {coverUrl ? <img src={coverUrl} alt="" aria-hidden style={COVER} /> : null}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 15, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={EYEBROW}>Current course:</p>
              <h2 className="cre-compass-course-title" style={TITLE}>
                {courseTitle}
              </h2>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 8 }}>
              {accessDays != null && accessExpiresAt ? (
                <>
                  <Figure
                    label="Course access"
                    value={`${accessDays} ${accessDays === 1 ? 'Day' : 'Days'}`}
                    note={`Ends ${formatPaceDate(accessExpiresAt)}`}
                  />
                  <span aria-hidden style={RULE} />
                </>
              ) : null}
              <Figure
                label="Estimated completion date"
                value={preset.state === 'no' ? 'Not achievable' : formatPaceDate(preset.finishIso)}
                note="At current pace"
              />
            </div>

            <div style={PACE_PANEL}>
              {/* The eyebrow heads the whole panel, above the dial (2026-10-02,
                  the designer's request; the design sets it under it). */}
              <p style={{ ...EYEBROW, alignSelf: 'stretch' }}>Your study pace</p>
              <ProgressDial percent={percent} />
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
                <button type="button" className="cre-compass-v2-link" onClick={() => go('study-plan')} style={LINK}>
                  Customize Your Pace
                  <AngleRightRegular size={13} aria-hidden />
                </button>
              </div>
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

function Figure({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={FIGURE_LABEL}>{label}</p>
      <p style={{ margin: 0, lineHeight: '20px', color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        <span style={{ fontFamily: 'var(--font-heading-serif)', fontSize: 16 }}>{value}</span>
        <span style={{ ...BODY_TEXT, fontSize: 16, fontWeight: 300 }}> - </span>
        <span style={{ ...BODY_TEXT, fontSize: 12 }}>{note}</span>
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
}: {
  stop: JourneyStop
  current: boolean
  last: boolean
  onOpen?: () => void
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
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 40 : 34 }}>
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
      </span>
      {/* ⚠ HYBRID #2 (the other half) — the current row's Begin Course button
          moved to the title area, so every row takes the chevron now and the
          list reads as one kind of thing. The `onBegin` prop went with it
          (`noUnusedLocals`); `AtlasHomeV2.tsx` still has both the prop and the
          branch if this is ever reversed. */}
      {onOpen ? (
        <button type="button" className="cre-compass-v2-link" onClick={onOpen} aria-label={`Open ${stop.title}`} style={CHEVRON}>
          <AngleRightRegular size={13} aria-hidden />
        </button>
      ) : null}
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
