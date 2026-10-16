import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

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

/**
 * WARM THE TRANSFORM CACHE BEFORE ANY CASE IS TIMED — 2026-10-15.
 *
 * This suite used to fail roughly one full run in three, always the same way:
 * the FIRST case timed out and a re-run alone passed, which reads like
 * flakiness in the assertion and is not.
 *
 * Measured, the shape is unmistakable. The first case took 9,735ms and every
 * other case took about 120ms. The cost is not `vi.resetModules()` — a reset
 * and re-import is cheap once Vite has transformed the graph — it is the COLD
 * TRANSFORM of everything `@/App` pulls in, which is the whole product app.
 * That one-off was being paid inside the first case's own budget, so on a run
 * where the machine is busy (the full suite, several workers, a build in
 * another terminal) it stretched past the 20s the case allowed and the case
 * failed. Nothing was ever wrong with the code under test.
 *
 * So the graph is transformed HERE, in a hook with a budget of its own, and
 * every case below starts warm. The hook's 120s is not an estimate of how long
 * this takes — it is 10s cold on this machine — it is deliberately far past
 * any plausible slow run, because a hook that times out tells you nothing and
 * a hook that takes 30s on a loaded CI box is fine.
 *
 * ⚠ DO NOT "TIDY" THIS AWAY. It does no asserting, imports something it
 * discards, and resets the registry straight afterwards, so it reads like dead
 * code. Delete it and the suite still passes — on an idle machine.
 */
beforeAll(async () => {
  vi.stubEnv('VITE_GATEWAY_MODE', 'testing')
  await import('@/App')
  vi.unstubAllEnvs()
  vi.resetModules()
}, 120_000)

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('VITE_GATEWAY_MODE=testing — every gateway route lands in the product', () => {
  /* The five doors into the UX Dashboard. A participant handed one link must
     not find a project list behind any of them — not even the trimmed one the
     public build serves, which still says "this is a prototype gallery
     belonging to a design team" and reframes everything they then say. */
  for (const path of ['/', '/ux-dashboard', '/research-rationale', '/links', '/prds']) {
    /* 10s, down from 20s. Each case re-imports `App` through a reset registry,
       which is ~120ms once the transform cache is warm — and `beforeAll` above
       is what makes sure it is. The budget is headroom for a loaded machine,
       not an estimate. */
    it(
      `${path} redirects into the product`,
      async () => {
        await renderAppAt(path, 'testing')
        expect(screen.getByTestId('at').textContent).toBe('/dashboard-rebrand')
      },
      10_000,
    )
  }

  it('leaves the gateway exactly where it was on the full build', { timeout: 10_000 }, async () => {
    /* ⚠ THE DIRECTION THAT MATTERS MORE. This mode must be invisible to the
       site the maintainers use — a redirect leaking into the full build would
       take the whole project list away from everyone. */
    await renderAppAt('/', 'full')
    expect(screen.getByTestId('at').textContent).toBe('/')
  })

  it('reads a leftover `public` as the full build, gateway and all', { timeout: 10_000 }, async () => {
    /* The public site is retired (2026-10-15). A stale env value on some
       deploy must not strip anything: it parses as full. */
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

  it('opens at 0%', async () => {
    /* ⚠ IT ALSO PINNED `dashboard-navigation: option-1` — the A/B's control
       arm, stated here so a later catalog change could not silently start
       participants on the variant. The flag was archived 2026-10-01 and the
       `TESTING_BASELINE` entry went with it; there is no variant left to be
       started on. See `archivedItems.ts`. */
    const d = await defaults('testing')
    expect(d('dashboard-progress-state').variant).toBe('not-started')
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
