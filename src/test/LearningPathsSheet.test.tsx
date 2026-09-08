import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { ProgressTrackerCard } from '@/components/learning/ProgressTrackerCard'
import { LearningPathsPanel } from '@/components/learning/LearningPathsPanel'
import { learningPathsFor } from '@/data/learningFixtures'

beforeEach(() => {
  window.localStorage.clear()
})

function seedAccount(brand: string, membership = 'member') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, membership }))
}

const ELITE_ACTIVE = 'elite-fl-nursing-ce'

function renderPanel(membership = 'member') {
  seedAccount('elite', membership)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanel
            open
            onClose={() => {}}
            activePathId={ELITE_ACTIVE}
            onSelectPath={() => {}}
          />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('ProgressTrackerCard — View All (N)', () => {
  it('renders "View All (N)" with the path count and opens the sheet on click', () => {
    const onViewAll = vi.fn()
    render(
      <MemoryRouter>
        <ProgressTrackerCard
          path={learningPathsFor('elite')[0]}
          showViewAll
          pathsCount={3}
          onViewAll={onViewAll}
        />
      </MemoryRouter>,
    )
    const link = screen.getByRole('button', { name: /view all \(3\)/i })
    expect(link).toBeInTheDocument()
    fireEvent.click(link)
    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('hides View All for a single-path learner (N = 1, showViewAll false)', () => {
    render(
      <MemoryRouter>
        <ProgressTrackerCard
          path={learningPathsFor('elite')[0]}
          showViewAll={false}
          pathsCount={1}
          onViewAll={() => {}}
        />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: /view all/i })).toBeNull()
  })
})

describe('My Learning Paths sheet — lo-fi placeholder (hard default)', () => {
  it('renders the finished chrome: Close control + title', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /close panel/i })).toBeInTheDocument()
    // The title appears (Sheet aria-label + heading both use it).
    expect(screen.getByRole('heading', { name: /my learning paths/i })).toBeInTheDocument()
  })

  it('closes when the Close control is clicked', () => {
    const onClose = vi.fn()
    seedAccount('elite')
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <LearningPathsPanel
              open
              onClose={onClose}
              activePathId={ELITE_ACTIVE}
              onSelectPath={() => {}}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: /close panel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('drops the search field, status chips, and sort control', () => {
    renderPanel()
    expect(screen.queryByRole('textbox', { name: /search your learning paths/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /expiring soon/i })).toBeNull()
    expect(screen.queryByText(/sort by/i)).toBeNull()
    expect(screen.queryByText(/pinned above/i)).toBeNull()
  })
})
