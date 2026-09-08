import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, BookOpen, Flag, Podcast, StarSolid, Video } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import {
  learningAtAGlanceFor,
  type ContentFormat,
} from '@/data/membership/learningAtAGlanceFixtures'
import { Block, Wrap } from './passportShared'

/**
 * Slim "Your year in learning" badge on the Elite member view — the entry
 * point to the full recap page (`/membership/recap`). Solid secondary-teal
 * bar with white chips/action for AA-safe contrast over the teal fill.
 *
 * Renders only for Elite members (selector returns null otherwise). If
 * design later wants a lighter teal fill (`secondary-500/600`), the chip
 * text would need to step to `secondary-800` or the fill stay at 700 to
 * keep AA — keep the white-chip / teal-text pairing here.
 */
const FORMAT_ICON: Record<ContentFormat, ComponentType<{ size?: number }>> = {
  video: Video,
  podcast: Podcast,
  reading: BookOpen,
}

function dominantFormat(mix: Record<ContentFormat, number>): ContentFormat {
  return (Object.keys(mix) as ContentFormat[]).reduce((top, f) =>
    mix[f] > mix[top] ? f : top,
  )
}

const CHIP_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'var(--color-neutral-50)',
  color: 'var(--color-secondary-800)',
  borderRadius: 'var(--radius-pill)',
  padding: '5px 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
} as const

export function LearningRecapBadge({ bare = false }: { bare?: boolean } = {}) {
  const { brand, membership } = useAccount()
  const glance = learningAtAGlanceFor(brand)
  if (membership !== 'member' || !glance) return null

  // Archetype chip drops the leading "The " for the compact label.
  const archetypeShort = glance.archetype.label.replace(/^The\s+/, '')
  const FormatIcon = FORMAT_ICON[dominantFormat(glance.archetype.mix)]
  const topSpecialty = glance.topSpecialties[0]?.name

  const badge = (
        <section
          aria-label="Your year in learning"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '16px 22px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-secondary-700)',
            color: 'var(--color-text-inverse)',
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 16,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              aria-hidden
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'var(--color-secondary-600)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-text-inverse)',
              }}
            >
              <StarSolid size={14} />
            </span>
            Your year in learning
          </span>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <span style={CHIP_STYLE}>
              <FormatIcon size={13} aria-hidden />
              <b style={{ fontFamily: 'var(--font-heading)' }}>{archetypeShort}</b>
            </span>
            {topSpecialty && (
              <span style={CHIP_STYLE}>
                Top: <b style={{ fontFamily: 'var(--font-heading)' }}>{topSpecialty}</b>
              </span>
            )}
            <span style={CHIP_STYLE}>
              <b style={{ fontFamily: 'var(--font-heading)' }}>{glance.consistency.ceHours}</b> CE hrs
            </span>
            <span style={CHIP_STYLE}>
              <Flag size={13} aria-hidden />
              <b style={{ fontFamily: 'var(--font-heading)' }}>{glance.consistency.streakWeeks}-wk</b> streak
            </span>
            <span style={CHIP_STYLE}>
              <Award size={13} aria-hidden />
              <b style={{ fontFamily: 'var(--font-heading)' }}>{glance.milestones.certificatesEarned}</b> certificates
            </span>
          </div>

          <Link
            to="/membership/recap"
            className="cre-recap-go"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: 'transparent',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              padding: '4px 2px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            See your recap
            <ArrowRight size={13} aria-hidden />
          </Link>
        </section>
  )

  // `bare` (Dashboard Rebrand overview) drops the page-level Block/Wrap so the
  // pill spans its column directly; the standalone V2/V6 pages keep the inset.
  if (bare) return badge
  return (
    <Block style={{ paddingTop: 30, paddingBottom: 0 }}>
      <Wrap>{badge}</Wrap>
    </Block>
  )
}
