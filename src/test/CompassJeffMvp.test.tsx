import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassJeffMvpShell } from '@/components/learning/CompassJeffMvpShell'
import { CompassJeffMvpReadiness } from '@/components/learning/CompassJeffMvpReadiness'
import { CompassJeffMvpLearn } from '@/components/learning/CompassJeffMvpLearn'
import { CompassJeffMvpOverview } from '@/components/learning/CompassJeffMvpOverview'
import { CompassJeffMvpPractice } from '@/components/learning/CompassJeffMvpPractice'
import {
  JEFF_MVP_LEARN as LEARN,
  JEFF_MVP_PRACTICE as PR,
  JEFF_MVP_PRACTICE_COPY as PCOPY,
  practiceMatches,
  JEFF_MVP_OVERVIEW as OV,
  JEFF_MVP_OVERVIEW_COPY as OCOPY,
  JEFF_MVP_LEARN_COPY as LCOPY,
  JEFF_MVP_PAGES,
  JEFF_MVP_RAIL,
  JEFF_MVP_READINESS as RD,
  JEFF_MVP_READINESS_COPY as COPY,
} from '@/data/compassJeffMvpFixtures'
import { DESIGN_SURFACE_LABELS } from '@/context/designSurface'
import parity from './fixtures/compassJeffMvpParity.json'

/**
 * JEFF'S COMPASS MVP — parity with his build, 2026-11-09.
 *
 * `fixtures/compassJeffMvpParity.json` is every string his Readiness page
 * renders, captured off his running export at 1440px. This suite asserts the
 * React renders them.
 *
 * ⚠ THE WHOLE PAGE IS ASSERTED, not a sample of it. The two ports before this
 * one each shipped with a gap the author had not noticed — his evidence bars
 * used `cells`/`val` where I had typed `segs`/`value`, and her rail had a
 * Workspace row I had put in the wrong place. Both were caught by walking
 * every string rather than the ones that seemed load-bearing.
 *
 * ⚠ CASE AND PUNCTUATION ARE NOT CHECKED, deliberately, and this is the
 * 2026-11-05 lesson written down: `innerText` reports CSS-TRANSFORMED text, so
 * his "Exam prep" arrives as "EXAM PREP" and a fixture compared strictly would
 * force the capitals into the data — where they would then be transformed a
 * second time by nothing. Comparison is on letters and digits only, which is
 * why `compassJeffMvp.css` carries the `text-transform` and the fixture
 * carries his string.
 */

function renderShell(page: Parameters<typeof CompassJeffMvpShell>[0]['page'] = 'readiness') {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffMvpShell page={page} onSelectPage={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function renderPractice() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffMvpPractice />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function renderOverview() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffMvpOverview />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function renderLearn() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffMvpLearn />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function renderReadiness() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffMvpReadiness />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Letters and digits only — see the header note on why. */
const flat = (s: string) => s.replace(/[^A-Za-z0-9%]+/g, '').toLowerCase()

describe('Jeff’s Compass MVP — the Readiness page against his build', () => {
  it('renders every string his page renders', () => {
    const { container } = renderReadiness()
    const mine = flat(container.textContent ?? '')
    const missing = parity.readiness.filter((s) => !mine.includes(flat(s)))
    expect(missing).toEqual([])
  })

  it('carries his numbers, not rounded ones', () => {
    renderReadiness()
    // The ring, the coverage and the three stats
    expect(screen.getByLabelText(RD.ring.aria)).toBeInTheDocument()
    expect(RD.overall).toBe(62)
    expect(RD.coverage).toBe(46)
    expect(RD.stats.map((s) => s.value)).toEqual(['+6 pts', '62%', '85%'])
  })

  it('places the band marker at the score, not at the segment', () => {
    /* ⚠ THE BUG THIS PINS: his segments are flex 40/25/20/15 and summing to
       100 is what makes `left: score%` correct. A marker placed at the
       midpoint of its own band would put 52 and 61 in the same spot, and both
       would look plausible. */
    const { container } = renderReadiness()
    const markers = container.querySelectorAll<HTMLElement>('.cjm-track__marker')
    expect(markers.length).toBe(RD.rows.length)
    expect([...markers].map((m) => m.style.left)).toEqual(RD.rows.map((r) => `${r.score}%`))
    expect(RD.rows.every((r) => r.track.reduce((n, t) => n + t.flex, 0) === 100)).toBe(true)
  })

  it('opens Annuities and closes the rest, as his page does', () => {
    renderReadiness()
    // His first row (weakest, Annuities) is expanded on arrival with its three
    // sub-topics; the other four are collapsed.
    expect(screen.getByText('Variable annuities')).toBeInTheDocument()
    expect(screen.getAllByText(COPY.subEyebrow).length).toBe(1)
    expect(RD.rows.filter((r) => r.expanded).length).toBe(1)
    expect(RD.rows[0].name).toBe('Annuities')
  })

  it('expands and collapses a topic', async () => {
    const user = userEvent.setup()
    renderReadiness()
    const policy = RD.rows.find((r) => r.name === 'Policy Provisions')!
    /* ⚠ NOT asserted by looking for a sub-topic NAME: "Settlement options" is
       also the "Also worth a look" strip at the top of the page, which is how
       this test failed on its first run. The disclosure's own state is the
       thing being tested. */
    const chevron = screen.getByRole('button', { name: policy.expandLabel })
    expect(chevron).toHaveAttribute('aria-expanded', 'false')
    /* ⚠ THE LABEL FLIPS WITH THE STATE, as his does. A fixture that carried
       one captured string told a screen-reader user to collapse a shut row —
       which is what the all-open extraction produced on the Overview, and
       what this page shipped with for two days. */
    expect(screen.getAllByText(COPY.subEyebrow).length).toBe(1)
    await user.click(chevron)
    expect(screen.getAllByText(COPY.subEyebrow).length).toBe(2)
    await user.click(chevron)
    expect(screen.getAllByText(COPY.subEyebrow).length).toBe(1)
  })

  it('keeps the band legend behind its disclosure, as his does', async () => {
    const user = userEvent.setup()
    renderReadiness()
    expect(screen.queryByText(RD.bandHelp[0].text)).toBeNull()
    await user.click(screen.getByRole('button', { name: new RegExp(COPY.helpCta) }))
    for (const b of RD.bandHelp) expect(screen.getByText(b.text)).toBeInTheDocument()
  })

  it('hides "points in 3 weeks" from sight but not from a screen reader', () => {
    /* His own `clip: rect(0 0 0 0)` span. It is in his DOM and not on his
       screen, and dropping it would quietly make the page less readable to
       anyone not looking at it. */
    const { container } = renderReadiness()
    const sr = container.querySelectorAll('.cjm-sr')
    expect(sr.length).toBe(RD.rows.length)
    expect(sr[0].textContent?.trim()).toBe(COPY.deltaSuffix)
  })

  it('sends only the weakest sub-topic straight into a question set', () => {
    /* The page's thesis in one href — see the component's header note. Pinned
       because it is the kind of detail a later tidy-up would "fix". */
    const primary = RD.rows[0].subs.filter((s) => s.rubi)
    expect(primary.length).toBe(1)
    expect(primary[0].name).toBe('Variable annuities')
    expect(primary[0].mins).toBe('12 min')
  })
})

describe('Jeff’s Compass MVP — the rail and the tag', () => {
  it('draws his eight rows in his order, with the group rule in the middle', () => {
    renderShell()
    const nav = screen.getByRole('navigation', { name: 'Compass pages' })
    const rows = within(nav)
      .getAllByRole('button')
      .map((b) => b.textContent?.trim())
    expect(rows).toEqual([
      'Overview',
      'Learn',
      'Study planner',
      'Prep Review',
      'Practice',
      'Flashcards',
      'Exam Simulator',
      'Readiness',
    ])
  })

  it('keeps Study planner ABOVE the exam-prep rule', () => {
    /* ⚠ HIS ARGUMENT, NOT A LAYOUT ACCIDENT: planning is part of learning, and
       what sits under EXAM PREP is what you do once the course is behind you.
       A later pass that "tidies" the planner in with the other four would be
       changing what the prototype says. */
    expect(JEFF_MVP_RAIL.primary.map((r) => r.page)).toEqual([
      'overview',
      'learn',
      'study-planner',
    ])
    expect(JEFF_MVP_RAIL.examPrep.map((r) => r.page)).toEqual([
      'prep-review',
      'practice',
      'flashcards',
      'exam-simulator',
      'readiness',
    ])
  })

  it('stores the group label in his case, leaving the capitals to CSS', () => {
    // See the header note. This is the parity trap of 2026-11-05, pinned.
    expect(JEFF_MVP_RAIL.groupLabel).toBe('Exam prep')
  })

  it('marks the page you are on', () => {
    renderShell('readiness')
    const nav = screen.getByRole('navigation', { name: 'Compass pages' })
    const current = within(nav)
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-current') === 'page')
    expect(current.map((b) => b.textContent?.trim())).toEqual(['Readiness'])
  })

  it('tags every ported page as Jeff’s, and says which prototype', () => {
    renderShell('readiness')
    expect(screen.getByTestId('jeff-mvp-tag')).toHaveTextContent('Jeff’s version · Compass MVP')
  })

  it('tags the pages that are not ported yet too', () => {
    // A reviewer landing on an empty page still needs to know whose it is.
    renderShell('practice')
    expect(screen.getByTestId('jeff-mvp-tag')).toBeInTheDocument()
  })
})

describe('Jeff’s Compass MVP — the pages not built yet', () => {
  it('names what is missing instead of falling back to the product’s page', () => {
    /* ⚠ THE DECISION THIS PINS, and it is the one `CompassContentPending`
       made first: a silent fallback renders shipped work under Jeff's name,
       the reviewer believes it is his, and nothing on screen corrects them. */
    /* Flashcards, because Practice is ported now. Whichever page this names
       must be one `JEFF_MVP_PAGES` still marks unported — the test below
       walks them all, so this one only has to pick a live example. */
    renderShell('flashcards')
    expect(screen.getByRole('region', { name: /Flashcards — not ported yet/ })).toBeInTheDocument()
    expect(screen.getByText(/not in the React port yet/)).toBeInTheDocument()
    // and it must NOT have rendered any ported surface in its place
    expect(screen.queryByText(COPY.topicsTitle)).toBeNull()
  })

  it('keeps the rail on an unported page, so there is a way out', () => {
    renderShell('exam-simulator')
    expect(screen.getByRole('navigation', { name: 'Compass pages' })).toBeInTheDocument()
  })

  it('agrees with itself about which pages are ported', () => {
    /* The list and the shell are two places that can disagree. Readiness is
       the only `ported: true` row today; when the next page lands, this test
       is the reminder to flip its flag. */
    const ported = JEFF_MVP_PAGES.filter((p) => p.ported).map((p) => p.page)
    expect(ported).toEqual(['overview', 'learn', 'practice', 'readiness'])
    for (const p of JEFF_MVP_PAGES) {
      if (p.ported) continue
      const { unmount } = renderShell(p.page)
      expect(screen.getByRole('region', { name: new RegExp(`${p.label} — not ported yet`) })).toBeInTheDocument()
      unmount()
    }
  })

  it('lists every rail row as a page, and no page the rail cannot reach', () => {
    const railPages = [...JEFF_MVP_RAIL.primary, ...JEFF_MVP_RAIL.examPrep].map((r) => r.page)
    expect([...JEFF_MVP_PAGES].map((p) => p.page).sort()).toEqual([...railPages].sort())
  })
})

describe('Jeff’s Compass MVP — the control', () => {
  it('is on the Design bar, defaulting to what ships', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-mvp-version')
    expect(flag).toBeTruthy()
    expect(flag?.surface).toBe('design')
    expect(flag?.defaultVariant).toBe('current')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['current', 'jeff'])
  })

  it('is scoped so it is reachable from the Overview and stays on his surface', () => {
    /* ⚠ WITHOUT THE SECOND SCOPE, picking Jeff's version takes its own
       dropdown off the bar and strands the reviewer there. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-mvp-version')
    expect(flag?.surfaces).toContain('compass:jeff-mvp')
    expect(flag?.surfaces).toContain('compass:overview')
  })

  it('names his surface on the bar', () => {
    expect(DESIGN_SURFACE_LABELS['compass:jeff-mvp']).toBe('Compass · Jeff’s MVP')
  })
})

describe('Jeff’s Compass MVP — the Learn page against his build', () => {
  it('renders every string his page renders', () => {
    const { container } = renderLearn()
    const mine = flat(container.textContent ?? '')
    const missing = parity.learn.filter((s) => !mine.includes(flat(s)))
    expect(missing).toEqual([])
  })

  it('draws nineteen chapters, one done, one current, seventeen locked', () => {
    renderLearn()
    const states = LEARN.chapters.map((c) => c.state)
    expect(states.length).toBe(19)
    expect(states.filter((s) => s === 'done').length).toBe(1)
    expect(states.filter((s) => s === 'current').length).toBe(1)
    expect(states.filter((s) => s === 'locked').length).toBe(17)
  })

  it('gives every chapter exactly one state', () => {
    /* ⚠ The styling branches on all three independently; a chapter that was
       somehow both done and locked would render as neither. */
    for (const c of LEARN.chapters) {
      expect(['done', 'current', 'locked']).toContain(c.state)
    }
  })

  it('opens the current chapter and only that one', () => {
    const { container } = renderLearn()
    const open = container.querySelectorAll('.cjm-ch.is-open')
    expect(open.length).toBe(1)
    expect(open[0].className).toContain('cjm-ch--current')
    // its seven lessons are on screen; a locked chapter's are not
    expect(screen.getByText('Lesson 1: Stock and Mutual Insurers')).toBeInTheDocument()
    expect(screen.queryByText('Elements of a legal contract')).toBeNull()
  })

  it('opens a LOCKED chapter, showing the message AND the lessons', async () => {
    /* ⚠ THE DETAIL MOST LIKELY TO BE LOST, because every instinct says a
       locked row should not expand. His `showLessons: isOpen` and
       `showLockMsg: isOpen && isLocked` say otherwise, and the page's lead
       promises it: "a locked step tells you exactly what opens it". */
    const user = userEvent.setup()
    const { container } = renderLearn()
    await user.click(screen.getByRole('button', { name: 'Expand Chapter 3' }))
    const ch3 = flat(container.querySelectorAll('.cjm-ch')[2].textContent ?? '')
    for (const s of parity.learnChapter3Locked) expect(ch3).toContain(flat(s))
  })

  it('keeps his lesson labels exactly as they arrived, Chapter 2 included', () => {
    /* ⚠ ONLY CHAPTER 2 IS AUTHORED — its lessons are "Lesson n: …" and every
       other chapter carries bare outline topics. Normalising the other
       eighteen would invent content he has not written. */
    expect(LEARN.chapters[1].lessons[0].label).toBe('Lesson 1: Stock and Mutual Insurers')
    expect(LEARN.chapters[0].lessons[0].label).toBe('Introduction')
    expect(LEARN.chapters[2].lessons[0].label).toBe('Introduction')
    const prefixed = LEARN.chapters.filter((c) => c.lessons[0].label.startsWith('Lesson '))
    expect(prefixed.map((c) => c.n)).toEqual([2])
  })

  it('draws the progress bar under the current chapter only', () => {
    /* ⚠ His `progPct` is Chapter 2's figure on all nineteen rows. Trusting the
       data instead of his template would draw nineteen identical 29% bars. */
    const { container } = renderLearn()
    const chapterBars = container.querySelectorAll('.cjm-bar--ch')
    expect(chapterBars.length).toBe(1)
    expect(LEARN.chapters.every((c) => c.progPct === '29%')).toBe(true)
  })

  it('gives an action only to the chapters that have one', () => {
    renderLearn()
    expect(screen.getByRole('button', { name: LEARN.chapters[0].actionLabel })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: LEARN.chapters[1].actionLabel })).toBeInTheDocument()
    // a locked chapter has `hasAction: false` — no Review button, just a chevron
    expect(screen.queryByRole('button', { name: LEARN.chapters[2].actionLabel })).toBeNull()
    expect(LEARN.chapters.filter((c) => c.hasAction).length).toBe(2)
  })

  it('draws a locked exam as a visible, inert button', () => {
    /* ⚠ VISIBLE AND DISABLED, not hidden. His markup carries `disabled
       aria-disabled` and a padlock: the learner should see the exam exists
       and that it is shut. */
    renderLearn()
    const takes = screen.getAllByRole('button', { name: new RegExp(LCOPY.examCta) })
    expect(takes.length).toBeGreaterThan(0)
    for (const t of takes) expect(t).toBeDisabled()
  })

  it('says "Locked" on a locked chapter even though his data says nothing', () => {
    /* His `status` is '' when locked; the word is template text keyed off the
       state. Pinned so a later pass does not "fix" the fixture by typing
       "Locked" into it. */
    expect(LEARN.chapters[2].status).toBe('')
    renderLearn()
    expect(screen.getAllByText(LCOPY.lockedWord).length).toBe(18) // 17 chapters + the final exam
  })

  it('carries his ring dasharray verbatim, label mismatch and all', () => {
    /* ⚠ 180.0 of a 314.2 circumference is 57.3%; the label beside it reads
       61%. His arc is short of his own number. Carried rather than corrected
       — see the fixture note. */
    renderLearn()
    expect(LCOPY.courseRingDash).toBe('180.0 314.2')
    expect(screen.getByLabelText(LCOPY.courseRingAria)).toBeInTheDocument()
  })

  it('has no header rule, where Readiness has one', () => {
    /* Measured on both of his pages. A shared rule would draw a line across
       the top of eleven pages that do not have one. */
    const { container } = renderLearn()
    expect(container.querySelector('.cjm-head--ruled')).toBeNull()
    const r = renderReadiness()
    expect(r.container.querySelector('.cjm-head--ruled')).toBeTruthy()
  })
})

describe('Jeff’s Compass MVP — the Overview against his build', () => {
  it('renders every string his Readiness tab renders', () => {
    const { container } = renderOverview()
    const mine = flat(container.textContent ?? '')
    const missing = parity.overviewReadiness.filter((s) => !mine.includes(flat(s)))
    expect(missing).toEqual([])
  })

  it('swaps the whole table when the tab changes, not just its rows', async () => {
    /* ⚠ TITLE, SUMMARY, NOTE AND COLUMN HEADS ALL CHANGE. It is two tables,
       not one with a filter — which is why there are two fixtures. */
    const user = userEvent.setup()
    const { container } = renderOverview()
    expect(screen.getByText(OV.readiness.tableTitle)).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Course progress/ }))
    expect(screen.getByText(OV.progress.tableTitle)).toBeInTheDocument()
    expect(screen.queryByText(OV.readiness.tableTitle)).toBeNull()
    expect(screen.getByText(OV.progress.summary)).toBeInTheDocument()
    const mine = flat(container.textContent ?? '')
    const missing = parity.overviewProgress.filter((s) => !mine.includes(flat(s)))
    expect(missing).toEqual([])
  })

  it('marks the selected tab, and only one', () => {
    renderOverview()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.length).toBe(2)
    expect(tabs.filter((t) => t.getAttribute('aria-selected') === 'true').length).toBe(1)
  })

  it('does not score the Exam Simulator row like a topic', () => {
    /* ⚠ No share-of-exam wedge, no band, no chevron — his `hasPie: false`,
       `noBand: true`, `noExpand: true`. Drawing it like the five above would
       claim a Readiness score his design withholds. */
    const sim = OV.readiness.rows[OV.readiness.rows.length - 1]
    expect(sim.name).toBe('Exam Simulator')
    expect(sim.hasPie).toBe(false)
    expect(sim.hasBand).toBe(false)
    expect(sim.canExpand).toBe(false)
    expect(sim.bandNote).toBe('Uses all topics')
    renderOverview()
    expect(screen.queryByRole('button', { name: /Expand Exam Simulator/ })).toBeNull()
  })

  it('opens Annuities on arrival and nothing else', () => {
    /* ⚠ The all-open extraction exists to populate `subs`; taking `expanded`
       from it too made all six rows arrive open. */
    const open = OV.readiness.rows.filter((r) => r.expanded)
    expect(open.map((r) => r.name)).toEqual(['Annuities'])
    renderOverview()
    expect(screen.getAllByText(OCOPY.subEyebrow).length).toBe(1)
  })

  it('flips the chevron label with the state, as his does', async () => {
    /* ⚠ THE BUG THIS PINS: a label captured from the all-open extraction says
       "Collapse" on every row, so a screen-reader user is told to collapse a
       row that is shut. Both labels are in the fixture. */
    const user = userEvent.setup()
    renderOverview()
    const row = OV.readiness.rows[0]
    const chev = screen.getByRole('button', { name: row.expandLabel })
    expect(row.expandLabel).toMatch(/^Expand /)
    expect(row.collapseLabel).toMatch(/^Collapse /)
    await user.click(chev)
    expect(screen.getByRole('button', { name: row.collapseLabel })).toBeInTheDocument()
  })

  it('gives every sub-row a Practice button, not just the weakest', () => {
    /* ⚠ His `rubiCta` is "Practice" on the weakest row and EMPTY on the rest;
       rendering it directly drops the button from two rows in three. What
       differs is fill and destination, not presence. */
    renderOverview()
    const subs = OV.readiness.rows.find((r) => r.name === 'Annuities')!.subs
    expect(subs.length).toBe(3)
    for (const s of subs) {
      expect(screen.getByRole('button', { name: `Practice ${s.name}` })).toBeInTheDocument()
    }
    expect(subs.filter((s) => s.rubi).length).toBe(1)
  })

  it('draws the simulator arc empty, with a butt cap', () => {
    /* ⚠ Nought of three taken. A round cap on a zero-length arc draws a dot,
       which reads as "a little bit done". */
    const outer = OCOPY.ringArcs[0]
    expect(outer.dash).toBe('0 483.8')
    expect(outer.cap).toBe('butt')
    expect(OCOPY.ringArcs.filter((a) => a.cap === 'round').length).toBe(2)
  })

  it('shows the course percentage as text, not only as a bar width', async () => {
    const user = userEvent.setup()
    renderOverview()
    await user.click(screen.getByRole('tab', { name: /Course progress/ }))
    for (const r of OV.progress.rows) expect(screen.getByText(r.pct)).toBeInTheDocument()
  })

  it('leaves a completed topic’s Review as text, not a button', () => {
    /* His `isText` — only the in-progress rows get a control. */
    const done = OV.progress.rows.find((r) => r.isText)
    expect(done?.name).toBe('Life Insurance')
    expect(done?.action).toBe('Review')
  })

  it('carries a ring dasharray that agrees with its label, unlike Learn’s', () => {
    /* Both draw 61% on r=50 (circumference 314.2). This one is 192.0, which
       IS 61%; Learn's is 180.0, which is 57.3%. Same designer, same figure,
       two numbers — so Learn's is a slip. Both carried verbatim. */
    expect(OCOPY.progressRingDash).toBe('192.0 314.2')
    expect(LCOPY.courseRingDash).toBe('180.0 314.2')
  })
})

describe('Jeff’s Compass MVP — Practice against his build', () => {
  const user = () => userEvent.setup()

  it('renders every string his default state renders', () => {
    const { container } = renderPractice()
    const mine = flat(container.textContent ?? '')
    expect(parity.practice_topics_table.filter((s) => !mine.includes(flat(s)))).toEqual([])
  })

  it('regroups, not filters, when the tab changes', async () => {
    /* ⚠ Topics gives five groups of 21 sets; Subtopics gives ONE group of the
       same 21 with a topic eyebrow on each; Bookmarked gives the 2 that have
       bookmarks. Three groupings, stored separately, because his `groups` is
       rebuilt per tab. */
    expect(PR.topics.length).toBe(5)
    expect(PR.subtopics.length).toBe(1)
    expect(PR.bookmarked.length).toBe(1)
    const count = (g: typeof PR.topics) => g.reduce((n, x) => n + x.sets.length, 0)
    expect(count(PR.topics)).toBe(21)
    expect(count(PR.subtopics)).toBe(21)
    expect(count(PR.bookmarked)).toBe(2)

    const u = user()
    const { container } = renderPractice()
    await u.click(screen.getByRole('tab', { name: /Subtopics/ }))
    let mine = flat(container.textContent ?? '')
    expect(parity.practice_subtopics_table.filter((s) => !mine.includes(flat(s)))).toEqual([])
    await u.click(screen.getByRole('tab', { name: /Bookmarked/ }))
    mine = flat(container.textContent ?? '')
    expect(parity.practice_bookmarked_table.filter((s) => !mine.includes(flat(s)))).toEqual([])
  })

  it('renders his cards view', async () => {
    const u = user()
    const { container } = renderPractice()
    await u.click(screen.getByRole('button', { name: /^Cards$/ }))
    const mine = flat(container.textContent ?? '')
    expect(parity.practice_topics_cards.filter((s) => !mine.includes(flat(s)))).toEqual([])
  })

  it('filters to his result, and empties to his empty state', async () => {
    /* ⚠ THE FILTERS ARE DERIVED, not stored — the one place this port departs
       from "render what he rendered". These two assertions are what make that
       safe: the derived output is checked against his captured render. */
    const u = user()
    const { container } = renderPractice()
    await u.click(screen.getByRole('button', { name: /^Low$/ }))
    let mine = flat(container.textContent ?? '')
    expect(parity.practice_filter_low.filter((s) => !mine.includes(flat(s)))).toEqual([])

    await u.click(screen.getByRole('button', { name: /^Low$/ }))
    await u.click(screen.getByRole('button', { name: /^High$/ }))
    mine = flat(container.textContent ?? '')
    expect(parity.practice_filter_empty.filter((s) => !mine.includes(flat(s)))).toEqual([])
    expect(screen.getByText(PCOPY.emptyTitle)).toBeInTheDocument()
  })

  it('never matches an unstarted set, whatever the filter', () => {
    /* ⚠ HIS RULE, AND THE REASON THE EMPTY STATE EXISTS. Both halves require
       `started`, so an unstarted set cannot match on confidence OR band — it
       is hidden, not shown unmatched. Picking High empties the page because
       nothing has been practised well yet. */
    const all = PR.topics.flatMap((g) => g.sets)
    const unstarted = all.filter((s) => !s.started)
    expect(unstarted.length).toBeGreaterThan(0)
    for (const s of unstarted) {
      expect(practiceMatches(s, ['Low'], [])).toBe(false)
      expect(practiceMatches(s, [], ['Beginner'])).toBe(false)
      // …but no filter at all still shows it
      expect(practiceMatches(s, [], [])).toBe(true)
    }
    // and High matches nothing at all, started or not
    expect(all.some((s) => practiceMatches(s, ['High'], []))).toBe(false)
  })

  it('shows a dash for an unstarted set rather than its stored band', () => {
    /* ⚠ His data carries a band and a confidence on unstarted sets so the
       filter has something to test. Printing them would put a Readiness band
       on a set nobody has opened. */
    const unstarted = PR.topics[0].sets.find((s) => !s.started)!
    expect(unstarted.band).toBeTruthy()
    expect(unstarted.conf).toBeTruthy()
    expect(unstarted.status).toBe(PCOPY.notStarted)
    renderPractice()
    const dashes = screen.getAllByText(PCOPY.dash)
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('labels the confidence pill in both views and the band only on a card', async () => {
    /* ⚠ ASYMMETRIC, AND HIS. The first pass assumed the table labelled
       neither and lost the word from twenty-one rows. */
    const u = user()
    const { container } = renderPractice()
    const tableWords = container.querySelectorAll('.cjm-pr__table .cjm-pr__confword')
    expect(tableWords.length).toBeGreaterThan(0)
    expect([...tableWords].every((w) => w.textContent === PCOPY.confidenceWord)).toBe(true)
    await u.click(screen.getByRole('button', { name: /^Cards$/ }))
    expect(screen.getAllByText(PCOPY.readinessWord).length).toBeGreaterThan(0)
  })

  it('offers Clear filters only once something is filtered', async () => {
    const u = user()
    renderPractice()
    expect(screen.queryByRole('button', { name: PCOPY.clearFilters })).toBeNull()
    await u.click(screen.getByRole('button', { name: /^Low$/ }))
    expect(screen.getAllByRole('button', { name: PCOPY.clearFilters }).length).toBeGreaterThan(0)
  })

  it('dismisses the lead, as his does', async () => {
    const u = user()
    renderPractice()
    expect(screen.getByText(PCOPY.lead)).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: PCOPY.dismissLabel }))
    expect(screen.queryByText(PCOPY.lead)).toBeNull()
  })

  it('drops a group whose every set is filtered out', () => {
    /* A header over nothing is worse than no header. */
    const low = PR.topics
      .map((g) => g.sets.filter((s) => practiceMatches(s, ['Low'], [])))
      .filter((sets) => sets.length > 0)
    expect(low.length).toBe(2)
    expect(PR.topics.length).toBe(5)
  })
})
