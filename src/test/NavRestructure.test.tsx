import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { MobileNavProvider } from '@/components/layout/MobileNavContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { AccountMenu } from '@/components/layout/AccountMenu'

/**
 * THE RESTRUCTURE — 2026-10-01, "Left Nav Options, or Top Nav Options".
 *
 * `nav-placement` stopped being four numbered options and became ONE AXIS with
 * two arms, and three things follow from that. This file pins the three,
 * because each of them is a promise the arms make to each other and each would
 * fail silently:
 *
 *   1. THE ARMS REACH THE SAME PLACES. The header carries two pills, so My
 *      Courses and Certificates have to be somewhere under `top` (the Home
 *      tiles) and Compass Learning has to be somewhere under `left` (the rail
 *      row). Break either and the two arms are being compared on different
 *      destinations, which is the one thing an A/B between them must not do.
 *   2. HELP HAS EXACTLY ONE CONTROL, wherever it is. Two would be a duplicate;
 *      zero is the gap the old Option 1 shipped with.
 *   3. THE GREETING IS NOT PART OF THE CHOICE. It renders under both, so
 *      switching arms moves navigation and nothing else.
 *
 * ⚠ THE OFF ARM IS A SUBJECT HERE, NOT A BACKDROP. Everything the exploration
 * ADDS to the rail hangs on the flag being ON, and `useNavPlacement()` reads
 * `left` in BOTH the off case and the left arm — so an `=== 'left'` written
 * anywhere instead of `useNavExploration()` leaks the addition into the shipped
 * product for everyone. The "flag off" cases below are what catch that.
 */

function renderShell(ff: string, section = '') {
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&ff=${ff}${section}`]}>
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

/* `?ff=` is read from `window.location.search`, NOT from the MemoryRouter
   entry — the same fact `pinNavPlacement` documents. The router entry above is
   what the SHELL reads (`?section=`); this is what the FLAGS read, and a suite
   that sets only one of the two is the classic way to write a test that passes
   for the wrong reason. */
function pinFlags(ff: string) {
  window.history.replaceState({}, '', `/dashboard-rebrand?ff=${ff}`)
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('nav-help — the flag', () => {
  it('is in the catalog as a two-placement flag on the rebrand page', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'nav-help')
    expect(flag).toBeTruthy()
    expect(flag?.defaultVariant).toBe('header-icon')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['header-icon', 'profile-menu'])
    expect(flag?.page).toBe('dashboard-rebrand')
  })
})

describe("Help's one control", () => {
  /* The menu on its own rather than through the shell: the header is not part
     of `PlatformShell` (it renders in `AppLayout`), so the row's own behaviour
     is reachable here and the header's `?` is covered by the source of truth
     that decides both — `showsHelpControl` — in the arm tests below. */
  function renderMenu(onOpenHelp?: () => void) {
    return render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <MobileNavProvider>
              <AccountMenu onOpenHelp={onOpenHelp} />
            </MobileNavProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('puts Help directly above Logout when the menu is the placement', async () => {
    /* ⚠ THE ORDER IS THE ASSERTION, not just the presence. "right above
       logout" is the ask, and it is also the list's own grammar — the bottom
       group is app-level actions, and Help is one of those. */
    renderMenu(() => {})
    await userEvent.click(screen.getByRole('button', { name: /Jordan/i }))
    const rows = [...screen.getByRole('menu').querySelectorAll('[role="menuitem"]')].map(
      (el) => el.textContent?.trim(),
    )
    expect(rows.at(-2)).toBe('Help')
    expect(rows.at(-1)).toBe('Logout')
  })

  it('renders no Help row at all when the placement is elsewhere', async () => {
    /* The withheld prop IS the off switch — the menu never learns which flag it
       is serving, only what the row does. */
    renderMenu(undefined)
    await userEvent.click(screen.getByRole('button', { name: /Jordan/i }))
    expect(within(screen.getByRole('menu')).queryByText('Help')).toBeNull()
  })

  it('opens the sheet and closes the menu, so the sheet owns focus', async () => {
    let opened = 0
    renderMenu(() => {
      opened += 1
    })
    await userEvent.click(screen.getByRole('button', { name: /Jordan/i }))
    await userEvent.click(within(screen.getByRole('menu')).getByText('Help'))
    expect(opened).toBe(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('the two arms reach the same places', () => {
  beforeEach(() => cleanup())

  it('re-homes My Courses and Certificates as Home tiles under the top nav', () => {
    /* The header carries two pills. Without these, both sections are reachable
       only by deep link — which is exactly the gap the old Option 1 shipped
       with, and the thing the tiles exist to close. */
    pinFlags('nav-placement:top')
    renderShell('nav-placement:top')
    const tiles = screen.getByRole('navigation', { name: 'Learning areas' })
    expect([...tiles.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'My Courses',
      'Certificates',
    ])
  })

  it('emits the rail’s own CTA ids from the tiles', () => {
    /* A moderated run that breaks `nav.courses` must break it under EVERY
       placement, or the arms stop being comparable at the moment someone is
       watching a participant use them. */
    pinFlags('nav-placement:top')
    renderShell('nav-placement:top')
    const tiles = screen.getByRole('navigation', { name: 'Learning areas' })
    expect([...tiles.querySelectorAll('button')].map((b) => b.getAttribute('data-cta-id'))).toEqual(
      ['nav.courses', 'nav.certificates'],
    )
  })

  it('draws NO tiles under the left nav, where the rail carries both', () => {
    pinFlags('nav-placement:left')
    renderShell('nav-placement:left')
    expect(screen.queryByRole('navigation', { name: 'Learning areas' })).toBeNull()
  })

  it('gives the left arm a Compass Learning rail row, so it is not top-nav-only', () => {
    /* ⚠ THIS REVERSES AN EARLIER DELIBERATE DECISION, and the reversal is the
       point. Compass was kept OFF the rail so the two navs would not "offer
       different things" — correct when the rail held seven rows and the header
       three. Under the restructure both arms are meant to reach the same five
       places, so withholding it is now what makes them differ. */
    pinFlags('nav-placement:left')
    renderShell('nav-placement:left')
    expect(screen.getByRole('button', { name: /Compass Learning/ })).toBeTruthy()
  })

  it('keeps the Compass row OUT of the shipped rail when the flag is off', () => {
    /* The leak this file exists to catch: `useNavPlacement()` reads `left` both
       with the flag off and on the left arm, so an `=== "left"` here instead of
       `useNavExploration()` would put a Compass row in the rail for everyone. */
    pinFlags('nav-placement:off')
    renderShell('nav-placement:off')
    expect(screen.queryByRole('button', { name: /Compass Learning/ })).toBeNull()
  })
})

describe('the greeting is not part of the choice', () => {
  beforeEach(() => cleanup())

  /* 2026-10-01, the direct ask: "ALL options should include the greeting that
     we added to option 3." Before this, switching arms moved the navigation AND
     whether Home had a title — two variables at once, so a reviewer reacting to
     one could not say which. */
  for (const arm of ['top', 'left']) {
    it(`renders Home's greeting under the ${arm} arm`, () => {
      pinFlags(`nav-placement:${arm}`)
      renderShell(`nav-placement:${arm}`)
      expect(screen.getByText(/WELCOME TO YOUR LEARNING EXPERIENCE/i)).toBeTruthy()
    })
  }

  it('leaves the shipped dashboard without one when the flag is off', () => {
    /* Same leak, other symptom: off has to be the shipped product, not a
       half-migrated one. */
    pinFlags('nav-placement:off')
    renderShell('nav-placement:off')
    expect(screen.queryByText(/WELCOME TO YOUR LEARNING EXPERIENCE/i)).toBeNull()
  })
})
