import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { clearExamDate, examDateRenewal, readExamDate, writeExamDate } from '@/data/examDateStore'
import { timeRemainingText } from '@/components/learning/learningPathsHomeUtil'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * THE LEARNER'S BOOKED EXAM DATE — 2026-09-21, the direct ask on the Schedule
 * State Exam card: *"Already scheduled? Enter the exam date and we will use
 * that to help you prep!"*
 *
 * The SECOND half of that sentence is what these tests are about. A field that
 * only remembered what you typed would be the Membership Plan card's defect —
 * a control that looks like it does something. What makes it earn its place is
 * that the date re-points the page's Target Exam Date and everything derived
 * from it, so the assertions here are cross-surface rather than about the
 * input.
 */

const TESTING_URL = '/dashboard-rebrand?version=discoverability-testing'

function renderShell(url = TESTING_URL) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Pin ONE pacing treatment. Needed as of 2026-09-21: these are cross-surface
 *  claims about what the Study Pace tile says, and the tile now has five
 *  treatments that say it differently — so a test that leaves the choice to the
 *  flag's default is really asserting whichever treatment last won that vote. */
function seedPacing(variant: string) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'dashboard-pacing-style': { enabled: true, variant } }),
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  clearExamDate()
})

describe('examDateRenewal', () => {
  it('counts from FIXTURE_TODAY, not the wall clock', () => {
    // Every date-driven surface in this app is anchored to 2026-05-11.
    // Measuring against the real today would put the countdown months out and
    // make the Study Pace tile disagree with the Study Plan.
    const fifty = new Date(FIXTURE_TODAY)
    fifty.setDate(fifty.getDate() + 50)
    const iso = `${fifty.getFullYear()}-${String(fifty.getMonth() + 1).padStart(2, '0')}-${String(fifty.getDate()).padStart(2, '0')}`
    expect(examDateRenewal(iso)?.weeksLeft).toBeCloseTo(50 / 7, 5)
  })

  it('emits M/D/YYYY, never the ISO string it was given', () => {
    /* `longDate` parses this, and its own note records that the two shapes it
       accepts parse in LOCAL time "so there is no UTC off-by-one to defend
       against". An ISO-8601 string parses as UTC and would print the day BEFORE
       for anyone west of Greenwich — the exact off-by-one that note relies on
       the format to avoid. */
    expect(examDateRenewal('2026-06-30')?.deadline).toBe('6/30/2026')
  })

  it('refuses a date at or before the fixture today', () => {
    // A negative countdown renders "0 days" beside a required rate of infinity,
    // and a booked exam in the past is a data-entry slip rather than a state to
    // design for. Falls back to the persona instead.
    expect(examDateRenewal('2026-05-11')).toBeNull()
    expect(examDateRenewal('2020-01-01')).toBeNull()
    expect(examDateRenewal(null)).toBeNull()
  })

  it('ignores a malformed stored value', () => {
    writeExamDate('not-a-date')
    expect(readExamDate()).toBeNull()
  })
})

describe('the entered date moves the whole page, not just the card', () => {
  /** The course header band's Target Exam Date, as rendered. */
  const targetDate = () =>
    /([A-Z][a-z]+ \d{1,2}, \d{4})/.exec(
      screen.getByText(/Target exam date/i).parentElement?.parentElement?.textContent ?? '',
    )?.[1]

  it('re-points the Target Exam Date', () => {
    writeExamDate('2026-06-30')
    renderShell()
    expect(document.body.textContent).toMatch(/June 30, 2026/)
    // …and the persona's own date is gone, rather than both being on screen.
    expect(document.body.textContent).not.toMatch(/December 15, 2026/)
    expect(targetDate()).toBe('June 30, 2026')
  })

  it('re-points the countdown AND the pacing rate together', () => {
    // The cross-surface half. The header's remaining-time cell and the Study
    // Pace tile both derive from the same `weeksLeft`, so a date that moved one
    // and not the other would be the disagreement `ProgressAgreement.test.tsx`
    // exists to catch.
    //
    // SEEDS `runway` EXPLICITLY as of 2026-09-21. The claim is about a tile
    // that states remaining time in the PATH's units, which is what `runway`
    // does — it rode on the flag's default until that default moved to
    // `presets`, a treatment that expresses the same fact as a DATE and so can
    // never contain a week count. The test below carries the presets half.
    writeExamDate('2026-06-30')
    seedPacing('runway')
    renderShell()
    const expected = timeRemainingText(50 / 7)
    expect(document.body.textContent).toContain(expected)
    const tile = screen.getByText('Study Pace').parentElement as HTMLElement
    expect(tile.textContent).toContain(expected)
  })

  it('reaches the PRESETS card too, in its own idiom', () => {
    /* THE SAME CLAIM for the default view's treatment, and it is the one that
       was actually broken. `presets` reads `src/lib/studyPace.ts`, which takes
       the exam date as one of two ceilings — and nothing was passing it one, so
       the card priced against course access alone while the header three inches
       above it had re-pointed onto the booked exam.

       Harmless only while the exam sat OUTSIDE the access window, where access
       binds and the card was right for the wrong reason. Asserted with an exam
       INSIDE it, where the card must switch ceilings and say so — the silent
       switch `binding` exists to prevent.

       Expressed as a date rather than a week count, because that is this
       treatment's whole argument: it states the outcome, not the quantity. */
    writeExamDate('2026-05-31')
    seedPacing('presets')
    renderShell()
    const tile = screen.getByText(/^Study Pace/).parentElement as HTMLElement
    expect(tile.textContent).toMatch(/before your exam on May 31/)
    // …and it stops naming access, which is no longer the binding ceiling.
    expect(tile.textContent).not.toMatch(/before access ends/)
  })

  it('does not read a booked exam date as the learner adjusting the pace', () => {
    /* A date the learner booked on the Schedule State Exam card is something
       the product was TOLD, not something they changed on this tile. Counting
       it as an adjustment would open a fresh page on "· yours" with the
       provenance clause already suppressed — both of which say the opposite of
       what just happened. It is compared to its SEED, not to null. */
    writeExamDate('2026-05-31')
    seedPacing('presets')
    renderShell()
    const tile = screen.getByText(/^Study Pace/).parentElement as HTMLElement
    expect(tile.textContent).toMatch(/· recommended/)
    expect(tile.textContent).toMatch(/not from a guess/)
  })

  it('states the remaining time in ONE unit across both surfaces', () => {
    /* The tile printed raw days while the header used the shared formatter, so
       past 30 days they read "50 days to go" and "7 wks" three inches apart —
       the same fact in two units. Asserted as agreement rather than as a
       string, so either surface may reword.

       `runway` BY NAME, for the reason the test above records: this is a claim
       about the treatment that states remaining TIME, and it stopped being the
       default on 2026-09-21. `presets` states a finish date instead, so it has
       no unit to disagree in — which is not this test passing, it is this test
       not applying. */
    writeExamDate('2026-06-30')
    seedPacing('runway')
    renderShell()
    const tile = screen.getByText('Study Pace').parentElement as HTMLElement
    expect(tile.textContent).not.toMatch(/\d+ days to go/)
    expect(tile.textContent).toMatch(/wks to go/)
  })

  it('falls back to the persona with nothing stored', () => {
    // The demo is unchanged until someone types a date, and clearing restores
    // it — which is what makes a per-browser override safe to ship.
    renderShell()
    expect(targetDate()).toBe('December 15, 2026')
  })
})

describe('the capture on the Schedule State Exam card', () => {
  const card = () =>
    document.querySelector('section[aria-label="Schedule State Exam"]') as HTMLElement

  it('offers the field with the ask’s own invitation', () => {
    renderShell()
    expect(within(card()).getByLabelText(/Already scheduled\?/i)).toBeTruthy()
  })

  it('saves a typed date and shows it back, with a way out', () => {
    renderShell()
    const input = within(card()).getByLabelText(/Already scheduled\?/i)
    fireEvent.change(input, { target: { value: '2026-06-30' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(readExamDate()).toBe('2026-06-30')
    // Shown back, spelled out — a value that silently overrides the page's
    // headline figure has to be visible and reversible.
    expect(within(card()).getByText('June 30, 2026')).toBeTruthy()
    expect(within(card()).getByRole('button', { name: 'Change' })).toBeTruthy()
    expect(within(card()).getByRole('button', { name: 'Clear' })).toBeTruthy()
  })

  it('appears on the Schedule card ONLY', () => {
    // It is that step's own affordance, not a page-level control — the other
    // two cards describe things the learner does not book.
    renderShell()
    expect(screen.getAllByLabelText(/Already scheduled\?/i)).toHaveLength(1)
  })
})

describe('timeRemainingText rounds its weeks', () => {
  it('never prints a fractional week', () => {
    /* It printed "7.142857142857143 wks" — raw `weeksLeft` in the weeks branch.
       Invisible until now because a FRACTIONAL value under 30 days takes the
       rounded `days` branch, so the only way into this one was a whole number.
       A learner-entered date produced the first fractional value past 30 days.
       This function's own docstring describes that exact failure at the three
       call sites it was extracted to fix — it had the same bug one branch in. */
    expect(timeRemainingText(50 / 7)).toBe('7 wks')
    expect(timeRemainingText(27 / 7)).toBe('27 days')
    expect(timeRemainingText(60)).not.toMatch(/\./)
  })
})
