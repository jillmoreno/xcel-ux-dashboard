import { describe, expect, it } from 'vitest'
import { observedHoursFor, paceStandingMessage, type PaceStanding } from '@/components/compass/paceStanding'

/**
 * THE PACE STANDING SENTENCE — shared by `HybridPacingHome` and the Atlas
 * Home's pace ring since 2026-10-19 (Jillienne: "we need this type of
 * messaging to be considered for the study pace section for when a user is
 * no longer at 0%").
 *
 * ⚠ WHAT THIS GUARDS IS THAT THERE IS ONE OF IT. The sentence was written
 * inside Hybrid; the second card could have copied it, and two cards
 * reporting one standing in two slightly different sentences is how a demo
 * starts contradicting itself. These cases pin the five branches and the
 * arithmetic they quote, so a change to either reaches both or fails here.
 */
const ARGS = { goalHoursPerWeek: 8, weeks: 2, finishIso: '2026-05-24' }

describe('the pace standing sentence', () => {
  it('quotes an average that agrees with the goal it is measured against', () => {
    // The whole point of deriving it: the two numbers in the sentence cannot
    // drift apart, because one is the other scaled.
    expect(observedHoursFor(8, 'on-track')).toBe(8)
    expect(observedHoursFor(8, 'ahead')).toBeGreaterThan(8)
    expect(observedHoursFor(8, 'behind')).toBeLessThan(8)
    expect(observedHoursFor(8, 'off-track')).toBeLessThan(observedHoursFor(8, 'behind'))
    expect(observedHoursFor(8, 'no-data')).toBe(0)
  })

  it('says something different in all five states', () => {
    const states: PaceStanding[] = ['on-track', 'ahead', 'behind', 'off-track', 'no-data']
    const said = states.map((standing) => paceStandingMessage({ ...ARGS, standing }))
    expect(new Set(said).size).toBe(5)
  })

  /* ⚠ BEHIND vs OFF TRACK IS THE SPLIT THAT MATTERS, and it is the one a
     later simplification would collapse. Behind is a gap the learner can
     still close inside the goal they chose — a nudge. Off track says the
     goal no longer fits, and is the ONLY state with an action attached. */
  it('nudges when behind, and sends you to the plan when off track', () => {
    const behind = paceStandingMessage({ ...ARGS, standing: 'behind' })
    const off = paceStandingMessage({ ...ARGS, standing: 'off-track' })
    /* ⚠ PINS THE NUDGE, NOT THE WORDS (2026-10-21, Jillienne: "i hate 'closes
       the gap'"). This asserted that exact phrase, so the copy could not be
       reworded without a test failure that looked like a behaviour change. What
       the case is actually about is the SHAPE of the two sentences — behind
       offers a way back inside the goal the learner chose, off track sends them
       to change the goal — so it matches on the recovery rather than the
       metaphor. */
    expect(behind).toMatch(/one extra session/i)
    expect(behind).not.toMatch(/Study Plan/)
    expect(off).toMatch(/Study Plan/)
    // Off track is the state that names the date it will not meet.
    expect(off).toMatch(/May 24/)
  })

  it('reads the goal adjectivally — "your 2-week goal", never "2 weeks goal"', () => {
    for (const standing of ['behind', 'ahead', 'no-data'] as PaceStanding[]) {
      const said = paceStandingMessage({ ...ARGS, standing })
      expect(said, said).toMatch(/2-week goal/)
      expect(said, said).not.toMatch(/2 weeks goal/)
    }
  })

  it('does not claim an average when nothing was logged', () => {
    // "You're averaging 0 hours a week" is technically true and reads as a
    // measurement; the no-data arm states the goal instead.
    const said = paceStandingMessage({ ...ARGS, standing: 'no-data' })
    expect(said).toMatch(/No study time logged yet this week/)
    expect(said).not.toMatch(/averaging/)
  })
})
