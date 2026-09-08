import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { AccountProvider, useAccount, type Brand, type Membership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CatalogPage } from '@/pages/CatalogPage'

// Effectful helper that flips the active brand / membership on mount.
// Used to drive the catalog into a target state without going through the
// Switch Account panel UI (we have a separate test for that flow).
function SetAccount({ brand, membership }: { brand: Brand; membership: Membership }) {
  const { setAccount } = useAccount()
  useEffect(() => {
    setAccount(brand, membership)
  }, [setAccount, brand, membership])
  return null
}

function renderWith(node: React.ReactNode = null) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          {node}
          <CatalogPage />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('MultiBrandCatalog', () => {
  beforeEach(() => {
    // Reset persisted account between tests so each starts at CRE / member.
    window.localStorage.clear()
    delete document.documentElement.dataset.brand
  })

  it('renders CRE-themed catalog by default (member) with no card-level membership tag', () => {
    renderWith()
    expect(screen.getByRole('heading', { level: 1, name: /course catalog/i })).toBeInTheDocument()
    // CRE Real-Estate filter label.
    expect(screen.getByRole('button', { name: /^profession/i })).toBeInTheDocument()
    // The card-level "Included with Membership" tag was removed — the
    // entitlement is surfaced in the detail panel now, not on catalog cards.
    expect(screen.queryByText(/included with membership/i)).not.toBeInTheDocument()
    // documentElement.dataset.brand is set.
    expect(document.documentElement.dataset.brand).toBe('cre')
  })

  it('switches to Elite (Non-Member) — relabels filters and drops the "Included with Membership" label', () => {
    renderWith(<SetAccount brand="elite" membership="non-member" />)

    // Healthcare hero copy.
    expect(screen.getByRole('heading', { level: 1, name: /nursing ce/i })).toBeInTheDocument()
    // Discipline filter (was "Profession" on CRE).
    expect(screen.getByRole('button', { name: /^discipline/i })).toBeInTheDocument()
    // Contact Hours (was "Credit Hours").
    expect(screen.getByRole('button', { name: /contact hours/i })).toBeInTheDocument()
    // Non-member → individual courses show price instead of the label.
    expect(screen.getAllByText(/^\$\d/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/included with membership/i)).not.toBeInTheDocument()
    // Brand attribute on <html> matches.
    expect(document.documentElement.dataset.brand).toBe('elite')
  })

  it('switches to STC — Exam / Study Hours / Format filter labels appear', () => {
    renderWith(<SetAccount brand="stc" membership="member" />)
    expect(screen.getByRole('heading', { level: 1, name: /exam prep/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^exam/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /study hours/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^format/i })).toBeInTheDocument()
    expect(document.documentElement.dataset.brand).toBe('stc')
  })

  it("breadcrumb root reflects the active brand's full name", () => {
    renderWith(<SetAccount brand="elite" membership="member" />)
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(breadcrumb).getByText(/elite learning/i)).toBeInTheDocument()
  })
})
