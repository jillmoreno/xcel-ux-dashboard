import { useAccount, type Brand } from '@/context/AccountContext'
import { useFeatureFlag, useFeatureFlags } from '@/context/FeatureFlagContext'
import { DemoBar, DemoDropdown, DemoMenuRow } from '@/components/prototype/DemoBar'
import { useDemoMenus } from '@/components/prototype/demoBarUtil'
import {
  defaultEducationType,
  educationTypesFor,
  type EducationType,
} from '@/data/onboarding/onboardingContent'

/**
 * Stakeholder demo controls for the standalone Onboarding Flow (`/onboarding-flow`).
 *
 * A friendly, always-visible bar (sibling of the Dashboard Rebrand's
 * `DemoControlsBar`) that lets a reviewer drive the onboarding wizard across
 * every axis the feature supports — WITHOUT opening the robot menu:
 *   • Brand         → `useAccount().setBrand` (CRE / McKissock / Elite / STC)
 *   • Education      → `onboarding-education-type` (QE / CE), brand-labeled
 *   • Goal step      → `dashboard-setup-variant` (Ask goal · pills · Skip goal)
 *   • Licenses       → `onboarding-license-count` (single / multiple)
 *   • States         → `onboarding-state-count` (single / multiple)
 *
 * Built from the shared demo-bar primitives (`DemoBar` / `DemoDropdown` /
 * `DemoMenuRow` + `useDemoMenus`) so it matches the Dashboard Rebrand bar — see
 * the `create-demo-bar` skill. Every control writes the SAME feature-flag /
 * account state the Feature Flag panel drives, so the two never diverge.
 * Changing brand also resets the education type to that brand's default
 * (STC → Exam Prep, others → CE).
 *
 * Shown/hidden by the PrototypeBar "Demo" toggle via the shared
 * `useDemoControlsVisibility` store (the `open` prop); returns null when hidden.
 */

/** NOT type-checked against `Brand` being exhaustive — a new brand must be
 *  added here by hand. Fitzgerald was missing until 2026-09-04, so the
 *  onboarding demo bar could not reach it at all. */
const BRANDS: { brand: Brand; label: string }[] = [
  { brand: 'cre', label: 'Real Estate' },
  { brand: 'mckissock', label: 'McKissock' },
  { brand: 'elite', label: 'Elite (Health)' },
  { brand: 'stc', label: 'STC (FinServ)' },
  { brand: 'fitzgerald', label: 'Fitzgerald' },
  { brand: 'xcel', label: 'XCEL (Insurance)' },
]

const GOAL_OPTIONS = [
  { value: 'default', label: 'Ask · tiles' },
  { value: 'interest-pills', label: 'Ask · pills' },
  { value: 'renew-known', label: 'Skip goal' },
]

const COUNT_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'multiple', label: 'Multiple' },
]

export function OnboardingDemoBar({ open = true }: { open?: boolean }) {
  const { brand, setBrand } = useAccount()
  const { setEnabled, setVariant } = useFeatureFlags()
  const { openId, toggle, close, barRef } = useDemoMenus()

  const eduType = (useFeatureFlag('onboarding-education-type').variant ??
    defaultEducationType(brand)) as EducationType
  const flow = useFeatureFlag('dashboard-setup-variant').variant ?? 'default'
  const licenseCount = useFeatureFlag('onboarding-license-count').variant ?? 'single'
  const stateCount = useFeatureFlag('onboarding-state-count').variant ?? 'single'

  const eduOptions = educationTypesFor(brand)

  const pickBrand = (b: Brand) => {
    setBrand(b)
    // Reset the education type to the new brand's default so the QE/CE control
    // + wizard content stay coherent after a brand switch.
    setVariant('onboarding-education-type', defaultEducationType(b))
    close()
  }

  const setVariantAndClose = (key: string, value: string) => {
    setVariant(key, value)
    close()
  }

  const setCount = (key: string, value: string) => {
    setEnabled(key, true)
    setVariant(key, value)
    close()
  }

  const brandLabel = BRANDS.find((b) => b.brand === brand)?.label ?? 'Brand'
  const eduLabel = eduOptions.find((e) => e.type === eduType)?.label ?? 'Education'
  const goalLabel = GOAL_OPTIONS.find((g) => g.value === flow)?.label ?? 'Goal'
  const licLabel = COUNT_OPTIONS.find((c) => c.value === licenseCount)?.label ?? 'Single'
  const stateLabel = COUNT_OPTIONS.find((c) => c.value === stateCount)?.label ?? 'Single'

  // Hidden by the PrototypeBar "Demo" toggle (all hooks above have run).
  if (!open) return null

  return (
    <DemoBar barRef={barRef} className="cre-onboarding-demo" ariaLabel="Onboarding demo controls">
      <DemoDropdown
        id="brand"
        eyebrow="Brand"
        label={brandLabel}
        openId={openId}
        onToggle={toggle}
        panelRole="radiogroup"
        panelLabel="Brand"
      >
        {BRANDS.map((b) => (
          <DemoMenuRow key={b.brand} label={b.label} active={b.brand === brand} onSelect={() => pickBrand(b.brand)} />
        ))}
      </DemoDropdown>

      <DemoDropdown
        id="education"
        eyebrow="Education"
        label={eduLabel}
        openId={openId}
        onToggle={toggle}
        panelRole="radiogroup"
        panelLabel="Education type"
      >
        {eduOptions.map((e) => (
          <DemoMenuRow
            key={e.type}
            label={e.label}
            active={e.type === eduType}
            onSelect={() => setVariantAndClose('onboarding-education-type', e.type)}
          />
        ))}
      </DemoDropdown>

      <DemoDropdown
        id="goal"
        eyebrow="Goal step"
        label={goalLabel}
        openId={openId}
        onToggle={toggle}
        panelRole="radiogroup"
        panelLabel="Goal step / flow"
      >
        {GOAL_OPTIONS.map((g) => (
          <DemoMenuRow
            key={g.value}
            label={g.label}
            active={g.value === flow}
            onSelect={() => setVariantAndClose('dashboard-setup-variant', g.value)}
          />
        ))}
      </DemoDropdown>

      <DemoDropdown
        id="licenses"
        eyebrow="Licenses"
        label={licLabel}
        openId={openId}
        onToggle={toggle}
        panelRole="radiogroup"
        panelLabel="Number of licenses"
      >
        {COUNT_OPTIONS.map((c) => (
          <DemoMenuRow
            key={c.value}
            label={c.label}
            active={c.value === licenseCount}
            onSelect={() => setCount('onboarding-license-count', c.value)}
          />
        ))}
      </DemoDropdown>

      <DemoDropdown
        id="states"
        eyebrow="States"
        label={stateLabel}
        openId={openId}
        onToggle={toggle}
        panelRole="radiogroup"
        panelLabel="Number of states"
      >
        {COUNT_OPTIONS.map((c) => (
          <DemoMenuRow
            key={c.value}
            label={c.label}
            active={c.value === stateCount}
            onSelect={() => setCount('onboarding-state-count', c.value)}
          />
        ))}
      </DemoDropdown>
    </DemoBar>
  )
}
