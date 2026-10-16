/**
 * The To Do Board — the cards, and the people they are assigned to.
 *
 * The fifth thing on this gateway authored in the browser rather than in the
 * repo, after QA Notes and the three link boards. It is NOT one of those: a
 * card is not a link, and `netlify/lib/linkBoard.ts` requires a `url` on every
 * record, so the factory would have had to grow a mode in which its central
 * field is optional. That is how a shared handler stops being shared. This is
 * its own handler, holding its own two record types, and it keeps the
 * decisions the link boards made where they still apply:
 *
 *   - the SERVER allocates ids (`card-007`, `person-003`), so two people
 *     saving at once cannot both claim the same number;
 *   - `addedDate` is stamped once and carried through edits, `updatedAt` is
 *     restamped on every write — "last updated" means last saved;
 *   - optional strings store as `''` rather than as a missing key, so a client
 *     never has to tell "never had one" from "had one and it was cleared";
 *   - unknown keys are dropped rather than rejected;
 *   - `owner` is a typed LABEL, never an identity the server claims to know —
 *     nothing authenticates this endpoint. The Netlify site password is the
 *     only control, the same exposure every other board here carries.
 *
 * ── Two things this endpoint OWNS, which the client cannot be trusted with ──
 *
 * 1. THE HANDOFF RULE. A card in `handoff` is Jillienne's, whether it got
 *    there by being dragged, by being created straight into the column, or by
 *    a hand-rolled PUT. Enforced in `validateCard`, so there is exactly one
 *    place it can be true — the client mirrors it for an instant redraw, and
 *    the mirror cannot drift because the server's answer is what gets stored.
 *
 * 2. THE CASCADE. Removing a person reassigns their cards to Unassigned
 *    rather than deleting them. Done HERE, in one request, because a client
 *    doing it as "delete the person, then patch N cards" leaves the board
 *    half-migrated if the tab closes on card three.
 *
 * On the store being the whole list: there is no committed seed for cards the
 * way `src/data/qaNotes.ts` is one for QA findings. Netlify Blobs is not
 * backed up, so the board lives in exactly one place; `toMarkdown` in
 * `src/data/todoBoardStore.ts` is the same mitigation the link boards carry.
 */
import { openStore, type Store } from '../lib/store'

export const config = {
  path: [
    '/api/todo-board',
    '/api/todo-board/cards',
    '/api/todo-board/cards/:id',
    '/api/todo-board/people',
    '/api/todo-board/people/:id',
  ],
}

const STORE_NAME = 'todo-board'

/**
 * The four columns, in board order. Re-declared here rather than imported from
 * `src/data/todoBoardStore.ts` for the reason `ALLOWED_TYPES` is re-declared
 * in `linkBoard.ts`: this is a trust boundary, and the client module is a
 * compile-time claim about code we wrote. `TodoBoard.test.tsx` parses both
 * files and asserts they agree, so the duplication cannot drift silently.
 */
export const COLUMNS = ['todo', 'working', 'refine', 'handoff'] as const

/** The column that assigns itself. See "THE HANDOFF RULE" above. */
export const AUTO_ASSIGN_COLUMN = 'handoff'
export const AUTO_ASSIGN_OWNER = 'Jillienne'

/**
 * The avatar hues. The gateway palette publishes exactly four
 * (`--ux-hue-teal` and friends, re-themed per scheme and appearance), so a
 * person's colour is a NAME from this list rather than a stored CSS value —
 * a record carrying `#34A59A` would be the one thing on the page that does
 * not follow the palette, and it would be stored in Blobs where nobody
 * re-themes it.
 */
export const HUES = ['teal', 'gold', 'blue', 'neutral'] as const

/**
 * Who the roster starts as — the five names in `DESIGNERS`
 * (`src/data/linkStore.ts`), which is also what `PROTOTYPE_SCOPES` names as
 * owners and what Refinement's filter pills show. Seeded ONCE, on first read
 * (see `seedPeopleOnce`), and then it is the board's own list: Manage people
 * edits this copy, and Refinement's pills are not affected either way.
 *
 * `TodoBoard.test.tsx` asserts this list still matches `DESIGNERS`.
 */
export const SEED_PEOPLE = ['Jillienne', 'Anjani', 'Eric', 'Afsana', 'Cody']

/** Set once the roster has been seeded, so a board somebody deliberately
 *  emptied stays empty instead of refilling itself on the next page load. */
const SEED_MARKER = 'people-seeded'

const MAX_TITLE = 200
const MAX_NOTE = 500
const MAX_NAME = 100

type Json = Record<string, unknown>

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

const CARD_KEY = /^card-\d{3}$/
const PERSON_KEY = /^person-\d{3}$/

function keyFor(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

/** Highest `<prefix>-NNN` already stored, as a number. */
function highest(keys: string[], prefix: string): number {
  const re = new RegExp(`^${prefix}-(\\d{3})$`)
  let max = 0
  for (const k of keys) {
    const m = re.exec(k)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

async function allKeys(store: Store): Promise<string[]> {
  const { blobs } = await store.list()
  return blobs.map((b) => b.key)
}

async function readAll(store: Store, pattern: RegExp): Promise<Json[]> {
  const keys = (await allKeys(store)).filter((k) => pattern.test(k))
  const records = await Promise.all(keys.map((k) => store.get(k, { type: 'json' })))
  return records.filter((r): r is Json => Boolean(r) && typeof r === 'object')
}

/* ── people ───────────────────────────────────────────────────────────────── */

/**
 * Seed the roster the first time anyone opens the board.
 *
 * Keys are FIXED (`person-001`…`person-005`) rather than allocated, so two
 * first loads racing each other write the same five records instead of ten.
 * The marker is what makes it once-only: a board somebody has emptied on
 * purpose is a board with no people, not a board waiting to be refilled.
 */
async function seedPeopleOnce(store: Store): Promise<void> {
  const marker = await store.get(SEED_MARKER, { type: 'json' })
  if (marker) return
  await Promise.all(
    SEED_PEOPLE.map((name, i) =>
      store.setJSON(keyFor('person', i + 1), {
        id: keyFor('person', i + 1),
        name,
        hue: HUES[i % HUES.length],
        addedDate: new Date().toISOString().slice(0, 10),
      }),
    ),
  )
  await store.setJSON(SEED_MARKER, { seededAt: new Date().toISOString(), names: SEED_PEOPLE })
}

/** Validate a new person. Names are unique case-insensitively — two "Eric"s on
 *  a roster whose whole job is saying who owns a card is a bug, not a choice —
 *  and "Unassigned" is reserved, because `owner: ''` already means that and a
 *  person called Unassigned would be a second, quieter way to say it. */
function validatePerson(input: unknown, id: string, existing: Json[]): { record: Json } | { errors: string[] } {
  if (typeof input !== 'object' || input === null) return { errors: ['Body must be an object.'] }
  const b = input as Json
  const name = str(b.name)?.trim() ?? ''
  if (!name) return { errors: ['Enter a name.'] }
  if (name.length > MAX_NAME) return { errors: [`name is longer than ${MAX_NAME} characters.`] }
  if (name.toLowerCase() === 'unassigned') return { errors: ['“Unassigned” is reserved.'] }
  if (existing.some((p) => str(p.name)?.trim().toLowerCase() === name.toLowerCase())) {
    return { errors: ['That name is already on the list.'] }
  }
  // The hue is the server's to pick: it rotates through the four so a roster
  // of five reads as five people rather than as whatever colour the client
  // happened to ask for. A client may still name one — the Manage people
  // sheet does not — and an unreadable value rotates like an absent one.
  const asked = str(b.hue)?.trim() ?? ''
  const hue = (HUES as readonly string[]).includes(asked) ? asked : HUES[existing.length % HUES.length]
  return {
    record: { id, name, hue, addedDate: new Date().toISOString().slice(0, 10) },
  }
}

/* ── cards ────────────────────────────────────────────────────────────────── */

/**
 * Validate and NORMALISE an incoming card.
 *
 * `column` and `owner` NORMALISE rather than reject, the same call
 * `linkBoard.ts` makes for `product`: a tag the server cannot read is a
 * display problem, and refusing the whole record over one would lose what
 * somebody typed — the more expensive failure on a board whose job is
 * remembering who is doing what.
 *
 * `position` is a FLOAT, not an index. A drop between two cards stores the
 * midpoint of their positions, so moving one card writes one record — an
 * index would have to renumber every card below it, and two people dragging
 * at once would then each renumber the other's list. Ties sort by id, so the
 * order is total even if two midpoints collide.
 */
function validateCard(
  input: unknown,
  id: string,
  defaults: { position: number; addedDate?: string },
): { record: Json } | { errors: string[] } {
  const errors: string[] = []
  if (typeof input !== 'object' || input === null) return { errors: ['Body must be an object.'] }
  const b = input as Json

  const out: Json = { id }

  const title = str(b.title)?.trim() ?? ''
  if (!title) errors.push('Give the card a name.')
  else if (title.length > MAX_TITLE) errors.push(`title is longer than ${MAX_TITLE} characters.`)
  else out.title = title

  const note = str(b.note)?.trim() ?? ''
  if (note.length > MAX_NOTE) errors.push(`note is longer than ${MAX_NOTE} characters.`)
  else out.note = note

  const column = str(b.column)?.trim() ?? ''
  out.column = (COLUMNS as readonly string[]).includes(column) ? column : COLUMNS[0]

  // THE HANDOFF RULE, and the only place it is decided. A card that lands in
  // the handoff column is Jillienne's however it got there — dragged,
  // created straight into it, or PUT by hand.
  const askedOwner = str(b.owner)?.trim() ?? ''
  if (askedOwner.length > MAX_NAME) errors.push(`owner is longer than ${MAX_NAME} characters.`)
  out.owner =
    out.column === AUTO_ASSIGN_COLUMN
      ? AUTO_ASSIGN_OWNER
      : askedOwner.toLowerCase() === 'unassigned'
        ? ''
        : askedOwner.slice(0, MAX_NAME)

  const askedPosition = typeof b.position === 'number' && Number.isFinite(b.position) ? b.position : null
  out.position = askedPosition ?? defaults.position

  // Stamped on create, carried through every later save from the RECORD
  // rather than from the request, so editing a card cannot re-date it. The
  // link boards accept the client's echo of this field; here it is ignored
  // outright — `TodoCardDraft` never carries one, so an incoming `addedDate`
  // can only be a stale copy or an attempt to backdate. (A test sent
  // `2020-01-01` with an edit and got it stored, which is how this reads the
  // way it does.) A plain `yyyy-mm-dd` rather than a timestamp, parsed by
  // hand on the client to avoid the UTC off-by-one `new Date('2026-10-15')`
  // produces — the same call the link boards and the QA store make.
  out.addedDate = defaults.addedDate || new Date().toISOString().slice(0, 10)

  // Always the server's, never the client's: a create, an edit, and an edit
  // that changed nothing all re-stamp it.
  out.updatedAt = new Date().toISOString()

  return errors.length ? { errors } : { record: out }
}

/** Where a new card goes when the client does not say: the end of its column. */
function endOfColumn(cards: Json[], column: string): number {
  const inColumn = cards.filter((c) => c.column === column)
  if (!inColumn.length) return 1
  return Math.max(...inColumn.map((c) => (typeof c.position === 'number' ? c.position : 0))) + 1
}

/* ── the handler ──────────────────────────────────────────────────────────── */

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // NON-GREEDY, for the reason `linkBoard.ts` records at length: a greedy
  // `.*` swallows the first occurrence of the segment and leaves the wrong
  // tail behind.
  const tail = url.pathname.replace(/^.*?\/todo-board\/?/, '')
  const [kind = '', rawId = ''] = tail.split('/')
  const id = rawId ? decodeURIComponent(rawId).toLowerCase() : null

  const store = openStore(STORE_NAME)

  // ── the whole board ─────────────────────────────────────────────────────
  if (!kind) {
    if (req.method !== 'GET') return json({ errors: ['Method not allowed'] }, 405)
    await seedPeopleOnce(store)
    const [cards, people] = await Promise.all([readAll(store, CARD_KEY), readAll(store, PERSON_KEY)])
    return json({ cards, people })
  }

  if (kind !== 'cards' && kind !== 'people') {
    return json({ errors: [`Not something this board holds: ${kind}`] }, 404)
  }

  // ── people ──────────────────────────────────────────────────────────────
  if (kind === 'people') {
    if (!id) {
      if (req.method !== 'POST') return json({ errors: ['Method not allowed'] }, 405)
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return json({ errors: ['Body must be JSON.'] }, 400)
      }
      await seedPeopleOnce(store)
      const people = await readAll(store, PERSON_KEY)
      const next = highest(await allKeys(store), 'person') + 1
      if (next > 999) return json({ errors: ['Out of ids — the key pattern allows up to person-999.'] }, 409)
      const result = validatePerson(body, keyFor('person', next), people)
      if ('errors' in result) return json({ errors: result.errors }, 422)
      await store.setJSON(String(result.record.id), result.record)
      return json({ person: result.record }, 201)
    }

    if (req.method !== 'DELETE') return json({ errors: ['Method not allowed'] }, 405)
    if (!PERSON_KEY.test(id)) return json({ errors: [`Not a person id: ${id}`] }, 400)
    const person = (await store.get(id, { type: 'json' })) as Json | null
    if (!person) return json({ errors: ['Not found'] }, 404)
    const name = str(person.name)?.trim() ?? ''

    // The handoff column assigns to her by rule, so removing her would leave
    // every card in it owned by somebody the roster says does not exist.
    // Refused here rather than hidden only in the UI, because the UI is not
    // the thing that has to stay true.
    if (name === AUTO_ASSIGN_OWNER) {
      return json(
        { errors: [`${AUTO_ASSIGN_OWNER} owns the “Ready for Prototype and Handoff” column and cannot be removed.`] },
        409,
      )
    }

    // THE CASCADE. Their cards move to Unassigned; nothing is deleted.
    const cards = await readAll(store, CARD_KEY)
    const theirs = cards.filter((c) => str(c.owner)?.trim() === name)
    await Promise.all(
      theirs.map((c) => store.setJSON(String(c.id), { ...c, owner: '', updatedAt: new Date().toISOString() })),
    )
    await store.delete(id)
    return json({ id, deleted: true, reassigned: theirs.length })
  }

  // ── cards ───────────────────────────────────────────────────────────────
  if (!id) {
    if (req.method !== 'POST') return json({ errors: ['Method not allowed'] }, 405)
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ errors: ['Body must be JSON.'] }, 400)
    }
    const cards = await readAll(store, CARD_KEY)
    const next = highest(await allKeys(store), 'card') + 1
    if (next > 999) return json({ errors: ['Out of ids — the key pattern allows up to card-999.'] }, 409)
    const asked = typeof body === 'object' && body !== null ? (body as Json) : {}
    const column = (COLUMNS as readonly string[]).includes(str(asked.column)?.trim() ?? '')
      ? (str(asked.column) as string).trim()
      : COLUMNS[0]
    const result = validateCard(body, keyFor('card', next), { position: endOfColumn(cards, column) })
    if ('errors' in result) return json({ errors: result.errors }, 422)
    await store.setJSON(String(result.record.id), result.record)
    return json({ card: result.record }, 201)
  }

  if (!CARD_KEY.test(id)) return json({ errors: [`Not a card id: ${id}`] }, 400)

  if (req.method === 'PUT') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ errors: ['Body must be JSON.'] }, 400)
    }
    const existing = (await store.get(id, { type: 'json' })) as Json | null
    if (!existing) return json({ errors: ['Not found'] }, 404)
    const cards = await readAll(store, CARD_KEY)
    const asked = typeof body === 'object' && body !== null ? (body as Json) : {}
    const column = (COLUMNS as readonly string[]).includes(str(asked.column)?.trim() ?? '')
      ? (str(asked.column) as string).trim()
      : COLUMNS[0]
    const result = validateCard(body, id, {
      position: endOfColumn(
        cards.filter((c) => c.id !== id),
        column,
      ),
      addedDate: str(existing.addedDate) ?? undefined,
    })
    if ('errors' in result) return json({ errors: result.errors }, 422)
    await store.setJSON(id, result.record)
    return json({ card: result.record })
  }

  if (req.method === 'DELETE') {
    await store.delete(id)
    return json({ id, deleted: true })
  }

  return json({ errors: ['Method not allowed'] }, 405)
}
