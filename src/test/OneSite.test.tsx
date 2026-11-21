import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'
import { parseGatewayMode } from '@/data/gatewayMode'

/**
 * ONE SITE — 2026-10-15. This file was `PublicGateway.test.tsx`: the pins for
 * the PUBLIC build, the second Netlify project that trimmed the project list
 * for stakeholders from 2026-09-18. Jillienne retired it ("we will be using
 * this Design hub as the source of truth for everything"); stakeholders are
 * given the one site's link and its password.
 *
 * What is kept from the old file is what is still true of the one site: the
 * edge rules (now the testing build's block and the production recaps rule),
 * the two guides, the shared Blobs store, the robot. What is new is the
 * retirement itself, pinned from the direction that would regress silently: a
 * stale `VITE_GATEWAY_MODE=public` on some deploy must trim NOTHING.
 *
 * The `maturity` cases that lived here — the demo site's ready-only controls
 * and picker, the `?as=demo` lens, "maturity fails closed" — are gone with the
 * field. See `archivedItems.ts`.
 */

const here = dirname(fileURLToPath(import.meta.url))

/**
 * WARM THE TRANSFORM CACHE BEFORE ANY CASE IS TIMED — 2026-10-15.
 *
 * The same defect `TestingGateway.test.tsx` had, found while fixing that one:
 * `loadPage` resets the module registry and dynamically imports
 * `UxDashboardPage`, which pulls in most of the gateway. The FIRST case to
 * call it pays Vite's cold transform of that whole graph inside its own
 * budget — and here the budget is the 5s default, not the 20s that suite had,
 * so this one is the more fragile of the two. It timed out on a loaded run
 * while the TestingGateway fix was being verified.
 *
 * Transforming the graph here, in a hook with a budget of its own, costs the
 * file nothing overall and takes every case well clear of its timeout.
 *
 * ⚠ DO NOT "TIDY" THIS AWAY — it imports something it discards and resets the
 * registry straight after, so it reads like dead code. Delete it and the suite
 * still passes, on an idle machine.
 */
beforeAll(async () => {
  vi.stubEnv('VITE_GATEWAY_MODE', 'full')
  await import('@/pages/UxDashboardPage')
  vi.unstubAllEnvs()
  vi.resetModules()
}, 120_000)

async function loadPage(mode: string) {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', mode)
  const { UxDashboardPage } = await import('@/pages/UxDashboardPage')
  return UxDashboardPage
}

function renderAt(Page: React.ComponentType, path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Page />} />
          </Routes>
        </ThemeProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The whole nav, in order — the same list `UxDashboard.smoke.test.tsx` pins
 *  for the full build. Restated here because THIS file's claim is that no
 *  value of the env var produces anything less. Six since the simple Hub
 *  (2026-11-21, `SIMPLE_SECTIONS`); the rest live on `hub-advanced`. */
const ALL_SECTIONS = [
  'Design',
  'Research',
  'PRDs',
  'Development',
  'Done',
  'Archive',
]

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('gatewayMode — parsing, after the public site', () => {
  it('reads `public` as the full app, and only `testing` as a trimmed build', () => {
    expect(parseGatewayMode('public')).toBe('full')
    expect(parseGatewayMode('PUBLIC ')).toBe('full')
    expect(parseGatewayMode('testing')).toBe('testing')
    expect(parseGatewayMode(undefined)).toBe('full')
    expect(parseGatewayMode('')).toBe('full')
  })
})

describe('one site — a stale public value trims nothing', () => {
  /* The regression that would be silent: the env var is set per Netlify
     project, and the retired project's setting could survive on a clone or a
     branch. Every section, every kebab — all there. */
  it('renders the whole nav — and no Designers divider, which is gone for everyone', async () => {
    const Page = await loadPage('public')
    renderAt(Page, '/')
    const rail = screen.getByRole('complementary', { name: 'Sections' })
    const labels = within(rail)
      .getAllByRole('button')
      .map((b) => (b.textContent ?? '').replace(/\d+$/, '').trim())
      .filter((t) => ALL_SECTIONS.includes(t))
    expect(labels).toEqual(ALL_SECTIONS)
    expect(within(rail).queryByText(/^Designers$/i)).toBeNull()
  })

  it('puts the kebab on every row that opens', async () => {
    const Page = await loadPage('public')
    // Development, not `/`: the landing section is a board since 2026-11-21,
    // and its rows come from an endpoint this file does not mock. The handoff
    // rows are in the repo, so they are the ones that must draw a kebab.
    renderAt(Page, '/?section=development')
    expect(screen.getAllByRole('button', { name: /^Actions for / }).length).toBeGreaterThan(0)
  })

  it('still never asks for a password — the modal wiring went with the group gate', async () => {
    const Page = await loadPage('full')
    // `design` is a legacy alias now (→ Development); the other two are the
    // last of the old restricted group, ungated.
    for (const path of ['/?section=design', '/?section=archive', '/?section=qa-notes']) {
      const { unmount } = renderAt(Page, path)
      expect(screen.queryByRole('dialog')).toBeNull()
      unmount()
    }
  })
})

describe('the edge rules', () => {
  const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')
  const list = (name: string) => {
    const m = script.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))
    expect(m, `${name} list`).not.toBeNull()
    return [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
  }

  it('is wired as the postbuild hook, so the Netlify build command needs no change', () => {
    const pkg = JSON.parse(readFileSync(resolve(here, '../../package.json'), 'utf8'))
    expect(pkg.scripts.postbuild).toBe('node scripts/public-redirects.mjs')
  })

  it('trims the TESTING build only — the full block is not written for the one site', () => {
    expect(script).toMatch(/const TRIMMED = new Set\(\['testing'\]\)/)
  })

  it('404s the standalone documents on the testing build — the folder every gated row points at', () => {
    const blocked = list('BLOCKED')
    expect(blocked).toContain('/prototypes/*')
    for (const f of PROTOTYPE_FEATURES) {
      if (!f.externalUrl) continue
      expect(blocked.some((b) => f.externalUrl!.startsWith(b.replace('*', '')))).toBe(true)
    }
    // The boards' endpoints are never blocked anywhere.
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
    // FORCED, pointing at the committed 404 page vite copies into dist.
    expect(script).toMatch(/\/404\.html\s+404!/)
    expect(() => readFileSync(resolve(here, '../../public/404.html'))).not.toThrow()
  })

  it('404s the review recaps on the one site — on its PRODUCTION deploy only', () => {
    // Jillienne's call when the public site was retired: a recap names
    // colleagues and records what we have not shown engineering, and the
    // stakeholders now open the site the team does. Keyed on Netlify's
    // CONTEXT rather than the mode, so a branch build still serves a recap
    // to the team.
    expect(list('PRODUCTION_ONLY')).toEqual(['/recaps/*'])
    expect(script).toMatch(/process\.env\.CONTEXT/)
    expect(script).toMatch(/context === 'production' \? PRODUCTION_ONLY : \[\]/)
    // The rule must be guarding something.
    expect(readdirSync(resolve(here, '../../public/recaps')).length).toBeGreaterThan(0)
  })

  it('leaves the guide and its stylesheet reachable on the one site', () => {
    // The guide is the designers' first-day manual; with one site, hiding it
    // from stakeholders would hide it from the people it is for.
    expect(list('PRODUCTION_ONLY').some((b) => b.startsWith('/contributing'))).toBe(false)
    for (const name of ['PRODUCTION_ONLY', 'BLOCKED']) {
      expect(list(name).some((b) => b.startsWith('/guides'))).toBe(false)
    }
  })
})

/* ONE GUIDE since 2026-11-21 — the simple Hub. Designer Workflow and About
 * went with the advanced Hub (`hub-advanced` branch); Contributing is the
 * whole first day and the three sentences after it, reached from the Guide
 * link at the foot of the rail. */
describe('the guide', () => {
  const pub = resolve(here, '../../public')

  it('is a self-contained page with its PDF beside it', () => {
    const html = readFileSync(resolve(pub, 'contributing', 'index.html'), 'utf8')
    expect(html).toContain('href="contributing.pdf" download')
    // Nothing from the app — the page has to render on its own and in print.
    expect(html).not.toMatch(/src="\/assets\//)
    expect(readFileSync(resolve(pub, 'contributing', 'contributing.pdf')).subarray(0, 5).toString()).toBe('%PDF-')
  })

  it('uses the shared stylesheet and no web font', () => {
    const html = readFileSync(resolve(pub, 'contributing', 'index.html'), 'utf8')
    expect(html).toContain('href="../guides/guide.css"')
    expect(html).not.toMatch(/fonts\.googleapis\.com/)
    expect(() => readFileSync(resolve(pub, 'guides/guide.css'))).not.toThrow()
  })

  it('the other two guides are gone, not stale', () => {
    for (const folder of ['designer-workflow', 'about']) {
      expect(() => readFileSync(resolve(pub, folder, 'index.html'))).toThrow()
    }
  })

  it('speaks the simple Hub\u2019s words and none of the advanced Hub\u2019s', () => {
    const html = readFileSync(resolve(pub, 'contributing', 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
    for (const word of ['Share my work', 'Demo build', 'Write dev handoff notes']) {
      expect(html, `contributing/index.html lacks "${word}"`).toContain(word)
    }
    for (const word of ['Refinement', 'share-to-stage', 'Prototypes', 'To Do Board', '/designer-workflow/', '/about/']) {
      expect(html, `contributing/index.html still says "${word}"`).not.toContain(word)
    }
  })
})

describe('shared Blobs store', () => {
  it('every endpoint opens its store through the one helper, and the vars are all-or-nothing', () => {
    for (const fn of ['row-archive', 'compare-notes']) {
      const src = readFileSync(resolve(here, `../../netlify/functions/${fn}.ts`), 'utf8')
      expect(src).toContain("from '../lib/store'")
      expect(src).not.toMatch(/\bgetStore\(/)
    }
    for (const fn of ['demos', 'research', 'prds']) {
      const src = readFileSync(resolve(here, `../../netlify/functions/${fn}.ts`), 'utf8')
      expect(src).toContain("from '../lib/linkBoard'")
      expect(src).not.toMatch(/\bgetStore\(/)
    }
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).toContain("from './store'")
    expect(board).not.toMatch(/\bgetStore\(/)
    const helper = readFileSync(resolve(here, '../../netlify/lib/store.ts'), 'utf8')
    expect(helper).toContain('BLOBS_SITE_ID')
    expect(helper).toContain('BLOBS_TOKEN')
    expect(helper).toMatch(/Boolean\(siteID\) !== Boolean\(token\)/)
  })
})

describe('the admin robot', () => {
  async function bar(mode: string, entry = '/dashboard-rebrand') {
    vi.resetModules()
    vi.stubEnv('VITE_GATEWAY_MODE', mode)
    const { PrototypeChrome } = await import('@/components/layout/PrototypeChrome')
    const { AccountProvider: Account } = await import('@/context/AccountContext')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    const { DashboardVersionsPanelProvider } = await import('@/components/dashboard/DashboardVersionsPanelContext')
    const { MembershipVersionsPanelProvider } = await import('@/components/membership/MembershipVersionsPanelContext')
    const { FeatureFlagPanelProvider } = await import('@/components/account/FeatureFlagPanelContext')
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <Account>
          <FeatureFlagProvider>
            <DashboardVersionsPanelProvider>
              <MembershipVersionsPanelProvider>
                <FeatureFlagPanelProvider>
                  <PrototypeChrome />
                </FeatureFlagPanelProvider>
              </MembershipVersionsPanelProvider>
            </DashboardVersionsPanelProvider>
          </FeatureFlagProvider>
        </Account>
      </MemoryRouter>,
    )
  }

  it('opens the flag sheet directly on the one site, under either env value', { timeout: 20_000 }, async () => {
    // "Settings" is the label it takes when it opens the sheet directly.
    for (const mode of ['full', 'public']) {
      const { unmount } = await bar(mode)
      expect(screen.getByRole('button', { name: /^Settings$/i })).toBeTruthy()
      unmount()
    }
  })

  it('is a dropdown without the sheet on the testing build — the one trimmed build left', { timeout: 20_000 }, async () => {
    // `?test=0` is the moderator's opt-out: a bare page view on the testing
    // build is a participant session and draws no chrome at all, robot
    // included. With the bar up, the robot is the dropdown — the flag sheet
    // stays out of a participant's reach, exactly as it did on the demo site.
    await bar('testing', '/dashboard-rebrand?test=0')
    expect(screen.getByRole('button', { name: /^Admin tools$/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Settings$/i })).toBeNull()
  })

  it('draws no chrome at all for a participant on the testing build', { timeout: 20_000 }, async () => {
    await bar('testing')
    expect(screen.queryByRole('button', { name: /^(Settings|Admin tools)$/i })).toBeNull()
  })
})
