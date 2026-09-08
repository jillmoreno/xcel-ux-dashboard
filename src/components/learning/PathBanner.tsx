import { MoreVertical } from '@/icons'
import { Fragment } from 'react'

export type PathBannerData = {
  title: string
  progressLabel: string
  /** 0–100. Drives the width of the inline progress bar in the banner. */
  progressPct: number
  pills: string[]
}

export function PathBanner({ data }: { data: PathBannerData }) {
  return (
    <section
      aria-label="Active learning path"
      style={{
        position: 'relative',
        background: 'var(--color-primary-600)',
        color: 'var(--color-text-inverse)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '12px 24px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 20,
              lineHeight: '28px',
              color: 'var(--color-text-inverse)',
              margin: 0,
            }}
          >
            {data.title}
          </h2>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-inverse)',
            }}
          >
            <span style={{ color: 'var(--color-primary-100)' }}>{data.progressLabel}</span>
            <BannerProgressBar value={data.progressPct} />
            {data.pills.map((pill, i) => (
              <Fragment key={`${pill}-${i}`}>
                <span aria-hidden style={{ width: 1, height: 14, background: 'rgb(255 255 255 / 0.4)' }} />
                <span>{pill}</span>
              </Fragment>
            ))}
          </div>
        </div>
        <button
          type="button"
          aria-label="Path actions"
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-pill)',
            background: 'rgb(255 255 255 / 0.10)',
            border: 'none',
            color: 'var(--color-text-inverse)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <MoreVertical size={16} aria-hidden />
        </button>
      </div>
    </section>
  )
}

/**
 * Thin pill-shaped progress bar that lives inside the PathBanner row,
 * sandwiched between the "X% Complete" label and the first metadata pill.
 * The filled portion uses a 30% mix of `--color-primary-500` against the
 * dark `--color-primary-600` banner background so the brand color comes
 * through as a soft tint rather than competing with the title text.
 */
function BannerProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))
  return (
    <span
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Learning path progress"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 140,
        height: 6,
        borderRadius: 'var(--radius-pill)',
        background: 'rgb(255 255 255 / 0.18)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: `${clamped}%`,
          background:
            'color-mix(in srgb, var(--color-primary-500) 30%, transparent)',
          borderRadius: 'var(--radius-pill)',
        }}
      />
    </span>
  )
}
