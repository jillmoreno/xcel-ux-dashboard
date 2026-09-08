import type { ComponentType, CSSProperties, ReactNode } from 'react'
import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  Flag,
  Gem,
  Library,
  Podcast,
  Robot,
  Video,
} from '@/icons'
import type { PassportIconKey } from '@/data/membership/passportProductsFixtures'

/**
 * Shared building blocks for the Membership v2 (Passport) redesign.
 * Mirrors the prototype's `.btn`, `.wrap`, `.eyebrow`, section shells,
 * and the product icon tiles — colors/fonts/radii reference Elite CSS
 * variables (they cascade via `<html data-brand="elite">`).
 */

export const WRAP_MAX = 1200

/** Centered, gutter-respecting inner container (prototype `.wrap`). */
export function Wrap({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ maxWidth: WRAP_MAX, margin: '0 auto', padding: '0 24px', ...style }}>
      {children}
    </div>
  )
}

/** Uppercase secondary-toned eyebrow (prototype `.eyebrow`). */
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--color-eyebrow-text)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

/** Compact card-header eyebrow — the smaller `font-body` treatment used by the
 *  Dashboard Rebrand summary cards (Jump Back In, Current Learning Path): 11px,
 *  weight 600, 0.04em tracking, neutral `text-secondary`. Distinct from
 *  `Eyebrow` above, which is the larger Brandon Grotesque section eyebrow.
 *  `color` overrides the default so palette-aware cards can pass `p.eyebrow`. */
export function SummaryEyebrow({
  children,
  color = 'var(--color-text-secondary)',
  style,
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

type ButtonVariant = 'primary' | 'ghost' | 'light' | 'outline-light'

const BUTTON_VARIANT_STYLE: Record<ButtonVariant, CSSProperties> = {
  primary: { background: 'var(--color-action)', color: 'var(--color-text-inverse)' },
  ghost: {
    background: 'transparent',
    color: 'var(--color-primary-700)',
    borderColor: 'var(--color-primary-300)',
  },
  light: { background: 'var(--color-neutral-50)', color: 'var(--color-primary-700)' },
  'outline-light': {
    background: 'transparent',
    color: 'var(--color-text-inverse)',
    borderColor: 'rgb(255 255 255 / 0.55)',
  },
}

/** Pill button (prototype `.btn`). Demo-only — non-navigating. */
export function PassportButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  style,
}: {
  children: ReactNode
  variant?: ButtonVariant
  size?: 'md' | 'sm'
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: size === 'sm' ? 13.5 : 15,
        borderRadius: 'var(--radius-pill)',
        padding: size === 'sm' ? '9px 18px' : '13px 26px',
        border: '2px solid transparent',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        whiteSpace: 'nowrap',
        transition: 'background 180ms ease, border-color 180ms ease',
        ...BUTTON_VARIANT_STYLE[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/** Full-bleed vertical section band. `alt` paints the soft white→primary
 *  gradient the prototype uses to alternate sections. */
export function Block({
  children,
  alt = false,
  id,
  style,
}: {
  children: ReactNode
  alt?: boolean
  id?: string
  style?: CSSProperties
}) {
  return (
    <section
      id={id}
      style={{
        padding: '64px 0',
        ...(alt
          ? {
              background:
                'linear-gradient(180deg, var(--color-neutral-50) 0%, var(--color-primary-100) 100%)',
            }
          : null),
        ...style,
      }}
    >
      {children}
    </section>
  )
}

/** Centered section header (prototype `.section-head`). */
export function SectionHead({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string
  title: string
  blurb?: string
}) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 660, margin: '0 auto 44px' }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        style={{
          margin: '10px 0 0',
          fontFamily: 'var(--font-heading)',
          fontSize: 36,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          color: 'var(--color-primary-800)',
        }}
      >
        {title}
      </h2>
      {blurb && (
        <p
          style={{
            margin: '14px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--color-text-secondary)',
          }}
        >
          {blurb}
        </p>
      )}
    </div>
  )
}

/** Left-aligned section title with an optional trailing action (prototype
 *  `.sec-title`). Used on the member view. */
export function SecTitle({
  eyebrow,
  title,
  blurb,
  action,
}: {
  eyebrow: string
  title: string
  blurb?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2
          style={{
            margin: '6px 0 0',
            fontFamily: 'var(--font-heading)',
            fontSize: 28,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: 'var(--color-primary-800)',
          }}
        >
          {title}
        </h2>
        {blurb && (
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--color-text-secondary)',
            }}
          >
            {blurb}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

/* ─── Product icon tiles ─────────────────────────────────────────────── */

const PRODUCT_ICONS: Record<PassportIconKey, ComponentType<{ size?: number }>> = {
  video: Video,
  award: Award,
  briefcase: Briefcase,
  podcast: Podcast,
  robot: Robot,
  'file-lines': FileText,
  flag: Flag,
  books: Library,
  'book-open': BookOpen,
}

/** Rounded icon medallion used on every product card. `tone` picks the
 *  tint — `secondary` (default, brand teal) or `cta` (the Rubi AI accent
 *  used by the V3 Career Tools section). */
export function ProductIcon({
  iconKey,
  size = 46,
  tone = 'secondary',
}: {
  iconKey: PassportIconKey
  size?: number
  tone?: 'secondary' | 'cta'
}) {
  const Icon = PRODUCT_ICONS[iconKey]
  const palette =
    tone === 'cta'
      ? { background: 'var(--color-cta-100)', color: 'var(--color-cta-700)' }
      : { background: 'var(--color-secondary-100)', color: 'var(--color-secondary-700)' }
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-md)',
        display: 'grid',
        placeItems: 'center',
        marginBottom: 16,
        ...palette,
        flexShrink: 0,
      }}
    >
      <Icon size={Math.round(size * 0.46)} />
    </span>
  )
}

/* ─── Tier tags ──────────────────────────────────────────────────────── */

// Matches the catalog's "Included with membership" chip (`.cre-tag-pro`):
// font-body 12/600, radius-sm, 22px tall, soft wash that deepens on card
// hover (see `.cre-passport-prod` rules in tokens.css).
const MEMBERSHIP_TAG_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 8px',
  height: 22,
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
}

function PassportTierPill({ kind }: { kind: 'passport' | 'lite' }) {
  if (kind === 'lite') {
    return (
      <span
        className="cre-passport-tag-lite"
        style={{ ...MEMBERSHIP_TAG_STYLE, color: 'var(--color-primary-700)' }}
      >
        Passport Lite
      </span>
    )
  }
  return (
    <span
      className="cre-tag-pro"
      style={{ ...MEMBERSHIP_TAG_STYLE, color: 'var(--color-tertiary-700)' }}
    >
      <Gem size={12} aria-hidden />
      Passport
    </span>
  )
}

/** Renders the tier tag(s) for a product. `both` splits into two separate
 *  pills (Passport + Passport Lite); the others render a single pill. */
export function TierTags({ tier }: { tier: 'passport' | 'passport-lite' | 'both' }) {
  if (tier === 'both') {
    return (
      <>
        <PassportTierPill kind="passport" />
        <PassportTierPill kind="lite" />
      </>
    )
  }
  if (tier === 'passport-lite') return <PassportTierPill kind="lite" />
  return <PassportTierPill kind="passport" />
}
