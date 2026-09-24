import { CompassCourseFooter } from '@/components/compass/CompassCourseFooter'
import { COMPASS_SAMPLE_TOC_FROM_DESIGN } from '@/data/compassCourseFixtures'

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
  const sections = COMPASS_SAMPLE_TOC_FROM_DESIGN
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
