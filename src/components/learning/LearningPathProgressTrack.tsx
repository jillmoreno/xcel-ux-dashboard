import type { LearningPathSummary } from '@/data/learningFixtures'
import { CAT_ELECTIVE_COLOR, CAT_MANDATORY_COLOR } from '@/components/learning/progressGauge'
import { hasCategoryBreakdown } from './learningPathsHomeUtil'

/**
 * Progress track for a learning path — a single primary fill, or the
 * Mandatory/Elective two-segment split when the path carries a category
 * breakdown (colors match the Current Learning Path gauge). Status never
 * colors the fill (that lives in the badge). Shared by the homepage cards and
 * the table view.
 */
export function LearningPathProgressTrack({
  path,
  height = 8,
}: {
  path: LearningPathSummary
  height?: number
}) {
  const split = hasCategoryBreakdown(path)
  const total = split ? path.mandatory!.required + path.elective!.required : 0
  return (
    <div
      role="progressbar"
      aria-valuenow={path.progressPct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        display: 'flex',
        height,
        width: '100%',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-neutral-200)',
        overflow: 'hidden',
      }}
    >
      {split ? (
        <>
          <span
            style={{
              width: `${(path.mandatory!.completed / total) * 100}%`,
              background: CAT_MANDATORY_COLOR,
            }}
          />
          <span
            style={{
              width: `${(path.elective!.completed / total) * 100}%`,
              background: CAT_ELECTIVE_COLOR,
            }}
          />
        </>
      ) : (
        // Single category — always primary, regardless of status. Not Started
        // renders an empty track (0%).
        <span style={{ width: `${path.progressPct}%`, background: 'var(--color-progress-fill)' }} />
      )}
    </div>
  )
}
