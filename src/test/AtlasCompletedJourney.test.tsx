import { describe, expect, it } from 'vitest'
import { journeyTitleFor } from '@/components/compass/atlasProgressLadder'

/**
 * THE JOURNEY'S LESSON COUNT (2026-10-16).
 *
 * ⚠ WHAT THIS GUARDS IS A CONTRADICTION ON ONE LINE. The lesson row's title
 * carries the PATH's figures — "Pre-Licensing Lessons (23 of 36 completed)" —
 * and those did not move when the demo's Progress did. So a completed journey
 * drew a green check against a row saying 23 of 36, and a learner who had not
 * started already had 23 lessons behind them: the marker and the words beside
 * it disagreeing about the same fact.
 *
 * It was fixed at the TOP END FIRST — a rewrite to "y of y" for the completed
 * view alone — and the rest of the scale on the same day, when the Progress
 * control grew the rungs that walk Step 1.
 *
 * ⚠ THIS FILE USED TO RE-IMPLEMENT THE TRANSFORM, with a copy of the regex
 * and a note saying the copy was the risk. It imports the real one now. A
 * title that stops matching the pattern still passes through unchanged and
 * nothing throws — which is the behaviour the last two cases pin, because it
 * is also how the contradiction could come back quietly.
 */
describe('the journey row’s count follows the demo’s progress', () => {
  it('reads every lesson as done at the top of the ladder', () => {
    expect(journeyTitleFor('Pre-Licensing Lessons (23 of 36 completed)', 100)).toBe(
      'Pre-Licensing Lessons (36 of 36 completed)',
    )
  })

  it('reads none as done at the bottom of it', () => {
    expect(journeyTitleFor('Pre-Licensing Lessons (23 of 36 completed)', 0)).toBe(
      'Pre-Licensing Lessons (0 of 36 completed)',
    )
  })

  it('moves in between — the fixture’s 23 is never what is shown', () => {
    const counts = [0, 14, 36, 75, 80, 100].map((p) =>
      Number(journeyTitleFor('Pre-Licensing Lessons (23 of 36 completed)', p).match(/\((\d+) of/)![1]),
    )
    expect([...counts].sort((a, b) => a - b)).toEqual(counts)
    expect(counts[0]).toBe(0)
    expect(counts[counts.length - 1]).toBe(36)
  })

  it('works whatever the totals are — it is not pinned to this fixture', () => {
    // The path's numbers change per course and per state; the transform must
    // read them rather than know them.
    expect(journeyTitleFor('Pre-Licensing Lessons (2 of 7 completed)', 100)).toBe(
      'Pre-Licensing Lessons (7 of 7 completed)',
    )
  })

  it('is a no-op on a title that carries no count', () => {
    for (const t of ['Final Course Exam', 'Prep Review (23)', 'Survey & Certificate']) {
      expect(journeyTitleFor(t, 100)).toBe(t)
      expect(journeyTitleFor(t, 0)).toBe(t)
    }
  })
})
