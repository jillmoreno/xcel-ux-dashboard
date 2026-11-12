/**
 * THE AUDITED CHAPTER LIST — one bordered card, a row per chapter.
 *
 * ⚠ THIS IS THE PAGE AS THE AUDIT LEFT IT, moved out of
 * `CompassRefinedLearn.tsx` unchanged on 2026-11-12 when `compass-course-rows`
 * gave Your Course a second layout. Findings 1, 2, 3, 6, 7 and 8 were measured
 * against this markup and fixed on it, which is why it is the flag's default
 * and why nothing here was tidied in the move.
 *
 * ⚠ A LOCKED CHAPTER OPENS. That is the page's lead made good — "a locked step
 * tells you exactly what opens it" — and it is the detail most likely to be
 * lost in a port, because every instinct says a locked row should not expand.
 */

import { ChevronDown, GraduationCap } from '@/icons'
import { REFINED_CHAPTER_BLURBS, REFINED_COURSE } from '@/data/compassRefinedCopy'
import { ChapterMark, CourseRing, ExamRow, LessonMark } from './CompassRefinedCourseParts'
import type { CourseListProps } from './compassRefinedCourseModel'

export function CompassRefinedCourseRows({
  header,
  chapters,
  shown,
  folded,
  hiddenCount,
  cutoff,
  setShowAll,
  isOpen,
  toggle,
  openLesson,
  blurb,
}: CourseListProps) {
  return (
    <section className="crf-course" aria-label={REFINED_COURSE.name}>
        <header className="crf-course__head">
          <span className="crf-tile" aria-hidden>
            <GraduationCap size={16} />
          </span>
          <div className="crf-course__name">
            {/* ⚠ COUNTED, NOT TYPED — his read "19 chapters · 28 of 40 hours", a
                chapter count that was wrong by two and an hours figure
                nothing produces. */}
            <p className="crf-eyebrow">{header.eyebrow}</p>
            {/* ⚠ THE COURSE'S NAME LEADS — 2026-11-12: "This should be the
                course name in the Playfair font style. Below in smaller text
                should be Qualifying Education - Florida." The card led with
                "Qualifying Education", which is the regulatory CATEGORY and
                is true of every XCEL course; the one this platform is about
                was the smaller line under it. */}
            <h2 className="crf-h2">{REFINED_COURSE.name}</h2>
            <p className="crf-course__sub">{REFINED_COURSE.kind}</p>
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
                  {/* ⚠ INVENTED, AND OFF BY DEFAULT — see
                      `REFINED_CHAPTER_BLURBS`. */}
                  {blurb && REFINED_CHAPTER_BLURBS[c.title] ? (
                    <p className="crf-ch__blurb">{REFINED_CHAPTER_BLURBS[c.title]}</p>
                  ) : null}
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
                    onClick={() => toggle(c.n, expanded)}
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
  )
}
