import { render, screen, cleanup } from '@testing-library/react'
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
  it('are all ready, so nothing is filtered or marked yet', () => {
    /* ⚠ STATED, NOT ASSUMED. The gate is armed rather than filtering, and the
       day that stops being true is the day someone should notice here. */
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS.every((v) => v.maturity === 'ready')).toBe(true)
    expect(dashboardVersionsForAudience(true)).toHaveLength(
      DISCOVERABILITY_DASHBOARD_VERSIONS.length,
    )
  })
})
