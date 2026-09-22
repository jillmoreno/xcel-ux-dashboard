import { describe, it, expect } from 'vitest'
import {
  studyPace,
  resolveCeiling,
  priceFinish,
  suggestedNights,
  defaultPreset,
  formatEvening,
  formatEveningSpoken,
  formatPaceDate,
  presetLabel,
  isoPlusDays,
  dateFromIso,
  EXAM_BUFFER_DAYS,
  RECOMMENDED_BUFFER_DAYS,
  FOCUSED_DAYS,
  STRAIN_MINS,
  EASY_MINS,
  type PaceInput,
} from '@/lib/studyPace'

/**
 * These mirror `smoke/smoke-pace-presets.mjs`, which guards the prototype the
 * model came from. Both assert RELATIONSHIPS rather than strings, because every
 * number is derived: the failure mode is not a missing element, it is a figure
 * that stops agreeing with the constant it came from.
 */

const TODAY = new Date(2026, 8, 18) // Fri 18 Sep 2026, matching the prototype
const base: PaceInput = { today: TODAY, hoursRemaining: 24, accessExpiresAt: '2026-10-18' }

describe('resolveCeiling — two ceilings, and which one binds', () => {
  it('uses access alone when there is no exam date', () => {
    const c = resolveCeiling(base)
    expect(c.binding).toBe('access')
    // The last USABLE day is expiry minus one: finishing as access dies is not finishing.
    expect(c.hardEndIso).toBe('2026-10-17')
  })

  it('lets an exam inside the window take over, with its review buffer', () => {
    const c = resolveCeiling({ ...base, examDate: '2026-10-10' })
    expect(c.binding).toBe('exam')
    expect(c.hardEndIso).toBe(isoPlusDays(TODAY, 22 - EXAM_BUFFER_DAYS))
    expect(c.hardEndIso).toBe('2026-10-03')
  })

  it('leaves access binding when the exam sits past the window', () => {
    const c = resolveCeiling({ ...base, examDate: '2026-12-15' })
    expect(c.binding).toBe('access')
    expect(c.hardEndIso).toBe('2026-10-17')
  })

  it('reports both when the two ceilings land on the same day', () => {
    // access last-usable = Oct 17; an exam Oct 24 gives Oct 24 - 7 = Oct 17.
    const c = resolveCeiling({ ...base, examDate: '2026-10-24' })
    expect(c.binding).toBe('both')
  })

  it('falls back to the Focused horizon when there is no ceiling at all', () => {
    const c = resolveCeiling({ today: TODAY, hoursRemaining: 24 })
    expect(c.binding).toBe('none')
    expect(c.daysToCeiling).toBe(FOCUSED_DAYS)
  })
})

describe('studyPace — the three presets', () => {
  const model = studyPace(base)

  it('offers Relaxed, Recommended and Focused, ordered by date', () => {
    expect(model.presets.map((p) => p.id)).toEqual(['relaxed', 'recommended', 'focused'])
    const [relaxed, recommended, focused] = model.presets
    expect(focused.days).toBeLessThan(recommended.days)
    expect(recommended.days).toBeLessThan(relaxed.days)
  })

  it('puts Relaxed at the ceiling and Recommended a buffer before it', () => {
    const [relaxed, recommended] = model.presets
    expect(relaxed.days).toBe(model.daysToCeiling)
    expect(relaxed.days - recommended.days).toBe(RECOMMENDED_BUFFER_DAYS - 1)
  })

  it('aims Focused at the storefront’s two-week claim', () => {
    expect(model.presets.find((p) => p.id === 'focused')!.days).toBe(FOCUSED_DAYS)
  })

  it('shares ONE nights count across all three, so the evenings compare', () => {
    const nights = new Set(model.presets.map((p) => p.nights))
    expect(nights.size).toBe(1)
    expect([...nights][0]).toBe(suggestedNights(base))
  })

  it('costs more per evening the sooner the finish', () => {
    const [relaxed, recommended, focused] = model.presets
    expect(relaxed.minsPerNight).toBeLessThan(recommended.minsPerNight)
    expect(recommended.minsPerNight).toBeLessThan(focused.minsPerNight)
  })

  it('starts on Recommended', () => {
    expect(defaultPreset(model).id).toBe('recommended')
  })
})

describe('studyPace — dropping Focused', () => {
  it('drops it once it is no longer faster than Recommended', () => {
    // 16 days of access left: Recommended lands at day 11, Focused would be 14.
    const late = studyPace({ ...base, accessExpiresAt: isoPlusDays(TODAY, 16) })
    expect(late.presets.map((p) => p.id)).not.toContain('focused')
  })

  it('still offers it while it is genuinely faster', () => {
    expect(studyPace(base).presets.map((p) => p.id)).toContain('focused')
  })
})

describe('studyPace — nights', () => {
  it('suggests the fewest nights that keep an evening under the strain line', () => {
    const model = studyPace(base)
    const recommended = model.presets.find((p) => p.id === 'recommended')!
    expect(recommended.minsPerNight).toBeLessThanOrEqual(STRAIN_MINS)
    // One fewer night would breach it — that is what makes it the FEWEST.
    const tighter = priceFinish(base, recommended.days, recommended.nights - 1)
    expect(tighter.minsPerNight).toBeGreaterThan(STRAIN_MINS)
  })

  it('honours a learner’s own choice and marks it as theirs', () => {
    const chosen = studyPace({ ...base, nights: 6 })
    expect(chosen.nightsChosen).toBe(true)
    expect(chosen.presets.every((p) => p.nights === 6)).toBe(true)
  })

  it('makes each evening shorter as nights go up', () => {
    const four = studyPace({ ...base, nights: 4 }).presets[1].minsPerNight
    const six = studyPace({ ...base, nights: 6 }).presets[1].minsPerNight
    expect(six).toBeLessThan(four)
  })
})

describe('studyPace — study style', () => {
  it('makes Thorough cost more of a week than Quick', () => {
    const quick = studyPace({ ...base, style: 'quick', nights: 4 }).presets[1]
    const thorough = studyPace({ ...base, style: 'thorough', nights: 4 }).presets[1]
    expect(quick.minsPerWeek).toBeLessThan(thorough.minsPerWeek)
  })
})

describe('studyPace — course size decides whether "Relaxed" is relaxed', () => {
  /**
   * The prototype's §03 finding, as a test: the label is a property of the
   * COURSE, not of the preset. A short course earns the warm word; a long one
   * gets described as what it is.
   */
  const relaxedFor = (hours: number) =>
    studyPace({ ...base, hoursRemaining: hours }).presets.find((p) => p.id === 'relaxed')!

  it('gets cheaper per evening as the course gets shorter', () => {
    expect(relaxedFor(7).minsPerNight).toBeLessThan(relaxedFor(12).minsPerNight)
    expect(relaxedFor(12).minsPerNight).toBeLessThan(relaxedFor(24).minsPerNight)
  })

  it('keeps the word "Relaxed" only while the evening is genuinely light', () => {
    const short = relaxedFor(7)
    const long = relaxedFor(24)
    expect(short.minsPerNight).toBeLessThanOrEqual(EASY_MINS)
    expect(presetLabel(short)).toBe('Relaxed')
    expect(long.minsPerNight).toBeGreaterThan(EASY_MINS)
    expect(presetLabel(long)).toBe('Full window')
  })

  it('never renames Recommended or Focused', () => {
    const model = studyPace(base)
    expect(presetLabel(model.presets.find((p) => p.id === 'recommended')!)).toBe('Recommended')
    expect(presetLabel(model.presets.find((p) => p.id === 'focused')!)).toBe('Focused')
  })
})

describe('studyPace — when nothing fits', () => {
  it('refuses to quote a pace past the ceiling', () => {
    const impossible = studyPace({ ...base, hoursRemaining: 40, accessExpiresAt: isoPlusDays(TODAY, 3) })
    expect(impossible.presets.some((p) => p.state === 'no')).toBe(true)
  })

  it('treats a ceiling already in the past as unfittable rather than negative work', () => {
    const past = priceFinish(base, 0)
    expect(past.state).toBe('no')
    expect(past.minsPerNight).toBe(Infinity)
  })
})

describe('formatting', () => {
  it('keeps quarter-hour precision above an hour', () => {
    // The bug this replaced: 68 and 89 minutes both printing "about 1 hour".
    expect(formatEvening(68)).not.toBe(formatEvening(89))
    expect(formatEvening(45)).toBe('45 min')
    expect(formatEvening(60)).toBe('1 hour')
    expect(formatEvening(90)).toBe('1½ hours')
    expect(formatEvening(105)).toBe('1¾ hours')
    expect(formatEvening(Infinity)).toBe('—')
  })

  it('formats a pace date without the UTC off-by-one', () => {
    // `new Date('2026-10-13')` renders Oct 12 in a western timezone. This does not.
    expect(formatPaceDate('2026-10-13')).toBe('Oct 13')
    expect(dateFromIso('2026-10-13')!.getDate()).toBe(13)
  })

  it('returns an unparseable date unchanged rather than NaN', () => {
    expect(formatPaceDate('not-a-date')).toBe('not-a-date')
  })
})

describe('formatEveningSpoken', () => {
  /* The glyph is right to SHOW and wrong to HEAR. These pin the pairing rather
     than the strings on their own: the two functions must round through the
     SAME quarter-hour rule, or the sheet shows one answer and speaks another. */
  it('says minutes under the hour', () => {
    expect(formatEveningSpoken(45)).toBe('45 minutes')
    expect(formatEveningSpoken(1)).toBe('1 minute')
  })

  it('says whole hours without a minutes tail', () => {
    expect(formatEveningSpoken(60)).toBe('1 hour')
    expect(formatEveningSpoken(120)).toBe('2 hours')
  })

  it('speaks the quarters `formatEvening` draws', () => {
    expect(formatEvening(105)).toBe('1¾ hours')
    expect(formatEveningSpoken(105)).toBe('1 hour 45 minutes')
    expect(formatEveningSpoken(90)).toBe('1 hour 30 minutes')
  })

  it('ROUNDS THROUGH THE SAME RULE, not off the raw minutes', () => {
    /* The defect this guards, and it is invisible in isolation: reading
       `Math.round(mins)` directly would show 98 minutes as "1½ hours" and speak
       it as "1 hour 38 minutes" — two different answers to one question, which
       is worse than the fraction it set out to fix. */
    expect(formatEvening(98)).toBe('1¾ hours')
    // Raw rounding would speak "1 hour 38 minutes" here, against a figure the
    // sheet is drawing as 1¾ — the disagreement the shared rule prevents.
    expect(formatEveningSpoken(98)).toBe('1 hour 45 minutes')
  })

  it('degrades with the figure it mirrors', () => {
    // `formatEvening` returns an em dash for a pace that cannot fit; a reader
    // needs words rather than a punctuation mark read aloud as nothing.
    expect(formatEvening(Infinity)).toBe('—')
    expect(formatEveningSpoken(Infinity)).toBe('not available')
  })
})
