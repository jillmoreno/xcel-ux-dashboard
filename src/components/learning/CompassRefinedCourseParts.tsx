/**
 * THE LEAVES YOUR COURSE DRAWS — split out 2026-11-12.
 *
 * ⚠ BECAUSE THE CHAPTER LIST FORKED AND THESE DID NOT. `compass-course-rows`
 * gives the page two layouts — the audited rows and the roadmap cards — and
 * both draw the same exam strip, the same marks and the same closing rows.
 * Leaving them in `CompassRefinedLearn.tsx` would have meant the roadmap
 * importing from the page that imports the roadmap, or a second copy of each.
 *
 * ⚠ VERBATIM. Nothing here changed in the move; the rows layout renders what
 * it rendered before the fork, which is what keeps the comparison about the
 * layout.
 */

import {
  Award,
  BallotCheckRegular,
  Check,
  ChevronRight,
  CircleSolid,
  ClipboardList,
  FileCertificateRegular,
  FileText,
  LockRegular,
} from '@/icons'
import { JEFF_MVP_LEARN_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import type {
  RefinedCourseView,
  RefinedFinishStep,
} from './compassRefinedLearnCourse'
import { REFINED_COURSE, REFINED_RING_LABEL } from '@/data/compassRefinedCopy'
import { CompassRefinedNextStep } from './CompassRefinedNextStep'
import type { NextMarkStyle } from './compassRefinedFocusModel'
import type { RefinedNextStep } from './compassRefinedNextStepModel'

/**
 * The exam strip, used by a chapter and by the certification card.
 *
 * ⚠ A LOCKED EXAM IS A DISABLED BUTTON WITH A PADLOCK, not a missing one. His
 * markup carries `disabled aria-disabled="true"` and the lock glyph: the
 * control is visible so the learner knows the exam exists, and inert so they
 * cannot take it. Hiding it would lose the "what opens it" half of the page.
 */
export function ExamRow({
  title,
  note,
  locked,
  done,
}: {
  title: string
  note: string
  locked: boolean
  done: boolean
}) {
  return (
    <div className={done ? 'crf-exam crf-exam--done' : 'crf-exam'}>
      <span className="crf-tile crf-tile--exam" aria-hidden>
        <FileText size={15} />
      </span>
      <div className="crf-exam__name">
        <p className="crf-exam__eyebrow">{COPY.examEyebrow}</p>
        <p className="crf-exam__title">{title}</p>
      </div>
      <span className="crf-exam__note">{note}</span>
      {locked ? (
        <button type="button" className="crf-btn crf-btn--locked" disabled aria-disabled>
          <LockRegular size={13} aria-hidden />
          {COPY.examCta}
        </button>
      ) : (
        <button type="button" className="crf-btn">
          {COPY.examReviewCta}
        </button>
      )}
    </div>
  )
}

/**
 * A closing step — the Final Exam, the Course Survey, the Certificate.
 *
 * ⚠ IT WEARS THE EXAM STRIP'S CLOTHES ON PURPOSE. These sit in the same
 * column as the chapter exams and are the same kind of object to a learner —
 * one thing to do, locked until something opens it — so they take
 * `crf-exam`'s layout rather than a fourth row design.
 *
 * ⚠ THE ICON FOLLOWS THE KIND, the mapping Jillienne set for the Next Step
 * card on 2026-11-11: an exam is a document with a checkmark, a survey a
 * checkbox list, and a certificate the one glyph that means "you finished".
 * `ExamRow` above keeps his `FileText` — that is his markup, carried.
 */
export function FinishMark({ kind }: { kind: RefinedFinishStep['kind'] }) {
  if (kind === 'survey') return <ClipboardList size={15} />
  if (kind === 'certificate') return <FileCertificateRegular size={15} />
  return <BallotCheckRegular size={15} />
}

export function FinishRow({ step }: { step: RefinedFinishStep }) {
  const locked = step.state === 'locked'
  return (
    <div className={step.state === 'done' ? 'crf-exam crf-exam--done' : 'crf-exam'}>
      <span className="crf-tile crf-tile--exam" aria-hidden>
        <FinishMark kind={step.kind} />
      </span>
      <div className="crf-exam__name">
        <p className="crf-exam__eyebrow">{step.eyebrow}</p>
        <p className="crf-exam__title">{step.title}</p>
      </div>
      <span className="crf-exam__note">{step.note}</span>
      {/* ⚠ VISIBLE AND INERT, like his locked exam: the control says the step
          exists, the padlock says it is not yours yet, and the note beside it
          says what opens it. */}
      <button
        type="button"
        className={locked ? 'crf-btn crf-btn--locked' : 'crf-btn'}
        disabled={locked}
        aria-disabled={locked || undefined}
        aria-label={`${step.cta} ${step.title}`}
      >
        {locked ? <LockRegular size={13} aria-hidden /> : null}
        {step.cta}
      </button>
    </div>
  )
}

/** Done is a tick, current a chevron, locked a padlock — his three marks. */
export function ChapterMark({ state }: { state: string }) {
  if (state === 'done') return <Check size={15} />
  if (state === 'current') return <ChevronRight size={15} />
  return <LockRegular size={14} />
}

/** The lesson marks: a tick, a filled dot for where you are, a padlock. */
export function LessonMark({ state }: { state: string }) {
  if (state === 'done') return <Check size={13} />
  if (state === 'current') return <CircleSolid size={8} />
  return <LockRegular size={12} />
}

/**
 * His certification mark is a rosette — a circle over two ribbon tails
 * (`M12 2a6 6 0 1 0 0 12a6 6 0 1 0 0-12M15.477 12.89 17 22l-5-3-5 3
 * 1.523-9.11`). `Award` is the same object at the same weight, so this is an
 * exact match rather than a substitution. The course card above it keeps
 * `GraduationCap`, which is his mortarboard.
 */
export function AwardMark() {
  return <Award size={16} />
}

/**
 * THE COURSE RING — the Overview's ring, at this card's size.
 *
 * ⚠ IT WAS A DONUT — 2026-11-12: "make the 19% a small circle chart to match
 * what is on the overview page". His was a 12px stroke on a 50 radius with
 * the percentage beside it; the Overview settled on a 7px stroke at 70, a
 * hairline track and the figure INSIDE the ring with its label under it. Two
 * rings of one course drawn two ways was the visual half of audit finding 4,
 * left standing after the arithmetic was fixed.
 *
 * ⚠ THE GEOMETRY IS COPIED, THE SIZE IS NOT. The Overview's draws at 132px
 * in a half-card; this sits in a header row beside three other things, so it
 * draws at 88. Same viewBox and the same stroke, so the ring is the same
 * weight of line at either size.
 *
 * ⚠ 88 AND NOT THE 72 IT REPLACED, because the figure moved INSIDE the ring:
 * at 72 the inner circle is 66px across and "COMPLETE" under an 18px number
 * had to set at 8px to fit, which is below anything worth reading. Measured
 * rather than guessed.
 *
 * ⚠ `butt`, NOT `round`. A rounded cap at 0% draws a dot of progress on a
 * course nobody has started — the Overview's own reason.
 */
export function CourseRing({ header }: { header: RefinedCourseView['header'] }) {
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div className="crf-course__ring">
      <svg
        viewBox="0 0 168 168"
        width="88"
        height="88"
        role="img"
        aria-label={`${REFINED_COURSE.name} ${header.pct}% complete, ${header.lessonsDone} of ${header.lessons} lessons`}
      >
        <g transform="rotate(-90 84 84)">
          <circle cx="84" cy="84" r={r} fill="none" stroke="var(--crf-ring-pale)" strokeWidth="7" />
          <circle
            cx="84"
            cy="84"
            r={r}
            fill="none"
            stroke="var(--crf-steel-deep)"
            strokeWidth="7"
            strokeDasharray={`${((header.pct / 100) * c).toFixed(1)} ${c.toFixed(1)}`}
            strokeLinecap="butt"
          />
        </g>
      </svg>
      <span className="crf-course__ringnum">
        <b>{header.pct}%</b>
        <span>{REFINED_RING_LABEL}</span>
      </span>
    </div>
  )
}

/**
 * THE COURSE CARD — what the course is, and the one thing to do in it.
 *
 * ⚠ TWO CARDS JOINED INTO ONE — 2026-11-12: "Have the Course one be at the
 * top, and the where you left off should be below it, attached in 1
 * component with a divider line in between."
 *
 * They were a resume strip ABOVE the course header and a course header
 * below it: the page opened on a lesson name, then re-introduced the course
 * it belongs to. One card states the course and then what to do in it, in
 * that order, and the divider is what says they are two facts rather than
 * one paragraph.
 *
 * ⚠ THE LOWER HALF IS THE OVERVIEW'S CARD, NOT A COPY OF IT — her "1:1".
 * `CompassRefinedNextStep` is the same component that page draws, so the two
 * cannot drift; what Your Course adds around it is the ground it sits on.
 *
 * ⚠ IT BELONGS TO NEITHER CHAPTER LAYOUT. Rows and roadmap each used to draw
 * this header inside their own markup; it is the page's summary, so it is
 * drawn once above whichever list follows.
 */
export function CourseHeadCard({
  header,
  step,
  mark,
  image,
  onAct,
}: {
  header: RefinedCourseView['header']
  step: RefinedNextStep
  mark?: NextMarkStyle
  /** `compass-course-image` — the course's art beside its name. */
  image?: boolean
  onAct?: () => void
}) {
  return (
    <section className="crf-course crf-course--head" aria-label={REFINED_COURSE.name}>
      {/* ⚠ NO BADGE — 2026-11-12: "remove the icon". It was a 36px
          mortarboard tile, his, and on a card that now leads with the
          course's name in the display face it was a second mark competing
          with the ring on the other end of the same row. */}
      <header className="crf-course__head">
        {/* ⚠ THE COURSE'S OWN ART — 2026-11-12, behind
            `compass-course-image`. `aria-hidden` and an empty alt: the name
            is right beside it, so the picture says nothing a screen reader
            is missing. */}
        {image ? (
          <img className="crf-course__art" src={REFINED_COURSE.image} alt="" aria-hidden />
        ) : null}
        <div className="crf-course__name">
          {/* ⚠ THE KIND OF COURSE LEADS — 2026-11-12: "swap the styles and
              locations of these 2. QE should be on top, 21 lessons below to
              match the UI in the Learning Roadmap." The contents list was
              the eyebrow and the kind was the line under the title; the
              roadmap cards below put the name first and what is IN the thing
              underneath it, and this card is the same shape one size up. */}
          <p className="crf-eyebrow">{REFINED_COURSE.kind}</p>
          {/* ⚠ THE COURSE'S NAME LEADS — 2026-11-12: "This should be the
              course name in the Playfair font style. Below in smaller text
              should be Qualifying Education - Florida." The card led with the
              regulatory CATEGORY, which is true of every XCEL course. */}
          <h2 className="crf-h2">{REFINED_COURSE.name}</h2>
          {/* ⚠ WHAT THE COURSE CONTAINS, AND HOW FAR IN — the roadmap card's
              label one size up: the same register, the same drawn dot, under
              the name rather than over it.

              ⚠ COUNTED, NOT TYPED — the list was "19 chapters · 28 of 40
              hours", a chapter count wrong by two and an hours figure nothing
              produces. The progress figure joined it on 2026-11-12 ("add the
              0 of 21 lessons completed in this line"), out of a stat column
              that also held the word "In progress" — the state and the ring
              being the same fact drawn twice at two sizes. */}
          <p className="crf-course__sub">
            {header.eyebrow}
            <span aria-hidden className="crf-step__sep" />
            {header.lessonsDone} of {header.lessons} lessons completed
          </p>
        </div>
        {/* ⚠ NO STATUS WORD — 2026-11-12: "remove". The stat column held "In
            progress" over the lesson count; the count moved into the line
            under the course's name an hour earlier, and the word went with
            the column. The ring says the same thing with a number on it, and
            "In progress" is true of every state but two. */}
        <CourseRing header={header} />
      </header>
      {/* ⚠ THE DIVIDER IS THE HEADER'S OWN BOTTOM RULE, which it already
          carried as the line between itself and the chapter rows. Nothing is
          added for the join; the half below simply sits under the line that
          was already there. */}
      <div className="crf-course__step">
        {/* ⚠ THE ROW ARRANGEMENT — this card has the page's full width; the
            Overview's sits in a 394px bay and stays a column. Same component
            and the same model either way. */}
        <CompassRefinedNextStep step={step} mark={mark} layout="row" onAct={onAct} />
      </div>
    </section>
  )
}
