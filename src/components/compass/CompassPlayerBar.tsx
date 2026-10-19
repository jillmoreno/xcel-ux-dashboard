import type { ComponentType, CSSProperties, ReactNode } from 'react'
import {
  HandBackPointRightRegular,
  FileLinesRegular,
  GearRegular,
  MagnifyingGlassRegular,
  RubiLogo,
  XmarkRegular,
} from '@/icons'

/**
 * COMPASS COURSE PLAYER CONTROLS BAR — Figma "Atlas-Compass-Global-Navigation",
 * node 49:2963, 2026-09-23.
 *
 * The toolbar of a Compass LMS course player: it sits under the page header,
 * over the course content, and stays pinned there as the lesson scrolls.
 *
 * REARRANGED 2026-10-01 (Figma 170:1037 / 170:1331, the designer's request):
 *
 *   - **Left** (grows) — search, Notes (with a count), settings, then the
 *     section-progress pill (archived on the Atlas player). The exam-date pill
 *     is gone; the design no longer draws it.
 *   - **Right** — "Close Course", a labelled button. (Close and the three tools
 *     traded sides the same day, the designer's request.)
 *   - **Rubi**, 32px further right, ONLY while the Rubi rail is closed: open,
 *     the rail sits beside the bar and its own close is the way out (Figma
 *     170:1037 has no Rubi button; 170:1331, closed, has it at the end).
 *
 * Like the rail, it is CONFIG-DRIVEN and resolves nothing itself: a Compass page
 * hands it the values and the handlers. **An action with no handler renders
 * disabled** — a toolbar button that looks live and does nothing is the defect
 * this repo keeps refusing. Today only Rubi and close have somewhere to go.
 *
 * Departures, on purpose:
 * - **Open Sans**, where the design names Source Sans 3 / Inter (not loaded).
 * - **The section track fills to the knob** in the section ink. The design is
 *   drawn at 0%, where there is nothing to fill; above 0 a knob on an unfilled
 *   track reads as a slider the learner could drag.
 * - **Rubi carries the product's `RubiLogo`**, not the design's placeholder mark.
 */
export type CompassPlayerBarProps = {
  section: { label: string; pct: number }
  notesCount: number
  /** Pinned below the page header at this offset (px). */
  stickyTop: number
  onNotes?: () => void
  onRubi?: () => void
  /** The Rubi panel's state: the Rubi button shows only while it is CLOSED. */
  rubiOpen?: boolean
  /** The Section progress pill. ARCHIVED on the Atlas player 2026-10-01 (the
   *  adapter passes false) — see ARCHIVED_ITEMS `compass-player-section-pill`.
   *  Default true, so the component and its tests keep drawing it. */
  showSection?: boolean
  onSearch?: () => void
  onSettings?: () => void
  onClose?: () => void
  /** THE SIDE TRAYS (2026-10-19, Eric's request). On, Notes leaves the left
   *  group for the right end beside Rubi, and Nudges joins them — each a
   *  tray like Rubi's, its button shown only while its tray is closed. Off
   *  (the default), the bar is as it was. */
  sideTrays?: boolean
  notesOpen?: boolean
  onNudges?: () => void
  nudgesOpen?: boolean
}

export function CompassPlayerBar({
  section,
  notesCount,
  stickyTop,
  onNotes,
  onRubi,
  rubiOpen,
  showSection = true,
  onSearch,
  onSettings,
  onClose,
  sideTrays = false,
  notesOpen = false,
  onNudges,
  nudgesOpen = false,
}: CompassPlayerBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(section.pct)))
  const notesButton = (
    <ToolButton label="Notes" ariaLabel={`Notes (${notesCount})`} onClick={onNotes} icon={FileLinesRegular}>
      <span aria-hidden style={BADGE}>
        {notesCount}
      </span>
    </ToolButton>
  )
  /* Each tray's button hides only while ITS OWN tray is open; the other two
     stay, with the divider before them (2026-10-19, Eric's request — for a
     while all three hid together). The open tray's close is its way out, as
     Rubi's always was. Notes here carries no count. */
  const showRubi = !rubiOpen
  const showNotesRight = sideTrays && !notesOpen
  const showNudges = sideTrays && !nudgesOpen
  const closeCourse = (
    <div style={GROUP}>
      <button
        type="button"
        className="cre-compass-player-btn"
        onClick={onClose}
        disabled={!onClose}
        style={{ ...BUTTON, gap: 6, flex: 'none' }}
      >
        {/* The ✕ 1px lower, on the label's optical centre (2026-10-01,
            the designer's request). */}
        <span style={{ display: 'inline-flex', position: 'relative', top: 1 }}>
          <Glyph icon={XmarkRegular} />
        </span>
        <span style={{ ...TEXT, fontWeight: 600 }}>Close Course</span>
      </button>
    </div>
  )
  return (
    <div
      role="toolbar"
      aria-label="Course player controls"
      className="cre-compass-player-bar"
      // With the trays on, 11 on every side — the left and right as the top
      // and bottom (2026-10-19, Eric's requests: 16 on the right first);
      // 11 / 20 otherwise.
      style={{ ...BAR, top: stickyTop, ...(sideTrays ? { padding: 11 } : null) }}
    >
      {/* ── Left: search, notes, settings, then where you stand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 0', minWidth: 0 }}>
        <IconButton label="Search this course" icon={MagnifyingGlassRegular} onClick={onSearch} />
        {/* On the right with the trays on (`sideTrays`). */}
        {sideTrays ? null : notesButton}
        <IconButton label="Player settings" icon={GearRegular} onClick={onSettings} />
        {/* CENTRED in the space between the tools and Close Course
            (2026-10-01, the designer's request): this box takes that space and
            the pill sits in its middle, still shrinking (track first, then the
            name) when the space runs short. Padded 24 on the left so the gaps
            either side match: Close Course's 8 + 24 against the bar's 32. */}
        {showSection ? (
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', justifyContent: 'center', paddingLeft: 24 }}>
            <span style={{ ...PILL, padding: '0 16px', gap: 8, flex: '0 1 auto', minWidth: 0 }}>
              {/* The TRACK gives way first (its huge flex-shrink), down to its 60px
                  floor: which section you are in is the content, the track's
                  length is not. Only then does the NAME truncate — with the full
                  name on hover (`title`) and in the progressbar's accessible name,
                  so nothing is lost. A long section title ("Chapter 1: Basic
                  Principles of Life and Health Insurance") needs this. */}
              <span
                title={section.label}
                style={{ ...TEXT, display: 'flex', gap: 2, flex: '0 1 auto', minWidth: 0 }}
              >
                <strong style={{ fontWeight: 700, flex: 'none' }}>Section:</strong>
                <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {section.label}
                </span>
              </span>
              <span
                role="progressbar"
                aria-label={`${section.label} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                style={TRACK_WRAP}
              >
                <span style={TRACK}>
                  <span style={{ ...TRACK_FILL, width: `${pct}%` }} />
                </span>
                {/* 13px knob, positioned so its CENTRE sits at the percentage and
                    it never overhangs either end. */}
                <span style={{ ...KNOB, left: `calc(${pct}% - ${(13 * pct) / 100}px)` }} />
              </span>
              <span style={{ ...TEXT, fontWeight: 600, flex: 'none' }}>{pct}%</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Right: Close Course (swapped with the tools, 2026-10-01, the
          designer's request) ── */}
      {closeCourse}

      {/* ── Rubi, then Notes and Nudges with the trays on — each only while
          its own tray is closed. One group, 8 apart, so the bar's 32 sits
          once before it and not after an empty slot. ── */}
      {/* A vertical rule between Close Course and the tray buttons, with the
          trays on (2026-10-19, Eric's request) — centred in the bar's 32, so
          the buttons do not move apart. */}
      {sideTrays && (showRubi || showNotesRight || showNudges) ? <span aria-hidden style={TRAY_RULE} /> : null}
      {showRubi || showNotesRight || showNudges ? (
      <div style={GROUP}>
      {/* Notes first, then Rubi (2026-10-19, Eric's request). */}
      {showNotesRight ? <ToolButton label="Notes" onClick={onNotes} icon={FileLinesRegular} /> : null}
      {showRubi ? (
        <button
          type="button"
          // White like Notes and Nudges with the trays on (2026-10-19, Eric's
          // request) — the plain player button; the Rubi tint otherwise.
          className={sideTrays ? 'cre-compass-player-btn' : 'cre-compass-player-btn cre-compass-player-rubi'}
          onClick={onRubi}
          disabled={!onRubi}
          aria-label="Open Rubi"
          style={{ ...BUTTON, ...RUBI }}
        >
          <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-compass-rubi-brand)' }}>
            <RubiLogo size={16} aria-hidden />
          </span>
          <span style={{ ...TEXT, fontWeight: 600 }}>Rubi</span>
        </button>
      ) : null}
      {showNudges ? (
        <ToolButton label="Nudges" onClick={onNudges} icon={HandBackPointRightRegular} />
      ) : null}
      </div>
      ) : null}
    </div>
  )
}

type IconType = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

function Glyph({ icon: Icon }: { icon: IconType }) {
  return (
    <span aria-hidden style={GLYPH}>
      <Icon size={13} aria-hidden />
    </span>
  )
}

function ToolButton({
  label,
  ariaLabel,
  icon,
  onClick,
  children,
}: {
  label: string
  /** When the visible label is not the whole name — Notes and its count. */
  ariaLabel?: string
  icon: IconType
  onClick?: () => void
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      className="cre-compass-player-btn"
      onClick={onClick}
      disabled={!onClick}
      aria-label={ariaLabel}
      style={BUTTON}
    >
      <Glyph icon={icon} />
      <span style={{ ...TEXT, fontWeight: 600 }}>{label}</span>
      {children}
    </button>
  )
}

function IconButton({ label, icon, onClick }: { label: string; icon: IconType; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="cre-compass-player-btn"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      title={label}
      style={{ ...BUTTON, width: 38, padding: 0 }}
    >
      <Glyph icon={icon} />
    </button>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
/* Colours are `--color-compass-player-*` (tokens.css). */

const BAR: CSSProperties = {
  position: 'sticky',
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  padding: '11px 20px',
  background: 'var(--color-compass-player-bar)',
  borderBottom: '1px solid var(--color-compass-player-rule)',
}
const GROUP: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }
/* 1 wide, in the bar's own rule colour, the FULL HEIGHT of the bar — top
   edge to its bottom rule, through the 11 of padding (2026-10-19, Eric's
   request; it was 24 tall). The −16 sides take it out of the 32 gaps either
   side, so it sits midway without adding width. */
const TRAY_RULE: CSSProperties = {
  flex: 'none',
  width: 1,
  alignSelf: 'stretch',
  margin: '-11px -16px',
  background: 'var(--color-compass-player-rule)',
}
const TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  fontWeight: 400,
  color: 'var(--color-compass-player-text)',
  whiteSpace: 'nowrap',
}
const GLYPH: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--color-compass-player-icon)',
}
const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 38,
  boxSizing: 'border-box',
  borderRadius: 30,
  background: 'var(--color-compass-player-surface)',
  border: '1px solid var(--color-compass-player-border)',
}
/* The design's 260px track, allowed to give way so the bar fits the column —
   at the 1180 column with a real date and section name it lands ~70px. */
const TRACK_WRAP: CSSProperties = {
  position: 'relative',
  display: 'block',
  height: 13,
  flex: '1 1000 260px',
  minWidth: 60,
  maxWidth: 260,
}
const TRACK: CSSProperties = {
  position: 'absolute',
  left: 1,
  right: 0,
  top: 4.5,
  height: 4,
  borderRadius: 4,
  overflow: 'hidden',
  background: 'var(--color-compass-player-track)',
}
const TRACK_FILL: CSSProperties = {
  display: 'block',
  height: '100%',
  background: 'var(--color-compass-player-ink)',
}
const KNOB: CSSProperties = {
  position: 'absolute',
  top: 0,
  width: 13,
  height: 13,
  boxSizing: 'border-box',
  borderRadius: '50%',
  background: 'var(--color-compass-player-surface)',
  border: '2px solid var(--color-compass-player-ink)',
}
/* Colours, and hover / focus / disabled, live in `.cre-compass-player-btn`. */
const BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  height: 38,
  padding: '0 14px',
  boxSizing: 'border-box',
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
}
/* The Rubi button (Figma 170:1518): 79 wide, tinted — its fill and edge are
   `.cre-compass-player-rubi` (tokens.css). */
const RUBI: CSSProperties = {
  width: 79,
  gap: 6,
  flex: 'none',
}
const BADGE: CSSProperties = {
  width: 21,
  height: 21,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-compass-player-ink)',
  color: 'var(--color-compass-player-on-ink)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // The DIGIT centred in the circle (2026-10-01, the designer's request):
  // at the 20px line it sat 0.7px low (6.1 above, 5.4 below, measured); a
  // line of 1 plus 0.3 on top puts 5.7 either side.
  lineHeight: 1,
  paddingTop: 0.3,
  boxSizing: 'border-box',
}
