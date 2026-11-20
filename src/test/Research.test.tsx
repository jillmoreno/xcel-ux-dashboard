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
import { MAX_NOTE, type StoredLink } from '@/data/linkStore'
import { THUMB_ICON } from '@/components/prototype/GeneratedThumb'

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
  addedDate: '2026-10-07',
  updatedAt: '',
  archivedAt: '',
  archivedBy: '',
  feature: '',
  typeOther: '',
  supersedes: '',
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
  it('reads from and writes to its own endpoint, with no Type field and no public toggle', async () => {
    const user = userEvent.setup()
    const { calls } = mockEndpoint([row()])
    render(<ResearchPanel />)

    expect(await screen.findByRole('link', { name: /Pacing study/ })).toBeInTheDocument()
    expect(calls[0].url).toBe('/api/research')

    await user.click(screen.getByRole('button', { name: /Add link/ }))
    const dialog = await screen.findByRole('dialog')
    /* ⚠ `queryBy…not`, and it read `getBy…toBeInTheDocument` until 2026-11-20.
       Research took Links' shape when it was built, Type included; it is now
       a plain list of documents and asks no Type question — see
       `RESEARCH_PRESENTATION`. The public toggle was never here. */
    expect(within(dialog).queryByLabelText(/^Type/)).not.toBeInTheDocument()
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

/* ── Projects, and no type (2026-11-20) ──────────────────────────────────── */

describe('Research projects', () => {
  it('groups by project, and the field is called Project', async () => {
    /* The stored field is `feature` — the same one Refinement groups by. Only
       the word on the form differs, so a research link and a design chunk are
       not two mechanisms. */
    const user = userEvent.setup()
    mockEndpoint([
      row({ id: 'research-001', title: 'Interviews round 1', feature: 'Onboarding study' }),
      row({ id: 'research-002', title: 'Survey results', feature: 'Onboarding study' }),
    ])
    render(<ResearchPanel />)
    expect(await screen.findByText('Onboarding study')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Add link/i }))
    expect(screen.getByLabelText(/Project/)).toBeInTheDocument()
  })

  it('offers no Replaces control — closing one study with another is not what this board does', async () => {
    const user = userEvent.setup()
    mockEndpoint([row({ title: 'Round 1', feature: 'Onboarding study', addedBy: 'Jill' })])
    render(<ResearchPanel />)
    await screen.findByText('Round 1')
    await user.click(screen.getByRole('button', { name: /Add link/i }))
    expect(screen.queryByLabelText('Replaces')).toBeNull()
  })

  it('asks no Type question, and shows no filter strip', async () => {
    /* 2026-11-20: "I dont think we need filters. and I dont think we need
       type? This should be more of a simple list of documents." One flag
       (`showType`) carries all three — the control, the pills and the tag. */
    const user = userEvent.setup()
    mockEndpoint([row({ title: 'A study', type: 'reference' })])
    render(<ResearchPanel />)
    await screen.findByText('A study')
    expect(screen.queryByRole('group', { name: /Filter by type/i })).toBeNull()
    expect(screen.queryByText('Reference')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Add link/i }))
    expect(screen.queryByLabelText(/Type/)).toBeNull()
    expect(screen.queryByLabelText('Custom type')).toBeNull()
  })

  it('the other boards keep their type control', async () => {
    // The taxonomy is not gone, only unasked here. Resources still has it.
    const user = userEvent.setup()
    const { LinksPanel } = await import('@/components/prototype/LinksPanel')
    mockEndpoint([row({ title: 'A resource' })])
    render(<LinksPanel />)
    await screen.findByText('A resource')
    await user.click(screen.getByRole('button', { name: /Add link/i }))
    const opts = [...screen.getByLabelText(/Type/).querySelectorAll('option')].map((o) => o.textContent)
    expect(opts).toEqual(expect.arrayContaining(['Confluence', 'Figma', 'Document', 'Other\u2026']))
  })
})

/* ── The note field (2026-11-20) ──────────────────────────────────────────── */

describe('the note field', () => {
  const longNote = 'x'.repeat(620)

  it('is a textarea, so a pasted paragraph can be read back', async () => {
    const user = userEvent.setup()
    mockEndpoint([row()])
    render(<ResearchPanel />)
    await user.click(await screen.findByRole('button', { name: /Add link/i }))
    expect(screen.getByLabelText(/Note/).tagName).toBe('TEXTAREA')
  })

  it('trims to the cap and says how much it cut, in place of the old server refusal', async () => {
    /* Before today nothing client-side knew about MAX_NOTE: an over-long note
       was refused by the SERVER, after Save, and took the url and title down
       with it. The cut happens here now, and it is reported. */
    const user = userEvent.setup()
    mockEndpoint([row()])
    render(<ResearchPanel />)
    await user.click(await screen.findByRole('button', { name: /Add link/i }))
    const note = screen.getByLabelText(/Note/) as HTMLTextAreaElement
    await user.click(note)
    await user.paste(longNote)
    expect(note.value).toHaveLength(MAX_NOTE)
    expect(screen.getByText(/Cut off at 500 characters/)).toBeInTheDocument()
    expect(screen.getByText(/120 removed/)).toBeInTheDocument()
  })

  it('never blocks the save — a cut note is a shorter note, not an invalid one', async () => {
    const user = userEvent.setup()
    const { calls } = mockEndpoint([row()])
    render(<ResearchPanel />)
    await user.click(await screen.findByRole('button', { name: /Add link/i }))
    await user.type(screen.getByLabelText(/Address/i), 'https://example.com/x')
    await user.type(screen.getByLabelText(/Title/i), 'Cut note')
    await user.click(screen.getByLabelText(/Note/))
    await user.paste(longNote)

    const save = screen.getAllByRole('button', { name: /^Add link$/i }).at(-1)!
    expect(save).not.toBeDisabled()
    await user.click(save)
    await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true))
    const posted = calls.find((c) => c.method === 'POST')!.body as { note: string }
    expect(posted.note).toHaveLength(MAX_NOTE)
  })

  it('the warning clears once the note fits again', async () => {
    const user = userEvent.setup()
    mockEndpoint([row()])
    render(<ResearchPanel />)
    await user.click(await screen.findByRole('button', { name: /Add link/i }))
    const note = screen.getByLabelText(/Note/)
    await user.click(note)
    await user.paste(longNote)
    expect(screen.getByText(/Cut off at 500 characters/)).toBeInTheDocument()
    await user.clear(note)
    await user.type(note, 'short')
    expect(screen.queryByText(/Cut off at 500 characters/)).toBeNull()
  })
})

/* ── The compact row (2026-11-20) ─────────────────────────────────────────── */

describe('the Research row is compact', () => {
  it('draws an icon-sized tile, not the 160x110 panel', async () => {
    mockEndpoint([row({ title: 'A study' })])
    render(<ResearchPanel />)
    await screen.findByText('A study')
    const tile = document.querySelector('.cre-uxlinks-row a span[aria-hidden]') as HTMLElement
    expect(tile.style.width).toBe(`${THUMB_ICON}px`)
    expect(tile.style.height).toBe(`${THUMB_ICON}px`)
  })

  it('clamps the note to two lines — a quick summary, not the note', async () => {
    /* 2026-11-20. Clamped by LINES, not characters: a character count cuts at
       a different width on every row because the text is proportional. The
       stored note is untouched — only the row is short. */
    const longNote = 'Participants repeatedly missed the study plan entry point. '.repeat(8)
    mockEndpoint([row({ title: 'A study', note: longNote })])
    render(<ResearchPanel />)
    await screen.findByText('A study')
    const blurb = screen.getByText(longNote.trim()) as HTMLElement
    expect(blurb.style.webkitLineClamp).toBe('2')
    // and the full note is still there to be read when the row opens
    expect(blurb.textContent).toHaveLength(longNote.trim().length)
  })

  it('right-aligns the tags, against the chevron', async () => {
    /* "shift these tags to the right, closer to the chevron so there is more
       text for the copy". The column is narrower AND the tags sit at its end;
       left-aligned in a narrower column would just move them left. */
    mockEndpoint([row({ title: 'A study', addedBy: 'Jill' })])
    render(<ResearchPanel />)
    await screen.findByText('A study')
    const tag = screen.getByText('Added 2026-10-07')
    expect((tag as HTMLElement).style.justifySelf).toBe('end')
  })

  it('leaves the other boards alone', async () => {
    // compactRows is Research's flag. Refinement rows keep the full tile and
    // the full tag column — nothing about those boards changed.
    const { LinksPanel } = await import('@/components/prototype/LinksPanel')
    mockEndpoint([row({ title: 'A resource' })])
    render(<LinksPanel />)
    await screen.findByText('A resource')
    const tile = document.querySelector('.cre-uxlinks-row a span[aria-hidden]') as HTMLElement
    expect(tile.style.width).toBe('160px')
  })
})
