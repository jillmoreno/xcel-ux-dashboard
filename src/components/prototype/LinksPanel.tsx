/**
 * Links — the panel.
 *
 * The section's one requirement is that a link can be added without a code
 * change, so everything here is in service of that: a composer at the top, a
 * list under it, and edit / delete on every row. Nothing about a link is
 * authored in the repo.
 *
 * Colours come from the page's own `--ux-*` palette rather than the brand
 * tokens, so the panel re-skins with the four schemes and four appearances like
 * the rest of the dashboard — the same choice `TodoPanel` makes, and the reason
 * this one needs no `ARCHIVE_BRIDGE` wrapper the way the archive table and the
 * QA panel do.
 *
 * Two things worth not re-deriving:
 *
 * ── The store is shared, so every write re-reads ─────────────────────────────
 * `useLinks` re-fetches the collection after each save rather than patching
 * local state optimistically. Another reviewer may have added a link since this
 * page loaded, and the server owns the id and the date — an optimistic list is
 * a second, quietly diverging copy of something more than one person can write
 * to. The cost is a round trip on save, which is invisible against the one the
 * save itself takes.
 *
 * ── An unreachable endpoint HIDES the composer ───────────────────────────────
 * Under plain `npm run dev` there is no function to talk to, and the honest
 * response is to say so rather than to render an Add button that fails on
 * click. Same call the QA panel makes, and the reason `LinkIndex` carries
 * `loading` separately from `available`: for the tick before the first fetch
 * settles, "no endpoint" is not yet a fact.
 */

import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, ClipboardList, PenToSquare, Plus, Trash } from '@/icons'
import {
  LinkWriteError,
  createLink,
  deleteLink,
  draftProblems,
  hostOf,
  safeHref,
  saveLink,
  toMarkdown,
  useLinks,
  type LinkDraft,
  type StoredLink,
} from '@/data/linkStore'

/* ── styles ───────────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { maxWidth: 820 }

const cardStyle: CSSProperties = {
  background: 'var(--ux-card)',
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  padding: 14,
  marginBottom: 18,
}

const fieldStyle: CSSProperties = {
  width: '100%',
  font: 'inherit',
  fontSize: 14,
  lineHeight: 1.5,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
  marginBottom: 5,
}

const fieldWrapStyle: CSSProperties = { marginBottom: 10 }

const rowActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 4,
  flexWrap: 'wrap',
}

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  ...btnStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

const iconBtnStyle: CSSProperties = {
  ...btnStyle,
  padding: '5px 8px',
  color: 'var(--ux-text-3)',
}

const hintStyle: CSSProperties = { fontSize: 13, color: 'var(--ux-text-3)', margin: '8px 0 0' }

const errorStyle: CSSProperties = {
  margin: '0 0 10px',
  padding: '8px 11px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.6,
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'var(--ux-card)',
}

const itemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: 10,
  alignItems: 'start',
  padding: '11px 12px',
  borderBottom: '1px solid var(--ux-border)',
}

const titleLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--ux-text)',
  textDecoration: 'none',
}

const metaStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--ux-text-3)',
  margin: '3px 0 0',
  overflowWrap: 'anywhere',
}

const noteTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: 'var(--ux-text-2)',
  margin: '5px 0 0',
}

const emptyStyle: CSSProperties = {
  border: '1px dashed var(--ux-border)',
  borderRadius: 12,
  padding: '22px 16px',
  textAlign: 'center',
  display: 'grid',
  gap: 8,
  justifyItems: 'center',
  color: 'var(--ux-text-2)',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
  flexWrap: 'wrap',
}

const EMPTY_DRAFT: LinkDraft = { title: '', url: '', note: '' }

/** Below this the search field is a dead control — it costs a row of chrome to
 *  filter a list you can already see all of. Same reasoning as the status pills
 *  on the project sections, which only render when there is more than one. */
const SEARCH_THRESHOLD = 6

/* ── the panel ────────────────────────────────────────────────────────────── */

export function LinksPanel() {
  const { index, refresh } = useLinks()
  const [draft, setDraft] = useState<LinkDraft>(EMPTY_DRAFT)
  /** null = the composer is adding; an id = it is editing that row. One form
   *  for both, so the two paths cannot drift in what they validate. */
  const [editingId, setEditingId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      index.links.filter(
        (l) =>
          !q ||
          l.title.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          l.note.toLowerCase().includes(q),
      ),
    [index.links, q],
  )

  const set = (patch: Partial<LinkDraft>) => setDraft((d) => ({ ...d, ...patch }))

  const reset = () => {
    setDraft(EMPTY_DRAFT)
    setEditingId(null)
    setErrors([])
  }

  const submit = async () => {
    // Checked here first so a typo is reported without a round trip. The
    // endpoint validates independently and its answer is the one that counts —
    // this is a courtesy, not the control.
    const local = draftProblems(draft)
    if (local.length) {
      setErrors(local)
      return
    }
    setBusy(true)
    setErrors([])
    try {
      if (editingId) await saveLink(editingId, draft)
      else await createLink(draft)
      await refresh()
      reset()
    } catch (err) {
      setErrors(err instanceof LinkWriteError ? err.errors : ['Could not save.'])
    } finally {
      setBusy(false)
    }
  }

  const beginEdit = (link: StoredLink) => {
    setEditingId(link.id)
    setDraft({ title: link.title, url: link.url, note: link.note })
    setErrors([])
  }

  const remove = async (link: StoredLink) => {
    // Confirmed because it is destructive and there is no undo — the store is
    // the only copy of a link, which is the same reason `Copy as markdown`
    // exists on this panel at all.
    if (!window.confirm(`Remove “${link.title}”?`)) return
    setBusy(true)
    try {
      await deleteLink(link.id)
      await refresh()
      if (editingId === link.id) reset()
    } catch (err) {
      setErrors(err instanceof LinkWriteError ? err.errors : ['Could not remove.'])
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(index.links))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — the list is unchanged, nothing to recover */
    }
  }

  return (
    <div style={wrapStyle}>
      {/* ── composer ── */}
      {index.available && (
        <div style={cardStyle}>
          {errors.length > 0 && (
            <div style={errorStyle} role="alert">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </div>
          )}

          <div style={fieldWrapStyle}>
            <label style={labelStyle} htmlFor="link-url">
              Address
            </label>
            <input
              id="link-url"
              type="url"
              inputMode="url"
              value={draft.url}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="https://…"
              style={fieldStyle}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label style={labelStyle} htmlFor="link-title">
              Title
            </label>
            <input
              id="link-title"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="What a reviewer should see"
              style={fieldStyle}
            />
          </div>

          <div style={fieldWrapStyle}>
            <label style={labelStyle} htmlFor="link-note">
              Note <span style={{ fontWeight: 400, textTransform: 'none' }}>— optional</span>
            </label>
            <input
              id="link-note"
              value={draft.note}
              onChange={(e) => set({ note: e.target.value })}
              placeholder="Why it is here, or what to look at"
              style={fieldStyle}
            />
          </div>

          <div style={rowActionsStyle}>
            <button type="button" onClick={() => void submit()} disabled={busy} style={primaryBtnStyle}>
              <Plus size={12} aria-hidden />
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Add link'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} disabled={busy} style={btnStyle}>
                Cancel
              </button>
            )}
          </div>

          <p style={hintStyle}>
            Saved to the shared store — everyone who opens this site sees it, and it survives a
            cleared cache.
          </p>
        </div>
      )}

      {/* ── toolbar ── */}
      {index.links.length > 0 && (
        <div style={toolbarStyle}>
          {index.links.length >= SEARCH_THRESHOLD && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search links"
              aria-label="Search links"
              style={{ ...fieldStyle, width: 220 }}
            />
          )}
          <span style={{ fontSize: 13, color: 'var(--ux-text-3)' }}>
            {rows.length} {rows.length === 1 ? 'link' : 'links'}
          </span>
          <button type="button" onClick={() => void copy()} style={{ ...btnStyle, marginLeft: 'auto' }}>
            <ClipboardList size={12} aria-hidden />
            {copied ? 'Copied' : 'Copy as markdown'}
          </button>
        </div>
      )}

      {/* ── list ── */}
      {index.links.length === 0 ? (
        <div style={emptyStyle}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ux-text)' }}>No links yet.</p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {index.loading
              ? 'Checking…'
              : index.available
                ? 'Paste an address above — nothing here is authored in code.'
                : 'The authoring endpoint is not reachable from here — run `netlify dev`, or open the deployed site.'}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ux-text-3)' }}>No links match that search.</p>
      ) : (
        <ul style={listStyle}>
          {rows.map((link, i) => {
            // Re-checked at the point of USE, not trusted from the store — see
            // `safeHref`. A row whose address cannot be linked still shows, as
            // text, so it can be found and fixed rather than silently vanishing.
            const href = safeHref(link.url)
            return (
              <li
                key={link.id}
                style={{ ...itemStyle, borderBottom: i === rows.length - 1 ? 'none' : itemStyle.borderBottom }}
              >
                <div style={{ minWidth: 0 }}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={titleLinkStyle}>
                      {link.title}
                      <ArrowUpRightFromSquare size={11} aria-hidden style={{ flex: 'none' }} />
                      <span className="cre-visually-hidden"> — opens in a new tab</span>
                    </a>
                  ) : (
                    <span style={{ ...titleLinkStyle, color: 'var(--ux-text-2)' }}>
                      {link.title}
                      <span className="cre-visually-hidden"> — address cannot be opened</span>
                    </span>
                  )}
                  <p style={metaStyle}>
                    {hostOf(link.url)}
                    {link.addedDate && ` · added ${link.addedDate}`}
                    {!href && ' · not a linkable address'}
                  </p>
                  {link.note.trim() && <p style={noteTextStyle}>{link.note}</p>}
                </div>
                {index.available && (
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <button
                      type="button"
                      onClick={() => beginEdit(link)}
                      disabled={busy}
                      style={iconBtnStyle}
                      aria-label={`Edit ${link.title}`}
                    >
                      <PenToSquare size={12} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(link)}
                      disabled={busy}
                      style={iconBtnStyle}
                      aria-label={`Remove ${link.title}`}
                    >
                      <Trash size={12} aria-hidden />
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
