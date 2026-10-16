import { describe, expect, it } from 'vitest'

/**
 * THE COMPLETED JOURNEY'S LESSON COUNT (2026-10-16).
 *
 * ⚠ WHAT THIS GUARDS IS A CONTRADICTION ON ONE LINE. The lesson row's title
 * carries the PATH's figures — "Pre-Licensing Lessons (23 of 36 completed)" —
 * and those do not move when the demo's Progress does. So a completed journey
 * drew a green check against a row saying 23 of 36: the marker and the words
 * beside it disagreeing about the same fact.
 *
 * The fix is a DISPLAY transform, not a change to the path — the figures are
 * the fixture's and other surfaces read them. This pins the transform's shape
 * rather than the rendered home, because that is where it can silently rot:
 * a title that stops matching the pattern just passes through unchanged and
 * the contradiction comes back with nothing failing.
 */
const completeTitle = (title: string) => {
  const m = title.match(/^(.*\()(\d+) of (\d+)( completed\).*)$/)
  return m ? `${m[1]}${m[3]} of ${m[3]}${m[4]}` : title
}

describe('the completed journey’s counts', () => {
  it('reads every lesson as done', () => {
    expect(completeTitle('Pre-Licensing Lessons (23 of 36 completed)')).toBe(
      'Pre-Licensing Lessons (36 of 36 completed)',
    )
  })

  it('is a no-op on a title that carries no count', () => {
    for (const t of ['Final Course Exam', 'Prep Review (23)', 'Survey & Certificate']) {
      expect(completeTitle(t)).toBe(t)
    }
  })

  it('does not touch a count that is already complete', () => {
    expect(completeTitle('Pre-Licensing Lessons (36 of 36 completed)')).toBe(
      'Pre-Licensing Lessons (36 of 36 completed)',
    )
  })

  it('works whatever the totals are — it is not pinned to this fixture', () => {
    // The path's numbers change per course and per state; the transform must
    // read them rather than know them.
    expect(completeTitle('Pre-Licensing Lessons (2 of 7 completed)')).toBe(
      'Pre-Licensing Lessons (7 of 7 completed)',
    )
  })
})
