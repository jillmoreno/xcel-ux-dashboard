import type { CSSProperties, ReactNode } from 'react'
import type { FeatureAccent } from '@/data/prototypeFeatures'

/**
 * The abstract accent + glyph tile a row shows when it has no picture.
 *
 * Extracted from `UxDashboardPage` on 2026-09-29 so Refinement rows could take
 * the same treatment as Exploration rows. It is deliberately NOT a screenshot:
 * 27 hand-made captures would need remaking every time a screen changes, and a
 * stale thumbnail is worse than an abstract one.
 *
 * ── WHY REFINEMENT CANNOT HAVE THE LIVE FRAME ────────────────────────────────
 * Exploration rows prefer `FeaturePreviewThumb`, a live inert miniature of the
 * row's own URL. That is the better picture and it is unavailable here, for a
 * reason already written down in `prototypeFeatures.ts` (see "WHERE THE
 * PROTOTYPES COME FROM"): every Refinement row points at a BRANCH DEPLOY, which
 * is a different origin from the dashboard and carries its own Netlify password.
 * An iframe to it needs a session cookie on that origin, which inside a frame is
 * a third-party cookie — Safari blocks those outright and Chrome restricts them.
 * The observed result, the last time this repo tried it, was a password box
 * inside every thumbnail or a blank frame.
 *
 * That is not a bug to fix later. Pointing at other branches is what Refinement
 * IS, so the cross-origin part never goes away. This tile is the answer, not a
 * placeholder for one.
 */
/** 160x110 — a real preview rather than a marker. The aspect is kept at exactly
 *  64/44 so the crop an authored capture gets is unchanged. This is what sets an
 *  Exploration row's height (the text block is ~62px), so the list runs taller:
 *  14 rows go from roughly 1160px to 1930px. That is the trade for being able to
 *  recognise a project by its picture. */
export const THUMB_W = 160
export const THUMB_H = 110

const thumbStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: THUMB_W,
  height: THUMB_H,
  flex: 'none',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--ux-border)',
}

/** Accent → its hue token, its readable foreground, and the tint percentage
 *  that hue needs to sit at to read as itself.
 *
 *  The percentages are PER HUE and not a single constant, which is the thing
 *  this table exists to encode. `--ux-hue-blue` is #323D67 and
 *  `--ux-hue-neutral` is #8C909C: at one shared 20% tint over white they land
 *  within 0.02 of each other in every channel — measured, in the browser — so
 *  two tiles a viewer is meant to tell apart look like the same grey. Neutral
 *  needs more tint to separate from blue; blue needs less to stay a colour
 *  rather than a bruise. */
const ACCENT_HUE: Record<FeatureAccent, { hue: string; fg: string; tint: number }> = {
  teal: { hue: '--ux-hue-teal', fg: '--ux-hue-teal-fg', tint: 20 },
  gold: { hue: '--ux-hue-gold', fg: '--ux-hue-gold-fg', tint: 20 },
  blue: { hue: '--ux-hue-blue', fg: '--ux-hue-blue-fg', tint: 20 },
  neutral: { hue: '--ux-hue-neutral', fg: '--ux-hue-neutral-fg', tint: 26 },
}

/** Tinted brand surfaces, so a row reads as belonging to a family without
 *  needing a real screenshot.
 *
 *  The four hues are the palette's own rather than the brand ramps — a
 *  teal/gold/blue set inside a moss-green page read as four foreign objects.
 *  The tint is mixed into the card so it follows the appearance, and each hue
 *  carries a per-mode foreground (`--ux-hue-*-fg`) picked to clear 3:1 on its
 *  own tint.
 *
 *  `boost` multiplies the tint. Exploration leaves it at 1: its tiles are read
 *  one at a time, as "this row has no screenshot". Refinement passes more,
 *  because there the hue is COMPARED down the list and a difference you have to
 *  hunt for is not a difference. */
function accentFill(accent: FeatureAccent, boost: number): CSSProperties {
  const { hue, fg, tint } = ACCENT_HUE[accent]
  return {
    background: `color-mix(in srgb, var(${hue}) ${Math.round(tint * boost)}%, var(--ux-card))`,
    color: `var(${fg})`,
  }
}

/** `aria-hidden` throughout: it is decoration standing in for a picture, and
 *  every fact it encodes is also written in the row's own text. */
export function GeneratedThumb({
  accent,
  children,
  width = THUMB_W,
  height = THUMB_H,
  boost = 1,
  style,
}: {
  accent: FeatureAccent
  /** The glyph. Size it to the tile — a 20px mark swims in 160x110. */
  children: ReactNode
  width?: number
  height?: number
  /** Tint multiplier — see `accentFill`. */
  boost?: number
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden
      style={{ ...thumbStyle, width, height, ...accentFill(accent, boost), ...style }}
    >
      {children}
    </span>
  )
}
