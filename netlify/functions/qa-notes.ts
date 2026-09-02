/**
 * QA findings store — create, edit and delete findings from the live page.
 *
 * `src/data/qaNotes.ts` holds the committed seed that ships with the build —
 * currently empty, since findings are authored here instead. This endpoint holds
 * all of them, and the client merges the two:
 *
 *   - a record whose id matches a committed finding OVERRIDES it
 *   - a record with a new id is appended
 *   - deleting an override reverts to the committed finding; deleting an
 *     authored one removes it
 *
 * Exactly the same rule the capture endpoint uses for screenshots, so "stored
 * wins over committed, and removing the stored thing reveals the committed one"
 * is one idea in this feature rather than two.
 *
 * ── Why the validation below is not duplication ──────────────────────────────
 * `QaNote` is declared in `src/data/qaNotes.ts`, and it would be tempting to
 * import it. This is a trust boundary: a type is a compile-time claim about code
 * we wrote, and this handler is reached by whatever a caller chooses to send. A
 * malformed record here does not fail a build, it breaks the page for everyone
 * who opens it afterwards. So the shape is checked at runtime, independently.
 *
 * If a field is added to `QaNote`, it must be added to `FIELDS` here too or it
 * will be silently dropped on save. That coupling is the cost of the boundary.
 *
 * ── On authentication ────────────────────────────────────────────────────────
 * The same as the capture endpoint, but the stakes are higher: this writes the
 * QA record itself, not just its pictures. The key pattern and the field
 * validation bound what a caller can store, but they do not stop anyone who can
 * reach the endpoint from rewriting a finding. What actually guards this deploy
 * is Netlify's site-level password, which covers functions as well as pages. If
 * that ever comes off, this endpoint needs a real control before it goes public.
 */

import { getStore } from '@netlify/blobs'

export const config = {
  path: ['/api/qa-notes', '/api/qa-notes/:id'],
}

const STORE_NAME = 'qa-notes'

/**
 * `qa-013`. Same shape as the capture keys, so the two stores line up.
 *
 * The blob KEY is lower-case; the `id` INSIDE the record is upper-case
 * (`QA-013`). That is not an inconsistency — the committed findings use the
 * upper-case form, and the client merges stored records against them by id, so a
 * lower-case id would append a duplicate instead of overriding. Capture keys are
 * derived by lower-casing the id, so both forms line up there either way.
 */
const KEY_PATTERN = /^qa-\d{3}$/

const SEVERITIES = ['Blocker', 'High', 'Medium', 'Low']
const STATUSES = ['Open', 'Needs decision', 'Fixed', "Won't fix"]
const LABELS = ['Expected', 'Actual']

/** Per-field limits. Generous enough for a real title, small enough that the
 *  store cannot be used as a place to park arbitrary data. Trimmed on 2026-08-26
 *  alongside the form — surface, state, blocked-on, the prose expected/actual
 *  pair, the feature flag and the ticket ref all went. */
const FIELDS = { title: 200 } as const

const MAX_BULLETS = 40
const MAX_BULLET_LEN = 500

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
function validate(input: unknown, id: string): { note: Json } | { errors: string[] } {
  const errors: string[] = []
  if (typeof input !== 'object' || input === null) return { errors: ['Body must be an object.'] }
  const b = input as Json

  // Upper-case in the record, whatever case the key arrived in — see KEY_PATTERN.
  const out: Json = { id: id.toUpperCase() }

  for (const [key, max] of Object.entries(FIELDS)) {
    const v = str(b[key])
    const trimmed = v?.trim() ?? ''
    if (!trimmed) {
      errors.push(`${key} is required.`)
      continue
    }
    if (trimmed.length > max) errors.push(`${key} is longer than ${max} characters.`)
    out[key] = trimmed
  }

  const severity = str(b.severity)
  if (!severity || !SEVERITIES.includes(severity)) errors.push(`severity must be one of: ${SEVERITIES.join(', ')}.`)
  else out.severity = severity

  const status = str(b.status)
  if (!status || !STATUSES.includes(status)) errors.push(`status must be one of: ${STATUSES.join(', ')}.`)
  else out.status = status

  // `yyyy-mm-dd`, stamped server-side when absent. Kept as a plain date string
  // rather than a timestamp because the client parses it by hand to avoid the
  // UTC off-by-one `new Date('2026-08-26')` produces.
  const logged = str(b.loggedDate)
  if (logged && !/^\d{4}-\d{2}-\d{2}$/.test(logged)) errors.push('loggedDate must be yyyy-mm-dd.')
  out.loggedDate = logged || new Date().toISOString().slice(0, 10)

  // Bullets: a flat list, where a leading two-space prefix marks one level of
  // nesting. Trailing whitespace is trimmed but the LEADING prefix is preserved,
  // because it carries meaning.
  const bulletsRaw = b.bullets
  if (bulletsRaw === undefined || bulletsRaw === null) out.bullets = []
  else if (!Array.isArray(bulletsRaw)) errors.push('bullets must be a list.')
  else if (bulletsRaw.length > MAX_BULLETS) errors.push(`No more than ${MAX_BULLETS} bullets.`)
  else {
    const bullets: string[] = []
    for (const item of bulletsRaw) {
      const v = str(item)
      if (v === null) {
        errors.push('Every bullet must be text.')
        break
      }
      const cleaned = v.replace(/\s+$/, '')
      if (!cleaned.trim()) continue
      if (cleaned.length > MAX_BULLET_LEN) {
        errors.push(`A bullet is longer than ${MAX_BULLET_LEN} characters.`)
        break
      }
      bullets.push(cleaned)
    }
    out.bullets = bullets
  }

  // `screens` names COMMITTED files under `public/qa/`. A finding authored here
  // has none — its pictures are uploads keyed to the id, held by the capture
  // endpoint — so this is normally `[]` and exists to carry a pasted-back
  // snapshot's paths through an edit without dropping them.
  const screensRaw = b.screens
  if (screensRaw === undefined || screensRaw === null) out.screens = []
  else if (!Array.isArray(screensRaw)) errors.push('screens must be a list.')
  else if (screensRaw.length > 2) errors.push('A finding has at most two screens.')
  else {
    const screens: Json[] = []
    for (const item of screensRaw) {
      if (typeof item !== 'object' || item === null) {
        errors.push('Every screen must be an object.')
        break
      }
      const s = item as Json
      const label = str(s.label)
      if (!label || !LABELS.includes(label)) {
        errors.push(`screen label must be one of: ${LABELS.join(', ')}.`)
        break
      }
      const src = s.src === null || s.src === undefined ? null : str(s.src)
      if (src !== null && (src.length > 300 || !src.startsWith('/'))) {
        errors.push('screen src must be a root-relative path.')
        break
      }
      screens.push({ label, src })
    }
    out.screens = screens
  }

  return errors.length ? { errors } : { note: out }
}

/** Highest `qa-NNN` already stored, as a number. */
async function highestStored(store: ReturnType<typeof getStore>): Promise<number> {
  const { blobs } = await store.list()
  let max = 0
  for (const b of blobs) {
    const m = /^qa-(\d{3})$/.exec(b.key)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const tail = url.pathname.replace(/^.*\/qa-notes\/?/, '')
  // Lower-cased so `/api/qa-notes/QA-013` and `/api/qa-notes/qa-013` address the
  // same record. The display id is re-cased inside `validate`.
  const id = tail ? decodeURIComponent(tail).toLowerCase() : null

  const store = getStore({ name: STORE_NAME, consistency: 'strong' })

  // ── collection ────────────────────────────────────────────────────────────
  if (!id) {
    if (req.method === 'GET') {
      const { blobs } = await store.list()
      const notes = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })))
      return json({ notes: notes.filter(Boolean) })
    }

    if (req.method === 'POST') {
      // Create. The id is assigned HERE rather than by the client, so two
      // authors saving at once cannot both claim the same number. `minId` is the
      // highest id among the COMMITTED findings, which the server has no way to
      // know — it ships in the bundle, not the store.
      let body: Json
      try {
        body = (await req.json()) as Json
      } catch {
        return json({ errors: ['Body must be JSON.'] }, 400)
      }
      const minRaw = str(body.minId) ?? ''
      const minMatch = /^qa-(\d{3})$/.exec(minRaw)
      const floor = minMatch ? Number(minMatch[1]) : 0
      const next = Math.max(await highestStored(store), floor) + 1
      if (next > 999) return json({ errors: ['Out of ids — the key pattern allows up to qa-999.'] }, 409)
      const newId = `qa-${String(next).padStart(3, '0')}`
      const result = validate(body.note, newId)
      if ('errors' in result) return json({ errors: result.errors }, 422)
      await store.setJSON(newId, result.note)
      return json({ note: result.note }, 201)
    }

    return json({ errors: ['Method not allowed'] }, 405)
  }

  if (!KEY_PATTERN.test(id)) return json({ errors: [`Not a finding id: ${id}`] }, 400)

  // ── one record ────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const found = await store.get(id, { type: 'json' })
    if (!found) return json({ errors: ['Not found'] }, 404)
    return json({ note: found })
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
    await store.setJSON(id, result.note)
    return json({ note: result.note })
  }

  if (req.method === 'DELETE') {
    await store.delete(id)
    return json({ id, deleted: true })
  }

  return json({ errors: ['Method not allowed'] }, 405)
}
