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
 * ⚠ THE OPEN CHAPTER HAS NO PILL — 2026-11-12, "remove this tag", on "Ready
 * to begin". It is the one card where three things said the same thing: the
 * navy chip, the tinted ground and border, and a filled Resume button in the
 * corner. The other two states keep theirs, and `Locked` earns its place —
 * those cards have no button at all, and the "opens when…" line was removed
 * from this layout earlier the same day, so the pill is the only thing left
 * that says the chapter is shut.
 */
function statusPill(c: RefinedChapter) {
  if (c.state === 'done') return { word: 'Completed', tone: 'done' }
  if (c.state === 'current') return null
  return { word: COPY.lockedWord, tone: 'locked' }
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
                  {/* ⚠ THE OPEN BOOK, SMALL — 2026-11-12: "make these icons
                      much smaller. and use the open book icon". It drew
                      `ChapterMark`, which is the rows layout's state glyph: a
                      tick, a chevron or a padlock at 15px. In a chip whose
                      other twenty-one members hold a NUMBER, a state glyph
                      was answering a different question twice — the pill
                      beside it already says Completed, Ready to begin or
                      Locked — and a chevron in particular said nothing at
                      all. A book is what the row IS. */}
                  {c.number ? (
                    String(c.number).padStart(2, '0')
                  ) : (
                    <BookOpenRegular size={13} />
                  )}
                </span>

                <div className="crf-map__main">
                  <div className="crf-map__top">
                    {pill ? (
                      <span className={`crf-map__pill crf-map__pill--${pill.tone}`}>
                        {/* ⚠ A TICK ON COMPLETED, A PADLOCK ON LOCKED — the
                            glyph takes the tag's own colour, so the green
                            checkmark is green by inheritance rather than by
                            a second rule that could drift from the text
                            beside it. */}
                        {c.state === 'locked' ? <LockRegular size={11} aria-hidden /> : null}
                        {c.state === 'done' ? <Check size={11} aria-hidden /> : null}
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
