import { Block, PassportButton, Wrap } from './passportShared'

/** Closing full-width join CTA (non-member view). */
export function FinalJoinCta() {
  return (
    <Block>
      <Wrap>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-secondary-700))',
            color: 'var(--color-text-inverse)',
            textAlign: 'center',
            borderRadius: 'var(--radius-xl)',
            padding: '56px 32px',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: 'inherit' }}>
            Your whole nursing career, one Passport.
          </h2>
          <p
            style={{
              margin: '14px auto 26px',
              fontFamily: 'var(--font-body)',
              fontSize: 17,
              color: 'rgb(255 255 255 / 0.9)',
              maxWidth: '50ch',
            }}
          >
            Join thousands of nurses learning, getting credentialed, and growing with Elite Learning.
          </p>
          <PassportButton variant="light">Join FHEA Passport</PassportButton>
        </div>
      </Wrap>
    </Block>
  )
}
