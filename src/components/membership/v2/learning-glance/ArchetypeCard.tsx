import type { ComponentType } from 'react'
import { BookOpen, Podcast, Video } from '@/icons'
import type {
  ContentFormat,
  LearningArchetype,
} from '@/data/membership/learningAtAGlanceFixtures'
import { glanceCardHeadStyle } from './glanceShared'

/**
 * Gradient hero card — learning-style archetype label, blurb, and the
 * format-mix bars. Bars are decorative; the percentage lives in adjacent
 * text and each row carries an aria-label.
 */
const FORMAT_META: Record<
  ContentFormat,
  { label: string; Icon: ComponentType<{ size?: number }>; fill: string }
> = {
  video: { label: 'Video', Icon: Video, fill: 'var(--color-secondary-300)' },
  podcast: { label: 'Podcasts', Icon: Podcast, fill: 'var(--color-tertiary-500)' },
  reading: { label: 'Reading', Icon: BookOpen, fill: 'var(--color-neutral-50)' },
}

const FORMAT_ORDER: ContentFormat[] = ['video', 'podcast', 'reading']

export function ArchetypeCard({ archetype }: { archetype: LearningArchetype }) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, var(--color-primary-800), var(--color-primary-600) 60%, var(--color-secondary-600))',
        color: 'var(--color-text-inverse)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <h3 style={{ ...glanceCardHeadStyle, color: 'var(--color-secondary-200)' }}>
        Your learning style
      </h3>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 1.05,
          margin: '6px 0 10px',
          color: 'inherit',
        }}
      >
        {archetype.label}
      </div>
      <p
        style={{
          margin: '0 0 22px',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          color: 'rgb(255 255 255 / 0.88)',
          maxWidth: '42ch',
        }}
      >
        {archetype.blurb}
      </p>
      <div style={{ display: 'grid', gap: 12 }}>
        {FORMAT_ORDER.map((format) => {
          const { label, Icon, fill } = FORMAT_META[format]
          const pct = archetype.mix[format]
          return (
            <div
              key={format}
              aria-label={`${label} ${pct}%`}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 48px',
                alignItems: 'center',
                gap: 12,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'rgb(255 255 255 / 0.9)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Icon size={15} />
                {label}
              </span>
              <span
                aria-hidden
                style={{
                  height: 10,
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgb(255 255 255 / 0.18)',
                  overflow: 'hidden',
                  display: 'block',
                }}
              >
                <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: fill, borderRadius: 'var(--radius-pill)' }} />
              </span>
              <span style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {pct}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
