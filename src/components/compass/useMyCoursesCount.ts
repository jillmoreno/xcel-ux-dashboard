import { useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountContext } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { isE2ELikeVersion, resolveDashboardVersion } from '@/data/dashboardVersions'
import { ATLAS_MY_COURSES, atlasCoursesFor } from '@/data/atlasCourseCards'

/**
 * HOW MANY COURSES MY COURSES DRAWS — for the count beside Quick Links' My
 * Courses row (2026-11-03, Eric's request). `null` with the design control
 * `atlas-quick-links-course-count` off.
 *
 * ⚠ IT READS THE SAME SWITCHES THE PAGE DOES (`MyCoursesSection` in
 * PlatformShell), so the count cannot disagree with the page it links to: on
 * the baseline versions the learner's library unless the Atlas card is drawing
 * the three design courses; everywhere else those three.
 */
export function useMyCoursesCount(): number | null {
  const on = useFeatureFlag('atlas-quick-links-course-count').enabled
  const [params] = useSearchParams()
  /* The context, not `useAccount` — the card also renders on the gateway's
     handoff previews, outside any AccountProvider, and must not throw there.
     No account means no count. */
  const account = useContext(AccountContext)
  /* Read unconditionally, ANDed after — the hook-count trap. */
  const cardStyle = useFeatureFlag('atlas-courses-card-style').variant
  const fromLibrary = useFeatureFlag('atlas-courses-from-library').enabled
  if (!on || !account) return null
  const { brand } = account
  const baseline = isE2ELikeVersion(resolveDashboardVersion(params.get('version'), brand))
  return baseline && (cardStyle !== 'atlas' || fromLibrary) ? atlasCoursesFor(brand).length : ATLAS_MY_COURSES.length
}
