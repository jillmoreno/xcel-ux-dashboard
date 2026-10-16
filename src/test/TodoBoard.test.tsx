import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/dom'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TodoBoardPanel } from '@/components/prototype/TodoBoardPanel'
import {
  cardsInColumn,
  positionForDrop,
  toMarkdown,
  type TodoCard,
  type TodoPerson,
} from '@/data/todoBoardStore'

/**
 * The To Do Board — the gateway's fifth surface authored in the browser.
 *
 * What is pinned here is what would be expensive to find out later:
 *
 *   the WIRING — the endpoint's paths, the two redirects that route them, and
 *   the three lists the client and the server each declare separately because
 *   the function is a trust boundary (columns, the auto-assign owner, the
 *   seeded roster). A drift there is silent: cards normalise into To Do, or
 *   the roster seeds with somebody who is not on the team;
 *
 *   the HANDOFF RULE, in both directions — the column hides its owner picker,
 *   and a card moved into it is sent as Jillienne's;
 *
 *   the ORDERING maths, which is the one piece of real logic on the client
 *   (`positionForDrop`), tested on data built in the test rather than on a
 *   fixture row — the `ProgressFillTones` shape `docs/testing.md` asks for;
 *
 *   the CASCADE CONFIRMATION, which names a count that has to be right.
 *
 * Drag-and-drop is exercised through `fireEvent` with a stub `dataTransfer`:
 * jsdom has no drag implementation, so what this proves is that the handlers
 * compute and send the right move — not that a pointer can perform it. The
 * kebab's "Move to …" path is the same write, which is also the keyboard
 * route, and it is asserted beside it.
 */

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const card = (over: Partial<TodoCard> = {}): TodoCard => ({
  id: 'card-001',
  title: 'Compass — review-recap empty state',
  note: 'Design the empty state for a learner with no recaps yet.',
  owner: 'Anjani',
  column: 'todo',
  position: 1,
  addedDate: '2026-10-15',
  updatedAt: '2026-10-15T09:00:00.000Z',
  ...over,
})

const person = (over: Partial<TodoPerson> = {}): TodoPerson => ({
  id: 'person-001',
  name: 'Jillienne',
  hue: 'teal',
  addedDate: '2026-10-15',
  ...over,
})

const ROSTER: TodoPerson[] = [
  person(),
  person({ id: 'person-002', name: 'Anjani', hue: 'gold' }),
  person({ id: 'person-003', name: 'Eric', hue: 'blue' }),
]

/** The endpoint, as the panel sees it: a GET of the whole board, and a
 *  recorder for every write so a test can assert what was sent. */
function mockBoard(cards: TodoCard[], people: TodoPerson[] = ROSTER) {
  const writes: { method: string; url: string; body: Record<string, unknown> | null }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      if (method !== 'GET') {
        writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
        return new Response(JSON.stringify({ card: cards[0] ?? null, person: people[0], reassigned: 0 }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ cards, people }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  return { writes }
}

/** The board has drawn when the first column's own label is on the page. */
async function boardReady() {
  await screen.findByRole('button', { name: /New card/ })
  await waitFor(() => expect(screen.getByLabelText('To Do')).toBeTruthy())
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

/* ── the wiring ───────────────────────────────────────────────────────────── */

describe('the todo-board endpoint', () => {
  const fn = readFileSync(resolve(root, 'netlify/functions/todo-board.ts'), 'utf8')
  const store = readFileSync(resolve(root, 'src/data/todoBoardStore.ts'), 'utf8')

  it('declares the collection, the two sub-collections and their ids', () => {
    expect(fn).toMatch(/'\/api\/todo-board'/)
    expect(fn).toMatch(/'\/api\/todo-board\/cards'/)
    expect(fn).toMatch(/'\/api\/todo-board\/cards\/:id'/)
    expect(fn).toMatch(/'\/api\/todo-board\/people'/)
    expect(fn).toMatch(/'\/api\/todo-board\/people\/:id'/)
  })

  it('is routed by netlify.toml, both the collection and the tail', () => {
    // The `/*` form has to be there as well as the bare one: the id sits two
    // segments deep (`/api/todo-board/cards/card-007`), and the SPA catch-all
    // below returns index.html with a 200 for anything that misses — which
    // reads as a JSON parse error rather than as a routing bug.
    const toml = readFileSync(resolve(root, 'netlify.toml'), 'utf8')
    expect(toml).toContain('from = "/api/todo-board/*"')
    expect(toml).toContain('from = "/api/todo-board"')
  })

  it('is not in the edge 404 list — the site has to read it', () => {
    const script = readFileSync(resolve(root, 'scripts/public-redirects.mjs'), 'utf8')
    const m = script.match(/const BLOCKED = \[([^\]]+)\]/)
    const blocked = [...m![1].matchAll(/'([^']+)'/g)].map((x) => x[1])
    expect(blocked.some((b) => b.startsWith('/api'))).toBe(false)
  })

  it('declares the same four columns the client does', () => {
    /* ⚠ THE COUPLING THAT ROTS. The function re-declares the column ids rather
       than importing them, because it is a trust boundary — the same call
       `linkBoard.ts` makes for `ALLOWED_TYPES`. A column added on one side
       only is silent: cards sent to it normalise straight back into To Do. */
    const fnIds = [...fn.matchAll(/export const COLUMNS = \[([^\]]+)\]/g)][0][1]
      .match(/'([a-z]+)'/g)!
      .map((x) => x.replaceAll("'", ''))
    const clientIds = [...store.matchAll(/id: '([a-z]+)'/g)].map((m) => m[1])
    expect(fnIds).toEqual(clientIds)
  })

  it('agrees with the client on who the handoff column assigns to', () => {
    const fnOwner = /AUTO_ASSIGN_OWNER = '([^']+)'/.exec(fn)![1]
    const clientOwner = /AUTO_ASSIGN_OWNER = '([^']+)'/.exec(store)![1]
    expect(fnOwner).toBe(clientOwner)
  })

  it('seeds the roster from DESIGNERS — the five names Refinement filters by', () => {
    /* Re-declared in the function for the same trust-boundary reason, so the
       two are compared rather than shared. A seed that drifts from the roster
       would quietly introduce a sixth designer, or lose one. */
    const linkStore = readFileSync(resolve(root, 'src/data/linkStore.ts'), 'utf8')
    const designers = /export const DESIGNERS = \[([^\]]+)\]/
      .exec(linkStore)![1]
      .match(/'([^']+)'/g)!
      .map((x) => x.replaceAll("'", ''))
    const seed = /export const SEED_PEOPLE = \[([^\]]+)\]/
      .exec(fn)![1]
      .match(/'([^']+)'/g)!
      .map((x) => x.replaceAll("'", ''))
    expect(seed).toEqual(designers)
  })

  /* The handoff rule and the cascade USED TO BE asserted here, by reading
     this file and matching the shape of the code that applies them. They are
     run for real against an in-memory store in `TodoBoardEndpoint.test.ts`
     now — a regex can only prove that something shaped like the rule is
     present, and the first real run of the handler found a defect the shape
     test could not (an edit could backdate `addedDate`). What stays here is
     the wiring and the three cross-file lists, which that suite cannot see. */
})

/* ── ordering ─────────────────────────────────────────────────────────────── */

describe('where a dropped card lands', () => {
  const list = [
    card({ id: 'card-001', position: 1 }),
    card({ id: 'card-002', position: 2 }),
    card({ id: 'card-003', position: 3 }),
  ]

  it('takes the midpoint between its new neighbours, so one move writes one card', () => {
    expect(positionForDrop(list, 'todo', 'card-003', 'card-001')).toBe(2.5)
  })

  it('goes below everything when dropped on the column rather than on a card', () => {
    expect(positionForDrop(list, 'todo', null, 'card-001')).toBe(4)
  })

  it('goes above everything when dropped on the first card', () => {
    expect(positionForDrop(list, 'todo', 'card-001', 'card-003')).toBe(0)
  })

  it('ignores the card being moved, so a drop just below itself is not a midpoint against its own position', () => {
    // Without the exclusion this is (1 + 2) / 2 = 1.5 — the card would land
    // back exactly where it started while the board said it had moved.
    expect(positionForDrop(list, 'todo', 'card-003', 'card-002')).toBe(2)
  })

  it('starts at 1 in an empty column', () => {
    expect(positionForDrop(list, 'refine', null, 'card-001')).toBe(1)
  })

  it('breaks ties on id, so two colliding midpoints still order', () => {
    const tied = [card({ id: 'card-009', position: 2 }), card({ id: 'card-004', position: 2 })]
    expect(cardsInColumn(tied, 'todo').map((c) => c.id)).toEqual(['card-004', 'card-009'])
  })
})

/* ── the board ────────────────────────────────────────────────────────────── */

describe('TodoBoardPanel', () => {
  it('draws the four columns, each counting its own cards', async () => {
    mockBoard([
      card({ id: 'card-001', column: 'todo' }),
      card({ id: 'card-002', column: 'todo', title: 'Admin Tool — first React screen', owner: 'Eric' }),
      card({ id: 'card-003', column: 'working', title: 'Checkout states', owner: 'Eric' }),
    ])
    render(<TodoBoardPanel />)
    await boardReady()

    for (const label of ['To Do', 'Working On It', 'Ready For Refinement', 'Ready for Prototype and Handoff']) {
      expect(screen.getByLabelText(label)).toBeTruthy()
    }
    expect(within(screen.getByLabelText('To Do')).getByText('2')).toBeTruthy()
    expect(within(screen.getByLabelText('Working On It')).getByText('1')).toBeTruthy()
  })

  it('says the handoff column assigns itself, and gives its cards no owner picker', async () => {
    mockBoard([card({ id: 'card-007', column: 'handoff', owner: 'Jillienne', title: 'Study Pace tile — V2' })])
    render(<TodoBoardPanel />)
    await boardReady()

    const handoff = screen.getByLabelText('Ready for Prototype and Handoff')
    expect(within(handoff).getByText(/Auto-assigns to Jillienne/)).toBeTruthy()
    // The label is there; the control is not — a picker the server would
    // overwrite is worse than a label.
    expect(within(handoff).getAllByText('Jillienne').length).toBeGreaterThan(0)
    expect(within(handoff).queryByLabelText(/^Owner of/)).toBeNull()
  })

  it('filters the board to one person, and says so in a column that empties', async () => {
    mockBoard([
      card({ id: 'card-001', owner: 'Anjani', title: 'Anjani’s card' }),
      card({ id: 'card-002', owner: 'Eric', title: 'Eric’s card', column: 'working' }),
    ])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /^Eric$/ }))
    expect(screen.queryByText('Anjani’s card')).toBeNull()
    expect(screen.getByText('Eric’s card')).toBeTruthy()
    expect(within(screen.getByLabelText('To Do')).getByText(/Nothing here for Eric/)).toBeTruthy()
    // The count is of the COLUMN, not of what survived the filter.
    expect(within(screen.getByLabelText('To Do')).getByText('1')).toBeTruthy()
  })

  it('the selected filter is not colour alone — it is pressed, and it rings', async () => {
    mockBoard([card()])
    render(<TodoBoardPanel />)
    await boardReady()

    const eric = screen.getByRole('button', { name: /^Eric$/ })
    expect(eric.getAttribute('aria-pressed')).toBe('false')
    await userEvent.click(eric)
    expect(eric.getAttribute('aria-pressed')).toBe('true')
    expect(eric.style.boxShadow).toContain('var(--ux-accent)')
  })

  it('reassigns from the card, in place', async () => {
    const { writes } = mockBoard([card({ id: 'card-001', owner: 'Anjani' })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.selectOptions(screen.getByLabelText(/^Owner of/), 'Eric')
    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].url).toContain('/api/todo-board/cards/card-001')
    expect(writes[0].body).toMatchObject({ owner: 'Eric', column: 'todo', position: 1 })
  })

  it('moves a card to another column from the kebab — the keyboard’s half of the drag', async () => {
    const { writes } = mockBoard([card({ id: 'card-001', column: 'todo' })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Actions for/ }))
    await userEvent.click(await screen.findByText('Move to Ready For Refinement'))
    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].body).toMatchObject({ column: 'refine' })
  })

  it('sends a dragged card to the column it was dropped on', async () => {
    const { writes } = mockBoard([
      card({ id: 'card-001', column: 'todo', position: 1 }),
      card({ id: 'card-002', column: 'refine', position: 1, title: 'Already refining' }),
    ])
    render(<TodoBoardPanel />)
    await boardReady()

    // jsdom performs no drag of its own, so the handlers are driven directly
    // with a stub transfer. What this proves is the move that gets SENT.
    const dataTransfer = { effectAllowed: '', setData: vi.fn() }
    // The To Do column's grip — the other card has one too.
    const grip = within(screen.getByLabelText('To Do')).getByTitle('Drag to move')
    fireEvent.dragStart(grip, { dataTransfer })
    const refine = screen.getByLabelText('Ready For Refinement')
    fireEvent.dragOver(refine, { dataTransfer })
    fireEvent.drop(refine, { dataTransfer })

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].body).toMatchObject({ column: 'refine', position: 2 })
  })

  it('a card dragged into the handoff column is sent with the column, and the server owns the owner', async () => {
    const { writes } = mockBoard([card({ id: 'card-001', column: 'todo', owner: 'Anjani' })])
    render(<TodoBoardPanel />)
    await boardReady()

    const dataTransfer = { effectAllowed: '', setData: vi.fn() }
    fireEvent.dragStart(screen.getByTitle('Drag to move'), { dataTransfer })
    const handoff = screen.getByLabelText('Ready for Prototype and Handoff')
    fireEvent.dragOver(handoff, { dataTransfer })
    fireEvent.drop(handoff, { dataTransfer })

    await waitFor(() => expect(writes.length).toBe(1))
    /* The owner is sent AS IT STANDS rather than pre-corrected to Jillienne.
       That is the point: one place decides the rule, and it is the endpoint —
       a client that corrected it here could drift from the server without
       anything failing. */
    expect(writes[0].body).toMatchObject({ column: 'handoff', owner: 'Anjani' })
  })

  it('creates a card into the column whose own Add opened the sheet', async () => {
    const { writes } = mockBoard([])
    render(<TodoBoardPanel />)
    await boardReady()

    const working = screen.getByLabelText('Working On It')
    await userEvent.click(within(working).getByRole('button', { name: /Add a card/ }))
    await userEvent.type(await screen.findByLabelText('Card name'), 'Home polish pass')
    await userEvent.type(screen.getByLabelText('Quick note'), 'Spacing and hierarchy.')
    await userEvent.selectOptions(screen.getByLabelText('Owner'), 'Eric')
    await userEvent.click(screen.getByRole('button', { name: 'Add card' }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].method).toBe('POST')
    expect(writes[0].body).toMatchObject({
      title: 'Home polish pass',
      note: 'Spacing and hierarchy.',
      owner: 'Eric',
      column: 'working',
    })
  })

  it('swaps the Owner picker for an explanation when the sheet’s column assigns itself', async () => {
    mockBoard([])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /New card/ }))
    expect(await screen.findByLabelText('Owner')).toBeTruthy()
    await userEvent.selectOptions(screen.getByLabelText('Column'), 'handoff')
    expect(screen.queryByLabelText('Owner')).toBeNull()
    expect(screen.getByText(/assigned to Jillienne/)).toBeTruthy()
  })

  it('refuses a card with no name, without asking the network', async () => {
    const { writes } = mockBoard([])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /New card/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Add card' }))
    expect(screen.getByRole('alert').textContent).toMatch(/Give the card a name/)
    expect(writes.length).toBe(0)
  })

  it('asks before removing a person, and says how many cards move', async () => {
    const { writes } = mockBoard([
      card({ id: 'card-001', owner: 'Eric' }),
      card({ id: 'card-002', owner: 'Eric', column: 'working' }),
      card({ id: 'card-003', owner: 'Anjani', column: 'working' }),
    ])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Manage people/ }))
    const rows = await screen.findAllByRole('listitem')
    const ericRow = rows.find((r) => r.textContent?.includes('Eric'))!
    await userEvent.click(within(ericRow).getByRole('button', { name: 'Remove' }))

    expect(screen.getByText(/2 cards stay on the board and move to Unassigned/)).toBeTruthy()
    // Nothing is written until the question is answered.
    expect(writes.length).toBe(0)

    await userEvent.click(screen.getByRole('button', { name: 'Remove Eric' }))
    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].method).toBe('DELETE')
    expect(writes[0].url).toContain('/api/todo-board/people/person-003')
  })

  it('offers no Remove for the person the handoff column assigns to', async () => {
    mockBoard([])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Manage people/ }))
    const rows = await screen.findAllByRole('listitem')
    const hers = rows.find((r) => r.textContent?.includes('Jillienne'))!
    expect(within(hers).queryByRole('button', { name: 'Remove' })).toBeNull()
    expect(within(hers).getByText('Owns handoff')).toBeTruthy()
  })

  it('says so, and offers nothing to click, when there is no endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<!doctype html>', { status: 200, headers: { 'content-type': 'text/html' } })),
    )
    render(<TodoBoardPanel />)
    expect(await screen.findByText(/authoring endpoint is not reachable/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /New card/ }).hasAttribute('disabled')).toBe(true)
    expect(screen.getByRole('button', { name: /Manage people/ }).hasAttribute('disabled')).toBe(true)
  })
})

/* ── the way out ──────────────────────────────────────────────────────────── */

describe('toMarkdown', () => {
  it('groups by column and names the owner, since Blobs is not backed up', () => {
    const md = toMarkdown([
      card({ id: 'card-001', title: 'One', note: 'first', owner: 'Eric' }),
      card({ id: 'card-002', title: 'Two', note: '', owner: '', column: 'working' }),
    ])
    expect(md).toContain('## To Do')
    expect(md).toContain('- **One** — first · owner: Eric')
    expect(md).toContain('## Working On It')
    expect(md).toContain('- **Two** — owner: Unassigned')
  })

  it('says the board is empty rather than printing an empty document', () => {
    expect(toMarkdown([])).toContain('Nothing on the board.')
  })
})
