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
