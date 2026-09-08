import { Flag, FileText, Robot } from '@/icons'
import { Block, Wrap } from './passportShared'

/**
 * "Powered by Rubi AI" feature band — the 3 AI career tools highlighted
 * in a CTA-gradient panel (non-member view).
 */
const RUBI_ITEMS = [
  { Icon: Robot, title: 'Nursing interview practice simulation', sub: 'Realistic reps with instant feedback' },
  { Icon: FileText, title: 'Nurse resume builder', sub: 'From experience to interview-ready' },
  { Icon: Flag, title: 'Career paths planning tool', sub: 'Map roles and the credentials to reach them' },
] as const

export function RubiAiBand() {
  return (
    <Block>
      <Wrap>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-cta-700), var(--color-cta-500))',
            color: 'var(--color-text-inverse)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 40,
              alignItems: 'center',
              padding: 46,
            }}
          >
            <div>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgb(255 255 255 / 0.18)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '5px 13px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Powered by Rubi AI
              </span>
              <h2
                style={{
                  margin: '16px 0 0',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: '-0.01em',
                  color: 'inherit',
                }}
              >
                A career coach built into your membership.
              </h2>
              <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgb(255 255 255 / 0.9)' }}>
                Rubi AI is the part of Passport that works on you — not just your credit hours.
                Practice high-stakes interviews, sharpen your resume, and plan your next move.
              </p>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {RUBI_ITEMS.map(({ Icon, title, sub }) => (
                <li key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: 'var(--font-body)', fontSize: 15 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 30,
                      height: 30,
                      flex: 'none',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgb(255 255 255 / 0.18)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <div>
                    <b style={{ fontFamily: 'var(--font-heading)' }}>{title}</b>
                    <br />
                    <span style={{ color: 'rgb(255 255 255 / 0.8)', fontSize: 14 }}>{sub}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Wrap>
    </Block>
  )
}
