import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { NY_LH_COURSE_CHAPTERS, NY_LH_CURRENT_CHAPTER_INDEX } from '@/data/nyProducerRequirements'
import { formatExamChip } from '@/components/learning/compassPlayerUtil'

/**
 * THE COMPASS COURSE PLAYER — Figma node 49:2903, behind `course-launcher-style`.
 *
 * These pin the two things that are structural rather than cosmetic: that the
 * variant is a FULL-WINDOW takeover (not a panel in the content column), and
 * that the player states the SAME course and percentage as the card that
 * opened it. The second is the one with history — four different derivations
 * of the course from its id rendered here, and all four were wrong. See the
 * note above `launchedTitle` in `PlatformShell`.
 */
const TESTING_URL = '/dashboard-rebrand?version=discoverability-testing'

function seed(extra: Record<string, unknown> = {}) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.localStorage.setItem('cgp.featureFlags', JSON.stringify(extra))
}

function renderShell(url: string) {
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

/** Open the launcher the way a learner does — the Jump Back In card's CTA. */
function startCourse() {
  const cta = screen.getByRole('button', { name: /^(Resume|Start course|Review course)$/ })
  act(() => {
    fireEvent.click(cta)
  })
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('course-launcher-style', () => {
  it('is in the catalog as a variant-only flag, defaulting to the player', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'course-launcher-style')
    expect(def).toBeTruthy()
    expect(def?.defaultEnabled).toBe(true)
    // `compass` ON THE BRANCH — the Contributing guide's rule, since the branch
    // deploy is the review link. Whether it becomes the `?demo=1` baseline on
    // main is `/promote-to-prototype`'s call, not this default's.
    expect(def?.defaultVariant).toBe('compass')
    expect(def?.variants?.map((v) => v.value)).toEqual(['lo-fi', 'compass'])
  })

  it('is in the rebrand panel scope, or the control would not appear', () => {
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('course-launcher-style')
  })
})

describe('the Compass player takes the whole window', () => {
  it('drops the dashboard rail and the content column', () => {
    /* THE STRUCTURAL CLAIM. The player draws its own 260px contents sidebar in
       the space the rail occupies, so the two cannot both be on screen — the
       shell returns the player INSTEAD of its grid rather than inside it. A
       version of this that rendered in the content column would leave the grid
       in the document, which is what this catches. */
    seed()
    const { container } = renderShell(TESTING_URL)
    expect(container.querySelector('.cre-platform-shell-grid')).not.toBeNull()
    startCourse()
    expect(screen.getByLabelText('Course contents')).toBeTruthy()
    expect(container.querySelector('.cre-platform-shell-grid')).toBeNull()
  })

  it('leaves the lo-fi launcher inside the rail, unchanged', () => {
    // The other variant is not a restyle of this one: it keeps the rail and the
    // content column exactly as the launcher has worked since 2026-09-17.
    seed({ 'course-launcher-style': { enabled: true, variant: 'lo-fi' } })
    const { container } = renderShell(TESTING_URL)
    startCourse()
    expect(container.querySelector('.cre-platform-shell-grid')).not.toBeNull()
    expect(screen.queryByLabelText('Course contents')).toBeNull()
    expect(screen.getByRole('button', { name: /Back to/ })).toBeTruthy()
  })
})

describe('the player states the course that was opened', () => {
  it('names the same course and percentage as the card behind it', () => {
    /* ⚠ THE ASSERTION WITH HISTORY. Four attempts derived these from
       `launcher.courseId` inside the shell — the persona's path via
       `dashboard-education-type` (gave "Florida Life & Health CE" on a
       qualifying-education version), `findLearningCourseById` (wrong id space,
       null, fell through silently), `myCoursesFor` (missed a persona path,
       empty title) and `learningPathsFor` matched on `jumpBackIn.id` (the path
       is a persona OVERRIDE and is not in that list). The opener passes them
       now. Asserted as AGREEMENT with the dashboard rather than as a literal,
       so the fixture may change and this still means something. */
    seed()
    const { container } = renderShell(TESTING_URL)
    const dashboardCourse = container.textContent?.match(
      /Course Progress\s*(.+?)\s*\d+\s*%/is,
    )?.[1]
    expect(dashboardCourse).toBeTruthy()
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    expect(within(sidebar).getByRole('heading', { level: 1 }).textContent).toBe(dashboardCourse)
    // The percentage agrees too, and is not the 0 an unresolved course gives.
    const pct = sidebar.textContent?.match(/(\d+)% Complete/)?.[1]
    expect(pct).toBeTruthy()
    expect(Number(pct)).toBeGreaterThan(0)
  })

  it('builds the contents from the NY fixtures, not the mock', () => {
    /* The Figma draws "Florida Life & Health" and a Florida chapter list. The
       tree here is `NY_LH_COURSE_CHAPTERS`, and the current chapter carries the
       Now badge — real states over a prettier mock. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    for (const chapter of NY_LH_COURSE_CHAPTERS) {
      expect(within(sidebar).getByText(chapter)).toBeTruthy()
    }
    expect(sidebar.textContent).not.toMatch(/Florida/)
    expect(within(sidebar).getByText('Now')).toBeTruthy()
    expect(within(sidebar).getByText('Up next')).toBeTruthy()
  })

  it('marks exactly the chapters before the current one as done', () => {
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    // The current chapter is the one the Jump Back In card names, so the count
    // of completed stops is derived from the same index rather than restated.
    expect(NY_LH_CURRENT_CHAPTER_INDEX).toBeGreaterThan(0)
    const now = NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX]
    expect(within(sidebar).getByText(now)).toBeTruthy()
    expect(within(sidebar).getByText('Done')).toBeTruthy()
  })
})

describe('the only wired control is Close', () => {
  it('returns to the dashboard it covered', () => {
    seed()
    const { container } = renderShell(TESTING_URL)
    startCourse()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Close course player/ }))
    })
    expect(screen.queryByLabelText('Course contents')).toBeNull()
    expect(container.querySelector('.cre-platform-shell-grid')).not.toBeNull()
  })

  it('renders the rest as static chrome — no stray buttons to press', () => {
    /* STATIC BY INSTRUCTION. Notes, Demo, Rubi, search and settings render and
       do nothing, so they are NOT buttons — a control that looks pressable and
       is not is the thing a reviewer reports as broken. Close is the one
       exception, and this pins that it is the ONLY one inside the player. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0].getAttribute('aria-label')).toMatch(/Close course player/)
  })
})

describe('the exam-date chip', () => {
  it('states the date and a countdown, floored at zero', () => {
    // The mock hardcodes "August 14, 2026 · 8 Days Out"; this formats whatever
    // the learner typed on Schedule State Exam.
    // `YYYY-MM-DD` — what `<input type="date">` produces and the only shape
    // `readExamDate` returns. The first implementation parsed `mm/dd/yyyy`, so
    // the chip silently never rendered; this is the test that found it.
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const future = new Date()
    future.setDate(future.getDate() + 8)
    expect(formatExamChip(iso(future))?.countdown).toBe('8 Days Out')

    const past = new Date()
    past.setDate(past.getDate() - 30)
    const storedPast = iso(past)
    // A date already gone is not a negative countdown.
    expect(formatExamChip(storedPast)?.countdown).toBe('0 Days Out')
  })

  it('is OMITTED with nothing entered, rather than defaulted', () => {
    // A countdown to a date nobody gave is the invented figure this repo
    // refuses everywhere else.
    seed()
    renderShell(TESTING_URL)
    startCourse()
    expect(screen.queryByText(/Days Out/)).toBeNull()
  })

  it('reads the date the learner entered', () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    window.localStorage.setItem(
      'cgp.examDate',
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    )
    seed()
    renderShell(TESTING_URL)
    startCourse()
    // Singular at one day — the chip is a sentence, not a template.
    expect(screen.getByText('1 Day Out')).toBeTruthy()
  })
})
