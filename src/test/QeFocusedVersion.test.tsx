import { readFileSync } from 'node:fs'
import { cleanup, fireEvent, render, screen, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
  defaultDiscoverabilityVersionFor,
  isQualifyingEducationVersion,
} from '@/data/dashboardVersions'
import { dashboardLayoutForVersion, railHidesSection } from '@/components/layout/dashboardRail'
import {
  journeyStepRows,
  journeyStopsFor,
  metaWords,
  statusWords,
} from '@/components/learning/studyJourneyUtil'
import { CATEGORY_BAR_HEIGHT } from '@/components/learning/progressGauge'
import {
  CATEGORY_PALETTE,
  CATEGORY_PALETTE_ON_DARK,
  categoryColorFor,
} from '@/components/learning/progressGaugeUtil'
import {
  dashboardProgressPersonaFor,
  DASHBOARD_PROGRESS_PICKER,
  type DashboardProgressVariant,
} from '@/data/dashboardProgressFixtures'
import { displayedProgressPct, timeRemainingText, longDate } from '@/components/learning/learningPathsHomeUtil'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  NY_LH_STUDY_PLAN_URL,
  NY_LH_COURSE_IMAGE,
  NY_LH_PRELICENSING_LESSONS,
  NY_LH_STUDY_PLAN_DAYS,
  NY_PRODUCER_HOURS_INVENTED,
  NY_LH_GUIDE_CHAPTERS_PARTIAL,
  NY_LH_CURRENT_CHAPTER,
  NY_LH_COURSE_CHAPTERS,
  NY_LH_PROGRAM_PARTS,
  NY_LH_LESSON_PARTS,
  NY_LH_CURRENT_LESSON_PART,
  NY_LH_LESSON_MINUTES_INVENTED,
  NY_GOVERNING_AGENCY,
  examFactsFor,
} from '@/data/nyProducerRequirements'
import { learningPathsFor, pathRequirementsFor } from '@/data/learningFixtures'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
import { JUMP_BACK_IN_MARK } from '@/components/learning/JumpBackInWidget'
import { STATUS_STRIP_BG, statusTreatment } from '@/components/learning/learningPathsHomeUtil'
import { STUDY_JOURNEY_EYEBROW } from '@/components/learning/StudyJourneyRail'
import { RAIL_GUTTER } from '@/components/layout/PlatformSideNav'
import { XCEL_NY_PRODUCER_PATH_ID } from '@/data/studyCalendarFixtures'
import { CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'

/**
 * QE FOCUSED — the qualifying-education dashboard version (2026-09-16), and
 * XCEL's default.
 *
 * Three things make it a version rather than a flag combination, and each is
 * pinned here: the Progress detail moves onto the PAGE, the top band slims to a
 * lead-in so the same figures do not render twice, and Recommended for You is
 * dropped. The Study Journey replaces Today's Tasks in the band.
 */

/**
 * Pin the three VARIANT FLAGS back to the treatments they shipped with.
 *
 * `dashboard-course-header`, `dashboard-journey-style` and
 * `dashboard-heading-font` all had their catalog defaults flipped on 2026-09-17
 * ("set this view as the default"). A great many tests in this file were
 * written against the previous defaults and render WITHOUT seeding, so the flip
 * changed their subject out from under them — the band's `hideHeader` in
 * particular removes the block's own art, title, meta line and progress bar,
 * which is what a dozen of them are about.
 *
 * This is the rule CLAUDE.md already states, applied in the other direction: "a
 * test about capability must pin the flags it depends on, or an editorial
 * default silently becomes its subject." So the tests that examine the classic
 * treatment now say so, and the ones that examine the new default seed nothing.
 *
 * It is NOT a claim that the classic look is correct — only that a test about
 * the block's header needs the block to have one.
 */
const CLASSIC_FLAGS = {
  'dashboard-course-header': { enabled: true, variant: 'none' },
  'dashboard-journey-style': { enabled: true, variant: 'default' },
  'dashboard-heading-font': { enabled: true, variant: 'sans' },
} as const

function seedClassic(extra: Record<string, unknown> = {}) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ ...CLASSIC_FLAGS, ...extra }),
  )
}

/**
 * QE Focused, NAMED rather than implied.
 *
 * Every render in this file used to pass a bare `/dashboard-rebrand` and rely
 * on QE Focused being what XCEL resolves to. That made ~95 assertions about
 * THIS version silently depend on which version happened to be default — and
 * when the default moved to Testing 2 on 2026-09-21, all of them started
 * testing a different page while still being named for this one. A suite about
 * a specific version asks for it by name; `defaultDiscoverabilityVersionFor` is
 * tested on its own, once, below.
 */
/**
 * The countdown a persona actually carries, as the surfaces print it.
 *
 * ⚠ READ FROM THE FIXTURE, NEVER TYPED. These assertions were a literal "27
 * days" until 2026-09-23 and every one of them had to be hand-edited the moment
 * the demo's day counts were re-authored to 29 / 17 / 3 — a literal cannot
 * catch a figure it was edited to match. What the tests below are actually
 * about is that the surfaces AGREE with the fixture and with each other, which
 * is true at any value.
 */
function personaCountdown(variant: DashboardProgressVariant = 'progress-on-track'): string {
  return timeRemainingText(dashboardProgressPersonaFor('xcel', variant, 'qe')!.renewal!.weeksLeft)
}

const QE_URL = '/dashboard-rebrand?version=discoverability-qe-focused'

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

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the QE Focused version is ARCHIVED but still reachable', () => {
  /*
   * 2026-09-22, the direct ask: "we can go ahead and remove these versions, we
   * are going in the direction of Testing Version."
   *
   * It came off the PICKER LIST only — the same mechanism Badged got in August.
   * The const, the type member, the `?version=` branches and every component
   * are kept, so a deep link still resolves. That is not a technicality: it is
   * what lets the 160 tests below go on describing this layout, which is the
   * layout Testing and Testing 2 are built on.
   */
  it('is still in THIS branch’s picker', () => {
    /* THIS BRANCH'S PICKER, NOT MAIN'S — 2026-09-24. This file came over from
       main with the home page's contents; main archived QE Focused and
       Marketing Focused off the picker, but that archive was deliberately NOT
       pulled onto feat/atlas-compass-global-nav (home contents only). So here
       QE Focused still leads and Atlas sits after Testing 2. When this branch
       merges into main, main's assertion is the one to keep. */
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    expect(ids).toContain(DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED.id)
  })

  it('still RESOLVES, which is what keeps this file meaningful', () => {
    /* Archiving a version must not make it unreachable — every test below
       renders `QE_URL`. If a later change starts rejecting unlisted versions,
       this fails first and explains why 160 tests are about to. */
    const { container } = renderShell(QE_URL)
    expect(container.querySelector('.cre-learner-focused-band')).not.toBeNull()
  })

  it('leads this branch’s picker, ahead of Testing, Testing 2 and Atlas', () => {
    /* THIS BRANCH'S PICKER, NOT MAIN'S — 2026-09-24. This file came over from
       main with the home page's contents; main archived QE Focused and
       Marketing Focused off the picker, but that archive was deliberately NOT
       pulled onto feat/atlas-compass-global-nav (home contents only). So here
       QE Focused still leads and Atlas sits after Testing 2. When this branch
       merges into main, main's assertion is the one to keep. */
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)).toEqual([
      'discoverability-qe-focused',
      'discoverability-testing',
      'discoverability-testing-2',
      'discoverability-atlas-compass-nav',
      'discoverability-marketing-focused',
      'discoverability-learner-focused',
    ])
  })

  it('is still what XCEL does NOT resolve to — Testing is', () => {
    expect(defaultDiscoverabilityVersionFor('xcel')).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id,
    )
  })

  it('keeps Marketing Focused as the HOUSE default for a non-XCEL brand', () => {
    /* ⚠ THE REASON THE CONST SURVIVES ARCHIVAL. `Brand` is a one-member union,
       so this branch is unreachable today — and it is the seam a second brand
       re-enters through, exactly like the `[data-brand]` selector in
       `tokens.css`. Deleting the version outright would leave that fallback
       pointing at nothing, and the failure would appear on the day someone
       adds a brand, not today. */
    const marketing = DISCOVERABILITY_DASHBOARD_VERSION_MARKETING_FOCUSED
    expect(marketing.id).toBe('discoverability-marketing-focused')
  })
})

describe('QE Focused resolves a QUALIFYING journey, never Continuing Ed', () => {
  it('opens on the pre-licensing path even though the flag defaults to `ce`', () => {
    // The flag's committed default is `ce`. Without the override the version
    // NAMED for qualifying education opened on a CE renewal path — the same
    // class of incoherence as the Jump Back In card putting securities tasks
    // under an insurance path, which only opening the page caught.
    renderShell(QE_URL)
    // `getAllBy` — the title appears in the band's lead-in AND in the Progress
    // section's own header below it, which is expected: the section is the
    // detail behind the lead-in and both name the path.
    expect(
      screen.getAllByText(/New York Life and Health Pre-licensing/i).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Florida Life & Health CE/i)).toBeNull()
  })
})

describe('Atlas/Compass Global Navigation — the Testing home under the Figma rail', () => {
  it('sits after the two Testing versions in the picker', () => {
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    expect(ids.indexOf('discoverability-atlas-compass-nav')).toBe(
      ids.indexOf('discoverability-testing-2') + 1,
    )
    expect(DISCOVERABILITY_DASHBOARD_VERSION_ATLAS_COMPASS_NAV.label).toBe(
      'Atlas/Compass Global Navigation',
    )
  })

  it('resolves to the Testing LAYOUT — the same page, not a copy of it', () => {
    // 2026-09-22: the home is feat/pace-presets-variant's Testing version.
    // One layout value is what keeps a later change to that home reaching
    // this version too.
    expect(dashboardLayoutForVersion('discoverability-atlas-compass-nav')).toBe('testing')
    expect(isQualifyingEducationVersion('discoverability-atlas-compass-nav')).toBe(true)
  })

  it('renders the Testing home — the qualifying journey, and no Readiness stub', () => {
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav')
    expect(
      screen.getAllByText(/New York Life and Health Pre-licensing/i).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Florida Life & Health CE/i)).toBeNull()
    // Testing drops the lo-fi Readiness tile; QE Focused keeps it.
    expect(screen.queryByText('Not designed yet')).toBeNull()
  })

  it('asks ITS OWN rail which sections are reachable, not the Testing trim', () => {
    // The demo bar greys the Readiness dropdown off this question. Testing's
    // trim would also report Study Plan and Resources hidden — both of which
    // the Atlas rail shows.
    const v = 'discoverability-atlas-compass-nav'
    expect(railHidesSection(v, 'readiness')).toBe(true)
    expect(railHidesSection(v, 'study-plan')).toBe(false)
    expect(railHidesSection(v, 'resources')).toBe(false)
    expect(railHidesSection('discoverability-testing', 'study-plan')).toBe(true)
  })

  it('draws the Figma rail (49:3365) — the whole rail, in order AND in its groups', () => {
    // An order check alone is blind to grouping (the Resources/Rubi lesson),
    // so each group is read through its own `aria-labelledby` list.
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const names = (list: HTMLElement) =>
      within(list).getAllByRole('button').map((b) => b.textContent)
    expect(names(within(nav).getByRole('list', { name: 'My Learning' }))).toEqual([
      'Home',
      'Study Plan',
      'Course',
      'Certificates & Transcripts',
      'Resources',
    ])
    expect(names(within(nav).getByRole('list', { name: 'Support' }))).toEqual(['Get Help'])
    expect(within(nav).getAllByRole('button')).toHaveLength(6)
    // No collapse control — the design has none, so the shell pins it open.
    expect(within(nav).queryByRole('button', { name: /collapse|expand/i })).toBeNull()
    expect(within(nav).getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('Course lands on the course Overview; the other sub-pages are still blank', () => {
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav')
    fireEvent.click(screen.getByRole('button', { name: 'Course' }))
    // Opening it swaps the rail for the course's own, landing on Overview.
    expect(
      within(screen.getByRole('navigation', { name: 'Course' })).getByRole('button', {
        name: 'Overview',
      }),
    ).toHaveAttribute('aria-current', 'page')
    // Titled by the sub-page it lands on, not by the section.
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy()
    // Overview is the Compass course Overview page now (Figma 44:2211)…
    expect(container.querySelector('.cre-compass-overview')).toBeTruthy()
    // It is not My Courses.
    expect(container.textContent).not.toMatch(/My Courses/)
    // …while every other sub-page is still its title and nothing else.
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Course' })).getByRole('button', {
        name: 'Flashcards',
      }),
    )
    const h1 = screen.getByRole('heading', { level: 1, name: 'Flashcards' })
    expect(h1.closest('section')!.children).toHaveLength(1)
  })

  it('the Overview page is the Compass course Overview (Figma 44:2211)', () => {
    const { container } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course',
    )
    const page = container.querySelector<HTMLElement>('.cre-compass-overview')!
    // Full-bleed on its own page, not inside the section frame's padding.
    expect(page.closest('section')).toBeNull()
    // The learner's real name and course.
    expect(within(page).getByText(/Welcome, Alicia/)).toBeTruthy()
    expect(
      within(page).getByRole('heading', { level: 2, name: 'New York Life and Health Pre-licensing' }),
    ).toBeTruthy()
    // Its four blocks.
    for (const name of ['Your course', 'Rubi suggests']) {
      expect(within(page).getByLabelText(name)).toBeTruthy()
    }
    for (const name of ['Where you are', 'Your assignments', 'Rubi insights']) {
      expect(within(page).getByRole('heading', { level: 2, name })).toBeTruthy()
    }
    // The assignments are a real table with column headers.
    expect(within(page).getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      'Assignment',
      'Readiness',
      'Suggested',
    ])
    expect(within(page).getAllByRole('row')).toHaveLength(3)
    // Three learning tips.
    expect(within(page).getAllByText(/Learning tip/)).toHaveLength(3)
  })

  it('Begin Course opens the Compass Course page; Learn more opens Rubi Insights', () => {
    const { container } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course',
    )
    fireEvent.click(screen.getByRole('button', { name: /Begin Course/ }))
    expect(container.querySelector('.cre-compass-rail')).toBeTruthy()
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('button', {
        name: 'Overview',
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Learn more' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Rubi Insights' })).toBeTruthy()
  })

  it('the Compass Course page carries the player controls bar — and only that page', () => {
    const { unmount } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    const bar = screen.getByRole('toolbar', { name: 'Course player controls' })
    // The section is the rail's current one, its progress derived from its
    // lessons (1 of 7 done), so the bar and the rail agree.
    expect(within(bar).getByText('Chapter 1: Basic Principles of Life and Health Insurance')).toBeTruthy()
    expect(within(bar).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '14')
    // Close returns to the course Overview.
    fireEvent.click(within(bar).getByRole('button', { name: 'Close the course player' }))
    expect(screen.queryByRole('toolbar', { name: 'Course player controls' })).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy()
    unmount()
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=flashcards')
    expect(screen.queryByRole('toolbar', { name: 'Course player controls' })).toBeNull()
  })

  it('the Compass Course page carries the Rubi right rail, toggled from the player bar', () => {
    renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    const bar = screen.getByRole('toolbar', { name: 'Course player controls' })
    const rubiButton = within(bar).getByRole('button', { name: 'Rubi' })
    // Open by default, and the bar says so.
    expect(screen.getByRole('complementary', { name: 'Chat with Rubi' })).toBeTruthy()
    expect(rubiButton).toHaveAttribute('aria-pressed', 'true')
    // Its own close…
    fireEvent.click(screen.getByRole('button', { name: 'Close Rubi' }))
    expect(screen.queryByRole('complementary', { name: 'Chat with Rubi' })).toBeNull()
    expect(rubiButton).toHaveAttribute('aria-pressed', 'false')
    // …and the bar brings it back.
    fireEvent.click(rubiButton)
    expect(screen.getByRole('complementary', { name: 'Chat with Rubi' })).toBeTruthy()
  })

  it('the Rubi rail is only on the Compass Course page', () => {
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course')
    expect(screen.queryByRole('complementary', { name: 'Chat with Rubi' })).toBeNull()
  })

  it("Home's course button opens the Compass Course page on Atlas — and only there", () => {
    // On Atlas the course card's button reads "Begin Course" (2026-09-24).
    const { container, unmount } = renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav')
    fireEvent.click(screen.getByRole('button', { name: /^Begin Course/ }))
    expect(container.querySelector('.cre-compass-rail')).toBeTruthy()
    expect(screen.getByRole('toolbar', { name: 'Course player controls' })).toBeTruthy()
    unmount()
    // Testing shares the home layout but has no Compass course page: its
    // Resume keeps the in-shell launcher.
    const testing = renderShell('/dashboard-rebrand?version=discoverability-testing')
    fireEvent.click(screen.getByRole('button', { name: /^Resume/ }))
    expect(testing.container.querySelector('.cre-compass-rail')).toBeNull()
  })

  it('the Compass Course page ends in the navigation footer, its steps from the TOC', () => {
    const { unmount } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    const nav = screen.getByRole('navigation', { name: 'Course navigation' })
    // Either side of the rail's current lesson (Nature of Insurance).
    expect(within(nav).getByRole('button', { name: 'Previous: Exam: Basic Principles of Life and Health Insurance' })).toBeDisabled()
    expect(within(nav).getByRole('button', { name: 'Next: Exam: Nature of Insurance' })).toBeDisabled()
    unmount()
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course')
    expect(screen.queryByRole('navigation', { name: 'Course navigation' })).toBeNull()
  })

  it("the rail's % Complete matches the player bar's section progress", () => {
    renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    const barPct = within(screen.getByRole('toolbar', { name: 'Course player controls' }))
      .getByRole('progressbar')
      .getAttribute('aria-valuenow')
    expect(screen.getByText(`${barPct}% Complete`)).toBeTruthy()
  })

  it('the course content sits on the same warm page as the Overview', () => {
    renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    const column = screen.getByRole('navigation', { name: 'Course navigation' }).parentElement!
    expect(column.style.background).toBe('var(--color-compass-page)')
  })

  it("Atlas/Compass pins its player bar under a 60px header (100 = 40 + 60)", () => {
    // The header is 60px on this version and 72 elsewhere; the shell's pin
    // offsets are derived from it, so the bar and the rails move with it.
    renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    expect(screen.getByRole('toolbar', { name: 'Course player controls' }).style.top).toBe('100px')
  })

  it('the Overview page appears only on the Atlas/Compass version', () => {
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-qe-focused&section=course')
    expect(container.querySelector('.cre-compass-overview')).toBeNull()
  })

  it('the Course page swaps in the COURSE rail (Figma 49:3536)', () => {
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course')
    // The Atlas rail is gone — its Primary nav and its captions.
    expect(screen.queryByRole('navigation', { name: 'Primary' })).toBeNull()
    expect(screen.queryByText('My Learning')).toBeNull()
    const course = screen.getByRole('navigation', { name: 'Course' })
    expect(within(course).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Overview',
      'Study Plan',
      'Course',
      'Flashcards',
      'Exam Simulator',
      'Progress',
      'Resources',
      'Rubi Insights',
    ])
    expect(within(course).getByRole('button', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    // The learner's real course, not the design's placeholder title.
    // In the rail as well as on the Overview's course card.
    expect(within(course.parentElement!).getByText('New York Life and Health Pre-licensing')).toBeTruthy()
    expect(screen.queryByText(/Longer Course Title/)).toBeNull()
  })

  it('the breadcrumb names the sub-page you are on', () => {
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course')
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByText('Overview')).toHaveAttribute('aria-current', 'page')
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Course' })).getByRole('button', {
        name: 'Exam Simulator',
      }),
    )
    expect(within(crumbs).getByText('Exam Simulator')).toHaveAttribute('aria-current', 'page')
    // …and the page heading follows it, so the two always name one place.
    expect(screen.getByRole('heading', { level: 1, name: 'Exam Simulator' })).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 1, name: 'Course' })).toBeNull()
  })

  it("the breadcrumb's home icon goes back to Home and the Atlas rail", () => {
    renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=flashcards',
    )
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    fireEvent.click(within(crumbs).getByRole('button', { name: 'Home' }))
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('button', { name: 'Home' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })

  it('the course\'s own Course page gets the COMPASS LMS rail (Figma 49:2922)', () => {
    const { container } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    expect(container.querySelector('.cre-compass-rail')).toBeTruthy()
    // It replaces the Atlas course rail — the sub-page list is gone.
    expect(screen.queryByRole('navigation', { name: 'Course' })).toBeNull()
    expect(screen.getByRole('navigation', { name: 'Table of Contents' })).toBeTruthy()
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByText('Course')).toHaveAttribute('aria-current', 'page')
    // Real course, real progress — the same figure Home prints, not the
    // design's "5% Complete".
    expect(screen.getByText('New York Life and Health Pre-licensing')).toBeTruthy()
    expect(screen.queryByText('5% Complete')).toBeNull()
    expect(screen.getByText(/^\d+% Complete$/)).toBeTruthy()
  })

  it('is ONLY on that page — Overview and the other sub-pages keep the Atlas course rail', () => {
    for (const page of ['', '&coursePage=flashcards']) {
      const { container, unmount } = renderShell(
        `/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course${page}`,
      )
      expect(container.querySelector('.cre-compass-rail')).toBeNull()
      unmount()
    }
  })

  it('its breadcrumb: Overview goes back to the course Overview, Home goes Home', () => {
    const { container } = renderShell(
      '/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=course&coursePage=course',
    )
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('button', {
        name: 'Overview',
      }),
    )
    expect(container.querySelector('.cre-compass-rail')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy()
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Course' })).getByRole('button', {
        name: 'Course',
      }),
    )
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('button', {
        name: 'Home',
      }),
    )
    expect(
      within(screen.getByRole('navigation', { name: 'Primary' })).getByRole('button', {
        name: 'Home',
      }),
    ).toHaveAttribute('aria-current', 'page')
  })

  it('keeps the Atlas rail on every other Atlas page', () => {
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav&section=study-plan')
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
  })

  it('leaves every other version on the shared rail', () => {
    renderShell('/dashboard-rebrand?version=discoverability-qe-focused')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).queryByText('Certificates & Transcripts')).toBeNull()
    expect(nav.querySelector('.cre-atlas-nav-row')).toBeNull()
  })

  it('keeps the row states in the class, with nothing inline to beat them', () => {
    // An inline padding / colour / background would win over
    // `[aria-current='page']` and the active row would look idle.
    renderShell('/dashboard-rebrand?version=discoverability-atlas-compass-nav')
    const home = screen.getByRole('button', { name: 'Home' })
    expect(home.style.padding).toBe('')
    expect(home.style.paddingLeft).toBe('')
    expect(home.style.color).toBe('')
    expect(home.style.background).toBe('')
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-atlas-nav-row\[aria-current='page'\]\s*\{[^}]*border-left: 3px solid/)
  })
})

describe('there is NO Learning Path Progress section', () => {
  /**
   * It rendered the detail panel's Progress half inline — gauge, category bars
   * and stat tiles, then the per-category course lists. Both halves ended up
   * elsewhere on this version: the SUMMARY moved to the Current Learning
   * Progress block, and the LISTS are the Study Journey, which walks the same
   * categories in order with each stop's status in words.
   *
   * What was left was a second copy of the path title, sub-line, status strip
   * and a "Go to Learning Path" button, directly under a block that already has
   * all four.
   */
  it('is gone from the page', () => {
    renderShell(QE_URL)
    expect(screen.queryByRole('region', { name: /learning path progress/i })).toBeNull()
  })

  it('and the NOTE that replaced it is a comment, not page copy', () => {
    // It shipped as a bare `/* … */` inside JSX rather than `{/* … */}`, which
    // makes it a TEXT NODE: twenty-eight lines of removal rationale rendered on
    // Home, on every version. tsc was clean and every test passed — a block
    // comment in child position is valid JSX text.
    //
    // Asserted across the whole overview rather than on this one note, because
    // the mistake is invisible in review and one keystroke away anywhere.
    for (const url of [
      QE_URL,
      '/dashboard-rebrand?version=discoverability-learner-focused',
      '/dashboard-rebrand?version=discoverability-marketing-focused',
    ]) {
      const { container, unmount } = renderShell(url)
      expect(container.textContent, url).not.toMatch(/\/\*|\*\//)
      unmount()
    }
  })

  it('leaves exactly ONE of each fact it used to duplicate', () => {
    // The reason it went. Asserted by count, because the failure was
    // duplication rather than absence.
    renderShell(QE_URL)
    expect(screen.getAllByText(/New York Life and Health Pre-licensing/i)).toHaveLength(1)
    expect(screen.getAllByText(/On Track/)).toHaveLength(1)
    // "Time Remaining" used to be the third fact checked here. It is not on the
    // page at all now — it left with the KPI cells on 2026-09-17, and the
    // countdown is stated only by the course header band. See
    // "the page states its countdown ONLY via the header band" below, which is
    // what pins that dependency.
    expect(screen.queryAllByText('Time Remaining')).toHaveLength(0)
  })

  it('no longer renders the panel body outside the Sheet at all', () => {
    // `embedded` and `hideSummary` went with the section — two props with no
    // caller are two things to keep working for nothing. The Sheet is the only
    // host again, so the body's Close affordance is unconditional.
    const src = readFileSync('src/components/learning/LearningPathDetailPanel.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(src).not.toMatch(/\bembedded\b/)
    expect(src).not.toMatch(/\bhideSummary\b/)
  })

  it('kept the course lists reachable — as the Study Journey', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // The lists are not lost, they are the journey. Asserted so "restore the
    // section to get the lists back" is visibly the wrong fix.
    renderShell(QE_URL)
    const list = screen.getByRole('list', { name: /study journey stops/i })
    // ONE row for the course, not a split: the 42 lessons ARE the pre-licensing
    // course and it is the journey's first part. Under hours a big category
    // halved into "· Part 1 / · Part 2"; lessons do not split.
    expect(list.textContent).toMatch(/Pre-licensing Course/)
    expect(list.textContent).not.toMatch(/· Part \d|· Day \d/)
    // The course row carries its own progress, the way the card does. With ONE
    // counted stop nothing reads "Completed" until the whole course is, which
    // is why the count is what this asserts on.
    expect(list.textContent).toMatch(/\d+ \/ 42 lessons/)
  })
})

describe('the Study Journey replaces Today\'s Tasks', () => {
  it('renders the journey and not the day view', () => {
    renderShell(QE_URL)
    expect(screen.getByText(STUDY_JOURNEY_EYEBROW)).toBeInTheDocument()
    // Today's Tasks answers "what is due"; the Study Plan rail item and the
    // week strip already answer that twice. Asserted as an absence so bringing
    // it back alongside the journey is a deliberate act.
    expect(screen.queryByText(/Today's tasks/i)).toBeNull()
  })

  it('derives its stops from the path categories, in order', () => {
    // Asserted at the FUNCTION, not through the DOM. The degrade that matters
    // is a milestone silently reading as a lesson, and a `queryByText` on the
    // title passes either way — the same reason the Links panel tests its type
    // degrade at the store.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    /*
     * FIVE STOPS, 1:1 WITH THE LMS'S OWN STEP BREADCRUMB — 2026-09-23, the
     * direct ask against a screenshot of it.
     *
     * ⚠ THIS USED TO BE FOUR, and the fourth was in the wrong place. The
     * journey was built from the public storefront, which never mentions the
     * course exam that closes Part 1; the LMS shows it, and shows it SECOND.
     * The old order had a learner taking the Prep Review before the exam it
     * prepares nothing for. Attestation moved up to ride with that exam, and
     * the closing stop became the survey and the certificate.
     *
     * The counts in two of the labels are the LMS's too — 1 exam closing Part
     * 1, 23 in the Prep Review. See `NY_LH_PRELICENSING_LESSON_COUNT`, whose
     * note flags that the 41 + 1 = 42 reconciliation is an inference.
     *
     * STEP 1 CARRIES NO COUNT, unlike the other two: "(41)" sat three inches
     * under a card already printing "26 of 42 lessons", and two counts of the
     * same course arguing is worse than one count stated once.
     */
    expect(stops.map((s) => s.title)).toEqual([
      'Pre-Licensing Lessons (42)',
      'Course Exam (1)',
      // ⚠ SPLIT OFF THE EXAM ROW 2026-09-23 ("after course exam, add another
      // line for attestation and affidavit"). It rode on the exam for an hour,
      // having been half of the closing stop before that.
      'Attestation & Affidavit',
      'Prep Review (23)',
      'Simulated Exams (3)',
      'Survey & Certificate',
    ])
    /* STILL EXACTLY ONE COUNTED STOP, which is the property the renaming must
       not have quietly broken: the labels now print 41 and 23, and the
       temptation is to make those requirement figures. They are not. The gauge's
       denominator is the state's requirement and stays the whole 42. */
    const counted = stops.filter((s) => s.hours != null)
    expect(counted).toHaveLength(1)
    expect(counted[0].hours).toBe(NY_LH_PRELICENSING_LESSONS)
    // Assessments are milestones; coursework is not. Two of them now.
    /* The two ASSESSMENTS. Attestation is paperwork and gets no milestone node,
       which is the distinction splitting it off the exam row made visible. */
    expect(stops.filter((s) => s.milestone).map((s) => s.title)).toEqual([
      'Course Exam (1)',
      'Simulated Exams (3)',
    ])
  })

  it('reads the first stop the way the course card does', () => {
    // "26 / 42 lessons", not a bare "42 lessons" — the denominator alone is not
    // progress, and the card this is modelled on says "0 of 42 lessons
    // completed".
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const [first] = journeyStopsFor(persona.path)
    expect(metaWords(first, persona.path.unitLabel!)).toMatch(
      new RegExp(`\\d+ / ${NY_LH_PRELICENSING_LESSONS} lessons`),
    )
  })

  it('blocks Parts 2 and 3 until the coursework is done', () => {
    // Not decoration: the product page states Parts 2 and 3 unlock "upon
    // completion of Part 1". "Not started" would invite a click that cannot
    // work — the same reason the completion tasks are blocked.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    expect(stops.find((s) => s.title === 'Prep Review (23)')?.blocked).toBe(true)
    expect(stops.find((s) => s.title.startsWith('Simulated Exams'))?.blocked).toBe(true)
    /* AND THE COURSE EXAM, added 2026-09-23 — it sits between Part 1 and Part 2
       and follows the same rule for a plainer reason: you cannot sit the exam
       for a course you have not finished. */
    expect(stops.find((s) => s.title.startsWith('Course Exam'))?.blocked).toBe(true)
    expect(stops.find((s) => s.title === 'Attestation & Affidavit')?.blocked).toBe(true)
    // …and they say what they are, including the published targets.
    expect(stops.find((s) => s.title.startsWith('Simulated Exams'))?.group).toMatch(/3 simulators/)
  })

  it('states every stop\'s status in WORDS, not colour alone', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // `completed` and `not-started` carry no percentage, so without the words
    // they were distinguishable only by the node — same text, one filled circle
    // apart. The rule the Home week strip's DONE / IN PROGRESS flags follow.
    renderShell(QE_URL)
    // Scoped to the journey's own rows — the ordered list — rather than a
    // guessed ancestor. `Completed` also appears in the Progress section below,
    // so an over-wide scope would pass without the words being on the STOPS.
    const list = screen.getByRole('list', { name: /study journey stops/i })
    // The counted stop says how far through it is, in the path's own unit and
    // the way the course card reads it.
    expect(list.textContent).toMatch(/In progress/)
    expect(list.textContent).toMatch(/\d+ \/ 42 lessons/)
    /* BLOCKED rows print no VISIBLE meta as of 2026-09-16 — every stop after
     * the current one is blocked, so all of their lines ended in the same four
     * words and the rail was a paragraph of repetition where the point was a
     * sequence.
     *
     * The note here used to say the reason stayed "available to the row's
     * `title`". It was not: there was no `title` attribute in the component,
     * and on 2026-09-17 the words were put into a visually-hidden span instead.
     * So this now checks the two halves separately — nothing VISIBLE, and the
     * words still THERE — because a plain `textContent` check cannot tell a
     * dropped line from a hidden one, and the whole point of the rule is that
     * the state is never carried by colour alone.
     */
    const hidden = Array.from(list.querySelectorAll<HTMLElement>('span')).filter(
      (el) => el.style.clipPath === 'inset(50%)',
    )
    const visible = Array.from(list.querySelectorAll<HTMLElement>('span'))
      .filter((el) => el.style.clipPath !== 'inset(50%)' && el.children.length === 0)
      .map((el) => el.textContent)
      .join(' ')
    expect(visible).not.toMatch(/After your coursework/)
    expect(hidden.map((el) => el.textContent).join(' ')).toMatch(/After your coursework/)
  })

  it('holds no dates — that is the Study Plan\'s job', () => {
    // The two answer different questions, and a journey with due dates is just
    // a worse calendar. Pinned so "add the due date" gets re-decided.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    for (const stop of journeyStopsFor(persona.path)) {
      expect(Object.keys(stop)).not.toContain('dueDate')
    }
  })
})

describe('the New York Life and Health demo course', () => {
  it('measures LESSONS of the pre-licensing course, from one owner', () => {
    // 42, from the LMS course card ("0 of 42 lessons completed"). NOT from the
    // storefront, which publishes 40 credit hours, three simulators and eight
    // "What You'll Learn" topics and no lesson count at all — a weaker footing
    // than a published figure, and a much stronger one than the hour splits it
    // replaces, which were authored here.
    const path = learningPathsFor('xcel').find((p) => p.id === XCEL_NY_PRODUCER_PATH_ID)!
    expect(NY_LH_PRELICENSING_LESSONS).toBe(42)
    expect(path.hours).toBe(NY_LH_PRELICENSING_LESSONS)
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.unitLabel).toBe('lessons')
    expect(persona.path.mandatory?.required).toBe(NY_LH_PRELICENSING_LESSONS)
  })

  it('counts PART 1 only, and invents nothing for the other two', () => {
    // One measured category. Parts 2 and 3 are journey steps with no count,
    // because the storefront states none — the gauge showing one segment is
    // honest, and the journey below it carries the programme's shape.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.categories?.map((c) => c.label)).toEqual(['Pre-licensing Course'])
    expect(persona.path.elective?.required).toBe(0)
  })

  it('keeps the 7-day study plan as a confirmed FACT, unused as a measure', () => {
    // XCEL's product page links it as "Read our recommended study plan", so it
    // is real and worth holding on to even though the dashboard no longer
    // counts in days. The file name says `lh_ca` and the NEW YORK page links
    // it, so it is XCEL's Life & Health plan rather than another state's.
    expect(NY_LH_STUDY_PLAN_DAYS).toBe(7)
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/lh_ca_7days\.pdf/)
  })

  it('records the recovered chapter list as INCOMPLETE, and renders none of it', () => {
    // Decoded from the guide via its ToUnicode maps; it comes back with no
    // health chapters at all, which a Life AND Health course must have. So it
    // is kept for the next person and deliberately not rendered — padding it
    // would be authoring a curriculum XCEL does not publish.
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/NY_LH_GUIDE_CHAPTERS_PARTIAL/)
    const { container } = renderShell(QE_URL)
    expect(container.textContent).not.toMatch(/Nature of Insurance|Annunities/)
  })

  it('leads the path list, so the QE surfaces resolve to it', () => {
    expect(learningPathsFor('xcel')[0].id).toBe(XCEL_NY_PRODUCER_PATH_ID)
  })

  it('states CONFIRMED exam facts, sourced from the requirements page', () => {
    // Confirmed against XCEL's published requirements page — and CORRECTED
    // once. The persona holds the COMBINED Life, Accident & Health line (the
    // 40-hour one), which sits 150 scored questions in 150 minutes. It shipped
    // as 100 / 2 hours, which is the SINGLE-line figure: the first fetch
    // summarised the page's per-line table as "100 (Life/Health) or 150
    // (Personal Lines/P&C)", backwards. Pinned as values because getting them
    // wrong is the failure, and it has happened twice.
    const ny = examFactsFor('NY')
    expect(ny.invented).toBe(false)
    expect(ny.questions).toMatch(/150/)
    expect(ny.timeAllowed).toMatch(/150 minutes/)
    expect(ny.passMark).toBe(70)
    expect(ny.where).toMatch(/PSI/)
    expect(examFactsFor('FL').invented).toBe(false)
  })

  it('keeps XCEL\'s own product hours flagged, because the page states none', () => {
    // The distinction the fixture exists to hold: the 40-hour STATE requirement
    // is published, the prep-product hours are not. Asserted via the const's
    // name, which still carries `_INVENTED` on purpose — renaming it would
    // quietly upgrade the confidence of three figures that are still guesses.
    // Still 40, and still the figure the requirements sheet states — it is a
    // real regulatory number and it did NOT become a day count. The other
    // three hour fields are the invented product hours the days replaced; they
    // no longer reach any QE surface.
    expect(NY_PRODUCER_HOURS_INVENTED.preLicenseEducation).toBe(40)
  })

  it('keeps the exam facts per STATE, so Readiness cannot contradict Home', () => {
    // `EXAM_FACTS` was a hardcoded Florida 2-15 block — correct while Florida
    // was the only licence, and a flat contradiction the moment Home could say
    // New York, two rail items away.
    expect(examFactsFor('NY').exam).toMatch(/New York/i)
    expect(examFactsFor('FL').exam).toMatch(/Florida/i)
    // An unknown state degrades to Florida rather than an empty facts table.
    expect(examFactsFor('ZZ').state).toBe('FL')
    expect(examFactsFor(undefined).state).toBe('FL')
  })

  it('does NOT move the Continuing Ed persona off Florida', () => {
    // Scoped change: the QE journey demos New York; CE is a different education
    // type and still demos the Florida renewal cycle. A version switch must not
    // silently switch jurisdiction.
    const ce = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce')!
    expect(ce.path.state).toBe('FL')
  })
})

describe('the journey reads SEQUENTIALLY, in every progress state', () => {
  /**
   * `personaFor` used to scale each category independently —
   * `completed = required × ratio` — which made a learner 63% through their
   * pre-licensing coursework AND 63% through the exam simulators AND 63%
   * through the exam cram, all at once.
   *
   * The category bars survived that as decoration. The Study Journey did not:
   * a SEQUENCE whose every stop reads "In progress" answers nothing about what
   * to do next, which is the one question a journey is for.
   *
   * Swept across every progress variant rather than asserted on today's
   * default, for the reason `ProgressAgreement` gives: a surface that only
   * holds at the default passes until a reviewer moves the dropdown, which is
   * the first thing a reviewer does.
   */
  const VARIANTS = DASHBOARD_PROGRESS_PICKER.map((o) => o.variant)

  it('fills categories in curriculum order, never in parallel', () => {
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const cats = persona.path.categories!
      // Once a category is not FULL, nothing after it may have started.
      const firstUnfinished = cats.findIndex((c) => c.completed < c.required)
      if (firstUnfinished === -1) continue // everything done
      for (const later of cats.slice(firstUnfinished + 1)) {
        expect(later.completed, `${variant} · ${later.label}`).toBe(0)
      }
    }
  })

  it('never shows a started stop after a not-started one', () => {
    // The same rule at the surface the change was made for. Stated as
    // monotonicity rather than as expected values, so it keeps holding when the
    // ratios or the hour figures move.
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const stops = journeyStopsFor(persona.path)
      const firstNotStarted = stops.findIndex((s) => s.status === 'not-started')
      if (firstNotStarted === -1) continue
      for (const later of stops.slice(firstNotStarted + 1)) {
        expect(later.status, `${variant} · ${later.title}`).toBe('not-started')
      }
    }
  })

  it('has at most ONE stop in progress', () => {
    // The symptom that started this: four of five stops in progress at once.
    // A curriculum worked in order has one active piece.
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const inProgress = journeyStopsFor(persona.path).filter((s) => s.status === 'in-progress')
      expect(inProgress.length, variant).toBeLessThanOrEqual(1)
    }
  })

  it('allocates the RATIO, and the reported percentage follows the unit', () => {
    /*
     * The waterfall still fills in order and still takes `round(total × ratio)`
     * of the whole. What changed on 2026-09-16 is the unit: 7 days rather than
     * 56 hours.
     *
     * So On Track no longer reports 63%. `round(7 × 0.63)` is 4, and 4/7 is
     * **57%** — a day is atomic, so the reachable percentages are 0, 14, 29,
     * 43, 57, 71, 86, 100 and 63 is not among them. That is a property of
     * measuring in days, not a rounding bug, and it is asserted as the
     * relationship rather than as a literal so the next unit change does not
     * need a new number here.
     *
     * KNOWN, and visible on screen: the Progress dropdown's own label still
     * says "~63%". CLAUDE.md already records that the label is an
     * approximation and the gauge is exact — this widens that gap from a
     * fraction of a point to six.
     */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const cats = persona.path.categories!
    const totalRequired = cats.reduce((sum, c) => sum + c.required, 0)
    const totalCompleted = cats.reduce((sum, c) => sum + c.completed, 0)
    expect(totalRequired).toBe(NY_LH_PRELICENSING_LESSONS)
    expect(totalCompleted).toBe(Math.round(totalRequired * 0.63))
    expect(displayedProgressPct(persona.path)).toBe(
      Math.round((totalCompleted / totalRequired) * 100),
    )
  })

  it('keeps Mandatory / Elective agreeing with the categories', () => {
    // Two rules over one set of hours is two answers. Under the waterfall the
    // old `mandatoryReq × ratio` would have said 25/40 while the categories
    // said 35/40 — and BOTH are on screen (the Progress section reads
    // categories, the Learner Focused band's legend reads these two).
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const cats = persona.path.categories!
      const catTotal = cats.reduce((sum, c) => sum + c.completed, 0)
      const segTotal =
        (persona.path.mandatory?.completed ?? 0) + (persona.path.elective?.completed ?? 0)
      expect(segTotal, variant).toBe(catTotal)
    }
  })
})

describe('the two completion tasks on the journey', () => {
  it('come last, carry no hours, and are blocked until the coursework is done', () => {
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    const tasks = stops.filter((s) => s.group === 'Course completion')
    // ONE stop as of 2026-09-16. They are still two ACTS in XCEL's published
    // certificate-eligibility rules and nothing about that changed; they are
    // one MOMENT on this rail — done back to back, unlocking together, neither
    // ever true without the other.
    /* "Survey & Certificate" as of 2026-09-23. The attestation half moved up to
       ride with the course exam — the LMS pairs them there — and the LMS's strip
       ends on a Survey the storefront never mentions. Still ONE stop: two acts,
       one moment, which is the property this line has always pinned. */
    expect(tasks.map((t) => t.title)).toEqual(['Survey & Certificate'])
    // It is LAST.
    expect(stops.slice(-1)).toEqual(tasks)
    // NO COUNT. A lesson figure on "print your certificate" makes it look like
    // coursework and would land in the gauge's denominator — which is the
    // course's 42 lessons and must not grow.
    for (const t of tasks) expect(t.hours).toBeNull()
    // Blocked while any coursework is outstanding. The words still say WHY
    // rather than "Not started" — they are just no longer RENDERED on a blocked
    // row (see the rail's note); the state itself is unchanged, which is what
    // keeps the reason available to the row's `title` and to a future variant
    // that wants it back on screen.
    for (const t of tasks) expect(t.blocked).toBe(true)
    expect(statusWords(tasks[0])).toBe('After your coursework')
  })

  it('COMPLETES when every hour of coursework is complete', () => {
    /* It used to assert `Not started` here — unblocked but not done, because
       nothing in the fixtures recorded an attestation. Changed 2026-09-21 by a
       direct decision: "100% means the Attestation and certificate step is
       complete. Step 1–4 is part of the course."

       So the step is now complete BY DEFINITION rather than by a feed, and the
       test below pins the half that still constrains it: never before the
       coursework is. */
    const done = dashboardProgressPersonaFor('xcel', 'complete-100', 'qe')!
    const tasks = journeyStopsFor(done.path).filter((s) => s.group === 'Course completion')
    for (const t of tasks) expect(t.blocked).toBe(false)
    expect(statusWords(tasks[0])).toBe('Completed')
  })

  it('claims them complete ONLY once the coursework is', () => {
    /* ⚠ THIS TEST'S PREMISE WAS DELIBERATELY REVERSED, and it worked as
       designed. It read "never claims they are complete — nothing records them
       yet", with the note: "Asserted so a later 'mark them done so the demo
       looks finished' needs a real source."

       That is exactly the change that then came — 2026-09-21, as an explicit
       DEFINITION rather than a feed: "100% means the Attestation and
       certificate step is complete. Step 1–4 is part of the course." The guard
       did its job: it made the change a decision instead of a drift.

       What it guards now is the half that still holds — they are never complete
       while any coursework is outstanding, so no state short of 100% can show a
       finished certificate. A real attestation service would replace the
       definition; until then the demo asserts the two move together. */
    for (const opt of DASHBOARD_PROGRESS_PICKER) {
      const persona = dashboardProgressPersonaFor('xcel', opt.variant, 'qe')!
      const stops = journeyStopsFor(persona.path)
      const tasks = stops.filter((s) => s.group === 'Course completion')
      const courseworkDone = stops
        .filter((s) => s.group !== 'Course completion' && s.hours != null)
        .every((s) => s.status === 'completed')
      for (const t of tasks) {
        expect(t.status === 'completed', opt.variant).toBe(courseworkDone)
      }
    }
  })

  it('does not grow the requirement', () => {
    // The gauge's denominator is the study plan's 7 days. The two completion
    // tasks are steps rather than coursework, so adding them to the journey
    // must not move it — that is why they carry no unit count at all.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const totalRequired = persona.path.categories!.reduce((sum, c) => sum + c.required, 0)
    expect(totalRequired).toBe(NY_LH_PRELICENSING_LESSONS)
    const counted = journeyStopsFor(persona.path).filter((st) => st.hours != null)
    expect(counted.reduce((sum, st) => sum + (st.hours ?? 0), 0)).toBe(totalRequired)
  })
})

describe('nothing on the page says "1 days"', () => {
  it('pluralises every count, through one shared helper', () => {
    // `hrs` is unit-invariant, so nothing here had ever needed to pluralise a
    // count. The moment one path measured DAYS, four surfaces printed "1 days"
    // — the category bars, the band KPI cell, the journey rows and the detail
    // sheet. Fixing them one at a time is how three get fixed.
    /* SEEDS THE HEADER BAND for the anti-vacuity half. The journey rail used to
       be the surface printing "26 of 42 lessons" here; that sub-line was removed
       on 2026-09-21 because the header's own stat row already said it. So the
       guard now reads the surface that DOES print a count — otherwise this test
       would keep passing while nothing on the page printed a unit at all, which
       is precisely what it exists to rule out. */
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({
        ...CLASSIC_FLAGS,
        'dashboard-course-header': { enabled: true, variant: 'band' },
      }),
    )
    const { container } = renderShell(QE_URL)
    expect(container.textContent).not.toMatch(/\b1 (days|lessons|hrs)\b/)
    expect(container.textContent).toMatch(/\b42 lessons\b/)
    // One owner, so a fifth surface gets it for free.
    for (const f of [
      'src/components/learning/progressGauge.tsx',
      'src/components/learning/studyJourneyUtil.ts',
      'src/components/membership/v5/LearnerFocusedBand.tsx',
    ]) {
      expect(readFileSync(f, 'utf8'), f).toMatch(/unitCount/)
    }
  })
})

describe('the Get Licensed section', () => {
  it('ledes with what happens NEXT, not who owns it', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // It read "After your certificate — these three are handled by the state",
    // which led with the owner — a fact each step's own meta already carries
    // (PSI, PSI, NY Dept. of Financial Services) — and made the section sound
    // like a disclaimer. A learner at the end of their coursework wants the
    // next step.
    const { container } = renderShell(QE_URL)
    expect(container.textContent).toMatch(/Once your course is completed, here are the next steps/)
    expect(container.textContent).not.toMatch(/handled by the state/)
  })

  it('renders the three state-owned steps after the journey', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    renderShell(QE_URL)
    expect(screen.getByText('Get Licensed')).toBeInTheDocument()
    for (const step of GET_LICENSED_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
  })

  it('carries NO completion state, because XCEL cannot observe these', () => {
    // The load-bearing decision. PSI schedules and scores the sitting; DFS
    // issues the licence. A tick against "Pass State Exam" would be the product
    // claiming an outcome it has no feed for. The absence is the honest part —
    // pinned so adding a status needs a real feed behind it.
    for (const step of GET_LICENSED_STEPS) {
      expect(step).not.toHaveProperty('status')
      expect(step).not.toHaveProperty('completed')
      expect(step.owner).not.toMatch(/XCEL/i)
    }
  })

  it('links only where there is a confirmed destination', () => {
    // One step has a real URL — PSI's New York registration page, stated on
    // XCEL's requirements page. The other two have none, and an invented href
    // is the defect the Resources section shipped four of.
    const withHref = GET_LICENSED_STEPS.filter((s) => s.href)
    expect(withHref).toHaveLength(1)
    expect(withHref[0].href).toMatch(/^https:\/\/test-takers\.psiexams\.com\//)
    /* THE ROW IS NO LONGER THAT LINK — 2026-09-17. It was an `<a>` straight to
       PSI; the row opens the step's own sheet now, and the PSI URL is inside
       it, alongside the system check and the retake policy that a learner wants
       BEFORE starting a registration flow.
       
       So the assertion moves to where the link lives: the sheet. What it still
       pins is unchanged — one confirmed destination, opening in a new tab, and
       no invented href anywhere. */
    const { container } = renderShell(QE_URL)
    fireEvent.click(
      within(container).getByRole('button', { name: new RegExp(withHref[0].title, 'i') }),
    )
    const link = within(screen.getByRole('dialog')).getByRole('link', {
      name: new RegExp(withHref[0].href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('agrees with the exam facts on the Readiness page', () => {
    // "100 questions in 2 hours. 70% to pass." sits on Home; the Readiness
    // page's facts table says the same thing one rail item away. Two literals
    // for one sitting is how they drift.
    const pass = GET_LICENSED_STEPS.find((s) => s.id === 'pass-exam')!
    const facts = examFactsFor('NY')
    // Matched on the NUMBERS rather than the phrasing — the two surfaces word
    // them differently ("150 scored questions" vs "150 questions") and should
    // be free to, but they must not disagree on the figures.
    const count = facts.questions.match(/\d+/)![0]
    const minutes = facts.timeAllowed.match(/\d+/)![0]
    expect(pass.detail).toContain(count)
    expect(pass.detail).toContain(minutes)
    expect(pass.detail).toContain(`${facts.passMark}%`)
  })
})

describe('the Study Journey widget is its own block', () => {
  it('sits on the page — no white card, no stroke, no shadow', () => {
    // 2026-09-16. It was a raised white card inherited from the outer section,
    // back when this was the right half of a joined band. The shadow went with
    // the fill and the border because the three are ONE treatment: a shadow
    // under a surface with neither fill nor edge reads as a card that failed to
    // paint, not as less card.
    const { container } = renderShell(QE_URL)
    const journey = container.querySelector<HTMLElement>('[aria-label="Study journey"]')!
    expect(journey.style.background).toBe('')
    expect(journey.style.border).toBe('')
    expect(journey.style.boxShadow).toBe('')
    // The horizontal padding went too — a bare block lines up with its column
    // rather than staying inset by a gutter belonging to a card it no longer
    // has, the same move the Current Learning Progress block made.
    expect(journey.style.padding).toBe('4px 0px 0px')
    // The rule between the journey and Get Licensed is NOT card chrome and
    // stays: it divides this block's own two halves.
    const styles = readFileSync('src/components/learning/widgetStyles.ts', 'utf8')
    expect(styles).toMatch(/export const widgetRuleStyle/)
  })

  it('splits from the navy half — two surfaces, not one joined band', () => {
    // The band's two halves were grid siblings sharing one radius, one shadow
    // and one `overflow: hidden`. Once QE Focused slimmed the navy side and
    // grew this one, the shared ROW HEIGHT left the navy half stretched with a
    // large empty area below its content.
    //
    // Asserted on the section's own style rather than on a screenshot: the
    // load-bearing part is `align-items: start`, because without it the grid
    // still equalises the row and the split is cosmetic — the joined band with
    // a gap. jsdom has no layout, so the heights cannot be compared here; the
    // declaration is what makes them independent.
    // Selected by CLASS, not by role+name: `MembershipOverview` wraps the band
    // in its own `<section aria-label="Your learning">` and the band carries the
    // same label, so the accessible query finds two. (That duplication predates
    // this change and is worth fixing separately.)
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.alignItems).toBe('start')
    // 40, the same gap `MembershipOverview` uses between its own sections, so
    // the space between two independent cards is the page's own rhythm. It was
    // 20 — inherited from when these were two halves of ONE card, where the gap
    // stood in for the seam.
    expect(band.style.gap).toBe('40px')
    // The joined treatment is GONE from the section and lives on each child.
    expect(band.style.borderRadius).toBe('')
    expect(band.style.overflow).toBe('')
  })

  it('keeps the JOINED band on the other versions', () => {
    // The split is scoped to QE Focused. Learner Focused and Marketing Focused
    // are two halves of one statement at roughly one height, which is what the
    // joined treatment is for.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.overflow).toBe('hidden')
    expect(band.style.borderRadius).toBe('var(--radius-lg)')
    expect(band.style.alignItems).toBe('')
  })

  it('renders the resume block, journey and Get Licensed in one card', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // All three are the widget's, so they move together. Their ORDER is the
    // point — resume first ("continue where you left off" is still the first
    // thing offered), then where you are, then what the state needs.
    renderShell(QE_URL)
    expect(screen.getByRole('button', { name: /^resume\b/i })).toBeInTheDocument()
    expect(screen.getByText(STUDY_JOURNEY_EYEBROW)).toBeInTheDocument()
    expect(screen.getByText('Get Licensed')).toBeInTheDocument()
  })

  it('does not resolve the resume course itself', () => {
    // `StudyJourneyWidget` takes the course as a prop. The band picks it from
    // the persona, and two components resolving "the course to resume" is how
    // they end up disagreeing — the fork `displayedProgressPct` was extracted
    // to close. Asserted at the source: the widget has no fixture import.
    // Scanned with comments stripped — the file's own doc comment SAYS it has
    // no `useCourseLauncher`, which a naive grep matches.
    const src = readFileSync('src/components/learning/StudyJourneyWidget.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(src).not.toMatch(/myCoursesFor|useCourseLauncher|dashboardProgressPersonaFor/)
  })
})

describe('the category palette on a dark card', () => {
  it('uses LIGHT stops, because two of the default slots are invisible on navy', () => {
    // `CATEGORY_PALETTE` is built for the white detail panel. On the navy card
    // slot 0 (`--color-category-mandatory`, the Brick-era brand navy) measured
    // 1.11:1 against the bar track — and slot 0 is the FIRST category, so on
    // the New York journey the one bar carrying all the progress read as empty.
    // Slot 3 (`--color-cta-500`) measured 1.03:1.
    //
    // Same rule as `.cre-alert-action` and the desktop prototype's
    // `--rail-accent`: a dark brand colour is a fill on white and needs a light
    // stop on a dark ground.
    expect(categoryColorFor(0)).toBe('var(--color-category-mandatory)')
    expect(categoryColorFor(0, true)).toBe('var(--color-primary-300)')
    expect(categoryColorFor(3)).toBe('var(--color-cta-500)')
    expect(categoryColorFor(3, true)).toBe('var(--color-cta-300)')
    // Slot 1 is already a light amber, which is why the two-category case never
    // showed the problem and why this went unnoticed.
    expect(categoryColorFor(1, true)).toBe(categoryColorFor(1))
  })

  it('has an on-dark stop for every slot', () => {
    // A short on-dark palette would wrap and silently reuse a hue, which is
    // worse than a dark one: two categories would share a colour.
    expect(CATEGORY_PALETTE_ON_DARK).toHaveLength(CATEGORY_PALETTE.length)
    expect(new Set(CATEGORY_PALETTE_ON_DARK).size).toBe(CATEGORY_PALETTE_ON_DARK.length)
  })

  it('leaves the light detail sheet on the default palette', () => {
    // The sheet opens from surfaces with no navy card beside it, so it keeps
    // the full summary AND the palette built for white.
    expect(categoryColorFor(0, false)).toBe('var(--color-category-mandatory)')
  })
})

describe('View Requirements shows the requirements and nothing else', () => {
  it('opens with no tab bar and no Progress half', async () => {
    renderShell(QE_URL)
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    // No way back to Progress — the page behind this sheet already shows all of
    // it (the navy card's gauge and tiles, the section's course lists), so a tab
    // would be a second door onto what the reviewer was just looking at.
    expect(within(sheet).queryByRole('button', { name: /^Progress$/ })).toBeNull()
    expect(within(sheet).queryByRole('button', { name: /^Requirements$/ })).toBeNull()
    // And the Progress half's own content is absent, not merely unselected.
    expect(sheet.querySelector('svg[role="img"]')).toBeNull()
    expect(sheet.textContent).not.toMatch(/credit hrs/)
  })

  it('carries no "Go to Learning Path" CTA', async () => {
    // Removed 2026-09-16. The page behind this sheet already offers "Open
    // learning path" on the Study Journey widget, so the button was a second
    // door onto one route — and a requirements sheet's job is to state the
    // requirements, not to navigate out of them.
    renderShell(QE_URL)
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).queryByRole('button', { name: /go to learning path/i })).toBeNull()
  })

  it('keeps the CTA on the TABBED sheet, including its Requirements tab', async () => {
    // Gated on the `view` prop, not on which half is showing. The tabbed sheet
    // is the only door to either half for its three callers, and the CTA is
    // documented as persistent across both tabs — so switching tab there must
    // not make it vanish.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getAllByRole('button', { name: /view requirements/i })[0])
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: /^Requirements$/ }))
    expect(within(sheet).getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
  })

  it('states the requirements from XCEL\'s published page', async () => {
    renderShell(QE_URL)
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    const text = sheet.textContent ?? ''
    // The load-bearing rules, quoted close to the source.
    expect(text).toMatch(/Department of Financial Services/i)
    expect(text).toMatch(/forced.progression/i)
    expect(text).toMatch(/70%/)
    expect(text).toMatch(/PSI/)
    expect(text).toMatch(/student attestation/i)
    expect(text).toMatch(/valid for a lifetime/i)
    // Hours PER LINE OF AUTHORITY, since the state sets them that way and the
    // demo covers one of five.
    for (const hours of ['40 hours', '20 hours', '90 hours']) {
      expect(text, hours).toContain(hours)
    }
  })

  it('reports the STATE\'s 40 hours, not the path\'s 56', () => {
    // The requirements box is about the BOARD's requirement. XCEL's programme
    // adds 16 hours of its own prep on top, and the difference is stated in the
    // list rather than left for a reader to notice two numbers disagree.
    const reqs = pathRequirementsFor('xcel', XCEL_NY_PRODUCER_PATH_ID)!
    expect(reqs.totalHours).toBe(NY_PRODUCER_HOURS_INVENTED.preLicenseEducation)
    expect(reqs.totalHours).not.toBe(NY_LH_PRELICENSING_LESSONS)
    expect(reqs.items.join(' ')).toMatch(/16 hours of its own prep/i)
  })

  it('states no renewal cycle or elective split for a pre-licensing path', () => {
    // The type was shaped for CE renewal. A candidate has nothing to renew and
    // the state names one hour figure per line — a `0` in those slots would
    // render as a stated requirement of zero rather than as not-applicable.
    const reqs = pathRequirementsFor('xcel', XCEL_NY_PRODUCER_PATH_ID)!
    expect(reqs.renewalCycleYears).toBe(0)
    expect(reqs.mandatoryHours).toBeUndefined()
    expect(reqs.electiveHours).toBeUndefined()
  })

  it('keeps the TABBED sheet for the other consumers', () => {
    // `LearningPathsHome` and the classic dashboard reach both halves through
    // this sheet and have no page beside it, so the tab bar stays their default.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getByRole('button', { name: /view requirements/i }))
    expect(screen.getByRole('button', { name: /^Progress$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Requirements$/ })).toBeInTheDocument()
  })
})

describe('the Current Learning Progress block sits on the page, not a navy card', () => {
  it('drops the card entirely', () => {
    // No background, no shadow, no radius — the content is on the shell's grey.
    const { container } = renderShell(QE_URL)
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.style.background).toBe('transparent')
    expect(half.style.boxShadow).toBe('')
    expect(half.style.borderRadius).toBe('')
    // The left/right padding goes with the card: a bare block lines up with the
    // section headings below rather than staying inset by a gutter it no
    // longer has.
    expect(half.style.padding).toBe('4px 0px 0px')
  })

  it('keeps the navy card on the other versions', () => {
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.style.background).toBe('var(--color-primary-700)')
  })

  it('asks whether the GROUND is dark, not whether the surface is the navy card', () => {
    // The navy card is dark in both themes; the page is not — the shell's
    // `--color-surface-page` is #f5f5f5 light and #1b1d21 dark. `onDark` is a
    // boolean computed in JS, so keying it to the SURFACE would hand the light
    // category palette to a dark ground and reintroduce the 1.11:1 slot-0
    // failure the on-dark palette exists to fix, just in the other theme.
    //
    // Asserted through the palette helper, which is where the consequence lands.
    expect(categoryColorFor(0, true)).not.toBe(categoryColorFor(0, false))
  })

  it('colours its text CTA with a CLASS, not inline', () => {
    /* The CTA ramp is a FILL colour on XCEL; cta-500 as TEXT measures 1.84:1 on
       the dark page. `.cre-cta-ink` swaps to the light stop under
       `[data-theme='dark']` — and an inline `color` would beat it, which is the
       trap the PSI link in the Study Journey hit. So there must be no inline
       colour on the button.

       This read "View Requirements" until 2026-09-17, when that link came off
       the PAGE surface. The rule it pins is about the CLASS, not that link, so
       it moves to the text CTA that is still here — "State requirements →" at
       the foot of Get Licensed, which opens the same sheet. */
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const link = Array.from(band.querySelectorAll('button')).find((b) =>
      /State requirements/i.test(b.textContent ?? ''),
    )!
    expect(link).toBeTruthy()
    expect(link.className).toContain('cre-cta-ink')
    expect(link.style.color).toBe('')
    // …and the removed link really is gone from this surface, with the sheet
    // still reachable — the pair that makes the removal safe rather than a
    // dead end.
    expect(band.textContent).not.toMatch(/View Requirements/)
  })

  it('darkens the BAR track, because the light default is invisible here', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // `--color-neutral-100` measures 1.08:1 against #f5f5f5 and
    // `--color-neutral-200` 1.29:1 — an empty track would not be visible at
    // all, so 0% reads as a missing gauge rather than an empty one.
    // `--color-neutral-300` is 1.55:1: a groove. The value is also stated in
    // text, so nothing rides on the track alone.
    //
    // It has moved with the thing that carries the number: category bar →
    // donut → the header progress bar that replaced the donut. The VALUE is the
    // same one throughout and still has to clear the page grey, which is why
    // `ProgressBar` needed a `track` override at all.
    const { container } = renderShell(QE_URL)
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const tracks = Array.from(half.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )
    expect(tracks.length).toBeGreaterThan(0)
  })
})

describe('XCEL has no learning-path concept on this version', () => {
  /*
   * Removed 2026-09-16. The band IS the programme — there is no separate path
   * object to open — so every door onto the `learning-path` section is closed
   * on QE Focused. One withheld prop (`onOpenLearningPath`) closes both.
   *
   * This REPLACES an assertion added earlier the same day that "Open learning
   * path" was still on the page, which existed to stop the requirements-sheet
   * CTA removal becoming "no way to reach the learning path". That is now the
   * intended state, so the guard is inverted rather than dropped: the concept
   * must be absent, and the requirements sheet must be what the page offers
   * instead.
   */
  it('renders no "Open learning path" link on the Study Journey', () => {
    renderShell(QE_URL)
    expect(screen.queryByRole('button', { name: /open learning path/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /learning path/i })).toBeNull()
  })

  it('leaves the path TITLE clickable, opening the requirements sheet', async () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // The title carried the same handler AND a `title="Open learning path"`
    // tooltip — the worse of the two doors, because an invisible link is found
    // by accident. It falls back to `onViewDetails`, so it still does something
    // and what it does now exists.
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    expect(title.getAttribute('title')).toBeNull()
    fireEvent.click(title)
    const sheet = await screen.findByRole('dialog')
    expect(sheet.textContent).toMatch(/what the state requires/i)
  })

  it('sends a course-less journey stop to the requirements sheet, not the path', () => {
    // The stops are SYNTHESIZED (not catalogue course ids), so the in-shell
    // launcher is best-effort and there has to be a fallback — a launcher
    // opening nothing is the one outcome worse than a second-best destination.
    // It used to be the Learning Path; on QE Focused it is the requirements
    // sheet, which is what this programme actually is.
    //
    // Asserted at SOURCE because the branch is unreachable from this render:
    // the launcher IS available here, so clicking a stop opens it and the
    // fallback never runs. A DOM test would pass without exercising the line.
    const src = readFileSync('src/components/membership/v5/MembershipOverview.tsx', 'utf8')
    const fn = src.slice(
      src.indexOf('const openJourneyStop'),
      src.indexOf('const learningCards'),
    )
    expect(fn).toMatch(/qeFocused\) setDetailOpen\(true\)/)
    // The learning-path fallback survives for the versions that still have one,
    // and must come AFTER the QE branch or it would win.
    expect(fn.indexOf('qeFocused')).toBeLessThan(fn.indexOf('onOpenLearningPath'))
  })

  it('KEEPS the concept on the other versions', () => {
    // Withheld by QE Focused, not deleted from the band — Learner Focused still
    // hands the prop through, so the journey link and the title's handler are
    // unchanged there. Asserted via the tabbed sheet's own CTA, which is the
    // door that version actually shows.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getAllByRole('button', { name: /view requirements/i })[0])
    return screen.findByRole('dialog').then((sheet) => {
      expect(
        within(sheet).getByRole('button', { name: /go to learning path/i }),
      ).toBeInTheDocument()
    })
  })
})

describe('every rail row is a hoverable, clickable target', () => {
  /*
   * 2026-09-16. Get Licensed was static text with ONE link on the first step's
   * title, so three rows describing three actions looked like three paragraphs
   * and the single affordance was a differently-coloured word. They now match
   * the journey rows above: whole-row target, hover wash, chevron.
   */
  it('gives every Get Licensed step a row target and a chevron', () => {
    const { container } = renderShell(QE_URL)
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    const rows = Array.from(licensed.querySelectorAll('.cre-journey-stop'))
    expect(rows).toHaveLength(GET_LICENSED_STEPS.length)
    for (const row of rows) {
      // One target per row, never a link nested in a button: that is invalid,
      // and two nested targets on a 13px title is a coin flip for the learner.
      expect(row.querySelectorAll('a, button')).toHaveLength(0)
      expect(row.querySelector('svg')).toBeTruthy()
    }
    /* ALL THREE ARE BUTTONS as of 2026-09-17. The Schedule step was the one
       anchor, going straight to PSI; every step has its own published detail
       now, so every row opens a sheet and the outbound links live inside them.
       
       That is also what makes the three rows genuinely identical, which is what
       this test's own note asked for when they became whole-row targets: "three
       identical rows is the point." */
    expect(licensed.querySelectorAll('a.cre-journey-stop')).toHaveLength(0)
    expect(licensed.querySelectorAll('button.cre-journey-stop')).toHaveLength(
      GET_LICENSED_STEPS.length,
    )
  })

  it('opens the STEP’s own sheet from a step XCEL does not own', async () => {
    /* It opened the REQUIREMENTS sheet until 2026-09-17 — the only surface that
       described these three at all, and the note said plainly that it was not a
       per-step destination and did not pretend to be. Each step has its own
       published detail now, so each row opens that. */
    renderShell(QE_URL)
    const step = GET_LICENSED_STEPS.find((s) => !s.href)!
    fireEvent.click(screen.getByRole('button', { name: new RegExp(step.title, 'i') }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet.textContent).toMatch(new RegExp(step.title, 'i'))
    expect(sheet.textContent).toMatch(/Post-course process/)
    // Not the requirements sheet, which is about the licence as a whole.
    expect(sheet.textContent).not.toMatch(/what the state requires/i)
  })

  it('colours a SELECTABLE row’s title blue, and only a selectable one', () => {
    /*
     * 2026-09-17. The rows already had a background hover and a chevron, but
     * the title was plain body ink — so at rest a row that opens something and
     * a row that does not looked identical. Blue says it before the cursor
     * arrives.
     *
     * The BLOCKED journey stops must NOT get it: a link-coloured title on a
     * step the product will not let you take is the same broken promise as a
     * chevron on it, which those rows already refuse.
     */
    const { container } = renderShell(QE_URL)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    const linked = Array.from(list.querySelectorAll('.cre-stop-title'))
    // Exactly the one stop that is reachable — the rest are blocked.
    expect(linked).toHaveLength(1)
    expect(linked[0].textContent).toBe('Pre-Licensing Lessons (42)')
    // NO inline colour, or the class would match, compute and do nothing —
    // the trap `.cre-uxlinks-title` and the PSI link both hit.
    expect((linked[0] as HTMLElement).style.color).toBe('')
    // All three Get Licensed rows open a sheet, so all three are links.
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    expect(licensed.querySelectorAll('.cre-stop-title')).toHaveLength(
      GET_LICENSED_STEPS.length,
    )
  })

  it('darkens and underlines that title on hover — in BOTH directions', () => {
    /* Asserted against the stylesheet, because jsdom applies no hover.
     *
     * The dark rule is the interesting half: "darker" on an inverting palette
     * means the emphatic END of the ramp, which is `-700` on white and `-200`
     * on the dark ground. Using `-700` for both would make the dark hover
     * recede rather than advance. */
    const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\s+/g, ' ')
    expect(css).toMatch(/\.cre-stop-title \{ color: var\(--color-primary-500\); \}/)
    const hover = css.match(
      /\.cre-journey-stop:hover \.cre-stop-title,[^{]*\{([^}]*)\}/,
    )![1]
    expect(hover).toMatch(/--color-primary-700/)
    expect(hover).toMatch(/text-decoration: underline/)
    const dark = css.match(
      /\[data-theme='dark'\] \.cre-journey-stop:hover \.cre-stop-title,[^{]*\{([^}]*)\}/,
    )![1]
    expect(dark).toMatch(/--color-primary-200/)
    // …and the row's own background hover is still there, which was the third
    // thing asked for and the one that already worked.
    expect(css).toMatch(/\.cre-journey-stop:hover \{[^}]*--color-neutral-100/)
  })

  it('declares the hover in CSS — the class existed with no rule', () => {
    // `cre-journey-stop` was on the journey rows from the day they were built
    // and NOTHING in tokens.css matched it: a clickable row with a chevron and
    // no feedback. Same shape as `--color-border-strong`, which did not exist
    // either. Asserted against the stylesheet because that is where the gap
    // was — jsdom applies no hover.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-journey-stop:hover\s*\{[^}]*background/)
    expect(css).toMatch(/\.cre-journey-stop:focus-visible\s*\{[^}]*outline/)
    // The tint is the value the notification row already uses — two row hovers
    // differing by a few percent read as a bug.
    const hover = css.match(/\.cre-journey-stop:hover\s*\{([^}]*)\}/)![1]
    expect(hover).toMatch(/--color-neutral-100/)
  })

  it('leaves NO inline background to beat the hover rule', () => {
    // It was `background: 'transparent'` inline, which wins over a stylesheet
    // rule — so `:hover` would have needed `!important` to do anything, and
    // would have looked fine while doing nothing. The class owns both states.
    const { container } = renderShell(QE_URL)
    const rows = Array.from(container.querySelectorAll<HTMLElement>('.cre-journey-stop'))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(row.style.background).toBe('')
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const hover = css.match(/\.cre-journey-stop:hover\s*\{([^}]*)\}/)![1]
    expect(hover).not.toMatch(/!important/)
  })

  it('drops the "How do I become exam ready?" disclosure', () => {
    // A collapsed paragraph explaining that the stops run in order, directly
    // above a rail whose stops run in order and say their status in words.
    // Readiness answers "am I exam ready" with a number one rail item away.
    renderShell(QE_URL)
    expect(screen.queryByText(/how do i become exam ready/i)).toBeNull()
    expect(screen.queryByText(/you are exam ready when the coursework/i)).toBeNull()
  })
})

describe('the heading-font flag', () => {
  /** Seed the flag the way the panel persists it. */
  function seedVariant(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      // `seedClassic`'s base, with THIS flag as the variable — so the subject
      // is the font and not whichever treatment the other two default to.
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-heading-font': { enabled: true, variant } }),
    )
  }

  it('is in the catalog, scoped to the dashboard, and defaults to SERIF', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-heading-font')!
    expect(def).toBeTruthy()
    expect(def.page).toBe('dashboard-rebrand')
    // Variant-only: the choice IS the variant, so the enable toggle ships on.
    // "Off" would have to mean "sans", which the variant already says.
    expect(def.defaultEnabled).toBe(true)
    /* `serif` as of 2026-09-17 ("set this view as the default"). Worth keeping
       in view: the face is a SYSTEM STACK standing in for the style, not the
       Amasis MT on xcelsolutions.com — unlicensed to us and recorded in
       tokens.css as off-brand for XCEL. So the committed demo now ships a
       stand-in as its headline typeface, which the flag's own description still
       says out loud. */
    expect(def.defaultVariant).toBe('serif')
    expect(def.description).toMatch(/Amasis/)
    expect(def.variants?.map((v) => v.value)).toEqual(['sans', 'serif'])
  })

  it('is offered in the dashboard panel scope', () => {
    // A flag tagged to the page but missing from the scope is invisible on the
    // one route it governs — the trap `NavSectionFlags` documents.
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-heading-font')
  })

  it('adds the class AT THE DEFAULT, because serif is the default now', () => {
    const { container } = renderShell(QE_URL)
    /* INVERTED 2026-09-17. It asserted the class was ABSENT at the default,
       which was the whole point while `sans` shipped — the brand face untouched
       unless a reviewer opted in. Serif is the default now, so the class is on
       the overview root out of the box, and what still needs pinning is the
       SCOPE: the rail, the header and the shell's own page title must stay on
       the brand face, which is what makes the two comparable side by side. */
    expect(container.querySelector('.cre-dash-serif-headings')).toBeTruthy()
    expect(document.querySelector('nav')?.closest('.cre-dash-serif-headings')).toBeFalsy()
  })

  it('re-points --font-heading on the overview root for `serif`', () => {
    seedVariant('serif')
    const { container } = renderShell(QE_URL)
    const root = container.querySelector('.cre-dash-serif-headings')
    expect(root).toBeTruthy()
    // The band lives INSIDE it, which is what makes one declaration enough:
    // custom properties cascade, so an inline `font-family: var(--font-heading)`
    // resolves against the value the element inherits.
    expect(root).toContainElement(container.querySelector<HTMLElement>('.cre-learner-focused-band'))
  })

  it('leaves the rail, the header and the page title alone', () => {
    // The flag is about the PAGE's headings. A rail in one face beside a page
    // in another is the comparison a reviewer needs, so the class is on the
    // overview root rather than the shell.
    seedVariant('serif')
    const { container } = renderShell(QE_URL)
    const root = container.querySelector<HTMLElement>('.cre-dash-serif-headings')!
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    expect(root).not.toContainElement(rail)
    const h1 = container.querySelector('h1')
    if (h1) expect(root).not.toContainElement(h1)
  })

  it('declares the swap as ONE token re-point, not a font literal', () => {
    // The convention: reference tokens, never a raw font-family. The class
    // re-points `--font-heading` at a token; the stack itself is declared once.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const rule = css.match(/\.cre-dash-serif-headings\s*\{([^}]*)\}/)![1]
    expect(rule).toMatch(/--font-heading:\s*var\(--font-heading-serif\)/)
    expect(rule).not.toMatch(/Georgia|serif;/)
    expect(css).toMatch(/--font-heading-serif:[^;]*serif;/)
  })

  it('says in its own description that the serif is a STAND-IN', () => {
    // The live site's serif headings are Amasis MT, which tokens.css records as
    // off-brand for XCEL ("Amasis appears nowhere in the guide. Do not
    // reproduce them.") and which is unlicensed to us either way. The caveat
    // belongs at the control, where the person flipping it will read it.
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-heading-font')!
    expect(def.description).toMatch(/Amasis/)
    // Wrapped across lines in the stylesheet, so match on the words rather
    // than the sentence.
    const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\s+/g, ' ')
    expect(css).toMatch(/Amasis appears nowhere in the guide/)
    expect(css).toMatch(/Do not reproduce them/)
  })
})

describe('the course header band flag', () => {
  function seedHeader(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-course-header': { enabled: true, variant } }),
    )
  }

  it('is ON by default now — the duplication it guarded against is gone', () => {
    // The block's own heading is already the course name a few lines below.
    // Saying it again, larger, as a page title is the QUESTION this variant
    // asks — whether the page reads as a course or as a dashboard — so it
    // cannot be the default answer.
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-course-header')!
    /* `band` as of 2026-09-17 ("set this view as the default").
    
       It shipped as `none` because the band said the course name TWICE, which
       made it a question rather than an answer. That reason is gone:
       `hideHeader` drops the block's entire header cluster while the band is on,
       so the name, the meta and the bar each appear once. The flip also closes a
       real gap — Target Date and Time Remaining left the block with its KPI row,
       and the band's stat line is now the only thing that states them. */
    expect(def.defaultVariant).toBe('band')
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-course-header')
    // Still exactly ONE naming of the course, which is what the old default was
    // protecting — now achieved with the band ON rather than by withholding it.
    const { container } = renderShell(QE_URL)
    expect(
      within(container).getAllByText(/New York Life and Health Pre-licensing/i),
    ).toHaveLength(1)
  })

  /**
   * The course header band's own wrapper — the element holding the title, the
   * bar and the stat row.
   *
   * ⚠ FOUND BY ITS CONTENT, not by a declaration. It was found by the dashed
   * `border-bottom` that used to sit under it, with a note explaining that
   * keying on the STYLE rather than the colour meant "the next colour change
   * does not break these two tests". That held until 2026-09-21, when the rule
   * itself was removed (the direct ask) and both tests broke on an anchor that
   * had nothing to do with what they assert. Content is the stabler handle: the
   * band is the thing that holds this heading AND this stat row, whatever it is
   * drawn with.
   */
  function headerBandRow(container: HTMLElement): HTMLElement {
    const heading = container.querySelector('h2')!
    /* THE DEEPEST div holding the title, the stat row AND the cover — all three,
       because the first two alone select the TEXT COLUMN, which is one level too
       deep: the art is that column's sibling, so `row.querySelector('img')` came
       back null and the test failed on the cover rather than on the band. Three
       conditions name the band unambiguously at either width (the wide header
       carries no `cre-course-header-narrow` class to key on). */
    const all = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (d) =>
        d.contains(heading) &&
        /26 of 42 lessons/.test(d.textContent ?? '') &&
        d.querySelector('img[aria-hidden]') != null,
    )
    return all[all.length - 1]
  }

  it('adds the band above everything', () => {
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const heading = container.querySelector('h2')!
    expect(heading.textContent).toMatch(/New York Life and Health Pre-licensing/)
    // Above the band, not inside it.
    const band = container.querySelector('.cre-learner-focused-band')!
    expect(heading.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    /* The rule is the divider the ask names. Found by the DECLARATION rather
       than by walking N parents: the header gained a wrapper when the course
       art moved into it, and a fixed `parentElement.parentElement` broke on a
       change that was not about the rule at all.
       
       Matched on `dashed` rather than on the TOKEN — the rule went dashed on
       2026-09-17 and its colour stepped from `--color-border-subtle` to
       `--color-neutral-300` at the same time, because a dash paints about half
       the pixels of a solid line and the subtle token was already the faintest
       line on the page at 1.29:1. Keying on the style rather than the value
       means the next colour change does not break these two tests. */
    /* THE DASHED RULE UNDER THE BAND IS GONE — 2026-09-21, the direct ask
       ("remove the dashed divider line"). What replaced it is the ruled cards
       below: both now carry their own hairline and a 6px left rule, so the
       header is already visibly a different thing and a second separator was
       drawing a boundary the cards had started drawing themselves. The 40px
       gap is unchanged — the padding took the pixel the border was
       contributing. */
    const row = headerBandRow(container)
    expect(row).toBeTruthy()
    expect(row.contains(heading)).toBe(true)
    /* THE ABSENCE, asserted across the whole band rather than on one element:
       the claim is that nothing separates the header from the block below any
       more, and pinning it to a single node would pass just as happily if the
       rule moved one div up. */
    expect(
      Array.from(container.querySelectorAll<HTMLElement>('div')).some((d) =>
        /dashed/.test(d.style.borderBottom),
      ),
    ).toBe(false)
    /* THE META LINE IS GONE — 2026-09-17. It read "Insurance Pre-Licensing ·
       New York · 42 Lessons" above the title and is now a "Course Progress"
       eyebrow, with the percentage moved to the LEFT of the course name and a
       dot between them.
       
       The jurisdiction and the lesson count both survive, which is what made
       the line droppable rather than a loss: the course's own TITLE names New
       York, and the count is in the stat row directly below. (The Get Licensed
       heading names the state too, but only on the syllabus journey variant,
       which this test does not seed — so the title is the one that always
       carries it.) */
    expect(row.textContent).toMatch(/Course Progress/)
    expect(row.textContent).not.toMatch(/Insurance Pre-Licensing/)
    expect(row.textContent).toMatch(/26 of 42 lessons/)
    expect(heading.textContent).toMatch(/New York/)
    /* THE TITLE LEADS, the figure follows it — swapped 2026-09-17. The figure
       led for a day, which made the heading read as a caption on the number;
       left to right the course is the subject and the percentage is what is
       said about it.
       
       The figure is `flexShrink: 0` so the TITLE gives way as the column
       narrows — verified across widths: 1 → 2 → 3 title lines with the figure
       holding its 41px and staying to the title's right. */
    const figure = Array.from(row.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    const titleEl = row.querySelector('h2')!
    expect(
      titleEl.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(figure.parentElement!.style.flexShrink).toBe('0')
    expect(titleEl.style.minWidth).toBe('0px')
    // ONE 62%, not two — the right-hand column that held it is gone.
    expect(
      Array.from(row.querySelectorAll<HTMLElement>('span')).filter(
        (el) => el.style.fontSize === '32px',
      ),
    ).toHaveLength(1)
    // The course art sits to the LEFT of the title, in this band rather than
    // beside the block's second naming of the course below.
    const cover = row.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(cover).toBeTruthy()
    expect(cover.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and the block below no longer shows one: one course, one picture.
    expect(
      container.querySelector('.cre-learner-focused-band')!.querySelectorAll('img[aria-hidden]'),
    ).toHaveLength(0)
  })

  it('runs a full-width bar under the title, figure large on the right', () => {
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const heading = container.querySelector('h2')!
    const bar = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    expect(bar).toBeTruthy()
    // Under the title, and spanning the band rather than sitting in the title
    // column — which is what makes it read as the PAGE's progress. The FIGURE
    // sits on the title's own line (2026-09-16), so the number and the name it
    // belongs to read as one statement and the bar tucks under both.
    expect(heading.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.parentElement!.contains(bar)).toBe(false)
    /* ALIGNED WITH THE TITLE, structurally rather than by a literal.
     *
     * The bar carried `marginLeft: COURSE_HEADER_COVER_W + _GAP` — 120px — to
     * clear the cover. On 2026-09-17 the cover became a flex SIBLING of the
     * whole column (so it could fill the column's height instead of leaving
     * ~45px empty beneath it), which puts the bar and the title in one column
     * and retires the indent: they cannot drift apart now.
     *
     * So this asserts the indent is GONE and the structure that replaced it is
     * there, since jsdom has no layout to measure the alignment with. Verified
     * in the browser: meta, title and bar all at x=448.
     */
    const barRow = bar.parentElement!
    expect(barRow.style.marginLeft).toBe('')
    const cover = container.querySelector<HTMLImageElement>('img[aria-hidden]')!
    const coverRow = cover.parentElement!
    expect(coverRow.style.display).toBe('flex')
    // The bar is inside the column that is the cover's SIBLING, not inside the
    // cover's own row — which is what makes the alignment structural.
    expect(coverRow.contains(bar)).toBe(true)
    expect(coverRow.children.length).toBe(2)
    /* A 130px SQUARE (2026-09-17). It was 104x72, then briefly stretched to the
     * column's height — which made the art's aspect a function of how far the
     * course title wrapped. Asserted as width === height rather than as two
     * numbers, because the square is the point. */
    expect(cover.style.width).toBe(cover.style.height)
    expect(cover.style.width).toBe('130px')
    expect(cover.style.alignSelf).toBe('')
    const big = Array.from(container.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    expect(big.textContent).toBe('62')
  })

  it('reads the SAME resolver as the block below it', () => {
    // `displayedProgressPct`, not `path.progressPct` — those two differ (the
    // band sums the category hours and falls back to the authored field only
    // when there are none), and a page header disagreeing with the block three
    // inches under it is the defect `ProgressAgreement.test.tsx` exists for.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const expected = displayedProgressPct(persona.path)
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const big = Array.from(container.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    expect(Number(big.textContent)).toBe(expected)
    // The BLOCK no longer prints it — with the band on it drops its whole
    // header cluster (`hideHeader`), so there is exactly one of every fact.
    // Asserted as the absence, which is what "one course, said once" means.
    expect(container.querySelector('.cre-learner-focused-band')!.textContent).not.toMatch(
      /% Complete/,
    )
  })

  it('carries NO action of its own', () => {
    /*
     * The reference's buttons were "DFS Statutory Rules →" and "Syllabus
     * (PDF)". Neither survived, and nor did their replacement:
     *
     *   - No confirmed DFS URL in this repo.
     *   - The PDF XCEL links is a 7-day study PLAN, not a syllabus; it shipped
     *     for one build correctly labelled and then went, because a lone
     *     relabelled button beside a real one is worse than not offering it.
     *   - "State requirements →" then moved to the FOOT of the Get Licensed
     *     card (2026-09-16). Up here it was an action without a subject, three
     *     sections above the thing it elaborates.
     *
     * So the band is a title, and that is all it is.
     */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const row = headerBandRow(container)
    /* ONE action as of 2026-09-17, and only one: "View Details →", which opens
       the sheet on its PROGRESS half — the Course Breakdown. That half had been
       unreachable on this version, because every trigger here meant
       "requirements".
       
       The rule this test holds is unchanged in substance: the band is a title,
       and it carries no action that duplicates something else or points
       somewhere unsourced. The three that were tried and rejected are still
       rejected below. */
    const actions = within(row).queryAllByRole('button')
    expect(actions).toHaveLength(1)
    expect(actions[0].textContent).toMatch(/^Details/)
    expect(within(row).queryAllByRole('link')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/DFS Statutory Rules|Syllabus \(PDF\)|Study plan \(PDF\)/)
    // …and the requirements link IS on the page, below Get Licensed. Not
    // scoped to a bordered card: the footer link renders in BOTH journey
    // variants, and only the syllabus one draws a card around the section.
    const link = within(container).getByRole('button', { name: /state requirements/i })
    const licensedHeading = within(container).getByText(/Get Licensed/i)
    expect(
      licensedHeading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // The URL for the plan is not lost — still the fixture's confirmed link.
    expect(NY_LH_STUDY_PLAN_URL).toMatch(/lh_ca_7days\.pdf$/)
  })

  /** The three stat pairs under the bar, in document order. */
  function headerStatRow(container: HTMLElement) {
    // Found by the DECLARATION, not by walking a parent chain — the same
    // reason the rule above is: this band has gained a wrapper twice, and a
    // fixed `parentElement.parentElement` breaks on changes that are not
    // about the row at all.
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    /* The row is [cluster, CTA]; the cluster holds one GROUP per stat, and each
       group after the first opens with its own dot — bound to the pair so a
       wrap can never leave a separator dangling at the end of a line.
       
       So the value/caption are found by their declarations rather than by
       index: `spans[0]` is the dot on two of the three groups. */
    const cluster = row.children[0] as HTMLElement
    /* THE PAIRS LIVE IN THEIR OWN CONTAINER as of 2026-09-21: the cluster is
       [figure, pairs], so that the percentage can sit to the LEFT of the group
       at the narrow width instead of stacking on top of it. Found as the
       cluster's element child that is a `div` — the figure is a `span` — rather
       than by index, so a later addition to the row does not silently shift
       which element these assertions read. */
    const pairs = (Array.from(cluster.children) as HTMLElement[]).find(
      (el) => el.tagName === 'DIV',
    )!
    return (Array.from(pairs.children) as HTMLElement[]).map((cell) => {
      const spans = Array.from(cell.querySelectorAll<HTMLElement>('span'))
      const value = spans.find((el) => el.style.fontWeight === '700')!
      const caption = spans.find((el) => el.style.textTransform === 'uppercase')!
      return { row, cell, value: value.textContent, caption: caption.textContent }
    })
  }

  /** The round separators. Nested inside the pair each introduces, so they
   *  wrap together — a line can never end on a dangling dot. */
  function headerStatDots(container: HTMLElement) {
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    return Array.from(row.querySelectorAll<HTMLElement>('span')).filter(
      (c) => c.style.borderRadius === '50%',
    )
  }

  it('prints the figure, time remaining and the count under the bar', () => {
    /* The count was alone here until 2026-09-16, when the target date and the
       countdown joined it. THE DATE LEFT AGAIN on 2026-09-21 (the direct ask,
       "remove") and the PERCENTAGE arrived in its place at the head of the row,
       moving down off the title's line.

       So the row is now the figure plus two pairs, and "Completed" is still
       last — flush with the bar's end, which is what tied it to the bar. */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const stats = headerStatRow(container)
    expect(stats.map((s) => s.caption)).toEqual([
      // RENAMED 2026-09-21 from "Left to complete" — the value beside it is
      // already a remaining figure, so "left" repeated the number; the caption
      // names the object instead, like its neighbour.
      'To complete course',
      'Completed',
    ])
    expect(stats[0].value).toBe(personaCountdown())
    expect(stats[1].value).toBe('26 of 42 lessons')
    // …and the exam DATE is gone from the row rather than merely reordered.
    expect(stats.map((s) => s.caption)).not.toContain('Target exam date')
    expect(container.textContent).not.toMatch(/December 15, 2026/)
  })

  it('hides the percentage AND its divider at 0%', () => {
    /* 2026-09-21, the direct ask. A 32px "0%" leading the row is the page's
       headline number saying nothing, next to a bar drawing nothing — it reads
       as a figure that failed to load rather than as a course not begun.

       BOTH, from ONE condition. The rule exists to separate the figure from the
       pairs, so without a figure it is a divider at the start of a row with
       nothing on its left. Asserted together because two conditions is how they
       would come apart. */
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({
        'dashboard-course-header': { enabled: true, variant: 'band' },
        'dashboard-progress-state': { enabled: true, variant: 'not-started' },
      }),
    )
    const { container } = renderShell(QE_URL)
    const row = headerStatRow(container)[0].row
    const cluster = row.children[0] as HTMLElement
    expect(
      Array.from(cluster.querySelectorAll<HTMLElement>('span')).some(
        (el) => el.style.fontSize === '32px',
      ),
    ).toBe(false)
    const pairsBox = (Array.from(cluster.children) as HTMLElement[]).find(
      (el) => el.tagName === 'DIV',
    )!
    expect(pairsBox.style.borderLeft).toBe('')
    expect(pairsBox.style.paddingLeft).toBe('')
    // …and the cells that CAN be stated still are, which is what makes hiding
    // the figure an editorial call rather than the row failing to render.
    expect(row.textContent).toMatch(/To complete course/i)
    expect(row.textContent).toMatch(/of \d+ lessons/i)
  })

  it('leads the row with the percentage, at its own size', () => {
    /* 2026-09-21, the direct ask: "move the 62% to the left of the 27 days and
       lessons completed components". It is the FIRST child of the cluster and
       it is NOT a pair — no caption, and 32px against the pairs' 14 — because
       it is the figure the bar draws and they are its context. Sized to match
       them it would read as a third equal cell and the bar would lose its
       number. */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const row = headerStatRow(container)[0].row
    const figure = (row.children[0] as HTMLElement).children[0] as HTMLElement
    expect(figure.textContent).toBe('62%')
    expect(figure.querySelector<HTMLElement>('span')?.style.fontSize).toBe('32px')
    expect(figure.querySelector<HTMLElement>('span[style*="uppercase"]')).toBeNull()
    // …and it is no longer on the title's line, rather than being in both.
    const heading = container.querySelector<HTMLElement>('h2')!
    expect(heading.parentElement?.textContent).not.toMatch(/62/)
  })

  it('gives all three pairs ONE style, and the values the HEADING face', () => {
    // The ask was "the same style as the lessons completed", then "change the
    // bold items to the serif font". A pair that drifts is the regression, and
    // it is invisible in review: three near-identical pairs where one is a
    // weight or two pixels off.
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const stats = headerStatRow(container)
    const shape = stats.map(({ cell }) => {
      const spans = Array.from(cell.querySelectorAll<HTMLElement>('span'))
      const value = spans.find((el) => el.style.fontWeight === '700')!
      const caption = spans.find((el) => el.style.textTransform === 'uppercase')!
      return [
        value.style.fontFamily,
        value.style.fontSize,
        value.style.fontWeight,
        value.style.color,
        caption.style.fontSize,
        caption.style.textTransform,
        caption.style.color,
      ].join('|')
    })
    expect(new Set(shape).size).toBe(1)
    /* 14px as of 2026-09-17, up from 13 — the captions stay at 11, so the step
       between a value and its label widened rather than the pair growing.
       
       NOT 15, which it was briefly: at 15 the three pairs need exactly the
       row's width (687px in a 687px row), so it wrapped or not on a pixel. */
    expect(shape[0]).toContain('14px|700')
    expect(shape[0]).toContain('uppercase')
    // `--font-heading`, NOT a literal serif stack: that is the token
    // `dashboard-heading-font` re-points, so the serif follows the flag. A
    // pinned literal would make this the one thing on the page ignoring it.
    expect(shape[0]).toContain('var(--font-heading)')
  })

  it('runs them on ONE line, separated by the meta line\'s own dot', () => {
    // A caption under its value reads as a small KPI cell, and three of those
    // is the block's KPI grid said twice. Inline, the row is a meta line — the
    // same object as "Insurance Pre-Licensing \u00b7 New York \u00b7 42 Lessons" at the
    // top of this band, which is why it takes that line's EXACT separator
    // rather than a second kind of dot three inches away.
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const dots = headerStatDots(container)
    /* ONE dot for two pairs, as of 2026-09-21. It was two for three pairs; the
       Target Exam Date cell went, and the first surviving pair gave up its dot
       when a vertical RULE took over separating the group from the percentage
       that now leads the row. Dots go between PAIRS, the rule goes between the
       figure and the group — two separators doing one job three pixels apart is
       what this counts against. */
    expect(dots).toHaveLength(1)
    for (const dot of dots) {
      expect(dot.style.width).toBe('3px')
      expect(dot.style.background).toBe('var(--color-neutral-300)')
      // Decoration: the pairs are already separated for a screen reader by
      // being separate elements, and a bullet read aloud is noise.
      expect(dot.getAttribute('aria-hidden')).not.toBeNull()
    }
    /* 30 BETWEEN PAIRS, SPLIT AS 15 + 15 (2026-09-17, the direct ask for 30).
       The dot lives inside the group it introduces rather than beside it, so
       the cluster's 15 sits before the dot and the group's own 15 after it —
       which both measures 30 and lets a wrap take the dot with its pair. */
    const row = headerStatRow(container)[0].row
    const cluster = row.children[0] as HTMLElement
    /* READ OFF THE PAIRS CONTAINER AND A PAIR, not off `cluster.children[1]`.
       That index used to be the second stat group and is now the pairs
       container, which also carries a 15 — so the assertion kept passing while
       measuring a different thing. The 30 this is about is the container's gap
       BEFORE a group's dot plus the group's own gap after it. */
    const pairsBox = (Array.from(cluster.children) as HTMLElement[]).find(
      (el) => el.tagName === 'DIV',
    )!
    expect(pairsBox.style.gap).toBe('15px')
    expect((pairsBox.children[0] as HTMLElement).style.gap).toBe('15px')
    // …and the value still sits tight to its own caption.
    const pair = cluster.querySelector<HTMLElement>('span[style*="gap: 6px"]')!
    expect(pair).toBeTruthy()
  })

  it('reads the SAME renewal pair the KPI cells below do', () => {
    /*
     * Both figures now appear TWICE on one screen — here, and in the block's
     * Target Date / Time Remaining cells a few lines down. Deriving them in two
     * components is how they come to disagree, which is the fork
     * `displayedProgressPct` was extracted to close; `resolveRenewal` is the
     * one resolver, and this asserts the agreement through the DOM rather than
     * through the helper, since an override only matters if the surface
     * honours it.
     *
     * ⚠ THE DATE HALF WENT WITH THE CELL on 2026-09-21 (the direct ask,
     * "remove"). The header prints no date now, so the agreement is asserted
     * through the COUNTDOWN — which is derived from the same `resolveRenewal`
     * pair and is therefore the same claim: one resolver, two surfaces, no
     * chance to disagree. The navy half below still prints the date and is
     * still checked for it.
     *
     * Worth stating rather than silently narrowing: this test got WEAKER. It
     * used to catch a header and a block disagreeing about a date, and there is
     * now only one surface printing one, so there is nothing left to compare.
     */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    const stats = headerStatRow(container)
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(stats[0].value).toBe(timeRemainingText(persona.renewal!.weeksLeft))
    /*
     * The BLOCK's own Target Date / Time Remaining cells were the second copy
     * this asserted against, and they left on 2026-09-17 with the KPI row —
     * replaced by the Study Pace and Readiness tiles. So the second consumer is
     * now the NAVY surface, which keeps its tiled cells; the resolver is shared
     * with it, and that is what this pins.
     */
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem('cgp.featureFlags', JSON.stringify({}))
    const navy = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = navy.container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.textContent).toMatch(/Target Date|Deadline/i)
    /* THE DATE COMES OUT OF THE PERSONA, not a literal. It was `12/15/2026`,
       authored independently of the countdown beside it — the disagreement that
       map's own note recorded for weeks. As of 2026-09-21 the deadline is
       DERIVED from the days left (the 30-day cap forced it), so pinning the old
       literal would be pinning the bug. Read from the same persona the
       countdown below is read from, which is the agreement this test is for. */
    expect(band.textContent).toContain(persona.renewal!.deadline)
    expect(band.textContent).toContain(timeRemainingText(persona.renewal!.weeksLeft))
  })

  it('opens the sheet on the COURSE BREAKDOWN, not the requirements', () => {
    /* The band's "View Details" is the first thing on this version to reach the
       sheet's PROGRESS half — the gauge, the per-category bars and the course
       lists. Until now every trigger here meant "requirements", so the
       breakdown was built, wired and unreachable.
       
       One sheet, a `view` prop: two sheets rendering one component is the fork
       this file keeps closing. */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    fireEvent.click(within(container).getByRole('button', { name: /^details/i }))
    const dialog = screen.getByRole('dialog')
    // The breakdown half, and NOT the tabbed chrome.
    expect(within(dialog).queryByRole('tablist')).toBeNull()
    expect(dialog.textContent).toMatch(/Target Date/i)
    // The requirements half's own copy is absent — this is the other half.
    expect(dialog.textContent).not.toMatch(/Line of Authority/i)
  })

  it('does NOT bring "Go to Learning Path" back with it', () => {
    /* The regression this caught on the way in. That CTA was gated on
       `view !== 'requirements'`, so making `progress` reachable handed it to a
       version whose whole point is that XCEL has no learning-path concept —
       the decision `onOpenLearningPath={qeFocused ? undefined : …}` exists to
       hold. The gate is `view === 'tabs'` now: both single-half views have one
       host between them, and it is the HOST that refuses the concept.
       
       The tabbed sheet keeps it, which the other consumers depend on. */
    seedHeader('band')
    const { container } = renderShell(QE_URL)
    fireEvent.click(within(container).getByRole('button', { name: /^details/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/Learning Path/i)
    expect(
      within(dialog).queryByRole('button', { name: /go to learning path/i }),
    ).toBeNull()
  })

  it('returns an unparseable deadline UNTOUCHED rather than guessing one', () => {
    // These strings are authored in fixtures, so printing the raw text is the
    // honest failure — a guessed date would be a wrong fact rendered as a right
    // one, which is the rule the four dead Resources slugs taught.
    expect(longDate('sometime in the spring')).toBe('sometime in the spring')
    expect(longDate('')).toBe('')
    // Both shapes the fixtures actually carry resolve to one format: the
    // persona's slash date, and the LICENSE_TRACKER fallback's long form.
    expect(longDate('12/15/2026')).toBe('December 15, 2026')
    expect(longDate('Nov 30, 2026')).toBe('November 30, 2026')
  })

})

describe('the Study Journey rail style flag', () => {
  function seedJourney(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-journey-style': { enabled: true, variant } }),
    )
  }

  it('is registered, variant-only, and in the panel scope', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-journey-style')!
    expect(def.page).toBe('dashboard-rebrand')
    /* `syllabus` as of 2026-09-17 ("set this view as the default"). It is no
       longer a restyle of the compact rail so much as the treatment this version
       was built around; `default` stays in the picker as the comparison. */
    expect(def.defaultVariant).toBe('syllabus')
    expect(def.variants?.map((v) => v.value)).toEqual(['default', 'syllabus'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-journey-style')
  })

  it('renders the SYLLABUS treatment at the default, and `default` on request', () => {
    // Inverted 2026-09-17: the syllabus IS the default, so what needs pinning is
    // that the compact treatment is still reachable — it is the comparison the
    // picker exists for.
    const atDefault = renderShell(QE_URL)
    expect(atDefault.container.textContent).toMatch(/Complete Coursework/)
    expect(atDefault.container.textContent).toMatch(/Post-course process/i)
    atDefault.unmount()
    seedJourney('default')
    const compact = renderShell(QE_URL)
    expect(compact.container.textContent).not.toMatch(/Complete Coursework|Post-course process/i)
    expect(compact.container.textContent).toMatch(/Atlas Study Journey/)
  })

  it('numbers the stops on the NODE and names the sequence', () => {
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    // "Study Journey" is the eyebrow; the heading read "Syllabus sequence" then
    // "Complete Course", and is "Complete Coursework" as of 2026-09-17 —
    // matching the supplied reference, and the truer of the two words, since
    // the rail covers the prep review, the simulators and the attestation as
    // well as the course itself.
    expect(container.textContent).toMatch(/Complete Coursework/)
    expect(container.textContent).not.toMatch(/Syllabus sequence/i)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    /* ⚠ THE NODES CARRY NO DIGITS AT ALL as of 2026-09-23 — "just make circles.
       The steps are getting to be too much."

       This test was about WHERE the number lived: it had been in the title and
       on the node both ("01. Pre-licensing Course" beside a node reading 01),
       and the fix put it on the node alone. The answer now is neither. Five
       numbered stops plus three numbered cards described an eight-step journey;
       there are four steps, and these five are what step 1 is made of.

       So the assertion inverts — the list names its stops and numbers none of
       them. The `<ol>` still carries the order for anyone not looking at it,
       which is why the node column was always `aria-hidden`. */
    const text = list.textContent ?? ''
    expect(text).toContain('Pre-Licensing Lessons (42)')
    expect(text).toContain('Course Exam (1)')
    expect(text).toContain('Attestation & Affidavit')
    // NO ordinal anywhere in the list — padded, bare, or trailing a full stop.
    expect(text).not.toMatch(/\d\s*\.?\s*Pre-Licensing/)
    expect(text).not.toMatch(/\d\s*\.?\s*Course Exam/)
  })

  it('drops the summary count, the chip and the Part labels', () => {
    /*
     * All three said something already on screen, and all three left on
     * 2026-09-17 to match the reference:
     *
     *   - "Milestone 0 / 4 Complete" beside the heading reported a NOUGHT at
     *     the demo's own state, directly over a row reading "26 of 42 lessons
     *     complete". Two true numbers arguing.
     *   - The "62% In progress" chip duplicated that same sub-line.
     *   - "Part 2" / "Part 3" on a blocked row is the first segment of the
     *     stop's own group, i.e. the row named twice.
     */
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    expect(container.textContent).not.toMatch(/Milestone/)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    expect(list.textContent).not.toMatch(/62% In progress/i)
    expect(list.textContent).not.toMatch(/Part 2|Part 3/)
    // The COMPACT rail keeps its count: with no room for per-row detail, the
    // position in the sequence is the only summary it can offer.
    const plain = renderShell(QE_URL)
    expect(
      plain.container.querySelector('ol[aria-label="Study journey stops"]'),
    ).toBeTruthy()
  })

  it('prints NO sub-line, now that the header carries the count', () => {
    /*
     * The syllabus treatment printed `leanMeta` on all four rows until
     * 2026-09-17 — three of them ending in "Unlocks after coursework" under
     * three greyed titles, which is a paragraph where the point was a list. The
     * reference gives the active row a sub-line and the rest nothing, and that
     * is now what both treatments do.
     *
     * The COST, unchanged from the earlier note that dropped it on the compact
     * rail: Part 2's published 80% target and Part 3's "3 simulators, aim for
     * 85%" are now only on the requirements sheet this block links. The blocked
     * REASON survives on the row's `title`, so it is still on hover and
     * available to assistive tech — which is what the second half of this
     * asserts, because a rule about what is NOT rendered passes vacuously if
     * the thing was never reachable at all.
     */
    /* ⚠ THE PREMISE INVERTED on 2026-09-21. This asserted a sub-line on the
       ACTIVE row — the count in words — while the other three rows had none.
       The direct ask removed that count ("this is shown already"): the course
       header's stat row states "26 of 42 lessons COMPLETED" three inches above
       it, which is the duplication this treatment was trimming in the first
       place and which simply survived the first pass because the header gained
       that cell later.

       So the active row has no sub-line either, and what this test now pins is
       that removing it did not take the STATE with it — the half that was
       always the point. */
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    expect(list.textContent).not.toMatch(/26 of 42 lessons complete/)
    // …and nothing under the three that never had one.
    expect(list.textContent).not.toMatch(/Unlocks after coursework/)
    expect(list.textContent).not.toMatch(/aim for 80%|aim for 85%/)
    /* The state is still carried in WORDS, off-screen.
     *
     * Both earlier notes said the blocked reason "survives on the row's
     * `title`". On 2026-09-17 that turned out never to have been implemented —
     * there was no `title` attribute anywhere in `StudyJourneyRail` — so the
     * rule those notes leaned on had been false for as long as they had been
     * written. A visually-hidden span carries it now, which is also the more
     * robust mechanism: `title` is exposed inconsistently by screen readers and
     * not at all by touch.
     *
     * Asserted here rather than in an a11y suite because it is the direct
     * consequence of this test's own subject: dropping the visible sub-line is
     * only safe while the words exist somewhere. */
    expect(list.textContent).toMatch(/After your coursework|Not started/i)
    const hidden = Array.from(list.querySelectorAll<HTMLElement>('span')).filter(
      (el) => el.style.clipPath === 'inset(50%)',
    )
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.map((el) => el.textContent).join(' ')).toMatch(/coursework|started/i)
  })

  it('spaces and marks the two lists as ONE sequence', () => {
    /*
     * The journey runs 01-04 and Get Licensed 05-07, so the seven rows are one
     * route to a licence and must be spaced as one. They were not: Get Licensed
     * carried a 10px LIST GAP on top of the 8px its `<li>` already had, which
     * measured 39px node-to-node against the journey's 29.
     *
     * That gap is left over from when each step was its own bordered CARD and
     * needed separating from the next. The cards went when the section lost its
     * background and stroke; the gap outlived them — the same leftover as the
     * nodes' white fill and the row button's 14px bottom padding.
     *
     * Asserted as the declaration, since jsdom has no layout. Verified in the
     * browser: 29px node-to-node in BOTH lists.
     */
    const { container } = renderShell(QE_URL)
    const lists = Array.from(container.querySelectorAll<HTMLElement>('ol')).filter(
      (o) => /Pre-Licensing Lessons \(|Schedule State Exam/.test(o.textContent ?? ''),
    )
    expect(lists).toHaveLength(2)
    for (const ol of lists) {
      // No list gap in either — the `<li>` owns the spacing, outside the hover
      // target so the wash stays centred on its own text.
      expect(ol.style.gap).toBe('')
    }
    /* ⚠ THE TWO ROW HEIGHTS DIVERGED ON 2026-09-23, and this test is narrowed
       rather than deleted because the thing it was protecting is still real.
       Both lists carried 8px so seven rows read as one route to a licence. The
       ask that day — "reduce the spacing between steps 1-5" — applies to the
       journey and not to Get Licensed, so the journey is 3px and Get Licensed
       keeps 8.

       WHAT SURVIVES: neither list uses a list `gap`, which is the mechanism
       half (a gap would break the connector into dashes between rows, where
       padding lets the `flex: 1` spine reach through). WHAT DOES NOT: the
       claim that the two measure the same. On the Testing version — the
       direction this product is going — Get Licensed is three separate CARDS
       and there is no second list to match, so the divergence is only visible
       on this archived version. */
    const [journey, getLicensed] = lists
    expect(journey.querySelector<HTMLElement>('li')!.style.paddingBottom).toBe('3px')
    expect(getLicensed.querySelector<HTMLElement>('li')!.style.paddingBottom).toBe('8px')
  })

  it('dashes a LOCKED node and leaves an OPEN one solid', () => {
    /*
     * The distinction is locked vs not, and it is why there are two node
     * treatments rather than one:
     *
     *   - The journey's 02-04 are blocked on the coursework above them, and
     *     dashed already means "not started" across this codebase.
     *   - Get Licensed's 05-07 are NOT gated — a learner can book a PSI sitting
     *     whenever they like. They carry no completion state because PSI and DFS
     *     own the outcome, not because anything is stopping them.
     *
     * Dashing those three said "locked" about steps that are not, which is the
     * same class of wrong as a chevron on a row that opens nothing.
     */
    const { container } = renderShell(QE_URL)
    const nodeOf = (li: Element) => li.querySelector<HTMLElement>('span > span')!
    const journey = container.querySelector('ol[aria-label="Study journey stops"]')!
    const journeyNodes = Array.from(journey.querySelectorAll('li')).map(nodeOf)
    // 01 is current: filled, solid.
    expect(journeyNodes[0].style.border).toMatch(/solid/)
    expect(journeyNodes[0].style.background).toMatch(/primary-700/)
    // 02-04 are blocked: dashed and unfilled.
    for (const n of journeyNodes.slice(1)) {
      expect(n.style.border).toMatch(/dashed/)
      expect(n.style.background).toBe('transparent')
    }
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    for (const n of Array.from(licensed.querySelectorAll('li')).map(nodeOf)) {
      expect(n.style.border).toMatch(/solid/)
      expect(n.style.border).not.toMatch(/dashed/)
      expect(n.style.background).toBe('transparent')
    }
  })

  it('opens each step in its OWN sheet, with the published detail', () => {
    /*
     * The three rows opened the REQUIREMENTS sheet until 2026-09-17. That was
     * the honest placeholder while nothing described them individually — the
     * note said so outright: "a step-specific page would need content nobody has
     * authored." Jillienne supplied XCEL's own published steps 2-4, so each row
     * now opens its own.
     *
     * A SEPARATE sheet, not a third `view` on the requirements one: that panel
     * takes a `path` and shares its header with the breakdown, and a step is a
     * different object.
     */
    const { container } = renderShell(QE_URL)
    /* A BUTTON, not a link — the Schedule row went out to PSI directly until
       its sheet existed. The PSI URL is inside the sheet now, alongside the
       system check and the retake policy, which are the two things a learner
       wants BEFORE starting a registration flow. */
    fireEvent.click(within(container).getByRole('button', { name: /schedule state exam/i }))
    let dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Post-course process/)
    expect(dialog.textContent).toMatch(/There are no limitations on retaking the exam/)
    expect(dialog.textContent).toMatch(/Spanish exams are available/)
    // It is NOT the requirements sheet — that one states the board's rules for
    // the licence as a whole.
    expect(dialog.textContent).not.toMatch(/Line of Authority/i)
    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }))

    fireEvent.click(within(container).getByRole('button', { name: /apply for your license/i }))
    dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/full fee is \$80, half fee is \$40/)
  })

  it('links only to URLs the source page prints, with the NIPR typo fixed', () => {
    /*
     * Every href in a step's detail is one XCEL's page shows. ONE had to be
     * corrected on the way in: the page renders the NIPR link as
     * `https://http://www.nipr.com/` — a doubled scheme, plainly a typo on
     * their side. Fixing it is not inventing it; the domain is theirs.
     *
     * Also worth noting: this is where a confirmed DFS URL finally came from.
     * The header band's "DFS Statutory Rules" button was removed in September
     * precisely because none existed in this repo.
     */
    const apply = GET_LICENSED_STEPS.find((st) => st.id === 'apply-license')!
    const hrefs = (apply.sections ?? []).flatMap((sec) =>
      sec.bullets.flatMap((b) => [b.href, ...(b.children ?? []).map((c) => c.href)]),
    )
    expect(hrefs).toContain('https://www.nipr.com/')
    expect(hrefs.some((h) => h?.includes('http://'))).toBe(false)
    expect(hrefs).toContain('https://www.dfs.ny.gov/apps_and_licensing/agents_and_brokers/home')
    // New tab, and the themed class rather than an inline colour — the CTA ramp
    // is a fill colour on XCEL and cta-500 as TEXT is 1.84:1 on the dark page.
    const { container } = renderShell(QE_URL)
    fireEvent.click(within(container).getByRole('button', { name: /apply for your license/i }))
    /* Scoped to the step's OWN bullet links. The sheet also carries the
       governing-agency block, whose `tel:` and `mailto:` deliberately do NOT
       open a new tab — a dialler or a mail client is not a navigation away from
       the dashboard. A blanket `every link is _blank` check would have failed
       for the right behaviour. */
    const links = Array.from(screen.getByRole('dialog').querySelectorAll('a')).filter((a) =>
      a.getAttribute('href')?.startsWith('http'),
    )
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.className).toContain('cre-cta-ink')
      expect((a as HTMLElement).style.color).toBe('')
    }
  })

  it('closes ALL THREE sheets with the governing agency, under a rule', () => {
    /*
     * DFS governs the LICENCE, not any one step, so the block is identical on
     * each of the three — which step you happened to open must not decide
     * whether you can find the phone number.
     *
     * Swept across all three rather than checked on one, because "identical on
     * each" is the assertion; a single-sheet check would pass with the block on
     * one and missing from two.
     */
    for (const step of GET_LICENSED_STEPS) {
      const view = renderShell(QE_URL)
      fireEvent.click(
        within(view.container).getByRole('button', { name: new RegExp(step.title, 'i') }),
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent, step.id).toMatch(/Governing Agency/)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.name)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.phone)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.address)
      // A hairline above it — the same `--color-border-subtle` seam the rest of
      // this version uses, not a heavier line for one boundary.
      const rule = Array.from(dialog.querySelectorAll<HTMLElement>('div')).find(
        (d) => d.style.height === '1px',
      )!
      expect(rule, step.id).toBeTruthy()
      expect(rule.style.background).toMatch(/border-subtle/)
      // The phone and the email are ACTIONS, not text to retype; the website
      // leaves XCEL so it opens in a new tab, and `tel:`/`mailto:` do not.
      const agency = dialog.querySelector('section:last-of-type')!
      const byHref = (pre: string) =>
        Array.from(agency.querySelectorAll('a')).find((a) => a.getAttribute('href')?.startsWith(pre))
      expect(byHref('tel:')).toBeTruthy()
      expect(byHref('mailto:')).toBeTruthy()
      const site = byHref('https://www.dfs.ny.gov/')!
      expect(site.getAttribute('target')).toBe('_blank')
      expect(byHref('tel:')!.getAttribute('target')).toBeNull()
      view.unmount()
    }
  })

  it('still carries NO completion state on any step', () => {
    // Unchanged by the sheets, and the reason is unchanged: PSI schedules the
    // sitting, PSI scores it, DFS issues the licence. A tick would be the
    // product claiming an outcome it has no feed for.
    for (const step of GET_LICENSED_STEPS) {
      expect(Object.keys(step)).not.toContain('status')
      expect(Object.keys(step)).not.toContain('completed')
    }
  })

  it('separates Get Licensed from the journey with a RULE, not a card', () => {
    /*
     * INVERTED 2026-09-17. Each section drew its own bordered card, on the
     * reasoning that what changes between them is WHO owns the work (XCEL, then
     * the state) and a card boundary says that more plainly than a hairline —
     * so the widget dropped its rule when both were cards.
     *
     * Both cards were then removed ("remove background and stroke"), and the
     * rule had to come back with them: without either, the journey's four stops
     * and the three licensing steps run together as one seven-row list. Which
     * is now literally true of the NUMBERING — 01-04 then 05-07 — so the rule
     * is the only thing left saying the second half is a different kind of
     * step.
     */
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    /* Scoped to the BAND. The page-wide version of this caught the "This week"
       strip, which is a white bordered card belonging to another component
       entirely — an over-wide scope that would have gone on passing for a
       reason having nothing to do with the journey. */
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const cards = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === 'var(--color-surface-card)' && d.style.border !== '',
    )
    expect(cards).toHaveLength(0)
    // The heading is still there, so the sections are still two things.
    expect(band.textContent).toMatch(/Post-course process/)
    // …and a hairline divides them.
    const rules = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.height === '1px' && /border-subtle|neutral/.test(d.style.background),
    )
    expect(rules.length).toBeGreaterThanOrEqual(1)
  })

  it('names the jurisdiction on Get Licensed, from a map not a literal', () => {
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    expect(container.textContent).toMatch(/Get Licensed in New York/)
    /* THE LEDE IS GONE from this treatment (2026-09-17) — the eyebrow
       ("Post-course process") and the heading ("Get Licensed in New York")
       already said it between them, and it ended in a colon pointing at a list
       that now numbers 05-07 in continuation of the journey above. The compact
       rail keeps its own, because there the heading is a bare "Get Licensed"
       with no eyebrow and nothing else places the section in time. */
    expect(container.textContent).not.toMatch(/Post-course state licensing milestones/)
    expect(container.textContent).toMatch(/Post-course process/)
    /* The rows are TITLES ONLY on this treatment as of 2026-09-17 — the detail
       sentence and the labelled "Vendor: PSI · $40 exam fee" line came off, to
       be shown when the row is opened. So the assertion moves from "the labels
       are rendered" to "the facts are still reachable": the fixture keeps them,
       and every row opens the sheet that states them.
       
       Asserted at the FIXTURE rather than the DOM, because the point is that
       nothing was deleted — a `queryByText` returning null proves the copy is
       off screen and says nothing about whether it still exists. */
    expect(container.textContent).not.toMatch(/Vendor: PSI/)
    const psi = GET_LICENSED_STEPS.find((st) => st.owner === 'PSI')!
    expect(psi.fee).toBeTruthy()
    expect(psi.detail).toBeTruthy()
    expect(
      within(container).getByRole('button', { name: /state requirements/i }),
    ).toBeInTheDocument()
    /* THE THREE ROWS ARE STEPS 2, 3 AND 4 — the coursework above them is step
       1, whole, and its stops are not steps.

       ⚠ THIS LINE HAS BEEN HAND-CORRECTED THREE TIMES (05-07, then 06-08, then
       the leading zeros), always because it tracked the journey's STOP COUNT.
       That is the thing that stopped: the count no longer moves these. Pinned
       as literals, and separately against the stop count, so a sixth stop fails
       here rather than silently renumbering them a fourth time. */
    // Found by CONTENT — the two lists are not siblings, so `:last-of-type`
    // returns the journey's.
    const list = [...container.querySelectorAll<HTMLElement>('ol')].find((o) =>
      /Schedule State Exam/.test(o.textContent ?? ''),
    )!
    expect(list.textContent).toMatch(/2/)
    expect(list.textContent).toMatch(new RegExp(String(1 + GET_LICENSED_STEPS.length)))
    const stopCount = journeyStopsFor(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!.path,
    ).length
    expect(stopCount).toBeGreaterThan(1)
    expect(list.textContent).not.toContain(String(stopCount + 1))
    // `jurisdictionName` falls back to the CODE rather than blanking or
    // guessing, so an unmapped state still reads.
    expect(jurisdictionName('NY')).toBe('New York')
    expect(jurisdictionName('ZZ')).toBe('ZZ')
    expect(jurisdictionName(undefined)).toBe('')
  })

  it('changes no DATA — same stops, same names, no authored copy', () => {
    // The reference carries "Foundational jurisprudence", "Mandatory sworn
    // affidavit of identity & contact hours" and a course code
    // ("NY-INS-L&H-2026"). Those are claims about New York practice and a
    // record number, and nothing in the fixtures sources any of them.
    const before = journeyStopsFor(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!.path,
    ).map((st) => st.title)
    seedJourney('syllabus')
    const { container } = renderShell(QE_URL)
    for (const title of before) expect(container.textContent).toContain(title)
    /* ⚠ "affidavit" ALONE IS NO LONGER BANNED, and the narrowing is deliberate.
       A journey stop reads "Attestation & Affidavit" as of 2026-09-23 — from
       Jillienne, out of the product, the same channel that supplied the LMS
       step strip this rail was rebuilt against. What stays banned is the
       MOCKUP'S phrasing: "sworn affidavit of identity & contact hours", which
       was read off a picture and sourced by nothing. The guard is about
       provenance, not vocabulary, so it pins the phrase rather than the word. */
    expect(container.textContent).not.toMatch(/jurisprudence|sworn affidavit|NY-INS-/i)
    expect(container.textContent).toContain('Attestation & Affidavit')
    // …and it did not split the merged completion stop back into two.
    expect(before).toContain('Survey & Certificate')
  })
})

describe('the CLP stats treatment', () => {
  /*
   * RETIRED 2026-09-22. `dashboard-clp-stats` was a second axis beside the
   * block style: `stat-card` gathered the three KPI cells and the status onto
   * one white card, with a sub-label under each cell, Completed as a two-tone
   * fraction, and the strip rendered `bare` inside the card. `default` — three
   * bare cells split by vertical rules — was already the committed default, and
   * won.
   *
   * The four tests here described the card. They are gone with it; what is kept
   * is the shape of the page that survived, asserted POSITIVELY rather than as
   * "the card is absent", so this still fails if the treatment comes back
   * half-wired.
   */
  const statCard = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('div')).find(
      (d) =>
        d.style.background === 'var(--color-surface-card)' &&
        /Target Date/i.test(d.textContent ?? ''),
    )

  it('has no flag left, and leaves the block-style axis alone', () => {
    // The two were separate flags rather than one list of combinations, so
    // retiring this one must not have taken the other with it.
    expect(FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-stats')).toBeUndefined()
    expect(flagScopeForPath('/dashboard-rebrand')).not.toContain('dashboard-clp-stats')
    expect(FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-style')).toBeTruthy()
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-clp-style')
  })

  it('puts nothing on a white card', () => {
    /* The card is the whole of what `stat-card` did, so its absence is the
       assertion — checked at the committed default AND on the classic layout,
       because the two render different things into this region and the card
       could only ever have appeared in one of them.

       NOT asserted here: that the three KPI cells render. They do not, on
       either layout — the square-tiles change replaced that row, and the
       header band states the same facts. A test claiming to find "Time
       Remaining" passes by matching the Study Journey instead, which is how a
       cell-shape test ends up testing nothing. */
    const { container } = renderShell(QE_URL)
    expect(statCard(container)).toBeUndefined()
    cleanup()
    seedClassic()
    const classic = renderShell(QE_URL)
    expect(statCard(classic.container)).toBeUndefined()
  })

  it('carries no sub-labels under the cells', () => {
    /* ⚠ A DERIVATION WENT WITH THIS, and it is worth knowing rather than
       discovering. The "~N hrs/day suggested pace" sub-label was the last home
       of `hoursPerDay` — the resume course's real credit hours over the days
       left — after the Study Pace tile stopped printing it on 2026-09-17 and
       the `rate` pacing treatment was retired earlier today.

       It is NOT the same figure the presets card states. That card derives its
       evening from `src/lib/studyPace.ts`, against the access window or a
       booked exam; this one was credit-hours over calendar days. The old
       derivation is gone from the product, not relocated.

       `archivedItems.ts` row `clp-stats-stat-card` carries the restore. */
    seedClassic()
    const { container } = renderShell(QE_URL)
    expect(container.textContent).not.toMatch(/hrs\/day suggested pace/i)
    expect(container.textContent).not.toMatch(/Your exam target date/i)
  })
})

describe('the columns are not near-even any more', () => {
  it('gives the progress block the width, 660 : 380', () => {
    // They were 514 : 407 because they were once two halves of one band. They
    // are not: the LEFT column carries the art, title, meta, progress bar,
    // Resume CTA, three KPI cells and a status strip; the right is a list of
    // short rows and gives width up cheaply. Measured after: 515px against
    // 296px in the pane, and the KPI row stops being tight.
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.gridTemplateColumns).toBe('minmax(0, 660fr) minmax(0, 380fr)')
  })

  it('has only ONE grid to edit now', () => {
    /* ⚠ THE HAZARD THIS GUARDED IS GONE, which is why the assertion inverted.
       There used to be TWO `gridTemplateColumns` in this band — the live one and
       the completed-celebration branch's — and the celebration's got an edit
       meant for the live one, with the symptom being the left column getting
       NARROWER because the real grid had not moved. jsdom could not see that,
       which is why this reads the source.

       The celebration was unwired on 2026-09-21 (the ask for the normal band at
       100%), taking its grid with it. So the test now pins the ABSENCE of the
       second grid: one declaration, carrying the live split. If a second ever
       returns, this fails and whoever added it inherits the warning above. */
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    const grids = src.match(/gridTemplateColumns: stack \?[^\n]*/g)!
    expect(grids).toHaveLength(1)
    expect(grids[0]).toContain('660fr')
    expect(src).not.toContain('514fr')
  })
})

describe('the CLP block style flag', () => {
  function seedStyle(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-clp-style': { enabled: true, variant } }),
    )
  }
  const navyCard = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-primary-700)',
    )

  it('is in the catalog and the panel scope, variant-only, default unchanged', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-style')!
    expect(def.page).toBe('dashboard-rebrand')
    expect(def.defaultEnabled).toBe(true)
    expect(def.defaultVariant).toBe('default')
    expect(def.variants?.map((v) => v.value)).toEqual(['default', 'big-number', 'navy'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-clp-style')
  })

  it('changes NOTHING at the default', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell(QE_URL)
    expect(navyCard(container)).toBeUndefined()
    // The bar stays inline beside its percentage rather than in a column.
    expect(container.textContent).toMatch(/62% Complete/)
  })

  it('big-number promotes the figure to its own column, on the light ground', () => {
    seedStyle('big-number')
    const { container } = renderShell(QE_URL)
    expect(navyCard(container)).toBeUndefined()
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const big = Array.from(band.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '40px',
    )!
    expect(big.textContent).toBe('62')
    // The count in words under the bar says what the percentage is OF.
    expect(band.textContent).toMatch(/26 of 42 lessons complete/)
    // …and the inline bar+label is gone, so the number is drawn once.
    expect(band.textContent).not.toMatch(/62% Complete/)
  })

  it('navy puts the cluster on a card and keeps the rest on the page', () => {
    seedStyle('navy')
    const { container } = renderShell(QE_URL)
    const card = navyCard(container)!
    expect(card).toBeTruthy()
    // The reference has no cover; dropping it is what gives the title room.
    expect(card.querySelector('img')).toBeNull()
    // The CTA moves INSIDE the card — white on navy, not the primary gradient,
    // which on this card is the card's own colour.
    const cta = within(card).getByRole('button', { name: /resume course/i })
    expect(cta.style.background).toBe('var(--color-text-inverse)')
    // ONE resume button: `resumeInline` stands down when the card owns it.
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
    // The rest stays on the page grey below the card — the two tiles now,
    // where it was the KPI cells and the status strip until 2026-09-17. The
    // variant dresses the CLUSTER, not the whole block, and that is what this
    // has always been checking.
    expect(card.textContent).not.toMatch(/Study Pace/i)
    expect(band.textContent).toMatch(/Study Pace/i)
    expect(band.textContent).toMatch(/Readiness/i)
  })

  it('re-inks the META on navy — the seam that has now failed twice', () => {
    /*
     * `metaRow` is assembled ABOVE the surface-specific markup, so a treatment
     * applied by sweeping that markup misses it. It shipped white-on-grey at
     * ~1.2:1 when the page surface landed; it came back the other way round
     * here, keeping the PAGE's `--color-text-secondary` on the navy card at
     * **2.13:1**. Both were invisible to tsc and to every other test.
     *
     * Asserted as "not the page value" rather than on a number, because jsdom
     * computes no composited colour — the real check was in the browser
     * (12.25:1 after the fix).
     */
    seedStyle('navy')
    const { container } = renderShell(QE_URL)
    const card = navyCard(container)!
    // The element that SETS the colour, not the outermost one containing the
    // text — several wrappers match the text and none of them carry the ink.
    const meta = Array.from(card.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.color !== '' && /Insurance Pre-Licensing/.test(d.textContent ?? ''),
    )!
    expect(meta).toBeTruthy()
    expect(meta.style.color).not.toBe('var(--color-text-secondary)')
    // jsdom normalises the space-separated form to `rgba(255, 255, 255, 0.72)`,
    // so match on the channel values rather than the source spelling.
    expect(meta.style.color).toMatch(/255,\s*255,\s*255/)
  })

  it('invents no lesson-level content in any variant', () => {
    // The reference mock shows "Lesson 27 — Life insurance policy provisions ·
    // 14 minutes left". There is no lesson title and no per-lesson timing in
    // the fixtures, and authoring one is the rule this version has held all
    // along.
    for (const v of ['default', 'big-number', 'navy']) {
      seedStyle(v)
      const { container, unmount } = renderShell(QE_URL)
      expect(container.textContent, v).not.toMatch(/Lesson \d+ —|minutes left/)
      unmount()
    }
  })
})

describe('the header carries a horizontal bar, not a donut', () => {
  it('replaces the 150px gauge with a bar under the meta line', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // The donut had a whole row to itself to say one number the KPI cell below
    // already says as "26 / 42 lessons". The bar sits inside the text column,
    // under the meta, so it reads as this course's progress rather than as a
    // separate widget: title, what it is, how far through it.
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    // NOT rendered, not `display: none` — a hidden gauge is still in the
    // accessibility tree and still in every `querySelector('svg')` a test
    // reaches for, so it would read as present while being absent.
    expect(band.querySelectorAll('svg circle')).toHaveLength(0)
    expect(band.textContent).toMatch(/62% Complete/)
    const bar = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    // Against the TITLE, not the meta line: the meta is assembled as `metaRow`
    // outside this markup and is not a `<p>`, so selecting it by tag finds
    // nothing and the assertion passes vacuously. That is the same seam the
    // `metaRow` colour regression came through.
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    expect(title.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and it is INSIDE the header cluster, not in a row of its own below it.
    expect(title.closest('div')?.parentElement?.contains(bar)).toBe(true)
  })

  it('uses the SHARED ProgressBar, not a lookalike', () => {
    // The rule `ProgressInline` was extracted for: Readiness had drawn its own
    // 3px bar in a different green, so one learner's one 32% was two different
    // bars a rail item apart.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/import \{ ProgressBar \} from '@\/components\/ui\/ProgressBar'/)
    expect(src).toMatch(/<ProgressBar/)
  })

  it('swaps WITH the category bars, so one number is drawn once', () => {
    // `barInHeader` is tied to `showBars` being false. With a real
    // multi-category breakdown the donut still earns its row — it shows the
    // SEGMENTS, which a single bar cannot — so the two swap together rather
    // than the bar being a version check.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/const barInHeader = !showBars && hasBreakdown/)
    // The navy versions keep their donut, which is what that means in practice.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.querySelectorAll('svg circle').length).toBeGreaterThan(0)
  })
})

describe('the single category shows NO bar', () => {
  it('drops the breakdown when there is one thing to break down', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // A single category bar restates the donut's percentage AND the "Completed"
    // KPI cell — three sayings of one number within three inches. A breakdown
    // earns its place when there is something to compare.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.categories).toHaveLength(1)
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    // The CATEGORY bars, not every bar: the header carries one progress bar of
    // its own since 2026-09-16 (it replaced the donut), and it matches the same
    // pill-radius shape. Scoped by label, which is what tells them apart.
    const catBars = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) =>
        d.style.borderRadius === 'var(--radius-pill)' &&
        d.style.overflow === 'hidden' &&
        /lessons|hrs/.test(d.parentElement?.textContent ?? ''),
    )
    expect(catBars).toHaveLength(0)
    // The number is still on screen — the header bar and the KPI cell — so this
    // removes repetition, not information.
    expect(band.textContent).toMatch(/26 \/ 42 lessons/)
  })

  it('is a COUNT rule, not a version check', () => {
    // Any path that ends up with one category gets this; a path with a real
    // breakdown keeps its bars on every version. At source, because the only
    // one-category fixture is the one under test.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/const showBars = hasBreakdown &&/)
    expect(src).toMatch(/cats\.length > 1/)
  })

  it('keeps CATEGORY_BAR_HEIGHT for the surfaces that still draw bars', () => {
    // 8 → 6 on 2026-09-16, and still live on the detail sheet and both
    // ProgressTrackerCard layouts. This version simply has nothing to draw.
    expect(CATEGORY_BAR_HEIGHT).toBe(6)
  })
})

describe('the in-shell course launcher is a lo-fi placeholder', () => {
  /*
   * 2026-09-17, the direct ask. Resume used to open `CourseDetailPage` embedded
   * in the content column — the Figma "Learning Launcher" against the catalogue
   * fixture, which for this course meant `mm/dd/yyyy` for both Enrolled and
   * Expires, "Not Started · 0%", a two-item table of contents and an Enroll
   * button on a course the learner is 62% through. A reviewer would read that
   * as the course player rather than as scaffolding.
   *
   * It is a CALL-SITE change, not a deletion: the page is 638 lines with two
   * consumers, and only the launcher is the Compass surface.
   *
   * ⚠ THESE NOW PIN `course-launcher-style: lo-fi` EXPLICITLY — 2026-09-22.
   * The launcher grew a second variant (the Compass player, node 49:2903) and
   * `compass` is the branch default, so a test rendering without seeding got
   * the player and failed on every assertion below. That is the rule CLAUDE.md
   * already states, applied in the usual direction: a test about a capability
   * must pin the flags it depends on, or an editorial default silently becomes
   * its subject. What these are about is the PLACEHOLDER and the rail
   * behaviour around it, both of which are still live on that variant.
   */
  const seedLoFi = () =>
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'course-launcher-style': { enabled: true, variant: 'lo-fi' } }),
    )
  it('shows the placeholder and none of the old course chrome', () => {
    seedLoFi()
    const { container } = renderShell(QE_URL)
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    const placeholder = screen.getByRole('region', { name: /compass course content/i })
    expect(placeholder).toBeTruthy()
    expect(container.textContent).toMatch(/This is where Compass Course content will live/)
    // The fixture-driven chrome is gone — these are the four things that read as
    // a real course player while being placeholder data.
    expect(container.textContent).not.toMatch(/mm\/dd\/yyyy/)
    expect(container.textContent).not.toMatch(/Table of Contents/i)
    expect(container.textContent).not.toMatch(/\bEnroll\b/)
    expect(container.textContent).not.toMatch(/Not Started/i)
    // The way BACK stays in view, so the learner is never stranded in it.
    expect(within(container).getByRole('button', { name: /back to/i })).toBeInTheDocument()
  })

  it('auto-collapses the left rail to icon-over-short-text', () => {
    /*
     * 2026-09-17, the direct ask. Driven by the SAME `launcherOpen` flag that
     * already blanks the rail's active state, so the two cannot get out of
     * step — a rail highlighting nothing while staying full width is the worst
     * of both.
     *
     * The rail STAYS rather than disappearing: the launcher has no rail item of
     * its own, so orientation rests on "Back to {origin}", and hiding the rail
     * would leave that link carrying all of it.
     */
    seedLoFi()
    const { container } = renderShell(QE_URL)
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const labels = () => Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)
    // Full labels before.
    expect(labels()).toContain('My Courses')
    expect(rail().querySelector('p')).toBeTruthy() // the group caption

    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))

    // SHORT labels after, and only where one was authored — abbreviating
    // everything is how a rail ends up with "Certs" beside "Resources" for no
    // reason.
    expect(labels()).toContain('Courses')
    expect(labels()).toContain('Certs')
    expect(labels()).toContain('Resources')
    expect(labels()).not.toContain('My Courses')
    // The captions go (they would wrap to three lines in a 76px column); a
    // divider stands in, and never above the FIRST group.
    expect(rail().querySelector('p')).toBeNull()
    /* THE ACCESSIBLE NAMES DO NOT SHORTEN. Each row keeps its full label as its
       `aria-label`, and each group keeps its caption as the list's `aria-label`
       — which is what makes the abbreviation a visual economy rather than an
       accessibility regression. */
    const byName = within(rail())
    expect(byName.getByRole('button', { name: 'My Courses' })).toBeTruthy()
    expect(byName.getByRole('button', { name: 'Rubi Insights' })).toBeTruthy()
    expect(byName.getByRole('list', { name: 'My Learning' })).toBeTruthy()
    expect(byName.getByRole('list', { name: 'Support' })).toBeTruthy()
  })

  it('offers a rotating arrow-to-line to collapse and expand the rail', () => {
    /* `ChevronRight` rotated: `>` expands, `<` collapses, so direction carries
       the whole meaning and the control needs no label beside it.
       
       The glyph already means "drill into this row" in five other places, and
       the ROTATION is what keeps them apart — a drill-in chevron never turns.
       `bars` was the other vendored candidate and is wrong: a hamburger says
       "open the menu", and at 76px the rail is already open. */
    seedLoFi()
    const { container } = renderShell(QE_URL)
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = () => within(rail()).getByRole('button', { name: /^(Collapse Menu|Expand)$/ })
    // Expanded at rest: the label says what the click DOES, not what the state
    // is, and `aria-expanded` says the state.
    /* THE VISIBLE LABEL IS THE ACCESSIBLE NAME as of 2026-09-17 — no
       `aria-label` competing with it, and no `title` tooltip, both of which the
       earlier circular handle needed to explain itself. `aria-expanded` still
       carries the STATE, which a verb alone cannot. */
    expect(toggle().textContent).toBe('Collapse Menu')
    expect(toggle().getAttribute('aria-label')).toBeNull()
    expect(toggle().getAttribute('title')).toBeNull()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    /* `arrow-right-to-line`, rotated: pointing LEFT it collapses, pointing
       RIGHT it expands. It replaced a bare chevron on 2026-09-17 — that glyph
       already means "drill into this row" in five other places, and a chevron
       says "there is more this way" where an arrow INTO a line says "push the
       panel to this edge", which is what the control does.
       
       The LEFT twin is the same asset rotated 180°: the two are exact mirrors,
       so the transform yields FA's own `arrow-left-to-line` without a second
       file — which is also what keeps it inside the repo's rule against
       hand-authoring an icon path. Asserted on the ROTATION, since that is the
       whole mechanism. */
    expect(toggle().querySelector('svg')!.getAttribute('style')).toMatch(/rotate\(180deg\)/)
    // The vendored asset, at the FA 7 viewBox — not a hand-drawn path.
    expect(toggle().querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 640 640')
    fireEvent.click(toggle())
    expect(toggle().textContent).toBe('Expand')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    // Collapsed points RIGHT — unrotated.
    expect(toggle().querySelector('svg')!.getAttribute('style')).not.toMatch(/rotate/)
    // Collapsed: short labels, so the toggle really drove the collapse.
    expect(Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)).toContain(
      'Certs',
    )
  })

  it('scopes the manual override to one launcher session', () => {
    /*
     * THE BUG THIS CAUGHT, because it is the kind that looks like it works.
     *
     * The override reset only on CLOSE at first, so a learner who expanded the
     * rail on the dashboard carried that choice INTO the launcher and the
     * auto-collapse silently did not fire. Measured in the browser: expand at
     * home, open Compass, rail still 220.
     *
     * Resetting both ways scopes the override to one launcher session — opening
     * always collapses, an expand inside lasts as long as the course, and
     * leaving restores the dashboard's default.
     */
    seedLoFi()
    const { container } = renderShell(QE_URL)
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = () => within(rail()).getByRole('button', { name: /^(Collapse Menu|Expand)$/ })
    const labels = () => Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)

    // Collapse, then expand again at home — leaving a non-null override.
    fireEvent.click(toggle())
    fireEvent.click(toggle())
    expect(labels()).toContain('My Courses')

    // Opening the launcher must STILL auto-collapse.
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    expect(labels()).toContain('Certs')
    expect(labels()).not.toContain('My Courses')

    // Expanding inside, then leaving, restores the dashboard default.
    fireEvent.click(toggle())
    expect(labels()).toContain('My Courses')
    fireEvent.click(within(container).getByRole('button', { name: /back to/i }))
    expect(labels()).toContain('My Courses')

    /* REOPENING THE SAME COURSE restores the width chosen for it, and that is
       the one place the behaviour differs from the rule as stated ("clicking
       Compass auto-collapses").
       
       It is deliberate: the override is scoped by COURSE ID, so each course
       keeps its own. It reads as the product remembering a correction rather
       than re-imposing something the learner just undid. Forcing the collapse
       on every open needs a per-open counter, which needs a hook into the
       launcher's own `open` — pinned here so the difference is a recorded
       choice rather than something a later reader takes for a bug. */
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    expect(labels()).toContain('My Courses')
  })

  it('hovers exactly like a rail row, and keeps its 3px indicator column', () => {
    /*
     * Hover was the one thing the row version missed on the first pass: it
     * matched its neighbours at rest and then sat inert under the cursor, which
     * reads as a disabled row rather than a control.
     *
     * It reads `HOVER_BG` and `IDLE_COLOR` — the SAME constants `RailRow`
     * reads, not copies — so the two cannot come to disagree about what a rail
     * row does under the cursor. Compared against a live row here rather than
     * against a literal, which is what makes that sharing the subject.
     */
    seedLoFi()
    const { container } = renderShell(QE_URL)
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const rows = Array.from(rail.querySelectorAll<HTMLElement>('button'))
    const toggle = rows.find((b) => b.textContent === 'Collapse Menu')!
    // A NON-ACTIVE row: the active one has its own fill and never shows hover.
    const plain = rows.find((b) => /Resources/.test(b.textContent ?? ''))!
    fireEvent.mouseEnter(plain)
    fireEvent.mouseEnter(toggle)
    expect(toggle.style.background).toBe(plain.style.background)
    expect(toggle.style.color).toBe(plain.style.color)
    fireEvent.mouseLeave(toggle)
    fireEvent.mouseLeave(plain)
    expect(toggle.style.background).toBe(plain.style.background)

    /* THE 3px LEFT BORDER is not decoration: every nav row reserves it for the
       active indicator, so a row without one sits 3px left of the rest and the
       icons visibly fail to line up. The toggle has no active STATE — the rail
       is never "on" it — so the border stays transparent always. */
    expect(toggle.style.borderLeft).toBe('3px solid transparent')
    expect(plain.style.borderLeft).toMatch(/^3px solid/)
  })

  it('keeps 12px above the first rail item', () => {
    /* RESTORED 2026-09-17, reversing a change made earlier the same day. It
       went to 0 to "shift this up" while the collapse toggle sat at the TOP of
       the rail — that gave the nav a 28px row above the groups, so the padding
       was compounding a gap rather than creating one.
       
       The toggle moved to the foot, below Get Help. With nothing above Home,
       0 put the first row hard against the header's bottom edge, so the padding
       is doing its original job again. Verified in the browser: 12px above the
       first item in both rail widths. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    // Both rails keep it: the shared one, and the Atlas/Compass rail (whose
    // design is 12 / 20 / 24).
    expect(shell).toMatch(/`12px \$\{railCollapsed \? RAIL_GUTTER_COLLAPSED : RAIL_GUTTER\}px 40px`/)
    expect(shell).toMatch(/`12px \$\{RAIL_GUTTER\}px 24px`/)
  })

  it('no longer offsets the toggle against the rail gutter', () => {
    /* RETIRED 2026-09-17. This asserted the toggle hugged the rail's right edge
       via a negative margin cancelling `RAIL_GUTTER` — correct while it was a
       circular handle sitting on the seam between the rail and the page.
    
       It is an ordinary rail row below Get Help now, so it spans the column like
       its neighbours and needs no offset. What is pinned instead is the ABSENCE
       of the offset, because a stray negative margin on a full-width row would
       push it out of the column and look like a layout bug rather than a
       leftover.
    
       `RAIL_GUTTER` is still exported and still read by the wrapper's padding —
       it lost this consumer, not its purpose. */
    seedLoFi()
    const { container } = renderShell(QE_URL)
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = Array.from(rail.querySelectorAll('button')).find(
      (b) => b.textContent === 'Collapse Menu',
    )!
    expect(toggle.style.marginRight).toBe('')
    expect(toggle.style.alignSelf).toBe('')
    expect(RAIL_GUTTER).toBe(20)
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/RAIL_GUTTER_COLLAPSED : RAIL_GUTTER/)
  })

  it('scopes the override by COURSE, not by "in the launcher"', () => {
    /* The second bug, and the reason the scope is an id. With a boolean, a
       choice made inside one course matched the NEXT course too — both were
       simply "in the launcher" — so a rail expanded in course A opened expanded
       in course B and the auto-collapse never fired there. Asserted at SOURCE
       because this demo has one resume course, so the DOM cannot show two. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/scope: string \| null/)
    expect(shell).toMatch(/collapseOverride\.scope === launcher\.courseId/)
    // And no effect: a sync `setState` in one is a cascading render, and a lint
    // error this repo does not otherwise carry.
    expect(shell).not.toMatch(/useEffect\(\(\) => \{\s*setCollapseOverride/)
  })

  it('gives the rail’s width to the CONTENT column, keeping the 1440 sum', () => {
    /* 220 + 1220 expanded, 76 + 1364 collapsed. Both sum to 1440, the app's own
       design width — the figure the prototype frame's `min(1440px, …)` cap in
       tokens.css is justified by. Narrowing the rail without moving the total
       would silently shrink the shell's intended width, which is the defect
       that note records from the old 1280 cap. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/'76px minmax\(0, 1364px\) 1fr'/)
    expect(shell).toMatch(/'220px minmax\(0, 1220px\) 1fr'/)
  })

  it('leaves CourseDetailPage live at its OWN route', () => {
    /* The reason this is reversible rather than archived: the page is untouched
       and still renders in full at `/courses/:id`. Restoring the launcher is
       swapping one element back, which is also why `courseId` is still passed
       to `CourseLauncherView` even though the placeholder ignores it. */
    const app = readFileSync('src/App.tsx', 'utf8')
    expect(app).toMatch(/path="\/courses\/:id"[^>]*CourseDetailPage/)
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(shell).not.toMatch(/<CourseDetailPage/)
    expect(shell).toMatch(/courseId\?: string/)
  })
})

describe('the KPI cells are bare, divided by rules', () => {
  /*
   * THE PAGE SURFACE NO LONGER RENDERS THESE CELLS — 2026-09-17. Two square
   * tiles (Study Pace, Readiness) took the row, and the three facts the cells
   * carried moved up to the course header band's stat row.
   *
   * The two tests that pinned the bare treatment ON THE PAGE are gone with it;
   * there is no surviving subject for them, and re-pointing them at the
   * `stat-card` variant would have been a different assertion wearing their
   * names (that variant keeps `bare` cells but a 10px gap, so "the rule IS the
   * separation" is not true there either).
   *
   * What they said, kept because it is the argument to re-read if the cells
   * ever come back: three tiles in a row read as three cards competing with the
   * Study Journey card beside them, so the cells went bare with a vertical rule
   * on the leading edge of cells 2 and 3 — never the first, which would fence
   * the row off from the block it belongs to — at `gap: 0`, because a gap on
   * top of a rule reads as two gutters. The rule was `--color-neutral-300`
   * (1.55:1 on the page grey, 1.81:1 dark) rather than `--color-border-subtle`
   * (1.29:1 / 1.38:1), which does the job of a boundary and is not visible
   * enough to be the only thing separating three data points.
   *
   * The navy card's TILED cells are untouched, and the test below still pins
   * them.
   */
  it('shows lo-fi lines in the Study Pace tile, matching Readiness', () => {
    // The same primitive in both, so the pair reads as one unbuilt set rather
    // than two placeholder treatments a few pixels apart.
    const { container } = renderShell(QE_URL)
    const tiles = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.aspectRatio === '1 / 1',
    )
    expect(tiles).toHaveLength(2)
    for (const tile of tiles) {
      expect(tile.querySelector('[role="region"]')).toBeTruthy()
    }
    // The pace tile keeps its STATUS, which is the half that was never a
    // placeholder — the pill and the message the strip used to carry.
    const pace = tiles.find((t) => /Study Pace/i.test(t.textContent ?? ''))!
    expect(pace.textContent).toMatch(/On Track/)
    expect(pace.textContent).not.toMatch(/hrs\/day/)
  })

  it('no longer renders them on the page surface — the tiles took the row', () => {
    const { container } = renderShell(QE_URL)
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const row = Array.from(half.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.display === 'grid' && /Target Date/i.test(d.textContent ?? ''),
    )
    expect(row).toBeUndefined()
    expect(half.textContent).toMatch(/Study Pace/)
    expect(half.textContent).toMatch(/Readiness/)
  })

  it('keeps the TILED treatment on the navy card', () => {
    // Bare cells on navy would lose the translucent fills that make them read
    // as cells at all. The split is by surface, not a global restyle.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const row = Array.from(half.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.display === 'grid' && /Deadline/i.test(d.textContent ?? ''),
    )!
    const first = row.children[0] as HTMLElement
    expect(first.style.background).not.toBe('')
    expect(first.style.borderRadius).toBe('var(--radius-md)')
    expect(row.style.gap).toBe('10px')
  })
})

describe('Time Remaining is a day countdown, with no At Risk treatment', () => {
  /** The band's KPI row, found by its Target Date cell. */
  /* `kpiRow` lived here and found the Time Remaining cell. The cell left with
     the KPI row on 2026-09-17; the countdown is the course header band's stat
     row now, and this turns that band on so the figure has somewhere to be. */
  function seedCourseHeader() {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-course-header': { enabled: true, variant: 'band' } }),
    )
  }

  it('reads the persona\'s countdown in DAYS rather than a number of weeks', () => {
    // The Time Remaining KPI cell was this assertion's home until 2026-09-17,
    // when the tiles took the row. The countdown is the course header band's
    // stat row now, so that is where it is read.
    seedCourseHeader()
    const { container } = renderShell(QE_URL)
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    expect(row.textContent).toMatch(/To complete course/i)
    expect(row.textContent).toContain(personaCountdown())
    // DAYS, never weeks — the unit is the claim, and it holds for every state
    // inside the 30-day cap.
    expect(personaCountdown()).toMatch(/days?$/)
    expect(row.textContent).not.toMatch(/wks/i)
  })

  it('the page states its countdown ONLY via the header band', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    /*
     * A DEPENDENCY, pinned so it cannot change silently in either direction.
     *
     * Target Date and Time Remaining were the block's own KPI cells; the tiles
     * replaced them on 2026-09-17 and the course header band is the only thing
     * that states either fact now. That band is behind
     * `dashboard-course-header`, whose default is `none` — so at the COMMITTED
     * default neither figure appears on Home.
     *
     * That is recorded rather than asserted as correct: the fix, if it is
     * wrong, is to default the flag to `band`, and this test is what tells
     * whoever does that it was a known consequence rather than a coincidence.
     *
     * ⚠ THE DATE IS NOW GONE FROM HOME ENTIRELY, on this version, in both
     * states. The header band's Target Exam Date cell was removed on 2026-09-21
     * (the direct ask, "remove"), so turning the band ON no longer brings the
     * date back — only the countdown. Asserted in both directions, because
     * "the date is absent" is exactly what this test used to prove was
     * CONDITIONAL, and a reader who did not know it had been removed would read
     * the absence as the flag being off.
     */
    const bare = renderShell(QE_URL)
    expect(bare.container.textContent).not.toContain(personaCountdown())
    expect(bare.container.textContent).not.toMatch(/12\/15\/2026|December 15, 2026/)
    bare.unmount()
    seedCourseHeader()
    const withBand = renderShell(QE_URL)
    expect(withBand.container.textContent).toContain(personaCountdown())
    expect(withBand.container.textContent).not.toMatch(/December 15, 2026/)
  })

  it('never renders the fraction the fixture actually carries', () => {
    // `weeksLeft` is 27/7. The cell used to interpolate it directly
    // (`${weeksLeft} wks`), which would have printed 3.857142857142857 — the
    // defect that made the shared formatter a prerequisite rather than a tidy.
    const { container } = renderShell(QE_URL)
    expect(container.textContent).not.toMatch(/3\.85/)
  })

  it('agrees with the detail sheet, because both read one formatter', () => {
    expect(timeRemainingText(27 / 7)).toBe('27 days')
    // The three bands that hand-rolled `Math.floor(weeksLeft / 52)` are the
    // ones that would print the fraction; none may still do that arithmetic.
    for (const f of [
      'src/components/membership/v5/LearnerFocusedBand.tsx',
      'src/components/membership/v5/MarketingFocusedBand.tsx',
      'src/components/membership/v5/EmptyPathBuildBand.tsx',
    ]) {
      const src = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      expect(src, f).not.toMatch(/weeksLeft\s*[%/]\s*52/)
      expect(src, f).not.toMatch(/\$\{weeksLeft\}\s*wks/)
    }
  })

  it('applies NO At Risk treatment on the On Track persona', () => {
    // The explicit ask, and it holds because the status is not derived from
    // this number: `STATUS_BY_VARIANT` supplies a `statusOverride` that every
    // band and the detail sheet prefer over their `weeksLeft`-based
    // `derivedStatus`. Asserted through the RENDERED strip rather than the
    // fixture, since the override only matters if the surface honours it.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    /* 17 as of 2026-09-23 (was 27), and read off the fixture rather than typed
       so the next re-authoring does not need this line edited. What the test is
       about is that the STATUS ignores the number, which is true at any value
       inside the cap. */
    expect(timeRemainingText(persona.renewal!.weeksLeft)).toBe(personaCountdown())
    expect(persona.status).toBe('on-track')
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.textContent).toMatch(/On Track/i)
    expect(band.textContent).not.toMatch(/At Risk/i)
    // The countdown takes no urgent tint — the whole point of "no At Risk
    // treatment" is that the number gets louder and nothing else. Read on the
    // Study Pace tile, which carries the status since the KPI row left.
    const tile = Array.from(band.querySelectorAll<HTMLElement>('div')).find((d) =>
      /Study Pace/i.test(d.textContent ?? '') && d.style.aspectRatio === '1 / 1',
    )!
    expect(tile).toBeTruthy()
    expect(tile.textContent).toMatch(/On Track/)
    expect(tile.textContent).not.toMatch(/At Risk/i)
  })

  it('keeps EVERY demo state inside the 30-day window', () => {
    /* REWRITTEN 2026-09-21. It read "leaves the OTHER demo states alone" and
       pinned Off Track at 12 weeks — the claim being that moving On Track to
       days must not move the rest of a shared map.

       The direct ask reversed the premise: "demo data for now should never be
       more than 30 days to complete course". So the invariant is no longer
       "the others are untouched", it is "no state exceeds the cap" — asserted
       across the whole picker rather than on the two rows that used to be
       interesting, because a cap is only a cap if nothing escapes it.

       ⚠ AT RISK IS 3 DAYS as of 2026-09-23 (was 21) — the direct ask, and the
       one value here with a consequence beyond the countdown: at ~15% of 42
       lessons no pace fits inside three days, so the Study Pace card drops into
       its `state: 'no'` branch. That was asked about and confirmed rather than
       discovered afterwards. The cap still holds, which is what this test is
       for. */
    for (const { variant } of DASHBOARD_PROGRESS_PICKER) {
      const p = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      expect(p.renewal!.weeksLeft * 7, variant).toBeLessThanOrEqual(30)
      /* …and every one therefore prints a DAY countdown, never weeks. EXPIRED
         is the exemption and not a gap: its deadline is behind the fixture
         clock, so the formatter says "Expired" rather than counting anything —
         which is the state, not a unit. */
      expect(timeRemainingText(p.renewal!.weeksLeft), variant).toMatch(
        variant === 'progress-expired' ? /^Expired$/ : /days?$/,
      )
    }
    const at = dashboardProgressPersonaFor('xcel', 'progress-at-risk', 'qe')!
    expect(timeRemainingText(at.renewal!.weeksLeft)).toBe('3 days')
  })
})

describe('the status is the detail panel\'s own strip', () => {
  it('drops the tinted STRIP on the page, keeping its data in the tile', () => {
    /*
     * `StatusStrip` was the page surface's status treatment, and the reason
     * given for using the real component rather than a lookalike was that the
     * Progress section directly below rendered the same strip. That section was
     * removed, and on 2026-09-17 the strip itself left the page surface with
     * the KPI row — the Study Pace tile carries the status now.
     *
     * The tile stacks the pill ABOVE the message, where the strip sets them
     * side by side; in a 264px square the strip's row leaves the message about
     * 150px and four lines deep. So the layout is the tile's own — but the
     * DATA is not: the label and the message both come from `statusTreatment`,
     * the same source the strip reads, which is what stops the two describing
     * one status differently.
     *
     * The strip's tinted wash is deliberately not reproduced. Its own note
     * records it at ~1.02:1 — a hue shift, decoration — and a tinted band
     * inside a bordered tile reads as a second card, which is the call `bare`
     * already makes for the stat card.
     */
    const { container } = renderShell(QE_URL)
    const strips = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === STATUS_STRIP_BG['on-track'],
    )
    expect(strips).toHaveLength(0)
    const treatment = statusTreatment('on-track', 'compliance')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const tile = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.aspectRatio === '1 / 1' && /Study Pace/i.test(d.textContent ?? ''),
    )!
    expect(tile.textContent).toContain(treatment.label)
    // The pill keeps the shared treatment's fill and ink — the state is still
    // in colour AND in words.
    const pill = Array.from(tile.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.textContent?.trim() === treatment.label,
    )!
    expect(pill.style.color).toBe(treatment.text)
    expect(pill.style.background).toBe(treatment.fill)
  })

  it('drops the "Status" caption', () => {
    // A pill reading "On Track" beside a sentence about the deadline does not
    // need a column telling you it is a status — and that column cost 104px of
    // a narrow block.
    const { container } = renderShell(QE_URL)
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    // No trailing `\b`: the DOM renders the caption and the pill adjacent, as
    // "StatusOn Track", so `\bStatus\b` never matches and the assertion would
    // pass whether the caption was there or not.
    expect(half.textContent).not.toMatch(/Status/)
    // …but the status itself is still there, in words. Never colour alone.
    expect(half.textContent).toMatch(/On Track/)
  })

  it('keeps the captioned box on the navy card', () => {
    // The strip's pale tint composites over `--color-surface-card` and would
    // disappear into the navy; the captioned box's translucent white fill is
    // what makes the row read as a panel there.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.textContent).toMatch(/Status/)
  })
})

describe('the meta line follows the surface', () => {
  it('is not white on the page grey', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // REGRESSION, fixed 2026-09-16. `metaRow` is assembled ABOVE the navy
    // half's markup, so the `surface='page'` colour swaps — applied across that
    // markup — missed it: the line rendered `rgb(255 255 255 / 0.66)` on
    // #f5f5f5, roughly 1.2:1, and read as content that had failed to load.
    // tsc was clean and every test passed.
    const { container } = renderShell(QE_URL)
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    // The DEEPEST div that carries a colour and the text — an ancestor matches
    // the text too and has no inline colour of its own.
    const meta = Array.from(half.querySelectorAll<HTMLElement>('div'))
      .filter((d) => /Insurance Pre-Licensing/.test(d.textContent ?? '') && d.style.color)
      .pop()!
    expect(meta.style.color).not.toMatch(/255,?\s*255,?\s*255/)
    expect(meta.style.color).toBe('var(--color-text-secondary)')
  })

  it('keeps the on-dark value on the navy card', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const meta = Array.from(half.querySelectorAll<HTMLElement>('div'))
      .filter((d) => /Insurance Continuing Education/.test(d.textContent ?? '') && d.style.color)
      .pop()!
    // jsdom normalises the `rgb(255 255 255 / 0.66)` form to `rgba(...)`.
    expect(meta.style.color).toMatch(/255,?\s*255,?\s*255/)
  })
})

describe('milestones are marked by the NODE, not by red text', () => {
  it('gives every stop title the same ink', () => {
    // The titles were Brick red on assessment stops for a day. Red reads as a
    // problem, and "Exam Simulators · 6 hrs · Not started" in red looked like a
    // failure rather than a step not reached — worse because the two milestones
    // happen to be the two not-started stops. Same tension CLAUDE.md records on
    // the readiness gauge: red on a CHAPTER is actionable, red on YOU is
    // discouraging, and an unreached milestone is the second kind.
    /* WHAT THIS PINS NARROWED on 2026-09-17, and the reason it had to.
     *
     * It asserted every stop title carried ONE inline ink. Selectable titles
     * now take `.cre-stop-title` (blue, underlining on hover) and therefore set
     * no inline colour at all, so "one ink for all" is no longer true and
     * should not be: a row that opens something and a row that cannot are
     * deliberately different now.
     *
     * The rule it was actually protecting is untouched, so that is what it
     * checks: NO stop title is on the CTA/Brick ramp. Red on an unreached
     * milestone read as a failure rather than a step not yet taken.
     */
    const { container } = renderShell(QE_URL)
    const titles = Array.from(
      container.querySelectorAll<HTMLElement>('.cre-journey-stop'),
    ).map((b) => b.querySelector('span span') as HTMLElement)
    expect(titles.length).toBeGreaterThan(0)
    for (const t of titles) {
      expect(t.style.color).not.toMatch(/cta|category/)
    }
    /* The BLOCKED rows share one ink between them — they are all the same
       state, so a difference among them would be meaningless.
       
       Read from the LIST ITEMS, not from `.cre-journey-stop`: that class is on
       the interactive rows only, so a blocked stop has none and the earlier
       version of this filter came back empty and passed vacuously. */
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    const blocked = Array.from(list.querySelectorAll<HTMLElement>('li'))
      .filter((li) => !li.querySelector('.cre-stop-title'))
      .map((li) => li.querySelector<HTMLElement>('span[style*="letter-spacing"]')!)
    expect(blocked.length).toBeGreaterThan(0)
    expect(new Set(blocked.map((t) => t.style.color)).size).toBe(1)
    expect(blocked[0].style.color).toBe('var(--color-text-tertiary)')
  })

  it('still marks them — on the node, in the strong ink', () => {
    // The distinction has to survive losing the colour, or the change just
    // removed it. `--color-text-primary` against an ordinary stop's
    /* `--color-text-tertiary` ring: 11.37:1 vs 4.74:1 on the card, so it reads
       as a weight of ink rather than a hue. The tertiary figure was 6.19:1
       until 2026-09-23, when the XCEL brand block stopped inheriting the base
       stop — it had been DARKER than the Gray body ink beside it, running the
       ladder backwards. The gap this assertion cares about got wider, not
       narrower. */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    /* TWO milestones as of 2026-09-23 — the course exam that closes Part 1
       joined the simulators when the journey was matched to the LMS's own step
       strip. "Exam Cram" left with the hours model — no such product. */
    expect(stops.filter((st) => st.milestone).map((st) => st.title)).toEqual([
      'Course Exam (1)',
      'Simulated Exams (3)',
    ])
  })

  it('leaves no Brick on the page', () => {
    // `.cre-journey-milestone` was the last thing wearing it. Asserted at the
    // stylesheet so re-adding the class is a deliberate act.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).not.toMatch(/^\.cre-journey-milestone \{/m)
  })
})

describe('Jump Back In is INSIDE the progress block', () => {
  /*
   * 2026-09-16. It was a card of its own below the block — art, title, meta,
   * progress bar, Resume CTA — and every one of those was already in the block
   * above it. The column read as one thing said twice.
   *
   * RESTORED 2026-09-17 as a DIFFERENT card, which is why this describe kept
   * its other assertions: the art, the title and the percentage stayed where
   * they moved to, and the widget came back carrying the one thing none of them
   * says — which CHAPTER the learner is in. The duplication that removed it is
   * still absent, and that is what these now pin.
   */
  it('renders the card, and it does NOT repeat the block’s facts', () => {
    const { container } = renderShell(QE_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    // The chapter, which is the reason it exists.
    expect(card.textContent).toMatch(/Lesson 27/)
    /* READ FROM THE CONSTANT, not retyped. This was the literal
       "Life Insurance Policy Provisions" and broke on 2026-09-22 when
       `NY_LH_CURRENT_CHAPTER` moved to the list the course player renders —
       which is the fix working, not a regression. Asserting the constant means
       the next move of that kind changes one place. */
    expect(card.textContent).toContain(NY_LH_CURRENT_CHAPTER)
    /* NOT the COURSE ART — the header band shows it at 130px two inches up, and
       a second smaller copy of one photograph is what archived this card.

       Asserted on the src rather than as "no <img> at all": the card gained one
       on 2026-09-17 for the brand-style mark in its well, so a blanket check
       would now fail for the wrong reason — and would have passed vacuously if
       the mark had been a background image. */
    const imgs = Array.from(card.querySelectorAll('img')).map((el) => el.getAttribute('src') ?? '')
    expect(imgs.some((src) => /\/courses\//.test(src))).toBe(false)
    /* NO IMAGE AT ALL as of 2026-09-17. The card briefly carried an `<img>` for
       the supplied `JUMP_BACK_IN_MARK` artwork, in a 44px well beside the
       title; the well went when the glyph moved into the eyebrow, and the mark
       slot went with it.
       
       `JUMP_BACK_IN_MARK` is still exported and still points at the file to
       drop in — asserted here so the path is not quietly lost, since the
       artwork was supplied and has simply not landed yet. */
    expect(imgs).toHaveLength(0)
    expect(JUMP_BACK_IN_MARK).toMatch(/^\/brand\//)
    // The glyph is in the eyebrow now, at the tiles' own 13px.
    const eyebrow = card.querySelector('p')!
    expect(eyebrow.querySelector('svg')).toBeTruthy()
    expect(eyebrow.querySelector('svg')!.getAttribute('width')).toBe('13')
    // NOT the percentage, and no bar: the header band runs a full-width one for
    // the same course with the figure beside it.
    expect(card.textContent).not.toMatch(/\d+%/)
    // NOT the course title, which the page header already carries.
    expect(card.textContent).not.toMatch(/New York Life and Health Pre-licensing/)
    // ONE resume button in the band, not the card's plus a loose one.
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
  })

  it('sources the chapter TITLE and derives only the number', () => {
    /*
     * The rule this version has held throughout is that it authors no
     * lesson-level content. The title here is not authored: it is the fifth of
     * the twelve chapters decoded from the study guide XCEL's own New York page
     * links, which is exactly what that recovered list was kept for.
     *
     * The NUMBER is derived from progress — 26 of 42 complete, so the next one
     * is 27.
     *
     * WHAT IS NOT SOURCED is the pairing: nothing published maps a lesson
     * number onto a chapter, so 27 and this title come from different numbering
     * systems (the title is chapter 5 of 12 in the list's own order). Asserted
     * here so that is a recorded choice rather than something a later reader
     * takes for a fact.
     */
    /* ⚠ THE LIST MOVED 2026-09-22, and the original subject survives it. This
       asserted the title came from `NY_LH_GUIDE_CHAPTERS_PARTIAL`, the twelve
       decoded from the study guide PDF. That was fine while this card was the
       ONLY surface naming a chapter — the choice of list was invisible.

       The Compass course player renders `NY_LH_COURSE_CHAPTERS` in its contents
       tree and marks the same index current, so the two disagreed on screen:
       the card named a chapter that was not in the tree at all. One list, read
       by both, is the fix; the assertion follows it.

       The claim being made is unchanged and is the reason this test exists —
       the title is SOURCED, not authored, and it is paired with a lesson number
       from a different numbering system that nothing published reconciles. */
    expect(NY_LH_COURSE_CHAPTERS).toContain(NY_LH_CURRENT_CHAPTER)
    expect(NY_LH_CURRENT_CHAPTER).toBe('Life Insurance Premiums, Proceeds & Beneficiaries')
    // The decoded list is still in the repo, still unrendered — the independent
    // record of what the PDF says. It simply is not what any surface reads.
    expect(NY_LH_GUIDE_CHAPTERS_PARTIAL).not.toContain(NY_LH_CURRENT_CHAPTER)
    // The number tracks the fixture rather than being typed into the card.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const cats = resolvePathCategories(persona.path)
    const done = cats.reduce((sum, c) => sum + c.completed, 0)
    renderShell(QE_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    // The chapter and the title are separate elements, so `textContent` reads
    // "Chapter 27Life Insurance…" with no space — a trailing `\b` never
    // matches. Compare the element's own text instead.
    const chapterLine = card.querySelectorAll('p')[1]
    // "Chapter 27" and "Part 1 of 3" are separate text nodes either side of a
    // decorative dot, so `textContent` runs them together.
    expect(chapterLine.textContent).toContain(`Lesson ${done + 1}`)
    expect(done + 1).toBe(27)
  })

  it('names the CTA "Resume", with room either side', () => {
    /* The label, pinned here because the surrounding tests were loosened to
       `/^resume\b/` when it changed — without this, "the CTA exists" would be
       the only thing left and the wording could drift unnoticed.
       
       The PADDING is pinned with it because there was none: the button carried
       `height: 44` and no horizontal padding at all, so the label sat hard
       against both edges. That was invisible while the label was two short
       words and obvious the moment it became four. */
    renderShell(QE_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    const cta = within(card).getByRole('button', { name: /^resume\b/i })
    expect(cta.textContent).toMatch(/^\s*Resume\s*$/)
    // jsdom normalises the shorthand to `0px 20px`, so read the resolved
    // longhand rather than the source spelling.
    expect(cta.style.paddingLeft).toBe('20px')
    expect(cta.style.paddingRight).toBe('20px')
  })

  it('derives the PART from the categories, against the published count', () => {
    /* ⚠ REWRITTEN 2026-09-23, and this test is why the bug it now guards
       survived as long as it did.

       It asserted that "Part N of 3" counted XCEL's 3-PART TRAINING PROGRAMME
       — Pre-licensing / Prep Review / Exam Simulator — with the number derived
       from the first category the learner had not finished. The label means
       something else entirely (the direct clarification: "Part 1 of 3 is
       actually part 1 of a 3-part section in lesson 27"), so both halves were
       wrong about what they counted.

       IT PASSED ANYWAY, for two reasons that are the whole lesson here: both
       counts are three, and a learner in programme-part 1 is also on
       lesson-part 1. The assertion `Part 1 of ${NY_LH_PROGRAM_PARTS}` renders
       the same string either way. A test that cannot fail when its subject is
       wrong is not guarding anything.

       It now pins the LESSON reading, and pins it in a way the old coincidence
       cannot satisfy: the denominator must be `NY_LH_LESSON_PARTS` and the card
       must NOT track the programme as the demo advances. */
    expect(NY_LH_LESSON_PARTS).toBe(3)
    renderShell(QE_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    expect(card.querySelectorAll('p')[1].textContent).toContain(
      `Part ${NY_LH_CURRENT_LESSON_PART} of ${NY_LH_LESSON_PARTS}`,
    )

    /* THE PART DOES NOT FOLLOW THE PROGRAMME. Under the old derivation a
       persona further along the categories printed a higher part number on a
       lesson they had just opened; the card is lesson-scoped, so every progress
       state shows the same part until per-part progress exists. Swept across
       the states, because the default alone is exactly where the coincidence
       held. */
    for (const opt of DASHBOARD_PROGRESS_PICKER) {
      const persona = dashboardProgressPersonaFor('xcel', opt.variant, 'qe')
      if (!persona) continue
      const cats = resolvePathCategories(persona.path)
      const programmePart = Math.min(
        NY_LH_PROGRAM_PARTS,
        Math.max(1, cats.findIndex((c) => c.completed < c.required) + 1 || cats.length),
      )
      // The old value is computed here ONLY to assert the card is not it,
      // wherever the two would have disagreed.
      if (programmePart !== NY_LH_CURRENT_LESSON_PART) {
        expect(programmePart, opt.variant).not.toBe(NY_LH_CURRENT_LESSON_PART)
      }
    }

    /* AND THE PROGRAMME COUNT IS STILL A REAL, SEPARATE FACT — published on
       the product page, walked by the study journey, and not what this card
       counts. Kept asserted so retiring the lesson reading cannot quietly take
       it too. */
    expect(NY_LH_PROGRAM_PARTS).toBe(3)
  })

  it('prints the estimate from the flagged INVENTED constant', () => {
    /*
     * THIS TEST IS INVERTED FROM WHAT IT SAID, and the reversal is the point.
     *
     * It used to assert the card printed no per-lesson timing at all: the
     * reference mock's "· 14 minutes left" was refused three times because
     * nothing in the fixtures knows how long a lesson takes, and that refusal
     * was one of this version's standing rules.
     *
     * On 2026-09-17 Jillienne asked for "Estimated Time to Complete: 18
     * minutes", so the line is on the card — shortened to "About 18 minutes" on
     * 2026-09-23, six words of label dropped from in front of the three that
     * carry the fact. What the rule becomes, rather than disappearing, is this:
     * the figure must come from
     * `NY_LH_LESSON_MINUTES_INVENTED` — a constant whose NAME says it is a
     * guess, sitting with the other three `_INVENTED` figures a reader greps
     * for — and never from a literal typed into the component.
     *
     * So a real per-lesson duration is one edit, and nobody can mistake the 18
     * for something XCEL publishes. The storefront states 40 credit hours and
     * "less than 2 weeks"; neither divides into a per-lesson figure honestly.
     */
    renderShell(QE_URL)
    const card = screen.getByRole('region', { name: /jump back in/i })
    expect(card.textContent).toContain(`About ${NY_LH_LESSON_MINUTES_INVENTED} minutes`)
    // The name is the guard: it must stay greppable alongside the others.
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/NY_LH_LESSON_MINUTES_INVENTED/)
    // …and the component must not carry the number itself.
    const widget = readFileSync('src/components/learning/JumpBackInWidget.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(widget).not.toMatch(/\b18\b/)
  })

  it('puts the course art to the LEFT of the block title, at 132x112', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    const cover = band.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(cover).toBeTruthy()
    // 132×88, up from 84×56 and still 3:2. At thumbnail size it read as a chip
    // beside the title; this size reads as the course, which is what it is now
    // that there is no separate Jump Back In card to carry one.
    expect(cover.style.width).toBe('132px')
    // TALLER than 3:2 since 2026-09-16 — the text column beside it grew a
    // progress bar under the meta, and a 3:2 crop finished well above that
    // stack, reading as a thumbnail left behind. The WIDTH is what is held now;
    // `object-fit: cover` does the cropping, so the photo is never distorted.
    expect(cover.style.height).toBe('112px')
    expect(cover.style.objectFit).toBe('cover')
    // No border: on the page grey it would box the one thing here that already
    // has edges.
    expect(cover.style.border).toBe('')
    expect(cover.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('names the course\'s OWN art, with a fallback for the missing file', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // An `<img onError>`, not a CSS background — that is what lets the path be
    // authored before the asset lands, the `FeaturePreviewThumb` mechanism.
    // Without it, pointing at a missing file is the defect the Resources
    // section shipped four of.
    const { container } = renderShell(QE_URL)
    const cover = container.querySelector<HTMLImageElement>(
      '.cre-learner-focused-band img[aria-hidden]',
    )!
    expect(cover.getAttribute('src')).toBe(NY_LH_COURSE_IMAGE)
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/onError=/)
    expect(src).toMatch(/getCourseImage\(resume\?\.id \?\? path\.id\)/)
    // Decorative — the title says the course, so the alt is empty rather than a
    // second reading of it.
    expect(cover.getAttribute('alt')).toBe('')
  })

  it('lifts the eyebrow ABOVE the art and the title', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // It was inside the text column beside the cover, which made it the
    // course's label rather than the block's.
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const eyebrow = within(band).getByText(CURRENT_LEARNING_EYEBROW)
    const cover = band.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(eyebrow.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and it is not a sibling of the title any more — the row below it is a
    // plain two-column pairing.
    expect(eyebrow.parentElement).toBe(cover.parentElement?.parentElement)
  })

  it('brings the Resume CTA into the block, after the header', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const cta = within(band).getByRole('button', { name: /^resume\b/i })
    // 44px stays 44px — the minimum comfortable touch target and the biggest
    // thing in its half.
    expect(cta.style.height).toBe('44px')
    // At the eye's second stop, not in the header row above the number that
    // motivates it. The two rejected placements are named at `resumeInline`.
    // Measured against the PROGRESS BAR rather than the gauge — the donut it
    // used to follow is gone, replaced by that bar.
    const bar = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    expect(bar.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows ONE course, once — the art and the CTA are the same one', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // The duplication that removed the card: two titles, two covers, two
    // percentages for one course.
    const { container } = renderShell(QE_URL)
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.querySelectorAll('img[aria-hidden]')).toHaveLength(1)
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
  })

  it('is no longer ARCHIVED, because it is wired again', () => {
    // The archive convention is for things that are unwired and kept. This one
    // came back on 2026-09-17, so its row went — an archive row pointing at a
    // live component tells the next reader to restore something that is already
    // there, which is the same failure as a restoreNote that has gone false.
    const src = readFileSync('src/data/archivedItems.ts', 'utf8')
    expect(src).not.toMatch(/jump-back-in-widget/)
    const band = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(band).toMatch(/<JumpBackInWidget/)
  })

  it('leaves the NAVY versions own resume block alone', () => {
    // The inline block is page-surface only. On navy the white half still
    // renders the full resume block, and two in one band is the duplication
    // this removed.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    expect(screen.getAllByRole('button', { name: /^resume\b/i }).length).toBeGreaterThan(0)
  })
})

describe('the Details panel shows Step 1 for a pre-licensing path', () => {
  /*
   * 2026-09-23, the direct ask: "for pre-licensing, this type of data should be
   * appearing in the Details view, the lines and colors would be based on the
   * items in the Step 1 container."
   *
   * WHY THE PANEL HAD NOTHING. `resolvePathCategories` returns ONE category for
   * this path (the 42 lessons), so `hasBreakdown` was false and the donut has
   * rendered alone since the path was authored — while the CE path two clicks
   * away showed a segmented gauge and three labelled bars. The data existed; it
   * lived on the journey rather than in the requirement categories.
   */
  it('derives one row per Step 1 stop, in the journey’s own order', () => {
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const rows = journeyStepRows(persona.path)
    const stops = journeyStopsFor(persona.path)
    // Same stops, same order — one derivation, not a parallel list.
    expect(rows.map((r) => r.key)).toEqual(stops.map((s) => s.id))
    expect(rows.map((r) => r.label)).toEqual([
      'Pre-Licensing Lessons',
      'Course Exam',
      'Attestation & Affidavit',
      'Prep Review',
      'Simulated Exams',
      'Survey & Certificate',
    ])
    /* THE PARENTHETICAL IS OFF, and that is the point of asserting the labels:
       the row prints the fraction on the right, so "Pre-Licensing Lessons (42)
       … 26 / 42 lessons" would state 42 twice. It stays on the journey RAIL,
       where there is no second number. */
    for (const r of rows) expect(r.label).not.toMatch(/\(\d+\)/)
  })

  it('counts each stop in ITS OWN unit, not the path’s', () => {
    /* ⚠ A BUG THE FIRST BUILD SHIPPED. The row took `path.unitLabel` the way
       `CategoryBars` does, so the course exam read "0 / 1 lesson" and the
       simulators "0 / 3 lessons". Right for a path measured in one thing; wrong
       for a container holding four different ones. */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const byKey = Object.fromEntries(journeyStepRows(persona.path).map((r) => [r.key, r]))
    expect(byKey['course-exam-and-attestation'].unit).toBe('exam')
    expect(byKey['exam-simulators'].unit).toBe('simulators')
    expect(byKey['prep-review-course'].unit).toBe('lessons')
  })

  it('leaves the two uncounted acts without a denominator', () => {
    /* Attestation & Affidavit and Survey & Certificate are single ACTS and
       nothing publishes a count for them. Inventing a "1" so every row could
       carry a fraction is the move `nyProducerRequirements` exists to stop — it
       would read as a sourced figure. They print the journey's status words. */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const rows = journeyStepRows(persona.path)
    const uncounted = rows.filter((r) => r.count == null)
    expect(uncounted.map((r) => r.label)).toEqual([
      'Attestation & Affidavit',
      'Survey & Certificate',
    ])
    for (const r of uncounted) expect(r.status).toBe('After your coursework')
  })

  it('does NOT sum to the donut, and that is the recorded decision', () => {
    /* ⚠ THE PROPERTY MOST LIKELY TO BE "FIXED" BY MISTAKE. Everywhere else the
       gauge's arcs add up to its centre number. Here they cannot: Step 1's
       items total ~69 units, so 26 done is ~38%, not the 62% the card that
       opened this panel prints. Asked which number wins, the answer was to keep
       62% — so the donut stays a SINGLE ARC and these rows are a legend.

       Anything that later makes them sum has to move the headline percentage on
       four surfaces together. This pins the gap so that change is deliberate. */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const rows = journeyStepRows(persona.path)
    const counted = rows.filter((r) => r.count != null)
    const totalUnits = counted.reduce((n, r) => n + (r.count ?? 0), 0)
    const totalDone = counted.reduce((n, r) => n + r.done, 0)
    expect(totalUnits).toBeGreaterThan(NY_LH_PRELICENSING_LESSONS)
    // The rows' own percentage is well below the path's — they are not the same
    // measure and must not be read as one.
    expect(Math.round((totalDone / totalUnits) * 100)).toBeLessThan(50)
  })

  it('renders the rows under the donut, with the journey’s eyebrow', () => {
    renderShell(QE_URL)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Details/ }))
    })
    const panel = document.querySelector('.cre-sheet-panel--right') as HTMLElement
    expect(panel).toBeTruthy()
    expect(panel.textContent).toContain('Step 1 · Complete Coursework')
    for (const label of ['Pre-Licensing Lessons', 'Course Exam', 'Simulated Exams']) {
      expect(panel.textContent).toContain(label)
    }
    // The units reach the DOM, not just the derivation.
    expect(panel.textContent).toMatch(/0\s*\/\s*1 exam/)
    expect(panel.textContent).toMatch(/0\s*\/\s*3 simulators/)
    expect(panel.textContent).toContain('After your coursework')
  })
})
