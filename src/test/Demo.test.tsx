import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel, LinksPanel } from '@/components/prototype/LinksPanel'
import type { StoredLink } from '@/data/linkStore'

/**
 * Demo — the review inbox (2026-09-18).
 *
 * The same panel and endpoint code as Links, so the Links suite already covers
 * the URL allow-list, the empty states, the badge mechanism and the form's
 * focus trap. What is pinned HERE is the one thing Demo adds: `isPublic`, and
 * the asymmetry that makes it a review gate —
 *
 *   full site   → every row, a Public / Team only chip, the toggle in the form
 *   public site → only public rows, no chip, no Add / Edit / Remove
 *
 * `isPublicGateway()` reads `import.meta.env` at call time, so the public-build
 * cases stub the env and re-import the panel (the `PublicGateway.test.tsx`
 * pattern) rather than rendering the top-level import.
 */

const here = dirname(fileURLToPath(import.meta.url))

const demo = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'demo-001',
  title: 'Study streak card — feat/streak',
  url: 'https://feat-streak--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
  note: 'Look at the card under Current Progress.',
  addedBy: 'Sam',
  type: '',
  isPublic: false,
  addedDate: '2026-09-18',
  ...over,
})

function mockEndpoint(rows: StoredLink[]) {
  const writes: { method: string; url: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (method !== 'GET') {
        writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
        return new Response(JSON.stringify({ link: demo() }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ links: rows }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  return { writes }
}

async function loadPublicDemoPanel() {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', 'public')
  const mod = await import('@/components/prototype/LinksPanel')
  return mod.DemoPanel
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

/* ── the endpoint ─────────────────────────────────────────────────────────── */

describe('the demos endpoint', () => {
  it('talks to /api/demos, and the redirects route it', () => {
    const fn = readFileSync(resolve(here, '../../netlify/functions/demos.ts'), 'utf8')
    expect(fn).toMatch(/path: \['\/api\/demos', '\/api\/demos\/:id'\]/)
    expect(fn).toMatch(/storeName: 'demos'/)
    // The whole point of the board: it stores the flag. Links must NOT.
    expect(fn).toMatch(/publicFlag: true/)
    const links = readFileSync(resolve(here, '../../netlify/functions/links.ts'), 'utf8')
    expect(links).toMatch(/publicFlag: false/)
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/demos/*"')
    expect(toml).toContain('from = "/api/demos"')
  })

  it('is NOT in the public build’s edge 404 list — the public site has to read it', () => {
    const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
    // …and neither is the folder designers put HTML work-in-review in.
    expect(blocked.some((b) => b.startsWith('/demos'))).toBe(false)
  })

  it('stores isPublic strictly — only boolean true publishes a row', () => {
    // Source-level, because the handler runs in Netlify's runtime. A truthy
    // STRING ("true", "yes") must not publish: the client sends a real boolean,
    // and anything else is a caller this build does not know.
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).toMatch(/out\.isPublic = b\.isPublic === true/)
  })
})

/* ── the full site ────────────────────────────────────────────────────────── */

describe('DemoPanel on the full site', () => {
  it('shows every row, labels who can see each, and offers the toggle in the form', async () => {
    const user = userEvent.setup()
    mockEndpoint([demo(), demo({ id: 'demo-002', title: 'Nav concept B', isPublic: true })])
    render(<DemoPanel />)

    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    expect(screen.getByText('Team only')).toBeInTheDocument()
    expect(screen.getByText('Public')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add link' }))
    const toggle = await screen.findByLabelText('Show on public site')
    // Off by default — a row is team-only until someone decides otherwise.
    expect(toggle).not.toBeChecked()
    // And no Type field: Demo rows are all one kind of thing.
    expect(screen.queryByLabelText(/^Type/)).not.toBeInTheDocument()
  })

  it('sends isPublic as a boolean on save', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<DemoPanel />)

    await user.click(await screen.findByRole('button', { name: 'Add the first link' }))
    await user.type(screen.getByLabelText('Address'), 'https://feat-x--site.netlify.app/dashboard-rebrand?demo=1')
    await user.type(screen.getByLabelText('Title'), 'Feature X')
    await user.click(screen.getByLabelText('Show on public site'))
    await user.click(screen.getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].url).toBe('/api/demos')
    expect((writes[0].body as { isPublic: unknown }).isPublic).toBe(true)
  })

  it('opens the Add form prefilled from the promote-to-refinement hand-off, once, and reports it', async () => {
    // The page reads `?add=1&url=…&title=…&note=…` and passes them down; the
    // panel opens the form with them the moment the endpoint answers, then
    // tells the page so the params come off the address. Nothing is saved.
    const { writes } = mockEndpoint([])
    const consumed = vi.fn()
    render(
      <DemoPanel
        prefill={{
          url: 'https://feat-streak--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
          title: 'Study streak card — feat/streak',
          note: 'Home, under Current Progress.',
        }}
        onPrefillConsumed={consumed}
      />,
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Address')).toHaveValue(
      'https://feat-streak--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
    )
    expect(within(dialog).getByLabelText('Title')).toHaveValue('Study streak card — feat/streak')
    expect(within(dialog).getByLabelText(/^Note/)).toHaveValue('Home, under Current Progress.')
    // Team-only by default, whatever the hand-off says — the toggle is a decision.
    expect(within(dialog).getByLabelText('Show on public site')).not.toBeChecked()
    expect(consumed).toHaveBeenCalledTimes(1)
    expect(writes).toHaveLength(0)
  })

  it('a prefill does nothing on the public build — it cannot author', async () => {
    const Panel = await loadPublicDemoPanel()
    mockEndpoint([demo({ isPublic: true })])
    const consumed = vi.fn()
    render(<Panel prefill={{ url: 'https://x.netlify.app', title: 'X', note: '' }} onPrefillConsumed={consumed} />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(consumed).not.toHaveBeenCalled()
  })

  it('editing prefills the row’s own visibility', async () => {
    const user = userEvent.setup()
    mockEndpoint([demo({ isPublic: true })])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /^Edit / }))
    expect(await screen.findByLabelText('Show on public site')).toBeChecked()
  })
})

/* ── the public site ──────────────────────────────────────────────────────── */

describe('DemoPanel on the public build', () => {
  it('shows only public rows, no chip, and nothing that writes', async () => {
    const Panel = await loadPublicDemoPanel()
    mockEndpoint([
      demo({ id: 'demo-001', title: 'Team-only thing', isPublic: false }),
      demo({ id: 'demo-002', title: 'Public thing', isPublic: true }),
    ])
    render(<Panel />)

    await waitFor(() => expect(screen.getByText('Public thing')).toBeInTheDocument())
    expect(screen.queryByText('Team-only thing')).not.toBeInTheDocument()
    // The count describes the list a stakeholder sees, not the store.
    expect(screen.getByText('1 link')).toBeInTheDocument()
    // No chip — every row here is public, and saying so on each is noise.
    expect(screen.queryByText('Public')).not.toBeInTheDocument()
    expect(screen.queryByText('Team only')).not.toBeInTheDocument()
    // Read-only, whatever the endpoint said.
    expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remove / })).not.toBeInTheDocument()
  })

  it('an empty public list says so without offering to add', async () => {
    const Panel = await loadPublicDemoPanel()
    mockEndpoint([demo({ isPublic: false })])
    render(<Panel />)
    await waitFor(() => expect(screen.getByText('No links yet.')).toBeInTheDocument())
    expect(screen.getByText(/Nothing is being shown for review/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add/ })).not.toBeInTheDocument()
  })
})

/* ── Links is unchanged by all this ───────────────────────────────────────── */

describe('LinksPanel keeps its own shape', () => {
  // Both boards say "Add link" now — the Refinement noun is deliberately the
  // same verb, since what a designer adds there IS a link. What tells them
  // apart is the toggle and the Type field, asserted below.
  it('has no public toggle and still has the Type field', async () => {
    const user = userEvent.setup()
    mockEndpoint([])
    render(<LinksPanel />)
    await user.click(await screen.findByRole('button', { name: 'Add the first link' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Show on public site')).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^Type/)).toBeInTheDocument()
  })
})
