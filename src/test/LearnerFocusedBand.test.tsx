import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { LearnerFocusedBand } from '@/components/membership/v5/LearnerFocusedBand'
import { learningPathsFor } from '@/data/learningFixtures'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
} from '@/data/dashboardVersions'

const PATH = learningPathsFor('elite')[0] // Florida Nursing — mandatory + elective

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'elite', membership: 'member' }),
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
  it('renders the joined Current Learning Path + Jump Back In band', () => {
    renderBand()
    const band = screen.getByRole('region', { name: /your learning/i })
    expect(band).toBeInTheDocument()
    // Left (navy) half: eyebrow + path title + the gauge + category bars + KPIs.
    expect(screen.getByText(/current learning path/i)).toBeInTheDocument()
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
