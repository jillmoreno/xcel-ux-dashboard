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
    /* NO STATE LABELS — 2026-09-22. This asserted "Now" and "Up next" were
       present; the direct ask removed both as a fourth telling of what the
       bullets already say. Inverted rather than deleted, so a reinstatement is
       a decision rather than a drift back. The states themselves are pinned by
       the bullet tests below, which is where they now live. */
    expect(within(sidebar).queryByText('Now')).toBeNull()
    expect(within(sidebar).queryByText('Up next')).toBeNull()
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
    /* COUNTED OFF THE BULLETS, not the word. This asserted `getByText('Done')`
       until 2026-09-22, when the last of the three state labels was removed —
       the bullets carry the state now, so reading it anywhere else would be
       testing a label that no longer exists. Exactly the chapters BEFORE the
       current one are filled: one fewer than the current index would mean an
       off-by-one, one more would mean the current chapter marked complete. */
    const filled = [...sidebar.querySelectorAll('ol > li')].filter(
      (li) =>
        (li.querySelector('span > span') as HTMLElement | null)?.style.background ===
        'var(--color-primary-500)',
    )
    expect(filled).toHaveLength(NY_LH_CURRENT_CHAPTER_INDEX)
    // …and no state label survives anywhere in the tree.
    expect(within(sidebar).queryByText('Done')).toBeNull()
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
       is not is the thing a reviewer reports as broken.
     
       THREE, not one, as of 2026-09-22: the two breadcrumb crumbs became real
       when they were asked to wear the house link-CTA. That is the same rule
       in the same direction rather than an exception to it — they now LOOK
       pressable, so they had to BE pressable. The list is asserted by name so
       a fourth cannot appear quietly. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const names = screen.getAllByRole('button').map(
      (b) => b.getAttribute('aria-label') ?? b.textContent,
    )
    expect(names).toEqual([
      'Home',
      'Overview',
      expect.stringMatching(/Close course player/),
    ])
  })

  it('leaves via either crumb, the same as Close', () => {
    // Both crumbs are "up", and up from the player is the dashboard. Asserted
    // for each rather than once, because they are two call sites of one intent
    // and wiring only the first is the easy miss.
    for (const name of ['Home', 'Overview']) {
      seed()
      const { container, unmount } = renderShell(TESTING_URL)
      startCourse()
      expect(screen.getByLabelText('Course contents')).toBeTruthy()
      act(() => {
        fireEvent.click(screen.getByRole('button', { name }))
      })
      expect(screen.queryByLabelText('Course contents')).toBeNull()
      expect(container.querySelector('.cre-platform-shell-grid')).not.toBeNull()
      unmount()
    }
  })

  it('wears the house link-CTA classes, and sets no colour of its own', () => {
    /* The direct ask: the same link style as Home's "Customize Study Plan".
       `.cre-cta-ink` carries the colour and re-points it on the dark theme, so
       an inline `color` here would beat the stylesheet — the trap that class's
       own note in `tokens.css` records. This pins the absence. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    for (const name of ['Home', 'Overview']) {
      const el = screen.getByRole('button', { name })
      expect(el.className).toContain('cre-link-action')
      expect(el.className).toContain('cre-cta-ink')
      expect(el.style.color).toBe('')
    }
    /* AND THE TYPE, which the first pass missed — it took "link style" to mean
       the classes and kept the Figma's 11px/500, so the crumbs had the right
       colour and the wrong size. The house CTA is a type ramp as much as a
       colour. 13/600 is measured off Home's "Customize Study Plan"; the weight
       is on the control and the size is inherited from the row, so both are
       asserted where they are actually set. */
    const crumbRow = screen.getByText('Course').parentElement as HTMLElement
    expect(crumbRow.style.fontSize).toBe('13px')
    expect(screen.getByRole('button', { name: 'Overview' }).style.fontWeight).toBe('600')
    // The crumb you are on shares the size and differs only in weight and ink.
    expect(screen.getByText('Course').style.fontWeight).toBe('500')
    // …and the crumb you are ON is not a link.
    expect(screen.getByText('Course').tagName).toBe('SPAN')
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

describe('the contents tree reads its three states apart', () => {
  /*
   * 2026-09-22, the direct ask. There were TWO bullets — an outline check for
   * done and one navy ring for everything else — so the chapter a learner is
   * ON and the eight they have not opened looked identical, and the navy on an
   * untouched chapter read as active.
   *
   * Asserted as the three being DISTINCT rather than as three hex values: the
   * claim is that a learner can tell them apart, and pinning the literals would
   * fail on any repalette while telling nobody whether that still held.
   */
  const bullets = () =>
    [...document.querySelectorAll('aside[aria-label="Course contents"] ol > li')].map(
      (li) => li.querySelector('span > span') as HTMLElement,
    )

  it('gives done, current and not-started three different bullets', () => {
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const [done, , , , now, , notStarted] = bullets()
    // Done is FILLED and carries a tick; the other two are hollow and do not.
    expect(done.style.background).toBe('var(--color-primary-500)')
    expect(done.querySelector('svg')).not.toBeNull()
    expect(now.querySelector('svg')).toBeNull()
    expect(notStarted.querySelector('svg')).toBeNull()
    // …and the two hollow ones differ by ink, which is the whole signal.
    expect(now.style.border).toContain('var(--color-primary-500)')
    expect(notStarted.style.border).toContain('var(--color-neutral-300)')
    expect(now.style.border).not.toBe(notStarted.style.border)
  })

  it('threads the bullets together, and stops at the last one', () => {
    // The line ends at the final bullet rather than trailing into Resources,
    // so it is one fewer than the chapters — the assertion that catches an
    // off-by-one in either direction.
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const items = [...document.querySelectorAll('aside[aria-label="Course contents"] ol > li')]
    const threaded = items.filter((li) =>
      [...li.children].some((c) => (c as HTMLElement).style.position === 'absolute'),
    )
    expect(items).toHaveLength(NY_LH_COURSE_CHAPTERS.length)
    expect(threaded).toHaveLength(NY_LH_COURSE_CHAPTERS.length - 1)
  })

  it('keeps the bullets above the thread, not struck through by it', () => {
    /* The thread runs down the column behind the bullets. Without an opaque
       fill and a stacking context on each bullet the dashes cross the open
       rings and they read as struck through — which is why every state shares
       one base rather than only the filled one carrying a background. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    for (const b of bullets()) {
      expect(b.style.position).toBe('relative')
      expect(b.style.zIndex).toBe('1')
      expect(b.style.background).not.toBe('')
    }
  })
})
