import type { CSSProperties } from 'react'
import { SidebarRegular } from '@/icons'

/**
 * THE ATLAS LEFT RAIL'S COLLAPSE BUTTON — Figma "Atlas-Compass-Global-
 * Navigation" 174:1562, 2026-10-01, the designer's request.
 *
 * A 21 × 22 frame holding FA Regular `sidebar` at 11px, in the rail's
 * top-right corner, 16px down and 16px in (2026-10-01). It slides the rail closed to just this
 * frame at the window's left edge, and open again — `PlatformShell` owns the
 * state and the slide (the rail's grid track eases between 260 and 21).
 *
 * Open: the design's outlined frame (#BBB stroke, #9B9B9B icon, 4px radius).
 * Closed: the course player bar's left end — 36 × 61, white, square, a 1px
 * rule on its right in the bar's rule colour, the icon in the Top Nav's blue
 * (2026-10-01; it was briefly a filled tab). The colours, and the
 * move between the two, are `.cre-atlas-rail-toggle` in tokens.css.
 */
export function AtlasRailToggle({
  closed,
  onToggle,
  besideBar = false,
}: {
  closed: boolean
  onToggle: () => void
  /** The course player controls bar is beside it (the Course page). Closed,
   *  it draws the bar's rules only there — elsewhere it has no bar to
   *  continue, so no stroke (2026-10-01, the designer's request). */
  besideBar?: boolean
}) {
  return (
    <button
      type="button"
      className={closed ? 'cre-atlas-rail-toggle is-closed' : 'cre-atlas-rail-toggle'}
      aria-label={closed ? 'Expand sidebar' : 'Collapse sidebar'}
      aria-expanded={!closed}
      aria-controls="cre-atlas-rail-body"
      onClick={onToggle}
      style={
        closed
          ? { ...TOGGLE, ...CLOSED, ...(besideBar ? null : { borderWidth: 0 }) }
          : { ...TOGGLE, left: TOGGLE_LEFT_OPEN }
      }
    >
      {/* Closed, the icon sits in a frame drawn as the player bar's SEARCH
          button (2026-10-01, the designer's request; it was briefly the open
          button's small frame): 38 × 38, radius 10, the bar's button surface,
          stroke and icon colours (`.cre-compass-player-btn` +
          `--color-compass-player-icon`), the icon at the bar's 13px. */}
      {closed ? (
        <span aria-hidden className="cre-compass-player-btn cre-atlas-rail-toggle-inner" style={INNER}>
          {/* 15, 2px over the bar's 13 (2026-10-01, the designer's request). */}
          <SidebarRegular size={15} aria-hidden />
        </span>
      ) : (
        // 17.6 — the design's 11 doubled to 22, then 20% off (2026-10-05, the
        // designer's requests).
        <SidebarRegular size={OPEN_ICON} aria-hidden />
      )}
    </button>
  )
}

/** The open icon's size (2026-10-05): 11 → 22 → 17.6. */
const OPEN_ICON = 17.6
/** The open frame is the icon's own width since it lost its border
 *  (2026-10-05), so the icon keeps the 16px inset from the rail's edge. It
 *  was 21 × 22 around an 11px icon. */
const TOGGLE_W = OPEN_ICON
/** CLOSED (2026-10-01, the designer's request): as tall as the course player
 *  controls bar (61, its 1px rule included) and flush with the rail's top, so
 *  it reads as the bar's left end. It holds a 38px search-style frame with
 *  the bar's 11px either side, and a 1px rule on the right: 11 + 38 + 11 + 1
 *  = 61, square — the collapsed rail's width (`ATLAS_RAIL_TOGGLE_W`). */
const TOGGLE_CLOSED_W = 61
const INNER: CSSProperties = {
  width: 38,
  height: 38,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'solid',
  color: 'var(--color-compass-player-icon)',
}
const CLOSED: CSSProperties = {
  left: 0,
  top: 0,
  width: TOGGLE_CLOSED_W,
  height: 61,
  // The 38 frame with the bar's 11 either side.
  padding: '0 11px',
  // Rules on its right and bottom (the bottom continues the bar's own).
  borderWidth: '0 1px 1px 0',
}
/** 16px in from the 260px rail's right edge (2026-10-01, the designer's
 *  request — 32 at first, then flush, then 16). */
const TOGGLE_LEFT_OPEN = 260 - 16 - TOGGLE_W

const TOGGLE: CSSProperties = {
  position: 'absolute',
  // 16px down from the rail's top (24 at first, then flush, then 16).
  top: 16,
  zIndex: 2,
  width: TOGGLE_W,
  height: 22,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  // OPEN: no border and no inset (2026-10-05, the designer's request — the
  // design's #BBB 1px frame is gone). `CLOSED` sets its own rules and padding.
  padding: 0,
  borderWidth: 0,
  borderStyle: 'solid',
  cursor: 'pointer',
  // Its size, place and colours all ease with the rail's slide. (Inline, so
  // it is the one transition list — `.cre-atlas-rail-toggle` sets none.)
  transition: [
    'left', 'top', 'width', 'height', 'padding', 'border-width',
    'background-color', 'border-color', 'border-radius', 'color',
  ].map((p) => `${p} 360ms cubic-bezier(0.65, 0, 0.35, 1)`).join(', '),
}
