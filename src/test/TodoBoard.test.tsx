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
  person({ id: 'person-003', name: 'Eric', hue: 'slate' }),
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

  it('declares the same six person colours the client does, and the same retirements', () => {
    /* Same trust boundary as the columns. A colour the server accepts and the
       client cannot draw is an avatar with no fill; a retirement mapped on one
       side only is every pre-2026-10-15 record collapsing onto one colour. */
    const list = (src: string, name: string) =>
      new RegExp(`export const ${name} = \\[([^\\]]+)\\]`)
        .exec(src)![1]
        .match(/'([^']+)'/g)!
        .map((x) => x.replaceAll("'", ''))
    expect(list(fn, 'HUES')).toEqual(list(store, 'TODO_HUES'))

    const legacy = (src: string) =>
      /LEGACY_HUES[^=]*= \{([^}]+)\}/
        .exec(src)![1]
        .match(/(\w+): '([^']+)'/g)!
        .sort()
    expect(legacy(fn)).toEqual(legacy(store))
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
    expect(within(handoff).queryByRole('combobox')).toBeNull()
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

  it('shows the owner on the card as text, with no control to change it', async () => {
    /* It was a borderless `<select>` until 2026-10-15. A live control on every
       card reassigns somebody's work on a mis-click, with nothing in between
       and no undo — so the card states the owner and Edit card changes it. */
    mockBoard([card({ id: 'card-001', owner: 'Anjani' })])
    render(<TodoBoardPanel />)
    await boardReady()

    const article = screen.getByText('Compass — review-recap empty state').closest('article')!
    expect(within(article).getByText('Anjani')).toBeTruthy()
    expect(within(article).queryByRole('combobox')).toBeNull()
  })

  it('reassigns through the edit sheet instead', async () => {
    const { writes } = mockBoard([card({ id: 'card-001', owner: 'Anjani', position: 2 })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Actions for/ }))
    await userEvent.click(await screen.findByText('Edit card'))
    await userEvent.selectOptions(await screen.findByLabelText('Owner'), 'Eric')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].body).toMatchObject({ owner: 'Eric', column: 'todo', position: 2 })
  })

  it('offers exactly two things on the kebab — edit and remove', async () => {
    /* It carried a "Move to …" row per column plus Move up / Move down until
       2026-10-15. Pinned at two so the menu does not quietly regrow: moving
       between columns is the Edit sheet's Column picker now, and the drag. */
    mockBoard([card({ id: 'card-001', column: 'todo' })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Actions for/ }))
    const items = await screen.findAllByRole('menuitem')
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Edit card', 'Remove card'])
  })

  it('moves a card between columns without a pointer, through the edit sheet', async () => {
    const { writes } = mockBoard([card({ id: 'card-001', column: 'todo', position: 1 })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Actions for/ }))
    await userEvent.click(await screen.findByText('Edit card'))
    await userEvent.selectOptions(await screen.findByLabelText('Column'), 'refine')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].body).toMatchObject({ column: 'refine', position: 1 })
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

  it('offers “Add a card” on To Do only, and the sheet opens on that column', async () => {
    /* All four columns had one, from the concept. Three of them invited you
       to start new work in a column that means somebody is already doing it,
       it is ready for the team, or it is ready to hand off. */
    const { writes } = mockBoard([])
    render(<TodoBoardPanel />)
    await boardReady()

    expect(within(screen.getByLabelText('To Do')).getByRole('button', { name: /Add a card/ })).toBeTruthy()
    for (const column of ['Working On It', 'Ready For Refinement', 'Ready for Prototype and Handoff']) {
      expect(within(screen.getByLabelText(column)).queryByRole('button', { name: /Add a card/ })).toBeNull()
    }

    await userEvent.click(within(screen.getByLabelText('To Do')).getByRole('button', { name: /Add a card/ }))
    expect((await screen.findByLabelText('Column') as HTMLSelectElement).value).toBe('todo')

    await userEvent.type(screen.getByLabelText('Card name'), 'Home polish pass')
    await userEvent.type(screen.getByLabelText('Quick note'), 'Spacing and hierarchy.')
    // Anywhere but To Do is a decision made here, in the picker.
    await userEvent.selectOptions(screen.getByLabelText('Column'), 'working')
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

  it('edits a card in place from the kebab, keeping its id and its position', async () => {
    const { writes } = mockBoard([card({ id: 'card-004', title: 'Old name', note: 'Old note', position: 3 })])
    render(<TodoBoardPanel />)
    await boardReady()

    await userEvent.click(screen.getByRole('button', { name: /Actions for/ }))
    await userEvent.click(await screen.findByText('Edit card'))

    // The form opens on the card, not empty — the thing an edit sheet gets
    // wrong is arriving blank and quietly replacing what was there.
    const title = await screen.findByLabelText('Card name')
    expect((title as HTMLInputElement).value).toBe('Old name')
    expect((screen.getByLabelText('Quick note') as HTMLTextAreaElement).value).toBe('Old note')

    await userEvent.clear(title)
    await userEvent.type(title, 'New name')
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].url).toContain('/api/todo-board/cards/card-004')
    // Its place in the column is not the form's business.
    expect(writes[0].body).toMatchObject({ title: 'New name', note: 'Old note', position: 3 })
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

/** The avatar disc, not the drag grip — both are `aria-hidden` spans. */
function avatarIn(scope: Element): HTMLElement {
  return scope.querySelector('.cre-todo-avatar') as HTMLElement
}

describe('the person avatars', () => {
  /*
   * A unit test on a style string, which is unusual here and deliberate:
   * jsdom does not resolve `color-mix` or custom properties, so the only
   * thing assertable in this suite is the PAIRING — and the pairing is
   * exactly what was wrong. The disc filled itself with `--ux-hue-X` and
   * wrote on it with `--ux-hue-X-fg`, which is the hue's readable form
   * against the page, not ink for the hue: between 1.00:1 and 4.75:1 across
   * the four palettes, invisible in dim Moss where both tokens are SAGE.
   * The contrast itself was measured outside the suite, across every palette
   * and appearance; this stops the two tokens being put back together.
   */
  it('draws a solid brand colour with white ink, not a palette hue', async () => {
    mockBoard([card({ id: 'card-001', owner: 'Anjani' })])
    render(<TodoBoardPanel />)
    await boardReady()

    // The element carries the colour's NAME; the value is the stylesheet's.
    const disc = avatarIn(screen.getByText('Compass — review-recap empty state').closest('article')!)
    expect(disc.dataset.hue).toBe('gold')

    /* ⚠ ASSERTED AT SOURCE, and it has to be: jsdom applies no stylesheet, so
       there is no computed colour to read. What is pinned is the decision —
       six brand-ramp fills and an ink that does NOT come from the palette.
       The palette's own `--ux-hue-*` tokens were what made these unreadable
       (1.00:1 in dim Moss) and then indistinguishable (ΔE under 5). */
    const css = readFileSync(resolve(root, 'src/components/prototype/todoBoard.css'), 'utf8')
    /* ⚠ The token behind each name was CHECKED on the deployed build, not
       assumed: XCEL's `cta` ramp is brick red, not blue, and the first
       version of this list shipped a "navy" that rendered red. */
    for (const [hue, token] of [
      ['slate', '--color-primary-600'],
      ['teal', '--color-info-700'],
      ['green', '--color-success-600'],
      ['gold', '--color-secondary-800'],
      ['brick', '--color-cta-500'],
      ['taupe', '--color-tertiary-600'],
    ]) {
      expect(css).toContain(`.cre-todo-avatar[data-hue='${hue}'] { background: var(${token}); }`)
    }
    // Nobody is grey on the page's tokens; the six are not.
    expect(css).toContain("[data-hue='none']")
    expect(css).not.toMatch(/\[data-hue='(slate|teal|green|gold|brick|taupe)'\][^}]*--ux-hue/)
  })

  it('is hidden from assistive tech, because the name is always beside it', async () => {
    mockBoard([card({ id: 'card-001', owner: 'Anjani' })])
    render(<TodoBoardPanel />)
    await boardReady()

    const article = screen.getByText('Compass — review-recap empty state').closest('article')!
    expect(avatarIn(article).textContent).toBe('AN')
    expect(within(article as HTMLElement).getByText('Anjani')).toBeTruthy()
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
