/**
 * One handler for every "list of links authored on the page" endpoint.
 *
 * Links (2026-09-10) was the first. Demo (2026-09-18) is the second — the same
 * shape (title · url · note · addedBy · date) plus one field Links does not
 * have, `isPublic`, and minus one it does (`type`). Two hand-copied functions
 * is how a validation rule gets fixed in one and not the other, so both are
 * this factory with a config; `netlify/functions/links.ts` and `demos.ts` are
 * each a few lines.
 *
 * SECURITY — the one thing this file exists to hold. Every stored `url` is
 * rendered as an `<a href>` by the client, and `javascript:` in an href
 * executes in this origin, so "add a link" would become "run code in every
 * reviewer's browser". `ALLOWED_PROTOCOLS` is an ALLOW-list of exactly two
 * schemes, applied by inclusion; the client re-checks with `safeHref` at render
 * time in case a record written by an older or laxer version is still in the
 * store. `Links.test.tsx` parses this file and asserts the list still names
 * those two and is still applied with `.includes(` — a blocklist would pass a
 * naive "mentions javascript" check while being one novel scheme from wrong.
 *
 * There is no auth on these endpoints. The Netlify site password is the only
 * control, which is why `addedBy` is a typed label and never an identity the
 * server claims to know.
 */
import { openStore, type Store } from './store'

/** Only these reach an href. An allow-list, not a blocklist — see above. */
export const ALLOWED_PROTOCOLS = ['http:', 'https:']

/**
 * The Links taxonomy, re-declared here rather than imported from
 * `src/data/linkStore.ts`, because this is a trust boundary and `LINK_TYPES`
 * is a compile-time claim about code we wrote. `Links.test.tsx` parses both
 * files and asserts they agree, so the duplication cannot drift silently.
 * '' is valid — the field is optional.
 */
export const ALLOWED_TYPES = ['brief', 'design', 'prototype', 'reference']

/** Per-field limits. Generous enough for a real title and a long tracking URL,
 *  small enough that the store cannot be used to park arbitrary data. */
const MAX_TITLE = 200
const MAX_URL = 2000
const MAX_NOTE = 500
const MAX_ADDED_BY = 100

export type BoardConfig = {
  /** Netlify Blobs store name — `links`, `demos`. */
  storeName: string
  /** Key prefix: `link` → `link-007`. Same three-digit shape as the QA keys. */
  idPrefix: string
  /** The path segment the id follows: `links` → `/api/links/:id`. */
  segment: string
  /** The allowed `type` values, or null when the board has no type field
   *  (the field is then dropped from the stored record). */
  types: readonly string[] | null
  /** Whether records carry `isPublic`. When false the field is dropped on the
   *  way in, so a Links record cannot quietly acquire a public flag. */
  publicFlag: boolean
}

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

/**
 * Validate and NORMALISE an incoming record. Returns the record to store, or a
 * list of problems. Unknown keys are dropped rather than rejected — a client
 * sending a field this version does not know about should not be a hard error.
 */
export function validateRecord(
  cfg: BoardConfig,
  input: unknown,
  id: string,
): { record: Json } | { errors: string[] } {
  const errors: string[] = []
  if (typeof input !== 'object' || input === null) return { errors: ['Body must be an object.'] }
  const b = input as Json

  const out: Json = { id }

  const title = str(b.title)?.trim() ?? ''
  if (!title) errors.push('title is required.')
  else if (title.length > MAX_TITLE) errors.push(`title is longer than ${MAX_TITLE} characters.`)
  else out.title = title

  const rawUrl = str(b.url)?.trim() ?? ''
  if (!rawUrl) {
    errors.push('url is required.')
  } else if (rawUrl.length > MAX_URL) {
    errors.push(`url is longer than ${MAX_URL} characters.`)
  } else {
    let parsed: URL | null
    try {
      parsed = new URL(rawUrl)
    } catch {
      parsed = null
    }
    if (!parsed) errors.push('url must be a full address, including https://.')
    else if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      errors.push('url must start with http:// or https://.')
    } else {
      // Store the PARSED form, so what the page renders is what the checks
      // above ran against rather than the original text beside it.
      out.url = parsed.toString()
    }
  }

  // Optional. An absent note and an empty one are the same thing, and both
  // store as '' rather than as a missing key — so a client never has to tell
  // "never had one" from "had one and it was cleared".
  const note = str(b.note)?.trim() ?? ''
  if (note.length > MAX_NOTE) errors.push(`note is longer than ${MAX_NOTE} characters.`)
  else out.note = note

  // Who put it here. Optional, free text, and the same ''-not-absent rule.
  // Deliberately NOT derived from any identity the server has — see the file
  // comment. A field the author types is honestly what it is: a label.
  const addedBy = str(b.addedBy)?.trim() ?? ''
  if (addedBy.length > MAX_ADDED_BY) errors.push(`addedBy is longer than ${MAX_ADDED_BY} characters.`)
  else out.addedBy = addedBy

  // Optional, and an allow-list rather than free text — a stored value the
  // client has no label for would render as a chip saying nothing. Boards
  // without a taxonomy drop the field entirely.
  if (cfg.types) {
    const type = str(b.type)?.trim() ?? ''
    if (type && !cfg.types.includes(type)) {
      errors.push(`type must be one of: ${cfg.types.join(', ')}.`)
    } else out.type = type
  }

  // Whether the PUBLIC build shows this row. Strictly boolean `true`, so a
  // truthy string cannot publish a row by accident; anything else is false.
  if (cfg.publicFlag) out.isPublic = b.isPublic === true

  // `yyyy-mm-dd`, stamped server-side when absent, and carried through an edit
  // so editing a record does not re-date it. A plain date string rather than a
  // timestamp for the same reason the QA store does: the client parses it by
  // hand to avoid the UTC off-by-one `new Date('2026-09-10')` produces.
  const added = str(b.addedDate)
  if (added && !/^\d{4}-\d{2}-\d{2}$/.test(added)) errors.push('addedDate must be yyyy-mm-dd.')
  out.addedDate = added || new Date().toISOString().slice(0, 10)

  return errors.length ? { errors } : { record: out }
}

/** Highest `<prefix>-NNN` already stored, as a number. */
async function highestStored(store: Store, prefix: string): Promise<number> {
  const { blobs } = await store.list()
  const re = new RegExp(`^${prefix}-(\\d{3})$`)
  let max = 0
  for (const b of blobs) {
    const m = re.exec(b.key)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

/**
 * Build the handler for one board. The response shape uses the word `links`
 * for the collection and `link` for one record on EVERY board — the client
 * store is shared too, and a per-board key name would be a second thing for
 * it to know for no gain.
 */
export function linkBoardHandler(cfg: BoardConfig): (req: Request) => Promise<Response> {
  const keyPattern = new RegExp(`^${cfg.idPrefix}-\\d{3}$`)
  const tailPattern = new RegExp(`^.*\\/${cfg.segment}\\/?`)

  return async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const tail = url.pathname.replace(tailPattern, '')
    const id = tail ? decodeURIComponent(tail).toLowerCase() : null

    const store = openStore(cfg.storeName)

    // ── collection ──────────────────────────────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const { blobs } = await store.list()
        const links = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
        return json({ links: links.filter(Boolean) })
      }

      if (req.method === 'POST') {
        // Create. The id is assigned HERE rather than by the client, so two
        // authors saving at once cannot both claim the same number.
        let body: unknown
        try {
          body = await req.json()
        } catch {
          return json({ errors: ['Body must be JSON.'] }, 400)
        }
        const next = (await highestStored(store, cfg.idPrefix)) + 1
        if (next > 999) {
          return json({ errors: [`Out of ids — the key pattern allows up to ${cfg.idPrefix}-999.`] }, 409)
        }
        const newId = `${cfg.idPrefix}-${String(next).padStart(3, '0')}`
        const result = validateRecord(cfg, body, newId)
        if ('errors' in result) return json({ errors: result.errors }, 422)
        await store.setJSON(newId, result.record)
        return json({ link: result.record }, 201)
      }

      return json({ errors: ['Method not allowed'] }, 405)
    }

    if (!keyPattern.test(id)) return json({ errors: [`Not a ${cfg.idPrefix} id: ${id}`] }, 400)

    // ── one record ──────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const found = await store.get(id, { type: 'json' })
      if (!found) return json({ errors: ['Not found'] }, 404)
      return json({ link: found })
    }

    if (req.method === 'PUT') {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return json({ errors: ['Body must be JSON.'] }, 400)
      }
      const result = validateRecord(cfg, body, id)
      if ('errors' in result) return json({ errors: result.errors }, 422)
      await store.setJSON(id, result.record)
      return json({ link: result.record })
    }

    if (req.method === 'DELETE') {
      await store.delete(id)
      return json({ id, deleted: true })
    }

    return json({ errors: ['Method not allowed'] }, 405)
  }
}
