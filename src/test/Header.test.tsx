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
    // Cart is GONE as of 2026-09-21 (the direct ask, "no cart"), and this
    // assertion is INVERTED rather than deleted — the same treatment the
    // Membership link above gets, and for the same reason: a deleted line
    // cannot tell the next person the absence is deliberate, and this control
    // reappearing should fail a test rather than pass one.
    //
    // It was a `<Link to="#">` and had never gone anywhere, in a product where
    // the learner is already enrolled and buys on xcelsolutions.com. Unwired,
    // not deleted — `CartButton` is still exported from `Header.tsx`; see
    // ARCHIVED_ITEMS `header-cart`.
    expect(screen.queryByRole('link', { name: /cart/i })).toBeNull()
  })
})
