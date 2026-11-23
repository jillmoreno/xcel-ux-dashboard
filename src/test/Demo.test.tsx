import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel } from '@/components/prototype/LinksPanel'
import type { StoredLink } from '@/data/linkStore'

/**
 * 2026-11-21: the board is DESIGN now (still section id `demo`) and matches
 * Research — no product tag or control, no feature grouping, no "Show hidden"
 * door (archived rows are on the Hub's Archive page), Cody off the roster.
 * The pins for the product tag, the Both default and the in-board archive
 * view were removed; the old tests live on the `hub-advanced` branch.
 *
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
  typeOther: '',
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

  /* The `prefill` case — the Add form opened from the `promote-to-refinement`
     hand-off (`?section=demo&add=1&url=…`) — stood here until 2026-11-21. The
     hand-off is gone with the advanced Hub; `share-my-work` hands back a link
     to paste. On `hub-advanced`. */
})

/* The "LinksPanel keeps its own shape" block stood here — Resources went with
   the advanced Hub on 2026-11-21 (`resources-section`). The shared panel's
   own cases are in `LinkBoard.test.tsx`. */

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
 * Archive." The follow-up calls still pinned here: the roster (not the names
 * on the board) is the pill set and the Added by choices; Archive sits beside
 * Remove; the archive is stamped with who and when; anyone can unarchive; the
 * nav count excludes archived rows. Since 2026-11-21 the "separate link button
 * top right" is the Hub's Archive page, which mounts this panel in
 * `archiveView`; the product tag is gone.
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
    expect(pills()).toEqual(['All', 'Jill', 'Anjani', 'Eric', 'Afsana'])
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

  it('Added by is a choice from the roster, with a legacy name kept as its own option', async () => {
    const user = userEvent.setup()
    mockEndpoint([demo({ addedBy: 'Sam' })])
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Add link' }))
    const field = await screen.findByLabelText(/Added by/)
    expect(field.tagName).toBe('SELECT')
    const options = [...(field as HTMLSelectElement).options].map((o) => o.value)
    expect(options).toEqual(['', 'Jill', 'Anjani', 'Eric', 'Afsana'])
    await user.keyboard('{Escape}')

    // Editing Sam's row does not silently reassign it: Sam is an option there.
    await user.click(screen.getByRole('button', { name: /^Actions for / }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    const edit = (await screen.findByLabelText(/Added by/)) as HTMLSelectElement
    expect(edit.value).toBe('Sam')
    expect([...edit.options].map((o) => o.value)).toContain('Sam')
  })

  // ("Resources keeps the free-text field and no designer pills" stood here;
  // Research and PRDs keep that shape, pinned in `LinkBoard.test.tsx`.)

  it('Archive takes the row off the board, the Archive page lists it with who and when, Unarchive puts it back', async () => {
    const user = userEvent.setup()
    localStorage.setItem('cgp.links.lastAuthor', 'Jill')
    const { writes } = liveEndpoint([
      demo({ id: 'demo-001', title: 'Keep me' }),
      demo({ id: 'demo-002', title: 'Archive me' }),
    ])
    const board = render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    // No door on the board (2026-11-21): the archive is a page, not a view.
    expect(screen.queryByRole('button', { name: /Show hidden|Show archive/ })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Actions for Archive me' }))
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

    // Off the board.
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByText('Archive me')).not.toBeInTheDocument()
    expect(screen.getByText('Keep me')).toBeInTheDocument()
    board.unmount()

    // The Archive page's view of this board: the heading, the archived row
    // with its stamp (worded the way the kebab is), no live row, no Add.
    const page = render(<DemoPanel archiveView={{ title: 'Design' }} />)
    expect(await screen.findByRole('heading', { name: 'Design' })).toBeInTheDocument()
    expect(screen.getByText('Archive me')).toBeInTheDocument()
    expect(screen.queryByText('Keep me')).not.toBeInTheDocument()
    expect(screen.getByText(/^Archived .*· Jill$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Add/ })).toBeNull()

    // Anyone can unarchive — no owner check, the same kebab.
    await user.click(screen.getByRole('button', { name: 'Actions for Archive me' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Unarchive' }))
    await waitFor(() => expect(writes).toHaveLength(2))
    expect(writes[1].body.archived).toBe(false)
    expect(writes[1].body.archivedBy).toBe('')
    // Nothing archived → the page draws nothing for this board.
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Design' })).toBeNull())
    page.unmount()

    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    expect(screen.getByText('Archive me')).toBeInTheDocument()
  })

  it('editing an archived row carries its archive state through, so a save does not un-archive it', async () => {
    const user = userEvent.setup()
    const { writes } = liveEndpoint([
      demo({ id: 'demo-001', title: 'Live one' }),
      demo({ id: 'demo-002', title: 'Old one', archivedAt: '2026-10-10T09:00:00.000Z', archivedBy: 'Eric' }),
    ])
    // An archived row is reached through the Archive page's view (2026-11-21).
    render(<DemoPanel archiveView={{ title: 'Design' }} />)
    await user.click(await screen.findByRole('button', { name: 'Actions for Old one' }))
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

  // (The "branch strip is gone" source check stood here. The strip became
  // the derived Design section on 2026-11-16, and that went with the
  // advanced Hub on 2026-11-21 — `derived-design-section`.)

  it('the endpoint stamps archivedAt itself, keeps the one it is handed, on Design, Research and PRDs', () => {
    const board = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    expect(board).toMatch(/if \(cfg\.archivable\)/)
    expect(board).toMatch(/out\.archivedAt = archived \? \(ISO_STAMP\.test\(prior\) \? prior : new Date\(\)\.toISOString\(\)\) : ''/)
    const fn = (name: string) => readFileSync(resolve(here, `../../netlify/functions/${name}.ts`), 'utf8')
    for (const board of ['demos', 'research', 'prds']) expect(fn(board)).toMatch(/archivable: true/)
  })
})
