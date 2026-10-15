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
 *   full site   → every row, a Public / UX Only badge, the toggle in the form
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
  product: 'both',
  addedDate: '2026-09-18',
  updatedAt: '',
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
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/demos/*"')
    expect(toml).toContain('from = "/api/demos"')
  })

  it('is NOT in the edge 404 list — the site has to read it', () => {
    const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
    // …and neither is the folder designers put HTML work-in-review in.
    expect(blocked.some((b) => b.startsWith('/demos'))).toBe(false)
  })

  it('drops isPublic on the way in — the public site it gated is retired (2026-10-15)', () => {
    // Source-level, because the handler runs in Netlify's runtime. A record
    // saved before the retirement keeps the key in Blobs until its next save;
    // nothing on the client reads it, and the server no longer writes it.
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).not.toMatch(/out\.isPublic/)
    expect(board).not.toMatch(/publicFlag/)
  })
})

/* ── the full site ────────────────────────────────────────────────────────── */

describe('DemoPanel on the full site', () => {
  it('shows every row, with no visibility chip and no public toggle (2026-10-15)', async () => {
    const user = userEvent.setup()
    mockEndpoint([demo(), demo({ id: 'demo-002', title: 'Nav concept B' })])
    render(<DemoPanel />)

    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    // One site, one audience: a row is a row. The Public / UX Only chip and
    // the "Show on public site" switch went with the public build.
    expect(screen.queryByText('UX Only')).not.toBeInTheDocument()
    expect(screen.queryByText('Public')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add link' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Show on public site')).not.toBeInTheDocument()
    // And no Type field: Demo rows are all one kind of thing.
    expect(within(dialog).queryByLabelText(/^Type/)).not.toBeInTheDocument()
  })

  it('sends no isPublic on save', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<DemoPanel />)

    await user.click(await screen.findByRole('button', { name: 'Add the first link' }))
    await user.type(screen.getByLabelText('Address'), 'https://feat-x--site.netlify.app/dashboard-rebrand?demo=1')
    await user.type(screen.getByLabelText('Title'), 'Feature X')
    await user.click(screen.getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].url).toBe('/api/demos')
    expect(writes[0].body as object).not.toHaveProperty('isPublic')
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
          product: 'compass',
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
    // The product tag rides in since 2026-10-14 — the skill reads it off the
    // branch, so Anjani's Compass work opens already tagged.
    expect(within(dialog).getByRole('radio', { name: 'Compass' })).toBeChecked()
    expect(consumed).toHaveBeenCalledTimes(1)
    expect(writes).toHaveLength(0)
  })

  it('a prefill with no product opens on the form’s own default', async () => {
    // A hand-off from before the field existed, or one that could not tell,
    // must not change what the form would have done on its own.
    mockEndpoint([])
    render(
      <DemoPanel prefill={{ url: 'https://x.netlify.app/dashboard-rebrand?demo=1', title: 'X', note: '' }} />,
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: 'Both' })).toBeChecked()
  })
})

/* ── Links is unchanged by all this ───────────────────────────────────────── */

describe('LinksPanel keeps its own shape', () => {
  // Both boards say "Add link" — the Refinement noun is deliberately the
  // same verb, since what a designer adds there IS a link. What tells them
  // apart now is the Type field alone (the public toggle is gone from both).
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

describe('Refinement — the Updated stamp (2026-10-14)', () => {
  it('shows "Updated <date, time>" on a row the server has stamped, in the viewer\u2019s zone', async () => {
    mockEndpoint([demo({ updatedAt: '2026-10-14T15:51:11Z' })])
    render(<DemoPanel />)
    const tag = await screen.findByText(/^Updated \w{3} \d{1,2}, \d{1,2}:\d{2}/)
    expect(tag).toBeInTheDocument()
  })

  it('shows nothing for a record written before the field existed', async () => {
    // '' is how `normalise` reads an absent stamp. No "Updated" and no guess.
    mockEndpoint([demo({ updatedAt: '' })])
    render(<DemoPanel />)
    await screen.findByText('Study streak card — feat/streak')
    expect(screen.queryByText(/^Updated /)).toBeNull()
  })

  it('is stamped by the endpoint on every write, never taken from the client', () => {
    // Read from the real server source, the `isPublic` pattern above: the
    // stamp is `new Date().toISOString()` in `validateRecord`, which both the
    // create and the edit path run, and no `b.updatedAt` is ever read.
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).toMatch(/out\.updatedAt = new Date\(\)\.toISOString\(\)/)
    expect(board).not.toMatch(/b\.updatedAt/)
  })
})
