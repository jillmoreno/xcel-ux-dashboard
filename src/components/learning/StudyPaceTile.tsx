import { useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import {
  ChevronRight,
  CircleInfo,
  Clock,
  Loveseat,
  MugHot,
  PersonRunningFast,
} from '@/icons'
import { SquareTile } from '@/components/membership/v5/SquareTile'
import { StudyPaceSheet, type PaceChoices } from './StudyPaceSheet'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  observedPace,
  weekStanding,
  defaultWeekdays,
  NOT_STARTED_NIGHTS,
  MIN_STUDY_HOURS,
  EASY_MINS,
  WEEKDAY_LABELS,
  type PacePreset,
  type PaceModel,
  type PresetId,
  paceNameFor,
  paceOptionsFor,
  type PaceOption,
  daysToReviewFor,
  simulateSchedule,
  activeDays,
  daysUntil,
  daysBetween,
  dateFromIso,
} from '@/lib/studyPace'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { Tooltip } from '@/components/ui/Tooltip'

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
  /** The last 30 days, oldest first, ending today — the activity streak's
   *  history. Authored per persona; see `STUDY_ACTIVITY_BY_VARIANT`. Absent ⇒
   *  the week strip stays, which is also what 0% wants. */
  dailyMinutes?: number[]
  /**
   * WHICH SHAPE — added 2026-09-21 with the presets treatment.
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
   * The learner has not started the course — 2026-09-22, the direct ask.
   *
   * Two things change, and only at 0%: the week defaults to
   * `NOT_STARTED_NIGHTS` (four, Mon–Thu) instead of the nights `buildPreset`
   * would derive, and the sentence's second clause states DAYS A WEEK rather
   * than hours a week.
   *
   * AN EXPLICIT PROP, not inferred from `weekMinutes == null`. That prop is
   * authored per persona and absent for plenty of learners who HAVE started, so
   * reading it as "not started" would hand the beginner's default to someone
   * mid-course. The caller knows the percentage; it passes it.
   */
  notStarted?: boolean
}

export function StudyPaceTile({
  today,
  hoursRemaining,
  accessExpiresAt,
  detailsTo,
  courseTitle,
  examDate,
  weekMinutes,
  dailyMinutes,
  layout = 'tile',
  notStarted = false,
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
  /*
   * THE PACING DEMO CONTROL — `study-pace-preset`, 2026-09-23.
   *
   * SEEDS `choices.presetId`, the same field the Adjust sheet writes, rather
   * than overriding the selected preset downstream. That is what makes the
   * comparison honest: the card treats a seeded preset exactly as it treats a
   * chosen one, so its heading flips to "Focused & Quick Study Pace" and its
   * `adjusted` branch fires — which is the state a reviewer is trying to see.
   * Overriding further down would have shown the plan while the card still
   * called it Recommended.
   *
   * `recommended` SEEDS NOTHING, deliberately. `presetId: null` is the model's
   * own suggestion standing, and writing `'recommended'` into it would make a
   * freshly-loaded page read as adjusted before anyone touched anything — the
   * same defect the `examDate !== seededExamDate` comparison exists to avoid a
   * few lines down.
   */
  const seededPreset = useFeatureFlag('study-pace-preset').variant ?? 'recommended'
  /* READ ABOVE THE MODEL, because the model's nights depend on it — see
     `optionNights`. One hook, unconditionally, per this file's header. */
  const chooserVariant = useFeatureFlag('study-pace-chooser').variant ?? 'options'
  const [choices, setChoices] = useState<PaceChoices>({
    presetId: seededPreset === 'recommended' ? null : (seededPreset as PresetId),
    nights: null,
    examDate: seededExamDate,
    style: 'average',
    approach: null,
    schedule: null,
    plan: null,
  })

  /*
   * THE THREE PLANS — derived from the INPUT rather than from the model, which
   * is what lets them sit above it and feed it.
   *
   * ⚠ THEY HAVE TO FEED IT, and a first build did not. The picker priced
   * "Focused & Quick" at seven nights while the card underneath re-derived its
   * own nights from `suggestedNights` and printed five hours over four — so the
   * option a learner had selected stated one plan and the sentence below it
   * stated another. On the `options` chooser the picker is the authority: its
   * nights are the model's nights until the learner says otherwise.
   */
  const options = useMemo(
    () =>
      paceOptionsFor({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate: choices.examDate ?? undefined,
        style: choices.style,
      }),
    [today, hoursRemaining, accessExpiresAt, choices.examDate, choices.style],
  )
  /** The nights the SELECTED option asks for — Recommended until one is
   *  picked, which is also the plan the card should open on. */
  const optionNights = (
    options.find((o) => o.id === (choices.presetId ?? 'recommended')) ?? options[1]
  )?.nights

  const model: PaceModel = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate: choices.examDate ?? undefined,
        /* The learner's choice first; then the beginner's four; then the
           derivation. `notStarted` only ever supplies a DEFAULT — picking a
           nights count in the sheet overrides it like any other. */
        /* The learner's own first; then the picker's, when that is the chooser
           on show; then the beginner's four. `optionNights` is what keeps the
           card's sentence agreeing with the option lit above it. */
        nights:
          choices.nights ??
          (chooserVariant === 'options' ? optionNights : undefined) ??
          (notStarted ? NOT_STARTED_NIGHTS : undefined),
        style: choices.style,
      }),
    [
      today,
      hoursRemaining,
      accessExpiresAt,
      choices.examDate,
      choices.nights,
      choices.style,
      notStarted,
      chooserVariant,
      optionNights,
    ],
  )

  /**
   * THE SAVED WEEK BEATS THE DERIVED PRESET — 2026-09-22.
   *
   * Without this the sheet lies. Its footer states "your dashboard will show:
   * 16 hours a week, finishing around May 23" beside the Save button, the
   * learner presses it, and the card goes on reporting the preset's own May 29
   * — because the tile re-derived a pace from `nights` and never looked at the
   * week that was actually built. The footer's promise is the contract; this is
   * what keeps it.
   *
   * `simulateSchedule` against `model.hardEndIso`, so the card and the sheet
   * measure the same deadline — including an exam date that binds earlier.
   */
  const sim = useMemo(
    () =>
      choices.schedule
        ? simulateSchedule({
            today,
            hoursRemaining,
            hoursByWeekday: choices.schedule,
            hardEndIso: model.hardEndIso,
          })
        : null,
    [choices.schedule, today, hoursRemaining, model.hardEndIso],
  )

  const derived: PacePreset =
    (choices.presetId && model.presets.find((p) => p.id === choices.presetId)) || defaultPreset(model)
  /* The preset the card SPEAKS. A saved week overrides the finish date and the
     nightly figure with its own — the same preset shape, so every consumer
     below is unchanged and none of them needs to know where it came from. */
  const selected: PacePreset = sim
    ? {
        ...derived,
        finishIso: sim.finishIso,
        days: Math.max(0, daysUntil(sim.finishIso, today) ?? derived.days),
        nights: sim.daysPerWeek,
        minsPerNight: Math.round((sim.hoursPerWeek / Math.max(1, sim.daysPerWeek)) * 60),
        minsPerWeek: Math.round(sim.hoursPerWeek * 60),
        /* A saved week that overruns is `no` whatever the preset said — the
           learner built it, and the card must not congratulate it. */
        state: sim.bufferDays < 0 ? 'no' : derived.state,
      }
    : derived
  /** Untouched ⇒ the number is still ours to call "recommended". The moment any
   *  of it is the learner's, the tile stops claiming credit for it.
   *
   *  ⚠ THE EXAM DATE IS COMPARED TO ITS SEED, not to null. A date the learner
   *  booked on the Schedule State Exam card is something the product was TOLD,
   *  not something they changed here — treating it as an adjustment would make
   *  a freshly-loaded page open on "· yours" with its provenance clause already
   *  suppressed, which is the opposite of what both say. Changing it in the
   *  sheet still counts, because then it differs from the seed. */
  /*
   * `adjusted` LIVED HERE and lost its last consumer on 2026-09-23, when the
   * card's name stopped asking "did the learner change anything" and started
   * asking "how much review does this plan leave" — see `paceNameFor`, whose
   * own note records what that narrowed.
   *
   * WHAT IT KNEW, for whoever needs it back: a pace is adjusted when
   * `presetId`, `schedule` or `nights` is set, the style is off `average`, or
   * the exam date differs from `seededExamDate` — that last comparison rather
   * than a null check, because a date the DEMO seeded is not something the
   * learner changed, and treating it as one made a freshly-loaded page open as
   * though they had.
   */

  /**
   * WHICH DAYS THE STRIP SHADES. `plan.weekdays` when the learner put the plan
   * on a calendar, the saved WEEK's own days when they built one but left the
   * calendar switch off, and the model's suggestion only when there is neither.
   *
   * The middle case is the one that was wrong: a learner who set Thursday,
   * Saturday and Sunday and did not want calendar entries still got a strip
   * shading Mon–Wed, because the card read `plan` and a `null` plan told it
   * nothing. Building a week and putting it on a calendar are two different
   * decisions, and only the second one is about the calendar.
   */
  const studyDays: number[] | null =
    choices.plan?.weekdays ?? (choices.schedule ? activeDays(choices.schedule) : null)

  /*
   * `paceLabel` LIVED HERE and was removed 2026-09-23, when the badge became
   * one of four fixed names — see `paceBadgeLabel`, which is where its logic
   * went and which both surfaces now call.
   *
   * ⚠ THE RULE IT CARRIED SURVIVED THE MOVE, and it is the one thing to check
   * if this ever comes back: `presetLabel` answers "what is this pace called"
   * only while the pace IS a preset. A week the learner built on the Adjust
   * screens has no preset behind it — `presetId` stays null, so the label fell
   * through to `defaultPreset`'s own name and went on saying "Recommended"
   * about a schedule the product never recommended. `paceBadgeLabel` answers
   * `Custom` there for exactly that reason.
   */

  /* THE CEILING THE PLAN WAS PRICED AGAINST, and the review gap it leaves.
     Derived HERE rather than in the stats row, because the card's NAME reads it
     too — two derivations is how a heading comes to disagree with the cell
     three lines under it. */
  const ceilingForName = model.binding === 'exam' ? (choices.examDate ?? undefined) : accessExpiresAt
  const daysToReview = daysToReviewFor(selected.finishIso, ceilingForName)

  /*
   * HOW THE CARD OFFERS A CHOICE — `study-pace-chooser`, 2026-09-23.
   *
   * `options` puts three named plans under a plain "Study Pace" heading;
   * `strip` keeps the derived heading and the clickable week. Both are live and
   * neither is a rename of the other: the strip asks WHICH EVENINGS, the
   * options ask WHICH PLAN, and the second is the direction the ask moved to.
   */

  /** Which of the three is showing. Matched on the PRESET the model resolved,
   *  so a pace arrived at through the sheet still lights the right option. */
  const activeOption = options.find((o) => o.id === selected.id)?.id ?? null

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
        caption={
          <>
            {/* THE NAME IS THE CARD'S NAME — 2026-09-23. It was
                "Recommended Study Pace" hard-coded, with the preset's name in a
                badge beside it; the badge is gone and the eyebrow takes the
                name, so "Focused & Quick Study Pace" and "Steady & Relaxed
                Study Pace" read as what this card IS rather than as a label
                stuck on it.
            
                IT STILL FLIPS TO THE LEARNER'S. `paceBadgeLabel` answers
                "Custom" for a week they built, so the eyebrow says "Custom
                Study Pace" — which keeps the provenance rule the old
                "Your Study Pace" was there for: the product must not go on
                calling a figure the learner picked a recommendation. */}
            {/* THREE HEADINGS FOR THREE JOBS.
            
                `strip` NAMES THE CURRENT PLAN — "Steady & Relaxed Study Pace" —
                because that treatment has no picker and the heading is the only
                place the plan is named.
            
                `options` INVITES — "Set your Study Pace (optional)", the direct
                ask of 2026-09-23. The three plans are right underneath, so the
                heading's job is to say they are a choice rather than a readout,
                and "(optional)" says the card is useful without one: the
                learner already has a pace, and picking is how they change it
                rather than a step they owe us.
            
                The bare tile keeps "Study Pace" — it has neither a picker nor a
                name to carry. */}
            {/* ⚠ A FOURTH CASE, 2026-09-23: on `options`, the invitation is
                only for a learner who has not started. The direct ask — "Set
                Your Study Pace will be updated to the Recommended Study Pace"
                — follows from the picker going away at 63%: a heading that
                says "Set" above a card with nothing to set on it is a control
                that has gone missing rather than a state that has moved on.

                ⚠ THE NAME COMES FROM THE SELECTED OPTION, NOT FROM
                `paceNameFor`, and the two genuinely disagree here. The `strip`
                branch derives its name from the review gap, which is right
                there because that treatment has no picker and nothing else to
                name. On `options` the learner's chosen plan IS the pace, and at
                63% the gap arithmetic would call the Recommended plan "Steady &
                Relaxed" — 17 days of access against a 13-day finish leaves 4
                days of review, under `paceNameFor`'s 7-day cut. Naming the card
                after a plan the learner never picked, while the picker that
                would have shown the truth is hidden, is the one failure this
                heading cannot have. */}
            {!card
              ? 'Study Pace'
              : chooserVariant === 'strip'
                ? `${paceNameFor(daysToReview)} Study Pace`
                : notStarted
                  ? /* ⚠ "SELECT YOUR PREFERRED", NOT "Set your … (optional)" —
                       2026-09-23. The card now states its own provenance in a
                       subtext line underneath (see `PaceCardBody`), and
                       "(optional)" was doing a weaker version of that job: it
                       said the learner owes us nothing, where the subtext says
                       what happens to the number afterwards. "Preferred" is
                       what carries the optionality now — a preference is a
                       starting point, not a commitment, which is exactly what
                       the subtext then promises. */
                    'Select Your Preferred Study Pace'
                  : /* ⚠ "YOUR", NOT THE PLAN'S NAME — 2026-09-23. It read
                       "Recommended Study Pace" (or whichever plan was lit),
                       which is a claim about what the product SUGGESTS. From
                       the first studied evening the card reports what the
                       learner is actually doing, so the heading stops naming a
                       recommendation and starts naming an owner. The card's
                       own subtext says where the figure comes from.

                       This is the provenance rule the file has carried since
                       the prototype's §02 finding — "the product should not go
                       on calling a figure the learner picked a
                       recommendation" — applied one step earlier: not when
                       they ADJUST it, but as soon as it is measured from them
                       rather than proposed to them. */
                    'Your Study Pace'}
            {/*
              THE PACE PILL, ON THE TILE'S TOP RIGHT — 2026-09-23, the direct
              ask when the Status cell became Days to review: "Don't lose the
              pace status logic, just move the pill to the top right."

              THE LOGIC IS UNMOVED, only the pill. Same `PaceChip`, same tones,
              same `presetLabel` + heavy modifier the other treatment renders
              inline — so the two placements cannot drift into two readings of
              one state.

              ⚠ IT STILL SAYS "RECOMMENDED" BESIDE AN EYEBROW READING
              "RECOMMENDED STUDY PACE", which is the duplication the chip was
              removed for in the first place (see the caption's own note). It is
              back by instruction rather than by oversight, and the eyebrow
              still flips to "Your Study Pace" the moment anything is adjusted —
              at which point the pair reads as intended and the overlap is only
              in the default state.

              `textTransform` and `letterSpacing` RESET: the eyebrow is
              uppercase at 0.1em and the pill would inherit both, which turns
              "Recommended · heavy" into a second caption rather than a chip.
            */}

          </>
        }
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
            studyDays={studyDays}
            notStarted={notStarted}
            courseTitle={courseTitle}
            accessExpiresAt={accessExpiresAt}
            examDate={choices.examDate ?? undefined}
            weekMinutes={weekMinutes}
            dailyMinutes={dailyMinutes}
            today={today}
            onCustomize={() => setOpen(true)}
            options={chooserVariant === 'options' ? options : undefined}
            customizeDisabled={chooserVariant === 'options'}
            activeOption={activeOption}
            onPickOption={(o) =>
              setChoices((c) => ({
                ...c,
                presetId: o.id,
                nights: o.nights,
                /* CLEARED, because a saved week would beat the preset — see the
                   note at `sim`. Picking a named plan is choosing the model's
                   answer, so any hand-built week the learner had is no longer
                   what they mean. */
                schedule: null,
              }))
            }
            /*
             * WRITES `choices.nights`, the same field the sheet writes, so a
             * pick from the strip and a pick from the sheet are one state. The
             * model re-prices on the next render and every figure below — the
             * nightly hours, the finish date, the review gap and therefore the
             * card's own NAME — follows from it.
             *
             * ⚠ AT 0% ONLY — 2026-09-23, the direct note: the strip is there
             * "to set the goal". Before the learner starts, picking nights is
             * choosing a plan; once they are underway the strip REPORTS one,
             * and a circle that silently re-prices a plan they are partway
             * through is a different and more dangerous control. Changing it
             * then goes through Customize Study Plan, which shows the
             * consequences before committing them.
             *
             * `undefined` rather than a disabled button: a control that is not
             * offered says less wrongly than one that looks offered and is not,
             * and `WeekStrip` falls back to its decorative `aria-hidden` span
             * when there is no handler.
             */
            onPickNights={
              notStarted
                ? (n) =>
                    setChoices((c) => ({
                      ...c,
                      nights: n,
                      /*
                       * ⚠ IT WRITES A WEEK, NOT JUST A COUNT, and the first
                       * build wrote only the count — which looked right and did
                       * almost nothing. `studyPace` takes `nights` as how to
                       * SPLIT a plan, not how long it takes: the finish date
                       * comes from the preset's `days`, so six nights instead
                       * of four made the evenings shorter and moved neither the
                       * completion date, the review gap, nor therefore the
                       * card's name. The ask is explicit that all of those
                       * follow, so they have to.
                       *
                       * A WEEK goes down the `simulateSchedule` path instead,
                       * the same one the sheet's saved plans take: the learner
                       * keeps the evening length they are looking at and adding
                       * a night finishes them sooner. That is what "set the
                       * goal" means here — the nights are the commitment and
                       * the date is the consequence, rather than the reverse.
                       *
                       * The first `n` days Monday-first, because nothing
                       * downstream knows WHICH nights — see `WeekStrip`'s
                       * `onPick`. `MIN_STUDY_HOURS` is the floor
                       * `simulateSchedule` counts a day at, so a very light
                       * evening still registers as a study night.
                       */
                      schedule: Array.from({ length: 7 }, (_, i) =>
                        i < n ? Math.max(MIN_STUDY_HOURS, selected.minsPerNight / 60) : 0,
                      ),
                    }))
                : undefined
            }
          />
        ) : (
          <PaceBody
            model={model}
            preset={selected}
            plan={choices.plan}
          />
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


/**
 * THE THREE NAMED PLANS — `study-pace-chooser: options`, 2026-09-23.
 *
 * A RADIOGROUP, not three buttons. They are one choice with three answers and
 * exactly one is always true, which is what `radio` means; three independent
 * buttons would let a screen reader user press two and learn nothing about
 * which is current. `aria-checked` carries the state, so the selected tint is
 * not doing that job alone (1.4.1).
 *
 * EACH ONE SHOWS WHAT IT COSTS AND WHAT IT BUYS — the evening it asks for and
 * the date it lands on. A picker of three bare names would make the learner
 * choose one to find out what it means, which is the thing this card exists to
 * save them from. `formatEvening` rather than a second rounding: its
 * quarter-hour rule is why "about 1 hour" cannot mean both 68 and 89 minutes.
 *
 * NO FIGURES ON A PLAN THAT WILL NOT FIT. `priceFinish` returns `Infinity` and
 * `state: 'no'` there, and the model's own note on `CEILING_MINS` says why
 * printing the number is wrong: "no number is honest there, and the answer is
 * more time or fewer lessons, not a bigger figure."
 */
/**
 * A MARK PER PLAN — 2026-09-23, the direct ask: "Person Running = Focused, Mug
 * = Recommended, loveseat = Relaxed."
 *
 * Keyed on `PresetId` rather than on the display name, so renaming the plans
 * again (they have been renamed twice today) cannot silently orphan a glyph.
 *
 * They are SYMBOLS, not UI glyphs — a sofa says "unhurried" in a way no arrow
 * does — which is why they are the solid weights rather than this registry's
 * usual Light set, and why they are `aria-hidden`: the plan's name is right
 * beside each one, and a screen reader hearing "loveseat" would be worse off.
 */
const PLAN_ICONS: Record<PresetId, ComponentType<{ size?: number }>> = {
  relaxed: Loveseat,
  recommended: MugHot,
  focused: PersonRunningFast,
}

function PaceOptionPicker({
  options,
  active,
  onPick,
}: {
  options: PaceOption[]
  active: PresetId | null
  onPick: (option: PaceOption) => void
}) {
  return (
    <div role="radiogroup" aria-label="Study pace" style={optionRowStyle}>
      {options.map((o) => {
        const on = o.id === active
        const fits = o.priced.state !== 'no'
        return (
          <button
            key={o.id}
            type="button"
            /* ONE ID ON ALL THREE, on purpose — "do they read this as a
               choice" is a single question. See `TESTABLE_CTAS`. */
            data-cta-id="home.pace-option"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(o)}
            style={{ ...optionStyle, ...(on ? optionActiveStyle : null) }}
          >
            {/* THE MARK AND THE NAME ON ONE LINE, so the glyph reads as part
                of the label rather than as a decoration above it. 20% opacity
                unselected and full primary when chosen — the direct ask, and it
                gives the row a second signal for "chosen" beyond the tint,
                which is what keeps the state off colour alone (1.4.1). */}
            <span style={optionNameRowStyle}>
              <span aria-hidden style={on ? planIconActiveStyle : planIconStyle}>
                {(() => {
                  const Mark = PLAN_ICONS[o.id]
                  return <Mark size={14} />
                })()}
              </span>
              <span style={optionNameStyle}>{o.name}</span>
            </span>
            {/*
              TWO LINES, AND BOTH SAY "A WEEK" OR "A NIGHT" — 2026-09-23, the
              direct note: "this logic needs clarification of 3 nights/week, and
              not just 3 nights total to finish the entire course."

              It read "3¼ hours a night · 3 nights", and the second half was
              genuinely ambiguous: three nights could be the whole commitment
              rather than the weekly rhythm, which on a card about finishing a
              course is a plausible misreading. Splitting the line and spelling
              out the period fixes it, and there is room now that the finish
              date has gone.

              "DAYS A WEEK", not "nights a week", to match the headline
              underneath ("About 3¼ hours a night, 3 days a week"). The model
              calls them nights and the strip's own accessible name does too,
              but a learner reads this card, not the model — and one card
              carrying both words for one thing is the drift this repo keeps
              paying for.

              ⚠ THE FINISH DATE IS GONE from these cards — the second half of
              the note: "we are showing the course completion in the details
              below, so we can remove that from the selections." It was the same
              date the Course completion cell prints a few lines down, stated
              three times over in a row of three.
            */}
            <span style={on ? optionMetaActiveStyle : optionMetaStyle}>
              {fits ? `${o.nights} ${o.nights === 1 ? 'day' : 'days'} a week` : 'Will not fit'}
            </span>
            {fits ? (
              <span style={on ? optionMetaActiveStyle : optionMetaStyle}>
                {formatEvening(o.priced.minsPerNight)} a night
              </span>
            ) : null}
            {/* HOW LONG IT TAKES — 2026-09-23, the direct ask for a third line.
                The two above are the COST (how often, how long each time); this
                is what the learner gets for it, and it is the axis the three
                plans actually differ on.

                A DURATION, not the finish date. The date came off these cards
                an hour ago because the Course completion cell below prints it;
                "complete in 14 days" says the same fact as a length, which is
                what makes three plans comparable at a glance without doing
                calendar arithmetic. */}
            {fits ? (
              <span style={on ? optionMetaActiveStyle : optionMetaStyle}>
                Complete in {o.priced.days} {o.priced.days === 1 ? 'day' : 'days'}
              </span>
            ) : null}
            {/* THE POINTER — 2026-09-23, the direct ask: "a small filled
                triangle pointing down from the bottom border to help indicate
                to the user they can switch this pace option."

                It finishes the tab the thick square foot started: the foot says
                this option is joined to what is under it, and the pointer says
                which part. Together they are the one thing on the row that
                reads as a CONTROL rather than a status — three cards that
                differ only in tint could be a readout.

                A BORDER TRIANGLE, not a glyph: it is 6px of geometry, no icon
                in the registry matches it, and the colour has to track the
                selected border exactly. `aria-hidden` because it says nothing
                `aria-checked` has not already said. */}
            {on ? <span aria-hidden style={optionPointerStyle} /> : null}
          </button>
        )
      })}
    </div>
  )
}

const optionRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
}

/* A CARD EACH, not a segmented control: every option carries three lines, and a
   segment is a shape for one word. The resting state is the page's own sunken
   fill so the row reads as three choices rather than three buttons. */
const optionStyle: CSSProperties = {
  /* For the selected option's pointer, which hangs below the box. Set on every
     option rather than only the selected one so the two share a layout and
     selecting cannot re-flow the row. */
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
  padding: '9px 11px',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
}

/* THE SELECTED ONE takes the primary tint and a solid ring — the same pairing
   the week strip's studied nights use, so "chosen" looks the same twice on one
   card. `backgroundColor`, not `background`: a `color-mix()` in the shorthand
   throws in jsdom while testing-library clones the node, which cost this repo a
   confusing afternoon once already. */
const optionActiveStyle: CSSProperties = {
  borderColor: 'var(--color-primary-500)',
  backgroundColor: 'color-mix(in srgb, var(--color-primary-500) 8%, transparent)',
  /*
   * A THICK, SQUARE-CORNERED FOOT — 2026-09-23, the direct ask.
   *
   * It makes the selected option read as ATTACHED to what is under it rather
   * than as one of three equal boxes, which is the relationship that is
   * actually true: the headline, the week strip and the three cells below all
   * describe the plan this option names. A tab, in other words — the same
   * shape the page rail's active row uses a 3px bar for.
   *
   * 3px, and only on the foot: a thicker ring all round would read as heavier
   * emphasis rather than as a join, and the other three edges are still the
   * 1px the unselected options carry.
   */
  /*
   * ⚠ AN INSET SHADOW, NOT A THICK BORDER — 2026-09-23, after the foot kept
   * reading as cut off along its length and at the corners.
   *
   * It was `borderBottomWidth: 3`. Nothing was clipping it: measured, the
   * card's bottom sits at y=790.875 — a FRACTIONAL pixel, because the rows
   * above it resolve to fractions. A 3px border starting on a half-pixel
   * renders as two solid rows and a faint third, and where it meets the 1px
   * side borders the mitre turns that into a visible notch at each corner.
   *
   * An inset `box-shadow` paints inside the padding box as a flat band rather
   * than as a mitred edge, so there is no corner join to break up and the
   * rounding shows as at most a soft edge instead of a gap.
   *
   * IT ALSO REMOVES THE HEIGHT COMPENSATION. The border stays 1px on all four
   * sides, so the selected card is exactly as tall as the other two and the
   * `paddingBottom: 7` that used to give back the extra 2px is gone — one less
   * number to keep in step.
   */
  boxShadow: 'inset 0 -3px 0 0 var(--color-primary-500)',
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
}

/* Sits ON the bottom border, pointing down. Centred on the option rather than
   on the card: it points at the row it belongs to.

   ⚠ `calc(100% + 1px)`, NOT `100%`. A percentage `top` resolves against the
   containing block's PADDING box, so plain `100%` puts the triangle's apex
   inside the border. The offset is the border's own width — 1px since the foot
   became an inset shadow rather than a 3px border (it was `+ 3px` while the
   border carried the weight). Change the border and this follows. */
const optionPointerStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 1px)',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 0,
  height: 0,
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '6px solid var(--color-primary-500)',
}

const optionNameRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
}

/* `--color-primary-500` throughout; only the opacity moves. A lighter STOP for
   the unselected state would be a second colour to keep in step, and a faded
   version of the selected one is the same ink at a whisper — which is what "not
   chosen yet" should look like beside a plan that is.

   50%, up from 20% the same afternoon — 20 read as a disabled glyph rather than
   an unchosen one, which is the wrong message on a row the learner is meant to
   click. The marks are the thing that makes these three legible at a glance, so
   they have to be visible on all three. */
const planIconStyle: CSSProperties = {
  display: 'inline-flex',
  flexShrink: 0,
  color: 'var(--color-primary-500)',
  opacity: 0.5,
}

const planIconActiveStyle: CSSProperties = {
  ...planIconStyle,
  opacity: 1,
}

const optionNameStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 700,
  lineHeight: '17px',
  color: 'var(--color-text-primary)',
}

const optionMetaStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '15px',
  color: 'var(--color-text-tertiary)',
}

/* THE SELECTED OPTION'S FIGURES IN THE BODY INK — 2026-09-23, the direct ask.
   Tertiary is right for the two plans a learner is only considering; on the one
   they have chosen it reads as disabled, and these are the two numbers the rest
   of the card is about to elaborate. The unselected pair keep the lighter ink,
   which is what makes the chosen one read as chosen. */
const optionMetaActiveStyle: CSSProperties = {
  ...optionMetaStyle,
  color: 'var(--color-text-primary)',
}

/* ─── the tile's own content ─────────────────────────────────────────── */

function PaceBody({
  model,
  preset,
  plan,
}: {
  model: PaceModel
  preset: PacePreset
  /* `adjusted` and `ownSchedule` were props here for one afternoon, feeding the
     badge this layout no longer draws. `paceBadgeLabel` is exported and takes
     both, so restoring a name here is re-adding two props rather than
     rebuilding the derivation. */
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
      {/* NO BADGE HERE EITHER — 2026-09-23, "remove the badges altogether".
          The TILE layout has no eyebrow of its own to carry the name (its
          caption is the bare "Study Pace"), so this one is simply gone rather
          than moved. If the tile ever needs to say which plan it is showing,
          `paceBadgeLabel` is the function to call and the caption is where it
          should land — not a badge beside it. */}
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
/*
 * `PaceBadge` LIVED HERE and was removed 2026-09-23, hours after it arrived —
 * the direct ask: "remove the badges altogether in the widget because it's
 * showing in the name of the card."
 *
 * It was right. The badge said "Recommended" beside an eyebrow already reading
 * RECOMMENDED STUDY PACE, which is the same duplication the ORIGINAL pill was
 * removed for in 2026-09; re-adding it under a new shape reproduced the defect
 * rather than fixing it. The name belongs in one place and the card's own
 * heading is that place, so `paceBadgeLabel` feeds the eyebrow instead.
 *
 * ⚠ WHAT WENT WITH IT, twice over. The pill carried a "· heavy" modifier in
 * amber when the nightly figure passed `STRAIN_MINS`; the grey badge dropped
 * the amber, and this drops the marker entirely. Nothing on the card now says a
 * plan is punishing except the figure itself ("About 2¾ hours a night"). That
 * is a deliberate consequence of two asks in a row rather than an oversight,
 * and it is the thing to restore first if strain turns out to need a signal.
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
 * THE treatment of the Testing version's full-width Study Pace tile. It was
 * the fifth of five behind `dashboard-pacing-style` until 2026-09-22, when it
 * won and the flag was retired — `archivedItems.ts`, row
 * `pacing-treatment-exploration`, holds the other four.
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
  studyDays,
  notStarted,
  courseTitle,
  accessExpiresAt,
  examDate,
  weekMinutes,
  dailyMinutes,
  today,
  onCustomize,
  onPickNights,
  options,
  activeOption,
  onPickOption,
  customizeDisabled,
}: {
  model: PaceModel
  preset: PacePreset
  plan: PaceChoices['plan']
  /** Days the saved week studies, when there is one — see the tile's note. */
  studyDays?: number[] | null
  /** 0% — see the tile's `notStarted` note. Changes the sentence's second
   *  clause and, upstream, the nights the model was built with. */
  notStarted?: boolean
  courseTitle?: string
  accessExpiresAt?: string
  examDate?: string
  weekMinutes?: number[]
  /** The last 30 days, oldest first, ending today — the activity streak's
   *  history. Absent ⇒ the week strip stays. */
  dailyMinutes?: number[]
  today: Date
  onCustomize: () => void
  /** Set the nights a week from the strip — see `WeekStrip`'s `onPick`. */
  onPickNights?: (nights: number) => void
  /** The three named plans, on the `options` chooser only. */
  options?: PaceOption[]
  /** True on `options`, where the card itself is the picker. */
  customizeDisabled?: boolean
  activeOption?: PresetId | null
  onPickOption?: (option: PaceOption) => void
}) {
  /* THE DATE THE LEARNER OWNS, not the model's `hardEndIso`. The ceiling the
     maths uses is expiry minus one (finishing the day access dies is not
     finishing) and the exam minus a revision buffer — both correct, and both
     one day off from the date printed on the learner's receipt. */
  const ceilingIso = model.binding === 'exam' ? examDate : accessExpiresAt
  const examBinds = model.binding === 'exam'
  /* UNCONDITIONALLY, above the `state: 'no'` early return — the rules-of-hooks
     trap this file's own header records three times over. */
  const readout = useFeatureFlag('study-pace-readout').variant ?? 'prose'

  /* ABOVE THE EARLY RETURN TOO, because the won't-fit branch draws the strip
     now — see its own note. Plain derivations, not hooks, but they were below
     the return and the branch could not reach them. */
  const nights = studyDays ?? plan?.weekdays ?? defaultWeekdays(preset.nights)
  const todayIndex = (today.getDay() + 6) % 7

  if (preset.state === 'no') {
    return (
      <div style={cardStack}>
        {/* Same rule as the main branch — see its note. */}
        {options && onPickOption && notStarted ? (
          <PaceOptionPicker
            options={options}
            active={activeOption ?? null}
            onPick={onPickOption}
          />
        ) : null}
        <p style={cardHeadline}>
          The work left won’t fit before {examBinds ? 'your exam' : 'your access ends'}.
        </p>
        {/*
          ⚠ THE STRIP STAYS WHEN NOTHING FITS — 2026-09-23, the direct note:
          "if it's not achievable, don't remove the days of the week. It already
          says not achievable in the course completion."
          
          IT WAS A TRAP, not just an omission. At 0% the strip is the control,
          and picking three nights is what puts the card in this state — so the
          branch that removed it took away the only way back. A learner (or a
          reviewer) could reach a dead end in one click and have nothing to
          undo it with but the Adjust sheet.
          
          The state is already named twice over — the headline says it and the
          completion cell reads "Not achievable" — so the strip is not needed to
          carry the news, which is what makes keeping it free.
        */}
        <WeekStrip
          nights={nights}
          weekMinutes={weekMinutes}
          target={preset.minsPerNight}
          todayIndex={todayIndex}
          onPick={onPickNights}
        />
        {/* THE CELLS STAY, AND THE GAP IS NAMED — 2026-09-23, the chosen
            answer. One layout in every state, so the readout is somewhere a
            learner can rely on finding rather than something that appears when
            the news is good. The completion cell reads "Not achievable" because
            there is no date: a dash would look like data that failed to load,
            and a date would be a promise the model has just refused to make.

            The warning above it is unchanged and still leads — putting the
            cells first would have made the card open with a countdown at the
            one moment the countdown is not the point. */}
        {readout === 'stats' ? (
          <PaceStatsRow
            preset={preset}
            daysToCeiling={model.daysToCeiling}
            ceilingIso={ceilingIso}
            examBinds={examBinds}
          />
        ) : null}
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
        <CustomizeLink
          onClick={onCustomize}
          disabled={customizeDisabled && notStarted}
          label={notStarted ? undefined : 'View Study Plan'}
        />
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
  /*
   * THE SECOND CLAUSE — hours a week normally, DAYS a week at 0%.
   *
   * 2026-09-22, the direct ask. Both state the same plan; they answer different
   * questions. "15½ hours a week" is a workload, and it is the right second
   * fact for a learner already in the course who is judging whether they are
   * keeping up. A learner who has not opened it yet is deciding whether to
   * start, and "4 days a week" is the commitment — the shape of the week rather
   * than its size.
   *
   * The FIRST clause is unchanged and still derived: the evening is whatever
   * the course needs spread over those four nights, so the sentence never
   * trades honesty for a friendlier number.
   */
  /*
   * ⚠ DAYS A WEEK IN BOTH STATES as of 2026-09-23, which REVERSES the split
   * above for the started learner. It had been hours a week there — "15½ hours
   * a week" — on the argument that a learner already in the course is judging a
   * workload rather than a commitment, and that argument still holds on its own
   * terms.
   *
   * WHAT CHANGED IS WHERE THE OTHER FACT LIVED. The three plan cards used to
   * state "6 days a week" right above this sentence, so the week's SHAPE was on
   * the card whatever this clause said. At 63% the picker is gone (see its
   * note), and with it the only other place the card named how many evenings
   * the plan wants — while the line directly underneath now reports how many
   * the learner is actually keeping. A goal of "15½ hours a week" has nothing
   * for "4 days a week" to sit against; "6 days a week" does.
   *
   * Hours a week is still derivable and still true — it is `minsPerNight ×
   * nights` — which is the asymmetry that settles it: the reader can get the
   * workload from the shape, not the shape from the workload.
   */
  const weekly = `${preset.nights} days`
  /** What the learner is actually doing, against what the plan asks. Null at 0%
   *  and for a week with nothing on it yet — see `observedPace`. */
  const observed =
    weekMinutes != null ? observedPace({ weekMinutes, todayIndex, dailyMinutes }) : null

  /* `nights` and `todayIndex` are derived above the `state: 'no'` return —
     which nights is the learner's plan when they have built one, otherwise the
     same default the sheet would propose, from the shared helper, so the strip
     and the plan behind it cannot shade different days. */
  /** Null when there is nothing studied to compare — a learner at 0% has not
   *  had a bad week, they have not had a week. */
  const standing =
    weekMinutes != null
      ? weekStanding({ weekMinutes, todayIndex, nights, minsPerNight: preset.minsPerNight })
      : null

  return (
    <div style={cardStack}>
      {/*
        ⚠ THE PICKER IS FOR LEARNERS WHO HAVE NOT STARTED — 2026-09-23, the
        direct ask: at 63% "the 3 options will not be shown, assuming user
        already selected one."

        `notStarted` IS THE PROXY FOR "has a pace", and it is a proxy rather
        than the thing itself. The product has no field recording that a learner
        accepted a plan; what it has is progress, and anyone partway through a
        course has been keeping SOME pace whether they chose it or not. So the
        card stops asking and starts reporting.

        IT ALSO REMOVES THE CARD'S ONLY CONTROL, which is why `customizeDisabled`
        now follows the same condition — see `CustomizeLink`. Hiding the picker
        while leaving the link inert would have left this state with no way to
        change pace at all.
      */}
      {/*
        THE PROMISE UNDER THE CHOICE — 2026-09-23, the pair to the 63% card's
        provenance line. That one says where a measured figure CAME FROM; this
        one says what will happen to a chosen one, which is the same reassurance
        pointed forward instead of back. Together they are why the card can
        change subject between the two states without reading as two different
        cards.

        ⚠ ABOVE THE PICKER, not under the headline where the 63% subtext sits.
        It qualifies the three plans, and a reassurance that arrives after the
        decision has already been made is not reassurance.
      */}
      {notStarted ? (
        <p style={eyebrowSubStyle}>
          Your actual pace will adjust based on your course progress and time spent studying —
          we’ll help you track it.
        </p>
      ) : null}
      {options && onPickOption && notStarted ? (
        <PaceOptionPicker options={options} active={activeOption ?? null} onPick={onPickOption} />
      ) : null}
      {/*
        ⚠ THE CARD CHANGES SUBJECT ONCE THE LEARNER IS UNDER WAY — 2026-09-23.
        At 0% the headline is a PLAN ("About 2 hours a night, 6 days a week");
        from the first studied evening it is a READING of what they are
        actually doing ("Averaging about 1¾ hours a night."). The eyebrow moves
        with it — "Set your Study Pace" → "Your Study Pace" — so the whole card
        is either proposing or reporting, never half of each.

        THE SUBTEXT IS THE PROVENANCE, and it is the reason the swap is safe to
        make: a figure this personal has to say where it came from, or it reads
        as another recommendation with a smaller number.

        "About" and the trailing clause stay the same weight and size; only the
        figure steps up, which is what makes either sentence read as a sentence
        with one number in it rather than as a stat with words around it.
      */}
      {observed ? (
        <>
          <p style={eyebrowSubStyle}>
            Based on your actual course progress and time spent studying
          </p>
          {/*
            ⚠ A DATE, NOT AN EVENING — 2026-09-23. It read "Averaging about 2¼
            hours a night."; the ask moved it to "You're on schedule to finish
            May 24".

            IT CHANGES WHAT THE CARD LEADS WITH, from an input to an OUTCOME.
            The evening is effort; the date is the thing the effort is for, and
            it is the only figure here a learner can act on — an average of 2¼
            hours tells them nothing they did not already know about their own
            week. The hours are not lost: the activity band below states them
            as a total, which is where a fact about the past belongs.

            ⚠ AND IT BRANCHES, for the reason the nudge under it does. "On
            schedule" is a CLAIM, and printing it to a learner the same card is
            about to tell is "a little behind" would have the two sentences
            contradicting each other in consecutive lines. Behind, it states
            the same date without the claim.

            THE DATE IS DERIVED, never typed: `preset.finishIso`, the same
            value the Course completion cell reads. Two derivations is how a
            headline comes to disagree with the cell three lines under it.
          */}
          <p style={cardHeadline}>
            {standing?.behind ? 'At this pace you’ll finish' : 'You’re on schedule to finish'}{' '}
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em' }}>
              {formatPaceDate(preset.finishIso)}
            </span>
          </p>
        </>
      ) : (
        <p style={cardHeadline}>
          About{' '}
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.015em' }}>
            {nightFigure}
          </span>{' '}
          {nightUnit} a night, {weekly} a week
        </p>
      )}

      {/*
        THE NUDGE STOOD HERE and was removed 2026-09-23. It read "A little
        behind, but no worries — add some extra study time in this week and
        you'll easily get back on pace." on a shortfall, and "Right on pace…"
        otherwise.

        ⚠ THE HEADLINE TOOK OVER ITS JOB an hour earlier, which is what made it
        removable: "You're on schedule to finish May 28" and "At this pace
        you'll finish May 28" already branch on the same `standing.behind`. Two
        sentences reporting one status in consecutive lines is the duplication
        this card has been trimmed of twice now — first the arithmetic
        shortfall line, then this.

        ⚠ WHAT WENT WITH IT is the only encouraging copy on the card. If a
        behind learner should be told what to DO rather than only when they
        will finish, this block is where that sentence goes, and the
        `standing.behind` branch is already computed for the headline.
      */}

      {/* ONE SLOT, TWO JOBS — see `ActivitySummary`. At 0% the seven circles are
          a CONTROL (clicking one sets the nights) and there is no history to
          draw; past 0% there is history and nothing left to set. */}
      {dailyMinutes && !notStarted ? (
        <ActivitySummary dailyMinutes={dailyMinutes} minsPerNight={preset.minsPerNight} />
      ) : (
        <WeekStrip
          nights={nights}
          weekMinutes={weekMinutes}
          target={preset.minsPerNight}
          todayIndex={todayIndex}
          onPick={onPickNights}
        />
      )}

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
      {/* ⚠ SUPPRESSED WHILE THE NUDGE ABOVE SHOWS — see its note. This is the
          same news in different arithmetic, and the card must say it once. */}
      {standing?.behind && !observed ? (
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

      {/*
        THE READOUT — `study-pace-readout: stats`, 2026-09-23.
        
        THREE CELLS INSTEAD OF TWO SENTENCES, and nothing the prose said is
        lost: the access end date rides under the countdown as a second line,
        which is where a learner checks it anyway. The third sentence (the
        estimate moves) and Customize Study Plan survive in both variants — they
        were never the part being restated.
        
        THE STATUS CELL IS THE PACE AXIS, not the compliance one. Relaxed /
        Recommended / Focused, plus heavy — `PaceChip`'s own note records why
        the two must not share a badge: a learner reading "At Risk" off a
        statement that is only saying their evenings are long. This card speaks
        about the plan; the band above it speaks about the learner.
      */}
      {readout === 'stats' ? (
        <PaceStatsRow
          preset={preset}
          daysToCeiling={model.daysToCeiling}
          ceilingIso={ceilingIso}
          examBinds={examBinds}
        />
      ) : null}
      <div style={cardBody}>
        {readout === 'stats' ? null : (
        <>
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
        </>
        )}
        {/* HELPER TEXT, NOT A THIRD FACT — 2026-09-23, the direct ask: "reduce
            the size of this font so it sits more as helper text."

            The two lines above state the window and the finish date; this one
            says the finish date is not a promise. At the body's own 12.5/20 it
            was a peer of the facts it qualifies, and it is the longest line on
            the card, so it read as the most important thing there. Dropping to
            11.5/16 and the tertiary ink puts it a step behind them.

            IT KEEPS THE 4.5:1 FLOOR. `--color-text-tertiary` is 6.19:1 light
            and 6.18:1 dark on the card — the same token the journey rail's
            blocked rows use, chosen there over an `opacity: 0.55` that
            composited to about 3.5:1. Small and grey is where that failure
            usually gets made, so the token is doing the work rather than a
            lightened colour. */}
        {/* THE NOTE MOVES INTO THE TIP on the stats readout — 2026-09-23. It
            qualifies the completion date, and on that variant the date has a
            cell of its own with room for the marker; as a third line under a
            row of cells it read as a footnote to the whole card rather than to
            the one figure it is about. The prose variant keeps it in place,
            where there is no cell to attach it to. */}
        {readout === 'stats' ? null : <p style={cardHelper}>{FINISH_DATE_NOTE}</p>}
      </div>

      {/*
        ⚠ `&& notStarted` — THE LINK COMES BACK TO LIFE ONCE THE PICKER GOES.
        `customizeDisabled` is set on the `options` chooser because the three
        plans are ON the card, so a link into a sheet offering the same three
        would be one door too many. That reasoning expires exactly when the
        plans do: at 63% the card shows no picker, so an inert link would leave
        the state with no way to change pace at all.
      */}
      <CustomizeLink
        onClick={onCustomize}
        disabled={customizeDisabled && notStarted}
        label={notStarted ? undefined : 'View Study Plan'}
      />
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
/**
 * THE ACTIVITY STREAK — 2026-09-23, replacing the week strip once the learner
 * is past 0%.
 *
 * ⚠ IT COUNTS WEEKS, NOT DAYS, and that is the whole design. The reference is
 * a daily streak; a daily count would break twice a week for anyone on Focused
 * & Quick who follows the plan this very card recommended. `weeksOnPace`
 * carries the argument in full.
 *
 * ⚠ THE STRIP STILL EXISTS AND IS STILL RIGHT AT 0%. Before the learner
 * starts, the seven circles are a CONTROL — clicking one sets the nights — and
 * there is no history to draw. After they start there is history and nothing
 * to set, so the same slot becomes a reading. One slot, two jobs, chosen by
 * the same `notStarted` every other part of this card branches on.
 *
 * ⚠ AND IT DRAWS NO MISSES. Every bar is either studied or empty; a day the
 * plan never asked for looks exactly like a day they skipped. That is a
 * deliberate loss — the alternative was colouring misses, and a learner with a
 * hard fortnight opening their dashboard to a row of red is the wrong pairing
 * for a card whose copy says "no worries". The shortfall is stated in words
 * above instead.
 */
function ActivitySummary({
  dailyMinutes,
  minsPerNight,
}: {
  dailyMinutes: number[]
  /** The plan's evening, used only to decide which bars draw dark. */
  minsPerNight: number
}) {
  const total = dailyMinutes.reduce((a, b) => a + (b || 0), 0)
  /* ⚠ `observedPace`, NOT `total / dailyMinutes.length`. The average a learner
     recognises is their EVENING — the mean of the nights they actually sat
     down — not their effort diluted by rest days. That rule is the function's
     own, and calling it is what stops this line drifting from it. */
  const pace = observedPace({ dailyMinutes })
  /* The tallest bar is the busiest evening, floored at the nightly target so a
     week of light sessions does not redraw itself as a week of full ones. */
  const peak = Math.max(minsPerNight, ...dailyMinutes)
  return (
    <div style={streakStack}>
      {/*
        THREE FIGURES WITH RULES BETWEEN THEM — 2026-09-23, replacing the
        sentence "In the last 13 days you've studied a total of 25¼ hours." and
        the "About 2¼ hours a night" line under it. Both facts survive; they
        are now countable at a glance instead of read.

        ⚠ THE FIRST CELL COUNTS NIGHTS STUDIED, NOT DAYS ELAPSED, and that is a
        correction to the asked-for copy. It read "13 Days of Studying · 25¼
        Total Hours · About 2¼ Hours/Day", and those three do not multiply:
        13 × 2¼ is 29¼, not 25¼. The 2¼ is the average of the nights the
        learner actually sat down — eleven of the thirteen days — which is the
        figure `observedPace` computes and the one that has been on this card
        since the average arrived.

        Eleven with "Days Studied" makes all three agree (11 × 2¼ ≈ 25¼) AND
        makes the label literally true, which "Days of Studying" was not of a
        window that includes two rest days. The alternative — keeping 13 and
        printing "About 2 Hours/Day" — is equally consistent and answers a
        different question (effort per day rather than length of an evening).

        A row of three figures that do not reconcile is the exact defect this
        card was picked apart for an hour ago, and a participant can check
        these three against each other in their head.
      */}
      <div style={statRow}>
        <p style={statCell}>
          <b style={streakFigure}>{pace ? pace.nights : 0}</b> Days Studied
        </p>
        <span aria-hidden style={statRule} />
        <p style={statCell}>
          {/* ⚠ THE UNIT COMES OUT OF THE FORMATTER, not typed as "Hours". The
              ask read "25¼ Total Hours", which is right for this persona and
              wrong for one whose whole total is under an hour — `formatEvening`
              answers "45 min" there, and "45 Total Hours" would be a lie the
              layout could not see. Split figure from unit and the label stays
              true at every size. */}
          <b style={streakFigure}>{splitFigure(formatEvening(total))[0]}</b> Total{' '}
          {splitFigure(formatEvening(total))[1]}
        </p>
        <span aria-hidden style={statRule} />
        <p style={statCell}>
          About{' '}
          <b style={streakFigure}>
            {pace ? splitFigure(formatEvening(pace.minsPerNight))[0] : '—'}
          </b>{' '}
          {pace ? splitFigure(formatEvening(pace.minsPerNight))[1] : ''}/day
        </p>
      </div>
      <div style={streakBars} role="img" aria-label={streakLabel(dailyMinutes)}>
        {/*
          ⚠ NO RING ON TODAY — 2026-09-23, the direct ask. It carried a
          `primary-700` outline so the last bar read as "now"; the row is
          chronological and the last bar is already the last bar, so the ring
          was decoration that a reader had to decode. A day the learner has not
          studied yet now looks like any other empty day, which is what it is.
        */}
        {dailyMinutes.map((m, i) => {
          const on = (m || 0) > 0
          return (
            <span
              key={i}
              aria-hidden
              style={{
                ...streakBar,
                height: on ? Math.max(4, Math.round(((m || 0) / peak) * 40)) : 3,
                background: barTone(m || 0, pace ? pace.minsPerNight : minsPerNight),
              }}
            />
          )
        })}
      </div>
      {/* "THIS WEEK N OF M NIGHTS" STOOD HERE and was removed 2026-09-23. It
          was the last of the week-shaped readouts, and it kept the card
          counting two different things at once — a total above the bars and a
          quota below them. At the demo clock it also opened at "1 of 6", which
          reads as a shortfall on a Monday morning rather than as a start. */}
    </div>
  )
}

/**
 * How dark a day's bar is — 2026-09-23, the direct ask for "different shades
 * of blue based on the amount of time spent each day".
 *
 * ⚠ FIVE STOPS, NOT TWO. It was a single threshold — at or over the nightly
 * target drew `primary-500`, under it drew `primary-300` — which made a row of
 * broadly similar evenings render as two flat blocks and told a reader almost
 * nothing. Height already encodes the amount; the tone is what makes a heavy
 * night legible at a glance without measuring bars against each other.
 *
 * ⚠ AGAINST THE LEARNER'S OWN AVERAGE EVENING, not the plan's, and not the
 * tallest bar in the row.
 *
 * The plan's was the first attempt and it collapsed: this learner is doing
 * roughly double what their plan asks, so ten of eleven nights landed in the
 * top stop and the row rendered as one flat dark block — the very flatness the
 * shading was added to fix. "Over target" stops being informative once someone
 * is comfortably over it every day.
 *
 * The tallest bar was the other candidate and is worse: it repaints the whole
 * month whenever one long session lands, so a steady week can darken because
 * of a single Sunday.
 *
 * The MEAN is stable — it moves slowly and by definition sits in the middle of
 * the data — so the row always has light and dark in it, and a bar's tone
 * answers "was this a big night for me?" rather than "did I beat a number I am
 * already beating". `minsPerNight` remains the fallback for a history with no
 * studied nights in it at all.
 *
 * ⚠ AND AN UNSTUDIED DAY IS GREY, NOT A PALE BLUE. Blue at any weight reads as
 * "some", and a rest day is not a small amount of studying. `-200` is the
 * lightest blue in use, and it still means the learner sat down.
 */
function barTone(mins: number, reference: number): string {
  if (mins <= 0) return 'var(--color-border-subtle)'
  /* Tighter than they look: a ratio to the MEAN clusters near 1, so the stops
     sit at ±15% and ±30% of it rather than at the half-and-double a
     target-relative scale would want. */
  const ratio = mins / Math.max(1, reference)
  if (ratio < 0.6) return 'var(--color-primary-200)'
  if (ratio < 0.85) return 'var(--color-primary-300)'
  if (ratio < 1.05) return 'var(--color-primary-400)'
  if (ratio < 1.3) return 'var(--color-primary-500)'
  return 'var(--color-primary-700)'
}

/** One sentence for the bar row, which is a picture to everyone else. */
function streakLabel(dailyMinutes: number[]): string {
  const studied = dailyMinutes.filter((m) => (m || 0) > 0).length
  /* ⚠ "SINCE YOU STARTED", NOT "the last 30 days". The array is exactly as
     long as the learner has had the course — 13 days on the On Track persona,
     27 on At Risk — so a fixed thirty would be the same false claim the chart
     itself used to make. */
  return `Activity since you started, ${dailyMinutes.length} days: studied on ${studied} of them.`
}

function WeekStrip({
  nights,
  weekMinutes,
  target,
  todayIndex,
  onPick,
}: {
  nights: number[]
  weekMinutes?: number[]
  target: number
  todayIndex: number
  /**
   * Set the number of study nights a week — 2026-09-23, the direct ask: "have
   * these be clickable so the user can see this change in real time."
   *
   * ⚠ IT PICKS A COUNT, NOT A DAY, and that is the model's shape rather than a
   * shortcut. `studyPace` prices a number of nights; nothing downstream knows
   * WHICH nights, and `defaultWeekdays` fills the first n Monday-first. So
   * clicking Friday means "five nights" and lights Mon-Fri — it cannot mean
   * "Mon, Tue, Thu, Fri", because there is nowhere to put that. The sheet is
   * where an arbitrary week is built, and it writes `choices.schedule`.
   *
   * Absent in ACTUAL mode: those circles report minutes already studied, and a
   * past week is not a thing to pick.
   */
  onPick?: (nights: number) => void
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
  /* INTERACTIVE ONLY IN SUGGESTION MODE — see `onPick`. The whole strip drops
     `aria-hidden` when it becomes a control: a row of buttons hidden from the
     accessibility tree is a keyboard trap with no name, which is worse than the
     decoration it used to be. As decoration it stays hidden, because the
     sentence above already states the pace in words. */
  const pickable = Boolean(onPick) && !actual
  return (
    <div
      {...(pickable
        ? { role: 'group' as const, 'aria-label': 'Study nights a week' }
        : { 'aria-hidden': true })}
      style={{ display: 'flex', gap: 6 }}
    >
      {WEEKDAY_LABELS.map((label, i) => {
        const planned = nights.includes(i)
        const elapsed = i <= todayIndex
        const done = actual && elapsed ? Math.min(1, (weekMinutes[i] ?? 0) / Math.max(target, 1)) : 0
        /* In ACTUAL mode a day is "on" once any of it is done; in SUGGESTION
           mode it is "on" if the pace falls there. The ring, the ink and the
           fill all follow that one boolean so a half-done day cannot end up
           with a studied ring and unstudied ink. */
        const on = actual ? done > 0 : planned
        const dayStyle = {
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
              /*
               * A SOLID DISC WITH LIGHT LETTERS, IN BOTH MODES — 2026-09-23.
               * The pale `primary-100` fill read as "tinted" rather than "on"
               * beside the plan cards, which now carry a solid selected
               * treatment of their own; the ask made suggestion mode solid
               * first and then actual mode to match ("the days of the week
               * being filled in will be solid like the update we did for 0%").
               *
               * ⚠ IT COSTS THE LEVEL, and that is the trade to know about.
               * ACTUAL mode used to fill from the bottom in proportion to how
               * much of the evening's target was studied — a level, deliberately
               * not a conic sweep, because minutes-against-a-target is an amount
               * and not a timer. A solid disc cannot say that, so a night at 25
               * of 105 minutes now looks exactly like a night at 105.
               *
               * WHERE THE SHORTFALL STILL SHOWS: the `standing.behind` line
               * under the strip, which states the gap in minutes and what closes
               * it, and the observed-average line above, which reports the
               * evening the learner is actually keeping. Both are words rather
               * than a rendering, which is arguably where a number that precise
               * belonged anyway — the strip's job in every other state is WHICH
               * NIGHTS, not how full they were.
               *
               * ⚠ AT RISK IS THE STATE THIS FLATTERS. `progress-at-risk` is
               * authored as [25, 0, 40, …] against a target near an hour and
               * three quarters — two token evenings that now read as two
               * complete ones. If that state stops looking at risk at a glance,
               * this is why, and the fix is a treatment that distinguishes a
               * short night from a full one without going back to a wash.
               */
              background: on ? 'var(--color-primary-500)' : 'transparent',
              boxShadow: `inset 0 0 0 1px ${
                on ? 'var(--color-primary-500)' : 'var(--color-border-subtle)'
              }`,
              color: on ? 'var(--color-primary-100)' : 'var(--color-text-tertiary)',
        } satisfies CSSProperties
        if (!pickable) {
          return (
            <span key={label} style={dayStyle}>
              {label.slice(0, 1)}
            </span>
          )
        }
        return (
          <button
            key={label}
            type="button"
            data-cta-id="home.week-strip"
            /* THE FULL DAY NAME, and how many nights this picks. The visible
               glyph is one letter and two of them are "T" — an accessible name
               of "T" would be unusable, and 2.5.3 (Label in Name) is satisfied
               because the visible text is contained in it. */
            aria-label={`${label} — ${i + 1} ${i === 0 ? 'night' : 'nights'} a week`}
            aria-pressed={planned}
            onClick={() => onPick?.(i + 1)}
            style={{ ...dayStyle, border: 0, padding: 0, cursor: 'pointer' }}
          >
            {label.slice(0, 1)}
          </button>
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
function CustomizeLink({
  onClick,
  disabled,
  label = 'Customize Your Pacing',
}: {
  onClick: () => void
  disabled?: boolean
  /**
   * "View Study Plan" once the learner is under way — 2026-09-23.
   *
   * THE VERB TRACKS THE LEARNER'S SITUATION, and it has moved twice. It was
   * "Customize Study Plan" everywhere, then "Adjust Study Plan" once under way
   * (customise is what you do to something you are setting up; adjust is what
   * you do to something already running), and is now VIEW.
   *
   * ⚠ VIEW IS THE WEAKER PROMISE, AND THAT IS THE POINT. At 63% the card has
   * stopped proposing and started reporting — the heading says "Your Study
   * Pace", the headline states a finish date. A link offering to ADJUST that
   * invites a learner to change a plan the card has just told them is working;
   * VIEW offers the detail behind the claim, which is what the sheet actually
   * shows first. The 0% label stays "Customize Your Pacing", where changing it
   * IS the job.
   * The sheet behind it is the same sheet either way, which is the point: the
   * verb tracks the learner's situation, not a second destination.
   */
  label?: string
}) {
  return (
    <button
      type="button"
      data-cta-id="home.study-pace-adjust"
      onClick={disabled ? undefined : onClick}
      {...(disabled ? {} : { 'aria-haspopup': 'dialog' as const })}
      /*
       * DISABLED ON THE `options` CHOOSER — 2026-09-23, the direct note: "if
       * the other study pace widget variant is on, the Customize link will be
       * disabled."
       *
       * The two treatments answer the same question in two places: on `options`
       * the three plans are ON the card, so a link into a sheet offering the
       * same three would be one door too many. On `strip` the card has no
       * picker and the sheet IS the picker, which is what the sheet's chooser
       * was just rebuilt for.
       *
       * ⚠ IT TAKES "BUILD MY OWN" WITH IT, and that is the cost to weigh: the
       * sheet's custom screens are the only way to express a week that is not
       * "the first N days", and on this variant nothing reaches them.
       *
       * ⚠ AND IT LOOKS LIVE, by instruction — 2026-09-23: "don't make it appear
       * disabled, just disable the link to trigger the sheet at this time." It
       * carried `disabled`, a 0.45 opacity and a `title` explaining itself for
       * an hour. So this is knowingly a control that looks pressable and is
       * not, which is the shape the rest of this card avoids on purpose (the
       * top bar's Notes and Ask Rubi are spans for exactly that reason). It
       * reads as temporary — "at this time" — rather than as the finished
       * state, and the fix when the time comes is to give it somewhere to go
       * rather than to re-grey it.
       */
      className="cre-link-action cre-cta-ink"
      style={{
        cursor: 'pointer',
        alignSelf: 'flex-end',
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'transparent',
        border: 0,
        padding: 0,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      <ChevronRight size={14} aria-hidden />
    </button>
  )
}


/**
 * The note that the finish date moves.
 *
 * ONE STRING, TWO HOMES — the prose variant prints it as the card's third line;
 * the stats variant hangs it off an info tip on the Course completion cell
 * (2026-09-23, the direct ask). Shared rather than typed twice because it is
 * the same caveat about the same figure, and two copies of a caveat drift into
 * two different promises.
 */
const FINISH_DATE_NOTE =
  'Your estimated finish date will update as you progress through the material and your study pace changes.'

/**
 * THE THREE-CELL READOUT — `study-pace-readout: stats`.
 *
 * 2026-09-23, the direct ask: Course Access, Estimated Completion Date and
 * Status, "with small dividers in between them".
 *
 * A GRID, NOT A FLEX ROW, so the three columns are equal whatever their content
 * is. Flexed, "Estimated Completion Date" is the longest label by a distance
 * and would have taken width off the other two — the cells would be sized by
 * their captions rather than by the reading, which is the thing being compared.
 *
 * THE DIVIDERS ARE BORDERS ON THE CELLS, not elements between them. Three
 * spacers in a six-child grid is a row that breaks differently the moment a
 * cell wraps; a `border-left` on all but the first cannot come apart from the
 * cell it divides. `--color-border-subtle` is the same hairline the stat rows
 * elsewhere in this band use.
 *
 * IT DOES NOT WRAP. At 511px of inner width each cell has ~159px, which holds
 * the longest caption over two lines and every value on one. Below that the
 * band has already stacked to the mobile arrangement, where this tile is
 * full-width again.
 */
function PaceStatsRow({
  preset,
  daysToCeiling,
  ceilingIso,
  examBinds,
}: {
  preset: PacePreset
  daysToCeiling: number
  ceilingIso?: string
  examBinds: boolean
}) {
  const noFit = preset.state === 'no'
  /* Finish → ceiling, both as local dates. `daysBetween` rather than
     `daysToCeiling - preset.days`: the ceiling is already expiry-minus-one, so
     that subtraction is a day short, and the two dates are what the cells
     beside this one actually print. */
  const finish = dateFromIso(preset.finishIso)
  const ceiling = dateFromIso(ceilingIso)
  const daysToReview = finish && ceiling ? Math.max(0, daysBetween(finish, ceiling)) : null
  return (
    <div style={statsRowStyle}>
      <div style={statsFirstCellStyle}>
        <p style={statsEyebrowStyle}>{examBinds ? 'Time to exam' : 'Course access'}</p>
        {/* PLURALISED HERE, not by `unitCount` — that helper appends the unit
            it is given and nothing more, so `unitCount(17, 'day')` printed
            "17 day" in the first build. The same `n === 1` rule `timeRemaining`
            uses, so the two surfaces say it the same way. */}
        <p style={statsValueStyle}>
          {Math.max(0, daysToCeiling)} {Math.max(0, daysToCeiling) === 1 ? 'day' : 'days'}
        </p>
        {/* THE END DATE UNDER THE COUNTDOWN — the chosen answer, and the half
            the prose would otherwise have taken with it. "29 days" without it
            is a number counting to nothing a learner can see. */}
        {ceilingIso ? (
          <p style={statsSubStyle}>
            {examBinds ? 'Exam on ' : 'Ends '}
            {formatPaceDate(ceilingIso)}
          </p>
        ) : null}
      </div>
      <div style={{ ...statsCellStyle, ...statsDividedStyle }}>
        <p style={{ ...statsEyebrowStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
          Course completion
          {/* A REAL BUTTON, because `Tooltip` needs a focusable trigger and a
              tip only a mouse can reach is not a tip. `type="button"` so it
              cannot submit anything, and an `aria-label` because the glyph has
              no text of its own. */}
          <Tooltip content={FINISH_DATE_NOTE}>
            <button
              type="button"
              data-cta-id="home.study-pace-info"
              aria-label="About this date"
              style={statsInfoStyle}
            >
              <CircleInfo size={12} aria-hidden />
            </button>
          </Tooltip>
        </p>
        <p style={noFit ? { ...statsValueStyle, ...statsValueMutedStyle } : statsValueStyle}>
          {noFit ? 'Not achievable' : formatPaceDate(preset.finishIso)}
        </p>
        {/* "AT YOUR CURRENT PACE" — 2026-09-23, the direct ask, and it is what
            lets the eyebrow shorten from "Estimated completion date" to "Course
            completion". The qualifier moved rather than vanished: the estimate
            is still labelled an estimate, just under the date instead of in
            front of it, where the caption had been the longest in the row and
            the only one to wrap.

            ⚠ SUPPRESSED WHEN NOTHING FITS. "At your current pace" under "Not
            achievable" names a pace the model has just refused to give — the
            two sentences contradict each other, and the cell is already
            carrying the honest answer. The Course Access cell keeps its own
            sub-line in every state, so the row does not lose its shape. */}
        {/* NO FULL STOP — 2026-09-23, matching "Ends May 29" in the cell
            beside it. Both are four-word fragments in the same row, and one
            punctuated like a sentence made the pair look unconsidered. */}
        {noFit ? null : <p style={statsSubStyle}>At your current pace</p>}
      </div>
      {/*
        DAYS TO REVIEW — 2026-09-23, replacing the Status cell. The gap between
        the plan's finish date and the day access ends: time the learner still
        has the course open, with the coursework already behind them.
        
        ⚠ IT IS NOT A NEW FIGURE, it is one the model was already choosing and
        never showing. `RECOMMENDED_BUFFER_DAYS` is why Recommended finishes
        five days short of the ceiling rather than on it — so this cell prints
        the reason that preset exists. It moves with the preset, which is the
        point: Relaxed spends the buffer and shows 1, Focused banks more.
        
        CLAMPED AT NOUGHT. A plan that overruns its ceiling gives a negative
        gap, and "-6 days" of prep time is not a reading, it is the won't-fit
        state said in arithmetic — which the cell beside it already says in
        words.
      */}
      <div style={{ ...statsCellStyle, ...statsDividedStyle, paddingRight: 0 }}>
        <p style={statsEyebrowStyle}>Days to review</p>
        <p style={statsValueStyle}>
          {daysToReview == null
            ? '\u2014'
            : `${daysToReview} ${daysToReview === 1 ? 'day' : 'days'}`}
        </p>
        <p style={statsSubStyle}>Extra prep time</p>
      </div>
    </div>
  )
}

const statsRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  alignItems: 'start',
}

/*
 * 18px EACH SIDE OF A DIVIDER, and NONE on the row's outer edges —
 * 2026-09-23, the direct ask: "remove left padding and have the divider lines
 * be more centered between the 2 components."
 *
 * It was a flat `0 14px` on every cell, which did two things wrong at once.
 * The first cell's own 14px indented "COURSE ACCESS" from the card's content
 * edge, so the readout started 14px right of the headline and the week strip
 * above it — a row that looked inset rather than aligned. And 14 left the
 * divider nearer the cell after it than the one before, because the cell
 * before ends in whatever space its text does not use while the cell after
 * starts at its padding exactly.
 *
 * So the outer edges lose their padding (`:first-child` gets no left, and the
 * last cell needs no right — the row ends at the card's own padding) and the
 * inner gutter grows to 36, split 18/18 by the border. Wider is what makes it
 * read as centred; the arithmetic was already symmetric.
 */
const statsCellStyle: CSSProperties = {
  minWidth: 0,
  padding: '0 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

/** The row's first cell — flush with the card's content edge. */
const statsFirstCellStyle: CSSProperties = {
  ...statsCellStyle,
  paddingLeft: 0,
}

/** First cell has no rule; the other two carry their own left border. */
const statsDividedStyle: CSSProperties = {
  borderLeft: '1px solid var(--color-border-subtle)',
}

const statsEyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  lineHeight: '14px',
  color: 'var(--color-text-tertiary)',
}

/** The heading face, at the size the card's other figures take \u2014 see
 *  `emphasis`. The serif reads smaller than the sans at a matched size. */
const statsValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 16,
  fontWeight: 700,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

/** "Not achievable" is a STATEMENT, not a reading — the figure weight would
 *  make it look like one. */
const statsValueMutedStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}

/** The tip's trigger. No box, no padding — it sits inside an eyebrow and any
 *  chrome would make a 10px caption look like a control. */
const statsInfoStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-text-tertiary)',
  lineHeight: 0,
}

const statsSubStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: '16px',
  color: 'var(--color-text-tertiary)',
}

/** `"1¾ hours"` → `["1¾", "hours"]`; `"45 min"` → `["45", "min"]`. A display
 *  split of ONE formatter's output — see the note at its call site. */
function splitFigure(s: string): [string, string] {
  const i = s.lastIndexOf(' ')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}

/**
 * The line that hangs off the eyebrow — "Based on your actual course progress
 * and time spent studying".
 *
 * ⚠ IT WEARS THE STATS ROW'S SUB-LINE, not the card body. 11.5/16 in the
 * tertiary ink is exactly what "Ends May 29" is set in, which is the point:
 * both are provenance for the thing above them, so they should be the same
 * voice. At body size it read as the card's first SENTENCE instead of as a
 * caption on the heading.
 *
 * ⚠ THE 19px INDENT IS THE EYEBROW'S ICON. `SquareTile`'s caption is a flex
 * row of `<Clock size={13} />` and the text with a 6px gap, so its words start
 * 19px in — and a sub-line flush to the card edge hangs off the ICON rather
 * than the words it belongs to. Change the glyph or the gap and this follows:
 * it is 13 + 6, not a number that happened to look right.
 *
 * `marginTop: -8` closes `cardStack`'s 14px gap to something that reads as
 * attached to the heading rather than as the first item of the body.
 */
const eyebrowSubStyle: CSSProperties = {
  margin: '-8px 0 -4px',
  marginInlineStart: 19,
  fontFamily: 'var(--font-body)',
  fontSize: 11.5,
  lineHeight: '16px',
  color: 'var(--color-text-tertiary)',
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

const streakStack: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}


const streakFigure: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: 'var(--color-text-primary)',
}

/* `flex: 1` on every bar with a 3px gap — the row fills whatever width the
   card has, which is what keeps 30 bars legible in a column that is 490px on
   the dashboard and narrower in the sheet. */
/* THREE CELLS, TWO HAIRLINES. `baseline` rather than `center` so the big
   figures sit on one line with the words beside them — centring makes the
   24px numbers look as though they are floating above their own labels. */
const statRow: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
}

const statCell: CSSProperties = {
  margin: 0,
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}

/* `alignSelf: stretch` would stretch to the flex line, which the wrapping
   makes unpredictable; a fixed 18px rule sits with the figures instead. */
const statRule: CSSProperties = {
  width: 1,
  height: 18,
  flex: 'none',
  background: 'var(--color-border-subtle)',
}


const streakBars: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  gap: 3,
  height: 40,
  /* ⚠ ON THE BARS, NOT ON `cardStack`'s GAP. The row sits between the activity
     figures it belongs to and the stats row it does not, and widening the
     stack's gap would push the figures away from their own chart as well.
     A bottom margin separates the activity block from what follows and leaves
     it internally tight. */
  marginBottom: 10,
}

const streakBar: CSSProperties = {
  flex: 1,
  minWidth: 0,
  borderRadius: '2px 2px 0 0',
  display: 'block',
}


const cardBody = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 12.5,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
} as const

/*
 * THE CARD'S FIGURES, IN THE HEADING FACE — 2026-09-23, the direct ask pointed
 * at "22 days" and "May 29": "change this to the serif font".
 *
 * `--font-heading`, not a literal serif stack, for the reason `cardHeadline`
 * already records one screen up: the token follows `dashboard-heading-font`, so
 * a hard-coded serif here would be the one thing on the card that stayed serif
 * when the page went sans. Source Serif 4 is that token's serif stop.
 *
 * APPLIED TO EVERY `emphasis`, INCLUDING THE BEHIND-PACE WARNING LINES, which
 * is more than the two the ask named. One treatment: a figure in this card is
 * serif. Serifing only the two on screen today would have left "you are 2 hours
 * short this week" in the body face — a rule nobody could state, breaking the
 * first time a learner fell behind.
 */
/** The qualifier under the two fact lines — see its call site. 11.5/16 against
 *  the body's 12.5/20, in the tertiary ink, with a little air above so it reads
 *  as a note on the block rather than the next line of it. */
const cardHelper = {
  margin: '2px 0 0',
  fontSize: 11.5,
  lineHeight: '16px',
  color: 'var(--color-text-tertiary)',
} as const

const emphasis = {
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-heading)',
  /* A STEP LARGER THAN THE BODY — 14 against 12.5 (2026-09-23, "make a little
     larger"). The serif reads smaller than the sans at a matched size, so
     inheriting 12.5 made the figures look like a de-emphasis rather than the
     opposite.

     NO `lineHeight` OF ITS OWN, deliberately: these are inline `<b>`s inside
     `cardBody`'s 20px lines, and a taller line-height on an inline child does
     not push its own line down evenly — it nudges the paragraph and leaves the
     three lines unevenly spaced. 14px has the room in a 20px line already. */
  fontSize: 14,
  fontWeight: 700,
} as const
