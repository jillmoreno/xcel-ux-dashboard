import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { resolveCommerceState } from '@/data/commerce/entitlement'
import type { IndividualCourse } from '@/data/catalogFixtures'
import { CourseSheet } from './CourseSheet'
import { CoursePurchaseSheet } from './CoursePurchaseSheet'

/**
 * Picks which purchase sheet a catalog course card opens, driven by the
 * `catalog-upsell-flow` flag (Admin tools → Feature Flag → Course Catalog):
 *
 *   'current' (default) → `CourseSheet` — today's single-screen Purchase Course
 *                         sheet with the price, Add to Cart / Course Overview
 *                         buttons, and the Description tabs inline.
 *   'new'               → `CoursePurchaseSheet` — the two-step Choose-how-to-
 *                         enroll → Complete-purchase flow with the membership
 *                         upsell, and Course Details behind a link.
 *
 * The new flow is a PURCHASE surface, so it only takes over when the viewer
 * actually has something to buy. A member whose tier already includes the
 * course resolves to `included` and keeps the existing sheet — that's where the
 * Enroll / Manage Enrollment paths live, and none of them are part of this
 * design. Same for a course the member is already enrolled in.
 */
export function CourseSheetSwitch({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data: IndividualCourse | null
}) {
  const { brand, tier } = useAccount()
  const variant = useFeatureFlag('catalog-upsell-flow').variant
  const entitled = data ? resolveCommerceState(brand, tier, data).kind === 'included' : false
  const useNewFlow = variant === 'new' && !entitled

  if (useNewFlow) {
    return <CoursePurchaseSheet open={open} onClose={onClose} data={data} />
  }
  return <CourseSheet open={open} onClose={onClose} data={data} />
}
