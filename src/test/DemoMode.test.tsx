import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  FeatureFlagProvider,
  useFeatureFlag,
  useFeatureFlags,
} from '@/context/FeatureFlagContext'

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
