import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSION_QE_FOCUSED,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2,
  defaultDiscoverabilityVersionFor,
} from '@/data/dashboardVersions'

/**
 * TESTING 2, after the two alignment asks of 2026-09-21.
 *
 * It had no integration suite of its own before this: `StudyPaceTile.test.tsx`
 * covers the one tile that made it different, and everything else it inherited
 * from QE Focused was covered there. It needs one now because two asks moved
 * version-level furniture onto it, and neither is visible from the tile:
 *
 *   1. The Atlas Study Journey treatment — framed card, post-course steps split
 *      into four widgets — which Testing already had.
 *   2. The trimmed three-row rail, which Testing already had.
 *
 * **XCEL's default is TESTING, not this version** — asserted in
 * `TestingVersion.test.tsx`, beside the claim it inverted. This file deliberately
 * asserts nothing about the default: the two versions are a pair, the default
 * has now moved twice in one day, and a second copy of that fact here is one
 * more place to forget.
 *
 * THE PAIRING IS THE POINT, and the assertion this file exists to carry is the
 * one that stops 1 and 2 going too far: Testing and Testing 2 ask different
 * questions of ONE tile. Everything AROUND that tile should now match, and the
 * tile row itself must not — Testing gives the whole row to Study Pace,
 * Testing 2 keeps the square PAIR with a live tile in the left half. A change
 * that aligned the two versions' tile rows would dissolve the comparison while
 * every other test here kept passing.
 */

const T2_URL = `/dashboard-rebrand?version=${DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2.id}`
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

const rightColumn = () =>
  (document.querySelector('.cre-learner-focused-band') as HTMLElement).children[1] as HTMLElement

const cardLabels = () =>
  [...rightColumn().querySelectorAll(':scope > section')].map((c) => c.getAttribute('aria-label'))

/** Row labels inside one nav group's `<ul>`. Group-aware, for the reason
 *  `NavSectionFlags.test.tsx` records: a flat in-order check cannot see a row
 *  moving between groups. */
const groupRows = (caption: string) =>
  within(screen.getByRole('list', { name: caption }))
    .getAllByRole('button')
    .map((b) => b.textContent?.trim())

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('Testing 2 is reached deliberately, not by default', () => {
  it('is NOT what a bare /dashboard-rebrand renders — Testing is', () => {
    /* The default moved twice on 2026-09-21 and landed on TESTING. Asserted
       here as "not this one" rather than by naming the winner: which version IS
       the default lives in `TestingVersion.test.tsx`, beside the claim it
       inverted, and a second copy of it here is one more thing to forget when
       it moves again.

       Checked on the PAGE, not just the helper, because the two are different
       claims — the helper being right does not prove the `?version=` fallback
       reads it. Identified by what only Testing 2 has: a live Study Pace tile
       holding its 1:1 square. */
    expect(defaultDiscoverabilityVersionFor('xcel')).not.toBe(
      DISCOVERABILITY_DASHBOARD_VERSION_TESTING_2.id,
    )
    seed()
    renderShell('/dashboard-rebrand')
    expect(document.querySelectorAll('[style*="aspect-ratio"]')).toHaveLength(0)
  })
})

describe('Testing 2 keeps the square PAIR — the whole difference from Testing', () => {
  it('renders a live Study Pace tile that still holds its square', () => {
    seed()
    renderShell(T2_URL)
    const tile = screen.getByText('Study Pace').parentElement as HTMLElement
    expect(tile.style.aspectRatio).toBe('1 / 1')
    // One control, and it is Adjust — the claim `StudyPaceTile.test.tsx` counts
    // in isolation, re-checked here because the version is the reason it holds.
    expect(within(tile).getByRole('button', { name: 'Adjust' })).toBeTruthy()
  })

  it('keeps Readiness beside it, where Testing drops it', () => {
    /* THE ASSERTION THAT PROTECTS THE COMPARISON. Testing gives the whole row
       to Study Pace (`paceOnly`); Testing 2 keeps both halves. Aligning the two
       versions' journey and rail — which 2026-09-21 deliberately did — must not
       creep into this row, or the pair stops being two questions about one
       slot and becomes two drafts of one design. */
    seed()
    renderShell(T2_URL)
    expect(screen.getByText('Readiness')).toBeTruthy()
  })

  it('…and Testing still does not', () => {
    // The other direction, so a regression that dropped Readiness from BOTH
    // cannot pass the test above by making them agree.
    seed()
    renderShell(TESTING_URL)
    const tiles = document.querySelectorAll('[style*="aspect-ratio"]')
    expect(tiles.length).toBe(0)
  })
})

describe('the Atlas Study Journey treatment (2026-09-21)', () => {
  /* "update testing 2 view to have the newer Atlas Study Journey UI" — the
     framed card plus the post-course steps as one widget each.

     It moved off `paceOnly` and onto its own `journeyCards` prop to get here.
     That prop's predecessor note asked for exactly this rename in advance
     ("Rename both if a version ever wants one without the other"), because
     `paceOnly` also removes the Readiness tile — which is the one thing
     Testing 2 must keep. */

  it('renders the four cards, in route order', () => {
    seed()
    renderShell(T2_URL)
    expect(cardLabels()).toEqual([
      'Study journey',
      'Schedule State Exam',
      'Pass State Exam',
      'Get Licensed in New York',
    ])
  })

  it('carries the journey’s own range in its eyebrow, so the sequence starts at 01', () => {
    /* Without it the column reads "Atlas Study Journey / Step 05 / 06 / 07" and
       the sequence appears to begin at 05. DERIVED from the real stop count, so
       the range and the steps' offset cannot disagree. */
    seed()
    renderShell(T2_URL)
    const eyebrows = [...rightColumn().querySelectorAll('p.cre-eyebrow-ink')].map((p) =>
      p.textContent?.trim(),
    )
    expect(eyebrows[0]).toMatch(/^Steps 01–\d\d · Atlas Study Journey$/)
  })

  it('leaves QE Focused on the single-card treatment', () => {
    /* The version this was NOT applied to, asserted because "give Testing 2 the
       newer journey" and "change the journey everywhere" are one edit apart and
       look identical in a diff. QE Focused stays in the picker as the thing the
       two pacing versions are compared against. */
    seed()
    renderShell(QE_URL)
    const right = (document.querySelector('.cre-learner-focused-band') as HTMLElement)
      .children[1] as HTMLElement
    expect(right.querySelector('p.cre-eyebrow-ink')?.textContent?.trim()).toBe(
      'Atlas Study Journey',
    )
    expect([...right.querySelectorAll(':scope > section')]).toHaveLength(0)
  })
})

describe('the Testing 2 rail is trimmed to match', () => {
  /* "also update Testing 2 to have these nav elements, hide all others."

     Same constant, same mechanism as Testing: a property of the LAYOUT, not
     four `NAV_SECTION_FLAGS` edits, so the committed demo baseline is untouched
     — which matters more now than it did, since the baseline is what QE Focused
     shows and QE Focused is no longer the default carrying it. */

  it('leaves Home · My Courses · Certificates under My Learning', () => {
    // The WHOLE group, in order — not "Study Plan is absent", which would pass
    // just as happily if the rail failed to render at all.
    seed()
    renderShell(T2_URL)
    expect(groupRows('My Learning')).toEqual(['Home', 'My Courses', 'Certificates'])
  })

  it('keeps Support intact', () => {
    seed()
    renderShell(T2_URL)
    expect(groupRows('Support')).toEqual(['Get Help'])
  })

  it('hides the ROWS only — every section still resolves', () => {
    /* What makes a trimmed rail an editorial act rather than a feature cut, and
       the half that would quietly stop being true. */
    seed()
    renderShell(`${T2_URL}&section=readiness`)
    expect(screen.getByRole('heading', { level: 1, name: 'Readiness' })).toBeTruthy()
  })

  it('renders no collapse toggle', () => {
    /* ONE WITHHELD PROP (`onToggleCollapse`), the mechanism the rail already
       documents. `collapsed` is still passed — the launcher auto-collapse is
       not the learner's control and must keep working, so hiding the toggle
       removes the affordance and not the state. */
    seed()
    renderShell(T2_URL)
    expect(screen.queryByRole('button', { name: /collapse|expand/i })).toBeNull()
  })

  it('leaves the QE Focused rail exactly as it was', () => {
    /* The one that matters most, and it now guards a baseline no default
       renders: these seven rows are the committed `NAV_SECTION_FLAGS` set.
       Trimming them at the flag would have moved the baseline itself, which is
       why both pacing versions trim by layout instead. */
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
})
