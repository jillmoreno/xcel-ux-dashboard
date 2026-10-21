import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { clearExamDate, writeExamDate } from '@/data/examDateStore'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { isoPlusDays } from '@/lib/studyPace'

/**
 * THE ATLAS HOME NEVER OPENS ON "NO PACE FITS" — 2026-10-20, Jillienne, after
 * Home greeted her with "Not enough time before your exam" on a course with a
 * month of access left.
 *
 * ⚠ THE INPUT WAS INVISIBLE, which is what made it a bug rather than a state.
 * `cgp.examDate` is per-browser and authored by the COMPASS surfaces; this
 * Home has no control over it — both of its exam prompts are decoration and
 * say so in their own notes. So a date typed in Compass weeks earlier broke
 * the pace card permanently, on that browser only, with the page still asking
 * "When is your exam?" underneath the message about the answer.
 *
 * The case below is the one that would have caught it: the stored date is set
 * to the value that reproduces the report — eight days out, so coursework
 * would have to finish tomorrow — and Home is expected to show a plan anyway.
 */
afterEach(() => {
  cleanup()
  clearExamDate()
})

beforeEach(clearExamDate)

function renderHome() {
  window.history.replaceState({}, '', '/dashboard-rebrand')
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&version=eric-atlas-e2e']}>
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

describe('the Atlas Learning Home and the stored exam date', () => {
  it('opens on a pace when nothing is stored — the committed default', () => {
    renderHome()
    expect(screen.getByText(/Week Goal/)).toBeTruthy()
    expect(screen.queryByText(/No study pace fits/)).toBeNull()
  })

  /* ⚠ EIGHT DAYS IS THE REPORTED CASE, not a round number: `EXAM_BUFFER_DAYS`
     is 7, so the coursework ceiling lands tomorrow and no pace can fit it.
     Before the fix this rendered "coursework has to finish by <tomorrow>". */
  it('still opens on a pace with an exam date too close to fit', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 8))
    renderHome()
    expect(screen.queryByText(/Not enough time before your exam/)).toBeNull()
    expect(screen.queryByText(/No study pace fits/)).toBeNull()
    expect(screen.getByText(/Week Goal/)).toBeTruthy()
  })

  /* The window the pace is computed against, printed by the course head — the
     figures agreed before the exam-date change and the point is that they
     still do.

     ⚠ TWENTY-NINE, NOT THIRTY (2026-10-21). `resolveCeiling` moved onto
     `usableDaysLeft` when the course card gained its expiry tiers — the last
     day a learner can actually study in, because "finishing on the day access
     dies is not finishing" — but THIS Home's header was still counting to the
     access date, so it printed 30 over a plan built on 29. That is the very
     disagreement this case exists to catch, and it was asserting the wrong
     side of it: the header is the figure that moved, not the window. */
  it('…against the same twenty-nine-day window the course head names', () => {
    writeExamDate(isoPlusDays(FIXTURE_TODAY, 8))
    renderHome()
    expect(screen.getByText(/29 days/)).toBeTruthy()
  })
})
