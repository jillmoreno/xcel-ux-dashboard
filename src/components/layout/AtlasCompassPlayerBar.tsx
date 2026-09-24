import { CompassPlayerBar } from '@/components/compass/CompassPlayerBar'
import { COMPASS_SAMPLE_TOC_FROM_DESIGN, currentSectionProgress } from '@/data/compassCourseFixtures'
import { COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN } from '@/data/compassCourseOverviewFixtures'

/**
 * The adapter that fills the Compass Course Player controls bar for the ONE
 * page that shows it today (2026-09-23): the Atlas/Compass version's Course
 * page (`section=course&coursePage=course`). The bar itself is
 * `components/compass/CompassPlayerBar`.
 *
 * - **Exam date · days out** — the Overview's facts, so the two pages of one
 *   course state one date (the design's "August 14 · 8 Days Out" is sample).
 * - **Section** — the table of contents' CURRENT section, and its percentage
 *   DERIVED from that section's lessons (done ÷ total), so the bar cannot
 *   disagree with the ticks in the rail beside it. The design is drawn at 0%.
 * - **Notes: 0** — nothing stores notes yet.
 * - **Handlers** — Rubi toggles the Rubi right rail; close returns
 *   to the course Overview. Notes, Demo, search and settings have nowhere to
 *   go yet, so they are passed nothing and render disabled.
 */
export function AtlasCompassPlayerBar({
  stickyTop,
  rubiOpen,
  onRubi,
  onClose,
}: {
  stickyTop: number
  rubiOpen: boolean
  onRubi: () => void
  onClose: () => void
}) {
  // Shared with the course rail's "% Complete" pill, so the two always match.
  const { label, pct } = currentSectionProgress(COMPASS_SAMPLE_TOC_FROM_DESIGN)
  const facts = COMPASS_OVERVIEW_DAY_ONE_FROM_DESIGN.facts
  const daysOut = facts.leftToComplete.replace(/days?/i, (m) => (m === 'day' ? 'Day' : 'Days'))
  return (
    <CompassPlayerBar
      examDate={facts.targetExamDate}
      daysOut={`${daysOut} Out`}
      section={{ label, pct }}
      notesCount={0}
      stickyTop={stickyTop}
      onRubi={onRubi}
      rubiOpen={rubiOpen}
      onClose={onClose}
    />
  )
}
