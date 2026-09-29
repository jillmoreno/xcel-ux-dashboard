import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'

/**
 * THE EXAM-DATE CARD THAT ASKS FIRST — `exam-step-style: ask-first`, 2026-09-29.
 *
 * The third arm of the flag and, as of this commit, its default. What these pin
 * is the sequence, because the sequence is the variant: the card ASKS, and each
 * of the two answers leads somewhere that is still the same card.
 *
 * ⚠ THE CLOCK IS `FIXTURE_TODAY` — 2026-05-11, with no demo-day offset because
 * `beforeEach` clears the storage that offset is read from. Every date below is
 * counted from there, which is why the picker opens on May 2026 and why the
 * countdown for May 29 is 18 days. A test that hardcoded the wall clock would
 * pass today and fail tomorrow.
 */

const URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`

beforeEach(() => {
  window.localStorage.clear()
  /* ⚠ RESET THE URL TOO — `?ff=` is read from `window.location.search`, and a
     test that sets it leaves it there for every test after it. The same trap
     `ExamDateCard.test.tsx` records. */
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

const card = () => screen.getByRole('region', { name: 'Exam Date' })

describe('exam-step-style: ask-first', () => {
  it('opens on the question, with both answers available', () => {
    renderShell('exam-step-style:ask-first')
    const c = card()
    expect(within(c).getByText('Have you scheduled your state exam?')).toBeTruthy()
    expect(within(c).getByRole('button', { name: 'Yes' })).toBeTruthy()
    expect(within(c).getByRole('button', { name: 'Not yet' })).toBeTruthy()
    /* The way into the step sheet is present from the start — it is the one
       control here that is not about the learner's own date. */
    expect(within(c).getByRole('button', { name: /How to Schedule/ })).toBeTruthy()
  })

  it('“Not yet” shrinks the card but does NOT dismiss it', async () => {
    /* THE DISTINCTION THE ARM EXISTS FOR. A dismissal would be the easy build
       and the wrong one: the learner who answers "not yet" today is exactly the
       learner who books next week, and they must not have to hunt for the card
       when they do. So the question goes away and the way back in stays. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))

    const c = card()
    expect(within(c).queryByText('Have you scheduled your state exam?')).toBeNull()
    expect(within(c).getByText(/No exam date yet\? That’s okay\./)).toBeTruthy()
    expect(within(c).getByText(/register through your state’s licensing board/)).toBeTruthy()
    expect(within(c).getByRole('button', { name: /I have my exam date/ })).toBeTruthy()
  })

  it('reaches the calendar from BOTH answers', async () => {
    /* Two routes to one picker — the second is what makes "Not yet" reversible
       rather than a dead end, so it is worth pinning that they land in the same
       place. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))
    await user.click(within(card()).getByRole('button', { name: /I have my exam date/ }))
    expect(within(card()).getByRole('button', { name: /Previous month/ })).toBeTruthy()

    // …and Cancel returns to the answer it was opened from, not to the question.
    await user.click(within(card()).getByRole('button', { name: 'Cancel' }))
    expect(within(card()).getByText(/No exam date yet\? That’s okay\./)).toBeTruthy()
    expect(within(card()).queryByText('Have you scheduled your state exam?')).toBeNull()
  })

  it('“Yes” expands the calendar INSIDE the card, not over it', async () => {
    /* ⚠ A DESCENDANT of the card, which is what makes this a real check — a
       portal would still put the grid on the page and still pass a looser
       query. The same decision `date-first` made, kept deliberately so the two
       arms differ in the ASKING and nothing else. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    expect(within(card()).queryByRole('button', { name: /Previous month/ })).toBeNull()

    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    const c = card()
    expect(within(c).getByRole('button', { name: /Previous month/ })).toBeTruthy()
    // Opens on the anchored today's month, because that is when the learner is.
    expect(within(c).getByText(/May 2026/)).toBeTruthy()
  })

  it('will not offer a date that has already passed', async () => {
    /* A booked exam in the past is a data-entry slip rather than a state to
       design for — `examDateRenewal` already returns null for one, so a card
       that accepted it would show a countdown the rest of the page ignores. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    const c = card()
    expect(within(c).getByRole('button', { name: /May 4, 2026/ })).toHaveProperty('disabled', true)
    expect(within(c).getByRole('button', { name: /May 29, 2026/ })).toHaveProperty(
      'disabled',
      false,
    )
  })

  it('saves to the SHARED store and turns into a countdown', async () => {
    /* The point of asking at all. The date goes to `examDateStore`, which is
       what re-points the Target Exam Date and the Study Pace tile — a date this
       card kept to itself would be a control that does nothing. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))

    expect(window.localStorage.getItem('cgp.examDate')).toBe('2026-05-29')
    const c = card()
    // The question is spent, so the card stops asking it.
    expect(within(c).queryByText('Have you scheduled your state exam?')).toBeNull()
    expect(within(c).getByText(/State exam$/)).toBeTruthy()
    expect(within(c).getByText('18 days')).toBeTruthy()
    expect(within(c).getByText('until your exam')).toBeTruthy()
    expect(within(c).getByRole('button', { name: /Edit/ })).toBeTruthy()
  })

  it('Save stays inert until a day is actually chosen', async () => {
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    expect(within(card()).getByRole('button', { name: 'Save exam date' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('Edit reopens the picker on the saved date, and Cancel keeps it', async () => {
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))

    const c = card()
    expect(within(c).getByText('Edit your exam date')).toBeTruthy()
    expect(within(c).getByRole('button', { name: /May 29, 2026/ })).toHaveProperty(
      'ariaPressed',
      'true',
    )

    /* Backing out of an edit must not clear the date — it returns to the
       readout it came from, which is why the picker remembers where it was
       opened from rather than always falling back to the question. */
    await user.click(within(card()).getByRole('button', { name: 'Cancel' }))
    expect(window.localStorage.getItem('cgp.examDate')).toBe('2026-05-29')
    expect(within(card()).getByText('18 days')).toBeTruthy()
  })

  it('never asks a learner who already has a date', () => {
    /* ⚠ THE STORE DECIDES THE OPENING STATE, not this component's own history.
       The date can be set on either sibling arm or the Study Plan, and a card
       that opened on "Have you scheduled your state exam?" for someone who
       plainly has would read as the product not listening. */
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell('exam-step-style:ask-first')
    const c = card()
    expect(within(c).queryByText('Have you scheduled your state exam?')).toBeNull()
    expect(within(c).getByText('18 days')).toBeTruthy()
  })

  it('applies under both journey orders', async () => {
    /* ⚠ TWO CALL SITES, the trap `ExamStepCard` exists to close: `exam-first`
       lifts this step into the promoted slot above the coursework card, and a
       branch that handled only one of them would serve this arm under one order
       and a different one under the other — an A/B measuring two things. */
    renderShell('exam-step-style:ask-first,journey-step-order:exam-first')
    const c = card()
    expect(within(c).getByText('Have you scheduled your state exam?')).toBeTruthy()
    expect(c.textContent).toContain('Step 1')
  })

  it('keeps the step sheet reachable in every state', async () => {
    /* `CtaTest` asserts `home.schedule-exam` renders unconditionally on this
       surface. It is the default arm now, so the tag has to survive all four
       states rather than just the one a fresh load happens to show. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    const tagged = () => card().querySelectorAll('[data-cta-id="home.schedule-exam"]').length

    expect(tagged()).toBe(1)
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))
    expect(tagged()).toBe(1)
    await user.click(within(card()).getByRole('button', { name: /I have my exam date/ }))
    expect(tagged()).toBe(1)
    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))
    expect(tagged()).toBe(1)
  })
})
