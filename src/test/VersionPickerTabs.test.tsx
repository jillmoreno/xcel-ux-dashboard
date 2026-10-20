import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DashboardVersionsPanel,
  type VersionPickerItem,
} from '@/components/dashboard/DashboardVersionsPanel'
import { DISCOVERABILITY_DASHBOARD_VERSIONS } from '@/data/dashboardVersions'

/**
 * WHICH VERSIONS EACH AUDIENCE CAN PICK — `maturity` on `DashboardVersion`,
 * 2026-10-05, added when the picker moved onto the demo controls bar and became
 * reachable by STAKEHOLDERS for the first time.
 *
 * ⚠ THE TWO HALVES FAIL DIFFERENTLY, which is why both are here. The FILTER
 * failing leaks an unfinished dashboard to the people being asked to approve
 * one — loud, if anyone looks. The BADGE failing is silent: the design site
 * still lists everything, so a designer simply cannot tell which versions a
 * stakeholder can see, and nothing on screen says so.
 *
 * ⚠ ALL THREE SHIPPED VERSIONS ARE `ready` TODAY, so neither half filters nor
 * marks anything in the product right now. These tests build their own
 * fixtures for that reason — asserting against the live list would pass against
 * a filter that returned everything.
 */

const ITEMS: VersionPickerItem[] = [
  {
    id: 'finished',
    label: 'First Version',
    createdAt: '2026-10-01',
    modifiedAt: '2026-10-01',
    description: 'The first one.',
  },
  {
    id: 'half-built',
    label: 'Second Version',
    createdAt: '2026-10-04',
    modifiedAt: '2026-10-04',
    description: 'A second one.',
  },
  {
    id: 'unmarked',
    label: 'Third Version',
    createdAt: '2026-10-05',
    modifiedAt: '2026-10-05',
    description: 'A third one.',
  },
]

afterEach(cleanup)

/**
 * ⚠ THE REAL CATALOG, NOT A FIXTURE — added 2026-10-05, after the promotion
 * shipped and Eric's tab still read "0 versions" on the build being looked at.
 *
 * Every other designer-tab test below builds its own `OWNED` fixture, and that
 * is right for testing the FILTER: a synthetic Eric-owned row proves the tab
 * shows what it is given. But it proves nothing about whether the live catalog
 * actually gives it anything — those tests passed on every build where Eric
 * owned nothing at all, which is precisely the state that looked broken.
 *
 * So this one renders `DISCOVERABILITY_DASHBOARD_VERSIONS` itself. It is the
 * assertion that fails the day someone's `owner` is dropped in a merge, and the
 * only one here that would have.
 */
describe('the designer tabs over the LIVE catalog', () => {
  it('gives Eric his four Atlas versions, not an empty tab', () => {
    render(
      <DashboardVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="discoverability-testing-3"
        defaultVersionId="discoverability-testing-3"
        onSelectVersion={() => {}}
        onSetDefault={() => {}}
        versions={DISCOVERABILITY_DASHBOARD_VERSIONS}
        designerTabs
        hideSetDefault
      />,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Eric' }))
    // V1 came off the picker and V2 was renamed on 2026-10-12.
    expect(screen.queryByText('Eric/Atlas V1')).toBeNull()
    expect(screen.getByText('Eric/Atlas Right SB Quick Links')).toBeTruthy()
    expect(screen.getByText('Eric/Atlas WIP')).toBeTruthy()
    expect(screen.getByText('Eric/Atlas White')).toBeTruthy()
    expect(screen.getByText('End-to-End Demo')).toBeTruthy()
    expect(screen.getByText('Atlas/Compass Global Navigation')).toBeTruthy()
    /* The count beside the strip is read off the FILTERED list, so "0 versions"
       on a populated tab is the exact symptom this pins. Four: V1 came off
       and Eric/Atlas White joined, both 2026-10-12; five with End-to-End
       Demo, 2026-10-14. */
    expect(screen.getByText(/5 versions/)).toBeTruthy()
  })

  /* ⚠ JILL'S TAB IS ONE ROW NOW — 2026-10-20. It held Testing, Testing 3,
     Learner Focused and Jill/Atlas-Main; the first three were archived that
     day ("archive these views from Jill") and only the last remains, which is
     also the brand default. The case's SUBJECT is unchanged and is the reason
     it is updated rather than deleted: a tab that filters to nothing looks
     identical to a filter that is broken, so what is pinned is that hers is
     populated and Eric's rows are not in it. */
  it('still shows Jill hers, so the filter is filtering and not emptying', () => {
    render(
      <DashboardVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="jill-atlas-main"
        defaultVersionId="jill-atlas-main"
        onSelectVersion={() => {}}
        onSetDefault={() => {}}
        versions={DISCOVERABILITY_DASHBOARD_VERSIONS}
        designerTabs
        hideSetDefault
      />,
    )
    expect(screen.getByText('Jill/Atlas-Main')).toBeTruthy()
    expect(screen.queryByText('Eric/Atlas V1')).toBeNull()
    expect(screen.queryByText('Eric/Atlas White')).toBeNull()
  })
})

/**
 * THE DESIGNER TABS — moved here from the Feature Flag sheet on 2026-10-05,
 * the direct ask. A VERSION is the thing a designer owns; the flags are read
 * inside whichever version is rendering, so this is where the question belongs.
 */
const OWNED: VersionPickerItem[] = [
  { ...ITEMS[0], id: 'jills', label: 'Jill’s Version' },
  { ...ITEMS[0], id: 'erics', label: 'Eric’s Version', owner: 'eric' },
  { ...ITEMS[0], id: 'unowned', label: 'Unowned Version' },
]

function renderOwned(designerTabs = true) {
  return render(
    <DashboardVersionsPanel
      open
      onClose={() => {}}
      activeVersionId="jills"
      defaultVersionId="jills"
      onSelectVersion={() => {}}
      onSetDefault={() => {}}
      versions={OWNED}
      hideSetDefault
      designerTabs={designerTabs}
    />,
  )
}

describe('the designer tabs', () => {
  it('open on Jill and show hers', () => {
    renderOwned()
    expect(screen.getByRole('tab', { name: 'Jill' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Jill’s Version')).toBeTruthy()
    expect(screen.queryByText('Eric’s Version')).toBeNull()
  })

  it('treat an UNOWNED version as Jill’s', () => {
    /* ⚠ THE DEFAULT, AND THE ONE THAT MATTERS TODAY: every version in the real
       catalog is unowned, so if this resolved any other way the live picker
       would open empty. */
    renderOwned()
    expect(screen.getByText('Unowned Version')).toBeTruthy()
  })

  it('switch to Eric’s and show only his', () => {
    renderOwned()
    act(() => fireEvent.click(screen.getByRole('tab', { name: 'Eric' })))
    expect(screen.getByText('Eric’s Version')).toBeTruthy()
    expect(screen.queryByText('Jill’s Version')).toBeNull()
    expect(screen.queryByText('Unowned Version')).toBeNull()
  })

  it('count beside the strip, never inside a pill', () => {
    /* CLAUDE.md's rule for every segmented filter here. */
    renderOwned()
    expect(screen.getByText('2 versions')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Jill' }).textContent).toBe('Jill')
  })

  it('are OPT-IN — the other pickers this panel serves have no designers', () => {
    /* ⚠ THE SAME COMPONENT draws the Explore Dashboard list and the Membership
       page versions. Jill / Eric over a Membership version list would be two
       people's names on something neither owns. */
    renderOwned(false)
    expect(screen.queryByRole('tab', { name: 'Jill' })).toBeNull()
    expect(screen.getByText('Eric’s Version')).toBeTruthy()
  })

  it('keep the Default badge visible on a filtered tab', () => {
    /* ⚠ COUNTED OFF THE WHOLE LIST, not the tab. The badge marks what the
       product renders, and that does not stop being true because a filter is
       on — hiding it on a one-version tab would make the default invisible
       exactly where someone is deciding whether to replace it. */
    renderOwned()
    expect(screen.getByText('Default')).toBeTruthy()
  })
})
