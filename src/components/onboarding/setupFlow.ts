import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  defaultEducationType,
  goalOptionsFor,
  type EducationType,
} from '@/data/onboarding/onboardingContent'
import { SETUP_STEPS } from './setupShared'

/**
 * Setup-wizard flow config for the standalone Onboarding Flow (`/onboarding-flow`).
 * Reads the onboarding-scoped feature flags and the active brand to derive the
 * ordered steps + variant behavior in one place, so both `LearningSetupHero` (the
 * step checklist) and `LearningSetupWizard` (the steps) stay in sync.
 *
 * Axes:
 *   - `dashboard-setup-variant`     — course-tile vs. pill Interests, and the
 *                                     skip-goal (renew-known) shape.
 *   - `onboarding-education-type`   — QE (qualifying / exam prep) vs CE (renewal).
 *   - `onboarding-license-count`    — single vs. multiple licenses.
 *   - `onboarding-state-count`      — single vs. multiple states.
 *   - `setup-goal-*`                — per-tile show/hide on the Goal step,
 *                                     mapped by slot (1–4) so it works for
 *                                     every brand + education type.
 */
export type InterestStyle = 'courses' | 'pills'

export type SetupFlow = {
  /** The ordered steps for this variant (Goal dropped when `skipGoal`). */
  steps: readonly { readonly k: string; readonly label: string }[]
  /** Skip the Goal step (renew is already known, or every goal option is off). */
  skipGoal: boolean
  /** Preset goal when the Goal step is skipped. */
  presetGoal?: string
  /** How the Interests step renders. */
  interestStyle: InterestStyle
  /** Goal-option ids enabled by their per-option flags (drives which tiles show
   *  on the Goal step). */
  goalIds: string[]
  /** Qualifying/Exam-prep vs. Continuing Education (drives brand content). */
  educationType: EducationType
  /** The learner holds more than one license/registration. */
  multiLicense: boolean
  /** The learner is licensed in more than one state. */
  multiState: boolean
}

/** The four per-option Goal-step flags, in TILE ORDER. Every brand + education
 *  type presents exactly four goal tiles, so each flag maps to a tile SLOT
 *  (1–4) rather than a specific goal id — turning flag N off hides the Nth goal
 *  tile for whatever brand/type is active. (Keys kept stable; the labels are
 *  brand-agnostic in the flag panel.) */
const GOAL_OPTION_FLAG_KEYS = [
  'setup-goal-renew',
  'setup-goal-certification',
  'setup-goal-ce',
  'setup-goal-explore',
] as const

export function useSetupFlow(): SetupFlow {
  const { brand } = useAccount()
  const variant = useFeatureFlag('dashboard-setup-variant').variant ?? 'default'
  const educationType = (useFeatureFlag('onboarding-education-type').variant ??
    defaultEducationType(brand)) as EducationType
  const multiLicense = useFeatureFlag('onboarding-license-count').variant === 'multiple'
  const multiState = useFeatureFlag('onboarding-state-count').variant === 'multiple'

  // One on/off flag per goal-tile SLOT (1–4), applied to whatever the active
  // brand + education type presents. Hooks are called unconditionally in a
  // fixed order (Rules of Hooks).
  const slot1On = useFeatureFlag(GOAL_OPTION_FLAG_KEYS[0]).enabled
  const slot2On = useFeatureFlag(GOAL_OPTION_FLAG_KEYS[1]).enabled
  const slot3On = useFeatureFlag(GOAL_OPTION_FLAG_KEYS[2]).enabled
  const slot4On = useFeatureFlag(GOAL_OPTION_FLAG_KEYS[3]).enabled

  // Base goal ids for the active brand + education type, then drop any slot
  // whose flag is off. Positional, so it works for every brand (a slot with no
  // flag — should a brand ever exceed four goals — defaults to shown).
  const slotEnabled = [slot1On, slot2On, slot3On, slot4On]
  const goalIds = goalOptionsFor(brand, educationType)
    .map((g) => g.id)
    .filter((_, i) => slotEnabled[i] ?? true)

  // Skip the Goal step when the renew variant already knows the goal, OR when
  // every goal option has been turned off (an empty step makes no sense).
  const skipGoal = variant === 'renew-known' || goalIds.length === 0
  const interestStyle: InterestStyle = variant === 'default' ? 'courses' : 'pills'
  const steps = skipGoal ? SETUP_STEPS.filter((s) => s.k !== 'goal') : SETUP_STEPS
  return {
    steps,
    skipGoal,
    // Only the renew variant presets a specific goal; skipping because all
    // options are off drops the step without assuming a goal.
    presetGoal: variant === 'renew-known' ? 'Renew my license' : undefined,
    interestStyle,
    goalIds,
    educationType,
    multiLicense,
    multiState,
  }
}
