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
  fold,
  hiddenCount,
  cutoff,
  setShowAll,
  isOpen,
  toggle,
  openLesson,
  blurb,
  chapterMark,
}: CourseListProps) {
  /**
   * ⚠ THE FILTER OVERRIDES THE FOLD, and that is the only way the two can
   * both be true. The fold answers "the middle of this course is a wall"; a
   * filter is a learner asking for a specific subset, and handing back three
   * of eleven completed chapters behind a "Show all" control would be
   * answering a question they did not ask. All modules is the folded view.
   */
  const [filter, setFilter] = useState<RoadmapFilter>('all')
  /**
   * ⚠ THE COMPLETED RUN FOLDS AT THE TOP — 2026-11-13: "i want to do
   * something similar at the top of the roadmap when modules are completed,
   * to just show 1 bar that has the number of completed modules so that they
   * can expand when they want, otherwise user will have to keep scrolling
   * down to see everything."
   *
   * It is the locked run's fold turned round. That one answered "the middle
   * of this course is a wall"; this answers the same complaint from the
   * other end, which only appears once a learner is some way in — at 50% the
   * page opened on eleven finished chapters before the one they are on.
   *
   * ⚠ ONLY ON "All Modules". Collapsing the completed run under the
   * Completed filter would hide exactly what was asked for.
   *
   * ⚠ AND ONLY WHEN IT SAVES SOMETHING. A bar reading "1 completed module"
   * in place of one card is a swap, not a fold.
   */
  const [showDone, setShowDone] = useState(false)
  const DONE_FOLD_MIN = 2
  const base = filter === 'all' ? shown : chapters.filter((c) => c.state === FILTER_STATE[filter])
  /* The leading run only — a chapter finished out of order further down the
     list is not part of "what I have already been through". */
  const doneRun = filter === 'all' ? base.findIndex((c) => c.state !== 'done') : -1
  const doneCount = doneRun === -1 ? 0 : doneRun
  const doneFolded = fold && !showDone && doneCount >= DONE_FOLD_MIN
  const listed = doneFolded ? base.slice(doneCount) : base

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
        {/* ⚠ STANDALONE PILLS, NOT THE SEGMENTED STRIP — 2026-11-13: "update
            filters to be pills." `PillTabs` is the app's SEGMENTED filter —
            tabs edge to edge on one rounded container — and its own note
            draws the distinction: "the standalone chip rows are deliberately
            NOT this shape … individually-outlined pills at ~25px tall, where
            a 16px radius reads as a mistake. They stay `--radius-pill`."
            This is that second pattern, which is what her reference shows.

            ⚠ STILL `role="tablist"`, and still no counts on the pills. They
            are one choice among three over one list, which is what a tablist
            is, and the total stays beside the strip — the repo's rule for
            every status filter. */}
        <div className="crf-map__filters" role="tablist" aria-label={REFINED_ROADMAP.title}>
          {ROADMAP_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`crf-map__filter${filter === f.id ? ' is-on' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ⚠ THE ARM IS ON THE LIST, because the spine is drawn per card and
          has to follow the mark's centre — see `.crf-map__card::after`. */}
      <div className={`crf-map${chapterMark === 'icon' ? ' crf-map--icon' : ''}`}>
        {/* ⚠ THE SAME BAR AS THE ONE AT THE FOOT, pointing the other way —
            the count is the point, and the control says which way it goes so
            it is not a one-way door. */}
        {fold && doneCount >= DONE_FOLD_MIN ? (
          <button
            type="button"
            className="crf-map__more crf-map__more--done"
            aria-expanded={showDone}
            onClick={() => setShowDone(!showDone)}
          >
            <ChevronDown
              size={13}
              aria-hidden
              style={{ transform: showDone ? 'rotate(180deg)' : undefined }}
            />
            {showDone ? 'Hide' : 'Show'} completed{' '}
            {doneCount === 1 ? 'module' : 'modules'}
            {/* ⚠ THE COUNT AS THE CARDS' OWN TAG — 2026-11-13: "have there
                be a tag indicating the completed modules in the right side".
                It had been a number inside the sentence. On the right it
                mirrors the bar at the other end of the list, which carries
                its count there too, and it is drawn as the tag those eleven
                cards wear — same green, same shape, mark then dot then word
                — so the bar reads as the pile it is standing in for. */}
            <span className="crf-map__state crf-map__state--done crf-map__more-tag">
              <span className="crf-map__mark" aria-hidden>
                {doneCount}
              </span>
              <span aria-hidden className="crf-map__dot" />
              Completed
            </span>
          </button>
        ) : null}

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
                    <span
                      className={`crf-map__state crf-map__state--${pill.tone}${
                        chapterMark === 'icon' ? ' crf-map__state--markonly' : ''
                      }`}
                    >
                      {/* ⚠ THE NUMBER OR THE STATE — `compass-course-mark`.
                          On `number` the chips run 01–19 across twenty-one
                          modules, because the Introduction and the Florida
                          laws row carry none in the course list; `icon`
                          drops the digits so every row marks the same kind
                          of thing. The arm is which fact this carries. */}
                      <span className="crf-map__mark" aria-hidden>
                        {chapterMark === 'number' && c.number ? (
                          String(c.number).padStart(2, '0')
                        ) : (
                          <StateMark state={c.state} />
                        )}
                      </span>
                      {/* ⚠ THE WORD TRAVELS ON THE `icon` ARM — 2026-11-13:
                          "still have the locked tag, but put it on the right
                          next to the cta area." With no number to introduce,
                          a glyph and a word in one capsule is a wide tag
                          saying one thing; split, the mark leads the row and
                          the word joins the controls it belongs with. */}
                      {chapterMark === 'number' ? (
                        <>
                          {/* The drawn circle this page separates two
                              phrases with. */}
                          <span aria-hidden className="crf-map__dot" />
                          {pill.word}
                        </>
                      ) : null}
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
                    {/* ⚠ A BAR ON THE OPEN CHAPTER — 2026-11-13: "in
                        progress should show a progress bar." Only there: a
                        finished chapter's bar would be a full track saying
                        what the tick already says, and a locked one's an
                        empty track under a padlock. The figure is the
                        chapter's own span — its lessons AND its exam — so
                        finishing the lessons reads 50, not 100.

                        ⚠ ITS OWN COLUMN, NOT A THIRD LINE UNDER THE LABEL —
                        "progress bar can be in the center of the module
                        section". Under the title it made the open card
                        taller than every other one; in the row it sits
                        between the name and the controls, centred with
                        them, and the card keeps its height. */}
                    {c.state === 'current' ? (
                      <span
                        className="crf-map__bar"
                        role="img"
                        aria-label={`${c.title} ${c.pct}% complete`}
                      >
                        <span className="crf-map__barfill" style={{ width: `${c.pct}%` }} />
                      </span>
                    ) : null}
                    {/* ⚠ THE WORD, AHEAD OF THE CONTROLS — 2026-11-13,
                        "put it on the right next to the cta area". Before
                        the action rather than between it and the chevron:
                        the two buttons are one group and a label driven
                        between them separates what the hand goes to. */}
                    {chapterMark === 'icon' ? (
                      <span
                        className={`crf-map__state crf-map__state--${pill.tone} crf-map__state--word`}
                      >
                        {pill.word}
                      </span>
                    ) : null}
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
