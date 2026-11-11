import { GaugeThin, RubiLogo } from '@/icons'
import { REFINED_PACE } from '@/data/compassRefinedCopy'
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
      {hero ? <FocusNext hero={hero} /> : null}
    </section>
  )
}

/** THE LEFT HALF — where the learner has got to, and the plan for the rest. */
function FocusProgress({ prog, layout }: { prog: Prog; layout: FocusLayout }) {
  /* ⚠ COURSE PROGRESS LEADS, which is `AtlasPaceRingCard`'s own order and was
     Jillienne's call there on 2026-10-16: "move course progress to the top -
     shift everything else down". Where you have got to is the thing you came
     for; the plan for the rest follows from it. */
  return (
    <div className="crf-focus__prog">
      <p className="crf-focus__eyebrow">Course Progress</p>

      {layout === 'figures' ? (
        /* The ring beside its figures, Atlas's labelled-row idiom. */
        <div className="crf-focus__figrow">
          <Ring prog={prog} size={104} />
          <dl className="crf-focus__figures">
            <div>
              <dt>Lessons</dt>
              <dd>{prog.lessonsVal}</dd>
            </div>
            <div>
              <dt>{REFINED_PACE.name}</dt>
              <dd>{REFINED_PACE.goal}</dd>
            </div>
            <div>
              <dt>Each week</dt>
              <dd>{REFINED_PACE.hours}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <Ring prog={prog} size={132} />
          <p className="crf-focus__lessons">{prog.lessonsVal}</p>
        </>
      )}

      {/* ⚠ A RULE BETWEEN THE FIGURE AND THE PLAN, as Atlas draws one
          (2026-10-16): "the two sections sat on a 24px gap alone, which reads
          as spacing rather than a boundary". On `figures` the rows already
          carry the pace, so a second statement of it would be the duplication
          this merge exists to remove. */}
      {layout === 'figures' ? null : (
        <>
          <span aria-hidden className="crf-focus__rule" />
          <p className="crf-focus__eyebrow">{REFINED_PACE.eyebrow}</p>
          <p className="crf-focus__pace">
            <span aria-hidden className="crf-focus__gauge">
              <GaugeThin size={30} aria-hidden />
            </span>
            <span>
              <b>
                {REFINED_PACE.name} <span aria-hidden>|</span> {REFINED_PACE.goal}
              </b>
              <span className="crf-focus__hours">{REFINED_PACE.hours}</span>
            </span>
          </p>
        </>
      )}

      {/* ⚠ THE STAGE'S OWN SENTENCE, KEPT. It is the only per-state truth in
          this half — "On pace · 6 lessons this week", "Lessons complete Jul
          15. Access ends Jul 31." — and the invented pace figures above it
          are the same on every state. */}
      {prog.note ? <p className="crf-focus__note">{prog.note}</p> : null}
      <button type="button" className="crf-focus__link">
        {REFINED_PACE.action}
      </button>
    </div>
  )
}

/** THE RIGHT HALF — the one thing to do next. */
function FocusNext({ hero }: { hero: Hero }) {
  return (
    <div className="crf-focus__next" style={{ background: `var(--rd-${hero.bg})` }}>
      <p className="crf-focus__eyebrow" style={{ color: `var(--rd-${hero.color})` }}>
        {hero.eyebrow}
      </p>
      <h2 className="crf-focus__title">{hero.title}</h2>
      {hero.sub ? <p className="crf-focus__sub">{hero.sub}</p> : null}

      {hero.next ? (
        <div className="crf-focus__lesson">
          {hero.nextLabel ? <p className="crf-focus__label">{hero.nextLabel}</p> : null}
          <p className="crf-focus__lessonname">
            <RubiLogo size={13} aria-hidden />
            <b>{hero.next}</b>
          </p>
          {hero.meta ? <p className="crf-focus__note">{hero.meta}</p> : null}
        </div>
      ) : null}

      <div className="crf-focus__cta">
        {hero.cta ? (
          <button type="button" className="crf-rd-primary" style={{ background: `var(--rd-${hero.ctaBg})` }}>
            {hero.cta}
          </button>
        ) : null}
        {hero.alt ? (
          <button type="button" className="crf-rd-quiet">
            {hero.alt}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** His ring, at whatever size the arrangement wants. */
function Ring({ prog, size }: { prog: Prog; size: number }) {
  const pct = Number.parseFloat(prog.pct) || 0
  const r = 64
  const c = 2 * Math.PI * r
  return (
    <div className="crf-focus__ring">
      <svg viewBox="0 0 168 168" width={size} height={size} role="img" aria-label={prog.aria ?? `${prog.pct} complete`}>
        <g transform="rotate(-90 84 84)">
          <circle cx="84" cy="84" r={r} fill="none" className="crf-rd-track" strokeWidth="11" />
          <circle
            cx="84"
            cy="84"
            r={r}
            fill="none"
            stroke={`var(--rd-${prog.ringColor ?? 'steel'})`}
            strokeWidth="11"
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
