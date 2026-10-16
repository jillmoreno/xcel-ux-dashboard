import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
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

  it('is a design-bar control, which is what "in the dropdown" means', () => {
    expect(flag).toBeDefined()
    // `surface: 'design'` + `variants` is the sanctioned way onto that bar —
    // the bar itself is never edited to add a control.
    expect(flag?.surface).toBe('design')
    expect(flag?.variants?.length).toBe(2)
  })

  it('defaults to the ring, with the old card still reachable', () => {
    expect(flag?.defaultVariant).toBe('ring')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['ring', 'states'])
    // The old arm says what it is, so nobody has to remember which was first.
    expect(flag?.variants?.find((v) => v.value === 'states')?.label).toMatch(/as it was/i)
  })

  it('is scoped to the version whose bar should carry it', () => {
    expect(flag?.versions).toEqual(['eric-atlas-e2e'])
  })

  /* ⚠ THE TRADE-OFF, WRITTEN DOWN. A design control never reaches Prototypes
     — `promote-to-prototype` lists them separately for exactly that reason —
     so the ring SHIPS (it is the default and defaults render) but will not
     come up as a decision at merge the way the rest of today's work does.
     That is a consequence of asking for a dropdown, not an oversight; this
     case exists so the next person meets it deliberately. */
  it('…and therefore is not a promotion candidate — by construction', () => {
    expect(flag?.surface).toBe('design')
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

  /* With nothing below, the bottom rule goes — and its padding goes with it,
     or the card would end on a pad with no line to justify it. The panel's
     own bottom padding is what holds that edge instead. */
  it('drops the bottom rule AND its pad when readiness does not follow', () => {
    renderRing(false)
    const box = expectedBox()
    expect(box.style.borderBottomStyle).toBe('none')
    expect(box.style.paddingBottom).toBe('0px')
    expect(panelOf().style.paddingBottom).not.toBe('0px')
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
