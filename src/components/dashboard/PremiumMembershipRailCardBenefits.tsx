import { useNavigate } from 'react-router-dom'
import { Check } from '@/icons'

/**
 * Premium Membership rail card — benefit-list variant. Info-dense
 * layout: tier eyebrow + headline at the top, four concrete value
 * props as a checkmark list in the middle, filled CTA at the bottom.
 * Designed to be scannable for learners weighing whether to join —
 * they can see what they get without clicking through.
 *
 * Rendered by `DashboardV3` for non-member accounts directly under
 * `<RubiTutorWidget>`. Fills the 320px right rail.
 */
type Benefit = {
  label: string
}

const BENEFITS: Benefit[] = [
  { label: 'Unlimited CE courses' },
  { label: 'Rubi AI Tutor 24/7' },
  { label: 'Member-only savings' },
  { label: 'Priority support' },
]

type Props = {
  tier?: string
  /** Optional headline shown under the eyebrow. Falls back to a generic
   *  value-prop line if omitted. */
  headline?: string
  ctaLabel?: string
  ctaHref?: string
}

export function PremiumMembershipRailCardBenefits({
  tier = 'Plus Membership',
  headline = 'Everything you need to renew, advance, and stay ahead.',
  ctaLabel = 'Become a Member',
  ctaHref = '/membership/plans',
}: Props) {
  const navigate = useNavigate()

  return (
    <article
      aria-label={tier}
      style={{
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        // Asymmetric corners — same family as the gradient variant and
        // the rest of the platform's Membership / Package cards so the
        // card still reads as part of the "premium" surface family.
        borderRadius: '24px 0 24px 0',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Slim accent strip — a single line of brand teal at the top
          edge that pays for the dropped gradient header without
          dominating the card. Sits flush against the asymmetric
          top-left corner. */}
      <div
        aria-hidden
        style={{
          height: 4,
          background:
            'linear-gradient(90deg, var(--color-primary-600) 0%, var(--color-tertiary-600) 100%)',
        }}
      />

      <div
        style={{
          padding: '20px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-primary-700)',
            }}
          >
            Membership
          </span>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 22,
              lineHeight: '28px',
              color: 'var(--color-text-primary)',
            }}
          >
            {tier}
          </h3>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: '20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {headline}
          </p>
        </div>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {BENEFITS.map((b) => (
            <li
              key={b.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 22,
                  height: 22,
                  flexShrink: 0,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-primary-100)',
                  color: 'var(--color-primary-700)',
                }}
              >
                <Check size={12} />
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: '20px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {b.label}
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => navigate(ctaHref)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 40,
            padding: '8px 16px',
            marginTop: 4,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-600)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 600,
            lineHeight: '24px',
            cursor: 'pointer',
            transition: 'background-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-primary-700)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-primary-600)'
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  )
}
