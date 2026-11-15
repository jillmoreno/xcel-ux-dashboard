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
import { BookOpenRegular, ChevronDown, CircleCheckRegular, LockRegular } from '@/icons'
import { JEFF_MVP_LEARN_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import {
  REFINED_CHAPTER_BLURBS,
  REFINED_NEXT_META,
  REFINED_ROADMAP,
  refinedModuleTime,
} from '@/data/compassRefinedCopy'
import { LessonMark } from './CompassRefinedCourseParts'
import { SECTION_ICON } from './compassRefinedSectionIcons'
import type { RefinedSectionKind } from '@/data/compassRefinedCourse'
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
 *
 * ⚠ THE CHAPTER'S OWN NAME IS GONE FROM IT — 2026-11-14: "Should just have
 * the number of lessons - quiz - and appx time to complete module." It had
 * led with `c.label`, which on the Health chapters is the course's full
 * double designation — "Life & Health Chapter 18 | Health Chapter 9" — so
 * the line under a twenty-character title ran to seventy, and the three
 * figures a learner is actually weighing sat at the end of it. The label
 * says WHICH module this is, and the title above it already does.
 *
 * ⚠ SO THIS LINE IS NOW ONE KIND OF THING: what the module costs. Count,
 * quiz, time — and see `refinedModuleTime` for why the time is only there
 * when the lesson count is.
 */
function chapterParts(c: RefinedChapter): string {
  return [
    c.lessons.length ? `${c.lessons.length} Lessons` : '',
    c.exam ? '1 Chapter Quiz' : '',
    refinedModuleTime(c.lessons.length, !!c.exam)
      ? `${REFINED_NEXT_META.approx} ${refinedModuleTime(c.lessons.length, !!c.exam)}`
      : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

/** The closing modules wear the chapters' own tones and words. */
const FINISH_TONE: Record<string, string> = {
  done: 'done',
  current: 'progress',
  locked: 'locked',
}
const FINISH_WORD: Record<string, string> = {
  done: 'Completed',
  current: 'Up Next',
  locked: 'Locked',
}

/**
 * What the module IS — the `kind` arm's mark. The same map the next-step card
 * draws from, so a thing marked an exam there is marked an exam here.
 *
 * ⚠ EXCEPT WHEN IT IS DONE — 2026-11-14: "when completed, make this a
 * circle-checkmark icon". A finished module's TYPE is the least useful thing
 * its mark could say; what the learner is scanning for down a column of
 * twenty-four is which ones are behind them.
 *
 * ⚠ `CircleCheckRegular` IS THE DEFAULT PICK, not the only one. It is the
 * weight every other mark in `SECTION_ICON` already uses — BookOpenRegular,
 * BallotCheckRegular, FileCertificateRegular — so the column stays one
 * family. The four alternatives are in the registry and shown side by side
 * in the scratchpad's `completed-mark-options.html`.
 */
function KindMark({ kind, state }: { kind: RefinedSectionKind; state?: string }) {
  if (state === 'done') return <CircleCheckRegular size={12} />
  const Icon = SECTION_ICON[kind] ?? SECTION_ICON.lesson
  return <Icon size={12} />
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
  /* ⚠ A RING AROUND THE TICK — 2026-11-15, "use option 2 for the completed
     mark". Seven treatments were drawn as three-card columns (the
     scratchpad's `completed-mark-options.html`) and this is the one that
     keeps the 23×30 capsule every other state wears — so the three marks
     stay one family and the titles stay on one left edge — while making
     this arm and the `kind` arm agree about what done looks like. A bare
     tick at 12px can read as a stray mark; a ring survives a glance. */
  if (state === 'done') return <CircleCheckRegular size={12} />
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
  status,
  finish,
}: CourseListProps) {
  /**
   * ⚠ THE FILTER OVERRIDES THE FOLD, and that is the only way the two can
   * both be true. The fold answers "the middle of this course is a wall"; a
   * filter is a learner asking for a specific subset, and handing back three
   * of eleven completed chapters behind a "Show all" control would be
   * answering a question they did not ask. All modules is the folded view.
   */
  /* ⚠ THE TAG IS MARK-ONLY WHENEVER THE WORD IS NOT IN IT — on the icon
     arms, and on `under`, where the word has moved beneath the title. It
     decides three things that have to agree: the tag's padding, the width
     every title is aligned to (`--crf-map-tag`), and where the spine is
     drawn. */
  const markOnly = chapterMark !== 'number' || status === 'under'
  /**
   * ⚠ A LOCKED MODULE ON THE `under` ARM WEARS THE TAG, IN THE ACTION'S SLOT
   * — 2026-11-14: "If Locked, return that to the 'tag' style, and put it
   * where the cta normally would be for that module."
   *
   * ⚠ THE ARM, NOT THE MODULE — pair it with the module's own state at each
   * use site (`underLock && c.state === 'locked'`). It is one named thing
   * for the same reason `markOnly` is: the tag appearing and the word
   * disappearing are halves of one decision, and spelled out separately in
   * four places they can drift — which on a card means the state said twice,
   * or not at all.
   *
   * ⚠ ALL THREE MARK ARMS. On `under` the left capsule is mark-only whatever
   * the mark is (see `markOnly` above), so there is no left-hand tag
   * anywhere on this arm for this one to duplicate.
   */
  const underLock = status === 'under'
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
        {/* ⚠ COUNTS WHAT THE LIST DRAWS — the chapters AND the three closing
            modules. See `REFINED_ROADMAP.total`. */}
        <span className="crf-map__total">
          {chapters.length + finish.length} {REFINED_ROADMAP.total}
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
      <div className={`crf-map${markOnly ? ' crf-map--icon' : ''}`}>
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
            {/* ⚠ THE BAR WEARS A CARD'S GEOMETRY — 2026-11-15: "the chevron
                should be in the same place as the other items. and the
                completed icon should be in the same place as when the items
                are expanded."

                ⚠ MARK LEFT, SENTENCE, CHEVRON HARD RIGHT — the three columns
                every card in this list has. The bar had them in the reverse
                order (chevron first, tag last), so opening the completed run
                moved both of its landmarks across the column: the green
                capsule jumped from the right edge to the left, and the
                chevron the other way. A fold that rearranges the thing it
                folds is a fold that has to be re-read every time.

                ⚠ THE CAPSULE IS THE CARDS' OWN, `markOnly` INCLUDED, so it
                is the width and the x-position the marks below it are at on
                whichever arm is showing — 114px with its word on the Number
                arm, 30px without on the other two. `--crf-map-tag` is
                declared on the LIST now rather than on the card, which is
                what lets the bar read the same value.

                ⚠ IT CARRIES THE COUNT, NOT A SECOND TICK. The place is hers;
                the content is the one thing a folded pile has to say that an
                open one does not. */}
            <span
              className={`crf-map__state crf-map__state--done${
                markOnly ? ' crf-map__state--markonly' : ''
              }`}
            >
              <span className="crf-map__mark" aria-hidden>
                {doneCount}
              </span>
              {!markOnly ? (
                <>
                  <span aria-hidden className="crf-map__dot" />
                  Completed
                </>
              ) : null}
            </span>
            <span className="crf-map__moretext">
              {showDone ? 'Hide' : 'Show'} {doneCount} completed{' '}
              {doneCount === 1 ? 'module' : 'modules'}
            </span>
            {/* ⚠ THE SAME `crf-chev` THE CARDS DRAW, as a span: this whole
                bar is already the button, and a button inside a button is
                invalid markup and a second tab stop for one action. */}
            <span className="crf-chev" aria-hidden>
              <ChevronDown
                size={14}
                style={{ transform: showDone ? 'rotate(180deg)' : undefined }}
              />
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
                        markOnly ? ' crf-map__state--markonly' : ''
                      }`}
                    >
                      {/* ⚠ THREE ARMS — `compass-course-mark`. `number` is
                          the course's chapter number, which runs 01–19
                          across twenty-one modules; `icon` is the state's
                          glyph; `kind` is what the module IS — a book, an
                          exam, a survey, a certificate — which is the one
                          that earns its place now that the closing steps are
                          modules in this list too. */}
                      <span className="crf-map__mark" aria-hidden>
                        {chapterMark === 'number' && c.number ? (
                          String(c.number).padStart(2, '0')
                        ) : chapterMark === 'kind' ? (
                          <KindMark kind="lesson" state={c.state} />
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
                      {chapterMark === 'number' && status === 'tag' ? (
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
                      {/* ⚠ ONE SECOND LINE, NOT TWO — 2026-11-15: "Have the
                          Completed be the first item in the 2nd line. use a
                          divider dot." The state and the module's cost had
                          been stacked, which made the card three bands tall
                          to say two short things and put the state — the
                          fact a learner scans for — on the quietest line of
                          the three. They are one line now, the state
                          leading, joined by the drawn dot this page
                          separates phrases with everywhere else.

                          ⚠ THE WORD IS A SIBLING OF THE LABEL, NOT INSIDE
                          IT. `.crf-map__label` stays exactly the module's
                          own parts — count, quiz, time — so anything reading
                          that line (the tests, a future export) still reads
                          what the module costs and not a state mixed into
                          it.

                          ⚠ THE PARTS ARE RENDERED ON ANYTHING THAT CAN SAY
                          THEM, not only on a chapter label. The Florida laws
                          row has no number in the course list and does have
                          an exam, so gating on the label alone dropped its
                          "1 Chapter Quiz" — the one card in twenty-one where
                          the two conditions differ.

                          ⚠ AND A LOCKED CARD ON THE `under` ARM HAS NO WORD
                          HERE — it wears the tag over by the controls (see
                          `underLock`), so its second line is the parts
                          alone. */}
                      {status === 'under' ? (
                        <div className="crf-map__status">
                          {/* ⚠ THE WORD, NOT A TAG — 2026-11-14: "Just have
                              the word 'Completed' under the text." Under the
                              title it had been the same capsule it is beside
                              the mark, which put a second boxed thing on a
                              card that already has one. It keeps the state's
                              ink; the box and the glyph go. */}
                          {c.state !== 'locked' ? (
                            <span className={`crf-map__word crf-map__word--${pill.tone}`}>
                              {pill.word}
                            </span>
                          ) : null}
                          {c.state !== 'locked' && chapterParts(c) ? (
                            <span aria-hidden className="crf-map__dot" />
                          ) : null}
                          {chapterParts(c) ? (
                            <p className="crf-map__label">{chapterParts(c)}</p>
                          ) : null}
                          {/* ⚠ THE BAR COMES WITH THE WORD — 2026-11-14,
                              "In progress, the progress bar will be to the
                              right of it." It is a fact about the same
                              state; the row's own bar is not drawn on this
                              arm, two bars for one chapter being audit
                              finding 4 in miniature. */}
                          {c.state === 'current' ? (
                            <span
                              className="crf-map__bar"
                              role="img"
                              aria-label={`${c.title} ${c.pct}% complete`}
                            >
                              <span
                                className="crf-map__barfill"
                                style={{ width: `${c.pct}%` }}
                              />
                            </span>
                          ) : null}
                        </div>
                      ) : chapterParts(c) ? (
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
                    {c.state === 'current' && status === 'tag' ? (
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
                        between them separates what the hand goes to.

                        ⚠ AND ON THE `under` ARM WHEN THE MODULE IS LOCKED —
                        2026-11-14: "If Locked, return that to the 'tag'
                        style, and put it where the cta normally would be for
                        that module." Every other state on that arm has
                        something in this corner — Review, Resume, Start —
                        and a locked one had an empty corner plus a grey word
                        under its title, which puts the state that most needs
                        saying in the quietest place on the card. The tag
                        goes back, in the slot the action would occupy, and
                        the word under the title stands down (`lockedTag`) so
                        the card says it once. */}
                    {(underLock && c.state === 'locked') ||
                    (chapterMark !== 'number' && status === 'tag') ? (
                      <span
                        className={`crf-map__state crf-map__state--${pill.tone} crf-map__state--word`}
                      >
                        {/* ⚠ THE STATE'S GLYPH TRAVELS WITH THE WORD ON THE
                            `kind` ARM — 2026-11-13: "includes the locked
                            icon with this tag over here and the icon on the
                            left indicates what the type of module is". The
                            left mark is saying what the row IS there, so
                            the state has nowhere else to be. */}
                        {chapterMark !== 'icon' ? <StateMark state={c.state} /> : null}
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

                  {/* ⚠ INSIDE THE NAME COLUMN — 2026-11-14: "these should be
                      vertically aligned with the left side of the title
                      above it." It was a sibling of the body, so the lessons
                      started at the card's own padding (21px) while the
                      title starts after the state tag — 61px on the icon
                      arm, further on the numbered one. Nesting it here makes
                      the two share a left edge BY CONSTRUCTION rather than
                      by a figure that would be wrong on the other arm. */}
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
                    {/* ⚠ THE CHAPTER EXAM IS A ROW OF THE OUTLINE —
                        2026-11-14: "this should be part of the outline above
                        it, no need for a separate section like this." It was
                        `ExamRow`, a bordered strip with its own tile, eyebrow
                        and note — a card inside a card, under a list it
                        belongs to. The course lists it as the row after the
                        chapter's lessons, and that is what it is here.

                        ⚠ ITS NAME ALREADY SAYS WHAT IT IS. "Chapter 11 Exam:
                        Retirement Plans" made the strip's EXAM eyebrow a
                        second label on one line.

                        ⚠ AND IT TAKES THE LESSONS' OWN RULES: the state's
                        mark, and no action until it opens — which is what
                        the todo lessons above it do, and what the closing
                        modules settled on the day before. The "opens after
                        all 6 lessons" note goes with the strip: the six rows
                        directly above it say so better. */}
                    {c.exam ? (
                      <li
                        className={`crf-lesson crf-lesson--${
                          c.exam.done ? 'done' : c.exam.locked ? 'todo' : 'current'
                        } crf-lesson--exam`}
                      >
                        <span className="crf-lesson__mark" aria-hidden>
                          <LessonMark
                            state={c.exam.done ? 'done' : c.exam.locked ? 'todo' : 'current'}
                          />
                        </span>
                        <span className="crf-lesson__label">{c.exam.title}</span>
                        {c.exam.done ? (
                          <button type="button" className="crf-lesson__act">
                            {COPY.examReviewCta}
                          </button>
                        ) : !c.exam.locked ? (
                          <button type="button" className="crf-lesson__act">
                            {COPY.examCta}
                          </button>
                        ) : null}
                      </li>
                    ) : null}
                  </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}

        {filter !== 'all' ? null : folded ? (
          /* ⚠ THE FOOT'S BAR TAKES THE SAME THREE COLUMNS — 2026-11-15.
             Her note was written on the completed fold; the two bars have
             been one shape since they were built, and leaving this one
             reversed would have made the page's two folds disagree. Its
             capsule is the locked tone, because that is what it stands in
             for. */
          <button type="button" className="crf-map__more" onClick={() => setShowAll(true)}>
            <span
              className={`crf-map__state crf-map__state--locked${
                markOnly ? ' crf-map__state--markonly' : ''
              }`}
            >
              <span className="crf-map__mark" aria-hidden>
                {hiddenCount}
              </span>
              {!markOnly ? (
                <>
                  <span aria-hidden className="crf-map__dot" />
                  {COPY.lockedWord}
                </>
              ) : null}
            </span>
            {/* ⚠ THE TRAILING "{n} more, locked" IS GONE with the move. It
                was the count pinned to the right edge, and the capsule on
                the left now carries that number — and, on the Number arm,
                the word with it. Two 5s in one eight-word bar is the kind of
                duplication a learner reads as two different figures. */}
            <span className="crf-map__moretext">Show all {chapters.length} chapters</span>
            <span className="crf-chev" aria-hidden>
              <ChevronDown size={14} />
            </span>
          </button>
        ) : cutoff < chapters.length ? (
          <button type="button" className="crf-map__more" onClick={() => setShowAll(false)}>
            <span className="crf-map__moretext">Show less</span>
            <span className="crf-chev" aria-hidden>
              <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
            </span>
          </button>
        ) : null}

        {/* ⚠ THE COURSE'S CLOSING STEPS ARE MODULES — 2026-11-13: "Exam,
            Survey, and Certificate should all be their own modules." They
            were a separate "Finish Your Course" strip under this list, which
            made three rows of one course look like a different kind of
            thing; they are rows of the same list now, in the order the
            course puts them.

            ⚠ THEY ALWAYS SHOW THEIR KIND. A chapter's mark answers to the
            flag; these three are an exam, a survey and a certificate, and a
            padlock on all three would lose the only thing that tells them
            apart. The `kind` arm is what makes the whole list read this way.

            ⚠ AND THEY DO NOT EXPAND. There is nothing inside them — no
            lessons, no exam of their own — so no chevron, and the space is
            held the way it is for a chapter with nothing behind it. */}
        {filter === 'all'
          ? finish.map((f) => (
              <article
                key={f.n}
                /* ⚠ MARKED AS A CLOSING MODULE. It wears the card's own
                   classes so it looks like one, and carries this so anything
                   reasoning about CHAPTERS — the tests, a future count — can
                   tell the two apart without matching on titles. */
                className={`crf-map__card crf-map__card--${f.state} crf-map__card--finish`}
              >
                <div className="crf-map__body">
                  <div className="crf-map__main">
                    <div className="crf-map__top">
                      <span
                        className={`crf-map__state crf-map__state--${FINISH_TONE[f.state]}${
                          markOnly ? ' crf-map__state--markonly' : ''
                        }`}
                      >
                        <span className="crf-map__mark" aria-hidden>
                          <KindMark kind={f.kind} state={f.state} />
                        </span>
                        {chapterMark === 'number' && status === 'tag' ? (
                          <>
                            <span aria-hidden className="crf-map__dot" />
                            {FINISH_WORD[f.state]}
                          </>
                        ) : null}
                      </span>
                      <div className="crf-map__name">
                        <p className="crf-map__title">{f.title}</p>
                        <p className="crf-map__label">
                          {f.eyebrow} · {f.note}
                        </p>
                        {status === 'under' && f.state !== 'locked' ? (
                          <div className="crf-map__status">
                            <span
                              className={`crf-map__word crf-map__word--${FINISH_TONE[f.state]}`}
                            >
                              {FINISH_WORD[f.state]}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {/* ⚠ A LOCKED CLOSING MODULE WEARS THE TAG TOO, and
                          in the same corner — it is the same card and the
                          same instruction. These three have no button when
                          they are shut (see below), so without this the exam,
                          the survey and the certificate ended the list with
                          three empty right-hand corners. */}
                      {(underLock && f.state === 'locked') ||
                      (chapterMark !== 'number' && status === 'tag') ? (
                        <span
                          className={`crf-map__state crf-map__state--${FINISH_TONE[f.state]} crf-map__state--word`}
                        >
                          {chapterMark !== 'icon' ? <StateMark state={f.state} /> : null}
                          {FINISH_WORD[f.state]}
                        </span>
                      ) : null}
                      {/* ⚠ NO BUTTON UNTIL IT OPENS — 2026-11-13: "these
                          will not display until the module is unlocked."
                          They had been drawn disabled with a padlock, which
                          is the EXAM STRIP's rule, carried in with them:
                          there, the control is the only thing saying the
                          exam exists. Here the card says that, the tag says
                          it is shut, and three dead buttons down the end of
                          the list were the only ones on the page. A locked
                          CHAPTER has shown no button since the layout was
                          built; this is the closing modules catching up. */}
                      {f.state !== 'locked' && f.cta ? (
                        <button
                          type="button"
                          className="crf-btn"
                          aria-label={`${f.cta} ${f.title}`}
                        >
                          {f.cta}
                        </button>
                      ) : null}
                      <span className="crf-chev crf-chev--none" aria-hidden />
                    </div>
                  </div>
                </div>
              </article>
            ))
          : null}
      </div>
    </>
  )
}
