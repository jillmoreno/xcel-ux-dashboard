import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'

/**
 * THE REWORKED EXAM-DATE CARD — `exam-step-style: date-first`, 2026-09-28.
 *
 * A sibling of `LicensingStepWidget`'s Schedule State Exam treatment. Every
 * decision here was settled on a copy bench first, so what these pin is that
 * the built card matches what was agreed — and that the shipped card is
 * untouched beside it.
 */

const URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

/** ⚠ `?ff=` is read from `window.location`, never from the router entry. */
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

const card = () => screen.getByRole('region', { name: 'Exam Date' })

describe('exam-step-style', () => {
  it('ships the inline card untouched', () => {
    expect(FEATURE_FLAGS.find((f) => f.key === 'exam-step-style')?.defaultVariant).toBe('inline')
    renderShell()
    expect(screen.getByRole('region', { name: 'Schedule State Exam' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Exam Date' })).toBeNull()
    // the fee line is part of the shipped card and stays there
    expect(screen.getByText(/\$40 exam fee/)).toBeTruthy()
  })

  it('renders the reworked card on `date-first`', () => {
    renderShell('exam-step-style:date-first')
    const c = card()
    expect(within(c).getByText('Exam Date')).toBeTruthy()
    expect(
      within(c).getByText(/Already scheduled\? Enter it and we’ll use it to help you prep\./),
    ).toBeTruthy()
    expect(within(c).getByRole('button', { name: 'Enter exam date' })).toBeTruthy()
    expect(within(c).getByRole('button', { name: /How to Schedule/ })).toBeTruthy()
  })

  it('drops the fee line — it belongs in the sheet and on the state’s site', () => {
    /* The $40 is a fact about booking, and booking happens somewhere the price
       is authoritative and current, which this card never will be. */
    renderShell('exam-step-style:date-first')
    expect(within(card()).queryByText(/\$40/)).toBeNull()
  })

  it('opens the month selector INSIDE the card, not over it', () => {
    /* ⚠ SETTLED DELIBERATELY — in the card, not a sheet. Asserting the grid is
       a DESCENDANT of the card is what makes this a real check: a portal would
       still put it on the page and still pass a looser query. */
    renderShell('exam-step-style:date-first')
    const c = card()
    expect(within(c).queryByRole('button', { name: /Previous month/ })).toBeNull()
    c.querySelector<HTMLButtonElement>('button')
    userEvent.setup()
    return userEvent.click(within(c).getByRole('button', { name: 'Enter exam date' })).then(() => {
      expect(within(card()).getByRole('button', { name: /Previous month/ })).toBeTruthy()
      expect(within(card()).getByText(/June 2026/)).toBeTruthy()
    })
  })

  it('records the date and quietens the card', async () => {
    /* The whole point of the card. Once the date exists, Change date drops to
       link weight beside How to Schedule — neither is the main event any more,
       so neither wears a border. */
    const user = userEvent.setup()
    renderShell('exam-step-style:date-first')
    await user.click(within(card()).getByRole('button', { name: 'Enter exam date' }))
    await user.click(within(card()).getByRole('button', { name: /June 30, 2026/ }))

    expect(window.localStorage.getItem('cgp.examDate')).toBe('2026-06-30')
    const c = card()
    expect(within(c).getByText(/Your exam date · June 30, 2026/)).toBeTruthy()
    expect(within(c).getByRole('button', { name: 'Change date' })).toBeTruthy()
    // …and the picker closes itself once a day is chosen
    expect(within(c).queryByRole('button', { name: /Previous month/ })).toBeNull()
    // the heading is a LABEL, so it survives the state change unaltered
    expect(within(c).getByText('Exam Date')).toBeTruthy()
  })

  it('applies under both journey orders', async () => {
    /* ⚠ TWO CALL SITES. `exam-first` lifts this step into the promoted slot, so
       a branch in only one of them would give the reworked card under one order
       and the shipped one under the other — an A/B measuring two things. */
    renderShell('exam-step-style:date-first,journey-step-order:exam-first')
    const c = card()
    expect(within(c).getByText('Exam Date')).toBeTruthy()
    expect(c.textContent).toContain('Step 1')
  })
})
