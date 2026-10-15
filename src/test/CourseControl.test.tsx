import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { CompassCourseRail } from '@/components/compass/CompassCourseRail'
import { AccountProvider } from '@/context/AccountContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import {
  COURSE_FLAG_KEY,
  COURSE_PICKER,
  chosenCourse,
  courseCePathIdFor,
  coursePathIdFor,
  isCoursePathCe,
  courseStateFor,
  isRegulatedCourse,
  resolveSelection,
  EXPIRY_FLAG_KEY,
  EXPIRY_PICKER,
  chosenExpiryDays,
  resolveExpiry,
} from '@/data/courseFixtures'
import {
  COMPASS_SAMPLE_TOC_FROM_DESIGN,
  applyCourseSequencing,
  compassTocFor,
} from '@/data/compassCourseFixtures'
import { readinessFor, readinessForState } from '@/data/readinessFixtures'
import { studyCalendarFor } from '@/data/studyCalendarFixtures'
import { learningPathsFor } from '@/data/learningFixtures'
import { courseExpiryState } from '@/data/courseExpiry'
import { daysUntil } from '@/lib/studyPace'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import { E2E_COURSE_TITLE_SHORT } from '@/pages/endToEndDemo'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import {
  GET_LICENSED_STEPS,
  NY_GOVERNING_AGENCY,
  examFactsFor,
  getLicensedStepsFor,
  governingAgencyFor,
  jurisdictionName,
} from '@/data/nyProducerRequirements'
import type { CompassTocSection } from '@/components/compass/CompassCourseRail.types'
import {
  applyJourneySequencing,
  journeyStopsFor,
  whiteJourneyTitles,
  type JourneyStop,
} from '@/components/learning/studyJourneyUtil'

/**
 * THE COURSE AXIS — Florida / Texas, and the Regulated sequencing nested under
 * it. Added 2026-10-15 with the Demo Controls bar's Course dropdown.
 *
 * What this file is actually guarding, in order of how badly it would hurt:
 *
 *   1. **`main` DID NOT MOVE.** The whole axis is a second option beside what
 *      the dashboard already showed, and the committed defaults say so. If
 *      the Florida/Unregulated defaults ever drift, every stakeholder link
 *      that has ever been shared starts opening on something else.
 *   2. **NEW YORK IS UNTOUCHED.** The QE journey's licence is a different
 *      axis with confirmed, published figures. This control has no New York
 *      arm and must not grow one by accident.
 *   3. **TEXAS IS A COURSE, NOT A RELABEL.** A flip has to re-resolve the
 *      fixtures, not re-render Florida's with a word swapped — which is the
 *      cheap failure this axis exists to avoid.
 *   4. **THE LOCK IS DERIVED AND IT IS UNCLICKABLE**, in that order.
 */

function seedXcel() {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'non-member' }))
}

function renderBar() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <FeatureFlagPanelProvider>
            <DashboardVersionsPanelProvider>
              <DemoControlsBar />
            </DashboardVersionsPanelProvider>
          </FeatureFlagPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Open the Course dropdown. */
function openCourse() {
  fireEvent.click(screen.getByRole('button', { name: /Course:/i }))
}

/* `radiogroup` is its own ARIA role, not a flavour of `group` — querying for
   `group` finds neither of these, which is the first thing this file got
   wrong. */
const courseGroup = () => screen.getByRole('radiogroup', { name: 'Course' })
const sequencingGroup = () => screen.getByRole('radiogroup', { name: 'Sequencing' })

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  seedXcel()
})

describe('the committed defaults — a plain load of main is unchanged', () => {
  const def = FEATURE_FLAGS.find((f) => f.key === COURSE_FLAG_KEY)!

  it('is in the catalog, with both axes', () => {
    expect(def).toBeDefined()
    expect(def.variants?.map((v) => v.value)).toEqual(['auto', 'ny', 'fl', 'tx'])
    expect(def.secondaryVariants?.map((v) => v.value)).toEqual(['unregulated', 'regulated'])
  })

  /* ⚠ THE LOAD-BEARING ASSERTION IN THIS FILE. `auto` + `unregulated` is what
     makes the branch additive. Changing them is a `promote-to-prototype`
     decision, not an edit — if this fails, that is the conversation. */
  it('opens on Automatic, unregulated', () => {
    expect(def.defaultVariant).toBe('auto')
    expect(def.defaultSecondaryVariant).toBe('unregulated')
    expect(resolveSelection(def.defaultVariant)).toBe('auto')
    expect(chosenCourse('auto')).toBeUndefined()
    expect(isRegulatedCourse(def.defaultSecondaryVariant)).toBe(false)
  })

  /*
   * ⚠ WHY `auto` AND NOT A JURISDICTION — the assertion that explains the
   * design, and the one that caught two wrong defaults in a day.
   *
   * `main` does not demo ONE licence: the qualifying journey has shown New
   * York since 2026-09-16 and CE and exam prep have always shown Florida.
   * `fl` as the default therefore changed the page every stakeholder lands
   * on; `ny` changed Learner Focused's renewal cycle, which
   * `QeFocusedVersion.test.tsx` has a test about by name. `auto` changes
   * neither, because it passes no course at all.
   */
  it('on Automatic, every journey resolves what it resolved before the axis', () => {
    const auto = chosenCourse('auto')
    expect(dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', auto)!.path.state).toBe('NY')
    expect(dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce', auto)!.path.state).toBe('FL')
    expect(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'exam-prep', auto)!.path.state,
    ).toBe('FL')
  })

  it('degrades an unrecognised variant to Automatic rather than throwing', () => {
    // A stale `?ff=dashboard-course-state:ca` from a shared link, or a
    // localStorage entry written by a future build.
    expect(resolveSelection('ca')).toBe('auto')
    expect(resolveSelection(undefined)).toBe('auto')
    expect(isRegulatedCourse('whatever')).toBe(false)
  })
})

describe('the Course dropdown on the Demo Controls bar', () => {
  it('shows the active selection on the pill, Automatic by default', () => {
    renderBar()
    expect(screen.getByRole('button', { name: /Course:.*Automatic/i })).toBeTruthy()
  })

  /* TWO GROUPS, TWO ROLES. The panel is a `menu` holding two radiogroups
     rather than one radiogroup holding four radios — otherwise a screen
     reader announces "1 of 4" across two unrelated questions. */
  it('holds a Course group and a Sequencing group, each its own radiogroup', () => {
    renderBar()
    openCourse()
    expect(within(courseGroup()).getAllByRole('radio')).toHaveLength(COURSE_PICKER.length)
    expect(within(sequencingGroup()).getAllByRole('radio')).toHaveLength(2)
  })

  it('offers every course plus Automatic, with Automatic checked', () => {
    renderBar()
    openCourse()
    const [auto, ny, fl, tx] = within(courseGroup()).getAllByRole('radio')
    expect(auto.textContent).toMatch(/Automatic/)
    expect(ny.textContent).toMatch(/New York Life & Health Pre-Licensing/)
    expect(fl.textContent).toMatch(/Florida Life & Health Pre-Licensing/)
    expect(tx.textContent).toMatch(/Texas Life & Health Pre-Licensing/)
    expect(auto.getAttribute('aria-checked')).toBe('true')
    expect(fl.getAttribute('aria-checked')).toBe('false')
  })

  it('picks Texas, and the pill follows', () => {
    renderBar()
    openCourse()
    fireEvent.click(within(courseGroup()).getByRole('radio', { name: /Texas/i }))
    expect(
      screen.getByRole('button', { name: /Course:.*Texas Life & Health Pre-Licensing/i }),
    ).toBeTruthy()
  })

  it('picks Regulated without disturbing the course', () => {
    renderBar()
    openCourse()
    fireEvent.click(within(courseGroup()).getByRole('radio', { name: /Texas/i }))
    openCourse()
    fireEvent.click(within(sequencingGroup()).getByRole('radio', { name: 'Regulated' }))
    openCourse()
    // The two axes are independent: setting one must not reset the other.
    expect(
      within(courseGroup()).getByRole('radio', { name: /Texas/i }).getAttribute('aria-checked'),
    ).toBe('true')
    expect(
      within(sequencingGroup())
        .getByRole('radio', { name: 'Regulated' })
        .getAttribute('aria-checked'),
    ).toBe('true')
  })
})

describe('Texas is a second COURSE, not a relabelled Florida', () => {
  it('resolves its own jurisdiction and path id', () => {
    expect(courseStateFor('fl')).toBe('FL')
    expect(courseStateFor('tx')).toBe('TX')
    expect(coursePathIdFor('tx')).toBe('xcel-tx-lh-prelicensing')
    expect(jurisdictionName('TX')).toBe('Texas')
  })

  it('has its own readiness breakdown, a different shape from Florida’s', () => {
    const fl = readinessFor('xcel', 'fl')
    const tx = readinessFor('xcel', 'tx')
    expect(tx.pathTitle).toMatch(/Texas/)
    // Not the same chapter list with one word changed — a different length.
    expect(tx.chapters.length).not.toBe(fl.chapters.length)
    expect(tx.chapters.map((c) => c.title)).not.toEqual(fl.chapters.map((c) => c.title))
    // And nothing Floridian survived the swap.
    expect(JSON.stringify(tx)).not.toMatch(/Florida/)
  })

  /* THE STAT CELL COUNTS THE COURSE IT IS SHOWING. It read "of 20" and "of
     14" from literals, which were Florida's counts — on Texas that would have
     printed a denominator the breakdown below it could not support. */
  it('counts chapters and topics from the course, not from a literal', () => {
    const tx = readinessForState('xcel', 'on-track', 90, 'tx')
    const chapters = tx.progress.find((p) => p.label === 'Chapters Completed')!
    const topics = tx.progress.find((p) => p.label === 'Topics Covered')!
    expect(chapters.value).toMatch(new RegExp(`of ${readinessFor('xcel', 'tx').chapters.length}$`))
    expect(topics.value).toMatch(new RegExp(`of ${readinessFor('xcel', 'tx').topics.length}$`))
  })

  it('has its own study plan, named for its own exam', () => {
    const plan = studyCalendarFor(coursePathIdFor('tx'))
    expect(plan.examName).toMatch(/Texas/)
    expect(plan.weekThemes?.join(' ')).toMatch(/Texas/)
    expect(plan.weekThemes?.join(' ')).not.toMatch(/Florida/)
    // No task may still name the other state — that is the plan contradicting
    // the course heading above it.
    expect(plan.tasks.some((t) => t.title.includes('Florida'))).toBe(false)
  })

  /* ONE DATE, TWO FILES — the invariant the Florida pair already holds, now
     held by the Texas pair too. The path fixture and the study plan both name
     an exam date, and a learner reads them on adjacent surfaces.

     ⚠ NOT THE PERSONA'S `licenseExpiresOn`, which is a different fact:
     `personaFor` overwrites it from `RENEWAL_BY_VARIANT`, so it follows the
     PROGRESS axis (how long this demo learner has left) rather than the
     course. Asserting on it here would have been testing the Progress
     dropdown and calling it the Course one. */
  it('agrees with its own path about when the exam is', () => {
    for (const course of ['fl', 'tx'] as const) {
      const plan = studyCalendarFor(coursePathIdFor(course))
      const path = learningPathsFor('xcel').find((p) => p.id === coursePathIdFor(course))!
      // The plan is ISO, the path is mm/dd/yyyy — the same day either way.
      const [y, m, d] = plan.examDate.split('-')
      expect(path.examDate, course).toBe(`${m}/${d}/${y}`)
    }
  })

  it('has its own exam-prep persona, pointed at its own path', () => {
    const fl = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'exam-prep', 'fl')!
    const tx = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'exam-prep', 'tx')!
    expect(fl.path.id).toBe(coursePathIdFor('fl'))
    expect(tx.path.id).toBe(coursePathIdFor('tx'))
    expect(tx.path.title).toMatch(/Texas/)
  })

  it('has its own CE renewal cycle', () => {
    const fl = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce', 'fl')!
    const tx = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'ce', 'tx')!
    expect(fl.path.id).toBe(courseCePathIdFor('fl'))
    expect(tx.path.id).toBe(courseCePathIdFor('tx'))
    expect(tx.path.title).toMatch(/Texas/)
    expect(studyCalendarFor(courseCePathIdFor('tx')).examName).toMatch(/Texas/)
  })

  /*
   * ⚠ THE REGRESSION THIS FILE WAS MISSING, AND IT SHIPPED ONCE.
   *
   * The first Texas exam-prep profile was a spread of Florida's that changed
   * `pathId`, `title`, `state` and `licenseExpiresOn` — and NOT ONE of those
   * renders in the Home band. It prints the category bars, the Jump Back In
   * course and Today's Tasks; `licenseExpiresOn` is overwritten downstream by
   * `RENEWAL_BY_VARIANT`, because the Progress axis owns the deadline. So the
   * axis resolved a different persona and drew a byte-identical page: the
   * control worked and could not be seen to work, which is how it was
   * reported — "switching the courses isn't doing anything".
   *
   * This asserts on what the band actually PRINTS, for both journeys Home can
   * resolve. A new course that forgets to move these is caught here rather
   * than by someone looking at the page.
   */
  it.each(['ce', 'exam-prep'] as const)(
    'moves something Home actually prints — %s',
    (educationType) => {
      const fl = dashboardProgressPersonaFor('xcel', 'progress-on-track', educationType, 'fl')!
      const tx = dashboardProgressPersonaFor('xcel', 'progress-on-track', educationType, 'tx')!
      // The Jump Back In card's title — the one line of the band a reviewer
      // reads first.
      expect(tx.path.jumpBackIn?.title ?? tx.path.title).not.toBe(
        fl.path.jumpBackIn?.title ?? fl.path.title,
      )
      // …and Today's Tasks, which resolve through the path id's own calendar.
      expect(studyCalendarFor(tx.path.id).id).not.toBe(studyCalendarFor(fl.path.id).id)
    },
  )

  /* THE LANDING PAGE. End-to-End Demo is what a bare `/dashboard-rebrand`
     resolves to, and its Home card took its title from a module constant — so
     the control re-pointed Readiness, the Study Plan and the Compass tree
     while the first thing every stakeholder saw still read "Florida".
     The INVITE DOOR keeps the fixed string: `/end-to-end-demo` belongs to
     Afsana and Eric's scope, and this axis is not theirs to move. */
  it('leaves the invite door’s own title fixed on Florida', () => {
    expect(E2E_COURSE_TITLE_SHORT).toMatch(/Florida/)
  })

  it('has its own content tree', () => {
    expect(compassTocFor('fl')).toBe(COMPASS_SAMPLE_TOC_FROM_DESIGN)
    expect(compassTocFor('tx')).not.toBe(COMPASS_SAMPLE_TOC_FROM_DESIGN)
    expect(JSON.stringify(compassTocFor('tx'))).toMatch(/Texas/)
  })

  /* ⚠ EVERY TEXAS FIGURE SHIPS FLAGGED. The surfaces read `invented` and
     apologise for themselves; a future pass confirming the real numbers flips
     this and this test with it. Until then, silently dropping the marker
     would present guesses as published regulatory facts — the exact failure
     `nyProducerRequirements.ts`'s header was written about. */
  it('ships every Texas figure marked invented', () => {
    expect(examFactsFor('TX').invented).toBe(true)
    expect(governingAgencyFor('TX').invented).toBe(true)
    expect(governingAgencyFor('FL').invented).toBe(true)
    for (const step of getLicensedStepsFor('TX')) {
      expect(JSON.stringify(step), step.id).toMatch(/INVENTED/)
    }
  })
})

describe('the CE gate asks a predicate, not an equality', () => {
  /* `ce-study-plan` off suppresses the CE plan in two places (`PlatformShell`,
     `LearnerFocusedBand`). Both compared against Florida's id until
     2026-10-15; with a second CE course that gate would have held on one and
     silently let the other through. */
  it('recognises both CE paths and no others', () => {
    expect(isCoursePathCe(courseCePathIdFor('fl'))).toBe(true)
    expect(isCoursePathCe(courseCePathIdFor('tx'))).toBe(true)
    expect(isCoursePathCe(coursePathIdFor('fl'))).toBe(false)
    expect(isCoursePathCe(undefined)).toBe(false)
  })
})

describe('New York is untouched', () => {
  /* The QE journey's licence is confirmed against XCEL's published page. The
     Course control is a Florida/Texas axis and has no New York arm; these are
     the assertions that keep it that way. */
  it('still resolves the published New York facts', () => {
    expect(examFactsFor('NY').invented).toBe(false)
    expect(examFactsFor('NY').questions).toBe('150 scored questions')
  })

  it('reaches the same steps and agency through the new functions', () => {
    expect(getLicensedStepsFor('NY')).toBe(GET_LICENSED_STEPS)
    expect(governingAgencyFor('NY')).toBe(NY_GOVERNING_AGENCY)
  })

  /*
   * ⚠ THIS USED TO ASSERT THE OPPOSITE — "leaves the QE persona on New York
   * whichever course is picked" — and the change is the point of the second
   * pass. Pinning qualifying to New York is what put "Get Licensed in New
   * York" under a Course pill reading Florida. The control is a JURISDICTION
   * axis now: picking one moves every journey, including qualifying.
   *
   * What is preserved is the thing that actually mattered — New York's
   * CONTENT. Picking `ny` resolves the published profile itself, not a copy.
   */
  it('resolves the published New York profile when New York is picked', () => {
    const qe = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', 'ny')!
    expect(qe.path.state).toBe('NY')
    expect(qe.path.title).toMatch(/New York/)
    // …and the same object `auto` reaches, so the two cannot drift.
    expect(qe.path.title).toBe(
      dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined)!.path.title,
    )
  })

  /* EVERY JOURNEY ANSWERS FOR EVERY COURSE. A gap here means that journey
     falls back to its own default and renders a jurisdiction the Course pill
     does not name — the contradiction the whole second pass was about. */
  it.each(['ce', 'qe', 'exam-prep'] as const)('answers for every course — %s', (edu) => {
    for (const course of ['ny', 'fl', 'tx'] as const) {
      const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', edu, course)!
      expect(p.path.state, `${edu}/${course}`).toBe(courseStateFor(course))
    }
  })

  it('falls back to Florida for a state nobody has modelled', () => {
    expect(examFactsFor('CA').state).toBe('FL')
    expect(governingAgencyFor('CA')).toBe(governingAgencyFor('FL'))
    expect(getLicensedStepsFor(undefined)).toBe(getLicensedStepsFor('FL'))
  })
})

describe('regulated sequencing — the rule', () => {
  const flat = (toc: readonly CompassTocSection[]) =>
    toc.flatMap((s) => [
      { id: s.id, status: s.status },
      ...(s.children ?? []).map((c) => ({ id: c.id, status: c.status })),
    ])

  it('returns the tree UNCHANGED BY IDENTITY when unregulated', () => {
    // Not merely equal — the same object, so the default path allocates
    // nothing and a `===` in a memo upstream still holds.
    const toc = compassTocFor('fl')
    expect(applyCourseSequencing(toc, false)).toBe(toc)
  })

  it('never touches what has been reached', () => {
    const before = flat(compassTocFor('fl'))
    const after = flat(applyCourseSequencing(compassTocFor('fl'), true))
    for (const [i, entry] of before.entries()) {
      if (entry.status === 'done' || entry.status === 'current') {
        expect(after[i], entry.id).toEqual(entry)
      }
    }
  })

  /* THE RULE ITSELF: everything up to and including the first entry that is
     not DONE stays open; everything after it locks. A `current` entry is open
     — locking what a learner is inside would be absurd — but it CLOSES THE
     GATE behind it, because the brief's rule is "the next item opens once the
     one before it is marked complete", and part-way through is not complete.

     ⚠ THE FIRST VERSION WAS LOOSER, leaving the next not-started entry open
     after an in-progress one. It read plausibly and it is not what the brief
     says. */
  it('locks everything after the first entry that is not done', () => {
    const after = flat(applyCourseSequencing(compassTocFor('fl'), true))
    const firstNotDone = after.findIndex((e) => e.status !== 'done')
    expect(firstNotDone).toBeGreaterThanOrEqual(0)
    for (const [i, entry] of after.entries()) {
      if (i <= firstNotDone) expect(entry.status, entry.id).not.toBe('locked')
      else if (entry.status !== 'done' && entry.status !== 'current')
        expect(entry.status, entry.id).toBe('locked')
    }
    expect(after.filter((e) => e.status === 'locked').length).toBeGreaterThan(0)
  })

  it('never locks a lesson the learner is inside', () => {
    const before = flat(compassTocFor('fl'))
    const after = flat(applyCourseSequencing(compassTocFor('fl'), true))
    for (const [i, entry] of before.entries()) {
      if (entry.status === 'current') expect(after[i].status, entry.id).toBe('current')
    }
  })

  /* A COURSE NOBODY HAS STARTED is the shape Jillienne described: "the first
     item is clickable, the others are locked". It falls out of the same rule
     rather than needing one of its own. */
  it('on an untouched course, opens the first item and locks every other', () => {
    const fresh: CompassTocSection[] = [
      { id: 'a', label: 'A', status: 'not-started' },
      { id: 'b', label: 'B', status: 'not-started' },
      { id: 'c', label: 'C', status: 'not-started' },
    ]
    expect(flat(applyCourseSequencing(fresh, true)).map((e) => e.status)).toEqual([
      'not-started',
      'locked',
      'locked',
    ])
  })

  /* THE ALLOWANCE IS SPENT ONCE, ACROSS THE WHOLE TREE. Per-section, a
     section whose lessons were all locked would hand a fresh allowance to the
     section below it — two open items instead of one. */
  it('does not hand a second allowance to the next section', () => {
    const toc: CompassTocSection[] = [
      {
        id: 's1',
        label: 'S1',
        status: 'current',
        children: [
          { id: 'l1', label: 'L1', status: 'not-started' },
          { id: 'l2', label: 'L2', status: 'not-started' },
        ],
      },
      { id: 's2', label: 'S2', status: 'not-started' },
    ]
    /* The CURRENT section spends the allowance, so both its lessons and the
       section after them lock. */
    expect(flat(applyCourseSequencing(toc, true)).map((e) => e.status)).toEqual([
      'current',
      'locked',
      'locked',
      'locked',
    ])
  })

  it('strips onSelect from what it locks, and only from that', () => {
    const noop = () => {}
    const toc: CompassTocSection[] = [
      {
        id: 's1',
        label: 'S1',
        // `done`, not `current`: a current section spends the allowance, and
        // this test is about `onSelect`, not about who gets it.
        status: 'done',
        children: [
          { id: 'open', label: 'Open', status: 'not-started', onSelect: noop },
          { id: 'shut', label: 'Shut', status: 'not-started', onSelect: noop },
        ],
      },
    ]
    const [section] = applyCourseSequencing(toc, true)
    expect(section.children![0].onSelect).toBe(noop)
    expect(section.children![1].onSelect).toBeUndefined()
  })
})

describe('regulated sequencing — how the rail draws it', () => {
  const LOCKED: CompassTocSection[] = [
    {
      id: 's1',
      label: 'Chapter 1',
      status: 'current',
      children: [
        { id: 'open', label: 'Open lesson', status: 'not-started' },
        { id: 'shut', label: 'Shut lesson', status: 'locked', onSelect: () => {} },
      ],
    },
  ]

  function renderRail() {
    return render(
      <CompassCourseRail courseTitle="Course" progressPct={0} toc={LOCKED} resources={[]} />,
    )
  }

  /* ⚠ THE PADLOCK IS `aria-hidden`, like every mark on this rail, so the
     STATUS IN WORDS is the only thing a screen reader gets. "Not started"
     there would send a learner hunting for a control that is deliberately
     not present. */
  it('states the lock in words, not only in an icon', () => {
    renderRail()
    expect(screen.getByText(/Shut lesson/).closest('li')!.textContent).toMatch(/locked/i)
    expect(screen.getByText(/Open lesson/).closest('li')!.textContent).toMatch(/not started/i)
  })

  /* BELT AND BRACES. `applyCourseSequencing` strips `onSelect`; this fixture
     deliberately keeps one, because the rail is the last thing between a
     locked lesson and a click and must not depend on the map having run. */
  it('never renders a locked row as a button, even when handed an onSelect', () => {
    renderRail()
    const row = screen.getByText(/Shut lesson/).closest('li')!
    expect(within(row).queryByRole('button')).toBeNull()
  })

  it('withholds the hover affordance from a locked row', () => {
    renderRail()
    const row = screen.getByText(/Shut lesson/).closest('li')!
    // `.is-upcoming:hover` turns the spine navy and the label dark — an
    // invitation to click. A locked row gets the muted base without it.
    expect(row.className).toContain('is-locked')
    expect(row.className).not.toContain('is-upcoming')
  })
})

describe('regulated sequencing — the Study Journey draws the same rule', () => {
  /*
   * ⚠ THE SURFACE THIS WAS REPORTED ON. The lock shipped in the Compass course
   * rail only, and the Study Journey on HOME — the ordered list under "Step 1",
   * the one on the landing page — kept drawing an outline ring for every stop.
   * Two drawings of the same Step 1; the rule has to reach both.
   */
  const stop = (id: string, status: JourneyStop['status'], blocked = false): JourneyStop => ({
    id,
    title: id,
    group: 'g',
    hours: null,
    status,
    milestone: false,
    blocked,
  })
  const locks = (stops: JourneyStop[]) =>
    applyJourneySequencing(stops, true).map((s) => Boolean(s.locked))

  it('returns the array unchanged by identity when unregulated', () => {
    const stops = [stop('a', 'not-started')]
    expect(applyJourneySequencing(stops, false)).toBe(stops)
  })

  it('locks everything after the stop in progress', () => {
    expect(
      locks([
        stop('done', 'completed'),
        stop('here', 'in-progress'),
        stop('next', 'not-started'),
        stop('later', 'not-started'),
      ]),
    ).toEqual([false, false, true, true])
  })

  it('on an untouched journey, opens the first stop and locks the rest', () => {
    expect(
      locks([stop('a', 'not-started'), stop('b', 'not-started'), stop('c', 'not-started')]),
    ).toEqual([false, true, true])
  })

  /* ⚠ `blocked` LOCKS AND NEVER SPENDS THE ALLOWANCE. The first version
     SKIPPED blocked stops — and on the default journey every remaining stop is
     blocked, so Regulated locked nothing at all, anywhere. */
  it('locks the product-blocked stops rather than skipping them', () => {
    expect(
      locks([stop('here', 'in-progress'), stop('part2', 'not-started', true), stop('tail', 'not-started')]),
    ).toEqual([false, true, true])
  })

  it('does not let a blocked stop hand the allowance to a later one', () => {
    // The blocked stop locks; the allowance it did not spend opens `tail`.
    expect(locks([stop('part2', 'not-started', true), stop('tail', 'not-started')])).toEqual([
      true,
      false,
    ])
  })
})

describe('the landing page’s Step 1 list follows the course', () => {
  /*
   * ⚠ THE SURFACE REPORTED TWICE. End-to-End Demo is what a bare
   * `/dashboard-rebrand?demo=1` resolves to, and its Step 1 was seven string
   * literals transcribed from Figma 265:8144 — "(13 of 42 completed)"
   * included. So the Course control re-pointed the card, the Get Licensed
   * block, Readiness and the Compass tree while the list under them stayed a
   * drawing of a frame.
   *
   * Eric's SEVEN-step decomposition is kept; only the counts are derived.
   */
  const lessonRow = (course: 'ny' | 'fl' | 'tx' | undefined) => {
    const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', course)!
    const stops = journeyStopsFor(persona.path).filter(
      (st) => st.id !== 'attestation-and-affidavit',
    )
    return whiteJourneyTitles(stops[0])[1]
  }

  it('names the chosen course’s own lesson count', () => {
    expect(lessonRow('ny')).toMatch(/of 42 completed/)
    expect(lessonRow('fl')).toMatch(/of 36 completed/)
    expect(lessonRow('tx')).toMatch(/of 30 completed/)
  })

  it('on Automatic, stays on New York’s 42 — the count it always printed', () => {
    expect(lessonRow(undefined)).toMatch(/of 42 completed/)
  })

  /* ⚠ THE PRODUCT COUNTS DO NOT MOVE. Prep Review's 23 and the three
     simulators are XCEL's 3-Part Training Program — a product structure that
     carries across jurisdictions, not a state requirement. */
  it('leaves the 3-Part Program’s own counts alone', () => {
    for (const course of ['ny', 'fl', 'tx'] as const) {
      const rows = (() => {
        const persona = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', course)!
        const stops = journeyStopsFor(persona.path).filter(
          (st) => st.id !== 'attestation-and-affidavit',
        )
        return whiteJourneyTitles(stops[0])
      })()
      expect(rows[2], course).toBe('Prep Review (23)')
      expect(rows[3], course).toBe('Simulated Exams (3)')
      // And the rows that never carried a count are untouched.
      expect(rows[0], course).toBe('Pre-course Affidavit')
      expect(rows[6], course).toBe('Survey & Certificate')
    }
  })

  /* A BONUS THE TRANSCRIPTION COULD NOT GIVE: the row now agrees with the
     Progress dropdown. The frame's "13 of 42" is 31% on a page whose Progress
     pill reads ~63%. */
  it('tracks the Progress axis as well as the course', () => {
    const at = (variant: string) => {
      const persona = dashboardProgressPersonaFor('xcel', variant, 'qe', 'ny')!
      const stops = journeyStopsFor(persona.path).filter(
        (st) => st.id !== 'attestation-and-affidavit',
      )
      return whiteJourneyTitles(stops[0])[1]
    }
    expect(at('setup-complete-0')).toMatch(/\(0 of 42/)
    expect(at('complete-100')).toMatch(/\(42 of 42/)
  })
})

describe('the access-window control — "Expires"', () => {
  /*
   * "A demo selector for a course to expire in 1 day, 7 days, 15 days, 30
   * days, 90 days, 120 days, 400 days" — 2026-10-15.
   *
   * It moves one date, which three surfaces read: the course header's
   * countdown, the ceiling the Study Pace plans against, and the Jump Back
   * In card's expiring-soon badge.
   */
  const def = FEATURE_FLAGS.find((f) => f.key === EXPIRY_FLAG_KEY)!
  const DAYS = [1, 7, 15, 30, 90, 120, 400]

  it('offers Automatic plus the seven day counts', () => {
    expect(def.variants?.map((v) => v.value)).toEqual(['auto', ...DAYS.map(String)])
    expect(EXPIRY_PICKER.map((o) => o.value)).toEqual(['auto', ...DAYS])
  })

  /* ⚠ THE DEFAULT IS `auto`, and it has to be: each Progress state already
     authors its own window — On Track 29 days, At Risk 3, Off Track a
     deliberately unreachable 11 — and a day count as the default would
     overwrite every one of those stories. */
  it('opens on Automatic, leaving each Progress state’s own window', () => {
    expect(def.defaultVariant).toBe('auto')
    expect(chosenExpiryDays(resolveExpiry(def.defaultVariant))).toBeUndefined()
    for (const variant of ['progress-on-track', 'progress-at-risk', 'progress-off-track']) {
      const auto = dashboardProgressPersonaFor('xcel', variant, 'qe')!
      const explicit = dashboardProgressPersonaFor('xcel', variant, 'qe', undefined, undefined)!
      expect(explicit.path.jumpBackIn?.expiresAt, variant).toBe(auto.path.jumpBackIn?.expiresAt)
    }
  })

  it('degrades an unrecognised variant to Automatic', () => {
    expect(resolveExpiry('99')).toBe('auto')
    expect(resolveExpiry(undefined)).toBe('auto')
    expect(resolveExpiry('nonsense')).toBe('auto')
  })

  /*
   * ⚠ "7 days" MUST MEAN SEVEN. The first build borrowed `accessWindowFor`'s
   * `+ 1` — which exists so the PACE card's usable-day figure matches the
   * header — and every row rendered one too many: "1 day" showed 2, "400"
   * showed 401. This control is read the other way round.
   */
  it.each(DAYS)('puts the expiry exactly %i days out', (days) => {
    const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined, days)!
    expect(daysUntil(p.path.jumpBackIn!.expiresAt!, FIXTURE_TODAY)).toBe(days)
  })

  /* ⚠ IT OVERRIDES EVERY PROGRESS STATE, including the two that author their
     own window. A reviewer picking "1 day" is asking to see one day left, and
     a Progress state quietly winning would make the control look broken on
     exactly the states most worth demoing it on. */
  it.each(['progress-on-track', 'progress-at-risk', 'progress-off-track'])(
    'wins over %s’s own window',
    (variant) => {
      const p = dashboardProgressPersonaFor('xcel', variant, 'qe', undefined, 90)!
      expect(daysUntil(p.path.jumpBackIn!.expiresAt!, FIXTURE_TODAY)).toBe(90)
    },
  )

  /* THE SPREAD CROSSES THE BADGE THRESHOLD, which is what makes it a demo
     control rather than a date picker: `courseExpiry` warns inside 60 days
     clamped to half the enrolment window, so the short rows badge and the
     long ones do not. If this fails, the control has stopped showing the
     state it exists to show. */
  it('badges the short windows and not the long ones', () => {
    const stateFor = (days: number) => {
      const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined, days)!
      return courseExpiryState(p.path.jumpBackIn!, new Date(FIXTURE_TODAY))
    }
    for (const d of [1, 7, 15]) expect(stateFor(d), `${d} days`).toBe('expiring-soon')
    for (const d of [30, 90, 120, 400]) expect(stateFor(d), `${d} days`).toBe('none')
  })

  /* ⚠ A LONG WINDOW MUST NOT DATE THE ENROLMENT IN THE FUTURE. The shared
     `accessWindowFor` puts enrolment exactly 30 days before expiry, which at
     400 days would be 371 days from now — and `warnWindowFor` halves that
     window to decide whether to badge. */
  it('never enrols the learner after today', () => {
    for (const d of DAYS) {
      const p = dashboardProgressPersonaFor('xcel', 'progress-on-track', 'qe', undefined, d)!
      expect(daysUntil(p.path.jumpBackIn!.enrolledAt!, FIXTURE_TODAY), `${d} days`).toBeLessThanOrEqual(0)
    }
  })
})
