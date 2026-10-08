import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'

/**
 * HYBRID V1 HAS NO SECTION RAIL — 2026-10-06, the direct ask: "when clicking
 * into courses or certificates, I do NOT want this left rail to show up, I just
 * want the back to home link at the top left."
 *
 * WHAT PROMPTED IT was a different complaint — the rail "would not show up" on
 * My Courses and came back on reload. That was real and the cause was
 * `atlasRailClosed`, a `useState` that survives a section change and dies on a
 * reload: collapse the rail on an inner page, pass through Home (where Hybrid
 * draws no rail and therefore no toggle), come back, and it is still collapsed
 * with nothing on screen saying why. Removing the rail from these pages retires
 * that state entirely for this version — `atlasRailToggle` is `!atlasNoRail`,
 * so the toggle is never rendered and the flag can never be set.
 *
 * ⚠ THE TWO EXCEPTIONS ARE THE WHOLE TEST. `atlasNoRail` empties the rail
 * COLUMN, and two things live in that column that must not go with it:
 *
 *   1. THE COMPASS COURSE PLAYER'S CONTENTS TREE. It is drawn inside the same
 *      column, so a flat `hybridVersion` would have left the player with no way
 *      to move between its pages. The ask was about the section pages.
 *   2. EVERY OTHER VERSION. `PlatformShell` is shared chrome and Eric/Atlas V1
 *      has the same `top` placement, so the same trap — and the instruction was
 *      explicit: "Don't make changes anywhere else to any other versions."
 *      His rail and the Atlas parent's are pinned below — see the note there
 *      for why Testing 3 is not among them.
 */

function renderShell(url: string) {
  window.history.replaceState({}, '', '/dashboard-rebrand')
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

const rail = () => screen.queryByRole('navigation', { name: 'Primary' })

afterEach(cleanup)

describe('Hybrid V1’s section pages', () => {
  /* Hybrid is the brand default, so a bare URL IS Hybrid — but these name it
     anyway. The subject is this VERSION's rail, not the baseline's, and the two
     stop being the same thing the next time the default moves. */
  const HYBRID = '/dashboard-rebrand?demo=1&version=hybrid-v1'

  it.each([
    ['My Courses', 'courses'],
    ['Certificates', 'certificates'],
  ])('draws no left rail on %s', (_label, section) => {
    renderShell(`${HYBRID}&section=${section}`)
    expect(rail()).toBeNull()
    /* ⚠ AND NO COLLAPSE TOGGLE, which is the half that retires the bug this
       came from. A rail that was merely hidden would leave the toggle on
       screen, and pressing it would put `atlasRailClosed` back in play. */
    expect(screen.queryByRole('button', { name: /(Collapse|Expand) sidebar/i })).toBeNull()
  })

  it('keeps Back to Home as the way out', () => {
    /* The other half of the ask, and the reason removing the rail is not simply
       removing navigation: this link is what the rail's Home row used to be. */
    renderShell(`${HYBRID}&section=courses`)
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeTruthy()
  })

  it('still has no rail on Home, which is where it never had one', () => {
    /* Unchanged by this pass — Atlas's `top` placement already dropped the rail
       on Home. Pinned so a later "put the rail back on Hybrid" cannot quietly
       half-apply and leave Home inconsistent with the rest. */
    renderShell(HYBRID)
    expect(rail()).toBeNull()
  })

  it('⚠ KEEPS the Compass course player’s contents tree', () => {
    /* THE EXCEPTION THAT MAKES THE RULE SAFE. The player's rail is drawn in the
       same column `atlasNoRail` empties, so this is the assertion that fails if
       anyone simplifies `hybridNoSectionRail` down to `hybridVersion`. The
       symptom there is not a missing rail — it is a course you cannot navigate. */
    renderShell(`${HYBRID}&section=course&coursePage=course`)
    expect(screen.getByText(/table of contents/i)).toBeTruthy()
  })
})

describe('no other version moved', () => {
  /* ⚠ THE EXPLICIT INSTRUCTION, PINNED. `PlatformShell` is shared chrome: the
     one-line predicate that gives Hybrid its answer sits in the same expression
     every other version reads. These are what make "Hybrid only" a fact rather
     than an intention. */
  /* ⚠ THE ATLAS FAMILY ONLY, AND TESTING 3 IS DELIBERATELY NOT HERE. It had a
     rail in the browser and none in jsdom, which looked like a defect and was
     not: `atlasNoRail` is `atlasNav && …`, so it never applies to a non-Atlas
     version at all — Testing 3's rail is governed by `nav-placement`, whose
     branch default is `top` (no rail). The browser was carrying a stored flag
     value; jsdom starts clean. Asserting it here would have pinned the wrong
     axis and failed the next time that flag's default moved.

     What these two prove is the thing that actually shares the code path: the
     versions that answer `isAtlasCompassNavVersion` keep their rails while
     Hybrid, which answers it too, does not. */
  it.each([
    ['Eric/Atlas V1', 'eric-atlas-v1'],
    ['the Atlas parent', 'discoverability-atlas-compass-nav'],
  ])('%s still has its rail on My Courses', (_label, version) => {
    renderShell(`/dashboard-rebrand?demo=1&version=${version}&section=courses`)
    expect(rail()).toBeTruthy()
  })

  it('and Eric’s keeps the collapse toggle Hybrid gave up', () => {
    /* His version keeps the behaviour that prompted this, trap included. That
       is the correct outcome of "don't change any other version" and NOT an
       oversight — if his trap is ever worth fixing it is his call, and the fix
       is a reset on `atlasNoRail`, not this. */
    renderShell('/dashboard-rebrand?demo=1&version=eric-atlas-v1&section=courses')
    expect(screen.getByRole('button', { name: /Collapse sidebar/i })).toBeTruthy()
  })
})

describe('Resources takes the crumb without taking the header', () => {
  /* 2026-10-07, the direct ask: "resources page needs a back to Home link in
     top left (same as my courses)."

     ⚠ IT IS NOT A `BREADCRUMB_SECTIONS` ENTRY, and that is what these pin. That
     list swaps the page's title for Home's 28/700 one; the Atlas/Compass
     Resources page draws its own serif title and lede, so joining the list
     would have meant either losing that header or stacking two. The ask was for
     the LINK. See `SectionBackCrumb`. */
  it.each([
    ['Hybrid V1', 'hybrid-v1'],
    ['the pacing fork', 'hybrid-pacing'],
  ])('gives %s the Back to Home crumb on Resources', (_label, version) => {
    renderShell(`/dashboard-rebrand?demo=1&version=${version}&section=resources`)
    expect(screen.getByRole('button', { name: /Back to Home/i })).toBeTruthy()
  })

  it('keeps the serif title and lede that page owns', () => {
    /* The crumb sits ABOVE this, not instead of it. A regression here looks
       like a missing title, not a missing link. */
    renderShell('/dashboard-rebrand?demo=1&version=hybrid-v1&section=resources')
    expect(screen.getByRole('heading', { level: 1, name: /Resources/i })).toBeTruthy()
  })

  it('⚠ and no other version gains it', () => {
    /* The same standing instruction as the rail above, and the same reasoning
       that excludes the left-nav arm from `useSectionBreadcrumb`: Eric's Atlas
       versions KEEP the rail on their inner pages, so Home is already on
       screen there and a crumb would be a second way to a place you can see.
       Hybrid drops that rail, which is what leaves Resources with no Home
       control at all — that absence is what this link fills. */
    renderShell('/dashboard-rebrand?demo=1&version=eric-atlas-v1&section=resources')
    expect(screen.queryByRole('button', { name: /Back to Home/i })).toBeNull()
  })
})
