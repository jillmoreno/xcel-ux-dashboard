import { refinedCourseView, type RefinedChapter } from './compassRefinedLearnCourse'
import { refinedProgressAt } from '@/data/compassRefinedCourse'
import { journeyStage } from './compassReadinessModel'
import { REFINED_FINISH_COPY as FINISH, REFINED_PAGE_TITLES } from '@/data/compassRefinedCopy'
import { useState } from 'react'
import { RubiLogo } from '@/icons'
import {
  JEFF_MVP_LEARN_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import { CompassRefinedCourseCards } from './CompassRefinedCourseCards'
import { CompassRefinedCourseRows } from './CompassRefinedCourseRows'
import { AwardMark, CourseHeadCard, FinishRow } from './CompassRefinedCourseParts'
import { refinedNextStep } from './compassRefinedNextStepModel'
import { durationOf } from './compassRefinedFocusDuration'
import { COURSE_DEFAULTS, type CourseListProps, type CourseOptions } from './compassRefinedCourseModel'
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
  course,
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
  /** `compass-course-rows`, `compass-course-blurb`, `compass-course-fold` —
   *  read in `CompassLearningPage` like every other Compass control, so this
   *  page stays a plain function of its props. */
  course?: CourseOptions
} = {}) {
  const options = course ?? COURSE_DEFAULTS
  /* One reading of the stage, shared with the Overview — see
     `refinedProgressAt`. */
  const progress = refinedProgressAt(journeyStage(stage ?? '').prog?.pct)
  const view = refinedCourseView(progress)
  const { chapters, header, finish } = view
  /* ⚠ THE SAME CARD THE OVERVIEW DRAWS, from the same model — "This should
     be a 1:1". The stage supplies the duration, as it does there; the words
     and the bar follow `intoCurrent`. */
  const m = journeyStage(stage ?? '')
  const step = refinedNextStep(progress, durationOf(m.hero?.meta))
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
  /* ⚠ THE FOLD IS A TOGGLE NOW — 2026-11-12: "2 both behind a toggle so i
     can compare". Off shows the whole course, which is how the roadmap
     reference draws it; on is what the audit settled. */
  const folded = options.fold && !showAll && cutoff < chapters.length
  const shown = folded ? chapters.slice(0, cutoff) : chapters
  const hiddenCount = chapters.length - shown.length
  const isOpen = (c: RefinedChapter) => c.expandable && (open[c.n] ?? c.state === 'current')

  /* Everything both layouts draw from, computed once — see
     `CourseListProps`. */
  const listProps: CourseListProps = {
    chapters,
    shown,
    folded,
    fold: options.fold,
    hiddenCount,
    cutoff: options.fold ? cutoff : chapters.length,
    setShowAll,
    isOpen,
    toggle: (n, expanded) => setOpen((o) => ({ ...o, [n]: !expanded })),
    openLesson,
    blurb: options.blurb,
    chapterMark: options.chapterMark,
  }

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

        {/* ⚠ THE COURSE AND THE NEXT STEP, AS ONE CARD — 2026-11-12: "Have
            the Course one be at the top, and the where you left off should be
            below it, attached in 1 component with a divider line in between."

            What this replaces is a `crf-resume` strip that sat ABOVE the
            course header: the page opened on a lesson name and then
            re-introduced the course it belongs to. It also carried its own
            thumbnail, title and bar, built from different fields from the
            Overview's next-step card — which is how it came to name a chapter
            this course does not contain. There is one card now, and the
            Overview draws its lower half too. */}
        <CourseHeadCard
          header={header}
          step={step}
          mark={options.nextMark}
          image={options.image}
          onAct={openLesson}
        />

        {/* ---------- the chapter list, in one of two layouts ----------
            ⚠ TWO COMPONENTS, NOT A CONDITIONAL THREADED THROUGH ONE —
            2026-11-12, `compass-course-rows`. The rows layout is the audited
            one and moved out unchanged; the roadmap is its sibling. Both are
            handed the same `CourseListProps`, so the fold, the open rows and
            every figure are computed once above them: the arms differ in
            layout and in nothing else. */}
        {options.rows === 'cards' ? (
          <CompassRefinedCourseCards {...listProps} />
        ) : (
          <CompassRefinedCourseRows {...listProps} />
        )}

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
