import { describe, it, expect } from 'vitest'
import {
  courseExpiryState,
  daysUntilIso,
  formatMilestoneDate,
  warnWindowFor,
  DEFAULT_WARN_DAYS,
} from '@/data/courseExpiry'
import {
  resolveStatusBadge,
  statusBadgeLabel,
} from '@/components/courses/courseStatusBadgeUtil'
import { myCoursesFor, FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * Axis D + the archived split. Five rules, each of which has a plausible-looking
 * wrong implementation that would pass a casual read:
 *
 *   • A completed course never warns — trivial to regress by ordering the
 *     `expiresAt` check first.
 *   • The `min()` clamp — omit it and a short-window course warns from purchase.
 *   • Date-only maths — the bug class that has hit this repo three times.
 *   • One milestone format.
 *   • Archiving destroying a status, which is why `archived` left the union.
 */

/** Deliberately NOT midnight. A time-of-day-sensitive implementation passes at
 *  00:00 and fails everywhere else, which is exactly how this gets shipped. */
const AFTERNOON = new Date(2026, 4, 11, 15, 47, 22, 500)

describe('courseExpiryState', () => {
  it('never warns on a completed course, even with a long-passed expiry date', () => {
    // Ruling 5. The deadline was MET — the date is now irrelevant. A completed
    // course keeping a passed `expiresAt` is the normal case, not an edge one.
    expect(
      courseExpiryState(
        {
          status: 'completed',
          enrolledAt: '2025-06-01',
          expiresAt: '2025-09-01', // 8 months in the past
        },
        AFTERNOON,
      ),
    ).toBe('none')
    // …and the same record NOT completed is plainly expired, so the assertion
    // above is about the status, not about the dates being unreachable.
    expect(
      courseExpiryState(
        { status: 'in-progress', enrolledAt: '2025-06-01', expiresAt: '2025-09-01' },
        AFTERNOON,
      ),
    ).toBe('expired')
  })

  it('clamps the warning window to half the enrolment window', () => {
    // A 20-day total window with the default 60-day countdown: without the
    // clamp the badge is on from the day of purchase, because 20 < 60. With it
    // the effective window is 10.
    const course = { status: 'in-progress' as const, enrolledAt: '2026-05-05', expiresAt: '2026-05-25' }
    expect(warnWindowFor(course)).toBe(10)
    // 14 days out — outside the clamped window, so no badge.
    expect(courseExpiryState(course, new Date(2026, 4, 11, 9, 30))).toBe('none')
    // 10 days out — exactly at the boundary, which is inclusive.
    expect(courseExpiryState(course, new Date(2026, 4, 15, 9, 30))).toBe('expiring-soon')
    // Sanity: the unclamped default would have warned at 14 days.
    expect(DEFAULT_WARN_DAYS).toBe(60)
  })

  it('honours a per-course warnDays in both directions', () => {
    const base = { status: 'in-progress' as const, enrolledAt: '2025-12-01', expiresAt: '2026-07-20' }
    // 70 days out. Default 60 ⇒ no badge; a 90-day countdown ⇒ badge.
    expect(courseExpiryState(base, AFTERNOON)).toBe('none')
    expect(courseExpiryState({ ...base, warnDays: 90 }, AFTERNOON)).toBe('expiring-soon')
    // And a shorter-than-default countdown suppresses one the default would show.
    const soon = { status: 'in-progress' as const, enrolledAt: '2026-01-05', expiresAt: '2026-06-25' }
    expect(courseExpiryState(soon, AFTERNOON)).toBe('expiring-soon')
    expect(courseExpiryState({ ...soon, warnDays: 14 }, AFTERNOON)).toBe('none')
  })

  it('has no state at all without an expiry date', () => {
    expect(courseExpiryState({ status: 'in-progress', enrolledAt: '2026-01-01' }, AFTERNOON)).toBe('none')
  })
})

describe('date-only maths', () => {
  it('returns the same day count regardless of the time of day', () => {
    // THE bug class this repo has been bitten by three times. `new Date(iso)`
    // parses as UTC and renders the previous day in a western timezone; mixing
    // an instant (with a time component) into the subtraction truncates the
    // partial day and reads one low at any moment after midnight.
    const target = '2026-05-25' // 14 days after 2026-05-11
    const clocks = [
      new Date(2026, 4, 11, 0, 0, 0),
      new Date(2026, 4, 11, 9, 15, 0),
      new Date(2026, 4, 11, 15, 47, 22, 500),
      new Date(2026, 4, 11, 23, 59, 59, 999),
    ]
    for (const now of clocks) expect(daysUntilIso(target, now)).toBe(14)
  })

  it('goes negative once the date has passed, and is 0 on the day itself', () => {
    expect(daysUntilIso('2026-05-11', AFTERNOON)).toBe(0)
    expect(daysUntilIso('2026-05-10', AFTERNOON)).toBe(-1)
    // Day 0 is expired, not expiring-soon: the window has closed.
    expect(
      courseExpiryState(
        { status: 'in-progress', enrolledAt: '2026-01-01', expiresAt: '2026-05-11' },
        AFTERNOON,
      ),
    ).toBe('expired')
  })
})

describe('formatMilestoneDate', () => {
  it('renders the one shared milestone format', () => {
    expect(formatMilestoneDate('2026-03-14')).toBe('03/14/2026')
    expect(formatMilestoneDate('2026-07-28')).toBe('07/28/2026')
    // Zero-padded, four-digit year — not the old `7/28/26`.
    expect(formatMilestoneDate('2026-01-05')).toBe('01/05/2026')
  })

  it('passes a malformed value straight through rather than rendering NaN', () => {
    expect(formatMilestoneDate('not-a-date')).toBe('not-a-date')
  })
})

describe('the status badge', () => {
  it('resolves at most one badge, in the stated order', () => {
    // failed → expired → expiring-soon → completed.
    expect(resolveStatusBadge('failed', 'expired')).toBe('failed')
    expect(resolveStatusBadge('in-progress', 'expired')).toBe('expired')
    expect(resolveStatusBadge('in-progress', 'expiring-soon')).toBe('expiring-soon')
    expect(resolveStatusBadge('completed', 'none')).toBe('completed')
    expect(resolveStatusBadge('in-progress', 'none')).toBeNull()
    expect(resolveStatusBadge('not-started', 'none')).toBeNull()
  })

  it('leads with completion, not expiry, and singularises at one day', () => {
    // CONFIRMED 2026-09-05. The slice-1 build prompt asked for "Expires in {n}
    // Days"; the spec (§4a ruling 1, §6) says `{n} Days to Complete` and names
    // the other string as the one it replaces. The spec won.
    expect(statusBadgeLabel('expiring-soon', 12)).toBe('12 Days to Complete')
    expect(statusBadgeLabel('expiring-soon', 1)).toBe('1 Day to Complete')
    // The negative matters as much as the positive. What is banned is the
    // "Expires in…" FRAMING — it points at a date, and the two other clocks a
    // learner is under (licence renewal, credit reporting) already own that
    // word. The past-tense state name `Expired` is fine and is what §4a
    // specifies for the expired badge, so the assertion targets "expires"
    // rather than the stem. Swept across every state so a revert fails with a
    // message that names the rule instead of just a changed string.
    for (const state of ['completed', 'expiring-soon', 'expired', 'failed'] as const) {
      expect(
        statusBadgeLabel(state, 12),
        `${state} badge must not use the "Expires in…" framing`,
      ).not.toMatch(/expires/i)
    }
    expect(statusBadgeLabel('expired')).toBe('Expired')
  })
})

describe('archived keeps its status (decisions 33-34)', () => {
  const failedArchived = myCoursesFor('xcel').find((c) => c.id === 'mc-ga-license-law-2')

  it('has a real status alongside the archived flag, not instead of it', () => {
    // The old model stored `archived` INSIDE `myStatus`, so setting it
    // overwrote the status. This record is the regression case.
    expect(failedArchived).toBeDefined()
    expect(failedArchived?.archived).toBe(true)
    expect(failedArchived?.myStatus).toBe('failed')
  })

  it('resolves to the Failed badge and a `Failed:` row exactly as if it were not archived', () => {
    const record = failedArchived!
    const expiry = courseExpiryState(record, FIXTURE_TODAY)
    const badge = resolveStatusBadge(record.status, expiry)
    expect(badge).toBe('failed')
    expect(statusBadgeLabel(badge!)).toBe('Failed')
    expect(record.score).toBe(58)

    // The same record with `archived` stripped resolves identically — which is
    // the whole of decision 33: archiving changes NOTHING about the card.
    const unarchived = { ...record, archived: false }
    expect(courseExpiryState(unarchived, FIXTURE_TODAY)).toBe(expiry)
    expect(resolveStatusBadge(unarchived.status, expiry)).toBe(badge)
  })

})

describe('the fixture set covers every state the card can now express', () => {
  const cre = myCoursesFor('xcel')
  const stateOf = (id: string) => {
    const r = cre.find((c) => c.id === id)!
    return courseExpiryState(r, FIXTURE_TODAY)
  }

  it('has one record in each expiry state, anchored to FIXTURE_TODAY', () => {
    expect(stateOf('mc-cre-1031-exchange')).toBe('expiring-soon')
    expect(stateOf('mc-cre-broker-prelicense')).toBe('expiring-soon')
    expect(stateOf('mc-cre-commercial-leasing')).toBe('expired')
    // Shorter-than-default countdown ⇒ no badge, though 45 days out.
    expect(stateOf('mc-cre-property-management')).toBe('none')
  })

  it('has a failed record with a score AND one without', () => {
    const withScore = cre.find((c) => c.id === 'mc-cre-appraisal-basics-exam')!
    const without = cre.find((c) => c.id === 'mc-cre-contracts-assessment')!
    expect(withScore.myStatus).toBe('failed')
    expect(withScore.score).toBe(62)
    expect(without.myStatus).toBe('failed')
    expect(without.score).toBeUndefined()
    // The badge renders either way — the score only affects the status row.
    expect(resolveStatusBadge(without.status, 'none')).toBe('failed')
  })

})
