import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('the Atlas header’s Help control', () => {
  /* 2026-10-07, two direct asks a few minutes apart: "switch this to the help
     icon for this Hybrid version", then "when icon is clicked, show the sheet
     view version".

     ⚠ THIS BLOCK PINNED THE `href` BETWEEN THE TWO, on the argument that the
     glyph made Hybrid's Help look like the `?` button beside it and a later
     tidy might "unify" them. The second ask IS that unification, asked for
     deliberately — so the assertion moves to the behaviour rather than being
     deleted: the control opens the sheet and goes nowhere. What has not
     changed is that Eric's header must not move with it. */
  const help = () => screen.getByRole('navigation', { name: 'Help' })

  it.each([
    ['Hybrid V1', 'hybrid-v1'],
    ['the pacing fork', 'hybrid-pacing'],
  ])('opens the Help sheet from %s’s icon, and navigates nowhere', async (_label, version) => {
    const user = userEvent.setup()
    renderHeader(`?demo=1&version=${version}`)
    const trigger = help().querySelector('button')!
    /* ⚠ A BUTTON, NOT A LINK, and that is the assertion rather than an
       implementation detail: an `<a>` here would navigate on click and on
       middle-click and would offer "open in new tab" for a sheet that cannot
       exist in one. */
    expect(help().querySelector('a')).toBeNull()
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    /* The name moved from the text node to `aria-label` when it became a
       glyph; the control is still called "Help", which is what a screen
       reader hears. */
    expect(trigger.getAttribute('aria-label')).toBe('Help')
    expect(trigger.textContent).toBe('')
    expect(trigger.querySelector('svg')).toBeTruthy()

    expect(screen.queryByRole('dialog', { name: 'Help' })).toBeNull()
    await user.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Help' })).toBeTruthy()
  })

  it('⚠ and Eric’s keeps its two text links', () => {
    /* The standing instruction, pinned: no other version moves. Resources is
       in his header and not in Hybrid's — that split is from 2026-10-06, and
       asserting the pair here is what stops these two changes taking it
       along. */
    renderHeader('?demo=1&version=eric-atlas-v1')
    expect([...help().querySelectorAll('a')].map((a) => a.textContent)).toEqual([
      'Resources',
      'Get Help',
    ])
  })
})
