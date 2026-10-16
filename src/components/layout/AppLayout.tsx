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
import { DesignSurfaceProvider } from '@/context/DesignSurfaceProvider'
import { MobileNavProvider } from './MobileNavContext'
import { EndToEndPageSync } from '@/pages/EndToEndPageSync'

/**
 * `bare` (2026-10-14, Eric's request) — the providers and the prototype chrome
 * (both control bars) WITHOUT the product's Header: for pages that draw their
 * own header, like the End-to-End Demo's partner pages. The page renders as is,
 * with no <main> around it (it brings its own).
 */
export function AppLayout({ bare = false }: { bare?: boolean } = {}) {
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
                  {/* The End-to-End Demo's Page control ↔ its route. Here, under
                      the flag store, because its pages span both layouts. */}
                  <EndToEndPageSync />
                  {/* MobileNavProvider bridges the header's hamburger to the
                      mobile shell's nav drawer (see MobileNavContext). */}
                  <MobileNavProvider>
                    {/* The prototype chrome (PrototypeBar + Demo Controls) is
                        passed to DeviceFrame so it can render full-width ABOVE
                        the centered browser-window card in the Demo frame. */}
                    {/* Which surface is on screen, so the Design bar can carry
                        Compass's controls inside Compass and Home's on Home.
                        OUTSIDE DeviceFrame on purpose: the chrome it feeds is
                        passed in as a prop, so a provider inside the frame
                        would not reach the bar. */}
                    <DesignSurfaceProvider>
                    <DeviceFrame chrome={<PrototypeChrome />}>
                      {bare ? (
                        <Outlet />
                      ) : (
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
                            path === '/account/profile' ||
                            // The End-to-End Demo's own pages — its Home's
                            // logo goes back to Invited Product Detail
                            // (2026-10-15).
                            path.startsWith('/end-to-end-demo')
                          )
                            return
                          e.preventDefault()
                          e.stopPropagation()
                          setNavBlocked(true)
                        }}
                      >
                        <Header />
                        {/* ⚠ `flex flex-col` JOINED `flex-1` ON 2026-10-16, and it is
                            what makes a page able to FILL this slot rather than
                            only sit in it. `flex-1` gives this element the
                            leftover height; without a flex formatting context
                            inside it, a child's own `flex: 1` is inert and a
                            short page stops where its content stops.

                            THE SYMPTOM was a grey band — the Compass session in
                            its full-screen arm ended 111px above the bottom and
                            `--color-surface-page` showed under it across the
                            whole width, reading as a footer somebody had added
                            (Jillienne, "on key terms theres a weird gray
                            footer"). A percentage height on the child cannot fix
                            it: this element's height is flex-derived, so the
                            percentage has nothing definite to resolve against.

                            ⚠ IT IS SHARED: every routed page renders through
                            this `<Outlet />`. A page that does not ask to grow
                            is unaffected — `flex-col` only changes what happens
                            when a child DOES set `flex: 1`, which before today
                            silently did nothing. */}
                        <main className="flex-1 flex flex-col">
                          <Outlet />
                        </main>
                      </div>
                      )}
                    </DeviceFrame>
                    </DesignSurfaceProvider>
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
