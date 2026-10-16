import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { DashboardRebrandPage } from '@/pages/DashboardRebrandPage'
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
              <Routes>
                <Route path={DASH} element={<DashboardRebrandPage />} />
              </Routes>
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The card's Course Overview, which both arms draw — the question is what a
 *  click does, never whether the button is there. */
async function clickCourseOverview() {
  const button = screen.getAllByRole('button', { name: 'Course Overview' })[0]
  await act(async () => {
    fireEvent.click(button)
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

  it('off: the walk’s button is inert again, as it was before the seam', async () => {
    renderDashboard(`?demo=1&version=${END_TO_END_VERSION}&journey=full&ff=e2e-course-overview-opens-compass:off`)
    await clickCourseOverview()
    expect(sectionNow()).not.toBe('compass')
  })
})
