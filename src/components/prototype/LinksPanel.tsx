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
import {
  ArrowUpRightFromSquare,
  BrowserWindow,
  ClipboardList,
  FileText,
  Grid,
  Layout,
  PenToSquare,
  Plus,
  Trash,
} from '@/icons'
import { Modal } from '@/components/ui/Modal'
import {
  DEFAULT_PRODUCT,
  LINKS_BOARD,
  LINK_PRODUCTS,
  LINK_TYPES,
  LinkWriteError,
  draftProblems,
  hostOf,
  linkProductLabel,
  linkTypeLabel,
  matchesProduct,
  safeHref,
  toMarkdown,
  type LinkBoard,
  type LinkDraft,
  type LinkProduct,
  type LinkType,
  type StoredLink,
} from '@/data/linkStore'
import { DEMO_BOARD } from '@/data/demoStore'
import { GeneratedThumb, THUMB_W } from './GeneratedThumb'
import { accentsByHost, hostKey, linkThumbKind } from './linkRowThumb'
import { isPublicGateway } from '@/data/gatewayMode'

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
  /**
   * Whether each row carries the generated accent tile, Exploration-style.
   * Refinement only (2026-09-29).
   *
   * A FLAG rather than "every board gets one", because the two boards are not
   * the same kind of list. A Refinement row is a PLACE you go and look at —
   * it earns a picture. Other Links is a bibliography: briefs, Figma files,
   * reference docs, most of them on hosts this repo knows nothing about, where
   * a tile derived from the URL would assert a kind it cannot actually read.
   */
  showThumb: boolean
  /**
   * Whether the Product control, its tag and the All / XCEL / Compass filter
   * render. Refinement only — Other Links points at briefs and Figma files that
   * are not "a product's branch" at all, so the question does not apply there.
   */
  showProduct: boolean
  /**
   * Whether the visibility, product and author facts render as BADGES under the
   * title instead of as a chip above it and a clause in the meta line.
   *
   * Refinement only, and a flag rather than a rewrite because Other Links has
   * one fact (its type) where Refinement has three — a badge row of one is just
   * a chip that moved, and `Links.test.tsx` pins the meta line's exact shape
   * including the missing-author case.
   */
  showBadges: boolean
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
}

export type LinkPrefill = { url: string; title: string; note: string }

/** One glyph per `LinkThumbKind`. Kept HERE rather than in `linkRowThumb.ts`
 *  so that module stays free of JSX and can be unit-tested as plain functions. */
const THUMB_GLYPH = {
  document: FileText,
  gallery: Grid,
  product: Layout,
  other: BrowserWindow,
} as const

/* ── styles ───────────────────────────────────────────────────────────────── */

const wrapStyle: CSSProperties = { maxWidth: 820 }

/** 820 + the tile (160) + the gap (10), so the text column keeps exactly the
 *  width it had before the picture was added rather than paying for it. */
const wrapThumbStyle: CSSProperties = { maxWidth: 990 }

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

/* ── the switch ──
   40x22 with an 18px knob: the track has to read as a track at a glance, and
   below about 36px wide the two states differ by a few pixels of travel. */
const switchStyle: CSSProperties = {
  position: 'relative',
  flex: 'none',
  width: 40,
  height: 22,
  padding: 0,
  borderRadius: 999,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-chip)',
  cursor: 'pointer',
  transition: 'background 120ms, border-color 120ms',
}

const switchOnStyle: CSSProperties = {
  ...switchStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
}

/* The knob is its own element so the travel can animate. `--ux-card` rather
   than white: on the dark themes white would be the brightest thing on the
   panel. */
const switchKnobStyle: CSSProperties = {
  position: 'absolute',
  top: 1,
  left: 1,
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'var(--ux-card)',
  border: '1px solid var(--ux-border)',
  transition: 'transform 120ms',
  transform: 'translateX(0)',
}

const switchKnobOnStyle: CSSProperties = {
  ...switchKnobStyle,
  borderColor: 'var(--ux-accent-strong)',
  transform: 'translateX(18px)',
}

/* ── the segmented product control ── */
const segmentRowStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--ux-border)',
  borderRadius: 8,
  overflow: 'hidden',
}

const segmentStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 15px',
  border: 'none',
  borderRight: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

const segmentActiveStyle: CSSProperties = {
  ...segmentStyle,
  background: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

/* ── the badge row under a title ──
   One shape for all three badges, so the row reads as one band of metadata
   rather than three unrelated marks. What varies is the fill, and only where
   the fill MEANS something: Public is the accent because it is the one state
   with a consequence outside the team. */
const badgeRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 6,
  margin: '5px 0 0',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  whiteSpace: 'nowrap',
}

/* ── the visibility badge ──
   A different colour from the product tag on purpose: those are two kinds of
   fact, and a reader who cannot tell them apart has to read both to find the
   one they wanted.

     visibility  who can see it   a STATE    → accent, outlined then solid
     product     which product    a CATEGORY → quiet filled chip
     author      who put it here  a PERSON   → neutral outline, sentence case

   OUTLINED rather than tinted, and that is the second attempt. The first mixed
   `--ux-hue-blue` into the card, which separated fine in light and collapsed to
   1.03:1 against `--ux-chip` in dark — measured. The cause is that the palette's
   hues are not independent of each other: in the moss light palette
   `--ux-hue-blue` and `--ux-accent` are the SAME hex, and `--ux-chip` is
   accent-derived too, so any tint-vs-tint scheme is one palette away from
   putting two near-identical pale pills side by side.

   Fill-vs-no-fill cannot collapse that way whatever the tokens resolve to, and
   it keeps Public as the loudest thing in the row — which it should be, being
   the one state with a consequence outside the team. */
const uxOnlyBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: 'transparent',
  border: '1px solid var(--ux-accent)',
  color: 'var(--ux-accent)',
}

/* Public keeps the accent, solid: it is the one state with a consequence
   outside the team, and it should be the loudest thing in the row. */
const publicBadgeStyle: CSSProperties = {
  ...badgeStyle,
  background: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

/* The author is a person, not a state — sentence case and no tracking, so it
   does not read as another status next to "UX ONLY". */
const authorBadgeStyle: CSSProperties = {
  ...badgeStyle,
  textTransform: 'none',
  letterSpacing: 0,
  fontWeight: 600,
  background: 'transparent',
  border: '1px solid var(--ux-border)',
  color: 'var(--ux-text-3)',
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

const EMPTY_DRAFT: LinkDraft = {
  title: '',
  url: '',
  note: '',
  addedBy: '',
  type: '',
  isPublic: false,
  product: DEFAULT_PRODUCT,
}

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

        {p.showProduct && (
          <div style={fieldWrapStyle}>
            <span style={labelStyle} id="link-product-label">
              Product
            </span>
            {/* Three mutually exclusive values, all visible, none of them a
                default the reader has to open a menu to discover — a select
                would hide two of three and put "Both" behind a click, which is
                the value most rows want. */}
            <div style={segmentRowStyle} role="radiogroup" aria-labelledby="link-product-label">
              {LINK_PRODUCTS.map((x, i) => {
                const on = (draft.product ?? DEFAULT_PRODUCT) === x.id
                const last = i === LINK_PRODUCTS.length - 1
                return (
                  <button
                    key={x.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => onChange({ product: x.id })}
                    // The divider belongs BETWEEN segments; on the last one it
                    // doubles up with the group's own border.
                    style={last ? { ...(on ? segmentActiveStyle : segmentStyle), borderRight: 'none' } : on ? segmentActiveStyle : segmentStyle}
                  >
                    {x.label}
                  </button>
                )
              })}
            </div>
            <p style={{ ...optionalStyle, margin: '5px 0 0', fontSize: 12 }}>
              Tags the row so the filters above the list can find it. Both is the default — plenty of
              this work lands in both products.
            </p>
          </div>
        )}

        {p.showPublicToggle && (
          <div style={fieldWrapStyle}>
            {/* A switch, not a checkbox: this is a live state someone flips back
                and forth as a row moves through review, not a form value
                submitted once. `role="switch"` on a real button keeps Space,
                Enter and the accessible name that a styled `<input>` would have
                had. Off by default — a row is UX-only until someone decides
                otherwise, never the reverse. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                role="switch"
                aria-checked={draft.isPublic === true}
                aria-label="Show on public site"
                onClick={() => onChange({ isPublic: draft.isPublic !== true })}
                style={draft.isPublic === true ? switchOnStyle : switchStyle}
              >
                <span
                  aria-hidden
                  style={draft.isPublic === true ? switchKnobOnStyle : switchKnobStyle}
                />
              </button>
              <span style={{ ...labelStyle, marginBottom: 0 }}>Show on public site</span>
            </div>
            <p style={{ ...optionalStyle, margin: '5px 0 0', fontSize: 12 }}>
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
  /* '' is All. A `both` row matches every pill — see `matchesProduct`. */
  const [productFilter, setProductFilter] = useState<LinkProduct | ''>('')

  const q = query.trim().toLowerCase()
  const rows = useMemo(
    () =>
      index.links.filter(
        (l) =>
          (!typeFilter || l.type === typeFilter) &&
          matchesProduct(l.product, productFilter) &&
          (!q ||
            l.title.toLowerCase().includes(q) ||
            l.url.toLowerCase().includes(q) ||
            l.note.toLowerCase().includes(q) ||
            l.addedBy.toLowerCase().includes(q) ||
            linkTypeLabel(l.type).toLowerCase().includes(q)),
      ),
    [index.links, q, typeFilter, productFilter],
  )

  /* Assigned across the WHOLE list, before any row draws — a per-row
     derivation cannot know which hosts came before it. Recomputed when the
     rows do, so filtering the list re-packs the hues onto what is visible. */
  const thumbAccents = useMemo(() => accentsByHost(rows.map((r) => r.url)), [rows])

  /** The types actually PRESENT, in the authored order. A pill for a type
   *  nothing carries is a dead control — the same rule the project sections'
   *  status pills follow, which only render what the section actually holds. */
  const presentTypes = useMemo(
    () => (p.showType ? LINK_TYPES.filter((t) => index.links.some((l) => l.type === t.id)) : []),
    [index.links, p.showType],
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
      product: link.product,
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
    <div style={p.showThumb ? wrapThumbStyle : wrapStyle}>
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

      {/* ── product filter ──
          Always rendered when the board has products, unlike the type strip
          below: `both` rows mean a pill can be empty and still be the right
          thing to offer, and the three pills are the section's stated
          vocabulary rather than a summary of what happens to be in the list
          today. */}
      {p.showProduct && (
        <div style={filterRowStyle} role="group" aria-label="Filter by product">
          <button
            type="button"
            onClick={() => setProductFilter('')}
            aria-pressed={productFilter === ''}
            style={productFilter === '' ? filterPillActiveStyle : filterPillStyle}
          >
            All
          </button>
          {LINK_PRODUCTS.filter((x) => x.id !== 'both').map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setProductFilter(productFilter === x.id ? '' : x.id)}
              aria-pressed={productFilter === x.id}
              style={productFilter === x.id ? filterPillActiveStyle : filterPillStyle}
            >
              {x.label}
            </button>
          ))}
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
              // Not here when it is a badge instead — printing it twice would
              // make the row look like two different facts about one person.
              !p.showBadges && link.addedBy.trim() && `by ${link.addedBy.trim()}`,
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
                  // The tile is a real third column rather than a float, so the
                  // text block wraps beside it instead of under it, and every
                  // row's text starts at the same x whatever its note's length.
                  ...(p.showThumb
                    ? {
                        gridTemplateColumns: `${THUMB_W}px minmax(0,1fr) auto`,
                        alignItems: 'start',
                        padding: '12px',
                      }
                    : null),
                  borderBottom: i === rows.length - 1 ? 'none' : itemStyle.borderBottom,
                }}
              >
                {p.showThumb && (
                  <GeneratedThumb accent={thumbAccents[hostKey(link.url)]} boost={1.7}>
                    {/* Sized to the tile, as on an Exploration row. */}
                    {(() => {
                      const Glyph = THUMB_GLYPH[linkThumbKind(link.url)]
                      return <Glyph size={34} />
                    })()}
                  </GeneratedThumb>
                )}
                <div style={{ minWidth: 0 }}>
                  {p.showType && link.type && (
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
                  {/* UNDER the title, all three together: they answer "can I
                      send this on", "is it mine to look at" and "who do I ask",
                      which is one question asked three ways. Above the title
                      they competed with it for the first line. */}
                  {p.showBadges && (
                    <div style={badgeRowStyle}>
                      {p.showPublicToggle && !p.publicOnly && (
                        <span style={link.isPublic ? publicBadgeStyle : uxOnlyBadgeStyle}>
                          {link.isPublic ? 'Public' : 'UX Only'}
                        </span>
                      )}
                      {p.showProduct && (
                        <span style={badgeStyle}>{linkProductLabel(link.product)}</span>
                      )}
                      {/* No badge at all when nobody signed it. An empty one
                          reads as a name that failed to load — the same reason
                          the meta line drops the separator. */}
                      {link.addedBy.trim() && (
                        <span style={authorBadgeStyle}>{link.addedBy.trim()}</span>
                      )}
                    </div>
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
  showThumb: false,
  showProduct: false,
  showBadges: false,
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
    showThumb: true,
    showProduct: true,
    showBadges: true,
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
  }
  return <LinkBoardPanel p={p} />
}
