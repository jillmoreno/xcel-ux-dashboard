import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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
  it('opens the picker — the one the Schedule State Exam widget uses', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    /* `ExamDatePicker`'s own footer. Asserting on it rather than on a grid cell
       is what makes this a test that the SHARED picker opened, not that some
       calendar did. */
    expect(screen.getByRole('button', { name: 'Save exam date' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
  })

  it('writes the picked day to the store, and prints it back', () => {
    /* ⚠ 14 DAYS, SO IT IS IN THE MONTH THE PICKER OPENS ON. It seeds from
       `today` (the fixture, 2026-05-11), so anything past May would need the
       month arrows first — a different test from this one, which is about the
       round trip to the store. */
    const iso = isoPlusDays(FIXTURE_TODAY, 14)
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
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
    const day = screen.getByRole('button', { name: label })
    fireEvent.click(day)
    fireEvent.click(screen.getByRole('button', { name: 'Save exam date' }))
    expect(readExamDate()).toBe(iso)
    expect(screen.getByText(new RegExp(formatPaceDateLong(iso)))).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy()
  })

  /* ⚠ THE CASE THAT ENTITLES THE PAGE TO READ THE DATE AT ALL. Without Remove
     this Home would be acting on an input it cannot undo, which is the whole of
     the bug `main`'s copy was fixed for — so this is not a convenience test. */
  it('removes it again, and the prompt comes back', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 40))
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(readExamDate()).toBeNull()
    expect(screen.getByRole('button', { name: 'Yes' })).toBeTruthy()
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

  it('Not Yet dismisses the prompt without storing anything', () => {
    renderHome()
    fireEvent.click(screen.getByRole('button', { name: /Not Yet/ }))
    expect(readExamDate()).toBeNull()
    expect(screen.queryByRole('button', { name: 'Yes' })).toBeNull()
  })
})
