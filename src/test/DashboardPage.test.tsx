import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { DashboardPage } from '@/pages/DashboardPage'

function renderAt(url: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <LearningPathsPanelProvider>
          <JumpBackInPanelProvider>
            <MemoryRouter initialEntries={[url]}>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </MemoryRouter>
          </JumpBackInPanelProvider>
        </LearningPathsPanelProvider>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('DashboardPage — version selection', () => {
  it('renders the default version (V3) when no ?version= is present', () => {
    renderAt('/dashboard')
    // The default is now V3. V1 is the only version with the
    // Achievements widget heading, so its absence confirms the default
    // is no longer V1.
    expect(
      screen.queryByText(/^Achievements \(\d+ of \d+\)$/),
    ).not.toBeInTheDocument()
  })

  it('renders V1 when ?version=v1', () => {
    renderAt('/dashboard?version=v1')
    expect(screen.getByText(/^Achievements \(\d+ of \d+\)$/)).toBeInTheDocument()
  })

  it('renders V2 when ?version=v2 — no Achievements section heading', () => {
    renderAt('/dashboard?version=v2')
    expect(screen.queryByText(/^Achievements \(\d+ of \d+\)$/)).not.toBeInTheDocument()
  })

  it('falls back to the default (V3) silently when ?version is unrecognized', () => {
    renderAt('/dashboard?version=foo')
    expect(
      screen.queryByText(/^Achievements \(\d+ of \d+\)$/),
    ).not.toBeInTheDocument()
  })
})
