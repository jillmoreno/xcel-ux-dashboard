import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, fireEvent, act, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { PrototypeChrome } from '@/components/layout/PrototypeChrome'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { CourseContentV2 } from '@/components/learning/CourseContentV2'
import { useCourseChrome } from '@/components/learning/courseTakeover'
import {
  NY_LH_COURSE_CHAPTERS,
  NY_LH_CURRENT_CHAPTER_INDEX,
} from '@/data/nyProducerRequirements'
import { MembershipVersionsPanelProvider } from '@/components/membership/MembershipVersionsPanelContext'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { CtaTestProvider, parseDeadParam } from '@/context/CtaTestContext'
import { TESTABLE_CTAS, TESTABLE_CTA_IDS, testableCtasByRegion } from '@/data/testableCtas'
import { DISCOVERABILITY_DASHBOARD_VERSION_TESTING } from '@/data/dashboardVersions'

/**
 * THE DEAD-CTA MECHANISM — the instrument `promote-to-testing` points at a
 * participant.
 *
 * WHAT WOULD BREAK FIRST, and therefore what this pins hardest:
 *
 *   1. **A dead CTA that still fires.** The interception depends on the
 *      CAPTURE phase beating React's root listener. A refactor that moved it
 *      to the bubble phase would look identical and do nothing, and the
 *      failure surfaces in front of a participant.
 *   2. **A live CTA that stops firing.** Worse than (1) — it breaks the
 *      product for everyone, not just a session. Asserted in both directions.
 *   3. **A catalog id nothing renders.** Silent: the control stays live and
 *      the moderator finds out mid-session. A source scan catches the typo.
 *   4. **State leaking between runs.** The list must die with the tab.
 */

const TESTING_URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING.id}`

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

/* ─── The mechanism, on a fixture rather than the product ─────────────────── */

describe('the interceptor', () => {
  /** A button and a link, both tagged, plus an untagged control beside them. */
  function Fixture({ onHit }: { onHit: (what: string) => void }) {
    return (
      <>
        <button type="button" data-cta-id="home.resume" onClick={() => onHit('tagged')}>
          Resume
        </button>
        <button type="button" onClick={() => onHit('untagged')}>
          Untagged
        </button>
        <button type="button" data-cta-id="home.course-details" onClick={() => onHit('other')}>
          Details
        </button>
        {/* A GLYPH INSIDE THE BUTTON, because that is where the real ones put
            their icon and `event.target` is then the <svg>, not the button.
            `closest` is what makes that work and this is what would catch its
            removal. */}
        <button type="button" data-cta-id="home.schedule-exam" onClick={() => onHit('nested')}>
          <span data-testid="glyph">→</span>
        </button>
      </>
    )
  }

  const renderFixture = (search: string, onHit: (what: string) => void) => {
    window.history.replaceState({}, '', `/${search}`)
    return render(
      <CtaTestProvider>
        <Fixture onHit={onHit} />
      </CtaTestProvider>,
    )
  }

  it('swallows a click on a dead CTA, and only that one', () => {
    const hit = vi.fn()
    renderFixture('?dead=home.resume', hit)

    fireEvent.click(screen.getByText('Resume'))
    expect(hit).not.toHaveBeenCalled()

    // Its neighbours are untouched — the failure mode that would break the app.
    fireEvent.click(screen.getByText('Untagged'))
    fireEvent.click(screen.getByText('Details'))
    expect(hit.mock.calls.map((c) => c[0])).toEqual(['untagged', 'other'])
  })

  it('catches a click that lands on a glyph INSIDE the control', () => {
    /* `event.target` is the <span>, not the button. Without `closest` this
       sails straight through, which is how every icon CTA on the page would
       quietly stay live. */
    const hit = vi.fn()
    renderFixture('?dead=home.schedule-exam', hit)
    fireEvent.click(screen.getByTestId('glyph'))
    expect(hit).not.toHaveBeenCalled()
  })

  it('stops an ANCHOR from navigating, not just a button from handling', () => {
    /* ⚠ THE OTHER HALF OF "nothing happens", and the half `stopPropagation`
       does not cover. A `<button>` is neutralised by keeping React from seeing
       the event; an `<a href>` would still follow its href, because that is the
       browser's DEFAULT ACTION rather than a listener. `preventDefault` is what
       covers it, and `header.logo` is a real `<Link>` — so dropping that one
       call would leave every tagged anchor live while every tagged button
       looked correctly dead.

       ASSERTED VIA `defaultPrevented` because jsdom does not navigate: the
       flag is the observable the browser would act on. */
    const hit = vi.fn()
    window.history.replaceState({}, '', '/?dead=header.logo')
    render(
      <CtaTestProvider>
        <a href="/elsewhere" data-cta-id="header.logo" onClick={hit}>
          XCEL
        </a>
      </CtaTestProvider>,
    )
    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    screen.getByText('XCEL').dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(hit).not.toHaveBeenCalled()
  })

  it('kills several at once', () => {
    const hit = vi.fn()
    renderFixture('?dead=home.resume,home.course-details', hit)
    fireEvent.click(screen.getByText('Resume'))
    fireEvent.click(screen.getByText('Details'))
    expect(hit).not.toHaveBeenCalled()
  })

  it('leaves everything live when no run is set', () => {
    /* THE STATE THE APP IS IN 99.9% OF THE TIME. No listener is attached at
       all, which is the thing to keep true — this must cost nothing. */
    const hit = vi.fn()
    renderFixture('', hit)
    fireEvent.click(screen.getByText('Resume'))
    fireEvent.click(screen.getByText('Details'))
    expect(hit).toHaveBeenCalledTimes(2)
  })

  it('leaves a dead CTA looking and reading exactly like a live one', () => {
    /* ⚠ THE CORE CLAIM OF THE WHOLE MECHANISM, and the one a well-meaning
       accessibility fix would undo. A dead CTA must carry no `disabled`, no
       `aria-disabled` and no dimming — an announced-disabled control answers
       the moderator's question for the participant, and the reach is the data.
       `CtaTestContext`'s header records why that trade is accepted and the one
       case where it is not. */
    const hit = vi.fn()
    renderFixture('?dead=home.resume', hit)
    const dead = screen.getByText('Resume')
    expect(dead.hasAttribute('disabled')).toBe(false)
    expect(dead.getAttribute('aria-disabled')).toBeNull()
    expect(dead.getAttribute('tabindex')).toBeNull() // still in the tab order
  })

  it('ignores an id that is not in the catalog, loudly', () => {
    /* A typo in a session link leaves that control LIVE. Silence there means
       the moderator discovers it by watching a participant sail through a dead
       end that was meant to be there. */
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const hit = vi.fn()
    renderFixture('?dead=home.resume,home.typo', hit)
    fireEvent.click(screen.getByText('Resume'))
    expect(hit).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('home.typo'))
    warn.mockRestore()
  })
})

describe('where a run lives', () => {
  it('survives a reload in the same tab, and dies with it', () => {
    /* `sessionStorage`, NOT `localStorage`. A stored run has to outlive a
       refresh mid-session and must NOT outlive the tab — a machine quietly
       killing CTAs weeks later, with nothing on screen to explain it, is the
       worst failure this mechanism could have. Asserting the KEY is how that
       stays true: `localStorage` would pass a round-trip test just as well. */
    window.history.replaceState({}, '', '/?dead=home.resume')
    render(
      <CtaTestProvider>
        <span />
      </CtaTestProvider>,
    )
    expect(window.sessionStorage.getItem('cgp.deadCtas')).toBe('home.resume')
    expect(window.localStorage.getItem('cgp.deadCtas')).toBeNull()
  })

  it('restores the run when the URL has lost the param', () => {
    /* In-app navigation drops the query string, and a reload after one would
       otherwise revive every dead control. */
    window.sessionStorage.setItem('cgp.deadCtas', 'home.resume')
    const hit = vi.fn()
    window.history.replaceState({}, '', '/dashboard-rebrand')
    render(
      <CtaTestProvider>
        <button type="button" data-cta-id="home.resume" onClick={hit}>
          Resume
        </button>
      </CtaTestProvider>,
    )
    fireEvent.click(screen.getByText('Resume'))
    expect(hit).not.toHaveBeenCalled()
  })

  it('treats an EMPTY ?dead= as a clear, not as a no-op', () => {
    /* The only way to end a run without closing the tab, and a moderator
       mid-session needs one. `has(param)` rather than a truthy value. */
    window.sessionStorage.setItem('cgp.deadCtas', 'home.resume')
    const hit = vi.fn()
    window.history.replaceState({}, '', '/?dead=')
    render(
      <CtaTestProvider>
        <button type="button" data-cta-id="home.resume" onClick={hit}>
          Resume
        </button>
      </CtaTestProvider>,
    )
    fireEvent.click(screen.getByText('Resume'))
    expect(hit).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem('cgp.deadCtas')).toBe('')
  })

  it('parses a hand-written list forgivingly', () => {
    // A person types this into a URL bar under time pressure.
    expect(parseDeadParam('home.resume, home.course-details,')).toEqual([
      'home.resume',
      'home.course-details',
    ])
    expect(parseDeadParam('')).toEqual([])
    expect(parseDeadParam(null)).toEqual([])
  })
})

/* ─── The catalog matches the product ─────────────────────────────────────── */

describe('the catalog', () => {
  it('has unique ids', () => {
    expect(new Set(TESTABLE_CTA_IDS).size).toBe(TESTABLE_CTA_IDS.length)
  })

  it('says what every dead end is FOR', () => {
    /* `asks` is not decoration — it is what stops a control being killed
       because it was easy to kill. A row without a question has no business
       being in a run. */
    for (const cta of TESTABLE_CTAS) {
      expect(cta.asks.length, cta.id).toBeGreaterThan(15)
      expect(cta.label.length, cta.id).toBeGreaterThan(0)
    }
  })

  it('groups without losing anyone', () => {
    const grouped = testableCtasByRegion().flatMap((g) => g.ctas)
    expect(grouped).toHaveLength(TESTABLE_CTAS.length)
  })

  it('every id is actually wired to an element', () => {
    /*
     * ⚠ THE TYPO TEST, and the reason it scans source rather than the DOM.
     *
     * A catalog id nothing renders is the mechanism's quietest failure: the
     * moderator builds a run around it, the link validates (the id IS in the
     * catalog), and the control stays live. A DOM test cannot cover it —
     * several of these only render in one progress state, one flag variant or
     * one half of an editor, so "render everything and look" would mean a
     * dozen fixtures and would still miss the next one.
     *
     * TWO SITES ARE DERIVED rather than literal and are matched accordingly:
     * the nav rows build `nav.${item.id}`, and the licensing cards go through
     * `LICENSING_STEP_CTA`. Both are named here so that deleting one is a test
     * failure rather than a silent loss.
     */
    const src = join(process.cwd(), 'src')
    const files: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.tsx?$/.test(entry)) files.push(full)
      }
    }
    walk(src)
    const code = files
      /* ⚠ THE CATALOG ITSELF IS EXCLUDED, and leaving it in made this test
         pass on a deliberately typo'd id before anyone noticed. Its rows read
         `id: 'home.resume',` — so a loose "is this string anywhere in src"
         scan finds EVERY id in the file that declares them, and the test
         proves only that the catalog contains the catalog. The tests are
         excluded for the same reason: an id named in an assertion is not an
         id wired to an element. */
      .filter((f) => !f.endsWith(join('data', 'testableCtas.ts')) && !f.includes(`${'/'}test${'/'}`))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
      /* ⚠ COMMENTS STRIPPED FIRST. This file's own header writes
         `data-cta-id="…"` in prose to explain the integration, and the orphan
         check below duly reported `…` as a tagged element with no catalog row.
         Anything written ABOUT the attribute is not a use of it. */
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')

    const literal = new Set([...code.matchAll(/data-cta-id="([^"]+)"/g)].map((m) => m[1]))
    // `data-cta-id={`nav.${item.id}`}` — every rail row, id from the item.
    const navDerived = /data-cta-id=\{`nav\.\$\{item\.id\}`\}/.test(code)
    /* `data-cta-id={LICENSING_STEP_CTA[step.id]}`, plus the values of that map
       read out of its own literal — NOT out of the whole file, which is how
       the loose version above went wrong. */
    const stepDerived = /data-cta-id=\{LICENSING_STEP_CTA\[step\.id\]\}/.test(code)
    const mapBody = /const LICENSING_STEP_CTA[^=]*=\s*\{([^}]*)\}/.exec(code)?.[1] ?? ''
    const mapped = new Set([...mapBody.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]))

    const missing = TESTABLE_CTA_IDS.filter((id) => {
      if (literal.has(id)) return false
      if (id.startsWith('nav.') && navDerived) return false
      if (stepDerived && mapped.has(id)) return false
      return true
    })
    expect(missing, `catalog ids with no element: ${missing.join(', ')}`).toEqual([])

    /* AND THE OTHER DIRECTION — an element tagged with an id the catalog does
       not know is just as broken: no run can ever kill it, and the attribute
       reads as though one could. */
    const orphans = [...literal].filter((id) => !TESTABLE_CTA_IDS.includes(id))
    expect(orphans, `tagged elements with no catalog row: ${orphans.join(', ')}`).toEqual([])
  })
})

/* ─── On the real dashboard ───────────────────────────────────────────────── */

describe('on the Home dashboard', () => {
  const seed = () => {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  }

  const renderHome = (search = '') => {
    window.history.replaceState({}, '', `/${search}`)
    return render(
      <MemoryRouter initialEntries={[TESTING_URL]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <CtaTestProvider>
              <LearningPathsPanelProvider>
                <JumpBackInPanelProvider>
                  <PlatformShell />
                </JumpBackInPanelProvider>
              </LearningPathsPanelProvider>
            </CtaTestProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('tags the controls a run is most likely to reach for', () => {
    seed()
    const { container } = renderHome()
    const tagged = new Set(
      [...container.querySelectorAll('[data-cta-id]')].map((el) =>
        el.getAttribute('data-cta-id'),
      ),
    )
    /* The ones that render unconditionally on this surface. The rest are
       state-dependent (the week strip at 0%, Clear once a date is stored) and
       are covered by the source scan above. */
    for (const id of [
      'home.resume',
      'home.study-pace-adjust',
      'home.schedule-exam',
      'home.what-to-expect',
      'home.how-to-apply',
      'home.state-requirements',
      'nav.dashboard',
    ]) {
      expect(tagged.has(id), `${id} is not on the page`).toBe(true)
    }
  })

  it('Resume really stops launching the course when the run kills it', () => {
    /* END TO END, on the real control: the participant presses Resume and the
       Compass player does NOT open. Everything else about the page is
       unchanged — which is the whole proposition. */
    seed()
    const { container } = renderHome('?dead=home.resume')
    const resume = [...container.querySelectorAll('[data-cta-id="home.resume"]')][0]
    expect(resume).toBeTruthy()
    act(() => {
      fireEvent.click(resume!)
    })
    expect(screen.queryByLabelText('Course contents')).toBeNull()
  })

  it('…and still launches it when the run does not', () => {
    // The other direction, so a broken selector cannot pass the test above.
    seed()
    const { container } = renderHome()
    const resume = [...container.querySelectorAll('[data-cta-id="home.resume"]')][0]
    act(() => {
      fireEvent.click(resume!)
    })
    expect(screen.getByLabelText('Course contents')).toBeTruthy()
  })
})

/* ─── The participant's view of the chrome ────────────────────────────────── */

describe('?test=1 — the moderated session view', () => {
  /*
   * The direct ask, 2026-09-23: keep the demo controls bar and the demo
   * background, hide everything on them except Progress.
   *
   * ⚠ THIS REPLACED A WRONG ANSWER. The first attempt reached for the existing
   * `?chrome=off`, which hides the prototype bar, the demo controls AND the
   * demo stage — three things when one was wanted. `test=1` is the third shape
   * of this chrome rather than a rename of `chrome=off` or `present=1`.
   */
  /* ⚠ THE THREE PANEL PROVIDERS ARE FOR THE DEFAULT BRANCH ONLY. `AdminToolsMenu`
     lives on the prototype bar and throws without them; the `?test=1` path
     renders no prototype bar at all, so a harness built around the test view
     alone would have passed while the CONTROL case could not even mount — and
     the control case is the one proving this stays invisible to everyone else.
     Same stack `DemoMode.test.tsx` uses. */
  const renderChrome = (search: string) =>
    render(
      <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <DashboardVersionsPanelProvider>
              <MembershipVersionsPanelProvider>
                <FeatureFlagPanelProvider>
                  <PrototypeChrome />
                </FeatureFlagPanelProvider>
              </MembershipVersionsPanelProvider>
            </DashboardVersionsPanelProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

  it('keeps the demo bar, showing only the controls a moderator uses live', () => {
    /* ⚠ TWO SURVIVORS AS OF 2026-09-23, not one — `navigation` was added to
       the whitelist by direct ask. It is the entry with a cost: a participant
       who spots "Option 1 / Option 2" has been told a comparison exists.
       `TEST_VIEW_CONTROLS` records why it is in anyway. */
    renderChrome('?test=1')
    expect(screen.getByRole('button', { name: /Progress/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Navigation/i })).toBeTruthy()
    for (const gone of [/Persona/i, /Readiness/i, /Pacing/i, /Education/i, /^Reset$/, /Demo actions/i]) {
      expect(screen.queryByRole('button', { name: gone }), String(gone)).toBeNull()
    }
  })

  it('drops the prototype bar with it', () => {
    /* The dark strip — home icon, the Demo pill, the device toggles, the
       "UI/UX PROTOTYPE" wordmark and the joke. All scaffolding a participant
       was never told about. */
    const { container } = renderChrome('?test=1')
    expect(container.querySelector('.cre-prototype-bar')).toBeNull()
    expect(screen.queryByRole('link', { name: /Prototype home/i })).toBeNull()
  })

  it('leaves every control alone on a normal load', () => {
    /* The direction that matters more: this must be invisible to everyone not
       in a session. */
    renderChrome('')
    for (const there of [/Progress/i, /Persona/i, /Pacing/i, /^Reset$/]) {
      expect(screen.getByRole('button', { name: there }), String(there)).toBeTruthy()
    }
  })

  it('whitelists rather than hide-lists', () => {
    /* ⚠ THE CLAIM THAT KEEPS THIS SAFE AS THE BAR GROWS. A hide-list would
       fail OPEN — the next dropdown added would appear in every test link
       until someone remembered it. Asserted by rendering the bar with an
       `only` naming a control that is not Progress: everything else, including
       Progress, must be gone. */
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <DemoControlsBar open only={['persona']} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /Persona/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Progress/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Reset$/ })).toBeNull()
  })
})

/* ─── The Navigation A/B ──────────────────────────────────────────────────── */

describe('dashboard-navigation — Option 1 / Option 2', () => {
  /*
   * 2026-09-23: a demo control that switches which course-content page Resume
   * opens, so a moderator can put the two in front of different participants.
   */
  const seedNav = (variant?: string) => {
    window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
    if (variant) {
      window.localStorage.setItem(
        'cgp.featureFlags',
        JSON.stringify({ 'dashboard-navigation': { enabled: true, variant } }),
      )
    }
  }

  const openCourse = () => {
    render(
      <MemoryRouter initialEntries={[TESTING_URL]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <CtaTestProvider>
              <LearningPathsPanelProvider>
                <JumpBackInPanelProvider>
                  <PlatformShell />
                </JumpBackInPanelProvider>
              </LearningPathsPanelProvider>
            </CtaTestProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Resume|Start course/ }))
    })
  }

  it('defaults to Option 1, not to the new arm', () => {
    /* ⚠ THIS BREAKS THIS REPO'S USUAL BRANCH RULE ON PURPOSE, and the test is
       where that decision is enforced. A designer's branch normally defaults
       its own work ON so the branch build shows it. Option 2 is one arm of an
       A/B a moderator assigns per participant — defaulting it on would make
       every other session link, and every reviewer's sandbox, silently the
       variant, and the comparison would have no baseline. */
    seedNav()
    expect(FEATURE_FLAGS.find((f) => f.key === 'dashboard-navigation')?.defaultVariant).toBe(
      'option-1',
    )
  })

  it('is a full-screen page — no breadcrumb, no page rail, no app header', () => {
    /* ⚠ THIS REPLACED TWO TESTS THAT ASSERTED THE OPPOSITE, and the swap is the
       record of a decision rather than a test bending to code.

       They pinned that the two arms shared a shell and rendered IDENTICALLY —
       correct while Option 2 was a variant BODY, and written to fail the day
       the variant was designed so the first real difference would be a
       deliberate edit against a known-equal baseline. It was, and they did.
       The ask that moved it: "the navigation is going to change drastically".

       So the claim inverts. The two arms now share NO chrome, because the
       navigation IS the variable rather than a confound around it. */
    seedNav('option-2')
    openCourse()
    expect(screen.queryByRole('button', { name: 'Home' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Overview' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Back to Overview' })).toBeNull()
  })

  it('keeps a SIMPLIFIED left TOC — the lessons, not the header facts again', () => {
    /* ⚠ THE TOC CAME BACK on 2026-09-23 ("we still need this to be part of
       option 2 — a simplified left TOC"), which is why the test above no
       longer claims there is no sidebar.

       SIMPLIFIED IS A CLAIM ABOUT DUPLICATION, not about styling: the course
       title, the progress track and the percentage are in this page's HEADER,
       so the TOC must not state them a second time. What it keeps is the part
       the header cannot carry — which lessons exist, which one is current, and
       how many are done. Asserted in both directions, because a TOC that
       quietly regrew its progress bar would still pass a presence check. */
    seedNav('option-2')
    openCourse()
    const toc = screen.getByLabelText('Course contents')
    expect(toc.textContent).toContain('Course Content')
    expect(toc.textContent).toMatch(/Completed \d+ of \d+/)
    expect(toc.textContent).toContain(NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX])
    // …and NOT the facts the header already states.
    expect(toc.textContent).not.toContain('New York Life and Health Pre-licensing')
    expect(toc.textContent).not.toMatch(/\d+%/)
    // The eight-page rail is Option 1's; this page has no pages to switch.
    expect(within(toc).queryByRole('button', { name: 'Flashcards' })).toBeNull()
  })

  it('names the demo’s real course and chapter, not the mock’s', () => {
    /* The mock draws "Life & Health · Life insurance policy types". The header
       states the course and chapter the rest of the session names — the
       dashboard behind it, the Study Journey, Option 1's own sidebar. A
       participant who meets two different course names in one sitting stops
       believing both. */
    seedNav('option-2')
    openCourse()
    const header = document.querySelector('header')!
    expect(header.textContent).toContain('Compass')
    expect(header.textContent).toContain(NY_LH_COURSE_CHAPTERS[NY_LH_CURRENT_CHAPTER_INDEX])
    expect(header.textContent).not.toContain('Life insurance policy types')
  })

  it('wires ✕ and leaves the rest of the header inert', () => {
    /* ⚠ THE INERT ONES ARE NOT BUTTONS, which is the assertion that matters.
       This player's rule throughout is that a control looking pressable and
       doing nothing is what gets reported as broken — so the exam pill,
       + Demo, brightness, Notes and Rubi render as spans until their behaviour
       is specified. Counting BUTTONS in the header is how that stays true. */
    seedNav('option-2')
    openCourse()
    const header = document.querySelector('header')!
    const buttons = [...header.querySelectorAll('button')]
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Close the course'])
    act(() => {
      fireEvent.click(buttons[0])
    })
    // …and it really leaves: the dashboard is back.
    expect(screen.getByRole('button', { name: /Resume|Start course/ })).toBeTruthy()
  })

  it('suppresses the app header only while it is mounted', () => {
    /* Two XCEL logos stacked is what this prevents. Asserted on the store
       rather than on `<Header />`, which lives in `AppLayout` above this whole
       tree — see `courseTakeover` for why there is no prop path between them.
       The UNMOUNT half is the one that would strand a reviewer headerless. */
    function Probe() {
      return <span data-testid="takeover">{useCourseChrome()}</span>
    }
    const { unmount } = render(
      <MemoryRouter>
        <Probe />
        <CourseContentV2
          courseTitle="X"
          chapterTitle="Y"
          percentComplete={0}
          completedLessons={0}
          totalLessons={42}
          onClose={() => {}}
        />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('takeover').textContent).toBe('takeover')
    unmount()
    render(
      <MemoryRouter>
        <Probe />
      </MemoryRouter>,
    )
    expect(screen.getByTestId('takeover').textContent).toBe('none')
  })

  it('leaves Option 1 exactly as it was', () => {
    /* The direction a variant most easily breaks: the control arm. */
    seedNav('option-1')
    openCourse()
    expect(screen.getByLabelText('Course contents')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Home' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back to Overview' })).toBeTruthy()
  })
})
