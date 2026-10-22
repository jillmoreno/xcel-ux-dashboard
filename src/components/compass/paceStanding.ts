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

/**
 * The phrase inside the OFF-TRACK sentence that the card draws as a link.
 *
 * ⚠ EXPORTED SO THE SPLIT CANNOT GO STALE (2026-10-21, Jillienne: "make
 * 'Study Plan' a clickable link"). The sentence is built here and linkified at
 * the render site, which means two files have to agree on an exact substring —
 * the classic way a copy edit silently turns a link back into plain text. One
 * constant, used to build the sentence AND to split it, so a reword either
 * keeps working or fails to compile.
 */
export const PACE_PLAN_LINK = 'Study Plan'

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
  const hours = formatHours(observedHoursFor(goalHoursPerWeek, standing))
  const averaging = `You’re averaging ${hours} a week.`
  /* ⚠ ADJECTIVAL, NOT PLURAL — every use below is "your … goal", where the
     plural form reads "your 2 weeks goal". Hyphenated and singular is what
     that slot takes. */
  const goalWeeks = `${weeks}-week`
  if (standing === 'no-data') {
    return `No study time logged yet this week. Your ${goalWeeks} goal asks for about ${formatHours(goalHoursPerWeek)} a week.`
  }
  /* ⚠ CONTRACTIONS, AND THE SAME SHAPE THREE TIMES (2026-10-21, Jillienne:
     "use some language that is less AI sounding"). The sentences opened
     "You’re averaging…" and then switched to "you will", "you are" and "That
     is" — the register changed mid-line, which is most of what made them read
     written-by-committee. Three of the four now share one frame, "That’s …
     your N-week goal", so the only thing that moves between standings is the
     judgement; OFF TRACK deliberately breaks the frame, because it is the one
     state where the goal itself has stopped being true. */
  if (standing === 'ahead') {
    return `${averaging} That’s ahead of your ${goalWeeks} goal — keep it up and you’ll finish early.`
  }
  if (standing === 'behind') {
    /* ⚠ ONE SENTENCE, NOT TWO, and it does not name the week count (2026-10-21,
       the direct wording). "You’re averaging 2¾ hours a week." followed by
       "That’s a little under your 3-week goal." says the same thing twice —
       the figure and the judgement belong in one breath, and the learner can
       see the goal in the row directly above. */
    return `You’re averaging ${hours} a week, just under your goal. One extra study session this week will help you get back on track.`
  }
  if (standing === 'off-track') {
    return `${averaging} At this rate you won’t finish by ${formatPaceDate(finishIso)}. Open your ${PACE_PLAN_LINK} to adjust your goal.`
  }
  /* ⚠ IT STILL SAYS "on track" — that is the name of the standing on the demo
     bar, and a reviewer matching the control to the card needs the words to
     meet. "Based on your study goal, you are right on track" said the same
     thing with a clause that carried nothing: the whole sentence is about the
     goal. */
  return `${averaging} That’s right on track for your ${goalWeeks} goal.`
}
