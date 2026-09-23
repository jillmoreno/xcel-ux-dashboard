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

/** Was `seedPacing(variant)`, pinning one of five treatments so a cross-surface
 *  claim about the Study Pace tile could not silently re-aim at whichever
 *  treatment last won the default. `dashboard-pacing-style` was retired on
 *  2026-09-22 and `presets` is the only treatment, so there is nothing to pin —
 *  the helper is kept as a no-op seam so the tests below still say which tile
 *  they mean, and so restoring the flag is a one-function change. */
function seedPacing() {
  /* nothing to seed — the treatment is unconditional */
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
  /** The course header band's countdown, as rendered. */
  const countdown = () =>
    /(\d+ (?:days?|wks?|yrs?))/.exec(
      screen.getByText(/To complete course/i).parentElement?.textContent ?? '',
    )?.[1]

  it('re-points the page, which no longer prints the date itself', () => {
    /* REWRITTEN 2026-09-21. This asserted the header's Target Exam Date cell,
       which the direct ask ("remove") took off the row — so the page prints the
       entered date nowhere, and the claim moves to what the date still DRIVES.

       That is not a weaker feature, but it is a quieter one, and it is the half
       worth pinning now: the Schedule State Exam card promises "enter the exam
       date and we will use it to help you prep", and with no date echoed back
       the countdown IS the echo. If that stopped moving, the field would be the
       control-that-does-nothing this whole feature exists not to be. */
    writeExamDate('2026-06-30')
    renderShell()
    expect(countdown()).toBe(timeRemainingText(50 / 7))
    /* THE HEADER prints no date now — neither the entered one nor the
       persona's, which is the cell's absence rather than a fallback. Scoped to
       the header rather than the page, because the SCHEDULE STATE EXAM CARD
       still echoes the date back to the person who just typed it, and that is
       a confirmation on the control that asked for it rather than a second
       copy of the removed cell. */
    const header = screen.getByText(/To complete course/i).closest('div')!
      .parentElement!.parentElement!
    expect(header.textContent).not.toMatch(/June 30, 2026|December 15, 2026/)
    expect(
      document.querySelector('section[aria-label="Schedule State Exam"]')?.textContent,
    ).toMatch(/June 30, 2026/)
  })

  it('re-points the countdown on the page', () => {
    /* The cross-surface half, NARROWED 2026-09-22. It asserted the header's
       remaining-time cell and the Study Pace tile carried the same week count,
       by seeding `runway` — the one treatment that stated remaining time in the
       path's own units. `runway` was retired with `dashboard-pacing-style`, and
       `presets` expresses the same fact as a DATE, so there is no week count on
       the tile left to agree with.

       What survives is the header half, which is still the thing a typed date
       must move, and it is asserted through the SHARED FORMATTER rather than a
       string — which is what the second half was really protecting. The tile
       printed raw days once, so past 30 days the two read "50 days to go" and
       "7 wks" three inches apart; `timeRemainingText` is the fix, and calling
       it here means a surface that re-implements the unit still fails.

       The tile's own half of the claim is not lost either: the presets card
       states the same fact as a DATE, pinned by 'reaches the PRESETS card too,
       in its own idiom' below. */
    writeExamDate('2026-06-30')
    seedPacing()
    renderShell()
    expect(document.body.textContent).toContain(timeRemainingText(50 / 7))
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
    seedPacing()
    renderShell()
    const tile = screen.getByText(/^(?:Recommended |Your )?Study Pace$/).parentElement as HTMLElement
    expect(tile.textContent).toMatch(/Your exam is on May 31/)
    // …and it stops naming access, which is no longer the binding ceiling.
    expect(tile.textContent).not.toMatch(/Access ends on/)
  })

  it('does not read a booked exam date as the learner adjusting the pace', () => {
    /* A date the learner booked on the Schedule State Exam card is something
       the product was TOLD, not something they changed on this tile. Counting
       it as an adjustment would open a fresh page on "· yours" with the
       provenance clause already suppressed — both of which say the opposite of
       what just happened. It is compared to its SEED, not to null. */
    writeExamDate('2026-05-31')
    seedPacing()
    renderShell()
    const tile = screen.getByText(/^(?:Recommended |Your )?Study Pace$/).parentElement as HTMLElement
    /* The eyebrow, which is where the 2026-09-21 redesign moved the
       provenance — the chip that carried it went, because it said the same
       word the eyebrow says. */
    expect(tile.textContent).toMatch(/^Recommended Study Pace/)
  })

  it('falls back to the persona with nothing stored', () => {
    /* The demo is unchanged until someone types a date, and clearing restores
       it — which is what makes a per-browser override safe to ship.

       Checked through the COUNTDOWN as of 2026-09-21, for the reason the test
       above records: the header no longer prints the date, so the persona's
       own renewal shows as its week count. 27 days is December 15 measured
       from the fixture clock — the same fact this always asserted, in the only
       shape the page still states it. */
    renderShell()
    expect(countdown()).toBe(timeRemainingText(27 / 7))
  })
})

describe('the capture on the Schedule State Exam card', () => {
  const card = () =>
    document.querySelector('section[aria-label="Schedule State Exam"]') as HTMLElement

  it('offers the field with the ask’s own invitation', () => {
    renderShell()
    expect(within(card()).getByLabelText(/Already scheduled\?/i)).toBeTruthy()
  })

  it('saves a typed date and shows the Figma calendar, with a way back', () => {
    /* ⚠ THE SET STATE CHANGED SHAPE 2026-09-23 — Figma node 1195:16026, the
       direct ask. It was a caption, the date in words and two links ("Your exam
       date · June 30, 2026 · Change · Clear"). It is the tear-off calendar now,
       with the heading and the footer link carrying the state instead.

       WHAT THIS STILL PINS is the requirement the old assertion existed for and
       the new design must not quietly drop: the date is VISIBLE and the value is
       REVERSIBLE. A stored date silently re-points the page's headline figure,
       and it lives in localStorage rather than the repo, so a stale one nobody
       can see or clear is unexplainable from the source. */
    renderShell()
    const input = within(card()).getByLabelText(/Already scheduled\?/i)
    fireEvent.change(input, { target: { value: '2026-06-30' } })
    fireEvent.click(within(card()).getByRole('button', { name: 'Save' }))
    expect(readExamDate()).toBe('2026-06-30')

    // VISIBLE — the calendar's three fragments, and the date in words for the
    // accessibility tree, since the calendar itself is `aria-hidden`.
    expect(within(card()).getByText('JUNE')).toBeTruthy()
    expect(within(card()).getByText('30')).toBeTruthy()
    expect(within(card()).getByText('2026')).toBeTruthy()
    expect(card().textContent).toContain('Exam scheduled for June 30, 2026')

    // The heading and the footer link both moved. "NY", from the path — not a
    // literal, or every other jurisdiction would read New York.
    expect(within(card()).getByText('NY State Exam Scheduled')).toBeTruthy()
    const edit = within(card()).getByRole('button', { name: /Edit Exam Date/ })

    // REVERSIBLE — Edit reopens the editor, which is where Clear lives now.
    fireEvent.click(edit)
    expect(within(card()).getByLabelText(/Already scheduled\?/i)).toBeTruthy()
    fireEvent.click(within(card()).getByRole('button', { name: 'Clear' }))
    expect(readExamDate()).toBeNull()
    // …and the card is back to asking.
    expect(within(card()).queryByText('NY State Exam Scheduled')).toBeNull()
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
