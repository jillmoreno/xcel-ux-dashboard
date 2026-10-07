import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ResearchPanel } from '@/components/prototype/LinksPanel'
import { ResearchRationalePage } from '@/pages/ResearchRationalePage'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import type { StoredLink } from '@/data/linkStore'

/**
 * Research — the third board (2026-10-07).
 *
 * The same panel and endpoint code as Links, so `Links.test.tsx` already
 * covers the URL allow-list, the empty states, the badge mechanism and the
 * form's focus trap. What is pinned HERE is what is specific to this board:
 *
 *   1. it talks to `/api/research`, the redirects route it, and the public
 *      build does not block it — the section is ungated;
 *   2. the handler can address ONE record when the id prefix equals the path
 *      segment (`/api/research/research-001`), which the greedy tail pattern
 *      got wrong — the only shared-code change this board needed;
 *   3. the section on the gateway is the board, not the old empty state, and
 *      `/research-rationale` lands on it.
 */

const here = dirname(fileURLToPath(import.meta.url))

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'research-001',
  title: 'Pacing study — five learners, Sept 2026',
  url: 'https://example.com/pacing-study',
  note: 'The finding that drove the goal row.',
  addedBy: 'Jill',
  type: 'reference',
  product: 'both',
  isPublic: false,
  addedDate: '2026-10-07',
  ...over,
})

function mockEndpoint(rows: StoredLink[]) {
  const calls: { method: string; url: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
      if (method !== 'GET') {
        return new Response(JSON.stringify({ link: row() }), {
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
  return { calls }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.doUnmock('../../netlify/lib/store')
})

/* ── the endpoint ─────────────────────────────────────────────────────────── */

describe('the research endpoint', () => {
  it('talks to /api/research, and the redirects route it', () => {
    const fn = readFileSync(resolve(here, '../../netlify/functions/research.ts'), 'utf8')
    expect(fn).toMatch(/path: \['\/api\/research', '\/api\/research\/:id'\]/)
    expect(fn).toMatch(/storeName: 'research'/)
    // Links' shape: a type taxonomy, no public flag, no product tag.
    expect(fn).toMatch(/types: ALLOWED_TYPES/)
    expect(fn).toMatch(/publicFlag: false/)
    expect(fn).toMatch(/products: false/)
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/research/*"')
    expect(toml).toContain('from = "/api/research"')
  })

  it('is NOT in the public build’s edge 404 list — the section is ungated', () => {
    const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
  })

  it('addresses one record when the id prefix equals the path segment', async () => {
    /*
     * `/api/research/research-001`. With a greedy `.*` the tail pattern matched
     * through the FIRST `/research/` and treated the id's own `research` as the
     * segment, leaving `-001` — a 400 on every GET / PUT / DELETE of one row.
     * Links and Demo never hit it (`link` ≠ `links`), so nothing else pinned it.
     * Driven through the real handler with the store mocked, because the bug is
     * in the routing, not the storage.
     */
    const stored = new Map<string, unknown>([['research-001', row()]])
    vi.doMock('../../netlify/lib/store', () => ({
      openStore: () => ({
        list: async () => ({ blobs: [...stored.keys()].map((key) => ({ key })) }),
        get: async (key: string) => stored.get(key) ?? null,
        setJSON: async (key: string, v: unknown) => void stored.set(key, v),
        delete: async (key: string) => void stored.delete(key),
      }),
    }))
    const { default: handler } = await import('../../netlify/functions/research')

    const one = await handler(new Request('https://x.test/api/research/research-001'))
    expect(one.status).toBe(200)
    expect(((await one.json()) as { link: StoredLink }).link.id).toBe('research-001')

    // The same path through the collection still allocates `research-NNN`.
    const made = await handler(
      new Request('https://x.test/api/research', {
        method: 'POST',
        body: JSON.stringify({ title: 'Survey', url: 'https://example.com/survey' }),
      }),
    )
    expect(made.status).toBe(201)
    expect(((await made.json()) as { link: StoredLink }).link.id).toBe('research-002')

    const gone = await handler(
      new Request('https://x.test/api/research/research-002', { method: 'DELETE' }),
    )
    expect(gone.status).toBe(200)
    expect(stored.has('research-002')).toBe(false)
  })
})

/* ── the panel ────────────────────────────────────────────────────────────── */

describe('ResearchPanel', () => {
  it('reads from and writes to its own endpoint, with the Type field and no public toggle', async () => {
    const user = userEvent.setup()
    const { calls } = mockEndpoint([row()])
    render(<ResearchPanel />)

    expect(await screen.findByRole('link', { name: /Pacing study/ })).toBeInTheDocument()
    expect(calls[0].url).toBe('/api/research')

    await user.click(screen.getByRole('button', { name: /Add link/ }))
    const dialog = await screen.findByRole('dialog')
    // Links' shape, not Refinement's.
    expect(within(dialog).getByLabelText(/^Type/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('switch', { name: 'Show on public site' })).not.toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Address'), 'https://example.com/interviews')
    await user.type(within(dialog).getByLabelText('Title'), 'Interview notes')
    // Scoped to the dialog: the page's own CTA says "Add link" too.
    await user.click(within(dialog).getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.url).toBe('/api/research')
    expect(post.body).toMatchObject({ title: 'Interview notes', url: 'https://example.com/interviews' })
  })
})

/* ── the gateway ──────────────────────────────────────────────────────────── */

describe('the Research section on the gateway', () => {
  const renderDashboard = (initialPath = '/') =>
    render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AccountProvider>
          <ThemeProvider>
            <UxDashboardPage />
          </ThemeProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('is the board, not the old empty state, and opens without a password', async () => {
    mockEndpoint([row({ title: 'Onboarding survey' })])
    renderDashboard('/?section=research')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Research' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Onboarding survey/ })).toBeInTheDocument()
    expect(screen.queryByText('No decisions log yet')).not.toBeInTheDocument()
  })

  it('the nav badge counts the board', async () => {
    mockEndpoint([row(), row({ id: 'research-002', title: 'Two' })])
    renderDashboard('/?section=research')
    const badge = () =>
      screen.getByRole('button', { name: /^Research/ }).textContent?.replace(/\D/g, '')
    await waitFor(() => expect(badge()).toBe('2'))
  })

  it('/research-rationale lands on the section', async () => {
    function At() {
      const { pathname, search } = useLocation()
      return <span data-testid="at">{pathname + search}</span>
    }
    render(
      <MemoryRouter initialEntries={['/research-rationale?appearance=dusk']}>
        <Routes>
          <Route path="/research-rationale" element={<ResearchRationalePage />} />
          <Route path="/" element={<At />} />
        </Routes>
      </MemoryRouter>,
    )
    const at = screen.getByTestId('at').textContent!
    expect(at.startsWith('/?')).toBe(true)
    const params = new URLSearchParams(at.slice(2))
    expect(params.get('section')).toBe('research')
    // The incoming query survives the hop, as it does on `/links`.
    expect(params.get('appearance')).toBe('dusk')
  })
})
