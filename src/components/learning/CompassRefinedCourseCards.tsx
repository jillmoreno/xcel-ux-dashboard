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

import { useState } from 'react'
import { BookOpenRegular, Check, ChevronDown, LockRegular } from '@/icons'
import { PillTabs } from '@/components/ui/PillTabs'
import { JEFF_MVP_LEARN_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import { REFINED_CHAPTER_BLURBS, REFINED_ROADMAP } from '@/data/compassRefinedCopy'
import { ExamRow, LessonMark } from './CompassRefinedCourseParts'
import type { CourseListProps, RoadmapFilter } from './compassRefinedCourseModel'
import type { RefinedChapter } from './compassRefinedLearnCourse'

/** ⚠ HER WORDS — "All Modules, In Progress, Completed". The noun is a third
 *  one on this page (lesson, chapter, module); it is hers, it is what the
 *  reference says, and the rows it filters are the same rows either way. */
const ROADMAP_FILTERS: { id: RoadmapFilter; label: string }[] = [
  { id: 'all', label: 'All Modules' },
  { id: 'current', label: 'In Progress' },
  { id: 'done', label: 'Completed' },
]

/** Which chapter state each arm keeps. `all` keeps the folded view. */
const FILTER_STATE: Record<Exclude<RoadmapFilter, 'all'>, string> = {
  current: 'current',
  done: 'done',
}

/**
 * The pill over the title. The word follows the state, as everywhere else on
 * this page — a chapter cannot be styled as two things at once.
 *
 * ⚠ FOUR WORDS, NOT THREE — 2026-11-12: "we should have Up Next for courses
 * that are ready to start, and we should have in progress for courses that
 * have progress." The open chapter is two different things to a learner and
 * had been one: "Ready to begin" was removed from it earlier the same day
 * precisely because it said nothing the Resume button did not. These two say
 * something the button cannot — whether there is anything to come back to.
 *
 * ⚠ IT IS THE SAME FACT THE CARD ABOVE READS. "Up Next" pairs with the
 * next-step card's "Your next step · Start lesson" and "In Progress" with
 * "Where you left off · Resume lesson"; both come off `intoCurrent`, so the
 * badge and the card at the top of the page cannot tell different stories.
 */
function statusPill(c: RefinedChapter) {
  if (c.state === 'done') return { word: 'Completed', tone: 'done' }
  if (c.state === 'current') {
    return c.started
      ? { word: 'In Progress', tone: 'progress' }
      : { word: 'Up Next', tone: 'next' }
  }
  return { word: COPY.lockedWord, tone: 'locked' }
}

/**
 * WHAT IS INSIDE THE CHAPTER — 2026-11-12: "Chapter 1 - 7 Lessons - 1
 * Chapter Quiz".
 *
 * ⚠ THIS IS NOT FINDING 3 COMING BACK. That finding removed a lesson count
 * from the row's eyebrow because the page was COUNTING THE COURSE in two
 * units at once — "7 lessons" beside a header reading "8 of 44 sections".
 * This line counts what is in one chapter, which is the chapter's own shape
 * rather than a second measure of the whole.
 *
 * ⚠ IT SAYS ONLY WHAT IT KNOWS. The lesson count comes from Jeff's outline,
 * which covers ten of the twenty-one chapters by name; the rest have no
 * lesson-level detail and say nothing rather than "0 Lessons". The quiz is
 * the chapter's own exam row, which the course gives every chapter but the
 * Introduction.
 *
 * ⚠ "Chapter Quiz", HER WORD. The course calls the row "Chapter 1 Exam" and
 * the exam strip below says EXAM; this line is hers verbatim.
 */
function chapterParts(c: RefinedChapter): string {
  return [
    c.label,
    c.lessons.length ? `${c.lessons.length} Lessons` : '',
    c.exam ? '1 Chapter Quiz' : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

/**
 * The mark on a row the course does not number — the Course Introduction and
 * the Florida laws chapter.
 *
 * ⚠ IT FOLLOWS THE STATE, NOT THE KIND — 2026-11-12: "since completed, the
 * book icon should be the checkmark". It had been the open book on all three
 * states, which said what the row IS next to a word already saying where the
 * learner stands on it. The numbered rows show their number here; these show
 * the only thing they have.
 */
function StateMark({ state }: { state: string }) {
  if (state === 'done') return <Check size={12} />
  if (state === 'locked') return <LockRegular size={11} />
  return <BookOpenRegular size={12} />
}

export function CompassRefinedCourseCards({
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
  /**
   * ⚠ THE FILTER OVERRIDES THE FOLD, and that is the only way the two can
   * both be true. The fold answers "the middle of this course is a wall"; a
   * filter is a learner asking for a specific subset, and handing back three
   * of eleven completed chapters behind a "Show all" control would be
   * answering a question they did not ask. All modules is the folded view.
   */
  const [filter, setFilter] = useState<RoadmapFilter>('all')
  const listed =
    filter === 'all' ? shown : chapters.filter((c) => c.state === FILTER_STATE[filter])

  return (
    <>
      {/* ⚠ THE COURSE HEADER IS THE PAGE'S NOW — 2026-11-12. It moved up
          into `CourseHeadCard`, joined to the next-step card, so both chapter
          layouts draw only the chapters. */}

      {/* ⚠ THE LIST'S OWN HEADER — 2026-11-12: "add this subtitle and quick
          filters (pill styles) All Modules, In Progress, Completed".

          ⚠ THE TOTAL SITS BESIDE THE STRIP AND THE PILLS CARRY NO COUNTS,
          which is the repo's rule for every segmented status filter and
          happens to be exactly what her reference draws. `PillTabs` is that
          shared strip — the one My Courses, Certificates and the Study
          Calendar use — rather than three buttons styled to look like it. */}
      <div className="crf-map__head">
        <h3 className="crf-map__heading">{REFINED_ROADMAP.title}</h3>
        <span className="crf-map__total">
          {chapters.length} {REFINED_ROADMAP.total}
        </span>
        <div className="crf-map__filters">
          <PillTabs
            items={ROADMAP_FILTERS}
            active={filter}
            onChange={setFilter}
            label={REFINED_ROADMAP.title}
            size="compact"
          />
        </div>
      </div>

      <div className="crf-map">
        {listed.map((c) => {
          const expanded = isOpen(c)
          const pill = statusPill(c)
          return (
            <article
              key={c.n}
              className={`crf-map__card crf-map__card--${c.state}${
                c.expandable ? ' is-clickable' : ''
              }`}
              /* ⚠ THE CARD TOGGLES, THE BUTTON IS STILL THE CONTROL —
                 2026-11-12: "clicking will be the same as expanding the
                 details". The handler sits on the `article`, which is not
                 focusable and takes no role: the CHEVRON is the real control
                 and carries `aria-expanded`, so a keyboard or screen-reader
                 user has one way in and sees one state. Making the card
                 itself a button would nest the action and the chevron inside
                 another button — invalid markup, and three tab stops doing
                 two things.

                 ⚠ A CLICK THAT LANDS ON A BUTTON IS THAT BUTTON'S. Without
                 the guard, Review would open the chapter AND expand the card
                 under it, and the chevron would toggle twice and land back
                 where it started. */
              onClick={
                c.expandable
                  ? (e) => {
                      if ((e.target as HTMLElement).closest('button')) return
                      toggle(c.n, expanded)
                    }
                  : undefined
              }
            >
              <div className="crf-map__body">
                {/* ⚠ THE NUMBER AND THE WORD ARE ONE TAG — 2026-11-12: "made
                    these a connected component with a little dot inbetween."
                    They were a 30px chip and a separate pill a column apart,
                    saying two halves of one fact: which stop this is, and
                    where the learner stands on it.

                    ⚠ THE MARK IS THE NUMBER WHERE THERE IS ONE. The Course
                    Introduction and the Florida laws row carry no chapter
                    number in the course list — her call, "Position, Intro
                    gets a mark" — so they show the state's own glyph
                    instead, and "since completed, the book icon should be
                    the checkmark". */}
                <div className="crf-map__main">
                  <div className="crf-map__top">
                    <span className={`crf-map__state crf-map__state--${pill.tone}`}>
                      <span className="crf-map__mark" aria-hidden>
                        {c.number ? (
                          String(c.number).padStart(2, '0')
                        ) : (
                          <StateMark state={c.state} />
                        )}
                      </span>
                      {/* The drawn circle this page separates two phrases
                          with, at the size the next-step meta line uses. */}
                      <span aria-hidden className="crf-map__dot" />
                      {/* ⚠ JUST THE WORD — "the tag should just be the
                          word". The tick it carried has moved to the mark on
                          the left, where it is the row's own stop rather
                          than a second ornament on the state. */}
                      {pill.word}
                    </span>

                    {/* ⚠ THE NAME MOVES UP BESIDE THE TAG — 2026-11-12:
                        "Shift these to the right of the status tag so the
                        module vertical height is reduced". The title and its
                        label had been two rows under the top row; a card was
                        three bands tall to say one chapter's name and state.
                        They are one row now, and the card is shorter by the
                        height of both. */}
                    <div className="crf-map__name">
                      <p className="crf-map__title">{c.title}</p>
                      {/* ⚠ RENDERED ON ANYTHING IT CAN SAY, not only on a
                          chapter label. The Florida laws row has no number
                          in the course list and does have an exam, so
                          gating on the label alone dropped its "1 Chapter
                          Quiz" — the one card in twenty-one where the two
                          conditions differ. */}
                      {chapterParts(c) ? (
                        <p className="crf-map__label">{chapterParts(c)}</p>
                      ) : null}
                    </div>
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
                    {/* ⚠ THE ROWS LAYOUT'S CHEVRON, NOT A "DETAILS" LINK —
                        2026-11-12: "instead of 'details' link, use the same
                        chevron logic used in the other variant to show the
                        module being expanded and collapsed". Same class,
                        same rotation, same `aria-expanded`, beside the
                        action where that layout puts it. The word was doing
                        no work a rotating chevron does not: the card itself
                        has been clickable since the hour before.

                        ⚠ THE SPACE IS HELD WHEN THERE IS NOTHING TO OPEN, so
                        the actions line up down the column — finding 8 on
                        this layout, exactly as the rows layout keeps it. */}
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

        {filter !== 'all' ? null : folded ? (
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
