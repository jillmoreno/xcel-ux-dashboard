import { render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, it, expect } from 'vitest'
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
import { NotificationsProvider } from '@/context/NotificationsContext'

/**
 * ONE NAVIGATION IN THE HEADER, NOT TWO — 2026-10-05.
 *
 * ⚠ WRITTEN FROM A REGRESSION THE MERGE SHIPPED. Two top navs arrived on the
 * same header from two branches and neither knew about the other:
 *
 *   - `AtlasTopNav` (aria "Global") — Eric's, beside the logo, drawn whenever
 *     an Atlas version is on and `?nav=` is not `left-rail`.
 *   - `PlatformTopNav` (aria "Primary") — main's, in the right-hand utility
 *     cluster, drawn whenever `nav-placement` resolves to a top-bearing arm.
 *
 * `nav-placement` defaults to `top`, so on Eric's versions BOTH conditions were
 * true and the header grew a second pill row. Nothing failed — each nav was
 * correct on its own, and every test of either one passed.
 *
 * ⚠ THE GATE IS `atlasSlimHeader`, NOT `atlasTopNav`. An Atlas version on
 * `?nav=left-rail` draws no Atlas pills, and main's top nav must not fill the
 * gap: the whole point of that arm is Eric's RAIL. Keying on the version rather
 * than on the pills is what makes "left-rail means left rail" hold.
 */
function renderHeader(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <NotificationsProvider>
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
          </NotificationsProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const globalNav = () => screen.queryByRole('navigation', { name: 'Global' })
const primaryNav = () => screen.queryByRole('navigation', { name: 'Primary' })

afterEach(cleanup)

describe('the Atlas header draws ONE top nav', () => {
  it('gives Eric/Atlas V1 his own pills and NOT main’s', () => {
    renderHeader('?demo=1&version=eric-atlas-v1')
    expect(globalNav()).toBeTruthy()
    expect(primaryNav()).toBeNull()
  })

  it('same for the Atlas/Compass parent version', () => {
    renderHeader('?demo=1&version=discoverability-atlas-compass-nav')
    expect(globalNav()).toBeTruthy()
    expect(primaryNav()).toBeNull()
  })

  it('draws NEITHER on Eric’s left-rail arm — the rail is the navigation there', () => {
    /* ⚠ THE CASE THAT MAKES THE GATE `atlasSlimHeader`. With no Atlas pills to
       see, keying on them would have let main's top nav in and quietly undone
       the arm's only purpose. */
    renderHeader('?demo=1&version=eric-atlas-v1&nav=left-rail')
    expect(globalNav()).toBeNull()
    expect(primaryNav()).toBeNull()
  })

  it('still gives the non-Atlas versions main’s top nav', () => {
    /* The other direction: the fix must not cost Testing 3 its navigation. */
    renderHeader('?demo=1&version=discoverability-testing-3')
    expect(primaryNav()).toBeTruthy()
    expect(globalNav()).toBeNull()
  })
})
