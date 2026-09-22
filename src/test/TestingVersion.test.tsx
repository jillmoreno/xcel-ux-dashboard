import { readFileSync } from 'node:fs'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { jurisdictionName } from '@/data/nyProducerRequirements'
import { learningPathsFor } from '@/data/learningFixtures'
import { XCEL_NY_PRODUCER_PATH_ID } from '@/data/studyCalendarFixtures'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
  defaultDiscoverabilityVersionFor,
  isQualifyingEducationVersion,
} from '@/data/dashboardVersions'

/**
 * TESTING — the fourth Discoverability version (2026-09-21).
 *
 * It is QE Focused with ONE change, and that is the whole subject: the home
 * screen's second row drops the Readiness stub and gives the whole width to
 * Study Pace, whose treatment is then `dashboard-pacing-style`.
 *
 * What this file pins, in rough order of what would break first:
 *
 *   1. Adding a version did not move XCEL's DEFAULT. A fourth entry in the
 *      picker that quietly became what a stakeholder lands on would be the
 *      worst outcome of this change.
 *   2. The Readiness tile is absent HERE and present on QE FOCUSED — both
 *      directions, because an absence check passes just as happily when the
 *      whole tile row fails to render.
 *   3. Every pacing treatment states figures that AGREE with the rest of the
 *      page, and none of them invents a claim the fixtures cannot support.
 */

const TESTING_URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`
const QE_URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED.id}`

function seed(extra: Record<string, unknown> = {}) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.localStorage.setItem('cgp.featureFlags', JSON.stringify(extra))
}

function renderShell(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
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

/**
 * The Study Pace TILE — the eyebrow's parent, which is the tile element.
 *
 * MATCHED AS A REGEX, not the literal, because the `presets` treatment writes
 * its own eyebrow: "Recommended Study Pace", becoming "Your Study Pace" once
 * the learner adjusts anything (the 2026-09-21 Figma redesign moved the
 * provenance off a chip and into the eyebrow). The four other treatments keep
 * the bare "Study Pace".
 */
function paceTile(): HTMLElement {
  return screen.getByText(/^(?:Recommended |Your )?Study Pace$/).parentElement as HTMLElement
}

/**
 * ⚠ THE COURSE THIS TILE PACES IS THE JUMP BACK IN COURSE, NOT THE MY COURSES
 * RECORD. `LearnerFocusedBand` takes `course={activeCourse}` from
 * `MembershipOverview`, which resolves the QE profile's `jumpBackIn` fixture —
 * a 40-hour New York pre-licensing course carrying NO `expiresAt`. The
 * `myCoursesFor('xcel')` in-progress record is a different course (24 Florida
 * hours, a year of access) and is not on this screen. The two are easy to
 * mistake for each other, and a test built on the wrong one passes or fails for
 * reasons unconnected to the treatment.
 *
 * So the assertions below are about the card's INTERNAL CONSISTENCY and its
 * wiring. Agreement with `src/lib/studyPace.ts` is pinned in
 * `StudyPaceTile.test.tsx`, where the hours and the access date are props and a
 * ceiling can actually be given.
 */

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Testing version is registered without displacing anything', () => {
  it('is selectable in the Discoverability picker', () => {
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS).toContain(
      DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
    )
  })

  it('IS XCEL’s default, as of 2026-09-21', () => {
    /* INVERTED, and the inversion is the record worth keeping. This test read
       "does NOT become XCEL's default" from the day the version shipped, and
       its reasoning was: "a fourth picker entry that silently became the
       landing page would put an exploration in front of every stakeholder
       arriving on the public link."

       That is now the deliberate decision rather than the accident — the direct
       ask on 2026-09-21 — so the test asserts the new fact instead of being
       deleted, and the old claim stays readable above it.

       WHAT THE OLD TEST WAS PROTECTING became a decision rather than an
       accident, the same day: the landing page is a pacing exploration, so
       which of the five treatments a stakeholder sees could not be left to
       inheritance. `dashboard-pacing-style`'s `defaultVariant` moved to
       `presets`, pinned further down this file. */
    expect(defaultDiscoverabilityVersionFor('xcel')).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id,
    )
  })

  it('leaves QE Focused leading the picker', () => {
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS[0]).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
    )
  })
})

describe('the Readiness tile', () => {
  // BOTH DIRECTIONS. "Not designed yet" is the stub's own caption and is the
  // only string unique to that tile — the word "Readiness" alone also names a
  // rail item, which is still there on both versions and must stay.
  it('is dropped on Testing', () => {
    seed()
    renderShell(TESTING_URL)
    expect(screen.queryByText('Not designed yet')).toBeNull()
  })

  it('is still on QE Focused', () => {
    seed()
    renderShell(QE_URL)
    expect(screen.getByText('Not designed yet')).toBeTruthy()
  })

  it('leaves the Readiness SECTION alone — the placeholder was the tile', () => {
    /*
     * REWRITTEN 2026-09-21, not deleted, when a later ask trimmed the Readiness
     * ROW off the Testing rail as well. Its subject is unchanged: dropping the
     * TILE must not read as dropping the feature.
     *
     * It used to prove that by finding the rail row on Testing, which is no
     * longer the right proof there — so it asserts it on QE FOCUSED, whose rail
     * this change did not touch and where the tile removal is the only variable.
     * That the feature survives on TESTING is proved instead by the section
     * still resolving from `?section=readiness`; see the rail-trim tests below.
     */
    seed()
    renderShell(QE_URL)
    expect(screen.getByRole('button', { name: /Readiness/ })).toBeTruthy()
  })
})

describe('the Study Pace tile takes the row', () => {
  it('drops its 1:1 aspect ratio on Testing', () => {
    // Square is a property of the PAIR. Alone in a ~506px column a 1:1 tile is
    // a 506px box holding two lines, which is why removing Readiness and
    // reshaping this one are one decision (`paceOnly`) rather than two props.
    seed()
    renderShell(TESTING_URL)
    expect(paceTile().style.aspectRatio).toBe('')
  })

  it('keeps it on QE Focused', () => {
    seed()
    renderShell(QE_URL)
    expect(paceTile().style.aspectRatio).toBe('1 / 1')
  })
})

describe('the pacing treatments', () => {
  /** The four that render a BODY inside the shared tile. */
  const VARIANTS = ['lo-fi', 'rate', 'runway', 'balance'] as const
  /** …and `presets`, which renders the whole tile. Sweeps that are about the
   *  treatment's CLAIMS rather than its chrome run over all five. */
  const ALL_VARIANTS = [...VARIANTS, 'presets'] as const

  it.each(VARIANTS)('%s keeps the status pill and its message', (variant) => {
    // The status half is what was carrying the meaning all along, and it is the
    // same element in all four (`pacingStatus`). If a treatment could drop it,
    // the comparison would be about whether the state is shown rather than
    // about the pacing figure — and one of the four would win for the wrong
    // reason.
    //
    // `presets` IS DELIBERATELY NOT IN THIS LIST, and the exemption is narrow
    // enough to be worth stating rather than widening the sweep: that treatment
    // states the conclusion the pill labels ("finishes by <date>, <n> days
    // before access ends on <date>") as a derived SENTENCE, and carries its own
    // pill on the pace axis. Two pills in two vocabularies, stacked, is the
    // confusion the pace chip exists to avoid — see the `presets` arm of
    // `pacingBody`. The guarantee is not dropped, it moves: the block below
    // pins the sentence the way this pins the pill.
    seed({ 'dashboard-pacing-style': { enabled: true, variant } })
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(within(tile).getByText('On Track')).toBeTruthy()
    expect(tile.textContent).toMatch(/on pace to finish/i)
  })

  it('presets states the compliance conclusion instead of the pill', () => {
    // The other half of the exemption above: it may drop the pill only because
    // it answers the same question in words. A `presets` card carrying neither
    // would be the treatment that quietly says less than the four beside it.
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'presets' } })
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(within(tile).queryByText('On Track')).toBeNull()
    // The conclusion in words: the window the learner has, and the date the
    // derived pace lands on. Both are body lines of the 2026-09-21 Figma
    // redesign, which replaced the pill and the timeline with this sentence.
    expect(tile.textContent).toMatch(/You have \d+ days left to finish/)
    expect(tile.textContent).toMatch(/you will finish around [A-Z][a-z]{2} \d+/)
  })

  it.each(ALL_VARIANTS)('%s invents no projection the fixtures cannot support', (variant) => {
    // Nothing here knows an OBSERVED rate, a schedule to be ahead of, or a
    // projected finish date. The reference mock for this block carried "You are
    // currently pacing 4 days ahead of schedule"; authoring it is the move this
    // version has refused throughout.
    seed({ 'dashboard-pacing-style': { enabled: true, variant } })
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    expect(text).not.toMatch(/ahead of schedule|behind schedule|projected|on track to finish on/i)
  })

  it('rate states the derived hrs/day, not a literal', () => {
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'rate' } })
    renderShell(TESTING_URL)
    // The same derivation `kpiSubLabels` feeds the `stat-card` variant with —
    // the resume course's real credit hours over the days left.
    expect(paceTile().textContent).toMatch(/~\d+(\.\d)? hrs\/day/)
  })

  it('runway’s work-left AGREES with the completed figure on the page', () => {
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'runway' } })
    renderShell(TESTING_URL)
    const left = Number(/(\d+) lessons left/.exec(paceTile().textContent ?? '')?.[1])
    // "26 of 42 lessons complete" — the block's own line, from the same totals.
    const done = /(\d+) of (\d+) lessons/.exec(document.body.textContent ?? '')
    expect(done).toBeTruthy()
    const [, completed, total] = done as RegExpExecArray
    // The relationship, not today's numbers: a tile claiming a different amount
    // of work left from the line three inches above it is the cross-surface
    // disagreement `ProgressAgreement.test.tsx` exists to catch.
    expect(left).toBe(Number(total) - Number(completed))
  })

  it('runway draws one strip segment per remaining week, the last part-filled', () => {
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'runway' } })
    renderShell(TESTING_URL)
    const tile = paceTile()
    const fills = [...tile.querySelectorAll('span > span')].filter((s) =>
      (s as HTMLElement).style.width.endsWith('%'),
    ) as HTMLElement[]
    const days = Number(/(\d+) days to go/.exec(tile.textContent ?? '')?.[1])
    expect(fills.length).toBe(Math.max(1, Math.ceil(days / 7)))
    // Every whole week is full; the days that do not make one are the remainder.
    const remainder = days % 7
    expect(fills.at(-1)?.style.width).toBe(
      remainder === 0 ? '100%' : `${(remainder / 7) * 100}%`,
    )
  })

  it('balance states the two figures and derives no rate', () => {
    // Its whole position is that it prescribes nothing — if it grew a rate it
    // would be `runway` with a rule down the middle, and the exploration would
    // be comparing three versions of one idea.
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'balance' } })
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    expect(text).toMatch(/lessons left/)
    expect(text).toMatch(/days left/)
    expect(text).not.toMatch(/a week|hrs\/day/)
  })

  it.each(ALL_VARIANTS)('%s states no percentage', (variant) => {
    /* A `%` on this tile is a PROGRESS claim, and the block directly above it
       already states progress — twice on some treatments. The rule lives here
       rather than on the Get Licensed cards, where "70% to pass" is the state's
       published pass mark and a sourced fact about the exam. */
    seed({ 'dashboard-pacing-style': { enabled: true, variant } })
    renderShell(TESTING_URL)
    expect(paceTile().textContent).not.toMatch(/%/)
  })

  it('leaves the tile lo-fi on every OTHER version, whatever the flag says', () => {
    // The flag is inert off Testing: elsewhere Study Pace is still half of the
    // square pair and the stub is what ships. A treatment leaking onto QE
    // Focused would change what XCEL's DEFAULT shows.
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'runway' } })
    renderShell(QE_URL)
    expect(paceTile().textContent).not.toMatch(/a week/)
  })

  it('keeps presets off QE Focused too', () => {
    // The same rule for the one treatment that renders a whole tile rather than
    // a body — it reaches the render site by a different branch, so "the flag is
    // inert elsewhere" has to be proved again rather than inherited.
    seed({ 'dashboard-pacing-style': { enabled: true, variant: 'presets' } })
    renderShell(QE_URL)
    const tile = paceTile()
    expect(tile.style.aspectRatio).toBe('1 / 1')
    expect(within(tile).queryByRole('button', { name: 'Start studying' })).toBeNull()
  })
})

/**
 * PRESETS — the fifth treatment (2026-09-21).
 *
 * Every assertion here is a RELATIONSHIP against `src/lib/studyPace.ts`, never
 * a literal. The card's figures are all derived from the resume course's
 * published hours and its own access expiry, so a test pinning today's "Apr 29"
 * or today's "5 days" would break on the next fixture edit and tell nobody
 * anything about the treatment.
 */
describe('the presets pacing card', () => {
  const seedPresets = () => seed({ 'dashboard-pacing-style': { enabled: true, variant: 'presets' } })

  it('states an evening, a week and the date it lands on', () => {
    seedPresets()
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    // The redesign's headline: a nightly figure and a weekly one, both out of
    // the same formatter. It said "N nights a week" before — the WEEK STRIP
    // now carries how many nights, and in which days.
    expect(text).toMatch(/About .+ a night, .+ a week/)
    expect(text).toMatch(/you will finish around [A-Z][a-z]{2} \d+/)
  })

  it('draws the week strip', () => {
    // The redesign's biggest addition: the old card said "5 nights a week" and
    // left the learner to picture it. Which DAYS is not invented here — the
    // shared `defaultWeekdays` helper is what the sheet proposes too.
    seedPresets()
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      expect(text).toContain(day)
    }
  })

  it('the room it claims agrees with the access date it names', () => {
    /* THE TWO HALVES OF ONE SENTENCE, checked against each other: the days of
       slack, the date they are slack before, and the finish they are measured
       from. A card reading "5 days before access ends on Jun 3" while the
       finish it just printed is six days earlier is the kind of disagreement
       that looks perfectly plausible on screen.

       Parsed rather than compared to literals — the course's hours, progress
       and access window all move, and a test carrying today's answer would
       fail on the next fixture edit. Agreement with `studyPace` itself is
       pinned in `StudyPaceTile.test.tsx`, where those are props. */
    seedPresets()
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    const claim = /You have (\d+) days left to finish the course material\. \(Access ends on ([A-Z][a-z]{2} \d+)\.\)/.exec(text)
    expect(claim).toBeTruthy()
    const [, days, ends] = claim as RegExpExecArray
    const finishMatch = /you will finish around ([A-Z][a-z]{2} \d+)/.exec(text)
    expect(finishMatch).toBeTruthy()
    const day = (s: string) => new Date(`${s}, 2026`).getTime() / 86_400_000
    /* THE FINISH LANDS INSIDE THE WINDOW the line above it claims. That is the
       relationship the whole card exists to state, and the one that reads as
       perfectly plausible when it is wrong. */
    expect(day(finishMatch![1])).toBeLessThanOrEqual(day(ends))
    expect(Number(days)).toBeGreaterThan(0)
  })

  it('names the ceiling it used, never a window length', () => {
    /* THE TRAP THIS TREATMENT WAS BUILT OVER. The prototype's card said "set
       from your 30-day access" — true of the window it assumed, and false the
       moment a course's window differs. The card names the CEILING instead:
       the fact the model actually used, already on screen two clauses up, and
       still true when an exam date takes over as the thing doing the work.

       The window is now genuinely 30 days (see `dashboardProgressFixtures`),
       which is exactly why this assertion has to stay — the prototype's
       sentence would pass a reader's eye today and be wrong again on the next
       course that reaches this card. */
    seedPresets()
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    expect(text).not.toMatch(/\d+-day access/)
    // The DATE access ends, which is the fact the model used — not a window
    // length, which is the prototype's sentence and is wrong the moment a
    // course's window differs.
    expect(text).toMatch(/Access ends on [A-Z][a-z]{2} \d+/)
  })

  it('keeps the expiry badge OFF the default version’s Jump Back In card', () => {
    /* THE BLAST RADIUS of giving that course an access window, pinned rather
       than trusted. `expiresAt` on a card record is what turns the expiry badge
       on, and this course's window (30 days) is shorter than the default 60-day
       countdown — so without `enrolledAt`, `warnWindowFor` has no window to
       halve, the 60 stands, and QE Focused (XCEL's DEFAULT, the thing a
       stakeholder lands on) grows an "expiring soon" badge it never had.

       The clamp is what prevents that, and it is invisible at the call site —
       a later edit dropping `enrolledAt` as redundant would look harmless and
       change the default version. */
    seed()
    renderShell(QE_URL)
    expect(document.body.textContent).not.toMatch(/Expires|Expiring|Expired/i)
  })

  it('stops calling the number a recommendation once it is the learner’s', async () => {
    /* The prototype's §02 finding, and the one thing on the card that changes
       when the learner touches it: the product should not go on calling a
       figure the learner picked a recommendation. Driven through the REAL
       sheet, because that is the only way `adjusted` can become true — which
       also proves the card and Testing 2's square share one `choices` state.
       (The provenance CLAUSE follows the same boolean and is pinned in
       `StudyPaceTile.test.tsx`, where a course with a ceiling prints one.) */
    const user = userEvent.setup()
    seedPresets()
    renderShell(TESTING_URL)
    expect(paceTile().textContent).toMatch(/^Recommended Study Pace/)

    await user.click(within(paceTile()).getByRole('button', { name: 'Customize Study Plan' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: /Full window|Relaxed/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))

    expect(paceTile().textContent).toMatch(/^Your Study Pace/)
  })

  it('operates exactly one thing, and no more', () => {
    /* The card operates Customize Study Plan and nothing else — the same claim
       `StudyPaceTile.test.tsx` counts on the square, and what keeps this a
       statement rather than a control panel. The 2026-09-21 redesign took the
       count from two (Start studying + Adjust) to one. No `Details →` link
       either: the control IS this card's floor. */
    seedPresets()
    renderShell(TESTING_URL)
    const tile = paceTile()
    const names = within(tile)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
    expect(names).toEqual(['Customize Study Plan'])
    expect(within(tile).queryByRole('link', { name: /Details/ })).toBeNull()
    expect(within(tile).queryByRole('radio')).toBeNull()
    /* ⚠ THE CARD NO LONGER NAMES THE COURSE, and that is the redesign's call
       rather than a regression. It used to open "Finishes <course> by <date>";
       the Figma copy says "the course material", generic — because the course
       is named twice already in the header band directly above it, and this
       card is about the pace rather than about which course it is. Asserted as
       the absence so a later edit putting the title back has to be deliberate. */
    expect(tile.textContent).toMatch(/left to finish the course material/)
  })

  it('Customize Study Plan opens the SHARED sheet, not a second one', () => {
    /* The reuse this whole variant rests on. A `presets` card that grew its own
       sheet would be a second copy of the four groups — and of the exam date and
       the study-plan calendar, both of which write. */
    seedPresets()
    renderShell(TESTING_URL)
    expect(
      within(paceTile())
        .getByRole('button', { name: 'Customize Study Plan' })
        .getAttribute('aria-haspopup'),
    ).toBe('dialog')
  })

  it('loses the square, like every other treatment on this version', () => {
    seedPresets()
    renderShell(TESTING_URL)
    expect(paceTile().style.aspectRatio).toBe('')
  })
})

describe('Testing inherits QE Focused rather than re-listing it', () => {
  it('drops the Recommended band even with the flag ON', () => {
    // The layout rule, not the flag — the same assertion QE Focused carries.
    seed({ 'dashboard-recommended': { enabled: true } })
    renderShell(TESTING_URL)
    expect(screen.queryByText(/Recommended for [Yy]ou/)).toBeNull()
  })

  it('renders the Study Journey', () => {
    seed()
    renderShell(TESTING_URL)
    expect(screen.getByText(/Study Journey/i)).toBeTruthy()
  })

  it('counts as a qualifying-education version, so the demo bar agrees', () => {
    // ONE owner for a rule TWO files act on. It was a hardcoded id comparison
    // in each, and this version silently fell out of the bar's copy: the page
    // resolved a pre-licensing path while the Education dropdown above it still
    // offered — and displayed — "Continuing Ed".
    expect(isQualifyingEducationVersion(DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id)).toBe(true)
    expect(isQualifyingEducationVersion(DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED.id)).toBe(true)
    expect(isQualifyingEducationVersion('discoverability-learner-focused')).toBe(false)
  })
})

describe('the Testing rail is trimmed', () => {
  /** Row labels inside one nav group's `<ul>`, which is `aria-labelledby` its
   *  caption. Group-aware on purpose: `NavSectionFlags.test.tsx` records that a
   *  FLAT in-order check is blind to which list a row belongs to, so a move
   *  between groups passes it unnoticed. */
  const groupRows = (caption: string) =>
    within(screen.getByRole('list', { name: caption }))
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())

  it('leaves Home · My Courses · Certificates under My Learning', () => {
    // The WHOLE group, in order, in both directions — not "Study Plan is
    // absent", which would pass just as happily if the rail failed to render.
    seed()
    renderShell(TESTING_URL)
    expect(groupRows('My Learning')).toEqual(['Home', 'My Courses', 'Certificates'])
  })

  it('keeps Support intact', () => {
    // Guards the trim from over-reaching: the four rows named in the ask all
    // sit in My Learning, so Support must be untouched.
    seed()
    renderShell(TESTING_URL)
    expect(groupRows('Support')).toEqual(['Get Help'])
  })

  it('leaves the QE Focused rail exactly as it was', () => {
    // The other direction, and the one that matters most: these four rows are
    // in the committed DEMO BASELINE, which is what XCEL's default version
    // shows. Trimming them via `NAV_SECTION_FLAGS` would have moved that
    // baseline, which is why the trim is a property of the layout instead.
    seed()
    renderShell(QE_URL)
    expect(groupRows('My Learning')).toEqual([
      'Home',
      'Study Plan',
      'Readiness',
      'My Courses',
      'Certificates',
      'Resources',
      'Rubi Insights',
    ])
  })

  it('hides the ROWS only — every section still resolves', () => {
    // The rule `NAV_SECTION_FLAGS` states and what makes a trimmed rail an
    // editorial act rather than a feature cut: a row can be off the rail and
    // still be reachable, which is what lets a hidden section be demoed on
    // request.
    seed()
    renderShell(`${TESTING_URL}&section=readiness`)
    expect(screen.getByRole('heading', { level: 1, name: 'Readiness' })).toBeTruthy()
  })
})

describe('the course header sits in the band’s left column', () => {
  /*
   * Both halves of one ask (2026-09-21): the Study Journey moves up to sit
   * directly under the page header, and the Course Progress narrows to align
   * with what is below it.
   *
   * They are the SAME change. The header was a full-width block ABOVE the grid,
   * so it pushed the whole grid — journey included — down past it. Moving it
   * into the left column narrows it to that column AND frees the right column
   * to start at the top. A `max-width` on the header would have done the first
   * half and left the journey exactly where it was.
   *
   * jsdom has no layout, so none of this can be asserted in pixels. It is
   * asserted STRUCTURALLY instead — which is the thing that actually determines
   * the geometry, and is what the `align-items: start` guard on this same grid
   * already does for the same reason.
   */
  const band = () => document.querySelector('.cre-learner-focused-band') as HTMLElement

  it('renders the header INSIDE the left column, not above the grid', () => {
    seed()
    renderShell(TESTING_URL)
    const left = band().children[0] as HTMLElement
    expect(left.textContent).toMatch(/COURSE PROGRESS|Course Progress/i)
    /* …and the grid still has exactly TWO children, with the journey in the
       second — so the header did not land in the right column or become a
       third grid item, either of which would change which row the journey
       starts on.
   
       UPDATED 2026-09-21 when the post-course steps became their own cards:
       the right column USED to BE the `Study journey` section and is now a
       wrapper holding four of them, so this reads "contains" rather than "is".
       The subject is unchanged — it is still about where the HEADER went. */
    expect(band().children).toHaveLength(2)
    expect(
      band().children[1].querySelector('section[aria-label="Study journey"]'),
    ).toBeTruthy()
  })

  it('renders it exactly once', () => {
    // It is handed to the band OR rendered full-width above, never both — the
    // course name already appears twice on this page by design, and a third
    // would be the duplication `dashboard-course-header` exists to ask about.
    seed()
    renderShell(TESTING_URL)
    const eyebrows = screen.getAllByText(/^Course Progress$/i)
    expect(eyebrows).toHaveLength(1)
  })

  it('leaves QE Focused’s header full-width above the grid', () => {
    // The other direction. XCEL's default keeps the wide header, and its left
    // column starts at the block's own content.
    seed()
    renderShell(QE_URL)
    const left = band().children[0] as HTMLElement
    expect(left.textContent).not.toMatch(/COURSE PROGRESS/i)
  })
})

describe('the Study Journey is framed', () => {
  /*
   * A white card with a hairline edge (2026-09-21, the direct ask), which
   * REVERSES the 2026-09-16 removal of exactly that card. Both decisions are
   * right for their own composition and both shells live in `widgetStyles.ts`,
   * which is the file's whole reason for existing — a second card shell defined
   * somewhere else is how two cards in one column stop agreeing.
   */
  const journey = () =>
    document.querySelector('section[aria-label="Study journey"]') as HTMLElement

  it('carries a fill on Testing', () => {
    seed()
    renderShell(TESTING_URL)
    expect(journey().style.background).toContain('--color-surface-card')
  })

  it('carries NO stroke and NO shadow — the fill is the whole treatment', () => {
    /*
     * INVERTED, not deleted (2026-09-21, "remove stroke"). This asserted the
     * 1px `--color-border-subtle` edge for the few hours that shipped, and the
     * assertion is turned round rather than dropped so the absence reads as
     * deliberate and a re-added outline fails a test.
     *
     * The shadow half is unchanged and is the half that matters most now:
     * removing an edge and adding a shadow is not removing chrome, it is
     * swapping one kind for another — and it would make this a RAISED card, a
     * different claim about the column's depth from the flat recess the Study
     * Pace tile wears opposite.
     */
    seed()
    renderShell(TESTING_URL)
    const st = journey().style
    expect(st.border).toBe('')
    expect(st.borderTopWidth).toBe('')
    expect(st.boxShadow).toBe('')
  })

  it('stays bare on the page grey for QE Focused', () => {
    // The other direction — XCEL's default keeps the no-card treatment. The
    // FILL is what tells the two apart now that neither carries a stroke.
    seed()
    renderShell(QE_URL)
    expect(journey().style.background).toBe('')
  })

  it('declares both shells in widgetStyles.ts', () => {
    // The file exists so the column's surfaces are decided in ONE place. A
    // third shell written inline at a call site is the drift it prevents.
    const src = readFileSync('src/components/learning/widgetStyles.ts', 'utf8')
    expect(src).toMatch(/export const widgetCardStyle/)
    expect(src).toMatch(/export const widgetCardFramedStyle/)
  })
})

describe('the post-course steps are their own widgets', () => {
  /*
   * Four cards where there was one (2026-09-21, "split those out in better
   * steps"): the coursework journey, then Schedule / Pass / Get Licensed.
   *
   * The split's real risk is that four cards read as four unrelated things —
   * the 01→07 sequence used to be one spine down one card, and separate cards
   * cannot draw a continuous line. The NUMBERS carry it now, which is why they
   * are pinned here rather than left as decoration.
   */
  const rightColumn = () =>
    (document.querySelector('.cre-learner-focused-band') as HTMLElement).children[1] as HTMLElement

  const cardLabels = () =>
    [...rightColumn().querySelectorAll(':scope > section')].map((c) =>
      c.getAttribute('aria-label'),
    )

  it('renders four cards, in route order', () => {
    seed()
    renderShell(TESTING_URL)
    expect(cardLabels()).toEqual([
      'Study journey',
      'Schedule State Exam',
      'Pass State Exam',
      'Get Licensed in New York',
    ])
  })

  it('carries the journey’s own range in its eyebrow, so the sequence starts at 01', () => {
    /* Without it the column's four eyebrows read "Atlas Study Journey / Step
       05 / Step 06 / Step 07" and the sequence appears to begin at 05. The
       range is DERIVED from the real stop count — the same count the licensing
       steps are offset by — so the two cannot disagree about where 04 ends. */
    seed()
    renderShell(TESTING_URL)
    const eyebrows = [...rightColumn().querySelectorAll('p.cre-eyebrow-ink')].map((p) =>
      p.textContent?.trim(),
    )
    expect(eyebrows[0]).toMatch(/^Steps 01\u2013\d\d \u00b7 Atlas Study Journey$/)
  })

  it('leaves the single-card treatment’s eyebrow alone', () => {
    // No set of eyebrows there for a range to join, and the 01-04 stops sit
    // directly under it — the same figures twice, three lines apart.
    seed()
    renderShell(QE_URL)
    const right = (document.querySelector('.cre-learner-focused-band') as HTMLElement)
      .children[1] as HTMLElement
    const first = right.querySelector('p.cre-eyebrow-ink')
    expect(first?.textContent?.trim()).toBe('Atlas Study Journey')
  })

  it('numbers the steps 05-07, continuing the journey', () => {
    // Derived from the journey's REAL stop count, not a literal — merging two
    // completion stops into one already changed that offset once.
    seed()
    renderShell(TESTING_URL)
    const steps = [...rightColumn().querySelectorAll('p')]
      .map((p) => p.textContent?.trim())
      .filter((t) => /^Step \d\d$/.test(t ?? ''))
    expect(steps).toEqual(['Step 05', 'Step 06', 'Step 07'])
  })

  it('names each card by its VISIBLE heading', () => {
    // The arrival card's heading is "Get Licensed in New York" while its step
    // title is "Apply for your License". A region announced as one thing and
    // headed another is the "Dash Dashboard" defect in miniature.
    seed()
    renderShell(TESTING_URL)
    const last = rightColumn().querySelectorAll(':scope > section')[3] as HTMLElement
    expect(last.getAttribute('aria-label')).toBe('Get Licensed in New York')
    expect(within(last).getByText('Get Licensed in New York')).toBeTruthy()
    /* THE LEAD LINE IS GONE (2026-09-21, "remove"), and this assertion is
       INVERTED rather than deleted. It carried the step title under the
       overridden heading so the ACTION was named as well as the destination —
       the third saying of one thing, with the detail below already stating what
       you do and the link saying "How to apply". The step title now appears
       nowhere on this card, which is the intended trade. */
    expect(within(last).queryByText('Apply for your License')).toBeNull()
  })

  it('gives each step its own sub-link, labelled from the data', () => {
    // Authored per step rather than one shared string: what the sheet answers
    // differs, and "What to expect" on the application step would be the
    // generic label that tells a learner nothing.
    seed()
    renderShell(TESTING_URL)
    const col = rightColumn()
    /* "Schedule State Exam" as of 2026-09-21 (was "How to register"). Note it
       now MATCHES ITS OWN CARD'S HEADING — asserted as a button specifically,
       so this is the CTA and not the heading text being found twice. */
    expect(
      within(col).getByRole('button', { name: /^Schedule State Exam/ }),
    ).toBeTruthy()
    expect(within(col).getByRole('button', { name: /What to expect/ })).toBeTruthy()
    expect(within(col).getByRole('button', { name: /How to apply/ })).toBeTruthy()
  })

  it('shows the owner/fee line only where there is a FEE', () => {
    /* Pass State Exam publishes no fee, so its meta was the bare word "PSI" —
       a one-word row under a sentence, which reads as a label for something
       missing. The rule is "needs a fee", not "except step 06", so a fourth
       step sorts itself out.
   
       Asserted as the RULE across all three rather than as one absence: an
       absence check alone would pass just as happily if every meta line
       vanished. */
    seed()
    renderShell(TESTING_URL)
    const cards = [...rightColumn().querySelectorAll(':scope > section')].slice(1)
    const [schedule, pass, apply] = cards.map((c) => c.textContent ?? '')
    expect(schedule).toMatch(/PSI · \$40 exam fee/)
    /* THE SHORT OWNER FORM on the card — "NY", not the 30-character
       "NY Dept. of Financial Services", which wrapped its fee to a second line
       in a ~300px column. The FULL name is untouched in the data and is what
       the Get Licensed rail still prints on QE Focused; asserted there too, so
       the abbreviation cannot quietly become the only name. */
    expect(apply).toMatch(/NY · \$80 application fee/)
    expect(apply).not.toMatch(/Dept\. of Financial Services/)
    // The one with no fee carries no owner line — and nothing else on that card
    // names PSI either, so this is a genuine absence rather than a moved word.
    expect(pass).not.toMatch(/PSI/)
  })

  it('puts the requirements action BELOW the cards, not inside one', () => {
    /* MOVED OUT 2026-09-21 ("take this out of the widget and make it a
       secondary style button below"). It was a text link at the foot of the
       arrival card; it is the column's last child now.
   
       This assertion was about "the LAST card only" and is rewritten rather
       than deleted — the subject is the same (there is exactly ONE of these,
       and it belongs to the sequence rather than to a step), only its place
       changed. */
    seed()
    renderShell(TESTING_URL)
    expect(screen.getAllByRole('button', { name: /State Requirements/ })).toHaveLength(1)
    const kids = [...rightColumn().children]
    const last = kids[kids.length - 1] as HTMLElement
    expect(last.tagName).toBe('BUTTON')
    expect(last.textContent).toMatch(/State Requirements/)
    // …and no card carries it any more.
    for (const card of rightColumn().querySelectorAll(':scope > section')) {
      expect(card.textContent).not.toMatch(/State Requirements/)
    }
  })

  it('draws it full width, by inheritance rather than a literal', () => {
    // A flex column stretches its children, so the button matches the cards
    // above it exactly and cannot drift from them if the column resizes. The
    // assertion is the absence of a width, not a pixel figure — jsdom has no
    // layout, and a measured number would be the drift it guards against.
    seed()
    renderShell(TESTING_URL)
    const kids = [...rightColumn().children]
    const btn = kids[kids.length - 1] as HTMLElement
    expect(btn.style.width).toBe('100%')
  })

  it('takes its ink AND its stroke from one themed class', () => {
    /* `.cre-cta-ink` with `borderColor: currentColor`, NOT the shared
       `Button variant="secondary"`. That component draws both from
       `--color-action`, which on XCEL is the Brick red — a FILL colour that
       measures 2.05:1 as TEXT on the dark shell, and the ramp this version
       deliberately moved every CTA off ("navy means do this; red means this is
       an assessment"). `currentColor` also means the dark-mode swap reaches the
       stroke without a second declaration. */
    seed()
    renderShell(TESTING_URL)
    const kids = [...rightColumn().children]
    const btn = kids[kids.length - 1] as HTMLElement
    expect(btn.className).toContain('cre-cta-ink')
    /* ASSERTED AS THE ABSENCE OF A COLOUR, not the presence of `currentColor`:
       jsdom normalises `border: 1px solid currentColor` down to "1px solid",
       dropping the keyword, because currentColor IS the initial border-color.
       The claim that matters survives either way — the inline style sets no ink
       and no stroke colour, so nothing can beat the class. Measured in a real
       browser, where the two resolve together: 7.00:1 light / 7.76:1 dark, with
       `borderTopColor === color` in both. */
    expect(btn.style.color).toBe('')
    expect(btn.style.borderColor).not.toMatch(/rgb|#|var\(/)
  })

  it('names the requirements link for the path’s own jurisdiction', () => {
    /* The card renders for whatever path is current, so a hardcoded "New York"
       would be a wrong fact the moment a Florida path reached it. Asserted
       against the SAME `jurisdictionName` the heading resolves, so the two
       cannot disagree — a card headed "Get Licensed in New York" over a link
       naming another state is the defect this guards. */
    seed()
    renderShell(TESTING_URL)
    const where = jurisdictionName(
      learningPathsFor('xcel').find((p) => p.id === XCEL_NY_PRODUCER_PATH_ID)?.state,
    )
    expect(where).toBeTruthy()
    // The button below the cards…
    expect(screen.getByRole('button', { name: `${where} State Requirements` })).toBeTruthy()
    // …and the arrival card's own heading, from the SAME resolution.
    const lastCard = rightColumn().querySelectorAll(':scope > section')[3] as HTMLElement
    expect(lastCard.getAttribute('aria-label')).toBe(`Get Licensed in ${where}`)
  })

  it('still gives the steps NO completion state', () => {
    // The absence is the design: PSI schedules the sitting, PSI scores it and
    // DFS issues the licence, and the product has no feed for any of it. Four
    // cards make that easier to forget than three rows did.
    seed()
    renderShell(TESTING_URL)
    const cards = [...rightColumn().querySelectorAll(':scope > section')].slice(1)
    for (const c of cards) {
      /* WORD-BOUNDARIED STATUS LABELS, not the substring "complete" — the
         published copy says "your certificate of completion", twice, and a
         naive /complete/i reads that as a status. The first version of this
         test failed on exactly that, which is the reverse of the usual trap:
         an assertion strict enough to be wrong rather than loose enough to
         pass for the wrong reason. */
      expect(c.textContent).not.toMatch(/\b(completed|in progress|not started|overdue)\b/i)
      /* NO `%` ASSERTION HERE, deliberately. One was written and removed: the
         Pass State Exam card prints "70% to pass", which is the STATE's
         published pass mark — a fact about the exam, not a claim about this
         learner. The "no percentages" rule belongs to the pacing tile, where a
         number would be a progress claim; borrowing it here would have banned
         the one figure on the card that is sourced. */
    }
  })

  it('keeps the FULL agency name on the QE Focused rail', () => {
    /* The abbreviation is a card-width concession, not a rename — the rail has
       the room, so it still says who issues the licence.
   
       SEEDS THE COMPACT TREATMENT, and that is not incidental: the Get Licensed
       rows print their owner/fee meta ONLY there. The catalog default is
       `syllabus`, which drops it (see `leanMeta`) — so a version of this test
       that rendered the default would have found no owner anywhere and passed
       or failed for a reason having nothing to do with the abbreviation. */
    seed({ 'dashboard-journey-style': { enabled: true, variant: 'default' } })
    renderShell(QE_URL)
    expect(document.body.textContent).toMatch(/NY Dept\. of Financial Services/)
  })

  it('leaves QE Focused as ONE card with the Get Licensed rail', () => {
    // The other direction. XCEL's default keeps the single card.
    seed()
    renderShell(QE_URL)
    const right = (document.querySelector('.cre-learner-focused-band') as HTMLElement)
      .children[1] as HTMLElement
    expect(right.getAttribute('aria-label')).toBe('Study journey')
    expect(right.querySelectorAll(':scope > section')).toHaveLength(0)
  })
})

describe('the collapse control', () => {
  it('is hidden on Testing', () => {
    seed()
    renderShell(TESTING_URL)
    expect(screen.queryByText(/Collapse/i)).toBeNull()
  })

  it('is still there on QE Focused', () => {
    seed()
    renderShell(QE_URL)
    expect(screen.getByText(/Collapse/i)).toBeTruthy()
  })
})

describe('the pacing flag is wired where a reviewer will find it', () => {
  it('is in the catalog as a variant-only flag with five treatments', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-pacing-style')
    expect(def).toBeTruthy()
    expect(def?.defaultEnabled).toBe(true)
    // `presets` was APPENDED (2026-09-21). Order is asserted as well as
    // membership: the panel renders the variants in this order, and the four
    // that were here first are the ones a reviewer has already looked at.
    expect(def?.variants?.map((v) => v.value)).toEqual([
      'lo-fi',
      'rate',
      'runway',
      'balance',
      'presets',
    ])
  })

  it('opens on `presets` — the treatment, not just a non-stub', () => {
    /* It asserted `runway` until 2026-09-21, under a weaker claim: "the version
       exists to look at pacing, so landing on `lo-fi` would make the whole
       thing read as unchanged." Any real treatment satisfied that.

       The claim is stronger now because this version became XCEL's DEFAULT the
       same day. `?demo=1` renders the committed baseline and IGNORES stored
       flags, and no URL parameter sets one — so this value is not where a
       stakeholder starts, it is the entirety of what they see on a review link.
       Which treatment sits here is therefore a design decision, and pinning the
       specific one is the point rather than an over-tight assertion. */
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-pacing-style')
    expect(def?.defaultVariant).toBe('presets')
  })

  it('is in the rebrand panel scope', () => {
    // A key in the catalog but outside the scope is SILENT — the panel filters
    // the catalog BY the scope, so the control simply would not appear.
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-pacing-style')
  })
})
