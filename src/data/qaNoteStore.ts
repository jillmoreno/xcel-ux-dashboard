/**
 * QA findings — the browser side of the authoring endpoint.
 *
 * `qaNotes.ts` holds the COMMITTED seed, which is deliberately empty — findings
 * are authored on the live page and stored server-side
 * (`netlify/functions/qa-notes.ts`), then merged over the seed here. The merge
 * still matters with an empty seed: it is what lets a pasted-back snapshot become
 * committed data that a later edit can override rather than duplicate.
 *
 * The merge rule is the same one the captures use, deliberately:
 *
 *   stored record with a committed id  → OVERRIDES that finding
 *   stored record with a new id        → appended
 *   delete an override                 → reverts to the committed finding
 *   delete an authored record          → removes it
 *
 * So "stored wins over committed, and removing the stored thing reveals the
 * committed one" is one idea in this feature rather than two, and no destructive
 * action can reach something that is in git.
 */

import { useEffect, useState } from 'react'
import { QA_NOTES, type QaNote } from './qaNotes'

const BASE = '/api/qa-notes'

/** Where a finding on screen came from. Drives whether Delete says "remove" or
 *  "revert", and whether the editor warns that it is shadowing committed data. */
export type NoteOrigin = 'committed' | 'override' | 'authored'

export type MergedNote = QaNote & { origin: NoteOrigin }

export type NoteIndex = {
  /** False when there is no endpoint to talk to — plain `vite dev`, or a deploy
   *  without the function. The page then shows the committed findings read-only:
   *  the add / edit / delete affordances are hidden rather than offered and
   *  failing. */
  available: boolean
  /**
   * True until the first request settles.
   *
   * Separate from `available` because "not loaded yet" and "no endpoint" are
   * different facts, and the empty state says different things about them. With
   * one flag the page asserted the endpoint was unreachable for the tick before
   * the fetch resolved — telling the reader to go run `netlify dev` on a page
   * that was about to work.
   */
  loading: boolean
  notes: MergedNote[]
}

/** The committed set, read-only, in its authored order. */
export const COMMITTED_NOTES: QaNote[] = QA_NOTES

const COMMITTED_IDS = new Set(COMMITTED_NOTES.map((n) => n.id.toUpperCase()))

const committedOnly = (): MergedNote[] =>
  COMMITTED_NOTES.map((n) => ({ ...n, origin: 'committed' as const }))

/** The initial state: the committed seed, nothing claimed about the endpoint yet. */
export const EMPTY_NOTE_INDEX: NoteIndex = {
  available: false,
  loading: true,
  notes: committedOnly(),
}

/** The settled no-endpoint state. */
const UNAVAILABLE: NoteIndex = { available: false, loading: false, notes: committedOnly() }

/**
 * Highest committed id, handed to the server on create.
 *
 * The server allocates ids so two authors cannot claim the same number, but it
 * only sees its own store — the committed findings ship in the bundle. Without
 * this floor, the first authored finding would be handed `QA-001` and silently
 * override the first real one.
 */
export function committedIdFloor(): string {
  let max = 0
  for (const n of COMMITTED_NOTES) {
    const m = /^QA-(\d{3})$/i.exec(n.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `qa-${String(max).padStart(3, '0')}`
}

function mergeNotes(stored: QaNote[]): MergedNote[] {
  const byId = new Map<string, QaNote>()
  for (const n of stored) {
    if (typeof n?.id === 'string') byId.set(n.id.toUpperCase(), n)
  }
  const out: MergedNote[] = COMMITTED_NOTES.map((c) => {
    const override = byId.get(c.id.toUpperCase())
    return override
      ? { ...override, origin: 'override' as const }
      : { ...c, origin: 'committed' as const }
  })
  for (const [id, n] of byId) {
    if (!COMMITTED_IDS.has(id)) out.push({ ...n, origin: 'authored' as const })
  }
  return out
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

/** Thrown by every write so the form can list what the server objected to. */
export class NoteWriteError extends Error {
  readonly errors: string[]
  constructor(errors: string[]) {
    super(errors.join(' '))
    this.name = 'NoteWriteError'
    this.errors = errors
  }
}

export async function listNotes(): Promise<NoteIndex> {
  try {
    const res = await fetch(BASE, { headers: { accept: 'application/json' } })
    if (!res.ok) return UNAVAILABLE
    // A misrouted request returns index.html with a 200, which would throw on
    // parse rather than reporting "no backend". Check before parsing.
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) {
      return UNAVAILABLE
    }
    const body = (await res.json()) as { notes?: QaNote[] }
    return { available: true, loading: false, notes: mergeNotes(body.notes ?? []) }
  } catch {
    return UNAVAILABLE
  }
}

/** The editable fields. `id` and `loggedDate` are not among them — the server
 *  owns both, so a form cannot renumber a finding or backdate it. */
export type NoteDraft = Omit<QaNote, 'id' | 'loggedDate'>

export async function createNote(draft: NoteDraft): Promise<QaNote> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ minId: committedIdFloor(), note: draft }),
  })
  if (!res.ok) throw new NoteWriteError(await problems(res, `Could not save (${res.status}).`))
  const body = (await res.json()) as { note: QaNote }
  return body.note
}

export async function saveNote(id: string, draft: NoteDraft): Promise<QaNote> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) throw new NoteWriteError(await problems(res, `Could not save (${res.status}).`))
  const body = (await res.json()) as { note: QaNote }
  return body.note
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!res.ok) throw new NoteWriteError(await problems(res, `Could not delete (${res.status}).`))
}

/**
 * Everything on screen, as the `QA_NOTES` array literal that `qaNotes.ts`
 * expects — so the store can be snapshotted back into the repo.
 *
 * Netlify Blobs is not backed up. Without a way out, findings authored on the
 * live page live in exactly one place, and losing that store loses the QA
 * record. This is the way out: paste the result over the array in
 * `src/data/qaNotes.ts` and the stored records become committed ones.
 *
 * Emits the display shape, not the wire shape — `origin` is dropped, because it
 * is a fact about where a finding was read from and means nothing in a file
 * where everything is committed.
 */
export function exportAsDataFile(notes: MergedNote[]): string {
  const body = notes
    .map((n) => {
      const lines = [
        '  {',
        `    id: ${JSON.stringify(n.id)},`,
        `    title: ${JSON.stringify(n.title)},`,
        `    severity: ${JSON.stringify(n.severity)},`,
        `    status: ${JSON.stringify(n.status)},`,
        `    loggedDate: ${JSON.stringify(n.loggedDate)},`,
        n.bullets.length
          ? `    bullets: [\n${n.bullets.map((b) => `      ${JSON.stringify(b)},`).join('\n')}\n    ],`
          : '    bullets: [],',
        n.screens.length
          ? `    screens: [\n${n.screens
              .map(
                (sc) =>
                  `      { label: ${JSON.stringify(sc.label)}, src: ${JSON.stringify(sc.src)} },`,
              )
              .join('\n')}\n    ],`
          : '    screens: [],',
        '  },',
      ]
      return lines.join('\n')
    })
    .join('\n')
  return `export const QA_NOTES: QaNote[] = [\n${body}\n]\n`
}

/**
 * How many findings there are, for the nav badge.
 *
 * Static `QA_NOTES.length` was wrong the moment a finding could be authored on
 * the page: the rail said 18 while the page said 19. Same reason To Do's badge
 * is a live count rather than a field — a number that cannot change is only
 * correct until someone adds something.
 *
 * Seeds from the committed length so the badge is right on first paint rather
 * than flashing 0, and falls back to it if the endpoint is unreachable.
 */
export function useQaNoteCount(): number {
  const [count, setCount] = useState(COMMITTED_NOTES.length)
  useEffect(() => {
    let live = true
    void listNotes().then((index) => {
      if (live) setCount(index.notes.length)
    })
    return () => {
      live = false
    }
  }, [])
  return count
}
