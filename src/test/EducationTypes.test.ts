import { describe, it, expect } from 'vitest'
import {
  educationTypesFor,
  goalOptionsFor,
  licenseTypesFor,
  setupInterestCoursesFor,
  type EducationType } from '@/data/onboarding/onboardingContent'
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

const ALL_BRANDS: Brand[] = ['xcel']
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

})
