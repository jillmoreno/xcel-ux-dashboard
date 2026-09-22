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

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, ClipboardList, PenToSquare, Plus, Trash } from '@/icons'
import { Modal } from '@/components/ui/Modal'
import {
  LINKS_BOARD,
  LINK_TYPES,
  LinkWriteError,
  draftProblems,
  hostOf,
  linkTypeLabel,
  safeHref,
  toMarkdown,
  type LinkBoard,
  type LinkDraft,
  type LinkType,
  type StoredLink,
} from '@/data/linkStore'
import { DEMO_BOARD } from '@/data/demoStore'
import { isPublicGateway } from '@/data/gatewayMode'
import {
  isBranchOnBoard,
  safeBranchHref,
  titleFromBranch,
  useBranches,
  type BranchDeploy,
} from '@/data/branchStore'

/**
 * What one board CALLS things and SHOWS. `LinksPanel` and `DemoPanel` below
 * are the two instances; the panel itself is `LinkBoardPanel`, shared since
 * 2026-09-18 so the two authoring surfaces cannot drift — the same reason the
 * Jump Back In card's rows became the Study Plan's real `TaskRow`.
 */
export type LinkBoardPresentation = {
  board: LinkBoard
  /** 'link' / 'demo' — the singular noun in every label and count. */
  noun: string
  nounPlural: string
  /** Whether the Type field and its filter strip render. Links only. */
  showType: boolean
  /** Whether the form carries the "Show on public site" toggle and rows show a
   *  Public / Team chip. Demo only. */
  showPublicToggle: boolean
  /** Show only rows with `isPublic` — the public build's Demo. */
  publicOnly: boolean
  /** No Add / Edit / Remove anywhere, whatever the endpoint says. The public
   *  build's Demo: stakeholders read it, designers author it on the full site. */
  readOnly: boolean
  /** The empty-state sentence when the endpoint IS reachable. */
  emptyHint: string
  /** The sentence under the form's fields. */
  saveHint: string
  /**
   * Fields to open the Add form WITH, once, as soon as the panel can author.
   * This is the hand-off the `promote-to-refinement` skill uses: it derives
   * the branch URL and the title in Claude Code and opens the full site at
   * `/?section=demo&add=1&url=…&title=…&note=…`; the PAGE reads those params
   * (it owns the router state) and passes them here. Nothing is saved without
   * the designer's click — the form's own validation and the endpoint's both
   * still run. Ignored whenever the panel cannot author (public build,
   * endpoint down), so a prefill link opened on the public site does nothing.
   */
  prefill?: LinkPrefill | null
  /** Called once the prefill has been consumed, so the owner can take the
   *  params off the address and a reload does not reopen the form. */
  onPrefillConsumed?: () => void
  /**
   * Render the automatic branch strip above the rows. Refinement on the FULL
   * site only.
   *
   * It is a PRESENTATION flag rather than something the strip decides for
   * itself, because the reason it is off is editorial in two different ways at
   * once: Other Links is not about branches at all, and the public build must
   * never show branch names — `feat/drop-the-renewal-band` on a stakeholder's
   * screen is a roadmap they were never shown. The endpoint refuses there too
   * (see `netlify/functions/branches.ts`); this is the half of that a reader
   * of this file can see.
   */
  showBranches?: boolean
}

export type LinkPrefill = { url: string; title: string; note: string }

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

const EMPTY_DRAFT: LinkDraft = { title: '', url: '', note: '', addedBy: '', type: '', isPublic: false }

/** Below this the search field is a dead control — it costs a row of chrome to
 *  filter a list you can already see all of. Same reasoning as the status pills
 *  on the project sections, which only render when there is more than one. */
const SEARCH_THRESHOLD = 6

/** null = closed. 'new' = adding. A `StoredLink` = editing that record. One
 *  form for all three, so the add and edit paths cannot drift in what they
 *  validate — the same shape `QaNotesPanel` uses for its editor. */
type Editing = null | 'new' | StoredLink

/* ── the automatic branch strip ───────────────────────────────────────────── */

const stripStyle: CSSProperties = {
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  background: 'var(--ux-card)',
  padding: '12px 13px',
  marginBottom: 16,
}

const stripHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 2,
}

const stripTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
}

const stripNoteStyle: CSSProperties = {
  margin: '0 0 10px',
  fontSize: 12.5,
  lineHeight: 1.55,
  color: 'var(--ux-text-3)',
}

const branchRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: 10,
  alignItems: 'center',
  padding: '8px 0',
  borderTop: '1px solid var(--ux-border)',
}

const branchNameStyle: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: 'var(--ux-text)',
  overflowWrap: 'anywhere',
}

/**
 * THE AUTOMATIC BRANCH LIST (2026-09-21).
 *
 * Every branch with a Netlify build that is not already on the board, with one
 * action: put it on the board. It is a DISCOVERY surface, and the distinction
 * it turns on is worth stating plainly, because the obvious simplification
 * destroys it.
 *
 * A branch having a build is a fact about Netlify. A row on the Refinement
 * board is somebody ASKING to be reviewed — it carries the note saying where
 * to look, whose it is, and the `isPublic` flag that decides whether
 * stakeholders see it. Those are different things, so the strip never writes:
 * its button opens the same Add form a designer would have filled in by hand,
 * with the address and a draft title already in it. **The click stays the
 * gate**, exactly as it is for the `promote-to-refinement` skill, and for the
 * same reason — the difference between "this exists" and "please look at this"
 * is the whole value of the board.
 *
 * Auto-creating rows instead was considered and is the trap: the store would
 * fill with branches nobody offered, `isPublic` would have nothing meaningful
 * to hang on, and deleting a row would just bring it back on the next build.
 *
 * It renders only where it can author — no strip on the public build, and none
 * while the board endpoint is down, where an Add button would fail on click.
 */
function BranchStrip({
  boardUrls,
  onAdd,
}: {
  /** Every URL currently on the board, so a branch already listed drops out. */
  boardUrls: readonly string[]
  onAdd: (branch: BranchDeploy) => void
}) {
  const { index } = useBranches()

  // Nothing at all until the first fetch settles: a strip that appears saying
  // "no branches" and then fills in reads as a bug. `loading` is carried
  // separately from `available` for exactly this tick.
  if (index.loading) return null

  if (!index.available) {
    /**
     * SILENT WHEN THERE IS NO ENDPOINT; LOUD WHEN THERE IS ONE AND IT IS
     * MISCONFIGURED. That line is the whole rule here.
     *
     * This strip is a convenience over a board that works without it, so a
     * grey box above a healthy list every time someone runs `npm run dev` is
     * noise — and worse, it is noise that looks like a fault in the thing
     * underneath. But a token that has expired IS a fault, nobody would
     * otherwise notice it, and the list just quietly goes empty.
     *
     * `no-endpoint` is the client's way of saying our function did not answer
     * at all (vite serves no /api, something else replied). Anything else came
     * FROM the function and means it is deployed and unhappy.
     */
    if (index.reason === 'no-endpoint') return null
    const why =
      index.reason === 'no-credentials'
        ? 'Set NETLIFY_API_TOKEN and NETLIFY_SITE_ID on this Netlify project to list branch builds here.'
        : 'Could not reach Netlify for the branch list — the token may have expired.'
    return (
      <div style={stripStyle}>
        <p style={stripTitleStyle}>Branch builds</p>
        <p style={{ ...stripNoteStyle, margin: '6px 0 0' }}>{why}</p>
      </div>
    )
  }

  const unlisted = index.branches.filter((b) => !isBranchOnBoard(b.slug, boardUrls))
  const listed = index.branches.length - unlisted.length

  return (
    <div style={stripStyle}>
      <div style={stripHeadStyle}>
        <p style={stripTitleStyle}>Branch builds</p>
        <span style={{ fontSize: 12, color: 'var(--ux-text-3)' }}>
          {index.branches.length === 0
            ? 'none right now'
            : /* The count says how many are ALREADY on the board rather than
                 leaving them silently missing — a designer who put their branch
                 up and cannot find it in this list should be able to see why
                 without guessing. */
              `${unlisted.length} not on the board${listed ? ` · ${listed} already added` : ''}`}
        </span>
      </div>
      <p style={stripNoteStyle}>
        Branches Netlify has built. Adding one opens the form — the note saying what to look at is
        yours to write.
      </p>

      {unlisted.length === 0 ? (
        <p style={{ ...stripNoteStyle, margin: 0, fontStyle: 'italic' }}>
          {index.branches.length === 0
            ? 'No branch has a build right now.'
            : 'Every branch with a build is already on the board.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {unlisted.map((b) => {
            const href = safeBranchHref(b.reviewUrl)
            return (
              <li key={b.branch} style={branchRowStyle}>
                <div style={{ minWidth: 0 }}>
                  <span style={branchNameStyle}>{b.branch}</span>
                  {/* Assembled, not interpolated — absent parts drop out
                      rather than leaving a trailing separator, which reads as
                      a value that failed to load. The board's own row meta
                      follows the same rule. */}
                  <p style={{ ...metaStyle, margin: '2px 0 0' }}>
                    {[b.updated && `built ${b.updated}`, b.author && `by ${b.author}`, b.commit]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...iconBtnStyle, textDecoration: 'none' }}
                    >
                      <ArrowUpRightFromSquare size={11} aria-hidden />
                      Open
                    </a>
                  )}
                  <button type="button" onClick={() => onAdd(b)} style={iconBtnStyle}>
                    <Plus size={11} aria-hidden />
                    Add
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* ── the form ─────────────────────────────────────────────────────────────── */

function LinkFormModal({
  p,
  editing,
  draft,
  errors,
  busy,
  onChange,
  onSubmit,
  onClose,
}: {
  p: LinkBoardPresentation
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
      title={isEdit ? `Edit ${p.noun}` : `Add a ${p.noun}`}
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

        {p.showType && (
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
        )}

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

        {p.showPublicToggle && (
          <div style={fieldWrapStyle}>
            {/* A checkbox, not a toggle switch or a select: it is one yes/no
                fact with a real consequence, and the label says the
                consequence in words. Off by default — a row is team-only until
                someone decides otherwise, never the reverse. */}
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draft.isPublic === true}
                onChange={(e) => onChange({ isPublic: e.target.checked })}
                style={{ margin: 0, width: 15, height: 15, accentColor: 'var(--ux-accent)' }}
              />
              Show on public site
            </label>
            <p style={{ ...optionalStyle, margin: '4px 0 0 23px', fontSize: 12 }}>
              Off: only the team sees this row. On: stakeholders with the public link see it too.
            </p>
          </div>
        )}

        <p style={modalHintStyle}>{p.saveHint}</p>
      </div>

      <div style={modalFooterStyle}>
        <button type="button" onClick={onSubmit} disabled={busy} style={primaryBtnStyle}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : `Add ${p.noun}`}
        </button>
        <button type="button" onClick={onClose} disabled={busy} style={btnStyle}>
          Cancel
        </button>
      </div>
    </Modal>
  )
}

/* ── the panel ────────────────────────────────────────────────────────────── */

export function LinkBoardPanel({ p }: { p: LinkBoardPresentation }) {
  const { index: rawIndex, refresh } = p.board.useLinks()
  const { createLink, saveLink, deleteLink, readLastAuthor, rememberLastAuthor } = p.board
  // `publicOnly` filters at the INDEX, not at render, so the count, the search
  // and the empty state all describe the same list a stakeholder can see.
  const index = useMemo(
    () => (p.publicOnly ? { ...rawIndex, links: rawIndex.links.filter((l) => l.isPublic) } : rawIndex),
    [rawIndex, p.publicOnly],
  )
  // What "can author here" means: the endpoint answers AND this build is not
  // read-only. Every Add / Edit / Remove affordance below reads this one flag.
  const canAuthor = index.available && !p.readOnly
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
    () => (p.showType ? LINK_TYPES.filter((t) => index.links.some((l) => l.type === t.id)) : []),
    [index.links, p.showType],
  )

  /** Every URL on the board — what the strip matches a branch against so a
   *  branch already up for review is not offered again. Read from the UNFILTERED
   *  index, not `rows`: a branch is already on the board whether or not the
   *  current search or type filter happens to be showing it. */
  const boardUrls = useMemo(() => index.links.map((l) => l.url), [index.links])

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

  /**
   * Add-from-the-strip. The same form, seeded from what Netlify knows.
   *
   * The NOTE is deliberately left empty. It is the one field the strip could
   * fill from the commit subject and the one field it must not: "where to
   * look" is the thing only the person who did the work knows, and a plausible
   * wrong note is worse than a blank one — it reads as reviewed when nobody
   * wrote it. Same reasoning that keeps `quickSummary` something Jillienne is
   * asked for rather than drafted.
   *
   * `isPublic` stays false, which is the default and the whole review gate. A
   * branch appearing in the strip is a fact about Netlify; showing it to
   * stakeholders is a decision, and it is not this button's to make.
   */
  const beginAddFromBranch = (b: BranchDeploy) => {
    setDraft({
      ...EMPTY_DRAFT,
      addedBy: readLastAuthor(),
      url: b.reviewUrl,
      title: titleFromBranch(b.branch),
    })
    setErrors([])
    setEditing('new')
  }

  /**
   * The prefill — see `LinkBoardPresentation.prefill`. Waits until the
   * endpoint has answered (before that `canAuthor` is false for the wrong
   * reason), fires once, and tells the owner so the params come off the
   * address. The owner is the page, which holds the router state: stripping
   * them here with `history.replaceState` would leave the router believing
   * they were still there, and the next section change would write them back.
   */
  const [prefillConsumed, setPrefillConsumed] = useState(false)
  const { prefill, onPrefillConsumed } = p
  useEffect(() => {
    if (prefillConsumed || !prefill || !canAuthor) return
    // Intentional, the `FeatureFlagPanel` precedent: the draft is SEEDED once
    // an external fact arrives (the endpoint answered) and the designer then
    // edits it, so it cannot be derived during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPrefillConsumed(true)
    setDraft({ ...EMPTY_DRAFT, addedBy: readLastAuthor(), url: prefill.url, title: prefill.title, note: prefill.note })
    setErrors([])
    setEditing('new')
    /* eslint-enable react-hooks/set-state-in-effect */
    onPrefillConsumed?.()
  }, [prefillConsumed, prefill, canAuthor, readLastAuthor, onPrefillConsumed])

  const beginEdit = (link: StoredLink) => {
    // The record's OWN author, not this browser's last one — editing someone
    // else's link must not quietly reassign it.
    setDraft({
      title: link.title,
      url: link.url,
      note: link.note,
      addedBy: link.addedBy,
      type: link.type,
      isPublic: link.isPublic,
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
      {/* ── the automatic branch list ──
          Above the rows, and only where this panel can author: on the public
          build there is nothing to add with, and while the endpoint is down an
          Add button would fail on click — the rule the composer already
          follows. */}
      {p.showBranches && canAuthor && (
        <BranchStrip boardUrls={boardUrls} onAdd={beginAddFromBranch} />
      )}

      {/* ── toolbar ── */}
      {index.links.length > 0 && (
        <div style={toolbarStyle}>
          {canAuthor && (
            <button type="button" onClick={beginAdd} style={primaryBtnStyle}>
              <Plus size={12} aria-hidden />
              Add {p.noun}
            </button>
          )}
          {index.links.length >= SEARCH_THRESHOLD && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${p.nounPlural}`}
              aria-label={`Search ${p.nounPlural}`}
              style={{ ...fieldStyle, width: 200 }}
            />
          )}
          <span style={{ fontSize: 13, color: 'var(--ux-text-3)' }}>
            {rows.length} {rows.length === 1 ? p.noun : p.nounPlural}
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
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--ux-text)' }}>No {p.nounPlural} yet.</p>
          <p style={{ margin: 0, fontSize: 13 }}>
            {index.loading
              ? 'Checking…'
              : index.available
                ? p.emptyHint
                : 'The authoring endpoint is not reachable from here — run `netlify dev`, or open the deployed site.'}
          </p>
          {canAuthor && (
            <button type="button" onClick={beginAdd} style={primaryBtnStyle}>
              <Plus size={12} aria-hidden />
              Add the first {p.noun}
            </button>
          )}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--ux-text-3)' }}>
          No {p.nounPlural} match {q && typeFilter ? 'that search and type' : q ? 'that search' : 'that type'}.
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
                  {p.showType && link.type && (
                    <span style={{ ...chipStyle, marginBottom: 4 }}>
                      {linkTypeLabel(link.type)}
                    </span>
                  )}
                  {/* On the full site the chip says WHO can see the row — the
                      one fact about a Demo row a reviewer needs before sending
                      the link on. Not rendered when `publicOnly`: every row
                      there is public, and a chip saying so on each is noise. */}
                  {p.showPublicToggle && !p.publicOnly && (
                    <span
                      style={{
                        ...chipStyle,
                        marginBottom: 4,
                        ...(link.isPublic ? { background: 'var(--ux-accent)', color: 'var(--ux-on-accent)' } : {}),
                      }}
                    >
                      {link.isPublic ? 'Public' : 'Team only'}
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
                {canAuthor && (
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
        p={p}
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

/* ── the two instances ────────────────────────────────────────────────────── */

const LINKS_PRESENTATION: LinkBoardPresentation = {
  board: LINKS_BOARD,
  noun: 'link',
  nounPlural: 'links',
  showType: true,
  showPublicToggle: false,
  publicOnly: false,
  readOnly: false,
  emptyHint: 'Everything here is added on the page — nothing is authored in code.',
  saveHint:
    'Saved to the shared store — everyone who opens this site sees it, and it survives a cleared cache. The date is stamped for you.',
}

/** Links: authorable on BOTH sites, an editorial decision recorded in CLAUDE.md
 *  ("it is the place you send someone"). */
export function LinksPanel() {
  return <LinkBoardPanel p={LINKS_PRESENTATION} />
}

/**
 * Refinement (section id `demo`): the work-in-review inbox. Authorable on the
 * FULL site only; the public build renders it read-only and filtered to the
 * rows someone has flipped public. That asymmetry IS the review gate — see
 * `demoStore.ts`.
 */
export function DemoPanel({
  prefill,
  onPrefillConsumed,
}: {
  prefill?: LinkPrefill | null
  onPrefillConsumed?: () => void
} = {}) {
  const pub = isPublicGateway()
  const p: LinkBoardPresentation = {
    board: DEMO_BOARD,
    // "link", not "demo" — what the designer is adding IS a link (to their
    // branch), and "Add link" is what the button on the neighbouring Other
    // Links panel says. Two boards, one verb.
    noun: 'link',
    nounPlural: 'links',
    showType: false,
    showPublicToggle: true,
    publicOnly: pub,
    readOnly: pub,
    emptyHint: pub
      ? 'Nothing is being shown for review right now.'
      : 'Push a branch, paste its Netlify URL here, and the team can open it. Flip "Show on public site" when it is ready for stakeholders.',
    saveHint:
      'Saved to the shared store — the team sees it on the full site right away. The date is stamped for you.',
    // From `/?section=demo&add=1&url=…&title=…&note=…` — what
    // `promote-to-refinement` opens. Refinement only: Other Links is authored
    // by hand, so `LinksPanel` passes nothing.
    prefill,
    onPrefillConsumed,
    // The automatic branch list. Full site only — see `showBranches`. It is
    // the in-page twin of what `promote-to-refinement` does from Claude Code:
    // both derive the branch's address and open this form with it, and neither
    // saves anything.
    showBranches: !pub,
  }
  return <LinkBoardPanel p={p} />
}
