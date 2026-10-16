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
