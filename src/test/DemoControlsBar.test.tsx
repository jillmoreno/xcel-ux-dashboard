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
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', tier: 'non-member' }))
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
  it('lists all five brands and reflects the seeded brand', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Brand/i }))
    const group = screen.getByRole('radiogroup', { name: /^Brand$/i })
    for (const name of [/Real Estate/, /McKissock/, /Elite \(Health\)/, /STC \(FinServ\)/, /Fitzgerald/]) {
      expect(within(group).getByRole('radio', { name })).toBeInTheDocument()
    }
    expect(within(group).getByRole('radio', { name: /Elite \(Health\)/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('switching brand updates the trigger label', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Brand/i }))
    fireEvent.click(screen.getByRole('radio', { name: /STC \(FinServ\)/ }))
    // The Brand trigger now reads the newly selected brand.
    expect(screen.getByRole('button', { name: /Brand.*STC \(FinServ\)/i })).toBeInTheDocument()
  })
})

describe('DemoControlsBar — Quick views tiers drive real state', () => {
  it('the "Passport" tier quick view sets the tier (writes ?tier=high)', () => {
    renderBar()
    // Trigger reads the current tier ("Quick view: Non-Member" on the seed).
    fireEvent.click(screen.getByRole('button', { name: /quick view/i }))
    // Rows are the brand's tiers as radios; the Elite high tier is "Passport"
    // (its short chip is also "Passport" → "Passport Passport"), distinct from
    // the low "Passport Lite" row.
    fireEvent.click(screen.getByRole('radio', { name: /passport\s+passport/i }))
    expect(url()).toContain('tier=high')
  })

  it('lists the active brand tiers (Non-member + Passport Lite + Passport for Elite)', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /quick view/i }))
    const group = screen.getByRole('radiogroup', { name: /membership tier/i })
    expect(within(group).getByRole('radio', { name: /non-member/i })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /passport lite/i })).toBeInTheDocument()
    expect(within(group).getByRole('radio', { name: /passport\s+passport/i })).toBeInTheDocument()
  })
})

describe('DemoControlsBar — persona dropdown', () => {
  it('is numbered 1..N, leads with the not-started view, and includes a "License expired" persona', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Persona/i }))
    const menu = screen.getByRole('menu', { name: /user personas/i })
    const items = within(menu).getAllByRole('menuitem')
    // The two former What's New personas are now the top-of-dropdown toggle, so
    // the list leads with the progress journey (Up Next first). 8 rows: the
    // progress/compliance journey + empty/no-path edge cases + the two "scale"
    // expanders (Multiple learning paths, Multiple memberships) + Multiple
    // categories (QE).
    expect(items).toHaveLength(8)
    expect(items[0]).toHaveTextContent(/^1Up Next/)
    expect(within(menu).getByRole('menuitem', { name: /License expired/i })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Multiple memberships/i })).toBeInTheDocument()
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

  it('Reset restores the demo member baseline (tier=low) rather than stranding the reviewer on non-member', () => {
    renderBar()
    fireEvent.click(screen.getByRole('button', { name: /Reset/i }))
    const search = url()
    expect(search).toContain('tier=low')
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
    expect(search).toMatch(/nursing/)
    expect(search).toMatch(/occupational-therapy/)
    expect(search).toMatch(/physical-therapy/)
  })
})
