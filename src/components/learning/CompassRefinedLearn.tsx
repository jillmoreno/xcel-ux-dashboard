import {
  refinedCourseView,
  type RefinedChapter,
  type RefinedCourseView,
  type RefinedFinishStep,
} from './compassRefinedLearnCourse'
import { refinedProgressAt } from '@/data/compassRefinedCourse'
import { journeyStage } from './compassReadinessModel'
import { REFINED_FINISH_COPY as FINISH, REFINED_PAGE_TITLES } from '@/data/compassRefinedCopy'
import { useState } from 'react'
import {
  Award,
  BallotCheckRegular,
  Check,
  ChevronDown,
  ChevronRight,
  CircleSolid,
  ClipboardList,
  FileCertificateRegular,
  FileText,
  GraduationCap,
  LockRegular,
  RubiLogo,
} from '@/icons'
import {
  JEFF_MVP_LEARN_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'

/**
 * JEFF'S LEARN PAGE — 2026-11-09, the second page of his Compass MVP.
 *
 * Nineteen chapters of a Qualifying Education course: one complete, one in
 * progress and open, seventeen locked — then the certification exam in a card
 * of its own.
 *
 * ⚠ A LOCKED CHAPTER OPENS. That is the page's lead made good — "a locked
 * step tells you exactly what opens it" — and it is the detail most likely to
 * be lost in a port, because every instinct says a locked row should not
 * expand. His does: it shows the lock message AND the lessons behind it, so a
 * learner can see what is coming and why they cannot have it yet.
 *
 * ⚠ THE PROGRESS BAR IS DRAWN ONLY UNDER THE CURRENT CHAPTER, matching his
 * `<sc-if value="{{c.isCurrent}}">`. His data puts Chapter 2's figure on all
 * nineteen rows; rendering it everywhere would show nineteen identical 29%
 * bars, which is how that data looks if you trust it instead of his template.
 *
 * ⚠ THREE STATES, NEVER TWO. `done | current | locked` is derived in the
 * fixture from his three booleans and collapsed into one field, so a chapter
 * cannot be styled as both. The suite pins that exactly one state is set.
 */
export function CompassRefinedLearn({
  onSelectPage,
  stage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
  /** ⚠ `compass-readiness-stage`, THE SAME ONE THE OVERVIEW READS —
   *  2026-11-12, finding 4. Until now this page read none of it, so a
   *  reviewer flipping the demo bar through the sixteen learner states saw
   *  the Overview move and Your Course sit still, the two of them reporting
   *  different percentages for one learner. Passed down by the shell rather
   *  than read here, which is the shape every other prop on these pages
   *  has. */
  stage?: string
} = {}) {
  /* One reading of the stage, shared with the Overview — see
     `refinedProgressAt`. */
  const view = refinedCourseView(refinedProgressAt(journeyStage(stage ?? '').prog?.pct))
  const { chapters, header, resume: RESUME, finish } = view
  /* ⚠ RESUME OPENS THE LESSON — `CompassJeffCourse`, which is this same
     designer's lesson ported from his earlier file. See the shell's note on
     why there is one component for it rather than two. */
  const openLesson = () => onSelectPage?.('course')
  /* Chapter 2 is open on arrival because it is the current one — his
     `isOpen`. Seeded from the fixture rather than hard-coded, so the chapter
     that opens is the one his data says is current. */
  const [open, setOpen] = useState<Record<number, boolean>>({})
  /**
   * ⚠ THE LOCKED RUN IS FOLDED — 2026-11-12, finding 1 of the audit.
   *
   * Nineteen of twenty-one chapters are locked, and they occupied 1,364px of
   * a 2,495px page: 55% of a learner's scroll is things they cannot do, and
   * the page ends in them. What is open, what is next and what finishes the
   * course are the three things worth standing up; the middle of the course
   * is a reference list, and a reference list is something you ask for.
   *
   * ⚠ IT IS A PEEK, NOT A CUT. Two locked chapters stay visible past the
   * current one — a course has to show what is coming or the lock message
   * has nothing to be about — and the count on the control says exactly what
   * is behind it. Folding ALL of them would answer finding 1 by creating the
   * opposite complaint.
   *
   * ⚠ AND IT FIXES THE HALF OF FINDING 2 THAT A SENTENCE CREATES. Every
   * locked chapter now says what opens it; nineteen of those stacked are
   * nineteen near-identical lines. Three are information.
   */
  const [showAll, setShowAll] = useState(false)
  const lastOpenIdx = chapters.map((c) => c.state !== 'locked').lastIndexOf(true)
  const PEEK = 2
  const cutoff = lastOpenIdx + 1 + PEEK
  const folded = !showAll && cutoff < chapters.length
  const shown = folded ? chapters.slice(0, cutoff) : chapters
  const hiddenCount = chapters.length - shown.length
  const isOpen = (c: RefinedChapter) =>
    c.expandable && (open[c.n] ?? c.state === 'current')

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <CompassRefinedHead title={REFINED_PAGE_TITLES['learn']} />
        {/* ⚠ OUTSIDE THE HEADER — 2026-11-10. The header is the eyebrow and
            the title; a lead is page content and renders as page content. */}
        <p className="crf-lead">{COPY.lead}</p>

        {/* ---------- where you left off ---------- */}
        <section className="crf-resume" aria-label={COPY.resumeEyebrow}>
          <span className="crf-resume__thumb" aria-hidden>
            <span className="crf-resume__play">
              <ChevronRight size={14} />
            </span>
          </span>
          <div className="crf-resume__text">
            <p className="crf-eyebrow">{COPY.resumeEyebrow}</p>
            {/* ⚠ THE CHAPTER THE LEARNER IS IN, not a typed one — 2026-11-11. It read
                "Chapter 2 · Insurers and Insurance Markets", which is not a
                chapter of this course at all, and it kept saying "Resume
                lesson" after the page stopped having anything in progress. */}
            <p className="crf-resume__title">{RESUME.title}</p>
            {/* The lesson inside it, where the chapter's lessons are ported; the
                chapter's own name otherwise, rather than a lesson from
                somewhere else. */}
            {RESUME.lesson ? <p className="crf-resume__lesson">{RESUME.lesson}</p> : null}
            <span className="crf-bar" role="img" aria-label={chapters[2]?.progAria}>
              <span className="crf-bar__fill" style={{ width: `${header.pct}%` }} />
            </span>
          </div>
          <button type="button" className="crf-cta" onClick={openLesson}>
            {COPY.resumeCta}
            <ChevronRight size={13} aria-hidden />
          </button>
        </section>

        {/* ---------- the course ---------- */}
        <section className="crf-course" aria-label={COPY.courseTitle}>
          <header className="crf-course__head">
            <span className="crf-tile" aria-hidden>
              <GraduationCap size={16} />
            </span>
            <div className="crf-course__name">
              {/* ⚠ COUNTED, NOT TYPED — his read "19 chapters · 28 of 40 hours", a
                  chapter count that was wrong by two and an hours figure
                  nothing produces. */}
              <p className="crf-eyebrow">{header.eyebrow}</p>
              <h2 className="crf-h2">{COPY.courseTitle}</h2>
              <p className="crf-course__sub">{COPY.courseSub}</p>
            </div>
            <div className="crf-course__stat">
              <span className="crf-course__done">{header.status}</span>
              <span className="crf-course__of">
                {header.done} of {header.sections} sections
              </span>
            </div>
            <CourseRing header={header} />
          </header>

          {/* ⚠ THE REAL COURSE, NOT A SECOND LIST OF IT — 2026-11-11. These were
              nineteen chapters typed into his fixture while the Overview
              counted forty-one rows of `compassRefinedCourse.ts`; two
              hand-kept lists of one course is how "22 of 36 lessons" ended up
              on this page. See `compassRefinedLearnCourse.ts`. */}
          {shown.map((c) => {
            const expanded = isOpen(c)
            return (
              <article
                key={c.n}
                className={`crf-ch crf-ch--${c.state}${expanded ? ' is-open' : ''}`}
              >
                <div className="crf-ch__row">
                  <span className="crf-tile crf-tile--mark" aria-hidden>
                    <ChapterMark state={c.state} />
                  </span>
                  <div className="crf-ch__name">
                    <p className="crf-ch__eyebrow">{c.eyebrow}</p>
                    <p className="crf-ch__title">{c.title}</p>
                    {/* Only the current chapter — see the header note. */}
                    {c.state === 'current' ? (
                      <span className="crf-bar crf-bar--ch" role="img" aria-label={c.progAria}>
                        <span className="crf-bar__fill" style={{ width: c.progPct }} />
                      </span>
                    ) : null}
                  </div>
                  {/* ⚠ NO INLINE COLOUR — 2026-11-12, with finding 7. It set
                      `color: var(--cjm-green | --cjm-steel | --cjm-muted)`,
                      and NONE of those three variables is defined on a
                      Refined page: they are Jeff's, carried through the port
                      with his markup. Every value was invalid at computed
                      time, so all three states inherited the page's ink —
                      which is also what defeated the muted colour this label
                      is meant to have. The state is told by the mark and the
                      row's ground; the word beside the button is context, in
                      one colour. */}
                  {/* ⚠ THE SENTENCE, NOT THE WORD — 2026-11-12, finding 2.
                      A locked row said "Locked", which the padlock beside it
                      had already said, while the page's lead promises that "a
                      locked step tells you exactly what opens it". The exam
                      rows keep that promise in this very column; the chapters
                      now say the same kind of thing in the same place, and it
                      is visible without expanding the row — which is where
                      his message was, and so was never read by anyone who did
                      not already open it. */}
                  <span className={c.state === 'locked' ? 'crf-ch__status crf-ch__opens' : 'crf-ch__status'}>
                    {c.state === 'locked' ? c.lockMsg : c.status}
                  </span>
                  {c.hasAction ? (
                    <button
                      type="button"
                      className={c.state === 'current' ? 'crf-btn crf-btn--primary' : 'crf-btn'}
                      aria-label={c.actionLabel}
                      onClick={openLesson}
                    >
                      {c.action}
                    </button>
                  ) : (
                    <span className="crf-ch__noaction" />
                  )}
                  {/* ⚠ NO CHEVRON WHERE THERE IS NOTHING BEHIND IT — finding
                      8. The space is still held, so the twenty-one rows stay
                      in one column. */}
                  {c.expandable ? (
                    <button
                      type="button"
                      className="crf-chev"
                      aria-expanded={expanded}
                      aria-label={c.chevLabel}
                      onClick={() => setOpen((o) => ({ ...o, [c.n]: !expanded }))}
                    >
                      <ChevronDown
                        size={14}
                        aria-hidden
                        style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                      />
                    </button>
                  ) : (
                    <span className="crf-chev crf-chev--none" aria-hidden />
                  )}
                </div>

                {expanded ? (
                  <div className="crf-ch__body">
                    {/* ⚠ THE MESSAGE MOVED UP INTO THE ROW — 2026-11-12,
                        finding 2. It was repeated here; saying it twice in
                        one card is noise, and the row is the half a learner
                        sees without clicking. The lessons behind a locked
                        chapter still show, which is the page's lead made
                        good and the part worth keeping. */}
                    <ul className="crf-lessons">
                      {c.lessons.map((l) => (
                        <li key={l.label} className={`crf-lesson crf-lesson--${l.state}`}>
                          <span className="crf-lesson__mark" aria-hidden>
                            <LessonMark state={l.state} />
                          </span>
                          <span className="crf-lesson__label">{l.label}</span>
                          {l.state === 'done' ? (
                            <button type="button" className="crf-lesson__act">
                              Review
                            </button>
                          ) : l.state === 'current' ? (
                            <button type="button" className="crf-lesson__act">
                              Resume
                            </button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {/* ⚠ THE INTRODUCTION HAS NO EXAM, and that is the
                        course's shape rather than a gap — it runs straight
                        into Chapter 1. Every other chapter is followed by
                        one. */}
                    {c.exam ? (
                      <ExamRow
                        title={c.exam.title}
                        note={c.exam.note ?? ''}
                        locked={c.exam.locked ?? c.state === 'locked'}
                        done={c.exam.done ?? false}
                      />
                    ) : null}
                  </div>
                ) : null}
              </article>
            )
          })}

          {/* ⚠ THE COUNT IS THE POINT, not the word "more". A learner who
              cannot see the rest of the course has to be told how much of it
              there is — and the control says which way it goes, so it is not
              a one-way door. */}
          {folded ? (
            <button type="button" className="crf-ch__more" onClick={() => setShowAll(true)}>
              <ChevronDown size={13} aria-hidden />
              Show all {chapters.length} chapters
              <span className="crf-ch__more-n">{hiddenCount} more, locked</span>
            </button>
          ) : cutoff < chapters.length ? (
            <button type="button" className="crf-ch__more" onClick={() => setShowAll(false)}>
              <ChevronDown size={13} aria-hidden style={{ transform: 'rotate(180deg)' }} />
              Show less
            </button>
          ) : null}
        </section>

        {/* ---------- how the course ends ----------
            ⚠ THREE ROWS OF THE COURSE, NOT A TYPED CARD — 2026-11-12. This
            was his "Certification Exam" card: an exam the course list does
            not contain, noted "Opens after all 19 chapters" against
            twenty-one of them. The rows are
            `finish` — whatever the chapters above do not
            consume — so the page ends where the course does. */}
        <section
          className="crf-course"
          aria-label={`${FINISH.eyebrow}: ${FINISH.title}`}
        >
          <header className="crf-course__head">
            <span className="crf-tile" aria-hidden>
              <AwardMark />
            </span>
            <div className="crf-course__name">
              <p className="crf-eyebrow">{FINISH.eyebrow}</p>
              <h2 className="crf-h2">{FINISH.title}</h2>
            </div>
            <span className="crf-ch__status">
              {finish.every((f) => f.state === 'locked') ? COPY.lockedWord : ''}
            </span>
          </header>
          {finish.map((f) => (
            <FinishRow key={f.n} step={f} />
          ))}
        </section>
      </CompassRefinedColumn>
    </div>
  )
}

/**
 * The exam strip, used by a chapter and by the certification card.
 *
 * ⚠ A LOCKED EXAM IS A DISABLED BUTTON WITH A PADLOCK, not a missing one. His
 * markup carries `disabled aria-disabled="true"` and the lock glyph: the
 * control is visible so the learner knows the exam exists, and inert so they
 * cannot take it. Hiding it would lose the "what opens it" half of the page.
 */
function ExamRow({
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
function FinishMark({ kind }: { kind: RefinedFinishStep['kind'] }) {
  if (kind === 'survey') return <ClipboardList size={15} />
  if (kind === 'certificate') return <FileCertificateRegular size={15} />
  return <BallotCheckRegular size={15} />
}

function FinishRow({ step }: { step: RefinedFinishStep }) {
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
function ChapterMark({ state }: { state: string }) {
  if (state === 'done') return <Check size={15} />
  if (state === 'current') return <ChevronRight size={15} />
  return <LockRegular size={14} />
}

/** The lesson marks: a tick, a filled dot for where you are, a padlock. */
function LessonMark({ state }: { state: string }) {
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
function AwardMark() {
  return <Award size={16} />
}

/**
 * The course ring: viewBox 120, drawn at 72px, r=50 stroke 12, rotated so it
 * starts at twelve o'clock.
 *
 * ⚠ THE DASHARRAY IS HIS, AND IT DISAGREES WITH HIS OWN LABEL by about four
 * points — see the fixture note. Carried verbatim on purpose.
 */
function CourseRing({ header }: { header: RefinedCourseView['header'] }) {
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
          aria-label={`Qualifying Education ${header.pct}% complete, ${header.done} of ${header.sections} sections`}
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
