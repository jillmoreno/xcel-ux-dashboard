import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
 *  value of the env var produces anything less. */
const ALL_SECTIONS = [
  'Prototypes',
  'Refinement',
  'Research',
  'Resources',
  'PRDs',
  'Explorations',
  'Development',
  'Done',
  'Archive',
  'QA Notes',
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
    renderAt(Page, '/')
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

  it('leaves the contributing guide, the stakeholder guide and their stylesheet reachable on the one site', () => {
    // The contributing guide is the designers' process manual; with one site,
    // hiding it from stakeholders would hide it from the people it is for.
    expect(list('PRODUCTION_ONLY').some((b) => b.startsWith('/contributing'))).toBe(false)
    for (const name of ['PRODUCTION_ONLY', 'BLOCKED']) {
      expect(list(name).some((b) => b.startsWith('/about'))).toBe(false)
      expect(list(name).some((b) => b.startsWith('/guides'))).toBe(false)
    }
  })
})

describe('the three guides', () => {
  const pub = resolve(here, '../../public')

  it('each is a self-contained page with its PDF beside it', () => {
    for (const [folder, pdf] of [
      ['contributing', 'contributing.pdf'],
      ['about', 'about.pdf'],
      // The third, 2026-10-15 — the working guide for the five people on the
      // team now, reached from a Resources row rather than from the nav. Its
      // draft is the Claude doc "Designer Workflow on the Hub"; this is what
      // the Hub serves.
      ['designer-workflow', 'designer-workflow.pdf'],
    ] as const) {
      const html = readFileSync(resolve(pub, folder, 'index.html'), 'utf8')
      expect(html).toContain(`href="${pdf}" download`)
      // Nothing from the app — the page has to render on its own and in print.
      expect(html).not.toMatch(/src="\/assets\//)
      expect(readFileSync(resolve(pub, folder, pdf)).subarray(0, 5).toString()).toBe('%PDF-')
    }
  })

  it('the two guides on the shared stylesheet still use it', () => {
    // `designer-workflow` deliberately does NOT. It was authored as a
    // published Artifact with its own design — the rail, the speech bubbles,
    // Bricolage Grotesque — and that design is the reason it reads the way it
    // does, so it came over whole rather than being restyled onto this sheet.
    // Its fonts are the one external request any guide makes, which is why the
    // check below is scoped to the other two rather than dropped.
    for (const folder of ['contributing', 'about'] as const) {
      const html = readFileSync(resolve(pub, folder, 'index.html'), 'utf8')
      expect(html).toContain('href="../guides/guide.css"')
      expect(html).not.toMatch(/fonts\.googleapis\.com/)
    }
    expect(() => readFileSync(resolve(pub, 'guides/guide.css'))).not.toThrow()

    // `designer-workflow` carries its own stylesheet, so nothing stops its
    // colours drifting off the Hub's. This is what says they should not: it
    // arrived from the Artifact in a deep green of its own, which read as a
    // different product sitting beside the other two guides (2026-10-15).
    const dw = readFileSync(resolve(pub, 'designer-workflow/index.html'), 'utf8')
    expect(dw).toContain('--accent: #1f4e88')
  })

  it('the stakeholder guide says nothing about the team’s working process', () => {
    // Still the orientation page a stakeholder is sent to. The designer
    // vocabulary belongs in /contributing/, which they can now also open —
    // but /about/ should still read as a page about the product, not the
    // process.
    const about = readFileSync(resolve(pub, 'about/index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
    for (const word of ['git ', 'git clone', 'Netlify', 'pull request', 'FEATURE_FLAGS', 'promote-to-prototype', 'full site']) {
      expect(about, `about/index.html mentions "${word}"`).not.toContain(word)
    }
  })
})

describe('shared Blobs store', () => {
  it('every endpoint opens its store through the one helper, and the vars are all-or-nothing', () => {
    for (const fn of ['qa-notes', 'qa-captures']) {
      const src = readFileSync(resolve(here, `../../netlify/functions/${fn}.ts`), 'utf8')
      expect(src).toContain("from '../lib/store'")
      expect(src).not.toMatch(/\bgetStore\(/)
    }
    for (const fn of ['links', 'demos', 'research', 'prds']) {
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
