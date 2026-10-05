import { render, screen, act, fireEvent, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import {
  FeatureFlagProvider,
  FEATURE_FLAGS,
  FLAG_DESIGNERS,
  flagOwner,
} from '@/context/FeatureFlagContext'
import { DISCOVERABILITY_DASHBOARD_VERSIONS } from '@/data/dashboardVersions'
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
 * TWO DESIGNERS, TWO TABS — 2026-10-05, the direct ask: "there are 2 designers
 * working in this project… 2 filter tabs at the top, Jill and Eric. When Jill's
 * is selected, the existing Dashboard Version and flags will appear. Erics will
 * be empty for now until I promote things into it."
 *
 * ⚠ THE LOAD-BEARING ASSERTION IS THE DEFAULT, not the tabs. `owner` is absent
 * on every row in the catalog, so the whole feature rests on "absent means
 * Jill" — and if that default ever flips or is forgotten at a call site, the
 * symptom is that Jill's tab quietly empties out. Nothing throws, nothing
 * fails to render, and the panel looks like it lost its flags.
 *
 * ⚠ ERIC'S TAB BEING EMPTY IS THE SPEC, not an accident of today's data. The
 * test below says so out loud, so the day something IS promoted into it, this
 * is the line that has to be changed deliberately rather than discovered red.
 */

const OWNER_KEY = 'cgp.featureFlags.ownerTab'

function OpenPanelButton() {
  const { openPanel } = useFeatureFlagPanel()
  return (
    <button type="button" onClick={openPanel}>
      open-panel
    </button>
  )
}

/* ⚠ RENDERED AT `/dashboard-rebrand`, and it has to be: the Dashboard Version
   row is gated on `onRebrand`, so a harness on any other route asserts its
   absence for the wrong reason and would keep passing if the owner filter were
   deleted. The route also auto-selects the rebrand page, which is the real
   state — the robot opens this sheet from that screen. */
function renderPanel(url = '/dashboard-rebrand') {
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

const tab = (name: string) => screen.getByRole('tab', { name })

beforeEach(() => window.localStorage.clear())
afterEach(cleanup)

describe('the owner axis', () => {
  it('resolves an absent owner to Jill', () => {
    /* The default the whole feature rests on. Asserted on the helper rather
       than on a flag, because the helper is what every call site uses — a
       second `?? 'jill'` written inline somewhere is the drift it prevents. */
    expect(flagOwner({})).toBe('jill')
    expect(flagOwner({ owner: 'eric' })).toBe('eric')
  })

  it('leaves every catalog flag with Jill, so Eric starts empty', () => {
    /* ⚠ THIS IS THE SPEC, NOT A SNAPSHOT. "Eric's will be empty for now until
       I promote things into it" — so the day a flag carries `owner: 'eric'`,
       this line fails and SHOULD, as the moment that choice gets made on
       purpose rather than noticed later. */
    const eric = FEATURE_FLAGS.filter((f) => flagOwner(f) === 'eric')
    expect(eric.map((f) => f.key)).toEqual([])
  })

  it('leaves every dashboard version with Jill too', () => {
    /* Versions are per designer now, which is what lets Eric's tab drop the
       Dashboard Version row entirely rather than open an empty picker. */
    const eric = DISCOVERABILITY_DASHBOARD_VERSIONS.filter((v) => flagOwner(v) === 'eric')
    expect(eric.map((v) => v.id)).toEqual([])
  })

  it('puts Jill first, which is what makes her the default tab', () => {
    /* `readOwnerTab` falls back to `FLAG_DESIGNERS[0]`, so the order IS the
       default. Reversing this list would open the panel on an empty tab. */
    expect(FLAG_DESIGNERS.map((d) => d.id)).toEqual(['jill', 'eric'])
  })
})

describe('the tab strip', () => {
  it('offers both designers, opening on Jill', () => {
    renderPanel()
    openPanel()
    expect(tab('Jill').getAttribute('aria-selected')).toBe('true')
    expect(tab('Eric').getAttribute('aria-selected')).toBe('false')
  })

  it('shows the total beside the strip, not a count per pill', () => {
    /* CLAUDE.md's rule for every segmented filter in this app. A count inside
       each pill is the thing it forbids, so this asserts the shape as well as
       the number. */
    renderPanel()
    openPanel()
    /* ⚠ SCOPED, NOT THE WHOLE CATALOG — and getting this wrong first is what
       the comment is for. `/dashboard-rebrand` narrows the panel to that
       feature's flags, so the total beside the strip counts what is ON SCREEN
       (67), not every Jill-owned flag in the catalog (88). Derived through the
       same `flagScopeForPath` the panel uses, so a change to the scope moves
       the test with it — the shape `FeatureFlagPanel.test.tsx` already uses for
       its own count. */
    const scope = new Set(flagScopeForPath('/dashboard-rebrand') ?? [])
    const jillCount = FEATURE_FLAGS.filter(
      (f) => flagOwner(f) === 'jill' && scope.has(f.key),
    ).length
    expect(jillCount).toBeGreaterThan(0)
    /* ⚠ MATCHED ON NORMALISED `textContent`, not `getByText`. The total is
       authored as `{n}{' '}{word}`, so the span holds three text nodes and a
       string matcher misses it. */
    const totals = [...document.querySelectorAll('span')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    )
    expect(totals).toContain(`${jillCount} flags`)
    expect(tab('Jill').textContent).toBe('Jill')
    expect(tab('Eric').textContent).toBe('Eric')
  })

  it('no longer carries a Dashboard Version row at all', () => {
    /* ⚠ THIS TEST READ THE OTHER WAY ROUND FOR A DAY. The row was Jill's and
       this asserted she had it; on 2026-10-05 the version got its OWN control
       on the demo controls bar, and keeping the row would have put one
       destination in two places. Asserted as an ABSENCE rather than deleted,
       so the removal is stated somewhere rather than just gone. */
    renderPanel()
    openPanel()
    expect(screen.queryByText('Dashboard Version')).toBeNull()
  })
})

describe('Eric’s empty tab', () => {
  it('says nothing is in it yet, and how things get there', () => {
    /* ⚠ ITS OWN WORDS, NOT `ScopedEmptyState`'s. That one says "No flags apply
       to this feature" and sends the reader elsewhere; here nothing is wrong
       and there is nowhere else to go. Naming the `owner` key is what makes
       the state actionable rather than just reported. */
    renderPanel()
    openPanel()
    act(() => fireEvent.click(tab('Eric')))
    expect(screen.getByText(/Nothing in Eric’s tab yet/)).toBeTruthy()
    expect(screen.getByText(/owner: 'eric'/)).toBeTruthy()
    expect(screen.queryByText('No flags apply to this feature')).toBeNull()
  })

  it('shows no version row — nobody does now', () => {
    /* It used to be the thing that proved an empty owner's tab drops its
       version picker. The row left the panel entirely on 2026-10-05, so what
       is left to assert is that Eric's tab is not quietly growing one. The
       per-owner version filter it tested now lives on the BAR's picker; see
       `dashboardVersionsForAudience`. */
    renderPanel()
    openPanel()
    act(() => fireEvent.click(tab('Eric')))
    expect(screen.queryByText('Dashboard Version')).toBeNull()
  })

  it('reads zero flags', () => {
    renderPanel()
    openPanel()
    act(() => fireEvent.click(tab('Eric')))
    const totals = [...document.querySelectorAll('span')].map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    )
    expect(totals).toContain('0 flags')
  })
})

describe('what the tab remembers', () => {
  it('persists the choice under its own key', () => {
    /* ⚠ NOT INSIDE `cgp.featureFlags`. That store holds flag STATE and the
       Demo view suspends it; which tab you were last on is a view preference
       and should survive a demo session untouched. */
    renderPanel()
    openPanel()
    act(() => fireEvent.click(tab('Eric')))
    expect(window.localStorage.getItem(OWNER_KEY)).toBe('eric')
    expect(window.localStorage.getItem('cgp.featureFlags')).not.toMatch(/eric/)
  })

  it('reopens on the remembered tab', () => {
    window.localStorage.setItem(OWNER_KEY, 'eric')
    renderPanel()
    openPanel()
    expect(tab('Eric').getAttribute('aria-selected')).toBe('true')
  })

  it('falls back to Jill when the stored designer is unknown', () => {
    /* A designer removed from `FLAG_DESIGNERS` would otherwise select a tab
       that is not on screen — the panel renders empty with nothing
       highlighted, which looks like a load failure. */
    window.localStorage.setItem(OWNER_KEY, 'someone-who-left')
    renderPanel()
    openPanel()
    expect(tab('Jill').getAttribute('aria-selected')).toBe('true')
  })
})
