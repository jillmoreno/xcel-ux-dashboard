import {
  defaultPreset,
  studyPace,
  daysUntil,
  formatPaceDate,
  NOT_STARTED_NIGHTS,
} from '@/lib/studyPace'
import { noPaceMessage } from '@/components/compass/noPaceMessage'

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
}: {
  accessExpiresAt?: string
  examDate?: string
  percent?: number
  hoursRemaining?: number
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
  return {
    percent,
    weeks: fit ? Math.max(1, Math.round(fit.days / 7)) : undefined,
    hoursPerWeek: fit ? Math.max(1, Math.round(fit.minsPerWeek / 60)) : undefined,
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
