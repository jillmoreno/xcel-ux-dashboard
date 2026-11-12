/**
 * THE ROADMAP — a card per chapter, 2026-11-12.
 *
 * Jillienne, with a reference screenshot: "ON Your Course, lets add a variant
 * that shows this type of styling. CTA should be in the top right. Bottom
 * Right can be a details link with chevron that expands and shows the other
 * parts of the course."
 *
 * ⚠ IT IS THE SAME COURSE, DRAWN DIFFERENTLY. Every figure, state and
 * sentence comes from `refinedCourseView` exactly as the rows layout's does —
 * the fork rule's second half, "fork the layout, import the data". If the two
 * arms duplicated the course the comparison would stop being about the
 * layout.
 *
 * ⚠ THREE THINGS THE REFERENCE HAS THAT THIS COURSE DOES NOT:
 *   • a description per module — invented, behind `compass-course-blurb`,
 *     off by default (see `REFINED_CHAPTER_BLURBS`)
 *   • "8 Lessons · Est. 3h 15m" — the course list carries no durations at
 *     all, and counting lessons beside a header that counts sections is
 *     audit finding 3. The slot it occupied is where the CTA goes instead,
 *     which is what she asked for.
 *   • a module number — the Course Introduction is not a chapter and takes a
 *     mark rather than an 01 (her call: "Position, Intro gets a mark").
 */

import { ChevronDown, LockRegular } from '@/icons'
import { JEFF_MVP_LEARN_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import { REFINED_CHAPTER_BLURBS, REFINED_COURSE } from '@/data/compassRefinedCopy'
import { ChapterMark, CourseRing, ExamRow, LessonMark } from './CompassRefinedCourseParts'
import { GraduationCap } from '@/icons'
import type { CourseListProps } from './compassRefinedCourseModel'
import type { RefinedChapter } from './compassRefinedLearnCourse'

/** The pill over the title. The word follows the state, as everywhere else on
 *  this page — a chapter cannot be styled as two things at once. */
function statusPill(c: RefinedChapter) {
  if (c.state === 'done') return { word: 'Completed', tone: 'done' }
  if (c.state === 'current') return { word: 'Ready to begin', tone: 'open' }
  return { word: COPY.lockedWord, tone: 'locked' }
}

export function CompassRefinedCourseCards({
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
    <>
      {/* ⚠ THE HEADER CARD IS THE ROWS LAYOUT'S, UNCHANGED. The ring, the
          counts and the course's name are the page's summary, not a property
          of how the chapters below are drawn — forking it would make the two
          arms differ in two things at once. */}
      <section className="crf-course crf-course--head" aria-label={REFINED_COURSE.name}>
        <header className="crf-course__head">
          <span className="crf-tile" aria-hidden>
            <GraduationCap size={16} />
          </span>
          <div className="crf-course__name">
            <p className="crf-eyebrow">{header.eyebrow}</p>
            {/* ⚠ THE COURSE'S NAME LEADS — see the rows layout's note. */}
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
      </section>

      <div className="crf-map">
        {shown.map((c) => {
          const expanded = isOpen(c)
          const pill = statusPill(c)
          return (
            <article key={c.n} className={`crf-map__card crf-map__card--${c.state}`}>
              <div className="crf-map__body">
                {/* ⚠ THE NUMBER IS THE COURSE'S, NOT THE ROW'S POSITION —
                    her call, "Position, Intro gets a mark". The Course
                    Introduction and the Florida laws row carry no chapter
                    number in the course list, so they take the same mark the
                    rows layout gives them and the two arms agree about what
                    those rows are. Numbering by index put "00" beside the
                    Introduction and shifted every chapter by one. */}
                <span className={`crf-map__chip crf-map__chip--${c.state}`} aria-hidden>
                  {c.number ? String(c.number).padStart(2, '0') : <ChapterMark state={c.state} />}
                </span>

                <div className="crf-map__main">
                  <div className="crf-map__top">
                    <span className={`crf-map__pill crf-map__pill--${pill.tone}`}>
                      {c.state === 'locked' ? <LockRegular size={11} aria-hidden /> : null}
                      {pill.word}
                    </span>
                    {/* ⚠ THE ACTION, TOP RIGHT — her instruction. In the
                        reference this corner carries "8 Lessons · Est. 3h
                        15m"; this course has neither figure, and the one it
                        could show (lessons) is the second unit finding 3
                        removed. */}
                    {c.hasAction ? (
                      <button
                        type="button"
                        className={
                          c.state === 'current' ? 'crf-btn crf-btn--primary' : 'crf-btn'
                        }
                        aria-label={c.actionLabel}
                        onClick={openLesson}
                      >
                        {c.action}
                      </button>
                    ) : null}
                  </div>

                  <p className="crf-map__title">{c.title}</p>
                  {c.label ? <p className="crf-map__label">{c.label}</p> : null}
                  {blurb && REFINED_CHAPTER_BLURBS[c.title] ? (
                    <p className="crf-map__blurb">{REFINED_CHAPTER_BLURBS[c.title]}</p>
                  ) : null}

                  {/* ⚠ NO "OPENS WHEN …" LINE ON A CARD — 2026-11-12:
                      "remove this line from all the sections". It sat bottom
                      left, where the reference puts "Unlocks upon completing
                      Module 01 Assessment", and it is audit finding 2's
                      sentence — so this is a deliberate reversal on THIS
                      layout, not an oversight: on a card the padlock and the
                      Locked pill already say the state, and twenty-one cards
                      each ending in a near-identical sentence is the wall
                      finding 1 was about, in prose.

                      ⚠ THE ROWS LAYOUT KEEPS IT. That is where finding 2 was
                      raised and fixed, and the row has no pill — "Locked" on
                      its own was the thing the finding objected to. */}
                  <div className="crf-map__foot">
                    {/* ⚠ THE DETAILS LINK, BOTTOM RIGHT — her instruction, and
                        it is the rows layout's chevron wearing a word. A
                        chapter with no lessons and no exam has nothing behind
                        it and shows no link; finding 8, kept across the
                        fork. */}
                    {c.expandable ? (
                      <button
                        type="button"
                        className="crf-map__details"
                        aria-expanded={expanded}
                        aria-label={c.chevLabel}
                        onClick={() => toggle(c.n, expanded)}
                      >
                        Details
                        <ChevronDown
                          size={12}
                          aria-hidden
                          style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {expanded ? (
                <div className="crf-map__open">
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

        {folded ? (
          <button type="button" className="crf-map__more" onClick={() => setShowAll(true)}>
            <ChevronDown size={13} aria-hidden />
            Show all {chapters.length} chapters
            <span className="crf-ch__more-n">{hiddenCount} more, locked</span>
          </button>
        ) : cutoff < chapters.length ? (
          <button type="button" className="crf-map__more" onClick={() => setShowAll(false)}>
            <ChevronDown size={13} aria-hidden style={{ transform: 'rotate(180deg)' }} />
            Show less
          </button>
        ) : null}
      </div>
    </>
  )
}
