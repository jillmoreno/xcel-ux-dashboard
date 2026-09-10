/**
 * Links — the section that is authored on the page, not in the repo.
 *
 * Three groups of assertions, and the FIRST is the one that matters most:
 *
 * 1. Every stored URL is rendered as an `<a href>`, so an unsafe scheme in the
 *    store is code execution in this origin. The guard is an allow-list at BOTH
 *    boundaries — the endpoint on the way in, `safeHref` at render — and these
 *    tests pin both, including a source-level check that the endpoint's list has
 *    not quietly become a blocklist. Following `smoke-desktop.mjs`, the check
 *    parses the real declared value out of the file rather than a copy of it
 *    that can drift.
 * 2. The section is UNGATED, beside Demo. That is an editorial decision about
 *    what a passwordless viewer can reach, so it should fail a test if it
 *    changes rather than change by accident — the same reasoning as the
 *    "Demo holds exactly the rows meant to be ungated" test.
 * 3. The panel hides its composer when there is no endpoint, rather than
 *    offering an Add button that fails on click.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LinksPanel } from '@/components/prototype/LinksPanel'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import {
  draftProblems,
  hostOf,
  safeHref,
  toMarkdown,
  type StoredLink,
} from '@/data/linkStore'

/* ── helpers ──────────────────────────────────────────────────────────────── */

const link = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'link-001',
  title: 'FinServ Learner Brief',
  url: 'https://example.com/brief',
  note: '',
  addedDate: '2026-09-10',
  ...over,
})

/** A fetch that answers the collection endpoint and records writes. */
function mockEndpoint(links: StoredLink[]) {
  const writes: { method: string; url: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (method !== 'GET') {
      writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
      return new Response(JSON.stringify({ link: link() }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ links }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { writes, fetchMock }
}

/** No endpoint at all — what plain `npm run dev` looks like. */
function mockNoEndpoint() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }),
  )
}

/** A misrouted request: the SPA fallback answers with index.html and a 200.
 *  This is why `listLinks` checks the content type before parsing. */
function mockSpaFallback() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('<!doctype html><title>app</title>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
    ),
  )
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/* ── 1. the scheme allow-list ─────────────────────────────────────────────── */

describe('a stored URL cannot become script', () => {
  it('safeHref allows only http and https', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a')
    expect(safeHref('http://example.com/a')).toBe('http://example.com/a')

    // The whole reason this function exists. An href is an execution context.
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('JavaScript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    // Not dangerous, but not a destination a reviewer can be sent to either.
    expect(safeHref('file:///etc/passwd')).toBeNull()
    expect(safeHref('not a url')).toBeNull()
    expect(safeHref('')).toBeNull()
  })

  it('renders an unsafe stored URL as TEXT, with no anchor', async () => {
    // Defence in depth: the endpoint rejects this on the way in, so reaching
    // this state means a record predates the check or arrived another way. It
    // must still not link — and it must still be VISIBLE, so it can be found
    // and fixed rather than silently disappearing from the list.
    mockEndpoint([link({ url: 'javascript:alert(1)', title: 'Sketchy' })])
    render(<LinksPanel />)

    await waitFor(() => expect(screen.getByText('Sketchy')).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /Sketchy/ })).not.toBeInTheDocument()
    expect(screen.getByText(/not a linkable address/)).toBeInTheDocument()
  })

  it('the endpoint declares the same allow-list, and it is a list of ALLOWED schemes', () => {
    // Parsed out of the real file rather than duplicated here, so this tracks
    // the endpoint instead of a copy that can drift. A blocklist would pass a
    // naive "does it mention javascript" check while being one novel scheme
    // away from wrong, so what is asserted is the SHAPE: an allow-list naming
    // exactly the two protocols `safeHref` accepts.
    const src = readFileSync(
      path.resolve(__dirname, '../../netlify/functions/links.ts'),
      'utf8',
    )
    const declared = /const ALLOWED_PROTOCOLS = \[([^\]]*)\]/.exec(src)
    expect(declared, 'links.ts must declare ALLOWED_PROTOCOLS').toBeTruthy()
    const protocols = [...declared![1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(protocols).toEqual(['http:', 'https:'])

    // And it is applied by INCLUSION, not by excluding known-bad schemes.
    expect(src).toMatch(/ALLOWED_PROTOCOLS\.includes\(/)
  })
})

/* ── the draft check ──────────────────────────────────────────────────────── */

describe('draftProblems', () => {
  it('requires a title and a full address', () => {
    expect(draftProblems({ title: '', url: '', note: '' })).toEqual([
      'Give the link a title.',
      'Paste the address.',
    ])
    expect(draftProblems({ title: '  ', url: 'https://a.example', note: '' })).toEqual([
      'Give the link a title.',
    ])
    // A bare host is the most likely paste, and the message says what is wrong.
    expect(draftProblems({ title: 'A', url: 'example.com', note: '' })).toEqual([
      'That needs to be a full address starting with http:// or https://.',
    ])
    expect(draftProblems({ title: 'A', url: 'javascript:alert(1)', note: '' })).toHaveLength(1)
    expect(draftProblems({ title: 'A', url: 'https://a.example', note: '' })).toEqual([])
  })
})

describe('display helpers', () => {
  it('hostOf strips www and falls back to the raw value', () => {
    expect(hostOf('https://www.xcelsolutions.com/resources')).toBe('xcelsolutions.com')
    expect(hostOf('https://docs.google.com/a/b')).toBe('docs.google.com')
    // Falls back rather than throwing, so an unparseable value still renders.
    expect(hostOf('nonsense')).toBe('nonsense')
  })

  it('toMarkdown is the way out of a store nothing backs up', () => {
    expect(
      toMarkdown([
        link({ id: 'link-001', title: 'Brief', url: 'https://a.example' }),
        link({ id: 'link-002', title: 'Board', url: 'https://b.example', note: 'Sprint 4' }),
      ]),
    ).toBe('- [Brief](https://a.example)\n- [Board](https://b.example) — Sprint 4')
  })
})

/* ── 3. the panel ─────────────────────────────────────────────────────────── */

describe('LinksPanel', () => {
  it('lists stored links, and each one opens in a new tab', async () => {
    mockEndpoint([
      link({ id: 'link-001', title: 'Wireframe Brief', url: 'https://a.example/brief' }),
      link({ id: 'link-002', title: 'Figma — Alerts', url: 'https://b.example/file', note: 'Node 4:287' }),
    ])
    render(<LinksPanel />)

    const first = await screen.findByRole('link', { name: /Wireframe Brief/ })
    expect(first).toHaveAttribute('href', 'https://a.example/brief')
    expect(first).toHaveAttribute('target', '_blank')
    // Without noreferrer the opened page gets a handle on this one.
    expect(first).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /Figma — Alerts/ })).toBeInTheDocument()
    expect(screen.getByText('Node 4:287')).toBeInTheDocument()
  })

  it('posts a new link to the endpoint', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<LinksPanel />)

    await waitFor(() => expect(screen.getByLabelText('Address')).toBeInTheDocument())
    await user.type(screen.getByLabelText('Address'), 'https://xcelsolutions.com/resources')
    await user.type(screen.getByLabelText('Title'), 'Resource Center')
    await user.click(screen.getByRole('button', { name: /Add link/ }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].method).toBe('POST')
    expect(writes[0].url).toBe('/api/links')
    expect(writes[0].body).toMatchObject({
      title: 'Resource Center',
      url: 'https://xcelsolutions.com/resources',
    })
  })

  it('reports a bad address WITHOUT a round trip', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<LinksPanel />)

    await waitFor(() => expect(screen.getByLabelText('Address')).toBeInTheDocument())
    await user.type(screen.getByLabelText('Address'), 'example.com')
    await user.type(screen.getByLabelText('Title'), 'Bare host')
    await user.click(screen.getByRole('button', { name: /Add link/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/full address/)
    expect(writes).toHaveLength(0)
  })

  it('hides the composer when there is no endpoint, and says why', async () => {
    // The alternative — an Add button that throws on click — is the defect this
    // asserts against. `available` and `loading` are separate flags so this
    // message is not claimed for the tick before the fetch settles.
    mockNoEndpoint()
    render(<LinksPanel />)

    expect(await screen.findByText(/authoring endpoint is not reachable/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add link/ })).not.toBeInTheDocument()
  })

  it('treats an HTML answer as no endpoint rather than parsing it', async () => {
    // The SPA fallback returns index.html with a 200 for an unknown path, so a
    // misrouted request looks like a success. Parsing it throws, which reads as
    // a broken page instead of a missing backend.
    mockSpaFallback()
    render(<LinksPanel />)

    expect(await screen.findByText(/authoring endpoint is not reachable/)).toBeInTheDocument()
  })

  it('shows no search field until the list is long enough to need one', async () => {
    mockEndpoint([link()])
    render(<LinksPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByLabelText('Search links')).not.toBeInTheDocument()

    vi.unstubAllGlobals()
    mockEndpoint(
      Array.from({ length: 6 }, (_, i) =>
        link({ id: `link-00${i + 1}`, title: `Link ${i + 1}`, addedDate: '2026-09-10' }),
      ),
    )
    render(<LinksPanel />)
    expect(await screen.findByLabelText('Search links')).toBeInTheDocument()
  })
})

/* ── 2. the section is ungated ────────────────────────────────────────────── */

describe('the Links section on the gateway', () => {
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

  it('opens with NO password prompt, and sits directly under Demo', async () => {
    /*
     * Both halves are the editorial decision. Links is ungated because the
     * section's job is being the place you send someone — behind the shared
     * Design & Development password it would be a private bookmark file. The
     * consequence is that a link added here is reachable by a passwordless
     * viewer, which is the same consideration the "Demo holds exactly the rows
     * meant to be ungated" test guards for Demo's rows. Gating it later should
     * fail here and be re-decided.
     */
    const user = userEvent.setup()
    mockEndpoint([])
    renderDashboard()

    await user.click(screen.getByRole('button', { name: /^Links/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Links' })).toBeInTheDocument()

    // Position: the nav item immediately after Demo. Order carries the argument
    // that this belongs with the open front door rather than with the gated
    // pipeline sections.
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent?.replace(/\d+$/, '').trim())
    const demoAt = labels.indexOf('Demo')
    expect(demoAt).toBeGreaterThanOrEqual(0)
    expect(labels[demoAt + 1]).toBe('Links')
  })

  it('a deep link into the section opens it', async () => {
    mockEndpoint([link({ title: 'Wireframe Brief' })])
    renderDashboard('/?section=links')
    expect(await screen.findByRole('link', { name: /Wireframe Brief/ })).toBeInTheDocument()
  })

  it('the nav badge follows the list, not just the first fetch', async () => {
    /*
     * This shipped wrong: the rail said 2 with three links on screen, because
     * `useLinkCount` fetched once on mount and never re-read. It is the same
     * defect the QA badge's own comment describes ("the rail said 18 while the
     * page said 19") and it is invisible until someone adds a link — which is
     * the first thing anyone does on this page.
     *
     * Asserted through the REAL nav button rather than by calling the hook, so
     * what is pinned is what a reviewer sees.
     */
    const user = userEvent.setup()
    // Held by reference: `mockEndpoint` closes over this array and answers GET
    // from it, so pushing to it stands in for the server having the record.
    const stored: StoredLink[] = []
    const { writes } = mockEndpoint(stored)
    renderDashboard('/?section=links')

    const badge = () =>
      screen.getByRole('button', { name: /^Links/ }).textContent?.replace(/\D/g, '')
    await waitFor(() => expect(badge()).toBe('0'))

    await user.type(screen.getByLabelText('Address'), 'https://a.example/one')
    await user.type(screen.getByLabelText('Title'), 'One')
    stored.push(link({ id: 'link-001', title: 'One', url: 'https://a.example/one' }))
    await user.click(screen.getByRole('button', { name: /Add link/ }))

    await waitFor(() => expect(writes).toHaveLength(1))
    await waitFor(() => expect(badge()).toBe('1'))
  })

  it('does not add a row to the Demo section', async () => {
    // Links is a nav SECTION, not a `PROTOTYPE_FEATURES` row, so Demo's own
    // set is untouched — which is what keeps its two-directional smoke test
    // meaningful rather than needing an edit for every new section.
    mockEndpoint([])
    renderDashboard()
    const rows = screen
      .getAllByRole('button', { name: /^Actions for / })
      .map((b) => b.getAttribute('aria-label')?.replace(/^Actions for /, ''))
    expect(rows).toEqual(['XCEL Dashboard — Live Product Build'])
  })
})
