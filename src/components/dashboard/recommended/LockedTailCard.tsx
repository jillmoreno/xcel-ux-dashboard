import { Link } from 'react-router-dom'
import { Gem } from '@/icons'

type Props = {
  /** Number of items the non-member can't see. Surfaced in the title. */
  hiddenCount: number
}

/**
 * Tail card pinned to the end of each standard recommended shelf for
 * non-member accounts. Matches the new `SimpleCard` rhythm — full-square
 * tile, primary-tinted bar at the bottom holding the title, type icon
 * top-left — so the upsell reads as a sibling of the surrounding content
 * cards. Body uses the soft primary tint (no image) so it stands apart
 * from the image-backed siblings without looking like a different UI
 * species.
 */
export function LockedTailCard({ hiddenCount }: Props) {
  return (
    <Link
      to="/membership/plans"
      aria-label={`Unlock ${hiddenCount} more with Premium`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      onMouseEnter={(e) => {
        const inner = e.currentTarget.querySelector<HTMLElement>('.cre-locked-tail-block')
        if (!inner) return
        inner.style.boxShadow = '0 6px 18px rgb(0 0 0 / 0.16)'
        inner.style.transform = 'scale(1.005)'
      }}
      onMouseLeave={(e) => {
        const inner = e.currentTarget.querySelector<HTMLElement>('.cre-locked-tail-block')
        if (!inner) return
        inner.style.boxShadow = 'none'
        inner.style.transform = 'none'
      }}
    >
      <div
        className="cre-locked-tail-block"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1',
          borderRadius: 'var(--radius-lg)',
          background: 'color-mix(in srgb, var(--color-primary-500) 12%, white)',
          border: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
          transition: 'transform 160ms ease, box-shadow 160ms ease',
        }}
      >
        {/* Top-left gem icon — same shape + position as a content card's
            type icon so the column reads consistently. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-tertiary-600)',
            color: 'var(--color-neutral-50)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <Gem size={14} />
        </span>

        {/* Centered gem badge as a placeholder for the missing image. */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -60%)',
            width: '46%',
            aspectRatio: '1 / 1',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-tertiary-600)',
            color: 'var(--color-neutral-50)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgb(0 0 0 / 0.12)',
          }}
        >
          <Gem size={32} aria-hidden />
        </span>

        {/* Primary title bar at the bottom — same shape + color as the
            sibling content cards. `minHeight: 40` matches `SimpleCard`'s
            single-vs-two-line alignment. */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--color-primary-700)',
            padding: '4px 12px',
            minHeight: 40,
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          <h4
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
            Unlock {hiddenCount} more
          </h4>
        </div>
      </div>
    </Link>
  )
}
