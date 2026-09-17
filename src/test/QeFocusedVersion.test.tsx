import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
  defaultDiscoverabilityVersionFor,
} from '@/data/dashboardVersions'
import { journeyStopsFor, metaWords, statusWords } from '@/components/learning/studyJourneyUtil'
import { CATEGORY_BAR_HEIGHT } from '@/components/learning/progressGauge'
import {
  CATEGORY_PALETTE,
  CATEGORY_PALETTE_ON_DARK,
  categoryColorFor,
} from '@/components/learning/progressGaugeUtil'
import {
  dashboardProgressPersonaFor,
  DASHBOARD_PROGRESS_PICKER,
} from '@/data/dashboardProgressFixtures'
import { displayedProgressPct, timeRemainingText, longDate } from '@/components/learning/learningPathsHomeUtil'
import {
  GET_LICENSED_STEPS,
  jurisdictionName,
  NY_LH_STUDY_PLAN_URL,
  NY_LH_COURSE_IMAGE,
  NY_LH_PRELICENSING_LESSONS,
  NY_LH_STUDY_PLAN_DAYS,
  NY_PRODUCER_HOURS_INVENTED,
  NY_LH_GUIDE_CHAPTERS_PARTIAL,
  NY_LH_CURRENT_CHAPTER,
  NY_LH_PROGRAM_PARTS,
  NY_LH_LESSON_MINUTES_INVENTED,
  NY_GOVERNING_AGENCY,
  examFactsFor,
} from '@/data/nyProducerRequirements'
import { learningPathsFor, pathRequirementsFor } from '@/data/learningFixtures'
import { resolvePathCategories } from '@/components/learning/progressGaugeUtil'
import { JUMP_BACK_IN_MARK } from '@/components/learning/JumpBackInWidget'
import { STATUS_STRIP_BG, statusTreatment } from '@/components/learning/learningPathsHomeUtil'
import { STUDY_JOURNEY_EYEBROW } from '@/components/learning/StudyJourneyRail'
import { RAIL_GUTTER } from '@/components/layout/PlatformSideNav'
import { XCEL_NY_PRODUCER_PATH_ID } from '@/data/studyCalendarFixtures'
import { CURRENT_LEARNING_EYEBROW } from '@/components/learning/learningPathsHomeUtil'

/**
 * QE FOCUSED — the qualifying-education dashboard version (2026-09-16), and
 * XCEL's default.
 *
 * Three things make it a version rather than a flag combination, and each is
 * pinned here: the Progress detail moves onto the PAGE, the top band slims to a
 * lead-in so the same figures do not render twice, and Recommended for You is
 * dropped. The Study Journey replaces Today's Tasks in the band.
 */

/**
 * Pin the three VARIANT FLAGS back to the treatments they shipped with.
 *
 * `dashboard-course-header`, `dashboard-journey-style` and
 * `dashboard-heading-font` all had their catalog defaults flipped on 2026-09-17
 * ("set this view as the default"). A great many tests in this file were
 * written against the previous defaults and render WITHOUT seeding, so the flip
 * changed their subject out from under them — the band's `hideHeader` in
 * particular removes the block's own art, title, meta line and progress bar,
 * which is what a dozen of them are about.
 *
 * This is the rule CLAUDE.md already states, applied in the other direction: "a
 * test about capability must pin the flags it depends on, or an editorial
 * default silently becomes its subject." So the tests that examine the classic
 * treatment now say so, and the ones that examine the new default seed nothing.
 *
 * It is NOT a claim that the classic look is correct — only that a test about
 * the block's header needs the block to have one.
 */
const CLASSIC_FLAGS = {
  'dashboard-course-header': { enabled: true, variant: 'none' },
  'dashboard-journey-style': { enabled: true, variant: 'default' },
  'dashboard-heading-font': { enabled: true, variant: 'sans' },
} as const

function seedClassic(extra: Record<string, unknown> = {}) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ ...CLASSIC_FLAGS, ...extra }),
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

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the QE Focused version is registered and default', () => {
  it('leads the Discoverability picker', () => {
    // Leads rather than merely appears: the picker's order is what a reviewer
    // reads as "the one we are on".
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS[0]).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
    )
  })

  it('is what XCEL resolves to with no ?version=', () => {
    // TWO callers read this — PlatformShell's fallback and the Header's
    // "Default" pill — and the helper exists so they cannot disagree. Asserting
    // the helper covers both.
    expect(defaultDiscoverabilityVersionFor('xcel')).toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED.id,
    )
  })

  it('keeps Learner Focused and Marketing Focused selectable', () => {
    // The point of adding rather than replacing: the three can be compared.
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    expect(ids).toContain('discoverability-learner-focused')
    expect(ids).toContain('discoverability-marketing-focused')
  })
})

describe('QE Focused resolves a QUALIFYING journey, never Continuing Ed', () => {
  it('opens on the pre-licensing path even though the flag defaults to `ce`', () => {
    // The flag's committed default is `ce`. Without the override the version
    // NAMED for qualifying education opened on a CE renewal path — the same
    // class of incoherence as the Jump Back In card putting securities tasks
    // under an insurance path, which only opening the page caught.
    renderShell('/dashboard-rebrand')
    // `getAllBy` — the title appears in the band's lead-in AND in the Progress
    // section's own header below it, which is expected: the section is the
    // detail behind the lead-in and both name the path.
    expect(
      screen.getAllByText(/New York Life and Health Pre-licensing/i).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/Florida Life & Health CE/i)).toBeNull()
  })
})

describe('there is NO Learning Path Progress section', () => {
  /**
   * It rendered the detail panel's Progress half inline — gauge, category bars
   * and stat tiles, then the per-category course lists. Both halves ended up
   * elsewhere on this version: the SUMMARY moved to the Current Learning
   * Progress block, and the LISTS are the Study Journey, which walks the same
   * categories in order with each stop's status in words.
   *
   * What was left was a second copy of the path title, sub-line, status strip
   * and a "Go to Learning Path" button, directly under a block that already has
   * all four.
   */
  it('is gone from the page', () => {
    renderShell('/dashboard-rebrand')
    expect(screen.queryByRole('region', { name: /learning path progress/i })).toBeNull()
  })

  it('and the NOTE that replaced it is a comment, not page copy', () => {
    // It shipped as a bare `/* … */` inside JSX rather than `{/* … */}`, which
    // makes it a TEXT NODE: twenty-eight lines of removal rationale rendered on
    // Home, on every version. tsc was clean and every test passed — a block
    // comment in child position is valid JSX text.
    //
    // Asserted across the whole overview rather than on this one note, because
    // the mistake is invisible in review and one keystroke away anywhere.
    for (const url of [
      '/dashboard-rebrand',
      '/dashboard-rebrand?version=discoverability-learner-focused',
      '/dashboard-rebrand?version=discoverability-marketing-focused',
    ]) {
      const { container, unmount } = renderShell(url)
      expect(container.textContent, url).not.toMatch(/\/\*|\*\//)
      unmount()
    }
  })

  it('leaves exactly ONE of each fact it used to duplicate', () => {
    // The reason it went. Asserted by count, because the failure was
    // duplication rather than absence.
    renderShell('/dashboard-rebrand')
    expect(screen.getAllByText(/New York Life and Health Pre-licensing/i)).toHaveLength(1)
    expect(screen.getAllByText(/On Track/)).toHaveLength(1)
    // "Time Remaining" used to be the third fact checked here. It is not on the
    // page at all now — it left with the KPI cells on 2026-09-17, and the
    // countdown is stated only by the course header band. See
    // "the page states its countdown ONLY via the header band" below, which is
    // what pins that dependency.
    expect(screen.queryAllByText('Time Remaining')).toHaveLength(0)
  })

  it('no longer renders the panel body outside the Sheet at all', () => {
    // `embedded` and `hideSummary` went with the section — two props with no
    // caller are two things to keep working for nothing. The Sheet is the only
    // host again, so the body's Close affordance is unconditional.
    const src = readFileSync('src/components/learning/LearningPathDetailPanel.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(src).not.toMatch(/\bembedded\b/)
    expect(src).not.toMatch(/\bhideSummary\b/)
  })

  it('kept the course lists reachable — as the Study Journey', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // The lists are not lost, they are the journey. Asserted so "restore the
    // section to get the lists back" is visibly the wrong fix.
    renderShell('/dashboard-rebrand')
    const list = screen.getByRole('list', { name: /study journey stops/i })
    // ONE row for the course, not a split: the 42 lessons ARE the pre-licensing
    // course and it is the journey's first part. Under hours a big category
    // halved into "· Part 1 / · Part 2"; lessons do not split.
    expect(list.textContent).toMatch(/Pre-licensing Course/)
    expect(list.textContent).not.toMatch(/· Part \d|· Day \d/)
    // The course row carries its own progress, the way the card does. With ONE
    // counted stop nothing reads "Completed" until the whole course is, which
    // is why the count is what this asserts on.
    expect(list.textContent).toMatch(/\d+ \/ 42 lessons/)
  })
})

describe('the Study Journey replaces Today\'s Tasks', () => {
  it('renders the journey and not the day view', () => {
    renderShell('/dashboard-rebrand')
    expect(screen.getByText(STUDY_JOURNEY_EYEBROW)).toBeInTheDocument()
    // Today's Tasks answers "what is due"; the Study Plan rail item and the
    // week strip already answer that twice. Asserted as an absence so bringing
    // it back alongside the journey is a deliberate act.
    expect(screen.queryByText(/Today's tasks/i)).toBeNull()
  })

  it('derives its stops from the path categories, in order', () => {
    // Asserted at the FUNCTION, not through the DOM. The degrade that matters
    // is a milestone silently reading as a lesson, and a `queryByText` on the
    // title passes either way — the same reason the Links panel tests its type
    // degrade at the store.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    /*
     * THE PRE-LICENSING COURSE IS THE FIRST PART, and the only counted one.
     *
     * 42 lessons, from the LMS course card. Parts 2 and 3 follow it as steps
     * with NO count, because the storefront states none for them — inventing
     * one to keep the gauge multi-segment is the move the hour figures taught
     * us not to make. They are still ON the journey, because leaving them off
     * would say the programme ends with the coursework, which the product page
     * explicitly warns against.
     */
    expect(stops.map((s) => s.title)).toEqual([
      'Pre-licensing Course',
      'Prep Review Course',
      'Exam Simulators',
      // ONE completion stop, from XCEL's published certificate-eligibility
      // rules — two acts, one moment.
      'Attestation & Certificate',
    ])
    // Exactly one counted stop, and it carries the whole requirement.
    const counted = stops.filter((s) => s.hours != null)
    expect(counted).toHaveLength(1)
    expect(counted[0].hours).toBe(NY_LH_PRELICENSING_LESSONS)
    // Assessments are milestones; coursework is not.
    expect(stops.filter((s) => s.milestone).map((s) => s.title)).toEqual(['Exam Simulators'])
  })

  it('reads the first stop the way the course card does', () => {
    // "26 / 42 lessons", not a bare "42 lessons" — the denominator alone is not
    // progress, and the card this is modelled on says "0 of 42 lessons
    // completed".
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const [first] = journeyStopsFor(persona.path)
    expect(metaWords(first, persona.path.unitLabel!)).toMatch(
      new RegExp(`\\d+ / ${NY_LH_PRELICENSING_LESSONS} lessons`),
    )
  })

  it('blocks Parts 2 and 3 until the coursework is done', () => {
    // Not decoration: the product page states Parts 2 and 3 unlock "upon
    // completion of Part 1". "Not started" would invite a click that cannot
    // work — the same reason the completion tasks are blocked.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    expect(stops.find((s) => s.title === 'Prep Review Course')?.blocked).toBe(true)
    expect(stops.find((s) => s.title === 'Exam Simulators')?.blocked).toBe(true)
    // …and they say what they are, including the published targets.
    expect(stops.find((s) => s.title === 'Exam Simulators')?.group).toMatch(/3 simulators/)
  })

  it('states every stop\'s status in WORDS, not colour alone', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // `completed` and `not-started` carry no percentage, so without the words
    // they were distinguishable only by the node — same text, one filled circle
    // apart. The rule the Home week strip's DONE / IN PROGRESS flags follow.
    renderShell('/dashboard-rebrand')
    // Scoped to the journey's own rows — the ordered list — rather than a
    // guessed ancestor. `Completed` also appears in the Progress section below,
    // so an over-wide scope would pass without the words being on the STOPS.
    const list = screen.getByRole('list', { name: /study journey stops/i })
    // The counted stop says how far through it is, in the path's own unit and
    // the way the course card reads it.
    expect(list.textContent).toMatch(/In progress/)
    expect(list.textContent).toMatch(/\d+ \/ 42 lessons/)
    /* BLOCKED rows print no VISIBLE meta as of 2026-09-16 — every stop after
     * the current one is blocked, so all of their lines ended in the same four
     * words and the rail was a paragraph of repetition where the point was a
     * sequence.
     *
     * The note here used to say the reason stayed "available to the row's
     * `title`". It was not: there was no `title` attribute in the component,
     * and on 2026-09-17 the words were put into a visually-hidden span instead.
     * So this now checks the two halves separately — nothing VISIBLE, and the
     * words still THERE — because a plain `textContent` check cannot tell a
     * dropped line from a hidden one, and the whole point of the rule is that
     * the state is never carried by colour alone.
     */
    const hidden = Array.from(list.querySelectorAll<HTMLElement>('span')).filter(
      (el) => el.style.clipPath === 'inset(50%)',
    )
    const visible = Array.from(list.querySelectorAll<HTMLElement>('span'))
      .filter((el) => el.style.clipPath !== 'inset(50%)' && el.children.length === 0)
      .map((el) => el.textContent)
      .join(' ')
    expect(visible).not.toMatch(/After your coursework/)
    expect(hidden.map((el) => el.textContent).join(' ')).toMatch(/After your coursework/)
  })

  it('holds no dates — that is the Study Plan\'s job', () => {
    // The two answer different questions, and a journey with due dates is just
    // a worse calendar. Pinned so "add the due date" gets re-decided.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    for (const stop of journeyStopsFor(persona.path)) {
      expect(Object.keys(stop)).not.toContain('dueDate')
    }
  })
})

describe('the New York Life and Health demo course', () => {
  it('measures LESSONS of the pre-licensing course, from one owner', () => {
    // 42, from the LMS course card ("0 of 42 lessons completed"). NOT from the
    // storefront, which publishes 40 credit hours, three simulators and eight
    // "What You'll Learn" topics and no lesson count at all — a weaker footing
    // than a published figure, and a much stronger one than the hour splits it
    // replaces, which were authored here.
    const path = learningPathsFor('xcel').find((p) => p.id === XCEL_NY_PRODUCER_PATH_ID)!
    expect(NY_LH_PRELICENSING_LESSONS).toBe(42)
    expect(path.hours).toBe(NY_LH_PRELICENSING_LESSONS)
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.unitLabel).toBe('lessons')
    expect(persona.path.mandatory?.required).toBe(NY_LH_PRELICENSING_LESSONS)
  })

  it('counts PART 1 only, and invents nothing for the other two', () => {
    // One measured category. Parts 2 and 3 are journey steps with no count,
    // because the storefront states none — the gauge showing one segment is
    // honest, and the journey below it carries the programme's shape.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.categories?.map((c) => c.label)).toEqual(['Pre-licensing Course'])
    expect(persona.path.elective?.required).toBe(0)
  })

  it('keeps the 7-day study plan as a confirmed FACT, unused as a measure', () => {
    // XCEL's product page links it as "Read our recommended study plan", so it
    // is real and worth holding on to even though the dashboard no longer
    // counts in days. The file name says `lh_ca` and the NEW YORK page links
    // it, so it is XCEL's Life & Health plan rather than another state's.
    expect(NY_LH_STUDY_PLAN_DAYS).toBe(7)
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/lh_ca_7days\.pdf/)
  })

  it('records the recovered chapter list as INCOMPLETE, and renders none of it', () => {
    // Decoded from the guide via its ToUnicode maps; it comes back with no
    // health chapters at all, which a Life AND Health course must have. So it
    // is kept for the next person and deliberately not rendered — padding it
    // would be authoring a curriculum XCEL does not publish.
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/NY_LH_GUIDE_CHAPTERS_PARTIAL/)
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).not.toMatch(/Nature of Insurance|Annunities/)
  })

  it('leads the path list, so the QE surfaces resolve to it', () => {
    expect(learningPathsFor('xcel')[0].id).toBe(XCEL_NY_PRODUCER_PATH_ID)
  })

  it('states CONFIRMED exam facts, sourced from the requirements page', () => {
    // Confirmed against XCEL's published requirements page — and CORRECTED
    // once. The persona holds the COMBINED Life, Accident & Health line (the
    // 40-hour one), which sits 150 scored questions in 150 minutes. It shipped
    // as 100 / 2 hours, which is the SINGLE-line figure: the first fetch
    // summarised the page's per-line table as "100 (Life/Health) or 150
    // (Personal Lines/P&C)", backwards. Pinned as values because getting them
    // wrong is the failure, and it has happened twice.
    const ny = examFactsFor('NY')
    expect(ny.invented).toBe(false)
    expect(ny.questions).toMatch(/150/)
    expect(ny.timeAllowed).toMatch(/150 minutes/)
    expect(ny.passMark).toBe(70)
    expect(ny.where).toMatch(/PSI/)
    expect(examFactsFor('FL').invented).toBe(false)
  })

  it('keeps XCEL\'s own product hours flagged, because the page states none', () => {
    // The distinction the fixture exists to hold: the 40-hour STATE requirement
    // is published, the prep-product hours are not. Asserted via the const's
    // name, which still carries `_INVENTED` on purpose — renaming it would
    // quietly upgrade the confidence of three figures that are still guesses.
    // Still 40, and still the figure the requirements sheet states — it is a
    // real regulatory number and it did NOT become a day count. The other
    // three hour fields are the invented product hours the days replaced; they
    // no longer reach any QE surface.
    expect(NY_PRODUCER_HOURS_INVENTED.preLicenseEducation).toBe(40)
  })

  it('keeps the exam facts per STATE, so Readiness cannot contradict Home', () => {
    // `EXAM_FACTS` was a hardcoded Florida 2-15 block — correct while Florida
    // was the only licence, and a flat contradiction the moment Home could say
    // New York, two rail items away.
    expect(examFactsFor('NY').exam).toMatch(/New York/i)
    expect(examFactsFor('FL').exam).toMatch(/Florida/i)
    // An unknown state degrades to Florida rather than an empty facts table.
    expect(examFactsFor('ZZ').state).toBe('FL')
    expect(examFactsFor(undefined).state).toBe('FL')
  })

  it('does NOT move the Continuing Ed persona off Florida', () => {
    // Scoped change: the QE journey demos New York; CE is a different education
    // type and still demos the Florida renewal cycle. A version switch must not
    // silently switch jurisdiction.
    const ce = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce')!
    expect(ce.path.state).toBe('FL')
  })
})

describe('the journey reads SEQUENTIALLY, in every progress state', () => {
  /**
   * `personaFor` used to scale each category independently —
   * `completed = required × ratio` — which made a learner 63% through their
   * pre-licensing coursework AND 63% through the exam simulators AND 63%
   * through the exam cram, all at once.
   *
   * The category bars survived that as decoration. The Study Journey did not:
   * a SEQUENCE whose every stop reads "In progress" answers nothing about what
   * to do next, which is the one question a journey is for.
   *
   * Swept across every progress variant rather than asserted on today's
   * default, for the reason `ProgressAgreement` gives: a surface that only
   * holds at the default passes until a reviewer moves the dropdown, which is
   * the first thing a reviewer does.
   */
  const VARIANTS = DASHBOARD_PROGRESS_PICKER.map((o) => o.variant)

  it('fills categories in curriculum order, never in parallel', () => {
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const cats = persona.path.categories!
      // Once a category is not FULL, nothing after it may have started.
      const firstUnfinished = cats.findIndex((c) => c.completed < c.required)
      if (firstUnfinished === -1) continue // everything done
      for (const later of cats.slice(firstUnfinished + 1)) {
        expect(later.completed, `${variant} · ${later.label}`).toBe(0)
      }
    }
  })

  it('never shows a started stop after a not-started one', () => {
    // The same rule at the surface the change was made for. Stated as
    // monotonicity rather than as expected values, so it keeps holding when the
    // ratios or the hour figures move.
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const stops = journeyStopsFor(persona.path)
      const firstNotStarted = stops.findIndex((s) => s.status === 'not-started')
      if (firstNotStarted === -1) continue
      for (const later of stops.slice(firstNotStarted + 1)) {
        expect(later.status, `${variant} · ${later.title}`).toBe('not-started')
      }
    }
  })

  it('has at most ONE stop in progress', () => {
    // The symptom that started this: four of five stops in progress at once.
    // A curriculum worked in order has one active piece.
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const inProgress = journeyStopsFor(persona.path).filter((s) => s.status === 'in-progress')
      expect(inProgress.length, variant).toBeLessThanOrEqual(1)
    }
  })

  it('allocates the RATIO, and the reported percentage follows the unit', () => {
    /*
     * The waterfall still fills in order and still takes `round(total × ratio)`
     * of the whole. What changed on 2026-09-16 is the unit: 7 days rather than
     * 56 hours.
     *
     * So On Track no longer reports 63%. `round(7 × 0.63)` is 4, and 4/7 is
     * **57%** — a day is atomic, so the reachable percentages are 0, 14, 29,
     * 43, 57, 71, 86, 100 and 63 is not among them. That is a property of
     * measuring in days, not a rounding bug, and it is asserted as the
     * relationship rather than as a literal so the next unit change does not
     * need a new number here.
     *
     * KNOWN, and visible on screen: the Progress dropdown's own label still
     * says "~63%". CLAUDE.md already records that the label is an
     * approximation and the gauge is exact — this widens that gap from a
     * fraction of a point to six.
     */
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const cats = persona.path.categories!
    const totalRequired = cats.reduce((sum, c) => sum + c.required, 0)
    const totalCompleted = cats.reduce((sum, c) => sum + c.completed, 0)
    expect(totalRequired).toBe(NY_LH_PRELICENSING_LESSONS)
    expect(totalCompleted).toBe(Math.round(totalRequired * 0.63))
    expect(displayedProgressPct(persona.path)).toBe(
      Math.round((totalCompleted / totalRequired) * 100),
    )
  })

  it('keeps Mandatory / Elective agreeing with the categories', () => {
    // Two rules over one set of hours is two answers. Under the waterfall the
    // old `mandatoryReq × ratio` would have said 25/40 while the categories
    // said 35/40 — and BOTH are on screen (the Progress section reads
    // categories, the Learner Focused band's legend reads these two).
    for (const variant of VARIANTS) {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const cats = persona.path.categories!
      const catTotal = cats.reduce((sum, c) => sum + c.completed, 0)
      const segTotal =
        (persona.path.mandatory?.completed ?? 0) + (persona.path.elective?.completed ?? 0)
      expect(segTotal, variant).toBe(catTotal)
    }
  })
})

describe('the two completion tasks on the journey', () => {
  it('come last, carry no hours, and are blocked until the coursework is done', () => {
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    const tasks = stops.filter((s) => s.group === 'Course completion')
    // ONE stop as of 2026-09-16. They are still two ACTS in XCEL's published
    // certificate-eligibility rules and nothing about that changed; they are
    // one MOMENT on this rail — done back to back, unlocking together, neither
    // ever true without the other.
    expect(tasks.map((t) => t.title)).toEqual(['Attestation & Certificate'])
    // It is LAST.
    expect(stops.slice(-1)).toEqual(tasks)
    // NO COUNT. A lesson figure on "print your certificate" makes it look like
    // coursework and would land in the gauge's denominator — which is the
    // course's 42 lessons and must not grow.
    for (const t of tasks) expect(t.hours).toBeNull()
    // Blocked while any coursework is outstanding. The words still say WHY
    // rather than "Not started" — they are just no longer RENDERED on a blocked
    // row (see the rail's note); the state itself is unchanged, which is what
    // keeps the reason available to the row's `title` and to a future variant
    // that wants it back on screen.
    for (const t of tasks) expect(t.blocked).toBe(true)
    expect(statusWords(tasks[0])).toBe('After your coursework')
  })

  it('unblocks only when every hour of coursework is complete', () => {
    const done = dashboardProgressPersonaFor('xcel', 'complete-100', 'qe')!
    const tasks = journeyStopsFor(done.path).filter((s) => s.group === 'Course completion')
    for (const t of tasks) expect(t.blocked).toBe(false)
    expect(statusWords(tasks[0])).toBe('Not started')
  })

  it('never claims they are complete — nothing records them yet', () => {
    // The demo has no attestation or certificate feed. Asserted so a later
    // "mark them done so the demo looks finished" needs a real source.
    for (const opt of DASHBOARD_PROGRESS_PICKER) {
      const persona = dashboardProgressPersonaFor('xcel', opt.variant, 'qe')!
      const tasks = journeyStopsFor(persona.path).filter((s) => s.group === 'Course completion')
      for (const t of tasks) expect(t.status, opt.variant).not.toBe('completed')
    }
  })

  it('does not grow the requirement', () => {
    // The gauge's denominator is the study plan's 7 days. The two completion
    // tasks are steps rather than coursework, so adding them to the journey
    // must not move it — that is why they carry no unit count at all.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const totalRequired = persona.path.categories!.reduce((sum, c) => sum + c.required, 0)
    expect(totalRequired).toBe(NY_LH_PRELICENSING_LESSONS)
    const counted = journeyStopsFor(persona.path).filter((st) => st.hours != null)
    expect(counted.reduce((sum, st) => sum + (st.hours ?? 0), 0)).toBe(totalRequired)
  })
})

describe('nothing on the page says "1 days"', () => {
  it('pluralises every count, through one shared helper', () => {
    // `hrs` is unit-invariant, so nothing here had ever needed to pluralise a
    // count. The moment one path measured DAYS, four surfaces printed "1 days"
    // — the category bars, the band KPI cell, the journey rows and the detail
    // sheet. Fixing them one at a time is how three get fixed.
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).not.toMatch(/\b1 (days|lessons|hrs)\b/)
    // …and it IS printing counts, so this is not passing because nothing says a
    // unit at all.
    expect(container.textContent).toMatch(/\b42 lessons\b/)
    // One owner, so a fifth surface gets it for free.
    for (const f of [
      'src/components/learning/progressGauge.tsx',
      'src/components/learning/studyJourneyUtil.ts',
      'src/components/membership/v5/LearnerFocusedBand.tsx',
    ]) {
      expect(readFileSync(f, 'utf8'), f).toMatch(/unitCount/)
    }
  })
})

describe('the Get Licensed section', () => {
  it('ledes with what happens NEXT, not who owns it', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // It read "After your certificate — these three are handled by the state",
    // which led with the owner — a fact each step's own meta already carries
    // (PSI, PSI, NY Dept. of Financial Services) — and made the section sound
    // like a disclaimer. A learner at the end of their coursework wants the
    // next step.
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).toMatch(/Once your course is completed, here are the next steps/)
    expect(container.textContent).not.toMatch(/handled by the state/)
  })

  it('renders the three state-owned steps after the journey', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    renderShell('/dashboard-rebrand')
    expect(screen.getByText('Get Licensed')).toBeInTheDocument()
    for (const step of GET_LICENSED_STEPS) {
      expect(screen.getByText(step.title)).toBeInTheDocument()
    }
  })

  it('carries NO completion state, because XCEL cannot observe these', () => {
    // The load-bearing decision. PSI schedules and scores the sitting; DFS
    // issues the licence. A tick against "Pass State Exam" would be the product
    // claiming an outcome it has no feed for. The absence is the honest part —
    // pinned so adding a status needs a real feed behind it.
    for (const step of GET_LICENSED_STEPS) {
      expect(step).not.toHaveProperty('status')
      expect(step).not.toHaveProperty('completed')
      expect(step.owner).not.toMatch(/XCEL/i)
    }
  })

  it('links only where there is a confirmed destination', () => {
    // One step has a real URL — PSI's New York registration page, stated on
    // XCEL's requirements page. The other two have none, and an invented href
    // is the defect the Resources section shipped four of.
    const withHref = GET_LICENSED_STEPS.filter((s) => s.href)
    expect(withHref).toHaveLength(1)
    expect(withHref[0].href).toMatch(/^https:\/\/test-takers\.psiexams\.com\//)
    /* THE ROW IS NO LONGER THAT LINK — 2026-09-17. It was an `<a>` straight to
       PSI; the row opens the step's own sheet now, and the PSI URL is inside
       it, alongside the system check and the retake policy that a learner wants
       BEFORE starting a registration flow.
       
       So the assertion moves to where the link lives: the sheet. What it still
       pins is unchanged — one confirmed destination, opening in a new tab, and
       no invented href anywhere. */
    const { container } = renderShell('/dashboard-rebrand')
    fireEvent.click(
      within(container).getByRole('button', { name: new RegExp(withHref[0].title, 'i') }),
    )
    const link = within(screen.getByRole('dialog')).getByRole('link', {
      name: new RegExp(withHref[0].href!.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
    })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('agrees with the exam facts on the Readiness page', () => {
    // "100 questions in 2 hours. 70% to pass." sits on Home; the Readiness
    // page's facts table says the same thing one rail item away. Two literals
    // for one sitting is how they drift.
    const pass = GET_LICENSED_STEPS.find((s) => s.id === 'pass-exam')!
    const facts = examFactsFor('NY')
    // Matched on the NUMBERS rather than the phrasing — the two surfaces word
    // them differently ("150 scored questions" vs "150 questions") and should
    // be free to, but they must not disagree on the figures.
    const count = facts.questions.match(/\d+/)![0]
    const minutes = facts.timeAllowed.match(/\d+/)![0]
    expect(pass.detail).toContain(count)
    expect(pass.detail).toContain(minutes)
    expect(pass.detail).toContain(`${facts.passMark}%`)
  })
})

describe('the Study Journey widget is its own block', () => {
  it('sits on the page — no white card, no stroke, no shadow', () => {
    // 2026-09-16. It was a raised white card inherited from the outer section,
    // back when this was the right half of a joined band. The shadow went with
    // the fill and the border because the three are ONE treatment: a shadow
    // under a surface with neither fill nor edge reads as a card that failed to
    // paint, not as less card.
    const { container } = renderShell('/dashboard-rebrand')
    const journey = container.querySelector<HTMLElement>('[aria-label="Study journey"]')!
    expect(journey.style.background).toBe('')
    expect(journey.style.border).toBe('')
    expect(journey.style.boxShadow).toBe('')
    // The horizontal padding went too — a bare block lines up with its column
    // rather than staying inset by a gutter belonging to a card it no longer
    // has, the same move the Current Learning Progress block made.
    expect(journey.style.padding).toBe('4px 0px 0px')
    // The rule between the journey and Get Licensed is NOT card chrome and
    // stays: it divides this block's own two halves.
    const styles = readFileSync('src/components/learning/widgetStyles.ts', 'utf8')
    expect(styles).toMatch(/export const widgetRuleStyle/)
  })

  it('splits from the navy half — two surfaces, not one joined band', () => {
    // The band's two halves were grid siblings sharing one radius, one shadow
    // and one `overflow: hidden`. Once QE Focused slimmed the navy side and
    // grew this one, the shared ROW HEIGHT left the navy half stretched with a
    // large empty area below its content.
    //
    // Asserted on the section's own style rather than on a screenshot: the
    // load-bearing part is `align-items: start`, because without it the grid
    // still equalises the row and the split is cosmetic — the joined band with
    // a gap. jsdom has no layout, so the heights cannot be compared here; the
    // declaration is what makes them independent.
    // Selected by CLASS, not by role+name: `MembershipOverview` wraps the band
    // in its own `<section aria-label="Your learning">` and the band carries the
    // same label, so the accessible query finds two. (That duplication predates
    // this change and is worth fixing separately.)
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.alignItems).toBe('start')
    // 40, the same gap `MembershipOverview` uses between its own sections, so
    // the space between two independent cards is the page's own rhythm. It was
    // 20 — inherited from when these were two halves of ONE card, where the gap
    // stood in for the seam.
    expect(band.style.gap).toBe('40px')
    // The joined treatment is GONE from the section and lives on each child.
    expect(band.style.borderRadius).toBe('')
    expect(band.style.overflow).toBe('')
  })

  it('keeps the JOINED band on the other versions', () => {
    // The split is scoped to QE Focused. Learner Focused and Marketing Focused
    // are two halves of one statement at roughly one height, which is what the
    // joined treatment is for.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.overflow).toBe('hidden')
    expect(band.style.borderRadius).toBe('var(--radius-lg)')
    expect(band.style.alignItems).toBe('')
  })

  it('renders the resume block, journey and Get Licensed in one card', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // All three are the widget's, so they move together. Their ORDER is the
    // point — resume first ("continue where you left off" is still the first
    // thing offered), then where you are, then what the state needs.
    renderShell('/dashboard-rebrand')
    expect(screen.getByRole('button', { name: /^resume\b/i })).toBeInTheDocument()
    expect(screen.getByText(STUDY_JOURNEY_EYEBROW)).toBeInTheDocument()
    expect(screen.getByText('Get Licensed')).toBeInTheDocument()
  })

  it('does not resolve the resume course itself', () => {
    // `StudyJourneyWidget` takes the course as a prop. The band picks it from
    // the persona, and two components resolving "the course to resume" is how
    // they end up disagreeing — the fork `displayedProgressPct` was extracted
    // to close. Asserted at the source: the widget has no fixture import.
    // Scanned with comments stripped — the file's own doc comment SAYS it has
    // no `useCourseLauncher`, which a naive grep matches.
    const src = readFileSync('src/components/learning/StudyJourneyWidget.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(src).not.toMatch(/myCoursesFor|useCourseLauncher|dashboardProgressPersonaFor/)
  })
})

describe('the category palette on a dark card', () => {
  it('uses LIGHT stops, because two of the default slots are invisible on navy', () => {
    // `CATEGORY_PALETTE` is built for the white detail panel. On the navy card
    // slot 0 (`--color-category-mandatory`, the Brick-era brand navy) measured
    // 1.11:1 against the bar track — and slot 0 is the FIRST category, so on
    // the New York journey the one bar carrying all the progress read as empty.
    // Slot 3 (`--color-cta-500`) measured 1.03:1.
    //
    // Same rule as `.cre-alert-action` and the desktop prototype's
    // `--rail-accent`: a dark brand colour is a fill on white and needs a light
    // stop on a dark ground.
    expect(categoryColorFor(0)).toBe('var(--color-category-mandatory)')
    expect(categoryColorFor(0, true)).toBe('var(--color-primary-300)')
    expect(categoryColorFor(3)).toBe('var(--color-cta-500)')
    expect(categoryColorFor(3, true)).toBe('var(--color-cta-300)')
    // Slot 1 is already a light amber, which is why the two-category case never
    // showed the problem and why this went unnoticed.
    expect(categoryColorFor(1, true)).toBe(categoryColorFor(1))
  })

  it('has an on-dark stop for every slot', () => {
    // A short on-dark palette would wrap and silently reuse a hue, which is
    // worse than a dark one: two categories would share a colour.
    expect(CATEGORY_PALETTE_ON_DARK).toHaveLength(CATEGORY_PALETTE.length)
    expect(new Set(CATEGORY_PALETTE_ON_DARK).size).toBe(CATEGORY_PALETTE_ON_DARK.length)
  })

  it('leaves the light detail sheet on the default palette', () => {
    // The sheet opens from surfaces with no navy card beside it, so it keeps
    // the full summary AND the palette built for white.
    expect(categoryColorFor(0, false)).toBe('var(--color-category-mandatory)')
  })
})

describe('View Requirements shows the requirements and nothing else', () => {
  it('opens with no tab bar and no Progress half', async () => {
    renderShell('/dashboard-rebrand')
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    // No way back to Progress — the page behind this sheet already shows all of
    // it (the navy card's gauge and tiles, the section's course lists), so a tab
    // would be a second door onto what the reviewer was just looking at.
    expect(within(sheet).queryByRole('button', { name: /^Progress$/ })).toBeNull()
    expect(within(sheet).queryByRole('button', { name: /^Requirements$/ })).toBeNull()
    // And the Progress half's own content is absent, not merely unselected.
    expect(sheet.querySelector('svg[role="img"]')).toBeNull()
    expect(sheet.textContent).not.toMatch(/credit hrs/)
  })

  it('carries no "Go to Learning Path" CTA', async () => {
    // Removed 2026-09-16. The page behind this sheet already offers "Open
    // learning path" on the Study Journey widget, so the button was a second
    // door onto one route — and a requirements sheet's job is to state the
    // requirements, not to navigate out of them.
    renderShell('/dashboard-rebrand')
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).queryByRole('button', { name: /go to learning path/i })).toBeNull()
  })

  it('keeps the CTA on the TABBED sheet, including its Requirements tab', async () => {
    // Gated on the `view` prop, not on which half is showing. The tabbed sheet
    // is the only door to either half for its three callers, and the CTA is
    // documented as persistent across both tabs — so switching tab there must
    // not make it vanish.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getAllByRole('button', { name: /view requirements/i })[0])
    const sheet = await screen.findByRole('dialog')
    expect(within(sheet).getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
    fireEvent.click(within(sheet).getByRole('button', { name: /^Requirements$/ }))
    expect(within(sheet).getByRole('button', { name: /go to learning path/i })).toBeInTheDocument()
  })

  it('states the requirements from XCEL\'s published page', async () => {
    renderShell('/dashboard-rebrand')
    fireEvent.click(screen.getByRole('button', { name: /state requirements/i }))
    const sheet = await screen.findByRole('dialog')
    const text = sheet.textContent ?? ''
    // The load-bearing rules, quoted close to the source.
    expect(text).toMatch(/Department of Financial Services/i)
    expect(text).toMatch(/forced.progression/i)
    expect(text).toMatch(/70%/)
    expect(text).toMatch(/PSI/)
    expect(text).toMatch(/student attestation/i)
    expect(text).toMatch(/valid for a lifetime/i)
    // Hours PER LINE OF AUTHORITY, since the state sets them that way and the
    // demo covers one of five.
    for (const hours of ['40 hours', '20 hours', '90 hours']) {
      expect(text, hours).toContain(hours)
    }
  })

  it('reports the STATE\'s 40 hours, not the path\'s 56', () => {
    // The requirements box is about the BOARD's requirement. XCEL's programme
    // adds 16 hours of its own prep on top, and the difference is stated in the
    // list rather than left for a reader to notice two numbers disagree.
    const reqs = pathRequirementsFor('xcel', XCEL_NY_PRODUCER_PATH_ID)!
    expect(reqs.totalHours).toBe(NY_PRODUCER_HOURS_INVENTED.preLicenseEducation)
    expect(reqs.totalHours).not.toBe(NY_LH_PRELICENSING_LESSONS)
    expect(reqs.items.join(' ')).toMatch(/16 hours of its own prep/i)
  })

  it('states no renewal cycle or elective split for a pre-licensing path', () => {
    // The type was shaped for CE renewal. A candidate has nothing to renew and
    // the state names one hour figure per line — a `0` in those slots would
    // render as a stated requirement of zero rather than as not-applicable.
    const reqs = pathRequirementsFor('xcel', XCEL_NY_PRODUCER_PATH_ID)!
    expect(reqs.renewalCycleYears).toBe(0)
    expect(reqs.mandatoryHours).toBeUndefined()
    expect(reqs.electiveHours).toBeUndefined()
  })

  it('keeps the TABBED sheet for the other consumers', () => {
    // `LearningPathsHome` and the classic dashboard reach both halves through
    // this sheet and have no page beside it, so the tab bar stays their default.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getByRole('button', { name: /view requirements/i }))
    expect(screen.getByRole('button', { name: /^Progress$/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Requirements$/ })).toBeInTheDocument()
  })
})

describe('the Current Learning Progress block sits on the page, not a navy card', () => {
  it('drops the card entirely', () => {
    // No background, no shadow, no radius — the content is on the shell's grey.
    const { container } = renderShell('/dashboard-rebrand')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.style.background).toBe('transparent')
    expect(half.style.boxShadow).toBe('')
    expect(half.style.borderRadius).toBe('')
    // The left/right padding goes with the card: a bare block lines up with the
    // section headings below rather than staying inset by a gutter it no
    // longer has.
    expect(half.style.padding).toBe('4px 0px 0px')
  })

  it('keeps the navy card on the other versions', () => {
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.style.background).toBe('var(--color-primary-700)')
  })

  it('asks whether the GROUND is dark, not whether the surface is the navy card', () => {
    // The navy card is dark in both themes; the page is not — the shell's
    // `--color-surface-page` is #f5f5f5 light and #1b1d21 dark. `onDark` is a
    // boolean computed in JS, so keying it to the SURFACE would hand the light
    // category palette to a dark ground and reintroduce the 1.11:1 slot-0
    // failure the on-dark palette exists to fix, just in the other theme.
    //
    // Asserted through the palette helper, which is where the consequence lands.
    expect(categoryColorFor(0, true)).not.toBe(categoryColorFor(0, false))
  })

  it('colours its text CTA with a CLASS, not inline', () => {
    /* The CTA ramp is a FILL colour on XCEL; cta-500 as TEXT measures 1.84:1 on
       the dark page. `.cre-cta-ink` swaps to the light stop under
       `[data-theme='dark']` — and an inline `color` would beat it, which is the
       trap the PSI link in the Study Journey hit. So there must be no inline
       colour on the button.

       This read "View Requirements" until 2026-09-17, when that link came off
       the PAGE surface. The rule it pins is about the CLASS, not that link, so
       it moves to the text CTA that is still here — "State requirements →" at
       the foot of Get Licensed, which opens the same sheet. */
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const link = Array.from(band.querySelectorAll('button')).find((b) =>
      /State requirements/i.test(b.textContent ?? ''),
    )!
    expect(link).toBeTruthy()
    expect(link.className).toContain('cre-cta-ink')
    expect(link.style.color).toBe('')
    // …and the removed link really is gone from this surface, with the sheet
    // still reachable — the pair that makes the removal safe rather than a
    // dead end.
    expect(band.textContent).not.toMatch(/View Requirements/)
  })

  it('darkens the BAR track, because the light default is invisible here', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // `--color-neutral-100` measures 1.08:1 against #f5f5f5 and
    // `--color-neutral-200` 1.29:1 — an empty track would not be visible at
    // all, so 0% reads as a missing gauge rather than an empty one.
    // `--color-neutral-300` is 1.55:1: a groove. The value is also stated in
    // text, so nothing rides on the track alone.
    //
    // It has moved with the thing that carries the number: category bar →
    // donut → the header progress bar that replaced the donut. The VALUE is the
    // same one throughout and still has to clear the page grey, which is why
    // `ProgressBar` needed a `track` override at all.
    const { container } = renderShell('/dashboard-rebrand')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const tracks = Array.from(half.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )
    expect(tracks.length).toBeGreaterThan(0)
  })
})

describe('XCEL has no learning-path concept on this version', () => {
  /*
   * Removed 2026-09-16. The band IS the programme — there is no separate path
   * object to open — so every door onto the `learning-path` section is closed
   * on QE Focused. One withheld prop (`onOpenLearningPath`) closes both.
   *
   * This REPLACES an assertion added earlier the same day that "Open learning
   * path" was still on the page, which existed to stop the requirements-sheet
   * CTA removal becoming "no way to reach the learning path". That is now the
   * intended state, so the guard is inverted rather than dropped: the concept
   * must be absent, and the requirements sheet must be what the page offers
   * instead.
   */
  it('renders no "Open learning path" link on the Study Journey', () => {
    renderShell('/dashboard-rebrand')
    expect(screen.queryByRole('button', { name: /open learning path/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /learning path/i })).toBeNull()
  })

  it('leaves the path TITLE clickable, opening the requirements sheet', async () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // The title carried the same handler AND a `title="Open learning path"`
    // tooltip — the worse of the two doors, because an invisible link is found
    // by accident. It falls back to `onViewDetails`, so it still does something
    // and what it does now exists.
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    expect(title.getAttribute('title')).toBeNull()
    fireEvent.click(title)
    const sheet = await screen.findByRole('dialog')
    expect(sheet.textContent).toMatch(/what the state requires/i)
  })

  it('sends a course-less journey stop to the requirements sheet, not the path', () => {
    // The stops are SYNTHESIZED (not catalogue course ids), so the in-shell
    // launcher is best-effort and there has to be a fallback — a launcher
    // opening nothing is the one outcome worse than a second-best destination.
    // It used to be the Learning Path; on QE Focused it is the requirements
    // sheet, which is what this programme actually is.
    //
    // Asserted at SOURCE because the branch is unreachable from this render:
    // the launcher IS available here, so clicking a stop opens it and the
    // fallback never runs. A DOM test would pass without exercising the line.
    const src = readFileSync('src/components/membership/v5/MembershipOverview.tsx', 'utf8')
    const fn = src.slice(
      src.indexOf('const openJourneyStop'),
      src.indexOf('const learningCards'),
    )
    expect(fn).toMatch(/qeFocused\) setDetailOpen\(true\)/)
    // The learning-path fallback survives for the versions that still have one,
    // and must come AFTER the QE branch or it would win.
    expect(fn.indexOf('qeFocused')).toBeLessThan(fn.indexOf('onOpenLearningPath'))
  })

  it('KEEPS the concept on the other versions', () => {
    // Withheld by QE Focused, not deleted from the band — Learner Focused still
    // hands the prop through, so the journey link and the title's handler are
    // unchanged there. Asserted via the tabbed sheet's own CTA, which is the
    // door that version actually shows.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    fireEvent.click(screen.getAllByRole('button', { name: /view requirements/i })[0])
    return screen.findByRole('dialog').then((sheet) => {
      expect(
        within(sheet).getByRole('button', { name: /go to learning path/i }),
      ).toBeInTheDocument()
    })
  })
})

describe('every rail row is a hoverable, clickable target', () => {
  /*
   * 2026-09-16. Get Licensed was static text with ONE link on the first step's
   * title, so three rows describing three actions looked like three paragraphs
   * and the single affordance was a differently-coloured word. They now match
   * the journey rows above: whole-row target, hover wash, chevron.
   */
  it('gives every Get Licensed step a row target and a chevron', () => {
    const { container } = renderShell('/dashboard-rebrand')
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    const rows = Array.from(licensed.querySelectorAll('.cre-journey-stop'))
    expect(rows).toHaveLength(GET_LICENSED_STEPS.length)
    for (const row of rows) {
      // One target per row, never a link nested in a button: that is invalid,
      // and two nested targets on a 13px title is a coin flip for the learner.
      expect(row.querySelectorAll('a, button')).toHaveLength(0)
      expect(row.querySelector('svg')).toBeTruthy()
    }
    /* ALL THREE ARE BUTTONS as of 2026-09-17. The Schedule step was the one
       anchor, going straight to PSI; every step has its own published detail
       now, so every row opens a sheet and the outbound links live inside them.
       
       That is also what makes the three rows genuinely identical, which is what
       this test's own note asked for when they became whole-row targets: "three
       identical rows is the point." */
    expect(licensed.querySelectorAll('a.cre-journey-stop')).toHaveLength(0)
    expect(licensed.querySelectorAll('button.cre-journey-stop')).toHaveLength(
      GET_LICENSED_STEPS.length,
    )
  })

  it('opens the STEP’s own sheet from a step XCEL does not own', async () => {
    /* It opened the REQUIREMENTS sheet until 2026-09-17 — the only surface that
       described these three at all, and the note said plainly that it was not a
       per-step destination and did not pretend to be. Each step has its own
       published detail now, so each row opens that. */
    renderShell('/dashboard-rebrand')
    const step = GET_LICENSED_STEPS.find((s) => !s.href)!
    fireEvent.click(screen.getByRole('button', { name: new RegExp(step.title, 'i') }))
    const sheet = await screen.findByRole('dialog')
    expect(sheet.textContent).toMatch(new RegExp(step.title, 'i'))
    expect(sheet.textContent).toMatch(/Post-course process/)
    // Not the requirements sheet, which is about the licence as a whole.
    expect(sheet.textContent).not.toMatch(/what the state requires/i)
  })

  it('colours a SELECTABLE row’s title blue, and only a selectable one', () => {
    /*
     * 2026-09-17. The rows already had a background hover and a chevron, but
     * the title was plain body ink — so at rest a row that opens something and
     * a row that does not looked identical. Blue says it before the cursor
     * arrives.
     *
     * The BLOCKED journey stops must NOT get it: a link-coloured title on a
     * step the product will not let you take is the same broken promise as a
     * chevron on it, which those rows already refuse.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    const linked = Array.from(list.querySelectorAll('.cre-stop-title'))
    // Exactly the one stop that is reachable — the rest are blocked.
    expect(linked).toHaveLength(1)
    expect(linked[0].textContent).toMatch(/Pre-licensing Course/)
    // NO inline colour, or the class would match, compute and do nothing —
    // the trap `.cre-uxlinks-title` and the PSI link both hit.
    expect((linked[0] as HTMLElement).style.color).toBe('')
    // All three Get Licensed rows open a sheet, so all three are links.
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    expect(licensed.querySelectorAll('.cre-stop-title')).toHaveLength(
      GET_LICENSED_STEPS.length,
    )
  })

  it('darkens and underlines that title on hover — in BOTH directions', () => {
    /* Asserted against the stylesheet, because jsdom applies no hover.
     *
     * The dark rule is the interesting half: "darker" on an inverting palette
     * means the emphatic END of the ramp, which is `-700` on white and `-200`
     * on the dark ground. Using `-700` for both would make the dark hover
     * recede rather than advance. */
    const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\s+/g, ' ')
    expect(css).toMatch(/\.cre-stop-title \{ color: var\(--color-primary-500\); \}/)
    const hover = css.match(
      /\.cre-journey-stop:hover \.cre-stop-title,[^{]*\{([^}]*)\}/,
    )![1]
    expect(hover).toMatch(/--color-primary-700/)
    expect(hover).toMatch(/text-decoration: underline/)
    const dark = css.match(
      /\[data-theme='dark'\] \.cre-journey-stop:hover \.cre-stop-title,[^{]*\{([^}]*)\}/,
    )![1]
    expect(dark).toMatch(/--color-primary-200/)
    // …and the row's own background hover is still there, which was the third
    // thing asked for and the one that already worked.
    expect(css).toMatch(/\.cre-journey-stop:hover \{[^}]*--color-neutral-100/)
  })

  it('declares the hover in CSS — the class existed with no rule', () => {
    // `cre-journey-stop` was on the journey rows from the day they were built
    // and NOTHING in tokens.css matched it: a clickable row with a chevron and
    // no feedback. Same shape as `--color-border-strong`, which did not exist
    // either. Asserted against the stylesheet because that is where the gap
    // was — jsdom applies no hover.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-journey-stop:hover\s*\{[^}]*background/)
    expect(css).toMatch(/\.cre-journey-stop:focus-visible\s*\{[^}]*outline/)
    // The tint is the value the notification row already uses — two row hovers
    // differing by a few percent read as a bug.
    const hover = css.match(/\.cre-journey-stop:hover\s*\{([^}]*)\}/)![1]
    expect(hover).toMatch(/--color-neutral-100/)
  })

  it('leaves NO inline background to beat the hover rule', () => {
    // It was `background: 'transparent'` inline, which wins over a stylesheet
    // rule — so `:hover` would have needed `!important` to do anything, and
    // would have looked fine while doing nothing. The class owns both states.
    const { container } = renderShell('/dashboard-rebrand')
    const rows = Array.from(container.querySelectorAll<HTMLElement>('.cre-journey-stop'))
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) expect(row.style.background).toBe('')
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const hover = css.match(/\.cre-journey-stop:hover\s*\{([^}]*)\}/)![1]
    expect(hover).not.toMatch(/!important/)
  })

  it('drops the "How do I become exam ready?" disclosure', () => {
    // A collapsed paragraph explaining that the stops run in order, directly
    // above a rail whose stops run in order and say their status in words.
    // Readiness answers "am I exam ready" with a number one rail item away.
    renderShell('/dashboard-rebrand')
    expect(screen.queryByText(/how do i become exam ready/i)).toBeNull()
    expect(screen.queryByText(/you are exam ready when the coursework/i)).toBeNull()
  })
})

describe('the heading-font flag', () => {
  /** Seed the flag the way the panel persists it. */
  function seedVariant(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      // `seedClassic`'s base, with THIS flag as the variable — so the subject
      // is the font and not whichever treatment the other two default to.
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-heading-font': { enabled: true, variant } }),
    )
  }

  it('is in the catalog, scoped to the dashboard, and defaults to SERIF', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-heading-font')!
    expect(def).toBeTruthy()
    expect(def.page).toBe('dashboard-rebrand')
    // Variant-only: the choice IS the variant, so the enable toggle ships on.
    // "Off" would have to mean "sans", which the variant already says.
    expect(def.defaultEnabled).toBe(true)
    /* `serif` as of 2026-09-17 ("set this view as the default"). Worth keeping
       in view: the face is a SYSTEM STACK standing in for the style, not the
       Amasis MT on xcelsolutions.com — unlicensed to us and recorded in
       tokens.css as off-brand for XCEL. So the committed demo now ships a
       stand-in as its headline typeface, which the flag's own description still
       says out loud. */
    expect(def.defaultVariant).toBe('serif')
    expect(def.description).toMatch(/Amasis/)
    expect(def.variants?.map((v) => v.value)).toEqual(['sans', 'serif'])
  })

  it('is offered in the dashboard panel scope', () => {
    // A flag tagged to the page but missing from the scope is invisible on the
    // one route it governs — the trap `NavSectionFlags` documents.
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-heading-font')
  })

  it('adds the class AT THE DEFAULT, because serif is the default now', () => {
    const { container } = renderShell('/dashboard-rebrand')
    /* INVERTED 2026-09-17. It asserted the class was ABSENT at the default,
       which was the whole point while `sans` shipped — the brand face untouched
       unless a reviewer opted in. Serif is the default now, so the class is on
       the overview root out of the box, and what still needs pinning is the
       SCOPE: the rail, the header and the shell's own page title must stay on
       the brand face, which is what makes the two comparable side by side. */
    expect(container.querySelector('.cre-dash-serif-headings')).toBeTruthy()
    expect(document.querySelector('nav')?.closest('.cre-dash-serif-headings')).toBeFalsy()
  })

  it('re-points --font-heading on the overview root for `serif`', () => {
    seedVariant('serif')
    const { container } = renderShell('/dashboard-rebrand')
    const root = container.querySelector('.cre-dash-serif-headings')
    expect(root).toBeTruthy()
    // The band lives INSIDE it, which is what makes one declaration enough:
    // custom properties cascade, so an inline `font-family: var(--font-heading)`
    // resolves against the value the element inherits.
    expect(root).toContainElement(container.querySelector<HTMLElement>('.cre-learner-focused-band'))
  })

  it('leaves the rail, the header and the page title alone', () => {
    // The flag is about the PAGE's headings. A rail in one face beside a page
    // in another is the comparison a reviewer needs, so the class is on the
    // overview root rather than the shell.
    seedVariant('serif')
    const { container } = renderShell('/dashboard-rebrand')
    const root = container.querySelector<HTMLElement>('.cre-dash-serif-headings')!
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    expect(root).not.toContainElement(rail)
    const h1 = container.querySelector('h1')
    if (h1) expect(root).not.toContainElement(h1)
  })

  it('declares the swap as ONE token re-point, not a font literal', () => {
    // The convention: reference tokens, never a raw font-family. The class
    // re-points `--font-heading` at a token; the stack itself is declared once.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const rule = css.match(/\.cre-dash-serif-headings\s*\{([^}]*)\}/)![1]
    expect(rule).toMatch(/--font-heading:\s*var\(--font-heading-serif\)/)
    expect(rule).not.toMatch(/Georgia|serif;/)
    expect(css).toMatch(/--font-heading-serif:[^;]*serif;/)
  })

  it('says in its own description that the serif is a STAND-IN', () => {
    // The live site's serif headings are Amasis MT, which tokens.css records as
    // off-brand for XCEL ("Amasis appears nowhere in the guide. Do not
    // reproduce them.") and which is unlicensed to us either way. The caveat
    // belongs at the control, where the person flipping it will read it.
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-heading-font')!
    expect(def.description).toMatch(/Amasis/)
    // Wrapped across lines in the stylesheet, so match on the words rather
    // than the sentence.
    const css = readFileSync('src/styles/tokens.css', 'utf8').replace(/\s+/g, ' ')
    expect(css).toMatch(/Amasis appears nowhere in the guide/)
    expect(css).toMatch(/Do not reproduce them/)
  })
})

describe('the course header band flag', () => {
  function seedHeader(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-course-header': { enabled: true, variant } }),
    )
  }

  it('is ON by default now — the duplication it guarded against is gone', () => {
    // The block's own heading is already the course name a few lines below.
    // Saying it again, larger, as a page title is the QUESTION this variant
    // asks — whether the page reads as a course or as a dashboard — so it
    // cannot be the default answer.
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-course-header')!
    /* `band` as of 2026-09-17 ("set this view as the default").
    
       It shipped as `none` because the band said the course name TWICE, which
       made it a question rather than an answer. That reason is gone:
       `hideHeader` drops the block's entire header cluster while the band is on,
       so the name, the meta and the bar each appear once. The flip also closes a
       real gap — Target Date and Time Remaining left the block with its KPI row,
       and the band's stat line is now the only thing that states them. */
    expect(def.defaultVariant).toBe('band')
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-course-header')
    // Still exactly ONE naming of the course, which is what the old default was
    // protecting — now achieved with the band ON rather than by withholding it.
    const { container } = renderShell('/dashboard-rebrand')
    expect(
      within(container).getAllByText(/New York Life and Health Pre-licensing/i),
    ).toHaveLength(1)
  })

  it('adds the band above everything, with a rule under it', () => {
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const heading = container.querySelector('h2')!
    expect(heading.textContent).toMatch(/New York Life and Health Pre-licensing/)
    // Above the band, not inside it.
    const band = container.querySelector('.cre-learner-focused-band')!
    expect(heading.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    /* The rule is the divider the ask names. Found by the DECLARATION rather
       than by walking N parents: the header gained a wrapper when the course
       art moved into it, and a fixed `parentElement.parentElement` broke on a
       change that was not about the rule at all.
       
       Matched on `dashed` rather than on the TOKEN — the rule went dashed on
       2026-09-17 and its colour stepped from `--color-border-subtle` to
       `--color-neutral-300` at the same time, because a dash paints about half
       the pixels of a solid line and the subtle token was already the faintest
       line on the page at 1.29:1. Keying on the style rather than the value
       means the next colour change does not break these two tests. */
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find((d) =>
      /dashed/.test(d.style.borderBottom),
    )!
    expect(row).toBeTruthy()
    expect(row.contains(heading)).toBe(true)
    /* THE META LINE IS GONE — 2026-09-17. It read "Insurance Pre-Licensing ·
       New York · 42 Lessons" above the title and is now a "Course Progress"
       eyebrow, with the percentage moved to the LEFT of the course name and a
       dot between them.
       
       The jurisdiction and the lesson count both survive, which is what made
       the line droppable rather than a loss: the course's own TITLE names New
       York, and the count is in the stat row directly below. (The Get Licensed
       heading names the state too, but only on the syllabus journey variant,
       which this test does not seed — so the title is the one that always
       carries it.) */
    expect(row.textContent).toMatch(/Course Progress/)
    expect(row.textContent).not.toMatch(/Insurance Pre-Licensing/)
    expect(row.textContent).toMatch(/26 of 42 lessons/)
    expect(heading.textContent).toMatch(/New York/)
    /* THE TITLE LEADS, the figure follows it — swapped 2026-09-17. The figure
       led for a day, which made the heading read as a caption on the number;
       left to right the course is the subject and the percentage is what is
       said about it.
       
       The figure is `flexShrink: 0` so the TITLE gives way as the column
       narrows — verified across widths: 1 → 2 → 3 title lines with the figure
       holding its 41px and staying to the title's right. */
    const figure = Array.from(row.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    const titleEl = row.querySelector('h2')!
    expect(
      titleEl.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(figure.parentElement!.style.flexShrink).toBe('0')
    expect(titleEl.style.minWidth).toBe('0px')
    // ONE 62%, not two — the right-hand column that held it is gone.
    expect(
      Array.from(row.querySelectorAll<HTMLElement>('span')).filter(
        (el) => el.style.fontSize === '32px',
      ),
    ).toHaveLength(1)
    // The course art sits to the LEFT of the title, in this band rather than
    // beside the block's second naming of the course below.
    const cover = row.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(cover).toBeTruthy()
    expect(cover.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and the block below no longer shows one: one course, one picture.
    expect(
      container.querySelector('.cre-learner-focused-band')!.querySelectorAll('img[aria-hidden]'),
    ).toHaveLength(0)
  })

  it('runs a full-width bar under the title, figure large on the right', () => {
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const heading = container.querySelector('h2')!
    const bar = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    expect(bar).toBeTruthy()
    // Under the title, and spanning the band rather than sitting in the title
    // column — which is what makes it read as the PAGE's progress. The FIGURE
    // sits on the title's own line (2026-09-16), so the number and the name it
    // belongs to read as one statement and the bar tucks under both.
    expect(heading.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.parentElement!.contains(bar)).toBe(false)
    /* ALIGNED WITH THE TITLE, structurally rather than by a literal.
     *
     * The bar carried `marginLeft: COURSE_HEADER_COVER_W + _GAP` — 120px — to
     * clear the cover. On 2026-09-17 the cover became a flex SIBLING of the
     * whole column (so it could fill the column's height instead of leaving
     * ~45px empty beneath it), which puts the bar and the title in one column
     * and retires the indent: they cannot drift apart now.
     *
     * So this asserts the indent is GONE and the structure that replaced it is
     * there, since jsdom has no layout to measure the alignment with. Verified
     * in the browser: meta, title and bar all at x=448.
     */
    const barRow = bar.parentElement!
    expect(barRow.style.marginLeft).toBe('')
    const cover = container.querySelector<HTMLImageElement>('img[aria-hidden]')!
    const coverRow = cover.parentElement!
    expect(coverRow.style.display).toBe('flex')
    // The bar is inside the column that is the cover's SIBLING, not inside the
    // cover's own row — which is what makes the alignment structural.
    expect(coverRow.contains(bar)).toBe(true)
    expect(coverRow.children.length).toBe(2)
    /* A 130px SQUARE (2026-09-17). It was 104x72, then briefly stretched to the
     * column's height — which made the art's aspect a function of how far the
     * course title wrapped. Asserted as width === height rather than as two
     * numbers, because the square is the point. */
    expect(cover.style.width).toBe(cover.style.height)
    expect(cover.style.width).toBe('130px')
    expect(cover.style.alignSelf).toBe('')
    const big = Array.from(container.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    expect(big.textContent).toBe('62')
  })

  it('reads the SAME resolver as the block below it', () => {
    // `displayedProgressPct`, not `path.progressPct` — those two differ (the
    // band sums the category hours and falls back to the authored field only
    // when there are none), and a page header disagreeing with the block three
    // inches under it is the defect `ProgressAgreement.test.tsx` exists for.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const expected = displayedProgressPct(persona.path)
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const big = Array.from(container.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '32px',
    )!
    expect(Number(big.textContent)).toBe(expected)
    // The BLOCK no longer prints it — with the band on it drops its whole
    // header cluster (`hideHeader`), so there is exactly one of every fact.
    // Asserted as the absence, which is what "one course, said once" means.
    expect(container.querySelector('.cre-learner-focused-band')!.textContent).not.toMatch(
      /% Complete/,
    )
  })

  it('carries NO action of its own', () => {
    /*
     * The reference's buttons were "DFS Statutory Rules →" and "Syllabus
     * (PDF)". Neither survived, and nor did their replacement:
     *
     *   - No confirmed DFS URL in this repo.
     *   - The PDF XCEL links is a 7-day study PLAN, not a syllabus; it shipped
     *     for one build correctly labelled and then went, because a lone
     *     relabelled button beside a real one is worse than not offering it.
     *   - "State requirements →" then moved to the FOOT of the Get Licensed
     *     card (2026-09-16). Up here it was an action without a subject, three
     *     sections above the thing it elaborates.
     *
     * So the band is a title, and that is all it is.
     */
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find((d) =>
      /dashed/.test(d.style.borderBottom),
    )!
    /* ONE action as of 2026-09-17, and only one: "View Details →", which opens
       the sheet on its PROGRESS half — the Course Breakdown. That half had been
       unreachable on this version, because every trigger here meant
       "requirements".
       
       The rule this test holds is unchanged in substance: the band is a title,
       and it carries no action that duplicates something else or points
       somewhere unsourced. The three that were tried and rejected are still
       rejected below. */
    const actions = within(row).queryAllByRole('button')
    expect(actions).toHaveLength(1)
    expect(actions[0].textContent).toMatch(/^Details/)
    expect(within(row).queryAllByRole('link')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/DFS Statutory Rules|Syllabus \(PDF\)|Study plan \(PDF\)/)
    // …and the requirements link IS on the page, below Get Licensed. Not
    // scoped to a bordered card: the footer link renders in BOTH journey
    // variants, and only the syllabus one draws a card around the section.
    const link = within(container).getByRole('button', { name: /state requirements/i })
    const licensedHeading = within(container).getByText(/Get Licensed/i)
    expect(
      licensedHeading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    // The URL for the plan is not lost — still the fixture's confirmed link.
    expect(NY_LH_STUDY_PLAN_URL).toMatch(/lh_ca_7days\.pdf$/)
  })

  /** The three stat pairs under the bar, in document order. */
  function headerStatRow(container: HTMLElement) {
    // Found by the DECLARATION, not by walking a parent chain — the same
    // reason the rule above is: this band has gained a wrapper twice, and a
    // fixed `parentElement.parentElement` breaks on changes that are not
    // about the row at all.
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    /* The row is [cluster, CTA]; the cluster holds one GROUP per stat, and each
       group after the first opens with its own dot — bound to the pair so a
       wrap can never leave a separator dangling at the end of a line.
       
       So the value/caption are found by their declarations rather than by
       index: `spans[0]` is the dot on two of the three groups. */
    const cluster = row.children[0] as HTMLElement
    return (Array.from(cluster.children) as HTMLElement[]).map((cell) => {
      const spans = Array.from(cell.querySelectorAll<HTMLElement>('span'))
      const value = spans.find((el) => el.style.fontWeight === '700')!
      const caption = spans.find((el) => el.style.textTransform === 'uppercase')!
      return { row, cell, value: value.textContent, caption: caption.textContent }
    })
  }

  /** The round separators. Nested inside the pair each introduces, so they
   *  wrap together — a line can never end on a dangling dot. */
  function headerStatDots(container: HTMLElement) {
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    return Array.from(row.querySelectorAll<HTMLElement>('span')).filter(
      (c) => c.style.borderRadius === '50%',
    )
  }

  it('prints target date, time remaining and the count under the bar', () => {
    // Added 2026-09-16 — the count was alone here. Order matches the KPI cells
    // below, so the eye reads one sequence twice rather than two shuffles of
    // one set, and "Completed" stays last, i.e. flush with the bar's end.
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const stats = headerStatRow(container)
    expect(stats.map((s) => s.caption)).toEqual([
      'Target exam date',
      'Left to complete',
      'Completed',
    ])
    expect(stats[0].value).toBe('December 15, 2026')
    expect(stats[1].value).toBe('27 days')
    expect(stats[2].value).toBe('26 of 42 lessons')
  })

  it('gives all three pairs ONE style, and the values the HEADING face', () => {
    // The ask was "the same style as the lessons completed", then "change the
    // bold items to the serif font". A pair that drifts is the regression, and
    // it is invisible in review: three near-identical pairs where one is a
    // weight or two pixels off.
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const stats = headerStatRow(container)
    const shape = stats.map(({ cell }) => {
      const spans = Array.from(cell.querySelectorAll<HTMLElement>('span'))
      const value = spans.find((el) => el.style.fontWeight === '700')!
      const caption = spans.find((el) => el.style.textTransform === 'uppercase')!
      return [
        value.style.fontFamily,
        value.style.fontSize,
        value.style.fontWeight,
        value.style.color,
        caption.style.fontSize,
        caption.style.textTransform,
        caption.style.color,
      ].join('|')
    })
    expect(new Set(shape).size).toBe(1)
    /* 14px as of 2026-09-17, up from 13 — the captions stay at 11, so the step
       between a value and its label widened rather than the pair growing.
       
       NOT 15, which it was briefly: at 15 the three pairs need exactly the
       row's width (687px in a 687px row), so it wrapped or not on a pixel. */
    expect(shape[0]).toContain('14px|700')
    expect(shape[0]).toContain('uppercase')
    // `--font-heading`, NOT a literal serif stack: that is the token
    // `dashboard-heading-font` re-points, so the serif follows the flag. A
    // pinned literal would make this the one thing on the page ignoring it.
    expect(shape[0]).toContain('var(--font-heading)')
  })

  it('runs them on ONE line, separated by the meta line\'s own dot', () => {
    // A caption under its value reads as a small KPI cell, and three of those
    // is the block's KPI grid said twice. Inline, the row is a meta line — the
    // same object as "Insurance Pre-Licensing \u00b7 New York \u00b7 42 Lessons" at the
    // top of this band, which is why it takes that line's EXACT separator
    // rather than a second kind of dot three inches away.
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const dots = headerStatDots(container)
    expect(dots).toHaveLength(2)
    for (const dot of dots) {
      expect(dot.style.width).toBe('3px')
      expect(dot.style.background).toBe('var(--color-neutral-300)')
      // Decoration: the pairs are already separated for a screen reader by
      // being separate elements, and a bullet read aloud is noise.
      expect(dot.getAttribute('aria-hidden')).not.toBeNull()
    }
    /* 30 BETWEEN PAIRS, SPLIT AS 15 + 15 (2026-09-17, the direct ask for 30).
       The dot lives inside the group it introduces rather than beside it, so
       the cluster's 15 sits before the dot and the group's own 15 after it —
       which both measures 30 and lets a wrap take the dot with its pair. */
    const row = headerStatRow(container)[0].row
    const cluster = row.children[0] as HTMLElement
    expect(cluster.style.gap).toBe('15px')
    expect((cluster.children[1] as HTMLElement).style.gap).toBe('15px')
    // …and the value still sits tight to its own caption.
    const pair = cluster.querySelector<HTMLElement>('span[style*="gap: 6px"]')!
    expect(pair).toBeTruthy()
  })

  it('reads the SAME renewal pair the KPI cells below do', () => {
    /*
     * Both figures now appear TWICE on one screen — here, and in the block's
     * Target Date / Time Remaining cells a few lines down. Deriving them in two
     * components is how they come to disagree, which is the fork
     * `displayedProgressPct` was extracted to close; `resolveRenewal` is the
     * one resolver, and this asserts the agreement through the DOM rather than
     * through the helper, since an override only matters if the surface
     * honours it.
     *
     * The FORMATS differ on purpose — spelled out in the page header, the
     * persona's slash date in the narrow cell — so this matches on the date
     * itself rather than on the string.
     */
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    const stats = headerStatRow(container)
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(stats[0].value).toBe(longDate(persona.renewal!.deadline))
    expect(new Date(stats[0].value!).getTime()).toBe(new Date('12/15/2026').getTime())
    expect(stats[1].value).toBe(timeRemainingText(persona.renewal!.weeksLeft))
    /*
     * The BLOCK's own Target Date / Time Remaining cells were the second copy
     * this asserted against, and they left on 2026-09-17 with the KPI row —
     * replaced by the Study Pace and Readiness tiles. So the second consumer is
     * now the NAVY surface, which keeps its tiled cells; the resolver is shared
     * with it, and that is what this pins.
     */
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem('cgp.featureFlags', JSON.stringify({}))
    const navy = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = navy.container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.textContent).toMatch(/Target Date|Deadline/i)
    expect(band.textContent).toMatch(/12\/15\/2026/)
    expect(band.textContent).toContain(timeRemainingText(persona.renewal!.weeksLeft))
  })

  it('opens the sheet on the COURSE BREAKDOWN, not the requirements', () => {
    /* The band's "View Details" is the first thing on this version to reach the
       sheet's PROGRESS half — the gauge, the per-category bars and the course
       lists. Until now every trigger here meant "requirements", so the
       breakdown was built, wired and unreachable.
       
       One sheet, a `view` prop: two sheets rendering one component is the fork
       this file keeps closing. */
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    fireEvent.click(within(container).getByRole('button', { name: /^details/i }))
    const dialog = screen.getByRole('dialog')
    // The breakdown half, and NOT the tabbed chrome.
    expect(within(dialog).queryByRole('tablist')).toBeNull()
    expect(dialog.textContent).toMatch(/Target Date/i)
    // The requirements half's own copy is absent — this is the other half.
    expect(dialog.textContent).not.toMatch(/Line of Authority/i)
  })

  it('does NOT bring "Go to Learning Path" back with it', () => {
    /* The regression this caught on the way in. That CTA was gated on
       `view !== 'requirements'`, so making `progress` reachable handed it to a
       version whose whole point is that XCEL has no learning-path concept —
       the decision `onOpenLearningPath={qeFocused ? undefined : …}` exists to
       hold. The gate is `view === 'tabs'` now: both single-half views have one
       host between them, and it is the HOST that refuses the concept.
       
       The tabbed sheet keeps it, which the other consumers depend on. */
    seedHeader('band')
    const { container } = renderShell('/dashboard-rebrand')
    fireEvent.click(within(container).getByRole('button', { name: /^details/i }))
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).not.toMatch(/Learning Path/i)
    expect(
      within(dialog).queryByRole('button', { name: /go to learning path/i }),
    ).toBeNull()
  })

  it('returns an unparseable deadline UNTOUCHED rather than guessing one', () => {
    // These strings are authored in fixtures, so printing the raw text is the
    // honest failure — a guessed date would be a wrong fact rendered as a right
    // one, which is the rule the four dead Resources slugs taught.
    expect(longDate('sometime in the spring')).toBe('sometime in the spring')
    expect(longDate('')).toBe('')
    // Both shapes the fixtures actually carry resolve to one format: the
    // persona's slash date, and the LICENSE_TRACKER fallback's long form.
    expect(longDate('12/15/2026')).toBe('December 15, 2026')
    expect(longDate('Nov 30, 2026')).toBe('November 30, 2026')
  })

})

describe('the Study Journey rail style flag', () => {
  function seedJourney(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-journey-style': { enabled: true, variant } }),
    )
  }

  it('is registered, variant-only, and in the panel scope', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-journey-style')!
    expect(def.page).toBe('dashboard-rebrand')
    /* `syllabus` as of 2026-09-17 ("set this view as the default"). It is no
       longer a restyle of the compact rail so much as the treatment this version
       was built around; `default` stays in the picker as the comparison. */
    expect(def.defaultVariant).toBe('syllabus')
    expect(def.variants?.map((v) => v.value)).toEqual(['default', 'syllabus'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-journey-style')
  })

  it('renders the SYLLABUS treatment at the default, and `default` on request', () => {
    // Inverted 2026-09-17: the syllabus IS the default, so what needs pinning is
    // that the compact treatment is still reachable — it is the comparison the
    // picker exists for.
    const atDefault = renderShell('/dashboard-rebrand')
    expect(atDefault.container.textContent).toMatch(/Complete Coursework/)
    expect(atDefault.container.textContent).toMatch(/Post-course process/i)
    atDefault.unmount()
    seedJourney('default')
    const compact = renderShell('/dashboard-rebrand')
    expect(compact.container.textContent).not.toMatch(/Complete Coursework|Post-course process/i)
    expect(compact.container.textContent).toMatch(/Atlas Study Journey/)
  })

  it('numbers the stops on the NODE and names the sequence', () => {
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    // "Study Journey" is the eyebrow; the heading read "Syllabus sequence" then
    // "Complete Course", and is "Complete Coursework" as of 2026-09-17 —
    // matching the supplied reference, and the truer of the two words, since
    // the rail covers the prep review, the simulators and the attestation as
    // well as the course itself.
    expect(container.textContent).toMatch(/Complete Coursework/)
    expect(container.textContent).not.toMatch(/Syllabus sequence/i)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    // The digits are on the NODE, and the title is just the title. They were
    // in both places ("01. Pre-licensing Course" beside a node reading 01),
    // which is one numbering system too many for a column being scanned.
    expect(list.textContent).toMatch(/01Pre-licensing Course/)
    expect(list.textContent).toMatch(/02Prep Review Course/)
    expect(list.textContent).not.toMatch(/01\. Pre-licensing Course/)
  })

  it('drops the summary count, the chip and the Part labels', () => {
    /*
     * All three said something already on screen, and all three left on
     * 2026-09-17 to match the reference:
     *
     *   - "Milestone 0 / 4 Complete" beside the heading reported a NOUGHT at
     *     the demo's own state, directly over a row reading "26 of 42 lessons
     *     complete". Two true numbers arguing.
     *   - The "62% In progress" chip duplicated that same sub-line.
     *   - "Part 2" / "Part 3" on a blocked row is the first segment of the
     *     stop's own group, i.e. the row named twice.
     */
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).not.toMatch(/Milestone/)
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    expect(list.textContent).not.toMatch(/62% In progress/i)
    expect(list.textContent).not.toMatch(/Part 2|Part 3/)
    // The COMPACT rail keeps its count: with no room for per-row detail, the
    // position in the sequence is the only summary it can offer.
    const plain = renderShell('/dashboard-rebrand')
    expect(
      plain.container.querySelector('ol[aria-label="Study journey stops"]'),
    ).toBeTruthy()
  })

  it('prints a sub-line on the ACTIVE row only', () => {
    /*
     * The syllabus treatment printed `leanMeta` on all four rows until
     * 2026-09-17 — three of them ending in "Unlocks after coursework" under
     * three greyed titles, which is a paragraph where the point was a list. The
     * reference gives the active row a sub-line and the rest nothing, and that
     * is now what both treatments do.
     *
     * The COST, unchanged from the earlier note that dropped it on the compact
     * rail: Part 2's published 80% target and Part 3's "3 simulators, aim for
     * 85%" are now only on the requirements sheet this block links. The blocked
     * REASON survives on the row's `title`, so it is still on hover and
     * available to assistive tech — which is what the second half of this
     * asserts, because a rule about what is NOT rendered passes vacuously if
     * the thing was never reachable at all.
     */
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    // The count, in words, on the row that has one.
    expect(list.textContent).toMatch(/26 of 42 lessons complete/)
    // …and nothing under the three that do not.
    expect(list.textContent).not.toMatch(/Unlocks after coursework/)
    expect(list.textContent).not.toMatch(/aim for 80%|aim for 85%/)
    /* The state is still carried in WORDS, off-screen.
     *
     * Both earlier notes said the blocked reason "survives on the row's
     * `title`". On 2026-09-17 that turned out never to have been implemented —
     * there was no `title` attribute anywhere in `StudyJourneyRail` — so the
     * rule those notes leaned on had been false for as long as they had been
     * written. A visually-hidden span carries it now, which is also the more
     * robust mechanism: `title` is exposed inconsistently by screen readers and
     * not at all by touch.
     *
     * Asserted here rather than in an a11y suite because it is the direct
     * consequence of this test's own subject: dropping the visible sub-line is
     * only safe while the words exist somewhere. */
    expect(list.textContent).toMatch(/After your coursework|Not started/i)
    const hidden = Array.from(list.querySelectorAll<HTMLElement>('span')).filter(
      (el) => el.style.clipPath === 'inset(50%)',
    )
    expect(hidden.length).toBeGreaterThan(0)
    expect(hidden.map((el) => el.textContent).join(' ')).toMatch(/coursework|started/i)
  })

  it('spaces and marks the two lists as ONE sequence', () => {
    /*
     * The journey runs 01-04 and Get Licensed 05-07, so the seven rows are one
     * route to a licence and must be spaced as one. They were not: Get Licensed
     * carried a 10px LIST GAP on top of the 8px its `<li>` already had, which
     * measured 39px node-to-node against the journey's 29.
     *
     * That gap is left over from when each step was its own bordered CARD and
     * needed separating from the next. The cards went when the section lost its
     * background and stroke; the gap outlived them — the same leftover as the
     * nodes' white fill and the row button's 14px bottom padding.
     *
     * Asserted as the declaration, since jsdom has no layout. Verified in the
     * browser: 29px node-to-node in BOTH lists.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const lists = Array.from(container.querySelectorAll<HTMLElement>('ol')).filter(
      (o) => /Pre-licensing Course|Schedule State Exam/.test(o.textContent ?? ''),
    )
    expect(lists).toHaveLength(2)
    for (const ol of lists) {
      // No list gap in either — the `<li>` owns the spacing, outside the hover
      // target so the wash stays centred on its own text.
      expect(ol.style.gap).toBe('')
      const li = ol.querySelector<HTMLElement>('li')!
      expect(li.style.paddingBottom).toBe('8px')
    }
  })

  it('dashes a LOCKED node and leaves an OPEN one solid', () => {
    /*
     * The distinction is locked vs not, and it is why there are two node
     * treatments rather than one:
     *
     *   - The journey's 02-04 are blocked on the coursework above them, and
     *     dashed already means "not started" across this codebase.
     *   - Get Licensed's 05-07 are NOT gated — a learner can book a PSI sitting
     *     whenever they like. They carry no completion state because PSI and DFS
     *     own the outcome, not because anything is stopping them.
     *
     * Dashing those three said "locked" about steps that are not, which is the
     * same class of wrong as a chevron on a row that opens nothing.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const nodeOf = (li: Element) => li.querySelector<HTMLElement>('span > span')!
    const journey = container.querySelector('ol[aria-label="Study journey stops"]')!
    const journeyNodes = Array.from(journey.querySelectorAll('li')).map(nodeOf)
    // 01 is current: filled, solid.
    expect(journeyNodes[0].style.border).toMatch(/solid/)
    expect(journeyNodes[0].style.background).toMatch(/primary-700/)
    // 02-04 are blocked: dashed and unfilled.
    for (const n of journeyNodes.slice(1)) {
      expect(n.style.border).toMatch(/dashed/)
      expect(n.style.background).toBe('transparent')
    }
    const licensed = Array.from(container.querySelectorAll('ol')).find((ol) =>
      /Schedule State Exam/.test(ol.textContent ?? ''),
    )!
    for (const n of Array.from(licensed.querySelectorAll('li')).map(nodeOf)) {
      expect(n.style.border).toMatch(/solid/)
      expect(n.style.border).not.toMatch(/dashed/)
      expect(n.style.background).toBe('transparent')
    }
  })

  it('opens each step in its OWN sheet, with the published detail', () => {
    /*
     * The three rows opened the REQUIREMENTS sheet until 2026-09-17. That was
     * the honest placeholder while nothing described them individually — the
     * note said so outright: "a step-specific page would need content nobody has
     * authored." Jillienne supplied XCEL's own published steps 2-4, so each row
     * now opens its own.
     *
     * A SEPARATE sheet, not a third `view` on the requirements one: that panel
     * takes a `path` and shares its header with the breakdown, and a step is a
     * different object.
     */
    const { container } = renderShell('/dashboard-rebrand')
    /* A BUTTON, not a link — the Schedule row went out to PSI directly until
       its sheet existed. The PSI URL is inside the sheet now, alongside the
       system check and the retake policy, which are the two things a learner
       wants BEFORE starting a registration flow. */
    fireEvent.click(within(container).getByRole('button', { name: /schedule state exam/i }))
    let dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/Post-course process/)
    expect(dialog.textContent).toMatch(/There are no limitations on retaking the exam/)
    expect(dialog.textContent).toMatch(/Spanish exams are available/)
    // It is NOT the requirements sheet — that one states the board's rules for
    // the licence as a whole.
    expect(dialog.textContent).not.toMatch(/Line of Authority/i)
    fireEvent.click(within(dialog).getByRole('button', { name: /close/i }))

    fireEvent.click(within(container).getByRole('button', { name: /apply for your license/i }))
    dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toMatch(/full fee is \$80, half fee is \$40/)
  })

  it('links only to URLs the source page prints, with the NIPR typo fixed', () => {
    /*
     * Every href in a step's detail is one XCEL's page shows. ONE had to be
     * corrected on the way in: the page renders the NIPR link as
     * `https://http://www.nipr.com/` — a doubled scheme, plainly a typo on
     * their side. Fixing it is not inventing it; the domain is theirs.
     *
     * Also worth noting: this is where a confirmed DFS URL finally came from.
     * The header band's "DFS Statutory Rules" button was removed in September
     * precisely because none existed in this repo.
     */
    const apply = GET_LICENSED_STEPS.find((st) => st.id === 'apply-license')!
    const hrefs = (apply.sections ?? []).flatMap((sec) =>
      sec.bullets.flatMap((b) => [b.href, ...(b.children ?? []).map((c) => c.href)]),
    )
    expect(hrefs).toContain('https://www.nipr.com/')
    expect(hrefs.some((h) => h?.includes('http://'))).toBe(false)
    expect(hrefs).toContain('https://www.dfs.ny.gov/apps_and_licensing/agents_and_brokers/home')
    // New tab, and the themed class rather than an inline colour — the CTA ramp
    // is a fill colour on XCEL and cta-500 as TEXT is 1.84:1 on the dark page.
    const { container } = renderShell('/dashboard-rebrand')
    fireEvent.click(within(container).getByRole('button', { name: /apply for your license/i }))
    /* Scoped to the step's OWN bullet links. The sheet also carries the
       governing-agency block, whose `tel:` and `mailto:` deliberately do NOT
       open a new tab — a dialler or a mail client is not a navigation away from
       the dashboard. A blanket `every link is _blank` check would have failed
       for the right behaviour. */
    const links = Array.from(screen.getByRole('dialog').querySelectorAll('a')).filter((a) =>
      a.getAttribute('href')?.startsWith('http'),
    )
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) {
      expect(a.getAttribute('target')).toBe('_blank')
      expect(a.className).toContain('cre-cta-ink')
      expect((a as HTMLElement).style.color).toBe('')
    }
  })

  it('closes ALL THREE sheets with the governing agency, under a rule', () => {
    /*
     * DFS governs the LICENCE, not any one step, so the block is identical on
     * each of the three — which step you happened to open must not decide
     * whether you can find the phone number.
     *
     * Swept across all three rather than checked on one, because "identical on
     * each" is the assertion; a single-sheet check would pass with the block on
     * one and missing from two.
     */
    for (const step of GET_LICENSED_STEPS) {
      const view = renderShell('/dashboard-rebrand')
      fireEvent.click(
        within(view.container).getByRole('button', { name: new RegExp(step.title, 'i') }),
      )
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent, step.id).toMatch(/Governing Agency/)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.name)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.phone)
      expect(dialog.textContent, step.id).toContain(NY_GOVERNING_AGENCY.address)
      // A hairline above it — the same `--color-border-subtle` seam the rest of
      // this version uses, not a heavier line for one boundary.
      const rule = Array.from(dialog.querySelectorAll<HTMLElement>('div')).find(
        (d) => d.style.height === '1px',
      )!
      expect(rule, step.id).toBeTruthy()
      expect(rule.style.background).toMatch(/border-subtle/)
      // The phone and the email are ACTIONS, not text to retype; the website
      // leaves XCEL so it opens in a new tab, and `tel:`/`mailto:` do not.
      const agency = dialog.querySelector('section:last-of-type')!
      const byHref = (pre: string) =>
        Array.from(agency.querySelectorAll('a')).find((a) => a.getAttribute('href')?.startsWith(pre))
      expect(byHref('tel:')).toBeTruthy()
      expect(byHref('mailto:')).toBeTruthy()
      const site = byHref('https://www.dfs.ny.gov/')!
      expect(site.getAttribute('target')).toBe('_blank')
      expect(byHref('tel:')!.getAttribute('target')).toBeNull()
      view.unmount()
    }
  })

  it('still carries NO completion state on any step', () => {
    // Unchanged by the sheets, and the reason is unchanged: PSI schedules the
    // sitting, PSI scores it, DFS issues the licence. A tick would be the
    // product claiming an outcome it has no feed for.
    for (const step of GET_LICENSED_STEPS) {
      expect(Object.keys(step)).not.toContain('status')
      expect(Object.keys(step)).not.toContain('completed')
    }
  })

  it('separates Get Licensed from the journey with a RULE, not a card', () => {
    /*
     * INVERTED 2026-09-17. Each section drew its own bordered card, on the
     * reasoning that what changes between them is WHO owns the work (XCEL, then
     * the state) and a card boundary says that more plainly than a hairline —
     * so the widget dropped its rule when both were cards.
     *
     * Both cards were then removed ("remove background and stroke"), and the
     * rule had to come back with them: without either, the journey's four stops
     * and the three licensing steps run together as one seven-row list. Which
     * is now literally true of the NUMBERING — 01-04 then 05-07 — so the rule
     * is the only thing left saying the second half is a different kind of
     * step.
     */
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    /* Scoped to the BAND. The page-wide version of this caught the "This week"
       strip, which is a white bordered card belonging to another component
       entirely — an over-wide scope that would have gone on passing for a
       reason having nothing to do with the journey. */
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const cards = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === 'var(--color-surface-card)' && d.style.border !== '',
    )
    expect(cards).toHaveLength(0)
    // The heading is still there, so the sections are still two things.
    expect(band.textContent).toMatch(/Post-course process/)
    // …and a hairline divides them.
    const rules = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.height === '1px' && /border-subtle|neutral/.test(d.style.background),
    )
    expect(rules.length).toBeGreaterThanOrEqual(1)
  })

  it('names the jurisdiction on Get Licensed, from a map not a literal', () => {
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).toMatch(/Get Licensed in New York/)
    /* THE LEDE IS GONE from this treatment (2026-09-17) — the eyebrow
       ("Post-course process") and the heading ("Get Licensed in New York")
       already said it between them, and it ended in a colon pointing at a list
       that now numbers 05-07 in continuation of the journey above. The compact
       rail keeps its own, because there the heading is a bare "Get Licensed"
       with no eyebrow and nothing else places the section in time. */
    expect(container.textContent).not.toMatch(/Post-course state licensing milestones/)
    expect(container.textContent).toMatch(/Post-course process/)
    /* The rows are TITLES ONLY on this treatment as of 2026-09-17 — the detail
       sentence and the labelled "Vendor: PSI · $40 exam fee" line came off, to
       be shown when the row is opened. So the assertion moves from "the labels
       are rendered" to "the facts are still reachable": the fixture keeps them,
       and every row opens the sheet that states them.
       
       Asserted at the FIXTURE rather than the DOM, because the point is that
       nothing was deleted — a `queryByText` returning null proves the copy is
       off screen and says nothing about whether it still exists. */
    expect(container.textContent).not.toMatch(/Vendor: PSI/)
    const psi = GET_LICENSED_STEPS.find((st) => st.owner === 'PSI')!
    expect(psi.fee).toBeTruthy()
    expect(psi.detail).toBeTruthy()
    expect(
      within(container).getByRole('button', { name: /state requirements/i }),
    ).toBeInTheDocument()
    // The three rows still read as a sequence, continuing the journey's
    // numbering rather than restarting — 01-04 above, 05-07 here.
    expect(container.textContent).toMatch(/05/)
    expect(container.textContent).toMatch(/07/)
    // `jurisdictionName` falls back to the CODE rather than blanking or
    // guessing, so an unmapped state still reads.
    expect(jurisdictionName('NY')).toBe('New York')
    expect(jurisdictionName('ZZ')).toBe('ZZ')
    expect(jurisdictionName(undefined)).toBe('')
  })

  it('changes no DATA — same stops, same names, no authored copy', () => {
    // The reference carries "Foundational jurisprudence", "Mandatory sworn
    // affidavit of identity & contact hours" and a course code
    // ("NY-INS-L&H-2026"). Those are claims about New York practice and a
    // record number, and nothing in the fixtures sources any of them.
    const before = journeyStopsFor(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!.path,
    ).map((st) => st.title)
    seedJourney('syllabus')
    const { container } = renderShell('/dashboard-rebrand')
    for (const title of before) expect(container.textContent).toContain(title)
    expect(container.textContent).not.toMatch(/jurisprudence|sworn affidavit|NY-INS-/i)
    // …and it did not split the merged completion stop back into two.
    expect(before).toContain('Attestation & Certificate')
  })
})

describe('the CLP stats treatment flag', () => {
  function seedStats(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'dashboard-clp-stats': { enabled: true, variant } }),
    )
  }
  const statCard = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('div')).find(
      (d) =>
        d.style.background === 'var(--color-surface-card)' &&
        /Target Date/i.test(d.textContent ?? ''),
    )

  it('is its own axis, so it combines with the block style', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-stats')!
    expect(def.page).toBe('dashboard-rebrand')
    expect(def.defaultVariant).toBe('default')
    expect(def.variants?.map((v) => v.value)).toEqual(['default', 'stat-card'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-clp-stats')
    // Two separate flags, not one list of combinations.
    expect(FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-style')).toBeTruthy()
  })

  it('changes nothing at the default', () => {
    const { container } = renderShell('/dashboard-rebrand')
    expect(statCard(container)).toBeUndefined()
  })

  it('gathers the cells and the status onto one card, with sub-labels', () => {
    seedStats('stat-card')
    const { container } = renderShell('/dashboard-rebrand')
    const card = statCard(container)!
    expect(card).toBeTruthy()
    // The status comes INSIDE the card, under its rule.
    expect(card.textContent).toMatch(/ON TRACK/)
    // Each cell says what its number is.
    expect(card.textContent).toMatch(/Your exam target date/)
    expect(card.textContent).toMatch(/Lessons of this course/)
    // Two-tone fraction: the unit moved to the sub-label, so the value is bare.
    expect(card.textContent).toMatch(/26\s*\/\s*42/)
  })

  it('DERIVES the pace line rather than authoring it', () => {
    // 40 credit hours (the state's real figure, carried on the resume course)
    // over 27 days left = ~1.5/day. The reference mock also carried "You are
    // currently pacing 4 days ahead of schedule"; nothing in the fixtures knows
    // a schedule to be ahead of, so that claim is NOT reproduced.
    seedStats('stat-card')
    const { container } = renderShell('/dashboard-rebrand')
    const card = statCard(container)!
    expect(card.textContent).toMatch(/~1\.5 hrs\/day suggested pace/)
    expect(card.textContent).not.toMatch(/days ahead of schedule|velocity/)
  })

  it('drops the strip TINT inside the card, keeping the pill', () => {
    // A tinted row inside a white card reads as a second card, and the card is
    // already the surface. The pill keeps its tint, which is what carries the
    // state — the wash never did (~1.02:1, decoration, per its own note).
    seedStats('stat-card')
    const { container } = renderShell('/dashboard-rebrand')
    const card = statCard(container)!
    const strip = Array.from(card.querySelectorAll<HTMLElement>('div')).find((d) =>
      /On pace|on pace|momentum/.test(d.textContent ?? ''),
    )!
    expect(strip.style.background).toBe('')
    const pill = Array.from(card.querySelectorAll<HTMLElement>('span')).find((el) =>
      /ON TRACK/.test(el.textContent ?? ''),
    )!
    expect(pill.style.background).not.toBe('')
  })
})

describe('the columns are not near-even any more', () => {
  it('gives the progress block the width, 660 : 380', () => {
    // They were 514 : 407 because they were once two halves of one band. They
    // are not: the LEFT column carries the art, title, meta, progress bar,
    // Resume CTA, three KPI cells and a status strip; the right is a list of
    // short rows and gives width up cheaply. Measured after: 515px against
    // 296px in the pane, and the KPI row stops being tight.
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.style.gridTemplateColumns).toBe('minmax(0, 660fr) minmax(0, 380fr)')
  })

  it('edits the LIVE grid, not the completed-celebration one', () => {
    // There are two `gridTemplateColumns` in the band. The first belongs to the
    // completed-celebration branch, which renders something else entirely — it
    // got the edit first, and the symptom was the left column getting NARROWER,
    // because the live grid had not moved at all. jsdom would not have caught
    // that either, which is why this reads the source.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    const grids = src.match(/gridTemplateColumns: stack \?[^\n]*/g)!
    expect(grids).toHaveLength(2)
    // The celebration grid keeps the old near-even split; only one moved.
    expect(grids.filter((g) => g.includes('660fr'))).toHaveLength(1)
    expect(grids.filter((g) => g.includes('514fr'))).toHaveLength(1)
  })
})

describe('the CLP block style flag', () => {
  function seedStyle(variant: string) {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-clp-style': { enabled: true, variant } }),
    )
  }
  const navyCard = (c: HTMLElement) =>
    Array.from(c.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-primary-700)',
    )

  it('is in the catalog and the panel scope, variant-only, default unchanged', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === 'dashboard-clp-style')!
    expect(def.page).toBe('dashboard-rebrand')
    expect(def.defaultEnabled).toBe(true)
    expect(def.defaultVariant).toBe('default')
    expect(def.variants?.map((v) => v.value)).toEqual(['default', 'big-number', 'navy'])
    expect(flagScopeForPath('/dashboard-rebrand')).toContain('dashboard-clp-style')
  })

  it('changes NOTHING at the default', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell('/dashboard-rebrand')
    expect(navyCard(container)).toBeUndefined()
    // The bar stays inline beside its percentage rather than in a column.
    expect(container.textContent).toMatch(/62% Complete/)
  })

  it('big-number promotes the figure to its own column, on the light ground', () => {
    seedStyle('big-number')
    const { container } = renderShell('/dashboard-rebrand')
    expect(navyCard(container)).toBeUndefined()
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const big = Array.from(band.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.style.fontSize === '40px',
    )!
    expect(big.textContent).toBe('62')
    // The count in words under the bar says what the percentage is OF.
    expect(band.textContent).toMatch(/26 of 42 lessons complete/)
    // …and the inline bar+label is gone, so the number is drawn once.
    expect(band.textContent).not.toMatch(/62% Complete/)
  })

  it('navy puts the cluster on a card and keeps the rest on the page', () => {
    seedStyle('navy')
    const { container } = renderShell('/dashboard-rebrand')
    const card = navyCard(container)!
    expect(card).toBeTruthy()
    // The reference has no cover; dropping it is what gives the title room.
    expect(card.querySelector('img')).toBeNull()
    // The CTA moves INSIDE the card — white on navy, not the primary gradient,
    // which on this card is the card's own colour.
    const cta = within(card).getByRole('button', { name: /resume course/i })
    expect(cta.style.background).toBe('var(--color-text-inverse)')
    // ONE resume button: `resumeInline` stands down when the card owns it.
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
    // The rest stays on the page grey below the card — the two tiles now,
    // where it was the KPI cells and the status strip until 2026-09-17. The
    // variant dresses the CLUSTER, not the whole block, and that is what this
    // has always been checking.
    expect(card.textContent).not.toMatch(/Study Pace/i)
    expect(band.textContent).toMatch(/Study Pace/i)
    expect(band.textContent).toMatch(/Readiness/i)
  })

  it('re-inks the META on navy — the seam that has now failed twice', () => {
    /*
     * `metaRow` is assembled ABOVE the surface-specific markup, so a treatment
     * applied by sweeping that markup misses it. It shipped white-on-grey at
     * ~1.2:1 when the page surface landed; it came back the other way round
     * here, keeping the PAGE's `--color-text-secondary` on the navy card at
     * **2.13:1**. Both were invisible to tsc and to every other test.
     *
     * Asserted as "not the page value" rather than on a number, because jsdom
     * computes no composited colour — the real check was in the browser
     * (12.25:1 after the fix).
     */
    seedStyle('navy')
    const { container } = renderShell('/dashboard-rebrand')
    const card = navyCard(container)!
    // The element that SETS the colour, not the outermost one containing the
    // text — several wrappers match the text and none of them carry the ink.
    const meta = Array.from(card.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.color !== '' && /Insurance Pre-Licensing/.test(d.textContent ?? ''),
    )!
    expect(meta).toBeTruthy()
    expect(meta.style.color).not.toBe('var(--color-text-secondary)')
    // jsdom normalises the space-separated form to `rgba(255, 255, 255, 0.72)`,
    // so match on the channel values rather than the source spelling.
    expect(meta.style.color).toMatch(/255,\s*255,\s*255/)
  })

  it('invents no lesson-level content in any variant', () => {
    // The reference mock shows "Lesson 27 — Life insurance policy provisions ·
    // 14 minutes left". There is no lesson title and no per-lesson timing in
    // the fixtures, and authoring one is the rule this version has held all
    // along.
    for (const v of ['default', 'big-number', 'navy']) {
      seedStyle(v)
      const { container, unmount } = renderShell('/dashboard-rebrand')
      expect(container.textContent, v).not.toMatch(/Lesson \d+ —|minutes left/)
      unmount()
    }
  })
})

describe('the header carries a horizontal bar, not a donut', () => {
  it('replaces the 150px gauge with a bar under the meta line', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // The donut had a whole row to itself to say one number the KPI cell below
    // already says as "26 / 42 lessons". The bar sits inside the text column,
    // under the meta, so it reads as this course's progress rather than as a
    // separate widget: title, what it is, how far through it.
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    // NOT rendered, not `display: none` — a hidden gauge is still in the
    // accessibility tree and still in every `querySelector('svg')` a test
    // reaches for, so it would read as present while being absent.
    expect(band.querySelectorAll('svg circle')).toHaveLength(0)
    expect(band.textContent).toMatch(/62% Complete/)
    const bar = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    // Against the TITLE, not the meta line: the meta is assembled as `metaRow`
    // outside this markup and is not a `<p>`, so selecting it by tag finds
    // nothing and the assertion passes vacuously. That is the same seam the
    // `metaRow` colour regression came through.
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    expect(title.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and it is INSIDE the header cluster, not in a row of its own below it.
    expect(title.closest('div')?.parentElement?.contains(bar)).toBe(true)
  })

  it('uses the SHARED ProgressBar, not a lookalike', () => {
    // The rule `ProgressInline` was extracted for: Readiness had drawn its own
    // 3px bar in a different green, so one learner's one 32% was two different
    // bars a rail item apart.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/import \{ ProgressBar \} from '@\/components\/ui\/ProgressBar'/)
    expect(src).toMatch(/<ProgressBar/)
  })

  it('swaps WITH the category bars, so one number is drawn once', () => {
    // `barInHeader` is tied to `showBars` being false. With a real
    // multi-category breakdown the donut still earns its row — it shows the
    // SEGMENTS, which a single bar cannot — so the two swap together rather
    // than the bar being a version check.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/const barInHeader = !showBars && hasBreakdown/)
    // The navy versions keep their donut, which is what that means in practice.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.querySelectorAll('svg circle').length).toBeGreaterThan(0)
  })
})

describe('the single category shows NO bar', () => {
  it('drops the breakdown when there is one thing to break down', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // A single category bar restates the donut's percentage AND the "Completed"
    // KPI cell — three sayings of one number within three inches. A breakdown
    // earns its place when there is something to compare.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.path.categories).toHaveLength(1)
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    // The CATEGORY bars, not every bar: the header carries one progress bar of
    // its own since 2026-09-16 (it replaced the donut), and it matches the same
    // pill-radius shape. Scoped by label, which is what tells them apart.
    const catBars = Array.from(band.querySelectorAll<HTMLElement>('div')).filter(
      (d) =>
        d.style.borderRadius === 'var(--radius-pill)' &&
        d.style.overflow === 'hidden' &&
        /lessons|hrs/.test(d.parentElement?.textContent ?? ''),
    )
    expect(catBars).toHaveLength(0)
    // The number is still on screen — the header bar and the KPI cell — so this
    // removes repetition, not information.
    expect(band.textContent).toMatch(/26 \/ 42 lessons/)
  })

  it('is a COUNT rule, not a version check', () => {
    // Any path that ends up with one category gets this; a path with a real
    // breakdown keeps its bars on every version. At source, because the only
    // one-category fixture is the one under test.
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/const showBars = hasBreakdown &&/)
    expect(src).toMatch(/cats\.length > 1/)
  })

  it('keeps CATEGORY_BAR_HEIGHT for the surfaces that still draw bars', () => {
    // 8 → 6 on 2026-09-16, and still live on the detail sheet and both
    // ProgressTrackerCard layouts. This version simply has nothing to draw.
    expect(CATEGORY_BAR_HEIGHT).toBe(6)
  })
})

describe('the in-shell course launcher is a lo-fi placeholder', () => {
  /*
   * 2026-09-17, the direct ask. Resume used to open `CourseDetailPage` embedded
   * in the content column — the Figma "Learning Launcher" against the catalogue
   * fixture, which for this course meant `mm/dd/yyyy` for both Enrolled and
   * Expires, "Not Started · 0%", a two-item table of contents and an Enroll
   * button on a course the learner is 62% through. A reviewer would read that
   * as the course player rather than as scaffolding.
   *
   * It is a CALL-SITE change, not a deletion: the page is 638 lines with two
   * consumers, and only the launcher is the Compass surface.
   */
  it('shows the placeholder and none of the old course chrome', () => {
    const { container } = renderShell('/dashboard-rebrand')
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    const placeholder = screen.getByRole('region', { name: /compass course content/i })
    expect(placeholder).toBeTruthy()
    expect(container.textContent).toMatch(/This is where Compass Course content will live/)
    // The fixture-driven chrome is gone — these are the four things that read as
    // a real course player while being placeholder data.
    expect(container.textContent).not.toMatch(/mm\/dd\/yyyy/)
    expect(container.textContent).not.toMatch(/Table of Contents/i)
    expect(container.textContent).not.toMatch(/\bEnroll\b/)
    expect(container.textContent).not.toMatch(/Not Started/i)
    // The way BACK stays in view, so the learner is never stranded in it.
    expect(within(container).getByRole('button', { name: /back to/i })).toBeInTheDocument()
  })

  it('auto-collapses the left rail to icon-over-short-text', () => {
    /*
     * 2026-09-17, the direct ask. Driven by the SAME `launcherOpen` flag that
     * already blanks the rail's active state, so the two cannot get out of
     * step — a rail highlighting nothing while staying full width is the worst
     * of both.
     *
     * The rail STAYS rather than disappearing: the launcher has no rail item of
     * its own, so orientation rests on "Back to {origin}", and hiding the rail
     * would leave that link carrying all of it.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const labels = () => Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)
    // Full labels before.
    expect(labels()).toContain('My Courses')
    expect(rail().querySelector('p')).toBeTruthy() // the group caption

    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))

    // SHORT labels after, and only where one was authored — abbreviating
    // everything is how a rail ends up with "Certs" beside "Resources" for no
    // reason.
    expect(labels()).toContain('Courses')
    expect(labels()).toContain('Certs')
    expect(labels()).toContain('Resources')
    expect(labels()).not.toContain('My Courses')
    // The captions go (they would wrap to three lines in a 76px column); a
    // divider stands in, and never above the FIRST group.
    expect(rail().querySelector('p')).toBeNull()
    /* THE ACCESSIBLE NAMES DO NOT SHORTEN. Each row keeps its full label as its
       `aria-label`, and each group keeps its caption as the list's `aria-label`
       — which is what makes the abbreviation a visual economy rather than an
       accessibility regression. */
    const byName = within(rail())
    expect(byName.getByRole('button', { name: 'My Courses' })).toBeTruthy()
    expect(byName.getByRole('button', { name: 'Rubi Insights' })).toBeTruthy()
    expect(byName.getByRole('list', { name: 'My Learning' })).toBeTruthy()
    expect(byName.getByRole('list', { name: 'Support' })).toBeTruthy()
  })

  it('offers a rotating arrow-to-line to collapse and expand the rail', () => {
    /* `ChevronRight` rotated: `>` expands, `<` collapses, so direction carries
       the whole meaning and the control needs no label beside it.
       
       The glyph already means "drill into this row" in five other places, and
       the ROTATION is what keeps them apart — a drill-in chevron never turns.
       `bars` was the other vendored candidate and is wrong: a hamburger says
       "open the menu", and at 76px the rail is already open. */
    const { container } = renderShell('/dashboard-rebrand')
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = () => within(rail()).getByRole('button', { name: /^(Collapse Menu|Expand)$/ })
    // Expanded at rest: the label says what the click DOES, not what the state
    // is, and `aria-expanded` says the state.
    /* THE VISIBLE LABEL IS THE ACCESSIBLE NAME as of 2026-09-17 — no
       `aria-label` competing with it, and no `title` tooltip, both of which the
       earlier circular handle needed to explain itself. `aria-expanded` still
       carries the STATE, which a verb alone cannot. */
    expect(toggle().textContent).toBe('Collapse Menu')
    expect(toggle().getAttribute('aria-label')).toBeNull()
    expect(toggle().getAttribute('title')).toBeNull()
    expect(toggle().getAttribute('aria-expanded')).toBe('true')
    /* `arrow-right-to-line`, rotated: pointing LEFT it collapses, pointing
       RIGHT it expands. It replaced a bare chevron on 2026-09-17 — that glyph
       already means "drill into this row" in five other places, and a chevron
       says "there is more this way" where an arrow INTO a line says "push the
       panel to this edge", which is what the control does.
       
       The LEFT twin is the same asset rotated 180°: the two are exact mirrors,
       so the transform yields FA's own `arrow-left-to-line` without a second
       file — which is also what keeps it inside the repo's rule against
       hand-authoring an icon path. Asserted on the ROTATION, since that is the
       whole mechanism. */
    expect(toggle().querySelector('svg')!.getAttribute('style')).toMatch(/rotate\(180deg\)/)
    // The vendored asset, at the FA 7 viewBox — not a hand-drawn path.
    expect(toggle().querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 640 640')
    fireEvent.click(toggle())
    expect(toggle().textContent).toBe('Expand')
    expect(toggle().getAttribute('aria-expanded')).toBe('false')
    // Collapsed points RIGHT — unrotated.
    expect(toggle().querySelector('svg')!.getAttribute('style')).not.toMatch(/rotate/)
    // Collapsed: short labels, so the toggle really drove the collapse.
    expect(Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)).toContain(
      'Certs',
    )
  })

  it('scopes the manual override to one launcher session', () => {
    /*
     * THE BUG THIS CAUGHT, because it is the kind that looks like it works.
     *
     * The override reset only on CLOSE at first, so a learner who expanded the
     * rail on the dashboard carried that choice INTO the launcher and the
     * auto-collapse silently did not fire. Measured in the browser: expand at
     * home, open Compass, rail still 220.
     *
     * Resetting both ways scopes the override to one launcher session — opening
     * always collapses, an expand inside lasts as long as the course, and
     * leaving restores the dashboard's default.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const rail = () => container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = () => within(rail()).getByRole('button', { name: /^(Collapse Menu|Expand)$/ })
    const labels = () => Array.from(rail().querySelectorAll('button')).map((b) => b.textContent)

    // Collapse, then expand again at home — leaving a non-null override.
    fireEvent.click(toggle())
    fireEvent.click(toggle())
    expect(labels()).toContain('My Courses')

    // Opening the launcher must STILL auto-collapse.
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    expect(labels()).toContain('Certs')
    expect(labels()).not.toContain('My Courses')

    // Expanding inside, then leaving, restores the dashboard default.
    fireEvent.click(toggle())
    expect(labels()).toContain('My Courses')
    fireEvent.click(within(container).getByRole('button', { name: /back to/i }))
    expect(labels()).toContain('My Courses')

    /* REOPENING THE SAME COURSE restores the width chosen for it, and that is
       the one place the behaviour differs from the rule as stated ("clicking
       Compass auto-collapses").
       
       It is deliberate: the override is scoped by COURSE ID, so each course
       keeps its own. It reads as the product remembering a correction rather
       than re-imposing something the learner just undid. Forcing the collapse
       on every open needs a per-open counter, which needs a hook into the
       launcher's own `open` — pinned here so the difference is a recorded
       choice rather than something a later reader takes for a bug. */
    fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
    expect(labels()).toContain('My Courses')
  })

  it('hovers exactly like a rail row, and keeps its 3px indicator column', () => {
    /*
     * Hover was the one thing the row version missed on the first pass: it
     * matched its neighbours at rest and then sat inert under the cursor, which
     * reads as a disabled row rather than a control.
     *
     * It reads `HOVER_BG` and `IDLE_COLOR` — the SAME constants `RailRow`
     * reads, not copies — so the two cannot come to disagree about what a rail
     * row does under the cursor. Compared against a live row here rather than
     * against a literal, which is what makes that sharing the subject.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const rows = Array.from(rail.querySelectorAll<HTMLElement>('button'))
    const toggle = rows.find((b) => b.textContent === 'Collapse Menu')!
    // A NON-ACTIVE row: the active one has its own fill and never shows hover.
    const plain = rows.find((b) => /Resources/.test(b.textContent ?? ''))!
    fireEvent.mouseEnter(plain)
    fireEvent.mouseEnter(toggle)
    expect(toggle.style.background).toBe(plain.style.background)
    expect(toggle.style.color).toBe(plain.style.color)
    fireEvent.mouseLeave(toggle)
    fireEvent.mouseLeave(plain)
    expect(toggle.style.background).toBe(plain.style.background)

    /* THE 3px LEFT BORDER is not decoration: every nav row reserves it for the
       active indicator, so a row without one sits 3px left of the rest and the
       icons visibly fail to line up. The toggle has no active STATE — the rail
       is never "on" it — so the border stays transparent always. */
    expect(toggle.style.borderLeft).toBe('3px solid transparent')
    expect(plain.style.borderLeft).toMatch(/^3px solid/)
  })

  it('keeps 12px above the first rail item', () => {
    /* RESTORED 2026-09-17, reversing a change made earlier the same day. It
       went to 0 to "shift this up" while the collapse toggle sat at the TOP of
       the rail — that gave the nav a 28px row above the groups, so the padding
       was compounding a gap rather than creating one.
       
       The toggle moved to the foot, below Get Help. With nothing above Home,
       0 put the first row hard against the header's bottom edge, so the padding
       is doing its original job again. Verified in the browser: 12px above the
       first item in both rail widths. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/padding: `12px \$\{railCollapsed \? RAIL_GUTTER_COLLAPSED : RAIL_GUTTER\}px 40px`/)
  })

  it('no longer offsets the toggle against the rail gutter', () => {
    /* RETIRED 2026-09-17. This asserted the toggle hugged the rail's right edge
       via a negative margin cancelling `RAIL_GUTTER` — correct while it was a
       circular handle sitting on the seam between the rail and the page.
    
       It is an ordinary rail row below Get Help now, so it spans the column like
       its neighbours and needs no offset. What is pinned instead is the ABSENCE
       of the offset, because a stray negative margin on a full-width row would
       push it out of the column and look like a layout bug rather than a
       leftover.
    
       `RAIL_GUTTER` is still exported and still read by the wrapper's padding —
       it lost this consumer, not its purpose. */
    const { container } = renderShell('/dashboard-rebrand')
    const rail = container.querySelector<HTMLElement>('nav[aria-label="Primary"]')!
    const toggle = Array.from(rail.querySelectorAll('button')).find(
      (b) => b.textContent === 'Collapse Menu',
    )!
    expect(toggle.style.marginRight).toBe('')
    expect(toggle.style.alignSelf).toBe('')
    expect(RAIL_GUTTER).toBe(20)
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/RAIL_GUTTER_COLLAPSED : RAIL_GUTTER/)
  })

  it('scopes the override by COURSE, not by "in the launcher"', () => {
    /* The second bug, and the reason the scope is an id. With a boolean, a
       choice made inside one course matched the NEXT course too — both were
       simply "in the launcher" — so a rail expanded in course A opened expanded
       in course B and the auto-collapse never fired there. Asserted at SOURCE
       because this demo has one resume course, so the DOM cannot show two. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/scope: string \| null/)
    expect(shell).toMatch(/collapseOverride\.scope === launcher\.courseId/)
    // And no effect: a sync `setState` in one is a cascading render, and a lint
    // error this repo does not otherwise carry.
    expect(shell).not.toMatch(/useEffect\(\(\) => \{\s*setCollapseOverride/)
  })

  it('gives the rail’s width to the CONTENT column, keeping the 1440 sum', () => {
    /* 220 + 1220 expanded, 76 + 1364 collapsed. Both sum to 1440, the app's own
       design width — the figure the prototype frame's `min(1440px, …)` cap in
       tokens.css is justified by. Narrowing the rail without moving the total
       would silently shrink the shell's intended width, which is the defect
       that note records from the old 1280 cap. */
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toMatch(/'76px minmax\(0, 1364px\) 1fr'/)
    expect(shell).toMatch(/'220px minmax\(0, 1220px\) 1fr'/)
  })

  it('leaves CourseDetailPage live at its OWN route', () => {
    /* The reason this is reversible rather than archived: the page is untouched
       and still renders in full at `/courses/:id`. Restoring the launcher is
       swapping one element back, which is also why `courseId` is still passed
       to `CourseLauncherView` even though the placeholder ignores it. */
    const app = readFileSync('src/App.tsx', 'utf8')
    expect(app).toMatch(/path="\/courses\/:id"[^>]*CourseDetailPage/)
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(shell).not.toMatch(/<CourseDetailPage/)
    expect(shell).toMatch(/courseId\?: string/)
  })
})

describe('the KPI cells are bare, divided by rules', () => {
  /*
   * THE PAGE SURFACE NO LONGER RENDERS THESE CELLS — 2026-09-17. Two square
   * tiles (Study Pace, Readiness) took the row, and the three facts the cells
   * carried moved up to the course header band's stat row.
   *
   * The two tests that pinned the bare treatment ON THE PAGE are gone with it;
   * there is no surviving subject for them, and re-pointing them at the
   * `stat-card` variant would have been a different assertion wearing their
   * names (that variant keeps `bare` cells but a 10px gap, so "the rule IS the
   * separation" is not true there either).
   *
   * What they said, kept because it is the argument to re-read if the cells
   * ever come back: three tiles in a row read as three cards competing with the
   * Study Journey card beside them, so the cells went bare with a vertical rule
   * on the leading edge of cells 2 and 3 — never the first, which would fence
   * the row off from the block it belongs to — at `gap: 0`, because a gap on
   * top of a rule reads as two gutters. The rule was `--color-neutral-300`
   * (1.55:1 on the page grey, 1.81:1 dark) rather than `--color-border-subtle`
   * (1.29:1 / 1.38:1), which does the job of a boundary and is not visible
   * enough to be the only thing separating three data points.
   *
   * The navy card's TILED cells are untouched, and the test below still pins
   * them.
   */
  it('keeps the derived PACE reachable, on the stat-card variant', () => {
    /*
     * The Study Pace tile printed "~1.5 hrs/day · Suggested pace" until
     * 2026-09-17, when it was replaced with lo-fi lines. That figure is the one
     * DERIVED number on the version — the resume course's real 40 credit hours
     * over the days left — so losing it entirely would be losing the only thing
     * here that is computed from published data rather than chosen.
     *
     * It is not lost: `kpiSubLabels` still feeds it to `dashboard-clp-stats`'s
     * `stat-card` treatment. Pinned because NOTHING pinned it before — removing
     * it from the tile broke no test, which is exactly how a derivation gets
     * quietly deleted later.
     */
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'dashboard-clp-stats': { enabled: true, variant: 'stat-card' } }),
    )
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).toMatch(/hrs\/day suggested pace/i)
    // …and the tile it left does NOT print it twice.
    expect(container.textContent).not.toMatch(/Suggested pace/)
  })

  it('shows lo-fi lines in the Study Pace tile, matching Readiness', () => {
    // The same primitive in both, so the pair reads as one unbuilt set rather
    // than two placeholder treatments a few pixels apart.
    const { container } = renderShell('/dashboard-rebrand')
    const tiles = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.aspectRatio === '1 / 1',
    )
    expect(tiles).toHaveLength(2)
    for (const tile of tiles) {
      expect(tile.querySelector('[role="region"]')).toBeTruthy()
    }
    // The pace tile keeps its STATUS, which is the half that was never a
    // placeholder — the pill and the message the strip used to carry.
    const pace = tiles.find((t) => /Study Pace/i.test(t.textContent ?? ''))!
    expect(pace.textContent).toMatch(/On Track/)
    expect(pace.textContent).not.toMatch(/hrs\/day/)
  })

  it('no longer renders them on the page surface — the tiles took the row', () => {
    const { container } = renderShell('/dashboard-rebrand')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const row = Array.from(half.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.display === 'grid' && /Target Date/i.test(d.textContent ?? ''),
    )
    expect(row).toBeUndefined()
    expect(half.textContent).toMatch(/Study Pace/)
    expect(half.textContent).toMatch(/Readiness/)
  })

  it('keeps the TILED treatment on the navy card', () => {
    // Bare cells on navy would lose the translucent fills that make them read
    // as cells at all. The split is by surface, not a global restyle.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const row = Array.from(half.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.display === 'grid' && /Deadline/i.test(d.textContent ?? ''),
    )!
    const first = row.children[0] as HTMLElement
    expect(first.style.background).not.toBe('')
    expect(first.style.borderRadius).toBe('var(--radius-md)')
    expect(row.style.gap).toBe('10px')
  })
})

describe('Time Remaining is a day countdown, with no At Risk treatment', () => {
  /** The band's KPI row, found by its Target Date cell. */
  /* `kpiRow` lived here and found the Time Remaining cell. The cell left with
     the KPI row on 2026-09-17; the countdown is the course header band's stat
     row now, and this turns that band on so the figure has somewhere to be. */
  function seedCourseHeader() {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ ...CLASSIC_FLAGS, 'dashboard-course-header': { enabled: true, variant: 'band' } }),
    )
  }

  it('reads "27 days" rather than a number of weeks', () => {
    // The Time Remaining KPI cell was this assertion's home until 2026-09-17,
    // when the tiles took the row. The countdown is the course header band's
    // stat row now, so that is where it is read.
    seedCourseHeader()
    const { container } = renderShell('/dashboard-rebrand')
    const row = Array.from(container.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.justifyContent === 'space-between' && d.style.alignItems === 'center',
    )!
    expect(row.textContent).toMatch(/Left to complete/i)
    expect(row.textContent).toMatch(/27\s*days/i)
    expect(row.textContent).not.toMatch(/wks/i)
  })

  it('the page states its countdown ONLY via the header band', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    /*
     * A DEPENDENCY, pinned so it cannot change silently in either direction.
     *
     * Target Date and Time Remaining were the block's own KPI cells; the tiles
     * replaced them on 2026-09-17 and the course header band is the only thing
     * that states either fact now. That band is behind
     * `dashboard-course-header`, whose default is `none` — so at the COMMITTED
     * default neither figure appears on Home.
     *
     * That is recorded rather than asserted as correct: the fix, if it is
     * wrong, is to default the flag to `band`, and this test is what tells
     * whoever does that it was a known consequence rather than a coincidence.
     */
    const bare = renderShell('/dashboard-rebrand')
    expect(bare.container.textContent).not.toMatch(/27 days/)
    expect(bare.container.textContent).not.toMatch(/12\/15\/2026|December 15, 2026/)
    bare.unmount()
    seedCourseHeader()
    const withBand = renderShell('/dashboard-rebrand')
    expect(withBand.container.textContent).toMatch(/27 days/)
    expect(withBand.container.textContent).toMatch(/December 15, 2026/)
  })

  it('never renders the fraction the fixture actually carries', () => {
    // `weeksLeft` is 27/7. The cell used to interpolate it directly
    // (`${weeksLeft} wks`), which would have printed 3.857142857142857 — the
    // defect that made the shared formatter a prerequisite rather than a tidy.
    const { container } = renderShell('/dashboard-rebrand')
    expect(container.textContent).not.toMatch(/3\.85/)
  })

  it('agrees with the detail sheet, because both read one formatter', () => {
    expect(timeRemainingText(27 / 7)).toBe('27 days')
    // The three bands that hand-rolled `Math.floor(weeksLeft / 52)` are the
    // ones that would print the fraction; none may still do that arithmetic.
    for (const f of [
      'src/components/membership/v5/LearnerFocusedBand.tsx',
      'src/components/membership/v5/MarketingFocusedBand.tsx',
      'src/components/membership/v5/EmptyPathBuildBand.tsx',
    ]) {
      const src = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      expect(src, f).not.toMatch(/weeksLeft\s*[%/]\s*52/)
      expect(src, f).not.toMatch(/\$\{weeksLeft\}\s*wks/)
    }
  })

  it('applies NO At Risk treatment at 27 days', () => {
    // The explicit ask, and it holds because the status is not derived from
    // this number: `STATUS_BY_VARIANT` supplies a `statusOverride` that every
    // band and the detail sheet prefer over their `weeksLeft`-based
    // `derivedStatus`. Asserted through the RENDERED strip rather than the
    // fixture, since the override only matters if the surface honours it.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    expect(persona.renewal!.weeksLeft * 7).toBe(27)
    expect(persona.status).toBe('on-track')
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.textContent).toMatch(/On Track/i)
    expect(band.textContent).not.toMatch(/At Risk/i)
    // The countdown takes no urgent tint — the whole point of "no At Risk
    // treatment" is that the number gets louder and nothing else. Read on the
    // Study Pace tile, which carries the status since the KPI row left.
    const tile = Array.from(band.querySelectorAll<HTMLElement>('div')).find((d) =>
      /Study Pace/i.test(d.textContent ?? '') && d.style.aspectRatio === '1 / 1',
    )!
    expect(tile).toBeTruthy()
    expect(tile.textContent).toMatch(/On Track/)
    expect(tile.textContent).not.toMatch(/At Risk/i)
  })

  it('leaves the OTHER demo states alone', () => {
    // A shared map: moving one row must not move the rest. At Risk in
    // particular is the state whose 3 weeks is load-bearing.
    const at = dashboardProgressPersonaFor('xcel', 'progress-at-risk', 'qe')!
    expect(at.renewal!.weeksLeft).toBe(3)
    expect(timeRemainingText(at.renewal!.weeksLeft)).toBe('21 days')
    const off = dashboardProgressPersonaFor('xcel', 'progress-off-track', 'qe')!
    expect(off.renewal!.weeksLeft).toBe(12)
    expect(timeRemainingText(off.renewal!.weeksLeft)).toBe('12 wks')
  })
})

describe('the status is the detail panel\'s own strip', () => {
  it('drops the tinted STRIP on the page, keeping its data in the tile', () => {
    /*
     * `StatusStrip` was the page surface's status treatment, and the reason
     * given for using the real component rather than a lookalike was that the
     * Progress section directly below rendered the same strip. That section was
     * removed, and on 2026-09-17 the strip itself left the page surface with
     * the KPI row — the Study Pace tile carries the status now.
     *
     * The tile stacks the pill ABOVE the message, where the strip sets them
     * side by side; in a 264px square the strip's row leaves the message about
     * 150px and four lines deep. So the layout is the tile's own — but the
     * DATA is not: the label and the message both come from `statusTreatment`,
     * the same source the strip reads, which is what stops the two describing
     * one status differently.
     *
     * The strip's tinted wash is deliberately not reproduced. Its own note
     * records it at ~1.02:1 — a hue shift, decoration — and a tinted band
     * inside a bordered tile reads as a second card, which is the call `bare`
     * already makes for the stat card.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const strips = Array.from(container.querySelectorAll<HTMLElement>('div')).filter(
      (d) => d.style.background === STATUS_STRIP_BG['on-track'],
    )
    expect(strips).toHaveLength(0)
    const treatment = statusTreatment('on-track', 'compliance')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const tile = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.aspectRatio === '1 / 1' && /Study Pace/i.test(d.textContent ?? ''),
    )!
    expect(tile.textContent).toContain(treatment.label)
    // The pill keeps the shared treatment's fill and ink — the state is still
    // in colour AND in words.
    const pill = Array.from(tile.querySelectorAll<HTMLElement>('span')).find(
      (el) => el.textContent?.trim() === treatment.label,
    )!
    expect(pill.style.color).toBe(treatment.text)
    expect(pill.style.background).toBe(treatment.fill)
  })

  it('drops the "Status" caption', () => {
    // A pill reading "On Track" beside a sentence about the deadline does not
    // need a column telling you it is a status — and that column cost 104px of
    // a narrow block.
    const { container } = renderShell('/dashboard-rebrand')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    // No trailing `\b`: the DOM renders the caption and the pill adjacent, as
    // "StatusOn Track", so `\bStatus\b` never matches and the assertion would
    // pass whether the caption was there or not.
    expect(half.textContent).not.toMatch(/Status/)
    // …but the status itself is still there, in words. Never colour alone.
    expect(half.textContent).toMatch(/On Track/)
  })

  it('keeps the captioned box on the navy card', () => {
    // The strip's pale tint composites over `--color-surface-card` and would
    // disappear into the navy; the captioned box's translucent white fill is
    // what makes the row read as a panel there.
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    expect(half.textContent).toMatch(/Status/)
  })
})

describe('the meta line follows the surface', () => {
  it('is not white on the page grey', () => {
    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about
    // the block's own header treatment, which the new `band` default hides.
    seedClassic()
    // REGRESSION, fixed 2026-09-16. `metaRow` is assembled ABOVE the navy
    // half's markup, so the `surface='page'` colour swaps — applied across that
    // markup — missed it: the line rendered `rgb(255 255 255 / 0.66)` on
    // #f5f5f5, roughly 1.2:1, and read as content that had failed to load.
    // tsc was clean and every test passed.
    const { container } = renderShell('/dashboard-rebrand')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    // The DEEPEST div that carries a colour and the text — an ancestor matches
    // the text too and has no inline colour of its own.
    const meta = Array.from(half.querySelectorAll<HTMLElement>('div'))
      .filter((d) => /Insurance Pre-Licensing/.test(d.textContent ?? '') && d.style.color)
      .pop()!
    expect(meta.style.color).not.toMatch(/255,?\s*255,?\s*255/)
    expect(meta.style.color).toBe('var(--color-text-secondary)')
  })

  it('keeps the on-dark value on the navy card', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    const half = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
      .children[0] as HTMLElement
    const meta = Array.from(half.querySelectorAll<HTMLElement>('div'))
      .filter((d) => /Insurance Continuing Education/.test(d.textContent ?? '') && d.style.color)
      .pop()!
    // jsdom normalises the `rgb(255 255 255 / 0.66)` form to `rgba(...)`.
    expect(meta.style.color).toMatch(/255,?\s*255,?\s*255/)
  })
})

describe('milestones are marked by the NODE, not by red text', () => {
  it('gives every stop title the same ink', () => {
    // The titles were Brick red on assessment stops for a day. Red reads as a
    // problem, and "Exam Simulators · 6 hrs · Not started" in red looked like a
    // failure rather than a step not reached — worse because the two milestones
    // happen to be the two not-started stops. Same tension CLAUDE.md records on
    // the readiness gauge: red on a CHAPTER is actionable, red on YOU is
    // discouraging, and an unreached milestone is the second kind.
    /* WHAT THIS PINS NARROWED on 2026-09-17, and the reason it had to.
     *
     * It asserted every stop title carried ONE inline ink. Selectable titles
     * now take `.cre-stop-title` (blue, underlining on hover) and therefore set
     * no inline colour at all, so "one ink for all" is no longer true and
     * should not be: a row that opens something and a row that cannot are
     * deliberately different now.
     *
     * The rule it was actually protecting is untouched, so that is what it
     * checks: NO stop title is on the CTA/Brick ramp. Red on an unreached
     * milestone read as a failure rather than a step not yet taken.
     */
    const { container } = renderShell('/dashboard-rebrand')
    const titles = Array.from(
      container.querySelectorAll<HTMLElement>('.cre-journey-stop'),
    ).map((b) => b.querySelector('span span') as HTMLElement)
    expect(titles.length).toBeGreaterThan(0)
    for (const t of titles) {
      expect(t.style.color).not.toMatch(/cta|category/)
    }
    /* The BLOCKED rows share one ink between them — they are all the same
       state, so a difference among them would be meaningless.
       
       Read from the LIST ITEMS, not from `.cre-journey-stop`: that class is on
       the interactive rows only, so a blocked stop has none and the earlier
       version of this filter came back empty and passed vacuously. */
    const list = container.querySelector('ol[aria-label="Study journey stops"]')!
    const blocked = Array.from(list.querySelectorAll<HTMLElement>('li'))
      .filter((li) => !li.querySelector('.cre-stop-title'))
      .map((li) => li.querySelector<HTMLElement>('span[style*="letter-spacing"]')!)
    expect(blocked.length).toBeGreaterThan(0)
    expect(new Set(blocked.map((t) => t.style.color)).size).toBe(1)
    expect(blocked[0].style.color).toBe('var(--color-text-tertiary)')
  })

  it('still marks them — on the node, in the strong ink', () => {
    // The distinction has to survive losing the colour, or the change just
    // removed it. `--color-text-primary` against an ordinary stop's
    // `--color-text-tertiary` ring: 11.37:1 vs 6.19:1 on the card (13.67 vs
    // 6.18 dark), so it reads as a weight of ink rather than a hue.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const stops = journeyStopsFor(persona.path)
    // One milestone: the simulators, which are the only assessment in the
    // programme. "Exam Cram" left with the hours model — no such product.
    expect(stops.filter((st) => st.milestone).map((st) => st.title)).toEqual(['Exam Simulators'])
  })

  it('leaves no Brick on the page', () => {
    // `.cre-journey-milestone` was the last thing wearing it. Asserted at the
    // stylesheet so re-adding the class is a deliberate act.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).not.toMatch(/^\.cre-journey-milestone \{/m)
  })
})

describe('Jump Back In is INSIDE the progress block', () => {
  /*
   * 2026-09-16. It was a card of its own below the block — art, title, meta,
   * progress bar, Resume CTA — and every one of those was already in the block
   * above it. The column read as one thing said twice.
   *
   * RESTORED 2026-09-17 as a DIFFERENT card, which is why this describe kept
   * its other assertions: the art, the title and the percentage stayed where
   * they moved to, and the widget came back carrying the one thing none of them
   * says — which CHAPTER the learner is in. The duplication that removed it is
   * still absent, and that is what these now pin.
   */
  it('renders the card, and it does NOT repeat the block’s facts', () => {
    const { container } = renderShell('/dashboard-rebrand')
    const card = screen.getByRole('region', { name: /jump back in/i })
    // The chapter, which is the reason it exists.
    expect(card.textContent).toMatch(/Lesson 27/)
    expect(card.textContent).toMatch(/Life Insurance Policy Provisions/)
    /* NOT the COURSE ART — the header band shows it at 130px two inches up, and
       a second smaller copy of one photograph is what archived this card.

       Asserted on the src rather than as "no <img> at all": the card gained one
       on 2026-09-17 for the brand-style mark in its well, so a blanket check
       would now fail for the wrong reason — and would have passed vacuously if
       the mark had been a background image. */
    const imgs = Array.from(card.querySelectorAll('img')).map((el) => el.getAttribute('src') ?? '')
    expect(imgs.some((src) => /\/courses\//.test(src))).toBe(false)
    /* NO IMAGE AT ALL as of 2026-09-17. The card briefly carried an `<img>` for
       the supplied `JUMP_BACK_IN_MARK` artwork, in a 44px well beside the
       title; the well went when the glyph moved into the eyebrow, and the mark
       slot went with it.
       
       `JUMP_BACK_IN_MARK` is still exported and still points at the file to
       drop in — asserted here so the path is not quietly lost, since the
       artwork was supplied and has simply not landed yet. */
    expect(imgs).toHaveLength(0)
    expect(JUMP_BACK_IN_MARK).toMatch(/^\/brand\//)
    // The glyph is in the eyebrow now, at the tiles' own 13px.
    const eyebrow = card.querySelector('p')!
    expect(eyebrow.querySelector('svg')).toBeTruthy()
    expect(eyebrow.querySelector('svg')!.getAttribute('width')).toBe('13')
    // NOT the percentage, and no bar: the header band runs a full-width one for
    // the same course with the figure beside it.
    expect(card.textContent).not.toMatch(/\d+%/)
    // NOT the course title, which the page header already carries.
    expect(card.textContent).not.toMatch(/New York Life and Health Pre-licensing/)
    // ONE resume button in the band, not the card's plus a loose one.
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
  })

  it('sources the chapter TITLE and derives only the number', () => {
    /*
     * The rule this version has held throughout is that it authors no
     * lesson-level content. The title here is not authored: it is the fifth of
     * the twelve chapters decoded from the study guide XCEL's own New York page
     * links, which is exactly what that recovered list was kept for.
     *
     * The NUMBER is derived from progress — 26 of 42 complete, so the next one
     * is 27.
     *
     * WHAT IS NOT SOURCED is the pairing: nothing published maps a lesson
     * number onto a chapter, so 27 and this title come from different numbering
     * systems (the title is chapter 5 of 12 in the list's own order). Asserted
     * here so that is a recorded choice rather than something a later reader
     * takes for a fact.
     */
    expect(NY_LH_GUIDE_CHAPTERS_PARTIAL).toContain(NY_LH_CURRENT_CHAPTER)
    expect(NY_LH_CURRENT_CHAPTER).toBe('Life Insurance Policy Provisions, Options and Riders')
    // The number tracks the fixture rather than being typed into the card.
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe')!
    const cats = resolvePathCategories(persona.path)
    const done = cats.reduce((sum, c) => sum + c.completed, 0)
    renderShell('/dashboard-rebrand')
    const card = screen.getByRole('region', { name: /jump back in/i })
    // The chapter and the title are separate elements, so `textContent` reads
    // "Chapter 27Life Insurance…" with no space — a trailing `\b` never
    // matches. Compare the element's own text instead.
    const chapterLine = card.querySelectorAll('p')[1]
    // "Chapter 27" and "Part 1 of 3" are separate text nodes either side of a
    // decorative dot, so `textContent` runs them together.
    expect(chapterLine.textContent).toContain(`Lesson ${done + 1}`)
    expect(done + 1).toBe(27)
  })

  it('names the CTA "Resume", with room either side', () => {
    /* The label, pinned here because the surrounding tests were loosened to
       `/^resume\b/` when it changed — without this, "the CTA exists" would be
       the only thing left and the wording could drift unnoticed.
       
       The PADDING is pinned with it because there was none: the button carried
       `height: 44` and no horizontal padding at all, so the label sat hard
       against both edges. That was invisible while the label was two short
       words and obvious the moment it became four. */
    renderShell('/dashboard-rebrand')
    const card = screen.getByRole('region', { name: /jump back in/i })
    const cta = within(card).getByRole('button', { name: /^resume\b/i })
    expect(cta.textContent).toMatch(/^\s*Resume\s*$/)
    // jsdom normalises the shorthand to `0px 20px`, so read the resolved
    // longhand rather than the source spelling.
    expect(cta.style.paddingLeft).toBe('20px')
    expect(cta.style.paddingRight).toBe('20px')
  })

  it('derives the PART from the categories, against the published count', () => {
    /* "Part 1 of 3" is XCEL's own 3-Part Training Program — Pre-licensing
       Course, Prep Review Course, Exam Simulator — confirmed from the product
       page, so the 3 is published rather than counted off the journey. The
       journey shows FOUR stops because it adds the attestation, which happens
       after the programme; counting those would print "of 4".
       
       The part NUMBER is the first category the learner has not finished, in
       curriculum order. Swept across the progress states rather than asserted
       at the default, and clamped — without the clamp a learner past the third
       category reads "Part 4 of 3". */
    expect(NY_LH_PROGRAM_PARTS).toBe(3)
    renderShell('/dashboard-rebrand')
    const card = screen.getByRole('region', { name: /jump back in/i })
    expect(card.querySelectorAll('p')[1].textContent).toContain(
      `Part 1 of ${NY_LH_PROGRAM_PARTS}`,
    )
    for (const opt of DASHBOARD_PROGRESS_PICKER) {
      const persona = dashboardProgressPersonaFor('xcel', opt.variant, 'qe')
      if (!persona) continue
      const cats = resolvePathCategories(persona.path)
      const raw = cats.findIndex((c) => c.completed < c.required) + 1 || cats.length
      const part = Math.min(NY_LH_PROGRAM_PARTS, Math.max(1, raw))
      expect(part, opt.variant).toBeGreaterThanOrEqual(1)
      expect(part, opt.variant).toBeLessThanOrEqual(NY_LH_PROGRAM_PARTS)
    }
  })

  it('prints the estimate from the flagged INVENTED constant', () => {
    /*
     * THIS TEST IS INVERTED FROM WHAT IT SAID, and the reversal is the point.
     *
     * It used to assert the card printed no per-lesson timing at all: the
     * reference mock's "· 14 minutes left" was refused three times because
     * nothing in the fixtures knows how long a lesson takes, and that refusal
     * was one of this version's standing rules.
     *
     * On 2026-09-17 Jillienne asked for "Estimated Time to Complete: 18
     * minutes", so the line is on the card. What the rule becomes, rather than
     * disappearing, is this: the figure must come from
     * `NY_LH_LESSON_MINUTES_INVENTED` — a constant whose NAME says it is a
     * guess, sitting with the other three `_INVENTED` figures a reader greps
     * for — and never from a literal typed into the component.
     *
     * So a real per-lesson duration is one edit, and nobody can mistake the 18
     * for something XCEL publishes. The storefront states 40 credit hours and
     * "less than 2 weeks"; neither divides into a per-lesson figure honestly.
     */
    renderShell('/dashboard-rebrand')
    const card = screen.getByRole('region', { name: /jump back in/i })
    expect(card.textContent).toContain(
      `Estimated Time to Complete: ${NY_LH_LESSON_MINUTES_INVENTED} minutes`,
    )
    // The name is the guard: it must stay greppable alongside the others.
    const src = readFileSync('src/data/nyProducerRequirements.ts', 'utf8')
    expect(src).toMatch(/NY_LH_LESSON_MINUTES_INVENTED/)
    // …and the component must not carry the number itself.
    const widget = readFileSync('src/components/learning/JumpBackInWidget.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(widget).not.toMatch(/\b18\b/)
  })

  it('puts the course art to the LEFT of the block title, at 132x112', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const title = within(band).getByRole('button', {
      name: /New York Life and Health Pre-licensing/i,
    })
    const cover = band.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(cover).toBeTruthy()
    // 132×88, up from 84×56 and still 3:2. At thumbnail size it read as a chip
    // beside the title; this size reads as the course, which is what it is now
    // that there is no separate Jump Back In card to carry one.
    expect(cover.style.width).toBe('132px')
    // TALLER than 3:2 since 2026-09-16 — the text column beside it grew a
    // progress bar under the meta, and a 3:2 crop finished well above that
    // stack, reading as a thumbnail left behind. The WIDTH is what is held now;
    // `object-fit: cover` does the cropping, so the photo is never distorted.
    expect(cover.style.height).toBe('112px')
    expect(cover.style.objectFit).toBe('cover')
    // No border: on the page grey it would box the one thing here that already
    // has edges.
    expect(cover.style.border).toBe('')
    expect(cover.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('names the course\'s OWN art, with a fallback for the missing file', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // An `<img onError>`, not a CSS background — that is what lets the path be
    // authored before the asset lands, the `FeaturePreviewThumb` mechanism.
    // Without it, pointing at a missing file is the defect the Resources
    // section shipped four of.
    const { container } = renderShell('/dashboard-rebrand')
    const cover = container.querySelector<HTMLImageElement>(
      '.cre-learner-focused-band img[aria-hidden]',
    )!
    expect(cover.getAttribute('src')).toBe(NY_LH_COURSE_IMAGE)
    const src = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
    expect(src).toMatch(/onError=/)
    expect(src).toMatch(/getCourseImage\(resume\?\.id \?\? path\.id\)/)
    // Decorative — the title says the course, so the alt is empty rather than a
    // second reading of it.
    expect(cover.getAttribute('alt')).toBe('')
  })

  it('lifts the eyebrow ABOVE the art and the title', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // It was inside the text column beside the cover, which made it the
    // course's label rather than the block's.
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const eyebrow = within(band).getByText(CURRENT_LEARNING_EYEBROW)
    const cover = band.querySelector<HTMLImageElement>('img[aria-hidden]')!
    expect(eyebrow.compareDocumentPosition(cover) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and it is not a sibling of the title any more — the row below it is a
    // plain two-column pairing.
    expect(eyebrow.parentElement).toBe(cover.parentElement?.parentElement)
  })

  it('brings the Resume CTA into the block, after the header', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    const cta = within(band).getByRole('button', { name: /^resume\b/i })
    // 44px stays 44px — the minimum comfortable touch target and the biggest
    // thing in its half.
    expect(cta.style.height).toBe('44px')
    // At the eye's second stop, not in the header row above the number that
    // motivates it. The two rejected placements are named at `resumeInline`.
    // Measured against the PROGRESS BAR rather than the gauge — the donut it
    // used to follow is gone, replaced by that bar.
    const bar = Array.from(band.querySelectorAll<HTMLElement>('div')).find(
      (d) => d.style.background === 'var(--color-neutral-300)',
    )!
    expect(bar.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows ONE course, once — the art and the CTA are the same one', () => {

    // Pins the CLASSIC variant trio — see `seedClassic`. This test is about

    // the block's own header treatment, which the new `band` default hides.

    seedClassic()
    // The duplication that removed the card: two titles, two covers, two
    // percentages for one course.
    const { container } = renderShell('/dashboard-rebrand')
    const band = container.querySelector<HTMLElement>('.cre-learner-focused-band')!
    expect(band.querySelectorAll('img[aria-hidden]')).toHaveLength(1)
    expect(within(band).getAllByRole('button', { name: /^resume\b/i })).toHaveLength(1)
  })

  it('is no longer ARCHIVED, because it is wired again', () => {
    // The archive convention is for things that are unwired and kept. This one
    // came back on 2026-09-17, so its row went — an archive row pointing at a
    // live component tells the next reader to restore something that is already
    // there, which is the same failure as a restoreNote that has gone false.
    const src = readFileSync('src/data/archivedItems.ts', 'utf8')
    expect(src).not.toMatch(/jump-back-in-widget/)
    const band = readFileSync('src/components/membership/v5/LearnerFocusedBand.tsx', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    expect(band).toMatch(/<JumpBackInWidget/)
  })

  it('leaves the NAVY versions own resume block alone', () => {
    // The inline block is page-surface only. On navy the white half still
    // renders the full resume block, and two in one band is the duplication
    // this removed.
    renderShell('/dashboard-rebrand?version=discoverability-learner-focused')
    expect(screen.getAllByRole('button', { name: /^resume\b/i }).length).toBeGreaterThan(0)
  })
})
