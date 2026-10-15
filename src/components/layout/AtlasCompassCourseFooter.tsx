import { CompassCourseFooter } from '@/components/compass/CompassCourseFooter'
import { applyCourseSequencing, compassTocFor } from '@/data/compassCourseFixtures'
import { useCourseDemo } from '@/context/FeatureFlagContext'

/**
 * The adapter for the Compass course navigation footer on the ONE page that
 * shows it today (2026-09-23): the Atlas/Compass version's Course page.
 *
 * The steps are DERIVED from the table of contents, so the footer names the
 * same lessons the rail shows: Previous is the lesson before the current one,
 * Next the lesson after it (or, at the end of a section, the next section).
 * The design's "Next: Reading" names an activity TYPE, which the sample
 * outline does not carry.
 *
 * NO handlers: no lesson has a page yet, so both steps render disabled rather
 * than as buttons that go nowhere. Pass `onSelect` once lessons exist.
 */
export function AtlasCompassCourseFooter() {
  /* THE SEQUENCED TREE (2026-10-15) — this footer's whole job is naming what
     comes next, and under Regulated sequencing "next" may be locked. Reading
     the raw tree would offer Next on a lesson the rail draws with a padlock,
     which is the footer and the rail disagreeing about the same step. The
     steps already render disabled (no lesson has a page), so a locked Next
     shows as the label it is rather than as a dead control. */
  const { course, regulated } = useCourseDemo()
  const sections = applyCourseSequencing(compassTocFor(course), regulated)
  const sectionIndex = sections.findIndex((s) => s.status === 'current')
  const lessons = sections[sectionIndex]?.children ?? []
  const lessonIndex = lessons.findIndex((l) => l.status === 'current')
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : undefined
  const next =
    lessonIndex >= 0 && lessonIndex < lessons.length - 1
      ? lessons[lessonIndex + 1]
      : sections[sectionIndex + 1]
  return (
    <CompassCourseFooter
      previous={previous ? { label: previous.label } : undefined}
      next={next ? { label: next.label } : undefined}
    />
  )
}
