import { Link } from 'react-router-dom'
import { ArrowRight } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { continueLearningFor } from '@/data/membership/passportProgressFixtures'
import { Wrap } from '../v2/passportShared'

/**
 * "Pick up where you left off" — resume cards for in-progress content.
 * Present, but deliberately secondary: it sits below the What's-New spine
 * and reads as a quiet utility row, not the headline. Member-only.
 */
export function ContinueRow() {
  const { brand } = useAccount()
  const items = continueLearningFor(brand)
  if (items.length === 0) return null

  return (
    <section style={{ padding: '40px 0 8px' }}>
      <Wrap>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.01em',
              color: 'var(--color-primary-800)',
            }}
          >
            Pick up where you left off
          </h2>
          <Link
            to="/my-learning/courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--color-accent-text)',
              textDecoration: 'none',
            }}
          >
            View all
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
            gap: 16,
          }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              to="/my-learning/courses"
              aria-label={`Resume ${item.title}`}
              style={{
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 18,
                boxShadow: 'var(--shadow-card)',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}
              >
                In progress · {item.ceHours}
              </span>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: 'var(--color-accent-text)',
                }}
              >
                {item.title}
              </h3>
              <div style={{ marginTop: 'auto' }}>
                <div
                  aria-hidden
                  style={{
                    height: 6,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-neutral-100)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${item.percent}%`,
                      height: '100%',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--color-secondary-500)',
                    }}
                  />
                </div>
                <span
                  style={{
                    display: 'block',
                    marginTop: 6,
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {item.percent}% complete
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Wrap>
    </section>
  )
}
