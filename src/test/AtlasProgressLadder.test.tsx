import { describe, expect, it } from 'vitest'
import {
  ATLAS_PROGRESS_LADDER,
  ATLAS_PROGRESS_ORDER,
  ATLAS_STEP1_ROWS,
  atlasRungFor,
  lessonsDoneFor,
} from '@/components/compass/atlasProgressLadder'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * THE PROGRESS LADDER (2026-10-16, Jillienne: "as user progresses through the
 * course progress options, the 23 of 36 completed should update accordingly.
 * also, add to the progress dropdown for Prep Review Completed, Exam
 * Simulators completed etc to show the circles turning into checkmarks
 * throughout the flow").
 *
 * ⚠ WHAT IS PINNED IS THAT THE LADDER IS THE ONLY LIST. The percentages, the
 * readiness bands and the dropdown's labels used to be three copies of the
 * same five states, which is how a rung reaches a control and not the screen.
 * The cases below are the ones that would have caught that.
 */
describe('the ladder is one list, and everything reads it', () => {
  it('builds the demo dropdown — the flag types no states of its own', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-v3-progress')
    expect(flag?.variants?.map((v) => v.value)).toEqual([...ATLAS_PROGRESS_ORDER])
    expect(flag?.variants?.map((v) => v.label)).toEqual(ATLAS_PROGRESS_LADDER.map((r) => r.label))
  })

  it('still opens on Not Started, and still ends on the key the completed view reads', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-v3-progress')
    expect(flag?.defaultVariant).toBe('not-started')
    // `completedView` keys off this exact string, and so does anyone's stored
    // flag state — renaming it moves them silently to a state that is gone.
    expect(ATLAS_PROGRESS_ORDER[ATLAS_PROGRESS_ORDER.length - 1]).toBe('completed')
  })

  it('climbs: percent and checked rows both only ever go up', () => {
    /* A rung out of order would show the ring going backwards while the
       checks went forwards, which is the one way this list can lie. */
    const pcts = ATLAS_PROGRESS_LADDER.map((r) => r.percent)
    const steps = ATLAS_PROGRESS_LADDER.map((r) => r.stepsDone)
    expect([...pcts].sort((a, b) => a - b)).toEqual(pcts)
    expect([...steps].sort((a, b) => a - b)).toEqual(steps)
    expect(pcts[0]).toBe(0)
    expect(pcts[pcts.length - 1]).toBe(100)
  })

  it('checks every Step 1 row by the top, and none at the bottom', () => {
    expect(ATLAS_PROGRESS_LADDER[0].stepsDone).toBe(0)
    expect(atlasRungFor('completed').stepsDone).toBe(ATLAS_STEP1_ROWS)
  })

  it('falls back rather than throwing on a key it does not know', () => {
    // `expired` is off the picker but still reachable by an `?ff=` pin, and a
    // stored variant can outlive a rename.
    expect(atlasRungFor('expired').key).toBe('not-started')
    expect(atlasRungFor(undefined).key).toBe('not-started')
  })
})

/**
 * ⚠ THE LESSON COUNT IS DERIVED, NOT TYPED. "Pre-Licensing Lessons (23 of 36
 * completed)" was the path fixture's figure and did not move with the demo's
 * Progress, so 0% showed a learner with 23 lessons behind them and 100% put a
 * green check on a row saying 23 of 36.
 */
describe('the lesson count follows the ring', () => {
  it('is nothing at the bottom and everything from Lessons Completed up', () => {
    expect(lessonsDoneFor(0, 36)).toBe(0)
    for (const rung of ATLAS_PROGRESS_LADDER.filter((r) => r.stepsDone >= 1)) {
      expect(lessonsDoneFor(rung.percent, 36), rung.key).toBe(36)
    }
  })

  it('moves with the rung in between, and never exceeds the total', () => {
    const counts = ATLAS_PROGRESS_LADDER.map((r) => lessonsDoneFor(r.percent, 36))
    expect([...counts].sort((a, b) => a - b)).toEqual(counts)
    expect(Math.max(...counts)).toBe(36)
  })

  it('reads the total off the course path rather than owning one', () => {
    // The TOTAL is the fixture's — only the count is the demo's. A different
    // course with a different lesson count has to work unchanged.
    expect(lessonsDoneFor(100, 12)).toBe(12)
    expect(lessonsDoneFor(0, 12)).toBe(0)
    expect(lessonsDoneFor(50, 0)).toBe(0)
  })
})

/**
 * THE MAIN CTA AT THE TOP OF THE LADDER (2026-10-19, Jillienne: "when at 100%
 * this main CTA should change to View Certificate").
 *
 * ⚠ PINNED AS THE LADDER'S SHAPE, not by rendering the Home. What makes the
 * label correct is that `completed` is the only rung at the top — if a rung
 * were ever added above it, or `completed` stopped meaning 100%, the button
 * would say "Resume Course" on a finished course and nothing else would
 * complain. The label and its destination are chosen together in
 * `AtlasHomeEricE2E` and verified in the browser; this is the assumption
 * underneath them.
 */
describe('the top of the ladder is where the CTA changes', () => {
  it('has exactly one rung at 100%, and it is `completed`', () => {
    const top = ATLAS_PROGRESS_LADDER.filter((r) => r.percent === 100)
    expect(top.map((r) => r.key)).toEqual(['completed'])
  })

  it('leaves every other rung short of it, so Begin/Resume still stand', () => {
    for (const rung of ATLAS_PROGRESS_LADDER.filter((r) => r.key !== 'completed')) {
      expect(rung.percent, rung.key).toBeLessThan(100)
    }
  })
})
