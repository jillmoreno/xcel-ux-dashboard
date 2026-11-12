import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { jurisdictionName } from '@/data/nyProducerRequirements'

/**
 * THE STATE'S LICENSING REQUIREMENTS PAGE ON XCEL — 2026-11-12 (Afsana).
 *
 * Home's Quick Links trade Exam Information, Applying for a License and State
 * Requirements for one row, "State Licensing Requirements", and Step 2's Exam
 * Information and Step 3's Applying for a License go to the same page — the
 * state's requirements page on xcelsolutions.com, rather than a sheet.
 *
 * ⚠ ONE ADDRESS IS CONFIRMED: Florida's,
 * https://www.xcelsolutions.com/florida/insurance-license/requirements. The
 * other states follow the same pattern — the state's name, lowercased, spaces
 * as dashes — which is an assumption until each page is checked.
 *
 * ⚠ FLORIDA WHEN THE STATE IS UNKNOWN. The demo's course resolves to Florida
 * (`MembershipOverview`), and the learning pages' Quick Links have no path to
 * read a state from.
 */
export const STATE_LICENSING_FLAG = 'atlas-state-licensing-links'

export function stateLicensingRequirementsUrl(stateCode: string | undefined): string {
  const slug = (jurisdictionName(stateCode) || 'Florida').toLowerCase().replace(/\s+/g, '-')
  return `https://www.xcelsolutions.com/${slug}/insurance-license/requirements`
}

/** The address while the flag is on; `undefined` (the sheets, as before) off. */
export function useStateLicensingUrl(stateCode: string | undefined): string | undefined {
  const on = useFeatureFlag(STATE_LICENSING_FLAG).enabled
  return on ? stateLicensingRequirementsUrl(stateCode) : undefined
}
