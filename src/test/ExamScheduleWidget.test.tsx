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
import { NY_GOVERNING_AGENCY } from '@/data/nyProducerRequirements'

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
    /* The way into the exam sheets is present from the start — it is the one
       control here that is not about the learner's own date. */
    expect(within(c).getByRole('button', { name: /Exam Details/ })).toBeTruthy()
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
    /* ⚠ NO STEP NUMBER — changed 2026-09-29. This asserted "Step 1" until the
       card stopped being a step at all. `JourneyStepOrder.test.tsx` owns the
       other half: that the three real steps close up to 1-2-3 behind it. */
    expect(within(c).getByText('Quick question')).toBeTruthy()
    expect(c.textContent).not.toMatch(/Step \d/)
  })

  it('keeps Exam Details reachable in every state except edit', async () => {
    /* `CtaTest` asserts `home.schedule-exam` renders unconditionally on this
       surface. It is the default arm now, so the tag has to survive the states
       a fresh load can reach rather than just the one it opens on. EDIT MODE IS
       THE DELIBERATE EXCEPTION and is asserted separately below — a fresh load
       cannot start there, so `CtaTest` is still met. */
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

  it('swaps the footer link for a red Clear in EDIT mode only', async () => {
    /* The footer slot carries one of two things, and which one is the whole
       point: booking instructions are for someone without a date, and a
       destructive control is only coherent for someone with one. */
    const user = userEvent.setup()
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell('exam-step-style:ask-first')

    // The readout itself still points at the Exam Details menu.
    expect(within(card()).getByRole('button', { name: /Exam Details/ })).toBeTruthy()

    await user.click(within(card()).getByRole('button', { name: /Edit/ }))
    const c = card()
    const clear = within(c).getByRole('button', { name: 'Clear exam date' })
    expect(clear).toBeTruthy()
    expect(within(c).queryByRole('button', { name: /Exam Details/ })).toBeNull()
    /* RED, and specifically the THEME-AWARE token — a raw `--color-error-600`
       would stay dark red on the navy dark-theme card. `tokenContrast.test.ts`
       pins this one to AA on a card surface, so naming it here is what ties
       this control to that guarantee. */
    expect(clear.style.color).toBe('var(--color-status-error-text)')
    /* ⚠ NOT `.cre-cta-ink` — that class IS the action colour and would beat the
       inline red while still looking deliberate in the source. */
    expect(clear.className).toContain('cre-link-action')
    expect(clear.className).not.toContain('cre-cta-ink')
  })

  it('does NOT offer Clear in the picker reached from either answer', async () => {
    /* Both of those routes belong to a learner who has no date yet, so there is
       nothing to clear and the Exam Details menu is the more useful offer. */
    const user = userEvent.setup()
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    expect(within(card()).queryByRole('button', { name: 'Clear exam date' })).toBeNull()
    expect(within(card()).getByRole('button', { name: /Exam Details/ })).toBeTruthy()

    await user.click(within(card()).getByRole('button', { name: 'Cancel' }))
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))
    await user.click(within(card()).getByRole('button', { name: /I have my exam date/ }))
    expect(within(card()).queryByRole('button', { name: 'Clear exam date' })).toBeNull()
  })

  it('Clear wipes the SHARED date and returns the card to the question', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))
    await user.click(within(card()).getByRole('button', { name: 'Clear exam date' }))

    /* Gone from the store, not just from this card — the Target Exam Date and
       the Study Pace tile have to lose it too, or the learner has "cleared" a
       date the rest of the page still plans against. */
    expect(window.localStorage.getItem('cgp.examDate')).toBeNull()
    const c = card()
    expect(within(c).getByText('Have you scheduled your state exam?')).toBeTruthy()
    expect(within(c).queryByText('until your exam')).toBeNull()
    // …and the footer is the Exam Details menu again.
    expect(within(c).getByRole('button', { name: /Exam Details/ })).toBeTruthy()
    expect(within(c).queryByRole('button', { name: 'Clear exam date' })).toBeNull()
  })
})

describe('Exam Details — the menu the footer opens', () => {
  const sheet = () => screen.getByRole('dialog')
  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    renderShell('exam-step-style:ask-first')
    await user.click(within(card()).getByRole('button', { name: /Exam Details/ }))
  }

  it('offers the three exam sheets, not just scheduling', async () => {
    /* The reason the menu exists: two of these three were reachable only from
       OTHER cards in the journey column, and the footer promised only the
       first. */
    const user = userEvent.setup()
    await openMenu(user)
    const d = sheet()
    expect(within(d).getByRole('heading', { name: 'Exam Details' })).toBeTruthy()
    expect(
      within(d).getByRole('button', { name: /How to schedule or reschedule your exam/ }),
    ).toBeTruthy()
    expect(within(d).getByRole('button', { name: /What to expect on your exam/ })).toBeTruthy()
    expect(within(d).getByRole('button', { name: /Common questions/ })).toBeTruthy()
  })

  it('carries the governing agency at the BOTTOM, once', async () => {
    /* ⚠ ITS NEW HOME, moved off the three step sheets on 2026-09-29 —
       `QeFocusedVersion.test.tsx` holds the inverted half and the cost. Below
       the rows because it is not a fourth one: the rows lead somewhere, this is
       reference material you read in place. */
    const user = userEvent.setup()
    await openMenu(user)
    const d = sheet()
    expect(within(d).getByRole('heading', { name: 'Governing Agency' })).toBeTruthy()
    expect(d.textContent).toContain(NY_GOVERNING_AGENCY.name)
    expect(d.textContent).toContain(NY_GOVERNING_AGENCY.address)
    // ONCE — the whole point of the move was one copy rather than three.
    expect(d.textContent!.match(/Governing Agency/g)).toHaveLength(1)

    // The hairline above it, the same seam the rest of this version uses.
    const rule = Array.from(d.querySelectorAll<HTMLElement>('div')).find(
      (el) => el.style.height === '1px',
    )
    expect(rule).toBeTruthy()
    expect(rule!.style.background).toMatch(/border-subtle/)

    /* Phone and email are ACTIONS, not text to retype; the website leaves XCEL
       so it opens in a new tab and `tel:` does not. */
    const byHref = (pre: string) =>
      Array.from(d.querySelectorAll('a')).find((a) => a.getAttribute('href')?.startsWith(pre))
    expect(byHref('tel:')).toBeTruthy()
    expect(byHref('mailto:')).toBeTruthy()
    expect(byHref('https://www.dfs.ny.gov/')!.getAttribute('target')).toBe('_blank')
    expect(byHref('tel:')!.getAttribute('target')).toBeNull()
  })

  it('opens the EXISTING step sheets for rows 1 and 2, not copies', async () => {
    /* They open `GetLicensedStepPanel` on the steps that already own that
       content — the same sheets the Study Journey rows open. A second copy of
       the schedule copy is exactly what this must not become. */
    const user = userEvent.setup()
    await openMenu(user)
    await user.click(
      within(sheet()).getByRole('button', { name: /How to schedule or reschedule your exam/ }),
    )
    expect(screen.getByText('Post-course process')).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Schedule State Exam' }).length).toBeGreaterThan(0)
  })

  it('shows the demo FAQ behind Common questions', async () => {
    const user = userEvent.setup()
    await openMenu(user)
    await user.click(within(sheet()).getByRole('button', { name: /Common questions/ }))
    expect(screen.getByRole('heading', { name: 'Common questions' })).toBeTruthy()
    expect(screen.getByText(/Can I reschedule my exam after booking\?/)).toBeTruthy()
    /* ⚠ LABELLED AS DEMO ON THE SHEET ITSELF. These five answers are invented
       and the fee, the retake wait and the ID rule need checking against PSI
       before a learner sees them — a sheet that looked authoritative would be
       the failure mode. */
    expect(screen.getByText(/Demo content/)).toBeTruthy()
  })

  it('leaves the menu open UNDERNEATH the sheet it opens', async () => {
    /* A SECOND sheet, not a replacement — so closing a detail returns you to
       the list you chose from rather than dumping you back on the page. */
    const user = userEvent.setup()
    await openMenu(user)
    await user.click(within(sheet()).getByRole('button', { name: /Common questions/ }))
    expect(screen.getAllByRole('dialog').length).toBe(2)

    const faq = screen.getAllByRole('dialog')[1]
    await user.click(within(faq).getByRole('button', { name: /Close/ }))
    const back = screen.getByRole('dialog')
    expect(within(back).getByRole('heading', { name: 'Exam Details' })).toBeTruthy()
  })
})
