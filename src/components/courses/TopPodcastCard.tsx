import { useState, type MouseEvent } from 'react'
import { Plus, Podcast, StarSolid } from '@/icons'
import { Card } from '@/components/ui/Card'
import type { TopPodcastEntry } from '@/data/podcastFixtures'
import { PodcastSheet } from './PodcastSheet'

const BADGE_LABEL: Record<TopPodcastEntry['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
}

export function TopPodcastCard({ data }: { data: TopPodcastEntry }) {
  const [open, setOpen] = useState(false)

  const sheetData = {
    id: data.id,
    title: data.title,
    hours: data.hours,
    state: data.state,
    delivery: 'podcast' as const,
    badge: data.badge,
    rating: data.rating,
    chapters: [],
  }

  const handleCardClick = () => setOpen(true)
  const handlePlayClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setOpen(true)
  }

  return (
    <>
      <Card
        className="cre-course-card cre-card-asym"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={data.title}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen(true)
          }
        }}
        style={{
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          flexDirection: 'row',
          height: 140,
        }}
      >
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 72,
            padding: '10px 12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: data.color,
          }}
        >
          <span
            aria-label={`Ranked number ${data.rank}`}
            style={{
              position: 'relative',
              zIndex: 1,
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 32,
              lineHeight: 1,
              color: 'var(--color-text-inverse)',
            }}
          >
            {data.rank}
          </span>
          <Podcast
            size={90}
            aria-hidden
            style={{
              position: 'absolute',
              right: -22,
              bottom: -24,
              color: 'var(--color-text-inverse)',
              opacity: 0.18,
              pointerEvents: 'none',
            }}
          />
        </div>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            padding: '10px 14px',
            gap: 2,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 14,
              lineHeight: 1.25,
              margin: 0,
              color: 'var(--color-text-primary)',
              paddingRight: 44,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.title}
          </h3>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
            }}
          >
            <span>{BADGE_LABEL[data.badge]}</span>
            <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
            <span>
              {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
            </span>
            <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
            <span>{data.state}</span>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            <StarSolid size={14} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
            {data.rating.toFixed(1)}
          </span>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              lineHeight: 1.4,
              color: 'var(--color-text-secondary)',
              paddingRight: 44,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {data.description}
          </p>
          <button
            type="button"
            onClick={handlePlayClick}
            aria-label={`Add ${data.title} to playlist`}
            title="Add to Playlist"
            className="cre-top-play-btn"
            style={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
      </Card>
      <PodcastSheet open={open} onClose={() => setOpen(false)} data={sheetData} />
    </>
  )
}

