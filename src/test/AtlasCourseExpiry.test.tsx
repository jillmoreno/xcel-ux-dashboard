import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { courseExpiryTier, usableDaysLeft } from '@/data/courseExpiry'
import { EXPIRY_PICKER, resolveExpiry } from '@/data/courseFixtures'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { isoPlusDays } from '@/lib/studyPace'

/**
 * THE COURSE CARD'S EXPIRATION WARNINGS — 2026-10-20, Jillienne, bringing to
 * the Atlas Home the treatment `hybrid-course-expiry` proved on Hybrid —
 * Pacing Exploration on 2026-10-07.
 *
 * ⚠ TWO SUBJECTS, AND THE FIRST IS THE ONE THAT BIT. The tiers are easy to
 * see; the OFF-BY-ONE underneath them was not. The header counted days until
 * the access date while `resolveCeiling` has always planned against the last
 * USABLE day (expiry minus one) — so "30 days to complete" sat directly above
 * a study plan built on 29, and "under seven days" would have warned a day
 * before the figure beside it justified. Both read `usableDaysLeft` now.
 */
afterEach(cleanup)

function renderHome(search: string) {
  /* ⚠ THE SEARCH HAS TO BE ON `window.location`, NOT ONLY ON THE ROUTER
     ENTRY. The demo controls read the real address, so a `replaceState` that
     drops the query renders the 30-day default and every pinned case quietly
     tests the same thing. */
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The whole meta row, whitespace-insensitive — it is built from six spans. */
/* ⚠ THE SPANS CARRY NO SPACES BETWEEN THEM — the row is a flex line and its
   `gap` does the spacing, so `textContent` reads "29 daysto complete". One
   space is inserted at every element boundary here rather than writing
   `\\s*` into each assertion, which is how a test comes to pass on
   "29 daysto" and nobody notices the line is unreadable. */
const metaRow = () => {
  const row = screen.getByText(/Course Access End/).closest('div')!
  return [...row.querySelectorAll('*')]
    .filter((el) => el.children.length === 0)
    .map((el) => el.textContent ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/ ,/g, ',')
    .trim()
}

describe('one definition of the last usable day', () => {
  it('is expiry minus one, and it is SIGNED', () => {
    /* ⚠ THE SIGN IS LOAD-BEARING, not an oversight. `resolveCeiling` feeds
       this straight into `daysToCeiling` and `hardEndIso`; clamping at zero
       would put an expired course's hard end at today and tell
       `noPaceMessage` the deadline is still ahead. Printing clamps; the
       model does not. */
    expect(usableDaysLeft(isoPlusDays(FIXTURE_TODAY, 30), FIXTURE_TODAY)).toBe(29)
    expect(usableDaysLeft(isoPlusDays(FIXTURE_TODAY, 1), FIXTURE_TODAY)).toBe(0)
    expect(usableDaysLeft(isoPlusDays(FIXTURE_TODAY, -3), FIXTURE_TODAY)).toBe(-4)
    expect(usableDaysLeft(undefined, FIXTURE_TODAY)).toBeNull()
  })

  it('is what the pace model already used, so the two cannot drift again', async () => {
    /* The point of moving it: `resolveCeiling` now reads the same function
       the header prints from. Asserted through the model's own output rather
       than by reading its source. */
    const { resolveCeiling } = await import('@/lib/studyPace')
    const { daysToCeiling } = resolveCeiling({
      today: FIXTURE_TODAY,
      hoursRemaining: 20,
      accessExpiresAt: isoPlusDays(FIXTURE_TODAY, 30),
    })
    expect(daysToCeiling).toBe(usableDaysLeft(isoPlusDays(FIXTURE_TODAY, 30), FIXTURE_TODAY))
  })
})

describe('the four tiers', () => {
  const at = (days: number) =>
    courseExpiryTier({ status: 'in-progress', expiresAt: isoPlusDays(FIXTURE_TODAY, days) }, FIXTURE_TODAY)

  it('counts in USABLE days, not days until the date', () => {
    /* 8 days until the date is 7 usable — inside the week, so it warns. 9 is
       8 usable and does not. Off by one here is the whole bug this carries
       the fix for. */
    expect(at(9)).toBe('normal')
    expect(at(8)).toBe('soon')
  })

  it('steps soon → urgent → expired at 7, 2 and 0', () => {
    expect(at(8)).toBe('soon')
    expect(at(4)).toBe('soon')
    expect(at(3)).toBe('urgent')
    expect(at(1)).toBe('urgent')
    // The date IS the day access dies, so reaching it is already expired.
    expect(at(0)).toBe('expired')
    expect(at(-3)).toBe('expired')
  })

  it('never warns a learner who has finished — ruling 5', () => {
    /* The same ruling `courseExpiryState` checks first, for the same reason:
       the deadline was met, so the date is irrelevant. */
    expect(
      courseExpiryTier({ status: 'completed', expiresAt: isoPlusDays(FIXTURE_TODAY, 1) }, FIXTURE_TODAY),
    ).toBe('normal')
  })

  it('says nothing when there is no date at all', () => {
    expect(courseExpiryTier({ status: 'in-progress' }, FIXTURE_TODAY)).toBe('normal')
  })
})

describe('what the Atlas Home course card prints', () => {
  it('counts the usable days, not the days until the date', () => {
    /* The visible half of the off-by-one: this row read "30 days to
       complete" against a 30-day window until 2026-10-20. */
    renderHome('?demo=1&ff=dashboard-course-expiry:30')
    expect(metaRow()).toMatch(/29 days to complete/)
    expect(metaRow()).not.toMatch(/30 days to complete/)
  })

  it('warns inside the week, and the icon comes with it', () => {
    renderHome('?demo=1&ff=dashboard-course-expiry:7')
    const row = screen.getByText(/Course Access End/).closest('div')!
    expect(metaRow()).toMatch(/6 days to complete/)
    /* ⚠ THE ICON IS PART OF THE STATE, not decoration — it is the cue that
       survives a greyscale screen, where the tone alone says nothing. */
    expect(row.querySelectorAll('svg').length).toBe(1)
  })

  it('does not say "0 days" on the last day', () => {
    /* A literal "0 days to complete" reads as a bug rather than as urgency,
       and the row has to carry the one state where the count runs out. */
    renderHome('?demo=1&ff=dashboard-course-expiry:1')
    expect(metaRow()).toMatch(/Today is the last day/)
    expect(metaRow()).not.toMatch(/0 days/)
  })

  it('leaves the 30-day default unwarned', () => {
    // The shipped default must not open on an amber card.
    renderHome('?demo=1')
    expect(screen.getByText(/Course Access End/).closest('div')!.querySelectorAll('svg').length).toBe(0)
  })
})

describe('Expired is a row on the Expires control', () => {
  it('is offered, as a NEGATIVE day count rather than a new concept', () => {
    /* A signed number flows through `chosenExpiryDays` and the access-date
       arithmetic untouched; a string sentinel would need a branch in every
       consumer. Three days past is the figure `hybrid-course-expiry` used. */
    const row = EXPIRY_PICKER.find((o) => o.label === 'Expired')
    expect(row, 'Expired should be on the picker').toBeTruthy()
    expect(row!.value).toBe(-3)
    expect(resolveExpiry('-3')).toBe(-3)
  })

  it('leads the list — the rows run most urgent to least', () => {
    expect(EXPIRY_PICKER[0].label).toBe('Expired')
    expect(EXPIRY_PICKER[1].label).toBe('1 day')
  })

  it('exists in the CATALOG too, not only in the dropdown', () => {
    /* ⚠ THE TRAP THIS SUITE EXISTS FOR, and it has bitten twice on this axis
       already: the row lives in `EXPIRY_PICKER` (what renders) AND in the
       flag's `variants` (the catalog's copy). In one and not the other, the
       control offers a value its own catalog does not know. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'dashboard-course-expiry')!
    const catalog = (flag.variants ?? []).map((v) => v.value)
    for (const row of EXPIRY_PICKER) {
      expect(catalog, `${row.label} should be in the catalog`).toContain(String(row.value))
    }
  })
})

describe('Purchase Extension', () => {
  const buttons = () =>
    [...document.querySelectorAll('button')]
      .map((b) => (b.textContent ?? '').trim())
      .filter((t) => /^(Purchase Extension|Course Overview|Begin Course|Resume Course)$/.test(t))

  it('is absent while there is no warning', () => {
    renderHome('?demo=1&ff=dashboard-course-expiry:30')
    expect(buttons()).not.toContain('Purchase Extension')
  })

  it('appears from a week out, to the LEFT of Course Overview', () => {
    /* ⚠ THE ORDER IS THE ASK ("a secondary button to the left of course
       overview"), and it is the reason this reads positions rather than mere
       presence — the action the warning argues for should be where the eye
       lands first. */
    renderHome('?demo=1&ff=dashboard-course-expiry:7')
    const order = buttons()
    expect(order.indexOf('Purchase Extension')).toBeGreaterThanOrEqual(0)
    expect(order.indexOf('Purchase Extension')).toBeLessThan(order.indexOf('Course Overview'))
  })

  it('wears the tier\u2019s own colour, not the brand\u2019s', () => {
    /* ⚠ `cre-compass-secondary` WOULD PAINT IT CRIMSON. That class carries
       XCEL's #9a1b1e with `!important` on the border, so an amber warning
       would get the brand outline and a red one something close enough to
       look like a rendering fault. The outline is built from the tier. */
    renderHome('?demo=1&ff=dashboard-course-expiry:7')
    const extend = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Purchase Extension')!
    expect(extend.className).not.toMatch(/cre-compass-secondary/)
    expect(extend.style.color).toContain('warning-700')
    expect(extend.style.borderColor).toContain('warning-700')
  })

  it('turns red with the urgent tier', () => {
    renderHome('?demo=1&ff=dashboard-course-expiry:1')
    const extend = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Purchase Extension')!
    expect(extend.style.color).toContain('error-600')
  })

  it('is the ONLY cta once access has ended, and it is the primary', () => {
    /* ⚠ THE TWO HALVES ARE ONE DECISION (2026-10-20, Jillienne: "when
       expired, keep it the primary color — because when expired, the other
       cta will not be visible on the card", then "course overview will also
       not be available bc they will not have access any longer"). Extend is
       primary BECAUSE nothing else is left: there is no course to begin and
       no overview to open. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const order = buttons()
    expect(order).toEqual(['Purchase Extension'])
    const extend = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Purchase Extension')!
    expect(extend.className).toMatch(/cre-compass-primary/)
    // …and it is NOT still wearing the charcoal of the expired meta line.
    expect(extend.style.color).toBe('')
  })

  it('drops the count entirely past the date', () => {
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(metaRow()).toMatch(/Course Access Ended:/)
    expect(metaRow()).not.toMatch(/to complete/)
  })
})

describe('Complete Coursework once access has ended', () => {
  const journeyList = () =>
    [...document.querySelectorAll('ol')].find((o) => /Pre-Licensing/.test(o.textContent ?? ''))!

  it('marks every stop with the calendar-exclamation, not a ring', () => {
    /* 2026-10-20, Jillienne: "the Complete coursework section will also need
       to be shown as Calendar-exclamation icon instead of the open circles
       that they could select." The rings are spans with no glyph, so an icon
       on every row is the assertion — one each, never two. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const rows = [...journeyList().children]
    expect(rows.length).toBeGreaterThan(3)
    for (const li of rows) {
      expect(li.querySelectorAll('svg').length, li.textContent ?? '').toBe(1)
    }
  })

  it('stops inviting a click on the live stop', () => {
    /* ⚠ THE HALF THAT WOULD HAVE LOOKED LIKE A BUG. The current row's title
       carries `cre-atlas-journey-link` — blue, underlined on hover — so an
       unavailable row would have been the one thing left asking to be
       clicked, right beside the icon saying it cannot be. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(journeyList().querySelectorAll('.cre-atlas-journey-link').length).toBe(0)
  })

  it('flattens the live stop to match the rows under it', () => {
    /* 2026-10-20, Jillienne: "make the title not bold so it matches all the
       things below". SemiBold and the primary ink are how that row says
       "you are here"; with the window closed nobody is anywhere, and one
       bold dark line over five grey ones reads as a live stop. Weight AND
       colour — either alone still stands out. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const titles = [...journeyList().children].map((li) => li.children[1] as HTMLElement)
    const weights = new Set(titles.map((t) => t.style.fontWeight))
    const colors = new Set(titles.map((t) => t.style.color))
    expect(weights, 'every row should carry one weight').toEqual(new Set(['400']))
    expect(colors.size, 'every row should carry one colour').toBe(1)
  })

  it('keeps the live stop emphasised while access remains', () => {
    // The guard on the guard: the flattening is expiry's, not everyone's.
    renderHome('?demo=1')
    const titles = [...journeyList().children].map((li) => li.children[1] as HTMLElement)
    expect(titles[0].style.fontWeight).toBe('600')
    expect(new Set(titles.slice(1).map((t) => t.style.fontWeight))).toEqual(new Set(['400']))
  })

  it('leaves the rings alone while access remains', () => {
    // The guard: this treatment must not leak into the ordinary card.
    renderHome('?demo=1')
    const rows = [...journeyList().children]
    for (const li of rows) {
      expect(li.querySelectorAll('svg').length, li.textContent ?? '').toBe(0)
    }
    expect(journeyList().querySelectorAll('.cre-atlas-journey-link').length).toBe(1)
  })
})

describe('the expired card loses the brand blue', () => {
  /* ⚠ FIND THE CARD, NOT "ANY DIV WITH THIS TOKEN". The first guard here did
     the latter and failed the moment the expired card adopted
     `--color-atlas-tan-100`: the LEFT COLUMN is drawn on that token in every
     state, so the search found the column and reported the ordinary card as
     grey. The course card is the panel the access line sits inside. */
  const courseCard = () => {
    let n: HTMLElement | null = screen.getByText(/Course Access End/) as HTMLElement
    while (n && !(n.style.borderRadius === '20px' && n.style.padding === '40px')) n = n.parentElement
    return n!
  }

  it('grounds the card in the Course Progress card’s own material', () => {
    /* 2026-10-20, Jillienne: "lets change the background color of that
       container when expired to be a lighter gray style", then "have it
       match the same background as the course progress". Primary 100 is the
       brand's "this is your live course" ground and a closed window should
       not wear it; Neutral 100 stood here for a few minutes and read as a
       different surface above the column rather than the same card in
       another state. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(courseCard().style.background).toContain('atlas-tan-100')
  })

  it('keeps the access line under the title, where it has always been', () => {
    /* ⚠ A GREY HEADER STRIP CARRIED THIS LINE FOR ABOUT TEN MINUTES on
       2026-10-20 and was reverted on sight ("i hate the header. revert that
       and move the expiration line back where it was"). What this pins is
       that the line sits inside the META ROW — the ruled line under the
       course title — and appears exactly once. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getAllByText(/Course Access End/).length).toBe(1)
    const row = screen.getByText(/Course Access Ended:/).closest('div')!
    expect(row.style.borderTop, 'the meta row keeps its rules').toContain('1px solid')
  })

  it('renames the eyebrow to Expired', () => {
    /* 2026-10-20, Jillienne, on "CURRENT COURSE": "lets make that change to
       Expired". It is the card's first line, and the last label still
       claiming the course is live. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getByText('Expired')).toBeTruthy()
    expect(screen.queryByText('Current course')).toBeNull()
  })

  it('keeps the section’s landmark name, which is a place and not a state', () => {
    /* ⚠ `aria-label` STAYS "Current course". Renaming a landmark by its
       contents' state makes the page's structure change shape under a
       screen-reader user mid-session. The visible eyebrow is the state. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getByLabelText('Current course')).toBeTruthy()
  })

  it('leaves the ordinary card blue', () => {
    renderHome('?demo=1')
    expect(courseCard().style.background).toContain('primary-100')
    expect(screen.getByText(/Course Access Ends:/).closest('div')!.textContent).toMatch(/29 days/)
    expect(screen.getByText('Current course')).toBeTruthy()
  })
})

describe('an expired course has been studied', () => {
  it('shows real progress rather than a learner who never began', () => {
    /* 2026-10-20, Jillienne: "when expired, lets show some sort of progress
       as most users would have at least started the course before
       expiration." */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getByLabelText(/Course progress \d+% complete/).getAttribute('aria-label')).not.toMatch(/ 0% /)
  })

  it('moves the RUNG, so the journey agrees with the dial', () => {
    /* ⚠ THE FAILURE THIS RULES OUT. Nudging the ring alone would print 36%
       over a lesson row still reading "0 of 36" and a journey with nothing
       ticked — three figures from one state, disagreeing. The substitution
       is at `progressPick`, so every reader of it moves together. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getByText(/Pre-Licensing Education \(\d+ of 36 completed\)/).textContent).not.toMatch(/\(0 of 36/)
  })

  it('leaves an unexpired course at whatever Progress says', () => {
    // The guard: expiry supplies a default, it does not overrule the axis.
    renderHome('?demo=1')
    expect(screen.getByLabelText('Course progress 0% complete')).toBeTruthy()
  })

  it('does not overrule an explicit Progress pick', () => {
    /* Only the DEFAULT rung is substituted. A reviewer who has chosen a
       state keeps it, expired or not. */
    /* ⚠ ONE `ff`, COMMA-SEPARATED — the parser reads `get('ff')` and splits
       on commas, so a second `ff=` in the query is silently dropped and the
       case would test the default rung instead of a picked one. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3,atlas-v3-progress:milestone')
    expect(screen.getByLabelText('Course progress 75% complete')).toBeTruthy()
  })
})

describe('the column stops at the dial once access has ended', () => {
  const sections = () =>
    [...document.querySelectorAll('section[aria-label]')].map((s) => s.getAttribute('aria-label'))

  it('drops the plan — pace, completion date, exam row, readiness', () => {
    /* 2026-10-20, Jillienne: "when expired, all of the other things below
       the Course progress will not show". Everything under the dial
       describes a PLAN, and there is none once the window has closed — the
       model already knew, and was printing three lines of "no pace fits"
       saying what the course card above now says in one. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3,atlas-readiness-section:on')
    expect(sections()).toContain('Course progress')
    expect(sections()).not.toContain('Study pace')
    expect(screen.queryByText('Estimated completion')).toBeNull()
    expect(screen.queryByText(/Not enough access left/)).toBeNull()
    expect(screen.queryByText(/Exam readiness/i)).toBeNull()
  })

  it('keeps the dial, which is the argument for the extension', () => {
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    expect(screen.getByLabelText(/Course progress 36% complete/)).toBeTruthy()
  })

  it('puts the message ABOVE the dial, with no hairline under it', () => {
    /* 2026-10-20, Jillienne: "when expired, move this above the graph and
       remove the divider line". Under the dial it was the last thing on a
       truncated card and read as a footnote; over it, the figure evidences
       the sentence. And with nothing below the section there is nothing
       for a rule to divide. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const section = document.querySelector('section[aria-label="Course progress"]')!
    const order = [...section.children].map((c) => (c.textContent ?? '').trim())
    expect(order[0]).toBe('Progress paused')
    expect(order[1]).toMatch(/^You completed/)
    expect(order[2]).toMatch(/36%/)
    // The panel's hairlines are bare spans; expired leaves none.
    expect([...section.parentElement!.children].filter((c) => c.tagName === 'SPAN')).toHaveLength(0)
  })

  it('renames the eyebrow to Progress paused, and greys the arc', () => {
    /* 2026-10-20, Jillienne: "change to 'Progress Paused', and change the
       progress color to a dark gray color instead of the blue". The blue is
       the brand's live-and-moving colour; the figure has stopped. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const section = document.querySelector('section[aria-label="Course progress"]')!
    expect(section.children[0].textContent).toBe('Progress paused')
    const arc = section.querySelectorAll('circle')[1] as SVGCircleElement
    expect(arc.style.stroke).toContain('neutral-800')
    /* ⚠ THE SECTION'S `aria-label` AND THE DIAL'S STAY "Course progress" —
       they name the region and the figure, not the state, and a landmark
       that renames itself mid-session moves the page under a screen-reader
       user. */
    expect(screen.getByLabelText('Course progress 36% complete')).toBeTruthy()
  })

  it('leaves the eyebrow and the brand arc alone while access remains', () => {
    renderHome('?demo=1')
    const section = document.querySelector('section[aria-label="Course progress"]')!
    expect(section.children[0].textContent).toBe('Course progress')
    const arc = section.querySelectorAll('circle')[1] as SVGCircleElement
    expect(arc.style.stroke).toContain('compass-page-button')
  })

  it('keeps the hairline under Course progress while access remains', () => {
    renderHome('?demo=1')
    const section = document.querySelector('section[aria-label="Course progress"]')!
    expect([...section.parentElement!.children].filter((c) => c.tagName === 'SPAN').length).toBeGreaterThan(0)
  })

  it('names the dial’s own figure in the message', () => {
    /* ⚠ READ FROM `percent`, NOT TYPED. The sentence and the ring are the
       same fact; a literal here is how they come to disagree the first time
       the rung moves. */
    renderHome('?demo=1&ff=dashboard-course-expiry:-3')
    const msg = screen.getByText(/of this course before your access ended/)
    expect(msg.textContent?.replace(/\s+/g, ' ')).toBe(
      'You completed 36% of this course before your access ended. Purchase an extension within the next 30 days to pick up where you left off.',
    )
  })

  it('leaves the whole plan standing while access remains', () => {
    renderHome('?demo=1&ff=atlas-readiness-section:on')
    expect(sections()).toContain('Study pace')
    expect(screen.getByText('Estimated completion')).toBeTruthy()
    expect(screen.queryByText(/before your access ended/)).toBeNull()
  })
})
