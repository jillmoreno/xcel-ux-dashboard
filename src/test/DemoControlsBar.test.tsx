import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { personasForBrand } from '@/components/prototype/demoControlsUtil'
import { DASHBOARD_PROGRESS_PICKER } from '@/data/dashboardProgressFixtures'
import { AccountProvider } from '@/context/AccountContext'
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
          <DemoControlsBar />
          <UrlProbe />
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
    fireEvent.click(screen.getByRole('button', { name: /Progress/i }))
    fireEvent.click(screen.getByRole('radio', { name: /At Risk/i }))
    const search = url()
    expect(search).toContain('prog=progress-at-risk')
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

describe('DemoControlsBar — an axis with nowhere to land', () => {
  /* Both pacing versions drop the Readiness rail row, and Testing is the brand
     default — so the bar's DEFAULT state used to be a pill reading
     "Readiness: On Track" over a dashboard with no Readiness on it and no way
     to reach one. The control is inert there and live everywhere else. */
  const readinessPill = () => screen.getByRole('button', { name: /Readiness/ })

  it('is inert on the versions that hide the section', () => {
    renderBar('/dashboard-rebrand?version=discoverability-testing')
    const pill = readinessPill()
    expect(pill).toBeDisabled()
    // …and it does NOT keep stating a state it cannot produce.
    expect(pill.textContent).not.toContain('On Track')
    expect(pill.title).toContain('hides the Readiness section')
    // Disabled means disabled: no panel, however it is clicked.
    fireEvent.click(pill)
    expect(screen.queryByRole('radiogroup', { name: 'Readiness state' })).toBeNull()
  })

  it('is inert on Testing 2 as well, because the rail rule covers both', () => {
    /* The assertion that would catch someone re-listing the versions in the bar
       instead of asking `railHidesSection` — Testing 2 was added to the rail
       trim later, and a hand-written copy of the rule is exactly what would
       have been updated in one place and not the other. */
    renderBar('/dashboard-rebrand?version=discoverability-testing-2')
    expect(readinessPill()).toBeDisabled()
  })

  it('stays live where the section is a rail click away', () => {
    renderBar('/dashboard-rebrand?version=discoverability-qe-focused')
    const pill = readinessPill()
    expect(pill).not.toBeDisabled()
    expect(pill.textContent).toContain('On Track')
    fireEvent.click(pill)
    expect(screen.getByRole('radiogroup', { name: 'Readiness state' })).toBeTruthy()
  })
})

describe('DemoControlsBar — a state with no agreed design', () => {
  /* Expired is withheld 2026-09-22: the flag and the fixtures both resolve it,
     so picking it renders SOMETHING — just not a screen anyone has agreed on. */
  const openProgress = () => {
    fireEvent.click(screen.getByRole('button', { name: /Progress/ }))
    return screen.getByRole('radiogroup', { name: 'Progress / compliance state' })
  }

  it('offers Expired but refuses to apply it', () => {
    renderBar()
    const row = within(openProgress()).getByRole('radio', { name: /Expired/ })
    expect(row.getAttribute('aria-disabled')).toBe('true')
    // The row says why, in the row — not only in a mouse-only tooltip.
    expect(row.textContent).toContain('Not designed yet')
    fireEvent.click(row)
    // …and the click changed nothing: no `?prog=`, panel still open.
    expect(url()).not.toContain('progress-expired')
    expect(screen.getByRole('radiogroup', { name: 'Progress / compliance state' })).toBeTruthy()
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
