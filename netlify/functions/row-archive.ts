/**
 * `/api/row-archive` — which gateway rows are ARCHIVED, and by whom (2026-10-27).
 *
 * Jillienne, on an Explorations row's kebab: "i want the ellipsis to be able
 * to archive these things."
 *
 * The rows on the project list are CODE — `PROTOTYPE_FEATURES` and the
 * handoff folder — and until today the only way to take one off the board was
 * the archive convention: cut the row into `archivedFeatureRows.ts`, write an
 * `ARCHIVED_ITEMS` row, commit, deploy. Right for a component that is being
 * unwired; wrong for "this exploration is done, get it off the list", which
 * is a decision a designer makes on the page, not in a pull request.
 *
 * So this store holds ONE FACT per row: that it is archived, when, and by
 * whom. Nothing else about the row moves — the file stays where it is, the
 * gateway page still opens, the Markdown export still finds it. The page
 * reads this list, hides the rows it names from their sections, and lists
 * them under Archive with Unarchive in the kebab. Reversible, on the page,
 * for anyone. The same shape Refinement's archive took on 2026-10-15.
 *
 * Decisions this keeps from the other boards:
 *   - the SERVER stamps `archivedAt`, once, on the first archive — a client
 *     echoing a stamp back cannot re-date it, and unarchiving deletes the
 *     record rather than flipping a flag, so "not archived" has one shape;
 *   - `archivedBy` is a typed LABEL, never an identity the server claims to
 *     know. Nothing authenticates this endpoint; the site password is the
 *     control, as it is for every board here;
 *   - the id is NOT checked against the feature list. That list is a
 *     compile-time claim about code on the other side of a trust boundary
 *     (see `ALLOWED_TYPES` in `linkBoard.ts` for the long form); the client
 *     only shows an archive for a row that exists, and a stray id is a blob
 *     nobody reads.
 *
 * Netlify Blobs is not backed up: this is the only copy. Losing it loses
 * which rows were hidden, not the rows — they are in git.
 */
import { openStore, type Store } from '../lib/store'

export const config = {
  path: ['/api/row-archive', '/api/row-archive/:id'],
}

const STORE_NAME = 'row-archive'

/** A row id as `prototypeFeatures.ts` and the handoff folder spell them:
 *  lowercase, digits, dashes. */
export const ROW_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

const MAX_NAME = 60

export type ArchivedRow = {
  id: string
  archivedAt: string
  archivedBy: string
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

async function readAll(store: Store): Promise<ArchivedRow[]> {
  const { blobs } = await store.list()
  const rows = await Promise.all(
    blobs.map(async ({ key }) => (await store.get(key, { type: 'json' })) as ArchivedRow | null),
  )
  return rows
    .filter((r): r is ArchivedRow => r != null && typeof r.id === 'string')
    .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  // Non-greedy, for the reason `linkBoard.ts` records: a greedy `.*` swallows
  // the first occurrence of the segment and leaves the wrong tail behind.
  const tail = url.pathname.replace(/^.*?\/row-archive\/?/, '')
  const id = tail ? decodeURIComponent(tail.split('/')[0]).toLowerCase() : null

  const store = openStore(STORE_NAME)

  if (!id) {
    if (req.method !== 'GET') return json({ errors: ['Method not allowed'] }, 405)
    return json({ rows: await readAll(store) })
  }

  if (!ROW_ID.test(id)) return json({ errors: [`Not a row id: ${id}`] }, 400)

  if (req.method === 'GET') {
    const row = (await store.get(id, { type: 'json' })) as ArchivedRow | null
    return row ? json({ row }) : json({ errors: ['Not archived'] }, 404)
  }

  if (req.method !== 'PUT') return json({ errors: ['Method not allowed'] }, 405)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ errors: ['Body must be JSON.'] }, 400)
  }
  if (typeof body.archived !== 'boolean') {
    return json({ errors: ['archived must be true or false.'] }, 422)
  }

  if (!body.archived) {
    await store.delete(id)
    return json({ id, archived: false })
  }

  const by = typeof body.archivedBy === 'string' ? body.archivedBy.trim() : ''
  if (by.length > MAX_NAME) return json({ errors: [`archivedBy is longer than ${MAX_NAME} characters.`] }, 422)

  /* ⚠ THE FIRST STAMP STANDS. Archiving a row that is already archived keeps
     the original date and name — a second press is not a second event. */
  const existing = (await store.get(id, { type: 'json' })) as ArchivedRow | null
  const row: ArchivedRow = existing ?? {
    id,
    archivedAt: new Date().toISOString(),
    archivedBy: by,
  }
  if (!existing) await store.setJSON(id, row)
  return json({ row }, existing ? 200 : 201)
}
