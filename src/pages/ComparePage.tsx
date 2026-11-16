import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { PillTabs } from '@/components/ui/PillTabs'
import { compareDeckById, type CompareDeckMeta } from '@/data/compareDecks'
import { COMPASS_READINESS_CELLS, type Choices } from './compare/compassReadiness'
import './comparePage.css'

/**
 * `/compare/:compareId` — ONE SURFACE, TWO VERSIONS, WIDGET BY WIDGET
 * (2026-11-16). Built for the Compass Readiness decision: Jeff's page (V1)
 * and the Refined rebuild, each block drawn by the real component, so the
 * design lead can go through them and say what the refined one becomes.
 *
 * THREE THINGS ON THE PAGE, in order of how often they are touched:
 *
 *   · the LAYOUT switch — Side by side · V1 · Refined · Stacked — in the
 *     address as `?layout=`, so a link opens on the view it was sent from.
 *     Side by side is the default and the point; the single-column views exist
 *     for the moment type size has to be judged at the width the product
 *     draws it (the Variants deck's objection to columns, taken seriously
 *     rather than ignored).
 *   · the CONTROLS — every variant the deck declares, each in the address as
 *     `?<key>=`. A control scoped to one version is labelled with it. A
 *     control is drawn once, at the top, and again on each widget row it
 *     changes, so the choice is visible where the change is.
 *   · the NOTES — one per widget, saved to the server
 *     (`netlify/functions/compare-notes.ts`) on blur, visible to everyone who
 *     opens the page. Working text, not a record: the decision, when made,
 *     goes in a dev handoff.
 *
 * The render table for a deck lives beside this page in `src/pages/compare/`,
 * keyed by widget id and version id; the deck's metadata is in
 * `src/data/compareDecks.ts`. Adding a comparison is one entry in each.
 */

const CELLS: Record<string, Record<string, Record<string, (c: Choices) => ReactNode>>> = {
  'compass-readiness': COMPASS_READINESS_CELLS,
}

type Layout = 'side' | 'stack' | string

const NOTES_BASE = '/api/compare-notes'

export function ComparePage() {
  const { compareId } = useParams()
  const deck = compareDeckById(compareId)
  if (!deck) {
    return (
      <main className="cmp">
        <p className="cmp-empty">
          No comparison called <code>{compareId}</code>. The ones that exist are listed in{' '}
          <code>src/data/compareDecks.ts</code>.
        </p>
      </main>
    )
  }
  return <Deck deck={deck} cells={CELLS[deck.id] ?? {}} />
}

function Deck({
  deck,
  cells,
}: {
  deck: CompareDeckMeta
  cells: Record<string, Record<string, (c: Choices) => ReactNode>>
}) {
  const [params, setParams] = useSearchParams()

  const layouts = useMemo(
    () => [
      { id: 'side', label: 'Side by side' },
      ...deck.versions.map((v) => ({ id: v.id, label: `${v.label} only` })),
      { id: 'stack', label: 'Stacked' },
    ],
    [deck],
  )
  const layoutRaw = params.get('layout') ?? 'side'
  const layout: Layout = layouts.some((l) => l.id === layoutRaw) ? layoutRaw : 'side'

  const choices: Choices = useMemo(() => {
    const out: Choices = {}
    for (const c of deck.controls) {
      const v = params.get(c.key)
      out[c.key] = v && c.options.some((o) => o.value === v) ? v : c.defaultValue
    }
    return out
  }, [deck, params])

  const set = useCallback(
    (key: string, value: string, defaultValue?: string) => {
      const next = new URLSearchParams(params)
      if (value === defaultValue) next.delete(key)
      else next.set(key, value)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  const shown = layout === 'side' || layout === 'stack' ? deck.versions : deck.versions.filter((v) => v.id === layout)

  const notes = useNotes(deck.id)

  return (
    <main className="cmp" data-layout={layout}>
      <header className="cmp-head">
        <p className="cmp-eyebrow">Compare · {deck.surface}</p>
        <h1 className="cmp-h1">{deck.title}</h1>
        <p className="cmp-blurb">{deck.blurb}</p>
        <div className="cmp-toolbar">
          <div className="cmp-toolbar__group">
            <span className="cmp-toolbar__label">Layout</span>
            <PillTabs
              items={layouts}
              active={layout}
              onChange={(id) => set('layout', id, 'side')}
              label="Layout"
              size="compact"
            />
          </div>
          {deck.controls.map((c) => (
            <div className="cmp-toolbar__group" key={c.key}>
              <span className="cmp-toolbar__label">
                {c.label}
                {c.version !== 'both' ? (
                  <span className="cmp-toolbar__scope">{deck.versions.find((v) => v.id === c.version)?.label}</span>
                ) : null}
              </span>
              <PillTabs
                items={c.options.map((o) => ({ id: o.value, label: o.label }))}
                active={choices[c.key]}
                onChange={(v) => set(c.key, v, c.defaultValue)}
                label={c.label}
                size="compact"
              />
            </div>
          ))}
        </div>
        <p className="cmp-meta">
          {notes.state === 'unavailable'
            ? 'Notes are read-only here — no endpoint on this build.'
            : notes.state === 'loading'
              ? 'Loading notes…'
              : notes.updatedAt
                ? `Notes last saved ${new Date(notes.updatedAt).toLocaleString()}`
                : 'No notes yet. Type under a widget; it saves when you click away.'}
        </p>
      </header>

      <div className="cmp-cols" style={{ gridTemplateColumns: `repeat(${layout === 'side' ? shown.length : 1}, minmax(0, 1fr))` }}>
        {(layout === 'side' ? shown : shown.slice(0, 1)).map((v) => (
          <div className="cmp-colhead" key={v.id}>
            <span className="cmp-colhead__label">{layout === 'side' || layout === v.id ? v.label : 'Both versions'}</span>
            {layout === 'side' || layout === v.id ? (
              <>
                <span className="cmp-colhead__blurb">{v.blurb}</span>
                <a className="cmp-colhead__link" href={v.href} target="_blank" rel="noreferrer">
                  Open in the product ↗
                </a>
              </>
            ) : null}
          </div>
        ))}
      </div>

      <ol className="cmp-rows">
        {deck.widgets.map((w, i) => {
          const rowControls = deck.controls.filter((c) => c.widgets.includes(w.id))
          return (
            <li className="cmp-row" key={w.id} id={w.id}>
              <div className="cmp-row__head">
                <span className="cmp-row__n">{i + 1}</span>
                <div className="cmp-row__text">
                  <h2 className="cmp-row__title">{w.title}</h2>
                  <p className="cmp-row__purpose">{w.purpose}</p>
                </div>
                {rowControls.length ? (
                  <div className="cmp-row__controls">
                    {rowControls.map((c) => (
                      <label className="cmp-row__control" key={c.key}>
                        <span>
                          {c.label}
                          {c.version !== 'both' ? ` · ${deck.versions.find((v) => v.id === c.version)?.label}` : ''}
                        </span>
                        <select value={choices[c.key]} onChange={(e) => set(c.key, e.target.value, c.defaultValue)}>
                          {c.options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {c.flag ? <code title="The design control the product reads">{c.flag}</code> : null}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>

              <div
                className="cmp-cells"
                style={{ gridTemplateColumns: `repeat(${layout === 'side' ? shown.length : 1}, minmax(0, 1fr))` }}
              >
                {shown.map((v) => {
                  const cell = cells[w.id]?.[v.id]
                  return (
                    <div className="cmp-cellwrap" key={v.id} data-version={v.id}>
                      {layout === 'stack' ? <span className="cmp-cellwrap__tag">{v.label}</span> : null}
                      {cell ? (
                        cell(choices)
                      ) : (
                        <p className="cmp-none">
                          {w.only && w.only !== v.id ? `Only on ${w.only}.` : 'Not on this version.'}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <NoteField
                id={w.id}
                value={notes.notes[w.id] ?? ''}
                disabled={notes.state !== 'ready'}
                onSave={(text) => notes.save(w.id, text)}
              />
            </li>
          )
        })}
      </ol>

      <footer className="cmp-foot">
        <Link to="/">← Back to the Hub</Link>
        <span>·</span>
        <a href="/compass-version-map/" target="_blank" rel="noreferrer">
          The Compass Version Map
        </a>
      </footer>
    </main>
  )
}

/* ─── notes ───────────────────────────────────────────────────────────── */

type NotesState = 'loading' | 'ready' | 'unavailable'

function useNotes(deckId: string) {
  const [state, setState] = useState<NotesState>('loading')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const latest = useRef<Record<string, string>>({})
  useEffect(() => {
    latest.current = notes
  }, [notes])

  useEffect(() => {
    let cancelled = false
    fetch(`${NOTES_BASE}/${deckId}`, { headers: { accept: 'application/json' } })
      .then(async (r) => {
        /* The SPA fallback answers 200 with index.html where there is no
           function (plain `vite dev`); a JSON parse failure is the tell. */
        if (!r.ok) throw new Error(String(r.status))
        const ct = r.headers.get('content-type') ?? ''
        if (!ct.includes('json')) throw new Error('not json')
        return r.json() as Promise<{ record: { notes: Record<string, string>; updatedAt: string | null } }>
      })
      .then((b) => {
        if (cancelled) return
        setNotes(b.record.notes ?? {})
        setUpdatedAt(b.record.updatedAt ?? null)
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) setState('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [deckId])

  const save = useCallback(
    async (widgetId: string, text: string) => {
      const next = { ...latest.current, [widgetId]: text }
      if (!text.trim()) delete next[widgetId]
      setNotes(next)
      try {
        const r = await fetch(`${NOTES_BASE}/${deckId}`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ notes: next }),
        })
        if (!r.ok) return
        const b = (await r.json()) as { record: { notes: Record<string, string>; updatedAt: string | null } }
        setNotes(b.record.notes ?? {})
        setUpdatedAt(b.record.updatedAt ?? null)
      } catch {
        /* keep the local text; the next blur retries */
      }
    },
    [deckId],
  )

  return { state, notes, updatedAt, save }
}

function NoteField({
  id,
  value,
  disabled,
  onSave,
}: {
  id: string
  value: string
  disabled: boolean
  onSave: (text: string) => void
}) {
  const [text, setText] = useState(value)
  /* Re-seed from the server's copy when it changes (another author saved);
     the "previous prop" pattern rather than an effect, so an edit in hand is
     not clobbered mid-keystroke by a render. */
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    setText(value)
  }
  return (
    <div className="cmp-note">
      <label htmlFor={`note-${id}`} className="cmp-note__label">
        Notes
      </label>
      <textarea
        id={`note-${id}`}
        className="cmp-note__field"
        rows={2}
        placeholder={disabled ? '' : 'What should the refined one become? Saves when you click away.'}
        value={text}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== value) onSave(text)
        }}
      />
    </div>
  )
}
