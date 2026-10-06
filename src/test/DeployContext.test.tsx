import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrototypeBar } from '@/components/layout/PrototypeBar'
import { parseDeployContext } from '@/data/deployContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

/**
 * BRANCH DEPLOYS (2026-09-21). They build on the FULL site, so a branch URL
 * carries every gated section — correct for the designers who review each
 * other's branches, and wrong for a stakeholder who reaches one through a
 * Refinement row flipped public. The prototype bar's house icon is that
 * stakeholder's one-click ride into the full gateway, so it is dropped on
 * these builds.
 *
 * `isBranchDeploy()` is called INSIDE the component (not computed at module
 * load like `VISIBLE_SECTIONS`), so `vi.stubEnv` alone is enough here — no
 * `resetModules` + dynamic import.
 */

const here = dirname(fileURLToPath(import.meta.url))

function renderBar(props: Parameters<typeof PrototypeBar>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand']}>
      <PrototypeBar {...props} />
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllEnvs()
  window.localStorage.removeItem('cgp.featureFlags')
})

/** The bar inside a flag provider with `prototype-bar-branch-home` switched
 *  ON — what the designer does in their own browser (flags persist there). */
function renderBarBranchHomeOn(props: Parameters<typeof PrototypeBar>[0] = {}) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'prototype-bar-branch-home': { enabled: true } }),
  )
  return render(
    <FeatureFlagProvider>
      <MemoryRouter initialEntries={['/dashboard-rebrand']}>
        <PrototypeBar {...props} />
      </MemoryRouter>
    </FeatureFlagProvider>,
  )
}

describe('parseDeployContext', () => {
  it('recognises the branch-deploy value, trimmed and case-insensitive', () => {
    expect(parseDeployContext('branch-deploy')).toBe('branch-deploy')
    expect(parseDeployContext('  Branch-Deploy  ')).toBe('branch-deploy')
  })

  // The OPPOSITE direction from parseGatewayMode, deliberately. A lost toml
  // entry must not hide the house icon on the production dashboard — that is a
  // silent, permanent regression to the control every reviewer uses. The toml
  // itself is pinned below, so the entry going missing fails a test instead.
  it('fails towards the production build (icon shown) for anything else', () => {
    for (const raw of [undefined, null, '', 'production', 'branchdeploy', 'brnach-deploy', 42]) {
      expect(parseDeployContext(raw)).toBe('production')
    }
  })
})

describe('netlify.toml sets the var for both non-production contexts', () => {
  const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')

  // Parsed out of the real file rather than restated, the ALLOWED_PROTOCOLS
  // pattern: the guard is worthless if it is a copy that can drift.
  for (const context of ['branch-deploy', 'deploy-preview']) {
    it(`[context.${context}.environment] declares VITE_DEPLOY_CONTEXT`, () => {
      const block = toml.split(`[context.${context}.environment]`)[1]
      expect(block, `no [context.${context}.environment] block`).toBeDefined()
      expect(block.split('[context')[0]).toMatch(
        /VITE_DEPLOY_CONTEXT\s*=\s*"branch-deploy"/,
      )
    })
  }
})

describe('the prototype bar on a branch deploy', () => {
  it('shows the house icon on the production build', () => {
    renderBar()
    expect(screen.getByLabelText('Prototype home')).toBeTruthy()
  })

  // `prototype-bar-branch-home` is OFF by default, so every visitor who has
  // not switched it on gets main's rule.
  it('drops the house icon on a branch deploy by default', () => {
    vi.stubEnv('VITE_DEPLOY_CONTEXT', 'branch-deploy')
    renderBar()
    expect(screen.queryByLabelText('Prototype home')).toBeNull()
  })

  // The designer switches it on in their own browser to get from the branch
  // build's product back to the branch's UX Dashboard.
  it('keeps the house icon on a branch deploy once prototype-bar-branch-home is switched on', () => {
    vi.stubEnv('VITE_DEPLOY_CONTEXT', 'branch-deploy')
    renderBarBranchHomeOn()
    expect(screen.getByLabelText('Prototype home')).toBeTruthy()
  })

  // The bar still has to WORK on a branch deploy — this asserts the removal is
  // the one link and not the whole left cluster.
  it('still renders the bar itself', () => {
    vi.stubEnv('VITE_DEPLOY_CONTEXT', 'branch-deploy')
    /* ⚠ ANCHORED ON THE BAR ELEMENT, NOT ON ITS TEXT — changed 2026-10-05.
       This asserted `getByText(/UI\/UX Prototype/i)`, and that label was
       removed from the bar the same day, so the test failed on a change that
       had nothing to do with what it is about. The subject is that a branch
       deploy drops the HOME LINK and not the whole left cluster; the bar's own
       container is the thing that says the bar rendered, and it survives any
       later edit to what the bar says. */
    const { container } = renderBar()
    expect(container.querySelector('.cre-prototype-bar')).toBeTruthy()
  })

  // An explicit `back` prop is passed by the GATEWAY pages, where the reviewer
  // is already inside the gateway; dropping Back there would strand them
  // rather than protect anything.
  it('keeps an explicit Back pill', () => {
    vi.stubEnv('VITE_DEPLOY_CONTEXT', 'branch-deploy')
    renderBar({ back: { to: '/prototype/xcel-lms', label: 'Back to XCEL LMS' } })
    expect(screen.getByText('Back to XCEL LMS')).toBeTruthy()
  })
})
