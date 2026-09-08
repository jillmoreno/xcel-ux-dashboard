/**
 * QA Notes — the panel.
 *
 * An internal tracker for design-vs-build QA findings, rendered in the Design &
 * Development sandbox beside the feature list, the archive and To Do.
 *
 * Shape: a filterable LIST of cards, not a data grid. The findings are prose —
 * an expected, an actual, and a handful of bullets each — and a grid would give
 * every one of those a column it cannot fill. It follows the project list's own
 * language instead: a search box and a count, a single-select status strip, and
 * one card per row that opens a detail panel.
 *
 * Two things worth knowing before editing:
 *
 * - **Tokens, not the page palette.** Everything here is styled with brand
 *   `--color-*` tokens, and the page wraps the panel in `ARCHIVE_BRIDGE` — the
 *   six-token map that re-points them at the `--ux-*` palette. That is what lets
 *   the panel re-skin with the four schemes and four appearances. It also means
 *   the detail Sheet, which portals to `document.body` and so sits OUTSIDE the
 *   bridge, still renders correctly on the brand tokens. Text uses the ADAPTIVE
 *   tokens (`--color-text-primary` and friends) rather than raw neutral stops:
 *   a raw `--color-neutral-800` does not invert on this page, so it would be
 *   black type on the dark card in the Dim and Dark appearances.
 *
 * - **The two badge types are told apart by fill, not by shape.** Status badges
 *   carry a 12% tint of their own colour; severity badges are transparent. Same
 *   22px geometry, same 4px left border. They sit side by side on every row, so
 *   if both were filled the row would read as two statuses. This is why the
 *   shared `StatusBadge` is not reused — that primitive is a 28px full-radius
 *   pill with a filled ground, one shape with no second variant to spend here.
 */

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from 'react'
import { Download, PenToSquare, Plus, Search, Trash, X } from '@/icons'
import { Modal } from '@/components/ui/Modal'
import { Sheet } from '@/components/ui/Sheet'
import type { QaSeverity, QaStatus } from '@/data/qaNotes'
import {
  EMPTY_INDEX,
  captureUrl,
  deleteCapture,
  listCaptures,
  uploadCapture,
  type CaptureIndex,
} from '@/data/qaCaptureStore'
import {
  EMPTY_NOTE_INDEX,
  deleteNote,
  exportAsDataFile,
  listNotes,
  type MergedNote,
  type NoteIndex,
} from '@/data/qaNoteStore'
import { QaNoteForm } from './QaNoteForm'
import { UX_TOKEN_BRIDGE } from './uxPaletteBridge'
import {
  QA_SEVERITIES,
  QA_STATUSES,
  bulletText,
  captureSlotsFor,
  contextSlotsFor,
  filledSlots,
  filterQaNotes,
  formatLoggedDate,
  isNestedBullet,
  qaSummaryLine,
  sortQaNotes,
  statusCounts,
  type CaptureSlot,
} from './qaNotesUtil'

/* ── colour maps ──────────────────────────────────────────────────────────── */

/**
 * Status colour. The tint is `color-mix` of the SAME colour rather than a
 * hard-coded `-100` stop, so it sits correctly over the card in every
 * appearance — a fixed pale stop would vanish on the dark ones.
 */
const STATUS_COLOR: Record<QaStatus, { edge: string; tint: string }> = {
  Open: {
    edge: 'var(--color-error-500)',
    tint: 'color-mix(in srgb, var(--color-error-500) 12%, transparent)',
  },
  'Needs decision': {
    edge: 'var(--color-warning-500)',
    tint: 'color-mix(in srgb, var(--color-warning-500) 12%, transparent)',
  },
  Fixed: {
    edge: 'var(--color-success-500)',
    tint: 'color-mix(in srgb, var(--color-success-500) 12%, transparent)',
  },
  // The one status nobody acts on, and the only one with no semantic colour to
  // spend — a closed finding should not draw the eye of a triage pass.
  "Won't fix": {
    edge: 'var(--color-neutral-300)',
    tint: 'color-mix(in srgb, var(--color-neutral-300) 30%, transparent)',
  },
}

/**
 * Severity edge colour. Medium uses `info-500`: the spec asked for a `b2b-300`
 * that does not exist in this token set, and the Nectar info ramp is its nearest
 * real equivalent. `-500` rather than `-300` because this is a 4px border and
 * needs saturation, not text contrast.
 */
const SEVERITY_COLOR: Record<QaSeverity, string> = {
  Blocker: 'var(--color-error-500)',
  High: 'var(--color-warning-500)',
  Medium: 'var(--color-info-500)',
  Low: 'var(--color-neutral-300)',
}

/* ── badges ───────────────────────────────────────────────────────────────── */

const badgeBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 22,
  // 12px on the left rather than 8px, to clear the 4px accent bar.
  padding: '0 8px 0 12px',
  borderRadius: 4,
  // The 4px left edge is an INSET BOX-SHADOW, not a border. Both badge types set
  // only that edge's colour, and a `borderColor` / `borderLeftColor` pair is a
  // shorthand-plus-longhand mix that React warns about and can drop a value
  // from. An inset shadow also costs no layout, which is the same reason the
  // certificate cards draw their accent stroke this way.
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
  flex: 'none',
}

function StatusChip({ status }: { status: QaStatus }) {
  const { edge, tint } = STATUS_COLOR[status]
  return (
    // The aria-label names the DIMENSION, not just the value: "Open" alone does
    // not tell a screen-reader user whether they are hearing a status or a
    // severity, and both are on every row.
    <span
      aria-label={`Status: ${status}`}
      style={{ ...badgeBaseStyle, background: tint, boxShadow: `inset 4px 0 0 ${edge}` }}
    >
      {status}
    </span>
  )
}

function SeverityChip({ severity }: { severity: QaSeverity }) {
  return (
    <span
      aria-label={`Severity: ${severity}`}
      style={{
        ...badgeBaseStyle,
        background: 'transparent',
        boxShadow: `inset 4px 0 0 ${SEVERITY_COLOR[severity]}`,
      }}
    >
      {severity}
    </span>
  )
}

/* ── screenshots ──────────────────────────────────────────────────────────── */

const shotFrameStyle: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-neutral-50)',
  padding: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const missingShotStyle: CSSProperties = {
  ...shotFrameStyle,
  border: '1px dashed var(--color-neutral-light)',
  minHeight: 96,
  padding: 12,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

/**
 * One capture slot — Expected or Actual — and the drop target for it.
 *
 * Resolution order, which is the whole contract of this component: an uploaded
 * blob, else the file committed at `screens[].src`, else an empty state. So a
 * drop can override a committed capture without touching git, and removing the
 * drop reveals the committed one again rather than leaving a hole.
 *
 * The `<input type="file">` is not a convenience beside the drop zone — it is
 * the only way to add a capture without a pointer. A drag-only target is
 * unreachable by keyboard, so the label IS the control and the drop handler is
 * the shortcut.
 */
function CaptureSlotFigure({
  slot,
  title,
  canUpload,
  onOpen,
  onChanged,
}: {
  slot: CaptureSlot
  title: string
  canUpload: boolean
  onOpen: (view: { label: string; src: string }) => void
  onChanged: () => void
}) {
  // Same reasoning as `RowThumb`: keyed to the URL that failed, so a new src —
  // from an upload, or from the index arriving after first paint — is simply not
  // the broken one, with no flag to reset.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()

  const src = slot.capture ? captureUrl(slot.capture) : slot.committedSrc
  const broken = src !== null && failedSrc === src
  const uploaded = slot.capture !== null

  async function accept(file: File | undefined) {
    if (!file || busy) return
    setError(null)
    setBusy(true)
    try {
      await uploadCapture(slot.key, file)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setError(null)
    setBusy(true)
    try {
      await deleteCapture(slot.key)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove.')
    } finally {
      setBusy(false)
    }
  }

  const dropProps = canUpload
    ? {
        onDragOver: (e: DragEvent) => {
          e.preventDefault()
          setOver(true)
        },
        onDragLeave: () => setOver(false),
        onDrop: (e: DragEvent) => {
          e.preventDefault()
          setOver(false)
          void accept(e.dataTransfer?.files?.[0])
        },
      }
    : {}

  const frame: CSSProperties = {
    ...shotFrameStyle,
    ...(over ? { borderColor: 'var(--ux-accent)', background: 'var(--color-neutral-50)' } : null),
  }

  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }} {...dropProps}>
      {src && !broken ? (
        <button
          type="button"
          onClick={() => onOpen({ label: slot.label, src })}
          aria-label={`Enlarge ${slot.label} screenshot — ${title}`}
          style={{ ...frame, cursor: 'zoom-in' }}
        >
          <img
            src={src}
            alt={`${slot.label} — ${title}`}
            onError={() => setFailedSrc(src)}
            // Height-capped with `width: auto` + `contain` so a tall portrait
            // capture scales down inside the 480px panel instead of forcing it
            // to scroll sideways.
            style={{ maxWidth: '100%', maxHeight: 240, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </button>
      ) : canUpload ? (
        // The empty / broken state doubles as the drop target. The label is the
        // file input's, so clicking anywhere in the frame opens the picker and
        // the control is reachable by keyboard.
        <label htmlFor={inputId} style={{ ...frame, ...dropZoneStyle, borderColor: over ? 'var(--ux-accent)' : undefined }}>
          {busy ? 'Uploading…' : over ? 'Drop to upload' : broken ? 'Capture missing — drop a new one' : 'Drop a screenshot, or click'}
        </label>
      ) : (
        <div style={missingShotStyle}>Screenshot not yet added</div>
      )}

      {canUpload && (
        <input
          id={inputId}
          type="file"
          // Named independently of whichever label is visible. The visible one is
          // "Replace" once a capture is showing, which does not say WHICH slot —
          // and there are two per finding.
          aria-label={`Upload the ${slot.label} screenshot for ${title}`}
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            void accept(e.target.files?.[0])
            // Cleared so re-picking the SAME file fires `change` again — without
            // this, a failed upload cannot be retried with the same screenshot.
            e.target.value = ''
          }}
          style={visuallyHiddenStyle}
        />
      )}

      <figcaption style={shotLabelStyle}>{slot.label}</figcaption>

      {/* Only when a picture is actually on screen. With an empty or broken frame
          the drop zone IS the control, and a second "upload" affordance beneath
          it just says the same thing twice. */}
      {canUpload && src && !broken && (
        <span style={slotActionsStyle}>
          <label htmlFor={inputId} style={slotActionStyle}>
            {uploaded ? 'Replace' : 'Upload over'}
          </label>
          {uploaded && (
            <button type="button" onClick={() => void remove()} disabled={busy} style={slotActionBtnStyle}>
              <Trash size={11} aria-hidden />
              Remove
            </button>
          )}
        </span>
      )}

      {/* Server-side rejections (type, size) are shown verbatim — they name the
          actual reason, which a generic "upload failed" would throw away. */}
      {error && <span style={slotErrorStyle}>{error}</span>}
    </figure>
  )
}

const visuallyHiddenStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
}

const dropZoneStyle: CSSProperties = {
  borderStyle: 'dashed',
  minHeight: 96,
  padding: 12,
  textAlign: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
}

const slotActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
}

const slotActionStyle: CSSProperties = { color: 'var(--ux-accent)', cursor: 'pointer' }

const slotActionBtnStyle: CSSProperties = {
  ...slotActionStyle,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
}

const slotErrorStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: 1.45,
  color: 'var(--color-error-600)',
}

const shotLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}


const idStyle: CSSProperties = {
  fontFamily: 'var(--font-stamp), ui-monospace, monospace',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
  letterSpacing: '0.04em',
}

const cardButtonStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  font: 'inherit',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  padding: '12px 14px',
  cursor: 'pointer',
  // The hover accent is an inset shadow stacked in front of the card shadow, so
  // it costs no layout and needs no transparent placeholder edge to reserve
  // space. Same treatment as the certificate cards' left stroke.
  transition: 'box-shadow 120ms ease, transform 120ms ease',
}

const cardTitleStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.4,
  color: 'var(--color-text-primary)',
  margin: '2px 0 0',
}

const contextStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  margin: '3px 0 0',
}

const cardMetaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 10,
}



/**
 * A row thumbnail, sized to be read rather than noticed.
 *
 * `contain`, not `cover`. At 40px a crop cost nothing because nothing was legible
 * anyway; at this size a `cover` crop would quietly hide the edges of a wide
 * screenshot, and the edges are where half of these findings live. Letterboxing
 * inside a fixed box keeps the right-hand column aligned down the list while
 * showing the whole capture.
 */
const thumbStyle: CSSProperties = {
  width: 128,
  height: 88,
  borderRadius: 4,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-neutral-50)',
  objectFit: 'contain',
  display: 'block',
  flex: 'none',
}

/**
 * The card's two columns.
 *
 * `flex-wrap` rather than a container query: the right column is a fixed-size
 * group and the left one has a 240px floor, so when the card is too narrow to
 * hold both, the captures wrap underneath instead of squeezing the title. The
 * list renders at several widths — the shell, a narrow device frame — and this
 * needs no breakpoint chosen for each.
 */
const cardRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const cardMainStyle: CSSProperties = { flex: '1 1 240px', minWidth: 0 }

const cardShotsStyle: CSSProperties = { flex: 'none' }

const cardThumbRowStyle: CSSProperties = { display: 'flex', gap: 6 }

/** Quiet on purpose. It says evidence exists beyond the comparison; the panel is
 *  where you go to look at it, and the whole card already opens the panel. */
const contextHintStyle: CSSProperties = {
  display: 'block',
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  color: 'var(--color-text-tertiary)',
  textAlign: 'right',
}

const thumbLabelStyle: CSSProperties = {
  display: 'block',
  marginTop: 3,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  textAlign: 'center',
}

/**
 * A 40px row thumbnail. Same fallback rule as the panel's full frames, at the
 * size where a dashed box with words in it would not fit — so a missing file
 * degrades to a plain dashed square.
 *
 * `alt=""`, deliberately. These are decorative duplicates of the panel's own
 * framed captures, which carry the descriptive alt text: the row already names
 * the finding, and the count they represent is announced by the panel. It also
 * removes a real artifact — a described `<img>` whose file is missing paints its
 * alt text at 40px until `onError` lands, so the row flashed a clipped
 * "Expe… Actua…" before settling into the placeholder.
 */
function RowThumb({ src, label }: { src: string; label: string }) {
  // The failed URL, not a boolean. A row thumbnail renders before the capture
  // index has loaded, so its first src is the committed path — which 404s for a
  // finding whose capture only exists as an upload. A boolean `broken` latched
  // on that first failure and stayed latched when a good src arrived a tick
  // later, so an uploaded capture showed in the panel and never in the row.
  // "Broken" is a property of a URL; storing it as one fixes that by
  // construction rather than by remembering to clear a flag.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  // Labelled now they are big enough to compare. Two similar screenshots side by
  // side are ambiguous without it, and the point of the pair is knowing which one
  // is the reference.
  return (
    <span style={{ flex: 'none' }}>
      {failedSrc === src ? (
        <span aria-hidden style={{ ...thumbStyle, border: '1px dashed var(--color-neutral-light)' }} />
      ) : (
        <img src={src} alt="" onError={() => setFailedSrc(src)} style={thumbStyle} />
      )}
      <span style={thumbLabelStyle}>{label}</span>
    </span>
  )
}

function QaCard({
  note,
  index,
  onOpen,
}: {
  note: MergedNote
  index: CaptureIndex
  onOpen: (note: MergedNote) => void
}) {
  const [hover, setHover] = useState(false)
  // Filled slots only, so the row still shows nothing for a finding whose
  // evidence lives in another finding's captures — and shows an uploaded
  // capture for one that has no committed path at all.
  const shown = filledSlots(captureSlotsFor(note, index))
  // Context images are not shown on the card — the two columns are a comparison
  // and a variable pile of supporting shots would take that away — but their
  // EXISTENCE is worth knowing without opening the finding.
  const contextCount = contextSlotsFor(note, index).length
  return (
    <li style={{ listStyle: 'none' }}>
      <button
        type="button"
        onClick={() => onOpen(note)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-haspopup="dialog"
        style={{
          ...cardButtonStyle,
          boxShadow: hover
            ? `inset 3px 0 0 ${SEVERITY_COLOR[note.severity]}, var(--shadow-card)`
            : 'var(--shadow-card)',
          transform: hover ? 'translateY(-1px)' : undefined,
        }}
      >
        <span style={cardRowStyle}>
          <span style={cardMainStyle}>
            <span style={idStyle}>{note.id}</span>
            {/* A span, not a `<p>`: this sits inside a button, which takes
                phrasing content only. */}
            <span style={cardTitleStyle}>{note.title}</span>
            <span style={cardMetaRowStyle}>
              <SeverityChip severity={note.severity} />
              <StatusChip status={note.status} />
            </span>
          </span>
          {/* Derived, never stored. Nothing renders when a finding has neither
              a capture nor a context image, rather than an empty frame holding
              the column open. */}
          {(shown.length > 0 || contextCount > 0) && (
            <span style={cardShotsStyle}>
              <span style={cardThumbRowStyle}>
                {shown.map((slot) => (
                  <RowThumb
                    key={slot.key}
                    label={slot.label}
                    src={slot.capture ? captureUrl(slot.capture) : slot.committedSrc!}
                  />
                ))}
              </span>
              {/* Reads correctly on its own as well as under the pair — a finding
                  can have context images and no comparison yet, and then this is
                  the only thing in the column. */}
              {contextCount > 0 && (
                <span style={contextHintStyle}>+{contextCount} context</span>
              )}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

/* ── the lightbox ─────────────────────────────────────────────────────────── */

/**
 * Built on the shared `Modal` with `hideChrome`, so the focus trap and
 * focus-return-on-close come from the primitive. The extra `onClick` on the
 * image itself is what makes "click anywhere" true — the Modal's own handler
 * only fires on the backdrop.
 *
 * Escape is handled HERE, in the capture phase, and that is load-bearing. This
 * lightbox opens from inside a `Sheet`, and `Modal` and `Sheet` both register
 * their Escape handler as a bubble-phase listener on `document`. Neither can
 * suppress the other: `stopPropagation` does nothing to a second listener on the
 * SAME node. So one Escape closed the lightbox and the panel behind it together,
 * dumping the reviewer back on the list when they only meant to shrink a picture.
 *
 * A capture-phase listener on `document` runs before both, and
 * `stopImmediatePropagation` keeps either from firing. Deliberately scoped to
 * this component rather than fixed in `Modal`: every other Modal in the app is
 * opened from a page, not from inside a Sheet, and giving the shared primitive a
 * capture-phase handler would change Escape behaviour on all of them.
 */
/** What the lightbox shows: a resolved image, whatever supplied it. Deliberately
 *  not a `QaScreen` — the src can now come from an upload that has no entry in
 *  the data file at all. */
export type CaptureView = { label: string; src: string }

function ScreenLightbox({
  screen,
  title,
  onClose,
}: {
  screen: CaptureView | null
  title: string
  onClose: () => void
}) {
  const open = screen !== null
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      e.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideChrome
      width={1100}
      title={screen ? `${screen.label} screenshot — ${title}` : ''}
    >
      {screen && (
        <div
          onClick={onClose}
          role="presentation"
          style={{ padding: 12, background: 'var(--color-neutral-50)', cursor: 'zoom-out' }}
        >
          <img
            src={screen.src}
            alt={`${screen.label} — ${title}`}
            style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: '0 auto' }}
          />
          <p style={{ ...shotLabelStyle, margin: '8px 0 0', textAlign: 'center' }}>{screen.label}</p>
        </div>
      )}
    </Modal>
  )
}

/* ── the detail panel ─────────────────────────────────────────────────────── */

const panelHeadStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '20px 20px 16px',
}

/** Close-top-left, above the title — the app's established sheet chrome
 *  (My Learning Paths, Edit Calendar, Gift Recipients). A top-RIGHT ✕ would put
 *  this panel's close control somewhere no other panel in the product keeps it. */
const closeBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  alignSelf: 'flex-start',
  padding: 0,
  background: 'transparent',
  border: 'none',
  // The page's own accent, not the brand's `secondary-600`: every palette tunes
  // its accent for the current appearance, where a fixed brand mid-stop is a
  // mid-olive that disappears on the dark cards.
  color: 'var(--ux-accent)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
}

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 'var(--text-h3-semibold)',
  lineHeight: 1.25,
  color: 'var(--color-text-primary)',
}

const blockStyle: CSSProperties = {
  padding: '14px 20px',
  borderTop: '1px solid var(--color-border-subtle)',
}

const blockLabelStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
}

const bodyTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--color-text-primary)',
}

const dlRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '104px minmax(0,1fr)',
  gap: '4px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  padding: '4px 0',
}

const monoStyle: CSSProperties = { fontFamily: 'var(--font-stamp), ui-monospace, monospace', fontSize: 12 }

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={dlRowStyle}>
      <dt style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{label}</dt>
      <dd style={{ margin: 0, color: 'var(--color-text-primary)', minWidth: 0 }}>{children}</dd>
    </div>
  )
}

/**
 * The panel BODY, split from the Sheet wrapper and keyed on the note id by the
 * wrapper below. That key is what owns the lightbox's lifetime: an open lightbox
 * cannot survive into a different note, and it cannot be left orphaned when the
 * panel closes, because `Sheet` returns null while closed so this whole subtree
 * unmounts. Holding `shot` in the wrapper instead would need an effect to clear
 * it, which is a synchronisation problem invented by putting the state one level
 * too high.
 */
function QaDetailBody({
  note,
  index,
  canAuthor,
  onClose,
  onCapturesChanged,
  onEdit,
  onDelete,
  onRemoveContext,
}: {
  note: MergedNote
  index: CaptureIndex
  /** Whether the authoring endpoint is reachable. False hides Edit and Delete
   *  rather than offering actions that cannot complete. */
  canAuthor: boolean
  onClose: () => void
  onCapturesChanged: () => void
  onEdit: (note: MergedNote) => void
  onDelete: (note: MergedNote) => void
  onRemoveContext: (key: string) => Promise<void>
}) {
  const [shot, setShot] = useState<CaptureView | null>(null)
  // Whether the empty slots are showing for a finding that has no captures yet.
  // Revealed rather than always-on so the default read of QA-017 and QA-018 is
  // unchanged — two empty drop frames would be a promise of pictures nobody
  // intends to take.
  const [adding, setAdding] = useState(false)
  const headingId = useId()
  const slots = captureSlotsFor(note, index)
  const filled = filledSlots(slots)
  const context = contextSlotsFor(note, index)
  // Once anything is filled, show BOTH slots: the empty one beside a capture is
  // an obvious place to put its counterpart, which is the common case (drop the
  // Actual, then the Expected).
  const shownSlots = filled.length > 0 || adding ? slots : []
  return (
    <>
          <div style={{ overflowY: 'auto', flex: 1 }}>
      <header style={panelHeadStyle}>
        <button type="button" onClick={onClose} aria-label="Close QA note" style={closeBtnStyle}>
          <X size={16} aria-hidden />
          Close
        </button>
        <div style={{ minWidth: 0 }}>
          <h2 id={headingId} style={panelTitleStyle}>
            {note.title}
          </h2>
          <p style={{ ...contextStyle, marginTop: 6 }}>
            {note.id}
            {note.origin !== 'committed' && (
              // Says where this record came from, because it changes what Delete
              // does: an override reverts to the committed finding, an authored
              // one is removed outright.
              <span style={originTagStyle}>
                {note.origin === 'override' ? 'edited' : 'added here'}
              </span>
            )}
          </p>
        </div>
      </header>

      {canAuthor && (
        <div style={panelActionsStyle}>
          <button type="button" onClick={() => onEdit(note)} style={panelActionStyle}>
            <PenToSquare size={12} aria-hidden />
            Edit
          </button>
          {note.origin !== 'committed' && (
            <button
              type="button"
              onClick={() => onDelete(note)}
              style={{ ...panelActionStyle, color: 'var(--color-error-600)' }}
            >
              <Trash size={12} aria-hidden />
              {note.origin === 'override' ? 'Revert to committed' : 'Delete finding'}
            </button>
          )}
        </div>
      )}

            {/* A finding with no captures shows nothing but a way to add some —
                QA-017 and QA-018 are colour-value and focus-ring findings whose
                evidence lives in another note's screenshots, and two empty
                frames would read as pictures that are on their way. */}
            {shownSlots.length === 0 ? (
              index.available && (
                <div style={blockStyle}>
                  <button type="button" onClick={() => setAdding(true)} style={addCapturesStyle}>
                    <Plus size={12} aria-hidden />
                    Add captures
                  </button>
                </div>
              )
            ) : (
              <div style={blockStyle}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${shownSlots.length}, minmax(0,1fr))`,
                    gap: 10,
                  }}
                >
                  {shownSlots.map((slot) => (
                    <CaptureSlotFigure
                      key={slot.key}
                      slot={slot}
                      title={note.title}
                      canUpload={index.available}
                      onOpen={setShot}
                      onChanged={onCapturesChanged}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Context images: supporting material, deliberately BELOW the pair
                and out of the card's comparison entirely. Nothing renders when a
                finding has none, which is most of them. */}
            {context.length > 0 && (
              <div style={blockStyle}>
                <p style={{ ...blockLabelStyle, color: 'var(--color-text-secondary)' }}>Context</p>
                <div style={contextGridStyle}>
                  {context.map((slot) => (
                    <span key={slot.key} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setShot({ label: `Context ${slot.index}`, src: captureUrl(slot.capture) })
                        }
                        aria-label={`Enlarge context image ${slot.index} — ${note.title}`}
                        style={contextTileStyle}
                      >
                        <img
                          src={captureUrl(slot.capture)}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </button>
                      {index.available && (
                        <button
                          type="button"
                          onClick={() => void onRemoveContext(slot.key)}
                          aria-label={`Remove context image ${slot.index}`}
                          style={contextRemoveStyle}
                        >
                          <Trash size={10} aria-hidden />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.bullets.length > 0 && (
              <div style={blockStyle}>
                <p style={{ ...blockLabelStyle, color: 'var(--color-text-secondary)' }}>Detail</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
                  {note.bullets.map((b, i) => {
                    const nested = isNestedBullet(b)
                    return (
                      <li
                        key={i}
                        style={{
                          ...bodyTextStyle,
                          marginLeft: nested ? 16 : 0,
                          // A hollow marker one level in, so a rider on the line
                          // above reads as subordinate rather than as a peer
                          // that happens to be indented.
                          listStyleType: nested ? 'circle' : 'disc',
                          color: nested ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                        }}
                      >
                        {bulletText(b)}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            <dl style={{ ...blockStyle, margin: 0 }}>
              <p style={{ ...blockLabelStyle, color: 'var(--color-text-secondary)' }}>Dev fields</p>
              <DetailRow label="Severity">{note.severity}</DetailRow>
              <DetailRow label="Status">{note.status}</DetailRow>
              <DetailRow label="Logged">{formatLoggedDate(note.loggedDate)}</DetailRow>
            </dl>
          </div>
      <ScreenLightbox screen={shot} title={note.title} onClose={() => setShot(null)} />
    </>
  )
}

function QaDetailPanel({
  note,
  index,
  canAuthor,
  onClose,
  onCapturesChanged,
  onEdit,
  onDelete,
  onRemoveContext,
}: {
  note: MergedNote | null
  index: CaptureIndex
  canAuthor: boolean
  onClose: () => void
  onCapturesChanged: () => void
  onEdit: (note: MergedNote) => void
  onDelete: (note: MergedNote) => void
  onRemoveContext: (key: string) => Promise<void>
}) {
  return (
    <Sheet open={note !== null} onClose={onClose} title={note?.title ?? ''} width={480}>
      {/* The bridge again, because `Sheet` portals to `document.body` and so
          renders OUTSIDE the page shell that carries it. It resolves here only
          because the page mirrors its palette onto the document root — without
          that, `--ux-card` is undefined at this depth and the panel falls back
          to the brand's own surface, which is how it turned up as a light sheet
          over a dark gateway. Applied on a flex column so the body's own
          `overflowY: auto` still has a height to scroll within. */}
      <div style={{ ...UX_TOKEN_BRIDGE, display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
        {note && (
          <QaDetailBody
            key={note.id}
            note={note}
            index={index}
            canAuthor={canAuthor}
            onClose={onClose}
            onCapturesChanged={onCapturesChanged}
            onEdit={onEdit}
            onDelete={onDelete}
            onRemoveContext={onRemoveContext}
          />
        )}
      </div>
    </Sheet>
  )
}

/* ── filters ──────────────────────────────────────────────────────────────── */

const pillStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const pillOnStyle: CSSProperties = {
  ...pillStyle,
  background: 'color-mix(in srgb, var(--color-primary-500) 14%, transparent)',
  // Full shorthand, matching `pillStyle`'s — an override of just `borderColor`
  // would pair a longhand with the shorthand it came from.
  border: '1px solid var(--color-primary-500)',
  color: 'var(--color-text-primary)',
}

const menuStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  zIndex: 5,
  minWidth: 176,
  padding: 6,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-modal)',
}

const menuRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  padding: '7px 9px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
}

const countBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 17,
  height: 17,
  padding: '0 4px',
  marginLeft: 2,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
  color: 'var(--color-text-inverse)',
  fontSize: 11,
  fontWeight: 700,
}

/**
 * A multi-select dropdown of `menuitemcheckbox` rows that STAYS OPEN across
 * toggles — picking two severities is one gesture, not two round trips. The
 * same pattern the Demo Controls bar uses for Professions and Memberships.
 */
function MultiSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: readonly T[]
  selected: T[]
  onToggle: (value: T) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={selected.length ? pillOnStyle : pillStyle}
      >
        {label}
        {selected.length > 0 && <span style={countBadgeStyle}>{selected.length}</span>}
      </button>
      {open && (
        <div role="menu" aria-label={label} style={menuStyle}>
          {options.map((opt) => {
            const on = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onToggle(opt)}
                style={menuRowStyle}
              >
                <span aria-hidden style={{ width: 12, color: 'var(--color-primary-600)' }}>
                  {on ? '✓' : ''}
                </span>
                {opt}
              </button>
            )
          })}
          {selected.length > 0 && (
            <button
              type="button"
              role="menuitem"
              onClick={onClear}
              style={{ ...menuRowStyle, color: 'var(--color-text-secondary)', fontWeight: 600 }}
            >
              <span aria-hidden style={{ width: 12 }} />
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * The export, as text you can see and select.
 *
 * This started as a straight `navigator.clipboard.writeText`, which is a single
 * point of failure: the API needs a permission the browser can refuse, and when
 * it refuses there is no other way to get the data out — which for a store that
 * is not in git and not backed up is the wrong failure to have. It refused in
 * testing, which is how this got found.
 *
 * So the text is the primary thing and the clipboard is a convenience on top.
 * Selected on open, so ⌘A ⌘C works even if the button does not.
 */
function ExportDialog({ text, onClose }: { text: string; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)
  const areaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    areaRef.current?.select()
  }, [])

  function copy() {
    const area = areaRef.current
    if (!area) return
    area.select()
    void navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied('Copied.'))
      .catch(() => setCopied('The browser blocked the clipboard — the text is selected, press ⌘C.'))
  }

  return (
    <Modal open onClose={onClose} width={760} title="Copy as data file" disableBackdropClose>
      <div style={{ padding: '4px 20px 16px', display: 'grid', gap: 10 }}>
        <p style={{ ...bodyTextStyle, color: 'var(--color-text-secondary)' }}>
          Paste this over the <code style={monoStyle}>QA_NOTES</code> array in{' '}
          <code style={monoStyle}>src/data/qaNotes.ts</code> and commit. The stored findings become
          committed ones; screenshots stay where they are, in the capture store.
        </p>
        <textarea
          ref={areaRef}
          readOnly
          value={text}
          rows={16}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-stamp), ui-monospace, monospace',
            fontSize: 12,
            lineHeight: 1.55,
            padding: 10,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-neutral-50)',
            color: 'var(--color-text-primary)',
            resize: 'vertical',
          }}
        />
        {copied && <p style={{ ...hintTextStyle }}>{copied}</p>}
      </div>
      <div style={exportFooterStyle}>
        <button type="button" onClick={copy} style={primaryActionStyle}>
          <Download size={12} aria-hidden />
          Copy
        </button>
        <button type="button" onClick={onClose} style={secondaryActionStyle}>
          Close
        </button>
      </div>
    </Modal>
  )
}

/* ── the panel ────────────────────────────────────────────────────────────── */

const primaryActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  padding: '7px 13px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--ux-accent)',
  background: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
  cursor: 'pointer',
}

const secondaryActionStyle: CSSProperties = {
  ...primaryActionStyle,
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
}

const hintTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const exportFooterStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 20px',
  borderTop: '1px solid var(--color-border-subtle)',
}

const emptyStateStyle: CSSProperties = {
  display: 'grid',
  justifyItems: 'start',
  gap: 8,
  padding: '22px 20px',
  borderRadius: 'var(--radius-lg)',
  border: '1px dashed var(--color-neutral-light)',
  background: 'var(--color-surface-card)',
}

const noticeStyle: CSSProperties = {
  margin: '0 0 12px',
  padding: '9px 12px',
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--ux-accent) 12%, transparent)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-text-primary)',
}

const dismissStyle: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ux-accent)',
  cursor: 'pointer',
}

const originTagStyle: CSSProperties = {
  marginLeft: 8,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'color-mix(in srgb, var(--ux-accent) 16%, transparent)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const panelActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '0 20px 14px',
}

const panelActionStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ux-accent)',
  cursor: 'pointer',
}

const headerActionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginLeft: 'auto',
  // Never squeezed: the two buttons keep their size and the row wraps instead.
  flex: 'none',
}

const contextGridStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }

const contextTileStyle: CSSProperties = {
  width: 96,
  height: 70,
  padding: 3,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-neutral-50)',
  cursor: 'zoom-in',
  display: 'block',
}

const contextRemoveStyle: CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -6,
  width: 18,
  height: 18,
  padding: 0,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-error-600)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const addCapturesStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ux-accent)',
  cursor: 'pointer',
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
  marginBottom: 12,
}

const searchWrapStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  height: 38,
  padding: '0 12px',
  width: 320,
  maxWidth: '100%',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-secondary)',
}

const searchInputStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  width: '100%',
}

/** 300ms, per spec — long enough that typing a word is one filter pass, short
 *  enough that the count does not feel detached from the keystroke. */
const SEARCH_DEBOUNCE_MS = 300

export function QaNotesPanel() {
  const [rawQuery, setRawQuery] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<QaStatus | null>(null)
  const [severities, setSeverities] = useState<QaSeverity[]>([])
  // The open finding is held as an ID and RESOLVED from the list, not stored as
  // a snapshot. Storing the record meant that saving an edit refreshed the list
  // while the panel you were looking at kept showing the pre-edit version — the
  // same duplicated-state mistake as latching "broken" on a component instead of
  // on a URL. Deriving it also closes the panel for free when its finding is
  // deleted, since the id no longer resolves.
  const [openId, setOpenId] = useState<string | null>(null)
  // The merged set: the committed findings with any stored overrides applied and
  // authored ones appended. Re-fetched after every write, so the list is always
  // what the server holds rather than a local guess about it.
  const [noteIndex, setNoteIndex] = useState<NoteIndex>(EMPTY_NOTE_INDEX)
  // `null` = closed, `'new'` = adding, a record = editing that record.
  const [editing, setEditing] = useState<MergedNote | 'new' | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const refreshNotes = useCallback(() => {
    void listNotes().then(setNoteIndex)
  }, [])
  useEffect(refreshNotes, [refreshNotes])

  const notes = noteIndex.notes
  const openNote = openId === null ? null : (notes.find((n) => n.id === openId) ?? null)
  // Which captures exist server-side. Fetched once, then re-fetched after any
  // upload or removal — the response is the single source of truth about what is
  // stored, so the UI never guesses from a local optimistic edit.
  const [captures, setCaptures] = useState<CaptureIndex>(EMPTY_INDEX)
  const refreshCaptures = useCallback(() => {
    void listCaptures().then(setCaptures)
  }, [])
  useEffect(refreshCaptures, [refreshCaptures])

  useEffect(() => {
    const t = window.setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [rawQuery])

  const counts = useMemo(() => statusCounts(notes), [notes])

  const rows = useMemo(
    () => sortQaNotes(filterQaNotes(notes, { query, status, severities })),
    [notes, query, status, severities],
  )

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  /** Frees the context slot rather than renaming the ones after it — see
   *  `contextCapturesFor`. The index reloads from the server, so a hole is simply
   *  a key that is no longer there. */
  const removeContextCapture = useCallback(
    async (key: string) => {
      try {
        await deleteCapture(key)
        refreshCaptures()
      } catch (e) {
        setNotice((e as Error).message)
      }
    },
    [refreshCaptures],
  )

  async function removeNote(note: MergedNote) {
    // Deliberately a `confirm`. Delete on an AUTHORED finding is the one action
    // here that destroys something with no copy anywhere — the store is not in
    // git and is not backed up — and the panel has no undo to offer instead.
    // Reverting an override only drops the override, so it asks nothing.
    const destructive = note.origin === 'authored'
    if (destructive && !window.confirm(`Delete ${note.id} permanently? This cannot be undone.`)) {
      return
    }
    try {
      await deleteNote(note.id)
      setOpenId(null)
      refreshNotes()
      setNotice(destructive ? `${note.id} deleted.` : `${note.id} reverted to the committed finding.`)
    } catch (e) {
      setNotice((e as Error).message)
    }
  }

  // Exports EVERYTHING, not the filtered rows: this is a snapshot of the store
  // for committing, and a snapshot that silently omitted whatever was filtered
  // out would be a way to lose findings rather than to keep them.
  const [exportText, setExportText] = useState<string | null>(null)

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Wraps, and the action group is a single flex item, so at a narrow
          content column the two buttons drop to their own line together rather
          than overflowing off the right edge — which is what they did when this
          row was nowrap. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* The section header above already prints "QA Notes" as the page h1, so
            this is the summary line only — a second h1 would put two titles on
            one screen. */}
        <p style={{ ...contextStyle, margin: 0, fontSize: 13 }}>{qaSummaryLine(notes)}</p>
        {/* Hidden rather than disabled when there is no endpoint: a dead Add
            button is a worse answer than no Add button. */}
        {noteIndex.available && (
          <span style={headerActionsStyle}>
            <button type="button" onClick={() => setEditing('new')} style={primaryActionStyle}>
              <Plus size={12} aria-hidden />
              Add finding
            </button>
            <button
              type="button"
              onClick={() => setExportText(exportAsDataFile(sortQaNotes(notes)))}
              style={secondaryActionStyle}
            >
              <Download size={12} aria-hidden />
              Copy as data file
            </button>
          </span>
        )}
      </header>

      {/* One line, `aria-live`, for the outcome of a write. Not a toast: these
          messages name a file to paste into, which is a thing to read rather
          than something to catch before it fades. */}
      {notice && (
        <p style={noticeStyle} aria-live="polite">
          {notice}{' '}
          <button type="button" onClick={() => setNotice(null)} style={dismissStyle}>
            Dismiss
          </button>
        </p>
      )}

      {notes.length > 0 && (
      <div style={toolbarStyle}>
        <label style={searchWrapStyle}>
          <Search size={15} aria-hidden />
          <input
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            placeholder="Search QA notes"
            aria-label="Search QA notes"
            style={searchInputStyle}
          />
        </label>
        <MultiSelect
          label="Severity"
          options={QA_SEVERITIES}
          selected={severities}
          onToggle={(v) => setSeverities((s) => toggle(s, v))}
          onClear={() => setSeverities([])}
        />
        {/* Announced rather than merely displayed: the count is the only feedback
            a non-sighted user gets that a filter did anything. */}
        <span
          aria-live="polite"
          style={{ ...contextStyle, margin: 0, marginLeft: 'auto', fontWeight: 600 }}
        >
          {rows.length} {rows.length === 1 ? 'result' : 'results'}
        </span>
      </div>
      )}

      {/* Single-select, so it is a radio group rather than a tablist — these
          pills do not switch panels, they narrow one list. Counts are of the
          WHOLE set, not the current selection. */}
      {notes.length > 0 && (
      <div role="radiogroup" aria-label="Filter by status" style={{ ...toolbarStyle, marginBottom: 16 }}>
        <button
          type="button"
          role="radio"
          aria-checked={status === null}
          onClick={() => setStatus(null)}
          // "All" is the only pill with no status colour to carry, so it takes
          // no inset bar and keeps the base padding.
          style={status === null ? pillOnStyle : pillStyle}
        >
          All <span style={{ opacity: 0.7 }}>{notes.length}</span>
        </button>
        {QA_STATUSES.map((s) => {
          const on = status === s
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setStatus(on ? null : s)}
              // The status colour rides the pill as an inset bar, with the left
              // padding opened up to clear it.
              style={{
                ...(on ? pillOnStyle : pillStyle),
                boxShadow: `inset 4px 0 0 ${STATUS_COLOR[s].edge}`,
                paddingLeft: 15,
              }}
            >
              {s} <span style={{ opacity: 0.7 }}>{counts.get(s) ?? 0}</span>
            </button>
          )
        })}
      </div>
      )}

      {notes.length === 0 ? (
        // No findings AT ALL — distinct from a filter that matched nothing. This
        // one is the normal starting state of an empty tracker, so it offers the
        // way forward rather than explaining an absence.
        <div style={emptyStateStyle}>
          <p style={{ ...bodyTextStyle, fontWeight: 600, margin: 0 }}>No findings logged yet.</p>
          <p style={{ ...bodyTextStyle, color: 'var(--color-text-secondary)', margin: 0 }}>
            {noteIndex.loading
              ? 'Checking…'
              : noteIndex.available
                ? 'Add the first one — its Expected and Actual screenshots can go in the same form.'
                : 'The authoring endpoint is not reachable from here — run `netlify dev`, or open the deployed site.'}
          </p>
          {noteIndex.available && (
            <button type="button" onClick={() => setEditing('new')} style={primaryActionStyle}>
              <Plus size={12} aria-hidden />
              Add the first finding
            </button>
          )}
        </div>
      ) : rows.length === 0 ? (
        <p style={{ ...bodyTextStyle, color: 'var(--color-text-secondary)' }}>
          No findings match these filters.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {rows.map((note) => (
            <QaCard
              key={note.id}
              note={note}
              index={captures}
              onOpen={(n) => setOpenId(n.id)}
            />
          ))}
        </ul>
      )}

      {/* Not mounted until a card is clicked — `Sheet` returns null when closed,
          and `openNote` is null until then, so nothing in the panel tree runs. */}
      <QaDetailPanel
        note={openNote}
        index={captures}
        canAuthor={noteIndex.available}
        onClose={() => setOpenId(null)}
        onCapturesChanged={refreshCaptures}
        onEdit={(n) => setEditing(n)}
        onDelete={(n) => void removeNote(n)}
        onRemoveContext={removeContextCapture}
      />

      {exportText !== null && (
        <ExportDialog text={exportText} onClose={() => setExportText(null)} />
      )}

      {/* Keyed so switching from Add to Edit (or between two findings) remounts
          the form rather than carrying the previous draft into it. */}
      {editing !== null && (
        <QaNoteForm
          key={editing === 'new' ? 'new' : editing.id}
          open
          note={editing === 'new' ? null : editing}
          captures={captures}
          onClose={() => setEditing(null)}
          onSaved={(saved, captureErrors) => {
            refreshNotes()
            // The capture index too — a screenshot attached in the form has just
            // landed, and the row thumbnail reads from this, not from the note.
            refreshCaptures()
            const added = editing === 'new'
            setNotice(
              captureErrors.length
                ? // The finding saved and a screenshot did not. Both facts, in
                  // that order, because the second one is recoverable by opening
                  // the finding and the first one is not something to worry about.
                  `${saved.id} ${added ? 'added' : 'saved'}, but a screenshot did not upload — ${captureErrors.join(' ')} Open it and drop that one again.`
                : `${saved.id} ${added ? 'added' : 'saved'}.`,
            )
          }}
        />
      )}
    </div>
  )
}
