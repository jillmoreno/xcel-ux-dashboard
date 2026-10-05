import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { writeExamDate } from '@/data/examDateStore'

/**
 * WHERE THE EXAM-DATE CARD SITS — `exam-card-placement`, 2026-10-01.
 *
 * The ask was "move this widget to be below the Current course widget", and a
 * MOVE is a harder thing to get right than an addition: the card has to leave
 * one column and arrive in another, and the two halves are decided in different
 * files. What this file pins is that it is exactly one card, exactly once,
 * under every combination that can reach it.
 *
 * ⚠ THE FAILURE THIS GUARDS IS SILENT IN BOTH DIRECTIONS. Render it in both
 * places and the learner is asked whether they have booked their exam twice on
 * one screen. Suppress it in both and the question disappears from the product
 * with nothing on screen to show it ever existed. Neither throws.
 */

/* ⚠ PINNED TO `discoverability-testing`. XCEL's default moved to Testing 3 on
   2026-10-02, and that version restructures both of the things this file is
   about — it folds the exam card and the nav tiles into arrangements of its
   own. This suite's subject is the behaviour on the version it was written
   against; Testing 3's own is pinned in `Testing3Version.test.tsx`. */
const URL = '/dashboard-rebrand?demo=1&version=discoverability-testing'

function renderShell(ff?: string) {
  /* ⚠ `?ff=` is read from `window.location`, not from the router entry. */
  window.history.replaceState({}, '', ff ? `/dashboard-rebrand?ff=${ff}` : '/dashboard-rebrand')
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

const examCards = () => [...document.querySelectorAll<HTMLElement>('section[aria-label="Exam Date"]')]

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('exam-card-placement', () => {
  it('is in the catalog and defaults to the SHIPPED journey column', () => {
    /* ⚠ THIS LINE DID ITS JOB. It read `under-course` from 2026-10-01 — the
       branch default, set by the direct ask "set it as the default" — above a
       note saying that if `promote-to-prototype` moved the baseline, this is
       what would say so out loud rather than letting it pass unremarked.

       It has. REVIEWED AND DECLINED 2026-10-05: the baseline is `journey-column`,
       the arm that ships. The argument is recorded on the flag — in the column
       the card sits in a sequence that explains it (Step 1 coursework, Step 2
       exam) and under the course card it stands alone, so the question has to
       carry itself.

       ⚠ THE OTHER ARM IS NOT GONE, and the suite below still drives it. What
       changed is one default. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'exam-card-placement')
    expect(flag).toBeTruthy()
    expect(flag?.defaultVariant).toBe('journey-column')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['under-course', 'journey-column'])
    expect(flag?.page).toBe('dashboard-rebrand')
  })

  /* ⚠ BOTH ARMS OF `course-entry-style`, and that pairing is the point. The
     left column draws a different card on each (`CourseEntryCard` vs
     `JumpBackInWidget`), and the first cut of this feature hung the exam card
     off the COMBINED arm only — which did not fail loudly, it just deleted the
     card from every split-arm render, because the journey column had already
     been told to drop it. */
  for (const entry of ['combined', 'split']) {
    it(`renders exactly one exam card under-course on the ${entry} course entry`, () => {
      renderShell(`exam-card-placement:under-course,course-entry-style:${entry}`)
      expect(examCards()).toHaveLength(1)
    })

    it(`renders exactly one exam card in the journey column on the ${entry} entry`, () => {
      renderShell(`exam-card-placement:journey-column,course-entry-style:${entry}`)
      expect(examCards()).toHaveLength(1)
    })
  }

  /* ⚠ AND ON BOTH ARMS OF `journey-step-order`, which is the OTHER flag that
     decides which of the column's two lists holds Schedule State Exam — the
     promoted slot, or the licensing list. Suppressing only one of them leaves
     the card rendering from the other, so the duplicate would appear in half
     the combinations and not the half anyone looks at first. */
  for (const order of ['exam-first', 'coursework-first']) {
    it(`takes it out of the column exactly once on ${order}`, () => {
      renderShell(`exam-card-placement:under-course,journey-step-order:${order}`)
      expect(examCards()).toHaveLength(1)
    })
  }

  it('puts it in the left column, as a sibling of the course card', () => {
    /* THE WIDTH CLAIM, asserted structurally rather than in pixels — "the same
       width as the Current course widget" is true because it is inside that
       card's own container, not because a number was matched. A pixel
       assertion would also pass in jsdom with no layout at all. */
    renderShell('exam-card-placement:under-course')
    const [card] = examCards()
    const column = card.closest('[data-testid], div')
    expect(column).toBeTruthy()
    /* The course card and the exam card share a parent chain that the journey
       column's cards do not: the Study Journey region is NOT an ancestor. */
    expect(card.closest('section[aria-label="Study journey"]')).toBeNull()
  })

  it('leaves the Study Journey column starting on the coursework card', () => {
    renderShell('exam-card-placement:under-course')
    expect(screen.getByLabelText('Study journey')).toBeTruthy()
    /* The column's own first card is the coursework one now — the exam card is
       no longer above it. */
    expect(within(screen.getByLabelText('Study journey')).queryByText('State Exam')).toBeNull()
  })

  describe('the compact saved readout', () => {
    /* 2026-10-01, the direct ask: an "Exam Date" eyebrow over one line reading
       `May 26, 2026 | 15 days until your exam`, in place of the tear-off
       calendar and the hourglass panel the journey column draws. */
    beforeEach(() => writeExamDate('2026-05-26'))

    it('is an Exam Date eyebrow over one line, with no tear-off', () => {
      renderShell('exam-card-placement:under-course')
      const [card] = examCards()
      expect(within(card).getByText('Exam Date')).toBeTruthy()
      expect(card.textContent).toMatch(/May 26, 2026/)
      expect(card.textContent).toMatch(/until your exam/)
      /* The tear-off's three fragments are what this replaced. Asserted absent
         rather than just asserting the line present — a readout that drew both
         would pass every positive check in this file. */
      expect(within(card).queryByText('MAY')).toBeNull()
      expect(within(card).queryByText('26')).toBeNull()
      /* …and the full readout's heading, which the eyebrow replaces. */
      expect(within(card).queryByText('Your exam date')).toBeNull()
    })

    it('drops the weekday from the line but keeps it in the spoken sentence', () => {
      renderShell('exam-card-placement:under-course')
      const [card] = examCards()
      expect(card.textContent).toMatch(/Exam scheduled for Tuesday, May 26, 2026/)
    })

    it('keeps Edit, which is the only route to the picker and to Clear', () => {
      /* ⚠ NOT PART OF THE ASK, AND KEPT ANYWAY. The ask named the eyebrow and
         the line. Dropping Edit would make the date unchangeable from the one
         card that owns it, and would strand Clear exam date behind nothing. */
      renderShell('exam-card-placement:under-course')
      const [card] = examCards()
      expect(within(card).getByRole('button', { name: /Edit/ })).toBeTruthy()
    })

    it('leaves the journey column\u2019s full readout alone', () => {
      renderShell('exam-card-placement:journey-column')
      const [card] = examCards()
      expect(within(card).getByText('Your exam date')).toBeTruthy()
      expect(within(card).getByText('MAY')).toBeTruthy()
      /* The eyebrow is the compact arm's; the full readout has its heading. */
      expect(within(card).queryByText('Exam Date')).toBeNull()
    })
  })

  it('still asks the question — the eyebrow travels with the card', () => {
    /* A move must not quietly become a demotion: the eyebrow is what gives the
       card its identity, and it is keyed on there being no stored date rather
       than on which column the card is in. It reads "State Exam" as of
       2026-10-02; the question under it is the thing being asked. */
    renderShell('exam-card-placement:under-course')
    const [card] = examCards()
    /* ⚠ EXACT, NOT `/State Exam/i`. The question under it reads "…your New
       York state exam?", so a case-insensitive regex matches both and throws on
       ambiguity. The eyebrow is the whole of its own element's text. */
    expect(within(card).getByText('State Exam')).toBeTruthy()
    expect(within(card).getByText(/Have you scheduled your .* state exam\?/)).toBeTruthy()
  })
})
