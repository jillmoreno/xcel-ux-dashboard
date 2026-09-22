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
  dateFromIso,
  daysBetween,
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
  /**
   * ISO yyyy-mm-dd — the learner's BOOKED exam date, from `examDateStore`,
   * entered on the Schedule State Exam card.
   *
   * THREADED IN 2026-09-21, when `presets` became the default view's treatment.
   * Without it this surface was the one place on the page that did not know the
   * date: the header's Target Exam Date and its countdown both re-point off the
   * store, while the pace kept pricing against course access alone. Harmless
   * while the exam sat outside the access window (access binds, and the card
   * was right for the wrong reason) and wrong the moment it sat inside — the
   * card would quote a finish date LATER than the exam it was meant to prepare
   * for, which is precisely the cross-surface disagreement `EXAM_BUFFER_DAYS`
   * was made equal to the study plan's own constant to avoid.
   *
   * It SEEDS `choices` rather than bypassing them, so the sheet's own exam
   * field shows the same date and the two cannot render different models. See
   * `adjusted` for why a seeded date does not count as the learner adjusting.
   */
  examDate?: string
  /**
   * WHICH SHAPE — added 2026-09-21 with `dashboard-pacing-style: presets`.
   *
   *   - `'tile'` (default) is Testing 2's square: a pace chip, the evening, a
   *     hairline timeline and a finish date, with `Adjust` on the tile floor
   *     beside `Details →`. Unchanged.
   *   - `'card'` is the Testing version's fifth pacing treatment — the wide
   *     card from `xcel-pace-presets.html` §02, which states the same derived
   *     pace as a sentence and ends in two real buttons.
   *
   * ONE PROP ON THIS COMPONENT rather than a second component, and that is the
   * whole reason the variant is cheap: the model, the `choices` state and the
   * sheet are identical in both shapes, and only the arrangement differs. A
   * `StudyPaceCard` beside this would own a second copy of `choices` and a
   * second `StudyPaceSheet` mount, which is how the two shapes start
   * disagreeing about what "adjusted" means.
   */
  layout?: 'tile' | 'card'
  /**
   * What the card's PRIMARY button does. Card layout only.
   *
   * Optional, and the button is omitted without it rather than rendered inert:
   * "Start studying" that starts nothing is the invented affordance this
   * version keeps refusing. The band passes its own course launcher — the same
   * `launcher.open(resume.id)` the Resume CTA above it calls, so the two
   * buttons on one page cannot open different things.
   */
  onStart?: () => void
}

export function StudyPaceTile({
  today,
  hoursRemaining,
  accessExpiresAt,
  detailsTo,
  courseTitle,
  examDate,
  layout = 'tile',
  onStart,
}: StudyPaceTileProps) {
  const [open, setOpen] = useState(false)
  /**
   * Everything the sheet can change, held here rather than in the sheet, so
   * closing it does not throw the learner's choices away. `null` means "we have
   * not been told" — which is how the tile knows whether to keep calling its
   * own number a recommendation.
   */
  /** The exam date we STARTED with — the learner's booked one, if the page
   *  already knows it. Kept so `adjusted` can tell "the product was told this"
   *  from "the learner changed it here". */
  const seededExamDate = examDate ?? null
  const [choices, setChoices] = useState<PaceChoices>({
    presetId: null,
    nights: null,
    examDate: seededExamDate,
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
   *  of it is the learner's, the tile stops claiming credit for it.
   *
   *  ⚠ THE EXAM DATE IS COMPARED TO ITS SEED, not to null. A date the learner
   *  booked on the Schedule State Exam card is something the product was TOLD,
   *  not something they changed here — treating it as an adjustment would make
   *  a freshly-loaded page open on "· yours" with its provenance clause already
   *  suppressed, which is the opposite of what both say. Changing it in the
   *  sheet still counts, because then it differs from the seed. */
  const adjusted =
    choices.presetId != null ||
    choices.nights != null ||
    choices.examDate !== seededExamDate ||
    choices.style !== 'average'

  const card = layout === 'card'

  return (
    <>
      <SquareTile
        /* THE EYEBROW CARRIES THE PROVENANCE in the card shape, and it is the
           one thing on it that changes the moment the learner touches
           anything — the prototype's §02 finding, kept verbatim: "the product
           should not keep calling a number the learner picked a
           recommendation". The square keeps the bare caption, where the same
           fact is already on the chip a few pixels below it. */
        caption={
          card ? (
            <>
              Study Pace
              <span style={{ color: 'var(--color-text-tertiary)' }}>
                {' '}· {adjusted ? 'yours' : 'recommended'}
              </span>
            </>
          ) : (
            'Study Pace'
          )
        }
        icon={<Clock size={13} />}
        /* THE CARD HAS NO TILE FLOOR. Its controls are two real buttons in the
           body, so `to`/`action` would add a third and a fourth control to a
           treatment whose whole argument is that it operates nothing except
           Start and Adjust. */
        to={card ? undefined : detailsTo}
        square={!card}
        action={
          card ? undefined : (
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
          )
        }
      >
        {card ? (
          <PaceCardBody
            model={model}
            preset={selected}
            adjusted={adjusted}
            plan={choices.plan}
            today={today}
            courseTitle={courseTitle}
            accessExpiresAt={accessExpiresAt}
            examDate={choices.examDate ?? undefined}
            onAdjust={() => setOpen(true)}
            onStart={onStart}
          />
        ) : (
          <PaceBody model={model} preset={selected} adjusted={adjusted} plan={choices.plan} />
        )}
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

/* ─── the CARD shape (`layout="card"`) ───────────────────────────────────
 *
 * `dashboard-pacing-style: presets` — the FIFTH treatment of the Testing
 * version's full-width Study Pace tile, ported from
 * `public/prototypes/xcel-pace-presets.html` §02.
 *
 * WHAT MAKES IT A DIFFERENT ANSWER from the four beside it, rather than a
 * restyle of one: `rate`, `runway` and `balance` all state a QUANTITY and leave
 * the learner to judge whether it is enough. This one states the OUTCOME — a
 * date, and how much room is left after it — and the quantity is the
 * subordinate clause. It is the only treatment that answers "am I pacing to
 * finish in time" with yes-or-no rather than with a number.
 *
 * IT DOES NOT SHOW `pacingStatus`, and that is a decision rather than an
 * oversight — see the arm in `LearnerFocusedBand`'s `pacingBody` for the
 * reasoning and for what it costs.
 */
function PaceCardBody({
  model,
  preset,
  adjusted,
  plan,
  today,
  courseTitle,
  accessExpiresAt,
  examDate,
  onAdjust,
  onStart,
}: {
  model: PaceModel
  preset: PacePreset
  adjusted: boolean
  plan: PaceChoices['plan']
  today: Date
  courseTitle?: string
  accessExpiresAt?: string
  examDate?: string
  onAdjust: () => void
  onStart?: () => void
}) {
  /* THE DATE THE LEARNER OWNS, not the model's `hardEndIso`. The ceiling the
     maths uses is expiry minus one (finishing the day access dies is not
     finishing) and the exam minus a revision buffer — both correct, and both
     one day off from the date printed on the learner's receipt. The sentence
     names the date they recognise and the timeline ends on the same one, so
     the two cannot disagree by a day. */
  const ceilingIso = model.binding === 'exam' ? examDate : accessExpiresAt
  const ceiling = dateFromIso(ceilingIso)
  const finish = dateFromIso(preset.finishIso)
  /** Days of room between finishing and the ceiling. Null when there is no
   *  ceiling at all, where "5 days before nothing" is not a sentence. */
  const slack = ceiling && finish ? daysBetween(finish, ceiling) : null

  const controls = (
    <CardControls onAdjust={onAdjust} onStart={onStart} model={model} preset={preset} />
  )

  if (preset.state === 'no') {
    return (
      <div style={cardStack}>
        <PaceChip tone="critical">Won’t fit</PaceChip>
        <p style={cardHead}>
          The work left won’t fit before{' '}
          {model.binding === 'exam' ? 'your exam' : 'your access ends'}.
        </p>
        <p style={cardBody}>
          {model.binding === 'exam'
            ? 'No pace fixes that. A later exam date, or less to do before it.'
            : 'No pace fixes that. The honest options are an extension, or less to do.'}
        </p>
        {controls}
      </div>
    )
  }

  return (
    <div style={cardStack}>
      {/* THE PILL, and the reason it is `PaceChip` rather than a new element:
          this axis (how heavy the chosen pace is, and whose choice it was)
          already has a chip with a documented tone map, and a second one a few
          pixels away would be the drift `widgetStyles.ts` exists to stop. */}
      <PaceChip tone={preset.state === 'heavy' ? 'warning' : adjusted ? 'positive' : 'neutral'}>
        {adjusted ? presetLabel(preset) : 'Recommended'}
        {preset.state === 'heavy' ? ' · heavy' : ''}
      </PaceChip>

      <p style={cardHead}>
        About{' '}
        <b style={{ fontWeight: 800 }}>{formatEvening(preset.minsPerNight)} a night</b>,{' '}
        {preset.nights} nights a week.
      </p>

      <p style={cardBody}>
        Finishes{courseTitle ? ' ' : ' your course'}
        {courseTitle ? <b style={emphasis}>{courseTitle}</b> : null} by{' '}
        <b style={emphasis}>{formatPaceDate(preset.finishIso)}</b>
        {slack != null && ceilingIso ? (
          <>
            , {slack} {slack === 1 ? 'day' : 'days'} before{' '}
            {model.binding === 'exam' ? 'your exam on' : 'access ends on'}{' '}
            {formatPaceDate(ceilingIso)}
          </>
        ) : null}
        .{/* WHERE THE NUMBER CAME FROM, and ONLY while the number is still ours
             — the moment the learner adjusts anything, the product has no claim
             left to make about its own provenance.

             IT NAMES THE CEILING, NOT A WINDOW LENGTH. The prototype said "set
             from your 30-day access", which was true of the pre-licensing
             window it assumed and is false of this fixture's year of access —
             and would go on being false for any course whose window differs.
             The ceiling is the fact the model actually used, it is already on
             screen two clauses up, and it stays true when an exam date takes
             over as the thing doing the work. */}
        {adjusted ? null : (
          <>
            {' '}
            {model.binding === 'exam'
              ? 'Set from your exam date, not from a guess.'
              : model.binding === 'both'
                ? 'Set from your exam date and your access, not from a guess.'
                : model.binding === 'access'
                  ? 'Set from when your access ends, not from a guess.'
                  : /* NO CEILING — and this is the ONE case where the card must
                       not claim the date is sourced, because it is not. With
                       neither an access window nor an exam date the model has
                       nothing to aim at and falls back to the Focused horizon
                       (`FOCUSED_DAYS`, the storefront's "less than 2 weeks"):
                       a sensible DEFAULT, but a default is exactly what "not
                       from a guess" denies. So the claim is dropped and the
                       date is labelled for what it is. The alternative — saying
                       nothing — leaves a finish date on the card with no
                       explanation, which reads as a deadline. */
                  'This course has no access deadline, so that date is a suggested target rather than a cut-off.'}
          </>
        )}
        {preset.state === 'heavy' ? <> <b style={emphasis}>That is a heavy evening.</b></> : null}
        {plan ? ' Your study plan is on the calendar.' : null}
      </p>

      <PaceCardTimeline today={today} model={model} preset={preset} ceilingIso={ceilingIso} />
      {controls}
    </div>
  )
}

/**
 * Today → the ceiling, with the chosen finish marked on it.
 *
 * DECORATION, and deliberately so: every fact it draws — the finish date, the
 * room after it, and the date access ends — is printed in words in the sentence
 * directly above and in the two labels beside it. So the graphic is
 * `aria-hidden` and the LABELS are not, which is what keeps the accessible name
 * off colour and off position.
 *
 * ⚠ `--color-text-tertiary` for the fill, NOT `--color-primary-500`. This is
 * the same call `runwayStrip` records one file over: tertiary measures 6.19:1
 * light / 6.18:1 dark, which is unusually symmetric, so the strip needs no
 * theme swap — where the primary and the track are both navies in dark and the
 * fill lands near 1.2:1, the exact failure `.cre-jbi-progress-fill` exists for.
 */
function PaceCardTimeline({
  today,
  model,
  preset,
  ceilingIso,
}: {
  today: Date
  model: PaceModel
  preset: PacePreset
  ceilingIso?: string
}) {
  const ceiling = dateFromIso(ceilingIso)
  /* The track spans to the date the LABEL names, so the end-stop and the words
     under it are the same day. Falls back to the model's own ceiling when there
     is no dated one to draw to. */
  const span = Math.max(ceiling ? daysBetween(today, ceiling) : model.daysToCeiling, 1)
  const pct = Math.max(3, Math.min(100, (preset.days / span) * 100))
  return (
    <div>
      <div
        aria-hidden
        style={{
          position: 'relative',
          height: 8,
          margin: '2px 0 8px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-border-subtle)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: '0 auto 0 0',
            width: `${pct}%`,
            borderRadius: 'var(--radius-pill)',
            background: 'var(--color-text-tertiary)',
          }}
        />
        {/* The finish, as a dot ON the fill. Ringed in the tile's own fill so it
            stays legible where it lands hard against the end-stop. */}
        <span
          style={{
            position: 'absolute',
            top: -2,
            left: `${pct}%`,
            width: 12,
            height: 12,
            marginLeft: -6,
            borderRadius: '50%',
            background: 'var(--color-text-primary)',
            boxShadow: '0 0 0 2px var(--color-surface-card)',
          }}
        />
        {/* The HARD END-STOP — a full-height tick, not a marker on the track:
            it is the one point on this line that is not a choice.

            DRAWN ONLY WHEN THERE IS ONE. With no access window and no exam date
            the model aims at a default horizon, and a hard stop drawn on a date
            nothing enforces is the graphic saying what the sentence above it
            refuses to. The track then runs Today → the finish dot and stops. */}
        {ceilingIso ? (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: 0,
              width: 2,
              height: 14,
              borderRadius: 1,
              background: 'var(--color-text-primary)',
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.01em',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Today</span>
        {ceilingIso ? (
          <span>
            {model.binding === 'exam' ? 'Exam' : 'Access ends'} · {formatPaceDate(ceilingIso)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

/**
 * The two buttons, and the whole of what this card operates.
 *
 * START IS A NAVY FILL, not the Brick. `--color-action` is a FILL colour that
 * measures 2.05:1 as TEXT on the dark shell, and this version moved every CTA
 * onto the primary ramp on 2026-09-16 — navy means "do this", red means "this
 * is an assessment" (see `.cre-cta-ink` in tokens.css). The filled shape is the
 * one the Study Journey's own Save button already uses, rather than a fifth
 * button treatment.
 *
 * ADJUST takes its ink AND its stroke from `.cre-cta-ink` with
 * `borderColor: currentColor` and NO inline colour — the shared
 * `Button variant="secondary"` draws both from `--color-action`, and an inline
 * value would beat the class's dark-mode swap while looking correct.
 */
function CardControls({
  onAdjust,
  onStart,
  model,
  preset,
}: {
  onAdjust: () => void
  onStart?: () => void
  model: PaceModel
  preset: PacePreset
}) {
  const stuck = preset.state === 'no'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
      {onStart && !stuck ? (
        <button
          type="button"
          onClick={onStart}
          /* `.cre-cta-fill` owns BOTH the fill and the label ink, and this
             button sets neither inline. The navy is 2.75:1 against the dark
             card — under the 3:1 a control's shape needs — so dark inverts the
             pair, and a theme selector is the only thing that can carry that.
             An inline `background` here would beat the class while looking
             perfectly correct in light mode. */
          className="cre-cta-fill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            padding: '0 18px',
            borderRadius: 'var(--radius-md)',
            border: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Start studying
        </button>
      ) : null}
      <button
        type="button"
        onClick={onAdjust}
        aria-haspopup="dialog"
        className="cre-cta-ink"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 40,
          padding: '0 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid currentColor',
          cursor: 'pointer',
          background: 'transparent',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {stuck && model.binding === 'exam' ? 'Change my exam date' : 'Adjust'}
      </button>
    </div>
  )
}

const cardStack = { display: 'flex', flexDirection: 'column', gap: 10 } as const

/* `--font-heading` rather than the body face, for the reason `pacingFigureStyle`
   records one file over: this is the tile's heading in everything but markup,
   so it has to follow `dashboard-heading-font` like every other one on the page
   — a body-face head here would be the one that stayed sans under the serif
   variant. */
const cardHead = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 19,
  lineHeight: '25px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
} as const

const cardBody = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
} as const

const emphasis = { color: 'var(--color-text-primary)', fontWeight: 600 } as const
