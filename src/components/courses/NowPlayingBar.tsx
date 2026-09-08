import { useState } from 'react'
import { CircleCheck, Heart, Podcast, Video } from '@/icons'

export type NowPlayingBadge = 'Mandatory' | 'Elective'

export type NowPlayingData = {
  episodeTitle: string
  podcastTitle: string
  /** Optional — omitted when the data represents a whole podcast/show rather
   * than a single numbered episode (e.g. playlist entries). */
  episodeNumber?: number
  host?: string
  badge: NowPlayingBadge
  creditHours: number
  creditStates: string[]
  totalSec: number
  /** Optional checkpoint marker for "credit earned" indicator on the scrubber. */
  checkpointSec?: number
}

type Props = {
  data: NowPlayingData
  /** Current elapsed time in seconds. */
  elapsedSec: number
  isPlaying: boolean
  onPlayPause?: () => void
  onRewind?: () => void
  onForward?: () => void
  onFavorite?: () => void
  /** Optional eyebrow override (default: "NOW PLAYING · CREDIT TRACKING ACTIVE"). */
  eyebrow?: string
  /** Hide the "Switch to Video" toggle (used on the dashboard where there's no video). */
  hideVideoToggle?: boolean
}

export function NowPlayingBar({
  data,
  elapsedSec,
  isPlaying,
  onPlayPause,
  onRewind,
  onForward,
  onFavorite,
  eyebrow = 'NOW PLAYING · CREDIT TRACKING ACTIVE',
  hideVideoToggle = false,
}: Props) {
  const [checkpointHover, setCheckpointHover] = useState(false)
  const [isVideo, setIsVideo] = useState(false)

  const elapsedPct = data.totalSec > 0 ? (elapsedSec / data.totalSec) * 100 : 0
  const checkpointPct = data.checkpointSec && data.totalSec > 0
    ? (data.checkpointSec / data.totalSec) * 100
    : null
  const checkpointReached =
    data.checkpointSec !== undefined && elapsedSec >= data.checkpointSec

  return (
    <section
      aria-label="Now playing"
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-neutral-700)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-inverse)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <Podcast
        size={220}
        aria-hidden
        style={{
          position: 'absolute',
          right: -40,
          top: -40,
          color: 'var(--color-text-inverse)',
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          flexShrink: 0,
          width: isVideo ? 280 : 96,
          height: isVideo ? 158 : 96,
          borderRadius: 'var(--radius-md)',
          background: isVideo
            ? 'linear-gradient(135deg, var(--podcast-surface-deep), var(--color-neutral-900))'
            : 'var(--podcast-surface)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--podcast-on-surface-muted)',
          transition: 'width 200ms ease, height 200ms ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isVideo ? (
          <>
            <Video size={48} aria-hidden style={{ opacity: 0.7 }} />
            <span
              style={{
                position: 'absolute',
                bottom: 8,
                left: 10,
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--podcast-on-surface-strong)',
                opacity: 0.85,
                letterSpacing: '0.04em',
              }}
            >
              VIDEO PREVIEW
            </span>
          </>
        ) : (
          <Podcast size={56} aria-hidden style={{ opacity: 0.85 }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--podcast-fill)',
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--podcast-fill)',
            }}
          />
          {eyebrow}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.2,
            color: 'inherit',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.episodeTitle}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--color-neutral-300)',
          }}
        >
          {data.podcastTitle}
          {data.episodeNumber !== undefined ? ` · Episode ${data.episodeNumber}` : ''}
          {data.host ? ` · ${data.host}` : ''}
        </p>
        <span
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-neutral-800)',
            color: 'var(--podcast-on-surface-strong)',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          <span>{data.badge}</span>
          <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-neutral-600)' }} />
          <span>
            {data.creditHours} {data.creditHours === 1 ? 'Hour' : 'Hours'}
          </span>
          {data.creditStates.length > 0 && (
            <>
              <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-neutral-600)' }} />
              <span>{data.creditStates.join(', ')}</span>
            </>
          )}
        </span>

        <div style={{ position: 'relative', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-neutral-300)', minWidth: 40 }}>
              {formatTime(elapsedSec)}
            </span>
            <div
              role="progressbar"
              aria-label={`${data.episodeTitle} playback position`}
              aria-valuenow={Math.round(elapsedPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{
                position: 'relative',
                flex: 1,
                height: 4,
                background: 'var(--color-neutral-600)',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: '0 auto 0 0',
                  width: `${elapsedPct}%`,
                  background: 'var(--podcast-fill)',
                  borderRadius: 'var(--radius-pill)',
                }}
              />
              {checkpointPct !== null && (
                <button
                  type="button"
                  aria-label={checkpointReached ? 'Credit checkpoint reached' : 'Credit checkpoint'}
                  onMouseEnter={() => setCheckpointHover(true)}
                  onMouseLeave={() => setCheckpointHover(false)}
                  onFocus={() => setCheckpointHover(true)}
                  onBlur={() => setCheckpointHover(false)}
                  style={{
                    position: 'absolute',
                    left: checkpointReached
                      ? `calc(${checkpointPct}% - 9px)`
                      : `calc(${checkpointPct}% - 2px)`,
                    top: checkpointReached ? -7 : -6,
                    width: checkpointReached ? 18 : 4,
                    height: checkpointReached ? 18 : 16,
                    padding: 0,
                    background: checkpointReached ? 'transparent' : 'var(--podcast-fill)',
                    color: 'var(--color-success-500)',
                    border: 'none',
                    borderRadius: checkpointReached ? 0 : 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {checkpointReached && <CircleCheck size={18} aria-hidden />}
                </button>
              )}
              {checkpointHover && checkpointPct !== null && (
                <span
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    left: `calc(${checkpointPct}% - 50px)`,
                    top: -28,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-neutral-900)',
                    color: 'var(--color-text-inverse)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                  }}
                >
                  Credit checkpoint
                </span>
              )}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--color-neutral-300)', minWidth: 50, textAlign: 'right' }}>
              {formatTime(data.totalSec)}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 12,
          flexShrink: 0,
          alignSelf: 'stretch',
          paddingTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <PlayerIconButton label="Rewind 15 seconds" onClick={onRewind}>
            <RewindIcon />
          </PlayerIconButton>
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={onPlayPause}
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-text-inverse)',
              color: 'var(--color-neutral-800)',
              border: 'none',
              cursor: onPlayPause ? 'pointer' : 'default',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgb(0 0 0 / 0.25)',
            }}
          >
            {isPlaying ? <PauseBars /> : <PlayTriangle />}
          </button>
          <PlayerIconButton label="Forward 30 seconds" onClick={onForward}>
            <ForwardIcon />
          </PlayerIconButton>
          <PlayerIconButton label="Save to favorites" onClick={onFavorite}>
            <Heart size={20} aria-hidden />
          </PlayerIconButton>
        </div>
        {!hideVideoToggle && (
          <button
            type="button"
            onClick={() => setIsVideo((v) => !v)}
            aria-pressed={isVideo}
            style={{
              marginTop: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              border: '1px solid var(--color-cta-100)',
              color: 'var(--color-cta-100)',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isVideo ? <Podcast size={14} aria-hidden /> : <Video size={14} aria-hidden />}
            {isVideo ? 'Switch to Audio' : 'Switch to Video'}
          </button>
        )}
      </div>
    </section>
  )
}

function PlayerIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        borderRadius: 'var(--radius-pill)',
        background: 'transparent',
        color: 'var(--color-text-inverse)',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.85,
      }}
    >
      {children}
    </button>
  )
}

function RewindIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M3 12a9 9 0 1 0 3.5-7.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ForwardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
      <path
        d="M21 12a9 9 0 1 1-3.5-7.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PlayTriangle() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden focusable="false" style={{ marginLeft: 2 }}>
      <path d="M1 1 L11 7 L1 13 Z" fill="currentColor" />
    </svg>
  )
}

function PauseBars() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden focusable="false">
      <rect x="1" y="1" width="3" height="12" fill="currentColor" rx="1" />
      <rect x="8" y="1" width="3" height="12" fill="currentColor" rx="1" />
    </svg>
  )
}

export function formatTime(totalSec: number): string {
  const safe = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
