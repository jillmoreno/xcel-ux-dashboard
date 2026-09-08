import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, useAccount, type Brand } from '@/context/AccountContext'
import {
  FeatureFlagProvider,
  FEATURE_FLAGS,
  NAV_SECTION_FLAGS,
  navSectionFlagKey,
} from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'
import { PlatformSideNav } from '@/components/layout/PlatformSideNav'

/**
 * The Navigation flag group — one toggle per left-nav item, so a reviewer can
 * trim the rail to the pages a conversation is about.
 *
 * The rule with teeth is HOME HAS NO TOGGLE. The rail is the only way back to
 * the dashboard from a section, so a reviewer who could hide Home would strand
 * themselves. That is expressed as absence from `NAV_SECTION_FLAGS` rather than
 * as a flag defaulting on — there is no toggle to find and no way to flip it —
 * and it is asserted here so a later "let's just add Home for completeness"
 * fails rather than shipping.
 */

function Seed({ brand }: { brand: Brand }) {
  const { brand: current, setAccount } = useAccount()
  useEffect(() => {
    if (current !== brand) setAccount(brand, 'member')
  }, [brand, current, setAccount])
  return null
}

function renderNav() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <Seed brand="xcel" />
          <PlatformSideNav active="dashboard" onSelect={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Seed flag state before mount, the way the panel persists it. */
function hide(...sections: string[]) {
  const state: Record<string, { enabled: boolean }> = {}
  for (const s of sections) state[navSectionFlagKey(s)] = { enabled: false }
  window.localStorage.setItem('cgp.featureFlags', JSON.stringify(state))
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('the Navigation flag group', () => {
  it('has no flag for Home, so it can never be hidden', () => {
    expect(NAV_SECTION_FLAGS.map((n) => n.section)).not.toContain('dashboard')
    expect(FEATURE_FLAGS.some((f) => f.key === navSectionFlagKey('dashboard'))).toBe(false)
  })

  it('defines a catalog flag for every listed section, defaulting ON', () => {
    for (const { section, label } of NAV_SECTION_FLAGS) {
      const def = FEATURE_FLAGS.find((f) => f.key === navSectionFlagKey(section))
      expect(def, `${section} has no catalog definition`).toBeTruthy()
      expect(def!.defaultEnabled, `${section} must default visible`).toBe(true)
      expect(def!.group).toBe('Navigation')
      expect(def!.label).toBe(label)
    }
  })

  it('offers every one of them on /dashboard-rebrand, where the rail lives', () => {
    // The panel filters to a route scope there, so a flag tagged to the page
    // but missing from the scope is invisible on the one route it governs —
    // which is how this would silently not work.
    const scope = flagScopeForPath('/dashboard-rebrand') ?? []
    for (const { section } of NAV_SECTION_FLAGS) {
      expect(scope, `${section} is not in the rebrand scope`).toContain(
        navSectionFlagKey(section),
      )
    }
  })

  it('shows every rail item by default', () => {
    renderNav()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'My Courses' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Podcasts' })).toBeInTheDocument()
  })

  it('hides an item when its flag is off, and keeps Home', () => {
    hide('courses', 'podcasts')
    renderNav()
    expect(screen.queryByRole('button', { name: 'My Courses' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Podcasts' })).toBeNull()
    // Untouched siblings stay.
    expect(screen.getByRole('button', { name: 'Certificates' })).toBeInTheDocument()
    // The one that cannot go.
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
  })

  it('drops a group caption once its last item is hidden', () => {
    // Support holds only "Get Help", so hiding it empties the group. An empty
    // subhead over nothing reads as a broken rail rather than a trimmed one.
    const first = renderNav()
    expect(screen.getByText('Support')).toBeInTheDocument()
    // Unmount before re-rendering: a second nav in the same document would
    // leave the first one's rows on screen and the assertions below would be
    // reading the wrong rail.
    first.unmount()

    window.localStorage.clear()
    hide('support')
    renderNav()
    expect(screen.queryByRole('button', { name: 'Get Help' })).toBeNull()
    expect(screen.queryByText('Support')).toBeNull()
    // My Learning still has Home, so its caption stays.
    expect(screen.getByText('My Learning')).toBeInTheDocument()
  })

  it('is an ADDITIONAL gate — it cannot reveal what the brand suppresses', () => {
    // `membership` and `m-more` are hidden for XCEL by brand capability
    // (`supportsMembership` / `hiddenBenefitSections`), not by a flag. They
    // deliberately have no toggle: one would be a control a reviewer can flip
    // with nothing happening.
    expect(NAV_SECTION_FLAGS.map((n) => n.section)).not.toContain('membership')
    expect(NAV_SECTION_FLAGS.map((n) => n.section)).not.toContain('m-more')
    renderNav()
    expect(screen.queryByRole('button', { name: 'Membership' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Partner Offers' })).toBeNull()
  })
})
