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
    // Membership is a NavLink (was a NavDropdown; the dropdown collapsed when
    // /membership got its own landing page) — and it is HIDDEN here, because
    // XCEL sells no membership. Asserting its absence rather than deleting the
    // line: this link was the one surface the brand-add's suppression list
    // missed, and it went unnoticed because the route already redirected, so
    // the symptom was a dead link rather than a wrong page.
    expect(screen.queryByRole('link', { name: /^membership$/i })).toBeNull()
    expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument()
  })
})
