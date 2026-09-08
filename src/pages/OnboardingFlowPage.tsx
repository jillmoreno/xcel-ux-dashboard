import { useEffect, useRef, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useLearningSetup } from '@/context/LearningSetupContext'
import { LearningSetupHero } from '@/components/onboarding/LearningSetupHero'
import { OnboardingDemoBar } from '@/components/onboarding/OnboardingDemoBar'
import { useDemoControlsVisibility } from '@/components/prototype/demoControlsVisibility'

/**
 * Standalone "Onboarding Flow" experience (`/onboarding-flow`) — the new-user
 * learning-setup wizard, extracted from the Dashboard Discoverability project
 * into its own explorable section.
 *
 * Works across all four brands (CRE · McKissock · Elite · STC) with the
 * `OnboardingDemoBar` on top to switch brand, education type (QE / CE), the
 * goal-step variant (ask / skip), and single ⇄ multiple licenses / states.
 *
 * The wizard restarts whenever any of those demo axes change (so a context
 * switch starts a clean flow), and finishing the wizard hands the learner off
 * to the populated Dashboard Rebrand — preserving the wizard's picks via the
 * shared `LearningSetupProvider` (lifted to AppLayout).
 */
export function OnboardingFlowPage() {
  const { brand } = useAccount()
  const navigate = useNavigate()
  const { restart, completed } = useLearningSetup()
  // Show/hide the demo bar via the shared PrototypeBar "Demo" toggle.
  const { open: demoOpen } = useDemoControlsVisibility()

  // The demo axes — restart the wizard when any of them changes so a brand /
  // education-type / flow switch always begins from step 1 with fresh content.
  const eduType = useFeatureFlag('onboarding-education-type').variant
  const flow = useFeatureFlag('dashboard-setup-variant').variant
  const licenseCount = useFeatureFlag('onboarding-license-count').variant
  const stateCount = useFeatureFlag('onboarding-state-count').variant

  useEffect(() => {
    restart()
    // Restart on entry + whenever a demo axis changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, eduType, flow, licenseCount, stateCount])

  // Hand off to the populated dashboard once the wizard finishes. The shared
  // provider carries `setup.completed` + `setup.data` across the navigation, so
  // the Current Learning Path reflects what the learner just entered (Elite).
  // Non-Elite brands keep their own brand context via `?brand=`.
  //
  // `armed` guards against a stale `completed = true` carried in by the shared
  // provider (e.g. returning here after a prior completion): we only navigate
  // for a completion that transitions AFTER the page has shown a fresh,
  // not-completed wizard — never on the very first render.
  const armed = useRef(false)
  const handedOff = useRef(false)
  useEffect(() => {
    if (!completed) {
      armed.current = true
      return
    }
    if (!armed.current || handedOff.current) return
    handedOff.current = true
    // Land squarely in the populated MEMBER dashboard for the brand the learner
    // onboarded in. `?membership=member` + `?brand=` are honored by
    // DashboardRebrandPage's one-shot seed, so every brand shows its populated
    // Current Learning Path (persona) rather than a non-member / mismatched view.
    const to =
      brand === 'elite'
        ? '/dashboard-rebrand?membership=member'
        : `/dashboard-rebrand?brand=${brand}&membership=member`
    navigate(to)
  }, [completed, brand, navigate])

  return (
    <div style={PAGE}>
      <OnboardingDemoBar open={demoOpen} />
      <div style={BODY}>
        <div style={{ width: '100%', maxWidth: 820 }}>
          <LearningSetupHero standalone />
        </div>
      </div>
    </div>
  )
}

const PAGE: CSSProperties = {
  minHeight: 'calc(100vh - 64px)',
  background: 'var(--color-surface-page)',
}

const BODY: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '32px 24px 56px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 24,
}
