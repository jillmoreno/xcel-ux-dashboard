import type { ComponentType, CSSProperties, ReactNode } from 'react'

/**
 * The cover-overlay pill chrome, shared by `EnrolledBadge` and
 * `CourseStatusBadge`.
 *
 * It exists so the two overlays can never drift. They sit in the SAME corner of
 * the same kind of card — one on the catalog card, one on the owned card — and
 * a reviewer comparing screenshots would read any difference in radius, padding
 * or shadow as meaning something. Extracted rather than duplicated: the geometry
 * below is `EnrolledBadge`'s, unchanged.
 *
 * The border is derived from the foreground with `color-mix` rather than being a
 * per-tone token, so a new tone needs one row in its caller's map and nothing
 * here. That also means it works for every brand's ramp without a lookup.
 *
 * NOT INTERACTIVE. A `<span>` with no click and no focus — these are markers,
 * not controls. If one ever needs to act, it stops being this component.
 */
export function CoverPill({
  Icon,
  bg,
  fg,
  placement = 'inline',
  iconSize,
  style,
  children,
}: {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  /** CSS value for the fill — always a `var(--color-…)`, never a literal. */
  bg: string
  /** CSS value for the text + glyph. The border is mixed from this. */
  fg: string
  /** `overlay` absolutely positions it over a cover image; `inline` sits in flow. */
  placement?: 'overlay' | 'inline'
  iconSize?: number
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <span
      style={{
        ...PILL,
        background: bg,
        color: fg,
        border: `1px solid color-mix(in srgb, ${fg} 22%, transparent)`,
        ...(placement === 'overlay' ? OVERLAY : null),
        ...style,
      }}
    >
      <Icon size={iconSize ?? (placement === 'overlay' ? 13 : 14)} aria-hidden />
      {children}
    </span>
  )
}

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 11px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
}

const OVERLAY: CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1,
  // Lift the chip off the photo so it reads on light + dark covers.
  boxShadow: '0 1px 4px rgb(0 0 0 / 0.18)',
}
