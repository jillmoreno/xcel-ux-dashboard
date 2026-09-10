import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Toast } from '@/components/ui/Toast'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipVersionsPanelProvider } from '@/components/membership/MembershipVersionsPanelContext'
import { MembershipPageVersionPanelProvider } from '@/components/membership/MembershipPageVersionPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { NotificationsProvider } from '@/context/NotificationsContext'
import { LearningSetupProvider } from '@/context/LearningSetupContext'
import { LoFiProvider } from '@/context/LoFiContext'
import { MotivationProvider } from '@/context/MotivationContext'
import { ProfileAvatarProvider } from '@/context/ProfileAvatarContext'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { FeatureFlagPanel } from '@/components/account/FeatureFlagPanel'
import { DeviceFrameProvider, DeviceFrame } from './DeviceFrameContext'
import { PrototypeChrome } from './PrototypeChrome'
import { MobileNavProvider } from './MobileNavContext'

export function AppLayout() {
  const { pathname } = useLocation()
  const onRebrand = pathname === '/dashboard-rebrand'
  const [navBlocked, setNavBlocked] = useState(false)
  return (
    // Shared `My Learning Paths` slide-over state lives at the layout
    // level so the Header's dropdown and the Dashboard's
    // Learner-Overview "View All →" link can both open the same panel.
    // The Dashboard Versions panel state lives alongside it so the
    // Header's Dashboard pill can drive its own slide-over. The Jump
    // Back In panel (V3 only) opens from the V3 Jump Back In tile's
    // "View All →" eyebrow action.
    //
    // `FeatureFlagProvider` is the platform-wide feature-flag store
    // (persists to localStorage). `FeatureFlagPanelProvider` owns the
    // open / close state for the editor slide-over surfaced from
    // AccountMenu → UI/UX Demo Tools → Feature Flag. The panel itself
    // is mounted once here so its portal lives inside both providers.
    //
    // `LoFiProvider` owns the lo-fi / hi-fi toggle state surfaced
    // from AccountMenu → UI/UX Demo Tools → Lo-Fi mode. Components
    // consume `useLoFi()` and render their own per-component lo-fi
    // variant when active — the layout keeps the page TEMPLATE
    // (hero positions, grid, sidebar slots) intact and each
    // component only swaps its DETAILS. Header + AccountMenu + the
    // Feature Flag panel stay normal so reviewers can toggle back.
    <FeatureFlagProvider>
      {/* Notification read state, shared by the header bell and the full list
          at ?section=notifications. Inside FeatureFlagProvider because it
          reads `notification-state`, and above BOTH `Header` and `<Outlet />`
          because those are the two surfaces — a provider under either one
          would recreate the fork it exists to close. */}
      <NotificationsProvider>
      {/* Learning-setup (Onboarding Flow) state is lifted here — shared by the
          standalone `/onboarding-flow` wizard and the `/dashboard-rebrand`
          hand-off, so a finished wizard's picks carry into the populated
          dashboard. No persistence (prototype demo state). */}
      <LearningSetupProvider>
      <LoFiProvider>
        <MotivationProvider>
        <ProfileAvatarProvider>
        <LearningPathsPanelProvider>
          <DashboardVersionsPanelProvider>
            <MembershipPageVersionPanelProvider>
            <MembershipVersionsPanelProvider>
            <JumpBackInPanelProvider>
              <FeatureFlagPanelProvider>
                {/* DeviceFrameProvider owns the Desktop / iPad / Mobile preview
                    toggle (in the PrototypeBar); DeviceFrame constrains the
                    shell to that device width on a dark backdrop. Desktop
                    (default) renders full-width. The FeatureFlagPanel stays
                    OUTSIDE the frame so its slide-over covers the viewport. */}
                <DeviceFrameProvider>
                  {/* MobileNavProvider bridges the header's hamburger to the
                      mobile shell's nav drawer (see MobileNavContext). */}
                  <MobileNavProvider>
                    {/* The prototype chrome (PrototypeBar + Demo Controls) is
                        passed to DeviceFrame so it can render full-width ABOVE
                        the centered browser-window card in the Demo frame. */}
                    <DeviceFrame chrome={<PrototypeChrome />}>
                      <div
                        className="min-h-screen flex flex-col"
                        style={{ background: 'var(--color-surface-page)' }}
                        // Complete separation: while inside the Dashboard Rebrand
                        // shell, intercept links that would navigate out to the
                        // classic app (the Explore Dashboard project) and surface
                        // an in-shell error toast instead of leaving. Exits to the
                        // prototype gateway (`/`, `/prototype/*`) and the
                        // `/account/profile` redirect (which lands back in the
                        // shell as `?section=profile`) stay allowed. Capture phase
                        // + preventDefault so react-router's Link bails on the
                        // already-defaultPrevented click.
                        onClickCapture={(e) => {
                          if (!onRebrand) return
                          const href = (e.target as HTMLElement)
                            .closest('a')
                            ?.getAttribute('href')
                          if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return
                          const path = href.split(/[?#]/)[0]
                          if (
                            path === '/dashboard-rebrand' ||
                            path === '/' ||
                            path.startsWith('/prototype') ||
                            path === '/account/profile'
                          )
                            return
                          e.preventDefault()
                          e.stopPropagation()
                          setNavBlocked(true)
                        }}
                      >
                        <Header />
                        <main className="flex-1">
                          <Outlet />
                        </main>
                      </div>
                    </DeviceFrame>
                  </MobileNavProvider>
                  <FeatureFlagPanel />
                  <Toast
                    open={navBlocked}
                    onClose={() => setNavBlocked(false)}
                    tone="error"
                    title="You're in the Dashboard Rebrand"
                  >
                    That link opens the separate Explore Dashboard prototype. The two
                    are kept apart — use the left nav to stay in the Dashboard Rebrand.
                  </Toast>
                </DeviceFrameProvider>
              </FeatureFlagPanelProvider>
            </JumpBackInPanelProvider>
            </MembershipVersionsPanelProvider>
            </MembershipPageVersionPanelProvider>
          </DashboardVersionsPanelProvider>
        </LearningPathsPanelProvider>
        </ProfileAvatarProvider>
        </MotivationProvider>
      </LoFiProvider>
      </LearningSetupProvider>
      </NotificationsProvider>
    </FeatureFlagProvider>
  )
}
