import { useEffect } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlags,
} from '@/context/FeatureFlagContext'
import { AccountProvider } from '@/context/AccountContext'
import { AdminToolsMenu } from '@/components/layout/AdminToolsMenu'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipVersionsPanelProvider } from '@/components/membership/MembershipVersionsPanelContext'

/** Puts the provider into demo mode the way `DashboardRebrandPage` does. */
function DemoModeSeed() {
  const { setDemoMode } = useFeatureFlags()
  useEffect(() => {
    setDemoMode(true)
  }, [setDemoMode])
  return null
}

// A flag with a simple on/off shape + a catalog default of OFF.
const KEY = 'dashboard-career-tools'
const STORAGE_KEY = 'cgp.featureFlags'

function persistedEnabled(): boolean | undefined {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return undefined
  return (JSON.parse(raw) as Record<string, { enabled?: boolean }>)[KEY]?.enabled
}

function Probe() {
  const { setEnabled, saveAsDefault, setDemoMode, demoMode } = useFeatureFlags()
  const flag = useFeatureFlag(KEY)
  return (
    <div>
      <span data-testid="val">{flag.enabled ? 'on' : 'off'}</span>
      <span data-testid="mode">{demoMode ? 'demo' : 'live'}</span>
      <button onClick={() => setEnabled(KEY, true)}>on</button>
      <button onClick={() => setEnabled(KEY, false)}>off</button>
      <button onClick={() => saveAsDefault([KEY])}>save-default</button>
      <button onClick={() => setDemoMode(true)}>enter</button>
      <button onClick={() => setDemoMode(false)}>exit</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <FeatureFlagProvider>
      <Probe />
    </FeatureFlagProvider>,
  )
}

const val = () => screen.getByTestId('val').textContent
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

beforeEach(() => {
  window.localStorage.clear()
})

describe('Feature flag demo mode — the "pure" Demo view', () => {
  it('renders the designated Default baseline, ignoring live sandbox tinkering', () => {
    renderProbe()
    // Designate ON as the Default (the "Set as default" the reviewer curates),
    // then tinker the LIVE flag back to OFF in the sandbox.
    click('on')
    click('save-default')
    click('off')
    expect(val()).toBe('off') // sandbox shows the tinkered value

    // Entering the Demo inherits the DEFAULT (on), not the live tinkering (off).
    click('enter')
    expect(val()).toBe('on')

    // Leaving restores the sandbox's live value untouched.
    click('exit')
    expect(val()).toBe('off')
  })

  it('never persists while in demo mode (edits are ephemeral)', () => {
    renderProbe()
    click('off') // establish a known persisted live value
    expect(persistedEnabled()).toBe(false)

    click('enter')
    // Tweak inside the demo — must NOT touch cgp.featureFlags.
    click('on')
    expect(val()).toBe('on') // reflected in the view
    expect(persistedEnabled()).toBe(false) // but not persisted

    click('exit')
    expect(val()).toBe('off') // ephemeral tweak discarded
    expect(persistedEnabled()).toBe(false)
  })
})

/**
 * The robot (`AdminToolsMenu`) in the Demo view.
 *
 * It used to `return null` whenever `demoMode` was on, unless a `?tools=1` back
 * door was set — the idea being that a stakeholder should see a clean demo. That
 * was reversed 2026-09-16: the trigger is `opacity: 0` at rest, so the gate was
 * not buying a cleaner screen, and the gateway's Demo row opens
 * `/dashboard-rebrand?demo=1` — making the one route a reviewer actually lands
 * on the only route with no way into the flag sheet.
 *
 * Asserted in BOTH directions because the argument only holds while the second
 * half is true: the tools are reachable, AND nothing reachable from them can
 * outlive the demo. Demo mode suspends persistence and the panel drops its two
 * baseline-writing buttons, so a reviewer can explore freely without drifting
 * the sandbox or redefining what the committed Demo shows.
 */
describe('the Demo view keeps the UI/UX tools reachable', () => {
  it('renders the robot trigger under demo mode', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <DashboardVersionsPanelProvider>
              <MembershipVersionsPanelProvider>
                <FeatureFlagPanelProvider>
                  <DemoModeSeed />
                  <AdminToolsMenu />
                </FeatureFlagPanelProvider>
              </MembershipVersionsPanelProvider>
            </DashboardVersionsPanelProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    // On the rebrand the robot opens the Feature Flag sheet directly rather than
    // a dropdown, which is why it is labelled "Settings" there.
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('still refuses to let the Demo view rewrite the committed baseline', () => {
    // The safety half. `saveAsDefault` is what "Set as default" calls, and the
    // panel hides that button under `demoMode` — but the store must refuse it
    // too, or a stale call site could redefine the Demo from inside the Demo.
    renderProbe()
    click('enter')
    expect(screen.getByTestId('mode').textContent).toBe('demo')
    click('on')
    click('save-default')
    click('exit')
    // Back in the sandbox: the catalog default (off) still stands — the demo's
    // "on" neither survived the exit nor became the new baseline. Asserted as
    // "not true" rather than "undefined": leaving the demo writes the SANDBOX
    // state back to storage, so the key legitimately exists — carrying the
    // sandbox's own `false`, not the demo's `true`.
    expect(val()).toBe('off')
    expect(persistedEnabled()).not.toBe(true)
    // And the custom-defaults map — what "Set as default" writes — was never
    // touched, which is the half that would have redefined the committed Demo.
    const defaults = window.localStorage.getItem('cgp.featureFlags.customDefaults')
    expect(defaults == null || JSON.parse(defaults)[KEY] === undefined).toBe(true)
  })
})
