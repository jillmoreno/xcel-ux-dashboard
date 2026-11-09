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
import { JEFF_MVP_LEARN as LEARN, JEFF_MVP_LEARN_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

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
export function CompassJeffMvpLearn() {
  /* Chapter 2 is open on arrival because it is the current one — his
     `isOpen`. Seeded from the fixture rather than hard-coded, so the chapter
     that opens is the one his data says is current. */
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isOpen = (c: (typeof LEARN.chapters)[number]) => open[c.n] ?? c.state === 'current'

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        <CompassJeffMvpHead title={COPY.title} lead={COPY.lead} />

        {/* ---------- where you left off ---------- */}
        <section className="cjm-resume" aria-label={COPY.resumeEyebrow}>
          <span className="cjm-resume__thumb" aria-hidden>
            <span className="cjm-resume__play">
              <ChevronRight size={14} />
            </span>
          </span>
          <div className="cjm-resume__text">
            <p className="cjm-eyebrow">{COPY.resumeEyebrow}</p>
            <p className="cjm-resume__title">{COPY.resumeTitle}</p>
            <p className="cjm-resume__lesson">{COPY.resumeLesson}</p>
            <span className="cjm-bar" role="img" aria-label={LEARN.chapters[1].progAria}>
              <span className="cjm-bar__fill" style={{ width: COPY.resumePct }} />
            </span>
          </div>
          <button type="button" className="cjm-cta">
            {COPY.resumeCta}
            <ChevronRight size={13} aria-hidden />
          </button>
        </section>

        {/* ---------- the course ---------- */}
        <section className="cjm-course" aria-label={COPY.courseTitle}>
          <header className="cjm-course__head">
            <span className="cjm-tile" aria-hidden>
              <GraduationCap size={16} />
            </span>
            <div className="cjm-course__name">
              <p className="cjm-eyebrow">{COPY.courseEyebrow}</p>
              <h2 className="cjm-h2 cjm-serif">{COPY.courseTitle}</h2>
              <p className="cjm-course__sub">{COPY.courseSub}</p>
            </div>
            <div className="cjm-course__stat">
              <span className="cjm-course__done">{COPY.courseStatus}</span>
              <span className="cjm-course__of">{COPY.courseLessons}</span>
            </div>
            <CourseRing />
          </header>

          {LEARN.chapters.map((c) => {
            const expanded = isOpen(c)
            return (
              <article
                key={c.n}
                className={`cjm-ch cjm-ch--${c.state}${expanded ? ' is-open' : ''}`}
              >
                <div className="cjm-ch__row">
                  <span className="cjm-tile cjm-tile--mark" aria-hidden>
                    <ChapterMark state={c.state} />
                  </span>
                  <div className="cjm-ch__name">
                    <p className="cjm-ch__eyebrow">{c.eyebrow}</p>
                    <p className="cjm-ch__title">{c.title}</p>
                    {/* Only the current chapter — see the header note. */}
                    {c.state === 'current' ? (
                      <span className="cjm-bar cjm-bar--ch" role="img" aria-label={c.progAria}>
                        <span className="cjm-bar__fill" style={{ width: c.progPct }} />
                      </span>
                    ) : null}
                  </div>
                  <span className="cjm-ch__status" style={{ color: `var(--cjm-${c.statusTone})` }}>
                    {/* His `status` is '' on a locked chapter; the word is the
                        template's, keyed off the state. */}
                    {c.state === 'locked' ? COPY.lockedWord : c.status}
                  </span>
                  {c.hasAction ? (
                    <button
                      type="button"
                      className={c.state === 'current' ? 'cjm-btn cjm-btn--primary' : 'cjm-btn'}
                      aria-label={c.actionLabel}
                    >
                      {c.action}
                    </button>
                  ) : (
                    <span className="cjm-ch__noaction" />
                  )}
                  <button
                    type="button"
                    className="cjm-chev"
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
                  <div className="cjm-ch__body">
                    {/* ⚠ BOTH, ON A LOCKED CHAPTER: the message AND the lessons.
                        See the header note — this is the page's lead made
                        good, not a leak. */}
                    {c.state === 'locked' ? <p className="cjm-ch__lock">{c.lockMsg}</p> : null}
                    <ul className="cjm-lessons">
                      {c.lessons.map((l) => (
                        <li key={l.label} className={`cjm-lesson cjm-lesson--${l.state}`}>
                          <span className="cjm-lesson__mark" aria-hidden>
                            <LessonMark state={l.state} />
                          </span>
                          <span className="cjm-lesson__label">{l.label}</span>
                          {l.state === 'done' ? (
                            <button type="button" className="cjm-lesson__act">
                              Review
                            </button>
                          ) : l.state === 'current' ? (
                            <button type="button" className="cjm-lesson__act">
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
        <section className="cjm-course" aria-label={`${COPY.finalEyebrow}: ${COPY.finalTitle}`}>
          <header className="cjm-course__head">
            <span className="cjm-tile" aria-hidden>
              <AwardMark />
            </span>
            <div className="cjm-course__name">
              <p className="cjm-eyebrow">{COPY.finalEyebrow}</p>
              <h2 className="cjm-h2 cjm-serif">{COPY.finalTitle}</h2>
            </div>
            <span className="cjm-ch__status">{COPY.finalStatus}</span>
          </header>
          <ExamRow title={COPY.finalExamTitle} note={COPY.finalNote} locked done={false} />
        </section>
      </CompassJeffMvpColumn>
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
    <div className={done ? 'cjm-exam cjm-exam--done' : 'cjm-exam'}>
      <span className="cjm-tile cjm-tile--exam" aria-hidden>
        <FileText size={15} />
      </span>
      <div className="cjm-exam__name">
        <p className="cjm-exam__eyebrow">{COPY.examEyebrow}</p>
        <p className="cjm-exam__title">{title}</p>
      </div>
      <span className="cjm-exam__note">{note}</span>
      {locked ? (
        <button type="button" className="cjm-btn cjm-btn--locked" disabled aria-disabled>
          <LockRegular size={13} aria-hidden />
          {COPY.examCta}
        </button>
      ) : (
        <button type="button" className="cjm-btn">
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
    <div className="cjm-course__ring">
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
        <span className="cjm-course__pct cjm-serif" aria-hidden>
          {COPY.coursePct}
        </span>
      </div>
    </div>
  )
}
