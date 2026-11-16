/**
 * COMPARE NOTES — the per-widget notes on `/compare/:compareId` (2026-11-16).
 *
 * A comparison page sets one version's widget beside another's, block by
 * block, so Jillienne can decide what the refined one should become. The
 * decision is made while looking at the two, and this is where it is written
 * down: one note per widget, stored beside the widget rather than in a
 * document somewhere else. Everyone who opens the page sees the same notes,
 * which is the point — they are Refinement-style working text, not a record.
 *
 * ONE RECORD PER COMPARISON. The blob key is the comparison id
 * (`compass-readiness`), and the record is `{ notes: { [widgetId]: text },
 * updatedAt }`. A PUT replaces the whole record. Widgets are few and the text
 * is short, so last-writer-wins on the page is acceptable; the client refetches
 * after each save so two people editing different widgets converge.
 *
 * Validation is the trust boundary, as in the other endpoints: the shape is
 * checked here at runtime, not by a type imported from `src/`.
 *
 * Same password-at-the-edge story as the QA endpoint: Netlify's site password
 * is what keeps this from the open web.
 */

import { openStore } from '../lib/store'

export const config = {
  path: ['/api/compare-notes/:id'],
}

const STORE_NAME = 'compare-notes'

/** `compass-readiness` — the compare page's id, lower-case, dashes. */
const KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const WIDGET_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const MAX_WIDGETS = 60
const MAX_NOTE_LEN = 4000

type Json = Record<string, unknown>

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

function validate(input: unknown): { record: Json } | { errors: string[] } {
  if (typeof input !== 'object' || input === null) return { errors: ['Body must be an object.'] }
  const b = input as Json
  const raw = b.notes
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { errors: ['notes must be an object.'] }
  const entries = Object.entries(raw as Json)
  if (entries.length > MAX_WIDGETS) return { errors: [`No more than ${MAX_WIDGETS} widgets.`] }
  const notes: Record<string, string> = {}
  for (const [k, v] of entries) {
    if (!WIDGET_PATTERN.test(k)) return { errors: [`Not a widget id: ${k}`] }
    if (typeof v !== 'string') return { errors: [`Note for ${k} must be text.`] }
    if (v.length > MAX_NOTE_LEN) return { errors: [`Note for ${k} is longer than ${MAX_NOTE_LEN} characters.`] }
    const cleaned = v.replace(/\s+$/, '')
    if (cleaned.trim()) notes[k] = cleaned
  }
  return { record: { notes, updatedAt: new Date().toISOString() } }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const tail = url.pathname.replace(/^.*\/compare-notes\/?/, '')
  const id = tail ? decodeURIComponent(tail).toLowerCase() : ''
  if (!KEY_PATTERN.test(id)) return json({ errors: [`Not a comparison id: ${id}`] }, 400)

  const store = openStore(STORE_NAME)

  if (req.method === 'GET') {
    const found = (await store.get(id, { type: 'json' })) as Json | null
    return json({ record: found ?? { notes: {}, updatedAt: null } })
  }

  if (req.method === 'PUT') {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return json({ errors: ['Body must be JSON.'] }, 400)
    }
    const result = validate(body)
    if ('errors' in result) return json({ errors: result.errors }, 422)
    await store.setJSON(id, result.record)
    return json({ record: result.record })
  }

  return json({ errors: ['Method not allowed'] }, 405)
}
