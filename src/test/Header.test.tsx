import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipVersionsPanelProvider } from '@/components/membership/MembershipVersionsPanelContext'
import { MembershipPageVersionPanelProvider } from '@/components/membership/MembershipPageVersionPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { describe, it, expect } from 'vitest'

describe('Header', () => {
  it('renders nav and account menu', () => {
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <LoFiProvider>
              <LearningPathsPanelProvider>
                <DashboardVersionsPanelProvider>
                  <MembershipPageVersionPanelProvider>
                  <MembershipVersionsPanelProvider>
                    <JumpBackInPanelProvider>
                      <FeatureFlagPanelProvider>
                        <Header />
                      </FeatureFlagPanelProvider>
                    </JumpBackInPanelProvider>
                  </MembershipVersionsPanelProvider>
                  </MembershipPageVersionPanelProvider>
                </DashboardVersionsPanelProvider>
              </LearningPathsPanelProvider>
            </LoFiProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /my learning/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /course catalog/i })).toBeInTheDocument()
    // Membership is now a NavLink (was a NavDropdown). The dropdown
    // collapsed when /membership got its own landing page.
    expect(screen.getByRole('link', { name: /^membership$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument()
  })
})
