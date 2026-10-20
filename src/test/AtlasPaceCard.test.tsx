import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { paceName } from '@/components/learning/compassStudyPlannerModel'
import { PLANNER_PLAN } from '@/data/compassStudyPlannerFixtures'

afterEach(cleanup)

/**
 * THE STUDY PACE CARD, TWO WAYS (2026-10-16, Jillienne: "lets add a component
 * variant for this section … keep the other one accessible from the
 * dropdown").
 *
 * ⚠ WHAT IS PINNED HERE IS THE CONTRACT, not the pixels: that it is a DESIGN
 * control (which is what puts it in the dropdown), that it has both arms, and
 * that the ring is the default. The cards themselves are exercised in the
 * browser — jsdom has no layout, and a dial is geometry.
 */
describe('the Study pace card variant', () => {
  const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-pace-card')

  /* ⚠ INVERTED 2026-10-20 — "ring has been decided. we can remove this from
     the demo controls." It WAS a design-bar control; `surface: 'design'` +
     `variants` is the sanctioned way onto that bar, and dropping both is the
     way off. The ARMS are untouched, which is what this case now pins. */
  it('is no longer a bar control, and still has both arms', () => {
    expect(flag).toBeDefined()
    expect(flag?.surface).toBeUndefined()
    expect(flag?.versions).toBeUndefined()
    expect(flag?.variants?.length).toBe(2)
  })

  it('defaults to the ring, with the old card still reachable', () => {
    expect(flag?.defaultVariant).toBe('ring')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['ring', 'states'])
    // The old arm says what it is, so nobody has to remember which was first.
    expect(flag?.variants?.find((v) => v.value === 'states')?.label).toMatch(/as it was/i)
  })

  /* ⚠ THE SCOPE WENT WITH THE SURFACE, and the pair is the point: `versions`
     only ever decided which bar CARRIED it, so a flag on no bar has nothing
     to scope. It read `['eric-atlas-e2e']` — which predates Jill/Atlas-Main,
     and `versionInScope` would have made the family answer for it. Both
     facts are in the Archive row, because restoring one without the other
     puts the control on a version nobody meant. */
  it('is reachable from the Feature Flag panel instead', () => {
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('atlas-pace-card')
  })

  /* ⚠ AND THE TRADE-OFF IT RECORDED HAS RESOLVED ITSELF. This case used to
     read "…and therefore is not a promotion candidate — by construction",
     noting that a design control never reaches Prototypes, so "the ring SHIPS
     (it is the default and defaults render) but will not come up as a
     decision at merge the way the rest of today's work does. That is a
     consequence of asking for a dropdown, not an oversight."

     The dropdown is gone, so the consequence is gone with it: the ring is a
     promotion candidate now, which is the honest place for a decided default.
     Asserted rather than described, because it is the kind of thing that
     silently reverts if `surface: 'design'` is ever put back. */
  it('…and IS a promotion candidate now the dropdown has gone', () => {
    expect(flag?.surface).toBeUndefined()
    expect(flag?.description).toMatch(/Ring \(default\)/)
  })
})

/**
 * ONE AIR AROUND EVERY RULE (2026-10-16, Jillienne: "spacing between the
 * components and the divider lines should be the same").
 *
 * The card draws three hairlines — under Course progress, and above/below
 * Estimated completion — and they came from three different places: the
 * panel's column gap, the section's gap, and the box's own padding. Same
 * line, three different amounts of air, so the card read tighter at the
 * bottom than in the middle.
 *
 * ⚠ WHAT IS PINNED IS THE EQUALITY, not the number. jsdom has no layout, so
 * this reads the inline styles the component sets rather than measuring
 * anything — which is enough, because the three values ARE the spacing here;
 * nothing between them collapses or overlaps. The browser is where the
 * result was checked.
 */
describe('the ring card spaces every rule alike', () => {
  const renderRing = (readinessBelow: boolean) =>
    render(
      <AtlasPaceRingCard
        percent={14}
        weeks={2}
        hoursPerWeek={7}
        expected={{ value: 'May 24' }}
        readinessBelow={readinessBelow}
      />,
    )

  const panelOf = () => screen.getByLabelText('Course progress', { selector: 'section' }).parentElement!
  const expectedBox = () => screen.getByText('Estimated completion').parentElement!

  it('gives the Course progress rule and the Estimated completion rules the same air', () => {
    renderRing(true)
    const panel = panelOf()
    const box = expectedBox()
    const section = box.parentElement!
    // Either side of the divider under Course progress: the panel's own gap.
    const columnGap = parseInt(panel.style.gap, 10)
    // Above the top rule: the section gap plus the box's own offset, which is
    // written as the subtraction of the two precisely so this holds.
    const aboveTopRule = parseInt(section.style.gap, 10) + parseInt(box.style.marginTop, 10)
    const insideTheRules = parseInt(box.style.paddingTop, 10)
    expect(aboveTopRule).toBe(columnGap)
    expect(insideTheRules).toBe(columnGap)
    expect(parseInt(box.style.paddingBottom, 10)).toBe(columnGap)
  })

  /* ⚠ THE RULE GOES, THE PADDING STAYS (2026-10-19, Jillienne: "there should
     be padding below the date to match the padding above the date"). It
     dropped BOTH for a few hours, on the reasoning that a pad with no line
     to justify it is dead space — but the box is a box either way, and 24
     over the eyebrow against 0 under the date reads as a mistake. The panel
     gives up its own bottom pad in exchange, so the air below the date is
     unchanged; it just sits inside the box now. */
  it('drops the bottom rule but keeps the box symmetric when readiness does not follow', () => {
    renderRing(false)
    const box = expectedBox()
    expect(box.style.borderBottomStyle).toBe('none')
    expect(box.style.paddingBottom).toBe(box.style.paddingTop)
    // …and the panel stands down, so the total air below the date is the same.
    expect(panelOf().style.paddingBottom).toBe('0px')
  })

  it('…and ends ON the rule when readiness does, so the air below is readiness’s own', () => {
    renderRing(true)
    expect(expectedBox().style.borderBottomStyle).not.toBe('none')
    expect(panelOf().style.paddingBottom).toBe('0px')
  })
})

/**
 * THE TAG OVER THE GOAL NAMES COMPASS'S PACE (2026-10-16, Jillienne: "change
 * to Average to match the header in compass side of things").
 *
 * ⚠ IT IS PINNED AS A DERIVATION, not as the word. The card used to say
 * "Recommended" — a status — while Compass's planner heads the same plan
 * "Your pace · Average", one of its three named paces. Asserting the literal
 * would let the two drift apart again the moment a pace is renamed there;
 * asserting that the card prints whatever `paceName` says about the plan
 * Compass opens on is what keeps them the same thing.
 */
describe('the pace tag speaks Compass\u2019s language', () => {
  it('prints the name Compass gives the plan it opens on', () => {
    render(<AtlasPaceRingCard percent={14} weeks={2} hoursPerWeek={7} />)
    expect(screen.getByText(paceName(PLANNER_PLAN.dayMins))).toBeTruthy()
  })

  it('and that name is Average today, which is what was asked for', () => {
    // The sanity half: if the fixture's default plan ever stops matching a
    // named pace, `paceName` returns "Custom" and the case above would still
    // pass while the card said something nobody chose.
    expect(paceName(PLANNER_PLAN.dayMins)).toBe('Average')
  })

  it('no longer calls it Recommended', () => {
    render(<AtlasPaceRingCard percent={14} weeks={2} hoursPerWeek={7} />)
    expect(screen.queryByText('Recommended')).toBeNull()
    // The SENTENCE below still says "recommended", and should — it is about
    // where the plan came from, not what the plan is called.
    expect(screen.getByText(/default recommended study pace/)).toBeTruthy()
  })
})

/**
 * WHEN NO PACE FITS (2026-10-19, Jillienne: "why on default did the pace
 * change to 3 weeks and estimated completion disappeared").
 *
 * ⚠ IT WAS NOT A REGRESSION — it was the Expires control on 1 day, the state
 * the flag catalog already describes as "no study pace fits". What the
 * question exposed is that the card handled it in two voices at once: the
 * hours line and the completion date correctly vanished, while the week
 * count fell back to a hardcoded 3 and printed the one figure on the card
 * that nothing had computed.
 *
 * ⚠ THE WORDING IS `AtlasCourseProgressStates`' OWN. The tan card this one
 * forked from already had this state; the fork dropped it. Two cards
 * answering the same question must not disagree about whether the question
 * is answerable, which is why it is copied rather than rewritten — and why
 * the last case below reads it back out of that file.
 */
describe('the ring card when no pace fits', () => {
  const renderNoPace = () => render(<AtlasPaceRingCard percent={0} />)

  it('says so, instead of inventing a week count', () => {
    renderNoPace()
    expect(screen.getByText('Not enough access left')).toBeTruthy()
    expect(screen.queryByText(/Week Goal/)).toBeNull()
    // The specific number that used to appear from nowhere.
    expect(screen.queryByText(/3 Week Goal/)).toBeNull()
  })

  it('names no pace either — "Average" would contradict the line above it', () => {
    renderNoPace()
    expect(screen.queryByText(paceName(PLANNER_PLAN.dayMins))).toBeNull()
  })

  it('points at access, not at the planner', () => {
    renderNoPace()
    expect(screen.getByText(/Extend your access to get a plan/)).toBeTruthy()
    // "Customize your pace here" aims at a planner with nothing to plan.
    expect(screen.queryByText(/further customize/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'here' })).toBeNull()
  })

  /* ── WHICH DEADLINE BOUND ─────────────────────────────────────────────
   * 2026-10-19, Jillienne: the card told her to extend access while her EXAM
   * was the binding ceiling — a month of access left, an exam three days
   * out, and the one instruction on screen would have changed nothing.
   * `resolveCeiling` has always recorded which ceiling won, for exactly this
   * reason; the cards ignored it. */
  it('names the EXAM when the exam is what bound, not access', () => {
    render(
      <AtlasPaceRingCard
        percent={0}
        noPace={{ binding: 'exam', days: -4, dateIso: '2026-05-07' }}
      />,
    )
    expect(screen.getByText('Not enough time before your exam')).toBeTruthy()
    expect(screen.queryByText('Not enough access left')).toBeNull()
  })

  it('offers no fix on the exam arm — a booked exam is not something to extend', () => {
    render(
      <AtlasPaceRingCard
        percent={0}
        noPace={{ binding: 'exam', days: -4, dateIso: '2026-05-07' }}
      />,
    )
    expect(screen.queryByText(/Extend your access/)).toBeNull()
  })

  /* ⚠ THE DATE IS THE COURSEWORK DEADLINE, NOT THE EXAM — `hardEndIso` is
     `EXAM_BUFFER_DAYS` earlier. The first draft printed it as the exam and
     told a learner sitting on May 14 that their exam was "today — May 7". */
  it('calls the date what it is — the coursework deadline, not the exam', () => {
    render(
      <AtlasPaceRingCard
        percent={0}
        noPace={{ binding: 'exam', days: -4, dateIso: '2026-05-07' }}
      />,
    )
    expect(screen.getByText(/coursework has to finish by May 7/)).toBeTruthy()
    expect(screen.queryByText(/exam is today/)).toBeNull()
  })

  /* Both ceilings landing together still buys nothing by extending access. */
  it('withholds the access fix when both ceilings bound', () => {
    render(
      <AtlasPaceRingCard percent={0} noPace={{ binding: 'both', days: 2, dateIso: '2026-05-13' }} />,
    )
    expect(screen.queryByText(/Extend your access/)).toBeNull()
  })

  it('still draws the ring — progress is a fact whether or not a plan fits', () => {
    renderNoPace()
    expect(screen.getByLabelText('Course progress 0% complete')).toBeTruthy()
  })

  it('leaves the normal arm alone', () => {
    render(
      <AtlasPaceRingCard percent={14} weeks={2} hoursPerWeek={7} expected={{ value: 'May 24' }} />,
    )
    expect(screen.getByText('2 Week Goal')).toBeTruthy()
    expect(screen.getByText('about 7 hours / week')).toBeTruthy()
    expect(screen.getByText('Estimated completion')).toBeTruthy()
    expect(screen.queryByText('Not enough access left')).toBeNull()
  })
})
