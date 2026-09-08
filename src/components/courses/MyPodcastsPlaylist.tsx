import { useState } from 'react'
import { CircleCheck, Clock, MoreVertical, Podcast } from '@/icons'
import type { PodcastPlaylistRecord, PodcastPlaylistStatus } from '@/data/podcastFixtures'
import { PodcastSheet } from './PodcastSheet'

type Props = {
  rows: PodcastPlaylistRecord[]
}

const CREDIT_TYPE: Record<PodcastPlaylistRecord['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'non-credit': 'Non-Credit',
}

const EM_DASH = '—'

// Spotify-style playlist: a hoverable list (NOT a table). Each row swaps its
// index number for a play button on hover, highlights, and reveals a row-menu
// — mirroring how Spotify presents a saved playlist. Same data as the old
// table view; the column rhythm is kept via CSS grid rather than <table>.
const GRID_COLUMNS = '32px minmax(0, 1fr) 132px 168px 132px'

export function MyPodcastsPlaylist({ rows }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const active = activeId ? rows.find((r) => r.id === activeId) ?? null : null
  return (
    <>
      <div
        style={{
          background: 'var(--color-surface-card)',
          border: '1px solid var(--color-neutral-light)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        {/* Column header — visual only; each row carries its own a11y label. */}
        <div
          aria-hidden
          style={{
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            alignItems: 'center',
            gap: 16,
            padding: '12px 20px',
            borderBottom: '1px solid var(--color-neutral-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span style={{ textAlign: 'center' }}>#</span>
          <span>Title</span>
          <span>Date added</span>
          <span>Progress</span>
          <span style={{ display: 'inline-flex', justifyContent: 'flex-end' }}>
            <Clock size={15} aria-hidden />
          </span>
        </div>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {rows.map((row, i) => (
            <Row key={row.id} row={row} index={i + 1} onOpen={() => setActiveId(row.id)} />
          ))}
        </ul>
      </div>
      <PodcastSheet open={active != null} onClose={() => setActiveId(null)} data={active} />
    </>
  )
}

function Row({
  row,
  index,
  onOpen,
}: {
  row: PodcastPlaylistRecord
  index: number
  onOpen: () => void
}) {
  const status = row.myStatus
  const progress = status === 'completed' ? 100 : Math.round(row.progress ?? 0)
  return (
    <li>
      <div
        className="cre-playlist-row"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        aria-label={`Open ${row.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          alignItems: 'center',
          gap: 16,
          padding: '8px 20px',
          cursor: 'pointer',
        }}
      >
        {/* # / play toggle */}
        <span style={{ position: 'relative', width: 32, height: 32, justifySelf: 'center' }}>
          <span
            className="cre-playlist-index"
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-secondary)',
            }}
          >
            {index}
          </span>
          <button
            type="button"
            className="cre-playlist-play"
            aria-label={`Play ${row.title}`}
            title="Play"
            onClick={(e) => {
              e.stopPropagation()
              console.info('cta:play-podcast', row.id)
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--color-text-primary)',
            }}
          >
            <PlayTriangle />
          </button>
        </span>

        {/* Cover + title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--podcast-surface)',
              color: 'var(--color-text-inverse)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Podcast size={22} aria-hidden style={{ opacity: 0.92 }} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.title}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {CREDIT_TYPE[row.badge]} · {row.hours} {row.hours === 1 ? 'hr' : 'hrs'} ·{' '}
              {formatStates(row.state)}
            </span>
          </div>
        </div>

        {/* Date added */}
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          {formatDate(row.addedAt)}
        </span>

        {/* Progress */}
        <ProgressCell status={status} progress={progress} />

        {/* Saved + time + row menu */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <CircleCheck
            size={17}
            aria-hidden
            style={{ color: 'var(--podcast-accent)', flexShrink: 0 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-secondary)',
              minWidth: 44,
              textAlign: 'right',
            }}
          >
            {formatTimeRemaining(row.hours, status, progress)}
          </span>
          <button
            type="button"
            className="cre-playlist-kebab cre-card-kebab"
            aria-label={`More actions for ${row.title}`}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 28, height: 28 }}
          >
            <MoreVertical size={16} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  )
}

function PlayTriangle() {
  return (
    <svg width="12" height="14" viewBox="0 0 11 13" aria-hidden focusable="false" style={{ marginLeft: 2 }}>
      <path d="M1 1 L10 6.5 L1 12 Z" fill="currentColor" />
    </svg>
  )
}

function ProgressCell({ status, progress }: { status: PodcastPlaylistStatus; progress: number }) {
  const label =
    status === 'completed' ? 'Complete' : status === 'not-started' ? 'Not Started' : `${progress}%`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          position: 'relative',
          flex: 1,
          height: 5,
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--radius-pill)',
          overflow: 'hidden',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${progress}%`,
            background: 'var(--podcast-fill)',
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
      <span
        style={{
          minWidth: 64,
          textAlign: 'right',
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function formatDate(iso: string): string {
  const parts = iso.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso
  const d = new Date(parts[0], parts[1] - 1, parts[2])
  const month = d.toLocaleString('en-US', { month: 'short' })
  return `${month} ${d.getDate()}, ${d.getFullYear()}`
}

function formatStates(state: string): string {
  if (state.includes('|') || state.includes(',')) {
    return state
      .split(/[,|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(' | ')
  }
  return state
}

function formatTimeRemaining(
  hours: number,
  status: PodcastPlaylistStatus,
  progress: number,
): string {
  if (status === 'completed') return EM_DASH
  const remainingHours = hours * (1 - progress / 100)
  if (remainingHours >= 1) {
    return `${remainingHours.toFixed(1)} hr`
  }
  const minutes = Math.round(remainingHours * 60)
  return `${minutes} min`
}
