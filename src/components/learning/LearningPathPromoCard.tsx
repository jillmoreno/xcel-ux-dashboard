import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { Check } from '@/icons'

type IconComponent = ComponentType<{
  size?: number
  'aria-hidden'?: boolean | 'true' | 'false'
  style?: CSSProperties
}>

type PromoCardCta = {
  label: string
  onClick: () => void
}

/** Optional progress tracker rendered under the title (matches the Figma
 *  "Required Tasks" card): a thin bar with a check-marker at the fill
 *  point + an "X of N … Completed" label. */
type PromoCardProgress = {
  completed: number
  total: number
  /** e.g. "Tasks Completed" → "1 of 3 Tasks Completed". */
  noun?: string
}

type Props = {
  /** Card heading — 24px SemiBold, white. Accepts a string or pre-wrapped
   *  nodes (e.g. a two-line `<>Your voice <br/> matters.</>`). */
  title: ReactNode
  /** Supporting body copy — 14px Regular, white, ~190px measure. */
  body: ReactNode
  /**
   * Optional white CTA button pinned to the bottom of the card. The
   * pattern is "there may or may not be a CTA involved" — omit this for
   * an informational-only promo tile.
   */
  cta?: PromoCardCta
  /**
   * Optional oversized glyph rendered as a faded watermark behind the
   * content (mirrors the Figma "star" watermark on node 295:10336).
   * Clipped to the card and non-interactive. Any `@/icons` glyph works.
   */
  watermarkIcon?: IconComponent
  /** Optional progress tracker rendered between the title and body. */
  progress?: PromoCardProgress
  /** Min height — defaults to 384 so the card lines up with the sibling
   *  `CourseCard` tiles in the Learning Path Mandatory carousel. */
  minHeight?: number
}

/**
 * Learning Path promo card — a brand-dark "message" tile that sits inside
 * the Mandatory carousel alongside the course cards.
 *
 * Design pattern sourced from Figma file Nf5WhNJqxn9YVqDLT0MWOl:
 *   - node 295:10336 ("Customize Message Card" / "Your voice matters")
 *   - node 1388:16559 ("Required Tasks" card leading the carousel)
 *
 * Both share the same anatomy: a brand "primary darkest" surface with the
 * signature asymmetric corners (top-left + bottom-right rounded 24px, the
 * other two square), an oversized faded watermark glyph, a 24px heading, a
 * 14px body, and an optional white pill CTA. The surface, watermark, and
 * text colors all resolve from brand tokens, so the same component renders
 * teal for CRE, olive for McKissock, navy for STC, etc. — never hardcoded.
 */
export function LearningPathPromoCard({
  title,
  body,
  cta,
  watermarkIcon: WatermarkIcon,
  progress,
  minHeight = 384,
}: Props) {
  return (
    <section style={{ ...cardStyle, minHeight }}>
      {WatermarkIcon && (
        <span aria-hidden style={watermarkStyle}>
          <WatermarkIcon size={260} aria-hidden style={{ display: 'block' }} />
        </span>
      )}
      <div style={contentStyle}>
        <h3 style={titleStyle}>{title}</h3>
        {progress && <PromoProgress progress={progress} />}
        <p style={bodyStyle}>{body}</p>
        {cta && (
          <div style={ctaRowStyle}>
            <button type="button" onClick={cta.onClick} style={ctaButtonStyle}>
              {cta.label}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

/** Progress tracker — a faint white track with a filled portion + a
 *  white check-marker at the fill point, and an "X of N noun" label. */
function PromoProgress({ progress }: { progress: PromoCardProgress }) {
  const total = Math.max(progress.total, 1)
  const pct = Math.round((Math.min(progress.completed, total) / total) * 100)
  const noun = progress.noun ?? 'Tasks Completed'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        aria-hidden
        style={{
          position: 'relative',
          height: 6,
          borderRadius: 'var(--radius-pill)',
          background: 'rgb(255 255 255 / 0.25)',
        }}
      >
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            minWidth: pct === 0 ? 0 : undefined,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-text-inverse)',
          }}
        />
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pct}%`,
            transform: 'translate(-50%, -50%)',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--color-text-inverse)',
            color: 'var(--color-primary-700)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 1px 3px rgb(0 0 0 / 0.25)',
          }}
        >
          <Check size={13} aria-hidden />
        </span>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--color-text-inverse)',
        }}
      >
        {progress.completed} of {progress.total} {noun}
      </span>
    </div>
  )
}

/* ─── Styles ─────────────────────────────────────────────────────── */

const cardStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-primary-700)',
  color: 'var(--color-text-inverse)',
  // Signature asymmetric corners from the Figma pattern: top-left +
  // bottom-right rounded, the other two square.
  borderTopLeftRadius: 24,
  borderBottomRightRadius: 24,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: 0,
}

// Oversized glyph bled off the bottom-right corner as a faded watermark.
// Uses a translucent white rather than a brand tint so it reads on every
// brand's dark card surface — on STC the primary-500/700 navies are nearly
// identical, which left the watermark invisible. Pulled in slightly so
// more of the glyph shows.
const watermarkStyle: CSSProperties = {
  position: 'absolute',
  right: -36,
  bottom: -44,
  color: 'var(--color-text-inverse)',
  opacity: 0.14,
  pointerEvents: 'none',
  lineHeight: 0,
}

const contentStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 32,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 24,
  lineHeight: '32px',
  color: 'var(--color-text-inverse)',
}

const bodyStyle: CSSProperties = {
  margin: 0,
  maxWidth: 200,
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-inverse)',
}

// Pin the CTA to the bottom of the card — mirrors the "Review" button's
// placement on node 295:10336.
const ctaRowStyle: CSSProperties = {
  marginTop: 'auto',
  paddingTop: 8,
}

const ctaButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 16px',
  minHeight: 36,
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '28px',
  cursor: 'pointer',
}
