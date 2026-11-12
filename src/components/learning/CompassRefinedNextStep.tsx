/**
 * THE NEXT-STEP CARD — one component, drawn on the Overview and on Your
 * Course, 2026-11-12.
 *
 * Jillienne: "The Where you left off component should have all the same
 * details as the Your Next Step section on the Overview. This should be a
 * 1:1."
 *
 * ⚠ 1:1 MEANS ONE OF THEM. Your Course had its own resume strip — a
 * thumbnail, a chapter name, a bar and a pill button — assembled from
 * different fields; keeping two cards in step by hand is what produced a
 * resume card naming a chapter this course does not contain (2026-11-11) and
 * two rings disagreeing about one learner (audit finding 4). This is the
 * Overview's card, lifted out whole, and both pages render it.
 *
 * ⚠ THE MARKUP IS THE OVERVIEW'S, RE-PREFIXED `crf-step`. It could not keep
 * `crf-focus__*`: those rules are scoped under `.crf-rd`, which is the
 * Overview's page wrapper and carries that page's padding and max-width, so
 * Your Course could only have borrowed them by wearing a layout that is not
 * its own. The `crf-step` rules in `compassRefined.css` are the same
 * declarations at the same values — checked against the computed styles of
 * the live card before and after the move, not against the diff.
 *
 * ⚠ IT DOES NOT CARRY THE BAY IT SITS IN. On the Overview that is
 * `.crf-focus__next` — the blue half of the focus card, its padding and its
 * divider; on Your Course it is the lower half of the joined course card.
 * The card is the content; where it sits is the page's business.
 */

import { ArrowRight, BookOpenRegular } from '@/icons'
import { SECTION_ICON } from './compassRefinedSectionIcons'
import type { NextMarkStyle } from './compassRefinedFocusModel'
import type { RefinedNextStep } from './compassRefinedNextStepModel'

export function CompassRefinedNextStep({
  step,
  mark = 'stacked',
  layout = 'stack',
  onAct,
}: {
  step: RefinedNextStep
  /** `compass-overview-next-mark` — the glyph on its own line, or a 40px
   *  badge beside the title. Both pages take it so the two stay identical. */
  mark?: NextMarkStyle
  /**
   * ⚠ HOW THE SAME CONTENT IS ARRANGED — 2026-11-12: "have the Your next
   * step section be layed out similar to the screenshot", which is the row
   * the old resume strip drew: a thumbnail, the text, the bar, the action
   * hard right.
   *
   * `stack` is the Overview's column, because that card sits in a 394px bay
   * beside the progress half — a row cannot fit there. `row` is Your
   * Course's, where the card has the full width of the page.
   *
   * ⚠ IT IS AN ARRANGEMENT, NOT A FORK. Same component, same model, same
   * markup — the CSS places it. Her 1:1 was about the DETAILS ("all the same
   * details as the Your Next Step section"), and every one of them is in
   * both; what differs is the space each has.
   */
  layout?: 'stack' | 'row'
  onAct?: () => void
}) {
  const Icon = SECTION_ICON[step.kind ?? 'lesson'] ?? BookOpenRegular
  return (
    <div className={`crf-step crf-step--${layout} crf-step--${mark}`}>
      {/* ⚠ THE EYEBROW IS THE STATE — "Your next step" between rows, "Where
          you left off" part way through one. See `REFINED_NEXT_STEP`. */}
      <p className="crf-step__label">{step.eyebrow}</p>
      <div className="crf-step__body">
        <span className="crf-step__mark" aria-hidden>
          <Icon size={mark === 'tile' ? 19 : 17} />
        </span>
        <div className="crf-step__text">
          <p className="crf-step__name">{step.title}</p>
          <p className="crf-step__note">
            {step.parts}
            <span aria-hidden className="crf-step__sep" />
            about {step.duration}
          </p>
          {/* ⚠ ALWAYS, INCLUDING AT 0% — 2026-11-12: "include a progress
              bar, even if this section is Not Started at 0%." It had been
              drawn only while resuming; an empty track is a truer picture of
              a lesson not started than no track at all, and it keeps the
              card one height. */}
          <span
            className="crf-step__bar"
            role="img"
            aria-label={`${step.title} ${step.lessonPct}% complete`}
          >
            <span className="crf-step__barfill" style={{ width: `${step.lessonPct}%` }} />
          </span>
        </div>
      </div>
      <div className="crf-step__cta">
        <button type="button" className="crf-step__go" onClick={onAct}>
          {step.cta}
          <ArrowRight size={13} aria-hidden />
        </button>
      </div>
    </div>
  )
}
