import {
  defaultPreset,
  studyPace,
  daysUntil,
  formatPaceDate,
  NOT_STARTED_NIGHTS,
} from '@/lib/studyPace'
import { noPaceMessage } from '@/components/compass/noPaceMessage'
import { paceStandingMessage, type PaceStanding } from '@/components/compass/paceStanding'

/**
 * Ring-card props for a given pair of deadlines, computed by the real model.
 *
 * Two surfaces need this — the exam-date screens and the panel's own states —
 * and both are about what the pace does when the access window and the exam
 * date disagree. Computing it in one place means a change to `studyPace` moves
 * every preview, and that neither surface can quietly describe a plan the
 * product would not produce.
 */
export function pacePreviewProps({
  accessExpiresAt,
  examDate,
  percent = 0,
  hoursRemaining = HOURS_REMAINING,
  standing,
}: {
  accessExpiresAt?: string
  examDate?: string
  percent?: number
  hoursRemaining?: number
  /**
   * The sentence under the goal, built from THIS card's own plan.
   *
   * ⚠ THE REASON IT IS HERE RATHER THAN AT THE CALL SITE. Three exam states
   * shared one hand-built `paceStandingMessage({ goalHoursPerWeek: 4, weeks: 3
   * })`, so a card reading "2 Week Goal · about 8 hours / week" carried the
   * sentence "You’re averaging 4 hours a week. That’s right on track for your
   * 3-week goal." Both halves wrong, on the one line whose whole job is to
   * agree with the figures above it. Built here it reads the same `fit` the
   * goal does and cannot drift from it.
   *
   * Absent leaves `standingMessage` undefined, which is the 0% card: the Home
   * shows the starting-point line until Progress moves.
   */
  standing?: PaceStanding
}) {
  const model = studyPace({
    today: PREVIEW_TODAY,
    hoursRemaining,
    accessExpiresAt,
    examDate,
    style: 'average',
    nights: NOT_STARTED_NIGHTS,
  })
  const preset = defaultPreset(model)
  /* `defaultPreset` hands back the recommended plan whether or not it fits, so
     reading its state as "no plan exists" is wrong by one — the Home falls
     back to any preset that does fit, and only when none does is there no
     plan. */
  const fit = preset.state === 'no' ? model.presets.find((x) => x.state !== 'no') : preset
  const examDays = examDate ? daysUntil(examDate, PREVIEW_TODAY) : null
  const weeks = fit ? Math.max(1, Math.round(fit.days / 7)) : undefined
  const hoursPerWeek = fit ? Math.max(1, Math.round(fit.minsPerWeek / 60)) : undefined
  return {
    percent,
    weeks,
    hoursPerWeek,
    standingMessage:
      standing && fit && weeks != null && hoursPerWeek != null
        ? paceStandingMessage({ standing, goalHoursPerWeek: hoursPerWeek, weeks, finishIso: fit.finishIso })
        : undefined,
    expected: fit ? { value: formatPaceDate(fit.finishIso), note: inDays(fit.days) } : undefined,
    exam:
      examDate && examDays != null
        ? { label: 'Florida state exam', value: formatPaceDate(examDate), note: inDays(examDays) }
        : undefined,
    noPace: fit
      ? undefined
      : ({
          binding: model.binding === 'exam' ? 'exam' : 'access',
          days: model.daysToCeiling,
          dateIso: model.hardEndIso,
        } as Parameters<typeof noPaceMessage>[0]),
  }
}

const inDays = (days: number) =>
  days === 0 ? '(today)' : days < 0 ? '(date has passed)' : `(in ${days} days)`

/** The fixture clock every prototype surface runs on. */
export const PREVIEW_TODAY = new Date(2026, 4, 11)
/** `mc-xcel-lh-prelicense` is 24 hours at 50% done — what the Home computes. */
const HOURS_REMAINING = 12
/** The committed Expires setting. */
export const PREVIEW_ACCESS_ENDS = '2026-06-10'
