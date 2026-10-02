import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'

/**
 * WHAT IS LEFT OF `exam-step-style` — retired 2026-09-29.
 *
 * ⚠ THIS FILE USED TO BE THE `date-first` SUITE, and inverting it rather than
 * deleting it is deliberate. It held seven tests over the reworked `ExamDateCard`
 * — the heading as a label, the dropped fee line, the month selector opening
 * INSIDE the card, the card quietening once a date was set — plus the guard on
 * which arm was the baseline, which fired twice as the default moved
 * (`inline` → `date-first` → `ask-first`).
 *
 * `ask-first` won and became unconditional, so the flag had one option left and
 * a picker with one option is a label. `ExamDateCard.tsx` and the inline
 * `ExamDateCapture` are both intact and unreachable; `archivedItems.ts`
 * (`exam-step-style-alternatives`) carries the re-wire.
 *
 * WHAT THIS FILE PINS NOW is only the retirement — that the flag is gone and
 * neither retired card renders. The surviving card's own behaviour lives in
 * `ExamScheduleWidget.test.tsx`, which is where it always lived.
 *
 * ⚠ RESTORING THE FLAG MEANS RESTORING THE OLD TESTS FROM GIT, not rewriting
 * them from this description. They are one `git show` away on the commit that
 * removed them, and they encode decisions made on a copy bench that this file
 * no longer records.
 */

const URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`

beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState({}, '', '/')
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

function renderShell(ff?: string) {
  window.history.replaceState({}, '', ff ? `/dashboard-rebrand?ff=${encodeURIComponent(ff)}` : '/')
  return render(
    <MemoryRouter initialEntries={[URL]}>
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

describe('exam-step-style — retired', () => {
  it('is gone from the catalog entirely', () => {
    /* ⚠ THE CATALOG ENTRY IS THE ONE THAT BITES, per the archive convention: a
       variant pulled from the catalog while its fixtures stay wired type-checks,
       passes, and silently falls back to the default. Asserting the key's
       ABSENCE is what makes the retirement a fact rather than an intention. */
    expect(FEATURE_FLAGS.find((f) => f.key === 'exam-step-style')).toBeUndefined()
  })

  it('renders the surviving card, and neither retired one', () => {
    renderShell()
    expect(screen.getByRole('region', { name: 'Exam Date' })).toBeTruthy()
    // `inline` — the shipped card, by its own region name and its fee line.
    expect(screen.queryByRole('region', { name: 'Schedule State Exam' })).toBeNull()
    expect(screen.queryByText(/\$40 exam fee/)).toBeNull()
    // `date-first` — by the CTA only it had.
    expect(screen.queryByRole('button', { name: 'Enter exam date' })).toBeNull()
  })

  it('cannot be brought back with a stored `?ff=` value', () => {
    /* ⚠ THE CASE A CATALOG REMOVAL ALONE DOES NOT COVER, and the reason this
       test exists rather than the one above standing alone. Reviewers' URLs and
       `cgp.featureFlags` entries outlive the flag, so a stale `?ff=` is the
       realistic way a retired arm would appear to come back. It resolves to
       nothing now — the card does not branch on the variant at all. */
    renderShell('exam-step-style:date-first')
    expect(screen.getByRole('region', { name: 'Exam Date' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Enter exam date' })).toBeNull()

    renderShell('exam-step-style:inline')
    expect(screen.queryByRole('region', { name: 'Schedule State Exam' })).toBeNull()
  })
})
