import type { ComponentType, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheckThin, CrownThin, LibraryThin } from '@/icons'

type IconCmp = ComponentType<{ size?: number; style?: React.CSSProperties }>

type Benefit = {
  label: ReactNode
  Icon?: IconCmp
  /** Custom SVG to render instead of an icon component (used for brand marks). */
  render?: () => ReactNode
}

const BENEFITS: Benefit[] = [
  { label: <>Learning<br />Library</>, Icon: LibraryThin },
  { label: <>VIP<br />Deals</>, Icon: BadgeCheckThin },
  { label: <>Facebook<br />Community</>, render: () => <FacebookMark /> },
]

type Props = {
  /** Eyebrow line under the title, e.g. "North Carolina Appraisal Qualifying Education". */
  contextLabel?: string
  ctaHref?: string
}

export function PremiumMembershipCard({
  contextLabel = 'California Appraisal Qualifying Education',
  ctaHref = '/membership/plans',
}: Props) {
  const navigate = useNavigate()

  return (
    <article
      style={{
        background: 'var(--color-surface-card)',
        border: '2px solid var(--color-neutral-200)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          position: 'relative',
          padding: '20px 20px 22px',
          background:
            'linear-gradient(184deg, var(--color-warning-500) 13%, var(--color-warning-700) 75%)',
          color: 'var(--color-text-inverse)',
          overflow: 'hidden',
        }}
      >
        <CrownThin
          size={92}
          style={{
            position: 'absolute',
            right: -10,
            top: -8,
            color: 'var(--color-primary-100)',
            opacity: 0.35,
            pointerEvents: 'none',
          }}
        />
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1,
            color: 'inherit',
          }}
        >
          Premium Membership
        </h3>
        {contextLabel && (
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              lineHeight: '20px',
              color: 'inherit',
              maxWidth: '78%',
            }}
          >
            {contextLabel}
          </p>
        )}
      </header>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 12,
            lineHeight: '18px',
            color: 'var(--color-neutral-700)',
          }}
        >
          Your Member Benefits:
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {BENEFITS.map((b, i) => (
            <BenefitTile key={i} benefit={b} />
          ))}
        </div>
      </div>

      <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '24px',
            color: 'var(--color-neutral-800)',
          }}
        >
          Upgrade anytime to unlock more features.
        </p>
        <button
          type="button"
          onClick={() => navigate(ctaHref)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-action)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-action-hover)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-action)'
          }}
        >
          Upgrade to Premium Membership
        </button>
      </div>
    </article>
  )
}

function BenefitTile({ benefit }: { benefit: Benefit }) {
  const { Icon, render, label } = benefit
  return (
    <div
      style={{
        height: 110,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-neutral-light)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 6px',
        color: 'var(--color-action)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 36 }}>
        {Icon ? <Icon size={32} /> : render?.()}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: '18px',
          color: 'var(--color-action)',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function FacebookMark() {
  // Inline SVG of the Facebook brand mark — FA Pro 7's Light/Thin sets don't
  // include brand glyphs, so we draw it here. Uses currentColor for theming.
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path
        d="M13.5 8.5h1.7V6.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4v2.1H6.5v2.7h2.3V22h2.7v-7.2h2.2l.4-2.7h-2.6v-1.8c0-.8.2-1.4 1.2-1.4z"
        fill="var(--color-surface-card)"
      />
    </svg>
  )
}
