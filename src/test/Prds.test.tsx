import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrdsPanel } from '@/components/prototype/LinksPanel'
import { PrdsPage } from '@/pages/PrdsPage'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import type { StoredLink } from '@/data/linkStore'

/**
 * PRDs — the fourth board (2026-10-07), Research's twin.
 *
 * `Links.test.tsx` covers the shared panel and `Research.test.tsx` the shared
 * handler's one routing fix, so what is pinned here is only what is this
 * board's own: its endpoint and redirects, that the panel reads and writes
 * `/api/prds` in Links' shape, and that the section is on the gateway with a
 * live badge and a `/prds` door.
 */

const here = dirname(fileURLToPath(import.meta.url))

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'prd-001',
  title: 'Study Pace — PRD v2',
  url: 'https://example.com/prd/study-pace',
  note: 'The requirements the pace panel answers.',
  addedBy: 'Jill',
  type: 'brief',
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
})

describe('the prds endpoint', () => {
  it('talks to /api/prds, and the redirects route it', () => {
    const fn = readFileSync(resolve(here, '../../netlify/functions/prds.ts'), 'utf8')
    expect(fn).toMatch(/path: \['\/api\/prds', '\/api\/prds\/:id'\]/)
    expect(fn).toMatch(/storeName: 'prds'/)
    expect(fn).toMatch(/idPrefix: 'prd'/)
    // Links' shape: a type taxonomy, no public flag, no product tag.
    expect(fn).toMatch(/types: ALLOWED_TYPES/)
    expect(fn).toMatch(/publicFlag: false/)
    expect(fn).toMatch(/products: false/)
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/prds/*"')
    expect(toml).toContain('from = "/api/prds"')
  })

  it('is NOT in the public build’s edge 404 list — the section is ungated', () => {
    const script = readFileSync(resolve(here, '../../scripts/public-redirects.mjs'), 'utf8')
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
  })
})

describe('PrdsPanel', () => {
  it('reads from and writes to its own endpoint, with the Type field and no public toggle', async () => {
    const user = userEvent.setup()
    const { calls } = mockEndpoint([row()])
    render(<PrdsPanel />)

    expect(await screen.findByRole('link', { name: /Study Pace — PRD v2/ })).toBeInTheDocument()
    expect(calls[0].url).toBe('/api/prds')

    await user.click(screen.getByRole('button', { name: /Add link/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText(/^Type/)).toBeInTheDocument()
    expect(within(dialog).queryByRole('switch', { name: 'Show on public site' })).not.toBeInTheDocument()

    await user.type(within(dialog).getByLabelText('Address'), 'https://example.com/prd/readiness')
    await user.type(within(dialog).getByLabelText('Title'), 'Readiness PRD')
    await user.click(within(dialog).getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    const post = calls.find((c) => c.method === 'POST')!
    expect(post.url).toBe('/api/prds')
    expect(post.body).toMatchObject({ title: 'Readiness PRD', url: 'https://example.com/prd/readiness' })
  })
})

describe('the PRDs section on the gateway', () => {
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

  it('opens without a password, directly after Resources, and lists the board', async () => {
    mockEndpoint([row({ title: 'Onboarding PRD' })])
    renderDashboard('/?section=prds')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'PRDs' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Onboarding PRD/ })).toBeInTheDocument()

    // After Resources, inside the open group — the Links suite pins the four
    // before it, so this only has to pin the one that follows.
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.replace(/\d+$/, '').trim())
    const linksAt = labels.indexOf('Resources')
    expect(linksAt).toBeGreaterThanOrEqual(0)
    expect(labels[linksAt + 1]).toBe('PRDs')
  })

  it('the nav badge counts the board', async () => {
    mockEndpoint([row(), row({ id: 'prd-002', title: 'Two' })])
    renderDashboard('/?section=prds')
    const badge = () => screen.getByRole('button', { name: /^PRDs/ }).textContent?.replace(/\D/g, '')
    await waitFor(() => expect(badge()).toBe('2'))
  })

  it('/prds lands on the section', () => {
    function At() {
      const { pathname, search } = useLocation()
      return <span data-testid="at">{pathname + search}</span>
    }
    render(
      <MemoryRouter initialEntries={['/prds?appearance=dusk']}>
        <Routes>
          <Route path="/prds" element={<PrdsPage />} />
          <Route path="/" element={<At />} />
        </Routes>
      </MemoryRouter>,
    )
    const at = screen.getByTestId('at').textContent!
    const params = new URLSearchParams(at.slice(2))
    expect(params.get('section')).toBe('prds')
    expect(params.get('appearance')).toBe('dusk')
  })
})
