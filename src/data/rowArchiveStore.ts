import { useEffect, useState } from 'react'

/**
 * THE ROW ARCHIVE — which project-list rows are hidden, and by whom
 * (2026-10-27). The client half of `netlify/functions/row-archive.ts`; the
 * reasoning is there.
 *
 * ⚠ UNAVAILABLE IS NOT EMPTY. Under the plain dev server there is no
 * `/api/*` at all and a misrouted request answers 200 with `index.html`, so a
 * read that failed to reach the endpoint reports `available: false` — and the
 * page hides the Archive action rather than offering a button that would
 * silently do nothing. The same distinction every board here draws.
 */

export const ROW_ARCHIVE_BASE = '/api/row-archive'

export type ArchivedRow = {
  id: string
  archivedAt: string
  archivedBy: string
}

export type RowArchiveIndex = {
  available: boolean
  loading: boolean
  /** Keyed by row id. */
  rows: Record<string, ArchivedRow>
}

export const EMPTY_ROW_ARCHIVE: RowArchiveIndex = { available: false, loading: true, rows: {} }
const UNAVAILABLE: RowArchiveIndex = { available: false, loading: false, rows: {} }

const EVENT = 'cgp:row-archive-changed'

function announce(): void {
  window.dispatchEvent(new Event(EVENT))
}

function isRow(v: unknown): v is ArchivedRow {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as ArchivedRow).id === 'string' &&
    typeof (v as ArchivedRow).archivedAt === 'string'
  )
}

export async function readRowArchive(): Promise<RowArchiveIndex> {
  try {
    const res = await fetch(ROW_ARCHIVE_BASE, { headers: { accept: 'application/json' } })
    if (!res.ok) return UNAVAILABLE
    if (!(res.headers.get('content-type') ?? '').includes('application/json')) return UNAVAILABLE
    const body = (await res.json()) as { rows?: unknown }
    const rows: Record<string, ArchivedRow> = {}
    for (const r of Array.isArray(body.rows) ? body.rows : []) {
      if (isRow(r)) {
        rows[r.id] = { id: r.id, archivedAt: r.archivedAt, archivedBy: typeof r.archivedBy === 'string' ? r.archivedBy : '' }
      }
    }
    return { available: true, loading: false, rows }
  } catch {
    return UNAVAILABLE
  }
}

export class RowArchiveWriteError extends Error {
  readonly errors: string[]
  constructor(errors: string[]) {
    super(errors.join(' '))
    this.name = 'RowArchiveWriteError'
    this.errors = errors
  }
}

/** Archive or unarchive one row. `by` is a label for who did it — the
 *  browser's last Refinement author, the same source the Add form prefills
 *  from — and the server stamps when. */
export async function setRowArchived(id: string, archived: boolean, by: string): Promise<void> {
  const res = await fetch(`${ROW_ARCHIVE_BASE}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ archived, archivedBy: archived ? by : '' }),
  })
  if (!res.ok) {
    let errors = [`Could not ${archived ? 'archive' : 'unarchive'} (${res.status}).`]
    try {
      const body = (await res.json()) as { errors?: string[] }
      if (Array.isArray(body.errors) && body.errors.length) errors = body.errors
    } catch {
      /* not JSON — keep the fallback */
    }
    throw new RowArchiveWriteError(errors)
  }
  announce()
}

/**
 * The archive, re-read after every write (this tab's or, via the event,
 * another component's). The page cannot patch local state instead: the
 * server owns the stamp.
 */
export function useRowArchive(): RowArchiveIndex {
  const [index, setIndex] = useState<RowArchiveIndex>(EMPTY_ROW_ARCHIVE)
  useEffect(() => {
    let alive = true
    const load = () => {
      void readRowArchive().then((next) => {
        if (alive) setIndex(next)
      })
    }
    load()
    window.addEventListener(EVENT, load)
    return () => {
      alive = false
      window.removeEventListener(EVENT, load)
    }
  }, [])
  return index
}
