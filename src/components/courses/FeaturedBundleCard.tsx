import { Podcast } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { FeaturedBundle } from '@/data/podcastFixtures'

export function FeaturedBundleCard({ data }: { data: FeaturedBundle }) {
  return (
    <Card
      className="cre-course-card cre-card-asym cre-card-stacked"
      style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'row',
        height: 140,
        overflow: 'hidden',
      }}
    >
      <div
        className="cre-tile-header cre-tile-header--podcast"
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 130,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: 12,
          overflow: 'hidden',
        }}
      >
        <ConcentricRings />
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1,
            color: 'var(--color-text-inverse)',
          }}
        >
          {formatCe(data.ceHours)}
        </span>
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--podcast-on-surface-strong)',
          }}
        >
          CE HOURS
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px 14px',
          gap: 4,
        }}
      >
        <span
          style={{
            alignSelf: 'flex-start',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--podcast-pill-bg)',
            color: 'var(--podcast-pill-text)',
            fontFamily: 'var(--font-body)',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          {data.bundleLabel}
        </span>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 15,
            lineHeight: 1.2,
            color: 'var(--color-text-primary)',
          }}
        >
          {data.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          {data.episodes} episodes · {formatCe(data.ceHours)} CE hrs · {data.state}
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--color-text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.description}
        </p>
      </div>
    </Card>
  )
}

function formatCe(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toString()
}

function ConcentricRings() {
  return (
    <>
      <Podcast
        aria-hidden
        size={160}
        style={{
          position: 'absolute',
          right: -28,
          bottom: -28,
          color: 'var(--color-text-inverse)',
          opacity: 0.14,
          pointerEvents: 'none',
        }}
      />
      <Podcast
        aria-hidden
        size={220}
        style={{
          position: 'absolute',
          left: -42,
          top: -42,
          color: 'var(--color-text-inverse)',
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

