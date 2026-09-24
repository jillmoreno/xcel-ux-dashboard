import { daysUntilIso } from '@/data/courseExpiry'

/**
 * Study Pace — the derivation, as pure functions. No React, no fixtures.
 *
 * Ported 2026-09-21 from `public/prototypes/xcel-pace-presets.html`, which is
 * where the argument was made and is still the place to read it. Three claims
 * survive the port and are what these functions exist to keep true:
 *
 *   1. **A preset is a DATE, not a weekly quota.** Relaxed / Recommended /
 *      Focused are three dates the learner already owns — the end of their
 *      access, that minus a buffer, and the storefront's own "less than 2
 *      weeks" — and the pace is derived from whichever they pick. Nobody is
 *      asked to judge whether 5 hours a week is a lot.
 *   2. **TWO ceilings can bind, and the caller must be able to say which.**
 *      Course access expiry, and (when there is one) the exam date minus a
 *      review buffer. The SOONER one governs; `binding` records it so the UI
 *      can explain itself instead of silently switching.
 *   3. **One nights count across all three presets**, derived from
 *      Recommended. Choosing it per-preset made a 3-night Relaxed read heavier
 *      per evening than a 4-night Recommended, and the presets stopped being
 *      comparable — the defect the prototype's suite caught.
 *
 * ONE DEPARTURE FROM THE PROTOTYPE, and it is an improvement rather than
 * drift. The prototype priced a lesson at `MINS_PER_LESSON_INVENTED` (35) and
 * flagged the gap between that and the storefront's published credit hours as
 * its biggest open hole — if seat-time were the real figure, every evening it
 * quoted was ~1.6x too light. **The product does not need the invention**: a
 * course record carries real `hours`, so this module works in HOURS OF WORK
 * REMAINING and the hole closes by construction. Nothing here converts lessons
 * to minutes.
 *
 * ⚠ Dates follow `courseExpiry`'s rule: never `new Date(isoString)`, which
 * parses as UTC and renders the previous day in a western timezone. ISO input
 * is measured with `daysUntilIso`; ISO output is built by string surgery.
 */

/** Days between finishing coursework and sitting the exam, so there is time to
 *  review. Deliberately the SAME number `xcel-study-plan.html` uses for its own
 *  `EXAM_BUFFER_INVENTED` — two surfaces disagreeing about how long revision
 *  takes is how a learner stops believing either. */
export const EXAM_BUFFER_DAYS = 7

/** Days before access ends that the Recommended preset aims to finish, so one
 *  slow week does not cost the course. */
export const RECOMMENDED_BUFFER_DAYS = 5

/** The Focused preset aims here. From the XCEL product page: "prepares you to
 *  pass the insurance exam in less than 2 weeks". */
export const FOCUSED_DAYS = 14

/** Over this, an evening is flagged heavy; the nights picker adds a night
 *  before quoting it. */
export const STRAIN_MINS = 120

/** Over this at six nights a week, no pace is offered — no number is honest
 *  there, and the answer is more time or fewer lessons, not a bigger figure. */
export const CEILING_MINS = 210

/** Under this an evening may fairly be called "relaxed". The prototype's grid
 *  showed the word is a property of COURSE LENGTH, not of the preset: the same
 *  date costs 34 min on a short course and 1.5 hours on a long one. */
export const EASY_MINS = 45

/** Thorough / Average / Quick, as multipliers on the hours a course claims.
 *  Notes and normal-speed video genuinely cost more; essentials-only at 2x
 *  costs less. */
export const STYLE_FACTORS = { thorough: 1.3, average: 1, quick: 0.75 } as const
export type StudyStyle = keyof typeof STYLE_FACTORS

/** The nights-a-week options offered, in the order the picker shows them. */
export const NIGHT_OPTIONS = [3, 4, 5, 6] as const

/**
 * The week a learner who has not started yet is shown — 2026-09-22, the direct
 * ask ("at 0% this should default to ## hours a night, 4 days a week, and the
 * calendar should indicate a mon-thurs schedule").
 *
 * WHY A DEFAULT RATHER THAN THE DERIVATION. Past 0% the nights count is
 * CHOSEN by `buildPreset` — the fewest nights that keep an evening under
 * `STRAIN_MINS` — which is the right answer for a learner with a deadline
 * bearing down and the wrong FIRST thing to say to one who has opened the
 * course today. At 0% the derivation had picked six nights and printed
 * "15½ hours a week", which is a workload, not an invitation.
 *
 * FOUR, and Mon–Thu specifically: `defaultWeekdays(4)` returns `[0,1,2,3]`, and
 * that helper is Monday-first, so the strip shades Mon–Thu with no second
 * source of truth about which days those are.
 *
 * IT IS A STARTING POSITION, NOT A CLAIM. The moment the learner picks a nights
 * count or builds a plan, `choices.nights` / `plan.weekdays` win — the same
 * rule `defaultWeekdays` already states. And the evening is still DERIVED: the
 * hours are whatever the course needs spread over four nights, never a figure
 * authored to look comfortable.
 */
export const NOT_STARTED_NIGHTS = 4

export type PresetId = 'relaxed' | 'recommended' | 'focused'
export type PaceState = 'easy' | 'ok' | 'heavy' | 'no'
/** Which ceiling is actually governing the pace. */
export type Binding = 'access' | 'exam' | 'both' | 'none'

export type PaceInput = {
  /** The clock. Prototype surfaces pass the anchored fixture date. */
  today: Date
  /** Hours of work left in the course. Real published credit hours x what is
   *  left to do — see the file header on why this is not lessons. */
  hoursRemaining: number
  /** ISO yyyy-mm-dd. When the course's access ends. */
  accessExpiresAt?: string
  /** ISO yyyy-mm-dd. The exam the learner is working towards, if they have
   *  given one. Coursework must finish `EXAM_BUFFER_DAYS` before it. */
  examDate?: string
  /** Learner's chosen nights a week. Omit to let the model choose. */
  nights?: number
  /** Defaults to `'average'`. */
  style?: StudyStyle
}

export type PacePreset = {
  id: PresetId
  /** Days from today to the finish date. */
  days: number
  /** ISO yyyy-mm-dd. */
  finishIso: string
  /** Minutes on each studied evening. `Infinity` when the preset cannot fit. */
  minsPerNight: number
  /** Minutes of work a week this preset requires, before it is split. */
  minsPerWeek: number
  nights: number
  state: PaceState
}

export type PaceModel = {
  /** ISO yyyy-mm-dd of the last day coursework may finish. */
  hardEndIso: string
  binding: Binding
  /** Days from today to the binding ceiling. */
  daysToCeiling: number
  /** The nights count all three presets share, derived from Recommended. */
  nights: number
  /** Whether `nights` came from the learner rather than the model. */
  nightsChosen: boolean
  /** Only the presets worth offering — see `usablePresets`. */
  presets: PacePreset[]
  hoursRemaining: number
}

const MS_PER_DAY = 86_400_000

/** ISO yyyy-mm-dd -> a LOCAL `Date` at midnight. Built from parts, never from
 *  the string, per the `courseExpiry` header. Null when unparseable. */
export function dateFromIso(iso: string | undefined): Date | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** A `Date` -> ISO yyyy-mm-dd of its LOCAL calendar day. */
export function isoFromDate(d: Date): string {
  const mo = d.getMonth() + 1
  const day = d.getDate()
  return `${d.getFullYear()}-${mo < 10 ? '0' : ''}${mo}-${day < 10 ? '0' : ''}${day}`
}

/** `today` + n days, as ISO. Goes through local parts on both sides. */
export function isoPlusDays(today: Date, n: number): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  d.setDate(d.getDate() + n)
  return isoFromDate(d)
}

/** Whole days from `today` to an ISO date; null when unparseable. Re-exported
 *  shape of `courseExpiry`'s helper so callers need one import. */
export function daysUntil(iso: string | undefined, today: Date): number | null {
  return daysUntilIso(iso, today)
}

/** Whole days between two `Date`s, date-only on both sides. */
export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / MS_PER_DAY)
}

/**
 * Which ceiling binds, and where it falls.
 *
 * Access gives its LAST USABLE DAY (expiry minus one) — finishing on the day
 * access dies is not finishing. The exam gives its date minus the review
 * buffer. With neither, there is no ceiling and the caller gets `'none'`;
 * `hardEndIso` then falls back to the Focused horizon so the presets still have
 * something to aim at rather than dividing by nothing.
 */
export function resolveCeiling(input: PaceInput): {
  hardEndIso: string
  binding: Binding
  daysToCeiling: number
} {
  const accessDays = input.accessExpiresAt ? daysUntilIso(input.accessExpiresAt, input.today) : null
  const examDays = input.examDate ? daysUntilIso(input.examDate, input.today) : null
  const accessEnd = accessDays == null ? null : accessDays - 1
  const examEnd = examDays == null ? null : examDays - EXAM_BUFFER_DAYS

  if (accessEnd == null && examEnd == null) {
    return { hardEndIso: isoPlusDays(input.today, FOCUSED_DAYS), binding: 'none', daysToCeiling: FOCUSED_DAYS }
  }
  if (accessEnd == null) {
    return { hardEndIso: isoPlusDays(input.today, examEnd!), binding: 'exam', daysToCeiling: examEnd! }
  }
  if (examEnd == null) {
    return { hardEndIso: isoPlusDays(input.today, accessEnd), binding: 'access', daysToCeiling: accessEnd }
  }
  if (examEnd < accessEnd) {
    return { hardEndIso: isoPlusDays(input.today, examEnd), binding: 'exam', daysToCeiling: examEnd }
  }
  if (examEnd === accessEnd) {
    return { hardEndIso: isoPlusDays(input.today, accessEnd), binding: 'both', daysToCeiling: accessEnd }
  }
  return { hardEndIso: isoPlusDays(input.today, accessEnd), binding: 'access', daysToCeiling: accessEnd }
}

/** Price a finish date `days` from today. `nights` of 0/undefined lets the
 *  model pick the fewest that keep an evening under {@link STRAIN_MINS}. */
export function priceFinish(
  input: PaceInput,
  days: number,
  nights?: number,
): Omit<PacePreset, 'id'> {
  const style = STYLE_FACTORS[input.style ?? 'average']
  const minsTotal = Math.max(0, input.hoursRemaining) * 60 * style
  if (days < 1) {
    return {
      days,
      finishIso: isoPlusDays(input.today, Math.max(days, 0)),
      minsPerNight: Infinity,
      minsPerWeek: Infinity,
      nights: nights ?? NIGHT_OPTIONS[NIGHT_OPTIONS.length - 1],
      state: 'no',
    }
  }
  const minsPerWeek = minsTotal / (days / 7)
  const suggested =
    NIGHT_OPTIONS.find((n) => minsPerWeek / n <= STRAIN_MINS) ?? NIGHT_OPTIONS[NIGHT_OPTIONS.length - 1]
  const n = nights ?? suggested
  const minsPerNight = minsPerWeek / n
  const state: PaceState =
    minsPerWeek > CEILING_MINS * NIGHT_OPTIONS[NIGHT_OPTIONS.length - 1]
      ? 'no'
      : minsPerNight > STRAIN_MINS
        ? 'heavy'
        : minsPerNight <= EASY_MINS
          ? 'easy'
          : 'ok'
  return { days, finishIso: isoPlusDays(input.today, days), minsPerNight, minsPerWeek, nights: n, state }
}

/** The nights count Recommended asks for — the one every preset then shares. */
export function suggestedNights(input: PaceInput): number {
  const { daysToCeiling } = resolveCeiling(input)
  const recDays = Math.max(1, daysToCeiling - (RECOMMENDED_BUFFER_DAYS - 1))
  return priceFinish({ ...input, nights: undefined }, recDays).nights
}

/**
 * The whole model: the ceiling, the shared nights count, and the presets worth
 * offering.
 *
 * FOCUSED IS DROPPED once it is no longer faster than Recommended — late in a
 * window, two weeks out lands after the buffered finish, and a preset that is
 * not faster than the one beside it is a label with nothing behind it. Presets
 * that cannot fit at all are kept in the list with `state: 'no'` so the UI can
 * show them disabled rather than silently having fewer choices.
 */
export function studyPace(input: PaceInput): PaceModel {
  const { hardEndIso, binding, daysToCeiling } = resolveCeiling(input)
  const nights = input.nights ?? suggestedNights(input)
  const relaxedDays = daysToCeiling
  const recommendedDays = Math.max(1, daysToCeiling - (RECOMMENDED_BUFFER_DAYS - 1))
  const focusedDays = Math.min(FOCUSED_DAYS, daysToCeiling)

  const build = (id: PresetId, days: number): PacePreset => ({
    id,
    ...priceFinish(input, Math.min(days, daysToCeiling), nights),
  })
  const relaxed = build('relaxed', relaxedDays)
  const recommended = build('recommended', recommendedDays)
  const focused = build('focused', focusedDays)

  const presets = [relaxed, recommended, focused].filter(
    (p) => p.id !== 'focused' || p.days < recommended.days,
  )
  return {
    hardEndIso,
    binding,
    daysToCeiling,
    nights,
    nightsChosen: input.nights != null,
    presets,
    hoursRemaining: input.hoursRemaining,
  }
}

/** The preset a surface should start on: Recommended when it is offered. */
export function defaultPreset(model: PaceModel): PacePreset {
  return model.presets.find((p) => p.id === 'recommended') ?? model.presets[0]
}

/** Minutes -> "45 min" / "1 hour" / "1¼ hours". Quarter-hour precision above an
 *  hour, because rounding 68 and 89 minutes both to "about 1 hour" makes two
 *  different plans read as the same one. */
export function formatEvening(mins: number): string {
  if (!Number.isFinite(mins)) return '—'
  const m = Math.round(mins)
  if (m < 60) return `${m} min`
  const quarters = Math.round(m / 15) / 4
  const whole = Math.floor(quarters)
  const fraction = quarters - whole
  const marks: Record<number, string> = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }
  const suffix = whole === 1 && fraction === 0 ? ' hour' : ' hours'
  return `${whole}${marks[fraction] ?? ''}${suffix}`
}

/** "Oct 13" — the short form every pace surface prints. */
export function formatPaceDate(iso: string): string {
  const d = dateFromIso(iso)
  if (!d) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Preset display names. Kept beside the model so two surfaces cannot name the
 *  same preset differently. */
export const PRESET_LABELS: Record<PresetId, string> = {
  relaxed: 'Relaxed',
  recommended: 'Recommended',
  focused: 'Focused',
}

/**
 * What a preset is AIMING at, in words.
 *
 * Relaxed's label is CONDITIONAL on the number, which is the prototype's §03
 * finding made operational: on a long course the full window still costs most
 * of an evening, and calling that "relaxed" is the product lying in a warm
 * voice. Under {@link EASY_MINS} it keeps the word; above it the preset is
 * described as what it actually is.
 */
export function presetLabel(preset: PacePreset): string {
  if (preset.id === 'relaxed') return preset.state === 'easy' ? 'Relaxed' : 'Full window'
  return PRESET_LABELS[preset.id]
}

/**
 * How many days of review a plan leaves, and what that makes it.
 *
 * 2026-09-23, the direct ask: the card's name follows the OUTCOME rather than
 * which preset produced it — "Focused & Quick if the user will complete with
 * more than 15 days to review, Recommended if at least 7, Relaxed if 3 or
 * less."
 *
 * ⚠ THE ASK LEAVES 4-6 UNSTATED, and this reads the three rules as one
 * descending ladder: anything that is not Focused and not Recommended is
 * Relaxed. That covers the three cases named and gives the middle band a home;
 * the alternative — a fourth name for 4-6 days — would be inventing a
 * vocabulary nobody asked for. Worth confirming if a plan landing at 5 ever
 * looks mislabelled.
 *
 * ⚠ IT SUPERSEDES A PRESET-BASED MAPPING, and takes one real risk with it. The
 * old version answered `Custom` for a week the learner built, which was the
 * provenance rule's home: the product must not go on calling a figure the
 * learner picked a recommendation. Now a learner-chosen plan landing in the
 * 7-15 band is called "Recommended". The defence is that the ladder names the
 * PLAN's shape rather than its author — "Recommended" here means "lands where
 * we would have put it" — but it is a genuine narrowing of that rule and the
 * reason it is spelled out at length here.
 */
export const REVIEW_DAYS_FOCUSED = 15
export const REVIEW_DAYS_RECOMMENDED = 7

export function paceNameFor(daysToReview: number | null): string {
  if (daysToReview == null) return 'Recommended'
  if (daysToReview > REVIEW_DAYS_FOCUSED) return 'Focused & Quick'
  if (daysToReview >= REVIEW_DAYS_RECOMMENDED) return 'Recommended'
  return 'Steady & Relaxed'
}

/**
 * Days between a plan's finish and the ceiling it was priced against — the
 * "Days to review" cell, and now the input the card's own NAME is derived from.
 *
 * ONE FUNCTION so the cell and the heading cannot disagree: they were two
 * derivations for an afternoon and that is exactly how a card comes to print
 * "Steady & Relaxed" above a readout saying 16 days.
 */
export function daysToReviewFor(finishIso: string, ceilingIso?: string): number | null {
  const finish = dateFromIso(finishIso)
  const ceiling = dateFromIso(ceilingIso)
  if (!finish || !ceiling) return null
  return Math.max(0, daysBetween(finish, ceiling))
}

/**
 * THE THREE PLANS A LEARNER PICKS BETWEEN — 2026-09-23, the direct ask:
 * "3 selectable options below that title. Recommended = somewhere in between
 * the 2 below. Focused & Quick = studying 7 days / week. Steady & Relaxed =
 * studying the least amount to still finish in time."
 *
 * ⚠ NOT THREE NEW PLANS. These ARE `studyPace`'s own `relaxed` / `recommended`
 * / `focused` presets, given the three names and a nights count each. The ask
 * said not to lose the current logic and this is what that means in practice:
 * the model still decides how long each plan takes, and all this adds is which
 * evenings it falls on.
 *
 * HOW THE NIGHTS ARE CHOSEN, per option:
 *
 *   • Focused & Quick — SEVEN, flat. The ask names it, and the fastest preset
 *     is the one where seven evenings are the point.
 *   • Steady & Relaxed — the FEWEST that still fits. "The least amount to still
 *     finish in time" is a search, not a constant: at 42 lessons over a 29-day
 *     window three nights prices at 203 minutes, inside the 210 ceiling, so
 *     three it is. On a shorter window three would breach it and the answer
 *     becomes four, or five.
 *   • Recommended — the model's own suggestion, which is the first nights count
 *     whose evening stays under `STRAIN_MINS`. That is already "somewhere in
 *     between": it cannot be fewer than the relaxed answer (a shorter plan
 *     needs at least as many evenings) and it is rarely seven.
 *
 * ⚠ THE ORDER IS RELAXED → RECOMMENDED → FOCUSED, fewest nights to most, and
 * the array is returned that way so a caller never has to sort. It is also the
 * order the ask lists them in once you read "the 2 below" as the outer pair.
 */
export type PaceOption = {
  id: PresetId
  name: string
  nights: number
  /** The plan as the model prices it, with those nights. */
  priced: Omit<PacePreset, 'id'>
}

/** The most evenings a week there are. Seven, and named because
 *  `Focused & Quick` is defined as all of them. */
export const ALL_NIGHTS = 7

export function paceOptionsFor(input: PaceInput): PaceOption[] {
  const { daysToCeiling } = resolveCeiling(input)
  const recommendedDays = Math.max(1, daysToCeiling - (RECOMMENDED_BUFFER_DAYS - 1))

  /*
   * ⚠ THE FLOOR IS `NIGHT_OPTIONS[0]`, NOT ONE, and a first build searched from
   * one — which produced a "Steady & Relaxed" of TWO nights a week on a long
   * course. Two is not a week this product offers: the Adjust sheet's own list
   * starts at three, so the picker was inventing a plan the sheet would refuse
   * to show. Reading the floor off that list rather than typing 3 keeps the two
   * controls agreeing by construction.
   */
  const MIN_NIGHTS = NIGHT_OPTIONS[0]

  /** The fewest nights (from the floor up) whose plan the model will price. */
  const fewestThatFits = (days: number): number | null => {
    for (let n = MIN_NIGHTS; n <= ALL_NIGHTS; n++) {
      if (priceFinish(input, days, n).state !== 'no') return n
    }
    return null
  }

  /** The fewest nights whose evening is merely HEAVY rather than punishing. */
  const fewestUnderStrain = (days: number): number | null => {
    for (let n = MIN_NIGHTS; n <= ALL_NIGHTS; n++) {
      if (priceFinish(input, days, n).minsPerNight <= STRAIN_MINS) return n
    }
    return null
  }

  /*
   * ⚠ "FITS" MEANS `state !== 'no'`, NOT `minsPerNight <= CEILING_MINS`, and
   * the difference is what a first build got wrong on every single option. The
   * model's own refusal is about the WEEK — `minsPerWeek > CEILING_MINS × 6` —
   * so a plan of seven evenings at exactly 210 minutes passes a per-night test
   * and is still one the model will not quote.
   */

  /**
   * The earliest finish `n` nights a week can honestly reach.
   *
   * ⚠ BOTH TESTS, AND THE SECOND ONE IS NOT OPTIONAL. The model's own refusal
   * is about the WEEK (`minsPerWeek > CEILING_MINS × 6`), which three very long
   * evenings slip under: 3 × 6¾ hours is 20¼ hours a week, inside the weekly
   * cap, and the picker duly offered "Focused & Quick — 3 days a week, 6¾
   * hours a night". Nobody studies for six and three quarter hours in an
   * evening. `CEILING_MINS` is the model's own "no number is honest above
   * here" threshold and it has to be applied per NIGHT as well.
   */
  const earliestFit = (n: number): number | null => {
    for (let d = 1; d <= daysToCeiling; d++) {
      const priced = priceFinish(input, d, n)
      if (priced.state !== 'no' && priced.minsPerNight <= CEILING_MINS) return d
    }
    return null
  }

  const recommendedNights =
    fewestUnderStrain(recommendedDays) ?? fewestThatFits(recommendedDays) ?? ALL_NIGHTS

  /*
   * ⚠ THE TWO OUTER PLANS WERE THE WRONG WAY ROUND UNTIL 2026-09-23, and the
   * card said so out loud: "Steady & Relaxed — 3 days a week, 3¼ hours a
   * night" sat beside "Focused & Quick — 7 days a week, 2¾ hours a night".
   * The RELAXED plan was asking for the LONGEST evenings on the card.
   *
   * It followed from how each was defined. Relaxed was "the FEWEST nights that
   * still fits in the window" — which minimises how many evenings you give up
   * and therefore maximises how long each one has to be. Focused was "all seven
   * nights". Both readings are defensible in isolation and together they
   * inverted the names.
   *
   * THE DEFINITIONS NOW FOLLOW THE WORDS:
   *
   *   STEADY & RELAXED — every night, over the whole window. "Steady" is the
   *   seven; "Relaxed" is what spreading the work across all of them does to
   *   the evening. This is the SHORTEST nightly session the model can offer,
   *   which is what makes it the gentle option.
   *
   *   FOCUSED & QUICK — the FEWEST nights that still finishes sooner than
   *   Recommended. Concentrated evenings, fewer of them, done first. Searching
   *   upward from the floor is what makes it "focused"; the `< recommended`
   *   test is what keeps it "quick", and it is a guarantee rather than a hope —
   *   a picker of three fixed names cannot drop one the way `studyPace` drops
   *   focused when it stops being faster.
   */
  const relaxedNights = ALL_NIGHTS
  const recommendedFinish = Math.max(earliestFit(recommendedNights) ?? 1, recommendedDays)
  const focused = (() => {
    for (let n = MIN_NIGHTS; n <= ALL_NIGHTS; n++) {
      const d = earliestFit(n)
      if (d != null && d < recommendedFinish) return { nights: n, days: d }
    }
    /* Nothing beats Recommended — a window so short that even seven evenings
       cannot get ahead of it. Seven nights at the earliest they can manage is
       still the most focused thing available, and `priceFinish` will mark it
       `no` if it is not achievable at all. */
    return { nights: ALL_NIGHTS, days: earliestFit(ALL_NIGHTS) ?? daysToCeiling }
  })()

  return [
    {
      id: 'relaxed',
      name: 'Steady & Relaxed',
      /* Every night, all the way to the ceiling — the shortest evening the
         model can offer, and the latest finish. */
      nights: relaxedNights,
      priced: priceFinish(input, daysToCeiling, relaxedNights),
    },
    {
      id: 'recommended',
      name: 'Recommended',
      nights: recommendedNights,
      /* NEVER FASTER THAN FOCUSED — the middle option has to BE in the middle,
         which the day counts do not guarantee on a short window where the
         buffer eats most of it. */
      priced: priceFinish(input, Math.max(focused.days, recommendedFinish), recommendedNights),
    },
    {
      id: 'focused',
      name: 'Focused & Quick',
      nights: focused.nights,
      priced: priceFinish(input, focused.days, focused.nights),
    },
  ]
}

/** Short weekday labels, Monday-first — the order `plan.weekdays` indexes into
 *  (0 = Mon … 6 = Sun). */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/**
 * Which days a pace of `n` nights falls on before the learner says otherwise —
 * the first `n`, Monday-first.
 *
 * MOVED HERE from `StudyPaceSheet` on 2026-09-21, unchanged, because a SECOND
 * caller arrived: the `presets` card draws a week strip and has to shade the
 * same days the sheet would propose. Two surfaces deriving "which nights" apart
 * from each other is how a card comes to shade Mon–Thu while the plan behind it
 * builds Mon–Wed + Fri.
 *
 * It is a DEFAULT, not a claim about the learner: the moment they build a plan,
 * `plan.weekdays` is authoritative and both surfaces read that instead.
 */
export function defaultWeekdays(n: number): number[] {
  return Array.from({ length: Math.max(1, Math.min(7, n)) }, (_, i) => i)
}

/**
 * The same evening, spoken — `1¾ hours` → `"1 hour 45 minutes"`.
 *
 * ADDITIVE, and deliberately separate from {@link formatEvening} rather than a
 * change to it: the tile, the smoke suites and the sheet all read that
 * function's output, and `¾` is the right thing to SHOW. It is the wrong thing
 * to HEAR — a screen reader renders the vulgar fraction as "three quarters",
 * "3/4", or nothing at all depending on the engine, so the one figure this
 * whole component exists to communicate is the one a listener may not get.
 *
 * Callers pair them: the glyph visually, this in a `.cre-sr-only` span.
 *
 * ⚠ IT ROUNDS THROUGH THE SAME QUARTER-HOUR RULE, not off the raw minutes. If
 * it read `Math.round(mins)` directly, 98 minutes would be shown as "1½ hours"
 * and spoken as "1 hour 38 minutes" — two different answers to one question,
 * which is worse than the fraction it set out to fix.
 */
export function formatEveningSpoken(mins: number): string {
  if (!Number.isFinite(mins)) return 'not available'
  const m = Math.round(mins)
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'}`
  const quarters = Math.round(m / 15)
  const hours = Math.floor(quarters / 4)
  const rem = (quarters % 4) * 15
  const hourPart = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return rem ? `${hourPart} ${rem} minutes` : hourPart
}

/** How this week is going against the pace — see {@link weekStanding}. */
export type WeekStanding = {
  /** Minutes the elapsed study days of this week asked for. */
  expected: number
  /** Minutes actually studied across those days. */
  actual: number
  /** `expected - actual`, floored at 0. */
  shortfall: number
  /** Minutes a night for the REST of the week that still lands on target. */
  catchUpPerNight: number
  /** Nights left in the week that this pace studies on. */
  nightsLeft: number
  behind: boolean
  /**
   * Whether `catchUpPerNight` is a number anyone could act on.
   *
   * False once the catch-up evening passes {@link CEILING_MINS} — the same
   * threshold the model already uses to refuse a pace outright ("no number is
   * honest there, and the answer is more time or fewer lessons, not a bigger
   * figure"). A card that answers "you are behind" with "7 hours a night" has
   * technically told the truth and practically said nothing.
   */
  recoverable: boolean
}

/**
 * Is this week on pace, and if not, what closes the gap?
 *
 * ⚠ IT COMPARES ACTUAL MINUTES TO THIS WEEK'S TARGET — not progress against
 * the share of the access window that has elapsed. That distinction is the
 * whole reason this function is safe to add to a version that has refused
 * observed rates throughout: the second comparison invents a SCHEDULE the
 * learner was never given and then reports them behind it, which is the "you
 * are 4 days behind" claim the fixtures cannot support and a test blocks. This
 * one reads two numbers the product actually has — what the pace asked for on
 * the days that have happened, and what was done on them.
 *
 * ONLY ELAPSED STUDY NIGHTS COUNT toward `expected`. A Thursday that has not
 * arrived is not a Thursday they missed, and a rest day was never asked for —
 * counting either would report a shortfall the learner did not incur.
 *
 * `catchUpPerNight` spreads the gap over the nights STILL TO COME, which is the
 * only honest form of "pick up the pace": it is a number they can act on rather
 * than a scolding. With no nights left it is `Infinity` and the caller should
 * say the week is lost rather than quote it.
 */
export function weekStanding(input: {
  /** Minutes studied per day, Monday-first, 7 entries. */
  weekMinutes: number[]
  /** Mon-first index of today, 0–6. */
  todayIndex: number
  /** Mon-first indices this pace studies on. */
  nights: number[]
  minsPerNight: number
}): WeekStanding {
  const { weekMinutes, todayIndex, nights, minsPerNight } = input
  /* ⚠ STRICTLY BEFORE TODAY. Today's session is not a missed one — the evening
     has not happened yet — and counting it would report every learner behind
     from the moment they open the page on a study day, until they study. That
     is the nagging failure, and it is the same rule as "a Thursday that has not
     arrived is not a Thursday they missed", applied one day closer. Caught by
     reading the card: the persona named "on pace" was telling itself it was
     behind on a Thursday morning. */
  const elapsedNights = nights.filter((d) => d < todayIndex)
  const expected = elapsedNights.length * minsPerNight
  // Every day counts toward ACTUAL, including days the pace did not ask for:
  // studying on a rest day is still studying, and not crediting it would show a
  // shortfall to someone who did the work on a different evening.
  const actual = weekMinutes.slice(0, todayIndex + 1).reduce((a, b) => a + (b || 0), 0)
  // …but minutes done TODAY still count. Studying early on a day that was not
  // yet required is credit, not noise.
  const shortfall = Math.max(0, expected - actual)
  // Today counts as a night still to come, which is what makes the catch-up
  // spendable: it is the first evening they can act on.
  const nightsLeft = nights.filter((d) => d >= todayIndex).length
  const catchUpPerNight = nightsLeft > 0 ? minsPerNight + shortfall / nightsLeft : Infinity
  return {
    expected,
    actual,
    shortfall,
    nightsLeft,
    catchUpPerNight,
    recoverable: catchUpPerNight <= CEILING_MINS,
    // A tolerance, not a knife edge: finishing an evening a few minutes short is
    // not being behind, and a card that says so on a rounding error stops being
    // believed. One tenth of a session.
    behind: shortfall > minsPerNight * 0.1,
  }
}

/* ────────────────────────────────────────────────────────────────────────────
   THE SCHEDULE SIMULATOR — 2026-09-22.

   Ported from `adjust-your-pace-prototype.html`, whose whole argument is that a
   learner does not think in "nights a week". They think "I have Tuesday and
   Thursday evenings and most of Sunday", and the finish date is the ANSWER, not
   the question. Everything above this line derives a pace from a DATE; this
   derives a date from a WEEK.

   The two are not rivals and neither replaces the other. `studyPace` still
   prices the three presets the tile shows and still resolves which ceiling
   binds — this walks a schedule the learner built and reports where it lands.
   `resolveCeiling` is what joins them: the simulator measures its buffer
   against `hardEndIso`, so an exam date moves the verdict here exactly as it
   moves the presets, and the sheet cannot end up congratulating a plan that
   overruns the exam it is bound to.

   ⚠ ONE DEPARTURE FROM THE PROTOTYPE, and it is the reason the ported code is
   not a copy. The prototype measures its buffer against raw access expiry
   (`END = Jun 3`). This measures against `hardEndIso` — expiry MINUS ONE, or
   the exam minus its review buffer, whichever binds — because finishing on the
   day access dies is not finishing, and the rest of this module has said so
   since it was written. A simulator with its own idea of the deadline is the
   cross-surface disagreement this repo treats as a defect.
   ──────────────────────────────────────────────────────────────────────────── */

/** How far ahead the walk will look before calling a schedule hopeless. A year:
 *  long enough that any schedule a human would actually build resolves, short
 *  enough that a near-empty week terminates instead of spinning. */
const SIM_HORIZON_DAYS = 365

/** Below this, a day's entry is treated as "not a study day" rather than as a
 *  very short one — floating-point dust from the steppers, not intent. */
export const MIN_STUDY_HOURS = 0.01

export type ScheduleSim = {
  /** ISO yyyy-mm-dd the last hour of work lands on. */
  finishIso: string
  /** Day offsets from today (0 = today) the plan studies on, finish included. */
  studyDays: number[]
  /**
   * Whole days between the finish and the binding ceiling. Zero = it lands ON
   * the last usable day; NEGATIVE = it overruns, and by how much.
   */
  bufferDays: number
  /** Hours the week asks for, summed across the seven days. */
  hoursPerWeek: number
  /** The longest single day, in hours — what the "split it up" advice reads. */
  longestDayHours: number
  /** How many days of the week carry any hours at all. */
  daysPerWeek: number
}

/**
 * Walk the calendar day by day, spending the schedule's hours until the course
 * is done, and report where that lands.
 *
 * A WALK, NOT A DIVISION, and that is the point of it. `hoursRemaining / hoursPerWeek × 7`
 * gets the right answer only for an even week; the moment a learner says
 * "nothing Monday, six hours Saturday" the answer depends on WHICH DAY TODAY IS,
 * and a division cannot see that. Two learners with identical schedules finish
 * on different dates if one starts on a Friday — which is true, and is exactly
 * what a learner checking the calendar would notice first if it were wrong.
 *
 * Starts at TODAY inclusive: today's session has not necessarily happened, and
 * the alternative (start tomorrow) quietly loses a day off every plan built in
 * the morning.
 *
 * @param hoursByWeekday Seven entries, **Monday-first** — the same 0 = Mon … 6 = Sun
 *   order as {@link WEEKDAY_LABELS} and `plan.weekdays`. A `Date`'s own
 *   `getDay()` is Sunday-first and must be converted; see the shift below.
 * @returns `null` when the week is empty, or when the course cannot finish
 *   within {@link SIM_HORIZON_DAYS} — both mean "this is not a plan", and a
 *   caller that printed a date for either would be inventing one.
 */
export function simulateSchedule(input: {
  today: Date
  hoursRemaining: number
  hoursByWeekday: number[]
  hardEndIso: string
}): ScheduleSim | null {
  const week = Array.from({ length: 7 }, (_, i) =>
    Math.max(0, Number(input.hoursByWeekday[i]) || 0),
  )
  const hoursPerWeek = week.reduce((a, b) => a + b, 0)
  const daysPerWeek = week.filter((h) => h >= MIN_STUDY_HOURS).length
  const longestDayHours = week.reduce((a, b) => Math.max(a, b), 0)
  if (hoursPerWeek < MIN_STUDY_HOURS) return null
  if (input.hoursRemaining <= 0) return null

  /* MONDAY-FIRST INDEX of the day the walk is standing on. The `+ 6) % 7` shift
     is the one the week strip and `weekStanding` already use — written out
     rather than imported from them because getting it wrong is silent: the plan
     would simply study on the wrong days and still produce a plausible date. */
  let remaining = input.hoursRemaining
  const studyDays: number[] = []
  for (let offset = 0; offset < SIM_HORIZON_DAYS; offset++) {
    const weekday = (((input.today.getDay() + offset) % 7) + 6) % 7
    const hours = week[weekday]
    if (hours < MIN_STUDY_HOURS) continue
    studyDays.push(offset)
    remaining -= hours
    if (remaining <= MIN_STUDY_HOURS) {
      const finishIso = isoPlusDays(input.today, offset)
      return {
        finishIso,
        studyDays,
        bufferDays: daysBetweenIso(finishIso, input.hardEndIso),
        hoursPerWeek,
        longestDayHours,
        daysPerWeek,
      }
    }
  }
  return null
}

/** Whole days from `a` to `b`, both ISO. Positive when `b` is later. Built on
 *  the module's own ISO rules rather than `new Date(iso)`, per the file header. */
function daysBetweenIso(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / MS_PER_DAY)
}

export type ScheduleStanding = {
  /** `good` = room to spare, `warn` = it only just lands, `bad` = it overruns. */
  tone: 'good' | 'warn' | 'bad'
  /** One line, ready to render. States the consequence, never a bare number. */
  message: string
}

/** Days of buffer at or under which a plan is "only just" landing rather than
 *  comfortable. A weekend of illness is two days, which is the point. */
export const TIGHT_BUFFER_DAYS = 2

/**
 * What a simulated schedule's buffer MEANS, in the learner's terms.
 *
 * Reads `binding` so the sentence names the thing that actually stops them: a
 * plan bound by an exam that overruns has not "run past access", it has run
 * past the date they have to be ready by, and telling them the wrong one sends
 * them to the wrong fix (extend access vs. move the exam).
 */
export function scheduleStanding(
  sim: ScheduleSim | null,
  binding: Binding,
  emptyMessage = 'Pick at least one study day.',
): ScheduleStanding {
  if (!sim) return { tone: 'bad', message: emptyMessage }
  const ceiling = binding === 'exam' ? 'you need to be ready' : 'your access ends'
  const finish = formatPaceDate(sim.finishIso)
  if (sim.bufferDays < 0) {
    const over = -sim.bufferDays
    return {
      tone: 'bad',
      message: `Finishes ${finish} — ${over} ${over === 1 ? 'day' : 'days'} after ${ceiling}.`,
    }
  }
  if (sim.bufferDays === 0) {
    return { tone: 'warn', message: `Finishes ${finish}, your last usable day.` }
  }
  if (sim.bufferDays <= TIGHT_BUFFER_DAYS) {
    return {
      tone: 'warn',
      message: `Finishes ${finish} — only ${sim.bufferDays} ${sim.bufferDays === 1 ? 'day' : 'days'} to spare.`,
    }
  }
  return {
    tone: 'good',
    message: `Finishes ${finish} — ${sim.bufferDays} days to spare before ${ceiling}.`,
  }
}

/** A day longer than this is advised to be broken into sessions. */
export const LONG_DAY_HOURS = 4
/** A day longer than THIS is advised against entirely — see the note below. */
export const UNSUSTAINABLE_DAY_HOURS = 6

/**
 * The advice a schedule earns, or `null` when it earns none.
 *
 * DELIBERATELY NOT A BLOCKER. The learner may genuinely have a free Saturday,
 * and a product that refuses to let them spend it is wrong more often than the
 * warning is. It says what tends to happen and what the alternative is; the
 * plan saves either way.
 */
export function scheduleAdvice(sim: ScheduleSim | null): string | null {
  if (!sim) return null
  if (sim.longestDayHours > UNSUSTAINABLE_DAY_HOURS) {
    return `Your longest day is over ${UNSUSTAINABLE_DAY_HOURS} hours. That is hard to keep up — a later finish date, or one more study day, buys it back.`
  }
  if (sim.longestDayHours > LONG_DAY_HOURS) {
    return `We will split anything over ${LONG_DAY_HOURS} hours into sessions with a break between them.`
  }
  return null
}

/** Round UP to the next quarter hour. Rounding DOWN would quote a pace that
 *  finishes late, which is the one direction this figure must not be wrong in. */
export function ceilQuarterHour(hours: number): number {
  return Math.ceil(hours * 4 - 1e-9) / 4
}

/**
 * Spread `hoursRemaining` evenly across whichever of `weekdays` fall inside the
 * next `windowDays`, and return the per-day figure.
 *
 * The "finish fast" and "finish by this date" screens are the same question —
 * *given a deadline and some days, how long is a day?* — so they share this
 * rather than each dividing for themselves.
 *
 * @returns `0` when no chosen weekday falls inside the window, which is a real
 *   state (Sat-only, a 3-day window starting Monday) and not an error.
 */
export function hoursPerDayWithin(input: {
  today: Date
  hoursRemaining: number
  weekdays: number[]
  windowDays: number
}): number {
  let sessions = 0
  for (let offset = 0; offset < input.windowDays; offset++) {
    const weekday = (((input.today.getDay() + offset) % 7) + 6) % 7
    if (input.weekdays.includes(weekday)) sessions++
  }
  return sessions ? ceilQuarterHour(input.hoursRemaining / sessions) : 0
}

/** `[1.5, 0, 2, …]` from a day list and one figure — the shape
 *  {@link simulateSchedule} takes, built from the shape the toggles produce. */
export function evenWeek(weekdays: number[], hoursPerDay: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (weekdays.includes(i) ? hoursPerDay : 0))
}

/** `1½ hours` / `45 minutes` for an HOURS figure — {@link formatEvening} takes
 *  minutes, and every screen here works in hours. */
export function formatHours(hours: number): string {
  return formatEvening(Math.round(hours * 60))
}

/**
 * Mon-first indices of the days a week actually studies — the bridge between
 * the Adjust screens' HOURS shape and `plan.weekdays`, which every other
 * surface reads.
 *
 * HERE rather than in the sheet, where it was written: the tile needs it too
 * (to shade the strip for a week built without a calendar), and a `.tsx` that
 * exports components cannot share a function without costing Fast Refresh for
 * the whole file.
 */
export function activeDays(week: number[]): number[] {
  return week.map((h, i) => (h > 0 ? i : -1)).filter((i) => i >= 0)
}

/** What the learner is ACTUALLY doing — see {@link observedPace}. */
export type ObservedPace = {
  /** Study nights among the elapsed days of this week. */
  nights: number
  /** Mean minutes across those nights — the length of a typical evening. */
  minsPerNight: number
  /** Minutes studied so far this week. */
  total: number
  /** How many days of the week have happened, today included. */
  daysElapsed: number
}

/**
 * The pace the learner is keeping, as opposed to the one the plan asks for.
 *
 * 2026-09-23, the direct ask: the card should show "the Study Pace Goal
 * (2 hours/night, 6 days/week) and the Actual Users Average Pace".
 *
 * ⚠ IT AVERAGES OVER NIGHTS STUDIED, NOT OVER DAYS ELAPSED, and the difference
 * is the whole point of the number. Dividing by elapsed days answers "how much
 * do you do per day", which for anyone studying four nights a week is a figure
 * they will never recognise — it is their evening diluted by their rest days.
 * Dividing by the nights they actually sat down answers "how long is YOUR
 * evening", which is the quantity the goal's own "2 hours a night" states, so
 * the two are comparable side by side. The nights count carries the other axis.
 *
 * ⚠ ELAPSED DAYS ONLY, today included — the same rule as {@link weekStanding},
 * for the same reason turned around. That function refuses to count a Thursday
 * that has not arrived as a Thursday they MISSED; this one refuses to count it
 * as one they STUDIED. Fixture weeks are authored whole, so without the gate a
 * Monday would report minutes from a Friday that has not happened.
 *
 * ⚠ AT THE DEMO CLOCK THIS SEES ONE DAY. `FIXTURE_TODAY` is a Monday, so the
 * honest answer on a fresh load is an average over a single evening — which is
 * why `demoDay.ts` exists and what its own header is about. Advance the demo
 * day to see a week's worth; do not "fix" this by reading unelapsed days.
 *
 * Null when no elapsed day has any minutes on it: a learner who has not studied
 * this week has no average, and printing "0 hours a night" would be a
 * judgement rather than a reading.
 */
export function observedPace(input: {
  /** Minutes studied per day, Monday-first, 7 entries. */
  weekMinutes: number[]
  /** Mon-first index of today, 0–6. */
  todayIndex: number
  /**
   * EVERY DAY SINCE ENROLMENT, oldest first, ending today — and when it is
   * here it WINS, because it is a better answer to the same question.
   *
   * ⚠ IT FIXES A REAL INCOHERENCE — 2026-09-23. Averaged over the current week
   * alone, at the demo clock this reads one Monday: the card said "averaging
   * about 1¾ hours a night" directly above an activity chart whose typical bar
   * was two and a half. Two figures, one learner, both labelled "your pace".
   *
   * Every entry here is elapsed by construction — the array ends at today — so
   * there is no partial-week gate to apply, and the average is over their
   * whole run rather than over however much of one week has happened. That
   * also retires the Monday-clock caveat this function carried: with a history
   * it no longer matters which weekday the demo opens on.
   */
  dailyMinutes?: number[]
}): ObservedPace | null {
  const { weekMinutes, todayIndex, dailyMinutes } = input
  const elapsed = dailyMinutes ?? weekMinutes.slice(0, todayIndex + 1)
  const studied = elapsed.filter((m) => (m || 0) > 0)
  if (studied.length === 0) return null
  const total = studied.reduce((a, b) => a + b, 0)
  return {
    nights: studied.length,
    minsPerNight: Math.round(total / studied.length),
    total,
    daysElapsed: elapsed.length,
  }
}

/** How a streak of kept weeks stands — see {@link weeksOnPace}. */
export type WeeksOnPace = {
  /** Complete weeks kept, counting back from the last finished one. */
  streak: number
  /** The longest such run anywhere in the history given. */
  best: number
  /** Study nights done so far in the CURRENT, unfinished week. */
  thisWeekNights: number
  /** Nights the plan asks for in a week. */
  targetNights: number
  /** Minutes a week must reach to count as kept. */
  weeklyTarget: number
}

/**
 * The activity streak, counted in WEEKS KEPT rather than consecutive days.
 *
 * ⚠ NOTHING RENDERS THIS AS OF 2026-09-23. The card's streak headline became a
 * plain total ("In the last 13 days you've studied a total of 25¼ hours") after
 * "1 week on pace" was asked about directly, and the last consumer — a
 * "This week N of M nights" footer — was removed with it.
 *
 * KEPT RATHER THAN DELETED, and not out of sentiment: the argument below is
 * the answer to a question that will be asked again the moment anyone proposes
 * a streak, and it is the kind of reasoning that is expensive to rediscover and
 * cheap to keep. It is fully tested, so it is correct today rather than
 * correct-looking. To bring it back, read it in `ActivitySummary`.
 *
 * 2026-09-23. The design reference is a daily streak — "22 days", a personal
 * best, a bar per day — and a daily count is the one thing this product must
 * not reward.
 *
 * ⚠ BECAUSE A DAILY STREAK PUNISHES THE PLAN THE CARD JUST GAVE THEM. Every
 * pace on the picker states itself in nights a week: Steady & Relaxed is
 * seven, Recommended six, Focused & Quick four. A learner on Focused & Quick
 * who follows it exactly breaks a consecutive-days streak TWICE EVERY WEEK.
 * The product would be congratulating them on a plan and then penalising them
 * for keeping it.
 *
 * SO THE UNIT IS THE WEEK, which is the unit every plan is already spoken in.
 * Rest days cost nothing, and the streak breaks only when a learner misses
 * what they themselves signed up for.
 *
 * ⚠ THE CURRENT WEEK IS NOT IN THE STREAK. It has not finished, so it cannot
 * have been kept or missed — counting it would break every learner's streak
 * every Monday morning and mend it again by Sunday. It is reported separately
 * as progress (`thisWeekNights`), which is the encouraging half anyway.
 *
 * ⚠ KEPT IS MEASURED IN MINUTES, NOT NIGHTS, for the same reason
 * `weekStanding` credits a rest-day session: studying on a day the plan did not
 * ask for is still studying. A learner who does their six evenings across five
 * longer ones has kept the week. The 10% tolerance is `weekStanding`'s, so
 * finishing a few minutes short is not a broken streak — a metric that snaps on
 * a rounding error stops being believed.
 *
 * `dailyMinutes` runs OLDEST FIRST and ends TODAY. `todayIndex` is today's
 * Mon-first weekday, which is what locates the week boundaries in it.
 */
export function weeksOnPace(input: {
  /** Minutes per day, oldest first, last entry = today. */
  dailyMinutes: number[]
  /** Mon-first index of today, 0–6. */
  todayIndex: number
  /** Nights a week the plan asks for. */
  nights: number
  minsPerNight: number
}): WeeksOnPace {
  const { dailyMinutes, todayIndex, nights, minsPerNight } = input
  const weeklyTarget = nights * minsPerNight
  /* The current week occupies the last `todayIndex + 1` entries — Monday
     through today. Everything before it divides into whole Mon–Sun weeks. */
  const currentWeek = dailyMinutes.slice(dailyMinutes.length - (todayIndex + 1))
  const history = dailyMinutes.slice(0, dailyMinutes.length - (todayIndex + 1))

  const weeks: number[] = []
  // Walk backwards in sevens so the blocks align to the week boundary rather
  // than to the start of the array, whose length need not be a multiple of 7.
  for (let end = history.length; end - 7 >= 0; end -= 7) {
    weeks.unshift(history.slice(end - 7, end).reduce((a, b) => a + (b || 0), 0))
  }
  const kept = weeks.map((total) => total >= weeklyTarget * 0.9)

  let streak = 0
  for (let i = kept.length - 1; i >= 0 && kept[i]; i--) streak += 1
  let best = 0
  let run = 0
  for (const k of kept) {
    run = k ? run + 1 : 0
    if (run > best) best = run
  }

  return {
    streak,
    best,
    thisWeekNights: currentWeek.filter((m) => (m || 0) > 0).length,
    targetNights: nights,
    weeklyTarget,
  }
}
