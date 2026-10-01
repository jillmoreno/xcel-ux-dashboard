import { CompassPlayerBar } from '@/components/compass/CompassPlayerBar'
import { COMPASS_SAMPLE_TOC_FROM_DESIGN, currentSectionProgress } from '@/data/compassCourseFixtures'

/**
 * The adapter that fills the Compass Course Player controls bar for the ONE
 * page that shows it today (2026-09-23): the Atlas/Compass version's Course
 * page (`section=course&coursePage=course`). The bar itself is
 * `components/compass/CompassPlayerBar`.
 *
 * - **No exam date** since 2026-10-01 — the rearranged design (Figma 170:1331)
 *   no longer draws the date pill.
 * - **Section** — the table of contents' CURRENT section, and its percentage
 *   DERIVED from that section's lessons (done ÷ total), so the bar cannot
 *   disagree with the ticks in the rail beside it. The design is drawn at 0%.
 * - **Notes: 0** — nothing stores notes yet.
 * - **Handlers** — Rubi opens the Rubi right rail (shown only while it is
 *   closed); close returns
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
  return (
    <CompassPlayerBar
      // The Section progress pill is ARCHIVED here (2026-10-01, the
      // designer's request: "remove … but save it for later"). Restore:
      // delete this line. See ARCHIVED_ITEMS `compass-player-section-pill`.
      showSection={false}
      section={{ label, pct }}
      notesCount={0}
      stickyTop={stickyTop}
      onRubi={onRubi}
      rubiOpen={rubiOpen}
      onClose={onClose}
    />
  )
}
