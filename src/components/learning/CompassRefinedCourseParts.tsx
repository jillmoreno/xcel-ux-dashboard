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
  GraduationCap,
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
import { REFINED_COURSE } from '@/data/compassRefinedCopy'
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
 * The course ring: viewBox 120, drawn at 72px, r=50 stroke 12, rotated so it
 * starts at twelve o'clock.
 *
 * ⚠ THE DASHARRAY IS HIS, AND IT DISAGREES WITH HIS OWN LABEL by about four
 * points — see the fixture note. Carried verbatim on purpose.
 */
export function CourseRing({ header }: { header: RefinedCourseView['header'] }) {
  return (
    <div className="crf-course__ring">
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        {/* ⚠ THE ARC IS COMPUTED — 2026-11-11. It drew his `courseRingDash`,
            a hard-coded 180/314 for 61%, beside a caption that now counts the
            real course: a 61% ring over "1 of 41 sections". A figure and its
            picture disagreeing is the one thing a progress ring must not do. */}
        <svg
          viewBox="0 0 120 120"
          width="72"
          height="72"
          role="img"
          aria-label={`Qualifying Education ${header.pct}% complete, ${header.done} of ${header.sections} lessons`}
        >
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--cjm-ring-pale)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--cjm-steel)"
              strokeWidth="12"
              strokeDasharray={`${((header.pct / 100) * 2 * Math.PI * 50).toFixed(1)} ${(2 * Math.PI * 50).toFixed(1)}`}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className="crf-course__pct" aria-hidden>
          {header.pct}%
        </span>
      </div>
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
  onAct,
}: {
  header: RefinedCourseView['header']
  step: RefinedNextStep
  mark?: NextMarkStyle
  onAct?: () => void
}) {
  return (
    <section className="crf-course crf-course--head" aria-label={REFINED_COURSE.name}>
      <header className="crf-course__head">
        <span className="crf-tile" aria-hidden>
          <GraduationCap size={16} />
        </span>
        <div className="crf-course__name">
          {/* ⚠ COUNTED, NOT TYPED — his read "19 chapters · 28 of 40 hours", a
              chapter count wrong by two and an hours figure nothing
              produces. */}
          <p className="crf-eyebrow">{header.eyebrow}</p>
          {/* ⚠ THE COURSE'S NAME LEADS — 2026-11-12: "This should be the
              course name in the Playfair font style. Below in smaller text
              should be Qualifying Education - Florida." The card led with the
              regulatory CATEGORY, which is true of every XCEL course. */}
          <h2 className="crf-h2">{REFINED_COURSE.name}</h2>
          <p className="crf-course__sub">{REFINED_COURSE.kind}</p>
        </div>
        <div className="crf-course__stat">
          <span className="crf-course__done">{header.status}</span>
          <span className="crf-course__of">
            {header.done} of {header.sections} lessons
          </span>
        </div>
        <CourseRing header={header} />
      </header>
      {/* ⚠ THE DIVIDER IS THE HEADER'S OWN BOTTOM RULE, which it already
          carried as the line between itself and the chapter rows. Nothing is
          added for the join; the half below simply sits under the line that
          was already there. */}
      <div className="crf-course__step">
        <CompassRefinedNextStep step={step} mark={mark} onAct={onAct} />
      </div>
    </section>
  )
}
