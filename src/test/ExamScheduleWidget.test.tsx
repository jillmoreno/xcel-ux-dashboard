import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { writeExamDate } from '@/data/examDateStore'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'
import { NY_GOVERNING_AGENCY } from '@/data/nyProducerRequirements'

/**
 * THE EXAM-DATE CARD THAT ASKS FIRST — `exam-step-style: ask-first`, 2026-09-29.
 *
 * The third arm of the flag and, as of this commit, its default. What these pin
 * is the sequence, because the sequence is the variant: the card ASKS, and each
 * of the two answers leads somewhere that is still the same card.
 *
 * ⚠ MOST TESTS HERE PIN `journey-quick-links:off`, which is NOT the default.
 * The card owns its "Exam Details" link only on that arm; with quick links ON
 * the link moves to the Quick links card below and the footer is empty. These
 * tests are about the CARD, so they pin the arm where the card has the link —
 * the interaction between the two is asserted in its own block at the bottom.
 * (They used to pin `exam-step-style:ask-first`, a flag retired 2026-09-29, so
 * the string was doing nothing.)
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

/**
 * ⚠ EVERY RENDER PINS THE JOURNEY-COLUMN PLACEMENT — `exam-card-placement`,
 * 2026-10-01. The flag defaults to `under-course` on this branch, and that arm
 * draws a DIFFERENT saved readout: an "Exam Date" eyebrow over one line
 * (`May 26, 2026 | 15 days until your exam`) instead of the tear-off calendar
 * and the hourglass panel this suite asserts.
 *
 * This file is about the FULL readout and the phase machine behind it, which
 * `journey-column` still draws. The compact arm has its own coverage in
 * `ExamCardPlacement.test.tsx`; what is shared — the store, the picker, the
 * question itself — is unchanged by the arm and is asserted here.
 */
function renderShell(ff?: string) {
  const PIN = 'exam-card-placement:journey-column'
  const all = ff ? `${PIN},${ff}` : PIN
  window.history.replaceState({}, '', `/dashboard-rebrand?ff=${encodeURIComponent(all)}`)
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
  it('names the STATE while it is still ASKING, and the DATE once it knows', async () => {
    /* ⚠ THE SPLIT IS THE POINT, and it moved once. A learner holding licences
       in more than one jurisdiction could not tell which exam "your state exam"
       meant, so the three asking phases name it.

       The readout deliberately does NOT (changed 2026-09-29, from "New York
       State exam"). Before a date exists the ambiguous thing is WHICH exam;
       once one exists the card is showing it — the tear-off and the countdown
       are both the date — so the title says what the learner is looking at
       rather than repeating the jurisdiction.

       Swept across all four rather than checked on one, because the SPLIT is
       the assertion: a single-phase check would pass with the rule applied
       once and forgotten three times. */
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
    expect(card().textContent).toContain('New York')

    /* ⚠ "NOT YET" NAMES IT ONLY BY DESTINATION, since 2026-09-30. Its copy was
       rewritten to "You can register for your exam here", where `here` is a
       link to PSI's NEW YORK registration page — so the jurisdiction is in
       where the link goes rather than in the sentence. That is a real gap in
       the sweep and it is recorded rather than papered over: a screen reader
       announcing the link reads "here", not the state.

       Kept as an assertion on the HREF so the claim is still checkable: if the
       link ever stopped being NY's, this phase would name the state nowhere at
       all and nothing else would notice. */
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))
    const psi = within(card()).getByRole('link', { name: 'here' })
    expect(psi.getAttribute('href')).toBe('https://test-takers.psiexams.com/nyins')
    expect(psi.getAttribute('target')).toBe('_blank')

    await user.click(within(card()).getByRole('button', { name: /I have my exam date/ }))
    expect(within(card()).getByText('When is your New York state exam?')).toBeTruthy()

    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))
    // …and HERE it stops naming the state and names the date instead.
    expect(within(card()).getByText('Your exam date')).toBeTruthy()
    expect(within(card()).queryByText(/New York State exam/)).toBeNull()

    // …and the edit lead names it too, the one phase with no heading above it.
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))
    expect(within(card()).getByText('Edit your New York exam date')).toBeTruthy()
  })

  it('opens on the question, with both answers available', () => {
    renderShell('journey-quick-links:off')
    const c = card()
    expect(within(c).getByText('Have you scheduled your New York state exam?')).toBeTruthy()
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
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))

    const c = card()
    expect(within(c).queryByText('Have you scheduled your New York state exam?')).toBeNull()
    expect(within(c).getByText(/No exam date yet\? That’s okay\./)).toBeTruthy()
    expect(within(c).getByText(/You can register for your exam/)).toBeTruthy()
    expect(within(c).getByRole('button', { name: /I have my exam date/ })).toBeTruthy()
  })

  it('reaches the calendar from BOTH answers', async () => {
    /* Two routes to one picker — the second is what makes "Not yet" reversible
       rather than a dead end, so it is worth pinning that they land in the same
       place. */
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: 'Not yet' }))
    await user.click(within(card()).getByRole('button', { name: /I have my exam date/ }))
    expect(within(card()).getByRole('button', { name: /Previous month/ })).toBeTruthy()

    // …and Cancel returns to the answer it was opened from, not to the question.
    await user.click(within(card()).getByRole('button', { name: 'Cancel' }))
    expect(within(card()).getByText(/No exam date yet\? That’s okay\./)).toBeTruthy()
    expect(within(card()).queryByText('Have you scheduled your New York state exam?')).toBeNull()
  })

  it('“Yes” expands the calendar INSIDE the card, not over it', async () => {
    /* ⚠ A DESCENDANT of the card, which is what makes this a real check — a
       portal would still put the grid on the page and still pass a looser
       query. The same decision `date-first` made, kept deliberately so the two
       arms differ in the ASKING and nothing else. */
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
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
    renderShell('journey-quick-links:off')
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
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))

    expect(window.localStorage.getItem('cgp.examDate')).toBe('2026-05-29')
    const c = card()
    // The question is spent, so the card stops asking it.
    expect(within(c).queryByText('Have you scheduled your New York state exam?')).toBeNull()
    expect(within(c).getByText('Your exam date')).toBeTruthy()
    expect(within(c).getByText('18 days')).toBeTruthy()
    expect(within(c).getByText('until your exam')).toBeTruthy()
    expect(within(c).getByRole('button', { name: /Edit/ })).toBeTruthy()
  })

  it('Save stays inert until a day is actually chosen', async () => {
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    expect(within(card()).getByRole('button', { name: 'Save exam date' })).toHaveProperty(
      'disabled',
      true,
    )
  })

  it('Edit reopens the picker on the saved date, and Cancel keeps it', async () => {
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
    await user.click(within(card()).getByRole('button', { name: /May 29, 2026/ }))
    await user.click(within(card()).getByRole('button', { name: 'Save exam date' }))
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))

    const c = card()
    expect(within(c).getByText('Edit your New York exam date')).toBeTruthy()
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
       that opened on "Have you scheduled your New York state exam?" for someone
       plainly has would read as the product not listening. */
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell('journey-quick-links:off')
    const c = card()
    expect(within(c).queryByText('Have you scheduled your New York state exam?')).toBeNull()
    expect(within(c).getByText('18 days')).toBeTruthy()
  })

  it('applies under both journey orders', async () => {
    /* ⚠ TWO CALL SITES, the trap `ExamStepCard` exists to close: `exam-first`
       lifts this step into the promoted slot above the coursework card, and a
       branch that handled only one of them would serve this arm under one order
       and a different one under the other — an A/B measuring two things. */
    renderShell('journey-quick-links:off,journey-step-order:exam-first')
    const c = card()
    expect(within(c).getByText('Have you scheduled your New York state exam?')).toBeTruthy()
    /* ⚠ NO STEP NUMBER — changed 2026-09-29. This asserted "Step 1" until the
       card stopped being a step at all. `JourneyStepOrder.test.tsx` owns the
       other half: that the three real steps close up to 1-2-3 behind it. */
    /* ⚠ "State Exam", NOT "Quick question" — 2026-10-02, the direct ask. The
       old wording was itself a restored Figma decision whose job was to say
       this card is NOT a journey step; the new one names the subject and reads
       as a section label like every other eyebrow on the page. What the card
       gives up is that self-description — its lack of a step NUMBER is now the
       only thing saying it is not a step, which is why the numbering assertions
       elsewhere matter more than they did. */
    expect(within(c).getByText('State Exam')).toBeTruthy()
    expect(c.textContent).not.toMatch(/Step \d/)
  })

  it('keeps Exam Details reachable in every state except edit', async () => {
    /* `CtaTest` asserts `home.schedule-exam` renders unconditionally on this
       surface. It is the default arm now, so the tag has to survive the states
       a fresh load can reach rather than just the one it opens on. EDIT MODE IS
       THE DELIBERATE EXCEPTION and is asserted separately below — a fresh load
       cannot start there, so `CtaTest` is still met. */
    const user = userEvent.setup()
    renderShell('journey-quick-links:off')
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
    renderShell('journey-quick-links:off')

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
    renderShell('journey-quick-links:off')
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
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))
    await user.click(within(card()).getByRole('button', { name: 'Clear exam date' }))

    /* Gone from the store, not just from this card — the Target Exam Date and
       the Study Pace tile have to lose it too, or the learner has "cleared" a
       date the rest of the page still plans against. */
    expect(window.localStorage.getItem('cgp.examDate')).toBeNull()
    const c = card()
    expect(within(c).getByText('Have you scheduled your New York state exam?')).toBeTruthy()
    expect(within(c).queryByText('until your exam')).toBeNull()
    // …and the footer is the Exam Details menu again.
    expect(within(c).getByRole('button', { name: /Exam Details/ })).toBeTruthy()
    expect(within(c).queryByRole('button', { name: 'Clear exam date' })).toBeNull()
  })
})

describe('Exam Details — the menu the footer opens', () => {
  const sheet = () => screen.getByRole('dialog')
  const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
    renderShell('journey-quick-links:off')
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
    /* UNSCHEDULED wording — the learner has no date, so "reschedule" would be
       describing something they cannot do. */
    expect(within(d).getByRole('button', { name: /How to schedule your exam/ })).toBeTruthy()
    expect(within(d).queryByRole('button', { name: /reschedule/i })).toBeNull()
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

  it('says RESCHEDULE once a date is booked, and schedule before', async () => {
    /* ⚠ ONE ROW, TWO NAMES. It read "How to schedule or reschedule your exam"
       for everyone — the shape a label takes when it is covering a state it has
       not checked, asking the learner to work out which half applies. Both
       halves are wrong for half the readers. The destination is the same sheet
       either way; only the naming was ambiguous. */
    const user = userEvent.setup()
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell('journey-quick-links:off')
    await user.click(within(card()).getByRole('button', { name: /Exam Details/ }))

    const d = sheet()
    expect(within(d).getByRole('button', { name: /How to reschedule your exam/ })).toBeTruthy()
    expect(within(d).getByText(/Change a date you have already booked/)).toBeTruthy()
    // …and the unscheduled wording is gone, not merely joined by the other.
    expect(within(d).queryByRole('button', { name: /^How to schedule your exam/ })).toBeNull()
  })

  it('opens the EXISTING step sheets for rows 1 and 2, not copies', async () => {
    /* They open `GetLicensedStepPanel` on the steps that already own that
       content — the same sheets the Study Journey rows open. A second copy of
       the schedule copy is exactly what this must not become. */
    const user = userEvent.setup()
    await openMenu(user)
    await user.click(within(sheet()).getByRole('button', { name: /How to schedule your exam/ }))
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

describe('exam-calendar-style — how the picker is drawn', () => {
  const openPicker = async (user: ReturnType<typeof userEvent.setup>, ff: string) => {
    renderShell(ff)
    await user.click(within(card()).getByRole('button', { name: 'Yes' }))
  }
  /** The row carrying the arrows and the month label. */
  const monthRow = () => within(card()).getByText(/May 2026/).parentElement!

  it('ships `framed` on this branch, with the control still reachable', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'exam-calendar-style')
    expect(flag?.defaultVariant).toBe('framed')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['minimal', 'framed', 'branded'])
  })

  it('draws the SAME month, with the same days bookable, on every arm', async () => {
    /* ⚠ THE ASSERTION THAT KEEPS THIS AN EXPLORATION OF DRAWING. The arms are
       skins over one `buildMonthCells` result; if they ever disagreed about
       which days are selectable, the comparison would silently be about two
       calendars rather than two treatments. */
    for (const arm of ['minimal', 'framed', 'branded']) {
      const user = userEvent.setup()
      await openPicker(user, `journey-quick-links:off,exam-calendar-style:${arm}`)
      const c = card()
      expect(within(c).getByText(/May 2026/), arm).toBeTruthy()
      // Before the anchored today — never bookable.
      expect(within(c).getByRole('button', { name: /May 4, 2026/ }), arm).toHaveProperty(
        'disabled',
        true,
      )
      // After it — bookable.
      expect(within(c).getByRole('button', { name: /May 29, 2026/ }), arm).toHaveProperty(
        'disabled',
        false,
      )
      cleanup()
    }
  })

  it('`branded` caps the calendar with the navy bar', async () => {
    /* The argument this arm makes: the saved readout is a navy-capped tear-off,
       so the thing you pick from should look like the thing you end up with. */
    const user = userEvent.setup()
    await openPicker(user, 'journey-quick-links:off,exam-calendar-style:branded')
    const row = monthRow()
    expect(row.style.background).toBe('var(--color-primary-500)')
    /* White on navy — and `--color-text-inverse` rather than a literal, because
       the bar is navy in BOTH themes so the ink must not flip. */
    expect(row.style.color).toBe('var(--color-text-inverse)')
  })

  it('`minimal` is still the hairline control it shipped as', async () => {
    const user = userEvent.setup()
    await openPicker(user, 'journey-quick-links:off,exam-calendar-style:minimal')
    const frame = monthRow().parentElement!
    expect(frame.style.border).toBe('1px solid var(--color-neutral-300)')
    expect(frame.style.background).toBe('var(--color-surface-page)')
    // …and no coloured bar.
    expect(monthRow().style.background).toBe('')
  })
})

describe('exam-card-background — the card\'s ground', () => {
  it('defaults to white, i.e. the card sets no ground of its own', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'exam-card-background')
    expect(flag?.defaultVariant).toBe('white')
    renderShell('journey-quick-links:off')
    // The shell's own surface, untouched — not a colour this card chose.
    expect(card().style.background).toBe('var(--color-surface-card)')
  })

  it('`tint` quotes the SELECTED RAIL ITEM rather than copying its colour', async () => {
    /* ⚠ THE TOKEN IS THE ASSERTION. "The same light blue as Home" is only
       durably true if both sides read `--color-nav-icon-active-primary`; a
       hex that matches today diverges silently the day the rail is retuned.
       So this pins the EXPRESSION, not the rendered colour. */
    renderShell('journey-quick-links:off,exam-card-background:tint')
    const bg = card().style.background
    expect(bg).toContain('--color-nav-icon-active-primary')
    /* The strength is tuned for a card and is NOT the rail's 24% — same hue,
       less of it, because the two do the same job at very different sizes. */
    expect(bg).toContain('12%')
    /* ⚠ …and mixed over the CARD surface, not `transparent`. The rail mixes to
       transparent because it sits on white; this card sits on the page's grey,
       so transparent would land a different colour from the thing it quotes. */
    expect(bg).toContain('var(--color-surface-card)')
    expect(bg).not.toContain('transparent')
  })
})

describe('journey-quick-links — where the sheet links live', () => {
  const quick = () => screen.getByRole('region', { name: 'Quick links' })

  it('is ON by default, and the links are in ONE place not two', () => {
    /* ⚠ THE WHOLE CLAIM OF THE FLAG. Running both halves would put every
       destination on the page twice, which is why one flag drives both and why
       this asserts the ABSENCES as hard as the presences. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'journey-quick-links')
    expect(flag?.defaultEnabled).toBe(true)
    renderShell()

    // Collected…
    expect(within(quick()).getByRole('button', { name: 'Exam Information' })).toBeTruthy()
    expect(within(quick()).getByRole('button', { name: 'How to Get Your License' })).toBeTruthy()
    expect(within(quick()).getByRole('button', { name: 'State Requirements' })).toBeTruthy()

    // …and gone from the cards they came off.
    expect(screen.queryByRole('button', { name: /Exam Details/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /What to expect/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /How to apply/ })).toBeNull()
  })

  it('puts every link back on its own card when off', () => {
    renderShell('journey-quick-links:off')
    expect(screen.queryByRole('region', { name: 'Quick links' })).toBeNull()
    expect(screen.getByRole('button', { name: /Exam Details/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /What to expect/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /How to apply/ })).toBeTruthy()
  })

  it('still offers Clear on the exam card, which is not a sheet link', async () => {
    /* ⚠ THE DISTINCTION THE FOOTER GATE HAS TO MAKE. "Exam Details" is a way
       into a sheet and moves to Quick links; "Clear exam date" is a destructive
       control on this card's own data and has nowhere else to go. Hiding the
       whole footer slot would have taken it with the link — silently, since it
       only appears in edit mode. */
    const user = userEvent.setup()
    window.localStorage.setItem('cgp.examDate', '2026-05-29')
    renderShell()
    await user.click(within(card()).getByRole('button', { name: /Edit/ }))
    expect(within(card()).getByRole('button', { name: 'Clear exam date' })).toBeTruthy()
  })

  it('reaches the same sheets from the Quick links card', async () => {
    /* The destinations are identical either way — only the way in moves, which
       is what makes the two arms comparable at all. */
    const user = userEvent.setup()
    renderShell()
    await user.click(within(quick()).getByRole('button', { name: 'Exam Information' }))
    expect(screen.getByRole('heading', { name: 'Exam Details' })).toBeTruthy()
  })
})

describe('the saved readout leads with an eyebrow', () => {
  /* 2026-10-01, the direct ask ("change this to match the eyebrow text on the
     other containers").

     ⚠ THIS IS A GLOBAL CHANGE, NOT A VERSION'S, and the test lives here rather
     than in `Testing3Version.test.tsx` for that reason. The card's PROMPT state
     already led with `widgetEyebrowStyle` ("Quick question"), as do Quick links
     and every licensing step beside it; the saved state was the only block in
     the column opening on an 18px heading, so a flag would have preserved an
     inconsistency rather than compared two ideas. */
  it('sets the label as an eyebrow, not an 18px heading', () => {
    writeExamDate('2026-06-30')
    renderShell()
    const card = document.querySelector('section[aria-label="Exam Date"]') as HTMLElement
    const label = within(card).getByText('Your exam date') as HTMLElement
    expect(label.style.fontSize).toBe('10px')
    expect(label.style.letterSpacing).toBe('0.18em')
    expect(label.style.textTransform).toBe('uppercase')
    expect(label.className).toContain('cre-eyebrow-ink')
    /* ⚠ `--font-body`, not `--font-heading`. `dashboard-heading-font` re-points
       the heading token at a serif, and an eyebrow that followed it would stop
       matching the eyebrows beside it on exactly that variant. */
    expect(label.style.fontFamily).toContain('--font-body')
  })
})
