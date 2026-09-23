import { readFileSync } from 'node:fs'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { NOT_STARTED_NIGHTS, paceNameFor } from '@/lib/studyPace'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { jurisdictionName } from '@/data/nyProducerRequirements'
import { learningPathsFor } from '@/data/learningFixtures'
import { journeyStopsFor } from '@/components/learning/studyJourneyUtil'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
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
  /* ⚠ `study-pace-readout: prose` UNLESS A TEST SAYS OTHERWISE — 2026-09-23.
     `stats` is the branch default, and it replaces the Study Pace card's two
     fact SENTENCES with a three-cell readout. Several assertions here are about
     what those sentences say (the ceiling the card used, the date it lands on),
     and they are still the right assertions for the prose treatment. Pinned in
     the shared seed rather than test by test so a new prose assertion does not
     have to know the flag exists; `extra` still wins, which is how the stats
     tests select it. */
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({
      'study-pace-readout': { enabled: true, variant: 'prose' },
      /* `strip` unless a test says otherwise — `options` is the branch default
         and puts three radio buttons above the card, which several assertions
         here count. See the same note in `StudyPaceTile.test.tsx`. */
      'study-pace-chooser': { enabled: true, variant: 'strip' },
      ...extra,
    }),
  )
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
  /* ⚠ THE PREFIX IS OPEN-ENDED as of 2026-09-23. It was `(?:Recommended |Your )?`
     — the two names the eyebrow could carry. It is built from
     `paceBadgeLabel` now and can say Recommended / Focused & Quick /
     Steady & Relaxed / Custom, so the locator matches ANY prefix rather than
     being edited every time that vocabulary grows. Still anchored on
     "Study Pace" at the end, which is what makes it this tile. */
  /* ⚠ NOT ANCHORED AT THE END any more. The `options` treatment's heading is
     "Set your Study Pace (optional)" as of 2026-09-23, so a `$` anchor finds
     nothing there; `strip` still ends with it. Matching the phrase wherever it
     falls covers every treatment, including the bare tile's plain "Study
     Pace". */
  return screen.getByText(/Study Pace/).parentElement as HTMLElement
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

  it('now LEADS the picker, which QE Focused used to', () => {
    /* INVERTED 2026-09-22, and the original subject is why it survives rather
       than being deleted. This file's whole premise was that Testing was added
       "without displacing anything" — it sat third behind QE Focused, and this
       test pinned that restraint.

       The direct ask ended it: "we are going in the direction of Testing
       Version", and QE Focused and Marketing Focused came off the picker. So
       the claim inverts — Testing leads because there is nothing left in front
       of it. QE Focused is ARCHIVED, not deleted: it still resolves by
       `?version=`, which is what keeps `QeFocusedVersion.test.tsx` describing
       the layout this version inherits. */
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS[0]).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
    )
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS).not.toContain(
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

describe('the pacing treatment', () => {
  /*
   * ONE treatment as of 2026-09-22. This block swept five behind
   * `dashboard-pacing-style` — `lo-fi` / `rate` / `runway` / `balance` /
   * `presets` — and pinned what they had in common: every one kept the status
   * pill (presets excepted, which states the conclusion in words), none
   * invented a projection, none printed a percentage.
   *
   * Presets won and the flag was retired. The sweeps are gone with the
   * variants they swept, but the two CLAIMS that were never about having a
   * choice are kept below and re-aimed at the one surviving treatment — they
   * were the point of the block, not the enumeration.
   *
   * `lo-fi` is NOT retired and is tested here still: it is what every
   * NON-Testing version renders, which is the part of this that could break
   * silently now that nothing on Testing can reach it.
   */
  it('invents no projection the fixtures cannot support', () => {
    // Nothing here knows an OBSERVED rate, a schedule to be ahead of, or a
    // projected finish date. The reference mock for this block carried "You are
    // currently pacing 4 days ahead of schedule"; authoring it is the move this
    // version has refused throughout.
    renderShell(TESTING_URL)
    const text = paceTile().textContent ?? ''
    expect(text).not.toMatch(/ahead of schedule|behind schedule|projected|on track to finish on/i)
  })

  it('states no percentage', () => {
    /* A `%` on this tile is a PROGRESS claim, and the block directly above it
       already states progress. The rule lives here rather than on the Get
       Licensed cards, where "70% to pass" is the state's published pass mark
       and a sourced fact about the exam. */
    renderShell(TESTING_URL)
    expect(paceTile().textContent).not.toMatch(/%/)
  })

  it('states the compliance conclusion instead of the pill', () => {
    // Presets drops `pacingStatus` — it may do that only because it answers the
    // same question in words. A card carrying neither would say less than the
    // stub it replaced, which is what this has always been guarding.
    seed()
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(within(tile).queryByText('On Track')).toBeNull()
    expect(tile.textContent).toMatch(/You have \d+ days left to finish/)
    expect(tile.textContent).toMatch(/you will finish around [A-Z][a-z]{2} \d+/)
  })

  it('answers the same question in CELLS on the stats readout', () => {
    /* ⚠ THE SAME GUARD, FOR THE OTHER VARIANT — 2026-09-23, and the reason it
       is a second test rather than a loosened first one. The claim above is
       that this card may drop `pacingStatus` only because it answers the same
       question in words. `study-pace-readout: stats` replaces those words with
       three cells, so the claim has to be re-made against them or the variant
       quietly removes the answer the rule depends on.

       AND THE STATUS CELL IS THE PACE AXIS, not the compliance one. That was
       asked and settled: "At Risk" is a verdict about the LEARNER and this card
       only speaks about the plan — `PaceChip`'s own note records why the two
       must not share a badge. So the cell says Recommended / Relaxed /
       Focused, and "On Track" must still appear nowhere on this tile. */
    seed({ 'study-pace-readout': { enabled: true, variant: 'stats' } })
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(within(tile).queryByText('On Track')).toBeNull()
    expect(within(tile).queryByText('At Risk')).toBeNull()
    // The two facts the prose stated, now as cells.
    expect(tile.textContent).toMatch(/Course access/i)
    expect(tile.textContent).toMatch(/\d+ days/)
    expect(tile.textContent).toMatch(/Course completion/i)
    /* The estimate is still LABELLED an estimate — the qualifier moved under
       the date on 2026-09-23 so the caption could shorten, and a cell that
       printed a bare date would be promising one. */
    expect(tile.textContent).toMatch(/At your current pace/i)
    // The access END date survives as the countdown's second line — the half
    // the prose would otherwise have taken with it.
    expect(tile.textContent).toMatch(/Ends [A-Z][a-z]{2} \d+/)
    /* DAYS TO REVIEW replaced the Status cell the same day. It is the gap
       between the plan's finish and the day access ends — the reason
       `RECOMMENDED_BUFFER_DAYS` exists, printed for the first time. */
    expect(tile.textContent).toMatch(/Days to review/i)
    expect(tile.textContent).toMatch(/Extra prep time/i)

    /* ⚠ THE FINISH-DATE NOTE IS NO LONGER ON THE CARD, and asserting its
       absence is the point: it moved into a tip on the Course completion cell,
       so a version that printed it BOTH places would pass a `toContain` and be
       wrong. The trigger is what is on screen; the copy arrives on hover. */
    expect(tile.textContent).not.toMatch(/Your estimated finish date will update/)
    expect(within(tile).getByRole('button', { name: 'About this date' })).toBeTruthy()

    /* THE PACE PILL MOVED TO THE TILE'S TOP RIGHT rather than being dropped —
       the logic is unchanged, only the placement. It sits in the eyebrow row,
       which is why this looks for it beside the caption. */
    /* ⚠ THE BADGE IS GONE and the NAME is in the eyebrow — 2026-09-23, two
       asks in a row. It said "Recommended" beside an eyebrow reading
       RECOMMENDED STUDY PACE, which is the duplication the original pill was
       removed for. The heading now carries the name, derived from the review
       gap, so this pins the RELATIONSHIP rather than a literal: whatever the
       cell says, the heading is that name. */
    const caption = tile.querySelector('.cre-eyebrow-ink') as HTMLElement
    const gap = Number(/(\d+)\s*days?\s*Extra prep time/i.exec(tile.textContent ?? '')?.[1])
    expect(Number.isFinite(gap)).toBe(true)
    expect(caption.textContent).toBe(`${paceNameFor(gap)} Study Pace`)

    // …and the one thing that survives BOTH variants.
    expect(within(tile).getByRole('button', { name: /Adjust Study Plan/ })).toBeTruthy()
  })

  it('leaves the tile lo-fi on every OTHER version', () => {
    // THE REASON `lo-fi` SURVIVED THE RETIREMENT. Off Testing, Study Pace is
    // still half of the square pair and the stub is what ships. It used to be
    // reachable as a variant, so this was one of five; now this test is the
    // ONLY thing rendering that path, and a presets card leaking onto QE
    // Focused would change what XCEL's DEFAULT shows.
    renderShell(QE_URL)
    const tile = paceTile()
    expect(tile.style.aspectRatio).toBe('1 / 1')
    expect(tile.textContent).not.toMatch(/a week/)
    expect(within(tile).queryByRole('button', { name: 'Start studying' })).toBeNull()
  })

  it('has no flag left to pick a treatment with', () => {
    // The retirement itself. A reviewer finding `dashboard-pacing-style` in the
    // catalog again should find this failing rather than a picker offering one
    // live answer and three dead ones.
    expect(FEATURE_FLAGS.find((f) => f.key === 'dashboard-pacing-style')).toBeUndefined()
    expect(flagScopeForPath('/dashboard-rebrand')).not.toContain('dashboard-pacing-style')
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
  /* Was `seed({ 'dashboard-pacing-style': … 'presets' })`. The flag is retired
     and the treatment is unconditional on this version, so the seed is just the
     account — kept as a named helper so every test below still reads as "given
     the presets card". */
  /** `extra` forwards to `seed`, so a test wanting the stats readout (where the
   *  Days to review cell lives) can ask for it without a second helper. */
  const seedPresets = (extra: Record<string, unknown> = {}) => seed(extra)

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
    /* COUNTED, not searched for. The strip became circular indicators labelled
       by INITIAL on 2026-09-21, and `toContain('M')` against the whole tile is
       satisfied by any sentence on it — an assertion that cannot fail is worse
       than none. Seven dots, in order, is the claim. */
    const strip = paceTile().querySelector('[aria-hidden]')!
    const cells = [...strip.querySelectorAll('span')].map((c) => c.textContent)
    expect(cells).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
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
    seedPresets({ 'study-pace-readout': { enabled: true, variant: 'stats' } })
    renderShell(TESTING_URL)
    const before = /^(.*? Study Pace)/.exec(paceTile().textContent ?? '')?.[1] ?? ''
    expect(before).toMatch(/Study Pace$/)

    await user.click(within(paceTile()).getByRole('button', { name: 'Adjust Study Plan' }))
    const dialog = screen.getByRole('dialog')
    /* UPDATED 2026-09-22 with the sheet's new IA. It used to pick one of the
       three preset radio rows; the sheet is now a chooser of study STYLES, so
       the equivalent gesture is opening one and saving the week it builds. The
       CLAIM is unchanged, which is why this was edited rather than dropped. */
    await user.click(dialog.querySelector('[data-shape="custom"]')!)
    await user.click(within(dialog).getByRole('button', { name: /^Save pace/ }))

    /* ⚠ THE CLAIM NARROWED THE SAME DAY, and this records it rather than
       asserting something that is no longer true. The eyebrow is derived from
       DAYS TO REVIEW now, so it names the plan's shape rather than its author —
       a learner-chosen plan landing in the 7-15 band IS called "Recommended"
       again. `paceNameFor`'s note spells out the trade.

       ⚠ AND IT DOES NOT SIMPLY FLIP. A first draft of this asserted the name
       must CHANGE after saving, which failed: the evenings week happens to land
       in the same review band as the model's own suggestion, so the heading is
       correctly identical. A name derived from an outcome only moves when the
       outcome crosses a threshold, and asserting otherwise would have been
       pinning a coincidence.

       So what this checks is the DERIVATION holding on both sides of the
       gesture — the heading is `paceNameFor` of the gap the card is showing,
       before and after. */
    const nameAndGap = () => {
      const t = paceTile().textContent ?? ''
      return {
        name: /^(.*?) Study Pace/.exec(t)?.[1] ?? '',
        gap: Number(/(\d+)\s*days?\s*Extra prep time/i.exec(t)?.[1]),
      }
    }
    const after = nameAndGap()
    expect(Number.isFinite(after.gap)).toBe(true)
    expect(after.name).toBe(paceNameFor(after.gap))
    expect(before).toMatch(/Study Pace$/)
  })

  it('operates exactly one thing, and no more', () => {
    /* The card operates its one plan link and nothing else — the same claim
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
    expect(names).toEqual(['Adjust Study Plan'])
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

  it('the plan link opens the SHARED sheet, not a second one', () => {
    /* The reuse this whole variant rests on. A `presets` card that grew its own
       sheet would be a second copy of the four groups — and of the exam date and
       the study-plan calendar, both of which write. */
    seedPresets()
    renderShell(TESTING_URL)
    expect(
      within(paceTile())
        .getByRole('button', { name: 'Adjust Study Plan' })
        .getAttribute('aria-haspopup'),
    ).toBe('dialog')
  })

  it('loses the square, like every other treatment on this version', () => {
    seedPresets()
    renderShell(TESTING_URL)
    expect(paceTile().style.aspectRatio).toBe('')
  })
})

describe('the beginner week — 0%', () => {
  /*
   * 2026-09-22, the direct ask: "at 0% this should default to about ## hours a
   * night, 4 days a week, and the calendar should indicate a mon-thurs
   * schedule."
   *
   * TWO THINGS, and only at 0%. The nights count stops being derived and
   * becomes `NOT_STARTED_NIGHTS`, and the sentence's second clause states DAYS
   * rather than HOURS a week. Both are starting positions: a learner who picks
   * a nights count or builds a plan overrides them like any other default.
   */
  const seedNotStarted = () =>
    seed({ 'dashboard-progress-state': { enabled: true, variant: 'not-started' } })

  it('states days a week, not hours a week', () => {
    seedNotStarted()
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(tile.textContent).toMatch(new RegExp(`${NOT_STARTED_NIGHTS} days a week`))
    // The hours-a-week clause is what it REPLACES, so its absence is the claim.
    expect(tile.textContent).not.toMatch(/hours a week/)
  })

  it('still DERIVES the evening — the four nights change the maths, not the honesty', () => {
    /* The point of the ask is the shape of the week, not a friendlier number.
       The evening is whatever the course needs spread over four nights, so it
       is still a figure the fixtures support. Asserted as "a figure is stated"
       rather than as its value, which moves with the fixture. */
    seedNotStarted()
    renderShell(TESTING_URL)
    expect(paceTile().textContent).toMatch(/About\s*\d+(½|¼|¾)?\s*hours? a night/)
  })

  it('shades Mon–Thu on the week strip', () => {
    // `defaultWeekdays(4)` is Monday-first and returns [0,1,2,3], so the strip
    // and the nights count cannot disagree about WHICH four days.
    seedNotStarted()
    renderShell(TESTING_URL)
    /* ⚠ `span, button` AS OF 2026-09-23. The strip's cells became BUTTONS at
       0% that day — the direct ask, "have these be clickable so the user can
       see this change in real time... to set the goal" — so a `span`-only
       query found nothing on the one persona this test seeds. The cell's
       styling is unchanged either way, which is why the assertions below are
       not. */
    const labels = [...paceTile().querySelectorAll('span, button')]
      .filter((el) => /^[MTWFS]$/.test(el.textContent ?? ''))
      .slice(0, 7)
    expect(labels).toHaveLength(7)
    /* A planned cell is filled SOLID with `--color-primary-500`; an unplanned
       one is `transparent`. Every cell carries a `background`, so the presence
       of the property says nothing — the FILL is what differs, along with the
       ring and the ink, which all follow the same boolean.

       ⚠ `-500`, NOT `-100`, as of 2026-09-23. The pale `primary-100` fill was
       the old treatment; the direct ask made an ON night a solid `primary-500`
       disc with `primary-100` letters. It applied to the SUGGESTION strip
       first and to the ACTUAL one within the hour ("the days of the week being
       filled in will be solid like the update we did for 0%"), so both modes
       now draw the same disc and `primary-100` survives only as the ink. */
    const filled = labels.filter((el) =>
      (el as HTMLElement).style.background.includes('--color-primary-500'),
    )
    expect(filled).toHaveLength(NOT_STARTED_NIGHTS)
    expect(filled.map((el) => el.textContent)).toEqual(['M', 'T', 'W', 'T'])
    // …and the other three are explicitly transparent, not merely different.
    const empty = labels.filter((el) => (el as HTMLElement).style.background === 'transparent')
    expect(empty.map((el) => el.textContent)).toEqual(['F', 'S', 'S'])
  })

  it('leaves a learner who HAS started on the derived week', () => {
    /* The guard. `notStarted` is passed from `resume.progress`, so a mid-course
       learner must keep the nights the model picked — handing the beginner's
       default to someone at 62% would understate their week.

       ⚠ HOW THE GUARD IS READ CHANGED ON 2026-09-23, and the claim did not.
       It used to be a COPY test: the second clause said "hours a week" for a
       started learner and "days a week" only at 0%, so the two states were
       told apart by their wording. Both say days now — the started card lost
       its picker, and with it the only other place the week's shape was stated,
       so the sentence took it over.

       So it is read as a NUMBER instead, which is what the guard was always
       about: the count must be the model's, not the beginner's. That is a
       stronger assertion than the one it replaces — the old wording would still
       have passed if a started learner had been handed four nights. */
    seed()
    renderShell(TESTING_URL)
    const tile = paceTile()
    const stated = /,\s*(\d+) days a week/.exec(tile.textContent ?? '')
    expect(stated, 'the card states a nights-a-week count').toBeTruthy()
    expect(Number(stated![1])).not.toBe(NOT_STARTED_NIGHTS)
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

  it('calls the whole coursework card Step 1 in its eyebrow', () => {
    /* Without it the column's eyebrows read "Atlas Study Journey / Step 6 /
       Step 7 / Step 8" and the sequence appears to begin at 6. The range is
       DERIVED from the real stop count — the same count the licensing steps are
       offset by — so the two cannot disagree about where the journey ends.

       UNPADDED as of 2026-09-23, the direct ask ("make 01, 1, etc."). The regex
       pins the ABSENCE of the leading zero, since that is the whole change and
       a `\\d+` would pass either way. */
    seed()
    renderShell(TESTING_URL)
    const eyebrows = [...rightColumn().querySelectorAll('p.cre-eyebrow-ink')].map((p) =>
      p.textContent?.trim(),
    )
    expect(eyebrows[0]).toBe('Step 1 \u00b7 Atlas Study Journey')
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

  it('numbers the licensing cards 2, 3, 4 — after the coursework, not after its stops', () => {
    /* ⚠ THE DERIVATION IS THE REGRESSION THIS NOW GUARDS, which inverts what
       this test used to be for. It read the journey's stop count and offset the
       cards past it — so five stops produced "Step 06/07/08" and the column
       described an eight-step route to a licence.

       There are FOUR steps: the coursework, then these three. The stops are
       what step 1 is made of. Asserted as literals AND against a changing stop
       count, so adding a sixth stop fails here instead of silently renumbering
       three cards. */
    seed()
    renderShell(TESTING_URL)
    const steps = [...rightColumn().querySelectorAll('p')]
      .map((p) => p.textContent?.trim())
      .filter((t) => /^Step \d+$/.test(t ?? ''))
    expect(steps).toEqual(['Step 2', 'Step 3', 'Step 4'])
    // …and they do NOT follow the stop count, which is the thing that broke.
    const stops = journeyStopsFor(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!.path,
    )
    expect(stops.length).toBeGreaterThan(1)
    expect(steps[0]).not.toBe(`Step ${stops.length + 1}`)
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

  it('states the FEE on the meta line, and never the owner', () => {
    /* 2026-09-22: the meta line is the fee alone. It was `owner · fee`, and
       the owner came off both ends in two asks a day apart — Pass State Exam's
       bare "PSI" first (it publishes no fee, so the pairing had nothing to
       pair), then Schedule State Exam's "PSI · $40 exam fee".

       ASSERTED AS THE RULE ACROSS ALL THREE, which is the shape this test has
       always had and the reason it survived the change rather than being
       deleted: the note it carried warned that "an absence check alone would
       pass just as happily if every meta line vanished". So the fees are
       pinned POSITIVELY and the owners negatively, and a regression in either
       direction fails.

       The owner is not gone from the product — `step.owner` / `ownerShort` are
       untouched in the data, the Get Licensed RAIL still prints the full "NY
       Dept. of Financial Services" (asserted in QeFocusedVersion.test.tsx), and
       each step's sheet still names PSI and DFS. It is gone from these CARDS. */
    seed()
    renderShell(TESTING_URL)
    const cards = [...rightColumn().querySelectorAll(':scope > section')].slice(1)
    const [schedule, pass, apply] = cards.map((c) => c.textContent ?? '')
    // The fees survive — the half of the line that was kept.
    expect(schedule).toMatch(/\$40 exam fee/)
    expect(apply).toMatch(/\$80 application fee/)
    // …with no owner in front of either, in short or long form.
    expect(schedule).not.toMatch(/PSI/)
    expect(apply).not.toMatch(/NY · /)
    expect(apply).not.toMatch(/Dept\. of Financial Services/)
    // Pass State Exam publishes no fee, so it has no meta line at all — the
    // case that produced the rule, and still the one that proves it is a rule.
    expect(pass).not.toMatch(/PSI/)
    expect(pass).not.toMatch(/fee/)
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

describe('the pacing treatment a review link lands on', () => {
  /*
   * This block used to pin the FLAG: that it was in the catalog with five
   * variants in a fixed order, that `defaultVariant` was `presets`, and that it
   * was inside the rebrand panel scope. All three were about one thing — which
   * treatment a stakeholder sees on a review link — and the flag was how that
   * was answered while five treatments existed.
   *
   * The flag is retired (2026-09-22). The question it answered has not gone
   * away, so it is asked directly of the render instead: `?demo=1` renders the
   * committed baseline and no URL parameter changes the treatment, so what this
   * asserts IS the entirety of what a reviewer sees.
   */
  it('shows the presets card, with no flag seeded', () => {
    // No `seed({...})` of any pacing key — that is the assertion. What renders
    // is whatever the version renders, which is now the whole answer.
    seed()
    renderShell(TESTING_URL)
    const tile = paceTile()
    expect(tile.textContent).toMatch(/hours a night/)
    expect(tile.textContent).toMatch(/You have \d+ days left to finish/)
  })

  it('is not a stub, and cannot be switched back to one', () => {
    // The weaker claim the original made ("landing on lo-fi would make the
    // version read as unchanged") is now structural rather than a default: the
    // Testing arrangement has no branch that reaches `LoFiWidgetBody`.
    renderShell(TESTING_URL)
    expect(paceTile().querySelector('[aria-label="Study pace — placeholder"]')).toBeNull()
  })
})


describe('the course header bar at nought', () => {
  /*
   * 2026-09-23, the direct ask: "at 0% hide this bar and shift the title and
   * eyebrow down."
   *
   * An empty groove is the one state where the bar costs more than it says.
   * Everywhere else it reports a position; at 0 it reports that there is
   * nothing to report, in the widest element of the band, directly above a stat
   * row already printing "0 of 42 lessons COMPLETED" in words.
   */
  const headerBars = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>('div[aria-hidden="true"]')].filter(
      (el) => el.style.borderRadius === 'var(--radius-pill)' && el.style.height === '8px',
    )

  it('hides the bar at 0% and keeps it above nought', () => {
    seed({ 'dashboard-progress-state': { enabled: true, variant: 'not-started' } })
    const { container, unmount } = renderShell(TESTING_URL)
    expect(container.textContent).toMatch(/0 of \d+ lessons/i)
    expect(headerBars(container)).toHaveLength(0)
    unmount()

    /* AND THE OTHER HALF, which is the assertion that would have been missed:
       "hidden at 0" is trivially satisfiable by never rendering it. */
    seed({ 'dashboard-progress-state': { enabled: true, variant: 'progress-on-track' } })
    const onTrack = renderShell(TESTING_URL)
    expect(headerBars(onTrack.container).length).toBeGreaterThan(0)
  })

  it('reserves the space rather than letting the header collapse', () => {
    /* ⚠ THE STRUCTURAL HALF, and the reason this is a test rather than a
       comment. The cover art is `align-self: stretch` (see
       `.cre-course-header-narrow > img` in tokens.css) and its foot is
       deliberately aligned with the stat row's rule — "stretch vertically to
       align with the bottom of the divider line", the 2026-09-21 ask. A header
       that simply lost 10px at 0% would re-crop the photograph and break that
       alignment to fix a bar, and nothing on screen would say why. */
    seed({ 'dashboard-progress-state': { enabled: true, variant: 'not-started' } })
    const { container } = renderShell(TESTING_URL)
    const eyebrow = [...container.querySelectorAll<HTMLElement>('p.cre-eyebrow-ink')].find(
      (el) => /course progress/i.test(el.textContent ?? ''),
    )
    expect(eyebrow).toBeTruthy()
    // The padding lands on the column that holds the eyebrow and the title.
    const column = eyebrow!.closest('div[style*="padding-top"]') as HTMLElement | null
    expect(column).toBeTruthy()
    expect(column!.style.paddingTop).toBe('10px')
  })
})
