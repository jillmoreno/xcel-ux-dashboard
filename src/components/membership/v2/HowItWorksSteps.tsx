import { Block, SectionHead, Wrap } from './passportShared'

/** "How FHEA Passport works" — 4-step explainer (non-member view). */
const STEPS = [
  {
    title: 'Choose your plan',
    body: 'Pick Passport for the full library and tools, or Passport Lite for podcasts and essentials.',
  },
  {
    title: 'Learn anywhere',
    body: 'Stream the video skills library, pharmacology courses, and in-depth specialty bundles.',
  },
  {
    title: 'Track your CE & certs',
    body: 'Log credits automatically and prep for specialty certification exams in one place.',
  },
  {
    title: 'Advance your career',
    body: 'Use the Rubi AI toolkit to practice interviews, build your resume, and map your next role.',
  },
] as const

export function HowItWorksSteps() {
  return (
    <Block id="how">
      <Wrap>
        <SectionHead
          eyebrow="Getting started is easy"
          title="How FHEA Passport works"
          blurb="Four steps from sign-up to a smarter, more credentialed nursing career."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 22 }}>
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              style={{
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 26,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--color-secondary-100)',
                  color: 'var(--color-secondary-700)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 17,
                  marginBottom: 16,
                }}
              >
                {i + 1}
              </div>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  color: 'var(--color-primary-800)',
                }}
              >
                {step.title}
              </h3>
              <p style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-secondary)' }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Wrap>
    </Block>
  )
}
