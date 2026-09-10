/**
 * Links — the panel.
 *
 * The section's one requirement is that a link can be added without a code
 * change. Nothing here is authored in the repo.
 *
 * ── The form is behind a CTA, not on the page ────────────────────────────────
 * It started as an always-visible composer above the list, and that was the
 * wrong default: four fields of chrome sit permanently above the thing you came
 * to read, and adding a link is the OCCASIONAL act on this page while reading it
 * is the constant one. The composer is a `Modal` now, opened by a primary
 * Add link CTA — the same component and the same call `QaNoteForm` makes one
 * section down, which is what keeps the two authoring surfaces from drifting.
 *
 * **`--ux-*` custom properties DO work inside it**, which is not obvious and is
 * worth not re-deriving: `Modal` portals to `document.body`, outside this page's
 * shell — but `UxDashboardPage` calls `mirrorPaletteToRoot`, which exists for
 * exactly that case. So the modal re-skins with the four schemes and four
 * appearances like everything else here, and its primary button can take
 * `--ux-accent` (as `QaNoteForm`'s already does).
 *
 * ── The store is shared, so every write re-reads ─────────────────────────────
 * `useLinks` re-fetches the collection after each save rather than patching
 * local state optimistically. Another reviewer may have added a link since this
 * page loaded, and the server owns the id and the date — an optimistic list is
 * a second, quietly diverging copy of something more than one person can write
 * to.
 *
 * ── An unreachable endpoint hides every authoring affordance ─────────────────
 * Under plain `npm run dev` there is no function to talk to, and the honest
 * response is to say so rather than to render an Add link button that fails on
 * click. Same call the QA panel makes, and the reason `LinkIndex` carries
 * `loading` separately from `available`: for the tick before the first fetch
 * settles, "no endpoint" is not yet a fact.
 */

import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, ClipboardList, PenToSquare, Plus, Trash } from '@/icons'
import { Modal } from '@/components/ui/Modal'
import {
  LINK_TYPES,
  LinkWriteError,
  createLink,
  deleteLink,
  draftProblems,
  hostOf,
  linkTypeLabel,
  readLastAuthor,
  rememberLastAuthor,
  safeHref,
  saveLink,
  toMarkdown,
  useLinks,
  type LinkDraft,
  type LinkType,
  type StoredLink,
} from '@/data/linkStore'

/* ── styles ───────────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { maxWidth: 820 }

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

const optionalStyle: CSSProperties = { fontWeight: 400, textTransform: 'none' }

const fieldWrapStyle: CSSProperties = { marginBottom: 12 }

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 13px',
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

const errorStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-bg)',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.6,
}

const modalBodyStyle: CSSProperties = { padding: '18px 20px 4px' }

const modalFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 20px',
  borderTop: '1px solid var(--ux-border)',
}

const modalHintStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--ux-text-3)',
  margin: '2px 0 16px',
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

/* A neutral LABEL, deliberately not colour-coded. `ResourceIcon` is the warning
   here: it began as a content type, picked up per-card glyphs for variety, and
   the field's two jobs stopped coinciding. A type says what a link IS; giving
   each one a hue would invent a meaning ramp nobody asked for, and two of the
   palettes are olive-greens a "Design" green would vanish into. */
const chipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  padding: '2px 7px',
  borderRadius: 999,
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  flex: 'none',
}

const filterRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 14,
}

/* No per-pill counts — the total sits beside the strip in the toolbar. The
   convention the product's `PillTabs` follows, matched here rather than reused
   because that component is on brand tokens and this panel is on `--ux-*`. */
const filterPillStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 11px',
  borderRadius: 999,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

const filterPillActiveStyle: CSSProperties = {
  ...filterPillStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

const emptyStyle: CSSProperties = {
  border: '1px dashed var(--ux-border)',
  borderRadius: 12,
  padding: '26px 16px',
  textAlign: 'center',
  display: 'grid',
  gap: 10,
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

const EMPTY_DRAFT: LinkDraft = { title: '', url: '', note: '', addedBy: '', type: '' }

/** Below this the search field is a dead control — it costs a row of chrome to
 *  filter a list you can already see all of. Same reasoning as the status pills
 *  on the project sections, which only render when there is more than one. */
const SEARCH_THRESHOLD = 6

/** null = closed. 'new' = adding. A `StoredLink` = editing that record. One
 *  form for all three, so the add and edit paths cannot drift in what they
 *  validate — the same shape `QaNotesPanel` uses for its editor. */
type Editing = null | 'new' | StoredLink

/* ── the form ─────────────────────────────────────────────────────────────── */

function LinkFormModal({
  editing,
  draft,
  errors,
  busy,
  onChange,
  onSubmit,
  onClose,
}: {
  editing: Editing
  draft: LinkDraft
  errors: string[]
  busy: boolean
  onChange: (patch: Partial<LinkDraft>) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const isEdit = editing !== null && editing !== 'new'
  return (
    <Modal
      open={editing !== null}
      onClose={onClose}
      // A pasted address plus a typed title is enough to be worth not losing to
      // a stray click outside the dialog. Same call `QaNoteForm` makes.
      disableBackdropClose
      width={560}
      title={isEdit ? 'Edit link' : 'Add a link'}
    >
      <div style={modalBodyStyle}>
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
            onChange={(e) => onChange({ url: e.target.value })}
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
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="What a reviewer should see"
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="link-type">
            Type <span style={optionalStyle}>— optional</span>
          </label>
          <select
            id="link-type"
            value={draft.type}
            onChange={(e) => onChange({ type: e.target.value as LinkType })}
            style={fieldStyle}
          >
            {/* '' first, and labelled — a select whose empty option is blank
                reads as a value that failed to load. */}
            <option value="">No type</option>
            {LINK_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="link-note">
            Note <span style={optionalStyle}>— optional</span>
          </label>
          <input
            id="link-note"
            value={draft.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Why it is here, or what to look at"
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="link-added-by">
            Added by <span style={optionalStyle}>— optional</span>
          </label>
          <input
            id="link-added-by"
            value={draft.addedBy}
            onChange={(e) => onChange({ addedBy: e.target.value })}
            placeholder="Your name"
            style={fieldStyle}
          />
        </div>

        <p style={modalHintStyle}>
          Saved to the shared store — everyone who opens this site sees it, and it survives a
          cleared cache. The date is stamped for you.
        </p>
      </div>

      <div style={modalFooterStyle}>
        <button type="button" onClick={onSubmit} disabled={busy} style={primaryBtnStyle}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add link'}
        </button>
        <button type="button" onClick={onClose} disabled={busy} style={btnStyle}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}

/* ── the panel ────────────────────────────────────────────────────────────── */

export function LinksPanel() {
  const { index, refresh } = useLinks()
  const [editing, setEditing] = useState<Editing>(null)
  const [draft, setDraft] = useState<LinkDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState('')
  /** '' = All. Not a `LinkType`, because "no type" is itself a filterable
   *  value here and would collide with it. */
  const [typeFilter, setTypeFilter] = useState<string>('')

  const q = query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      index.links.filter(
        (l) =>
          (!typeFilter || l.type === typeFilter) &&
          (!q ||
            l.title.toLowerCase().includes(q) ||
            l.url.toLowerCase().includes(q) ||
            l.note.toLowerCase().includes(q) ||
            l.addedBy.toLowerCase().includes(q) ||
            linkTypeLabel(l.type).toLowerCase().includes(q)),
      ),
    [index.links, q, typeFilter],
  )

  /** The types actually PRESENT, in the authored order. A pill for a type
   *  nothing carries is a dead control — the same rule the project sections'
   *  status pills follow, which only render what the section actually holds. */
  const presentTypes = useMemo(
    () => LINK_TYPES.filter((t) => index.links.some((l) => l.type === t.id)),
    [index.links],
  )

  const change = (patch: Partial<LinkDraft>) => setDraft((d) => ({ ...d, ...patch }))

  /**
   * Stable identity, and that is load-bearing rather than tidiness.
   *
   * `Modal`'s focus effect is keyed on `[open, onClose]` and calls
   * `dialogRef.focus()` when it runs. A fresh closure each render therefore
   * re-runs it on EVERY KEYSTROKE, pulling focus off the field being typed
   * into — the first build of this took exactly one character per input and
   * dropped the rest. tsc was clean and the modal rendered; only typing into
   * it showed anything wrong.
   */
  const close = useCallback(() => {
    setEditing(null)
    setDraft(EMPTY_DRAFT)
    setErrors([])
  }, [])

  const beginAdd = () => {
    // Prefilled from this browser's last author, so a name is typed once rather
    // than once per link. Still fully editable, and still optional.
    setDraft({ ...EMPTY_DRAFT, addedBy: readLastAuthor() })
    setErrors([])
    setEditing('new')
  }

  const beginEdit = (link: StoredLink) => {
    // The record's OWN author, not this browser's last one — editing someone
    // else's link must not quietly reassign it.
    setDraft({
      title: link.title,
      url: link.url,
      note: link.note,
      addedBy: link.addedBy,
      type: link.type,
    })
    setErrors([])
    setEditing(link)
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
      if (editing && editing !== 'new') await saveLink(editing.id, draft)
      else await createLink(draft)
      rememberLastAuthor(draft.addedBy)
      await refresh()
      close()
    } catch (err) {
      setErrors(err instanceof LinkWriteError ? err.errors : ['Could not save.'])
    } finally {
      setBusy(false)
    }
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
      if (editing && editing !== 'new' && editing.id === link.id) close()
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
      {/* ── toolbar ── */}
      {index.links.length > 0 && (
        <div style={toolbarStyle}>
          {index.available && (
            <button type="button" onClick={beginAdd} style={primaryBtnStyle}>
              <Plus size={12} aria-hidden />
              Add link
            </button>
          )}
          {index.links.length >= SEARCH_THRESHOLD && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search links"
              aria-label="Search links"
              style={{ ...fieldStyle, width: 200 }}
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

      {/* ── type filter ──
          Only when there is more than one type to choose between: a single
          pill filters nothing, and "All" beside one option is chrome. */}
      {presentTypes.length > 1 && (
        <div style={filterRowStyle} role="group" aria-label="Filter by type">
          <button
            type="button"
            onClick={() => setTypeFilter('')}
            aria-pressed={typeFilter === ''}
            style={typeFilter === '' ? filterPillActiveStyle : filterPillStyle}
          >
            All
          </button>
          {presentTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
              aria-pressed={typeFilter === t.id}
              style={typeFilter === t.id ? filterPillActiveStyle : filterPillStyle}
            >
              {t.label}
            </button>
          ))}
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
                ? 'Everything here is added on the page — nothing is authored in code.'
                : 'The authoring endpoint is not reachable from here — run `netlify dev`, or open the deployed site.'}
          </p>
          {index.available && (
            <button type="button" onClick={beginAdd} style={primaryBtnStyle}>
              <Plus size={12} aria-hidden />
              Add the first link
            </button>
          )}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ux-text-3)' }}>
          No links match {q && typeFilter ? 'that search and type' : q ? 'that search' : 'that type'}.
        </p>
      ) : (
        <ul style={listStyle}>
          {rows.map((link, i) => {
            // Re-checked at the point of USE, not trusted from the store — see
            // `safeHref`. A row whose address cannot be linked still shows, as
            // text, so it can be found and fixed rather than silently vanishing.
            const href = safeHref(link.url)
            // Assembled rather than interpolated, so an absent author leaves no
            // stray separator — a trailing "·" reads as a value that failed to
            // load, which is the same reason a self-paid Seat cell on the admin
            // roster is blank rather than "n/a".
            const meta = [
              hostOf(link.url),
              link.addedDate && `added ${link.addedDate}`,
              link.addedBy.trim() && `by ${link.addedBy.trim()}`,
              !href && 'not a linkable address',
            ].filter(Boolean)
            return (
              <li
                key={link.id}
                // Hover / focus-within live in `tokens.css` — inline
                // `CSSProperties` cannot carry a pseudo-class.
                className="cre-uxlinks-row"
                style={{
                  ...itemStyle,
                  borderBottom: i === rows.length - 1 ? 'none' : itemStyle.borderBottom,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  {link.type && (
                    <span style={{ ...chipStyle, marginBottom: 4 }}>
                      {linkTypeLabel(link.type)}
                    </span>
                  )}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cre-uxlinks-title"
                      style={titleLinkStyle}
                    >
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
                  <p style={metaStyle}>{meta.join(' · ')}</p>
                  {link.note.trim() && <p style={noteTextStyle}>{link.note}</p>}
                </div>
                {index.available && (
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <button
                      type="button"
                      onClick={() => beginEdit(link)}
                      disabled={busy}
                      className="cre-uxlinks-action"
                      style={iconBtnStyle}
                      aria-label={`Edit ${link.title}`}
                    >
                      <PenToSquare size={12} aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(link)}
                      disabled={busy}
                      className="cre-uxlinks-action"
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

      <LinkFormModal
        editing={editing}
        draft={draft}
        errors={errors}
        busy={busy}
        onChange={change}
        onSubmit={() => void submit()}
        onClose={close}
      />
    </div>
  )
}
