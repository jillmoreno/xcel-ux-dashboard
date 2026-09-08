import type { LearningPathCategory, LearningPathCategoryBreakdown } from '@/data/learningFixtures'

/**
 * Non-component helpers for the progress gauge (kept out of `progressGauge.tsx`
 * so that file only exports components — react-refresh). The category color
 * palette + the path→categories normalizer live here.
 */

/**
 * Ordered category color palette, assigned by index. Slots 0/1 are the
 * Mandatory/Elective tokens (so the 2-category case is unchanged); slots 2+ pull
 * additional distinct brand-ramp colors from the style guide. Every value is a
 * token, so the palette relights per `<html data-brand>`.
 */
export const CATEGORY_PALETTE = [
  'var(--color-category-mandatory)', // 0 — brand primary
  'var(--color-category-elective)', // 1 — brand secondary
  'var(--color-tertiary-500)', // 2
  'var(--color-cta-500)', // 3
  'var(--color-warning-500)', // 4
  'var(--color-success-500)', // 5
  'var(--color-info-500)', // 6
]

/** Brand-ramp color for the Nth category (wraps if there are more categories
 *  than palette slots). */
export function categoryColorFor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}

/**
 * Normalize a path to its category list: the explicit `categories` when set,
 * else the Mandatory/Elective pair (with education-type labels). Structural
 * param so any path-shaped object works.
 */
export function resolvePathCategories(path: {
  categories?: LearningPathCategory[]
  mandatory?: LearningPathCategoryBreakdown
  elective?: LearningPathCategoryBreakdown
  mandatoryLabel?: string
  electiveLabel?: string
}): LearningPathCategory[] {
  if (path.categories && path.categories.length) return path.categories
  const out: LearningPathCategory[] = []
  if (path.mandatory) out.push({ key: 'mandatory', label: path.mandatoryLabel ?? 'Mandatory', ...path.mandatory })
  if (path.elective) out.push({ key: 'elective', label: path.electiveLabel ?? 'Elective', ...path.elective })
  return out
}
