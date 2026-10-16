/**
 * The To Do Board — the browser side of `netlify/functions/todo-board.ts`.
 *
 * Shaped like `linkStore.ts` deliberately, so the two read alike: a normalise
 * step that degrades an unknown record into a usable one rather than throwing
 * the page, hooks that RE-READ after every write, a `cgp.todoBoard` window
 * event so the nav count cannot fall behind the board, and a `toMarkdown` for
 * getting the list out of a store nothing backs up.
 *
 * It is NOT an instance of `createLinkBoard`: that factory is for records
 * whose centre is a URL, and a card has none. See the head of the function
 * for the same argument from the server's side.
 *
 * A module of hooks and helpers with no component in it, so fast refresh keeps
 * working — the same reason `todoStore.ts` sits beside `TodoPanel.tsx`.
 *
 * ⚠ NOT the archived To Do SECTION (`todo-section` in `archivedItems.ts`,
 * 2026-09-29). That was a private per-browser checklist in `localStorage`
 * (`todoStore.ts` + `TodoPanel.tsx`, both still in the repo, both untouched by
 * this). This is a shared board on a Netlify Blobs store with people on it.
 * Two different things that happen to be about to-dos; neither replaces the
 * other.
 */

import { useCallback, useEffect, useState } from 'react'

const BASE = '/api/todo-board'

/** Fired on every successful write so the nav count re-reads. A plain
 *  `storage` event would not do it — that only fires for OTHER tabs, and the
 *  count and the board are in the same one. Dispatched from inside the write
 *  helpers rather than from the panel, so a second caller cannot change the
 *  board and leave the count behind. */
const EVENT = 'cgp.todoBoard'

/* ── the taxonomy ─────────────────────────────────────────────────────────── */

/**
 * The four columns, in board order.
 *
 * MIRRORED in `netlify/functions/todo-board.ts`, which re-declares the ids
 * because it is a trust boundary; `TodoBoard.test.tsx` parses both and asserts
 * they agree. Add a column here and the compiler lists the call sites — but
 * the endpoint has to learn it too, or cards will normalise straight back out
 * of it.
 */
export const TODO_COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'working', label: 'Working On It' },
  { id: 'refine', label: 'Ready For Refinement' },
  {
    id: 'handoff',
    label: 'Ready for Prototype and Handoff',
    /** The column that assigns itself — see `AUTO_ASSIGN_OWNER`. */
    autoAssign: true,
  },
] as const

export type TodoColumn = (typeof TODO_COLUMNS)[number]['id']

/**
 * Who a card in the handoff column belongs to.
 *
 * The rule lives on the SERVER (`validateCard`), which is what makes it true;
 * this constant is the client's mirror of it, so the column note, the sheet's
 * explanation and the instant redraw after a drop all say the same name. A
 * card that reaches the server owned by somebody else comes back owned by
 * her, so the mirror cannot quietly disagree with the store.
 */
export const AUTO_ASSIGN_OWNER = 'Jillienne'

/** '' is Unassigned, everywhere. The same ''-not-absent rule `note` and
 *  `addedBy` follow on the link boards: "never had an owner" and "had one and
 *  they were removed" are one state, and it is this one. */
export const UNASSIGNED = ''

export const UNASSIGNED_LABEL = 'Unassigned'

export function columnLabel(column: TodoColumn): string {
  return TODO_COLUMNS.find((c) => c.id === column)?.label ?? ''
}

export function autoAssigns(column: TodoColumn): boolean {
  return TODO_COLUMNS.some((c) => c.id === column && 'autoAssign' in c && c.autoAssign)
}

/**
 * The person colours — SIX, and deliberately NOT from the gateway palette.
 *
 * They were the palette's four `--ux-hue-*` tokens until 2026-10-15, and that
 * failed twice over. Filled, the hue and its `-fg` partner were unreadable
 * (1.00:1 in dim Moss, where both tokens are the same colour). Tinted into the
 * card to fix that, the four discs became ΔE 1.7–4.9 apart — under ~10 reads
 * as "the same colour", so the colour identified nobody. Four tokens cannot
 * carry five-plus people in four palettes; that is not a tuning problem.
 *
 * So these are six families from the PROJECT'S OWN brand ramps (the `.cre-
 * todo-avatar` rules in `todoBoard.css` name them), drawn solid with white
 * initials. ⚠ THE NAMES DESCRIBE WHAT XCEL'S RAMPS ACTUALLY PAINT, which is
 * not what the family names suggest: `cta` is brick red here (the knight in
 * the logo), `primary` is slate blue, `tertiary` is taupe. Read the resolved
 * colour before renaming one of these — the first version of this list was
 * named from the generic house ramps and shipped a "navy" that rendered
 * red. White ink is what makes it robust — it cannot be broken by a
 * palette or an appearance, which is exactly how the first version broke.
 * Measured: initials 5.68:1 at worst, and the two closest discs are ΔE 24
 * apart.
 *
 * ⚠ THE TRADE, so nobody "fixes" it later: avatars no longer re-skin with
 * Moss / Ember / Tide / Fern. Everything else on this board still does. That
 * was Jillienne's call on 2026-10-15 — identity is the board's job, and a
 * colour that changes with the viewer's theme is not identity.
 *
 * A seventh person reuses the first colour. The NAME is always drawn beside
 * the avatar, at every call site, so a repeat is a weaker signal rather than
 * an ambiguity.
 */
export const TODO_HUES = [
  'slate',
  'teal',
  'green',
  'gold',
  'brick',
  'taupe',
  // EIGHT since 2026-10-15, when Cody and Jillienne came out the same colour.
  // XCEL's ramps have no seventh distinct HUE — what is left are darker steps
  // of families already here — so these two are literals in `todoBoard.css`,
  // like the white ink and for the same reason: identity, not theme.
  'violet',
  'plum',
] as const

/**
 * What the four palette hues become.
 *
 * Every person record written before 2026-10-15 carries one of the old ids,
 * and a record whose colour this build cannot read would otherwise fall back
 * to one shared default — every avatar the same, which is the failure the six
 * colours exist to end. Mirrored in `netlify/functions/todo-board.ts`;
 * `TodoBoard.test.tsx` asserts the two agree.
 */
export const LEGACY_HUES: Readonly<Record<string, string>> = {
  // The four palette hues these replaced. `teal` and `gold` kept their names,
  // so they need no entry — a stored value that is still an id resolves as
  // itself.
  blue: 'slate',
  neutral: 'taupe',
}

export type TodoHue = (typeof TODO_HUES)[number] | 'none'

/** Unassigned, and anyone off the roster: a grey disc on the palette's own
 *  tokens, so "nobody" is visibly not one of the six people. */
export const UNASSIGNED_HUE: TodoHue = 'none'

export type TodoCard = {
  /** `card-007`, allocated server-side. */
  id: string
  title: string
  /** '' when there is none. */
  note: string
  /** The owner's NAME, or '' for Unassigned. A label, not a person id: a
   *  roster entry can be removed, and a card that outlives one should still
   *  say what it said — which is also why the cascade on removal is an
   *  explicit rewrite rather than a dangling reference. */
  owner: string
  column: TodoColumn
  /** Sort key within the column. A float: a drop between two cards stores the
   *  midpoint, so one move writes one card. See `positionForDrop`. */
  position: number
  /** `yyyy-mm-dd`, stamped server-side on create and carried through edits. */
  addedDate: string
  /** ISO timestamp of the last save, stamped server-side on every write. */
  updatedAt: string
}

export type TodoPerson = {
  /** `person-003`, allocated server-side. */
  id: string
  name: string
  hue: TodoHue
  addedDate: string
}

export type TodoBoardIndex = {
  /** False when there is no endpoint to talk to — plain `npm run dev`, or a
   *  deploy without the function. The panel then says so rather than offering
   *  a New card button that cannot work. */
  available: boolean
  /** True until the first request settles. Separate from `available` because
   *  "not loaded yet" and "no endpoint" are different facts that want
   *  different empty states. */
  loading: boolean
  cards: TodoCard[]
  people: TodoPerson[]
}

export const EMPTY_TODO_BOARD: TodoBoardIndex = {
  available: false,
  loading: true,
  cards: [],
  people: [],
}

const UNAVAILABLE: TodoBoardIndex = { available: false, loading: false, cards: [], people: [] }

/* ── people ───────────────────────────────────────────────────────────────── */

/** `Jillienne` → `JM` is impossible from one word, so a single name gives its
 *  first two letters and a full name gives one letter from each of the first
 *  two words. Matches what the concept did, and it is the only thing the
 *  avatar has room for. */
/** A stored colour as one this build can draw: its own id, the new id for a
 *  retired one, or the first colour for anything unreadable. */
export function resolveHue(stored: string): TodoHue {
  if ((TODO_HUES as readonly string[]).includes(stored)) return stored as TodoHue
  const moved = LEGACY_HUES[stored]
  return (moved as TodoHue) ?? TODO_HUES[0]
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.trim().slice(0, 2).toUpperCase() || '—'
}

/**
 * The hue to draw a card's owner in.
 *
 * A name that is no longer on the roster still renders — `neutral`, with its
 * initials — rather than breaking the card or silently reading as Unassigned.
 * The cascade on removal means this should not normally happen; it is here
 * because "should not normally" is not a rendering strategy.
 */
export function hueFor(owner: string, people: TodoPerson[]): TodoHue {
  // Unassigned has no person and therefore no colour — `UNASSIGNED_HUE` is the
  // grey the stylesheet draws for it, not one of the six.
  if (!owner) return UNASSIGNED_HUE
  return people.find((p) => p.name === owner)?.hue ?? UNASSIGNED_HUE
}

/**
 * The roster as `<option>`s — Unassigned first, then everybody, in roster
 * order. One function because three controls offer the same list (the card's
 * reassign `<select>`, the New card sheet's Owner picker, and the filter row
 * reads the same order), and a list assembled three times is a list that ends
 * up in three orders.
 */
export function ownerOptions(people: TodoPerson[]): { value: string; label: string }[] {
  return [
    { value: UNASSIGNED, label: UNASSIGNED_LABEL },
    ...people.map((p) => ({ value: p.name, label: p.name })),
  ]
}

export function ownerLabel(owner: string): string {
  return owner || UNASSIGNED_LABEL
}

/** Whether a card belongs under an owner filter. `null` is All; `''` is the
 *  Unassigned filter, which is a real selection rather than "no filter" — the
 *  reason this is a function and not an `===` at the call site. */
export function matchesOwner(card: TodoCard, filter: string | null): boolean {
  if (filter === null) return true
  return card.owner === filter
}

/* ── ordering ─────────────────────────────────────────────────────────────── */

/** The cards of one column, in board order. Ties on `position` break on id,
 *  which is monotonic, so the order is total even when two midpoints land on
 *  the same number. */
export function cardsInColumn(cards: TodoCard[], column: TodoColumn): TodoCard[] {
  return cards
    .filter((c) => c.column === column)
    .sort((a, b) => (a.position === b.position ? a.id.localeCompare(b.id) : a.position - b.position))
}

/**
 * The `position` a card should take when dropped into `column` immediately
 * before `beforeId` (or at the end, when that is null).
 *
 * MIDPOINTS, not indices. Renumbering a column on every drop would mean one
 * drag writing N records, and two people dragging at once each renumbering
 * the other's list; a midpoint writes exactly the card that moved. The dragged
 * card is excluded from the neighbours so dropping it just below itself does
 * not compute a midpoint against its own old position.
 */
export function positionForDrop(
  cards: TodoCard[],
  column: TodoColumn,
  beforeId: string | null,
  movingId: string,
): number {
  const list = cardsInColumn(cards, column).filter((c) => c.id !== movingId)
  const index = beforeId === null ? list.length : list.findIndex((c) => c.id === beforeId)
  const at = index === -1 ? list.length : index
  const prev = at > 0 ? list[at - 1].position : null
  const next = at < list.length ? list[at].position : null
  if (prev === null && next === null) return 1
  if (prev === null) return (next as number) - 1
  if (next === null) return prev + 1
  return (prev + next) / 2
}

/* ── the wire ─────────────────────────────────────────────────────────────── */

function isCard(v: unknown): v is TodoCard {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.title === 'string'
}

function isPerson(v: unknown): v is TodoPerson {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.name === 'string'
}

/** Normalise rather than trust: a record from an older version of the endpoint
 *  should degrade to a usable card instead of throwing the whole page. */
function normaliseCard(v: TodoCard): TodoCard {
  return {
    id: v.id,
    title: v.title,
    note: typeof v.note === 'string' ? v.note : '',
    owner: typeof v.owner === 'string' ? v.owner : '',
    // An unreadable column lands in To Do rather than disappearing from the
    // board: a card nobody can see is the one failure this list cannot have.
    column: TODO_COLUMNS.some((c) => c.id === v.column) ? v.column : 'todo',
    position: typeof v.position === 'number' && Number.isFinite(v.position) ? v.position : 0,
    addedDate: typeof v.addedDate === 'string' ? v.addedDate : '',
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '',
  }
}

function normalisePerson(v: TodoPerson): TodoPerson {
  return {
    id: v.id,
    name: v.name,
    hue: resolveHue(v.hue),
    addedDate: typeof v.addedDate === 'string' ? v.addedDate : '',
  }
}

async function problems(res: Response, fallback: string): Promise<string[]> {
  try {
    const body = (await res.json()) as { errors?: string[]; error?: string }
    if (Array.isArray(body.errors) && body.errors.length) return body.errors
    if (body.error) return [body.error]
  } catch {
    /* not JSON — fall through */
  }
  return [fallback]
}

/** Thrown by every write, so a form can list what the server objected to. */
export class TodoBoardWriteError extends Error {
  readonly errors: string[]
  constructor(errors: string[]) {
    super(errors.join(' '))
    this.name = 'TodoBoardWriteError'
    this.errors = errors
  }
}

function announce(): void {
  window.dispatchEvent(new Event(EVENT))
}

export async function readBoard(): Promise<TodoBoardIndex> {
  try {
    const res = await fetch(BASE, { headers: { accept: 'application/json' } })
    if (!res.ok) return UNAVAILABLE
    // A misrouted request returns index.html with a 200, which would throw on
    // parse rather than reporting "no backend". Check before parsing.
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return UNAVAILABLE
    const body = (await res.json()) as { cards?: unknown; people?: unknown }
    const cards = Array.isArray(body.cards) ? body.cards : []
    const people = Array.isArray(body.people) ? body.people : []
    return {
      available: true,
      loading: false,
      cards: cards.filter(isCard).map(normaliseCard),
      people: people
        .filter(isPerson)
        .map(normalisePerson)
        .sort((a, b) => a.id.localeCompare(b.id)),
    }
  } catch {
    return UNAVAILABLE
  }
}

/** The fields a card is written with. `id`, `addedDate` and `updatedAt` are
 *  not among them — the server owns all three, so a form cannot renumber a
 *  card, backdate it, or claim it was just saved. `owner` is a request: the
 *  handoff column overrides it server-side. */
export type TodoCardDraft = {
  title: string
  note: string
  owner: string
  column: TodoColumn
  /** Omitted on create, when the server puts the card at the end of its
   *  column; supplied by a drag, which has computed a midpoint. */
  position?: number
}

export function draftProblems(draft: TodoCardDraft): string[] {
  return draft.title.trim() ? [] : ['Give the card a name.']
}

/**
 * What `promote-to-refinement` hands the board — the fields a NEW card opens
 * with, read off the address by `UxDashboardPage` and passed down to the card
 * sheet. The same hand-off `LinkPrefill` is for the Refinement row, and for
 * the same reason: both Netlify sites sit behind the site password, which
 * stands in front of `/api/todo-board` too, so the skill cannot POST the card
 * itself. It fills the form and the designer clicks Add — the form's
 * validation and the endpoint's both still run, and nothing is stored until
 * that click.
 *
 * `owner` and `column` are REQUESTS, not facts: the skill knows what branch it
 * is on and who is sitting at the keyboard, and it knows neither the roster
 * nor the column ids. Both are resolved against the real thing before they
 * reach the draft — see `resolveOwner` and `isTodoColumn`.
 */
export type TodoCardPrefill = {
  title: string
  note: string
  /** A name as `git config user.name` spells it. Unassigned when the roster
   *  has nobody by that name. */
  owner?: string
  column?: TodoColumn
}

/**
 * The roster's spelling of a name, or Unassigned.
 *
 * A card stores its owner's NAME (see `TodoCard.owner`), so a prefill that
 * passed "jillienne" straight through would make a second owner the avatars,
 * the filters and the people sheet all disagree about. Matching
 * case-insensitively and storing what the ROSTER says keeps one spelling of
 * each person on the board, and a name nobody on it answers to lands as
 * Unassigned rather than inventing an owner.
 */
export function resolveOwner(people: TodoPerson[], name: string | undefined): string {
  const want = (name ?? '').trim().toLowerCase()
  if (!want) return UNASSIGNED
  return people.find((p) => p.name.trim().toLowerCase() === want)?.name ?? UNASSIGNED
}

/** Whether a string off the address is one of the four columns. The page
 *  validates the param with this rather than casting it, the way the demo
 *  prefill validates its product against the catalog: an unknown column would
 *  otherwise reach the form as a `<select>` with no matching option. */
export function isTodoColumn(value: string | null): value is TodoColumn {
  return TODO_COLUMNS.some((c) => c.id === value)
}

async function write<T>(path: string, init: RequestInit, pick: (body: never) => T, fallback: string): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) throw new TodoBoardWriteError(await problems(res, fallback))
  const body = (await res.json()) as never
  announce()
  return pick(body)
}

/**
 * Change somebody's colour. The only part of a person record that can be
 * edited: a card stores its owner's NAME, so a rename here would orphan every
 * card they own (see the endpoint).
 */
export function setPersonHue(id: string, hue: TodoHue): Promise<TodoPerson> {
  return write<TodoPerson>(
    `${BASE}/people/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hue }),
    },
    (b: { person: TodoPerson }) => b.person,
    'Could not change that colour.',
  )
}

export function createCard(draft: TodoCardDraft): Promise<TodoCard> {
  return write<TodoCard>(
    `${BASE}/cards`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    },
    (b: { card: TodoCard }) => b.card,
    'Could not add the card.',
  )
}

export function saveCard(id: string, draft: TodoCardDraft): Promise<TodoCard> {
  return write<TodoCard>(
    `${BASE}/cards/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    },
    (b: { card: TodoCard }) => b.card,
    'Could not save the card.',
  )
}

/** Move a card — to another column, to another place in its own, or both.
 *  One PUT of the whole record, like every other write here, so there is no
 *  second shape of request for the server to validate differently. */
export function moveCard(card: TodoCard, column: TodoColumn, position: number): Promise<TodoCard> {
  return saveCard(card.id, {
    title: card.title,
    note: card.note,
    // Deliberately sent as it stands rather than pre-corrected for the
    // handoff column: the server owns that rule, and sending the current
    // owner is what lets it apply it in one place.
    owner: card.owner,
    column,
    position,
  })
}

/**
 * Reassign one card, leaving everything else as it stands.
 *
 * ⚠ UNWIRED SINCE 2026-10-15 and kept deliberately: the card's inline owner
 * `<select>` was taken off (a live control on every card reassigns somebody's
 * work on a mis-click), and reassigning is the edit sheet's Owner field now,
 * which goes through `saveCard` with the whole record. This stays exported so
 * putting a quick-reassign control back — on the card, in a bulk action, in a
 * keyboard shortcut — is a call site rather than a rewrite.
 */
export function setCardOwner(card: TodoCard, owner: string): Promise<TodoCard> {
  return saveCard(card.id, {
    title: card.title,
    note: card.note,
    owner,
    column: card.column,
    position: card.position,
  })
}

export function deleteCard(id: string): Promise<{ id: string }> {
  return write<{ id: string }>(
    `${BASE}/cards/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    (b: { id: string }) => b,
    'Could not remove the card.',
  )
}

export function addPerson(name: string): Promise<TodoPerson> {
  return write<TodoPerson>(
    `${BASE}/people`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    },
    (b: { person: TodoPerson }) => b.person,
    'Could not add that person.',
  )
}

/** Remove a person. Their cards are reassigned to Unassigned SERVER-SIDE —
 *  see "THE CASCADE" in the function — so this is one request and cannot
 *  leave the board half-migrated. */
export function removePerson(id: string): Promise<{ reassigned: number }> {
  return write<{ reassigned: number }>(
    `${BASE}/people/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    (b: { reassigned?: number }) => ({ reassigned: b.reassigned ?? 0 }),
    'Could not remove that person.',
  )
}

/* ── hooks ────────────────────────────────────────────────────────────────── */

/**
 * The board, plus a refresh.
 *
 * Every write re-reads the whole board rather than patching local state. The
 * same call the link boards make, and for the same reason: the endpoint owns
 * the id, the dates and the handoff rule, and the store is shared — somebody
 * else may have moved a card since this page loaded. An optimistic board is a
 * second, quietly diverging copy of something more than one person writes to.
 */
export function useTodoBoard() {
  const [index, setIndex] = useState<TodoBoardIndex>(EMPTY_TODO_BOARD)

  const refresh = useCallback(async () => {
    const next = await readBoard()
    setIndex(next)
    return next
  }, [])

  useEffect(() => {
    let live = true
    void readBoard().then((next) => {
      if (live) setIndex(next)
    })
    return () => {
      live = false
    }
  }, [])

  return { index, refresh }
}

/**
 * How many cards are on the board, for the nav count.
 *
 * Live, for the same reason To Do's and QA Notes' are: a number that cannot
 * change is only correct until somebody adds something. Seeds at 0 — there is
 * no committed set to seed from.
 */
export function useTodoBoardCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let live = true
    const read = () => {
      void readBoard().then((index) => {
        if (live) setCount(index.cards.length)
      })
    }
    read()
    window.addEventListener(EVENT, read)
    return () => {
      live = false
      window.removeEventListener(EVENT, read)
    }
  }, [])
  return count
}

/* ── export ───────────────────────────────────────────────────────────────── */

/**
 * The board as markdown, for getting it out of a store nothing backs up.
 *
 * The same mitigation the link boards carry, in the same words: Netlify Blobs
 * is not backed up, so this board lives in exactly one place. Grouped by
 * column, in board order, with the owner after each card — which is the shape
 * somebody would want to paste into a standup or a ticket.
 */
export function toMarkdown(cards: TodoCard[]): string {
  if (!cards.length) return '# To Do Board\n\n_Nothing on the board._\n'
  const lines = [`# To Do Board`, '', `_${cards.length} cards · exported ${new Date().toISOString().slice(0, 10)}_`]
  for (const col of TODO_COLUMNS) {
    const inColumn = cardsInColumn(cards, col.id)
    if (!inColumn.length) continue
    lines.push('', `## ${col.label}`, '')
    for (const card of inColumn) {
      const tail = [card.note.trim(), `owner: ${ownerLabel(card.owner)}`].filter(Boolean).join(' · ')
      lines.push(`- **${card.title}** — ${tail}`)
    }
  }
  return `${lines.join('\n')}\n`
}
