import { render, screen, cleanup, act, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DashboardVersionsPanel,
  type VersionPickerItem,
} from '@/components/dashboard/DashboardVersionsPanel'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  dashboardVersionsForAudience,
} from '@/data/dashboardVersions'

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
    label: 'Finished Version',
    createdAt: '2026-10-01',
    modifiedAt: '2026-10-01',
    description: 'Ready for anyone.',
    maturity: 'ready',
  },
  {
    id: 'half-built',
    label: 'Half Built Version',
    createdAt: '2026-10-04',
    modifiedAt: '2026-10-04',
    description: 'Still being argued about.',
    maturity: 'wip',
  },
  {
    id: 'unmarked',
    label: 'Unmarked Version',
    createdAt: '2026-10-05',
    modifiedAt: '2026-10-05',
    description: 'Someone forgot the field.',
  },
]

function renderPicker() {
  return render(
    <DashboardVersionsPanel
      open
      onClose={() => {}}
      activeVersionId="finished"
      defaultVersionId="finished"
      onSelectVersion={() => {}}
      onSetDefault={() => {}}
      versions={ITEMS}
      hideSetDefault
    />,
  )
}

afterEach(cleanup)

describe('the design site’s picker', () => {
  it('lists every version, finished or not', () => {
    /* It is the designers' site; hiding work from them is the opposite of what
       this field is for. */
    renderPicker()
    for (const label of ['Finished Version', 'Half Built Version', 'Unmarked Version']) {
      expect(screen.getByText(label)).toBeTruthy()
    }
  })

  it('marks the ones a stakeholder cannot pick', () => {
    /* ⚠ THE SILENT HALF. Without this a designer reads a list of five versions
       with no way to know which two the demo site drops — and the omission
       looks exactly like a complete list. */
    renderPicker()
    expect(screen.getAllByText('Design site only')).toHaveLength(2)
  })

  it('treats a MISSING maturity as design-site-only', () => {
    /* The field's own default, made visible. A version added without one is
       the common mistake, and it should look unfinished rather than finished. */
    renderPicker()
    const unmarked = screen.getByText('Unmarked Version').closest('button')!
    expect(unmarked.textContent).toContain('Design site only')
  })

  it('leaves the ready one unmarked', () => {
    renderPicker()
    const ready = screen.getByText('Finished Version').closest('button')!
    expect(ready.textContent).not.toContain('Design site only')
  })
})

describe('the shipped versions', () => {
  /* ⚠ THIS WAS "are all ready, so nothing is filtered or marked yet" UNTIL
     2026-10-05, AND IT FIRED EXACTLY AS IT WAS WRITTEN TO. Its note said "the
     day that stops being true is the day someone should notice here"; the
     Atlas merge was that day, and this is the noticing.

     Eric's two versions arrive REACHABLE but not `ready` — so the demo site
     filters them out and the design site badges them "Design site only". That
     is the gate working, not a defect: `maturity` is absent rather than an
     explicit `wip`, which says "not decided yet" rather than "decided
     against", and the decision is `promote-to-prototype`'s `maturity`
     question, not a merge resolution.

     ⚠ DO NOT "FIX" THIS BY MARKING THEM READY. Making a version pickable by
     stakeholders is a readiness statement about someone's work; it is answered
     on the promotion, deliberately, by a person. If the answer comes back yes,
     this test flips to assert they are ready — and the one BELOW it is what
     keeps the two halves honest in the meantime. */
  it('are ready except the two that arrived unmarked from the Atlas merge', () => {
    const unmarked = DISCOVERABILITY_DASHBOARD_VERSIONS.filter((v) => v.maturity !== 'ready')
    expect(unmarked.map((v) => v.id)).toEqual([
      'discoverability-atlas-compass-nav',
      'eric-atlas-v1',
    ])
    /* The gate is now FILTERING, not merely armed — the demo site is short by
       exactly those two, and nothing else moved. */
    expect(dashboardVersionsForAudience(true)).toHaveLength(
      DISCOVERABILITY_DASHBOARD_VERSIONS.length - unmarked.length,
    )
    expect(dashboardVersionsForAudience(true).map((v) => v.id)).not.toContain('eric-atlas-v1')
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
