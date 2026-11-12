import {
  ArrowRight,
  BallotCheckRegular,
  BookOpenRegular,
  ClipboardList,
  FileCertificateRegular,
  PenFieldRegular,
} from '@/icons'
import {
  REFINED_NEXT_EYEBROW,
  REFINED_NEXT_META,
  REFINED_PACE,
  REFINED_PROGRESS_LINES,
  REFINED_RING_LABEL,
} from '@/data/compassRefinedCopy'
import {
  REFINED_COURSE_SECTIONS,
  REFINED_COURSE_TOTALS,
  type RefinedSection,
  type RefinedSectionKind,
} from '@/data/compassRefinedCourse'
import type { Hero, Prog } from './compassReadinessModel'
import {
  FOCUS_DEFAULTS,
  type FocusLayout,
  type FocusOptions,
  type NextMarkStyle,
  type PaceNoteStyle,
} from './compassRefinedFocusModel'

/**
 * WHAT THE NEXT SECTION IS, DRAWN AS A TILE — 2026-11-11, from the direct
 * ask. The tile itself is `crf-tile`, the badge the Learn page's course
 * header already uses, so the two surfaces mark a thing the same way.
 *
 * ⚠ THE ICONS ARE HERS, mapped onto this registry: an open book for a
 * lesson; `ballot-check` for an exam, which is the page-with-checkmarks in
 * this set and the nearest thing to "a document style icon with a
 * checkmark"; `pen-field` for an affidavit, a signature line with a pen;
 * `clipboard-list` for a survey.
 *
 * ⚠ TWO OF THE FOUR ARE UNREACHABLE TODAY and that is deliberate — see
 * `RefinedSectionKind`. An unknown kind falls back to the lesson book rather
 * than rendering an empty tile.
 */
const SECTION_ICON: Record<RefinedSectionKind, typeof BookOpenRegular> = {
  lesson: BookOpenRegular,
  exam: BallotCheckRegular,
  affidavit: PenFieldRegular,
  survey: ClipboardList,
  /* ⚠ `file-certificate` — a document with a seal, which is the one glyph in
     this registry that means "you have finished and here is the proof". */
  certificate: FileCertificateRegular,
}

/**
 * COURSE PROGRESS AND YOUR NEXT STEP, AS ONE COMPONENT — 2026-11-11,
 * Jillienne: "these 2 components should be redesigned into 1 simple component
 * that shows the Course Progress on the left, and the Your Next Step on the
 * right. The Progress UI should more closely match the screen from atlas with
 * the pacing details as well. Please explore a few variations before
 * implementing them."
 *
 * ⚠ THREE ARRANGEMENTS OF THE SAME CONTENT, because the ask was to explore
 * before implementing and a flag is how this project explores. They differ in
 * ONE decision — what separates the two halves — so a reviewer flipping
 * between them is answering one question rather than comparing three designs:
 *
 *   `split`   a vertical rule. The two halves are peers on one ground.
 *   `panel`   a tinted ground on the left. State and action are different
 *             KINDS of thing, and the ground says so without a line.
 *   `figures` the left half as Atlas's labelled rows rather than prose, with
 *             the ring beside them. Densest; scannable; least like his.
 *
 * ⚠ WHY THEY WERE TWO SECTIONS. His Journey draws the hero card and then a
 * separate full-width Course progress card beneath it, so the first screen is
 * two stacked cards saying "here is what to do" and "here is where you are" —
 * the same two facts a learner holds together. Side by side they read as one
 * answer.
 *
 * ⚠ THE PACE BLOCK IS ATLAS'S SHAPE, NOT HIS. `AtlasPaceRingCard` states the
 * plan as a gauge, a named pace, a goal and an hours-per-week figure; his
 * Journey states it as one sentence that changes shape every stage. The
 * sentence is kept underneath — it is the only per-stage truth here — and the
 * fields above it come from `REFINED_PACE`, which is invented and says so.
 */
export function CompassRefinedFocus({
  hero,
  prog,
  options = FOCUS_DEFAULTS,
}: {
  hero?: Hero
  prog?: Prog
  options?: FocusOptions
}) {
  const { layout, swap } = options
  /* ⚠ EITHER HALF MAY BE ABSENT and the component still has to read. Early
     states have no hero; the prep series has no QE ring. A missing half
     collapses the grid rather than leaving a hole where it was. */
  if (!hero && !prog) return null

  return (
    <section
      className={`crf-focus crf-focus--${layout}${swap ? ' crf-focus--swap' : ''}`}
      aria-label="Where you are and what to do next"
    >
      {prog ? <FocusProgress prog={prog} layout={layout} paceNote={options.paceNote} /> : null}
      {hero ? <FocusNext hero={hero} next={nextSection(prog)} mark={options.nextMark} /> : null}
    </section>
  )
}

/**
 * THE LEFT HALF — where the learner has got to, and the plan for the rest.
 *
 * ⚠ THREE LINES, NOT A PARAGRAPH — 2026-11-11, Jillienne: "this needs to be 3
 * simple lines / Completed Lessons - 0 of 36 / Study Pace - Average | 1 Week
 * Goal (about 12 hours/week) smaller text underneath. / Estimated Completion
 * - Month + Day (in 18 days) smaller text underneath."
 *
 * It had been Atlas's gauge row over a sentence over a link. The sentence was
 * `prog.note`, which is a different shape every stage, so the half read
 * differently on every state the reviewer flipped to. Three labelled lines
 * say the same facts in the same places each time.
 *
 * ⚠ THE STAGE'S OWN SENTENCE IS GONE WITH IT. It was the per-state truth and
 * it now disagrees with the figures above it — q1's note still says six weeks
 * and ten hours against the panel's one-week goal and twelve. Keeping both
 * would have put the disagreement on screen; it is recorded in
 * `REFINED_PACE` instead, to settle when the figures become real.
 */
function FocusProgress({
  prog,
  layout,
  paceNote,
}: {
  prog: Prog
  layout: FocusLayout
  paceNote: PaceNoteStyle
}) {
  /* ⚠ COUNTED AGAINST THE REAL COURSE — 2026-11-11, "these are the actual
     sections from the florida life and health course. Lets update the demo
     data for the refined section to match." Forty-one sections, not Jeff's
     thirty-six, and the course's own instruction counts them all: "Complete
     all lessons in the list below."

     ⚠ THE STAGE STILL DRIVES IT. The done figure is the stage's own
     percentage against the real total rather than a number typed here, so
     flipping through q1–u5 still walks a learner forward — it now walks them
     through the course that exists. Replacing the sixteen stage fixtures
     outright would have left their rings, bars and copy describing a
     different course; see the note in `compassRefinedCourse.ts`. */
  const pct = Number.parseFloat(prog.pct) || 0
  const done = Math.round((pct / 100) * REFINED_COURSE_TOTALS.sections)
  const lessons = `${done} of ${REFINED_COURSE_TOTALS.sections}`

  return (
    <div className="crf-focus__prog">
      <p className="crf-focus__eyebrow">Course Progress</p>
      <div className="crf-focus__figrow">
        <Ring prog={prog} size={layout === 'figures' ? 104 : 132} />
        {/* ⚠ LABEL LEFT, VALUE RIGHT, A HAIRLINE BETWEEN — 2026-11-11, from
            the old Course-progress card she pointed at: "QE course" on the
            left and "0 of 36 lessons" hard right on one baseline, ruled
            underneath. It also reads her own spec more literally than the
            stacked version did — "Completed Lessons - 0 of 36" is one line
            with a value at the end of it, not a label over a figure. */}
        <dl className="crf-focus__figures">
          <div>
            <dt>{REFINED_PROGRESS_LINES.lessons}</dt>
            <dd>{lessons}</dd>
          </div>
          <div>
            <dt>{REFINED_PROGRESS_LINES.pace}</dt>
            <dd>
              {REFINED_PACE.name} <span aria-hidden>|</span> {REFINED_PACE.goal}
              {/* ⚠ ON THE SAME LINE NOW, SPLIT BY A DOT — 2026-11-11: "move
                  these so they are in the same line, divided by a small
                  circle, still different font weights". It had been a second
                  line under the value. The dot is a drawn circle rather than
                  a "·", which at this size reads as punctuation in the
                  sentence rather than as a divider between two of them. */}
              <span aria-hidden className="crf-focus__sep" />
              <span className="crf-focus__under">{REFINED_PACE.hours}</span>
            </dd>
            {/* ⚠ INSIDE THE STUDY PACE ROW — 2026-11-11: "put this right
                under the Study pace section. in a container that is light
                beige." It had been the last thing in the bay, under Estimated
                Completion, which put a sentence about the PACE below a row
                about the finish date. It is a `dd` so the list stays a list;
                the row wraps and it takes the full width beneath the value.

                ⚠ ONLY AT 0%, and the same rule Atlas settled on 2026-10-19:
                a starting point is a true thing to offer somebody who has not
                started and a stale one for anybody else. */}
            {done === 0 ? (
              /* ⚠ TWO ANSWERS TO "HOW DO WE OFFER THE CHANGE?", and they are
                 not two layouts of one thing — 2026-11-11, clarified: "when
                 the link below is on, i mean i want the entire beige
                 container gone, and just the simple link."

                 `inline` keeps Atlas's note: the sentence explains that the
                 pace is a default and offers "here" as its last word.
                 `link` drops the explanation with the box — the offer alone,
                 on the reasoning that a learner on day one does not need to
                 be told a default is a default, only that it can change. */
              paceNote === 'link' ? (
                <dd className="crf-focus__dayone crf-focus__dayone--bare">
                  <button type="button" className="crf-focus__notelink">
                    {REFINED_PACE.dayOneLink}
                  </button>
                </dd>
              ) : (
                <dd className="crf-focus__dayone">
                  {REFINED_PACE.dayOne}{' '}
                  <button type="button" className="crf-focus__inlink">
                    {REFINED_PACE.dayOneAction}
                  </button>
                  .
                </dd>
              )
            ) : null}
          </div>
          <div>
            <dt>{REFINED_PROGRESS_LINES.completion}</dt>
            <dd>
              {REFINED_PACE.completion}
              <span aria-hidden className="crf-focus__sep" />
              <span className="crf-focus__under">{REFINED_PACE.completionIn}</span>
            </dd>
          </div>
        </dl>
      </div>

    </div>
  )
}

/**
 * THE RIGHT HALF — the one thing to do next.
 *
 * ⚠ IT IS THE LESSON CARD AND NOTHING ELSE — 2026-11-11, "the right side of
 * the component should better match this UI", with a mock of four lines: the
 * eyebrow, the lesson, its meta, and the two actions on one row.
 *
 * ⚠ SO THE HERO'S OWN HEADLINE GOES. `hero.eyebrow` ("Step 1 of 4 · Lessons")
 * and `hero.title` ("Start your QE course") and `hero.sub` were a second
 * heading on a page that already has one, saying what the stage is rather
 * than what to do. The eyebrow here is `hero.nextLabel` — "Your next step ·
 * Tonight, Mon Jun 8" — which is the only one of them that names an action
 * and a time. The step's position in the regulated four is still on the page:
 * the numbered steps list sits under this card.
 */
function FocusNext({
  hero,
  next,
  mark = 'stacked',
}: {
  hero: Hero
  next?: RefinedSection
  mark?: NextMarkStyle
}) {
  return (
    <div className="crf-focus__next">
      <div className={`crf-focus__card crf-focus__card--${mark}`}>
        {/* ⚠ NO DATE, AND NOT HIS LABEL — 2026-11-11. His carried the day
            ("Your next step · Tonight, Tue Jun 16") and the lead-in itself
            varied by state ("Recommended next" on some). One eyebrow on all
            sixteen; see `REFINED_NEXT_EYEBROW`. */}
        <p className="crf-focus__label">{REFINED_NEXT_EYEBROW}</p>
        {/* ⚠ UNDER THE EYEBROW, OVER THE TITLE, AND ON NO GROUND OF ITS OWN —
            2026-11-11: "icon should be below the eyebrow. above the course
            title section, not white background". It was a white tile beside
            the title, which on this blue half read as a second card edge. A
            bare glyph in its own line is a mark on the section rather than a
            box in it. `aria-hidden`, because the title says the word. */}
        {/* ⚠ ONE GROUP, CENTRED IN WHAT IS LEFT — 2026-11-11: "have these
            items be grouped together and centered vertically within this
            space". The mark, the title and the meta are one statement about
            the next section; they had been three loose children of a column
            with the eyebrow above and the actions below, so they sat hard
            under the eyebrow with all the slack beneath them. */}
        <div className="crf-focus__body">
          {/* ⚠ TWO SHAPES, ONE QUESTION: how tall this card is. `stacked`
              gives the glyph its own line; `tile` sets a 40px badge beside
              the title and its figures so they occupy one block instead of
              two. The other half of the card is three ruled rows, and the two
              halves have to end up a similar height. */}
          <span className="crf-focus__mark" aria-hidden>
            <SectionIcon kind={next?.kind} size={mark === 'tile' ? 19 : 17} />
          </span>
          {/* ⚠ THE NAME AND ITS FIGURES ARE ONE COLUMN — 2026-11-11: "wrap
              the text so its course title and then the other text on the 2nd
              line." Beside the tile they had been two more items on the
              mark's flex row, so a long course name and its figures competed
              for one line. The wrapper is inert on `stacked`, where the body
              is a plain block. */}
          <div className="crf-focus__bodytext">
            <p className="crf-focus__lessonname">{next?.title ?? hero.next ?? hero.title}</p>
            {/* ⚠ HOW LONG AND HOW FAR, NOT WHAT IT COVERS — 2026-11-11. His
                line ran "1h 40m · insurable interest · how a policy pays": a
                duration and two topics, and the topics are what the TITLE
                above already says. The dot is the drawn one the progress rows
                use, so the two halves separate things the same way. */}
            <p className="crf-focus__note">
              {REFINED_NEXT_META.parts}
              <span aria-hidden className="crf-focus__sep" />
              {REFINED_NEXT_META.approx} {durationOf(hero.meta)}
            </p>
          </div>
        </div>
        {/* ⚠ ONE ACTION — 2026-11-11, on "Set my study pace": "remove this."
            `hero.alt` is the stage's secondary, and on this card it competed
            with the primary for a decision the card is not asking: the half
            opposite already offers the pace change, in the day-one note. A
            next-step card with two actions makes the next step a choice. */}
        <div className="crf-focus__cta">
          {hero.cta ? (
            <button type="button" className="crf-focus__go">
              {hero.cta}
              <ArrowRight size={13} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** His ring, at whatever size the arrangement wants. */
function Ring({ prog, size }: { prog: Prog; size: number }) {
  const pct = Number.parseFloat(prog.pct) || 0
  /* ⚠ A THINNER RING ON A WIDER RADIUS — 2026-11-11, matching the old Course
     progress card: 150px of ring drawn with a light hairline track, where
     this was an 11px stroke that read as a donut. The radius grows with the
     stroke shrinking so the ring occupies the same box. */
  const r = 70
  const c = 2 * Math.PI * r
  return (
    <div className="crf-focus__ring">
      <svg viewBox="0 0 168 168" width={size} height={size} role="img" aria-label={prog.aria ?? `${prog.pct} complete`}>
        <g transform="rotate(-90 84 84)">
          <circle cx="84" cy="84" r={r} fill="none" className="crf-rd-track" strokeWidth="7" />
          <circle
            cx="84"
            cy="84"
            r={r}
            fill="none"
            stroke={`var(--rd-${prog.ringColor ?? 'steel'})`}
            strokeWidth="7"
            strokeDasharray={`${((pct / 100) * c).toFixed(1)} ${c.toFixed(1)}`}
            strokeLinecap="butt"
          />
        </g>
      </svg>
      <span className="crf-focus__ringnum">
        <b>{prog.pct}</b>
        {/* ⚠ "Complete", NOT his "Lessons" — 2026-11-11. The row beneath
            already says "Completed Lessons · 0 of 41", so repeating the noun
            left the percentage unexplained. See `REFINED_RING_LABEL`. */}
        <span>{REFINED_RING_LABEL}</span>
      </span>
    </div>
  )
}

/**
 * THE SECTION THE LEARNER IS ABOUT TO OPEN.
 *
 * ⚠ THE SAME ARITHMETIC AS THE COUNT OPPOSITE, deliberately: done sections
 * from the stage's percentage, and the next one is the row after them. If the
 * two halves derived the learner's position separately they would disagree
 * the first time a percentage landed on a boundary.
 */
function nextSection(prog?: Prog): RefinedSection | undefined {
  if (!prog) return undefined
  const pct = Number.parseFloat(prog.pct) || 0
  const done = Math.round((pct / 100) * REFINED_COURSE_TOTALS.sections)
  /* Past the end is the end: a finished course has nothing after it, and the
     hero's own copy is the honest thing to show there. */
  return REFINED_COURSE_SECTIONS[done]
}

/** The tile's glyph, by what the next section is. Unknown falls back to the
 *  lesson book rather than an empty tile. */
function SectionIcon({ kind, size = 17 }: { kind?: RefinedSectionKind; size?: number }) {
  const Icon = SECTION_ICON[kind ?? 'lesson'] ?? BookOpenRegular
  return <Icon size={size} aria-hidden />
}

/**
 * THE DURATION OUT OF HIS META LINE.
 *
 * ⚠ THE FIRST SEGMENT, BY CONSTRUCTION. Every state writes it the same way —
 * "1h 40m · insurable interest · how a policy pays", "25 min · on pace for
 * Jul 15" — so the time is whatever precedes the first separator. Reusing it
 * keeps the figure his; retyping it would have been a third invented number
 * on a card that already carries two.
 */
function durationOf(meta?: string): string {
  const first = meta?.split('·')[0]?.trim()
  /* No meta, or a line that does not start with a time: say nothing rather
     than printing "about undefined". */
  return first && /\d/.test(first) ? first : ''
}
