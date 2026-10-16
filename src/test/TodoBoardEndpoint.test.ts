import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The To Do Board's handler, run for real against an in-memory Blobs store.
 *
 * The other function suites here assert at SOURCE level — `Links.test.tsx`
 * reads `linkBoard.ts` and checks the protocol allow-list is still applied
 * with `.includes(` — because those handlers' interesting behaviour is a
 * single guard and the runtime is Netlify's, not this one's.
 *
 * This board earns more than that: two of its rules exist precisely because
 * the client cannot be trusted to apply them (the handoff column assigns
 * itself; removing a person rewrites their cards rather than deleting them),
 * and a regex can only prove that some code matching the shape is present. So
 * `@netlify/blobs` is mocked with a Map and the handler is called the way the
 * endpoint will call it. What is NOT covered here is Netlify's own routing —
 * that the paths in `config` reach this function at all — which is what the
 * redirect assertions in `TodoBoard.test.tsx` are for.
 */

type Json = Record<string, unknown>

/** The three store methods the handler uses, over a Map. One store per test;
 *  `openStore` is called per request, so it has to return the same one. */
const blobs = new Map<string, Json>()

vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    list: async () => ({ blobs: [...blobs.keys()].map((key) => ({ key })) }),
    get: async (key: string) => blobs.get(key) ?? null,
    setJSON: async (key: string, value: Json) => void blobs.set(key, value),
    delete: async (key: string) => void blobs.delete(key),
  }),
}))

const { default: handler, SEED_PEOPLE, AUTO_ASSIGN_OWNER } = await import('../../netlify/functions/todo-board')

const call = async (method: string, path: string, body?: unknown) => {
  const res = await handler(
    new Request(`https://hub.test${path}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }),
    }),
  )
  return { status: res.status, body: (await res.json()) as Json }
}

const board = () => call('GET', '/api/todo-board')
const addCard = (card: Json) => call('POST', '/api/todo-board/cards', card)

beforeEach(() => {
  blobs.clear()
})

describe('GET /api/todo-board', () => {
  it('seeds the roster on the first read, and only the first', async () => {
    const first = await board()
    expect((first.body.people as Json[]).map((p) => p.name)).toEqual(SEED_PEOPLE)

    // Somebody removes one. The next read must NOT put them back: a board
    // deliberately emptied is a board with no people, not one waiting to be
    // refilled.
    await call('DELETE', '/api/todo-board/people/person-003')
    const second = await board()
    expect((second.body.people as Json[]).map((p) => p.name)).toEqual(
      SEED_PEOPLE.filter((n) => n !== SEED_PEOPLE[2]),
    )
  })

  it('gives every seeded person a hue from the palette, cycling', async () => {
    const { body } = await board()
    expect((body.people as Json[]).map((p) => p.hue)).toEqual(['teal', 'gold', 'blue', 'neutral', 'teal'])
  })
})

describe('cards', () => {
  it('allocates the id and stamps the dates — the client owns none of the three', async () => {
    const { status, body } = await addCard({ title: 'Compass empty state', note: 'x', owner: 'Anjani', column: 'todo' })
    expect(status).toBe(201)
    const card = body.card as Json
    expect(card.id).toBe('card-001')
    expect(card.addedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(card.updatedAt).toMatch(/Z$/)

    const second = await addCard({ title: 'Second', column: 'todo' })
    expect((second.body.card as Json).id).toBe('card-002')
  })

  it('refuses a card with no name, and stores nothing', async () => {
    const { status, body } = await addCard({ title: '   ', column: 'todo' })
    expect(status).toBe(422)
    expect((body.errors as string[])[0]).toMatch(/Give the card a name/)
    expect(blobs.size).toBe(0)
  })

  it('normalises an unknown column into To Do rather than losing the card', async () => {
    const { body } = await addCard({ title: 'From an older client', column: 'parking-lot' })
    expect((body.card as Json).column).toBe('todo')
  })

  it('puts a new card at the end of its own column', async () => {
    await addCard({ title: 'First', column: 'working' })
    await addCard({ title: 'Elsewhere', column: 'todo' })
    const third = await addCard({ title: 'Second in working', column: 'working' })
    expect((third.body.card as Json).position).toBe(2)
  })

  it('keeps addedDate through an edit and re-stamps updatedAt', async () => {
    const created = (await addCard({ title: 'A card', column: 'todo' })).body.card as Json
    const edited = (
      await call('PUT', '/api/todo-board/cards/card-001', {
        title: 'A card',
        column: 'todo',
        owner: 'Eric',
        position: 1,
        addedDate: '2020-01-01',
      })
    ).body.card as Json
    // The client asked to backdate it. It does not get to.
    expect(edited.addedDate).toBe(created.addedDate)
    expect(edited.owner).toBe('Eric')
  })

  it('answers a PUT to an id that is not there with a 404, not a new card', async () => {
    const { status } = await call('PUT', '/api/todo-board/cards/card-404', { title: 'Ghost', column: 'todo' })
    expect(status).toBe(404)
    expect(blobs.size).toBe(0)
  })
})

describe('the handoff rule', () => {
  it('assigns a card created straight into the column', async () => {
    const { body } = await addCard({ title: 'Ready to hand off', column: 'handoff', owner: 'Eric' })
    expect((body.card as Json).owner).toBe(AUTO_ASSIGN_OWNER)
  })

  it('assigns a card moved into it, whatever the request says', async () => {
    await addCard({ title: 'In progress', column: 'working', owner: 'Eric' })
    const moved = (
      await call('PUT', '/api/todo-board/cards/card-001', {
        title: 'In progress',
        column: 'handoff',
        owner: 'Eric',
        position: 1,
      })
    ).body.card as Json
    expect(moved.owner).toBe(AUTO_ASSIGN_OWNER)
  })

  it('releases the card when it moves back out', async () => {
    await addCard({ title: 'Handed off too early', column: 'handoff' })
    const moved = (
      await call('PUT', '/api/todo-board/cards/card-001', {
        title: 'Handed off too early',
        column: 'working',
        owner: 'Anjani',
        position: 1,
      })
    ).body.card as Json
    expect(moved.owner).toBe('Anjani')
  })
})

describe('people', () => {
  it('refuses a duplicate name, case-insensitively', async () => {
    await board()
    const { status, body } = await call('POST', '/api/todo-board/people', { name: 'eric' })
    expect(status).toBe(422)
    expect((body.errors as string[])[0]).toMatch(/already on the list/)
  })

  it('refuses “Unassigned”, which already means something here', async () => {
    await board()
    const { status } = await call('POST', '/api/todo-board/people', { name: 'Unassigned' })
    expect(status).toBe(422)
  })

  it('adds somebody new with the next hue', async () => {
    await board()
    const { status, body } = await call('POST', '/api/todo-board/people', { name: 'Joe' })
    expect(status).toBe(201)
    expect((body.person as Json).id).toBe('person-006')
    expect((body.person as Json).hue).toBe('gold')
  })

  it('reassigns a removed person’s cards instead of deleting them', async () => {
    await board()
    await addCard({ title: 'Theirs, one', column: 'todo', owner: 'Eric' })
    await addCard({ title: 'Theirs, two', column: 'working', owner: 'Eric' })
    await addCard({ title: 'Somebody else’s', column: 'todo', owner: 'Anjani' })

    const { body } = await call('DELETE', '/api/todo-board/people/person-003')
    expect(body.reassigned).toBe(2)

    const after = (await board()).body.cards as Json[]
    expect(after).toHaveLength(3)
    expect(after.filter((c) => c.owner === '')).toHaveLength(2)
    expect(after.filter((c) => c.owner === 'Anjani')).toHaveLength(1)
  })

  it('refuses to remove the person the handoff column assigns to', async () => {
    await board()
    const { status, body } = await call('DELETE', '/api/todo-board/people/person-001')
    expect(status).toBe(409)
    expect((body.errors as string[])[0]).toMatch(/cannot be removed/)
    // …and she is still there.
    expect((await board()).body.people).toHaveLength(SEED_PEOPLE.length)
  })
})

describe('routing', () => {
  it('reads the sub-collection from the tail, not from a single :id', async () => {
    await addCard({ title: 'A card', column: 'todo' })
    expect((await call('GET', '/api/todo-board')).status).toBe(200)
    expect((await call('DELETE', '/api/todo-board/cards/card-001')).status).toBe(200)
    expect((await board()).body.cards).toHaveLength(0)
  })

  it('refuses an id that is not one of its own', async () => {
    expect((await call('DELETE', '/api/todo-board/cards/person-001')).status).toBe(400)
  })

  it('refuses a collection it does not hold', async () => {
    expect((await call('GET', '/api/todo-board/columns')).status).toBe(404)
  })

  it('refuses the wrong method rather than falling through', async () => {
    expect((await call('DELETE', '/api/todo-board')).status).toBe(405)
    expect((await call('POST', '/api/todo-board/people/person-001')).status).toBe(405)
  })
})
