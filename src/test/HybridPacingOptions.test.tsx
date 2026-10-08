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

/* ⚠ READS `data-pace-label`, NOT THE ROW. The rows gained a per-day sub-line on
   2026-10-07 ("1 Week / about 5¾ hrs/day") and every list assertion below broke
   at once, because they were matching the whole `textContent`. These tests are
   about WHICH OPTIONS are offered; the copy inside a row is a separate
   question, and reading the label element keeps the two from failing together. */
const labels = () =>
  [...options()].map((o) => (o.querySelector('[data-pace-label]')?.textContent ?? '').trim())
const checked = () =>
  [...options()]
    .find((o) => o.getAttribute('aria-checked') === 'true')
    ?.querySelector('[data-pace-label]')
    ?.textContent?.trim()

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
    /* ⚠ THE COPY MOVED FOUR TIMES IN ONE DAY AND THIS TEST CAUGHT IT LATE. It
       asserted "How quickly would you like to complete this course?", which
       became "Set your preferred pace to get started…", then "Pick the pace
       that feels right for you…", then the question again — all on 2026-10-07.
       The failure sat unseen for an hour because another session was editing
       the same working tree and several unrelated suites were failing, so the
       suite's number had stopped meaning anything.

       ⚠ SO THE ASSERTION IS NARROWER NOW, deliberately: it matches the one
       phrase the line exists to carry — that the choice is not final — rather
       than a sentence that has changed four times. Copy churn should fail this
       test only when the MEANING goes, not when the wording moves. (The sibling
       test below does pin the question's wording, but only to tell the two
       paragraphs apart — it is about their ORDER.) */
    renderPacing()
    expect(screen.getByText(/adjust your goal/i)).toBeTruthy()
    /* And it is not the restricted message, which is the thing this arm is
       distinguishing itself from. ⚠ Matched on the new phrasing — the
       one-option line became "Based on your <date> exam date, a 1-week pace
       will help you finish in time" on 2026-10-07, and the old matcher would
       have gone on passing against a sentence nothing renders. */
    expect(screen.queryByText(/a 1-week pace will help you finish/i)).toBeNull()
  })

  it('splits that invitation around the options', () => {
    /* 2026-10-07, the direct ask: "the You can always adjust… part of this
       copy, move to the bottom of the options to split up this text more."

       ⚠ TWO PARAGRAPHS, NOT ONE, AND IN THIS ORDER. They do different jobs —
       the lead ASKS what the rows answer (they otherwise never say a week of
       WHAT), and the note reassures about a choice, which only means anything
       once there is one to have made. A later tidy that rejoins them
       loses that, and rejoining them reads as formatting rather than as a
       reversal, so the ORDER is what this pins rather than the wording. */
    renderPacing()
    const group = screen.getByRole('radiogroup', { name: /Set your study pace/i })
    const lead = screen.getByText(/How quickly would you like to complete/i)
    const note = screen.getByText(/adjust your goal/i)
    expect(lead).not.toBe(note)
    /* `compareDocumentPosition` rather than reading the parent's children:
       it says "earlier in the document" without pinning how deep either sits,
       which is the part that is allowed to change. */
    expect(lead.compareDocumentPosition(group) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(group.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('drops the reassurance when the exam date narrows the list', () => {
    /* ⚠ THE RESTRICTED MESSAGES END ON THEIR OWN ESCAPE HATCH ("change your
       exam date and this will adjust"), so a second, more relaxed promise
       under the options would undercut the constraint just explained. */
    renderPacing(inDays(8))
    expect(screen.queryByText(/adjust your goal/i)).toBeNull()
  })

  it('names the exam date and the pace it recommends when only one is left', () => {
    /* ⚠ THE HALF OF THE ASK THAT IS NOT ARITHMETIC — "the text will need to
       update to explain why they only have the 1 option". Three options
       becoming one is a loss the learner can see and cannot account for, and an
       unexplained constraint reads as a defect rather than a deadline.

       ⚠ THE LINE LEADS WITH THE RECOMMENDATION NOW, not the constraint —
       2026-10-07, the direct ask, which supplied the sentence whole. It was
       "Your exam is May 19, 8 days away, so one week is the only pace that
       finishes in time." The DATE is still named, because it is the reason;
       the distance is not, because the rows below carry the per-day load, which
       is the number that costs the learner something. */
    renderPacing(inDays(8))
    const p = screen.getByText(/a 1-week pace will help you finish in time/i)
    expect(p.textContent).toMatch(/May 19/)
    expect(p.textContent).toMatch(/Change your exam date to see how your recommended pace changes/)
    /* ⚠ AND NO DISTANCE. Keeping both would have said the same constraint
       twice in one sentence. */
    expect(p.textContent).not.toMatch(/days away/)
  })

  it('uses the plural wording when two are left', () => {
    /* A different sentence, not the same one with a number swapped: "one week
       is the only pace" is false at two options and would be the kind of copy
       bug nothing fails on. */
    renderPacing(inDays(16))
    expect(screen.getByText(/longer paces would finish after it/i)).toBeTruthy()
  })

  it('⚠ no longer prints a distance at all, singular or otherwise', () => {
    /* THIS TEST USED TO PIN `"1 day" rather than "1 days"`, which was a real
       guard while the one-option message read "…, 1 day away, so…". That
       message stopped printing a distance on 2026-10-07.

       ⚠ THE SINGULAR GUARD IS NOW UNREACHABLE rather than removed, and it is
       kept in `examWhen` deliberately: "1 day away" could only ever render in
       the ONE-option message, and two options require the exam to be 14 days
       out or more. Inverted rather than deleted so the day this changes back,
       something fails and the guard gets re-tested instead of being trusted. */
    renderPacing(inDays(1))
    const p = screen.getByText(/a 1-week pace will help you finish in time/i)
    expect(p.textContent).not.toMatch(/day away|days away/)
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
    /* Same reason as `labels()` above — the row's own text now carries the
       sub-line, so the option is found by its label element. */
    fireEvent.click(
      [...options()].find((o) => o.querySelector('[data-pace-label]')?.textContent?.trim() === '3 Weeks')!,
    )
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

describe('each option names the kind of plan it is', () => {
  /* 2026-10-07, the direct ask: "1 Week = Fast Track, 2 Weeks = Steady,
     3 Week = Relaxed."

     ⚠ THE PAIRING IS THE TEST, not the presence of three words. "1 Week" and
     "about 6 hrs/day" are both measurements; the tag is the only line saying
     what KIND of plan is being agreed to, and a tag that drifts onto the wrong
     row is a copy bug nothing else would fail on — the panel would look
     entirely reasonable calling three weeks a fast track. */
  it.each([
    ['1 Week', 'Fast Track'],
    ['2 Weeks', 'Steady'],
    ['3 Weeks', 'Relaxed'],
  ])('calls %s "%s"', (label, tag) => {
    renderPacing()
    const row = [...options()].find(
      (o) => o.querySelector('[data-pace-label]')?.textContent?.trim() === label,
    )
    expect(row?.textContent).toMatch(new RegExp(tag, 'i'))
  })

  it('⚠ keeps the tag off the in-progress panel', () => {
    /* At 0% the rows are CONTROLS and the tag helps rank them. In progress
       there is nothing to rank — the pace is settled, and the panel says
       "Complete in 2 Weeks" with the icon and no chrome (see the note there).
       A tag trailing into that line would re-introduce exactly the "this is one
       of several" reading that treatment was changed to remove. */
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&version=hybrid-pacing']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <HybridPacingHome
              path={PATH}
              courseTitle="New York Life and Health Pre-licensing"
              percent={62}
              today={TODAY}
              hoursRemaining={40}
              accessExpiresAt="2026-06-11"
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.queryByText(/Fast Track|Steady|Relaxed/i)).toBeNull()
  })
})

describe('Step 3 offers State Requirements beside How to apply', () => {
  /* 2026-10-07, the direct ask: "add another link below this that is State
     Requirements (will open the same link as the one on the right rail)."

     ⚠ THE SAME HANDLER IS THE POINT, not a second route to the same content.
     `onOpenRequirements` is one prop and both controls call it, so a change to
     where requirements open cannot reach one and miss the other. */
  function renderWithRequirements(onOpenRequirements: () => void) {
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
              onOpenRequirements={onOpenRequirements}
              /* ⚠ PASSED, because "How to apply" hangs on it and the subject
                 here is the PAIR. Without it the step renders one link and the
                 ordering assertion would pass against a list of one. */
              onOpenStep={() => {}}
              notStarted
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  const step3 = () =>
    document.querySelector('section[aria-label^="Get Licensed"]') as HTMLElement

  it('shows it under How to apply once the step is expanded', () => {
    /* ⚠ EXPANDED FIRST. The body is unmounted while the step is closed, so a
       test that forgot the click would pass its absence assertion for the
       wrong reason. */
    renderWithRequirements(() => {})
    const section = step3()
    expect(section.textContent).not.toMatch(/State Requirements/i)
    fireEvent.click(section.querySelector('button[aria-expanded]') as HTMLElement)
    const links = [...section.querySelectorAll('button')]
      .map((b) => b.textContent?.trim() ?? '')
      .filter((t) => /→$/.test(t))
    expect(links).toEqual(['How to apply →', 'State Requirements →'])
  })

  it('calls the same handler the Quick Links row does', () => {
    let calls = 0
    renderWithRequirements(() => {
      calls += 1
    })
    const section = step3()
    fireEvent.click(section.querySelector('button[aria-expanded]') as HTMLElement)
    const link = [...section.querySelectorAll('button')].find((b) =>
      /State Requirements/i.test(b.textContent ?? ''),
    )
    fireEvent.click(link as HTMLElement)
    expect(calls).toBe(1)
  })

  it('⚠ renders no second link when there is nowhere to send it', () => {
    /* `onOpenRequirements` is optional on this component. A label rendered
       without its handler would be a dead control, which is the failure the
       bundled `extra` prop exists to make impossible — this pins the call
       site honouring it. */
    renderPacing()
    const section = step3()
    fireEvent.click(section.querySelector('button[aria-expanded]') as HTMLElement)
    expect(section.textContent).not.toMatch(/State Requirements/i)
  })
})

describe('the journey eyebrow names whose journey it is', () => {
  it('reads "Step 1 · XCEL Study Journey"', () => {
    /* 2026-10-07, the direct ask. ⚠ THE BRAND IS LOAD-BEARING: steps 2 and 3
       are the STATE's process (pass the exam, apply for the licence), so
       naming step 1 as XCEL's is what marks where the product's part ends. */
    renderPacing()
    const eyebrow = screen.getByText(/Study Journey/i).closest('p')
    expect(eyebrow?.textContent).toBe('Step 1 · XCEL Study Journey')
  })
})

describe('the access countdown counts study days, not calendar days', () => {
  /* 2026-10-07, the direct ask: a bare `daysUntil` printed 31 against a June 11
     expiry on May 11, and the answer is 30.

     ⚠ IT IS NOT AN OFF-BY-ONE FUDGE. `resolveCeiling` already settles what the
     expiry date MEANS here: "Access gives its LAST USABLE DAY (expiry minus
     one) — finishing on the day access dies is not finishing." The pace presets
     below divide the remaining hours by that same figure, so a top line saying
     31 sat above an estimate built on 30 — two numbers from one date,
     disagreeing by a day, with nothing on screen to explain it. This pins the
     two to one reading. */
  const accessLine = () =>
    [...document.querySelectorAll('p')]
      .find((p) => /Access ends/.test(p.textContent ?? ''))
      ?.textContent?.replace(/\s+/g, ' ')
      .trim()

  it('says 30 days for a June 11 expiry on May 11', () => {
    renderPacing()
    expect(accessLine()).toBe('Access ends June 11 30 days')
  })

  it('⚠ floors at zero rather than going negative', () => {
    /* The subtraction reaches 0 on the last usable day and would go negative
       the day after. Zero is the honest reading — no days left to study in —
       and the expired arm is what actually renders past that point. */
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&version=hybrid-pacing']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <HybridPacingHome
              path={PATH}
              courseTitle="New York Life and Health Pre-licensing"
              percent={0}
              today={TODAY}
              hoursRemaining={40}
              /* TODAY itself: `daysUntil` is 0, so the study count is -1. */
              accessExpiresAt="2026-05-11"
              notStarted
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(accessLine()).toBe('Access ends May 11 0 days')
  })
})
