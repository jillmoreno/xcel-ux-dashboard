import { useMemo, useState } from 'react'
import { Clock } from '@/icons'
import { SquareTile } from '@/components/membership/v5/SquareTile'
import { StudyPaceSheet, type PaceChoices } from './StudyPaceSheet'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  presetLabel,
  EASY_MINS,
  type PacePreset,
  type PaceModel,
} from '@/lib/studyPace'

/**
 * STUDY PACE — the live tile. "Testing 2" dashboard version only; QE Focused
 * keeps the lo-fi stub (see `DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2`).
 *
 * Ported 2026-09-21 from `public/prototypes/xcel-pace-presets.html` §02, where
 * the argument lives. The load-bearing claim, and the reason this file is as
 * short as it is:
 *
 *   **THE TILE OPERATES NOTHING.** It states a pace and offers one control,
 *   Adjust. No preset strip, no nights picker, no date field — all of that is
 *   in the sheet. Jillienne's call on 2026-09-21, and it is what keeps a
 *   dashboard tile a *statement* rather than a control panel somebody has to
 *   read before they can start studying. A test counts the controls.
 *
 * Every figure derives (`@/lib/studyPace`) from two real facts the product
 * already has — the resume course's published credit hours, and its access
 * expiry — plus an exam date if the learner gives one. Nothing here is
 * authored, which is the rule the Readiness stub beside it is still waiting
 * for: grey bars say "not built", a plausible number would say something false.
 */

export type StudyPaceTileProps = {
  /** The clock. Prototype surfaces pass the anchored fixture date. */
  today: Date
  /** Hours of work left — real published credit hours × what is left to do. */
  hoursRemaining: number
  /** ISO yyyy-mm-dd. When the course's access ends. */
  accessExpiresAt?: string
  /** Where `Details →` goes. A real in-shell address, never an invented one. */
  detailsTo?: string
  /** Course name, for the sheet's sub-line. */
  courseTitle?: string
}

export function StudyPaceTile({
  today,
  hoursRemaining,
  accessExpiresAt,
  detailsTo,
  courseTitle,
}: StudyPaceTileProps) {
  const [open, setOpen] = useState(false)
  /**
   * Everything the sheet can change, held here rather than in the sheet, so
   * closing it does not throw the learner's choices away. `null` means "we have
   * not been told" — which is how the tile knows whether to keep calling its
   * own number a recommendation.
   */
  const [choices, setChoices] = useState<PaceChoices>({
    presetId: null,
    nights: null,
    examDate: null,
    style: 'average',
    plan: null,
  })

  const model: PaceModel = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate: choices.examDate ?? undefined,
        nights: choices.nights ?? undefined,
        style: choices.style,
      }),
    [today, hoursRemaining, accessExpiresAt, choices.examDate, choices.nights, choices.style],
  )

  const selected: PacePreset =
    (choices.presetId && model.presets.find((p) => p.id === choices.presetId)) || defaultPreset(model)
  /** Untouched ⇒ the number is still ours to call "recommended". The moment any
   *  of it is the learner's, the tile stops claiming credit for it. */
  const adjusted =
    choices.presetId != null || choices.nights != null || choices.examDate != null || choices.style !== 'average'

  return (
    <>
      <SquareTile
        caption="Study Pace"
        icon={<Clock size={13} />}
        to={detailsTo}
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="cre-link-action cre-cta-ink"
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            Adjust
          </button>
        }
      >
        <PaceBody model={model} preset={selected} adjusted={adjusted} plan={choices.plan} />
      </SquareTile>
      <StudyPaceSheet
        open={open}
        onClose={() => setOpen(false)}
        today={today}
        hoursRemaining={hoursRemaining}
        accessExpiresAt={accessExpiresAt}
        courseTitle={courseTitle}
        choices={choices}
        onChange={setChoices}
      />
    </>
  )
}

/* ─── the tile's own content ─────────────────────────────────────────── */

function PaceBody({
  model,
  preset,
  adjusted,
  plan,
}: {
  model: PaceModel
  preset: PacePreset
  adjusted: boolean
  plan: PaceChoices['plan']
}) {
  if (preset.state === 'no') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <PaceChip tone="critical">Won’t fit</PaceChip>
        <p style={sentence}>
          {model.binding === 'exam'
            ? 'The work left won’t fit before your exam, at any pace we would recommend.'
            : 'The work left won’t fit before your access ends, at any pace we would recommend.'}
        </p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {/* The pill names the PRESET once it is the learner's, and says
          "Recommended" only while it is still ours. `presetLabel` is what keeps
          "Relaxed" honest on a long course — see its note. */}
      <PaceChip tone={preset.state === 'heavy' ? 'warning' : adjusted ? 'positive' : 'neutral'}>
        {adjusted ? presetLabel(preset) : 'Recommended'}
        {preset.state === 'heavy' ? ' · heavy' : ''}
      </PaceChip>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 20,
            lineHeight: '24px',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: 'var(--color-text-primary)',
          }}
        >
          {formatEvening(preset.minsPerNight)}
        </div>
        <div style={{ ...sentence, marginTop: 2 }}>
          a night · {preset.nights} nights a week
        </div>
      </div>
      <PaceTimeline model={model} preset={preset} />
      <p style={sentence}>
        Finishes by <b style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{formatPaceDate(preset.finishIso)}</b>
        {plan ? ' · on your Study Plan' : ''}
      </p>
    </div>
  )
}

const sentence = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
} as const

/**
 * A three-tone status chip.
 *
 * Deliberately NOT `StatusBadge`: that vocabulary is the six COMPLIANCE states
 * (On Track / At Risk / …), and this is a different axis — how heavy the chosen
 * pace is. Two different meanings wearing one badge is how a learner reads "At
 * Risk" off a tile that is only saying their evenings are long.
 */
function PaceChip({
  tone,
  children,
}: {
  tone: 'neutral' | 'positive' | 'warning' | 'critical'
  children: React.ReactNode
}) {
  const tones = {
    neutral: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-text-secondary)' },
    positive: { bg: 'var(--color-success-100)', fg: 'var(--color-success-700)' },
    warning: { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-800)' },
    critical: { bg: 'var(--color-error-100)', fg: 'var(--color-error-700)' },
  }[tone]
  return (
    <span
      style={{
        alignSelf: 'flex-start',
        fontFamily: 'var(--font-body)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.02em',
        padding: '3px 9px',
        borderRadius: 'var(--radius-pill)',
        background: tones.bg,
        color: tones.fg,
      }}
    >
      {children}
    </span>
  )
}

/**
 * Today → the binding ceiling, with the chosen finish on it.
 *
 * ONE COLOUR, and that is the difference from the prototype's timeline: this
 * tile is 180px wide at its narrowest, and the prototype's three markers
 * (finish, access end, exam) collapsed into each other. The ceiling is a
 * hairline end-stop, the fill is the plan, and the DATE is already printed in
 * words underneath — so nothing here is carried by colour alone.
 */
function PaceTimeline({ model, preset }: { model: PaceModel; preset: PacePreset }) {
  const pct = Math.max(4, Math.min(100, (preset.days / Math.max(model.daysToCeiling, 1)) * 100))
  return (
    <div
      role="img"
      aria-label={`Finishing ${formatPaceDate(preset.finishIso)}, ${model.daysToCeiling - preset.days} days before the ${
        model.binding === 'exam' ? 'exam deadline' : 'end of your access'
      }.`}
      style={{ position: 'relative', height: 6, borderRadius: 3, background: 'var(--color-border-subtle)' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: `${pct}%`,
          borderRadius: 3,
          background:
            preset.state === 'heavy'
              ? 'var(--color-warning-500)'
              : preset.minsPerNight <= EASY_MINS
                ? 'var(--color-success-500)'
                : 'var(--color-primary-500)',
        }}
      />
    </div>
  )
}
