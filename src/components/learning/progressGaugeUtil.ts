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

/**
 * ON-DARK palette — the same hues, at their light stops.
 *
 * Added 2026-09-16, when the QE Focused version moved the N-category gauge and
 * bars onto the navy Current Learning Path card. `CATEGORY_PALETTE` was built
 * for the LIGHT detail panel, and two of its slots are unusable on navy:
 *
 *   - slot 0 `--color-category-mandatory` (#2d5872 on XCEL) measured **1.11:1**
 *     against the bar track. That is the slot the first category gets — so on
 *     the New York journey the one bar carrying all the progress read as empty.
 *   - slot 3 `--color-cta-500` (the Brick) measured **1.03:1**. Invisible.
 *
 * This is the rule the desktop prototype's `--rail-accent` generalised and
 * `.cre-alert-action` repeats: a dark brand colour is a FILL on white and needs
 * a light stop on a dark ground. Slot 1 was already a light amber and is
 * unchanged, which is why the two-category case never showed the problem.
 *
 * Measured on the navy card against the bars' 12%-white track: 3.89 / 3.74 /
 * 4.85 / 3.06 / 5.89 / 3.54 / 5.09 — every slot clears 3:1. Re-measure before
 * darkening any of them.
 */
export const CATEGORY_PALETTE_ON_DARK = [
  'var(--color-primary-300)', // 0 — brand primary, light stop
  'var(--color-category-elective)', // 1 — already a light amber
  'var(--color-tertiary-300)', // 2
  'var(--color-cta-300)', // 3 — the stop tokens.css labels "on-dark alternative"
  'var(--color-warning-300)', // 4
  'var(--color-success-300)', // 5
  'var(--color-info-300)', // 6
]

/** Brand-ramp color for the Nth category (wraps if there are more categories
 *  than palette slots). `onDark` picks the light-stop palette — see its note. */
export function categoryColorFor(index: number, onDark = false): string {
  const palette = onDark ? CATEGORY_PALETTE_ON_DARK : CATEGORY_PALETTE
  return palette[index % palette.length]
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
