import { type CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import { useLearningSetup } from '@/context/LearningSetupContext'
import { onboardingBrandName } from '@/data/onboarding/onboardingContent'
import { LearningSetupWizard } from './LearningSetupWizard'
import { useSetupFlow } from './setupFlow'

/**
 * Full-width learning-setup hero (Figma exploration
 * `onboarding-home-hero-inline.html`) — the new-user top region of the Dashboard
 * Rebrand. A two-panel band: a compact brand-gradient left panel with the step
 * checklist, and the active wizard step on the right. Skipping collapses it to
 * the slim resume band (rendered separately by the caller).
 */

export function LearningSetupHero({ standalone = false }: { standalone?: boolean } = {}) {
  const { brand } = useAccount()
  const setup = useLearningSetup()
  const device = useDeviceFrame().device
  const narrow = device === 'mobile' || device === 'tablet'
  const brandName = onboardingBrandName(brand)
  const { steps } = useSetupFlow()
  // Building step (step >= steps.length) marks every checklist item done.
  const current = setup.step

  return (
    <section
      aria-label="Set up your learning experience"
      style={{
        display: 'grid',
        gridTemplateColumns: narrow ? 'minmax(0, 1fr)' : '300px 1fr',
        // In the standalone onboarding gate, match the card stroke to the gray
        // scrim behind it (OnboardingGate's overlay) so the edge blends in
        // instead of reading as a lighter hairline.
        border: `1px solid ${standalone ? 'color-mix(in srgb, var(--color-primary-900) 40%, transparent)' : 'var(--color-border-subtle)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-primary-900) 55%, transparent)',
        background: 'var(--color-surface-card)',
        minHeight: 452,
        // In the mobile shell the band bleeds the 16px content gutter; as a
        // standalone onboarding page (its own centered card) keep the radius +
        // no negative margins.
        ...(device === 'mobile' && !standalone ? { marginLeft: -16, marginRight: -16, borderRadius: 0 } : null),
      }}
    >
      {/* ── Left · brand gradient + step checklist ── */}
      {!narrow && (
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            color: 'var(--color-text-inverse)',
            background:
              'linear-gradient(160deg, var(--color-primary-800) 0%, var(--color-primary-600) 70%, var(--color-primary-500))',
            padding: '30px 28px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* decorative glow + heartbeat watermark */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: -70,
              top: -70,
              width: 230,
              height: 230,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgb(255 255 255 / 0.22), transparent 70%)',
            }}
          />
          <span
            aria-hidden
            style={{
              position: 'absolute',
              right: -30,
              bottom: 24,
              width: 200,
              opacity: 0.14,
              color: 'var(--color-text-inverse)',
            }}
          >
            <HeartbeatMark />
          </span>

          <p style={eyebrow}>Welcome to {brandName}</p>
          <h2 style={heroHeading}>Let&apos;s set up your learning experience</h2>
          <p style={heroSub}>
            A few quick taps and we&apos;ll build your path, track your renewal, and recommend what&apos;s next.
          </p>

          <ol style={checklist}>
            {steps.map((s, i) => {
              const state = i < current ? 'done' : i === current ? 'active' : 'pending'
              return (
                <li
                  key={s.k}
                  aria-current={state === 'active' ? 'step' : undefined}
                  style={{
                    display: 'flex',
                    gap: 11,
                    alignItems: 'center',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: state === 'active' ? 800 : 600,
                    color: state === 'pending' ? 'rgb(255 255 255 / 0.6)' : 'var(--color-text-inverse)',
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 23,
                      height: 23,
                      borderRadius: '50%',
                      flex: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 11,
                      color: 'var(--color-text-inverse)',
                      background:
                        state === 'done'
                          ? 'var(--color-secondary-500)'
                          : state === 'active'
                            ? 'var(--color-cta-500)'
                            : 'rgb(255 255 255 / 0.14)',
                    }}
                  >
                    {state === 'done' ? '✓' : i + 1}
                  </span>
                  {s.label}
                  <span className="cre-visually-hidden">
                    {state === 'done' ? ' — completed' : state === 'active' ? ' — current step' : ' — not started'}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* ── Right · active wizard step ── */}
      <div style={{ padding: '30px 34px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <LearningSetupWizard />
      </div>
    </section>
  )
}

function HeartbeatMark() {
  return (
    <svg viewBox="0 0 240 70" width="100%" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
      <path d="M0 35h48l12-22 16 44 15-34 10 16 12-4h110" />
    </svg>
  )
}

const eyebrow: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-secondary-300)',
}
const heroHeading: CSSProperties = {
  position: 'relative',
  margin: '10px 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 800,
  lineHeight: 1.18,
  maxWidth: '13ch',
  color: 'var(--color-text-inverse)',
}
const heroSub: CSSProperties = {
  position: 'relative',
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'rgb(255 255 255 / 0.82)',
}
const checklist: CSSProperties = {
  position: 'relative',
  listStyle: 'none',
  margin: '26px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}
