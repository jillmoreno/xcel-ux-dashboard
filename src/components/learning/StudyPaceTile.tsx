import { useMemo, useState } from 'react'
import { ChevronRight, Clock } from '@/icons'
import { SquareTile } from '@/components/membership/v5/SquareTile'
import { StudyPaceSheet, type PaceChoices } from './StudyPaceSheet'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  presetLabel,
  weekStanding,
  defaultWeekdays,
  EASY_MINS,
  WEEKDAY_LABELS,
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
   * Minutes studied per day this week, Monday-first. Absent ⇒ nothing to read,
   * and the week strip states the SUGGESTED week instead of an actual one.
   *
   * ⚠ IT IS DATA, NOT A DERIVATION, and that is the point. A week's activity
   * inferred from a progress percentage is precisely the "observed rate" this
   * version has refused everywhere else — it would look right and be fiction.
   * The demo personas author it (`STUDY_MINUTES_BY_VARIANT`).
   */
  weekMinutes?: number[]
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
}

export function StudyPaceTile({
  today,
  hoursRemaining,
  accessExpiresAt,
  detailsTo,
  courseTitle,
  examDate,
  weekMinutes,
  layout = 'tile',
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
        /* "RECOMMENDED STUDY PACE" is the design's eyebrow, and it is also
           where the card's provenance now lives — the chip that used to carry
           it is gone, because a chip reading "Recommended" under an eyebrow
           reading "RECOMMENDED STUDY PACE" is the same word twice.

           IT STILL FLIPS. The prototype's §02 finding survives the redesign:
           the product should not go on calling a figure the learner picked a
           recommendation, so the moment anything is adjusted the eyebrow says
           whose pace it is instead. */
        caption={card ? (adjusted ? 'Your Study Pace' : 'Recommended Study Pace') : 'Study Pace'}
        icon={<Clock size={13} />}
        /* THE CARD HAS NO TILE FLOOR. Its one control sits in the body, so
           `to`/`action` would add a second and a third to a treatment whose
           whole argument is that it operates nothing but Customize. */
        to={card ? undefined : detailsTo}
        square={!card}
        surface={card ? 'ruled' : 'recessed'}
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
            plan={choices.plan}
            courseTitle={courseTitle}
            accessExpiresAt={accessExpiresAt}
            examDate={choices.examDate ?? undefined}
            weekMinutes={weekMinutes}
            today={today}
            onCustomize={() => setOpen(true)}
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
 * version's full-width Study Pace tile.
 *
 * REDESIGNED 2026-09-21 from Figma (`JEY1UPqWJ165AVy40in1KQ`, node 733:62),
 * replacing the port of `xcel-pace-presets.html` §02. What the design changes,
 * and it is most of the card:
 *
 *   - THE WEEK IS DRAWN. A seven-day strip shades the nights the pace actually
 *     falls on. That is the biggest addition: the old card said "5 nights a
 *     week" and left the learner to picture it.
 *   - THE PROVENANCE PILL AND THE TIMELINE GO. The eyebrow carries
 *     "RECOMMENDED STUDY PACE", so a second chip saying "Recommended" beneath
 *     it was the same word twice; and the three body lines now state the finish
 *     date and the window in words, which is what the timeline was drawing.
 *   - ONE CONTROL, "Customize Study Plan", replacing Start studying + Adjust.
 *     It opens the SAME sheet Adjust did.
 *
 * WHAT MAKES IT A DIFFERENT ANSWER from the four treatments beside it is
 * unchanged: `rate`, `runway` and `balance` state a QUANTITY and leave the
 * learner to judge whether it is enough. This states the OUTCOME — the date it
 * lands on, and the window it has to land in.
 *
 * IT DOES NOT SHOW `pacingStatus`, and that is a decision rather than an
 * oversight — see the arm in `LearnerFocusedBand`'s `pacingBody`.
 */
function PaceCardBody({
  model,
  preset,
  plan,
  courseTitle,
  accessExpiresAt,
  examDate,
  weekMinutes,
  today,
  onCustomize,
}: {
  model: PaceModel
  preset: PacePreset
  plan: PaceChoices['plan']
  courseTitle?: string
  accessExpiresAt?: string
  examDate?: string
  weekMinutes?: number[]
  today: Date
  onCustomize: () => void
}) {
  /* THE DATE THE LEARNER OWNS, not the model's `hardEndIso`. The ceiling the
     maths uses is expiry minus one (finishing the day access dies is not
     finishing) and the exam minus a revision buffer — both correct, and both
     one day off from the date printed on the learner's receipt. */
  const ceilingIso = model.binding === 'exam' ? examDate : accessExpiresAt
  const examBinds = model.binding === 'exam'

  if (preset.state === 'no') {
    return (
      <div style={cardStack}>
        <p style={cardHeadline}>
          The work left won’t fit before {examBinds ? 'your exam' : 'your access ends'}.
        </p>
        {/* TWO WAYS OUT, NAMED — 2026-09-21, the direct ask: "they will need to
            adjust their study pace drastically or consider extending the course
            to finish the content."

            ⚠ NO FIGURE, and that is the one thing this copy must not do. A pace
            that reaches this state needs more than `CEILING_MINS` a night, and
            the model's own note on that constant says why quoting it is wrong:
            "no number is honest there, and the answer is more time or fewer
            lessons, not a bigger figure." So the card says DRASTICALLY and
            leaves the arithmetic alone — the same rule that stops the
            behind-this-week line printing "7 hours a night".

            The previous copy said "No pace fixes that", which was the model's
            position and not the learner's: a drastic pace does fix it, it is
            just not one we would recommend. Naming both options is the ask. */}
        <p style={cardBody}>
          {examBinds
            ? 'Finishing in time would take a drastic jump in pace. The realistic options are a later exam date, or less to do before it.'
            : 'Finishing in time would take a drastic jump in pace. Consider extending your course access instead — or trimming what is left.'}
        </p>
        <CustomizeLink onClick={onCustomize} />
      </div>
    )
  }

  /* SPLIT FROM ONE FORMATTER'S OUTPUT, not rounded a second time. The design
     sets the figure at 28px and its unit at 20px, so the two need to be
     separate elements — but deriving the number here would give this card its
     own rounding, and `formatEvening`'s quarter-hour rule exists precisely
     because "about 1 hour" for both 68 and 89 minutes makes two different plans
     read as one. So the single formatted string is split on its last space. */
  const [nightFigure, nightUnit] = splitFigure(formatEvening(preset.minsPerNight))
  const weekly = formatEvening(preset.minsPerWeek)

  /** Which nights. The learner's plan when they have built one; otherwise the
   *  same default the sheet would propose, from the shared helper — so the
   *  strip and the plan behind it cannot shade different days. */
  const nights = plan?.weekdays ?? defaultWeekdays(preset.nights)
  const todayIndex = (today.getDay() + 6) % 7
  /** Null when there is nothing studied to compare — a learner at 0% has not
   *  had a bad week, they have not had a week. */
  const standing =
    weekMinutes != null
      ? weekStanding({ weekMinutes, todayIndex, nights, minsPerNight: preset.minsPerNight })
      : null

  return (
    <div style={cardStack}>
      {/* THE HEADLINE. "About" and the trailing clause are the same weight and
          size; only the figure steps up, which is what makes the sentence read
          as a sentence with one number in it rather than as a stat with words
          around it. */}
      <p style={cardHeadline}>
        About{' '}
        <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em' }}>
          {nightFigure}
        </span>{' '}
        {nightUnit} a night, {weekly} a week
      </p>

      <WeekStrip
        nights={nights}
        weekMinutes={weekMinutes}
        target={preset.minsPerNight}
        todayIndex={todayIndex}
      />

      {/* PICK UP THE PACE, as a number they can act on — 2026-09-21.
          Shown only when there IS a shortfall and nights left to spend it on,
          which is the difference between a prompt and a scolding. It reads
          `weekStanding`, which compares minutes done to what this week's
          elapsed nights asked for — NOT progress against the share of the
          window that has elapsed, which would be the invented schedule this
          version refuses.

          ⚠ IT ONLY QUOTES A CATCH-UP IT BELIEVES. Past `CEILING_MINS` — the
          model's own "no number is honest there" threshold — the arithmetic
          still produces a figure and the card stops printing it: answering
          "you are behind" with "7 hours a night" is technically true and
          practically nothing. Caught by reading the rendered card, not by a
          test: every assertion passed while it said exactly that. */}
      {standing?.behind ? (
        <p style={{ ...cardBody, color: 'var(--color-warning-800)' }}>
          {standing.recoverable ? (
            <>
              You are <b style={emphasis}>{formatEvening(standing.shortfall)}</b> short this week.{' '}
              <b style={emphasis}>{formatEvening(standing.catchUpPerNight)}</b> a night for the rest
              of it catches you up.
            </>
          ) : (
            <>
              You are <b style={emphasis}>{formatEvening(standing.shortfall)}</b> short this week.
              {standing.nightsLeft > 0
                ? ' No evening left in it realistically closes that.'
                : ' There are no study nights left in it.'}{' '}
              Next week carries the difference.
            </>
          )}
        </p>
      ) : null}

      <div style={cardBody}>
        {/* LINE ONE — the window. Omitted entirely when nothing bounds it:
            with no access window and no exam date the model aims at a default
            horizon, and "you have 14 days left to finish the course material"
            would be a deadline the data does not have. */}
        {ceilingIso ? (
          <p style={{ margin: 0 }}>
            You have <b style={emphasis}>{model.daysToCeiling} days</b> left to finish the course
            material. ({examBinds ? 'Your exam is on ' : 'Access ends on '}
            {formatPaceDate(ceilingIso)}.)
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            {courseTitle ?? 'This course'} has no access deadline, so the date below is a suggested
            target rather than a cut-off.
          </p>
        )}
        <p style={{ margin: 0 }}>
          At this pace, you will finish around <b style={emphasis}>{formatPaceDate(preset.finishIso)}</b>.
        </p>
        <p style={{ margin: 0 }}>
          Your estimated finish date will update as your study pace changes.
        </p>
      </div>

      <CustomizeLink onClick={onCustomize} />
    </div>
  )
}

/**
 * The week, with the studied nights shaded.
 *
 * DECORATION, and `aria-hidden` accordingly: the sentence above it already
 * states the pace in words ("1¾ hours a night, 8¾ hours a week"), and a screen
 * reader walking seven day names to count four of them learns nothing the
 * sentence did not say. The accessible name therefore never depends on which
 * cells are filled — the rule this card's own brief set.
 *
 * ⚠ TOKENS, not the design's hexes. Figma draws the filled cells `#d0ddf0` on
 * `#d4d9e0` with `#124691` ink — a light-mode-only palette that would be a flat
 * pale blue block on the dark card. `--color-primary-100` / `-700` are the
 * ramp's own stops for exactly this (a tinted fill with ink that survives the
 * theme flip), and the unstudied cells take the same `--color-border-subtle`
 * hairline the rest of this surface uses.
 */
function WeekStrip({
  nights,
  weekMinutes,
  target,
  todayIndex,
}: {
  nights: number[]
  weekMinutes?: number[]
  target: number
  todayIndex: number
}) {
  /* TWO MODES, and which one shows is a question of whether there is anything
     to read — not of how far along the learner is.

       • SUGGESTION (no `weekMinutes`): the nights this pace falls on, tinted.
         What the card has always shown.
       • ACTUAL (`weekMinutes` present): how much of each day's target was
         actually studied, as a fill level. Authored per demo persona; see
         `STUDY_MINUTES_BY_VARIANT` for why it is data rather than a derivation.

     ⚠ ONLY ELAPSED DAYS READ AS ACTUAL. A Thursday that has not happened is not
     a Thursday they missed, and filling it grey would say it was. Days after
     today stay empty rings.

     ⚠ AT THE FIXTURE CLOCK THIS SHOWS ONE FILLED CIRCLE. `FIXTURE_TODAY` is a
     MONDAY, so exactly one day of the Mon-first week has elapsed — the feature
     is correct and nearly invisible. Two ways out, both decisions rather than
     fixes: anchor the strip to the trailing seven days (which breaks its
     alignment with `plan.weekdays`, the Mon-first set the sheet writes), or
     move the demo clock off a Monday. Left as-is deliberately; the honest
     rendering of a week that has just begun is a week that has just begun. */
  const actual = weekMinutes != null
  return (
    <div aria-hidden style={{ display: 'flex', gap: 6 }}>
      {WEEKDAY_LABELS.map((label, i) => {
        const planned = nights.includes(i)
        const elapsed = i <= todayIndex
        const done = actual && elapsed ? Math.min(1, (weekMinutes[i] ?? 0) / Math.max(target, 1)) : 0
        /* In ACTUAL mode a day is "on" once any of it is done; in SUGGESTION
           mode it is "on" if the pace falls there. The ring, the ink and the
           fill all follow that one boolean so a half-done day cannot end up
           with a studied ring and unstudied ink. */
        const on = actual ? done > 0 : planned
        return (
          <span
            key={label}
            style={{
              width: 28,
              height: 28,
              flex: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
              /* THE FILL RISES FROM THE BOTTOM, which is what makes a partial
                 day read as partial rather than as a different colour. A
                 conic sweep would read as a timer; a level reads as an amount,
                 which is what minutes-against-a-target is. */
              background: on
                ? `linear-gradient(to top, var(--color-primary-100) ${Math.round(
                    (actual ? done : 1) * 100,
                  )}%, transparent ${Math.round((actual ? done : 1) * 100)}%)`
                : 'transparent',
              boxShadow: `inset 0 0 0 1px ${
                on ? 'var(--color-primary-400)' : 'var(--color-border-subtle)'
              }`,
              color: on ? 'var(--color-primary-700)' : 'var(--color-text-tertiary)',
            }}
          >
            {label.slice(0, 1)}
          </span>
        )
      })}
    </div>
  )
}

/**
 * The card's one control, bottom-right.
 *
 * ⚠ NOT THE DESIGN'S MAGENTA (`#a24796`). That is the CRE file's accent, and on
 * XCEL the equivalent ramp is the Brick — a FILL colour measuring 2.05:1 as
 * TEXT on the dark shell, and the ramp this version deliberately moved every
 * CTA off on 2026-09-16 ("navy means do this; red means this is an
 * assessment"). `.cre-cta-ink` is that decision's owner and carries the
 * dark-mode swap a hex cannot.
 *
 * It opens the SAME sheet `Adjust` opened — the three finish dates, days a
 * week, the exam date and the study-plan calendar. A second sheet for a renamed
 * button is how the two would drift.
 */
function CustomizeLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="cre-link-action cre-cta-ink"
      style={{
        alignSelf: 'flex-end',
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      Customize Study Plan
      <ChevronRight size={14} aria-hidden />
    </button>
  )
}

/** `"1¾ hours"` → `["1¾", "hours"]`; `"45 min"` → `["45", "min"]`. A display
 *  split of ONE formatter's output — see the note at its call site. */
function splitFigure(s: string): [string, string] {
  const i = s.lastIndexOf(' ')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}

const cardStack = { display: 'flex', flexDirection: 'column', gap: 14 } as const

/* `--font-heading` rather than the body face: this is the tile's heading in
   everything but markup, so it follows `dashboard-heading-font` like every
   other one on the page — a body-face headline here would be the one that
   stayed sans under the serif variant. The design's Source Serif 4 IS that
   token's serif stop. */
const cardHeadline = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  lineHeight: '30px',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
} as const

const cardBody = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
} as const

const emphasis = { color: 'var(--color-text-primary)', fontWeight: 700 } as const
