/**
 * Delivery-mode labels for a course's meta line.
 *
 * Extracted from `LearnerFocusedBand` 2026-09-16 when `StudyJourneyWidget` was
 * split out of it — the two render the same meta line, and a copy in the new
 * file would have been the sixth private `DELIVERY_LABEL` map in `src/`.
 *
 * The other five (JumpBackInCard, RecommendedForYouPanel, IndividualCourseCard,
 * courseSheetFixtures, DashboardRecommendedBand's DELIVERY_META) are NOT folded
 * in here: they disagree on wording on purpose in places — this map says
 * "Course" for `online` where others say "Online" — so collapsing them is a
 * copy decision, not a refactor. This exists so the split did not add a sixth.
 */
export const DELIVERY_LABEL: Record<string, string> = {
  online: 'Course',
  'in-person': 'In Person',
  classroom: 'Classroom',
  video: 'Video',
  podcast: 'Podcast',
}
