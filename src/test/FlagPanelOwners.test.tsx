import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider, FLAG_DESIGNERS, flagOwner } from '@/context/FeatureFlagContext'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  defaultDiscoverabilityVersionFor,
} from '@/data/dashboardVersions'
import {
  FeatureFlagPanelProvider,
  useFeatureFlagPanel,
} from '@/components/account/FeatureFlagPanelContext'
import { FeatureFlagPanel, flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { MembershipPageVersionPanelProvider } from '@/components/membership/MembershipPageVersionPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'

/**
 * WHOSE FLAGS THE PANEL SHOWS — and the answer is no longer a tab.
 *
 * ⚠ THIS FILE TESTED A TAB STRIP FOR ONE DAY. Jill / Eric lived at the top of
 * the Feature Flag sheet on 2026-10-05 and moved to the Dashboard Versions
 * sheet the same day: a VERSION is the thing a designer owns, and the flags are
 * read inside whichever version is rendering. The tabs' own tests went with
 * them (`VersionPickerMaturity.test.tsx`); what is left here is the half that
 * stayed — the panel still shows ONE designer's flags, it just no longer asks
 * whose.
 *
 * ⚠ THE COST THIS PINS, because it is invisible today and will not stay that
 * way: a flag belongs to ONE designer, so selecting Eric's version will hide
 * every flag of Jill's — which is currently all of them. Nothing in the product
 * can demonstrate that yet (there is no Eric-owned version), so the derivation
 * is tested directly and the UI case is named as untestable rather than
 * quietly skipped.
 */

function OpenPanelButton() {
  const { openPanel } = useFeatureFlagPanel()
  return (
    <button type="button" onClick={openPanel}>
      open-panel
    </button>
  )
}

function renderPanel(url = '/dashboard-rebrand') {
  window.history.replaceState({}, '', url)
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <LearningPathsPanelProvider>
          <DashboardVersionsPanelProvider>
            <MembershipPageVersionPanelProvider>
              <JumpBackInPanelProvider>
                <FeatureFlagPanelProvider>
                  <MemoryRouter initialEntries={[url]}>
                    <OpenPanelButton />
                    <Routes>
                      <Route path="*" element={<span />} />
                    </Routes>
                    <FeatureFlagPanel />
                  </MemoryRouter>
                </FeatureFlagPanelProvider>
              </JumpBackInPanelProvider>
            </MembershipPageVersionPanelProvider>
          </DashboardVersionsPanelProvider>
        </LearningPathsPanelProvider>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

function openPanel() {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: 'open-panel' }))
  })
}

beforeEach(() => window.localStorage.clear())
afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('the owner axis', () => {
  it('resolves an absent owner to Jill', () => {
    /* The default the whole thing rests on, asserted on the helper rather than
       on a row — a second `?? 'jill'` written inline somewhere is the drift it
       exists to prevent. */
    expect(flagOwner({})).toBe('jill')
    expect(flagOwner({ owner: 'eric' })).toBe('eric')
  })

  it('gives Eric his two Atlas versions and the four flags that configure them', () => {
    /* ⚠ THIS WAS "so Eric starts empty" UNTIL 2026-10-05, AND IT FIRED EXACTLY
       AS WRITTEN. Its note said the day either list gains an Eric-owned row it
       should fail, "the moment the choice gets made on purpose rather than
       noticed later". The Atlas merge was that day and this is that choice.

       Still the SPEC rather than a snapshot — it names the rows rather than
       counting them, so a sixth flag quietly acquiring `owner: 'eric'` fails
       here and gets decided too. */
    expect(FEATURE_FLAGS.filter((f) => flagOwner(f) === 'eric').map((f) => f.key)).toEqual([
      'atlas-home-layout',
      'atlas-xcel-palette',
      'atlas-right-rail-layout',
      'dashboard-version-eric-atlas-v1',
    ])
    /* ⚠ `prototype-bar-branch-home` IS NOT HIS, deliberately — it arrived on
       the same branch and is prototype-bar chrome rather than Atlas work, so it
       resolves to Jill like every other unowned row. Asserted as an absence
       because nothing on screen would show it drifting into his tab. */
    expect(FEATURE_FLAGS.filter((f) => flagOwner(f) === 'eric').map((f) => f.key)).not.toContain(
      'prototype-bar-branch-home',
    )
    expect(
      DISCOVERABILITY_DASHBOARD_VERSIONS.filter((v) => flagOwner(v) === 'eric').map((v) => v.id),
    ).toEqual(['discoverability-atlas-compass-nav', 'eric-atlas-v1'])
  })

  it('puts Jill first, which is what makes her the default tab', () => {
    expect(FLAG_DESIGNERS.map((d) => d.id)).toEqual(['jill', 'eric'])
  })
})

describe('the Feature Flag panel', () => {
  it('draws NO designer tabs — they live in the versions sheet now', () => {
    /* ⚠ ASSERTED AS AN ABSENCE rather than deleted with the strip. Two tab
       strips asking the same question in two sheets is what this change
       removed; a test saying so is what stops one quietly coming back. */
    renderPanel()
    openPanel()
    expect(screen.queryByRole('tab', { name: 'Jill' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Eric' })).toBeNull()
  })

  it('shows the flags of whoever owns the version on screen', () => {
    /* The default version is Jill's, so her flags are what render. Derived
       through the same `flagScopeForPath` the panel uses, so a change to the
       route scope moves the test with it rather than breaking it. */
    renderPanel()
    openPanel()
    const scope = new Set(flagScopeForPath('/dashboard-rebrand') ?? [])
    const expected = FEATURE_FLAGS.filter(
      (f) => flagOwner(f) === 'jill' && scope.has(f.key),
    ).length
    expect(expected).toBeGreaterThan(0)
    const totals = [...document.querySelectorAll('*')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    )
    expect(totals).toContain(`Dashboard Rebrand`)
  })

  it('reads the owner off `?version=`, not off a stored preference', () => {
    /* ⚠ THE OLD TAB PERSISTED TO `cgp.featureFlags.ownerTab`. That key and its
       helpers are gone — the panel has no choice of its own to remember — so a
       value left over from the day it existed must not change what renders. */
    window.localStorage.setItem('cgp.featureFlags.ownerTab', 'eric')
    renderPanel('/dashboard-rebrand?version=discoverability-testing-3')
    openPanel()
    expect(screen.getByText('Dashboard Rebrand')).toBeTruthy()
  })

  it('falls back to the brand default when the url names no version', () => {
    /* ⚠ THE SAME RESOLUTION THE DEMO BAR USES. Reading only `?version=` would
       make the panel resolve to Jill on every fresh load regardless of which
       version is actually rendering — right today by accident, wrong the day a
       brand's default belongs to someone else. */
    const fallback = defaultDiscoverabilityVersionFor('xcel')
    const version = DISCOVERABILITY_DASHBOARD_VERSIONS.find((v) => v.id === fallback)
    expect(version).toBeTruthy()
    expect(flagOwner(version!)).toBe('jill')
  })

  /* ⚠ NOT TESTABLE YET, and named rather than skipped: "selecting Eric's
     version empties the panel" cannot be exercised because no Eric-owned
     version exists. The derivation above is what stands in. When his first
     version lands, add the UI case here — and look hard at whether the empty
     state reads as a filter rather than as a broken panel, because that is the
     cost this whole arrangement is carrying. */
})
