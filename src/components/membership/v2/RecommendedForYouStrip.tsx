import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Lock, Monitor, Podcast, StarSolid, Video } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  passportRecommendationsFor,
  type PassportRecommendation,
  type PassportRecommendedKind,
} from '@/data/membership/passportRecommendedFixtures'
import { Block, SecTitle, Wrap } from './passportShared'

/**
 * "Recommended for you" — a row of small course tiles. Mirrors the
 * dashboard Top 5 tile: full-bleed image (no corner icon) + a tinted
 * bottom bar holding the title and a meta row (modality icon · label |
 * gold star + rating).
 */
const KIND_ICON: Record<PassportRecommendedKind, ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  course: Monitor,
  podcast: Podcast,
  video: Video,
  article: BookOpen,
}

const KIND_LABEL: Record<PassportRecommendedKind, string> = {
  course: 'Course',
  podcast: 'Podcast',
  video: 'Video',
  article: 'Article',
}

const KIND_BAR: Record<PassportRecommendedKind, string> = {
  course: 'var(--color-primary-700)',
  podcast: 'var(--color-tertiary-700)',
  video: 'var(--color-primary-700)',
  article: 'var(--color-secondary-800)',
}

export function RecommendedForYouStrip({ flush = false }: { flush?: boolean } = {}) {
  const { brand } = useAccount()
  const items = passportRecommendationsFor(brand)
  return (
    <ProductTileStrip
      id="recommended"
      eyebrow="Picked for you"
      title="Recommended for you"
      items={items}
      flush={flush}
    />
  )
}

/**
 * Reusable "row of product tiles" surface — a SecTitle (eyebrow + title +
 * View all) over a 5-up grid of `RecommendedTile`s. Drives both the
 * "Recommended for you" and "Featured products" sections.
 *
 * `flush` drops the inner `Wrap`'s 24px horizontal gutter so the strip aligns
 * with surrounding flush widgets (the Dashboard Rebrand overview sets this so
 * Recommended lines up with the Featured Products widget at the shell gutter);
 * the standalone membership pages keep the default 24px gutter.
 */
export function ProductTileStrip({
  id,
  eyebrow,
  title,
  items,
  flush = false,
}: {
  id: string
  eyebrow: string
  title: string
  items: PassportRecommendation[]
  flush?: boolean
}) {
  const { membership } = useAccount()
  const isMember = membership === 'member'
  if (items.length === 0) return null
  return (
    <Block id={id}>
      <Wrap style={flush ? { padding: 0 } : undefined}>
        <SecTitle
          eyebrow={eyebrow}
          title={title}
          action={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--color-accent-text)',
                cursor: 'pointer',
              }}
            >
              View all
              <ArrowRight size={13} aria-hidden />
            </span>
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}>
          {items.map((item) => (
            <RecommendedTile key={item.id} item={item} locked={item.memberOnly === true && !isMember} />
          ))}
        </div>
      </Wrap>
    </Block>
  )
}

export function RecommendedTile({
  item,
  locked = false,
  square = false,
}: {
  item: PassportRecommendation
  locked?: boolean
  /** Fix the tile to a 172×172 square (image header + filled bottom bar) —
   *  used by the Dashboard Rebrand's Recommended grid. */
  square?: boolean
}) {
  const Icon = KIND_ICON[item.kind]
  const barColor = KIND_BAR[item.kind]
  return (
    <Link
      to={item.href}
      // Locked (member-only, viewed by a non-member) tiles stay discoverable but
      // don't open the course — they surface a non-blocking upgrade pathway.
      onClick={
        locked
          ? (e) => {
              e.preventDefault()
              console.info('cta:upgrade-membership', { item: item.id })
            }
          : undefined
      }
      aria-label={locked ? `${item.title} (members only — upgrade to access)` : item.title}
      className="cre-recommended-simple-card"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: square ? 172 : undefined,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
    >
      <div
        aria-hidden
        style={{
          position: 'relative',
          height: 96,
          flexShrink: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.05)), center / cover no-repeat url(${item.imageUrl})`,
        }}
      >
        {locked && (
          <span style={memberBadgeStyle}>
            <Lock size={10} aria-hidden />
            Members only
          </span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          background: barColor,
          padding: '8px 12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          boxSizing: 'border-box',
        }}
      >
        <span
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: 13,
            lineHeight: '16px',
            color: 'var(--color-text-inverse)',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'nowrap',
            minWidth: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            color: 'color-mix(in srgb, var(--color-text-inverse) 88%, transparent)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <Icon size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {KIND_LABEL[item.kind]}
            </span>
          </span>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              width: 1,
              height: 10,
              background: 'color-mix(in srgb, var(--color-text-inverse) 40%, transparent)',
            }}
          />
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
            aria-label={`Rated ${item.rating} out of 5`}
          >
            <StarSolid size={11} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
            <span>{item.rating.toFixed(1)}</span>
          </span>
        </span>
      </div>
    </Link>
  )
}

const memberBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'rgb(0 0 0 / 0.6)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

function hoverIn(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
  e.currentTarget.style.transform = 'scale(1.005)'
}
function hoverOut(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.boxShadow = 'var(--shadow-card)'
  e.currentTarget.style.transform = 'none'
}
