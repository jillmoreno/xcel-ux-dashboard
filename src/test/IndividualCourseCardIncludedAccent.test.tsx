import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, it, expect } from 'vitest'
import { IndividualCourseCard } from '@/components/courses/IndividualCourseCard'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { eliteBundle } from '@/data/catalog/elite'

/**
 * The `catalog-included-tier-line` flag adds a 6px membership-tier accent along
 * the bottom of the card image for products the member is already entitled to.
 * We seed Elite · Passport Lite (low tier) and use a course with no Passport-only
 * gate, so it resolves to `included` for a Lite member.
 */
const includedCourse = eliteBundle.individualCourses.find((c) => !c.entitlement)!

function seedAccountEliteLite() {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', tier: 'low' }))
}

afterEach(() => {
  window.localStorage.clear()
})

function renderCard(flagOn: boolean) {
  seedAccountEliteLite()
  // `catalog-included-tier-line` defaults to ON, so the OFF case must set it
  // explicitly (relying on the default would leave the accent showing).
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'catalog-included-tier-line': { enabled: flagOn } }),
  )
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <IndividualCourseCard data={includedCourse} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('IndividualCourseCard — included-in-membership accent', () => {
  it('flag OFF: no accent / entitlement label', () => {
    renderCard(false)
    expect(screen.queryByText(/included with your/i)).toBeNull()
  })

  it('flag ON: renders the tier accent + a screen-reader entitlement label', () => {
    const { container } = renderCard(true)
    // Elite low → the accent names the Passport Lite tier.
    expect(screen.getByText(/included with your passport lite membership/i)).toBeInTheDocument()
    // A 6px tier-colored line is drawn along the bottom of the image.
    const line = [...container.querySelectorAll('span[aria-hidden="true"]')].find(
      (el) => (el as HTMLElement).style.height === '6px',
    ) as HTMLElement | undefined
    expect(line).toBeTruthy()
    expect(line!.style.background).toContain('--color-primary-500')
  })
})
