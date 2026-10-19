import { formatHours, formatPaceDate } from '@/lib/studyPace'

/**
 * HOW THE LEARNER IS DOING AGAINST THEIR GOAL, in a sentence — lifted out of
 * `HybridPacingHome` on 2026-10-19 so the Atlas Home's pace card can say the
 * same thing (Jillienne: "we need this type of messaging to be considered
 * for the study pace section for when a user is no longer at 0%").
 *
 * ⚠ SHARED, NOT COPIED. Two cards reporting the same standing in two
 * slightly different sentences is how a demo starts contradicting itself —
 * and this is five messages with a branch structure worth getting right
 * once. CLAUDE.md's rule for a sibling is "fork the layout, import the
 * data"; this is the data.
 *
 * ⚠ FIVE MESSAGES, NOT THREE, and the split that matters is BEHIND vs OFF
 * TRACK. Behind is a gap the learner can still close inside the goal they
 * chose, so the message is a nudge. Off track says the goal no longer fits —
 * the only state with an action attached, and the original ask was explicit
 * that it sends them to the Study Plan. Collapsing the two loses that
 * action, which is the whole reason the state is worth reporting.
 */
export type PaceStanding = 'on-track' | 'ahead' | 'behind' | 'off-track' | 'no-data'

/**
 * ⚠ SCENARIO DATA, NOT A MEASUREMENT. The average is the GOAL scaled by the
 * arm, so the two numbers in the sentence always agree with each other and
 * with the pace above — but it is not a reading of what anyone did. The
 * moment real week minutes reach these cards, this factor is replaced by
 * `observedPace` and the arms become previews of real states.
 */
const OBSERVED_FACTOR: Record<PaceStanding, number> = {
  ahead: 1.3,
  'on-track': 1.0,
  behind: 0.7,
  'off-track': 0.4,
  'no-data': 0,
}

export function observedHoursFor(goalHoursPerWeek: number, standing: PaceStanding): number {
  return goalHoursPerWeek * (OBSERVED_FACTOR[standing] ?? 1)
}

export function paceStandingMessage({
  standing,
  goalHoursPerWeek,
  weeks,
  finishIso,
}: {
  standing: PaceStanding
  /** The model's own figure for the chosen pace, so the sentence and the
   *  week goal beside it cannot disagree. */
  goalHoursPerWeek: number
  weeks: number
  finishIso: string
}): string {
  const averaging = `You’re averaging ${formatHours(observedHoursFor(goalHoursPerWeek, standing))} a week.`
  /* ⚠ ADJECTIVAL, NOT PLURAL — every use below is "your … goal", where the
     plural form reads "your 2 weeks goal". Hyphenated and singular is what
     that slot takes. */
  const goalWeeks = `${weeks}-week`
  if (standing === 'no-data') {
    return `No study time logged yet this week. Your ${goalWeeks} goal asks for about ${formatHours(goalHoursPerWeek)} a week.`
  }
  if (standing === 'ahead') {
    return `${averaging} That is ahead of your ${goalWeeks} goal — keep this up and you will finish early.`
  }
  if (standing === 'behind') {
    return `${averaging} That is a little under your ${goalWeeks} goal. A short extra session this week closes the gap.`
  }
  if (standing === 'off-track') {
    return `${averaging} At this rate you will not finish by ${formatPaceDate(finishIso)}. Open your Study Plan to adjust your goal.`
  }
  return `${averaging} Based on your study goal, you are right on track.`
}
