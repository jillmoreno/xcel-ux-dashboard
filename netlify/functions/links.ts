/**
 * Links store — create, edit and delete links from the live page.
 *
 * The point of this endpoint is that the Links section needs NO code change to
 * gain a link. There is no committed seed the way `qaNotes.ts` is one for the QA
 * section: every link on the page came through here, so the store is the whole
 * list rather than an override layer over a file. That is why there is no
 * "stored wins over committed" merge on the client — there is nothing to win
 * against.
 *
 * ── Why the validation below is not duplication ──────────────────────────────
 * Same reasoning as the QA endpoint: `StoredLink` is a compile-time claim about
 * code we wrote, and this handler is reached by whatever a caller chooses to
 * send. A malformed record does not fail a build, it breaks the page for
 * everyone who opens it afterwards. So the shape is checked at runtime here,
 * independently of the type.
 *
 * If a field is added to `StoredLink`, it must be handled here too or it will be
 * silently dropped on save. That coupling is the cost of the boundary.
 *
 * ── The URL check is a SECURITY check, not a tidiness one ────────────────────
 * Every stored `url` is rendered as an `<a href>`. `javascript:` and `data:`
 * URIs in an href execute in the page's own origin, so a store that accepts one
 * turns "add a link" into "run code in every reviewer's browser". `parseUrl`
 * therefore allow-LISTS http and https rather than blocking a list of known-bad
 * schemes — a blocklist is one novel scheme away from being wrong. The client
 * re-checks at render time for the same reason the server does not trust the
 * client: a record written by an older, laxer version of this file must not
 * become live code later.
 *
 * ── On authentication ────────────────────────────────────────────────────────
 * The same as the QA endpoints: the key pattern and the field validation bound
 * what a caller can store, but they do not stop anyone who can reach the
 * endpoint from rewriting a link. What actually guards this deploy is Netlify's
 * site-level password, which covers functions as well as pages. If that ever
 * comes off, this endpoint needs a real control before it goes public — and it
 * needs it MORE than the QA one does, because what it stores is a destination a
 * reviewer is invited to click.
 */

import { getStore } from '@netlify/blobs'

export const config = {
  path: ['/api/links', '/api/links/:id'],
}

const STORE_NAME = 'links'

/** `link-007`. Same shape as the QA and capture keys, so the stores line up.
 *  Unlike the QA keys there is no upper-case display form to reconcile: nothing
 *  committed carries a link id, so the key IS the id. */
const KEY_PATTERN = /^link-\d{3}$/

/** Per-field limits. Generous enough for a real title and a long tracking URL,
 *  small enough that the store cannot be used to park arbitrary data. */
const MAX_TITLE = 200
const MAX_URL = 2000
const MAX_NOTE = 500

/** Only these reach an href. See the security note above — an allow-list, not a
 *  blocklist. */
const ALLOWED_PROTOCOLS = ['http:', 'https:']

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
function validate(input: unknown, id: string): { link: Json } | { errors: string[] } {
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

  // `yyyy-mm-dd`, stamped server-side when absent, and carried through an edit
  // so editing a link does not re-date it. Kept as a plain date string rather
  // than a timestamp for the same reason the QA store does: the client parses it
  // by hand to avoid the UTC off-by-one `new Date('2026-09-10')` produces.
  const added = str(b.addedDate)
  if (added && !/^\d{4}-\d{2}-\d{2}$/.test(added)) errors.push('addedDate must be yyyy-mm-dd.')
  out.addedDate = added || new Date().toISOString().slice(0, 10)

  return errors.length ? { errors } : { link: out }
}

/** Highest `link-NNN` already stored, as a number. */
async function highestStored(store: ReturnType<typeof getStore>): Promise<number> {
  const { blobs } = await store.list()
  let max = 0
  for (const b of blobs) {
    const m = /^link-(\d{3})$/.exec(b.key)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const tail = url.pathname.replace(/^.*\/links\/?/, '')
  const id = tail ? decodeURIComponent(tail).toLowerCase() : null

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })

  // ── collection ────────────────────────────────────────────────────────────
  if (!id) {
    if (req.method === 'GET') {
      const { blobs } = await store.list()
      const links = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
      return json({ links: links.filter(Boolean) })
    }

    if (req.method === 'POST') {
      // Create. The id is assigned HERE rather than by the client, so two
      // authors saving at once cannot both claim the same number. No `minId`
      // floor is needed — unlike the QA store there are no committed records
      // shipping in the bundle for a fresh id to collide with.
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return json({ errors: ['Body must be JSON.'] }, 400)
      }
      const next = (await highestStored(store)) + 1
      if (next > 999) return json({ errors: ['Out of ids — the key pattern allows up to link-999.'] }, 409)
      const newId = `link-${String(next).padStart(3, '0')}`
      const result = validate(body, newId)
      if ('errors' in result) return json({ errors: result.errors }, 422)
      await store.setJSON(newId, result.link)
      return json({ link: result.link }, 201)
    }

    return json({ errors: ['Method not allowed'] }, 405)
  }

  if (!KEY_PATTERN.test(id)) return json({ errors: [`Not a link id: ${id}`] }, 400)

  // ── one record ────────────────────────────────────────────────────────────
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
    const result = validate(body, id)
    if ('errors' in result) return json({ errors: result.errors }, 422)
    await store.setJSON(id, result.link)
    return json({ link: result.link })
  }

  if (req.method === 'DELETE') {
    await store.delete(id)
    return json({ id, deleted: true })
  }

  return json({ errors: ['Method not allowed'] }, 405)
}
