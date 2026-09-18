import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { COMPASS_PANES } from '@/components/learning/compassCoursePanes'
import { SUBNAV_WIDTH } from '@/components/ui/SubNav'
import { COMPASS_NAME } from '@/components/learning/JumpBackInWidget'

/**
 * THE COMPASS LAUNCHER'S SUB-NAV — 2026-09-18, the direct ask: the account
 * pages' secondary navigation "also needs to exist on that page", with five
 * options (Overview · Course · Flashcards · Exam Simulator · Progress).
 *
 * Two things are worth pinning beyond "it renders", and they are the two ways
 * this goes wrong later:
 *
 *   1. **It must stay ONE treatment with the account rail.** Both draw the
 *      shared `SubNav`; a later "just inline it here" is how two sub-navs end
 *      up a few pixels and one font weight apart.
 *   2. **No pane may grow content.** The whole launcher is a placeholder, and
 *      five panes is five new invitations to author Compass UI nobody has
 *      designed — the move this version has refused throughout.
 */
const NAV = 'Compass course sections'

function renderShell(url = '/dashboard-rebrand') {
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

/** Open the launcher the way a learner does — Resume on the dashboard. There is
 *  no URL that reaches it (see the pane-state note in `CourseLauncherView`), so
 *  the click IS the only door and every test here goes through it. */
function openLauncher(container: HTMLElement) {
  fireEvent.click(within(container).getByRole('button', { name: /^resume\b/i }))
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('the Compass launcher sub-nav', () => {
  it('lists the five panes in order, under its own region name', () => {
    // ORDER IS THE ASK'S OWN and reads as the path through a course: what this
    // is, the material, the drilling, the mock exam, then how it went. Compared
    // against `COMPASS_PANES` rather than a second literal, so the list cannot
    // be reordered in one place only.
    const { container } = renderShell()
    openLauncher(container)
    const nav = screen.getByRole('navigation', { name: NAV })
    expect(
      within(nav)
        .getAllByRole('button')
        .map((b) => b.textContent?.trim()),
    ).toEqual(COMPASS_PANES.map((p) => p.label))
    expect(COMPASS_PANES.map((p) => p.label)).toEqual([
      'Overview',
      'Course',
      'Flashcards',
      'Exam Simulator',
      'Progress',
    ])
  })

  it('is NOT named the same as the account sub-nav', () => {
    // Two regions sharing one accessible name is a real defect for anyone
    // navigating by landmark — and the band/section pair already documented in
    // `StudyJourneyWidget` is the example of it going unnoticed. The account
    // rail is "Account sections"; this is its own.
    const { container } = renderShell()
    openLauncher(container)
    expect(screen.getByRole('navigation', { name: NAV })).toBeTruthy()
    expect(screen.queryByRole('navigation', { name: 'Account sections' })).toBeNull()
  })

  it('opens on Overview, and moves aria-current on click', () => {
    const { container } = renderShell()
    openLauncher(container)
    const nav = screen.getByRole('navigation', { name: NAV })
    const row = (name: string) => within(nav).getByRole('button', { name })
    expect(row('Overview')).toHaveAttribute('aria-current', 'page')

    fireEvent.click(row('Flashcards'))
    expect(row('Flashcards')).toHaveAttribute('aria-current', 'page')
    expect(row('Overview')).not.toHaveAttribute('aria-current')
  })

  it('names the selected pane above the placeholder, so a click changes something', () => {
    /*
     * THE ASSERTION THAT MATTERS MOST HERE. Every pane shows the same
     * placeholder, so without a heading that moves, clicking a row would shift
     * the active pill and alter nothing else — a nav that reads as broken.
     *
     * Asserted through the HEADING rather than by the pill's colour: the pill
     * is `--color-primary-100` and measures 1.07:1 against the page grey, i.e.
     * decoration. What carries the state is this heading, the row's weight and
     * `aria-current` — the "never colour alone" rule, which this treatment
     * passes only because those three exist.
     */
    const { container } = renderShell()
    openLauncher(container)
    const heading = () => container.querySelector('h2')?.textContent
    expect(heading()).toBe('Overview')

    const nav = screen.getByRole('navigation', { name: NAV })
    fireEvent.click(within(nav).getByRole('button', { name: 'Exam Simulator' }))
    expect(heading()).toBe('Exam Simulator')
  })

  it('invents no content on any pane — the placeholder is all five', () => {
    // The launcher replaced an embedded `CourseDetailPage` on 2026-09-17
    // precisely because that page drew `mm/dd/yyyy`, "Not Started · 0%" and an
    // Enroll button against the catalogue fixture. Five panes must not be five
    // openings to put that back: each one shows the lo-fi block and says so.
    const { container } = renderShell()
    openLauncher(container)
    const nav = screen.getByRole('navigation', { name: NAV })
    for (const { label } of COMPASS_PANES) {
      fireEvent.click(within(nav).getByRole('button', { name: label }))
      expect(screen.getByText('This is where Compass Course content will live.')).toBeTruthy()
      expect(
        container.querySelector('[aria-label="Compass course content — placeholder"]'),
      ).toBeTruthy()
      expect(container.textContent).not.toMatch(/mm\/dd\/yyyy|Enroll/i)
    }
  })

  it('is a selector, not links — nothing in it navigates away from the shell', () => {
    // The account rail's own doctrine, and it applies harder here: the launcher
    // is not addressable, so an anchor would have nowhere honest to point.
    const { container } = renderShell()
    openLauncher(container)
    const nav = screen.getByRole('navigation', { name: NAV })
    expect(nav.querySelectorAll('a')).toHaveLength(0)
  })

  it('keeps the back link, so a learner is never stranded in a pane', () => {
    // The launcher has no rail item, so this link carries all the orientation
    // — and switching panes must not be able to consume it. It reads "Back to
    // Atlas Home" since the header landed on 2026-09-18; this expectation was
    // 'Back to Home' and is repointed rather than dropped, because what it
    // guards (the link survives a pane change) is unchanged.
    const { container } = renderShell()
    openLauncher(container)
    const nav = screen.getByRole('navigation', { name: NAV })
    fireEvent.click(within(nav).getByRole('button', { name: 'Progress' }))
    expect(screen.getByRole('button', { name: 'Back to Atlas Home' })).toBeTruthy()
  })
})

describe('the two sub-navs are one treatment', () => {
  it('both render the shared SubNav class, not a lookalike', () => {
    const { container, unmount } = renderShell()
    openLauncher(container)
    const launcherRows = container.querySelectorAll(
      'nav[aria-label="Compass course sections"] .cre-account-subnav-item',
    )
    expect(launcherRows.length).toBe(COMPASS_PANES.length)
    unmount()

    const account = renderShell('/dashboard-rebrand?section=profile')
    expect(
      account.container.querySelectorAll(
        'nav[aria-label="Account sections"] .cre-account-subnav-item',
      ).length,
    ).toBeGreaterThan(0)
  })

  it('composes it at SOURCE in both places, so a near-copy fails', () => {
    /*
     * Read from source because the DOM cannot tell a shared component from a
     * faithful copy — which is exactly the state this change started in, with
     * the account rail owning the markup privately. The regression is someone
     * inlining the rail again to tweak one surface.
     */
    const account = readFileSync('src/components/account/AccountSubNav.tsx', 'utf8')
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    for (const src of [account, shell]) {
      expect(src).toMatch(/from '@\/components\/ui\/SubNav'/)
      expect(src).toMatch(/<SubNav\b/)
    }
    // …and neither re-declares the rail's own geometry.
    expect(account).not.toContain('width: 208')
    expect(shell).not.toContain('width: 208')
    expect(SUBNAV_WIDTH).toBe(208)
  })
})

describe('the Compass secondary header', () => {
  /**
   * 2026-09-18, the direct ask: "add a secondary header for the Compass
   * Learning section, includes the Back to Atlas Home Link. Far right should
   * have an Ask Rubi Chat section."
   */
  const header = (container: HTMLElement) => container.querySelector('section > header')!

  it('names the section and carries the back link and the composer', () => {
    const { container } = renderShell()
    openLauncher(container)
    const h = header(container)
    expect(h).toBeTruthy()
    expect(h.textContent).toContain(COMPASS_NAME)
    // FAR RIGHT is a DOM-order claim as well as a visual one: the composer is
    // the last thing in the bar, after the left cluster. jsdom has no layout,
    // so order is what can actually be asserted — `justify-content:
    // space-between` does the rest and is read from source below.
    const kids = Array.from(h.children)
    expect(kids).toHaveLength(2)
    expect(kids[0].textContent).toContain('Back to Atlas')
    expect(kids[1].getAttribute('role')).toBe('search')
  })

  it('says "Back to Atlas Home" and still goes back', () => {
    // ATLAS is the platform, Compass the player — the two names are what carry
    // the boundary this header draws. The label keeps the ORIGIN rather than
    // hardcoding Home: this link is the launcher's whole orientation, so one
    // that says Home while returning you to the Study Plan would be worse than
    // a longer label. At the demo default the origin IS Home, which is the
    // string the ask names.
    const { container } = renderShell()
    openLauncher(container)
    const back = screen.getByRole('button', { name: 'Back to Atlas Home' })
    expect(back.textContent).toContain('Back to Atlas Home')

    fireEvent.click(back)
    // Back on the dashboard: the launcher's own sub-nav is gone.
    expect(screen.queryByRole('navigation', { name: NAV })).toBeNull()
  })

  it('builds that label from the origin section, not a literal', () => {
    // Asserted at source because the launcher opens from Home in every render
    // this suite can reach — so a hardcoded "Home" would pass the DOM test
    // above while silently lying to a learner who resumed from the Study Plan.
    const shell = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')
    expect(shell).toContain('Back to Atlas {backLabel}')
    expect(shell).toContain('aria-label={`Back to Atlas ${backLabel}`}')
    expect(shell).toContain('justifyContent: \'space-between\'')
  })

  it('shares the Compass name with the Jump Back In eyebrow', () => {
    // ONE constant, the `CURRENT_LEARNING_EYEBROW` precedent: the header and
    // that eyebrow are the two places the product is named, and two literals
    // is how one gets renamed alone.
    const { container, unmount } = renderShell()
    expect(container.textContent).toContain(`${COMPASS_NAME} - Jump Back In`)
    openLauncher(container)
    expect(header(container).textContent).toContain(COMPASS_NAME)
    unmount()
    expect(COMPASS_NAME).toBe('Learning With Compass')
  })
})

describe('Ask Rubi', () => {
  const composer = () => screen.getByRole('search', { name: 'Ask Rubi' })
  const send = () => screen.getByRole('button', { name: 'Send question to Rubi' })

  it('disables send until there is a question', () => {
    // An enabled send on an empty field is a button that does nothing on
    // click. The field beside it says what is needed, which is why the cursor
    // stays default rather than `not-allowed`.
    const { container } = renderShell()
    openLauncher(container)
    expect(send()).toBeDisabled()
    fireEvent.change(within(composer()).getByLabelText('Ask Rubi a question'), {
      target: { value: 'What does the 70% chapter floor apply to?' },
    })
    expect(send()).toBeEnabled()
  })

  it('opens a sheet OVER the course, echoes the question, and invents no answer', () => {
    /*
     * THE LOAD-BEARING TEST HERE. There is no Rubi behind this, and a
     * fabricated tutor answer about New York insurance law is worse than most
     * invented copy because a learner would act on it. So the sheet shows the
     * learner's OWN words and a lo-fi block, and nothing else.
     *
     * "Over the course" is the other half: a tutor you consult mid-lesson must
     * not replace the lesson, so the pane and its sub-nav are still mounted
     * behind the sheet.
     */
    const { container } = renderShell()
    openLauncher(container)
    const q = 'Does a NY licence cover accident and health?'
    fireEvent.change(within(composer()).getByLabelText('Ask Rubi a question'), { target: { value: q } })
    fireEvent.click(send())

    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText(q)).toBeTruthy()
    expect(within(sheet).getByText('You asked')).toBeTruthy()
    expect(within(sheet).getByText(/This is where Rubi’s answer will live\./)).toBeTruthy()
    expect(sheet.querySelector('[aria-label="Rubi’s answer — placeholder"]')).toBeTruthy()
    // The course is still there underneath.
    expect(screen.getByRole('navigation', { name: NAV })).toBeTruthy()
    // The field cleared — but the question is on screen, so it does not read
    // as a failed send.
    expect(within(composer()).getByLabelText('Ask Rubi a question')).toHaveValue('')
  })

  it('keeps no colour or background inline on the send button', () => {
    /*
     * THE DEFECT MEASURING CAUGHT, pinned so it cannot come back. `color` was
     * inline while `.cre-ask-rubi-send:disabled` set the ink — and an inline
     * colour BEATS a stylesheet rule, so the disabled glyph rendered white on
     * the grey disc at 1.69:1 with the rule matching, computing and doing
     * nothing. Third time in this repo (`.cre-uxlinks-title`, the PSI link).
     *
     * Read from source: jsdom applies the stylesheet, so a DOM check cannot
     * see which of the two won.
     */
    const src = readFileSync('src/components/learning/AskRubiChat.tsx', 'utf8')
    const decl = src.slice(src.indexOf('const sendStyle'), src.indexOf('const askedLabelStyle'))
    expect(decl).not.toMatch(/\bcolor:/)
    expect(decl).not.toMatch(/\bbackground:/)

    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-ask-rubi-send\s*\{[^}]*color:/)
    expect(css).toMatch(/\.cre-ask-rubi-send:disabled\s*\{[^}]*color:/)
  })

  it('gives the placeholder its own ink, since it is the field’s only label', () => {
    // 2.75:1 on the browser default, and unlike the Links panel's known
    // 4.34:1 placeholders — which sit under visible labels — this field has
    // none, so the placeholder is carrying the control's identity. Measured
    // 5.74:1 light / 9.38:1 dark after the fix.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-ask-rubi-input::placeholder\s*\{[^}]*color:\s*var\(--color-text-secondary\)/)
    // `opacity: 1` too — Firefox dims placeholders by default and would undo it.
    expect(css).toMatch(/\.cre-ask-rubi-input::placeholder\s*\{[^}]*opacity:\s*1/)
  })
})
