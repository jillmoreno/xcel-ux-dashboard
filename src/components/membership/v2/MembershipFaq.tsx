import { Block, SectionHead, Wrap } from './passportShared'

/** FAQ accordion (non-member view) — native <details> like the prototype. */
const FAQS: { q: string; a: string; open?: boolean }[] = [
  {
    q: "What's the difference between Passport and Passport Lite?",
    a: 'Passport Lite includes nursing podcasts and community access. Passport adds the full video skills library, pharmacology and specialty bundles, certification exam prep, and the Rubi AI career toolkit.',
    open: true,
  },
  {
    q: 'Is everything included as soon as I join?',
    a: 'Yes — there\'s no waitlist or add-on pricing. Every product in your plan is available the moment you join, included at no extra cost. The only difference is which plan you pick: Passport Lite vs. the full Passport.',
  },
  {
    q: 'Is the CE accredited?',
    a: 'Yes. Elite Learning is an ANCC-accredited provider, and Passport CE is accepted across all 50 states.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes — membership is month-to-month and you can cancel anytime from your account settings.',
  },
] as const

export function MembershipFaq() {
  return (
    <Block id="faq" alt>
      <Wrap>
        <SectionHead eyebrow="Good to know" title="Frequently asked questions" />
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'grid', gap: 14 }}>
          {FAQS.map((f) => (
            <details
              key={f.q}
              open={f.open}
              style={{
                background: 'var(--color-surface-card)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 22px',
              }}
            >
              <summary
                className="cre-passport-faq-summary"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: 16,
                  color: 'var(--color-primary-800)',
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                {f.q}
              </summary>
              <p style={{ margin: '14px 0 0', fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--color-text-secondary)' }}>
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Wrap>
    </Block>
  )
}
