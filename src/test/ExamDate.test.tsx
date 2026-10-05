import { cleanup, render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { clearExamDate, examDateRenewal, readExamDate, writeExamDate } from '@/data/examDateStore'
import { timeRemainingText } from '@/components/learning/learningPathsHomeUtil'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * THE PRE-PROMOTION BASELINE — 2026-09-28.
 *
 * Five flags were promoted to the Prototypes baseline that day, so the
 * product's DEFAULT render no longer shows the Study Pace tile, the separate
 * Jump Back In card, the inline exam-date field, or coursework as Step 1.
 *
 * The tests in this file are about those COMPONENTS and that LAYOUT, not about
 * whatever the baseline happens to be, so they pin the state they were written
 * against. Spread into every seed here rather than repeated, because this file
 * has six of them and a flag pinned in five is worse than one pinned in none.
 *
 * ⚠ A TEST THAT IS ABOUT THE BASELINE MUST NOT SPREAD THIS.
 */
const PRE_PROMOTION_BASELINE = {
  'study-pace-hidden': { enabled: false },
  'course-entry-style': { enabled: true, variant: 'split' },
  /* `exam-step-style` was seeded here until 2026-09-29, when the flag was
     retired — see `archivedItems.ts`. Removed rather than left as a dead key:
     a seed for a flag that no longer exists reads as a pinned choice and is
     silently ignored. */
  'journey-step-order': { enabled: true, variant: 'coursework-first' },
}



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

  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({
      ...PRE_PROMOTION_BASELINE,
      ...PRE_PROMOTION_BASELINE,
    }),
  )  /* ⚠ `study-pace-readout: prose` — 2026-09-23. `stats` is the branch default
     and it replaces the Study Pace card's two fact SENTENCES with cells. The
     cross-surface claims here are about those sentences naming the ceiling the
     card priced against ("Your exam is on May 31"), which is exactly the silent
     failure this file exists to catch, so they are pinned to the treatment that
     still states it in words. */
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({
      ...PRE_PROMOTION_BASELINE,
      ...PRE_PROMOTION_BASELINE,
      'study-pace-readout': { enabled: true, variant: 'prose' },
      /* And `strip`, for the same reason — `options` puts three named plans
         above the card, so a heading assertion anchored with `^` reads the
         picker instead. See the note in `StudyPaceTile.test.tsx`. */
      'study-pace-chooser': { enabled: true, variant: 'strip' },
    }),
  )
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
    /* ⚠ THE ECHO MOVED CARDS on 2026-09-29. It was the inline Schedule State
       Exam card, retired with `exam-step-style`; the card that replaced it is
       region "Exam Date". The CLAIM is unchanged and is the point — the card
       that asked for the date still shows it back, which is the confirmation
       the header's removed cell used to provide. */
    expect(document.querySelector('section[aria-label="Exam Date"]')?.textContent).toMatch(
      /June 30, 2026/,
    )
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
       own renewal shows as its countdown — the same fact this always asserted,
       in the only shape the page still states it.

       ⚠ READ FROM THE FIXTURE as of 2026-09-23, not from a literal. It was
       `timeRemainingText(27 / 7)`, which broke the moment the demo's day counts
       were re-authored to 29 / 17 / 3. The claim here is that NOTHING STORED
       leaves the persona's own figure showing — which is true at any value, and
       a literal only ever pinned one of them. */
    renderShell()
    expect(countdown()).toBe(
      timeRemainingText(
        dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!.renewal!.weeksLeft,
      ),
    )
  })
})

describe('the capture, after `exam-step-style` was retired', () => {
  /*
   * ⚠ INVERTED 2026-09-29, and this block is the record of what that cost.
   *
   * It tested the INLINE capture — a labelled `<input type="date">` reading
   * "Already scheduled?" with Save / Clear, on a card headed "Schedule State
   * Exam". That card lost the fork: `ask-first` won and became unconditional,
   * so the inline capture is unreachable. Its code is intact inside
   * `LicensingStepWidget` (`ExamDateCapture`) behind a branch nothing takes —
   * see `archivedItems.ts`, `exam-step-style-alternatives`.
   *
   * What the old tests were PROTECTING is not retired, and that is what these
   * assert on the new card: the stored date is VISIBLE and REVERSIBLE. A date
   * silently re-points the page's headline figure and lives in localStorage
   * rather than the repo, so a stale one nobody can see or clear is
   * unexplainable from the source. Restoring the flag means restoring the old
   * assertions from git, not rewriting them from this description.
   */
  const card = () => document.querySelector('section[aria-label="Exam Date"]') as HTMLElement

  it('no longer renders the inline field anywhere', () => {
    renderShell()
    expect(screen.queryAllByLabelText(/Already scheduled\?/i)).toHaveLength(0)
    expect(document.querySelector('section[aria-label="Schedule State Exam"]')).toBeNull()
  })

  it('speaks the whole date back under BOTH placements', () => {
    /* ⚠ THE SR-ONLY SENTENCE IS THE HALF THAT NEARLY WENT, and it is the half
       that has to survive every redesign of this readout. The tear-off renders
       the date as three unrelated fragments and the countdown never names the
       day; the compact arm's visible line drops the weekday and hides its
       separator from the accessibility tree. In both cases a screen-reader user
       would hear everything about the booking except when it is.

       ⚠ ASSERTED ON BOTH ARMS DELIBERATELY. It would be easy to keep this line
       in whichever arm the suite happened to pin and lose it in the other —
       nothing on screen would look missing, which is exactly how it nearly went
       the first time. */
    for (const arm of ['journey-column', 'under-course']) {
      writeExamDate('2026-06-30')
      window.history.replaceState({}, '', `/dashboard-rebrand?ff=exam-card-placement:${arm}`)
      renderShell()
      expect(card().textContent, arm).toMatch(/Exam scheduled for .*June 30, 2026/)
      cleanup()
    }
  })

  it('renders the tear-off calendar in the journey column', () => {
    /* The full readout's own claim, split out of the test above when the
       compact arm arrived: three fragments, which is precisely why the sentence
       above exists. `under-course` draws one line instead — see
       `ExamCardPlacement.test.tsx`. */
    writeExamDate('2026-06-30')
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=exam-card-placement:journey-column')
    renderShell()
    expect(within(card()).getByText('JUN')).toBeTruthy()
    expect(within(card()).getByText('30')).toBeTruthy()
    expect(within(card()).getByText('2026')).toBeTruthy()
  })

  it('still lets the learner take it back — REVERSIBLE', () => {
    /* Clear lives behind Edit now rather than beside the field, which is the
       one real change in the affordance: it is a destructive control, and the
       card only offers it where a date already exists. */
    writeExamDate('2026-06-30')
    renderShell()
    fireEvent.click(within(card()).getByRole('button', { name: /Edit/ }))
    fireEvent.click(within(card()).getByRole('button', { name: 'Clear exam date' }))
    expect(readExamDate()).toBeNull()
    // …and the card is back to asking.
    expect(within(card()).getByText(/Have you scheduled your .* state exam\?/)).toBeTruthy()
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
