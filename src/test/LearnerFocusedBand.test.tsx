import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { LearnerFocusedBand } from '@/components/membership/v5/LearnerFocusedBand'
import { learningPathsFor } from '@/data/learningFixtures'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
} from '@/data/dashboardVersions'
import { CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'

const PATH = learningPathsFor('xcel')[0] // Florida Nursing — mandatory + elective

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
  it('renders the joined Current Learning Progress + Jump Back In band', () => {
    renderBand()
    const band = screen.getByRole('region', { name: /your learning/i })
    expect(band).toBeInTheDocument()
    // Left (navy) half: eyebrow + path title + the gauge + category bars + KPIs.
    // Against the CONSTANT, not the words: the eyebrow is one string shared by
    // five renderers of this band, and it has been renamed once already
    // ("Current Learning Path" → "Current Learning Progress", 2026-09-09). A
    // literal here fails on the next rename while telling you nothing about
    // whether the band is right.
    expect(screen.getByText(CURRENT_LEARNING_EYEBROW)).toBeInTheDocument()
    expect(screen.getByText(PATH.title)).toBeInTheDocument()
    expect(band.querySelector('svg')).toBeTruthy() // the completion gauge
    expect(screen.getByText('Mandatory')).toBeInTheDocument()
    expect(screen.getByText('Elective')).toBeInTheDocument()
    expect(screen.getByText('Deadline')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
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
