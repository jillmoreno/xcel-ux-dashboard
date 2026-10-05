import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { personasForBrand } from '@/components/prototype/demoControlsUtil'
import { DASHBOARD_PROGRESS_PICKER } from '@/data/dashboardProgressFixtures'
import { AccountProvider } from '@/context/AccountContext'
import { DashboardVersionsPanelProvider } from '@/components/dashboard/DashboardVersionsPanelContext'
import { FeatureFlagPanelProvider } from '@/components/account/FeatureFlagPanelContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'

// The bar is Elite-scoped (the rebrand's seeded brand) — seed the account so
// the profession fixture (Nursing / OT / PT) is populated and Brand starts on
// Elite.
function seedElite() {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'non-member' }))
}

/** Renders the bar's live URL search string so tests can assert the state the
 *  bar writes (tier / prof / prog) — the bar has no standalone tier readout. */
function UrlProbe() {
  const { search } = useLocation()
  return <div data-testid="url-search">{search}</div>
}

function renderBar(path = '/dashboard-rebrand') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <FeatureFlagProvider>
          {/* ⚠ REQUIRED SINCE 2026-10-05. The bar's Dashboard Version control
              calls `useDashboardVersionsPanel`, which throws without this —
              `AppLayout` provides it in the app, so the harness has to as
              well or it is testing a shell the product never renders. */}
                    {/* ⚠ AND `FeatureFlagPanelProvider` SINCE 2026-10-05 — the bar's
              flag icon calls `useFeatureFlagPanel`, which throws without it.
              Same shape as the versions provider above: `AppLayout` supplies
              both in the app. */}
          <FeatureFlagPanelProvider>
<DashboardVersionsPanelProvider>
          {/* ⚠ THE TRIMMED CONTROLS, OPTED BACK IN. This branch's bar does not
              draw Persona / Readiness / Education (see `SHOW_CONTROL` in
              DemoControlsBar), but they are hidden, not retired — so the suite
              that covers them keeps rendering them. Take this prop out only
              when the controls themselves go.

              ⚠ `pacing` CAME OUT OF THIS LIST ON 2026-10-05 and could not stay:
              it is no longer a `ControlKey` at all. The Pacing dropdown left
              the bar for the Feature Flag panel, so there is nothing here to
              opt back in — `study-pace-preset` is unchanged and still drives
              the card, it is just configured somewhere else now. */}
          <DemoControlsBar
            controls={{ persona: true, readiness: true, education: true }}
          />
          <UrlProbe />
          </DashboardVersionsPanelProvider>
</FeatureFlagPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const url = () => screen.getByTestId('url-search').textContent ?? ''

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  seedElite()
})

describe('DemoControlsBar — scope gate', () => {
  it('renders on /dashboard-rebrand', () => {
    renderBar()
    expect(screen.getByRole('region', { name: /demo controls/i })).toBeInTheDocument()
    expect(screen.getByText('Demo Controls')).toBeInTheDocument()
  })

  it('returns null on every other route', () => {
    renderBar('/dashboard')
    // The bar renders nothing off `/dashboard-rebrand` (the UrlProbe sibling is
    // test-only scaffolding, so assert on the bar's own region/label instead of
    // raw container emptiness).
    expect(screen.queryByRole('region', { name: /demo controls/i })).toBeNull()
    expect(screen.queryByText('Demo Controls')).toBeNull()
  })
})

describe('DemoControlsBar — Brand dropdown', () => {
  it('is not rendered at all while the repo ships a single brand', () => {
    // The dropdown used to list five. `BRAND_PICKER` in DemoControlsBar hides
    // it below two entries, because a menu holding one item invites a reviewer
    // to open it looking for the others. Asserted rather than assumed so that
    // re-widening `Brand` without restoring the control fails here.
    renderBar()
    expect(screen.getByRole('region', { name: /demo controls/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Brand/i })).toBeNull()
  })
})

describe('DemoControlsBar — Atlas brand skin', () => {
  // The Atlas/Compass version gets its own Brand control (2026-09-29): it
  // re-skins the Atlas pages as McKissock, CRE or Elite and writes ?skin=,
  // while `Brand` stays XCEL. See atlasBrandSkin.ts.
  const ATLAS = '/dashboard-rebrand?version=discoverability-atlas-compass-nav'

  /* ⚠ THREE TESTS WENT FROM THIS BLOCK ON 2026-10-05 — the Brand skin, the
     Headings font and the Nav Version dropdowns. They pinned three DESIGN
     controls that were sitting on the DEMO bar, and the merge moved them off
     it; a test asserting a dropdown nobody draws is not a regression guard, it
     is a second place to forget.

     ⚠ WHAT WENT IS THE DROPDOWN, NOT THE CAPABILITY. `?skin=`, `?fonts=` and
     `?nav=` are still read by `atlasBrandSkin.ts`, `atlasFontSets.ts` and
     `atlasNavVersion.ts`, Reset still clears all three, and a pinned URL still
     renders. When they come back on `DesignControlsBar` as `surface: 'design'`
     flags, these three tests are the specification to write them from — the
     assertions are in git at the merge commit, and the default each one
     restores to (Global, DM Serif Display, Top Nav) is the part worth copying.

     THE TWO THAT STAYED are the negative ones below plus the Readiness hide:
     they assert the bar does NOT grow Atlas controls on other versions, which
     is still true and is the half that would fail silently. */

  it('hides the Readiness control on the Atlas version, which has no Readiness section', () => {
    renderBar(ATLAS)
    expect(screen.queryByRole('button', { name: /Readiness/ })).toBeNull()
  })

  it('stays off every other version', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: /Brand.*Global/ })).toBeNull()
  })

  it('offers no Nav Version off the Atlas version', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: /Top Nav/ })).toBeNull()
  })
})

describe('DemoControlsBar — Quick views tiers drive real state', () => {
  it('offers no tier quick views for a brand with no membership', () => {
    // These tests drove Elite's ladder (Non-member · Passport Lite · Passport)
    // and wrote ?tier=. XCEL has one tier whose label is never rendered, so the
    // switch is suppressed and there is no tier for a reviewer to pick. Restore
    // the original assertions alongside a brand that HAS a ladder.
    renderBar()
    expect(screen.queryByRole('button', { name: /quick view/i })).toBeNull()
  })
})

describe('DemoControlsBar — persona dropdown', () => {
  it('is numbered 1..N, leads with the not-started view, and includes a "License expired" persona', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    const menu = screen.getByRole('menu', { name: /user personas/i })
    const items = within(menu).getAllByRole('menuitem')
    // The two former What's New personas are now the top-of-dropdown toggle, so
    // the list leads with the progress journey (Up Next first).
    //
    // COUNTED from `personasForBrand`, not hardcoded. It was a literal 7, which
    // made every persona added to the list a failing test with nothing to say —
    // the size was never the subject. What IS the subject is that the dropdown
    // renders the brand's list and drops "Multiple memberships" for a brand
    // with no membership, both asserted below. Same reasoning as
    // `flagScopeForPath` being exported so its scope can be counted.
    expect(items).toHaveLength(personasForBrand('xcel').length)
    expect(items[0]).toHaveTextContent(/^1Up Next/)
    expect(within(menu).getByRole('menuitem', { name: /License expired/i })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: /Multiple memberships/i })).toBeNull()
  })

  it('has NO Featured / What\'s New switch — it was removed with its flag', () => {
    // The "Hide Featured Section" switch wrote `dashboard-featured`, removed from
    // the catalog 2026-09-16 (the XCEL flag audit). `whatsNewFeaturedFor('xcel')`
    // is an empty fixture, so `FeaturedHero` self-hides whatever the flag said —
    // the switch showed and hid nothing. Asserted as an ABSENCE so re-adding the
    // control without first authoring XCEL slides fails here and gets re-decided.
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    expect(screen.queryByRole('switch', { name: /hide featured/i })).toBeNull()
    expect(screen.queryByRole('switch', { name: /what's new/i })).toBeNull()
  })

  it('leaves every persona row enabled (the carousel-room gate was retired with the archived Marketing Focused band)', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    expect(screen.getByRole('menuitem', { name: /No learning paths \(brand\)/i })).not.toBeDisabled()
  })

  it('the "License expired" persona no longer applies — the state is withheld', () => {
    /* CHANGED 2026-09-22. This asserted the persona WROTE `?prog=progress-expired`,
       and it was right until Expired was withheld for having no agreed design.
       Inverted rather than deleted: the row is still in the list, and the thing
       worth pinning is that clicking it now changes nothing. Restoring the
       state means dropping `unavailable` from the persona AND from
       `DASHBOARD_PROGRESS_PICKER`, at which point this flips back. */
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    const row = screen.getByRole('menuitem', { name: /License expired/i })
    expect(row).toBeDisabled()
    fireEvent.click(row)
    expect(url()).not.toContain('prog=progress-expired')
  })
})

describe('DemoControlsBar — Progress / Education with a non-member account', () => {
  it('applies a Progress state to a non-member WITHOUT promoting to a member tier (the compliance persona is decoupled from membership)', () => {
    // The compliance persona now drives the dashboard for members AND
    // non-members (personaEnabled = showExtras in MembershipOverview), so
    // picking a Progress state no longer force-promotes the account to a member
    // tier — it just writes ?prog=, leaving the non-member account intact.
    renderBar()
    /* ⚠ NOT STARTED, not At Risk — 2026-09-23, when the picker was cut to two
       rows. The claim here was never about WHICH state: it is that picking one
       writes `?prog=` and leaves a non-member account alone.

       ⚠ IT HAS TO BE THE NON-DEFAULT ONE, which is the trap a first rewrite
       walked into. The bar CLEARS `?prog=` when the chosen state is already
       the default — the same behaviour Reset relies on two tests below — so
       picking On Track wrote an empty URL and the assertion failed against
       nothing. Of the two rows left, `not-started` is the one that is not the
       default. */
    fireEvent.click(screen.getByRole('button', { name: /Progress/i }))
    fireEvent.click(screen.getByRole('radio', { name: /Not Started/i }))
    const search = url()
    expect(search).toContain('prog=not-started')
    expect(search).not.toContain('tier=low')
  })

  it('Reset restores the demo member baseline rather than stranding the reviewer on non-member', () => {
    // The baseline was Elite's `low` (Passport Lite). XCEL has exactly one
    // tier, keyed `high` — the point of Reset is unchanged: land on a member
    // tier, never on non-member.
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }))
    const search = url()
    expect(search).toContain('tier=high')
    expect(search).not.toContain('tier=non-member')
    // prog/edu cleared back to their defaults.
    expect(search).not.toContain('prog=')
    expect(search).not.toContain('edu=')
  })
})

describe('DemoControlsBar — persona dropdown', () => {
  it('the "Multiple learning paths" persona expands a count sub-menu, then applies all three professions on count pick (writes ?prof=)', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    // Clicking the persona row now EXPANDS its nested count sub-list rather than
    // applying immediately — nothing is written yet.
    fireEvent.click(screen.getByRole('menuitem', { name: /Multiple learning paths/i }))
    expect(url()).not.toContain('prof=')
    // Picking a count applies the multi persona (professions + the chosen count).
    fireEvent.click(screen.getByRole('menuitem', { name: /10–12 paths/i }))
    const search = url()
    expect(search).toContain('prof=')
    // XCEL's professions are its lines of authority, not Elite's therapies.
    expect(search).toMatch(/life-health/)
  })
})

/**
 * ⚠ EVERY VARIANT CONTROL IS OPENED HERE, NOT JUST ASSERTED TO EXIST.
 *
 * Written 2026-10-05 from a defect that shipped: the Navigation control's pill
 * rendered, its radiogroup rendered, and the radiogroup was EMPTY —
 * `variantsForDemo` drops any arm whose maturity resolves to `wip`, and an
 * absent arm inherits the flag's, which was `wip`. Every test in this file
 * queried the PILL, so the suite was green and the only way to see it was to
 * click the control.
 *
 * So this walks the bar's variant pickers and asserts each one has options in
 * it. The failure it catches is generic — any flag-backed control whose arms
 * are filtered to nothing — which is why it is written against a list rather
 * than one control.
 */
describe('DemoControlsBar — a picker with nothing in it', () => {
  const PICKERS = [
    { pill: /Navigation/, panel: 'Navigation layout', least: 3 },
    { pill: /Progress/, panel: 'Progress / compliance state', least: 2 },
  ]

  for (const { pill, panel, least } of PICKERS) {
    it(`${panel} offers its arms rather than an empty radiogroup`, () => {
      renderBar()
      fireEvent.click(screen.getByRole('button', { name: pill }))
      const group = screen.getByRole('radiogroup', { name: panel })
      /* `within(...).getAllByRole` throws on none, which is the assertion —
         the count is the readable part. */
      expect(within(group).getAllByRole('radio').length).toBeGreaterThanOrEqual(least)
    })
  }

  it('lists all three navigation arms, Eric’s included', () => {
    /* ⚠ THE ONE PLACE THE UNIFICATION IS VISIBLE TO A STAKEHOLDER. Three arms
       spanning two implementations; if `expanding-top` ever stops appearing
       here, the merge of the two axes has come apart. */
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Navigation/ }))
    const group = screen.getByRole('radiogroup', { name: 'Navigation layout' })
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'Left nav',
      'Top nav',
      'Expanding top nav (Atlas)',
    ])
  })
})

describe('DemoControlsBar — an axis with nowhere to land', () => {
  /* Both pacing versions drop the Readiness rail row, and Testing is the brand
     default — so the bar's DEFAULT state used to be a pill reading
     "Readiness: On Track" over a dashboard with no Readiness on it and no way
     to reach one. It was a disabled pill there; since 2026-09-30 an empty
     control is HIDDEN, and stays live everywhere else. */
  const readinessPill = () => screen.queryByRole('button', { name: /Readiness/ })

  it('is hidden on the versions that hide the section', () => {
    renderBar('/dashboard-rebrand?version=discoverability-testing')
    expect(readinessPill()).toBeNull()
  })

  it('is hidden on Testing 2 as well, because the rail rule covers both', () => {
    /* The assertion that would catch someone re-listing the versions in the bar
       instead of asking `railHidesSection` — Testing 2 was added to the rail
       trim later, and a hand-written copy of the rule is exactly what would
       have been updated in one place and not the other. */
    renderBar('/dashboard-rebrand?version=discoverability-testing-2')
    expect(readinessPill()).toBeNull()
  })

  it('stays live where the section is a rail click away', () => {
    renderBar('/dashboard-rebrand?version=discoverability-qe-focused')
    const pill = readinessPill() as HTMLElement
    expect(pill).not.toBeDisabled()
    expect(pill.textContent).toContain('On Track')
    fireEvent.click(pill)
    expect(screen.getByRole('radiogroup', { name: 'Readiness state' })).toBeTruthy()
  })
})

describe('DemoControlsBar — a state with no agreed design', () => {
  /* Expired is withheld: the flag and the fixtures both resolve it, so picking
     it renders SOMETHING — just not a screen anyone has agreed on. */
  const openProgress = () => {
    fireEvent.click(screen.getByRole('button', { name: /Progress/ }))
    return screen.getByRole('radiogroup', { name: 'Progress / compliance state' })
  }

  it('does not offer Expired at all', () => {
    /*
     * ⚠ THIS TEST CHANGED SIDES ON 2026-09-23, and the change is the record of
     * a reversal rather than a test bending to code.
     *
     * It asserted the row was OFFERED-BUT-DISABLED, saying "Not designed yet"
     * in the row itself — the 2026-09-22 decision, argued on `unavailable`'s
     * own type: a stakeholder who asks "what about expired?" should see it
     * listed and pending, not absent, because deleting it reads as "we forgot".
     *
     * The picker was then cut to two rows by direct ask ("should ONLY include
     * the Not Started 0% and On Track 63%"), which takes Expired out of the
     * list entirely. The `unavailable` MECHANISM is untouched and still works
     * — nothing else uses it today, so re-adding the row is how it comes back.
     *
     * WHAT SURVIVES UNCHANGED is the claim underneath: the state is still
     * unreachable from the demo controls, by both doors. The test below pins
     * the persona one, and it did not need editing.
     */
    renderBar()
    expect(within(openProgress()).queryByRole('radio', { name: /Expired/ })).toBeNull()
    expect(url()).not.toContain('progress-expired')
  })

  it('offers exactly the two states the ask named, and no more', () => {
    /* The picker is a deliberately short menu now, so its LENGTH is a claim.
       Derived from the list rather than hard-coded, so re-adding a row updates
       both together — but a row appearing by accident still shows up here as a
       changed count in a test named for it. */
    renderBar()
    const rows = within(openProgress()).getAllByRole('radio')
    expect(rows.map((r) => r.textContent?.trim())).toEqual(
      DASHBOARD_PROGRESS_PICKER.map((o) => o.label),
    )
    expect(DASHBOARD_PROGRESS_PICKER.map((o) => o.variant)).toEqual([
      'not-started',
      'progress-on-track',
    ])
  })

  it('closes the OTHER door to the same state', () => {
    /* The assertion that matters. Greying a state in one picker settles
       nothing — the persona list reaches `dashboard-progress-state` too, so
       "License expired" would have left it one click away. */
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    expect(screen.getByRole('menuitem', { name: /License expired/i })).toBeDisabled()
  })

  it('keeps both doors in step, whichever state is withheld next', () => {
    /* Structural, not about Expired: every withheld picker state must have no
       live persona that applies it, and vice versa. This is what fails if
       someone withholds a state in one list and forgets the other. */
    const withheld = new Set(
      DASHBOARD_PROGRESS_PICKER.filter((o) => o.unavailable).map((o) => o.variant),
    )
    for (const persona of personasForBrand('xcel')) {
      const applies = persona.flags.some(
        (f) => f.key === 'dashboard-progress-state' && withheld.has(f.variant as never),
      )
      if (applies) expect(persona.unavailable).toBeTruthy()
    }
  })
})

/**
 * THE DASHBOARD VERSION CONTROL — 2026-10-05, the direct ask: "I want the
 * Dashboard version to have its OWN icon that lives in the Demo controls bar
 * and is accessible from demo and design hubs."
 *
 * ⚠ THE REACH IS THE POINT, not the pill. `PrototypeChrome` renders the robot
 * only when `!isPublicGateway()`, and the robot was the only route to the
 * version picker — so a stakeholder had no way to change versions at all. The
 * `ready` maturity below is what closes that, and it is the one assertion here
 * that would fail silently: a `wip` row would simply drop the control on the
 * demo site and leave the gap exactly where it was.
 */
describe('DemoControlsBar — the Dashboard Version control', () => {
  it('is READY, so the demo site offers it', async () => {
    const { controlMaturity } = await import('@/data/demoControlMaturity')
    expect(controlMaturity('version')).toBe('ready')
  })

  it('carries the version in its ACCESSIBLE NAME, having no visible one', () => {
    /* ⚠ THIS ASSERTION CHANGED SHAPE ON 2026-10-05 and the reason is the point.
       The control was a labelled pill leading the bar; it is now an icon button
       beside Reset, so the version is no longer readable without hovering or
       opening the sheet. `aria-label` and `title` are what is left carrying it
       — which means a screen-reader user and a mouse user can still read the
       current version, and a sighted stakeholder glancing at the bar cannot.
       That is the known cost of the move, and this test is where it is
       visible. */
    renderBar('/dashboard-rebrand?version=discoverability-testing')
    expect(
      screen.getByRole('button', { name: /Dashboard version:\s*Testing/i }),
    ).toBeTruthy()
  })

  it('falls back to the brand default when the url names no version', () => {
    /* ⚠ THE SAME RESOLUTION `PlatformShell` USES. Reading only `?version=`
       would leave the label blank on the landing screen — the common case — or
       worse, name a version other than the one rendering. */
    renderBar('/dashboard-rebrand')
    expect(
      screen.getByRole('button', { name: /Dashboard version:\s*Testing 3/i }),
    ).toBeTruthy()
  })
})

describe('which versions each audience is offered', () => {
  /* ⚠ THE PICKER IS GATED SEPARATELY FROM THE CONTROL. The control being
     `ready` does not mean every version it lists is — this is what keeps a
     half-built dashboard off the demo site once someone adds one. */
  it('gives the design site every version', async () => {
    const { dashboardVersionsForAudience, DISCOVERABILITY_DASHBOARD_VERSIONS } = await import(
      '@/data/dashboardVersions'
    )
    expect(dashboardVersionsForAudience(false)).toHaveLength(
      DISCOVERABILITY_DASHBOARD_VERSIONS.length,
    )
  })

  it('gives the demo site the READY ones only', async () => {
    const { dashboardVersionsForAudience } = await import('@/data/dashboardVersions')
    const demo = dashboardVersionsForAudience(true)
    expect(demo.every((v) => v.maturity === 'ready')).toBe(true)
    /* ⚠ ALL THREE ARE READY TODAY, so this filters nothing yet and the test
       would pass against a broken filter that returned everything. The
       assertion below is what makes it real — it fails the moment the two
       lists stop agreeing for the right reason. */
    const { DISCOVERABILITY_DASHBOARD_VERSIONS } = await import('@/data/dashboardVersions')
    expect(demo).toHaveLength(
      DISCOVERABILITY_DASHBOARD_VERSIONS.filter((v) => v.maturity === 'ready').length,
    )
  })

  it('drops a version with no maturity, failing CLOSED', async () => {
    /* The default that matters: a version added tomorrow with no `maturity` is
       invisible to stakeholders rather than leaking an unfinished dashboard to
       the people being asked to approve one. */
    const { dashboardVersionsForAudience } = await import('@/data/dashboardVersions')
    expect(dashboardVersionsForAudience(true).some((v) => v.maturity === undefined)).toBe(false)
  })
})
