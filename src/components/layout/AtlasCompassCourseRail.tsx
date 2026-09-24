import { CompassCourseRail } from '@/components/compass/CompassCourseRail'
import { COMPASS_SAMPLE_TOC_FROM_DESIGN, currentSectionProgress } from '@/data/compassCourseFixtures'
import { useAtlasCourse } from './useAtlasCourse'

/**
 * The ONE place the Compass LMS Course Left Rail Navigation is used today
 * (2026-09-22): the Atlas/Compass version's Course page —
 * `section=course&coursePage=course`, i.e. the "Course" row of the course
 * rail. This file is only the adapter: it fills `CompassCourseRailConfig` from
 * this app's data and wires the links. The rail itself lives in
 * `components/compass/` and knows nothing about Atlas.
 *
 * What comes from where:
 *   - **Title** — `useAtlasCourse`, the learner's REAL course.
 *   - **"% Complete"** — the CURRENT SECTION's progress, the same figure the
 *     player controls bar prints (`currentSectionProgress`, 2026-09-24, at the
 *     designer's request). It was the whole course's progress — Home's 62% —
 *     which sat on the same screen as the bar's 14% for the same learner.
 *   - **Table of contents** — the design's SAMPLE outline
 *     (`COMPASS_SAMPLE_TOC_FROM_DESIGN`); this course's real outline is not in
 *     the repo.
 *   - **Breadcrumb** — Home (Atlas home) / Overview (back to the course's
 *     Overview page) / Course (here).
 *   - **Resources · Get Help** — the global Help section.
 *
 * A future Compass page adds its own adapter like this one and renders the
 * same `CompassCourseRail`.
 */
export function AtlasCompassCourseRail({
  onHome,
  onOverview,
  onGetHelp,
}: {
  onHome: () => void
  onOverview: () => void
  onGetHelp: () => void
}) {
  const { title } = useAtlasCourse()
  const { pct } = currentSectionProgress(COMPASS_SAMPLE_TOC_FROM_DESIGN)
  return (
    <CompassCourseRail
      breadcrumb={[
        { label: 'Home', onSelect: onHome },
        { label: 'Overview', onSelect: onOverview },
        { label: 'Course' },
      ]}
      courseTitle={title}
      progressPct={pct}
      toc={COMPASS_SAMPLE_TOC_FROM_DESIGN}
      resources={[{ id: 'get-help', label: 'Get Help', onSelect: onGetHelp }]}
    />
  )
}
