import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { PlatformSideNav } from '@/components/layout/PlatformSideNav'
import {
  AccountProvider,
  accessForTier,
  avatarTierFor,
  defaultMemberTier,
  memberTiersFor,
  supportsMembership,
  tierLabelFor,
  type Brand,
} from '@/context/AccountContext'
import { DEMO_PERSONAS, personasForBrand } from '@/components/prototype/demoControlsUtil'
import { licensedProfessionsFor } from '@/data/licensedStatesFixtures'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  defaultDiscoverabilityVersionFor,
} from '@/data/dashboardVersions'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { MotivationProvider } from '@/context/MotivationContext'

/**
 * XCEL sells no consumer membership. This file exists because the obvious
 * shortcut for that — pinning the brand to `tier: 'non-member'` — is wrong in
 * four separate, individually plausible-looking ways, and because the
 * suppression is spread across the rail, the shell, the badges and the demo
 * bar. Each assertion below is paired with the SAME assertion inverted for
 * Elite, so the test fails if the gate ever widens to a brand that does sell a
 * membership.
 *
 * See `supportsMembership()` in AccountContext for the reasoning.
 */

const ALL_BRANDS: Brand[] = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel']

function seedAccount(brand: Brand) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, tier: defaultMemberTier(brand) }))
}

function renderRail(brand: Brand) {
  seedAccount(brand)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <MotivationProvider>
            <PlatformSideNav active="dashboard" onSelect={() => {}} />
          </MotivationProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('XCEL — a brand with no membership', () => {
  it('defaults to the Learner Focused dashboard, and only XCEL does', () => {
    // XCEL sells a licence, not a membership, so there is no upsell for a
    // marketing carousel to carry — its learners arrive with a booked exam date
    // and a Study Plan, which is what the Learner Focused band leads with.
    //
    // PlatformShell's `?version=` fallback and the picker's "Default" pill both
    // read this, so the pill can't mark a layout the page doesn't open.
    expect(defaultDiscoverabilityVersionFor('xcel')).toBe('discoverability-learner-focused')
    for (const brand of ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc'] as Brand[]) {
      expect(defaultDiscoverabilityVersionFor(brand)).toBe('discoverability-marketing-focused')
    }
    // Whatever it returns has to BE a real option in the picker, or the
    // "Default" pill attaches to nothing.
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    for (const brand of ALL_BRANDS)
      expect(ids).toContain(defaultDiscoverabilityVersionFor(brand))
  })

  it('is the only brand `supportsMembership` excludes', () => {
    expect(ALL_BRANDS.filter((b) => !supportsMembership(b))).toEqual(['xcel'])
  })

  it('has exactly one member tier, so `accessForTier` is `full` — nothing gated', () => {
    // This is the property that keeps every Passport-gated surface open rather
    // than dimmed: the brand's single tier IS its highest tier. A second tier
    // would silently flip access to `lite` and start showing "Unlock with
    // Passport" chips on a brand that has no Passport.
    expect(memberTiersFor('xcel')).toHaveLength(1)
    expect(accessForTier('xcel', defaultMemberTier('xcel'))).toBe('full')
    // …and the brand is never modelled as a non-member, which would return
    // 'non-member' here and light up the whole upsell surface.
    expect(defaultMemberTier('xcel')).not.toBe('non-member')
  })

  it('resolves NO tier label and NO avatar tier ring', () => {
    expect(tierLabelFor('xcel', defaultMemberTier('xcel'))).toBeNull()
    expect(avatarTierFor('xcel', defaultMemberTier('xcel'))).toBe('default')
    // Inverse: Elite, which does sell one, still resolves both.
    expect(tierLabelFor('elite', defaultMemberTier('elite'))).toBe('Passport Lite')
    expect(avatarTierFor('elite', defaultMemberTier('elite'))).toBe('plus')
  })

  it('renders no membership pill and no "Non-Member" text in the rail', () => {
    renderRail('xcel')
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    // The greeting still renders — only the membership block is suppressed.
    expect(
      within(rail).getByText(
        (_, el) => el?.tagName === 'SPAN' && /welcome back, alicia navarro/i.test(el.textContent ?? ''),
      ),
    ).toBeInTheDocument()
    // The "Membership" eyebrow above the tier pill. Scoped to the <p> so it
    // can't accidentally match the rail ITEM of the same name (which is also
    // gone for XCEL, and asserted separately below).
    expect(within(rail).queryByText('Membership', { selector: 'p' })).toBeNull()
    // "Non-Member" is the specific wrong outcome: suppressed, not downgraded.
    expect(within(rail).queryByText(/non-member/i)).toBeNull()
    expect(within(rail).queryByRole('button', { name: /membership plans/i })).toBeNull()
  })

  it('renders the membership pill for Elite in the same harness', () => {
    // The inverse of the test above — proves the assertions are actually
    // capable of failing rather than matching nothing on both brands.
    renderRail('elite')
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(rail).getByText('Membership', { selector: 'p' })).toBeInTheDocument()
    expect(within(rail).getByText('Passport Lite')).toBeInTheDocument()
  })

  it('drops the Membership and Partner Offers rail items, and keeps the two XCEL needs', () => {
    renderRail('xcel')
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(rail).queryByRole('button', { name: 'Membership' })).toBeNull()
    expect(within(rail).queryByRole('button', { name: 'Partner Offers' })).toBeNull()
    // Exam & Cert Prep is XCEL's CORE PRODUCT (the 3-Part Training Program) and
    // Rubi is a headline feature — hiding them with the same boolean as Partner
    // Offers is the shortcut this brand must not take.
    expect(within(rail).getByRole('button', { name: 'Exam & Cert Prep' })).toBeInTheDocument()
    expect(within(rail).getByRole('button', { name: 'AI Study Partner' })).toBeInTheDocument()
    // …and it must NOT read "Career Tools", which is Elite's framing of Rubi.
    expect(within(rail).queryByRole('button', { name: 'Career Tools' })).toBeNull()
  })

  it('offers every demo persona except the one about memberships', () => {
    // A persona with nothing to demonstrate is worse than an absent one: the
    // membership-count row would apply a flag nothing reads and leave the
    // dashboard unchanged, which reads as a broken control.
    const xcel = personasForBrand('xcel').map((p) => p.id)
    const elite = personasForBrand('elite').map((p) => p.id)
    expect(elite).toContain('multi-membership')
    expect(xcel).not.toContain('multi-membership')
    expect(xcel).toEqual(elite.filter((id) => id !== 'multi-membership'))
  })

  it('resolves persona professions from the ACTIVE brand, not hardcoded slugs', () => {
    // Every persona used to carry `profs: ['nursing', …]`, which matched
    // nothing off Elite — the persona then wrote another brand's slugs into the
    // share URL and selected no professions. `profScope` is resolved per brand
    // at apply time, so the personas must only ever declare the SCOPE.
    for (const p of DEMO_PERSONAS) {
      expect(['primary', 'all']).toContain(p.profScope)
    }
    // XCEL's professions come from its LICENCES — it has no membership records,
    // which is where every other brand's come from.
    expect(licensedProfessionsFor('xcel')).toEqual([
      'Life & Health',
      'Property & Casualty',
      'Personal Lines',
    ])
  })

  it('keeps Membership, Partner Offers and the "Career Tools" label for Elite', () => {
    renderRail('elite')
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(rail).getByRole('button', { name: 'Membership' })).toBeInTheDocument()
    expect(within(rail).getByRole('button', { name: 'Partner Offers' })).toBeInTheDocument()
    expect(within(rail).getByRole('button', { name: 'Career Tools' })).toBeInTheDocument()
  })
})
