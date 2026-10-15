/**
 * One handler for every "list of links authored on the page" endpoint.
 *
 * Links (2026-09-10) was the first. Demo (2026-09-18) is the second — the same
 * shape (title · url · note · addedBy · date) plus one field Links does not
 * have, `isPublic`, and minus one it does (`type`). Research (2026-10-07) is
 * the third, and it is Links' shape exactly, under a different store. Two
 * hand-copied functions is how a validation rule gets fixed in one and not the
 * other, so all three are this factory with a config; `netlify/functions/
 * links.ts`, `demos.ts` and `research.ts` are each a few lines.
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
 * THE RETIRED HOST — 2026-10-15.
 *
 * The demo project (`ux-demo-xceldashboard`) was deleted when the Hub became
 * the one site. Netlify does not redirect a deleted project: every address
 * under that host, and every BRANCH alias under it
 * (`feat-x--ux-demo-xceldashboard.netlify.app`), answers Netlify's own
 * "Site not found" page. Rows written before that day still carry those
 * addresses, so the Refinement board — the surface whose whole job is to not
 * lose work — was handing out 404s for work that is still built and still
 * reachable, one hostname away.
 *
 * The map is applied in BOTH directions, which is the point:
 *
 *  - on the way IN (`validateRecord`), so a row pasted from an old link, an
 *    old bookmark or an old skill run cannot re-seed the dead host; and
 *  - on the way OUT (`serveRecord`), so the rows already in Blobs open
 *    correctly TODAY, with no migration to run and no credentials needed to
 *    run it. A row is rewritten in the store the next time it is saved; until
 *    then the stored text is stale and what is served is right. That order is
 *    deliberate — a migration that has to be run is a migration someone has
 *    to remember, and this had already been missed once.
 *
 * It is a HOST swap only. The path, query and branch prefix are carried
 * across untouched, because the Hub builds every branch the demo site did —
 * `feat-x--ux-demo-…/dashboard-rebrand?demo=1` is the same build at
 * `feat-x--ux-design-…/dashboard-rebrand?demo=1`. A branch whose build has
 * since been deleted 404s on the Hub too, and that is a different, honest
 * failure: the branch is gone, not the site.
 *
 * ⚠ Entries are PERMANENT. Removing one does not tidy the map, it re-breaks
 * every row still carrying that host.
 */
export const RETIRED_HOSTS: Readonly<Record<string, string>> = {
  'ux-demo-xceldashboard.netlify.app': 'ux-design-xceldashboard.netlify.app',
}

/**
 * Swap a retired host for its live one, preserving a `<branch>--` alias
 * prefix. Anything this does not recognise — another host, a non-URL — comes
 * back exactly as it went in: this corrects a known rename, it does not
 * police where a link may point.
 */
export function rehostRetired(raw: string): string {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return raw
  }
  const host = parsed.hostname.toLowerCase()
  for (const [dead, live] of Object.entries(RETIRED_HOSTS)) {
    if (host === dead) {
      parsed.hostname = live
      return parsed.toString()
    }
    // `feat-x--dead.host` → `feat-x--live.host`. The `--` is required, so a
    // host that merely ENDS with the dead one is left alone.
    if (host.endsWith(`--${dead}`)) {
      parsed.hostname = host.slice(0, host.length - dead.length) + live
      return parsed.toString()
    }
  }
  return raw
}

/**
 * The Links taxonomy, re-declared here rather than imported from
 * `src/data/linkStore.ts`, because this is a trust boundary and `LINK_TYPES`
 * is a compile-time claim about code we wrote. `Links.test.tsx` parses both
 * files and asserts they agree, so the duplication cannot drift silently.
 * '' is valid — the field is optional.
 */
export const ALLOWED_TYPES = ['brief', 'design', 'prototype', 'reference']

/**
 * The Refinement product tags, re-declared here for the same reason as
 * `ALLOWED_TYPES` — this is a trust boundary, and `LINK_PRODUCTS` in
 * `src/data/linkStore.ts` is a compile-time claim about code we wrote.
 * `Demo.test.tsx` parses both files and asserts they agree.
 *
 * No `''` member: unlike `type`, this field has a real default. Anything not on
 * this list becomes `both` rather than being rejected, because a tag the server
 * cannot read is not a reason to refuse someone's link.
 */
export const ALLOWED_PRODUCTS = ['xcel', 'compass', 'both']
const DEFAULT_PRODUCT = 'both'

/** Per-field limits. Generous enough for a real title and a long tracking URL,
 *  small enough that the store cannot be used to park arbitrary data. */
const MAX_TITLE = 200
const MAX_URL = 2000
const MAX_NOTE = 500
const MAX_ADDED_BY = 100
/** A full ISO timestamp with a zone — what `new Date().toISOString()` writes. */
const ISO_STAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

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
  /** Whether records carry `product`. Demo only: dropped on the way in
   *  elsewhere, so a Links record cannot quietly acquire one. */
  products: boolean
  /** Whether records can be ARCHIVED — `archivedAt` / `archivedBy`, hidden
   *  from the board rather than deleted (2026-10-15). Demo only, same rule
   *  as `products`: dropped on the way in everywhere else. */
  archivable: boolean
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
      // above ran against rather than the original text beside it — then the
      // retired-host swap, so a row cannot be written pointing at a site that
      // no longer exists. See `RETIRED_HOSTS`.
      out.url = rehostRetired(parsed.toString())
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

  // Which product the row is about. NORMALISED, not rejected: an unreadable tag
  // is a display problem, and refusing the whole record over one would lose the
  // link — which is the more expensive failure on a board whose job is to not
  // lose work. The allow-list still means only a known value is ever stored.
  if (cfg.products) {
    const product = str(b.product)?.trim() ?? ''
    out.product = ALLOWED_PRODUCTS.includes(product) ? product : DEFAULT_PRODUCT
  }

  // Archive (2026-10-15, Jillienne — Refinement's kebab gained "Archive", and
  // "Show archive" top right lists what it hid). `archived` is the client's
  // INTENT; the stamp is the server's — set the first time a record is
  // archived, carried through later saves while it stays archived (the client
  // echoes `archivedAt` back when editing an archived row), and cleared the
  // moment it is unarchived. `archivedBy` is a typed label, like `addedBy`.
  // Boards without the control drop all of it, so a Links record cannot
  // quietly acquire an archive state it has no way to show or undo.
  if (cfg.archivable) {
    const archived = b.archived === true
    const prior = str(b.archivedAt) ?? ''
    out.archivedAt = archived ? (ISO_STAMP.test(prior) ? prior : new Date().toISOString()) : ''
    const archivedBy = str(b.archivedBy)?.trim() ?? ''
    if (archivedBy.length > MAX_ADDED_BY) errors.push(`archivedBy is longer than ${MAX_ADDED_BY} characters.`)
    else out.archivedBy = archived ? archivedBy : ''
  }

  // `isPublic` is DROPPED on the way in since 2026-10-15: the public site it
  // gated is retired, and a flag nothing reads is a flag that misleads. A
  // record saved before then keeps the key in Blobs until its next save,
  // when this rewrites it without one.

  // `yyyy-mm-dd`, stamped server-side when absent, and carried through an edit
  // so editing a record does not re-date it. A plain date string rather than a
  // timestamp for the same reason the QA store does: the client parses it by
  // hand to avoid the UTC off-by-one `new Date('2026-09-10')` produces.
  const added = str(b.addedDate)
  if (added && !/^\d{4}-\d{2}-\d{2}$/.test(added)) errors.push('addedDate must be yyyy-mm-dd.')
  out.addedDate = added || new Date().toISOString().slice(0, 10)

  // When this record was last SAVED — 2026-10-14, Jillienne: "a last updated
  // date/time field" on Refinement. Stamped HERE on every write and never
  // taken from the client, so a create, an edit, and an edit that changed
  // nothing all re-stamp it: "last updated" means last saved. A full ISO
  // timestamp with a zone, unlike `addedDate`, because this one is shown as
  // a clock in the viewer's own zone rather than as a calendar day.
  out.updatedAt = new Date().toISOString()

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
 * What a stored record looks like on the way OUT. The ONE thing that differs
 * from what is in Blobs is the retired-host swap, so a record written before
 * 2026-10-15 opens rather than 404s. Nothing else is derived or defaulted
 * here: a reader seeing a field it does not know is the client's problem to
 * ignore, and silently filling fields in on read is how a store and its
 * readers stop agreeing.
 */
function serveRecord(record: unknown): unknown {
  if (typeof record !== 'object' || record === null) return record
  const r = record as Json
  const url = str(r.url)
  if (!url) return r
  const fixed = rehostRetired(url)
  return fixed === url ? r : { ...r, url: fixed }
}

/**
 * Build the handler for one board. The response shape uses the word `links`
 * for the collection and `link` for one record on EVERY board — the client
 * store is shared too, and a per-board key name would be a second thing for
 * it to know for no gain.
 */
export function linkBoardHandler(cfg: BoardConfig): (req: Request) => Promise<Response> {
  const keyPattern = new RegExp(`^${cfg.idPrefix}-\\d{3}$`)
  // NON-GREEDY `.*?`, since 2026-10-07. The Research board's prefix EQUALS its
  // segment (`/api/research/research-001`), and a greedy `.*` swallowed the
  // first `/research/` and matched the id's own `research` as the segment,
  // leaving `-001` as the tail — a 400 on every single-record request. Links
  // and Demo never hit it because `link` ≠ `links`; `Research.test.tsx` pins
  // the case.
  const tailPattern = new RegExp(`^.*?\\/${cfg.segment}\\/?`)

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
        return json({ links: links.filter(Boolean).map(serveRecord) })
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
      return json({ link: serveRecord(found) })
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
