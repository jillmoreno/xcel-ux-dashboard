import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'
import { parseGatewayMode, isPublicFeature } from '@/data/gatewayMode'

/**
 * The PUBLIC build (`VITE_GATEWAY_MODE=public`) — the Netlify project
 * stakeholders are sent to. The claim under test is stronger than "the gated
 * sections are locked": they are ABSENT. No nav row, no divider, no password
 * modal, and the deep links that reach them on the full build land on Demo.
 *
 * `VISIBLE_SECTIONS` is computed at module load, so every render here goes
 * through `vi.resetModules()` + a dynamic import AFTER the env is stubbed.
 * Importing the page at the top of the file would test the full build with a
 * public label on it.
 */

const here = dirname(fileURLToPath(import.meta.url))

async function loadPublicPage() {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', 'public')
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

const PUBLIC_SECTIONS = ['Demo', 'Links', 'Research']
const GATED_SECTIONS = ['Design', 'Exploration', 'Sandbox', 'Development', 'Done', 'Archive', 'QA Notes', 'To Do']

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('gatewayMode — parsing', () => {
  it('is public only on the exact value; anything else is the full app', () => {
    expect(parseGatewayMode('public')).toBe('public')
    expect(parseGatewayMode(' Public ')).toBe('public')
    // A typo must fail towards showing the maintainer everything, never
    // towards hiding it from them.
    expect(parseGatewayMode('publc')).toBe('full')
    expect(parseGatewayMode('')).toBe('full')
    expect(parseGatewayMode(undefined)).toBe('full')
    expect(parseGatewayMode('full')).toBe('full')
  })

  it('treats exactly the Demo row as public — every other authored row is not', () => {
    const pub = PROTOTYPE_FEATURES.filter(isPublicFeature).map((f) => f.id)
    expect(pub).toEqual(['xcel-dashboard'])
  })
})

describe('public build — the nav', () => {
  it('renders ONLY the ungated sections, in order, with no divider eyebrow', async () => {
    const Page = await loadPublicPage()
    renderAt(Page, '/')
    const nav = screen.getByRole('navigation')
    const labels = within(nav)
      .getAllByRole('button')
      .map((b) => (b.textContent ?? '').replace(/\d+$/, '').trim())
    expect(labels).toEqual(PUBLIC_SECTIONS)
    for (const s of GATED_SECTIONS) expect(screen.queryByText(s)).toBeNull()
    expect(screen.queryByText(/UX & Dev Access/i)).toBeNull()
    // No lock glyph either — nothing on this build is "locked", it is gone.
    expect(screen.queryByText(/— locked/)).toBeNull()
  })

  it('never asks for a password, whatever the URL carries', async () => {
    const Page = await loadPublicPage()
    for (const path of ['/?section=design', '/?section=dev', '/?section=dev&tab=archive', '/?section=todo']) {
      const { unmount } = renderAt(Page, path)
      expect(screen.queryByRole('dialog')).toBeNull()
      // Landed on Demo — its h1 is the section label.
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Demo')
      unmount()
    }
  })

  it('does not open a gated row in-frame via ?open=', async () => {
    const Page = await loadPublicPage()
    const gated = PROTOTYPE_FEATURES.find((f) => !isPublicFeature(f))!
    renderAt(Page, `/?section=exploration&open=${gated.id}`)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByText(gated.title)).toBeNull()
  })
})

describe('public build — the edge rules', () => {
  const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')

  it('is wired as the postbuild hook, so the Netlify build command needs no change', () => {
    const pkg = JSON.parse(readFileSync(resolve(here, '../../package.json'), 'utf8'))
    expect(pkg.scripts.postbuild).toBe('node scripts/public-redirects.mjs')
  })

  it('404s the standalone prototype documents — the folder every gated row points at', () => {
    // Parsed from the real declared list rather than restated, the
    // `ALLOWED_PROTOCOLS` pattern from Links.test.tsx.
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    expect(m).not.toBeNull()
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked).toContain('/prototypes/*')
    // Every document row's externalUrl must fall under a blocked prefix.
    for (const f of PROTOTYPE_FEATURES) {
      if (!f.externalUrl) continue
      expect(blocked.some((b) => f.externalUrl!.startsWith(b.replace('*', '')))).toBe(true)
    }
    // And the Links endpoint must NOT be — the section is ungated.
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
    // The rules point at the committed 404 page, which vite copies into dist.
    // FORCED. An unforced rule is ignored when a real file exists at the path —
    // and a real file always exists here. Shipped unforced once; nothing was hidden.
    expect(script).toMatch(/\/404\.html\s+404!/)
    expect(() => readFileSync(resolve(here, '../../public/404.html'))).not.toThrow()
  })

  it('writes nothing on the full build', () => {
    expect(script).toMatch(/mode !== 'public'[\s\S]*process\.exit\(0\)/)
  })
})

describe('shared Blobs store', () => {
  it('every endpoint opens its store through the one helper, and the vars are all-or-nothing', () => {
    for (const fn of ['links', 'qa-notes', 'qa-captures']) {
      const src = readFileSync(resolve(here, `../../netlify/functions/${fn}.ts`), 'utf8')
      expect(src).toContain("from '../lib/store'")
      expect(src).not.toMatch(/\bgetStore\(/)
    }
    const helper = readFileSync(resolve(here, '../../netlify/lib/store.ts'), 'utf8')
    expect(helper).toContain('BLOBS_SITE_ID')
    expect(helper).toContain('BLOBS_TOKEN')
    expect(helper).toMatch(/Boolean\(siteID\) !== Boolean\(token\)/)
  })
})
