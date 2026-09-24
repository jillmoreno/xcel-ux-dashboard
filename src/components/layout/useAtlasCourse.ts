import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { displayedProgressPct } from '@/components/learning/learningPathsHomeUtil'

/**
 * The course the Atlas/Compass course pages are about — resolved the way Home
 * resolves it: the Progress persona, with the education type forced to a
 * qualifying one, as every QE-shaped version does. ONE hook so the Atlas
 * course rail and the Compass course rail cannot name different courses, and
 * so the Compass rail's "% Complete" is the SAME figure Home prints
 * (`displayedProgressPct`), not a second number that disagrees with it.
 */
export function useAtlasCourse(): { title: string; progressPct: number } {
  const { brand } = useAccount()
  const progressVariant = useFeatureFlag('dashboard-progress-state').variant
  const educationFlag = useFeatureFlag('dashboard-education-type').variant
  const persona = dashboardProgressPersonaFor(
    brand,
    progressVariant,
    educationFlag === 'exam-prep' ? 'exam-prep' : 'qe',
  )
  return {
    title: persona?.path.title ?? 'Course',
    progressPct: persona ? displayedProgressPct(persona.path) : 0,
  }
}
