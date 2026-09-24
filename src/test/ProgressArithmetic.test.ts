import { describe, expect, it } from 'vitest'
import { PROGRESS_RATIOS, dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { NY_PRODUCER_HOURS_INVENTED } from '@/data/nyProducerRequirements'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * THE ACTIVITY HISTORY HAS TO ADD UP — 2026-09-23.
 *
 * ⚠ THIS SUITE EXISTS BECAUSE IT DID NOT. A first build of the activity streak
 * drew a flat 30-day chart for every persona and reported a three-week run
 * inside it. Access is 30 days and the On Track learner has 17 LEFT, so they
 * have had the course for thirteen — the card was showing more than twice the
 * history the enrolment had existed for, and the demo said so in the same
 * viewport: "17 days left" sat two inches above thirty bars.
 *
 * Authored fixtures cannot be checked by reading them; four numbers have to
 * agree and the agreement is invisible in any one file. So the arithmetic is
 * asserted from the SAME dates and percentages the dashboard renders, rather
 * than against constants copied out of the fixture module — a test that
 * re-declared them would pass on a fixture and a UI that disagreed.
 */

const VARIANTS = ['progress-on-track', 'progress-at-risk'] as const

/** Whole days from `iso` to `FIXTURE_TODAY`, inclusive of today. */
function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const from = new Date(y, m - 1, d)
  const today = new Date(
    FIXTURE_TODAY.getFullYear(),
    FIXTURE_TODAY.getMonth(),
    FIXTURE_TODAY.getDate(),
  )
  return Math.round((today.getTime() - from.getTime()) / 86_400_000) + 1
}

describe('the activity history agrees with the enrolment', () => {
  for (const variant of VARIANTS) {
    const persona = dashboardProgressPersonaFor('xcel', variant)!
    /* ⚠ USED ONLY FOR THE DATES. Its hours/progress are the CE profile's — see
       the minutes test. The WINDOW is the same either way, which is what makes
       `enrolledAt` safe to read here. */
    const course = persona.path.jumpBackIn!
    const days = persona.dailyMinutes!

    it(`${variant}: one bar per day the learner has had the course`, () => {
      /* THE CLAIM THE BUG BROKE. The chart cannot be longer than the
         enrolment, and it cannot be shorter either — a gap would read as days
         they did not study rather than days that have not happened. */
      expect(days.length).toBe(daysSince(course.enrolledAt!))
    })

    it(`${variant}: the minutes add up to the progress the ring shows`, () => {
      /* A learner 63% through the 40-hour pre-licensing requirement has
         studied 1,512 minutes. If the bars sum to anything else, the chart and
         the progress ring are describing two different people — and both are
         on screen at once.

         ⚠ THE QE COURSE, NOT `jumpBackIn`. A first version of this read
         `persona.path.jumpBackIn`, which on this fixture is the CE profile's
         own course (Long-Term Care Initial Training, 8 hours at 45%) — the
         education-type flag decides which path renders, and the activity chart
         lives on the QE dashboard. The test failed by a factor of seven and
         was right to: it was comparing the QE history against a CE course.
         `PROGRESS_RATIOS` is the same source the ring reads. */
      const expected =
        NY_PRODUCER_HOURS_INVENTED.preLicenseEducation * 60 * PROGRESS_RATIOS[variant].m
      const actual = days.reduce((a, b) => a + b, 0)
      expect(actual).toBe(Math.round(expected))
    })

    it(`${variant}: today states one number, not two`, () => {
      /* `FIXTURE_TODAY` is a Monday, so today is the ONLY day the 30-day array
         and the Mon-first week array overlap. Where they touch they have to
         agree, or the same evening is two lengths on one card. */
      expect(days[days.length - 1]).toBe(persona.weekMinutes![0])
    })

    it(`${variant}: nobody studies more than a day holds`, () => {
      for (const m of days) expect(m).toBeLessThanOrEqual(16 * 60)
    })
  }

  it('says nothing at all where it cannot say something true', () => {
    /* `complete-100` carries `MAX_DEMO_DAYS_LEFT` with the course finished,
       which works out to one day of access — a 40-hour course completed the
       day it was opened. That is a pre-existing oddity in the persona, and an
       activity chart cannot draw it honestly, so there is no history and no
       streak. Pinned so that "add the missing one" is a decision about the
       persona rather than a tidy-up. */
    expect(dashboardProgressPersonaFor('xcel', 'complete-100')?.dailyMinutes).toBeUndefined()
  })
})
