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
