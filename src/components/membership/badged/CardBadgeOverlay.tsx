import type { ComponentType, CSSProperties } from 'react'
import { Bolt, Crown, Lock } from '@/icons'
import { STATUS_BADGE, TIER_BADGE, type CardBadges, type CardStatus, type CardTier } from './cardBadges'

type IconType = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

const TIER_ICON: Record<CardTier, IconType> = { lite: Bolt, passport: Crown }
const STATUS_ICON: Partial<Record<CardStatus, IconType>> = { exclusive: Lock }

/** One badge pill (tier or status). */
export function BadgePill({
  bg,
  fg,
  label,
  Icon,
}: {
  bg: string
  fg: string
  label: string
  Icon?: IconType
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        height: 24,
        padding: '0 9px',
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color: fg,
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 1px 3px rgb(0 0 0 / 0.22)',
      }}
    >
      {Icon && <Icon size={12} aria-hidden />}
      {label}
    </span>
  )
}

const cornerBase: CSSProperties = { position: 'absolute', top: 10, zIndex: 3, display: 'flex', gap: 6 }

/**
 * Top-corner badge overlay for a product card — the tier pill (Passport /
 * Passport Lite) floated top-left, the optional status pill (New / Member
 * Exclusive) top-right. Drop inside a `position: relative` media / cover
 * element. Used across the "Badged Version" dashboard's card surfaces
 * (Recommended for you, What's Trending, the What's New carousel).
 */
export function CardBadgeOverlay({ badges }: { badges: CardBadges }) {
  const tier = TIER_BADGE[badges.tier]
  const status = badges.status ? STATUS_BADGE[badges.status] : null
  return (
    <>
      <span style={{ ...cornerBase, left: 10 }}>
        <BadgePill bg={tier.bg} fg={tier.fg} label={tier.label} Icon={TIER_ICON[badges.tier]} />
      </span>
      {status && badges.status && (
        <span style={{ ...cornerBase, right: 10 }}>
          <BadgePill bg={status.bg} fg={status.fg} label={status.label} Icon={STATUS_ICON[badges.status]} />
        </span>
      )}
    </>
  )
}
