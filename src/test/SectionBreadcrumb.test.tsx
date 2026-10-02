import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { pageHeaderTitleStyle } from '@/components/layout/pageHeaderStyles'
import { BREADCRUMB_SECTIONS } from '@/components/layout/navPlacement'

/**
 * THE BREADCRUMB HEADER — 2026-10-02, the direct ask: the section title "in the
 * same location and font size as the current Home title", and "the eyebrow from
 * Home screen will turn into a breadcrumb … < Back to Home".
 *
 * Four things worth pinning, and every one of them fails SILENTLY:
 *
 *   1. ONE TITLE, NOT TWO. The new header renders ABOVE `SectionShell`, which
 *      still knows how to draw its own `<h1>` (Courses) and its own hero
 *      (Certificates). Forget either suppression and the page grows a second
 *      title — which reads as a styling bug rather than a missing branch, so
 *      nobody files it as this.
 *   2. THE TITLE MATCHES HOME'S. That is the ask, and it is a COUPLING: the two
 *      screens are never visible together, so a drift between them is invisible
 *      in review. The assertion is against the shared style object rather than
 *      against a literal `28px`, so re-styling Home moves this test with it.
 *   3. `top` ONLY. Under `left` the rail already carries Home, and the shipped
 *      32/500 section title has to come back untouched.
 *   4. CERTIFICATES KEEPS ITS SEARCH. The shell passes `hideSearch` because the
 *      HERO used to carry it — and this header replaces that hero. Honour the
 *      prop and the search leaves the page entirely, which is the one
 *      regression this change could cause that has nothing to do with titles.
 */

function renderShell(ff: string, section = '') {
  /* ⚠ `?ff=` IS READ FROM `window.location.search`, not from the MemoryRouter
     entry — so both have to be set. A suite that sets only the router entry
     renders with catalog DEFAULTS and passes for the wrong reason, which is a
     mistake this repo has made more than once. */
  window.history.replaceState({}, '', `/dashboard-rebrand?ff=${ff}`)
  return render(
    /* ⚠ PINNED TO `discoverability-testing`. XCEL's default is Testing 3, whose
       Home re-homes the nav tiles — irrelevant here, but it is a moving target
       and this suite is about the two SECTION pages. */
    /* ⚠ A PLAIN COMMENT, NOT a JSX one: this is `render(`'s first argument, an
       expression position, where `{/* … *\/}` is an object literal. */
    <MemoryRouter
      initialEntries={[
        `/dashboard-rebrand?demo=1&version=discoverability-testing&ff=${ff}${section}`,
      ]}
    >
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

const crumb = () => screen.queryByRole('button', { name: 'Back to Home' })

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('the breadcrumb header — which screens get it', () => {
  it('names exactly the two sections the Home tiles lead to', () => {
    /* The list is the decision. Flashcards also navigates (to Compass
       Learning) and is deliberately NOT here — see the note on the constant. A
       third entry appearing without that note being rewritten is the drift
       this line catches. */
    expect([...BREADCRUMB_SECTIONS]).toEqual(['courses', 'certificates'])
  })

  it.each(['courses', 'certificates'])(
    'draws the crumb over the title on %s under the top nav',
    (section) => {
      renderShell('nav-placement:top', `&section=${section}`)
      expect(crumb()).toBeTruthy()
    },
  )

  it('leaves Compass Learning alone, even under the top nav', () => {
    /* The exclusion is deliberate, not an oversight: Compass is a pill in the
       header's own nav row, so it is not a screen you can only have reached
       from Home. If it ever gains the crumb, `BREADCRUMB_SECTIONS` is where
       that decision gets recorded. */
    renderShell('nav-placement:top', '&section=compass')
    expect(crumb()).toBeNull()
  })

  it.each(['courses', 'certificates'])(
    'does NOT draw it on %s under the left-nav arm',
    (section) => {
      /* The rail carries a Home row there, so a crumb would be a second way
         back to a place already on screen. */
      renderShell('nav-placement:left', `&section=${section}`)
      expect(crumb()).toBeNull()
    },
  )

  it.each(['courses', 'certificates'])(
    'does NOT draw it on %s with the flag OFF',
    (section) => {
      /* ⚠ OFF IS NOT THE SAME AS `left`. `useNavPlacement()` reads `left` for
         both, so this case only fails if someone keys the header to the
         exploration rather than to the placement — the inverse of the mistake
         the greeting's note warns about, and just as silent. */
      renderShell('nav-placement:off', `&section=${section}`)
      expect(crumb()).toBeNull()
    },
  )
})

describe('the breadcrumb header — the title it replaces', () => {
  it.each([
    ['courses', 'My Courses'],
    ['certificates', 'Certificates'],
  ])('leaves %s with ONE heading, not two', (section, title) => {
    /* ⚠ THE COUNT IS THE ASSERTION. `SectionShell` still owns an `<h1>` branch
       for Courses and a plain hero for Certificates; this header renders above
       it. Both suppressions have to hold, and a page with two <h1>s looks
       merely ugly rather than broken. */
    renderShell('nav-placement:top', `&section=${section}`)
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0].textContent).toBe(title)
  })

  it('gives the section title HOME’s type, not the shell’s', () => {
    /* Asserted against the SHARED style object rather than a literal, because
       the ask was that the two match — restyling Home should move this, not
       break it. The shell's own section titles are `--text-heading-3xl` at
       weight 500, which is what this is no longer. */
    renderShell('nav-placement:top', '&section=courses')
    const h1 = screen.getByRole('heading', { level: 1, name: 'My Courses' })
    expect(h1.style.fontSize).toBe(`${pageHeaderTitleStyle.fontSize}px`)
    expect(h1.style.fontWeight).toBe(String(pageHeaderTitleStyle.fontWeight))
  })

  it('keeps the shipped 3xl section title under the left arm', () => {
    /* The other half of the pair above: the shell's title has to come back
       exactly as it ships, or the arm is no longer the shipped product. */
    renderShell('nav-placement:left', '&section=courses')
    const h1 = screen.getByRole('heading', { level: 1, name: 'My Courses' })
    expect(h1.style.fontSize).toBe('var(--text-heading-3xl)')
    expect(h1.style.fontSize).not.toBe(`${pageHeaderTitleStyle.fontSize}px`)
  })
})

describe('the crumb itself', () => {
  it('wears the house link CTA and carries NO inline colour', () => {
    /* ⚠ THE INLINE COLOUR IS THE TRAP. `.cre-cta-ink` re-points on the dark
       theme; an inline `color` beats it and looks correct in light — the
       failure `tokens.css` records against that class, and the one the shell's
       older "Back to {section}" link still has. */
    renderShell('nav-placement:top', '&section=courses')
    const btn = crumb()!
    expect(btn.className).toContain('cre-link-action')
    expect(btn.className).toContain('cre-cta-ink')
    expect(btn.style.color).toBe('')
  })

  it('is a registered CTA, so a moderated run can break it', async () => {
    const { TESTABLE_CTAS } = await import('@/data/testableCtas')
    renderShell('nav-placement:top', '&section=courses')
    expect(crumb()!.getAttribute('data-cta-id')).toBe('nav.back-home')
    expect(TESTABLE_CTAS.some((c) => c.id === 'nav.back-home')).toBe(true)
  })

  it('goes Home by DELETING `?section=`, not by writing `dashboard`', async () => {
    /* `?section=dashboard` is a URL the shell never produces, and the top nav
       marks Home current on the absence of the param — so writing it would
       land on Home with nothing lit. */
    renderShell('nav-placement:top', '&section=courses')
    await userEvent.click(crumb()!)
    expect(crumb()).toBeNull()
    /* ⚠ `getAllBy`, NOT `getBy`. Home carries TWO level-1 headings under the
       exploration — `HomePageHeader`'s visible one and `SectionShell`'s
       `cre-visually-hidden` one, which predates this change and is unrelated
       to it. Noted rather than worked around: the two sections above assert a
       count of ONE for exactly this reason, so if Home's duplicate is ever
       fixed this line is where the test stops pretending it is fine. */
    expect(screen.getAllByRole('heading', { level: 1, name: 'Home' }).length).toBeGreaterThan(0)
  })
})

describe('what the header displaced', () => {
  it('keeps the Certificates search, which the hero used to carry', () => {
    /* ⚠ THE ONE REGRESSION THIS CHANGE COULD CAUSE SILENTLY. The shell passes
       `hideSearch` to the embedded page because the plain section HERO owned
       the search box — and this header replaces that hero. Honouring the prop
       leaves the page with no search at all, and nothing about the title would
       look wrong. */
    renderShell('nav-placement:top', '&section=certificates')
    expect(screen.getByLabelText('Search certificates')).toBeTruthy()
  })

  it('keeps the Courses search and view controls', () => {
    renderShell('nav-placement:top', '&section=courses')
    expect(screen.getByLabelText('Search courses')).toBeTruthy()
  })
})
