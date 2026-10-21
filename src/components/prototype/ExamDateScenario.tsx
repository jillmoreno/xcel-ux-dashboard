import type { CSSProperties, ReactNode } from 'react'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { ExamDatePrompt } from '@/components/compass/AtlasHomeJillMain'
import {
  defaultPreset,
  studyPace,
  daysUntil,
  formatPaceDate,
  NOT_STARTED_NIGHTS,
  type PaceModel,
} from '@/lib/studyPace'
import { noPaceMessage } from '@/components/compass/noPaceMessage'
import { handoffEyebrowStyle, handoffMetaStyle } from './devHandoffStyles'

/**
 * ONE EXAM-DATE SCENARIO: Step 2 on the left, the Course Progress column on
 * the right, for the same date.
 *
 * ⚠ 2026-10-21, Jillienne: "actually show the exam date logic within this
 * handoff for each step … this means that these screens will need to show not
 * only the date logic, but also what happens in the Course Progress component
 * when dates are set." The two were documented apart, and the thing that
 * matters about an exam date is precisely what it does to the OTHER component:
 * the pace re-plans, a figure row appears, and past a point no plan fits at
 * all. Reading that across two pages is how it got written up wrong once
 * already.
 *
 * ⚠ THE NUMBERS ARE COMPUTED, NEVER TYPED. Every figure on the right comes
 * from `studyPace` with the same inputs the Home passes, so these screens
 * cannot drift from the page the way a transcribed count would — and a change
 * to the pace model moves them without anyone editing this file.
 *
 * ⚠ AND THE HANDLERS ARE INERT. `ExamDatePrompt` is prop-driven and never
 * touches `examDateStore`, so nothing here can write the real `cgp.examDate` —
 * which matters, because that key is per-browser and the product reads it. The
 * screens are stills of each step, not a working flow.
 */
export function ExamDateScenario({
  examDate,
  picking = false,
  accessExpiresAt = ACCESS_ENDS,
  note,
}: {
  /** The stored date for this screen, or undefined for the asking state. */
  examDate?: string
  /** Draw the calendar instead of the question or the scheduled stop. */
  picking?: boolean
  /** The course's access window — the other deadline the plan is bound by. */
  accessExpiresAt?: string
  /** One line under the pair, saying what this screen is for. */
  note?: ReactNode
}) {
  /* ⚠ THE HOME'S OWN INPUTS, NOT INVENTED ONES. A first pass guessed 60 hours
     and every screen came out "no study pace fits" — against a page whose
     default reads "4 Week Goal · about 4 hours a week". The committed demo
     course is `mc-xcel-lh-prelicense` at 24 hours, the Home is at 0% so none
     of them are spent, and `NOT_STARTED_NIGHTS` is the spread it passes there.
     With those three the default screen reproduces the page exactly, which is
     the only way the other five can be trusted. */
  const model = studyPace({
    today: TODAY,
    hoursRemaining: HOURS_REMAINING,
    accessExpiresAt,
    examDate,
    style: 'average',
    nights: NOT_STARTED_NIGHTS,
  })
  return (
    <div style={{ marginTop: 12 }}>
      {note ? <p style={{ ...handoffMetaStyle, margin: '0 0 10px' }}>{note}</p> : null}
      {/* ⚠ THE BASIS, ON EVERY SCREEN. These are computed from one set of
          inputs, and the absolute figures move with the course the Demo bar
          has selected — so a reader comparing a screen against the page needs
          to know which course it was drawn for. The DELTAS are the point and
          hold regardless: which deadline binds, and when no plan fits. */}
      <p style={{ ...handoffMetaStyle, margin: '0 0 10px' }}>
        Drawn on the demo clock (11 May 2026), access ending 10 June, with 12
        hours of coursework left. The hours-a-week figure follows the Demo bar’s
        Course setting; the week goal, the dates and which deadline binds do not.
      </p>
      <div style={pairStyle}>
        <div style={halfStyle}>
          <p style={{ ...handoffEyebrowStyle, margin: '0 0 8px' }}>Study Journey · Step 2</p>
          <div style={stepFrameStyle}>
            <ExamDatePrompt
              examDate={examDate}
              picking={picking}
              today={TODAY}
              stateName="Florida"
              onAdd={NOOP}
              onCancel={NOOP}
              onSave={NOOP}
              onRemove={NOOP}
            />
          </div>
        </div>
        <div style={halfStyle}>
          <p style={{ ...handoffEyebrowStyle, margin: '0 0 8px' }}>Course Progress column</p>
          <PaceColumn model={model} examDate={examDate} />
        </div>
      </div>
    </div>
  )
}

/** The pace card as the Home builds it — see `AtlasHomeJillMain`. */
function PaceColumn({ model, examDate }: { model: PaceModel; examDate?: string }) {
  const preset = defaultPreset(model)
  /* ⚠ `defaultPreset` RETURNS THE RECOMMENDED PRESET WHETHER OR NOT IT FITS,
     so reading its `state` as "no pace exists" is wrong by one. The Home falls
     back to any preset that DOES fit; only when none does is there no plan. */
  const fit = preset.state === 'no' ? model.presets.find((x) => x.state !== 'no') : preset
  const examDays = examDate ? daysUntil(examDate, TODAY) : null
  return (
    <div style={panelStyle}>
      <AtlasPaceRingCard
        percent={0}
        weeks={fit ? Math.max(1, Math.round(fit.days / 7)) : undefined}
        hoursPerWeek={fit ? Math.max(1, Math.round(fit.minsPerWeek / 60)) : undefined}
        expected={
          fit
            ? { value: formatPaceDate(fit.finishIso), note: inDays(fit.days) }
            : undefined
        }
        exam={
          examDate && examDays != null
            ? { label: 'Florida state exam', value: formatPaceDate(examDate), note: inDays(examDays) }
            : undefined
        }
        noPace={fit ? undefined : noPaceReason(model)}
        onCustomize={NOOP}
      />
    </div>
  )
}

/** The shape `AtlasPaceRingCard` wants when nothing fits — the model's own
 *  binding, so the card names the deadline that actually bound. */
function noPaceReason(model: PaceModel) {
  const binding = model.binding === 'exam' ? 'exam' : 'access'
  return { binding, days: model.daysToCeiling, dateIso: model.hardEndIso } as Parameters<
    typeof noPaceMessage
  >[0]
}

const inDays = (days: number) =>
  days === 0 ? '(today)' : days < 0 ? '(date has passed)' : `(in ${days} days)`

/** The fixture clock every prototype surface runs on. */
const TODAY = new Date(2026, 4, 11)
/**
 * TWELVE HOURS — `mc-xcel-lh-prelicense` is 24 and the fixture has it half
 * done (`progress: 50`), and `hoursRemaining` is what the Home computes from
 * THAT: `resume.hours * (1 - progress / 100)`.
 *
 * ⚠ TWO DIFFERENT PROGRESS NUMBERS LIVE ON THIS PAGE, which is worth knowing
 * before trusting either. The DIAL reads the demo bar's Progress control — 0%
 * by default — while the PLAN reads the course fixture's own 50%. They are not
 * wired to each other, so the ring can say 0% over a plan built on half the
 * work being done. Guessing 24 here (or 60, which the first pass used) puts
 * every screen in "no study pace fits" and the handoff lies in a way that
 * looks authoritative.
 */
const HOURS_REMAINING = 12
const ACCESS_ENDS = '2026-06-10'
const NOOP = () => {}

const pairStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 20,
  alignItems: 'start',
}
const halfStyle: CSSProperties = { minWidth: 0 }
const stepFrameStyle: CSSProperties = {
  padding: 16,
  borderRadius: 'var(--radius-md)',
  border: '1px dashed var(--color-border-subtle)',
  background: 'var(--color-surface-page)',
}
const panelStyle: CSSProperties = {
  width: 296,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: '8px 24px',
  borderRadius: 20,
  background: 'var(--color-atlas-tan-100)',
}
