import { describe, it, expect } from 'vitest'
import {
  studyPace,
  resolveCeiling,
  priceFinish,
  suggestedNights,
  defaultPreset,
  formatEvening,
  formatEveningSpoken,
  observedPace,
  weekStanding,
  CEILING_MINS,
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
  simulateSchedule,
  scheduleStanding,
  scheduleAdvice,
  hoursPerDayWithin,
  evenWeek,
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

describe('weekStanding', () => {
  /* ⚠ WHAT IT COMPARES is the whole reason it is safe to have. Minutes done
     against what THIS WEEK's elapsed nights asked for — two numbers the product
     has. Not progress against the share of the access window that has elapsed,
     which invents a schedule the learner was never given and then reports them
     behind it. */
  const base = { nights: [0, 1, 2, 3], minsPerNight: 60 }

  it('counts only the study nights BEFORE today', () => {
    /* Wednesday is today. Mon and Tue were required; WEDNESDAY IS NOT YET a
       missed night — the evening has not happened. Counting it would report
       every learner behind from the moment they open the page on a study day,
       which is the nagging failure. Minutes done today still COUNT, though:
       studying early is credit. */
    const s = weekStanding({ ...base, weekMinutes: [60, 60, 60, 0, 0, 0, 0], todayIndex: 2 })
    expect(s.expected).toBe(120)
    expect(s.actual).toBe(180)
    expect(s.behind).toBe(false)
  })

  it('credits work done on a day the pace did not ask for', () => {
    /* Studying on a rest day is still studying. Counting only planned days
       would report a shortfall to someone who did the work on another evening —
       the card scolding a learner who is not behind. */
    const s = weekStanding({
      ...base,
      // Nothing on Mon/Tue/Wed, two hours on Sunday-of-last... here: index 4,
      // a day outside `nights`, still inside the elapsed window.
      weekMinutes: [0, 0, 0, 0, 180, 0, 0],
      todayIndex: 4,
    })
    expect(s.actual).toBe(180)
    // Mon–Thu were required (four nights before today, index 4) = 240.
    expect(s.shortfall).toBe(60)
  })

  it('spreads the gap over the nights STILL TO COME', () => {
    // Monday missed; today is Wednesday, so Wed and Thu are still to come.
    const s = weekStanding({ ...base, weekMinutes: [0, 60, 0, 0, 0, 0, 0], todayIndex: 2 })
    expect(s.shortfall).toBe(60)
    expect(s.nightsLeft).toBe(2)
    // Two nights left carry their own hour plus half the missed one each.
    expect(s.catchUpPerNight).toBe(90)
  })

  it('refuses to vouch for a catch-up nobody could do', () => {
    /* THE DEFECT THIS CAUGHT, and it was found by reading the rendered card
       rather than by a failing test — every assertion passed while the card
       said "7 hours a night for the rest of it catches you up".

       `CEILING_MINS` is the model's OWN "no number is honest there" threshold,
       already used to refuse a pace outright. Past it the arithmetic still
       produces a figure and `recoverable` says not to print it. */
    const s = weekStanding({
      ...base,
      weekMinutes: [0, 0, 0, 0, 0, 0, 0],
      todayIndex: 3, // Mon–Wed missed; only Thursday left to carry them
    })
    expect(s.behind).toBe(true)
    expect(s.nightsLeft).toBe(1)
    expect(s.catchUpPerNight).toBeGreaterThan(CEILING_MINS)
    expect(s.recoverable).toBe(false)
  })

  it('vouches for one that is merely hard', () => {
    const s = weekStanding({ ...base, weekMinutes: [0, 60, 0, 0, 0, 0, 0], todayIndex: 2 })
    expect(s.catchUpPerNight).toBe(90)
    expect(s.recoverable).toBe(true)
  })

  it('reports an unspendable gap rather than an infinite evening', () => {
    // Behind, with no study nights left in the week: the caller must say the
    // week is lost instead of quoting a number nobody can act on.
    const s = weekStanding({ ...base, weekMinutes: [0, 0, 0, 0, 0, 0, 0], todayIndex: 6 })
    expect(s.behind).toBe(true)
    expect(s.nightsLeft).toBe(0)
    expect(s.catchUpPerNight).toBe(Infinity)
    expect(s.recoverable).toBe(false)
  })

  it('does not call a rounding error being behind', () => {
    /* A tolerance, not a knife edge — a card that says "you are behind" because
       an evening ran four minutes short stops being believed. */
    // Tuesday: Monday was required and came up four minutes short.
    const s = weekStanding({ ...base, weekMinutes: [56, 0, 0, 0, 0, 0, 0], todayIndex: 1 })
    expect(s.expected).toBe(60)
    expect(s.shortfall).toBe(4)
    expect(s.behind).toBe(false)
  })
})

describe('simulateSchedule — a week, walked', () => {
  /* Thu 21 May 2026. A WEEKDAY THAT IS NOT MONDAY on purpose: the walk starts
     from today's own weekday, and every off-by-one in the Mon-first shift
     disappears if the fixture starts on a Monday. */
  const TODAY = new Date(2026, 4, 21)

  it('lands the finish on a day the schedule actually studies', () => {
    const sim = simulateSchedule({
      today: TODAY,
      hoursRemaining: 10,
      hoursByWeekday: evenWeek([0, 1, 2, 3, 4], 2), // Mon–Fri, 2h
      hardEndIso: '2026-06-03',
    })!
    expect(sim.hoursPerWeek).toBe(10)
    expect(sim.daysPerWeek).toBe(5)
    // Thu + Fri = 4h, then Mon/Tue/Wed next week spend the last 6.
    expect(sim.finishIso).toBe('2026-05-27')
    expect(sim.studyDays).toEqual([0, 1, 4, 5, 6])
  })

  it('answers differently for the same week on a different day', () => {
    /* THE WHOLE REASON IT IS A WALK. A division by 10 hours a week gives one
       answer; these two learners have identical schedules and finish two days
       apart because one starts on a Saturday with nothing scheduled. */
    const args = {
      hoursRemaining: 10,
      hoursByWeekday: evenWeek([0, 1, 2, 3, 4], 2),
      hardEndIso: '2026-06-03',
    }
    const thursday = simulateSchedule({ ...args, today: new Date(2026, 4, 21) })!
    const saturday = simulateSchedule({ ...args, today: new Date(2026, 4, 23) })!
    expect(thursday.finishIso).not.toBe(saturday.finishIso)
    expect(saturday.studyDays[0]).toBe(2) // nothing until Monday
  })

  it('measures its buffer against the CEILING, not raw expiry', () => {
    /* The one departure from the prototype. `hardEndIso` is expiry minus one
       (or the exam minus its review buffer); a simulator holding its own idea
       of the deadline is how the sheet comes to congratulate a plan the tile
       above it calls late. */
    const sim = simulateSchedule({
      today: TODAY,
      hoursRemaining: 4,
      hoursByWeekday: evenWeek([0, 1, 2, 3, 4, 5, 6], 2),
      hardEndIso: '2026-05-25',
    })!
    expect(sim.finishIso).toBe('2026-05-22')
    expect(sim.bufferDays).toBe(3)
  })

  it('refuses to invent a date for a week that is not a plan', () => {
    const empty = simulateSchedule({
      today: TODAY,
      hoursRemaining: 10,
      hoursByWeekday: evenWeek([], 2),
      hardEndIso: '2026-06-03',
    })
    expect(empty).toBeNull()
    // …and for one that cannot land inside the horizon at all.
    const hopeless = simulateSchedule({
      today: TODAY,
      hoursRemaining: 4000,
      hoursByWeekday: evenWeek([0], 1),
      hardEndIso: '2026-06-03',
    })
    expect(hopeless).toBeNull()
  })
})

describe('scheduleStanding — what the buffer means', () => {
  const TODAY = new Date(2026, 4, 21)
  const sim = (hoursRemaining: number, hardEndIso: string) =>
    simulateSchedule({
      today: TODAY,
      hoursRemaining,
      hoursByWeekday: evenWeek([0, 1, 2, 3, 4, 5, 6], 2),
      hardEndIso,
    })

  it('names the EXAM when the exam is what binds', () => {
    /* Telling a learner bound by an exam that they have "run past access"
       sends them to the wrong fix — extend the course, rather than move the
       exam. The sentence has to name the thing that actually stops them. */
    const late = scheduleStanding(sim(40, '2026-05-25'), 'exam')
    expect(late.tone).toBe('bad')
    expect(late.message).toContain('after you need to be ready')
    expect(scheduleStanding(sim(40, '2026-05-25'), 'access').message).toContain(
      'after your access ends',
    )
  })

  it('separates comfortable from only-just', () => {
    // Lands exactly on the last usable day.
    expect(scheduleStanding(sim(4, '2026-05-22'), 'access').tone).toBe('warn')
    // …one day of room is still "only just".
    expect(scheduleStanding(sim(4, '2026-05-23'), 'access').tone).toBe('warn')
    // …and past the tight threshold it is good.
    expect(scheduleStanding(sim(4, '2026-05-30'), 'access').tone).toBe('good')
  })

  it('says what to do when there is no plan yet, rather than printing a date', () => {
    const none = scheduleStanding(null, 'access')
    expect(none.tone).toBe('bad')
    expect(none.message).toBe('Pick at least one study day.')
  })
})

describe('scheduleAdvice / hoursPerDayWithin', () => {
  const TODAY = new Date(2026, 4, 21)

  it('advises on long days without blocking them', () => {
    const long = simulateSchedule({
      today: TODAY,
      hoursRemaining: 40,
      hoursByWeekday: evenWeek([5, 6], 5),
      hardEndIso: '2026-08-01',
    })
    expect(scheduleAdvice(long)).toContain('split')
    const brutal = simulateSchedule({
      today: TODAY,
      hoursRemaining: 40,
      hoursByWeekday: evenWeek([5, 6], 8),
      hardEndIso: '2026-08-01',
    })
    expect(scheduleAdvice(brutal)).toContain('hard to keep up')
    const fine = simulateSchedule({
      today: TODAY,
      hoursRemaining: 40,
      hoursByWeekday: evenWeek([0, 1, 2, 3, 4], 2),
      hardEndIso: '2026-08-01',
    })
    expect(scheduleAdvice(fine)).toBeNull()
  })

  it('counts the sessions inside the window, not the days', () => {
    /* A 7-day window from a Thursday contains ONE Saturday, so 6 hours of work
       on Saturdays only is a 6-hour day — not 6/7ths of one. */
    expect(
      hoursPerDayWithin({ today: TODAY, hoursRemaining: 6, weekdays: [5], windowDays: 7 }),
    ).toBe(6)
    // …and a window with no chosen day in it is 0, a real state rather than NaN.
    expect(
      hoursPerDayWithin({ today: TODAY, hoursRemaining: 6, weekdays: [0], windowDays: 3 }),
    ).toBe(0)
  })

  it('rounds the day UP to the quarter hour', () => {
    /* A fortnight from Thursday holds SIX Mon/Tue/Weds, so 10 hours is 1.67 a
       day → 1¾, never 1½: rounding down quotes a pace that finishes late. */
    expect(
      hoursPerDayWithin({ today: TODAY, hoursRemaining: 10, weekdays: [0, 1, 2], windowDays: 14 }),
    ).toBe(1.75)
  })
})

describe('observedPace', () => {
  /*
   * The pace the learner is KEEPING, which the card prints under the one it is
   * asking for — 2026-09-23, "the Study Pace Goal … and the Actual Users
   * Average Pace".
   */
  it('averages over nights studied, not over days elapsed', () => {
    /* THE DISTINCTION THE FUNCTION EXISTS FOR. Three evenings of 120, 60 and 90
       across a Friday's worth of week: divided by the nights actually sat down
       that is 90 minutes, and divided by the five elapsed days it would be 54 —
       a figure describing nobody's evening, and one that cannot be compared to
       the goal's own "2 hours a night". */
    const s = observedPace({ weekMinutes: [120, 60, 0, 90, 0, 0, 0], todayIndex: 4 })!
    expect(s.nights).toBe(3)
    expect(s.minsPerNight).toBe(90)
    expect(s.total).toBe(270)
  })

  it('will not count a day that has not happened', () => {
    /* `weekStanding`'s rule, turned around: that one refuses to call an unlived
       Friday a Friday they missed, this one refuses to call it one they
       studied. Fixture weeks are authored whole, so without the gate a Monday
       would report minutes from the end of the week. */
    const s = observedPace({ weekMinutes: [100, 999, 999, 999, 999, 999, 999], todayIndex: 0 })!
    expect(s.nights).toBe(1)
    expect(s.minsPerNight).toBe(100)
    expect(s.daysElapsed).toBe(1)
  })

  it('has no answer for a week with nothing in it', () => {
    /* Null rather than a zero. "0 hours a night" is a judgement; the absence of
       a reading is a reading. */
    expect(observedPace({ weekMinutes: [0, 0, 0, 0, 0, 0, 0], todayIndex: 6 })).toBeNull()
  })

  it('credits a night the pace never asked for', () => {
    /* Studying on a rest day is still studying — the same credit
       `weekStanding` gives, and for the same reason: the function reads
       minutes, not compliance with a calendar. */
    const s = observedPace({ weekMinutes: [0, 0, 0, 0, 0, 45, 0], todayIndex: 6 })!
    expect(s.nights).toBe(1)
    expect(s.minsPerNight).toBe(45)
  })
})
