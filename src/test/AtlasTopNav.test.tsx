import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AtlasTopNav } from '@/components/layout/AtlasTopNav'
import { atlasNavFor } from '@/components/layout/atlasNavVersion'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassLearningPage } from '@/components/learning/CompassLearningPage'

/* The Nav Version control's Top Nav (Figma 160:616, 2026-09-30): Home is
   current on the Home page, My Learning on the course's pages.

   ⚠ EVERY CASE BELOW PINS `version=eric-atlas-v1` — 2026-10-08. Two things
   made that necessary on the same day. The nav now reads the VERSION (Hybrid
   labels its second pill "Course Overview" and sends it to Compass Learning),
   and `hybrid-pacing` became the brand default — so a bare URL, which is what
   these used, stopped describing the nav this file is about. Pinning Eric's
   version keeps the subject fixed; Hybrid's arm has its own block at the end.

   ⚠ AND THE `AccountProvider` IS REQUIRED NOW, for the same reason: resolving
   the default version needs the brand. A bare mount threw
   "useAccount must be used within an AccountProvider" — the mount was
   incomplete rather than the component wrong, since every real mount has one. */
function Search() {
  return <span data-testid="search">{useLocation().search}</span>
}

/* ⚠ THE COMPASS SURFACE IS A FLAG, NOT A VERSION — 2026-10-15. From the 8th
   Anjani's rail and course landing were gated on `isHybridVersion`; when Eric's
   End-to-End Demo became the default (10-14) that gate would have put his
   sidebar on the Compass Prototypes row, which is hers. `compass-surface`
   decides now, `anjani` by default on EVERY version, Eric's included. So the
   cases below that pin "Eric's keeps…" pin the `atlas` ARM, reached the way a
   reviewer reaches it: `?ff=`, which the provider reads off `window.location`
   rather than the router. `afterEach` puts the URL back. */
function atlasArm() {
  window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-surface:atlas')
}
afterEach(() => window.history.replaceState({}, '', '/'))
function renderNav(search: string, expanding = false) {
  const sep = search.startsWith('?') ? '&' : '?'
  const url = `/dashboard-rebrand${search}${sep}version=eric-atlas-v1`
  render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <AtlasTopNav expanding={expanding} />
        <Search />
      </AccountProvider>
    </MemoryRouter>,
  )
}
const current = () =>
  screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.textContent)

describe('Atlas Top Nav', () => {
  it('marks Home current on the Home page', () => {
    renderNav('?demo=1&nav=top-nav')
    expect(current()).toEqual(['Home'])
  })

  it('marks Course Overview (was My Learning) current on the Overview and Course pages', () => {
    renderNav('?section=course&coursePage=overview')
    expect(current()).toEqual(['Course Overview'])
  })

  it('leaves Course Overview in its default state on the Course page (plain Top Nav)', () => {
    renderNav('?section=course&coursePage=course')
    expect(current()).toEqual([])
  })

  it('marks neither on another section', () => {
    renderNav('?section=support')
    expect(current()).toEqual([])
  })

  it('navigates by section only, keeping the demo params', () => {
    renderNav('?demo=1&skin=global&nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Course Overview/ }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=overview')
    expect(search).toContain('skin=global')
    expect(search).toContain('nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(screen.getByTestId('search').textContent).not.toContain('section=')
  })

  it('reads ?nav= validated, defaulting to Top Nav (since 2026-10-01)', () => {
    expect(atlasNavFor(null)).toBe('top-nav')
    expect(atlasNavFor('left-rail')).toBe('left-rail')
    expect(atlasNavFor('top-nav')).toBe('top-nav')
    expect(atlasNavFor('expanding-top-nav')).toBe('expanding-top-nav')
    expect(atlasNavFor('sideways')).toBe('top-nav')
  })
})

/* Expanding Top Nav (Figma 168:916, 2026-10-01): the current button's tray
   holds its links; the other tray is closed and its links unreachable. */
describe('Atlas Expanding Top Nav', () => {
  const linkButtons = () =>
    screen.getAllByRole('button').filter((b) => b.classList.contains('cre-atlas-topnav-link'))

  it('has no links on the plain Top Nav', () => {
    renderNav('')
    expect(linkButtons()).toHaveLength(0)
  })

  it("carries Home's and My Learning's links", () => {
    renderNav('', true)
    expect(linkButtons().map((b) => b.textContent)).toEqual([
      'Course', 'Study Plan', 'Certificates', 'Resources', 'Overview', 'Course', 'Flashcards', 'Exam Simulator',
    ])
  })

  it('a link goes to its page and is marked current; Home stays current on its own links', () => {
    renderNav('?section=course&coursePage=overview', true)
    fireEvent.click(screen.getByRole('button', { name: 'Flashcards' }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=flashcards')
    expect(current()).toEqual(['Course Overview', 'Flashcards'])
    fireEvent.click(screen.getByRole('button', { name: 'Certificates' }))
    expect(screen.getByTestId('search').textContent).toContain('section=certificates')
    expect(current()).toEqual(['Home', 'Certificates'])
  })

  it("Home's Course link opens the course's Course page, which is My Learning's", () => {
    renderNav('', true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Course' })[0])
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=course')
    expect(current()).toEqual(['Course Overview', 'Course'])
    fireEvent.click(screen.getByRole('button', { name: 'Study Plan' }))
    expect(screen.getByTestId('search').textContent).toContain('section=study-plan')
    expect(current()).toEqual(['Home', 'Study Plan'])
  })
})

describe('Hybrid’s second pill is a different control', () => {
  /* 2026-10-08, two direct asks: "rename the header pill to Course Overview",
     and both Course Overview controls land on Anjani's dashboard.

     ⚠ THE DESTINATION IS THE HALF THAT MATTERS. Anjani's `screen-dashboard` and
     `CompassLearningOverview` render the same four bands from the same
     transcribed content (`compassLearningFixtures`), so her dashboard IS
     Compass Learning — `?section=compass`. Pointing an existing pill at an
     existing route is what keeps that one screen rather than forking a third
     overview, and it is the thing a later tidy would most plausibly "simplify"
     back to the Atlas course overview. */
  function renderHybrid(search = '') {
    render(
      <MemoryRouter initialEntries={[`/dashboard-rebrand?version=hybrid-pacing${search}`]}>
        <AccountProvider>
          <AtlasTopNav />
          <Search />
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('reads “Course Overview” and goes to Compass Learning', () => {
    renderHybrid()
    const pill = screen.getByRole('button', { name: /Course Overview/ })
    fireEvent.click(pill)
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=compass')
    /* ⚠ AND NO `coursePage` RIDES ALONG — a stale one from the course player
       would survive the navigation and put the shell on a page nobody asked
       for. */
    expect(search).not.toContain('coursePage')
  })

  it('marks itself current once there', () => {
    /* `section=compass` had no case in the `current` test before this change —
       the pill navigated somewhere it could not then recognise, which reads as
       a dead nav. */
    renderHybrid('&section=compass')
    expect(current()).toEqual(['Course Overview'])
  })

  it('⚠ and Eric’s keeps its destination', () => {
    /* The standing instruction, pinned beside the change it constrains. The
       WORD is the same on both since the 2026-10-15 merge of main — Eric's
       pill was renamed "Course Overview" on 2026-10-07 — so what still tells
       the two apart is where it goes: his to the Atlas course overview, never
       to Compass Learning. */
    renderNav('?demo=1&nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Course Overview/ }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=overview')
    expect(search).not.toContain('section=compass')
  })
})

describe('the Compass rail is Anjani’s on Hybrid', () => {
  /* 2026-10-08, the direct ask: "left rail needs to match what is in anjanis
     prototype."

     ⚠ TWO LISTS, NOT AN EDIT, and that is what these pin. `COMPASS_PAGES` is
     Eric's and his versions draw all eight rows — `CompassLearningPage`'s own
     note says it "carries exactly the eight rows the design draws". Taking
     three off it to settle a question about Hybrid's rail would reach into his
     design, which is the failure every scoped change today is avoiding. */
  const railOf = () =>
    [...document.querySelectorAll('nav[aria-label="Course pages"] > ul:first-of-type > li')].map((li) =>
      (li.textContent ?? '').trim(),
    )

  function renderRail(version: string) {
    render(
      <MemoryRouter initialEntries={[`/dashboard-rebrand?version=${version}&section=compass`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassLearningPage
              courseTitle="New York Life and Health Pre-licensing"
              percentComplete={62}
              completedLessons={26}
              totalLessons={42}
              onStartSession={() => {}}
              onLeave={() => {}}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('draws her five rows, in her order, with the three locked ones under Exam prep', () => {
    /* ⚠ REBUILT 2026-10-15 from her second master. The six label-only rows of
       the 8th (Dashboard · Course · Study planner · Flashcards · Exam
       simulator · Progress) became five with icons — Overview · Learn · Study
       planner · Ask Rubi · Progress — and Flashcards and Exam Simulator moved
       under an EXAM PREP rule as locked rows beside Practice. */
    renderRail('hybrid-pacing')
    expect(railOf()).toEqual(['Overview', 'Learn', 'Study planner', 'Ask Rubi', 'Progress'])
    const locked = [...document.querySelectorAll('ul[aria-label="Exam prep"] li')].map(
      (li) => li.querySelector('.cre-rail__locked-tx')?.textContent,
    )
    expect(locked).toEqual(['Practice', 'Flashcards', 'Exam Simulator'])
  })

  it('a locked row explains itself on the first tap and opens the Exam prep dialog on the second', () => {
    renderRail('hybrid-pacing')
    const row = screen.getByRole('button', { name: /Flashcards/ })
    fireEvent.click(row)
    const tip = screen.getByRole('tooltip', { name: /Finish every section of your course to open Flashcards/ })
    expect(tip.className).toContain('cre-rail__tip--show')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(row)
    expect(screen.getByRole('dialog', { name: 'Exam prep is not open yet' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Back to my course' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('⚠ and Eric’s keeps all eight', () => {
    atlasArm()
    renderRail('eric-atlas-v1')
    expect(railOf()).toHaveLength(8)
    expect(railOf()).toContain('Rubi Insights')
    expect(railOf()).toContain('Overview')
  })

  it('⚠ is a DIFFERENT rail, not the shared one relabelled', () => {
    /* THE CORRECTION THIS PINS. The first pass swapped only the row LIST inside
       `CompassSidebar` and was rejected — "i still need anjanis rails that
       exist in her design. not these." Hers is a different object: the XCEL
       lockup where the shared one has a crumb and a 62% bar, and a Settings
       row and the learner where the shared one has nothing. Asserting the rows
       alone would pass against exactly the version that was wrong. */
    renderRail('hybrid-pacing')
    const rail = document.querySelector('aside')!
    const text = (rail.textContent ?? '').replace(/\s+/g, ' ')

    /* The footer — Settings, then the learner. ⚠ The course-hours / exam
       footer of the 8th is GONE from her second master; pinned as an absence
       so it does not creep back from the old fixture. */
    expect(text).toContain('Settings')
    expect(text).toContain('Jordan R.')
    expect(text).not.toContain('Course hours')
    expect(text).not.toContain('not booked')

    /* ⚠ AND WHAT IT MUST NOT CARRY. The shared sidebar names the course and
       draws its progress; hers does not, and the global header's Home pill is
       why dropping the crumb is safe here. */
    expect(text).not.toContain('New York Life and Health Pre-licensing')
    expect(text).not.toContain('to complete')
  })

  it('⚠ the shared sidebar still names its course', () => {
    /* The other half: nothing about hers reached Eric's. */
    atlasArm()
    renderRail('eric-atlas-v1')
    const rail = document.querySelector('aside')!
    expect(rail.textContent).toContain('New York Life and Health Pre-licensing')
    expect(rail.textContent).not.toContain('Course hours')
  })
})

describe('Hybrid’s Course row opens Anjani’s course landing', () => {
  /* 2026-10-08, the direct ask: "the left rail of the course content page also
     needs to match what is in anjanis", answered by building her page.

     ⚠ THE RAIL NOT SWAPPING IS THE ASSERTION. In her prototype the six rows are
     constant; the product swapped them for a table of contents and left the
     body blank. Both halves are pinned here because either one alone would pass
     against a half-done change — a rail that stays over an empty page, or a
     page under the wrong rail. */
  const railOf = () =>
    [...document.querySelectorAll('nav[aria-label="Course pages"] > ul:first-of-type > li')].map((li) =>
      (li.textContent ?? '').trim(),
    )

  function openCourse(version: string) {
    render(
      <MemoryRouter initialEntries={[`/dashboard-rebrand?version=${version}&section=compass`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassLearningPage
              courseTitle="New York Life and Health Pre-licensing"
              percentComplete={62}
              completedLessons={26}
              totalLessons={42}
              onStartSession={() => {}}
              onLeave={() => {}}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const row = screen
      .getAllByRole('button')
      .find((b) => ['Learn', 'Course'].includes((b.textContent ?? '').trim()))!
    fireEvent.click(row)
  }

  it('keeps her rows and renders the gated course', () => {
    /* ⚠ REBUILT 2026-10-15: her five modules became a two-part gated course —
       see `compassCourseLandingFixtures` for what changed and why "Not proven"
       left this page. */
    openCourse('hybrid-pacing')
    expect(railOf()).toHaveLength(5)
    expect(screen.getByRole('region', { name: 'Learn page' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Your course' })).toBeTruthy()
    expect(screen.getByText('Chapter 2 · Nature of Insurance')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 3, name: 'Qualifying Education' })).toBeTruthy()
    /* Chapter 1 opens on load with its seven lessons; Chapter 2 is where you are. */
    expect(screen.getByRole('list', { name: 'Chapter 1 lessons' }).querySelectorAll('li')).toHaveLength(7)
    expect(screen.getByText('Chapter 2 · 7 lessons · you are here')).toBeTruthy()
    /* A locked chapter explains itself on a click and never opens the dialog. */
    fireEvent.click(screen.getByRole('button', { name: /Chapter 3, Legal Concepts of Insurance, locked/ }))
    expect(screen.getByText('Pass the Chapter 2 exam to open this.')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    /* Part 2's head does. */
    fireEvent.click(screen.getByRole('button', { name: /Exam Preparation/ }))
    expect(screen.getByRole('dialog', { name: 'Exam prep is not open yet' })).toBeTruthy()
  })

  it('⚠ and Eric’s still swaps to the table of contents', () => {
    /* His course page IS the player, and its rail is how a learner moves
       between lessons. The alternative reading of the ask would have deleted
       it; this is what says we did not. */
    atlasArm()
    openCourse('eric-atlas-v1')
    expect(document.querySelector('nav[aria-label="Course pages"]')).toBeNull()
    /* ⚠ NOT `queryByRole('region', {name: 'Course page'})` — `CompassPageBody`
       labels its BLANK ground the same way, so that matches on both arms and
       asserts nothing. The landing's own content is what tells them apart. */
    expect(screen.queryByText('Your course')).toBeNull()
    expect(screen.queryByRole('region', { name: 'Learn page' })).toBeNull()
  })
})
