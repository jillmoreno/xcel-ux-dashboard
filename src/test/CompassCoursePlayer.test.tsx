import { render, screen, act, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  NY_LH_COURSE_CHAPTERS,
  NY_LH_CURRENT_CHAPTER_INDEX,
  NY_LH_CURRENT_LESSON_PART,
  NY_LH_LESSON_PARTS,
  NY_LH_LESSON_MINUTES_INVENTED,
  NY_LH_LESSON_TITLES_INVENTED,
  NY_LH_CURRENT_CHAPTER,
} from '@/data/nyProducerRequirements'
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
    /* The percentage agrees too, and is not the 0 an unresolved course gives.
       Read as a bare "N%" since 2026-09-23: the grey "N% Complete" chip became
       Home's shared `ProgressBar` with the figure printed beside it, which
       carries no label of its own. */
    const pct = sidebar.textContent?.match(/(\d+)%/)?.[1]
    expect(pct).toBeTruthy()
    expect(Number(pct)).toBeGreaterThan(0)
  })

  it('lists LESSONS, counted off the same figures as the card', () => {
    /* ⚠ THE TREE CHANGED UNIT 2026-09-23, the direct ask: "there should be 42
       lessons listed in that table of contents according to the home screen 26
       of 42 completed."

       It listed `NY_LH_COURSE_CHAPTERS` — eleven chapter names — while every
       count on the dashboard is in LESSONS. A contents tree that cannot agree
       with "26 of 42" about how much there is cannot show a learner where they
       are.

       THE COUNTS ARE SOURCED AND THE TITLES ARE ORDINALS. Asserted as agreement
       with the card rather than as 42, because the number is a fixture. */
    seed()
    renderShell(TESTING_URL)
    const block = screen.getByText(/of \d+ lessons/i).closest('section, div') as HTMLElement
    const [, doneStr, totalStr] =
      block.textContent?.match(/(\d+) of (\d+) lessons/i) ?? []
    expect(doneStr).toBeTruthy()
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    expect(sidebar.textContent).toContain(`Completed ${doneStr} of ${totalStr}`)
    /* The current lesson is the one after the last completed, and it leads.
       Named by its TITLE since 2026-09-23 — `NY_LH_LESSON_TITLES_INVENTED`
       authors the visible window, and lesson 27's entry REFERENCES
       `NY_LH_CURRENT_CHAPTER` rather than retyping it, so the tree and the card
       cannot name the learner's position two different things. That agreement
       is what this asserts; the string itself is a fixture. */
    const current = Number(doneStr) + 1
    expect(sidebar.textContent).toContain(NY_LH_LESSON_TITLES_INVENTED[current])
    expect(NY_LH_LESSON_TITLES_INVENTED[current]).toBe(NY_LH_CURRENT_CHAPTER)
  })

  it('keeps the current lesson at the TOP, with the completed run collapsed', () => {
    /* The reason the summary line exists: 26 completed rows would put the
       lesson a learner is actually on 26 rows down a 220px column. Collapsed,
       it is the first row in the list. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const done = Number(sidebar.textContent?.match(/Completed (\d+) of/)?.[1])
    expect(done).toBeGreaterThan(0)
    // Not one of the completed lessons is rendered while collapsed…
    expect(sidebar.textContent).not.toMatch(new RegExp(`Lesson ${done}\\b`))
    // …and the current one leads the list, by its authored title.
    const rows = [...sidebar.querySelectorAll('ol > li')].map((li) => li.textContent?.trim())
    expect(rows[0]).toBe(NY_LH_LESSON_TITLES_INVENTED[done + 1])
  })

  it('expands the completed run on demand, and collapses it again', () => {
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const summary = within(sidebar).getByRole('button', { name: /Completed \d+ of \d+/ })
    expect(summary).toHaveAttribute('aria-expanded', 'false')
    act(() => {
      fireEvent.click(summary)
    })
    expect(summary).toHaveAttribute('aria-expanded', 'true')
    expect(sidebar.textContent).toContain('Lesson 1')
    act(() => {
      fireEvent.click(summary)
    })
    expect(sidebar.textContent).not.toContain('Lesson 1')
  })

  it('previews the upcoming lessons, with Show all for the rest', () => {
    /* The other half of the ask — "if there would be excessive scrolling for
       the uncompleted we can add a 'show all' link cta". Asserted against the
       real total rather than a literal count of rows. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const total = Number(sidebar.textContent?.match(/Completed \d+ of (\d+)/)?.[1])
    const before = sidebar.querySelectorAll('ol > li').length
    expect(before).toBeLessThan(total)
    const showAll = within(sidebar).getByRole('button', { name: /Show all \d+ lessons/ })
    act(() => {
      fireEvent.click(showAll)
    })
    const after = sidebar.querySelectorAll('ol > li').length
    expect(after).toBeGreaterThan(before)
    // Every remaining lesson is now listed, ending at the last one.
    expect(sidebar.textContent).toContain(`Lesson ${total}`)
    expect(within(sidebar).queryByRole('button', { name: /Show all/ })).toBeNull()
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
    /* STATIC BY INSTRUCTION. Notes, Ask Rubi, search and settings render and do
       nothing, so they are NOT buttons — a control that looks pressable and is
       not is the thing a reviewer reports as broken.
     
       THE COUNT KEEPS GROWING and that is the rule working, not eroding: Home,
       the eight page rows, the two contents expanders and Close all DO
       something. Asserted as "every button has a handler's effect we have
       named" rather than a number — the invariant is that nothing pressable is
       inert, not that the list stays short. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const names = screen.getAllByRole('button').map(
      (b) => (b.getAttribute('aria-label') ?? b.textContent ?? '').trim(),
    )
    for (const p of ['Overview', 'Course', 'Flashcards', 'Exam Simulator', 'Progress', 'Resources', 'Readiness', 'Rubi Insights']) {
      expect(names).toContain(p)
    }
    expect(names).toContain('Home')
    expect(names.some((n) => /Completed \d+ of \d+/.test(n))).toBe(true)
    expect(names.some((n) => /Close course player/.test(n))).toBe(true)
    // The four inert bits of chrome are NOT among them.
    for (const inert of ['Notes', 'Ask Rubi', 'Next', 'Previous']) {
      expect(names).not.toContain(inert)
    }
  })

  it('leaves via Home — the one crumb that still exits', () => {
    /* ⚠ NARROWED 2026-09-23. This asserted BOTH crumbs left the player, which
       was right while Overview had nothing behind it. Overview is now a page of
       this course and switches the view instead, so Home is the only exit and
       the old sweep would have passed on a bug — it clicked Overview, saw the
       player gone, and called that success. */
    seed()
    const { container } = renderShell(TESTING_URL)
    startCourse()
    expect(screen.getByLabelText('Course contents')).toBeTruthy()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Home' }))
    })
    expect(screen.queryByLabelText('Course contents')).toBeNull()
    expect(container.querySelector('.cre-platform-shell-grid')).not.toBeNull()
  })

  it('wears the house link-CTA classes, and sets no colour of its own', () => {
    /* The direct ask: the same link style as Home's "Customize Study Plan".
       `.cre-cta-ink` carries the colour and re-points it on the dark theme, so
       an inline `color` here would beat the stylesheet — the trap that class's
       own note in `tokens.css` records. This pins the absence. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    /* HOME ALONE since 2026-09-23. "Overview" was the second crumb; it is a
       PAGE ROW in the course rail now and wears that rail's treatment instead,
       so asserting the link-CTA on it would pin the wrong component. */
    {
      const el = screen.getByRole('button', { name: 'Home' })
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
    /* Found via the trail element. "Course" and "Overview" both appear twice
       in the sidebar now — once in the trail, once as a rail row — so a
       by-text lookup finds two. */
    const crumbRow = screen.getByLabelText('Course contents').querySelector('p') as HTMLElement
    expect(crumbRow.style.fontSize).toBe('13px')
    expect(within(crumbRow).getByRole('button', { name: 'Home' }).style.fontWeight).toBe('600')
    // The crumb naming the active page shares the size and differs in weight.
    const here = crumbRow.querySelector('span:last-child') as HTMLElement
    expect(here.style.fontWeight).toBe('500')
    // …and the crumb you are ON is not a link. It names the ACTIVE PAGE now,
    // so it reads "Course" only because Course is where the player opens.
    /* The trail's own crumb is a plain span, not a link and not `aria-current`
       — the rail below carries that. Found via the trail element rather than by
       text, since "Course" now appears twice in the sidebar: once as the trail
       and once as a rail row. */
    const trail = screen.getByLabelText('Course contents').querySelector('p')!
    expect(trail.querySelector('[aria-current="page"]')).toBeNull()
    expect(trail.textContent).toContain('Course')
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
    const sidebar = screen.getByLabelText('Course contents')
    // Expand the completed run so all three states are on screen at once.
    act(() => {
      fireEvent.click(within(sidebar).getByRole('button', { name: /Completed \d+ of \d+/ }))
    })
    const all = bullets()
    const done = all[0]
    const current = all.find((b) => b.style.border?.includes('var(--color-primary-500)'))!
    const upcoming = all.find((b) => b.style.border?.includes('var(--color-neutral-300)'))!
    // Done is FILLED and carries a tick; the other two are hollow and do not.
    expect(done.style.background).toBe('var(--color-primary-500)')
    expect(done.querySelector('svg')).not.toBeNull()
    expect(current.querySelector('svg')).toBeNull()
    expect(upcoming.querySelector('svg')).toBeNull()
    // …and the two hollow ones differ by ink, which is the whole signal.
    expect(current.style.border).not.toBe(upcoming.style.border)
  })

  it('threads the rows together, and stops at the last VISIBLE one', () => {
    /* The thread is drawn per row and omitted on the last, so the line ends at
       a bullet rather than trailing into the link below it. Counted off the
       RENDERED rows rather than the lesson total — collapsing the upcoming run
       has to end the thread at the last visible row, which is the case a
       total-based count would miss. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const items = [...sidebar.querySelectorAll('ol > li')]
    const threaded = items.filter((li) =>
      [...li.children].some((c) => (c as HTMLElement).style.position === 'absolute'),
    )
    expect(items.length).toBeGreaterThan(1)
    expect(threaded).toHaveLength(items.length - 1)
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

describe('the top bar states where you are', () => {
  /*
   * 2026-09-23, the direct ask: "this should definitely include the Chapter
   * Name, and lesson details here, maybe take it out of the pill."
   *
   * The pill was the problem rather than its styling — a fixed-height rounded
   * container with `nowrap` had one line for a 48-character chapter name and
   * elided it to "Life Insurance Premiu…", losing the one fact the bar exists
   * to state.
   */
  const topBar = () => {
    const bars = [...document.querySelectorAll('header')]
    return bars[bars.length - 1] as HTMLElement
  }

  it('names the chapter in full, and does not truncate it', () => {
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const current = NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX]
    expect(topBar().textContent).toContain(current)
    // The whole name, not a prefix of it — the failure mode was an ellipsis.
    expect(topBar().textContent).not.toMatch(/…|\.\.\./)
  })

  it('states the chapter and its estimate, and labels the unit as neither', () => {
    /* ⚠ THIRD REWRITE IN A DAY, and the arc is the point rather than the churn.
       It pinned "Lesson 27 · Part 1 of 3"; then a "Current Lesson" eyebrow that
       replaced it; now neither.

       The eyebrow's removal settles a tension it introduced. The title is a
       CHAPTER name from `NY_LH_COURSE_CHAPTERS`, and the course counts 42
       lessons against 11 chapters with no published mapping — "Current Lesson"
       over a chapter asserted that equivalence. The bar now names the chapter
       and its estimate and claims nothing about the unit, which is the only
       reading the fixtures support.

       Asserted as three absences plus what remains, so any of the three
       discarded labels coming back is a decision rather than a drift. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const bar = topBar().textContent ?? ''
    expect(bar).toContain(NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX])
    expect(bar).toContain(
      `Estimated Time to Complete: ${NY_LH_LESSON_MINUTES_INVENTED} minutes`,
    )
    expect(bar).not.toMatch(/Current Lesson/i)
    expect(bar).not.toMatch(/Lesson \d+/)
    expect(bar).not.toMatch(/Part \d+ of \d+/)
  })

  it('states the estimate the way the Home card does', () => {
    /* Same words and the same constant on both surfaces — the figure is
       INVENTED (`NY_LH_LESSON_MINUTES_INVENTED`), so the thing worth pinning is
       that neither surface retypes it and they cannot drift to two different
       durations for one lesson. */
    seed()
    renderShell(TESTING_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    const line = `Estimated Time to Complete: ${NY_LH_LESSON_MINUTES_INVENTED} minutes`
    expect(card.textContent).toContain(line)
    startCourse()
    expect(topBar().textContent).toContain(line)
  })

  it('still knows the lesson, even though it no longer prints it', () => {
    // The meta channel is the part that was hard to get right — four failed
    // derivations — so its survival is pinned separately from the rendering.
    seed()
    renderShell(TESTING_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    expect(card.textContent).toMatch(/Lesson \d+/)
    expect(card.textContent).toContain(
      `Part ${NY_LH_CURRENT_LESSON_PART} of ${NY_LH_LESSON_PARTS}`,
    )
  })

  it('states NO percentage — there is one progress readout, in the nav', () => {
    /* TWO REWRITES IN TWO DAYS, and both are the same claim narrowing.
     
       First it pinned that the bar's pill said "Section: <chapter>" beside the
       COURSE percentage — a label attributing the whole course's progress to
       one chapter, since nothing here tracks per-chapter progress. That was
       corrected to "N% of course".

       Then the direct ask: "this progress belongs in the nav. we do not need
       multiple progress, its confusing." Two readouts of one number is not
       twice the information; it is a reader checking whether they disagree. So
       the top bar states WHERE YOU ARE and the nav states HOW FAR — and this
       asserts the toolbar carries no percentage at all, which is the only
       version of the claim that cannot drift back. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const bar = topBar().textContent ?? ''
    expect(bar).not.toMatch(/Section:/)
    expect(bar).not.toMatch(/\d+%/)
    // …and the nav is where it lives, exactly once.
    const sidebar = screen.getByLabelText('Course contents')
    expect(sidebar.textContent?.match(/\d+%/g)).toHaveLength(1)
  })

  it('uses the SHARED ProgressBar, matching Home rather than resembling it', () => {
    /* The rule that component was extracted for: Readiness once drew its own
       3px bar in a different green, and one learner's 32% became two different
       bars a rail item apart. A lookalike here would do it again, one screen
       apart this time. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const pct = sidebar.textContent?.match(/(\d+)%/)?.[1]
    /* `ProgressBar` renders an `aria-hidden` track with a single fill child
       whose width IS the percentage, and carries no role — it is decorative by
       design, because the figure beside it is the accessible statement. So the
       assertion is its shape and its number, not a role it deliberately does
       not have. */
    const fill = [...sidebar.querySelectorAll('div[aria-hidden="true"] > div')].find((d) =>
      (d as HTMLElement).style.width.endsWith('%'),
    ) as HTMLElement | undefined
    expect(fill).toBeTruthy()
    expect(fill!.style.width).toBe(`${pct}%`)
  })
})

describe('the invented lesson titles', () => {
  /*
   * ⚠ AUTHORED DATA. `NY_LH_LESSON_TITLES_INVENTED` covers the window a
   * reviewer sees and nothing else, which is what keeps it legible AS
   * invention — 42 plausible titles would be indistinguishable from a real
   * syllabus. These pin the two properties that make the invention safe.
   */
  it('makes lesson 27 the SAME string the card names, by reference', () => {
    // Not "equal to the same literal" — the map holds the constant itself, so
    // moving the demo's chapter moves both surfaces at once.
    expect(NY_LH_LESSON_TITLES_INVENTED[27]).toBe(NY_LH_CURRENT_CHAPTER)
  })

  it('falls back to the ordinal outside the authored window', () => {
    /* The fallback is the honesty mechanism, not an edge case: expanding the
       completed run drops straight back to "Lesson 12", so where the authoring
       stops is visible at a glance. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    act(() => {
      fireEvent.click(within(sidebar).getByRole('button', { name: /Completed \d+ of \d+/ }))
    })
    const rows = [...sidebar.querySelectorAll('ol > li')].map((li) => li.textContent?.trim())
    expect(rows).toContain('Lesson 1')
    expect(rows).toContain('Lesson 12')
    // …and the authored ones still read as titles, in the same list.
    expect(rows).toContain(NY_LH_LESSON_TITLES_INVENTED[27])
  })

  it('authors no title for a lesson the tree cannot reach', () => {
    // A title past the course length would never render and would be a claim
    // nobody could check — the map stops inside the course.
    const keys = Object.keys(NY_LH_LESSON_TITLES_INVENTED).map(Number)
    expect(Math.min(...keys)).toBeGreaterThan(0)
    expect(Math.max(...keys)).toBeLessThanOrEqual(42)
  })
})

describe('the Overview view', () => {
  /*
   * 2026-09-23, the direct ask: "When user clicks there, keep this left nav for
   * now. and everything on the right will be the background color."
   *
   * Overview is a THIRD STATE rather than a fourth exit. Both breadcrumb crumbs
   * used to close the player, which was right while there was nothing behind
   * them; Overview is a page of this course, so it keeps the contents nav and
   * replaces only the right-hand side. Home still leaves.
   */
  const openOverview = () => {
    const sidebar = screen.getByLabelText('Course contents')
    const nav = within(sidebar).getByRole('navigation', { name: 'Course pages' })
    act(() => {
      fireEvent.click(within(nav).getByRole('button', { name: 'Overview' }))
    })
  }

  it('keeps the nav and blanks the right-hand side', () => {
    seed()
    const { container } = renderShell(TESTING_URL)
    startCourse()
    openOverview()
    /* The nav column survives — the page rail, the course title and its
       progress. The CONTENTS TREE does not, and that is deliberate: it belongs
       to the Course page and answers "where am I in the coursework", which is
       not a question the other seven pages ask. Eight rail rows plus 42 lessons
       plus two expanders is also more than a 220px column holds. */
    const sidebar = screen.getByLabelText('Course contents')
    expect(sidebar.textContent).toContain('New York Life and Health Pre-licensing')
    expect(within(sidebar).getByRole('navigation', { name: 'Course pages' })).toBeTruthy()
    expect(sidebar.textContent).not.toContain('Completed 26 of 42')
    expect(sidebar.textContent).not.toContain('Show all')
    /* …and everything on the right is gone, replaced by the ground.
     
       ⚠ NOT asserted by searching the whole tree for "Course Content". That
       string names TWO things since 2026-09-23 — the reading column's
       placeholder caption AND the nav's own eyebrow — so a whole-container
       check cannot tell "the placeholder is gone" from "the eyebrow is still
       there", and it failed the moment the eyebrow was renamed. The reading
       column is identified by its own landmark instead. */
    expect(screen.queryByLabelText('Chat with Rubi')).toBeNull()
    expect(container.textContent).not.toContain('Estimated Time to Complete')
    expect(container.querySelector('main')).toBeNull()
    /* Named "<Page> page" since the rail landed — every one of the seven
       unbuilt pages renders the same ground, so the label has to say WHICH. */
    expect(screen.getByRole('region', { name: 'Overview page' })).toBeTruthy()
  })

  it('does NOT leave the player — Home is still the only exit', () => {
    /* The regression this guards: Overview closed the launcher until today, so
       the easy mistake is leaving that handler wired and having the crumb both
       switch the view and drop the learner back on the dashboard. */
    seed()
    const { container } = renderShell(TESTING_URL)
    startCourse()
    openOverview()
    expect(container.querySelector('.cre-platform-shell-grid')).toBeNull()
    expect(screen.getByLabelText('Course contents')).toBeTruthy()
  })

  it('marks exactly ONE element as the current page — the rail row', () => {
    /* ⚠ A BUG THIS CAUGHT. For one build the breadcrumb's trailing span AND the
       active rail row both carried `aria-current="page"` — two elements
       claiming to be the current page, which is worse than neither. The RAIL
       keeps it: it is the actual navigation, and the trail is derived from it.

       Also pins that the trail FOLLOWS the rail. It used to read a fixed
       "Home / Overview / Course", which would have said "Overview / Course"
       while the learner sat on Flashcards. */
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const current = () =>
      [...sidebar.querySelectorAll('[aria-current="page"]')].map((el) => el.textContent?.trim())
    expect(current()).toEqual(['Course'])
    expect(sidebar.querySelector('p')?.textContent).toContain('Course')

    act(() => {
      fireEvent.click(within(sidebar).getByRole('button', { name: 'Flashcards' }))
    })
    expect(current()).toEqual(['Flashcards'])
    expect(sidebar.querySelector('p')?.textContent).toContain('Flashcards')
    // …and the right-hand side is the bare ground for it.
    expect(screen.getByRole('region', { name: 'Flashcards page' })).toBeTruthy()
    expect(screen.queryByLabelText('Chat with Rubi')).toBeNull()
  })

  it('gives all eight pages a row, and only Course is built', () => {
    seed()
    renderShell(TESTING_URL)
    startCourse()
    const sidebar = screen.getByLabelText('Course contents')
    const nav = within(sidebar).getByRole('navigation', { name: 'Course pages' })
    const labels = [...nav.querySelectorAll('button')].map((b) => b.textContent?.trim())
    expect(labels).toEqual([
      'Overview',
      'Course',
      'Flashcards',
      'Exam Simulator',
      'Progress',
      'Resources',
      'Readiness',
      'Rubi Insights',
    ])
    // Course renders the player; every other page renders the ground.
    for (const label of labels.filter((l) => l !== 'Course')) {
      act(() => {
        fireEvent.click(within(nav).getByRole('button', { name: label! }))
      })
      expect(screen.getByRole('region', { name: `${label} page` })).toBeTruthy()
      expect(screen.queryByRole('main')).toBeNull()
    }
  })
})
