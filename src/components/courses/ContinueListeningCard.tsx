import { Podcast } from '@/icons'
import type { ContinueListeningEntry } from '@/data/podcastFixtures'

type ListenStatus = 'in-progress' | 'not-started' | 'completed'

/**
 * Card variant for an episode/podcast the learner has saved to their playlist
 * or queue.
 *
 * Visual parity with `PodcastCard` (asymmetric tile-header + faded Podcast
 * icon) but driven by `ContinueListeningEntry` data: episode number,
 * mandatory/state metadata, and a status-toned progress bar. The tile-header
 * tint, progress bar palette, and status label all swap together based on
 * `myStatus` so the card reads the same as the My Podcasts Playlist table:
 *
 *   in-progress → tertiary teal + "XX%"
 *   not-started → neutral gray + "Not Started"
 *   completed   → primary green + "Complete"
 *
 * Used on both the My Podcasts > Continue Listening tab and the Dashboard's
 * Continue Listening > My Playlist list.
 */
export function ContinueListeningCard({ data }: { data: ContinueListeningEntry }) {
  const status: ListenStatus = data.myStatus ?? 'in-progress'
  const progress = Math.max(0, Math.min(100, Math.round(data.progressPct)))
  const palette = paletteFor(status)
  const statusLabel =
    status === 'completed' ? 'Complete' : status === 'not-started' ? 'Not Started' : 'In Progress'

  return (
    <article
      className={`cre-card cre-course-card cre-card-asym`}
      style={{
        cursor: 'pointer',
      }}
    >
      <div
        className={`cre-tile-header ${palette.tileClass}`}
        style={{
          position: 'relative',
          minHeight: 100,
          padding: 16,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            margin: 0,
            maxWidth: '70%',
            position: 'relative',
            zIndex: 1,
            color: 'var(--color-text-inverse)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.episodeTitle}
        </h3>
        <Podcast
          size={140}
          aria-hidden
          style={{
            position: 'absolute',
            top: -8,
            right: -16,
            color: 'var(--color-text-inverse)',
            opacity: 0.18,
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '14px 16px 8px', gap: 6 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <Podcast size={14} aria-hidden />
          Podcast
        </span>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--color-text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.episodeNumber !== undefined
            ? `Ep. ${data.episodeNumber} · ${formatHrMin(data.durationHr)}`
            : formatHrMin(data.durationHr)}
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span>{data.badge === 'mandatory' ? 'Mandatory' : 'Elective'}</span>
          <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
          <span>
            {data.durationHr} {data.durationHr === 1 ? 'Hour' : 'Hours'}
          </span>
          <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
          <span>{data.state}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 16px 16px', marginTop: 'auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              color:
                status === 'not-started' ? 'var(--color-text-primary)' : palette.labelColor,
            }}
          >
            {statusLabel}
          </span>
          <span>
            {status === 'completed' ? 100 : status === 'not-started' ? 0 : progress}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={`${data.episodeTitle} progress`}
          aria-valuenow={status === 'completed' ? 100 : status === 'not-started' ? 0 : progress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            position: 'relative',
            height: 6,
            background: palette.trackColor,
            borderRadius: 'var(--radius-pill)',
            overflow: 'hidden',
          }}
        >
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: '0 auto 0 0',
              width: `${status === 'completed' ? 100 : status === 'not-started' ? 0 : progress}%`,
              background: palette.fillColor,
              borderRadius: 'var(--radius-pill)',
            }}
          />
        </div>
      </div>
    </article>
  )
}

function paletteFor(_status: ListenStatus): {
  tileClass: string
  fillColor: string
  trackColor: string
  labelColor: string
} {
  // Podcasts use the brand's tertiary ramp universally per the style guide —
  // the same palette across all listen states. Status is differentiated by
  // the label and progress bar fill amount, not by hue swap.
  return {
    tileClass: 'cre-tile-header--podcast',
    fillColor: 'var(--podcast-fill)',
    trackColor: 'var(--color-neutral-200)',
    labelColor: 'var(--podcast-accent)',
  }
}

function formatHrMin(h: number): string {
  const totalMin = Math.round(h * 60)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}
