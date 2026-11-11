import { useState } from 'react'
import {
  Award,
  Check,
  ChevronDown,
  ChevronRight,
  CircleSolid,
  FileText,
  GraduationCap,
  LockRegular,
  RubiLogo,
} from '@/icons'
import {
  JEFF_MVP_LEARN as LEARN,
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
}: {
  onSelectPage?: (p: JeffMvpPage) => void
} = {}) {
  /* ⚠ RESUME OPENS THE LESSON — `CompassJeffCourse`, which is this same
     designer's lesson ported from his earlier file. See the shell's note on
     why there is one component for it rather than two. */
  const openLesson = () => onSelectPage?.('course')
  /* Chapter 2 is open on arrival because it is the current one — his
     `isOpen`. Seeded from the fixture rather than hard-coded, so the chapter
     that opens is the one his data says is current. */
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isOpen = (c: (typeof LEARN.chapters)[number]) => open[c.n] ?? c.state === 'current'

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <CompassRefinedHead title={COPY.title} />
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
            <p className="crf-resume__title">{COPY.resumeTitle}</p>
            <p className="crf-resume__lesson">{COPY.resumeLesson}</p>
            <span className="crf-bar" role="img" aria-label={LEARN.chapters[1].progAria}>
              <span className="crf-bar__fill" style={{ width: COPY.resumePct }} />
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
              <p className="crf-eyebrow">{COPY.courseEyebrow}</p>
              <h2 className="crf-h2">{COPY.courseTitle}</h2>
              <p className="crf-course__sub">{COPY.courseSub}</p>
            </div>
            <div className="crf-course__stat">
              <span className="crf-course__done">{COPY.courseStatus}</span>
              <span className="crf-course__of">{COPY.courseLessons}</span>
            </div>
            <CourseRing />
          </header>

          {LEARN.chapters.map((c) => {
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
                  <span className="crf-ch__status" style={{ color: `var(--cjm-${c.statusTone})` }}>
                    {/* His `status` is '' on a locked chapter; the word is the
                        template's, keyed off the state. */}
                    {c.state === 'locked' ? COPY.lockedWord : c.status}
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
                </div>

                {expanded ? (
                  <div className="crf-ch__body">
                    {/* ⚠ BOTH, ON A LOCKED CHAPTER: the message AND the lessons.
                        See the header note — this is the page's lead made
                        good, not a leak. */}
                    {c.state === 'locked' ? <p className="crf-ch__lock">{c.lockMsg}</p> : null}
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
                    <ExamRow
                      title={c.exam.title}
                      note={c.exam.note}
                      locked={c.exam.locked}
                      done={c.exam.done}
                    />
                  </div>
                ) : null}
              </article>
            )
          })}
        </section>

        {/* ---------- the certification exam ---------- */}
        <section className="crf-course" aria-label={`${COPY.finalEyebrow}: ${COPY.finalTitle}`}>
          <header className="crf-course__head">
            <span className="crf-tile" aria-hidden>
              <AwardMark />
            </span>
            <div className="crf-course__name">
              <p className="crf-eyebrow">{COPY.finalEyebrow}</p>
              <h2 className="crf-h2">{COPY.finalTitle}</h2>
            </div>
            <span className="crf-ch__status">{COPY.finalStatus}</span>
          </header>
          <ExamRow title={COPY.finalExamTitle} note={COPY.finalNote} locked done={false} />
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
function CourseRing() {
  return (
    <div className="crf-course__ring">
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <svg viewBox="0 0 120 120" width="72" height="72" role="img" aria-label={COPY.courseRingAria}>
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--cjm-ring-pale)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--cjm-steel)"
              strokeWidth="12"
              strokeDasharray={COPY.courseRingDash}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className="crf-course__pct" aria-hidden>
          {COPY.coursePct}
        </span>
      </div>
    </div>
  )
}
