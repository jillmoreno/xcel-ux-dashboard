import type { ComponentType, ReactNode } from 'react'
import { Bolt, Crown, Gem } from '@/icons'

type Props = {
  initials: string
  size?: number
  /** Visual tone (used when no imageUrl is provided) — defaults to brand primary (mint) */
  tone?: 'brand' | 'neutral'
  /** Avatar image URL. When set, renders an <img> instead of initials. */
  imageUrl?: string
  /** Accessible label for the avatar — defaults to the initials string. */
  alt?: string
  /** Apply the double-ring treatment (inner border + outer outline). */
  ring?: boolean
  /** Show the "Pro" gem badge on the bottom-right. */
  pro?: boolean
  /**
   * Color ramp for the ring + Pro gem badge. Defaults to `tertiary` (the
   * gold/cyan treatment used app-wide). `secondary` matches the Elite teal
   * "Passport Lite" membership badge — used on the Dashboard Rebrand shell so
   * the avatar and the membership badge read as one scheme.
   */
  accent?: 'tertiary' | 'secondary'
  /**
   * Membership tier (Figma "Tier Profile Pics", nodes 1444:30900 / :30947).
   * Renders concentric tier rings + a bottom-right badge carrying the tier's
   * glyph, per the spec:
   *   - `plus`    → single ring (primary-600) + Bolt badge
   *   - `pro`     → double ring (tertiary-300 / -600) + Gem badge
   *   - `premier` → triple ring (warning-200 / -300 / -600) + Crown badge
   *   - `default` (or omitted) → plain avatar (no ring / no badge)
   * Each brand's tokens resolve the ramp, so the treatment reads on-brand.
   * When set to a non-default tier it supersedes `ring` / `pro` / `accent`.
   */
  tier?: 'default' | 'plus' | 'pro' | 'premier'
}

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

const TONES: Record<NonNullable<Props['tone']>, { bg: string; fg: string }> = {
  brand: { bg: 'var(--color-primary-200)', fg: 'var(--color-primary-900)' },
  neutral: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-darkest)' },
}

/** Tier → token ramp, badge glyph, and concentric ring colors (inner → outer),
 *  from the Figma "Colors for Membership Tiers" spec. The badge fill uses the
 *  ramp's -600 step. */
const TIERS: Record<
  'plus' | 'pro' | 'premier',
  { ramp: string; Icon: IconComponent; rings: string[] }
> = {
  plus: { ramp: 'primary', Icon: Bolt, rings: ['var(--color-primary-600)'] },
  pro: {
    ramp: 'tertiary',
    Icon: Gem,
    rings: ['var(--color-tertiary-300)', 'var(--color-tertiary-600)'],
  },
  premier: {
    ramp: 'warning',
    Icon: Crown,
    rings: ['var(--color-warning-200)', 'var(--color-warning-300)', 'var(--color-warning-600)'],
  },
}

/** Double-ring + badge colors for a token ramp (`primary` / `tertiary` /
 *  `secondary` / `warning` — each defines a 500 / 300 / 600 step). */
function rampPalette(ramp: string) {
  return {
    border: `var(--color-${ramp}-500)`,
    outline: `var(--color-${ramp}-300)`,
    badge: `var(--color-${ramp}-600)`,
  }
}

export function Avatar({
  initials,
  size = 60,
  tone = 'brand',
  imageUrl,
  alt,
  ring = false,
  pro = false,
  accent = 'tertiary',
  tier,
}: Props) {
  // A non-default tier supersedes the legacy `ring`/`pro`/`accent` controls:
  // it picks the ramp, renders concentric tier rings, and carries its own glyph.
  const tierDef = tier && tier !== 'default' ? TIERS[tier] : null
  const palette = rampPalette(tierDef ? tierDef.ramp : accent)
  // Legacy border+outline double-ring — only for the non-tier `ring` path.
  const showLegacyRing = !tierDef && ring
  const BadgeIcon: IconComponent | null = tierDef ? tierDef.Icon : pro ? Gem : null
  // Badge fill: the tier ramp's -600 (spec) or the legacy accent's -600.
  const badgeFill = tierDef ? `var(--color-${tierDef.ramp}-600)` : palette.badge

  const ringStyle = showLegacyRing
    ? {
        border: `3px solid ${palette.border}`,
        outline: `2px solid ${palette.outline}`,
        outlineOffset: 2,
      }
    : undefined

  const inner = imageUrl ? (
    // Wrap the img so we can zoom in on the face via a CSS transform
    // without breaking the ring borders. transform-origin biased upward
    // so a landscape stock photo's subject ends up in the visible circle
    // instead of the chest/shoulders that would otherwise sit in the center.
    <span
      style={{
        display: 'inline-block',
        // Never let a flex parent (e.g. the profile-header row) squish the
        // avatar horizontally — a non-square box + pill radius reads as an oval.
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
        ...ringStyle,
      }}
    >
      <img
        src={imageUrl}
        alt={alt ?? initials}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transform: 'scale(1.55)',
          transformOrigin: 'center 28%',
        }}
      />
    </span>
  ) : (
    (() => {
      const { bg, fg } = TONES[tone]
      return (
        <span
          role="img"
          aria-label={alt ?? `Avatar ${initials}`}
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            width: size,
            height: size,
            borderRadius: 'var(--radius-pill)',
            background: bg,
            color: fg,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: Math.round(size * 0.36),
            letterSpacing: '0.02em',
            ...ringStyle,
          }}
        >
          {initials}
        </span>
      )
    })()
  )

  // Tier path: wrap the avatar core in concentric rings (inner → outer). Each
  // ring is a 3px bordered circle with NO padding, so the color bands sit flush
  // against each other (single / double / triple per tier) — a solid graduated
  // band, matching the Figma "Tier Profile Pics" (no gaps between the colors).
  // The legacy `ring` path keeps its border+outline treatment on `inner`.
  const RING_WIDTH = 3
  const ringed: ReactNode = tierDef
    ? tierDef.rings.reduce<ReactNode>(
        (node, color) => (
          <span
            style={{
              display: 'inline-flex',
              borderRadius: 'var(--radius-pill)',
              border: `${RING_WIDTH}px solid ${color}`,
            }}
          >
            {node}
          </span>
        ),
        inner,
      )
    : inner

  if (!BadgeIcon) return ringed

  // Badge sizing scales with the avatar so it reads similarly at any size.
  const badge = Math.max(20, Math.round(size * 0.32))
  // Each tier ring adds `RING_WIDTH` to the radius (contiguous borders, no gap),
  // so the avatar circle's edge sits `ringInset` inside the ringed container.
  // Anchor the badge low in the bottom-right corner (overlapping the outer ring)
  // — a bigger outward pull than the ring inset so more-ringed tiers (premier)
  // don't float up-left. Symmetric right/bottom keeps it on the 45° corner.
  const ringInset = tierDef ? tierDef.rings.length * RING_WIDTH : 0
  const badgeOffset = Math.max(0, ringInset - Math.round(badge * 0.32))
  return (
    <span
      style={
        tierDef
          ? { position: 'relative', display: 'inline-flex', flexShrink: 0 }
          : { position: 'relative', display: 'inline-block', flexShrink: 0, width: size, height: size }
      }
    >
      {ringed}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: badgeOffset,
          bottom: badgeOffset,
          width: badge,
          height: badge,
          borderRadius: 'var(--radius-pill)',
          background: badgeFill,
          // Always white — the badge sits on a saturated fill in every theme.
          // (`neutral-50` inverts to navy under the rebrand's dark theme, which
          // would hide the glyph; `text-inverse` stays white on both.)
          color: 'var(--color-text-inverse)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BadgeIcon size={Math.max(10, Math.round(badge * 0.5))} aria-hidden />
      </span>
    </span>
  )
}
