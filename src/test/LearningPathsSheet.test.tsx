import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanel } from '@/components/learning/LearningPathsPanel'

beforeEach(() => {
  window.localStorage.clear()
})

function seedAccount(brand: string, membership = 'member') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, membership }))
}

const ELITE_ACTIVE = 'elite-fl-nursing-ce'

function renderPanel(membership = 'member') {
  seedAccount('xcel', membership)
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

describe('My Learning Paths sheet — lo-fi placeholder (hard default)', () => {
  it('renders the finished chrome: Close control + title', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /close panel/i })).toBeInTheDocument()
    // The title appears (Sheet aria-label + heading both use it).
    expect(screen.getByRole('heading', { name: /my learning paths/i })).toBeInTheDocument()
  })

  it('drops the search field, status chips, and sort control', () => {
    renderPanel()
    expect(screen.queryByRole('textbox', { name: /search your learning paths/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /expiring soon/i })).toBeNull()
    expect(screen.queryByText(/sort by/i)).toBeNull()
    expect(screen.queryByText(/pinned above/i)).toBeNull()
  })
})
