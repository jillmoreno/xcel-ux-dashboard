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
const PUBLIC_SECTIONS = ['Prototypes', 'Refinement', 'Research', 'Other Links', 'Development', 'Done']
const GATED_SECTIONS = ['Design', 'Exploration', 'Archive', 'QA Notes']

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
    expect(screen.queryByText(/^Designers$/i)).toBeNull()
    // The lockup's third line says WHICH BUILD you are on — the two sites are
    // otherwise told apart only by which sections are in the rail, which you
    // have to already know to read. It is OUTSIDE `nav`, in the brand block, so
    // this is not the section eyebrow asserted just below.
    expect(screen.getByText('Demo Link')).toBeInTheDocument()
    expect(screen.queryByText('Design Link')).toBeNull()
    expect(screen.getByText('UX Hub')).toBeInTheDocument()
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

  it('no longer links the stakeholder guide, on this build either', async () => {
    // The rail link was removed on 2026-09-29 for BOTH builds — it is one
    // element, not a per-site one. Worth knowing what that costs here: this was
    // the only orientation a stakeholder was given, and the public site has no
    // Contributing section to fall back on. The guide is still served at
    // /about/ for anyone sent the URL directly.
    const Page = await loadPublicPage()
    renderAt(Page, '/')
    expect(screen.queryByRole('link', { name: /How to read this dashboard/ })).toBeNull()
    // And still no trace of the designer guide's name anywhere on the page.
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

describe('the demo site offers only the finished demo controls', () => {
  /*
   * 2026-09-24, the direct ask: Persona, Pacing and Education come off the
   * DEMO site and stay on the DESIGN one.
   *
   * ⚠ THE REASON IS MATURITY, NOT TIDINESS, and as of the same day that reason
   * is WRITTEN DOWN — `maturity` in the flag catalog, resolved by
   * `demoControlMaturity`. This suite used to pin a hand-kept allow-list in
   * `PrototypeChrome`; it now pins the behaviour that list produced, so the
   * mechanism underneath can change again without these tests going quiet.
   */
  async function bar(mode: string, entry = '/dashboard-rebrand') {
    vi.resetModules()
    vi.stubEnv('VITE_GATEWAY_MODE', mode)
    const { PrototypeChrome } = await import('@/components/layout/PrototypeChrome')
    const { AccountProvider } = await import('@/context/AccountContext')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    const { DashboardVersionsPanelProvider } = await import(
      '@/components/dashboard/DashboardVersionsPanelContext'
    )
    const { MembershipVersionsPanelProvider } = await import(
      '@/components/membership/MembershipVersionsPanelContext'
    )
    const { FeatureFlagPanelProvider } = await import('@/components/account/FeatureFlagPanelContext')
    render(
      <MemoryRouter initialEntries={[entry]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <DashboardVersionsPanelProvider>
              <MembershipVersionsPanelProvider>
                <FeatureFlagPanelProvider>
                  <PrototypeChrome />
                </FeatureFlagPanelProvider>
              </MembershipVersionsPanelProvider>
            </DashboardVersionsPanelProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  /* ⚠ SPELLED OUT, not derived from `demoSiteControls()`. A test that recomputes
     the answer from the same function it is checking passes no matter what that
     function returns — including nothing at all.

     ⚠ THIS EXEMPLAR HAS MOVED TWICE, and the reason is the same both times: it
     has to be a control that is DRAWN on the design site and `wip`, or it
     proves nothing about the gate. It named Persona / Pacing / Education until
     2026-09-29, when `SHOW_CONTROL` trimmed those off the bar. It named Nav
     layout until 2026-10-05, when the five design-variant dropdowns moved to
     the Feature Flag panel.

     ⚠ LO-FI IS THE LAST ONE LEFT, which is worth knowing: every other `wip`
     row in `DEMO_CONTROLS` is either hidden by `SHOW_CONTROL` (persona,
     readiness, education) or conditional on something this fixture does not
     have (brand). If Lo-fi ever leaves the bar too, this test has no subject —
     at which point the honest move is to delete it and say the gate is
     unexercised, not to pick a control that is absent anyway. */
  const WIP = [/Lo-fi/i]

  it('hides the work-in-progress axes on the demo site', { timeout: 20_000 }, async () => {
    await bar('public')
    for (const gone of WIP) {
      expect(screen.queryByRole('button', { name: gone }), String(gone)).toBeNull()
    }
    // …and keeps the finished ones, including Reset — the only way a
    // stakeholder gets out of a state they wandered into.
    expect(screen.getByRole('button', { name: /Progress/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Reset$/ })).toBeTruthy()
  })

  it('leaves the design site with all of them, marked', { timeout: 20_000 }, async () => {
    /* The direction that matters more: this is a trim for one audience, not a
       removal. The people making these decisions still need the controls —
       and need to know which ones the stakeholders will not get, which is what
       the mark is for. The accessible name carries it, so a screen reader and
       this assertion read the same thing the amber dot shows. */
    await bar('full')
    for (const there of WIP) {
      const btn = screen.getByRole('button', { name: there })
      expect(btn.textContent, String(there)).toContain('not on the demo site')
    }
    /* …and a READY control is NOT marked. Without this, a mark rendered
       unconditionally would pass every assertion above. */
    /* Anchored on the eyebrow. Not strictly required any more — the mark's
       hidden text used to contain "work in progress" and made this ambiguous —
       but naming the control exactly is the right assertion either way. */
    expect(screen.getByRole('button', { name: /^Progress:/i }).textContent).not.toContain(
      'not on the demo site',
    )
  })

  it('previews the demo site from the design site with ?as=demo', { timeout: 20_000 }, async () => {
    /* The lens. Same build, same flags — only the bar changes, which is the
       whole claim it makes, and the claim is UNCHANGED by the button going.

       ⚠ THE BUTTON WAS ARCHIVED 2026-10-01 and the lens was not — the filtering
       has always come from `only`, which `PrototypeChrome` still computes from
       this param. This test is now the only thing standing between `?as=demo`
       and a silent rot, because nothing in the UI reaches it any more. */
    await bar('full', '/dashboard-rebrand?as=demo')
    for (const gone of WIP) {
      expect(screen.queryByRole('button', { name: gone }), String(gone)).toBeNull()
    }
    expect(screen.getByRole('button', { name: /Progress/i })).toBeTruthy()
  })

  it('no longer offers a View as demo toggle anywhere', { timeout: 20_000 }, async () => {
    /* ⚠ THIS INVERTS AN ASSERTION. It pinned that the toggle was absent on the
       DEMO site only ("there the answer is already yes, so it would be a
       control that does nothing"). The button is gone from both sites now,
       replaced by "Go to Demo Hub" in the kebab — the same question answered by
       the real build rather than a preview of it. Restoring the button means
       restoring the design-site-only scoping with it. */
    await bar('public')
    expect(screen.queryByRole('button', { name: /View as demo/i })).toBeNull()
    await bar('full')
    expect(screen.queryByRole('button', { name: /View as demo/i })).toBeNull()
  })
})

describe('the row kebab is design-site only', () => {
  /*
   * 2026-09-24, the direct ask: only the DESIGN dashboard may change a row's
   * dev-cycle status.
   *
   * ⚠ WHY IT IS NOT COSMETIC. Every kebab item WRITES, and the write persists
   * (localStorage `cgp.devHandoffStatus` / `cgp.prototypeDone`) and BEATS the
   * authored `devStatus`. So a stray click on the demo site silently moves a
   * row between Design and Development for that viewer, permanently, with
   * nothing on the page saying why — and the person it happened to is the one
   * least equipped to undo it.
   */
  async function loadFull() {
    vi.resetModules()
    vi.stubEnv('VITE_GATEWAY_MODE', 'full')
    const { UxDashboardPage } = await import('@/pages/UxDashboardPage')
    return UxDashboardPage
  }

  it('is absent from every row on the demo site', async () => {
    const Page = await loadPublicPage()
    renderAt(Page, '/')
    expect(screen.queryAllByRole('button', { name: /^Actions for / })).toHaveLength(0)
  })

  it('is on every row of the design site', async () => {
    /* The direction that matters as much — this is the only surface that sets a
       status, so losing it would take the feature away entirely rather than
       just from stakeholders. */
    const Page = await loadFull()
    renderAt(Page, '/')
    expect(screen.getAllByRole('button', { name: /^Actions for / }).length).toBeGreaterThan(0)
  })
})

describe('the admin robot is design-site only', () => {
  /*
   * 2026-09-24, the direct ask: hide the robot on the demo site so nobody can
   * click it there.
   *
   * ⚠ WHY IT MATTERS MORE THAN IT LOOKS. The robot opens the FULL Feature Flag
   * sheet on `/dashboard-rebrand` — the whole catalog, `wip` flags included. So
   * it routes straight around the maturity gate: trimming the demo bar to the
   * finished axes buys nothing if a stakeholder is one click from the raw
   * catalog. This suite and the maturity one above are guarding the same door.
   *
   * ⚠ AND IT WAS NEVER VISIBLE AT REST — `opacity: 0` with a hover/focus reveal.
   * That is exactly why a "can you see it?" check is the wrong assertion and
   * these look for the BUTTON, present or absent in the DOM.
   */
  async function bar(mode: string) {
    vi.resetModules()
    vi.stubEnv('VITE_GATEWAY_MODE', mode)
    const { PrototypeChrome } = await import('@/components/layout/PrototypeChrome')
    const { AccountProvider } = await import('@/context/AccountContext')
    const { FeatureFlagProvider } = await import('@/context/FeatureFlagContext')
    const { DashboardVersionsPanelProvider } = await import(
      '@/components/dashboard/DashboardVersionsPanelContext'
    )
    const { MembershipVersionsPanelProvider } = await import(
      '@/components/membership/MembershipVersionsPanelContext'
    )
    const { FeatureFlagPanelProvider } = await import('@/components/account/FeatureFlagPanelContext')
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <DashboardVersionsPanelProvider>
              <MembershipVersionsPanelProvider>
                <FeatureFlagPanelProvider>
                  <PrototypeChrome />
                </FeatureFlagPanelProvider>
              </MembershipVersionsPanelProvider>
            </DashboardVersionsPanelProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  /* ⚠ BOTH NAMES. The same button relabels itself by route — "Settings" on
     `/dashboard-rebrand` (where it opens the flag sheet directly) and "Admin
     tools" everywhere else (where it opens a dropdown). Matching only one
     passes vacuously on the other route. */
  const ROBOT = /^(Settings|Admin tools)$/i

  it('is absent from the DOM on the demo site, not merely hidden', { timeout: 20_000 }, async () => {
    await bar('public')
    expect(screen.queryByRole('button', { name: ROBOT })).toBeNull()
  })

  it('is still there on the design site', { timeout: 20_000 }, async () => {
    /* The direction that matters as much: this is a trim for one audience. The
       people who need the flag catalog are the ones on the design site, and a
       fix that took it from them too would be found the hard way. */
    await bar('full')
    expect(screen.getByRole('button', { name: ROBOT })).toBeTruthy()
  })
})

describe('maturity fails closed', () => {
  /*
   * THE ONE PROPERTY WORTH A TEST OF ITS OWN — 2026-09-24.
   *
   * Everything else here is a preference; this is the safety rail. Forgetting
   * `maturity` must hide a control from stakeholders, never reveal one. If this
   * ever inverts, the failure is silent and lands in front of the exact audience
   * we were protecting.
   */
  it('treats an unmarked flag as work in progress', async () => {
    const { controlMaturity, DEMO_CONTROLS } = await import('@/data/demoControlMaturity')
    const { FEATURE_FLAGS } = await import('@/context/FeatureFlagContext')
    const unmarked = DEMO_CONTROLS.find(
      (row) => row.flag && !FEATURE_FLAGS.find((f) => f.key === row.flag)?.maturity,
    )
    expect(unmarked, 'no unmarked flag-backed control left to check').toBeTruthy()
    expect(controlMaturity(unmarked!.id)).toBe('wip')
  })

  it('treats a control nobody registered as work in progress', async () => {
    /* A dropdown added to the bar with no row in `DEMO_CONTROLS`. It should
       vanish from the demo site rather than ride along. */
    const { controlMaturity } = await import('@/data/demoControlMaturity')
    expect(controlMaturity('a-control-added-tomorrow')).toBe('wip')
  })

  it('keeps every dropdown on the bar accounted for', async () => {
    /* ⚠ THE COUPLING THAT ROTS. The registry names controls by the `id` on their
       `<DemoDropdown>`; nothing in the type system ties the two together. Add a
       dropdown and forget the row, and it disappears from the demo site with no
       error — safe, but not what anyone intended. Read the ids back out of the
       component so the bar itself is the source. */
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('src/components/prototype/DemoControlsBar.tsx', 'utf8'),
    )
    const { DEMO_CONTROLS } = await import('@/data/demoControlMaturity')
    const rendered = [...src.matchAll(/<DemoDropdown\s+id="([\w-]+)"/g)].map((m) => m[1])
    expect(rendered.length, 'no dropdowns found — did the markup change shape?').toBeGreaterThan(5)
    for (const id of rendered) {
      expect(
        DEMO_CONTROLS.some((row) => row.id === id),
        `<DemoDropdown id="${id}"> has no row in DEMO_CONTROLS, so it is invisible on the demo site`,
      ).toBe(true)
    }
  })

  it('drops a work-in-progress variant from a ready flag', async () => {
    /* The within-a-control half. A `ready` flag can still carry an unfinished
       variant, and the demo site should not offer it. Absent means INHERIT, not
       `wip` — otherwise promoting a flag would empty its own picker. */
    const { variantsForDemo } = await import('@/data/demoControlMaturity')
    const variants = [
      { value: 'settled' },
      { value: 'half-built', maturity: 'wip' as const },
      { value: 'also-settled' },
    ]
    /* ⚠ ANY `ready` FLAG KEY DOES — this asserts the WITHIN-a-control rule, and
       the key is only here to make the flag's own maturity `ready` so the
       variant maturities are what decide. It was `dashboard-navigation` until
       that flag was archived (2026-10-01); `dashboard-progress-state` is the
       other control on the bar and is `ready` for the same reason. */
    const shown = variantsForDemo(variants, 'dashboard-progress-state').map((v) => v.value)
    expect(shown).toEqual(['settled', 'also-settled'])
    // …and every variant of a flag nobody promoted stays off the demo site.
    expect(variantsForDemo(variants, 'study-pace-preset')).toEqual([])
  })
})
