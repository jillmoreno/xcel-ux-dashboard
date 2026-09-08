import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { CatalogPage } from '@/pages/CatalogPage'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { describe, it, expect } from 'vitest'

describe('CatalogPage', () => {
  it('renders sections and filter rail', () => {
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CatalogPage />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    // The h1 is the brand's `heroTitle` — XCEL's is "Insurance Training
    // Catalog", where the LMS default read "Course Catalog".
    expect(
      screen.getByRole('heading', { level: 1, name: /insurance training catalog/i }),
    ).toBeInTheDocument()
    // No Memberships section: XCEL's bundle sets `memberships: []` on purpose
    // — it is a transactional brand (course packages plus a B2B Partner Code
    // programme). Asserted as absence so re-adding memberships to the bundle
    // without deciding to fails here.
    expect(screen.queryByRole('heading', { level: 2, name: /^memberships$/i })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: /packages/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /individual courses/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
  })

  it('toggles a filter accordion', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CatalogPage />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const courseTypeButton = screen.getByRole('button', { name: /course type/i })
    expect(courseTypeButton).toHaveAttribute('aria-expanded', 'false')
    await user.click(courseTypeButton)
    expect(courseTypeButton).toHaveAttribute('aria-expanded', 'true')
  })
})
