import { CompassCourseRail } from '@/components/compass/CompassCourseRail'
import {
  applyCourseSequencing,
  compassTocFor,
  currentSectionProgress,
} from '@/data/compassCourseFixtures'
import { useCourseDemo } from '@/context/FeatureFlagContext'
import { useSearchParams } from 'react-router-dom'
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
  // Unused while the breadcrumb is off (see below); kept for its restore.
  onHome: _onHome,
  onOverview: _onOverview,
  onGetHelp,
}: {
  onHome: () => void
  onOverview: () => void
  onGetHelp: () => void
}) {
  void _onHome
  void _onOverview
  const { title } = useAtlasCourse()
  // No course name on Eric/Atlas WIP — as its Overview rail (2026-10-14).
  const hideTitle = useSearchParams()[0].get('version') === 'eric-atlas-v3'
  /* THE COURSE AXIS — 2026-10-15. The tree is the course's own, and the
     Regulated sequencing is applied HERE rather than inside the rail: the
     rail draws a `CompassCourseRailConfig` and resolves nothing, which is
     what makes it reusable. `applyCourseSequencing` returns the tree
     unchanged by identity under Unregulated, so the default path is free. */
  const { course, regulated } = useCourseDemo()
  const toc = applyCourseSequencing(compassTocFor(course), regulated)
  /* ⚠ `% Complete` READS THE SEQUENCED TREE, which is the same tree the rail
     lists. Locking never touches a `done` entry, so the figure is identical
     either way — but reading the unsequenced one would be two sources for one
     number, which is how they come apart later. */
  const { pct } = currentSectionProgress(toc)
  return (
    <CompassCourseRail
      /* NO BREADCRUMB since 2026-10-01 (the designer's request). It was
         Home / Course Overview / Course — to restore, pass
         breadcrumb={[{ label: 'Home', onSelect: onHome },
           { label: 'Course Overview', onSelect: onOverview }, { label: 'Course' }]}.
         `onHome` and `onOverview` are kept as props for exactly that. */
      courseTitle={hideTitle ? '' : title}
      // …and no progress row on WIP either (2026-10-14, Eric's request).
      hideProgress={hideTitle}
      progressPct={pct}
      toc={toc}
      resources={[{ id: 'get-help', label: 'Get Help', onSelect: onGetHelp }]}
    />
  )
}
