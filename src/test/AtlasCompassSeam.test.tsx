import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { DashboardRebrandPage } from '@/pages/DashboardRebrandPage'
import { AtlasTopNav } from '@/components/layout/AtlasTopNav'
import { END_TO_END_VERSION } from '@/pages/endToEndDemo'

/**
 * THE ATLAS↔COMPASS SEAM (2026-10-16) — Course Overview on the Atlas course
 * card opens Anjani's Compass on the End-to-End row's walk, and ONLY there.
 *
 * ⚠ THE THREE CASES ARE ONE DECISION, so they live together. Jillienne's ask
 * came with a condition — "still allow eric to play with those pages on his
 * branch, but not promote it to the prototype" — which means the seam is
 * worthless if it is bought by removing anything of his. The third case is
 * what holds that: his overview must still render. If a later change unwires
 * his pages to tidy this up, that case fails and says why.
 *
 * `?journey=full` is the row marker; `endToEndDemo.ts` says why it is a URL
 * param and not a flag (one flag value per build, two rows on that build).
 */

const DASH = '/dashboard-rebrand'

function Probe() {
  const { search } = useLocation()
  return <span data-testid="search">{search}</span>
}

function renderDashboard(search: string) {
  window.history.replaceState({}, '', `${DASH}${search}`)
  return render(
    <MemoryRouter initialEntries={[`${DASH}${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <Probe />
              {/* The header's nav is mounted BESIDE the page, as the shell
                  mounts it — the round trip needs both halves: Course
                  Overview lives on the page, Home lives up here. */}
              <div data-testid="header">
                <AtlasTopNav />
              </div>
              <div data-testid="page">
                <Routes>
                  <Route path={DASH} element={<DashboardRebrandPage />} />
                </Routes>
              </div>
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/* ⚠ TWO BUTTONS SAY "COURSE OVERVIEW" once the header is mounted — the Atlas
   course CARD's, which is this suite's subject, and the Top Nav's pill, which
   is Eric's and goes to his page by design. They are told apart by WHICH HALF
   of the shell they are in, not by order: a `getAllByRole(...)[0]` picked the
   nav's and turned the first case green against the wrong button. */
async function clickCourseOverview() {
  const button = within(screen.getByTestId('page')).getAllByRole('button', { name: 'Course Overview' })[0]
  await act(async () => {
    fireEvent.click(button)
  })
}

/** Begin Course sits beside Course Overview on the card. */
async function clickBeginCourse() {
  const page = within(screen.getByTestId('page'))
  const button =
    page.queryAllByRole('button', { name: 'Begin Course' })[0] ??
    page.getAllByRole('button', { name: 'Resume Course' })[0]
  await act(async () => {
    fireEvent.click(button)
  })
}

/** Home lives in the header half. */
async function clickHome() {
  const home = within(screen.getByTestId('header')).getByRole('button', { name: 'Home' })
  await act(async () => {
    fireEvent.click(home)
  })
}

const sectionNow = () => new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('section')

afterEach(cleanup)

describe('Course Overview on the End-to-End row’s walk', () => {
  it('the flag is on in the committed baseline', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'e2e-course-overview-opens-compass')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
  })

  it('opens Compass Learning, and keeps the walk’s marker on the address', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full`)
    await clickCourseOverview()
    expect(sectionNow(), 'Anjani’s Compass, not Eric’s Atlas overview').toBe('compass')
    const params = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(params.get('journey'), 'the rest of the walk is still the walk').toBe('full')
    // A stale course page must not ride along into Compass.
    expect(params.get('coursePage')).toBeNull()
  })

  it('does NOT change Eric’s Atlas Learning tile — no journey marker, no seam', async () => {
    // The tile that is not Jillienne's renders the same component. This is the
    // case that fails if the seam is ever widened into a build-wide flag.
    renderDashboard('?demo=1&section=dashboard')
    const before = screen.getByTestId('search').textContent
    await clickCourseOverview()
    expect(screen.getByTestId('search').textContent, 'Eric’s tile is untouched').toBe(before)
  })

  /* ── THE WAY BACK ─────────────────────────────────────────────────
   * Home in Compass returns to Atlas Home. This ALREADY WORKED when the seam
   * went in — `AtlasTopNav`'s Home copies the address and deletes `section`,
   * so the marker rides home with it — and that is exactly why it is pinned
   * here: it works by a property of code that has nothing to do with this
   * seam, and would break silently if that nav ever rebuilt its params
   * instead of copying them. The round trip is the feature; one half of it
   * being incidental is not a reason to leave it unheld.
   *
   * `?journey=full` SURVIVING is the half that matters most. Lose it and the
   * reviewer is returned to a dashboard that behaves like Eric's tile, and
   * Course Overview goes dead again — the walk quietly stops being the walk,
   * with nothing on screen to say so.
   */
  it('Home in Compass returns to Atlas Home, carrying the walk with it', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full&section=compass`)
    await clickHome()
    const params = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(params.get('section'), 'back out of Compass').toBeNull()
    expect(params.get('journey'), 'and still on the walk — Course Overview must still reach Compass').toBe('full')
  })

  it('the round trip is closed: Course Overview out, Home back, Course Overview out again', async () => {
    // Walking it twice is the point — a one-way marker would pass the two
    // cases above and still strand a reviewer on the second lap.
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full`)
    await clickCourseOverview()
    expect(sectionNow()).toBe('compass')

    await clickHome()
    expect(sectionNow()).toBeNull()

    await clickCourseOverview()
    expect(sectionNow(), 'the second lap must work exactly like the first').toBe('compass')
  })

  it('off: the walk’s button is inert again, as it was before the seam', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full&ff=e2e-course-overview-opens-compass:off`)
    await clickCourseOverview()
    expect(sectionNow()).not.toBe('compass')
  })
})

/**
 * BEGIN COURSE — the second half of the seam (2026-10-16, Jillienne with the
 * button selected: "make this button go into the compass course").
 *
 * ⚠ IT LANDS SOMEWHERE DIFFERENT FROM COURSE OVERVIEW, and that is the whole
 * reason it is its own flag rather than a widening of the first: Course
 * Overview opens Anjani's DASHBOARD, Begin Course opens a LESSON. Two buttons
 * side by side, two destinations, two promotion decisions.
 */
describe('Begin Course on the End-to-End row’s walk', () => {
  it('the flag is on in the committed baseline, and is its own key', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'e2e-begin-opens-compass-session')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
    // Not folded into the Course Overview flag — see the describe note.
    expect(FEATURE_FLAGS.find((f) => f.key === 'e2e-course-overview-opens-compass')).toBeDefined()
  })

  it('opens the Compass SESSION, not Anjani’s dashboard and not Eric’s course page', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full`)
    await clickBeginCourse()
    const params = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(params.get('section')).toBe('compass')
    // The lesson view — this param is what separates it from Course Overview,
    // which lands on the same section with no session.
    expect(params.get('session'), 'the lesson, not the dashboard').toBe('1')
    // …and not Eric's Atlas Course page, which is where it went before.
    expect(params.get('coursePage'), 'a stale course page must not ride along').toBeNull()
    expect(params.get('journey'), 'still on the walk').toBe('full')
  })

  it('the two buttons land in DIFFERENT places', async () => {
    // If these ever agree, one of the two flags has quietly absorbed the other
    // and a reviewer has lost a destination with no error to say so.
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full`)
    await clickCourseOverview()
    const overview = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(overview.get('section')).toBe('compass')
    expect(overview.get('session'), 'Course Overview is the dashboard, not a lesson').toBeNull()
  })

  it('does NOT change Eric’s Atlas Learning tile', async () => {
    renderDashboard('?demo=1&section=dashboard')
    const before = screen.getByTestId('search').textContent
    await clickBeginCourse()
    expect(screen.getByTestId('search').textContent, 'Eric’s tile is untouched').toBe(before)
  })

  it('off: the walk’s Begin Course is inert again', async () => {
    renderDashboard(
      `?demo=1&version=${END_TO_END_VERSION}&journey=full&ff=e2e-begin-opens-compass-session:off`,
    )
    await clickBeginCourse()
    expect(
      new URLSearchParams(screen.getByTestId('search').textContent ?? '').get('session'),
    ).toBeNull()
  })
})

/**
 * THE WAY HOME FROM A LESSON (2026-10-16, Jillienne: "this course needs to
 * have a header that matches Atlas header so user can get back to HOME").
 *
 * Begin Course puts a reviewer INSIDE a Compass lesson, and the session's
 * shipped arm takes the whole screen with no Home in its own bar — so the
 * walk ended somewhere with no way back. On the walk the session takes the
 * in-shell arm instead, which is Anjani's own control borrowed, not
 * re-pointed: `full-screen` is still what ships and still what her tile opens.
 */
describe('the walk’s lesson keeps a way home', () => {
  it('the flag is on in the committed baseline, and does NOT move Anjani’s default', () => {
    const ours = FEATURE_FLAGS.find((f) => f.key === 'e2e-session-keeps-atlas-header')
    expect(ours?.defaultEnabled).toBe(true)
    // Hers is untouched — the arm is her decision, on her surface.
    const hers = FEATURE_FLAGS.find((f) => f.key === 'compass-session-chrome')
    expect(hers?.defaultVariant, 'full-screen is still what ships').toBe('full-screen')
    expect(hers?.owner).toBe('anjani')
  })

  /* ⚠ A STALE `session` IS THE BUG THIS FOUND, and it is the kind that reads
   * as someone else's fault. Home dropped `section` and `coursePage` but not
   * `session`, so going Home LOOKED right and then the next pick of Compass
   * re-entered the lesson — from the Start control or the header — because
   * the lesson's param was still on the address. Unreachable until Begin
   * Course started putting reviewers in sessions, which is why it had never
   * bitten. Found by walking it, not by reading it. */
  it('Home drops the lesson’s session param, so Compass opens the dashboard next', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full&section=compass&session=1`)
    await clickHome()
    const params = new URLSearchParams(screen.getByTestId('search').textContent ?? '')
    expect(params.get('section'), 'out of Compass').toBeNull()
    expect(params.get('session'), 'and out of the lesson — not just out of the section').toBeNull()
    expect(params.get('journey'), 'still on the walk').toBe('full')
  })
})

/**
 * THE WALK'S STUDY JOURNEY STEPS (2026-10-16, Jillienne, selecting them one at
 * a time). Step 2 asks about the exam date instead of reciting figures, Step 3
 * loses its detail, and the State Requirements button goes.
 *
 * ⚠ THE PROMPT IS MOVED, NOT COPIED, and the count below is what holds that.
 * It used to stand above the steps; if a later change puts it back there
 * without taking it out of Step 2, the same question is on screen twice and
 * nothing else would complain.
 */
describe('the walk’s Study Journey steps', () => {
  it('is on in the committed baseline', () => {
    expect(FEATURE_FLAGS.find((f) => f.key === 'e2e-walk-journey-steps')?.defaultEnabled).toBe(true)
  })

  it('prompts for the exam date in place of the figures, exactly once', () => {
    /* ⚠ IT ASKS NOTHING SINCE 2026-10-19. The line was "Do you know your
       state exam date?" with Yes / Not Yet. It is "When is your exam?" now,
       with one filled Add Date beside it and Exam Information as a second
       stop under it. The COUNT is what this case is really for and is
       unchanged: the prompt is moved into Step 2, not copied there. */
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full`)
    const page = within(screen.getByTestId('page'))
    expect(page.queryByText(/150 scored questions/)).toBeNull()
    expect(page.queryByText(/Apply online, then submit/)).toBeNull()
    expect(page.getAllByText('When is your exam?')).toHaveLength(1)
    expect(page.getAllByRole('button', { name: 'Add Date' })).toHaveLength(1)
    // The question's two answers went with the question.
    expect(page.queryByText('Do you know your state exam date?')).toBeNull()
    expect(page.queryByRole('button', { name: /Not Yet/ })).toBeNull()
    /* The second stop opens the SAME sheet Quick Links' own Exam Information
       opens — hence two of them on the page, not one. If this ever reads 1,
       either the row went or the rail's link did. */
    expect(page.getAllByRole('button', { name: 'Exam Information' })).toHaveLength(2)
    /* Step 3 gained the same shape on 2026-10-19 — "add a circle link
       option, blue style, under this that is: Applying for a License" — and
       it opens the rail's sheet, hence two of these as well. */
    expect(page.getAllByRole('button', { name: 'Applying for a License' })).toHaveLength(2)
    expect(document.querySelector('[data-cta-id="home.state-requirements"]')).toBeNull()
  })

  it('leaves Eric’s Atlas Learning tile exactly as he promoted it', async () => {
    renderDashboard('?demo=1&section=dashboard')
    const page = within(screen.getByTestId('page'))
    expect(page.getByText(/150 scored questions/)).toBeInTheDocument()
    expect(page.getByText(/Apply online, then submit/)).toBeInTheDocument()
    expect(document.querySelector('[data-cta-id="home.state-requirements"]')).not.toBeNull()
  })
})
