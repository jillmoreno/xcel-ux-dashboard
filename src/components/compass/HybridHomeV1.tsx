import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AngleRightRegular,
  BallotCheckRegular,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="cre-compass-primary cre-compass-btn-primary"
                onClick={onBegin}
                disabled={!onBegin}
                style={BEGIN}
              >
                {notStarted ? 'Begin Course' : 'Resume Course'}
              </button>
              {onOverview ? (
                <button type="button" className="cre-compass-home-chip" onClick={onOverview} style={CHIP}>
                  Course Overview
                </button>
              ) : null}
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
            {onOpenRequirements ? (
              <button
                type="button"
                data-cta-id="home.state-requirements"
                className="cre-compass-secondary"
                onClick={onOpenRequirements}
                style={REQUIREMENTS}
              >
                {state ? `${state} State Requirements` : 'State Requirements'}
              </button>
            ) : null}
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

        <nav aria-label="Other information for your journey" style={SIDE_CARD}>
          {/* The exam-date card's heading style — Serif H8 (2026-10-02, the
              designer's request; the design sets it in Open Sans SemiBold 16). */}
          <p style={STEP_TITLE}>Other Information for Your Journey</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SideLink icon={<BookRegular size={13} aria-hidden />} label="My Courses" onClick={() => go('courses')} />
            <SideLink icon={<FileCertificateRegular size={13} aria-hidden />} label="My Certificates" onClick={() => go('certificates')} />
            <SideLink icon={<NotebookRegular size={13} aria-hidden />} label="Flashcards" onClick={() => go('course', 'flashcards')} />
            <SideLink icon={<BallotCheckRegular size={13} aria-hidden />} label="Exam Simulator" onClick={() => go('course', 'exam-simulator')} />
            <SideLink
              icon={<CircleInfoRegular size={13} aria-hidden />}
              label="Exam Information"
              onClick={onOpenStep ? () => onOpenStep(EXAM_DETAILS_STEP_ID) : undefined}
            />
            <SideLink
              icon={<PenFieldRegular size={13} aria-hidden />}
              label="Applying for a License"
              onClick={onOpenStep ? () => onOpenStep(apply.id) : undefined}
            />
            <SideLink icon={<ClipboardListCheckRegular size={13} aria-hidden />} label="State Requirements" onClick={onOpenRequirements} />
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
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: current ? 42 : 36 }}>
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
              color: open ? 'var(--color-compass-page-button)' : 'var(--color-text-tertiary)',
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

function SideLink({ icon, label, onClick }: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <li>
      <button type="button" className="cre-compass-v2-row" onClick={onClick} disabled={!onClick} style={SIDE_ROW}>
        <span aria-hidden style={{ width: 18, flex: 'none', display: 'inline-flex', justifyContent: 'center', color: 'var(--color-compass-page-button)' }}>
          {icon}
        </span>
        <span style={{ flex: '1 1 0', minWidth: 0, textAlign: 'left' }}>{label}</span>
        <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-page-button)' }}>
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
  justifyContent: 'center',
}
/* The Home course card's surface — 48 in, 14 radius (Figma). */
const CARD: CSSProperties = {
  flex: '0 1 711px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  padding: 48,
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
const CHIP: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '2px 8px 4px',
  borderRadius: 4,
  border: '1px solid var(--color-compass-page-card-border)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 10,
  lineHeight: '13px',
  color: 'var(--color-neutral-600)',
  whiteSpace: 'nowrap',
}
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
  color: 'var(--color-text-tertiary)',
}

const SPINE: CSSProperties = { flex: '1 1 0', minHeight: 1, width: 0, borderLeft: '2px solid var(--color-border-subtle)' }
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
const REQUIREMENTS: CSSProperties = {
  height: 40,
  borderRadius: 8,
  border: '1px solid',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}
/* The side cards: the Atlas rail's 1px rule, 12 radius, 24 / 32 / 32. */
const SIDE_CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '24px 32px 32px',
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--color-atlas-nav-rule)',
}
const SIDE_CARD_LIFTED: CSSProperties = {
  border: 'none',
  background: 'var(--color-compass-course-card)',
  boxShadow: 'var(--shadow-compass-md)',
}
/* ⚠ `SIDE_BUTTON` WENT 2026-10-05 — it sized the Yes / No pair on Eric's exam
   question, and `ExamScheduleWidget` brings its own controls. Removed rather
   than parked (`noUnusedLocals`); `AtlasHomeV2.tsx` still has it. */
const SIDE_ROW: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  // Colour on `.cre-compass-v2-row` (tokens.css), so the hover can win.
}
