/**
 * PassportStamp — the heart of the achievements visual system.
 *
 * Renders a stamp silhouette whose SHAPE is driven by the achievement's
 * `category` (one of six fixed templates) and whose COLOR is driven by
 * the same `category` (the `--ink-{category}` token in tokens.css). Color
 * and shape both encode category, redundantly, so the row reads as
 * "streak / achievement / mastery / lifecycle / community / hidden" at
 * a glance even before the text is read.
 *
 * Three visual states drive the stroke + opacity treatment:
 *
 *   - `earned`        — solid stroke, full saturation, full opacity.
 *   - `within-reach`  — dashed stroke (`3 3`), 85% opacity, keeps the
 *                       category ink color. Used for both `ready` and
 *                       `progress` achievements in the rail.
 *   - `locked`        — dashed stroke, color overridden to a faded
 *                       neutral brown (`rgba(122, 89, 32, 0.4)`). Page
 *                       grid uses this for not-yet-earned + not-in-rail
 *                       silhouettes. Hidden-category locked stamps
 *                       further mask the name to `???` and the date to
 *                       `HIDDEN`.
 *
 * Every shape has a two-path treatment: a 2px outer outline and a 1px
 * inner echo at ~0.45 opacity. The inner echo is what does most of the
 * "this is a stamp, not an icon" work — the spec is firm about keeping
 * it. Both paths are inscribed in the same square bounding box so the
 * grid stays rhythmic regardless of which shape lands in any given cell.
 */

import type { CSSProperties, ReactNode } from 'react'
import type { Achievement, AchievementCategory } from '@/data/achievements'
import { iconForAchievement } from '@/data/achievements'

export type StampState = 'earned' | 'within-reach' | 'locked'

type Props = {
  achievement: Achievement
  /** Visual state. Derived from `achievement.status` in most cases — but
   *  exposed as its own prop because the rail wants every tile in
   *  'within-reach' regardless of whether it's `ready` or `progress`. */
  state: StampState
  /** Bounding-box size in px. Widget rail: 60. Page grid: 80. Strip: 64. */
  size?: number
  /** Whether to render the name + date text inside the stamp. The rail
   *  uses external labels (so this is false there). The page grid + the
   *  widget's stamps strip use internal labels (true). */
  showLabel?: boolean
  /** Whether to apply a deterministic rotation per id for charm. Off in
   *  the rail (which wants neat alignment with chips); on in the strip +
   *  the page grid (which wants the "collected over time" feel). */
  rotated?: boolean
  /** Optional override of the rendered icon — used by callers that need
   *  to swap in a special icon (e.g. the "Open passport" CTA which uses
   *  this primitive in `empty`-look mode). */
  iconOverride?: ReactNode
  /** When provided alongside `showLabel`, replaces the auto-derived
   *  date line. Lets the widget show "MAY · 8" instead of the default
   *  "MAY 8, 2026" computed from earnedOn. */
  dateOverride?: string
}

/* ─── Shape paths ──────────────────────────────────────────────────────
 *
 * Each entry returns the two `<path>` / `<rect>` / etc. elements for a
 * given canvas size. We compute coordinates from `size` rather than
 * scaling via `viewBox` so stroke widths read consistently across the
 * three call-site sizes (60/64/80px) without `vector-effect`.
 *
 * Source: explorations/achievements-redesign/achievements-shape-system.html
 * — coordinates were authored against an 84px canvas and are scaled
 * linearly here.
 * ───────────────────────────────────────────────────────────────────── */
function renderShape(
  category: AchievementCategory,
  size: number,
  strokeWidth: number,
  innerStrokeWidth: number,
  dashArray: string | undefined,
): ReactNode {
  // Scale factor against the canonical 84px canvas.
  const k = size / 84
  const s = (n: number) => n * k
  // Use vector commands as numbers, formatted with `Math.round` only at
  // the final stage — keeps the inner echo properly inset for every size.
  const outer: CSSProperties = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeDasharray: dashArray,
  }
  const inner: CSSProperties = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: innerStrokeWidth,
    strokeOpacity: 0.45,
    strokeDasharray: dashArray,
  }

  switch (category) {
    case 'streaks':
      // Calendar / punch-card square with rounded corners.
      return (
        <>
          <rect x={s(6)} y={s(6)} width={s(72)} height={s(72)} rx={s(8)} style={outer} />
          <rect x={s(11)} y={s(11)} width={s(62)} height={s(62)} rx={s(5)} style={inner} />
        </>
      )
    case 'achievements':
      // Classic customs-stamp circle — seal of completion.
      return (
        <>
          <circle cx={s(42)} cy={s(42)} r={s(36)} style={outer} />
          <circle cx={s(42)} cy={s(42)} r={s(31)} style={inner} />
        </>
      )
    case 'mastery':
      // Hexagon — structured, honeycomb of expertise.
      return (
        <>
          <polygon
            points={`${s(42)},${s(4)} ${s(74)},${s(22)} ${s(74)},${s(62)} ${s(42)},${s(80)} ${s(10)},${s(62)} ${s(10)},${s(22)}`}
            style={outer}
          />
          <polygon
            points={`${s(42)},${s(11)} ${s(68)},${s(25)} ${s(68)},${s(59)} ${s(42)},${s(73)} ${s(16)},${s(59)} ${s(16)},${s(25)}`}
            style={inner}
          />
        </>
      )
    case 'lifecycle':
      // Visa banner — horizontal rounded pill.
      return (
        <>
          <rect x={s(4)} y={s(22)} width={s(76)} height={s(40)} rx={s(20)} style={outer} />
          <rect x={s(9)} y={s(27)} width={s(66)} height={s(30)} rx={s(15)} style={inner} />
        </>
      )
    case 'community':
      // Rosette / award ribbon — 8-lobe scalloped circle via quadratic
      // Beziers. The path comes verbatim from the mockup; we scale via
      // `transform: scale(k)` on the path itself rather than mangling
      // each control point.
      return (
        <>
          <path
            d="M 42 6 Q 52 16 64 11 Q 68 23 78 28 Q 72 40 78 52 Q 68 56 64 68 Q 52 64 42 74 Q 32 64 20 68 Q 16 56 6 52 Q 12 40 6 28 Q 16 23 20 11 Q 32 16 42 6 Z"
            style={outer}
            transform={`scale(${k})`}
          />
          <path
            d="M 42 13 Q 50 21 60 17 Q 63 27 71 31 Q 66 41 71 51 Q 63 54 60 64 Q 50 61 42 69 Q 34 61 24 64 Q 21 54 13 51 Q 18 41 13 31 Q 21 27 24 17 Q 34 21 42 13 Z"
            style={inner}
            transform={`scale(${k})`}
          />
        </>
      )
    case 'hidden':
      // Wax-seal blob — irregular cubic Beziers. Same transform trick as
      // the rosette path.
      return (
        <>
          <path
            d="M 42 7 C 58 5 72 14 76 30 C 80 44 72 56 60 64 C 50 70 36 72 26 66 C 14 60 6 46 8 32 C 10 18 22 8 42 7 Z"
            style={outer}
            transform={`scale(${k})`}
          />
          <path
            d="M 42 14 C 55 13 67 21 70 32 C 73 43 66 53 56 59 C 47 64 36 65 28 60 C 19 55 13 44 15 33 C 17 22 27 14 42 14 Z"
            style={inner}
            transform={`scale(${k})`}
          />
        </>
      )
  }
}

/** Stable rotation from a string — hashes the id into [-4°, +3°]. The
 *  same id always gets the same angle so re-renders don't jitter. */
function rotationFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0
  }
  return (Math.abs(h) % 8) - 4
}

/** Map a category to its `--ink-{category}` CSS variable. */
function inkVarForCategory(category: AchievementCategory): string {
  return `var(--ink-${category})`
}

export function PassportStamp({
  achievement,
  state,
  size = 80,
  showLabel = true,
  rotated = true,
  iconOverride,
  dateOverride,
}: Props) {
  const Icon = iconForAchievement(achievement.iconKey)
  // Hidden + locked is the masked Easter-egg treatment — the user sees
  // the silhouette but the name + date are scrambled.
  const isHiddenLocked = state === 'locked' && achievement.category === 'hidden'
  const displayName = isHiddenLocked ? '???' : shortStampName(achievement.title)
  const dateLabel = (() => {
    if (!showLabel) return null
    if (isHiddenLocked) return 'HIDDEN'
    if (dateOverride) return dateOverride
    if (state === 'locked') return '— LOCKED —'
    if (achievement.earnedOn) return formatStampDate(achievement.earnedOn)
    return null
  })()

  // Color resolution: locked overrides category ink with the faded brown
  // used by the mockup's `.locked` class.
  const color = state === 'locked'
    ? 'rgba(122, 89, 32, 0.4)'
    : inkVarForCategory(achievement.category)
  const contentColor = state === 'locked'
    ? 'rgba(122, 89, 32, 0.55)'
    : 'currentColor'

  // Dashed stroke for everything that isn't earned.
  const dashArray = state === 'earned' ? undefined : '3 3'
  const strokeWidth = 2
  const innerStrokeWidth = 1

  const angle = rotated ? rotationFromId(achievement.id) : 0

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        color,
        transform: `rotate(${angle}deg)`,
        opacity: state === 'within-reach' ? 0.85 : 1,
        // `currentColor` lets nested SVG strokes + text inherit the ink.
        // contrast(1.1) on earned matches the "imperfect-ink" feel of a
        // real stamp; we skip it on locked so the faded brown reads cleanly.
        filter: state === 'earned' ? 'contrast(1.1)' : 'none',
        flexShrink: 0,
      }}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        {renderShape(achievement.category, size, strokeWidth, innerStrokeWidth, dashArray)}
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 8,
          textAlign: 'center',
          fontFamily: 'var(--font-stamp)',
          color: contentColor,
          lineHeight: 1.1,
          pointerEvents: 'none',
        }}
      >
        <span aria-hidden style={{ display: 'inline-flex', marginBottom: 2 }}>
          {iconOverride ?? <Icon size={Math.max(14, Math.round(size * 0.27))} aria-hidden />}
        </span>
        {showLabel && (
          <>
            <span style={nameStyle(size)}>{displayName}</span>
            {dateLabel && <span style={dateStyle(size)}>{dateLabel}</span>}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── helpers ───────────────────────────────────────────────────────── */

/** Wrap two-word titles to two lines so they fit inside a small stamp.
 *  Long single-word titles stay one line (the stamp's padding contains
 *  them). */
function shortStampName(title: string): string {
  if (title.length <= 10) return title
  const words = title.split(' ')
  if (words.length === 1) return title
  const mid = Math.ceil(words.length / 2)
  return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ')
}

function formatStampDate(iso: string): string {
  const parts = iso.split('-').map((s) => parseInt(s, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[parts[1] - 1].toUpperCase()} · ${parts[2]}`
}

function nameStyle(size: number): CSSProperties {
  // Tuned for size 60 (rail) / 64 (strip) / 80 (page grid).
  const fontSize = size <= 60 ? 7.5 : size <= 64 ? 8 : 9
  return {
    fontFamily: 'var(--font-stamp)',
    fontWeight: 400,
    fontSize,
    lineHeight: 1.1,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'pre-line',
    maxWidth: '90%',
  }
}

function dateStyle(size: number): CSSProperties {
  const fontSize = size <= 60 ? 6.5 : size <= 64 ? 7 : 7.5
  return {
    fontFamily: 'var(--font-stamp)',
    fontWeight: 400,
    fontSize,
    marginTop: 1,
    letterSpacing: '0.08em',
    opacity: 0.85,
  }
}
