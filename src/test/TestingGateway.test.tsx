import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * THE USER-TEST BUILD HAS NO GATEWAY — `VITE_GATEWAY_MODE=testing`,
 * 2026-09-23, the direct ask: "i don't want the testers to see the ux
 * dashboard, just the link to this specific testing instance."
 *
 * ⚠ IMPORTED INSIDE EACH TEST, after the env is stubbed. `gatewayMode()` reads
 * `import.meta.env` at call time but `App` is evaluated once per module
 * registry, and a top-level import would bind the routes to whatever mode the
 * suite happened to start in. `vi.resetModules()` between stubs is what makes
 * each case a real build rather than a relabelled one — the same reason
 * `PublicGateway.test.tsx` loads its page lazily.
 */

function Probe() {
  return <span data-testid="at">{useLocation().pathname}</span>
}

async function renderAppAt(path: string, mode: string) {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', mode)
  const { default: App } = await import('@/App')
  const { AccountProvider } = await import('@/context/AccountContext')
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <Probe />
        <Routes>
          <Route path="*" element={<App />} />
        </Routes>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Load `gatewayMode` fresh under a stubbed build mode. */
async function loadMode(mode: string) {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', mode)
  return import('@/data/gatewayMode')
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('VITE_GATEWAY_MODE=testing — every gateway route lands in the product', () => {
  /* The four doors into the UX Dashboard. A participant handed one link must
     not find a project list behind any of them — not even the trimmed one the
     public build serves, which still says "this is a prototype gallery
     belonging to a design team" and reframes everything they then say. */
  for (const path of ['/', '/ux-dashboard', '/research-rationale', '/links']) {
    /* ⚠ A LONG TIMEOUT, and it is the module registry rather than the
       assertion. `vi.resetModules()` per case means each one re-imports `App`
       and, after the redirect, the whole dashboard behind it — the first case
       pays for the graph and blew the 5s default. */
    it(
      `${path} redirects into the product`,
      async () => {
        await renderAppAt(path, 'testing')
        expect(screen.getByTestId('at').textContent).toBe('/dashboard-rebrand')
      },
      20_000,
    )
  }

  it('leaves the gateway exactly where it was on the full build', { timeout: 20_000 }, async () => {
    /* ⚠ THE DIRECTION THAT MATTERS MORE. This mode must be invisible to the
       site the maintainers use — a redirect leaking into the full build would
       take the whole project list away from everyone. */
    await renderAppAt('/', 'full')
    expect(screen.getByTestId('at').textContent).toBe('/')
  })

  it('leaves the public build serving its trimmed gateway', { timeout: 20_000 }, async () => {
    /* `public` TRIMS and still serves; `testing` removes. If these two ever
       collapse into one behaviour, the stakeholder link stops working. */
    await renderAppAt('/', 'public')
    expect(screen.getByTestId('at').textContent).toBe('/')
  })
})

describe('VITE_GATEWAY_MODE=testing — the participant chrome is the floor', () => {
  /*
   * ⚠ THE HOLE THIS CLOSES was found by opening the new site's bare root:
   * `/` redirects to `/dashboard-rebrand` carrying no query string, and
   * `?test=1` was the only thing that stripped the chrome — so the first thing
   * on screen was the prototype bar, the joke, the device toggles and all six
   * demo dropdowns. On a site whose entire purpose is participant sessions the
   * stripped chrome has to be the default, not something a URL opts into.
   */
  it('treats a bare page view as a session on the testing build', async () => {
    const { isTestSession } = await loadMode('testing')
    expect(isTestSession('')).toBe(true)
    expect(isTestSession('?demo=1')).toBe(true)
  })

  it('still honours an explicit ?test=0, so a moderator can set up', async () => {
    /* The opt-out has to exist: the moderator checks a persona or a flag on
       the same site before handing the laptop over. An explicit opt-OUT is the
       safer default than an implicit opt-in — forgetting the opt-out shows a
       colleague too much chrome, forgetting the opt-in showed a participant
       too much. */
    const { isTestSession } = await loadMode('testing')
    expect(isTestSession('?test=0')).toBe(false)
  })

  for (const mode of ['full', 'public'] as const) {
    it(`changes nothing on the ${mode} build`, async () => {
      /* The direction that matters more: every other site must behave exactly
         as it did, where `?test=1` is the only switch. */
      const { isTestSession } = await loadMode(mode)
      expect(isTestSession('')).toBe(false)
      expect(isTestSession('?demo=1')).toBe(false)
      expect(isTestSession('?test=1')).toBe(true)
    })
  }
})

describe('VITE_GATEWAY_MODE=testing — the baseline a session opens on', () => {
  /*
   * 2026-09-23: a participant link has to land on a known state, and the
   * committed baseline is not it. `dashboard-progress-state` defaults to On
   * Track because that is the most useful state for a stakeholder walking the
   * Prototypes link; a test of a learner starting a course needs 0%.
   */
  async function defaults(mode: string) {
    vi.resetModules()
    vi.stubEnv('VITE_GATEWAY_MODE', mode)
    const { FEATURE_FLAGS, defaultFlagState } = await import('@/context/FeatureFlagContext')
    return (key: string) => defaultFlagState(FEATURE_FLAGS.find((f) => f.key === key)!)
  }

  it('opens at 0% and Option 1', async () => {
    const d = await defaults('testing')
    expect(d('dashboard-progress-state').variant).toBe('not-started')
    expect(d('dashboard-navigation').variant).toBe('option-1')
  })

  it('leaves the other two sites on the committed baseline', async () => {
    /* ⚠ THE DIRECTION THAT MATTERS MORE. `main` is live on the public
       Prototypes link; a testing-only default leaking there would change what
       every stakeholder sees. */
    const d = await defaults('full')
    expect(d('dashboard-progress-state').variant).toBe('progress-on-track')
    const p = await defaults('public')
    expect(p('dashboard-progress-state').variant).toBe('progress-on-track')
  })

  it('overrides the DEFAULT, not the flag — the bar still switches it', async () => {
    /* The moderator changes Progress mid-session from the demo bar, and `?ff=`
       still wins. This only decides where a fresh page view starts. */
    const d = await defaults('testing')
    const def = (await import('@/context/FeatureFlagContext')).FEATURE_FLAGS.find(
      (f) => f.key === 'dashboard-progress-state',
    )!
    expect(def.variants?.some((v) => v.value === 'progress-on-track')).toBe(true)
    expect(d('dashboard-progress-state').enabled).toBe(true)
  })
})
