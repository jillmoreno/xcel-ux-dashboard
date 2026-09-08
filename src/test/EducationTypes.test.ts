import { describe, it, expect } from 'vitest'
import {
  dashboardEducationSupported,
  dashboardProgressPersonaFor,
} from '@/data/dashboardProgressFixtures'
import {
  defaultEducationType,
  educationTypesFor,
  goalOptionsFor,
  licenseTypesFor,
  setupInterestCoursesFor,
  type EducationType,
} from '@/data/onboarding/onboardingContent'
import type { Brand } from '@/context/AccountContext'

/**
 * `EducationType` went from two values to three on 2026-09-04 (`exam-prep`
 * added for XCEL, the first brand selling exam preparation as its own product).
 * Two properties have to hold across that widening, and neither is visible from
 * the type system:
 *
 *   1. Every brand's `exam-prep` content resolves to SOMETHING — the onboarding
 *      maps alias it to `qe`, and `profileFor` walks exam-prep → qe → ce.
 *      (Dashboard PERSONAS are the exception: Fitzgerald has none of any type,
 *      which predates this change and is asserted explicitly below.)
 *   2. The five existing brands behave EXACTLY as before, because their
 *      `exam-prep` arm is unreachable (they don't list the type) and their
 *      aliases are byte-identical to their `qe` content.
 */

const ALL_BRANDS: Brand[] = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel']
const ALL_TYPES: EducationType[] = ['qe', 'exam-prep', 'ce']

describe('EducationType — three values', () => {
  it('offers exam-prep as a selectable type on XCEL only', () => {
    for (const brand of ALL_BRANDS) {
      const types = educationTypesFor(brand).map((t) => t.type)
      if (brand === 'xcel') expect(types).toEqual(['qe', 'exam-prep', 'ce'])
      else expect(types).toEqual(['qe', 'ce'])
    }
  })

  it('aliases exam-prep to qe everywhere except XCEL, and does not on XCEL', () => {
    for (const brand of ALL_BRANDS) {
      const goalsAlias = goalOptionsFor(brand, 'exam-prep') === goalOptionsFor(brand, 'qe')
      const coursesAlias =
        setupInterestCoursesFor(brand, 'exam-prep') === setupInterestCoursesFor(brand, 'qe')
      if (brand === 'xcel') {
        expect(goalsAlias).toBe(false)
        expect(coursesAlias).toBe(false)
      } else {
        expect(goalsAlias).toBe(true)
        expect(coursesAlias).toBe(true)
      }
      // Licence types are aliased on EVERY brand including XCEL — you sit the
      // exam for the same line of authority you studied.
      expect(licenseTypesFor(brand, 'exam-prep')).toEqual(licenseTypesFor(brand, 'qe'))
    }
  })

  it('never leaves a brand without content for any education type', () => {
    for (const brand of ALL_BRANDS) {
      for (const type of ALL_TYPES) {
        expect(goalOptionsFor(brand, type).length).toBeGreaterThan(0)
        expect(licenseTypesFor(brand, type).length).toBeGreaterThan(0)
        expect(setupInterestCoursesFor(brand, type).length).toBeGreaterThan(0)
      }
    }
  })

  it('resolves a dashboard persona for every brand that HAS one, on every type', () => {
    // exam-prep → qe → ce. Fitzgerald is excluded because it has no dashboard
    // progress profile of ANY type — that is pre-existing and deliberate (the
    // dashboard falls back for it), and it is asserted separately below.
    const withProfiles = ALL_BRANDS.filter((b) => b !== 'fitzgerald')
    for (const brand of withProfiles) {
      for (const type of ALL_TYPES) {
        expect(dashboardProgressPersonaFor(brand, 'progress-on-track', type)).not.toBeNull()
      }
    }
  })

  it('leaves Fitzgerald with no persona on any type — the chain must not lend it one', () => {
    // The failure this guards against is the fallback resolving a MISSING brand
    // to some other brand's profile. It walks types, never brands, so a brand
    // with nothing authored gets null on all three rather than Elite's numbers
    // under a Fitzgerald heading.
    for (const type of ALL_TYPES) {
      expect(dashboardProgressPersonaFor('fitzgerald', 'progress-on-track', type)).toBeNull()
    }
  })

  it('gives XCEL a DISTINCT persona per type — the three are not one profile thrice', () => {
    const titles = ALL_TYPES.map(
      (t) => dashboardProgressPersonaFor('xcel', 'progress-on-track', t)?.path.title,
    )
    expect(new Set(titles).size).toBe(3)
    // Elite is the counter-case: it has `qe` + `ce` profiles but no `exam-prep`
    // one, so exam-prep falls back to qe and only TWO distinct personas exist.
    const elite = ALL_TYPES.map(
      (t) => dashboardProgressPersonaFor('elite', 'progress-on-track', t)?.path.title,
    )
    expect(new Set(elite).size).toBe(2)
  })

  it('shows the Education dropdown only where switching it changes something', () => {
    // Pinned per brand rather than re-derived, because the point of this
    // assertion is that the FIVE EXISTING BRANDS' answers did not move when
    // `EducationType` widened. Fitzgerald is the one that matters: it lists two
    // types but has no progress profile of either, so a "more than one type"
    // definition would have switched its dropdown on as a dead control.
    expect(ALL_BRANDS.filter(dashboardEducationSupported)).toEqual([
      'cre',
      'mckissock',
      'elite',
      'stc',
      'xcel',
    ])
  })

  it('defaults XCEL and STC to their flagship journey, everyone else to CE', () => {
    expect(defaultEducationType('xcel')).toBe('qe')
    expect(defaultEducationType('stc')).toBe('qe')
    for (const brand of ['cre', 'mckissock', 'elite', 'fitzgerald'] as Brand[]) {
      expect(defaultEducationType(brand)).toBe('ce')
    }
  })
})
