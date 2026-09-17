import type { LearningPathSummary } from '@/data/learningFixtures'
import { GetLicensedRail, StudyJourneyRail } from './StudyJourneyRail'
import { journeyStopsFor } from './studyJourneyUtil'
import { widgetCardStyle, widgetRuleStyle } from './widgetStyles'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * STUDY JOURNEY WIDGET — the QE Focused version's own card (2026-09-16).
 *
 * Resume block on top, then the Study Journey, then Get Licensed: one card
 * answering "where am I and what is next", from the course in front of the
 * learner all the way to the licence.
 *
 * ── Why it is its own component and its own card ─────────────────────────
 *
 * It was the right-hand HALF of `LearnerFocusedBand` — a grid sibling of the
 * navy Current Learning Path, sharing one border radius, one shadow and one
 * `overflow: hidden`. Two things made that stop working once QE Focused slimmed
 * the navy side and grew this one:
 *
 *   - **Grid siblings share a row height.** The navy lead-in is now four lines;
 *     this is a resume block plus seven journey stops plus three licensing
 *     steps. Joined, the navy half stretched to match and carried a large empty
 *     area below its content — which reads as something failed to render.
 *   - **They are no longer halves of one statement.** The navy side says which
 *     licence and how it is going; this says what to do next. Presenting them
 *     as one surface implied a relationship that the Progress section (now
 *     directly below, carrying the navy side's old figures) had already taken
 *     over.
 *
 * So the band renders two independent cards, top-aligned, each sized by its own
 * content. `LearnerFocusedBand` keeps its joined treatment for every other
 * version — Learner Focused and Marketing Focused are unchanged.
 *
 * ── What it deliberately does NOT own ────────────────────────────────────
 *
 * The resume course is passed in, not resolved here. The band picks it from the
 * persona (or falls back to the brand's first in-progress course), and two
 * components resolving "the course to resume" is how they end up disagreeing.
 * Same for launching: `onResume` and `onOpenStop` are callbacks, so this file
 * has no `useCourseLauncher` and works unchanged in a dev-handoff preview.
 */
export function StudyJourneyWidget({
  path,
  onOpenStop,
  onOpenStep,
  onOpenRequirements,
  onOpenLearningPath,
}: {
  path: LearningPathSummary
  onOpenStop?: (courseId: string) => void
  /** Open a Get Licensed step — the requirements sheet. See `GetLicensedRail`. */
  onOpenStep?: (id: string) => void
  /** Open the requirements sheet from the foot of the Get Licensed card. */
  onOpenRequirements?: () => void
  onOpenLearningPath?: (pathId: string) => void
}) {
  // On the `syllabus` treatment both halves are cards of their own, so the
  // hairline between them becomes a third divider between two edges. A gap
  // separates them instead.
  const syllabus = useFeatureFlag('dashboard-journey-style').variant === 'syllabus'
  return (
    <section aria-label="Study journey" style={widgetCardStyle}>
      <div>
        <StudyJourneyRail
          path={path}
          onOpenStop={onOpenStop}
          onViewAll={onOpenLearningPath ? () => onOpenLearningPath(path.id) : undefined}
        />
      </div>

      {/* GET LICENSED — steps 2-4 of XCEL's published route. A rule between
          them rather than a gap: they are siblings in one sequence, not two
          unrelated blocks, and the section's own lede says what changes (the
          state owns these). */}
      {/* The rule renders on BOTH treatments again as of 2026-09-17. It was
          dropped for `syllabus` because each section drew its own card there,
          and a card boundary said "the owner changes here" more plainly than a
          line does. The cards went (background and stroke removed), so without
          this the journey and Get Licensed run together as one list. */}
      <div aria-hidden style={{ ...widgetRuleStyle, marginTop: 18 }} />
      <div style={{ marginTop: syllabus ? 14 : 18 }}>
        {/* `startNumber` continues the journey's own numbering (01-04 → 05-07)
            rather than restarting at 1. Derived from the real stop count, since
            merging two completion stops into one already changed it once. */}
        <GetLicensedRail
          onOpenStep={onOpenStep}
          onOpenRequirements={onOpenRequirements}
          state={path.state}
          startNumber={journeyStopsFor(path).length + 1}
        />
      </div>
    </section>
  )
}






