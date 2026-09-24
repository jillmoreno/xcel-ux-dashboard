import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { readFileSync, readdirSync } from 'node:fs'
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

// Development and Done were pulled out of the `design-and-development` gate
// 2026-09-23 (see `NAV_EYEBROWS` in UxDashboardPage.tsx) — they show here now,
// under their own "Dev Handoff" eyebrow, alongside "Demo" and "Design &
// Research" over the sections that were already public.
const PUBLIC_SECTIONS = ['Prototypes', 'Refinement', 'Other Links', 'Research', 'Development', 'Done']
const GATED_SECTIONS = ['Design', 'Exploration', 'Sandbox', 'Archive', 'QA Notes', 'To Do', 'Contributing']

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

  it('treats exactly the Prototypes row as public — every other authored row is not', () => {
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
    // The three eyebrows over the sections that ARE public still draw here —
    // only the gated group's own eyebrow is suppressed.
    expect(within(nav).getByText('Demo')).toBeInTheDocument()
    expect(within(nav).getByText('Design & Research')).toBeInTheDocument()
    expect(within(nav).getByText('Dev Handoff')).toBeInTheDocument()
    // Refinement's board is read-only here: no composer whatever the store says.
    expect(screen.queryByRole('button', { name: /^Add link/ })).toBeNull()
    // No lock glyph either — nothing on this build is "locked", it is gone.
    expect(screen.queryByText(/— locked/)).toBeNull()
  })

  it('keeps the stakeholder guide link — the one piece of orientation a reviewer gets', async () => {
    const Page = await loadPublicPage()
    renderAt(Page, '/')
    const link = screen.getByRole('link', { name: /How to read this dashboard/ })
    expect(link).toHaveAttribute('href', '/about/')
    // And no trace of the designer guide's name anywhere on the page.
    expect(screen.queryByText(/Contributing/)).toBeNull()
  })

  it('never asks for a password, whatever the URL carries', async () => {
    const Page = await loadPublicPage()
    // Still-gated targets (and the archive-tab pairing) fall back to
    // Prototypes, the default. `dev` no longer does: Development was
    // ungated 2026-09-23, so its legacy alias now resolves for real.
    const cases: [string, string][] = [
      ['/?section=design', 'Prototypes'],
      ['/?section=dev', 'Development'],
      ['/?section=dev&tab=archive', 'Prototypes'],
      ['/?section=todo', 'Prototypes'],
    ]
    for (const [path, heading] of cases) {
      const { unmount } = renderAt(Page, path)
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading)
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
    /* ⚠ THE GUARD IS A SET NOW, not `mode !== 'public'` — 2026-09-23, when the
       `testing` mode arrived and had to inherit the same edge block. The claim
       is unchanged and is what this pins: the FULL build writes no
       `_redirects`, so nothing is 404'd on the site the maintainers use.

       Listed rather than inverted to `!== 'full'` in the script itself,
       because that file writes a rule that DENIES access — a fourth mode
       should opt in to that rather than inherit it by accident. */
    expect(script).toMatch(/TRIMMED[\s\S]*has\(mode\)[\s\S]*process\.exit\(0\)/)
    expect(script).toMatch(/new Set\(\['public', 'testing'\]\)/)
  })

  it('404s the designer guide and leaves the stakeholder guide and their shared stylesheet reachable', () => {
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked).toContain('/contributing/*')
    expect(blocked.some((b) => b.startsWith('/about'))).toBe(false)
    // Both guides link ../guides/guide.css; blocking it would unstyle /about/.
    expect(blocked.some((b) => b.startsWith('/guides'))).toBe(false)
  })

  it('404s the review recaps — internal notes that live under public/ only for the branch build', () => {
    // A recap names colleagues and records what we have not yet shown
    // engineering. It is under `public/` so the FULL site can serve it to the
    // team; the public site is the audience it is written about.
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked).toContain('/recaps/*')
    // The rule must be guarding something — an empty folder would make this
    // test pass while the next recap gets dropped at the public/ root instead,
    // where nothing blocks it. That is the mistake this assertion catches.
    expect(readdirSync(resolve(here, '../../public/recaps')).length).toBeGreaterThan(0)
  })
})

describe('the two guides', () => {
  const pub = resolve(here, '../../public')

  it('each is a self-contained page with its PDF beside it and the one shared stylesheet', () => {
    for (const [folder, pdf] of [
      ['contributing', 'contributing.pdf'],
      ['about', 'about.pdf'],
    ] as const) {
      const html = readFileSync(resolve(pub, folder, 'index.html'), 'utf8')
      expect(html).toContain('href="../guides/guide.css"')
      expect(html).toContain(`href="${pdf}" download`)
      // Nothing from the app — the page has to render on its own and in print.
      expect(html).not.toMatch(/src="\/assets\//)
      expect(readFileSync(resolve(pub, folder, pdf)).subarray(0, 5).toString()).toBe('%PDF-')
    }
    expect(() => readFileSync(resolve(pub, 'guides/guide.css'))).not.toThrow()
  })

  it('the stakeholder guide says nothing about the team’s working process', () => {
    // It is the PUBLIC page. The designer vocabulary — git, the password, the
    // full site's sections — belongs in /contributing/, which the public build
    // cannot reach. A sentence about branches leaking in here would tell a
    // stakeholder how the sausage is made and, worse, where the other site is.
    const about = readFileSync(resolve(pub, 'about/index.html'), 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '') // the header comment MAY name /contributing/
    for (const word of ['git ', 'git clone', 'Netlify', 'pull request', 'FEATURE_FLAGS', 'promote-to-prototype', 'full site']) {
      expect(about, `about/index.html mentions "${word}"`).not.toContain(word)
    }
  })
})

describe('shared Blobs store', () => {
  it('every endpoint opens its store through the one helper, and the vars are all-or-nothing', () => {
    // links / demos go through the shared board handler, which opens the store;
    // the two QA functions open it directly. Either way nothing calls
    // `getStore` except `netlify/lib/store.ts`.
    for (const fn of ['qa-notes', 'qa-captures']) {
      const src = readFileSync(resolve(here, `../../netlify/functions/${fn}.ts`), 'utf8')
      expect(src).toContain("from '../lib/store'")
      expect(src).not.toMatch(/\bgetStore\(/)
    }
    for (const fn of ['links', 'demos']) {
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
