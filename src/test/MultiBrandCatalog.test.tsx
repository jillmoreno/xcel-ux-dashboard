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

  it("breadcrumb root reflects the active brand's full name", () => {
    renderWith(<SetAccount brand="xcel" membership="member" />)
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(within(breadcrumb).getByText(/elite learning/i)).toBeInTheDocument()
  })
})
