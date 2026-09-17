import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { LearnerFocusedBand } from '@/components/membership/v5/LearnerFocusedBand'
import type { LearningPathSummary } from '@/data/learningFixtures'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
} from '@/data/dashboardVersions'
import { CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'

/*
 * BUILT, not picked off `learningPathsFor('xcel')[0]`.
 *
 * It was that, with a comment calling it "Florida Nursing — mandatory +
 * elective". Two things had gone wrong with it by 2026-09-16: the comment named
 * a path that had not been first for a long time, and the path that IS first —
 * the New York course — stopped having an elective half when it moved to
 * counting lessons of Part 1 only. So a test about the BAND's two-segment
 * rendering was failing because of a change to a fixture it merely happened to
 * borrow.
 *
 * That is the fragile pattern CLAUDE.md names ("a test that pins itself to a
 * named fixture row is testing the fixture as much as the code"), and the
 * remedy it prescribes: build the input. The subject here is that the band
 * renders a mandatory + elective breakdown, so the input is the smallest path
 * that has one.
 */
const PATH: LearningPathSummary = {
  id: 'test-two-segment-path',
  title: 'Two Segment Test Path',
  category: 'Insurance Continuing Education',
  state: 'FL',
  hours: 24,
  progressPct: 63,
  lastViewedAt: '2026-05-20T08:15:00Z',
  mandatory: { completed: 6, required: 10 },
  elective: { completed: 9, required: 14 },
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'xcel', membership: 'member' }),
  )
})

function renderBand() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <LearnerFocusedBand
          path={PATH}
          showViewAll
          pathsCount={3}
          onViewAll={vi.fn()}
          onViewDetails={vi.fn()}
        />
      </MemoryRouter>
    </AccountProvider>,
  )
}

describe('LearnerFocusedBand', () => {
  it('renders the joined Current Progress + Jump Back In band', () => {
    renderBand()
    const band = screen.getByRole('region', { name: /your learning/i })
    expect(band).toBeInTheDocument()
    // Left (navy) half: eyebrow + path title + the gauge + category bars + KPIs.
    // Against the CONSTANT, not the words: the eyebrow is one string shared by
    // five renderers of this band, and it has been renamed once already
    // THREE TIMES ("Current Learning Path" → "Current Learning Progress" on
    // 2026-09-09, → "Current Course Progress" → "Current Progress" on
    // 2026-09-16). A
    // literal here fails on the next rename while telling you nothing about
    // whether the band is right.
    expect(screen.getByText(CURRENT_LEARNING_EYEBROW)).toBeInTheDocument()
    expect(screen.getByText(PATH.title)).toBeInTheDocument()
    expect(band.querySelector('svg')).toBeTruthy() // the completion gauge
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Elective')).toBeInTheDocument()
    expect(screen.getByText('Deadline')).toBeInTheDocument()
    // Scoped to the navy half's STAT TILES. A bare `getByText('Completed')`
    // broke when the New York path landed (2026-09-16): its plan is 63% done,
    // so a TaskRow in the white half's Today's Tasks now carries a "Completed"
    // status chip and the query matched two nodes. The tile caption is what
    // this line is about, so it asks for the tile.
    const completedTile = screen
      .getAllByText('Completed')
      .find((el) => band.contains(el) && el.textContent === 'Completed')
    expect(completedTile).toBeTruthy()
  })

  it('renders the Resume / View Requirements / View All affordances', () => {
    renderBand()
    expect(screen.getByRole('button', { name: /resume course/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view requirements/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view all \(3\)/i })).toBeInTheDocument()
  })
})

describe('Learner Focused dashboard version', () => {
  it('is registered in the Discoverability version list', () => {
    const v = DISCOVERABILITY_DASHBOARD_VERSIONS.find(
      (x) => x.id === 'discoverability-learner-focused',
    )
    expect(v?.label).toBe('Learner Focused')
  })
})
