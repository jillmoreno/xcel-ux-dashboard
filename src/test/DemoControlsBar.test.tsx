import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
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
    // the list leads with the progress journey (Up Next first). SEVEN rows for
    // XCEL, where the LMS had eight: "Multiple memberships" is dropped, because
    // a brand with no membership cannot hold several. `XcelNoMembership`
    // asserts that exclusion directly; this is the count that follows from it.
    expect(items).toHaveLength(7)
    expect(items[0]).toHaveTextContent(/^1Up Next/)
    expect(within(menu).getByRole('menuitem', { name: /License expired/i })).toBeInTheDocument()
    expect(within(menu).queryByRole('menuitem', { name: /Multiple memberships/i })).toBeNull()
  })

  it('exposes a What\'s New toggle at the top of the dropdown, default Off', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    const sw = screen.getByRole('switch', { name: /hide featured/i })
    expect(sw).toHaveAttribute('aria-checked', 'false')
    // Turning it On writes ?wn=on. Since the Marketing Focused carousel band was
    // archived, the toggle now only shows/hides the Featured hero — it no longer
    // pins a dashboard version.
    fireEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'true')
    const search = url()
    expect(search).toContain('wn=on')
    expect(search).not.toContain('version=')
  })

  it('does NOT disable any persona row when What\'s New is On (the carousel-room gate was retired with the archived Marketing Focused band)', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    // Off: the "No learning paths (brand)" row is enabled.
    expect(screen.getByRole('menuitem', { name: /No learning paths \(brand\)/i })).not.toBeDisabled()
    // Turn What's New On → the row STAYS enabled (the toggle only hides the
    // Featured hero now; it no longer needs to make room for a carousel).
    fireEvent.click(screen.getByRole('switch', { name: /hide featured/i }))
    expect(screen.getByRole('menuitem', { name: /No learning paths \(brand\)/i })).not.toBeDisabled()
  })

  it('the "License expired" persona sets the progress state to expired (writes ?prog=progress-expired)', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /License expired/i }))
    expect(url()).toContain('prog=progress-expired')
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
