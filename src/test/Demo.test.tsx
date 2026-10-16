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
  archivedAt: '',
  archivedBy: '',
  feature: '',
  supersedes: '',
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

/* ── designer pills and the archive (2026-10-15) ─────────────────────────── */

/**
 * Jillienne, on the preview, the day the Designers group was retired: "i want
 * these quick filter pills to be based on the Designers name. I also want the
 * refinement ellipsis to have an archive option. This will simply hide them
 * from the main view, there will be a separate link button top right to Show
 * Archive." Eight follow-up calls, pinned here: the roster (not the names on
 * the board) is the pill set and the Added by choices; the product stays as the
 * tag; Refinement only; Archive sits beside Remove; the archive is stamped
 * with who and when; anyone can unarchive; the branch strip hides an archived
 * build; the nav count excludes archived rows.
 */
describe('Refinement — designer pills and the archive (2026-10-15)', () => {
  /** A store whose PUT actually flips the archive state, so the re-read after
   *  a write shows the row where it now belongs. */
  function liveEndpoint(initial: StoredLink[]) {
    const rows = [...initial]
    const writes: { method: string; url: string; body: Record<string, unknown> }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: unknown, init?: RequestInit) => {
        const url = String(input)
        const method = init?.method ?? 'GET'
        const ok = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
        if (method === 'PUT') {
          const body = JSON.parse(String(init?.body)) as Record<string, unknown>
          writes.push({ method, url, body })
          const id = decodeURIComponent(url.split('/').pop() ?? '')
          const i = rows.findIndex((r) => r.id === id)
          const archived = body.archived === true
          rows[i] = {
            ...rows[i],
            archivedAt: archived ? rows[i].archivedAt || '2026-10-15T12:00:00.000Z' : '',
            archivedBy: archived ? String(body.archivedBy ?? '') : '',
          }
          return ok({ link: rows[i] })
        }
        if (method !== 'GET') {
          writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : {} })
          return ok({ link: demo() }, 201)
        }
        return ok({ links: rows })
      }),
    )
    return { writes, rows }
  }

  const pills = () =>
    within(screen.getByRole('group', { name: 'Filter by designer' }))
      .getAllByRole('button')
      .map((b) => b.textContent)

  it('offers the roster as pills — every name, in order — and no product pills', async () => {
    mockEndpoint([demo()])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(pills()).toEqual(['All', 'Jill', 'Anjani', 'Eric', 'Afsana', 'Cody'])
    expect(screen.queryByRole('group', { name: 'Filter by product' })).toBeNull()
  })

  it('filters on the typed Added by, loosely — "eric w" and "Afsana & Eric" are both Eric', async () => {
    const user = userEvent.setup()
    mockEndpoint([
      demo({ id: 'demo-001', title: 'Eric’s rail', addedBy: 'eric w' }),
      demo({ id: 'demo-002', title: 'Anjani’s landing', addedBy: 'Anjani' }),
      demo({ id: 'demo-003', title: 'Shared checkout', addedBy: 'Afsana & Eric' }),
    ])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('3 links')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Eric' }))
    expect(screen.getByText('Eric’s rail')).toBeInTheDocument()
    expect(screen.getByText('Shared checkout')).toBeInTheDocument()
    expect(screen.queryByText('Anjani’s landing')).not.toBeInTheDocument()
    expect(screen.getByText('2 links')).toBeInTheDocument()

    // A shared row sits under both of its names.
    await user.click(screen.getByRole('button', { name: 'Afsana' }))
    expect(screen.getByText('Shared checkout')).toBeInTheDocument()
    expect(screen.queryByText('Eric’s rail')).not.toBeInTheDocument()

    // Clicking the active pill clears it.
    await user.click(screen.getByRole('button', { name: 'Afsana' }))
    expect(screen.getByText('3 links')).toBeInTheDocument()
  })

  it('keeps the product as the tag on the row', async () => {
    mockEndpoint([demo({ product: 'compass' })])
    const { container } = render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    const tags = [...container.querySelectorAll('ul span')].map((el) => el.textContent?.trim())
    expect(tags).toContain('Compass')
  })

  it('Added by is a choice from the roster, with a legacy name kept as its own option', async () => {
    const user = userEvent.setup()
    mockEndpoint([demo({ addedBy: 'Sam' })])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Add link' }))
    const field = await screen.findByLabelText(/Added by/)
    expect(field.tagName).toBe('SELECT')
    const options = [...(field as HTMLSelectElement).options].map((o) => o.value)
    expect(options).toEqual(['', 'Jill', 'Anjani', 'Eric', 'Afsana', 'Cody'])
    await user.keyboard('{Escape}')

    // Editing Sam's row does not silently reassign it: Sam is an option there.
    await user.click(screen.getByRole('button', { name: /^Actions for / }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const edit = (await screen.findByLabelText(/Added by/)) as HTMLSelectElement
    expect(edit.value).toBe('Sam')
    expect([...edit.options].map((o) => o.value)).toContain('Sam')
  })

  it('Resources keeps the free-text field and no designer pills', async () => {
    const user = userEvent.setup()
    mockEndpoint([])
    render(<LinksPanel />)
    await user.click(await screen.findByRole('button', { name: 'Add the first link' }))
    expect((await screen.findByLabelText(/Added by/)).tagName).toBe('INPUT')
    expect(screen.queryByRole('group', { name: 'Filter by designer' })).toBeNull()
  })

  it('Archive hides the row, Show archive lists it with who and when, Unarchive puts it back', async () => {
    const user = userEvent.setup()
    localStorage.setItem('cgp.links.lastAuthor', 'Jill')
    const { writes } = liveEndpoint([
      demo({ id: 'demo-001', title: 'Keep me' }),
      demo({ id: 'demo-002', title: 'Hide me' }),
    ])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    // No door until something is archived.
    expect(screen.queryByRole('button', { name: /Show archive/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Actions for Hide me' }))
    const menu = await screen.findByRole('menu')
    // Archive sits beside Remove, not instead of it.
    expect(within(menu).getByRole('menuitem', { name: 'Archive' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Remove' })).toBeInTheDocument()
    await user.click(within(menu).getByRole('menuitem', { name: 'Archive' }))

    // A SAVE with the intent and the label; the stamp is the server's.
    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].url).toBe('/api/demos/demo-002')
    expect(writes[0].body.archived).toBe(true)
    expect(writes[0].body.archivedBy).toBe('Jill')
    expect(writes[0].body).not.toHaveProperty('archivedAt', expect.stringMatching(/\d/))

    // Hidden from the board, counted in the door.
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByText('Hide me')).not.toBeInTheDocument()
    expect(screen.getByText('Keep me')).toBeInTheDocument()
    const door = screen.getByRole('button', { name: 'Show archive · 1' })

    // The archive view: the hidden row, its stamp, no Add button, a way back.
    await user.click(door)
    expect(screen.getByText('Hide me')).toBeInTheDocument()
    expect(screen.queryByText('Keep me')).not.toBeInTheDocument()
    expect(screen.getByText(/^Archived .*· Jill$/)).toBeInTheDocument()
    expect(screen.getByText('1 link hidden from the board. Unarchive one to put it back.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add link' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Back to board' })).toBeInTheDocument()

    // Anyone can unarchive — no owner check, the same kebab.
    await user.click(screen.getByRole('button', { name: 'Actions for Hide me' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Unarchive' }))
    await waitFor(() => expect(writes).toHaveLength(2))
    expect(writes[1].body.archived).toBe(false)
    expect(writes[1].body.archivedBy).toBe('')
    await waitFor(() => expect(screen.getByText('No archived links.')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Back to board' }))
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    expect(screen.getByText('Hide me')).toBeInTheDocument()
  })

  it('editing an archived row carries its archive state through, so a save does not un-archive it', async () => {
    const user = userEvent.setup()
    const { writes } = liveEndpoint([
      demo({ id: 'demo-001', title: 'Live one' }),
      demo({ id: 'demo-002', title: 'Old one', archivedAt: '2026-10-10T09:00:00.000Z', archivedBy: 'Eric' }),
    ])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Show archive · 1' }))
    await user.click(screen.getByRole('button', { name: 'Actions for Old one' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    await user.click(await screen.findByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].body.archived).toBe(true)
    expect(writes[0].body.archivedAt).toBe('2026-10-10T09:00:00.000Z')
    expect(writes[0].body.archivedBy).toBe('Eric')
  })

  it('the nav count excludes archived rows', async () => {
    mockEndpoint([demo({ id: 'demo-001' }), demo({ id: 'demo-002', archivedAt: '2026-10-15T12:00:00.000Z' })])
    const { useDemoCount } = await import('@/data/demoStore')
    function Probe() {
      return <output>{useDemoCount()}</output>
    }
    render(<Probe />)
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1'))
  })

  it('the branch strip still treats an archived row’s URL as "already on the board"', () => {
    // Source-level: `boardUrls` is read from the UNFILTERED index, which holds
    // archived rows too, and the comment beside it says why. A strip that
    // offered an archived branch straight back would undo the click.
    const panel = readFileSync(resolve(here, '../../src/components/prototype/LinksPanel.tsx'), 'utf8')
    expect(panel).toMatch(/const boardUrls = useMemo\(\(\) => index\.links\.map\(\(l\) => l\.url\)/)
  })

  it('the endpoint stamps archivedAt itself, keeps the one it is handed, and only on Refinement', () => {
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).toMatch(/if \(cfg\.archivable\)/)
    expect(board).toMatch(/out\.archivedAt = archived \? \(ISO_STAMP\.test\(prior\) \? prior : new Date\(\)\.toISOString\(\)\) : ''/)
    const fn = (name: string) => readFileSync(resolve(here, `../../netlify/functions/${name}.ts`), 'utf8')
    expect(fn('demos')).toMatch(/archivable: true/)
    for (const other of ['links', 'research', 'prds']) expect(fn(other)).toMatch(/archivable: false/)
  })
})
