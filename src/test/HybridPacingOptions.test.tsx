import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { HybridPacingHome } from '@/components/compass/HybridPacingHome'
import { learningPathsFor } from '@/data/learningFixtures'

/**
 * THE EXAM DATE NARROWS THE PACE OPTIONS — 2026-10-07, the direct ask: "if the
 * user sets an exam date, the available pacing will adjust. If date is less
 * than 14 days, the 1 week option will be the only available."
 *
 * ⚠ THESE RENDER THE COMPONENT DIRECTLY, not the shell, and that is the point.
 * `examDate` and `today` are both PROPS, so every case below is a pure
 * input — no fixture to match, no demo control to drive, no stored exam date to
 * clear between tests. Reaching this through `PlatformShell` would mean moving
 * a date in a store and hoping the band passed it through, which tests the
 * plumbing and not the rule.
 *
 * ⚠ AND THE RULE IS ARITHMETIC, SO IT IS WORTH PINNING AT ITS EDGES. "Less than
 * 14 days" has two of them — 13 and 14 — and an off-by-one there is invisible
 * on screen: the panel looks perfectly reasonable showing one option when it
 * should show two.
 */

const PATH = learningPathsFor('xcel')[0]
const TODAY = new Date('2026-05-11T12:00:00Z')

/** `today` + n days as an ISO date, so each case states its distance rather
 *  than a date the reader has to subtract. */
function inDays(n: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function renderPacing(examDate?: string) {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&version=hybrid-pacing']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <HybridPacingHome
            path={PATH}
            courseTitle="New York Life and Health Pre-licensing"
            percent={0}
            today={TODAY}
            hoursRemaining={40}
            accessExpiresAt="2026-06-11"
            examDate={examDate}
            notStarted
          />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const options = () =>
  screen
    .getByRole('radiogroup', { name: 'Set your study pace' })
    .querySelectorAll('[role="radio"]')

const labels = () => [...options()].map((o) => (o.textContent ?? '').trim())
const checked = () =>
  [...options()].find((o) => o.getAttribute('aria-checked') === 'true')?.textContent?.trim()

afterEach(cleanup)

describe('which paces the exam date leaves on offer', () => {
  it('offers all three when no exam date is set', () => {
    /* The unconstrained case, and the one that proves the filter is a filter
       rather than a truncation — without it every assertion below would pass
       against a list that was always short. */
    renderPacing()
    expect(labels()).toEqual(['1 Week', '2 Weeks', '3 Weeks'])
  })

  it('offers only 1 Week when the exam is inside 14 days', () => {
    /* The ask, stated at the distance the demo actually uses. */
    renderPacing(inDays(8))
    expect(labels()).toEqual(['1 Week'])
  })

  it.each([
    [13, ['1 Week']],
    [14, ['1 Week', '2 Weeks']],
    [20, ['1 Week', '2 Weeks']],
    [21, ['1 Week', '2 Weeks', '3 Weeks']],
  ])('at %i days away offers %j', (days, expected) => {
    /* ⚠ THE EDGES. "Less than 14" means 13 is one option and 14 is two — an
       off-by-one here renders a panel that looks entirely reasonable while
       withholding a pace the learner could have met. 21 is the same edge one
       week up: a three-week plan needs 21 days and no more. */
    renderPacing(inDays(days))
    expect(labels()).toEqual(expected)
  })

  it('never renders an empty group, even for an exam already past', () => {
    /* ⚠ THE FLOOR. Every option filters out at zero days or fewer, and "Set
       Your Study Pace" over no choices leaves a learner who cannot begin. One
       unachievable option beats none. */
    renderPacing(inDays(-3))
    expect(labels()).toEqual(['1 Week'])
  })
})

describe('what the panel says about it', () => {
  it('gives the plain invitation when nothing is constrained', () => {
    /* ⚠ THE COPY HAS MOVED TWICE AND THIS TEST CAUGHT IT LATE. It asserted
       "How quickly would you like to complete this course?" — a question —
       which became "Set your preferred pace to get started…" and then the line
       below, both on 2026-10-07. The failure sat unseen for an hour because
       another session was editing the same working tree and several unrelated
       suites were failing, so the suite's number had stopped meaning anything.

       ⚠ SO THE ASSERTION IS NARROWER NOW, deliberately: it matches the one
       phrase the line exists to carry — that the choice is not final — rather
       than a sentence that has changed three times. Copy churn should fail this
       test only when the MEANING goes, not when the wording moves. */
    renderPacing()
    expect(screen.getByText(/always adjust your goal/i)).toBeTruthy()
    /* And it is not the restricted message, which is the thing this arm is
       distinguishing itself from. */
    expect(screen.queryByText(/only pace that finishes in time/i)).toBeNull()
  })

  it('names the exam and the distance when only one pace is left', () => {
    /* ⚠ THE HALF OF THE ASK THAT IS NOT ARITHMETIC — "the text will need to
       update to explain why they only have the 1 option". Three options
       becoming one is a loss the learner can see and cannot account for, and an
       unexplained constraint reads as a defect rather than a deadline. */
    renderPacing(inDays(8))
    const p = screen.getByText(/only pace that finishes in time/i)
    expect(p.textContent).toMatch(/8 days away/)
    expect(p.textContent).toMatch(/May 19/)
  })

  it('uses the plural wording when two are left', () => {
    /* A different sentence, not the same one with a number swapped: "one week
       is the only pace" is false at two options and would be the kind of copy
       bug nothing fails on. */
    renderPacing(inDays(16))
    expect(screen.getByText(/longer paces would finish after it/i)).toBeTruthy()
  })

  it('says "1 day" rather than "1 days"', () => {
    renderPacing(inDays(1))
    expect(screen.getByText(/1 day away/)).toBeTruthy()
  })
})

describe('the selection survives the list shrinking', () => {
  it('falls back to the longest pace still on offer', () => {
    /* ⚠ THE STATE CAN OUTLIVE ITS OPTION — choose 3 weeks, then set an exam
       inside 14 days, and the stored 3 is no longer on the list. It is clamped
       on the way out rather than corrected in an effect, which would render one
       frame with nothing checked and write state during paint.
       Asserted via two renders rather than by moving a date mid-render, because
       the prop is what the shell would change. */
    renderPacing()
    fireEvent.click([...options()].find((o) => o.textContent?.trim() === '3 Weeks')!)
    expect(checked()).toBe('3 Weeks')
    cleanup()

    renderPacing(inDays(8))
    expect(checked()).toBe('1 Week')
  })

  it('keeps the middle default when two remain', () => {
    /* 2 Weeks is the default and is still available at 16 days, so nothing
       should move — the clamp must not fire when it is not needed. */
    renderPacing(inDays(16))
    expect(checked()).toBe('2 Weeks')
  })
})

describe('the estimate follows the clamped selection, not the stored one', () => {
  it('reads the one-week date when one week is all there is', () => {
    /* The failure this prevents is the nastiest shape available here: the panel
       offering one option while the line beneath it quotes the completion date
       of an option that is no longer on screen. */
    renderPacing(inDays(8))
    expect(screen.getByText(/At 1 week/)).toBeTruthy()
    expect(screen.getByText('May 18')).toBeTruthy()
  })
})
