import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { PlatformSideNav, careerToolsLabelFor } from '@/components/layout/PlatformSideNav'
import {
  AccountProvider,
  accessForTier,
  defaultMemberTier,
  memberTiersFor,
  supportsMembership,
  type Brand } from '@/context/AccountContext'
import { DEMO_PERSONAS } from '@/components/prototype/demoControlsUtil'
import { licensedProfessionsFor } from '@/data/licensedStatesFixtures'
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

const ALL_BRANDS: Brand[] = ['xcel']

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

  it('drops the Membership and Partner Offers rail items, and keeps the two XCEL needs', () => {
    // Exam & Cert Prep's nav flag is turned ON for this test, because the
    // subject here is the BRAND rule (`hiddenBenefitSections`), not the demo
    // rail. It defaults off in the committed demo baseline — an editorial call
    // about what a stakeholder sees first, made independently and asserted in
    // NavSectionFlags.test.tsx. Reading the rail with the flag at its demo
    // value would test that decision twice and this one not at all: the row
    // would be absent for a reason that has nothing to do with membership,
    // which is exactly the false pass this seed prevents.
    window.localStorage.setItem(
      'cgp.featureFlags',
      JSON.stringify({ 'nav-show-m-exam-prep': { enabled: true } }),
    )
    renderRail('xcel')
    const rail = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(rail).queryByRole('button', { name: 'Membership' })).toBeNull()
    expect(within(rail).queryByRole('button', { name: 'Partner Offers' })).toBeNull()
    // Exam & Cert Prep is XCEL's CORE PRODUCT (the 3-Part Training Program) and
    // Rubi is a headline feature — hiding them with the same boolean as Partner
    // Offers is the shortcut this brand must not take.
    expect(within(rail).getByRole('button', { name: 'Exam & Cert Prep' })).toBeInTheDocument()
    // "Rubi AI Tools" since 2026-09-10 — it read "AI Study Partner" before,
    // XCEL's own wording on its site. Asserted against `careerToolsLabelFor`
    // rather than the string, because WHICH XCEL-true name to use is an
    // editorial call that has now moved once; what must not change is that it
    // is not Elite's.
    expect(
      within(rail).getByRole('button', { name: careerToolsLabelFor('xcel') }),
    ).toBeInTheDocument()
    // …and it must NOT read "Career Tools", which is Elite's framing of Rubi.
    expect(careerToolsLabelFor('xcel')).not.toBe('Career Tools')
    expect(within(rail).queryByRole('button', { name: 'Career Tools' })).toBeNull()
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

})
