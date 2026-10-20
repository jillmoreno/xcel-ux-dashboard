import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { clearExamDate, readExamDate, writeExamDate } from '@/data/examDateStore'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { formatPaceDateLong, isoPlusDays } from '@/lib/studyPace'

/**
 * ADD DATE, WIRED — 2026-10-20, Jillienne: "now wire the add date button on the
 * jill version".
 *
 * ⚠ WHAT IS PINNED IS THE ROUND TRIP, not the calendar. `main`'s Home accepts an
 * exam date and refuses to act on it, because it owns neither prompt and a date
 * it cannot show or clear dead-ends the pace card. This version earns the date
 * back by being able to take it, print it and remove it — so the cases below
 * are exactly those three plus the consequence, and a regression in any one of
 * them puts the baseline's bug back on a page that now has no excuse for it.
 */
afterEach(() => {
  cleanup()
  clearExamDate()
})
beforeEach(clearExamDate)

function renderHome(version = 'jill-atlas-main') {
  window.history.replaceState({}, '', '/dashboard-rebrand')
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&version=${version}`]}>
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

describe('the Add Date prompt on Jill/Atlas-Main', () => {
  /* ⚠ THE CARD IS THE DEFAULT PROMPT HERE (2026-10-20) — no `?journey=full`,
     and no pill above the steps. Both were true a few hours earlier; the mock
     put the whole exam question inside Step 2. */
  it('asks inside Step 2, on a bare route', () => {
    renderHome()
    expect(screen.getByText('When is your exam?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add Date' })).toBeTruthy()
    expect(screen.queryByText('Do you know your state exam date?')).toBeNull()
  })

  it('opens the Figma calendar — on the DEMO clock, not the wall clock', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Add Date' }))
    /* `AtlasExamCalendar`'s footer, which is how we know it is that grid and
       not `ExamScheduleWidget`'s ("Save exam date"). */
    expect(screen.getByRole('button', { name: 'Set Exam Date' })).toBeTruthy()
    /* ⚠ THE CASE THE MOCK COULD NOT SHOW, and the reason the clock is a prop.
       The calendar defaults to `new Date()` — Eric's card still does — and on
       this page that opened October 2026 over a pace model anchored to May. */
    const month = FIXTURE_TODAY.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    expect(screen.getByRole('grid', { name: month })).toBeTruthy()
  })

  it('writes the picked day to the store, and prints it back', () => {
    /* ⚠ 14 DAYS, SO IT IS IN THE MONTH THE PICKER OPENS ON. It seeds from
       `today` (the fixture, 2026-05-11), so anything past May would need the
       month arrows first — a different test from this one, which is about the
       round trip to the store. */
    const iso = isoPlusDays(FIXTURE_TODAY, 14)
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Add Date' }))
    /* ⚠ THE LABEL IS BUILT FROM PARTS HERE, and importing a `longDate` is the
       trap this comment exists to mark. The picker labels a day "Monday, May
       25, 2026" using its OWN local `longDate` (`ExamScheduleWidget`, built
       from `iso.split('-')`, per the rule `examDateStore` and `studyPace` both
       state). The exported `longDate` in `learningPathsHomeUtil` does
       `new Date(value)`, which parses ISO as UTC and renders the day BEFORE in
       any western timezone — so matching with it picked the cell one to the
       left and this test failed with '2026-05-24' against '2026-05-25',
       looking exactly like an off-by-one in the wiring. It was not. */
    const [yy, mm, dd] = iso.split('-').map(Number)
    const label = new Date(yy, mm - 1, dd).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    /* ⚠ `gridcell`, NOT `button`. `AtlasExamCalendar` gives each day
       `role="gridcell"` inside a `role="grid"` — the Figma card's own
       accessibility shape, which `ExamScheduleWidget`'s picker does not use. */
    const day = screen.getByRole('gridcell', { name: label })
    fireEvent.click(day)
    fireEvent.click(screen.getByRole('button', { name: 'Set Exam Date' }))
    expect(readExamDate()).toBe(iso)
    /* The third screen: the prompt becomes a finished STOP on Step 2. */
    expect(screen.getByText('Scheduled')).toBeTruthy()
    /* Split across two spans like the pace row — the date, then the count. */
    expect(
      screen.getByText(
        (_t, el) => /\|\s+\d+ Days$/.test(el?.textContent?.trim() ?? '') &&
          (el?.textContent ?? '').startsWith(label),
      ),
    ).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy()
  })

  /* ⚠ ONE SUBTRACTION, PRINTED TWICE — the defect visible inside the mock,
     where one date read "29 Days" in Step 2 and "18 days" on the pace card
     because the two were counted off different clocks. */
  it('counts the days once, for both places that print them', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 18))
    renderHome()
    expect(screen.getByText(/\|\s+18 Days/)).toBeTruthy()
    expect(screen.getByText(/FLORIDA STATE EXAM/)).toBeTruthy()
    /* ⚠ A FUNCTION MATCHER: the pace row draws the date and its note as two
       spans (`expected`'s own shape), so the string exists only once they are
       joined — a plain regex looks for it inside one element and misses. */
    const row = screen.getByText(
      (_t, el) =>
        el?.textContent?.trim() ===
        `${formatPaceDateLong(isoPlusDays(FIXTURE_TODAY, 18))} · 18 days`,
    )
    expect(row).toBeTruthy()
  })

  /* ⚠ THE CASE THAT ENTITLES THE PAGE TO READ THE DATE AT ALL. Without Remove
     this Home would be acting on an input it cannot undo, which is the whole of
     the bug `main`'s copy was fixed for — so this is not a convenience test. */
  it('removes it again, and the prompt comes back', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 40))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(readExamDate()).toBeNull()
    expect(screen.getByRole('button', { name: 'Add Date' })).toBeTruthy()
  })

  /* ⚠ AND THE CONSEQUENCE, WHICH IS CORRECT HERE AND WRONG ON MAIN. An exam
     inside the review buffer means no pace fits, and this page may say so
     because Remove is sitting beside the date that caused it. The same input on
     `eric-atlas-e2e` is refused — see `AtlasHomeExamDate.test.tsx`. */
  it('lets a too-close exam bind the pace card — with a way out beside it', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 8))
    renderHome()
    expect(screen.getByText(/Not enough time before your exam/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy()
  })

  it('…while the End-to-End Demo still refuses the same date', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 8))
    renderHome('eric-atlas-e2e')
    expect(screen.queryByText(/Not enough time before your exam/)).toBeNull()
    expect(screen.getByText(/Week Goal/)).toBeTruthy()
  })

  /* ⚠ THE PILL IS NOT ON THIS VERSION ANY MORE, and is not deleted either — it
     is Eric's position, exported and unreferenced, one line from returning.
     `AtlasCompassSeam.test.tsx` is what guards it where it still draws. */
  it('does not also ask in the pill above the steps', () => {
    renderHome()
    expect(screen.queryByRole('button', { name: /Not Yet/ })).toBeNull()
  })

  /* ⚠ THE JOURNEY IS ONE TREATMENT, NOT THREE CHANGES — 2026-10-20, after
     Jillienne caught Step 3. Making Step 2 draw the exam card unconditionally
     left Step 3 and the State Requirements button on `?journey=full`, so a bare
     visit got the walk's Step 2 beside the non-walk Step 3 — a shape neither
     the demo nor either mock has ever had. These two cases are the halves that
     have to move together. */
  it('draws the walk’s Step 3 — a stop, not a recitation', () => {
    renderHome()
    /* ⚠ SCOPED TO THE STEP. "Applying for a License" is also a Quick Links
       row, so an unscoped query matches two and tells you nothing about which
       shape Step 3 is in. */
    const step3 = within(screen.getByRole('region', { name: 'Get Licensed in Florida' }))
    expect(step3.getByText('Applying for a License')).toBeTruthy()
    expect(step3.queryByText(/Apply online, then submit/)).toBeNull()
    /* ⚠ THE JOURNEY'S BUTTON IS STATE-PREFIXED ("Florida State
       Requirements"); Quick Links carries a plain "State Requirements" row
       that stays either way. A loose matcher catches the wrong one and the
       case can never pass. */
    expect(screen.queryByRole('button', { name: 'Florida State Requirements' })).toBeNull()
  })

  it('…while the End-to-End Demo keeps the recitation on a bare route', () => {
    renderHome('eric-atlas-e2e')
    const step3 = within(screen.getByRole('region', { name: 'Get Licensed in Florida' }))
    expect(step3.getByText(/Apply online, then submit/)).toBeTruthy()
    expect(screen.getByText(/150 scored questions/)).toBeTruthy()
  })
})
