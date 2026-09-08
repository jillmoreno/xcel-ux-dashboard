import { useState } from 'react'
import { Clock, Podcast, StarSolid, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import type { PodcastChapter, PodcastRecord } from '@/data/podcastFixtures'

type Props = {
  open: boolean
  onClose: () => void
  data: PodcastRecord | null
}

export function PodcastSheet({ open, onClose, data }: Props) {
  const [tab, setTab] = useState<'description' | 'chapters'>('description')

  if (!data) return null
  const totalMin = data.chapters.reduce((sum, c) => sum + c.durationMin, 0)

  return (
    <Sheet open={open} onClose={onClose} title="Podcast Summary">
      <header
        style={{
          height: 100,
          flexShrink: 0,
          padding: '20px 24px 4px',
          background: 'var(--color-neutral-extra-light)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '24px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.2,
            color: 'var(--color-tertiary-700)',
          }}
        >
          Podcast Summary
        </h2>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-neutral-extra-light)' }}>
        <div style={{ background: 'var(--color-surface-card)', padding: '20px 24px 0' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 20 }}>
            <div
              aria-hidden
              style={{
                width: 80,
                height: 76,
                borderRadius: 6,
                background: 'var(--color-tertiary-700)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-tertiary-200)',
                flexShrink: 0,
              }}
            >
              <Podcast size={60} aria-hidden style={{ opacity: 0.5 }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                {data.title}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>
                {data.chapters.length} {data.chapters.length === 1 ? 'Chapter' : 'Chapters'}
                {' · '}
                {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>{data.state}</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                <StarSolid size={12} aria-hidden style={{ color: 'var(--color-warning-500)' }} />
                {data.rating.toFixed(1)}
              </span>
              <button
                type="button"
                style={{
                  marginTop: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 28px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-action)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add to Playlist
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', padding: '8px 24px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <TabButton active={tab === 'description'} onClick={() => setTab('description')}>
            Description
          </TabButton>
          <TabButton active={tab === 'chapters'} onClick={() => setTab('chapters')}>
            Chapters
          </TabButton>
        </div>

        <div style={{ padding: '20px 24px 32px' }}>
          {tab === 'description' ? (
            <DescriptionTab data={data} totalMin={totalMin} />
          ) : (
            <ChaptersTab chapters={data.chapters} />
          )}
        </div>
      </div>
    </Sheet>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cre-membership-tab"
      data-active={active ? 'true' : 'false'}
      style={{
        flex: 1,
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '6px 8px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 16,
        fontWeight: 600,
        lineHeight: '28px',
        cursor: 'pointer',
      }}
    >
      <span style={{ padding: '0 8px' }}>{children}</span>
      <span
        aria-hidden
        style={{
          width: '100%',
          height: 4,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: active ? 'var(--color-tertiary-500)' : 'transparent',
        }}
      />
    </button>
  )
}

function DescriptionTab({ data, totalMin }: { data: PodcastRecord; totalMin: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.5 }}>
      <section>
        <h3 style={sectionHeading}>About this podcast</h3>
        <p style={{ margin: 0 }}>
          {data.description ??
            'A short-form audio series for real estate professionals. Listen on the go and earn credit toward your continuing education goals.'}
        </p>
      </section>
      <section>
        <h3 style={sectionHeading}>What's included</h3>
        <ul style={bulletList}>
          <li>
            {data.chapters.length} {data.chapters.length === 1 ? 'chapter' : 'chapters'} ({totalMin} minutes total)
          </li>
          <li>Listen offline from any device</li>
          <li>Captions and transcripts included</li>
          <li>Counts toward your {data.badge === 'mandatory' ? 'mandatory' : 'elective'} hours in {data.state}</li>
        </ul>
      </section>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, margin: 0 }}>
        Chapter progress is saved automatically. Add this podcast to your playlist to pick up where you left off.
      </p>
    </div>
  )
}

function ChaptersTab({ chapters }: { chapters: PodcastChapter[] }) {
  if (chapters.length === 0) {
    return (
      <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Chapter list coming soon.
      </p>
    )
  }
  return (
    <ol style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
      {chapters.map((c) => (
        <ChapterRow key={c.id} chapter={c} />
      ))}
    </ol>
  )
}

function ChapterRow({ chapter }: { chapter: PodcastChapter }) {
  return (
    <li
      className="cre-included-course-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 12,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-tertiary-100)',
          color: 'var(--color-tertiary-700)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {chapter.number}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h4
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.3,
            color: 'inherit',
          }}
        >
          {chapter.title}
        </h4>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Clock size={12} aria-hidden />
          {chapter.durationMin} min
        </span>
      </div>
    </li>
  )
}

const sectionHeading = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)' as const,
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const bulletList = {
  margin: 0,
  paddingLeft: 20,
}
