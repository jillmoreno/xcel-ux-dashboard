import { ArrowRight } from '@/icons'
import { REFINED_PACE, REFINED_PROGRESS_LINES } from '@/data/compassRefinedCopy'
import {
  REFINED_COURSE_SECTIONS,
  REFINED_COURSE_TOTALS,
} from '@/data/compassRefinedCourse'
import type { Hero, Prog } from './compassReadinessModel'

/** Which of the three arrangements draws. `compass-overview-focus`. */
export type FocusLayout = 'split' | 'panel' | 'figures'

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
  layout = 'split',
}: {
  hero?: Hero
  prog?: Prog
  layout?: FocusLayout
}) {
  /* ⚠ EITHER HALF MAY BE ABSENT and the component still has to read. Early
     states have no hero; the prep series has no QE ring. A missing half
     collapses the grid rather than leaving a hole where it was. */
  if (!hero && !prog) return null

  return (
    <section
      className={`crf-focus crf-focus--${layout}`}
      aria-label="Where you are and what to do next"
    >
      {prog ? <FocusProgress prog={prog} layout={layout} /> : null}
      {hero ? <FocusNext hero={hero} next={nextSection(prog)} /> : null}
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
function FocusProgress({ prog, layout }: { prog: Prog; layout: FocusLayout }) {
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
              {/* The "smaller text underneath", under the VALUE rather than
                  the row, so it stays with the thing it qualifies. */}
              <span className="crf-focus__under">{REFINED_PACE.hours}</span>
            </dd>
          </div>
          <div>
            <dt>{REFINED_PROGRESS_LINES.completion}</dt>
            <dd>
              {REFINED_PACE.completion}
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
function FocusNext({ hero, next }: { hero: Hero; next?: string }) {
  return (
    <div className="crf-focus__next">
      <div className="crf-focus__card">
        {hero.nextLabel ? <p className="crf-focus__label">{hero.nextLabel}</p> : null}
        {/* ⚠ A REAL SECTION OF THE REAL COURSE — 2026-11-11. His value was
            "Lesson 1: What life insurance does", which is not a row of the
            Florida Life & Health list. The section is chosen by the same
            stage percentage that drives the count opposite, so the two halves
            always describe one learner. His string is the fallback for the
            states that carry no progress to pick from. */}
        <p className="crf-focus__lessonname">{next ?? hero.next ?? hero.title}</p>
        {hero.meta ? <p className="crf-focus__note">{hero.meta}</p> : null}
        <div className="crf-focus__cta">
          {hero.cta ? (
            <button type="button" className="crf-focus__go">
              {hero.cta}
              <ArrowRight size={13} aria-hidden />
            </button>
          ) : null}
          {hero.alt ? (
            <button type="button" className="crf-focus__quiet">
              {hero.alt}
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
        <span>{prog.ringLab}</span>
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
function nextSection(prog?: Prog): string | undefined {
  if (!prog) return undefined
  const pct = Number.parseFloat(prog.pct) || 0
  const done = Math.round((pct / 100) * REFINED_COURSE_TOTALS.sections)
  /* Past the end is the end: a finished course has nothing after it, and the
     hero's own copy is the honest thing to show there. */
  return REFINED_COURSE_SECTIONS[done]?.title
}
